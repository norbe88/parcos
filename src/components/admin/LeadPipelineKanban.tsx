import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Phone, MessageCircle, Calendar, 
  ArrowRight, ArrowLeft, CheckCircle2, XCircle, Search, 
  Tag, Clock, AlertCircle, FileText, Sparkles, Filter, RotateCcw,
  Car, ShieldAlert, Link as LinkIcon, Check, ExternalLink,
  Pencil, Trash2, Archive, DollarSign, TrendingUp, AlertTriangle, RefreshCw,
  GripVertical
} from 'lucide-react';
import { VehicleItem, DealerLeadItem, DealerLeadStatus, SEED_DEALER, DealerProfile } from '../../db/seed';
import { 
  downloadLeadsCsv, 
  hardResetAllLeadsAndAnalytics, 
  LEADS_STORAGE_KEY, 
  CLEARED_BY_USER_KEY,
  deleteLead,
  archiveLeadAsLost,
  updateLead
} from '../../services/leadService';

const SEED_LEADS: DealerLeadItem[] = [
  {
    id: 'demo-lead-1',
    clientName: 'Client Demo 1',
    clientPhone: '0700 000 001',
    clientEmail: 'demo1@exemplu.ro',
    carId: 'audi-a6-2011-l0lya',
    carTitle: 'Audi A6 S-Line int 2011',
    carPriceEur: 7290,
    dealType: 'financing',
    source: 'whatsapp',
    status: 'new',
    notes: 'Solicitare demo finanțare fără avans.',
    recontactDate: new Date().toISOString().split('T')[0],
    createdAt: '2026-10-14T08:30:00Z',
    updatedAt: '2026-10-14T08:30:00Z'
  },
  {
    id: 'demo-lead-2',
    clientName: 'Client Demo 2',
    clientPhone: '0700 000 002',
    clientEmail: 'demo2@exemplu.ro',
    carId: 'renault-megane-2016-kwsl1',
    carTitle: 'Renault Megane Edition 2016',
    carPriceEur: 7990,
    dealType: 'financing',
    source: 'showroom_web',
    status: 'testdrive',
    notes: 'Programare probă de drum demonstrativă.',
    scheduledTestDriveAt: '2026-10-17 11:30',
    recontactDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: '2026-10-08T09:15:00Z',
    updatedAt: '2026-10-09T14:20:00Z'
  }
];

export const LOSS_REASONS = [
  'A renunțat / Nu mai dorește achiziția',
  'Preț prea mare / Peste bugetul clientului',
  'A cumpărat o altă mașină de pe piață',
  'Dosar finanțare / credit respins de bancă',
  'Clientul nu răspunde la apeluri / mesaje',
  'Lead invalid / Spam / Număr eronat',
  'Alt motiv'
];

export function getWhatsAppUrlForLead(lead: DealerLeadItem, car: VehicleItem | null, dealerName: string): string {
  const cleanPhone = lead.clientPhone.replace(/[^0-9]/g, '');
  const carTitle = lead.carTitle || (car ? `${car.brand} ${car.model} (${car.year})` : 'vehiculul din stocul nostru');
  
  let msg = '';
  switch (lead.status) {
    case 'new':
      msg = `Bună ziua, ${lead.clientName}! Vă contactăm de la ${dealerName} cu privire la ${carTitle}. Ați dori să vă transmitem mai multe fotografii detaliate, istoricul de service sau să programăm un Test-Drive la showroom?`;
      break;
    case 'testdrive':
      msg = `Bună ziua, ${lead.clientName}! Vă confirmăm programarea pentru Test-Drive cu ${carTitle} la showroom-ul ${dealerName}${lead.scheduledTestDriveAt ? ` pentru data de ${lead.scheduledTestDriveAt}` : ''}. Vă rugăm să aveți permisul de conducere la dumneavoastră. Vă așteptăm cu drag!`;
      break;
    case 'financing':
      msg = `Bună ziua, ${lead.clientName}! Dosarul dumneavoastră de finanțare pentru ${carTitle} este în curs de analiză prin partenerii noștri bancari. Vă ținem la curent imediat ce avem aprobarea finală!`;
      break;
    case 'proforma':
      msg = `Bună ziua, ${lead.clientName}! Am pregătit documentele și proforma de avans pentru rezervarea vehiculului ${carTitle}. După confirmarea plății, mașina este blocată exclusiv pentru dumneavoastră. Vă stăm la dispoziție pentru orice detaliu!`;
      break;
    case 'closed_won':
      msg = `Felicitări pentru achiziția noului dumneavoastră ${carTitle} de la ${dealerName}! Vă mulțumim pentru încredere și vă reamintim că beneficiați de Garanție completă și asistență dedicată. Drumuri bune!`;
      break;
    default:
      msg = `Bună ziua, ${lead.clientName}! Vă contactăm de la ${dealerName} cu privire la ${carTitle}. Cu ce vă putem ajuta astăzi?`;
      break;
  }
  
  return `https://wa.me/4${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

interface LeadPipelineKanbanProps {
  cars: VehicleItem[];
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER | DealerProfile;
  onStatusChange?: (id: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
  onOpenSalesDocs?: (car: VehicleItem, initialBuyer?: { fullName: string; phone: string; agreedPriceEur?: number }) => void;
}

interface StatusSyncPrompt {
  lead: DealerLeadItem;
  car: VehicleItem;
  targetCarStatus: 'reserved' | 'sold';
  targetLeadStatus: DealerLeadStatus;
}

export const LeadPipelineKanban: React.FC<LeadPipelineKanbanProps> = ({
  cars,
  showToast,
  dealer = SEED_DEALER,
  onStatusChange,
  onOpenSalesDocs
}) => {
  const [leads, setLeads] = useState<DealerLeadItem[]>(() => {
    try {
      const isCleared = localStorage.getItem(CLEARED_BY_USER_KEY);
      if (isCleared === 'true') {
        const saved = localStorage.getItem(LEADS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
      const saved = localStorage.getItem(LEADS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Nu s-au putut încărca lead-urile din localStorage:', e);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileStageFilter, setMobileStageFilter] = useState<'all' | DealerLeadStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [statusSyncPrompt, setStatusSyncPrompt] = useState<StatusSyncPrompt | null>(null);

  // 🔀 Stare Drag & Drop pentru mutarea rapidă a cardurilor de lead între coloane
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<DealerLeadStatus | null>(null);

  // Stare formular adăugare lead
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCarId, setNewLeadCarId] = useState<string>(cars[0]?.id || '');
  const [newLeadDealType, setNewLeadDealType] = useState<'cash' | 'financing' | 'buyback'>('financing');
  const [newLeadSource, setNewLeadSource] = useState<'showroom_web' | 'whatsapp' | 'olx' | 'tiktok' | 'phone_call' | 'recommendation'>('whatsapp');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // 🛡️ Filtrare după tip tranzacție (Ticket 04)
  const [dealTypeFilter, setDealTypeFilter] = useState<'all' | 'financing' | 'cash' | 'buyback'>('all');

  // 🗑️ Stare modal ștergere / marcare lead ca pierdut (Ticket 02)
  const [deleteModalLead, setDeleteModalLead] = useState<DealerLeadItem | null>(null);
  const [selectedLossReason, setSelectedLossReason] = useState<string>(LOSS_REASONS[0]);
  const [customLossReason, setCustomLossReason] = useState<string>('');

  // 📁 Stare sertar / modal lead-uri arhivate / pierdute (Ticket 02)
  const [isLostArchiveOpen, setIsLostArchiveOpen] = useState(false);

  // ✏️ Stare modal editare rapidă lead (Ticket 03)
  const [editingLead, setEditingLead] = useState<DealerLeadItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCarId, setEditCarId] = useState('');
  const [editDealType, setEditDealType] = useState<'cash' | 'financing' | 'buyback'>('financing');
  const [editSource, setEditSource] = useState<DealerLeadItem['source']>('whatsapp');
  const [editStatus, setEditStatus] = useState<DealerLeadStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [editTestDriveAt, setEditTestDriveAt] = useState('');
  const [editRecontactDate, setEditRecontactDate] = useState('');

  // Sincronizare la evenimente de actualizare externă a lead-urilor
  useEffect(() => {
    const handleLeadsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        setLeads(e.detail);
      }
    };
    window.addEventListener('rxm_leads_updated' as any, handleLeadsUpdated);
    return () => window.removeEventListener('rxm_leads_updated' as any, handleLeadsUpdated);
  }, []);

  // Salvare persistentă în localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error(e);
    }
  }, [leads]);

  const handleHardReset = () => {
    hardResetAllLeadsAndAnalytics();
    setLeads([]);
    setIsResetConfirmOpen(false);
    showToast('🧹 Hard Reset complet: Toate lead-urile și datele analitice au început de la 0!');
  };

  const handleLoadDemoLeads = () => {
    localStorage.removeItem(CLEARED_BY_USER_KEY);
    setLeads(SEED_LEADS);
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(SEED_LEADS));
    showToast('📋 Au fost reîncărcate 5 lead-uri demo pentru testarea conductei CRM.');
  };

  // Navigare stadii cu detecție sincronizare rezervare/vânzare stoc
  const handleMoveStatus = (leadId: string, nextStatus: DealerLeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const associatedCar = lead.carId ? cars.find(c => c.id === lead.carId) : null;

    // Sincronizare automată 1: La trecerea în 'proforma' (Proformă Avans Emisă)
    if (nextStatus === 'proforma' && associatedCar && associatedCar.status === 'in_stock' && onStatusChange) {
      setStatusSyncPrompt({
        lead,
        car: associatedCar,
        targetCarStatus: 'reserved',
        targetLeadStatus: nextStatus
      });
      return;
    }

    // Sincronizare automată 2: La trecerea în 'closed_won' (Vândut & Livrat)
    if (nextStatus === 'closed_won' && associatedCar && associatedCar.status !== 'sold' && onStatusChange) {
      setStatusSyncPrompt({
        lead,
        car: associatedCar,
        targetCarStatus: 'sold',
        targetLeadStatus: nextStatus
      });
      return;
    }

    // Mutare directă fără prompt
    executeStatusMove(leadId, nextStatus);
  };

  const executeStatusMove = (leadId: string, nextStatus: DealerLeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    } : l));
    showToast(`Lead avansat la stadiul: ${getStatusLabel(nextStatus)}`);
  };

  // Confirmare sincronizare status vehicul în stoc
  const handleConfirmStatusSync = (syncVehicle: boolean) => {
    if (!statusSyncPrompt) return;
    const { lead, car, targetCarStatus, targetLeadStatus } = statusSyncPrompt;

    executeStatusMove(lead.id, targetLeadStatus);

    if (syncVehicle && onStatusChange) {
      onStatusChange(car.id, targetCarStatus);
      showToast(`🚗 Mașina ${car.brand} ${car.model} a fost marcată ca ${targetCarStatus === 'reserved' ? 'REZERVATĂ' : 'VÂNDUTĂ'} în stoc!`);
    }

    setStatusSyncPrompt(null);
  };

  // Asociere manuală vehicul pe card de lead
  const handleAssociateCar = (leadId: string, carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      carId: car.id,
      carTitle: `${car.brand} ${car.model} ${car.year}`,
      carPriceEur: car.priceEur,
      updatedAt: new Date().toISOString()
    } : l));

    showToast(`Vehicul asociat cu succes: ${car.brand} ${car.model}`);
  };

  // Deschidere generator de proformă & acte pentru lead
  const handleOpenDocsForLead = (lead: DealerLeadItem) => {
    let car = lead.carId ? cars.find(c => c.id === lead.carId) : null;
    if (!car && cars.length > 0) {
      car = cars[0]; // fallback la prima mașină
    }

    if (!car) {
      showToast('Nu există nicio mașină în stoc pentru a emite documente.');
      return;
    }

    if (onOpenSalesDocs) {
      onOpenSalesDocs(car, {
        fullName: lead.clientName,
        phone: lead.clientPhone,
        agreedPriceEur: lead.carPriceEur || car.priceEur
      });
      showToast(`📄 Generator deschis pentru ${lead.clientName} (${car.brand} ${car.model})`);
    } else {
      showToast(`Se emite proformă pentru ${lead.clientName} la mașina ${car.brand} ${car.model}`);
    }
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      showToast('Te rugăm să completezi numele și telefonul clientului.');
      return;
    }

    const selectedCar = cars.find(c => c.id === newLeadCarId);

    const newLead: DealerLeadItem = {
      id: `lead_${Date.now()}`,
      clientName: newLeadName.trim(),
      clientPhone: newLeadPhone.trim(),
      carId: newLeadCarId,
      carTitle: selectedCar ? `${selectedCar.brand} ${selectedCar.model} ${selectedCar.year}` : 'Cerere Generală Showroom',
      carPriceEur: selectedCar?.priceEur,
      dealType: newLeadDealType,
      source: newLeadSource,
      status: 'new',
      notes: newLeadNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recontactDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    };

    setLeads(prev => [newLead, ...prev]);
    showToast(`Lead adăugat cu succes: ${newLead.clientName}!`);
    setIsAddModalOpen(false);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadNotes('');
  };

  // Mapare sigură pentru statusuri vechi ('negotiation' -> 'financing')
  const normalizeStatus = (s: DealerLeadStatus): DealerLeadStatus => {
    if (s === 'negotiation') return 'financing';
    return s;
  };

  // Handlers pentru editare rapidă lead (Ticket 03)
  const handleOpenEditLead = (lead: DealerLeadItem) => {
    setEditingLead(lead);
    setEditName(lead.clientName);
    setEditPhone(lead.clientPhone);
    setEditEmail(lead.clientEmail || '');
    setEditCarId(lead.carId || '');
    setEditDealType(lead.dealType || 'financing');
    setEditSource(lead.source || 'whatsapp');
    setEditStatus(normalizeStatus(lead.status));
    setEditNotes(lead.notes || '');
    setEditTestDriveAt(lead.scheduledTestDriveAt || '');
    setEditRecontactDate(lead.recontactDate || '');
  };

  const handleSaveEditLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    if (!editName.trim() || !editPhone.trim()) {
      showToast('Te rugăm să completezi numele și telefonul clientului.');
      return;
    }

    const selectedCar = editCarId ? cars.find(c => c.id === editCarId) : null;
    const updates: Partial<DealerLeadItem> = {
      clientName: editName.trim(),
      clientPhone: editPhone.trim(),
      clientEmail: editEmail.trim() || undefined,
      carId: editCarId || undefined,
      carTitle: selectedCar ? `${selectedCar.brand} ${selectedCar.model} ${selectedCar.year}` : editingLead.carTitle,
      carPriceEur: selectedCar?.priceEur || editingLead.carPriceEur,
      dealType: editDealType,
      source: editSource,
      status: editStatus,
      notes: editNotes.trim() || undefined,
      scheduledTestDriveAt: editTestDriveAt.trim() || undefined,
      recontactDate: editRecontactDate.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    updateLead(editingLead.id, updates);
    setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...updates } : l));
    setEditingLead(null);
    showToast(`✓ Datele lead-ului pentru ${editName} au fost actualizate.`);
  };

  // Handlers pentru ștergere și marcare ca pierdut (Ticket 02)
  const handleConfirmDelete = () => {
    if (!deleteModalLead) return;
    const targetId = deleteModalLead.id;
    const targetName = deleteModalLead.clientName;
    deleteLead(targetId);
    setLeads(prev => prev.filter(l => l.id !== targetId));
    setDeleteModalLead(null);
    showToast(`🗑️ Lead-ul pentru ${targetName} a fost șters definitiv din sistem.`);
  };

  const handleConfirmMarkAsLost = () => {
    if (!deleteModalLead) return;
    const targetId = deleteModalLead.id;
    const targetName = deleteModalLead.clientName;
    const finalReason = selectedLossReason === 'Alt motiv' ? (customLossReason.trim() || 'Nespecificat') : selectedLossReason;

    archiveLeadAsLost(targetId, finalReason);
    setLeads(prev => prev.map(l => l.id === targetId ? {
      ...l,
      status: 'closed_lost',
      notes: `${l.notes ? `${l.notes} • ` : ''}[Pierdut: ${finalReason}]`,
      updatedAt: new Date().toISOString()
    } : l));

    setDeleteModalLead(null);
    setCustomLossReason('');
    showToast(`📁 Lead-ul pentru ${targetName} a fost arhivat ca Pierdut (${finalReason}).`);
  };

  const handleReactivateLostLead = (leadId: string) => {
    const target = leads.find(l => l.id === leadId);
    if (!target) return;
    updateLead(leadId, { status: 'new' });
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      status: 'new',
      updatedAt: new Date().toISOString()
    } : l));
    showToast(`✓ Lead-ul pentru ${target.clientName} a fost reactivat și repus în Contact Nou!`);
  };

  // Separare lead-uri active vs lead-uri pierdute (Ticket 02 & 04)
  const lostLeads = leads.filter(l => l.status === 'closed_lost');
  const activeLeads = leads.filter(l => l.status !== 'closed_lost');

  const filteredLeads = activeLeads.filter(l => {
    if (dealTypeFilter !== 'all' && l.dealType !== dealTypeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.clientName.toLowerCase().includes(q) ||
      l.clientPhone.includes(q) ||
      (l.carTitle && l.carTitle.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  });

  const totalActivePipelineValueEur = filteredLeads.reduce((sum, l) => {
    const c = l.carId ? cars.find(car => car.id === l.carId) : null;
    return sum + (l.carPriceEur || c?.priceEur || 0);
  }, 0);

  // 5 Coloane Pipeline Standard Dealer OS Showroom
  const columns: { 
    id: DealerLeadStatus; 
    title: string; 
    shortTitle: string;
    subtitle: string; 
    color: string; 
    bg: string; 
    border: string; 
    badgeBg: string 
  }[] = [
    { 
      id: 'new', 
      title: '1. Contact Nou', 
      shortTitle: 'Contact',
      subtitle: 'Mesaje & Apeluri', 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/30', 
      badgeBg: 'bg-blue-500/20' 
    },
    { 
      id: 'testdrive', 
      title: '2. Test-Drive Programat', 
      shortTitle: 'Test-Drive',
      subtitle: 'Vizite Showroom', 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/30', 
      badgeBg: 'bg-purple-500/20' 
    },
    { 
      id: 'financing', 
      title: '3. Dosar Finanțare Trimis', 
      shortTitle: 'Finanțare',
      subtitle: 'Rate / Trade-In', 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30', 
      badgeBg: 'bg-amber-500/20' 
    },
    { 
      id: 'proforma', 
      title: '4. Proformă Avans Emisă', 
      shortTitle: 'Proformă',
      subtitle: 'Rezervare Parc & Factură', 
      color: 'text-sky-400', 
      bg: 'bg-sky-500/10', 
      border: 'border-sky-500/30', 
      badgeBg: 'bg-sky-500/20' 
    },
    { 
      id: 'closed_won', 
      title: '5. Vândut & Livrat', 
      shortTitle: 'Livrat',
      subtitle: 'Contract & Predare', 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/30', 
      badgeBg: 'bg-emerald-500/20' 
    }
  ];

  const stageOrder: DealerLeadStatus[] = ['new', 'testdrive', 'financing', 'proforma', 'closed_won'];

  const displayedColumns = mobileStageFilter === 'all' 
    ? columns 
    : columns.filter(c => c.id === mobileStageFilter);

  return (
    <div className="space-y-6">
      {/* Bară de Comandă CRM & Căutare */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] border border-white/[0.08] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                Conductă CRM Showroom & Lead Pipeline Integrat
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valoare Activă: {totalActivePipelineValueEur.toLocaleString('ro-RO')} €</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Urmărire directă: Contact ➔ Test-Drive ➔ Finanțare ➔ Proformă Avans ➔ Livrat
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută client, telefon, mașină..."
              className="bg-[#18181b] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 w-full min-h-[44px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation active:scale-[0.98] transition-all"
            title="Resetează complet lead-urile și interacțiunile la 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset la 0</span>
          </button>

          <button
            type="button"
            onClick={() => {
              downloadLeadsCsv(leads);
              showToast('📁 Fișierul CSV cu toate lead-urile a fost descărcat cu succes!');
            }}
            className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all min-h-[44px] touch-manipulation"
            title="Exportă baza de date a lead-urilor în format CSV"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all min-h-[44px] touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Lead Nou</span>
          </button>
        </div>
      </div>

      {/* Bară Filtre Deal Type & Arhivă Pierdute */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-[#121215]/80 border border-white/[0.06] p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>Tranzacție:</span>
          </span>
          {[
            { id: 'all', label: `Toate (${activeLeads.length})` },
            { id: 'financing', label: `Rate / Finanțare (${activeLeads.filter(l => l.dealType === 'financing').length})` },
            { id: 'cash', label: `Plată Cash (${activeLeads.filter(l => l.dealType === 'cash').length})` },
            { id: 'buyback', label: `Buy-Back (${activeLeads.filter(l => l.dealType === 'buyback').length})` }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDealTypeFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation ${
                dealTypeFilter === f.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {lostLeads.length > 0 && (
          <button
            type="button"
            onClick={() => setIsLostArchiveOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation ml-auto"
            title="Vezi lead-urile arhivate ca pierdute"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Arhivă Pierdute ({lostLeads.length})</span>
          </button>
        )}
      </div>

      {/* Banner Stare 0 Lead-uri */}
      {leads.length === 0 && (
        <div className="bg-[#15151a] border border-amber-500/20 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Baza de date CRM este curată (0 Lead-uri înregistrate)</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Registrul a fost resetat de la zero. Toate solicitările noi de pe site (WhatsApp, Test Drive, Buy-Back, Comandă) vor apărea aici automat.
          </p>
          <button
            type="button"
            onClick={handleLoadDemoLeads}
            className="mt-1 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 touch-manipulation cursor-pointer"
          >
            Încarcă 5 Lead-uri Demo pentru testare
          </button>
        </div>
      )}

      {/* Selector Rapid Stadiu pe Mobil (< lg) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setMobileStageFilter('all')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] touch-manipulation transition-all ${
            mobileStageFilter === 'all'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white/5 border border-white/10 text-zinc-400'
          }`}
        >
          Toate ({leads.length})
        </button>
        {columns.map(c => {
          const count = leads.filter(l => normalizeStatus(l.status) === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setMobileStageFilter(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] touch-manipulation transition-all ${
                mobileStageFilter === c.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 border border-white/10 text-zinc-400'
              }`}
            >
              {c.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Tabloul Kanban pe 5 Coloane (Responsive 1 -> 2 -> 5 coloane) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {displayedColumns.map(col => {
          const colLeads = filteredLeads.filter(l => normalizeStatus(l.status) === col.id);
          const colTotalValueEur = colLeads.reduce((acc, l) => {
            const c = l.carId ? cars.find(car => car.id === l.carId) : null;
            return acc + (l.carPriceEur || c?.priceEur || 0);
          }, 0);

          return (
            <div 
              key={col.id} 
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumnId !== col.id) {
                  setDragOverColumnId(col.id);
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverColumnId(col.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverColumnId === col.id) {
                  setDragOverColumnId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedLeadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
                setDragOverColumnId(null);
                setDraggedLeadId(null);
                if (!droppedLeadId) return;
                const lead = leads.find(l => l.id === droppedLeadId);
                if (!lead) return;
                if (normalizeStatus(lead.status) === col.id) return;
                handleMoveStatus(lead.id, col.id);
              }}
              className={`bg-[#121215] border rounded-2xl p-3 flex flex-col min-h-[620px] transition-all duration-150 ${
                dragOverColumnId === col.id
                  ? 'border-purple-500/80 bg-purple-950/20 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/40'
                  : 'border-white/[0.08]'
              }`}
            >
              {/* Header Coloană */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.bg} border ${col.border}`} />
                    <span className="font-bold text-xs text-white leading-tight">{col.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 ml-4 flex items-center gap-1">
                    <span>{col.subtitle}</span>
                    {colTotalValueEur > 0 && (
                      <span className="text-zinc-400 font-mono font-medium">
                        • {colTotalValueEur.toLocaleString('ro-RO')} €
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${col.badgeBg} ${col.color} border ${col.border}`}>
                  {colLeads.length}
                </span>
              </div>

              {/* Lista Cardurilor de Lead */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {dragOverColumnId === col.id && draggedLeadId && (
                  <div className="py-3 px-3 rounded-xl border-2 border-dashed border-purple-400/80 bg-purple-500/15 text-center text-xs font-bold text-purple-200 animate-pulse flex items-center justify-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>Plasează lead-ul în: {col.shortTitle}</span>
                  </div>
                )}
                {colLeads.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-zinc-600 italic border border-dashed border-white/06 rounded-xl p-4">
                    <span>Niciun lead în acest stadiu</span>
                  </div>
                ) : (
                  colLeads.map(lead => {
                    const car = lead.carId ? cars.find(c => c.id === lead.carId) : null;
                    const stageIdx = stageOrder.indexOf(normalizeStatus(lead.status));

                    return (
                      <div 
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', lead.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedLeadId(lead.id);
                        }}
                        onDragEnd={() => {
                          setDraggedLeadId(null);
                          setDragOverColumnId(null);
                        }}
                        className={`bg-black/50 border p-3 rounded-xl space-y-2.5 transition-all shadow-sm group hover:shadow-purple-500/5 cursor-grab active:cursor-grabbing ${
                          draggedLeadId === lead.id
                            ? 'opacity-40 scale-[0.98] border-purple-500/80 ring-2 ring-purple-500/30'
                            : 'border-white/[0.08] hover:border-purple-400/40'
                        }`}
                      >
                        {/* Nume & Acțiuni Administrative Discrete */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span 
                                className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-purple-300 transition-colors p-0.5 rounded touch-none"
                                title="Trage cardul pentru a-l muta în alt stadiu"
                              >
                                <GripVertical className="w-3.5 h-3.5 shrink-0" />
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditLead(lead)}
                                className="font-bold text-sm text-white hover:text-purple-300 transition-colors truncate text-left group/name"
                                title="Click pentru a edita detaliile lead-ului"
                              >
                                <span className="group-hover/name:underline underline-offset-2">{lead.clientName}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditLead(lead)}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
                                title="Editează datele lead-ului"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLossReason(LOSS_REASONS[0]);
                                  setCustomLossReason('');
                                  setDeleteModalLead(lead);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all touch-manipulation"
                                title="Șterge lead-ul sau marchează-l ca oportunitate pierdută"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <div className="text-zinc-400 font-mono flex items-center gap-1 min-w-0 truncate">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <a href={`tel:${lead.clientPhone}`} className="hover:text-emerald-300 truncate">
                                {lead.clientPhone}
                              </a>
                            </div>

                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/5 border border-white/10 text-zinc-400 capitalize shrink-0">
                              {lead.source.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Mașină de interes & Thumbnail asociat din stoc */}
                        {car ? (
                          <div className="bg-white/[0.03] border border-white/10 p-2 rounded-xl flex items-center gap-2.5">
                            {car.images && car.images[0] ? (
                              <img 
                                src={car.images[0]} 
                                alt={car.brand} 
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0 bg-zinc-900" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 shrink-0">
                                <Car className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-amber-300 truncate">
                                  {car.brand} {car.model}
                                </span>
                                <span className="font-mono font-bold text-xs text-white shrink-0">
                                  {car.priceEur.toLocaleString('ro-RO')} €
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                                <span>{car.year} • {car.mileageKm.toLocaleString('ro-RO')} km</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                  car.status === 'in_stock' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : car.status === 'reserved'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20'
                                }`}>
                                  {car.status === 'in_stock' ? 'În Stoc' : car.status === 'reserved' ? 'Rezervat' : 'Vândut'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : lead.carTitle ? (
                          <div className="bg-white/[0.02] border border-white/06 p-2 rounded-lg text-xs">
                            <div className="font-semibold text-amber-300/80 truncate">{lead.carTitle}</div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-0.5">
                              <span>Cerere text</span>
                              {lead.carPriceEur && (
                                <span className="font-mono">{lead.carPriceEur.toLocaleString('ro-RO')} €</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Selector rapid de asociere mașină din stoc */
                          <div className="bg-white/[0.02] border border-dashed border-white/10 p-2 rounded-lg">
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mb-1 font-semibold">
                              <LinkIcon className="w-3 h-3 text-purple-400" />
                              <span>Asociază un vehicul din stoc:</span>
                            </div>
                            <select
                              onChange={(e) => handleAssociateCar(lead.id, e.target.value)}
                              defaultValue=""
                              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-purple-400"
                            >
                              <option value="" disabled>Selectează mașină...</option>
                              {cars.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.brand} {c.model} ({c.year}) — {c.priceEur.toLocaleString('ro-RO')} €
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Notițe & Test Drive */}
                        {lead.notes && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 italic bg-black/30 p-2 rounded-lg border border-white/04">
                            „{lead.notes}”
                          </p>
                        )}

                        {lead.scheduledTestDriveAt && (
                          <div className="text-[10px] text-purple-300 flex items-center gap-1 font-semibold bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20">
                            <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>Test Drive: {lead.scheduledTestDriveAt}</span>
                          </div>
                        )}

                        {lead.recontactDate && (
                          <div className={`text-[10px] flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                            lead.recontactDate < new Date().toISOString().split('T')[0]
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : lead.recontactDate === new Date().toISOString().split('T')[0]
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-zinc-400 bg-white/5 border-white/5'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>Recontactare: {lead.recontactDate}</span>
                          </div>
                        )}

                        {/* Footer Card: Nivelul 1 - Acțiuni Contact & Management Lead */}
                        <div className="pt-2 border-t border-white/[0.06] space-y-2">
                          {/* Tier 1: Butoane Rapide Client (Acte, WhatsApp, Apel) */}
                          <div className="flex items-center gap-1.5">
                            {/* Buton 1-Click: Emite Proformă / Acte */}
                            <button
                              type="button"
                              onClick={() => handleOpenDocsForLead(lead)}
                              className="h-8 flex-1 min-w-0 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all touch-manipulation shadow-sm"
                              title="Emite Proformă de Avans sau Acte de Vânzare cu datele precompletate"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="font-bold">Acte</span>
                            </button>

                            {/* WhatsApp Direct cu Script Contextual pe Stadiu */}
                            <a
                              href={getWhatsAppUrlForLead(lead, car || null, dealer?.name || 'RXM Automobile')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/30 transition-all touch-manipulation shadow-sm"
                              title={`Deschide WhatsApp cu mesaj personalizat pentru stadiul ${columns[stageIdx]?.title || ''}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* Telefon Direct */}
                            <a
                              href={`tel:${lead.clientPhone}`}
                              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-400 border border-blue-500/30 transition-all touch-manipulation shadow-sm"
                              title="Apelează telefonic"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Tier 2: Stepper dedicat de Progres Pipeline pe întreaga lățime a cardului */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {stageIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveStatus(lead.id, stageOrder[stageIdx - 1])}
                                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white border border-white/10 touch-manipulation transition-all"
                                title={`Mută înapoi în: ${columns[stageIdx - 1]?.title || 'Stadiul anterior'}`}
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stageIdx < stageOrder.length - 1 ? (
                              <button
                                type="button"
                                onClick={() => handleMoveStatus(lead.id, stageOrder[stageIdx + 1])}
                                className="h-8 flex-1 min-w-0 px-2.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 active:scale-[0.98] text-purple-200 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center justify-between gap-1 touch-manipulation transition-all shadow-sm"
                                title={`Avansează lead-ul la stadiul următor: ${columns[stageIdx + 1]?.title}`}
                              >
                                <span className="truncate text-[11px] font-bold">
                                  {columns[stageIdx + 1]?.shortTitle || columns[stageIdx + 1]?.title.replace(/^\d+\.\s*/, '')}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-purple-300" />
                              </button>
                            ) : (
                              <div className="h-8 flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Livrat cu succes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog Sincronizare Status Stoc (Rezervat / Vândut) */}
      {statusSyncPrompt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#151518] border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Sincronizare Stoc Showroom: Marcare ca {statusSyncPrompt.targetCarStatus === 'reserved' ? 'Rezervat' : 'Vândut'}?
                </h4>
                <p className="text-xs text-zinc-400">
                  Lead-ul pentru <strong>{statusSyncPrompt.lead.clientName}</strong> avansează în stadiul: <strong className="text-amber-300">{getStatusLabel(statusSyncPrompt.targetLeadStatus)}</strong>
                </p>
              </div>
            </div>

            {/* Previzualizare Mașină */}
            <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center gap-3">
              {statusSyncPrompt.car.images && statusSyncPrompt.car.images[0] ? (
                <img 
                  src={statusSyncPrompt.car.images[0]} 
                  alt={statusSyncPrompt.car.brand} 
                  className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0" 
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Car className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-bold text-sm text-white">
                  {statusSyncPrompt.car.brand} {statusSyncPrompt.car.model} ({statusSyncPrompt.car.year})
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Preț: <span className="text-white font-bold">{statusSyncPrompt.car.priceEur.toLocaleString('ro-RO')} €</span> • VIN: <span className="font-mono text-zinc-300">{statusSyncPrompt.car.vin.slice(-6).toUpperCase()}</span>
                </div>
                <div className="text-[11px] text-amber-300 mt-1 font-semibold">
                  Status actual în parc: <span className="uppercase">{statusSyncPrompt.car.status}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Doriți să actualizați automat statusul acestei mașini în parcul auto pentru a reflecta <strong className="text-amber-400">{statusSyncPrompt.targetCarStatus === 'reserved' ? 'REZERVAT' : 'VÂNDUT'}</strong> și pe site-ul public?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmStatusSync(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Nu, păstrează în stoc
              </button>
              <button
                type="button"
                onClick={() => handleConfirmStatusSync(true)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Da, Marchează ca {statusSyncPrompt.targetCarStatus === 'reserved' ? 'Rezervat' : 'Vândut'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adăugare Lead Nou */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121215] border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Adăugare Client Nou (Lead)
              </h4>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Nume Client</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="Ex: Cristian Mureșan"
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Număr Telefon</label>
                <input
                  type="text"
                  required
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="0744..."
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Mașina de Interes din Stoc</label>
                <select
                  value={newLeadCarId}
                  onChange={(e) => setNewLeadCarId(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year}) — {c.priceEur.toLocaleString('ro-RO')} € ({c.status === 'in_stock' ? 'În Stoc' : c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Tip Tranzacție</label>
                  <select
                    value={newLeadDealType}
                    onChange={(e) => setNewLeadDealType(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="financing">Rate / Finanțare</option>
                    <option value="cash">Plată Cash</option>
                    <option value="buyback">Buy-Back Trade-In</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Canal Proveniență</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="showroom_web">Showroom Web</option>
                    <option value="olx">OLX România</option>
                    <option value="tiktok">TikTok Video</option>
                    <option value="phone_call">Apel Direct</option>
                    <option value="recommendation">Recomandare</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Notițe & Cerințe Specifice</label>
                <textarea
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="Ex: Interesat de avans 20%, dorește revizia inclusă..."
                  rows={2}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Salvează Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmare Hard Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Confirmare Hard Reset Lead-uri & Analytics</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Sigur doriți să resetați toate lead-urile și contorizările la <strong className="text-white">0</strong>? Această acțiune va goli registrul CRM și va reinițializa toate conversiile din Rapoarte & Analytics de la zero.
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
                onClick={handleHardReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Da, Resetează la 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ștergere Definitivă sau Marcare ca Pierdut (Ticket 02) */}
      {deleteModalLead && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gestiune Lead: {deleteModalLead.clientName}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{deleteModalLead.clientPhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalLead(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Opțiunea 1: Marcare ca Oportunitate Pierdută */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Opțiunea 1: Marchează ca Oportunitate Pierdută (Recomandat)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Păstrează istoricul și numărul de telefon în <strong>Arhiva Pierdute</strong> pentru reofertare ulterioară când intră mașini similare în stoc.
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] text-zinc-300 font-semibold block">Motiv Pierdere:</label>
                  <select
                    value={selectedLossReason}
                    onChange={(e) => setSelectedLossReason(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 min-h-[40px]"
                  >
                    {LOSS_REASONS.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>

                  {selectedLossReason === 'Alt motiv' && (
                    <input
                      type="text"
                      value={customLossReason}
                      onChange={(e) => setCustomLossReason(e.target.value)}
                      placeholder="Specificați motivul pierderii..."
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 mt-2 min-h-[40px]"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmMarkAsLost}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-[0.98] transition-all touch-manipulation min-h-[42px]"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Marchează ca Pierdut & Arhivează</span>
                </button>
              </div>

              {/* Opțiunea 2: Ștergere Definitivă */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Opțiunea 2: Ștergere Definitivă din Sistem</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Elimină ireversibil acest contact din baza de date fără arhivare (util pentru apeluri spam, numere greșite sau teste).
                </p>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-full py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all touch-manipulation min-h-[42px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Șterge Definitiv</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalLead(null)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs border border-white/10 transition-all touch-manipulation min-h-[42px]"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editare Rapidă Lead (Ticket 03) */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editează Lead: {editingLead.clientName}</h3>
                  <p className="text-xs text-zinc-400">Actualizare date client, vehicul, finanțare sau programare</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Nume Client *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Număr Telefon *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400 min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Email (Opțional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="client@domeniu.ro"
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Mașină din Stoc</label>
                <select
                  value={editCarId}
                  onChange={(e) => setEditCarId(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                >
                  <option value="">-- Fără mașină asociată din stoc --</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year}) — {c.priceEur.toLocaleString('ro-RO')} € ({c.status === 'in_stock' ? 'În Stoc' : c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Tip Tranzacție</label>
                  <select
                    value={editDealType}
                    onChange={(e) => setEditDealType(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                  >
                    <option value="financing">Rate / Finanțare</option>
                    <option value="cash">Plată Cash</option>
                    <option value="buyback">Buy-Back Trade-In</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Canal Proveniență</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="showroom_web">Showroom Web</option>
                    <option value="olx">OLX România</option>
                    <option value="tiktok">TikTok Video</option>
                    <option value="phone_call">Apel Direct</option>
                    <option value="recommendation">Recomandare</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Stadiu Curent</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 min-h-[42px]"
                  >
                    <option value="new">1. Contact Nou</option>
                    <option value="testdrive">2. Test-Drive Programat</option>
                    <option value="financing">3. Dosar Finanțare Trimis</option>
                    <option value="proforma">4. Proformă Avans Emisă</option>
                    <option value="closed_won">5. Vândut & Livrat</option>
                    <option value="closed_lost">Pierdut (Arhivă)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Programare Test-Drive</label>
                  <input
                    type="text"
                    value={editTestDriveAt}
                    onChange={(e) => setEditTestDriveAt(e.target.value)}
                    placeholder="Ex: 2026-10-18 11:30"
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400 min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block">Dată Recontactare</label>
                  <input
                    type="date"
                    value={editRecontactDate}
                    onChange={(e) => setEditRecontactDate(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400 min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block">Notițe & Cerințe Client</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Detalii negocieri, cerințe specifice, preferințe avans..."
                  rows={3}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs border border-white/10 transition-all touch-manipulation min-h-[42px]"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 active:scale-[0.98] transition-all touch-manipulation min-h-[42px]"
                >
                  Salvează Modificările
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Arhivă Oportunități Pierdute (Ticket 02) */}
      {isLostArchiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Arhivă Oportunități Pierdute ({lostLeads.length})</h3>
                  <p className="text-xs text-zinc-400">Lead-uri nefinalizate. Puteți reactiva oricând un contact la apariția unei oferte noi.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLostArchiveOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {lostLeads.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 italic">
                  Nu există lead-uri în arhiva de oportunități pierdute.
                </div>
              ) : (
                lostLeads.map(lead => {
                  const car = lead.carId ? cars.find(c => c.id === lead.carId) : null;
                  return (
                    <div
                      key={lead.id}
                      className="bg-black/40 border border-white/10 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{lead.clientName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-white/10">
                            {lead.clientPhone}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span>Mașină: <strong className="text-zinc-300">{lead.carTitle || (car ? `${car.brand} ${car.model}` : 'Nespecificată')}</strong></span>
                          {lead.carPriceEur && (
                            <span className="font-mono text-zinc-400">({lead.carPriceEur.toLocaleString('ro-RO')} €)</span>
                          )}
                        </div>
                        {lead.notes && (
                          <p className="text-[11px] text-amber-300/80 italic line-clamp-2">
                            {lead.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReactivateLostLead(lead.id)}
                          className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all touch-manipulation"
                          title="Reactivează lead-ul și repune-l în Contact Nou"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reactivează</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteLead(lead.id);
                            setLeads(prev => prev.filter(l => l.id !== lead.id));
                            showToast(`Lead-ul pentru ${lead.clientName} a fost șters definitiv.`);
                          }}
                          className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-all touch-manipulation"
                          title="Șterge definitiv"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsLostArchiveOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs border border-white/10 transition-all touch-manipulation min-h-[42px]"
              >
                Închide Arhiva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusLabel(status: DealerLeadStatus): string {
  switch (status) {
    case 'new': return 'Contact Nou 🔵';
    case 'testdrive': return 'Test-Drive Programat 🟣';
    case 'financing': return 'Dosar Finanțare Trimis 🟡';
    case 'negotiation': return 'În Negociere 🟡';
    case 'proforma': return 'Proformă Avans Emisă 🔷';
    case 'closed_won': return 'Vândut & Livrat 🟢';
    case 'closed_lost': return 'Pierdut ⚪';
  }
}
