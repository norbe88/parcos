import React from 'react';
import { Phone, MessageCircle, Car, Search } from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { resolveDealerContact } from '../../utils/helpers';
import { trackConversionEvent } from '../../services/telemetryService';

interface MobileShowroomDockProps {
  dealer?: DealerProfile;
}

export const MobileShowroomDock: React.FC<MobileShowroomDockProps> = ({ dealer }) => {
  const contact = resolveDealerContact(dealer);
  const salesPhoneClean = contact.salesPhoneClean;
  const salesWhatsApp = contact.salesWhatsApp;

  const handleOpenCarsSearch = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Notifică navbar-ul / topbar-ul să deschidă filtrul de căutare simplist sub top bar
    window.dispatchEvent(new CustomEvent('parcos:toggle-quick-search'));

    // 2. Defilează lin la catalogul de mașini (#catalog)
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      const headerOffset = 70;
      const elementPosition = catalogEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  if (!salesPhoneClean && !salesWhatsApp) return null;

  return (
    <div 
      aria-label="Acțiuni rapide mobil"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface,#131A24)]/95 backdrop-blur-xl border-t border-[var(--line,rgba(255,255,255,0.08))] px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] no-print transition-colors"
    >
      <div className="flex items-center gap-2 h-11">
        {/* Buton 1: Caută / Toate Mașinile (Car cu Lupă în spate/lângă) */}
        <button
          type="button"
          onClick={handleOpenCarsSearch}
          className="flex-1 h-full rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-bold text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.12))] transition-colors touch-manipulation active:scale-[0.98] cursor-pointer select-none"
          title="Caută mașini în stoc sau deschide filtrul rapid"
        >
          <span className="relative flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
            {/* Lupă în spate */}
            <Search className="w-3.5 h-3.5 text-[var(--accent-text,#D83333)] absolute -top-0.5 -right-0.5 stroke-[2.5] opacity-85" />
            {/* Mașină în față */}
            <Car className="w-4 h-4 text-[var(--text,#F4F6F9)] relative z-10 stroke-[2.2]" />
          </span>
          <span className="truncate">Mașini</span>
        </button>

        {/* Buton 2: Sună (Outline Style) */}
        {salesPhoneClean && (
          <a
            href={`tel:${salesPhoneClean}`}
            onClick={() => trackConversionEvent('click_phone', { source: 'mobile_dock' }, dealer?.slug)}
            className="flex-1 h-full rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-bold text-[13px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.12))] transition-colors touch-manipulation active:scale-[0.98] select-none"
          >
            <Phone className="w-3.5 h-3.5 text-[var(--metal,#C9CED6)] shrink-0" />
            <span className="truncate">Sună</span>
          </a>
        )}

        {/* Buton 3: WhatsApp (Brand Green) */}
        {salesWhatsApp && (
          <a
            href={`https://wa.me/${salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc detalii despre mașinile din stocul ${dealer?.name || 'Showroom'}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversionEvent('click_whatsapp', { source: 'mobile_dock' }, dealer?.slug)}
            className="flex-1 h-full rounded-[var(--r-md,14px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md transition-colors touch-manipulation active:scale-[0.98] select-none"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="truncate">WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
};
