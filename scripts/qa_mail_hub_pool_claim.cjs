/**
 * ════════════════════════════════════════════════════════════════════════════════
 * QA TDD Suite — ParcOS Mail Hub (PMH-304)
 * Multi-Agent Showroom Pool & Claim Routing Engine („Primul venit, primul servit”)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🚀 [TDD PMH-304] Rulare test suite: Showroom Pool & 1-Click Claim Engine...\n');

let testsPassed = 0;
let testsTotal = 0;

function it(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

async function itAsync(name, fn) {
  testsTotal++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

const mailHubPath = path.join(__dirname, '..', 'server', 'mailHub.mjs');
assert(fs.existsSync(mailHubPath), 'Fișierul server/mailHub.mjs lipsește');

const apiPath = path.join(__dirname, '..', 'server', 'api.mjs');
assert(fs.existsSync(apiPath), 'Fișierul server/api.mjs lipsește');

async function runTddSuite() {
  const mailHub = await import(`file://${mailHubPath.replace(/\\/g, '/')}`);
  const apiCode = fs.readFileSync(apiPath, 'utf8');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Verificare Metode Publice Exportate (Seam Boundary)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📦 [1. Seam Boundary & Metode Publice]');
  
  it('mailHub exportă assignThreadToAccount', () => {
    assert(typeof mailHub.assignThreadToAccount === 'function', 'assignThreadToAccount trebuie să fie funcție exportată');
  });

  it('mailHub exportă getMailThreads', () => {
    assert(typeof mailHub.getMailThreads === 'function', 'getMailThreads trebuie să fie funcție exportată');
  });

  it('mailHub exportă getMailAccounts', () => {
    assert(typeof mailHub.getMailAccounts === 'function', 'getMailAccounts trebuie să fie funcție exportată');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Verificare Endpoint /api/mail/threads/:id/assign în api.mjs
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🌐 [2. Rută API /api/mail/threads/:id/assign]');

  it('server/api.mjs are ruta PATCH /api/mail/threads/:id/assign', () => {
    assert(
      apiCode.includes('/assign') && apiCode.includes('assignThreadToAccount'),
      'Ruta PATCH /api/mail/threads/:id/assign nu este mapată în server/api.mjs'
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Verificare Invariant 21% TVA & Netcup VPS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🔒 [3. Invariante CARVANA / RXM Automobile]');

  it('VAT_RATE este strict 0.21 (21%)', () => {
    assert(mailHub.VAT_RATE === 0.21, `VAT_RATE invalid: ${mailHub.VAT_RATE}`);
  });

  it('Terminologia este strict Cont de Garanție', () => {
    assert(mailHub.WARRANTY_ESCROW_TERM === 'Cont de Garanție', 'Termen incorect pentru garanție');
    assert(mailHub.RESERVATION_GUARANTEE_TERM === 'Garanție de Rezervare/Participare', 'Termen incorect pentru rezervare');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Rezumat Rulare TDD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`\n📊 Rezumat TDD Suite: ${testsPassed} / ${testsTotal} teste trecute.`);
  if (testsPassed < testsTotal) {
    console.error(`❌ STARE RED: ${testsTotal - testsPassed} teste eșuate. Se impune implementarea Green.\n`);
    process.exit(1);
  } else {
    console.log(`🎉 STARE GREEN: Toate verificările au trecut cu succes!\n`);
  }
}

runTddSuite().catch((err) => {
  console.error('Fatal TDD Error:', err);
  process.exit(1);
});
