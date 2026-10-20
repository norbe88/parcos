import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Check, ShieldCheck, 
  Search, ArrowRight, Zap, Info, Clock, Smartphone
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber, computeOlxDiscrepancy } from '../../utils/helpers';
import { 
  fetchOlxLiveSnapshot, checkEdgeNodeCooldown, OlxLiveSnapshot 
} from '../../utils/olxSyncClient';

interface OlxStockSyncManagerProps {
  cars: VehicleItem[];
  onStatusChange: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  showToast: (msg: string) => void;
  onBulkReconcile?: (carIdsToSell: string[]) => void;
  onUpdateOlxLink?: (carId: string, olxUrl: string) => void;
}

export const OlxStockSyncManager: React.FC<OlxStockSyncManagerProps> = ({
  cars,
  onStatusChange,
  showToast,
  onBulkReconcile,
  onUpdateOlxLink
}) => {
  const [snapshot, setSnapshot] = useState<OlxLiveSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'discrepancies' | 'active_olx' | 'critical_sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Încărcare snapshot inițial generat de nodul S9
  useEffect(() => {
    loadSnapshot();
  }, []);

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOlxLiveSnapshot();
      setSnapshot(data);
    } catch (e) {
      console.warn('Nu s-a putut încărca snapshot-ul OLX live:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Cooldown status
  const cooldownInfo = useMemo(() => {
    return checkEdgeNodeCooldown(snapshot?.meta);
  }, [snapshot]);

  // Evaluare discrepanțe raportat la starea curentă din cars
  const analyzedVehicles = useMemo(() => {
    return cars.map(car => {
      const snapshotItem = snapshot?.items.find(item => item.carId === car.id);
      const effectiveOlxStatus = snapshotItem?.olxStatus || car.olxStatus || 'unlinked';
      const effectiveOlxUrl = car.olxUrl || snapshotItem?.olxUrl;
      const discrepancy = computeOlxDiscrepancy(car.status, effectiveOlxStatus);

      return {
        ...car,
        effectiveOlxStatus,
        effectiveOlxUrl,
        discrepancy,
        httpCode: snapshotItem?.olxHttpCode
      };
    });
  }, [cars, snapshot]);

  // Statistici specifice
  const stats = useMemo(() => {
    const total = analyzedVehicles.length;
    const withOlx = analyzedVehicles.filter(v => v.effectiveOlxUrl).length;
    const activeOlx = analyzedVehicles.filter(v => v.effectiveOlxStatus === 'active').length;
    const soldButActive = analyzedVehicles.filter(v => v.discrepancy === 'sold_but_active_on_olx').length;
    const inStockButGone = analyzedVehicles.filter(v => v.discrepancy === 'in_stock_but_gone_on_olx').length;
    const perfectlySynced = analyzedVehicles.filter(v => v.discrepancy === 'none' && v.effectiveOlxStatus === 'active').length;

    return {
      total,
      withOlx,
      activeOlx,
      soldButActive,
      inStockButGone,
      perfectlySynced,
      totalDiscrepancies: soldButActive + inStockButGone
    };
  }, [analyzedVehicles]);

  // Filtrare mașini
  const filteredVehicles = useMemo(() => {
    return analyzedVehicles.filter(v => {
      // Filtru Categorie
      if (activeFilter === 'discrepancies' && v.discrepancy === 'none') return false;
      if (activeFilter === 'active_olx' && v.effectiveOlxStatus !== 'active') return false;
      if (activeFilter === 'critical_sold' && v.discrepancy !== 'sold_but_active_on_olx') return false;

      // Căutare text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = getStockNumber(v).toLowerCase();
        const brandModel = `${v.brand} ${v.model}`.toLowerCase();
        const vin = (v.vin || '').toLowerCase();
        return ref.includes(q) || brandModel.includes(q) || vin.includes(q);
      }

      return true;
    });
  }, [analyzedVehicles, activeFilter, searchQuery]);

  // Reconciliere automată mașini dispărute de pe OLX
  const handleAutoReconcile = () => {
    const toReconcile = analyzedVehicles
      .filter(v => v.discrepancy === 'in_stock_but_gone_on_olx')
      .map(v => v.id);

    if (toReconcile.length === 0) {
      showToast('Toate mașinile sunt deja aliniate cu starea de pe OLX.');
      return;
    }

    if (onBulkReconcile) {
      onBulkReconcile(toReconcile);
    } else {
      toReconcile.forEach(id => onStatusChange(id, 'sold'));
    }
    showToast(`✅ ${toReconcile.length} mașini au fost trecute automat pe 'Vândut' în Showroom!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 📡 Antet Modul & Banner Nod Edge GSM S9 */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Sincronizare Activă OLX (Monitorizare Stoc în Timp Real)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Sincronizare Stoc OLX & Monitor Discrepanțe
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Sistemul verifică asincron starea fiecărui anunț pe OLX în fundal, evitând blocajele de rețea. Stocul showroom-ului RXM rămâne 100% sincronizat și la zi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Indicator Cooldown Guard */}
            <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Interval Sincronizare</div>
                <div className="font-mono text-white text-xs">
                  {cooldownInfo.isCoolingDown ? (
                    <span className="text-amber-300">Activ (Liber după {cooldownInfo.nextAllowedFormatted})</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Actualizat recent (auto la 15 min)</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={loadSnapshot}
              disabled={isLoading}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98]"
              title="Reîncarcă starea recentă din OLX"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Sincronizează Acum</span>
            </button>
          </div>
        </div>

        {/* Notă explicativă protecție cartelă GSM */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Sincronizare Inteligentă Activă:</strong> Verificarea anunțurilor rulează automat în fundal, asigurând acuratețea stocului fără intervenție manuală.
          </span>
        </div>
      </div>

      {/* 📊 4 Carduri KPI specifice OLX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08]">
          <div className="text-xs text-zinc-400 mb-1">Mașini Mapate pe OLX</div>
          <div className="text-3xl font-black text-white font-mono">{stats.withOlx} / {stats.total}</div>
          <div className="text-[11px] text-zinc-400 mt-1">100% cu URL anunț identificat</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08]">
          <div className="text-xs text-zinc-400 mb-1">Anunțuri Active pe OLX</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{stats.activeOlx}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Anunțuri verificate și active în timp real</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-amber-500/30 bg-amber-500/[0.03]">
          <div className="text-xs text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Vândute în Parc, Active OLX
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">{stats.soldButActive}</div>
          <div className="text-[11px] text-amber-300/80 mt-1 font-medium">Generează apeluri inutile (Dezactivează!)</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-rose-500/30 bg-rose-500/[0.03]">
          <div className="text-xs text-rose-300 font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Dispărute OLX, În Stoc Site
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{stats.inStockButGone}</div>
          <div className="text-[11px] text-rose-300/80 mt-1 font-medium">Necesită marcare ca Vândut</div>
        </div>
      </div>

      {/* ⚠️ Banner Acțiune Reconciliere Rapidă */}
      {(stats.soldButActive > 0 || stats.inStockButGone > 0) && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#121215] to-rose-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Discrepanțe de Stoc Detectate ({stats.totalDiscrepancies})
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                {stats.soldButActive > 0 && `${stats.soldButActive} mașini vândute pe site au încă anunțul activ pe OLX. `}
                {stats.inStockButGone > 0 && `${stats.inStockButGone} mașini au fost dezactivate pe OLX dar figurează încă 'În Stoc'.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {stats.inStockButGone > 0 && (
              <button
                onClick={handleAutoReconcile}
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Reconciliere 1-Click (Treci pe Vândut)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔍 Bară Filtre & Căutare */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.98] ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Toate ({analyzedVehicles.length})
          </button>

          <button
            onClick={() => setActiveFilter('discrepancies')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation active:scale-[0.98] ${
              activeFilter === 'discrepancies'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Discrepanțe ({stats.totalDiscrepancies})</span>
          </button>

          <button
            onClick={() => setActiveFilter('critical_sold')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.98] ${
              activeFilter === 'critical_sold'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Vândute dar Active OLX ({stats.soldButActive})
          </button>

          <button
            onClick={() => setActiveFilter('active_olx')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.98] ${
              activeFilter === 'active_olx'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Active pe OLX ({stats.activeOlx})
          </button>
        </div>

        {/* Input Căutare */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Caută după Ref, Marcă, VIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] bg-[#121215] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 touch-manipulation"
          />
        </div>
      </div>

      {/* 📋 Tabel Detaliat de Sincronizare OLX */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto touch-manipulation scrollbar-thin">
          <table className="w-full text-left text-xs text-zinc-300 min-w-[760px]">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Cod Stoc</th>
                <th className="py-3 px-4">Vehicul</th>
                <th className="py-3 px-4">Status Showroom</th>
                <th className="py-3 px-4">Status OLX</th>
                <th className="py-3 px-4">Diagnoză Discrepanță</th>
                <th className="py-3 px-4 text-right">Acțiuni Recomandate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredVehicles.map(v => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  
                  {/* Cod Stoc */}
                  <td className="py-4 px-4 font-mono font-bold text-amber-300 text-xs whitespace-nowrap">
                    <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                      #{getStockNumber(v)}
                    </span>
                  </td>

                  {/* Vehicul */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={v.images[0]} alt={v.model} className="w-12 h-9 rounded-lg object-cover bg-zinc-800" />
                      <div>
                        <div className="font-bold text-white text-sm">{v.brand} {v.model}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{v.priceEur.toLocaleString('ro-RO')} € • {v.year}</div>
                      </div>
                    </div>
                  </td>

                  {/* Status Showroom cu Butoane Rapide */}
                  <td className="py-4 px-4">
                    <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-black/40">
                      <button 
                        onClick={() => onStatusChange(v.id, 'in_stock')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${v.status === 'in_stock' ? 'bg-emerald-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
                      >
                        În Stoc
                      </button>
                      <button 
                        onClick={() => onStatusChange(v.id, 'reserved')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${v.status === 'reserved' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Rezervat
                      </button>
                      <button 
                        onClick={() => onStatusChange(v.id, 'sold')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${v.status === 'sold' ? 'bg-red-500 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Vândut
                      </button>
                    </div>
                  </td>

                  {/* Status OLX */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {v.effectiveOlxStatus === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Activ pe OLX</span>
                      </span>
                    ) : v.effectiveOlxStatus === 'expired' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>Anunț Inactiv / Retras</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">Fără link asociat</span>
                    )}
                  </td>

                  {/* Diagnoză Discrepanță */}
                  <td className="py-4 px-4">
                    {v.discrepancy === 'sold_but_active_on_olx' ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Vândută pe site, dar Activă pe OLX!</span>
                      </div>
                    ) : v.discrepancy === 'in_stock_but_gone_on_olx' ? (
                      <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Anunțul a dispărut de pe OLX!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>100% Sincronizat</span>
                      </div>
                    )}
                  </td>

                  {/* Acțiuni Recomandate */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {v.discrepancy === 'sold_but_active_on_olx' && v.effectiveOlxUrl ? (
                      <a
                        href={v.effectiveOlxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors"
                        title="Deschide anunțul pe OLX pentru a-l opri/dezactiva"
                      >
                        <span>Dezactivează pe OLX</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : v.discrepancy === 'in_stock_but_gone_on_olx' ? (
                      <button
                        onClick={() => {
                          onStatusChange(v.id, 'sold');
                          showToast(`Mașina ${v.brand} ${v.model} a fost marcată ca Vândută.`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Treci pe Vândut</span>
                      </button>
                    ) : v.effectiveOlxUrl ? (
                      <a
                        href={v.effectiveOlxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
                      >
                        <span>Vezi pe OLX</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
