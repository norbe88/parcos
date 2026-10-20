import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Check, Crop, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Sparkles, Sliders, AlertCircle, RefreshCw, Move, Grid3X3, Scissors
} from 'lucide-react';
import { cropImage, NormalizedCropArea } from '../../utils/imageEditorEngine';

export type CropAspectRatio = '16:9' | '4:3' | '1:1' | '3:2' | 'free';

interface ImageCropStudioModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  photoIndex: number;
  totalPhotos: number;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
  showToast: (msg: string) => void;
}

export const ImageCropStudioModal: React.FC<ImageCropStudioModalProps> = ({
  isOpen,
  imageSrc,
  photoIndex,
  totalPhotos,
  onClose,
  onApplyCrop,
  showToast
}) => {
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>('16:9');
  const [isProcessing, setIsProcessing] = useState(false);

  // Coordonate normalizate ale zonei de decupare (0.0 .. 1.0)
  const [cropX, setCropX] = useState(0.05);
  const [cropY, setCropY] = useState(0.10);
  const [cropW, setCropW] = useState(0.90);
  const [cropH, setCropH] = useState(0.80);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Recalculează proporția cutiei în funcție de aspect ratio
  const adjustCropForAspect = useCallback((ratio: CropAspectRatio, currentW = 0.85) => {
    let targetRatioVal: number | null = null;
    if (ratio === '16:9') targetRatioVal = 16 / 9;
    if (ratio === '4:3') targetRatioVal = 4 / 3;
    if (ratio === '1:1') targetRatioVal = 1 / 1;
    if (ratio === '3:2') targetRatioVal = 3 / 2;

    if (!targetRatioVal || !imageRef.current) {
      // Liber (freeform)
      setCropW(0.90);
      setCropH(0.80);
      setCropX(0.05);
      setCropY(0.10);
      return;
    }

    const img = imageRef.current;
    const naturalAspect = (img.naturalWidth || 16) / (img.naturalHeight || 9);

    // În coordonate normalizate: (w * natW) / (h * natH) = targetRatioVal
    // => h = (w * natW) / (natH * targetRatioVal) = w * (naturalAspect / targetRatioVal)
    let w = currentW;
    let h = w * (naturalAspect / targetRatioVal);

    if (h > 0.95) {
      h = 0.95;
      w = h * (targetRatioVal / naturalAspect);
    }
    if (w > 0.95) {
      w = 0.95;
      h = w * (naturalAspect / targetRatioVal);
    }

    const x = Math.max(0, (1 - w) / 2);
    const y = Math.max(0, (1 - h) / 2);

    setCropW(Math.min(1, Math.max(0.1, w)));
    setCropH(Math.min(1, Math.max(0.1, h)));
    setCropX(Math.min(1 - w, Math.max(0, x)));
    setCropY(Math.min(1 - h, Math.max(0, y)));
  }, []);

  // Inițializează dimensiunile când se deschide modalul
  useEffect(() => {
    if (isOpen && imageSrc) {
      setAspectRatio('16:9');
      // Așteaptă încărcarea imaginii pentru calculul proporțiilor naturale
      const img = new Image();
      img.onload = () => {
        adjustCropForAspect('16:9');
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc, adjustCropForAspect]);

  if (!isOpen || !imageSrc) return null;

  // Schimbare raport de aspect
  const handleSelectAspect = (ratio: CropAspectRatio) => {
    setAspectRatio(ratio);
    adjustCropForAspect(ratio, cropW);
  };

  // Center crop box
  const handleCenterCrop = () => {
    setCropX((1 - cropW) / 2);
    setCropY((1 - cropH) / 2);
  };

  // Maximize crop box
  const handleMaximizeCrop = () => {
    adjustCropForAspect(aspectRatio, 0.96);
  };

  // Preset dedicat pentru eliminarea bannerului OLX de la baza imaginii (ultimii 25%)
  const handleCutOlxBanner = () => {
    setAspectRatio('free');
    setCropX(0);
    setCropY(0);
    setCropW(1.0);
    setCropH(0.74);
    showToast('✂️ Cadrul a fost setat automat pentru eliminarea bannerului de jos (74% înălțime)!');
  };

  // Mouse / Touch Dragging pe containerul imaginii
  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ x: cropX, y: cropY, w: cropW, h: cropH });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartPos.x) / rect.width;
    const dy = (e.clientY - dragStartPos.y) / rect.height;

    if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(1 - startCrop.w, startCrop.x + dx));
      const newY = Math.max(0, Math.min(1 - startCrop.h, startCrop.y + dy));
      setCropX(newX);
      setCropY(newY);
    } else if (dragMode === 'se') {
      let newW = Math.max(0.1, Math.min(1 - startCrop.x, startCrop.w + dx));
      let newH = Math.max(0.1, Math.min(1 - startCrop.y, startCrop.h + dy));
      if (aspectRatio !== 'free' && imageRef.current) {
        const targetRatioVal = aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '4:3' ? 4 / 3 : aspectRatio === '1:1' ? 1 : 1.5;
        const naturalAspect = (imageRef.current.naturalWidth || 16) / (imageRef.current.naturalHeight || 9);
        newH = newW * (naturalAspect / targetRatioVal);
        if (newH + startCrop.y > 1) {
          newH = 1 - startCrop.y;
          newW = newH * (targetRatioVal / naturalAspect);
        }
      }
      setCropW(newW);
      setCropH(newH);
    } else if (dragMode === 'nw') {
      let newW = Math.max(0.1, startCrop.w - dx);
      let newH = Math.max(0.1, startCrop.h - dy);
      let newX = Math.max(0, startCrop.x + dx);
      let newY = Math.max(0, startCrop.y + dy);

      if (aspectRatio !== 'free' && imageRef.current) {
        const targetRatioVal = aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '4:3' ? 4 / 3 : aspectRatio === '1:1' ? 1 : 1.5;
        const naturalAspect = (imageRef.current.naturalWidth || 16) / (imageRef.current.naturalHeight || 9);
        newH = newW * (naturalAspect / targetRatioVal);
        newY = startCrop.y + (startCrop.h - newH);
      }
      setCropX(newX);
      setCropY(newY);
      setCropW(newW);
      setCropH(newH);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  // Aplicare Decupare
  const handleApply = async () => {
    try {
      setIsProcessing(true);
      const cropArea: NormalizedCropArea = {
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH
      };
      const croppedDataUrl = await cropImage(imageSrc, cropArea);
      onApplyCrop(croppedDataUrl);
      showToast('✓ Fotografie decupată și optimizată cu succes!');
      onClose();
    } catch (err) {
      console.error('Eroare decupare imagine:', err);
      showToast('⚠️ A apărut o eroare la decuparea fotografiei.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className="relative w-full max-w-4xl max-h-[94vh] bg-[#121215] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Antet Studio Crop */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#16161b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Studio Decupare & Încadrare (Crop)
                </h2>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg font-bold">
                  Foto {photoIndex + 1} / {totalPhotos}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Alege proporția optimă de showroom și poziționează cadrul pentru un unghi vizual perfect
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Proporții & Preset-uri */}
        <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Raport:
            </span>

            {[
              { id: '16:9' as CropAspectRatio, label: '16:9 Widescreen (Recomandat)', badge: 'Showroom' },
              { id: '4:3' as CropAspectRatio, label: '4:3 Tradițional', badge: 'Auto' },
              { id: '1:1' as CropAspectRatio, label: '1:1 Pătrat', badge: 'Social' },
              { id: '3:2' as CropAspectRatio, label: '3:2 DSLR', badge: 'Foto' },
              { id: 'free' as CropAspectRatio, label: 'Liber (Freeform)', badge: 'Custom' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectAspect(item.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${aspectRatio === item.id
                    ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                  }`}
              >
                <span>{item.id}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${aspectRatio === item.id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                  }`}>
                  {item.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleCutOlxBanner}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
              title="Elimină automat bannerul de dealer din partea inferioară (decupare la 74% înălțime)"
            >
              <Scissors className="w-3 h-3 text-amber-400" />
              <span>Taie Banner OLX</span>
            </button>
            <button
              type="button"
              onClick={handleCenterCrop}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              title="Centrează cadrul de decupare"
            >
              <Move className="w-3 h-3 text-amber-400" />
              <span>Centrează</span>
            </button>
            <button
              type="button"
              onClick={handleMaximizeCrop}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              title="Extinde cadrul pe toată suprafața disponibilă"
            >
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>Extinde Max</span>
            </button>
          </div>
        </div>

        {/* Viewport Interactiv Decupare */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex items-center justify-center bg-black/60 select-none">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-[58vh] inline-block overflow-hidden rounded-xl border border-white/10 shadow-2xl"
          >
            {/* Imaginea de Bază */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              className="max-w-full max-h-[58vh] object-contain block pointer-events-none"
              onLoad={() => adjustCropForAspect(aspectRatio)}
            />

            {/* Mască Întunecată pentru zonele neincluse în crop */}
            {/* Top mask */}
            <div
              className="absolute left-0 top-0 right-0 bg-black/70 pointer-events-none transition-all duration-75"
              style={{ height: `${cropY * 100}%` }}
            />
            {/* Bottom mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-none transition-all duration-75"
              style={{ top: `${(cropY + cropH) * 100}%` }}
            />
            {/* Left mask */}
            <div
              className="absolute left-0 bg-black/70 pointer-events-none transition-all duration-75"
              style={{
                top: `${cropY * 100}%`,
                height: `${cropH * 100}%`,
                width: `${cropX * 100}%`
              }}
            />
            {/* Right mask */}
            <div
              className="absolute right-0 bg-black/70 pointer-events-none transition-all duration-75"
              style={{
                top: `${cropY * 100}%`,
                height: `${cropH * 100}%`,
                left: `${(cropX + cropW) * 100}%`
              }}
            />

            {/* Cutia Interactivă de Decupare (Active Crop Box) */}
            <div
              className="absolute border-2 border-amber-400 shadow-xl cursor-move group transition-all duration-75"
              style={{
                left: `${cropX * 100}%`,
                top: `${cropY * 100}%`,
                width: `${cropW * 100}%`,
                height: `${cropH * 100}%`
              }}
              onMouseDown={e => handleMouseDown(e, 'move')}
            >
              {/* Ghidaje Regula Treimilor (3x3 Rule of Thirds) */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
                <div className="border-r border-b border-amber-300/40" />
                <div className="border-r border-b border-amber-300/40" />
                <div className="border-b border-amber-300/40" />
                <div className="border-r border-b border-amber-300/40" />
                <div className="border-r border-b border-amber-300/40" />
                <div className="border-b border-amber-300/40" />
                <div className="border-r border-amber-300/40" />
                <div className="border-r border-amber-300/40" />
                <div />
              </div>

              {/* Badge Informație Rezoluție Curentă */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-amber-300 font-mono text-[9px] font-bold pointer-events-none border border-amber-500/30">
                {aspectRatio.toUpperCase()} • {Math.round(cropW * 100)}% lățime
              </div>

              {/* Mânere de Redimensionare la Colțuri (Resize Handles) */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-sm border border-black cursor-nwse-resize"
                onMouseDown={e => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-sm border border-black cursor-nesw-resize"
                onMouseDown={e => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-sm border border-black cursor-nesw-resize"
                onMouseDown={e => handleMouseDown(e, 'sw')}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-sm border border-black cursor-nwse-resize"
                onMouseDown={e => handleMouseDown(e, 'se')}
              />
            </div>
          </div>
        </div>

        {/* Slidere de Precizie Fine-Tuning */}
        <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <span className="text-zinc-400 text-[11px] shrink-0 font-medium">Dimensiune Cadru:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.01"
              value={cropW}
              onChange={e => {
                const val = parseFloat(e.target.value);
                adjustCropForAspect(aspectRatio, val);
              }}
              className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-amber-300 text-[11px] w-9 text-right font-bold">
              {Math.round(cropW * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Trage de colțuri sau mișcă cutia pentru a încadra mașina.</span>
          </div>
        </div>

        {/* Bara de Jos de Salvare */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#16161b]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            Anulează
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Decupare în curs...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Aplică Decuparea (Crop)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
