// =========================================================================
// RXM AUTOMOBILE — Scanner Agentic OCR Buletin / Carte de Identitate (GDPR Compliant)
// Autocompletare automată formular cumpărător pentru proces-verbal și certificat garanție
// Prelucrare exclusiv în memoria RAM (Zero stocare imagini pe server sau local)
// =========================================================================

import React, { useState, useRef } from 'react';
import { 
  ScanLine, Camera, UploadCloud, Sparkles, ShieldCheck, 
  CheckCircle2, AlertCircle, Loader2, RefreshCw, X, FileText, UserCheck
} from 'lucide-react';
import { scanClientIdCardWithGemini, ParsedClientIdDocument } from '../../utils/clientIdOcrEngine';

interface ClientIdOcrScannerProps {
  onSuccess: (data: ParsedClientIdDocument) => void;
  showToast: (msg: string) => void;
}

export const ClientIdOcrScanner: React.FC<ClientIdOcrScannerProps> = ({
  onSuccess,
  showToast
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<ParsedClientIdDocument | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    // Resetare erori anterioare
    setErrorMsg(null);
    setIsScanning(true);
    setScanProgress(10);
    setScanStep('🔒 Inițializare canal securizat GDPR în memorie...');

    try {
      const result = await scanClientIdCardWithGemini(file, (progress, message) => {
        setScanProgress(progress);
        setScanStep(message);
      });

      setLastScannedResult(result);
      onSuccess(result);
      showToast(`✅ Datele lui ${result.fullName} au fost autocompletate cu succes din Buletin!`);
    } catch (err: any) {
      console.error('[ClientIdOcrScanner] Eroare scanare:', err);
      const friendlyError = err?.message || 'Nu s-a putut citi actul de identitate. Verifică claritatea pozei și încearcă din nou.';
      setErrorMsg(friendlyError);
      showToast(`⚠️ Eroare OCR: ${friendlyError}`);
    } finally {
      setIsScanning(false);
      // Curățare input file pentru a permite re-scanare cu același fișier
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Simulare Demo Rapid (pentru showroom / prezentare fără buletin fizic)
  const handleQuickDemo = () => {
    setErrorMsg(null);
    setIsScanning(true);
    setScanProgress(25);
    setScanStep('🔒 Inițializare canal securizat de verificare C.I. Românească...');

    setTimeout(() => {
      setScanProgress(60);
      setScanStep('🔍 Extragere Nume, C.N.P., Serie și Domiciliu din Buletin...');
    }, 450);

    setTimeout(() => {
      setScanProgress(100);
      setScanStep('✅ Completare automată proces-verbal și certificat...');
      
      const demoData: ParsedClientIdDocument = {
        fullName: 'MUREȘAN RADU CONSTANTIN',
        lastName: 'MUREȘAN',
        firstName: 'RADU CONSTANTIN',
        cnp: '1880614125890',
        isCnpValid: true,
        idSeries: 'CJ',
        idNumber: '921458',
        address: 'Str. Aurel Vlaicu nr. 182, Bl. V4, Ap. 28',
        city: 'Cluj-Napoca',
        county: 'Cluj',
        issuingAuthority: 'SPCLEP Cluj-Napoca',
        expiryDate: '14.06.2032',
        confidenceScore: 99,
        docTypeDetected: 'CI_RO_CLASIC'
      };

      setLastScannedResult(demoData);
      onSuccess(demoData);
      setIsScanning(false);
      showToast('✨ Demo: Datele cumpărătorului au fost autocompletate din buletin!');
    }, 900);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border border-amber-500/25 p-3 sm:p-3.5 rounded-xl space-y-2.5 relative overflow-hidden">
      
      {/* Background Accent / Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Scanner */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <ScanLine className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Scanner OCR Buletin / C.I.</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                SCANARE INTELIGENTĂ
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Autocompletare automată date client pentru acte de vânzare
            </div>
          </div>
        </div>

        {/* Badge GDPR Compliance */}
        <div className="hidden sm:flex items-center gap-1 text-[9.5px] text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>GDPR Memorie RAM</span>
        </div>
      </div>

      {/* Butoane Acțiuni Scanare */}
      {!isScanning && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 relative z-10">
          {/* 1. Buton Cameră Foto (Mobil / Tabletă / Laptop) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="py-2 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer touch-manipulation"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fă Poză cu Camera</span>
          </button>

          {/* 2. Buton Încarcă Poză / Document */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-white/10 transition-all active:scale-[0.98] cursor-pointer touch-manipulation"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-300" />
            <span>Încarcă Poză Buletin</span>
          </button>

          {/* 3. Demo Rapid Test */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="py-2 px-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 text-[10.5px] font-medium flex items-center justify-center gap-1 border border-white/5 transition-all cursor-pointer touch-manipulation"
            title="Simulează instant o scanare de buletin pentru testare rapidă"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Simulare Test C.I.</span>
          </button>
        </div>
      )}

      {/* Stare Procesare / Animație Scanare */}
      {isScanning && (
        <div className="p-3 bg-black/60 border border-amber-500/30 rounded-lg space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>{scanStep || 'Se analizează actul de identitate...'}</span>
            </span>
            <span className="font-mono font-bold text-amber-400 text-[11px]">
              {scanProgress}%
            </span>
          </div>

          {/* Bara de progres */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Procesare efemeră în RAM conform GDPR. Imaginea nu este stocată pe server.</span>
          </div>
        </div>
      )}

      {/* Banner Confirmare Succes Extragere */}
      {!isScanning && lastScannedResult && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-2 relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0 text-[11px]">
              <div className="font-bold text-emerald-200 truncate">
                {lastScannedResult.fullName}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono truncate">
                CNP: {lastScannedResult.cnp} • CI: {lastScannedResult.idSeries} {lastScannedResult.idNumber} • {lastScannedResult.county}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLastScannedResult(null)}
            className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-black/40 hover:bg-black/60 border border-white/10 shrink-0 transition-all cursor-pointer"
          >
            Rescanează
          </button>
        </div>
      )}

      {/* Afișare Eroare dacă scanarea eșuează */}
      {!isScanning && errorMsg && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 relative z-10 text-[11px] text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-200">Eroare recunoaștere document:</div>
            <div className="text-[10.5px] text-red-300/90">{errorMsg}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-zinc-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer GDPR explicativ */}
      <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-0.5 border-t border-white/[0.04]">
        <span>Format suportat: C.I. Românească (Clasic/Nou), Pașaport</span>
        <span className="text-zinc-400">Zero stocare • 100% Volatil</span>
      </div>

      {/* Input-uri Ascunse pentru Fișiere */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
};
