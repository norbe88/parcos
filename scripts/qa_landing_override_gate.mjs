/**
 * ════════════════════════════════════════════════════════════════════════════════
 * QA Test Suite: Landing Host Override Protection Gate
 * Verifică: ?host=parcos.ro funcționează STRICT în dev pe localhost/127.0.0.1
 * și este BLOCAT TOTAL în producție sau pe domeniile dealerilor (ex. rxmautomobile.ro)
 * Invariante: Strict 21% TVA • Cont de Garanție • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

import http from 'http';
import assert from 'assert';

console.log('🚀 [QA Test] Testare Securitate Landing Host Override & Producție Protection...\n');

const TEST_PORT = 4199;
process.env.PORT = String(TEST_PORT);
process.env.AUTO_START_SERVER = 'false';
process.env.NODE_ENV = 'production';

let passCount = 0;
let failCount = 0;

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

function requestHttp(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method: 'GET',
        headers: {
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: raw,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const { server } = await import('../server/api.mjs');

server.listen(TEST_PORT, '127.0.0.1', async () => {
  console.log(`📡 [PROD MODE] Server pornit pe http://127.0.0.1:${TEST_PORT} cu NODE_ENV=production\n`);

  try {
    await it('PROD: GET / pe parcos.ro servește landing v5 curat (200 OK)', async (done) => {
      const res = await requestHttp('/', { Host: 'parcos.ro' });
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.includes('ParcOS'), 'Trebuie să conțină ParcOS');
      assert.ok(res.body.includes('styles.css?v=5'), 'Trebuie să folosească v5 asset versioning');
      assert.ok(res.body.includes('Domeniul e al parcului'), 'Trebuie să includă FAQ domeniul din v5');
      assert.ok(res.body.includes('Contract pe 12 luni'), 'Trebuie să includă oferta de 12 luni din v5');
      done();
    });

    await it('PROD: GET / pe www.parcos.ro servește landing v5 curat (200 OK)', async (done) => {
      const res = await requestHttp('/', { Host: 'www.parcos.ro' });
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.includes('ParcOS'));
      done();
    });

    await it('PROD: GET /?host=parcos.ro pe dealer (rxmautomobile.ro) NU afișează landing-ul (BLOCAT)', async (done) => {
      const res = await requestHttp('/?host=parcos.ro', { Host: 'rxmautomobile.ro' });
      const isLanding = res.body.includes('styles.css?v=5') && res.body.includes('Domeniul e al parcului');
      assert.strictEqual(isLanding, false, 'Override-ul ?host=parcos.ro pe rxmautomobile.ro TREBUIE SĂ FIE IGNORAT în producție');
      done();
    });

    await it('PROD: GET /?landing=true pe dealer (rxmautomobile.ro) NU afișează landing-ul (BLOCAT)', async (done) => {
      const res = await requestHttp('/?landing=true', { Host: 'rxmautomobile.ro' });
      const isLanding = res.body.includes('styles.css?v=5') && res.body.includes('Domeniul e al parcului');
      assert.strictEqual(isLanding, false, 'Override-ul ?landing=true pe rxmautomobile.ro TREBUIE SĂ FIE IGNORAT în producție');
      done();
    });

    await it('PROD: X-Forwarded-Host: rxmautomobile.ro cu ?host=parcos.ro NU este păcălit', async (done) => {
      const res = await requestHttp('/?host=parcos.ro', {
        Host: '127.0.0.1',
        'X-Forwarded-Host': 'rxmautomobile.ro',
      });
      const isLanding = res.body.includes('styles.css?v=5') && res.body.includes('Domeniul e al parcului');
      assert.strictEqual(isLanding, false, 'Reverse proxy spoofing TREBUIE să fie blocat în producție');
      done();
    });

    await it('PROD: /api/lead validare payload și honeypot guard', async (done) => {
      const postReq = (payload) =>
        new Promise((resolve, reject) => {
          const postData = JSON.stringify(payload);
          const r = http.request(
            {
              hostname: '127.0.0.1',
              port: TEST_PORT,
              path: '/api/lead',
              method: 'POST',
              headers: {
                Host: 'parcos.ro',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
              },
            },
            (res) => {
              let b = '';
              res.on('data', (c) => (b += c));
              res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(b || '{}') }));
            }
          );
          r.on('error', reject);
          r.write(postData);
          r.end();
        });

      // Spam bot cu honeypot completat (respingere silențioasă 200 ca să nu alerteze botul)
      const spamRes = await postReq({
        nume: 'Bot Tester',
        telefon: '0740123456',
        website: 'http://spam.com',
        consent: true,
      });
      assert.strictEqual(spamRes.statusCode, 200);
      assert.strictEqual(spamRes.body.ok, true);

      // Telefon invalid
      const badPhoneRes = await postReq({
        nume: 'Ion Popescu',
        telefon: '1234',
        website: '',
        consent: true,
      });
      assert.strictEqual(badPhoneRes.statusCode, 400);
      assert.strictEqual(badPhoneRes.body.ok, false);

      // Valid lead
      const okRes = await postReq({
        nume: 'Alexandru Test',
        telefon: '0740 123 456',
        parc: 'Parc Auto SRL',
        website: '',
        consent: true,
      });
      assert.strictEqual(okRes.statusCode, 200);
      assert.strictEqual(okRes.body.ok, true);
      done();
    });

    console.log(`\n🏁 Rezultate: ${passCount} PASSED, ${failCount} FAILED\n`);
    server.close(() => {
      process.exit(failCount > 0 ? 1 : 0);
    });
  } catch (err) {
    console.error('Fatal error in test assertions:', err);
    server.close(() => {
      process.exit(1);
    });
  }
});
