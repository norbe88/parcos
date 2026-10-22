import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Car, 
  HelpCircle, 
  Info, 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  Scale, 
  Zap, 
  Flame, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface CalculatorImpozitAutoProps {
  onBack?: () => void;
  onSelectArticle?: (slug: string) => void;
}

export const CalculatorImpozitAuto: React.FC<CalculatorImpozitAutoProps> = ({
  onBack,
  onSelectArticle
}) => {
  const [vehicul, setVehicul] = useState<'autoturism' | 'moto' | 'autobuz' | 'utilitar' | 'tractor' | 'remorca'>('autoturism');
  const [cmc, setCmc] = useState<number | ''>(1598);
  const [propulsie, setPropulsie] = useState<'conventional' | 'hibrid' | 'hibrid_50' | 'electric'>('conventional');
  const [euro, setEuro] = useState<'e6' | 'e5' | 'e4' | 'e0_3'>('e6');
  const [remorca, setRemorca] = useState<'t1' | 't3' | 't5' | 't5plus'>('t1');
  const [majorare, setMajorare] = useState<number>(0);

  // Determină ce câmpuri sunt vizibile
  const showCc = vehicul !== 'remorca' && !(propulsie === 'electric' && vehicul !== 'tractor');
  const showPropulsion = vehicul !== 'remorca' && vehicul !== 'tractor';
  const showEuro = showCc && vehicul !== 'tractor' && propulsie !== 'hibrid' && propulsie !== 'hibrid_50';
  const showTrailer = vehicul === 'remorca';

  // Calcul impozit
  const calculation = useMemo(() => {
    // 1. Vehicul Electric
    if (propulsie === 'electric' && vehicul !== 'tractor') {
      const baza = 40; // 40 lei / an fix
      const total = Math.round(baza * (1 + majorare / 100));
      return {
        formula: '40 lei sumă fixă anuală (art. 470 alin. 3^1 Cod fiscal)',
        fractiuni: 0,
        tarifPerFractiune: 0,
        baza,
        total,
        semestru: Math.round(total / 2),
        cuBonificatie: Math.round(total * 0.90)
      };
    }

    // 2. Remorcă
    if (vehicul === 'remorca') {
      let baza = 18;
      let label = 'până la 1 tonă inclusiv';
      if (remorca === 't3') { baza = 64; label = 'peste 1 tonă, până la 3 tone'; }
      if (remorca === 't5') { baza = 102; label = 'peste 3 tone, până la 5 tone'; }
      if (remorca === 't5plus') { baza = 134; label = 'peste 5 tone'; }

      const total = Math.round(baza * (1 + majorare / 100));
      return {
        formula: `Masa autorizată (${label}) = ${baza} lei tarif bază`,
        fractiuni: 1,
        tarifPerFractiune: baza,
        baza,
        total,
        semestru: Math.round(total / 2),
        cuBonificatie: Math.round(total * 0.90)
      };
    }

    // 3. Tractor
    if (vehicul === 'tractor') {
      const ccVal = typeof cmc === 'number' && cmc > 0 ? cmc : 2000;
      const fractiuni = Math.ceil(ccVal / 200);
      const tarif = 18;
      const baza = fractiuni * tarif;
      const total = Math.round(baza * (1 + majorare / 100));
      return {
        formula: `${fractiuni} fracțiuni × 18 lei (art. 470 alin. 2^2)`,
        fractiuni,
        tarifPerFractiune: tarif,
        baza,
        total,
        semestru: Math.round(total / 2),
        cuBonificatie: Math.round(total * 0.90)
      };
    }

    // 4. Autoturism, Moto, Autobuz, Utilitară
    const ccVal = typeof cmc === 'number' && cmc > 0 ? cmc : 1598;
    const fractiuni = Math.ceil(ccVal / 200);

    let tarif = 16.5; // default Euro 6 autoturism <= 1600
    const isHibrid = propulsie === 'hibrid' || propulsie === 'hibrid_50';

    if (vehicul === 'autoturism') {
      if (ccVal <= 1600) {
        if (isHibrid) tarif = 16.2;
        else if (euro === 'e6') tarif = 16.5;
        else if (euro === 'e5') tarif = 17.6;
        else if (euro === 'e4') tarif = 18.8;
        else tarif = 19.5;
      } else if (ccVal <= 2000) {
        if (isHibrid) tarif = 24.6;
        else if (euro === 'e6') tarif = 25.1;
        else if (euro === 'e5') tarif = 26.7;
        else if (euro === 'e4') tarif = 28.5;
        else tarif = 29.7;
      } else if (ccVal <= 2600) {
        if (isHibrid) tarif = 76.3;
        else if (euro === 'e6') tarif = 77.8;
        else if (euro === 'e5') tarif = 82.8;
        else if (euro === 'e4') tarif = 88.6;
        else tarif = 92.2;
      } else if (ccVal <= 3000) {
        if (isHibrid) tarif = 149.8;
        else if (euro === 'e6') tarif = 151.2;
        else if (euro === 'e5') tarif = 154.1;
        else if (euro === 'e4') tarif = 172.8;
        else tarif = 182.9;
      } else {
        // peste 3000 cmc
        if (isHibrid) tarif = 275.5;
        else if (euro === 'e6') tarif = 290;
        else if (euro === 'e5') tarif = 294.4;
        else if (euro === 'e4') tarif = 297.3;
        else tarif = 319;
      }
    } else if (vehicul === 'moto') {
      if (ccVal <= 1600) {
        if (isHibrid) tarif = 16.2;
        else if (euro === 'e6') tarif = 16.5;
        else if (euro === 'e5') tarif = 17.6;
        else if (euro === 'e4') tarif = 18.8;
        else tarif = 19.5;
      } else {
        if (isHibrid) tarif = 18.4;
        else if (euro === 'e6') tarif = 18.7;
        else if (euro === 'e5') tarif = 19.9;
        else if (euro === 'e4') tarif = 21.3;
        else tarif = 22.1;
      }
    } else if (vehicul === 'autobuz') {
      if (isHibrid) tarif = 25.9;
      else if (euro === 'e6') tarif = 26.4;
      else if (euro === 'e5') tarif = 28.1;
      else if (euro === 'e4') tarif = 30;
      else tarif = 31.2;
    } else if (vehicul === 'utilitar') {
      if (isHibrid) tarif = 32.4;
      else if (euro === 'e6') tarif = 33;
      else if (euro === 'e5') tarif = 35.1;
      else if (euro === 'e4') tarif = 37.5;
      else tarif = 39;
    }

    let baza = fractiuni * tarif;
    // Hibrid cu emisii <= 50 g CO2 poate primi reducere de până la 30%
    if (propulsie === 'hibrid_50') {
      baza = baza * 0.70; // 30% reducere estimativă
    }

    const total = Math.round(baza * (1 + majorare / 100));
    return {
      formula: `${fractiuni} fracțiuni de 200 cmc × ${tarif} lei${propulsie === 'hibrid_50' ? ' (-30% reducere hibrid <50g)' : ''}`,
      fractiuni,
      tarifPerFractiune: tarif,
      baza: Math.round(baza),
      total,
      semestru: Math.round(total / 2),
      cuBonificatie: Math.round(total * 0.90)
    };
  }, [vehicul, cmc, propulsie, euro, remorca, majorare]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Top Header Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi la Ghid Auto</span>
          </button>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Codul Fiscal 2026 (Art. 470)</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Title & Introduction */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Actualizat Conform Legii 239/2025 & OUG 78/2025</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 font-display">
            Calculator Impozit Auto 2026
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-3xl leading-relaxed">
            Află exact cât plătești la primărie în funcție de capacitatea cilindrică, norma Euro și tipul de propulsie. 
            Impozitul se calculează pe fracțiuni de 200 cmc conform noilor grile intrate în vigoare la 1 ianuarie 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formular Parametrii */}
          <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/40 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Date Vehicul pentru Calcul</span>
            </h2>

            <div className="space-y-5">
              {/* Tip Vehicul */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Tip Vehicul
                </label>
                <select
                  value={vehicul}
                  onChange={(e) => setVehicul(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                >
                  <option value="autoturism">Autoturism</option>
                  <option value="moto">Motocicletă, triciclu, cvadriciclu</option>
                  <option value="autobuz">Autobuz, autocar, microbuz</option>
                  <option value="utilitar">Alt vehicul (autoutilitară) până la 12 tone</option>
                  <option value="tractor">Tractor înmatriculat</option>
                  <option value="remorca">Remorcă, semiremorcă, rulotă</option>
                </select>
              </div>

              {/* Capacitate Cilindrică */}
              {showCc && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Capacitate Cilindrică (cmc)
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">Rubrica P.1 din Talon</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={20000}
                      step={1}
                      value={cmc}
                      onChange={(e) => setCmc(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))}
                      placeholder="ex. 1598 sau 1995"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                    <div className="absolute right-3.5 top-2.5 text-xs text-zinc-500 font-medium pointer-events-none">
                      cm³
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[999, 1498, 1598, 1995, 2993].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCmc(preset)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                          cmc === preset 
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {preset} cmc
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Propulsie */}
              {showPropulsion && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Propulsie & Emisii
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">Rubrica P.3 / V.7</span>
                  </div>
                  <select
                    value={propulsie}
                    onChange={(e) => setPropulsie(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  >
                    <option value="conventional">Benzină / Diesel / GPL</option>
                    <option value="hibrid">Hibrid (emisii peste 50 g CO₂/km)</option>
                    <option value="hibrid_50">Hibrid plug-in (emisii max. 50 g CO₂/km)</option>
                    <option value="electric">Electric 100%</option>
                  </select>
                </div>
              )}

              {/* Normă de Poluare Euro */}
              {showEuro && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Normă de Poluare
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">Rubrica V.9 din CIV</span>
                  </div>
                  <select
                    value={euro}
                    onChange={(e) => setEuro(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  >
                    <option value="e6">Euro 6 (toate variantele)</option>
                    <option value="e5">Euro 5</option>
                    <option value="e4">Euro 4</option>
                    <option value="e0_3">Non-euro, Euro 0, 1, 2, 3</option>
                  </select>
                </div>
              )}

              {/* Masă Remorcă */}
              {showTrailer && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Masa totală maximă autorizată (Remorcă)
                  </label>
                  <select
                    value={remorca}
                    onChange={(e) => setRemorca(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  >
                    <option value="t1">Până la 1 tonă inclusiv (18 lei)</option>
                    <option value="t3">Peste 1 tonă, până la 3 tone (64 lei)</option>
                    <option value="t5">Peste 3 tone, până la 5 tone (102 lei)</option>
                    <option value="t5plus">Peste 5 tone (134 lei)</option>
                  </select>
                </div>
              )}

              {/* Cota adițională primărie */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Cotă Adițională Consiliu Local
                  </label>
                  <span className="text-xs font-bold text-amber-400 font-mono">+{majorare}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={majorare}
                  onChange={(e) => setMajorare(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Majoritatea primăriilor aplică între 0% și 15-20% indexare anuală. Implicit 0% (tariful brut din Codul fiscal).
                </p>
              </div>
            </div>
          </div>

          {/* Rezultat Calcul */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Impozit Anual Datorat 2026
              </span>
              
              <div className="flex items-baseline gap-2 mt-2 mb-4">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  {calculation.total.toLocaleString('ro-RO')}
                </span>
                <span className="text-xl font-bold text-amber-400">RON</span>
                <span className="text-xs text-zinc-500">/ an</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 mb-5 leading-relaxed font-mono">
                {calculation.formula}
                {majorare > 0 && ` + ${majorare}% cotă locală`}
              </div>

              {/* Tranșe de plată */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Tranșa 1 (până la 31 martie):
                  </span>
                  <span className="font-bold text-white font-mono">{calculation.semestru} RON</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Tranșa 2 (până la 30 septembrie):
                  </span>
                  <span className="font-bold text-white font-mono">{calculation.total - calculation.semestru} RON</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs mt-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Plată integrală până la 31 martie (-10%):</span>
                  </div>
                  <span className="font-bold text-emerald-400 text-sm font-mono">
                    {calculation.cuBonificatie} RON
                  </span>
                </div>
              </div>
            </div>

            {/* Ghiduri asociate impozitului */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                Ghiduri Utile Despre Impozit & Fiscalizare
              </h3>
              <div className="space-y-2">
                {[
                  { slug: 'declarare-impozit-auto-la-primarie', title: 'Declarare impozit auto la primărie' },
                  { slug: 'introducere-fiscal-masina-auto', title: 'Introducere fiscal mașină nou cumpărată' },
                  { slug: 'scoatere-fiscal-masina-auto', title: 'Scoatere fiscal după vânzare sau casare' },
                  { slug: 'scutire-impozit-pentru-masina-electrica', title: 'Regim fiscal mașini electrice 2026' }
                ].map(item => (
                  <button
                    key={item.slug}
                    onClick={() => onSelectArticle?.(item.slug)}
                    className="w-full text-left p-2.5 rounded-lg bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between group transition-all"
                  >
                    <span className="text-xs text-zinc-300 group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Oficial Tarife Fiscale 2026 */}
        <div className="mt-12 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-2 font-display">
            Grila Oficială a Tarifelor (Codul fiscal Art. 470, aplicabil 2026)
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Tarife per fracțiune de 200 cmc (exprimate în lei), după capacitate și norma Euro:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-950 text-zinc-400">
                  <th className="py-3 px-3">Categorie Vehicul</th>
                  <th className="py-3 px-3 text-right">Non-euro, E0–3</th>
                  <th className="py-3 px-3 text-right">Euro 4</th>
                  <th className="py-3 px-3 text-right">Euro 5</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Euro 6</th>
                  <th className="py-3 px-3 text-right text-cyan-400">Hibrid &gt;50g</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                <tr className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">Autoturisme & moto ≤ 1.600 cmc</td>
                  <td className="py-2.5 px-3 text-right">19,5 lei</td>
                  <td className="py-2.5 px-3 text-right">18,8 lei</td>
                  <td className="py-2.5 px-3 text-right">17,6 lei</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">16,5 lei</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">16,2 lei</td>
                </tr>
                <tr className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">Autoturisme 1.601 – 2.000 cmc</td>
                  <td className="py-2.5 px-3 text-right">29,7 lei</td>
                  <td className="py-2.5 px-3 text-right">28,5 lei</td>
                  <td className="py-2.5 px-3 text-right">26,7 lei</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">25,1 lei</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">24,6 lei</td>
                </tr>
                <tr className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">Autoturisme 2.001 – 2.600 cmc</td>
                  <td className="py-2.5 px-3 text-right">92,2 lei</td>
                  <td className="py-2.5 px-3 text-right">88,6 lei</td>
                  <td className="py-2.5 px-3 text-right">82,8 lei</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">77,8 lei</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">76,3 lei</td>
                </tr>
                <tr className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">Autoturisme 2.601 – 3.000 cmc</td>
                  <td className="py-2.5 px-3 text-right">182,9 lei</td>
                  <td className="py-2.5 px-3 text-right">172,8 lei</td>
                  <td className="py-2.5 px-3 text-right">154,1 lei</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">151,2 lei</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">149,8 lei</td>
                </tr>
                <tr className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">Autoturisme &gt; 3.000 cmc</td>
                  <td className="py-2.5 px-3 text-right">319,0 lei</td>
                  <td className="py-2.5 px-3 text-right">297,3 lei</td>
                  <td className="py-2.5 px-3 text-right">294,4 lei</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">290,0 lei</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">275,5 lei</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-400 flex flex-wrap gap-4 items-center justify-between">
            <span>Sursă oficială: Legea nr. 227/2015 privind Codul fiscal republicat cu modificările pentru 2026</span>
            <a
              href="https://www.ghiseul.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium"
            >
              <span>Verificare & plată online pe Ghișeul.ro</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
