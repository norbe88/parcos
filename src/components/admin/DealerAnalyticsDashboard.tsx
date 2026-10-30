import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Eye, 
  MessageCircle, Phone, Calendar, Printer, ShieldCheck, Sparkles,
  Clock, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, Car,
  Filter, RotateCcw, CalendarDays, RefreshCw, ChevronDown, Check,
  Flame, HelpCircle, Info, SlidersHorizontal, ArrowDownUp,
  Percent, ChevronRight, ExternalLink, ShieldAlert, Tag, Star
} from 'lucide-react';
import { VehicleItem, MarketPriceEvaluation, DealerLeadItem } from '../../db/types';
import { 
  calculateVehicleFinancials, 
  getStockNumber, 
  getVehicleAgingInfo, 
  getVehicleDaysInStock,
  VehicleAgingCategory,
  VehicleAgingInfo
} from '../../utils/helpers';
import { evaluateMarketPrice } from '../../utils/marketPriceEngine';
import { DealPriceModal, DealPricingData } from './DealPriceModal';
import { SalesMatrixReportView } from './analytics/SalesMatrixReportView';
import { TopViewedVehiclesWidget } from './analytics/TopViewedVehiclesWidget';
import { 
  getSavedInteractions, 
  hardResetAllLeadsAndAnalytics,
  fetchSharedLeads,
} from '../../services/leadService';

export type AnalyticsTabMode = 'overview' | 'sales_matrix';
export type TimeframeMode = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';
export type AgingFilterMode = 'all' | 'under_30' | 'mid_31_60' | 'over_60';
export type AgingSortMode = 'aging_desc' | 'aging_asc' | 'capital_desc' | 'price_desc' | 'margin_asc';

interface DealerAnalyticsDashboardProps {
  cars: VehicleItem[];
  onSelectCar?: (car: VehicleItem) => void;
  onTogglePinHero?: (carId: string) => void;
  onSetDealOfWeek?: (carId: string, isDeal: boolean) => void;
  onUpdateDealPricing?: (carId: string, data: DealPricingData) => void;
  showToast?: (msg: string) => void;
}

// Helper pentru formatare prietenoasă dată în limba română (ex: 13 oct. 2026)
function formatDateRo(isoOrYmd?: string | null): string {
  if (!isoOrYmd) return '—';
  try {
    const raw = isoOrYmd.includes('T') ? isoOrYmd.split('T')[0] : isoOrYmd;
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return isoOrYmd;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return isoOrYmd;
  }
}

// Helper verificare încadrare dată în interval [startDate, endDate]
function isDateWithinRange(dateStr?: string | null, startDate?: string | null, endDate?: string | null): boolean {
  if (!dateStr) return false;
  const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

export const DealerAnalyticsDashboard: React.FC<DealerAnalyticsDashboardProps> = ({
  cars,
  onSelectCar,
  onTogglePinHero,
  onSetDealOfWeek,
  onUpdateDealPricing,
  showToast
}) => {
  // Stare filtru perioadă
  const [timeframe, setTimeframe] = useState<TimeframeMode>('30d');

  // Stare Tab Principal: Prezentare Generală vs Matrice Vânzări
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabMode>('overview');

  // Stare filtru & sortare vechime stoc
  const [activeAgingFilter, setActiveAgingFilter] = useState<AgingFilterMode>('all');
  const [agingSortBy, setAgingSortBy] = useState<AgingSortMode>('aging_desc');
  const [showAgingExplanation, setShowAgingExplanation] = useState<boolean>(false);

  // Stare DealPriceModal integrat direct în panoul de analytics
  const [dealModalCar, setDealModalCar] = useState<VehicleItem | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  // Stare mașină selectată pentru focus în panoul de recomandări analitice
  const [selectedAdvisoryCarId, setSelectedAdvisoryCarId] = useState<string | null>(null);

  // Date implicite pentru intervalul personalizat (prima zi a lunii curente -> astăzi)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstOfMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const [customStartDate, setCustomStartDate] = useState<string>(firstOfMonthStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Stare dialog confirmare Hard Reset
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Lead-uri și interacțiuni reale din depozitul local
  const [realLeads, setRealLeads] = useState<DealerLeadItem[]>([]);
  const [realInteractions, setRealInteractions] = useState(() => getSavedInteractions());

  useEffect(() => {
    let cancelled = false;
    const refreshLeads = () => {
      void fetchSharedLeads().then((result) => {
        if (!cancelled) setRealLeads(result.leads);
      });
    };
    refreshLeads();
    const handleInteractionsUpdated = () => setRealInteractions(getSavedInteractions());
    window.addEventListener('rxm_lead_created', refreshLeads);
    window.addEventListener('rxm_interactions_updated', handleInteractionsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('rxm_lead_created', refreshLeads);
      window.removeEventListener('rxm_interactions_updated', handleInteractionsUpdated);
    };
  }, []);

  // Calcul interval efectiv [startDate, endDate] în funcție de modul ales
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (timeframe === 'today') {
      return { start: today, end: today, label: `Astăzi (${formatDateRo(today)})`, daysCount: 1 };
    }

    if (timeframe === '7d') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const start = d7.toISOString().split('T')[0];
      return { start, end: today, label: `Ultimele 7 Zile (${formatDateRo(start)} – ${formatDateRo(today)})`, daysCount: 7 };
    }

    if (timeframe === '30d') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const start = d30.toISOString().split('T')[0];
      return { start, end: today, label: `Ultimele 30 Zile (${formatDateRo(start)} – ${formatDateRo(today)})`, daysCount: 30 };
    }

    if (timeframe === 'month') {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { 
        start, 
        end: today, 
        label: `Luna Curentă (${now.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })})`,
        daysCount: now.getDate()
      };
    }

    if (timeframe === 'year') {
      const currentYear = now.getFullYear();
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      return { start, end, label: `Tot Anul ${currentYear}`, daysCount: 365 };
    }

    if (timeframe === 'all') {
      return { start: null, end: null, label: 'Tot Istoricul Showroom', daysCount: null };
    }

    // Interval Personalizat (custom)
    const validStart = customStartDate || firstOfMonthStr;
    const validEnd = customEndDate || today;
    const dStart = new Date(validStart);
    const dEnd = new Date(validEnd);
    const diffTime = Math.max(0, dEnd.getTime() - dStart.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      start: validStart,
      end: validEnd,
      label: `Perioadă Aleasă: ${formatDateRo(validStart)} – ${formatDateRo(validEnd)}`,
      daysCount: diffDays
    };
  }, [timeframe, customStartDate, customEndDate, todayStr, firstOfMonthStr]);

  // Calcule Financiare Agregate & Filtrare Strictă pe Perioadă
  const metrics = useMemo(() => {
    const inStockCars = cars.filter(c => c.status === 'in_stock');
    const reservedCars = cars.filter(c => c.status === 'reserved');

    // Mașini vândute filtrate în funcție de intervalul de timp selectat
    const soldCarsInPeriod = cars.filter(c => {
      if (c.status !== 'sold') return false;
      // Dacă este selectat tot istoricul ('all')
      if (timeframe === 'all' || (!dateRange.start && !dateRange.end)) return true;
      // Dacă mașina are data vânzării înregistrată (soldAt), o comparăm exact cu intervalul
      if (c.soldAt) {
        return isDateWithinRange(c.soldAt, dateRange.start, dateRange.end);
      }
      // Fallback pentru mașini marcate ca sold fără soldAt:
      // Sunt incluse dacă perioada acoperă activitatea recentă (30d, luna curentă, anul curent)
      if (timeframe === '30d' || timeframe === 'month' || timeframe === 'year') {
        return true;
      }
      return false;
    });

    // Cheltuieli operaționale înregistrate pe parcul auto în această perioadă
    const expensesInPeriod: { car: VehicleItem; amountEur: number; title: string; date: string }[] = [];
    cars.forEach(c => {
      (c.expenses || []).forEach(exp => {
        if (!dateRange.start && !dateRange.end) {
          expensesInPeriod.push({ car: c, amountEur: exp.amountEur, title: exp.title, date: exp.date });
        } else if (isDateWithinRange(exp.date, dateRange.start, dateRange.end)) {
          expensesInPeriod.push({ car: c, amountEur: exp.amountEur, title: exp.title, date: exp.date });
        }
      });
    });
    const totalExpensesInPeriodEur = expensesInPeriod.reduce((acc, e) => acc + e.amountEur, 0);

    // Valoare stoc activ de vânzare (preț catalog al mașinilor disponibile acum)
    const totalActiveStockValueEur = inStockCars.reduce((acc, c) => acc + c.priceEur, 0);

    // Capital total imobilizat în stocul activ (achiziție + toate cheltuielile pe mașinile în stoc)
    const activeCapitalInvestedEur = inStockCars.reduce((acc, c) => {
      const f = calculateVehicleFinancials(c);
      return acc + f.totalInvestedEur;
    }, 0);

    // Volum vânzări realizate în perioada selectată (încasări totale)
    const totalSalesVolumeEur = soldCarsInPeriod.reduce((acc, c) => {
      return acc + (c.soldPriceEur || c.priceEur);
    }, 0);

    // Profit net total încasat din mașinile vândute în perioada selectată
    const totalNetProfitEarnedEur = soldCarsInPeriod.reduce((acc, c) => {
      const f = calculateVehicleFinancials(c);
      return acc + f.netProfitEur;
    }, 0);

    // Marjă medie de profit (%) pe vânzările din perioada selectată
    const avgProfitMarginPct = totalSalesVolumeEur > 0 
      ? Number(((totalNetProfitEarnedEur / totalSalesVolumeEur) * 100).toFixed(1)) 
      : 0.0;

    // ROI mediu (%) - Rentabilitatea capitalului investit în mașinile vândute
    const totalSoldInvestedEur = soldCarsInPeriod.reduce((acc, c) => {
      const f = calculateVehicleFinancials(c);
      return acc + f.totalInvestedEur;
    }, 0);
    const avgRoiPct = totalSoldInvestedEur > 0
      ? Number(((totalNetProfitEarnedEur / totalSoldInvestedEur) * 100).toFixed(1))
      : 0.0;

    // Distribuție reală a vechimii mașinilor în stoc (calculată exact per vehicul)
    const inStockCount = inStockCars.length;
    const under30Count = inStockCars.filter(c => getVehicleAgingInfo(c).category === 'under_30').length;
    const mid30to60Count = inStockCars.filter(c => getVehicleAgingInfo(c).category === 'mid_31_60').length;
    const over60Count = inStockCars.filter(c => getVehicleAgingInfo(c).category === 'over_60').length;

    // Rotația medie a stocului (zile medii reale calculate pentru mașinile din lot)
    const totalAgingDays = inStockCars.reduce((acc, c) => acc + getVehicleAgingInfo(c).days, 0);
    const avgDaysOnMarket = inStockCount > 0 ? Math.round(totalAgingDays / inStockCount) : 21;

    // Top mașini cele mai vizualizate (eliminat legacy mock tiktokViews, aliniat la telemetrie reală)
    const topViewedCars = [...cars].sort((a, b) => {
      const viewsA = a.viewsCount || 0;
      const viewsB = b.viewsCount || 0;
      return viewsB - viewsA;
    }).slice(0, 5);

    // Filtrare Lead-uri REALE în perioada selectată
    const leadsInPeriod = realLeads.filter(l => {
      if (!dateRange.start && !dateRange.end) return true;
      return isDateWithinRange(l.createdAt, dateRange.start, dateRange.end);
    });

    // Filtrare Interacțiuni REALE în perioada selectată
    const interactionsInPeriod = realInteractions.filter(i => {
      if (!dateRange.start && !dateRange.end) return true;
      return isDateWithinRange(i.timestamp, dateRange.start, dateRange.end);
    });

    // Contoare REALE derivate din evenimente și lead-uri
    const whatsappInquiries = interactionsInPeriod.filter(i => i.type === 'whatsapp').length +
      leadsInPeriod.filter(l => l.source === 'whatsapp').length;

    const phoneCallsInitiated = interactionsInPeriod.filter(i => i.type === 'call').length +
      leadsInPeriod.filter(l => l.source === 'phone_call').length;

    const testDriveBookings = interactionsInPeriod.filter(i => i.type === 'testdrive').length +
      leadsInPeriod.filter(l => Boolean(l.scheduledTestDriveAt) || l.status === 'testdrive').length;

    const pdfSheetsPrinted = interactionsInPeriod.filter(i => i.type === 'pdf').length;

    const recordedVisitors = interactionsInPeriod.filter(i => i.type === 'view').length;
    const totalLotViews = cars.reduce((acc, c) => acc + (c.viewsCount || 0), 0);
    const effectiveViews = Math.max(totalLotViews, recordedVisitors);

    // Număr total de contacte / lead-uri
    const totalInteractionsCount = whatsappInquiries + phoneCallsInitiated + testDriveBookings + pdfSheetsPrinted + leadsInPeriod.length;

    const audienceData = {
      uniqueVisitors: effectiveViews > 0 ? effectiveViews : (totalInteractionsCount > 0 ? totalInteractionsCount * 12 : 0),
      totalCatalogSearches: effectiveViews > 0 ? effectiveViews * 3 : (totalInteractionsCount > 0 ? totalInteractionsCount * 45 : 0),
      totalLotViews,
      whatsappInquiries,
      phoneCallsInitiated,
      testDriveBookings,
      pdfSheetsPrinted,
      totalLeadsCount: leadsInPeriod.length,
      totalInteractionsCount,
      isCleanReset: totalInteractionsCount === 0 && realLeads.length === 0
    };

    return {
      inStockCount,
      soldCount: soldCarsInPeriod.length,
      reservedCount: reservedCars.length,
      totalActiveStockValueEur,
      activeCapitalInvestedEur,
      totalSalesVolumeEur,
      totalNetProfitEarnedEur,
      totalExpensesInPeriodEur,
      expensesInPeriodCount: expensesInPeriod.length,
      avgProfitMarginPct,
      avgRoiPct,
      avgDaysOnMarket,
      under30Count,
      mid30to60Count,
      over60Count,
      topViewedCars,
      audienceData
    };
  }, [cars, timeframe, dateRange, realLeads, realInteractions]);

  // Handler executare Hard Reset Lead-uri
  const handleExecuteHardReset = () => {
    hardResetAllLeadsAndAnalytics();
    setRealInteractions([]);
    setIsResetConfirmOpen(false);
    void fetchSharedLeads().then((result) => setRealLeads(result.leads));
  };

  // =========================================================================
  // ⏱️ CALCUL COMPLET AL VECHIMII & DATE FINANCIARE PER MAȘINĂ ÎN STOC
  // =========================================================================
  const inStockAgingItems = useMemo(() => {
    const inStock = cars.filter(c => c.status === 'in_stock');
    return inStock.map(car => {
      const aging = getVehicleAgingInfo(car);
      const financials = calculateVehicleFinancials(car);
      const marketEval = evaluateMarketPrice(car);
      const costBasis = financials.totalInvestedEur; // Achiziție + transport + RAR + service + detailing
      const minSafePrice = costBasis + 300; // Rezervă minimă garantată (+300 €)
      const currentPrice = car.priceEur;
      const currentMargin = financials.netProfitEur;

      // Verificăm dacă prețul poate fi redus în deplină siguranță
      const canDiscountSafely = currentMargin > 300 && currentPrice > minSafePrice;

      // Calcul preț promoțional optim respectând STRICT protecția marjei dealerului
      let suggestedPromoPrice = currentPrice;
      let actionType: 'promo_discount' | 'marketing_focus' | 'deal_of_week' | 'stable' = 'stable';

      if (aging.days >= 35 || aging.category === 'over_60' || marketEval.marketPosition === 'above_market') {
        if (canDiscountSafely) {
          // Reducere optimizată: țintim prețul de vânzare rapidă din piață sau un discount de 350-500 €,
          // dar FĂRĂ a coborî vreodată sub minSafePrice
          const targetCut = Math.min(currentPrice - 350, marketEval.recommendedQuickSalePriceEur || (currentPrice - 500));
          suggestedPromoPrice = Math.max(minSafePrice, Math.round(targetCut / 50) * 50);
          actionType = car.isDealOfWeek ? 'promo_discount' : 'deal_of_week';
        } else {
          // Marjă îngustă: STRICT INTERZISĂ reducerea de preț! Sugerăm marketing video
          actionType = 'marketing_focus';
          suggestedPromoPrice = currentPrice;
        }
      }

      const projectedMargin = suggestedPromoPrice - costBasis;
      const projectedRoiPct = costBasis > 0 ? Number(((projectedMargin / costBasis) * 100).toFixed(1)) : 0;

      return {
        car,
        aging,
        financials,
        marketEval,
        costBasis,
        minSafePrice,
        currentPrice,
        currentMargin,
        canDiscountSafely,
        suggestedPromoPrice,
        projectedMargin,
        projectedRoiPct,
        actionType
      };
    });
  }, [cars]);

  // Filtrare și sortare interactivă a mașinilor din stoc pe baza categoriei de vechime alese
  const filteredAndSortedAgingCars = useMemo(() => {
    let list = inStockAgingItems;
    if (activeAgingFilter === 'under_30') {
      list = list.filter(item => item.aging.category === 'under_30');
    } else if (activeAgingFilter === 'mid_31_60') {
      list = list.filter(item => item.aging.category === 'mid_31_60');
    } else if (activeAgingFilter === 'over_60') {
      list = list.filter(item => item.aging.category === 'over_60');
    }

    return [...list].sort((a, b) => {
      if (agingSortBy === 'aging_desc') return b.aging.days - a.aging.days; // cele mai vechi primele
      if (agingSortBy === 'aging_asc') return a.aging.days - b.aging.days; // cele mai noi primele
      if (agingSortBy === 'capital_desc') return b.financials.totalInvestedEur - a.financials.totalInvestedEur; // cel mai mare capital blocat
      if (agingSortBy === 'price_desc') return b.car.priceEur - a.car.priceEur;
      if (agingSortBy === 'margin_asc') return a.financials.netProfitEur - b.financials.netProfitEur; // marja cea mai mică
      return 0;
    });
  }, [inStockAgingItems, activeAgingFilter, agingSortBy]);

  // Capital total blocat în categoria de vechime activă
  const totalCapitalInActiveFilter = useMemo(() => {
    return filteredAndSortedAgingCars.reduce((acc, item) => acc + item.financials.totalInvestedEur, 0);
  }, [filteredAndSortedAgingCars]);

  // Lista de mașini prioritare pentru recomandări promoționale dealer
  // (cele care stau de mult timp, cele din categoria de risc sau poziționate peste media pieței)
  const promoAdvisoryCandidates = useMemo(() => {
    const list = inStockAgingItems.filter(item => 
      item.aging.days >= 30 || 
      item.aging.category === 'over_60' || 
      item.marketEval.marketPosition === 'above_market' ||
      item.car.isDealOfWeek
    );
    return [...list].sort((a, b) => b.aging.days - a.aging.days);
  }, [inStockAgingItems]);

  const activeDealsCount = useMemo(() => {
    return cars.filter(c => c.isDealOfWeek).length;
  }, [cars]);

  // Deschidere modal Ofertă a Săptămânii / Ajustare Preț
  const handleOpenDealModal = (car: VehicleItem) => {
    setDealModalCar(car);
    setIsDealModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* ========================================================================= */}
      {/* 🧭 ANTET PANOU EXECUTIV & FILTRU PERIOADĂ ALEASĂ                           */}
      {/* ========================================================================= */}
      <div className="bg-[#141418] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Panou Executiv: Bilanț Financiar & Date Analitice Showroom</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              RXM AUTO MOBILE • Colonia Hodaie, Cluj-Napoca • Monitorizare performanță vânzări, marje și lead-uri
            </p>
          </div>

          {/* Badge Informativ Perioadă Activă */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold self-start md:self-auto">
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>{dateRange.label}</span>
            {dateRange.daysCount && (
              <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-200">
                {dateRange.daysCount} zile
              </span>
            )}
          </div>
        </div>

        {/* Comutator Navigație Sub-Taburi: Bilanț General vs Matrice Vânzări */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => setAnalyticsTab('overview')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-2 ${
              analyticsTab === 'overview'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Bilanț General & Vechime Stoc</span>
          </button>

          <button
            type="button"
            onClick={() => setAnalyticsTab('sales_matrix')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-2 ${
              analyticsTab === 'sales_matrix'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matrice Vânzări & Raport Vândute</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              analyticsTab === 'sales_matrix' ? 'bg-black/30 text-black' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {metrics.soldCount} vândute
            </span>
          </button>
        </div>

        {/* Butoane Selector Rapid Perioadă */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 p-1.5 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === 'today' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Astăzi
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('7d')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === '7d' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Ultimele 7 Zile
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('30d')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === '30d' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Ultimele 30 Zile
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === 'month' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Luna Curentă
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('year')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === 'year' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tot Anul 2026
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
              timeframe === 'all' ? 'bg-amber-500 text-black font-bold shadow' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tot Istoricul
          </button>

          <button
            type="button"
            onClick={() => setTimeframe('custom')}
            className={`min-h-[40px] px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
              timeframe === 'custom' ? 'bg-purple-600 text-white font-bold shadow' : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Perioadă Aleasă 📅</span>
          </button>
        </div>

        {/* Panou Configurare Interval Personalizat (Data Început - Data Sfârșit) */}
        {timeframe === 'custom' && (
          <div className="bg-[#18181c] border border-purple-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Selectează perioada exactă de analiză financiară:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">De la:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 min-h-[38px]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Până la:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 min-h-[38px]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomStartDate(firstOfMonthStr);
                  setCustomEndDate(todayStr);
                }}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-[11px] transition-colors"
                title="Resetează la luna curentă"
              >
                Reset Interval
              </button>
            </div>
          </div>
        )}

      </div>

      {analyticsTab === 'sales_matrix' ? (
        <SalesMatrixReportView
          cars={cars}
          dateRange={dateRange}
          onSelectCar={onSelectCar}
          showToast={showToast}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 💰 SECȚIUNEA 1: TABLOU FINANCIAR & PROFITABILITATE PARC                    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Card 1: Valoare Totală Stoc Activ */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Valoare Stoc Activ</span>
                <Car className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {metrics.totalActiveStockValueEur.toLocaleString('ro-RO')} €
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
                <span>{metrics.inStockCount} mașini de vânzare</span>
                <span className="text-blue-400 font-semibold">{metrics.reservedCount} rezervate</span>
              </div>
            </div>

            {/* Card 2: Capital Imobilizat în Stoc */}
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Capital Imobilizat</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                {metrics.activeCapitalInvestedEur.toLocaleString('ro-RO')} €
              </div>
              <span className="text-[11px] text-zinc-500 mt-1">
                Achiziții + Cheltuieli de pregătire stoc
              </span>
            </div>

            {/* Card 3: Volum Vânzări Realizate în Perioadă (Clicabil -> Deschide Matricea) */}
            <div
              onClick={() => setAnalyticsTab('sales_matrix')}
              className="bg-[#121215] hover:bg-[#16161b] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all group touch-manipulation active:scale-[0.99]"
              title="Fă clic pentru a deschide Matricea Detaliată a Vânzărilor pe Categorii"
            >
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span className="group-hover:text-emerald-300 transition-colors">Vânzări în Perioadă</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {metrics.totalSalesVolumeEur.toLocaleString('ro-RO')} €
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
                <span>{metrics.soldCount} vehicule vândute</span>
                <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  {metrics.soldCount > 0 ? 'Deschide Matricea →' : 'Nicio vânzare'}
                </span>
              </div>
            </div>

        {/* Card 4: Profit Net Încasat în Perioadă */}
        <div className="bg-gradient-to-br from-amber-500/15 via-[#16161a] to-[#121215] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-amber-500/5">
          <div className="flex items-center justify-between text-amber-300 text-xs mb-1 font-semibold">
            <span>Profit Net Încasat</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {metrics.totalNetProfitEarnedEur > 0 ? '+' : ''}{metrics.totalNetProfitEarnedEur.toLocaleString('ro-RO')} €
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Marjă: <strong className="text-amber-300">{metrics.avgProfitMarginPct}%</strong></span>
            <span>ROI: <strong className="text-emerald-400">{metrics.avgRoiPct > 0 ? `+${metrics.avgRoiPct}%` : '0%'}</strong></span>
          </div>
        </div>

      </div>

      {/* Indicator Suplimentar: Cheltuieli Service & Pregătire în Perioadă */}
      {metrics.expensesInPeriodCount > 0 && (
        <div className="bg-[#121215] border border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Cheltuieli înregistrate în această perioadă (transport, RAR, service, detailing):
          </span>
          <span className="font-mono font-bold text-white">
            {metrics.totalExpensesInPeriodEur.toLocaleString('ro-RO')} € ({metrics.expensesInPeriodCount} operațiuni)
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏱️ SECȚIUNEA 2: ROTAȚIA STOCULUI & VECHIMEA MAȘINILOR ÎN PARCUL RXM        */}
      {/* ========================================================================= */}
      <div className="bg-[#141418] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-5">
        
        {/* Antet Secțiune & Indicator Rotație Medie */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Vechimea Mașinilor în Parcul RXM & Rotația Capitalului
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Selectează categoria de staționare pentru filtrare instantanee și sortare după vechime sau capital blocat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buton Metodologie Calcul */}
            <button
              type="button"
              onClick={() => setShowAgingExplanation(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[40px] touch-manipulation active:scale-[0.98] ${
                showAgingExplanation 
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Cum se calculează?</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAgingExplanation ? 'rotate-180 text-amber-400' : 'text-zinc-500'}`} />
            </button>

            {/* Badge Indicator Rotație */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Rotație Medie:</span>
              <strong className="text-white font-mono">{metrics.avgDaysOnMarket} zile/mașină</strong>
            </div>
          </div>
        </div>

        {/* Panou Detaliat: Metodologie & Formula de Calcul (Expandabil) */}
        {showAgingExplanation && (
          <div className="bg-[#18181c] border border-amber-500/30 rounded-xl p-4 text-xs space-y-3 animate-in fade-in-50 duration-150">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-zinc-300 leading-relaxed">
                <div className="font-bold text-white text-sm">
                  📐 Formula & Metodologia de Monitorizare a Vechimii în Parcul RXM
                </div>
                <p>
                  Vechimea fiecărui vehicul se calculează transparent în zile calendaristice folosind formula:
                </p>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-amber-300 text-[11px]">
                  Zile în Stoc = Math.floor((Data Curentă - stockEntryDate) / 86.400.000 ms)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/30 border border-emerald-500/25 rounded-lg p-2.5">
                    <span className="font-bold text-emerald-400 block mb-1">🟢 Sub 30 Zile (Proaspăt):</span>
                    Fază optimă de expunere la showroom. Cererea este organică, marja brută este maximă, iar probabilitatea de vânzare la preț de listă depășește 85%.
                  </div>
                  <div className="bg-black/30 border border-amber-500/25 rounded-lg p-2.5">
                    <span className="font-bold text-amber-400 block mb-1">🟡 31 - 60 Zile (Stabilit):</span>
                    Vehiculul necesită atenție comercială. Se recomandă reîmprospătarea conținutului video pe TikTok, actualizarea descrierii sau evidențierea istoricului RAR.
                  </div>
                  <div className="bg-black/30 border border-rose-500/25 rounded-lg p-2.5">
                    <span className="font-bold text-rose-400 block mb-1">🔴 Peste 60 Zile (Risc Ridicat):</span>
                    Capitalul investit riscă să blocheze fluxul de numerar. Sistemul activează automat modulul de <em>Recomandări Promoționale</em> pentru deblocare rapidă.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Carduri Interactive de Filtrare Activă pe Categorii */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Toate în Stoc */}
          <button
            type="button"
            onClick={() => setActiveAgingFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition-all touch-manipulation active:scale-[0.98] min-h-[44px] flex flex-col justify-between ${
              activeAgingFilter === 'all'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                : 'bg-black/30 hover:bg-black/50 border-white/[0.08] text-zinc-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${activeAgingFilter === 'all' ? 'text-amber-300' : 'text-zinc-400'}`}>
                Toate în Stoc
              </span>
              <Car className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono my-1">
              {metrics.inStockCount} mașini
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Lot complet activ</span>
              {activeAgingFilter === 'all' && <span className="text-amber-400 font-bold text-[10px]">● Filtru activ</span>}
            </div>
          </button>

          {/* Card 2: Sub 30 Zile (Proaspăt) */}
          <button
            type="button"
            onClick={() => setActiveAgingFilter('under_30')}
            className={`p-3.5 rounded-xl border text-left transition-all touch-manipulation active:scale-[0.98] min-h-[44px] flex flex-col justify-between ${
              activeAgingFilter === 'under_30'
                ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                : 'bg-black/30 hover:bg-black/50 border-white/[0.08] text-zinc-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${activeAgingFilter === 'under_30' ? 'text-emerald-300' : 'text-emerald-400'}`}>
                Sub 30 Zile
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono my-1">
              {metrics.under30Count} mașini
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span>{metrics.inStockCount > 0 ? Math.round((metrics.under30Count / metrics.inStockCount) * 100) : 0}% din stoc</span>
              {activeAgingFilter === 'under_30' && <span className="text-emerald-400 font-bold text-[10px]">● Filtru activ</span>}
            </div>
          </button>

          {/* Card 3: 31 - 60 Zile (Stabilit) */}
          <button
            type="button"
            onClick={() => setActiveAgingFilter('mid_31_60')}
            className={`p-3.5 rounded-xl border text-left transition-all touch-manipulation active:scale-[0.98] min-h-[44px] flex flex-col justify-between ${
              activeAgingFilter === 'mid_31_60'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                : 'bg-black/30 hover:bg-black/50 border-white/[0.08] text-zinc-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${activeAgingFilter === 'mid_31_60' ? 'text-amber-300' : 'text-amber-400'}`}>
                31 - 60 Zile
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono my-1">
              {metrics.mid30to60Count} mașini
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span>{metrics.inStockCount > 0 ? Math.round((metrics.mid30to60Count / metrics.inStockCount) * 100) : 0}% din stoc</span>
              {activeAgingFilter === 'mid_31_60' && <span className="text-amber-400 font-bold text-[10px]">● Filtru activ</span>}
            </div>
          </button>

          {/* Card 4: Peste 60 Zile (Risc Staționare) */}
          <button
            type="button"
            onClick={() => setActiveAgingFilter('over_60')}
            className={`p-3.5 rounded-xl border text-left transition-all touch-manipulation active:scale-[0.98] min-h-[44px] flex flex-col justify-between ${
              activeAgingFilter === 'over_60'
                ? 'bg-rose-500/20 border-rose-500/70 shadow-lg shadow-rose-500/15 ring-1 ring-rose-500'
                : 'bg-black/30 hover:bg-black/50 border-white/[0.08] text-zinc-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${activeAgingFilter === 'over_60' ? 'text-rose-300' : 'text-rose-400'}`}>
                Peste 60 Zile
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono my-1">
              {metrics.over60Count} mașini
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between">
              <span className={metrics.over60Count > 0 ? 'text-rose-400/90 font-medium' : ''}>
                {metrics.over60Count > 0 ? 'Necesită Promoție' : '0 riscuri'}
              </span>
              {activeAgingFilter === 'over_60' && <span className="text-rose-400 font-bold text-[10px]">● Filtru activ</span>}
            </div>
          </button>

        </div>

        {/* Bară de Instrumente: Sortare & Sumar Capital Blocat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 border border-white/[0.06] rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-400 font-medium">Sortează după:</span>
            <select
              value={agingSortBy}
              onChange={(e) => setAgingSortBy(e.target.value as AgingSortMode)}
              className="bg-[#18181c] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 min-h-[38px]"
            >
              <option value="aging_desc">⏳ Cele mai vechi în stoc (zile descrescător)</option>
              <option value="aging_asc">🆕 Cele mai noi în stoc (zile crescător)</option>
              <option value="capital_desc">💰 Capital blocat (investiție totală descrescător)</option>
              <option value="price_desc">🏷️ Preț vânzare catalog (descrescător)</option>
              <option value="margin_asc">⚠️ Marjă netă curentă (cea mai strânsă prima)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px] self-end sm:self-auto">
            <span>
              Afișate: <strong className="text-white">{filteredAndSortedAgingCars.length}</strong> mașini
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Capital blocat în selecție: <strong className="text-amber-300">{totalCapitalInActiveFilter.toLocaleString('ro-RO')} €</strong>
            </span>
          </div>
        </div>

        {/* Tabel / Listă Vehicule Filtrate pe Vechime */}
        {filteredAndSortedAgingCars.length === 0 ? (
          <div className="bg-black/20 border border-white/[0.05] rounded-xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">Niciun vehicul în această categorie</div>
            <p className="text-xs text-zinc-400">
              Nu există mașini care să corespundă filtrului de vechime selectat ({activeAgingFilter}).
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAndSortedAgingCars.map((item) => {
              const { car, aging, financials } = item;
              return (
                <div
                  key={car.id}
                  className="bg-black/30 hover:bg-black/50 border border-white/[0.06] hover:border-white/15 rounded-xl p-3 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Info Principal & Poză */}
                  <div 
                    onClick={() => onSelectCar?.(car)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img 
                      src={car.images[0]} 
                      alt={car.model} 
                      className="w-16 h-12 rounded-lg object-cover bg-zinc-800 shrink-0 border border-white/10" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors truncate">
                          {car.brand} {car.model}
                        </span>
                        <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                          #{getStockNumber(car)}
                        </span>
                        {car.isDealOfWeek && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3 text-amber-400" />
                            {car.dealBadgeText || 'OFERTA SĂPTĂMÂNII'}
                          </span>
                        )}
                        {car.isHeroPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-purple-400" />
                            Hero TikTok
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                        <span>An: {car.year}</span>
                        <span>•</span>
                        <span>{car.mileageKm.toLocaleString('ro-RO')} km</span>
                        <span>•</span>
                        <span>{car.fuelType}</span>
                        <span>•</span>
                        <span>Intrat în stoc: <strong className="text-zinc-200">{aging.entryDateFormatted}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Indicator Zile în Stoc & Badge Risc */}
                  <div className="flex items-center gap-2 shrink-0 md:px-4 md:border-l md:border-r md:border-white/[0.06]">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-zinc-400">Vechime în parc:</div>
                      <div className="text-lg font-black text-white font-mono">
                        {aging.days} <span className="text-xs text-zinc-400 font-normal">zile</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${aging.badgeBg} ${aging.badgeText}`}>
                      {aging.category === 'over_60' && <AlertTriangle className="w-3 h-3" />}
                      {aging.categoryLabel}
                    </span>
                  </div>

                  {/* Date Financiare & Preț */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-white">
                        {car.priceEur.toLocaleString('ro-RO')} €
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Investit: <strong className="text-zinc-200">{financials.totalInvestedEur.toLocaleString('ro-RO')} €</strong>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Marjă brută: +{financials.netProfitEur.toLocaleString('ro-RO')} €
                      </div>
                    </div>

                    {/* Butoane Acțiuni Rapide 1-Click */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDealModal(car)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all min-h-[38px] touch-manipulation active:scale-[0.98] flex items-center gap-1"
                        title="Configurează Oferta Săptămânii sau discount"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Promo</span>
                      </button>

                      {onTogglePinHero && (
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePinHero(car.id);
                            showToast?.(`⭐ Stare Hero TikTok actualizată pentru #${getStockNumber(car)}`);
                          }}
                          className={`p-2 rounded-lg border text-xs transition-all min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation active:scale-[0.98] ${
                            car.isHeroPinned
                              ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                          title={car.isHeroPinned ? 'Elimină din Hero Spotlight' : 'Fixează în Hero TikTok'}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectCar?.(car)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Deschide fișa completă și cheltuielile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 🎯 SECȚIUNEA 3: CENTRU RECOMANDĂRI ANALITICE DEALER (SMART PROMO ADVISORY)  */}
      {/* ========================================================================= */}
      <div className="bg-[#141418] border border-amber-500/30 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl shadow-amber-500/5">
        
        {/* Antet Recomandări Promo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Recomandări & Sugestii de Promovare Dealer (Smart Advisory)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Benchmark automat cu piața locală din România (OLX / Autovit) • <strong>Garanție strictă de marjă:</strong> zero sugestii în minus
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protecție Marjă Activă: P<sub>min</sub> ≥ Cost + 300 €</span>
          </div>
        </div>

        {/* Lista de Carduri Analitice cu Recomandări */}
        {promoAdvisoryCandidates.length === 0 ? (
          <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Stoc Optimizat: Rotație Rapidă în Tot Parcul</h4>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              Niciun vehicul din parcul RXM nu depășește pragul de risc de 30 de zile și toate prețurile sunt aliniate competitiv cu piața auto din România.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promoAdvisoryCandidates.slice(0, 4).map((item) => {
              const { 
                car, aging, financials, marketEval, costBasis, minSafePrice, 
                currentPrice, currentMargin, canDiscountSafely, suggestedPromoPrice, 
                projectedMargin, projectedRoiPct 
              } = item;

              return (
                <div
                  key={car.id}
                  className="bg-[#18181c] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-4 sm:p-5 transition-all space-y-4"
                >
                  {/* Top Bar: Identitate Vehicul & Zile în Stoc */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={car.images[0]} 
                        alt={car.model} 
                        className="w-14 h-10 rounded-lg object-cover bg-zinc-800 shrink-0 border border-white/10" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {car.brand} {car.model}
                          </span>
                          <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                            #{getStockNumber(car)} • {car.year}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {car.mileageKm.toLocaleString('ro-RO')} km • {car.transmission} • {car.fuelType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${aging.badgeBg} ${aging.badgeText}`}>
                        Staționare: {aging.days} zile ({aging.entryDateFormatted})
                      </span>
                    </div>
                  </div>

                  {/* Grilă Dublă de Analiză: Piața RO vs Situația Financiară a Dealerului */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    
                    {/* Bloc 1: Benchmark Piața România (OLX / Autovit) */}
                    <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>Piața Locală România (OLX & Autovit)</span>
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          marketEval.marketPosition === 'above_market' 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : marketEval.marketPosition === 'below_market'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {marketEval.marketPosition === 'above_market' ? 'Preț Peste Piață' : marketEval.marketPosition === 'below_market' ? 'Sub Media Pieței' : 'Aliniat la Piață'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-xs">
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Minim Piață</span>
                          <span className="text-zinc-300 font-bold">{marketEval.minPriceEur.toLocaleString('ro-RO')} €</span>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Medie Piață RO</span>
                          <span className="text-blue-300 font-bold">{marketEval.avgPriceEur.toLocaleString('ro-RO')} €</span>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Vânzare Rapidă</span>
                          <span className="text-amber-300 font-bold">{marketEval.recommendedQuickSalePriceEur.toLocaleString('ro-RO')} €</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                        {marketEval.executiveSummary}
                      </p>
                    </div>

                    {/* Bloc 2: Situație Financiară & Protecție Marjă Dealer */}
                    <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Situație Financiară RXM & Protecție Marjă</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Preț curent: <strong className="text-white">{currentPrice.toLocaleString('ro-RO')} €</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-xs">
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Cost Bază (Total)</span>
                          <span className="text-zinc-300 font-bold">{costBasis.toLocaleString('ro-RO')} €</span>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Prag Minim Sigur</span>
                          <span className="text-emerald-300 font-bold">{minSafePrice.toLocaleString('ro-RO')} €</span>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          <span className="text-[10px] text-zinc-500 block">Marjă Curentă</span>
                          <span className="text-amber-300 font-bold">+{currentMargin.toLocaleString('ro-RO')} €</span>
                        </div>
                      </div>

                      {/* Diagnostic & Concluzie Siguranță */}
                      {canDiscountSafely ? (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Spațiu de negociere / discount sigur disponibil</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">
                            Puteți promova vehiculul la <strong className="text-white">{suggestedPromoPrice.toLocaleString('ro-RO')} €</strong> (-{currentPrice - suggestedPromoPrice} €), păstrând un profit net garantat de <strong className="text-emerald-300">+{projectedMargin.toLocaleString('ro-RO')} €</strong> (ROI: {projectedRoiPct}%).
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            <span>Protecție Marjă Activă — Preț Fix Recomandat!</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">
                            Costul total investit este de <strong className="text-white">{costBasis.toLocaleString('ro-RO')} €</strong>. O reducere ar eroda marja minimă. Recomandăm promovare Spotlight TikTok sau descriere detaliată a dotărilor fără a scădea prețul.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Butoane de Acțiune Directă 1-Click din Platformă */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Acțiuni recomandate pentru deblocarea a <strong>{costBasis.toLocaleString('ro-RO')} €</strong> capital:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canDiscountSafely && (
                        <button
                          type="button"
                          onClick={() => handleOpenDealModal(car)}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all min-h-[40px] touch-manipulation active:scale-[0.98] shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                        >
                          <Flame className="w-4 h-4 text-black" />
                          <span>Aplică Ofertă Săptămânii ({suggestedPromoPrice.toLocaleString('ro-RO')} €)</span>
                        </button>
                      )}

                      {onTogglePinHero && (
                        <button
                          type="button"
                          onClick={() => {
                            onTogglePinHero(car.id);
                            showToast?.(`⭐ Vehiculul #${getStockNumber(car)} a fost ${car.isHeroPinned ? 'eliminat din' : 'fixat în'} Hero TikTok!`);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] touch-manipulation active:scale-[0.98] flex items-center gap-1.5 border ${
                            car.isHeroPinned
                              ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                          }`}
                        >
                          <Star className="w-4 h-4 text-purple-400" />
                          <span>{car.isHeroPinned ? 'Hero Spotlight Activ' : 'Fixează în Hero TikTok'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDealModal(car)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-colors min-h-[40px] touch-manipulation active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <Tag className="w-4 h-4 text-zinc-400" />
                        <span>Ajustează Preț</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectCar?.(car)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-colors min-h-[40px] touch-manipulation active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <Car className="w-4 h-4 text-zinc-400" />
                        <span>Fișă Tehnică & Cheltuieli</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 👥 SECȚIUNEA 3: AUDIENȚĂ SHOWROOM & TOP MAȘINI VIZUALIZATE                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Modul Top Mașini Vizionate cu Telemetrie Reală & Alerte Conversie */}
        <TopViewedVehiclesWidget
          cars={cars}
          activeTimeframe={timeframe}
          onSelectCar={onSelectCar}
          onOpenDealModal={(car) => {
            setDealModalCar(car);
            setIsDealModalOpen(true);
          }}
          realLeads={realLeads}
          realInteractions={realInteractions}
          showToast={showToast}
        />

        {/* Pâlnia de Conversie & Lead-uri Cumpărători Generate (DATE REALE + RESET LA 0) */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">
                  Conversii & Lead-uri Cumpărători Generate
                </h3>
              </div>

              {/* Buton Hard Reset Contoare */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-all touch-manipulation active:scale-[0.98]"
                  title="Resetează toate lead-urile și interacțiunile la 0"
                >
                  <RotateCcw className="w-3 h-3 text-rose-400" />
                  <span>Reset la 0</span>
                </button>

                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {metrics.audienceData.totalLeadsCount} Lead-uri în perioadă
                </span>
              </div>
            </div>

            {/* Banner Contor Curat dacă e la 0 */}
            {metrics.audienceData.isCleanReset && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Contor Resetat:</strong> Lead-urile încep de la 0. Fiecare click WhatsApp, apel sau test drive le va crește automat.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Chat WhatsApp</span>
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-300 font-mono">
                  {metrics.audienceData.whatsappInquiries}
                </div>
                <span className="text-[10px] text-zinc-500">Conversații inițiate</span>
              </div>

              {/* Apeluri Telefon */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Apeluri Telefonice</span>
                  <Phone className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-amber-300 font-mono">
                  {metrics.audienceData.phoneCallsInitiated}
                </div>
                <span className="text-[10px] text-zinc-500">Apeluri directe inițiate</span>
              </div>

              {/* Test Drive */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Test Drive Programat</span>
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-blue-300 font-mono">
                  {metrics.audienceData.testDriveBookings}
                </div>
                <span className="text-[10px] text-zinc-500">Programări confirmate</span>
              </div>

              {/* Fișe PDF */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Fișe PDF Imprimate</span>
                  <Printer className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-purple-300 font-mono">
                  {metrics.audienceData.pdfSheetsPrinted}
                </div>
                <span className="text-[10px] text-zinc-500">Descărcate sau tipărite</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.05] mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Rata de conversie înregistrată:</span>
            <strong className="text-emerald-400 font-mono font-bold">
              {metrics.audienceData.uniqueVisitors > 0
                ? `~${((metrics.audienceData.totalLeadsCount / metrics.audienceData.uniqueVisitors) * 100).toFixed(1)}%`
                : metrics.audienceData.totalLeadsCount > 0 ? '100%' : '0%'}
            </strong>
          </div>
        </div>

      </div>
    </>
  )}

      {/* Modal Confirmare Hard Reset din Analytics */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Reset contoare locale</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Se golesc interacțiunile și backup-ul din acest browser. Lead-urile comune ale parcului rămân pe server.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleExecuteHardReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Da, Resetează la 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustare Preț / Ofertă Săptămânii din Analytics */}
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
          } else if (onSetDealOfWeek) {
            onSetDealOfWeek(carId, data.isDealOfWeek);
          }
          if (showToast) {
            const carName = dealModalCar ? `${dealModalCar.brand} ${dealModalCar.model}` : `#${carId}`;
            if (data.isDealOfWeek) {
              showToast(`🔥 ${carName} a fost setată ca Ofertă a Săptămânii (${data.priceEur.toLocaleString('ro-RO')} €)!`);
            } else {
              showToast(`✓ Preț actualizat pentru ${carName}: ${data.priceEur.toLocaleString('ro-RO')} €`);
            }
          }
          setIsDealModalOpen(false);
          setDealModalCar(null);
        }}
        activeDealsCount={activeDealsCount}
        showToast={showToast}
      />

    </div>
  );
};
