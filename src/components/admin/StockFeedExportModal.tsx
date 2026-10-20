import React, { useState, useMemo } from 'react';
import { 
  X, Download, Copy, Check, FileSpreadsheet, FileCode, Code, 
  ExternalLink, Sparkles, CheckCircle2, ShieldCheck, RefreshCw, Eye
} from 'lucide-react';
import { VehicleItem, DealerProfile, SEED_DEALER } from '../../db/seed';
import { 
  generateFacebookMarketplaceCsv, 
  generateAutovitXml, 
  generateStockJsonFeed, 
  downloadFeedFile 
} from '../../utils/stockFeedGenerator';

interface StockFeedExportModalProps {
  isOpen: boolean;
  cars: VehicleItem[];
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: DealerProfile;
}

type FeedType = 'meta_csv' | 'autovit_xml' | 'json';

export const StockFeedExportModal: React.FC<StockFeedExportModalProps> = ({
  isOpen,
  cars,
  onClose,
  showToast,
  dealer = SEED_DEALER
}) => {
  const [activeFeedType, setActiveFeedType] = useState<FeedType>('meta_csv');
  const [includeReserved, setIncludeReserved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filtrare vehicule
  const exportCars = useMemo(() => {
    return cars.filter(c => {
      if (c.status === 'sold') return false;
      if (!includeReserved && c.status === 'reserved') return false;
      return true;
    });
  }, [cars, includeReserved]);

  // Generare conținut feed activ
  const generatedContent = useMemo(() => {
    if (activeFeedType === 'meta_csv') {
      return generateFacebookMarketplaceCsv(exportCars, dealer);
    }
    if (activeFeedType === 'autovit_xml') {
      return generateAutovitXml(exportCars, dealer);
    }
    return generateStockJsonFeed(exportCars, dealer);
  }, [activeFeedType, exportCars, dealer]);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const todayIso = new Date().toISOString().split('T')[0];

  const handleDownload = () => {
    if (activeFeedType === 'meta_csv') {
      const filename = `Meta-Facebook-Vehicle-Feed_${dealer.name.replace(/\s+/g, '-')}_${todayIso}.csv`;
      downloadFeedFile(generatedContent, filename, 'text/csv');
      showToast(`Feed-ul CSV "${filename}" a fost descărcat cu succes!`);
    } else if (activeFeedType === 'autovit_xml') {
      const filename = `Autovit-OLX-Stock-Feed_${dealer.name.replace(/\s+/g, '-')}_${todayIso}.xml`;
      downloadFeedFile(generatedContent, filename, 'application/xml');
      showToast(`Feed-ul XML "${filename}" a fost descărcat cu succes!`);
    } else {
      const filename = `Stock-Feed-API_${dealer.name.replace(/\s+/g, '-')}_${todayIso}.json`;
      downloadFeedFile(generatedContent, filename, 'application/json');
      showToast(`Fișierul JSON "${filename}" a fost descărcat cu succes!`);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopiedKey('content');
    showToast('✓ Conținutul feed-ului a fost copiat în clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyEndpoint = (feedName: string, path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(feedName);
    showToast(`✓ URL-ul endpoint-ului ${feedName} a fost copiat!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Trunchiere sigură pentru preview
  const previewSnippet = generatedContent.split('\n').slice(0, 45).join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[94vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#121215]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                Generator Feed Stoc Multi-Platformă
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  EXPORT LIVE
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Sincronizare automată pentru <strong className="text-white">{dealer.name}</strong> • {exportCars.length} vehicule active selectate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
            aria-label="Închide panoul de export"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corp Modal */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Selector Carduri Formate de Feed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Card 1: Meta Commerce Manager / Facebook Marketplace */}
            <div 
              onClick={() => setActiveFeedType('meta_csv')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                activeFeedType === 'meta_csv'
                  ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Meta Catalog</span>
                </div>
                <span className="text-[9.5px] bg-blue-500/20 text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded">.CSV</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Facebook Marketplace & Instagram Shopping. 23 coloane standardizate conform Meta Vehicle Inventory Feed.
              </p>
              {activeFeedType === 'meta_csv' && (
                <div className="mt-2.5 flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selectat pentru export</span>
                </div>
              )}
            </div>

            {/* Card 2: Autovit & OLX Pro Dealer XML */}
            <div 
              onClick={() => setActiveFeedType('autovit_xml')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                activeFeedType === 'autovit_xml'
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Autovit / OLX</span>
                </div>
                <span className="text-[9.5px] bg-amber-500/20 text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded">.XML</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Import în bloc pentru conturi de dealer PRO. Include opțiuni tehnice detaliate, 21% TVA și poze HD.
              </p>
              {activeFeedType === 'autovit_xml' && (
                <div className="mt-2.5 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selectat pentru export</span>
                </div>
              )}
            </div>

            {/* Card 3: REST API JSON Feed */}
            <div 
              onClick={() => setActiveFeedType('json')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                activeFeedType === 'json'
                  ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Code className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">REST API</span>
                </div>
                <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">.JSON</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Integrare directă pentru website-uri partenere, agregatoare externe sau microservicii cloud.
              </p>
              {activeFeedType === 'json' && (
                <div className="mt-2.5 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selectat pentru export</span>
                </div>
              )}
            </div>

          </div>

          {/* Filtre & Setări Include */}
          <div className="bg-black/40 border border-white/[0.08] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-zinc-300 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeReserved}
                  onChange={(e) => setIncludeReserved(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-0 bg-[#18181b] border-white/20 accent-blue-500 cursor-pointer"
                />
                <span>Include și mașinile cu status <strong>Rezervat</strong></span>
              </label>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Total vehicule exportabile: <strong className="text-emerald-400 font-mono">{exportCars.length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(prev => !prev)}
                className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isPreviewOpen ? 'Ascunde Previzualizare' : 'Previzualizează Cod'}</span>
              </button>
            </div>
          </div>

          {/* Butoane Acțiune Descărcare & Copiere Conținut */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownload}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Descarcă Fișierul {activeFeedType === 'meta_csv' ? '.CSV' : activeFeedType === 'autovit_xml' ? '.XML' : '.JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyContent}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              {copiedKey === 'content' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copiat în Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copiază Textul Feed-ului</span>
                </>
              )}
            </button>
          </div>

          {/* Secțiune Endpoint-uri Publice pentru Sincronizare Programată (Cron / Meta Commerce Fetch) */}
          <div className="bg-[#18181b] border border-white/[0.08] p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Endpoint-uri Publice pentru Programare Automată (Cron / Meta Scheduled Fetch)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Copiază aceste link-uri în Meta Commerce Manager sau Autovit pentru sincronizare periodică la fiecare 6 sau 12 ore:
            </p>

            <div className="space-y-2">
              {[
                { name: 'Meta Catalog CSV', path: '/api/feeds/meta-vehicles.csv', desc: 'Sincronizare zilnică Facebook & Instagram' },
                { name: 'Autovit / OLX XML', path: '/api/feeds/autovit-stock.xml', desc: 'Import periodic stoc Autovit Dealer PRO' },
                { name: 'REST JSON Feed', path: '/api/feeds/stock.json', desc: 'Preluare date JSON pentru aplicații mobile/externe' }
              ].map(endpoint => (
                <div key={endpoint.path} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 border border-white/10 p-2.5 rounded-lg text-xs font-mono">
                  <div className="min-w-0">
                    <span className="text-zinc-400 text-[10.5px] font-sans block">{endpoint.name} ({endpoint.desc}):</span>
                    <span className="text-blue-300 font-bold text-[11px] truncate block">{window.location.origin}{endpoint.path}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyEndpoint(endpoint.name, endpoint.path)}
                    className="shrink-0 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedKey === endpoint.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiat!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copiază Link</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Previzualizare Cod (Dacă este activată) */}
          {isPreviewOpen && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Previzualizare primele linii ({activeFeedType.toUpperCase()}):</span>
                <span className="font-mono text-[10px] text-zinc-500">Mărime totală: ~{(generatedContent.length / 1024).toFixed(1)} KB</span>
              </div>
              <pre className="bg-black/80 border border-white/10 p-3.5 rounded-xl font-mono text-[10.5px] text-emerald-300 overflow-x-auto max-h-56 leading-relaxed select-all">
                {previewSnippet}
                {generatedContent.split('\n').length > 45 && '\n... [restul înregistrărilor decupate pentru previzualizare] ...'}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
