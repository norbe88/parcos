import { DealerProfile, TenantFeatures, TenantStatus, TenantTier } from '../db/types';

export const SUPERADMIN_STORAGE_KEY = 'parcos_superadmin_key';
export const DEFAULT_DEV_SUPERADMIN_KEY = 'parcos_superadmin_dev_secret_2026';

export function getSuperAdminToken(): string {
  if (typeof window === 'undefined') return DEFAULT_DEV_SUPERADMIN_KEY;
  return (
    sessionStorage.getItem(SUPERADMIN_STORAGE_KEY) ||
    localStorage.getItem(SUPERADMIN_STORAGE_KEY) ||
    sessionStorage.getItem('rxm_admin_session_token') ||
    DEFAULT_DEV_SUPERADMIN_KEY
  );
}

export function setSuperAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SUPERADMIN_STORAGE_KEY, token);
  localStorage.setItem(SUPERADMIN_STORAGE_KEY, token);
}

export function getSuperAdminHeaders(): Record<string, string> {
  const token = getSuperAdminToken();
  return {
    'Content-Type': 'application/json',
    'X-SuperAdmin-Key': token,
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Preluare lista completă a chiriașilor din PostgreSQL backend
 */
export async function fetchTenantsFromBackend(): Promise<DealerProfile[]> {
  const res = await fetch('/api/superadmin/tenants', {
    method: 'GET',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    throw new Error(`Eroare HTTP ${res.status} la preluarea chiriașilor din backend`);
  }

  const json = await res.json();
  if (!json.success || !Array.isArray(json.tenants)) {
    throw new Error(json.error || 'Răspuns invalid de la serverul SuperAdmin');
  }

  return json.tenants.map(mapBackendTenantToProfile);
}

/**
 * Salvare date profil showroom în backend (PUT /api/superadmin/tenants/:slug)
 */
export async function saveTenantProfileToBackend(
  slug: string, 
  partialProfile: Partial<DealerProfile>
): Promise<DealerProfile> {
  const payload = {
    name: partialProfile.name,
    domain: partialProfile.domain,
    phone_primary: partialProfile.phonePrimary,
    phone_secondary: partialProfile.phoneSecondary,
    whatsapp_number: partialProfile.whatsappNumber,
    email: partialProfile.email,
    address_street: partialProfile.address,
    cui: partialProfile.cui,
    reg_com: partialProfile.regCom,
    bank_name: partialProfile.bankName,
    iban_ron: partialProfile.ibanRon,
    iban_eur: partialProfile.ibanEur,
    tier: partialProfile.tier,
    status: partialProfile.status,
    max_vehicles_quota: partialProfile.maxVehiclesQuota,
    theme_preset: partialProfile.themePreset,
    landing_config: partialProfile.landingConfig,
    landingConfig: partialProfile.landingConfig,
    config: {
      ...(partialProfile.config || {}),
      ...(partialProfile.landingConfig ? { landingConfig: partialProfile.landingConfig } : {})
    }
  };

  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la salvarea profilului dealerului`);
  }

  const json = await res.json();
  return mapBackendTenantToProfile(json.tenant);
}

/**
 * Comutare features pentru un tenant (PATCH /api/superadmin/tenants/:slug/features)
 */
export async function saveTenantFeaturesToBackend(
  slug: string, 
  features: Partial<TenantFeatures>
): Promise<TenantFeatures> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/features`, {
    method: 'PATCH',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify({ features })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la salvarea modulelor dealerului`);
  }

  const json = await res.json();
  return json.features;
}

/**
 * Schimbare status tenant (PATCH /api/superadmin/tenants/:slug/status)
 */
export async function saveTenantStatusToBackend(
  slug: string, 
  status: TenantStatus
): Promise<DealerProfile> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/status`, {
    method: 'PATCH',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la modificarea stării dealerului`);
  }

  const json = await res.json();
  return mapBackendTenantToProfile(json.tenant);
}

/**
 * Înrolare showroom nou (POST /api/superadmin/tenants)
 */
export async function registerTenantBackend(newTenant: DealerProfile): Promise<DealerProfile> {
  const payload = {
    name: newTenant.name,
    slug: newTenant.slug,
    domain: newTenant.domain,
    phonePrimary: newTenant.phonePrimary,
    phoneSecondary: newTenant.phoneSecondary,
    whatsappNumber: newTenant.whatsappNumber,
    email: newTenant.email,
    addressStreet: newTenant.address,
    cui: newTenant.cui,
    regCom: newTenant.regCom,
    bankName: newTenant.bankName,
    ibanRon: newTenant.ibanRon,
    ibanEur: newTenant.ibanEur,
    tier: newTenant.tier || 'starter',
    status: newTenant.status || 'active',
    maxVehiclesQuota: newTenant.maxVehiclesQuota || 25,
    themePreset: newTenant.themePreset || 'obsidian_gold',
    features: newTenant.features,
    config: newTenant.config
  };

  const res = await fetch('/api/superadmin/tenants', {
    method: 'POST',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la înregistrarea showroom-ului`);
  }

  const json = await res.json();
  return mapBackendTenantToProfile(json.tenant);
}

/**
 * 1-Click Feature Propagation pe toți dealerii (POST /api/superadmin/propagation/feature)
 */
export async function propagateFeatureGloballyBackend(
  featureKey: string, 
  enabled: boolean = true
): Promise<{ success: boolean; updatedCount: number; dealersUpdated: string[] }> {
  const res = await fetch('/api/superadmin/propagation/feature', {
    method: 'POST',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify({ featureKey, enabled })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la propagarea globală a modulului`);
  }

  return await res.json();
}

export interface FgoTestParams {
  apiKey?: string;
  cui?: string;
  seriesFiscal?: string;
  seriesProforma?: string;
  environment?: 'live' | 'test';
}

export interface FgoTestResponse {
  success: boolean;
  message?: string;
  error?: string;
  environment?: 'live' | 'test';
  simulated?: boolean;
  series?: string[];
  issuerCui?: string;
}

/**
 * Testare conexiune FGO API v2 BYOK (POST /api/superadmin/tenants/:slug/integrations/fgo/test)
 */
export async function testFgoConnectionBackend(
  slug: string,
  params: FgoTestParams
): Promise<FgoTestResponse> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/integrations/fgo/test`, {
    method: 'POST',
    headers: getSuperAdminHeaders(),
    body: JSON.stringify(params)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Eroare HTTP ${res.status} la testarea conexiunii FGO`);
  }

  return json;
}

export interface VpsTelemetryData {
  success: boolean;
  host: string;
  serverName: string;
  provider: string;
  nodeEnv: string;
  uptimeSeconds: number;
  processUptimeSeconds: number;
  cpu: {
    cores: number;
    model: string;
    loadAvg: number[];
    percentEstimated: number;
  };
  memory: {
    totalMb: number;
    freeMb: number;
    usedMb: number;
    percentUsed: number;
  };
  disk: {
    totalGb: number;
    freeGb: number;
    usedGb: number;
    percentUsed: number;
  };
  services: {
    postgres: 'online' | 'offline';
    nginx: 'online' | 'offline';
    api: 'online' | 'offline';
    mailHub?: 'online' | 'offline';
  };
  timestamp: string;
}

/**
 * Preluare metrici hardware live Netcup VPS (GET /api/superadmin/telemetry)
 */
export async function fetchVpsTelemetry(): Promise<VpsTelemetryData> {
  const res = await fetch('/api/superadmin/telemetry', {
    method: 'GET',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la preluarea telemetriei VPS`);
  }

  return await res.json();
}

/**
 * Mapare entitate backend PostgreSQL -> DealerProfile frontend
 */
export function mapBackendTenantToProfile(raw: any): DealerProfile {
  return {
    name: raw.name || '',
    slug: raw.slug || '',
    domain: raw.domain || undefined,
    cui: raw.cui || raw.vat_number || '',
    regCom: raw.reg_com || raw.regCom || '',
    address: raw.address_street || raw.address || '',
    phonePrimary: raw.phone_primary || raw.phonePrimary || '',
    phoneSecondary: raw.phone_secondary || raw.phoneSecondary || '',
    phoneFinance: raw.phone_finance || raw.phoneFinance || raw.phone_secondary || '',
    whatsappNumber: raw.whatsapp_number || raw.whatsappNumber || raw.phone_primary || '',
    whatsappFinance: raw.whatsapp_finance || raw.whatsappFinance || raw.phone_secondary || '',
    financeContactName: raw.finance_contact_name || raw.financeContactName || 'Consilier Vânzări',
    generalContactName: raw.general_contact_name || raw.generalContactName || 'Consilier Vânzări',
    email: raw.email || '',
    tiktokHandle: raw.tiktok_handle || raw.tiktokHandle || '@parcos.ro',
    tiktokUrl: raw.tiktok_url || raw.tiktokUrl || '',
    facebookUrl: raw.facebook_url || raw.facebookUrl || '',
    instagramUrl: raw.instagram_url || raw.instagramUrl || '',
    openingHours: raw.opening_hours || raw.openingHours || 'Luni - Vineri 09:00 - 18:00',
    financingPartners: raw.financing_partners || raw.financingPartners || ['Banca Transilvania', 'TBI Bank'],
    themePreset: raw.theme_preset || raw.themePreset || 'obsidian_gold',
    tier: (raw.tier || 'starter') as TenantTier,
    status: (raw.status || 'active') as TenantStatus,
    maxVehiclesQuota: Number(raw.max_vehicles_quota || raw.maxVehiclesQuota || 25),
    activeVehiclesCount: Number(raw.active_vehicles_count !== undefined ? raw.active_vehicles_count : (raw.activeVehiclesCount !== undefined ? raw.activeVehiclesCount : 0)),
    bankName: raw.bank_name || raw.bankName || 'Banca Transilvania',
    ibanRon: raw.iban_ron || raw.ibanRon || '',
    ibanEur: raw.iban_eur || raw.ibanEur || '',
    features: raw.features || {
      ocrCivTalon: true,
      olxStockSync: true,
      tikTokStudio: true,
      autolicitPush: false,
      salesDocsEngine: true,
      windowStickersQr: true,
      financingCalculator: true,
      whatsappLeadsBot: true,
      fgoInvoicing: false
    },
    landingConfig: raw.landingConfig || raw.landing_config || raw.config?.landingConfig || undefined,
    config: raw.config || {}
  };
}

export interface SaasInvoice {
  id: string;
  series: string;
  number: string;
  tenantSlug: string;
  tenantName: string;
  tier: string;
  tierName: string;
  issueDate: string;
  dueDate: string;
  gracePeriodUntil: string;
  amountNetEur: number;
  vatRate: number;
  vatEur: number;
  totalGrossEur: number;
  currency: string;
  status: 'issued' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string | null;
  description: string;
  issuer: {
    name: string;
    cui: string;
    regCom: string;
    bankName: string;
    accountTitle: string;
    ibanRon: string;
    ibanEur: string;
    email: string;
  };
  paymentInstructions: string;
  fgo?: {
    fgoInvoiceNumber: string;
    spvSent: boolean;
    environment: string;
  };
}

export interface SaasBillingDetails {
  tenantSlug: string;
  tenantName: string;
  tier: string;
  pricing: {
    tier: string;
    name: string;
    vehiclesLimit: number;
    netEur: number;
    vatEur: number;
    grossEur: number;
    currency: string;
    features: string[];
  };
  subscriptionStatus: 'active' | 'in_grace_period' | 'suspended';
  invoices: SaasInvoice[];
  nextBillingDate: string | null;
  gracePeriodUntil: string | null;
  issuer: {
    name: string;
    cui: string;
    regCom: string;
    bankName: string;
    accountTitle: string;
    ibanRon: string;
    ibanEur: string;
    email: string;
  };
}

/**
 * Preluare detalii facturare SaaS și istoric facturi pentru un tenant
 */
export async function fetchTenantBilling(slug: string): Promise<SaasBillingDetails> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/billing`, {
    method: 'GET',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la preluarea datelor de facturare`);
  }

  return await res.json();
}

/**
 * Declanșare manuală emitere factură SaaS pentru un showroom
 */
export async function triggerManualSaasInvoice(slug: string): Promise<SaasInvoice> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/billing/generate`, {
    method: 'POST',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la emiterea facturii`);
  }

  const json = await res.json();
  return json.invoice;
}

/**
 * Marcare factură ca achitată
 */
export async function markSaasInvoicePaid(slug: string, invoiceId: string): Promise<SaasInvoice> {
  const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(slug)}/billing/invoices/${encodeURIComponent(invoiceId)}/pay`, {
    method: 'POST',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la marcarea plății`);
  }

  const json = await res.json();
  return json.invoice;
}

/**
 * Declanșare sweep verificare scadențe și perioadă de grație
 */
export async function runOverdueBillingSweep(): Promise<any> {
  const res = await fetch('/api/superadmin/billing/check-overdue', {
    method: 'POST',
    headers: getSuperAdminHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Eroare HTTP ${res.status} la verificarea scadențelor`);
  }

  const json = await res.json();
  return json.summary;
}

