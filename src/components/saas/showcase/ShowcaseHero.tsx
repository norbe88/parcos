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
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, selector: string) => {
    e.preventDefault();
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', selector);
    }
  };

  const handleLaunchDemoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onLaunchDemo) {
      onLaunchDemo();
    } else {
      handleScrollTo(e, '#demo-ocr');
    }
  };

  return (
    <section 
      id="hero" 
      className="relative pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
      aria-label="Prezentare ParcOS Hero"
    >
      {/* Background Architectural Atmosphere: Obsidian canvas + discreet technical glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none -z-10 hud-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[280px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" 
        aria-hidden="true" 
      />

      {/* Eyebrow HUD Bracket Tag */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 text-xs font-mono-telemetry tracking-wide shadow-inner shadow-black/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-amber-400 font-bold">[ DMS v2.4 ]</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-200 font-medium">
            Sistem Autonom pentru Parcuri Auto
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400/90 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 font-mono">
            Cloud-Native • 99.9% Uptime
          </span>
        </div>
      </div>

      {/* Main Sculptural Display Headline */}
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="font-sans font-extrabold tracking-[-0.03em] text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] sm:leading-[1.06] text-balance">
          Sistemul de Operare Autonom pentru{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 hud-glow-amber">
            Parcuri Auto Moderne
          </span>{' '}
          din România
        </h1>

        {/* Editorial Dense Subtitle (Anti-AI Clichés) */}
        <p className="mt-5 sm:mt-7 text-sm sm:text-base md:text-lg lg:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed text-balance">
          Elimină haosul din administrare: scanează actele mașinilor (CIV / talon) cu AI în sub 1.8s, 
          generează oferte pe WhatsApp cu Garanție de Rezervare securizată (Stripe / card / transfer), 
          sincronizează stocul pe OLX și lansează showroom-ul tău suveran pe domeniu propriu.
        </p>

        {/* Primary Action Buttons Bar */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          
          {/* Primary CTA: Launch Interactive Demo */}
          <button
            onClick={handleLaunchDemoClick}
            className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base touch-manipulation active:scale-[0.98] group"
          >
            <Sparkles className="w-4 h-4 text-zinc-950 group-hover:rotate-12 transition-transform" />
            <span>Lansează Demo Interactiv</span>
            <ChevronRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Secondary CTA: Live Showroom Demo (RXM Official Site) */}
          <a
            href="https://rxmautomobile.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[48px] px-5 sm:px-6 py-3.5 rounded-xl font-semibold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base touch-manipulation active:scale-[0.98]"
            title="Deschide site-ul oficial RXM Automobile dezvoltat pe ParcOS"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Vezi Showroom Live (rxmautomobile.ro)</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
              LIVE
            </span>
          </a>

          {/* Secondary Anchor Link: ROI Calculator */}
          <a
            href="#calculator-roi"
            onClick={(e) => handleScrollTo(e, '#calculator-roi')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/5 hover:border-white/15 transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Calculator ROI & Marjă</span>
          </a>
        </div>
      </div>

      {/* Hero Terminal HUD Dock (Live Automotive Telemetry) */}
      <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[#0c0c0e]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Terminal Console Header Bar */}
          <div className="px-4 sm:px-6 py-3 bg-zinc-950/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-telemetry">
            <div className="flex items-center gap-2 text-zinc-400">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-200 font-semibold tracking-wider">
                TELEMETRIE PARCOS // PROD NODE
              </span>
              <span className="hidden md:inline text-zinc-600">|</span>
              <span className="hidden md:inline text-zinc-400">
                HOST: Netcup VPS (152.53.158.65)
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Activity className="w-3.5 h-3.5" />
                UPTIME: 99.98%
              </span>
              <span className="hidden sm:inline text-zinc-600">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                LATENȚĂ: ~14ms
              </span>
            </div>
          </div>

          {/* 4 Active Telemetry KPI Metrics (Grid 2x2 on Mobile, 4-Cols on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            
            {/* Metric 1: Scanare OCR */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.02] transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-zinc-400">
                    SCANARE ACTE
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    AI OCR
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-telemetry tracking-tight flex items-baseline gap-1">
                  <span className="text-amber-400">&lt;</span> 1.8s
                </div>
                <div className="text-xs font-semibold text-zinc-200 mt-1">
                  Timp Mediu CIV & Talon
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                Extrage automat seria VIN, puterea kW/CP, norma Euro și cilindreea fără tastare manuală.
              </p>
            </div>

            {/* Metric 2: Multi-Tenant Suveran */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.02] transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-zinc-400">
                    ARHITECTURĂ
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300 border border-blue-400/20">
                    IZOLAT
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-telemetry tracking-tight">
                  100%
                </div>
                <div className="text-xs font-semibold text-zinc-200 mt-1">
                  Multi-Tenant Suveran
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                Domeniu propriu, temă personalizată și zero concurență pe stocul tău de mașini.
              </p>
            </div>

            {/* Metric 3: Conformitate Fiscală */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.02] transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-zinc-400">
                    CONFORMITATE
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                    ANAF READY
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-telemetry tracking-tight">
                  TVA Deductibil
                </div>
                <div className="text-xs font-semibold text-zinc-200 mt-1">
                  Calcul Automat Fiscal
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                Calcul exact deductibil sau regim de marjă de profit conform Art. 312 Cod Fiscal.
              </p>
            </div>

            {/* Metric 4: Garanție Stripe & Card */}
            <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.02] transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-telemetry tracking-wider uppercase text-zinc-400">
                    SECURITATE PLĂȚI
                  </span>
                  <span className="text-[10px] font-mono-telemetry px-1.5 py-0.5 rounded bg-purple-400/10 text-purple-300 border border-purple-400/20">
                    STRIPE READY
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-telemetry tracking-tight">
                  1-Click
                </div>
                <div className="text-xs font-semibold text-zinc-200 mt-1">
                  Garanție de Rezervare
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                Plată securizată cu cardul (Stripe) sau transfer bancar generat direct pe linkul de ofertă WhatsApp.
              </p>
            </div>
          </div>

          {/* Terminal Live Status Footer Strip */}
          <div className="px-4 sm:px-6 py-2.5 bg-black/60 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-telemetry text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">▶</span>
              <span className="text-zinc-300 font-medium">LIVE SHOWROOM STACK:</span>
              <span className="text-zinc-400 hidden xs:inline">
                React 18 + Vite + Netcup VPS Docker + Nginx SSL
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">EXEMPLE CREATE CU PARCOS: RXM AUTOMOBILE, MPI AUTO, TOP AUTO (+35 DEALERI)</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
