/**
 * Test Suite TDD pentru Carvana / RXM - Deal of the Week, Pinned & Discount Pricing
 * Acoperă tichetele TIK-DEAL-01 -> TIK-DEAL-05
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failureDetails = [];

function assert(condition, testName, details = '') {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    testsFailed++;
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failureDetails.push({ testName, details });
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

console.log('===============================================================');
console.log('🧪 TDD TEST SUITE - RXM DEAL OF THE WEEK & DISCOUNT PRICING');
console.log('Data & Ora: ' + new Date().toISOString());
console.log('===============================================================\n');

// ─────────────────────────────────────────────────────────────
// [SUITE 1] TIK-DEAL-01 — Extindere Schemă & Vehicul Demo
// ─────────────────────────────────────────────────────────────
console.log('🔍 [SUITE 1] TIK-DEAL-01: Schema VehicleItem & Demo Vehicle');

const typesCode = readFile('src/db/types.ts');
assert(typesCode.includes('isDealOfWeek?: boolean;'), 'types.ts conține isDealOfWeek?: boolean;');
assert(typesCode.includes('isPinnedToTop?: boolean;'), 'types.ts conține isPinnedToTop?: boolean;');
assert(/\boldPriceEur\?:\s*number;/.test(typesCode), 'types.ts conține oldPriceEur?: number;');
assert(typesCode.includes('dealBadgeText?: string;'), 'types.ts conține dealBadgeText?: string;');

const vehiclesCode = readFile('src/db/vehicles.ts');
assert(vehiclesCode.includes('isDealOfWeek: true'), 'vehicles.ts conține cel puțin un vehicul cu isDealOfWeek: true');
const appCode = readFile('src/App.tsx');
assert(!/publicCars[\s\S]*?(?:isDealOfWeek|isPinnedToTop|\boldPriceEur|dealBadgeText):\s*undefined/.test(appCode), 
  'App.tsx: publicCars useMemo nu maschează câmpurile promoționale');

// ─────────────────────────────────────────────────────────────
// [SUITE 2] TIK-DEAL-02 — Fix Hero Spotlight & Decuplare Labels
// ─────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 2] TIK-DEAL-02: Hero Spotlight Order & Clarified Labels');

// Verificare algoritm heroOrder: 1 pentru noul pin + shiftare celelalte
assert(/heroOrder:\s*isNowPinned\s*\?\s*1\s*:/.test(appCode), 
  'App.tsx: noul pin primește heroOrder: 1 direct');
assert(/c\.heroOrder[\s\S]*?\+\s*1/.test(appCode), 
  'App.tsx: celelalte mașini pin-uite sunt shiftate cu heroOrder + 1');
assert(appCode.includes('Hero TikTok Reel'), 
  'App.tsx: toast confirmare menționează Hero TikTok Reel');

const invTableCode = readFile('src/components/admin/InventoryTableManager.tsx');
assert(!invTableCode.includes('Fixează în Hero (Pin to Top)'), 
  'InventoryTableManager.tsx: eliminată eticheta înșelătoare "Fixează în Hero (Pin to Top)"');
assert(invTableCode.includes('Hero TikTok Reel'), 
  'InventoryTableManager.tsx: butonul steluță specifică Hero TikTok Reel');

const heroTikTokCode = readFile('src/components/admin/HeroTikTokManager.tsx');
assert(!heroTikTokCode.includes("<span>{car.isHeroPinned ? 'Pinned' : 'Pin to Top'}</span>"), 
  'HeroTikTokManager.tsx: eticheta butonului nu mai este generic "Pin to Top"');

// ─────────────────────────────────────────────────────────────
// [SUITE 3] TIK-DEAL-03 — VehicleCard Glowing Frame, Deal Badge & Preț Barat
// ─────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 3] TIK-DEAL-03: VehicleCard Glowing Frame & Discount UI');

const cardCode = readFile('src/components/showroom/VehicleCard.tsx');
assert(/shadow-\[0_0_32px_rgba\(245,158,11,0\.28\)\]/.test(cardCode), 
  'VehicleCard.tsx: chenar glowing cu shadow amber când isDeal');
assert(/car\.dealBadgeText\s*\|\|\s*['"]OFERTA SĂPTĂMÂNII['"]/.test(cardCode), 
  'VehicleCard.tsx: badge Oferta Săptămânii cu text fallback');
assert(cardCode.includes('line-through'), 
  'VehicleCard.tsx: preț vechi barat (line-through) afișat când hasDiscount');
assert(/Economise\u0219ti|Economisesti/.test(cardCode), 
  'VehicleCard.tsx: badge Economisești afișat în corpul cardului');
assert(cardCode.includes('car.oldPriceEur'), 
  'VehicleCard.tsx: procesează car.oldPriceEur');

// ─────────────────────────────────────────────────────────────
// [SUITE 4] TIK-DEAL-04 — Catalog Sortare Pinned #1 & SpecialOffersCarousel
// ─────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 4] TIK-DEAL-04: Catalog Sort & SpecialOffersCarousel');

const catalogCode = readFile('src/components/showroom/VehicleCatalog.tsx');
assert(/sortedFilteredCars/.test(catalogCode), 
  'VehicleCatalog.tsx: definește sortedFilteredCars');
assert(/sortedFilteredCars\.map/.test(catalogCode), 
  'VehicleCatalog.tsx: randează cardurile din sortedFilteredCars');
assert(/isDealOfWeek\s*\?\s*2\s*:\s*0/.test(catalogCode), 
  'VehicleCatalog.tsx: aplică scor 2 pentru isDealOfWeek');
assert(catalogCode.includes('SpecialOffersCarousel'), 
  'VehicleCatalog.tsx: integrează componenta SpecialOffersCarousel');

const carouselFileExists = fs.existsSync(path.join(rootDir, 'src/components/showroom/SpecialOffersCarousel.tsx'));
assert(carouselFileExists, 'Fișierul SpecialOffersCarousel.tsx există');

if (carouselFileExists) {
  const carouselCode = readFile('src/components/showroom/SpecialOffersCarousel.tsx');
  assert(/cars\.length\s*===\s*0[\s\S]*?return\s+null/.test(carouselCode), 
    'SpecialOffersCarousel.tsx: auto-hide return null când cars.length === 0');
  assert(carouselCode.includes('snap-x'), 
    'SpecialOffersCarousel.tsx: conține derulare orizontală cu snap-x');
  assert(carouselCode.includes('Oferte Speciale & Reduceri'), 
    'SpecialOffersCarousel.tsx: conține titlul secțiunii de oferte');
}

// ─────────────────────────────────────────────────────────────
// [SUITE 5] TIK-DEAL-05 — Admin Portal: Controale Ofertă Săptămânii & Preț Vechi
// ─────────────────────────────────────────────────────────────
console.log('\n🔍 [SUITE 5] TIK-DEAL-05: Admin Portal Controls & Handlers');

const updatedAppCode = readFile('src/App.tsx');
assert(updatedAppCode.includes('handleSetDealOfWeek'), 
  'App.tsx: conține funcția handleSetDealOfWeek');
assert(updatedAppCode.includes('handleSetOldPrice'), 
  'App.tsx: conține funcția handleSetOldPrice');
assert(/onSetDealOfWeek=\{handleSetDealOfWeek\}/.test(updatedAppCode), 
  'App.tsx: transmite onSetDealOfWeek la AdminPortal');
assert(/onSetOldPrice=\{handleSetOldPrice\}/.test(updatedAppCode), 
  'App.tsx: transmite onSetOldPrice la AdminPortal');

const adminPortalCode = readFile('src/components/admin/AdminPortal.tsx');
assert(adminPortalCode.includes('onSetDealOfWeek'), 
  'AdminPortal.tsx: include prop onSetDealOfWeek');
assert(adminPortalCode.includes('onSetOldPrice'), 
  'AdminPortal.tsx: include prop onSetOldPrice');

const updatedInvTableCode = readFile('src/components/admin/InventoryTableManager.tsx');
assert(updatedInvTableCode.includes('onSetDealOfWeek'), 
  'InventoryTableManager.tsx: include prop onSetDealOfWeek');
assert(updatedInvTableCode.includes('onSetOldPrice'), 
  'InventoryTableManager.tsx: include prop onSetOldPrice');
assert(updatedInvTableCode.includes('Flame'), 
  'InventoryTableManager.tsx: importă iconița Flame pentru oferta săptămânii');
assert(updatedInvTableCode.includes('c.oldPriceEur'), 
  'InventoryTableManager.tsx: conține input editare c.oldPriceEur');




console.log(`\nRezultat intermediar: ${testsPassed}/${testsRun} trecute, ${testsFailed} eșuate.`);

if (testsFailed > 0) {
  console.log('❌ TDD RED STATE detectat conform metodologiei.');
  process.exit(1);
} else {
  console.log('✅ TDD GREEN STATE!');
  process.exit(0);
}
