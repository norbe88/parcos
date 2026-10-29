/**
 * RXM Automobile / ParcOS — Motor de Agregare Analitică a Vânzărilor (Sales Analytics Engine)
 * Invariantă TVA: Strict 21% (VAT_RATE = 0.21)
 * Powered by CARVANA SRL Intelligence Core
 */

import {
  VehicleItem,
  SalesDimensionMode,
  MileageTier,
  YearGenerationTier,
  SalesSortMode,
  SalesGroupMetric,
  SalesAnalyticsSummary,
} from '../db/types';
import { calculateVehicleFinancials, getVehicleDaysInStock } from './helpers';

/**
 * Returnează categoria de kilometraj și eticheta prietenoasă în limba română
 */
export function getMileageTier(mileageKm: number): { tier: MileageTier; label: string } {
  const km = Number(mileageKm) || 0;
  if (km < 100000) {
    return { tier: 'under_100k', label: '< 100.000 km (Rulaj Scăzut)' };
  }
  if (km < 150000) {
    return { tier: '100k_150k', label: '100.000 – 150.000 km (Optim Piață)' };
  }
  if (km < 200000) {
    return { tier: '150k_200k', label: '150.000 – 200.000 km (Flote / Mediu)' };
  }
  return { tier: 'over_200k', label: '> 200.000 km (Segment Buget)' };
}

/**
 * Returnează categoria de generație / an fabricație
 */
export function getYearGenerationTier(year: number): { tier: YearGenerationTier; label: string } {
  const y = Number(year) || new Date().getFullYear();
  if (y < 2017) {
    return { tier: 'pre_2017', label: 'Înainte de 2017 (Clasa Accesibilă)' };
  }
  if (y <= 2019) {
    return { tier: '2017_2019', label: '2017 – 2019 (Mijloc de Gamă)' };
  }
  if (y <= 2022) {
    return { tier: '2020_2022', label: '2020 – 2022 (Generație Recentă)' };
  }
  return { tier: '2023_plus', label: '2023+ (Aproape Nou)' };
}

/**
 * Calculează numărul de zile necesar pentru vânzarea unei mașini (Days to Sell / Turnaround Time).
 * Diferența dintre data vânzării (soldAt) și data intrării pe stoc (stockEntryDate sau createdAt).
 */
export function getDaysToSell(car: VehicleItem): number {
  if (car.soldAt) {
    const soldTime = new Date(car.soldAt).getTime();
    let startTime: number | null = null;

    if (car.stockEntryDate) {
      try {
        const [y, m, d] = car.stockEntryDate.split('-').map(Number);
        if (y && m && d) {
          startTime = new Date(y, m - 1, d).getTime();
        }
      } catch {
        startTime = null;
      }
    }

    if (!startTime && car.createdAt) {
      const parsedCreated = new Date(car.createdAt).getTime();
      if (!isNaN(parsedCreated)) {
        startTime = parsedCreated;
      }
    }

    if (startTime && !isNaN(startTime) && !isNaN(soldTime)) {
      const diffDays = Math.round((soldTime - startTime) / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    }
  }

  // Fallback determinist dacă nu avem ambele timestamp-uri exacte
  return Math.max(1, getVehicleDaysInStock(car));
}

/**
 * Calculează discountul acordat cumpărătorului la negociere:
 * Preț cerut de listă (priceEur) - Preț efectiv încasat (soldPriceEur)
 */
export function getDiscountGiven(car: VehicleItem): number {
  if (!car.priceEur) return 0;
  const finalPrice = car.soldPriceEur !== undefined && car.soldPriceEur !== null
    ? car.soldPriceEur
    : car.priceEur;
  return Math.max(0, car.priceEur - finalPrice);
}

/**
 * Verifică dacă o mașină se încadrează în intervalul temporal selectat
 */
function isCarInDateRange(
  car: VehicleItem,
  dateRange?: { start?: string | null; end?: string | null }
): boolean {
  if (!dateRange || (!dateRange.start && !dateRange.end)) return true;

  const rawDate = car.soldAt || car.createdAt;
  if (!rawDate) return true; // Dacă nu are dată, o includem ca fallback

  const d = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.trim();
  if (dateRange.start && d < dateRange.start) return false;
  if (dateRange.end && d > dateRange.end) return false;
  return true;
}

/**
 * Extrage cheia și eticheta de grupare pentru o mașină în funcție de modul dimensional selectat
 */
function getGroupDimension(car: VehicleItem, dimension: SalesDimensionMode): { key: string; label: string } {
  switch (dimension) {
    case 'brand_model': {
      const brand = (car.brand || 'Necunoscut').trim();
      const model = (car.model || '').trim();
      const key = `${brand} ${model}`.trim();
      return { key, label: key };
    }
    case 'brand': {
      const brand = (car.brand || 'Necunoscut').trim();
      return { key: brand, label: brand };
    }
    case 'year_generation': {
      const tierInfo = getYearGenerationTier(car.year);
      return { key: tierInfo.tier, label: tierInfo.label };
    }
    case 'mileage_tier': {
      const tierInfo = getMileageTier(car.mileageKm);
      return { key: tierInfo.tier, label: tierInfo.label };
    }
    case 'body_type': {
      const body = (car.bodyType || 'SUV').trim();
      return { key: body, label: body };
    }
    case 'fuel_type': {
      const fuel = (car.fuelType || 'Diesel').trim();
      return { key: fuel, label: fuel };
    }
    default: {
      const key = `${car.brand} ${car.model}`.trim();
      return { key, label: key };
    }
  }
}

/**
 * Sortează grupurile agregate conform criteriului ales
 */
export function sortSalesGroups(groups: SalesGroupMetric[], sortBy: SalesSortMode = 'units_desc'): SalesGroupMetric[] {
  return [...groups].sort((a, b) => {
    switch (sortBy) {
      case 'units_desc':
        return b.unitsSold - a.unitsSold || b.totalSalesVolumeEur - a.totalSalesVolumeEur;
      case 'volume_desc':
        return b.totalSalesVolumeEur - a.totalSalesVolumeEur || b.unitsSold - a.unitsSold;
      case 'profit_desc':
        return b.totalNetProfitEur - a.totalNetProfitEur || b.unitsSold - a.unitsSold;
      case 'margin_desc':
        return b.avgProfitMarginPct - a.avgProfitMarginPct || b.totalNetProfitEur - a.totalNetProfitEur;
      case 'days_asc':
        return a.avgDaysToSell - b.avgDaysToSell || b.unitsSold - a.unitsSold;
      default:
        return b.unitsSold - a.unitsSold;
    }
  });
}

/**
 * Motorul principal de agregare analitică pentru mașinile vândute din parcul auto
 */
export function aggregateSalesData(
  cars: VehicleItem[],
  dimension: SalesDimensionMode = 'brand_model',
  dateRange?: { start?: string | null; end?: string | null },
  sortBy: SalesSortMode = 'units_desc'
): SalesAnalyticsSummary {
  // 1. Filtrăm strict mașinile vândute ('sold') din perioada specificată
  const soldCars = cars.filter(c => c.status === 'sold' && isCarInDateRange(c, dateRange));

  // 2. Grupăm mașinile pe baza dimensiunii alese
  const groupMap = new Map<string, { label: string; cars: VehicleItem[] }>();

  soldCars.forEach(car => {
    const { key, label } = getGroupDimension(car, dimension);
    const existing = groupMap.get(key);
    if (existing) {
      existing.cars.push(car);
    } else {
      groupMap.set(key, { label, cars: [car] });
    }
  });

  // 3. Calculăm metricile pentru fiecare grup
  let totalUnitsSold = 0;
  let totalSalesVolumeEur = 0;
  let totalNetProfitEur = 0;
  let totalInvestedAllEur = 0;
  let totalDaysAll = 0;
  let totalDiscountAllEur = 0;

  const rawGroups: SalesGroupMetric[] = [];

  groupMap.forEach(({ label, cars: groupCars }, dimensionKey) => {
    const unitsSold = groupCars.length;
    let groupVolumeEur = 0;
    let groupProfitEur = 0;
    let groupInvestedEur = 0;
    let groupDaysSum = 0;
    let groupDiscountSum = 0;

    groupCars.forEach(car => {
      const fin = calculateVehicleFinancials(car);
      const effectivePrice = fin.effectiveSalePriceEur;
      const profit = fin.netProfitEur;
      const invested = fin.totalInvestedEur;
      const days = getDaysToSell(car);
      const discount = getDiscountGiven(car);

      groupVolumeEur += effectivePrice;
      groupProfitEur += profit;
      groupInvestedEur += invested;
      groupDaysSum += days;
      groupDiscountSum += discount;

      totalUnitsSold += 1;
      totalSalesVolumeEur += effectivePrice;
      totalNetProfitEur += profit;
      totalInvestedAllEur += invested;
      totalDaysAll += days;
      totalDiscountAllEur += discount;
    });

    const avgSalePriceEur = unitsSold > 0 ? Math.round(groupVolumeEur / unitsSold) : 0;
    const avgProfitMarginPct = groupVolumeEur > 0
      ? Number(((groupProfitEur / groupVolumeEur) * 100).toFixed(1))
      : 0.0;
    const avgRoiPct = groupInvestedEur > 0
      ? Number(((groupProfitEur / groupInvestedEur) * 100).toFixed(1))
      : 0.0;
    const avgDaysToSell = unitsSold > 0 ? Math.round(groupDaysSum / unitsSold) : 1;
    const avgDiscountGivenEur = unitsSold > 0 ? Math.round(groupDiscountSum / unitsSold) : 0;

    rawGroups.push({
      dimensionKey,
      dimensionLabel: label,
      unitsSold,
      totalSalesVolumeEur: groupVolumeEur,
      avgSalePriceEur,
      totalNetProfitEur: groupProfitEur,
      avgProfitMarginPct,
      avgRoiPct,
      avgDaysToSell,
      avgDiscountGivenEur,
      cars: groupCars,
    });
  });

  // 4. Sortăm grupurile
  const groups = sortSalesGroups(rawGroups, sortBy);

  // 5. Calculăm metricile globale de sinteză
  const overallAvgMarginPct = totalSalesVolumeEur > 0
    ? Number(((totalNetProfitEur / totalSalesVolumeEur) * 100).toFixed(1))
    : 0.0;
  const overallAvgRoiPct = totalInvestedAllEur > 0
    ? Number(((totalNetProfitEur / totalInvestedAllEur) * 100).toFixed(1))
    : 0.0;
  const overallAvgDaysToSell = totalUnitsSold > 0 ? Math.round(totalDaysAll / totalUnitsSold) : 0;
  const overallAvgDiscountEur = totalUnitsSold > 0 ? Math.round(totalDiscountAllEur / totalUnitsSold) : 0;

  // 6. Determinăm liderii de performanță (Top Seller, Fastest Moving, Most Profitable)
  let topSellerGroup: SalesGroupMetric | null = null;
  let fastestMovingGroup: SalesGroupMetric | null = null;
  let mostProfitableGroup: SalesGroupMetric | null = null;

  if (groups.length > 0) {
    // Top Seller: cele mai multe unități vândute
    topSellerGroup = [...groups].sort((a, b) => b.unitsSold - a.unitsSold || b.totalSalesVolumeEur - a.totalSalesVolumeEur)[0] || null;

    // Fastest Moving: minim zile de rotație (cel puțin 1 unitate vândută)
    fastestMovingGroup = [...groups].sort((a, b) => a.avgDaysToSell - b.avgDaysToSell || b.unitsSold - a.unitsSold)[0] || null;

    // Most Profitable: cel mai mare profit net total
    mostProfitableGroup = [...groups].sort((a, b) => b.totalNetProfitEur - a.totalNetProfitEur || b.unitsSold - a.unitsSold)[0] || null;
  }

  return {
    dimension,
    totalUnitsSold,
    totalSalesVolumeEur,
    totalNetProfitEur,
    overallAvgMarginPct,
    overallAvgRoiPct,
    overallAvgDaysToSell,
    overallAvgDiscountEur,
    groups,
    topSellerGroup,
    fastestMovingGroup,
    mostProfitableGroup,
  };
}
