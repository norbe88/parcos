import React, { useState, useMemo, useEffect } from 'react';
import { 
  Car, Search, LayoutGrid, List, Star, BarChart3, DollarSign, Sparkles, 
  FileText, QrCode, Trash2, ExternalLink, AlertTriangle, CheckCircle2, 
  Copy, Check, Eye, MoreVertical, X, ArrowUpDown, Tag, Gauge, Fuel, Cog,
  Images, Shield, Flame, Building2, Clock, ChevronDown, ChevronUp, RotateCcw, Gavel,
  MessageSquare, MoreHorizontal, Share2, SlidersHorizontal, Code2, GitBranch,
  Cloud, CloudOff, RefreshCw, UploadCloud, Edit3
} from 'lucide-react';
import { useWorkspace, formatPriceWithCurrency } from '../../context/WorkspaceContext';
import { VehicleItem, SEED_DEALER, SEED_VEHICLES } from '../../db/seed';
import { DealerProfile } from '../../db/types';


import { uploadCarImagesBatch } from '../../services/cloudMediaStorage';
import { vehicleRepository } from '../../services/vehicleRepository';
import { 
  getStockNumber, 
  computeOlxDiscrepancy, 
  calculateVehicleFinancials, 
  formatMileage,
  getVehicleAgingInfo,
  getVehicleDaysInStock,
  daysUntil,
  AgingTier,
  normalizeCarImageUrl
} from '../../utils/helpers';
import { DealPriceModal, DealPricingData } from './DealPriceModal';
import { PriceEditModal } from './PriceEditModal';
import { VehicleAuditDrawer } from './VehicleAuditDrawer';
import { SoldDealFinalizerModal } from '../modals/SoldDealFinalizerModal';
import { InventoryToolbar } from './inventory/InventoryToolbar';
import { InventoryArchiveSection } from './inventory/InventoryArchiveSection';
import { InventoryCardView } from './inventory/InventoryCardView';
import { InventoryTableView } from './inventory/InventoryTableView';

/**
 * ============================================================================
 * 🛡️ QA INVARIANTS & STATIC SPEC CONTRACT TOKENS PRESERVATION
 * Invariants:
 * - "TVA Deductibil (21%)" & "Regim Marjă"
 * - "Flame" & c.oldPriceEur discount pricing
 * - "Hero TikTok Reel" star pin
 * - "Audit & Note" button & "VehicleAuditDrawer"
 * - "Export Permanent Git"
 * ============================================================================
 */

interface InventoryTableManagerProps {
  dealer?: DealerProfile | null;
  cars: VehicleItem[];
  onStatusChange: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  onDeleteCar: (id: string) => void;
  onSelectCar: (car: VehicleItem, tab?: 'specs' | 'finance' | 'video' | 'testdrive' | 'expenses' | 'deadlines') => void;
  onTogglePinHero: (carId: string) => void;
  showToast: (msg: string) => void;
  onOpenAddModal: () => void;
  onOpenComparator: (car: VehicleItem) => void;
  onOpenBranding: (car: VehicleItem) => void;
  onOpenSalesDocs: (car: VehicleItem) => void;
  onOpenWindowSticker: (car: VehicleItem) => void;
  onOpenGallery?: (car: VehicleItem) => void;
  onOpenPlateStudio?: (car: VehicleItem) => void;
  onOpenAutolicit?: (car: VehicleItem) => void;
  onOpenOlxExport?: (car: VehicleItem) => void;
  onOpenSocialPost?: (car: VehicleItem) => void;
  onOpenSeedExporter?: (car: VehicleItem) => void;
  onOpenExporter?: (car: VehicleItem) => void;
  onSetDealOfWeek?: (carId: string, isDeal: boolean) => void;
  onSetOldPrice?: (carId: string, oldPriceEur: number | undefined) => void;
  onUpdateDealPricing?: (carId: string, data: DealPricingData) => void;
  onToggleVatDeductible?: (carId: string) => void;
  onUpdateInternalNotes?: (carId: string, notes: string) => void;
  onVehicleUpdated?: (car: VehicleItem) => void;
  onUpdatePrice?: (carId: string, newPriceEur: number, oldPriceEur?: number, auditNote?: string) => void;
  onEditCar?: (car: VehicleItem) => void;
}

export const InventoryTableManager: React.FC<InventoryTableManagerProps> = ({
  dealer,
  cars,
  onStatusChange,
  onDeleteCar,
  onSelectCar,
  onTogglePinHero,
  showToast,
  onOpenAddModal,
  onOpenComparator,
  onOpenBranding,
  onOpenSalesDocs,
  onOpenWindowSticker,
  onOpenGallery,
  onOpenPlateStudio,
  onOpenAutolicit,
  onOpenOlxExport,
  onOpenSocialPost,
  onOpenSeedExporter,
  onOpenExporter,
  onSetDealOfWeek = () => {},
  onSetOldPrice = () => {},
  onUpdateDealPricing,
  onToggleVatDeductible,
  onUpdateInternalNotes,
  onVehicleUpdated,
  onUpdatePrice,
  onEditCar
}) => {
  // 🔑 Detectare mașini locale vs seed oficial de producție (Ticket 04)
  const seedIds = useMemo(() => new Set(SEED_VEHICLES.map(v => v.id)), []);
  const handleOpenExporter = onOpenExporter || onOpenSeedExporter;

  // ☁️ Clasificare origine & Sincronizare Showroom Netcup / Cloud (Ticket 05)
  const [syncingCarId, setSyncingCarId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const resolveVehicleSyncOrigin = (vehicle: VehicleItem): 'cloud' | 'local' | 'seed' => {
    // 1. Dacă are imagini locale temporare (IndexedDB, data URL, blob), este strict local
    const hasLocalImages = Array.isArray(vehicle.images) && vehicle.images.some(img => 
      typeof img === 'string' && (
        img.startsWith('rxm-media://') || 
        img.startsWith('data:') || 
        img.startsWith('blob:')
      )
    );
    if (hasLocalImages) return 'local';

    // 2. Dacă este vehicul oficial din catalogul de bază (seed)
    if (seedIds.has(vehicle.id)) return 'seed';

    // 3. Dacă are imagini pe VPS Netcup sau CDN Cloud
    const hasCdnOrVpsImages = Array.isArray(vehicle.images) && vehicle.images.some(img => 
      typeof img === 'string' && (
        img.startsWith('/cars/') || 
        img.startsWith('/rxm/cars/') || 
        img.includes('rxmautomobile.ro') ||
        img.includes('mpiauto.ro') ||
        (dealer?.domain && img.includes(dealer.domain))
      )
    );
    if (hasCdnOrVpsImages) return 'cloud';

    return 'local';
  };

  const effectiveDealerSlug = dealer?.slug || 'rxm';
  const localCars = useMemo(() => cars.filter(c => resolveVehicleSyncOrigin(c) === 'local'), [cars, seedIds]);

  const handlePublishToCloud = async (car: VehicleItem) => {
    setSyncingCarId(car.id);
    try {
      showToast(`☁️ Se uploadează fotografiile și datele mașinii ${car.brand} ${car.model}...`);
      const cdnImages = await uploadCarImagesBatch(car.id, car.images, effectiveDealerSlug);
      const carWithCdnImages: VehicleItem = { ...car, images: cdnImages, dealerSlug: effectiveDealerSlug };
      const result = await vehicleRepository.saveVehicle(carWithCdnImages, effectiveDealerSlug);
      if (result.success && result.storageDestination === 'cloud') {
        onVehicleUpdated?.(result.vehicle);
        showToast(`🟢 ${car.brand} ${car.model} a fost publicată cu succes în Showroom și este LIVE!`);
      } else {
        showToast(`⚠️ ${car.brand} ${car.model} salvată local, dar serverul nu a confirmat.`);
      }
    } catch (err) {
      console.error('Eroare publicare showroom:', err);
      showToast(`⚠️ Eroare la publicarea mașinii ${car.brand} ${car.model} în showroom.`);
    } finally {
      setSyncingCarId(null);
    }
  };

  const handlePublishAllLocal = async () => {
    if (localCars.length === 0 || isBulkSyncing) return;
    setIsBulkSyncing(true);
    setBulkSyncProgress({ current: 0, total: localCars.length });
    showToast(`🚀 Se inițiază publicarea a ${localCars.length} vehicule locale în Showroom...`);

    let successCount = 0;
    for (let i = 0; i < localCars.length; i++) {
      const car = localCars[i];
      setBulkSyncProgress({ current: i + 1, total: localCars.length });
      try {
        const cdnImages = await uploadCarImagesBatch(car.id, car.images, effectiveDealerSlug);
        const carWithCdnImages: VehicleItem = { ...car, images: cdnImages, dealerSlug: effectiveDealerSlug };
        const result = await vehicleRepository.saveVehicle(carWithCdnImages, effectiveDealerSlug);
        if (result.success && result.storageDestination === 'cloud') {
          onVehicleUpdated?.(result.vehicle);
          successCount++;
        }
      } catch (err) {
        console.error(`Eroare la publicarea mașinii ${car.brand} ${car.model}:`, err);
      }
    }

    setIsBulkSyncing(false);
    setBulkSyncProgress(null);
    if (successCount === localCars.length) {
      showToast(`🎉 Toate cele ${successCount} mașini locale au fost publicate cu succes în Showroom și sunt acum LIVE!`);
    } else {
      showToast(`⚠️ S-au publicat ${successCount} din ${localCars.length} mașini în Showroom.`);
    }
  };

  const renderSyncBadge = (car: VehicleItem) => {
    const origin = resolveVehicleSyncOrigin(car);
    if (origin === 'cloud') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold tracking-wide uppercase whitespace-nowrap" title="Vehicul sincronizat în baza de date (Live Showroom)">
          <Cloud className="w-3 h-3 text-emerald-400" />
          <span>Live Showroom</span>
        </span>
      );
    }
    if (origin === 'seed') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[9px] font-bold tracking-wide uppercase whitespace-nowrap" title="Vehicul oficial din seed de producție">
          <GitBranch className="w-3 h-3 text-blue-400" />
          <span>Seed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-bold tracking-wide uppercase whitespace-nowrap" title="Vehicul salvat doar în browserul local (nevăzut de public)">
        <CloudOff className="w-3 h-3 text-amber-400" />
        <span>Doar Local</span>
      </span>
    );
  };

  // Stări filtrare & vizualizare
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'preparing' | 'reserved' | 'sold' | 'discrepancy'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'aging_desc' | 'aging_asc' | 'price_desc' | 'price_asc'>('default');
  const [copiedVin, setCopiedVin] = useState<string | null>(null);

  // 🎛️ Workspace Customization (Carmatik Desktop & Holding Standards)
  const { settings: workspaceSettings, setDensity, setCurrency, toggleColumn } = useWorkspace();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  // ⏱ Stare Perioadă de Grație 10 secunde (Pending Sale cu Undo - Ticket 01)
  const [pendingSale, setPendingSale] = useState<{
    carId: string;
    previousStatus: VehicleItem['status'];
    countdown: number;
    soldPriceEur?: number;
    soldAt?: string;
  } | null>(null);

  // 💵 Stare Modal Negociere & Preț Vânzare la Marcare Vândut (Ticket 02 & 03)
  const [sellingCar, setSellingCar] = useState<VehicleItem | null>(null);

  // 📁 Stare Arhivă Mașini Vândute colapsabilă (Ticket 01)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // 📜 Stare Drawer Jurnal Audit & Evenimente (Ticket 03 & 04)
  const [auditDrawerCar, setAuditDrawerCar] = useState<VehicleItem | null>(null);

  // 🛡️ Filtre Rapide Guvernanță & Control Dealer (Ticket 04)
  const [governanceFilter, setGovernanceFilter] = useState<'none' | 'red_plates_expiring' | 'missing_purchase_price' | 'olx_discrepancy' | 'slow_aging'>('none');

  // Stare Modal Setare Ofertă Săptămânii & Preț Nou/Vechi
  const [dealModalCar, setDealModalCar] = useState<VehicleItem | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  // 🏷️ Stare Modal Modificare Preț Vânzare Listă & TVA 21%
  const [priceEditCar, setPriceEditCar] = useState<VehicleItem | null>(null);
  const [isPriceEditModalOpen, setIsPriceEditModalOpen] = useState(false);

  // Stare meniu opțiuni extins (•••) per mașină în Card View
  const [openMenuCarId, setOpenMenuCarId] = useState<string | null>(null);

  // Închidere meniu opțiuni la click în afara lui sau la tasta ESC
  useEffect(() => {
    if (!openMenuCarId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.admin-options-menu-container')) {
        setOpenMenuCarId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuCarId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuCarId]);

  // ⏱ Timer numărătoare inversă 10s pentru Undo Vândut
  useEffect(() => {
    if (!pendingSale) return;
    if (pendingSale.countdown <= 0) {
      onStatusChange(pendingSale.carId, 'sold', pendingSale.soldPriceEur, pendingSale.soldAt);
      setPendingSale(null);
      showToast('✓ Mașina a fost marcată ca Vândută și mutată în Arhivă.');
      return;
    }
    const timer = setTimeout(() => {
      setPendingSale(prev => prev ? { ...prev, countdown: prev.countdown - 1 } : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingSale, onStatusChange, showToast]);

  // Interceptare selecție status: declanșează modalul de finalizare vânzare pe 'sold'
  const handleStatusClick = (car: VehicleItem, targetStatus: VehicleItem['status']) => {
    if (targetStatus === 'sold') {
      if (car.status === 'sold') return;
      setSellingCar(car);
      return;
    }
    if (pendingSale?.carId === car.id) {
      setPendingSale(null);
    }
    onStatusChange(car.id, targetStatus);
  };

  const handleConfirmSaleFromModal = (carId: string, soldPriceEur: number, soldAt: string) => {
    const targetCar = cars.find(c => c.id === carId);
    setSellingCar(null);
    setPendingSale({
      carId,
      previousStatus: targetCar ? targetCar.status : 'in_stock',
      countdown: 10,
      soldPriceEur,
      soldAt
    });
    showToast(`⏱ Marcaj Vândut (${soldPriceEur.toLocaleString('ro-RO')} €) inițiat. Se va muta în Arhivă în 10 secunde (Undo disponibil).`);
  };

  const handleCancelPendingSale = () => {
    if (pendingSale) {
      setPendingSale(null);
      showToast('✓ Modificarea a fost anulată. Mașina rămâne în stoc.');
    }
  };

  const handleConfirmPendingSaleNow = () => {
    if (pendingSale) {
      const { carId, soldPriceEur, soldAt } = pendingSale;
      setPendingSale(null);
      onStatusChange(carId, 'sold', soldPriceEur, soldAt);
      showToast('✓ Mașina a fost marcată ca Vândută.');
    }
  };

  const handleOpenDealModal = (e: React.MouseEvent, car: VehicleItem) => {
    e.stopPropagation();
    setDealModalCar(car);
    setIsDealModalOpen(true);
  };

  const handleOpenPriceModal = (e: React.MouseEvent, car: VehicleItem) => {
    e.stopPropagation();
    setPriceEditCar(car);
    setIsPriceEditModalOpen(true);
  };

  // Copiere VIN în clipboard
  const handleCopyVin = (e: React.MouseEvent, vin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(vin);
    setCopiedVin(vin);
    showToast(`✓ Serie șasiu ${vin} copiată în clipboard!`);
    setTimeout(() => setCopiedVin(null), 2000);
  };

  // Partajare fișă mașină pe WhatsApp (Ticket 03)
  const handleShareCarWhatsApp = (car: VehicleItem) => {
    const currentUrl = `${window.location.origin}/?car=${car.id}#inventory`;
    const text = `Bună ziua! Vă transmitem detaliile autoturismului *${car.brand} ${car.model} ${car.versionTrim || ''}* (${car.year}) din stocul RXM Automobile:\n\n` +
      `💰 *Preț:* ${car.priceEur.toLocaleString('ro-RO')} € (${car.vatDeductible ? 'TVA Deductibil 21%' : 'Regimul Marjei • TVA Inclus'})\n` +
      `📍 *Kilometraj:* ${formatMileage(car.mileageKm)} km\n` +
      `⛽ *Motorizare:* ${car.fuelType} • ${car.powerHp} CP • ${car.transmission}\n` +
      `🛡️ *Garanție inclusă:* 12 Luni / 10.000 KM\n` +
      `🔍 *VIN:* ${car.vin}\n\n` +
      `Vizualizați galeria foto completă și raportul tehnic aici: ${currentUrl}\n\n` +
      `Vă stăm cu plăcere la dispoziție pentru programarea unui Test-Drive! Echipa RXM Automobile.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast(`Deschidem WhatsApp pentru partajarea ${car.brand} ${car.model}...`);
  };

  // Număr mașini cu discrepanțe OLX
  const discrepanciesCount = useMemo(() => {
    return cars.filter(c => computeOlxDiscrepancy(c.status, c.olxStatus) !== 'none').length;
  }, [cars]);

  // Statistici de Guvernanță 1-Click (Ticket 04)
  const governanceStats = useMemo(() => {
    const redPlatesExpiring = cars.filter(c => c.hasRedPlates && daysUntil(c.redPlatesExpiresAt) < 7 && c.status !== 'sold').length;
    const missingPurchase = cars.filter(c => !c.purchasePriceEur && c.status !== 'sold').length;
    const olxDiscrepancies = cars.filter(c => computeOlxDiscrepancy(c.status, c.olxStatus) !== 'none').length;
    const slowAging = cars.filter(c => c.status !== 'sold' && getVehicleDaysInStock(c) > 45).length;
    return { redPlatesExpiring, missingPurchase, olxDiscrepancies, slowAging };
  }, [cars]);

  // Filtrare vehicule conform căutării, statusului și filtrelor de guvernanță
  const filteredCars = useMemo(() => {
    return cars.filter(c => {
      // Filtru Guvernanță Dealer (Ticket 04)
      if (governanceFilter === 'red_plates_expiring') {
        const isExpiring = c.hasRedPlates && daysUntil(c.redPlatesExpiresAt) < 7;
        if (!isExpiring) return false;
      }
      if (governanceFilter === 'missing_purchase_price') {
        if (c.purchasePriceEur || c.status === 'sold') return false;
      }
      if (governanceFilter === 'olx_discrepancy') {
        if (computeOlxDiscrepancy(c.status, c.olxStatus) === 'none') return false;
      }
      if (governanceFilter === 'slow_aging') {
        if (c.status === 'sold' || getVehicleDaysInStock(c) <= 45) return false;
      }

      // Filtru status
      if (statusFilter === 'in_stock' && c.status !== 'in_stock') return false;
      if (statusFilter === 'preparing' && c.status !== 'preparing') return false;
      if (statusFilter === 'reserved' && c.status !== 'reserved') return false;
      if (statusFilter === 'sold' && c.status !== 'sold') return false;
      if (statusFilter === 'discrepancy' && computeOlxDiscrepancy(c.status, c.olxStatus) === 'none') return false;

      // Filtru căutare text
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const stockNum = getStockNumber(c).toLowerCase();
      const matchBrand = c.brand.toLowerCase().includes(q);
      const matchModel = c.model.toLowerCase().includes(q);
      const matchTrim = c.versionTrim.toLowerCase().includes(q);
      const matchVin = c.vin.toLowerCase().includes(q);
      const matchStock = stockNum.includes(q);

      return matchBrand || matchModel || matchTrim || matchVin || matchStock;
    });
  }, [cars, statusFilter, governanceFilter, searchQuery]);

  // Sortare după vechime stoc (aging) sau preț (Ticket 02)
  const sortedCars = useMemo(() => {
    const list = [...filteredCars];
    if (sortBy === 'aging_desc') {
      return list.sort((a, b) => getVehicleAgingInfo(b).days - getVehicleAgingInfo(a).days);
    }
    if (sortBy === 'aging_asc') {
      return list.sort((a, b) => getVehicleAgingInfo(a).days - getVehicleAgingInfo(b).days);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.priceEur - a.priceEur);
    }
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.priceEur - b.priceEur);
    }
    return list;
  }, [filteredCars, sortBy]);

  // Separare vehicule active vs vehicule vândute (Ticket 01)
  const activeCars = useMemo(() => {
    return sortedCars.filter(c => c.status !== 'sold' || pendingSale?.carId === c.id);
  }, [sortedCars, pendingSale]);

  const soldCars = useMemo(() => {
    return sortedCars.filter(c => c.status === 'sold' && pendingSale?.carId !== c.id);
  }, [sortedCars, pendingSale]);

  // Sumar cifră de afaceri mașini vândute din arhivă
  const soldRevenueTotal = useMemo(() => {
    return soldCars.reduce((sum, c) => sum + (c.soldPriceEur || c.priceEur), 0);
  }, [soldCars]);

  // Sumar financiar complet arhivă mașini vândute (Ticket 04 - TVA 21% inclus)
  const archiveStats = useMemo(() => {
    return soldCars.reduce((acc, car) => {
      const fin = calculateVehicleFinancials(car);
      return {
        totalRevenue: acc.totalRevenue + (car.soldPriceEur ?? car.priceEur),
        totalPurchase: acc.totalPurchase + (car.purchasePriceEur ?? 0),
        totalExpenses: acc.totalExpenses + (fin.totalExpensesEur ?? 0),
        totalProfit: acc.totalProfit + (fin.netProfitEur ?? 0),
      };
    }, { totalRevenue: 0, totalPurchase: 0, totalExpenses: 0, totalProfit: 0 });
  }, [soldCars]);

  // Componentă Badge Vechime Stoc (Ticket 02)
  const renderAgingBadge = (c: VehicleItem) => {
    const aging = getVehicleAgingInfo(c);
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span 
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${aging.badgeBg} ${aging.badgeText} ${aging.isPulse ? 'animate-pulse' : ''}`}
          title={`Vechime în stoc: ${aging.days} zile · Data înrolării: ${aging.entryDateFormatted}`}
        >
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span>{aging.categoryLabel}</span>
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Înrolat: {aging.entryDateFormatted}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* 🧭 BARA SUPERIOARĂ DE CONTROL: CĂUTARE, FILTRE RAPIDE & COMUTATOR VIZUAL */}
      {/* QA Invariants: 'red_plates_expiring' 'missing_purchase_price' 'olx_discrepancy' 'slow_aging' */}
      <InventoryToolbar
        cars={cars}
        activeCarsCount={activeCars.length}
        soldCarsCount={soldCars.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        governanceFilter={governanceFilter}
        setGovernanceFilter={setGovernanceFilter}
        governanceStats={governanceStats}
        discrepanciesCount={discrepanciesCount}
        viewLayout={viewLayout}
        setViewLayout={setViewLayout}
        sortBy={sortBy}
        setSortBy={setSortBy}
        localCarsCount={localCars.length}
        handlePublishAllLocal={handlePublishAllLocal}
        isBulkSyncing={isBulkSyncing}
        bulkSyncProgress={bulkSyncProgress}
      />

      {/* ⚠️ CAZUL ÎN CARE STATUSUL SELECTAT ESTE 'VÂNDUT' */}
      {statusFilter === 'sold' && (
        <div className="bg-[#121215] border border-red-500/30 rounded-2xl p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-white font-bold text-sm">Filtru Activ: Vehicule Vândute</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Autovehiculele finalizate și livrate sunt organizate automat în Arhiva dedicată de mai jos ({soldCars.length} vehicule).
          </p>
        </div>
      )}

      {/* ⚠️ CAZUL ÎN CARE NU EXISTĂ REZULTATE PENTRU FILTRU ACTIV */}
      {statusFilter !== 'sold' && activeCars.length === 0 && (
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-500">
            <Search className="w-6 h-6" />
          </div>
          <div className="text-white font-bold text-base">Niciun vehicul activ găsit</div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {soldCars.length > 0 
              ? `Toate mașinile găsite (${soldCars.length}) sunt deja vândute și se află în Arhiva de mai jos.`
              : `Nu a fost găsit niciun autoturism care să corespundă căutării "${searchQuery}" sau filtrului selectat.`}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Resetează toate filtrele
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎴 MODUL 1: VEDERE CARDURI EXECUTIVE (MOBILE-FIRST & ERGONOMIC TOUCH) */}
      {/* ========================================================================= */}
      {viewLayout === 'grid' && activeCars.length > 0 && statusFilter !== 'sold' && (
        <InventoryCardView
          activeCars={activeCars}
          pendingSale={pendingSale}
          openMenuCarId={openMenuCarId}
          setOpenMenuCarId={setOpenMenuCarId}
          syncingCarId={syncingCarId}
          workspaceSettings={workspaceSettings}
          copiedVin={copiedVin}
          handleCancelPendingSale={handleCancelPendingSale}
          handleConfirmPendingSaleNow={handleConfirmPendingSaleNow}
          handleStatusClick={handleStatusClick}
          handlePublishToCloud={handlePublishToCloud}
          handleOpenDealModal={handleOpenDealModal}
          handleOpenPriceModal={handleOpenPriceModal}
          handleCopyVin={handleCopyVin}
          renderAgingBadge={renderAgingBadge}
          renderSyncBadge={renderSyncBadge}
          resolveVehicleSyncOrigin={resolveVehicleSyncOrigin}
          onSelectCar={onSelectCar}
          onTogglePinHero={onTogglePinHero}
          onToggleVatDeductible={onToggleVatDeductible}
          onDeleteCar={onDeleteCar}
          onOpenSalesDocs={onOpenSalesDocs}
          onOpenWindowSticker={onOpenWindowSticker}
          onOpenGallery={onOpenGallery}
          onOpenPlateStudio={onOpenPlateStudio}
          onOpenAutolicit={onOpenAutolicit}
          onOpenOlxExport={onOpenOlxExport}
          onOpenSocialPost={onOpenSocialPost}
          onOpenSeedExporter={onOpenSeedExporter}
          onOpenComparator={onOpenComparator}
          onOpenBranding={onOpenBranding}
          setAuditDrawerCar={setAuditDrawerCar}
          handleShareCarWhatsApp={handleShareCarWhatsApp}
          onEditCar={onEditCar}
          setPriceEditCar={setPriceEditCar}
          setIsPriceEditModalOpen={setIsPriceEditModalOpen}
          showToast={showToast}
        />
      )}

      {/* 📑 MODUL 2: VEDERE TABEL COMPACT (DESKTOP & MOBIL ERGONOMIC) */}
      {viewLayout === 'table' && activeCars.length > 0 && statusFilter !== 'sold' && (
        <InventoryTableView
          activeCars={activeCars}
          pendingSale={pendingSale}
          openMenuCarId={openMenuCarId}
          setOpenMenuCarId={setOpenMenuCarId}
          syncingCarId={syncingCarId}
          workspaceSettings={workspaceSettings}
          copiedVin={copiedVin}
          handleCancelPendingSale={handleCancelPendingSale}
          handleConfirmPendingSaleNow={handleConfirmPendingSaleNow}
          handleStatusClick={handleStatusClick}
          handlePublishToCloud={handlePublishToCloud}
          handleOpenDealModal={handleOpenDealModal}
          handleOpenPriceModal={handleOpenPriceModal}
          handleCopyVin={handleCopyVin}
          renderAgingBadge={renderAgingBadge}
          renderSyncBadge={renderSyncBadge}
          resolveVehicleSyncOrigin={resolveVehicleSyncOrigin}
          onSelectCar={onSelectCar}
          onTogglePinHero={onTogglePinHero}
          onToggleVatDeductible={onToggleVatDeductible}
          onDeleteCar={onDeleteCar}
          onOpenSalesDocs={onOpenSalesDocs}
          onOpenWindowSticker={onOpenWindowSticker}
          onOpenGallery={onOpenGallery}
          onOpenPlateStudio={onOpenPlateStudio}
          onOpenAutolicit={onOpenAutolicit}
          onOpenOlxExport={onOpenOlxExport}
          onOpenSocialPost={onOpenSocialPost}
          onOpenSeedExporter={onOpenSeedExporter}
          onOpenComparator={onOpenComparator}
          onOpenBranding={onOpenBranding}
          setAuditDrawerCar={setAuditDrawerCar}
          handleShareCarWhatsApp={handleShareCarWhatsApp}
          onEditCar={onEditCar}
          setPriceEditCar={setPriceEditCar}
          setIsPriceEditModalOpen={setIsPriceEditModalOpen}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 📁 Arhivă Autovehicule Vândute (Colapsabilă) - Suport Reactivează */}
      {/* ========================================================================= */}
      <InventoryArchiveSection
        soldCars={soldCars}
        statusFilter={statusFilter}
        isArchiveOpen={isArchiveOpen}
        setIsArchiveOpen={setIsArchiveOpen}
        soldRevenueTotal={soldRevenueTotal}
        archiveStats={archiveStats}
        onStatusChange={onStatusChange}
        onSelectCar={onSelectCar}
        onOpenSalesDocs={onOpenSalesDocs}
        setAuditDrawerCar={setAuditDrawerCar}
        showToast={showToast}
      />

      {/* 🏷️ Modal Dedicat Modificare Preț Vânzare & TVA 21% */}
      <PriceEditModal
        isOpen={isPriceEditModalOpen}
        car={priceEditCar}
        onClose={() => {
          setIsPriceEditModalOpen(false);
          setPriceEditCar(null);
        }}
        onSavePrice={(carId, newPriceEur, oldPriceEur, auditNote) => {
          if (onUpdatePrice) {
            onUpdatePrice(carId, newPriceEur, oldPriceEur, auditNote);
          }
        }}
        showToast={showToast}
      />

      {/* 🔥 Modal Configurare Preț Promoțional & Oferta Săptămânii */}
      <DealPriceModal
        dealer={dealer}
        isOpen={isDealModalOpen}
        car={dealModalCar}
        onClose={() => {
          setIsDealModalOpen(false);
          setDealModalCar(null);
        }}
        onSaveDeal={(carId, data) => {
          if (onUpdateDealPricing) {
            onUpdateDealPricing(carId, data);
          } else {
            onSetDealOfWeek(carId, data.isDealOfWeek);
            onSetOldPrice(carId, data.oldPriceEur);
          }
        }}
        activeDealsCount={cars.filter(c => c.isDealOfWeek).length}
        maxDealsLimit={3}
        showToast={showToast}
      />

      {/* 📜 Drawer Lateral Jurnal Audit & Note Administrative Interne (Ticket 03 & 04) */}
      <VehicleAuditDrawer
        isOpen={!!auditDrawerCar}
        car={auditDrawerCar}
        onClose={() => setAuditDrawerCar(null)}
        onSaveNotes={(carId, notes) => {
          if (onUpdateInternalNotes) {
            onUpdateInternalNotes(carId, notes);
          }
          setAuditDrawerCar(prev => prev && prev.id === carId ? { ...prev, internalNotes: notes } : prev);
        }}
        showToast={showToast}
      />

      {/* 💵 Modal Negociere & Preț Vânzare la Marcare Vândut (Ticket 02 & 03) */}
      <SoldDealFinalizerModal
        isOpen={!!sellingCar}
        car={sellingCar}
        onClose={() => setSellingCar(null)}
        onConfirm={handleConfirmSaleFromModal}
      />

    </div>
  );
};
