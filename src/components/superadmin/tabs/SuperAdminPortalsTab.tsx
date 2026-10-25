import React from 'react';
import { Radio, CheckCircle2, Filter, Check, Copy, ExternalLink } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';

interface SuperAdminPortalsTabProps {
  currentTenant: DealerProfile;
  eligibleCarsCount: number | null;
  copiedFeed: 'autovit' | 'meta' | null;
  setCopiedFeed: (v: 'autovit' | 'meta' | null) => void;
  showToast: (msg: string) => void;
}

export const SuperAdminPortalsTab: React.FC<SuperAdminPortalsTabProps> = ({
  currentTenant,
  eligibleCarsCount,
  copiedFeed,
  setCopiedFeed,
  showToast
}) => {
  const autovitFeedUrl = `https://${currentTenant.domain || 'parcos.ro'}/api/feed/autovit/${currentTenant.slug || 'rxm'}`;
  const metaFeedUrl = `https://${currentTenant.domain || 'parcos.ro'}/api/feed/csv/${currentTenant.slug || 'rxm'}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-4 border-b border-white/[0.08]">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-blue-400" />
          Sincronizare Portaluri Auto (Autovit / OLX / Meta): {currentTenant.name}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Feed-uri XML și CSV live pentru publicarea automată a stocului parcului pe portalurile auto naționale.
        </p>
      </div>

      {/* Carduri Status & Mașini Eligibile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121215] border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Status Sindicare</div>
            <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Feed-uri Active 24/7
            </div>
          </div>
          <Radio className="w-5 h-5 text-blue-400" />
        </div>

        <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Mașini Eligibile în Feed</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">
              {eligibleCarsCount !== null ? `${eligibleCarsCount} vehicule active` : 'Se calculează...'}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Filtrare Automată</div>
            <div className="text-sm font-black text-zinc-300 mt-0.5">
              Strict în stoc (fără vândute)
            </div>
          </div>
          <Filter className="w-5 h-5 text-zinc-400" />
        </div>
      </div>

      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              URL Feed XML Autovit Pro & OLX
            </label>
            <span className="text-[10px] font-mono text-zinc-500">Format: XML • Standard Autovit Schema v3</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={autovitFeedUrl}
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 select-all"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(autovitFeedUrl);
                setCopiedFeed('autovit');
                showToast('✓ Link Feed Autovit copiat în clipboard!');
                setTimeout(() => setCopiedFeed(null), 2500);
              }}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Copiază URL Feed Autovit"
            >
              {copiedFeed === 'autovit' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedFeed === 'autovit' ? 'Copiat!' : 'Copiază'}</span>
            </button>
            <a
              href={autovitFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer"
              title="Deschide Feed XML"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Furnizați acest link managerului de cont Autovit Pro sau introduceți-l în panoul OLX B2B pentru actualizare automată la fiecare 15 minute.
          </p>
        </div>

        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              URL Feed CSV Meta Catalog (Facebook & Instagram Shop)
            </label>
            <span className="text-[10px] font-mono text-zinc-500">Format: CSV • Meta Vehicles Product Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={metaFeedUrl}
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 select-all"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(metaFeedUrl);
                setCopiedFeed('meta');
                showToast('✓ Link Meta Catalog copiat în clipboard!');
                setTimeout(() => setCopiedFeed(null), 2500);
              }}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Copiază URL Feed Meta"
            >
              {copiedFeed === 'meta' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedFeed === 'meta' ? 'Copiat!' : 'Copiază'}</span>
            </button>
            <a
              href={metaFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer"
              title="Deschide Feed CSV"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Compatibil 100% cu Meta Commerce Manager (Data Feed Source). Generare campanii dinamice auto pe Facebook & Instagram.
          </p>
        </div>
      </div>
    </div>
  );
};
