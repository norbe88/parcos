import React, { useMemo, useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, Truck, MessageCircle, 
  ArrowRight, Search, SlidersHorizontal, Sparkles, ChevronRight
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { 
  resolveDealerContact, 
  formatVehicleTitle, 
  estimateMonthly, 
  formatPriceEur, 
  formatMileageKm,
  normalizeCarImageUrl 
} from '../../utils/helpers';
import { normalizeBrand } from '../../utils/brandNormalizer';

interface MpiRetailHeroProps {
  tenant: DealerProfile;
  landingConfig?: DealerLandingConfig;
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem) => void;
  isRevealed?: boolean;
}

export const MpiRetailHero: React.FC<MpiRetailHeroProps> = ({
  tenant,
  landingConfig,
  cars,
  onSelectCar,
  isRevealed = true,
}) => {
  const contact = resolveDealerContact(tenant);
  const totalCount = cars.length;

  // Mașina vedetă (Deal of the Week sau prima mașină)
  const heroCar = useMemo(() => {
    if (!cars || cars.length === 0) return null;
    const deal = cars.find(c => c.isDealOfWeek || c.isPinnedToTop);
    return deal || cars[0];
  }, [cars]);

  // Căutare rapidă
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedMinYear, setSelectedMinYear] = useState('all');
  const [maxBudget, setMaxBudget] = useState('all');

  const availableBrands = useMemo(() => {
    const s = new Set<string>();
    cars.forEach(c => {
      const b = normalizeBrand(c.brand);
      if (b) s.add(b);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [cars]);

  // Ani de producție disponibili în stoc (sortați descrescător)
  const availableYears = useMemo(() => {
    const s = new Set<number>();
    cars.forEach(c => {
      if (c.year && c.year > 1990 && c.year <= new Date().getFullYear() + 1) {
        s.add(c.year);
      }
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [cars]);

  const availableModels = useMemo(() => {
    if (selectedBrand === 'all') return [];
    const s = new Set<string>();
    cars.filter(c => normalizeBrand(c.brand) === selectedBrand).forEach(c => {
      if (c.model) s.add(c.model);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [cars, selectedBrand]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('parcos:catalog-filter', {
      detail: {
        brand: selectedBrand !== 'all' ? selectedBrand : undefined,
        query: selectedModel !== 'all' ? selectedModel : undefined,
        year: selectedMinYear !== 'all' ? selectedMinYear : undefined,
        maxPrice: maxBudget !== 'all' ? Number(maxBudget) : undefined
      }
    }));
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const city = tenant.city || 'Cluj-Napoca';
  const locationLabel = tenant.showroomAddress 
    ? tenant.showroomAddress 
    : (tenant.address ? tenant.address : `${city}, jud. ${tenant.county || 'Cluj'}`);

  return (
    <section 
      aria-label={`${tenant.name} — Showroom`}
      className="relative overflow-hidden pt-8 md:pt-14 pb-12 md:pb-20 bg-[var(--bg,#0B0F16)] text-[var(--text,#F4F6F9)] transition-colors"
    >
      {/* Glow radial ambiental de fundal */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-100"
        style={{ background: 'var(--glow)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Split 6/6 Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Stânga: 6 Cols (Desktop) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-3.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent,#D83333)] animate-pulse shrink-0" />
              <span className="font-montserrat font-semibold text-[12px] uppercase tracking-[0.16em] text-[var(--accent-text,#F04D4D)] truncate">
                Parc auto rulate · {locationLabel}
              </span>
            </div>

            {/* H1 Principal */}
            <h1 className="font-montserrat font-extrabold text-[36px] sm:text-[44px] lg:text-[60px] xl:text-[64px] leading-[1.12] tracking-[-0.02em] text-[var(--text,#F4F6F9)] mb-5">
              Mașini rulate verificate, direct de la sursă.
            </h1>

            {/* Subtitlu */}
            <p className="font-open-sans text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.6] text-[var(--text-muted,#A3ABB6)] max-w-xl mb-8">
              Parc auto autorizat în {city}. Garanție 12–36 luni inclusă, livrare gratuită la domiciliu și finanțare rapidă doar cu buletinul, direct în contul dealerului.
            </p>

            {/* 3 Puncte de Încredere */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 pt-2 border-t border-[var(--line,rgba(255,255,255,0.08))]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                <span className="text-[14px] font-open-sans text-[var(--text,#F4F6F9)] font-medium">
                  Verificare 120 puncte
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                <span className="text-[14px] font-open-sans text-[var(--text,#F4F6F9)] font-medium">
                  Km certificați pe factură
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--metal,#C9CED6)] shrink-0" />
                <span className="text-[14px] font-open-sans text-[var(--text,#F4F6F9)] font-medium">
                  Livrare gratuită în țară
                </span>
              </div>
            </div>

            {/* CTA Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#catalog"
                className="h-[52px] px-8 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-[var(--shadow-cta)] transition-all touch-manipulation active:scale-[0.98]"
              >
                <span>Vezi cele {totalCount} mașini</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>

              {contact.salesWhatsApp && (
                <a
                  href={`https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua! Doresc informații despre mașinile din stocul ${tenant.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[52px] px-6 rounded-[var(--r-md,14px)] bg-[#25D366] hover:bg-[#20ba59] text-[#0B0F16] font-montserrat font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                  <span>Consultanță pe WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Dreapta: 6 Cols (LCP Car Image + Glass Deal Card) */}
          <div className="lg:col-span-6 flex justify-center">
            {heroCar ? (
              <div className="relative w-full max-w-[580px] group">
                {/* LCP Media Container */}
                <div 
                  onClick={() => onSelectCar(heroCar)}
                  className="relative aspect-[16/10] rounded-[var(--r-lg,24px)] overflow-hidden bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-[var(--shadow-card)] cursor-pointer select-none"
                >
                  {heroCar.images && heroCar.images.length > 0 ? (
                    <img 
                      src={normalizeCarImageUrl(heroCar.images[0])}
                      alt={formatVehicleTitle(heroCar.brand, heroCar.model, heroCar.versionTrim)}
                      width={800}
                      height={500}
                      {...({ fetchpriority: 'high' } as any)}
                      loading="eager"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[var(--ease)]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)]">
                      <span>Imagine în curs de actualizare</span>
                    </div>
                  )}

                  {/* Gradient Overlay for card contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badge: Oferta Săptămânii */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[12px] uppercase tracking-wider shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{heroCar.dealBadgeText || 'Ofertă Specială'}</span>
                    </span>
                  </div>

                  {/* Floating Glass Deal Card */}
                  <div 
                    className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5 p-3.5 sm:p-4 rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)]/90 backdrop-blur-md border border-[var(--line,rgba(255,255,255,0.12))] shadow-xl transition-all group-hover:border-[var(--accent,#D83333)]/50"
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-montserrat font-bold text-[17px] sm:text-[19px] text-[var(--text,#F4F6F9)] truncate">
                          {formatVehicleTitle(heroCar.brand, heroCar.model, heroCar.versionTrim)}
                        </h2>
                        <p className="font-open-sans text-[13px] text-[var(--text-muted,#A3ABB6)] mt-0.5">
                          {heroCar.year} · {formatMileageKm(heroCar.mileageKm)} · {heroCar.fuelType}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-montserrat font-extrabold text-[22px] sm:text-[24px] text-[var(--accent-text,#F04D4D)] tabular-nums leading-none">
                          {formatPriceEur(heroCar.priceEur)}
                        </div>
                        <div className="font-open-sans text-[12px] text-[var(--text-muted,#A3ABB6)] mt-1">
                          de la {estimateMonthly(heroCar.priceEur)} €/lună*
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Compact Search & Filter Bar sub Hero */}
        <div className="mt-10 sm:mt-14">
          <form 
            onSubmit={handleSearchSubmit}
            className="p-3 sm:p-4 rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] shadow-md"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              {/* Select Marcă */}
              <div>
                <label className="block text-[11px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-1">
                  Marcă
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel('all');
                  }}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] font-open-sans focus:outline-none focus:border-[var(--accent,#D83333)]"
                >
                  <option value="all">Toate mărcile ({availableBrands.length})</option>
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Select Model */}
              <div>
                <label className="block text-[11px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-1">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={selectedBrand === 'all'}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] font-open-sans focus:outline-none focus:border-[var(--accent,#D83333)] disabled:opacity-50"
                >
                  <option value="all">
                    {selectedBrand === 'all' ? 'Alege mai întâi marca' : `Toate modelele (${availableModels.length})`}
                  </option>
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Select An Fabricație */}
              <div>
                <label className="block text-[11px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-1">
                  An fabricație
                </label>
                <select
                  value={selectedMinYear}
                  onChange={(e) => setSelectedMinYear(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] font-open-sans focus:outline-none focus:border-[var(--accent,#D83333)]"
                >
                  <option value="all">Oricare an</option>
                  {availableYears.map(y => (
                    <option key={y} value={y.toString()}>De la {y}</option>
                  ))}
                </select>
              </div>

              {/* Select Buget Maxim */}
              <div>
                <label className="block text-[11px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-1">
                  Buget maxim
                </label>
                <select
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px] font-open-sans focus:outline-none focus:border-[var(--accent,#D83333)]"
                >
                  <option value="all">Oricare buget</option>
                  <option value="10000">Sub 10.000 €</option>
                  <option value="15000">Sub 15.000 €</option>
                  <option value="20000">Sub 20.000 €</option>
                  <option value="30000">Sub 30.000 €</option>
                </select>
              </div>

              {/* Buton Caută */}
              <div className="sm:self-end">
                <button
                  type="submit"
                  className="w-full h-11 rounded-[var(--r-sm,8px)] bg-[var(--accent,#D83333)] hover:bg-[var(--accent-hover,#C02828)] text-white font-montserrat font-bold text-[14px] flex items-center justify-center gap-2 shadow-[var(--shadow-cta)] transition-all cursor-pointer touch-manipulation"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Caută {totalCount} mașini</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
