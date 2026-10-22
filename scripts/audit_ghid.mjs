import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching sitemap...');
  const sitemapXml = await fetchUrl('https://www.carmatik.ro/ghid-auto-carmatik/sitemap.xml');
  console.log(`Fetched sitemap: ${sitemapXml.length} bytes`);
  
  const matches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`Found ${matches.length} total URLs in sitemap`);

  const categories = matches.filter(u => u.includes('/categorie/'));
  const calculator = matches.filter(u => u.includes('calculator'));
  const articles = matches.filter(u => !u.includes('/categorie/') && !u.includes('calculator') && u !== 'https://ghid.carmatik.ro/ghid-auto-carmatik/');

  console.log(`Categories (${categories.length}):`, categories);
  console.log(`Calculators (${calculator.length}):`, calculator);
  console.log(`Articles count: ${articles.length}`);

  const outDir = path.resolve('audit-baseline/ghid-auto');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'all-urls.json'), JSON.stringify({
    total: matches.length,
    categories,
    calculator,
    articles,
    all: matches
  }, null, 2));

  console.log('Saved to audit-baseline/ghid-auto/all-urls.json');
}

main().catch(console.error);
