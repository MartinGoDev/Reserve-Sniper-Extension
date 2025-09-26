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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openConsole") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "focusConsole"});
        });
    }
});
