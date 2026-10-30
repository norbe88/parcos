import { useEffect, useRef } from 'react';
import { useTenant } from './useTenant';
import { sendTrafficEvent } from '../services/telemetryService';
import { isCurrentSessionAdmin } from '../utils/adminAuth';

export interface UsePageTrackingOptions {
  dealerSlug?: string;
  isAdmin?: boolean;
  activeView?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook de telemetrie pentru captarea automată a afișărilor de pagină (pageviews) în showroom.
 * - Deduplicare per rută/vedere în aceeași sesiune de navigare
 * - Excludere automată pentru sesiunile de administrare (pentru a nu altera indicatorii de audiență)
 * - Suport pentru comutarea tab-urilor/vederilor în SPA (ex: showroom, terms, delivery, ghid-auto, etc.)
 */
export function usePageTracking(
  viewOrOptions?: string | UsePageTrackingOptions,
  extraOptions?: UsePageTrackingOptions
): void {
  // Rezolvare polimorfică parametri (permite atât usePageTracking('showroom') cât și usePageTracking({ activeView: 'showroom' }))
  const activeView = typeof viewOrOptions === 'string' 
    ? viewOrOptions 
    : (viewOrOptions?.activeView || extraOptions?.activeView || 'showroom');

  const options: UsePageTrackingOptions = typeof viewOrOptions === 'object' && viewOrOptions !== null
    ? { ...viewOrOptions, ...extraOptions }
    : (extraOptions || {});

  // 1. Rezolvare Dealer Slug via useTenant
  let tenantSlug = 'rxm';
  try {
    const tenantCtx = useTenant();
    if (tenantCtx?.tenantId || tenantCtx?.tenant?.slug) {
      tenantSlug = tenantCtx.tenantId || tenantCtx.tenant?.slug || 'rxm';
    }
  } catch {
    // Ignoră dacă rulat în mediu fără context
  }

  const effectiveDealerSlug = (options.dealerSlug || tenantSlug || 'rxm').trim().toLowerCase();
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 2. Verificare sesiune admin: Ignoră telemetria dacă este în mod administrator
    const isAdminExplicit = options.isAdmin === true;
    const isAdminSession = isCurrentSessionAdmin();
    const isAdminView = activeView === 'admin' || activeView === 'superadmin';
    const isAdminUrl = 
      window.location.pathname.includes('/admin') || 
      window.location.pathname.includes('/superadmin') ||
      window.location.hash.includes('#admin') ||
      window.location.hash.includes('#superadmin');

    if (isAdminExplicit || isAdminSession || isAdminView || isAdminUrl) {
      return;
    }

    // 3. Construire cheie rută curentă
    const pathname = window.location.pathname || '/';
    const hash = window.location.hash || '';
    const currentPath = `${pathname}${hash ? hash : (activeView && activeView !== 'showroom' ? `#${activeView}` : '')}`;
    const trackingKey = `${effectiveDealerSlug}:${currentPath}:${activeView}`;

    // Deduplicare în memorie pentru component render cycles / React StrictMode
    if (lastTrackedKeyRef.current === trackingKey) {
      return;
    }

    // Deduplicare în sessionStorage per tab session / rută
    const sessionKey = `parcos_pv_${encodeURIComponent(trackingKey)}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        lastTrackedKeyRef.current = trackingKey;
        return;
      }
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // sessionStorage indisponibil
    }

    lastTrackedKeyRef.current = trackingKey;

    // 4. Emitere asincronă semnal pageview
    sendTrafficEvent({
      eventType: 'pageview',
      dealerSlug: effectiveDealerSlug,
      pagePath: currentPath,
      metadata: {
        view: activeView,
        ...options.metadata
      }
    });
  }, [activeView, effectiveDealerSlug, options.isAdmin, options.metadata]);
}

export default usePageTracking;
