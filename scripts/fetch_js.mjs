import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const js = await fetchUrl('https://www.carmatik.ro/ghid-auto-carmatik/static/js/main.abb42088b4c1.js');
  fs.writeFileSync('audit-baseline/ghid-auto/carmatik-main.js', js);
  console.log(`Saved JS: ${js.length} bytes`);
}

main().catch(console.error);
