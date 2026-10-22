import React from 'react';
import { 
  Zap, 
  Crown, 
  Scale, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  Terminal, 
  Cpu, 
  Activity, 
  ChevronRight,
  Calculator,
  Server
} from 'lucide-react';

export interface ShowcaseHeroProps {
  onSwitchToDealer?: (slug: string) => void;
  onLaunchDemo?: () => void;
}

export const ShowcaseHero: React.FC<ShowcaseHeroProps> = ({
  onSwitchToDealer,
  onLaunchDemo
}) => {
  const handleScrollTo = (e: React.MouseEvent<HTMLElement>, selector: string) => {
    e.preventDefault();
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', selector);
    }
  };

  const handleLaunchDemoClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onLaunchDemo) {
      onLaunchDemo();
    } else {
      handleScrollTo(e, '#demo-ocr');
    }
  };

  return (
    <section 
      id="hero" 
      data-non-interactive-start="true"
      className="relative pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden text-slate-900"
      aria-label="Prezentare ParcOS Hero"
    >
      {/* Background Architectural Atmosphere: Clean Slate-50 canvas + discreet amber glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none -z-10 hud-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[280px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" 
        aria-hidden="true" 
      />

      {/* Brand Hero Emblem */}
      <div className="flex justify-center mb-5">
        <div 
          onClick={handleLaunchDemoClick}
          className="relative group cursor-pointer focus:outline-none"
          title="ParcOS Dealership Platform — Lansează Demo"
        >
          <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-sky-500/40 rounded-3xl blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
          <img 
            src="/brand/parcos-app-icon.webp" 
            alt="ParcOS Emblem" 
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-2xl border border-white/80 object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      </div>

      {/* Eyebrow Status Tag */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-amber-800 font-bold">ParcOS</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-800 font-medium">
            Program Complet pentru Parcuri Auto
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 font-semibold">
            Funcționează pe Telefon, Tabletă și PC
          </span>
        </div>
      </div>

      {/* Main Display Headline */}
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="font-sans font-black tracking-[-0.03em] text-slate-950 text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] sm:leading-[1.06] text-balance">
          Programul complet pentru parcuri auto:{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700">
            Site-ul tău propriu
          </span>{' '}
          și stocul organizat direct de pe telefon
        </h1>

        {/* Editorial Commercial Subtitle */}
        <p className="mt-5 sm:mt-7 text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed text-balance">
          Fără foi rătăcite, fără date tastate manual și fără haos pe WhatsApp: scanezi talonul mașinii în 2 secunde, 
          trimiți oferte elegante clienților cu rezervare garantată online și ai propriul tău site oficial fără concurență.
        </p>

        {/* Primary Action Buttons Bar */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          
          {/* Primary CTA: Launch Interactive Demo */}
          <button
            onClick={handleLaunchDemoClick}
            className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base touch-manipulation active:scale-[0.98] group"
          >
            <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span>Vezi Demonstrația Interactivă</span>
            <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary CTA: Live Showroom Demo (RXM Official Site) */}
          <a
            href="https://rxmautomobile.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[48px] px-5 sm:px-6 py-3.5 rounded-xl font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base touch-manipulation active:scale-[0.98]"
            title="Deschide site-ul oficial RXM Automobile dezvoltat pe ParcOS"
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>Vezi Showroom Real (rxmautomobile.ro)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-800 border border-amber-400/30">
              LIVE
            </span>
          </a>

          {/* Secondary Anchor Link: ROI Calculator */}
          <a
            href="#calculator-roi"
            onClick={(e) => handleScrollTo(e, '#calculator-roi')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            <span>Cât Timp și Bani Economisești</span>
          </a>
        </div>
      </div>

      {/* Hero Overview Panel: 4 Simple Pillars */}
      <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
          
          {/* Overview Header Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-slate-900 font-bold tracking-wide">
                CE PRIMEȘTE PARCUL TĂU AUTO CU PARCOS
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="hidden md:inline text-slate-600 font-medium">
                Soluție la cheie, configurată în 24 de ore
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <Activity className="w-3.5 h-3.5" />
                FUNCȚIONEAZĂ 24/7
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-700 font-semibold">
                Fără Instalare Complicată
              </span>
            </div>
          </div>

          {/* 4 Active Commercial Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Metric 1: Scanare OCR */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    SCANARE CU TELEFONUL
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    AUTOMAT
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-baseline gap-1">
                  &lt; 2 secunde
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Gata în 2 secunde
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Pozezi talonul sau cartea mașinii (CIV / Brief). Seria de șasiu, motorul și norma Euro se completează singure.
              </p>
            </div>

            {/* Metric 2: Site Propriu */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    SITE-UL TĂU PROPRIU
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                    FĂRĂ CONCURENȚĂ
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  100% al tău
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Doar mașinile tale
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Domeniul tău de internet (ex: numeparc.ro), cu sigla ta. Fără reclame la alți dealeri și fără concurență pe stocul tău.
              </p>
            </div>

            {/* Metric 3: Control Marjă & Fiscal */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    PROFIT & CONTROL
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                    EVIDENȚĂ CLARĂ
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  Marjă Clară
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Știi exact cât câștigi
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Vezi costul real de achiziție, cheltuielile de pregătire și profitul net pe fiecare mașină vândută (TVA sau regim de marjă).
              </p>
            </div>

            {/* Metric 4: Avans WhatsApp */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    AVANS PE WHATSAPP
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                    CARD SAU BANCĂ
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  1-Click
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Rezervare Garantată
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Clientul din alt oraș îți plătește avansul în siguranță cu cardul sau prin bancă, direct din linkul primit pe WhatsApp.
              </p>
            </div>
          </div>

          {/* Live Status Footer Strip */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 font-black">▶</span>
              <span className="text-slate-900 font-black">UTILIZAT DE DEALERI REALI:</span>
              <span className="text-slate-700 font-medium hidden xs:inline">
                RXM Automobile, MPI Auto, ALD Autoland și alți parteneri din România
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-bold">✓ Date securizate • 100% proprietatea ta</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
