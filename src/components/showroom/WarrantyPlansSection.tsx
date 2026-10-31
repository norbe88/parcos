import React from 'react';
import { ShieldCheck, Check, Sparkles, Phone, MessageCircle } from 'lucide-react';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { resolveDealerContact, formatPriceEur } from '../../utils/helpers';
import { PlaceholderBadge } from '../common/PlaceholderBadge';

interface WarrantyPlansSectionProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
}

export const WarrantyPlansSection: React.FC<WarrantyPlansSectionProps> = ({
  dealer,
  landingConfig
}) => {
  const contact = resolveDealerContact(dealer);
  const plans = landingConfig?.warrantyPlans;

  const defaultPlans = [
    {
      name: 'Standard Protect',
      durationMonths: 12,
      mileageLimitKm: 15000,
      coverage: [
        'Bloc motor și componente interne unse',
        'Cutie de viteze manuală și automată',
        'Diferențial și arbori planetari',
        'Pompă de ulei și circuit lubrifiere'
      ],
      priceEur: 0,
      isRecommended: false
    },
    {
      name: 'Car Protect Plus',
      durationMonths: 24,
      mileageLimitKm: 30000,
      coverage: [
        'Toate componentele Standard Protect',
        'Turbosuflantă și intercooler',
        'Sistem de injecție și pompă de înaltă presiune',
        'Sistem de frânare și modul ABS/ESP',
        'Alternator și electromotor'
      ],
      priceEur: 350,
      isRecommended: true
    },
    {
      name: 'Car Protect Premium',
      durationMonths: 36,
      mileageLimitKm: 50000,
      coverage: [
        'Acoperire completă mecanică și electrică',
        'Sistem de climatizare și compresor A/C',
        'Calculatoare de bord și senzori motor',
        'Asistență rutieră 24/7 pe teritoriul României',
        'Vehicul de curtoazie pe durata reparațiilor'
      ],
      priceEur: 650,
      isRecommended: false
    }
  ];

  const activePlans = plans && plans.length > 0 ? plans : defaultPlans;
  const isCustomPlansMissing = !plans || plans.length === 0;

  return (
    <section 
      id="garantie"
      aria-label="Garanție Extinsă Automobil"
      className="py-14 md:py-24 bg-[var(--surface-2,#1B2431)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Header Secțiune */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent,#D83333)]/10 text-[var(--accent-text,#F04D4D)] text-[12px] font-montserrat font-semibold uppercase tracking-[0.14em] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Siguranță pe termen lung</span>
          </div>
          <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em] mb-3">
            Garanție extinsă MPI Car Protect
          </h2>
          <p className="font-open-sans text-[15px] sm:text-[16px] text-[var(--text-muted,#A3ABB6)] leading-relaxed">
            Fiecare autovehicul beneficiază de garanție contractuală inclusă, cu posibilitate de extindere până la 36 de luni fără bătăi de cap.
          </p>
          {isCustomPlansMissing && (
            <div className="mt-2">
              <PlaceholderBadge label="Pachete detaliate garanție" />
            </div>
          )}
        </div>

        {/* Grilă 3 Pachete Garanție */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {activePlans.map((plan, idx) => {
            const months = plan.durationMonths || (plan as any).months || 12;
            const km = plan.mileageLimitKm || (plan as any).kmLimit || 15000;
            const covers = plan.coverage || (plan as any).covers || [];
            const price = plan.priceEur;
            const isRec = Boolean(plan.isRecommended);

            return (
              <div
                key={idx}
                className={`rounded-[var(--r-lg,24px)] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isRec
                    ? 'bg-[var(--surface,#131A24)] border-2 border-[var(--accent,#D83333)] shadow-[var(--shadow-cta)] md:-translate-y-2'
                    : 'bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)]'
                }`}
              >
                {isRec && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3.5 py-1 rounded-full bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Recomandat</span>
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-montserrat font-bold text-[20px] text-[var(--text,#F4F6F9)] mb-1">
                    {plan.name}
                  </h3>
                  <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mb-6">
                    {months} luni sau {km.toLocaleString('ro-RO')} km incluși
                  </p>

                  <div className="mb-6 pb-6 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                    <span className="font-montserrat font-extrabold text-[32px] text-[var(--accent-text,#F04D4D)] tabular-nums">
                      {price && price > 0 ? formatPriceEur(price) : 'Inclus în preț'}
                    </span>
                    {price && price > 0 && (
                      <span className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)] block mt-0.5">
                        cost opțional de extindere
                      </span>
                    )}
                  </div>

                  {/* Listă componente acoperite */}
                  <ul className="space-y-3 font-open-sans text-[13px] text-[var(--text,#F4F6F9)] mb-8">
                    {covers.map((c: string, cIdx: number) => (
                      <li key={cIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {contact.salesWhatsApp && (
                    <a
                      href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc informații despre pachetul de garanție ${plan.name} (${months} luni).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full h-12 rounded-[var(--r-md,14px)] font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
                        isRec
                          ? 'bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white shadow-[var(--shadow-cta)]'
                          : 'bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Întreabă despre {plan.name}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
