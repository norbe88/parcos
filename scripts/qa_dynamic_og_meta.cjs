const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 [QA Test] Verificare Dynamic Open Graph & Metadata Injection (parcos.ro vs rxmautomobile.ro)...\n');

const TEST_PORT = 4125;
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

function requestHtml(urlPath, hostHeader) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: urlPath,
        method: 'GET',
        headers: {
          'Host': hostHeader,
          'User-Agent': 'WhatsApp/2.23.20.76 A', // Crawler WhatsApp
          'Accept': 'text/html,application/xhtml+xml',
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: raw });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function waitForServer(retries = 30, delayMs = 200) {
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
          timeout: 400,
        },
        (res) => {
          if (res.statusCode === 200) return resolve();
          if (count < retries) setTimeout(check, delayMs);
          else reject(new Error('Serverul nu a pornit la timp.'));
        }
      );
      req.on('error', () => {
        if (count < retries) setTimeout(check, delayMs);
        else reject(new Error('Eroare de conexiune la server.'));
      });
      req.end();
    };
    check();
  });
}

async function runTests() {
  const serverPath = path.resolve(__dirname, '..', 'server', 'api.mjs');
  const serverProc = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stderr.on('data', (d) => {
    // console.error('[Proc Err]', d.toString());
  });

  try {
    await waitForServer();
    console.log('📡 Serverul de test a pornit cu succes pe portul', TEST_PORT, '\n');

    // ── TEST 1: Accesare parcos.ro ──────────────────────────────────────────
    await it('GET / cu Host: parcos.ro returnează Open Graph și Title strict pentru ParcOS', async (done) => {
      const res = await requestHtml('/', 'parcos.ro');
      assert.strictEqual(res.statusCode, 200);
      
      // Verificare titlu ParcOS (DMS & CRM cu AI)
      assert(res.body.includes('<title>ParcOS — Cel mai bun DMS &amp; CRM Auto cu AI din România | Program Parcuri Auto</title>') ||
             res.body.includes('<title>ParcOS — Cel mai bun DMS & CRM Auto cu AI din România | Program Parcuri Auto</title>'),
             'Titlul paginii trebuie să fie cel dedicat ParcOS');

      // Verificare OG tags
      assert(res.body.includes('property="og:site_name" content="ParcOS"'), 'og:site_name trebuie să fie ParcOS');
      assert(res.body.includes('property="og:title" content="ParcOS — Cel mai bun DMS &amp; CRM Auto cu AI din România"') ||
             res.body.includes('property="og:title" content="ParcOS — Cel mai bun DMS & CRM Auto cu AI din România"'),
             'og:title trebuie să fie cel dedicat ParcOS');
      assert(res.body.includes('property="og:image" content="https://parcos.ro/brand/parcos-og-icon.png"'),
             'og:image trebuie să trimită strict la https://parcos.ro/brand/parcos-og-icon.png');
      assert(!res.body.includes('property="og:image" content="https://parcos.ro/brand/parcos-og-card.png"'),
             'NU trebuie să existe al doilea og:image cu bannerul orizontal');
      assert(res.body.includes('property="og:url" content="https://parcos.ro/"'),
             'og:url trebuie să fie https://parcos.ro/');

      // Verificare absență branding RXM în titlu pe domeniul parcos.ro
      assert(!res.body.includes('<title>RXM AUTO MOBILE'), 'Titlul NU trebuie să conțină RXM AUTO MOBILE');
      assert(!res.body.includes('property="og:title" content="RXM AUTO MOBILE'), 'og:title NU trebuie să fie RXM AUTO MOBILE');
      assert(!res.body.includes('/rxm/images/rxm-emblem.png'), 'og:image NU trebuie să fie emblema RXM pe parcos.ro');

      // Verificare Schema SoftwareApplication
      assert(res.body.includes('"@type": "SoftwareApplication"'), 'Schema.org trebuie să conțină SoftwareApplication');
      assert(res.body.includes('"name": "ParcOS"'), 'Schema.org trebuie să fie pentru ParcOS');

      done();
    });

    // ── TEST 2: Accesare rxmautomobile.ro ────────────────────────────────────
    await it('GET / cu Host: rxmautomobile.ro returnează Open Graph și Title strict pentru RXM Automobile', async (done) => {
      const res = await requestHtml('/', 'rxmautomobile.ro');
      assert.strictEqual(res.statusCode, 200);

      // Verificare titlu RXM
      assert(res.body.includes('RXM AUTO MOBILE — Autovehicule Rulate Premium | Cluj-Napoca'),
             'Titlul paginii trebuie să fie RXM Automobile');
      assert(res.body.includes('property="og:site_name" content="RXM AUTO MOBILE"'),
             'og:site_name trebuie să fie RXM AUTO MOBILE');
      assert(res.body.includes('https://rxmautomobile.ro/rxm/images/rxm-emblem.png'),
             'og:image trebuie să conțină emblema RXM');
      assert(res.body.includes('"@type": "AutoDealer"'),
             'Schema.org trebuie să conțină AutoDealer');
      assert(res.body.includes('"name": "RXM AUTO MOBILE"'),
             'Schema.org trebuie să fie pentru RXM AUTO MOBILE');

      done();
    });

    // ── TEST 3: Partajare vehicul dedicat pe rxmautomobile.ro (?car=...) ─────
    await it('GET /?car=audi-a6-2011-l0lya cu Host: rxmautomobile.ro generează card dedicat mașinii', async (done) => {
      const res = await requestHtml('/?car=audi-a6-2011-l0lya', 'rxmautomobile.ro');
      assert.strictEqual(res.statusCode, 200);

      // Verificare că og:type este article sau conține brandul mașinii
      assert(res.body.includes('property="og:type" content="article"'), 'og:type trebuie să fie article pentru o mașină');
      assert(res.body.includes('Audi A6'), 'Titlul trebuie să conțină marca și modelul mașinii');
      assert(res.body.includes('property="og:url" content="https://rxmautomobile.ro/?car=audi-a6-2011-l0lya"'), 'og:url conține parametrul mașinii');
      done();
    });

    // ── TEST 4: Sitemap diferențiat pe parcos.ro ─────────────────────────────
    await it('GET /sitemap.xml cu Host: parcos.ro returnează sitemap-ul ParcOS', async (done) => {
      const res = await requestHtml('/sitemap.xml', 'parcos.ro');
      assert.strictEqual(res.statusCode, 200);
      assert(res.body.includes('https://parcos.ro/'), 'Sitemap-ul trebuie să conțină URL-uri parcos.ro');
      assert(!res.body.includes('https://rxmautomobile.ro/'), 'Sitemap-ul pe parcos.ro NU trebuie să conțină rxmautomobile.ro');
      done();
    });

    // ── TEST 5: LLM manifest pe parcos.ro (GEO ChatGPT / Gemini) ───────────
    await it('GET /llms.txt cu Host: parcos.ro returnează manifestul dedicat ParcOS DMS & CRM', async (done) => {
      const res = await requestHtml('/llms.txt', 'parcos.ro');
      assert.strictEqual(res.statusCode, 200);
      assert(res.body.includes('ParcOS — Cel mai bun DMS & CRM Auto cu Inteligență Artificială din România'), 'llms.txt trebuie să conțină manifestul ParcOS');
      assert(res.body.includes('Dealer Management System'), 'llms.txt trebuie să conțină Dealer Management System');
      assert(!res.body.includes('RXM AUTO MOBILE S.R.L.'), 'llms.txt pe parcos.ro NU trebuie să conțină RXM Automobile');
      done();
    });

    // ── TEST 6: Robots.txt pe parcos.ro (Allowlist Agenți AI) ────────────────
    await it('GET /robots.txt cu Host: parcos.ro permite ChatGPT, Gemini, Claude, Bingbot', async (done) => {
      const res = await requestHtml('/robots.txt', 'parcos.ro');
      assert.strictEqual(res.statusCode, 200);
      assert(res.body.includes('User-agent: GPTBot'), 'Robots.txt trebuie să permită GPTBot');
      assert(res.body.includes('User-agent: OAI-SearchBot'), 'Robots.txt trebuie să permită OAI-SearchBot');
      assert(res.body.includes('User-agent: PerplexityBot'), 'Robots.txt trebuie să permită PerplexityBot');
      assert(res.body.includes('Sitemap: https://parcos.ro/sitemap.xml'), 'Robots.txt trebuie să trimită la sitemap-ul parcos.ro');
      done();
    });


  } finally {
    serverProc.kill();
  }

  console.log(`\n📊 Rezultat final: ${passCount} trecute, ${failCount} eșuate`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
