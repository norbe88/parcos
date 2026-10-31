import React from 'react';
import { ShieldCheck, ArrowRight, MessageCircle, Phone, Lock, Banknote, CalendarCheck } from 'lucide-react';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';
import { PlaceholderBadge } from '../common/PlaceholderBadge';

interface WarrantyDepositSectionProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
}

export const WarrantyDepositSection: React.FC<WarrantyDepositSectionProps> = ({
  dealer,
  landingConfig
}) => {
  const contact = resolveDealerContact(dealer);
  const bankName = dealer.bankName || 'Banca Transilvania';
  const depositConfig = landingConfig?.warrantyDeposit;

  const depositAmountEur = depositConfig?.amountEur ?? 500;
  const lockDays = depositConfig?.lockDays ?? depositConfig?.daysLimit ?? 5;

  const isDepositConfigMissing = !depositConfig?.amountEur;

  return (
    <section 
      id="cont-garantie"
      aria-label="Cont de Garanție și Blocare Automobil"
      className="py-14 md:py-24 bg-[var(--bg,#0B0F16)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="p-8 md:p-12 rounded-[var(--r-lg,24px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] relative overflow-hidden">
          {/* Accent glow subtil */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent,#D83333)]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Antet Secțiune */}
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent,#D83333)]/10 text-[var(--accent-text,#F04D4D)] text-[12px] font-montserrat font-semibold uppercase tracking-[0.14em] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garanție de blocare fără riscuri</span>
            </div>
            <h2 className="font-montserrat font-extrabold text-[30px] sm:text-[38px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em]">
              Blochează mașina în Contul de Garanție
            </h2>
            <p className="font-open-sans text-[15px] sm:text-[16px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mt-2">
              Ai găsit automobilul potrivit? Îl poți asigura imediat pentru tine printr-un transfer bancar transparent, 100% deductibil din prețul final.
            </p>
          </div>

          {/* 3 Pași Clari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Pasul 1 */}
            <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] font-montserrat font-extrabold text-[18px] mb-4">
                  01
                </div>
                <h3 className="font-montserrat font-bold text-[17px] text-[var(--text,#F4F6F9)] mb-2">
                  Alegi mașina și ceri proforma
                </h3>
                <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed">
                  Iei legătura cu consilierul nostru de vânzări și soliciți emiterea facturii proforme oficiale de blocare pe numele tău sau al companiei.
                </p>
              </div>
            </div>

            {/* Pasul 2 */}
            <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] font-montserrat font-extrabold text-[18px] mb-4">
                  02
                </div>
                <h3 className="font-montserrat font-bold text-[17px] text-[var(--text,#F4F6F9)] mb-2 flex items-center gap-2">
                  <span>Transferi {depositAmountEur} € direct</span>
                  {isDepositConfigMissing && <PlaceholderBadge label="Sumă cont garanție" />}
                </h3>
                <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed">
                  Efectuezi plata prin transfer bancar direct în contul <strong>{bankName}</strong> al dealerului <strong>{dealer.name}</strong>, menționat pe proformă.
                </p>
              </div>
            </div>

            {/* Pasul 3 */}
            <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] font-montserrat font-extrabold text-[18px] mb-4">
                  03
                </div>
                <h3 className="font-montserrat font-bold text-[17px] text-[var(--text,#F4F6F9)] mb-2">
                  Mașina e blocată {lockDays} zile
                </h3>
                <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed">
                  Vehiculul este retras de la vânzare timp de {lockDays} zile lucrătoare pentru tine, iar întreaga sumă din contul de garanție se scade din prețul final.
                </p>
              </div>
            </div>
          </div>

          {/* Microcopy de Siguranță & ParcOS Neutrality */}
          <div className="p-4 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] mb-8 flex items-center gap-3">
            <Lock className="w-5 h-5 text-[var(--accent-text,#F04D4D)] shrink-0" />
            <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)]">
              <strong>Notă de siguranță:</strong> ParcOS nu încasează și nu păstrează bani. Plata se realizează exclusiv prin virament bancar direct către <strong>{dealer.name}</strong>, pe baza facturii proforme emise.
            </p>
          </div>

          {/* Butoane CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {contact.salesWhatsApp && (
              <a
                href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc emiterea unei facturi proforme de ${depositAmountEur} € pentru blocarea unei mașini în Contul de Garanție.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-[52px] px-8 rounded-[var(--r-md,14px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>Cere proforma pe WhatsApp</span>
              </a>
            )}

            {contact.salesPhoneClean && (
              <a
                href={`tel:${contact.salesPhoneClean}`}
                className="w-full sm:w-auto h-[52px] px-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-bold text-[15px] flex items-center justify-center gap-2 border border-[var(--line,rgba(255,255,255,0.08))] transition-all touch-manipulation"
              >
                <Phone className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                <span>Sună consilier: {contact.salesPhone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
