import React from 'react';
import { Scan, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface MobileStickyDockProps {
  onScrollToDemo?: () => void;
  onScrollToOnboard?: () => void;
}

export const MobileStickyDock: React.FC<MobileStickyDockProps> = ({
  onScrollToDemo,
  onScrollToOnboard,
}) => {
  const handleScrollTo = (targetId: string, customHandler?: () => void) => {
    if (customHandler) {
      customHandler();
      return;
    }
    const el = document.querySelector(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      aria-label="Acțiuni rapide mobil"
      className="fixed bottom-0 inset-x-0 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] pt-2.5 px-3.5 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 z-40 md:hidden flex flex-col gap-2 shadow-2xl shadow-slate-900/10 pointer-events-auto transition-all"
    >
      {/* Micro-telemetry Status Strip */}
      <div className="flex items-center justify-between px-1 text-[10px] font-mono-telemetry text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-900 font-bold tracking-wider">PARCOS v2.4 LIVE</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">Dealership OS</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>TVA 21% Deductibil</span>
        </div>
      </div>

      {/* Action Buttons Row with strictly >= 44px touch targets */}
      <div className="flex items-center gap-2.5">
        {/* Secondary Action: Demo OCR Scanner */}
        <button
          type="button"
          onClick={() => handleScrollTo('#demo-ocr', onScrollToDemo)}
          className="h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800 hover:text-slate-950 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
          title="Mergi direct la simulatorul de scanare CIV/Talon"
          aria-label="Scanează Demo CIV/Talon"
        >
          <Scan className="w-4 h-4 text-amber-600" />
          <span>Scanează Demo</span>
        </button>

        {/* Primary High-Conversion Action: Onboarding Form */}
        <button
          type="button"
          onClick={() => handleScrollTo('#onboard', onScrollToOnboard)}
          className="flex-1 h-11 min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2 cursor-pointer"
          title="Completează formularul de onboarding cu CUI ANAF"
          aria-label="Înscrie Parcul Auto în 24 de ore"
        >
          <Sparkles className="w-4 h-4 fill-slate-950/20 text-slate-950" />
          <span>Înscrie Parcul (24h)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>
    </aside>
  );
};
