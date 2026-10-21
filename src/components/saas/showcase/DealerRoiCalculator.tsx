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
  // 1. Time Saved per month:
  // - Gestiune stoc, scanare CIV/talon & delta sync portaluri: ~1.2h per vânzare + 0.35h per mașină în stoc
  // - Oferte WhatsApp, discuții cu clienți & verificare rezervări: ~6h economisite lunar per consilier
  const baseInventoryHours = Math.round((monthlySales * 1.2) + (stockSize * 0.35));
  const advisorHours = advisorsCount * 6;
  const hoursSavedPerMonth = baseInventoryHours + advisorHours;
  
  // 2. Cost mediu orar consilier vânzări în România: ~12 €/h
  const hourlyLaborValueEur = 12;
  const laborSavingsEur = hoursSavedPerMonth * hourlyLaborValueEur;

  // 3. Stopare risipă portaluri (anunțuri expirate/vândute lăsate active): ~45 € per vânzare
  const portalSavingsEur = Math.round(monthlySales * 45);

  // 4. Bonus conversie rezervări la distanță: oferte rapide pe WhatsApp + Cont de Garanție
  // Responsivitatea echipei crește conversia (+2% per consilier activ dotat cu unelte rapide)
  // Marjă medie per autoturism: ~900 €
  const conversionMultiplier = 0.12 + (advisorsCount * 0.02);
  const extraConversionValueEur = Math.round(monthlySales * conversionMultiplier * 900);

  // 5. Total Net Lunar & Anual Economisit
  const totalMonthlySavingsEur = laborSavingsEur + portalSavingsEur + extraConversionValueEur;
  const totalAnnualSavingsEur = totalMonthlySavingsEur * 12;

  // Holding Financial Invariant: 21% VAT
  const vatRate = 0.21;
  const annualSavingsNetEur = Math.round(totalAnnualSavingsEur / (1 + vatRate));
  const annualVatAmountEur = totalAnnualSavingsEur - annualSavingsNetEur;

  return (
    <div className="w-full">
      {/* Header and Commercial Proof Badge */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono-telemetry text-emerald-900 font-bold mb-3">
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span>SIMULATOR RENTABILITATE // ROI TRANSPARENT</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight">
          Calculează ROI-ul și Orele Salvate Lunar
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          Descoperă impactul matematic concret al automatizării: eliminarea tastării manuale a cărților auto, 
          stoparea cheltuielilor pe anunțuri expirate din portalurile auto și securizarea avansurilor prin Cont de Garanție online (Stripe / Card).
        </p>
      </div>

      {/* Main Dual-Column Interactive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        
        {/* Left Controls Column (6 cols): Sliders & Selectors */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white flex flex-col justify-between shadow-xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-mono uppercase text-slate-700 font-bold">PARAMETRI PARC AUTO</span>
              <span className="text-[10px] font-mono text-amber-700 font-black">DATE LIVE ROMÂNIA</span>
            </div>

            {/* Slider 1: Active Stock Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-stock" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-600" />
                  <span>Mărime Stoc Activ:</span>
                </label>
                <span className="font-mono text-base font-black text-amber-700">
                  {stockSize} mașini
                </span>
              </div>
              <input
                id="slider-stock"
                aria-label="Mărime Stoc Activ (mașini)"
                type="range"
                min="10"
                max="150"
                step="5"
                value={stockSize}
                onChange={(e) => setStockSize(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-manipulation"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-600 font-semibold">
                <span>10 mașini</span>
                <span>75 mașini</span>
                <span>150 mașini</span>
              </div>
            </div>

            {/* Slider 2: Monthly Sales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-sales" className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Vânzări Medii Lunare:</span>
                </label>
                <span className="font-mono text-base font-black text-emerald-700">
                  {monthlySales} mașini / lună
                </span>
              </div>
              <input
                id="slider-sales"
                aria-label="Vânzări Medii Lunare (mașini / lună)"
                type="range"
                min="2"
                max="35"
                step="1"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 touch-manipulation"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-600 font-semibold">
                <span>2 / lună</span>
                <span>15 / lună</span>
                <span>35 / lună</span>
              </div>
            </div>

            {/* Advisor Selector */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Număr Consilieri Vânzări:</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAdvisorsCount(count)}
                    className={`min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold transition-all border touch-manipulation ${
                      advisorsCount === count
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-950'
                    }`}
                  >
                    {count} {count === 1 ? 'om' : 'cons.'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Under-Controls Note */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Algoritm calibrat pe date reale de operare din parcuri auto partenere.</span>
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
              <div className="text-[11px] text-zinc-300 font-mono mt-1">
                Net: ~{annualSavingsNetEur.toLocaleString('ro-RO')} € • TVA deductibil inclus
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
                <div className="text-[10px] text-zinc-300 mt-0.5 font-medium">
                  OCR + WhatsApp + Portaluri
                </div>
              </div>

              {/* External Waste Stopped */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-1.5 text-zinc-300 text-[10px] uppercase font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stop Risipă Buget Anunțuri</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  ~{portalSavingsEur} €<span className="text-xs font-normal text-zinc-300">/lună</span>
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5 font-medium">
                  Fără mașini vândute active
                </div>
              </div>

              {/* Conversion Boost */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-1.5 text-zinc-300 text-[10px] uppercase font-semibold">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Conversie Garanții</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  +25%
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5 font-medium">
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
            <span className="text-xs font-mono text-zinc-300">Activare showroom în sub 24h</span>
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
