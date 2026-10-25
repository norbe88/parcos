import React from 'react';
import { 
  DollarSign, RefreshCw, Clock, AlertTriangle, CheckCircle2, 
  Check, Landmark, FileText 
} from 'lucide-react';
import { DealerProfile } from '../../../db/seed';
import { SaasBillingDetails } from '../../../utils/superAdminApi';

interface SuperAdminBillingTabProps {
  selectedTenant: DealerProfile | undefined;
  selectedTenantSlug: string;
  billingDetails: SaasBillingDetails | null;
  isLoadingBilling: boolean;
  isGeneratingInvoice: boolean;
  isSweepingOverdue: boolean;
  billingError: string | null;
  onRefreshBilling: () => void;
  onRunOverdueSweep: () => void;
  onTriggerInvoice: () => void;
  onPayInvoice: (id: string) => void;
}

export const SuperAdminBillingTab: React.FC<SuperAdminBillingTabProps> = ({
  selectedTenant,
  selectedTenantSlug,
  billingDetails,
  isLoadingBilling,
  isGeneratingInvoice,
  isSweepingOverdue,
  billingError,
  onRefreshBilling,
  onRunOverdueSweep,
  onTriggerInvoice,
  onPayInvoice
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-4 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-400" />
              Abonamente & Facturare SaaS ParcOS (B2B)
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              CARVANA SRL • Strict 21% TVA
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestiune facturi lunare de utilizare platformă, termen de grație 14 zile și încasare în Contul de Garanție Banca Transilvania.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefreshBilling}
            disabled={isLoadingBilling}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBilling ? 'animate-spin text-amber-400' : ''}`} />
            Reîmprospătează
          </button>

          <button
            onClick={onRunOverdueSweep}
            disabled={isSweepingOverdue}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Verifică scadențele și aplică starea 'suspended' dacă termenul de 14 zile a expirat"
          >
            <Clock className={`w-3.5 h-3.5 ${isSweepingOverdue ? 'animate-spin text-red-400' : 'text-zinc-400'}`} />
            Sweep Scadențe (14 zile)
          </button>

          <button
            onClick={onTriggerInvoice}
            disabled={isGeneratingInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <DollarSign className={`w-4 h-4 ${isGeneratingInvoice ? 'animate-spin' : ''}`} />
            {isGeneratingInvoice ? 'Se emite factura...' : 'Emite Factură Manuală Acum'}
          </button>
        </div>
      </div>

      {billingError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{billingError}</span>
          </div>
          <button onClick={onRefreshBilling} className="underline hover:text-white font-bold">
            Reîncearcă
          </button>
        </div>
      )}

      {/* Banner Stare Abonament & Detalii Tenant */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono uppercase text-zinc-400">Showroom Selectat:</span>
            <span className="text-base font-black text-white">{selectedTenant?.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-zinc-300">
              slug: {selectedTenantSlug}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            CUI: <span className="text-zinc-200 font-mono">{selectedTenant?.cui || 'N/A'}</span> • Email Facturare: <span className="text-zinc-200 font-mono">{selectedTenant?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Stare Abonament</div>
            <div className="mt-0.5">
              {billingDetails?.subscriptionStatus === 'suspended' || selectedTenant?.status === 'suspended' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  Suspendat (Plată Restantă)
                </span>
              ) : billingDetails?.subscriptionStatus === 'in_grace_period' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  În Perioadă de Grație (14 zile)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Activ (La Zi)
                </span>
              )}
            </div>
          </div>

          <div className="text-right pl-4 border-l border-white/[0.08]">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Următoarea Facturare</div>
            <div className="text-xs font-mono font-bold text-zinc-200 mt-1">
              {billingDetails?.nextBillingDate 
                ? new Date(billingDetails.nextBillingDate).toLocaleDateString('ro-RO')
                : 'Programată automat'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3 Carduri Pachete SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Starter */}
        <div className={`p-5 rounded-2xl border transition-all ${
          selectedTenant?.tier === 'starter'
            ? 'bg-amber-500/[0.04] border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-[#121215] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">Starter</span>
            {selectedTenant?.tier === 'starter' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                Pachet Activ
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">99 €</span>
              <span className="text-xs text-zinc-400">/ lună + TVA</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              119.79 € brut cu 21% TVA deductibil
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Limită <strong>25 de vehicule active</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scanner OCR CIV & Talon</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>FGO Facturare & Proforme e-Factura</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronizare stoc OLX</span>
            </li>
          </ul>
        </div>

        {/* Pro */}
        <div className={`p-5 rounded-2xl border transition-all ${
          selectedTenant?.tier === 'pro'
            ? 'bg-amber-500/[0.04] border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-[#121215] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Pro</span>
            {selectedTenant?.tier === 'pro' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                Pachet Activ
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">199 €</span>
              <span className="text-xs text-zinc-400">/ lună + TVA</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              240.79 € brut cu 21% TVA deductibil
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Limită <strong>60 de vehicule active</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>TikTok Reel Studio 9:16 Video</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>ParcOS Mail Hub (SES / S3)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronizare Autovit S9</span>
            </li>
          </ul>
        </div>

        {/* Enterprise */}
        <div className={`p-5 rounded-2xl border transition-all ${
          selectedTenant?.tier === 'enterprise'
            ? 'bg-amber-500/[0.04] border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-[#121215] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-400 uppercase tracking-wider">Enterprise</span>
            {selectedTenant?.tier === 'enterprise' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                Pachet Activ
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">349 €</span>
              <span className="text-xs text-zinc-400">/ lună + TVA</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              422.29 € brut cu 21% TVA deductibil
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>Stoc Nelimitat</strong> de vehicule</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Domeniu Propriu cu SSL Automat</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>AutoLicit.ro Push Licitații B2B</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Suport Tehnic Prioritar 24/7</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Informații Holding Emitent CARVANA SRL */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-white font-bold flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400" />
            <span>Emitent Facturi B2B: CARVANA SRL (CUI: RO48392019 • J12/2890/2023)</span>
          </div>
          <p className="text-[11px]">
            Încasare strict în Contul de Garanție / Curent B2B deschis la Banca Transilvania.
          </p>
        </div>
        <div className="font-mono text-[11px] space-y-0.5 text-right md:text-left">
          <div>IBAN RON: <span className="text-zinc-200">RO45BTRL01301205P88888XX</span></div>
          <div>IBAN EUR: <span className="text-zinc-200">RO12BTRL01304205P88888XX</span></div>
        </div>
      </div>

      {/* Tabel Istoric Facturi Fiscale & Proforme */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Istoric Facturi Emise ({billingDetails?.invoices?.length || 0})</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Termen de grație: 14 zile de la emitere
          </span>
        </div>

        {!billingDetails?.invoices || billingDetails.invoices.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Nu a fost emisă nicio factură pentru acest showroom. Apăsați pe „Emite Factură Manuală Acum” pentru generare.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Serie & Număr</th>
                  <th className="p-3.5">Dată Emitere</th>
                  <th className="p-3.5">Scadență (14z)</th>
                  <th className="p-3.5">Bază Net</th>
                  <th className="p-3.5">TVA (21%)</th>
                  <th className="p-3.5 font-bold text-white">Total Brut</th>
                  <th className="p-3.5">Stare</th>
                  <th className="p-3.5 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {billingDetails.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">
                      {inv.id}
                      <div className="text-[10px] text-zinc-500 font-normal">{inv.tierName}</div>
                    </td>
                    <td className="p-3.5 text-zinc-300 font-mono">
                      {new Date(inv.issueDate).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="p-3.5 text-zinc-300 font-mono">
                      {new Date(inv.dueDate).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-300">
                      {inv.amountNetEur.toFixed(2)} €
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">
                      {inv.vatEur.toFixed(2)} €
                    </td>
                    <td className="p-3.5 font-mono font-black text-amber-300">
                      {inv.totalGrossEur.toFixed(2)} €
                    </td>
                    <td className="p-3.5">
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Achitată
                        </span>
                      ) : inv.status === 'overdue' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          Depășită
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          În Așteptare
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => onPayInvoice(inv.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                          title="Confirmă încasarea sumei în contul de garanție BT"
                        >
                          Confirmă Plată BT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
