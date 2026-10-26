import React from 'react';
import { FileText } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';

interface ProformaConfigSidebarSectionProps {
  invoiceType: 'proforma' | 'fiscal';
  setInvoiceType: React.Dispatch<React.SetStateAction<'proforma' | 'fiscal'>>;
  billingType: 'full_car' | 'deposit';
  setBillingType: React.Dispatch<React.SetStateAction<'full_car' | 'deposit'>>;
  proformaDepositEur: number;
  setProformaDepositEur: React.Dispatch<React.SetStateAction<number>>;
  proformaRegime: 'margin_scheme' | 'standard';
  setProformaRegime: React.Dispatch<React.SetStateAction<'margin_scheme' | 'standard'>>;
  dealer: DealerProfile;
}

export const ProformaConfigSidebarSection: React.FC<ProformaConfigSidebarSectionProps> = ({
  invoiceType,
  setInvoiceType,
  billingType,
  setBillingType,
  proformaDepositEur,
  setProformaDepositEur,
  proformaRegime,
  setProformaRegime,
  dealer
}) => {
  return (
    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Configurare Facturare</span>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
          proformaRegime === 'margin_scheme'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }`}>
          {proformaRegime === 'margin_scheme' ? 'Art. 312 (Fără TVA afișat)' : 'TVA 21% Deductibil'}
        </span>
      </div>

      {/* 1. Tip Document: Proformă vs Fiscală */}
      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
          Tip Document Comercial:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setInvoiceType('proforma')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              invoiceType === 'proforma'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Factură Proformă
          </button>
          <button
            type="button"
            onClick={() => setInvoiceType('fiscal')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              invoiceType === 'fiscal'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Factură Fiscală
          </button>
        </div>
      </div>

      {/* 2. Obiect Facturare: Preț Integral vs Avans */}
      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
          Valoare Facturată:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setBillingType('full_car')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              billingType === 'full_car'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Preț Integral Autovehicul
          </button>
          <button
            type="button"
            onClick={() => setBillingType('deposit')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              billingType === 'deposit'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
          >
            Avans Rezervare
          </button>
        </div>

        {billingType === 'deposit' && (
          <div className="mt-2 p-2 rounded-lg bg-black/40 border border-emerald-500/20 flex items-center justify-between gap-2">
            <span className="text-[10.5px] text-zinc-300 font-medium">Sumă Avans (EUR):</span>
            <div className="flex items-center gap-1.5">
              {[300, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setProformaDepositEur(amt)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    proformaDepositEur === amt
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {amt} €
                </button>
              ))}
              <input
                type="number"
                value={proformaDepositEur}
                onChange={(e) => setProformaDepositEur(parseFloat(e.target.value) || 0)}
                className="w-16 bg-[#18181b] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono font-bold text-right focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Regim Fiscal: Marjă (Art. 312) vs Standard (TVA 21%) */}
      <div>
        <label className="text-[10.5px] text-zinc-400 font-medium block mb-1">
          Regim Fiscal TVA (Art. 312 Cod Fiscal):
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setProformaRegime('margin_scheme')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              proformaRegime === 'margin_scheme'
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
            title="Standard dealeri auto second-hand: TVA nedeductibil inclus în preț, mențiune legală Art. 312"
          >
            Regimul Marjei (Std)
          </button>
          <button
            type="button"
            onClick={() => setProformaRegime('standard')}
            className={`py-1.5 px-2 rounded-lg text-[10.5px] font-semibold border transition-all text-center cursor-pointer ${
              proformaRegime === 'standard'
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm'
                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
            }`}
            title="Regim normal: Evidențiere distinctă bază + cota 21% TVA + total"
          >
            TVA 21% Deductibil
          </button>
        </div>
      </div>

      <div className="text-[9.5px] text-zinc-400 leading-tight pt-0.5">
        Virament bancar direct în contul societății (<strong>{dealer.bankName}</strong> — IBAN: <span className="font-mono text-[10px] text-zinc-300 font-semibold">{dealer.ibanRon}</span>).
      </div>
    </div>
  );
};
