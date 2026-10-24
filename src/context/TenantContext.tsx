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

export interface TenantContextType {
  tenant: DealerProfile;
  tenantId: string;
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

  const [tenantId, setTenantIdState] = useState<string>(detectInitialTenant);
  const [dynamicConfig, setDynamicConfig] = useState<Partial<DealerProfile> | null>(null);

  const setTenantId = (id: string) => {
    if (typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('rxmautomobile.ro')) {
      setTenantIdState('rxm');
      return;
    }

    const resolved = resolveTenantKey(id);
    if (tenantsMap[resolved] || TENANT_DEALERS[resolved]) {
      setTenantIdState(resolved);
      try {
        localStorage.setItem('rxm_tenant_id', resolved);
        const url = new URL(window.location.href);
        url.searchParams.set('dealer', resolved);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

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

  // Reîmprospătare automată din backend la inițializare
  useEffect(() => {
    refreshTenantsFromBackend();
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
  }, [tenantId]);

  const isPitchModeAllowed = useMemo(() => isShowcaseEnvironment(), []);

  const baseTenant = tenantsMap[tenantId] || TENANT_DEALERS[tenantId] || SEED_DEALER;
  const tenant = useMemo(() => {
    if (!dynamicConfig) return baseTenant;
    return {
      ...baseTenant,
      ...dynamicConfig,
      name: dynamicConfig.name || baseTenant.name,
      cui: dynamicConfig.cui || baseTenant.cui,
      themePreset: (dynamicConfig.themePreset as any) || baseTenant.themePreset,
    };
  }, [baseTenant, dynamicConfig]);

  const theme = useMemo(() => getThemeConfig(tenant.themePreset), [tenant.themePreset]);

  // Actualizare dinamică document.title, atribute HTML și injectare CSS variables în :root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const isSpecialPage = 
        path.startsWith('/ghid-auto') || hash.includes('ghid-auto') ||
        path.startsWith('/saas') || hash.includes('saas') ||
        path.startsWith('/termeni-si-conditii') || hash.includes('termeni-si-conditii') ||
        path.startsWith('/politica-cookie') || hash.includes('politica-cookie') ||
        path.startsWith('/livrare-nationala') || hash.includes('livrare-nationala');

      if (!isSpecialPage) {
        document.title = `${tenant.name} — Autovehicule Rulate Premium | Cluj-Napoca`;
      }
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
      {children}
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
