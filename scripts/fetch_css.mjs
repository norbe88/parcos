import https from 'node:https';
import fs from 'node:fs';

https.get('https://www.carmatik.ro/ghid-auto-carmatik/static/css/style.5541ca1383a5.css', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    fs.writeFileSync('audit-baseline/ghid-auto/carmatik-style.css', d);
    console.log(`Saved CSS: ${d.length} bytes`);
  });
});
