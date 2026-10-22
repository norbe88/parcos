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
  ExternalLink,
  Copy,
  Check,
  Share2,
  Sparkles
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
  const [copied, setCopied] = useState(false);

  // Determină ce câmpuri sunt vizibile
  const showCc = vehicul !== 'remorca' && !(propulsie === 'electric' && vehicul !== 'tractor');
  const showPropulsion = vehicul !== 'remorca' && vehicul !== 'tractor';
  const showEuro = showCc && vehicul !== 'tractor' && propulsie !== 'hibrid' && propulsie !== 'hibrid_50';
  const showTrailer = vehicul === 'remorca';

  // Calcul impozit conform Codului fiscal (Legea 239/2025 și OUG 78/2025)
  const calculation = useMemo(() => {
    // 1. Vehicul Electric
    if (propulsie === 'electric' && vehicul !== 'tractor') {
      const baza = 40; // 40 lei / an tarif fix 2026
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

    if (vehicul === 'moto') {
      if (ccVal <= 1600) {
        if (isHibrid) tarif = 9;
        else if (euro === 'e6') tarif = 9.3;
        else if (euro === 'e5') tarif = 9.9;
        else if (euro === 'e4') tarif = 10.5;
        else tarif = 11;
      } else {
        if (isHibrid) tarif = 16.2;
        else if (euro === 'e6') tarif = 16.5;
        else if (euro === 'e5') tarif = 17.6;
        else if (euro === 'e4') tarif = 18.8;
        else tarif = 19.5;
      }
    } else if (vehicul === 'autoturism') {
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
        // > 3000 cmc
        if (isHibrid) tarif = 275.5;
        else if (euro === 'e6') tarif = 290;
        else if (euro === 'e5') tarif = 294.4;
        else if (euro === 'e4') tarif = 297.3;
        else tarif = 319;
      }
    } else if (vehicul === 'autobuz') {
      if (isHibrid) tarif = 25.8;
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

  const handleCopyCalculation = () => {
    const text = `Calcul Impozit Auto 2026 (ParcOS.ro):\nVehicul: ${vehicul}\nCilindree: ${cmc} cmc\nPropulsie: ${propulsie}\nNorma: ${euro}\nTotal Anual: ${calculation.total} RON\nTranșa 1 (31 Martie): ${calculation.semestru} RON\nPlată integrală (-10%): ${calculation.cuBonificatie} RON`;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500/20 selection:text-amber-800">
      
      {/* 🧭 Top Technical Header */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi la Ghidul Auto</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Art. 470 Codul fiscal 2026</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* 🌟 Intro & Title */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Actualizat Conform Legii 239/2025 & OUG 78/2025</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-display mb-3">
            Calculator Impozit Auto 2026
          </h1>
          
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Calculează instant taxa anuală datorată către primărie pe baza capacității cilindrice, normei de poluare Euro și tipului de motorizare. Sistemul aplică automat fracțiunile legale de 200 cmc valabile începând cu 1 ianuarie 2026.
          </p>
        </div>

        {/* 🎛️ Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formular Parametrii (Col 7) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <Calculator className="w-4 h-4 text-amber-500" />
              <span>Configurare Parametri Vehicul</span>
            </h2>

            <div className="space-y-6">
              
              {/* Tip Vehicul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Categorie Vehicul
                </label>
                <select
                  value={vehicul}
                  onChange={(e) => setVehicul(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="autoturism">Autoturism (M1)</option>
                  <option value="moto">Motocicletă, triciclu, cvadriciclu (L)</option>
                  <option value="autobuz">Autobuz, autocar, microbuz (M2 / M3)</option>
                  <option value="utilitar">Autoutilitară până la 12 tone (N1 / N2)</option>
                  <option value="tractor">Tractor înmatriculat</option>
                  <option value="remorca">Remorcă, semiremorcă sau rulotă</option>
                </select>
              </div>

              {/* Capacitate Cilindrică */}
              {showCc && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Capacitate Cilindrică (cmc)
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">Rubrica P.1 din Talon</span>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <div className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
                      cm³
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] text-slate-400 py-1 font-medium">Selecție rapidă:</span>
                    {[999, 1498, 1598, 1995, 2993].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCmc(preset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                          cmc === preset 
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        {preset} cmc
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Propulsie & Emisii */}
              {showPropulsion && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Propulsie & Tip Motorizare
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">Rubrica P.3 din Talon</span>
                  </div>
                  <select
                    value={propulsie}
                    onChange={(e) => setPropulsie(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="conventional">Benzină / Diesel / GPL clasic</option>
                    <option value="hibrid">Hibrid standard / Mild Hybrid (&gt; 50g CO2/km)</option>
                    <option value="hibrid_50">Plug-in Hybrid ecologic (≤ 50g CO2/km) — până la -30%</option>
                    <option value="electric">100% Electric (EV) — tarif fix 40 lei/an din 2026</option>
                  </select>
                </div>
              )}

              {/* Norma de Poluare Euro */}
              {showEuro && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Normă de Poluare Euro
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">Rubrica V.9 din CIV</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'e6', label: 'Euro 6', note: 'Cel mai favorabil' },
                      { key: 'e5', label: 'Euro 5', note: '2011–2015' },
                      { key: 'e4', label: 'Euro 4', note: '2005–2010' },
                      { key: 'e0_3', label: 'Non-Euro / E0-E3', note: 'Vehicule vechi' },
                    ].map(eItem => (
                      <button
                        key={eItem.key}
                        type="button"
                        onClick={() => setEuro(eItem.key as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          euro === eItem.key
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-400/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{eItem.label}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{eItem.note}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tonaj Remorcă */}
              {showTrailer && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Masa Totală Maximă Autorizată (MTMA)
                  </label>
                  <select
                    value={remorca}
                    onChange={(e) => setRemorca(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="t1">Până la 1 tonă inclusiv (18 lei)</option>
                    <option value="t3">Peste 1 tonă până la 3 tone inclusiv (64 lei)</option>
                    <option value="t5">Peste 3 tone până la 5 tone inclusiv (102 lei)</option>
                    <option value="t5plus">Peste 5 tone (134 lei)</option>
                  </select>
                </div>
              )}

              {/* Cotă Adițională Locală */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cotă Adițională Consiliu Local
                  </label>
                  <span className="text-xs font-extrabold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    +{majorare}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={majorare}
                  onChange={(e) => setMajorare(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Majoritatea primăriilor din municipii aplică între 0% și 15-20% indexare anuală. Implicit 0% (tariful de bază din Codul fiscal).
                </p>
              </div>

            </div>
          </div>

          {/* Rezultat Calcul & Bonificație (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Chitanță Digitală de Calcul */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white border border-amber-300/90 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                  Impozit Anual Datorat 2026
                </span>
                <button
                  onClick={handleCopyCalculation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200 px-2 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copied ? 'Copiat!' : 'Copiază'}</span>
                </button>
              </div>
              
              <div className="flex items-baseline gap-2 mt-2 mb-4">
                <span className="text-4xl sm:text-5xl font-black text-slate-950 font-mono tracking-tight">
                  {calculation.total.toLocaleString('ro-RO')}
                </span>
                <span className="text-xl font-bold text-amber-600 font-sans">RON</span>
                <span className="text-xs text-slate-500 font-medium">/ an calendaristic</span>
              </div>

              {/* Formulă explicativă */}
              <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200/80 text-xs text-slate-700 mb-5 leading-relaxed font-mono shadow-2xs">
                {calculation.formula}
                {majorare > 0 && ` + ${majorare}% indexare locală`}
              </div>

              {/* Tranșe de Plată */}
              <div className="space-y-3 pt-3 border-t border-amber-200/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tranșa 1 (până la 31 martie):
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{calculation.semestru} RON</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tranșa 2 (până la 30 septembrie):
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{calculation.total - calculation.semestru} RON</span>
                </div>

                {/* Bonificație 10% */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs mt-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Plată integrală până la 31 martie (-10%):</span>
                  </div>
                  <span className="font-black text-emerald-700 text-sm font-mono">
                    {calculation.cuBonificatie} RON
                  </span>
                </div>
              </div>

            </div>

            {/* Ghiduri Asociate Impozitului */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Ghiduri Practice pentru Fiscalizare
              </h3>
              <div className="space-y-2">
                {[
                  { slug: 'declarare-impozit-auto-la-primarie', title: 'Cum declari mașina la primărie în 30 de zile' },
                  { slug: 'introducere-fiscal-masina-auto', title: 'Înscrierea fiscală a mașinii nou cumpărate' },
                  { slug: 'scoatere-fiscal-masina-auto', title: 'Scoaterea din evidență (radiere fiscală după vânzare)' },
                  { slug: 'scutire-impozit-pentru-masina-electrica', title: 'Noul regim fiscal pentru vehicule electrice 2026' }
                ].map(item => (
                  <button
                    key={item.slug}
                    onClick={() => onSelectArticle?.(item.slug)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/70 hover:border-amber-300 flex items-center justify-between group transition-all"
                  >
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-900 transition-colors">
                      {item.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* 📑 Grilă Oficială a Tarifelor Fiscale 2026 */}
        <div className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2 font-display">
            Grila Oficială a Tarifelor (Codul fiscal Art. 470, aplicabil 2026)
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Tarife per fracțiune de 200 cmc (exprimate în lei), după capacitate și norma de poluare Euro:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-3 px-4 font-semibold font-sans">Categorie Vehicul</th>
                  <th className="py-3 px-3 text-right">Non-Euro, E0–3</th>
                  <th className="py-3 px-3 text-right">Euro 4</th>
                  <th className="py-3 px-3 text-right">Euro 5</th>
                  <th className="py-3 px-3 text-right text-emerald-700 font-bold">Euro 6</th>
                  <th className="py-3 px-4 text-right text-blue-700 font-bold">Hibrid &gt;50g</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">Autoturisme & moto ≤ 1.600 cmc</td>
                  <td className="py-3 px-3 text-right">19,5 lei</td>
                  <td className="py-3 px-3 text-right">18,8 lei</td>
                  <td className="py-3 px-3 text-right">17,6 lei</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">16,5 lei</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-semibold">16,2 lei</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">Autoturisme 1.601 – 2.000 cmc</td>
                  <td className="py-3 px-3 text-right">29,7 lei</td>
                  <td className="py-3 px-3 text-right">28,5 lei</td>
                  <td className="py-3 px-3 text-right">26,7 lei</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">25,1 lei</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-semibold">24,6 lei</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">Autoturisme 2.001 – 2.600 cmc</td>
                  <td className="py-3 px-3 text-right">92,2 lei</td>
                  <td className="py-3 px-3 text-right">88,6 lei</td>
                  <td className="py-3 px-3 text-right">82,8 lei</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">77,8 lei</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-semibold">76,3 lei</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">Autoturisme 2.601 – 3.000 cmc</td>
                  <td className="py-3 px-3 text-right">182,9 lei</td>
                  <td className="py-3 px-3 text-right">172,8 lei</td>
                  <td className="py-3 px-3 text-right">154,1 lei</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">151,2 lei</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-semibold">149,8 lei</td>
                </tr>
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">Autoturisme &gt; 3.000 cmc</td>
                  <td className="py-3 px-3 text-right">319,0 lei</td>
                  <td className="py-3 px-3 text-right">297,3 lei</td>
                  <td className="py-3 px-3 text-right">294,4 lei</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">290,0 lei</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-semibold">275,5 lei</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-4 items-center justify-between">
            <span>Sursă legală: Legea nr. 227/2015 privind Codul fiscal republicat cu normele 2026</span>
            <a
              href="https://www.ghiseul.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-bold"
            >
              <span>Plată online securizată pe Ghișeul.ro</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
