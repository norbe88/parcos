import React, { useRef, useState } from 'react';
import { Play, Upload, Check, Sparkles, Plus, Trash2, Star, Loader2, ChevronLeft, ChevronRight, ArrowLeft, Image as ImageIcon, Clock, GripVertical, ShieldCheck, Cloud, CloudOff } from 'lucide-react';
import { moveItemInArray } from '../../../utils/imageEditorEngine';
import { processImageBatch } from '../../../utils/imageResizeEngine';
import { saveMediaBlob, resolveMediaUrl } from '../../../utils/mediaVaultDb';
import { normalizeCarImageUrl } from '../../../utils/helpers';

interface StepMediaUploadProps {
  carId?: string;
  newTiktokUrl: string;
  setNewTiktokUrl: (val: string) => void;
  newVideoUrl: string;
  setNewVideoUrl: (val: string) => void;
  newOlxUrl?: string;
  setNewOlxUrl?: (val: string) => void;
  newDescription: string;
  setNewDescription: (val: string) => void;
  isUploadingPhotos: boolean;
  uploadProgress: number;
  onPrev: () => void;
  autoBranding?: boolean;
  setAutoBranding?: (val: boolean) => void;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  showToast?: (msg: string) => void;
  publishStage?: 'idle' | 'uploading_photos' | 'saving_record' | 'success' | 'error';
  publishProgress?: { current: number; total: number };
  onSaveLocalOnly?: () => void;
  vehicleStatus?: 'in_stock' | 'preparing';
}

export const StepMediaUpload: React.FC<StepMediaUploadProps> = ({
  carId,
  newTiktokUrl,
  setNewTiktokUrl,
  newVideoUrl,
  setNewVideoUrl,
  newOlxUrl = '',
  setNewOlxUrl,
  newDescription,
  setNewDescription,
  isUploadingPhotos,
  uploadProgress,
  onPrev,
  autoBranding = true,
  setAutoBranding,
  images,
  setImages,
  showToast,
  publishStage = 'idle',
  publishProgress,
  onSaveLocalOnly,
  vehicleStatus = 'in_stock'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [readingCount, setReadingCount] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Stări pentru Reordonare Drag & Drop Fotografii
  const [draggedPhotoIdx, setDraggedPhotoIdx] = useState<number | null>(null);
  const [dragOverPhotoIdx, setDragOverPhotoIdx] = useState<number | null>(null);
  const isDraggingCardRef = useRef(false);

  // Procesare lot de fotografii cu Redimensionare WebP (max 1600px) și Stocare Binară IndexedDB
  const processFileList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => 
      f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|bmp|tiff)$/i.test(f.name)
    );

    if (fileArray.length === 0) {
      showToast?.('⚠️ Te rugăm să selectezi fișiere de tip imagine valide (JPEG, PNG, WebP, HEIC).');
      return;
    }

    setIsReadingFiles(true);
    setReadingCount(fileArray.length);

    try {
      const activeCarId = carId || `car-rxm-${Date.now()}`;
      const startIndex = images.length;

      // 1. Redimensionare și compresie pe Canvas în format WebP 1600px (fără Base64 în LocalStorage)
      const processedResults = await processImageBatch(
        fileArray,
        {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.82,
          applyWatermark: autoBranding,
          watermarkPosition: 'bottom-right',
          watermarkColor: 'white'
        },
        (completed, total, currentName) => {
          setProcessingStatus({ current: completed, total, fileName: currentName || '' });
        }
      );

      // 2. Persistare directă a fiecărui Blob în IndexedDB sub cheie rxm-media://
      const newKeys: string[] = [];
      for (let i = 0; i < processedResults.length; i++) {
        const item = processedResults[i];
        const key = `rxm-media://cars/${activeCarId}/img_${startIndex + i}.webp`;
        await saveMediaBlob(key, item.blob, {
          carId: activeCarId,
          index: startIndex + i,
          width: item.width,
          height: item.height
        });
        newKeys.push(key);
      }

      setImages(prev => [...prev, ...newKeys]);
      showToast?.(`✓ ${newKeys.length} fotografii optimizate în format WebP 1600px și salvate în vault!`);
    } catch (err) {
      console.error('Eroare la optimizarea fotografiilor:', err);
      showToast?.('⚠️ A apărut o problemă la procesarea fotografiilor.');
    } finally {
      setIsReadingFiles(false);
      setReadingCount(0);
      setProcessingStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFileList(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [target] = copy.splice(index, 1);
      copy.unshift(target);
      return copy;
    });
    showToast?.(`Fotografia #${index + 1} a fost setată ca poză de copertă showroom!`);
  };

  const handleRemovePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    showToast?.('Fotografia a fost eliminată din listă.');
  };

  // Reordonare Drag & Drop Fotografii (Mouse Desktop)
  const handleCardDragStart = (e: React.DragEvent, idx: number) => {
    isDraggingCardRef.current = true;
    setDraggedPhotoIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `step_photo_${idx}`);
  };

  const handleCardDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPhotoIdx !== idx) {
      setDragOverPhotoIdx(idx);
    }
  };

  const handleCardDragEnd = () => {
    setDraggedPhotoIdx(null);
    setDragOverPhotoIdx(null);
    setTimeout(() => {
      isDraggingCardRef.current = false;
    }, 150);
  };

  const handleCardDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPhotoIdx === null || draggedPhotoIdx === targetIdx) {
      setDraggedPhotoIdx(null);
      setDragOverPhotoIdx(null);
      setTimeout(() => {
        isDraggingCardRef.current = false;
      }, 150);
      return;
    }

    setImages(prev => moveItemInArray(prev, draggedPhotoIdx, targetIdx));
    if (targetIdx === 0) {
      showToast?.(`⭐ Fotografia a fost mutată pe poziția #1 și a devenit Copertă Showroom!`);
    } else {
      showToast?.(`✓ Fotografia a fost mutată pe poziția #${targetIdx + 1}!`);
    }
    setDraggedPhotoIdx(null);
    setDragOverPhotoIdx(null);
    setTimeout(() => {
      isDraggingCardRef.current = false;
    }, 150);
  };

  // Reordonare Touch Drag pentru Tablete / Telefoane / Touchscreen
  const handleCardTouchStart = (idx: number) => {
    isDraggingCardRef.current = true;
    setDraggedPhotoIdx(idx);
  };

  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (draggedPhotoIdx === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = targetEl?.closest('[data-step-photo-idx]');
    if (cardEl) {
      const targetIdx = Number(cardEl.getAttribute('data-step-photo-idx'));
      if (!isNaN(targetIdx) && targetIdx !== dragOverPhotoIdx) {
        setDragOverPhotoIdx(targetIdx);
      }
    }
  };

  const handleCardTouchEnd = () => {
    if (draggedPhotoIdx !== null && dragOverPhotoIdx !== null && draggedPhotoIdx !== dragOverPhotoIdx) {
      setImages(prev => moveItemInArray(prev, draggedPhotoIdx, dragOverPhotoIdx));
      if (dragOverPhotoIdx === 0) {
        showToast?.(`⭐ Fotografia a fost mutată pe poziția #1 și a devenit Copertă Showroom!`);
      } else {
        showToast?.(`✓ Fotografia a fost mutată pe poziția #${dragOverPhotoIdx + 1}!`);
      }
    }
    setDraggedPhotoIdx(null);
    setDragOverPhotoIdx(null);
    setTimeout(() => {
      isDraggingCardRef.current = false;
    }, 150);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* 1. Linkuri Video TikTok & Walkaround */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-zinc-400 mb-1 flex items-center gap-1.5 font-semibold">
            <Play className="w-3.5 h-3.5 text-[#fe2c55]" /> Link TikTok sau YouTube Shorts
          </label>
          <input 
            type="url" 
            placeholder="https://www.tiktok.com/@dealer/video/..."
            value={newTiktokUrl}
            onChange={e => setNewTiktokUrl(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
          />
          <p className="text-[11px] text-zinc-500 mt-0.5">Se afișează în tab-ul dedicat de prezentare video.</p>
        </div>

        <div>
          <label className="block text-zinc-400 mb-1 font-semibold">
            Link Embed Walkaround (YouTube / Vimeo)
          </label>
          <input 
            type="url" 
            placeholder="https://www.youtube.com/embed/..."
            value={newVideoUrl}
            onChange={e => setNewVideoUrl(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
          />
        </div>
      </div>

      {/* 2. Câmp Opțional Conectare Anunț OLX */}
      {setNewOlxUrl && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <label className="block text-zinc-300 mb-1 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Link Anunț OLX (Opțional — Sincronizare Stoc)
          </label>
          <input 
            type="url" 
            placeholder="https://www.olx.ro/d/oferta/..."
            value={newOlxUrl}
            onChange={e => setNewOlxUrl(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Sistemul va monitoriza automat starea anunțului pe OLX și te va avertiza dacă mașina este vândută sau expiră.
          </p>
        </div>
      )}

      {/* 2.5 BRANDING & WATERMARK DIRECT PENTRU FACEBOOK, AUTOVIT & OLX */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/05 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Watermark & Logo Firmă Direct pe Poze</span>
              <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-500/30 to-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-extrabold tracking-wide uppercase">
                Facebook • Autovit • OLX
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Toate fotografiile încărcate primesc automat sigla oficială de dealer în colț, gata pentru publicare directă pe Facebook, Autovit și OLX.
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
          <input 
            type="checkbox"
            checked={autoBranding}
            onChange={e => setAutoBranding && setAutoBranding(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
        </label>
      </div>

      {/* 3. ZONĂ DEDICATĂ UPLOAD POZE (SELECTARE MULTIPLĂ & DRAG-AND-DROP) */}
      <div 
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-5 rounded-2xl border-2 border-dashed transition-all duration-200 text-center relative ${
          isDragging 
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01] shadow-xl ring-2 ring-amber-400/40' 
            : 'border-white/20 bg-white/[0.02] hover:border-amber-400/60 hover:bg-white/[0.04]'
        }`}
      >
        {/* Input fișiere ascuns cu suport nativ de selectare multiplă */}
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFilesSelected} 
          className="hidden" 
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-2.5">
            {isReadingFiles ? (
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-amber-400" />
            )}
          </div>

          <div className="text-sm font-bold text-white mb-1">
            {isReadingFiles ? `Se citesc ${readingCount} fotografii...` : 'Trage fotografiile mașinii aici'}
          </div>
          <p className="text-xs text-zinc-400 max-w-md mb-3">
            Selectare multiplă permisă (JPEG, PNG, WebP, HEIC). Imaginile sunt comprimate și optimizate automat.
          </p>

          {/* BUTONUL PROEMINENT DE ADĂUGARE POZE */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isReadingFiles || isUploadingPhotos}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {isReadingFiles ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Încărcare în curs...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Adaugă Fotografii (Selectare Multiplă)</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-zinc-500 mt-2">
            💡 Sfat: Poți selecta zeci de imagini dintr-o dată folosind <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Ctrl + A</kbd> sau <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Shift + Click</kbd> în fereastra de selecție.
          </span>
        </div>

        {/* Bară de progres pentru optimizare WebP & procesare lot */}
        {processingStatus && (
          <div className="mt-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Optimizare WebP (1600px) & Watermark...
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">
                {processingStatus.current} / {processingStatus.total} ({Math.round((processingStatus.current / processingStatus.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 transition-all duration-200" 
                style={{ width: `${Math.round((processingStatus.current / processingStatus.total) * 100)}%` }} 
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 truncate">
              {processingStatus.fileName}
            </div>
          </div>
        )}

        {/* Bară de progres la salvare/upload */}
        {isUploadingPhotos && !processingStatus && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-400 h-2 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="text-[11px] text-amber-300 mt-1 font-semibold">Salvare mașină în parc... {uploadProgress}%</div>
          </div>
        )}
      </div>

      {/* 4. PREVIEW GALERIE FOTO CU REORDONARE ȘI ȘTERGERE */}
      {images.length > 0 ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Fotografii Pregătite pentru Showroom</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                {images.length} {images.length === 1 ? 'fotografie' : 'fotografii'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="Adaugă fotografii suplimentare în listă"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Mai adaugă</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Sigur dorești să elimini toate fotografiile selectate?')) {
                    setImages([]);
                    showToast?.('Toate fotografiile au fost eliminate.');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-rose-500/20"
                title="Golește lista de fotografii"
              >
                <Trash2 className="w-3 h-3" />
                <span>Golește</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
            {images.map((imgSrc, idx) => {
              const isCover = idx === 0;
              const isBeingDragged = draggedPhotoIdx === idx;
              const isDropTarget = dragOverPhotoIdx === idx;

              return (
                <div 
                  key={`preview_img_${idx}_${imgSrc.slice(-16)}`}
                  data-step-photo-idx={idx}
                  draggable={true}
                  onDragStart={(e) => handleCardDragStart(e, idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDragEnd={handleCardDragEnd}
                  onDrop={(e) => handleCardDrop(e, idx)}
                  onTouchStart={() => handleCardTouchStart(idx)}
                  onTouchMove={handleCardTouchMove}
                  onTouchEnd={handleCardTouchEnd}
                  className={`group relative aspect-[16/10] rounded-xl overflow-hidden bg-black/60 border transition-all cursor-grab active:cursor-grabbing select-none ${
                    isDropTarget && !isBeingDragged 
                      ? 'border-amber-400 scale-[1.03] shadow-2xl ring-2 ring-amber-400/70 z-20' 
                      : ''
                  } ${
                    isBeingDragged ? 'opacity-30 scale-95 border-amber-500/50' : ''
                  } ${
                    isCover 
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Indicator de Drop Target activ */}
                  {isDropTarget && !isBeingDragged && (
                    <div className="absolute inset-0 z-30 bg-amber-500/20 border-2 border-amber-400 rounded-xl flex items-center justify-center pointer-events-none backdrop-blur-[1px] animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-amber-400 text-amber-300 font-extrabold text-[11px] shadow-2xl flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Poziția #{idx + 1}</span>
                      </div>
                    </div>
                  )}

                  <img 
                    src={normalizeCarImageUrl(imgSrc)} 
                    alt={`Foto ${idx + 1}`} 
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

                  {/* Badge Copertă / Index & Grip Handle */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    {isCover ? (
                      <span 
                        className="px-1.5 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-[9px] flex items-center gap-1 shadow-md cursor-grab active:cursor-grabbing select-none"
                        title="Copertă Showroom • Trage pentru a schimba ordinea"
                      >
                        <Star className="w-2.5 h-2.5 fill-black" />
                        <span>Copertă</span>
                        <GripVertical className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </span>
                    ) : (
                      <span 
                        className="px-1.5 py-0.5 rounded-md bg-black/75 text-zinc-300 font-mono text-[9px] border border-white/20 flex items-center gap-0.5 cursor-grab active:cursor-grabbing hover:border-amber-400/50 hover:text-white transition-colors select-none"
                        title="Trage pentru a reordona poziția"
                      >
                        <GripVertical className="w-2.5 h-2.5 text-amber-400" />
                        <span>#{idx + 1}</span>
                      </span>
                    )}
                  </div>

                  {/* Acțiuni Foto Rapide: Setează Copertă & Șterge */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        title="Setează ca primă poză (Copertă Showroom)"
                        className="w-6 h-6 rounded-md bg-black/75 hover:bg-amber-500 text-amber-400 hover:text-black flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      title="Elimină fotografia"
                      className="w-6 h-6 rounded-md bg-black/75 hover:bg-rose-600 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reordonare: Butoane Chevrons Mută la Stânga / Dreapta */}
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 z-10 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => setImages(prev => moveItemInArray(prev, idx, idx - 1))}
                        className="w-5 h-5 rounded bg-black/80 hover:bg-white/20 text-white flex items-center justify-center text-[10px] cursor-pointer"
                        title="Mută mai la stânga"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setImages(prev => moveItemInArray(prev, idx, idx + 1))}
                        className="w-5 h-5 rounded bg-black/80 hover:bg-white/20 text-white flex items-center justify-center text-[10px] cursor-pointer"
                        title="Mută mai la dreapta"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-amber-200 text-sm">Nu aveți încă fotografii? Nicio problemă!</div>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Mașina va fi salvată automat cu statusul <strong className="text-amber-400 font-semibold">„În Pregătire”</strong>. 
              Va rămâne ascunsă din showroom-ul online, dar veți putea genera și printa imediat <strong className="text-white">Fișa A4 de Parbriz cu QR Code</strong> pentru a o pune în geamul mașinii pe stocul fizic.
            </p>
          </div>
        </div>
      )}

      {/* 5. Opțiune Auto-Branding cu Logo Dealer */}
      {images.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Aplică automat sigla oficială a dealerului pe fotografii</div>
              <p className="text-[10px] text-zinc-400">Protejează pozele împotriva copierii cu sigla oficială din antetul showroom-ului</p>
            </div>
          </div>
          <input 
            type="checkbox"
            checked={autoBranding}
            onChange={e => setAutoBranding && setAutoBranding(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      )}

      {/* 6. Descriere Text Prezentare Showroom */}
      <div>
        <label className="block text-zinc-400 mb-1 font-semibold">Descriere Prezentare Showroom</label>
        <textarea 
          rows={3}
          placeholder="Introduceți o descriere completă a mașinii, starea mecanică, revizii efectuate și beneficii..."
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-amber-400 resize-none text-xs"
        />
      </div>

      {/* 7. Navigare & Buton Publicare în Baza de Date */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08] gap-2 flex-wrap">
        <button 
          type="button" 
          onClick={onPrev}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>Înapoi: Dotări</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            type="submit"
            disabled={isUploadingPhotos || isReadingFiles || publishStage === 'uploading_photos' || publishStage === 'saving_record'}
            className={`min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation active:scale-95 cursor-pointer ${
              publishStage === 'uploading_photos' || publishStage === 'saving_record'
                ? 'bg-blue-600 text-white animate-pulse cursor-wait'
                : publishStage === 'success'
                  ? 'bg-emerald-600 text-white'
                  : publishStage === 'error'
                    ? 'bg-red-600 text-white'
                    : vehicleStatus === 'preparing'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold shadow-emerald-500/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {publishStage === 'uploading_photos'
                ? `⏳ Se încarcă pozele (${publishProgress?.current || 0}/${publishProgress?.total || images.length})...`
                : publishStage === 'saving_record'
                  ? '☁️ Se salvează în baza de date...'
                  : publishStage === 'success'
                    ? '✅ Salvat cu succes în baza de date!'
                    : isUploadingPhotos 
                      ? 'Salvare & Procesare...' 
                      : vehicleStatus === 'preparing'
                        ? '🟡 Salvează Vehiculul ca «În Pregătire» (Bază de Date)'
                        : '🚀 Salvează & Publică «În Stoc» (Showroom Live)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
