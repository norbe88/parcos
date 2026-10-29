import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Layers,
  Car,
  Fuel,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Sparkles,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  HelpCircle,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import {
  VehicleItem,
  SalesDimensionMode,
  SalesSortMode,
  SalesGroupMetric,
} from '../../../db/types';
import { aggregateSalesData, getDaysToSell, getDiscountGiven } from '../../../utils/salesAnalyticsEngine';
import {
  calculateVehicleFinancials,
  formatMileage,
  getStockNumber,
  normalizeCarImageUrl,
} from '../../../utils/helpers';
import { exportSalesMatrixToCsv, triggerSalesPrintReport } from '../../../utils/salesReportExporter';

interface SalesMatrixReportViewProps {
  cars: VehicleItem[];
  dateRange: { start?: string | null; end?: string | null; label: string };
  onSelectCar?: (car: VehicleItem) => void;
  showToast?: (msg: string) => void;
}

export const SalesMatrixReportView: React.FC<SalesMatrixReportViewProps> = ({
  cars,
  dateRange,
  onSelectCar,
  showToast,
}) => {
  // Stare dimensiune de grupare
  const [dimension, setDimension] = useState<SalesDimensionMode>('brand_model');

  // Stare sortare tabel
  const [sortBy, setSortBy] = useState<SalesSortMode>('units_desc');

  // Grupuri expandate pentru vizualizarea mașinilor individuale
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Comutare expandare rând
  const toggleRowExpansion = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calcul agregare analitică
  const summary = useMemo(() => {
    return aggregateSalesData(cars, dimension, dateRange, sortBy);
  }, [cars, dimension, dateRange, sortBy]);

  // Cel mai mare număr de unități pentru calculul barelor relative
  const maxUnitsInGroup = useMemo(() => {
    if (summary.groups.length === 0) return 1;
    return Math.max(...summary.groups.map((g) => g.unitsSold), 1);
  }, [summary.groups]);

  // Handler Export CSV
  const handleExportCsv = () => {
    exportSalesMatrixToCsv(summary, dateRange.label);
    showToast?.('📊 Raportul de vânzări a fost descărcat în format CSV Excel.');
  };

  // Handler Tipărire PDF
  const handlePrint = () => {
    triggerSalesPrintReport();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ========================================================================= */}
      {/* 🧭 ANTET MATRICE & COMENZI DIMENSIUNE + EXPORT                             */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Matrice Vânzări & Performanță Stoc</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {summary.totalUnitsSold} vândute
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Analiză dimensională a mașinilor ieșite din stoc în perioada:{' '}
                  <strong className="text-zinc-200 font-medium">{dateRange.label}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Butoane Acțiune Export & Tipărire */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={summary.totalUnitsSold === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
              title="Descarcă raportul compatibil Microsoft Excel cu diacritice românești"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportă Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={summary.totalUnitsSold === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none min-h-[38px]"
              title="Tipărește fișa de sinteză PDF pentru conducere"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Tipărește Raport</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🎛️ BARA DE COMUTARE DIMENSIUNI DE GRUPARE                                */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Grupează Vânzările După:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setDimension('brand_model')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'brand_model'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Marcă & Model</span>
            </button>

            <button
              type="button"
              onClick={() => setDimension('brand')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'brand'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Doar Marcă</span>
            </button>

            <button
              type="button"
              onClick={() => setDimension('mileage_tier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'mileage_tier'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Intervale Kilometraj</span>
            </button>

            <button
              type="button"
              onClick={() => setDimension('year_generation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'year_generation'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Generație / An</span>
            </button>

            <button
              type="button"
              onClick={() => setDimension('body_type')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'body_type'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Caroserie</span>
            </button>

            <button
              type="button"
              onClick={() => setDimension('fuel_type')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] flex items-center gap-1.5 ${
                dimension === 'fuel_type'
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Combustibil</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏆 HERO KPI CARDS: TOP PERFORMANȚE ÎN PERIOADĂ                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Cel mai vândut segment */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top Seller (Volum)</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Unități</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {summary.topSellerGroup ? summary.topSellerGroup.dimensionLabel : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>
              {summary.topSellerGroup ? `${summary.topSellerGroup.unitsSold} unități vândute` : '0 vânzări'}
            </span>
            <span className="text-amber-400 font-semibold">
              {summary.topSellerGroup ? `${summary.topSellerGroup.totalSalesVolumeEur.toLocaleString('ro-RO')} €` : ''}
            </span>
          </div>
        </div>

        {/* Card 2: Rotație rapidă */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cea Mai Rapidă Rotație</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Timp vânzare</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {summary.fastestMovingGroup ? summary.fastestMovingGroup.dimensionLabel : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span className="text-emerald-400 font-bold">
              {summary.fastestMovingGroup ? `Medie: ${summary.fastestMovingGroup.avgDaysToSell} zile` : '—'}
            </span>
            <span className="text-zinc-500">
              {summary.fastestMovingGroup ? `${summary.fastestMovingGroup.unitsSold} unități` : ''}
            </span>
          </div>
        </div>

        {/* Card 3: Cea mai profitabilă nișă */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 text-purple-400 font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cea Mai Profitabilă Nișă</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Profit net</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {summary.mostProfitableGroup ? summary.mostProfitableGroup.dimensionLabel : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span className="text-purple-300 font-bold">
              {summary.mostProfitableGroup ? `+${summary.mostProfitableGroup.totalNetProfitEur.toLocaleString('ro-RO')} €` : '—'}
            </span>
            <span className="text-zinc-400">
              {summary.mostProfitableGroup ? `Marjă: ${summary.mostProfitableGroup.avgProfitMarginPct}%` : ''}
            </span>
          </div>
        </div>

        {/* Card 4: Discount mediu negociat */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Percent className="w-3.5 h-3.5" />
              <span>Negociere & Discount Mediu</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Per mașină</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {summary.overallAvgDiscountEur > 0 ? `${summary.overallAvgDiscountEur.toLocaleString('ro-RO')} €` : '0 € (Preț Fix)'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>Marjă medie parc:</span>
            <span className="text-emerald-400 font-bold">{summary.overallAvgMarginPct}%</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 TABELUL MATRICE PIVOT INTERACTIV                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {/* Antet tabel cu selector sortare */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Raport Detaliat pe Categorii</span>
              <span className="text-zinc-500 text-xs font-normal">
                ({summary.groups.length} categorii distincte)
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Fă clic pe un rând pentru a vedea mașinile individuale din acea categorie.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-amber-400" />
              <span>Sortează:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SalesSortMode)}
              className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="units_desc">Bucăți Vândute (Descrescător)</option>
              <option value="volume_desc">Încasări Totale (€ Descrescător)</option>
              <option value="profit_desc">Profit Net (€ Descrescător)</option>
              <option value="margin_desc">Marjă Profit (% Descrescător)</option>
              <option value="days_asc">Cea Mai Rapidă Rotație (Zile Crescător)</option>
            </select>
          </div>
        </div>

        {/* Corp tabel */}
        {summary.groups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Car className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-white">Nicio vânzare înregistrată în această perioadă</h5>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Nu au fost găsite vehicule cu status <code>sold</code> în intervalul temporal selectat ({dateRange.label}). Alegeți <strong>Tot Istoricul</strong> sau extindeți intervalul de date din antet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Segment / Denumire</th>
                  <th className="py-3 px-3 text-center">Unități</th>
                  <th className="py-3 px-3 text-right">Încasări (€)</th>
                  <th className="py-3 px-3 text-right">Preț Mediu (€)</th>
                  <th className="py-3 px-3 text-center">Zile Stoc</th>
                  <th className="py-3 px-3 text-right">Profit Net (€)</th>
                  <th className="py-3 px-3 text-right">Marjă (%)</th>
                  <th className="py-3 px-3 text-right">Discount Mediu</th>
                  <th className="py-3 px-3 text-center">Acțiune</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {summary.groups.map((group) => {
                  const isExpanded = !!expandedKeys[group.dimensionKey];
                  const relativeBarPct = Math.round((group.unitsSold / maxUnitsInGroup) * 100);

                  return (
                    <React.Fragment key={group.dimensionKey}>
                      {/* Rând Principal Grup */}
                      <tr
                        onClick={() => toggleRowExpansion(group.dimensionKey)}
                        className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          isExpanded ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        {/* Denumire & Bară Vizuală */}
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-zinc-500 hover:text-amber-400 transition-colors"
                              title={isExpanded ? 'Ascunde detalii' : 'Arată detalii mașini'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {group.dimensionLabel}
                            </span>
                          </div>

                          {/* Mini Bară Procentuală sub Nume */}
                          <div className="mt-1.5 ml-6 w-32 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${relativeBarPct}%` }}
                            />
                          </div>
                        </td>

                        {/* Unități */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400">
                          {group.unitsSold}
                        </td>

                        {/* Încasări Totale */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                          {group.totalSalesVolumeEur.toLocaleString('ro-RO')} €
                        </td>

                        {/* Preț Mediu */}
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                          {group.avgSalePriceEur.toLocaleString('ro-RO')} €
                        </td>

                        {/* Zile Medii pe Stoc */}
                        <td className="py-3.5 px-3 text-center font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              group.avgDaysToSell <= 21
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : group.avgDaysToSell <= 45
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {group.avgDaysToSell}z
                          </span>
                        </td>

                        {/* Profit Net */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                          +{group.totalNetProfitEur.toLocaleString('ro-RO')} €
                        </td>

                        {/* Marjă Medie */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span className="text-zinc-200 font-semibold">{group.avgProfitMarginPct}%</span>
                          <span className="text-[10px] text-zinc-500 block">ROI: {group.avgRoiPct}%</span>
                        </td>

                        {/* Discount Mediu */}
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-400">
                          {group.avgDiscountGivenEur > 0 ? (
                            <span className="text-amber-400/90">-{group.avgDiscountGivenEur.toLocaleString('ro-RO')} €</span>
                          ) : (
                            <span className="text-zinc-600">0 €</span>
                          )}
                        </td>

                        {/* Acțiune */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                          >
                            {isExpanded ? 'Ascunde' : `Vezi (${group.unitsSold})`}
                          </button>
                        </td>
                      </tr>

                      {/* ========================================================================= */}
                      {/* 🚗 RÂND DETALII MAȘINI EXPANDATE                                         */}
                      {/* ========================================================================= */}
                      {isExpanded && (
                        <tr className="bg-black/40">
                          <td colSpan={9} className="py-3 px-4 sm:px-8 border-y border-white/[0.04]">
                            <div className="space-y-2">
                              <div className="text-[11px] text-zinc-400 font-semibold flex items-center justify-between">
                                <span>Vehicule incluse în segmentul „{group.dimensionLabel}”:</span>
                                <span className="font-mono text-zinc-500 text-[10px]">
                                  {group.cars.length} înregistrări
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {group.cars.map((car) => {
                                  const financials = calculateVehicleFinancials(car);
                                  const days = getDaysToSell(car);
                                  const discount = getDiscountGiven(car);
                                  const thumb = normalizeCarImageUrl(car.images[0]);
                                  const soldDateFormatted = car.soldAt
                                    ? new Date(car.soldAt).toLocaleDateString('ro-RO', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Înregistrată';

                                  return (
                                    <div
                                      key={car.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectCar?.(car);
                                      }}
                                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={thumb}
                                          alt={car.model}
                                          className="w-12 h-9 rounded-lg object-cover bg-zinc-800 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <div className="font-bold text-white text-xs truncate group-hover:text-amber-300 transition-colors">
                                            {car.brand} {car.model}
                                          </div>
                                          <div className="text-[10px] text-zinc-400 font-mono truncate">
                                            #{getStockNumber(car)} • {car.year} • {formatMileage(car.mileageKm)}
                                          </div>
                                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                            <span>Vândută: {soldDateFormatted}</span>
                                            <span>•</span>
                                            <span className="text-emerald-400/80">{days} zile</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <div className="font-mono font-bold text-xs text-white">
                                          {financials.effectiveSalePriceEur.toLocaleString('ro-RO')} €
                                        </div>
                                        <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                                          +{financials.netProfitEur.toLocaleString('ro-RO')} €
                                        </div>
                                        {discount > 0 && (
                                          <div className="text-[9px] font-mono text-amber-400/80">
                                            Disc: -{discount} €
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Rezumat Invariantă */}
        <div className="p-3 bg-black/60 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-500 font-mono gap-2">
          <div>
            Total Vânzări: <strong className="text-white">{summary.totalSalesVolumeEur.toLocaleString('ro-RO')} €</strong> • Profit Net:{' '}
            <strong className="text-emerald-400">+{summary.totalNetProfitEur.toLocaleString('ro-RO')} €</strong>
          </div>
          <div>Strict 21% TVA inclus • ParcOS Dealer Intelligence Suite</div>
        </div>
      </div>
    </div>
  );
};
