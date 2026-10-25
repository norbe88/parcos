import http from 'http';
import assert from 'assert';

const PORT = 3001;
process.env.PORT = String(PORT);
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

  console.log('\n======================================================');
  console.log('🏆 TOATE CELE 8 TESTE DE DECUPLARE & SECURITATE AU TRECUT!');
  console.log('======================================================');
} finally {
  server.close();
}
