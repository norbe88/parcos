/**
 * src/services/autolicitSyncService.ts
 * ════════════════════════════════════════════════════════════════════════════════
 * 🚗 CARVANA SRL / PARCOS — SERVICIU DE SINCRONIZARE B2B AUTOLICIT.RO
 * ════════════════════════════════════════════════════════════════════════════════
 * Modul client izolat pentru ingestia vehiculelor în AutoLicit Core (nod Desy).
 * Invariante Strict Verificate:
 *  - Strict 21% TVA (VAT_RATE = 0.21)
 *  - Terminologie: "Cont de Garanție" (Banca Transilvania)
 *  - Antete: X-Holding-Bridge-Key & X-Dealer-Slug
 *  - Anti-Ghosting: delistare prin VIN
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { VehicleItem } from '../db/types';

export const VITE_AUTOLICIT_SYNC_URL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTOLICIT_SYNC_URL) ||
  'https://autolicit.ro/api/v1/dealers/sync'
).replace(/\/$/, '');

export const VITE_AUTOLICIT_BRIDGE_KEY: string = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTOLICIT_BRIDGE_KEY) ||
  'dev-dealer-sync-key-local'
);

const KNOWN_DEALER_CUIS: Record<string, string> = {
  rxm: 'RO48482214',
  mpi: 'RO43460100',
  mpi_auto: 'RO43460100',
  'top-auto': 'RO41920199',
  top_auto: 'RO41920199',
  autonord_cluj: 'RO39182341',
};

export interface AutolicitSyncPayload {
  sourceSystem: 'ParcOS';
  dealerSlug: string;
  companyCui: string;
  syncMode: 'direct_sale' | 'auction';
  vehicle: {
    vin: string;
    brand: string;
    model: string;
    versionTrim: string;
    year: number;
    mileageKm: number;
    fuelType: string;
    transmission: string;
    powerHp: number;
    engineCc: number;
    bodyType: string;
    drivetrain: string;
    color: string;
    warrantyMonths: number;
    docOriginCountry: string;
  };
  pricing: {
    currency: 'EUR';
    priceEur: number;
    vatDeductible: boolean;
    vatRate: 0.21;
    auctionStartingBidEur: number | null;
  };
  media: {
    primaryImage: string;
    gallery: string[];
    videoUrl: string | null;
  };
  description: string;
  features: string[];
  syncedAt: string;
}

export interface AutolicitPushResponse {
  success: boolean;
  vehicleId?: string;
  valuation?: any;
  priceAnalysis?: {
    dealRating?: 'GREAT_PRICE' | 'FAIR_PRICE' | 'ABOVE_MARKET' | string;
    fairMarketPriceEur?: number;
    differenceEur?: number;
    percentageDiff?: number;
    [key: string]: any;
  };
  error?: string;
}

export interface AutolicitDelistResponse {
  success: boolean;
  error?: string;
}

/**
 * a) Construiește payload-ul structurat modular cerut de routerul de ingestie Desy
 */
export function buildAutolicitPayload(
  vehicle: VehicleItem,
  syncMode: 'direct_sale' | 'auction',
  startingBidEur?: number
): AutolicitSyncPayload {
  const dealerSlug = vehicle.dealerSlug || 'rxm';
  const companyCui = KNOWN_DEALER_CUIS[dealerSlug] || 'RO48482214';

  // Colectare listă plată de dotări din categoriile ParcOS
  const flatFeatures: string[] = [];
  if (vehicle.features) {
    if (Array.isArray(vehicle.features.safety)) flatFeatures.push(...vehicle.features.safety);
    if (Array.isArray(vehicle.features.comfort)) flatFeatures.push(...vehicle.features.comfort);
    if (Array.isArray(vehicle.features.multimedia)) flatFeatures.push(...vehicle.features.multimedia);
  }

  const gallery = Array.isArray(vehicle.images) ? vehicle.images : [];
  const primaryImage = gallery[0] || '';

  const auctionStartingBidEur = syncMode === 'auction'
    ? (startingBidEur || Math.round(vehicle.priceEur * 0.8))
    : null;

  return {
    sourceSystem: 'ParcOS',
    dealerSlug,
    companyCui,
    syncMode,
    vehicle: {
      vin: vehicle.vin || '',
      brand: vehicle.brand,
      model: vehicle.model,
      versionTrim: vehicle.versionTrim || '',
      year: vehicle.year,
      mileageKm: vehicle.mileageKm,
      fuelType: vehicle.fuelType || 'Diesel',
      transmission: vehicle.transmission || 'Automată',
      powerHp: vehicle.powerHp || 0,
      engineCc: vehicle.engineCc || 0,
      bodyType: vehicle.bodyType || 'SUV',
      drivetrain: vehicle.drivetrain || 'Față',
      color: vehicle.color || '',
      warrantyMonths: vehicle.warrantyMonths || 12,
      docOriginCountry: vehicle.docOriginCountry || 'RO',
    },
    pricing: {
      currency: 'EUR',
      priceEur: vehicle.priceEur,
      vatDeductible: Boolean(vehicle.vatDeductible),
      vatRate: 0.21, // Invariantă strictă 21%
      auctionStartingBidEur,
    },
    media: {
      primaryImage,
      gallery,
      videoUrl: vehicle.tiktokUrl || vehicle.videoUrl || null,
    },
    description: vehicle.description || '',
    features: flatFeatures,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * b) Trimite vehiculul către routerul de ingestie Desy: POST ${VITE_AUTOLICIT_SYNC_URL}/listing
 */
export async function pushListingToAutolicit(
  payload: AutolicitSyncPayload | any
): Promise<AutolicitPushResponse> {
  const targetUrl = `${VITE_AUTOLICIT_SYNC_URL}/listing`;
  const fallbackUrl = '/api/autolicit-sync/listing';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Holding-Bridge-Key': VITE_AUTOLICIT_BRIDGE_KEY,
    'X-Dealer-Slug': payload.dealerSlug || 'rxm',
  };

  // 1. Încercare directă către AutoLicit Core (Desy)
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (res.ok) {
      return {
        success: true,
        vehicleId: json?.vehicleId || payload.vehicle?.vin || payload.externalListingId,
        valuation: json?.valuation || json?.priceAnalysis,
        priceAnalysis: json?.priceAnalysis || json?.valuation,
      };
    }

    return {
      success: false,
      error: json?.error || `Serverul AutoLicit a returnat HTTP ${res.status}`,
      valuation: json?.valuation || json?.priceAnalysis,
      priceAnalysis: json?.priceAnalysis || json?.valuation,
    };
  } catch (directErr: any) {
    // 2. Fallback pe proxy-ul local în caz de blocaj CORS de browser
    try {
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      let fbJson: any = null;
      try {
        fbJson = await fallbackRes.json();
      } catch {
        fbJson = null;
      }

      if (fallbackRes.ok) {
        return {
          success: true,
          vehicleId: fbJson?.vehicleId || payload.vehicle?.vin || payload.externalListingId,
          valuation: fbJson?.valuation || fbJson?.priceAnalysis,
          priceAnalysis: fbJson?.priceAnalysis || fbJson?.valuation,
        };
      }

      return {
        success: false,
        error: fbJson?.error || `Proxy AutoLicit a returnat HTTP ${fallbackRes.status}`,
        valuation: fbJson?.valuation || fbJson?.priceAnalysis,
        priceAnalysis: fbJson?.priceAnalysis || fbJson?.valuation,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: `Eroare rețea la contactarea AutoLicit: ${directErr.message || fallbackErr.message}`,
      };
    }
  }
}

/**
 * c) Delistează vehiculul de pe AutoLicit Core: DELETE ${VITE_AUTOLICIT_SYNC_URL}/listing/${vin}
 */
export async function delistFromAutolicit(
  vin: string,
  dealerSlug: string = 'rxm'
): Promise<AutolicitDelistResponse> {
  const cleanVin = String(vin || '').trim();
  if (!cleanVin) {
    return { success: false, error: 'Serie VIN lipsă pentru delistare' };
  }

  const targetUrl = `${VITE_AUTOLICIT_SYNC_URL}/listing/${encodeURIComponent(cleanVin)}`;
  const fallbackUrl = `/api/autolicit-sync/listing/${encodeURIComponent(cleanVin)}`;

  const headers: Record<string, string> = {
    'X-Holding-Bridge-Key': VITE_AUTOLICIT_BRIDGE_KEY,
    'X-Dealer-Slug': dealerSlug || 'rxm',
  };

  // 1. Încercare directă
  try {
    const res = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (res.ok) {
      return { success: true };
    }

    return {
      success: false,
      error: json?.error || `Delistarea a returnat HTTP ${res.status}`,
    };
  } catch (directErr: any) {
    // 2. Fallback pe proxy local
    try {
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'DELETE',
        headers,
      });

      let fbJson: any = null;
      try {
        fbJson = await fallbackRes.json();
      } catch {
        fbJson = null;
      }

      if (fallbackRes.ok) {
        return { success: true };
      }

      return {
        success: false,
        error: fbJson?.error || `Delistare via proxy a returnat HTTP ${fallbackRes.status}`,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: `Eroare rețea la delistarea de pe AutoLicit: ${directErr.message || fallbackErr.message}`,
      };
    }
  }
}
