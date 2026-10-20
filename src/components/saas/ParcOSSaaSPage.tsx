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
import ShowroomDoubleDoorIntro from './showcase/ShowroomDoubleDoorIntro';
import { InteractiveOcrDemo } from './showcase/InteractiveOcrDemo';
import { ThemeShowcaseDock } from './showcase/ThemeShowcaseDock';
import { WhatsAppQuoteSimulator } from './showcase/WhatsAppQuoteSimulator';
import { DealerRoiCalculator } from './showcase/DealerRoiCalculator';
import { ComparisonAndOnboarding } from './showcase/ComparisonAndOnboarding';
import { MobileStickyDock } from './showcase/MobileStickyDock';

interface ParcOSSaaSPageProps {
  onSwitchToDealer?: (slug: string) => void;
  onOpenSuperAdmin?: () => void;
}

export const ParcOSSaaSPage: React.FC<ParcOSSaaSPageProps> = ({ 
  onSwitchToDealer, 
  onOpenSuperAdmin 
}) => {
  const [activeLang, setActiveLang] = useState<'RO' | 'EN' | 'HU'>('RO');

  // 🏷️ Actualizare dinamică document.title pentru tab-ul de browser ParcOS
  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = 'ParcOS — Sistem de Operare Autonom pentru Parcuri Auto & DMS Cloud';
    
    // Asigurăm că tema de bază rămâne obsidian_gold pe pagina de prezentare
    document.documentElement.setAttribute('data-theme', 'obsidian_gold');
    document.body.setAttribute('data-theme', 'obsidian_gold');

    return () => {
      document.title = prevTitle;
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-300 overflow-x-hidden">
      
      {/* 0. Portal Architectural: Uși Duble de Sticlă care pivotează spre interior & Hală Luminată */}
      <ShowroomDoubleDoorIntro 
        onExploreClick={handleScrollToDMS}
        autoOpenDelayMs={1800}
        forceShowIntro={typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('gate') === 'true' || new URLSearchParams(window.location.search).get('intro') === 'true')}
      />

      {/* 1. Sculptural Sticky Technical Navigation Bar (< 64px) */}
      <ShowcaseNavbar 
        onSwitchToDealer={onSwitchToDealer}
        onOpenSuperAdmin={onOpenSuperAdmin}
        activeLanguage={activeLang}
        onLanguageChange={setActiveLang}
      />

      {/* 2. Sculptural Hero Section & Telemetry HUD Dock */}
      <ShowcaseHero 
        onSwitchToDealer={onSwitchToDealer}
        onLaunchDemo={handleLaunchDemo}
      />

      {/* 3. Section 02: Interactive CIV/Talon OCR Simulator */}
      <section id="demo-ocr" className="py-16 sm:py-24 border-t border-white/[0.08] bg-[#0c0c0f] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <InteractiveOcrDemo onSwitchToDealer={onSwitchToDealer} />
        </div>
      </section>

      {/* 4. Interactive Theme Switcher Section (#teme / #themes) */}
      <section id="teme" className="py-20 border-t border-white/[0.08] bg-zinc-950/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ThemeShowcaseDock onSwitchToDealer={onSwitchToDealer} />
        </div>
      </section>

      {/* 5. Section 04: Interactive WhatsApp Quote & Reservation Guarantee Simulator (#oferte-whatsapp) */}
      <section id="oferte-whatsapp" className="py-20 border-t border-white/[0.08] bg-[#0c0c0f] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <WhatsAppQuoteSimulator />
        </div>
      </section>

      {/* 5. Complete DMS Feature Grid Section (#module / #features) */}
      <section id="module" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs text-zinc-400 font-mono-telemetry mb-3">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>ARHITECTURĂ COMPLETĂ TURNKEY</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Toate uneltele de care are nevoie un parc modern
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Fără foi volante, fără oferte scrise greoi pe telefon și fără calcule greșite de TVA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Scanner CIV & Talon cu AI</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fotografiezi cartea sau talonul mașinii direct de pe telefon. Motorul OCR extrage automat VIN, anul fabricației, cilindreea, puterea (kW/CP) și norma de poluare.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-amber-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Fără introducere manuală de date
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Oferte WhatsApp & Garanție de Rezervare</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Compune oferte elegante în 10 secunde și trimite-le pe WhatsApp direct clientului. Include opțional link securizat de Garanție de Rezervare (procesare Stripe / card / transfer).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-blue-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Garanție de Rezervare securizată
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Sincronizare Delta OLX</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Scanează automat anunțurile active de pe OLX și Autovit. Notifică instant agenții dacă o mașină a fost marcată vândută sau dacă prețurile diferă.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-emerald-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Zero discrepanțe de stoc
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Showroom Mail Hub & Lead Pool</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Toate cererile venite de pe site și portaluri ajung într-un inbox unificat. Agenții preiau lead-urile cu 1-click fără suprapuneri.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-purple-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Notificări Web Push & PWA
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Onboarding Instant prin CUI ANAF</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Introduci CUI-ul parcului auto, iar sistemul interoghează ANAF v9 și extrage automat denumirea legală, statutul TVA, adresa și datele fiscale.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-amber-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Conformitate fiscală garantată
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Inspecții & Rapoarte carVertical</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fiecare mașină include puncte de verificare tehnică în 120 de pași și verificare carVertical disponibilă direct în platformă.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-rose-400/90 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Transparență totală pentru cumpărători
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 05: Dealer ROI & Margin Calculator (#calculator-roi) */}
      <section id="calculator-roi" className="py-20 border-t border-white/[0.08] bg-[#0c0c0f] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DealerRoiCalculator />
        </div>
      </section>

      {/* 7. Section 06: Comparison Table & Instant ANAF Onboarding (#comparatie & #onboard) */}
      <section className="py-20 border-t border-white/[0.08] bg-zinc-950/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ComparisonAndOnboarding />
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-white/[0.08] pt-12 pb-28 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Car className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-zinc-300">ParcOS - Your Dealership Platform</span>
          <span>•</span>
          <span>CARVANA SRL</span>
        </div>
      </footer>

      {/* 10. Sticky Mobile Bottom Conversion Dock (< 768px) */}
      <MobileStickyDock 
        onScrollToDemo={handleLaunchDemo}
        onScrollToOnboard={handleScrollToOnboard}
      />
    </div>
  );
};
