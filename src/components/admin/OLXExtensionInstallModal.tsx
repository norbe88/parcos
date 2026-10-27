import React, { useState, useEffect } from 'react';
import { 
  X, Download, ExternalLink, Bookmark, Copy, Check, 
  Puzzle, CheckCircle2, AlertCircle, ShieldCheck, Sparkles,
  ArrowRight, Laptop, Chrome, HelpCircle
} from 'lucide-react';
import { generateOlxBookmarkletUrl } from '../../utils/olxBookmarkletGenerator';

interface OLXExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const OLXExtensionInstallModal: React.FC<OLXExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'extension' | 'bookmarklet'>('extension');
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
  }, [isOpen]);

  if (!isOpen) return null;

  const bookmarkletUrl = generateOlxBookmarkletUrl();

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletUrl);
    setIsCopiedBookmarklet(true);
    showToast('✓ Codul Bookmarklet a fost copiat în clipboard!');
    setTimeout(() => setIsCopiedBookmarklet(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#121215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Instalare Extensie ParcOS OLX Publisher
                </h3>
                {isExtensionInstalled ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Activă în browser
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Găzduire Securizată
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Automatizează completarea mașinilor din ParcOS direct în formularul OLX România
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex border-b border-white/[0.08] bg-[#151518]">
          <button
            type="button"
            onClick={() => setActiveTab('extension')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'extension'
                ? 'border-blue-400 text-blue-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Chrome className="w-3.5 h-3.5" />
            <span>Extensie Chrome (1 minut)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookmarklet')}
            className={`pb-2.5 px-3 font-semibold text-xs transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bookmarklet'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Smart Bookmarklet (Zero Instalare)</span>
          </button>
        </div>

        {/* Corp Modal */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {activeTab === 'extension' ? (
            <div className="space-y-4">
              {/* Notificare de Stare */}
              {isExtensionInstalled ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block text-white font-bold">Extensia este deja activă în acest browser!</strong>
                    Când apeși pe butonul <strong>„Exportă pe OLX”</strong> la orice mașină, formularul se va completa automat.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-zinc-300 leading-relaxed">
                  Extensia este găzduită direct pe infrastructura cloud a platformei. Se instalează în <strong>3 pași simpli</strong> în orice browser bazat pe Chromium (Google Chrome, Brave, Edge).
                </div>
              )}

              {/* Card 3 Pași Instalare */}
              <div className="space-y-3 bg-[#18181b] border border-white/5 rounded-xl p-4">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-extrabold">1</span>
                  <span>Descarcă Arhiva ZIP a Extensiei</span>
                </div>
                <div className="pl-7">
                  <p className="text-xs text-zinc-400 mb-2.5">
                    Apasă butonul de mai jos pentru a salva pachetul oficial (9.5 KB) pe calculator și dezarhivează-l într-un folder (ex: pe Desktop sau în Descărcări).
                  </p>
                  <a
                    href="/downloads/parcos-olx-publisher.zip"
                    download="parcos-olx-publisher.zip"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarcă parcos-olx-publisher.zip</span>
                  </a>
                </div>

                <div className="border-t border-white/5 my-2 pt-2 text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-extrabold">2</span>
                  <span>Deschide Pagina de Extensii Chrome</span>
                </div>
                <div className="pl-7">
                  <p className="text-xs text-zinc-400">
                    Copiază și deschide într-o filă nouă adresa: <code className="text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs select-all">chrome://extensions</code>
                  </p>
                </div>

                <div className="border-t border-white/5 my-2 pt-2 text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-extrabold">3</span>
                  <span>Activează „Developer mode” & „Load unpacked”</span>
                </div>
                <div className="pl-7">
                  <p className="text-xs text-zinc-400">
                    În dreapta sus bifează comutatorul <strong>Developer mode</strong>. Apoi în stânga sus apasă <strong>Load unpacked</strong> (Încarcă extensie dezarhivată) și selectează folderul dezarhivat. Gata!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed">
                <strong>Nu ai voie să instalezi extensii pe calculatorul de serviciu?</strong><br />
                Smart Bookmarklet-ul funcționează fără instalare! Tragi butonul galben în bara de sus de semne de carte (Favorite) din Chrome.
              </div>

              {/* Zona Draggable Bookmarklet */}
              <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-dashed border-amber-500/30 gap-3 text-center">
                <span className="text-xs text-zinc-400">Trage cu mouse-ul butonul galben direct în bara de sus de Favorite:</span>
                <a
                  href={bookmarkletUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('💡 Trage acest buton cu mouse-ul în bara ta de sus de semne de carte!');
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 cursor-grab active:cursor-grabbing hover:scale-105 transition-all flex items-center gap-2 select-none"
                  title="Trage acest buton în bara de semne de carte"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>⚡ ParcOS OLX Auto-Poster</span>
                </a>
                <span className="text-[11px] text-zinc-500">
                  (Dacă nu vezi bara de sus, apasă <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">Ctrl + Shift + B</kbd>)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBookmarklet}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                >
                  {isCopiedBookmarklet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{isCopiedBookmarklet ? 'Copiat!' : 'Copiază Cod Bookmarklet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Banner de Securitate */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Securitate 100%:</strong> Extensia rulează strict local în browserul tău. Nu stochează parole și lasă butonul final de publicare pentru revizuirea ta, prevenind orice cheltuială accidentală de credite.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0e0e11] flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.open('https://www.olx.ro/adding/', '_blank', 'noopener,noreferrer')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Deschide Pagina OLX (Test)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            Am Înțeles / Închide
          </button>
        </div>
      </div>
    </div>
  );
};
