/**
 * ════════════════════════════════════════════════════════════════════════════════
 * Test Suite TDD Sprint 4 — Standalone PWA, Web Push & Mobile Camera
 * Testează: PMH-401, PMH-402, PMH-403, PMH-405
 * Invariante: Strict 21% TVA • Cont de Garanție • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🚀 [TDD Sprint 4] Rulare test suite: PWA, Web Push & Mobile Camera...\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}\n     Eroare: ${err.message}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('📱 [1. PWA Manifest & Service Worker (PMH-401)]');
// ─────────────────────────────────────────────────────────────────────────────

const manifestPath = path.join(__dirname, '../public/manifest-mail.json');
const swPath = path.join(__dirname, '../public/sw-mail.js');

it('public/manifest-mail.json există și este JSON valid', () => {
  assert.ok(fs.existsSync(manifestPath), 'manifest-mail.json lipsește');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.display, 'standalone', 'PWA display trebuie să fie standalone');
  assert.strictEqual(manifest.start_url, '/?tab=mail', 'start_url trebuie să fie /?tab=mail');
  assert.ok(Array.isArray(manifest.shortcuts), 'Shortcuts trebuie să fie un array');
});

it('public/sw-mail.js există și conține handler de push & notificationclick', () => {
  assert.ok(fs.existsSync(swPath), 'sw-mail.js lipsește');
  const swCode = fs.readFileSync(swPath, 'utf8');
  assert.ok(swCode.includes("addEventListener('push'"), 'Handlerul push lipsește');
  assert.ok(swCode.includes("addEventListener('notificationclick'"), 'Handlerul notificationclick lipsește');
  assert.ok(swCode.includes('showNotification'), 'showNotification lipsește');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔔 [2. Web Push Server & Endpoints (PMH-402)]');
// ─────────────────────────────────────────────────────────────────────────────

const apiPath = path.join(__dirname, '../server/api.mjs');
const mailHubPath = path.join(__dirname, '../server/mailHub.mjs');

it('server/api.mjs are rutele /api/mail/push/vapid-key, /subscribe și /test', () => {
  const apiCode = fs.readFileSync(apiPath, 'utf8');
  assert.ok(apiCode.includes('/api/mail/push/vapid-key'), 'Ruta vapid-key lipsește');
  assert.ok(apiCode.includes('/api/mail/push/subscribe'), 'Ruta push subscribe lipsește');
  assert.ok(apiCode.includes('/api/mail/push/test'), 'Ruta push test lipsește');
});

it('server/mailHub.mjs exportă savePushSubscription și getPushSubscriptions', () => {
  const mailHubCode = fs.readFileSync(mailHubPath, 'utf8');
  assert.ok(mailHubCode.includes('export async function savePushSubscription'), 'savePushSubscription lipsește');
  assert.ok(mailHubCode.includes('export async function getPushSubscriptions'), 'getPushSubscriptions lipsește');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📸 [3. Mobile Camera Quick Capture (PMH-403)]');
// ─────────────────────────────────────────────────────────────────────────────

const composerPath = path.join(__dirname, '../src/modules/mail/VehicleOfferComposer.tsx');

it('VehicleOfferComposer.tsx conține captură nativă cameră și compresie canvas', () => {
  const compCode = fs.readFileSync(composerPath, 'utf8');
  assert.ok(compCode.includes('capture="environment"'), 'Atributul capture="environment" lipsește');
  assert.ok(compCode.includes('handleCameraCapture'), 'Handlerul handleCameraCapture lipsește');
  assert.ok(compCode.includes('drawImage'), 'Canvas drawImage pentru compresie lipsește');
  assert.ok(compCode.includes('toDataURL'), 'toDataURL pentru Base64 lipsește');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📁 [4. GDPR Portability Export & Push UI (PMH-405)]');
// ─────────────────────────────────────────────────────────────────────────────

const mailboxLayoutPath = path.join(__dirname, '../src/modules/mail/MailboxLayout.tsx');

it('MailboxLayout.tsx conține export GDPR, toggle Web Push și buton PWA', () => {
  const layoutCode = fs.readFileSync(mailboxLayoutPath, 'utf8');
  assert.ok(layoutCode.includes('handleExportGDPR'), 'handleExportGDPR lipsește');
  assert.ok(layoutCode.includes('handleTogglePush'), 'handleTogglePush lipsește');
  assert.ok(layoutCode.includes('handleInstallPWA'), 'handleInstallPWA lipsește');
  assert.ok(layoutCode.includes('pushNotificationService'), 'pushNotificationService lipsește');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔒 [5. Invariante CARVANA / RXM Automobile]');
// ─────────────────────────────────────────────────────────────────────────────

it('Invariantele de TVA strict 21% și Cont de Garanție sunt prezente în exportul GDPR', () => {
  const layoutCode = fs.readFileSync(mailboxLayoutPath, 'utf8');
  assert.ok(layoutCode.includes('vat_rate: VAT_RATE'), 'TVA rate lipsește din exportul GDPR');
  assert.ok(layoutCode.includes('warranty_term: WARRANTY_TERM'), 'WARRANTY_TERM lipsește din exportul GDPR');
});

console.log(`\n📊 Rezumat TDD Suite: ${passCount} / ${passCount + failCount} teste trecute.`);
if (failCount > 0) {
  console.error('❌ STARE RED: Există teste care au picat.');
  process.exit(1);
} else {
  console.log('🎉 STARE GREEN: Sprint 4 complet validat!');
  process.exit(0);
}
