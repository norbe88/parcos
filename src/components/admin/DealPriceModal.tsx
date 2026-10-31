import React, { useState, useEffect, useMemo } from 'react';
import { X, Flame, Sparkles, Tag, TrendingDown, AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { DealerProfile } from '../../db/types';
import { getStockNumber } from '../../utils/helpers';

export interface DealPricingData {
  isDealOfWeek: boolean;
  priceEur: number;
  oldPriceEur?: number;
  dealBadgeText?: string;
}

interface DealPriceModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSaveDeal: (carId: string, data: DealPricingData) => void;
  activeDealsCount: number;
  maxDealsLimit?: number;
  showToast?: (msg: string) => void;
  dealer?: DealerProfile | null;
}

export const DealPriceModal: React.FC<DealPriceModalProps> = ({
  isOpen,
  car,
  onClose,
  onSaveDeal,
  activeDealsCount,
  maxDealsLimit = 3,
  showToast,
  dealer
}) => {
  const presets = useMemo(() => {
    const dealerName = dealer?.name ? dealer.name.split(' ')[0] : 'SHOWROOM';
    return [
      'OFERTA SĂPTĂMÂNII',
      'REDUCERE SPECIALĂ',
      'PREȚ PROMOȚIONAL',
      `SUPER DEAL ${dealerName}`,
      'LICHIDARE STOC',
      'PROASPĂT INTRAT',
      'KM REALI CERTIFICAȚI',
      'TOP DOTĂRI PREMIUM',
      'SUPER OFERTĂ'
    ];
  }, [dealer]);
  const [isDealActive, setIsDealActive] = useState<boolean>(false);
  const [newPrice, setNewPrice] = useState<string>('');
  const [oldPrice, setOldPrice] = useState<string>('');
  const [badgeText, setBadgeText] = useState<string>('OFERTA SĂPTĂMÂNII');

  useEffect(() => {
    if (car) {
      setIsDealActive(!!car.isDealOfWeek);
      setNewPrice(car.priceEur ? String(car.priceEur) : '');
      setOldPrice(car.oldPriceEur ? String(car.oldPriceEur) : '');
      setBadgeText(car.dealBadgeText || 'OFERTA SĂPTĂMÂNII');
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const stockRef = getStockNumber(car);
  const parsedNewPrice = Number(newPrice) || 0;
  const parsedOldPrice = oldPrice ? Number(oldPrice) : undefined;

  const hasValidDiscount = !!(parsedOldPrice && parsedOldPrice > parsedNewPrice && parsedNewPrice > 0);
  const savings = hasValidDiscount ? (parsedOldPrice! - parsedNewPrice) : 0;
  const discountPercent = hasValidDiscount ? Math.round((savings / parsedOldPrice!) * 100) : 0;

  // Verificare limită maximă de 3 oferte
  const isCurrentlyDeal = !!car.isDealOfWeek;
  const wouldExceedLimit = !isCurrentlyDeal && isDealActive && activeDealsCount >= maxDealsLimit;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedNewPrice <= 0) {
      showToast?.('⚠️ Introduceți un preț de vânzare valid mai mare decât 0.');
      return;
    }

    if (wouldExceedLimit) {
      showToast?.(`⚠️ Limita de ${maxDealsLimit} Oferte ale Săptămânii este atinsă. Dezactivați una înainte de a adăuga alta.`);
      return;
    }

    onSaveDeal(car.id, {
      isDealOfWeek: isDealActive,
      priceEur: parsedNewPrice,
      oldPriceEur: isDealActive && parsedOldPrice && parsedOldPrice > 0 ? parsedOldPrice : undefined,
      dealBadgeText: isDealActive ? (badgeText.trim() || 'OFERTA SĂPTĂMÂNII') : undefined
    });

    onClose();
  };

  const handleRemoveDeal = () => {
    onSaveDeal(car.id, {
      isDealOfWeek: false,
      priceEur: parsedNewPrice > 0 ? parsedNewPrice : car.priceEur,
      oldPriceEur: undefined,
      dealBadgeText: undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#121215] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-transparent to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-black" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Setare Ofertă Promoțională</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Ajustează prețul promoțional și prețul vechi de referință
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info vehicul curent & sloturi */}
        <div className="px-5 py-3.5 bg-black/40 border-b border-white/[0.06] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={car.images[0]} 
              alt={car.model} 
              className="w-14 h-10 object-cover rounded-lg border border-white/10 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {car.brand} {car.model}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                #{stockRef} • {car.year} • {car.fuelType}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono font-semibold border flex items-center gap-1.5 ${
              activeDealsCount >= maxDealsLimit && !isCurrentlyDeal
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{activeDealsCount} / {maxDealsLimit} oferte active</span>
            </span>
          </div>
        </div>

        {/* Formular Modal */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Toggle Activare Ofertă */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Activează ca Ofertă a Săptămânii</span>
                {isDealActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-black font-extrabold uppercase">
                    Activ
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Apare în Caruselul din capul catalogului și pe primul loc în Showroom.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={isDealActive}
                onChange={(e) => setIsDealActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
            </label>
          </div>

          {wouldExceedLimit && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Ai atins deja limita de {maxDealsLimit} oferte active. Pentru a activa această mașină, dezactivează mai întâi una din cele existente.
              </span>
            </div>
          )}

          {/* Grid Câmpuri Preț: Preț Nou & Preț Vechi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Preț Nou Promoțional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Preț Nou Promoțional (€) *</span>
                <span className="text-[10px] text-amber-400 font-mono">În Showroom</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  max="500000"
                  step="50"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="ex. 12900"
                  required
                  className="w-full bg-[#18181c] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-white placeholder:text-zinc-600 outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                  €
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500">
                Prețul final la care se vinde mașina.
              </p>
            </div>

            {/* Preț Vechi de Referință */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Preț Vechi Tăiat (€)</span>
                <span className="text-[10px] text-zinc-400 font-mono">Opțional</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  max="500000"
                  step="50"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder="ex. 14500"
                  className="w-full bg-[#18181c] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2.5 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                  €
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500">
                Apare tăiat cu roșu pentru a evidenția reducerea.
              </p>
            </div>
          </div>

          {/* Card Calcul Reducere & Economie */}
          {hasValidDiscount ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Reducere de {savings.toLocaleString('ro-RO')} € ({discountPercent}%)
                  </div>
                  <div className="text-[11px] text-emerald-400/80 font-mono">
                    <span className="line-through text-zinc-400">{parsedOldPrice!.toLocaleString('ro-RO')} €</span>
                    <span className="mx-1.5">➔</span>
                    <span className="font-bold text-white">{parsedNewPrice.toLocaleString('ro-RO')} €</span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono text-xs border border-emerald-500/30">
                -{savings.toLocaleString('ro-RO')} €
              </span>
            </div>
          ) : parsedOldPrice && parsedOldPrice <= parsedNewPrice ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Prețul vechi ({parsedOldPrice.toLocaleString('ro-RO')} €) trebuie să fie mai mare decât prețul nou ({parsedNewPrice.toLocaleString('ro-RO')} €) pentru a genera reducere tăiată.
              </span>
            </div>
          ) : null}

          {/* Text Badge Promoțional */}
          {isDealActive && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Text Etichetă Badge Promoțional</span>
                <span className="text-[10px] text-amber-400 font-mono">Apare pe foto</span>
              </label>

              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="ex. OFERTA SĂPTĂMÂNII"
                className="w-full bg-[#18181c] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-zinc-600 outline-none transition-colors"
              />

              {/* Preset-uri Rapide */}
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBadgeText(preset)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                      badgeText === preset
                        ? 'bg-amber-400 text-black font-bold border-amber-400 shadow-sm'
                        : 'bg-white/5 text-zinc-300 hover:text-white border-white/10 hover:border-amber-400/40'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Butoane Acțiune */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
            {isCurrentlyDeal ? (
              <button
                type="button"
                onClick={handleRemoveDeal}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95"
              >
                Elimină din Oferte
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-all"
              >
                Anulează
              </button>

              <button
                type="submit"
                disabled={wouldExceedLimit}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                  wouldExceedLimit
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Salvează & Aplică</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
