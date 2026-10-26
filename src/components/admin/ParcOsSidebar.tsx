import React, { useState, useEffect } from 'react';
import { 
  Car, Users, FileText, Radio, QrCode, Share2, BarChart3, 
  Settings, Plus, ExternalLink, HelpCircle, LogOut, X, 
  ShieldCheck, Layers, Building2, ChevronRight, CheckCircle2, DollarSign, Mail,
  Sun, Moon, CreditCard, Puzzle, Wrench
} from 'lucide-react';
import { DealerProfile, SEED_DEALER, isTenantFeatureEnabled } from '../../db/seed';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getSavedFinancingDossiers } from '../../services/financingService';

export type AdminTabType = 
  | 'inventory'       // 🚗 Stoc & Inventar
  | 'recon_tracker'   // 🔧 Service & Pregătire (Recon & Document Vault)
  | 'crm'             // 📋 Conducta CRM Kanban
  | 'mail'            // 📧 ParcOS Mail Hub (PMH-301)
  | 'sales_docs'      // 📑 Centru Acte Vânzare (1-Click OCR)
  | 'olx'             // 🔄 Sincronizare OLX (Nod S9)
  | 'window_stickers' // 🪟 Fișe de Parbriz (QR Code)
  | 'feeds'           // 📡 Feed-uri Stoc & Social
  | 'analytics'       // 📊 Bilanț Financiar & KPI
  | 'settings'        // ⚙️ Setări Parc & Workspace
  | 'financing';      // 💳 Curs BT & Creditori

export interface ParcOsSidebarProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  dealer?: DealerProfile;
  stats: {
    totalVehicles: number;
    inStock: number;
    reserved: number;
    sold: number;
    discrepanciesCount: number;
    pinnedHero: number;
  };
  onOpenAddModal: () => void;
  onOpenShowroom?: () => void;
  onOpenExtensionModal?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Backward-compatibility alias
export type CarmatikSidebarProps = ParcOsSidebarProps;

export const ParcOsSidebar: React.FC<ParcOsSidebarProps> = ({
  activeTab,
  onTabChange,
  dealer = SEED_DEALER,
  stats,
  onOpenAddModal,
  onOpenShowroom,
  onOpenExtensionModal,
  onOpenHelp,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { settings, toggleDisplayMode } = useWorkspace();
  const displayMode = settings.displayMode;
  const [pendingFinancingCount, setPendingFinancingCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const dossiers = getSavedFinancingDossiers();
        const pending = dossiers.filter((d) => ['docs_pending', 'under_review', 'submitted'].includes(d.status)).length;
        setPendingFinancingCount(pending);
      } catch (err) {
        // silent
      }
    };
    updateCount();
    window.addEventListener('rxm_financing_updated', updateCount);
    return () => window.removeEventListener('rxm_financing_updated', updateCount);
  }, []);
  const handleSelectTab = (tab: AdminTabType) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const isReconEnabled = isTenantFeatureEnabled(dealer.features, 'reconTracker', dealer.slug);
  const isFinancingEnabled = isTenantFeatureEnabled(dealer.features, 'financingPortfolio', dealer.slug);

  const navItems = [
    {
      group: 'OPERAȚIUNI STOC',
      items: [
        {
          id: 'inventory' as AdminTabType,
          label: 'Stoc & Inventar',
          icon: Car,
          badge: `${stats.inStock} activ`,
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        },
        ...(isReconEnabled ? [{
          id: 'recon_tracker' as AdminTabType,
          label: 'Service & Pregătire',
          icon: Wrench,
          badge: 'Recon & Acte',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }] : []),
        {
          id: 'crm' as AdminTabType,
          label: 'Conductă CRM Kanban',
          icon: Users,
          badge: 'Lead-uri',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        },
        ...(isFinancingEnabled ? [{
          id: 'financing' as AdminTabType,
          label: 'Finanțări (F&I)',
          icon: CreditCard,
          badge: pendingFinancingCount > 0 ? `${pendingFinancingCount} în lucru` : 'F&I Suite',
          badgeColor: pendingFinancingCount > 0 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }] : []),

        {
          id: 'mail' as AdminTabType,
          label: 'ParcOS Mail Hub',
          icon: Mail,
          badge: 'SES • S3',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        },
        {
          id: 'sales_docs' as AdminTabType,
          label: 'Centru Acte Vânzare',
          icon: FileText,
          badge: '1-Click OCR',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        },
        {
          id: 'window_stickers' as AdminTabType,
          label: 'Fișe Parbriz A4',
          icon: QrCode,
          badge: 'QR Code',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        }
      ]
    },
    {
      group: 'INTEGRĂRI EDGE & MARKETING',
      items: [
        {
          id: 'olx' as AdminTabType,
          label: 'Sincronizare OLX (S9)',
          icon: Radio,
          badge: stats.discrepanciesCount > 0 ? `${stats.discrepanciesCount} discr.` : 'S9 Sync',
          badgeColor: stats.discrepanciesCount > 0 
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'feeds' as AdminTabType,
          label: 'Feed-uri & Social Media',
          icon: Share2,
          badge: 'Meta / Autovit',
          badgeColor: 'bg-white/10 text-zinc-300 border-white/15'
        },
        {
          id: 'analytics' as AdminTabType,
          label: 'Bilanț Financiar & KPI',
          icon: BarChart3,
          badge: 'Art. 312',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }
      ]
    },
    {
      group: 'SETĂRI & SPAȚIU DE LUCRU',
      items: [
        {
          id: 'settings' as AdminTabType,
          label: 'Setări Parc & Workspace',
          icon: Settings,
          badge: 'TVA 21%',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col min-h-full justify-between select-none">
      
      {/* 1. Header Dealer & Branding ParcOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium tracking-wide text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0" />
                <a 
                  href="https://parcos.ro" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-200 hover:text-amber-400 font-semibold transition-colors"
                  title="ParcOS Dealership Platform"
                >
                  ParcOS
                </a>
                <span className="text-zinc-500 font-normal">by</span>
                <a 
                  href="https://carvana.ro" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-400 hover:text-amber-400 font-normal transition-colors"
                  title="Carvana SRL"
                >
                  Carvana SRL
                </a>
              </div>
              <h2 className="text-xs sm:text-[13px] font-black text-white tracking-tight whitespace-nowrap mt-0.5" title={dealer.name}>
                {dealer.name}
              </h2>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Închide meniul"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Buton Principal: + Adaugă Mașină (CIV OCR) */}
        <button
          type="button"
          onClick={() => {
            onOpenAddModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Adaugă Vehicul (CIV OCR)</span>
        </button>

        {/* 3. Grupuri de Navigare Verticală */}
        <nav className="space-y-5 pt-1">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group touch-manipulation cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-sm shadow-amber-500/10 font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-amber-400' : 'text-zinc-400 group-hover:text-white'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border shrink-0 ${item.badgeColor}`}>
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

      {/* 4. Footer Sidebar: Telemetrie & Acțiuni Suport */}
      <div className="pt-4 border-t border-white/[0.08] space-y-2">
                {/* Comutator Ergonomic Mod Diurn / Nocturn (OP2) */}
        <button
          type="button"
          onClick={toggleDisplayMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border cursor-pointer touch-manipulation select-none ${
            displayMode === 'light'
              ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 hover:bg-amber-500/15 font-semibold'
              : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
          }`}
          title="Comută mod diurn / nocturn pentru ecran"
          aria-label="Comută mod diurn / nocturn"
        >
          <div className="flex items-center gap-2">
            {displayMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="font-medium text-[11.5px]">
              {displayMode === 'light' ? 'Mod Diurn (Luminos)' : 'Mod Nocturn (Dark)'}
            </span>
          </div>
          <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
            displayMode === 'light'
              ? 'bg-amber-500/15 text-amber-800 border-amber-500/30 font-bold'
              : 'bg-white/[0.05] text-zinc-400 border-white/[0.08]'
          }`}>
            {displayMode === 'light' ? '☀️ DIURN' : '🌙 NOCTURN'}
          </span>
        </button>

        {/* Status Sistem & Nod Edge */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[10.5px]">
          <div className="flex items-center justify-between text-zinc-400 mb-1 font-mono">
            <span>NOD S9 GATEWAY</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ONLINE
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Cluster NVMe</span>
            <span className="text-zinc-400 font-mono">TVA 21% &bull; Art. 312</span>
          </div>
        </div>

        {/* Link Vezi Showroom Public */}
        {onOpenShowroom && (
          <button
            type="button"
            onClick={() => {
              onOpenShowroom();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-white/[0.06] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Vezi Showroom Public</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}

        {/* Asistent & Extensie OLX 1-Click */}
        {onOpenExtensionModal && (
          <button
            type="button"
            onClick={() => {
              onOpenExtensionModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-teal-300 hover:text-white hover:bg-teal-500/10 transition-all border border-teal-500/20 bg-teal-500/5 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Puzzle className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold">Extensie & Asistent OLX</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">1-Click</span>
          </button>
        )}

        {/* Ghid Ajutor */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={() => {
              onOpenHelp();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all border border-white/[0.06] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Ghid Utilizare & FAQ</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Ajutor</span>
          </button>
        )}

        {/* Deconectare */}
        {onLogout && (
          <button
            type="button"
            onClick={() => {
              onLogout();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ieșire din Panou</span>
          </button>
        )}

        <div className="text-[9.5px] font-medium text-zinc-500 text-center pt-1 flex items-center justify-center gap-1">
          <img src="/brand/icon-32x32.png" alt="ParcOS" className="w-3.5 h-3.5 rounded object-cover shadow-xs inline-block" />
          <span>Powered by</span>
          <a href="https://parcos.ro" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors text-zinc-400 font-semibold">ParcOS</a>
          <span>&bull;</span>
          <a href="https://carvana.ro" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors text-zinc-400">Carvana SRL</a>
          <span>&bull; v2.4</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Sidebar Persistent pe Desktop (Desktop & Tabletă Mare) — Rămâne fix și vizibil la scroll în jos */}
      <aside className="hidden md:flex flex-col w-64 xl:w-72 shrink-0 bg-[#0c0c0e] border-r border-white/[0.08] p-4 sticky top-0 self-start h-screen max-h-screen overflow-y-auto overscroll-contain z-20">
        {sidebarContent}
      </aside>

      {/* Drawer Glisant pe Mobil (Ecran < 768px) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex animate-in fade-in duration-200">
          <div className="w-72 max-w-[85vw] bg-[#0c0c0e] border-r border-white/10 h-full p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
          <div 
            className="flex-1" 
            onClick={onCloseMobile} 
            aria-label="Închide fundalul"
          />
        </div>
      )}
    </>
  );
};

// Backward-compatibility export alias
export { ParcOsSidebar as CarmatikSidebar };
export default ParcOsSidebar;
