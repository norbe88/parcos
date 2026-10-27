import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, ShieldCheck, CreditCard, RotateCcw, 
  Save, Eye, Check, Sparkles, AlertCircle, RefreshCw,
  Truck, Shield, Car, CheckCircle2
} from 'lucide-react';
import { DealerProfile, SEED_DEALER, SEED_VEHICLES } from '../../db/seed';
import { 
  OlxDealerTemplateConfig, 
  DEFAULT_OLX_TEMPLATE_CONFIG, 
  getDealerOlxTemplate, 
  saveDealerOlxTemplate,
  generateOlxDescription,
  sanitizeForOlx
} from '../../utils/olxPosterPayload';

interface OlxTemplateSettingsManagerProps {
  dealer?: DealerProfile;
  showToast: (msg: string) => void;
}

export const OlxTemplateSettingsManager: React.FC<OlxTemplateSettingsManagerProps> = ({
  dealer = SEED_DEALER,
  showToast
}) => {
  const dealerId = dealer?.id || dealer?.slug || dealer?.cui;

  const [config, setConfig] = useState<OlxDealerTemplateConfig>(() => 
    getDealerOlxTemplate(dealerId)
  );
  const [activePreviewTab, setActivePreviewTab] = useState<'editor' | 'preview'>('editor');
  const [isSaved, setIsSaved] = useState(false);

  // Reîncărcare la schimbarea dealerului
  useEffect(() => {
    setConfig(getDealerOlxTemplate(dealerId));
  }, [dealerId]);

  // Vehicul eșantion pentru previzualizare în timp real
  const sampleCar = useMemo(() => {
    return SEED_VEHICLES[0] || {
      id: 'sample-1',
      brand: 'Renault',
      model: 'Clio',
      versionTrim: '0.9 TCe Zen',
      year: 2018,
      priceEur: 8450,
      mileageKm: 148000,
      engineCc: 898,
      powerHp: 90,
      fuelType: 'Benzina',
      transmission: 'Manuala',
      bodyType: 'Hatchback',
      color: 'Albastru',
      vin: 'VF15R240A59414762',
      vatDeductible: false,
      features: ['Aer condiționat', 'Navigație touchscreen', 'Senzori parcare', 'Pilot automat']
    };
  }, []);

  // Previzualizare text generat
  const previewText = useMemo(() => {
    return generateOlxDescription(sampleCar as any, dealer, {
      includeFinancing: config.includeFinancing,
      includeWarranty: config.includeWarranty,
      warrantyMonths: config.warrantyMonths,
      includeBuyBack: config.includeBuyBack,
      includeDelivery: config.includeDelivery,
      includeVinInText: config.includeVinInText,
      includeContGarantie: config.includeContGarantie,
      customHeader: config.customHeader,
      customFooter: config.customFooter,
      customNotes: config.customNotes
    });
  }, [sampleCar, dealer, config]);

  const handleSave = () => {
    saveDealerOlxTemplate(config, dealerId);
    setIsSaved(true);
    showToast('✓ Template-ul și opțiunile OLX au fost salvate ca implicite pentru parc!');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setConfig(DEFAULT_OLX_TEMPLATE_CONFIG);
    saveDealerOlxTemplate(DEFAULT_OLX_TEMPLATE_CONFIG, dealerId);
    showToast('✓ Template-ul a fost resetat la valorile standard ParcOS.');
  };

  return (
    <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Configurator Template Anunțuri OLX</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Structură & Clauze Comerciale Predefinite</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-semibold border border-amber-500/20">
              Personalizat per Parc
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Alege ce secțiuni dorești să apară automat în descrierile OLX generate din ParcOS. Modificările se aplică automat la fiecare export nou.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
            title="Revino la setările din fabrică ParcOS"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Standard</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              isSaved 
                ? 'bg-emerald-500 text-black shadow-emerald-500/20' 
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:scale-105 shadow-amber-500/20'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-black" /> : <Save className="w-3.5 h-3.5 text-black" />}
            <span>{isSaved ? 'Salvat!' : 'Salvează Template'}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Comutatoare Stânga + Previzualizare Dreapta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coloana Stângă: Opțiuni & Comutatoare (7 cols pe desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Secțiuni & Clauze Comerciale Active</span>
          </h4>

          {/* 1. Clauză Cont de Garanție (Subiectul cererii) */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white">Mențiune „Cont de Garanție”</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                  {config.includeContGarantie ? 'Activ' : 'Dezactivat'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Include clauza oficială: <em>„Tranzacție 100% securizată: acceptăm plată prin Cont de Garanție sau transfer bancar securizat”</em>. Dacă parcul tău nu dorește plăți prin cont de garanție, debifează această opțiune.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={config.includeContGarantie}
                onChange={(e) => setConfig(prev => ({ ...prev, includeContGarantie: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* 2. Clauză Garanție Comercială */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-bold text-white">Garanție Comercială Scrisă</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Mențiune în text pentru garanție contractuală fără costuri ascunse.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={config.includeWarranty}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeWarranty: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {config.includeWarranty && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-medium">Perioadă garanție:</span>
                <div className="flex items-center gap-1.5">
                  {[6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, warrantyMonths: m }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        config.warrantyMonths === m
                          ? 'bg-amber-500 text-black border-amber-500 shadow-xs'
                          : 'bg-white/5 text-zinc-400 hover:text-white border-white/10'
                      }`}
                    >
                      {m} Luni
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Pachet Finanțare & Rate */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm font-bold text-white">Finanțare în Rate & Leasing Auto</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Include blocul de rate rapide: aprobare online în 1-2 ore, parteneri TBI Bank, BT Direct, UniCredit, posibilitate Avans 0%.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={config.includeFinancing}
                onChange={(e) => setConfig(prev => ({ ...prev, includeFinancing: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* 4. Buy-Back / Trade-In */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-sm font-bold text-white">Serviciu Buy-Back / Trade-In</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mențiune preluare mașină veche a clientului ca avans pentru autoturismul achiziționat.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={config.includeBuyBack}
                onChange={(e) => setConfig(prev => ({ ...prev, includeBuyBack: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* 5. Livrare & Numere Roșii */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-sm font-bold text-white">Livrare Națională & Numere Roșii</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mențiune eliberare numere provizorii pe loc sau transport gratuit/asigurat pe platformă.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={config.includeDelivery}
                onChange={(e) => setConfig(prev => ({ ...prev, includeDelivery: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          {/* 6. Serie Șasiu (VIN) în text */}
          <div className="p-3.5 rounded-xl bg-[#18181b] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-bold text-white">Afișare Serie de Șasiu (VIN) în Text</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Adaugă seria de șasiu în specificațiile tehnice din descriere pentru transparență și verificare istoric.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={config.includeVinInText}
                onChange={(e) => setConfig(prev => ({ ...prev, includeVinInText: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 7. Notă Fixă Dealer / Program Vizionări */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Notă Fixă Showroom / Program de Lucru (Opțional)</span>
              <span className="text-[10px] text-zinc-500">Apare la finalul fiecărui anunț</span>
            </label>
            <textarea
              rows={2}
              value={config.customNotes || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, customNotes: e.target.value }))}
              placeholder="Ex: Program showroom: Luni-Vineri 09:00 - 18:00, Sambata 10:00 - 14:00. Vizionarile se fac pe baza de programare telefonica."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </div>

        {/* Coloana Dreaptă: Previzualizare Live (5 cols pe desktop) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Previzualizare Live Descriere OLX</span>
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                ✓ 100% Compatibil OLX
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#0d0d10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 font-mono text-[11px] text-zinc-300 leading-relaxed select-text overflow-hidden">
            <div className="max-h-[460px] overflow-y-auto pr-2 space-y-2 whitespace-pre-wrap">
              {previewText}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
              <span>Lungime text: <strong className="text-white font-mono">{previewText.length}</strong> / 9000 caractere</span>
              <span className="text-emerald-400 font-semibold">Fără caractere speciale interzise</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-normal">
            💡 <em>Notă:</em> La fiecare export de vehicul din ParcOS, poți în continuare ajusta manual descrierea mașinii înainte de publicare. Opțiunile alese aici reprezintă starea inițială implicită.
          </p>
        </div>

      </div>
    </div>
  );
};
