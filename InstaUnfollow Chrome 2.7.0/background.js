'use strict';

// MV3 service worker for Chrome. Open manager.html only when a page belonging to
// Instagram asks for it; all ZIP processing still happens locally in the page.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'CURADORIA_OPEN_MANAGER') return false;

  const senderUrl = String((sender && sender.url) || '');
  if (!/^https:\/\/(www\.)?instagram\.com\//i.test(senderUrl)) {
    sendResponse({ ok: false, error: 'Solicitação não veio de uma página do Instagram.' });
    return false;
  }

  chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') }, tab => {
    const lastError = chrome.runtime.lastError;
    if (lastError) {
      sendResponse({ ok: false, error: lastError.message || String(lastError) });
      return;
    }
    sendResponse({ ok: Boolean(tab && tab.id), tabId: tab && tab.id });
  });
  return true;
});
