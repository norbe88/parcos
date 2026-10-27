import React from 'react';
import { 
  Car, Search, LayoutGrid, List, ArrowUpDown, 
  Shield, AlertTriangle, DollarSign, ExternalLink, Clock,
  UploadCloud, RefreshCw, CloudOff
} from 'lucide-react';
import { VehicleItem } from '../../../db/seed';

export interface GovernanceStats {
  redPlatesExpiring: number;
  missingPurchase: number;
  olxDiscrepancies: number;
  slowAging: number;
}

export interface InventoryToolbarProps {
  cars: VehicleItem[];
  activeCarsCount: number;
  soldCarsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'in_stock' | 'preparing' | 'reserved' | 'sold' | 'discrepancy';
  setStatusFilter: (filter: 'all' | 'in_stock' | 'preparing' | 'reserved' | 'sold' | 'discrepancy') => void;
  governanceFilter: 'none' | 'red_plates_expiring' | 'missing_purchase_price' | 'olx_discrepancy' | 'slow_aging';
  setGovernanceFilter: (filter: 'none' | 'red_plates_expiring' | 'missing_purchase_price' | 'olx_discrepancy' | 'slow_aging') => void;
  governanceStats: GovernanceStats;
  discrepanciesCount: number;
  viewLayout: 'grid' | 'table';
  setViewLayout: (layout: 'grid' | 'table') => void;
  sortBy: 'default' | 'aging_desc' | 'aging_asc' | 'price_desc' | 'price_asc';
  setSortBy: (sort: 'default' | 'aging_desc' | 'aging_asc' | 'price_desc' | 'price_asc') => void;
  localCarsCount: number;
  handlePublishAllLocal: () => void;
  isBulkSyncing: boolean;
  bulkSyncProgress: { current: number; total: number } | null;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  cars,
  activeCarsCount,
  soldCarsCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  governanceFilter,
  setGovernanceFilter,
  governanceStats,
  discrepanciesCount,
  viewLayout,
  setViewLayout,
  sortBy,
  setSortBy,
  localCarsCount,
  handlePublishAllLocal,
  isBulkSyncing,
  bulkSyncProgress
}) => {
  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Rândul 1: Titlu, Căutare & Switcher Carduri / Tabel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg text-white">
              Vehicule în Parc ({activeCarsCount} active · {soldCarsCount} în arhivă)
            </h2>
            <p className="text-xs text-zinc-400">
              Gestiune activă a stocului, rotație showroom, prețuri și sincronizare OLX.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Input Căutare Rapidă (Lățime completă pe mobil) */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              id="inventory-search-query"
              name="inventory_search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută marcă, model, VIN, stoc..."
              aria-label="Caută în inventar după marcă, model, VIN sau număr stoc"
              className="w-full bg-[#18181c] border border-white/10 focus:border-amber-400/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all shadow-inner shadow-black/40 min-h-[38px]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                aria-label="Șterge căutarea"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controale Secundare: Sortare & Switcher pe rând responsiv */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            {/* Selector Sortare Stoc & Preț (Ticket 02) */}
            <div className="relative flex-1 sm:flex-initial inline-flex items-center">
              <select
                id="inventory-sort-by"
                name="inventory_sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sortează vehiculele după vechime sau preț"
                className="w-full sm:w-auto bg-[#18181c] border border-white/10 hover:border-amber-400/50 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-zinc-300 hover:text-white outline-none transition-all cursor-pointer min-h-[38px] appearance-none shadow-inner shadow-black/40"
                title="Sortează vehiculele după vechime sau preț"
              >
                <option value="default">Sortare: Implicită</option>
                <option value="aging_desc">⏳ Vechime: Stoc Lent (Aging ↓)</option>
                <option value="aging_asc">✨ Vechime: Recente (Aging ↑)</option>
                <option value="price_desc">💰 Preț: Descrescător</option>
                <option value="price_asc">🏷️ Preț: Crescător</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Comutator Vedere: Carduri Executive vs Tabel Compact */}
            <div className="inline-flex rounded-xl border border-white/10 p-1 bg-black/40 shrink-0">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] touch-manipulation cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Vedere Carduri Executive (Mobile-First & Touch)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Carduri</span>
              </button>

              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] touch-manipulation cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Vedere Tabel Compact & Marjă"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ☁️ BANNER MAȘINI LOCALE NESINCRONIZATE (Ticket 05) */}
      {localCarsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-black/40 to-sky-500/15 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <CloudOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>Ai {localCarsCount} {localCarsCount === 1 ? 'mașină salvată' : 'mașini salvate'} doar în acest browser</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">Doar Local</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Aceste mașini nu sunt încă vizibile pentru public în Showroom. Publică-le acum în Showroom cu un singur click.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePublishAllLocal}
            disabled={isBulkSyncing}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-wait"
          >
            {isBulkSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Se publică ({bulkSyncProgress?.current}/{bulkSyncProgress?.total})...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-white" />
                <span>Publică în Showroom ({localCarsCount})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Rândul 2: Filtre Rapide Pill pe Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 touch-manipulation scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border ${
            statusFilter === 'all'
              ? 'bg-white/15 text-white border-white/30'
              : 'bg-white/03 text-zinc-400 hover:text-white border-white/05 hover:bg-white/08'
          }`}
        >
          Toate ({cars.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in_stock')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : 'bg-emerald-500/05 text-emerald-400/80 border-emerald-500/20 hover:bg-emerald-500/15'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>În Stoc ({cars.filter(c => c.status === 'in_stock').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('preparing')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            statusFilter === 'preparing'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10'
              : 'bg-amber-500/05 text-amber-400/80 border-amber-500/20 hover:bg-amber-500/15'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>În Pregătire ({cars.filter(c => c.status === 'preparing').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('reserved')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            statusFilter === 'reserved'
              ? 'bg-amber-600/20 text-amber-200 border-amber-600/50 shadow-sm shadow-amber-600/10'
              : 'bg-amber-600/05 text-amber-300/80 border-amber-600/20 hover:bg-amber-600/15'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          <span>Rezervate ({cars.filter(c => c.status === 'reserved').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('sold')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            statusFilter === 'sold'
              ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm shadow-red-500/10'
              : 'bg-red-500/05 text-red-400/80 border-red-500/20 hover:bg-red-500/15'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Arhivă Vândute ({cars.filter(c => c.status === 'sold').length})</span>
        </button>

        {discrepanciesCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('discrepancy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
              statusFilter === 'discrepancy'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Alerte OLX ({discrepanciesCount})</span>
          </button>
        )}
      </div>

      {/* Rândul 3: Filtre Rapide de Guvernanță & Alertă Dealer (Ticket 04) */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto pb-1 touch-manipulation scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Guvernanță:</span>
        </span>

        <button
          type="button"
          onClick={() => setGovernanceFilter(governanceFilter === 'red_plates_expiring' ? 'none' : 'red_plates_expiring')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 min-h-[30px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            governanceFilter === 'red_plates_expiring'
              ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
          <span>Numere Roșii Expiră &lt;7z ({governanceStats.redPlatesExpiring})</span>
        </button>

        <button
          type="button"
          onClick={() => setGovernanceFilter(governanceFilter === 'missing_purchase_price' ? 'none' : 'missing_purchase_price')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 min-h-[30px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            governanceFilter === 'missing_purchase_price'
              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <DollarSign className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Fără Preț Achiziție ({governanceStats.missingPurchase})</span>
        </button>

        <button
          type="button"
          onClick={() => setGovernanceFilter(governanceFilter === 'olx_discrepancy' ? 'none' : 'olx_discrepancy')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 min-h-[30px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            governanceFilter === 'olx_discrepancy'
              ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
              : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
          }`}
        >
          <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
          <span>Discrepanță OLX ({governanceStats.olxDiscrepancies})</span>
        </button>

        <button
          type="button"
          onClick={() => setGovernanceFilter(governanceFilter === 'slow_aging' ? 'none' : 'slow_aging')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 min-h-[30px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
            governanceFilter === 'slow_aging'
              ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
              : 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20'
          }`}
        >
          <Clock className="w-3 h-3 text-orange-400 shrink-0" />
          <span>Stoc Lent &gt;45z ({governanceStats.slowAging})</span>
        </button>

        {governanceFilter !== 'none' && (
          <button
            type="button"
            onClick={() => setGovernanceFilter('none')}
            className="px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            ✕ Resetează
          </button>
        )}
      </div>
    </div>
  );
};
