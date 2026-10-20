import React, { useState, useMemo } from 'react';
import { 
  Building2, Server, Shield, Sparkles, Plus, Search, Filter, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Palette, 
  FileText, QrCode, Share2, Film, RefreshCw, LogOut, ArrowRight, 
  Sliders, Check, X, ShieldAlert, Download, Eye, Zap, Database, Clock
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { DealerProfile, SEED_DEALER } from '../../db/seed';
import { TenantFeatures, TenantTier, TenantStatus, DealerThemePreset } from '../../db/types';
import { SuperAdminOnboardingModal } from '../admin/SuperAdminOnboardingModal';

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
  { key: 'ocrCivTalon', label: 'Scanner OCR CIV & Talon', desc: 'Scanare automată acte auto din cameră / fișier PDF', icon: Zap },
  { key: 'olxStockSync', label: 'Sincronizare Stoc OLX', desc: 'Import și reconciliere automată a parcului cu anunțurile OLX', icon: RefreshCw },
  { key: 'tikTokStudio', label: 'TikTok Reel Studio (9:16)', desc: 'Generare automată clipuri video verticale de prezentare', icon: Film },
  { key: 'autolicitPush', label: 'AutoLicit.ro B2B Push', desc: 'Export 1-click în bursa licitațiilor auto B2B holding', icon: Share2 },
  { key: 'salesDocsEngine', label: 'Centru Acte Vânzare', desc: 'Generare instantanee contracte, facturi și procese-verbale', icon: FileText },
  { key: 'windowStickersQr', label: 'Fișe Parbriz Smart QR', desc: 'Fișe A4 printabile cu cod QR direct către pagina mașinii', icon: QrCode },
  { key: 'financingCalculator', label: 'Calculator Rate BT / TBI', desc: 'Simulare leasing și credit auto direct în showroom', icon: Sliders },
  { key: 'whatsappLeadsBot', label: 'Lead Bot WhatsApp', desc: 'Pre-completare cotații și preluare rapidă clienți pe WhatsApp', icon: Sparkles },
];

export const ParcOSSuperAdminHub: React.FC<ParcOSSuperAdminHubProps> = ({
  onBackToSaas,
  onImpersonateTenant,
  onLogoutSuperAdmin,
  showToast
}) => {
  const { allTenants, updateTenantFeatures, updateTenantStatus, registerTenant } = useTenant();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | TenantStatus>('all');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [editingFeaturesTenant, setEditingFeaturesTenant] = useState<DealerProfile | null>(null);

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
      }
    }));
  }, [allTenants]);

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
    const totalCapacity = tenantsList.reduce((acc, t) => acc + (t.maxVehiclesQuota || 25), 0);
    return { totalTenants, activeTenants, ocrEnabledCount, totalCapacity };
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
    
    // Sincronizare stare locală a modalului deschis
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-300 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR: TELEMETRIE & BRANDING SUPERADMIN                     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-base shadow-lg shadow-amber-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">ParcOS Master Control Plane</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Node-ZBook / Zety • Netcup VPS (152.53.158.65) • TVA 21%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToSaas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Înapoi pe ParcOS.ro</span>
            </button>

            {onLogoutSuperAdmin && (
              <button
                onClick={onLogoutSuperAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
                title="Deconectare din sesiunea de SuperAdmin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deconectare</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TELEMETRY HUD & HERO BANNER                                            */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
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
                Supervizează instanțele autonome, alocă pachete de funcționalități, comută feature flags în timp real și oferă asistență prin modul de impersonare cu un singur clic.
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
              <span>Capacitate Totală Flotă</span>
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
              <span>Nod Infrastructură</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-1">152.53.158.65</div>
            <p className="text-[11px] text-zinc-500">Netcup VPS • Docker Online</p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. BARA DE CONTROL: FILTRARE & CĂUTARE TENANȚI                           */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* 4. TABELUL SUVERAN AL TENANȚILOR                                         */}
        {/* ========================================================================= */}
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
                    
                    return (
                      <tr key={t.slug} className="hover:bg-white/[0.02] transition-colors group">
                        
                        {/* 1. Nume & Avatar */}
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

                        {/* 2. CUI & Oraș */}
                        <td className="px-4 py-4">
                          <div className="font-mono text-zinc-200 font-semibold">{t.cui}</div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">{t.address}</div>
                        </td>

                        {/* 3. Pachet & Temă */}
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

                        {/* 4. Stare & Cotă */}
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

                        {/* 5. Feature Pills */}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {t.features?.ocrCivTalon && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/25">OCR</span>
                            )}
                            {t.features?.olxStockSync && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono border border-blue-500/25">OLX</span>
                            )}
                            {t.features?.tikTokStudio && (
                              <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 text-[10px] font-mono border border-pink-500/25">TikTok</span>
                            )}
                            {t.features?.salesDocsEngine && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/25">Acte</span>
                            )}
                            {t.features?.autolicitPush && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/25">B2B</span>
                            )}
                          </div>
                        </td>

                        {/* 6. Acțiuni */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Buton Impersonate */}
                            <button
                              onClick={() => onImpersonateTenant(t.slug)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
                              title="Intră în spațiul de lucru al dealerului ca SuperAdmin"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Masquerade</span>
                            </button>

                            {/* Buton Configurare Features */}
                            <button
                              onClick={() => setEditingFeaturesTenant(t)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="Matrice Feature Flags & Cote"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            {/* Buton Backup JSON */}
                            <button
                              onClick={() => handleExportBackup(t)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="Descarcă Backup JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Buton Comutare Status */}
                            <button
                              onClick={() => {
                                const nextStatus: TenantStatus = t.status === 'active' ? 'suspended' : 'active';
                                updateTenantStatus(t.slug, nextStatus);
                                showToast(`Status schimbat în ${nextStatus} pentru ${t.name}`);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                t.status === 'active' 
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/20' 
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                              }`}
                              title={t.status === 'active' ? 'Suspendă accesul dealerului' : 'Activează accesul'}
                            >
                              {t.status === 'active' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
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

      </main>

      {/* ========================================================================= */}
      {/* 5. MODAL MATRICE DE FEATURE FLAGS (TICKET 2.3)                            */}
      {/* ========================================================================= */}
      {editingFeaturesTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-white/[0.1] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Matrice Feature Flags — {editingFeaturesTenant.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">slug: {editingFeaturesTenant.slug} • CUI: {editingFeaturesTenant.cui}</p>
              </div>
              <button
                onClick={() => setEditingFeaturesTenant(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Listă comutatoare de funcționalități */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {FEATURE_DEFINITIONS.map(def => {
                const isEnabled = !!(editingFeaturesTenant.features?.[def.key]);
                const Icon = def.icon;

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
      {/* 6. ASISTENT ONBOARDING TURNKEY SHOWROOM (ANAF v9)                         */}
      {/* ========================================================================= */}
      <SuperAdminOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        showToast={showToast}
      />

    </div>
  );
};
