import { WindowStickerConfig, DealerProfile, VehicleItem } from '../db/types';

export const DEFAULT_WINDOW_STICKER_CONFIG: WindowStickerConfig = {
  // 1. Branding & Logo Dealer
  showLogo: true,
  logoPosition: 'header_left',
  logoUrl: '',

  // 2. Motorizare & Detalii Tehnice
  showEngineCc: true,
  showPowerHp: true,
  showFuelType: true,
  showTransmission: true,
  showDrivetrain: true,
  showMileage: true,
  showYear: true,
  showVin: false, // Implicit ascuns (conform preferinței RXM)

  // 3. Preț & Conformitate Legală ANPC (Curs BNR + 2%)
  showExchangeRateDisclaimer: true, // Obligatoriu afișat când prețul este în Euro
  exchangeRateDisclaimerText: 'Plata în LEI la curs BNR + 2% din ziua facturării',
  showVatDetails: true,
  showMonthlyRate: true,

  // 4. Dotări, QR & Garanție
  showTopFeatures: true,
  showQrCode: true,
  showWarrantyBadge: true,

  // 5. Badge Personalizat / Colț
  customBadgeText: '',
  customBadgePosition: 'top_right'
};

const STORAGE_KEY = 'rxm_window_sticker_config_v2';
const LEGACY_VIN_KEY = 'rxm_window_sticker_show_vin';

export function getWindowStickerConfig(dealer?: Partial<DealerProfile>): WindowStickerConfig {
  let config: WindowStickerConfig = {
    ...DEFAULT_WINDOW_STICKER_CONFIG,
    ...(dealer?.windowStickerConfig || {})
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        config = { ...config, ...parsed };
      } else {
        // Migrare fallback din cheia veche dacă există
        const legacyVin = localStorage.getItem(LEGACY_VIN_KEY);
        if (legacyVin !== null) {
          config.showVin = JSON.parse(legacyVin);
        }
      }
    } catch (e) {
      console.warn('Eroare la citirea configurării fișei de parbriz din localStorage:', e);
    }
  }

  return config;
}

export function saveWindowStickerConfig(config: WindowStickerConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Sincronizăm și cheia veche pentru compatibilitate inversă
    localStorage.setItem(LEGACY_VIN_KEY, JSON.stringify(config.showVin));
  } catch (e) {
    console.warn('Eroare la salvarea configurării fișei de parbriz în localStorage:', e);
  }
}

export function resetWindowStickerConfig(): WindowStickerConfig {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_WINDOW_STICKER_CONFIG };
}

/**
 * Formatează datele de motorizare (cilindree cm³, putere CP, combustibil)
 * conform preferințelor din fișa de parbriz.
 */
export function formatEngineDisplay(car: VehicleItem, config?: Partial<WindowStickerConfig>) {
  const showEngineCc = config?.showEngineCc ?? true;
  const showPower = config?.showPowerHp ?? true;
  const showFuel = config?.showFuelType ?? true;

  const isElectric = car.fuelType === 'Electric';
  const hasEngineCc = !isElectric && car.engineCc && car.engineCc > 0;

  // Partea principală (ex: "1.998 cm³ • 190 CP" sau "Electric • 204 CP")
  const mainParts: string[] = [];

  if (isElectric) {
    mainParts.push('Electric');
    if (showPower && car.powerHp) mainParts.push(`${car.powerHp} CP`);
  } else {
    if (showEngineCc && hasEngineCc) {
      mainParts.push(`${car.engineCc.toLocaleString('ro-RO')} cm³`);
    }
    if (showPower && car.powerHp) {
      mainParts.push(`${car.powerHp} CP`);
    }
  }

  const title = mainParts.length > 0 ? mainParts.join(' • ') : (car.powerHp ? `${car.powerHp} CP` : 'Motorizare');
  const subtitle = showFuel ? car.fuelType : '';
  const full = subtitle ? `${title} (${subtitle})` : title;

  return {
    title,
    subtitle,
    full,
    hasEngineCc: Boolean(hasEngineCc),
    isElectric
  };
}
