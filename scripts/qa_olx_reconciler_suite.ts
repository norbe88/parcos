// =========================================================================
// QA AGENTIC TEAM — Test Suite: OLX Auto-Link & Smart Inventory Reconciler
// Executat de Orchi (Orchestrator) & Worky (Worker Pool: WorkyOne, Two, Three, Four)
// =========================================================================

import {
  buildOlxInventorySignature,
  extractInventorySignatureFromText,
  formatPhoneForOlx,
  sanitizeForOlx,
  mapToOlxCarBody,
  mapToOlxColor,
  mapToOlxFuel,
  mapToOlxGearbox,
  generateOlxDescription
} from '../src/utils/olxPosterPayload';

import {
  reconcileAdWithInventory,
  bulkReconcileInventory,
  checkEdgeNodeCooldown,
  OlxRawAdCandidate
} from '../src/utils/olxSyncClient';

import { computeOlxDiscrepancy, extractOlxId } from '../src/utils/helpers';
import { VehicleItem } from '../src/db/types';

interface TestResult {
  name: string;
  tier: 'Frontend/Formatting' | 'Engine/Regex' | 'Process/Invariants';
  worker: 'WorkyOne' | 'WorkyTwo' | 'WorkyThree' | 'WorkyFour';
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(
  condition: boolean,
  name: string,
  tier: TestResult['tier'],
  worker: TestResult['worker'],
  details?: string
) {
  results.push({
    name,
    tier,
    worker,
    passed: Boolean(condition),
    details: condition ? undefined : details || 'Assertion failed'
  });
}

console.log('🚀 [QA Agentic Team] Lansare suită automată OLX Auto-Link & Smart Reconciler...\n');

// Mock Vehicle Stoc pentru testare deterministă
const mockCars: VehicleItem[] = [
  {
    id: 'bmw-520d-2019-rxm-7412',
    stockNumber: 'RXM-7412',
    brand: 'BMW',
    model: 'Seria 5 520d xDrive',
    year: 2019,
    price: 24900,
    mileageKm: 142000,
    engineCc: 1995,
    powerHp: 190,
    fuelType: 'Diesel',
    transmission: 'Automata',
    bodyType: 'Sedan',
    color: 'Negru',
    vin: 'WBA5D31080D741216',
    vatDeductible: true,
    status: 'in_stock',
    olxStatus: 'unlinked',
    olxUrl: undefined,
    olxId: undefined,
    photos: ['car1.jpg']
  },
  {
    id: 'audi-a6-2020-rxm-8890',
    stockNumber: 'RXM-8890',
    brand: 'Audi',
    model: 'A6 40 TDI S-Line',
    year: 2020,
    price: 31500,
    mileageKm: 98000,
    engineCc: 1968,
    powerHp: 204,
    fuelType: 'Diesel',
    transmission: 'S-Tronic Automata',
    bodyType: 'Break',
    color: 'Gri Daytona',
    vin: 'WAUZZZF27LN088890',
    vatDeductible: false,
    status: 'sold',
    olxStatus: 'active',
    olxUrl: 'https://www.olx.ro/d/oferta/audi-a6-2020-IDi8Yzk.html',
    olxId: 'i8Yzk',
    photos: ['car2.jpg']
  },
  {
    id: 'dacia-duster-2022-top-1002',
    stockNumber: 'TOP-1002',
    brand: 'Dacia',
    model: 'Duster 1.5 dCi 4x4 Prestige',
    year: 2022,
    price: 17200,
    mileageKm: 45000,
    engineCc: 1461,
    powerHp: 115,
    fuelType: 'Diesel',
    transmission: 'Manuala',
    bodyType: 'SUV',
    color: 'Portocaliu Atacama',
    vin: 'VF1HSDAC467100288',
    vatDeductible: true,
    status: 'in_stock',
    olxStatus: 'active',
    olxUrl: 'https://www.olx.ro/d/oferta/dacia-duster-prestige-IDkCF6U.html',
    olxId: 'kCF6U',
    photos: ['car3.jpg']
  }
];

// =========================================================================
// TIER 1: Frontend & Formatting
// =========================================================================

// 1. Signature generation
const sig = buildOlxInventorySignature('RXM-7412', 'WBA5D31080D741216');
assert(sig.includes('ID Referinta Parc: #RXM-7412'), 'Signature conține tagul corect de inventar #RXM-7412', 'Frontend/Formatting', 'WorkyOne');
assert(sig.includes('Serie Sasiu (VIN): WBA5D31080D741216'), 'Signature conține seria VIN curățată', 'Frontend/Formatting', 'WorkyOne');
assert(!sig.includes('---') && !sig.includes('───'), 'Signature respectă politica OLX (fără linii decorative de separare)', 'Frontend/Formatting', 'WorkyOne');

// 2. Phone formatting for OLX anti-blocking
assert(formatPhoneForOlx('0748892937') === '0748_892_937', 'Formatează număr 10 cifre în format 0748_892_937', 'Frontend/Formatting', 'WorkyOne');
assert(formatPhoneForOlx('+40 748 892 937') === '0748_892_937', 'Formatează număr internațional +40 în 0748_892_937', 'Frontend/Formatting', 'WorkyOne');
assert(formatPhoneForOlx('0040748892937') === '0748_892_937', 'Formatează prefix 0040 în 0748_892_937', 'Frontend/Formatting', 'WorkyOne');

// 3. Sanitizer for OLX
const rawDescWithForbiddenChars = 'Motor 1995 cm³, detalii pe https://rxmautomobile.ro/cars/bmw! Contact: 0748 892 937.';
const cleanedDesc = sanitizeForOlx(rawDescWithForbiddenChars);
assert(cleanedDesc.includes('1995 cmc'), 'Convertește cm³ în cmc conform regulilor OLX', 'Frontend/Formatting', 'WorkyOne');
assert(!cleanedDesc.includes('https://rxmautomobile.ro'), 'Elimină linkurile web externe (interzise pe OLX)', 'Frontend/Formatting', 'WorkyOne');
assert(cleanedDesc.includes('0748_892_937'), 'Formatează numărul de telefon în formatul aprobat OLX', 'Frontend/Formatting', 'WorkyOne');

// 4. Mappers
assert(mapToOlxCarBody('Sedan') === 'Berlina', 'Mapează Sedan -> Berlina', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxCarBody('Break / Touring') === 'Break', 'Mapează Touring -> Break', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxCarBody('SUV / Crossover') === 'SUV', 'Mapează Crossover -> SUV', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxColor('Negru Metalizat') === 'Negru', 'Mapează Negru Metalizat -> Negru', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxColor('Gri Daytona') === 'Gri', 'Mapează Gri Daytona -> Gri', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxFuel('Diesel') === 'Diesel', 'Mapează Diesel corect', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxFuel('Plug-in Hybrid PHEV') === 'Hibrid', 'Mapează Hybrid -> Hibrid', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxGearbox('Automata') === 'automat', 'Mapează Automata -> automat', 'Frontend/Formatting', 'WorkyTwo');
assert(mapToOlxGearbox('Manuala 6 trepte') === 'manual', 'Mapează Manuala -> manual', 'Frontend/Formatting', 'WorkyTwo');

// 5. Full Description Generation & Length
const fullDesc = generateOlxDescription(mockCars[0]);
assert(fullDesc.includes('ID Referinta Parc: #RXM-7412'), 'Descrierea completă OLX conține amprenta de inventar', 'Frontend/Formatting', 'WorkyTwo');
assert(fullDesc.length < 9000, `Lungimea descrierii (${fullDesc.length} caractere) respectă limita maximă OLX de 9000 caractere`, 'Frontend/Formatting', 'WorkyTwo');

// =========================================================================
// TIER 2: Engine / Regex & Deterministic Extraction
// =========================================================================

// 1. Standard stock number extraction
const textStandard = `BMW 520d xDrive 2019\nPret: 24.900 EUR\nID Referinta Parc: #RXM-7412\nSerie Sasiu (VIN): WBA5D31080D741216`;
const sigStandard = extractInventorySignatureFromText(textStandard);
assert(sigStandard.stockNumber === 'RXM-7412', 'Extrage stockNumber standard RXM-7412', 'Engine/Regex', 'WorkyTwo');
assert(sigStandard.vin === 'WBA5D31080D741216', 'Extrage VIN standard WBA5D31080D741216', 'Engine/Regex', 'WorkyTwo');

// 2. Diacritics and variation extraction
const textDiacritics = `Dacia Duster 2022\nID Referință Parc: #TOP-1002\nSerie Șasiu: VF1HSDAC467100288`;
const sigDiacritics = extractInventorySignatureFromText(textDiacritics);
assert(sigDiacritics.stockNumber === 'TOP-1002', 'Extrage stockNumber cu diacritice românești (ID Referință)', 'Engine/Regex', 'WorkyTwo');
assert(sigDiacritics.vin === 'VF1HSDAC467100288', 'Extrage VIN cu diacritice (Serie Șasiu)', 'Engine/Regex', 'WorkyTwo');

// 3. Inline hashtag tag extraction
const textHashtag = `Audi A6 S-Line cutie automata #RXM-8890 masina se prezinta impecabil`;
const sigHashtag = extractInventorySignatureFromText(textHashtag);
assert(sigHashtag.stockNumber === 'RXM-8890', 'Extrage tag inline #RXM-8890 din text liber', 'Engine/Regex', 'WorkyTwo');

// 4. Standalone raw VIN
const textRawVin = `Vand BMW 520d, an 2019, VIN: WBA5D31080D741216, stare perfecta`;
const sigRawVin = extractInventorySignatureFromText(textRawVin);
assert(sigRawVin.vin === 'WBA5D31080D741216', 'Extrage VIN fără etichetă completă', 'Engine/Regex', 'WorkyTwo');

// 5. Zero false-positives on unrelated text
const textUnrelated = `Vand set jante aliaj R18 BMW originale, fara suduri, stare foarte buna`;
const sigUnrelated = extractInventorySignatureFromText(textUnrelated);
assert(sigUnrelated.stockNumber === null, 'Nu extrage stockNumber pe text fără legătură (zero false-positives)', 'Engine/Regex', 'WorkyTwo');
assert(sigUnrelated.vin === null, 'Nu extrage VIN pe text fără legătură', 'Engine/Regex', 'WorkyTwo');

// 6. OLX ID Extraction from URL
assert(extractOlxId('https://www.olx.ro/d/oferta/bmw-seria-5-2019-IDi8Yzk.html') === 'i8Yzk', 'Extrage OLX ID din URL standard web', 'Engine/Regex', 'WorkyThree');
assert(extractOlxId('https://m.olx.ro/oferta/audi-a6-s-line-IDkCF6U.html') === 'kCF6U', 'Extrage OLX ID din URL mobil', 'Engine/Regex', 'WorkyThree');
assert(extractOlxId('https://www.olx.ro/oferta/audi-a6-9182371.html') === '9182371', 'Extrage OLX ID numeric', 'Engine/Regex', 'WorkyThree');

// =========================================================================
// TIER 3: Process Logic, Priority Reconciler & CARVANA Invariants
// =========================================================================

// 1. Reconcile by Stock Number (Priority 1)
const candidateStock: OlxRawAdCandidate = {
  url: 'https://www.olx.ro/d/oferta/bmw-seria-5-2019-IDxyz12.html',
  id: 'xyz12',
  title: 'BMW Seria 5 520d xDrive 2019',
  description: 'Garantie inclusa. ID Referinta Parc: #RXM-7412. Disponibil in stoc.'
};
const matchStock = reconcileAdWithInventory(candidateStock, mockCars);
assert(matchStock.matchType === 'stock_number', 'Prioritate 1: Potrivire deterministă după Stock Number', 'Process/Invariants', 'WorkyThree');
assert(matchStock.matchedCar?.id === 'bmw-520d-2019-rxm-7412', 'Mașina identificată corect după Stock Number', 'Process/Invariants', 'WorkyThree');

// 2. Reconcile by VIN (Priority 2)
const candidateVin: OlxRawAdCandidate = {
  url: 'https://www.olx.ro/d/oferta/bmw-seria-5-2019-IDabc99.html',
  id: 'abc99',
  title: 'BMW Seria 5 Pachet M',
  description: 'Serie Sasiu (VIN): WBA5D31080D741216. Kilometraj garantat.'
};
const matchVin = reconcileAdWithInventory(candidateVin, mockCars);
assert(matchVin.matchType === 'vin', 'Prioritate 2: Potrivire după VIN când tagul lipsește', 'Process/Invariants', 'WorkyThree');
assert(matchVin.matchedCar?.id === 'bmw-520d-2019-rxm-7412', 'Mașina identificată corect după VIN', 'Process/Invariants', 'WorkyThree');

// 3. Reconcile by existing OLX ID (Priority 3)
const candidateOlxId: OlxRawAdCandidate = {
  url: 'https://www.olx.ro/d/oferta/audi-a6-actualizat-IDi8Yzk.html',
  id: 'i8Yzk',
  title: 'Audi A6 40 TDI 2020',
  description: 'Anunț fără tag de inventar'
};
const matchOlxId = reconcileAdWithInventory(candidateOlxId, mockCars);
assert(matchOlxId.matchType === 'olx_id', 'Prioritate 3: Potrivire după OLX ID deja înregistrat', 'Process/Invariants', 'WorkyThree');
assert(matchOlxId.matchedCar?.id === 'audi-a6-2020-rxm-8890', 'Mașina Audi asociată corect prin OLX ID', 'Process/Invariants', 'WorkyThree');

// 4. Protection against false matches
const candidateNoMatch: OlxRawAdCandidate = {
  url: 'https://www.olx.ro/d/oferta/bmw-seria-3-2015-IDnomatch.html',
  id: 'nomatch',
  title: 'BMW Seria 3 320d 2015',
  description: 'Mașină privată fără nicio legătură cu parcul auto'
};
const matchNone = reconcileAdWithInventory(candidateNoMatch, mockCars);
assert(matchNone.matchType === 'none', 'Respinge anunțuri fără identificator comun (matchType: none)', 'Process/Invariants', 'WorkyThree');
assert(matchNone.matchedCar === null, 'matchedCar este null pe anunț extern', 'Process/Invariants', 'WorkyThree');

// 5. Bulk reconciliation batch
const batchAds: OlxRawAdCandidate[] = [candidateStock, candidateVin, candidateNoMatch];
const bulkResults = bulkReconcileInventory(batchAds, mockCars);
assert(bulkResults.length === 2, 'Reconcilierea în lot identifică exact cele 2 mașini din parc', 'Process/Invariants', 'WorkyFour');
assert(bulkResults[0].wasUnlinked === true, 'Setează corect flagul wasUnlinked pentru mașina legată nou', 'Process/Invariants', 'WorkyFour');

// 6. Discrepancy Matrix Tests
assert(computeOlxDiscrepancy('sold', 'active') === 'sold_but_active_on_olx', 'Detectează discrepanță critică: Vândută în showroom dar activă pe OLX', 'Process/Invariants', 'WorkyFour');
assert(computeOlxDiscrepancy('in_stock', 'expired') === 'in_stock_but_gone_on_olx', 'Detectează discrepanță: În stoc fizic dar expirată pe OLX', 'Process/Invariants', 'WorkyFour');
assert(computeOlxDiscrepancy('in_stock', 'active') === 'none', 'Nicio discrepanță când mașina în stoc este activă pe OLX', 'Process/Invariants', 'WorkyFour');
assert(computeOlxDiscrepancy('in_stock', 'unlinked') === 'none', 'Nicio discrepanță falsă când mașina nu este încă legată la OLX', 'Process/Invariants', 'WorkyFour');

// 7. Edge node cooldown guard
const metaCooling = {
  generatedByNode: 'S9',
  lastSyncAt: new Date().toISOString(),
  cooldownMinutes: 15,
  nextAllowedSyncAt: new Date(Date.now() + 10 * 60000).toISOString(),
  totalVehicles: 10,
  activeOnOlx: 5,
  expiredOnOlx: 1,
  unlinked: 4,
  criticalSoldActiveDiscrepancies: 0,
  disappearedFromOlxDiscrepancies: 0
};
const cooldownResult = checkEdgeNodeCooldown(metaCooling);
assert(cooldownResult.isCoolingDown === true, 'Cooldown Guard activ în perioada de așteptare', 'Process/Invariants', 'WorkyFour');
assert(cooldownResult.remainingMinutes >= 9, 'Calculează corect minutele rămase din cooldown', 'Process/Invariants', 'WorkyFour');

// 8. Strict CARVANA Invariants
assert(fullDesc.includes('TVA deductibil 21%'), 'Invariant TVA 21%: Mențiune clară de TVA deductibil 21%', 'Process/Invariants', 'WorkyFour');
assert(fullDesc.includes('Cont de Garantie'), 'Invariant Terminologie: Strict „Cont de Garantie” (prezent în descriere)', 'Process/Invariants', 'WorkyFour');
assert(!fullDesc.toLowerCase().includes('escrow'), 'Invariant Securitate: Eliminare completă a termenului „escrow”', 'Process/Invariants', 'WorkyFour');
assert(!fullDesc.toLowerCase().includes('cont fiduciar'), 'Invariant Securitate: Fără „cont fiduciar”', 'Process/Invariants', 'WorkyFour');

// =========================================================================
// EXECUTIVE REPORT SYNTHESIS & EXIT CODE
// =========================================================================

console.log('-------------------------------------------------------------------------');
console.log('📋 RAPORT DETALIAT TESTE QA OLX RECONCILER SUITE:');
console.log('-------------------------------------------------------------------------');

const failed = results.filter(r => !r.passed);
const passed = results.filter(r => r.passed);

results.forEach((r, idx) => {
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} [${r.tier}] [${r.worker}] #${idx + 1}: ${r.name}`);
  if (!r.passed && r.details) {
    console.log(`   └─ EROARE: ${r.details}`);
  }
});

console.log('-------------------------------------------------------------------------');
console.log(`🏁 Total Scenarii: ${results.length} | Trecute: ${passed.length} | Eșuate: ${failed.length}`);
console.log('-------------------------------------------------------------------------');

if (failed.length > 0) {
  process.exit(1);
} else {
  console.log('🎉 Toate testele QA au trecut cu 100% SUCCESS!');
  process.exit(0);
}
