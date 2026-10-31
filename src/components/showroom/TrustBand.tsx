import React from 'react';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { PlaceholderBadge } from '../common/PlaceholderBadge';

interface TrustBandProps {
  dealer: DealerProfile;
  totalCarsCount: number;
  landingConfig?: DealerLandingConfig;
}

export const TrustBand: React.FC<TrustBandProps> = ({
  dealer,
  totalCarsCount,
  landingConfig
}) => {
  const financePartners = landingConfig?.financePartners || [
    { name: 'tbi bank', type: 'Credit Auto & Rate cu Buletinul' },
    { name: 'BT Leasing', type: 'Leasing Financiar PJ / PF' },
    { name: 'Porsche Leasing', type: 'Leasing Financiar & Operațional' }
  ];

  return (
    <section 
      aria-label="Metrici de încredere și parteneri financiari"
      className="bg-[var(--surface-brand,#2E3643)] text-white py-10 md:py-14 border-y border-[var(--line,rgba(255,255,255,0.08))]"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* 4 Metrici Cheie */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pb-8 md:pb-10 border-b border-white/10 text-center sm:text-left">
          {/* Metrica 1 */}
          <div className="flex flex-col sm:border-l-2 sm:border-[var(--accent,#D83333)] sm:pl-4">
            <span className="font-montserrat font-extrabold text-[32px] sm:text-[40px] leading-tight tabular-nums text-white">
              {totalCarsCount}
            </span>
            <span className="font-open-sans text-[13px] sm:text-[14px] text-[var(--metal,#C9CED6)] mt-1">
              mașini în stoc verificate
            </span>
          </div>

          {/* Metrica 2 */}
          <div className="flex flex-col sm:border-l-2 sm:border-[var(--accent,#D83333)] sm:pl-4">
            <span className="font-montserrat font-extrabold text-[32px] sm:text-[40px] leading-tight tabular-nums text-white">
              12–36
            </span>
            <span className="font-open-sans text-[13px] sm:text-[14px] text-[var(--metal,#C9CED6)] mt-1">
              luni garanție inclusă
            </span>
          </div>

          {/* Metrica 3 */}
          <div className="flex flex-col sm:border-l-2 sm:border-[var(--accent,#D83333)] sm:pl-4">
            <span className="font-montserrat font-extrabold text-[32px] sm:text-[40px] leading-tight tabular-nums text-white">
              0 lei
            </span>
            <span className="font-open-sans text-[13px] sm:text-[14px] text-[var(--metal,#C9CED6)] mt-1">
              livrare gratuită în România
            </span>
          </div>

          {/* Metrica 4 */}
          <div className="flex flex-col sm:border-l-2 sm:border-[var(--accent,#D83333)] sm:pl-4">
            <span className="font-montserrat font-extrabold text-[32px] sm:text-[40px] leading-tight text-white">
              Rate fixe
            </span>
            <span className="font-open-sans text-[13px] sm:text-[14px] text-[var(--metal,#C9CED6)] mt-1">
              doar cu buletinul, aprobare rapidă
            </span>
          </div>
        </div>

        {/* Parteneri Financiari */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px] font-montserrat uppercase tracking-[0.14em] text-[var(--metal,#C9CED6)]">
            <span>Parteneri Finanțare & Leasing Agreați:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {financePartners && financePartners.length > 0 ? (
              financePartners.map((p, idx) => {
                const partnerName = typeof p === 'string' ? p : p.name;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-opacity select-none group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--accent,#D83333)] opacity-70 group-hover:opacity-100" />
                    <span className="font-montserrat font-bold text-[15px] sm:text-[16px] tracking-wide">
                      {partnerName}
                    </span>
                  </div>
                );
              })
            ) : (
              <PlaceholderBadge label="Parteneri finanțare agreați" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
