/**
 * ════════════════════════════════════════════════════════════════════════════════
 * Test Suite TDD: Multi-Tenant Backend Routing & Dynamic Tenant Config
 * Testează: 01-db-schema-and-tenant-config-table.md & 02-backend-multi-domain-routing-and-api.md
 * Invariante: Strict 21% TVA • Cont de Garanție • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 [TDD Multi-Tenant] Rulare test suite: Tenant Routing & Config API...\n');

const TEST_PORT = 4050;
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

function requestJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method: 'GET',
        headers: {
          Accept: 'application/json',
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

async function runAllTests() {
  console.log(`📡 Pornire server API pe portul ${TEST_PORT}...`);
  serverProc = spawn('node', ['server/api.mjs'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'development' },
    stdio: 'ignore'
  });

  try {
    await waitForServer();
    console.log(`✅ Server API conectat și gata de teste.\n`);

    await it('GET /api/health returnează status healthy, dealer rxm și Netcup VPS', async (done) => {
      try {
        const res = await requestJson('/api/health');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.status, 'healthy');
        assert.strictEqual(res.data.vatRate, 0.21, 'TVA invariant strict 21%');
        assert.strictEqual(res.data.warrantyTerm, 'Cont de Garanție');
        assert.ok(res.data.hosting.includes('152.53.158.65'), 'Hosting invariant Netcup VPS');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('GET /api/tenant-config returnează profilul implicit RXM (obsidian_gold)', async (done) => {
      try {
        const res = await requestJson('/api/tenant-config');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.dealer.slug, 'rxm');
        assert.strictEqual(res.data.themePreset, 'obsidian_gold');
        assert.strictEqual(res.data.vatRate, 0.21);
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('GET /api/tenant-config?dealer=mpi_auto returnează MPI Auto (clean_white)', async (done) => {
      try {
        const res = await requestJson('/api/tenant-config?dealer=mpi_auto');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.dealer.slug, 'mpi_auto');
        assert.ok(res.data.themePreset === 'mpi_signature' || res.data.themePreset === 'clean_white');
        assert.ok(res.data.dealer.name.includes('MPI AUTO'));
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('GET /api/tenant-config cu Host: topautotransilvania.ro returnează Top Auto (midnight_blue)', async (done) => {
      try {
        const res = await requestJson('/api/tenant-config', { Host: 'topautotransilvania.ro' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.dealer.slug, 'top_auto');
        assert.strictEqual(res.data.themePreset, 'midnight_blue');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('GET /api/tenant/resolve returnează slug-ul corect rezolvat', async (done) => {
      try {
        const res = await requestJson('/api/tenant/resolve?dealer=mpi_auto');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.slug, 'mpi_auto');
        done();
      } catch (e) {
        done(e);
      }
    });

    await it('GET /api/dealers listează showroom-urile active', async (done) => {
      try {
        const res = await requestJson('/api/dealers');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.dealers), 'dealers trebuie să fie un array');
        assert.ok(res.data.dealers.length >= 1, 'cel puțin un dealer activ');
        done();
      } catch (e) {
        done(e);
      }
    });

    console.log(`\n📊 Rezumat TDD Suite: ${passCount} / ${passCount + failCount} teste trecute.`);
  } finally {
    if (serverProc) {
      serverProc.kill();
    }
  }

  if (failCount > 0) {
    console.error('❌ STARE RED: Există teste care au picat.');
    process.exit(1);
  } else {
    console.log('🎉 STARE GREEN: Multi-Tenant Engine complet validat!');
    process.exit(0);
  }
}

runAllTests();
