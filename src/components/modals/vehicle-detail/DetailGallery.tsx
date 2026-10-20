import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, ZoomIn, Eye, ShieldCheck, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { WatermarkOverlay } from '../../common/WatermarkOverlay';
import { useAntiScreenCapture } from '../../../hooks/useAntiScreenCapture';
import { normalizeCarImageUrl } from '../../../utils/helpers';

interface DetailGalleryProps {
  images: string[];
  model: string;
  activeImageIdx: number;
  setActiveImageIdx: (idx: number) => void;
  stockNumber?: string;
}

export const DetailGallery: React.FC<DetailGalleryProps> = ({
  images,
  model,
  activeImageIdx,
  setActiveImageIdx,
  stockNumber
}) => {
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { isShieldActive } = useAntiScreenCapture({ enabled: true, blurOnFocusLoss: false });

  const filmstripRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // 🛡️ Mașină În Pregătire (Fără fotografii încărcate)
  if (!images || images.length === 0) {
    return (
      <div className="my-2.5 sm:my-5">
        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-[#121215] via-[#16161a] to-[#09090b] border border-amber-500/20 relative flex flex-col items-center justify-center text-center p-6 shadow-2xl">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse" />
          </div>
          <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-amber-400 mb-1">
            Sosit Recent în Parc
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
            Autovehicul în Curs de Pregătire
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
            Acest autovehicul se află în procedura de igienizare cosmetică (detailing) și verificare tehnică. Datele tehnice și fișa A4 de parbriz sunt 100% disponibile.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            {stockNumber && <span>STOC #{stockNumber}</span>}
            {stockNumber && <span>•</span>}
            <span className="text-amber-400 font-semibold">Fișă Parbriz A4 Activă</span>
          </div>
        </div>
      </div>
    );
  }

  // Navigare circulară la fotografia anterioară
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImageIdx(activeImageIdx > 0 ? activeImageIdx - 1 : images.length - 1);
  }, [activeImageIdx, images.length, setActiveImageIdx]);

  // Navigare circulară la fotografia următoare
  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImageIdx(activeImageIdx < images.length - 1 ? activeImageIdx + 1 : 0);
  }, [activeImageIdx, images.length, setActiveImageIdx]);

  // ⌨️ Navigare tastatură (ArrowLeft / ArrowRight) direct în modal, fără click pe poză
  useEffect(() => {
    // Dacă lightbox-ul complet este deschis, suspendăm ascultarea (are propriul listener)
    if (isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoră scurtăturile dacă utilizatorul completează un câmp de formular
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
          return;
        }
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // 🎞️ Auto-scroll în filmstrip pentru a menține thumbnail-ul activ vizibil
  useEffect(() => {
    if (filmstripRef.current) {
      const activeButton = filmstripRef.current.children[activeImageIdx] as HTMLElement | undefined;
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeImageIdx]);

  // 📱 Gesturi de glisare tactilă (Touch Swipe Left/Right)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && touchStartYRef.current !== null && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

      // Gest orizontal valid: deplasare orizontală > 40px și unghi predominant orizontal
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (deltaX < -40) {
          handleNext();
        } else if (deltaX > 40) {
          handlePrev();
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <div className="my-2.5 sm:my-5">
      {/* Container Principal Poză Mare cu Protecție Anti-Salvare & Suport Swipe */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="aspect-[16/10] rounded-xl overflow-hidden bg-black border border-white/10 relative group cursor-pointer select-none shadow-2xl touch-pan-y"
      >
        {/* Ambient Glow din fundal când e în mod contain */}
        {fitMode === 'contain' && (
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-30 scale-110 pointer-events-none"
            style={{ backgroundImage: `url(${normalizeCarImageUrl(images[activeImageIdx])})` }}
          />
        )}

        <img 
          key={activeImageIdx}
          src={normalizeCarImageUrl(images[activeImageIdx])} 
          alt={`${model} - Fotografia ${activeImageIdx + 1}`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes('/rxm/cars/')) {
              img.src = img.src.replace('/rxm/cars/', '/cars/');
            }
          }}
          className={`w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-[1.02] pointer-events-none select-none ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />

        {/* Butoane Navigație Rapidă Chevrons (Stânga & Dreapta) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Fotografia anterioară (Săgeată Stânga)"
              title="Fotografia anterioară (←)"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-xl touch-manipulation cursor-pointer focus:opacity-100 focus:outline-none"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Fotografia următoare (Săgeată Dreapta)"
              title="Fotografia următoare (→)"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-xl touch-manipulation cursor-pointer focus:opacity-100 focus:outline-none"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </>
        )}

        {/* Watermark Oficial RXM Cluj */}
        <WatermarkOverlay variant="gallery" />

        {/* Treapta 3: Focus-Loss Shield (Snipping Tool & Captură Ecran Defense) */}
        {isShieldActive && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-4 transition-all duration-200">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 mb-2">
              <ShieldCheck className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
              RXM SECURITY SHIELD • GALERIE PROTEJATĂ
            </span>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Fotografiile sunt protejate conform Legii nr. 8/1996. Reveniți în pagină pentru vizualizare completă.
            </p>
          </div>
        )}

        {/* Strat Invizibil de Protecție Anti-Descărcare & Anti-Drag */}
        <div 
          className="absolute inset-0 z-15 select-none" 
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Hover Overlay Hint */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
          <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-xl">
            <ZoomIn className="w-4 h-4 text-amber-400" />
            <span>Deschide Galerie Fullscreen 4K (Zoom / Pinch)</span>
          </span>
        </div>

        {/* Top Controls: Toggle Fit / Fill & Fullscreen */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5"
        >
          {/* Buton Fit / Fill (AutoScout24 standard) */}
          <button
            type="button"
            onClick={() => setFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md border transition-all flex items-center gap-1 shadow-lg ${
              fitMode === 'contain'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-black/70 border-white/20 text-white hover:bg-black/90'
            }`}
            title={fitMode === 'contain' ? 'Mod Fit: imagine completă fără decupaj' : 'Mod Fill: umple complet rama'}
          >
            {fitMode === 'contain' ? <Minimize2 className="w-3 h-3 text-amber-400" /> : <Maximize2 className="w-3 h-3" />}
            <span>{fitMode === 'contain' ? 'Fit (Complet)' : 'Fill (Plin)'}</span>
          </button>

          {/* Buton Fullscreen Lightbox */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="p-1.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md transition-colors"
            title="Deschide în ecran complet"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicator Număr Fotografii */}
        <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 z-30 px-2.5 sm:px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] sm:text-xs font-mono font-semibold border border-white/15 text-white shadow-lg pointer-events-none">
          Foto {activeImageIdx + 1} / {images.length}
        </div>

        {/* Badge Detalii HD */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 z-30 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] text-amber-300 font-medium flex items-center gap-1.5 shadow-lg pointer-events-none">
          <Eye className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Click pentru detalii HD</span>
          <span className="sm:hidden">Detalii HD</span>
        </div>
      </div>

      {/* Thumbnails Filmstrip cu Protecție & Auto-Scroll */}
      <div 
        ref={filmstripRef}
        className="flex gap-2 overflow-x-auto mt-2.5 sm:mt-3 pb-1 select-none scrollbar-none touch-pan-x -mx-1 px-1"
      >
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Selectează fotografia ${idx + 1} din ${images.length}`}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveImageIdx(idx);
            }}
            className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all select-none cursor-pointer touch-manipulation bg-zinc-900 ${
              activeImageIdx === idx 
                ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' 
                : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
            }`}
          >
            <img 
              src={normalizeCarImageUrl(img)} 
              alt={`thumbnail-${idx + 1}`} 
              draggable={false}
              loading="lazy"
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes('/rxm/cars/')) {
                  target.src = target.src.replace('/rxm/cars/', '/cars/');
                }
              }}
              className="w-full h-full object-cover pointer-events-none select-none" 
            />
          </button>
        ))}
      </div>

      {/* Lightbox Fullscreen Modal */}
      <PhotoLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={activeImageIdx}
        modelTitle={model}
        stockNumber={stockNumber}
      />
    </div>
  );
};

