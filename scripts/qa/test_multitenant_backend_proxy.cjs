// =========================================================================
// QA SUITE — Multi-Tenant Backend-as-a-Proxy & Zero Direct Exposure Test (T02)
// Invariante: 0 chei în client, 0 apeluri client->googleapis.com, Sesiune Tenant
// =========================================================================

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

console.log('🧪 [QA TEST] Verificare Arhitectură Multi-Tenant Backend-as-a-Proxy (T02)...');

// 1. Verificare Frontend Codebase: Niciun apel direct către googleapis.com în fișierele client
const clientFiles = [
  path.join(rootDir, 'src', 'utils', 'geminiVisionEngine.ts'),
  path.join(rootDir, 'src', 'utils', 'documentOcrEngine.ts'),
  path.join(rootDir, 'src', 'utils', 'clientIdOcrEngine.ts'),
  path.join(rootDir, 'src', 'services', 'demoOcrService.ts'),
  path.join(rootDir, 'src', 'services', 'aiDescriptionService.ts'),
  path.join(rootDir, 'src', 'components', 'admin', 'AddVehicleModal.tsx')
];

for (const f of clientFiles) {
  if (fs.existsSync(f)) {
    const code = fs.readFileSync(f, 'utf8');
    assert.ok(
      !code.includes('https://generativelanguage.googleapis.com'),
      `Fișierul client ${path.basename(f)} nu trebuie să conțină apeluri directe către generativelanguage.googleapis.com`
    );
    assert.ok(
      !code.includes('x-goog-api-key'),
      `Fișierul client ${path.basename(f)} nu trebuie să seteze x-goog-api-key direct`
    );
    console.log(`  ✅ [PASS] ${path.basename(f)}: Izolare client confirmată (Zero Direct Key Exposure).`);
  }
}

// 2. Pornire instanță server de test pentru verificare rute backend
(async () => {
  const { 
    server, 
    ADMIN_API_KEY, 
    resolveTenantIdFromReq, 
    isAuthorizedTenantReq 
  } = await import('../../server/api.mjs');

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Server test pornit pe portul efemer ${port}`);

  try {
    // 2.1 Test respingere cerere neautorizată (401 Unauthorized) pe /api/parcos/vehicles/scan-civ
    console.log('🔍 Test 2.1: Verificare 401 pe /api/parcos/vehicles/scan-civ fără sesiune...');
    const unauthOcrRes = await fetch(`${baseUrl}/api/parcos/vehicles/scan-civ`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'dGVzdA==', tenantId: 'rxm' })
    });
    assert.strictEqual(unauthOcrRes.status, 401, 'Scanarea fără sesiune trebuie să returneze strict 401');
    const unauthOcrJson = await unauthOcrRes.json();
    assert.strictEqual(unauthOcrJson.success, false);
    console.log('  ✅ [PASS] 401 Unauthorized confirmat pentru cerere neautentificată.');

    // 2.2 Test respingere cerere neautorizată pe /api/parcos/ai/sanitize-description
    console.log('🔍 Test 2.2: Verificare 401 pe /api/parcos/ai/sanitize-description fără sesiune...');
    const unauthDescRes = await fetch(`${baseUrl}/api/parcos/ai/sanitize-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'BMW', model: 'X5', tenantId: 'rxm' })
    });
    assert.strictEqual(unauthDescRes.status, 401, 'Sanitizarea descrierii fără sesiune trebuie să returneze strict 401');
    console.log('  ✅ [PASS] 401 Unauthorized confirmat pe endpoint-ul de descrieri AI.');

    // 2.2b Test respingere cerere neautorizată pe /api/parcos/clients/scan-id
    console.log('🔍 Test 2.2b: Verificare 401 pe /api/parcos/clients/scan-id fără sesiune...');
    const unauthIdRes = await fetch(`${baseUrl}/api/parcos/clients/scan-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'dGVzdA==', tenantId: 'rxm' })
    });
    assert.strictEqual(unauthIdRes.status, 401, 'Scanarea actului de identitate fără sesiune trebuie să returneze strict 401');
    console.log('  ✅ [PASS] 401 Unauthorized confirmat pe endpoint-ul de scanare buletine.');

    // 2.3 Test cerere autorizată cu sesiune admin / tenant
    console.log('🔍 Test 2.3: Verificare autorizare cu sesiune validă și rezoluție tenant...');
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      'X-Tenant-Id': 'mpi_auto'
    };

    // Test input invalid (lipsă imagine) returnează 400 Bad Request curat, fără crash
    const badInputRes = await fetch(`${baseUrl}/api/parcos/vehicles/scan-civ`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ imageBase64: '' })
    });
    assert.strictEqual(badInputRes.status, 400, 'Lipsa imaginii returnează 400 Bad Request pe scan-civ');

    const badIdInputRes = await fetch(`${baseUrl}/api/parcos/clients/scan-id`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ imageBase64: '' })
    });
    assert.strictEqual(badIdInputRes.status, 400, 'Lipsa imaginii returnează 400 Bad Request pe scan-id');
    console.log('  ✅ [PASS] 400 Bad Request returnat corect la payload incomplet (scan-civ & scan-id).');

    // 2.4 Test live backend-as-a-proxy: Generare descriere AI via Google Gemini (Backend singurul apelant)
    console.log('🔍 Test 2.4: Test live backend proxy pe /api/parcos/ai/sanitize-description...');
    const descRes = await fetch(`${baseUrl}/api/parcos/ai/sanitize-description`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        brand: 'Volkswagen',
        model: 'Passat',
        versionTrim: '2.0 TDI Highline',
        year: 2021,
        specs: '150 CP, Euro 6, Climatronic, Navigație, Faruri LED',
        rawDescription: 'PASSAT 2.0 TDI IMPECABIL SCHIMBAT ULEI RECENT FOARTE INGRIJIT MERITA VAZUT',
        vatDeductible: true,
        warrantyMonths: 12,
        tone: 'editorial',
        tenantId: 'mpi_auto'
      })
    });

    console.log('  Status răspuns proxy:', descRes.status);
    const descData = await descRes.json();
    assert.strictEqual(descRes.status, 200, 'Ruta backend-as-a-proxy trebuie să returneze 200 OK');
    assert.strictEqual(descData.success, true, 'Proprietatea success trebuie să fie true');
    assert.strictEqual(descData.tenantId, 'mpi_auto', 'Tenant-ul trebuie să fie mpi_auto');
    assert.ok(descData.description && descData.description.length > 50, 'Descrierea trebuie generată complet de AI');
    
    // Verificare invariante în descriere
    const lowerDesc = descData.description.toLowerCase();
    assert.ok(!lowerDesc.includes('escrow'), 'Descrierea nu are voie să conțină termenul interzis escrow');
    assert.ok(!lowerDesc.includes('cont fiduciar'), 'Descrierea nu are voie să conțină termenul cont fiduciar');
    assert.ok(lowerDesc.includes('tva') || lowerDesc.includes('21%'), 'Descrierea trebuie să menționeze TVA conform regulilor holdingului');
    console.log('  ✅ [PASS] Descriere generată curat prin backend proxy:', descData.description.slice(0, 120) + '...');

    console.log('\n🎉 TOATE VERIFICĂRILE PENTRU TICHETUL T02 AU TRECUT CU SUCCES 100%!');
  } finally {
    server.close();
  }
})().catch(err => {
  console.error('❌ Eroare test T02:', err);
  process.exit(1);
});
