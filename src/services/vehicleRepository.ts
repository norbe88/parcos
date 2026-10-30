/**
 * Unified Vehicle Repository pentru RXM Automobile
 * Conectat direct la PostgreSQL pe Netcup VPS (152.53.158.65), localStorage (`parcos_cars_inventory:${slug}`) și SEED_VEHICLES
 * utilizând modelul Stale-While-Revalidate (SWR).
 */

import { VehicleItem } from '../db/types';
import { SEED_VEHICLES } from '../db/vehicles';
import { deleteMediaForCar } from '../utils/mediaVaultDb';
import { normalizeCarImageUrl, isTikTokVideoUrl } from '../utils/helpers';
import { normalizeBrand } from '../utils/brandNormalizer';
import { getTabSessionId } from '../utils/broadcastSession';
import { getAdminAuthHeaders, isCurrentSessionAdmin } from '../utils/adminAuth';

/** Cheie istorică, doar pentru migrarea unică a stocului RXM. */
export const LEGACY_INVENTORY_STORAGE_KEY = 'rxm_cars_inventory';
const LEGACY_INVENTORY_VERSION_KEY = 'rxm_cars_version';
export const RXM_INVENTORY_VERSION = 'v10_db_images_json_parse_2026_10_18';

export function inventoryStorageKey(dealerSlug: string): string {
  const slug = String(dealerSlug || '').trim().toLowerCase();
  return `parcos_cars_inventory:${slug || 'unknown'}`;
}

function inventoryVersionKey(dealerSlug: string): string {
  return `${inventoryStorageKey(dealerSlug)}:version`;
}

/** Citește `rxm_cars_inventory` o singură dată și o copiază în `parcos_cars_inventory:rxm`. */
function migrateLegacyRxmInventoryOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    const nextKey = inventoryStorageKey('rxm');
    if (localStorage.getItem(nextKey) != null) return;
    const legacy = localStorage.getItem(LEGACY_INVENTORY_STORAGE_KEY);
    if (legacy == null) return;
    localStorage.setItem(nextKey, legacy);
    const nextVersionKey = inventoryVersionKey('rxm');
    if (localStorage.getItem(nextVersionKey) == null) {
      const legacyVersion = localStorage.getItem(LEGACY_INVENTORY_VERSION_KEY);
      if (legacyVersion != null) localStorage.setItem(nextVersionKey, legacyVersion);
    }
  } catch {
    // localStorage indisponibil
  }
}

export interface RepositorySaveResult {
  success: boolean;
  vehicle: VehicleItem;
  storageDestination: 'cloud' | 'local_fallback';
  error?: string;
}

let isSyncing = false;

/**
 * Convertește un rând PostgreSQL (snake_case) în obiect TypeScript VehicleItem (camelCase).
 * Despachetează raw_data JSONB în câmpurile corespunzătoare.
 */
export function rowToVehicleItem(row: Record<string, any>): VehicleItem {
  let rawData = row.raw_data;
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch { rawData = {}; }
  } else if (!rawData || typeof rawData !== 'object') {
    rawData = {};
  }

  let rawImages = row.images;
  if (typeof rawImages === 'string') {
    try { rawImages = JSON.parse(rawImages); } catch { rawImages = []; }
  }
  let images = (Array.isArray(rawImages) ? rawImages : []).map((img: string) => normalizeCarImageUrl(img));

  // Seed photos belong to RXM. Another dealer, or a row with no dealer_slug, stays empty.
  const dealerSlug = typeof row.dealer_slug === 'string' ? row.dealer_slug.trim().toLowerCase() : '';
  if (dealerSlug === 'rxm' && images.length === 0 && row.id) {
    const seedMatch = SEED_VEHICLES.find((s) => s.id === row.id);
    if (seedMatch && Array.isArray(seedMatch.images) && seedMatch.images.length > 0) {
      images = seedMatch.images.map((img: string) => normalizeCarImageUrl(img));
    }
  }

  let features = row.features;
  if (typeof features === 'string') {
    try { features = JSON.parse(features); } catch { features = { safety: [], comfort: [], multimedia: [] }; }
  }
  if (!features || typeof features !== 'object') {
    features = { safety: [], comfort: [], multimedia: [] };
  }

  return {
    id: row.id,
    stockNumber: row.stock_number || '',
    brand: normalizeBrand(row.brand || ''),
    model: row.model || '',
    versionTrim: row.version_trim || '',
    year: typeof row.year === 'number' ? row.year : Number(row.year) || new Date().getFullYear(),
    mileageKm: typeof row.mileage_km === 'number' ? row.mileage_km : Number(row.mileage_km) || 0,
    priceEur: typeof row.price_eur === 'number' ? row.price_eur : Number(row.price_eur) || 0,
    vatDeductible: !!row.vat_deductible,
    fuelType: row.fuel_type || 'Diesel',
    transmission: row.transmission || 'Automată',
    powerHp: typeof row.power_hp === 'number' ? row.power_hp : Number(row.power_hp) || 0,
    engineCc: typeof row.engine_cc === 'number' ? row.engine_cc : Number(row.engine_cc) || 0,
    bodyType: row.body_type || 'SUV',
    drivetrain: row.drivetrain || 'Față',
    color: row.color || '',
    vin: row.vin || '',
    isVinPublic: row.is_vin_public ?? false,
    docOriginCountry: row.doc_origin_country,
    warrantyMonths: (row.warranty_months as 12 | 24 | 36) || 12,
    status: (row.status as VehicleItem['status']) || 'in_stock',
    stockEntryDate: row.stock_entry_date,
    images,
    videoUrl: (row.video_url && !row.video_url.includes('ysz5S6PUM-U')) ? row.video_url : undefined,
    tiktokUrl: (row.tiktok_url && isTikTokVideoUrl(row.tiktok_url)) ? row.tiktok_url : undefined,
    tiktokViews: (row.tiktok_url && isTikTokVideoUrl(row.tiktok_url)) ? row.tiktok_views : undefined,
    isDealOfWeek: !!row.is_deal_of_week,
    isPinnedToTop: !!row.is_pinned_to_top,
    oldPriceEur: row.old_price_eur ? Number(row.old_price_eur) : undefined,
    dealBadgeText: row.deal_badge_text,
    features,
    equipmentSheetText: row.equipment_sheet_text,
    description: row.description || '',
    viewsCount: typeof row.views_count === 'number' ? row.views_count : (Number(row.views_count) || rawData.viewsCount || 0),

    // Câmpuri extrase din raw_data JSONB:
    auditLog: rawData.auditLog,
    expenses: rawData.expenses,
    marketEvaluation: rawData.marketEvaluation,
    autolicitSync: rawData.autolicitSync,
    internalNotes: rawData.internalNotes,
    purchasePriceEur: rawData.purchasePriceEur,
    soldPriceEur: rawData.soldPriceEur,
    soldAt: rawData.soldAt,
    olxUrl: rawData.olxUrl,
    olxId: rawData.olxId,
    olxStatus: rawData.olxStatus,
    olxDiscrepancy: rawData.olxDiscrepancy,
    lastOlxSyncAt: rawData.lastOlxSyncAt,
    hasRedPlates: rawData.hasRedPlates,
    redPlatesExpiresAt: rawData.redPlatesExpiresAt,
    itpExpiresAt: rawData.itpExpiresAt,
    rarAppointmentDate: rawData.rarAppointmentDate,
    licensePlate: rawData.licensePlate,
    civSeries: rawData.civSeries,
    isHeroPinned: rawData.isHeroPinned,
    heroOrder: rawData.heroOrder,
    originalImages: Array.isArray(rawData.originalImages) ? rawData.originalImages : undefined,
  };
}

/**
 * Convertește un obiect TypeScript VehicleItem (camelCase) în rând PostgreSQL (snake_case).
 * Împachetează datele complexe și netabelare în raw_data JSONB.
 */
export function vehicleItemToRow(v: VehicleItem, dealerSlug: string = 'rxm'): Record<string, any> {
  return {
    id: v.id,
    dealer_slug: dealerSlug,
    stock_number: v.stockNumber || null,
    brand: v.brand,
    model: v.model,
    version_trim: v.versionTrim || null,
    year: v.year,
    mileage_km: v.mileageKm,
    price_eur: v.priceEur,
    vat_deductible: v.vatDeductible ?? false,
    fuel_type: v.fuelType,
    transmission: v.transmission,
    power_hp: v.powerHp || null,
    engine_cc: v.engineCc || null,
    body_type: v.bodyType || null,
    drivetrain: v.drivetrain || null,
    color: v.color || null,
    vin: v.vin || null,
    is_vin_public: v.isVinPublic ?? false,
    doc_origin_country: v.docOriginCountry || null,
    warranty_months: v.warrantyMonths || 12,
    status: v.status || 'in_stock',
    stock_entry_date: v.stockEntryDate || null,
    images: v.images || [],
    video_url: (v.videoUrl && !v.videoUrl.includes('ysz5S6PUM-U')) ? v.videoUrl : null,
    tiktok_url: (v.tiktokUrl && isTikTokVideoUrl(v.tiktokUrl)) ? v.tiktokUrl : null,
    tiktok_views: (v.tiktokUrl && isTikTokVideoUrl(v.tiktokUrl)) ? (v.tiktokViews || null) : null,
    views_count: v.viewsCount || 0,
    is_deal_of_week: v.isDealOfWeek ?? false,
    is_pinned_to_top: v.isPinnedToTop ?? false,
    old_price_eur: v.oldPriceEur || null,
    deal_badge_text: v.dealBadgeText || null,
    features: v.features || { safety: [], comfort: [], multimedia: [] },
    equipment_sheet_text: v.equipmentSheetText || null,
    description: v.description || '',
    raw_data: {
      auditLog: v.auditLog || [],
      expenses: v.expenses || [],
      marketEvaluation: v.marketEvaluation,
      autolicitSync: v.autolicitSync,
      internalNotes: v.internalNotes,
      purchasePriceEur: v.purchasePriceEur,
      soldPriceEur: v.soldPriceEur,
      soldAt: v.soldAt,
      olxUrl: v.olxUrl,
      olxId: v.olxId,
      olxStatus: v.olxStatus,
      olxDiscrepancy: v.olxDiscrepancy,
      lastOlxSyncAt: v.lastOlxSyncAt,
      hasRedPlates: v.hasRedPlates,
      redPlatesExpiresAt: v.redPlatesExpiresAt,
      itpExpiresAt: v.itpExpiresAt,
      rarAppointmentDate: v.rarAppointmentDate,
      licensePlate: v.licensePlate,
      civSeries: v.civSeries,
      originalImages: v.originalImages || undefined,
      isHeroPinned: v.isHeroPinned,
      heroOrder: v.heroOrder,
    },
  };
}

/**
 * Garantează că cel puțin o mașină are Oferta Săptămânii activă dacă seed-ul specifică asta.
 */
export function ensureDealOfWeekActive(carList: VehicleItem[]): VehicleItem[] {
  const hasActiveDeal = carList.some(
    (c) => c.isDealOfWeek || c.isPinnedToTop || !!(c.oldPriceEur && c.oldPriceEur > c.priceEur)
  );
  if (!hasActiveDeal) {
    const seedDeal = SEED_VEHICLES.find((c) => c.isDealOfWeek);
    if (seedDeal) {
      return carList.map((c) =>
        c.id === seedDeal.id
          ? {
              ...c,
              isDealOfWeek: true,
              oldPriceEur: seedDeal.oldPriceEur,
              dealBadgeText: seedDeal.dealBadgeText,
            }
          : c
      );
    }
  }
  return carList;
}

/**
 * Citește vehiculele din depozitul local (localStorage / SEED) cu suport pentru migrare de versiune.
 */
function readLocalCache(dealerSlug: string = 'rxm'): VehicleItem[] {
  const slug = String(dealerSlug || '').trim().toLowerCase();
  if (!slug) return [];
  const allowSeed = slug === 'rxm';
  if (typeof window === 'undefined') {
    return allowSeed ? ensureDealOfWeekActive(SEED_VEHICLES) : [];
  }
  if (allowSeed) migrateLegacyRxmInventoryOnce();
  try {
    const storageKey = inventoryStorageKey(slug);
    const versionKey = inventoryVersionKey(slug);
    const savedVersion = localStorage.getItem(versionKey);
    const saved = localStorage.getItem(storageKey);

    // 1. Migrarea din seed aparține doar RXM. Alt parc rămâne pe cache-ul propriu.
    if (allowSeed && saved && savedVersion !== RXM_INVENTORY_VERSION) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seedMap = new Map(SEED_VEHICLES.map((c) => [c.id, c]));
        const updated = parsed.map((c) => {
          const freshSeed = seedMap.get(c.id);
          if (freshSeed) {
            return {
              ...c,
              images: freshSeed.images,
              tiktokUrl: freshSeed.tiktokUrl,
              tiktokViews: freshSeed.tiktokViews,
              status: freshSeed.status === 'sold' ? 'sold' : c.status || freshSeed.status,
              soldAt: freshSeed.soldAt || c.soldAt,
              soldPriceEur: freshSeed.soldPriceEur !== undefined ? freshSeed.soldPriceEur : c.soldPriceEur,
              marketEvaluation: freshSeed.marketEvaluation || c.marketEvaluation,
              isDealOfWeek: c.isDealOfWeek !== undefined ? c.isDealOfWeek : freshSeed.isDealOfWeek,
              isPinnedToTop: c.isPinnedToTop !== undefined ? c.isPinnedToTop : freshSeed.isPinnedToTop,
              oldPriceEur: c.oldPriceEur !== undefined ? c.oldPriceEur : freshSeed.oldPriceEur,
              dealBadgeText: c.dealBadgeText !== undefined ? c.dealBadgeText : freshSeed.dealBadgeText,
            };
          }
          return {
            ...c,
            images: (c.images || []).map((img: string) => normalizeCarImageUrl(img)),
          };
        });

        const finalized = ensureDealOfWeekActive(updated);
        localStorage.setItem(storageKey, JSON.stringify(finalized));
        localStorage.setItem(versionKey, RXM_INVENTORY_VERSION);
        return finalized;
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        const sanitized = parsed
          .filter((c: any) => {
            if (!c || !c.id || seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          })
          .map((c) => {
            let carImages = Array.isArray(c.images) ? c.images : [];
            if (allowSeed && carImages.length === 0) {
              const seedMatch = SEED_VEHICLES.find((s) => s.id === c.id);
              if (seedMatch && Array.isArray(seedMatch.images) && seedMatch.images.length > 0) {
                carImages = seedMatch.images;
              }
            }
            return {
              ...c,
              brand: normalizeBrand(c.brand),
              images: carImages.map((img: string) => normalizeCarImageUrl(img)),
            };
          });
        if (!allowSeed) return sanitized;
        if (sanitized.length > 0 && savedVersion === RXM_INVENTORY_VERSION) {
          return ensureDealOfWeekActive(sanitized);
        }
      }
    }
  } catch (err) {
    console.warn('[vehicleRepository] Eroare la citirea din localStorage:', err);
  }
  return allowSeed ? ensureDealOfWeekActive(SEED_VEHICLES) : [];
}

/**
 * Igienizează un vehicul pentru expunerea publică: elimină strict prețul de achiziție,
 * cheltuielile, jurnalul de audit, notele interne, prețul negociat și maschează seria VIN.
 */
export function sanitizePublicVehicleItem(v: VehicleItem): VehicleItem {
  const sanitized = { ...v };
  delete sanitized.purchasePriceEur;
  delete sanitized.expenses;
  delete sanitized.auditLog;
  delete sanitized.internalNotes;
  delete sanitized.soldPriceEur;
  delete sanitized.autolicitSync;
  if (!sanitized.isVinPublic && sanitized.vin && sanitized.vin.length >= 8) {
    sanitized.vin = sanitized.vin.slice(0, 3) + '***' + sanitized.vin.slice(-4);
  }
  return sanitized;
}

/**
 * Scrie vehiculele în localStorage și notifică mediul (BroadcastChannel + CustomEvent).
 * Pentru vizitatorii publici, filtrează orice date financiare confidențiale înainte de scriere.
 */
function writeLocalCache(vehicles: VehicleItem[], dealerSlug: string = 'rxm'): void {
  if (typeof window === 'undefined') return;
  const slug = String(dealerSlug || '').trim().toLowerCase();
  if (!slug) return;
  try {
    const isAdmin = isCurrentSessionAdmin();
    // 🛡️ Deduplicare strictă la scriere
    const seen = new Set<string>();
    const uniqueVehicles = vehicles.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    const toPersist = isAdmin ? uniqueVehicles : uniqueVehicles.map(sanitizePublicVehicleItem);
    const storageKey = inventoryStorageKey(slug);
    localStorage.setItem(storageKey, JSON.stringify(toPersist));
    localStorage.setItem(inventoryVersionKey(slug), RXM_INVENTORY_VERSION);

    // Notificare Cross-Tab via BroadcastChannel cu senderId pentru a preveni auto-ecoul
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('rxm_inventory_channel');
        channel.postMessage({ 
          type: 'INVENTORY_UPDATED', 
          cars: toPersist,
          dealerSlug: slug,
          senderId: getTabSessionId() 
        });
        channel.close();
      } catch {}
    }

    // Eveniment custom pentru componentele locale
    window.dispatchEvent(
      new CustomEvent('rxm:vehicles-synced', {
        detail: { vehicles: toPersist },
      })
    );
  } catch (err) {
    console.warn('[vehicleRepository] Eroare la salvarea în localStorage:', err);
  }
}

/**
 * Sincronizează parcul auto din micro-API-ul self-hosted de pe VPS.
 * Dacă sesiunea curentă este administrator, apelează endpoint-ul securizat /api/admin/vehicles,
 * altfel apelează endpoint-ul public sanitizat /api/vehicles.
 */
async function syncFromSelfHostedApi(dealerSlug: string = 'rxm'): Promise<VehicleItem[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const isAdmin = isCurrentSessionAdmin();
    const endpoint = isAdmin ? '/api/admin/vehicles' : '/api/vehicles';
    const authHeaders = isAdmin ? getAdminAuthHeaders() : {};

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 
        Accept: 'application/json',
        ...authHeaders
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success && Array.isArray(data.vehicles)) {
      const serverVehicles = data.vehicles.map(rowToVehicleItem);
      const serverIds = new Set(serverVehicles.map((c: VehicleItem) => c.id));
      const currentLocal = readLocalCache(dealerSlug);
      const localOnly = currentLocal.filter((c: VehicleItem) => !serverIds.has(c.id));
      const merged = [...serverVehicles, ...localOnly];
      writeLocalCache(merged, dealerSlug);
      return merged;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sincronizează datele din Serverul Netcup VPS în fundal (SWR).
 */
async function syncFromCloud(dealerSlug: string = 'rxm'): Promise<VehicleItem[]> {
  if (isSyncing) {
    return readLocalCache(dealerSlug);
  }

  isSyncing = true;
  try {
    // Sincronizare directă din micro-API-ul PostgreSQL de pe Netcup VPS (152.53.158.65)
    const selfHostedResult = await syncFromSelfHostedApi(dealerSlug);
    if (selfHostedResult && selfHostedResult.length > 0) {
      return selfHostedResult;
    }

    return readLocalCache(dealerSlug);
  } catch (err) {
    console.warn('[vehicleRepository] Excepție la sincronizarea stocului:', err);
    return readLocalCache(dealerSlug);
  } finally {
    isSyncing = false;
  }
}

export const vehicleRepository = {
  /**
   * Returnează instant inventarul din cache-ul local (0ms).
   * Declanșează discret sincronizarea SWR în fundal cu serverul VPS Netcup.
   */
  getVehicles(dealerSlug: string = 'rxm'): VehicleItem[] {
    const cached = readLocalCache(dealerSlug);

    if (typeof window !== 'undefined') {
      // Fire-and-forget background sync
      setTimeout(() => {
        syncFromCloud(dealerSlug).catch((err) => {
          console.warn('[vehicleRepository] SWR background sync error:', err);
        });
      }, 50);
    }

    return cached;
  },

  /**
   * Forțează o sincronizare activă cu serverul și returnează datele actualizate.
   */
  async getVehiclesAsync(dealerSlug: string = 'rxm'): Promise<VehicleItem[]> {
    return await syncFromCloud(dealerSlug);
  },

  /**
   * Caută un vehicul după ID.
   */
  async getVehicleById(id: string, dealerSlug: string = 'rxm'): Promise<VehicleItem | null> {
    const local = readLocalCache(dealerSlug);
    const foundLocal = local.find((v) => v.id === id);
    if (foundLocal) return foundLocal;

    try {
      const res = await fetch(`/rxm/api/vehicles/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.vehicle) {
          return rowToVehicleItem(json.vehicle);
        }
      }
    } catch {
      // API indisponibil
    }
    return null;
  },

  /**
   * Salvează vehiculul în localStorage și sincronizează direct cu micro-API-ul Netcup VPS.
   * Dacă serverul este temporar offline, salvează local cu fallback transparent (SWR).
   */
  async saveVehicle(vehicle: VehicleItem, dealerSlug: string = 'rxm'): Promise<RepositorySaveResult> {
    // 1. Salvare în localStorage
    const local = readLocalCache(dealerSlug);
    const existingIndex = local.findIndex((v) => v.id === vehicle.id);
    let updatedLocal: VehicleItem[];
    if (existingIndex >= 0) {
      updatedLocal = [...local];
      updatedLocal[existingIndex] = vehicle;
    } else {
      updatedLocal = [vehicle, ...local];
    }
    writeLocalCache(updatedLocal, dealerSlug);

    // 2. Salvare pe Serverul VPS Netcup (Self-Hosted Micro-API)
    try {
      const authHeaders = getAdminAuthHeaders();
      const res = await fetch('/rxm/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(vehicle),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            success: true,
            vehicle: data.vehicle ? rowToVehicleItem(data.vehicle) : vehicle,
            storageDestination: 'cloud',
          };
        }
      }
    } catch {
      // API Netcup VPS indisponibil temporar, fallback pe stocarea locală
    }

    // 3. Fallback transparent pe local
    return {
      success: true,
      vehicle,
      storageDestination: 'local_fallback',
    };
  },

  /**
   * Actualizează statusul unui vehicul (ex: din in_stock în reserved sau sold).
   */
  async updateVehicleStatus(
    id: string,
    newStatus: VehicleItem['status'],
    metadata?: Partial<Pick<VehicleItem, 'soldPriceEur' | 'soldAt'>>,
    dealerSlug: string = 'rxm'
  ): Promise<boolean> {
    const local = readLocalCache(dealerSlug);
    const target = local.find((v) => v.id === id);
    if (target) {
      const updated: VehicleItem = {
        ...target,
        status: newStatus,
        ...(metadata?.soldPriceEur !== undefined && { soldPriceEur: metadata.soldPriceEur }),
        ...(metadata?.soldAt !== undefined && { soldAt: metadata.soldAt }),
      };
      await this.saveVehicle(updated, dealerSlug);
      return true;
    }
    return false;
  },

  /**
   * Actualizează direct linkul OLX pe server și în cache-ul local
   */
  async updateOlxLink(
    id: string,
    olxUrl: string,
    olxId?: string,
    olxStatus: 'active' | 'expired' | 'unlinked' = 'active',
    dealerSlug: string = 'rxm'
  ): Promise<boolean> {
    const trimmed = olxUrl.trim();
    const local = readLocalCache(dealerSlug);
    const target = local.find((v) => v.id === id);
    if (target) {
      const updated: VehicleItem = {
        ...target,
        olxUrl: trimmed,
        olxId: olxId || target.olxId,
        olxStatus: trimmed ? olxStatus : 'unlinked',
        lastOlxSyncAt: new Date().toISOString()
      };
      await this.saveVehicle(updated, dealerSlug);
      return true;
    }
    return false;
  },

  /**
   * Șterge vehiculul din Cloud, localStorage și IndexedDB.
   */
  async deleteVehicle(id: string, dealerSlug: string = 'rxm'): Promise<boolean> {
    // 1. Ștergere locală
    const local = readLocalCache(dealerSlug);
    const filtered = local.filter((v) => v.id !== id);
    writeLocalCache(filtered, dealerSlug);

    // 2. Curățare IndexedDB
    try {
      await deleteMediaForCar(id);
    } catch (e) {
      console.warn('[vehicleRepository] Eroare curățare media IndexedDB:', e);
    }

    // 2.5 Ștergere Micro-API Netcup VPS (PostgreSQL & media disk)
    try {
      const authHeaders = getAdminAuthHeaders();
      await fetch(`/rxm/api/vehicles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
      });
    } catch (e) {
      console.warn('[vehicleRepository] Eroare ștergere API Netcup VPS:', e);
    }

    return true;
  },

  /**
   * Declanșează manual sincronizarea Cloud -> Local.
   */
  async triggerSync(dealerSlug: string = 'rxm'): Promise<void> {
    await syncFromCloud(dealerSlug);
  },
};
