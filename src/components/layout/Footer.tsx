import React, { useState, useRef } from 'react';
import { Play, MapPin, ArrowUp } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { resolveDealerContact } from '../../utils/helpers';
import { TenantBrandBadge } from '../common/TenantBrandBadge';
import { IntellectualPropertyDisclaimer } from '../common/IntellectualPropertyDisclaimer';

interface FooterProps {
  dealer?: typeof SEED_DEALER;
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

  // Scurtătură secretă: 4 click-uri consecutive pe copyright pentru deschiderea portalului admin
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
      }, 1500); // Fereastră de 1.5 secunde între click-uri
    }
  };

  return (
    <footer id="contact" className="mt-20 border-t border-white/[0.08] bg-[#0c0c0e] py-12 px-4 sm:px-8 text-xs text-zinc-400 no-print safe-pb">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="mb-4">
            <TenantBrandBadge dealer={dealer} variant="footer" />
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Dealer auto autorizat în Cluj-Napoca. Autovehicule rulate atent selectate, garanție până la 36 luni, finanțare în rate cu buletinul și livrare în toată țara.
          </p>
          <div className="mt-3 text-xs leading-relaxed text-zinc-300 space-y-1">
            <p>Operat de <strong className="font-semibold text-white">{dealer.name}</strong></p>
            <p className="text-zinc-400 text-[11px] leading-normal">
              CUI: <strong className="text-zinc-300">{dealer.cui}</strong> · Reg. Com.: <strong className="text-zinc-300">{dealer.regCom || 'J12/3012/13.07.2023'}</strong> · Cap. Social: <strong className="text-zinc-300">{dealer.shareCapital || '200 RON'}</strong><br />
              Sediu Social: {dealer.legalAddress}<br />
              Showroom & Parc Auto: {dealer.showroomAddress || dealer.address}
            </p>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Dezvoltat de{' '}
            <a 
              href="https://carvana.ro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold tracking-wide text-amber-400 hover:text-amber-300 transition-colors uppercase"
            >
              Carvana SRL
            </a>
          </p>
          
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenDelivery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-semibold transition-all cursor-pointer"
            >
              <span>🚚 Livrare în toată România</span>
            </button>
            {onOpenGhidAuto && (
              <button
                type="button"
                onClick={onOpenGhidAuto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>📘 Ghid Auto 2026</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTerms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
            >
              <span>📄 Termeni & GDPR</span>
            </button>
            <button
              type="button"
              onClick={onOpenCookies}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
            >
              <span>🍪 Politica Cookies</span>
            </button>
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-zinc-400 hover:text-amber-300 text-[11px] font-semibold transition-all cursor-pointer"
                title="Reia animația de deschidere a showroom-ului"
              >
                <span>🎬 Replay Intro</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="font-bold text-white text-sm mb-2">Parteneri Finanțare Auto</div>
          <p className="leading-relaxed">
            Aprobare dosar de finanțare în 2 ore pe loc sau online:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {dealer.financingPartners.map((p, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-zinc-200 font-medium">
                {p}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-300 font-medium">
            Consultanță Credite & Leasing: {contact.financePhone}
          </p>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <div className="font-bold text-white text-xs mb-1.5">Urmărește-ne pe Social Media:</div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a 
                href={dealer.tiktokUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Canal oficial TikTok ${dealer.tiktokHandle}`}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 hover:bg-[#fe2c55]/20 text-zinc-300 hover:text-[#fe2c55] border border-white/10 transition-colors flex items-center gap-1.5 font-medium touch-manipulation active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> TikTok {dealer.tiktokHandle}
              </a>
              <a 
                href={dealer.facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Pagina oficială Facebook ${dealer.name}`}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-600/20 text-zinc-300 hover:text-blue-400 border border-white/10 transition-colors flex items-center gap-1.5 font-medium touch-manipulation active:scale-95"
              >
                Facebook
              </a>
              <a 
                href={dealer.instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Contul oficial Instagram ${dealer.name}`}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/5 hover:bg-pink-600/20 text-zinc-300 hover:text-pink-400 border border-white/10 transition-colors flex items-center gap-1.5 font-medium touch-manipulation active:scale-95"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="font-bold text-white text-sm mb-2">Showroom Cluj & Locație</div>
          <p className="mt-1.5 text-zinc-300 font-semibold text-xs">Departament Vânzări: {dealer.phonePrimary}</p>
          <p className="mt-0.5 text-amber-300 font-semibold text-xs">Consultanță Finanțare: {dealer.phoneFinance || dealer.phoneSecondary}</p>
          <p className="mt-0.5 text-amber-300 font-medium text-xs">Email: {dealer.email}</p>
          <p className="mt-0.5 text-zinc-400 text-[11px]">Program: {dealer.openingHours}</p>

          {/* Butoane Navigație Rapidă Google Maps & Waze */}
          <div className="mt-3 flex items-center gap-2.5">
            <a 
              href={dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.address)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors border border-white/10 shadow-sm touch-manipulation active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Google Maps</span>
            </a>
            <a 
              href={dealer.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(dealer.address)}&navigate=yes`}
              target="_blank" 
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm touch-manipulation active:scale-[0.98]"
            >
              <span>Waze</span>
            </a>
          </div>
        </div>
      </div>

      {/* Notificare Legală Drepturi de Autor & Protecție Recoltare Date (Legea nr. 8/1996) */}
      <div className="max-w-7xl mx-auto mt-8">
        <IntellectualPropertyDisclaimer dealer={dealer} />
      </div>

      {/* 🔝 Revenire Rapidă la Începutul Showroom-ului (Headroom / Top Anchor) */}
      <div className="max-w-7xl mx-auto mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-amber-500/10 active:scale-95 border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-amber-300 text-xs font-medium tracking-wide transition-all shadow-sm cursor-pointer touch-manipulation"
          aria-label="Înapoi la Începutul Showroom-ului — Revenire fluidă la începutul paginii"
        >
          <ArrowUp className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
          <span>Înapoi la Începutul Showroom-ului</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/[0.06] flex flex-col xl:flex-row items-center justify-between gap-4 text-center xl:text-left text-[11px] text-zinc-400">
        <div 
          onClick={handleCopyrightClick}
          className="cursor-default select-none flex flex-wrap items-center justify-center xl:justify-start gap-x-2 gap-y-1"
        >
          <span>© {new Date().getFullYear()} {dealer.name}. Toate drepturile rezervate.</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span>
            Dezvoltat de{' '}
            <a 
              href="https://carvana.ro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold tracking-wide text-amber-400 hover:text-amber-300 transition-colors uppercase"
            >
              Carvana SRL
            </a>
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-end gap-4 text-[10.5px]">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onOpenDelivery}
              className="hover:text-amber-400 text-zinc-300 font-semibold transition-colors cursor-pointer"
            >
              Livrare în toată România
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-amber-400 text-zinc-300 font-semibold transition-colors cursor-pointer"
            >
              Termeni și Condiții
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={onOpenCookies}
              className="hover:text-amber-400 text-zinc-300 font-semibold transition-colors cursor-pointer"
            >
              Politica Cookies
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={onOpenCookiePreferences}
              className="hover:text-amber-400 text-zinc-400 transition-colors cursor-pointer"
            >
              Preferințe Cookie-uri
            </button>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Garanție până la 36 Luni (12L Standard)</span>
          </div>

          {/* Pictogramă Oficială ANPC SAL conform Ordinului ANPC nr. 449/2022 */}
          <a 
            href="https://anpc.ro/ce-este-sal/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center shrink-0 opacity-90 hover:opacity-100 active:scale-[0.98] transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 rounded"
            title="ANPC - Soluționarea Alternativă a Litigiilor"
          >
            <img 
              src="/images/anpc-sal.png" 
              alt="ANPC - Soluționarea Alternativă a Litigiilor" 
              width="250" 
              height="50" 
              className="w-[175px] sm:w-[180px] h-[35px] sm:h-[36px] object-contain rounded"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};
