import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  RotateCcw, Maximize2, Minimize2, Image as ImageIcon,
  Shield, ShieldCheck
} from 'lucide-react';
import { WatermarkOverlay } from '../../common/WatermarkOverlay';
import { useAntiScreenCapture } from '../../../hooks/useAntiScreenCapture';
import { normalizeCarImageUrl } from '../../../utils/helpers';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  modelTitle: string;
  stockNumber?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  modelTitle,
  stockNumber
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { isShieldActive } = useAntiScreenCapture({ enabled: isOpen, blurOnFocusLoss: false });

  // Touch Pinch-to-Zoom & Horizontal Swipe state
  const initialDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // 🔒 Lock background scroll pe body când modalul este deschis (previne rubber-banding pe iOS)
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Reset zoom & pan when image changes
  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    resetZoomAndPan();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length, resetZoomAndPan]);

  const handleNext = useCallback(() => {
    resetZoomAndPan();
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length, resetZoomAndPan]);

  // Keyboard navigation & Anti-Save Shortcut Interception
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Blocare scurtături salvare pagină / imagine (Standard AutoLicit)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(z + 0.5, 4));
      else if (e.key === '-') setZoomLevel(z => Math.max(z - 0.5, 1));
      else if (e.key === '0') resetZoomAndPan();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, resetZoomAndPan]);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(z => Math.min(z + 0.25, 4));
    } else {
      setZoomLevel(z => {
        const next = Math.max(z - 0.25, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse Drag / Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: initialPanRef.current.x + dx,
      y: initialPanRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for Mobile (Double tap & Pinch-to-zoom)
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getTouchDistance(e.touches);
      initialZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap toggle zoom
        if (zoomLevel > 1) {
          resetZoomAndPan();
        } else {
          setZoomLevel(2.2);
        }
      }
      lastTapRef.current = now;

      if (zoomLevel > 1) {
        setIsDragging(true);
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        initialPanRef.current = { ...panOffset };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current) {
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / initialDistanceRef.current;
      const targetZoom = Math.min(Math.max(initialZoomRef.current * scale, 1), 4);
      setZoomLevel(targetZoom);
      if (targetZoom === 1) setPanOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanOffset({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Gest de navigare prin glisare orizontală (Swipe Left/Right) pe ecran mobil la zoom 1x
    if (zoomLevel === 1 && touchStartXRef.current !== null && touchStartYRef.current !== null && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      // Asigură că este o glisare predominant orizontală (nu scroll vertical accidental)
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        if (deltaX < -40) {
          handleNext();
        } else if (deltaX > 40) {
          handlePrev();
        }
      }
    }

    initialDistanceRef.current = null;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Bar cu Safe Area Padding pentru Notch / Dynamic Island */}
      <div className="z-20 px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 bg-gradient-to-b from-black via-black/80 to-transparent flex items-center justify-between gap-3 text-white border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ImageIcon className="w-4 h-4" />
            </span>
            <span className="font-serif font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
              {modelTitle}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-amber-300 border border-white/10 whitespace-nowrap">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fit / Fill Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
              resetZoomAndPan();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              fitMode === 'contain'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
            }`}
            title={fitMode === 'contain' ? 'Mod Fit (Cadru Complet AutoScout24)' : 'Mod Fill (Umple Ecranul)'}
          >
            {fitMode === 'contain' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{fitMode === 'contain' ? 'Fit (Complet)' : 'Fill (Ecran Plin)'}</span>
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(z - 0.5, 1))}
            disabled={zoomLevel <= 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-white/10 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Indicator & Reset */}
          <button
            type="button"
            onClick={resetZoomAndPan}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 font-mono text-xs font-bold transition-colors flex items-center gap-1"
            title="Resetează Zoom la 100% (Tasta 0)"
          >
            <span>{Math.round(zoomLevel * 100)}%</span>
            {zoomLevel > 1 && <RotateCcw className="w-3 h-3 text-zinc-400" />}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(z + 0.5, 4))}
            disabled={zoomLevel >= 4}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-white/10 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/20 mx-1" />

          {/* Badge Protecție Foto (Standard AutoLicit) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-400 select-none">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Galerie Protejată</span>
          </div>

          <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 text-white transition-colors"
            title="Închide Galeria (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden touch-none select-none"
        onContextMenu={(e) => e.preventDefault()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Ambient Blurred Backdrop for Luxury Framing */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 transition-all duration-500 pointer-events-none"
          style={{ backgroundImage: `url(${normalizeCarImageUrl(images[currentIndex])})` }}
        />

        {/* Main Photo Display cu Protecție Anti-Descărcare */}
        <img
          src={normalizeCarImageUrl(images[currentIndex])}
          alt={`${modelTitle} - Foto ${currentIndex + 1}`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes('/rxm/cars/')) {
              img.src = img.src.replace('/rxm/cars/', '/cars/');
            }
          }}
          className={`max-w-full max-h-full transition-transform duration-100 pointer-events-none select-none ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover w-full h-full'
          }`}
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center'
          }}
        />

        {/* Watermark Oficial RXM Cluj */}
        <WatermarkOverlay variant="lightbox" />

        {/* Treapta 3: Focus-Loss Shield (Snipping Tool & Captură Ecran Defense) */}
        {isShieldActive && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 transition-all duration-200">
            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
              <ShieldCheck className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-amber-300">
              SECURITY SHIELD • GALERIE 4K PROTEJATĂ
            </span>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
              Fotografiile oficiale ale parcului auto sunt protejate conform Legii nr. 8/1996. Reveniți în fereastra browserului pentru a continua vizualizarea.
            </p>
          </div>
        )}

        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95 z-20"
          title="Poză Anterioară (Săgeată Stânga)"
          aria-label="Poză Anterioară"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95 z-20"
          title="Poză Următoare (Săgeată Dreapta)"
          aria-label="Poză Următoare"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Mobile / Desktop Zoom Hint */}
        {zoomLevel === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] text-zinc-400 pointer-events-none backdrop-blur-md hidden sm:block z-20">
            Folosește rotița mouse-ului sau butoanele de zoom pentru detalii 4K • Dublu-click / Pinch pe mobil
          </div>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnails cu Protecție și Safe Area Padding pentru Home Indicator */}
      <div 
        className="z-20 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black via-black/85 to-transparent border-t border-white/[0.08] select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 px-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                resetZoomAndPan();
                setCurrentIndex(idx);
              }}
              className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all select-none ${
                currentIndex === idx
                  ? 'border-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                  : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
              }`}
            >
              <img 
                src={normalizeCarImageUrl(img)} 
                alt={`Thumb ${idx + 1}`} 
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('/rxm/cars/')) {
                    target.src = target.src.replace('/rxm/cars/', '/cars/');
                  }
                }}
                className="w-full h-full object-cover pointer-events-none select-none" 
              />
              {currentIndex === idx && (
                <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
