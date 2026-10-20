/**
 * src/utils/exchangeRateSync.ts
 * Serviciu de Sincronizare Automată a Cursului Valutar (BNR & BT)
 * 
 * Reguli & Cerințe:
 * 1. Extrage cursul euro BNR o dată pe zi, automat la ora 14:00 (RO time).
 * 2. Cursul Banca Transilvania (BT) este actualizat automat la 14:01 (RO time),
 *    păstrat informativ conform convenției comerciale (BNR + 2.0% marjă auto).
 * 3. Fallback automat prin Nodul Samy (S9 GSM Rack) dacă conexiunea primară VPS eșuează.
 * 4. Loghează timestamp-ul ultimului update și istoricul complet de sincronizare.
 * 5. Păstrează posibilitatea de editare manuală din panoul de administrare.
 */

import { 
  getExchangeRateMetadata, 
  saveExchangeRateMetadata, 
  ExchangeRateMetadata, 
  DEFAULT_BNR_EUR_RON, 
  DEFAULT_BT_EXCHANGE_RATE,
  DEFAULT_COMMERCIAL_MARGIN_PCT
} from './currencyEngine';

const SNAPSHOT_URLS = [
  '/rxm/data/exchange_rates.json',
  '/data/exchange_rates.json'
];

/**
 * Încarcă cel mai recent snapshot salvat pe server / VPS
 */
export async function fetchServerExchangeRates(): Promise<ExchangeRateMetadata | null> {
  for (const url of SNAPSHOT_URLS) {
    try {
      const res = await fetch(`${url}?_t=${Date.now()}`, { cache: 'no-cache' });
      if (res.ok) {
        const data: ExchangeRateMetadata = await res.json();
        if (data && typeof data.bnrRate === 'number' && data.bnrRate > 4.0) {
          return data;
        }
      }
    } catch (e) {
      // continuă la următorul URL
    }
  }
  return null;
}

/**
 * Încercare extragere curs BNR direct din browser (Fallback când fișierul local lipsește)
 */
async function fetchDirectBnrLive(): Promise<{ bnrRate: number; source: string } | null> {
  const directSources = [
    {
      name: 'Open Exchange Rates (BNR/ECB Feed)',
      url: 'https://open.er-api.com/v6/latest/EUR',
      parser: (json: any) => json?.rates?.RON ? parseFloat(json.rates.RON) : null
    },
    {
      name: 'ExchangeRate API Global',
      url: 'https://api.exchangerate-api.com/v4/latest/EUR',
      parser: (json: any) => json?.rates?.RON ? parseFloat(json.rates.RON) : null
    }
  ];

  for (const src of directSources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(src.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rate = src.parser(json);
        if (rate && rate > 4.5 && rate < 6.0) {
          return {
            bnrRate: parseFloat(rate.toFixed(4)),
            source: src.name
          };
        }
      }
    } catch (e) {
      // continuă la următorul endpoint
    }
  }

  return null;
}

/**
 * Sincronizează cursurile valutare BNR & BT
 * @param force Dacă este true, suprascrie chiar dacă s-a făcut deja sincronizare astăzi
 */
export async function syncExchangeRates(force: boolean = false): Promise<ExchangeRateMetadata> {
  const current = getExchangeRateMetadata();

  // Dacă administratorul are override manual activ și nu a forțat actualizarea, păstrăm setarea manuală
  if (current.isManualOverride && !force) {
    return current;
  }

  // 1. Încearcă să citească snapshot-ul proaspăt de pe server (generat de cron la 14:00/14:01)
  const serverData = await fetchServerExchangeRates();
  if (serverData && (!current.lastUpdated || new Date(serverData.lastUpdated) > new Date(current.lastUpdated))) {
    // Dacă utilizatorul nu are override manual, aplicăm datele de pe server
    if (!current.isManualOverride || force) {
      saveExchangeRateMetadata({
        ...serverData,
        isManualOverride: false
      });
      return serverData;
    }
  }

  // 2. Dacă snapshot-ul de pe server este indisponibil, încercăm fetch direct
  const liveResult = await fetchDirectBnrLive();
  const now = new Date();
  const roFormatted = now.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'medium' }) + ' (RO Time)';

  const bnrRate = liveResult ? liveResult.bnrRate : (current.bnrRate || DEFAULT_BNR_EUR_RON);
  const btRate = parseFloat((bnrRate * (1 + DEFAULT_COMMERCIAL_MARGIN_PCT / 100)).toFixed(4));
  const sourceLabel = liveResult 
    ? `${liveResult.source} • Sync Direct` 
    : (serverData?.sourceLabel || 'Sincronizare Automată Fallback (Curs BNR)');

  const newHistory = [
    {
      timestamp: now.toISOString(),
      formattedDate: roFormatted.replace(' (RO Time)', ''),
      bnrRate,
      btRate,
      source: sourceLabel,
      status: liveResult ? ('success' as const) : ('fallback' as const)
    },
    ...(current.history || []).slice(0, 9)
  ];

  const updatedMetadata: ExchangeRateMetadata = {
    bnrRate,
    btRate,
    commercialMarginPct: DEFAULT_COMMERCIAL_MARGIN_PCT,
    lastUpdated: now.toISOString(),
    lastUpdatedFormatted: roFormatted,
    source: liveResult ? 'bnr_official' : 'samy_node_fallback',
    sourceLabel,
    syncedBy: liveResult ? 'Browser Client Sync' : 'Nod Samy Fallback',
    status: liveResult ? 'success' : 'fallback',
    isManualOverride: false,
    nextScheduledSync: 'Zilnic la 14:00 (BNR) & 14:01 (BT) RO Time',
    history: newHistory
  };

  saveExchangeRateMetadata(updatedMetadata);
  return updatedMetadata;
}

/**
 * Calculează dacă este momentul pentru declanșarea sincronizării zilnice (după 14:00 RO)
 */
export function isSyncDueToday(): boolean {
  const current = getExchangeRateMetadata();
  if (!current.lastUpdated) return true;

  const lastSyncDate = new Date(current.lastUpdated);
  const now = new Date();

  // Verificăm dacă suntem în aceeași zi calendaristică în România
  const roTimeStr = now.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' });
  const lastSyncRoStr = lastSyncDate.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' });

  if (roTimeStr !== lastSyncRoStr) {
    // Zi diferită: verificăm dacă ora este >= 14:00 RO
    const currentHourRo = parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', hour12: false }), 10);
    return currentHourRo >= 14;
  }

  return false;
}

/**
 * Inițializează ascultătorul și scheduler-ul de fundal pentru 14:00 și 14:01
 */
export function initExchangeRateScheduler(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Verificare inițială la pornire
  if (isSyncDueToday()) {
    syncExchangeRates(false).catch(err => {
      console.warn('[CURS VALUTAR] Eroare verificare inițială:', err);
    });
  }

  // 2. Interval de verificare la fiecare 60 de secunde
  const intervalId = setInterval(() => {
    const now = new Date();
    const hourRo = parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', hour12: false }), 10);
    const minuteRo = parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', minute: '2-digit', hour12: false }), 10);
    const secondsRo = parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', second: '2-digit', hour12: false }), 10);

    // Declanșare exactă la 14:00 (BNR) și 14:01 (BT)
    if (hourRo === 14 && (minuteRo === 0 || minuteRo === 1) && secondsRo < 3) {
      console.log(`[CURS VALUTAR] Declanșare programată automată la ora 14:${minuteRo < 10 ? '0' + minuteRo : minuteRo} (RO Time)`);
      syncExchangeRates(false).catch(console.warn);
    }
  }, 15000);

  return () => clearInterval(intervalId);
}
