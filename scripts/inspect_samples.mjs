import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function fetchUrl(url) {
  // convert ghid.carmatik.ro to www.carmatik.ro if needed
  const normalized = url.replace('https://ghid.carmatik.ro/', 'https://www.carmatik.ro/');
  return new Promise((resolve, reject) => {
    https.get(normalized, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const samples = [
    { name: 'article-inmatriculare', url: 'https://www.carmatik.ro/ghid-auto-carmatik/inmatriculare-auto/' },
    { name: 'article-rabla', url: 'https://www.carmatik.ro/ghid-auto-carmatik/program-rabla-inscriere-acte-2026/' },
    { name: 'category-inmatriculare', url: 'https://www.carmatik.ro/ghid-auto-carmatik/categorie/inmatriculare-transcriere/' },
    { name: 'calculator-impozit', url: 'https://www.carmatik.ro/ghid-auto-carmatik/calculator-impozit-auto/' }
  ];

  const outDir = path.resolve('audit-baseline/ghid-auto/samples');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const sample of samples) {
    console.log(`Fetching ${sample.name} from ${sample.url}...`);
    const res = await fetchUrl(sample.url);
    console.log(`Status: ${res.status}, length: ${res.body.length}`);
    fs.writeFileSync(path.join(outDir, `${sample.name}.html`), res.body);
  }
}

main().catch(console.error);
