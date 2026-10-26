import React, { useState } from 'react';
import { 
  Building2, Server, Shield, Sparkles, Plus, Search, Filter, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Palette, 
  FileText, QrCode, Share2, Film, RefreshCw, LogOut, ArrowRight, 
  Sliders, Check, X, ShieldAlert, Download, Eye, Zap, Database, Clock,
  ChevronDown, Landmark, Globe, Key, Mail, Radio, DollarSign, Cpu, Wrench
} from 'lucide-react';
import { DealerProfile } from '../../db/seed';

export type SuperAdminNavTab = 
  | 'tenants_overview'     // 🏢 Registru Parcuri & Flotă
  | 'tenant_profile'       // ⚙️ Profil & Date Fiscale (CUI, Adresă, Cont de Garanție)
  | 'tenant_branding'      // 🎨 Design & Teme (Obsidian Gold, Clean White etc.)
  | 'saas_billing'         // 💳 Facturare B2B & Abonamente SaaS (99€ / 199€ / 349€)
  | 'integrations_fgo'     // 🧾 FGO Facturare & Proforme (API v2 / e-Factura)
  | 'integrations_portals' // 📡 Sincronizare OLX & Autovit
  | 'integrations_mail'    // 📧 ParcOS Mail Hub (SES / Inbound)
  | 'feature_propagation'  // 🚀 Matrice Module (1-Click Rollout Global)
  | 'vps_monitoring'       // 📊 Telemetrie VPS Netcup (RAM, SSD, Docker)
  | 'backup_rollback'      // 🛡️ Backup & Rollback Disaster Recovery (VPS -> Google Drive)
  | 'recon_tracker';       // 🔧 Service, Inspecție Tehnică & Pregătire Flotă (Recon & Vault)

export interface SuperAdminSidebarProps {
  activeTab: SuperAdminNavTab;
  onSelectTab: (tab: SuperAdminNavTab) => void;
  selectedTenantSlug: string;
  onSelectTenantSlug: (slug: string) => void;
  tenants: DealerProfile[];
  onImpersonate: (slug: string) => void;
  onOpenOnboarding: () => void;
  onBackToSaas: () => void;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  selectedTenantSlug,
  onSelectTenantSlug,
  tenants,
  onImpersonate,
  onOpenOnboarding,
  onBackToSaas,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [tenantSearchFilter, setTenantSearchFilter] = useState('');

  const currentTenant = tenants.find(t => (t.slug || '').toLowerCase() === selectedTenantSlug.toLowerCase()) || tenants[0];

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(tenantSearchFilter.toLowerCase()) ||
    (t.slug && t.slug.toLowerCase().includes(tenantSearchFilter.toLowerCase())) ||
    t.cui.toLowerCase().includes(tenantSearchFilter.toLowerCase())
  );

  const handleSelectNavTab = (tab: SuperAdminNavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navGroups = [
    {
      group: 'ECOSISTEM PARCURI',
      items: [
        {
          id: 'tenants_overview' as SuperAdminNavTab,
          label: 'Toate Parcurile',
          icon: Building2,
          badge: `${tenants.length} totale`,
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }
      ]
    },
    {
      group: `CONFIGURARE (${currentTenant?.name?.split(' ')[0] || 'PARC'})`,
      items: [
        {
          id: 'tenant_profile' as SuperAdminNavTab,
          label: 'Profil Juridic & Fiscal',
          icon: Landmark,
          badge: currentTenant?.cui || 'CUI',
          badgeColor: 'bg-white/10 text-zinc-300 border-white/15'
        },
        {
          id: 'tenant_branding' as SuperAdminNavTab,
          label: 'Design & Teme',
          icon: Palette,
          badge: currentTenant?.themePreset || 'Temă',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        }
      ]
    },
    {
      group: `OPERAȚIUNI STOC & SERVICE (${currentTenant?.name?.split(' ')[0] || 'PARC'})`,
      items: [
        {
          id: 'recon_tracker' as SuperAdminNavTab,
          label: 'Service & Pregătire Flotă',
          icon: Wrench,
          badge: currentTenant?.features?.reconTracker !== false ? 'Recon & Acte' : 'Inactiv',
          badgeColor: currentTenant?.features?.reconTracker !== false
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
        }
      ]
    },
    {
      group: 'MONETIZARE & FACTURARE SAAS',
      items: [
        {
          id: 'saas_billing' as SuperAdminNavTab,
          label: 'Abonamente & Facturare B2B',
          icon: DollarSign,
          badge: 'TVA 21%',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }
      ]
    },
    {
      group: 'HUB INTEGRĂRI',
      items: [
        {
          id: 'integrations_fgo' as SuperAdminNavTab,
          label: 'FGO Facturare & Proforme',
          icon: FileText,
          badge: 'API v2',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'integrations_portals' as SuperAdminNavTab,
          label: 'Portaluri (Autovit / OLX)',
          icon: Radio,
          badge: 'S9 Sync',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        },
        {
          id: 'integrations_mail' as SuperAdminNavTab,
          label: 'ParcOS Mail Hub',
          icon: Mail,
          badge: 'SES / S3',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }
      ]
    },
    {
      group: 'PROPAGARE & INFRASTRUCTURĂ',
      items: [
        {
          id: 'feature_propagation' as SuperAdminNavTab,
          label: 'Propagare Module & Toggles',
          icon: Zap,
          badge: '1-Click Rollout',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        },
        {
          id: 'vps_monitoring' as SuperAdminNavTab,
          label: 'Telemetrie VPS Netcup',
          icon: Cpu,
          badge: '152.53.158.65',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'backup_rollback' as SuperAdminNavTab,
          label: 'Backup & Rollback Cloud',
          icon: Database,
          badge: 'G-Drive • RPO 01:15',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }
      ]
    }
  ];

  const sidebarBody = (
    <div className="flex flex-col h-full justify-between select-none p-4 space-y-4">
      
      {/* 1. Header SuperAdmin */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-base shadow-lg shadow-amber-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">ParcOS Master</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Netcup VPS • Multi-Tenant
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. TENANT SWITCHER (Selector Parc Auto Activ) */}
        <div className="relative">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 px-1 flex items-center justify-between">
            <span>Parc Selectat pentru Editare</span>
            <span className="text-amber-400 font-bold">{tenants.length} parcuri</span>
          </div>

          <div 
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#141418] hover:bg-[#18181f] border border-white/[0.08] hover:border-amber-500/30 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                {currentTenant?.name?.slice(0, 2).toUpperCase() || 'PA'}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {currentTenant?.name || 'Selectează Parc'}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  {currentTenant?.slug ? `slug: ${currentTenant.slug}` : currentTenant?.cui}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isTenantDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </div>

          {/* Dropdown list */}
          {isTenantDropdownOpen && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-[#121216] border border-white/15 rounded-2xl p-2 shadow-2xl space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={tenantSearchFilter}
                  onChange={(e) => setTenantSearchFilter(e.target.value)}
                  placeholder="Filtrează după nume / CUI..."
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {filteredTenants.map((t) => {
                  const isSelected = (t.slug || '').toLowerCase() === (selectedTenantSlug || '').toLowerCase();
                  return (
                    <div
                      key={t.slug || t.cui}
                      onClick={() => {
                        onSelectTenantSlug(t.slug || 'rxm');
                        setIsTenantDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                          : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="truncate">{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{t.cui}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.slug === 'rxm_sandbox' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40">
                            🧪 SANDBOX
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10 text-zinc-400">
                            {t.tier || 'starter'}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsTenantDropdownOpen(false);
                    onOpenOnboarding();
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Înrolează Parc Nou
                </button>
              </div>
            </div>
          )}

          {/* Quick Impersonate Button */}
          {currentTenant && (
            <button
              onClick={() => onImpersonate(currentTenant.slug || 'rxm')}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black text-xs font-bold border border-amber-500/30 transition-all cursor-pointer shadow-sm group"
              title="Intră în modul DMS al acestui dealer ca SuperAdmin"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Masquerade: {currentTenant.name.split(' ')[0]}</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* 3. GRUPURI DE NAVIGARE */}
        <nav className="space-y-4 pt-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-0.5">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNavTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 4. FOOTER SUPERADMIN */}
      <div className="pt-3 border-t border-white/[0.08] space-y-2">
        <button
          onClick={onBackToSaas}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Înapoi pe ParcOS.ro</span>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Deconectare SuperAdmin</span>
          </button>
        )}

        <div className="text-[10px] text-zinc-400 text-center font-mono pt-1">
          ParcOS Multi-Tenant OS • Netcup VPS
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-[#0c0c0f] border-r border-white/[0.08] flex-col h-screen sticky top-0 overflow-y-auto">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile} 
          />
          <aside className="relative w-80 max-w-[85vw] bg-[#0c0c0f] border-r border-white/10 h-full overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
};
