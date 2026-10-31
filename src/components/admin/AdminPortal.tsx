import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, Plus, Car, Trash2, Mail, Send, Check, Server, Phone, CheckCircle2, Tag, Star, Film,
  ExternalLink, AlertTriangle, Radio, BarChart3, LineChart, DollarSign, Sparkles, FileText, QrCode, Users, LogOut, Building2,
  Share2, HelpCircle, Clock, Menu, Puzzle, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { VehicleItem, SEED_DEALER, MarketPriceEvaluation, isTenantFeatureEnabled } from '../../db/seed';
import { useTenant } from '../../hooks/useTenant';
import { getStockNumber, computeOlxDiscrepancy, getOlxStatusBadge, calculateVehicleFinancials } from '../../utils/helpers';
import { HeroTikTokManager } from './HeroTikTokManager';
import { OlxStockSyncManager } from './OlxStockSyncManager';
import { MarketPriceComparatorModal } from '../modals/MarketPriceComparatorModal';
import { DealerAnalyticsDashboard } from './DealerAnalyticsDashboard';
import { WatermarkStudioModal } from './WatermarkStudioModal';
import { SalesDocumentsModal } from '../modals/SalesDocumentsModal';
import { WindowStickerModal } from '../modals/WindowStickerModal';
import { FleetDeadlinesWidget } from './FleetDeadlinesWidget';
import { LeadPipelineKanban } from './LeadPipelineKanban';
import { InventoryTableManager } from './InventoryTableManager';
import { PhotoGalleryManagerModal } from './PhotoGalleryManagerModal';
import { PlateOverlayStudioModal } from './PlateOverlayStudioModal';
import { FinancingPortfolioManager } from './FinancingPortfolioManager';
import { AutolicitPushModal } from './AutolicitPushModal';
import { OLXExportModal } from './OLXExportModal';
import { VehicleSocialPostModal } from '../modals/VehicleSocialPostModal';
import { StockFeedExportModal } from './StockFeedExportModal';
import { VehicleSeedExporterModal } from './VehicleSeedExporterModal';
import { AdminHelpModal } from './AdminHelpModal';
import { ParcOsSidebar, AdminTabType } from './ParcOsSidebar';
import { WorkspaceSettingsView } from './WorkspaceSettingsView';
import { SalesDocsHubView } from './SalesDocsHubView';
import { WindowStickersHubView } from './WindowStickersHubView';
import { FeedsHubView } from './FeedsHubView';
import { MailboxLayout } from '../../modules/mail/MailboxLayout';
import { OLXExtensionInstallModal } from './OLXExtensionInstallModal';
import { convertEurToRon } from '../../utils/currencyEngine';
import { DealPricingData } from './DealPriceModal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { VehicleReconBoard } from './service-tracker/VehicleReconBoard';
import { VehicleExpenseItem } from '../../db/types';

interface AdminPortalProps {
  cars: VehicleItem[];
  onStatusChange: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  onDeleteCar: (id: string) => void;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines') => void;
  onOpenAddModal: () => void;
  onBackToShowroom?: () => void;
  onLogout?: () => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
  onTogglePinHero: (carId: string) => void;
  onMovePinnedOrder: (carId: string, direction: 'up' | 'down') => void;
  onUpdateTikTokInfo: (carId: string, tiktokUrl: string, tiktokViews?: string) => void;
  onBulkReconcile?: (carIdsToSell: string[]) => void;
  onUpdateOlxLink?: (carId: string, olxUrl: string) => void;
  onSaveMarketEvaluation?: (carId: string, evaluation: MarketPriceEvaluation) => void;
  onSaveBrandedImages?: (carId: string, updatedImages: string[], originalImages?: string[]) => void;
  onUpdatePlateExpiry?: (carId: string, newDate: string) => void;
  onUpdateVehicleDeadlines?: (
    carId: string, 
    deadlines: {
      hasRedPlates?: boolean;
      redPlatesExpiresAt?: string;
      itpExpiresAt?: string;
      rarAppointmentDate?: string;
    }
  ) => void;
  onSetDealOfWeek?: (carId: string, isDeal: boolean) => void;
  onSetOldPrice?: (carId: string, oldPriceEur: number | undefined) => void;
  onUpdateDealPricing?: (carId: string, data: DealPricingData) => void;
  onToggleVatDeductible?: (carId: string) => void;
  onUpdateInternalNotes?: (carId: string, notes: string) => void;
  onUpdateAutolicitSync?: (carId: string, syncData?: NonNullable<VehicleItem['autolicitSync']>) => void;
  onUpdatePrice?: (carId: string, newPriceEur: number, oldPriceEur?: number, auditNote?: string) => void;
  onEditCar?: (car: VehicleItem) => void;
  onUpdateCar?: (car: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  cars,
  onStatusChange,
  onDeleteCar,
  onSelectCar,
  onOpenAddModal,
  onBackToShowroom,
  onLogout,
  showToast,
  dealer = SEED_DEALER,
  onTogglePinHero,
  onMovePinnedOrder,
  onUpdateTikTokInfo,
  onBulkReconcile,
  onUpdateOlxLink,
  onSaveMarketEvaluation,
  onSaveBrandedImages,
  onUpdatePlateExpiry,
  onUpdateVehicleDeadlines,
  onSetDealOfWeek,
  onSetOldPrice,
  onUpdateDealPricing,
  onToggleVatDeductible,
  onUpdateInternalNotes,
  onUpdateAutolicitSync,
  onUpdatePrice,
  onEditCar,
  onUpdateCar,
  onAddExpense
}) => {
  const { tenant } = useTenant();
  const { settings, toggleSidebarCollapsed, setSidebarMode } = useWorkspace();
  const activeDealer = dealer || tenant;

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>('inventory');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [evaluatingCar, setEvaluatingCar] = useState<VehicleItem | null>(null);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [brandingCar, setBrandingCar] = useState<VehicleItem | null>(null);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [salesDocsCar, setSalesDocsCar] = useState<VehicleItem | null>(null);
  const [salesDocsInitialBuyer, setSalesDocsInitialBuyer] = useState<any>(null);
  const [salesDocsInitialTab, setSalesDocsInitialTab] = useState<'proforma' | 'protocol' | 'warranty' | 'inspection' | 'margin' | 'contract' | 'gdpr'>('proforma');
  const [isSalesDocsOpen, setIsSalesDocsOpen] = useState(false);
  const [windowStickerCar, setWindowStickerCar] = useState<VehicleItem | null>(null);
  const [isWindowStickerOpen, setIsWindowStickerOpen] = useState(false);
  const [galleryCar, setGalleryCar] = useState<VehicleItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [plateStudioCar, setPlateStudioCar] = useState<VehicleItem | null>(null);
  const [isPlateStudioOpen, setIsPlateStudioOpen] = useState(false);
  const [autolicitCar, setAutolicitCar] = useState<VehicleItem | null>(null);
  const [isAutolicitOpen, setIsAutolicitOpen] = useState(false);
  const [olxExportCar, setOlxExportCar] = useState<VehicleItem | null>(null);
  const [isOlxExportOpen, setIsOlxExportOpen] = useState(false);
  const [socialPostCar, setSocialPostCar] = useState<VehicleItem | null>(null);
  const [isSocialPostOpen, setIsSocialPostOpen] = useState(false);
  const [seedExporterCar, setSeedExporterCar] = useState<VehicleItem | null>(null);
  const [isSeedExporterOpen, setIsSeedExporterOpen] = useState(false);
  const [isFeedExportOpen, setIsFeedExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // Statistici Dashboard Admin
  const adminStats = useMemo(() => {
    const totalVehicles = cars.length;
    const inStock = cars.filter(c => c.status === 'in_stock').length;
    const reserved = cars.filter(c => c.status === 'reserved').length;
    const sold = cars.filter(c => c.status === 'sold').length;
    const pinnedHero = cars.filter(c => c.isHeroPinned).length;
    const totalValueEur = cars.reduce((acc, c) => acc + c.priceEur, 0);
    const discrepanciesCount = cars.filter(c => {
      const d = computeOlxDiscrepancy(c.status, c.olxStatus);
      return d !== 'none';
    }).length;

    return { totalVehicles, inStock, reserved, sold, pinnedHero, totalValueEur, discrepanciesCount };
  }, [cars]);

  // 🛡️ Alocator Cote Stoc (Ticket 02) & Abonament SaaS (Ticket 03)
  const quota = activeDealer?.maxVehiclesQuota || 25;
  const activeVehiclesCount = useMemo(() => {
    return cars.filter(c => c.status !== 'sold').length;
  }, [cars]);
  const isEnterprise = activeDealer?.tier === 'enterprise' || quota >= 999;
  const isQuotaExceeded = !isEnterprise && activeVehiclesCount >= quota;
  const isQuotaNearLimit = !isEnterprise && !isQuotaExceeded && activeVehiclesCount >= Math.floor(quota * 0.85);

  const isSuspended = activeDealer?.status === 'suspended';
  const billingConfig = (activeDealer?.config as any)?.billing;
  const isInGracePeriod = !isSuspended && billingConfig?.subscriptionStatus === 'in_grace_period';

  const handleGuardedOpenAddModal = () => {
    if (isSuspended) {
      showToast('🚫 Contul este suspendat temporar pentru factură restantă. Efectuați plata în Contul de Garanție BT pentru deblocare.');
      return;
    }
    if (isQuotaExceeded) {
      showToast(`⚠️ Cotă stoc atinsă (${activeVehiclesCount}/${quota} vehicule active). Pentru a adăuga mai multe vehicule, contactați echipa ParcOS pentru upgrade de pachet.`);
      return;
    }
    onOpenAddModal();
  };

  return (

    <div 
      data-admin-mode={settings.displayMode}
      className={`min-h-screen flex flex-col md:flex-row no-print transition-colors duration-200 ${
        settings.displayMode === 'light' 
          ? 'admin-light-mode bg-[#f8fafc] text-slate-900' 
          : 'bg-[#0c0c0e] text-zinc-100'
      }`}
    >
      {/* Topbar mobil cu trigger hamburger */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#121215] border-b border-white/[0.08] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            aria-label="Deschide Meniu Navigație"
          >
            <Menu className="w-5 h-5 text-amber-400" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-black text-sm text-white tracking-tight">{activeDealer.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToShowroom && (
            <button
              type="button"
              onClick={onBackToShowroom}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
            >
              Showroom
            </button>
          )}
          <button
            type="button"
            onClick={handleGuardedOpenAddModal}
            className={`p-1.5 rounded-lg font-bold shadow-md cursor-pointer ${
              isQuotaExceeded ? 'bg-red-500 text-white' : 'bg-amber-500 text-black shadow-amber-500/20'
            }`}
            title={isQuotaExceeded ? 'Cotă stoc atinsă (Adăugare blocată)' : 'Adaugă Mașină'}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ParcOS Sidebar Vertical Desktop & Drawer Mobil */}
      <ParcOsSidebar
        activeTab={activeAdminTab}
        onTabChange={setActiveAdminTab}
        dealer={activeDealer}
        stats={{
          totalVehicles: adminStats.totalVehicles,
          inStock: adminStats.inStock,
          reserved: adminStats.reserved,
          sold: adminStats.sold,
          discrepanciesCount: adminStats.discrepanciesCount,
          pinnedHero: adminStats.pinnedHero
        }}
        onOpenAddModal={handleGuardedOpenAddModal}
        onOpenShowroom={onBackToShowroom}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onLogout={onLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Buton Plutitor Reveal când Sidebar-ul este complet ascuns (Hidden) */}
      {settings.sidebarMode === 'hidden' && (
        <button
          type="button"
          onClick={() => setSidebarMode('expanded')}
          className="hidden md:flex fixed left-0 top-20 z-40 bg-[#121215] border border-l-0 border-amber-500/50 hover:border-amber-400 text-amber-400 hover:text-white hover:bg-amber-500/20 px-2.5 py-2.5 rounded-r-xl shadow-2xl items-center gap-1.5 font-bold text-xs transition-all cursor-pointer group"
          title="Afișează Meniul Lateral (Sidebar)"
        >
          <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] tracking-wide">Meniu</span>
        </button>
      )}

      {/* Spațiul de Lucru Principal (Workspace Area) */}
      <main className="flex-1 min-w-0 max-w-full px-4 sm:px-8 py-6 md:py-8 overflow-y-auto">
        
        {/* Antet Portal Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Portal Gestiune Stoc Dealer OS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Panou Control Inventar &mdash; {activeDealer.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Gestiune integrată stoc, contracte oficiale de vânzare, proforme garanție și promovare multi-canal.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Buton Comutare Meniu Lateral Desktop (Restrânge / Extinde / Afișează) */}
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden md:inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-bold text-xs sm:text-sm h-10 px-3.5 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
              title={
                settings.sidebarMode === 'collapsed' 
                  ? 'Extinde meniul lateral' 
                  : settings.sidebarMode === 'hidden'
                  ? 'Afișează meniul lateral'
                  : 'Restrânge meniul lateral (Compact)'
              }
            >
              {settings.sidebarMode === 'collapsed' || settings.sidebarMode === 'hidden' ? (
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-zinc-400" />
              )}
              <span>
                {settings.sidebarMode === 'collapsed' 
                  ? 'Extinde Meniu' 
                  : settings.sidebarMode === 'hidden' 
                  ? 'Afișează Meniu' 
                  : 'Restrânge Meniu'}
              </span>
            </button>

            {onBackToShowroom && (
              <button 
                type="button"
                onClick={onBackToShowroom}
                className="inline-flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm h-10 px-3.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                title="Vezi Showroom Client"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Vezi Showroom</span>
              </button>
            )}

            {/* Buton Extensie & Asistent OLX 1-Click */}
            <button 
              type="button"
              onClick={() => setIsExtensionModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 text-teal-300 border border-teal-500/30 font-semibold text-xs sm:text-sm h-10 px-3.5 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0 shadow-lg shadow-teal-500/5"
              title="Instalează sau testează Extensia ParcOS OLX Publisher"
            >
              <Puzzle className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Extensie OLX</span>
              <span className="hidden md:inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-200 border border-teal-500/30">1-Click</span>
            </button>

            {/* Buton Ghid & Centru Ajutor Portal */}
            <button 
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 font-semibold text-xs sm:text-sm h-10 px-3.5 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
              title="Ghid & Centru de Ajutor"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ghid & Ajutor</span>
            </button>

            {/* Buton Export Feed-uri Stoc (Meta / Autovit) */}
            <button 
              type="button"
              onClick={() => setIsFeedExportOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm h-10 px-3.5 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
              title="Export Feed-uri Stoc (Meta / Autovit)"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Feed-uri Stoc (Meta / Autovit)</span>
            </button>

            {/* Buton Adaugă Mașină Nouă */}
            <button 
              type="button"
              onClick={handleGuardedOpenAddModal}
              className={`inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-sm h-10 px-4 rounded-xl shadow-lg transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0 ${
                isQuotaExceeded 
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              }`}
              title={isQuotaExceeded ? `Cotă stoc atinsă (${activeVehiclesCount}/${quota} active)` : "Adaugă mașină nouă în showroom prin scanare CIV/Talon sau manual"}
            >
              <Plus className="w-4 h-4" />
              <span>{isQuotaExceeded ? 'Cotă Stoc Atinsă' : 'Adaugă Mașină'}</span>
            </button>

            {onLogout && (
              <button 
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 font-semibold text-xs sm:text-sm h-10 px-3 rounded-xl transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
                title="Deconectare și revenire în showroom-ul public"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Deconectare</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Carduri KPI Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 my-6">
          <div className="p-4 sm:p-4.5 rounded-2xl bg-[#121215] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 mb-1">Total Mașini Înrolate</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{adminStats.totalVehicles}</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">100% active în catalog</div>
          </div>

          <div className="p-4 sm:p-4.5 rounded-2xl bg-[#121215] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 mb-1">În Stoc (Disponibile)</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{adminStats.inStock}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Vizibile cu preț și rate</div>
          </div>

          <div className="p-4 sm:p-4.5 rounded-2xl bg-[#121215] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 mb-1">Rezervate (Dosar Rate)</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{adminStats.reserved}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Blocate la vizionare nouă</div>
          </div>

          <div className="p-4 sm:p-4.5 rounded-2xl bg-[#121215] border border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 mb-1">Hero Spotlight Pinned</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{adminStats.pinnedHero}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Fixate manual în top TikTok</div>
          </div>

          <div className="p-4 sm:p-4.5 rounded-2xl bg-[#121215] border border-white/[0.08] col-span-2 sm:col-span-1">
            <div className="text-[11px] text-zinc-400 mb-1">Valoare Totală Stoc</div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100">{adminStats.totalValueEur.toLocaleString('ro-RO')} €</div>
            <div className="text-[10px] text-zinc-400 mt-1">{convertEurToRon(adminStats.totalValueEur).toLocaleString('ro-RO')} RON (la Curs BT)</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VEDERI PANOU ADMIN CONFORM SELECTORULUI DIN PARCOS SIDEBAR             */}
        {/* ========================================================================= */}

        {/* 1. Operațiuni Stoc: Stoc & Inventar */}
        {activeAdminTab === 'inventory' && (
          <div className="space-y-6">
            {/* 💳 Banner Stare Abonament SaaS & Grace Period (Ticket 03) */}
            {(isSuspended || isInGracePeriod) && (
              <div className={`p-4 rounded-2xl border transition-all ${
                isSuspended 
                  ? 'bg-red-500/15 border-red-500/40 text-red-200 shadow-lg shadow-red-500/10' 
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-lg shadow-amber-500/10'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 ${isSuspended ? 'text-red-400' : 'text-amber-400'}`} />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>{isSuspended ? 'Showroom Suspendat — Factură Neachitată' : 'Atenționare Scadență Abonament ParcOS'}</span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 border border-white/10">
                          {isSuspended ? 'Blocat' : 'Termen Grație 14 Zile'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
                        {isSuspended
                          ? 'Perioada de grație de 14 zile a expirat. Vă rugăm să efectuați plata abonamentului în Contul de Garanție CARVANA SRL (Banca Transilvania) pentru reactivarea imediată a contului.'
                          : 'Abonamentul dumneavoastră lunar este scadent. Vă rugăm să achitați factura fiscală pentru a preveni suspendarea automată a showroom-ului.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Informații plată: CARVANA SRL • IBAN EUR: RO12BTRL01304205P88888XX • Banca Transilvania (Cont de Garanție)')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      isSuspended
                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    Detalii Plată BT
                  </button>
                </div>
              </div>
            )}

            {/* 🛡️ Alocator Cote Stoc: Banner Avertizare Ocupare / Depășire Cotă (Ticket 02) */}
            {(isQuotaExceeded || isQuotaNearLimit) && (
              <div className={`p-4 rounded-2xl border transition-all ${
                isQuotaExceeded 
                  ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 ${isQuotaExceeded ? 'text-red-400' : 'text-amber-400'}`} />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>{isQuotaExceeded ? 'Cotă Stoc Atinsă' : 'Avertizare Ocupare Cotă Stoc'}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40 border border-white/10">
                          {activeVehiclesCount} / {quota} vehicule active
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
                        {isQuotaExceeded
                          ? `Ați atins limita pachetului dumneavoastră (${activeDealer?.tier?.toUpperCase() || 'STARTER'} - max ${quota} mașini). Adăugarea de vehicule noi este blocată temporar.`
                          : `Ați utilizat ${Math.round((activeVehiclesCount / quota) * 100)}% din capacitatea pachetului curent (${activeDealer?.tier?.toUpperCase() || 'STARTER'}).`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Pentru upgrade de pachet, contactați echipa ParcOS la contact@parcos.ro')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      isQuotaExceeded
                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    }`}
                  >
                    Upgrade Pachet ParcOS
                  </button>
                </div>
              </div>
            )}

            <FleetDeadlinesWidget 
              cars={cars}
              onUpdatePlateExpiry={onUpdatePlateExpiry}
              onUpdateVehicleDeadlines={onUpdateVehicleDeadlines}
              onSelectCar={(c) => onSelectCar(c, 'deadlines')}
              showToast={showToast}
            />

            <InventoryTableManager 
              dealer={activeDealer}
              cars={cars}
              onStatusChange={onStatusChange}
              onDeleteCar={onDeleteCar}
              onSelectCar={onSelectCar}
              onTogglePinHero={onTogglePinHero}
              onSetDealOfWeek={onSetDealOfWeek}
              onSetOldPrice={onSetOldPrice}
              onUpdateDealPricing={onUpdateDealPricing}
              onToggleVatDeductible={onToggleVatDeductible}
              onUpdateInternalNotes={onUpdateInternalNotes}
              onUpdatePrice={onUpdatePrice}
              onEditCar={onEditCar}
              showToast={showToast}
              onOpenAddModal={handleGuardedOpenAddModal}
              onOpenComparator={(car) => {
                setEvaluatingCar(car);
                setIsComparatorOpen(true);
              }}
              onOpenBranding={(car) => {
                setBrandingCar(car);
                setIsBrandingOpen(true);
              }}
              onOpenSalesDocs={(car) => {
                setSalesDocsCar(car);
                setIsSalesDocsOpen(true);
              }}
              onOpenWindowSticker={(car) => {
                setWindowStickerCar(car);
                setIsWindowStickerOpen(true);
              }}
              onOpenGallery={(car) => {
                setGalleryCar(car);
                setIsGalleryOpen(true);
              }}
              onOpenPlateStudio={(car) => {
                setPlateStudioCar(car);
                setIsPlateStudioOpen(true);
              }}
              onOpenAutolicit={(car) => {
                setAutolicitCar(car);
                setIsAutolicitOpen(true);
              }}
              onOpenOlxExport={(car) => {
                setOlxExportCar(car);
                setIsOlxExportOpen(true);
              }}
              onOpenSocialPost={(car) => {
                setSocialPostCar(car);
                setIsSocialPostOpen(true);
              }}
              onOpenSeedExporter={(car) => {
                setSeedExporterCar(car);
                setIsSeedExporterOpen(true);
              }}
              onOpenExporter={(car) => {
                setSeedExporterCar(car);
                setIsSeedExporterOpen(true);
              }}
            />
          </div>
        )}

        {/* 1.5 Operațiuni Stoc: Service & Pregătire Flotă (Recon Tracker & High-Res Document Vault) */}
        {activeAdminTab === 'recon_tracker' && (
          <VehicleReconBoard
            cars={cars}
            onUpdateCar={onUpdateCar || onEditCar}
            onAddExpense={onAddExpense}
            showToast={showToast}
          />
        )}

        {/* 2. Operațiuni Stoc: Conductă CRM Kanban */}
        {activeAdminTab === 'crm' && (
          <LeadPipelineKanban
            cars={cars}
            showToast={showToast}
            dealer={activeDealer}
            onStatusChange={onStatusChange}
            onOpenSalesDocs={(car, initialBuyer) => {
              setSalesDocsCar(car);
              setSalesDocsInitialBuyer(initialBuyer || null);
              setSalesDocsInitialTab('proforma');
              setIsSalesDocsOpen(true);
            }}
          />
        )}

        {/* 2.5 Operațiuni Stoc: ParcOS Mail Hub (PMH-301) */}
        {activeAdminTab === 'mail' && isTenantFeatureEnabled(activeDealer?.features, 'mailHub', activeDealer?.slug) && (
          <MailboxLayout
            dealerSlug={activeDealer?.slug}
            dealershipName={activeDealer?.name || 'RXM Automobile'}
            dealerProfile={activeDealer}
            cars={cars}
            showToast={showToast}
            onSelectVehicle={(vehicleId) => {
              const car = cars.find(c => c.id === vehicleId || (c.vin && c.vin.includes(vehicleId)));
              if (car) onSelectCar(car, 'specs');
            }}
          />
        )}

        {/* 3. Operațiuni Stoc: Centru Acte Vânzare (1-Click OCR) */}
        {activeAdminTab === 'sales_docs' && (
          <SalesDocsHubView
            cars={cars}
            dealer={activeDealer}
            onOpenSalesDocs={(car, tab, buyerData) => {
              setSalesDocsCar(car);
              setSalesDocsInitialTab(tab || 'proforma');
              setSalesDocsInitialBuyer(buyerData || null);
              setIsSalesDocsOpen(true);
            }}
            showToast={showToast}
          />
        )}

        {/* 4. Operațiuni Stoc: Fișe de Parbriz A4 (QR Code) */}
        {activeAdminTab === 'window_stickers' && (
          <WindowStickersHubView
            cars={cars}
            dealer={activeDealer}
            onOpenWindowSticker={(car) => {
              setWindowStickerCar(car);
              setIsWindowStickerOpen(true);
            }}
            showToast={showToast}
          />
        )}

        {/* 5. Integrări Edge & Marketing: Sincronizare OLX (S9) */}
        {activeAdminTab === 'olx' && (
          <OlxStockSyncManager
            cars={cars}
            onStatusChange={onStatusChange}
            showToast={showToast}
            onBulkReconcile={onBulkReconcile}
            onUpdateOlxLink={onUpdateOlxLink}
          />
        )}

        {/* 6. Integrări Edge & Marketing: Feed-uri Stoc & Social Media */}
        {activeAdminTab === 'feeds' && (
          <FeedsHubView
            cars={cars}
            dealer={activeDealer}
            onTogglePinHero={onTogglePinHero}
            onMovePinnedOrder={onMovePinnedOrder}
            onUpdateTikTokInfo={onUpdateTikTokInfo}
            onOpenFeedExport={() => setIsFeedExportOpen(true)}
            showToast={showToast}
          />
        )}

        {/* 7. Integrări Edge & Marketing: Bilanț Financiar & KPI */}
        {activeAdminTab === 'analytics' && (
          <DealerAnalyticsDashboard
            cars={cars}
            onSelectCar={onSelectCar}
            onTogglePinHero={onTogglePinHero}
            onSetDealOfWeek={onSetDealOfWeek}
            onUpdateDealPricing={onUpdateDealPricing}
            showToast={showToast}
          />
        )}

        {/* 8. Configurare Workspace & Vizualizare */}
        {activeAdminTab === 'settings' && (
          <WorkspaceSettingsView
            dealer={activeDealer}
            showToast={showToast}
          />
        )}

        {/* 9. Configurare Finanțare, Curs BT & Creditori */}
        {activeAdminTab === 'financing' && (
          <FinancingPortfolioManager
            cars={cars}
            dealer={activeDealer}
            showToast={showToast}
            onStatusChange={onStatusChange}
            onOpenSalesDocs={(car, buyer) => {
              setSalesDocsCar(car);
              setSalesDocsInitialBuyer(buyer || null);
              setSalesDocsInitialTab('proforma');
              setIsSalesDocsOpen(true);
            }}
          />
        )}


      {/* 🛠️ Suport Tehnic & Mentenanță Showroom — Carvana S.R.L. */}
      <div className="mt-8 bg-gradient-to-b from-[#151518] to-[#101012] border border-amber-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow discret luxury */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Suport Tehnic Oficial & Mentenanță
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" /> Asistență Tehnică & Dezvoltare Dedicată &mdash; Carvana S.R.L.
            </h3>
            <p className="text-xs text-zinc-400">
              Platformă showroom autonom dezvoltată, găzduită și monitorizată non-stop pentru {activeDealer.name} de Carvana S.R.L.
            </p>
          </div>

          <a 
            href="https://wa.me/40758511040?text=Buna%20ziua,%20am%20o%20solicitare%20tehnica%20pentru%20platforma%20ParcOS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Deschide WhatsApp Suport (0758 511 040)</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs relative">
          {/* Card 1: Dispecerat & Telefon WhatsApp Direct */}
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 flex flex-col justify-between">
            <div>
              <div className="text-zinc-400 mb-1 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> Suport Tehnic Direct (Tel & WhatsApp)
              </div>
              <a 
                href="tel:0758511040" 
                className="font-bold text-white text-base font-mono text-amber-300 hover:underline block"
              >
                0758 511 040
              </a>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Linie activă • Telefon + WhatsApp
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-2">
              <a 
                href="tel:0758511040" 
                className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-center text-[11px] text-zinc-300 font-semibold transition-all"
              >
                📞 Apelează
              </a>
              <a 
                href="https://wa.me/40758511040?text=Buna%20ziua,%20am%20o%20solicitare%20tehnica%20pentru%20platforma%20ParcOS" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 py-1.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg text-center text-[11px] text-emerald-300 font-semibold transition-all"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Card 2: Inginerie & Garanție Software Carvana SRL */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/06">
            <div className="text-zinc-400 mb-1 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-amber-400" /> Suport Tehnic & Mentenanță Software
            </div>
            <div className="font-bold text-white text-sm">Carvana S.R.L. &mdash; Platform Ops</div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Actualizări zilnice curs BNR/BT, verificare OCR CIV/Talon, audit securitate & protecție foto anti-scraping.
            </div>
            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
              Email: contact@carvana.ro
            </div>
          </div>

          {/* Card 3: Infrastructură Cloud & Sincronizare Securizată */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/06">
            <div className="text-zinc-400 mb-1 flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-amber-400" /> Infrastructură Cloud NVMe & Securitate
            </div>
            <div className="font-bold text-white text-sm">Cluster Cloud Privat NVMe High-Availability</div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Găzduire dedicată NVMe • Uptime garantat 99.9% • Backup automat baze de date & sincronizare stoc.
            </div>
            <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> Rețea monitorizată autonom • Rulare stabilă
            </div>
          </div>
        </div>
      </div>


      {/* 🔍 Modal Comparator & Analizator Preț Piață */}
      {isComparatorOpen && evaluatingCar && (
        <MarketPriceComparatorModal
          isOpen={isComparatorOpen}
          car={evaluatingCar}
          dealer={activeDealer}
          onClose={() => {
            setIsComparatorOpen(false);
            setEvaluatingCar(null);
          }}
          onSaveEvaluation={onSaveMarketEvaluation}
          showToast={showToast}
        />
      )}

      {/* 🎨 Modal Auto-Branding Studio: Logo Dealer pe Poze */}
      {isBrandingOpen && brandingCar && (
        <WatermarkStudioModal
          isOpen={isBrandingOpen}
          car={brandingCar}
          onClose={() => {
            setIsBrandingOpen(false);
            setBrandingCar(null);
          }}
          onSaveBrandedImages={onSaveBrandedImages}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 📄 Modal Generator Acte Vânzare, Predare & Garanție */}
      {isSalesDocsOpen && (
        <SalesDocumentsModal
          isOpen={isSalesDocsOpen}
          car={salesDocsCar || (cars.length > 0 ? cars[0] : null)}
          cars={cars}
          onClose={() => {
            setIsSalesDocsOpen(false);
            setSalesDocsCar(null);
            setSalesDocsInitialBuyer(null);
          }}
          showToast={showToast}
          dealer={activeDealer}
          initialBuyerData={salesDocsInitialBuyer}
          initialDocTab={salesDocsInitialTab}
        />
      )}

      {/* 🪟 Modal Generator Fișă Parbriz A4 cu QR Code */}
      {isWindowStickerOpen && windowStickerCar && (
        <WindowStickerModal
          isOpen={isWindowStickerOpen}
          car={windowStickerCar}
          onClose={() => {
            setIsWindowStickerOpen(false);
            setWindowStickerCar(null);
          }}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 🖼️ Modal Manager Galerie Foto (Rotire 90°, Copertă, Adăugare) */}
      {isGalleryOpen && galleryCar && (
        <PhotoGalleryManagerModal
          isOpen={isGalleryOpen}
          car={galleryCar}
          onClose={() => {
            setIsGalleryOpen(false);
            setGalleryCar(null);
          }}
          onSaveImages={(carId, updatedImages) => {
            onSaveBrandedImages?.(carId, updatedImages);
            showToast('✓ Galeria foto a fost actualizată cu succes!');
          }}
          onStatusChange={onStatusChange}
          showToast={showToast}
        />
      )}

      {/* 🛡️ Modal Studio Plăcuță RXM (Acoperire Număr Înmatriculare) */}
      {isPlateStudioOpen && plateStudioCar && (
        <PlateOverlayStudioModal
          isOpen={isPlateStudioOpen}
          car={plateStudioCar}
          onClose={() => {
            setIsPlateStudioOpen(false);
            setPlateStudioCar(null);
          }}
          onSaveImages={(carId, updatedImages) => {
            onSaveBrandedImages?.(carId, updatedImages);
            showToast('✓ Plăcuțele de dealer au fost salvate cu succes!');
          }}
          showToast={showToast}
        />
      )}

      {/* ⚡ Modal Pod Sindicare AutoLicit.ro (Abonament sau Licitație Live) */}
      {isAutolicitOpen && autolicitCar && (
        <AutolicitPushModal
          isOpen={isAutolicitOpen}
          car={autolicitCar}
          onClose={() => {
            setIsAutolicitOpen(false);
            setAutolicitCar(null);
          }}
          onConfirmSync={(carId, syncData) => {
            onUpdateAutolicitSync?.(carId, syncData);
          }}
          onRemoveSync={(carId) => {
            onUpdateAutolicitSync?.(carId, undefined);
          }}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 📱 Modal Studio Postare Social Media (Meta FB / IG) */}
      {isSocialPostOpen && socialPostCar && (
        <VehicleSocialPostModal
          isOpen={isSocialPostOpen}
          car={socialPostCar}
          onClose={() => {
            setIsSocialPostOpen(false);
            setSocialPostCar(null);
          }}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 🚀 Modal Export Automat pe OLX România (Pre-completare inteligentă & 8 poze) */}
      {isOlxExportOpen && olxExportCar && (
        <OLXExportModal
          isOpen={isOlxExportOpen}
          car={olxExportCar}
          onClose={() => {
            setIsOlxExportOpen(false);
            setOlxExportCar(null);
          }}
          onOpenInstallModal={() => setIsExtensionModalOpen(true)}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 📡 Modal Generator Feed Stoc Multi-Platformă (Meta CSV, Autovit XML, JSON) */}
      {isFeedExportOpen && (
        <StockFeedExportModal
          isOpen={isFeedExportOpen}
          cars={cars}
          onClose={() => setIsFeedExportOpen(false)}
          showToast={showToast}
          dealer={activeDealer}
        />
      )}

      {/* 📦 Modal Export Permanent Git (WebP HD + Seed TypeScript pentru Deploy-uri) */}
      {isSeedExporterOpen && seedExporterCar && (
        <VehicleSeedExporterModal
          isOpen={isSeedExporterOpen}
          car={seedExporterCar}
          onClose={() => {
            setIsSeedExporterOpen(false);
            setSeedExporterCar(null);
          }}
          showToast={showToast}
        />
      )}

      {/* ❔ Centru de Ajutor & Ghid Interactiv Portal Showroom */}
      <AdminHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        dealer={activeDealer}
      />

      {/* 🔌 Modal Ghid & Instalare Extensie ParcOS OLX Publisher */}
      <OLXExtensionInstallModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        showToast={showToast}
      />
      </main>
    </div>
  );
};
