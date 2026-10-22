import React, { useState, useEffect } from 'react';
import { 
  Sliders, Eye, EyeOff, Check, RotateCcw, Sparkles,
  Download, ExternalLink, Bookmark, Copy, CheckCircle2,
  AlertCircle, Puzzle, ShieldCheck
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DealerProfile, SEED_DEALER } from '../../db/seed';
import { generateOlxBookmarkletUrl } from '../../utils/olxBookmarkletGenerator';

interface WorkspaceSettingsViewProps {
  dealer?: DealerProfile;
  showToast: (msg: string) => void;
  onOpenOnboardModal?: () => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({
  dealer = SEED_DEALER,
  showToast,
  onOpenOnboardModal
}) => {
  const { 
    settings, 
    setDensity, 
    setCurrency, 
    setAutoScanDocuments,
    toggleColumn, 
    resetSettings 
  } = useWorkspace();

  // Detecție extensie ParcOS instalată în browser
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isCopiedBookmarklet, setIsCopiedBookmarklet] = useState(false);

  useEffect(() => {
    const check = () => {
      const attr = document.documentElement.getAttribute('data-parcos-olx-extension');
      if (attr === 'installed' || (window as any).__PARCOS_OLX_EXTENSION__) {
        setIsExtensionInstalled(true);
      }
    };
    check();
    window.addEventListener('parcos-olx-extension-ready', () => setIsExtensionInstalled(true));
  }, []);

  const bookmarkletUrl = generateOlxBookmarkletUrl();

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletUrl);
    setIsCopiedBookmarklet(true);
    showToast('✓ Codul Bookmarklet a fost copiat în clipboard!');
    setTimeout(() => setIsCopiedBookmarklet(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sliders className="w-3.5 h-3.5" /> Preferințe Workspace & Configurare
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Setări Parc & Workspace Dealer OS
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Personalizează vizualizarea inventarului, moneda de lucru și opțiunile de lucru pentru echipa {dealer.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenOnboardModal && (
            <button
              type="button"
              onClick={onOpenOnboardModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Înrolează Parc Auto Nou</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetSettings();
              showToast('✓ Setările de workspace au fost resetate la valorile implicite.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetează Preferințe</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD SPECIAL SUPERADMIN: TURNKEY SHOWROOM ONBOARDING ENGINE              */}
      {/* ========================================================================= */}
      {onOpenOnboardModal && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                🏢 SuperAdmin Turnkey Engine • Netcup VPS (152.53.158.65)
              </div>
              <h2 className="text-lg font-black text-white">Înrolează un Nou Parc Auto Partener</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Deschide un showroom complet autonom în 60 secunde cu autocompletare oficială CUI din ANAF v9, 
                selector de teme Dark Luxury și izolare multi-domeniu.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenOnboardModal}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              🚀 Deschide Asistent Onboarding
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARD 1: PERSONALIZARE VIZUALĂ WORKSPACE (DENSITATE, MONEDĂ, COLOANE)      */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurare Vizualizare Inventar</h2>
              <p className="text-xs text-zinc-400">Opțiuni dinamice salvate automat în profilul tău local de lucru.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Opțiunea 1: Densitate Tabel */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Densitate Rânduri Tabel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDensity('compact');
                  showToast('✓ Densitate setată la: Compact (mai multe mașini pe ecran)');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.density === 'compact'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${settings.density === 'compact' ? 'text-amber-300' : 'text-white'}`}>
                    Compact
                  </span>
                  {settings.density === 'compact' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Spațiere redusă, font strâns, maximizând numărul de mașini vizibile simultan fără scroll.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDensity('comfortable');
                  showToast('✓ Densitate setată la: Confortabil (vedere aerisită)');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.density === 'comfortable'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${settings.density === 'comfortable' ? 'text-amber-300' : 'text-white'}`}>
                    Confortabil
                  </span>
                  {settings.density === 'comfortable' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Spațiere generoasă cu miniaturi mari, ideală pentru prezentare sau lucru pe tabletă.
                </p>
              </button>
            </div>
          </div>

          {/* Opțiunea 2: Monedă Implicită */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Monedă Implicită Afișare
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrency('EUR');
                  showToast('✓ Monedă setată la: EUR (€)');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.currency === 'EUR'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${settings.currency === 'EUR' ? 'text-amber-300' : 'text-white'}`}>
                    EUR (€)
                  </span>
                  {settings.currency === 'EUR' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Prețuri afișate prioritar în Euro, cu echivalentul în Lei afișat secundar (standard auto).
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrency('RON');
                  showToast('✓ Monedă setată la: RON (lei)');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.currency === 'RON'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${settings.currency === 'RON' ? 'text-amber-300' : 'text-white'}`}>
                    RON (lei)
                  </span>
                  {settings.currency === 'RON' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Prețuri afișate prioritar în Lei la cursul oficial BNR/BT, cu echivalentul în Euro secundar.
                </p>
              </button>
            </div>
          </div>

        </div>

        {/* Opțiunea 3: Selector Coloane Vizibile */}
        <div className="pt-4 border-t border-white/[0.06] space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Coloane Vizibile în Tabelul de Stoc
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { key: 'specs' as const, label: 'Specificații Tehnice', desc: 'Motor, CP, Cutie' },
              { key: 'pricing' as const, label: 'Preț & Marjă Profit', desc: 'Achiziție & Art. 312' },
              { key: 'status' as const, label: 'Status Showroom', desc: 'În Stoc / Vândut' },
              { key: 'olx' as const, label: 'Conexiune OLX (S9)', desc: 'Sincronizare Edge' },
              { key: 'social' as const, label: 'TikTok & Spotlight', desc: 'Vizualizări video' },
              { key: 'deadlines' as const, label: 'Termene Flotă', desc: 'Numere Roșii / ITP' }
            ].map(col => {
              const isVisible = settings.visibleColumns[col.key];

              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => {
                    toggleColumn(col.key);
                    showToast(`Coloana "${col.label}" a fost ${!isVisible ? 'activată' : 'ascunsă'}.`);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                    isVisible
                      ? 'bg-amber-500/10 border-amber-500/30 text-white'
                      : 'bg-white/[0.02] border-white/06 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold truncate">{col.label}</span>
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[9.5px] text-zinc-400 font-mono truncate">{col.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: ASISTENȚĂ SCANARE OPTICĂ & ÎNROLARE RAPIDĂ (CIV / TALON)          */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Scanare Optică Documente (CIV & Talon)</h2>
              <p className="text-xs text-zinc-400">Configurează comportamentul asistentului inteligent la încărcarea actelor vehiculului.</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border w-fit ${
            settings.autoScanDocuments
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}>
            {settings.autoScanDocuments ? '⚡ Scanare Automată Activă' : '✋ Mod Manual Activ'}
          </span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Comportament la Încărcare Poză / Document PDF
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opțiunea 1: Automat (Implicit & Recomandat) */}
            <button
              type="button"
              onClick={() => {
                setAutoScanDocuments(true);
                showToast('✓ Scanare automată activată: extragerea OCR pornește instant la adăugarea fișierului.');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                settings.autoScanDocuments
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    settings.autoScanDocuments ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-zinc-400'
                  }`}>
                    ⚡
                  </div>
                  <span className={`text-xs sm:text-sm font-bold ${settings.autoScanDocuments ? 'text-amber-300' : 'text-white'}`}>
                    Scanare Automată Imediată (Recomandat)
                  </span>
                </div>
                {settings.autoScanDocuments && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed pl-8">
                La selectarea, fotografierea sau tragerea fișierului (inclusiv paste cu Ctrl+V), citirea optică OCR și extragerea specificațiilor pornesc <strong className="text-zinc-200">instant, fără un al doilea clic</strong>. Formularul se completează automat în ~1.5 secunde.
              </p>
              <div className="mt-3 pl-8 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                  Setare Implicită Showroom
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Zero fricțiune dealer</span>
              </div>
            </button>

            {/* Opțiunea 2: Manual */}
            <button
              type="button"
              onClick={() => {
                setAutoScanDocuments(false);
                showToast('✓ Mod manual activat: documentul va fi previzualizat înainte de pornirea scanării.');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                !settings.autoScanDocuments
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    !settings.autoScanDocuments ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-zinc-400'
                  }`}>
                    ✋
                  </div>
                  <span className={`text-xs sm:text-sm font-bold ${!settings.autoScanDocuments ? 'text-amber-300' : 'text-white'}`}>
                    Previzualizare & Declanșare Manuală
                  </span>
                </div>
                {!settings.autoScanDocuments && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed pl-8">
                Documentul este doar încărcat și afișat în miniatură. Poți roti imaginea sau verifica orientarea, iar scanarea pornește strict când apeși butonul <strong className="text-zinc-200">«Scanează & Extrage Datele»</strong>.
              </p>
              <div className="mt-3 pl-8 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 border border-white/10 font-mono">
                  Control Pas cu Pas
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔌 INTEGRARE EXTENSIE CHROME OLX PUBLISHER & SMART BOOKMARKLET (NETCUP VPS) */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Extensie Browser & Integrări Publicare OLX
                </h3>
                {isExtensionInstalled ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Extensie Activă
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Găzduit pe Netcup VPS
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Pachet oficial de instalare directă pentru completarea automată a anunțurilor auto pe OLX România.
              </p>
            </div>
          </div>

          <a
            href="/downloads/parcos-olx-publisher.zip"
            download="parcos-olx-publisher.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            title="Descarcă arhiva ZIP a extensiei direct de pe serverul VPS"
          >
            <Download className="w-4 h-4" />
            <span>Descarcă Extensia Chrome (ZIP)</span>
          </a>
        </div>

        {/* 2 Metode de Instalare */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Card 1: Instalare Extensie Chrome din Arhivă ZIP */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#18181b] border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Puzzle className="w-3.5 h-3.5" /> Metoda 1: Extensie Chrome (1 Minut)
                </span>
                <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded font-mono">
                  v1.0.0 · Manifest V3
                </span>
              </div>
              
              <p className="text-xs text-zinc-300 leading-relaxed">
                Extensia este împachetată și găzduită direct pe serverul Netcup VPS al showroom-ului. Se instalează direct în Chrome în 3 pași simpli fără a fi nevoie de Web Store.
              </p>

              <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside bg-black/30 p-3 rounded-lg border border-white/5">
                <li>Apasă butonul de mai sus pentru a descărca fișierul <strong className="text-zinc-200">parcos-olx-publisher.zip</strong> și dezarhivează-l.</li>
                <li>Deschide Chrome și navighează la adresa <code className="text-amber-300 bg-white/10 px-1 py-0.5 rounded font-mono">chrome://extensions</code>.</li>
                <li>Activează <strong className="text-zinc-200">„Developer mode”</strong> (dreapta sus) și apasă <strong className="text-zinc-200">„Load unpacked”</strong> (Încarcă extensie dezarhivată), selectând folderul descărcat.</li>
              </ol>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="/downloads/parcos-olx-publisher.zip"
                download="parcos-olx-publisher.zip"
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Descarcă Pachetul (9.5 KB)</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  window.open('https://www.olx.ro/adding/', '_blank', 'noopener,noreferrer');
                }}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Deschide formularul OLX pentru a testa extensia"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Test OLX</span>
              </button>
            </div>
          </div>

          {/* Card 2: Smart Bookmarklet 1-Click (Zero Instalare) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#18181b] border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Bookmark className="w-3.5 h-3.5" /> Metoda 2: Smart Bookmarklet (Zero Instalare)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Instant
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Nu ai permisiuni de instalat extensii pe calculatorul de birou? Trage butonul de mai jos direct în bara ta de Favorite Chrome. Funcționează pe loc!
              </p>

              {/* Zona Draggable Bookmarklet */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-dashed border-amber-500/30 gap-2 text-center">
                <span className="text-[11px] text-zinc-400">Trage cu mouse-ul în bara de Favorite sus:</span>
                <a
                  href={bookmarkletUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('💡 Trage acest buton cu mouse-ul în bara ta de semne de carte sus!');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-grab active:cursor-grabbing hover:scale-105 transition-all flex items-center gap-2 select-none"
                  title="Trage acest buton în bara de semne de carte"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>⚡ ParcOS OLX Auto-Poster</span>
                </a>
                <span className="text-[10px] text-zinc-500">
                  (Tastează <kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-300 font-mono">Ctrl + Shift + B</kbd> dacă bara e ascunsă)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyBookmarklet}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isCopiedBookmarklet ? 'Copiat!' : 'Copiază Cod Bookmarklet'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Notă Securitate & Invariante */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Protecție Cont & Zero Costuri:</strong> Extensia rulează strict local în browserul tău, fără a stoca parole sau a efectua conexiuni externe neverificate. Nu folosește credite de publicare automată — tu verifici întotdeauna anunțul înainte de lansare.
          </div>
        </div>
      </div>

    </div>
  );
};
