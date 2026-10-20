import React, { useState } from 'react';
import { 
  Car, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  MessageSquare, 
  RefreshCw, 
  Inbox, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  Layers,
  Palette,
  Eye,
  Building2,
  Lock,
  Phone,
  Mail,
  Check
} from 'lucide-react';

interface ParcOSSaaSPageProps {
  onSwitchToDealer?: (slug: string) => void;
  onOpenSuperAdmin?: () => void;
}

export const ParcOSSaaSPage: React.FC<ParcOSSaaSPageProps> = ({ 
  onSwitchToDealer, 
  onOpenSuperAdmin 
}) => {
  const [selectedThemePreview, setSelectedThemePreview] = useState<'rxm' | 'mpi_auto' | 'top_auto'>('rxm');
  const [demoCui, setDemoCui] = useState('');
  const [demoParkName, setDemoParkName] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const themePresets = [
    {
      slug: 'rxm',
      name: 'RXM Luxury (Obsidian Gold)',
      tagline: 'Dark luxury cu accente aurii pentru parcuri premium și sport',
      accent: '#d4af37',
      bgClass: 'from-[#09090b] via-[#121214] to-[#1a1710]',
      badgeColor: 'border-[#d4af37]/30 text-[#d4af37]',
      domain: 'rxmautomobile.ro'
    },
    {
      slug: 'mpi_auto',
      name: 'MPI Auto Cluj (Clean White)',
      tagline: 'Light modern, curat și transparent pentru parcuri de familie & navetiști',
      accent: '#2563eb',
      bgClass: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-zinc-900',
      badgeColor: 'border-blue-600/30 text-blue-600',
      domain: 'mpiauto.ro'
    },
    {
      slug: 'top_auto',
      name: 'Top Auto Transilvania (Midnight Blue)',
      tagline: 'Albastru profund metalizat pentru dealeri de flote corporate și importuri',
      accent: '#38bdf8',
      bgClass: 'from-[#030712] via-[#0b1329] to-[#0f172a]',
      badgeColor: 'border-sky-400/30 text-sky-400',
      domain: 'topautotransilvania.ro'
    }
  ];

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoParkName.trim()) return;
    setDemoSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Bar Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#070709]/80 border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
            <Car className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-lg text-white">Parc<span className="text-amber-400">OS</span></span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono">v2.4 Multi-Tenant</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Module</a>
          <a href="#themes" className="hover:text-white transition-colors">Showroom Tematic</a>
          <a href="#automation" className="hover:text-white transition-colors">Scanner CIV & AI</a>
          <a href="#pricing" className="hover:text-white transition-colors">Prețuri</a>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenSuperAdmin && (
            <button
              onClick={onOpenSuperAdmin}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>SuperAdmin</span>
            </button>
          )}
          <a
            href="#onboard"
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5"
          >
            <span>Înscrie Parcul</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-amber-500/10 via-amber-400/5 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sistemul Autonom de Operare pentru Parcuri Auto din România</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Showroom Autonom, Scanner CIV & Oferte WhatsApp într-o <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500">singură platformă</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          ParcOS elimină haosul din administrarea stocului: scanează actele mașinilor cu AI, generează oferte cu Garanție de Rezervare (Banca Transilvania), sincronizează anunțurile OLX și oferă fiecărui parc un showroom web ultra-rapid cu tema proprie.
        </p>

        {/* CTA Group */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onSwitchToDealer?.('rxm')}
            className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Vezi Showroom Live (RXM Flagship)</span>
          </button>
          <a
            href="#onboard"
            className="px-6 py-3.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all flex items-center gap-2 text-sm"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Onboarding Instant în 2 Minute</span>
          </a>
        </div>

        {/* Live Key Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">100%</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Multi-Tenant Izolat</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">&lt; 3 sec</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Scanare CIV / Talon OCR</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">21% TVA</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Calcul Strict Deductibil</div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">1-Click</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Garanție Banca Transilvania</div>
          </div>
        </div>
      </section>

      {/* Interactive Theme Switcher Section */}
      <section id="themes" className="py-20 border-t border-zinc-800/80 bg-zinc-950/60 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-medium mb-3">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Personalizare Fără Efort</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Un motor, teme adaptate fiecărui parc</h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400">
              Fiecare dealer își alege estetica: de la Dark Luxury pentru parcuri sport/premium, până la Clean White pentru autoturisme accesibile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themePresets.map((preset) => {
              const isSelected = selectedThemePreview === preset.slug;
              return (
                <div
                  key={preset.slug}
                  onClick={() => setSelectedThemePreview(preset.slug as any)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? 'border-amber-400/80 bg-zinc-900 shadow-xl shadow-amber-500/10' 
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.domain}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{preset.name}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">{preset.tagline}</p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToDealer?.(preset.slug);
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Lansează Showroom</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                        Selectat
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium mb-3">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Arhitectură Completă Turnkey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Toate uneltele de care are nevoie un parc modern</h2>
          <p className="mt-4 text-base text-zinc-400">
            Fără foi volante, fără oferte scrise greoi pe telefon și fără calcule greșite de TVA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Scanner CIV & Talon cu AI</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fotografiezi cartea sau talonul mașinii direct de pe telefon. Motorul OCR extrage automat VIN, anul fabricației, cilindreea, puterea (kW/CP) și norma de poluare.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-amber-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Fără introducere manuală de date
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Oferte WhatsApp & Garanție BT</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Compune oferte elegante în 10 secunde și trimite-le pe WhatsApp direct clientului. Include opțional contul oficial de Garanție de Rezervare la Banca Transilvania.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-blue-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Garanție de Participare securizată
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Sincronizare Delta OLX</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Scanează automat anunțurile active de pe OLX și Autovit. Notifică instant agenții dacă o mașină a fost marcată vândută sau dacă prețurile diferă.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-emerald-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Zero discrepanțe de stoc
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Showroom Mail Hub & Lead Pool</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Toate cererile venite de pe site și portaluri ajung într-un inbox unificat. Agenții preiau lead-urile cu 1-click (Robert, Mădălina etc.) fără suprapuneri.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-purple-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Notificări Web Push & PWA
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Onboarding Instant prin CUI ANAF</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Introduci CUI-ul parcului auto, iar sistemul interoghează ANAF v9 și extrage automat denumirea legală, statutul TVA (strict 21%), adresa și datele fiscale.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-amber-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Conformitate fiscală garantată
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-7 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Inspecții & Rapoarte carVertical</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fiecare mașină include puncte de verificare tehnică în 120 de pași și integrare nativă pentru verificarea istoricului carVertical direct în pagină.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-xs text-rose-400/90 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Transparență totală pentru cumpărători
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding / Lead Form Section */}
      <section id="onboard" className="py-20 border-t border-zinc-800/80 bg-zinc-950 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Lansează Parcul Tău</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Activează ParcOS pentru parcul tău</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Introdu datele de bază și echipa noastră activează showroom-ul tău în mai puțin de 24 de ore.
            </p>
          </div>

          {demoSubmitted ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-white">Cerere recepționată cu succes!</h3>
              <p className="text-sm text-zinc-300 mt-2">
                Am înregistrat parcul <strong>{demoParkName}</strong>. Te vom contacta în scurt timp pentru activarea domeniului și importul stocului.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nume Parc Auto *</label>
                  <input
                    type="text"
                    required
                    value={demoParkName}
                    onChange={(e) => setDemoParkName(e.target.value)}
                    placeholder="Ex: Auto Park Transilvania"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">CUI Firmă (pentru autofill ANAF)</label>
                  <input
                    type="text"
                    value={demoCui}
                    onChange={(e) => setDemoCui(e.target.value)}
                    placeholder="Ex: RO12345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Număr de Telefon *</label>
                <input
                  type="tel"
                  required
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  placeholder="Ex: 0740 000 000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20 transition-all text-sm flex items-center justify-center gap-2 mt-2"
              >
                <span>Solicită Activarea Parcului</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-12 px-4 sm:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Car className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-zinc-300">ParcOS - Your Dealership Platform</span>
          <span>•</span>
          <span>CARVANA SRL</span>
        </div>
      </footer>
    </div>
  );
};
