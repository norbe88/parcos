// =========================================================================
// QA SUITE — ParcOS Demo OCR Gateway & Rate Limiting Verification
// Invariante: Max 3 scanări per IP/Device, Zero expunere chei, Gemini 3.8
// =========================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

console.log('🧪 [QA TEST] Verificare Gateway Securizat Demo OCR & Rate-Limiting (ParcOS)...');

// 1. Verificare conținut server/api.mjs
const serverApiCode = fs.readFileSync(path.join(rootDir, 'server', 'api.mjs'), 'utf8');

assert.ok(serverApiCode.includes("DEMO_OCR_MAX_SCANS = 3"), "server/api.mjs definește DEMO_OCR_MAX_SCANS = 3");
assert.ok(serverApiCode.includes("pathname === '/api/demo/ocr-quota'"), "server/api.mjs conține endpoint-ul GET /api/demo/ocr-quota");
assert.ok(serverApiCode.includes("pathname === '/api/demo/ocr-scan'"), "server/api.mjs conține endpoint-ul POST /api/demo/ocr-scan");
assert.ok(serverApiCode.includes("status === 429") || serverApiCode.includes("sendJson(res, 429"), "server/api.mjs returnează HTTP 429 la depășirea limitei de 3 scanări");
assert.ok(serverApiCode.includes("gemini-3.8-flash"), "server/api.mjs apelează modelul Gemini 3.8 Flash");
console.log('  ✅ [PASS] server/api.mjs conține rutele și rate-limiting-ul necesar.');

// 2. Verificare conținut vite.config.ts
const viteConfigCode = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf8');
assert.ok(viteConfigCode.includes("handleDemoOcrProxy"), "vite.config.ts include middleware-ul handleDemoOcrProxy");
assert.ok(viteConfigCode.includes("DEV_DEMO_MAX_SCANS = 3"), "vite.config.ts limitează la 3 scanări demo în dev proxy");
assert.ok(viteConfigCode.includes("/api/demo/ocr-scan"), "vite.config.ts interceptează /api/demo/ocr-scan");
console.log('  ✅ [PASS] vite.config.ts include proxy-ul demo pentru development.');

// 3. Test algoritmic de simulare Rate Limiting
(async () => {
  const { checkDemoOcrLimit, incrementDemoOcrUsage, DEMO_OCR_MAX_SCANS } = await import('../../server/api.mjs');
  
  assert.strictEqual(DEMO_OCR_MAX_SCANS, 3, "Constanta DEMO_OCR_MAX_SCANS este strict 3");

  const testIp = '198.51.100.' + Math.floor(Math.random() * 200 + 10);
  const testToken = 'token_test_' + Date.now();

  // Stare inițială
  let status = checkDemoOcrLimit(testIp, testToken);
  assert.strictEqual(status.allowed, true, "Scanarea inițială este permisă");
  assert.strictEqual(status.remaining, 3, "Inițial sunt 3 scanări rămase");

  // Scanare 1
  let remaining = incrementDemoOcrUsage(testIp, testToken);
  assert.strictEqual(remaining, 2, "După scanarea 1 rămân 2 scanări");

  // Scanare 2
  remaining = incrementDemoOcrUsage(testIp, testToken);
  assert.strictEqual(remaining, 1, "După scanarea 2 rămâne 1 scanare");

  // Scanare 3
  remaining = incrementDemoOcrUsage(testIp, testToken);
  assert.strictEqual(remaining, 0, "După scanarea 3 rămân 0 scanări");

  // Scanare 4 (Trebuie blocată)
  status = checkDemoOcrLimit(testIp, testToken);
  assert.strictEqual(status.allowed, false, "Scanarea 4 este strict blocată");
  assert.strictEqual(status.remaining, 0, "Scanarea 4 raportează 0 rămase");

  console.log('  ✅ [PASS] Rate limiter-ul blochează strict la a 4-a scanare (cota 3/3).');
  console.log('\n🎉 TOATE VERIFICĂRILE PENTRU TICKET 01 AU TRECUT CU SUCCES!');
  process.exit(0);
})();
