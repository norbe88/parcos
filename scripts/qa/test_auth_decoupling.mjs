import http from 'http';
import crypto from 'crypto';
import assert from 'assert';

const PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 3289;
const TEST_ADMIN_API_KEY = 'parcos_test_admin_session_key_2026_ok';
process.env.PORT = String(PORT);
process.env.ADMIN_API_KEY = TEST_ADMIN_API_KEY;
process.env.ADMIN_PASSWORD_HASH = 'dbc1d0952684f4b89cc86bc7ffdd52cacc2a79e667b7e0765953069e05bb6589'; // Luna.RXM
process.env.SUPERADMIN_PASSWORD_HASH = 'e180c917ef121846cee6c6b488b9d7a159c12c96880c1901b5a309ca66efb7c2'; // Olaf.0311
process.env.SUPERADMIN_MASTER_KEY = 'parcos_superadmin_dev_secret_2026';

// Importăm serverul din api.mjs
const { server } = await import('../../server/api.mjs');

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`🚀 Test server pornit pe port ${PORT}`);

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data, json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

try {
  console.log('\n--- 1. Test Autentificare ParcOS SuperAdmin (parcos.ro) ---');
  // 1.1 Olaf.0311 pe parcos.ro -> 200 OK + role: superadmin
  const r1 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Host': 'parcos.ro',
      'Content-Type': 'application/json'
    }
  }, { password: 'Olaf.0311', tenantId: 'parcos' });

  assert.strictEqual(r1.status, 200, `Olaf.0311 pe parcos.ro ar trebui să fie 200 OK (primit ${r1.status})`);
  assert.strictEqual(r1.json?.role, 'superadmin', `Rolul pe parcos.ro ar trebui să fie 'superadmin'`);
  assert(r1.json?.token, 'Token-ul superadmin lipsește');
  const superToken = r1.json.token;
  console.log('✅ [PASS] Olaf.0311 pe parcos.ro deblochează cu succes Consola SuperAdmin');

  // 1.2 Luna.RXM pe parcos.ro -> 401 Unauthorized
  const r2 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Host': 'parcos.ro',
      'Content-Type': 'application/json'
    }
  }, { password: 'Luna.RXM', tenantId: 'parcos' });

  assert.strictEqual(r2.status, 401, `Luna.RXM pe parcos.ro ar trebui să fie 401 Unauthorized (primit ${r2.status})`);
  console.log('✅ [PASS] Luna.RXM este categoric respinsă pe parcos.ro (Decuplare completă)');

  console.log('\n--- 2. Test Autentificare RXM Showroom (rxmautomobile.ro) ---');
  // 2.1 Luna.RXM pe rxmautomobile.ro -> 200 OK + role: dealer_admin
  const r3 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Host': 'rxmautomobile.ro',
      'Content-Type': 'application/json'
    }
  }, { password: 'Luna.RXM', tenantId: 'rxm' });

  assert.strictEqual(r3.status, 200, `Luna.RXM pe rxmautomobile.ro ar trebui să fie 200 OK (primit ${r3.status})`);
  assert.strictEqual(r3.json?.role, 'dealer_admin', `Rolul ar trebui să fie dealer_admin`);
  const dealerToken = r3.json.token;
  console.log('✅ [PASS] Luna.RXM deblochează cu succes panoul de gestiune RXM');

  // 2.2 Olaf.0311 pe rxmautomobile.ro -> 200 OK + role: superadmin (Master Override)
  const r4 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Host': 'rxmautomobile.ro',
      'Content-Type': 'application/json'
    }
  }, { password: 'Olaf.0311', tenantId: 'rxm' });

  assert.strictEqual(r4.status, 200, `Olaf.0311 pe rxmautomobile.ro ar trebui să fie 200 OK (Master Override)`);
  assert.strictEqual(r4.json?.role, 'superadmin', `Olaf.0311 pe showroom are rolul de superadmin`);
  console.log('✅ [PASS] Olaf.0311 funcționează ca SuperAdmin Master Override pe showroom');

  console.log('\n--- 3. Test Protecție Verticală & Izolare Roluri ---');
  // 3.1 /api/admin/backups fără token -> 401
  const r5 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/backups',
    method: 'GET'
  });
  assert.strictEqual(r5.status, 401, `/api/admin/backups fără token ar trebui să fie 401 Unauthorized`);
  console.log('✅ [PASS] /api/admin/backups este protejat împotriva accesului anonim');

  // 3.2 /api/admin/backups cu token de dealer -> 401
  const r6 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/backups',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${dealerToken}`
    }
  });
  assert.strictEqual(r6.status, 401, `/api/admin/backups cu token de dealer ar trebui să fie 401`);
  console.log('✅ [PASS] /api/admin/backups respinge token-ul de dealer admin');

  // 3.3 /api/admin/backups cu token de superadmin -> 200
  const r7 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/admin/backups',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${superToken}`
    }
  });
  assert.strictEqual(r7.status, 200, `/api/admin/backups cu superToken ar trebui să fie 200 OK`);
  console.log('✅ [PASS] /api/admin/backups este accesibil exclusiv pentru SuperAdmin');

  // 3.4 POST /api/dealers cu token de dealer -> 401
  const r8 = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/dealers',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${dealerToken}`,
      'Content-Type': 'application/json'
    }
  }, { name: 'Fake Dealer', slug: 'fake' });
  assert.strictEqual(r8.status, 401, `POST /api/dealers cu token dealer trebuie să fie 401`);
  console.log('✅ [PASS] POST /api/dealers respinge dealer admin (doar SuperAdmin poate crea dealeri)');

  console.log('\n--- 4. Tokenul de dealer este legat de host ---');
  const tokenParts = String(dealerToken).split('.');
  assert.strictEqual(tokenParts.length, 4, 'Tokenul nou are patru segmente');
  assert.strictEqual(tokenParts[1], 'rxm', 'Slug-ul din token este parcul hostului');
  assert.strictEqual(r3.json?.dealerSlug, 'rxm');

  const spoofed = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Host': 'rxmautomobile.ro', 'Content-Type': 'application/json' }
  }, { password: 'Luna.RXM', tenantId: 'mpi_auto' });
  assert.strictEqual(spoofed.status, 200);
  assert.strictEqual(spoofed.json?.dealerSlug, 'rxm', 'tenantId din body nu alege parcul');
  assert.strictEqual(String(spoofed.json?.token).split('.')[1], 'rxm');
  console.log('✅ [PASS] Login-ul stampilează slug-ul hostului, nu tenantId din body');

  const onHome = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'rxmautomobile.ro', 'Authorization': `Bearer ${dealerToken}` }
  });
  assert.strictEqual(onHome.status, 200, 'Tokenul RXM este acceptat pe hostul RXM');

  const onNeighbor = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'mpiauto.ro', 'Authorization': `Bearer ${dealerToken}` }
  });
  assert.strictEqual(onNeighbor.status, 401, 'Tokenul RXM este respins pe hostul MPI');
  console.log('✅ [PASS] Tokenul parcului A este respins pe hostul parcului B');

  const superOnMpi = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'mpiauto.ro', 'Authorization': `Bearer ${superToken}` }
  });
  assert.strictEqual(superOnMpi.status, 200, 'Sesiunea SuperAdmin rămâne acceptată pe un host de parc');
  console.log('✅ [PASS] SuperAdmin nu intră în verificarea tokenului de dealer');

  await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { 'Host': 'rxmautomobile.ro', 'Authorization': `Bearer ${dealerToken}` }
  });
  const afterLogout = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'rxmautomobile.ro', 'Authorization': `Bearer ${dealerToken}` }
  });
  assert.strictEqual(afterLogout.status, 200, 'Logout-ul local nu invalidează HMAC-ul înainte de expirare');
  console.log('✅ [PASS] Logout-ul rămâne local procesului');

  const forgedExpires = Date.now() + 60 * 1000;
  const forgedRandom = 'ab'.repeat(16);
  const forgedPayload = `${forgedExpires}.${forgedRandom}`;
  const forgedHmac = crypto.createHmac('sha256', TEST_ADMIN_API_KEY).update(forgedPayload).digest('hex');
  const legacyToken = `${forgedPayload}.${forgedHmac}`;
  const legacyOnRxm = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'rxmautomobile.ro', 'Authorization': `Bearer ${legacyToken}` }
  });
  const legacyOnMpi = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/verify',
    method: 'GET',
    headers: { 'Host': 'mpiauto.ro', 'Authorization': `Bearer ${legacyToken}` }
  });
  assert.strictEqual(legacyOnRxm.status, 200, 'Tokenul vechi rămâne valabil pe RXM');
  assert.strictEqual(legacyOnMpi.status, 401, 'Tokenul vechi este respins pe MPI');
  console.log('✅ [PASS] Forma veche de 3 segmente rămâne doar pe RXM și nu cere harta din memorie');

  const unknownHost = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Host': 'parc-inexistent.example', 'Content-Type': 'application/json' }
  }, { password: 'Luna.RXM', tenantId: 'rxm' });
  assert.strictEqual(unknownHost.status, 404, 'Hostul necunoscut nu emite token de dealer');
  assert.ok(!unknownHost.json?.token, 'Răspunsul nu conține token');
  console.log('✅ [PASS] Hostul necunoscut nu cade pe slug-ul RXM');

  console.log('\n======================================================');
  console.log('🏆 TESTELE DE DECUPLARE, SESIUNE ȘI IZOLARE AU TRECUT');
  console.log('======================================================');
} finally {
  server.close();
}
