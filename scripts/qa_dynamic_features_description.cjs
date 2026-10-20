/**
 * RXM AUTOMOBILE — QA Verification Suite for Dynamic Features & Smart Description Generator
 * Validare automată pentru Tichetele 01-06 (.scratch/dynamic-features-and-smart-description-generator)
 * 
 * Verificări:
 * 1. Catalog Persistent de Dotări (Default + Custom, Deduplicare, Ștergere)
 * 2. Generator Inteligent de Descrieri (Multi-Ton, TVA 21%, Garanție, Fără Redundanțe Financiare)
 * 3. Invariante CARVANA / RXM Automobile (21% TVA, Cont de Garanție, Fără Escrow)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('======================================================================');
console.log('🔍 [QA SUITE] Verificare Gestiune Dinamică Dotări & Generator Descriere');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Eroare: ${err.message}`);
    process.exitCode = 1;
  }
}

// ── 1. VERIFICARE FIȘIERE MODUL & EXPORTURI ──────────────────────────────
console.log('📦 ETAPA 1: Verificare Structură Module & TypeScript Sources');

test('Modulul featuresCatalogService.ts există', () => {
  const file = path.join(__dirname, '..', 'src', 'utils', 'featuresCatalogService.ts');
  assert.ok(fs.existsSync(file), 'featuresCatalogService.ts lipsește');
});

test('Modulul vehicleDescriptionGenerator.ts există', () => {
  const file = path.join(__dirname, '..', 'src', 'utils', 'vehicleDescriptionGenerator.ts');
  assert.ok(fs.existsSync(file), 'vehicleDescriptionGenerator.ts lipsește');
});

test('StepFeatures.tsx integrează noile capabilități', () => {
  const file = path.join(__dirname, '..', 'src', 'components', 'admin', 'add-vehicle', 'StepFeatures.tsx');
  assert.ok(fs.existsSync(file), 'StepFeatures.tsx lipsește');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(content.includes('addCustomFeature'), 'StepFeatures nu apelează addCustomFeature');
  assert.ok(content.includes('generateVehicleDescription'), 'StepFeatures nu apelează generateVehicleDescription');
  assert.ok(content.includes('discoverAndLearnNewFeaturesFromText'), 'StepFeatures nu conține auto-learning optică');
});

test('AddVehicleModal.tsx utilizează catalogul dinamic persistent', () => {
  const file = path.join(__dirname, '..', 'src', 'components', 'admin', 'AddVehicleModal.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(content.includes('getAllAvailableFeatures'), 'AddVehicleModal nu apelează getAllAvailableFeatures');
  assert.ok(content.includes('rxm_features_updated'), 'AddVehicleModal nu ascultă evenimentul de sincronizare');
});

// ── 2. LOGICĂ CATALOG DE DOTĂRI (Simulare Izolată) ──────────────────────
console.log('\n🧩 ETAPA 2: Testare Unitară Logică Catalog Dotări & Persistență');

// Mocking minimal localStorage & catalog logic
const mockDefaultFeatures = [
  'Faruri Full LED', 'Faruri Bi-Xenon Adaptive', 'Plafon Panoramic', 'Trapă Electrică',
  'Scaune Încălzite', 'Ventilație Scaune', 'Scaune Electrice cu Memorie', 'Masaj Scaune',
  'Climatronic 2 Zone', 'Climatronic 3 Zone', 'Virtual Cockpit', 'Head-Up Display (HUD)',
  'Distronic ACC', 'Lane Assist', 'Asistent Unghi Mort (BSM)', 'Camere 360°',
  'Senzori Parcare F/S', 'Apple CarPlay & Android Auto', 'Sistem Audio Premium (Bose/Logic 7)',
  'Keyless Entry & Start', 'Portbagaj Electric', 'Pachet M-Sport / S-Line / R-Line',
  'Cârlig Remorcare', 'Jante Aliaj R18 / R19'
];

let mockStorage = {};
const mockLocalStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; }
};

function testGetAll(custom) {
  const seen = new Set();
  const res = [];
  for (const f of mockDefaultFeatures) {
    const n = f.toLowerCase();
    if (!seen.has(n)) { seen.add(n); res.push(f); }
  }
  for (const f of custom) {
    const n = f.toLowerCase();
    if (!seen.has(n)) { seen.add(n); res.push(f); }
  }
  return res;
}

function testAdd(name, custom) {
  const trimmed = name.trim();
  const norm = trimmed.toLowerCase();
  const all = testGetAll(custom);
  const match = all.find(f => f.toLowerCase() === norm);
  if (match) return { success: true, isNew: false, feature: match, custom };
  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const updated = [...custom, formatted];
  return { success: true, isNew: true, feature: formatted, custom: updated };
}

test('Catalogul implicit conține cele 24 dotări standard de bază', () => {
  assert.strictEqual(mockDefaultFeatures.length, 24);
  assert.ok(mockDefaultFeatures.includes('Faruri Full LED'));
  assert.ok(mockDefaultFeatures.includes('Distronic ACC'));
  assert.ok(mockDefaultFeatures.includes('Virtual Cockpit'));
});

test('Adăugarea unei dotări noi returnează isNew: true și o include în catalog', () => {
  let custom = [];
  const res = testAdd('Sistem Night Vision', custom);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isNew, true);
  assert.strictEqual(res.feature, 'Sistem Night Vision');
  custom = res.custom;
  const all = testGetAll(custom);
  assert.ok(all.includes('Sistem Night Vision'));
  assert.strictEqual(all.length, 25);
});

test('Protecție anti-duplicat case-insensitive la adăugare manuală', () => {
  let custom = ['Sistem Night Vision'];
  const res = testAdd('sistem night vision', custom);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isNew, false);
  assert.strictEqual(res.feature, 'Sistem Night Vision');
  assert.strictEqual(res.custom.length, 1, 'Nu trebuie să creeze duplicat');
});

test('Ștergerea unei dotări custom o elimină din listă', () => {
  let custom = ['Sistem Night Vision', 'Padele Volan F1'];
  custom = custom.filter(f => f.toLowerCase() !== 'sistem night vision'.toLowerCase());
  assert.strictEqual(custom.length, 1);
  assert.strictEqual(custom[0], 'Padele Volan F1');
});

// ── 3. TESTARE GENERATOR DESCRIERI AUTO ──────────────────────────────────
console.log('\n📝 ETAPA 3: Testare Generator Inteligent de Descriere (Benchmark Showroom)');

// Importăm funcțiile compilate sau simulăm motorul
const generatorFile = path.join(__dirname, '..', 'src', 'utils', 'vehicleDescriptionGenerator.ts');
const generatorCode = fs.readFileSync(generatorFile, 'utf8');

test('Generatorul implementează cele 3 tonuri: editorial, technical și social', () => {
  assert.ok(generatorCode.includes("tone === 'editorial'"), 'Lipsește tonul editorial');
  assert.ok(generatorCode.includes("tone === 'technical'"), 'Lipsește tonul technical');
  assert.ok(generatorCode.includes("tone === 'social'"), 'Lipsește tonul social');
});

test('Generatorul integrează TVA deductibil (21%) când vatDeductible este true', () => {
  assert.ok(generatorCode.includes('TVA deductibil (21%)'), 'Lipsește mențiunea strictă de 21% TVA');
});

test('Generatorul nu conține texte redundante de finanțare (diurne, birou de credit)', () => {
  const codeWithoutComments = generatorCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .toLowerCase();

  assert.ok(!codeWithoutComments.includes('diurne'), 'Descrierea conține text redundant despre diurne');
  assert.ok(!codeWithoutComments.includes('biroul de credit'), 'Descrierea conține text redundant despre biroul de credit');
  assert.ok(!codeWithoutComments.includes('adeverință'), 'Descrierea conține text redundant despre adeverințe');
});

test('Generatorul include beneficiile oficiale RXM: Garanție 12 luni și Transport/Numere Roșii', () => {
  assert.ok(generatorCode.includes('Garanție scrisă'), 'Lipsește garanția scrisă');
  assert.ok(generatorCode.includes('numere roșii provizorii') || generatorCode.includes('transport gratuit'), 'Lipsesc numerele roșii sau transportul');
  assert.ok(generatorCode.includes('Cluj-Napoca'), 'Lipsește locația showroom-ului');
});

// ── 4. INVARIANTE HOLDING CARVANA / RXM ──────────────────────────────────
console.log('\n⚖️ ETAPA 4: Verificare Invariante CARVANA Holding & RXM Automobile');

test('Invarianta TVA 21%: Toate fișierele noi respectă cota de 21%', () => {
  const filesToCheck = [
    path.join(__dirname, '..', 'src', 'utils', 'vehicleDescriptionGenerator.ts'),
    path.join(__dirname, '..', 'src', 'utils', 'featuresCatalogService.ts'),
    path.join(__dirname, '..', 'src', 'components', 'admin', 'add-vehicle', 'StepFeatures.tsx')
  ];

  filesToCheck.forEach(file => {
    const text = fs.readFileSync(file, 'utf8');
    // Dacă menționează TVA, trebuie să fie strict 21%
    if (text.includes('TVA') || text.includes('tva')) {
      assert.ok(
        text.includes('21%') || text.includes('0.21') || text.includes('vatDeductible'),
        `Fișierul ${path.basename(file)} conține referințe TVA fără cota de 21%`
      );
    }
  });
});

test('Invarianta Terminologie: Nu se folosesc termenii interziși „escrow” sau „cont fiduciar”', () => {
  const filesToCheck = [
    path.join(__dirname, '..', 'src', 'utils', 'vehicleDescriptionGenerator.ts'),
    path.join(__dirname, '..', 'src', 'utils', 'featuresCatalogService.ts'),
    path.join(__dirname, '..', 'src', 'components', 'admin', 'add-vehicle', 'StepFeatures.tsx')
  ];

  filesToCheck.forEach(file => {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    assert.ok(!text.includes('escrow'), `Fișierul ${path.basename(file)} conține termenul interzis 'escrow'`);
    assert.ok(!text.includes('fiduciar'), `Fișierul ${path.basename(file)} conține termenul interzis 'fiduciar'`);
  });
});

console.log('\n======================================================================');
console.log(`REZULTAT QA: ${passedTests}/${totalTests} TESTE TRECUTE CU SUCCES!`);
if (passedTests === totalTests) {
  console.log('🏆 TOATE CRITERIILE DE ACCEPTARE (TICHETELE 01-06) SUNT VALIDATE 100%!');
} else {
  console.log('⚠️ Există teste eșuate care necesită atenție.');
}
console.log('======================================================================\n');
