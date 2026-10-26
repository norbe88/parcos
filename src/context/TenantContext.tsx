import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { DealerProfile, SEED_DEALER, TENANT_DEALERS, DEFAULT_TENANT_FEATURES } from '../db/seed';
import { TenantFeatures, TenantTier, TenantStatus, DealerLandingConfig } from '../db/types';
import { getThemeConfig, ThemeConfig } from '../utils/themePresets';
import {
  fetchTenantsFromBackend,
  saveTenantFeaturesToBackend,
  saveTenantProfileToBackend,
  saveTenantStatusToBackend,
  registerTenantBackend
} from '../utils/superAdminApi';

export interface TenantInfo {
  id: string;
  name: string;
  cui: string;
  address: string;
  themePreset?: string;
  domain?: string;
  slug?: string;
  tier?: TenantTier;
  status?: TenantStatus;
  maxVehiclesQuota?: number;
  features?: TenantFeatures;
}

export type TenantBootState = 'pending' | 'ready' | 'unconfigured';

export interface TenantContextType {
  tenant: DealerProfile;
  tenantId: string;
  tenantBoot: TenantBootState;
  theme: ThemeConfig;
  setTenantId: (id: string) => void;
  availableTenants: TenantInfo[];
  allTenants: Record<string, DealerProfile>;
  refreshTenantsFromBackend: () => Promise<void>;
  updateTenantFeatures: (tenantId: string, features: Partial<TenantFeatures>) => void;
  updateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  updateTenantProfile: (tenantId: string, partialProfile: Partial<DealerProfile>) => void;
  registerTenant: (newTenant: DealerProfile) => void;
  isPitchModeAllowed: boolean;
  vatRate: number;
  warrantyTerm: string;
  reservationTerm: string;
  hostingProvider: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Verifică dacă mediul curent permite modul demonstrativ (Showcase / Admin Pitch Mode).
 * STRICT interzis pe domeniul de producție al clientului fondator (rxmautomobile.ro).
 * Permis DOAR local (localhost) sau pe subdomeniile holdingului Carvana SRL (ex: showroom.autolit.ro).
 */
export const isShowcaseEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();

  // 1. Domeniul oficial de producție al clientului fondator: STRICT fără showcasing / pitch mode
  if (hostname.includes('rxmautomobile.ro')) {
    return false;
  }

  // 2. Mediul local de dezvoltare (Node-ZBook / Zety, Desy, Lapy)
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }

  // 3. Subdomeniul dedicat de prezentare al holdingului Carvana SRL (anexă AutoLit.ro)
  if (
    hostname.includes('showroom.autolit.ro') ||
    hostname.includes('showcase.autolit.ro') ||
    hostname.includes('demo.autolit.ro') ||
    hostname.includes('autolit.ro') ||
    hostname.includes('parcos.ro')
  ) {
    return true;
  }

  return false;
};

// Conversie hex (#f59e0b) -> r, g, b pentru utilizare în CSS rgba()
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '245, 158, 11';
}

type HostBootKind = 'rxm' | 'local' | 'console' | 'production';

function bareHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

function isLocalDevHost(hostname: string): boolean {
  const host = bareHostname(hostname);
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
}

function isPlatformConsoleHost(hostname: string): boolean {
  const host = bareHostname(hostname);
  return host === 'app.parcos.ro' || host === 'admin.parcos.ro';
}

function hostBootKind(hostname: string): HostBootKind {
  const host = hostname.toLowerCase();
  if (host.includes('rxmautomobile.ro')) return 'rxm';
  if (isLocalDevHost(host)) return 'local';
  if (isPlatformConsoleHost(host)) return 'console';
  return 'production';
}

function initialTenantBoot(): { tenantId: string; boot: TenantBootState } {
  if (typeof window === 'undefined') return { tenantId: 'rxm', boot: 'ready' };
  if (hostBootKind(window.location.hostname) === 'rxm') return { tenantId: 'rxm', boot: 'ready' };
  return { tenantId: '', boot: 'pending' };
}

function localTenantResolveUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('dealer') || params.get('dealer_slug') || params.get('tenant');
    if (fromQuery) return `/api/tenant/resolve?dealer=${encodeURIComponent(fromQuery)}`;
    if (window.location.hash.includes('dealer=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const fromHash = hashParams.get('dealer');
      if (fromHash) return `/api/tenant/resolve?dealer=${encodeURIComponent(fromHash)}`;
    }
    const saved = localStorage.getItem('rxm_tenant_id');
    if (saved) return `/api/tenant/resolve?dealer=${encodeURIComponent(saved)}`;
  } catch {}
  return '/api/tenant/resolve';
}

function blankDealerProfile(slug: string, name?: string, domain?: string): DealerProfile {
  return {
    name: name || slug || 'Showroom',
    slug: slug || undefined,
    domain,
    cui: '',
    address: '',
    bankName: '',
    ibanRon: '',
    phonePrimary: '',
    phoneSecondary: '',
    phoneFinance: '',
    whatsappNumber: '',
    whatsappFinance: '',
    financeContactName: '',
    generalContactName: '',
    email: '',
    tiktokHandle: '',
    tiktokUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    openingHours: '',
    financingPartners: [],
    themePreset: 'obsidian_gold',
  };
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  // Stocare dinamică a registrului complet de tenanți pentru SuperAdmin Control Plane
  const [tenantsMap, setTenantsMap] = useState<Record<string, DealerProfile>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('parcos_tenants_map');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...TENANT_DEALERS, ...parsed };
        }
      }
    } catch {}
    return { ...TENANT_DEALERS };
  });

  // Rezolvă alias-uri scurte (ex: mpi -> mpi_auto, top -> top_auto)
  const resolveTenantKey = (rawKey: string): string => {
    const k = rawKey.toLowerCase().trim();
    if (k === 'sandbox' || k === 'rxm_sandbox' || k === 'rxm-sandbox' || k === 'stage' || k === 'staging') return 'rxm_sandbox';
    if (k === 'mpi' || k === 'mpi_auto' || k === 'mpiauto') return 'mpi_auto';
    if (k === 'top' || k === 'top_auto' || k === 'topauto') return 'top_auto';
    if (k === 'rxm' || k === 'rxm_auto' || k === 'rxmautomobile') return 'rxm';
    if (k === 'autonord' || k === 'autonord_cluj') return 'autonord_cluj';
    return k;
  };

  // Detectează tenantul inițial din URL (?dealer=...), subdomain sau localStorage
  const detectInitialTenant = (): string => {
    if (typeof window === 'undefined') return 'rxm';

    try {
      const hostname = window.location.hostname.toLowerCase();

      // Pe domeniul de producție al clientului fondator, izolăm strict la 'rxm'
      if (hostname.includes('rxmautomobile.ro')) {
        try {
          if (localStorage.getItem('rxm_tenant_id') && localStorage.getItem('rxm_tenant_id') !== 'rxm') {
            localStorage.setItem('rxm_tenant_id', 'rxm');
          }
        } catch {}
        return 'rxm';
      }

      // Host de producție: slug-ul vine din /api/tenant/resolve, nu din query sau cache local.
      if (!isLocalDevHost(hostname)) return '';

      // 0. Server-injected meta tag (ex: via Nginx X-Dealer-Slug or SSR)
      const metaDealer = document.querySelector('meta[name="x-dealer-slug"]')?.getAttribute('content');
      if (metaDealer) {
        const resolved = resolveTenantKey(metaDealer);
        if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
          return resolved;
        }
      }

      // 1. Parametru URL query
      const urlParams = new URLSearchParams(window.location.search);
      const rawQueryDealer = urlParams.get('dealer') || urlParams.get('dealer_slug') || urlParams.get('tenant');
      if (rawQueryDealer) {
        const resolved = resolveTenantKey(rawQueryDealer);
        if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
          return resolved;
        }
      }

      // 2. Hash param (dacă e SPA cu hash routing)
      if (window.location.hash.includes('dealer=')) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const rawHashDealer = hashParams.get('dealer');
        if (rawHashDealer) {
          const resolved = resolveTenantKey(rawHashDealer);
          if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
            return resolved;
          }
        }
      }

      // 3. Subdomeniu (ex: sandbox.parcos.ro, mpi.carmatik.ro sau top.autolicit.ro)
      if (hostname.includes('sandbox.') || hostname.includes('test.') || hostname.startsWith('sandbox') || hostname.startsWith('test')) return 'rxm_sandbox';
      if (hostname.includes('mpi.') || hostname.includes('mpiauto')) return 'mpi_auto';
      if (hostname.includes('top.') || hostname.includes('topauto')) return 'top_auto';
      if (hostname.includes('autonord.')) return 'autonord_cluj';

      // 4. LocalStorage
      const savedTenant = localStorage.getItem('rxm_tenant_id');
      if (savedTenant) {
        const resolved = resolveTenantKey(savedTenant);
        if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
          return resolved;
        }
      }
    } catch (e) {
      console.warn('Eroare detectare tenant:', e);
    }

    return 'rxm';
  };

  const [tenantId, setTenantIdState] = useState<string>(() => initialTenantBoot().tenantId);
  const [tenantBoot, setTenantBoot] = useState<TenantBootState>(() => initialTenantBoot().boot);
  const [resolvedHint, setResolvedHint] = useState<{ slug: string; name?: string; domain?: string } | null>(null);
  const [dynamicConfig, setDynamicConfig] = useState<Partial<DealerProfile> | null>(null);

  const setTenantId = (id: string) => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname.toLowerCase();
    const kind = hostBootKind(hostname);
    if (kind === 'rxm') {
      setTenantIdState('rxm');
      setTenantBoot('ready');
      return;
    }
    if (kind === 'production' && !isShowcaseEnvironment()) return;

    const resolved = resolveTenantKey(id);
    if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
      setTenantIdState(resolved);
      setTenantBoot('ready');
      try {
        localStorage.setItem('rxm_tenant_id', resolved);
        if (kind === 'local') {
          const url = new URL(window.location.href);
          url.searchParams.set('dealer', resolved);
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const kind = hostBootKind(window.location.hostname);

    const fail = () => {
      if (cancelled) return;
      if (kind === 'rxm') return;
      if (kind === 'local') {
        setTenantIdState(detectInitialTenant() || 'rxm');
        setTenantBoot('ready');
        return;
      }
      if (kind === 'console') {
        setResolvedHint({
          slug: 'parcos',
          name: 'ParcOS — Dealership Operating System',
          domain: bareHostname(window.location.hostname),
        });
        setTenantIdState('parcos');
        setTenantBoot('ready');
        return;
      }
      setTenantIdState('');
      setTenantBoot('unconfigured');
    };

    const succeed = (slugRaw: string, name?: string, domain?: string) => {
      if (cancelled) return;
      const slug = resolveTenantKey(slugRaw);
      if (!slug) {
        fail();
        return;
      }
      if (kind === 'rxm' && slug !== 'rxm') return;
      setResolvedHint({ slug, name, domain });
      setTenantIdState(slug);
      setDynamicConfig((prev) => ({
        ...(prev || {}),
        name: name || prev?.name,
        slug,
        domain: domain || prev?.domain,
      }));
      setTenantBoot('ready');
    };

    const url = kind === 'local' ? localTenantResolveUrl() : '/api/tenant/resolve';
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          fail();
          return;
        }
        const json = await res.json();
        if (json && json.success && typeof json.slug === 'string' && json.slug.trim()) {
          succeed(
            json.slug,
            typeof json.name === 'string' ? json.name : undefined,
            typeof json.domain === 'string' ? json.domain : undefined
          );
          return;
        }
        fail();
      })
      .catch(() => fail());

    return () => {
      cancelled = true;
    };
  }, []);

  // Reîmprospătare dinamică a listei de chiriași direct din PostgreSQL via SuperAdmin API
  const refreshTenantsFromBackend = useCallback(async (): Promise<void> => {
    try {
      const backendTenants = await fetchTenantsFromBackend();
      if (backendTenants && backendTenants.length > 0) {
        setTenantsMap(prev => {
          const updated: Record<string, DealerProfile> = { ...prev };
          backendTenants.forEach(t => {
            const slug = t.slug || resolveTenantKey(t.name);
            updated[slug] = {
              ...(prev[slug] || {}),
              ...t
            };
          });
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('parcos_tenants_map', JSON.stringify(updated));
            }
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.warn('⚠️ [TenantContext] Refresh din backend indisponibil (se folosește fallback local):', err);
    }
  }, []);

  // Reîmprospătare automată din backend la inițializare (strict pe rutele de /superadmin)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin')) {
      refreshTenantsFromBackend();
    }
  }, [refreshTenantsFromBackend]);

  // Modificare granulară a feature flags per tenant (SuperAdmin Master Control)
  const updateTenantFeatures = (tId: string, features: Partial<TenantFeatures>) => {
    const resolved = resolveTenantKey(tId);
    setTenantsMap(prev => {
      const current = prev[resolved] || TENANT_DEALERS[resolved] || SEED_DEALER;
      const updated: DealerProfile = {
        ...current,
        features: {
          ...(current.features || DEFAULT_TENANT_FEATURES),
          ...features,
        }
      };
      const nextMap = { ...prev, [resolved]: updated };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('parcos_tenants_map', JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    // Sincronizare asincronă cu PostgreSQL backend
    saveTenantFeaturesToBackend(resolved, features).catch(err => {
      console.warn(`[TenantContext] Salvare features în backend pentru ${resolved} eșuată:`, err.message);
    });
  };

  // Modificare stare tenant (Activ / Suspendat / Demo)
  const updateTenantStatus = (tId: string, status: TenantStatus) => {
    const resolved = resolveTenantKey(tId);
    setTenantsMap(prev => {
      const current = prev[resolved] || TENANT_DEALERS[resolved] || SEED_DEALER;
      const updated: DealerProfile = {
        ...current,
        status
      };
      const nextMap = { ...prev, [resolved]: updated };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('parcos_tenants_map', JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    // Sincronizare asincronă cu PostgreSQL backend
    saveTenantStatusToBackend(resolved, status).catch(err => {
      console.warn(`[TenantContext] Salvare status în backend pentru ${resolved} eșuată:`, err.message);
    });
  };

  // Actualizare date profil & integrare tenant (SuperAdmin Master Control)
  const updateTenantProfile = (tId: string, partialProfile: Partial<DealerProfile>) => {
    const resolved = resolveTenantKey(tId);
    setTenantsMap(prev => {
      const current = prev[resolved] || TENANT_DEALERS[resolved] || SEED_DEALER;
      const updated: DealerProfile = {
        ...current,
        ...partialProfile,
        config: {
          ...(current.config || {}),
          ...(partialProfile.config || {})
        }
      };
      const nextMap = { ...prev, [resolved]: updated };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('parcos_tenants_map', JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    if (resolved === tenantId) {
      setDynamicConfig(prev => prev ? { ...prev, ...partialProfile } : partialProfile);
    }

    // Sincronizare asincronă cu PostgreSQL backend
    saveTenantProfileToBackend(resolved, partialProfile).catch(err => {
      console.warn(`[TenantContext] Salvare profil în backend pentru ${resolved} eșuată:`, err.message);
    });
  };

  // Înrolare tenant nou de către SuperAdmin
  const registerTenant = (newTenant: DealerProfile) => {
    const slug = newTenant.slug || newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const enriched: DealerProfile = {
      ...newTenant,
      slug,
      tier: newTenant.tier || 'starter',
      status: newTenant.status || 'active',
      maxVehiclesQuota: newTenant.maxVehiclesQuota || 25,
      features: newTenant.features || { ...DEFAULT_TENANT_FEATURES },
    };
    setTenantsMap(prev => {
      const nextMap = { ...prev, [slug]: enriched };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('parcos_tenants_map', JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    // Sincronizare asincronă cu PostgreSQL backend
    registerTenantBackend(enriched).catch(err => {
      console.warn(`[TenantContext] Înrolare tenant în backend pentru ${slug} eșuată:`, err.message);
    });
  };

  // Interogare backend pentru profilul dinamic al tenantului curent
  useEffect(() => {
    if (tenantBoot !== 'ready' || !tenantId) return;
    let isCancelled = false;
    const fetchTenantConfig = async () => {
      try {
        const res = await fetch(`/api/tenant-config?dealer=${encodeURIComponent(tenantId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.dealer && !isCancelled) {
            setDynamicConfig({
              name: json.dealer.name,
              cui: json.dealer.vat_number || json.dealer.vatNumber,
              address: json.dealer.address_street || json.dealer.address,
              phonePrimary: json.dealer.phone_primary || json.dealer.phonePrimary,
              phoneSecondary: json.dealer.phone_secondary || json.dealer.phoneSecondary,
              whatsappNumber: json.dealer.whatsapp_number || json.dealer.whatsappNumber,
              email: json.dealer.email,
              themePreset: json.themePreset || json.dealer.config?.themePreset,
              landingConfig: json.dealer.config?.landingConfig || json.dealer.landingConfig,
            });
          }
        }
      } catch {
        // Fallback transparent la datele locale
      }
    };

    fetchTenantConfig();
    return () => {
      isCancelled = true;
    };
  }, [tenantId, tenantBoot]);

  const isPitchModeAllowed = useMemo(() => isShowcaseEnvironment(), []);

  const knownTenant = tenantId ? (tenantsMap[tenantId] || TENANT_DEALERS[tenantId]) : undefined;
  const hintedTenant = resolvedHint && tenantId && resolvedHint.slug === tenantId
    ? blankDealerProfile(resolvedHint.slug, resolvedHint.name, resolvedHint.domain)
    : undefined;
  const baseTenant = knownTenant || hintedTenant || (tenantId === 'rxm' ? SEED_DEALER : blankDealerProfile(tenantId));
  const tenant = useMemo(() => {
    if (!dynamicConfig) return baseTenant;
    return {
      ...baseTenant,
      ...dynamicConfig,
      name: dynamicConfig.name || baseTenant.name,
      cui: dynamicConfig.cui || baseTenant.cui,
      themePreset: (dynamicConfig.themePreset as any) || baseTenant.themePreset,
      landingConfig: dynamicConfig.landingConfig || baseTenant.landingConfig,
    };
  }, [baseTenant, dynamicConfig]);

  const theme = useMemo(() => getThemeConfig(tenant.themePreset), [tenant.themePreset]);

  // Actualizare atribute HTML și injectare CSS variables adaptive în :root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeTheme = tenant.themePreset || 'obsidian_gold';
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.body.setAttribute('data-theme', activeTheme);

      // Injectare CSS Variables adaptive în :root
      const root = document.documentElement;
      root.style.setProperty('--color-accent', theme.accentColor);
      root.style.setProperty('--color-accent-hover', theme.accentHoverColor);
      root.style.setProperty('--color-accent-text', theme.accentTextColor);
      root.style.setProperty('--color-accent-rgb', hexToRgb(theme.accentColor));
    }
  }, [tenant, theme]);

  const availableTenants: TenantInfo[] = useMemo(() => {
    if (!isPitchModeAllowed) {
      return [{
        id: 'rxm',
        name: SEED_DEALER.name,
        cui: SEED_DEALER.cui,
        address: SEED_DEALER.address,
        themePreset: SEED_DEALER.themePreset,
        slug: 'rxm',
        tier: 'enterprise',
        status: 'active',
        features: SEED_DEALER.features,
        maxVehiclesQuota: SEED_DEALER.maxVehiclesQuota
      }];
    }
    return Object.entries(tenantsMap).map(([id, d]) => ({
      id,
      name: d.name,
      cui: d.cui,
      address: d.address,
      themePreset: d.themePreset,
      slug: d.slug || id,
      domain: d.domain,
      tier: d.tier || 'starter',
      status: d.status || 'active',
      features: d.features || DEFAULT_TENANT_FEATURES,
      maxVehiclesQuota: d.maxVehiclesQuota || 25
    }));
  }, [isPitchModeAllowed, tenantsMap]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId,
        tenantBoot,
        theme,
        setTenantId,
        availableTenants,
        allTenants: tenantsMap,
        refreshTenantsFromBackend,
        updateTenantFeatures,
        updateTenantStatus,
        updateTenantProfile,
        registerTenant,
        isPitchModeAllowed,
        vatRate: 0.21, // Invariant strict 21%
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare',
        hostingProvider: 'Netcup VPS (152.53.158.65)',
      }}
    >
      {tenantBoot === 'unconfigured' ? (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 text-center">
          <h1 className="text-lg sm:text-xl font-semibold">Showroom neconfigurat</h1>
        </div>
      ) : tenantBoot === 'pending' ? (
        <div className="min-h-screen bg-background" aria-busy="true" />
      ) : (
        children
      )}
    </TenantContext.Provider>
  );
};

export const useTenantContext = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    const fallbackTheme = getThemeConfig(SEED_DEALER.themePreset);
    return {
      tenant: SEED_DEALER,
      tenantId: 'rxm',
      tenantBoot: 'ready',
      theme: fallbackTheme,
      setTenantId: () => {},
      availableTenants: [{ 
        id: 'rxm', 
        name: SEED_DEALER.name, 
        cui: SEED_DEALER.cui, 
        address: SEED_DEALER.address, 
        themePreset: SEED_DEALER.themePreset,
        slug: 'rxm',
        tier: 'enterprise',
        status: 'active',
        features: SEED_DEALER.features,
        maxVehiclesQuota: 100
      }],
      allTenants: TENANT_DEALERS,
      refreshTenantsFromBackend: async () => {},
      updateTenantFeatures: () => {},
      updateTenantStatus: () => {},
      updateTenantProfile: () => {},
      registerTenant: () => {},
      isPitchModeAllowed: false,
      vatRate: 0.21,
      warrantyTerm: 'Cont de Garanție',
      reservationTerm: 'Garanție de Rezervare/Participare',
      hostingProvider: 'Netcup VPS (152.53.158.65)',
    };
  }
  return context;
};
