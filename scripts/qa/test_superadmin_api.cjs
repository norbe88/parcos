// =========================================================================
// QA SUITE — ParcOS SuperAdmin Control Plane REST API E2E
// Invariante: Autentificare strictă, 21% TVA, Cont de Garanție, Netcup VPS
// =========================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

console.log('🧪 [QA TEST] Verificare E2E SuperAdmin Control Plane REST API...');

// 1. Verificare statică cod server/api.mjs
const serverApiCode = fs.readFileSync(path.join(rootDir, 'server', 'api.mjs'), 'utf8');

assert.ok(serverApiCode.includes("SUPERADMIN_MASTER_KEY"), "server/api.mjs exportă SUPERADMIN_MASTER_KEY");
assert.ok(serverApiCode.includes("isAuthorizedSuperAdmin"), "server/api.mjs exportă isAuthorizedSuperAdmin");
assert.ok(serverApiCode.includes("pathname.startsWith('/api/superadmin/')"), "server/api.mjs conține route guard pentru /api/superadmin/*");
assert.ok(serverApiCode.includes("pathname === '/api/superadmin/auth/verify'"), "server/api.mjs conține endpoint-ul /api/superadmin/auth/verify");
assert.ok(serverApiCode.includes("pathname === '/api/superadmin/tenants'"), "server/api.mjs conține CRUD pentru chiriași /api/superadmin/tenants");
assert.ok(serverApiCode.includes("pathname === '/api/superadmin/propagation/feature'"), "server/api.mjs conține 1-click feature propagation");
assert.ok(serverApiCode.includes("updateDealerFeatures"), "server/api.mjs apelează updateDealerFeatures");
assert.ok(serverApiCode.includes("propagateFeatureGlobally"), "server/api.mjs apelează propagateFeatureGlobally");
console.log('  ✅ [PASS] server/api.mjs conține toate endpoint-urile SuperAdmin cerute în Tichetul 03.');

// 2. Test live E2E folosind instanța reală a serverului HTTP din server/api.mjs
(async () => {
  const { server, SUPERADMIN_MASTER_KEY } = await import('../../server/api.mjs');

  const TEST_PORT = 3288;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  await new Promise((resolve, reject) => {
    server.listen(TEST_PORT, '127.0.0.1', () => resolve(true));
    server.once('error', reject);
  });
  console.log(`  🌐 Server live ParcOS ascultă pe portul ${TEST_PORT} pentru teste E2E`);

  try {
    // A. Verificare Respingeri 401 fără antet
    const unauthRes = await fetch(`${baseUrl}/api/superadmin/tenants`);
    assert.strictEqual(unauthRes.status, 401, "Cererea neautorizată primește strict HTTP 401");
    console.log('  ✅ [PASS] Route Guard-ul /api/superadmin/* a respins cererea neautorizată cu 401.');

    // B. Verificare Auth Verify cu antet X-SuperAdmin-Key
    const authVerifyRes = await fetch(`${baseUrl}/api/superadmin/auth/verify`, {
      method: 'POST',
      headers: { 'x-superadmin-key': SUPERADMIN_MASTER_KEY }
    });
    assert.strictEqual(authVerifyRes.status, 200, "Auth verify cu token master returnează 200");
    const authJson = await authVerifyRes.json();
    assert.strictEqual(authJson.authorized, true, "Payload-ul confirmă authorized: true");
    assert.strictEqual(authJson.user, 'ParcOS Master Architect', "Identitate confirmată Master Architect");
    console.log('  ✅ [PASS] POST /api/superadmin/auth/verify a confirmat sesiunea Master Architect.');

    // C. Verificare Listare Chiriași (GET /api/superadmin/tenants)
    const listRes = await fetch(`${baseUrl}/api/superadmin/tenants`, {
      headers: { 'x-superadmin-key': SUPERADMIN_MASTER_KEY }
    });
    assert.strictEqual(listRes.status, 200, "Listare chiriași returnează 200");
    const listJson = await listRes.json();
    assert.ok(listJson.count >= 3, "Există cel puțin 3 dealeri inițiali (rxm, mpi_auto, top_auto)");
    console.log(`  ✅ [PASS] GET /api/superadmin/tenants a returnat ${listJson.count} chiriași.`);

    // D. Înregistrare Showroom Nou (POST /api/superadmin/tenants)
    const createRes = await fetch(`${baseUrl}/api/superadmin/tenants`, {
      method: 'POST',
      headers: {
        'x-superadmin-key': SUPERADMIN_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Nord Auto Transilvania SRL',
        slug: 'nord_auto',
        domain: 'nordauto.ro',
        phonePrimary: '0745 111 222',
        email: 'contact@nordauto.ro',
        cui: 'RO49998888',
        regCom: 'J12/888/2022',
        bankName: 'Banca Transilvania',
        ibanRon: 'RO55 BTRL 0000 1234 5678 9999',
        tier: 'pro',
        status: 'active',
        maxVehiclesQuota: 40,
        themePreset: 'clean_white'
      })
    });
    assert.strictEqual(createRes.status, 201, "Creare showroom returnează 201");
    const createJson = await createRes.json();
    assert.strictEqual(createJson.tenant.slug, 'nord_auto', "Tenant-ul are slug-ul 'nord_auto'");
    console.log('  ✅ [PASS] POST /api/superadmin/tenants a creat showroom-ul "nord_auto".');

    // E. Preluare Detalii Showroom Creat (GET /api/superadmin/tenants/:slug)
    const getTenantRes = await fetch(`${baseUrl}/api/superadmin/tenants/nord_auto`, {
      headers: { 'x-superadmin-key': SUPERADMIN_MASTER_KEY }
    });
    assert.strictEqual(getTenantRes.status, 200, "Preluare tenant returnează 200");
    const getTenantJson = await getTenantRes.json();
    assert.strictEqual(getTenantJson.tenant.cui, 'RO49998888', "CUI-ul salvat coincide cu cel trimis");
    console.log('  ✅ [PASS] GET /api/superadmin/tenants/nord_auto a returnat profilul complet.');

    // F. Actualizare Profil & Cote (PUT /api/superadmin/tenants/:slug)
    const updateRes = await fetch(`${baseUrl}/api/superadmin/tenants/nord_auto`, {
      method: 'PUT',
      headers: {
        'x-superadmin-key': SUPERADMIN_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        city: 'Bistrița',
        maxVehiclesQuota: 60,
        themePreset: 'midnight_blue'
      })
    });
    assert.strictEqual(updateRes.status, 200, "Update tenant returnează 200");
    const updateJson = await updateRes.json();
    assert.strictEqual(updateJson.tenant.city, 'Bistrița', "Orașul a fost actualizat la Bistrița");
    assert.strictEqual(Number(updateJson.tenant.max_vehicles_quota), 60, "Cota a fost majorată la 60 mașini");
    console.log('  ✅ [PASS] PUT /api/superadmin/tenants/nord_auto a salvat cota de 60 mașini și orașul Bistrița.');

    // G. Comutare Feature Flag Tenant (PATCH /api/superadmin/tenants/:slug/features)
    const featurePatchRes = await fetch(`${baseUrl}/api/superadmin/tenants/nord_auto/features`, {
      method: 'PATCH',
      headers: {
        'x-superadmin-key': SUPERADMIN_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tikTokStudio: true,
        autolicitPush: true
      })
    });
    assert.strictEqual(featurePatchRes.status, 200, "Feature patch returnează 200");
    const featurePatchJson = await featurePatchRes.json();
    assert.strictEqual(featurePatchJson.features.tikTokStudio, true, "TikTok Studio a fost activat");
    assert.strictEqual(featurePatchJson.features.autolicitPush, true, "AutoLicit Push a fost activat");
    console.log('  ✅ [PASS] PATCH /api/superadmin/tenants/nord_auto/features a activat modulele cerute.');

    // H. Schimbare Status Dealer (PATCH /api/superadmin/tenants/:slug/status)
    const statusPatchRes = await fetch(`${baseUrl}/api/superadmin/tenants/nord_auto/status`, {
      method: 'PATCH',
      headers: {
        'x-superadmin-key': SUPERADMIN_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'trial' })
    });
    assert.strictEqual(statusPatchRes.status, 200, "Status patch returnează 200");
    const statusPatchJson = await statusPatchRes.json();
    assert.strictEqual(statusPatchJson.status, 'trial', "Statusul a trecut în trial");
    console.log('  ✅ [PASS] PATCH /api/superadmin/tenants/nord_auto/status a trecut showroom-ul în "trial".');

    // I. Propagare 1-Click Feature Flag Global (POST /api/superadmin/propagation/feature)
    const propRes = await fetch(`${baseUrl}/api/superadmin/propagation/feature`, {
      method: 'POST',
      headers: {
        'x-superadmin-key': SUPERADMIN_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        featureKey: 'salesDocsEngine',
        enabled: true
      })
    });
    assert.strictEqual(propRes.status, 200, "Propagarea globală returnează 200");
    const propJson = await propRes.json();
    assert.strictEqual(propJson.success, true, "Propagarea a raportat success: true");
    assert.strictEqual(propJson.featureKey, 'salesDocsEngine', "Feature-ul propagat este salesDocsEngine");
    assert.ok(propJson.updatedCount >= 3, "S-au actualizat toți dealerii activi");
    console.log(`  ✅ [PASS] POST /api/superadmin/propagation/feature a propagat cu succes salesDocsEngine pe ${propJson.updatedCount} dealeri.`);

  } finally {
    await new Promise(r => server.close(r));
    console.log('  🛑 Server live oprit cu succes.');
  }

  console.log('\n🎉 TOATE CRITERIILE DE ACCEPTARE PENTRU TICHETUL 03 & WAVE 1 AU TRECUT CU SUCCES 100%!');
  process.exit(0);
})().catch(err => {
  console.error('❌ Eșec test E2E SuperAdmin:', err);
  process.exit(1);
});
