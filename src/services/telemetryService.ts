/**
 * RXM Automobile / ParcOS — Vehicle Views & Traffic Telemetry Service
 * Colectare pasivă non-blocantă a vizualizărilor reale și a traficului din showroom (Wave 1 & Wave 2)
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

export interface TrafficEventPayload {
  eventType: 'pageview' | 'click_whatsapp' | 'click_phone' | 'submit_lead' | 'calc_finance';
  pagePath?: string;
  dealerSlug?: string;
  source?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

export interface SiteTrafficSummary {
  uniqueVisitors: number;
  totalPageviews: number;
  totalEvents: number;
  conversionRate: number;
  topSource: string;
  sources: Array<{ source: string; visitors: number; pageviews: number; percentage: number }>;
  devices: { mobile: number; desktop: number; tablet: number };
  conversions: { whatsappClicks: number; phoneClicks: number; leadsSubmitted: number; financeCalc: number };
}

export interface TrafficSummaryResponse {
  success: boolean;
  dealer: string;
  timeframe: string;
  summary: SiteTrafficSummary;
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

/**
 * Trimite un semnal asincron non-blocant de telemetrie trafic (pageview, conversii).
 * Utilizează navigator.sendBeacon când este disponibil, cu fallback pe keepalive fetch.
 */
export function sendTrafficEvent(data: TrafficEventPayload): void {
  if (!data || !data.eventType || typeof window === 'undefined') return;

  try {
    const cleanEventType = data.eventType;
    const cleanSlug = String(
      data.dealerSlug || 
      (typeof window !== 'undefined' && ((window as any).__CURRENT_DEALER_SLUG__ || new URLSearchParams(window.location.search).get('dealer'))) || 
      'rxm'
    ).trim().toLowerCase();

    const cleanSource = data.source || detectTrafficSource();
    const cleanReferrer = data.referrer !== undefined ? data.referrer : (typeof document !== 'undefined' ? document.referrer : '');
    const cleanPath = data.pagePath || (typeof window !== 'undefined' ? (window.location.pathname + window.location.search + window.location.hash) : '/');

    const payloadObj = {
      dealerSlug: cleanSlug,
      eventType: cleanEventType,
      pagePath: cleanPath,
      source: cleanSource,
      referrer: cleanReferrer,
      metadata: data.metadata || {}
    };

    const payload = JSON.stringify(payloadObj);
    const endpointUrl = '/api/telemetry/traffic-event';

    // 1. Prioritate: navigator.sendBeacon (livrare garantată fără blocare thread UI)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const queued = navigator.sendBeacon(endpointUrl, blob);
        if (queued) return;
      } catch {
        // Fallback la fetch dacă sendBeacon este refuzat
      }
    }

    // 2. Fallback: fetch asincron cu keepalive: true
    fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ignoră erorile de rețea pasive
    });
  } catch {
    // Fail-safe complet non-blocant
  }
}

/**
 * Înregistrează o micro-conversie de cumpărător (WhatsApp, apel telefon, calcul rată leasing, trimitere lead)
 */
export function trackConversionEvent(
  eventType: TrafficEventPayload['eventType'],
  metadata?: Record<string, any>,
  dealerSlug?: string
): void {
  sendTrafficEvent({
    eventType,
    metadata,
    dealerSlug
  });
}

/**
 * Interoghează sumarul metricilor agregate de trafic și conversie ale unui dealer
 */
export async function fetchSiteTrafficAnalytics(
  dealerSlug: string = 'rxm',
  timeframe: string = '30d'
): Promise<TrafficSummaryResponse> {
  const cleanSlug = encodeURIComponent(String(dealerSlug || 'rxm').trim().toLowerCase());
  const cleanTf = encodeURIComponent(String(timeframe || '30d').trim().toLowerCase());
  const url = `/api/dealers/${cleanSlug}/analytics/traffic-summary?timeframe=${cleanTf}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        success: false,
        dealer: dealerSlug,
        timeframe,
        summary: {
          uniqueVisitors: 0,
          totalPageviews: 0,
          totalEvents: 0,
          conversionRate: 0,
          topSource: 'direct',
          sources: [],
          devices: { mobile: 0, desktop: 0, tablet: 0 },
          conversions: { whatsappClicks: 0, phoneClicks: 0, leadsSubmitted: 0, financeCalc: 0 }
        },
        error: `HTTP ${res.status}`
      };
    }
    const data: TrafficSummaryResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      dealer: dealerSlug,
      timeframe,
      summary: {
        uniqueVisitors: 0,
        totalPageviews: 0,
        totalEvents: 0,
        conversionRate: 0,
        topSource: 'direct',
        sources: [],
        devices: { mobile: 0, desktop: 0, tablet: 0 },
        conversions: { whatsappClicks: 0, phoneClicks: 0, leadsSubmitted: 0, financeCalc: 0 }
      },
      error: err.message || 'Eroare de rețea'
    };
  }
}
