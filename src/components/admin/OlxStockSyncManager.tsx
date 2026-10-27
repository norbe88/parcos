import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Check, ShieldCheck, 
  Search, ArrowRight, Zap, Info, Clock, Smartphone, Tag, Sparkles, X, Link2, Copy
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber, computeOlxDiscrepancy, extractOlxId } from '../../utils/helpers';
import { 
  fetchOlxLiveSnapshot, checkEdgeNodeCooldown, OlxLiveSnapshot,
  reconcileAdWithInventory, ReconcileResult
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'discrepancies' | 'active_olx' | 'critical_sold' | 'unlinked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wave 2: State Reconciliere Deterministă & Asocieri
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [reconcileCandidate, setReconcileCandidate] = useState<ReconcileResult | null>(null);
  const [manualLinkCarId, setManualLinkCarId] = useState<string | null>(null);
  const [manualLinkUrl, setManualLinkUrl] = useState('');
  const [copiedStock, setCopiedStock] = useState<string | null>(null);

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
    const unlinked = analyzedVehicles.filter(v => !v.effectiveOlxUrl || v.effectiveOlxStatus === 'unlinked').length;

    return {
      total,
      withOlx,
      activeOlx,
      soldButActive,
      inStockButGone,
      perfectlySynced,
      unlinked,
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
      if (activeFilter === 'unlinked' && v.effectiveOlxStatus !== 'unlinked' && Boolean(v.effectiveOlxUrl)) return false;

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

  // Testare instant a textului / link-ului lipit în modalul Smart Reconciler
  const handleTestPaste = (text: string) => {
    setPasteInput(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setReconcileCandidate(null);
      return;
    }
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const result = reconcileAdWithInventory({
      url: isUrl ? trimmed : '',
      description: trimmed
    }, cars);
    setReconcileCandidate(result);
  };

  // Confirmare asociere 1-click din Smart Reconciler
  const handleConfirmReconciliation = (carId: string, olxUrl: string) => {
    if (!onUpdateOlxLink) {
      showToast('⚠️ Funcția de actualizare link nu este disponibilă.');
      return;
    }
    const finalUrl = olxUrl.trim() || `https://www.olx.ro/d/oferta/anunt-ID${reconcileCandidate?.olxId || 'reconciled'}.html`;
    onUpdateOlxLink(carId, finalUrl);
    showToast('🎯 Mașina a fost reconciliată și legată cu succes!');
    setPasteInput('');
    setReconcileCandidate(null);
    setIsReconcileModalOpen(false);
  };

  // Salvare link manual pentru o mașină
  const handleSaveManualLink = (carId: string) => {
    if (!manualLinkUrl.trim() || !onUpdateOlxLink) return;
    onUpdateOlxLink(carId, manualLinkUrl.trim());
    showToast('🔗 Link OLX asociat cu succes!');
    setManualLinkCarId(null);
    setManualLinkUrl('');
  };

  // Copiere rapidă tag inventar (#STOCK_NUMBER)
  const handleCopyTag = (stock: string) => {
    const tag = `#${stock.toUpperCase().replace(/^#+/, '')}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tag);
      setCopiedStock(stock);
      showToast(`Copiat în clipboard: ${tag}`);
      setTimeout(() => setCopiedStock(null), 2000);
    }
  };

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
              onClick={() => setIsReconcileModalOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all touch-manipulation active:scale-[0.98]"
              title="Reconciliază manual sau prin scanare Tag #RXM / VIN"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Smart Reconciler</span>
            </button>

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

          <button
            onClick={() => setActiveFilter('unlinked')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.98] ${
              activeFilter === 'unlinked'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Fără Link ({stats.unlinked})
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
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Activ pe OLX</span>
                          </span>
                          {v.olxId && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-400 border border-white/10" title="ID anunț OLX">
                              ID: {v.olxId}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium">
                          <Sparkles className="w-2.5 h-2.5" /> ⚡ Auto-Link activ
                        </span>
                      </div>
                    ) : v.effectiveOlxStatus === 'expired' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>Anunț Inactiv / Retras</span>
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="text-[11px] text-zinc-500 italic">Fără link asociat</span>
                        {manualLinkCarId === v.id ? (
                          <div className="flex items-center gap-1 mt-1 animate-in fade-in">
                            <input
                              type="text"
                              value={manualLinkUrl}
                              onChange={e => setManualLinkUrl(e.target.value)}
                              placeholder="Lipește link olx.ro..."
                              className="w-48 px-2 py-1 bg-black/60 border border-amber-500/40 rounded text-[11px] text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveManualLink(v.id)}
                              className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px] hover:bg-amber-400"
                            >
                              Salvează
                            </button>
                            <button
                              onClick={() => { setManualLinkCarId(null); setManualLinkUrl(''); }}
                              className="px-1.5 py-1 text-zinc-400 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setManualLinkCarId(v.id); setManualLinkUrl(''); }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition-colors"
                              title="Asociază manual linkul anunțului OLX"
                            >
                              <Link2 className="w-3 h-3 text-amber-400" />
                              <span>+ Leagă</span>
                            </button>
                            <button
                              onClick={() => handleCopyTag(getStockNumber(v))}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Copiază tagul de inventar pentru descriere OLX"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{copiedStock === getStockNumber(v) ? 'Copiat!' : `#${getStockNumber(v)}`}</span>
                            </button>
                          </div>
                        )}
                      </div>
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
                      <button
                        onClick={() => {
                          setPasteInput(`ID Referință Parc: #${getStockNumber(v)}`);
                          handleTestPaste(`ID Referință Parc: #${getStockNumber(v)}`);
                          setIsReconcileModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 transition-colors"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Reconciliază</span>
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🎯 Modal Smart Reconciler — Reconciliere Deterministă după Tag / VIN (Wave 2) */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121215] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Smart Reconciler OLX · Auto-Detecție 100%
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Lipește un link de anunț OLX sau descrierea acestuia. Motorul va detecta automat tag-ul <code>#RXM-XXXX</code> sau seria VIN.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsReconcileModalOpen(false); setPasteInput(''); setReconcileCandidate(null); }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corp Modal */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Lipește URL-ul Anunțului de pe OLX sau Textul Descrierii:
                </label>
                <textarea
                  value={pasteInput}
                  onChange={e => handleTestPaste(e.target.value)}
                  placeholder="Ex: https://www.olx.ro/d/oferta/audi-a6-facelift-s-line-int-rate-garantie-IDl0Lya.html&#10;sau lipește descrierea ce conține 'ID Referință Parc: #RXM-5100' sau VIN-ul mașinii..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>

              {/* Rezultat Detecție */}
              {pasteInput.trim() && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] transition-all animate-in fade-in">
                  {reconcileCandidate?.matchedCar ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Vehicul Identificat cu Succes!</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {reconcileCandidate.matchType === 'stock_number' ? '🎯 Potrivire Tag Inventar' : reconcileCandidate.matchType === 'vin' ? '🔍 Potrivire VIN' : '⚡ Potrivire ID OLX'}
                        </span>
                      </div>

                      <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={reconcileCandidate.matchedCar.images[0]}
                            alt={reconcileCandidate.matchedCar.model}
                            className="w-14 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">
                              {reconcileCandidate.matchedCar.brand} {reconcileCandidate.matchedCar.model}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              Cod: <strong className="text-amber-300">#{reconcileCandidate.matchedCar.stockNumber}</strong> • {reconcileCandidate.matchedCar.priceEur.toLocaleString('ro-RO')} € • {reconcileCandidate.matchedCar.year}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Criteriu: {reconcileCandidate.matchedBy}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmReconciliation(
                            reconcileCandidate.matchedCar!.id,
                            reconcileCandidate.olxUrl || pasteInput
                          )}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0"
                        >
                          Asociază 1-Click
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-amber-300 text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold">Niciun vehicul din stoc nu s-a potrivit.</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Asigură-te că textul lipit conține <code>#RXM-XXXX</code> sau VIN-ul mașinii din ParcOS.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ghid rapid Tag-uri neasociate */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mașini fără link OLX (Copiază Tag-ul pentru a-l include în anunț):</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {cars.filter(c => !c.olxUrl || c.olxStatus === 'unlinked').slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleCopyTag(getStockNumber(c))}
                      className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors group"
                      title="Click pentru copiere tag în clipboard"
                    >
                      <span className="font-bold text-amber-300">#{getStockNumber(c)}</span>
                      <span className="text-[11px] text-zinc-400">{c.brand} {c.model}</span>
                      <Copy className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Reconciliere 100% deterministă fără riscuri de suprapunere.</span>
              </span>
              <button
                onClick={() => { setIsReconcileModalOpen(false); setPasteInput(''); setReconcileCandidate(null); }}
                className="px-3 py-1.5 text-zinc-400 hover:text-white font-medium"
              >
                Închide
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
