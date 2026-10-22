import React, { useState, useMemo } from 'react';
import { 
  Building2, Server, Shield, Sparkles, Plus, Search, Filter, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Palette, 
  FileText, QrCode, Share2, Film, RefreshCw, LogOut, ArrowRight, 
  Sliders, Check, X, ShieldAlert, Download, Eye, Zap, Database, Clock,
  Menu, Landmark, Globe, Key, Mail, Radio, DollarSign, Cpu, Copy,
  CheckCircle, SlidersHorizontal, Lock, Save
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { DealerProfile, SEED_DEALER } from '../../db/seed';
import { TenantFeatures, TenantTier, TenantStatus, DealerThemePreset } from '../../db/types';
import { SuperAdminOnboardingModal } from '../admin/SuperAdminOnboardingModal';
import { SuperAdminSidebar, SuperAdminNavTab } from './SuperAdminSidebar';

interface ParcOSSuperAdminHubProps {
  onBackToSaas: () => void;
  onImpersonateTenant: (slug: string) => void;
  onLogoutSuperAdmin?: () => void;
  showToast: (msg: string) => void;
}

const THEME_LABELS: Record<DealerThemePreset, { label: string; badge: string; dot: string }> = {
  obsidian_gold: { label: 'Obsidian Gold', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  clean_white: { label: 'Clean White', badge: 'bg-zinc-100/10 text-white border-white/20', dot: 'bg-white' },
  midnight_blue: { label: 'Midnight Blue', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  carbon_red: { label: 'Carbon Red', badge: 'bg-red-500/10 text-red-300 border-red-500/30', dot: 'bg-red-400' },
  emerald_prestige: { label: 'Emerald Prestige', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
};

const FEATURE_DEFINITIONS: { key: keyof TenantFeatures; label: string; desc: string; icon: any }[] = [
  { key: 'ocrCivTalon', label: 'Scanner OCR CIV & Talon', desc: 'Scanare automată acte auto din cameră / fișier PDF v9 Vision', icon: Zap },
  { key: 'fgoInvoicing', label: 'FGO Facturare & Proforme', desc: 'Emitere 1-click proforme avans și facturi fiscale prin API v2 FGO.ro', icon: FileText },
  { key: 'salesDocsEngine', label: 'Centru Acte Vânzare', desc: 'Generare instantanee contracte DITL, procese-verbale și garanții', icon: Landmark },
  { key: 'tikTokStudio', label: 'TikTok Reel Studio (9:16)', desc: 'Generare automată clipuri video verticale de prezentare stoc', icon: Film },
  { key: 'olxStockSync', label: 'Sincronizare Portaluri Auto', desc: 'Import și reconciliere automată a parcului cu OLX / Autovit (Nod S9)', icon: RefreshCw },
  { key: 'financingCalculator', label: 'Calculator Rate BT / TBI', desc: 'Simulare leasing și credit auto direct în showroom cu Cont de Garanție', icon: DollarSign },
  { key: 'windowStickersQr', label: 'Fișe Parbriz Smart QR', desc: 'Fișe A4 printabile cu cod QR direct către pagina mașinii', icon: QrCode },
  { key: 'whatsappLeadsBot', label: 'Lead Bot WhatsApp', desc: 'Pre-completare cotații și preluare rapidă clienți pe WhatsApp', icon: Sparkles },
  { key: 'autolicitPush', label: 'AutoLicit.ro B2B Push', desc: 'Export 1-click în bursa licitațiilor auto B2B holding CARVANA SRL', icon: Share2 },
];

export const ParcOSSuperAdminHub: React.FC<ParcOSSuperAdminHubProps> = ({
  onBackToSaas,
  onImpersonateTenant,
  onLogoutSuperAdmin,
  showToast
}) => {
  const { allTenants, updateTenantFeatures, updateTenantStatus, updateTenantProfile, registerTenant } = useTenant();
  
  // Stări de navigare & selecție în SuperAdmin
  const [activeNavTab, setActiveNavTab] = useState<SuperAdminNavTab>('tenants_overview');
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>('rxm');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Stări de filtrare & modale
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | TenantStatus>('all');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [editingFeaturesTenant, setEditingFeaturesTenant] = useState<DealerProfile | null>(null);

  // Stare formular editare profil tenant
  const [editedLegalName, setEditedLegalName] = useState('');
  const [editedCui, setEditedCui] = useState('');
  const [editedRegCom, setEditedRegCom] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedPhonePrimary, setEditedPhonePrimary] = useState('');
  const [editedWhatsapp, setEditedWhatsapp] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedBankName, setEditedBankName] = useState('Banca Transilvania');
  const [editedIbanRon, setEditedIbanRon] = useState('');
  const [editedDomain, setEditedDomain] = useState('');

  // Stare formular integrare FGO
  const [fgoApiKey, setFgoApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [fgoCui, setFgoCui] = useState('');
  const [fgoSeriesFiscal, setFgoSeriesFiscal] = useState('RXM');
  const [fgoSeriesProforma, setFgoSeriesProforma] = useState('PROF');
  const [fgoEnvironment, setFgoEnvironment] = useState<'live' | 'test'>('live');
  const [fgoDefaultRegime, setFgoDefaultRegime] = useState<'margin_scheme' | 'standard_vat'>('margin_scheme');
  const [fgoAutoSendSpv, setFgoAutoSendSpv] = useState(true);

  // Lista completă a parcurilor din registrul global
  const tenantsList = useMemo(() => {
    return Object.entries(allTenants).map(([slug, profile]) => ({
      ...profile,
      slug: profile.slug || slug,
      tier: profile.tier || 'starter',
      status: profile.status || 'active',
      maxVehiclesQuota: profile.maxVehiclesQuota || 25,
      features: profile.features || {
        ocrCivTalon: true,
        olxStockSync: true,
        tikTokStudio: true,
        autolicitPush: false,
        salesDocsEngine: true,
        windowStickersQr: true,
        financingCalculator: true,
        whatsappLeadsBot: true,
        fgoInvoicing: false,
      }
    }));
  }, [allTenants]);

  // Tenant curent selectat
  const currentTenant = useMemo(() => {
    return tenantsList.find(t => (t.slug || '').toLowerCase() === selectedTenantSlug.toLowerCase()) || tenantsList[0] || SEED_DEALER;
  }, [tenantsList, selectedTenantSlug]);

  // Sincronizare formular când se schimbă tenantul selectat
  React.useEffect(() => {
    if (currentTenant) {
      setEditedLegalName(currentTenant.name || '');
      setEditedCui(currentTenant.cui || '');
      setEditedRegCom(currentTenant.regCom || '');
      setEditedAddress(currentTenant.address || '');
      setEditedPhonePrimary(currentTenant.phonePrimary || '');
      setEditedWhatsapp(currentTenant.whatsappNumber || '');
      setEditedEmail(currentTenant.email || '');
      setEditedBankName(currentTenant.bankName || 'Banca Transilvania');
      setEditedIbanRon(currentTenant.ibanRon || '');
      setEditedDomain(currentTenant.domain || '');

      // Încărcare date FGO din config dacă există
      const fgoCfg = currentTenant.config?.invoicing?.fgo;
      if (fgoCfg) {
        setFgoApiKey(fgoCfg.apiKey || '');
        setFgoCui(fgoCfg.cui || currentTenant.cui?.replace(/[^0-9]/g, '') || '');
        setFgoSeriesFiscal(fgoCfg.seriesFiscal || 'RXM');
        setFgoSeriesProforma(fgoCfg.seriesProforma || 'PROF');
        setFgoEnvironment(fgoCfg.environment || 'live');
        setFgoDefaultRegime(fgoCfg.defaultRegime || 'margin_scheme');
        setFgoAutoSendSpv(fgoCfg.autoSendSpv !== false);
      } else {
        setFgoCui(currentTenant.cui?.replace(/[^0-9]/g, '') || '');
      }
    }
  }, [currentTenant]);

  // Salvare modificări profil tenant
  const handleSaveTenantProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant?.slug) return;

    updateTenantProfile(currentTenant.slug, {
      name: editedLegalName,
      cui: editedCui,
      regCom: editedRegCom,
      address: editedAddress,
      phonePrimary: editedPhonePrimary,
      whatsappNumber: editedWhatsapp,
      email: editedEmail,
      bankName: editedBankName,
      ibanRon: editedIbanRon,
      domain: editedDomain,
    });

    showToast(`✓ Datele pentru ${editedLegalName} au fost salvate cu succes!`);
  };

  // Salvare setări integrare FGO
  const handleSaveFgoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant?.slug) return;

    const updatedConfig = {
      ...(currentTenant.config || {}),
      invoicing: {
        provider: 'fgo',
        fgo: {
          apiKey: fgoApiKey,
          cui: fgoCui,
          platformUrl: currentTenant.domain ? `https://${currentTenant.domain}` : 'https://parcos.ro',
          seriesFiscal: fgoSeriesFiscal,
          seriesProforma: fgoSeriesProforma,
          environment: fgoEnvironment,
          defaultRegime: fgoDefaultRegime,
          autoSendSpv: fgoAutoSendSpv
        }
      }
    };

    updateTenantProfile(currentTenant.slug, {
      config: updatedConfig,
      features: {
        ...(currentTenant.features as TenantFeatures),
        fgoInvoicing: Boolean(fgoApiKey.trim())
      }
    });

    showToast(`✓ Integrarea FGO a fost salvată pentru ${currentTenant.name}!`);
  };

  // Test conexiune FGO simulată
  const handleTestFgoConnection = () => {
    if (!fgoApiKey.trim() || !fgoCui.trim()) {
      showToast('⚠️ Vă rugăm să completați Cheia API și CUI-ul firmei înainte de testare.');
      return;
    }
    showToast(`🔍 Conectare la FGO API v2 (${fgoEnvironment.toUpperCase()})...`);
    setTimeout(() => {
      showToast(`✅ Conexiune confirmată cu succes! CUI: ${fgoCui} • Serii active: ${fgoSeriesFiscal} / ${fgoSeriesProforma}`);
    }, 800);
  };

  // 1-Click Global Feature Propagation (Activează pe Toate Showroom-urile)
  const handlePropagateAllFeaturesGlobally = () => {
    tenantsList.forEach(t => {
      updateTenantFeatures(t.slug, {
        ocrCivTalon: true,
        fgoInvoicing: true,
        salesDocsEngine: true,
        windowStickersQr: true,
        financingCalculator: true,
        whatsappLeadsBot: true,
        tikTokStudio: true,
        olxStockSync: true,
        autolicitPush: true
      });
    });
    showToast(`🚀 Toate cele 9 module au fost propagate instantaneu pe toate cele ${tenantsList.length} parcuri active!`);
  };

  // Filtrare căutare și status
  const filteredTenants = useMemo(() => {
    return tenantsList.filter(t => {
      const matchSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cui.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchStatus = selectedStatusFilter === 'all' || t.status === selectedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [tenantsList, searchQuery, selectedStatusFilter]);

  // Metrici agregate
  const metrics = useMemo(() => {
    const totalTenants = tenantsList.length;
    const activeTenants = tenantsList.filter(t => t.status === 'active').length;
    const ocrEnabledCount = tenantsList.filter(t => t.features?.ocrCivTalon).length;
    const fgoEnabledCount = tenantsList.filter(t => t.features?.fgoInvoicing).length;
    const totalCapacity = tenantsList.reduce((acc, t) => acc + (t.maxVehiclesQuota || 25), 0);
    return { totalTenants, activeTenants, ocrEnabledCount, fgoEnabledCount, totalCapacity };
  }, [tenantsList]);

  // Export JSON backup tenant
  const handleExportBackup = (tenant: DealerProfile) => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tenant, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `parcos_backup_${tenant.slug || 'tenant'}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast(`✓ Backup JSON descărcat pentru ${tenant.name}`);
    } catch {
      showToast('Eroare la descărcarea backup-ului.');
    }
  };

  // Comutare rapidă feature flag
  const handleToggleFeature = (slug: string, featureKey: keyof TenantFeatures, currentValue: boolean) => {
    updateTenantFeatures(slug, { [featureKey]: !currentValue });
    showToast(`✓ Modulul ${featureKey} a fost ${!currentValue ? 'activat' : 'dezactivat'} pentru ${slug}`);
    
    if (editingFeaturesTenant && editingFeaturesTenant.slug === slug) {
      setEditingFeaturesTenant(prev => prev ? ({
        ...prev,
        features: {
          ...(prev.features as TenantFeatures),
          [featureKey]: !currentValue
        }
      }) : null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-300 flex flex-col lg:flex-row">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR CENTRAL SUPERADMIN & TENANT SWITCHER                           */}
      {/* ========================================================================= */}
      <SuperAdminSidebar
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        selectedTenantSlug={selectedTenantSlug}
        onSelectTenantSlug={setSelectedTenantSlug}
        tenants={tenantsList}
        onImpersonate={onImpersonateTenant}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onBackToSaas={onBackToSaas}
        onLogout={onLogoutSuperAdmin}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 2. ZONĂ CONȚINUT PRINCIPAL (RESPONSIVE)                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Header pe mobil & breadcrumb */}
        <header className="sticky top-0 z-30 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">ParcOS SuperAdmin</span>
              <span className="text-zinc-600">/</span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {currentTenant.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onImpersonateTenant(currentTenant.slug || 'rxm')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all cursor-pointer shadow-sm"
              title="Intră în modul DMS direct în acest showroom"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Masquerade DMS</span>
            </button>
          </div>
        </header>

        {/* Corpul Paginii în funcție de tab-ul activ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* Banner Protecție & Control Sandbox */}
          {Boolean(currentTenant.slug === 'rxm_sandbox' || currentTenant.config?.isSandboxEnvironment) && (
            <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent border-2 border-orange-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-black">
                  <ShieldAlert className="w-3.5 h-3.5" /> MEDIU SANDBOX DE TEST — CLONĂ 1:1 RXM AUTOMOBILE
                </div>
                <p className="text-xs text-zinc-300">
                  Baza de date este complet izolată (<code className="text-orange-400 font-mono">dealer_slug = 'rxm_sandbox'</code>). FGO este forțat pe test UAT, SPV ANAF este oprit. Datele reale RXM Prod sunt 100% protejate.
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Consum măsurat pe Netcup VPS: ~35 MB RAM (0.6% din resursele libere). Poate rula liniștit 24/7 sau fi pus în Standby la nevoie.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    showToast('⏳ Se realizează snapshot 1:1 din RXM Prod către Sandbox...');
                    setTimeout(() => {
                      showToast('✅ Sandbox re-sincronizat cu succes! Stocul și setările au fost replicate.');
                    }, 1000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black transition-all cursor-pointer shadow-sm"
                  title="Replică stocul curent din RXM Prod în Sandbox"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Sync din Prod (1:1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = currentTenant.status === 'active' ? 'suspended' : 'active';
                    updateTenantStatus('rxm_sandbox', nextStatus);
                    showToast(`✓ Stare Sandbox comutată în: ${nextStatus === 'active' ? 'Activ 24/7' : 'Standby / Hibernat'}`);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currentTenant.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                  title="Oprește sau pornește mediul de test"
                >
                  <span className={`w-2 h-2 rounded-full ${currentTenant.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                  <span>{currentTenant.status === 'active' ? 'Activ 24/7' : 'Standby'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 1: REGISTRU GLOBAL PARCURI & AUDIT FLOTĂ                          */}
          {/* ===================================================================== */}
          {activeNavTab === 'tenants_overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Banner Hero cu lansare asistent înrolare */}
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/[0.04] to-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                      <Shield className="w-3.5 h-3.5" />
                      Gestiune Centralizată Ecosistem B2B
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Registrul Suveran al Parcurilor Auto Partenere
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      Supervizează instanțele autonome, gestionează integrarea FGO, alocă pachete de funcționalități și oferă asistență prin modul de impersonare cu un singur clic.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-black shadow-xl shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap self-start lg:self-auto hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Înrolează Parc Nou (ANAF v9)</span>
                  </button>
                </div>
              </div>

              {/* 4 Cards Telemetrie HUD */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Parcuri Înrolate</span>
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{metrics.totalTenants}</div>
                  <p className="text-[11px] text-zinc-500">{metrics.activeTenants} active în producție</p>
                </div>

                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Capacitate Flotă</span>
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{metrics.totalCapacity}</div>
                  <p className="text-[11px] text-zinc-500">locuri vehicule alocate</p>
                </div>

                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Instanțe cu OCR CIV</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{metrics.ocrEnabledCount}</div>
                  <p className="text-[11px] text-zinc-500">parcuri cu v9 Vision activ</p>
                </div>

                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Facturare FGO Activă</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{metrics.fgoEnabledCount}</div>
                  <p className="text-[11px] text-zinc-500">parcuri cu API v2 FGO</p>
                </div>
              </div>

              {/* Filtrare & Căutare */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Caută după nume parc, CUI sau slug..."
                    className="w-full bg-[#121215] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-[#121215] border border-white/[0.08] p-1 rounded-xl text-xs overflow-x-auto">
                  {(['all', 'active', 'demo', 'suspended'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                        selectedStatusFilter === status
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {status === 'all' ? 'Toate' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabelul Parcurilor */}
              <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Parc Auto & Identitate</th>
                        <th className="px-4 py-3.5">CUI / Locație</th>
                        <th className="px-4 py-3.5">Pachet & Temă</th>
                        <th className="px-4 py-3.5">Stare & Cotă</th>
                        <th className="px-4 py-3.5">Module Active</th>
                        <th className="px-5 py-3.5 text-right">Acțiuni SuperAdmin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredTenants.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                            Niciun parc auto găsit conform filtrelor specificate.
                          </td>
                        </tr>
                      ) : (
                        filteredTenants.map((t) => {
                          const themeMeta = THEME_LABELS[t.themePreset as DealerThemePreset] || THEME_LABELS.obsidian_gold;
                          const isSelected = (t.slug || '').toLowerCase() === (selectedTenantSlug || '').toLowerCase();
                          
                          return (
                            <tr 
                              key={t.slug} 
                              className={`hover:bg-white/[0.02] transition-colors group ${isSelected ? 'bg-amber-500/[0.03]' : ''}`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-amber-400 text-xs">
                                    {t.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                      {t.name}
                                      {t.slug === 'rxm' && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                                          FOUNDER
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                      slug: <span className="text-zinc-300 font-semibold">{t.slug}</span>
                                      {t.domain && ` • ${t.domain}`}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="font-mono text-zinc-200 font-semibold">{t.cui}</div>
                                <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">{t.address}</div>
                              </td>

                              <td className="px-4 py-4 space-y-1.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  t.tier === 'enterprise' 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                    : t.tier === 'pro' 
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                                      : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/40'
                                }`}>
                                  {t.tier}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                                  <span className={`w-2 h-2 rounded-full ${themeMeta.dot}`} />
                                  <span>{themeMeta.label}</span>
                                </div>
                              </td>

                              <td className="px-4 py-4 space-y-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  t.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : t.status === 'demo'
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : 'bg-red-500/10 text-red-300 border border-red-500/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-400' : t.status === 'demo' ? 'bg-amber-400' : 'bg-red-400'}`} />
                                  {t.status}
                                </span>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                  Max: <span className="text-white font-bold">{t.maxVehiclesQuota}</span> mașini
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {t.features?.ocrCivTalon && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/25">OCR</span>
                                  )}
                                  {t.features?.fgoInvoicing && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/25">FGO</span>
                                  )}
                                  {t.features?.olxStockSync && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono border border-blue-500/25">Portaluri</span>
                                  )}
                                  {t.features?.salesDocsEngine && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/25">Acte</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onImpersonateTenant(t.slug)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
                                    title="Intră în spațiul de lucru al dealerului ca SuperAdmin"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Masquerade</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedTenantSlug(t.slug);
                                      setActiveNavTab('tenant_profile');
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                    title="Editează Profil & FGO"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleExportBackup(t)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                    title="Descarcă Backup JSON"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: PROFIL JURIDIC, FISCAL & DATE BANCARE PARC SELECTAT            */}
          {/* ===================================================================== */}
          {activeNavTab === 'tenant_profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-amber-400" />
                    Profil Juridic & Fiscal: {currentTenant.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Configurează datele oficiale ale parcului auto folosite pe facturi, contracte DITL și în antetul showroom-ului.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    TVA Invariant: 21% Strict
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveTenantProfile} className="space-y-6">
                
                {/* 1. Date Identitate Firmă */}
                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" /> Date Juridice & Înregistrare
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Denumire Firmă (SRL / SA)</label>
                      <input
                        type="text"
                        value={editedLegalName}
                        onChange={(e) => setEditedLegalName(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">CUI / CIF</label>
                      <input
                        type="text"
                        value={editedCui}
                        onChange={(e) => setEditedCui(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nr. Reg. Comerțului (J.../...)</label>
                      <input
                        type="text"
                        value={editedRegCom}
                        onChange={(e) => setEditedRegCom(e.target.value)}
                        placeholder="J12/1234/2020"
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Adresă Sediu Social / Showroom</label>
                      <input
                        type="text"
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Domeniu Web Propriu</label>
                      <input
                        type="text"
                        value={editedDomain}
                        onChange={(e) => setEditedDomain(e.target.value)}
                        placeholder="rxmautomobile.ro"
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Date Bancare & Cont de Garanție */}
                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" /> Cont de Garanție & Încasări
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Bancă Parteneră</label>
                      <input
                        type="text"
                        value={editedBankName}
                        onChange={(e) => setEditedBankName(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Cont IBAN Principal (RON) — Cont de Garanție</label>
                      <input
                        type="text"
                        value={editedIbanRon}
                        onChange={(e) => setEditedIbanRon(e.target.value)}
                        placeholder="RO00BTRLEURT000000000000"
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contact & Canale Notificare */}
                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" /> Contact & Comunicare Showroom
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Telefon Principal (Vânzări)</label>
                      <input
                        type="text"
                        value={editedPhonePrimary}
                        onChange={(e) => setEditedPhonePrimary(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Număr WhatsApp Leads</label>
                      <input
                        type="text"
                        value={editedWhatsapp}
                        onChange={(e) => setEditedWhatsapp(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email Showroom (Inbound / SES)</label>
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Buton Salvare */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvează Modificări Profil</span>
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: DESIGN TOKENS & TEMĂ PARC SELECTAT                             */}
          {/* ===================================================================== */}
          {activeNavTab === 'tenant_branding' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-white/[0.08]">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Palette className="w-6 h-6 text-purple-400" />
                  Design Tokens & Teme: {currentTenant.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Alege estetica vizuală a showroom-ului autonom. Fiecare temă aplică tokeni adaptivi Tailwind și contrast strict WCAG AA.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['obsidian_gold', 'clean_white', 'midnight_blue', 'carbon_red', 'emerald_prestige'] as DealerThemePreset[]).map((preset) => {
                  const meta = THEME_LABELS[preset];
                  const isCurrent = currentTenant.themePreset === preset;

                  return (
                    <div
                      key={preset}
                      onClick={() => {
                        updateTenantProfile(currentTenant.slug || 'rxm', { themePreset: preset });
                        showToast(`✓ Tema ${meta.label} a fost activată pentru ${currentTenant.name}`);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isCurrent 
                          ? 'bg-white/[0.05] border-amber-500 shadow-lg shadow-amber-500/10' 
                          : 'bg-[#121215] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${meta.badge}`}>
                          {meta.label}
                        </span>
                        {isCurrent && <CheckCircle className="w-4 h-4 text-amber-400" />}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <div className={`w-6 h-6 rounded-lg ${meta.dot} shadow-sm`} />
                        <div className="text-xs text-zinc-300 font-mono">
                          {preset === 'obsidian_gold' && 'Dark Luxury #09090b & Amber'}
                          {preset === 'clean_white' && 'Nordic Clean & Minimalist'}
                          {preset === 'midnight_blue' && 'Sapphire High-Tech'}
                          {preset === 'carbon_red' && 'Dynamic Sport Crimson'}
                          {preset === 'emerald_prestige' && 'British Racing Green Eco'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: HUB INTEGRĂRI — FGO FACTURARE & E-FACTURA                      */}
          {/* ===================================================================== */}
          {activeNavTab === 'integrations_fgo' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    Conectare FGO.ro & e-Factura: {currentTenant.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Conectează contul de facturare FGO al parcului auto prin API REST v2 (Model Bring-Your-Own-Key).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono border ${
                    fgoApiKey ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-white/10'
                  }`}>
                    {fgoApiKey ? '● API Activ' : '○ Neconfigurat'}
                  </span>
                </div>
              </div>

              {/* Carduri Info & Model de Cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Opțiunea 1-Click Automat (FGO GO Premium)
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dacă parcul auto deține deja un abonament FGO (~40-57 lei/lună), introduceți cheia API generată din FGO (<i>Setări ➔ eCommerce ➔ Chei API</i>). Facturile și proformele se emit automat direct din ParcOS, cu trimitere în SPV ANAF.
                  </p>
                </div>

                <div className="bg-[#121215] border border-blue-500/30 rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Opțiunea 100% Gratuită (FGO Free / Fără API)
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dacă dealerul este pe planul gratuit FGO, ParcOS permite generarea cu un clic a fișierului XML UBL / CSV compatibil, pe care dealerul îl importă gratuit în FGO fără a plăti niciun abonament!
                  </p>
                </div>
              </div>

              {/* Formular Configurare API FGO */}
              <form onSubmit={handleSaveFgoConfig} className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Cheie API */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Cheie API FGO (Bearer Token)</span>
                      <button
                        type="button"
                        onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                        className="text-amber-400 hover:underline text-[10px]"
                      >
                        {isApiKeyVisible ? 'Ascunde' : 'Arată Cheia'}
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type={isApiKeyVisible ? 'text' : 'password'}
                        value={fgoApiKey}
                        onChange={(e) => setFgoApiKey(e.target.value)}
                        placeholder="Lipiți cheia API din contul FGO al dealerului..."
                        className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* CUI Firmă în FGO */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">CUI Firmă în FGO (Doar cifre, fără RO)</label>
                    <input
                      type="text"
                      value={fgoCui}
                      onChange={(e) => setFgoCui(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="48482214"
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>

                  {/* Mediu API */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Mediu FGO API</label>
                    <select
                      value={fgoEnvironment}
                      onChange={(e) => setFgoEnvironment(e.target.value as 'live' | 'test')}
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="live">Producție Live (api.fgo.ro)</option>
                      <option value="test">Mediu Test UAT Gratuit (api-testuat.fgo.ro)</option>
                    </select>
                  </div>

                  {/* Seria Factură Fiscală */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Serie Factură Fiscală</label>
                    <input
                      type="text"
                      value={fgoSeriesFiscal}
                      onChange={(e) => setFgoSeriesFiscal(e.target.value.toUpperCase())}
                      placeholder="RXM"
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Seria Proformă */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Serie Factură Proformă (Garanții)</label>
                    <input
                      type="text"
                      value={fgoSeriesProforma}
                      onChange={(e) => setFgoSeriesProforma(e.target.value.toUpperCase())}
                      placeholder="PROF"
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Regim TVA Implicit */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Regim Fiscal Auto Implicit</label>
                    <select
                      value={fgoDefaultRegime}
                      onChange={(e) => setFgoDefaultRegime(e.target.value as any)}
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="margin_scheme">Regimul Marjei (Art. 312 Cod Fiscal — Fără TVA evidențiat)</option>
                      <option value="standard_vat">TVA Deductibil 21% (Strict VAT_RATE = 0.21)</option>
                    </select>
                  </div>

                  {/* Trimitere automată SPV */}
                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="fgoAutoSendSpv"
                      checked={fgoAutoSendSpv}
                      onChange={(e) => setFgoAutoSendSpv(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#18181f] text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="fgoAutoSendSpv" className="text-xs text-zinc-300 cursor-pointer select-none">
                      Trimite automat factura în <b>SPV RO e-Factura (ANAF)</b> la emitere
                    </label>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={handleTestFgoConnection}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Testează Conexiunea FGO API</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvează Integrarea FGO</span>
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: PORTALURI AUTO (OLX / AUTOVIT / META SHOP)                     */}
          {/* ===================================================================== */}
          {activeNavTab === 'integrations_portals' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-white/[0.08]">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Radio className="w-6 h-6 text-blue-400" />
                  Sincronizare Portaluri Auto (Autovit / OLX): {currentTenant.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Feed-uri XML și JSON live pentru publicarea automată a stocului parcului pe portalurile auto naționale.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Feed XML Autovit Pro</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://${currentTenant.domain || 'parcos.ro'}/api/feed/autovit?dealer=${currentTenant.slug || 'rxm'}`}
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${currentTenant.domain || 'parcos.ro'}/api/feed/autovit?dealer=${currentTenant.slug || 'rxm'}`);
                        showToast('✓ Link Autovit copiat în clipboard!');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10"
                      title="Copiază URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Feed CSV Meta Catalog (Facebook/Instagram Shop)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://${currentTenant.domain || 'parcos.ro'}/api/feed/meta-catalog.csv?dealer=${currentTenant.slug || 'rxm'}`}
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${currentTenant.domain || 'parcos.ro'}/api/feed/meta-catalog.csv?dealer=${currentTenant.slug || 'rxm'}`);
                        showToast('✓ Link Meta Catalog copiat în clipboard!');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10"
                      title="Copiază URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 6: PARCOS MAIL HUB (AWS SES)                                      */}
          {/* ===================================================================== */}
          {activeNavTab === 'integrations_mail' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-white/[0.08]">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Mail className="w-6 h-6 text-amber-400" />
                  ParcOS Mail Hub (PMH-301): {currentTenant.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Infrastructură dedicată de e-mail tranzacțional pe AWS SES cu rutare inbound S3 și verificare Cloudflare DNS.
                </p>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <div className="text-sm font-bold text-white">Domeniu Email: {currentTenant.domain || 'rxmautomobile.ro'}</div>
                    <div className="text-xs text-zinc-400 font-mono">Înregistrat în SES eu-central-1 • DKIM 2048-bit</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    VERIFICAT CLOUDFLARE
                  </span>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <p>• Adrese alocate: <span className="text-zinc-200 font-mono font-semibold">contact@{currentTenant.domain || 'rxmautomobile.ro'}</span>, <span className="text-zinc-200 font-mono font-semibold">vanzari@{currentTenant.domain || 'rxmautomobile.ro'}</span></p>
                  <p>• Rutare Inbound: S3 Bucket ➔ Node Micro-API ➔ Webhook Push în timp real.</p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 7: PROPAGARE MODULE & 1-CLICK GLOBAL ROLLOUT                      */}
          {/* ===================================================================== */}
          {activeNavTab === 'feature_propagation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-400" />
                    Propagare Instantanee Module & Feature Toggles
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Arhitectura Multi-Tenant Nativă ParcOS permite activarea instantanee a oricărui modul nou dezvoltat pe toți clienții printr-un singur clic.
                  </p>
                </div>

                <button
                  onClick={handlePropagateAllFeaturesGlobally}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ Propagă Global pe Toate Showroom-urile</span>
                </button>
              </div>

              {/* Matrice de Feature Flags */}
              <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Matrice Module per Showroom Activ ({currentTenant.name})</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FEATURE_DEFINITIONS.map((def) => {
                    const Icon = def.icon;
                    const isEnabled = Boolean(currentTenant.features?.[def.key]);

                    return (
                      <div 
                        key={def.key}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-zinc-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-xs">{def.label}</div>
                            <div className="text-[11px] text-zinc-400">{def.desc}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeature(currentTenant.slug!, def.key, isEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                            isEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 8: MONITORIZARE VPS NETCUP & RESURSE                              */}
          {/* ===================================================================== */}
          {activeNavTab === 'vps_monitoring' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-white/[0.08]">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-emerald-400" />
                  Telemetrie Hardware & Infrastructură Netcup VPS
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Monitorizare în timp real a nodului de producție (`152.53.158.65`) și a consumului per showroom.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Procesor & CPU</div>
                  <div className="text-xl font-black text-white">4 vCPU AMD EPYC Genoa</div>
                  <p className="text-xs text-emerald-400 font-mono">Load average: ~0.15 (Sub 5% consum)</p>
                </div>

                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Memorie RAM DDR5</div>
                  <div className="text-xl font-black text-white">8 GB Total • 5.46 GB Liber</div>
                  <p className="text-xs text-zinc-400 font-mono">&lt; 35 MB RAM per showroom activ</p>
                </div>

                <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Stocare NVMe SSD</div>
                  <div className="text-xl font-black text-white">251 GB Total • 214 GB Liber</div>
                  <p className="text-xs text-emerald-400 font-mono">88% capacitate disponibilă</p>
                </div>
              </div>

              <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" /> Containere Docker Active (Netcup)
                </h3>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-zinc-200">rxm-postgres (PostgreSQL 18)</span>
                    <span className="text-emerald-400">Online • Port 5432</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-zinc-200">rxm-api (Node.js Micro-API)</span>
                    <span className="text-emerald-400">Online • Port 3001</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-zinc-200">rxm_showroom (Nginx Alpine)</span>
                    <span className="text-emerald-400">Online • Port 80/443</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL EDITARE GRANULARĂ FEATURE FLAGS PER TENANT                       */}
      {/* ========================================================================= */}
      {editingFeaturesTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121215] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-white">Matrice Module: {editingFeaturesTenant.name}</h3>
                <p className="text-xs text-zinc-400 font-mono">slug: {editingFeaturesTenant.slug}</p>
              </div>
              <button 
                onClick={() => setEditingFeaturesTenant(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {FEATURE_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                const isEnabled = Boolean(editingFeaturesTenant.features?.[def.key]);

                return (
                  <div 
                    key={def.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-zinc-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">{def.label}</div>
                        <div className="text-[11px] text-zinc-400">{def.desc}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeature(editingFeaturesTenant.slug!, def.key, isEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingFeaturesTenant(null)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all cursor-pointer"
              >
                Salvează & Închide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ASISTENT ONBOARDING TURNKEY SHOWROOM (ANAF v9)                         */}
      {/* ========================================================================= */}
      <SuperAdminOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        showToast={showToast}
      />

    </div>
  );
};
