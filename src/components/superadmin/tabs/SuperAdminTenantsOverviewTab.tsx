import React from 'react';
import { 
  Building2, Shield, Plus, Search, RefreshCw, Eye, Sliders, Download, CheckCircle, 
  Database, Zap, FileText, X
} from 'lucide-react';
import { DealerProfile } from '../../../db/seed';
import { TenantTier, TenantStatus, DealerThemePreset } from '../../../db/types';
import { SuperAdminNavTab } from '../SuperAdminSidebar';

interface SuperAdminTenantsOverviewTabProps {
  metrics: {
    totalTenants: number;
    activeTenants: number;
    ocrEnabledCount: number;
    fgoEnabledCount: number;
    totalCapacity: number;
  };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedStatusFilter: 'all' | TenantStatus;
  setSelectedStatusFilter: (status: 'all' | TenantStatus) => void;
  filteredTenants: DealerProfile[];
  selectedTenantSlug: string;
  setSelectedTenantSlug: (slug: string) => void;
  setActiveNavTab: (tab: SuperAdminNavTab) => void;
  onImpersonateTenant: (slug: string) => void;
  onQuickTierChange: (slug: string, tier: TenantTier) => void;
  onExportBackup: (tenant: DealerProfile) => void;
  onOpenOnboarding: () => void;
  onApproveTenant?: (slug: string) => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

const THEME_LABELS: Record<DealerThemePreset, { label: string; badge: string; dot: string }> = {
  obsidian_gold: { label: 'Obsidian Gold', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  clean_white: { label: 'Clean White', badge: 'bg-zinc-100/10 text-white border-white/20', dot: 'bg-white' },
  midnight_blue: { label: 'Midnight Blue', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  carbon_red: { label: 'Carbon Red', badge: 'bg-red-500/10 text-red-300 border-red-500/30', dot: 'bg-red-400' },
  emerald_prestige: { label: 'Emerald Prestige', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
};

export const SuperAdminTenantsOverviewTab: React.FC<SuperAdminTenantsOverviewTabProps> = ({
  metrics,
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  filteredTenants,
  selectedTenantSlug,
  setSelectedTenantSlug,
  setActiveNavTab,
  onImpersonateTenant,
  onQuickTierChange,
  onExportBackup,
  onOpenOnboarding,
  onApproveTenant,
  onManualRefresh,
  isRefreshing
}) => {
  return (
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

          <div className="flex items-center gap-3">
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Sincronizează datele cu PostgreSQL"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenOnboarding}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-black shadow-xl shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap self-start lg:self-auto hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Înrolează Parc Nou (ANAF v9)</span>
            </button>
          </div>
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
          {(['all', 'pending_approval', 'active', 'demo', 'suspended'] as const).map((status) => {
            const label = status === 'all' 
              ? 'Toate' 
              : status === 'pending_approval' 
                ? 'În Așteptare' 
                : status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                  selectedStatusFilter === status
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            );
          })}
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
                <th className="px-4 py-3.5">Stare & Cotă Stoc</th>
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
                        <div className="flex items-center gap-1.5">
                          <select
                            value={t.tier || 'starter'}
                            onChange={(e) => onQuickTierChange(t.slug || '', e.target.value as TenantTier)}
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 focus:border-amber-400 outline-none cursor-pointer"
                            title="Schimbă rapid pachetul SaaS"
                          >
                            <option value="starter">Starter (25)</option>
                            <option value="pro">Pro (60)</option>
                            <option value="enterprise">Enterprise (∞)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <span className={`w-2 h-2 rounded-full ${themeMeta.dot}`} />
                          <span>{themeMeta.label}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 space-y-1.5 min-w-[170px]">
                        {(() => {
                          const quota = t.maxVehiclesQuota || 25;
                          const isEnterprise = t.tier === 'enterprise' || quota >= 999;
                          const activeCount = t.activeVehiclesCount ?? (t.slug === 'rxm' ? 24 : 10);
                          const percent = isEnterprise ? 0 : Math.min(100, Math.round((activeCount / quota) * 100));
                          const barColor = percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
                          const badgeColor = percent >= 100 ? 'text-red-400 bg-red-500/10 border-red-500/30' : percent >= 80 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  t.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : t.status === 'demo'
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      : 'bg-red-500/10 text-red-300 border border-red-500/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'pending_approval' ? 'bg-amber-400' : t.status === 'active' ? 'bg-emerald-400' : t.status === 'demo' ? 'bg-blue-400' : 'bg-red-400'}`} />
                                  {t.status}
                                </span>
                                {!isEnterprise && (
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                                    {percent}%
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                                <span>Stoc activ:</span>
                                <span className="text-white font-bold">{activeCount} / {isEnterprise ? 'Nelimitat' : quota}</span>
                              </div>

                              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                  style={{ width: `${isEnterprise ? 10 : percent}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
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
                          {(t.status === 'pending_approval' || (t.status === 'pending' && !t.isActive)) && onApproveTenant && (
                            <button
                              onClick={() => onApproveTenant(t.slug || '')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer animate-pulse"
                              title="Aprobă dealerul și activează showroom-ul public cu notificare SMS"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Aprobă</span>
                            </button>
                          )}

                          <button
                            onClick={() => onImpersonateTenant(t.slug || 'rxm')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
                            title="Intră în spațiul de lucru al dealerului ca SuperAdmin"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Masquerade</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTenantSlug(t.slug || 'rxm');
                              setActiveNavTab('tenant_profile');
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                            title="Editează Profil & FGO"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onExportBackup(t)}
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
  );
};
