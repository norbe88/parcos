import React, { useState } from 'react';
import { 
  QrCode, Printer, Search, Car, CheckCircle2, 
  ExternalLink, Sparkles, Building2, Eye, EyeOff
} from 'lucide-react';
import { VehicleItem, DealerProfile, SEED_DEALER } from '../../db/seed';
import { getStockNumber, calculateRate, formatMileage } from '../../utils/helpers';

interface WindowStickersHubViewProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
  onOpenWindowSticker: (car: VehicleItem) => void;
  showToast: (msg: string) => void;
}

export const WindowStickersHubView: React.FC<WindowStickersHubViewProps> = ({
  cars,
  dealer = SEED_DEALER,
  onOpenWindowSticker,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStockOnly, setFilterStockOnly] = useState(true);

  // 🔒 Opțiune afișare Serie Șasiu (VIN) — Implicit: false (ascuns conform cerinței)
  const [showVin, setShowVin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rxm_window_sticker_show_vin');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const handleToggleVin = () => {
    setShowVin(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rxm_window_sticker_show_vin', JSON.stringify(next));
      } catch {
        // ignore
      }
      showToast(next ? '✓ Seria de șasiu (VIN) va fi afișată pe fișele de parbriz.' : '✓ Seria de șasiu (VIN) este ascunsă implicit pe fișele de parbriz.');
      return next;
    });
  };

  const filteredCars = cars.filter(c => {
    if (filterStockOnly && c.status !== 'in_stock') return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const sn = getStockNumber(c).toLowerCase();
    return (
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.vin.toLowerCase().includes(q) ||
      sn.includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <QrCode className="w-3.5 h-3.5" /> Fișe Parbriz A4 Tipăribile cu Cod QR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Fișe de Parbriz Showroom (A4 & QR)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Generează fișe oficiale elegante de parbriz gata de afișat în parcul auto. Cumpărătorii pot scana codul QR cu telefonul pentru a deschide galeria foto HD și istoricul verificat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Căutare rapidă */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută vehicul..."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
            />
          </div>

          {/* Comutator Afișare / Ascundere Serie Șasiu (VIN) pe Fișele de Parbriz */}
          <button
            type="button"
            onClick={handleToggleVin}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showVin
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title={showVin ? 'Seriile de șasiu sunt setate să fie afișate pe fișele de parbriz. Click pentru a le ascunde.' : 'Seriile de șasiu sunt ascunse implicit pe fișele de parbriz. Click pentru a le activa.'}
          >
            {showVin ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>VIN: Afișat</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>VIN: Ascuns (Implicit)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterStockOnly(!filterStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterStockOnly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {filterStockOnly ? 'Doar În Stoc' : 'Toate Mașinile'}
          </button>
        </div>
      </div>

      {/* Grid Mașini cu Fișe Parbriz */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCars.map(c => {
          const sn = getStockNumber(c);
          const estRate = calculateRate(c.priceEur, 0.20, 60);

          return (
            <div 
              key={c.id}
              className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] hover:border-amber-500/35 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                    #{sn}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    c.status === 'in_stock' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {c.status === 'in_stock' ? 'În Stoc' : c.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img 
                    src={c.images[0]} 
                    alt={c.model} 
                    className="w-16 h-12 rounded-xl object-cover bg-zinc-800 border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {c.brand} {c.model}
                    </h3>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {c.year} &bull; {formatMileage(c.mileageKm)}
                    </div>
                    <div className="text-xs font-black text-amber-300 font-mono mt-1">
                      {c.priceEur.toLocaleString('ro-RO')} € 
                      <span className="text-[10.5px] font-normal text-zinc-400 ml-1.5">
                        (~{estRate} €/lună)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dotări cheie de parbriz */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[10.5px] text-zinc-400 space-y-1">
                  <div className="truncate">&bull; {c.fuelType} &bull; Cutie {c.transmission} &bull; {c.powerHp} CP</div>
                  <div className="truncate">&bull; Garanție scrisă {c.warrantyMonths || 12} luni inclusă</div>
                </div>
              </div>

              {/* Buton Deschidere Fișă */}
              <button
                type="button"
                onClick={() => onOpenWindowSticker(c)}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-amber-500 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Deschide & Tipărește Fișa Parbriz</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
