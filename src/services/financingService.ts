/**
 * F&I & Financing Portfolio Management Service pentru ParcOS
 * Gestionează ciclul de viață al dosarelor de credit auto (TBI, BT, UniCredit etc.),
 * checklist-ul documentelor KYC/ANAF, anuitatea ratelor și comisioanele de brokeraj ale dealerului.
 */

import { FinancingDossierItem, FinancingDossierStatus, CreditorPartnerId } from '../db/types';
import { SEED_FINANCING_DOSSIERS } from '../db/financingSeed';
import { DealerLeadItem } from '../db/types';
import { VehicleItem } from '../db/types';
import { convertEurToRon, getBtExchangeRate } from '../utils/currencyEngine';

export const FINANCING_STORAGE_KEY = 'rxm_financing_dossiers_store';
export const FINANCING_CLEARED_KEY = 'rxm_financing_cleared_by_user';

/**
 * Calculează rata lunară prin formula standard de anuitate:
 * R = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateMonthlyRate(
  principalRon: number,
  tenureMonths: number,
  annualInterestPct: number
): number {
  if (!principalRon || principalRon <= 0 || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualInterestPct || annualInterestPct <= 0) {
    return Math.round(principalRon / tenureMonths);
  }

  const monthlyRate = annualInterestPct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyPayment = (principalRon * monthlyRate * factor) / (factor - 1);
  return Math.round(monthlyPayment);
}

/**
 * Calculează comisionul de brokeraj cuvenit dealerului (kickback bancar)
 */
export function calculateDealerCommission(
  financedAmountRon: number,
  commissionPct: number = 2.0
): number {
  if (!financedAmountRon || financedAmountRon <= 0 || !commissionPct || commissionPct <= 0) return 0;
  return Math.round((financedAmountRon * commissionPct) / 100);
}

/**
 * Returnează toate dosarele de finanțare salvate
 */
export function getSavedFinancingDossiers(): FinancingDossierItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const isCleared = localStorage.getItem(FINANCING_CLEARED_KEY);
    const raw = localStorage.getItem(FINANCING_STORAGE_KEY);

    if (isCleared === 'true') {
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }

    if (!raw) {
      // Inițializare cu date demonstrative
      localStorage.setItem(FINANCING_STORAGE_KEY, JSON.stringify(SEED_FINANCING_DOSSIERS));
      return SEED_FINANCING_DOSSIERS;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Eroare la citirea dosarelor de finanțare:', err);
    return SEED_FINANCING_DOSSIERS;
  }
}

/**
 * Salvează sau actualizează un dosar de finanțare
 */
export function saveFinancingDossier(dossier: FinancingDossierItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedFinancingDossiers();
    const index = existing.findIndex((d) => d.id === dossier.id);
    let updated: FinancingDossierItem[];

    const now = new Date().toISOString();
    const prepared: FinancingDossierItem = {
      ...dossier,
      updatedAt: now,
    };

    if (index >= 0) {
      updated = [...existing];
      updated[index] = prepared;
    } else {
      updated = [prepared, ...existing];
    }

    localStorage.setItem(FINANCING_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rxm_financing_updated', { detail: updated }));
  } catch (err) {
    console.error('Eroare la salvarea dosarului de finanțare:', err);
  }
}

/**
 * Actualizează statusul unui dosar existent
 */
export function updateDossierStatus(
  id: string,
  newStatus: FinancingDossierStatus,
  notes?: string
): void {
  if (typeof window === 'undefined') return;
  const dossiers = getSavedFinancingDossiers();
  const target = dossiers.find((d) => d.id === id);
  if (!target) return;

  const updated: FinancingDossierItem = {
    ...target,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...(notes ? { internalNotes: notes } : {}),
  };

  saveFinancingDossier(updated);
}

/**
 * Șterge un dosar de finanțare
 */
export function deleteFinancingDossier(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedFinancingDossiers();
    const updated = existing.filter((d) => d.id !== id);
    localStorage.setItem(FINANCING_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rxm_financing_updated', { detail: updated }));
  } catch (err) {
    console.error('Eroare la ștergerea dosarului de finanțare:', err);
  }
}

/**
 * Helper: Creează automat un dosar de credit pornind de la un Lead CRM
 */
export function createDossierFromLead(
  lead: DealerLeadItem,
  car?: VehicleItem | null,
  assignedOfficer: string = 'Consilier Finanțare'
): FinancingDossierItem {
  const existing = getSavedFinancingDossiers();
  const alreadyExists = existing.find((d) => d.leadId === lead.id);
  if (alreadyExists) return alreadyExists;

  const priceEur = lead.carPriceEur || car?.priceEur || 0;
  const priceRon = convertEurToRon(priceEur);
  const tenureMonths = 60;
  const interestRatePct = 7.9; // Rata TBI / BT implicită
  const financedAmountRon = priceRon;
  const monthlyInstallmentRon = calculateMonthlyRate(financedAmountRon, tenureMonths, interestRatePct);
  const brokerCommissionRon = calculateDealerCommission(financedAmountRon, 2.0);

  const newDossier: FinancingDossierItem = {
    id: `dossier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    leadId: lead.id,
    carId: lead.carId || car?.id || 'necunoscut',
    carTitle: lead.carTitle || (car ? `${car.brand} ${car.model} (${car.year})` : 'Vehicul Solicitat'),
    carPriceEur: priceEur,
    carPriceRon: priceRon,
    clientName: lead.clientName,
    clientPhone: lead.clientPhone,
    clientEmail: lead.clientEmail,
    clientEmploymentType: 'salariat_ro',
    creditor: 'tbi',
    downPaymentEur: 0,
    downPaymentRon: 0,
    downPaymentPct: 0,
    financedAmountRon,
    tenureMonths,
    interestRatePct,
    monthlyInstallmentRon,
    status: 'docs_pending',
    documents: {
      idCardUploaded: false,
      anafConsentSigned: false,
      incomeProofUploaded: false,
      bankContractUploaded: false,
    },
    brokerCommissionPct: 2.0,
    brokerCommissionRon,
    commissionPayoutStatus: 'pending',
    assignedOfficer,
    internalNotes: `Inițiat automat din lead CRM (${lead.source}). Note lead: ${lead.notes || 'fără note'}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveFinancingDossier(newDossier);
  return newDossier;
}

/**
 * Creează un dosar F&I pornind de la o simulare de rate din showroom (DetailFinanceTab)
 */
export function createDossierFromCalculator(params: {
  car: VehicleItem;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  creditor: CreditorPartnerId;
  downPaymentEur: number;
  downPaymentRon: number;
  tenureMonths: number;
  interestRatePct: number;
  financedAmountRon: number;
  monthlyInstallmentRon: number;
  notes?: string;
}): FinancingDossierItem {
  const priceEur = params.car.priceEur;
  const priceRon = convertEurToRon(priceEur);
  const brokerCommissionRon = calculateDealerCommission(params.financedAmountRon, 2.0);

  const newDossier: FinancingDossierItem = {
    id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    carId: params.car.id,
    carTitle: `${params.car.brand} ${params.car.model} (${params.car.year})`,
    carPriceEur: priceEur,
    carPriceRon: priceRon,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    clientEmail: params.clientEmail,
    clientEmploymentType: 'salariat_ro',
    creditor: params.creditor,
    downPaymentEur: params.downPaymentEur,
    downPaymentRon: params.downPaymentRon,
    downPaymentPct: priceRon > 0 ? Math.round((params.downPaymentRon / priceRon) * 100) : 0,
    financedAmountRon: params.financedAmountRon,
    tenureMonths: params.tenureMonths,
    interestRatePct: params.interestRatePct,
    monthlyInstallmentRon: params.monthlyInstallmentRon,
    status: 'docs_pending',
    documents: {
      idCardUploaded: false,
      anafConsentSigned: false,
      incomeProofUploaded: false,
      bankContractUploaded: false,
    },
    brokerCommissionPct: 2.0,
    brokerCommissionRon,
    commissionPayoutStatus: 'pending',
    assignedOfficer: 'Consilier Finanțare',
    internalNotes: `Cerere primită direct din Calculator Showroom. ${params.notes || ''}`.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveFinancingDossier(newDossier);
  return newDossier;
}

/**
 * Creează manual un dosar F&I nou gol
 */
export function createManualDossier(car?: VehicleItem | null): FinancingDossierItem {
  const priceEur = car?.priceEur || 10000;
  const priceRon = convertEurToRon(priceEur);
  const tenureMonths = 60;
  const interestRatePct = 7.9;
  const financedAmountRon = priceRon;
  const monthlyInstallmentRon = calculateMonthlyRate(financedAmountRon, tenureMonths, interestRatePct);
  const brokerCommissionRon = calculateDealerCommission(financedAmountRon, 2.0);

  const newDossier: FinancingDossierItem = {
    id: `dos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    carId: car?.id || 'manual',
    carTitle: car ? `${car.brand} ${car.model} (${car.year})` : 'Vehicul Selectat',
    carPriceEur: priceEur,
    carPriceRon: priceRon,
    clientName: 'Client Nou Finanțare',
    clientPhone: '07',
    clientEmploymentType: 'salariat_ro',
    creditor: 'tbi',
    downPaymentEur: 0,
    downPaymentRon: 0,
    downPaymentPct: 0,
    financedAmountRon,
    tenureMonths,
    interestRatePct,
    monthlyInstallmentRon,
    status: 'draft',
    documents: {
      idCardUploaded: false,
      anafConsentSigned: false,
      incomeProofUploaded: false,
      bankContractUploaded: false,
    },
    brokerCommissionPct: 2.0,
    brokerCommissionRon,
    commissionPayoutStatus: 'pending',
    assignedOfficer: 'Consilier Finanțare',
    internalNotes: 'Creat manual din panoul F&I.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveFinancingDossier(newDossier);
  return newDossier;
}

/**
 * Actualizează statusul plății comisionului de brokeraj
 */
export function updateCommissionPayoutStatus(
  id: string,
  payoutStatus: 'pending' | 'invoiced' | 'collected'
): void {
  if (typeof window === 'undefined') return;
  const dossiers = getSavedFinancingDossiers();
  const target = dossiers.find((d) => d.id === id);
  if (!target) return;

  const updated: FinancingDossierItem = {
    ...target,
    commissionPayoutStatus: payoutStatus,
    updatedAt: new Date().toISOString(),
  };

  saveFinancingDossier(updated);
}

/**
 * Descarcă portofoliul F&I în format CSV
 */
export function downloadFinancingCsv(dossiers: FinancingDossierItem[]): void {
  if (typeof window === 'undefined' || dossiers.length === 0) return;

  const headers = [
    'ID Dosar',
    'Client',
    'Telefon',
    'Email',
    'Vehicul',
    'Pret EUR',
    'Pret RON (Curs BT)',
    'Avans RON',
    'Suma Finantata RON',
    'Perioada (Luni)',
    'Dobanda (%)',
    'Rata Lunara RON',
    'Creditor',
    'Status Dosar',
    'Comision Brokeraj RON',
    'Status Comision',
    'Data Creare'
  ];

  const rows = dossiers.map(d => [
    `"${d.id}"`,
    `"${d.clientName.replace(/"/g, '""')}"`,
    `"${d.clientPhone}"`,
    `"${d.clientEmail || ''}"`,
    `"${d.carTitle.replace(/"/g, '""')}"`,
    d.carPriceEur,
    d.carPriceRon,
    d.downPaymentRon,
    d.financedAmountRon,
    d.tenureMonths,
    d.interestRatePct,
    d.monthlyInstallmentRon,
    `"${d.creditor.toUpperCase()}"`,
    `"${d.status}"`,
    d.brokerCommissionRon,
    `"${d.commissionPayoutStatus || 'pending'}"`,
    `"${d.createdAt}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `parcos_portofoliu_finantari_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reset complet al depozitului de finanțări
 */
export function hardResetAllFinancingDossiers(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINANCING_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(FINANCING_CLEARED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('rxm_financing_updated', { detail: [] }));
  } catch (err) {
    console.error('Eroare la resetarea dosarelor de finanțare:', err);
  }
}
