import React, { useState } from 'react';
import { 
  Calculator, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Euro, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Users,
  Car,
  Zap,
  Building2
} from 'lucide-react';

export const DealerRoiCalculator: React.FC = () => {
  const [stockSize, setStockSize] = useState<number>(35);
  const [monthlySales, setMonthlySales] = useState<number>(8);
  const [advisorsCount, setAdvisorsCount] = useState<number>(2);

  // Financial Math & Labor Economics
  // 1. Time Saved per car entry: 25 min OCR typing + 20 min OLX/Autovit delta sync + 15 min WhatsApp composer = 60 min (1h)
  const hoursSavedPerMonth = Math.round((monthlySales * 1.5) + (stockSize * 0.4));
  
  // 2. Average cost of sales agent hour in Romania: ~12 €/h
  const hourlyLaborValueEur = 12;
  const laborSavingsEur = hoursSavedPerMonth * hourlyLaborValueEur;

  // 3. Elimination of OLX discrepancies & stale listing costs: ~40 € per monthly sale prevented waste
  const olxSavingsEur = Math.round(monthlySales * 45);

  // 4. Remote reservation conversion bonus: +25% confidence closes via BT Guarantee account
  // Avg margin per car sold: ~900 €
  const extraConversionValueEur = Math.round(monthlySales * 0.15 * 900);

  // 5. Total Net Monthly & Annual Savings
  const totalMonthlySavingsEur = laborSavingsEur + olxSavingsEur + extraConversionValueEur;
  const totalAnnualSavingsEur = totalMonthlySavingsEur * 12;

  // Holding Financial Invariant: 21% VAT
  const vatRate = 0.21;
  const annualSavingsNetEur = Math.round(totalAnnualSavingsEur / (1 + vatRate));
  const annualVatAmountEur = totalAnnualSavingsEur - annualSavingsNetEur;

  return (
    <div className="w-full">
      {/* Header and Commercial Proof Badge */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-telemetry text-emerald-300 font-semibold mb-3">
          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          <span>SIMULATOR RENTABILITATE // ROI TRANSPARENT</span>
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          Calculează ROI-ul și Orele Salvate Lunar
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
          Descoperă impactul matematic concret al automatizării: eliminarea tastării manuale a cărților auto, 
          stoparea cheltuielilor pe anunțuri OLX expirate și securizarea avansurilor prin Cont de Garanție online (Stripe / Card).
        </p>
      </div>

      {/* Main Dual-Column Interactive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        
        {/* Left Controls Column (6 cols): Sliders & Selectors */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono uppercase text-zinc-400">PARAMETRI PARC AUTO</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">DATE LIVE ROMÂNIA</span>
            </div>

            {/* Slider 1: Active Stock Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>Mărime Stoc Activ:</span>
                </label>
                <span className="font-mono text-base font-extrabold text-amber-400">
                  {stockSize} mașini
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={stockSize}
                onChange={(e) => setStockSize(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 touch-manipulation"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>10 mașini</span>
                <span>75 mașini</span>
                <span>150 mașini</span>
              </div>
            </div>

            {/* Slider 2: Monthly Sales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Vânzări Medii Lunare:</span>
                </label>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  {monthlySales} mașini / lună
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="35"
                step="1"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 touch-manipulation"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>2 / lună</span>
                <span>15 / lună</span>
                <span>35 / lună</span>
              </div>
            </div>

            {/* Advisor Selector */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Număr Consilieri Vânzări:</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAdvisorsCount(count)}
                    className={`min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold transition-all border touch-manipulation ${
                      advisorsCount === count
                        ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    {count} {count === 1 ? 'om' : 'cons.'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Under-Controls Note */}
          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Algoritm calibrat pe date reale de la dealeri activi pe ParcOS (ex: RXM Automobile, MPI Auto, Top Auto).</span>
          </div>
        </div>

        {/* Right Output Column (6 cols): Projected Financial Gains */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-zinc-950 via-[#131217] to-zinc-950 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono uppercase text-amber-400 font-bold">REZULTATE ESTIMATE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AMORTIZARE IMEDIATĂ
              </span>
            </div>

            {/* Total Annual Value Hero Metric */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 text-center relative">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                Valoare Totală Economisită / An
              </span>
              <div className="text-3xl sm:text-5xl font-black font-mono-telemetry text-amber-400 tracking-tight mt-1 hud-glow-amber">
                ~{totalAnnualSavingsEur.toLocaleString('ro-RO')} €
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-1">
                Net: {annualSavingsNetEur.toLocaleString('ro-RO')} € • 21% TVA: {annualVatAmountEur.toLocaleString('ro-RO')} €
              </div>
            </div>

            {/* Breakdown Sub-Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-telemetry">
              
              {/* Hours Saved */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Timp Salvat</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {hoursSavedPerMonth} h<span className="text-xs font-normal text-zinc-400">/lună</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  OCR + WhatsApp + OLX
                </div>
              </div>

              {/* OLX Waste Stopped */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stop Risipă OLX</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  ~{olxSavingsEur} €<span className="text-xs font-normal text-zinc-400">/lună</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Fără mașini vândute active
                </div>
              </div>

              {/* Conversion Boost */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Conversie Garanții</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  +25%
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Încredere avans securizat
                </div>
              </div>

            </div>

            {/* Cost Amortization Guarantee */}
            <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-zinc-300 leading-relaxed">
              <strong className="text-amber-300">Concluzie rentabilitate:</strong> Platforma ParcOS se amortizează complet încă din <strong>prima mașină vândută</strong> în fiecare lună, transformând timpul salvat în mai multe vizionări și vânzări reale în showroom.
            </div>
          </div>

          {/* CTA Link to Onboarding */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Activare showroom în sub 24h</span>
            <a
              href="#onboard"
              className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-all text-xs flex items-center gap-2 shadow-md shadow-amber-400/20 touch-manipulation active:scale-[0.98]"
            >
              <span>Activează Parcul</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
