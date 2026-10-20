/**
 * Currency Engine pentru Showroom Auto (RXM Automobile)
 * Calculează conversia EUR -> RON pe baza cursului comercial agreat:
 * Curs Banca Transilvania (BT) sau formula contractuală: BNR + 2% marjă.
 */

// Curs BNR de referință
export const DEFAULT_BNR_EUR_RON = 4.9780;

// Marjă comercială auto (2.0%)
export const DEFAULT_COMMERCIAL_MARGIN_PCT = 2.0;

// Curs BT implicit calculat: 4.9780 * 1.020 = 5.0775 -> rotunjit la 5.0800
export const DEFAULT_BT_EXCHANGE_RATE = 5.0800;

export interface ExchangeRateHistoryItem {
  timestamp: string;
  formattedDate: string;
  bnrRate: number;
  btRate: number;
  source: string;
  status: 'success' | 'fallback' | 'manual';
}

export interface ExchangeRateMetadata {
  bnrRate: number;
  btRate: number;
  commercialMarginPct: number;
  lastUpdated: string;
  lastUpdatedFormatted: string;
  source: 'bnr_official' | 'bt_commercial' | 'samy_node_fallback' | 'manual_admin' | 'fallback';
  sourceLabel: string;
  syncedBy: string;
  status: 'success' | 'fallback' | 'manual';
  isManualOverride: boolean;
  nextScheduledSync?: string;
  history?: ExchangeRateHistoryItem[];
}

const STORAGE_KEY_EXCHANGE_RATE = 'rxm_dealer_exchange_rate_bt';
const STORAGE_KEY_BNR_RATE = 'rxm_dealer_exchange_rate_bnr';
const STORAGE_KEY_METADATA = 'rxm_dealer_exchange_rate_metadata';

export const DEFAULT_EXCHANGE_METADATA: ExchangeRateMetadata = {
  bnrRate: DEFAULT_BNR_EUR_RON,
  btRate: DEFAULT_BT_EXCHANGE_RATE,
  commercialMarginPct: DEFAULT_COMMERCIAL_MARGIN_PCT,
  lastUpdated: new Date().toISOString(),
  lastUpdatedFormatted: '13.10.2026, 14:01 (RO Time)',
  source: 'bnr_official',
  sourceLabel: 'BNR Oficial (14:00) & Curs BT Informativ (14:01)',
  syncedBy: 'VPS Cron / Nod Samy Fallback',
  status: 'success',
  isManualOverride: false,
  nextScheduledSync: 'Zilnic la 14:00 (BNR) & 14:01 (BT) RO Time',
  history: [
    {
      timestamp: new Date().toISOString(),
      formattedDate: '13.10.2026, 14:01',
      bnrRate: DEFAULT_BNR_EUR_RON,
      btRate: DEFAULT_BT_EXCHANGE_RATE,
      source: 'BNR Oficial (Auto-Sync VPS)',
      status: 'success'
    }
  ]
};

/**
 * Returnează metadatele complete despre cursul valutar (ultimul update, sursă, istoric)
 */
export function getExchangeRateMetadata(): ExchangeRateMetadata {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_METADATA);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.btRate) {
          return {
            ...DEFAULT_EXCHANGE_METADATA,
            ...parsed
          };
        }
      } catch (e) {}
    }
  }
  return DEFAULT_EXCHANGE_METADATA;
}

/**
 * Salvează metadatele de curs valutar și notifică componentele reactive
 */
export function saveExchangeRateMetadata(meta: ExchangeRateMetadata): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(meta));
    localStorage.setItem(STORAGE_KEY_EXCHANGE_RATE, meta.btRate.toFixed(4));
    localStorage.setItem(STORAGE_KEY_BNR_RATE, meta.bnrRate.toFixed(4));
    window.dispatchEvent(new CustomEvent('rxm_currency_updated', { detail: meta }));
  }
}

/**
 * Returnează cursul curent utilizat (stocat în cache sau valoarea BT implicită)
 */
export function getBtExchangeRate(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_EXCHANGE_RATE);
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val > 4.5 && val < 6.0) {
        return val;
      }
    }
  }
  return DEFAULT_BT_EXCHANGE_RATE;
}

/**
 * Returnează cursul de referință BNR stocat
 */
export function getBnrExchangeRate(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BNR_RATE);
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val > 4.5 && val < 6.0) {
        return val;
      }
    }
  }
  return DEFAULT_BNR_EUR_RON;
}

/**
 * Salvează un nou curs de schimb în setările locale (actualizare manuală sau automată)
 */
export function setBtExchangeRate(rate: number): void {
  if (typeof window !== 'undefined' && rate > 4.5 && rate < 6.0) {
    localStorage.setItem(STORAGE_KEY_EXCHANGE_RATE, rate.toFixed(4));
    const currentMeta = getExchangeRateMetadata();
    saveExchangeRateMetadata({
      ...currentMeta,
      btRate: parseFloat(rate.toFixed(4))
    });
  }
}

/**
 * Salvare manuală a cursului valutar de către administrator (override garantat)
 */
export function setManualExchangeRate(btRate: number, bnrRate: number): void {
  const current = getExchangeRateMetadata();
  const now = new Date();
  const roFormatted = now.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'medium' }) + ' (RO Time)';

  const newHistory = [
    {
      timestamp: now.toISOString(),
      formattedDate: roFormatted.replace(' (RO Time)', ''),
      bnrRate: parseFloat(bnrRate.toFixed(4)),
      btRate: parseFloat(btRate.toFixed(4)),
      source: 'Override Manual (Administrator Showroom)',
      status: 'manual' as const
    },
    ...(current.history || []).slice(0, 9)
  ];

  const updated: ExchangeRateMetadata = {
    ...current,
    bnrRate: parseFloat(bnrRate.toFixed(4)),
    btRate: parseFloat(btRate.toFixed(4)),
    lastUpdated: now.toISOString(),
    lastUpdatedFormatted: roFormatted,
    source: 'manual_admin',
    sourceLabel: 'Editare Manuală (Panou Admin)',
    syncedBy: 'Administrator RXM',
    status: 'manual',
    isManualOverride: true,
    history: newHistory
  };

  saveExchangeRateMetadata(updated);
}

/**
 * Resetează la modul de sincronizare automată BNR & BT
 */
export function resetToAutoSync(): void {
  const current = getExchangeRateMetadata();
  const updated: ExchangeRateMetadata = {
    ...current,
    isManualOverride: false,
    sourceLabel: 'Sincronizare Automată Activată (14:00 BNR / 14:01 BT)'
  };
  saveExchangeRateMetadata(updated);
}

/**
 * Convertește o sumă din EUR în RON la cursul BT (BNR + 2%)
 */
export function convertEurToRon(amountEur: number, customRate?: number): number {
  if (!amountEur || amountEur <= 0) return 0;
  const rate = customRate ?? getBtExchangeRate();
  return Math.round(amountEur * rate);
}

/**
 * Formatează o sumă în RON (ex: "1.759 RON", fără tildă)
 */
export function formatPriceRon(amountEur: number, customRate?: number): string {
  const ron = convertEurToRon(amountEur, customRate);
  return `${ron.toLocaleString('ro-RO')} RON`;
}

/**
 * Text explicativ conform reglementărilor comerciale
 */
export function getExchangeRateDisclaimer(): string {
  const rate = getBtExchangeRate();
  return `Calculat la curs BT (BNR + 2%): 1 EUR = ${rate.toFixed(4)} LEI`;
}

export type CreditorPartnerId = 'tbi' | 'bt' | 'unicredit' | 'creditfix';

export interface CreditorConfig {
  id: CreditorPartnerId;
  name: string;
  sublabel: string;
  interestRate: number;
  isPrimary?: boolean;
}

export const DEFAULT_CREDITOR_CONFIGS: Record<CreditorPartnerId, CreditorConfig> = {
  tbi: { 
    id: 'tbi',
    name: 'TBI Bank', 
    sublabel: 'Principal • 100% online', 
    interestRate: 7.9, 
    isPrimary: true 
  },
  bt: { 
    id: 'bt',
    name: 'Banca Transilvania', 
    sublabel: 'BT Direct', 
    interestRate: 8.5 
  },
  unicredit: { 
    id: 'unicredit',
    name: 'UniCredit', 
    sublabel: 'Consumer Financing', 
    interestRate: 8.9 
  },
  creditfix: { 
    id: 'creditfix',
    name: 'CreditFix', 
    sublabel: 'Aprobare rapidă', 
    interestRate: 9.9 
  },
};

const STORAGE_KEY_CREDITORS = 'rxm_dealer_creditors_config';

/**
 * Încarcă configurația creditorilor din localStorage (cu fallback la valorile implicite)
 */
export function getCreditorConfigs(): Record<CreditorPartnerId, CreditorConfig> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_CREDITORS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_CREDITOR_CONFIGS,
            ...parsed
          };
        }
      } catch (e) {
        console.warn('Nu s-au putut încărca setările creditorilor:', e);
      }
    }
  }
  return DEFAULT_CREDITOR_CONFIGS;
}

/**
 * Salvează dobânzile creditorilor configurate din portalul de gestiune
 */
export function saveCreditorConfigs(configs: Record<CreditorPartnerId, CreditorConfig>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CREDITORS, JSON.stringify(configs));
    window.dispatchEvent(new CustomEvent('rxm_creditors_updated', { detail: configs }));
  }
}

/**
 * Returnează cea mai mică rată de dobândă activă (pentru badge "de la X.X%")
 */
export function getLowestInterestRate(): number {
  const configs = getCreditorConfigs();
  const rates = Object.values(configs).map(c => c.interestRate);
  return Math.min(...rates);
}

