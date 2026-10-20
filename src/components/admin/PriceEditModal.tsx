import React, { useState, useEffect } from 'react';
import { X, DollarSign, Sparkles, Check, AlertCircle, Percent } from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber } from '../../utils/helpers';

interface PriceEditModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSavePrice: (carId: string, newPriceEur: number, oldPriceEur?: number, auditNote?: string) => void;
  showToast?: (msg: string) => void;
}

export const PriceEditModal: React.FC<PriceEditModalProps> = ({
  isOpen,
  car,
  onClose,
  onSavePrice,
  showToast
}) => {
  const [priceInput, setPriceInput] = useState<string>('');
  const [oldPriceInput, setOldPriceInput] = useState<string>('');
  const [hasOldPrice, setHasOldPrice] = useState<boolean>(false);
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (car && isOpen) {
      setPriceInput(String(car.priceEur || ''));
      if (car.oldPriceEur && car.oldPriceEur > 0) {
        setHasOldPrice(true);
        setOldPriceInput(String(car.oldPriceEur));
      } else {
        setHasOldPrice(false);
        setOldPriceInput('');
      }
      setReasonInput('');
      setIsSaving(false);
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const currentPrice = car.priceEur || 0;
  const parsedNewPrice = parseInt(priceInput.replace(/\D/g, ''), 10) || 0;
  const parsedOldPrice = hasOldPrice ? (parseInt(oldPriceInput.replace(/\D/g, ''), 10) || undefined) : undefined;
  const priceDiff = parsedNewPrice - currentPrice;
  const isVat = !!car.vatDeductible;

  // Calcul strict 21% TVA conform normelor fiscale Carvana/RXM
  const netPrice = isVat ? Math.round(parsedNewPrice / 1.21) : parsedNewPrice;
  const vatAmount = isVat ? parsedNewPrice - netPrice : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedNewPrice <= 0) {
      showToast?.('⚠️ Introduceți un preț valid mai mare de 0 €.');
      return;
    }

    setIsSaving(true);
    try {
      await onSavePrice(car.id, parsedNewPrice, parsedOldPrice, reasonInput.trim() || undefined);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const stockRef = getStockNumber(car);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header cu accent Luxury */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/08 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Modificare Preț Vânzare
              </h3>
              <p className="text-xs text-zinc-400">
                {car.brand} {car.model} {car.versionTrim ? `(${car.versionTrim})` : ''} • Ref: <span className="font-mono text-amber-300 font-semibold">{stockRef}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/05 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formular Editare */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {/* Preț Curent vs Noul Preț */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/06">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-medium">Preț Curent de Listare</span>
              <div className="text-xl font-bold font-mono text-zinc-300 mt-1">
                {currentPrice.toLocaleString('ro-RO')} €
              </div>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {isVat ? 'TVA 21% deductibil inclus' : 'Regim Special Marjă (Preț Final)'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/05 border border-amber-500/25">
              <label htmlFor="new_price_input" className="text-[11px] text-amber-400 uppercase tracking-wider block font-bold">
                Noul Preț de Listare (€) *
              </label>
              <div className="relative mt-1">
                <input
                  id="new_price_input"
                  type="text"
                  autoFocus
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="ex: 13500"
                  className="w-full px-3 py-1.5 bg-black/60 border border-amber-500/40 rounded-lg text-lg font-bold font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold font-mono">€</span>
              </div>
              {parsedNewPrice > 0 && priceDiff !== 0 && (
                <span className={`text-[11px] font-bold mt-1 block ${priceDiff > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {priceDiff > 0 ? `+${priceDiff.toLocaleString('ro-RO')} € (creștere)` : `${priceDiff.toLocaleString('ro-RO')} € (reducere)`}
                </span>
              )}
            </div>
          </div>

          {/* Descompunere Fiscală TVA 21% Invariant */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/06 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-zinc-400" />
                Regim Fiscal:
              </span>
              <span className="font-semibold text-white">
                {isVat ? 'TVA Deductibil (21%)' : 'Regim Special Marjă (art. 312)'}
              </span>
            </div>

            {isVat ? (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/06 text-center text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Net (fără TVA)</span>
                  <span className="font-mono font-bold text-zinc-300">{netPrice.toLocaleString('ro-RO')} €</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">TVA 21%</span>
                  <span className="font-mono font-bold text-amber-400">{vatAmount.toLocaleString('ro-RO')} €</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Total Factură</span>
                  <span className="font-mono font-bold text-white">{parsedNewPrice.toLocaleString('ro-RO')} €</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
                Facturare în regim de marjă pentru bunuri second-hand. Cumpărătorul achită prețul total fără TVA defalcat.
              </p>
            )}
          </div>

          {/* Opțiune Preț Vechi (Barat promoțional) */}
          <div className="space-y-2 pt-1 border-t border-white/06">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasOldPrice}
                onChange={e => setHasOldPrice(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/20"
              />
              <span>Afișează un <strong>Preț Vechi Tăiat</strong> pe site (efect vizual de reducere promoțională)</span>
            </label>

            {hasOldPrice && (
              <div className="pl-6 pt-1">
                <div className="relative max-w-xs">
                  <input
                    type="text"
                    value={oldPriceInput}
                    onChange={e => setOldPriceInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="ex: 14500"
                    className="w-full px-3 py-1.5 bg-black/60 border border-white/15 rounded-lg text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold font-mono">€</span>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Pe site va apărea: <span className="line-through text-zinc-500 font-mono">{parsedOldPrice ? parsedOldPrice.toLocaleString('ro-RO') : '0'} €</span> → <span className="text-amber-400 font-bold font-mono">{parsedNewPrice.toLocaleString('ro-RO')} €</span>
                </span>
              </div>
            )}
          </div>

          {/* Motiv Ajustare (Salvat în Jurnalul de Audit) */}
          <div>
            <label htmlFor="reason_input" className="text-xs text-zinc-400 block mb-1.5 font-medium">
              Motiv ajustare preț (opțional, salvat în jurnalul intern al mașinii):
            </label>
            <input
              id="reason_input"
              type="text"
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="ex: Montat anvelope iarnă noi, revizie ulei și filtre efectuată"
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Butoane Acțiune */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/08">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/05 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSaving || parsedNewPrice <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Se salvează pe server...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvează & Actualizează pe Site</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
