import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
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

  if (!salesPhoneClean && !salesWhatsApp) return null;

  return (
    <div 
      aria-label="Acțiuni rapide mobil"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface,#131A24)]/95 backdrop-blur-xl border-t border-[var(--line,rgba(255,255,255,0.08))] px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] no-print"
    >
      <div className="flex items-center gap-3 h-11">
        {/* Buton 1: Sună (Outline Style) */}
        {salesPhoneClean && (
          <a
            href={`tel:${salesPhoneClean}`}
            onClick={() => trackConversionEvent('click_phone', { source: 'mobile_dock' }, dealer?.slug)}
            className="flex-1 h-full rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 border border-[var(--line,rgba(255,255,255,0.12))] transition-colors touch-manipulation active:scale-[0.98]"
          >
            <Phone className="w-4 h-4 text-[var(--metal,#C9CED6)]" />
            <span>Sună</span>
          </a>
        )}

        {/* Buton 2: WhatsApp (Brand Green) */}
        {salesWhatsApp && (
          <a
            href={`https://wa.me/${salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc detalii despre mașinile din stocul ${dealer?.name || 'Showroom'}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversionEvent('click_whatsapp', { source: 'mobile_dock' }, dealer?.slug)}
            className="flex-1 h-full rounded-[var(--r-md,14px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-colors touch-manipulation active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
};
