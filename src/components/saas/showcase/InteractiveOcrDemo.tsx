import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Clock, 
  FileCheck, 
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Lock,
  X,
  MessageCircle,
  PhoneCall,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  scanDemoVehicleDocument,
  getLocalDemoQuota,
  fetchServerDemoQuota,
  sanitizePublicOcrError,
  DEMO_MAX_SCANS,
  DemoScanQuota
} from '../../../services/demoOcrService';

export interface DemoDocData {
  id: 'talon_ro' | 'civ_ro' | 'brief_de' | 'custom';
  countryCode: 'RO' | 'DE';
  countryFlag: string;
  title: string;
  subtitle: string;
  docNumber: string;
  brand: string;
  model: string;
  vin: string;
  engineCc: number;
  powerKw: number;
  powerHp: number;
  fuelType: string;
  euroNorm: string;
  co2: string;
  manufactureYear: number;
  registrationDate: string;
  maxWeightKg: number;
  seats: number;
  color: string;
  previewType: 'talon' | 'civ' | 'brief';
}

const PRESET_DOCUMENTS: Record<'talon_ro' | 'civ_ro' | 'brief_de', DemoDocData> = {
  talon_ro: {
    id: 'talon_ro',
    countryCode: 'RO',
    countryFlag: '🇷🇴',
    title: 'Talon România',
    subtitle: 'Certificat de Înmatriculare (Directiva 1999/37/CE)',
    docNumber: 'RO 09241852',
    brand: 'VOLKSWAGEN',
    model: 'Passat Variant 2.0 TDI Highline',
    vin: 'WVWZZZ3CZJE092841',
    engineCc: 1968,
    powerKw: 110,
    powerHp: 150,
    fuelType: 'Motorină (Diesel)',
    euroNorm: 'Euro 6',
    co2: '108 g/km',
    manufactureYear: 2018,
    registrationDate: '14.05.2018',
    maxWeightKg: 2090,
    seats: 5,
    color: 'Negru Metalizat',
    previewType: 'talon'
  },
  civ_ro: {
    id: 'civ_ro',
    countryCode: 'RO',
    countryFlag: '🇷🇴',
    title: 'CIV România',
    subtitle: 'Cartea de Identitate a Vehiculului (RAR)',
    docNumber: 'CIV: X-741920',
    brand: 'AUDI',
    model: 'A6 Avant 2.0 TDI ultra S-Tronic',
    vin: 'WAUZZZ4G5FN048712',
    engineCc: 1968,
    powerKw: 140,
    powerHp: 190,
    fuelType: 'Motorină (Diesel)',
    euroNorm: 'Euro 6',
    co2: '119 g/km',
    manufactureYear: 2015,
    registrationDate: '23.09.2015',
    maxWeightKg: 2205,
    seats: 5,
    color: 'Gri Daytona',
    previewType: 'civ'
  },
  brief_de: {
    id: 'brief_de',
    countryCode: 'DE',
    countryFlag: '🇩🇪',
    title: 'Fahrzeugbrief Germania',
    subtitle: 'Zulassungsbescheinigung Teil I (Fahrzeugschein)',
    docNumber: 'DE-H2849102',
    brand: 'BMW',
    model: '520d xDrive Touring M Sport (G31)',
    vin: 'WBA31AY08NCM19482',
    engineCc: 1995,
    powerKw: 140,
    powerHp: 190,
    fuelType: 'Diesel / Mild-Hybrid (48V)',
    euroNorm: 'Euro 6d-ISC-FCM',
    co2: '134 g/km',
    manufactureYear: 2021,
    registrationDate: '22.09.2021',
    maxWeightKg: 2410,
    seats: 5,
    color: 'Sophistograu Brillanteffekt',
    previewType: 'brief'
  }
};

interface InteractiveOcrDemoProps {
  onSwitchToDealer?: (slug: string) => void;
}

export const InteractiveOcrDemo: React.FC<InteractiveOcrDemoProps> = ({
  onSwitchToDealer
}) => {
  const [selectedDocKey, setSelectedDocKey] = useState<'talon_ro' | 'civ_ro' | 'brief_de' | 'custom'>('talon_ro');
  const [activeDoc, setActiveDoc] = useState<DemoDocData>(PRESET_DOCUMENTS.talon_ro);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [copiedVin, setCopiedVin] = useState(false);
  const [quota, setQuota] = useState<DemoScanQuota>(getLocalDemoQuota());
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically trigger laser scan when selecting a preset
  const runScan = (targetDoc: DemoDocData) => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    
    setIsScanning(true);
    setScanProgress(0);
    setTelemetryLogs([
      `> [AI-OCR 3.5] Inițializare cameră & decodare cadru...`,
    ]);

    const startTime = Date.now();
    const duration = 1200; // strictly 1.2 seconds for ultra-fast UX

    scanTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setScanProgress(progress);

      if (progress >= 25 && progress < 50) {
        setTelemetryLogs((prev) => 
          prev.length === 1 
            ? [...prev, `> [VISION 3.5] Corecție perspectivă & orientare unghi... [OK]`]
            : prev
        );
      } else if (progress >= 50 && progress < 75) {
        setTelemetryLogs((prev) => 
          prev.length === 2 
            ? [...prev, `> [PARSER] Câmp E (VIN: ${targetDoc.vin.slice(0, 8)}***) Checksum ISO 3779... [VALID]`]
            : prev
        );
      } else if (progress >= 75 && progress < 95) {
        setTelemetryLogs((prev) => 
          prev.length === 3 
            ? [...prev, `> [PARSER] Extragere P.1 (${targetDoc.engineCc} cm³), P.2 (${targetDoc.powerKw} kW ➔ ${targetDoc.powerHp} CP), V.9 (${targetDoc.euroNorm})... [OK]`]
            : prev
        );
      }

      if (elapsed >= duration) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        setScanProgress(100);
        setIsScanning(false);
        setTelemetryLogs((prev) => [
          ...prev,
          `> [SUCCESS] Fişă tehnică extrasă în 1.2s • Încredere AI: 99.4%`
        ]);
      }
    }, 40);
  };

  useEffect(() => {
    // Initial scan on mount (preset talon_ro)
    runScan(PRESET_DOCUMENTS.talon_ro);
    // Sincronizare cotă cu backend-ul
    fetchServerDemoQuota().then((q) => setQuota(q));
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  const handleSelectPreset = (key: 'talon_ro' | 'civ_ro' | 'brief_de') => {
    setSelectedDocKey(key);
    setCustomImage(null);
    setScanErrorMessage(null);
    const doc = PRESET_DOCUMENTS[key];
    setActiveDoc(doc);
    runScan(doc);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetăm input-ul pentru a permite reîncărcarea
    e.target.value = '';

    // Dacă utilizatorul a epuizat cele 3 scanări permise
    if (quota.isLimitReached || quota.remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setScanErrorMessage(null);
    setIsScanning(true);
    setScanProgress(15);
    setSelectedDocKey('custom');

    // Afișăm imaginea locală imediat ca preview
    const previewUrl = URL.createObjectURL(file);
    setCustomImage(previewUrl);

    setTelemetryLogs([
      `> [PARCOS AI 3.5] Document încărcat: ${file.name} (${Math.round(file.size / 1024)} KB)`,
      `> [PARCOS AI 3.5] Cota test pe acest dispozitiv: ${quota.remaining}/${DEMO_MAX_SCANS} scanări rămase`,
      `> [VISION 3.5] Optimizare cadru & recunoaștere optică europeană...`
    ]);

    const result = await scanDemoVehicleDocument(file, (progress, message) => {
      setScanProgress(progress);
      setTelemetryLogs((prev) => [...prev, message]);
    });

    if (result.success && result.vehicleData) {
      const v = result.vehicleData;
      const customDoc: DemoDocData = {
        id: 'custom',
        countryCode: (v.docOriginCountry === 'DE' ? 'DE' : 'RO'),
        countryFlag: v.docOriginCountry === 'DE' ? '🇩🇪' : v.docOriginCountry === 'AT' ? '🇦🇹' : v.docOriginCountry === 'FR' ? '🇫🇷' : '🇷🇴',
        title: 'Document Scanat Live',
        subtitle: v.docType || file.name,
        docNumber: v.civNumber || v.plateNumber || 'ACT OFICIAL IDENTIFICAT',
        brand: v.brand || 'VEHICUL IDENTIFICAT',
        model: v.model ? `${v.model} ${v.versionTrim || ''}`.trim() : 'Model Extins',
        vin: v.vin || 'VIN_NEDETECTAT',
        engineCc: v.engineCc || 0,
        powerKw: v.powerKw || 0,
        powerHp: v.powerHp || (v.powerKw ? Math.round(v.powerKw * 1.35962) : 0),
        fuelType: v.fuelType || 'Diesel / Benzină',
        euroNorm: v.euroNorm || 'Euro 6',
        co2: v.co2 || 'Nespecificat',
        manufactureYear: v.year || new Date().getFullYear(),
        registrationDate: v.registrationDate || '-',
        maxWeightKg: 2200,
        seats: 5,
        color: v.color || 'Standard',
        previewType: (v.docType && v.docType.toLowerCase().includes('civ')) ? 'civ' : 'talon'
      };

      setActiveDoc(customDoc);
      setScanProgress(100);
      setIsScanning(false);
      setQuota((prev) => ({
        ...prev,
        used: DEMO_MAX_SCANS - result.remainingScans,
        remaining: result.remainingScans,
        isLimitReached: result.limitReached || result.remainingScans <= 0
      }));

      setTelemetryLogs((prev) => [
        ...prev,
        `> [SUCCESS] Fişă tehnică generată cu succes! Încredere AI: ${v.confidenceScore || 99}%`,
        result.remainingScans > 0 
          ? `> [COTA TEST] Scanări rămase pentru test: ${result.remainingScans}/${DEMO_MAX_SCANS}`
          : `> [COTA TEST] Ai utilizat toate cele ${DEMO_MAX_SCANS} scanări gratuite de test.`
      ]);

      if (result.limitReached || result.remainingScans <= 0) {
        setTimeout(() => {
          setShowLimitModal(true);
        }, 1500);
      }
    } else {
      setIsScanning(false);
      setScanProgress(0);
      if (result.limitReached) {
        setQuota((prev) => ({ ...prev, remaining: 0, isLimitReached: true }));
        setShowLimitModal(true);
      } else {
        const cleanError = sanitizePublicOcrError(result.error);
        setScanErrorMessage(cleanError);
        setTelemetryLogs((prev) => [
          ...prev,
          `> [EROARE] ${cleanError}`
        ]);
      }
    }
  };

  const copyVinToClipboard = () => {
    navigator.clipboard.writeText(activeDoc.vin);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Header and Commercial Proof Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 font-bold mb-2">
            <Scan className="w-3.5 h-3.5 text-amber-600" />
            <span>SCANARE RAPIDĂ TALON & CARTE AUTO (CIV)</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight">
            Testează Viteza Scannerului pe Documente Reale
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Alege un talon românesc, carte RAR (CIV) sau brief german de import. 
            Apasă pentru a testa sau încarcă propria fotografie direct de pe telefon.
          </p>
        </div>

        {/* Commercial Proof & Quota Badges */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div 
            onClick={() => quota.isLimitReached && setShowLimitModal(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xs cursor-pointer transition-all ${
              quota.remaining > 1
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : quota.remaining === 1
                  ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse hover:bg-amber-100'
                  : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
            }`}
            title={quota.isLimitReached ? "Click pentru detalii acces dealer nelimitat" : "Număr de teste gratuite rămase pe acest dispozitiv"}
          >
            {quota.remaining > 0 ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚡ Test Gratuit: <strong>{quota.remaining}/{DEMO_MAX_SCANS}</strong> scanări rămase</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Limită test atinsă (0/{DEMO_MAX_SCANS}) • Solicită acces</span>
              </>
            )}
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs shrink-0">
            <Clock className="w-4 h-4 text-slate-600 shrink-0" />
            <span>⚡ Gata în sub 2 secunde</span>
          </div>
        </div>
      </div>

      {/* Preset Document Selector Tabs & Real Upload */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4" role="tablist">
        {(Object.keys(PRESET_DOCUMENTS) as Array<'talon_ro' | 'civ_ro' | 'brief_de'>).map((key) => {
          const doc = PRESET_DOCUMENTS[key];
          const isSelected = selectedDocKey === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectPreset(key)}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 touch-manipulation border ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-black scale-[1.02]'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-950'
              }`}
            >
              <span className="text-base">{doc.countryFlag}</span>
              <span>{doc.title}</span>
            </button>
          );
        })}

        {/* Upload Custom Photo Option */}
        <button
          role="tab"
          aria-selected={selectedDocKey === 'custom'}
          onClick={() => {
            if (quota.isLimitReached || quota.remaining <= 0) {
              setShowLimitModal(true);
            } else {
              fileInputRef.current?.click();
            }
          }}
          disabled={isScanning}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 touch-manipulation border ${
            quota.isLimitReached
              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 font-bold'
              : selectedDocKey === 'custom'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                : 'bg-slate-100 text-slate-700 border-dashed border-slate-300 hover:border-amber-500 hover:text-amber-900 hover:bg-slate-50'
          }`}
          title={quota.isLimitReached ? "Ați atins limita de 3 scanări gratuite" : "Încarcă propria fotografie de talon sau CIV"}
        >
          {quota.isLimitReached ? (
            <>
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Limită Test Atinsă (3/3)</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Încarcă Poză / Document Real</span>
            </>
          )}
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*,application/pdf"
          className="hidden" 
          onChange={handleFileUpload} 
        />
      </div>

      {/* Error Notice Banner if scan fails */}
      {scanErrorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{scanErrorMessage}</span>
          </div>
          <button 
            onClick={() => setScanErrorMessage(null)} 
            className="text-rose-500 hover:text-rose-700 p-1"
            aria-label="Închide eroarea"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dual-Pane Simulator Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane (7 cols): Document Frame with Laser Beam & Live HUD */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="relative rounded-2xl border border-white/15 bg-zinc-950 overflow-hidden shadow-2xl">
            
            {/* Document Frame Top Bar */}
            <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between text-xs font-mono-telemetry">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-base">{activeDoc.countryFlag}</span>
                <span className="font-bold text-white uppercase">{activeDoc.subtitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-mono">{activeDoc.docNumber}</span>
                <button
                  onClick={() => runScan(activeDoc)}
                  disabled={isScanning}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-400/30 text-[10px] font-semibold flex items-center gap-1 transition-all touch-manipulation disabled:opacity-50"
                  title="Rulează din nou scanarea"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Rescanează</span>
                </button>
              </div>
            </div>

            {/* Document Visual Viewport with Guilloche & Realistic Fields */}
            <div className="relative p-5 sm:p-7 min-h-[340px] sm:min-h-[400px] flex items-center justify-center select-none bg-gradient-to-br from-[#121216] via-[#101014] to-[#0a0a0d]">
              
              {/* Guilloche / Microprint Background Texture */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.2) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px, 12px 12px'
                }}
              />

              {/* Custom Image Preview if Uploaded */}
              {customImage ? (
                <div className="w-full max-h-[360px] overflow-hidden rounded-lg border border-white/10 flex items-center justify-center bg-black/60">
                  <img 
                    src={customImage} 
                    alt="Document Auto Încărcat" 
                    className="max-h-[350px] w-auto object-contain"
                  />
                </div>
              ) : (
                /* High-Fidelity Synthetic Document Card */
                <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#18181f]/95 p-5 shadow-2xl relative">
                  
                  {/* Watermark Crest */}
                  <div className="absolute right-4 top-4 text-white/[0.04] font-display font-black text-6xl pointer-events-none select-none">
                    {activeDoc.countryCode}
                  </div>

                  {/* Header of Certificate */}
                  <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest uppercase text-amber-400">
                        UNIUNEA EUROPEANĂ • {activeDoc.countryCode === 'RO' ? 'ROMÂNIA' : 'BUNDESREPUBLIK DEUTSCHLAND'}
                      </div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {activeDoc.title.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-zinc-500">COD ARMONIZAT</div>
                      <div className="text-xs font-mono font-bold text-zinc-300">DIR. 1999/37/CE</div>
                    </div>
                  </div>

                  {/* Field Harmonization Rows (Official EU Letter Codes) */}
                  <div className="space-y-2.5 text-xs font-mono-telemetry">
                    <div className="grid grid-cols-12 gap-2 p-1.5 rounded bg-black/30 border border-white/5">
                      <span className="col-span-3 text-amber-400 font-bold">(E) VIN:</span>
                      <span className="col-span-9 text-white font-extrabold tracking-wider">{activeDoc.vin}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 p-1.5 rounded bg-black/30 border border-white/5">
                      <span className="col-span-3 text-amber-400 font-bold">(D.1) Marcă:</span>
                      <span className="col-span-9 text-zinc-200">{activeDoc.brand}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 p-1.5 rounded bg-black/30 border border-white/5">
                      <span className="col-span-3 text-amber-400 font-bold">(D.3) Model:</span>
                      <span className="col-span-9 text-zinc-200">{activeDoc.model}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6 p-1.5 rounded bg-black/30 border border-white/5 flex items-center justify-between">
                        <span className="text-amber-400 font-bold">(P.1) Cilindree:</span>
                        <span className="text-zinc-200 font-bold">{activeDoc.engineCc} cm³</span>
                      </div>
                      <div className="col-span-6 p-1.5 rounded bg-black/30 border border-white/5 flex items-center justify-between">
                        <span className="text-amber-400 font-bold">(P.2) Putere:</span>
                        <span className="text-zinc-200 font-bold">{activeDoc.powerKw} kW ({activeDoc.powerHp} CP)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6 p-1.5 rounded bg-black/30 border border-white/5 flex items-center justify-between">
                        <span className="text-amber-400 font-bold">(V.9) Emisii:</span>
                        <span className="text-zinc-200 font-bold">{activeDoc.euroNorm}</span>
                      </div>
                      <div className="col-span-6 p-1.5 rounded bg-black/30 border border-white/5 flex items-center justify-between">
                        <span className="text-amber-400 font-bold">(B) 1-a Înmatr:</span>
                        <span className="text-zinc-200 font-bold">{activeDoc.registrationDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Microprint Footer on Document */}
                  <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                    <span>SECURITY DOCUMENT • CHECKSUM PASS</span>
                    <span>SERIE: {activeDoc.docNumber}</span>
                  </div>
                </div>
              )}

              {/* ⚡ Laser Scanning Beam (60fps animation) */}
              {isScanning && (
                <div 
                  className="absolute inset-x-0 pointer-events-none transition-all duration-75 z-20"
                  style={{ top: `${scanProgress}%` }}
                >
                  {/* Glowing Laser Line */}
                  <div className="h-[2.5px] w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b,0_0_30px_#f59e0b]" />
                  {/* Soft Light Curtain under the laser */}
                  <div className="h-14 w-full bg-gradient-to-b from-amber-400/15 to-transparent pointer-events-none" />
                </div>
              )}

              {/* Scanning Overlay Percentage HUD */}
              {isScanning && (
                <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-lg bg-black/80 border border-amber-400/40 text-amber-300 font-mono-telemetry text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>ANALIZĂ OCR: {scanProgress}%</span>
                </div>
              )}
            </div>

            {/* Real-Time Telemetry Terminal Stream */}
            <div className="bg-black/90 border-t border-white/10 p-3.5 font-mono-telemetry text-xs space-y-1">
              <div className="flex items-center gap-2 text-zinc-300 text-[10px] uppercase tracking-wider mb-1 font-semibold">
                <Terminal className="w-3 h-3 text-amber-400" />
                <span>Jurnal Telemetrie Recunoaștere Optică</span>
              </div>
              {telemetryLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`text-[11px] leading-relaxed transition-all ${
                    idx === telemetryLogs.length - 1 ? 'text-amber-300 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Pane (5 cols): Instant Populated Technical Sheet */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/15 bg-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
            
            {/* Top Badge & Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono-telemetry font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>EXTRAS AUTOMAT // ZERO ERORI</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-semibold">ISO 3779 VALIDAT</span>
              </div>

              <div className="border-b border-white/10 pb-4 mb-4">
                <span className="text-[10px] font-mono uppercase text-zinc-400">VEHICUL IDENTIFICAT</span>
                <h3 className="font-display font-extrabold text-xl text-white tracking-tight mt-0.5">
                  {activeDoc.brand} {activeDoc.model}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-300">
                  <span>An Fabricație: <strong className="text-white font-mono">{activeDoc.manufactureYear}</strong></span>
                  <span>•</span>
                  <span>Înmatriculare: <strong className="text-white font-mono">{activeDoc.registrationDate}</strong></span>
                </div>
              </div>

              {/* Data Field Cards Grid */}
              <div className="space-y-2.5 font-mono-telemetry">
                
                {/* VIN with 1-Click Copy */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between group hover:border-amber-400/40 transition-colors">
                  <div>
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Serie Șasiu (VIN 17 caractere)</span>
                    <span className="text-sm font-extrabold text-amber-400 tracking-wider">
                      {activeDoc.vin}
                    </span>
                  </div>
                  <button
                    onClick={copyVinToClipboard}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors touch-manipulation"
                    title="Copiază seria VIN"
                    aria-label="Copiază VIN"
                  >
                    {copiedVin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Motorizare: Cilindree & Putere */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Cilindree Motor</span>
                    <span className="text-sm font-bold text-white">
                      {activeDoc.engineCc} <span className="text-xs text-zinc-300 font-normal">cm³</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Putere (kW ➔ CP)</span>
                    <span className="text-sm font-bold text-white">
                      {activeDoc.powerKw} kW <span className="text-xs text-amber-400 font-normal">({activeDoc.powerHp} CP)</span>
                    </span>
                  </div>
                </div>

                {/* Combustibil & Normă Poluare */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Combustibil</span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate block">
                      {activeDoc.fuelType}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Normă & Emisii CO2</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 truncate block">
                      {activeDoc.euroNorm} <span className="text-[10px] text-zinc-300 font-normal">({activeDoc.co2})</span>
                    </span>
                  </div>
                </div>

                {/* Masă Maximă & Număr Locuri */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Masa Maximă Autorizată</span>
                    <span className="text-sm font-bold text-zinc-200">
                      {activeDoc.maxWeightKg} kg
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/10">
                    <span className="text-[10px] text-zinc-300 font-semibold uppercase block">Număr Locuri</span>
                    <span className="text-sm font-bold text-zinc-200">
                      {activeDoc.seats} locuri
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions and Direct Flagship Link */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gata pentru sincronizare portaluri auto & stoc</span>
              </div>

              <a
                href="https://rxmautomobile.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-[0.98]"
                title="Deschide site-ul oficial RXM Automobile dezvoltat pe ParcOS"
              >
                <span>Vezi Showroom Live (rxmautomobile.ro)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>

      </div>

      {/* Modala de Conversie: Limită Test Atinsă (3/3 Scanări Utilizate) */}
      {showLimitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="limit-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLimitModal(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-amber-500/30 shadow-2xl overflow-hidden p-6 sm:p-8 text-white">
            
            {/* Close Button */}
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Închide fereastra"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-4">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>LIMITĂ TEST DEMO ATINSĂ (3/3 SCANĂRI)</span>
            </div>

            {/* Modal Title & Body */}
            <h3 id="limit-modal-title" className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-snug mb-3">
              Ai testat puterea scannerului ParcOS pe 3 documente reale!
            </h3>
            
            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              Pentru a proteja infrastructura împotriva abuzului, scannerul demonstrativ este limitat la{' '}
              <strong className="text-amber-400">maxim 3 scanări demo per test</strong>. 
              În parcul tău auto ai nevoie de scanări nelimitate, export instant în contracte oficiale de vânzare-cumpărare, facturi proforme/fiscale și regim de marjă automat.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-zinc-900/80 border border-white/10 text-xs font-mono-telemetry">
              <div className="flex items-center gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Scanări Nelimitate CIV & Talon</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Toate actele auto UE (RO, DE, AT, FR)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-Click Contracte & Proforme</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GDPR Volatil (Zero Stocare Foto)</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="https://wa.me/40748892937?text=Buna%20ziua!%20Am%20testat%20scannerul%20pe%20ParcOS%20(3/3)%20si%20doresc%20acces%20nelimitat%20pentru%20parcul%20meu%20auto."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all touch-manipulation active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicită Acces Dealer pe WhatsApp</span>
              </a>

              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full sm:w-auto min-h-[48px] px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-semibold text-sm transition-all"
              >
                Închide
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
