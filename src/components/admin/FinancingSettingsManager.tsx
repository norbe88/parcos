import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Percent, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Shield, 
  Building2, 
  AlertCircle,
  Clock,
  Radio,
  History,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { 
  getBtExchangeRate, 
  getBnrExchangeRate,
  DEFAULT_BT_EXCHANGE_RATE, 
  DEFAULT_BNR_EUR_RON,
  DEFAULT_COMMERCIAL_MARGIN_PCT,
  getCreditorConfigs, 
  saveCreditorConfigs, 
  getExchangeRateMetadata,
  setManualExchangeRate,
  resetToAutoSync,
  ExchangeRateMetadata,
  CreditorPartnerId, 
  CreditorConfig 
} from '../../utils/currencyEngine';
import { syncExchangeRates } from '../../utils/exchangeRateSync';

interface FinancingSettingsManagerProps {
  showToast: (msg: string) => void;
}

export const FinancingSettingsManager: React.FC<FinancingSettingsManagerProps> = ({ showToast }) => {
  const [exchangeRate, setRate] = useState<number>(() => getBtExchangeRate());
  const [bnrRate, setBnrRate] = useState<number>(() => getBnrExchangeRate());
  const [metadata, setMetadata] = useState<ExchangeRateMetadata>(() => getExchangeRateMetadata());
  const [creditors, setCreditors] = useState<Record<CreditorPartnerId, CreditorConfig>>(() => getCreditorConfigs());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      const freshMeta = getExchangeRateMetadata();
      setMetadata(freshMeta);
      setRate(freshMeta.btRate);
      setBnrRate(freshMeta.bnrRate);
      setCreditors(getCreditorConfigs());
    };

    handleUpdate();
    window.addEventListener('rxm_currency_updated', handleUpdate);
    return () => window.removeEventListener('rxm_currency_updated', handleUpdate);
  }, []);

  const handleCalculateBtFormula = () => {
    const calculated = +(bnrRate * (1 + DEFAULT_COMMERCIAL_MARGIN_PCT / 100)).toFixed(4);
    setRate(calculated);
    showToast(`Curs calculat conform formulei BT (BNR + 2%): ${calculated.toFixed(4)} LEI / EUR`);
  };

  const handleInterestRateChange = (creditorId: CreditorPartnerId, newRate: number) => {
    setCreditors(prev => ({
      ...prev,
      [creditorId]: {
        ...prev[creditorId],
        interestRate: newRate
      }
    }));
  };

  // Salvare manuală (Override Administrator)
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setManualExchangeRate(exchangeRate, bnrRate);
    saveCreditorConfigs(creditors);
    const freshMeta = getExchangeRateMetadata();
    setMetadata(freshMeta);
    showToast(`✅ Curs salvat manual: BNR ${bnrRate.toFixed(4)} / BT ${exchangeRate.toFixed(4)} LEI. Modul Manual activat.`);
  };

  // Declanșare Sincronizare Imediată (BNR & BT)
  const handleForceSyncNow = async () => {
    setIsSyncing(true);
    showToast('🔄 Se interoghează cursul oficial BNR & BT (cu fallback Nod Samy)...');
    try {
      const fresh = await syncExchangeRates(true);
      setMetadata(fresh);
      setBnrRate(fresh.bnrRate);
      setRate(fresh.btRate);
      showToast(`✅ Sincronizat cu succes! BNR: ${fresh.bnrRate.toFixed(4)} | BT: ${fresh.btRate.toFixed(4)} (${fresh.sourceLabel})`);
    } catch (err) {
      console.error('Sync error:', err);
      showToast('⚠️ Sincronizarea live a eșuat. S-au păstrat valorile de rezervă.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Revenire la modul de sincronizare automată
  const handleRestoreAutoSync = () => {
    resetToAutoSync();
    handleForceSyncNow();
  };

  const handleResetDefaults = () => {
    setRate(DEFAULT_BT_EXCHANGE_RATE);
    setBnrRate(DEFAULT_BNR_EUR_RON);
    const defaults = getCreditorConfigs();
    setCreditors(defaults);
    saveCreditorConfigs(defaults);
    resetToAutoSync();
    showToast('Setările au fost resetate la valorile contractuale implicite.');
  };

  const lowestRate = Math.min(...Object.values(creditors).map(c => c.interestRate));

  return (
    <div className="space-y-6">
      {/* Antet Secțiune */}
      <div className="bg-[#121215] border border-white/[0.08] p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Configurare Curs Valutar BNR & BT • Dobânzi Creditori
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sincronizare automată zilnică la 14:00 (BNR) și 14:01 (BT informativ), fallback prin Nodul Samy, cu posibilitate de editare manuală și logare completă.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleForceSyncNow}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            title="Extrage acum ultimul curs BNR și recalculează cursul BT"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Se sincronizează...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizează Acum</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all self-start md:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resetează</span>
          </button>
        </div>
      </div>

      {/* 📡 Card Monitorizare Status Sincronizare Automată & Logare */}
      <div className="bg-gradient-to-r from-[#18181b] via-[#121215] to-[#18181b] border border-white/[0.08] p-4 sm:p-5 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-3 h-3 rounded-full mt-1 sm:mt-0 shrink-0 ${metadata.isManualOverride ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {metadata.isManualOverride ? 'MOD MANUAL ACTIV (OVERRIDE ADMINISTRATOR)' : 'SINCRONIZARE AUTOMATĂ ACTIVĂ'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  metadata.isManualOverride 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {metadata.isManualOverride ? 'Editat Manual' : 'Orar: 14:00 BNR • 14:01 BT'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <strong>Ultimul Update:</strong> {metadata.lastUpdatedFormatted || 'Necunoscut'}
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <strong>Sursă:</strong> {metadata.sourceLabel}
                </span>
                {metadata.syncedBy && (
                  <span className="text-zinc-500">
                    (Rută: {metadata.syncedBy})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            {metadata.isManualOverride && (
              <button
                type="button"
                onClick={handleRestoreAutoSync}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
              >
                Reia Auto-Sync la 14:00
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowHistory(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{showHistory ? 'Ascunde Jurnal' : 'Jurnal Curs'}</span>
            </button>
          </div>
        </div>

        {/* Jurnal Istoric Colapsabil */}
        {showHistory && (
          <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Jurnal Ultimele Actualizări Curs Valutar:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(metadata.history && metadata.history.length > 0) ? (
                metadata.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400">{h.formattedDate}</span>
                      <span className="text-white font-bold">{h.source}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-zinc-400">BNR: <strong className="text-white">{h.bnrRate.toFixed(4)}</strong></span>
                      <span className="text-amber-300">BT: <strong className="text-amber-400">{h.btRate.toFixed(4)}</strong></span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${h.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : h.status === 'manual' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic p-2">Niciun istoric înregistrat încă.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Motor Curs Valutar */}
        <div className="bg-[#121215] border border-white/[0.08] p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Curs Valutar Comercial (Banca Transilvania • BT)</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              1 EUR = {exchangeRate.toFixed(4)} LEI (BT)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 font-medium">Curs BNR Referință (LEI)</label>
                <span className="text-[10px] text-emerald-400 font-mono">Auto 14:00</span>
              </div>
              <input
                type="number"
                step="0.0001"
                min="4.0"
                max="6.0"
                value={bnrRate}
                onChange={e => setBnrRate(parseFloat(e.target.value) || DEFAULT_BNR_EUR_RON)}
                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:border-amber-400 outline-none"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Extragere oficială BNR în fiecare zi la ora 14:00 (RO time).
              </span>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Marjă Comercială Auto</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="+ 2.00 %"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-zinc-400 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Clauză contractuală standard pentru calculul cursului BT
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 font-medium">Curs BT Informativ / Facturare (LEI)</label>
                <span className="text-[10px] text-amber-400 font-mono">Auto 14:01</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="4.5"
                  max="6.0"
                  value={exchangeRate}
                  onChange={e => setRate(parseFloat(e.target.value) || DEFAULT_BT_EXCHANGE_RATE)}
                  className="w-full bg-[#18181b] border border-amber-500/40 rounded-xl px-3 py-2.5 text-amber-300 font-mono font-bold text-sm focus:border-amber-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCalculateBtFormula}
                  title="Calculează BNR + 2%"
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold whitespace-nowrap transition-all"
                >
                  BNR + 2%
                </button>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Actualizat automat la 14:01. Poate fi editat oricând manual.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Prețurile afișate pe site în RON sunt calculate exclusiv la cursul activ, fără tildă (ex: <strong>1.759 RON / lună</strong>).
              </span>
            </div>
            {metadata.isManualOverride && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                Mod Manual Activ
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Creditori Parteneri & Dobânzi */}
        <div className="bg-[#121215] border border-white/[0.08] p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>Grile Dobândă Parteneri Finanțatori</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Badge Public: „Dobândă de la {lowestRate.toFixed(1)}%”
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(creditors) as CreditorPartnerId[]).map(id => {
              const cred = creditors[id];
              return (
                <div 
                  key={id}
                  className={`p-4 rounded-xl border transition-all ${
                    cred.isPrimary 
                      ? 'bg-amber-500/5 border-amber-500/30' 
                      : 'bg-[#18181b] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{cred.name}</span>
                    {cred.isPrimary && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">
                        PRINCIPAL
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mb-3">{cred.sublabel}</div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-medium">Dobândă Anuală (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="4.0"
                        max="25.0"
                        value={cred.interestRate}
                        onChange={e => handleInterestRateChange(id, parseFloat(e.target.value) || cred.interestRate)}
                        className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11.5px]">
              <strong>Ordine afișare stabilită conform acordului:</strong> 1. TBI Bank (principal, 100% online), 2. BT Direct (secundar), 3. UniCredit Consumer Financing, 4. CreditFix. Ratele modificate aici se aplică instantaneu în calculatorul interactiv de pe prima pagină și în fișele de vehicul.
            </div>
          </div>
        </div>

        {/* Buton Salvare */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[46px] px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all touch-manipulation"
          >
            <Save className="w-4 h-4" />
            <span>Salvează Modificările de Curs & Dobânzi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
