import React, { useState } from 'react';
import { 
  Car, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  MessageSquare, 
  RefreshCw, 
  Inbox, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  Layers,
  Palette,
  Eye,
  Building2,
  Lock,
  Phone,
  Mail,
  Check,
  Calculator,
  Scale,
  FileSearch,
  Scan,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ShowcaseNavbar } from './showcase/ShowcaseNavbar';
import { ShowcaseHero } from './showcase/ShowcaseHero';
import { ShowroomVideoIntro } from './showcase/ShowroomVideoIntro';
import { InteractiveOcrDemo } from './showcase/InteractiveOcrDemo';
import { ThemeShowcaseDock } from './showcase/ThemeShowcaseDock';
import { WhatsAppQuoteSimulator } from './showcase/WhatsAppQuoteSimulator';
import { DealerRoiCalculator } from './showcase/DealerRoiCalculator';
import { ComparisonAndOnboarding } from './showcase/ComparisonAndOnboarding';
import { MobileStickyDock } from './showcase/MobileStickyDock';

interface ParcOSSaaSPageProps {
  onSwitchToDealer?: (slug: string) => void;
  onOpenCookies?: () => void;
  onOpenCookiePreferences?: () => void;
  onOpenTerms?: () => void;
}

export const ParcOSSaaSPage: React.FC<ParcOSSaaSPageProps> = ({ 
  onSwitchToDealer,
  onOpenCookies,
  onOpenCookiePreferences,
  onOpenTerms
}) => {
  const [activeLang, setActiveLang] = useState<'RO' | 'EN' | 'HU'>('RO');

  // 🏷️ Actualizare dinamică document.title pentru tab-ul de browser ParcOS
  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = 'ParcOS — Sistem de Operare Autonom pentru Parcuri Auto & DMS Cloud';
    
    // Dynamic favicon swap for ParcOS
    const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const prevFavicon = faviconLink ? faviconLink.href : '/favicon.ico';
    if (faviconLink) {
      faviconLink.href = '/brand/icon-32x32.png';
    }

    // Pe pagina de prezentare ParcOS SaaS asigurăm tema luminoasă curată 'parcos_light'
    document.documentElement.setAttribute('data-theme', 'parcos_light');
    document.body.setAttribute('data-theme', 'parcos_light');

    return () => {
      document.title = prevTitle;
      if (faviconLink) {
        faviconLink.href = prevFavicon;
      }
      document.documentElement.setAttribute('data-theme', 'obsidian_gold');
      document.body.setAttribute('data-theme', 'obsidian_gold');
    };
  }, []);

  const handleLaunchDemo = () => {
    const el = document.querySelector('#demo-ocr');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToDMS = () => {
    const el = document.querySelector('#hero') || document.querySelector('#demo-ocr') || document.querySelector('#module');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToOnboard = () => {
    const el = document.querySelector('#onboard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500/20 selection:text-amber-800 overflow-x-clip">
      
      {/* 0. 4K Cinematic Showroom Intro cu Dolly-in & Telemetrie HUD Flancuri */}
      <ShowroomVideoIntro 
        onExploreClick={handleScrollToDMS}
        videoSrc="/videos/parcos-showroom-intro.mp4"
        posterSrc="/images/parcos-showroom-hall.jpg"
        scanStartTimestampSec={6.5}
        spawnStartTimestampSec={8.0}
        targetSectionId="demo-ocr"
        forceShowIntro={typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('gate') === 'true' || new URLSearchParams(window.location.search).get('intro') === 'true')}
      />

      {/* 1. Sculptural Sticky Technical Navigation Bar (< 64px) */}
      <ShowcaseNavbar 
        onSwitchToDealer={onSwitchToDealer}
        activeLanguage={activeLang}
        onLanguageChange={setActiveLang}
      />

      {/* 2. Sculptural Hero Section & Telemetry HUD Dock */}
      <ShowcaseHero 
        onSwitchToDealer={onSwitchToDealer}
        onLaunchDemo={handleLaunchDemo}
      />

      {/* 3. Section 02: Interactive CIV/Talon OCR Simulator */}
      <section id="demo-ocr" className="py-16 sm:py-24 border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <InteractiveOcrDemo onSwitchToDealer={onSwitchToDealer} />
        </div>
      </section>

      {/* 4. Interactive Theme Switcher Section (#teme / #themes) */}
      <section id="teme" className="py-20 border-t border-slate-200/80 bg-slate-50/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ThemeShowcaseDock onSwitchToDealer={onSwitchToDealer} />
        </div>
      </section>

      {/* 5. Section 04: Interactive WhatsApp Quote & Reservation Guarantee Simulator (#oferte-whatsapp) */}
      <section id="oferte-whatsapp" className="py-20 border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <WhatsAppQuoteSimulator />
        </div>
      </section>

      {/* 5. Complete DMS Feature Grid Section (#module / #features) */}
      <section id="module" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono-telemetry mb-3">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>ARHITECTURĂ COMPLETĂ TURNKEY</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight">
            Toate uneltele de care are nevoie un parc modern
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600">
            Fără foi volante, fără mesaje pierdute pe WhatsApp și fără ore irosite tastând specificații de mână.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Scanner CIV & Talon cu AI</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fotografiezi cartea sau talonul mașinii direct de pe telefon. Motorul OCR extrage automat VIN, anul fabricației, cilindreea, puterea (kW/CP) și norma de poluare.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-amber-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-600" /> Fără introducere manuală de date
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Oferte WhatsApp & Garanție de Rezervare</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compune oferte elegante în 10 secunde și trimite-le pe WhatsApp direct clientului. Include opțional link securizat de Garanție de Rezervare (procesare Stripe / card / transfer).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-blue-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" /> Garanție de Rezervare securizată
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-5">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Sincronizare Multi-Canal Portaluri</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scanează automat anunțurile active de pe principalele portaluri auto și platforme de profil. Notifică instant agenții dacă o mașină a fost marcată vândută sau dacă prețurile diferă.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Zero discrepanțe de stoc
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 mb-5">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Showroom Mail Hub & Lead Pool</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Toate cererile venite de pe site și portaluri ajung într-un inbox unificat. Agenții preiau lead-urile cu 1-click fără suprapuneri.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-purple-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-purple-600" /> Notificări Web Push & PWA
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Control Stoc, Marjă & Fiscal</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Urmărești costul real de achiziție, cheltuielile de pregătire și marja de profit pe fiecare vehicul. Sistemul calculează automat regimul de marjă sau deductibil și integrează CUI ANAF v9.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-amber-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-600" /> Marjă reală & conformitate ANAF
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Inspecții & Rapoarte carVertical</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fiecare mașină include puncte de verificare tehnică în 120 de pași și verificare carVertical disponibilă direct în platformă.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-rose-600" /> Transparență totală pentru cumpărători
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 05: Dealer ROI & Margin Calculator (#calculator-roi) */}
      <section id="calculator-roi" className="py-20 border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DealerRoiCalculator />
        </div>
      </section>

      {/* 7. Section 06: Comparison Table & Instant ANAF Onboarding (#comparatie & #onboard) */}
      <section className="py-20 border-t border-slate-200/80 bg-slate-50/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ComparisonAndOnboarding />
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-slate-200/80 bg-white pt-12 pb-28 sm:pb-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/brand/icon-32x32.png" alt="ParcOS" className="w-5 h-5 rounded-md object-cover shadow-sm border border-slate-200" />
            <span className="font-bold text-slate-800">ParcOS — Dealership Operating System</span>
            <span>•</span>
            <span>CARVANA SRL</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            {onOpenCookies && (
              <button 
                type="button" 
                onClick={onOpenCookies} 
                className="hover:text-amber-600 transition-colors cursor-pointer py-1"
              >
                Politica Cookies
              </button>
            )}
            {onOpenCookiePreferences && (
              <>
                <span className="text-slate-300">•</span>
                <button 
                  type="button" 
                  onClick={onOpenCookiePreferences} 
                  className="hover:text-amber-600 transition-colors cursor-pointer py-1"
                >
                  Preferințe Cookie-uri
                </button>
              </>
            )}
            {onOpenTerms && (
              <>
                <span className="text-slate-300">•</span>
                <button 
                  type="button" 
                  onClick={onOpenTerms} 
                  className="hover:text-amber-600 transition-colors cursor-pointer py-1"
                >
                  Termeni și Condiții
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* 10. Sticky Mobile Bottom Conversion Dock (< 768px) */}
      <MobileStickyDock 
        onScrollToDemo={handleLaunchDemo}
        onScrollToOnboard={handleScrollToOnboard}
      />
    </main>
  );
};
