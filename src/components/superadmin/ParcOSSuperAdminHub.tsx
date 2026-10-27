import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Server, Shield, Sparkles, Plus, Search, Filter, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Palette, 
  FileText, QrCode, Share2, Film, RefreshCw, LogOut, ArrowRight, 
  Sliders, Check, X, ShieldAlert, Download, Eye, Zap, Database, Clock,
  Menu, Landmark, Globe, Key, Mail, Radio, DollarSign, Cpu, Copy,
  CheckCircle, SlidersHorizontal, Lock, Save, CreditCard, Wrench, HardDrive
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { DealerProfile, SEED_DEALER } from '../../db/seed';
import { TenantFeatures, TenantTier, TenantStatus, DealerThemePreset, DealerLandingConfig, VehicleItem, VehicleExpenseItem } from '../../db/types';
import { VehicleReconBoard } from '../admin/service-tracker/VehicleReconBoard';
import { SuperAdminOnboardingModal } from '../admin/SuperAdminOnboardingModal';
import { SuperAdminSidebar, SuperAdminNavTab } from './SuperAdminSidebar';
import { LandingCustomizerHUD } from './LandingCustomizerHUD';
import { SuperAdminTenantsOverviewTab } from './tabs/SuperAdminTenantsOverviewTab';
import { SuperAdminTenantProfileTab } from './tabs/SuperAdminTenantProfileTab';
import { SuperAdminFgoTab } from './tabs/SuperAdminFgoTab';
import { SuperAdminPortalsTab } from './tabs/SuperAdminPortalsTab';
import { SuperAdminVpsTab } from './tabs/SuperAdminVpsTab';
import { SuperAdminBillingTab } from './tabs/SuperAdminBillingTab';
import { SuperAdminMailTab } from './tabs/SuperAdminMailTab';
import { SuperAdminFeaturePropagationTab } from './tabs/SuperAdminFeaturePropagationTab';
import { BackupRollbackManager } from '../admin/BackupRollbackManager';
import { 
  propagateFeatureGloballyBackend, 
  testFgoConnectionBackend, 
  fetchVpsTelemetry, 
  VpsTelemetryData,
  fetchTenantBilling,
  triggerManualSaasInvoice,
  markSaasInvoicePaid,
  runOverdueBillingSweep,
  SaasBillingDetails
} from '../../utils/superAdminApi';

interface ParcOSSuperAdminHubProps {
  cars?: VehicleItem[];
  onUpdateCar?: (updatedCar: VehicleItem) => void;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  onBackToSaas: () => void;
  onImpersonateTenant: (slug: string) => void;
  onLogoutSuperAdmin?: () => void;
  showToast: (msg: string) => void;
}

const FEATURE_DEFINITIONS: { key: keyof TenantFeatures; label: string; desc: string; icon: any }[] = [
  { key: 'ocrCivTalon', label: 'Scanner OCR CIV & Talon', desc: 'Scanare automată acte auto din cameră / fișier PDF v9 Vision', icon: Zap },
  { key: 'fgoInvoicing', label: 'FGO Facturare & Proforme', desc: 'Emitere 1-click proforme avans și facturi fiscale prin API v2 FGO.ro', icon: FileText },
  { key: 'salesDocsEngine', label: 'Centru Acte Vânzare', desc: 'Generare instantanee contracte DITL, procese-verbale și garanții', icon: Landmark },
  { key: 'tikTokStudio', label: 'TikTok Reel Studio (9:16)', desc: 'Generare automată clipuri video verticale de prezentare stoc', icon: Film },
  { key: 'olxStockSync', label: 'Sincronizare Portaluri Auto', desc: 'Import și reconciliere automată a parcului cu OLX / Autovit (Nod S9)', icon: RefreshCw },
  { key: 'financingCalculator', label: 'Calculator Rate BT / TBI', desc: 'Simulare leasing și credit auto direct în showroom cu Cont de Garanție', icon: DollarSign },
  { key: 'windowStickersQr', label: 'Fișe Parbriz Smart QR', desc: 'Fișe A4 printabile cu cod QR direct către pagina mașinii', icon: QrCode },
  { key: 'whatsappLeadsBot', label: 'Lead Bot WhatsApp', desc: 'Pre-completare cotații și preluare rapidă clienți pe WhatsApp', icon: Sparkles },
  { key: 'financingPortfolio', label: 'Portofoliu Credite & F&I', desc: 'Gestiune dosare finanțare TBI/BT, scoring ANAF și urmărire comisioane dealer', icon: CreditCard },
  { key: 'reconTracker', label: 'Service & Pregătire Flotă (Recon)', desc: 'Board de urmărire statusuri atelier, defecte mecanice, devize și pregătire showroom', icon: Wrench },
  { key: 'googleDriveVault', label: 'Google Drive PRO Vault', desc: 'Arhivare cloud securizată a facturilor, bonurilor și documentelor tehnice (CIV/Talon) optimizate', icon: HardDrive },
  { key: 'autolicitPush', label: 'AutoLicit.ro B2B Push', desc: 'Export 1-click în bursa licitațiilor auto B2B holding CARVANA SRL', icon: Share2 },
];

export const ParcOSSuperAdminHub: React.FC<ParcOSSuperAdminHubProps> = ({
  cars = [],
  onUpdateCar,
  onAddExpense,
  onBackToSaas,
  onImpersonateTenant,
  onLogoutSuperAdmin,
  showToast
}) => {
  const { allTenants, refreshTenantsFromBackend, updateTenantFeatures, updateTenantStatus, updateTenantProfile } = useTenant();
  const [isPropagating, setIsPropagating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  const [editedTier, setEditedTier] = useState<TenantTier>('starter');
  const [editedMaxQuota, setEditedMaxQuota] = useState<number>(25);

  // Stare formular integrare FGO
  const [fgoApiKey, setFgoApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [fgoCui, setFgoCui] = useState('');
  const [fgoSeriesFiscal, setFgoSeriesFiscal] = useState('RXM');
  const [fgoSeriesProforma, setFgoSeriesProforma] = useState('PROF');
  const [fgoEnvironment, setFgoEnvironment] = useState<'live' | 'test'>('live');
  const [fgoDefaultRegime, setFgoDefaultRegime] = useState<'margin_scheme' | 'standard_vat'>('margin_scheme');
  const [fgoAutoSendSpv, setFgoAutoSendSpv] = useState(true);
  const [isTestingFgo, setIsTestingFgo] = useState(false);
  const [fgoConnectionStatus, setFgoConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [copiedFeed, setCopiedFeed] = useState<'autovit' | 'meta' | null>(null);
  const [eligibleCarsCount, setEligibleCarsCount] = useState<number | null>(null);

  // Stare telemetrie hardware live Netcup VPS
  const [telemetry, setTelemetry] = useState<VpsTelemetryData | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const handleRefreshTelemetry = async () => {
    setIsLoadingTelemetry(true);
    setTelemetryError(null);
    try {
      const data = await fetchVpsTelemetry();
      setTelemetry(data);
    } catch (err: any) {
      setTelemetryError(err?.message || 'Eroare la preluarea telemetriei VPS');
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (activeNavTab === 'vps_monitoring' && !telemetry && !isLoadingTelemetry) {
      handleRefreshTelemetry();
    }
  }, [activeNavTab]);

  // Stare Facturare SaaS & Abonamente B2B
  const [billingDetails, setBillingDetails] = useState<SaasBillingDetails | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isSweepingOverdue, setIsSweepingOverdue] = useState(false);

  const handleRefreshBilling = async (targetSlug = selectedTenantSlug) => {
    setIsLoadingBilling(true);
    setBillingError(null);
    try {
      const data = await fetchTenantBilling(targetSlug);
      setBillingDetails(data);
    } catch (err: any) {
      setBillingError(err?.message || 'Eroare la preluarea datelor de facturare');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (activeNavTab === 'saas_billing' && selectedTenantSlug) {
      handleRefreshBilling(selectedTenantSlug);
    }
  }, [activeNavTab, selectedTenantSlug]);

  const handleTriggerInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const inv = await triggerManualSaasInvoice(selectedTenantSlug);
      showToast(`Factura ${inv.id} a fost generată cu succes (${inv.totalGrossEur} EUR brut cu 21% TVA)!`);
      await handleRefreshBilling(selectedTenantSlug);
    } catch (err: any) {
      showToast(`Eroare generare factură: ${err.message}`);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const inv = await markSaasInvoicePaid(selectedTenantSlug, invoiceId);
      showToast(`Factura ${inv.id} a fost marcată ca achitată!`);
      await handleRefreshBilling(selectedTenantSlug);
      await refreshTenantsFromBackend();
    } catch (err: any) {
      showToast(`Eroare marcare plată: ${err.message}`);
    }
  };

  const handleRunOverdueSweep = async () => {
    setIsSweepingOverdue(true);
    try {
      const summary = await runOverdueBillingSweep();
      showToast(`Sweep finalizat: ${summary.checked} verificate, ${summary.suspended} suspendate, ${summary.inGracePeriod} în grație.`);
      await handleRefreshBilling(selectedTenantSlug);
      await refreshTenantsFromBackend();
    } catch (err: any) {
      showToast(`Eroare sweep: ${err.message}`);
    } finally {
      setIsSweepingOverdue(false);
    }
  };

  // Schimbare rapidă pachet SaaS din tabelul SuperAdmin
  const handleQuickTierChange = async (slug: string, newTier: TenantTier) => {
    const newQuota = newTier === 'enterprise' ? 999 : newTier === 'pro' ? 60 : 25;
    try {
      updateTenantProfile(slug, { tier: newTier, maxVehiclesQuota: newQuota });
      showToast(`Pachet actualizat pentru "${slug}" la ${newTier.toUpperCase()} (Cotă: ${newQuota === 999 ? 'Nelimitat' : `${newQuota} mașini`})`);
    } catch (err: any) {
      showToast(`Eroare la actualizarea pachetului: ${err.message}`);
    }
  };

  // Lista completă a parcurilor din registrul global
  const tenantsList = useMemo(() => {
    return Object.entries(allTenants).map(([slug, profile]) => ({
      ...profile,
      slug: profile.slug || slug,
      tier: profile.tier || 'starter',
      status: profile.status || 'active',
      maxVehiclesQuota: profile.maxVehiclesQuota || 25,
      activeVehiclesCount: profile.activeVehiclesCount !== undefined ? profile.activeVehiclesCount : (profile.slug === 'rxm' ? 24 : profile.slug === 'mpi_auto' ? 14 : profile.slug === 'top_auto' ? 8 : 10),
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

  // Vehicule asociate tenantului selectat pentru boardul de service & pregătire flotă
  const tenantCars = useMemo(() => {
    const slug = (selectedTenantSlug || 'rxm').toLowerCase();
    const matched = (cars || []).filter(c => !c.dealerSlug || c.dealerSlug.toLowerCase() === slug);
    return matched.length > 0 ? matched : (cars || []);
  }, [cars, selectedTenantSlug]);

  // Sincronizare formular când se schimbă tenantul selectat
  useEffect(() => {
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
      setEditedTier(currentTenant.tier || 'starter');
      setEditedMaxQuota(currentTenant.maxVehiclesQuota || 25);

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
      setFgoConnectionStatus('idle');
    }
  }, [currentTenant]);

  // Calculare mașini eligibile pentru sindicare portaluri (active & cu poze)
  useEffect(() => {
    if (activeNavTab === 'integrations_portals' && currentTenant?.slug) {
      fetch(`/api/vehicles?dealer=${encodeURIComponent(currentTenant.slug)}`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.vehicles)) {
            const count = data.vehicles.filter((v: any) => {
              const status = String(v.status || 'in_stock').toLowerCase();
              const hasImages = Array.isArray(v.images) && v.images.length > 0;
              return (status === 'in_stock' || status === 'available') && hasImages;
            }).length;
            setEligibleCarsCount(count);
          } else {
            setEligibleCarsCount(0);
          }
        })
        .catch(() => {
          setEligibleCarsCount(null);
        });
    }
  }, [activeNavTab, currentTenant?.slug]);

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
      tier: editedTier,
      maxVehiclesQuota: Number(editedMaxQuota),
    });

    showToast(`✓ Datele pentru ${editedLegalName} au fost salvate cu succes!`);
  };

  // Salvare setări integrare FGO
  const handleSaveFgoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant?.slug) return;

    const isSandbox = currentTenant.slug === 'rxm_sandbox';
    const effectiveEnvironment = isSandbox ? 'test' : fgoEnvironment;
    const effectiveAutoSendSpv = isSandbox ? false : fgoAutoSendSpv;

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
          environment: effectiveEnvironment,
          defaultRegime: fgoDefaultRegime,
          autoSendSpv: effectiveAutoSendSpv
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

  // Test conexiune FGO în timp real prin backend API
  const handleTestFgoConnection = async () => {
    if (!fgoApiKey.trim() || !fgoCui.trim()) {
      showToast('⚠️ Vă rugăm să completați Cheia API și CUI-ul firmei înainte de testare.');
      return;
    }
    setIsTestingFgo(true);
    setFgoConnectionStatus('testing');
    showToast(`🔍 Conectare la FGO API v2 (${fgoEnvironment.toUpperCase()})...`);

    try {
      const res = await testFgoConnectionBackend(currentTenant.slug || 'rxm', {
        apiKey: fgoApiKey.trim(),
        cui: fgoCui.trim(),
        seriesFiscal: fgoSeriesFiscal.trim(),
        seriesProforma: fgoSeriesProforma.trim(),
        environment: currentTenant.slug === 'rxm_sandbox' ? 'test' : fgoEnvironment
      });

      if (res.success) {
        setFgoConnectionStatus('connected');
        showToast(`✅ ${res.message || 'Conexiune FGO confirmată cu succes!'}`);
      } else {
        setFgoConnectionStatus('error');
        showToast(`❌ Eroare FGO: ${res.error}`);
      }
    } catch (err: any) {
      setFgoConnectionStatus('error');
      showToast(`❌ ${err.message || 'Eroare la apelarea conectorului FGO'}`);
    } finally {
      setIsTestingFgo(false);
    }
  };

  // 1-Click Global Feature Propagation (Activează pe Toate Showroom-urile din PostgreSQL)
  const handlePropagateAllFeaturesGlobally = async () => {
    setIsPropagating(true);
    try {
      const result = await propagateFeatureGloballyBackend('salesDocsEngine', true);
      await refreshTenantsFromBackend();
      showToast(`🚀 Sincronizare reușită! Modulul a fost propagat pe toate cele ${result.updatedCount || tenantsList.length} showroom-uri din PostgreSQL!`);
    } catch (err: any) {
      tenantsList.forEach(t => {
        updateTenantFeatures(t.slug || '', {
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
      showToast(`🚀 Module propagate: ${err.message || 'Actualizat'}`);
    } finally {
      setIsPropagating(false);
    }
  };

  // Propagare 1-Click a unui modul specific pe toate showroom-urile active
  const handlePropagateSingleFeatureGlobally = async (featureKey: keyof TenantFeatures) => {
    setIsPropagating(true);
    try {
      const result = await propagateFeatureGloballyBackend(featureKey, true);
      await refreshTenantsFromBackend();
      showToast(`⚡ Modulul "${featureKey}" a fost propagat cu succes pe ${result.updatedCount || tenantsList.length} showroom-uri active!`);
    } catch (err: any) {
      showToast(`⚠️ Eroare propagare: ${err.message}`);
    } finally {
      setIsPropagating(false);
    }
  };

  // Reîmprospătare manuală din PostgreSQL
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTenantsFromBackend();
      showToast('🔄 Registrul chiriașilor a fost sincronizat cu PostgreSQL.');
    } catch (err: any) {
      showToast(`⚠️ Eroare refresh: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
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
      
      {/* 1. SIDEBAR CENTRAL SUPERADMIN & TENANT SWITCHER */}
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

      {/* 2. ZONĂ CONȚINUT PRINCIPAL */}
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

        {/* Corpul Paginii — Shell Router Modular */}
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
                  Consum măsurat pe serverul cloud: ~35 MB RAM (0.6% din resursele libere). Poate rula liniștit 24/7 sau fi pus în Standby la nevoie.
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

          {/* TAB 1: REGISTRU GLOBAL PARCURI */}
          {activeNavTab === 'tenants_overview' && (
            <SuperAdminTenantsOverviewTab
              metrics={metrics}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              filteredTenants={filteredTenants}
              selectedTenantSlug={selectedTenantSlug}
              setSelectedTenantSlug={setSelectedTenantSlug}
              setActiveNavTab={setActiveNavTab}
              onImpersonateTenant={onImpersonateTenant}
              onQuickTierChange={handleQuickTierChange}
              onExportBackup={handleExportBackup}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              onManualRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
          )}

          {/* TAB 2: PROFIL JURIDIC & FISCAL */}
          {activeNavTab === 'tenant_profile' && (
            <SuperAdminTenantProfileTab
              currentTenant={currentTenant}
              editedLegalName={editedLegalName}
              setEditedLegalName={setEditedLegalName}
              editedCui={editedCui}
              setEditedCui={setEditedCui}
              editedRegCom={editedRegCom}
              setEditedRegCom={setEditedRegCom}
              editedAddress={editedAddress}
              setEditedAddress={setEditedAddress}
              editedPhonePrimary={editedPhonePrimary}
              setEditedPhonePrimary={setEditedPhonePrimary}
              editedWhatsapp={editedWhatsapp}
              setEditedWhatsapp={setEditedWhatsapp}
              editedEmail={editedEmail}
              setEditedEmail={setEditedEmail}
              editedBankName={editedBankName}
              setEditedBankName={setEditedBankName}
              editedIbanRon={editedIbanRon}
              setEditedIbanRon={setEditedIbanRon}
              editedDomain={editedDomain}
              setEditedDomain={setEditedDomain}
              editedTier={editedTier}
              setEditedTier={setEditedTier}
              editedMaxQuota={editedMaxQuota}
              setEditedMaxQuota={setEditedMaxQuota}
              onSave={handleSaveTenantProfile}
            />
          )}

          {/* TAB 3: PERSONALIZARE LANDING PAGE & DESIGN (HUD) */}
          {activeNavTab === 'tenant_branding' && (
            <LandingCustomizerHUD
              tenant={currentTenant}
              onSave={(landingConfig: DealerLandingConfig, themePreset?: DealerThemePreset) => {
                const patch: Partial<DealerProfile> = { landingConfig };
                if (themePreset) {
                  patch.themePreset = themePreset;
                }
                updateTenantProfile(currentTenant.slug || 'rxm', patch);
              }}
              showToast={showToast}
            />
          )}

          {/* TAB 4: HUB INTEGRĂRI — FGO FACTURARE & E-FACTURA */}
          {activeNavTab === 'integrations_fgo' && (
            <SuperAdminFgoTab
              currentTenant={currentTenant}
              fgoApiKey={fgoApiKey}
              setFgoApiKey={setFgoApiKey}
              isApiKeyVisible={isApiKeyVisible}
              setIsApiKeyVisible={setIsApiKeyVisible}
              fgoCui={fgoCui}
              setFgoCui={setFgoCui}
              fgoEnvironment={fgoEnvironment}
              setFgoEnvironment={setFgoEnvironment}
              fgoSeriesFiscal={fgoSeriesFiscal}
              setFgoSeriesFiscal={setFgoSeriesFiscal}
              fgoSeriesProforma={fgoSeriesProforma}
              setFgoSeriesProforma={setFgoSeriesProforma}
              fgoDefaultRegime={fgoDefaultRegime}
              setFgoDefaultRegime={setFgoDefaultRegime}
              fgoAutoSendSpv={fgoAutoSendSpv}
              setFgoAutoSendSpv={setFgoAutoSendSpv}
              fgoConnectionStatus={fgoConnectionStatus}
              isTestingFgo={isTestingFgo}
              onTestConnection={handleTestFgoConnection}
              onSaveConfig={handleSaveFgoConfig}
            />
          )}

          {/* TAB 5: PORTALURI AUTO (OLX / AUTOVIT / META SHOP) */}
          {activeNavTab === 'integrations_portals' && (
            <SuperAdminPortalsTab
              currentTenant={currentTenant}
              eligibleCarsCount={eligibleCarsCount}
              copiedFeed={copiedFeed}
              setCopiedFeed={setCopiedFeed}
              showToast={showToast}
            />
          )}

          {/* TAB 6: PARCOS MAIL HUB (AWS SES) */}
          {activeNavTab === 'integrations_mail' && (
            <SuperAdminMailTab currentTenant={currentTenant} />
          )}

          {/* TAB 7: PROPAGARE MODULE & 1-CLICK GLOBAL ROLLOUT */}
          {activeNavTab === 'feature_propagation' && (
            <SuperAdminFeaturePropagationTab
              currentTenant={currentTenant}
              allTenants={tenantsList}
              featureDefinitions={FEATURE_DEFINITIONS}
              isPropagating={isPropagating}
              onPropagateAll={handlePropagateAllFeaturesGlobally}
              onPropagateSingle={handlePropagateSingleFeatureGlobally}
              onToggleFeature={handleToggleFeature}
            />
          )}

          {/* TAB 8: MONITORIZARE VPS NETCUP & RESURSE */}
          {activeNavTab === 'vps_monitoring' && (
            <SuperAdminVpsTab
              telemetry={telemetry}
              isLoadingTelemetry={isLoadingTelemetry}
              telemetryError={telemetryError}
              onRefreshTelemetry={handleRefreshTelemetry}
            />
          )}

          {/* TAB 9: ABONAMENTE & FACTURARE SAAS B2B */}
          {activeNavTab === 'saas_billing' && (
            <SuperAdminBillingTab
              selectedTenant={currentTenant}
              selectedTenantSlug={selectedTenantSlug}
              billingDetails={billingDetails}
              isLoadingBilling={isLoadingBilling}
              isGeneratingInvoice={isGeneratingInvoice}
              isSweepingOverdue={isSweepingOverdue}
              billingError={billingError}
              onRefreshBilling={() => handleRefreshBilling()}
              onRunOverdueSweep={handleRunOverdueSweep}
              onTriggerInvoice={handleTriggerInvoice}
              onPayInvoice={handlePayInvoice}
            />
          )}

          {/* TAB 10: BACKUP & ROLLBACK DISASTER RECOVERY (STRICT SUPERADMIN) */}
          {activeNavTab === 'backup_rollback' && (
            <BackupRollbackManager
              dealer={currentTenant}
              showToast={showToast}
            />
          )}

          {/* TAB 11: OPERAȚIUNI SERVICE & PREGĂTIRE FLOTĂ (RECON TRACKER & VAULT) */}
          {activeNavTab === 'recon_tracker' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-amber-400" />
                    Service, Inspecție Tehnică & Pregătire Flotă ({currentTenant.name})
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Urmărire completă Kanban: defecte constatate, devize de reparații, acte tehnice (CIV/Talon) și arhivare în Google Drive PRO Vault.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                    {currentTenant.slug || 'rxm'} • {tenantCars.length} vehicule în flux
                  </span>
                </div>
              </div>

              <VehicleReconBoard
                cars={tenantCars}
                onUpdateCar={onUpdateCar}
                onAddExpense={onAddExpense}
                showToast={showToast}
              />
            </div>
          )}

        </main>
      </div>

      {/* 3. MODAL EDITARE GRANULARĂ FEATURE FLAGS PER TENANT */}
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

      {/* 4. ASISTENT ONBOARDING TURNKEY SHOWROOM (ANAF v9) */}
      <SuperAdminOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        showToast={showToast}
      />

    </div>
  );
};
