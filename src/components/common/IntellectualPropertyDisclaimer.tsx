import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, Mail } from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';

export interface IntellectualPropertyDisclaimerProps {
  dealer?: DealerProfile | Partial<DealerProfile> | null;
  className?: string;
  defaultExpanded?: boolean;
}

export function getIntellectualPropertyNotice(dealerName: string): string {
  return `Toate fotografiile, descrierile tehnice și materialele video aparțin exclusiv ${dealerName}. Preluarea, multiplicarea sau republicarea neautorizată pe alte platforme (OLX, Autovit, Facebook etc.) este strict interzisă conform Legii nr. 8/1996 privind dreptul de autor. Pentru parteneriate media sau licențiere, vă rugăm să ne contactați oficial.`;
}

export const IntellectualPropertyDisclaimer: React.FC<IntellectualPropertyDisclaimerProps> = ({
  dealer = SEED_DEALER,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const activeDealer = dealer || SEED_DEALER;
  const dealerName = activeDealer.name || SEED_DEALER.name;
  const dealerEmail = activeDealer.email || SEED_DEALER.email;

  return (
    <div className={`w-full text-left select-none ${className}`}>
      {/* 🛡️ Buton Expandabil Discret la Bază (Optimizat Mobile-First & WCAG 44px) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="intellectual-property-notice-content"
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-amber-500/30 text-zinc-400 hover:text-zinc-200 text-[11px] sm:text-xs flex items-center justify-between gap-2.5 transition-all touch-manipulation active:scale-[0.99] group shadow-sm"
      >
        <span className="flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-zinc-300">
            Protecție Proprietate Intelectuală & Drepturi de Autor{' '}
            <span className="text-zinc-400 font-mono hidden sm:inline">(Legea nr. 8/1996)</span>
          </span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-[10.5px] text-zinc-400 group-hover:text-zinc-300">
          <span>{isExpanded ? 'Restrânge' : 'Afișează Clauza Legală'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 text-amber-400 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* 📜 Conținut Legal Expandat (Legea nr. 8/1996) */}
      {isExpanded && (
        <div
          id="intellectual-property-notice-content"
          className="mt-2.5 p-3.5 sm:p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 text-[11px] sm:text-xs text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Proprietate Intelectuală {dealerName}:</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {getIntellectualPropertyNotice(dealerName)}
              </p>
            </div>
            <a
              href={`mailto:${dealerEmail}?subject=${encodeURIComponent(`Solicitare Acord Licențiere / Parteneriat Media ${dealerName}`)}`}
              className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-all touch-manipulation active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Solicită Acord Utilizare</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
