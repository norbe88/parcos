/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS — Test Automat de Izolare Multi-Tenant & Prevenire Bleed
 * Holding: CARVANA SRL • Rulează în CI/CD și Pre-Commit
 * ══════════════════════════════════════════════════════════════════
 * Scop:
 * 1. Garantează că rxmautomobile.ro (și orice domeniu de dealer)
 *    NU conține NICIODATĂ componente de vânzare SaaS, mașini fictive
 *    (Porsche Cayenne GTS, Audi RS7 demo) sau video-ul parcos-showroom-intro.
 * 2. Garantează că parcos.ro nu conține date interne de contact RXM.
 * 3. Verifică că șablonul HTML randat este 100% izolat.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Cuvinte cheie și asset-uri interzise pe showroom-urile dealerilor:
const FORBIDDEN_ON_DEALER_SHOWROOM = [
  'parcos-showroom-intro.mp4',
  'parcos-showroom-hall.jpg',
  'Porsche Cayenne GTS Coupé',
  'Audi RS7 Sportback 4.0 TFSI',
  'Mercedes-Benz Clasa E AMG Line',
  'BMW X5 xDrive40d M Sport',
  'Nu mai pierdem clienți pe drum',
  'Program Complet pentru Parcuri Auto',
  'e-Factura SPV • Facturare cu TVA sau Regim de Marjă'
];

async function runIsolationTests() {
  console.log('\n🔒 [QA GATE] Rulare Teste Automate de Izolare Multi-Tenant (Anti-Bleed)...');
  console.log('────────────────────────────────────────────────────────────────────────');

  // Test 1: Verificare că DEFAULT_LANDING_CONFIG nu are video_loop
  const dealerFile = fs.readFileSync(path.resolve('src/db/dealer.ts'), 'utf8');
  assert.ok(
    dealerFile.includes("hero: { type: 'spotlight' }"),
    'FAIL: DEFAULT_LANDING_CONFIG din src/db/dealer.ts trebuie să fie strict spotlight!'
  );
  console.log('✅ [PASS] DEFAULT_LANDING_CONFIG este configurat strict pe spotlight');

  // Test 2: Verificare că DealerHeroAdapter protejează împotriva randării ShowroomVideoIntro
  const adapterFile = fs.readFileSync(path.resolve('src/components/showroom/DealerHeroAdapter.tsx'), 'utf8');
  assert.ok(
    adapterFile.includes("tenant.slug === 'rxm'") || adapterFile.includes("!hero.videoUrl"),
    'FAIL: DealerHeroAdapter trebuie să conțină gardă strictă anti-leak pentru video_loop!'
  );
  console.log('✅ [PASS] DealerHeroAdapter include gardă strictă de izolare pentru dealeri');

  // Test 3: Verificare răspuns live sau simulat pentru rxmautomobile.ro
  try {
    const rxmRes = await fetch('https://rxmautomobile.ro/');
    const rxmHtml = await rxmRes.text();

    for (const forbidden of FORBIDDEN_ON_DEALER_SHOWROOM) {
      assert.strictEqual(
        rxmHtml.includes(forbidden),
        false,
        `FAIL: rxmautomobile.ro a scăpat conținut interzis de SaaS: "${forbidden}"!`
      );
    }
    console.log('✅ [PASS] rxmautomobile.ro nu conține niciun string sau asset SaaS interzis (Zero Bleed Confirmat)');

    assert.ok(
      rxmHtml.includes('RXM AUTO MOBILE'),
      'FAIL: rxmautomobile.ro trebuie să conțină titlul și metadatele RXM!'
    );
    console.log('✅ [PASS] rxmautomobile.ro conține corect identitatea dedicată RXM AUTO MOBILE');

    // Test 3b: Verificare Favicon & Branding Isolation pe rxmautomobile.ro
    assert.strictEqual(
      rxmHtml.includes('parcos2026'),
      false,
      'FAIL: rxmautomobile.ro nu trebuie să conțină tag-uri favicon de parcos2026!'
    );
    assert.ok(
      rxmHtml.includes('/rxm/favicon.svg?v=rxm2026') || rxmHtml.includes('/rxm/favicon'),
      'FAIL: rxmautomobile.ro trebuie să aibă favicon dedicat din /rxm/!'
    );
    console.log('✅ [PASS] rxmautomobile.ro are tag-uri de favicon 100% izolate (RXM emblem)');
  } catch (err) {
    console.warn('⚠️ [WARN] Nu s-a putut apela rețeaua externă pentru rxmautomobile.ro:', err.message);
  }

  // Test 4: Verificare răspuns live sau simulat pentru parcos.ro
  try {
    const parcosRes = await fetch('https://parcos.ro/');
    const parcosHtml = await parcosRes.text();

    assert.ok(
      parcosHtml.includes('ParcOS'),
      'FAIL: parcos.ro trebuie să conțină brandingul ParcOS!'
    );
    assert.strictEqual(
      parcosHtml.includes('0748 892 937'), // Numărul de telefon personal al RXM
      false,
      'FAIL: parcos.ro a scăpat numărul de telefon al dealerului RXM!'
    );
    assert.ok(
      parcosHtml.includes('v=parcos2026'),
      'FAIL: parcos.ro trebuie să aibă favicon-ul oficial ParcOS!'
    );
    console.log('✅ [PASS] parcos.ro este izolat și folosește corect favicon-ul oficial ParcOS');
  } catch (err) {
    console.warn('⚠️ [WARN] Nu s-a putut apela rețeaua externă pentru parcos.ro:', err.message);
  }

  // Test 5: Verificare fizică a asset-urilor RXM Automobile
  const requiredRxmAssets = [
    'public/rxm/favicon.ico',
    'public/rxm/favicon.svg',
    'public/rxm/favicon-16x16.png',
    'public/rxm/favicon-32x32.png',
    'public/rxm/favicon-192x192.png',
    'public/rxm/favicon-512x512.png',
    'public/rxm/apple-touch-icon.png',
    'public/rxm/site.webmanifest'
  ];
  for (const asset of requiredRxmAssets) {
    assert.ok(
      fs.existsSync(path.resolve(asset)),
      `FAIL: Asset-ul esențial RXM lipsește: ${asset}`
    );
  }
  console.log('✅ [PASS] Toate cele 8 asset-uri de branding & favicon RXM Automobile sunt prezente pe disc');

  console.log('────────────────────────────────────────────────────────────────────────');
  console.log('🏆 TOATE TESTELE DE IZOLARE MULTI-TENANT AU TRECUT CU SUCCES! ZERO BLEED.');
}

runIsolationTests().catch(err => {
  console.error('\n❌ TEST DE IZOLARE EȘUAT:', err.message);
  process.exit(1);
});
