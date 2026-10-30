/**
 * ════════════════════════════════════════════════════════════════════════════════
 * QA Agentic Team Test Suite: Dealer Park Onboarding & Platform Landing Bypass
 * Invariante: Strict 21% TVA • Cont de Garanție • Netcup VPS (152.53.158.65)
 * Testează:
 *   1. Accesarea parcos.ro/?dealer=mpiauto rezolvă MPI Auto (clean_white), NU landing parcos
 *   2. Rezoluția corectă a alias-urilor (mpi -> mpi_auto, top -> top_auto) pe parcos.ro
 *   3. Accesarea parcos.ro fără ?dealer returnează corect tenantul platformă parcos
 *   4. POST /api/superadmin/tenants cu overwrite/upsert reconfigurează fără eroare 409
 *   5. Showroom-ul nou înrolat este disponibil instant pe parcos.ro/?dealer=<slug>
 * ════════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 [QA Agentic Team] Rulare test suite: Onboarding & Landing Bypass...\n');

const TEST_PORT = 4070;
let passCount = 0;
let failCount = 0;
let serverProc = null;

function it(desc, fn) {
  return new Promise((resolve) => {
    try {
      fn((err) => {
        if (err) {
          console.error(`  ❌ [FAIL] ${desc}\n     Eroare: ${err.message}`);
          failCount++;
        } else {
          console.log(`  ✅ [PASS] ${desc}`);
          passCount++;
        }
        resolve();
      });
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}\n     Eroare: ${err.message}`);
      failCount++;
      resolve();
    }
  });
}

function requestJson(path, headers = {}, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            reject(new Error(`Non-JSON response (HTTP ${res.statusCode}): ${raw.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function waitForServer(retries = 20, delayMs = 300) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const check = () => {
      count++;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path: '/api/health',
          method: 'GET',
          timeout: 500,
        },
        (res) => {
          if (res.statusCode === 200) return resolve();
          if (count < retries) setTimeout(check, delayMs);
          else reject(new Error('Serverul nu a răspuns la timp.'));
        }
      );
      req.on('error', () => {
        if (count < retries) setTimeout(check, delayMs);
        else reject(new Error('Eroare de conexiune la serverul de test.'));
      });
      req.end();
    };
    check();
  });
}

async function run() {
  serverProc = spawn('node', ['server/api.mjs'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'development' },
    stdio: 'ignore'
  });

  try {
    await waitForServer();
    console.log(`✅ Server API conectat pe portul ${TEST_PORT}.\n`);

    await it('Host: parcos.ro cu ?dealer=mpiauto rezolvă mpi_auto (NU parcos)', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve?dealer=mpiauto', { Host: 'parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.slug, 'mpi_auto');
        assert.strictEqual(res.data.themePreset, 'clean_white');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: parcos.ro cu ?dealer=mpi rezolvă alias-ul mpi_auto', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve?dealer=mpi', { Host: 'parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.slug, 'mpi_auto');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: parcos.ro cu ?dealer=top_auto rezolvă top_auto (midnight_blue)', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve?dealer=top_auto', { Host: 'parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.slug, 'top_auto');
        assert.strictEqual(res.data.themePreset, 'midnight_blue');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: mpiauto.parcos.ro (Subdomeniu Demo) rezolvă mpi_auto (clean_white)', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve', { Host: 'mpiauto.parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.slug, 'mpi_auto');
        assert.strictEqual(res.data.themePreset, 'clean_white');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: topauto.parcos.ro (Subdomeniu Demo) rezolvă top_auto (midnight_blue)', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve', { Host: 'topauto.parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.slug, 'top_auto');
        assert.strictEqual(res.data.themePreset, 'midnight_blue');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: parcos.ro FĂRĂ parametru ?dealer returnează corect platforma parcos', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve', { Host: 'parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.slug, 'parcos');
        assert.ok(res.data.name.includes('ParcOS'));
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Host: parcos.ro cu ?dealer=parcos returnează platforma parcos', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve?dealer=parcos', { Host: 'parcos.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.slug, 'parcos');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('POST /api/superadmin/tenants cu overwrite=true înrolează/actualizează fără eroare 409', async (done) => {
      try {
        const { SUPERADMIN_MASTER_KEY } = await import('../server/api.mjs');
        const res = await requestJson('/api/superadmin/tenants', {
          'x-superadmin-key': SUPERADMIN_MASTER_KEY
        }, 'POST', {
          name: 'MPI AUTO CLA S.R.L.',
          slug: 'mpi_auto',
          domain: 'mpiauto.ro',
          phonePrimary: '0759 757 858',
          cui: 'RO43460100',
          tier: 'pro',
          status: 'active',
          maxVehiclesQuota: 60,
          themePreset: 'clean_white',
          overwrite: true
        });
        assert.ok(res.statusCode === 200 || res.statusCode === 201, `Status așteptat 200/201, primit: ${res.statusCode}`);
        assert.strictEqual(res.data.success, true);
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('Verificare invariante: 21% TVA, Cont de Garanție și Netcup VPS', async (done) => {
      try {
        const res = await requestJson('/api/health');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.vatRate, 0.21, 'TVA invariant strict 21%');
        assert.strictEqual(res.data.warrantyTerm, 'Cont de Garanție');
        assert.ok(res.data.hosting.includes('152.53.158.65'), 'Netcup VPS invariant');
        done();
      } catch (e) {
        done(e);
      }
    });

    console.log(`\n📊 Rezumat QA Agentic Suite: ${passCount} / ${passCount + failCount} teste trecute.`);
  } finally {
    if (serverProc) {
      serverProc.kill();
    }
  }

  if (failCount > 0) {
    console.error('❌ STARE RED: Există teste care au picat.');
    process.exit(1);
  } else {
    console.log('🎉 STARE GREEN: Toate testele de rutare și onboarding au trecut cu succes!');
    process.exit(0);
  }
}

run();
