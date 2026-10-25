import React from 'react';
import { Mail } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';

interface SuperAdminMailTabProps {
  currentTenant: DealerProfile;
}

export const SuperAdminMailTab: React.FC<SuperAdminMailTabProps> = ({ currentTenant }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-4 border-b border-white/[0.08]">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-amber-400" />
          ParcOS Mail Hub (PMH-301): {currentTenant.name}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Infrastructură dedicată de e-mail tranzacțional pe AWS SES cu rutare inbound S3 și verificare Cloudflare DNS.
        </p>
      </div>

      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <div className="text-sm font-bold text-white">Domeniu Email: {currentTenant.domain || 'rxmautomobile.ro'}</div>
            <div className="text-xs text-zinc-400 font-mono">Înregistrat în SES eu-central-1 • DKIM 2048-bit</div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            VERIFICAT CLOUDFLARE
          </span>
        </div>

        <div className="text-xs text-zinc-400 space-y-1">
          <p>• Adrese alocate: <span className="text-zinc-200 font-mono font-semibold">contact@{currentTenant.domain || 'rxmautomobile.ro'}</span>, <span className="text-zinc-200 font-mono font-semibold">vanzari@{currentTenant.domain || 'rxmautomobile.ro'}</span></p>
          <p>• Rutare Inbound: S3 Bucket ➔ Node Micro-API ➔ Webhook Push în timp real.</p>
        </div>
      </div>
    </div>
  );
};
