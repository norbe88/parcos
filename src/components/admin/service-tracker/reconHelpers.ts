import { VehicleItem, VehicleReconStatus, VehicleAuditEntry } from '../../../db/types';

/**
 * Invariante Financiare & Operaționale CARVANA SRL / ParcOS 2026
 * - Strict 21% TVA (VAT_RATE = 0.21)
 * - Holding Cost Calculator: 35 € / zi (RapidRecon benchmark)
 * - Alertă Roșie Depășire: > 5 zile în atelier / pregătire
 */
export const VAT_RATE = 0.21;
export const HOLDING_COST_PER_DAY_EUR = 35;
export const HOLDING_COST_ALERT_DAYS = 5;

export interface ReconColumnDef {
  id: VehicleReconStatus;
  title: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const RECON_COLUMNS: ReconColumnDef[] = [
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

/**
 * Calculează numărul de zile în care autovehiculul se află în stadiul curent.
 */
export function getCarDaysInStage(car: VehicleItem): number {
  const referenceDateStr = car.reconStatusChangedAt || car.stockEntryDate || car.createdAt;
  if (!referenceDateStr) return 1;

  const refTime = new Date(referenceDateStr).getTime();
  if (isNaN(refTime)) return 1;

  const now = Date.now();
  const diffDays = Math.floor((now - refTime) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Calculează Holding Cost-ul de oportunitate (depreciere + capital blocat @ 35 €/zi)
 * Activează indicatorul de alertă roșie dacă stă mai mult de 5 zile în pregătire.
 */
export function getCarHoldingCostMetrics(car: VehicleItem): {
  daysInPrep: number;
  costEur: number;
  isOverdue: boolean;
} {
  const daysInPrep = getCarDaysInStage(car);
  const isReady = car.reconStatus === 'ready_for_sale';
  
  if (isReady) {
    return {
      daysInPrep,
      costEur: 0,
      isOverdue: false
    };
  }

  const costEur = daysInPrep * HOLDING_COST_PER_DAY_EUR;
  const isOverdue = daysInPrep > HOLDING_COST_ALERT_DAYS;

  return {
    daysInPrep,
    costEur,
    isOverdue
  };
}

/**
 * Generează o intrare formală de audit la tranziția de status în pipeline-ul Recon.
 */
export function createReconStatusAuditEntry(
  fromStatus: VehicleReconStatus | undefined,
  toStatus: VehicleReconStatus,
  author = 'Mecanic / Operator Atelier'
): VehicleAuditEntry {
  const fromTitle = RECON_COLUMNS.find(c => c.id === fromStatus)?.title || 'Necunoscut';
  const toTitle = RECON_COLUMNS.find(c => c.id === toStatus)?.title || toStatus;

  return {
    id: `aud_recon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    action: 'recon_status_changed',
    author,
    title: `Tranziție Stadiu Recon: ${toTitle}`,
    details: `Autovehiculul a fost mutat din [${fromTitle}] în [${toTitle}]`,
    oldValue: fromStatus || '',
    newValue: toStatus
  };
}

/**
 * Calculează TVA-ul deductibil de 21% pentru piese și manoperă mecanică conform invariantelor CARVANA.
 */
export function calculateMechanicalVat(amountEur: number): {
  netEur: number;
  vatEur: number;
  totalEur: number;
} {
  const roundedAmount = Math.max(0, amountEur);
  const vatEur = Math.round(roundedAmount * VAT_RATE * 100) / 100;
  return {
    netEur: roundedAmount,
    vatEur,
    totalEur: Math.round((roundedAmount + vatEur) * 100) / 100
  };
}
