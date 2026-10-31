import React, { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { 
  formatVehicleTitle, 
  estimateMonthly, 
  formatPriceEur, 
  formatMileageKm,
  resolveDealerContact,
  normalizeCarImageUrl 
} from '../../utils/helpers';

export interface SpecialOffersCarouselProps {
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive') => void;
  dealer?: DealerProfile;
  maxItems?: number;
}

export const SpecialOffersCarousel: React.FC<SpecialOffersCarouselProps> = ({
  cars,
  onSelectCar,
  dealer = SEED_DEALER,
  maxItems = 6
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contact = resolveDealerContact(dealer);

  // Un singur bloc unitar de oferte: deal of week, pinned sau reducere de preț
  const specialOffers = useMemo(() => {
    return [...cars]
      .filter(c => c.isDealOfWeek || c.isPinnedToTop || (c.oldPriceEur && c.oldPriceEur > c.priceEur))
      .sort((a, b) => {
        const discountA = (a.oldPriceEur && a.oldPriceEur > a.priceEur) ? (a.oldPriceEur - a.priceEur) : 0;
        const discountB = (b.oldPriceEur && b.oldPriceEur > b.priceEur) ? (b.oldPriceEur - b.priceEur) : 0;
        const scoreA = (a.isDealOfWeek ? 10000 : 0) + (a.isPinnedToTop ? 5000 : 0) + discountA;
        const scoreB = (b.isDealOfWeek ? 10000 : 0) + (b.isPinnedToTop ? 5000 : 0) + discountB;
        return scoreB - scoreA;
      })
      .slice(0, maxItems);
  }, [cars, maxItems]);

  if (specialOffers.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section 
      aria-label="Oferte Speciale și Oportunități Showroom"
      className="py-12 md:py-16 bg-[var(--surface-2,#1B2431)]/50 border-b border-[var(--line,rgba(255,255,255,0.08))]"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Header Secțiune Oferte */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent,#D83333)]/10 text-[var(--accent-text,#F04D4D)] text-[12px] font-montserrat font-semibold uppercase tracking-[0.14em] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oportunități din stoc</span>
            </div>
            <h2 className="font-montserrat font-extrabold text-[28px] sm:text-[36px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.01em]">
              Oferte Speciale & Reduceri
            </h2>
          </div>

          {/* Săgeți Navigare Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Oferta anterioară"
              className="w-11 h-11 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--metal,#C9CED6)] hover:text-white border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Oferta următoare"
              className="w-11 h-11 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--metal,#C9CED6)] hover:text-white border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel / Snap Grid */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 px-1 -mx-1"
        >
          {specialOffers.map(car => {
            const hasDiscount = !!(car.oldPriceEur && car.oldPriceEur > car.priceEur);
            const savings = hasDiscount ? (car.oldPriceEur! - car.priceEur) : 0;
            const title = formatVehicleTitle(car.brand, car.model, car.versionTrim);
            const monthly = estimateMonthly(car.priceEur);

            return (
              <div 
                key={car.id}
                className="w-[85vw] sm:w-[360px] lg:w-[380px] shrink-0 snap-start rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Poză 16/10 cu Badge */}
                  <div 
                    onClick={() => onSelectCar(car, 'specs')}
                    className="relative aspect-[16/10] overflow-hidden bg-black/40 cursor-pointer select-none"
                  >
                    {car.images && car.images.length > 0 ? (
                      <img 
                        src={normalizeCarImageUrl(car.images[0])}
                        alt={title}
                        width={400}
                        height={250}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-[var(--ease)]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted,#A3ABB6)] text-xs">
                        Foto în curs de actualizare
                      </div>
                    )}

                    {/* Badge Ofertă Specială */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider shadow-md">
                        {car.dealBadgeText || 'Ofertă Specială'}
                      </span>
                    </div>

                    {/* Economie Badge */}
                    {hasDiscount && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="px-2.5 py-0.5 rounded-md bg-[var(--surface-brand,#2E3643)]/90 backdrop-blur-sm text-white font-montserrat font-bold text-[12px] tabular-nums border border-white/10 shadow-sm">
                          Economisești {savings.toLocaleString('ro-RO')} €
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Detalii Mașină */}
                  <div className="p-4 sm:p-5">
                    <h3 
                      onClick={() => onSelectCar(car, 'specs')}
                      className="font-montserrat font-bold text-[17px] text-[var(--text,#F4F6F9)] group-hover:text-[var(--accent-text,#F04D4D)] transition-colors cursor-pointer truncate"
                      title={title}
                    >
                      {title}
                    </h3>
                    <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-1">
                      {car.year} · {formatMileageKm(car.mileageKm)} · {car.fuelType} · {car.transmission}
                    </p>

                    {/* Preț & Rată */}
                    <div className="mt-4 pt-3 border-t border-[var(--line,rgba(255,255,255,0.08))] flex items-end justify-between">
                      <div>
                        {hasDiscount && (
                          <div className="text-[12px] text-[var(--text-muted,#A3ABB6)] line-through font-mono tabular-nums">
                            {formatPriceEur(car.oldPriceEur!)}
                          </div>
                        )}
                        <div className="font-montserrat font-extrabold text-[24px] text-[var(--accent-text,#F04D4D)] tabular-nums leading-none">
                          {formatPriceEur(car.priceEur)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)] block">
                          de la {monthly} €/lună*
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Butoane Acțiune */}
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCar(car, 'specs')}
                    className="h-10 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] flex items-center justify-center gap-1 border border-[var(--line,rgba(255,255,255,0.08))] transition-colors cursor-pointer"
                  >
                    <span>Detalii</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {contact.salesWhatsApp && (
                    <a
                      href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc informații despre oferta pentru ${title} (${formatPriceEur(car.priceEur)}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 rounded-[var(--r-sm,8px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notă Unică de Conformitate Omnibus (HG 947/2000) sub carusel */}
        <div className="mt-4 text-center">
          <p className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)]">
            *Prețul tăiat reprezintă cel mai scăzut preț practicat în ultimele 30 de zile, conform Directivei Omnibus (HG nr. 947/2000).
          </p>
        </div>
      </div>
    </section>
  );
};
