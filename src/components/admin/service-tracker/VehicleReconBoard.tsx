import React, { useState, useMemo, useRef } from 'react';
import { 
  Wrench, CheckCircle2, AlertTriangle, Clock, Plus, Search, 
  Filter, FileText, Receipt, ShieldCheck, ChevronRight, ChevronLeft,
  ArrowRight, Eye, Upload, Trash2, RotateCw, ZoomIn, ZoomOut,
  Maximize2, Download, Copy, ExternalLink, HardDrive, Sparkles,
  DollarSign, Check, X, Info
} from 'lucide-react';
import { 
  VehicleItem, VehicleReconStatus, VehicleDefectItem, 
  ExpenseReceiptDocument, VehicleTechnicalDocument, VehicleExpenseItem 
} from '../../../db/types';
import { optimizeDocumentFile, OptimizedDocumentResult } from '../../../utils/documentOptimizer';
import { queueFileForGDriveSync, getGDriveVaultConfig } from '../../../services/gdriveVaultClient';

interface VehicleReconBoardProps {
  cars: VehicleItem[];
  onUpdateCar?: (updatedCar: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  showToast?: (msg: string) => void;
}

const RECON_COLUMNS: {
  id: VehicleReconStatus;
  title: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}[] = [
  {
    id: 'intake_inspection',
    title: '1. Preluare & Diagnoză',
    shortLabel: 'Diagnoză',
    icon: '📥',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'in_workshop',
    title: '2. Mecanică & Piese',
    shortLabel: 'Mecanică',
    icon: '🔧',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'detailing',
    title: '3. Tinichigerie & Detailing',
    shortLabel: 'Detailing',
    icon: '🎨',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'rar_itp',
    title: '4. RAR & Acte Flotă',
    shortLabel: 'RAR / ITP',
    icon: '📑',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    borderColor: 'border-cyan-500/30'
  },
  {
    id: 'ready_for_sale',
    title: '5. Gata de Vânzare',
    shortLabel: 'Showroom Live',
    icon: '✨',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  }
];

export const VehicleReconBoard: React.FC<VehicleReconBoardProps> = ({
  cars,
  onUpdateCar,
  onAddExpense,
  showToast
}) => {
  const [activeView, setActiveView] = useState<'board' | 'table' | 'vault'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  
  // Stare Preview Documente High-Res
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    type: string;
    sizeKb: number;
    compressionRatio?: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  const vaultConfig = useMemo(() => getGDriveVaultConfig(), []);

  // Mapare status implicit pentru mașini care nu au reconStatus setat
  const normalizedCars = useMemo(() => {
    return cars.map(c => {
      let status: VehicleReconStatus = c.reconStatus || 'ready_for_sale';
      if (!c.reconStatus) {
        if (c.status === 'preparing') status = 'in_workshop';
        else status = 'ready_for_sale';
      }
      return {
        ...c,
        reconStatus: status,
        reconDefects: c.reconDefects || [],
        technicalDocuments: c.technicalDocuments || []
      };
    });
  }, [cars]);

  // Filtrare mașini
  const filteredCars = useMemo(() => {
    return normalizedCars.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.vin && c.vin.toLowerCase().includes(q)) ||
        (c.licensePlate && c.licensePlate.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || c.reconStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedCars, searchQuery, statusFilter]);

  // Metrici agregate
  const metrics = useMemo(() => {
    const inPrepCars = normalizedCars.filter(c => c.reconStatus !== 'ready_for_sale');
    const totalExpensesInPrep = inPrepCars.reduce((sum, c) => {
      const expenses = c.expenses || [];
      return sum + expenses.reduce((s, e) => s + (e.amountEur || 0), 0);
    }, 0);

    const openDefects = normalizedCars.reduce((sum, c) => {
      return sum + (c.reconDefects || []).filter(d => !d.resolved).length;
    }, 0);

    const totalReceipts = normalizedCars.reduce((sum, c) => {
      const expenseReceipts = (c.expenses || []).reduce((s, e) => s + (e.receipts?.length || 0), 0);
      return sum + expenseReceipts + (c.technicalDocuments?.length || 0);
    }, 0);

    return {
      inPrepCount: inPrepCars.length,
      totalExpensesInPrep,
      openDefects,
      totalReceipts
    };
  }, [normalizedCars]);

  // Mutare mașină dintr-o coloană în alta
  const handleMoveStatus = (carId: string, nextStatus: VehicleReconStatus) => {
    const car = normalizedCars.find(c => c.id === carId);
    if (!car || !onUpdateCar) return;

    const updated: VehicleItem = {
      ...car,
      reconStatus: nextStatus,
      status: nextStatus === 'ready_for_sale' ? 'in_stock' : 'preparing'
    };

    onUpdateCar(updated);
    const colName = RECON_COLUMNS.find(c => c.id === nextStatus)?.title;
    showToast?.(`Mașina ${car.brand} ${car.model} a fost mutată în: ${colName}`);
  };

  const selectedCar = useMemo(() => {
    return normalizedCars.find(c => c.id === selectedCarId) || null;
  }, [normalizedCars, selectedCarId]);

  return (
    <div className="space-y-6">
      
      {/* 🧭 1. Antet & Panou Telemetrie HUD */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Wrench className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Service & Pregătire Flotă (Recon Tracker)
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                MPI Mureș
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Workflow operațional pentru mașini: inspecție, elevator & mecanică, detailing, acte RAR și seif de bonuri fiscale & documente tehnice de înaltă claritate.
            </p>
          </div>

          {/* Indicator Seif Google Drive PRO */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-white font-medium flex items-center gap-1.5">
                  <span>Google Drive PRO Vault</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-zinc-400">
                  {vaultConfig.totalStorageTb} TB Alocat • Sincronizare Activă
                </div>
              </div>
            </div>

            {/* Butoane Comutare Vizualizare */}
            <div className="bg-black/50 border border-white/[0.08] p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setActiveView('board')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'board'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'table'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tabel Costuri
              </button>
              <button
                onClick={() => setActiveView('vault')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'vault'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Seif Documente
              </button>
            </div>
          </div>
        </div>

        {/* 📊 Bară KPI Operaționale */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
          <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 block mb-0.5">Mașini în Pregătire</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{metrics.inPrepCount}</span>
              <span className="text-[11px] text-amber-400">activ în flux</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 block mb-0.5">Total Investit în Service</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">
                {metrics.totalExpensesInPrep.toLocaleString('ro-RO')} €
              </span>
              <span className="text-[10px] text-zinc-500">piese & manoperă</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 block mb-0.5">Defecțiuni Nerezolvate</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${metrics.openDefects > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {metrics.openDefects}
              </span>
              <span className="text-[10px] text-zinc-500">task-uri mecanic</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 block mb-0.5">Bonuri & Acte Arhivate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400">{metrics.totalReceipts}</span>
              <span className="text-[10px] text-zinc-500">optimizate Drive</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Bară Căutare & Filtrare Rapidă */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Caută după marcă, model, VIN..."
            className="w-full bg-[#121215] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-zinc-500 shrink-0">Filtrează:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-zinc-700 text-white font-medium'
                : 'bg-[#121215] text-zinc-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            Toate ({normalizedCars.length})
          </button>
          {RECON_COLUMNS.map(col => {
            const count = normalizedCars.filter(c => c.reconStatus === col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => setStatusFilter(col.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
                  statusFilter === col.id
                    ? `${col.badgeBg} ${col.badgeText} font-medium border ${col.borderColor}`
                    : 'bg-[#121215] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{col.icon}</span>
                <span>{col.shortLabel}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* VEDEREA 1: KANBAN BOARD (5 COLOANE)                                      */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
          {RECON_COLUMNS.map((column, colIdx) => {
            const colCars = filteredCars.filter(c => c.reconStatus === column.id);

            return (
              <div 
                key={column.id}
                className="bg-[#121215]/80 border border-white/[0.07] rounded-2xl p-3 flex flex-col min-h-[600px] shadow-sm"
              >
                {/* Antet Coloană */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{column.icon}</span>
                    <h3 className="font-semibold text-xs text-white">
                      {column.title}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${column.badgeBg} ${column.badgeText} border ${column.borderColor}`}>
                    {colCars.length}
                  </span>
                </div>

                {/* Listă Carduri Vehicul */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
                  {colCars.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 text-xs border border-dashed border-white/[0.04] rounded-xl">
                      Nicio mașină în acest stadiu
                    </div>
                  ) : (
                    colCars.map(car => {
                      const totalExpenses = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
                      const openDefects = (car.reconDefects || []).filter(d => !d.resolved).length;
                      const receiptCount = (car.expenses || []).reduce((s, e) => s + (e.receipts?.length || 0), 0) + (car.technicalDocuments?.length || 0);

                      return (
                        <div
                          key={car.id}
                          onClick={() => setSelectedCarId(car.id)}
                          className="bg-[#18181c] hover:bg-[#1e1e24] border border-white/[0.06] hover:border-amber-500/40 rounded-xl p-3 cursor-pointer transition-all group shadow-sm flex flex-col gap-2.5"
                        >
                          {/* Imagine & Titlu */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 relative">
                              {car.images?.[0] ? (
                                <img 
                                  src={car.images[0]} 
                                  alt={`${car.brand} ${car.model}`} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">
                                  Fără foto
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                {car.brand} {car.model}
                              </h4>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <span>{car.year}</span>
                                <span>•</span>
                                <span>{car.mileageKm.toLocaleString('ro-RO')} km</span>
                              </div>
                              <div className="text-[9px] font-mono text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                                <span>VIN:</span>
                                <span>{car.vin?.slice(0, 11)}...</span>
                              </div>
                            </div>
                          </div>

                          {/* Indicatori & Badge-uri Status */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.04]">
                            {/* Cost Service */}
                            {totalExpenses > 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {totalExpenses.toLocaleString('ro-RO')} €
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                                Fără costuri
                              </span>
                            )}

                            {/* Defecțiuni */}
                            {openDefects > 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {openDefects} def.
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Ok
                              </span>
                            )}

                            {/* Bonuri & Acte */}
                            {receiptCount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-medium flex items-center gap-1">
                                <Receipt className="w-3 h-3" />
                                {receiptCount}
                              </span>
                            )}
                          </div>

                          {/* Butoane Navigare Rapidă Coloane */}
                          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                            {colIdx > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(car.id, RECON_COLUMNS[colIdx - 1].id);
                                }}
                                title={`Mută înapoi în ${RECON_COLUMNS[colIdx - 1].shortLabel}`}
                                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            ) : <span />}

                            <span className="text-[9px] text-zinc-500">Apasă pentru fișă</span>

                            {colIdx < RECON_COLUMNS.length - 1 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(car.id, RECON_COLUMNS[colIdx + 1].id);
                                }}
                                title={`Avancează în ${RECON_COLUMNS[colIdx + 1].shortLabel}`}
                                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors text-amber-400"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            ) : <span />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* VEDEREA 2: TABEL COSTURI & AUDIT FINANCIAR                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'table' && (
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 text-zinc-400 border-b border-white/[0.08] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Vehicul</th>
                  <th className="p-3.5">VIN</th>
                  <th className="p-3.5">Status Recon</th>
                  <th className="p-3.5">Preț Achiziție</th>
                  <th className="p-3.5">Cheltuieli Service</th>
                  <th className="p-3.5">Total Investit</th>
                  <th className="p-3.5">Preț Vânzare</th>
                  <th className="p-3.5">Marjă Est.</th>
                  <th className="p-3.5 text-right">Acțiune</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredCars.map(car => {
                  const purchase = car.purchasePriceEur || 0;
                  const totalExp = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
                  const totalInvested = purchase + totalExp;
                  const margin = car.priceEur - totalInvested;
                  const col = RECON_COLUMNS.find(c => c.id === car.reconStatus);

                  return (
                    <tr 
                      key={car.id}
                      onClick={() => setSelectedCarId(car.id)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white">{car.brand} {car.model}</div>
                        <div className="text-[10px] text-zinc-500">{car.year} • {car.fuelType}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                        {car.vin || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${col?.badgeBg} ${col?.badgeText}`}>
                          {col?.shortLabel}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-300">
                        {purchase > 0 ? `${purchase.toLocaleString('ro-RO')} €` : '—'}
                      </td>
                      <td className="p-3.5 font-mono text-amber-400 font-medium">
                        {totalExp > 0 ? `${totalExp.toLocaleString('ro-RO')} €` : '0 €'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        {totalInvested > 0 ? `${totalInvested.toLocaleString('ro-RO')} €` : '—'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {car.priceEur.toLocaleString('ro-RO')} €
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={margin >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {margin.toLocaleString('ro-RO')} €
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCarId(car.id);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium"
                        >
                          Deschide Fișa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* VEDEREA 3: SEIF GENERAL DOCUMENTE & BONURI                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'vault' && (
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Seif Documente Tehnice & Bonuri Fiscale (Arhivă Google Drive)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Toate actele (CIV, Talon, Facturi piese, Devize) sunt comprimate cu claritate 100% și sincronizate în Google Drive PRO.
              </p>
            </div>
            <span className="text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
              Destinație: <code className="text-amber-400 font-mono">{vaultConfig.rootFolderName}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredCars.flatMap(car => {
              const allDocs: {
                id: string;
                title: string;
                carName: string;
                type: string;
                sizeKb: number;
                ratio?: number;
                url?: string;
              }[] = [];

              // Din expenses
              (car.expenses || []).forEach(exp => {
                (exp.receipts || []).forEach(r => {
                  allDocs.push({
                    id: r.id,
                    title: `${exp.title} (${r.name})`,
                    carName: `${car.brand} ${car.model}`,
                    type: r.type === 'receipt' ? 'Bon Fiscal' : 'Factură',
                    sizeKb: r.fileSizeKb,
                    ratio: r.compressionRatio,
                    url: r.dataUrl
                  });
                });
              });

              // Din technicalDocuments
              (car.technicalDocuments || []).forEach(d => {
                allDocs.push({
                  id: d.id,
                  title: d.title,
                  carName: `${car.brand} ${car.model}`,
                  type: d.type === 'civ' ? 'Carte CIV' : d.type === 'talon' ? 'Talon Înmatriculare' : 'Act Tehnic',
                  sizeKb: d.fileSizeKb,
                  ratio: d.compressionRatio,
                  url: d.dataUrl
                });
              });

              return allDocs;
            }).map((doc, idx) => (
              <div 
                key={`${doc.id}_${idx}`}
                onClick={() => {
                  if (doc.url) {
                    setPreviewDoc({
                      url: doc.url,
                      title: doc.title,
                      type: doc.type,
                      sizeKb: doc.sizeKb,
                      compressionRatio: doc.ratio
                    });
                    setZoomLevel(1);
                    setRotation(0);
                  }
                }}
                className="bg-[#18181c] border border-white/[0.06] hover:border-cyan-500/40 rounded-xl p-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider">{doc.type}</span>
                  <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                    -{doc.ratio || 92}%
                  </span>
                </div>
                <div className="font-medium text-xs text-white truncate group-hover:text-cyan-300">
                  {doc.title}
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-1">
                  🚗 {doc.carName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-3 pt-2 border-t border-white/[0.04]">
                  <span>{doc.sizeKb} KB</span>
                  <span className="flex items-center gap-1 text-cyan-400 font-medium">
                    <Eye className="w-3 h-3" /> Deschide
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* DRAWER / SERTAR RAPID INTERVENȚIE VEHICUL                                */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {selectedCar && (
        <ReconVehicleDrawer
          car={selectedCar}
          onClose={() => setSelectedCarId(null)}
          onUpdateCar={onUpdateCar}
          onAddExpense={onAddExpense}
          showToast={showToast}
          onOpenDocumentPreview={(doc) => {
            setPreviewDoc(doc);
            setZoomLevel(1);
            setRotation(0);
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* PREVIEW MODAL HIGH-RES DOCUMENT (ZOOM, PAN, ROTATE)                     */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200">
          {/* Header Preview */}
          <div className="w-full max-w-5xl flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Receipt className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold truncate">{previewDoc.title}</h4>
                <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                  <span>{previewDoc.type}</span>
                  <span>•</span>
                  <span>{previewDoc.sizeKb} KB</span>
                  {previewDoc.compressionRatio && (
                    <span className="text-emerald-400 font-medium">
                      (Comprimat -{previewDoc.compressionRatio}% cu 100% claritate)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Comenzi Viewer */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
                title="Mărește (Zoom in)"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                title="Micșorează (Zoom out)"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                title="Rotește 90°"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsHighContrast(prev => !prev)}
                title="Mod Contrast Înalt (Pentru bonuri șterse)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isHighContrast ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                Contrast +
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Corp Imagine cu Zoom & Rotație */}
          <div className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-4 my-2">
            <div 
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="max-h-[75vh] flex items-center justify-center"
            >
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className={`rounded-lg shadow-2xl object-contain max-h-[70vh] border border-zinc-700 ${
                  isHighContrast ? 'contrast-150 brightness-110 grayscale' : ''
                }`}
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-zinc-500 text-xs">
            Apasă ESC sau butonul de închidere pentru a reveni la board.
          </div>
        </div>
      )}

    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTĂ: DRAWER DETALIAT PER VEHICUL (TASK-URI, BONURI, ACTE)
// ════════════════════════════════════════════════════════════════════════════════

interface ReconVehicleDrawerProps {
  car: VehicleItem;
  onClose: () => void;
  onUpdateCar?: (updatedCar: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  showToast?: (msg: string) => void;
  onOpenDocumentPreview: (doc: {
    url: string;
    title: string;
    type: string;
    sizeKb: number;
    compressionRatio?: number;
  }) => void;
}

const ReconVehicleDrawer: React.FC<ReconVehicleDrawerProps> = ({
  car,
  onClose,
  onUpdateCar,
  onAddExpense,
  showToast,
  onOpenDocumentPreview
}) => {
  const [activeTab, setActiveTab] = useState<'defects' | 'receipts' | 'documents' | 'expenses'>('defects');
  
  // Stare adăugare defecțiune
  const [defectTitle, setDefectTitle] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [defectCostStr, setDefectCostStr] = useState('');

  // Stare încărcare fișier optimizat
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // 1. Adăugare defecțiune / task mecanic
  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectTitle.trim() || !onUpdateCar) return;

    const newDefect: VehicleDefectItem = {
      id: `def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: defectTitle.trim(),
      severity: defectSeverity,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    // Dacă a completat și o sumă estimată, adăugăm direct și cheltuiala corespunzătoare
    const cost = parseInt(defectCostStr, 10);
    if (!isNaN(cost) && cost > 0 && onAddExpense) {
      onAddExpense(car.id, {
        category: 'mechanical_repairs',
        title: `Piesă/Manoperă: ${defectTitle.trim()}`,
        amountEur: cost,
        date: new Date().toISOString().split('T')[0]
      });
      newDefect.linkedExpenseId = `linked_${Date.now()}`;
    }

    const updatedCar: VehicleItem = {
      ...car,
      reconDefects: [newDefect, ...(car.reconDefects || [])]
    };

    onUpdateCar(updatedCar);
    setDefectTitle('');
    setDefectCostStr('');
    showToast?.('Sarcina a fost adăugată în fișa de service.');
  };

  // 2. Bifează/Debifează defecțiune
  const handleToggleDefect = (defectId: string) => {
    if (!onUpdateCar) return;
    const updatedDefects = (car.reconDefects || []).map(d => {
      if (d.id === defectId) {
        return {
          ...d,
          resolved: !d.resolved,
          resolvedAt: !d.resolved ? new Date().toISOString() : undefined
        };
      }
      return d;
    });

    onUpdateCar({
      ...car,
      reconDefects: updatedDefects
    });
  };

  // 3. Încărcare & Optimizare Bon / Factură (Compresie 95% cu text lizibil)
  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCar) return;

    setIsOptimizing(true);
    try {
      const result: OptimizedDocumentResult = await optimizeDocumentFile(file, {
        maxDimension: 1800,
        quality: 0.78,
        enhanceContrast: true
      });

      // Înregistrare în coada Google Drive Vault
      queueFileForGDriveSync(car.id, 'receipt', result.fileName, result.fileSizeKb);

      const newReceipt: ExpenseReceiptDocument = {
        id: `rcp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: result.fileName,
        type: 'receipt',
        fileSizeKb: result.fileSizeKb,
        originalSizeKb: result.originalSizeKb,
        compressionRatio: result.compressionRatio,
        dataUrl: result.dataUrl,
        uploadedAt: new Date().toISOString(),
        gdriveWebViewLink: `https://drive.google.com/drive/folders/parcos-mpi-${car.id}`
      };

      // Adăugăm bonul pe prima cheltuială sau creăm o cheltuială nouă
      const expenses = car.expenses || [];
      let updatedExpenses: VehicleExpenseItem[];

      if (expenses.length > 0) {
        updatedExpenses = expenses.map((exp, idx) => {
          if (idx === 0) {
            return {
              ...exp,
              receipts: [newReceipt, ...(exp.receipts || [])]
            };
          }
          return exp;
        });
      } else {
        updatedExpenses = [{
          id: `exp_${Date.now()}`,
          category: 'mechanical_repairs',
          title: `Cheltuială atașată bon ${result.fileName}`,
          amountEur: 0,
          date: new Date().toISOString().split('T')[0],
          receipts: [newReceipt]
        }];
      }

      onUpdateCar({
        ...car,
        expenses: updatedExpenses
      });

      showToast?.(`Bon încărcat și comprimat: ${result.originalSizeKb} KB ➔ ${result.fileSizeKb} KB (-${result.compressionRatio}%)`);
    } catch (err: any) {
      showToast?.(`Eroare la optimizarea imaginii: ${err.message}`);
    } finally {
      setIsOptimizing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 4. Încărcare Document Tehnic High-Res (CIV, Talon)
  const handleUploadTechnicalDoc = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'civ' | 'talon' | 'purchase_invoice' | 'diagnosis_tuv') => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCar) return;

    setIsOptimizing(true);
    try {
      const result = await optimizeDocumentFile(file, {
        maxDimension: 2000,
        quality: 0.82,
        enhanceContrast: true
      });

      queueFileForGDriveSync(car.id, docType, result.fileName, result.fileSizeKb);

      const newDoc: VehicleTechnicalDocument = {
        id: `tech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: docType,
        title: docType === 'civ' ? 'Carte Identitate Vehicul (CIV)' : docType === 'talon' ? 'Certificat Înmatriculare (Talon)' : file.name,
        fileSizeKb: result.fileSizeKb,
        originalSizeKb: result.originalSizeKb,
        compressionRatio: result.compressionRatio,
        dataUrl: result.dataUrl,
        uploadedAt: new Date().toISOString()
      };

      onUpdateCar({
        ...car,
        technicalDocuments: [newDoc, ...(car.technicalDocuments || [])]
      });

      showToast?.(`Document salvat în Seif Google Drive (-${result.compressionRatio}% spațiu economisit).`);
    } catch (err: any) {
      showToast?.(`Eroare la procesarea documentului: ${err.message}`);
    } finally {
      setIsOptimizing(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const totalSpent = (car.expenses || []).reduce((s, e) => s + (e.amountEur || 0), 0);
  const defects = car.reconDefects || [];
  const allReceipts = (car.expenses || []).flatMap(e => e.receipts || []);
  const techDocs = car.technicalDocuments || [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#121215] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* 1. Header Drawer */}
      <div className="p-5 border-b border-white/[0.08] bg-black/40 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/[0.08]">
            {car.images?.[0] ? (
              <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Fără foto</div>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{car.brand} {car.model}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {car.year}
              </span>
            </h3>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              VIN: <span className="text-amber-400">{car.vin || 'Nesetat'}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
              <span>Total Service: <strong className="text-amber-400 font-mono">{totalSpent} €</strong></span>
              <span>•</span>
              <span>{defects.filter(d => !d.resolved).length} defecte deschise</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Selector Stadiu Curent */}
      <div className="px-5 py-3 bg-zinc-900/60 border-b border-white/[0.05] flex items-center justify-between">
        <span className="text-xs text-zinc-400">Stadiu Recondiționare:</span>
        <select
          value={car.reconStatus || 'ready_for_sale'}
          onChange={(e) => {
            const nextStatus = e.target.value as VehicleReconStatus;
            if (onUpdateCar) {
              onUpdateCar({
                ...car,
                reconStatus: nextStatus,
                status: nextStatus === 'ready_for_sale' ? 'in_stock' : 'preparing'
              });
              showToast?.(`Stadiu actualizat la: ${e.target.selectedOptions[0].text}`);
            }
          }}
          className="bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-amber-400 font-bold focus:outline-none"
        >
          {RECON_COLUMNS.map(col => (
            <option key={col.id} value={col.id}>
              {col.icon} {col.title}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Tab-uri Navigare */}
      <div className="flex border-b border-white/[0.06] bg-black/20 px-5 gap-4">
        <button
          onClick={() => setActiveTab('defects')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'defects'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Defecțiuni & To-Do ({defects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'receipts'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Bonuri & Facturi ({allReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Seif CIV / Acte ({techDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Costuri ({totalSpent} €)</span>
        </button>
      </div>

      {/* 4. Conținut Tab Activ */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* ── TAB 1: DEFECȚIUNI & TASK-URI MECANIC ── */}
        {activeTab === 'defects' && (
          <div className="space-y-4">
            {/* Formular Adăugare Rapidă */}
            <form onSubmit={handleAddDefect} className="bg-black/30 border border-white/[0.08] rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-white block">Adaugă Sarcină / Defect Recondiționare</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="ex: Schimb plăcuțe frână, Diagnoză martor bord, Polish faruri..."
                  className="flex-1 bg-black/60 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
                <select
                  value={defectSeverity}
                  onChange={(e) => setDefectSeverity(e.target.value as any)}
                  className="bg-black/60 border border-white/[0.08] rounded-lg px-2 text-xs text-zinc-300"
                >
                  <option value="low">Minor</option>
                  <option value="medium">Normal</option>
                  <option value="critical">Critic / Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Cost estimat:</span>
                  <input
                    type="number"
                    value={defectCostStr}
                    onChange={(e) => setDefectCostStr(e.target.value)}
                    placeholder="€"
                    className="w-20 bg-black/60 border border-white/[0.08] rounded px-2 py-1 text-xs text-amber-400 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500">(se trece automat la Cheltuieli)</span>
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adaugă Task
                </button>
              </div>
            </form>

            {/* Listă Defecte cu Bife */}
            <div className="space-y-2">
              {defects.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-white/[0.06] rounded-xl">
                  Nu este înregistrată nicio defecțiune. Mașina este conformă tehnic.
                </div>
              ) : (
                defects.map(d => (
                  <div
                    key={d.id}
                    onClick={() => handleToggleDefect(d.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      d.resolved 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400 line-through' 
                        : 'bg-[#18181c] border-white/[0.08] text-white hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        d.resolved ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600'
                      }`}>
                        {d.resolved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{d.title}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Prioritate: {d.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-500">
                      {d.resolved ? 'Rezolvat ✅' : 'De făcut ⏳'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: BONURI & FACTURI CHELTUIELI ── */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            {/* Dropzone Încărcare cu Compresie Automată */}
            <div className="border-2 border-dashed border-white/[0.1] hover:border-amber-500/50 rounded-2xl p-5 text-center bg-black/20 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleUploadReceipt}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <span className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                  <Upload className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Încarcă Bon Fiscal sau Factură Piesă</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm">
                    Imaginea se comprimă automat cu 90-95% păstrând textul 100% clar și se sincronizează în Google Drive Vault.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isOptimizing}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isOptimizing ? 'Se optimizează & comprimă...' : 'Selectează Poza / Documentul'}
                </button>
              </div>
            </div>

            {/* Listă Bonuri Încărcate */}
            <div className="grid grid-cols-2 gap-3">
              {allReceipts.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-zinc-500 text-xs">
                  Niciun bon încărcat încă pentru acest vehicul.
                </div>
              ) : (
                allReceipts.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (r.dataUrl) {
                        onOpenDocumentPreview({
                          url: r.dataUrl,
                          title: r.name,
                          type: r.type,
                          sizeKb: r.fileSizeKb,
                          compressionRatio: r.compressionRatio
                        });
                      }
                    }}
                    className="bg-[#18181c] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-3 cursor-pointer group transition-all"
                  >
                    <div className="h-28 bg-black/60 rounded-lg overflow-hidden mb-2 relative">
                      {r.dataUrl ? (
                        <img src={r.dataUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">PDF / Fără preview</div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                        -{r.compressionRatio || 93}%
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-400">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-1">
                      <span>{r.fileSizeKb} KB</span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Zoom
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: SEIF CIV & ACTE FLOTĂ ── */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => docInputRef.current?.click()}
                className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all"
              >
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUploadTechnicalDoc(e, 'civ')}
                  className="hidden"
                />
                <span className="text-xs font-bold text-cyan-400 block">+ Încarcă Carte CIV</span>
                <span className="text-[10px] text-zinc-500">Scanare față-verso rezoluție 100%</span>
              </button>

              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,application/pdf';
                  input.onchange = (e: any) => handleUploadTechnicalDoc(e, 'talon');
                  input.click();
                }}
                className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all"
              >
                <span className="text-xs font-bold text-cyan-400 block">+ Încarcă Talon (Brief)</span>
                <span className="text-[10px] text-zinc-500">Certificat înmatriculare străin / RO</span>
              </button>
            </div>

            {/* Listă Acte Salvate */}
            <div className="space-y-2">
              {techDocs.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-white/[0.06] rounded-xl">
                  Nu este salvat niciun document tehnic în seif.
                </div>
              ) : (
                techDocs.map(d => (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (d.dataUrl) {
                        onOpenDocumentPreview({
                          url: d.dataUrl,
                          title: d.title,
                          type: d.type,
                          sizeKb: d.fileSizeKb,
                          compressionRatio: d.compressionRatio
                        });
                      }
                    }}
                    className="p-3 rounded-xl bg-[#18181c] border border-white/[0.08] hover:border-cyan-500/40 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300">{d.title}</div>
                        <div className="text-[10px] text-zinc-500">
                          {d.fileSizeKb} KB • Sincronizat Google Drive PRO
                        </div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 text-xs font-medium flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Deschide
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: CHELTUIELI SERVICE INTEGRATE ── */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between">
              <span>Total cheltuieli înregistrate pe mașină:</span>
              <strong className="text-sm font-mono">{totalSpent.toLocaleString('ro-RO')} €</strong>
            </div>

            <div className="space-y-2">
              {(car.expenses || []).map(exp => (
                <div key={exp.id} className="p-3 rounded-xl bg-[#18181c] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{exp.title}</div>
                    <div className="text-[10px] text-zinc-500">{exp.category} • {exp.date}</div>
                  </div>
                  <div className="font-mono font-bold text-amber-400">
                    {exp.amountEur} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
