/**
 * extensions/parcos-olx-publisher/background.js
 * Service Worker pentru gestionarea stării și a comunicării între ParcOS și OLX.ro
 */

console.log('[ParcOS Extension] Background service worker activat.');

// Ascultare mesaje de la content scripts sau popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_PENDING_CAR') {
    chrome.storage.local.set({ 
      pendingCar: request.payload,
      lastUpdated: Date.now()
    }, () => {
      console.log('[ParcOS Extension] Mașină salvată în storage:', request.payload?.title);
      sendResponse({ success: true, savedAt: Date.now() });
    });
    return true; // Păstrează canalul deschis pentru răspuns asincron
  }

  if (request.action === 'SAVE_AND_OPEN_OLX') {
    chrome.storage.local.set({ 
      pendingCar: request.payload,
      lastUpdated: Date.now()
    }, () => {
      console.log('[ParcOS Extension] Mașină salvată în storage cu deschidere sincronizată OLX:', request.payload?.title);
      chrome.tabs.create({ url: 'https://www.olx.ro/adding/' }, (tab) => {
        sendResponse({ success: true, tabId: tab.id });
      });
    });
    return true;
  }

  if (request.action === 'GET_PENDING_CAR') {
    chrome.storage.local.get(['pendingCar', 'lastUpdated'], (result) => {
      const now = Date.now();
      // Verificăm prospețimea datelor (maxim 120 minute)
      const isFresh = !result.lastUpdated || (now - result.lastUpdated) < 120 * 60 * 1000;
      if (result.pendingCar && isFresh) {
        sendResponse({ success: true, car: result.pendingCar, lastUpdated: result.lastUpdated });
      } else if (result.pendingCar) {
        // Returnăm mașina chiar dacă e mai veche de 2 ore ca rezervă
        sendResponse({ success: true, car: result.pendingCar, isStale: true });
      } else {
        sendResponse({ success: false, car: null });
      }
    });
    return true;
  }

  if (request.action === 'CLEAR_PENDING_CAR') {
    chrome.storage.local.remove(['pendingCar', 'lastUpdated'], () => {
      console.log('[ParcOS Extension] Date mașină curățate din storage.');
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'OPEN_OLX_ADDING') {
    chrome.tabs.create({ url: 'https://www.olx.ro/adding/' }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (request.action === 'FETCH_IMAGE_AS_BASE64') {
    fetch(request.url)
      .then(async (response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const contentType = response.headers.get('content-type') || 'image/webp';
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${contentType};base64,${base64}`;
        sendResponse({ success: true, dataUrl, contentType });
      })
      .catch((err) => {
        console.warn('[ParcOS Background] Eroare fetch imagine:', request.url, err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 7. Salvare automată a link-ului OLX în ParcOS backend (Auto-Link Capture)
  if (request.action === 'SYNC_OLX_LINK_TO_PARCOS' || request.action === 'NOTIFY_OLX_PUBLISHED') {
    const payload = request.payload || {};
    sendOlxLinkToParcos(payload).then((res) => {
      sendResponse(res);
    });
    return true;
  }
});

/**
 * Trimite linkul OLX capturat către endpoint-ul ParcOS backend
 */
async function sendOlxLinkToParcos(payload) {
  const { vehicleId, olxUrl, olxId, origin, adminToken } = payload;
  if (!vehicleId || !olxUrl) {
    console.warn('[ParcOS Background] Parametri lipsă pentru salvare link OLX:', payload);
    return { success: false, error: 'Parametri lipsă (vehicleId și olxUrl sunt obligatorii)' };
  }

  const targetOrigin = (origin || 'https://rxmautomobile.ro').replace(/\/$/, '');
  const endpoint = `${targetOrigin}/api/vehicles/${encodeURIComponent(vehicleId)}/olx-link`;

  console.log(`[ParcOS Background] 🔗 Trimitere link OLX către ParcOS: ${endpoint} -> ${olxUrl}`);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      headers['X-Admin-Token'] = adminToken;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        olxUrl,
        olxId,
        olxStatus: 'active',
        adminToken
      })
    });

    const data = await response.json().catch(() => ({}));
    console.log('[ParcOS Background] Răspuns salvare link OLX din backend:', response.status, data);

    if (response.ok && data.success) {
      // 1. Notificăm toate tab-urile ParcOS deschise pentru actualizare live în interfață
      try {
        chrome.tabs.query({}, (tabs) => {
          for (const tab of tabs) {
            if (tab.id && tab.url && (
              tab.url.includes('parcos.ro') || 
              tab.url.includes('rxmautomobile.ro') || 
              tab.url.includes('localhost') || 
              tab.url.includes('127.0.0.1')
            )) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'PARCOS_OLX_LINK_BOUND',
                vehicleId,
                olxUrl,
                olxId: data.data?.olxId || olxId
              }).catch(() => {});
            }
          }
        });
      } catch (tabErr) {
        console.warn('[ParcOS Background] Eroare notificare tab-uri ParcOS:', tabErr);
      }

      return { success: true, data: data.data };
    }

    return { success: false, error: data.error || `HTTP ${response.status}` };
  } catch (netErr) {
    console.error('[ParcOS Background] Eroare rețea la salvarea linkului OLX:', netErr);
    return { success: false, error: netErr.message };
  }
}

/**
 * Linia 1 de Detecție: Ascultă navigarea tab-urilor
 * Dacă un tab navighează pe o pagină de ofertă OLX nou publicată, captează URL-ul instant
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isOfferPage = tab.url.includes('olx.ro/d/oferta/') || 
                        tab.url.includes('olx.ro/oferta/') ||
                        (tab.url.includes('olx.ro') && tab.url.includes('-ID'));

    if (isOfferPage) {
      chrome.storage.local.get(['pendingCar', 'lastUpdated'], async (result) => {
        const car = result.pendingCar;
        const now = Date.now();
        const isFresh = result.lastUpdated && (now - result.lastUpdated) < 30 * 60 * 1000; // max 30 min

        if (car && isFresh && !car.alreadyLinked && car.vehicleId) {
          console.log('[ParcOS Background] 🎯 S-a detectat pagina ofertei OLX nou create:', tab.url);
          car.alreadyLinked = true;
          car.linkedOlxUrl = tab.url;
          chrome.storage.local.set({ pendingCar: car });

          await sendOlxLinkToParcos({
            vehicleId: car.vehicleId,
            olxUrl: tab.url,
            origin: car.origin,
            adminToken: car.adminToken
          });

          // Trimitem comandă tab-ului OLX să afișeze HUD-ul verde de succes
          chrome.tabs.sendMessage(tabId, {
            action: 'SHOW_LINK_BOUND_HUD',
            olxUrl: tab.url,
            carTitle: car.title || `${car.brand} ${car.model}`
          }).catch(() => {});
        }
      });
    }
  }
});
