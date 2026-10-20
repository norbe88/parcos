/**
 * RXM Automobile — Automated Live Production & Security Gate Verification (/ttt)
 * Rulare: node scripts/verify_prod_live.cjs
 */

const BASE_URL = process.env.RXM_TARGET_URL || 'https://rxmautomobile.ro';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rxm2026admin!';

async function runLiveVerification() {
  console.log(`\n🔍 [TTT Verification Suite] Începere audit automat pe mediu LIVE: ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Antete de Securitate și Reguli CSP ────────────────────────────
  console.log('📌 Faza 1: Verificare Antete Nginx & Reguli Content-Security-Policy (CSP)');
  try {
    const res = await fetch(BASE_URL, { method: 'GET' });
    assert(res.status === 200, `Pagina principală răspunde HTTP 200 (Status: ${res.status})`);

    const csp = res.headers.get('content-security-policy') || '';
    assert(csp.length > 0, 'Antetul Content-Security-Policy este prezent');
    assert(csp.includes('frame-src'), 'CSP conține directiva frame-src');
    assert(csp.includes('tiktok.com'), 'CSP autorizează iframe-uri TikTok (tiktok.com)');
    assert(csp.includes('youtube.com'), 'CSP autorizează iframe-uri YouTube (youtube.com)');
    assert(csp.includes('media-src'), 'CSP conține directiva media-src pentru streaming video');

    const hsts = res.headers.get('strict-transport-security') || '';
    assert(hsts.includes('max-age'), 'HSTS este activ cu max-age');

    const xcto = res.headers.get('x-content-type-options');
    assert(xcto === 'nosniff', 'X-Content-Type-Options este nosniff');
  } catch (err) {
    assert(false, 'Verificarea antetelor HTTP a eșuat', err.message);
  }

  // ── TEST 2: Data Isolation pe Endpoint-ul Public (/api/vehicles) ───────────
  console.log('\n📌 Faza 2: Verificare Data Isolation Showroom Public (/api/vehicles)');
  try {
    const res = await fetch(`${BASE_URL}/api/vehicles`);
    assert(res.status === 200, `GET /api/vehicles răspunde HTTP 200`);
    const data = await res.json();
    assert(Array.isArray(data.vehicles), `Returnează lista vehiculelor din stoc (Count: ${data.count})`);

    if (data.vehicles && data.vehicles.length > 0) {
      const sample = data.vehicles[0];
      assert(sample.purchasePriceEur === undefined, 'Prețul de achiziție (purchasePriceEur) este STERS pentru public');
      assert(sample.expenses === undefined, 'Cheltuielile interne (expenses) sunt STERSE pentru public');
      assert(sample.auditLog === undefined, 'Jurnalul de audit intern (auditLog) este STERS pentru public');
      assert(sample.raw_data === undefined, 'Obiectul intern raw_data este STERS din payload-ul public');
      assert(parseFloat(sample.vat_rate) === 0.21, 'Invariantă fiscală Carvana SRL: TVA este strict 21% (vat_rate = 0.21)');
    }
  } catch (err) {
    assert(false, 'Verificarea datelor publice a eșuat', err.message);
  }

  // ── TEST 3: Barieră de Mutație Neautorizată (Public POST /api/vehicles) ─────
  console.log('\n📌 Faza 3: Verificare Barieră de Scriere Neautorizată');
  try {
    const res = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'unauthorized_hack_test', brand: 'Test', model: 'Test' })
    });
    assert(res.status === 401, `Tentativa de adăugare/editare fără token este respinsă cu 401 Unauthorized (Status: ${res.status})`);
  } catch (err) {
    assert(false, 'Verificarea barierei de scriere a eșuat', err.message);
  }

  // ── TEST 4: Autentificare Server-Side Administrator (/api/auth/login) ──────
  console.log('\n📌 Faza 4: Verificare Flux Autentificare Administrator (/api/auth/login)');
  let adminToken = '';
  try {
    const wrongRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'parola_gresita_de_test' })
    });
    assert(wrongRes.status === 401, `Parola greșită este respinsă cu 401 Unauthorized (Status: ${wrongRes.status})`);

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD })
    });
    
    if (loginRes.status === 200) {
      const loginData = await loginRes.json();
      assert(loginData.success === true && Boolean(loginData.token), 'Autentificarea cu succes returnează un token de sesiune efemer');
      adminToken = loginData.token;
    } else {
      console.warn(`  ⚠️ Autentificarea cu parola implicită a returnat status ${loginRes.status} (posibil parolă custom în producție).`);
    }
  } catch (err) {
    assert(false, 'Verificarea auth login a eșuat', err.message);
  }

  // ── TEST 5: Acces Protejat Administrator (/api/admin/vehicles) ─────────────
  if (adminToken) {
    console.log('\n📌 Faza 5: Verificare Acces Inventar Complet cu Date Financiare (/api/admin/vehicles)');
    try {
      const adminVehiclesRes = await fetch(`${BASE_URL}/api/admin/vehicles`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });
      assert(adminVehiclesRes.status === 200, `GET /api/admin/vehicles răspunde 200 OK pentru administrator`);
      const adminData = await adminVehiclesRes.json();
      assert(Array.isArray(adminData.vehicles), `Admin-ul primește acces la stocul complet (${adminData.count} mașini)`);
    } catch (err) {
      assert(false, 'Verificarea accesului admin la vehicule a eșuat', err.message);
    }
  }

  // ── REZUMAT FINAL ─────────────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log(`📊 REZULTAT VERIFICARE TTT: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch(err => {
  console.error('Eroare fatală la rularea testelor TTT:', err);
  process.exit(1);
});
