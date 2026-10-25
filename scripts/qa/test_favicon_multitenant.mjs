import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { renderDynamicHtml } from '../../server/api.mjs';

async function testFaviconMultitenant() {
  console.log('\n🎨 [TEST] Verificare Izolare Favicon & Web Manifest (Multi-Tenant SSR)...');
  console.log('────────────────────────────────────────────────────────────────────────');

  const template = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // 1. Simulare request pentru rxmautomobile.ro
  const rxmRendered = await renderDynamicHtml(
    template,
    { headers: { host: 'rxmautomobile.ro', 'x-forwarded-host': 'rxmautomobile.ro' } },
    new URL('https://rxmautomobile.ro/')
  );

  assert.ok(
    rxmRendered.includes('href="/rxm/favicon.svg?v=rxm2026"'),
    'FAIL: rxmautomobile.ro trebuie să folosească /rxm/favicon.svg'
  );
  assert.ok(
    rxmRendered.includes('href="/rxm/favicon-32x32.png?v=rxm2026"'),
    'FAIL: rxmautomobile.ro trebuie să folosească /rxm/favicon-32x32.png'
  );
  assert.ok(
    rxmRendered.includes('href="/rxm/favicon.ico?v=rxm2026"'),
    'FAIL: rxmautomobile.ro trebuie să folosească /rxm/favicon.ico'
  );
  assert.ok(
    rxmRendered.includes('href="/rxm/apple-touch-icon.png?v=rxm2026"'),
    'FAIL: rxmautomobile.ro trebuie să folosească /rxm/apple-touch-icon.png'
  );
  assert.ok(
    rxmRendered.includes('href="/rxm/site.webmanifest?v=rxm2026"'),
    'FAIL: rxmautomobile.ro trebuie să folosească /rxm/site.webmanifest'
  );
  assert.strictEqual(
    rxmRendered.includes('v=parcos2026'),
    false,
    'FAIL: rxmautomobile.ro conține încă versiunea v=parcos2026!'
  );
  console.log('✅ [PASS] rxmautomobile.ro: Toate tag-urile <link rel="icon"> au fost rescrise dinamic către /rxm/ fără bleed');

  // 2. Simulare request pentru parcos.ro
  const parcosRendered = await renderDynamicHtml(
    template,
    { headers: { host: 'parcos.ro', 'x-forwarded-host': 'parcos.ro' } },
    new URL('https://parcos.ro/')
  );

  assert.ok(
    parcosRendered.includes('href="/favicon.svg?v=parcos2026"'),
    'FAIL: parcos.ro trebuie să folosească /favicon.svg?v=parcos2026'
  );
  assert.ok(
    parcosRendered.includes('href="/favicon.ico?v=parcos2026"'),
    'FAIL: parcos.ro trebuie să folosească /favicon.ico?v=parcos2026'
  );
  assert.strictEqual(
    parcosRendered.includes('/rxm/favicon'),
    false,
    'FAIL: parcos.ro a scăpat favicon de la rxm!'
  );
  console.log('✅ [PASS] parcos.ro: Folosește brandingul oficial ParcOS cu zero leak către RXM');

  console.log('────────────────────────────────────────────────────────────────────────');
  console.log('🏆 TOATE TESTELE DE FAVICON MULTI-TENANT AU TRECUT CU SUCCES!\n');
}

testFaviconMultitenant().catch(err => {
  console.error('\n❌ TEST FAVICON EȘUAT:', err);
  process.exit(1);
});
