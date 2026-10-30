/**
 * RXM Automobile / ParcOS — Vehicle Views Telemetry Service
 * Colectare pasivă non-blocantă a vizualizărilor reale din showroom (Wave 2)
 * Invariante: Zero PII, Conform GDPR, Prioritizare navigator.sendBeacon cu fallback keepalive fetch
 */

export interface TopViewedCarItem {
  id: string;
  dealerSlug?: string;
  brand: string;
  model: string;
  versionTrim?: string;
  year: number;
  mileageKm: number;
  priceEur: number;
  images: string[];
  status: string;
  periodViews: number;
  allTimeViews: number;
}

export interface TopViewedResponse {
  success: boolean;
  dealer: string;
  timeframe: string;
  count: number;
  topCars: TopViewedCarItem[];
  error?: string;
}

/**
 * Detectează sursa vizitatorului analizând parametrii URL și referrer-ul HTTP
 */
export function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'showroom';

  try {
    const params = new URLSearchParams(window.location.search);
    const srcParam = params.get('src') || params.get('source');
    if (srcParam) {
      if (srcParam.toLowerCase().includes('qr') || srcParam === 'window_qr') {
        return 'window_qr';
      }
      return srcParam.slice(0, 30);
    }

    const utmSource = params.get('utm_source');
    if (utmSource) {
      return utmSource.slice(0, 30).toLowerCase();
    }

    // Analiză referrer
    const ref = document.referrer ? document.referrer.toLowerCase() : '';
    if (ref.includes('olx.ro')) return 'olx';
    if (ref.includes('autovit.ro')) return 'autovit';
    if (ref.includes('facebook.com') || ref.includes('fb.me')) return 'facebook';
    if (ref.includes('instagram.com')) return 'instagram';
    if (ref.includes('tiktok.com')) return 'tiktok';
    if (ref.includes('google.')) return 'google_organic';
  } catch {
    // Ignoră erorile de parsare URL
  }

  return 'showroom';
}

/**
 * Trimite un semnal asincron non-blocant de vizualizare către serverul de telemetrie.
 * Utilizează sessionStorage pentru a preveni cererile redundante în timpul aceleiași navigări.
 */
export function sendVehicleViewBeacon(
  vehicleId: string, 
  dealerSlug: string = 'rxm', 
  source?: string
): void {
  if (!vehicleId || typeof window === 'undefined') return;

  const cleanId = String(vehicleId).trim();
  const sessionKey = `parcos_viewed_${cleanId}`;

  // 1. Deduplicare la nivel de sesiune tab client
  try {
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // sessionStorage blocat sau incognito strict
  }

  const cleanSlug = String(dealerSlug || 'rxm').trim().toLowerCase();
  const cleanSource = source || detectTrafficSource();

  const payload = JSON.stringify({
    vehicleId: cleanId,
    dealerSlug: cleanSlug,
    source: cleanSource
  });

  const endpointUrl = '/api/telemetry/vehicle-view';

  // 2. Prioritate: navigator.sendBeacon (garantează livrarea chiar la părăsirea paginii)
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const queued = navigator.sendBeacon(endpointUrl, blob);
      if (queued) return;
    } catch {
      // Fallback la fetch dacă sendBeacon este blocat de securitatea browserului
    }
  }

  // 3. Fallback: fetch asincron cu keepalive: true
  fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Ignoră erorile de rețea pasive — telemetria nu trebuie să emită erori în consolă vizitatorilor
  });
}

/**
 * Interoghează clasamentul celor mai vizionate vehicule ale unui dealer
 */
export async function fetchTopViewedVehicles(
  dealerSlug: string = 'rxm',
  timeframe: 'today' | '7d' | '30d' | 'month' | 'year' | 'all' = 'all',
  limit: number = 10
): Promise<TopViewedResponse> {
  const cleanSlug = encodeURIComponent(String(dealerSlug || 'rxm').trim().toLowerCase());
  const url = `/api/dealers/${cleanSlug}/analytics/top-viewed?timeframe=${timeframe}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        success: false,
        dealer: dealerSlug,
        timeframe,
        count: 0,
        topCars: [],
        error: `HTTP ${res.status}`
      };
    }
    const data: TopViewedResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      dealer: dealerSlug,
      timeframe,
      count: 0,
      topCars: [],
      error: err.message || 'Eroare de rețea'
    };
  }
}
