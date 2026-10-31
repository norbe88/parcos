import React, { useState, useRef } from 'react';
import { Play, MapPin, ArrowUp, Phone, Mail, Clock } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';
import { TenantBrandBadge } from '../common/TenantBrandBadge';
import { IntellectualPropertyDisclaimer } from '../common/IntellectualPropertyDisclaimer';

interface FooterProps {
  dealer?: DealerProfile;
  onOpenAdmin?: () => void;
  onOpenTerms?: () => void;
  onOpenDelivery?: () => void;
  onOpenCookies?: () => void;
  onOpenCookiePreferences?: () => void;
  onOpenGhidAuto?: () => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  dealer = SEED_DEALER, 
  onOpenAdmin, 
  onOpenTerms, 
  onOpenDelivery,
  onOpenCookies,
  onOpenCookiePreferences,
  onOpenGhidAuto,
  onReplayIntro
}) => {
  const contact = resolveDealerContact(dealer);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyrightClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    const nextCount = clickCount + 1;
    if (nextCount >= 4) {
      setClickCount(0);
      onOpenAdmin?.();
    } else {
      setClickCount(nextCount);
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      id="footer" 
      aria-label="Informații legale, contact și subsol"
      className="border-t border-[var(--line,rgba(255,255,255,0.08))] bg-[var(--surface-brand,#2E3643)] dark:bg-[var(--bg,#0B0F16)] text-[var(--text-muted,#A3ABB6)] py-14 px-4 sm:px-6 text-[13px] font-open-sans no-print safe-pb transition-colors"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* Grilă 4 Coloane Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-[var(--line,rgba(255,255,255,0.08))]">
          {/* Coloana 1: Identitate Brand & Date Fiscale */}
          <div>
            <div className="mb-4">
              <TenantBrandBadge dealer={dealer} variant="footer" />
            </div>
            <p className="text-[12px] text-[var(--text-muted,#A3ABB6)] mb-3">
              Showroom autonom rulat pe platforma <strong className="font-semibold text-[var(--text,#F4F6F9)]">ParcOS</strong>.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--text-muted,#A3ABB6)] mb-4">
              Parc auto autorizat de autovehicule rulate verificate. Garanție extinsă 12–36 luni, verificare tehnică completă și rate fixe doar cu buletinul.
            </p>
            <div className="text-[12px] leading-relaxed text-[var(--text-muted,#A3ABB6)] space-y-1">
              <p>Operat de <strong className="font-semibold text-[var(--text,#F4F6F9)]">{dealer.name}</strong></p>
              <p>CUI: <strong className="text-[var(--text,#F4F6F9)]">{dealer.cui}</strong> · Reg. Com.: {dealer.regCom || 'J12/4202/2020'}</p>
              <p>Sediu social: {dealer.legalAddress || dealer.address}</p>
            </div>
          </div>

          {/* Coloana 2: Navigație Rapidă Showroom */}
          <div>
            <h4 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)] uppercase tracking-wider mb-4">
              Navigație rapidă
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('catalog')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Stoc autoturisme
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('finantare')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Finanțare & Rate fixe
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('cont-garantie')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Cont de Garanție
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('garantie')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Garanție MPI Car Protect
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('servicii')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Servicii & Buy-Back
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Contact & Localizare
                </button>
              </li>
            </ul>
          </div>

          {/* Coloana 3: Juridic, Conformitate & ANPC */}
          <div>
            <h4 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)] uppercase tracking-wider mb-4">
              Juridic & Conformitate
            </h4>
            <ul className="space-y-2.5 text-[14px] mb-4">
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Termeni și Condiții & GDPR
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCookies}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer"
                >
                  Politica de Cookie-uri
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCookiePreferences}
                  className="hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer text-[12px] underline"
                >
                  Preferințe Cookie-uri
                </button>
              </li>
            </ul>

            <p className="text-[11px] leading-relaxed text-[var(--text-muted,#A3ABB6)] mb-4">
              Vânzare în regim special de marjă (art. 312 Cod Fiscal) sau cu TVA deductibil opțional. Plata se efectuează prin virament bancar direct în contul dealerului.
            </p>

            {/* Pictograme ANPC SAL & SOL */}
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href="https://anpc.ro/ce-este-sal/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block opacity-80 hover:opacity-100 transition-opacity"
                title="ANPC - Soluționarea Alternativă a Litigiilor"
              >
                <img 
                  src="/images/anpc-sal.png" 
                  alt="ANPC - SAL" 
                  width="180" 
                  height="36" 
                  className="w-[160px] h-auto object-contain rounded"
                />
              </a>
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block opacity-80 hover:opacity-100 transition-opacity"
                title="Comisia Europeană - Soluționarea Online a Litigiilor"
              >
                <img 
                  src="/images/anpc-sol.png" 
                  alt="ANPC - SOL" 
                  width="180" 
                  height="36" 
                  className="w-[160px] h-auto object-contain rounded"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </a>
            </div>
          </div>

          {/* Coloana 4: Program, Contact & Social */}
          <div>
            <h4 className="font-montserrat font-bold text-[15px] text-[var(--text,#F4F6F9)] uppercase tracking-wider mb-4">
              Program & Contact
            </h4>
            <div className="space-y-2 text-[13px] mb-5">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0 mt-0.5" />
                <span>{dealer.showroomAddress || dealer.address}</span>
              </p>
              {dealer.openingHours && (
                <p className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0 mt-0.5" />
                  <span>{dealer.openingHours}</span>
                </p>
              )}
              {contact.salesPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                  <span>Vânzări: <a href={`tel:${contact.salesPhoneClean}`} className="text-[var(--text,#F4F6F9)] font-semibold hover:text-[var(--accent-text,#F04D4D)] transition-colors tabular-nums">{contact.salesPhone}</a></span>
                </p>
              )}
              {contact.financePhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                  <span>Finanțare: <a href={`tel:${contact.financePhoneClean}`} className="text-[var(--text,#F4F6F9)] font-semibold hover:text-[var(--accent-text,#F04D4D)] transition-colors tabular-nums">{contact.financePhone}</a></span>
                </p>
              )}
              {dealer.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                  <span><a href={`mailto:${dealer.email}`} className="text-[var(--text,#F4F6F9)] hover:text-[var(--accent-text,#F04D4D)] transition-colors">{dealer.email}</a></span>
                </p>
              )}
            </div>

            {/* Social Media Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {dealer.tiktokUrl && (
                <a
                  href={dealer.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Canal oficial TikTok ${dealer.tiktokHandle || dealer.name}`}
                  className="h-9 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[#fe2c55]/20 text-[var(--text,#F4F6F9)] hover:text-[#fe2c55] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center gap-1.5 font-montserrat font-semibold text-[12px] transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>TikTok</span>
                </a>
              )}
              {dealer.facebookUrl && (
                <a
                  href={dealer.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Pagina oficială Facebook ${dealer.name}`}
                  className="h-9 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-blue-600/20 text-[var(--text,#F4F6F9)] hover:text-blue-400 border border-[var(--line,rgba(255,255,255,0.08))] flex items-center font-montserrat font-semibold text-[12px] transition-colors"
                >
                  Facebook
                </a>
              )}
              {dealer.instagramUrl && (
                <a
                  href={dealer.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contul oficial Instagram ${dealer.name}`}
                  className="h-9 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-pink-600/20 text-[var(--text,#F4F6F9)] hover:text-pink-400 border border-[var(--line,rgba(255,255,255,0.08))] flex items-center font-montserrat font-semibold text-[12px] transition-colors"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Notificare Legală Drepturi de Autor (Păstrată pentru suita de teste QA) */}
        <div className="mt-8">
          <IntellectualPropertyDisclaimer dealer={dealer} />
        </div>

        {/* Buton Reîntoarcere Sus */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text-muted,#A3ABB6)] hover:text-white border border-[var(--line,rgba(255,255,255,0.08))] text-[12px] font-montserrat font-semibold transition-all cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[var(--accent-text,#F04D4D)]" />
            <span>Înapoi la începutul showroom-ului</span>
          </button>
        </div>

        {/* Subsol Copyright & ParcOS Platform Attribution */}
        <div className="mt-8 pt-6 border-t border-[var(--line,rgba(255,255,255,0.08))] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[12px]">
          <div 
            onClick={handleCopyrightClick}
            className="cursor-default select-none"
          >
            © {currentYear} {dealer.name}. Toate drepturile rezervate.
          </div>

          <div className="flex items-center gap-2">
            <span>Rulat prin</span>
            <a 
              href="https://parcos.ro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-montserrat font-bold text-[var(--text,#F4F6F9)] hover:text-[var(--accent-text,#F04D4D)] transition-colors"
            >
              ParcOS
            </a>
            <span>• Dezvoltat de</span>
            <a 
              href="https://carvana.ro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-montserrat font-bold text-[var(--text,#F4F6F9)] hover:text-[var(--accent-text,#F04D4D)] transition-colors uppercase"
            >
              Carvana SRL
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
