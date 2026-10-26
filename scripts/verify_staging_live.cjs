const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Verificare Live Staging (App 7) ---');
  const stagingHtml = await fetchUrl('https://staging.parcos.ro');
  console.log('Staging HTTP status:', stagingHtml.status);
  
  const match = stagingHtml.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
  console.log('Script bundle găsit:', match ? match[1] : 'lipsă');
  
  if (match) {
    const bundle = await fetchUrl('https://staging.parcos.ro' + match[1]);
    console.log('Has STAGING AMBIENT (EnvironmentHUD):', bundle.data.includes('STAGING AMBIENT'));
    console.log('Has reconTracker:', bundle.data.includes('reconTracker'));
    console.log('Has googleDriveVault:', bundle.data.includes('googleDriveVault'));
  }

  console.log('\n--- Verificare Live Producție (App 6) ---');
  const prodHtml = await fetchUrl('https://app.parcos.ro');
  console.log('Prod HTTP status:', prodHtml.status);
  
  const matchProd = prodHtml.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
  console.log('Script bundle găsit:', matchProd ? matchProd[1] : 'lipsă');
  if (matchProd) {
    const bundleProd = await fetchUrl('https://app.parcos.ro' + matchProd[1]);
    console.log('Has PROD LIVE pill:', bundleProd.data.includes('PROD LIVE'));
    console.log('Has reconTracker:', bundleProd.data.includes('reconTracker'));
  }
}

verify().catch(console.error);
