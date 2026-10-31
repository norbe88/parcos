import React, { useState } from 'react';
import { ArrowLeftRight, Truck, Wrench, FileText, ArrowRight, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';

interface ServicesSectionProps {
  dealer: DealerProfile;
  landingConfig?: DealerLandingConfig;
  showToast?: (msg: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  dealer,
  landingConfig,
  showToast
}) => {
  const contact = resolveDealerContact(dealer);
  const [isBuyBackModalOpen, setIsBuyBackModalOpen] = useState(false);

  // Formular rapid Buy-Back
  const [bbBrand, setBbBrand] = useState('');
  const [bbYear, setBbYear] = useState('');
  const [bbKm, setBbKm] = useState('');
  const [bbPhone, setBbPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyBackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsBuyBackModalOpen(false);
      if (showToast) {
        showToast('Solicitarea ta de Buy-Back a fost transmisă! Te vom contacta în scurt timp.');
      }
      setBbBrand('');
      setBbYear('');
      setBbKm('');
      setBbPhone('');
    }, 600);
  };

  return (
    <section 
      id="servicii"
      aria-label="Servicii Integrate și Buy-Back Showroom"
      className="py-14 md:py-24 bg-[var(--bg,#0B0F16)] text-[var(--text,#F4F6F9)] border-b border-[var(--line,rgba(255,255,255,0.08))] scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Antet Secțiune */}
        <div className="max-w-2xl mb-12">
          <div className="font-montserrat font-semibold text-[12px] uppercase tracking-[0.16em] text-[var(--accent-text,#F04D4D)] mb-2">
            Servicii complete
          </div>
          <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em]">
            Servicii transparente incluse la predare
          </h2>
          <p className="font-open-sans text-[15px] sm:text-[16px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mt-2">
            Nu vindem doar mașini, ci oferim un pachet complet de mobilitate: evaluare trade-in, transport asigurat, revizie tehnică și suport pentru înmatriculare.
          </p>
        </div>

        {/* Grilă de 4 Carduri pe fundal --surface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Buy-Back */}
          <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] mb-5">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)] mb-2">
                Buy-Back Transparent
              </h3>
              <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-6">
                Evaluăm mașina ta veche pe loc. Valoarea ei se scade direct din prețul final sau constituie plata inițială pentru mașina nouă aleasă.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsBuyBackModalOpen(true)}
              className="h-11 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--accent,#D83333)] text-[var(--text,#F4F6F9)] hover:text-white font-montserrat font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.08))] transition-colors cursor-pointer"
            >
              <span>Evaluează mașina</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Livrare la Domiciliu */}
          <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] mb-5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)] mb-2">
                Livrare la Domiciliu
              </h3>
              <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-6">
                Îți aducem mașina acasă, pe platformă proprie autorizată, gratuit oriunde în România, în condiții de maximă siguranță.
              </p>
            </div>

            {contact.salesWhatsApp && (
              <a
                href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc detalii despre livrarea la domiciliu oferită de ${dealer.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.08))] transition-colors"
              >
                <span>Întreabă pe WhatsApp</span>
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              </a>
            )}
          </div>

          {/* Card 3: Revizie la Predare */}
          <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] mb-5">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)] mb-2">
                Revizie la Predare
              </h3>
              <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-6">
                Fiecare automobil pleacă cu revizia tehnică efectuată gratuit: schimb de ulei și filtre noi, verificat în 120 de puncte.
              </p>
            </div>

            <div className="h-11 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)]/50 text-[var(--text-muted,#A3ABB6)] font-open-sans text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.08))]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Inclus gratuit în preț</span>
            </div>
          </div>

          {/* Card 4: Înmatriculare Asistată */}
          <div className="p-6 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center text-[var(--accent-text,#F04D4D)] mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)] mb-2">
                Înmatriculare Asistată
              </h3>
              <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] leading-relaxed mb-6">
                Eliberăm numere roșii provizorii pe loc și îți pregătim dosarul complet de acte pentru înmatricularea definitivă fără cozi.
              </p>
            </div>

            <div className="h-11 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)]/50 text-[var(--text-muted,#A3ABB6)] font-open-sans text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.08))]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Numere roșii pe loc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Pop-up Formular Buy-Back */}
      {isBuyBackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[var(--r-lg,24px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.12))] p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsBuyBackModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-montserrat font-semibold uppercase text-[var(--accent-text,#F04D4D)] mb-1">
                Trade-in auto
              </div>
              <h3 className="font-montserrat font-bold text-[22px] text-[var(--text,#F4F6F9)]">
                Evaluează mașina ta actuală
              </h3>
              <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-1">
                Completează datele esențiale și te contactăm cu o ofertă fermă în cel mai scurt timp.
              </p>
            </div>

            <form onSubmit={handleBuyBackSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-montserrat font-semibold text-[var(--text-muted,#A3ABB6)] mb-1">
                  Marcă & Model autoturism actual *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: VW Golf 7, Dacia Duster, BMW Seria 3..."
                  value={bbBrand}
                  onChange={(e) => setBbBrand(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] focus:outline-none focus:border-[var(--accent,#D83333)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-montserrat font-semibold text-[var(--text-muted,#A3ABB6)] mb-1">
                    An fabricație *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 2018"
                    value={bbYear}
                    onChange={(e) => setBbYear(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] focus:outline-none focus:border-[var(--accent,#D83333)]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-montserrat font-semibold text-[var(--text-muted,#A3ABB6)] mb-1">
                    Kilometraj aproximativ *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 145000"
                    value={bbKm}
                    onChange={(e) => setBbKm(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] focus:outline-none focus:border-[var(--accent,#D83333)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-montserrat font-semibold text-[var(--text-muted,#A3ABB6)] mb-1">
                  Număr de telefon pentru ofertă *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="07xx xxx xxx"
                  value={bbPhone}
                  onChange={(e) => setBbPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] focus:outline-none focus:border-[var(--accent,#D83333)]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 shadow-[var(--shadow-cta)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <span>Se transmite...</span> : <span>Trimite solicitarea de evaluare</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
