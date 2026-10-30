import React from 'react';
import { DealerProfile } from '../../db/types';

interface TenantBrandBadgeProps {
  dealer?: DealerProfile | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'navbar' | 'footer' | 'card' | 'minimal';
  className?: string;
  onClick?: () => void;
}

export const TenantBrandBadge: React.FC<TenantBrandBadgeProps> = ({
  dealer,
  size = 'md',
  variant = 'navbar',
  className = '',
  onClick,
}) => {
  const isRxm = !dealer || dealer.slug === 'rxm' || dealer.slug === 'rxm_sandbox';

  // 1. Varianta RXM Automobile (client fondator #1)
  if (isRxm) {
    if (variant === 'footer') {
      return (
        <div className={`flex items-center gap-3 select-none ${className}`} onClick={onClick}>
          <img 
            src="/rxm/images/rxm-emblem.png" 
            alt="RXM Emblem" 
            width={36}
            height={36}
            className="w-9 h-9 object-contain filter invert brightness-125" 
          />
          <div className="flex flex-col">
            <img 
              src="/rxm/images/rxm-logo.png" 
              alt="RXM Automobile" 
              width={112}
              height={28}
              className="h-7 w-auto object-contain filter invert brightness-150" 
            />
            <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">Dealer Auto Rulate • Cluj</p>
          </div>
        </div>
      );
    }

    // Default: Navbar
    return (
      <div className={`flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 group touch-manipulation ${className}`} onClick={onClick}>
        <img 
          src="/images/rxm-emblem.png" 
          alt="RXM Emblem" 
          width={40}
          height={40}
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain filter invert brightness-150 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)] shrink-0 group-hover:scale-105 transition-transform" 
        />
        <div className="flex flex-col min-w-0">
          <img 
            src="/images/rxm-logo.png" 
            alt="RXM Automobile" 
            width={112}
            height={28}
            className="h-5 sm:h-7 w-auto object-contain filter invert brightness-200 group-hover:brightness-125 transition-all" 
          />
          <p className="text-[7.5px] sm:text-[9px] text-amber-400 font-medium uppercase tracking-[0.12em] sm:tracking-[0.2em] -mt-0.5 truncate">Dealer Auto Rulate • Cluj</p>
        </div>
      </div>
    );
  }

  // 2. Chiriaș B2B cu Logo URL încărcat explicit
  if (dealer.logoUrl) {
    return (
      <div className={`flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group ${className}`} onClick={onClick}>
        <img
          src={dealer.logoUrl}
          alt={dealer.name}
          className="h-8 sm:h-10 w-auto max-w-[170px] object-contain shrink-0 group-hover:scale-105 transition-transform"
        />
        {variant !== 'footer' && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-black tracking-tight text-white leading-tight truncate">
              {dealer.slug === 'mpi_auto' ? 'MPI AUTO' : dealer.name}
            </span>
            <span className="text-[8px] sm:text-[9.5px] text-amber-400 font-semibold uppercase tracking-wider truncate">
              {dealer.showroomAddress || dealer.address || 'Autovehicule Rulate Verificate'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. Chiriaș B2B fără fișier imagine: Monogramă Vectorială Luxoasă Dinamică
  // Deducere acronim (ex: "MPI AUTO CLA" -> "MPI")
  const rawName = dealer.name || 'Parc Auto';
  const cleanAcronym = (dealer.slug === 'mpi_auto' || rawName.toUpperCase().includes('MPI'))
    ? 'MPI'
    : (dealer.slug === 'top_auto' || rawName.toUpperCase().includes('ALD'))
      ? 'ALD'
      : rawName
          .split(/\s+/)
          .filter(w => !['SRL', 'S.R.L.', 'SA', 'S.A.'].includes(w.toUpperCase()))
          .slice(0, 3)
          .map(w => w[0])
          .join('')
          .toUpperCase() || 'PA';

  const locationSubtitle = (dealer.showroomAddress || dealer.address || '').split(',')[0] || 'Parc Auto Autorizat';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group ${className}`} onClick={onClick}>
      {/* Monogram Badge */}
      <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-zinc-900 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400 group-hover:scale-105 transition-all shrink-0">
        <span className="text-xs sm:text-sm font-black tracking-wider text-amber-300 drop-shadow-sm">
          {cleanAcronym}
        </span>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#09090b]" title="Showroom Verificat ParcOS" />
      </div>

      {/* Denumire & Locație */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-black tracking-tight text-white leading-tight truncate group-hover:text-amber-200 transition-colors">
            {dealer.slug === 'mpi_auto' ? 'MPI AUTO' : rawName.replace(/\s+(SRL|S\.R\.L\.).*$/i, '')}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            PRO
          </span>
        </div>
        <p className="text-[8px] sm:text-[9.5px] text-amber-400/90 font-medium uppercase tracking-[0.12em] sm:tracking-[0.16em] -mt-0.5 truncate">
          {locationSubtitle} • Cluj
        </p>
      </div>
    </div>
  );
};
