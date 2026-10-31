import React from 'react';
import { 
  Eye, MessageCircle, ArrowRight, Sparkles, Building2, CheckCircle2 
} from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { 
  formatVehicleTitle, 
  estimateMonthly, 
  formatPriceEur, 
  formatMileageKm,
  formatFiscalMention,
  resolveDealerContact, 
  normalizeCarImageUrl 
} from '../../utils/helpers';

interface VehicleCardProps {
  car: VehicleItem;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive') => void;
  dealer?: DealerProfile;
  priority?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = React.memo(({
  car,
  onSelectCar,
  dealer = SEED_DEALER,
  priority = false,
}) => {
  const contact = resolveDealerContact(dealer);
  const currentStatus = car.status || 'in_stock';
  const isDeal = !!(car.isDealOfWeek || car.isPinnedToTop);
  const title = formatVehicleTitle(car.brand, car.model, car.versionTrim);
  const monthly = estimateMonthly(car.priceEur);
  const fiscalMention = formatFiscalMention(car.vatDeductible);

  // Construire specificații tehnice compacte: an · km · combustibil · cutie · capacitate/putere
  const specsParts = [
    car.year ? `${car.year}` : null,
    car.mileageKm !== undefined ? formatMileageKm(car.mileageKm) : null,
    car.fuelType || null,
    car.transmission || null,
    car.engineCc ? `${car.engineCc} cm³` : null,
    car.powerHp && car.powerHp > 0 ? `${car.powerHp} CP` : null,
  ].filter(Boolean);

  return (
    <article 
      className="group rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--accent,#D83333)]/40 transition-all duration-300 ease-[var(--ease)] will-change-transform"
    >
      <div>
        {/* Imagine 4:3 cu aspect-ratio definit */}
        <div 
          onClick={() => onSelectCar(car, 'specs')}
          className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-2,#1B2431)] cursor-pointer select-none"
        >
          {car.images && car.images.length > 0 ? (
            <img 
              src={normalizeCarImageUrl(car.images[0])}
              alt={title}
              width={400}
              height={300}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-[var(--ease)] pointer-events-none select-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted,#A3ABB6)] text-[13px] font-open-sans">
              Fotografii în curs de actualizare
            </div>
          )}

          {/* Badge-uri colț stânga-sus (maximum 2) */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            {isDeal && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider shadow-md">
                <Sparkles className="w-3 h-3" />
                <span>{car.dealBadgeText || 'Ofertă Specială'}</span>
              </span>
            )}
            {car.vatDeductible && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--surface-brand,#2E3643)]/90 backdrop-blur-sm text-white font-montserrat font-bold text-[11px] uppercase tracking-wide border border-white/10 shadow-sm">
                <Building2 className="w-3 h-3 text-[var(--metal,#C9CED6)]" />
                <span>TVA deductibil</span>
              </span>
            )}
          </div>

          {/* Badge Dreapta-Sus: Stare Stoc */}
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            {currentStatus === 'reserved' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--surface-brand,#2E3643)]/90 backdrop-blur-sm text-white font-montserrat font-bold text-[11px] border border-amber-400/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Cont de Garanție Activ</span>
              </span>
            )}
            {currentStatus === 'sold' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-zinc-300 font-montserrat font-bold text-[11px] uppercase tracking-wider border border-white/10 shadow-sm">
                Livrat Clientului
              </span>
            )}
          </div>

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)]/90 text-white font-montserrat font-semibold text-[13px] border border-[var(--line,rgba(255,255,255,0.12))] shadow-lg flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[var(--accent-text,#F04D4D)]" />
              <span>Vezi Detalii</span>
            </span>
          </div>
        </div>

        {/* Informații Card */}
        <div className="p-4 sm:p-5">
          {/* Titlu Mașină: Montserrat 700 19px */}
          <h3 
            onClick={() => onSelectCar(car, 'specs')}
            className="font-montserrat font-bold text-[18px] sm:text-[19px] text-[var(--text,#F4F6F9)] group-hover:text-[var(--accent-text,#F04D4D)] transition-colors cursor-pointer truncate leading-snug"
            title={title}
          >
            {title}
          </h3>

          {/* Rând Specificații: Open Sans 14px */}
          <p className="font-open-sans text-[13px] sm:text-[14px] text-[var(--text-muted,#A3ABB6)] mt-1.5 truncate">
            {specsParts.join(' · ')}
          </p>

          {/* Preț & Rată */}
          <div className="mt-5 pt-3.5 border-t border-[var(--line,rgba(255,255,255,0.08))] flex items-end justify-between gap-3">
            <div>
              <div className="font-montserrat font-extrabold text-[24px] sm:text-[26px] text-[var(--accent-text,#F04D4D)] tabular-nums leading-none tracking-tight">
                {formatPriceEur(car.priceEur)}
              </div>
              <div className="font-open-sans text-[12px] sm:text-[13px] text-[var(--text-muted,#A3ABB6)] mt-1">
                {fiscalMention}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-open-sans text-[13px] sm:text-[14px] text-[var(--text-muted,#A3ABB6)] block">
                de la <strong className="font-montserrat font-bold text-[var(--text,#F4F6F9)] tabular-nums">{monthly} €</strong>/lună*
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Butoane Acțiune Footer: Detalii & WhatsApp */}
      <div className="p-4 sm:p-5 pt-0 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onSelectCar(car, 'specs')}
          className="h-11 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 border border-[var(--line,rgba(255,255,255,0.08))] transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
        >
          <span>Detalii</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {contact.salesWhatsApp && (
          <a
            href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc detalii despre ${title} (${formatPriceEur(car.priceEur)}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp pentru ${title}`}
            className="h-11 rounded-[var(--r-sm,8px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </article>
  );
});
