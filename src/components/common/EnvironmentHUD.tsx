import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Wrench, 
  HardDrive, 
  CreditCard, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Check, 
  X, 
  RefreshCw, 
  Eye, 
  Building2, 
  Zap, 
  ArrowRight, 
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { DealerProfile } from '../../db/types';
import { isTenantFeatureEnabled } from '../../db/dealer';

interface EnvironmentHUDProps {
  currentTenant: DealerProfile;
  allTenants: DealerProfile[];
  onSelectTenant: (slug: string) => void;
  currentViewMode: 'showroom' | 'admin' | 'superadmin' | 'saas' | string;
  onSelectViewMode: (mode: 'showroom' | 'admin' | 'superadmin' | 'saas') => void;
  onToggleFeature: (slug: string, featureKey: string, currentVal: boolean) => void;
  showToast?: (msg: string) => void;
  isAdminAuthenticated?: boolean;
}

export const EnvironmentHUD: React.FC<EnvironmentHUDProps> = ({
  currentTenant,
  allTenants,
  onSelectTenant,
  currentViewMode,
  onSelectViewMode,
  onToggleFeature,
  showToast,
  isAdminAuthenticated
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('parcos_staging_hud_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);

  // Detectare mediu
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  
  const isProdHost = hostname === 'parcos.ro' || hostname === 'www.parcos.ro' || hostname === 'app.parcos.ro' || hostname.includes('rxmautomobile.ro');
  const isStagingDomain = hostname.includes('staging') || hostname.includes('sandbox');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  // Pe domeniile oficiale de producție, query param-ul ?env=staging este strict ignorat (permis doar pe local sau subdomenii dedicate)
  const hasStagingParam = (!isProdHost || isLocal) && (searchParams.get('env') === 'staging' || searchParams.has('staging'));
  
  const [localSimulateStaging, setLocalSimulateStaging] = useState<boolean>(() => {
    try {
      return localStorage.getItem('parcos_simulate_staging') === 'true';
    } catch {
      return false;
    }
  });

  const isStagingActive = isStagingDomain || hasStagingParam || (isLocal && localSimulateStaging);
  const isProduction = !isStagingActive && !isLocal;

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('parcos_staging_hud_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleLocalStaging = () => {
    setLocalSimulateStaging(prev => {
      const next = !prev;
      try {
        localStorage.setItem('parcos_simulate_staging', String(next));
      } catch {}
      if (showToast) {
        showToast(next ? '🟡 Mod Staging simulat ACTIVAT local.' : '⚪ Mod Staging DEZACTIVAT (Revenit la modul local standard).');
      }
      return next;
    });
  };

  // STRICT SECURITY GUARD 1: Pe mediul de producție nu randăm niciodată EnvironmentHUD (nici în showroom, nici în admin).
  // Previne expunerea IP-ului VPS-ului, link-urilor către staging sau ID-urilor de container către utilizatori sau vizitatori.
  if (isProduction) {
    return null;
  }

  // STRICT SECURITY GUARD 2: Pe rutele de administrare (admin / superadmin), dacă utilizatorul NU este autentificat
  // (se află pe ecranul de LoginGate), nu randăm niciodată bara de mediu/tenant switcher pentru a preveni
  // leak-ul vizual și încercările de bypass de autentificare.
  const isAdminView = currentViewMode === 'admin' || currentViewMode === 'superadmin';
  if (isAdminView && !isAdminAuthenticated) {
    return null;
  }

  // Când suntem pe localhost și nu am activat simularea de staging, lăsăm un comutator discret la baza ecranului (fără a obstrucționa butoanele de acțiune)
  if (isLocal && !isStagingActive) {
    return (
      <div className="fixed bottom-3 right-3 z-50">
        <button
          onClick={handleToggleLocalStaging}
          className="px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-black/80 hover:bg-white dark:hover:bg-black border border-slate-300 dark:border-white/10 hover:border-amber-500/50 text-slate-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-300 text-[10px] font-mono transition-all flex items-center gap-1.5 shadow-xl backdrop-blur-sm cursor-pointer"
          title="Activează bara de control Staging & Feature Rollout local"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Dev Local • Simulează Staging</span>
        </button>
      </div>
    );
  }

  // =========================================================================
  // MEDIU STAGING ACTIV (staging.parcos.ro, ?env=staging sau local staging)
  // =========================================================================

  // Dacă utilizatorul a minimizat HUD-ul, afișăm un trigger compact
  if (isCollapsed) {
    return (
      <aside 
        aria-label="Controale Staging"
        className="fixed top-2 right-2 z-50 flex items-center gap-2 bg-[#121215]/95 border-2 border-amber-500/60 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md text-xs font-bold text-amber-300 select-none animate-in fade-in"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="font-mono">STAGING [{currentTenant.slug || 'rxm'}]</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 text-[11px] font-normal capitalize">{currentViewMode}</span>
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
          title="Extinde panoul de control Staging & Rollout"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  const isReconActive = isTenantFeatureEnabled(currentTenant.features, 'reconTracker', currentTenant.slug);
  const isVaultActive = isTenantFeatureEnabled(currentTenant.features, 'googleDriveVault', currentTenant.slug);
  const isFinancingActive = isTenantFeatureEnabled(currentTenant.features, 'financingPortfolio', currentTenant.slug);

  return (
    <aside 
      aria-label="Bara de Mediu Staging & Rollout"
      className="sticky top-0 z-50 bg-[#0c0c0f]/95 border-b-2 border-amber-500/50 backdrop-blur-md px-3 sm:px-6 py-2 shadow-2xl text-xs select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* 1. STÂNGA: Identificator Staging & Host VPS */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🟡 STAGING AMBIENT</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-400">
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
              Staging Sandbox
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">ParcOS Engine</span>
          </div>

          {isLocal && (
            <button
              onClick={handleToggleLocalStaging}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 transition-colors"
              title="Oprește modul de simulare staging local"
            >
              Exit Sim
            </button>
          )}
        </div>

        {/* 2. CENTRU: Comutator Parc (Tenant) & Comutator Mod Vizualizare */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Selector Tenant Activ */}
          <div className="relative">
            <button
              onClick={() => setIsTenantDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              title="Alege parcul auto activ pentru testare"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[140px] truncate">{currentTenant.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isTenantDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#141418] border border-amber-500/30 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-white/[0.06]">
                  Alege Parcul Auto (Staging Target)
                </div>
                {allTenants.map(t => {
                  const isSelected = (t.slug || '').toLowerCase() === (currentTenant.slug || '').toLowerCase();
                  return (
                    <button
                      key={t.slug || t.cui}
                      onClick={() => {
                        if (t.slug) onSelectTenant(t.slug);
                        setIsTenantDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                          : 'text-zinc-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Switcher ViewMode: SuperAdmin / Dealer DMS / Showroom */}
          <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5 text-[11px] font-bold">
            <button
              onClick={() => onSelectViewMode('superadmin')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                currentViewMode === 'superadmin'
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Consola centrală SuperAdmin ParcOS"
            >
              👑 SuperAdmin
            </button>
            <button
              onClick={() => onSelectViewMode('admin')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                currentViewMode === 'admin'
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Panoul de gestiune al dealerului selectat (DMS)"
            >
              🏢 Dealer DMS
            </button>
            <button
              onClick={() => onSelectViewMode('showroom')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                currentViewMode === 'showroom'
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Showroom-ul public vizibil cumpărătorilor"
            >
              🚗 Showroom
            </button>
          </div>
        </div>

        {/* 3. DREAPTA: Feature Toggles Rapide & Link Producție */}
        <div className="flex items-center gap-2 justify-end">
          
          {/* Quick Rollout Toggle Chips */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Recon Tracker */}
            <button
              type="button"
              onClick={() => onToggleFeature(currentTenant.slug || 'rxm', 'reconTracker', isReconActive)}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                isReconActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
              }`}
              title="Activează/Dezactivează modulul de Service & Recon Tracker pentru acest parc"
            >
              <Wrench className="w-3 h-3" />
              <span>Recon: {isReconActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Toggle GDrive Vault */}
            <button
              type="button"
              onClick={() => onToggleFeature(currentTenant.slug || 'rxm', 'googleDriveVault', isVaultActive)}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                isVaultActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
              }`}
              title="Activează/Dezactivează sincronizarea Google Drive PRO Vault pentru acest parc"
            >
              <HardDrive className="w-3 h-3" />
              <span>Vault: {isVaultActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Toggle F&I Portfolio */}
            <button
              type="button"
              onClick={() => onToggleFeature(currentTenant.slug || 'rxm', 'financingPortfolio', isFinancingActive)}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                isFinancingActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
              }`}
              title="Activează/Dezactivează Portofoliul de Finanțări F&I pentru acest parc"
            >
              <CreditCard className="w-3 h-3" />
              <span>F&I: {isFinancingActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <span className="text-zinc-600 hidden lg:inline">|</span>

          {/* Link direct către Producție */}
          <a
            href="https://app.parcos.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-semibold transition-colors"
            title="Deschide mediul de producție live (parcos.ro / App 6)"
          >
            <span>↗ Producție</span>
          </a>

          {/* Buton minimizare */}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Minimizează bara Staging"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
