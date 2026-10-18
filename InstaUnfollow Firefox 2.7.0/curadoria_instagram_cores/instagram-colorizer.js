'use strict';
(() => {
  if (window.__curadoriaColorizerLoaded) return;
  window.__curadoriaColorizerLoaded = true;

  const RESERVED = new Set([
    'accounts','about','explore','direct','p','reel','reels','stories','story','tv','web',
    'developer','challenge','oauth','api','privacy','terms','locations','audio','topics',
    'emails','blog','press','jobs','legal','directory','static','data'
  ]);
  const CLASS_BY_STATUS = {
    green: 'curadoria-follow-green',
    red: 'curadoria-follow-red',
    yellow: 'curadoria-follow-yellow'
  };
  const STATUS_CLASSES = Object.values(CLASS_BY_STATUS);
  const FOLLOWERS_RE = /^followers(?:_\d+)?\.json$/i;
  const FOLLOWING_RE = /^following(?:_\d+)?\.json$/i;
  const STORAGE_KEYS = [
    'compareUsers', 'compareMode', 'compareSource', 'compareFileNames', 'compareImportedAt',
    'compareFollowersCount', 'compareFollowingCount', 'compareResultCount', 'curadoriaPanelHidden'
  ];

  let comparisonUsers = new Set();
  let comparisonFileName = '';
  let comparisonImportedAt = 0;
  let loaded = false;
  let scanTimer = null;
  let panel = null;
  let toggleButton = null;
  let panelHidden = false;
  let lastSummary = '';
  let selectedFile = null;
  let busy = false;
  let customStatus = '';
  let customStatusType = '';
  let latestCounts = { green: 0, red: 0, yellow: 0 };

  const style = document.createElement('style');
  style.id = 'curadoria-instagram-colors-style';
  style.textContent = `
    button.curadoria-follow-red, button.curadoria-follow-red:hover {
      background: #bd2923 !important; background-color: #bd2923 !important;
      color: #fff !important; border-color: #e34d46 !important;
      box-shadow: 0 0 0 2px rgba(189,41,35,.20) !important;
    }
    button.curadoria-follow-green, button.curadoria-follow-green:hover {
      background: #198754 !important; background-color: #198754 !important;
      color: #fff !important; border-color: #2fb879 !important;
      box-shadow: 0 0 0 2px rgba(25,135,84,.18) !important;
    }
    button.curadoria-follow-yellow, button.curadoria-follow-yellow:hover {
      background: #f5c542 !important; background-color: #f5c542 !important;
      color: #211a07 !important; border-color: #d9a91b !important;
      box-shadow: 0 0 0 2px rgba(245,197,66,.20) !important;
    }
    button.curadoria-follow-red *, button.curadoria-follow-green * { color: #fff !important; }
    button.curadoria-follow-yellow * { color: #211a07 !important; }

    #curadoria-follow-status, #curadoria-follow-toggle {
      box-sizing: border-box !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      color: #f7f3fa !important;
      z-index: 2147483647 !important;
    }
    #curadoria-follow-status {
      position: fixed !important; right: 14px !important; bottom: 14px !important;
      width: min(365px, calc(100vw - 28px)) !important;
      max-height: min(82vh, 700px) !important; overflow-y: auto !important;
      box-sizing: border-box !important; padding: 14px !important;
      border: 1px solid transparent !important; border-radius: 16px !important;
      background: linear-gradient(#17141c, #17141c) padding-box,
        linear-gradient(120deg, #833ab4 0%, #c13584 35%, #e1306c 65%, #fd1d1d 100%) border-box !important;
      color: #f7f3fa !important; box-shadow: 0 12px 38px rgba(0,0,0,.50) !important;
      font: 12px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      scrollbar-color: #514656 #17141c !important;
    }
    #curadoria-follow-status *, #curadoria-follow-toggle * { box-sizing: border-box !important; }
    #curadoria-follow-status .curadoria-head {
      display:flex !important; align-items:center !important; justify-content:space-between !important;
      gap:8px !important; font-weight:800 !important; font-size:13px !important; margin-bottom:8px !important;
    }
    #curadoria-follow-status .curadoria-brand { display:flex !important; align-items:center !important; gap:8px !important; }
    #curadoria-follow-status .curadoria-mark {
      width:8px !important; height:22px !important; border-radius:9px !important; flex:0 0 8px !important;
      background:linear-gradient(180deg,#833ab4,#c13584,#e1306c,#fd1d1d) !important;
    }
    #curadoria-follow-status button {
      font: inherit !important; cursor:pointer !important; opacity:1 !important;
      transition: filter .15s ease, transform .15s ease !important;
    }
    #curadoria-follow-status button:hover, #curadoria-follow-toggle:hover { filter: brightness(1.12) !important; }
    #curadoria-follow-status button:disabled { cursor:wait !important; opacity:.55 !important; }
    #curadoria-follow-status .curadoria-icon-btn {
      display:inline-flex !important; align-items:center !important; justify-content:center !important;
      width:30px !important; height:30px !important; padding:0 !important; flex:0 0 30px !important;
      border:1px solid #39343f !important; border-radius:9px !important;
      background:#211d27 !important; color:#eee5f4 !important;
    }
    #curadoria-follow-status .curadoria-note { color:#c1b8c8 !important; margin:3px 0 10px !important; }
    #curadoria-follow-status .curadoria-import {
      padding:10px !important; margin:8px 0 10px !important; border-radius:11px !important;
      background:#201c26 !important; border:1px solid #39343f !important;
    }
    #curadoria-follow-status .curadoria-import-title { font-weight:750 !important; margin-bottom:7px !important; color:#f4edf8 !important; }
    #curadoria-follow-status .curadoria-actions { display:flex !important; gap:7px !important; flex-wrap:wrap !important; }
    #curadoria-follow-status .curadoria-btn-primary {
      border:1px solid transparent !important; border-radius:9px !important; padding:9px 11px !important;
      background:linear-gradient(120deg,#833ab4,#c13584,#e1306c,#fd1d1d) padding-box !important;
      color:#fff !important; font-weight:750 !important; flex:1 1 140px !important;
    }
    #curadoria-follow-status .curadoria-btn-secondary {
      border:1px solid #49414f !important; border-radius:9px !important; padding:9px 11px !important;
      background:#29242f !important; color:#eee5f4 !important; font-weight:650 !important; flex:1 1 120px !important;
    }
    #curadoria-follow-status .curadoria-file-input {
      display:block !important; width:100% !important; max-width:100% !important;
      min-width:0 !important; margin:8px 0 !important; padding:8px !important;
      border:1px solid #49414f !important; border-radius:9px !important;
      background:#211d27 !important; color:#eee5f4 !important;
      font:11px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
    }
    #curadoria-follow-status .curadoria-file-input::file-selector-button {
      border:0 !important; border-radius:7px !important; padding:6px 9px !important;
      margin-right:8px !important; background:#39313f !important; color:#fff !important;
      font:inherit !important; font-weight:700 !important; cursor:pointer !important;
    }
    #curadoria-follow-status .curadoria-file-name { color:#bdb4c6 !important; font-size:10.5px !important; margin-top:7px !important; overflow-wrap:anywhere !important; }
    #curadoria-follow-status .curadoria-status {
      white-space:pre-line !important; overflow-wrap:anywhere !important; border-radius:9px !important;
      padding:9px !important; margin:8px 0 10px !important; background:#211d26 !important;
      border:1px solid #39343f !important; color:#d8cfdf !important; font-size:11px !important;
    }
    #curadoria-follow-status .curadoria-status.ok { border-color:#26764d !important; color:#d8f5e5 !important; }
    #curadoria-follow-status .curadoria-status.error { border-color:#8e3636 !important; color:#ffdddd !important; }
    #curadoria-follow-status .curadoria-counts { display:flex !important; flex-wrap:wrap !important; gap:6px !important; margin:7px 0 !important; }
    #curadoria-follow-status .curadoria-pill { padding:4px 7px !important; border-radius:6px !important; font-weight:800 !important; font-size:10.5px !important; }
    #curadoria-follow-status .curadoria-pill.green {background:#198754 !important;color:#fff !important;}
    #curadoria-follow-status .curadoria-pill.red {background:#bd2923 !important;color:#fff !important;}
    #curadoria-follow-status .curadoria-pill.yellow {background:#f5c542 !important;color:#211a07 !important;}
    #curadoria-follow-status .curadoria-legend { display:grid !important; gap:6px !important; margin:10px 0 9px !important; padding:10px 0 !important; border-top:1px solid #39343f !important; border-bottom:1px solid #39343f !important; }
    #curadoria-follow-status .curadoria-legend-row { display:flex !important; align-items:flex-start !important; gap:7px !important; color:#ddd6e3 !important; font-size:11px !important; line-height:1.4 !important; }
    #curadoria-follow-status .curadoria-key { width:9px !important; height:9px !important; flex:0 0 9px !important; border-radius:3px !important; margin-top:3px !important; }
    #curadoria-follow-status .curadoria-key.green {background:#239b60 !important;}
    #curadoria-follow-status .curadoria-key.red {background:#d7372f !important;}
    #curadoria-follow-status .curadoria-key.yellow {background:#f5c542 !important;}
    #curadoria-follow-status .curadoria-legend strong { color:#fff !important; font-weight:800 !important; }
    #curadoria-follow-status .curadoria-small { color:#b7afbd !important; font-size:10.5px !important; }
    #curadoria-follow-toggle {
      position:fixed !important; right:16px !important; bottom:18px !important; z-index:2147483647 !important;
      width:48px !important; height:48px !important; display:flex !important; align-items:center !important; justify-content:center !important;
      padding:0 !important; border:1px solid transparent !important; border-radius:16px !important;
      background:linear-gradient(#17141c,#17141c) padding-box,
        linear-gradient(135deg,#833ab4 0%,#c13584 35%,#e1306c 68%,#fd1d1d 100%) border-box !important;
      color:#fff !important; box-shadow:0 8px 25px rgba(0,0,0,.45) !important; cursor:pointer !important;
    }
    #curadoria-follow-toggle svg { width:23px !important; height:23px !important; stroke:#fff !important; }
    @media (max-width: 480px) {
      #curadoria-follow-status { right:8px !important; bottom:8px !important; width:calc(100vw - 16px) !important; max-height:84vh !important; }
      #curadoria-follow-toggle { right:12px !important; bottom:12px !important; }
    }
  `;
  (document.documentElement || document.head).appendChild(style);

  function cleanUsername(value) {
    if (!value) return '';
    const text = String(value).trim().replace(/^@/, '');
    return /^[a-zA-Z0-9._]{1,30}$/.test(text) ? text : '';
  }

  function usernameFromHref(href) {
    try {
      const url = new URL(href, location.origin);
      if (url.origin !== location.origin) return '';
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      if (!parts.length) return '';
      let name = parts[0];
      if (name.toLowerCase() === '_u') name = parts[1] || '';
      const username = cleanUsername(name);
      return username && !RESERVED.has(username.toLowerCase()) ? username.toLowerCase() : '';
    } catch (_) { return ''; }
  }

  function usernameFromExportHref(href) {
    if (typeof href !== 'string' || !href.trim()) return '';
    try {
      const url = new URL(href.trim(), 'https://www.instagram.com');
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      if (!parts.length) return '';
      const specialIndex = parts.indexOf('_u');
      return parts[specialIndex >= 0 ? specialIndex + 1 : 0] || '';
    } catch (_) { return ''; }
  }

  function cleanExportUsername(value) {
    if (typeof value !== 'string') return '';
    let username = value.trim();
    if (!username) return '';
    if (/^https?:\/\//i.test(username)) username = usernameFromExportHref(username);
    username = String(username || '').trim().replace(/^@/, '').replace(/^\/+|\/+$/g, '');
    if (!username || /[\s/?#]/.test(username)) return '';
    return username;
  }

  function extractUsernames(data) {
    const found = [];
    function walk(node) {
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.string_list_data)) {
        const names = [];
        for (const item of node.string_list_data) {
          if (!item || typeof item !== 'object') continue;
          let username = cleanExportUsername(item.value);
          if (!username) username = cleanExportUsername(usernameFromExportHref(item.href || ''));
          if (username) names.push(username);
        }
        if (!names.length) {
          const title = cleanExportUsername(node.title);
          if (title) names.push(title);
        }
        found.push(...names);
        return;
      }
      for (const value of Object.values(node)) walk(value);
    }
    walk(data);
    return found;
  }

  function uniqueUserMap(usernames) {
    const result = new Map();
    for (const raw of usernames) {
      const username = cleanExportUsername(raw);
      if (username) {
        const key = username.toLocaleLowerCase('en-US');
        if (!result.has(key)) result.set(key, username);
      }
    }
    return result;
  }

  async function parseInstagramZip(file) {
    if (!file || !/\.zip$/i.test(file.name)) throw new Error('Selecione o ZIP original da exportação do Instagram.');
    // Nas páginas web extension, resolva a biblioteca tanto pelo binding global
    // quanto pelo objeto global do mundo isolado do content script.
    const ZipLibrary = (typeof JSZip !== 'undefined' && JSZip) ||
      (typeof globalThis !== 'undefined' && globalThis.JSZip) ||
      (typeof window !== 'undefined' && window.JSZip);
    if (!ZipLibrary || typeof ZipLibrary.loadAsync !== 'function') {
      throw new Error('O leitor ZIP não foi carregado nesta aba. Em about:debugging, remova e carregue novamente a extensão atualizada e depois atualize o Instagram com Ctrl+F5. Se continuar, use o importador alternativo manager.html.');
    }

    let archive;
    try {
      if (typeof file.arrayBuffer !== 'function') throw new Error('O navegador não disponibilizou os bytes do arquivo.');
      const sourceBuffer = await file.arrayBuffer();
      // No Firefox/Zen, o ArrayBuffer de um File selecionado dentro de um
      // content script pode vir de outro compartimento JS. O JSZip verifica
      // instanceof ArrayBuffer e pode recusá-lo. Copiar para um TypedArray
      // criado aqui evita esse problema; a matriz simples é um último fallback.
      const localBytes = new Uint8Array(sourceBuffer);
      try {
        archive = await ZipLibrary.loadAsync(localBytes);
      } catch (typedArrayError) {
        try {
          archive = await ZipLibrary.loadAsync(Array.from(localBytes));
        } catch (plainArrayError) {
          const typedMessage = String(typedArrayError && typedArrayError.message || typedArrayError);
          const arrayMessage = String(plainArrayError && plainArrayError.message || plainArrayError);
          throw new Error(`A biblioteca ZIP recusou os dados. TypedArray: ${typedMessage}. Array: ${arrayMessage}`);
        }
      }
    } catch (error) {
      console.error('[Curadoria] Erro ao abrir ZIP no painel do Instagram:', error);
      throw new Error('Não consegui abrir o arquivo ZIP neste painel. Confira se o arquivo termina em .zip e se a exportação não está corrompida. Detalhe: ' + String(error && error.message || error));
    }

    const entries = Object.values(archive.files).filter(entry => !entry.dir && entry.name.toLowerCase().endsWith('.json'));
    const followersFiles = entries.filter(entry => FOLLOWERS_RE.test(entry.name.split('/').pop())).sort((a, b) => a.name.localeCompare(b.name));
    const followingFiles = entries.filter(entry => FOLLOWING_RE.test(entry.name.split('/').pop())).sort((a, b) => a.name.localeCompare(b.name));
    if (!followersFiles.length || !followingFiles.length) {
      throw new Error('Não encontrei os arquivos de seguidores e seguindo. Solicite a exportação em JSON e inclua “Seguidores e seguindo”.');
    }

    async function readEntries(files, label) {
      const all = [];
      for (const entry of files) {
        let parsed;
        try { parsed = JSON.parse((await entry.async('string')).replace(/^\uFEFF/, '')); }
        catch (_) { throw new Error(`Não consegui ler “${entry.name}” dentro do ZIP. O arquivo pode estar incompleto ou corrompido.`); }
        all.push(...extractUsernames(parsed));
      }
      if (!all.length) throw new Error(`Encontrei os arquivos de ${label}, mas não consegui extrair nomes de usuário. Confira se a exportação foi feita em JSON.`);
      return uniqueUserMap(all);
    }

    const followers = await readEntries(followersFiles, 'seguidores');
    const following = await readEntries(followingFiles, 'contas seguidas');
    const notFollowingBack = [];
    for (const [normalized, displayName] of following.entries()) {
      if (!followers.has(normalized)) notFollowingBack.push(displayName);
    }
    notFollowingBack.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    return {
      usernames: notFollowingBack,
      followersCount: followers.size,
      followingCount: following.size,
      resultCount: notFollowingBack.length,
      followerFiles: followersFiles.map(entry => entry.name),
      followingFiles: followingFiles.map(entry => entry.name)
    };
  }

  function eyeOffSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.58 10.58a2 2 0 0 0 2.83 2.83"/><path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.9c5.2 0 8.7 4.3 10 7.1a12.5 12.5 0 0 1-3.15 4.16"/><path d="M6.61 6.61A13.2 13.2 0 0 0 2 12c1.3 2.8 4.8 7.1 10 7.1 1.28 0 2.45-.27 3.5-.72"/></svg>';
  }

  function ensureToggle() {
    if (toggleButton && toggleButton.isConnected) return toggleButton;
    toggleButton = document.createElement('button');
    toggleButton.id = 'curadoria-follow-toggle';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-label', 'Mostrar InstaUnfollow');
    toggleButton.title = 'Mostrar InstaUnfollow';
    toggleButton.innerHTML = eyeOffSvg();
    toggleButton.addEventListener('click', () => setPanelHidden(false));
    document.body.appendChild(toggleButton);
    return toggleButton;
  }

  function setPanelStatus(message, kind = '') {
    customStatus = message;
    customStatusType = kind;
    if (panel && panel.isConnected) {
      const statusBox = panel.querySelector('[data-status]');
      statusBox.textContent = message;
      statusBox.className = `curadoria-status ${kind}`.trim();
    }
  }

  function panelDefaultStatus() {
    if (!loaded) return 'Nenhum ZIP importado. Selecione o ZIP original da exportação do Instagram abaixo.';
    const importedDate = comparisonImportedAt ? new Date(comparisonImportedAt).toLocaleString('pt-BR') : '';
    return `Lista salva: ${comparisonUsers.size.toLocaleString('pt-BR')} perfis que não seguem você de volta.\n${comparisonFileName ? `Arquivo: ${comparisonFileName}\n` : ''}${importedDate ? `Importado em ${importedDate}` : 'A lista está salva no navegador.'}`;
  }


  function ensurePanel() {
    if (panelHidden) return null;
    if (panel && panel.isConnected) return panel;
    panel = document.createElement('aside');
    panel.id = 'curadoria-follow-status';
    panel.innerHTML = `
      <div class="curadoria-head">
        <div class="curadoria-brand"><span class="curadoria-mark"></span><span>InstaUnfollow</span></div>
        <button class="curadoria-icon-btn" data-hide type="button" aria-label="Esconder painel" title="Esconder painel">${eyeOffSvg()}</button>
      </div>
      <div class="curadoria-note">Importe a exportação do Instagram e as cores serão aplicadas à sua lista Seguindo.</div>
      <div class="curadoria-import">
        <div class="curadoria-import-title">Importar dados do Instagram</div>
        <input class="curadoria-file-input" data-file-input type="file" accept=".zip,application/zip,application/x-zip-compressed" aria-label="Selecionar ZIP da exportação do Instagram">
        <div class="curadoria-actions">
          <button class="curadoria-btn-primary" data-import type="button" disabled>Processar e salvar</button>
          <button class="curadoria-btn-secondary" data-open-manager type="button">Importador alternativo</button>
        </div>
        <div class="curadoria-file-name" data-file-name>Nenhum arquivo selecionado</div>
      </div>
      <div class="curadoria-status" data-status role="status" aria-live="polite"></div>
      <div class="curadoria-counts"><span class="curadoria-pill green" data-count="green">Verde: 0</span><span class="curadoria-pill red" data-count="red">Vermelho: 0</span><span class="curadoria-pill yellow" data-count="yellow">Amarelo: 0</span></div>
      <div class="curadoria-legend" aria-label="Legenda das cores">
        <div class="curadoria-legend-row"><span class="curadoria-key green"></span><span><strong>Verde</strong>, não está na lista calculada, provável que siga você</span></div>
        <div class="curadoria-legend-row"><span class="curadoria-key red"></span><span><strong>Vermelho</strong>, está na lista calculada, não segue você de volta</span></div>
        <div class="curadoria-legend-row"><span class="curadoria-key yellow"></span><span><strong>Amarelo</strong>, perfil sem correspondência ou lista não carregada</span></div>
      </div>
      <div class="curadoria-small">O ZIP é processado localmente. Nenhum arquivo é enviado a um servidor.</div>`;

    const fileInput = panel.querySelector('[data-file-input]');
    const importButton = panel.querySelector('[data-import]');
    fileInput.addEventListener('change', event => {
      event.stopPropagation();
      selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      const fileNameBox = panel && panel.querySelector('[data-file-name]');
      if (fileNameBox) fileNameBox.textContent = selectedFile ? selectedFile.name : 'Nenhum arquivo selecionado';
      importButton.disabled = !selectedFile || busy;
      if (selectedFile) setPanelStatus(`ZIP selecionado: ${selectedFile.name}. Clique em “Processar e salvar”.`);
      else setPanelStatus(panelDefaultStatus());
    });
    importButton.addEventListener('click', importSelectedZip);
    panel.querySelector('[data-open-manager]').addEventListener('click', async () => {
      try {
        // Content scripts não devem abrir moz-extension:// via window.open.
        // Solicita ao contexto privilegiado da extensão abrir a página.
        const response = await browser.runtime.sendMessage({ type: 'CURADORIA_OPEN_MANAGER' });
        if (!response || !response.ok) {
          throw new Error(response && response.error || 'A extensão não confirmou a abertura da página.');
        }
        setPanelStatus('Importador alternativo aberto em uma nova aba. Selecione o ZIP nessa página.', 'ok');
      } catch (error) {
        setPanelStatus(`Não consegui abrir o importador alternativo: ${String(error && error.message || error)}`, 'error');
      }
    });
    panel.querySelector('[data-hide]').addEventListener('click', () => setPanelHidden(true));
    document.body.appendChild(panel);
    const statusBox = panel.querySelector('[data-status]');
    statusBox.textContent = customStatus || panelDefaultStatus();
    statusBox.className = `curadoria-status ${customStatusType}`.trim();
    for (const color of ['green', 'red', 'yellow']) panel.querySelector(`[data-count="${color}"]`).textContent = `${color[0].toUpperCase()}${color.slice(1)}: ${latestCounts[color]}`;
    return panel;
  }

  async function setPanelHidden(hidden) {
    panelHidden = Boolean(hidden);
    if (panelHidden) {
      if (panel) panel.remove();
      panel = null;
      ensureToggle();
    } else {
      if (toggleButton) toggleButton.remove();
      toggleButton = null;
      ensurePanel();
      lastSummary = '';
      updatePanel(latestCounts);
    }
    try { await browser.storage.local.set({ curadoriaPanelHidden: panelHidden }); }
    catch (error) { console.warn('[Curadoria] Não consegui salvar o estado visual do painel.', error); }
  }

  async function importSelectedZip() {
    if (busy) return;
    const fileInput = panel && panel.querySelector('[data-file-input]');
    const selected = (fileInput && fileInput.files && fileInput.files[0]) || selectedFile;
    if (!selected) {
      setPanelStatus('Selecione o ZIP original da exportação do Instagram.', 'error');
      return;
    }

    busy = true;
    const importButton = panel.querySelector('[data-import]');
    if (importButton) importButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    setPanelStatus('Lendo o ZIP, reunindo todos os arquivos de seguidores e seguindo e comparando os perfis…');
    try {
      const data = await parseInstagramZip(selected);
      setPanelStatus(`Comparação concluída. Salvando ${data.resultCount.toLocaleString('pt-BR')} perfis…`);
      const importedAt = Date.now();
      const payload = {
        compareUsers: data.usernames,
        compareMode: 'nonFollowers',
        compareSource: 'instagram-export-zip',
        compareFileNames: [selected.name],
        compareImportedAt: importedAt,
        compareInvalidRows: 0,
        compareFollowersCount: data.followersCount,
        compareFollowingCount: data.followingCount,
        compareResultCount: data.resultCount
      };
      await browser.storage.local.set(payload);
      const saved = await browser.storage.local.get(['compareUsers', 'compareMode', 'compareSource', 'compareImportedAt', 'compareFollowersCount', 'compareFollowingCount']);
      if (saved.compareSource !== 'instagram-export-zip' || saved.compareMode !== 'nonFollowers' ||
          !Array.isArray(saved.compareUsers) || saved.compareUsers.length !== data.resultCount ||
          saved.compareImportedAt !== importedAt || saved.compareFollowingCount !== data.followingCount ||
          saved.compareFollowersCount !== data.followersCount) {
        throw new Error('O navegador não confirmou o salvamento da lista. Tente novamente.');
      }
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      if (panel && panel.isConnected) {
        const fileNameBox = panel.querySelector('[data-file-name]');
        if (fileNameBox) fileNameBox.textContent = 'Nenhum arquivo selecionado';
      }
      setPanelStatus(
        `ZIP IMPORTADO E SALVO COM SUCESSO!\n\nSeguidores: ${data.followersCount.toLocaleString('pt-BR')}\nContas seguidas: ${data.followingCount.toLocaleString('pt-BR')}\nNão seguem você de volta: ${data.resultCount.toLocaleString('pt-BR')}\nArquivos de seguidores: ${data.followerFiles.length} · arquivos de seguindo: ${data.followingFiles.length}\n\nA lista foi salva na memória persistente da extensão.`,
        'ok'
      );
      await loadSavedData();
    } catch (error) {
      setPanelStatus(`Falha ao processar o ZIP: ${String(error && error.message || error)}`, 'error');
    } finally {
      busy = false;
      if (panel && panel.isConnected) {
        const importBtn = panel.querySelector('[data-import]');
        const currentFileInput = panel.querySelector('[data-file-input]');
        if (currentFileInput) currentFileInput.disabled = false;
        if (importBtn) importBtn.disabled = !selectedFile;
      }
    }
  }

  function buttonText(button) {
    return String(button && (button.innerText || button.textContent) || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
  }

  function isFollowingButton(button) {
    return !!button && button.tagName === 'BUTTON' && /^(seguindo|following|siguiendo)$/.test(buttonText(button));
  }

  function matchesFollowingHeading(text) {
    const line = String(text || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
    return /^(seguindo|following|siguiendo)(?:\s+\d[\d.,]*)?$/.test(line) || /^\d[\d.,]*\s+(seguindo|following|siguiendo)$/.test(line);
  }

  function findFollowingRoot() {
    if (/^\/[^/]+\/following\/?$/i.test(location.pathname)) return document.querySelector('main') || document.body;
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    for (const dialog of dialogs) {
      const headings = [...dialog.querySelectorAll('h1,h2,h3,[role="heading"]')];
      if (headings.some(node => matchesFollowingHeading(node.innerText || node.textContent))) return dialog;
      const lines = String(dialog.innerText || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 3);
      if (lines.some(matchesFollowingHeading)) return dialog;
    }
    return null;
  }

  function findFollowingButtonForAnchor(anchor, username, root) {
    let node = anchor;
    for (let depth = 0; depth < 12 && node && node !== root; depth++) {
      node = node.parentElement;
      if (!node) break;
      const buttons = [...node.querySelectorAll('button')].filter(isFollowingButton);
      if (buttons.length !== 1) continue;
      const usernamesInRow = new Set([...node.querySelectorAll('a[href]')]
        .map(link => usernameFromHref(link.getAttribute('href') || link.href)).filter(Boolean));
      if (usernamesInRow.size === 1 && usernamesInRow.has(username)) return buttons[0];
    }
    return null;
  }

  function getStatus(username) {
    if (!loaded || !username) return 'yellow';
    return comparisonUsers.has(username.toLowerCase()) ? 'red' : 'green';
  }

  function removeColorsFromObsoleteButtons(root) {
    root.querySelectorAll('button.curadoria-follow-red,button.curadoria-follow-green,button.curadoria-follow-yellow').forEach(button => {
      if (!isFollowingButton(button)) {
        button.classList.remove(...STATUS_CLASSES);
        delete button.dataset.curadoriaStatus;
        button.removeAttribute('title');
      }
    });
  }

  function updatePanel(counts) {
    latestCounts = counts;
    if (panelHidden) {
      ensureToggle();
      return;
    }
    const box = ensurePanel();
    if (!box) return;
    const summary = `${counts.green}|${counts.red}|${counts.yellow}|${loaded}|${comparisonUsers.size}|${comparisonFileName}|${comparisonImportedAt}`;
    if (summary !== lastSummary) {
      box.querySelector('[data-count="green"]').textContent = `Verde: ${counts.green}`;
      box.querySelector('[data-count="red"]').textContent = `Vermelho: ${counts.red}`;
      box.querySelector('[data-count="yellow"]').textContent = `Amarelo: ${counts.yellow}`;
      if (!customStatus) {
        const statusBox = box.querySelector('[data-status]');
        statusBox.textContent = panelDefaultStatus();
        statusBox.className = 'curadoria-status';
      }
      lastSummary = summary;
    }
  }

  function scan() {
    scanTimer = null;
    const root = findFollowingRoot();
    if (!root) {
      updatePanel({ green: 0, red: 0, yellow: 0 });
      return;
    }

    removeColorsFromObsoleteButtons(root);
    const counts = { green: 0, red: 0, yellow: 0 };
    const processedButtons = new Set();
    for (const anchor of root.querySelectorAll('a[href]')) {
      const username = usernameFromHref(anchor.getAttribute('href') || anchor.href);
      if (!username) continue;
      const button = findFollowingButtonForAnchor(anchor, username, root);
      if (!button || processedButtons.has(button)) continue;
      processedButtons.add(button);
      const status = getStatus(username);
      button.classList.remove(...STATUS_CLASSES);
      button.classList.add(CLASS_BY_STATUS[status]);
      button.dataset.curadoriaStatus = status;
      const statusText = status === 'green' ? 'Segue você também (estimativa pela lista importada)'
        : status === 'red' ? 'Não segue você de volta (lista importada)'
        : 'Status desconhecido: importe um ZIP e/ou confirme o @';
      button.title = `Curadoria: @${username} · ${statusText}`;
      counts[status]++;
    }
    updatePanel(counts);
  }

  function scheduleScan() {
    if (scanTimer !== null) return;
    scanTimer = setTimeout(scan, 180);
  }

  async function loadSavedData() {
    try {
      const saved = await browser.storage.local.get(STORAGE_KEYS);
      comparisonUsers = saved.compareSource === 'instagram-export-zip' && saved.compareMode === 'nonFollowers' && Array.isArray(saved.compareUsers)
        ? new Set(saved.compareUsers.map(name => String(name).toLowerCase())) : new Set();
      loaded = saved.compareSource === 'instagram-export-zip' && saved.compareMode === 'nonFollowers' && Array.isArray(saved.compareUsers);
      comparisonFileName = Array.isArray(saved.compareFileNames) ? saved.compareFileNames.join(', ') : '';
      comparisonImportedAt = Number(saved.compareImportedAt || 0);
      panelHidden = Boolean(saved.curadoriaPanelHidden);
      lastSummary = '';
      if (panelHidden) {
        if (panel) panel.remove();
        panel = null;
        ensureToggle();
      } else {
        if (toggleButton) toggleButton.remove();
        toggleButton = null;
        ensurePanel();
      }
      scheduleScan();
    } catch (error) {
      console.warn('[Curadoria] Não consegui ler os dados salvos da extensão.', error);
    }
  }

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && STORAGE_KEYS.some(key => changes[key])) loadSavedData();
  });
  browser.runtime.onMessage.addListener(message => {
    if (message && message.type === 'CURADORIA_RESCAN') {
      scheduleScan();
      return Promise.resolve({ ok: true });
    }
    return undefined;
  });

  const observer = new MutationObserver(() => {
    if ((!panel || !panel.isConnected) && !panelHidden && document.body) ensurePanel();
    if ((!toggleButton || !toggleButton.isConnected) && panelHidden && document.body) ensureToggle();
    scheduleScan();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('scroll', scheduleScan, { passive: true });
  window.addEventListener('popstate', scheduleScan);
  loadSavedData();
})();
