/* Small Promise-based compatibility layer for the browser.* APIs used by this extension.
 * Chrome-specific package. It adapts callback-style chrome.* APIs to the Promise style
 * already used by the Firefox/Zen edition. */
(() => {
  'use strict';
  const root = globalThis;
  if (root.browser && root.browser.storage && root.browser.storage.local) return;
  const c = root.chrome;
  if (!c || !c.runtime) throw new Error('A API de extensões do Chrome não está disponível.');

  function callChrome(target, methodName, args) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const callback = (result) => {
        if (settled) return;
        settled = true;
        const lastError = c.runtime.lastError;
        if (lastError) reject(new Error(lastError.message || String(lastError)));
        else resolve(result);
      };
      try {
        target[methodName](...args, callback);
      } catch (error) {
        if (!settled) {
          settled = true;
          reject(error);
        }
      }
    });
  }

  const storageLocal = {
    get: (...args) => callChrome(c.storage.local, 'get', args),
    set: (...args) => callChrome(c.storage.local, 'set', args),
    remove: (...args) => callChrome(c.storage.local, 'remove', args),
    clear: (...args) => callChrome(c.storage.local, 'clear', args)
  };

  const tabs = {
    query: (...args) => callChrome(c.tabs, 'query', args),
    sendMessage: (...args) => callChrome(c.tabs, 'sendMessage', args),
    create: (...args) => callChrome(c.tabs, 'create', args)
  };

  const runtimeOnMessage = {
    addListener(listener) {
      c.runtime.onMessage.addListener((message, sender, sendResponse) => {
        let result;
        try {
          result = listener(message, sender);
        } catch (error) {
          sendResponse({ ok: false, error: String(error && error.message || error) });
          return false;
        }
        if (result && typeof result.then === 'function') {
          result.then(value => {
            if (value !== undefined) sendResponse(value);
          }).catch(error => {
            sendResponse({ ok: false, error: String(error && error.message || error) });
          });
          return true;
        }
        if (result !== undefined) sendResponse(result);
        return false;
      });
    }
  };

  const runtime = {
    getURL: path => c.runtime.getURL(path),
    sendMessage: (...args) => callChrome(c.runtime, 'sendMessage', args),
    onMessage: runtimeOnMessage
  };

  const api = {
    storage: {
      local: storageLocal,
      onChanged: c.storage.onChanged
    },
    tabs,
    runtime
  };
  Object.defineProperty(root, 'browser', {
    value: api,
    configurable: true,
    writable: false,
    enumerable: false
  });
})();
