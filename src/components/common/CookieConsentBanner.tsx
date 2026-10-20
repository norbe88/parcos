import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, ChevronDown, Check, X, Settings2, ExternalLink } from 'lucide-react';

export interface CookiePreferences {
  essential: boolean; // mereu true
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
  timestamp: number;
}

const COOKIE_STORAGE_KEY = 'rxm_cookie_consent_v1';

interface CookieConsentBannerProps {
  onOpenPolicy: () => void;
  isOpenPreferenceTrigger?: boolean;
  onClosePreferences?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPolicy,
  isOpenPreferenceTrigger = false,
  onClosePreferences
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  // Regula ANSPDCP: Opțiunile non-esențiale sunt dezactivate (false) în mod implicit
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  // Verifică starea consimțământului la încărcare
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        // Afișează bannerul cu o scurtă întârziere discretă (600ms) pentru o experiență lină
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setAnalyticsAllowed(parsed.analytics ?? false);
        setMarketingAllowed(parsed.marketing ?? false);
      }
    } catch (e) {
      console.warn('Nu s-au putut citi preferințele de cookie:', e);
      setIsVisible(true);
    }
  }, []);

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
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentData));
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
      className="fixed bottom-0 inset-x-0 z-50 p-2.5 sm:p-5 no-print safe-pb animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="max-w-4xl mx-auto rounded-2xl bg-[#0e0e11]/98 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/80 text-zinc-300 overflow-hidden">
        
        {/* Bara superioară subtilă de accent luxury */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

        <div className="p-4 sm:p-6">
          {/* Header Banner */}
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Cookie className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block sm:inline sm:mr-2">
                  CONFIDENȚIALITATE & COOKIE-URI
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Respectăm confidențialitatea datelor dumneavoastră
                </h2>
              </div>
            </div>

            {/* Buton închidere dacă a fost deschis manual din footer */}
            {isOpenPreferenceTrigger && (
              <button
                type="button"
                onClick={handleClose}
                className="p-2 -mr-1 -mt-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Închide panoul de preferințe"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Text explicativ scurt */}
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-4">
            Utilizăm module cookie și tehnologii de stocare locală pentru a vă oferi o experiență rapidă în showroom, 
            pentru a memora filtrele de mașini căutate și pentru afișarea corectă a prezentărilor video. 
            Puteți alege să acceptați toate modulele sau să vă personalizați opțiunile în detaliu conform Regulamentului GDPR (UE 2016/679).
          </p>

          {/* Panou extins de configurare preferințe (Accordion / Drawer integrat) */}
          {isPreferencesOpen && (
            <div className="mt-3 mb-4 pt-3 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Personalizare Module Cookie:</span>
              </div>

              {/* 1. Cookie-uri Esențiale */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Strict Necesare (Tehnice)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ACTIV PERMANENT
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                    Esențiale pentru navigația în siguranță, reținerea vehiculelor vizualizate, funcționarea filtrelor de catalog și salvarea preferințelor de confidențialitate. Nu pot fi dezactivate.
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
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Măsurare & Performanță</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      OPȚIONAL
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                    Ne ajută să analizăm anonim viteza de încărcare a showroom-ului (Core Web Vitals) și stabilitatea interfeței pentru a vă oferi o navigare fără întreruperi.
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
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">Conținut Multimedia & Social</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      OPȚIONAL
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                    Permit redarea securizată a videoclipurilor de prezentare a mașinilor (TikTok / YouTube) și integrarea hărților interactive de navigație Google Maps și Waze.
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

          {/* Rând de Acțiuni & Butoane Mobile-First (min-h-[44px]) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            
            {/* Link către Politica Detaliată */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenPolicy}
                className="text-xs text-zinc-400 hover:text-amber-400 underline underline-offset-4 transition-colors inline-flex items-center gap-1 min-h-[44px] py-1 cursor-pointer touch-manipulation"
              >
                <span>Consultă Politica de Cookie-uri</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              {!isPreferencesOpen && (
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(true)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1 min-h-[44px] py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer touch-manipulation sm:ml-2"
                >
                  <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personalizează</span>
                </button>
              )}
            </div>

            {/* Butoane de consimțământ cu paritate vizuală strictă (ANSPDCP) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isPreferencesOpen ? (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptEssentialOnly}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-600 text-white font-bold text-xs transition-all touch-manipulation cursor-pointer flex-1 sm:flex-initial text-center shadow-md"
                  >
                    Doar cele Necesare
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-[0.98] border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs transition-all touch-manipulation cursor-pointer flex-1 sm:flex-initial text-center"
                  >
                    Salvează Selecția
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 touch-manipulation cursor-pointer flex-1 sm:flex-initial text-center"
                  >
                    Acceptă Toate
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptEssentialOnly}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-600 text-white font-bold text-xs transition-all touch-manipulation cursor-pointer flex-1 sm:flex-initial text-center shadow-md"
                  >
                    Refuză Opționalele
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 touch-manipulation cursor-pointer flex-1 sm:flex-initial text-center"
                  >
                    Acceptă Toate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
