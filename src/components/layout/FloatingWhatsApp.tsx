import React from 'react';
import { MessageCircle } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  whatsappNumber = SEED_DEALER.whatsappNumber
}) => {
  return (
    <aside aria-label="Asistență rapidă WhatsApp" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-6 sm:bottom-6 z-40 no-print">
      <a
        href={`https://wa.me/${whatsappNumber}?text=Bună%20ziua,%20doresc%20informații%20despre%20stocul%20RXM%20Automobile.`}
        target="_blank" 
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-emerald-950 shadow-[0_4px_25px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_35px_rgba(37,211,102,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px]"
      >
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-950 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-950"></span>
        </span>
        <MessageCircle className="w-5 h-5 text-emerald-950 fill-none shrink-0" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only flex flex-col text-left leading-none">
          <span className="text-[10px] text-emerald-950/80 font-bold">Asistență Live</span>
          <span className="text-xs font-black text-emerald-950 mt-0.5">WhatsApp</span>
        </span>
      </a>
    </aside>
  );
};
