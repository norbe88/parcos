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

      {/* Eyebrow HUD Bracket Tag */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono-telemetry tracking-wide shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-amber-800 font-black">[ DMS v2.4 ]</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-800 font-medium">
            Sistem Autonom pentru Parcuri Auto
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 font-mono font-semibold">
            Cloud-Native • 99.9% Uptime
          </span>
        </div>
      </div>

      {/* Main Sculptural Display Headline */}
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="font-sans font-black tracking-[-0.03em] text-slate-950 text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] sm:leading-[1.06] text-balance">
          Sistemul de Operare Autonom pentru{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700">
            Parcuri Auto Moderne
          </span>{' '}
          din România
        </h1>

        {/* Editorial Dense Subtitle (Anti-AI Clichés) */}
        <p className="mt-5 sm:mt-7 text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed text-balance">
          Elimină haosul din administrare: scanează actele mașinilor (CIV / talon) cu AI în sub 1.8s, 
          generează oferte pe WhatsApp cu Garanție de Rezervare securizată (Stripe / card / transfer), 
          sincronizează stocul pe marile portaluri auto și lansează showroom-ul tău suveran pe domeniu propriu.
        </p>

        {/* Primary Action Buttons Bar */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          
          {/* Primary CTA: Launch Interactive Demo */}
          <button
            onClick={handleLaunchDemoClick}
            className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base touch-manipulation active:scale-[0.98] group"
          >
            <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span>Lansează Demo Interactiv</span>
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
            <span>Vezi Showroom Live (rxmautomobile.ro)</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-800 border border-amber-400/30">
              LIVE
            </span>
          </a>

          {/* Secondary Anchor Link: ROI Calculator */}
          <a
            href="#calculator-roi"
            onClick={(e) => handleScrollTo(e, '#calculator-roi')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            <span>Calculator ROI & Marjă</span>
          </a>
        </div>
      </div>

      {/* Hero Terminal HUD Dock (Live Automotive Telemetry) */}
      <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
          
          {/* Terminal Console Header Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-telemetry">
            <div className="flex items-center gap-2 text-slate-500">
              <Terminal className="w-4 h-4 text-amber-600" />
              <span className="text-slate-900 font-bold tracking-wider">
                TELEMETRIE PARCOS // PROD NODE
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="hidden md:inline text-slate-600">
                INFRA: Cloud-Native • High-Availability Cluster
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <Activity className="w-3.5 h-3.5" />
                UPTIME: 99.98%
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-600">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                LATENȚĂ: ~14ms
              </span>
            </div>
          </div>

          {/* 4 Active Telemetry KPI Metrics (Grid 2x2 on Mobile, 4-Cols on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Metric 1: Scanare OCR */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-slate-600 font-bold">
                    SCANARE ACTE
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    AI OCR
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono-telemetry tracking-tight flex items-baseline gap-1">
                  <span className="text-amber-600 font-black">&lt;</span> 1.8s
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Timp Mediu CIV & Talon
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Extrage automat seria VIN, puterea kW/CP, norma Euro și cilindreea fără tastare manuală.
              </p>
            </div>

            {/* Metric 2: Multi-Tenant Suveran */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-slate-600 font-bold">
                    ARHITECTURĂ
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                    IZOLAT
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono-telemetry tracking-tight">
                  100%
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Multi-Tenant Suveran
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Domeniu propriu, temă personalizată și zero concurență pe stocul tău de mașini.
              </p>
            </div>

            {/* Metric 3: Control Marjă & Fiscal */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-slate-600 font-bold">
                    PROFIT & CONTROL
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                    LIVE MARGIN
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono-telemetry tracking-tight">
                  Control Marjă
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Costuri & Marjă per Mașină
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Știi profitul real pe fiecare mașină: preț achiziție, pregătire și regim fiscal (TVA / Marjă Art. 312).
              </p>
            </div>

            {/* Metric 4: Garanție Stripe & Card */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-slate-600 font-bold">
                    SECURITATE PLĂȚI
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                    STRIPE READY
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-mono-telemetry tracking-tight">
                  1-Click
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  Garanție de Rezervare
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed font-medium">
                Plată securizată cu cardul (Stripe) sau transfer bancar generat direct pe linkul de ofertă WhatsApp.
              </p>
            </div>
          </div>

          {/* Terminal Live Status Footer Strip */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-telemetry text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 font-black">▶</span>
              <span className="text-slate-900 font-black">LIVE SHOWROOM STACK:</span>
              <span className="text-slate-700 font-medium hidden xs:inline">
                React 18 + Vite + Docker Cloud Enterprise + TLS End-to-End
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium">EXEMPLE CREATE CU PARCOS: RXM AUTOMOBILE, MPI AUTO, ALD AUTOLAND (+35 DEALERI)</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
