import React, { useState } from 'react';
import { MapPin, Clock, Phone, SlidersHorizontal } from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { SEED_DEALER } from '../../db/seed';
import { resolveDealerContact } from '../../utils/helpers';
import { NavigationModal } from '../modals/NavigationModal';

interface TopbarProps {
  viewMode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin' | 'ghid-auto';
  setViewMode: (mode: 'showroom' | 'admin' | 'terms' | 'delivery' | 'cookies' | 'saas' | 'superadmin' | 'ghid-auto') => void;
  dealer?: DealerProfile;
  isRevealed?: boolean;
}

export const MpiTopbar: React.FC<TopbarProps> = ({
  viewMode,
  setViewMode,
  dealer = SEED_DEALER,
  isRevealed = true
}) => {
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const contact = resolveDealerContact(dealer);

  const displayAddress = dealer.showroomAddress || dealer.address || `${dealer.city || 'Cluj-Napoca'}, jud. ${dealer.county || 'Cluj'}`;
  const salesPhone = contact.salesPhone;
  const salesPhoneClean = contact.salesPhoneClean;
  const financePhone = contact.financePhone;
  const financePhoneClean = contact.financePhoneClean;

  return (
    <>
      <div 
        className={`hidden md:block h-9 bg-[var(--surface-2,#1B2431)] border-b border-[var(--line,rgba(255,255,255,0.08))] text-[13px] text-[var(--text-muted,#A3ABB6)] font-open-sans select-none no-print transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-[1240px] h-full mx-auto px-6 flex items-center justify-between gap-4">
          {/* Stânga: Adresă fizică și Program de lucru */}
          <div className="flex items-center gap-6 min-w-0">
            <button
              type="button"
              onClick={() => setIsNavModalOpen(true)}
              className="flex items-center gap-1.5 text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] transition-colors cursor-pointer text-left truncate group"
              title="Deschide adresa în Google Maps sau Waze"
              aria-label={`Deschide locația în hărți: ${displayAddress}`}
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--metal,#C9CED6)] group-hover:text-[var(--accent-text,#F04D4D)] transition-colors shrink-0" />
              <span className="truncate underline decoration-white/20 group-hover:decoration-[var(--accent,#D83333)] underline-offset-2">
                {displayAddress}
              </span>
            </button>

            {dealer.openingHours && (
              <span className="flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-[var(--metal,#C9CED6)] shrink-0" />
                <span className="truncate">{dealer.openingHours}</span>
              </span>
            )}
          </div>

          {/* Dreapta: Telefoane Vânzări & Finanțare */}
          <div className="flex items-center gap-4 shrink-0">
            {salesPhone && (
              <a 
                href={`tel:${salesPhoneClean}`}
                className="flex items-center gap-1.5 hover:text-[var(--text,#F4F6F9)] transition-colors"
                title="Consultanță Vânzări Showroom"
              >
                <Phone className="w-3.5 h-3.5 text-[var(--metal,#C9CED6)] shrink-0" />
                <span><span className="text-[var(--text-muted,#A3ABB6)]/70">Vânzări:</span> <strong className="font-semibold text-[var(--text,#F4F6F9)] tabular-nums">{salesPhone}</strong></span>
              </a>
            )}

            {financePhone && (
              <a 
                href={`tel:${financePhoneClean}`}
                className="flex items-center gap-1.5 hover:text-[var(--text,#F4F6F9)] transition-colors"
                title="Consultanță Finanțare & Rate"
              >
                <span className="text-white/20">|</span>
                <span><span className="text-[var(--text-muted,#A3ABB6)]/70">Finanțare:</span> <strong className="font-semibold text-[var(--text,#F4F6F9)] tabular-nums">{financePhone}</strong></span>
              </a>
            )}

            {dealer.email && (
              <a 
                href={`mailto:${dealer.email}`}
                className="hidden lg:flex items-center gap-1 hover:text-[var(--text,#F4F6F9)] transition-colors truncate"
              >
                <span className="text-white/20">|</span>
                <span className="truncate">{dealer.email}</span>
              </a>
            )}

            {/* Revenire Showroom pentru modurile secundare */}
            {viewMode !== 'showroom' && viewMode !== 'saas' && viewMode !== 'superadmin' && (
              <button 
                type="button"
                onClick={() => setViewMode('showroom')}
                className="ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] hover:bg-[var(--accent,#D83333)] transition-colors flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>← Showroom</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <NavigationModal 
        isOpen={isNavModalOpen} 
        onClose={() => setIsNavModalOpen(false)} 
        dealer={dealer} 
      />
    </>
  );
};
