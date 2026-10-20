import React, { useState, useEffect, lazy, Suspense, useMemo, useRef, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SEED_DEALER, VehicleItem, VehicleExpenseItem, MarketPriceEvaluation, VehicleAuditEntry, VehicleAuditAction } from './db/seed';

// Componente Layout
import { Topbar } from './components/layout/Topbar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { FloatingBackToTop } from './components/layout/FloatingBackToTop';

// Componente Showroom
import { CinematicIntro } from './components/CinematicIntro';
import { HeroSpotlight } from './components/showroom/HeroSpotlight';
import { VehicleCatalog } from './components/showroom/VehicleCatalog';
import { WhyChooseUs } from './components/showroom/WhyChooseUs';
import { FinancingSection } from './components/showroom/FinancingSection';
import { BuyBackSection } from './components/showroom/BuyBackSection';
import { CustomOrderSection } from './components/showroom/CustomOrderSection';
import { GoogleReviewsSection } from './components/showroom/GoogleReviewsSection';

// Modale & Admin (Lazy Loaded on Demand for Ultra-Fast Initial Bundle)
const VehicleDetailModal = lazy(() => import('./components/modals/VehicleDetailModal').then(m => ({ default: m.VehicleDetailModal })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then(m => ({ default: m.AdminPortal })));
const AdminLoginGate = lazy(() => import('./components/admin/AdminLoginGate').then(m => ({ default: m.AdminLoginGate })));
const AddVehicleModal = lazy(() => import('./components/admin/AddVehicleModal').then(m => ({ default: m.AddVehicleModal })));

const PrintableVehicleSheet = lazy(() => import('./components/print/PrintableVehicleSheet').then(m => ({ default: m.PrintableVehicleSheet })));
const TermsAndConditionsPage = lazy(() => import('./components/legal/TermsAndConditionsPage').then(m => ({ default: m.TermsAndConditionsPage })));
const NationalDeliveryPage = lazy(() => import('./components/delivery/NationalDeliveryPage').then(m => ({ default: m.NationalDeliveryPage })));
const CookiePolicyPage = lazy(() => import('./components/legal/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const ParcOSSaaSPage = lazy(() => import('./components/saas/ParcOSSaaSPage').then(m => ({ default: m.ParcOSSaaSPage })));
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { extractOlxId, normalizeCarImageUrl } from './utils/helpers';
import { preloadMediaKeys } from './utils/mediaVaultDb';
import { getStandardDocumentFileName, printWithDocumentTitle } from './utils/pdfGenerator';
import { initExchangeRateScheduler } from './utils/exchangeRateSync';
import { initShowroomInteractionTracker } from './services/leadService';
import { useTenant } from './hooks/useTenant';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { vehicleRepository, RXM_INVENTORY_VERSION } from './services/vehicleRepository';
import { getTabSessionId } from './utils/broadcastSession';
import { getAdminAuthHeaders, isCurrentSessionAdmin } from './utils/adminAuth';

// 🆔 Identificator unic de sesiune per filă pentru a preveni auto-ecoul BroadcastChannel
const APP_TAB_SESSION_ID = getTabSessionId();

export default function App() {
  const { tenant } = useTenant();
  const [introKey, setIntroKey] = useState(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isForcedUrl = urlParams.get('intro') === 'true' || urlParams.get('intro') === '1' || window.location.hash === '#intro';
      if (isForcedUrl) return false;

      // În modul de dezvoltare (DEV) ignorăm cheia permanentă din localStorage pentru a permite testarea facilă la F5
      if (import.meta.env.DEV) {
        return Boolean(sessionStorage.getItem('rxm_intro_seen'));
      }

      if (sessionStorage.getItem('rxm_intro_seen') || localStorage.getItem('rxm_intro_seen')) {
        return true;
      }
    }
    return false;
  });

  const handleReplayIntro = useCallback(() => {
    try {
      sessionStorage.removeItem('rxm_intro_seen');
      localStorage.removeItem('rxm_intro_seen');
    } catch {}
    setIsRevealed(false);
    setIntroKey(prev => prev + 1);
  }, []);

  // Expunere funcție globală window.replayIntro() și ascultare parametru URL (?intro=true / #intro)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).replayIntro = handleReplayIntro;

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('intro') === 'true' || urlParams.get('intro') === '1' || window.location.hash === '#intro') {
        handleReplayIntro();
      }
    }
  }, [handleReplayIntro]);
  
  // Versiune catalog pentru invalidare automată cache browser (sincronizare automată Oferta Săptămânii + căi canonice /cars/)
  const RXM_INVENTORY_VERSION = 'v9_inventory_sold_sync_2026_10_17';

  // Helper: garantează că cel puțin o mașină are Oferta Săptămânii activă
  const ensureDealOfWeekActive = (carList: VehicleItem[]): VehicleItem[] => {
    const hasActiveDeal = carList.some(c => c.isDealOfWeek || c.isPinnedToTop || !!(c.oldPriceEur && c.oldPriceEur > c.priceEur));
    if (!hasActiveDeal && carList.length > 0) {
      const match = carList.find(c => c.oldPriceEur && c.oldPriceEur > c.priceEur) || carList[0];
      return carList.map(c => c.id === match.id ? {
        ...c,
        isDealOfWeek: true,
        dealBadgeText: c.dealBadgeText || 'Ofertă Specială',
      } : c);
    }
    return carList;
  };

  // Persistență automată și citire sincronă instant (0ms) din Unified Vehicle Repository (SWR)
  const [cars, setCars] = useState<VehicleItem[]>(() => {
    const raw = vehicleRepository.getVehicles('rxm');
    const seen = new Set<string>();
    const deduplicated = raw.filter(c => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return ensureDealOfWeekActive(deduplicated);
  });

  // ☁️ Sincronizare automată Netcup VPS (PostgreSQL) în fundal (SWR Revalidation)
  useEffect(() => {
    // Declanșează sincronizarea activă cu serverul Netcup la montare
    vehicleRepository.triggerSync('rxm');

    // Ascultă sosirea datelor actualizate din cloud și actualizează starea React
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ vehicles: VehicleItem[] }>;
      if (customEvent.detail?.vehicles && Array.isArray(customEvent.detail.vehicles)) {
        setCars(prev => {
          const seen = new Set<string>();
          const uniqueVehicles = customEvent.detail.vehicles.filter(v => {
            if (!v || !v.id || seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          if (JSON.stringify(prev) === JSON.stringify(uniqueVehicles)) return prev;
          return uniqueVehicles;
        });
      } else {
        const freshData = vehicleRepository.getVehicles('rxm');
        setCars(prev => {
          const seen = new Set<string>();
          const uniqueVehicles = freshData.filter(v => {
            if (!v || !v.id || seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
          if (JSON.stringify(prev) === JSON.stringify(uniqueVehicles)) return prev;
          return uniqueVehicles;
        });
      }
    };

    window.addEventListener('rxm:vehicles-synced', handleSync);
    return () => window.removeEventListener('rxm:vehicles-synced', handleSync);
  }, []);

  // 🔄 Sincronizare multi-tab & cross-window în timp real (Cross-Tab Live Sync)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('rxm_inventory_channel');
        channel.onmessage = (event) => {
          // 🛡️ Ignorăm mesajele difuzate de aceeași filă pentru a preveni bucla infinită de re-randare
          if (event.data?.senderId === APP_TAB_SESSION_ID) return;
          if (event.data?.type === 'INVENTORY_UPDATED' && Array.isArray(event.data?.cars)) {
            setCars(prev => {
              const seen = new Set<string>();
              const uniqueCars = event.data.cars.filter((c: VehicleItem) => {
                if (!c || !c.id || seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
              });
              if (JSON.stringify(prev) === JSON.stringify(uniqueCars)) return prev;
              return uniqueCars;
            });
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel indisponibil:', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rxm_cars_inventory' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 0) {
            setCars(prev => {
              const seen = new Set<string>();
              const uniqueCars = updated.filter((c: VehicleItem) => {
                if (!c || !c.id || seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
              });
              if (JSON.stringify(prev) === e.newValue) return prev;
              return uniqueCars;
            });
          }
        } catch (err) {
          console.warn('Eroare sincronizare cross-tab stoc mașini:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const stopExchangeScheduler = initExchangeRateScheduler();
    const stopInteractionTracker = initShowroomInteractionTracker();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      stopExchangeScheduler();
      stopInteractionTracker();
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // ⚡ Preîncărcare automată a fotografiilor binare din IndexedDB Vault
  useEffect(() => {
    const mediaKeys = cars.flatMap(c => c.images || []).filter(img => typeof img === 'string' && img.startsWith('rxm-media://'));
    if (mediaKeys.length > 0) {
      preloadMediaKeys(mediaKeys);
    }
  }, [cars]);

  // Contor ușor pentru forțarea re-randării când se rezolvă imagini IndexedDB
  const [, setMediaRefreshTick] = useState(0);

  // Ascultare eveniment rezolvare asincronă imagini IndexedDB (fără a regenera cars[] și fără re-salvare în localStorage)
  useEffect(() => {
    let timeoutId: any = null;
    const handleResolved = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMediaRefreshTick(tick => tick + 1);
      }, 120);
    };
    window.addEventListener('rxm_media_resolved', handleResolved);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('rxm_media_resolved', handleResolved);
    };
  }, []);

  // 🛡️ Protecție strictă Anti-Salvare / Anti-Furt Foto (Standard AutoLicit)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'IMG' ||
        target.querySelector('img') ||
        target.closest('img') ||
        target.closest('[data-vehicle-photo]') ||
        target.closest('.group\\/thumb') ||
        target.closest('.aspect-\\[16\\/10\\]') ||
        target.closest('.aspect-video')
      ) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('img'))) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, []);

  // 🛡️ Data Sanitization & Trade Secret Protection (Pentest Hardening):
  // În showroom-ul public mascăm seria VIN și eliminăm complet prețul de achiziție,
  // cheltuielile de service și marjele dealerului pentru a preveni spionajul industrial și scraping-ul.
  const publicCars = useMemo(() => {
    return cars.map(car => ({
      ...car,
      purchasePriceEur: undefined,
      soldPriceEur: undefined,
      soldAt: undefined,
      expenses: undefined,
      auditLog: undefined,
      internalNotes: undefined,
      vin: car.vin ? `${car.vin.substring(0, 7)}**********` : '',
      isVinPublic: false
    }));
  }, [cars]);

  // Verificare inițială dacă ruta accesată este /admin, /#admin, /portal, /#portal sau query ?admin/?portal
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.endsWith('/admin') ||
      path === '/admin' || 
      path.endsWith('/portal') ||
      path === '/portal' ||
      hash === '#admin' || 
      hash === '#portal' ||
      search.includes('admin') ||
      search.includes('portal')
    );
  };

  // Verificare inițială dacă ruta accesată este /termeni-si-conditii, /#termeni-si-conditii sau similar
  const checkIsTermsPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.includes('termeni-si-conditii') ||
      path.includes('termeni') ||
      hash.includes('termeni-si-conditii') ||
      hash.includes('termeni') ||
      search.includes('termeni')
    );
  };

  // Verificare inițială dacă ruta accesată este /livrare, /livrare-in-toata-romania, #livrare sau query ?livrare
  const checkIsDeliveryPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.includes('livrare') ||
      hash.includes('livrare') ||
      search.includes('livrare')
    );
  };

  // Verificare inițială dacă ruta accesată este /politica-de-cookies, /cookies, #cookies sau query ?cookie
  const checkIsCookiesPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.includes('politica-de-cookies') ||
      path.includes('politica-cookie') ||
      path.includes('cookies') ||
      path.includes('cookie') ||
      hash.includes('politica-de-cookies') ||
      hash.includes('politica-cookie') ||
      hash.includes('cookies') ||
      hash.includes('cookie') ||
      search.includes('cookie')
    );
  };

  // Verificare dacă ruta accesată este pagina de prezentare SaaS (parcos.ro, /saas, #saas sau ?saas)
  const checkIsSaasPath = () => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    // Pe domeniul de bază parcos.ro randăm direct pagina SaaS de prezentare
    if (
      (hostname === 'parcos.ro' || hostname === 'www.parcos.ro' || hostname === 'parcos.local') &&
      !hostname.startsWith('app.') &&
      !hostname.startsWith('admin.')
    ) {
      return true;
    }

    return (
      path.includes('saas') ||
      path.includes('parcos') ||
      hash.includes('saas') ||
      hash.includes('parcos') ||
      search.includes('saas') ||
      search.includes('mode=saas') ||
      search.includes('dealer=parcos')
    );
  };

  const getInitialViewMode = (): 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' => {
    if (checkIsSaasPath()) return 'saas';
    if (checkIsAdminPath()) return 'admin';
    if (checkIsTermsPath()) return 'terms';
    if (checkIsDeliveryPath()) return 'delivery';
    if (checkIsCookiesPath()) return 'cookies';
    return 'showroom';
  };

  const [viewMode, setViewMode] = useState<'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas'>(getInitialViewMode);
  const [isCookiePreferencesOpen, setIsCookiePreferencesOpen] = useState(false);

  // 🔐 Verificare Sesiune Administrator pe Server
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return isCurrentSessionAdmin();
  });

  // Validare activă pe server a token-ului de sesiune (dacă expiră pe server, delogăm imediat clientul)
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetch('/api/auth/verify', {
        headers: getAdminAuthHeaders()
      }).then(res => {
        if (!res.ok) {
          sessionStorage.removeItem('rxm_admin_authenticated');
          sessionStorage.removeItem('rxm_admin_session_token');
          setIsAdminAuthenticated(false);
        }
      }).catch(() => {});
    }
  }, [isAdminAuthenticated]);

  // La autentificarea administratorului, revalidăm inventarul din /api/admin/vehicles pentru a prelua datele financiare
  useEffect(() => {
    if (isAdminAuthenticated) {
      vehicleRepository.triggerSync('rxm');
    }
  }, [isAdminAuthenticated]);

  // Ascultare evenimente istoric browser (Back / Forward / HashChange)
  useEffect(() => {
    const handleUrlChange = () => {
      if (checkIsSaasPath()) {
        setViewMode('saas');
      } else if (checkIsAdminPath()) {
        setViewMode('admin');
      } else if (checkIsTermsPath()) {
        setViewMode('terms');
      } else if (checkIsDeliveryPath()) {
        setViewMode('delivery');
      } else if (checkIsCookiesPath()) {
        setViewMode('cookies');
      } else {
        setViewMode('showroom');
        if (window.location.hash === '#contact' || window.location.pathname.includes('contact')) {
          setTimeout(() => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    };

    // Verificare la încărcare dacă este cerut scroll direct la contact
    if (window.location.hash === '#contact' || window.location.pathname.includes('contact')) {
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Sincronizare URL la comutarea viewMode
  const handleSetViewMode = (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas') => {
    setViewMode(mode);
    const basePath = window.location.pathname.startsWith('/rxm') ? '/rxm' : '';
    if (mode === 'saas') {
      const target = `${basePath}/saas`;
      if (window.location.pathname !== target && window.location.hash !== '#saas') {
        window.history.pushState(null, '', target);
      }
    } else if (mode === 'admin') {
      const target = `${basePath}/admin`;
      if (window.location.pathname !== target && window.location.hash !== '#admin') {
        window.history.pushState(null, '', target);
      }
    } else if (mode === 'terms') {
      const target = `${basePath}/termeni-si-conditii`;
      if (window.location.pathname !== target && window.location.hash !== '#termeni-si-conditii') {
        window.history.pushState(null, '', target);
      }
    } else if (mode === 'delivery') {
      const target = `${basePath}/livrare-in-toata-romania`;
      if (window.location.pathname !== target && window.location.hash !== '#livrare') {
        window.history.pushState(null, '', target);
      }
    } else if (mode === 'cookies') {
      const target = `${basePath}/politica-de-cookies`;
      if (window.location.pathname !== target && window.location.hash !== '#politica-de-cookies') {
        window.history.pushState(null, '', target);
      }
    } else {
      const target = basePath ? `${basePath}/` : '/';
      if (
        window.location.pathname.includes('saas') ||
        window.location.pathname.includes('parcos') ||
        window.location.pathname.includes('admin') || 
        window.location.pathname.includes('termeni') || 
        window.location.pathname.includes('livrare') || 
        window.location.pathname.includes('cookie') || 
        window.location.hash.includes('saas') ||
        window.location.hash.includes('parcos') ||
        window.location.hash.includes('admin') || 
        window.location.hash.includes('termeni') || 
        window.location.hash.includes('livrare') || 
        window.location.hash.includes('cookie')
      ) {
        window.history.pushState(null, '', target);
      }
    }
  };

  // Scurtătură secretă tastatură pentru administrator: Ctrl + Shift + A (sau Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleSetViewMode(viewMode === 'admin' ? 'showroom' : 'admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Deconectare administrator
  const handleLogoutAdmin = () => {
    try {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAdminAuthHeaders()
      }).catch(() => {});
      sessionStorage.removeItem('rxm_admin_authenticated');
      sessionStorage.removeItem('rxm_admin_session_token');
      sessionStorage.removeItem('rxm_admin_fail_count');
      sessionStorage.removeItem('rxm_admin_lockout_until');
    } catch (e) {
      console.error(e);
    }
    setIsAdminAuthenticated(false);
    handleSetViewMode('showroom');
    showToast('🔒 V-ați deconectat cu succes din Panoul de Gestiune.');
  };

  // Stare Modal Detalii Mașină
  const [selectedCar, setSelectedCar] = useState<VehicleItem | null>(null);
  const [modalTab, setModalTab] = useState<'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines'>('specs');
  const [videoFormat, setVideoFormat] = useState<'tiktok' | 'youtube'>('tiktok');

  // Ref-uri pentru stabilitatea navigării și prevenirea buclelor
  const carsRef = useRef(cars);
  carsRef.current = cars;
  const manuallyDismissedCarIdRef = useRef<string | null>(null);
  const hasInitializedDirectLinkRef = useRef(false);

  // Helper sincron pentru curățarea parametrilor de mașină din URL
  const cleanCarFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has('car')) {
        url.searchParams.delete('car');
        changed = true;
      }
      if (url.hash.includes('car=')) {
        if (url.hash.startsWith('#car=')) {
          url.hash = '';
          changed = true;
        } else if (url.hash.includes('?')) {
          const [hBase, hQuery] = url.hash.split('?');
          const hParams = new URLSearchParams(hQuery);
          hParams.delete('car');
          const newHQuery = hParams.toString();
          url.hash = newHQuery ? `${hBase}?${newHQuery}` : hBase;
          changed = true;
        }
      }
      if (changed) {
        const cleanUrl = url.pathname + (url.search || '') + (url.hash || '');
        window.history.replaceState(null, '', cleanUrl || '/');
      }
    } catch (e) {
      console.error('Eroare curățare URL vehicul la închidere modal:', e);
    }
  }, []);

  // 🔗 Auto-deschidere detalii vehicul la accesare prin link direct / share sau popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseTargetCarIdFromUrl = (): string | null => {
      const searchParams = new URLSearchParams(window.location.search);
      let targetCarId = searchParams.get('car');
      if (!targetCarId && window.location.hash) {
        const hash = window.location.hash;
        const qIndex = hash.indexOf('?');
        if (qIndex !== -1) {
          const hashParams = new URLSearchParams(hash.substring(qIndex + 1));
          targetCarId = hashParams.get('car');
        } else if (hash.startsWith('#car=')) {
          targetCarId = hash.replace('#car=', '');
        }
      }
      return targetCarId ? targetCarId.toLowerCase() : null;
    };

    const checkDirectCarLink = (isHistoryNav: boolean = false) => {
      const targetCarId = parseTargetCarIdFromUrl();

      if (targetCarId) {
        // Dacă utilizatorul a închis manual mașina curentă și nu este o navigare explicită în istoric, nu redeschidem
        if (!isHistoryNav && manuallyDismissedCarIdRef.current && 
            (manuallyDismissedCarIdRef.current === targetCarId || manuallyDismissedCarIdRef.current === 'all')) {
          return;
        }

        const found = carsRef.current.find(c => c.id.toLowerCase() === targetCarId);
        if (found) {
          manuallyDismissedCarIdRef.current = null;
          setSelectedCar(found);
          setModalTab('specs');
        }
      } else {
        // Dacă URL-ul nu conține referință de mașină (ex: back button / popstate pe mobil), închidem modalul
        setSelectedCar(prev => (prev ? null : prev));
      }
    };

    // Verificare inițială la montare când stocul de mașini este disponibil (rulează o singură dată)
    if (!hasInitializedDirectLinkRef.current && cars.length > 0) {
      hasInitializedDirectLinkRef.current = true;
      checkDirectCarLink(false);
    }

    const handleHashChange = () => checkDirectCarLink(true);
    const handlePopState = (e: PopStateEvent) => {
      // Dacă istoricul indică faptul că nu mai suntem pe un modal de mașină, închidem garantat
      if (!e.state || e.state.modal !== 'vehicle-detail') {
        manuallyDismissedCarIdRef.current = 'all';
        setSelectedCar(null);
      } else if (e.state?.carId) {
        const found = carsRef.current.find(c => c.id.toLowerCase() === e.state.carId.toLowerCase());
        if (found) {
          manuallyDismissedCarIdRef.current = null;
          setSelectedCar(found);
        }
      }
      checkDirectCarLink(true);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [cars.length]);

  const handleCloseDetailModal = () => {
    // 1. Marcăm mașina ca închisă manual pentru a bloca orice re-declanșare asincronă
    if (selectedCar) {
      manuallyDismissedCarIdRef.current = selectedCar.id.toLowerCase();
    } else {
      manuallyDismissedCarIdRef.current = 'all';
    }

    // 2. Închidem imediat starea React
    setSelectedCar(null);

    // 3. Gestionare istoric browser: pop curat dacă s-a deschis cu pushState
    if (typeof window !== 'undefined') {
      try {
        if (window.history.state?.modal === 'vehicle-detail') {
          window.history.back();
        } else {
          cleanCarFromUrl();
        }
      } catch (e) {
        cleanCarFromUrl();
      }
    }
  };

  // 🛡️ Data Sanitization & Trade Secret Protection (Pentest Hardening):
  // În modalul public mascăm seria VIN și eliminăm prețul de achiziție și cheltuielile dealerului.
  const safeSelectedCar = useMemo(() => {
    if (!selectedCar) return null;
    if (isAdminAuthenticated && viewMode === 'admin') return selectedCar;
    return {
      ...selectedCar,
      purchasePriceEur: undefined,
      soldPriceEur: undefined,
      expenses: undefined,
      auditLog: undefined,
      internalNotes: undefined,
      redPlatesExpiresAt: undefined,
      itpExpiresAt: undefined,
      rarAppointmentDate: undefined,
      vin: selectedCar.vin ? `${selectedCar.vin.substring(0, 7)}**********` : '',
      isVinPublic: false
    };
  }, [selectedCar, isAdminAuthenticated, viewMode]);

  // Salvare automată în localStorage la orice modificare a stocului sau cheltuielilor + difuzare cross-tab
  useEffect(() => {
    try {
      localStorage.setItem('rxm_cars_inventory', JSON.stringify(cars));
      localStorage.setItem('rxm_cars_version', RXM_INVENTORY_VERSION);

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('rxm_inventory_channel');
        channel.postMessage({ type: 'INVENTORY_UPDATED', cars, senderId: APP_TAB_SESSION_ID });
        channel.close();
      }
    } catch (e) {
      console.error('Eroare salvare mașini în localStorage:', e);
      // Fallback dacă depășește cota de 5MB din cauza imaginilor editate în browser
      try {
        localStorage.removeItem('rxm_olx_snapshot_cache');
        localStorage.removeItem('rxm_market_evaluations_cache');
        localStorage.setItem('rxm_cars_inventory', JSON.stringify(cars));
        localStorage.setItem('rxm_cars_version', RXM_INVENTORY_VERSION);
      } catch (innerErr) {
        console.warn('Stocul conține imagini de dimensiune mare; datele sunt păstrate în memorie dar nu pot fi serializate complet în localStorage:', innerErr);
      }
    }
  }, [cars]);

  // Menținem mașina selectată sincronizată cu lista de mașini la modificări
  useEffect(() => {
    if (selectedCar) {
      const updated = cars.find(c => c.id === selectedCar.id);
      if (updated && updated !== selectedCar) {
        setSelectedCar(updated);
      }
    }
  }, [cars, selectedCar]);

  // Stare Modal Adăugare / Editare Mașină (Admin)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<VehicleItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers selectare mașină cu deschidere tab specific
  const handleSelectCar = (
    car: VehicleItem, 
    tab: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines' = 'specs',
    format: 'tiktok' | 'youtube' = 'tiktok'
  ) => {
    manuallyDismissedCarIdRef.current = null;
    setSelectedCar(car);
    setModalTab(tab);
    setVideoFormat(format);
    // Sincronizare istoric pe mobil / browser: permite butonului fizic "Back" să închidă modalul curat
    if (typeof window !== 'undefined') {
      try {
        const currentHash = window.location.hash || '#catalog';
        const baseHash = currentHash.split('?')[0] || '#catalog';
        const targetUrl = `${baseHash}?car=${car.id}`;
        if (!window.location.href.includes(`car=${car.id}`)) {
          window.history.pushState({ modal: 'vehicle-detail', carId: car.id }, '', targetUrl);
        }
      } catch (e) {
        // Fallback silențios dacă mediul restricționează pushState
      }
    }
  };

  // Helper generare intrări jurnal audit & mini-audit (Ticket 03)
  const createAuditEntry = (
    action: VehicleAuditAction,
    title: string,
    details: string,
    oldValue?: string | number | boolean,
    newValue?: string | number | boolean,
    author: string = 'Echipa RXM / Admin'
  ): VehicleAuditEntry => ({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    author,
    title,
    details,
    oldValue,
    newValue,
  });

  // Helper centralizat de persistență asincronă pe Netcup VPS & localStorage
  const persistVehicle = (updatedCar: VehicleItem) => {
    vehicleRepository.saveVehicle(updatedCar, 'rxm').catch(err => {
      console.warn('[App] Eroare persistență vehicul Netcup VPS:', err);
    });
  };

  // Status stoc (Admin) - Înregistrează automat data și prețul vânzării (negociat sau listare) când statusul devine 'sold'
  const handleStatusChange = (
    id: string, 
    status: 'in_stock' | 'reserved' | 'sold' | 'preparing',
    soldPriceEur?: number,
    soldAt?: string
  ) => {
    let updatedCarToPersist: VehicleItem | null = null;
    setCars(prev => prev.map(c => {
      if (c.id === id) {
        const oldStatus = c.status;
        const statusLabelMap: Record<string, string> = {
          in_stock: 'În Stoc',
          preparing: 'În Pregătire',
          reserved: 'Rezervat',
          sold: 'Vândut'
        };
        const oldLabel = statusLabelMap[oldStatus] || oldStatus;
        const newLabel = statusLabelMap[status] || status;
        
        const isSoldNow = status === 'sold';
        const soldPrice = isSoldNow ? (soldPriceEur ?? c.soldPriceEur ?? c.priceEur) : undefined;
        const soldDate = isSoldNow ? (soldAt ?? c.soldAt ?? new Date().toISOString()) : undefined;

        let details = `Statusul autovehiculului a fost actualizat din "${oldLabel}" în "${newLabel}".`;
        if (isSoldNow && soldPrice !== undefined) {
          const diff = c.priceEur - soldPrice;
          const discountText = diff > 0 
            ? ` (discount negociat: -${diff.toLocaleString('ro-RO')} € față de ${c.priceEur.toLocaleString('ro-RO')} € listare)`
            : diff < 0 
              ? ` (ajustare: +${Math.abs(diff).toLocaleString('ro-RO')} €)`
              : ' (la prețul integral de listare)';
          details = `Autovehiculul a fost marcat ca vândut la ${soldPrice.toLocaleString('ro-RO')} €${discountText} și mutat în arhivă.`;
        }

        const auditEntry = createAuditEntry(
          'status_changed',
          isSoldNow ? `Vândut la ${soldPrice?.toLocaleString('ro-RO')} €` : `Status: ${oldLabel} → ${newLabel}`,
          details,
          oldLabel,
          newLabel
        );

        const updated: VehicleItem = {
          ...c,
          status,
          soldAt: soldDate,
          soldPriceEur: soldPrice,
          auditLog: [auditEntry, ...(c.auditLog || [])]
        };
        updatedCarToPersist = updated;
        return updated;
      }
      return c;
    }));

    if (updatedCarToPersist) {
      persistVehicle(updatedCarToPersist);
    }

    const statusLabel = status === 'in_stock' 
      ? 'În Stoc 🟢' 
      : status === 'preparing'
        ? 'În Pregătire 🟡'
        : status === 'reserved' 
          ? 'Rezervat 🟠' 
          : 'Vândut 🔴';
    showToast(`Statusul mașinii a fost actualizat la: ${statusLabel}`);
  };

  // Ștergere mașină (Admin) - Eliminare din stoc și din baza de date Netcup VPS
  const handleDeleteCar = (id: string) => {
    setCars(prev => prev.filter(c => c.id !== id));
    vehicleRepository.deleteVehicle(id, 'rxm').catch(err => {
      console.warn('[App] Eroare la ștergerea vehiculului de pe Netcup VPS:', err);
    });
    showToast('Vehiculul a fost eliminat din stoc și din baza de date.');
  };

  // Adăugare mașină nouă din Wizard (Admin)
  const handleAddCar = (newCar: VehicleItem) => {
    const entry = createAuditEntry(
      'created',
      'Vehicul adăugat în portal',
      `Autovehiculul ${newCar.brand} ${newCar.model} a fost înregistrat în parcul RXM.`
    );
    const carWithAudit: VehicleItem = {
      ...newCar,
      auditLog: [entry, ...(newCar.auditLog || [])]
    };
    setCars(prev => {
      // 🛡️ Deduplicare strictă: dacă vehiculul există deja (salvat prin sync sau repository), îl actualizăm pe poziție
      const existingIdx = prev.findIndex(c => c.id === carWithAudit.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = carWithAudit;
        return updated;
      }
      return [carWithAudit, ...prev];
    });
  };

  // Actualizare completă mașină existentă (Admin)
  const handleUpdateCar = (updatedCar: VehicleItem) => {
    setCars(prev => {
      const existingIdx = prev.findIndex(c => c.id === updatedCar.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updatedCar;
        return next;
      }
      return [updatedCar, ...prev];
    });
    persistVehicle(updatedCar);
  };

  // Fixare / Anulare Hero Spotlight (Admin RXM-TIK-01 / TIK-DEAL-02)
  const handleTogglePinHero = (id: string) => {
    setCars(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;
      const isNowPinned = !target.isHeroPinned;
      const updated = prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            isHeroPinned: isNowPinned,
            heroOrder: isNowPinned ? 1 : undefined
          };
        }
        // Dacă mașina țintă devine nou-pinuită (heroOrder: 1), celelalte mașini deja pin-uite sunt shiftate cu +1
        if (isNowPinned && c.isHeroPinned) {
          return {
            ...c,
            heroOrder: (c.heroOrder || 1) + 1
          };
        }
        return c;
      });
      showToast(isNowPinned 
        ? `⭐ ${target.brand} ${target.model} fixat ca primul clip în Hero TikTok Reel!` 
        : `${target.brand} ${target.model} eliminat din Hero TikTok Reel.`
      );
      return updated;
    });
  };

  // Setare / Anulare Ofertă a Săptămânii (Suport până la 3 oferte simultan)
  const handleSetDealOfWeek = (id: string, isDeal: boolean) => {
    setCars(prev => {
      const activeDealsExceptCurrent = prev.filter(c => c.isDealOfWeek && c.id !== id).length;
      if (isDeal && activeDealsExceptCurrent >= 3) {
        showToast('⚠️ Limita de 3 Oferte ale Săptămânii a fost atinsă. Dezactivați o ofertă existentă.');
        return prev;
      }
      return prev.map(c => {
        if (c.id === id) {
          const audit = createAuditEntry(
            'deal_updated',
            isDeal ? '🔥 Activată Ofertă a Săptămânii' : 'Dezactivată Ofertă a Săptămânii',
            isDeal ? 'Vehiculul a fost promovat ca Ofertă a Săptămânii.' : 'Vehiculul a fost retras din Ofertele Săptămânii.',
            c.isDealOfWeek ? 'Activ' : 'Inactiv',
            isDeal ? 'Activ' : 'Inactiv'
          );
          return { 
            ...c, 
            isDealOfWeek: isDeal, 
            isPinnedToTop: isDeal ? true : c.isPinnedToTop,
            auditLog: [audit, ...(c.auditLog || [])]
          };
        }
        return c;
      });
    });
    const target = cars.find(c => c.id === id);
    if (target) {
      showToast(isDeal
        ? `🔥 ${target.brand} ${target.model} setată ca Ofertă a Săptămânii!`
        : `${target.brand} ${target.model} eliminată din Oferta Săptămânii.`
      );
    }
  };

  // Setare completă Ofertă a Săptămânii cu Preț Nou, Preț Vechi și Badge (Suport până la 3 oferte simultan)
  const handleUpdateDealPricing = (
    carId: string, 
    data: { isDealOfWeek: boolean; priceEur: number; oldPriceEur?: number; dealBadgeText?: string }
  ) => {
    let updatedCarToPersist: VehicleItem | null = null;
    setCars(prev => {
      const activeDealsExceptCurrent = prev.filter(c => c.isDealOfWeek && c.id !== carId).length;
      if (data.isDealOfWeek && activeDealsExceptCurrent >= 3) {
        showToast('⚠️ Limita de 3 Oferte ale Săptămânii a fost atinsă! Dezactivați una din ofertele existente.');
        return prev;
      }

      return prev.map(c => {
        if (c.id === carId) {
          const priceDiff = data.priceEur - c.priceEur;
          const priceChanged = priceDiff !== 0;
          const auditTitle = priceChanged
            ? `Preț: ${c.priceEur.toLocaleString('ro-RO')} € → ${data.priceEur.toLocaleString('ro-RO')} € (${priceDiff > 0 ? '+' : ''}${priceDiff.toLocaleString('ro-RO')} €)`
            : 'Actualizare ofertă promoțională';
          const audit = createAuditEntry(
            priceChanged ? 'price_updated' : 'deal_updated',
            auditTitle,
            `Preț listă: ${data.priceEur} € (anterior ${c.priceEur} €). Ofertă a Săptămânii: ${data.isDealOfWeek ? 'DA' : 'NU'}.`,
            c.priceEur,
            data.priceEur
          );

          const updated: VehicleItem = {
            ...c,
            isDealOfWeek: data.isDealOfWeek,
            isPinnedToTop: data.isDealOfWeek ? true : c.isPinnedToTop,
            priceEur: data.priceEur,
            oldPriceEur: data.isDealOfWeek ? data.oldPriceEur : undefined,
            dealBadgeText: data.isDealOfWeek ? (data.dealBadgeText || 'OFERTA SĂPTĂMÂNII') : undefined,
            auditLog: [audit, ...(c.auditLog || [])]
          };
          updatedCarToPersist = updated;
          return updated;
        }
        return c;
      });
    });

    if (updatedCarToPersist) {
      persistVehicle(updatedCarToPersist);
    }

    const target = cars.find(c => c.id === carId);
    if (target) {
      if (data.isDealOfWeek) {
        showToast(`🔥 ${target.brand} ${target.model} actualizată în Ofertele Săptămânii (${data.priceEur.toLocaleString('ro-RO')} €)!`);
      } else {
        showToast(`✓ ${target.brand} ${target.model} actualizată.`);
      }
    }
  };

  // Modificare Preț Vânzare Listă (Admin) cu persistență pe Netcup VPS & TVA 21%
  const handleUpdatePrice = (
    carId: string, 
    newPriceEur: number, 
    oldPriceEur?: number, 
    auditNote?: string
  ) => {
    let updatedCarToPersist: VehicleItem | null = null;
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const priceDiff = newPriceEur - c.priceEur;
        const diffSign = priceDiff > 0 ? '+' : '';
        const diffText = priceDiff !== 0 ? ` (${diffSign}${priceDiff.toLocaleString('ro-RO')} €)` : '';
        const audit = createAuditEntry(
          'price_updated',
          `Preț actualizat: ${newPriceEur.toLocaleString('ro-RO')} €${diffText}`,
          auditNote 
            ? `${auditNote} (Preț anterior: ${c.priceEur.toLocaleString('ro-RO')} €)` 
            : `Preț de listare modificat de la ${c.priceEur.toLocaleString('ro-RO')} € la ${newPriceEur.toLocaleString('ro-RO')} €.`,
          c.priceEur,
          newPriceEur
        );

        const updated: VehicleItem = {
          ...c,
          priceEur: newPriceEur,
          oldPriceEur: oldPriceEur !== undefined ? oldPriceEur : c.oldPriceEur,
          auditLog: [audit, ...(c.auditLog || [])]
        };
        updatedCarToPersist = updated;
        return updated;
      }
      return c;
    }));

    if (updatedCarToPersist) {
      persistVehicle(updatedCarToPersist);
    }
    const target = cars.find(c => c.id === carId);
    const brandModel = target ? `${target.brand} ${target.model}` : 'Vehicul';
    showToast(`✓ Prețul pentru ${brandModel} a fost actualizat la ${newPriceEur.toLocaleString('ro-RO')} €!`);
  };

  // Modificare Descriere Editorială (Admin) cu persistență pe Netcup VPS
  const handleUpdateDescription = (carId: string, description: string) => {
    let updatedCarToPersist: VehicleItem | null = null;
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const audit = createAuditEntry(
          'specs_updated',
          'Descriere vehicul actualizată',
          'Descrierea editorială a autovehiculului a fost modificată din panoul administrativ.'
        );

        const updated: VehicleItem = {
          ...c,
          description: description.trim(),
          auditLog: [audit, ...(c.auditLog || [])]
        };
        updatedCarToPersist = updated;
        return updated;
      }
      return c;
    }));

    if (updatedCarToPersist) {
      persistVehicle(updatedCarToPersist);
    }
    const target = cars.find(c => c.id === carId);
    const brandModel = target ? `${target.brand} ${target.model}` : 'Vehicul';
    showToast(`✓ Descrierea pentru ${brandModel} a fost salvată pe server!`);
  };

  // Setare / Ștergere preț vechi (oldPriceEur) (TIK-DEAL-05)
  const handleSetOldPrice = (id: string, oldPriceEur: number | undefined) => {
    setCars(prev => prev.map(c => c.id === id ? { ...c, oldPriceEur } : c));
  };

  // Reordonare mașini fixate în Hero (Admin RXM-TIK-01)
  const handleMovePinnedOrder = (id: string, direction: 'up' | 'down') => {
    setCars(prev => {
      const pinned = prev.filter(c => c.isHeroPinned).sort((a, b) => (a.heroOrder || 999) - (b.heroOrder || 999));
      const idx = pinned.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= pinned.length) return prev;

      const swapId = pinned[targetIdx].id;
      const currentOrder = pinned[idx].heroOrder || (idx + 1);
      const targetOrder = pinned[targetIdx].heroOrder || (targetIdx + 1);

      return prev.map(c => {
        if (c.id === id) return { ...c, heroOrder: targetOrder };
        if (c.id === swapId) return { ...c, heroOrder: currentOrder };
        return c;
      });
    });
  };

  // Actualizare link și views TikTok (Admin RXM-TIK-01)
  const handleUpdateTikTokInfo = (id: string, tiktokUrl: string, tiktokViews?: string) => {
    setCars(prev => prev.map(c => c.id === id ? { ...c, tiktokUrl: tiktokUrl.trim() || undefined, tiktokViews: tiktokViews?.trim() || undefined } : c));
  };

  // Reconciliere automată mașini dispărute de pe OLX (Admin OLX S9 Sync)
  const handleBulkReconcileOlx = (carIdsToSell: string[]) => {
    setCars(prev => prev.map(c => carIdsToSell.includes(c.id) ? { ...c, status: 'sold' as const } : c));
  };

  // Actualizare link OLX (Admin OLX S9 Sync)
  const handleUpdateOlxLink = (id: string, olxUrl: string) => {
    const trimmed = olxUrl.trim();
    setCars(prev => prev.map(c => c.id === id ? { 
      ...c, 
      olxUrl: trimmed,
      olxId: extractOlxId(trimmed) || c.olxId,
      olxStatus: trimmed ? ('active' as const) : ('unlinked' as const),
      lastOlxSyncAt: new Date().toISOString()
    } : c));
    showToast('🔗 Link-ul OLX a fost actualizat cu succes!');
  };

  // 💰 Gestiune Cheltuieli & Calcul Profit per Mașină (RXM-TIK-01)
  const handleAddExpense = (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => {
    const newExpense: VehicleExpenseItem = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    };
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const existingExpenses = c.expenses || [];
        const audit = createAuditEntry(
          'expenses_added',
          `Cheltuială adăugată: ${expense.title} (${expense.amountEur} €)`,
          `Înregistrată cheltuială în categoria "${expense.category}": ${expense.title} în cuantum de ${expense.amountEur} €.`,
          undefined,
          expense.amountEur
        );
        return {
          ...c,
          expenses: [newExpense, ...existingExpenses],
          auditLog: [audit, ...(c.auditLog || [])]
        };
      }
      return c;
    }));
    showToast(`Cheltuială adăugată: ${expense.title} (${expense.amountEur} €)`);
  };

  const handleDeleteExpense = (carId: string, expenseId: string) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          expenses: (c.expenses || []).filter(e => e.id !== expenseId)
        };
      }
      return c;
    }));
    showToast('Cheltuiala a fost eliminată din registru.');
  };

  const handleUpdatePurchasePrice = (carId: string, purchasePriceEur: number) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, purchasePriceEur } : c));
    showToast(`Prețul de achiziție a fost setat la: ${purchasePriceEur.toLocaleString('ro-RO')} €`);
  };

  const handleUpdateSaleInfo = (carId: string, soldPriceEur: number, soldAt?: string) => {
    setCars(prev => prev.map(c => c.id === carId ? {
      ...c,
      soldPriceEur,
      soldAt: soldAt || c.soldAt || new Date().toISOString()
    } : c));
    showToast(`Datele de vânzare au fost actualizate (${soldPriceEur.toLocaleString('ro-RO')} €).`);
  };

  // 📊 Comparator & Analizator Preț Piață Nod S9+ (RXM-TIK-02)
  const handleSaveMarketEvaluation = (carId: string, evaluation: MarketPriceEvaluation) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, marketEvaluation: evaluation } : c));
    showToast(`Raportul de comparare preț pentru ${evaluation.criteria.brand} ${evaluation.criteria.model} a fost salvat!`);
  };

  // 🎨 Salvare imagini branduite cu logo dealer (Auto-Branding Studio)
  const handleSaveBrandedImages = (carId: string, updatedImages: string[], originalImages?: string[]) => {
    let updatedCarToPersist: VehicleItem | null = null;
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        updatedCarToPersist = {
          ...c,
          images: updatedImages,
          ...(originalImages ? { originalImages } : {})
        };
        return updatedCarToPersist;
      }
      return c;
    }));
    if (updatedCarToPersist) {
      persistVehicle(updatedCarToPersist);
    }
  };

  // 🚦 Actualizare termen numere roșii (Fleet Deadlines)
  const handleUpdatePlateExpiry = (carId: string, newDate: string) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, hasRedPlates: true, redPlatesExpiresAt: newDate } : c));
  };

  // 🚦 Actualizare termene administrative flotă (Fleet Deadlines)
  const handleUpdateVehicleDeadlines = (
    carId: string, 
    deadlines: {
      hasRedPlates?: boolean;
      redPlatesExpiresAt?: string;
      itpExpiresAt?: string;
      rarAppointmentDate?: string;
    }
  ) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, ...deadlines } : c));
  };

  // 💼 Comutare Regim Fiscal: TVA Deductibil (21%) vs Regim Marjă (Admin)
  const handleToggleVatDeductible = (id: string) => {
    setCars(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;
      const isNowDeductible = !target.vatDeductible;
      showToast(isNowDeductible 
        ? `💼 TVA Deductibil (21%) activat pentru ${target.brand} ${target.model} — bannerul B2B este acum vizibil în showroom!` 
        : `📋 ${target.brand} ${target.model} setat în Regim Special Marjă (Preț Final).`
      );
      return prev.map(c => {
        if (c.id === id) {
          const audit = createAuditEntry(
            'vat_toggled',
            isNowDeductible ? 'TVA Deductibil (21%): Activ' : 'Regim Special Marjă: Activ',
            isNowDeductible 
              ? 'Regim fiscal comutat pe TVA deductibil 21% (B2B).'
              : 'Regim fiscal comutat pe marjă dealer (preț final).',
            c.vatDeductible ? 'TVA 21%' : 'Marjă',
            isNowDeductible ? 'TVA 21%' : 'Marjă'
          );
          return {
            ...c,
            vatDeductible: isNowDeductible,
            auditLog: [audit, ...(c.auditLog || [])]
          };
        }
        return c;
      });
    });
  };

  // 📝 Actualizare Note Administrative Interne Operator (Ticket 04)
  const handleUpdateInternalNotes = (carId: string, notes: string) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const audit = createAuditEntry(
          'note_added',
          'Notă internă operator actualizată',
          notes 
            ? `Actualizare notă confidențială: "${notes.slice(0, 80)}${notes.length > 80 ? '...' : ''}"` 
            : 'Nota internă a fost ștearsă.'
        );
        return {
          ...c,
          internalNotes: notes,
          auditLog: [audit, ...(c.auditLog || [])]
        };
      }
      return c;
    }));
    showToast('📝 Nota internă a fost salvată.');
  };

  // ⚡ Sindicare Pod AutoLicit.ro (Abonament Showroom sau Licitație Live No-Reserve)
  const handleUpdateAutolicitSync = (carId: string, syncData?: NonNullable<VehicleItem['autolicitSync']>) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const audit = createAuditEntry(
          'status_changed',
          syncData?.isSynced 
            ? `AutoLicit: Sindicat (${syncData.mode === 'auction' ? `Licitație ${syncData.startingBidEur?.toLocaleString('ro-RO')} €` : 'Anunț Direct'})`
            : 'AutoLicit: Retras de pe platformă',
          syncData?.isSynced 
            ? `Vehiculul a fost publicat pe AutoLicit.ro în regim ${syncData.mode === 'auction' ? 'Licitație No Reserve 7 zile' : 'Anunț Direct Showroom (Abonament)'}.`
            : 'Vehiculul a fost delistat de pe AutoLicit.ro.'
        );
        return {
          ...c,
          autolicitSync: syncData,
          auditLog: [audit, ...(c.auditLog || [])]
        };
      }
      return c;
    }));
  };

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 🎬 Cinematic Intro cu Deschidere Cortină (Split Shutter) */}
      <CinematicIntro 
        key={introKey} 
        forceReplay={introKey > 0} 
        onSplit={() => setIsRevealed(true)}
        onComplete={() => setIsRevealed(true)}
      />

      {/* 🔔 Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-4 sm:right-6 max-w-[calc(100vw-2rem)] sm:max-w-md z-50 bg-[#18181b]/95 backdrop-blur-md border border-amber-500/40 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in slide-in-from-bottom-5 no-print pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 📌 TOPBAR: Date Reale Showroom (Cluj-Napoca) */}
      {viewMode !== 'saas' && (
        <Topbar 
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          dealer={tenant}
          isRevealed={isRevealed}
        />
      )}

      {/* 🧭 NAVBAR: Logo Oficial + Meniu */}
      {viewMode !== 'saas' && (
        <Navbar 
          totalCarsCount={cars.length}
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
          dealer={tenant}
          isRevealed={isRevealed}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 VEDEREA 0: PAGINA DE PREZENTARE B2B SAAS (PARCOS.RO / RUTA /saas)      */}
      {/* ========================================================================= */}
      {viewMode === 'saas' && (
        <Suspense fallback={
          <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold animate-pulse">P</div>
            <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">Se încarcă ParcOS Platform...</p>
          </div>
        }>
          <ParcOSSaaSPage 
            onSwitchToDealer={(slug) => {
              if (slug && typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('dealer', slug);
                url.searchParams.delete('mode');
                url.searchParams.delete('saas');
                window.history.pushState(null, '', url.toString());
                window.dispatchEvent(new Event('popstate'));
              }
              handleSetViewMode('showroom');
            }}
            onOpenSuperAdmin={() => handleSetViewMode('admin')}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 🔐 VEDEREA 1: PORTAL DE ADMINISTRARE SECURIZAT (RUTA /admin) */}
      {/* ========================================================================= */}
      {viewMode === 'admin' && (
        <Suspense fallback={
          <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">Se încarcă consola de gestiune RXM...</p>
          </div>
        }>
          {!isAdminAuthenticated ? (
            <AdminLoginGate 
              onAuthenticated={() => {
                setIsAdminAuthenticated(true);
                showToast('🔓 Autentificare reușită! Bine ați venit în panoul de gestiune.');
              }}
              onCancel={() => handleSetViewMode('showroom')}
            />
          ) : (
            <>
              <AdminPortal 
                cars={cars}
                onStatusChange={handleStatusChange}
                onDeleteCar={handleDeleteCar}
                onSelectCar={(car, tab) => handleSelectCar(car, tab || 'specs')}
                onOpenAddModal={() => {
                  setEditingCar(null);
                  setIsAddModalOpen(true);
                }}
                onEditCar={(car) => {
                  setEditingCar(car);
                  setIsAddModalOpen(true);
                }}
                onBackToShowroom={() => handleSetViewMode('showroom')}
                onLogout={handleLogoutAdmin}
                showToast={showToast}
                dealer={tenant}
                onTogglePinHero={handleTogglePinHero}
                onMovePinnedOrder={handleMovePinnedOrder}
                onUpdateTikTokInfo={handleUpdateTikTokInfo}
                onBulkReconcile={handleBulkReconcileOlx}
                onUpdateOlxLink={handleUpdateOlxLink}
                onSaveMarketEvaluation={handleSaveMarketEvaluation}
                onSaveBrandedImages={handleSaveBrandedImages}
                onUpdatePlateExpiry={handleUpdatePlateExpiry}
                onUpdateVehicleDeadlines={handleUpdateVehicleDeadlines}
                onSetDealOfWeek={handleSetDealOfWeek}
                onSetOldPrice={handleSetOldPrice}
                onUpdateDealPricing={handleUpdateDealPricing}
                onToggleVatDeductible={handleToggleVatDeductible}
                onUpdateInternalNotes={handleUpdateInternalNotes}
                onUpdateAutolicitSync={handleUpdateAutolicitSync}
                onUpdatePrice={handleUpdatePrice}
              />

              {/* 🚗 Modal Extins Adăugare / Editare Mașină (CIV OCR) */}
              <AddVehicleModal 
                isOpen={isAddModalOpen}
                onClose={() => {
                  setIsAddModalOpen(false);
                  setEditingCar(null);
                }}
                onAddCar={handleAddCar}
                editCar={editingCar}
                onUpdateCar={handleUpdateCar}
                showToast={showToast}
              />
            </>
          )}
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 🚗 VEDEREA 2: SHOWROOM PUBLIC (DYNAMIC SECTION REGISTRY & ORDERING) */}
      {/* ========================================================================= */}
      {viewMode === 'showroom' && (
        <main className="no-print">
          {(() => {
            const defaultOrder = [
              'HERO_SPOTLIGHT',
              'VEHICLE_CATALOG',
              'FINANCING',
              'BUY_BACK',
              'GOOGLE_REVIEWS',
              'WHY_CHOOSE_US',
              'CUSTOM_ORDER',
            ];
            const activeOrder = (tenant.config as any)?.layout?.sectionsOrder || defaultOrder;
            
            const registry: Record<string, React.ReactNode> = {
              HERO_SPOTLIGHT: (
                <HeroSpotlight 
                  key="HERO_SPOTLIGHT"
                  cars={publicCars}
                  onSelectCar={(car) => handleSelectCar(car, 'specs')}
                  dealer={tenant}
                  isRevealed={isRevealed}
                />
              ),
              VEHICLE_CATALOG: (
                <VehicleCatalog 
                  key="VEHICLE_CATALOG"
                  cars={publicCars}
                  onSelectCar={handleSelectCar}
                  dealer={tenant}
                />
              ),
              FINANCING: (
                <FinancingSection 
                  key="FINANCING"
                  cars={publicCars}
                  dealer={tenant}
                />
              ),
              BUY_BACK: (
                <BuyBackSection 
                  key="BUY_BACK"
                  cars={publicCars}
                  dealer={tenant}
                  showToast={showToast}
                />
              ),
              GOOGLE_REVIEWS: (
                <GoogleReviewsSection key="GOOGLE_REVIEWS" />
              ),
              WHY_CHOOSE_US: (
                <WhyChooseUs key="WHY_CHOOSE_US" />
              ),
              CUSTOM_ORDER: (
                <CustomOrderSection 
                  key="CUSTOM_ORDER"
                  dealer={tenant}
                  showToast={showToast}
                />
              ),
            };

            return activeOrder.map((sectionKey: string) => registry[sectionKey] || null);
          })()}
        </main>
      )}

      {/* ========================================================================= */}
      {/* 📄 VEDEREA 3: TERMENI ȘI CONDIȚII & CONFIDENȚIALITATE GDPR (PAGINĂ SEPARATĂ) */}
      {/* ========================================================================= */}
      {viewMode === 'terms' && (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">Se încarcă...</div>}>
          <TermsAndConditionsPage 
            dealer={tenant}
            onBackToShowroom={() => handleSetViewMode('showroom')}
            onOpenCookies={() => handleSetViewMode('cookies')}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 🚚 VEDEREA 4: LIVRARE ÎN TOATĂ ROMÂNIA (PAGINĂ SEPARATĂ)                  */}
      {/* ========================================================================= */}
      {viewMode === 'delivery' && (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">Se încarcă...</div>}>
          <NationalDeliveryPage 
            dealer={tenant}
            cars={publicCars}
            onBackToShowroom={() => handleSetViewMode('showroom')}
            onSelectCar={(car) => handleSelectCar(car, 'specs')}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 🍪 VEDEREA 5: POLITICA DE COOKIE-URI (PAGINĂ SEPARATĂ)                    */}
      {/* ========================================================================= */}
      {viewMode === 'cookies' && (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">Se încarcă...</div>}>
          <CookiePolicyPage 
            dealer={tenant}
            onBackToShowroom={() => handleSetViewMode('showroom')}
            onOpenPreferences={() => setIsCookiePreferencesOpen(true)}
            onOpenTerms={() => handleSetViewMode('terms')}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL DETALII MAȘINĂ (FOTO, RATE, TIKTOK EMBED & TEST DRIVE) */}
      {/* ========================================================================= */}
      <Suspense fallback={null}>
        {safeSelectedCar && (
          <VehicleDetailModal 
            selectedCar={safeSelectedCar}
            initialTab={modalTab}
            initialVideoFormat={videoFormat}
            onClose={handleCloseDetailModal}
            onPrint={() => {
              if (safeSelectedCar) {
                const fn = getStandardDocumentFileName({
                  docType: 'vehicle_sheet',
                  brand: safeSelectedCar.brand,
                  model: safeSelectedCar.model,
                  stockNumber: safeSelectedCar.stockNumber,
                  vin: safeSelectedCar.vin
                });
                printWithDocumentTitle(fn);
                showToast(`Pregătit pentru print / Salvare: "${fn}.pdf"`);
              } else {
                window.print();
              }
            }}
            showToast={showToast}
            dealer={tenant}
            viewMode={viewMode === 'admin' ? 'admin' : 'showroom'}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdatePurchasePrice={handleUpdatePurchasePrice}
            onUpdateSaleInfo={handleUpdateSaleInfo}
            onUpdateVehicleDeadlines={handleUpdateVehicleDeadlines}
            onToggleVatDeductible={handleToggleVatDeductible}
            onUpdateDescription={handleUpdateDescription}
            onEditCar={(car) => {
              handleCloseDetailModal();
              setEditingCar(car);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </Suspense>

      {/* ========================================================================= */}
      {/* 🖨️ FIȘĂ AUTO OFICIALĂ PENTRU TIPĂRIRE / SALVARE PDF (@media print)       */}
      {/* ========================================================================= */}
      <Suspense fallback={null}>
        <PrintableVehicleSheet 
          selectedCar={selectedCar}
          dealer={tenant}
        />
      </Suspense>

      {/* 📌 FOOTER: Legal & Contact */}
      {viewMode !== 'saas' && (
        <Footer 
          dealer={tenant} 
          onOpenAdmin={() => handleSetViewMode('admin')}
          onOpenTerms={() => handleSetViewMode('terms')}
          onOpenDelivery={() => handleSetViewMode('delivery')}
          onOpenCookies={() => handleSetViewMode('cookies')}
          onOpenCookiePreferences={() => setIsCookiePreferencesOpen(true)}
          onReplayIntro={handleReplayIntro}
        />
      )}

      {/* 🔝 BUTON PLUTITOR REVENIRE SUS (EXCLUSIV ÎN VEDERILE PUBLICE PENTRU SCROLL ADÂNC) */}
      {viewMode !== 'saas' && viewMode !== 'admin' && <FloatingBackToTop />}

      {/* 💬 BUTON PLUTITOR WHATSAPP (EXCLUSIV ÎN VEDERILE PUBLICE PENTRU CLIENȚI) */}
      {viewMode !== 'saas' && viewMode !== 'admin' && (
        <FloatingWhatsApp whatsappNumber={tenant.whatsappNumber} />
      )}

      {/* 🍪 BANNER INTERACTIV CONSIMȚĂMÂNT COOKIE-URI (POP-UP ACCEPTARE & PREFERINȚE) */}
      <CookieConsentBanner 
        onOpenPolicy={() => handleSetViewMode('cookies')}
        isOpenPreferenceTrigger={isCookiePreferencesOpen}
        onClosePreferences={() => setIsCookiePreferencesOpen(false)}
      />

      </div>
    </WorkspaceProvider>
  );
}
