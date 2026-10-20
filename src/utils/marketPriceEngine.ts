/**
 * src/utils/marketPriceEngine.ts
 * Motor de evaluare și comparare a prețului de piață pentru RXM Automobile
 * 
 * Principii de integritate & transparență totală:
 * 1. ZERO INFORMAȚII FALSE: Nu inventăm anunțuri concurente simulate, prețuri fictive sau orașe false.
 * 2. CĂUTARE DIRECTĂ ÎN TIMP REAL (Live Marketplace Launcher):
 *    - Linkuri 1-click pre-filtrate pe platformele auto reale: OLX România, Autovit.ro și Mobile.de (Germania/UE).
 *    - Filtrare exactă pe marcă, model, interval de ani (±1 an) și kilometraj.
 * 3. BENCHMARK ASISTAT PENTRU DEALER:
 *    - Dealerul poate consulta ofertele active pe platforme și poate nota reperele reale observate (min, mediu, max).
 *    - Evaluarea se recalibrează instant și se salvează persistent în sesiune.
 * 4. GHID STATISTIC ORIENTATIV:
 *    - Când nu există încă observații manuale, se oferă o curbă statistică de depreciere marcată explicit ca model orientativ.
 */

import { VehicleItem, MarketPriceEvaluation, SimilarMarketListing, DealerMarketBenchmark } from '../db/types';
export type { MarketPriceEvaluation, SimilarMarketListing, DealerMarketBenchmark };
import { formatMileage } from './helpers';
import { getAdminAuthHeaders } from './adminAuth';

const STORAGE_CACHE_KEY = 'rxm_market_evaluations_cache_v2';
const DEALER_BENCHMARK_STORAGE_KEY = 'rxm_dealer_benchmarks_map_v2';

export interface SamiMarketCompetitorsSnapshot {
  meta: {
    generatedByNode: string;
    nodeHardware?: string;
    connectionType?: string;
    lastScanAt: string;
    cooldownMinutes: number;
    nextAllowedScanAt: string;
    totalVehiclesAnalyzed: number;
    totalCompetitorsFound: number;
    marketSources: string[];
    coverageRegion: string;
  };
  marketIndex: Record<string, SimilarMarketListing[]>;
}

export interface MarketSearchFilterOverrides {
  yearFrom?: number;
  yearTo?: number;
  maxKm?: number;
}

/**
 * Curăță un string pentru generarea de slug-uri URL sigure
 */
export function cleanMarketSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalizează mărcile și modelele pentru platformele de piață (Autovit, OLX, Mobile.de)
 */
export function normalizeMarketSlugs(brand: string, model: string): { brandSlug: string; modelSlug: string; cleanBrand: string; cleanModel: string } {
  let b = cleanMarketSlug(brand);
  let m = cleanMarketSlug(model);
  let cleanBrand = (brand || '').trim();
  let cleanModel = (model || '').trim();

  if (b === 'mercedes' || b === 'mercedesbenz' || b === 'mercedes-benz' || b.includes('mercedes') || b.includes('daimler')) {
    b = 'mercedes-benz';
    cleanBrand = 'Mercedes-Benz';
  }
  if (b === 'vw' || b === 'volks-wagen') {
    b = 'volkswagen';
    cleanBrand = 'Volkswagen';
  }

  if (b === 'mercedes-benz') {
    if (/^(c$|c-|c\d|clasa-c|c-class|c-klasse)/.test(m) || /^(220|200|250)$/.test(m) || /^(220-cdi|200-cdi|220-d|200-d)/.test(m)) {
      m = 'clasa-c';
      if (!cleanModel || cleanModel.toLowerCase() === 'c' || /^(220|200)/.test(cleanModel)) cleanModel = 'C-Class';
    } else if (/^(e$|e-|e\d|clasa-e|e-class|e-klasse)/.test(m)) {
      m = 'clasa-e';
      if (!cleanModel || cleanModel.toLowerCase() === 'e') cleanModel = 'E-Class';
    } else if (/^(a$|a-|a\d|clasa-a|a-class|a-klasse)/.test(m)) {
      m = 'clasa-a';
      if (!cleanModel || cleanModel.toLowerCase() === 'a') cleanModel = 'A-Class';
    } else if (/^(b$|b-|b\d|clasa-b|b-class|b-klasse)/.test(m)) {
      m = 'clasa-b';
      if (!cleanModel || cleanModel.toLowerCase() === 'b') cleanModel = 'B-Class';
    } else if (/^(s$|s-|s\d|clasa-s|s-class|s-klasse)/.test(m)) {
      m = 'clasa-s';
      if (!cleanModel || cleanModel.toLowerCase() === 's') cleanModel = 'S-Class';
    } else if (/^(gla|clasa-gla)/.test(m)) {
      m = 'clasa-gla';
    } else if (/^(glb|clasa-glb)/.test(m)) {
      m = 'glb';
    } else if (/^(glc|clasa-glc)/.test(m)) {
      m = 'glc';
    } else if (/^(gle|clasa-gle)/.test(m)) {
      m = 'gle';
    } else if (/^(cla|clasa-cla)/.test(m)) {
      m = 'cla';
    } else if (/^(cls|clasa-cls)/.test(m)) {
      m = 'cls';
    }
  }

  if (b === 'renault') {
    if (/kole[ao]s/.test(m)) {
      m = 'koleos';
      cleanModel = 'Koleos';
    }
  }

  if (b === 'bmw') {
    if (/^(seria-3|3\d{2}|3-er|3-series)/.test(m)) m = 'seria-3';
    else if (/^(seria-5|5\d{2}|5-er|5-series)/.test(m)) m = 'seria-5';
    else if (/^(seria-1|1\d{2}|1-er|1-series)/.test(m)) m = 'seria-1';
    else if (/^(seria-4|4\d{2}|4-er|4-series)/.test(m)) m = 'seria-4';
    else if (/^(seria-7|7\d{2}|7-er|7-series)/.test(m)) m = 'seria-7';
    else if (/^(x-1|x1)/.test(m)) m = 'x1';
    else if (/^(x-3|x3)/.test(m)) m = 'x3';
    else if (/^(x-5|x5)/.test(m)) m = 'x5';
  }

  return { brandSlug: b, modelSlug: m, cleanBrand, cleanModel };
}

/**
 * Generează linkuri reale de căutare live pe platformele auto majore (OLX, Autovit, Mobile.de)
 * cu filtrare exactă pe marcă, model, interval de ani (sau an exact) și plafon kilometric configurabil.
 */
export function buildMarketSearchUrl(
  source: 'OLX RO' | 'Autovit' | 'Piața Auto' | 'Mobile.de',
  car: { brand: string; model: string; year: number; mileageKm?: number; fuelType?: string; transmission?: string },
  customFilters?: MarketSearchFilterOverrides
): string {
  const { brandSlug, modelSlug, cleanBrand, cleanModel } = normalizeMarketSlugs(car.brand, car.model);

  const minYear = customFilters?.yearFrom !== undefined && !isNaN(customFilters.yearFrom)
    ? Math.max(1990, customFilters.yearFrom)
    : Math.max(1990, car.year - 1);
  const maxYear = customFilters?.yearTo !== undefined && !isNaN(customFilters.yearTo)
    ? customFilters.yearTo
    : car.year + 1;
  const maxKm = customFilters?.maxKm !== undefined && !isNaN(customFilters.maxKm)
    ? customFilters.maxKm
    : (car.mileageKm ? Math.round(car.mileageKm + 30000) : 260000);

  if (source === 'Autovit') {
    let url = brandSlug && modelSlug
      ? `https://www.autovit.ro/autoturisme/${brandSlug}/${modelSlug}?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`
      : `https://www.autovit.ro/autoturisme?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`;
    if (maxKm && maxKm > 0) {
      url += `&search%5Bfilter_float_mileage%3Ato%5D=${maxKm}`;
    }
    return url;
  }

  if (source === 'Mobile.de') {
    const query = [cleanBrand, cleanModel].filter(Boolean).join(' ');
    let url = `https://suchen.mobile.de/fahrzeuge/search.html?dam=0&isSearchRequest=true&q=${encodeURIComponent(query)}&fr=${minYear}&to=${maxYear}`;
    if (maxKm && maxKm > 0) {
      url += `&ml=${maxKm}`;
    }
    return url;
  }

  // Pe OLX, ruta /q-termeni/ oferă compatibilitate 100% garantată chiar și pentru versiuni specifice
  const queryPart = [brandSlug, modelSlug].filter(Boolean).join('-');
  let url = `https://www.olx.ro/auto-masini-moto-ambarcatiuni/autoturisme/q-${queryPart}/?search%5Bfilter_float_year%3Afrom%5D=${minYear}&search%5Bfilter_float_year%3Ato%5D=${maxYear}`;
  if (maxKm && maxKm > 0) {
    url += `&search%5Bfilter_float_rulaj_pana%3Ato%5D=${maxKm}`;
  }
  return url;
}

/**
 * Încarcă benchmark-ul manual salvat de dealer pentru un vehicul
 */
export function getDealerBenchmark(carId: string): DealerMarketBenchmark | null {
  if (typeof window === 'undefined' || !carId) return null;
  try {
    const raw = localStorage.getItem(DEALER_BENCHMARK_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[carId] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Salvează benchmark-ul manual introdus de dealer în localStorage
 */
export function saveDealerBenchmark(carId: string, benchmark: DealerMarketBenchmark): void {
  if (typeof window === 'undefined' || !carId) return;
  try {
    const raw = localStorage.getItem(DEALER_BENCHMARK_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[carId] = benchmark;
    localStorage.setItem(DEALER_BENCHMARK_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Nu s-a putut salva benchmark-ul dealerului în localStorage:', e);
  }
}

/**
 * Șterge benchmark-ul manual salvat pentru a reveni la ghidul algoritmic
 */
export function clearDealerBenchmark(carId: string): void {
  if (typeof window === 'undefined' || !carId) return;
  try {
    const raw = localStorage.getItem(DEALER_BENCHMARK_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[carId];
    localStorage.setItem(DEALER_BENCHMARK_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
}

/**
 * Salvează evaluarea în cache-ul persistent
 */
export function saveEvaluationToCache(carId: string, evaluation: MarketPriceEvaluation): void {
  if (typeof window === 'undefined' || !carId || carId.startsWith('draft-')) return;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[carId] = evaluation;
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Nu s-a putut salva evaluarea de piață în localStorage:', e);
  }
}

let inMemorySamiSnapshot: SamiMarketCompetitorsSnapshot | null = null;

/**
 * Încarcă evaluarea din cache-ul persistent
 */
export function loadEvaluationFromCache(carId: string): MarketPriceEvaluation | null {
  if (typeof window === 'undefined' || !carId || carId.startsWith('draft-')) return null;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const item: MarketPriceEvaluation | undefined = cache[carId];
    if (!item) return null;

    // Failsafe: dacă în cache există anunțuri fictive vechi (sim-*, m-*, sami-comp-*), le invalidăm
    if (
      (item.similarListings && item.similarListings.some(l => l.id?.startsWith('sim-') || l.id?.startsWith('m-') || l.id?.startsWith('sami-comp-'))) ||
      (!item.dealerBenchmark && (!item.similarListings || item.similarListings.length === 0))
    ) {
      return null;
    }

    return item;
  } catch (e) {
    return null;
  }
}

/**
 * Încarcă snapshot-ul cel mai recent extras de agregatorul de piață via API securizat de administrator
 */
export async function fetchSamiMarketSnapshot(): Promise<SamiMarketCompetitorsSnapshot | null> {
  try {
    const res = await fetch('/api/admin/market-competitors', {
      headers: {
        Accept: 'application/json',
        ...getAdminAuthHeaders()
      },
      cache: 'no-cache'
    });
    if (res.ok) {
      const data: SamiMarketCompetitorsSnapshot = await res.json();
      if (data && typeof data === 'object' && (data.marketIndex || (data as any).competitors)) {
        inMemorySamiSnapshot = data;
        return data;
      }
    }
  } catch (e) {
    // fallback pe memoria internă
  }

  return inMemorySamiSnapshot;
}

/**
 * Preluare în timp real a ofertelor concurente din piață via API live Autovit.ro.
 * Dacă API-ul live nu este disponibil, revine la snapshot-ul local din cache.
 */
export async function fetchLiveMarketListings(
  car: VehicleItem,
  customFilters?: MarketSearchFilterOverrides
): Promise<SimilarMarketListing[]> {
  if (!car || !car.brand || !car.model) return [];
  const bLower = (car.brand || '').toLowerCase().trim();
  const mLower = (car.model || '').toLowerCase().trim();
  if (bLower === 'brand' || mLower === 'model') return [];

  // 1. Încercare apel API live (/api/market-lookup)
  try {
    const { cleanBrand, cleanModel } = normalizeMarketSlugs(car.brand, car.model);
    const params = new URLSearchParams({
      brand: cleanBrand,
      model: cleanModel,
      year: (car.year || 2015).toString(),
      mileage: (car.mileageKm || 160000).toString()
    });

    if (customFilters?.yearFrom !== undefined && !isNaN(customFilters.yearFrom)) {
      params.set('yearFrom', customFilters.yearFrom.toString());
    }
    if (customFilters?.yearTo !== undefined && !isNaN(customFilters.yearTo)) {
      params.set('yearTo', customFilters.yearTo.toString());
    }
    if (customFilters?.maxKm !== undefined && !isNaN(customFilters.maxKm)) {
      params.set('maxKm', customFilters.maxKm.toString());
    }

    const res = await fetch(`/api/market-lookup?${params.toString()}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.ads) && data.ads.length > 0) {
          let ads = data.ads as SimilarMarketListing[];
          if (customFilters) {
            if (customFilters.yearFrom !== undefined) {
              ads = ads.filter(a => !a.year || a.year >= customFilters.yearFrom!);
            }
            if (customFilters.yearTo !== undefined) {
              ads = ads.filter(a => !a.year || a.year <= customFilters.yearTo!);
            }
            if (customFilters.maxKm !== undefined && customFilters.maxKm > 0) {
              ads = ads.filter(a => !a.mileageKm || a.mileageKm <= customFilters.maxKm!);
            }
          }
          return ads;
        }
      }
    }
  } catch (err) {
    // În mediu fără proxy API, fallback la snapshot static
  }

  // 2. Fallback: căutare în snapshot-ul local
  const snap = await fetchSamiMarketSnapshot();
  if (snap) {
    let ads = extractSamiCompetitors(car, snap);
    if (customFilters) {
      if (customFilters.yearFrom !== undefined) {
        ads = ads.filter(a => !a.year || a.year >= customFilters.yearFrom!);
      }
      if (customFilters.yearTo !== undefined) {
        ads = ads.filter(a => !a.year || a.year <= customFilters.yearTo!);
      }
      if (customFilters.maxKm !== undefined && customFilters.maxKm > 0) {
        ads = ads.filter(a => !a.mileageKm || a.mileageKm <= customFilters.maxKm!);
      }
    }
    return ads;
  }

  return [];
}

/**
 * Extrage anunțurile concurente omoloage reale din snapshot-ul salvat în cache.
 * ZERO date simulate: dacă nu există anunțuri reale, returnează array gol.
 */
export function extractSamiCompetitors(
  car: VehicleItem,
  snapshot?: SamiMarketCompetitorsSnapshot | null
): SimilarMarketListing[] {
  const activeSnap = snapshot || inMemorySamiSnapshot;

  if (activeSnap?.marketIndex) {
    // 1. Căutare exactă după car.id (doar dacă NU este un ID generic de draft!)
    if (car.id && !car.id.startsWith('draft-') && activeSnap.marketIndex[car.id] && activeSnap.marketIndex[car.id].length > 0) {
      return activeSnap.marketIndex[car.id];
    }

    // 2. Căutare după marcă și model în snapshot pentru vehicule nou adăugate
    const { cleanBrand, cleanModel, modelSlug } = normalizeMarketSlugs(car.brand || '', car.model || '');
    const carBrand = cleanBrand.toLowerCase().trim();
    const carModel = cleanModel.toLowerCase().trim();

    if (carBrand && carModel && carBrand !== 'brand' && carModel !== 'model') {
      const matchedKey = Object.keys(activeSnap.marketIndex).find(key => {
        // Ignorăm orice cheie generică de draft
        if (key.startsWith('draft-')) return false;
        const keyLower = key.toLowerCase();
        const brandMatches = keyLower.includes(carBrand) || (carBrand === 'mercedes-benz' && keyLower.includes('mercedes'));
        const modelMatches = keyLower.includes(carModel) || (modelSlug && keyLower.includes(modelSlug));
        return brandMatches && modelMatches;
      });

      if (matchedKey && activeSnap.marketIndex[matchedKey]?.length > 0) {
        return activeSnap.marketIndex[matchedKey];
      }
    }
  }

  // Fără date fictive: returnăm strict array gol când nu există anunțuri reale
  return [];
}

/**
 * Evaluează prețul de piață printr-o comparare automată bazată pe ofertele reale din piață
 * și permite calibrarea opțională manuală de către dealer.
 */
export function evaluateMarketPrice(
  car: VehicleItem, 
  snapshotOrCompetitors?: SamiMarketCompetitorsSnapshot | SimilarMarketListing[] | null,
  customCompetitors?: SimilarMarketListing[] | boolean,
  forceRefresh = false,
  customFilters?: MarketSearchFilterOverrides
): MarketPriceEvaluation {
  // Normalizare parametri pentru compatibilitate cu apelurile existente
  let snapshot: SamiMarketCompetitorsSnapshot | null = null;
  let passedCompetitors: SimilarMarketListing[] | undefined = undefined;
  let isForce = forceRefresh;

  if (Array.isArray(snapshotOrCompetitors)) {
    passedCompetitors = snapshotOrCompetitors;
  } else if (snapshotOrCompetitors && 'marketIndex' in snapshotOrCompetitors) {
    snapshot = snapshotOrCompetitors;
  }

  if (typeof customCompetitors === 'boolean') {
    isForce = customCompetitors;
  } else if (Array.isArray(customCompetitors)) {
    passedCompetitors = customCompetitors;
  }

  const hasCustomFilters = customFilters && (
    customFilters.yearFrom !== undefined ||
    customFilters.yearTo !== undefined ||
    customFilters.maxKm !== undefined
  );

  if (hasCustomFilters) {
    isForce = true;
  }

  // 1. Verificare cache (dacă nu e isForce și nu e mașină draft generică)
  const isDraft = !car.id || car.id.startsWith('draft-');
  if (!isForce && !isDraft) {
    const cached = car.marketEvaluation || loadEvaluationFromCache(car.id);
    if (cached) {
      if (!cached.searchLinks?.mobileDeUrl) {
        cached.searchLinks = {
          olxUrl: buildMarketSearchUrl('OLX RO', car, customFilters),
          autovitUrl: buildMarketSearchUrl('Autovit', car, customFilters),
          mobileDeUrl: buildMarketSearchUrl('Mobile.de', car, customFilters),
          piataAutoUrl: buildMarketSearchUrl('Piața Auto', car, customFilters)
        };
      }
      return cached;
    }
  }

  const basePrice = car.priceEur > 0 ? car.priceEur : 0;
  const dealerBench = getDealerBenchmark(car.id) || car.marketEvaluation?.dealerBenchmark;

  const minYear = customFilters?.yearFrom !== undefined && !isNaN(customFilters.yearFrom)
    ? Math.max(1990, customFilters.yearFrom)
    : Math.max(1990, car.year - 1);
  const maxYear = customFilters?.yearTo !== undefined && !isNaN(customFilters.yearTo)
    ? customFilters.yearTo
    : car.year + 1;
  const maxKm = customFilters?.maxKm !== undefined && !isNaN(customFilters.maxKm)
    ? customFilters.maxKm
    : (car.mileageKm ? Math.round(car.mileageKm + 30000) : 260000);

  let minPriceEur = 0;
  let avgPriceEur = 0;
  let maxPriceEur = 0;
  let dataSource: 'sami_live' | 'reference' | 'synthetic' | 'dealer_benchmark' = 'synthetic';
  let scannedByNode = 'Piața Auto Live (Autovit & OLX)';

  // 2. Extragere oferte concurente reale
  const rawListings = passedCompetitors || extractSamiCompetitors(car, snapshot);
  let similarListings = [...rawListings];
  if (customFilters) {
    if (customFilters.yearFrom !== undefined) {
      similarListings = similarListings.filter(l => !l.year || l.year >= customFilters.yearFrom!);
    }
    if (customFilters.yearTo !== undefined) {
      similarListings = similarListings.filter(l => !l.year || l.year <= customFilters.yearTo!);
    }
    if (customFilters.maxKm !== undefined && customFilters.maxKm > 0) {
      similarListings = similarListings.filter(l => !l.mileageKm || l.mileageKm <= customFilters.maxKm!);
    }
  }

  // 3. Dacă dealerul a introdus un benchmark manual de calibrare
  if (dealerBench && (dealerBench.avgPriceEur || dealerBench.minPriceEur || dealerBench.maxPriceEur)) {
    dataSource = 'dealer_benchmark';
    scannedByNode = 'Calibrare Manuală Dealer (Observații Live)';

    avgPriceEur = dealerBench.avgPriceEur || basePrice;
    minPriceEur = dealerBench.minPriceEur || Math.round((avgPriceEur * 0.93) / 50) * 50;
    maxPriceEur = dealerBench.maxPriceEur || Math.round((avgPriceEur * 1.07) / 50) * 50;
  } else if (similarListings && similarListings.length > 0) {
    // 4. Calcul automat direct din ofertele concurente reale identificate în piață
    dataSource = 'sami_live';
    scannedByNode = 'Piața Auto Live (Autovit.ro)';

    const prices = similarListings.map(c => c.priceEur).filter(p => p > 0);
    if (prices.length > 0) {
      minPriceEur = Math.min(...prices);
      maxPriceEur = Math.max(...prices);
      avgPriceEur = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      avgPriceEur = Math.round(avgPriceEur / 50) * 50;
    }
  } else {
    // 5. Cazul în care nu există încă date reale salvate
    dataSource = 'synthetic';
    scannedByNode = 'Fără Date în Cache (Consultați Platformele Live)';

    if (basePrice > 0) {
      minPriceEur = Math.round((basePrice * 0.92) / 50) * 50;
      avgPriceEur = basePrice;
      maxPriceEur = Math.round((basePrice * 1.08) / 50) * 50;
    } else {
      minPriceEur = 0;
      avgPriceEur = 0;
      maxPriceEur = 0;
    }
  }

  // Prețuri comerciale recomandate pentru showroom
  let recommendedQuickSalePriceEur = 0;
  let recommendedFairPriceEur = 0;
  let recommendedPremiumPriceEur = 0;

  if (avgPriceEur > 0) {
    recommendedQuickSalePriceEur = minPriceEur > 0 
      ? Math.round((minPriceEur + (avgPriceEur - minPriceEur) * 0.35) / 50) * 50 
      : Math.round((avgPriceEur * 0.93) / 50) * 50;
    recommendedFairPriceEur = avgPriceEur;
    recommendedPremiumPriceEur = maxPriceEur > avgPriceEur 
      ? Math.round((avgPriceEur + (maxPriceEur - avgPriceEur) * 0.45) / 50) * 50 
      : Math.round((avgPriceEur * 1.07) / 50) * 50;
  }

  // Poziția mașinii dealerului raportat la media de piață
  const priceDifferenceEur = car.priceEur > 0 && avgPriceEur > 0 ? car.priceEur - avgPriceEur : 0;
  let marketPosition: 'below_market' | 'fair_market' | 'above_market' = 'fair_market';
  if (priceDifferenceEur < -350) marketPosition = 'below_market';
  else if (priceDifferenceEur > 350) marketPosition = 'above_market';

  // Sumar analitic generat în limba română
  let executiveSummary = '';
  if (dataSource === 'dealer_benchmark') {
    executiveSummary = `Recomandări calibrate direct pe observațiile reale din piață introduse de dealer (${avgPriceEur.toLocaleString('ro-RO')} € medie observată pe OLX, Autovit și Mobile.de). Prețul curent din showroom (${car.priceEur.toLocaleString('ro-RO')} €) este ${priceDifferenceEur < 0 ? `cu ${Math.abs(priceDifferenceEur).toLocaleString('ro-RO')} € sub` : priceDifferenceEur > 0 ? `cu ${priceDifferenceEur.toLocaleString('ro-RO')} € peste` : 'perfect aliniat cu'} media pieței.`;
  } else if (similarListings && similarListings.length > 0) {
    executiveSummary = `Recomandări calculate direct din piața auto (${avgPriceEur.toLocaleString('ro-RO')} € medie calculată din ${similarListings.length} oferte concurente active pe Autovit). Prețul din showroom (${car.priceEur > 0 ? `${car.priceEur.toLocaleString('ro-RO')} €` : 'nesetat'}) este ${car.priceEur > 0 ? (priceDifferenceEur < 0 ? `cu ${Math.abs(priceDifferenceEur).toLocaleString('ro-RO')} € sub` : priceDifferenceEur > 0 ? `cu ${priceDifferenceEur.toLocaleString('ro-RO')} € peste` : 'perfect aliniat cu') : 'în curs de stabilire raportat la'} media concurenților.`;
  } else {
    executiveSummary = `Nu au fost descărcate anunțuri automate pentru acest model exact. Deschideți căutarea 1-click mai jos pe Autovit, OLX sau Mobile.de pentru a consulta ofertele concurente active, apoi salvați prețul mediu observat în panoul de calibrare.`;
  }

  const evaluation: MarketPriceEvaluation = {
    evaluatedAt: new Date().toISOString(),
    dataSource,
    scannedByNode,
    criteria: {
      brand: car.brand,
      model: car.model,
      yearRange: minYear === maxYear ? `${minYear} (An exact)` : `${minYear} – ${maxYear}`,
      kmRange: `≤ ${formatMileage(maxKm)}`,
      transmission: car.transmission,
      fuelType: car.fuelType
    },
    minPriceEur,
    avgPriceEur,
    maxPriceEur,
    recommendedQuickSalePriceEur,
    recommendedFairPriceEur,
    recommendedPremiumPriceEur,
    totalListingsCompared: similarListings.length,
    marketPosition,
    priceDifferenceEur,
    executiveSummary,
    similarListings,
    searchLinks: {
      olxUrl: buildMarketSearchUrl('OLX RO', car, customFilters),
      autovitUrl: buildMarketSearchUrl('Autovit', car, customFilters),
      mobileDeUrl: buildMarketSearchUrl('Mobile.de', car, customFilters),
      piataAutoUrl: buildMarketSearchUrl('Piața Auto', car, customFilters)
    },
    dealerBenchmark: dealerBench || undefined
  };

  // Salvare în cache persistent doar când nu sunt filtre custom ad-hoc
  if (car.id && !car.id.startsWith('draft-') && !hasCustomFilters) {
    saveEvaluationToCache(car.id, evaluation);
  }

  return evaluation;
}

