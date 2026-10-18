'use strict';

const $ = (id) => document.getElementById(id);
const fileInput = $('file');
const importBtn = $('importBtn');
const statusBox = $('status');
let selectedFile = null;

const FOLLOWERS_RE = /^followers(?:_\d+)?\.json$/i;
const FOLLOWING_RE = /^following(?:_\d+)?\.json$/i;
const STORAGE_KEYS = [
  'compareUsers', 'compareMode', 'compareSource', 'compareFileNames',
  'compareImportedAt', 'compareInvalidRows', 'compareFollowersCount',
  'compareFollowingCount', 'compareResultCount'
];

function showStatus(message, kind = '') {
  statusBox.textContent = message;
  statusBox.className = `status ${kind}`.trim();
}

function usernameFromHref(href) {
  if (typeof href !== 'string' || !href.trim()) return '';
  try {
    const url = new URL(href.trim(), 'https://www.instagram.com');
    const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (!parts.length) return '';
    const specialIndex = parts.indexOf('_u');
    if (specialIndex !== -1) return parts[specialIndex + 1] || '';
    return parts[0] || '';
  } catch (_) {
    return '';
  }
}

function cleanExportUsername(value) {
  if (typeof value !== 'string') return '';
  let username = value.trim();
  if (!username) return '';
  if (/^https?:\/\//i.test(username)) username = usernameFromHref(username);
  username = String(username || '').trim().replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  if (!username || /[\s/?#]/.test(username)) return '';
  return username;
}

// Segue a mesma estrutura de extração utilizada pelo script Python:
// string_list_data.value, fallback para href e title quando necessário.
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
        if (!username) username = cleanExportUsername(usernameFromHref(item.href || ''));
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
  if (!file || !file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Selecione o ZIP original da exportação do Instagram.');
  }
  if (typeof JSZip === 'undefined') {
    throw new Error('O leitor de ZIP não foi carregado. Recarregue a extensão em about:debugging e tente novamente.');
  }

  let archive;
  try {
    archive = await JSZip.loadAsync(await file.arrayBuffer());
  } catch (_) {
    throw new Error('Não consegui abrir esse arquivo como ZIP. Baixe novamente a exportação original do Instagram.');
  }

  const entries = Object.values(archive.files).filter(entry => !entry.dir && entry.name.toLowerCase().endsWith('.json'));
  const followersFiles = entries
    .filter(entry => FOLLOWERS_RE.test(entry.name.split('/').pop()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const followingFiles = entries
    .filter(entry => FOLLOWING_RE.test(entry.name.split('/').pop()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!followersFiles.length || !followingFiles.length) {
    throw new Error('Não encontrei os arquivos de seguidores e seguindo dentro do ZIP. Peça uma exportação do Instagram em formato JSON e inclua “Seguidores e seguindo”.');
  }

  async function readEntries(files, label) {
    const all = [];
    for (const entry of files) {
      let parsed;
      try {
        const raw = (await entry.async('string')).replace(/^\uFEFF/, '');
        parsed = JSON.parse(raw);
      } catch (_) {
        throw new Error(`Não consegui ler o arquivo “${entry.name}” dentro do ZIP. O arquivo pode estar incompleto ou corrompido.`);
      }
      all.push(...extractUsernames(parsed));
    }
    if (!all.length) {
      throw new Error(`Encontrei os arquivos de ${label}, mas não consegui extrair nomes de usuário. Confirme se a exportação foi solicitada no formato JSON.`);
    }
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

async function getSavedState() {
  const saved = await browser.storage.local.get(STORAGE_KEYS);
  if (saved.compareSource === 'instagram-export-zip' && saved.compareMode === 'nonFollowers' && Array.isArray(saved.compareUsers)) {
    const fileName = Array.isArray(saved.compareFileNames) && saved.compareFileNames.length
      ? saved.compareFileNames.join(', ') : 'ZIP do Instagram';
    const date = saved.compareImportedAt ? new Date(saved.compareImportedAt).toLocaleString('pt-BR') : '';
    showStatus(
      `ZIP PROCESSADO E LISTA PERSISTIDA\n${Number(saved.compareFollowersCount || 0).toLocaleString('pt-BR')} seguidores encontrados\n${Number(saved.compareFollowingCount || 0).toLocaleString('pt-BR')} contas que você segue\n${saved.compareUsers.length.toLocaleString('pt-BR')} contas não seguem você de volta\nOrigem: ${fileName}${date ? `\nProcessado em ${date}` : ''}\n\nA lista continua salva mesmo depois de fechar esta aba ou o popup.`,
      'ok'
    );
    return saved;
  }

  if (Array.isArray(saved.compareUsers) && saved.compareUsers.length && saved.compareSource !== 'instagram-export-zip') {
    await browser.storage.local.remove(STORAGE_KEYS);
    showStatus('A lista antiga baseada em CSV foi descartada nesta versão. Selecione o ZIP completo da exportação do Instagram para recalcular os resultados.');
  } else {
    showStatus('Nenhum ZIP processado ainda. Selecione o arquivo original da exportação do Instagram.');
  }
  return {};
}

async function refreshActiveInstagramTab() {
  try {
    const tabs = await browser.tabs.query({ url: ['https://www.instagram.com/*', 'https://instagram.com/*'] });
    if (!tabs || !tabs.length) {
      return { ok: false, message: 'Não encontrei uma aba aberta do Instagram. Abra o Instagram e entre em Seguindo.' };
    }
    let sent = 0;
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        await browser.tabs.sendMessage(tab.id, { type: 'CURADORIA_RESCAN' });
        sent++;
      } catch (_) {
        // A aba pode estar carregando ou ainda não ter recebido o content script.
      }
    }
    return sent
      ? { ok: true, message: `Pedido de atualização enviado para ${sent} aba(s) do Instagram.` }
      : { ok: false, message: 'Atualize a aba do Instagram com F5 e tente novamente.' };
  } catch (_) {
    return { ok: false, message: 'Atualize a aba do Instagram com F5 e tente novamente.' };
  }
}

fileInput.addEventListener('change', () => {
  selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
  importBtn.disabled = !selectedFile;
  if (selectedFile) showStatus(`ZIP selecionado: ${selectedFile.name}. Clique em “Importar ZIP e calcular a lista”.`);
  else getSavedState().catch(() => {});
});

importBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    showStatus('Selecione primeiro o ZIP original da exportação do Instagram.', 'error');
    return;
  }

  const fileName = selectedFile.name;
  importBtn.disabled = true;
  fileInput.disabled = true;
  showStatus('Abrindo o ZIP, lendo todos os arquivos de seguidores e seguindo e comparando os perfis…');
  try {
    const data = await parseInstagramZip(selectedFile);
    showStatus(`Comparação concluída. Salvando ${data.resultCount.toLocaleString('pt-BR')} perfis que não seguem você de volta…`);

    const importedAt = Date.now();
    const payload = {
      compareUsers: data.usernames,
      compareMode: 'nonFollowers',
      compareSource: 'instagram-export-zip',
      compareFileNames: [fileName],
      compareImportedAt: importedAt,
      compareInvalidRows: 0,
      compareFollowersCount: data.followersCount,
      compareFollowingCount: data.followingCount,
      compareResultCount: data.resultCount
    };
    await browser.storage.local.set(payload);

    // Confirma a persistência, não apenas a conclusão da comparação.
    const saved = await browser.storage.local.get(STORAGE_KEYS);
    if (saved.compareSource !== 'instagram-export-zip' || saved.compareMode !== 'nonFollowers' ||
        !Array.isArray(saved.compareUsers) || saved.compareUsers.length !== data.resultCount ||
        saved.compareImportedAt !== importedAt || saved.compareFollowingCount !== data.followingCount ||
        saved.compareFollowersCount !== data.followersCount) {
      throw new Error('O navegador não confirmou o salvamento da lista. Tente novamente.');
    }

    selectedFile = null;
    fileInput.value = '';
    showStatus(
      `ZIP IMPORTADO, COMPARADO E SALVO COM SUCESSO!\n\nSeguidores encontrados: ${data.followersCount.toLocaleString('pt-BR')}\nContas que você segue: ${data.followingCount.toLocaleString('pt-BR')}\nVocê segue, mas não te seguem de volta: ${data.resultCount.toLocaleString('pt-BR')}\n\nOrigem: ${fileName}\nArquivos de seguidores: ${data.followerFiles.length}\nArquivos de seguindo: ${data.followingFiles.length}\n\nO resultado foi salvo na memória persistente da extensão. Você pode fechar esta aba, voltar ao Instagram e abrir a lista Seguindo.`,
      'ok'
    );
  } catch (error) {
    showStatus(`Falha ao processar o ZIP: ${String(error && error.message || error)}`, 'error');
  } finally {
    fileInput.disabled = false;
    importBtn.disabled = !selectedFile;
  }
});

$('refreshBtn').addEventListener('click', async () => {
  const saved = await getSavedState();
  if (saved.compareSource !== 'instagram-export-zip' || saved.compareMode !== 'nonFollowers') {
    showStatus('Ainda não há ZIP processado. Selecione o ZIP original primeiro.', 'error');
    return;
  }
  const result = await refreshActiveInstagramTab();
  showStatus(`${saved.compareUsers.length.toLocaleString('pt-BR')} perfis continuam persistidos.\n${result.message}`, result.ok ? 'ok' : '');
});

$('clearBtn').addEventListener('click', async () => {
  try {
    await browser.storage.local.remove(STORAGE_KEYS);
    showStatus('Lista calculada removida do armazenamento persistente da extensão.');
  } catch (error) {
    showStatus(`Não consegui remover a lista: ${String(error && error.message || error)}`, 'error');
  }
});

getSavedState().catch(() => showStatus('Não consegui ler o armazenamento da extensão. Recarregue-a em about:debugging.', 'error'));
