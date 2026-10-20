import React from 'react';
import { 
  Share2, Film, Download, FileSpreadsheet, Rss, Code2, 
  Sparkles, ExternalLink, Play, CheckCircle2 
} from 'lucide-react';
import { VehicleItem, DealerProfile, SEED_DEALER } from '../../db/seed';
import { HeroTikTokManager } from './HeroTikTokManager';

interface FeedsHubViewProps {
  cars: VehicleItem[];
  dealer?: DealerProfile;
  onTogglePinHero: (carId: string) => void;
  onMovePinnedOrder: (carId: string, direction: 'up' | 'down') => void;
  onUpdateTikTokInfo: (carId: string, tiktokUrl: string, tiktokViews?: string) => void;
  onOpenFeedExport: () => void;
  showToast: (msg: string) => void;
}

export const FeedsHubView: React.FC<FeedsHubViewProps> = ({
  cars,
  dealer = SEED_DEALER,
  onTogglePinHero,
  onMovePinnedOrder,
  onUpdateTikTokInfo,
  onOpenFeedExport,
  showToast
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Share2 className="w-3.5 h-3.5" /> Sindicare Stoc Multi-Canal & Rețele Sociale
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Feed-uri Stoc & Marketing Video
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Exportă automat inventarul parcului către reclame Meta (Facebook/Instagram), marketplace Autovit și ordonează videoclipurile TikTok din Hero Spotlight.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFeedExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Deschide Generator Feed-uri (Meta/Autovit)</span>
        </button>
      </div>

      {/* Card 1: Feed-uri automate disponibile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> META COMMERCE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                FB & IG Catalog
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Catalog Reclame Dinamice Meta</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fișier CSV optimizat conform specificațiilor Meta Catalog Manager cu titluri, imagini, preț și link direct.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFeedExport}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
          >
            Exportă Meta CSV
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Rss className="w-4 h-4" /> AUTOVIT XML
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Sindicare B2B
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Feed XML Autovit & OLX Pro</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sincronizare în masă pentru marketplace-urile partenere cu validare automată a seriei de șasiu.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFeedExport}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
          >
            Exportă Autovit XML
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> REST API JSON
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                REST Endpoint
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Endpoint JSON Live Inventory</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export structurat în format JSON pentru integratori terți, CRM sau agregatoare naționale de mașini rulate.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFeedExport}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
          >
            Generează JSON Feed
          </button>
        </div>
      </div>

      {/* Card 2: Manager TikTok Spotlight & Pinned Hero */}
      <div className="space-y-4">
        <HeroTikTokManager
          cars={cars}
          onTogglePinHero={onTogglePinHero}
          onMovePinnedOrder={onMovePinnedOrder}
          onUpdateTikTokInfo={onUpdateTikTokInfo}
          showToast={showToast}
        />
      </div>

    </div>
  );
};
