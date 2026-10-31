import React from 'react';
import { 
  CheckCircle2, ChevronUp, ChevronDown, AlertTriangle, 
  Car, RotateCcw, Clock, FileText, ExternalLink 
} from 'lucide-react';
import { VehicleItem } from '../../../db/seed';
import { 
  calculateVehicleFinancials, 
  getStockNumber, 
  normalizeCarImageUrl,
  formatMileage 
} from '../../../utils/helpers';

export interface InventoryArchiveStats {
  totalRevenue: number;
  totalPurchase: number;
  totalExpenses: number;
  totalProfit: number;
}

export interface InventoryArchiveSectionProps {
  soldCars: VehicleItem[];
  statusFilter: string;
  isArchiveOpen: boolean;
  setIsArchiveOpen: React.Dispatch<React.SetStateAction<boolean>>;
  soldRevenueTotal: number;
  archiveStats: InventoryArchiveStats;
  onStatusChange: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines') => void;
  onOpenSalesDocs: (car: VehicleItem) => void;
  setAuditDrawerCar: React.Dispatch<React.SetStateAction<VehicleItem | null>>;
  showToast: (msg: string) => void;
}

export const InventoryArchiveSection: React.FC<InventoryArchiveSectionProps> = ({
  soldCars,
  statusFilter,
  isArchiveOpen,
  setIsArchiveOpen,
  soldRevenueTotal,
  archiveStats,
  onStatusChange,
  onSelectCar,
  onOpenSalesDocs,
  setAuditDrawerCar,
  showToast
}) => {
  if (soldCars.length === 0 && statusFilter !== 'sold') {
    return null;
  }

  return (
    <div className="bg-[#121215] border border-white/[0.08] hover:border-white/15 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Header Accordion */}
      <button
        type="button"
        onClick={() => setIsArchiveOpen(!isArchiveOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left bg-gradient-to-r from-black/60 to-transparent hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                📁 Arhivă Autovehicule Vândute
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold">
                {soldCars.length} {soldCars.length === 1 ? 'vehicul' : 'vehicule'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Mașini livrate clienților, retrase automat din gestiunea zilnică activă.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[11px] text-zinc-500 font-medium">Volum Vânzări Încasat</span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
              {soldRevenueTotal.toLocaleString('ro-RO')} €
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors">
            {isArchiveOpen || statusFilter === 'sold' ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* Corpul Arhivei (Colapsibil) */}
      {(isArchiveOpen || statusFilter === 'sold') && (
        <div className="border-t border-white/[0.08] p-4 sm:p-5 bg-black/40 space-y-4">
          
          {/* Sumar Financiar Arhivă Vânzări (Ticket 04) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/05">
              <span className="text-[10px] text-zinc-400 block font-medium">Volum Vânzări (Cifră de Afaceri)</span>
              <span className="text-sm sm:text-base font-black font-mono text-white">
                {archiveStats.totalRevenue.toLocaleString('ro-RO')} €
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/05">
              <span className="text-[10px] text-zinc-400 block font-medium">Cost Achiziție Total</span>
              <span className="text-sm sm:text-base font-black font-mono text-zinc-300">
                {archiveStats.totalPurchase.toLocaleString('ro-RO')} €
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/05">
              <span className="text-[10px] text-zinc-400 block font-medium">Cheltuieli Service & Regie</span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                {archiveStats.totalExpenses.toLocaleString('ro-RO')} €
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${archiveStats.totalProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <span className="text-[10px] text-zinc-400 block font-medium">Profit Net Realizat (TVA 21%)</span>
              <span className={`text-sm sm:text-base font-black font-mono ${archiveStats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {archiveStats.totalProfit > 0 ? '+' : ''}{archiveStats.totalProfit.toLocaleString('ro-RO')} €
              </span>
            </div>
          </div>

          {/* ⚠️ Alertă Dezactivare Anunțuri OLX la Vânzare (Ticket 04) */}
          {soldCars.some(c => c.olxStatus === 'active') && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Atenție: Există vehicule marcate ca vândute care au încă anunțuri active pe OLX! Vă recomandăm dezactivarea lor pentru a preveni apeluri redundante.
                </span>
              </div>
            </div>
          )}

          {soldCars.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Nu există vehicule vândute în baza de date conform filtrelor actuale.
            </div>
          ) : (
            <>
              {/* 💻 TABEL ARHIVĂ DESKTOP (MD+) */}
              <div className="hidden md:block overflow-x-auto touch-manipulation scrollbar-thin">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Vehicul Vândut</th>
                      <th className="py-3 px-3">Data Vânzării</th>
                      <th className="py-3 px-3">Preț Încasat & Profit</th>
                      <th className="py-3 px-3">Alertă OLX</th>
                      <th className="py-3 px-3 text-right">Acțiuni Gestiune</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {soldCars.map(c => {
                      const financials = calculateVehicleFinancials(c);
                      const stockNum = getStockNumber(c);
                      const soldDateFormatted = c.soldAt 
                        ? new Date(c.soldAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Nedatat';
                      
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Vehicul */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {c.images && c.images.length > 0 ? (
                                <img 
                                  src={normalizeCarImageUrl(c.images[0])} 
                                  alt={c.model}
                                  className="w-12 h-9 rounded-lg object-cover bg-zinc-800 border border-white/10 shrink-0 grayscale opacity-80"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-zinc-500">
                                  <Car className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <div 
                                  onClick={() => onSelectCar(c, 'specs')}
                                  className="font-bold text-white hover:text-amber-400 cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{c.brand} {c.model}</span>
                                  <span className="text-[10px] font-mono text-zinc-400">({c.year})</span>
                                  <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-1 rounded">#{stockNum}</span>
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  {c.versionTrim} • {formatMileage(c.mileageKm)} km
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500">
                                  VIN: {c.vin}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Data Vânzării */}
                          <td className="py-3 px-3 font-mono text-zinc-300">
                            {soldDateFormatted}
                          </td>

                          {/* Preț Încasat & Profit */}
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-white text-xs">
                              {(c.soldPriceEur ?? c.priceEur).toLocaleString('ro-RO')} €
                            </div>
                            <div className={`text-[10.5px] font-semibold ${financials.netProfitEur >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              Profit: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                            </div>
                            {c.purchasePriceEur && (
                              <div className="text-[9.5px] text-zinc-500">
                                Achiz: {c.purchasePriceEur.toLocaleString('ro-RO')} €
                              </div>
                            )}
                          </td>

                          {/* Alertă OLX */}
                          <td className="py-3 px-3">
                            {c.olxStatus === 'active' ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Activ OLX</span>
                                {c.olxUrl && (
                                  <a 
                                    href={c.olxUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="underline ml-0.5 hover:text-white"
                                    title="Deschide anunțul OLX pentru dezactivare"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-zinc-500 font-mono">
                                Inactiv / Retras
                              </span>
                            )}
                          </td>

                          {/* Acțiuni Gestiune */}
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  onStatusChange(c.id, 'in_stock');
                                  showToast(`✓ Mașina ${c.brand} ${c.model} a fost reactivată și repusă în stoc!`);
                                }}
                                className="min-h-[30px] px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                title="Repune mașina înapoi în stoc activ (dacă vânzarea nu s-a mai finalizat)"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-400" />
                                <span>Reactivează</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuditDrawerCar(c)}
                                className="min-h-[30px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                                title="Vezi jurnalul de audit și notele mașinii"
                              >
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Audit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenSalesDocs(c)}
                                className="min-h-[30px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                                title="Deschide actele de vânzare și contractul"
                              >
                                <FileText className="w-3 h-3 text-cyan-400" />
                                <span>Acte</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 📱 CARDURI ARHIVĂ PENTRU MOBIL (< MD) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {soldCars.map(c => {
                  const financials = calculateVehicleFinancials(c);
                  const stockNum = getStockNumber(c);
                  const soldDateFormatted = c.soldAt 
                    ? new Date(c.soldAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Nedatat';

                  return (
                    <div 
                      key={c.id} 
                      className="bg-[#18181c] border border-white/10 rounded-xl p-3 space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        {c.images && c.images.length > 0 ? (
                          <img 
                            src={normalizeCarImageUrl(c.images[0])} 
                            alt={c.model}
                            className="w-16 h-12 rounded-lg object-cover bg-zinc-800 border border-white/10 shrink-0 grayscale opacity-80"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-zinc-500">
                            <Car className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div 
                            onClick={() => onSelectCar(c, 'specs')}
                            className="font-bold text-white text-xs hover:text-amber-400 cursor-pointer flex items-center gap-1.5 flex-wrap"
                          >
                            <span>{c.brand} {c.model}</span>
                            <span className="text-[10px] text-zinc-400">({c.year})</span>
                            <span className="text-[9px] font-mono text-zinc-400 bg-white/5 px-1 rounded">#{stockNum}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 line-clamp-1">
                            {c.versionTrim} • {formatMileage(c.mileageKm)} km
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            VIN: {c.vin}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/06 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Vândut La / Dată:</span>
                          <span className="font-bold text-white text-xs">
                            {(c.soldPriceEur ?? c.priceEur).toLocaleString('ro-RO')} €
                          </span>
                          <span className="text-[10px] text-zinc-400 block">{soldDateFormatted}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Profit Net:</span>
                          <span className={`font-bold text-xs ${financials.netProfitEur >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                          </span>
                          {c.purchasePriceEur && (
                            <span className="text-[10px] text-zinc-500 block">
                              Achiz: {c.purchasePriceEur.toLocaleString('ro-RO')} €
                            </span>
                          )}
                        </div>
                      </div>

                      {c.olxStatus === 'active' && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300 text-[10px] flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            Anunț încă activ pe OLX!
                          </span>
                          {c.olxUrl && (
                            <a 
                              href={c.olxUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline font-bold text-amber-200"
                            >
                              Dezactivează ➔
                            </a>
                          )}
                        </div>
                      )}

                      {/* Butoane Acțiuni Gestiune Arhivă */}
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-white/06">
                        <button
                          type="button"
                          onClick={() => {
                            onStatusChange(c.id, 'in_stock');
                            showToast(`✓ Mașina ${c.brand} ${c.model} a fost reactivată și repusă în stoc!`);
                          }}
                          className="min-h-[30px] px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3 text-emerald-400" />
                          <span>Reactivează</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditDrawerCar(c)}
                          className="min-h-[30px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Audit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenSalesDocs(c)}
                          className="min-h-[30px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[10px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>Acte</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
