'use strict';

const $ = (id) => document.getElementById(id);
const statusBox = $('status');
const STORAGE_KEYS = [
  'compareUsers', 'compareMode', 'compareSource', 'compareFileNames',
  'compareImportedAt', 'compareInvalidRows', 'compareFollowersCount',
  'compareFollowingCount', 'compareResultCount'
];

function showStatus(message, kind = '') {
  statusBox.textContent = message;
  statusBox.className = `status ${kind}`.trim();
}

async function readSavedList() {
  const saved = await browser.storage.local.get(STORAGE_KEYS);
  if (saved.compareSource !== 'instagram-export-zip' || saved.compareMode !== 'nonFollowers' || !Array.isArray(saved.compareUsers)) {
    if (Array.isArray(saved.compareUsers) && saved.compareUsers.length && saved.compareSource !== 'instagram-export-zip') {
      await browser.storage.local.remove(STORAGE_KEYS);
      showStatus('A lista antiga baseada em CSV foi descartada. Importe o ZIP completo da exportação do Instagram.', '');
    } else {
      showStatus('Nenhuma exportação processada ainda. Clique em “Importar ZIP do Instagram”.', '');
    }
    return {};
  }
  const name = Array.isArray(saved.compareFileNames) && saved.compareFileNames.length
    ? saved.compareFileNames.join(', ') : 'ZIP do Instagram';
  const importedAt = saved.compareImportedAt ? new Date(saved.compareImportedAt).toLocaleString('pt-BR') : '';
  showStatus(
    `ZIP PROCESSADO E SALVO NA EXTENSÃO\n${Number(saved.compareFollowersCount || 0).toLocaleString('pt-BR')} seguidores\n${Number(saved.compareFollowingCount || 0).toLocaleString('pt-BR')} contas seguidas\n${saved.compareUsers.length.toLocaleString('pt-BR')} contas não seguem você de volta\n${name}${importedAt ? `\nProcessado em ${importedAt}` : ''}\n\nO fechamento deste popup não apaga a lista.`,
    'ok'
  );
  return saved;
}

async function refreshActiveTab() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs && tabs[0];
    if (!tab || !tab.id || !/^https:\/\/(www\.)?instagram\.com\//i.test(tab.url || '')) {
      return { ok: false, message: 'Abra o Instagram e entre na lista Seguindo; depois clique em “Aplicar cores”.' };
    }
    await browser.tabs.sendMessage(tab.id, { type: 'CURADORIA_RESCAN' });
    return { ok: true, message: 'Pedido de atualização enviado para a aba do Instagram.' };
  } catch (_) {
    return { ok: false, message: 'A lista pode estar salva, mas a aba do Instagram não respondeu. Atualize a página com F5 e tente novamente.' };
  }
}

$('openImportBtn').addEventListener('click', async () => {
  try {
    const url = browser.runtime.getURL('manager.html');
    await browser.tabs.create({ url });
    window.close();
  } catch (error) {
    showStatus(`Não consegui abrir a página de importação: ${String(error && error.message || error)}`, 'error');
  }
});

$('refreshBtn').addEventListener('click', async () => {
  const saved = await readSavedList();
  if (saved.compareSource !== 'instagram-export-zip' || saved.compareMode !== 'nonFollowers') {
    showStatus('Ainda não há ZIP processado. Clique em “Importar ZIP do Instagram”.', 'error');
    return;
  }
  const result = await refreshActiveTab();
  showStatus(`${saved.compareUsers.length.toLocaleString('pt-BR')} perfis não seguem você de volta e continuam salvos.\n${result.message}`, result.ok ? 'ok' : '');
});

$('clearBtn').addEventListener('click', async () => {
  try {
    await browser.storage.local.remove(STORAGE_KEYS);
    const result = await refreshActiveTab();
    showStatus(`Lista removida do armazenamento persistente.\n${result.message}`, '');
  } catch (error) {
    showStatus(`Não consegui remover a lista: ${String(error && error.message || error)}`, 'error');
  }
});

readSavedList().catch(() => showStatus('Não consegui ler o armazenamento da extensão. Recarregue-a em about:debugging.', 'error'));
