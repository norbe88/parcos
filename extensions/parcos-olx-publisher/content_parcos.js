/**
 * extensions/parcos-olx-publisher/content_parcos.js
 * Content script injectat pe paginile ParcOS (showroom și admin)
 */

(function() {
  console.log('[ParcOS Extension] Content script conectat la instanța ParcOS.');

  // Semnalizare către interfața React că extensia este prezentă și activă
  try {
    document.documentElement.setAttribute('data-parcos-olx-extension', 'installed');
    window.dispatchEvent(new CustomEvent('parcos-olx-extension-ready', { 
      detail: { version: '1.0.0', status: 'ready' } 
    }));
  } catch (e) {}

  // Ascultare evenimente de export emise de OLXExportModal.tsx
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'PARCOS_OLX_EXPORT') return;

    const payload = event.data.payload;
    console.log('[ParcOS Extension] Export detectat din ParcOS UI:', payload?.title);

    chrome.runtime.sendMessage({
      action: 'SAVE_PENDING_CAR',
      payload: payload
    }, (response) => {
      console.log('[ParcOS Extension] Răspuns salvare în background:', response);
    });
  });
})();
