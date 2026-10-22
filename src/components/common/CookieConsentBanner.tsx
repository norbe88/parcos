import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, ChevronDown, Check, X, Settings2, ExternalLink } from 'lucide-react';

export interface CookiePreferences {
  essential: boolean; // mereu true
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
  timestamp: number;
}

const PRIMARY_COOKIE_STORAGE_KEY = 'parcos_cookie_consent_v1';
const LEGACY_COOKIE_STORAGE_KEY = 'rxm_cookie_consent_v1';

interface CookieConsentBannerProps {
  onOpenPolicy: () => void;
  isOpenPreferenceTrigger?: boolean;
  onClosePreferences?: () => void;
  viewMode?: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin';
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPolicy,
  isOpenPreferenceTrigger = false,
  onClosePreferences,
  viewMode = 'saas'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  // Regula ANSPDCP: Opțiunile non-esențiale sunt dezactivate (false) în mod implicit
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  // Verifică starea consimțământului la încărcare și declanșează apariția după scroll-ul de video
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRIMARY_COOKIE_STORAGE_KEY) || localStorage.getItem(LEGACY_COOKIE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setAnalyticsAllowed(parsed.analytics ?? false);
        setMarketingAllowed(parsed.marketing ?? false);
        return; // Consimțământul a fost deja exprimat, nu mai afișăm bannerul
      }
    } catch (e) {
      console.warn('Nu s-au putut citi preferințele de cookie:', e);
    }

    // Pe paginile fără video intro (ex: showroom, terms, etc.) afișăm bannerul după o scurtă întârziere discretă
    const isSaasViewWithVideo = viewMode === 'saas';

    let hasTriggered = false;
    let ticking = false;

    const checkScrollPosition = () => {
      if (hasTriggered) return;

      const heroEl = document.getElementById('hero') || document.querySelector('[data-non-interactive-start="true"]');
      const videoIntroEl = document.getElementById('showroom-video-intro') || 
                           document.querySelector('[aria-label="ParcOS Showroom Digital Autonom"]');

      let hasPassedVideo = false;

      // 1. Verificare primară: Secțiunea de conținut non-interactiv (#hero) a intrat în viewport
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.85) {
          hasPassedVideo = true;
        }
      } 
      // 2. Verificare secundară: Containerul video intro a fost depășit la scroll (bottom < viewport)
      else if (videoIntroEl) {
        const rect = videoIntroEl.getBoundingClientRect();
        if (rect.bottom <= window.innerHeight + 80) {
          hasPassedVideo = true;
        }
      } 
      // 3. Fallback bazat pe înălțimea de derulare (dacă video-ul are 230vh)
      else if (window.scrollY > window.innerHeight * 1.1) {
        hasPassedVideo = true;
      }

      if (hasPassedVideo) {
        hasTriggered = true;
        setIsVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Dacă NU suntem pe vederea SaaS cu video intro, afișăm după un scurt timer discret
    if (!isSaasViewWithVideo) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // În vederea SaaS cu video intro: ascultăm scroll-ul utilizatorului
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Verificăm imediat (ex: refresh când pagina este deja parțial derulată)
    checkScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [viewMode]);

  // Ascultă deschiderea manuală din Footer / Pagină
  useEffect(() => {
    if (isOpenPreferenceTrigger) {
      setIsVisible(true);
      setIsPreferencesOpen(true);
    }
  }, [isOpenPreferenceTrigger]);

  const savePreferences = (prefs: { analytics: boolean; marketing: boolean }) => {
    const consentData: CookiePreferences = {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      decided: true,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(PRIMARY_COOKIE_STORAGE_KEY, JSON.stringify(consentData));
      localStorage.setItem(LEGACY_COOKIE_STORAGE_KEY, JSON.stringify(consentData));
    } catch (e) {
      console.warn('Nu s-au putut salva preferințele de cookie:', e);
    }

    setAnalyticsAllowed(prefs.analytics);
    setMarketingAllowed(prefs.marketing);
    setIsVisible(false);
    setIsPreferencesOpen(false);
    onClosePreferences?.();
  };

  const handleAcceptAll = () => {
    savePreferences({ analytics: true, marketing: true });
  };

  const handleAcceptEssentialOnly = () => {
    savePreferences({ analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    savePreferences({ analytics: analyticsAllowed, marketing: marketingAllowed });
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsPreferencesOpen(false);
    onClosePreferences?.();
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Setări consimțământ cookie-uri"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-[calc(100%-2rem)] sm:w-[460px] md:w-[480px] max-w-[calc(100vw-2rem)] no-print safe-pb animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="rounded-2xl bg-[#0e0e11]/98 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/90 text-zinc-300 overflow-hidden">
        
        {/* Bara superioară subtilă de accent luxury */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

        <div className="p-4 sm:p-5">
          {/* Header Banner cu Badge Luxury */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Cookie className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  CONFIDENȚIALITATE & COOKIE-URI
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                  Respectăm confidențialitatea datelor
                </h2>
              </div>
            </div>

            {/* Buton închidere dacă a fost deschis manual din footer */}
            {isOpenPreferenceTrigger && (
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 -mr-1 -mt-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Închide panoul de preferințe"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Text explicativ concis adaptat pentru card compact */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Utilizăm module cookie și tehnologii similare de stocare pentru funcționarea platformei ParcOS, 
            memorarea preferințelor de navigare și securitatea sesiunilor, conform GDPR (UE 2016/679).
          </p>

          {/* Panou extins de configurare preferințe (Accordion cu scroll intern) */}
          {isPreferencesOpen && (
            <div className="max-h-[45vh] overflow-y-auto pr-1 my-3 pt-3 border-t border-white/[0.08] space-y-2.5 text-left animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Personalizare Module Cookie:</span>
              </div>

              {/* 1. Cookie-uri Esențiale */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Strict Necesare (Tehnice)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ACTIV
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Esențiale pentru navigație, simulatoarele DMS, securitate și salvarea preferințelor de confidențialitate. Nu pot fi dezactivate.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <div className="w-10 h-6 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-end px-1 cursor-not-allowed opacity-80">
                    <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-sm flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Cookie-uri Analitice */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Măsurare & Performanță</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      OPȚIONAL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Analiză anonimă a vitezei de încărcare (Core Web Vitals) și stabilității platformei pentru optimizare continuă.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsAllowed}
                    onClick={() => setAnalyticsAllowed(!analyticsAllowed)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] justify-center ${
                      analyticsAllowed ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                    aria-label="Activează/dezactivează cookie-uri de analiză"
                  >
                    <span 
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        analyticsAllowed ? 'translate-x-2.5' : '-translate-x-2.5'
                      }`} 
                    />
                  </button>
                </div>
              </div>

              {/* 3. Conținut Terț & Media */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Conținut Multimedia & Video</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      OPȚIONAL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Permit optimizarea redării clipurilor video introductive 4K și integrarea hărților și instrumentelor interactive.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketingAllowed}
                    onClick={() => setMarketingAllowed(!marketingAllowed)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] justify-center ${
                      marketingAllowed ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                    aria-label="Activează/dezactivează conținut multimedia terț"
                  >
                    <span 
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        marketingAllowed ? 'translate-x-2.5' : '-translate-x-2.5'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rând de Acțiuni & Butoane Mobile-First cu Paritate Legală Strictă (ANSPDCP) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.08]">
            {isPreferencesOpen ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptEssentialOnly}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-600 text-white font-bold text-xs transition-all touch-manipulation cursor-pointer text-center shadow-md"
                >
                  Doar Necesare
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-[0.98] border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer text-center"
                >
                  Salvează Selecția
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 touch-manipulation cursor-pointer text-center"
                >
                  Acceptă Toate
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAcceptEssentialOnly}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-600 text-white font-bold text-xs transition-all touch-manipulation cursor-pointer text-center shadow-md"
                >
                  Refuză Opționalele
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 touch-manipulation cursor-pointer text-center"
                >
                  Acceptă Toate
                </button>
              </div>
            )}

            {/* Link-uri secundare discrete: Personalizează & Politică */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer touch-manipulation py-1"
              >
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPreferencesOpen ? 'Ascunde opțiuni' : 'Personalizează'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenPolicy}
                className="hover:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer touch-manipulation py-1"
              >
                <span>Politica Cookies</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
