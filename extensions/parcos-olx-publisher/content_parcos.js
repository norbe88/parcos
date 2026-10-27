/**
 * extensions/parcos-olx-publisher/content_parcos.js
 * Content script injectat pe paginile ParcOS (showroom și admin pe parcos.ro, localhost, 127.0.0.1)
 */

(function() {
  console.log('[ParcOS Extension] Content script conectat la instanța ParcOS.');

  function broadcastReady() {
    try {
      document.documentElement.setAttribute('data-parcos-olx-extension', 'installed');
      window.dispatchEvent(new CustomEvent('parcos-olx-extension-ready', { 
        detail: { version: '1.1.0', status: 'ready' } 
      }));
      window.postMessage({ type: 'PARCOS_OLX_PONG', version: '1.1.0', status: 'ready' }, '*');
    } catch (e) {}
  }

  // Semnalizare inițială
  broadcastReady();

  // Ascultare evenimente transmise din background către pagina ParcOS
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request && request.type === 'PARCOS_OLX_LINK_BOUND') {
          console.log('[ParcOS Extension] 🔗 Link OLX capturat automat, notificare UI:', request);
          window.postMessage({
            type: 'PARCOS_OLX_LINK_BOUND',
            vehicleId: request.vehicleId,
            olxUrl: request.olxUrl,
            olxId: request.olxId
          }, '*');
          window.dispatchEvent(new CustomEvent('parcos-olx-link-bound', {
            detail: {
              vehicleId: request.vehicleId,
              olxUrl: request.olxUrl,
              olxId: request.olxId
            }
          }));
          sendResponse({ received: true });
        }
      });
    }
  } catch (listenerErr) {
    console.warn('[ParcOS Extension] Eroare atașare listener onMessage:', listenerErr);
  }

  // Ascultare mesaje de la interfața React ParcOS
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    // 1. Verificare ping de stare
    if (event.data.type === 'PARCOS_OLX_PING') {
      broadcastReady();
      return;
    }

    // 2. Export mașină pentru publicare pe OLX
    if (event.data.type === 'PARCOS_OLX_EXPORT') {
      const payload = event.data.payload;
      const openTab = event.data.openTab !== false;
      console.log('[ParcOS Extension] Export detectat din ParcOS UI:', payload?.title, 'openTab:', openTab);

      try {
        chrome.runtime.sendMessage({
          action: openTab ? 'SAVE_AND_OPEN_OLX' : 'SAVE_PENDING_CAR',
          payload: payload
        }, (response) => {
          console.log('[ParcOS Extension] Răspuns salvare în background:', response);
          window.postMessage({ 
            type: 'PARCOS_OLX_EXPORT_SAVED', 
            success: Boolean(response?.success),
            openedTab: Boolean(openTab && response?.tabId),
            title: payload?.title
          }, '*');
        });
      } catch (err) {
        console.error('[ParcOS Extension] Eroare la trimiterea către background:', err);
      }
    }
  });

  // Re-semnalizare periodică discretă la intervale scurte după încărcarea DOM
  setTimeout(broadcastReady, 500);
  setTimeout(broadcastReady, 1500);
})();
