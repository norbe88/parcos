import React from 'react';
import { FileText, Zap, Sparkles, RefreshCw, Save } from 'lucide-react';
import { DealerProfile } from '../../../db/seed';

interface SuperAdminFgoTabProps {
  currentTenant: DealerProfile;
  fgoApiKey: string;
  setFgoApiKey: (v: string) => void;
  isApiKeyVisible: boolean;
  setIsApiKeyVisible: (v: boolean) => void;
  fgoCui: string;
  setFgoCui: (v: string) => void;
  fgoEnvironment: 'live' | 'test';
  setFgoEnvironment: (v: 'live' | 'test') => void;
  fgoSeriesFiscal: string;
  setFgoSeriesFiscal: (v: string) => void;
  fgoSeriesProforma: string;
  setFgoSeriesProforma: (v: string) => void;
  fgoDefaultRegime: 'margin_scheme' | 'standard_vat';
  setFgoDefaultRegime: (v: 'margin_scheme' | 'standard_vat') => void;
  fgoAutoSendSpv: boolean;
  setFgoAutoSendSpv: (v: boolean) => void;
  fgoConnectionStatus: 'idle' | 'testing' | 'connected' | 'error';
  isTestingFgo: boolean;
  onTestConnection: () => void;
  onSaveConfig: (e: React.FormEvent) => void;
}

export const SuperAdminFgoTab: React.FC<SuperAdminFgoTabProps> = ({
  currentTenant,
  fgoApiKey,
  setFgoApiKey,
  isApiKeyVisible,
  setIsApiKeyVisible,
  fgoCui,
  setFgoCui,
  fgoEnvironment,
  setFgoEnvironment,
  fgoSeriesFiscal,
  setFgoSeriesFiscal,
  fgoSeriesProforma,
  setFgoSeriesProforma,
  fgoDefaultRegime,
  setFgoDefaultRegime,
  fgoAutoSendSpv,
  setFgoAutoSendSpv,
  fgoConnectionStatus,
  isTestingFgo,
  onTestConnection,
  onSaveConfig
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Conectare FGO.ro & e-Factura: {currentTenant.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Conectează contul de facturare FGO al parcului auto prin API REST v2 (Model Bring-Your-Own-Key).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5 ${
            fgoConnectionStatus === 'connected'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : fgoConnectionStatus === 'error'
              ? 'bg-red-500/15 text-red-300 border-red-500/30'
              : fgoConnectionStatus === 'testing'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
              : fgoApiKey
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-400 border-white/10'
          }`}>
            {fgoConnectionStatus === 'connected' && <span>● Conexiune Confirmată ({fgoEnvironment.toUpperCase()})</span>}
            {fgoConnectionStatus === 'error' && <span>✕ Eroare Conexiune</span>}
            {fgoConnectionStatus === 'testing' && <span>⟳ Se verifică API...</span>}
            {fgoConnectionStatus === 'idle' && (fgoApiKey ? <span>● API Configurat</span> : <span>○ Neconfigurat</span>)}
          </span>
        </div>
      </div>

      {/* Carduri Info & Model de Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Opțiunea 1-Click Automat (FGO GO Premium)
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Dacă parcul auto deține deja un abonament FGO (~40-57 lei/lună), introduceți cheia API generată din FGO (<i>Setări ➔ eCommerce ➔ Chei API</i>). Facturile și proformele se emit automat direct din ParcOS, cu trimitere în SPV ANAF.
          </p>
        </div>

        <div className="bg-[#121215] border border-blue-500/30 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Opțiunea 100% Gratuită (FGO Free / Fără API)
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Dacă dealerul este pe planul gratuit FGO, ParcOS permite generarea cu un clic a fișierului XML UBL / CSV compatibil, pe care dealerul îl importă gratuit în FGO fără a plăti niciun abonament!
          </p>
        </div>
      </div>

      {/* Formular Configurare API FGO */}
      <form onSubmit={onSaveConfig} className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Cheie API */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
              <span>Cheie API FGO (Bearer Token)</span>
              <button
                type="button"
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                className="text-amber-400 hover:underline text-[10px]"
              >
                {isApiKeyVisible ? 'Ascunde' : 'Arată Cheia'}
              </button>
            </label>
            <div className="relative">
              <input
                type={isApiKeyVisible ? 'text' : 'password'}
                value={fgoApiKey}
                onChange={(e) => setFgoApiKey(e.target.value)}
                placeholder="Lipiți cheia API din contul FGO al dealerului..."
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* CUI Firmă în FGO */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">CUI Firmă în FGO (Doar cifre, fără RO)</label>
            <input
              type="text"
              value={fgoCui}
              onChange={(e) => setFgoCui(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="48482214"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>

          {/* Mediu API */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Mediu FGO API</label>
            <select
              value={fgoEnvironment}
              onChange={(e) => setFgoEnvironment(e.target.value as 'live' | 'test')}
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="live">Producție Live (api.fgo.ro)</option>
              <option value="test">Mediu Test UAT Gratuit (api-testuat.fgo.ro)</option>
            </select>
          </div>

          {/* Seria Factură Fiscală */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Serie Factură Fiscală</label>
            <input
              type="text"
              value={fgoSeriesFiscal}
              onChange={(e) => setFgoSeriesFiscal(e.target.value.toUpperCase())}
              placeholder="RXM"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Seria Proformă */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Serie Factură Proformă (Garanții)</label>
            <input
              type="text"
              value={fgoSeriesProforma}
              onChange={(e) => setFgoSeriesProforma(e.target.value.toUpperCase())}
              placeholder="PROF"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Regim TVA Implicit */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Regim Fiscal Auto Implicit</label>
            <select
              value={fgoDefaultRegime}
              onChange={(e) => setFgoDefaultRegime(e.target.value as any)}
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="margin_scheme">Regimul Marjei (Art. 312 Cod Fiscal — Fără TVA evidențiat)</option>
              <option value="standard_vat">TVA Deductibil 21% (Strict VAT_RATE = 0.21)</option>
            </select>
          </div>

          {/* Trimitere automată SPV */}
          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="fgoAutoSendSpv"
              checked={fgoAutoSendSpv}
              onChange={(e) => setFgoAutoSendSpv(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-[#18181f] text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="fgoAutoSendSpv" className="text-xs text-zinc-300 cursor-pointer select-none">
              Trimite automat factura în <b>SPV RO e-Factura (ANAF)</b> la emitere
            </label>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onTestConnection}
            disabled={isTestingFgo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingFgo ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isTestingFgo ? 'Se verifică serverul FGO...' : 'Testează Conexiunea FGO API'}</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvează Integrarea FGO</span>
          </button>
        </div>

      </form>

    </div>
  );
};
