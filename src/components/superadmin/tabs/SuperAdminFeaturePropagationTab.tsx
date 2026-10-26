import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Sparkles, 
  Layers,
  Check,
  ExternalLink
} from 'lucide-react';
import { DealerProfile } from '../../../db/seed';
import { TenantFeatures } from '../../../db/types';

interface SuperAdminFeaturePropagationTabProps {
  currentTenant: DealerProfile;
  allTenants?: DealerProfile[];
  featureDefinitions: { key: keyof TenantFeatures; label: string; desc: string; icon: any }[];
  isPropagating: boolean;
  onPropagateAll: () => void;
  onPropagateSingle: (key: keyof TenantFeatures) => void;
  onToggleFeature: (slug: string, key: keyof TenantFeatures, currentVal: boolean) => void;
}

export const SuperAdminFeaturePropagationTab: React.FC<SuperAdminFeaturePropagationTabProps> = ({
  currentTenant,
  allTenants = [],
  featureDefinitions,
  isPropagating,
  onPropagateAll,
  onPropagateSingle,
  onToggleFeature
}) => {
  const [confirmPromoteKey, setConfirmPromoteKey] = useState<keyof TenantFeatures | null>(null);
  const [selectedStagingSlug, setSelectedStagingSlug] = useState<string>(() => {
    return currentTenant.slug || 'rxm_sandbox';
  });

  // Identificare Staging vs. Producție (Selectabil per showroom)
  const stagingTenant = allTenants.find((t) => t.slug === selectedStagingSlug) || allTenants.find((t) => t.slug === 'rxm_sandbox') || currentTenant;
  const prodTenant = allTenants.find((t) => t.slug === 'rxm') || allTenants[0];

  // Identificare diferențe (Drift)
  const driftedFeatures = featureDefinitions.filter((def) => {
    const stagingVal = Boolean(stagingTenant?.features?.[def.key]);
    const prodVal = Boolean(prodTenant?.features?.[def.key]);
    return stagingVal !== prodVal;
  });

  const hasDrift = driftedFeatures.length > 0;

  const handlePromoteFeature = (key: keyof TenantFeatures) => {
    if (!prodTenant?.slug) return;
    onToggleFeature(prodTenant.slug, key, false); // Activează pe producție
    setConfirmPromoteKey(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. Header Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Propagare Module, Feature Toggles & Release Gate
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Arhitectură de protecție Producție vs. Staging: Noile module sunt testate pe clona RXM Sandbox înainte de promovarea manuală pe rxmautomobile.ro.
          </p>
        </div>

        <button
          onClick={onPropagateAll}
          disabled={isPropagating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isPropagating ? 'animate-spin' : ''}`} />
          <span>{isPropagating ? 'Se propagă...' : '⚡ Propagă Global pe Toate Showroom-urile'}</span>
        </button>
      </div>

      {/* 2. STAGING VS PRODUCȚIE DRIFT MONITOR & RELEASE GATE (Ticket 08) */}
      <div className="bg-[#121215] border border-amber-500/30 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Release Gate & Drift Monitor
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Staging ({stagingTenant?.name || 'RXM Sandbox'})</span>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <span>Producție ({prodTenant?.name || 'RXM Automobile Producție'})</span>
            </h3>
            
            {/* Selector Tenant Staging */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Parc Țintă Test:</span>
              <select
                value={selectedStagingSlug}
                onChange={(e) => setSelectedStagingSlug(e.target.value)}
                className="bg-black/60 border border-amber-500/30 rounded-lg px-2.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {allTenants.map((t) => (
                  <option key={t.slug || t.cui} value={t.slug} className="bg-zinc-900 text-white">
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-zinc-400 mt-1">
              Comparație în timp real a invariantelor de feature flag între mediul de testare și magazinul live.
            </p>
          </div>

          {/* Badge Stare Drift */}
          <div className="shrink-0">
            {hasDrift ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>🟡 {driftedFeatures.length} Modul(e) în Testare pe Staging (Blocate pe Producție)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>🟢 100% Sincronizat cu Producția (Zero Drift)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Side-by-Side Comparativ Staging vs. Prod */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-black/40 border-b border-white/[0.08] text-[11px] font-bold text-zinc-400">
              <tr>
                <th className="p-3">Modul / Funcționalitate</th>
                <th className="p-3">Staging ({stagingTenant?.slug || 'rxm_sandbox'})</th>
                <th className="p-3">Producție ({prodTenant?.slug || 'rxm'})</th>
                <th className="p-3 text-center">Status Drift</th>
                <th className="p-3 text-right">Acțiune Release Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {featureDefinitions.map((def) => {
                const Icon = def.icon;
                const stagingActive = Boolean(stagingTenant?.features?.[def.key]);
                const prodActive = Boolean(prodTenant?.features?.[def.key]);
                const isDrifting = stagingActive !== prodActive;

                return (
                  <tr 
                    key={def.key} 
                    className={`transition-colors ${isDrifting ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          stagingActive ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-zinc-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{def.label}</div>
                          <div className="text-[10px] text-zinc-400">{def.desc}</div>
                        </div>
                      </div>
                    </td>

                    {/* Stare Staging */}
                    <td className="p-3">
                      {stagingActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Activ pe Staging
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <Lock className="w-3 h-3" /> Inactiv
                        </span>
                      )}
                    </td>

                    {/* Stare Producție */}
                    <td className="p-3">
                      {prodActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Activ Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          <Lock className="w-3 h-3 text-red-400" /> 🔒 Blocat pe Producție
                        </span>
                      )}
                    </td>

                    {/* Status Drift */}
                    <td className="p-3 text-center">
                      {isDrifting ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          DRIFT ACTIV
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-500 bg-white/[0.04]">
                          ALINIAT
                        </span>
                      )}
                    </td>

                    {/* Acțiune Release Gate */}
                    <td className="p-3 text-right">
                      {stagingActive && !prodActive ? (
                        <button
                          type="button"
                          onClick={() => setConfirmPromoteKey(def.key)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Promovează pe Producție
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">Nicio acțiune necesară</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Matrice de Feature Flags per Showroom Activ */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white">Matrice Module per Showroom Activ ({currentTenant.name})</h3>
            <p className="text-xs text-zinc-400">Activează sau blochează granular funcții doar pentru acest parc.</p>
          </div>

          <a
            href={`https://staging.parcos.ro?dealer=${currentTenant.slug || 'rxm'}#admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Deschide consola DMS a acestui dealer în mediul de Staging (App 7)"
          >
            <span>↗ Testează pe Staging</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featureDefinitions.map((def) => {
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

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPropagateSingle(def.key)}
                    disabled={isPropagating}
                    title={`Propagă modulul "${def.label}" global pe toate showroom-urile active din PostgreSQL`}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Global</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFeature(currentTenant.slug || 'rxm', def.key, isEnabled)}
                    aria-label={`Comută modulul ${def.label}`}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Confirmare Promovare pe Producție */}
      {confirmPromoteKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-white">Confirmare Promovare pe Producție</h4>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Sunteți sigur că doriți să promovați modulul <strong className="text-amber-300">{featureDefinitions.find(f => f.key === confirmPromoteKey)?.label}</strong> direct pe showroom-ul de producție <strong className="text-white">rxmautomobile.ro</strong>?
            </p>
            <p className="text-[11px] text-zinc-400">
              Modulul va deveni instantaneu accesibil în panoul de administrare al dealerului de producție.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setConfirmPromoteKey(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors cursor-pointer"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => handlePromoteFeature(confirmPromoteKey)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                🚀 Confirmă & Activează Live
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
