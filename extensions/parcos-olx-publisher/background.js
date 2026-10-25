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
});
