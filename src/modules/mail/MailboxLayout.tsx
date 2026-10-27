/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Dark Luxury 3-Column Mailbox Interface (PMH-301)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * Design: Dark Luxury Dual-Theme (#09090b, font Plus Jakarta Sans, accent auriu)
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Inbox, Send, Clock, CheckCircle2, Archive, Star, Search, Filter, 
  Paperclip, Plus, ArrowLeft, RefreshCw, Car, Shield, User, ChevronRight, 
  Download, AlertCircle, FileText, Sparkles, X, Check, Eye, Zap, Lock, Unlock, Users,
  UserPlus, Trash2, BookOpen, Bell, BellRing, Smartphone
} from 'lucide-react';
import { 
  MailThreadItem, 
  MailMessageItem, 
  MailFolderStats, 
  MailAccountItem, 
  MailThreadStatus 
} from './types';
import { VehicleItem, DealerProfile } from '../../db/types';
import { vehicleRepository } from '../../services/vehicleRepository';
import { VehicleContextSidebar } from './VehicleContextSidebar';
import { VehicleOfferComposer } from './VehicleOfferComposer';
import { ShowroomMailGuideModal } from './ShowroomMailGuideModal';
import { getAdminAuthHeaders } from '../../utils/adminAuth';
import { pushNotificationService } from '../../services/pushNotificationService';

interface MailboxLayoutProps {
  dealerSlug?: string;
  dealershipName?: string;
  dealerProfile?: DealerProfile;
  cars?: VehicleItem[];
  showToast: (msg: string) => void;
  onSelectVehicle?: (vehicleId: string) => void;
}

const VAT_RATE = 0.21;
const WARRANTY_TERM = 'Cont de Garanție';
const RESERVATION_TERM = 'Garanție de Rezervare/Participare';

// Căsuțe implicite garantate per parc (Garantează că Mădălina și Robert sunt mereu prezenți)
export const DEFAULT_SHOWROOM_ACCOUNTS: Record<string, MailAccountItem[]> = {
  rxm: [
    {
      id: 'acc-rxm-madalina',
      dealer_id: 'rxm',
      email: 'contact@rxmautomobile.ro',
      display_name: 'Mădălina (Finanțare & Admin)',
      role: 'ADMIN',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'acc-rxm-robert',
      dealer_id: 'rxm',
      email: 'robert@rxmautomobile.ro',
      display_name: 'Robert (Showroom & Vânzări)',
      role: 'SALES',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
  mpi: [
    {
      id: 'acc-mpi-dan',
      dealer_id: 'mpi',
      email: 'contact@mpiauto.ro',
      display_name: 'Dan Morar (Lead Closer)',
      role: 'SALES',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'acc-mpi-andrei',
      dealer_id: 'mpi',
      email: 'andrei@mpiauto.ro',
      display_name: 'Andrei C. (Consilier Vânzări)',
      role: 'SALES',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'acc-mpi-alexandru',
      dealer_id: 'mpi',
      email: 'alexandru@mpiauto.ro',
      display_name: 'Alexandru P. (Consilier Vânzări)',
      role: 'SALES',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
};

export const MailboxLayout: React.FC<MailboxLayoutProps> = ({
  dealerSlug = 'rxm',
  dealershipName = 'RXM Automobile',
  dealerProfile,
  cars = [],
  showToast,
  onSelectVehicle,
}) => {
  // Stări Navigare Foldere & Filtre (PMH-304: Pool Showroom & My Leads)
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Căsuțe Consilieri Showroom (cu fallback garantat Mădălina & Robert și sincronizare localStorage)
  const [accounts, setAccounts] = useState<MailAccountItem[]>(() => {
    try {
      const saved = localStorage.getItem(`parcos_mail_accounts_${dealerSlug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SHOWROOM_ACCOUNTS[dealerSlug] || DEFAULT_SHOWROOM_ACCOUNTS['rxm'];
  });

  // Stare Agent Activ în Showroom (PMH-304: Multi-Agent Routing & Speed-to-Lead)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(() => {
    const saved = localStorage.getItem('parcos_mail_active_agent_id');
    if (saved) return saved;
    const initial = DEFAULT_SHOWROOM_ACCOUNTS[dealerSlug] || DEFAULT_SHOWROOM_ACCOUNTS['rxm'];
    return initial[0]?.id || null;
  });

  // Stare Modal Adăugare Agent Nou (PMH-304)
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newAgentEmail, setNewAgentEmail] = useState<string>('');
  const [newAgentRole, setNewAgentRole] = useState<'ADMIN' | 'SALES' | 'MECHANIC' | 'FINANCE' | 'SUPPORT'>('SALES');
  const [isSavingAgent, setIsSavingAgent] = useState<boolean>(false);

  // Stare Modal Ghid Operațional Showroom (PMH-301 - PMH-304)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Stare Panou Contextual Vehicul (PMH-302)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Stări Web Push & PWA Standalone (PMH-401, PMH-402)
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPushLoading, setIsPushLoading] = useState<boolean>(false);

  // Stări Date Server
  const [threads, setThreads] = useState<MailThreadItem[]>([]);
  const [activeThread, setActiveThread] = useState<MailThreadItem | null>(null);
  const [messages, setMessages] = useState<MailMessageItem[]>([]);
  const [stats, setStats] = useState<MailFolderStats>({
    unread_count: 0,
    pending_offer_count: 0,
    offer_sent_count: 0,
    reserved_count: 0,
    archived_count: 0,
    unassigned_count: 0,
    total_count: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Editor Răspuns Rapid
  const [replyText, setReplyText] = useState<string>('');
  const [isOfferMode, setIsOfferMode] = useState<boolean>(false);

  // Modal Inteligent Compunere Ofertă (PMH-303)
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);

  // Agentul selectat curent
  const currentAgent = useMemo(() => {
    return accounts.find((a) => a.id === activeAgentId) || accounts[0] || null;
  }, [accounts, activeAgentId]);

  // Sincronizare inițială cont activ
  useEffect(() => {
    if (accounts.length > 0 && (!activeAgentId || !accounts.some((a) => a.id === activeAgentId))) {
      setActiveAgentId(accounts[0].id);
      localStorage.setItem('parcos_mail_active_agent_id', accounts[0].id);
    }
  }, [accounts, activeAgentId]);

  // Inventar vehicule (prop sau fallback vehicleRepository)
  const availableCars = useMemo<VehicleItem[]>(() => {
    if (cars && cars.length > 0) return cars;
    return vehicleRepository.getVehicles(dealerSlug);
  }, [cars, dealerSlug]);

  // Vehicul activ asociat firului curent
  const activeVehicle = useMemo<VehicleItem | null>(() => {
    if (!activeThread) return null;
    if (activeThread.vehicle_id) {
      const match = availableCars.find((c) => c.id === activeThread.vehicle_id);
      if (match) return match;
    }
    if (activeThread.vehicle_vin) {
      const match = availableCars.find(
        (c) => c.vin && c.vin.toLowerCase() === activeThread.vehicle_vin!.toLowerCase()
      );
      if (match) return match;
    }
    if (activeThread.vehicle_brand && activeThread.vehicle_model) {
      const match = availableCars.find(
        (c) =>
          c.brand.toLowerCase() === activeThread.vehicle_brand!.toLowerCase() &&
          c.model.toLowerCase() === activeThread.vehicle_model!.toLowerCase()
      );
      if (match) return match;
    }
    return null;
  }, [activeThread, availableCars]);

  // Asociere / Dezasociere manuală vehicul la firul curent (PMH-302)
  const handleAssociateVehicle = async (vehicleId: string | null) => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/mail/threads/${selectedThreadId}/vehicle`, {
        method: 'PATCH',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(vehicleId ? '🚗 Vehicul asociat cu succes la fir.' : '🔗 Vehicul dezasociat de la fir.');
        if (data.thread) {
          setActiveThread(data.thread);
        } else {
          fetchThreadDetail(selectedThreadId);
        }
        fetchThreads();
      } else {
        showToast(`❌ Eroare asociere: ${data.error || 'Operațiune eșuată'}`);
      }
    } catch {
      showToast('❌ Eroare de rețea la asocierea vehiculului.');
    }
  };

  // Asignare / Preluare fir de conversație de către agent (PMH-304)
  const handleAssignThread = async (threadId: string, accountId: string | null) => {
    try {
      const res = await fetch(`/api/mail/threads/${threadId}/assign`, {
        method: 'PATCH',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const targetAcc = accounts.find((a) => a.id === accountId);
        if (accountId) {
          showToast(`⚡ Fir preluat cu succes de ${targetAcc?.display_name || 'agent'}!`);
        } else {
          showToast('🔄 Fir eliberat înapoi în Pool Showroom.');
        }
        if (data.thread) {
          setActiveThread(data.thread);
        } else {
          fetchThreadDetail(threadId);
        }
        fetchThreads();
      } else {
        showToast(`❌ Eroare la preluare: ${data.error || 'Operațiune eșuată'}`);
      }
    } catch {
      showToast('❌ Eroare de rețea la preluarea leadului.');
    }
  };

  // Inserare șablon sau fragment în editorul de răspuns
  const handleInsertReplySnippet = (snippetText: string) => {
    setReplyText(snippetText);
    setIsOfferMode(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Încărcare Threads & Statistici (cu suport Pool Showroom & My Leads)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/mail/threads?limit=50';
      if (activeFolder === 'unassigned') {
        url += '&assignedTo=unassigned';
      } else if (activeFolder === 'my_leads') {
        if (activeAgentId) {
          url += `&assignedTo=${activeAgentId}`;
        }
      } else if (activeFolder !== 'all') {
        url += `&status=${activeFolder.toUpperCase()}`;
      }

      const res = await fetch(url, { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn('[Mail Hub] Eroare la preluarea conversațiilor:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, activeAgentId]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/accounts', { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          localStorage.setItem(`parcos_mail_accounts_${dealerSlug}`, JSON.stringify(data.accounts));
          return;
        }
      }
    } catch {}
    // Fallback garantat în caz de server offline/dev local
    const fallback = DEFAULT_SHOWROOM_ACCOUNTS[dealerSlug] || DEFAULT_SHOWROOM_ACCOUNTS['rxm'];
    setAccounts((prev) => (prev.length > 0 ? prev : fallback));
  }, [dealerSlug]);

  // Creare Consilier Nou (PMH-304)
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentEmail.trim()) {
      showToast('⚠️ Vă rugăm să specificați numele și adresa de email.');
      return;
    }

    setIsSavingAgent(true);
    try {
      let createdAccount: MailAccountItem | null = null;
      try {
        const res = await fetch('/api/mail/accounts', {
          method: 'POST',
          headers: {
            ...getAdminAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: newAgentName.trim(),
            email: newAgentEmail.trim().toLowerCase(),
            role: newAgentRole,
            dealerId: dealerSlug,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          createdAccount = data.account;
        }
      } catch {}

      if (!createdAccount) {
        // Fallback local instantaneu
        createdAccount = {
          id: `acc-${dealerSlug}-${Date.now()}`,
          dealer_id: dealerSlug,
          email: newAgentEmail.trim().toLowerCase(),
          display_name: newAgentName.trim(),
          role: newAgentRole,
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }

      const updated = [...accounts.filter(a => a.email !== createdAccount!.email), createdAccount];
      setAccounts(updated);
      localStorage.setItem(`parcos_mail_accounts_${dealerSlug}`, JSON.stringify(updated));
      setActiveAgentId(createdAccount.id);
      localStorage.setItem('parcos_mail_active_agent_id', createdAccount.id);

      showToast(`✅ Consilierul ${createdAccount.display_name} a fost adăugat cu succes!`);
      setIsAddAgentModalOpen(false);
      setNewAgentName('');
      setNewAgentEmail('');
      setNewAgentRole('SALES');
    } catch (err: any) {
      showToast(`❌ Eroare la salvare: ${err.message || 'Operațiune eșuată'}`);
    } finally {
      setIsSavingAgent(false);
    }
  };

  // Dezactivare / Ștergere Consilier Showroom
  const handleDeleteAgent = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accounts.length <= 1) {
      showToast('⚠️ Trebuie să existe cel puțin un consilier activ în showroom.');
      return;
    }
    const agent = accounts.find((a) => a.id === accountId);
    if (!agent) return;
    if (!window.confirm(`Sigur doriți să dezactivați consilierul ${agent.display_name}? Conversațiile sale vor fi reatribuite automat către Admin.`)) {
      return;
    }

    try {
      await fetch(`/api/mail/accounts/${accountId}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
    } catch {}

    const updated = accounts.filter((a) => a.id !== accountId);
    setAccounts(updated);
    localStorage.setItem(`parcos_mail_accounts_${dealerSlug}`, JSON.stringify(updated));
    if (activeAgentId === accountId && updated.length > 0) {
      setActiveAgentId(updated[0].id);
      localStorage.setItem('parcos_mail_active_agent_id', updated[0].id);
    }
    showToast(`🗑️ Consilierul ${agent.display_name} a fost eliminat.`);
    fetchThreads();
  };

  useEffect(() => {
    fetchThreads();
    fetchAccounts();
  }, [fetchThreads, fetchAccounts]);

  // Înregistrare Service Worker și ascultare PWA install prompt & stare push (PMH-401, PMH-402)
  useEffect(() => {
    pushNotificationService.registerServiceWorker();
    setPushStatus(pushNotificationService.getPermissionStatus());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Încărcare Detalii Conversație Selectată
  // ─────────────────────────────────────────────────────────────────────────
  const fetchThreadDetail = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/mail/threads/${threadId}`, { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data.thread);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[Mail Hub] Eroare la preluarea mesajelor:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail(selectedThreadId);
    } else {
      setActiveThread(null);
      setMessages([]);
    }
  }, [selectedThreadId, fetchThreadDetail]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Trimitere Răspuns Direct (Outbound SES)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!selectedThreadId || !activeThread || !replyText.trim()) return;

    setIsSending(true);
    try {
      const lastMessage = messages[messages.length - 1];
      const res = await fetch(`/api/mail/threads/${selectedThreadId}/reply`, {
        method: 'POST',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: activeThread.customer_email,
          recipientName: activeThread.customer_name,
          subject: activeThread.subject.startsWith('Re:') ? activeThread.subject : `Re: ${activeThread.subject}`,
          textBody: replyText,
          htmlBody: `<div style="font-family: sans-serif; color: #111;">${replyText.replace(/\n/g, '<br/>')}</div>`,
          parentMessageId: lastMessage?.messageId,
          references: lastMessage ? [lastMessage.messageId] : [],
          isOffer: isOfferMode,
          dealershipName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✉️ Răspunsul a fost expediat prin AWS SES cu succes.');
        setReplyText('');
        setIsOfferMode(false);
        fetchThreadDetail(selectedThreadId);
        fetchThreads();
      } else {
        showToast(`❌ Eroare: ${data.error || 'Trimitere eșuată'}`);
      }
    } catch (err) {
      showToast('❌ Eroare de rețea la trimiterea mesajului.');
    } finally {
      setIsSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Inserare Șablon Ofertă Financiară (Strict 21% TVA & Garanție)
  // ─────────────────────────────────────────────────────────────────────────
  const handleInsertOfferTemplate = () => {
    if (!activeThread) return;

    const brand = activeThread.vehicle_brand || 'Autovehicul';
    const model = activeThread.vehicle_model || 'Showroom';
    const netPrice = activeThread.vehicle_price ? Number(activeThread.vehicle_price) : 25000;
    const tvaVal = netPrice * VAT_RATE;
    const grossPrice = netPrice + tvaVal;
    const clientName = activeThread.customer_name || 'Stimate Client';

    const offerSnippet = `Bună ziua, ${clientName},

Vă transmitem oferta de preț oficială pentru ${brand} ${model}${activeThread.vehicle_vin ? ` (VIN: ${activeThread.vehicle_vin})` : ''}:

• Preț Net: ${netPrice.toLocaleString('ro-RO')} EUR
• TVA deductibil (21%): ${tvaVal.toLocaleString('ro-RO')} EUR
• Preț Total Brut (TVA inclus): ${grossPrice.toLocaleString('ro-RO')} EUR
• Garanție Tehnică Inclusă: 12 luni
• Modalitate de Plată Securizată: ${WARRANTY_TERM} / ${RESERVATION_TERM}

Pentru blocarea autovehiculului sau inițierea contractului de vânzare, vă rugăm să ne confirmați prin răspuns la acest e-mail.

Cu respect,
Echipa de Vânzări • ${dealershipName}`;

    setReplyText(offerSnippet);
    setIsOfferMode(true);
    showToast('📑 Șablonul oficial de ofertă cu TVA 21% a fost inserat.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Schimbare Status Conversație
  // ─────────────────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (newStatus: MailThreadStatus) => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/mail/threads/${selectedThreadId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Status actualizat la: ${newStatus}`);
        fetchThreadDetail(selectedThreadId);
        fetchThreads();
      }
    } catch {
      showToast('Eroare la actualizarea statusului.');
    }
  };

  // Activare / Dezactivare Web Push (PMH-402)
  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      showToast('⚠️ Acest browser nu suportă notificări Web Push.');
      return;
    }

    if (pushStatus === 'granted') {
      showToast('🔔 Notificările Web Push sunt deja active pentru acest showroom.');
      return;
    }

    setIsPushLoading(true);
    try {
      const ok = await pushNotificationService.subscribe(activeAgentId || undefined, dealerSlug);
      if (ok) {
        setPushStatus('granted');
        showToast('🔔 Notificările Web Push au fost activate cu succes!');
      } else {
        setPushStatus(pushNotificationService.getPermissionStatus());
        showToast('⚠️ Permisiunea pentru notificări a fost refuzată sau nu a putut fi înregistrată.');
      }
    } catch (err: any) {
      showToast(`❌ Eroare activare push: ${err?.message || 'Operațiune eșuată'}`);
    } finally {
      setIsPushLoading(false);
    }
  };

  // Instalare PWA Standalone (PMH-401)
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        showToast('🚀 Aplicația ParcOS Mail a fost adăugată pe ecran!');
        setDeferredPrompt(null);
      }
    } else {
      showToast('ℹ️ Puteți instala aplicația direct din meniul browserului (Adaugă pe ecran / Install).');
    }
  };

  // Export GDPR Portabilitate Fir Complet (PMH-405)
  const handleExportGDPR = () => {
    if (!activeThread) return;
    const exportDossier = {
      export_version: '1.0',
      export_timestamp: new Date().toISOString(),
      platform: 'ParcOS Mail Hub — RXM Automobile',
      vat_rate: VAT_RATE,
      warranty_term: WARRANTY_TERM,
      reservation_term: RESERVATION_TERM,
      thread: {
        id: activeThread.id,
        dealer_id: activeThread.dealer_id,
        subject: activeThread.subject,
        status: activeThread.status,
        customer_email: activeThread.customer_email,
        customer_name: activeThread.customer_name,
        vehicle_id: activeThread.vehicle_id,
        vehicle_brand: activeThread.vehicle_brand,
        vehicle_model: activeThread.vehicle_model,
        vehicle_vin: activeThread.vehicle_vin,
        vehicle_price: activeThread.vehicle_price,
        assigned_account_id: activeThread.assigned_account_id,
        assigned_agent_name: activeThread.assigned_agent_name,
        created_at: activeThread.created_at,
        last_message_at: activeThread.last_message_at,
      },
      messages: messages.map((m) => ({
        id: m.id,
        messageId: m.messageId,
        direction: m.direction,
        sender: m.sender,
        recipient: m.recipient,
        bodyText: m.bodyText,
        createdAt: m.createdAt,
        attachment_count: m.attachments?.length || 0,
        attachments: (m.attachments || []).map((att) => ({
          fileName: att.fileName,
          mimeType: att.mimeType,
          fileSize: att.fileSize,
        })),
      })),
      associated_vehicle: activeVehicle || null,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportDossier, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeSubject = (activeThread.subject || 'thread').replace(/[^a-z0-9_-]/gi, '_').slice(0, 30);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gdpr_export_${activeThread.id}_${safeSubject}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('📁 Dosarul complet GDPR a fost descărcat în format JSON.');
  };

  // Filtrare locală după căutare
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase().trim();
    return threads.filter((t) => 
      t.subject.toLowerCase().includes(q) ||
      t.customer_email.toLowerCase().includes(q) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      (t.vehicle_brand && t.vehicle_brand.toLowerCase().includes(q)) ||
      (t.vehicle_model && t.vehicle_model.toLowerCase().includes(q))
    );
  }, [threads, searchQuery]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#09090b] text-[#f4f4f5] font-sans overflow-hidden border-t border-[#27272a]">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLOANA 1: Foldere, Căsuțe & Acțiuni Rapide                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="w-64 border-r border-[#27272a] bg-[#121215] flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Buton Compunere Nouă */}
          <button
            onClick={() => setIsComposeOpen(true)}
            className="w-full mb-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Mesaj Nou</span>
          </button>

          {/* Selector Agent Showroom (PMH-304: Multi-Agent Console) */}
          <div className="mb-5 bg-[#18181b] border border-[#27272a] rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#71717a] mb-1.5 px-0.5">
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-amber-400/90">
                <Users className="w-3.5 h-3.5" /> Agent Showroom
              </span>
              {currentAgent && (
                <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                  {currentAgent.role}
                </span>
              )}
            </div>
            <select
              value={activeAgentId || ''}
              onChange={(e) => {
                const newId = e.target.value;
                setActiveAgentId(newId);
                localStorage.setItem('parcos_mail_active_agent_id', newId);
                const found = accounts.find((a) => a.id === newId);
                if (found) showToast(`👤 Comutat pe agentul: ${found.display_name}`);
              }}
              className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.display_name} ({acc.role})
                </option>
              ))}
            </select>
          </div>

          {/* Listă Foldere */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#71717a] mb-2">
              Foldere Hub
            </p>

            <button
              onClick={() => setActiveFolder('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'all'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Toate Mesajele</span>
              </div>
              <span className="text-xs bg-[#27272a] px-2 py-0.5 rounded-full text-[#a1a1aa]">
                {stats.total_count}
              </span>
            </button>

            {/* 🔥 Pool Showroom (PMH-304: Speed-to-Lead) */}
            <button
              onClick={() => setActiveFolder('unassigned')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'unassigned'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
              title="Conversații sosite în showroom, neasociate încă niciunui agent"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="font-semibold text-white">Pool Showroom</span>
              </div>
              {(stats.unassigned_count ?? 0) > 0 ? (
                <span className="text-xs bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                  {stats.unassigned_count}
                </span>
              ) : (
                <span className="text-xs text-[#71717a]">0</span>
              )}
            </button>

            {/* 📥 Preluat de Mine */}
            <button
              onClick={() => setActiveFolder('my_leads')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'my_leads'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
              title="Lead-urile și conversațiile preluate de agentul activ"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Preluat de Mine</span>
              </div>
            </button>

            <button
              onClick={() => setActiveFolder('unread')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'unread'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Necitite</span>
              </div>
              {stats.unread_count > 0 && (
                <span className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  {stats.unread_count}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFolder('pending_offer')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'pending_offer'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Așteaptă Ofertă</span>
              </div>
              <span className="text-xs text-[#a1a1aa]">{stats.pending_offer_count}</span>
            </button>

            <button
              onClick={() => setActiveFolder('offer_sent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'offer_sent'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Ofertă Trimisă</span>
              </div>
              <span className="text-xs text-[#a1a1aa]">{stats.offer_sent_count}</span>
            </button>

            <button
              onClick={() => setActiveFolder('reserved')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'reserved'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Rezervate</span>
              </div>
              <span className="text-xs text-[#a1a1aa]">{stats.reserved_count}</span>
            </button>

            <button
              onClick={() => setActiveFolder('archived')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === 'archived'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#f4f4f5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-[#71717a]" />
                <span>Arhivate</span>
              </div>
              <span className="text-xs text-[#a1a1aa]">{stats.archived_count}</span>
            </button>
          </div>

          {/* Căsuțe Consilieri */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
                Consilieri Înregistrați
              </p>
              <button
                type="button"
                onClick={() => setIsAddAgentModalOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                title="Adaugă un consilier nou în echipa de vânzări"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Agent</span>
              </button>
            </div>
            <div className="space-y-1">
              {accounts.map((acc) => {
                const isCurrent = acc.id === activeAgentId;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setActiveAgentId(acc.id);
                      localStorage.setItem('parcos_mail_active_agent_id', acc.id);
                      showToast(`👤 Comutat pe agentul: ${acc.display_name}`);
                    }}
                    className={`group flex items-center justify-between px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20'
                        : 'text-[#a1a1aa] hover:bg-[#18181b]'
                    }`}
                  >
                    <span className="truncate max-w-[125px] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-[#3f3f46]'}`}></span>
                      {acc.display_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-[#27272a] px-1.5 py-0.5 rounded text-[#71717a]">
                        {acc.role}
                      </span>
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAgent(acc.id, e)}
                          title="Dezactivează acest consilier"
                          className="opacity-0 group-hover:opacity-100 text-[#71717a] hover:text-red-400 p-0.5 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Sidebar Info & Buton Ghid */}
        <div className="border-t border-[#27272a] pt-3 text-[11px] text-[#71717a] flex flex-col gap-2">
          {/* Web Push Notifications (PMH-402) */}
          <button
            type="button"
            onClick={handleTogglePush}
            disabled={isPushLoading}
            className={`w-full py-1.5 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
              pushStatus === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-amber-500/40 hover:text-white'
            }`}
            title="Activează notificările Web Push pentru lead-uri noi primite în showroom"
          >
            <div className="flex items-center gap-2">
              {pushStatus === 'granted' ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{pushStatus === 'granted' ? 'Notificări Active' : 'Activează Push'}</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${pushStatus === 'granted' ? 'bg-emerald-400 animate-pulse' : 'bg-[#52525b]'}`} />
          </button>

          {/* Standalone PWA Prompt (PMH-401) */}
          {deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl py-1.5 px-2.5 text-xs font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
              title="Instalează ParcOS Mail ca aplicație dedicată pe ecranul telefonului"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Instalează PWA Mobil</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl py-2 px-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Deschide ghidul operațional de utilizare a mailbox-ului și rutării în showroom"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>📖 Ghid Showroom & Agenți</span>
          </button>

          <div className="flex items-center justify-between">
            <span>ParcOS Engine • Cloud NVMe</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLOANA 2: Lista Conversațiilor (Thread List)                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="w-80 md:w-96 border-r border-[#27272a] bg-[#0c0c0e] flex flex-col flex-shrink-0">
        {/* Search Bar */}
        <div className="p-3 border-b border-[#27272a] flex items-center gap-2 bg-[#121215]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a]" />
            <input
              type="text"
              placeholder="Caută subiect, client, VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            onClick={() => fetchThreads()}
            title="Reîmprospătează lista"
            className="p-2 text-[#71717a] hover:text-amber-400 hover:bg-[#18181b] rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Lista de Threads */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e24]">
          {isLoading && threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717a]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              Se încarcă e-mailurile...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717a]">
              Nu există conversații în acest folder.
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThreadId === thread.id;
              const isUnread = thread.status === 'UNREAD';

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition-all border-l-2 ${
                    isSelected
                      ? 'bg-[#18181b] border-l-amber-500 shadow-md'
                      : isUnread
                      ? 'bg-[#121215] border-l-amber-500/80 hover:bg-[#161619]'
                      : 'hover:bg-[#141416] border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse"></span>
                      )}
                      <span className={`text-xs truncate max-w-[180px] ${isUnread ? 'font-bold text-[#fafafa]' : 'font-medium text-[#d4d4d8]'}`}>
                        {thread.customer_name || thread.customer_email}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#71717a] flex-shrink-0">
                      {new Date(thread.last_message_at).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className={`text-xs truncate mb-1.5 ${isUnread ? 'font-semibold text-white' : 'text-[#a1a1aa]'}`}>
                    {thread.subject}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge Vehicul (Click pentru deschidere Panou PMH-302) */}
                    {thread.vehicle_brand && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThreadId(thread.id);
                          setIsSidebarOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono cursor-pointer transition-colors"
                        title="Apasă pentru a deschide Fișa Contextuală a Vehiculului"
                      >
                        <Car className="w-2.5 h-2.5" />
                        {thread.vehicle_brand} {thread.vehicle_model}
                      </span>
                    )}

                    {/* Badge Consilier / Pool (PMH-304) */}
                    {thread.assigned_account_id ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                        thread.assigned_account_id === activeAgentId
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        <Lock className="w-2.5 h-2.5" />
                        {thread.assigned_account_id === activeAgentId ? 'Tu' : (thread.assigned_agent_name?.split(' ')[0] || 'Agent')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        Pool Liber
                      </span>
                    )}

                    {/* Badge Status */}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      thread.status === 'PENDING_OFFER'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : thread.status === 'OFFER_SENT'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : thread.status === 'RESERVED'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-[#27272a] text-[#a1a1aa]'
                    }`}>
                      {thread.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* COLOANA 3: Panou Conversație, Context Vehicul & Răspuns            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
        {activeThread ? (
          <>
            {/* Header Conversație */}
            <div className="p-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-white truncate">
                    {activeThread.subject}
                  </h2>
                  <span className="text-xs bg-[#27272a] px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                    {activeThread.status}
                  </span>
                </div>
                <p className="text-xs text-[#a1a1aa]">
                  Client: <strong className="text-white">{activeThread.customer_name || 'Nespecificat'}</strong> ({activeThread.customer_email})
                </p>
              </div>

              {/* Acțiuni Rapide pe Thread & Buton Panou Vehicul */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* ⚡ 1-Click Claim / Gestionare Consilier (PMH-304) */}
                {!activeThread.assigned_account_id ? (
                  <button
                    type="button"
                    onClick={() => handleAssignThread(activeThread.id, activeAgentId)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    title="Preia imediat acest lead în gestiunea ta exclusivă (Primul venit, primul servit)"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>⚡ Preia Leadul</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs">
                    {activeThread.assigned_account_id === activeAgentId ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-emerald-300 font-medium">Preluat de tine</span>
                        <button
                          type="button"
                          onClick={() => handleAssignThread(activeThread.id, null)}
                          title="Eliberează firul înapoi în Pool Showroom pentru ceilalți colegi"
                          className="ml-1 text-[10px] text-[#71717a] hover:text-red-400 underline"
                        >
                          Eliberează
                        </button>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span className="text-[#a1a1aa]">
                          Preluat: <strong className="text-purple-300">{activeThread.assigned_agent_name || 'Agent'}</strong>
                        </span>
                      </>
                    )}

                    {/* Selector Reasignare / Transfer către coleg */}
                    <select
                      value={activeThread.assigned_account_id || ''}
                      onChange={(e) => handleAssignThread(activeThread.id, e.target.value ? e.target.value : null)}
                      className="bg-transparent border-none text-[11px] text-[#71717a] hover:text-white focus:outline-none cursor-pointer"
                      title="Transferă leadul către alt consilier sau înapoi în Pool"
                    >
                      <option value="" disabled>Transferă...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-[#18181b] text-white">
                          → {acc.display_name}
                        </option>
                      ))}
                      <option value="" className="bg-[#18181b] text-amber-300">
                        ⚡ Înapoi în Pool Showroom
                      </option>
                    </select>
                  </div>
                )}

                {/* Buton Deschide Panou Vehicul (PMH-302) */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    isSidebarOpen
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#18181b] hover:bg-[#27272a] text-[#f4f4f5] border border-[#27272a]'
                  }`}
                  title="Deschide panoul contextual de vânzări și detalii vehicul (PMH-302)"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{activeVehicle || activeThread.vehicle_brand ? 'Panou Vehicul' : 'Asociază Vehicul'}</span>
                </button>

                <select
                  value={activeThread.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as MailThreadStatus)}
                  className="bg-[#18181b] border border-[#27272a] text-xs text-[#f4f4f5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="UNREAD">Marchează Necitit</option>
                  <option value="READ">Citit</option>
                  <option value="PENDING_OFFER">Așteaptă Ofertă</option>
                  <option value="OFFER_SENT">Ofertă Trimisă</option>
                  <option value="RESERVED">Rezervat</option>
                  <option value="ARCHIVED">Arhivează</option>
                </select>

                {/* Export GDPR Portabilitate (PMH-405) */}
                <button
                  type="button"
                  onClick={handleExportGDPR}
                  className="bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                  title="Export Dosar Conformitate GDPR (JSON complet fir, mesaje, atașamente)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">GDPR</span>
                </button>
              </div>
            </div>

            {/* Context Spotlight Vehicul Asociat */}
            {activeThread.vehicle_brand ? (
              <div 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-gradient-to-r from-[#18181b] to-[#121215] border-b border-[#27272a] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#19191d] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {activeThread.vehicle_brand} {activeThread.vehicle_model}
                      </h4>
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        (Apasă pentru Fișă & Ofertă)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                      {activeThread.vehicle_price && (
                        <span>
                          Preț: <strong className="text-emerald-400">{Number(activeThread.vehicle_price).toLocaleString('ro-RO')} €</strong>
                          {activeVehicle?.vatDeductible ? ' (TVA 21% deductibil)' : ' (Regim de marjă art. 312)'}
                        </span>
                      )}
                      {activeThread.vehicle_vin && (
                        <span className="font-mono text-[#71717a]">VIN: {activeThread.vehicle_vin}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Panou Vânzări</span>
                  </button>
                  <button
                    onClick={() => setIsComposeOpen(true)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Compune Ofertă</span>
                  </button>
                  {activeThread.vehicle_id && onSelectVehicle && (
                    <button
                      onClick={() => onSelectVehicle(activeThread.vehicle_id!)}
                      className="bg-[#27272a] hover:bg-[#3f3f46] text-[#f4f4f5] text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vezi în Stoc</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Prompt discret când firul nu are mașină detectată automat */
              <div className="px-4 py-2 bg-[#141417] border-b border-[#27272a] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#a1a1aa] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
                  <span>Niciun vehicul asociat automat la această conversație.</span>
                </span>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Asociază Vehicul din Stoc</span>
                </button>
              </div>
            )}

            {/* Istoric Mesaje din Conversație */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOutbound = msg.direction === 'OUTBOUND';

                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl p-4 border ${
                      isOutbound
                        ? 'ml-auto bg-[#1c1917]/70 border-amber-500/30 shadow-lg'
                        : 'mr-auto bg-[#18181b] border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#27272a]/50 text-xs text-[#a1a1aa]">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isOutbound ? 'bg-amber-500 text-black' : 'bg-[#3f3f46] text-white'
                        }`}>
                          {isOutbound ? 'RX' : msg.sender.substring(0, 2).toUpperCase()}
                        </span>
                        <span className="font-semibold text-white">
                          {isOutbound ? `${dealershipName} (Outbound)` : msg.sender}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">
                        {new Date(msg.createdAt).toLocaleString('ro-RO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Corp Mesaj */}
                    <div className="text-xs text-[#e4e4e7] leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.bodyText || (msg.bodyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                      ) : (
                        '(Fără conținut text)'
                      ))}
                    </div>

                    {/* Atașamente Mesaj */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#27272a] space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-[#71717a]">Atașamente ({msg.attachments.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={`/api/mail/attachments/${att.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#f4f4f5] px-2.5 py-1 rounded text-xs transition-colors"
                            >
                              <Paperclip className="w-3 h-3 text-amber-400" />
                              <span className="truncate max-w-[150px]">{att.fileName}</span>
                              <span className="text-[10px] text-[#71717a]">
                                ({Math.round(att.fileSize / 1024)} KB)
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Editor Răspuns Rapid */}
            <div className="p-3 border-t border-[#27272a] bg-[#121215]">
              <div className="relative">
                <textarea
                  rows={4}
                  placeholder={`Scrie răspunsul către ${activeThread.customer_email}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-amber-500/50 resize-none font-sans"
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertOfferTemplate}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inserează Ofertă Oficială</span>
                  </button>
                  <span className="text-xs text-[#71717a]">|</span>
                  <span className="text-[11px] text-[#71717a]">Livrat prin AWS SES cu DKIM & Threading</span>
                </div>

                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isSending || !replyText.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform active:scale-95 shadow-md shadow-amber-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Se trimite...' : 'Trimite Răspuns'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#71717a]">
            <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 text-amber-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Selectează o Conversație
            </h3>
            <p className="text-xs max-w-sm text-[#a1a1aa]">
              Alege un fir de discuție din lista din stânga pentru a vizualiza mesajele, a atașa oferte sau a răspunde direct prin SES Outbound.
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL INTELIGENT COMPUNERE OFERTĂ (PMH-303)                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <VehicleOfferComposer
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        allVehicles={availableCars}
        preselectedVehicle={activeVehicle}
        activeThread={activeThread}
        dealershipName={dealershipName}
        dealerSlug={dealerSlug}
        dealerProfile={dealerProfile}
        showToast={showToast}
        onOfferSent={(threadId) => {
          fetchThreads();
          if (threadId) {
            setSelectedThreadId(threadId);
            fetchThreadDetail(threadId);
          }
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PANOU CONTEXTUAL VEHICUL (PMH-302 Slide-over Drawer)                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <VehicleContextSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        vehicle={activeVehicle}
        allVehicles={availableCars}
        activeThread={activeThread}
        dealershipName={dealershipName}
        dealerProfile={dealerProfile}
        onAssociateVehicle={handleAssociateVehicle}
        onInsertReplySnippet={handleInsertReplySnippet}
        onOpenOfferComposer={() => setIsComposeOpen(true)}
        onSelectVehicleInCatalog={onSelectVehicle}
        showToast={showToast}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL ADĂUGARE AGENT SHOWROOM (PMH-304)                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddAgentModalOpen(false)}
              className="absolute top-4 right-4 text-[#71717a] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Adaugă Consilier Showroom</h3>
                <p className="text-xs text-[#a1a1aa]">Creează căsuță internă și acces de rutare pentru agent</p>
              </div>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Nume și Prenume Consilier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dan Morar, Andrei Popescu"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Adresă E-mail Showroom *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: dan@rxmautomobile.ro sau dan@mpiauto.ro"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Rol & Departament în Parc
                </label>
                <select
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value as any)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="SALES">💼 Consilier Vânzări (SALES - Lead Closer)</option>
                  <option value="ADMIN">👑 Director Parc / Administrator (ADMIN)</option>
                  <option value="FINANCE">💰 Consilier Credite & Finanțare (FINANCE)</option>
                  <option value="MECHANIC">🔧 Inspecție Tehnică / Service (MECHANIC)</option>
                  <option value="SUPPORT">🎧 Relații Clienți & Asistență (SUPPORT)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAgentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSavingAgent}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingAgent ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Salvează Agentul</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📖 Modal Ghid Operațional Showroom & Agenți (PMH-301 - PMH-304) */}
      <ShowroomMailGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenAddAgent={() => setIsAddAgentModalOpen(true)}
        dealershipName={dealershipName}
      />
    </div>
  );
};
