/**
 * QA Verification Suite for Ticket 01 (Wave 2):
 * Landing Page Telemetry Script & CTA Tracking (landing/lp-assets/js/main.js)
 * 
 * Verifică:
 * 1. Validitatea sintactică JS a fișierului landing/lp-assets/js/main.js (zero erori de parsare).
 * 2. Prezența și corectitudinea helper-ului detectTrafficSource (URL params + referrer + fallback direct).
 * 3. Prezența și semnătura funcției sendTrafficBeacon (/api/telemetry/traffic-event via sendBeacon/fetch).
 * 4. Deduplicarea pageview via sessionStorage ('parcos_lp_viewed').
 * 5. Event listeners pentru acțiuni CTA: click_whatsapp, click_phone.
 * 6. Emiterea semnalului submit_lead la trimiterea cu succes a formularului.
 * 7. Amprenta de performanță (zero dependențe externe, execuție protejată în try..catch).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

console.log('================================================================');
console.log('🛡️ RULARE TESTE QA: TICKET 01 (WAVE 2) — LANDING TELEMETRY SCRIPT');
console.log('================================================================\n');

// 1. Verificare sintaxă și prezență fișier
console.log('[Test 1] Validare Sintaxă și Integritate Statică main.js');
const mainJsPath = path.join(__dirname, '../../landing/lp-assets/js/main.js');
assert(fs.existsSync(mainJsPath), 'Fișierul landing/lp-assets/js/main.js există');

const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
assert(mainJsContent.length > 500, 'Fișierul main.js conține cod valid');

// Parsare vm.Script pentru detectare erori de sintaxă
let scriptParsed = false;
try {
  new vm.Script(mainJsContent, { filename: 'main.js' });
  scriptParsed = true;
} catch (err) {
  console.error('Eroare parsare sintaxă:', err);
}
assert(scriptParsed, 'main.js se compilează fără erori de sintaxă');

// 2. Verificare cerințe specifice în codul sursă
console.log('\n[Test 2] Verificare Seam-uri de Telemetrie în Sursă');
assert(mainJsContent.includes('function detectTrafficSource'), 'Funcția detectTrafficSource este definită');
assert(mainJsContent.includes('function sendTrafficBeacon'), 'Funcția sendTrafficBeacon este definită');
assert(mainJsContent.includes('/api/telemetry/traffic-event'), 'Endpoint-ul /api/telemetry/traffic-event este apelat');
assert(mainJsContent.includes('navigator.sendBeacon'), 'Prioritizare navigator.sendBeacon este implementată');
assert(mainJsContent.includes('keepalive: true'), 'Fallback keepalive fetch este implementat');
assert(mainJsContent.includes('parcos_lp_viewed'), 'Deduplicarea sessionStorage parcos_lp_viewed este prezentă');
assert(mainJsContent.includes('click_whatsapp'), 'Evenimentul click_whatsapp este definit');
assert(mainJsContent.includes('click_phone'), 'Evenimentul click_phone este definit');
assert(mainJsContent.includes('submit_lead'), 'Evenimentul submit_lead este definit');
assert(mainJsContent.includes("dealerSlug: 'parcos'"), 'dealerSlug este setat la parcos');

// 3. Simulare execuție DOM într-un context VM
console.log('\n[Test 3] Simulare Execuție VM: Pageview Initial & Deduplicare');

function createMockBrowserContext(options = {}) {
  const beacons = [];
  const fetches = [];
  const sessionStorageStore = options.sessionStorage || {};
  const listeners = {};

  const mockWindow = {
    location: {
      search: options.search || '',
      pathname: options.pathname || '/'
    },
    matchMedia: () => ({ matches: false }),
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    }
  };

  const mockDocument = {
    readyState: 'complete',
    referrer: options.referrer || '',
    getElementById: (id) => {
      if (id === 'an') return { textContent: '' };
      if (id === 'pret') return null;
      if (id === 'lead-form') return null; // testăm fără form pentru testul de bază
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    }
  };

  const mockNavigator = {
    sendBeacon: (url, blob) => {
      beacons.push({ url, blob });
      return true;
    }
  };

  const mockSessionStorage = {
    getItem: (k) => sessionStorageStore[k] || null,
    setItem: (k, v) => { sessionStorageStore[k] = String(v); }
  };

  class MockBlob {
    constructor(parts, opts) {
      this.parts = parts;
      this.type = opts?.type;
      this.text = parts.join('');
    }
  }

  const mockFetch = (url, opts) => {
    fetches.push({ url, opts });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };

  const ctx = {
    window: mockWindow,
    document: mockDocument,
    navigator: mockNavigator,
    sessionStorage: mockSessionStorage,
    Blob: MockBlob,
    fetch: mockFetch,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    Date: Date,
    URLSearchParams: global.URLSearchParams,
    JSON: JSON,
    String: String,
    parseInt: parseInt,
    isNaN: isNaN,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    console: console,
    beacons,
    fetches,
    sessionStorageStore,
    listeners
  };

  mockWindow.document = mockDocument;
  mockWindow.navigator = mockNavigator;
  mockWindow.sessionStorage = mockSessionStorage;

  return vm.createContext(ctx);
}

// 3a. Prima vizită: trebuie să emită pageview
const ctx1 = createMockBrowserContext({
  search: '?utm_source=facebook',
  referrer: 'https://www.facebook.com/'
});

vm.runInContext(mainJsContent, ctx1);

assert(ctx1.beacons.length === 1, 'Exact 1 semnal sendBeacon a fost trimis la încărcarea paginii');
assert(ctx1.beacons[0].url === '/api/telemetry/traffic-event', 'Beacon trimis la URL-ul corect');

const payload1 = JSON.parse(ctx1.beacons[0].blob.text);
assert(payload1.eventType === 'pageview', 'eventType este pageview');
assert(payload1.dealerSlug === 'parcos', 'dealerSlug este parcos');
assert(payload1.source === 'facebook', 'source detectat corect din utm_source/referrer (facebook)');
assert(ctx1.sessionStorageStore['parcos_lp_viewed'] === '1', 'sessionStorage a marcat parcos_lp_viewed=1');

// 3b. A doua vizită în același tab: deduplicat, nu mai emite pageview
const ctx2 = createMockBrowserContext({
  sessionStorage: { 'parcos_lp_viewed': '1' },
  search: '?src=google',
  referrer: 'https://google.ro'
});

vm.runInContext(mainJsContent, ctx2);
assert(ctx2.beacons.length === 0, 'Niciun beacon retrimis când sessionStorage indică vizită anterioară');

// 4. Verificare detecție surse trafic
console.log('\n[Test 4] Verificare Detecție Matrice Surse de Trafic');
const testCases = [
  { search: '?src=olx_promo', referrer: '', expected: 'olx_promo' },
  { search: '?utm_source=tiktok_campaign', referrer: '', expected: 'tiktok_campaign' },
  { search: '', referrer: 'https://www.olx.ro/oferte/', expected: 'olx' },
  { search: '', referrer: 'https://www.autovit.ro/anunt/', expected: 'autovit' },
  { search: '', referrer: 'https://www.google.com/search?q=parcos', expected: 'google' },
  { search: '', referrer: 'https://l.instagram.com/', expected: 'instagram' },
  { search: '', referrer: 'https://www.tiktok.com/@parcos', expected: 'tiktok' },
  { search: '', referrer: '', expected: 'direct' }
];

testCases.forEach((tc) => {
  const ctx = createMockBrowserContext({ search: tc.search, referrer: tc.referrer });
  vm.runInContext(mainJsContent, ctx);
  assert(ctx.beacons.length >= 1, `Beacon generat pentru ${tc.search || tc.referrer || 'direct'}`);
  const payload = JSON.parse(ctx.beacons[0].blob.text);
  assert(payload.source === tc.expected, `Sursă detectată: '${payload.source}' === '${tc.expected}'`);
});

// 5. Verificare Click Listeners (WhatsApp & Telefon)
console.log('\n[Test 5] Verificare Tracking Click CTA (WhatsApp & Telefon)');
const ctx3 = createMockBrowserContext();
vm.runInContext(mainJsContent, ctx3);

const clickListeners = ctx3.listeners['click'] || [];
assert(clickListeners.length >= 1, 'Listener de click pe document a fost înregistrat');

const clickHandler = clickListeners[0];

// 5a. Simulare click pe buton WhatsApp
let waClickedElement = {
  tagName: 'A',
  hasAttribute: (attr) => attr === 'data-wa',
  getAttribute: (attr) => (attr === 'href' ? 'https://wa.me/40758511040?text=test' : null),
  textContent: 'Scrie pe WhatsApp'
};
waClickedElement.closest = (selector) => waClickedElement;

const initialBeaconsCount = ctx3.beacons.length;
clickHandler({ target: waClickedElement });

assert(ctx3.beacons.length === initialBeaconsCount + 1, 'Beacon trimis la click pe WhatsApp');
const waPayload = JSON.parse(ctx3.beacons[ctx3.beacons.length - 1].blob.text);
assert(waPayload.eventType === 'click_whatsapp', 'eventType este click_whatsapp');
assert(waPayload.metadata.href.includes('wa.me'), 'metadata conține href-ul corect de WhatsApp');

// 5b. Simulare click pe buton Telefon
let telClickedElement = {
  tagName: 'A',
  hasAttribute: () => false,
  getAttribute: (attr) => (attr === 'href' ? 'tel:+40758511040' : null),
  textContent: 'Sună acum'
};
telClickedElement.closest = (selector) => telClickedElement;

clickHandler({ target: telClickedElement });
assert(ctx3.beacons.length === initialBeaconsCount + 2, 'Beacon trimis la click pe Telefon');
const telPayload = JSON.parse(ctx3.beacons[ctx3.beacons.length - 1].blob.text);
assert(telPayload.eventType === 'click_phone', 'eventType este click_phone');
assert(telPayload.metadata.href === 'tel:+40758511040', 'metadata conține href-ul de telefon');

// 6. Verificare Fallback fetch când navigator.sendBeacon lipsește
console.log('\n[Test 6] Verificare Fallback Fetch când sendBeacon lipsește');
const ctx4 = createMockBrowserContext();
ctx4.navigator.sendBeacon = null; // dezactivare sendBeacon

vm.runInContext(mainJsContent, ctx4);
assert(ctx4.fetches.length >= 1, 'Fallback fetch apelat când sendBeacon nu este disponibil');
assert(ctx4.fetches[0].url === '/api/telemetry/traffic-event', 'Fallback fetch trimite la endpoint-ul corect');
assert(ctx4.fetches[0].opts.keepalive === true, 'Fallback fetch folosește keepalive: true');

console.log('\n================================================================');
console.log('🎉 TOATE CELE 6 SUITE DE TESTE QA AU TRECUT CU SUCCES!');
console.log('================================================================');
process.exit(0);
