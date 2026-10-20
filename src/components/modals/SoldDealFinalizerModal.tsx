import React, { useState, useEffect, useRef } from 'react';
import { VehicleItem } from '../../db/types';
import { CheckCircle2, X, DollarSign, Calendar, TrendingUp, Sparkles, Tag, ArrowDownRight } from 'lucide-react';

export interface SoldDealFinalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: VehicleItem | null;
  onConfirm: (carId: string, soldPriceEur: number, soldAt: string) => void;
}

export const SoldDealFinalizerModal: React.FC<SoldDealFinalizerModalProps> = ({
  isOpen,
  onClose,
  car,
  onConfirm
}) => {
  const [soldPriceStr, setSoldPriceStr] = useState<string>('');
  const [soldAtDate, setSoldAtDate] = useState<string>('');
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Inițializare stare la deschiderea modalului
  useEffect(() => {
    if (isOpen && car) {
      const initialPrice = car.soldPriceEur || car.priceEur;
      setSoldPriceStr(initialPrice.toString());
      setSoldAtDate(car.soldAt ? car.soldAt.split('T')[0] : new Date().toISOString().split('T')[0]);

      // Focus și selectare pe input pentru tastare ultra-rapidă
      setTimeout(() => {
        if (priceInputRef.current) {
          priceInputRef.current.focus();
          priceInputRef.current.select();
        }
      }, 60);
    }
  }, [isOpen, car]);

  // Ascultare tasta Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !car) return null;

  const numericSoldPrice = parseInt(soldPriceStr.replace(/\D/g, ''), 10) || 0;
  const listingPrice = car.priceEur;
  const discountEur = listingPrice - numericSoldPrice;

  // Calcul cheltuieli & marjă
  const totalExpenses = (car.expenses || []).reduce((acc, exp) => acc + (exp.amountEur || 0), 0);
  const purchasePrice = car.purchasePriceEur || 0;
  const totalInvested = purchasePrice + totalExpenses;
  const estimatedGrossProfit = numericSoldPrice - totalInvested;
  const profitMarginPercent = totalInvested > 0 
    ? ((estimatedGrossProfit / totalInvested) * 100).toFixed(1) 
    : '0';

  // Aplicare pastilă discount rapid
  const applyDiscountPill = (discount: number) => {
    const targetPrice = Math.max(0, listingPrice - discount);
    setSoldPriceStr(targetPrice.toString());
    if (priceInputRef.current) {
      priceInputRef.current.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericSoldPrice <= 0) return;
    const finalIsoDate = soldAtDate ? `${soldAtDate}T12:00:00.000Z` : new Date().toISOString();
    onConfirm(car.id, numericSoldPrice, finalIsoDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-zinc-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Finalizare Vânzare & Preț Negociat
              </h3>
              <p className="text-xs text-zinc-400">
                Înregistrare tranzacție finală în arhivă și audit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 flex flex-col gap-5">
          {/* Card Detalii Mașină */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            {car.images && car.images[0] ? (
              <img 
                src={car.images[0]} 
                alt={`${car.brand} ${car.model}`}
                className="w-16 h-12 object-cover rounded-lg border border-zinc-800 shrink-0" 
              />
            ) : (
              <div className="w-16 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 shrink-0">
                Fără Poză
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {car.brand} {car.model} ({car.year})
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                <span>VIN: {car.vin ? `${car.vin.slice(0, 8)}...` : 'N/A'}</span>
                <span>•</span>
                <span className="text-amber-400 font-sans font-semibold">
                  Listat la: {listingPrice.toLocaleString('ro-RO')} €
                </span>
              </div>
            </div>
          </div>

          {/* Câmp Preț Vânzare Negociat */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Preț Efectiv Încasat (€)</span>
              {discountEur !== 0 && (
                <span className={`text-xs font-bold font-mono ${discountEur > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {discountEur > 0 
                    ? `Discount: -${discountEur.toLocaleString('ro-RO')} €` 
                    : `+${Math.abs(discountEur).toLocaleString('ro-RO')} € față de listare`}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                ref={priceInputRef}
                type="text"
                value={numericSoldPrice > 0 ? numericSoldPrice.toLocaleString('ro-RO') : soldPriceStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setSoldPriceStr(raw);
                }}
                placeholder="Ex: 14500"
                className="w-full pl-9 pr-12 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-zinc-400">
                EUR
              </div>
            </div>

            {/* Pastile Rapide de Negociere / Discount */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3 text-zinc-400" /> Negociat:
              </span>
              <button
                type="button"
                onClick={() => applyDiscountPill(0)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  discountEur === 0 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Preț Listare (0 €)
              </button>
              <button
                type="button"
                onClick={() => applyDiscountPill(200)}
                className={`text-[11px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                  discountEur === 200 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                -200 €
              </button>
              <button
                type="button"
                onClick={() => applyDiscountPill(500)}
                className={`text-[11px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                  discountEur === 500 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                -500 €
              </button>
              <button
                type="button"
                onClick={() => applyDiscountPill(1000)}
                className={`text-[11px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                  discountEur === 1000 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                -1.000 €
              </button>
              <button
                type="button"
                onClick={() => applyDiscountPill(1500)}
                className={`text-[11px] px-2 py-1 rounded-lg border font-medium transition-colors ${
                  discountEur === 1500 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                -1.500 €
              </button>
            </div>
          </div>

          {/* Câmp Dată Vânzare */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Data Încheierii Tranzacției</span>
            </label>
            <input
              type="date"
              value={soldAtDate}
              onChange={(e) => setSoldAtDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Mini-Raport Financiar Live (P&L preview) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cost Achiziție + Cheltuieli:</span>
              </span>
              <span className="font-mono text-zinc-200">
                {totalInvested > 0 ? `${totalInvested.toLocaleString('ro-RO')} €` : 'Nespecificat'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
              <span className="font-semibold text-zinc-300">Profit Net Estimat:</span>
              <div className="text-right">
                <span className={`font-mono font-bold text-sm ${
                  estimatedGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {estimatedGrossProfit >= 0 ? '+' : ''}{estimatedGrossProfit.toLocaleString('ro-RO')} €
                </span>
                {totalInvested > 0 && (
                  <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">
                    (marjă {profitMarginPercent}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Butoane Acțiune */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-semibold transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={numericSoldPrice <= 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmă Vânzarea ({numericSoldPrice.toLocaleString('ro-RO')} €)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
