import React from 'react';
import { MessageCircle } from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { resolveDealerContact, normalizeWhatsAppNumber } from '../../utils/helpers';
import { trackConversionEvent } from '../../services/telemetryService';

interface FloatingWhatsAppProps {
  dealer?: DealerProfile;
  whatsappNumber?: string;
  dealerName?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  dealer,
  whatsappNumber,
  dealerName
}) => {
  const contact = resolveDealerContact(dealer);
  const targetNumber = contact.salesWhatsApp || (whatsappNumber ? normalizeWhatsAppNumber(whatsappNumber) : '');
  const brand = dealer?.name || dealerName || 'Showroom Auto';

  if (!targetNumber) return null;

  const defaultMsg = `Bună ziua, doresc informații despre stocul ${brand}.`;

  return (
    <aside 
      aria-label="Asistență rapidă WhatsApp" 
      className="hidden sm:block fixed bottom-6 right-6 z-40 no-print"
    >
      <a
        href={`https://wa.me/${targetNumber}?text=${encodeURIComponent(defaultMsg)}`}
        target="_blank" 
        rel="noopener noreferrer"
        aria-label={`Discută pe WhatsApp cu ${brand}`}
        onClick={() => trackConversionEvent('click_whatsapp', { source: 'floating_widget' }, dealer?.slug)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] shadow-[0_8px_30px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation"
        title="Asistență WhatsApp Showroom"
      >
        <span className="relative flex h-3 w-3 absolute -top-0.5 -right-0.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <MessageCircle className="w-7 h-7 fill-current" />

        {/* Tooltip pe hover */}
        <span className="absolute right-16 px-3 py-1.5 rounded-lg bg-[var(--surface,#131A24)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[12px] whitespace-nowrap border border-[var(--line,rgba(255,255,255,0.12))] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Discută pe WhatsApp
        </span>
      </a>
    </aside>
  );
};
