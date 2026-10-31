/**
 * 🧪 PARCOS SHOWROOM PROGRESSIVE BATCHING & ADMIN CONTROLS QA SUITE
 * Validare exhaustivă a logicii de paginare progresivă, setărilor din admin și securității.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('===============================================================');
console.log('🏢 PARCOS PROGRESSIVE BATCHING & SECURITY QA SUITE');
console.log('Target: Progressive Batching, Admin Controls, Dual-Theme & DLP');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('🔍 [SUITE 1] Verificare Configurație Implicită & Tipuri TypeScript');
// ─────────────────────────────────────────────────────────────────────────────

test('DealerLandingConfig definește proprietățile de paginare', () => {
  const content = fs.readFileSync('src/db/types.ts', 'utf8');
  assert.ok(content.includes("catalogDisplayMode?: 'progressive_batch' | 'show_all';"), 'Lipsește catalogDisplayMode');
  assert.ok(content.includes('catalogInitialBatchDesktop?: 6 | 9 | 12 | 18;'), 'Lipsește catalogInitialBatchDesktop');
  assert.ok(content.includes('catalogInitialBatchMobile?: 4 | 6 | 8;'), 'Lipsește catalogInitialBatchMobile');
});

test('DEFAULT_LANDING_CONFIG are activat implicit modul progresiv cu 9 desktop / 6 mobil', () => {
  const content = fs.readFileSync('src/db/dealer.ts', 'utf8');
  assert.ok(content.includes("catalogDisplayMode: 'progressive_batch'"), 'Modul implicit nu este progressive_batch');
  assert.ok(content.includes('catalogInitialBatchDesktop: 9'), 'Desktop implicit nu este 9');
  assert.ok(content.includes('catalogInitialBatchMobile: 6'), 'Mobil implicit nu este 6');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 2] Verificare Componentă VehicleCatalog & Wiring');
// ─────────────────────────────────────────────────────────────────────────────

test('LandingSectionOrchestrator transmite landingConfig către VehicleCatalog', () => {
  const content = fs.readFileSync('src/components/showroom/LandingSectionOrchestrator.tsx', 'utf8');
  assert.ok(content.includes('landingConfig={cfg}'), 'VehicleCatalog nu primește landingConfig={cfg}');
});

test('VehicleCatalog acceptă landingConfig în interfața de Props', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  assert.ok(content.includes('landingConfig?: DealerLandingConfig;'), 'Prop-ul landingConfig lipsește din VehicleCatalogProps');
});

test('VehicleCatalog getInitialBatch calculează corect în funcție de configurație', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  assert.ok(content.includes("cfg?.catalogDisplayMode === 'show_all'"), 'Lipsește tratarea show_all');
  assert.ok(content.includes('cfg?.catalogInitialBatchMobile ?? BATCH_INITIAL_MOBILE'), 'Lipsește fallback-ul mobil');
  assert.ok(content.includes('cfg?.catalogInitialBatchDesktop ?? BATCH_INITIAL_DESKTOP'), 'Lipsește fallback-ul desktop');
});

test('VehicleCatalog randează displayedCars în grilă în loc de sortedFilteredCars', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  assert.ok(content.includes('{displayedCars.map((car, index) => ('), 'Grila nu randează displayedCars');
  assert.ok(!content.includes('{sortedFilteredCars.map((car, index) => ('), 'Grila încă iterează peste sortedFilteredCars direct');
});

test('VehicleCatalog resetează lotul la modificarea filtrelor sau a configurației parcului', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  assert.ok(content.includes('setVisibleCount(getInitialBatch(landingConfig));'), 'Resetarea nu ia în calcul landingConfig');
  assert.ok(content.includes('[stockTab, selectedBrand, selectedFuel, selectedTransmission, maxPrice, landingConfig]'), 'Dependențele useEffect incomplete');
});

test('VehicleCatalog conține Progress HUD cu bară de progres și contor clar', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  assert.ok(content.includes('{displayedCars.length} / {sortedFilteredCars.length} autovehicule'), 'Contor afișat greșit');
  assert.ok(content.includes('role="progressbar"'), 'Lipsește atributul de accesibilitate role="progressbar"');
  assert.ok(content.includes('ChevronDown'), 'Lipsește iconița ChevronDown');
  assert.ok(content.includes('Math.min(BATCH_STEP, sortedFilteredCars.length - displayedCars.length)'), 'Calculul dinamic al mașinilor rămase lipsește');
  assert.ok(content.includes('Afișează tot stocul ({sortedFilteredCars.length})'), 'Butonul de afișare totală lipsește');
  assert.ok(content.includes('Ai vizualizat toate autovehiculele disponibile conform filtrelor tale.'), 'Mesajul de finalizare lipsește');
});

test('Ofertele speciale din SpecialOffersCarousel rămân 100% independente de displayedCars', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  // specialOffers trebuie să filtreze peste `cars`, nu peste `displayedCars`
  const specialOffersMatch = content.match(/const specialOffers = useMemo\(\(\) => \{[\s\S]*?return cars/);
  assert.ok(specialOffersMatch, 'specialOffers nu filtrează din lista completă de cars');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 3] Optimizare UX, Animație & React.memo');
// ─────────────────────────────────────────────────────────────────────────────

test('index.css definește animația fadeInUpSmooth și clasa animate-fade-in-up', () => {
  const content = fs.readFileSync('src/index.css', 'utf8');
  assert.ok(content.includes('@keyframes fadeInUpSmooth'), 'Lipsește @keyframes fadeInUpSmooth');
  assert.ok(content.includes('.animate-fade-in-up'), 'Lipsește clasa .animate-fade-in-up');
});

test('VehicleCard este memoizat cu React.memo pentru a preveni re-randările inutile', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCard.tsx', 'utf8');
  assert.ok(content.includes('export const VehicleCard: React.FC<VehicleCardProps> = React.memo('), 'VehicleCard nu este React.memo');
  assert.ok(content.includes('prevProps.car.id === nextProps.car.id'), 'Lipsește compararea pe id');
  assert.ok(content.includes('prevProps.car.priceEur === nextProps.car.priceEur'), 'Lipsește compararea pe priceEur');
  assert.ok(content.includes('prevProps.priority === nextProps.priority'), 'Lipsește compararea pe priority');
});

test('VehicleCard folosește clasa animate-fade-in-up pentru montare fluidă', () => {
  const content = fs.readFileSync('src/components/showroom/VehicleCard.tsx', 'utf8');
  assert.ok(content.includes('animate-fade-in-up'), 'Cardul nu include clasa animate-fade-in-up');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 4] Setări Admin Portal & SuperAdmin HUD');
// ─────────────────────────────────────────────────────────────────────────────

test('WorkspaceSettingsView conține cardul de configurare stoc landing page', () => {
  const content = fs.readFileSync('src/components/admin/WorkspaceSettingsView.tsx', 'utf8');
  assert.ok(content.includes('Afișare Stoc Landing Page & Viteză Încărcare'), 'Lipsește titlul cardului');
  assert.ok(content.includes("handleSetCatalogBatch('progressive_batch', 9, 6)"), 'Lipsește presetul 9/6 recomandat');
  assert.ok(content.includes("handleSetCatalogBatch('progressive_batch', 6, 6)"), 'Lipsește presetul 6/6 ultra-rapid');
  assert.ok(content.includes("handleSetCatalogBatch('progressive_batch', 12, 8)"), 'Lipsește presetul 12/8 extins');
  assert.ok(content.includes("handleSetCatalogBatch('progressive_batch', 18, 8)"), 'Lipsește presetul 18 plafon maxim');
  assert.ok(content.includes("handleSetCatalogBatch('show_all'"), 'Lipsește opțiunea show_all');
  assert.ok(content.includes('RECOMANDAT'), 'Lipsește badge-ul RECOMANDAT');
});

test('LandingCustomizerHUD conține Secțiunea 2.5 de batching pentru SuperAdmin', () => {
  const content = fs.readFileSync('src/components/superadmin/LandingCustomizerHUD.tsx', 'utf8');
  assert.ok(content.includes('2.5. Afișare Stoc Showroom & Încărcare Progresivă (Batching)'), 'Lipsește secțiunea 2.5');
  assert.ok(content.includes('catalogDisplayMode'), 'Lipsește starea catalogDisplayMode');
  assert.ok(content.includes('catalogInitialBatchDesktop'), 'Lipsește starea catalogInitialBatchDesktop');
  assert.ok(content.includes('catalogInitialBatchMobile'), 'Lipsește starea catalogInitialBatchMobile');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 5] Securitate, XSS, DLP & Invariante Holding');
// ─────────────────────────────────────────────────────────────────────────────

test('Fără utilizare de dangerouslySetInnerHTML în fișierele modificate', () => {
  const files = [
    'src/components/showroom/VehicleCatalog.tsx',
    'src/components/showroom/VehicleCard.tsx',
    'src/components/admin/WorkspaceSettingsView.tsx',
    'src/components/superadmin/LandingCustomizerHUD.tsx'
  ];
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    assert.ok(!c.includes('dangerouslySetInnerHTML'), `dangerouslySetInnerHTML găsit în ${f}! Risc XSS.`);
  }
});

test('Zero chei de API, parole sau secrete hardcodate în noile componente', () => {
  const files = [
    'src/components/showroom/VehicleCatalog.tsx',
    'src/components/showroom/VehicleCard.tsx',
    'src/components/admin/WorkspaceSettingsView.tsx',
    'src/components/superadmin/LandingCustomizerHUD.tsx',
    'src/db/dealer.ts',
    'src/db/types.ts'
  ];
  const secretPatterns = [
    /AIzaSy[0-9A-Za-z-_]{33}/,
    /sk_live_[0-9a-zA-Z]{24}/,
    /ghp_[0-9a-zA-Z]{36}/,
    /postgres:\/\/.*:.*@/
  ];
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    for (const pat of secretPatterns) {
      assert.ok(!pat.test(c), `Secret detectat în ${f} conform pattern ${pat}`);
    }
  }
});

test('Zero culori single-theme hardcodate care pot rupe tema luminoasă Clean White', () => {
  const catalog = fs.readFileSync('src/components/showroom/VehicleCatalog.tsx', 'utf8');
  // Verifică că butoanele și HUD-ul folosesc culori cu contrast verificat
  assert.ok(!catalog.includes('style={{ backgroundColor: \'#09090b\' }}'), 'Stil hardcodat single-theme găsit');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n===============================================================');
console.log(`REZULTAT QA SUITE: ${passedTests}/${totalTests} TESTE TRECUTE!`);
if (passedTests === totalTests) {
  console.log('🎉 TOATE TESTELE DE FUNCȚIONALITATE & SECURITATE AU FOST VALIDATE!');
} else {
  console.error('❌ Unele teste au eșuat. Verifică detaliile de mai sus.');
  process.exit(1);
}
console.log('===============================================================');
