import React from 'react';
import { Landmark, Building2, Mail, Sliders, Save, Sparkles, ExternalLink, Check } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';
import { TenantTier, DealerIntroConfig } from '../../../db/types';

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
  editedIntro: DealerIntroConfig;
  setEditedIntro: React.Dispatch<React.SetStateAction<DealerIntroConfig>>;
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
  editedIntro,
  setEditedIntro,
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

        {/* 5. Experiență Vizuală & Showroom Intro */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Experiență Vizuală & Showroom Intro
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Configurează stilul de intrare cinematică, video-ul, logo-ul, culorile și timpii de declanșare în 0 secunde.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const targetUrl = currentTenant.domain 
                  ? `https://${currentTenant.domain}/?intro=true`
                  : `/?dealer=${currentTenant.slug}&intro=true`;
                window.open(targetUrl, '_blank');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Deschide showroom-ul dealerului cu forțare intro"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Testează Intro în Showroom</span>
            </button>
          </div>

          {/* Selector Tip Intro */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-2">Stil Introducere Showroom</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'none', label: 'Fără Intro', desc: 'Bypass instant, intrare directă în stoc' },
                { id: 'split_shutter', label: 'Split Shutter Auriu', desc: 'Cortină centrală cu laser și motto' },
                { id: 'cinematic_video', label: 'Video Cinematic cu Faruri & Neon', desc: 'Clip fullscreen cu halo reactiv la stingere faruri' },
              ].map(mode => {
                const isSelected = (editedIntro?.type || 'split_shutter') === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setEditedIntro(prev => ({ ...prev, type: mode.id as any }))}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10' 
                        : 'bg-[#18181f] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                        {mode.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-relaxed">{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configurații specifice Video Cinematic */}
          {editedIntro?.type === 'cinematic_video' && (
            <div className="space-y-4 pt-2 border-t border-white/[0.04]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Video Background (.mp4 / R2)</label>
                  <input
                    type="text"
                    value={editedIntro.videoUrl || ''}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="/videos/mpi-showroom-intro-v2.mp4?v=20261031_0725"
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Logo Iluminat (PNG / SVG alb)</label>
                  <input
                    type="text"
                    value={editedIntro.logoUrl || ''}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="/images/mpi-logo-white.png"
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Tagline / Subtitlu Showroom</label>
                  <input
                    type="text"
                    value={editedIntro.tagline || ''}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Centura Apahida • Showroom Rulate"
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Timpi & Milisecunde */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#18181f] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Stingere Faruri (s)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={editedIntro.headlightOffTime ?? 4.1}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, headlightOffTime: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#121215] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Intensificare Glow (s)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={editedIntro.maxGlowTime ?? 6.0}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, maxGlowTime: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#121215] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Ieșire Cortină (s)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={editedIntro.exitTime ?? 7.5}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, exitTime: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#121215] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">Durată Tranziție (ms)</label>
                  <input
                    type="number"
                    step="50"
                    min="200"
                    max="5000"
                    value={editedIntro.transitionDurationMs ?? 1500}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, transitionDurationMs: parseInt(e.target.value, 10) || 1500 }))}
                    className="w-full bg-[#121215] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Selector Culoare Accent */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">Culoare Accent Laser & Halou Neon</label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { color: '#e11d48', label: 'Crimson Red' },
                    { color: '#f59e0b', label: 'Amber Gold' },
                    { color: '#3b82f6', label: 'Sapphire Blue' },
                    { color: '#10b981', label: 'Emerald Green' },
                    { color: '#ffffff', label: 'Pure White' },
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setEditedIntro(prev => ({ ...prev, accentColor: c.color }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        (editedIntro.accentColor || '#e11d48').toLowerCase() === c.color.toLowerCase()
                          ? 'border-white text-white bg-white/10'
                          : 'border-white/10 text-zinc-400 hover:text-white bg-[#18181f]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <input
                    type="text"
                    value={editedIntro.accentColor || '#e11d48'}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, accentColor: e.target.value }))}
                    placeholder="#e11d48"
                    className="w-24 bg-[#18181f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configurații specifice Split Shutter */}
          {editedIntro?.type === 'split_shutter' && (
            <div className="space-y-4 pt-2 border-t border-white/[0.04]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">URL Emblemă / Logo Showroom</label>
                  <input
                    type="text"
                    value={editedIntro.logoUrl || ''}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="/images/rxm-logo-gold.png"
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Durată Animație Deschidere (ms)</label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    max="5000"
                    value={editedIntro.duration ?? 1800}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, duration: parseInt(e.target.value, 10) || 1800 }))}
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Motto / Tagline Introductiv</label>
                  <input
                    type="text"
                    value={editedIntro.tagline || ''}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="„Fiecare drum începe cu alegerea potrivită.”"
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Selector Culoare Accent */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">Culoare Accent Cusătură Laser</label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { color: '#f59e0b', label: 'Amber Gold' },
                    { color: '#3b82f6', label: 'Sapphire Blue' },
                    { color: '#e11d48', label: 'Crimson Red' },
                    { color: '#10b981', label: 'Emerald Green' },
                    { color: '#ffffff', label: 'Pure White' },
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setEditedIntro(prev => ({ ...prev, accentColor: c.color }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        (editedIntro.accentColor || '#f59e0b').toLowerCase() === c.color.toLowerCase()
                          ? 'border-white text-white bg-white/10'
                          : 'border-white/10 text-zinc-400 hover:text-white bg-[#18181f]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <input
                    type="text"
                    value={editedIntro.accentColor || '#f59e0b'}
                    onChange={(e) => setEditedIntro(prev => ({ ...prev, accentColor: e.target.value }))}
                    placeholder="#f59e0b"
                    className="w-24 bg-[#18181f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}
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
