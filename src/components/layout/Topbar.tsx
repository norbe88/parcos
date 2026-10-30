import React, { useState } from 'react';
import { MapPin, Clock, Phone, SlidersHorizontal } from 'lucide-react';
import { SEED_DEALER } from '../../db/seed';
import { resolveDealerContact } from '../../utils/helpers';
import { NavigationModal } from '../modals/NavigationModal';

interface TopbarProps {
  viewMode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin';
  setViewMode: (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin') => void;
  dealer?: typeof SEED_DEALER;
  isRevealed?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  viewMode,
  setViewMode,
  dealer = SEED_DEALER,
  isRevealed = true
}) => {
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const contact = resolveDealerContact(dealer);

  return (
    <>
      <div className={`bg-[#121215] border-b border-white/[0.08] text-[12px] text-zinc-400 py-2 px-3 sm:px-8 no-print transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => setIsNavModalOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-300 active:scale-95 text-[11px] sm:text-xs truncate transition-all text-left group cursor-pointer focus:outline-none min-h-[32px] sm:min-h-0 py-0.5 rounded-md hover:bg-white/5 px-1 -mx-1"
              title="Deschide locația în Google Maps sau Waze"
              aria-label={`Deschide locația showroom-ului în Google Maps sau Waze: ${dealer.address}`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 group-hover:text-amber-300 transition-transform" />
              <span className="truncate underline decoration-zinc-600 underline-offset-2 group-hover:decoration-amber-400">
                <span className="sm:hidden font-semibold">Cluj-Napoca</span>
                <span className="hidden sm:inline">{dealer.address}</span>
              </span>
            </button>
          <span className="hidden md:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{dealer.openingHours}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <a 
            href={`tel:${contact.salesPhoneClean}`} 
            className="flex items-center gap-1.5 text-zinc-200 hover:text-amber-400 font-medium font-mono text-[11px] sm:text-xs whitespace-nowrap transition-colors min-h-[36px] px-2 py-1 rounded-lg hover:bg-white/5 touch-manipulation"
            title="Consultanță Vânzări & Showroom"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><span className="text-zinc-400 hidden sm:inline">Vânzări: </span>{contact.salesPhone}</span>
          </a>

          <a 
            href={`tel:${contact.financePhoneClean}`} 
            className="hidden lg:flex items-center gap-1.5 text-amber-300 hover:text-white font-medium font-mono text-[11px] sm:text-xs whitespace-nowrap transition-colors min-h-[36px] px-2 py-1 rounded-lg hover:bg-white/5 touch-manipulation"
            title="Consultanță Finanțare & Rate"
          >
            <span className="text-zinc-400">Rate: </span>
            <span>{contact.financePhone}</span>
          </a>
          
          <span className="text-zinc-600 hidden xl:inline">|</span>
          <a href={`mailto:${dealer.email}`} className="text-zinc-400 hover:text-amber-300 transition-colors hidden xl:inline">
            <span>{dealer.email}</span>
          </a>

          {/* Buton Ieșire Showroom afișat când administratorul sau pagina legală este activă */}
          {viewMode === 'admin' && (
            <button 
              type="button"
              onClick={() => setViewMode('showroom')}
              className="min-h-[36px] sm:h-7 px-2.5 sm:px-3 text-[11px] font-bold rounded-full flex items-center gap-1.5 transition-all shadow-md touch-manipulation active:scale-95 bg-amber-500 text-black shadow-amber-500/20"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>← Înapoi în Showroom</span>
            </button>
          )}

          {(viewMode === 'terms' || viewMode === 'delivery' || viewMode === 'cookies') && (
            <button 
              type="button"
              onClick={() => setViewMode('showroom')}
              className="min-h-[36px] sm:h-7 px-2.5 sm:px-3 text-[11px] font-bold rounded-full flex items-center gap-1.5 transition-all shadow-md touch-manipulation active:scale-95 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer"
            >
              <span>← Înapoi în Showroom</span>
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Modal / Pop-up Selectare Navigație (Google Maps vs Waze) */}
    <NavigationModal 
      isOpen={isNavModalOpen} 
      onClose={() => setIsNavModalOpen(false)} 
      dealer={dealer} 
    />
  </>
  );
};
