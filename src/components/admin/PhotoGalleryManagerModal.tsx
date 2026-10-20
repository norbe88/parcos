import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Images, RotateCw, RotateCcw, Star, Trash2, ChevronLeft, ChevronRight, 
  Upload, Check, Loader2, Plus, AlertCircle, RefreshCw, Eye, Shield, Sparkles,
  Crop, CheckSquare, Square, Undo2, GripVertical, CheckCircle2
} from 'lucide-react';
import { VehicleItem } from '../../db/seed';
import { getStockNumber } from '../../utils/helpers';
import { rotateImage, readFileAsDataUrl, moveItemInArray } from '../../utils/imageEditorEngine';
import { PlateOverlayStudioModal } from './PlateOverlayStudioModal';
import { ImageCropStudioModal } from './ImageCropStudioModal';
import { WatermarkStudioModal } from './WatermarkStudioModal';

interface PhotoGalleryManagerModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSaveImages: (carId: string, updatedImages: string[]) => void;
  showToast: (msg: string) => void;
  onStatusChange?: (carId: string, status: 'in_stock' | 'reserved' | 'sold' | 'preparing', soldPriceEur?: number, soldAt?: string) => void;
}

export const PhotoGalleryManagerModal: React.FC<PhotoGalleryManagerModalProps> = ({
  isOpen,
  car,
  onClose,
  onSaveImages,
  showToast,
  onStatusChange
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Previzualizare Lightbox
  const [previewImageIdx, setPreviewImageIdx] = useState<number | null>(null);

  // Studio Plăcuță RXM
  const [plateStudioIdx, setPlateStudioIdx] = useState<number | null>(null);
  const [isPlateStudioOpen, setIsPlateStudioOpen] = useState(false);

  // Studio Decupare (Crop)
  const [cropPhotoIdx, setCropPhotoIdx] = useState<number | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Studio Watermark Siglă Firmă (Facebook, Autovit, OLX)
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);

  // Mod Selecție Multiplă pentru Ștergere în Masă
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Drag & Drop Reordonare
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  // Undo istoric pentru ștergere
  const [lastDeletedItem, setLastDeletedItem] = useState<{ image: string; index: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizează imaginile când se deschide modalul
  useEffect(() => {
    if (isOpen && car) {
      setImages([...(car.images || [])]);
      setProcessingIdx(null);
      setPreviewImageIdx(null);
      setIsSelectMode(false);
      setSelectedIndices([]);
      setLastDeletedItem(null);
      setDraggedIdx(null);
      setDragOverIdx(null);
      isDraggingRef.current = false;
    }
  }, [isOpen, car]);

  if (!isOpen || !car) return null;

  const stockNum = getStockNumber(car);
  const hasChanges = JSON.stringify(images) !== JSON.stringify(car.images || []);

  // 1. Rotește imaginea la 90 grade în sens orar (+90) sau trigonometric (-90)
  const handleRotate = async (idx: number, degrees: 90 | -90 = 90) => {
    try {
      setProcessingIdx(idx);
      const rotated = await rotateImage(images[idx], degrees);
      setImages(prev => {
        const next = [...prev];
        next[idx] = rotated;
        return next;
      });
      showToast(degrees === 90 ? '✓ Fotografie rotită la dreapta (90°)!' : '✓ Fotografie rotită la stânga (-90°)!');
    } catch (err) {
      console.error('Eroare la rotirea imaginii:', err);
      showToast('⚠️ Eroare la rotirea imaginii. Verifică fișierul sursă.');
    } finally {
      setProcessingIdx(null);
    }
  };

  // 2. Setează ca imagine principală (Copertă -> index 0)
  const handleSetCover = (idx: number) => {
    if (idx === 0) return;
    setImages(prev => moveItemInArray(prev, idx, 0));
    showToast('⭐ Imaginea a fost setată ca poză principală de copertă!');
  };

  // 3. Mută la stânga / dreapta
  const handleMove = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    setImages(prev => moveItemInArray(prev, fromIdx, toIdx));
  };

  // 4. Drag & Drop Reordering Handlers (Desktop Mouse & Touch Support)
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (isSelectMode) return;
    isDraggingRef.current = true;
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${idx}`);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 150);
      return;
    }

    setImages(prev => moveItemInArray(prev, draggedIdx, targetIdx));
    if (targetIdx === 0) {
      showToast(`⭐ Fotografia a fost mutată pe poziția #1 și a devenit Copertă Showroom!`);
    } else {
      showToast(`✓ Fotografia a fost mutată pe poziția #${targetIdx + 1}!`);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  // Suport Touch Drag pentru Tablete / Telefoane / Touchscreen
  const handleTouchStart = (idx: number) => {
    if (isSelectMode) return;
    isDraggingRef.current = true;
    setDraggedIdx(idx);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIdx === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = targetEl?.closest('[data-photo-idx]');
    if (cardEl) {
      const targetIdx = Number(cardEl.getAttribute('data-photo-idx'));
      if (!isNaN(targetIdx) && targetIdx !== dragOverIdx) {
        setDragOverIdx(targetIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      setImages(prev => moveItemInArray(prev, draggedIdx, dragOverIdx));
      if (dragOverIdx === 0) {
        showToast(`⭐ Fotografia a fost mutată pe poziția #1 și a devenit Copertă Showroom!`);
      } else {
        showToast(`✓ Fotografia a fost mutată pe poziția #${dragOverIdx + 1}!`);
      }
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  // 5. Șterge o singură imagine (rapid și cu suport Undo)
  const handleDeleteSingle = (idx: number) => {
    if (images.length <= 1) {
      showToast('⚠️ Galeria trebuie să conțină cel puțin o fotografie!');
      return;
    }

    const removed = images[idx];
    setLastDeletedItem({ image: removed, index: idx });

    setImages(prev => prev.filter((_, i) => i !== idx));
    showToast(`✓ Fotografia #${idx + 1} a fost ștearsă.`);

    // Ajustează preview lightbox dacă e deschis
    if (previewImageIdx !== null) {
      if (previewImageIdx >= images.length - 1) {
        setPreviewImageIdx(Math.max(0, images.length - 2));
      }
    }
  };

  // Anulare ștergere (Undo)
  const handleUndoDelete = () => {
    if (!lastDeletedItem) return;
    setImages(prev => {
      const next = [...prev];
      next.splice(lastDeletedItem.index, 0, lastDeletedItem.image);
      return next;
    });
    showToast('✓ Fotografia ștearsă a fost restaurată!');
    setLastDeletedItem(null);
  };

  // 6. Selecție Multiplă și Ștergere în Masă
  const toggleSelectPhoto = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === images.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(images.map((_, i) => i));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    if (selectedIndices.length >= images.length) {
      showToast('⚠️ Galeria trebuie să conțină cel puțin o fotografie! Nu poți șterge toate fotografiile.');
      return;
    }

    const count = selectedIndices.length;
    setImages(prev => prev.filter((_, i) => !selectedIndices.includes(i)));
    setSelectedIndices([]);
    setIsSelectMode(false);
    showToast(`✓ Au fost eliminate ${count} fotografii selectate!`);
  };

  // 7. Deschide Studio Decupare (Crop)
  const handleOpenCrop = (idx: number) => {
    setCropPhotoIdx(idx);
    setIsCropModalOpen(true);
  };

  // Aplicare rezultat decupare
  const handleApplyCropped = (croppedDataUrl: string) => {
    if (cropPhotoIdx === null) return;
    setImages(prev => {
      const next = [...prev];
      next[cropPhotoIdx] = croppedDataUrl;
      return next;
    });
    setIsCropModalOpen(false);
  };

  // 8. Deschide Studio Plăcuță RXM
  const handleOpenPlateStudio = (idx: number) => {
    setPlateStudioIdx(idx);
    setIsPlateStudioOpen(true);
  };

  // 9. Adaugă fotografii noi din fișiere locale
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataUrl(file);
          newPhotos.push(dataUrl);
        }
      }

      if (newPhotos.length > 0) {
        setImages(prev => [...prev, ...newPhotos]);
        showToast(`✓ Au fost adăugate ${newPhotos.length} fotografii noi în galerie!`);
      }
    } catch (err) {
      console.error('Eroare la încărcarea fotografiilor:', err);
      showToast('⚠️ A apărut o problemă la citirea fișierelor selectate.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 10. Salvează galeria actualizată
  const handleSave = () => {
    onSaveImages(car.id, images);
    onClose();
  };

  // 11. Resetează la starea inițială
  const handleReset = () => {
    if (window.confirm('Sigur dorești să anulezi toate modificările nesalvate ale galeriei?')) {
      setImages([...(car.images || [])]);
      setSelectedIndices([]);
      setIsSelectMode(false);
      setLastDeletedItem(null);
      showToast('Galeria a fost resetată la starea inițială.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#121215] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 isolate"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Antet Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#16161b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Studio Editare Foto & Plăcuțe • {car.brand} {car.model}
                </h2>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg font-bold">
                  #{stockNum}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {images.length} {images.length === 1 ? 'fotografie' : 'fotografii'} • Decupează (Crop), rotește, șterge rapid, reordonează sau aplică plăcuțe RXM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Închide fereastra"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notificare de Undo după ștergere */}
        {lastDeletedItem && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs text-rose-300">
              <Trash2 className="w-4 h-4 shrink-0 text-rose-400" />
              <span>O fotografie a fost eliminată din galerie.</span>
            </div>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/40"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Anulează Ștergerea (Undo)</span>
            </button>
          </div>
        )}

        {/* Zonă de Acțiuni Rapide de Sus */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              Trage fotografiile pentru a schimba ordinea. Folosește butoanele de pe fiecare card pentru Crop, Rotire sau Plăcuță.
            </span>
            <span className="sm:hidden">
              Trage pentru reordonare sau editează fiecare poză.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Buton Activare Mod Ștergere Multiplă */}
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIndices([]);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelectMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
              }`}
              title="Selectează mai multe fotografii pentru ștergere în masă"
            >
              {isSelectMode ? <CheckSquare className="w-3.5 h-3.5 text-rose-400" /> : <Square className="w-3.5 h-3.5" />}
              <span>{isSelectMode ? 'Ieși din Selecție' : 'Selecție Multiplă'}</span>
            </button>

            {/* Butoane când modul de selecție e activ */}
            {isSelectMode && (
              <>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-medium cursor-pointer"
                >
                  {selectedIndices.length === images.length ? 'Deselectează Tot' : 'Selectează Tot'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedIndices.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Șterge ({selectedIndices.length})</span>
                </button>
              </>
            )}

            {/* Buton Studio Plăcuță RXM (Acoperă număr existent) */}
            <button
              type="button"
              onClick={() => {
                setPlateStudioIdx(0);
                setIsPlateStudioOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Deschide studioul de acoperire numere cu plăcuța oficială de dealer RXM Automobile"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Plăcuță RXM</span>
            </button>

            {/* Buton Studio Watermark Siglă Firmă (Facebook, Autovit, OLX) */}
            <button
              type="button"
              onClick={() => setIsWatermarkOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-emerald-600/20 to-amber-500/20 hover:from-blue-600/30 hover:to-amber-500/30 text-white border border-white/20 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Aplică sigla oficială RXM / firmă pe fotografii pentru Facebook, Autovit și OLX"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Watermark Logo Firmă</span>
            </button>

            {/* Input fișiere ascuns */}
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFilesSelected} 
              className="hidden" 
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-amber-500/20 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Încărcare...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adaugă Poze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Corp Principal: Grid Fotografii */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {images.map((imgSrc, idx) => {
              const isCover = idx === 0;
              const isProcessing = processingIdx === idx;
              const isSelected = selectedIndices.includes(idx);
              const isDropTarget = dragOverIdx === idx;
              const isBeingDragged = draggedIdx === idx;

              return (
                <div 
                  key={`photo_card_${idx}_${imgSrc.slice(-20)}`}
                  data-photo-idx={idx}
                  draggable={!isSelectMode}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, idx)}
                  onTouchStart={() => handleTouchStart(idx)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`group relative bg-[#18181d] rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                    !isSelectMode ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${
                    isDropTarget && !isBeingDragged 
                      ? 'border-amber-400 scale-[1.02] shadow-2xl ring-2 ring-amber-400/70 z-20' 
                      : ''
                  } ${
                    isBeingDragged ? 'opacity-30 scale-95 border-amber-500/50' : ''
                  } ${
                    isSelected 
                      ? 'border-rose-400/80 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10' 
                      : isCover 
                        ? 'border-amber-400/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40' 
                        : 'border-white/10 hover:border-white/25 hover:shadow-md'
                  }`}
                >
                  {/* Indicator vizual animat când este țintă de drop */}
                  {isDropTarget && !isBeingDragged && (
                    <div className="absolute inset-0 z-30 bg-amber-500/15 border-2 border-amber-400 rounded-2xl flex items-center justify-center pointer-events-none backdrop-blur-[1px] animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 rounded-xl bg-black/90 border border-amber-400 text-amber-300 font-extrabold text-xs shadow-2xl flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Plasează pe poziția #{idx + 1}</span>
                      </div>
                    </div>
                  )}

                  {/* Container Imagine */}
                  <div 
                    className="relative aspect-[16/10] bg-black/60 overflow-hidden cursor-pointer select-none"
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      if (isSelectMode) {
                        toggleSelectPhoto(idx);
                      } else {
                        setPreviewImageIdx(idx);
                      }
                    }}
                  >
                    <img 
                      src={imgSrc} 
                      alt={`Foto ${idx + 1}`} 
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
                    />

                    {/* Gradient protector pentru badge-uri */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

                    {/* Badge Copertă / Număr & Mâner Drag */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      {isSelectMode ? (
                        <div 
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-rose-500 text-white' : 'bg-black/60 border border-white/20 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : isCover ? (
                        <span 
                          className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] flex items-center gap-1 shadow-md cursor-grab active:cursor-grabbing select-none"
                          title="Copertă Showroom • Trage pentru a schimba ordinea"
                        >
                          <Star className="w-3 h-3 fill-black" />
                          <span>Copertă Showroom</span>
                          <GripVertical className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </span>
                      ) : (
                        <span 
                          className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-zinc-300 font-mono text-[10px] font-semibold border border-white/15 flex items-center gap-1 cursor-grab active:cursor-grabbing hover:border-amber-400/50 hover:text-white transition-colors select-none"
                          title="Trage pentru a reordona poziția"
                        >
                          <GripVertical className="w-3 h-3 text-amber-400" />
                          <span>#{idx + 1}</span>
                        </span>
                      )}
                    </div>

                    {/* Acțiuni Rapide de Colț Dreapta Sus: Previzualizare & Ștergere Rapidă 1-Click */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10" onClick={e => e.stopPropagation()}>
                      {/* Buton Ștergere Rapidă din Colț */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(idx)}
                        disabled={images.length <= 1 || isProcessing}
                        className="w-7 h-7 rounded-lg bg-black/70 hover:bg-rose-600 text-zinc-300 hover:text-white border border-white/15 hover:border-rose-500 flex items-center justify-center transition-all cursor-pointer opacity-85 group-hover:opacity-100 shadow-sm"
                        title="Șterge această fotografie din galerie"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Buton Previzualizare */}
                      <button
                        type="button"
                        onClick={() => setPreviewImageIdx(idx)}
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                        title="Previzualizează la dimensiune mare"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Overlay de procesare (Spinner) */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-amber-300 z-20 animate-in fade-in">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                        <span className="text-[11px] font-semibold">Procesare imagine...</span>
                      </div>
                    )}
                  </div>

                  {/* Bara de Acțiuni Inferioară pe fiecare card: Crop, Rotire, Plăcuță, Copertă */}
                  <div className="p-2 bg-[#141418] border-t border-white/05 flex flex-col gap-1.5">
                    
                    {/* Rândul 1: Decupare (Crop), Rotește, Plăcuță */}
                    <div className="flex items-center gap-1">
                      {/* Buton Decupează (Crop) */}
                      <button
                        type="button"
                        onClick={() => handleOpenCrop(idx)}
                        disabled={isProcessing}
                        className="flex-1 min-h-[29px] px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Deschide studioul de decupare și încadrare 16:9 / 4:3 (Crop)"
                      >
                        <Crop className="w-3 h-3 text-amber-400" />
                        <span>Crop</span>
                      </button>

                      {/* Buton Rotește 90° Orar */}
                      <button
                        type="button"
                        onClick={() => handleRotate(idx, 90)}
                        disabled={isProcessing}
                        className="w-8 min-h-[29px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Rotește fotografia cu 90° în sens orar"
                      >
                        <RotateCw className="w-3 h-3 text-amber-400" />
                      </button>

                      {/* Buton Rotește 90° Antiorar */}
                      <button
                        type="button"
                        onClick={() => handleRotate(idx, -90)}
                        disabled={isProcessing}
                        className="w-8 min-h-[29px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Rotește fotografia cu 90° în sens antiorar"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                      </button>

                      {/* Buton Plăcuță RXM */}
                      <button
                        type="button"
                        onClick={() => handleOpenPlateStudio(idx)}
                        disabled={isProcessing}
                        className="flex-1 min-h-[29px] px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Acoperă numărul de înmatriculare cu plăcuța dealer RXM Automobile"
                      >
                        <Shield className="w-3 h-3 text-purple-400" />
                        <span>Plăcuță</span>
                      </button>
                    </div>

                    {/* Rândul 2: Copertă & Reordonare Stânga/Dreapta */}
                    <div className="flex items-center justify-between gap-1">
                      {/* Buton Setează ca Poză Copertă */}
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          disabled={isProcessing}
                          className="flex-1 min-h-[26px] px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Mută această imagine pe poziția 1 ca poză principală de copertă"
                        >
                          <Star className="w-2.5 h-2.5 text-amber-400" />
                          <span>Fă Copertă</span>
                        </button>
                      ) : (
                        <span className="flex-1 text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1 py-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-400" />
                          <span>Copertă Activă</span>
                        </span>
                      )}

                      {/* Butoane Reordonare Ordine (Stânga / Dreapta) */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx - 1)}
                          disabled={idx === 0 || isProcessing}
                          className="w-7 h-[26px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                          title="Mută mai la stânga în galerie"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx + 1)}
                          disabled={idx === images.length - 1 || isProcessing}
                          className="w-7 h-[26px] rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                          title="Mută mai la dreapta în galerie"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Card Suplimentar: Dropzone Rapid de Adăugare */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[16/10] rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/50 hover:bg-amber-500/[0.03] transition-all flex flex-col items-center justify-center gap-2 text-center p-4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-amber-500/10 text-zinc-400 group-hover:text-amber-400 border border-white/10 group-hover:border-amber-500/30 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200 group-hover:text-white">Adaugă Fotografii</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">JPEG, PNG, HEIC, WebP</div>
              </div>
            </div>

          </div>
        </div>

        {/* Bara de Jos cu Butoane de Salvare & Anulare */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-[#16161b] flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Anulează Modificările</span>
              </button>
            )}
            <span className="text-xs text-zinc-400">
              {hasChanges ? 'Ai modificări nesalvate în galerie' : 'Toate fotografiile sunt sincronizate'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              Închide
            </button>

            {car?.status === 'preparing' && images.length > 0 && onStatusChange && (
              <button
                type="button"
                onClick={() => {
                  onSaveImages(car.id, images);
                  onStatusChange(car.id, 'in_stock');
                  onClose();
                  showToast(`🚀 Galeria a fost salvată și mașina ${car.brand} ${car.model} a fost publicată în Showroom!`);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer"
                title="Salvează fotografiile și promovează mașina direct în statusul 'În Stoc' (publică în showroom)"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Salvează & Publică în Showroom!</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvează Galeria ({images.length} poze)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal Lightbox de Previzualizare Detaliată cu Butoane de Editare / Ștergere Directă */}
      {previewImageIdx !== null && images[previewImageIdx] && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-between p-4"
          onClick={() => setPreviewImageIdx(null)}
        >
          {/* Header Lightbox cu acțiuni rapide */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between text-white z-10 py-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-amber-300 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                Foto {previewImageIdx + 1} din {images.length}
              </span>
              {previewImageIdx === 0 && (
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> Copertă
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Buton Crop direct din Lightbox */}
              <button
                type="button"
                onClick={() => {
                  const idx = previewImageIdx;
                  setPreviewImageIdx(null);
                  handleOpenCrop(idx);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Decupează (Crop)</span>
              </button>

              {/* Buton Rotește direct din Lightbox */}
              <button
                type="button"
                onClick={() => handleRotate(previewImageIdx, 90)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rotește 90°</span>
              </button>

              {/* Buton Șterge direct din Lightbox */}
              <button
                type="button"
                onClick={() => handleDeleteSingle(previewImageIdx)}
                disabled={images.length <= 1}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Șterge</span>
              </button>

              {/* Buton Închide */}
              <button 
                type="button"
                onClick={() => setPreviewImageIdx(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zona Centrală: Imagine & Butoane Navigare Stânga/Dreapta */}
          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2">
            {previewImageIdx > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImageIdx(prev => (prev !== null ? prev - 1 : 0));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={images[previewImageIdx]} 
              alt={`Foto ${previewImageIdx + 1}`} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />

            {previewImageIdx < images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImageIdx(prev => (prev !== null ? prev + 1 : 0));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer cu thumb-uri mici pentru schimbare rapidă */}
          <div 
            className="w-full max-w-4xl overflow-x-auto py-2 flex items-center gap-2 justify-center scrollbar-none"
            onClick={e => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPreviewImageIdx(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  previewImageIdx === i ? 'border-amber-400 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Studio Decupare (Crop) */}
      <ImageCropStudioModal
        isOpen={isCropModalOpen}
        imageSrc={cropPhotoIdx !== null ? images[cropPhotoIdx] : null}
        photoIndex={cropPhotoIdx || 0}
        totalPhotos={images.length}
        onClose={() => setIsCropModalOpen(false)}
        onApplyCrop={handleApplyCropped}
        showToast={showToast}
      />

      {/* Modal Studio Plăcuță RXM (Acoperire Numere) */}
      <PlateOverlayStudioModal
        isOpen={isPlateStudioOpen}
        car={car ? { ...car, images } : null}
        initialPhotoIndex={plateStudioIdx || 0}
        onClose={() => setIsPlateStudioOpen(false)}
        onSaveImages={(_carId, updatedImages) => {
          setImages(updatedImages);
          if (car) {
            onSaveImages(car.id, updatedImages);
          }
          setIsPlateStudioOpen(false);
          showToast('✓ Plăcuțele RXM au fost aplicate și salvate definitiv în stoc!');
        }}
        showToast={showToast}
      />

      {/* Modal Studio Watermark & Logo Firmă (Facebook, Autovit, OLX) */}
      <WatermarkStudioModal
        isOpen={isWatermarkOpen}
        car={car ? { ...car, images } : null}
        onClose={() => setIsWatermarkOpen(false)}
        onSaveBrandedImages={(_carId, updatedImages) => {
          setImages(updatedImages);
          if (car) {
            onSaveImages(car.id, updatedImages);
          }
          setIsWatermarkOpen(false);
          showToast('✓ Sigla oficială a firmei a fost aplicată pe fotografii și salvată în stoc!');
        }}
        showToast={showToast}
      />

    </div>
  );
};
