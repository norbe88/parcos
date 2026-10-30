import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Calculator, Car, Truck, Play, 
  ChevronUp, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { DealerProfile } from '../../db/types';

export const FACILITY_ITEMS = [
  {
    id: 'garantie',
    icon: Shield,
    iconColor: 'text-emerald-400',
    title: 'Garanție Scrisă până la 36 Luni',
    actionHref: '#garantie'
  },
  {
    id: 'rate',
    icon: Calculator,
    iconColor: 'text-amber-400',
    title: 'Finanțare Rate (0% Avans, Aprobare Rapidă)',
    actionHref: '#finantare'
  },
  {
    id: 'buyback',
    icon: Car,
    iconColor: 'text-amber-400',
    title: 'Buy-Back & Schimb Auto pe Loc',
    actionHref: '#buyback'
  },
  {
    id: 'comanda',
    icon: Truck,
    iconColor: 'text-amber-400',
    title: 'Mașini la Comandă (Import UE 5-7 Zile)',
    actionHref: '#comanda'
  },
  {
    id: 'livrare',
    icon: Truck,
    iconColor: 'text-amber-400',
    title: 'Livrare pe Platformă în Toată România',
    actionHref: '#catalog'
  },
  {
    id: 'tiktok',
    icon: Play,
    iconColor: 'text-[#fe2c55] fill-[#fe2c55]',
    title: 'Prezentări Video HD Transparente pe TikTok',
    isPopoutTrigger: true
  }
];

export const MPI_FACILITY_ITEMS = [
  {
    id: 'buletin',
    icon: Calculator,
    iconColor: 'text-amber-400',
    title: 'Rate Doar cu Buletinul (Fără Avans, Diaspora & Birou)',
    actionHref: '#finantare'
  },
  {
    id: 'livrare',
    icon: Truck,
    iconColor: 'text-amber-400',
    title: 'Livrare Gratuită la Domiciliu în Toată România',
    actionHref: '#catalog'
  },
  {
    id: 'garantie',
    icon: Shield,
    iconColor: 'text-emerald-400',
    title: 'Garanție Extinsă MPI Car Protect (12 - 36 Luni)',
    actionHref: '#garantie'
  },
  {
    id: 'revizie',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    title: 'Revizie Gratuită (Ulei + Filtre) Cadou la Achiziție',
    actionHref: '#catalog'
  },
  {
    id: 'numere',
    icon: Car,
    iconColor: 'text-amber-400',
    title: 'Numere Roșii 30 Zile + Asigurare Incluse pe Loc',
    actionHref: '#catalog'
  },
  {
    id: 'buyback',
    icon: Car,
    iconColor: 'text-amber-400',
    title: 'Buy-Back Rapid (Vino cu mașina veche, pleci cu noua mașină)',
    actionHref: '#buyback'
  },
  {
    id: 'tiktok',
    icon: Play,
    iconColor: 'text-[#fe2c55] fill-[#fe2c55]',
    title: 'Prezentări Video HD Transparente pe TikTok @mpiautocluj',
    isPopoutTrigger: true
  }
];

interface ShowroomFacilitiesReelProps {
  onTriggerTikTokModal: () => void;
  dealer?: DealerProfile;
}

export const ShowroomFacilitiesReel: React.FC<ShowroomFacilitiesReelProps> = ({
  onTriggerTikTokModal,
  dealer,
}) => {
  const facilityItems = dealer?.slug === 'mpi_auto' ? MPI_FACILITY_ITEMS : FACILITY_ITEMS;
  const [activeFacilityIndex, setActiveFacilityIndex] = useState<number>(0);
  const [isInitialSpinning, setIsInitialSpinning] = useState<boolean>(true);
  const [hasShimmerGlow, setHasShimmerGlow] = useState<boolean>(true);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Funcție de resetare a timer-ului de auto-rotire la interacțiune manuală
  const resetAutoTimer = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setActiveFacilityIndex(prev => (prev + 1) % facilityItems.length);
    }, 3500);
  };

  const handleNextFacility = () => {
    setActiveFacilityIndex(prev => (prev + 1) % facilityItems.length);
    resetAutoTimer();
  };

  const handlePrevFacility = () => {
    setActiveFacilityIndex(prev => (prev - 1 + facilityItems.length) % facilityItems.length);
    resetAutoTimer();
  };

  // 🎰 Spin inițial complet la montare + Efect de strălucire (Shimmer Glow) ce face fade-out
  useEffect(() => {
    let step = 0;
    const initialSpin = setInterval(() => {
      step++;
      setActiveFacilityIndex(step % facilityItems.length);
      if (step >= facilityItems.length) {
        clearInterval(initialSpin);
        setActiveFacilityIndex(0);
        setIsInitialSpinning(false);

        // Fade-out la strălucire după ce s-a oprit pe prima facilitate
        setTimeout(() => {
          setHasShimmerGlow(false);
        }, 900);

        // Pornire timer regulat de rotație
        resetAutoTimer();
      }
    }, 140);

    return () => {
      clearInterval(initialSpin);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [facilityItems.length]);

  return (
    <div className="lg:hidden mt-3 mb-2">
      <div className="relative h-11 w-full rounded-2xl bg-[#121215] border border-white/10 overflow-hidden shadow-lg shadow-black/50 group select-none">
        
        {/* Shimmer / Glow Light Beam on Initial Spin */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-20 ${
            hasShimmerGlow ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent -translate-x-full animate-slot-shimmer" />
          <div className="absolute inset-0 border border-amber-400/40 rounded-2xl shadow-[inset_0_0_12px_rgba(251,191,36,0.2)]" />
        </div>

        {/* Reel Container — 44px exact per item, mathematical centering */}
        <div 
          className={`w-full transition-transform ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isInitialSpinning ? 'duration-150' : 'duration-500'
          }`}
          style={{ transform: `translateY(-${activeFacilityIndex * 44}px)` }}
        >
          {facilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                className="h-11 w-full flex items-center justify-between px-3.5 touch-manipulation active:bg-white/[0.04] transition-colors cursor-pointer"
                onClick={() => {
                  if (item.isPopoutTrigger) {
                    onTriggerTikTokModal();
                  } else if (item.actionHref) {
                    const target = document.querySelector(item.actionHref);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {/* Stânga: Icon + Text centrat vertical fără deformare */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                  </span>
                  <span className="text-xs font-semibold text-zinc-200 truncate leading-none">
                    {item.title}
                  </span>
                </div>

                {/* Spacer pentru a nu se suprapune cu butoanele de control din dreapta */}
                <div className="w-20 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Dreapta Fixat: Interactive Stepper & Counter (Tap pentru a roti la facilitatea dorită) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-[#18181b]/95 border border-white/10 rounded-xl px-1.5 py-0.5 shadow-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevFacility();
            }}
            className="p-1 hover:bg-white/10 active:scale-90 text-zinc-400 hover:text-white rounded transition-all touch-manipulation"
            aria-label="Facilitatea anterioară"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextFacility();
            }}
            className="font-mono text-[10.5px] font-bold text-amber-400 min-w-[24px] text-center hover:text-amber-300 transition-colors cursor-pointer touch-manipulation"
            title="Apasă pentru următoarea facilitate"
          >
            {activeFacilityIndex + 1}/{facilityItems.length}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextFacility();
            }}
            className="p-1 hover:bg-white/10 active:scale-90 text-zinc-400 hover:text-white rounded transition-all touch-manipulation"
            aria-label="Următoarea facilitate"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
