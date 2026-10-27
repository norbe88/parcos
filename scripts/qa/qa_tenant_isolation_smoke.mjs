import http from 'http';
import assert from 'assert';

const PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 3293;
process.env.PORT = String(PORT);
process.env.ADMIN_API_KEY = 'parcos_test_admin_session_key_2026_ok';
process.env.ADMIN_PASSWORD_HASH = 'dbc1d0952684f4b89cc86bc7ffdd52cacc2a79e667b7e0765953069e05bb6589';
process.env.SUPERADMIN_PASSWORD_HASH = 'e180c917ef121846cee6c6b488b9d7a159c12c96880c1901b5a309ca66efb7c2';
process.env.SUPERADMIN_MASTER_KEY = 'parcos_superadmin_dev_secret_2026';

function databaseWritesAllowed() {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) return false;
  const raw = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rxm_automobile';
  try {
    const host = new URL(raw).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

const { server } = await import('../../server/api.mjs');
await new Promise((resolve) => server.listen(PORT, resolve));

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, json, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function idsOf(list) {
  return new Set((Array.isArray(list) ? list : []).map((item) => item && item.id).filter(Boolean));
}

try {
  console.log('\n--- Host necunoscut ---');
  const unknown = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/vehicles',
    method: 'GET',
    headers: { Host: 'parc-inexistent.example' },
  });
  assert.strictEqual(unknown.status, 404);
  assert.strictEqual(unknown.json?.error, 'Showroom neconfigurat');
  assert.ok(!Array.isArray(unknown.json?.vehicles), 'Hostul necunoscut nu întoarce stocul RXM');
  console.log('✅ [PASS] Hostul necunoscut nu servește stocul RXM');

  const rxmStock = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/vehicles',
    method: 'GET',
    headers: { Host: 'rxmautomobile.ro' },
  });
  assert.strictEqual(rxmStock.status, 200);
  assert.strictEqual(rxmStock.json?.dealer, 'rxm');
  const mpiStock = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/vehicles',
    method: 'GET',
    headers: { Host: 'mpiauto.ro' },
  });
  assert.strictEqual(mpiStock.status, 200);
  assert.strictEqual(mpiStock.json?.dealer, 'mpi_auto');
  console.log('✅ [PASS] Fiecare host își declară propriul slug de stoc');

  const superLogin = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { Host: 'parcos.ro', 'Content-Type': 'application/json' },
  }, { password: 'Olaf.0311', tenantId: 'parcos' });
  assert.strictEqual(superLogin.status, 200);
  const superToken = superLogin.json.token;

  const repeatRxm = await request({
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/superadmin/tenants',
    method: 'POST',
    headers: {
      Host: 'parcos.ro',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superToken}`,
    },
  }, { name: 'RXM AUTOMOBILE SRL', slug: 'rxm', features: { mailHub: false } });
  assert.strictEqual(repeatRxm.status, 409, 'Reînrolarea slug-ului rxm nu rescrie features');
  console.log('✅ [PASS] Slug-ul existent primește 409');

  async function dealerToken(host) {
    const login = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { Host: host, 'Content-Type': 'application/json' },
    }, { password: 'Luna.RXM' });
    assert.strictEqual(login.status, 200, `Login dealer pe ${host}`);
    return login.json.token;
  }

  const rxmToken = await dealerToken('rxmautomobile.ro');
  const mpiToken = await dealerToken('mpiauto.ro');

  async function readList(path, host, token) {
    return request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: 'GET',
      headers: { Host: host, Authorization: `Bearer ${token}` },
    });
  }

  const rxmLeads = await readList('/api/leads', 'rxmautomobile.ro', rxmToken);
  const mpiLeads = await readList('/api/leads', 'mpiauto.ro', mpiToken);
  assert.strictEqual(rxmLeads.status, 200);
  assert.strictEqual(mpiLeads.status, 200);
  assert.strictEqual(rxmLeads.json.dealerSlug, 'rxm');
  assert.strictEqual(mpiLeads.json.dealerSlug, 'mpi_auto');
  const rxmLeadIds = idsOf(rxmLeads.json.leads);
  const mpiLeadIds = idsOf(mpiLeads.json.leads);
  for (const id of rxmLeadIds) assert.ok(!mpiLeadIds.has(id), `Lead ${id} apare la MPI`);

  const rxmDossiers = await readList('/api/financing-dossiers', 'rxmautomobile.ro', rxmToken);
  const mpiDossiers = await readList('/api/financing-dossiers', 'mpiauto.ro', mpiToken);
  assert.strictEqual(rxmDossiers.status, 200);
  assert.strictEqual(mpiDossiers.status, 200);
  for (const id of idsOf(rxmDossiers.json.dossiers)) {
    assert.ok(!idsOf(mpiDossiers.json.dossiers).has(id), `Dosar ${id} apare la MPI`);
  }

  const rxmMail = await readList('/api/mail/threads', 'rxmautomobile.ro', rxmToken);
  const mpiMail = await readList('/api/mail/threads', 'mpiauto.ro', mpiToken);
  assert.strictEqual(mpiMail.status, 404, 'Mailul MPI rămâne oprit');
  const rxmThreadIds = idsOf(rxmMail.json?.threads);
  const mpiBody = JSON.stringify(mpiMail.json || {});
  for (const id of rxmThreadIds) assert.ok(!mpiBody.includes(id), `Fir ${id} apare la MPI`);
  console.log('✅ [PASS] Lead-ul, dosarul și firul RXM nu apar în GET-ul MPI');

  if (!databaseWritesAllowed()) {
    console.log('⏭️  Baza nu este locală. Sari peste aserțiunile care scriu.');
  } else {
    const stamp = Date.now().toString(36);
    const slug = `zz_smoke_${stamp}`;
    const created = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/superadmin/tenants',
      method: 'POST',
      headers: {
        Host: 'parcos.ro',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`,
      },
    }, {
      name: 'Smoke Park',
      slug,
      domain: `${slug}.example`,
      maxVehiclesQuota: 40,
      features: {
        ocrCivTalon: true,
        financingCalculator: true,
        olxStockSync: true,
        whatsappLeadsBot: true,
        salesDocsEngine: true,
      },
    });
    assert.strictEqual(created.status, 201, created.json?.error || 'create a eșuat');
    const savedFeatures = created.json.tenant.features;
    for (const key of ['reconTracker', 'financingPortfolio', 'googleDriveVault', 'mailHub']) {
      assert.strictEqual(savedFeatures[key], false, `${key} trebuie să fie false`);
    }
    assert.strictEqual(savedFeatures.ocrCivTalon, true);
    assert.strictEqual(savedFeatures.salesDocsEngine, true);
    assert.strictEqual(Number(created.json.tenant.max_vehicles_quota), 40);
    const again = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/superadmin/tenants',
      method: 'POST',
      headers: {
        Host: 'parcos.ro',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`,
      },
    }, { name: 'Smoke Park', slug, features: { mailHub: true } });
    assert.strictEqual(again.status, 409);
    console.log('✅ [PASS] Parcul nou primește flag-urile închise și cota explicită');

    const leadId = `ldsmoke${stamp}`.slice(0, 24);
    const lead = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/leads',
      method: 'POST',
      headers: {
        Host: 'rxmautomobile.ro',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rxmToken}`,
      },
    }, { id: leadId, clientName: 'Smoke Lead', clientPhone: '0700000000' });
    assert.ok(lead.status === 201 || lead.status === 200, `lead ${lead.status}`);
    const mpiAfterLead = await readList('/api/leads', 'mpiauto.ro', mpiToken);
    assert.ok(!idsOf(mpiAfterLead.json.leads).has(leadId), 'Lead-ul nou RXM este vizibil la MPI');

    const dossierId = `dssmoke${stamp}`.slice(0, 24);
    const dossier = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/financing-dossiers',
      method: 'POST',
      headers: {
        Host: 'rxmautomobile.ro',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rxmToken}`,
      },
    }, { id: dossierId, clientName: 'Smoke Dossier' });
    assert.strictEqual(dossier.status, 201, dossier.json?.error || 'dosarul nu s-a creat');
    const mpiAfterDossier = await readList('/api/financing-dossiers', 'mpiauto.ro', mpiToken);
    assert.ok(!idsOf(mpiAfterDossier.json.dossiers).has(dossierId));
    console.log('✅ [PASS] Scrierile locale rămân în parcul care le-a creat');
  }

  console.log('\n🏆 SMOKE-UL DE IZOLARE A TRECUT');
} finally {
  server.close();
}
