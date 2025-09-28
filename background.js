chrome.runtime.onInstalled.addListener(() => {
    console.log('🔍 Wallapop API Sniffer instalado');
});

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.url.includes('api.wallapop.com/api/v3/search?') && !details.url.includes('searchalerts')) {
            console.log('🎯 Request interceptado:', details.url);
        }
    },
    {urls: ["*://api.wallapop.com/*"]},
    ["requestBody"]
);

chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.url.includes('api.wallapop.com/api/v3/search?') && !details.url.includes('searchalerts')) {
            console.log('✅ Request completado:', details.url, 'Status:', details.statusCode);
            
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'logApiResponse',
                        url: details.url,
                        status: details.statusCode,
                        data: 'Respuesta interceptada - ver Network tab para detalles'
                    });
                }
            });
        }
    },
    {urls: ["*://api.wallapop.com/*"]}
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (msg.action === 'contentScriptReady') {
      sendResponse({ ok: true });      // responde sincronamente
      return true;
    }

    if (msg.action === 'openConsole') {
      (async () => {
        try {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {action: "focusConsole"});
            }
          });
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
      })();
      return true; // <- crítico en async
    }

    // fallback para acciones desconocidas
    sendResponse({ ok: false, error: 'unknown_action' });
    return true;

  } catch (e) {
    try { sendResponse({ ok: false, error: String(e) }); } catch {}
    return true;
  }
});
