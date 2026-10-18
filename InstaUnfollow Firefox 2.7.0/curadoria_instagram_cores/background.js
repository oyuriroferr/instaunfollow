'use strict';

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== 'CURADORIA_OPEN_MANAGER') return undefined;

  // Accept requests only from this extension's Instagram content script.
  const senderUrl = String(sender && sender.url || '');
  if (!/^https:\/\/(www\.)?instagram\.com\//i.test(senderUrl)) {
    return Promise.resolve({ ok: false, error: 'Solicitação não veio de uma página do Instagram.' });
  }

  return browser.tabs.create({ url: browser.runtime.getURL('manager.html') })
    .then(tab => ({ ok: Boolean(tab && tab.id), tabId: tab && tab.id }))
    .catch(error => ({ ok: false, error: String(error && error.message || error) }));
});
