import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, QrCode, FileText, Download, Loader2, Eye, EyeOff } from 'lucide-react';
import { VehicleItem, SEED_DEALER } from '../../db/seed';
import { PrintableWindowSticker } from '../print/PrintableWindowSticker';
import { 
  getStandardDocumentFileName, 
  printWithDocumentTitle, 
  downloadElementAsPdf 
} from '../../utils/pdfGenerator';

interface WindowStickerModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
}

export const WindowStickerModal: React.FC<WindowStickerModalProps> = ({
  isOpen,
  car,
  onClose,
  showToast,
  dealer = SEED_DEALER
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 🔒 Opțiune afișare Serie Șasiu (VIN) — Implicit: false (ascuns conform cerinței)
  const [showVin, setShowVin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rxm_window_sticker_show_vin');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const handleToggleVin = () => {
    setShowVin(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rxm_window_sticker_show_vin', JSON.stringify(next));
      } catch {
        // ignore
      }
      showToast(next ? '✓ Seria de șasiu (VIN) este acum afișată pe fișă.' : '✓ Seria de șasiu (VIN) este ascunsă de pe fișă.');
      return next;
    });
  };

  const paperRef = useRef<HTMLDivElement>(null);

  // 🔒 Lock background scroll pe body când modalul este deschis și activează clasele dedicate de print
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-window-sticker-open');
    if (orientation === 'landscape') {
      document.body.classList.add('print-landscape');
    } else {
      document.body.classList.remove('print-landscape');
    }

    return () => {
      document.body.style.overflow = orig;
      document.body.classList.remove('has-window-sticker-open', 'print-landscape');
    };
  }, [isOpen, orientation]);

  if (!isOpen || !car) return null;

  // Nomenclatură standardizată oficială
  const currentFileName = getStandardDocumentFileName({
    docType: 'window_sticker',
    brand: car.brand,
    model: car.model,
    stockNumber: car.stockNumber,
    vin: showVin ? car.vin : undefined
  });

  const handlePrint = () => {
    printWithDocumentTitle(currentFileName);
    showToast(`Pregătit pentru print / Salvare PDF: "${currentFileName}.pdf"`);
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setIsDownloading(true);
    showToast(`Se generează fișa de parbriz "${currentFileName}.pdf"...`);
    try {
      await downloadElementAsPdf(paperRef.current, currentFileName, { orientation });
      showToast(`Fișa "${currentFileName}.pdf" a fost descărcată cu succes!`);
    } catch (err) {
      console.error('Download sticker PDF error:', err);
      showToast('Eroare descărcare directă. Deschidem dialogul de salvare ca PDF.');
      printWithDocumentTitle(currentFileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const modalContent = (
    <div className="window-sticker-modal-container fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0.5rem))] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92dvh] sm:max-h-[94vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-3.5 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row gap-3 md:items-center justify-between sticky top-0 bg-[#121215]/95 backdrop-blur-md z-20 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Generator Fișă Parbriz A4 cu QR Code
              </h3>
              <p className="text-xs text-zinc-400">
                Fișă expunere showroom • <span className="text-amber-300 font-semibold">{car.brand} {car.model}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Comutator Orientare */}
            <div className="inline-flex rounded-lg border border-white/10 p-0.5 bg-black/40">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold transition-all touch-manipulation cursor-pointer ${
                  orientation === 'portrait' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Portret (A4)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold transition-all touch-manipulation cursor-pointer ${
                  orientation === 'landscape' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Peisaj (Orizontal)
              </button>
            </div>

            {/* Opțiune Afișare / Ascundere Serie Șasiu (VIN) — Implicit Ascuns */}
            <button
              type="button"
              onClick={handleToggleVin}
              className={`min-h-[36px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all touch-manipulation cursor-pointer ${
                showVin 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm' 
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title={showVin ? 'Seria de șasiu (VIN) este afișată pe fișă. Click pentru a o ascunde.' : 'Seria de șasiu (VIN) este ascunsă (implicit). Click pentru a o afișa.'}
            >
              {showVin ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>VIN: Afișat</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>VIN: Ascuns (Implicit)</span>
                </>
              )}
            </button>

            {/* Buton Descărcare PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="min-h-[44px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer disabled:opacity-60"
              title={`Descarcă fișa de parbriz (${currentFileName}.pdf)`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Se generează...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descarcă PDF</span>
                </>
              )}
            </button>

            {/* Buton Tipărire */}
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
              title={`Tipărește fișa (${currentFileName}.pdf)`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Tipărește</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Închide fișa"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors touch-manipulation active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bară Informare Denumire Fișier Standard */}
        <div className="no-print bg-black/60 border-b border-white/[0.08] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-400 text-[11px]">Denumire fișier standard:</span>
            <span className="font-mono text-amber-300 font-bold truncate max-w-sm sm:max-w-lg">
              {currentFileName}.pdf
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              showVin 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              VIN {showVin ? 'Afișat' : 'Ascuns (Implicit)'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
              A4 {orientation === 'portrait' ? 'Portret' : 'Peisaj'} • QR Code Live
            </span>
          </div>
        </div>

        {/* Zona de previzualizare foaie A4 cu suport touch gesture */}
        <div className="p-3 sm:p-6 bg-zinc-300 flex justify-center items-start overflow-y-auto overflow-x-auto touch-manipulation">
          <div ref={paperRef} className="window-sticker-paper-preview">
            <PrintableWindowSticker car={car} dealer={dealer} orientation={orientation} showVin={showVin} />
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
