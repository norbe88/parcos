/**
 * Lead Management Service pentru RXM Automobile
 * Salvează cererile venite de pe site (Buy-Back, Comandă, Test Drive, Finanțare)
 * într-un depozit persistent local (cu suport pentru export CSV și sync CRM).
 */

import { DealerLeadItem, DealerLeadStatus } from '../db/types';

export const LEADS_STORAGE_KEY = 'rxm_dealer_leads_store';
export const INTERACTIONS_STORAGE_KEY = 'rxm_showroom_interactions_store';
export const CLEARED_BY_USER_KEY = 'rxm_leads_cleared_by_user';

export interface ShowroomInteractionItem {
  id: string;
  type: 'whatsapp' | 'call' | 'testdrive' | 'pdf' | 'view';
  carId?: string;
  carTitle?: string;
  timestamp: string;
}

// Helper pentru calcul dată recontactare (implicit +3 zile lucrătoare)
function getDefaultRecontactDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

/**
 * Returnează toate lead-urile salvate din depozitul persistent
 */
export function getSavedLeads(): DealerLeadItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Eroare la citirea lead-urilor din store:', err);
    return [];
  }
}

/**
 * Returnează toate interacțiunile salvate din depozitul persistent
 */
export function getSavedInteractions(): ShowroomInteractionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INTERACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Eroare la citirea interacțiunilor din store:', err);
    return [];
  }
}

/**
 * Înregistrează o acțiune a utilizatorului (click WhatsApp, Apel, Fișă PDF, Vizită)
 */
export function recordShowroomInteraction(
  type: 'whatsapp' | 'call' | 'testdrive' | 'pdf' | 'view',
  meta?: { carId?: string; carTitle?: string }
): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedInteractions();
    const newInteraction: ShowroomInteractionItem = {
      id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      carId: meta?.carId,
      carTitle: meta?.carTitle,
      timestamp: new Date().toISOString(),
    };
    // Păstrăm ultimele 1000 interacțiuni pentru a proteja localStorage
    const updated = [newInteraction, ...existing].slice(0, 1000);
    localStorage.setItem(INTERACTIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rxm_interactions_updated', { detail: updated }));
  } catch (err) {
    console.error('Eroare la salvarea interacțiunii:', err);
  }
}

/**
 * Reset total (Hard Reset) la toate lead-urile și datele analitice de audiență -> Începe de la 0!
 */
export function hardResetAllLeadsAndAnalytics(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(INTERACTIONS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(CLEARED_BY_USER_KEY, 'true');
    window.dispatchEvent(new CustomEvent('rxm_lead_created', { detail: null }));
    window.dispatchEvent(new CustomEvent('rxm_leads_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('rxm_interactions_updated', { detail: [] }));
  } catch (err) {
    console.error('Eroare la resetarea lead-urilor:', err);
  }
}

/**
 * Înregistrează un nou lead în sistem și declanșează un custom event pentru actualizare UI CRM
 */
export function recordIncomingLead(leadData: {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  dealType: 'cash' | 'financing' | 'buyback';
  source?: 'showroom_web' | 'whatsapp' | 'olx' | 'tiktok' | 'phone_call' | 'recommendation';
  carId?: string;
  carTitle?: string;
  carPriceEur?: number;
  notes?: string;
  recontactDate?: string;
  scheduledTestDriveAt?: string;
}): DealerLeadItem {
  const now = new Date().toISOString();
  const newLead: DealerLeadItem = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientName: leadData.clientName || 'Client Showroom',
    clientPhone: leadData.clientPhone,
    clientEmail: leadData.clientEmail,
    dealType: leadData.dealType,
    source: leadData.source || 'showroom_web',
    status: 'new',
    carId: leadData.carId,
    carTitle: leadData.carTitle,
    carPriceEur: leadData.carPriceEur,
    notes: leadData.notes,
    createdAt: now,
    updatedAt: now,
    recontactDate: leadData.recontactDate || getDefaultRecontactDate(),
    scheduledTestDriveAt: leadData.scheduledTestDriveAt,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getSavedLeads();
      const updated = [newLead, ...existing];
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
      localStorage.removeItem(CLEARED_BY_USER_KEY);
      window.dispatchEvent(new CustomEvent('rxm_lead_created', { detail: newLead }));
      // Înregistrăm și ca interacțiune
      recordShowroomInteraction(
        leadData.scheduledTestDriveAt ? 'testdrive' : leadData.source === 'whatsapp' ? 'whatsapp' : 'call',
        { carId: leadData.carId, carTitle: leadData.carTitle }
      );
    } catch (err) {
      console.error('Eroare la salvarea lead-ului:', err);
    }
  }

  return newLead;
}

/**
 * Actualizează statusul sau data de recontactare a unui lead
 */
export function updateLead(leadId: string, updates: Partial<DealerLeadItem>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedLeads();
    const updated = existing.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rxm_leads_updated', { detail: updated }));
  } catch (err) {
    console.error('Eroare la actualizarea lead-ului:', err);
  }
}

/**
 * Șterge definitiv un lead din depozitul persistent
 */
export function deleteLead(leadId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedLeads();
    const updated = existing.filter(l => l.id !== leadId);
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rxm_leads_updated', { detail: updated }));
  } catch (err) {
    console.error('Eroare la ștergerea lead-ului:', err);
  }
}

/**
 * Marchează un lead ca pierdut (Closed Lost) cu motiv opțional
 */
export function archiveLeadAsLost(leadId: string, lossReason?: string): void {
  const existing = getSavedLeads();
  const target = existing.find(l => l.id === leadId);
  const appendedNotes = lossReason 
    ? `${target?.notes ? `${target.notes} • ` : ''}[Pierdut: ${lossReason}]`
    : target?.notes;
  
  updateLead(leadId, {
    status: 'closed_lost',
    notes: appendedNotes
  });
}

/**
 * Returnează lead-urile care necesită recontactare astăzi sau sunt depășite
 */
export function getPendingFollowUps(): { dueToday: DealerLeadItem[]; overdue: DealerLeadItem[] } {
  const all = getSavedLeads().filter(l => l.status !== 'closed_won' && l.status !== 'closed_lost');
  const today = new Date().toISOString().split('T')[0];

  const dueToday = all.filter(l => l.recontactDate === today);
  const overdue = all.filter(l => l.recontactDate && l.recontactDate < today);

  return { dueToday, overdue };
}

/**
 * Exportă registrul complet de oportunități în format CSV compatibil Excel / Google Sheets
 */
export function exportLeadsToCsv(leadsParam?: DealerLeadItem[]): void {
  const leads = leadsParam && leadsParam.length > 0 ? leadsParam : getSavedLeads();
  if (leads.length === 0) {
    alert('Nu există lead-uri salvate în sistem pentru export.');
    return;
  }

  const headers = [
    'ID', 'Data Creării', 'Nume Client', 'Telefon', 'Tip Tranzacție', 
    'Vehicul', 'Preț EUR', 'Sursă', 'Status', 'Dată Recontactare', 'Notițe'
  ];

  const rows = leads.map(l => [
    l.id,
    new Date(l.createdAt).toLocaleDateString('ro-RO'),
    `"${l.clientName}"`,
    `"${l.clientPhone}"`,
    l.dealType,
    `"${l.carTitle || '-'}"`,
    l.carPriceEur || '',
    l.source,
    l.status,
    l.recontactDate || '',
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `leads_rxm_automobile_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const downloadLeadsCsv = exportLeadsToCsv;

/**
 * Tracker Global de Interacțiuni Showroom
 * Detectează și contorizează automat click-urile pe WhatsApp, apeluri telefonice și generări de fișe PDF
 */
export function initShowroomInteractionTracker(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Monitorizăm vizita unică per sesiune
  try {
    const isVisited = sessionStorage.getItem('rxm_session_visit_logged');
    if (!isVisited) {
      recordShowroomInteraction('view');
      sessionStorage.setItem('rxm_session_visit_logged', 'true');
    }
  } catch (e) {
    // silence
  }

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Click pe WhatsApp
    const waLink = target.closest('a[href*="wa.me"], a[href*="whatsapp"]') as HTMLAnchorElement | null;
    if (waLink) {
      recordShowroomInteraction('whatsapp');
      return;
    }

    // Click pe telefon
    const telLink = target.closest('a[href^="tel:"]') as HTMLAnchorElement | null;
    if (telLink) {
      recordShowroomInteraction('call');
      return;
    }

    // Click pe imprimare / descărcare fișă PDF
    const printBtn = target.closest('button[data-action="print"], button[title*="tipăre"], button[title*="Print"], button[title*="Fișă"]') as HTMLButtonElement | null;
    if (printBtn) {
      recordShowroomInteraction('pdf');
      return;
    }
  };

  const handlePrint = () => {
    recordShowroomInteraction('pdf');
  };

  window.addEventListener('click', handleClick, { capture: true });
  window.addEventListener('beforeprint', handlePrint);

  return () => {
    window.removeEventListener('click', handleClick, { capture: true });
    window.removeEventListener('beforeprint', handlePrint);
  };
}
