/**
 * ════════════════════════════════════════════════════════════════════════════════
 * Test Suite TDD: Dealer Park Onboarding & Bulk Inventory Import Pipeline
 * Testează întreg fluxul B2B:
 *   1. Onboarding CLI & Scaffolding (scripts/onboard_dealer.cjs)
 *   2. Registru Central Dealeri (staged_imports/dealers_config.json)
 *   3. Bulk Inventory Importer & AI Sanitizer (scripts/bulk_inventory_importer.cjs)
 *   4. Audit Trail Ingestion (staged_imports/ingestion_history.json)
 *   5. API Tenant Config & Rezoluție (server/api.mjs)
 *   6. Invariante Holding: Strict 21% TVA • Cont de Garanție • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { spawn, execSync } = require('child_process');

console.log('🚀 [TDD E2E] Rulare test suite complet: Dealer Park Onboarding & Bulk Inventory Pipeline...\n');

const ROOT_DIR = path.resolve(__dirname, '..');
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

function requestJson(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: urlPath,
        method: 'GET',
        headers: { Accept: 'application/json', ...headers },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            reject(new Error(`Non-JSON response (HTTP ${res.statusCode}): ${raw.slice(0, 150)}`));
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
        else reject(new Error('Eroare conexiune la serverul de test.'));
      });
      req.end();
    };
    check();
  });
}

async function runTestSuite() {
  // Pornire server API pe port 4050
  console.log(`📡 Pornire server API pe portul ${TEST_PORT}...`);
  serverProc = spawn('node', ['server/api.mjs'], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'development' },
    stdio: 'ignore',
  });

  try {
    await waitForServer();
    console.log(`✅ Server API conectat și gata de teste.\n`);

    // TEST 1: Invariant Netcup VPS & TVA 21% pe /api/health
    await it('Invariant Holding: /api/health garantează Netcup VPS (152.53.158.65), 21% TVA și Cont de Garanție', async (done) => {
      try {
        const res = await requestJson('/api/health');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.status, 'healthy');
        assert.strictEqual(res.data.vatRate, 0.21, 'TVA trebuie să fie strict 21%');
        assert.strictEqual(res.data.warrantyTerm, 'Cont de Garanție');
        assert.ok(res.data.hosting.includes('152.53.158.65'), 'Hosting invariant Netcup VPS');
        done();
      } catch (e) {
        done(e);
      }
    });

    // TEST 2: Onboard Dealer CLI Scaffolding
    const testSlug = 'autonord_cluj';
    await it('CLI Onboarding: onboard_dealer.cjs generează structura de foldere și actualizează dealers_config.json', async (done) => {
      try {
        const cmd = `node scripts/onboard_dealer.cjs --slug=${testSlug} --name="Auto Nord Transilvania S.R.L." --domain=autonordcluj.ro --cui=RO43460100 --theme=clean_white --phone="0740 999 888"`;
        execSync(cmd, { cwd: ROOT_DIR, stdio: 'ignore' });

        // Verificăm directoarele create
        const rawPhotosDir = path.join(ROOT_DIR, 'staged_imports', testSlug, 'raw_photos');
        const readyDir = path.join(ROOT_DIR, 'staged_imports', testSlug, 'ready_for_upload');
        const publicDir = path.join(ROOT_DIR, 'public', 'images', 'dealers', testSlug);

        assert.ok(fs.existsSync(rawPhotosDir), 'staged_imports/<slug>/raw_photos trebuie să existe');
        assert.ok(fs.existsSync(readyDir), 'staged_imports/<slug>/ready_for_upload trebuie să existe');
        assert.ok(fs.existsSync(publicDir), 'public/images/dealers/<slug> trebuie să existe');

        // Verificăm registrul central dealers_config.json
        const configPath = path.join(ROOT_DIR, 'staged_imports', 'dealers_config.json');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        assert.ok(configData[testSlug], 'dealers_config.json trebuie să conțină noul dealer');
        assert.strictEqual(configData[testSlug].vatRate, 0.21, 'TVA invariant 21% în config');
        assert.strictEqual(configData[testSlug].partnerTier, 'FOUNDER_VIP');
        assert.strictEqual(configData[testSlug].isVip, true);

        done();
      } catch (e) {
        done(e);
      }
    });

    // TEST 3: Bulk Inventory Importer & Description Sanitizer
    await it('CLI Importer: bulk_inventory_importer.cjs normalizează vehicule, curăță spamul și calculează TVA 21%', async (done) => {
      try {
        const cmd = `node scripts/bulk_inventory_importer.cjs --dealer=${testSlug}`;
        execSync(cmd, { cwd: ROOT_DIR, stdio: 'ignore' });

        const importedFile = path.join(ROOT_DIR, 'staged_imports', testSlug, 'imported_vehicles.json');
        assert.ok(fs.existsSync(importedFile), 'imported_vehicles.json trebuie să existe');

        const vehicles = JSON.parse(fs.readFileSync(importedFile, 'utf8'));
        assert.ok(Array.isArray(vehicles) && vehicles.length >= 2, 'Lotul importat trebuie să conțină cel puțin 2 vehicule');

        const v1 = vehicles[0];
        assert.strictEqual(v1.dealer_slug, testSlug);
        assert.strictEqual(v1.status, 'draft', 'Status inițial obligatoriu: draft');
        assert.strictEqual(v1.requiresAdminApproval, true, 'requiresAdminApproval trebuie să fie true');
        assert.strictEqual(v1.vat_rate, 0.21, 'TVA strict 21%');

        // Verificare calcul Net = Gross / 1.21
        const expectedNet = Math.round(v1.price_eur / 1.21);
        assert.strictEqual(v1.raw_data.netPriceEur, expectedNet, 'Calcul net price corect cu cota 21%');

        // Verificare sanitizare descriere
        assert.ok(!v1.description.toLowerCase().includes('tbi bank'), 'Spamul de bancă TBI trebuie eliminat');
        assert.ok(!v1.description.toLowerCase().includes('buletinul'), 'Spamul de credit cu buletinul trebuie eliminat');
        assert.ok(v1.description.includes('Cont de Garanție (Banca Transilvania)'), 'Descrierea trebuie să conțină Cont de Garanție');
        assert.ok(v1.description.includes('Verificare carVertical disponibilă în platformă'), 'Zero false claims carVertical');

        done();
      } catch (e) {
        done(e);
      }
    });

    // TEST 4: Audit Trail Ingestion History
    await it('Audit Trail: staged_imports/ingestion_history.json înregistrează corect batchId-ul lotului importat', async (done) => {
      try {
        const histPath = path.join(ROOT_DIR, 'staged_imports', 'ingestion_history.json');
        assert.ok(fs.existsSync(histPath));
        const history = JSON.parse(fs.readFileSync(histPath, 'utf8'));
        const lastEntry = history[history.length - 1];

        assert.strictEqual(lastEntry.dealerKey, testSlug);
        assert.strictEqual(lastEntry.status, 'COMPLETED');
        assert.ok(lastEntry.batchId.startsWith(`BATCH-${testSlug.toUpperCase()}`));
        assert.ok(Array.isArray(lastEntry.vehicleIds) && lastEntry.vehicleIds.length >= 2);
        done();
      } catch (e) {
        done(e);
      }
    });

    // TEST 5: API Multi-Domain Routing & Resolution
    await it('API Routing: /api/tenant-config?dealer=autonord_cluj returnează profilul configurat și tema clean_white', async (done) => {
      try {
        const res = await requestJson(`/api/tenant-config?dealer=${testSlug}`);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.dealer.slug, testSlug);
        assert.strictEqual(res.data.themePreset, 'clean_white');
        assert.strictEqual(res.data.vatRate, 0.21);
        assert.strictEqual(res.data.warrantyTerm, 'Cont de Garanție');
        done();
      } catch (e) {
        done(e);
      }
    });

    // TEST 6: API Dealers List
    await it('API Dealers: /api/dealers listează showroom-urile active din ecosistem', async (done) => {
      try {
        const res = await requestJson('/api/dealers');
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.dealers));
        assert.ok(res.data.dealers.length >= 3, 'Trebuie să avem cel puțin 3 dealeri activi');
        done();
      } catch (e) {
        done(e);
      }
    });

    console.log(`\n📊 Rezumat Test Suite Pipeline: ${passCount} / ${passCount + failCount} teste trecute.`);
  } finally {
    if (serverProc) {
      serverProc.kill();
    }
  }

  if (failCount > 0) {
    console.error('❌ STARE RED: Există teste care au picat.');
    process.exit(1);
  } else {
    console.log('🎉 STARE GREEN: Pipeline Onboarding & Bulk Import complet validat!');
    process.exit(0);
  }
}

runTestSuite();
