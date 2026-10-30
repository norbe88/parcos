import React, { useRef, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, MessageCircle, ArrowRight } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { formatMileage, getWhatsAppCarInquiryUrl, normalizeCarImageUrl } from '../../utils/helpers';

export interface SpecialOffersCarouselProps {
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive') => void;
  dealer?: typeof SEED_DEALER;
  maxItems?: number;
}

export const SpecialOffersCarousel: React.FC<SpecialOffersCarouselProps> = ({
  cars,
  onSelectCar,
  dealer = SEED_DEALER,
  maxItems = 6
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sortare prioritară: Oferta Săptămânii (#1) > Fixate > Reduceri, limitat la maxItems (default 6)
  const sortedOffers = useMemo(() => {
    return [...cars]
      .sort((a, b) => {
        const discountA = (a.oldPriceEur && a.oldPriceEur > a.priceEur) ? (a.oldPriceEur - a.priceEur) : 0;
        const discountB = (b.oldPriceEur && b.oldPriceEur > b.priceEur) ? (b.oldPriceEur - b.priceEur) : 0;
        const scoreA = (a.isDealOfWeek ? 10000 : 0) + (a.isPinnedToTop ? 5000 : 0) + discountA;
        const scoreB = (b.isDealOfWeek ? 10000 : 0) + (b.isPinnedToTop ? 5000 : 0) + discountB;
        return scoreB - scoreA;
      })
      .slice(0, maxItems);
  }, [cars, maxItems]);

  // Auto-hide: dacă nu există nicio mașină promoțională activă, returnează null
  if (cars.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8 p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-amber-500/[0.08] via-[#121215]/80 to-[#121215] border border-amber-500/25 shadow-2xl relative overflow-hidden">
      {/* Glow ambiental de fundal */}
      <div className="absolute top-0 left-1/4 w-96 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header secțiune cu butoane navigare desktop */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <h3 className="font-serif font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <span>⚡ Oferte Speciale & Reduceri</span>
          </h3>
          <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold font-mono">
            {sortedOffers.length} {sortedOffers.length === 1 ? 'mașină' : 'oferte selectate'}
          </span>
        </div>

        {/* Butoane navigare desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-center touch-manipulation active:scale-95"
            aria-label="Derulează înapoi"
          >
            <ChevronLeft className="w-5 h-5 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-center touch-manipulation active:scale-95"
            aria-label="Derulează înainte"
          >
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Strip carduri orizontale cu swipe — Centrat pe desktop când sunt puține mașini */}
      <div 
        ref={scrollRef} 
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 relative z-10 px-1 ${
          sortedOffers.length <= 3 ? 'sm:justify-center' : 'justify-start'
        }`}
      >
        {sortedOffers.map(car => (
          <SpecialOfferCard 
            key={car.id} 
            car={car} 
            onSelectCar={onSelectCar} 
            dealer={dealer} 
          />
        ))}
      </div>

      {/* ⚖️ Notă Legală Directiva Omnibus (H.G. nr. 947/2000) privind Reducerile de Preț */}
      <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] text-[10px] text-zinc-400 text-center sm:text-left leading-relaxed flex items-center gap-1.5 justify-center sm:justify-start">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
        <span>
          Prețul anterior tăiat reprezintă cel mai scăzut preț practicat în ultimele 30 de zile înainte de reducerea actuală, conform <strong>Directivei Omnibus (H.G. nr. 947/2000 actualizată)</strong>.
        </span>
      </div>
    </div>
  );
};

interface SpecialOfferCardProps {
  car: VehicleItem;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive') => void;
  dealer: typeof SEED_DEALER;
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({ car, onSelectCar, dealer }) => {
  const hasDiscount = !!(car.oldPriceEur && car.oldPriceEur > car.priceEur);
  const savings = hasDiscount ? car.oldPriceEur! - car.priceEur : 0;
  const isDeal = !!(car.isDealOfWeek || car.isPinnedToTop);

  return (
    <div 
      onClick={() => onSelectCar(car, 'specs')}
      className="w-[82vw] max-w-[320px] sm:w-80 shrink-0 snap-center rounded-2xl bg-[#151518] border border-amber-400/40 hover:border-amber-400 transition-all duration-300 shadow-xl hover:shadow-[0_0_32px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden group cursor-pointer"
    >
      {/* Fotografie */}
      <div className="relative aspect-[16/9] bg-zinc-900 overflow-hidden">
        <img
          src={normalizeCarImageUrl(car.images[0])}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badge promoțional pe foto */}
        {isDeal && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-[9.5px] uppercase tracking-wide shadow-md shadow-amber-500/30">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{car.dealBadgeText || 'OFERTA SĂPTĂMÂNII'}</span>
          </div>
        )}

        {/* Preț & Reducere Overlay */}
        <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/15">
          {hasDiscount && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-zinc-400 line-through font-mono leading-none">
                {car.oldPriceEur!.toLocaleString('ro-RO')} €
              </span>
              <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded">
                -{savings.toLocaleString('ro-RO')} €
              </span>
            </div>
          )}
          <div className={`font-black font-mono leading-none ${hasDiscount ? 'text-amber-400 text-base' : 'text-white text-sm'}`}>
            {car.priceEur.toLocaleString('ro-RO')} €
          </div>
        </div>
      </div>

      {/* Corp Card */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="font-serif font-bold text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {car.brand} {car.model}
          </div>
          <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
            {car.versionTrim || `${car.year} • ${formatMileage(car.mileageKm)}`}
          </div>

          {hasDiscount && (
            <div className="mt-2 flex items-center gap-1 text-[10.5px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
              <span>Economisești {savings.toLocaleString('ro-RO')} €</span>
            </div>
          )}
        </div>

        {/* Buton WhatsApp & Acțiune */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
          <span className="text-[11px] text-zinc-400 font-mono">
            {car.year} • {formatMileage(car.mileageKm)}
          </span>
          <a
            href={getWhatsAppCarInquiryUrl(car, dealer.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10.5px] inline-flex items-center gap-1 transition-all active:scale-95 shadow-md border border-emerald-500/30"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Întreabă</span>
          </a>
        </div>
      </div>
    </div>
  );
};
