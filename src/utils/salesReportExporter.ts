/**
 * RXM Automobile / ParcOS — Exportator Rapoarte Vânzări (CSV & Tipărire PDF)
 * Invariantă: Strict 21% TVA, UTF-8 cu BOM pentru Microsoft Excel România
 */

import { SalesAnalyticsSummary } from '../db/types';

/**
 * Convertește datele matricei de vânzări într-un fișier CSV compatibil Excel România (cu separator punct și virgulă ';')
 */
export function exportSalesMatrixToCsv(
  summary: SalesAnalyticsSummary,
  timeframeLabel: string,
  dealerName: string = 'RXM AUTOMOBILE SRL'
): void {
  if (!summary || summary.groups.length === 0) {
    alert('Nu există date despre mașini vândute în perioada selectată pentru a fi exportate.');
    return;
  }

  const dimensionNameMap: Record<string, string> = {
    brand_model: 'Marcă și Model',
    brand: 'Marcă',
    mileage_tier: 'Interval Kilometraj',
    year_generation: 'Generație Fabricație (Ani)',
    body_type: 'Tip Caroserie',
    fuel_type: 'Tip Combustibil',
  };

  const dimName = dimensionNameMap[summary.dimension] || summary.dimension;
  const nowStr = new Date().toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // UTF-8 BOM pentru a preveni alterarea diacriticelor în Excel pe Windows
  let csvContent = '\uFEFF';

  // Antet Raport
  csvContent += `RAPORT ANALITIC VÂNZĂRI ȘI PERFORMANȚĂ STOC - ${dealerName}\n`;
  csvContent += `Perioadă Analizată:;${timeframeLabel}\n`;
  csvContent += `Criteriu Dimensiune:;${dimName}\n`;
  csvContent += `Data Generării:;${nowStr}\n`;
  csvContent += `Total Mașini Vândute:;${summary.totalUnitsSold} unități\n`;
  csvContent += `Volum Total Vânzări:;${summary.totalSalesVolumeEur} €\n`;
  csvContent += `Profit Net Încasat:;${summary.totalNetProfitEur} €\n`;
  csvContent += `Marjă Medie Realizată:;${summary.overallAvgMarginPct}%\n`;
  csvContent += `Viteză Medie Rotație Stoc:;${summary.overallAvgDaysToSell} zile\n`;
  csvContent += `\n`;

  // Cap de tabel
  const headers = [
    'Segment / Denumire',
    'Bucăți Vândute',
    'Volum Încasări (EUR)',
    'Preț Mediu Vânzare (EUR)',
    'Zile Medii pe Stoc',
    'Profit Net (EUR)',
    'Marjă Medie (%)',
    'ROI Mediu (%)',
    'Discount Mediu Negociat (EUR)',
  ];
  csvContent += headers.join(';') + '\n';

  // Rânduri tabelare
  summary.groups.forEach((group) => {
    const row = [
      `"${group.dimensionLabel.replace(/"/g, '""')}"`,
      group.unitsSold,
      group.totalSalesVolumeEur,
      group.avgSalePriceEur,
      group.avgDaysToSell,
      group.totalNetProfitEur,
      `${group.avgProfitMarginPct}%`,
      `${group.avgRoiPct}%`,
      group.avgDiscountGivenEur,
    ];
    csvContent += row.join(';') + '\n';
  });

  // Footer cu Invariante
  csvContent += `\n`;
  csvContent += `Notă:;Calculele reflectă cota strictă de 21% TVA (VAT_RATE = 0.21). Sumele sunt exprimate în Euro (EUR).\n`;
  csvContent += `Generat de:;ParcOS Dealer Intelligence Suite\n`;

  // Descărcare automată în browser
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDate = new Date().toISOString().split('T')[0];
  const safeDim = summary.dimension.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Raport_Vanzari_${safeDim}_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Declanșează fereastra de tipărire din browser pentru raportul de conducere
 */
export function triggerSalesPrintReport(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
