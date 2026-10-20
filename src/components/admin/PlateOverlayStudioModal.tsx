import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Check, RotateCw, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, 
  Sparkles, Layers, Sliders, Shield, Eye, AlertCircle, RefreshCw, 
  Move, ChevronLeft, ChevronRight, Car, CheckCircle2, Download
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber } from '../../utils/helpers';
import { 
  applyPlateOverlayToImage, 
  loadRxmDealerPlate, 
  getPresetOptions, 
  BumperViewPreset,
  PlateOverlayOptions,
  batchApplyPlateOverlay
} from '../../utils/plateOverlayEngine';

interface PlateOverlayStudioModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  initialPhotoIndex?: number;
  onClose: () => void;
  onSaveImages: (carId: string, updatedImages: string[]) => void;
  showToast: (msg: string) => void;
}

export const PlateOverlayStudioModal: React.FC<PlateOverlayStudioModalProps> = ({
  isOpen,
  car,
  initialPhotoIndex = 0,
  onClose,
  onSaveImages,
  showToast
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Parametrii curenți ai plăcuței
  const [centerX, setCenterX] = useState(0.50);      // 0.0 - 1.0
  const [centerY, setCenterY] = useState(0.72);      // 0.0 - 1.0
  const [widthRatio, setWidthRatio] = useState(0.24); // 0.10 - 0.45
  const [rotationDeg, setRotationDeg] = useState(0);  // -25° la +25°
  const [addShadow, setAddShadow] = useState(true);

  // Stări UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activePreset, setActivePreset] = useState<BumperViewPreset>('front-center');

  const viewportRef = useRef<HTMLDivElement>(null);

  // Inițializare imagini la deschiderea modalului
  useEffect(() => {
    if (isOpen && car) {
      setImages([...(car.images || [])]);
      setCurrentIdx(Math.min(initialPhotoIndex, (car.images || []).length - 1));
      // Reset la poziția optimă implicită
      const defaultOptions = getPresetOptions('front-center');
      setCenterX(defaultOptions.centerX || 0.50);
      setCenterY(defaultOptions.centerY || 0.72);
      setWidthRatio(defaultOptions.widthRatio || 0.24);
      setRotationDeg(defaultOptions.rotationDeg || 0);
      setActivePreset('front-center');
    }
  }, [isOpen, car, initialPhotoIndex]);

  // Ascultător nativ non-pasiv pentru rotița mouse-ului pe viewport (previne scroll-ul paginii și rotește plăcuța fin)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Scroll în sus (deltaY < 0) -> rotire dreapta (+), scroll în jos -> stânga (-)
      const step = e.shiftKey ? 0.2 : 0.5;
      const direction = e.deltaY < 0 ? 1 : -1;
      setRotationDeg(prev => {
        const next = prev + direction * step;
        return Math.max(-25, Math.min(25, Math.round(next * 10) / 10));
      });
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [isOpen]);

  // Ascultător pentru comenzi rapide de la tastatură (Shortcuts Studio)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        setRotationDeg(0);
        showToast('Unghi resetat la 0°');
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsComparing(prev => !prev);
        return;
      }

      const stepPos = e.shiftKey ? 0.02 : 0.005;
      const stepRot = e.shiftKey ? 2 : 0.5;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.altKey) {
          setRotationDeg(prev => Math.max(-25, Math.min(25, Math.round((prev - stepRot) * 10) / 10)));
        } else {
          setCenterX(prev => Math.max(0.05, Math.min(0.95, prev - stepPos)));
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.altKey) {
          setRotationDeg(prev => Math.max(-25, Math.min(25, Math.round((prev + stepRot) * 10) / 10)));
        } else {
          setCenterX(prev => Math.max(0.05, Math.min(0.95, prev + stepPos)));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) {
          setWidthRatio(prev => Math.min(0.50, Math.round((prev + 0.01) * 100) / 100));
        } else {
          setCenterY(prev => Math.max(0.05, Math.min(0.95, prev - stepPos)));
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          setWidthRatio(prev => Math.max(0.10, Math.round((prev - 0.01) * 100) / 100));
        } else {
          setCenterY(prev => Math.max(0.05, Math.min(0.95, prev + stepPos)));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showToast]);

  // Rotire fină cu scroll din mouse (React handler)
  const handleWheelRotate = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const step = e.shiftKey ? 0.2 : 0.5;
    const direction = e.deltaY < 0 ? 1 : -1;
    setRotationDeg(prev => {
      const next = prev + direction * step;
      return Math.max(-25, Math.min(25, Math.round(next * 10) / 10));
    });
  };

  if (!isOpen || !car) return null;

  const stockNum = getStockNumber(car);
  const currentImage = images[currentIdx] || '';
  const originalImage = car.images?.[currentIdx] || '';
  const isImageModified = currentImage !== originalImage;

  // Aplicare preset
  const handleApplyPreset = (preset: BumperViewPreset) => {
    setActivePreset(preset);
    const options = getPresetOptions(preset);
    if (options.centerX !== undefined) setCenterX(options.centerX);
    if (options.centerY !== undefined) setCenterY(options.centerY);
    if (options.widthRatio !== undefined) setWidthRatio(options.widthRatio);
    if (options.rotationDeg !== undefined) setRotationDeg(options.rotationDeg);
  };

  // Click direct pe imagine -> fixează plăcuța exact acolo
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const relX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));

    setCenterX(relX);
    setCenterY(relY);
  };

  // Tracțiune interactivă (Drag & Drop)
  const handleMouseDownPlate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const relX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));

    setCenterX(relX);
    setCenterY(relY);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Ajustare fină coordonate cu butoane (Nudge D-pad)
  const nudge = (dx: number, dy: number) => {
    setCenterX(prev => Math.max(0.05, Math.min(0.95, prev + dx)));
    setCenterY(prev => Math.max(0.05, Math.min(0.95, prev + dy)));
  };

  // 1. Aplicare pe fotografia curentă (Burn into canvas)
  // 1. Aplicare și Salvare Definitivă pe fotografia curentă (Burn + Auto-Save)
  const handleApplyToCurrentPhoto = async (autoSaveToStock = true) => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);
      const burned = await applyPlateOverlayToImage(currentImage, {
        centerX,
        centerY,
        widthRatio,
        rotationDeg,
        addShadow
      });

      const nextImages = [...images];
      nextImages[currentIdx] = burned;
      setImages(nextImages);

      if (autoSaveToStock) {
        onSaveImages(car.id, nextImages);
        showToast(`✓ Plăcuța RXM a fost salvată pe poza #${currentIdx + 1} și actualizată în stoc!`);
      } else {
        showToast(`✓ Plăcuța RXM a fost aplicată pe fotografia #${currentIdx + 1}!`);
      }
    } catch (err) {
      console.error('Eroare aplicare plăcuță:', err);
      showToast('⚠️ A apărut o problemă la aplicarea plăcuței pe această imagine.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Descărcare directă a pozei curente cu plăcuța RXM arsă (JPG oficial pentru dealer)
  const handleDownloadCurrentWithPlate = async () => {
    if (!currentImage) return;

    try {
      setIsProcessing(true);
      const exportedImage = isImageModified 
        ? currentImage 
        : await applyPlateOverlayToImage(currentImage, {
            centerX,
            centerY,
            widthRatio,
            rotationDeg,
            addShadow
          });

      const a = document.createElement('a');
      a.href = exportedImage;
      const cleanBrand = (car.brand || 'RXM').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanModel = (car.model || 'Auto').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `RXM_${cleanBrand}_${cleanModel}_foto_${currentIdx + 1}_placuta.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(`✓ Poza #${currentIdx + 1} cu plăcuța RXM a fost descărcată pe dispozitiv!`);
    } catch (err) {
      console.error('Eroare descărcare poză cu plăcuță:', err);
      showToast('⚠️ Nu s-a putut descărca imaginea.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Aplicare pe toate fotografiile automat (Batch) + Salvare în stoc
  const handleBatchApply = async () => {
    if (!window.confirm(`Doriți să aplicați plăcuța RXM pe toate cele ${images.length} fotografii și să le salvați definitiv în stoc?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const batchResult = await batchApplyPlateOverlay(images, {
        centerX,
        centerY,
        widthRatio,
        rotationDeg,
        addShadow
      });

      setImages(batchResult);
      onSaveImages(car.id, batchResult);
      showToast(`✓ Plăcuța RXM a fost salvată pe toate cele ${images.length} fotografii!`);
    } catch (err) {
      console.error('Eroare aplicare serie plăcuțe:', err);
      showToast('⚠️ A apărut o eroare în timpul procesării imaginilor.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Resetează fotografia curentă la original
  const handleRevertCurrent = () => {
    if (!originalImage) return;
    const nextImages = [...images];
    nextImages[currentIdx] = originalImage;
    setImages(nextImages);
    onSaveImages(car.id, nextImages);
    showToast(`Fotografia #${currentIdx + 1} a fost restaurată la varianta originală.`);
  };

  // 5. Salvare finală în stocul mașinii
  const handleSaveAndClose = () => {
    onSaveImages(car.id, images);
    showToast('✓ Galeria cu plăcuțele RXM a fost salvată definitiv!');
    onClose();
  };

  // Verificare modificări nesalvate la închidere
  const hasChanges = JSON.stringify(images) !== JSON.stringify(car.images || []);
  const handleCloseModal = () => {
    if (hasChanges) {
      if (window.confirm('Ai modificări cu plăcuța RXM în studio. Dorești să le salvezi definitiv în inventar înainte de închidere?')) {
        handleSaveAndClose();
        return;
      }
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onMouseUp={handleMouseUp}
    >
      <div 
        className="w-full max-w-6xl max-h-[96vh] bg-[#121215] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Antet Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Studio Plăcuță RXM — Acoperire Număr Înmatriculare
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs font-semibold">
                  #{stockNum}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {car.year} {car.brand} {car.model} • Suprapune plăcuța oficială de dealer peste numărul existent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Închide studio plăcuță"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corp Principal: Viewport Interactiv (Stânga) + Panou de Control (Dreapta) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          
          {/* Zona 1 (Stânga - 8 coloane): Viewport Canvas & Poza Curentă */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between bg-black/40">
            
            {/* Top Toolbar Viewport: Navigare poze & status */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">
                  Poza <strong className="text-white">{currentIdx + 1}</strong> din <strong className="text-white">{images.length}</strong>
                </span>
                {isImageModified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[11px] border border-emerald-500/30">
                    ✓ Modificată
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Buton Compară cu Originalul */}
                <button
                  type="button"
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/05 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ține apăsat pentru a vizualiza fotografia fără plăcuță"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ține apăsat: Original</span>
                </button>

                {/* Buton Reset Fotografia Curentă */}
                {isImageModified && (
                  <button
                    type="button"
                    onClick={handleRevertCurrent}
                    className="px-2 py-1 rounded-lg text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                  >
                    Restaurare
                  </button>
                )}
              </div>
            </div>

            {/* Viewport Interactiv cu Poziționare Plăcuță */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] bg-black/80 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
              <div 
                ref={viewportRef}
                onClick={handleViewportClick}
                onMouseMove={handleMouseMove}
                onWheel={handleWheelRotate}
                className="relative w-full h-full flex items-center justify-center cursor-crosshair overflow-hidden"
              >
                {/* Imaginea mașinii */}
                <img 
                  src={isComparing ? originalImage : currentImage} 
                  alt="Car preview"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Suprapunerea Plăcuței Interactive (Dacă nu suntem în modul comparație) */}
                {!isComparing && (
                  <div
                    onMouseDown={handleMouseDownPlate}
                    onWheel={handleWheelRotate}
                    style={{
                      position: 'absolute',
                      left: `${centerX * 100}%`,
                      top: `${centerY * 100}%`,
                      width: `${widthRatio * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                    className="group"
                    title="Trage pentru a muta, folosește rotița mouse-ului pentru a roti"
                  >
                    {/* Chenar fin activ de manipulare */}
                    <div className="relative transition-shadow">
                      {/* Suport număr realist */}
                      {addShadow && (
                        <div 
                          className="absolute -inset-[2.5%] rounded-[6px] bg-[#0d0e11] shadow-2xl pointer-events-none"
                          style={{
                            boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.9)'
                          }}
                        />
                      )}
                      
                      {/* Imaginea șablon plăcuță RXM */}
                      <img 
                        src="/images/rxm-dealer-plate.png"
                        alt="RXM Dealer Plate"
                        className="relative w-full h-auto block select-none pointer-events-none rounded-[4px]"
                      />

                      {/* Ghidaj vizual când utilizatorul trece cu mouse-ul peste */}
                      <div className="absolute inset-0 border border-amber-400/50 group-hover:border-amber-400 rounded pointer-events-none transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <Move className="w-4 h-4 text-amber-300 drop-shadow" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notificare instrucțiuni rapide */}
                <div className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-lg bg-black/85 backdrop-blur-md text-[10.5px] text-zinc-300 border border-white/10 pointer-events-none shadow-lg">
                  💡 <strong>Sfat:</strong> Dă click pe număr pentru mutare, trage de plăcuță sau <strong>folosește rotița mouse-ului (Scroll Wheel)</strong> pentru a o roti fin!
                </div>
              </div>
            </div>

            {/* Navigare & Miniaturi Fotografii Mașină (Bara inferioară) */}
            <div className="mt-4 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Selectează Fotografia pentru Editare:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0}
                    className="p-1 rounded-md bg-white/05 hover:bg-white/10 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Poza anterioară"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(prev => Math.min(images.length - 1, prev + 1))}
                    disabled={currentIdx === images.length - 1}
                    className="p-1 rounded-md bg-white/05 hover:bg-white/10 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Poza următoare"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Strip orizontal cu miniaturi */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      currentIdx === i 
                        ? 'border-amber-400 shadow-md shadow-amber-500/20 scale-105' 
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[9px] font-bold text-white">
                      #{i + 1}
                    </span>
                    {img !== car.images?.[i] && (
                      <span className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Zona 2 (Dreapta - 4 coloane): Controale, Preset-uri & Acțiuni */}
          <div className="lg:col-span-4 p-4 sm:p-6 flex flex-col justify-between bg-white/[0.01]">
            <div className="space-y-5">
              
              {/* Secțiune 1: Presets Poziționare Automată */}
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Poziționare Rapidă / Preseturi
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('front-center')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activePreset === 'front-center'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white font-bold'
                        : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">🚗 Bumper Față</div>
                    <div className="text-[10px] text-zinc-400">Centru jos (72%)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('rear-center')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activePreset === 'rear-center'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white font-bold'
                        : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">🚗 Spate / Hayon</div>
                    <div className="text-[10px] text-zinc-400">Centru spate (73%)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('angled-left')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activePreset === 'angled-left'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white font-bold'
                        : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">📐 Unghi Stânga</div>
                    <div className="text-[10px] text-zinc-400">Înclinare -3.8°</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('angled-right')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activePreset === 'angled-right'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white font-bold'
                        : 'bg-white/05 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">📐 Unghi Dreapta</div>
                    <div className="text-[10px] text-zinc-400">Înclinare +3.8°</div>
                  </button>
                </div>
              </div>

              {/* Secțiune 2: Ajustare Dimensiune & Înclinare */}
              <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                
                {/* Slider Lățime / Scală */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-300 font-medium">Lățime Plăcuță:</span>
                    <span className="font-mono text-amber-400 font-bold">{Math.round(widthRatio * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0.12"
                    max="0.45"
                    step="0.01"
                    value={widthRatio}
                    onChange={(e) => setWidthRatio(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>Subțire (12%)</span>
                    <span>Standard (24%)</span>
                    <span>Mare (45%)</span>
                  </div>
                </div>

                {/* Slider Înclinare Unghi */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-300 font-medium">
                      Înclinare / Rotație <span className="text-[10px] text-amber-400 font-normal">(sau Scroll Mouse)</span>:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-amber-400 font-bold">{rotationDeg}°</span>
                      {rotationDeg !== 0 && (
                        <button
                          type="button"
                          onClick={() => setRotationDeg(0)}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-zinc-300 cursor-pointer"
                        >
                          Reset 0°
                        </button>
                      )}
                    </div>
                  </div>
                  <input 
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={rotationDeg}
                    onChange={(e) => setRotationDeg(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>-20° Stânga</span>
                    <span>0° Drept</span>
                    <span>+20° Dreapta</span>
                  </div>
                </div>

                {/* Comutator Umbră & Suport Număr */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/08 cursor-pointer text-xs">
                    <input 
                      type="checkbox"
                      checked={addShadow}
                      onChange={(e) => setAddShadow(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white block">Suport Realist de Număr (Negru)</span>
                      <span className="text-[10px] text-zinc-400 block">Adaugă ramă și umbră de încastrare în bară</span>
                    </div>
                  </label>
                </div>

                {/* D-Pad Micro-Ajustare Pixeli */}
                <div className="pt-1">
                  <span className="text-[11px] text-zinc-400 font-semibold block mb-2">
                    Ajustare Fină Pixeli (Nudge):
                  </span>
                  <div className="grid grid-cols-3 gap-1 max-w-[150px] mx-auto text-xs">
                    <div />
                    <button 
                      type="button"
                      onClick={() => nudge(0, -0.01)}
                      className="p-1.5 rounded-lg bg-white/05 hover:bg-white/15 text-zinc-200 text-center font-bold"
                      title="Sus"
                    >
                      ▲
                    </button>
                    <div />
                    <button 
                      type="button"
                      onClick={() => nudge(-0.01, 0)}
                      className="p-1.5 rounded-lg bg-white/05 hover:bg-white/15 text-zinc-200 text-center font-bold"
                      title="Stânga"
                    >
                      ◀
                    </button>
                    <div className="p-1 flex items-center justify-center text-[10px] text-zinc-500">
                      •
                    </div>
                    <button 
                      type="button"
                      onClick={() => nudge(0.01, 0)}
                      className="p-1.5 rounded-lg bg-white/05 hover:bg-white/15 text-zinc-200 text-center font-bold"
                      title="Dreapta"
                    >
                      ▶
                    </button>
                    <div />
                    <button 
                      type="button"
                      onClick={() => nudge(0, 0.01)}
                      className="p-1.5 rounded-lg bg-white/05 hover:bg-white/15 text-zinc-200 text-center font-bold"
                      title="Jos"
                    >
                      ▼
                    </button>
                    <div />
                  </div>
                </div>

                {/* Shortcut-uri Rapide de Tastatură */}
                <div className="pt-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-400 space-y-1">
                    <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span>⌨️ Taste Rapide Studio:</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-zinc-400">
                      <span><kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-200">Săgeți</kbd> Poziție</span>
                      <span><kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-200">Alt+←/→</kbd> Unghi</span>
                      <span><kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-200">Shift+↑/↓</kbd> Scală</span>
                      <span><kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-200">R</kbd> Reset 0°</span>
                      <span><kbd className="px-1 py-0.2 rounded bg-white/10 text-zinc-200">Space</kbd> Compară</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Secțiune 3: Butoane Principale de Acțiune (Inferior Dreapta) */}
            <div className="pt-5 border-t border-white/[0.08] space-y-2.5">
              
              {/* Buton 1: Aplică & Salvează Definitiv pe fotografia curentă */}
              <button
                type="button"
                onClick={() => handleApplyToCurrentPhoto(true)}
                disabled={isProcessing}
                className="w-full min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Arde plăcuța și salvează imediat fotografia în catalogul mașinii"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Aplică & Salvează pe Poza #{currentIdx + 1}</span>
              </button>

              {/* Buton 2: Descarcă poza curentă cu plăcuța RXM pe disc (Direct Download) */}
              <button
                type="button"
                onClick={handleDownloadCurrentWithPlate}
                disabled={isProcessing}
                className="w-full min-h-[38px] px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-white border border-white/15 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Descarcă fotografia de înaltă rezoluție cu plăcuța RXM pentru încărcare pe OLX / Autovit"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descarcă Poza cu Plăcuța RXM (JPG HD)</span>
              </button>

              {/* Buton 3: Aplică automat pe toate pozele */}
              <button
                type="button"
                onClick={handleBatchApply}
                disabled={isProcessing}
                className="w-full min-h-[38px] px-3 rounded-xl bg-white/05 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Aplică Automat pe Toate Pozele & Salvează</span>
              </button>

              {/* Buton 4: Salvează & Închide */}
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="w-full min-h-[38px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizează & Închide Studio</span>
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
