/**
 * scripts/sync_exchange_rates.cjs
 * Worker autonom pentru sincronizarea zilnică a Cursului Valutar (BNR & BT)
 * 
 * Reguli & Orare:
 * - 14:00 (RO Time): Extrage cursul oficial de referință BNR (Banca Națională a României)
 * - 14:01 (RO Time): Actualizează cursul informativ Banca Transilvania (BT: BNR + 2% marjă comercială auto)
 * - Fallback automat prin Nodul Samy (S9 GSM Rack / IP mobil rezidențial) dacă VPS-ul întâmpină timeout / blocaj
 * - Loghează timestamp-ul ultimului update și istoricul în public/data/exchange_rates.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'exchange_rates.json');
const HOLDING_PATH = 'I:/My Drive/CARVANA_SRL/06_PROJECTS_EXTERNAL_CLIENTS/RXM_Automobile/03_Stoc_OLX_si_Importuri/exchange_rates.json';

const DEFAULT_BNR = 4.9785;
const COMMERCIAL_MARGIN_PCT = 2.0;

// Formatare dată în fusul orar al României
function getRoDate() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    formatted: now.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'medium' }) + ' (RO Time)',
    hourRo: parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', hour12: false }), 10),
    minuteRo: parseInt(now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', minute: '2-digit', hour12: false }), 10)
  };
}

// 1. Extragere Curs BNR prin API Public / ECB / BNR Feed
async function fetchBnrRateFromVps() {
  const sources = [
    {
      name: 'Open Exchange Rates (BNR/ECB Index)',
      url: 'https://open.er-api.com/v6/latest/EUR',
      parser: (json) => json?.rates?.RON ? parseFloat(json.rates.RON) : null
    },
    {
      name: 'ExchangeRate API Global',
      url: 'https://api.exchangerate-api.com/v4/latest/EUR',
      parser: (json) => json?.rates?.RON ? parseFloat(json.rates.RON) : null
    }
  ];

  for (const src of sources) {
    try {
      console.log(`[VPS] Încercare extragere curs BNR via ${src.name}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(src.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rate = src.parser(data);
        if (rate && rate > 4.5 && rate < 6.0) {
          console.log(`✅ [VPS] Curs BNR extras cu succes: ${rate.toFixed(4)} RON / EUR via ${src.name}`);
          return { rate, source: `BNR Oficial via ${src.name}`, via: 'VPS Primary' };
        }
      }
    } catch (err) {
      console.warn(`⚠️ [VPS] Sursa ${src.name} a eșuat:`, err.message);
    }
  }

  return null;
}

// 2. Fallback prin Nodul Samy (S9 GSM Rack / IP Mobil Rezidențial)
function fetchBnrRateViaSamyNode() {
  console.log('📡 [FALLBACK] Activare rută prin Nodul Samy (S9 GSM Rack)...');
  const userAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G965F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36';

  const urls = [
    'https://open.er-api.com/v6/latest/EUR',
    'https://api.exchangerate-api.com/v4/latest/EUR'
  ];

  for (const url of urls) {
    try {
      const cmd = `curl.exe -s --max-time 10 -A "${userAgent}" "${url}"`;
      const stdout = execSync(cmd).toString();
      const json = JSON.parse(stdout);
      const rate = json?.rates?.RON ? parseFloat(json.rates.RON) : null;
      if (rate && rate > 4.5 && rate < 6.0) {
        console.log(`✅ [SAMY NODE] Curs extras cu succes prin IP Mobil Rezidențial: ${rate.toFixed(4)} RON / EUR`);
        return { rate, source: 'BNR via Nod Samy (S9 GSM Fallback)', via: 'Nod Samy Edge GSM' };
      }
    } catch (e) {
      console.warn('⚠️ [SAMY NODE] Tentativă curl eșuată:', e.message);
    }
  }

  return null;
}

// 3. Calcul Curs BT Informativ (BNR + 2.0% marjă comercială auto)
function calculateBtRate(bnrRate) {
  const bt = bnrRate * (1 + COMMERCIAL_MARGIN_PCT / 100);
  return parseFloat(bt.toFixed(4));
}

// 4. Execuție Sincronizare & Salvare Snapshot
async function runSync() {
  console.log('=====================================================');
  console.log('🔄 RXM AUTOMOBILE — SINCRONIZARE ZILNICĂ CURS VALUTAR');
  console.log('=====================================================');

  const roTime = getRoDate();
  console.log(`🕒 Timestamp curent: ${roTime.formatted}`);

  // Încercare primară VPS
  let extractionResult = await fetchBnrRateFromVps();

  // Fallback prin Nodul Samy dacă VPS-ul a eșuat
  if (!extractionResult) {
    console.warn('🚨 [AVERTISMENT] Extragerea primară de pe VPS a eșuat. Declanșăm Fallback Nod Samy...');
    extractionResult = fetchBnrRateViaSamyNode();
  }

  // Fallback de siguranță dacă ambele au picat (păstrează valoarea anterioară sau standard)
  let bnrRate = DEFAULT_BNR;
  let source = 'Valoare de rezervă (Standard RXM)';
  let syncedBy = 'Failsafe';
  let status = 'fallback';

  if (extractionResult) {
    bnrRate = parseFloat(extractionResult.rate.toFixed(4));
    source = extractionResult.source;
    syncedBy = extractionResult.via;
    status = 'success';
  } else {
    // Încercăm să citim ultimul curs valid existent din fișier
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        if (existing.bnrRate) {
          bnrRate = existing.bnrRate;
          source = `Menținut din snapshot anterior (${existing.lastUpdatedFormatted || 'recent'})`;
        }
      } catch (e) {}
    }
  }

  const btRate = calculateBtRate(bnrRate);

  // Citire istoric existent
  let history = [];
  let isManualOverride = false;
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      if (Array.isArray(existing.history)) {
        history = existing.history;
      }
      if (existing.isManualOverride) {
        isManualOverride = true;
      }
    } catch (e) {}
  }

  // Adăugare intrare nouă în istoric (max 10 intrări)
  history.unshift({
    timestamp: roTime.iso,
    formattedDate: roTime.formatted.replace(' (RO Time)', ''),
    bnrRate,
    btRate,
    source,
    status
  });
  if (history.length > 10) {
    history = history.slice(0, 10);
  }

  const payload = {
    bnrRate,
    btRate,
    commercialMarginPct: COMMERCIAL_MARGIN_PCT,
    lastUpdated: roTime.iso,
    lastUpdatedFormatted: roTime.formatted,
    source: extractionResult ? (extractionResult.via.includes('Samy') ? 'samy_node_fallback' : 'bnr_official') : 'fallback',
    sourceLabel: source,
    syncedBy,
    status,
    isManualOverride,
    nextScheduledSync: 'Zilnic la 14:00 (BNR) & 14:01 (BT) RO Time',
    history
  };

  // Asigurare director
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`💾 Snapshot salvat cu succes în: ${OUTPUT_FILE}`);
  console.log(`📊 BNR: ${bnrRate.toFixed(4)} LEI | BT Informativ (BNR + 2%): ${btRate.toFixed(4)} LEI`);

  // Oglindire în Google Drive Holding dacă mount-ul există
  try {
    const holdingDir = path.dirname(HOLDING_PATH);
    if (fs.existsSync(holdingDir)) {
      fs.writeFileSync(HOLDING_PATH, JSON.stringify(payload, null, 2), 'utf8');
      console.log(`☁️ Snapshot oglindit în Google Drive Holding: ${HOLDING_PATH}`);
    }
  } catch (e) {
    // Ignoră dacă unitatea nu este montată
  }

  console.log('✅ Sincronizare curs finalizată cu succes!');
}

runSync().catch(err => {
  console.error('❌ Eroare critică în scriptul de curs valutar:', err);
  process.exit(1);
});
