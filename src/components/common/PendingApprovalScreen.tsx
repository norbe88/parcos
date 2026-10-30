import React, { useState } from 'react';
import { Shield, Clock, Phone, Mail, MapPin, CheckCircle, ExternalLink, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { DealerProfile } from '../../db/seed';
import { TenantBrandBadge } from './TenantBrandBadge';
import { approveTenantBackend, getSuperAdminToken } from '../../utils/superAdminApi';

interface PendingApprovalScreenProps {
  dealer: DealerProfile;
  onApproved?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ dealer, onApproved }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Verificare dacă utilizatorul este SuperAdmin (token prezent în storage)
  const isSuperAdmin = typeof window !== 'undefined' && Boolean(
    sessionStorage.getItem('parcos_superadmin_key') ||
    localStorage.getItem('parcos_superadmin_key') ||
    sessionStorage.getItem('rxm_admin_session_token')
  );

  const handleQuickApprove = async () => {
    if (!dealer.slug) return;
    setIsApproving(true);
    setApprovalError(null);
    try {
      await approveTenantBackend(dealer.slug);
      if (onApproved) {
        onApproved();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setApprovalError(err.message || 'Eroare la aprobarea dealerului');
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* 👑 SuperAdmin 1-Click Approval Action Bar */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-500/10 border-b border-amber-500/30 px-4 py-3 sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Sesiune SuperAdmin Activă · Showroom-ul <strong>{dealer.name}</strong> ({dealer.slug}) este în așteptare</span>
            </div>
            <div className="flex items-center gap-3">
              {approvalError && (
                <span className="text-red-400 font-medium">{approvalError}</span>
              )}
              <button
                onClick={handleQuickApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isApproving ? 'Se activează...' : 'Aprobă & Activează Showroom-ul Acum'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-xl w-full bg-[#0d0d10] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Brand Identity */}
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <TenantBrandBadge dealer={dealer} size="lg" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Cont în Curs de Validare & Aprobare</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Showroom în Curs de Activare
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
              Parcul auto <strong className="text-zinc-200">{dealer.name}</strong> a fost înregistrat recent pe platforma ParcOS și se află în etapa de conformare și verificare tehnică.
            </p>
          </div>

          {/* Verification Safeguard Points */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex items-start gap-3 text-zinc-300">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Verificare Număr Mobil (SMS OTP):</strong> Numărul de contact a fost securizat și confirmat prin gateway-ul hardware GSM.
              </div>
            </div>

            <div className="flex items-start gap-3 text-zinc-300">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Validare Date Fiscale (ANAF v9):</strong> Se verifică CUI-ul, starea TVA și înregistrarea la Registrul Comerțului.
              </div>
            </div>

            <div className="flex items-start gap-3 text-zinc-300">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Activare Showroom & Sindicare:</strong> După aprobare, catalogul de vehicule și documentele de vânzare vor fi accesibile instant.
              </div>
            </div>
          </div>

          {/* Dealer Identification Card */}
          <div className="border-t border-white/10 pt-6 space-y-3 text-xs">
            <h3 className="font-mono uppercase tracking-wider text-zinc-400 text-[10px] font-bold">
              Date de Contact Showroom
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
              {dealer.cui && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Cod Fiscal (CUI)</span>
                  <span className="font-mono text-white font-semibold">{dealer.cui}</span>
                </div>
              )}

              {dealer.phonePrimary && (
                <a 
                  href={`tel:${dealer.phonePrimary.replace(/\s+/g, '')}`} 
                  className="bg-black/40 border border-white/5 p-3 rounded-xl hover:border-amber-500/30 transition-colors flex items-center gap-2 group"
                >
                  <Phone className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Telefon Contact</span>
                    <span className="font-semibold text-white truncate block">{dealer.phonePrimary}</span>
                  </div>
                </a>
              )}

              {dealer.address && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl col-span-1 sm:col-span-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Locație Parc Auto</span>
                    <span className="text-zinc-200 truncate block">{dealer.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Support / Contact ParcOS */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <span>Platformă operată de <strong>CARVANA S.R.L.</strong></span>
            <div className="flex items-center gap-3">
              <a href="https://parcos.ro" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Despre ParcOS
              </a>
              <span>·</span>
              <a href="tel:+40758511040" className="text-zinc-400 hover:text-white transition-colors">
                Suport: 0758 511 040
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
