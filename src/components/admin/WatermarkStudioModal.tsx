import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, Sliders, CheckCircle2, 
  Download, RefreshCw, RotateCcw, Eye, Undo2
} from 'lucide-react';
import { VehicleItem, SEED_DEALER, SEED_VEHICLES } from '../../db/seed';
import { normalizeCarImageUrl } from '../../utils/helpers';
import { 
  WatermarkPosition, 
  WatermarkColor, 
  WatermarkVariant, 
  WatermarkOptions, 
  applyWatermarkToImage, 
  batchApplyWatermark 
} from '../../utils/watermarkEngine';

interface WatermarkStudioModalProps {
  isOpen: boolean;
  car: VehicleItem | null;
  onClose: () => void;
  onSaveBrandedImages?: (carId: string, updatedImages: string[], originalImages?: string[]) => void;
  showToast: (msg: string) => void;
  dealer?: typeof SEED_DEALER;
}

export const WatermarkStudioModal: React.FC<WatermarkStudioModalProps> = ({
  isOpen,
  car,
  onClose,
  onSaveBrandedImages,
  showToast,
  dealer = SEED_DEALER
}) => {
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [color, setColor] = useState<WatermarkColor>('white');
  const [variant, setVariant] = useState<WatermarkVariant>('emblem-text');
  const [opacity, setOpacity] = useState<number>(0.92);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSingleProcessing, setIsSingleProcessing] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Stare locală pentru fotografiile curente ale mașinii
  const [currentCarImages, setCurrentCarImages] = useState<string[]>(() => car?.images || []);

  // Stare locală pentru fotografiile originale curate (pentru funcția de Revert / Scoate Watermark)
  const [originalList, setOriginalList] = useState<string[]>(() => {
    if (!car) return [];
    if (car.originalImages && car.originalImages.length === car.images.length) {
      return car.originalImages;
    }
    const seedMatch = SEED_VEHICLES.find(s => s.id === car.id);
    if (seedMatch && Array.isArray(seedMatch.images) && seedMatch.images.length === car.images.length) {
      return seedMatch.images;
    }
    return car.images.map(img => img);
  });

  // Re-sincronizare la deschiderea modalului
  useEffect(() => {
    if (isOpen && car) {
      setCurrentCarImages(car.images || []);
      setSelectedImgIdx(0);

      if (car.originalImages && car.originalImages.length === car.images.length) {
        setOriginalList(car.originalImages);
      } else {
        const seedMatch = SEED_VEHICLES.find(s => s.id === car.id);
        if (seedMatch && Array.isArray(seedMatch.images) && seedMatch.images.length === car.images.length) {
          setOriginalList(seedMatch.images);
        } else {
          setOriginalList((car.images || []).map(img => img));
        }
      }
    }
  }, [isOpen, car]);

  // Determinare dacă o poză are watermark aplicat
  const isImgWatermarked = (idx: number): boolean => {
    const current = currentCarImages[idx];
    const orig = originalList[idx];
    if (!current) return false;
    if (current.includes('watermarked_')) return true;
    if (orig && current !== orig) return true;
    return false;
  };

  const hasAnyWatermarked = useMemo(() => {
    return currentCarImages.some((_, idx) => isImgWatermarked(idx));
  }, [currentCarImages, originalList]);

  // Re-generează previzualizarea când se schimbă parametrii sau imaginea selectată
  useEffect(() => {
    if (!isOpen || !car || !currentCarImages[selectedImgIdx]) return;

    let isMounted = true;
    setIsGeneratingPreview(true);

    const opts: WatermarkOptions = {
      position,
      opacity,
      color,
      variant,
      dealerName: dealer?.name || 'RXM Automobile'
    };

    // 🛡️ Folosim poza ORIGINALĂ ca bază de randare pentru a evita suprapunerea dublă de watermark-uri
    const baseToWatermark = originalList[selectedImgIdx] || currentCarImages[selectedImgIdx];

    applyWatermarkToImage(baseToWatermark, opts)
      .then(res => {
        if (isMounted) {
          setPreviewSrc(res);
          setIsGeneratingPreview(false);
        }
      })
      .catch(err => {
        console.warn('[WatermarkStudio] Eroare previzualizare watermark:', err);
        if (isMounted) {
          setPreviewSrc(null);
          setIsGeneratingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, car, selectedImgIdx, position, color, variant, opacity, dealer, originalList]);

  if (!isOpen || !car) return null;

  // 1️⃣ Aplicare Siglă DOAR pe Poza Curentă
  const handleApplyCurrentPhoto = async () => {
    if (!car || !onSaveBrandedImages) return;

    setIsSingleProcessing(true);
    try {
      const opts: WatermarkOptions = {
        position,
        opacity,
        color,
        variant,
        dealerName: dealer?.name || 'RXM Automobile'
      };

      const baseSrc = originalList[selectedImgIdx] || currentCarImages[selectedImgIdx];
      const brandedDataUrl = await applyWatermarkToImage(baseSrc, opts);

      // Salvare binară în IndexedDB Media Vault
      const { saveMediaBlob } = await import('../../utils/mediaVaultDb');
      const res = await fetch(brandedDataUrl);
      const blob = await res.blob();
      const key = `rxm-media://cars/${car.id}/watermarked_${Date.now()}_${selectedImgIdx}.webp`;
      await saveMediaBlob(key, blob, { carId: car.id, index: selectedImgIdx });

      const nextImages = [...currentCarImages];
      nextImages[selectedImgIdx] = key;
      setCurrentCarImages(nextImages);

      onSaveBrandedImages(car.id, nextImages, originalList);
      showToast(`✓ Sigla oficială a fost aplicată pe fotografia #${selectedImgIdx + 1}!`);
    } catch (err) {
      console.error('[WatermarkStudio] Eroare la aplicarea pe poza curentă:', err);
      showToast('A apărut o problemă la aplicarea siglei pe fotografia curentă.');
    } finally {
      setIsSingleProcessing(false);
    }
  };

  // 2️⃣ Eliminare Watermark de pe Poza Curentă (Restabilire Original)
  const handleRevertCurrentPhoto = () => {
    if (!car || !onSaveBrandedImages) return;

    const originalSrc = originalList[selectedImgIdx];
    if (!originalSrc) return;

    const nextImages = [...currentCarImages];
    nextImages[selectedImgIdx] = originalSrc;
    setCurrentCarImages(nextImages);

    onSaveBrandedImages(car.id, nextImages, originalList);
    showToast(`✓ Watermark-ul a fost eliminat de pe fotografia #${selectedImgIdx + 1}! S-a restabilit originalul.`);
  };

  // 3️⃣ Eliminare Watermark de pe TOATE Pozele (Restabilire Toate la Original)
  const handleRevertAllPhotos = () => {
    if (!car || !onSaveBrandedImages) return;

    const nextImages = [...originalList];
    setCurrentCarImages(nextImages);

    onSaveBrandedImages(car.id, nextImages, originalList);
    showToast(`✓ Toate cele ${nextImages.length} fotografii au fost restaurate la versiunea originală curată!`);
  };

  // 4️⃣ Aplicare Siglă pe TOATE cele X Fotografii (Batch)
  const handleApplyToAll = async () => {
    if (!car || !onSaveBrandedImages) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: originalList.length });

    try {
      const opts: WatermarkOptions = {
        position,
        opacity,
        color,
        variant,
        dealerName: dealer?.name || 'RXM Automobile'
      };

      // 🛡️ Aplicăm pe imaginile ORIGINALE pentru a garanta calitatea maximă fără artefacte
      const updated = await batchApplyWatermark(
        originalList,
        opts,
        (curr, tot) => setBatchProgress({ current: curr, total: tot })
      );

      // Salvare binară în IndexedDB Media Vault
      const { saveMediaBlob } = await import('../../utils/mediaVaultDb');
      const persistedImages: string[] = [];

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        if (item.startsWith('data:')) {
          try {
            const res = await fetch(item);
            const blob = await res.blob();
            const key = `rxm-media://cars/${car.id}/watermarked_${Date.now()}_${i}.webp`;
            await saveMediaBlob(key, blob, { carId: car.id, index: i });
            persistedImages.push(key);
          } catch (blobErr) {
            console.warn('[WatermarkStudio] Salvare binară eșuată, fallback pe dataURL:', blobErr);
            persistedImages.push(item);
          }
        } else {
          persistedImages.push(item);
        }
      }

      setCurrentCarImages(persistedImages);
      onSaveBrandedImages(car.id, persistedImages, originalList);
      showToast(`✨ Sigla oficială ${dealer?.name || 'RXM'} a fost aplicată cu succes pe toate cele ${persistedImages.length} fotografii!`);
    } catch (e) {
      console.error(e);
      showToast('A apărut o problemă la procesarea fotografiilor.');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(null);
    }
  };

  // 5️⃣ Descărcare Fotografie Curentă cu Siglă
  const handleDownloadCurrent = () => {
    const srcToDownload = previewSrc || currentCarImages[selectedImgIdx];
    if (!srcToDownload) return;
    const a = document.createElement('a');
    a.href = srcToDownload;
    a.download = `${dealer?.name ? dealer.name.replace(/\s+/g, '_') : 'RXM'}-${car.brand}-${car.model}-foto-${selectedImgIdx + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Fotografia cu sigla oficială a fost descărcată!');
  };

  const isCurrentWatermarked = isImgWatermarked(selectedImgIdx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[92vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#121215]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Auto-Branding Studio: Siglă Oficială Firmă
              </h3>
              <p className="text-xs text-zinc-400">
                Watermark & Siglă oficială pentru Facebook, Autovit și OLX • {car.brand} {car.model} ({car.year})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
            aria-label="Închide studioul de branding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corp Modal: 2 Coloane (Previzualizare vs Setări) */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coloana Stânga: Preview Mare & Galerie de selecție */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center select-none">
              {isGeneratingPreview && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center text-amber-300 gap-2 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Randare siglă Canvas...</span>
                </div>
              )}

              {/* Imaginea afișată în funcție de mod (Comparație vs Preview Watermark vs Curent) */}
              {isComparing ? (
                <img 
                  src={normalizeCarImageUrl(originalList[selectedImgIdx])} 
                  alt="Original Curat" 
                  className="w-full h-full object-cover"
                />
              ) : previewSrc ? (
                <img 
                  src={previewSrc} 
                  alt="Previzualizare Siglă Oficială" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={normalizeCarImageUrl(currentCarImages[selectedImgIdx])} 
                  alt="Fotografie" 
                  className="w-full h-full object-cover"
                />
              )}

              {/* Status Badge stânga-sus */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                {isCurrentWatermarked ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Watermark Aplicat
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-300 border border-white/10 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                    Poza Originală Curată
                  </span>
                )}
              </div>

              {/* Buton Comparare dreapta-sus */}
              <button
                type="button"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/70 hover:bg-black/90 active:scale-95 text-zinc-300 hover:text-white border border-white/15 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer z-10"
                title="Ține apăsat pentru a vizualiza fotografia originală fără watermark"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ține apăsat: Original</span>
              </button>

              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300 z-10">
                Poza {selectedImgIdx + 1} din {currentCarImages.length}
              </div>
            </div>

            {/* Selector Miniaturi Foto */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {currentCarImages.map((img, idx) => {
                const watermarked = isImgWatermarked(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      selectedImgIdx === idx 
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' 
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={normalizeCarImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    {watermarked && (
                      <span 
                        className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded bg-amber-500 text-black text-[8px] font-black leading-tight shadow"
                        title="Această fotografie are watermark aplicat"
                      >
                        {dealer?.slug === 'mpi_auto' ? 'MPI' : (dealer?.name ? dealer.name.split(' ')[0] : 'RXM')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Indicator Compoziție Siglă Oficială */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/08 text-xs">
              <div className="flex items-center gap-3">
                {variant === 'badge-only' ? (
                  <img 
                    src="/images/rxm-badge.png" 
                    alt="Badge Circular Oficial" 
                    className="w-10 h-10 object-contain drop-shadow" 
                  />
                ) : variant === 'emblem-only' ? (
                  <img 
                    src={color === 'gold' ? '/images/rxm-emblem-gold.png?v=circle' : '/images/rxm-emblem-white.png?v=circle'} 
                    alt="Emblema Oficială RXM" 
                    className="w-10 h-10 object-contain drop-shadow" 
                  />
                ) : (
                  <>
                    <img 
                      src={color === 'gold' ? '/images/rxm-emblem-gold.png?v=circle' : '/images/rxm-emblem-white.png?v=circle'} 
                      alt="Cerculeț emblemă" 
                      className="w-8 h-8 object-contain drop-shadow" 
                    />
                    <img 
                      src={color === 'gold' ? '/images/rxm-logo-gold.png?v=circle' : '/images/rxm-logo-white.png?v=circle'} 
                      alt="Logo Firmă" 
                      className="h-5 object-contain drop-shadow" 
                    />
                  </>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {dealer?.name || 'RXM Automobile'} (HD Canvas)
              </span>
            </div>
          </div>

          {/* Coloana Dreapta: Controale Culoare, Poziție & Opacitate */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
            <div className="space-y-4">
              
              {/* 1. Format Siglă (Variantă Oficială) */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Model Siglă
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">Recomandat: Emblemă</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVariant('emblem-text')}
                    className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center text-center ${
                      variant === 'emblem-text'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>Emblemă + Text</span>
                    <span className="text-[9px] opacity-75 font-normal">(Recomandat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariant('emblem-only')}
                    className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center text-center ${
                      variant === 'emblem-only'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>Doar Emblemă</span>
                    <span className="text-[9px] opacity-75 font-normal">(Minimalist)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariant('badge-only')}
                    className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center text-center ${
                      variant === 'badge-only'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>Badge Rotund</span>
                    <span className="text-[9px] opacity-75 font-normal">(Complet)</span>
                  </button>
                </div>
              </div>

              {/* 2. Cromatică Logo */}
              {variant !== 'badge-only' && (
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Cromatică Siglă
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setColor('white')}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                        color === 'white'
                          ? 'bg-white/20 text-white border-white/50 shadow-sm'
                          : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      ⚪ Alb Oficial
                    </button>
                    <button
                      type="button"
                      onClick={() => setColor('gold')}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                        color === 'gold'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      🟡 Auriu Lux (Amber)
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Poziționare pe Poză */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Poziționare pe Fotografie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-right')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                      position === 'bottom-right'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    ↘ Dreapta-Jos (Recomandat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-left')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                      position === 'bottom-left'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    ↙ Stânga-Jos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('top-right')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                      position === 'top-right'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    ↗ Dreapta-Sus
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('center')}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                      position === 'center'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-black/30 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    ⊙ Centru Discret
                  </button>
                </div>
              </div>

              {/* 4. Slider Opacitate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-300">Intensitate & Opacitate</span>
                  <span className="font-mono text-amber-300 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Subtil (50%)</span>
                  <span>Echilibrat (92%)</span>
                  <span>Opac (100%)</span>
                </div>
              </div>

              {/* Notă discretă */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-300">
                  Logo-ul curat este aplicat direct peste fotografie, cu umbră fină pentru contrast pe orice caroserie.
                </span>
              </div>
            </div>

            {/* Butoane Acțiuni Finale */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
              {/* 1. Aplicare doar pe poza curentă */}
              <button
                type="button"
                onClick={handleApplyCurrentPhoto}
                disabled={isSingleProcessing || isBatchProcessing}
                className="w-full min-h-[42px] py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] border border-amber-500/40 text-amber-300 font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 touch-manipulation cursor-pointer"
              >
                {isSingleProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Se aplică pe poza #{selectedImgIdx + 1}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Aplică Sigla doar pe Poza Curentă (#{selectedImgIdx + 1})</span>
                  </>
                )}
              </button>

              {/* 2. Aplicare pe toate fotografiile */}
              <button
                type="button"
                onClick={handleApplyToAll}
                disabled={isBatchProcessing || isSingleProcessing}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 touch-manipulation cursor-pointer"
              >
                {isBatchProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Se aplică pe toate pozele ({batchProgress?.current}/{batchProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Aplică Sigla pe toate cele {currentCarImages.length} fotografii</span>
                  </>
                )}
              </button>

              {/* 3. Butoane de restaurare / scoatere watermark */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRevertCurrentPhoto}
                  disabled={!isCurrentWatermarked || isSingleProcessing || isBatchProcessing}
                  className="min-h-[38px] py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/30 text-rose-300 disabled:opacity-30 disabled:pointer-events-none text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer"
                  title="Elimină sigla de pe poza curentă și restabilește originalul curat"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Scoate (Poza #{selectedImgIdx + 1})</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevertAllPhotos}
                  disabled={!hasAnyWatermarked || isSingleProcessing || isBatchProcessing}
                  className="min-h-[38px] py-1.5 px-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 active:scale-[0.98] border border-white/10 hover:border-rose-500/30 text-zinc-300 hover:text-rose-200 disabled:opacity-30 disabled:pointer-events-none text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer"
                  title="Elimină sigla de pe toate pozele mașinii și revine la fotografiile originale curate"
                >
                  <Undo2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">Scoate pe Toate</span>
                </button>
              </div>

              {/* 4. Descărcare fotografie */}
              <button
                type="button"
                onClick={handleDownloadCurrent}
                className="w-full min-h-[38px] py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-manipulation cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Descarcă poza curentă cu sigla {dealer?.name ? dealer.name.split(' ')[0] : 'dealerului'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
