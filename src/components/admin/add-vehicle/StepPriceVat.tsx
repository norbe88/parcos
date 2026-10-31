import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, BarChart3, Compass, Sparkles, Zap, CheckCircle2, Loader2, Save } from 'lucide-react';
import { calculateRate } from '../../../utils/helpers';
import { evaluateMarketPrice, fetchLiveMarketListings } from '../../../utils/marketPriceEngine';
import { VehicleItem, MarketPriceEvaluation } from '../../../db/types';

interface StepPriceVatProps {
  newPrice: string;
  setNewPrice: (val: string) => void;
  newWarranty: 12 | 24 | 36;
  setNewWarranty: (val: 12 | 24 | 36) => void;
  newVatDeductible: boolean;
  setNewVatDeductible: (val: boolean) => void;
  carDraftId?: string;
  carBrand?: string;
  carModel?: string;
  newModel?: string;
  carVersionTrim?: string;
  carYear?: number;
  carMileage?: string;
  carTransmission?: string;
  carFuel?: string;
  onOpenComparator?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onQuickSave?: () => void;
}

export const StepPriceVat: React.FC<StepPriceVatProps> = ({
  newPrice,
  setNewPrice,
  newWarranty,
  setNewWarranty,
  newVatDeductible,
  setNewVatDeductible,
  carDraftId,
  carBrand,
  carModel,
  newModel,
  carVersionTrim,
  carYear,
  carMileage,
  carTransmission,
  carFuel,
  onOpenComparator,
  onPrev,
  onNext,
  onQuickSave
}) => {
  const [liveEval, setLiveEval] = useState<MarketPriceEvaluation | null>(null);
  const [isScanningLive, setIsScanningLive] = useState(false);

  // Evaluare piață algoritmică locală ca fallback
  const marketEval = useMemo(() => {
    if (!carBrand || !carModel || carBrand.toLowerCase() === 'brand' || carModel.toLowerCase() === 'model') return null;
    const dummyCar: VehicleItem = {
      id: carDraftId || `draft-${carBrand}-${carModel}`,
      stockNumber: 'NOU',
      brand: carBrand,
      model: carModel,
      versionTrim: carVersionTrim || '',
      year: carYear || 2018,
      mileageKm: Number(carMileage) || 160000,
      priceEur: Number(newPrice) || 0,
      status: 'in_stock',
      transmission: (carTransmission as any) || 'Automată',
      fuelType: (carFuel as any) || 'Diesel',
      bodyType: 'Sedan',
      drivetrain: 'Față',
      powerHp: 150,
      engineCc: 1995,
      color: 'Negru',
      vin: 'DRAFT-VIN-0000',
      images: [],
      features: {
        safety: [],
        comfort: [],
        multimedia: []
      },
      description: '',
      warrantyMonths: newWarranty,
      vatDeductible: newVatDeductible
    };
    return evaluateMarketPrice(dummyCar, undefined, undefined, true);
  }, [carBrand, carModel, carVersionTrim, carYear, carMileage, carTransmission, carFuel, newWarranty, newVatDeductible, newPrice, carDraftId]);

  // Scanare în timp real pe Autovit pentru modelul exact curent
  useEffect(() => {
    if (!carBrand || !carModel || carBrand.toLowerCase() === 'brand' || carModel.toLowerCase() === 'model') {
      setLiveEval(null);
      return;
    }

    let isMounted = true;
    setIsScanningLive(true);

    const dummyCar: VehicleItem = {
      id: carDraftId || `draft-${carBrand}-${carModel}`,
      stockNumber: 'NOU',
      brand: carBrand,
      model: carModel,
      versionTrim: carVersionTrim || '',
      year: carYear || 2018,
      mileageKm: Number(carMileage) || 160000,
      priceEur: Number(newPrice) || 0,
      status: 'in_stock',
      transmission: (carTransmission as any) || 'Automată',
      fuelType: (carFuel as any) || 'Diesel',
      bodyType: 'Sedan',
      drivetrain: 'Față',
      powerHp: 150,
      engineCc: 1995,
      color: 'Negru',
      vin: 'DRAFT-VIN-0000',
      images: [],
      features: {
        safety: [],
        comfort: [],
        multimedia: []
      },
      description: '',
      warrantyMonths: newWarranty,
      vatDeductible: newVatDeductible
    };

    fetchLiveMarketListings(dummyCar)
      .then(liveAds => {
        if (!isMounted) return;
        setIsScanningLive(false);
        if (liveAds && liveAds.length > 0) {
          const fresh = evaluateMarketPrice(dummyCar, liveAds, undefined, true);
          setLiveEval(fresh);
        } else {
          setLiveEval(null);
        }
      })
      .catch(() => {
        if (isMounted) setIsScanningLive(false);
      });

    return () => { isMounted = false; };
  }, [carBrand, carModel, carYear, carMileage, carDraftId]);

  const activeEval = liveEval || marketEval;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* 📡 Panou Ghid Preț Piață & Căutare Live */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-transparent border border-blue-500/25 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isScanningLive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ghid Preț Piață & Lansator Live</span>
            </span>
            {isScanningLive ? (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Scanare Autovit...
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                OLX • Autovit • Mobile.de
              </span>
            )}
          </div>

          {onOpenComparator && (
            <button
              type="button"
              onClick={onOpenComparator}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 underline underline-offset-4 touch-manipulation cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Deschide Comparatorul de Preț Piață</span>
            </button>
          )}
        </div>

        {carBrand && carModel && activeEval && activeEval.avgPriceEur > 0 ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between text-xs text-zinc-300 mb-2">
              <span>
                Media pieței pentru <strong className="text-white">{carBrand} {carModel} ({carYear || 2018})</strong>:
              </span>
              <span className="font-mono font-extrabold text-amber-300 text-sm">
                ~{activeEval.avgPriceEur.toLocaleString('ro-RO')} €
                {activeEval.totalListingsCompared > 0 && (
                  <span className="text-[10px] text-zinc-400 font-normal ml-1.5">
                    ({activeEval.totalListingsCompared} oferte active)
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewPrice(activeEval.recommendedQuickSalePriceEur.toString())}
                className="p-2.5 rounded-xl bg-black/40 hover:bg-emerald-500/15 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                title="Click pentru a completa automat acest preț"
              >
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Vânzare Mai Rapidă</span>
                </span>
                <span className="text-sm font-mono font-black text-white group-hover:text-emerald-300 mt-0.5 block">
                  {activeEval.recommendedQuickSalePriceEur.toLocaleString('ro-RO')} €
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Click pentru auto-completare</span>
              </button>

              <button
                type="button"
                onClick={() => setNewPrice(activeEval.recommendedFairPriceEur.toString())}
                className="p-2.5 rounded-xl bg-black/40 hover:bg-amber-500/15 border border-amber-500/40 text-left transition-all group cursor-pointer"
                title="Click pentru a completa automat acest preț"
              >
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Preț Optim Recomandat</span>
                </span>
                <span className="text-sm font-mono font-black text-amber-300 group-hover:text-amber-200 mt-0.5 block">
                  {activeEval.recommendedFairPriceEur.toLocaleString('ro-RO')} €
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Echilibru marjă &amp; rotație</span>
              </button>

              <button
                type="button"
                onClick={() => setNewPrice(activeEval.recommendedPremiumPriceEur.toString())}
                className="p-2.5 rounded-xl bg-black/40 hover:bg-purple-500/15 border border-purple-500/30 text-left transition-all group cursor-pointer"
                title="Click pentru a completa automat acest preț"
              >
                <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Preț Maxim Negociabil</span>
                </span>
                <span className="text-sm font-mono font-black text-white group-hover:text-purple-300 mt-0.5 block">
                  {activeEval.recommendedPremiumPriceEur.toLocaleString('ro-RO')} €
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Pentru dotări excepționale</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">
            {isScanningLive 
              ? '⏳ Scanare în timp real pe piața auto (Autovit & OLX) pentru acest model...' 
              : 'ℹ️ Introduceți marca și modelul în Pasul 1 pentru a activa sugestiile de preț calculate automat din piața auto live.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-400 mb-1 font-semibold">Preț Vânzare Brut (€)</label>
          <div className="relative">
            <input 
              type="number" 
              required
              placeholder="Ex: 14990"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white font-bold text-base outline-none focus:border-amber-400"
            />
            <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">€</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Prețul final afișat cumpărătorilor în Showroom.</p>
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 font-semibold">Garanție Acordată de Dealer</label>
          <select 
            value={newWarranty}
            onChange={e => setNewWarranty(Number(e.target.value) as any)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-amber-400"
          >
            <option value={12}>12 Luni Garanție Inclusă (Standard)</option>
            <option value={24}>24 Luni Garanție Extinsă</option>
            <option value={36}>36 Luni Garanție Premium</option>
          </select>
        </div>
      </div>

      {/* Card Invariant TVA 21% */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={newVatDeductible}
              onChange={e => setNewVatDeductible(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <span className="font-semibold text-white text-xs">TVA Deductibil (Factură Firmă)</span>
          </label>
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold">
            Cota Legală: 21% TVA
          </span>
        </div>

        {newVatDeductible && newPrice && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-[11px]">
            <div>
              <span className="text-zinc-400 block">Preț Net (Fără TVA):</span>
              <strong className="text-white font-mono">{Math.round(Number(newPrice) / 1.21).toLocaleString('ro-RO')} €</strong>
            </div>
            <div>
              <span className="text-zinc-400 block">TVA 21%:</span>
              <strong className="text-amber-300 font-mono">{Math.round(Number(newPrice) - Number(newPrice) / 1.21).toLocaleString('ro-RO')} €</strong>
            </div>
            <div>
              <span className="text-zinc-400 block">Preț Total Brut:</span>
              <strong className="text-emerald-400 font-mono">{Number(newPrice).toLocaleString('ro-RO')} €</strong>
            </div>
          </div>
        )}
      </div>

      {/* Estimare Rata Lunară Dealer */}
      {newPrice && (
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-300">Rată estimată în Showroom (Avans 15%, 48 luni):</span>
            <div className="text-[11px] text-zinc-400">Parteneri: Banca Transilvania (BT Direct) & TBI Bank</div>
          </div>
          <div className="font-black text-amber-400 text-base font-mono">
            ~{calculateRate(Number(newPrice), 15, 48)} € / lună
          </div>
        </div>
      )}

      {/* 💾 Quick Save — disponibil imediat după introducerea prețului */}
      {onQuickSave && (carModel || newModel) && parseFloat(newPrice) > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onQuickSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40
                       text-emerald-400 font-semibold text-xs sm:text-sm transition-all duration-200
                       active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>💾 Salvează Rapid în Stoc — fără poze (adaugi fotografii mai târziu)</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08]">
        <button 
          type="button" 
          onClick={onPrev}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>Înapoi: Date Tehnice</span>
        </button>
        <button 
          type="button" 
          onClick={onNext}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <span>Pasul Următor: Dotări</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
