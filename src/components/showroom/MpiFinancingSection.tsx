import React, { useState, useMemo } from 'react';
import { Calculator, Phone, MessageCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { resolveDealerContact, formatPriceEur } from '../../utils/helpers';
import { convertEurToRon, getExchangeRateDisclaimer } from '../../utils/currencyEngine';

interface FinancingSectionProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
}

export const MpiFinancingSection: React.FC<FinancingSectionProps> = ({
  cars,
  dealer = SEED_DEALER
}) => {
  const contact = resolveDealerContact(dealer);

  // Stare simulator
  const [priceEur, setPriceEur] = useState<number>(15000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(15);
  const [months, setMonths] = useState<number>(48);

  // Tab cerințe finanțare (Persoane Fizice vs Persoane Juridice)
  const [applicantType, setApplicantType] = useState<'pf' | 'pj'>('pf');

  // Calcul matematic rată lunară
  // Valoare finanțată = Preț - Plată Inițială
  const downPaymentEur = Math.round(priceEur * (downPaymentPct / 100));
  const principalEur = Math.max(0, priceEur - downPaymentEur);

  const monthlyRateEur = useMemo(() => {
    if (principalEur <= 0) return 0;
    // Rata standard de referință 9.9% DAE conform pieței
    const annualRate = 0.099;
    const monthlyRate = annualRate / 12;
    const payment = (principalEur * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment);
  }, [principalEur, months]);

  const monthlyRateRon = useMemo(() => {
    return convertEurToRon(monthlyRateEur);
  }, [monthlyRateEur]);

  const financePhone = contact.financePhone || contact.salesPhone;
  const financePhoneClean = contact.financePhoneClean || contact.salesPhoneClean;
  const financeWa = contact.financeWhatsApp || contact.salesWhatsApp;

  return (
    <section 
      id="finantare"
      aria-label="Finanțare și Simulator Rate Auto"
      className="py-14 md:py-24 bg-[var(--surface-2,#1B2431)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Stânga: 6 Cols (Pași & Cerințe PF/PJ) */}
          <div className="lg:col-span-6">
            <div className="font-montserrat font-semibold text-[12px] uppercase tracking-[0.16em] text-[var(--accent-text,#F04D4D)] mb-2">
              Finanțare auto
            </div>
            <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em] mb-4">
              Rate fixe, doar cu buletinul.
            </h2>
            <p className="font-open-sans text-[15px] sm:text-[16px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-8">
              Fie că alegi credit auto pentru persoane fizice sau leasing financiar pentru firmă, beneficiezi de rate fixe în euro sau lei, fără drumuri inutile la bancă.
            </p>

            {/* 3 Pași Numerotați */}
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-start gap-4">
                <span className="font-montserrat font-extrabold text-[20px] text-[var(--accent-text,#F04D4D)] tabular-nums shrink-0">
                  01
                </span>
                <div>
                  <h3 className="font-montserrat font-bold text-[16px] text-[var(--text,#F4F6F9)]">
                    Alegi mașina și trimiți buletinul
                  </h3>
                  <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                    Selectezi automobilul din stoc și transmiți copia actului de identitate online pe WhatsApp sau în showroom.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-start gap-4">
                <span className="font-montserrat font-extrabold text-[20px] text-[var(--accent-text,#F04D4D)] tabular-nums shrink-0">
                  02
                </span>
                <div>
                  <h3 className="font-montserrat font-bold text-[16px] text-[var(--text,#F4F6F9)]">
                    Aprobare rapidă direct de la parteneri
                  </h3>
                  <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                    Dosarul tău este analizat direct prin parteneriatele noastre autorizate cu tbi bank, BT Leasing și Porsche Leasing.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-start gap-4">
                <span className="font-montserrat font-extrabold text-[20px] text-[var(--accent-text,#F04D4D)] tabular-nums shrink-0">
                  03
                </span>
                <div>
                  <h3 className="font-montserrat font-bold text-[16px] text-[var(--text,#F4F6F9)]">
                    Semnezi contractul și pleci cu mașina
                  </h3>
                  <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                    Semnarea se poate face electronic sau la predarea vehiculului, cu numere roșii și dosar complet de înmatriculare.
                  </p>
                </div>
              </div>
            </div>

            {/* Acordeon / Selector Cerințe: PF vs PJ */}
            <div className="p-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))]">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setApplicantType('pf')}
                  className={`h-9 px-4 rounded-[6px] font-montserrat font-semibold text-[13px] transition-colors cursor-pointer ${
                    applicantType === 'pf'
                      ? 'bg-[var(--accent,#D83333)] text-white'
                      : 'text-[var(--text-muted,#A3ABB6)] hover:text-white bg-[var(--surface-2,#1B2431)]'
                  }`}
                >
                  Persoane Fizice
                </button>
                <button
                  type="button"
                  onClick={() => setApplicantType('pj')}
                  className={`h-9 px-4 rounded-[6px] font-montserrat font-semibold text-[13px] transition-colors cursor-pointer ${
                    applicantType === 'pj'
                      ? 'bg-[var(--accent,#D83333)] text-white'
                      : 'text-[var(--text-muted,#A3ABB6)] hover:text-white bg-[var(--surface-2,#1B2431)]'
                  }`}
                >
                  Persoane Juridice (Firme)
                </button>
              </div>

              {applicantType === 'pf' ? (
                <ul className="space-y-1.5 font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Act de identitate (carte de identitate valabilă)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Vechime de minimum 3 luni la actualul loc de muncă</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Se acceptă venituri din salarii, pensii, contracte externe sau diurne</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-1.5 font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Certificat de Înregistrare (CUI) și act constitutiv firmă</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Ultimul bilanț contabil și ultima balanță încheiată</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-text,#F04D4D)] shrink-0" />
                    <span>Finanțare pe societăți comerciale, PFA sau profesii liberale</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Dreapta: 6 Cols (Simulator Rate Integrat) */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-[var(--r-lg,24px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line,rgba(255,255,255,0.08))] mb-6">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[var(--accent-text,#F04D4D)]" />
                  <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)]">
                    Simulator rată lunară
                  </h3>
                </div>
                <span className="text-[12px] font-open-sans text-[var(--text-muted,#A3ABB6)]">
                  Calcul estimativ
                </span>
              </div>

              {/* Slider 1: Preț Vehicul */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)]">
                    Preț automobil (€)
                  </label>
                  <span className="font-montserrat font-bold text-[16px] text-[var(--text,#F4F6F9)] tabular-nums">
                    {formatPriceEur(priceEur)}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={45000}
                  step={500}
                  value={priceEur}
                  onChange={(e) => setPriceEur(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--surface-2,#1B2431)] rounded-lg cursor-pointer accent-[var(--accent,#D83333)]"
                />
              </div>

              {/* Slider 2: Plată Inițială (termen conform cerinței, termen conform cerinței) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)]">
                    Plată inițială ({downPaymentPct}%)
                  </label>
                  <span className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)] tabular-nums">
                    {formatPriceEur(downPaymentEur)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--surface-2,#1B2431)] rounded-lg cursor-pointer accent-[var(--accent,#D83333)]"
                />
                <div className="flex justify-between text-[11px] font-open-sans text-[var(--text-muted,#A3ABB6)] mt-1">
                  <span>0% (fără plată inițială)</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Slider 3: Perioadă */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)]">
                    Perioadă rambursare
                  </label>
                  <span className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)] tabular-nums">
                    {months} luni ({Math.round(months / 12)} {months / 12 === 1 ? 'an' : 'ani'})
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={60}
                  step={12}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--surface-2,#1B2431)] rounded-lg cursor-pointer accent-[var(--accent,#D83333)]"
                />
                <div className="flex justify-between text-[11px] font-open-sans text-[var(--text-muted,#A3ABB6)] mt-1">
                  <span>12 luni</span>
                  <span>60 luni (5 ani)</span>
                </div>
              </div>

              {/* Afișaj Rată Estimată Mare */}
              <div className="p-5 rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-center mb-6">
                <span className="text-[11px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] block mb-1">
                  Rată lunară estimată
                </span>
                <div className="font-montserrat font-extrabold text-[40px] sm:text-[48px] text-[var(--accent-text,#F04D4D)] tabular-nums leading-none tracking-tight">
                  {monthlyRateEur} €<span className="text-[18px] sm:text-[22px] font-normal text-[var(--text-muted,#A3ABB6)]">/lună*</span>
                </div>
                <div className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-1.5 tabular-nums">
                  aproximativ {monthlyRateRon.toLocaleString('ro-RO')} RON / lună
                </div>
              </div>

              {/* Consilier Finanțare Direct & Butoane */}
              <div className="pt-2 border-t border-[var(--line,rgba(255,255,255,0.08))] flex flex-col sm:flex-row items-center justify-between gap-3">
                {financePhone && (
                  <a
                    href={`tel:${financePhoneClean}`}
                    className="w-full sm:w-auto h-11 px-4 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] flex items-center justify-center gap-2 border border-[var(--line,rgba(255,255,255,0.08))] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[var(--accent-text,#F04D4D)]" />
                    <span>Sună: {financePhone}</span>
                  </a>
                )}

                {financeWa && (
                  <a
                    href={`https://wa.me/${financeWa}?text=${encodeURIComponent(`Bună ziua! Doresc o simulare de finanțare pentru un vehicul de ${priceEur} € cu plata inițială de ${downPaymentPct}% pe ${months} luni.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto h-11 px-5 rounded-[var(--r-sm,8px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[13px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Aplică pe WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Disclaimer Legal Conform OUG 50/2010 */}
              <p className="mt-4 text-[12px] font-open-sans text-[var(--text-muted,#A3ABB6)] text-center leading-normal">
                *Simulare cu titlu informativ. Dobânda, ratele și condițiile finale de creditare sau leasing sunt stabilite direct de instituția finanțatoare parteneră, în funcție de profilul solicitantului.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
