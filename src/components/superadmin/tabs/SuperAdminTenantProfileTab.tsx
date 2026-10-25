import React from 'react';
import { Landmark, Building2, Mail, Sliders, Save } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';
import { TenantTier } from '../../../db/types';

interface SuperAdminTenantProfileTabProps {
  currentTenant: DealerProfile;
  editedLegalName: string;
  setEditedLegalName: (v: string) => void;
  editedCui: string;
  setEditedCui: (v: string) => void;
  editedRegCom: string;
  setEditedRegCom: (v: string) => void;
  editedAddress: string;
  setEditedAddress: (v: string) => void;
  editedPhonePrimary: string;
  setEditedPhonePrimary: (v: string) => void;
  editedWhatsapp: string;
  setEditedWhatsapp: (v: string) => void;
  editedEmail: string;
  setEditedEmail: (v: string) => void;
  editedBankName: string;
  setEditedBankName: (v: string) => void;
  editedIbanRon: string;
  setEditedIbanRon: (v: string) => void;
  editedDomain: string;
  setEditedDomain: (v: string) => void;
  editedTier: TenantTier;
  setEditedTier: (v: TenantTier) => void;
  editedMaxQuota: number;
  setEditedMaxQuota: (v: number) => void;
  onSave: (e: React.FormEvent) => void;
}

export const SuperAdminTenantProfileTab: React.FC<SuperAdminTenantProfileTabProps> = ({
  currentTenant,
  editedLegalName,
  setEditedLegalName,
  editedCui,
  setEditedCui,
  editedRegCom,
  setEditedRegCom,
  editedAddress,
  setEditedAddress,
  editedPhonePrimary,
  setEditedPhonePrimary,
  editedWhatsapp,
  setEditedWhatsapp,
  editedEmail,
  setEditedEmail,
  editedBankName,
  setEditedBankName,
  editedIbanRon,
  setEditedIbanRon,
  editedDomain,
  setEditedDomain,
  editedTier,
  setEditedTier,
  editedMaxQuota,
  setEditedMaxQuota,
  onSave
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-400" />
            Profil Juridic & Fiscal: {currentTenant.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configurează datele oficiale ale parcului auto folosite pe facturi, contracte DITL și în antetul showroom-ului.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
            TVA Invariant: 21% Strict
          </span>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        
        {/* 1. Date Identitate Firmă */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" /> Date Juridice & Înregistrare
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Denumire Firmă (SRL / SA)</label>
              <input
                type="text"
                value={editedLegalName}
                onChange={(e) => setEditedLegalName(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">CUI / CIF</label>
              <input
                type="text"
                value={editedCui}
                onChange={(e) => setEditedCui(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nr. Reg. Comerțului (J.../...)</label>
              <input
                type="text"
                value={editedRegCom}
                onChange={(e) => setEditedRegCom(e.target.value)}
                placeholder="J12/1234/2020"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Adresă Sediu Social / Showroom</label>
              <input
                type="text"
                value={editedAddress}
                onChange={(e) => setEditedAddress(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Domeniu Web Propriu</label>
              <input
                type="text"
                value={editedDomain}
                onChange={(e) => setEditedDomain(e.target.value)}
                placeholder="rxmautomobile.ro"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* 2. Date Bancare & Cont de Garanție */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-400" /> Cont de Garanție & Încasări
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Bancă Parteneră</label>
              <input
                type="text"
                value={editedBankName}
                onChange={(e) => setEditedBankName(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Cont IBAN Principal (RON) — Cont de Garanție</label>
              <input
                type="text"
                value={editedIbanRon}
                onChange={(e) => setEditedIbanRon(e.target.value)}
                placeholder="RO00BTRLEURT000000000000"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* 3. Contact & Canale Notificare */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" /> Contact & Comunicare Showroom
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Telefon Principal (Vânzări)</label>
              <input
                type="text"
                value={editedPhonePrimary}
                onChange={(e) => setEditedPhonePrimary(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Număr WhatsApp Leads</label>
              <input
                type="text"
                value={editedWhatsapp}
                onChange={(e) => setEditedWhatsapp(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Email Showroom (Inbound / SES)</label>
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* 4. Pachet SaaS & Alocare Cotă Stoc */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" /> Pachet SaaS & Alocare Cotă Stoc Vehicule
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nivel Abonament SaaS</label>
              <select
                value={editedTier}
                onChange={(e) => {
                  const t = e.target.value as TenantTier;
                  setEditedTier(t);
                  if (t === 'starter') setEditedMaxQuota(25);
                  else if (t === 'pro') setEditedMaxQuota(60);
                  else if (t === 'enterprise') setEditedMaxQuota(999);
                }}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="starter">Starter (99 €/lună + TVA • Max 25 vehicule)</option>
                <option value="pro">Pro (199 €/lună + TVA • Max 60 vehicule)</option>
                <option value="enterprise">Enterprise (349 €/lună + TVA • Nelimitat)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">Limită Cotă Vehicule Active în Stoc</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={editedMaxQuota}
                onChange={(e) => setEditedMaxQuota(Number(e.target.value))}
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        {/* Buton Salvare */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvează Modificări Profil</span>
          </button>
        </div>

      </form>

    </div>
  );
};
