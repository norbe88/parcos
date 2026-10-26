import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Plus, Search, Filter, Calendar, DollarSign, FileText, 
  CheckCircle2, Clock, AlertCircle, Building2, Phone, MessageCircle, 
  Download, RefreshCw, Layers, TrendingUp, User, Car, Check, 
  XCircle, ChevronRight, ArrowRight, Shield, ExternalLink, Settings, 
  Trash2, Edit, AlertTriangle
} from 'lucide-react';
import { 
  FinancingDossierItem, 
  FinancingDossierStatus, 
  CreditorPartnerId, 
  VehicleItem, 
  DealerProfile 
} from '../../db/types';
import { 
  readLocalFinancingBackup,
  forgetLocalFinancingDossiers,
  fetchSharedDossiers,
  createSharedDossier,
  patchSharedDossier,
  importSharedDossiers,
  draftManualDossier,
  downloadFinancingCsv,
} from '../../services/financingService';
import { 
  convertEurToRon, 
  convertRonToEur,
  formatRonDirect, 
  getBtExchangeRate 
} from '../../utils/currencyEngine';
import { FinancingDossierModal } from '../modals/FinancingDossierModal';
import { FinancingSettingsManager } from './FinancingSettingsManager';

interface FinancingPortfolioManagerProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
  showToast: (msg: string) => void;
  onStatusChange?: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  onOpenSalesDocs?: (car: VehicleItem, initialBuyer?: any) => void;
}

type MainTab = 'pipeline' | 'commissions' | 'settings';
type ViewMode = 'kanban' | 'table';

interface KanbanColumnConfig {
  id: string;
  title: string;
  statuses: FinancingDossierStatus[];
  badgeColor: string;
  borderColor: string;
  icon: React.ElementType;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'docs',
    title: '1. Acte & Acord ANAF',
    statuses: ['draft', 'docs_pending'],
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderColor: 'border-amber-500/30',
    icon: Clock,
  },
  {
    id: 'review',
    title: '2. În Analiză Bancară',
    statuses: ['submitted', 'under_review'],
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/30',
    icon: Building2,
  },
  {
    id: 'approved',
    title: '3. Aprobat / De Semnat',
    statuses: ['conditional', 'approved', 'contract_signed'],
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    borderColor: 'border-sky-500/30',
    icon: CheckCircle2,
  },
  {
    id: 'funded',
    title: '4. Decontat & Livrat',
    statuses: ['funded', 'delivered'],
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-emerald-500/30',
    icon: DollarSign,
  },
  {
    id: 'rejected',
    title: '5. Respins / Anulat',
    statuses: ['rejected', 'canceled'],
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    borderColor: 'border-rose-500/30',
    icon: XCircle,
  },
];

const CREDITOR_BADGES: Record<CreditorPartnerId, { label: string; color: string }> = {
  tbi: { label: 'TBI Bank', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  bt: { label: 'BT Direct', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  unicredit: { label: 'UniCredit', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  creditfix: { label: 'CreditFix', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  mogo: { label: 'Mogo IFN', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  other: { label: 'Alt Finanțator', color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
};

export const FinancingPortfolioManager: React.FC<FinancingPortfolioManagerProps> = ({
  cars,
  dealer,
  showToast,
  onStatusChange,
  onOpenSalesDocs,
}) => {
  const [dossiers, setDossiers] = useState<FinancingDossierItem[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('pipeline');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreditor, setSelectedCreditor] = useState<string>('all');
  const [selectedDossier, setSelectedDossier] = useState<FinancingDossierItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localBackupCount, setLocalBackupCount] = useState(0);
  const [importingDossiers, setImportingDossiers] = useState(false);

  const replaceDossier = (next: FinancingDossierItem) => {
    setDossiers((prev) => prev.map((item) => (item.id === next.id ? next : item)));
  };

  useEffect(() => {
    let cancelled = false;
    setLocalBackupCount(readLocalFinancingBackup().length);
    void fetchSharedDossiers().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        showToast('Portofoliul comun nu a putut fi încărcat.');
        return;
      }
      setDossiers(result.dossiers);
    });
    return () => {
      cancelled = true;
    };
  }, [dealer?.slug]);

  // Filtrare dosare
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchCreditor = selectedCreditor === 'all' || d.creditor === selectedCreditor;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        d.clientName.toLowerCase().includes(q) ||
        d.clientPhone.toLowerCase().includes(q) ||
        d.carTitle.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q);
      return matchCreditor && matchQuery;
    });
  }, [dossiers, selectedCreditor, searchQuery]);

  // Calcul KPI-uri Financiare
  const kpis = useMemo(() => {
    const totalFinancedRon = dossiers
      .filter((d) => ['approved', 'contract_signed', 'funded', 'delivered'].includes(d.status))
      .reduce((sum, d) => sum + (d.financedAmountRon || 0), 0);

    const activeInReview = dossiers.filter((d) =>
      ['docs_pending', 'submitted', 'under_review'].includes(d.status)
    ).length;

    const completed = dossiers.filter((d) =>
      ['approved', 'contract_signed', 'funded', 'delivered', 'rejected', 'canceled'].includes(d.status)
    );
    const approved = dossiers.filter((d) =>
      ['approved', 'contract_signed', 'funded', 'delivered'].includes(d.status)
    );
    const approvalRate = completed.length > 0 ? Math.round((approved.length / completed.length) * 100) : 0;

    const brokerCommissionRon = dossiers
      .filter((d) => ['approved', 'contract_signed', 'funded', 'delivered'].includes(d.status))
      .reduce((sum, d) => sum + (d.brokerCommissionRon || 0), 0);

    return {
      totalFinancedRon,
      totalFinancedEur: convertRonToEur(totalFinancedRon),
      activeInReview,
      approvalRate,
      brokerCommissionRon,
      totalDossiers: dossiers.length,
    };
  }, [dossiers]);

  // Schimbare status cu sincronizare stoc (Ticket 10)
  const handleQuickStatusChange = (dossier: FinancingDossierItem, newStatus: FinancingDossierStatus) => {
    void patchSharedDossier(dossier.id, { status: newStatus }).then((result) => {
      if (!result.ok || !result.dossier) {
        showToast(result.status === 404
          ? 'Acest dosar nu aparține parcului curent.'
          : 'Stadiul dosarului nu a fost salvat pe server.');
        return;
      }
      replaceDossier(result.dossier);
      showToast(`Status actualizat la: ${newStatus.toUpperCase()}`);

      if (dossier.carId && onStatusChange) {
        const targetCar = cars.find((c) => c.id === dossier.carId);
        if (targetCar) {
          if (['approved', 'contract_signed'].includes(newStatus) && targetCar.status === 'in_stock') {
            onStatusChange(targetCar.id, 'reserved');
            showToast(`🚗 Vehiculul "${targetCar.brand} ${targetCar.model}" a fost marcat automat ca REZERVAT.`);
          } else if (newStatus === 'funded' && targetCar.status !== 'sold') {
            onStatusChange(targetCar.id, 'sold', dossier.carPriceEur, new Date().toISOString());
            showToast(`🎉 Dosar decontat! Vehiculul "${targetCar.brand} ${targetCar.model}" a fost marcat ca VÂNDUT.`);
          } else if (['rejected', 'canceled'].includes(newStatus) && targetCar.status === 'reserved') {
            onStatusChange(targetCar.id, 'in_stock');
            showToast(`ℹ️ Dosar închis. Vehiculul "${targetCar.brand} ${targetCar.model}" a revenit ÎN STOC.`);
          }
        }
      }
    });
  };

  // Creare manuală dosar
  const handleCreateNew = () => {
    const fresh = draftManualDossier(cars[0] || null);
    void createSharedDossier(fresh).then((result) => {
      if (!result.ok || !result.dossier) {
        showToast('Dosarul nou nu a fost creat pe server.');
        return;
      }
      setDossiers((prev) => [result.dossier!, ...prev.filter((item) => item.id !== result.dossier!.id)]);
      setSelectedDossier(result.dossier);
      setIsModalOpen(true);
      showToast('Dosar nou F&I creat. Completați datele clientului.');
    });
  };

  const handleImportLocalDossiers = () => {
    if (importingDossiers) return;
    const localDossiers = readLocalFinancingBackup();
    if (localDossiers.length === 0) return;
    setImportingDossiers(true);
    void importSharedDossiers(localDossiers).then(async (result) => {
      setImportingDossiers(false);
      if (!result.ok) {
        showToast('Importul nu a ajuns pe server. Lista locală a rămas neschimbată.');
        return;
      }
      forgetLocalFinancingDossiers(result.acceptedIds);
      setLocalBackupCount(readLocalFinancingBackup().length);
      const refreshed = await fetchSharedDossiers();
      if (refreshed.ok) setDossiers(refreshed.dossiers);
      showToast(`Import încheiat: ${result.imported} dosare noi, ${result.skipped} sărite.`);
    });
  };

  const handleOpenDossier = (dossier: FinancingDossierItem) => {
    setSelectedDossier(dossier);
    setIsModalOpen(true);
  };

  const handleSaveModal = (updated: FinancingDossierItem) => {
    void patchSharedDossier(updated.id, updated).then((result) => {
      if (!result.ok || !result.dossier) {
        showToast(result.status === 404
          ? 'Acest dosar nu aparține parcului curent.'
          : 'Dosarul nu a fost salvat pe server.');
        return;
      }
      replaceDossier(result.dossier);
      setSelectedDossier(result.dossier);
      setIsModalOpen(false);
      showToast('Dosarul de finanțare a fost actualizat cu succes.');
    });
  };

  // Link WhatsApp direct
  const getWhatsAppLink = (dossier: FinancingDossierItem) => {
    const cleanPhone = dossier.clientPhone.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('0') ? `4${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Bună ziua, ${dossier.clientName}! Vă contactăm de la departamentul de finanțări cu privire la dosarul de credit pentru ${dossier.carTitle}. Rata estimată este de ${formatRonDirect(dossier.monthlyInstallmentRon)} pe lună.`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Titlu Modul */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] border border-white/[0.08] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Portofoliu Finanțări & Dosare Credit (F&I)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Curs BT Live: {getBtExchangeRate().toFixed(4)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Urmărire flux credit auto, acorduri ANAF, decizii bancare și reconciliere comisioane brokeraj
            </p>
          </div>
        </div>

        {/* Butoane Acțiuni Top */}
        <div className="flex items-center gap-2 flex-wrap">
          {localBackupCount > 0 && (
            <button
              type="button"
              onClick={handleImportLocalDossiers}
              disabled={importingDossiers}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-card text-foreground border border-border min-h-[44px] touch-manipulation active:scale-[0.98] disabled:opacity-60"
            >
              {importingDossiers ? 'Se importă...' : `Importă ${localBackupCount} dosare locale`}
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadFinancingCsv(dossiers)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Dosar Nou F&I
          </button>
        </div>
      </div>

      {/* 2. Carduri KPI Financiare */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Volum Credite */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 font-medium">Volum Finanțat / Aprobat</div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {formatRonDirect(kpis.totalFinancedRon)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ≈ {kpis.totalFinancedEur.toLocaleString('ro-RO')} € (Curs BT)
          </div>
        </div>

        {/* KPI 2: Dosare în Analiză */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08]">
          <div className="text-[11px] text-zinc-400 font-medium">În Analiză Bancară</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
            {kpis.activeInReview} <span className="text-xs text-zinc-500 font-normal">dosare</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Așteaptă decizie / acord ANAF</div>
        </div>

        {/* KPI 3: Rată de Aprobare */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08]">
          <div className="text-[11px] text-zinc-400 font-medium">Rată de Aprobare</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
            {kpis.approvalRate}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Din total dosare finalizate</div>
        </div>

        {/* KPI 4: Comisioane Dealer */}
        <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08]">
          <div className="text-[11px] text-zinc-400 font-medium">Comisioane Brokeraj Dealer</div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
            {formatRonDirect(kpis.brokerCommissionRon)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Kickback mediu 2.0% din credit</div>
        </div>
      </div>

      {/* 3. Bară de Navigare & Filtre */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121215] border border-white/[0.08] p-3 rounded-2xl">
        {/* Selector Taburi Principale */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Portofoliu & Kanban
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commissions'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Reconciliere Comisioane
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Setări Bănci & Curs BT
          </button>
        </div>

        {/* Căutare & Switcher Kanban/Tabel */}
        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Căutare */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Caută client, telefon, mașină..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/40"
              />
            </div>

            {/* Filtru Creditor */}
            <select
              value={selectedCreditor}
              onChange={(e) => setSelectedCreditor(e.target.value)}
              aria-label="Filtrează după creditor"
              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/40 cursor-pointer"
            >
              <option value="all">Toți Creditorii</option>
              <option value="tbi">TBI Bank</option>
              <option value="bt">BT Direct</option>
              <option value="unicredit">UniCredit</option>
              <option value="creditfix">CreditFix</option>
              <option value="mogo">Mogo IFN</option>
            </select>

            {/* Toggle Kanban / Tabel */}
            <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Vedere Kanban"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Vedere Tabel"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Conținut Tab Activ */}

      {/* 4.1 Tab PIPELINE (Kanban sau Tabel) */}
      {activeTab === 'pipeline' && (
        <>
          {viewMode === 'kanban' ? (
            /* Kanban 5 Coloane */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
              {KANBAN_COLUMNS.map((col) => {
                const colDossiers = filteredDossiers.filter((d) => col.statuses.includes(d.status));
                const ColIcon = col.icon;

                return (
                  <div
                    key={col.id}
                    className="bg-[#121215] border border-white/[0.08] rounded-2xl p-3 space-y-3 min-h-[480px] flex flex-col"
                  >
                    {/* Header Coloană */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <ColIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-bold text-white tracking-tight">{col.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeColor}`}>
                        {colDossiers.length}
                      </span>
                    </div>

                    {/* Listă Carduri Dosar */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
                      {colDossiers.length === 0 ? (
                        <div className="py-12 text-center text-zinc-600 text-xs italic">
                          Fără dosare în această etapă
                        </div>
                      ) : (
                        colDossiers.map((dossier) => {
                          const creditorBadge = CREDITOR_BADGES[dossier.creditor] || CREDITOR_BADGES.other;
                          const verifiedDocsCount = Object.values(dossier.documents || {}).filter(Boolean).length;

                          return (
                            <div
                              key={dossier.id}
                              onClick={() => handleOpenDossier(dossier)}
                              className="p-3 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-white/[0.06] hover:border-amber-500/30 transition-all cursor-pointer space-y-2.5 group shadow-sm"
                            >
                              {/* Header Card: Client & Telefon */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                    <User className="w-3 h-3 text-zinc-500 shrink-0" />
                                    <span className="truncate">{dossier.clientName}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5 text-zinc-500" />
                                    <span>{dossier.clientPhone}</span>
                                  </div>
                                </div>

                                {/* Link direct WhatsApp */}
                                <a
                                  href={getWhatsAppLink(dossier)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 transition-colors"
                                  title="Trimite mesaj WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              {/* Mașină Solicitată */}
                              <div className="text-[11px] text-zinc-300 font-medium truncate flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/[0.04]">
                                <Car className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{dossier.carTitle}</span>
                              </div>

                              {/* Finanțe & Rata Lunară */}
                              <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-white/[0.06]">
                                <div>
                                  <span className="text-zinc-500 block">Finanțat</span>
                                  <span className="font-mono font-bold text-zinc-200">
                                    {formatRonDirect(dossier.financedAmountRon)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">Rată Lunară</span>
                                  <span className="font-mono font-bold text-amber-300">
                                    {formatRonDirect(dossier.monthlyInstallmentRon)}/lună
                                  </span>
                                </div>
                              </div>

                              {/* Footer Card: Creditor + Acte KYC */}
                              <div className="flex items-center justify-between gap-1 pt-1">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${creditorBadge.color}`}>
                                  {creditorBadge.label}
                                </span>
                                <span
                                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                                    verifiedDocsCount === 4
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  }`}
                                  title="Checklist acte KYC/ANAF"
                                >
                                  {verifiedDocsCount}/4 acte
                                </span>
                              </div>

                              {/* Selector Rapid Status */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between"
                              >
                                <span className="text-[9px] text-zinc-500">Mută stadiu:</span>
                                <select
                                  value={dossier.status}
                                  onChange={(e) => handleQuickStatusChange(dossier, e.target.value as FinancingDossierStatus)}
                                  aria-label="Schimbă statusul dosarului"
                                  className="text-[10px] bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                                >
                                  <option value="draft">Ciornă</option>
                                  <option value="docs_pending">Așteptare Acte</option>
                                  <option value="submitted">Trimis</option>
                                  <option value="under_review">În Analiză</option>
                                  <option value="approved">Aprobat</option>
                                  <option value="contract_signed">Contract Semnat</option>
                                  <option value="funded">Decontat</option>
                                  <option value="rejected">Respins</option>
                                  <option value="canceled">Anulat</option>
                                </select>
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
          ) : (
            /* Vedere Tabel */
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black/40 border-b border-white/[0.08] text-[11px] font-bold text-zinc-400">
                    <tr>
                      <th className="p-3.5">Client & Contact</th>
                      <th className="p-3.5">Vehicul & Preț</th>
                      <th className="p-3.5">Creditor</th>
                      <th className="p-3.5 text-right">Sumă Finanțată</th>
                      <th className="p-3.5 text-right">Rată Lunară</th>
                      <th className="p-3.5 text-center">Acte KYC</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredDossiers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-500 italic">
                          Nu a fost găsit niciun dosar de finanțare conform filtrelor aplicate.
                        </td>
                      </tr>
                    ) : (
                      filteredDossiers.map((dossier) => {
                        const creditorBadge = CREDITOR_BADGES[dossier.creditor] || CREDITOR_BADGES.other;
                        const verifiedDocsCount = Object.values(dossier.documents || {}).filter(Boolean).length;

                        return (
                          <tr
                            key={dossier.id}
                            onClick={() => handleOpenDossier(dossier)}
                            className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                          >
                            <td className="p-3.5">
                              <div className="font-bold text-white">{dossier.clientName}</div>
                              <div className="text-[11px] text-zinc-400 font-mono">{dossier.clientPhone}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-medium text-zinc-200">{dossier.carTitle}</div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                {dossier.carPriceEur.toLocaleString('ro-RO')} € ({formatRonDirect(dossier.carPriceRon)})
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${creditorBadge.color}`}>
                                {creditorBadge.label}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-white">
                              {formatRonDirect(dossier.financedAmountRon)}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-amber-300">
                              {formatRonDirect(dossier.monthlyInstallmentRon)}/lună
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  verifiedDocsCount === 4
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                }`}
                              >
                                {verifiedDocsCount}/4
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                                {dossier.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDossier(dossier);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                              >
                                Deschide
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4.2 Tab RECONCILIERE COMISIOANE BROKERAJ (Ticket 10) */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-[#121215] border border-white/[0.08] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Raport Comisioane de Brokeraj Financiar (Kickback Bănci)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Reconciliere viramente bănci partenere pentru creditele auto acordate (1.0% - 3.5%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadFinancingCsv(dossiers)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Descarcă Borderou CSV
            </button>
          </div>

          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-black/40 border-b border-white/[0.08] text-[11px] font-bold text-zinc-400">
                  <tr>
                    <th className="p-3.5">ID & Client</th>
                    <th className="p-3.5">Vehicul</th>
                    <th className="p-3.5">Creditor</th>
                    <th className="p-3.5 text-right">Sumă Finanțată</th>
                    <th className="p-3.5 text-center">Cota Comision</th>
                    <th className="p-3.5 text-right">Valoare Comision (RON)</th>
                    <th className="p-3.5 text-center">Status Decontare</th>
                    <th className="p-3.5 text-right">Acțiune</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {dossiers.map((dossier) => {
                    const creditorBadge = CREDITOR_BADGES[dossier.creditor] || CREDITOR_BADGES.other;
                    const payoutStatus = dossier.commissionPayoutStatus || 'pending';

                    return (
                      <tr key={dossier.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{dossier.clientName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{dossier.id}</div>
                        </td>
                        <td className="p-3.5 font-medium text-zinc-200">{dossier.carTitle}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${creditorBadge.color}`}>
                            {creditorBadge.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          {formatRonDirect(dossier.financedAmountRon)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-zinc-300">
                          {dossier.brokerCommissionPct || 2.0}%
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-300">
                          {formatRonDirect(dossier.brokerCommissionRon || 0)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              payoutStatus === 'collected'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : payoutStatus === 'invoiced'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {payoutStatus === 'collected' ? 'Încasat' : payoutStatus === 'invoiced' ? 'Facturat' : 'În Așteptare'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <select
                            value={payoutStatus}
                            onChange={(e) => {
                              const payout = e.target.value as FinancingDossierItem['commissionPayoutStatus'];
                              void patchSharedDossier(dossier.id, { commissionPayoutStatus: payout }).then((result) => {
                                if (!result.ok || !result.dossier) {
                                  showToast('Comisionul nu a fost salvat pe server.');
                                  return;
                                }
                                replaceDossier(result.dossier);
                                showToast(`Status comision actualizat: ${payout.toUpperCase()}`);
                              });
                            }}
                            aria-label="Schimbă statusul plății comisionului"
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                          >
                            <option value="pending">În Așteptare</option>
                            <option value="invoiced">Facturat</option>
                            <option value="collected">Încasat în Cont</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4.3 Tab SETĂRI BĂNCI & CURS BT */}
      {activeTab === 'settings' && (
        <FinancingSettingsManager showToast={showToast} />
      )}

      {/* Modal Detaliu & Editare Dosar */}
      {selectedDossier && (
        <FinancingDossierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dossier={selectedDossier}
          onSave={handleSaveModal}
          cars={cars}
          showToast={showToast}
        />
      )}
    </div>
  );
};
