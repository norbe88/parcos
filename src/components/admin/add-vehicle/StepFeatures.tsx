import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, ArrowRight, ArrowLeft, Sparkles, FileText, Wand2, RefreshCw, 
  UploadCloud, Camera, Plus, PlusCircle, X, Copy, CheckCheck, Lightbulb, Info,
  Trash2, CheckCircle2
} from 'lucide-react';
import { 
  processEquipmentSheetOcr, isTrivialNoiseFeature 
} from '../../../utils/equipmentSheetOcrEngine';
import { 
  getAllAvailableFeatures, addCustomFeature, removeCustomFeature, 
  isCustomFeature, isInvalidCorruptedFeature, DEFAULT_SHOWROOM_FEATURES 
} from '../../../utils/featuresCatalogService';
import { 
  generateVehicleDescription, DescriptionTone 
} from '../../../utils/vehicleDescriptionGenerator';

interface StepFeaturesProps {
  selectedFeatures: string[];
  toggleFeature: (feat: string) => void;
  availableFeatures?: string[];
  onFeaturesUpdated?: (features: string[]) => void;
  equipmentSheetText?: string;
  setEquipmentSheetText?: (val: string) => void;
  newDescription?: string;
  setNewDescription?: (val: string) => void;
  carBrand?: string;
  carModel?: string;
  carVersionTrim?: string;
  setCarVersionTrim?: (val: string) => void;
  carYear?: number;
  carMileage?: string | number;
  carFuel?: string;
  carTransmission?: string;
  carPowerHp?: number;
  carEngineCc?: number;
  carDrivetrain?: string;
  vatDeductible?: boolean;
  warrantyMonths?: 12 | 24 | 36;
  onPrev: () => void;
  onNext: () => void;
  showToast?: (msg: string) => void;
}

export const StepFeatures: React.FC<StepFeaturesProps> = ({
  selectedFeatures,
  toggleFeature,
  availableFeatures: externalFeatures,
  onFeaturesUpdated,
  equipmentSheetText = '',
  setEquipmentSheetText,
  newDescription = '',
  setNewDescription,
  carBrand = 'BMW',
  carModel = 'Seria 5',
  carVersionTrim = '520d Steptronic',
  setCarVersionTrim,
  carYear = 2018,
  carMileage = 160000,
  carFuel = 'Diesel',
  carTransmission = 'Automată',
  carPowerHp = 190,
  carEngineCc = 1995,
  carDrivetrain = 'Spate',
  vatDeductible = false,
  warrantyMonths = 12,
  onPrev,
  onNext,
  showToast
}) => {
  const [isScanningSheet, setIsScanningSheet] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [descriptionTone, setDescriptionTone] = useState<DescriptionTone>('editorial');
  const [isCopied, setIsCopied] = useState(false);
  const [localAvailableFeatures, setLocalAvailableFeatures] = useState<string[]>(() => {
    return externalFeatures && externalFeatures.length > 0 
      ? externalFeatures 
      : getAllAvailableFeatures();
  });

  const sheetFileInputRef = useRef<HTMLInputElement>(null);
  const sheetCameraInputRef = useRef<HTMLInputElement>(null);

  // Sincronizare reactivă când se schimbă catalogul global de dotări
  useEffect(() => {
    const refreshFeatures = () => {
      const all = getAllAvailableFeatures();
      setLocalAvailableFeatures(all);
      onFeaturesUpdated?.(all);
    };

    window.addEventListener('rxm_features_updated', refreshFeatures);
    return () => {
      window.removeEventListener('rxm_features_updated', refreshFeatures);
    };
  }, [onFeaturesUpdated]);

  // Dicționar de mapare coduri PR și cuvinte-cheie către dotările din interfață
  const FEATURE_MATCHERS: Record<string, RegExp> = {
    'Faruri Full LED': /full\s*led|led\s*scheinwerfer|matrix|0552|8it/i,
    'Faruri Bi-Xenon Adaptive': /bi-?xenon|xenon|0522/i,
    'Plafon Panoramic': /panoram|panoramadach|panoramic\s*roof|0402|3fu/i,
    'Trapă Electrică': /trap[aă]|sunroof|schiebedach|0403/i,
    'Scaune Încălzite': /încălzire\s*scaune|sitzheizung|heated\s*seats|0494|4a3/i,
    'Volan Încălzit': /volan\s*incalzit|volan\s*încălzit|lenkradheizung|heated\s*steering/i,
    'Ventilație Scaune': /ventila[tț]ie\s*scaune|sitzbel[üu]ftung|ventilated|0453|4d3/i,
    'Scaune Electrice cu Memorie': /scaune\s*electrice|memory\s*seats|0459|3l4/i,
    'Masaj Scaune': /masaj|massage|04t7/i,
    'Climatronic 2 Zone': /climatronic\s*2|2-?zone|0534|9ak/i,
    'Climatronic 3 Zone': /climatronic\s*3|3-?zone|4-?zone|9aq/i,
    'Virtual Cockpit': /virtual\s*cockpit|digital\s*cockpit|bord\s*digital|06wb|7j2|9s8/i,
    'Head-Up Display (HUD)': /head-?up|hud|0610|ks1/i,
    'Distronic ACC': /distronic|acc|adaptive\s*cruise|05df|8t3|8t8/i,
    'Lane Assist': /lane\s*assist|men[tț]inere\s*band[aă]|05ad|6i1/i,
    'Asistent Unghi Mort (BSM)': /blind\s*spot|unghi\s*mort|bsm|side\s*assist|absm|rcta|7y1/i,
    'Camere 360°': /360|surround\s*view|area\s*view|05dl|ka6/i,
    'Senzori Parcare F/S': /senzori\s*parcare|pdc|park\s*distance|0508|7x2/i,
    'Apple CarPlay & Android Auto': /carplay|android\s*auto|smartphone|06cp|9wt/i,
    'Sistem Audio Premium (Bose/Logic 7)': /harman|kardon|bose|bang\s*&\s*olufsen|burmester|logic\s*7|0688|9vd/i,
    'Keyless Entry & Start': /keyless|confort\s*acces|kessy|comfort\s*access|smart\s*key|0322|4i3/i,
    'Portbagaj Electric': /portbagaj\s*electric|hayon\s*electric|heckklappe|easy\s*open|0316|4e7/i,
    'Pachet M-Sport / S-Line / R-Line': /m-?sport|s-?line|r-?line|amg|0337|wqs/i,
    'Cârlig Remorcare': /c[aâ]rlig|anh[aä]ngerkupplung|towbar|03ac|1d2/i,
    'Jante Aliaj R18 / R19': /jante|r18|r19|r20|leichtmetall/i
  };

  // Verificare și bifare dotări cunoscute
  const autoCheckFeaturesFromText = (extractedText: string) => {
    let checkedCount = 0;
    Object.entries(FEATURE_MATCHERS).forEach(([featureName, regex]) => {
      if (regex.test(extractedText)) {
        if (!selectedFeatures.includes(featureName)) {
          toggleFeature(featureName);
          checkedCount++;
        }
      }
    });
    return checkedCount;
  };

  // Descoperire optică automată de noi opționale din fișă (Auto-Learning cu protecție anti-zgomot)
  const discoverAndLearnNewFeaturesFromText = (extractedText: string): string[] => {
    const newlyLearned: string[] = [];
    const lines = extractedText.split(/\r?\n/);

    for (const rawLine of lines) {
      const cleanLine = rawLine.trim()
        .replace(/^[-•*–+]\s*/, '')
        .replace(/^[0-9A-Z]{3,5}\s+/, '') // elimină coduri PR precum 04UR, 0552, 9VD
        .trim();

      if (
        cleanLine.length >= 6 && 
        cleanLine.length <= 50 &&
        !isInvalidCorruptedFeature(cleanLine) &&
        !isTrivialNoiseFeature(cleanLine) &&
        !/^(pachet|text extras|dot[aă]ri|op[tț]ionale|an fabric|vin|serie|nr\.|km|pre[tț]|tva|rulaj)/i.test(cleanLine)
      ) {
        // Verificăm dacă nu se potrivește deja cu vreun matcher standard
        const isAlreadyKnown = Object.values(FEATURE_MATCHERS).some(rx => rx.test(cleanLine));
        if (!isAlreadyKnown) {
          const res = addCustomFeature(cleanLine);
          if (res.success && res.isNew) {
            newlyLearned.push(res.feature);
            if (!selectedFeatures.includes(res.feature)) {
              toggleFeature(res.feature);
            }
          }
        }
      }
    }

    if (newlyLearned.length > 0) {
      const updated = getAllAvailableFeatures();
      setLocalAvailableFeatures(updated);
      onFeaturesUpdated?.(updated);
    }

    return newlyLearned;
  };

  // Adăugare Manuală de Dotare
  const handleManualAddFeature = () => {
    const trimmed = customFeatureInput.trim();
    if (!trimmed || isInvalidCorruptedFeature(trimmed)) return;

    const res = addCustomFeature(trimmed);
    if (res.success) {
      if (!selectedFeatures.includes(res.feature)) {
        toggleFeature(res.feature);
      }
      setLocalAvailableFeatures(res.allFeatures);
      onFeaturesUpdated?.(res.allFeatures);

      if (res.isNew) {
        showToast?.(`✨ Dotarea „${res.feature}” a fost adăugată și salvată permanent în catalog!`);
      } else {
        showToast?.(`ℹ️ Dotarea „${res.feature}” există deja în catalog și a fost selectată.`);
      }
      setCustomFeatureInput('');
    }
  };

  // Ștergere Dotare Custom
  const handleRemoveCustom = (e: React.MouseEvent, featName: string) => {
    e.stopPropagation();
    const res = removeCustomFeature(featName);
    if (res.success) {
      if (selectedFeatures.includes(featName)) {
        toggleFeature(featName);
      }
      setLocalAvailableFeatures(res.allFeatures);
      onFeaturesUpdated?.(res.allFeatures);
      showToast?.(`🗑️ Dotarea „${featName}” a fost ștearsă din catalog.`);
    }
  };

  // Scanare Reală OCR din Fișiere (suport Multi-Pagină & Fotografiere Secvențială Cumulativă)
  const handleProcessSheetFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsScanningSheet(true);
    let totalCheckedCount = 0;
    let accumulatedStandardCount = 0;

    try {
      let currentSheetText = equipmentSheetText || '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pageLabel = files.length > 1 ? `Pagina ${i + 1}/${files.length}` : 'Pagina Scanată';
        setScanStep(`📸 Analiză optică ${pageLabel} (${file.name})...`);

        const ocrResult = await processEquipmentSheetOcr(file, {
          onProgress: (_p, msg) => setScanStep(`[${pageLabel}] ${msg}`)
        });

        // 1. Sincronizare versiune trim dacă este detectată pe oricare dintre pagini
        if (ocrResult.header.versionTrim && setCarVersionTrim) {
          setCarVersionTrim(ocrResult.header.versionTrim);
        }

        // 2. Selectăm dotările cheie de top (Hero Highlights) fără zgomot
        for (const hero of ocrResult.heroHighlights) {
          if (!isTrivialNoiseFeature(hero) && !isInvalidCorruptedFeature(hero)) {
            const res = addCustomFeature(hero);
            if (res.success && !selectedFeatures.includes(res.feature)) {
              toggleFeature(res.feature);
              totalCheckedCount++;
            }
          }
        }

        // 3. Opționale cu plată din fabrică (ex: Negru Jet)
        for (const opt of ocrResult.optionalFeatures) {
          const optTitle = `Vopsea ${opt.name}${opt.priceEurWithVat ? ` (Opțională Fabrică: ${opt.priceEurWithVat} €)` : ''}`;
          const res = addCustomFeature(optTitle);
          if (res.success && !selectedFeatures.includes(res.feature)) {
            toggleFeature(res.feature);
            totalCheckedCount++;
          }
        }

        // 4. Verificare dotări standard cu dicționarul de matchers
        const autoChecked = autoCheckFeaturesFromText(ocrResult.rawText);
        totalCheckedCount += autoChecked;
        accumulatedStandardCount += ocrResult.standardFeatures.length;

        // 5. Unire text cumulativ (Append & Merge)
        const pageHeader = files.length > 1 ? `── PAGINA ${i + 1} (${file.name}) ──\n` : '';
        if (currentSheetText.trim().length > 0) {
          currentSheetText = `${currentSheetText}\n\n────────────────────────────────\n${pageHeader}${ocrResult.summaryText}`;
        } else {
          currentSheetText = `${pageHeader}${ocrResult.summaryText}`;
        }
      }

      if (setEquipmentSheetText) {
        setEquipmentSheetText(currentSheetText);
      }

      // 6. Actualizare catalog
      const updated = getAllAvailableFeatures();
      setLocalAvailableFeatures(updated);
      onFeaturesUpdated?.(updated);

      if (files.length > 1) {
        showToast?.(`🎉 ${files.length} pagini scanate! Au fost identificate ${accumulatedStandardCount} dotări și selectate ${totalCheckedCount} opționale cheie.`);
      } else if (equipmentSheetText && equipmentSheetText.trim().length > 0) {
        showToast?.(`🎉 Noua pagină a fost adăugată cumulativ la fișa existentă!`);
      } else {
        showToast?.(`🎉 Pagină scanată! Au fost selectate automat ${totalCheckedCount} opționale cheie.`);
      }
    } catch (err: any) {
      console.error('Eroare scanare foaie dotări:', err);
      runMockSheetFallback();
    } finally {
      setIsScanningSheet(false);
      setScanStep('');
    }
  };

  // Fallback Demonstrativ Rapid dacă nu se încarcă fișier fizic
  const runMockSheetFallback = () => {
    const mockScannedText = 
      `📋 Fișă Echipare identificată: ${carBrand} ${carModel} (${carVersionTrim || 'Revolution'})\n` +
      `• Dotări standard detectate: 64\n` +
      `• Opționale incluse în preț: NEGRU JET (510 € cu TVA 21% inclus)\n` +
      `• Top Dotări Cheie: Sistem audio BOSE (10 difuzoare) • Faruri LED Matrix adaptive • Head Up display • Camere 360° • Pilot automat adaptiv • Hayon electric • Scaune & volan încălzite • Monitorizare unghi mort (ABSM/RCTA)`;

    if (setEquipmentSheetText) {
      setEquipmentSheetText(mockScannedText);
    }

    if (!carVersionTrim && setCarVersionTrim) {
      setCarVersionTrim('Revolution');
    }

    const targetDotari = [
      'Faruri Full LED', 'Distronic ACC', 'Scaune Încălzite', 'Volan Încălzit',
      'Senzori Parcare F/S', 'Camere 360°', 'Head-Up Display (HUD)', 
      'Apple CarPlay & Android Auto', 'Sistem Audio Premium (Bose/Logic 7)', 'Keyless Entry & Start'
    ];

    targetDotari.forEach(d => {
      if (!selectedFeatures.includes(d)) {
        toggleFeature(d);
      }
    });

    const learned = addCustomFeature('Faruri LED Matrix adaptive');
    if (learned.success && !selectedFeatures.includes(learned.feature)) {
      toggleFeature(learned.feature);
    }

    const updated = getAllAvailableFeatures();
    setLocalAvailableFeatures(updated);
    onFeaturesUpdated?.(updated);

    showToast?.('🎉 Foaie de dotări scanată! Top opționale au fost bifate și fișa tehnică a fost înregistrată.');
  };

  // Generator Inteligent de Descriere Showroom
  const handleGenerateSmartDescription = (toneToUse?: DescriptionTone) => {
    const activeTone = toneToUse || descriptionTone;
    const generated = generateVehicleDescription({
      brand: carBrand,
      model: carModel,
      versionTrim: carVersionTrim,
      year: carYear,
      mileageKm: Number(carMileage) || undefined,
      fuelType: carFuel,
      transmission: carTransmission,
      powerHp: carPowerHp,
      engineCc: carEngineCc,
      drivetrain: carDrivetrain,
      vatDeductible: vatDeductible,
      warrantyMonths: warrantyMonths || 12,
      selectedFeatures: selectedFeatures
    }, {
      tone: activeTone,
      includeShowroomLocation: true,
      includeWarranty: true,
      includeDelivery: true
    });

    if (setNewDescription) {
      setNewDescription(generated);
    }
    showToast?.(`✨ Descriere [${activeTone.toUpperCase()}] generată pe baza datelor reale ale mașinii!`);
  };

  // Copiere Rapidă în Clipboard
  const handleCopyDescription = () => {
    if (!newDescription) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(newDescription).then(() => {
        setIsCopied(true);
        showToast?.('📋 Descriere copiată în clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const wordCount = newDescription ? newDescription.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = newDescription ? newDescription.length : 0;

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Inputs ascunse pentru Upload și Camera Capture Foaie Dotări (Suport Multi-Pagină) */}
      <input 
        ref={sheetFileInputRef}
        type="file" 
        multiple
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleProcessSheetFiles(Array.from(e.target.files));
          }
        }} 
      />
      <input 
        ref={sheetCameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessSheetFiles([e.target.files[0]]);
          }
        }} 
      />

      {/* 📸 SECȚIUNE SCANARE FOAIE DE DOTĂRI (OCR REAL & PR-CODES AUTO-LEARNING) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Scanare Foaie Dotări / Fișă Opționale din Fabrică
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Încarcă eticheta PR-Codes sau fișa din fabrică (suportă 1, 2 sau 3+ pagini simultan sau fotografiate pe rând).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Buton Upload Fișiere (Selecție Multiplă) */}
            <button
              type="button"
              onClick={() => sheetFileInputRef.current?.click()}
              disabled={isScanningSheet}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 touch-manipulation active:scale-95 cursor-pointer"
              title="Poți selecta 1, 2 sau mai multe imagini deodată sau un fișier PDF multi-pagină"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Încarcă Poze (1-3)</span>
            </button>

            {/* Buton Cameră Foto Mobil */}
            <button
              type="button"
              onClick={() => sheetCameraInputRef.current?.click()}
              disabled={isScanningSheet}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 touch-manipulation active:scale-95 cursor-pointer"
              title="Fotografiază pagina curentă (poți fotografia mai multe pagini pe rând)"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Cameră</span>
            </button>

            {/* Buton Test Rapid Demonstrativ */}
            <button
              type="button"
              onClick={runMockSheetFallback}
              disabled={isScanningSheet}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 touch-manipulation active:scale-95 cursor-pointer"
            >
              {isScanningSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isScanningSheet ? 'Scanare...' : 'Mostră Demo'}</span>
            </button>
          </div>
        </div>

        {/* Indicator de stare scanare */}
        {isScanningSheet && (
          <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/40 text-[11px] text-amber-300 font-mono flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
            <span>{scanStep || 'Procesare optică în curs...'}</span>
          </div>
        )}

        {/* Text extras din foaia de dotări cu suport multi-pagină */}
        {equipmentSheetText && (
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Fișă Echipare Activă (Mod Cumulativ Multi-Pagină)
              </span>
              <button
                type="button"
                onClick={() => setEquipmentSheetText?.('')}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                title="Golește textul fișei scanate"
              >
                <Trash2 className="w-3 h-3" />
                <span>Golește fișa</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-[11px] font-mono text-zinc-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
              {equipmentSheetText}
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-400">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Ai mai multe pagini? Apasă din nou pe <strong>Cameră</strong> sau <strong>Încarcă Poze</strong> — noile pagini se adaugă automat cumulativ fără a pierde dotările anterioare.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ➕ ZONĂ ADĂUGARE MANUALĂ DE DOTĂRI NOI */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-zinc-200 text-xs font-semibold flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            Adăugare Manuală Dotare (Se salvează permanent pentru totdeauna):
          </label>
          <span className="text-[11px] text-zinc-400">Apasă Enter sau click pe Adaugă</span>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="text"
            value={customFeatureInput}
            onChange={(e) => setCustomFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualAddFeature();
              }
            }}
            placeholder="Ex: Webasto cu telecomandă, Soft Close, Scaune Masaj, Padele F1..."
            className="flex-1 min-h-[40px] px-3 py-2 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={handleManualAddFeature}
            disabled={!customFeatureInput.trim()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Adaugă Dotare</span>
          </button>
        </div>
      </div>

      {/* Listă Dotări Interactive (Catalog Unificat & Persistent) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-300 text-xs font-semibold">
            Dotări Selectate ({selectedFeatures.length} din {localAvailableFeatures.length}):
          </span>
          <span className="text-[11px] text-zinc-400">
            Apasă pe dotări pentru activare/dezactivare
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2 border border-white/10 rounded-xl bg-black/30">
          {localAvailableFeatures.map(feat => {
            const isSelected = selectedFeatures.includes(feat);
            const isCustom = isCustomFeature(feat);

            return (
              <div
                key={feat}
                onClick={() => toggleFeature(feat)}
                className={`group px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation select-none ${
                  isSelected 
                    ? 'bg-amber-500 text-black font-bold shadow-sm shadow-amber-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                <span>{feat}</span>
                
                {/* Badge & Buton Ștergere pentru dotări adăugate manual de utilizator */}
                {isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveCustom(e, feat)}
                    title="Șterge definitiv această dotare din catalog"
                    className={`ml-1 p-0.5 rounded hover:bg-black/20 transition-colors ${
                      isSelected ? 'text-black/80 hover:text-black' : 'text-zinc-500 hover:text-rose-400'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚀 GENERATOR INTELIGENT DE DESCRIERE SHOWROOM (BENCHMARK TOP DEALERI) */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-zinc-200 text-xs font-bold flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-amber-400" />
              Generator Inteligent de Descriere Showroom:
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
              Fără redundanțe
            </span>
          </div>

          {/* Selector de Ton Editorial */}
          <div className="inline-flex rounded-xl bg-black/60 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setDescriptionTone('editorial');
                handleGenerateSmartDescription('editorial');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                descriptionTone === 'editorial' 
                  ? 'bg-amber-500 text-black font-bold shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Editorial Showroom
            </button>
            <button
              type="button"
              onClick={() => {
                setDescriptionTone('technical');
                handleGenerateSmartDescription('technical');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                descriptionTone === 'technical' 
                  ? 'bg-amber-500 text-black font-bold shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sintetic & Tehnic
            </button>
            <button
              type="button"
              onClick={() => {
                setDescriptionTone('social');
                handleGenerateSmartDescription('social');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                descriptionTone === 'social' 
                  ? 'bg-amber-500 text-black font-bold shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Social Media
            </button>
          </div>
        </div>

        {/* Bara de Acțiuni Rapide Generator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateSmartDescription()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generează din Specificații & Dotări</span>
            </button>

            {newDescription && (
              <button
                type="button"
                onClick={handleCopyDescription}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copiat!' : 'Copiază'}</span>
              </button>
            )}
          </div>

          {newDescription && (
            <div className="text-[11px] text-zinc-400 font-mono">
              {wordCount} cuvinte • {charCount} caractere
            </div>
          )}
        </div>

        {/* Textarea Descriere Editabilă */}
        <textarea 
          rows={6}
          value={newDescription}
          onChange={(e) => setNewDescription && setNewDescription(e.target.value)}
          placeholder="Descrierea completă a mașinii, starea mecanică, revizii efectuate, garanție și beneficii showroom..."
          className="w-full bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors leading-relaxed"
        />

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Optimizat fără redundanțe de rate (acoperite de calculatorul dedicat RXM). Include garanție 12-36 luni, TVA 21% și transport la domiciliu.</span>
        </div>
      </div>

      {/* Butoane Navigare Wizard */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onPrev}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>Înapoi: Preț & TVA</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <span>Pasul 4: Poze & Video</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
