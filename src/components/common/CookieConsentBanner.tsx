import React, { useState, useEffect } from 'react';
import { Cookie, Check, X, Settings2, ExternalLink } from 'lucide-react';

export interface CookiePreferences {
  essential: boolean;
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
  viewMode?: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin' | 'ghid-auto';
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPolicy,
  isOpenPreferenceTrigger = false,
  onClosePreferences,
  viewMode = 'showroom'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRIMARY_COOKIE_STORAGE_KEY) || localStorage.getItem(LEGACY_COOKIE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setAnalyticsAllowed(parsed.analytics ?? false);
        setMarketingAllowed(parsed.marketing ?? false);
        return;
      }
    } catch (e) {
      console.warn('Nu s-au putut citi preferințele de cookie:', e);
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [viewMode]);

  useEffect(() => {
    if (isOpenPreferenceTrigger) {
      setIsVisible(true);
      setIsPreferencesOpen(true);
    }
  }, [isOpenPreferenceTrigger]);

  const saveConsent = (analytics: boolean, marketing: boolean) => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics,
      marketing,
      decided: true,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(PRIMARY_COOKIE_STORAGE_KEY, JSON.stringify(preferences));
      localStorage.setItem(LEGACY_COOKIE_STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Nu s-au putut salva preferințele:', e);
    }
    setIsVisible(false);
    setIsPreferencesOpen(false);
    onClosePreferences?.();
  };

  const handleAcceptAll = () => saveConsent(true, true);
  const handleAcceptEssentialOnly = () => saveConsent(false, false);
  const handleSaveCustom = () => saveConsent(analyticsAllowed, marketingAllowed);

  const handleClose = () => {
    setIsVisible(false);
    setIsPreferencesOpen(false);
    onClosePreferences?.();
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Consimțământ Cookie-uri și Confidențialitate"
      role="region"
      className="fixed bottom-0 sm:bottom-6 sm:left-6 z-50 w-full sm:max-w-[420px] max-h-[40vh] sm:max-h-none overflow-y-auto no-print animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-[var(--surface,#131A24)] text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.12))] sm:rounded-[var(--r-md,14px)] rounded-t-[var(--r-md,14px)] shadow-[var(--shadow-card)] p-4 sm:p-5">
        {/* Header Compact */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] flex items-center justify-center text-[var(--accent-text,#F04D4D)] shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-montserrat uppercase tracking-wider text-[var(--accent-text,#F04D4D)] font-bold block">
                Confidențialitate & Cookie-uri
              </span>
              <h2 className="text-[14px] font-montserrat font-bold text-[var(--text,#F4F6F9)] leading-tight">
                Controlul tău asupra datelor
              </h2>
            </div>
          </div>

          {isOpenPreferenceTrigger && (
            <button
              type="button"
              onClick={handleClose}
              className="text-[var(--text-muted,#A3ABB6)] hover:text-white p-1 cursor-pointer"
              aria-label="Închide"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Text explicativ */}
        <p className="text-[12px] font-open-sans text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-3">
          Folosim cookie-uri necesare bunei funcționări a showroom-ului și a securității sesiunii. Opțional, poți activa cookie-urile de analiză.
        </p>

        {/* Panou Preferințe */}
        {isPreferencesOpen && (
          <div className="py-2 mb-3 border-y border-[var(--line,rgba(255,255,255,0.08))] space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[var(--text,#F4F6F9)]">Strict Necesare</span>
                <p className="text-[11px] text-[var(--text-muted,#A3ABB6)]">Esențiale pentru navigație și rate.</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                ACTIV
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold text-[var(--text,#F4F6F9)]">Măsurare & Performanță</span>
                <p className="text-[11px] text-[var(--text-muted,#A3ABB6)]">Statistici anonime de încărcare.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsAllowed}
                onClick={() => setAnalyticsAllowed(!analyticsAllowed)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                  analyticsAllowed ? 'bg-[var(--accent,#D83333)] justify-end' : 'bg-[var(--surface-2,#1B2431)] justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        )}

        {/* Butoane Egale fără nicio culoare portocalie */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <button
            type="button"
            onClick={isPreferencesOpen ? handleSaveCustom : handleAcceptEssentialOnly}
            className="flex-1 h-10 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] border border-[var(--line,rgba(255,255,255,0.12))] transition-colors cursor-pointer text-center"
          >
            {isPreferencesOpen ? 'Salvează' : 'Doar cele necesare'}
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 h-10 px-3 rounded-[var(--r-sm,8px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[13px] transition-colors cursor-pointer text-center shadow-[var(--shadow-cta)]"
          >
            Acceptă toate
          </button>
        </div>

        {/* Linkuri Preferințe & Politică */}
        <div className="flex items-center justify-between text-[11px] font-open-sans text-[var(--text-muted,#A3ABB6)]">
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
            className="hover:text-[var(--text,#F4F6F9)] underline cursor-pointer"
          >
            {isPreferencesOpen ? 'Ascunde opțiunile' : 'Personalizează preferințele'}
          </button>

          <button
            type="button"
            onClick={onOpenPolicy}
            className="hover:text-[var(--text,#F4F6F9)] underline cursor-pointer"
          >
            Politica Cookies
          </button>
        </div>
      </div>
    </aside>
  );
};
