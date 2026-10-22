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

interface InventoryTableManagerProps {
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
        img.includes('rxmautomobile.ro')
      )
    );
    if (hasCdnOrVpsImages) return 'cloud';

    return 'local';
  };

  const localCars = useMemo(() => cars.filter(c => resolveVehicleSyncOrigin(c) === 'local'), [cars, seedIds]);

  const handlePublishToCloud = async (car: VehicleItem) => {
    setSyncingCarId(car.id);
    try {
      showToast(`☁️ Se uploadează fotografiile și datele mașinii ${car.brand} ${car.model}...`);
      const cdnImages = await uploadCarImagesBatch(car.id, car.images, 'rxm');
      const carWithCdnImages: VehicleItem = { ...car, images: cdnImages };
      const result = await vehicleRepository.saveVehicle(carWithCdnImages, 'rxm');
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
        const cdnImages = await uploadCarImagesBatch(car.id, car.images, 'rxm');
        const carWithCdnImages: VehicleItem = { ...car, images: cdnImages };
        const result = await vehicleRepository.saveVehicle(carWithCdnImages, 'rxm');
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
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        
        {/* Rândul 1: Titlu, Căutare & Switcher Carduri / Tabel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white">
                Vehicule în Parc ({activeCars.length} active · {soldCars.length} în arhivă)
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
                  <X className="w-3.5 h-3.5" />
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
                  title="Vedere Tabel Compact (Desktop dens)"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
              </div>

              {/* 🎛️ Personalizare Workspace Popover */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] touch-manipulation cursor-pointer ${
                    isWorkspaceMenuOpen
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-[#18181c] border-white/10 hover:border-white/20 text-zinc-300 hover:text-white'
                  }`}
                  title="Personalizare Workspace Carmatik (Densitate, Monedă, Coloane)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Workspace</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-zinc-300">
                    {workspaceSettings.currency}
                  </span>
                </button>

                {isWorkspaceMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#16161a] border border-white/15 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Personalizare Workspace
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWorkspaceMenuOpen(false)}
                        className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Secțiunea 1: Densitate Rânduri */}
                    <div className="py-3 border-b border-white/05">
                      <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                        Densitate Rânduri Tabel
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDensity('compact')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center ${
                            workspaceSettings.density === 'compact'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Compact (Dens)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDensity('comfortable')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center ${
                            workspaceSettings.density === 'comfortable'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Confortabil (Aerisit)
                        </button>
                      </div>
                    </div>

                    {/* Secțiunea 2: Monedă Afișată */}
                    <div className="py-3 border-b border-white/05">
                      <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                        Monedă de Lucru
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrency('EUR')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center flex items-center justify-center gap-1.5 ${
                            workspaceSettings.currency === 'EUR'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>EUR (€)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('RON')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center flex items-center justify-center gap-1.5 ${
                            workspaceSettings.currency === 'RON'
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>RON (lei)</span>
                          <span className="text-[9px] text-zinc-500">4.975</span>
                        </button>
                      </div>
                    </div>

                    {/* Secțiunea 3: Vizibilitate Coloane */}
                    <div className="pt-3">
                      <div className="text-[11px] font-semibold text-zinc-400 mb-2">
                        Coloane Tabel Active
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/03 hover:bg-white/05 cursor-pointer">
                          <span className="text-zinc-300">Specificații & Serie VIN</span>
                          <input
                            type="checkbox"
                            checked={workspaceSettings.visibleColumns.specs}
                            onChange={() => toggleColumn('specs')}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400/20"
                          />
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/03 hover:bg-white/05 cursor-pointer">
                          <span className="text-zinc-300">Preț Vânzare & Marjă</span>
                          <input
                            type="checkbox"
                            checked={workspaceSettings.visibleColumns.pricing}
                            onChange={() => toggleColumn('pricing')}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400/20"
                          />
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/03 hover:bg-white/05 cursor-pointer">
                          <span className="text-zinc-300">Status Showroom</span>
                          <input
                            type="checkbox"
                            checked={workspaceSettings.visibleColumns.status}
                            onChange={() => toggleColumn('status')}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400/20"
                          />
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white/03 hover:bg-white/05 cursor-pointer">
                          <span className="text-zinc-300">Sincronizare OLX</span>
                          <input
                            type="checkbox"
                            checked={workspaceSettings.visibleColumns.olx}
                            onChange={() => toggleColumn('olx')}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400/20"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/05 text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>TVA 21% • Cont de Garanție</span>
                      <span className="text-amber-400/80 font-mono">Standarde Fiscale</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 Banner Sincronizare Mașini Locale în Showroom Netcup */}
        {localCars.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-emerald-500/15 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <CloudOff className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span>Ai {localCars.length} {localCars.length === 1 ? 'mașină salvată' : 'mașini salvate'} doar în acest browser</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">Doar Local</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Aceste mașini nu sunt încă vizibile pentru public în Showroom. Publică-le acum pe serverul Netcup cu un singur click.
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
                  <span>Publică în Showroom ({localCars.length})</span>
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
                ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-sm shadow-amber-500/20'
                : 'bg-amber-500/08 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>În Pregătire ({cars.filter(c => c.status === 'preparing').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
              statusFilter === 'reserved'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10'
                : 'bg-amber-500/05 text-amber-400/80 border-amber-500/20 hover:bg-amber-500/15'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
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
            <span>Vândute ({cars.filter(c => c.status === 'sold').length})</span>
          </button>

          {discrepanciesCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('discrepancy')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 min-h-[36px] touch-manipulation cursor-pointer border flex items-center gap-1.5 ${
                statusFilter === 'discrepancy'
                  ? 'bg-rose-500/25 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-500/20'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {activeCars.map((c) => {
            const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
            const financials = calculateVehicleFinancials(c);
            const stockNum = getStockNumber(c);

            return (
              <div 
                key={c.id}
                className={`relative bg-[#121215] border rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all flex flex-col justify-between group ${
                  pendingSale?.carId === c.id 
                    ? 'border-amber-400 shadow-amber-500/20 ring-2 ring-amber-400/40' 
                    : 'border-white/[0.08] hover:border-amber-400/40'
                }`}
              >
                {/* ⏱ Overlay Perioadă de Grație 10s (Pending Sale & Undo - Ticket 01) */}
                {pendingSale?.carId === c.id && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md rounded-2xl border-2 border-amber-500/80 p-5 flex flex-col justify-center items-center text-center space-y-3.5 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-white font-black text-base flex items-center justify-center gap-1.5 flex-wrap">
                        <span>Marcat ca Vândut</span>
                        {pendingSale.soldPriceEur && (
                          <span className="text-emerald-400 font-mono text-sm font-bold">
                            ({pendingSale.soldPriceEur.toLocaleString('ro-RO')} €)
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-300 text-xs mt-1">
                        Se mută în Arhivă în <span className="font-mono font-black text-amber-400 text-base">{pendingSale.countdown}s</span>
                      </div>
                    </div>
                    {/* Bara de progres pulsantă */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(pendingSale.countdown / 10) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2.5 w-full pt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCancelPendingSale(); }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-md"
                      >
                        ✕ Anulează (Undo)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleConfirmPendingSaleNow(); }}
                        className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all cursor-pointer shadow-md"
                      >
                        Confirmă Acum ➔
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 1. Header Media: Imagine 16:10 + Badge-uri HUD & Preț Neobstrucționat */}
                <div className="relative aspect-[16/10] bg-black/60 rounded-t-2xl overflow-hidden cursor-pointer" onClick={() => onSelectCar(c, 'specs')}>
                  {c.images && c.images.length > 0 ? (
                    <img 
                      src={normalizeCarImageUrl(c.images[0])} 
                      alt={c.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-[#0c0c0e] p-4 text-center">
                      <Clock className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">În Curs de Pregătire</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Fără fotografii · Ascuns din site</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/60" />

                  {/* Badge Stânga Sus: Cod Stoc, Țară & Indicator Foto */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-amber-300 font-mono font-bold text-[11px] shadow-md">
                      #{stockNum}
                    </span>
                    {c.docOriginCountry && (
                      <span className="px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-white font-mono text-[10px] shadow-md">
                        {c.docOriginCountry === 'DE' ? '🇩🇪 DE' : c.docOriginCountry === 'AT' ? '🇦🇹 AT' : c.docOriginCountry === 'FR' ? '🇫🇷 FR' : c.docOriginCountry === 'IT' ? '🇮🇹 IT' : c.docOriginCountry === 'NL' ? '🇳🇱 NL' : c.docOriginCountry === 'BE' ? '🇧🇪 BE' : c.docOriginCountry === 'US' ? '🇺🇸 SUA' : '🇷🇴 RO'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs');
                      }}
                      className={`px-2 py-1 rounded-lg backdrop-blur-md border font-mono text-[10px] shadow-md flex items-center gap-1 transition-all cursor-pointer ${
                        c.images.length === 0
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 hover:bg-amber-500/35 animate-pulse'
                          : 'bg-black/80 hover:bg-black/95 text-zinc-300 hover:text-white border-white/15 hover:border-amber-400'
                      }`}
                      title={c.images.length === 0 ? "Adaugă fotografii pentru această mașină" : "Deschide galeria foto & editorul de plăcuță RXM"}
                    >
                      <Images className="w-3 h-3 text-amber-400" />
                      <span>{c.images.length === 0 ? '+ Adaugă Poze' : `${c.images.length} foto`}</span>
                    </button>
                  </div>

                  {/* Badge-uri Dreapta Sus: Ofertă Săptămânii (Flame) & Pin Hero TikTok (Star) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => handleOpenDealModal(e, c)}
                      className={`min-h-[34px] min-w-[34px] p-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center justify-center touch-manipulation active:scale-90 shadow-md ${
                        c.isDealOfWeek
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-300 shadow-amber-500/40'
                          : 'bg-black/70 text-white/70 hover:text-amber-300 border-white/20 hover:bg-black/90 hover:border-amber-500/40'
                      }`}
                      title={c.isDealOfWeek ? 'Oferta Săptămânii activă (apasă pentru setare prețuri & detalii)' : 'Configurează ca Ofertă a Săptămânii'}
                    >
                      <Flame className={`w-4 h-4 ${c.isDealOfWeek ? 'fill-black text-black' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onTogglePinHero(c.id); }}
                      className={`min-h-[34px] min-w-[34px] p-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center justify-center touch-manipulation active:scale-90 shadow-md ${
                        c.isHeroPinned
                          ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/30'
                          : 'bg-black/70 text-white/70 hover:text-white border-white/20 hover:bg-black/90'
                      }`}
                      title={c.isHeroPinned ? 'Hero Pinned ✓: Fixat în Hero TikTok Reel (apasă pentru eliminare)' : 'Fixează în Hero TikTok Reel'}
                    >
                      <Star className={`w-4 h-4 ${c.isHeroPinned ? 'fill-black text-black' : ''}`} />
                    </button>
                  </div>

                  {/* Alertă Discrepanță OLX (dacă există) */}
                  {discrepancy !== 'none' && (
                    <div className="absolute top-12 left-3 right-3 z-10">
                      <div className="px-2.5 py-1 rounded-lg bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold border border-rose-400 flex items-center gap-1.5 shadow-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{discrepancy === 'sold_but_active_on_olx' ? 'Vândută în parc, dar activă pe OLX!' : 'Dispărută de pe OLX!'}</span>
                      </div>
                    </div>
                  )}

                  {/* Overlay Inferior Foto: Doar Regim Fiscal / TVA + Preț Mare Clar */}
                  <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 flex items-end justify-between gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                    {/* Stânga: TVA 21% / Regim Marjă Toggle + AutoLicit Sync Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleVatDeductible ? onToggleVatDeductible(c.id) : null; }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md ${
                          c.vatDeductible
                            ? 'bg-emerald-500/90 text-black border-emerald-400 shadow-emerald-500/20'
                            : 'bg-black/80 hover:bg-black/95 text-zinc-300 hover:text-white border-white/20'
                        }`}
                        title={c.vatDeductible ? "TVA Deductibil 21% (Apasă pentru Regimul Marjei Art. 312)" : "Regimul Marjei Art. 312 (Apasă pentru TVA Deductibil 21%)"}
                      >
                        <Building2 className={`w-3 h-3 ${c.vatDeductible ? 'text-black' : 'text-zinc-400'}`} />
                        <span>{c.vatDeductible ? 'TVA 21%' : 'Regim Marjă'}</span>
                      </button>

                      {c.autolicitSync?.isSynced && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenAutolicit ? onOpenAutolicit(c) : null; }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md ${
                            c.autolicitSync.mode === 'auction'
                              ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/30'
                              : 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/30'
                          }`}
                          title={c.autolicitSync.mode === 'auction' ? 'Licitație AutoLicit activă' : 'Sincronizat pe AutoLicit'}
                        >
                          <Gavel className="w-3 h-3 text-black" />
                          <span>{c.autolicitSync.mode === 'auction' ? '⚡ Licitație' : '⚡ AutoLicit'}</span>
                        </button>
                      )}

                      {/* ☁️ Cloud Sync Badge & 1-Click Publish (Ticket 05) */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {renderSyncBadge(c)}
                        {resolveVehicleSyncOrigin(c) === 'local' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handlePublishToCloud(c); }}
                            disabled={syncingCarId === c.id}
                            className="text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-md backdrop-blur-md bg-sky-500/80 hover:bg-sky-600 text-white border-sky-400 shadow-sky-500/20 disabled:opacity-50 disabled:cursor-wait"
                            title="Publică vehiculul și fotografiile în Showroom Live pe serverul Netcup"
                          >
                            {syncingCarId === c.id ? (
                              <RefreshCw className="w-3 h-3 text-white animate-spin" />
                            ) : (
                              <Cloud className="w-3 h-3 text-white" />
                            )}
                            <span>{syncingCarId === c.id ? 'Se publică...' : 'Publică în Showroom'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dreapta: Caseta de Preț Mare & Discount */}
                    <div className="shrink-0 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPriceModal(e, c)}
                        className="px-2.5 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 hover:border-amber-400/50 transition-all text-right shadow-xl cursor-pointer group/price block"
                        title="Apasă pentru modificare preț vânzare / TVA 21%"
                      >
                        {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                          <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <span className="text-[10.5px] text-zinc-400 line-through font-mono leading-none">
                              {formatPriceWithCurrency(c.oldPriceEur, workspaceSettings.currency)}
                            </span>
                            <span className="text-[9.5px] font-extrabold text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-1 py-0.2 rounded font-mono">
                              -{formatPriceWithCurrency(c.oldPriceEur - c.priceEur, workspaceSettings.currency)}
                            </span>
                          </div>
                        )}
                        <div className={`font-black font-mono leading-none text-base sm:text-lg flex items-center justify-end gap-1 ${
                          c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur)
                            ? 'text-amber-400 group-hover/price:text-amber-300'
                            : 'text-white group-hover/price:text-amber-400'
                        }`}>
                          <span>{formatPriceWithCurrency(c.priceEur, workspaceSettings.currency)}</span>
                          <Tag className="w-3 h-3 text-zinc-500 group-hover/price:text-amber-400" />
                        </div>
                        {workspaceSettings.currency === 'RON' && (
                          <div className="text-[9.5px] text-zinc-400 font-mono text-right mt-0.5">
                            {c.priceEur.toLocaleString('ro-RO')} €
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Corpul Cardului: Detalii Tehnice, Financiare & Comutator Status Showroom */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  
                  {/* Titlu Mașină, Versiune & Badge Vechime Stoc (Aging) */}
                  <div>
                    <div 
                      onClick={() => onSelectCar(c, 'specs')}
                      className="font-black text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{c.brand} {c.model}</span>
                      <span className="text-xs font-mono font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/05">
                        {c.year}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {c.versionTrim}
                    </div>
                    {/* Badge Vechime Stoc Showroom & Dată Înrolare */}
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      {renderAgingBadge(c)}
                      {c.internalNotes ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAuditDrawerCar(c); }}
                          className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 cursor-pointer italic bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"
                          title={`Notă internă: ${c.internalNotes} (Apasă pentru jurnal audit)`}
                        >
                          <FileText className="w-2.5 h-2.5 text-amber-400" />
                          <span className="truncate max-w-[120px]">{c.internalNotes}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAuditDrawerCar(c); }}
                          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          title="Deschide jurnal audit & note interne"
                        >
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Audit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid Telemetrie: 4 specificații esențiale */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Rulaj Real</span>
                      <strong className="font-mono text-white">{formatMileage(c.mileageKm)}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Motor</span>
                      <strong className="text-white">{c.fuelType}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Putere</span>
                      <strong className="text-white">{c.powerHp} CP</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/05">
                      <span className="text-[10px] text-zinc-400 block">Transmisie</span>
                      <strong className="text-white truncate block">{c.transmission}</strong>
                    </div>
                  </div>

                  {/* Rând Serie Șasiu (VIN) cu Buton Copiere 1-Click */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/06 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-mono text-[10px]">VIN:</span>
                      <span className="font-mono text-zinc-300 font-semibold text-[11px] select-all">
                        {c.vin}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleCopyVin(e, c.vin)}
                      className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copiază seria de șasiu"
                    >
                      {copiedVin === c.vin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Bilanț Financiar & Status OLX */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/05 to-transparent border border-white/05 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Rentabilitate Dealer:</span>
                      {c.purchasePriceEur ? (
                        <button
                          type="button"
                          onClick={() => onSelectCar(c, 'expenses')}
                          className={`font-bold inline-flex items-center gap-1 hover:underline text-xs cursor-pointer ${
                            financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <span>Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} € ({financials.profitMarginPct.toFixed(1)}%)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectCar(c, 'expenses')}
                          className="text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          + Configurează Cost Achiziție
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Sincronizare OLX:</span>
                      {c.olxStatus === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Activ OLX
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Nelinkat</span>
                      )}
                    </div>
                  </div>

                  {/* Comutatorul de Status Showroom pe TOATĂ Lățimea (Zero Coliziune, Touch Ergonomic >= 38px) */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>Status Showroom</span>
                        {renderSyncBadge(c)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {resolveVehicleSyncOrigin(c) === 'local' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishToCloud(c);
                            }}
                            disabled={syncingCarId === c.id}
                            title="Publică vehiculul în Showroom Live pe serverul Netcup"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-300 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {syncingCarId === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Cloud className="w-3 h-3" />
                            )}
                            <span>{syncingCarId === c.id ? 'Se publică...' : 'Publică în Showroom'}</span>
                          </button>
                        )}
                        <span className="text-[10px] text-zinc-500 font-normal">Apasă pentru actualizare</span>
                      </div>
                    </div>
                    <div className="w-full grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'preparing')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'preparing' 
                            ? 'bg-amber-500 text-black shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="În Pregătire (fără poze sau la service, ascunsă din showroom)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'preparing' ? 'bg-black animate-pulse' : 'bg-amber-400'}`} />
                        <span className="truncate">Pregătire</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'in_stock')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'in_stock' 
                            ? 'bg-emerald-500 text-black shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="În Stoc (activă în showroom)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'in_stock' ? 'bg-black animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="truncate">În Stoc</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'reserved')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'reserved' 
                            ? 'bg-amber-600 text-white shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Rezervat (blocată pentru client)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'reserved' ? 'bg-white' : 'bg-amber-400'}`} />
                        <span className="truncate">Rezervat</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleStatusClick(c, 'sold')}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all min-h-[38px] touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 text-center active:scale-[0.98] ${
                          c.status === 'sold' 
                            ? 'bg-red-500 text-white shadow-md font-black' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="Vândut (finalizat, mută în arhivă)"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'sold' ? 'bg-white' : 'bg-red-400'}`} />
                        <span className="truncate">Vândut</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* 3. Centrul de Comandă & Acțiuni Rapide (Zero Squishing, Ergonomie Mobile-First) */}
                <div className="p-3.5 pt-3 border-t border-white/[0.08] mt-2 flex flex-col gap-2 relative">
                  
                  {/* Rândul 1: Fluxurile de Bază Zilnice (3 Butoane Mari, 100% Lățime, min-h-[42px]) */}
                  <div className="flex items-center gap-2">
                    {/* Buton Principal Fișă Tehnică & Specificații */}
                    <button
                      type="button"
                      onClick={() => onSelectCar(c, 'specs')}
                      className="flex-[1.3] min-h-[42px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Deschide fișa tehnică detaliată a mașinii"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Detalii</span>
                    </button>

                    {/* Buton Documente Oficiale & Contracte Vânzare (PDF) */}
                    <button
                      type="button"
                      onClick={() => onOpenSalesDocs(c)}
                      className="flex-1 min-h-[42px] px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] touch-manipulation cursor-pointer whitespace-nowrap shadow-sm"
                      title="Acte Vânzare: Factură Fiscală (TVA 21% / Regim Marjă), Contract Vânzare, PV Predare și Certificat Garanție"
                    >
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Acte PDF</span>
                    </button>

                    {/* Buton Partajare Fişă WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareCarWhatsApp(c)}
                      className="flex-1 min-h-[42px] px-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] touch-manipulation cursor-pointer whitespace-nowrap shadow-sm"
                      title="Trimite fișa mașinii pe WhatsApp către client"
                    >
                      <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Rândul 2: Instrumente Operaționale & Meniu Extins (Grid 4 Coloane Simetric, min-h-[38px]) */}
                  <div className="grid grid-cols-5 gap-1 card-more-menu-container relative">
                    {/* Buton Comparator Preț Piață */}
                    <button
                      type="button"
                      onClick={() => onOpenComparator(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-blue-500/15 text-zinc-300 hover:text-blue-300 border border-white/[0.08] hover:border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Compară prețul cu piața auto din România"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">Piață</span>
                    </button>

                    {/* Buton Studio Editare Foto (Crop, Reordonare, Plăcuță RXM) */}
                    <button
                      type="button"
                      onClick={() => onOpenGallery?.(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-purple-500/15 text-zinc-300 hover:text-purple-300 border border-white/[0.08] hover:border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Studio Foto: decupare (crop), ștergere, reordonare și plăcuță RXM"
                    >
                      <Images className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Foto</span>
                    </button>

                    {/* Buton Fișă Parbriz A4 (QR) */}
                    <button
                      type="button"
                      onClick={() => onOpenWindowSticker(c)}
                      className="min-h-[38px] px-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Printează Fișa A4 de Parbriz cu cod QR pentru showroom"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Parbriz</span>
                    </button>

                    {/* Buton Editare Anunț Complet (Marcă, Km, Versiune, Preț, etc.) */}
                    <button
                      type="button"
                      onClick={() => onEditCar ? onEditCar(c) : null}
                      className="min-h-[38px] px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/25 hover:border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                      title="Editează anunțul: marcă, model, kilometri, versiune, preț, dotări etc."
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Edit</span>
                    </button>

                    {/* Buton Opțiuni Extinse (•••) */}
                    <div className="relative admin-options-menu-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuCarId(openMenuCarId === c.id ? null : c.id);
                        }}
                        className={`w-full min-h-[38px] px-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${
                          openMenuCarId === c.id
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                        }`}
                        title="Alte instrumente și opțiuni operaționale"
                      >
                        <MoreHorizontal className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Opțiuni</span>
                      </button>

                      {/* Popover Meniu Opțiuni (Deschidere deasupra butonului) */}
                      {openMenuCarId === c.id && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full right-0 mb-2 w-56 bg-[#18181c] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] mb-1">
                            Instrumente Vehicul #{stockNum}
                          </div>

                          {/* Editează Anunț Complet (Marcă, Km, Versiune, Preț) */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onEditCar?.(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left border border-amber-500/30 mb-1"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-bold">Editează Anunț</span>
                              <span className="text-[10px] text-amber-200/70 font-normal">Marcă, km, versiune, preț</span>
                            </div>
                          </button>

                          {/* Modifică Preț Vânzare & TVA 21% */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              setPriceEditCar(c);
                              setIsPriceEditModalOpen(true);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Modifică Preț Vânzare</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Ajustare preț listă & TVA 21%</span>
                            </div>
                          </button>

                          {/* Cheltuieli & Profit Net */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onSelectCar(c, 'expenses');
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Cheltuieli & Profit Net</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Registru costuri și marjă</span>
                            </div>
                          </button>

                          {/* Studio Watermark & Branding */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenBranding(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Watermark & Logo Studio</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Aplicate pe pozele mașinii</span>
                            </div>
                          </button>

                          {/* Jurnal Evenimente & Audit */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              setAuditDrawerCar(c);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Jurnal Audit & Evenimente</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Istoric modificări și note</span>
                            </div>
                          </button>

                          {/* Sindicare Pod AutoLicit.ro */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenAutolicit ? onOpenAutolicit(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Sindicare Pod AutoLicit</span>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {c.autolicitSync?.isSynced ? 'Activ / Configurat' : 'Publică la licitație sau stoc'}
                              </span>
                            </div>
                          </button>

                          {/* Export Automat pe OLX */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenOlxExport ? onOpenOlxExport(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/olx"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover/olx:scale-110 transition-transform shrink-0" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Exportă pe OLX</span>
                                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">Auto</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pre-completare 1-click & 8 poze</span>
                            </div>
                          </button>

                          {/* Postare Social Media (Meta FB / IG) */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenSocialPost ? onOpenSocialPost(c) : null;
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/social"
                          >
                            <Share2 className="w-4 h-4 text-pink-400 shrink-0 group-hover/social:scale-110 transition-transform" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Postare Social Media</span>
                                <span className="text-[9px] bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded border border-pink-500/30">FB + IG</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pachet foto HD & descriere generată</span>
                            </div>
                          </button>

                          {/* Divider */}
                          <div className="h-px bg-white/[0.08] my-1" />

                          {/* Arhivează Mașină */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (window.confirm(`Sigur dorești să arhivezi mașina ${c.brand} ${c.model}?`)) {
                                onDeleteCar(c.id);
                                showToast(`Mașina ${c.brand} ${c.model} a fost arhivată.`);
                              }
                            }}
                            className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Arhivează din Stoc</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 MODUL 2: VEDERE TABEL COMPACT (DESKTOP & MOBIL ERGONOMIC) */}
      {/* ========================================================================= */}
      {viewLayout === 'table' && activeCars.length > 0 && statusFilter !== 'sold' && (
        <>
          {/* 💻 VEDERE TABEL DESKTOP (MD+) */}
          <div className="hidden md:block bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          <div className="w-full overflow-x-auto touch-manipulation scrollbar-thin min-h-[280px]">
            <table className="w-full min-w-[1050px] text-left text-xs text-zinc-300">
              <thead className="bg-white/[0.03] border-b border-white/[0.08] text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  {workspaceSettings.visibleColumns.specs && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[26%] min-w-[230px]`}>
                      Vehicul & Specificații
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.pricing && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[15%] min-w-[125px]`}>
                      Preț & Marjă Profit
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.status && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[15%] min-w-[140px]`}>
                      Status Showroom
                    </th>
                  )}
                  {workspaceSettings.visibleColumns.olx && (
                    <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[12%] min-w-[100px]`}>
                      Conexiune OLX
                    </th>
                  )}
                  <th className={`${workspaceSettings.density === 'compact' ? 'py-2 px-3' : 'py-3.5 px-4'} w-[32%] min-w-[360px] text-right sticky right-0 bg-[#16161a] z-10 border-l border-white/10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.6)]`}>
                    Centru Acțiuni Directe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {activeCars.map((c, index) => {
                  const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
                  const financials = calculateVehicleFinancials(c);
                  const stockNum = getStockNumber(c);

                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors group/row ${
                        pendingSale?.carId === c.id 
                          ? 'bg-amber-500/15 border-l-4 border-amber-400' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      
                      {/* Coloana 1: Vehicul, Versiune, Cod Stoc & Specificații Comasate */}
                      {workspaceSettings.visibleColumns.specs && (
                        <td className={workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'}>
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0 group/thumb">
                              {c.images && c.images.length > 0 ? (
                                <img 
                                  src={normalizeCarImageUrl(c.images[0])} 
                                  alt={c.model} 
                                  onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                                  className={`${workspaceSettings.density === 'compact' ? 'w-11 h-8 rounded-lg' : 'w-14 h-10 rounded-xl'} object-cover bg-zinc-800 border border-white/10 group-hover/row:scale-105 transition-transform cursor-pointer shrink-0`} 
                                  title="Deschide galeria foto & editorul de plăcuță RXM"
                                  loading="lazy"
                                />
                              ) : (
                                <div 
                                  onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                                  className={`${workspaceSettings.density === 'compact' ? 'w-11 h-8 rounded-lg' : 'w-14 h-10 rounded-xl'} bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer shrink-0 text-amber-400 group-hover/row:scale-105 transition-transform`}
                                  title="Fără fotografii · Apasă pentru a adăuga poze"
                                >
                                  <Clock className="w-4 h-4 animate-pulse" />
                                </div>
                              )}
                              <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8.5px] font-bold text-zinc-300 pointer-events-none">
                                {c.images.length}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div 
                                onClick={() => onSelectCar(c, 'specs')}
                                className="font-bold text-white text-sm group-hover/row:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 flex-wrap"
                              >
                                <span>{c.brand} {c.model}</span>
                                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded font-bold">
                                  #{stockNum}
                                </span>
                                {renderSyncBadge(c)}
                                <span className="text-zinc-400 font-normal text-xs">• {c.year}</span>
                              </div>
                              <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {c.versionTrim} • {formatMileage(c.mileageKm)} • {c.fuelType} {c.transmission}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-zinc-400">
                                <span>VIN: {c.vin}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyVin(e, c.vin)}
                                  className="text-zinc-500 hover:text-amber-300 p-0.5 cursor-pointer"
                                  title="Copiază serie șasiu"
                                >
                                  {copiedVin === c.vin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              {/* Badge Vechime Stoc Showroom & Dată Înrolare (Ticket 02) */}
                              <div className="mt-1">
                                {renderAgingBadge(c)}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Coloana 2: Preț Vânzare & Marjă Netă */}
                      {workspaceSettings.visibleColumns.pricing && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleOpenPriceModal(e, c)}
                              className="group/tblprice inline-flex items-center gap-1 hover:underline cursor-pointer"
                              title="Modifică prețul de vânzare al mașinii / TVA 21%"
                            >
                              <span className={`font-bold text-sm ${c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur) ? 'text-amber-400 font-mono' : 'text-white group-hover/tblprice:text-amber-400'}`}>
                                {formatPriceWithCurrency(c.priceEur, workspaceSettings.currency)}
                              </span>
                              <Tag className="w-3 h-3 text-zinc-500 group-hover/tblprice:text-amber-400" />
                            </button>
                            {workspaceSettings.currency === 'RON' && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({c.priceEur.toLocaleString('ro-RO')} €)
                              </span>
                            )}
                            {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                              <>
                                <span className="text-[11px] text-zinc-400 line-through font-mono">
                                  {formatPriceWithCurrency(c.oldPriceEur, workspaceSettings.currency)}
                                </span>
                                <span className="text-[9.5px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.5 rounded font-mono">
                                  -{formatPriceWithCurrency(c.oldPriceEur - c.priceEur, workspaceSettings.currency)}
                                </span>
                              </>
                            )}
                          </div>
                          {c.purchasePriceEur ? (
                            <button
                              type="button"
                              onClick={() => onSelectCar(c, 'expenses')}
                              className={`text-[10.5px] font-bold mt-0.5 inline-flex items-center gap-1 hover:underline cursor-pointer ${
                                financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                              title="Deschide registrul de cheltuieli"
                            >
                              <span>Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} € ({financials.profitMarginPct.toFixed(1)}%)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectCar(c, 'expenses')}
                              className="text-[10.5px] text-amber-400/90 hover:text-amber-300 transition-colors mt-0.5 block font-semibold cursor-pointer"
                              title="Adaugă preț achiziție și cheltuieli"
                            >
                              + Calculează Profit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onToggleVatDeductible ? onToggleVatDeductible(c.id) : null}
                            className={`mt-1 px-2 py-0.5 rounded text-[9.5px] font-bold border transition-all inline-flex items-center gap-1 cursor-pointer touch-manipulation active:scale-95 ${
                              c.vatDeductible
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                                : 'bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
                            }`}
                            title={c.vatDeductible ? "Apasă pentru a comuta în Regim Marjă (TVA Nedeductibil)" : "Apasă pentru a activa TVA Deductibil (21%)"}
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{c.vatDeductible ? '✓ TVA Deductibil (21%)' : 'Regim Marjă (Nedeductibil)'}</span>
                          </button>
                        </td>
                      )}

                      {/* Coloana 3: Status Showroom Selector */}
                      {workspaceSettings.visibleColumns.status && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          {pendingSale?.carId === c.id ? (
                            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                              <span className="font-bold text-[10px] font-mono">
                                Vândut {pendingSale.soldPriceEur ? `${pendingSale.soldPriceEur.toLocaleString('ro-RO')} € ` : ''}({pendingSale.countdown}s)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCancelPendingSale(); }}
                                className="px-2 py-0.5 rounded-lg bg-black/70 hover:bg-black text-white text-[9.5px] font-extrabold border border-white/20 transition-all cursor-pointer shadow-sm"
                                title="Anulează marcarea ca vândut"
                              >
                                Undo
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleConfirmPendingSaleNow(); }}
                                className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[9.5px] font-black transition-all cursor-pointer shadow-sm"
                                title="Confirmă acum"
                              >
                                Confirmă
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex rounded-xl border border-white/10 p-0.5 bg-black/50">
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'preparing')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'preparing' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                                title="În Pregătire (fără poze, ascunsă din site)"
                              >
                                Pregătire
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'in_stock')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'in_stock' ? 'bg-emerald-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                În Stoc
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'reserved')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'reserved' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Rezervat
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleStatusClick(c, 'sold')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all min-h-[30px] touch-manipulation cursor-pointer ${
                                  c.status === 'sold' ? 'bg-red-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Vândut
                              </button>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Coloana 4: Conexiune OLX */}
                      {workspaceSettings.visibleColumns.olx && (
                        <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'} whitespace-nowrap`}>
                          {discrepancy === 'sold_but_active_on_olx' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Activ OLX (Vândută!)</span>
                            </span>
                          ) : discrepancy === 'in_stock_but_gone_on_olx' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Inactiv pe OLX</span>
                            </span>
                          ) : c.olxStatus === 'active' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>OLX Activ</span>
                              </span>
                              {c.olxUrl && (
                                <a
                                  href={c.olxUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                  title="Deschide anunțul pe OLX"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Fără Link OLX</span>
                          )}
                        </td>
                      )}

                      {/* Coloana 5: Centru Acțiuni Directe (STICKY RIGHT - Dual-Tier Ergonomic & Zero Scroll) */}
                      <td className={`${workspaceSettings.density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5'} text-right whitespace-nowrap sticky right-0 bg-[#121215] group-hover/row:bg-[#18181d] transition-colors ${openMenuCarId === c.id ? 'z-30' : 'z-10'} border-l border-white/10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.6)]`}>
                        <div className="flex flex-col gap-1.5 items-end justify-center">
                          
                          {/* Rândul 1 (Tier 1): Workflow Principal Tranzacțional & Client (Highlight, Fișă Detalii, Acte PDF, WhatsApp) */}
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Buton Ofertă Săptămânii */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDealModal(e, c)}
                              className={`min-h-[28px] min-w-[28px] p-1 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                                c.isDealOfWeek
                                  ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                                  : 'bg-white/5 text-zinc-400 hover:text-amber-300 border-white/10'
                              }`}
                              title={c.isDealOfWeek ? 'Oferta Săptămânii activă (apasă pentru setare prețuri & detalii)' : 'Configurează ca Ofertă a Săptămânii'}
                            >
                              <Flame className={`w-3.5 h-3.5 ${c.isDealOfWeek ? 'fill-black' : ''}`} />
                            </button>

                            {/* Buton Pin Hero Spotlight */}
                            <button
                              type="button"
                              onClick={() => onTogglePinHero(c.id)}
                              className={`min-h-[28px] min-w-[28px] p-1 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                                c.isHeroPinned
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                                  : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                              }`}
                              title={c.isHeroPinned ? 'Fixat în Hero Spotlight (Apasă pentru anulare)' : 'Fixează în Hero Spotlight (Pin)'}
                            >
                              <Star className={`w-3.5 h-3.5 ${c.isHeroPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                            </button>

                            {/* Buton Principal Detalii (CTA Amber de impact) */}
                            <button 
                              type="button"
                              onClick={() => onSelectCar(c, 'specs')}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                              title="Deschide fișa completă a mașinii"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Detalii</span>
                            </button>

                            {/* Buton Documente Vânzare & Garanție (PDF) */}
                            <button
                              type="button"
                              onClick={() => onOpenSalesDocs(c)}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Acte Vânzare, Garanție & Proces-Verbal (Export PDF / Print)"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>Acte PDF</span>
                            </button>

                            {/* Buton Partajare WhatsApp Stoc */}
                            <button
                              type="button"
                              onClick={() => handleShareCarWhatsApp(c)}
                              className="min-h-[28px] px-2.5 py-0.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                              title="Trimite fișa mașinii pe WhatsApp către client"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                              <span>WA</span>
                            </button>
                          </div>

                          {/* Rândul 2 (Tier 2): Instrumente Operaționale & Meniu Extins (Compară, Foto, Parbriz, Opțiuni •••) */}
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Buton Compară Preț */}
                            <button 
                              type="button"
                              onClick={() => onOpenComparator(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Compară prețul cu piața auto"
                            >
                              <BarChart3 className="w-3 h-3 text-blue-400 shrink-0" />
                              <span>Compară</span>
                            </button>

                            {/* Buton Studio Editare Foto */}
                            <button
                              type="button"
                              onClick={() => onOpenGallery?.(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Studio Editare Foto (Crop, Ștergere, Plăcuță RXM, Rotire)"
                            >
                              <Images className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>Foto</span>
                            </button>

                            {/* Buton Fișă Parbriz A4 (QR Code) */}
                            <button
                              type="button"
                              onClick={() => onOpenWindowSticker(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Fișă Parbriz A4 (QR Code)"
                            >
                              <QrCode className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>Parbriz</span>
                            </button>

                            {/* Buton Editare Anunț */}
                            <button 
                              type="button"
                              onClick={() => onEditCar?.(c)}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer"
                              title="Editează anunțul complet (marcă, km, versiune, preț, etc.)"
                            >
                              <Edit3 className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Edit</span>
                            </button>

                            {/* Buton Opțiuni Extinse (•••) */}
                            <div className="relative admin-options-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuCarId(openMenuCarId === c.id ? null : c.id);
                                }}
                                className={`min-h-[26px] px-2 py-0.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                                  openMenuCarId === c.id
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/20'
                                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
                                }`}
                                title="Alte instrumente și opțiuni operaționale"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
                                <span>Opțiuni</span>
                              </button>

                              {/* Popover Meniu Opțiuni (Deschidere contextuală sus sau jos în funcție de poziția în tabel) */}
                              {openMenuCarId === c.id && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 ${
                                    index < 2 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                  } w-56 bg-[#18181c] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl text-left`}
                                >
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/[0.08] mb-1">
                                    Instrumente Vehicul #{stockNum}
                                  </div>

                                  {/* Editează Anunț Complet */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onEditCar?.(c);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left border border-amber-500/30 mb-1"
                                  >
                                    <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="font-bold">Editează Anunț</span>
                                      <span className="text-[10px] text-amber-200/70 font-normal">Marcă, km, versiune, preț</span>
                                    </div>
                                  </button>

                                  {/* Modifică Preț Vânzare & TVA 21% */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      setPriceEditCar(c);
                                      setIsPriceEditModalOpen(true);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <span>Modifică Preț Vânzare</span>
                                      <span className="text-[10px] text-zinc-400 font-normal">Ajustare preț listă & TVA 21%</span>
                                    </div>
                                  </button>

                                  {/* Cheltuieli & Profit Net */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onSelectCar(c, 'expenses');
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <span>Cheltuieli & Profit Net</span>
                                      <span className="text-[10px] text-zinc-400 font-normal">Registru costuri și marjă</span>
                                    </div>
                                  </button>

                                  {/* Studio Watermark & Branding */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onOpenBranding(c);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <span>Watermark & Logo Studio</span>
                                      <span className="text-[10px] text-zinc-400 font-normal">Aplicate pe pozele mașinii</span>
                                    </div>
                                  </button>

                                  {/* Jurnal Evenimente & Audit */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      setAuditDrawerCar(c);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <span>Jurnal Audit & Evenimente</span>
                                        {((c.auditLog && c.auditLog.length > 0) || c.internalNotes) && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        )}
                                      </div>
                                      <span className="text-[10px] text-zinc-400 font-normal">Istoric modificări și note</span>
                                    </div>
                                  </button>

                                  {/* Sindicare Pod AutoLicit.ro */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onOpenAutolicit ? onOpenAutolicit(c) : null;
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex flex-col">
                                      <span>Sindicare Pod AutoLicit</span>
                                      <span className="text-[10px] text-zinc-400 font-normal">
                                        {c.autolicitSync?.isSynced ? 'Activ / Configurat' : 'Publică la licitație sau stoc'}
                                      </span>
                                    </div>
                                  </button>

                                  {/* Export Automat pe OLX */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onOpenOlxExport ? onOpenOlxExport(c) : null;
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/olx"
                                  >
                                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover/olx:scale-110 transition-transform shrink-0" />
                                    <div className="flex flex-col">
                                      <span className="flex items-center gap-1.5">
                                        <span>Exportă pe OLX</span>
                                        <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">Auto</span>
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-normal">Pre-completare 1-click & 8 poze</span>
                                    </div>
                                  </button>

                                  {/* Postare Social Media (Meta FB / IG) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      onOpenSocialPost ? onOpenSocialPost(c) : null;
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/social"
                                  >
                                    <Share2 className="w-4 h-4 text-pink-400 shrink-0 group-hover/social:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                      <span className="flex items-center gap-1.5">
                                        <span>Postare Social Media</span>
                                        <span className="text-[9px] bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded border border-pink-500/30">FB + IG</span>
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-normal">Pachet foto HD & descriere generată</span>
                                    </div>
                                  </button>

                                  {/* ☁️ Publică în Showroom Live pe Serverul Netcup */}
                                  {resolveVehicleSyncOrigin(c) === 'local' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuCarId(null);
                                        handlePublishToCloud(c);
                                      }}
                                      disabled={syncingCarId === c.id}
                                      className="w-full px-2.5 py-1.5 rounded-xl hover:bg-sky-500/10 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left group/cloud"
                                    >
                                      {syncingCarId === c.id ? (
                                        <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 animate-spin" />
                                      ) : (
                                        <Cloud className="w-4 h-4 text-sky-400 shrink-0 group-hover/cloud:scale-110 transition-transform" />
                                      )}
                                      <div className="flex flex-col">
                                        <span className="flex items-center gap-1.5">
                                          <span>Publică în Showroom</span>
                                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">Netcup Live</span>
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-normal">Sincronizează datele și pozele în baza de date</span>
                                      </div>
                                    </button>
                                  )}

                                  {/* Divider */}
                                  <div className="h-px bg-white/[0.08] my-1" />

                                  {/* Arhivează Mașină */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuCarId(null);
                                      if (window.confirm(`Sigur dorești să arhivezi mașina ${c.brand} ${c.model}?`)) {
                                        onDeleteCar(c.id);
                                        showToast(`Mașina ${c.brand} ${c.model} a fost arhivată.`);
                                      }
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span>Arhivează din Stoc</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 VEDERE TABULARĂ COMPACTĂ MOBIL (SUB MD) */}
        <div className="block md:hidden space-y-2.5">
          {activeCars.map((c) => {
            const discrepancy = computeOlxDiscrepancy(c.status, c.olxStatus);
            const financials = calculateVehicleFinancials(c);
            const stockNum = getStockNumber(c);

            return (
              <div 
                key={`mobile-row-${c.id}`}
                className={`relative bg-[#121215] border rounded-2xl p-3 shadow-lg transition-all flex flex-col gap-2.5 group ${
                  pendingSale?.carId === c.id 
                    ? 'border-amber-400 shadow-amber-500/20 ring-2 ring-amber-400/40 bg-amber-500/05' 
                    : 'border-white/[0.08] hover:border-amber-400/30'
                }`}
              >
                {/* ⏱ Overlay Perioadă de Grație 10s (Pending Sale & Undo) */}
                {pendingSale?.carId === c.id && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm rounded-2xl border border-amber-500/80 p-3 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="text-white font-bold text-xs truncate">
                          Marcat Vândut {pendingSale.soldPriceEur ? `${pendingSale.soldPriceEur.toLocaleString('ro-RO')} €` : ''}
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          Finalizare în {pendingSale.countdown}s
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCancelPendingSale()}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer touch-manipulation active:scale-95"
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmPendingSaleNow()}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer touch-manipulation active:scale-95"
                      >
                        Confirmă
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Secțiune Principală: Thumbnail + Denumire + An/Km + Preț */}
                <div className="flex items-start gap-2.5">
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    {c.images && c.images.length > 0 ? (
                      <img 
                        src={normalizeCarImageUrl(c.images[0])} 
                        alt={c.model} 
                        onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                        className="w-16 h-12 rounded-xl object-cover bg-zinc-800 border border-white/10 cursor-pointer shrink-0" 
                        title="Deschide galeria foto"
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        onClick={() => onOpenGallery ? onOpenGallery(c) : onSelectCar(c, 'specs')}
                        className="w-16 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center cursor-pointer shrink-0 text-amber-400"
                      >
                        <Clock className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8.5px] font-bold text-zinc-300 pointer-events-none">
                      {c.images.length}
                    </span>
                  </div>

                  {/* Detalii Autoturism */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div 
                        onClick={() => onSelectCar(c, 'specs')}
                        className="font-bold text-white text-xs truncate cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5"
                      >
                        <span className="truncate">{c.brand} {c.model}</span>
                        <span className="text-[9.5px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1 py-0.2 rounded font-bold shrink-0">
                          #{stockNum}
                        </span>
                      </div>
                      {/* Preț */}
                      <div className="text-right shrink-0">
                        <span className={`font-black text-xs sm:text-sm font-mono ${c.isDealOfWeek || (c.oldPriceEur && c.oldPriceEur > c.priceEur) ? 'text-amber-400' : 'text-white'}`}>
                          {c.priceEur.toLocaleString('ro-RO')} €
                        </span>
                        {c.oldPriceEur && c.oldPriceEur > c.priceEur && (
                          <div className="text-[9px] text-zinc-400 line-through font-mono">
                            {c.oldPriceEur.toLocaleString('ro-RO')} €
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specificații */}
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {c.year} • {formatMileage(c.mileageKm)} • {c.fuelType} • {c.transmission}
                    </div>

                    {/* VIN cu Copiere & Marjă */}
                    <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-zinc-400">
                        <span>VIN: {c.vin.slice(0, 10)}...</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyVin(e, c.vin)}
                          className="text-zinc-500 hover:text-amber-300 p-0.5 cursor-pointer touch-manipulation"
                          title="Copiază VIN"
                        >
                          {copiedVin === c.vin ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {c.purchasePriceEur ? (
                          <button
                            type="button"
                            onClick={() => onSelectCar(c, 'expenses')}
                            className={`text-[9.5px] font-bold hover:underline cursor-pointer ${
                              financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            Marjă: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectCar(c, 'expenses')}
                            className="text-[9.5px] text-amber-400 hover:underline cursor-pointer font-semibold"
                          >
                            + Marjă
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleVatDeductible ? onToggleVatDeductible(c.id) : null}
                          className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border transition-all cursor-pointer ${
                            c.vatDeductible
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.04] text-zinc-400 border-white/10'
                          }`}
                        >
                          {c.vatDeductible ? 'TVA 21%' : 'Marjă'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Rândul de Status Showroom & OLX */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06] flex-wrap">
                  {/* Selector Status */}
                  <div className="inline-flex rounded-xl border border-white/10 p-0.5 bg-black/40">
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'preparing')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'preparing' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pregătire
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'in_stock')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'in_stock' ? 'bg-emerald-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      În Stoc
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'reserved')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'reserved' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Rezervat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusClick(c, 'sold')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all min-h-[28px] touch-manipulation cursor-pointer ${
                        c.status === 'sold' ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Vândut
                    </button>
                  </div>

                  {/* Vechime Stoc & OLX */}
                  <div className="flex items-center gap-1.5">
                    {renderAgingBadge(c)}
                    {discrepancy === 'sold_but_active_on_olx' ? (
                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md">
                        Activ OLX (Vândută!)
                      </span>
                    ) : discrepancy === 'in_stock_but_gone_on_olx' ? (
                      <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-md">
                        Inactiv OLX
                      </span>
                    ) : c.olxStatus === 'active' ? (
                      <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> OLX
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 3. Bară de Acțiuni Ergonomică pentru Mobil */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06]">
                  {/* Toggles rapide (Deal + Pin Hero) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenDealModal(e, c)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                        c.isDealOfWeek
                          ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-amber-300 border-white/10'
                      }`}
                      title={c.isDealOfWeek ? 'Oferta Săptămânii activă' : 'Setează Ofertă a Săptămânii'}
                    >
                      <Flame className={`w-3.5 h-3.5 ${c.isDealOfWeek ? 'fill-black' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onTogglePinHero(c.id)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border transition-all inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer ${
                        c.isHeroPinned
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                      }`}
                      title={c.isHeroPinned ? 'Fixat în Hero Spotlight' : 'Fixează în Hero Spotlight'}
                    >
                      <Star className={`w-3.5 h-3.5 ${c.isHeroPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Acțiuni Primare: Detalii, Acte, WA, Opțiuni ••• */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectCar(c, 'specs')}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                      title="Deschide fișa completă a mașinii"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Detalii</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSalesDocs(c)}
                      className="min-h-[32px] px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 text-xs font-semibold inline-flex items-center gap-1 touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Acte Vânzare & Garanție PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Acte</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareCarWhatsApp(c)}
                      className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/35 inline-flex items-center justify-center touch-manipulation active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Trimite pe WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    </button>

                    {/* Dropdown Meniu Extins (•••) */}
                    <div className="relative admin-options-menu-container">
                      <button
                        type="button"
                        onClick={() => setOpenMenuCarId(openMenuCarId === `m-opt-${c.id}` ? null : `m-opt-${c.id}`)}
                        className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg border inline-flex items-center justify-center touch-manipulation active:scale-95 transition-all cursor-pointer ${
                          openMenuCarId === `m-opt-${c.id}`
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                        }`}
                        title="Mai multe instrumente"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openMenuCarId === `m-opt-${c.id}` && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-2xl bg-[#16161a] border border-white/15 shadow-2xl p-1.5 z-50 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/[0.08]">
                            Instrumente Avansate
                          </div>

                          {/* Compară Preț */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenComparator(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Comparator Preț Piață</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Analiză preț mediu</span>
                            </div>
                          </button>

                          {/* Studio Foto */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (onOpenGallery) onOpenGallery(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Images className="w-4 h-4 text-purple-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Studio Foto & Galerie</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Crop, Plăcuță RXM, Rotire</span>
                            </div>
                          </button>

                          {/* Studio Plăcuțe RXM */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (onOpenPlateStudio) onOpenPlateStudio(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Studio Plăcuțe & Logo</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Aplică numere negre RXM</span>
                            </div>
                          </button>

                          {/* Fișă Parbriz A4 */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenWindowSticker(c);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Fișă Parbriz QR A4</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Flyer prezentare pentru geam</span>
                            </div>
                          </button>

                          {/* Deschide pe OLX */}
                          {c.olxUrl && (
                            <a
                              href={c.olxUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuCarId(null)}
                              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-200 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                              <div className="flex flex-col">
                                <span>Deschide Anunț OLX</span>
                                <span className="text-[10px] text-zinc-400 font-normal">Vezi pagina publică</span>
                              </div>
                            </a>
                          )}

                          {/* Sindicare AutoLicit */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenAutolicit ? onOpenAutolicit(c) : null;
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/10 text-zinc-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Sindicare Pod AutoLicit</span>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {c.autolicitSync?.isSynced ? 'Activ / Configurat' : 'Publică la licitație'}
                              </span>
                            </div>
                          </button>

                          {/* Export Automat pe OLX */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenOlxExport ? onOpenOlxExport(c) : null;
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-blue-500/10 text-zinc-200 hover:text-blue-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span>Exportă pe OLX</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pre-completare 1-click</span>
                            </div>
                          </button>

                          {/* Postare Social Media */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              onOpenSocialPost ? onOpenSocialPost(c) : null;
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-pink-500/10 text-zinc-200 hover:text-pink-300 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Share2 className="w-4 h-4 text-pink-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                <span>Postare Social Media</span>
                                <span className="text-[9px] bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded border border-pink-500/30">FB + IG</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal">Pachet foto & descriere</span>
                            </div>
                          </button>

                          <div className="h-px bg-white/[0.08] my-1" />

                          {/* Arhivează Mașină */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCarId(null);
                              if (window.confirm(`Sigur dorești să arhivezi mașina ${c.brand} ${c.model}?`)) {
                                onDeleteCar(c.id);
                                showToast(`Mașina ${c.brand} ${c.model} a fost arhivată.`);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Arhivează din Stoc</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}

      {/* ========================================================================= */}
      {/* 📁 SECȚIUNEA ARHIVĂ: AUTOVEHICULE VÂNDUTE (COLAPSIBILĂ CU SUMAR FINANCIAR) */}
      {/* ========================================================================= */}
      {(soldCars.length > 0 || statusFilter === 'sold') && (
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
                  Mașini livrate clienților RXM, retrase automat din gestiunea zilnică activă.
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
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>{c.brand} {c.model}</span>
                                    <span className="text-[10px] font-mono text-zinc-400">#{stockNum}</span>
                                    <span className="text-[10px] text-zinc-500">• {c.year}</span>
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono line-clamp-1">
                                    VIN: {c.vin}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Data Vânzării */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono text-[11px] font-bold">
                                {soldDateFormatted}
                              </span>
                            </td>

                            {/* Preț & Profit */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="font-bold font-mono text-white text-xs">
                                {(c.soldPriceEur || c.priceEur).toLocaleString('ro-RO')} €
                              </div>
                              {c.purchasePriceEur ? (
                                <div className={`text-[10px] font-bold ${financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Profit: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                                </div>
                              ) : (
                                <div className="text-[10px] text-zinc-500">
                                  Achiziție nespecificată
                                </div>
                              )}
                            </td>

                            {/* Alertă OLX */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {c.olxStatus === 'active' ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span>Activ OLX</span>
                                  </span>
                                  {c.olxUrl && (
                                    <a
                                      href={c.olxUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] inline-flex items-center gap-1 transition-colors"
                                      title="Mergi direct pe OLX pentru a dezactiva anunțul"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Dezactivează</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-500">
                                  Sincronizat
                                </span>
                              )}
                            </td>

                            {/* Acțiuni */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {/* Buton Reactivează în Stoc */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStatusChange(c.id, 'in_stock');
                                    showToast(`✓ Mașina ${c.brand} ${c.model} a fost reactivată și repusă în stoc!`);
                                  }}
                                  className="min-h-[28px] px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                                  title="Repune această mașină în stoc activ"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                                  <span>Reactivează</span>
                                </button>

                                {/* Buton Jurnal Audit */}
                                <button
                                  type="button"
                                  onClick={() => setAuditDrawerCar(c)}
                                  className="min-h-[28px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                                  title="Jurnal Evenimente & Audit Mașină"
                                >
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Audit</span>
                                </button>

                                {/* Buton Acte Vânzare */}
                                <button
                                  type="button"
                                  onClick={() => onOpenSalesDocs(c)}
                                  className="min-h-[28px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                                  title="Contracte, Garanție & Factură"
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

                {/* 📱 LISTĂ COMPACTĂ ARHIVĂ MOBIL (SUB MD) */}
                <div className="block md:hidden space-y-2.5">
                  {soldCars.map(c => {
                    const financials = calculateVehicleFinancials(c);
                    const stockNum = getStockNumber(c);
                    const soldDateFormatted = c.soldAt 
                      ? new Date(c.soldAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Nedatat';
                    
                    return (
                      <div key={`m-sold-${c.id}`} className="p-3 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-white/15 transition-colors flex flex-col gap-2">
                        <div className="flex items-start gap-2.5">
                          {c.images && c.images.length > 0 ? (
                            <img 
                              src={normalizeCarImageUrl(c.images[0])} 
                              alt={c.model}
                              className="w-14 h-11 rounded-lg object-cover bg-zinc-800 border border-white/10 shrink-0 grayscale opacity-80"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-14 h-11 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-zinc-500">
                              <Car className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div className="font-bold text-white text-xs truncate">
                                {c.brand} {c.model} <span className="font-mono text-zinc-400 text-[10px]">#{stockNum}</span>
                              </div>
                              <div className="font-bold font-mono text-white text-xs shrink-0">
                                {(c.soldPriceEur || c.priceEur).toLocaleString('ro-RO')} €
                              </div>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              Vândut: <span className="text-zinc-300 font-mono font-bold">{soldDateFormatted}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-1 text-[9.5px]">
                              <span className="font-mono text-zinc-500">VIN: {c.vin.slice(0, 10)}...</span>
                              {c.purchasePriceEur ? (
                                <span className={`font-bold font-mono ${financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Profit: {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
                                </span>
                              ) : (
                                <span className="text-zinc-500 italic">Achiziție nespecificată</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Alertă OLX dacă e încă activ */}
                        {c.olxStatus === 'active' && (
                          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-amber-300 text-[10px]">
                            <div className="flex items-center gap-1 font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Anunț activ pe OLX</span>
                            </div>
                            {c.olxUrl && (
                              <a
                                href={c.olxUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Dezactivează</span>
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
      )}

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
