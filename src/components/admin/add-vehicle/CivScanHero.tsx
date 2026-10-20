import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Camera, RefreshCw, Globe, UploadCloud, RotateCw, RotateCcw, Trash2, FileText, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { isPdfDocument, processPdfDocument, convertPdfToImage } from '../../../utils/pdfDocumentEngine';
import { useWorkspace } from '../../../context/WorkspaceContext';

export type ScanPresetKey = 'bmw' | 'audi' | 'vw' | 'jeep' | 'volvo' | 'ford' | 'nissan';
export type ScanCountryKey = 'AUTO' | 'DE' | 'AT' | 'FR' | 'IT' | 'RO' | 'OTHER';

export type ScanSource = 
  | { type: 'file'; file: File; rotation: number }
  | { type: 'preset'; presetKey: ScanPresetKey };

interface CivScanHeroProps {
  onScan: (source: ScanSource, country: ScanCountryKey) => void;
  isScanning: boolean;
  scanStep: string;
  scanProgress: number;
  onResetForm?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  summaryText?: string;
  autoScan?: boolean;
}

export const CivScanHero: React.FC<CivScanHeroProps> = ({
  onScan,
  isScanning,
  scanStep,
  scanProgress,
  onResetForm,
  isCollapsed,
  onToggleCollapse,
  summaryText,
  autoScan
}) => {
  const { settings, setAutoScanDocuments } = useWorkspace();
  const effectiveAutoScan = autoScan !== undefined ? autoScan : (settings.autoScanDocuments ?? true);

  const [selectedCountry, setSelectedCountry] = useState<ScanCountryKey>('AUTO');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const countryPresets: Record<ScanCountryKey, { 
    name: string; 
    flag: string; 
    tag: string;
    docName: string; 
    presetKey: ScanPresetKey; 
    carName: string;
    kwToHp: string;
    highlight?: boolean;
  }> = {
    AUTO: {
      name: 'Detecție Automată',
      flag: '✨',
      tag: 'AI AUTO',
      docName: 'Universal UE & SUA (Detectează automat țara & formatul)',
      presetKey: 'volvo',
      carName: 'Volvo XC60 B4 AWD Inscription (Olanda / RDW - 197 CP)',
      kwToHp: 'Clasificare Automată Stemă & Emitent • 145 kW ➔ 197 CP',
      highlight: true
    },
    DE: {
      name: 'Germania',
      flag: '🇩🇪',
      tag: 'DE',
      docName: 'Zulassungsbescheinigung Teil I & II',
      presetKey: 'bmw',
      carName: 'BMW 520d Steptronic (140 kW -> 190 CP)',
      kwToHp: '140 kW × 1.36 = 190.4 CP'
    },
    AT: {
      name: 'Austria',
      flag: '🇦🇹',
      tag: 'AT',
      docName: 'Zulassungsbescheinigung Teil I (Zulassungsschein) & Typenschein',
      presetKey: 'nissan',
      carName: 'Nissan Qashqai 1.5 dCi J11 (Austria • 81 kW ➔ 110 CP • K9K)',
      kwToHp: '81 kW × 1.36 = 110 CP • 1461 cm³ • Euro 5b'
    },
    FR: {
      name: 'Franța',
      flag: '🇫🇷',
      tag: 'FR',
      docName: 'Carte Grise (Certificat d\'Immatriculation)',
      presetKey: 'audi',
      carName: 'Audi A4 Avant S-Line (140 kW -> 190 CP)',
      kwToHp: '140 kW × 1.36 = 190.4 CP'
    },
    IT: {
      name: 'Italia',
      flag: '🇮🇹',
      tag: 'IT',
      docName: 'Carta di Circolazione / Documento Unico',
      presetKey: 'jeep',
      carName: 'Jeep Grand Cherokee Overland (184 kW -> 250 CP)',
      kwToHp: '184 kW × 1.36 = 250.2 CP'
    },
    RO: {
      name: 'România',
      flag: '🇷🇴',
      tag: 'RO',
      docName: 'Carte Identitate CIV & Talon RAR',
      presetKey: 'vw',
      carName: 'VW Tiguan 4Motion Highline (140 kW -> 190 CP)',
      kwToHp: '140 kW × 1.36 = 190.4 CP'
    },
    OTHER: {
      name: 'Orice Altă Țară',
      flag: '🌍',
      tag: 'UE / SUA',
      docName: 'Olanda, Belgia, Elveția, SUA Title etc.',
      presetKey: 'ford',
      carName: 'Ford Mustang GT 5.0 V8 (SUA Title • 450 CP • Mile ➔ Km)',
      kwToHp: 'Mile ➔ Km (× 1.609) / Directiva 1999/37/CE'
    }
  };

  const activePreset = countryPresets[selectedCountry];

  // Curățare URL obiect la demontare sau schimbare fișier
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Suport Clipboard Paste (Ctrl+V) pentru imagini
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isScanning || !e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleSetFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isScanning]);

  const handleSetFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Vă rugăm să încărcați o imagine (JPG, PNG, WebP) sau un document PDF al cărții CIV/Talon.');
      return;
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setRotation(0);

    if (isPdfDocument(file)) {
      setPreviewUrl('pdf-loading');
      // Conversie client-side identică cu AutoLicit (pdfConverter.ts) la rezoluție înaltă 2.0x
      convertPdfToImage(file)
        .then((jpegFile) => {
          const url = URL.createObjectURL(jpegFile);
          setPreviewUrl(url);
          setSelectedFile(jpegFile);
          if (effectiveAutoScan && !isScanning) {
            onScan({ type: 'file', file: jpegFile, rotation: 0 }, selectedCountry);
          }
        })
        .catch((err) => {
          console.warn('[PDF Preview] Nu s-a putut genera imaginea documentului:', err);
          // Încercare secundară prin processPdfDocument
          processPdfDocument(file)
            .then((res) => {
              setPreviewUrl(res.previewDataUrl);
              if (effectiveAutoScan && !isScanning) {
                onScan({ type: 'file', file, rotation: 0 }, selectedCountry);
              }
            })
            .catch(() => {
              setPreviewUrl('pdf-fallback');
              if (effectiveAutoScan && !isScanning) {
                onScan({ type: 'file', file, rotation: 0 }, selectedCountry);
              }
            });
        });
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (effectiveAutoScan && !isScanning) {
        onScan({ type: 'file', file, rotation: 0 }, selectedCountry);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSetFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRotation(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSetFile(e.dataTransfer.files[0]);
    }
  };

  const [fileRequiredNotice, setFileRequiredNotice] = useState(false);

  const handleTriggerScan = async () => {
    if (selectedFile) {
      setFileRequiredNotice(false);
      let fileToScan = selectedFile;
      if (isPdfDocument(selectedFile)) {
        try {
          fileToScan = await convertPdfToImage(selectedFile);
        } catch (err) {
          console.warn('[PDF Converter] Conversie la declanșare scanare eșuată:', err);
        }
      }
      onScan({ type: 'file', file: fileToScan, rotation }, selectedCountry);
    } else {
      // Solicită explicit încărcarea documentului / deschide selectorul de fișiere
      setFileRequiredNotice(true);
      fileInputRef.current?.click();
    }
  };

  if (isCollapsed) {
    return (
      <div className="my-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                Scanare Documente CIV / Talon RAR & UE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold shrink-0 flex items-center gap-1">
                <span>✅</span> Scanat cu succes
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 truncate mt-0.5">
              {summaryText || 'Datele optice au fost aplicate automat în formular. Secțiunea este restrânsă.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Extinde secțiunea pentru a re-scana sau schimba documentul"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Modifică / Re-scanează Acte</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`my-2.5 p-3 sm:p-3.5 rounded-xl border transition-all space-y-2 ${
        isDragOver 
          ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/10' 
          : 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-black/80'
      }`}
    >
      {/* Inputs ascunse pentru Upload și Camera Capture */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={handleFileChange} 
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* STARE 1: NICIUN FIȘIER SELECTAT (Banner Suplu Orizontal Fără Chenar Dublu) */}
      {!selectedFile ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Partea Stângă: Info & Titlu */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 text-left min-w-0 w-full sm:w-auto cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Scanare Rapidă Talon sau CIV
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                  {activePreset.flag} {activePreset.tag}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {effectiveAutoScan 
                  ? 'Trage poza aici sau folosește camera • Datele se extrag automat instant.'
                  : 'Trage poza aici sau folosește camera pentru completare automată a datelor.'}
              </p>
            </div>
          </div>

          {/* Partea Dreaptă: Butoane Acțiune Rapidă */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end flex-wrap">
            {/* Buton Test Rapid Demonstrativ 1-Click Brief */}
            <button
              type="button"
              onClick={() => onScan({ type: 'preset', presetKey: activePreset.presetKey }, selectedCountry)}
              disabled={isScanning}
              className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer shadow-sm"
              title={`Simulează scanarea demonstrativă 1-Click pentru ${activePreset.name}: ${activePreset.carName}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isScanning ? 'Scanare...' : `Demo ${activePreset.flag}`}</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Fă Poză</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none min-h-[38px] px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-manipulation active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Alege Fișier</span>
            </button>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer hidden sm:flex shrink-0"
                title="Restrânge secțiunea"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* STARE 2: DOCUMENT ATAȘAT (Previzualizare Compactă + Buton Scanare Direct) */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            {/* Thumbnail */}
            <div className="relative w-16 h-14 rounded-lg bg-black/80 overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center">
              {previewUrl && previewUrl !== 'pdf-loading' && previewUrl !== 'pdf-fallback' ? (
                <img 
                  src={previewUrl} 
                  alt="Document Scanat" 
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ) : previewUrl === 'pdf-loading' ? (
                <div className="flex flex-col items-center justify-center p-1 text-center">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-[8px] text-zinc-400 font-mono">PDF...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-1 text-center">
                  <FileText className="w-5 h-5 text-rose-400" />
                  <span className="text-[8px] font-bold text-rose-300 font-mono uppercase">PDF</span>
                </div>
              )}
            </div>

            {/* Info Fișier & Acțiuni */}
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isPdfDocument(selectedFile) ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">{selectedFile.name}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono flex items-center gap-2">
                <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                <span className="text-emerald-400 font-semibold">• Gata pentru scanare</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isScanning}
                  className="text-[10px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCw className="w-3 h-3 text-amber-400" />
                  <span>Rotește 90°</span>
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isScanning}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Schimbă fișierul</span>
                </button>
              </div>
            </div>
          </div>

          {/* Buton Declanșare Scanare */}
          <div className="shrink-0 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Procesare Optică în curs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Scanează & Extrage Datele</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bară Discretă Opțiuni Țară & Preseturi & Toggle Auto-Scan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-zinc-400 px-1 pt-1.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer w-fit"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            <span>{showPresets ? 'Ascunde opțiuni țări' : `Format: ${activePreset.name} (Modifică)`}</span>
          </button>

          {/* Toggle Rapid Auto-Scan Documente */}
          <button
            type="button"
            onClick={() => setAutoScanDocuments(!effectiveAutoScan)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border cursor-pointer ${
              effectiveAutoScan
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
            title="Apasă pentru a comuta între scanare automată instant și pornire manuală (configurabil și din Setări Portal)"
          >
            <span>{effectiveAutoScan ? '⚡ Auto-Scan: Activ' : '✋ Auto-Scan: Manual'}</span>
          </button>
        </div>

        <span className="text-[10px] text-zinc-500">
          Suportă Talon RO, DE (Fahrzeugschein), AT (Austria Zulassungsschein), FR, IT, SUA Title • Ctrl+V din clipboard
        </span>
      </div>

      {/* Selector Țară Document (Opțional la cerere) */}
      {showPresets && (
        <div className="pt-2 animate-in fade-in duration-150 border-t border-white/[0.08]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5">
            {(Object.keys(countryPresets) as ScanCountryKey[]).map((key) => {
              const item = countryPresets[key];
              const isSelected = selectedCountry === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isScanning}
                  onClick={() => {
                    setSelectedCountry(key);
                    setShowPresets(false);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{item.flag}</span>
                  <span className="text-xs font-semibold truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Alertă când nu a selectat niciun fișier */}
      {fileRequiredNotice && !selectedFile && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Alege poza cărții mașinii (CIV / Talon) pentru a începe recunoașterea automată.</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded-lg bg-amber-400 text-black font-bold text-[11px] shrink-0"
          >
            Alege
          </button>
        </div>
      )}

      {/* Animație Progres & Pași Tehnici OCR */}
      {isScanning && (
        <div className="mt-2 p-3 rounded-xl bg-black/70 border border-amber-500/40 animate-pulse space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-amber-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              {scanStep}
            </span>
            <span className="font-bold text-white font-mono">{scanProgress}%</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-400 h-1.5 transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-zinc-400 font-mono">
            <div>✓ Format document</div>
            <div>✓ An fabricație</div>
            <div>✓ Putere motor (CP)</div>
            <div>✓ Mascare serie VIN</div>
          </div>
        </div>
      )}
    </div>
  );
};
