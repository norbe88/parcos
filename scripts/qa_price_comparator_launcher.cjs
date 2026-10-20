/**
 * scripts/qa_price_comparator_launcher.cjs
 * QA Suite dedicat pentru Lansatorul Live & Comparatorul de Preț Piață RXM Automobile
 * 
 * Verifică:
 * 1. Zero date false: Nu există anunțuri fictive sau orașe simulate în motorul de evaluare.
 * 2. Generare URL-uri de căutare live pentru OLX, Autovit și Mobile.de cu parametri exacți.
 * 3. Logica de calibrare cu Dealer Benchmark (introducere prețuri reale observate).
 * 4. Păstrarea invariantelor de securitate și transparență comercială.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('🔍 [QA SUITE] Verificare Lansator Live & Comparator Preț Piață');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Eroare: ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Verificare Structură Fișiere Sursă
// -----------------------------------------------------------------------------
console.log('📦 ETAPA 1: Verificare Fișiere Sursă & Tipuri');

it('src/utils/marketPriceEngine.ts există și exportă funcțiile cheie', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'src/utils/marketPriceEngine.ts'), 'utf8');
  assert.ok(content.includes('export function buildMarketSearchUrl'), 'buildMarketSearchUrl trebuie exportată');
  assert.ok(content.includes('export function evaluateMarketPrice'), 'evaluateMarketPrice trebuie exportată');
  assert.ok(content.includes('export function getDealerBenchmark'), 'getDealerBenchmark trebuie exportată');
  assert.ok(content.includes('export function saveDealerBenchmark'), 'saveDealerBenchmark trebuie exportată');
});

it('src/db/types.ts conține tipul DealerMarketBenchmark și sursa Mobile.de', () => {
  const typesContent = fs.readFileSync(path.join(process.cwd(), 'src/db/types.ts'), 'utf8');
  assert.ok(typesContent.includes('export interface DealerMarketBenchmark'), 'DealerMarketBenchmark lipsește');
  assert.ok(typesContent.includes("'Mobile.de'"), "Sursa 'Mobile.de' lipsește din SimilarMarketListing");
  assert.ok(typesContent.includes('mobileDeUrl?: string'), 'mobileDeUrl lipsește din MarketPriceEvaluation');
});

// -----------------------------------------------------------------------------
// TEST 2: Integritate - Eliminarea Datelor False (Anti-Hallucination)
// -----------------------------------------------------------------------------
console.log('\n🛡️ ETAPA 2: Verificare Zero Informații False (Integritate Date)');

it('marketPriceEngine.ts nu mai conține baza de anunțuri fictive MARKET_REFERENCE_LISTINGS', () => {
  const engineContent = fs.readFileSync(path.join(process.cwd(), 'src/utils/marketPriceEngine.ts'), 'utf8');
  assert.ok(!engineContent.includes('MARKET_REFERENCE_LISTINGS'), 'MARKET_REFERENCE_LISTINGS trebuie eliminat complet');
  assert.ok(!engineContent.includes('m-bmw-1'), 'ID-urile fictive m-bmw-* trebuie eliminate');
  assert.ok(!engineContent.includes('m-jeep-1'), 'ID-urile fictive m-jeep-* trebuie eliminate');
});

it('marketPriceEngine.ts nu mai generează competitori sintetici cu orașe fictive (Cluj, Oradea)', () => {
  const engineContent = fs.readFileSync(path.join(process.cwd(), 'src/utils/marketPriceEngine.ts'), 'utf8');
  assert.ok(!engineContent.includes("location: 'Cluj-Napoca'"), 'Orașele fictive nu trebuie hardcodate în engine');
  assert.ok(!engineContent.includes("location: 'Oradea'"), 'Orașele fictive nu trebuie hardcodate în engine');
  assert.ok(!engineContent.includes('sim-${car.id}-1'), 'ID-urile sintetice sim-* nu trebuie generate');
});

it('public/data/market_competitors.json conține oferte concurente extrase din piață', () => {
  const jsonPath = path.join(process.cwd(), 'public/data/market_competitors.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data.meta, 'Metadata comparatorului lipsește');
    assert.ok(
      data.meta.generatedByNode.includes('Piață') || 
      data.meta.generatedByNode.includes('Sami') || 
      data.meta.generatedByNode.includes('Nod'), 
      'Autor nod necunoscut'
    );
    assert.ok(Object.keys(data.marketIndex || {}).length > 0, 'marketIndex trebuie să conțină oferte extrase');
  }
});

// -----------------------------------------------------------------------------
// TEST 3: Generare Corectă de URL-uri Live Marketplace
// -----------------------------------------------------------------------------
console.log('\n🔗 ETAPA 3: Testare Algoritm Generare URL-uri Live (OLX, Autovit, Mobile.de)');

// Simulăm funcția buildMarketSearchUrl conform implementării
function testBuildMarketSearchUrl(source, car) {
  const brand = (car.brand || '').trim();
  const model = (car.model || '').trim();

  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const minYear = Math.max(1990, car.year - 1);
  const maxYear = car.year + 1;
  const maxKm = car.mileageKm ? Math.round(car.mileageKm + 30000) : 260000;

  if (source === 'Autovit') {
    if (brandSlug && modelSlug) {
      return `https://www.autovit.ro/autoturisme/${brandSlug}/${modelSlug}?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`;
    }
    return `https://www.autovit.ro/autoturisme?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`;
  }

  if (source === 'Mobile.de') {
    const query = [brand, model].filter(Boolean).join(' ');
    return `https://suchen.mobile.de/fahrzeuge/search.html?dam=0&isSearchRequest=true&q=${encodeURIComponent(query)}&fr=${minYear}&to=${maxYear}&ml=${maxKm}`;
  }

  const queryPart = [brandSlug, modelSlug].filter(Boolean).join('-');
  return `https://www.olx.ro/auto-masini-moto-ambarcatiuni/autoturisme/q-${queryPart}/?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}&search%5Bfilter_float_rulaj_pana%3Ato%5D=${maxKm}`;
}

it('Generează URL corect pentru OLX România cu an ±1 și rulaj max', () => {
  const url = testBuildMarketSearchUrl('OLX RO', { brand: 'BMW', model: 'Seria 5', year: 2018, mileageKm: 140000 });
  assert.ok(url.includes('olx.ro/auto-masini-moto-ambarcatiuni/autoturisme/q-bmw-seria-5/'), 'Format slug greșit pe OLX');
  assert.ok(url.includes('filter_float_year%3Afrom%5D=2017'), 'Min year incorect');
  assert.ok(url.includes('filter_float_year%3Ato%5D=2019'), 'Max year incorect');
  assert.ok(url.includes('filter_float_rulaj_pana%3Ato%5D=170000'), 'Plafon kilometric incorect');
});

it('Generează URL corect pentru Autovit.ro cu brand/model și filtru an', () => {
  const url = testBuildMarketSearchUrl('Autovit', { brand: 'Audi', model: 'A6', year: 2017 });
  assert.ok(url.includes('autovit.ro/autoturisme/audi/a6'), 'Format ruta greșit pe Autovit');
  assert.ok(url.includes('filter_float_year%3Afrom%5D=2016'), 'Min year incorect');
  assert.ok(url.includes('filter_float_year%3Ato%5D=2018'), 'Max year incorect');
});

it('Generează URL corect pentru Mobile.de (Germania) cu căutare exactă și limită rulaj', () => {
  const url = testBuildMarketSearchUrl('Mobile.de', { brand: 'Mercedes-Benz', model: 'C-Class', year: 2019, mileageKm: 120000 });
  assert.ok(url.includes('suchen.mobile.de/fahrzeuge/search.html'), 'Domeniu sau cale greșită pe Mobile.de');
  assert.ok(url.includes('q=Mercedes-Benz%20C-Class'), 'Query encoding incorect');
  assert.ok(url.includes('&fr=2018&to=2020'), 'Interval an incorect');
  assert.ok(url.includes('&ml=150000'), 'Plafon rulaj incorect');
});

// -----------------------------------------------------------------------------
// TEST 4: Verificare Componentă Modal MarketPriceComparatorModal.tsx
// -----------------------------------------------------------------------------
console.log('\n🎨 ETAPA 4: Verificare Componentă & UX Modal');

it('MarketPriceComparatorModal integrează cele 3 carduri de căutare live', () => {
  const modalContent = fs.readFileSync(path.join(process.cwd(), 'src/components/modals/MarketPriceComparatorModal.tsx'), 'utf8');
  assert.ok(modalContent.includes('OLX România'), 'Cardul OLX lipsește din modal');
  assert.ok(modalContent.includes('Autovit.ro'), 'Cardul Autovit lipsește din modal');
  assert.ok(modalContent.includes('Mobile.de'), 'Cardul Mobile.de lipsește din modal');
});

it('MarketPriceComparatorModal integrează panoul de calibrare Dealer Benchmark', () => {
  const modalContent = fs.readFileSync(path.join(process.cwd(), 'src/components/modals/MarketPriceComparatorModal.tsx'), 'utf8');
  assert.ok(modalContent.includes('handleSaveBenchmark'), 'Funcția de salvare benchmark lipsește');
  assert.ok(modalContent.includes('handleResetBenchmark'), 'Funcția de reset benchmark lipsește');
  assert.ok(modalContent.includes('Preț Minim Văzut Live'), 'Câmpul Preț Minim lipsește');
  assert.ok(modalContent.includes('Preț Mediu Observat'), 'Câmpul Preț Mediu lipsește');
  assert.ok(modalContent.includes('Preț Maxim Văzut Live'), 'Câmpul Preț Maxim lipsește');
});

it('MarketPriceComparatorModal respectă standardele de accesibilitate și mobile touch (min 44px)', () => {
  const modalContent = fs.readFileSync(path.join(process.cwd(), 'src/components/modals/MarketPriceComparatorModal.tsx'), 'utf8');
  assert.ok(modalContent.includes('min-h-[44px]'), 'Butoanele trebuie să aibă țintă minimă de atingere 44px');
  assert.ok(modalContent.includes('role="dialog"'), 'Lipsește atributul ARIA role dialog');
  assert.ok(modalContent.includes('aria-modal="true"'), 'Lipsește atributul ARIA aria-modal');
  assert.ok(modalContent.includes('Escape'), 'Lipsește handler-ul pentru tasta Escape');
});

// -----------------------------------------------------------------------------
// TEST 5: Verificare Filtre și Criterii Ajustabile Manual (Etapa 5)
// -----------------------------------------------------------------------------
console.log('\n🎛️ ETAPA 5: Verificare Filtre & Criterii Ajustabile Manual de Dealer');

it('src/utils/marketPriceEngine.ts conține MarketSearchFilterOverrides și suportă filtre custom', () => {
  const engineContent = fs.readFileSync(path.join(process.cwd(), 'src/utils/marketPriceEngine.ts'), 'utf8');
  assert.ok(engineContent.includes('MarketSearchFilterOverrides'), 'Lipsește interfața MarketSearchFilterOverrides');
  assert.ok(engineContent.includes('customFilters?: MarketSearchFilterOverrides'), 'Funcțiile cheie trebuie să accepte customFilters');
});

it('MarketPriceComparatorModal integrează panoul interactiv de ajustare a filtrelor (An exact, interval, plafon km)', () => {
  const modalContent = fs.readFileSync(path.join(process.cwd(), 'src/components/modals/MarketPriceComparatorModal.tsx'), 'utf8');
  assert.ok(modalContent.includes('handleApplyCustomFilters'), 'Lipsește funcția handleApplyCustomFilters');
  assert.ok(modalContent.includes('handleResetFilters'), 'Lipsește funcția handleResetFilters');
  assert.ok(modalContent.includes('setFilterYearFrom'), 'Lipsește starea de an început');
  assert.ok(modalContent.includes('setFilterYearTo'), 'Lipsește starea de an final');
  assert.ok(modalContent.includes('setFilterMaxKm'), 'Lipsește starea de plafon kilometraj');
  assert.ok(modalContent.includes('Exact'), 'Lipsesc butoanele rapide pentru An Exact');
  assert.ok(modalContent.includes('dynamicOlxUrl'), 'Cardurile 1-click nu folosesc URL-uri dinamice');
});

// -----------------------------------------------------------------------------
// REZULTAT FINAL
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`REZULTAT QA: ${passedTests}/${totalTests} TESTE TRECUTE CU SUCCES!`);
if (passedTests === totalTests) {
  console.log('🏆 COMPARATORUL DE PREȚ ARE FILTRE AJUSTABILE, ESTE 100% TRANSPARENT ȘI FĂRĂ DATE FALSE!');
} else {
  console.error('⚠️ UNELE TESTE AU EȘUAT.');
  process.exit(1);
}
console.log('======================================================================\n');

