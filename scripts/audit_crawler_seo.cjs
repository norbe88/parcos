const http = require('http');
const { spawn } = require('child_process');

async function testCrawler() {
  const serverProc = spawn('node', ['server/api.mjs'], { env: { ...process.env, PORT: '4129', NODE_ENV: 'test' } });
  
  await new Promise(r => setTimeout(r, 1200));

  const testUrls = [
    // parcos.ro
    { host: 'parcos.ro', path: '/' },
    { host: 'parcos.ro', path: '/pret' },
    { host: 'parcos.ro', path: '/functii' },
    { host: 'parcos.ro', path: '/cum-incepi' },
    { host: 'parcos.ro', path: '/faq' },
    { host: 'parcos.ro', path: '/dms-crm' },
    { host: 'parcos.ro', path: '/termeni-si-conditii' },
    { host: 'parcos.ro', path: '/politica-de-confidentialitate' },
    { host: 'parcos.ro', path: '/politica-de-cookies' },
    { host: 'parcos.ro', path: '/llms.txt' },
    { host: 'parcos.ro', path: '/llms-full.txt' },
    { host: 'parcos.ro', path: '/sitemap.xml' },
    { host: 'parcos.ro', path: '/robots.txt' },
    { host: 'parcos.ro', path: '/api/lead' },
    { host: 'parcos.ro', path: '/downloads/' },
    // rxmautomobile.ro
    { host: 'rxmautomobile.ro', path: '/' },
    { host: 'rxmautomobile.ro', path: '/#catalog' },
    { host: 'rxmautomobile.ro', path: '/#ghid-auto' },
    { host: 'rxmautomobile.ro', path: '/#ghid-auto/calculator-impozit-auto' },
    { host: 'rxmautomobile.ro', path: '/#finantare' },
    { host: 'rxmautomobile.ro', path: '/#buyback' },
    { host: 'rxmautomobile.ro', path: '/#comanda' },
    { host: 'rxmautomobile.ro', path: '/#contact' },
    { host: 'rxmautomobile.ro', path: '/livrare' },
    { host: 'rxmautomobile.ro', path: '/termeni-si-conditii' },
    { host: 'rxmautomobile.ro', path: '/politica-de-cookies' },
    { host: 'rxmautomobile.ro', path: '/politica-de-confidentialitate' },
    { host: 'rxmautomobile.ro', path: '/finantare' },
    { host: 'rxmautomobile.ro', path: '/buyback' },
    { host: 'rxmautomobile.ro', path: '/comanda' },
    { host: 'rxmautomobile.ro', path: '/contact' },
    { host: 'rxmautomobile.ro', path: '/ghid-auto/calculator-impozit-auto' },
    { host: 'rxmautomobile.ro', path: '/?car=audi-a6-2011-l0lya' },
    { host: 'rxmautomobile.ro', path: '/cars/audi-a6-2011-l0lya' },
    { host: 'rxmautomobile.ro', path: '/unknown-page-test-404' }
  ];

  console.log('--- CRAWLER AUDIT RESULTS ---');
  for (const item of testUrls) {
    await new Promise(resolve => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 4129,
        path: item.path,
        headers: { Host: item.host, 'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' }
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          const titleMatch = b.match(/<title>([^<]*)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : null;
          const descMatch = b.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
          const desc = descMatch ? descMatch[1].trim() : null;
          const canonicalMatch = b.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
          const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
          
          console.log(`[${item.host}${item.path}]`);
          console.log(`  Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']}`);
          console.log(`  Title: ${title ? `"${title}"` : '🚨 MISSING TITLE!'}`);
          console.log(`  Desc:  ${desc ? `"${desc.slice(0, 70)}..."` : '🚨 MISSING DESC!'}`);
          console.log(`  Canon: ${canonical || 'NONE'}`);
          resolve();
        });
      });
      req.on('error', e => {
        console.error(`Error on ${item.path}:`, e.message);
        resolve();
      });
      req.end();
    });
  }

  serverProc.kill();
}

testCrawler().catch(console.error);
