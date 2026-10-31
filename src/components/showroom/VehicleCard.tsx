import { DealerProfile } from '../../db/types';
import React from 'react';
import { 
  Car, Eye, Shield, Play, Clock, Gauge, Fuel, Cog, 
  FileCheck, Sparkles, Calculator, Truck, MessageCircle, Tag, Building2 
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { 
  calculateRate as defaultCalcRate, 
  getStockNumber, 
  getWhatsAppCarInquiryUrl, 
  getWhatsAppFinanceUrl, 
  getWhatsAppSoldOrderUrl,
  formatMileage,
  normalizeCarImageUrl,
  isTikTokVideoUrl
} from '../../utils/helpers';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { trackConversionEvent } from '../../services/telemetryService';

interface VehicleCardProps {
  car: VehicleItem;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive', videoFormat?: 'tiktok' | 'youtube') => void;
  dealer?: DealerProfile | typeof SEED_DEALER;
  calculateRate?: (price: number, advPct: number, months: number) => number;
  priority?: boolean;
  index?: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = React.memo(({
  car,
  onSelectCar,
  dealer = SEED_DEALER,
  calculateRate = defaultCalcRate,
  priority = false,
  index
}) => {
  const stockRef = getStockNumber(car);
  const currentStatus = car.status || 'in_stock';
  const isDeal = !!(car.isDealOfWeek || car.isPinnedToTop);
  const hasDiscount = !!(car.oldPriceEur && car.oldPriceEur > car.priceEur);
  const savings = hasDiscount ? car.oldPriceEur! - car.priceEur : 0;
  const isMpi = (dealer?.slug === 'mpi_auto') || (car.dealerSlug === 'mpi_auto');

  return (
    <div 
      className={`group rounded-2xl bg-[#121215] overflow-hidden transition-all duration-300 flex flex-col animate-fade-in-up ${
        isDeal
          ? 'border-2 border-amber-400/80 ring-1 ring-amber-400/40 shadow-[0_0_32px_rgba(245,158,11,0.28)] hover:shadow-[0_0_48px_rgba(245,158,11,0.40)]'
          : 'border border-white/[0.08] shadow-xl hover:border-amber-500/40'
      }`}
    >
      {/* Foto Principală cu Badge-uri & Protecție Anti-Salvare */}
      <div 
        onClick={() => onSelectCar(car, 'specs')}
        onContextMenu={(e) => e.preventDefault()}
        className="relative aspect-[16/10] overflow-hidden bg-zinc-900 cursor-pointer select-none"
      >
        {!car.images || car.images.length === 0 ? (
          // 🖼️ Placeholder Dark Luxury — nicio imagine disponibilă
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 select-none pointer-events-none p-4 text-center">
            {(dealer && (dealer.slug === 'rxm' || dealer.slug === 'rxm_sandbox')) ? (
              <img
                src="/images/rxm-logo.png"
                alt="RXM Automobile"
                className="w-16 h-16 opacity-30 mb-3 object-contain"
                draggable={false}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('rxm-emblem')) {
                    target.src = '/images/rxm-emblem-gold.png';
                  }
                }}
              />
            ) : dealer.logoUrl ? (
              <img
                src={dealer.logoUrl}
                alt={dealer.name}
                className="h-10 w-auto opacity-40 mb-3 object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <Car className="w-6 h-6 text-amber-400 opacity-60" />
              </div>
            )}
            <span className="text-[10px] font-semibold tracking-widest text-amber-400/80 uppercase">
              Fotografii în curs de actualizare
            </span>
            <span className="text-[9px] text-zinc-500 mt-1">
              {dealer?.showroomAddress || dealer?.address || 'Vehicul fizic în stoc showroom'}
            </span>
          </div>
        ) : (
          <img 
            src={normalizeCarImageUrl(car.images[0])} 
            alt={`${car.brand} ${car.model}`}
            width={400}
            height={250}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('/rxm/cars/')) {
                target.src = target.src.replace('/rxm/cars/', '/cars/');
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            loading={priority ? "eager" : "lazy"}
            {...(priority ? ({ fetchpriority: "high" } as any) : {})}
            decoding="async"
          />
        )}

        {/* Watermark Oficial RXM Cluj */}
        <WatermarkOverlay variant="card" />

        {/* Sold Watermark Overlay */}
        {currentStatus === 'sold' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-rose-600/95 text-white font-black text-[11px] sm:text-xs tracking-wider uppercase border border-white/30 shadow-2xl rotate-[-5deg]">
              LIVRAT CLIENTULUI • VÂNDUT
            </span>
          </div>
        )}

        {/* Hover Hint Overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-xl transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Vezi Detalii</span>
          </span>
        </div>

        {/* Top Badges Bar — Non-colliding Mobile-First Layout */}
        <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 z-20 flex items-start justify-between gap-1.5 pointer-events-none">
          {/* Grup Stânga: Ofertă Promoțională & TVA Deductibil */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-1.5">
            {isDeal && (
              <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-[9px] sm:text-[10px] uppercase tracking-wide shadow-lg shadow-amber-500/30 select-none">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span>{car.dealBadgeText || 'OFERTA SĂPTĂMÂNII'}</span>
              </span>
            )}
            {car.vatDeductible && (
              <span className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-600/95 backdrop-blur-md text-white font-extrabold text-[9px] sm:text-[10px] tracking-wide uppercase border border-emerald-400/40 shadow-lg shadow-emerald-950/50 select-none">
                <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span>TVA DEDUCTIBIL • FACTURĂ FIRMĂ</span>
              </span>
            )}
            {car.vatDeductible && !isDeal && (
              <span className="sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/95 backdrop-blur-md text-white font-bold text-[9px] uppercase border border-emerald-400/40 shadow-md select-none">
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span>TVA Deductibil</span>
              </span>
            )}
          </div>

          {/* Grup Dreapta: Status Stoc (În Stoc / Rezervat) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {currentStatus === 'in_stock' && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/80 backdrop-blur-md text-zinc-100 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase border border-white/10 shadow-lg flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>În Stoc</span>
              </span>
            )}
            {currentStatus === 'reserved' && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-200 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase border border-amber-500/30 shadow-lg flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>Rezervat</span>
              </span>
            )}
          </div>
        </div>

        {/* Badge Video TikTok (Dacă există clip filmat — colț dreapta-jos minimalist) */}
        {isTikTokVideoUrl(car.tiktokUrl) && (
          <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 z-10 pointer-events-auto">
            <button
              type="button"
              aria-label={`Vezi clipul de prezentare video TikTok pentru ${car.brand} ${car.model}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCar(car, 'video', 'tiktok');
              }}
              className="px-2.5 py-1 rounded-xl bg-black/80 hover:bg-black/95 border border-white/20 text-white text-[9.5px] sm:text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all group/tt cursor-pointer"
              title="Apasă pentru prezentarea video a acestei mașini"
            >
              <Play className="w-2.5 h-2.5 fill-white text-white group-hover/tt:scale-110 transition-transform" />
              <span className="text-zinc-200 font-medium">Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Detalii Card */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Card: Brand + Model (Stânga) & Preț Tag (Dreapta) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div 
                onClick={() => onSelectCar(car, 'specs')}
                role="button"
                tabIndex={0}
                aria-label={`Vezi detalii și specificații pentru ${car.brand} ${car.model}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCar(car, 'specs');
                  }
                }}
                className="font-serif text-base sm:text-lg font-bold text-white leading-snug group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
                title={`${car.brand} ${car.model}`}
              >
                {car.brand} {car.model}
              </div>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                {car.versionTrim}
              </p>
            </div>

            {/* Preț & Regim Fiscal (Aliniat Dreapta) */}
            <div className="text-right shrink-0">
              {hasDiscount && (
                <div className="flex items-center justify-end gap-1 mb-0.5">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 line-through font-mono leading-none">
                    {car.oldPriceEur!.toLocaleString('ro-RO')} €
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.5 rounded leading-none">
                    -{savings.toLocaleString('ro-RO')} €
                  </span>
                </div>
              )}
              <div className={`font-black font-mono leading-none tracking-tight ${hasDiscount ? 'text-amber-400 text-lg sm:text-xl' : 'text-white text-base sm:text-lg'}`}>
                {car.priceEur.toLocaleString('ro-RO')} €
              </div>
              <div className="text-[8.5px] sm:text-[9px] text-zinc-400 mt-1 font-medium leading-none">
                {car.vatDeductible ? (
                  <span className="text-emerald-400 font-semibold" title={`Net: ${Math.round(car.priceEur / 1.21).toLocaleString('ro-RO')} € + TVA (21%)`}>
                    TVA Deductibil 21%
                  </span>
                ) : (
                  <span title="Regim Marjă art. 312 Cod Fiscal">Preț Final • TVA Inclus</span>
                )}
              </div>
            </div>
          </div>

          {/* Specificații Mini */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 my-2.5 sm:my-3 pt-2.5 sm:pt-3 border-t border-white/[0.06] text-[10.5px] sm:text-[11px] text-zinc-300">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-200">{car.year}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <Gauge className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-200">{formatMileage(car.mileageKm)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <Fuel className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-200">{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              <Cog className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-200">{car.transmission}</span>
            </div>
          </div>

          {/* 🛡️ Beneficii & Standarde Verificare — ascunse pe mobil (banner general în catalog) */}
          <div className="hidden lg:grid grid-cols-2 gap-1.5 my-3 py-2 px-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[9.5px] sm:text-[10.5px]">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium min-w-0">
              <Shield className="w-3.5 h-3.5 text-rose-500/90 shrink-0" />
              <span className="whitespace-nowrap">{isMpi ? 'Garanție MPI Protect' : `Garanție ${car.warrantyMonths} Luni`}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
              <span className="whitespace-nowrap">{isMpi ? 'Revizie Ulei+Filtre Cadou' : 'Consultanță Înmatriculare'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium min-w-0">
              <Truck className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
              <span className="whitespace-nowrap">{isMpi ? 'Livrare Gratuită la Ușă' : 'Km Reali Factură'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium min-w-0">
              <FileCheck className="w-3.5 h-3.5 text-blue-400/90 shrink-0" />
              <span className="whitespace-nowrap">{isMpi ? 'Rate Doar cu Buletinul' : 'Numere Roșii pe Loc'}</span>
            </div>
          </div>

          {/* Badge Economisești (dacă există discount) & Notă Omnibus — vizibil pe desktop */}
          {hasDiscount && (
            <div className="hidden sm:block mb-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                <Tag className="w-3 h-3 shrink-0" />
                <span>Economisești {savings.toLocaleString('ro-RO')} € față de prețul anterior</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 block mt-0.5 leading-tight">
                *Preț anterior = cel mai scăzut preț din ultimele 30 zile (Directiva Omnibus / HG 947/2000)
              </span>
            </div>
          )}

          {/* Badge B2B Fiscal (dacă TVA este deductibil) — vizibil pe desktop */}
          {car.vatDeductible && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 font-semibold mb-2.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>TVA Deductibil 21% • Factură fiscală B2B (SRL / Leasing)</span>
            </div>
          )}

          {/* 📱 Estimare Rata Lunară — Format Simplificat & Aerisit pe Mobil */}
          <div className="sm:hidden flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-zinc-400 shrink-0">Rată de la:</span>
              <span className="text-amber-400 font-mono font-bold text-xs truncate">
                {calculateRate(car.priceEur, 15, 48)} €<span className="text-[10px] text-zinc-400 font-sans font-normal">/lună</span>
              </span>
            </div>
            {currentStatus !== 'sold' && (
              <a
                href={getWhatsAppFinanceUrl(car, dealer, 15, 48, 'TBI Bank', calculateRate(car.priceEur, 15, 48))}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Rate TBI — Solicită finanțare în rate prin TBI Bank pentru ${car.brand} ${car.model}`}
                onClick={() => {
                  trackConversionEvent('calc_finance', { carId: car.id, priceEur: car.priceEur, advancePercent: 15, periodMonths: 48, estimatedMonthlyRate: calculateRate(car.priceEur, 15, 48) }, dealer?.slug || car.dealerSlug);
                  trackConversionEvent('click_whatsapp', { carId: car.id, priceEur: car.priceEur, type: 'finance' }, dealer?.slug || car.dealerSlug);
                }}
                className="text-[10.5px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 transition-colors"
              >
                <span>{isMpi ? "Rate cu Buletinul" : "Rate TBI"}</span>
                <span>→</span>
              </a>
            )}
          </div>

          {/* 🖥️ Estimare Rata Lunară cu CTA Finanțare — Format Extins pe Desktop */}
          <div className="hidden sm:flex p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs items-center justify-between gap-2">
            <div>
              <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-medium">Rată lunară de la:</span>
              <div className="text-amber-400 font-mono font-bold leading-tight text-sm">
                {calculateRate(car.priceEur, 15, 48)} € <span className="text-[11px] font-sans font-normal text-zinc-400">/ lună*</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 block font-normal leading-tight mt-0.5">*Simulare orientativă fără valoare contractuală</span>
            </div>
            {currentStatus !== 'sold' ? (
              <a
                href={getWhatsAppFinanceUrl(car, dealer, 15, 48, 'TBI Bank', calculateRate(car.priceEur, 15, 48))}
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`Rate TBI — Solicită finanțare în rate prin TBI Bank pentru ${car.brand} ${car.model}`}
                onClick={() => {
                  trackConversionEvent('calc_finance', { carId: car.id, priceEur: car.priceEur, advancePercent: 15, periodMonths: 48, estimatedMonthlyRate: calculateRate(car.priceEur, 15, 48) }, dealer?.slug || car.dealerSlug);
                  trackConversionEvent('click_whatsapp', { carId: car.id, priceEur: car.priceEur, type: 'finance' }, dealer?.slug || car.dealerSlug);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all touch-manipulation active:scale-95"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Rate TBI</span>
              </a>
            ) : (
              <span className="text-[10px] text-zinc-500 font-medium italic">Tranzacție finalizată</span>
            )}
          </div>
        </div>

        {/* Butoane Acțiune Card */}
        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
          <button 
            type="button"
            aria-label={`Deschide fișa completă cu detalii pentru ${car.brand} ${car.model}`}
            onClick={() => onSelectCar(car, 'specs')}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-200 hover:text-white font-medium text-xs sm:text-sm min-h-[44px] h-11 rounded-xl border border-white/10 hover:border-white/20 transition-all touch-manipulation"
          >
            <Eye className="w-4 h-4 text-zinc-400" />
            <span>Detalii</span>
          </button>

          {currentStatus === 'sold' ? (
            <a
              href={getWhatsAppSoldOrderUrl(car, dealer)}
              target="_blank" 
              rel="noopener noreferrer"
              aria-label={`Comandă pe WhatsApp un model similar cu ${car.brand} ${car.model}`}
              onClick={() => trackConversionEvent('click_whatsapp', { carId: car.id, priceEur: car.priceEur, status: 'sold_order' }, dealer?.slug || car.dealerSlug)}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-extrabold text-xs sm:text-sm min-h-[44px] h-11 rounded-xl transition-all touch-manipulation shadow-lg shadow-amber-500/20"
            >
              <Truck className="w-4 h-4" />
              <span>La Comandă</span>
            </a>
          ) : (
            <a 
              href={getWhatsAppCarInquiryUrl(car, dealer)}
              target="_blank" 
              rel="noopener noreferrer"
              aria-label={`Contactează pe WhatsApp despre ${car.brand} ${car.model} Ref ${stockRef}`}
              onClick={() => trackConversionEvent('click_whatsapp', { carId: car.id, priceEur: car.priceEur }, dealer?.slug || car.dealerSlug)}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm min-h-[44px] h-11 rounded-xl transition-all touch-manipulation shadow-lg shadow-emerald-950/40 border border-emerald-500/30"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.car.id === nextProps.car.id &&
    prevProps.car.priceEur === nextProps.car.priceEur &&
    prevProps.car.status === nextProps.car.status &&
    prevProps.priority === nextProps.priority &&
    prevProps.dealer?.slug === nextProps.dealer?.slug
  );
});
