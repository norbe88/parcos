import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Check, X } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { DealerProfile, DealerLandingConfig } from '../../db/types';
import { VehicleCard } from './VehicleCard';
import { normalizeBrand } from '../../utils/brandNormalizer';

const BATCH_INITIAL_MOBILE = 6;
const BATCH_INITIAL_DESKTOP = 9;
export const BATCH_STEP = 6;

interface VehicleCatalogProps {
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive') => void;
  dealer?: DealerProfile;
  landingConfig?: DealerLandingConfig;
}

export const VehicleCatalog: React.FC<VehicleCatalogProps> = ({
  cars,
  onSelectCar,
  dealer = SEED_DEALER,
  landingConfig,
}) => {
  // Tab-uri permise strict: 'in_stock' și 'sold' (fără termenul rezervat)
  const [stockTab, setStockTab] = useState<'in_stock' | 'sold'>('in_stock');

  // Quick filter chips
  const [quickFilter, setQuickFilter] = useState<'all' | 'suv' | 'auto' | 'under10k' | 'under15k'>('all');

  // Drawer filtre avansate
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedFuel, setSelectedFuel] = useState('all');
  const [selectedTransmission, setSelectedTransmission] = useState('all');

  const absoluteMaxPrice = useMemo(() => {
    if (!cars || cars.length === 0) return 50000;
    return Math.max(50000, ...cars.map(c => c.priceEur || 0));
  }, [cars]);
  const [maxPrice, setMaxPrice] = useState<number>(absoluteMaxPrice);

  // Progressive Batching
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? BATCH_INITIAL_MOBILE : BATCH_INITIAL_DESKTOP;
  });

  const availableBrands = useMemo(() => {
    const s = new Set<string>();
    cars.forEach(c => {
      const b = normalizeBrand(c.brand);
      if (b) s.add(b);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [cars]);

  // Număr mașini per tab
  const counts = useMemo(() => {
    const inStock = cars.filter(c => c.status !== 'sold' && c.status !== 'preparing').length;
    const sold = cars.filter(c => c.status === 'sold').length;
    return { inStock, sold };
  }, [cars]);

  // Filtrare mașini
  const filteredCars = useMemo(() => {
    return cars.filter(c => {
      if (c.status === 'preparing') return false;

      if (stockTab === 'in_stock') {
        if (c.status === 'sold') return false;
      } else if (stockTab === 'sold') {
        if (c.status !== 'sold') return false;
      }

      // Quick chips filter
      if (quickFilter === 'suv' && !(c.bodyType?.toLowerCase().includes('suv') || c.drivetrain?.includes('4x4'))) {
        return false;
      }
      if (quickFilter === 'auto' && !(c.transmission?.toLowerCase().includes('auto') || c.transmission?.toLowerCase().includes('dsg'))) {
        return false;
      }
      if (quickFilter === 'under10k' && c.priceEur > 10000) return false;
      if (quickFilter === 'under15k' && c.priceEur > 15000) return false;

      // Drawer filters
      if (selectedBrand !== 'all' && normalizeBrand(c.brand) !== selectedBrand) return false;
      if (selectedFuel !== 'all' && c.fuelType !== selectedFuel) return false;
      if (selectedTransmission !== 'all' && c.transmission !== selectedTransmission) return false;
      if (c.priceEur > maxPrice) return false;

      return true;
    });
  }, [cars, stockTab, quickFilter, selectedBrand, selectedFuel, selectedTransmission, maxPrice]);

  const visibleCars = filteredCars.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCars.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + BATCH_STEP);
  };

  const handleShowAll = () => {
    setVisibleCount(filteredCars.length);
  };

  const resetFilters = () => {
    setQuickFilter('all');
    setSelectedBrand('all');
    setSelectedFuel('all');
    setSelectedTransmission('all');
    setMaxPrice(absoluteMaxPrice);
  };

  return (
    <section 
      id="catalog" 
      aria-label="Catalog Stoc Automobile Rulate"
      className="py-14 md:py-24 bg-[var(--bg,#0B0F16)] text-[var(--text,#F4F6F9)] transition-colors scroll-mt-16"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Header Catalog: Eyebrow + H2 + Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="font-montserrat font-semibold text-[12px] uppercase tracking-[0.16em] text-[var(--accent-text,#F04D4D)] mb-2">
              Stoc
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-montserrat font-extrabold text-[32px] sm:text-[40px] text-[var(--text,#F4F6F9)] leading-tight tracking-[-0.02em]">
                Adăugate recent
              </h2>
              <span className="px-3 py-1 rounded-full text-[13px] font-montserrat font-bold bg-[var(--surface-2,#1B2431)] text-[var(--accent-text,#F04D4D)] border border-[var(--line,rgba(255,255,255,0.08))] tabular-nums">
                {filteredCars.length} mașini
              </span>
            </div>
          </div>

          {/* Doar două tab-uri: În stoc și Vândute */}
          <div className="flex items-center p-1 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setStockTab('in_stock');
                setVisibleCount(BATCH_INITIAL_DESKTOP);
              }}
              className={`h-10 px-5 rounded-[6px] font-montserrat font-semibold text-[14px] transition-all cursor-pointer ${
                stockTab === 'in_stock'
                  ? 'bg-[var(--accent,#D83333)] text-white shadow-sm'
                  : 'text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)]'
              }`}
            >
              În stoc ({counts.inStock})
            </button>
            <button
              type="button"
              onClick={() => {
                setStockTab('sold');
                setVisibleCount(BATCH_INITIAL_DESKTOP);
              }}
              className={`h-10 px-5 rounded-[6px] font-montserrat font-semibold text-[14px] transition-all cursor-pointer ${
                stockTab === 'sold'
                  ? 'bg-[var(--accent,#D83333)] text-white shadow-sm'
                  : 'text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)]'
              }`}
            >
              Vândute ({counts.sold})
            </button>
          </div>
        </div>

        {/* Quick Filter Chips Bar */}
        <div className="flex items-center justify-between gap-3 mb-8 pb-4 border-b border-[var(--line,rgba(255,255,255,0.08))]">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <button
              type="button"
              onClick={() => setQuickFilter('all')}
              className={`h-10 px-4 rounded-[var(--r-sm,8px)] font-montserrat font-semibold text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                quickFilter === 'all'
                  ? 'bg-[var(--accent,#D83333)] text-white border border-[var(--accent,#D83333)]'
                  : 'bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
              }`}
            >
              Toate
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('suv')}
              className={`h-10 px-4 rounded-[var(--r-sm,8px)] font-montserrat font-semibold text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                quickFilter === 'suv'
                  ? 'bg-[var(--accent,#D83333)] text-white border border-[var(--accent,#D83333)]'
                  : 'bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
              }`}
            >
              SUV & Crossover
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('auto')}
              className={`h-10 px-4 rounded-[var(--r-sm,8px)] font-montserrat font-semibold text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                quickFilter === 'auto'
                  ? 'bg-[var(--accent,#D83333)] text-white border border-[var(--accent,#D83333)]'
                  : 'bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
              }`}
            >
              Cutie Automată
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('under10k')}
              className={`h-10 px-4 rounded-[var(--r-sm,8px)] font-montserrat font-semibold text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                quickFilter === 'under10k'
                  ? 'bg-[var(--accent,#D83333)] text-white border border-[var(--accent,#D83333)]'
                  : 'bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
              }`}
            >
              Sub 10.000 €
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('under15k')}
              className={`h-10 px-4 rounded-[var(--r-sm,8px)] font-montserrat font-semibold text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                quickFilter === 'under15k'
                  ? 'bg-[var(--accent,#D83333)] text-white border border-[var(--accent,#D83333)]'
                  : 'bg-[var(--surface-2,#1B2431)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] border border-[var(--line,rgba(255,255,255,0.08))]'
              }`}
            >
              Sub 15.000 €
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="h-10 px-4 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[13px] flex items-center gap-2 border border-[var(--line,rgba(255,255,255,0.08))] shrink-0 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--metal,#C9CED6)]" />
            <span className="hidden sm:inline">Filtre detaliate</span>
            <span className="sm:hidden">Filtre</span>
          </button>
        </div>

        {/* Grila 3 Col Desktop / 2 Col Tabletă / 1 Col Mobil */}
        {visibleCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCars.map((car, idx) => (
              <VehicleCard
                key={car.id}
                car={car}
                onSelectCar={onSelectCar}
                dealer={dealer}
                priority={idx < 3}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-[var(--r-md,14px)] bg-[var(--surface,#131A24)] border border-[var(--line,rgba(255,255,255,0.08))] p-8">
            <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)] mb-2">
              Niciun automobil găsit pentru filtrele selectate
            </h3>
            <p className="font-open-sans text-[14px] text-[var(--text-muted,#A3ABB6)] max-w-md mx-auto mb-6">
              Încearcă să resetezi filtrele sau să alegi un buget mai flexibil pentru a vedea întregul stoc disponibil.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="h-11 px-6 rounded-[var(--r-sm,8px)] bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[14px] cursor-pointer"
            >
              Resetează toate filtrele
            </button>
          </div>
        )}

        {/* Paginare Progressive Batching */}
        {hasMore && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleLoadMore}
              className="w-full sm:w-auto h-12 px-8 rounded-[var(--r-md,14px)] bg-[var(--surface-2,#1B2431)] hover:bg-[var(--surface-brand,#2E3643)] text-[var(--text,#F4F6F9)] font-montserrat font-bold text-[14px] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation"
            >
              <span>Încarcă încă {BATCH_STEP} mașini</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleShowAll}
              className="w-full sm:w-auto h-12 px-6 rounded-[var(--r-md,14px)] text-[var(--text-muted,#A3ABB6)] hover:text-[var(--text,#F4F6F9)] font-montserrat font-semibold text-[14px] transition-colors cursor-pointer"
            >
              Afișează tot stocul ({filteredCars.length})
            </button>
          </div>
        )}
      </div>

      {/* Drawer Filtre Avansate */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface,#131A24)] h-full p-6 flex flex-col justify-between overflow-y-auto border-l border-[var(--line,rgba(255,255,255,0.08))] shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line,rgba(255,255,255,0.08))] mb-6">
                <h3 className="font-montserrat font-bold text-[18px] text-[var(--text,#F4F6F9)]">
                  Filtre avansate stoc
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-[var(--surface-2,#1B2431)] flex items-center justify-center text-[var(--text-muted,#A3ABB6)] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Marca */}
              <div className="mb-5">
                <label className="block text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-2">
                  Marcă
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px]"
                >
                  <option value="all">Toate mărcile ({availableBrands.length})</option>
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Combustibil */}
              <div className="mb-5">
                <label className="block text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-2">
                  Combustibil
                </label>
                <select
                  value={selectedFuel}
                  onChange={(e) => setSelectedFuel(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px]"
                >
                  <option value="all">Oricare combustibil</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Benzină">Benzină</option>
                  <option value="Hibrid">Hibrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              {/* Cutie de viteze */}
              <div className="mb-5">
                <label className="block text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)] mb-2">
                  Transmisie
                </label>
                <select
                  value={selectedTransmission}
                  onChange={(e) => setSelectedTransmission(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--r-sm,8px)] bg-[var(--surface-2,#1B2431)] border border-[var(--line,rgba(255,255,255,0.08))] text-[var(--text,#F4F6F9)] text-[14px]"
                >
                  <option value="all">Oricare cutie</option>
                  <option value="Automată">Automată</option>
                  <option value="Manuală">Manuală</option>
                </select>
              </div>

              {/* Buget Maxim Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-montserrat font-semibold uppercase tracking-wider text-[var(--text-muted,#A3ABB6)]">
                    Buget maxim
                  </label>
                  <span className="font-montserrat font-bold text-[14px] text-[var(--accent-text,#F04D4D)] tabular-nums">
                    {maxPrice.toLocaleString('ro-RO')} €
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={absoluteMaxPrice}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[var(--accent,#D83333)] h-2 bg-[var(--surface-2,#1B2431)] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--line,rgba(255,255,255,0.08))] space-y-2">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full h-12 rounded-[var(--r-md,14px)] bg-[var(--accent,#D83333)] text-white font-montserrat font-bold text-[14px] cursor-pointer"
              >
                Aplică filtrele ({filteredCars.length} rezultate)
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="w-full h-11 rounded-[var(--r-md,14px)] text-[var(--text-muted,#A3ABB6)] hover:text-white font-montserrat font-semibold text-[13px] cursor-pointer"
              >
                Resetează filtrele
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
