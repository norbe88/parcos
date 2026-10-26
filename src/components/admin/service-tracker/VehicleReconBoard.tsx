import React, { useState, useMemo } from 'react';
import { 
  Wrench, HardDrive, Settings, Search, ExternalLink, FolderOpen, X 
} from 'lucide-react';
import { 
  VehicleItem, VehicleReconStatus, VehicleExpenseItem 
} from '../../../db/types';
import { 
  getGDriveVaultConfig, saveGDriveVaultConfig, GDriveVaultConfig 
} from '../../../services/gdriveVaultClient';
import { RECON_COLUMNS, createReconStatusAuditEntry } from './reconHelpers';
import { ReconKanbanBoard } from './ReconKanbanBoard';
import { ReconTableView } from './ReconTableView';
import { ReconDocumentVault } from './ReconDocumentVault';
import { ReconVehicleDrawer } from './ReconVehicleDrawer';
import { ReconDocumentViewerModal, PreviewDocumentData } from './ReconDocumentViewerModal';
import { ReconVaultConfigModal } from './ReconVaultConfigModal';

export interface VehicleReconBoardProps {
  cars: VehicleItem[];
  onUpdateCar?: (updatedCar: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  showToast?: (msg: string) => void;
}

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
  const [previewDoc, setPreviewDoc] = useState<PreviewDocumentData | null>(null);

  // Stare Configurare Seif Google Drive
  const [vaultConfig, setVaultConfig] = useState<GDriveVaultConfig>(() => getGDriveVaultConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configEmail, setConfigEmail] = useState<string>(vaultConfig.accountEmail);
  const [configFolderUrl, setConfigFolderUrl] = useState<string>(vaultConfig.sharedFolderUrl || '');
  const [configRootFolder, setConfigRootFolder] = useState<string>(vaultConfig.rootFolderName);

  const handleSaveVaultConfig = () => {
    const updated = {
      accountEmail: configEmail.trim(),
      sharedFolderUrl: configFolderUrl.trim(),
      rootFolderName: configRootFolder.trim(),
      isEnabled: true,
      totalStorageTb: vaultConfig.totalStorageTb
    };
    saveGDriveVaultConfig(updated);
    setVaultConfig(getGDriveVaultConfig());
    setIsConfigModalOpen(false);
    showToast?.('✓ Configurația Seifului Google Drive Dedicat a fost salvată!');
  };

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

  // Filtrare mașini după căutare și status
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

  // Metrici agregate pentru HUD
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

  // Mutare vehicul cu inserare automată în Audit Log
  const handleMoveStatus = (carId: string, nextStatus: VehicleReconStatus) => {
    const car = normalizedCars.find(c => c.id === carId);
    if (!car || !onUpdateCar || car.reconStatus === nextStatus) return;

    const auditEntry = createReconStatusAuditEntry(car.reconStatus, nextStatus);
    const updated: VehicleItem = {
      ...car,
      reconStatus: nextStatus,
      reconStatusChangedAt: new Date().toISOString(),
      status: nextStatus === 'ready_for_sale' ? 'in_stock' : 'preparing',
      auditLog: [...(car.auditLog || []), auditEntry]
    };

    onUpdateCar(updated);
    const colName = RECON_COLUMNS.find(c => c.id === nextStatus)?.title || nextStatus;
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
                MPI AUTO CLA S.R.L.
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Workflow operațional pentru mașini: inspecție, elevator & mecanică, detailing, acte RAR și seif de bonuri fiscale & documente tehnice de înaltă claritate.
            </p>
          </div>

          {/* Indicator Seif Google Drive PRO & Butoane */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-white font-medium flex items-center gap-1.5">
                  <span>Google Drive Vault</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                  {vaultConfig.accountEmail}
                </div>
              </div>
            </div>

            {vaultConfig.sharedFolderUrl && (
              <a
                href={vaultConfig.sharedFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Deschide folderul dedicat în Google Drive"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deschide Drive</span>
                <ExternalLink className="w-3 h-3 text-emerald-400/80" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs transition-all flex items-center gap-1.5"
              title="Configurare Seif Google Drive Dedicat"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Setări Seif</span>
            </button>

            {/* Butoane Comutare Vizualizare */}
            <div className="bg-black/50 border border-white/[0.08] p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
            type="button"
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
                type="button"
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
      {/* VEDEREA 1: KANBAN BOARD                                                  */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'board' && (
        <ReconKanbanBoard
          cars={filteredCars}
          onSelectCar={(carId) => setSelectedCarId(carId)}
          onMoveStatus={handleMoveStatus}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* VEDEREA 2: TABEL COSTURI & MARJE                                         */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'table' && (
        <ReconTableView
          cars={filteredCars}
          onSelectCar={(carId) => setSelectedCarId(carId)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* VEDEREA 3: SEIF GENERAL DOCUMENTE & BONURI                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeView === 'vault' && (
        <ReconDocumentVault
          cars={filteredCars}
          vaultConfig={vaultConfig}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onOpenPreview={(doc) => setPreviewDoc(doc)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* DRAWER DETALIAT PER VEHICUL (TASK-URI, BONURI, ACTE)                    */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {selectedCar && (
        <ReconVehicleDrawer
          car={selectedCar}
          onClose={() => setSelectedCarId(null)}
          onUpdateCar={onUpdateCar}
          onAddExpense={onAddExpense}
          showToast={showToast}
          onOpenDocumentPreview={(doc) => setPreviewDoc(doc)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* PREVIEW MODAL HIGH-RES DOCUMENT (ZOOM, PAN, ROTATE)                     */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <ReconDocumentViewerModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL CONFIGURARE SEIF GOOGLE DRIVE                                      */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <ReconVaultConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        configEmail={configEmail}
        setConfigEmail={setConfigEmail}
        configFolderUrl={configFolderUrl}
        setConfigFolderUrl={setConfigFolderUrl}
        configRootFolder={configRootFolder}
        setConfigRootFolder={setConfigRootFolder}
        onSave={handleSaveVaultConfig}
      />

    </div>
  );
};
