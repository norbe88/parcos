import React, { useState, useMemo, useEffect } from 'react';
import { Car, CheckCircle2, ChevronDown, Truck, Award, SlidersHorizontal, Shield, FileCheck, Sparkles } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { VehicleCard } from './VehicleCard';
import { SpecialOffersCarousel } from './SpecialOffersCarousel';
import { calculateRate as defaultCalcRate } from '../../utils/helpers';
import { normalizeBrand } from '../../utils/brandNormalizer';

// ─── Progressive Batching: Lot inițial adaptiv la viewport ─────────────────
const BATCH_INITIAL_MOBILE = 6;  // < 768px — telefoane mobile
const BATCH_INITIAL_DESKTOP = 9; // ≥ 768px — tablete & desktop (3 rânduri x 3 col)
export const BATCH_STEP = 6;     // Lot adăugat la fiecare click „Încarcă mai multe"

function getInitialBatch(): number {
  if (typeof window === 'undefined') return BATCH_INITIAL_DESKTOP;
  return window.innerWidth < 768 ? BATCH_INITIAL_MOBILE : BATCH_INITIAL_DESKTOP;
}
// ────────────────────────────────────────────────────────────────────────────

interface VehicleCatalogProps {
  cars: VehicleItem[];
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive', videoFormat?: 'tiktok' | 'youtube') => void;
  dealer?: typeof SEED_DEALER;
  calculateRate?: (price: number, advPct: number, months: number) => number;
}

export const VehicleCatalog: React.FC<VehicleCatalogProps> = ({
  cars,
  onSelectCar,
  dealer = SEED_DEALER,
  calculateRate = defaultCalcRate
}) => {
  const [stockTab, setStockTab] = useState<'all' | 'in_stock' | 'reserved' | 'sold'>('in_stock');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedFuel, setSelectedFuel] = useState<string>('all');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(35000);
  // 📦 Lot vizibil curent — Progressive Batching (6 mobil / 9 desktop)
  const [visibleCount, setVisibleCount] = useState<number>(getInitialBatch);

  // Mărci unice pentru filtru (Normalizate și Deduplicate — zero dubluri precum "BMW" vs "Bmw" sau "RENAULT" vs "Renault")
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    cars.forEach(c => {
      const norm = normalizeBrand(c.brand);
      if (norm) brandsSet.add(norm);
    });
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [cars]);

  // Statistici stoc
  const stockStats = useMemo(() => {
    const totalVehicles = cars.length;
    const inStock = cars.filter(c => c.status === 'in_stock').length;
    const reserved = cars.filter(c => c.status === 'reserved').length;
    const sold = cars.filter(c => c.status === 'sold').length;
    const activeLot = inStock + reserved;
    return { totalVehicles, inStock, reserved, sold, activeLot };
  }, [cars]);

  // Filtrare mașini Showroom (mașinile 'În Pregătire' sunt strict interne și ascunse din site)
  const filteredCars = useMemo(() => {
    return cars.filter(c => {
      // 🛡️ Mașinile "În Pregătire" sunt în parcul fizic fără poze și NU apar în catalogul public
      if (c.status === 'preparing') return false;

      if (stockTab === 'in_stock') {
        // În Stoc afișează mașinile din parcul auto (disponibile și rezervate cu avans)
        if (c.status !== 'in_stock' && c.status !== 'reserved') return false;
      } else if (stockTab === 'reserved') {
        if (c.status !== 'reserved') return false;
      } else if (stockTab === 'sold') {
        if (c.status !== 'sold') return false;
      }

      if (selectedBrand !== 'all' && normalizeBrand(c.brand) !== selectedBrand) return false;
      if (selectedFuel !== 'all' && c.fuelType !== selectedFuel) return false;
      if (selectedTransmission !== 'all' && c.transmission !== selectedTransmission) return false;
      if (c.priceEur > maxPrice) return false;
      return true;
    });
  }, [cars, stockTab, selectedBrand, selectedFuel, selectedTransmission, maxPrice]);

  // Sortare prioritară: Oferta Săptămânii (#1, scor 2) > Pinned to Top (scor 1) > Normal (scor 0)
  const sortedFilteredCars = useMemo(() => {
    return [...filteredCars].sort((a, b) => {
      const scoreA = (a.isDealOfWeek ? 2 : 0) + (a.isPinnedToTop ? 1 : 0);
      const scoreB = (b.isDealOfWeek ? 2 : 0) + (b.isPinnedToTop ? 1 : 0);
      return scoreB - scoreA;
    });
  }, [filteredCars]);

  // 📦 Lot de autovehicule afișat efectiv în DOM (slice progresiv din lista sortată completă)
  const displayedCars = useMemo(() => {
    return sortedFilteredCars.slice(0, visibleCount);
  }, [sortedFilteredCars, visibleCount]);

  // 🔄 Resetare lot la schimbarea oricărui filtru activ — utilizatorul vede imediat primele rezultate relevante
  useEffect(() => {
    setVisibleCount(getInitialBatch());
  }, [stockTab, selectedBrand, selectedFuel, selectedTransmission, maxPrice]);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-20 sm:scroll-mt-24">
      
      {/* Titlu Secțiune Catalog */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">Stoc Automobile Rulate</span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mt-1">Catalog Autovehicule Disponibile</h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          Fiecare autovehicul beneficiază de garanție scrisă până la 36 luni (12 luni inclus standard), consultanță gratuită pentru înmatriculare și kilometraj garantat contractual pe factură.
        </p>
      </div>

      {/* ⚡ CARUSEL OFERTE SPECIALE — auto-hide dacă nicio mașină promoțională */}
      <SpecialOffersCarousel
        cars={cars.filter(c => (c.isDealOfWeek || c.isPinnedToTop || !!(c.oldPriceEur && c.oldPriceEur > c.priceEur)) && c.status !== 'sold' && c.status !== 'preparing')}
        onSelectCar={onSelectCar}
        dealer={dealer}
      />
      
      {/* 🏷️ TAB-URI STOC: DISPONIBILE vs REZERVATE vs VÂNDUTE (Zero Scroll Orizontal) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto p-1 sm:p-1.5 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-lg gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setStockTab('in_stock')}
            className={`min-h-[44px] px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all touch-manipulation active:scale-[0.98] ${
              stockTab === 'in_stock'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">În Stoc ({stockStats.activeLot})</span>
          </button>

          {stockStats.reserved > 0 ? (
            <button
              type="button"
              onClick={() => setStockTab('reserved')}
              className={`min-h-[44px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all touch-manipulation active:scale-[0.98] ${
                stockTab === 'reserved'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/25'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">Rezervate ({stockStats.reserved})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStockTab('all')}
              className={`min-h-[44px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-[11px] sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all touch-manipulation active:scale-[0.98] ${
                stockTab === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">Toate ({stockStats.totalVehicles})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setStockTab('sold')}
            className={`min-h-[44px] px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all touch-manipulation active:scale-[0.98] ${
              stockTab === 'sold'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="truncate sm:hidden">Vândute ({stockStats.sold})</span>
            <span className="hidden sm:inline">Mașini Vândute ({stockStats.sold})</span>
          </button>

          {stockStats.reserved > 0 && (
            <button
              type="button"
              onClick={() => setStockTab('all')}
              className={`hidden sm:inline-flex min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm items-center gap-1.5 whitespace-nowrap transition-all touch-manipulation active:scale-[0.98] ${
                stockTab === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Toate ({stockStats.totalVehicles})</span>
            </button>
          )}
        </div>

        <a
          href="#comanda"
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all w-full sm:w-auto text-center touch-manipulation active:scale-[0.98]"
        >
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Nu găsești ce cauți? Comandă din Germania &gt;</span>
        </a>
      </div>

      {/* Banner Portofoliu Mașini Vândute */}
      {stockTab === 'sold' && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-[#18181b] to-zinc-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base">Portofoliu Livrări Recente • RXM Automobile Cluj</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Aceste autovehicule au fost deja livrate clienților noștri. Dorești un model identic sau similar? Îl aducem la comandă în 5-7 zile!</p>
            </div>
          </div>
          <a
            href="#comanda"
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-amber-500/20 touch-manipulation active:scale-[0.98]"
          >
            <Truck className="w-4 h-4" />
            <span>Vreau Mașină la Comandă</span>
          </a>
        </div>
      )}

      {/* Panou Filtrare */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] mb-10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Filtrează Stocul Auto
          </div>
          <div className="text-xs text-zinc-400">
            Afișate: <strong className="text-white">{filteredCars.length}</strong> din {cars.length} autovehicule
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Filtru Marcă */}
          <div>
            <label htmlFor="filter-brand" className="block text-zinc-400 mb-1 font-medium">Marcă</label>
            <select 
              id="filter-brand"
              aria-label="Filtrează după marcă"
              value={selectedBrand} 
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
            >
              <option value="all">Toate mărcile</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Filtru Combustibil */}
          <div>
            <label htmlFor="filter-fuel" className="block text-zinc-400 mb-1 font-medium">Combustibil</label>
            <select 
              id="filter-fuel"
              aria-label="Filtrează după tip combustibil"
              value={selectedFuel} 
              onChange={e => setSelectedFuel(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
            >
              <option value="all">Orice combustibil</option>
              <option value="Diesel">Diesel</option>
              <option value="Benzină">Benzină</option>
              <option value="Hibrid">Hibrid</option>
            </select>
          </div>

          {/* Filtru Transmisie */}
          <div>
            <label htmlFor="filter-transmission" className="block text-zinc-400 mb-1 font-medium">Cutie de Viteze</label>
            <select 
              id="filter-transmission"
              aria-label="Filtrează după cutie de viteze"
              value={selectedTransmission} 
              onChange={e => setSelectedTransmission(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none focus:border-amber-400 touch-manipulation"
            >
              <option value="all">Orice transmisie</option>
              <option value="Automată">Automată</option>
              <option value="Manuală">Manuală</option>
            </select>
          </div>

          {/* Filtru Preț Maxim Slider */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between mb-1.5">
              <label htmlFor="filter-maxprice" className="text-zinc-400 font-medium cursor-pointer">Preț Maxim:</label>
              <span className="text-amber-400 font-bold font-mono text-sm">{maxPrice.toLocaleString('ro-RO')} €</span>
            </div>
            <input 
              id="filter-maxprice"
              aria-label="Filtru preț maxim autovehicul în euro"
              type="range" 
              min="5000" 
              max="35000" 
              step="1000"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg touch-manipulation"
            />
          </div>
        </div>
      </div>
      {/* ⚖️ Notificare Fiscală & Monedă de Plată (ANPC / OG 99/2000 & OUG 50/2010) */}
      <div className="mb-6 p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] sm:text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>
            <strong className="text-zinc-200">Prețuri transparente:</strong> Toate prețurile afișate sunt finale și includ TVA (regim de marjă conform art. 312 Cod Fiscal sau TVA deductibil 21% specificat distinct). Plata se realizează în <strong>LEI (RON)</strong> la cursul BNR din ziua emiterii facturii fiscale.
          </span>
        </div>
        <div className="text-zinc-400 shrink-0 sm:text-right font-mono text-[10.5px]">
          *Ratele afișate reprezintă simulări orientative (OUG 50/2010)
        </div>
      </div>

      {/* Grid Mașini Showroom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedFilteredCars.map((car, index) => (
          <VehicleCard
            key={car.id}
            car={car}
            index={index}
            priority={index < 2}
            onSelectCar={onSelectCar}
            dealer={dealer}
            calculateRate={calculateRate}
          />
        ))}
      </div>

      {sortedFilteredCars.length === 0 && (
        <div className="text-center py-16 px-4 bg-[#121215] rounded-2xl border border-white/[0.08]">
          <Car className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">Niciun vehicul nu corespunde filtrelor selectate</h3>
          <p className="text-xs text-zinc-400 mt-1">Încearcă să resetezi filtrele de preț sau carburant.</p>
          <button 
            onClick={() => {
              setSelectedBrand('all');
              setSelectedFuel('all');
              setSelectedTransmission('all');
              setMaxPrice(35000);
            }}
            className="mt-4 min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 touch-manipulation active:scale-[0.98]"
          >
            Resetează Filtrele
          </button>
        </div>
      )}
    </section>
  );
};
