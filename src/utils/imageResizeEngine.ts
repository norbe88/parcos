/**
 * src/utils/imageResizeEngine.ts
 * Motor de redimensionare progresivă și compresie WebP pe Canvas HTML5 (Client-Side)
 * Permite încărcarea de fotografii de înaltă rezoluție (până la 50MB per fișier)
 * și le comprimă direct în browser în Blobs WebP optimizate pentru showroom.
 */

export interface ResizeOptions {
  maxWidth?: number;          // Rezoluție maximă pe lățime (implicit 1600px)
  maxHeight?: number;         // Rezoluție maximă pe înălțime (implicit 1200px)
  quality?: number;           // Calitate WebP (implicit 0.82)
  generateThumbnail?: boolean;// Generează și thumbnail de previzualizare (implicit true)
  thumbMaxWidth?: number;     // Lățime maximă thumbnail (implicit 480px)
  thumbQuality?: number;      // Calitate thumbnail (implicit 0.78)
  applyWatermark?: boolean;   // Aplică branding RXM oficial direct pe Canvas (implicit false)
  watermarkColor?: 'white' | 'gold';
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  watermarkOpacity?: number;
}

export interface ProcessedImageResult {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatio: number;   // procent reducere, ex: 0.94 (94% mai mic)
  format: 'image/webp' | 'image/jpeg';
  thumbnailBlob?: Blob;
  thumbnailObjectUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

/**
 * Încarcă o sursă de imagine (File, Blob sau URL string) într-un element HTMLImageElement
 */
export function loadImageElement(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;

    img.onload = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      reject(new Error(`Eroare la decodarea imaginii: ${err}`));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrlToRevoke = URL.createObjectURL(source);
      img.src = objectUrlToRevoke;
    }
  });
}

/**
 * Calculează noile dimensiuni păstrând strict raportul de aspect original
 */
export function calculateFitDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (origWidth <= maxWidth && origHeight <= maxHeight) {
    return { width: Math.round(origWidth), height: Math.round(origHeight) };
  }

  const widthRatio = maxWidth / origWidth;
  const heightRatio = maxHeight / origHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(origWidth * ratio)),
    height: Math.max(1, Math.round(origHeight * ratio))
  };
}

/**
 * Convertește un canvas HTML5 în Blob cu fallback automat de la WebP la JPEG
 */
function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/webp', quality = 0.82): Promise<{ blob: Blob; format: 'image/webp' | 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve({ blob, format: 'image/webp' });
          return;
        }

        // Fallback dacă browserul nu suportă export WebP pe Canvas
        canvas.toBlob(
          (fallbackBlob) => {
            if (fallbackBlob) {
              resolve({ blob: fallbackBlob, format: 'image/jpeg' });
            } else {
              reject(new Error('Nu s-a putut genera Blob-ul imaginii din Canvas'));
            }
          },
          'image/jpeg',
          Math.min(0.92, quality + 0.05)
        );
      },
      type,
      quality
    );
  });
}

/**
 * Desenează watermark-ul oficial RXM pe Canvas dacă este solicitat
 */
async function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: ResizeOptions
) {
  try {
    const { applyWatermarkToCanvasInternal } = await import('./watermarkEngine');
    if (typeof applyWatermarkToCanvasInternal === 'function') {
      await applyWatermarkToCanvasInternal(ctx, width, height, {
        position: options.watermarkPosition || 'bottom-right',
        color: options.watermarkColor || 'white',
        opacity: options.watermarkOpacity ?? 0.92,
        scaleRatio: 0.22,
        marginPx: 28
      });
    }
  } catch {
    // Dacă funcția internă nu este expusă, continuăm fără a bloca redimensionarea
  }
}

/**
 * Redimensionează și comprimă o imagine în format WebP cu generare opțională de thumbnail
 */
export async function resizeAndCompressImage(
  source: File | Blob | string,
  options: ResizeOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    generateThumbnail = true,
    thumbMaxWidth = 480,
    thumbQuality = 0.78,
    applyWatermark = false
  } = options;

  const originalSizeBytes = typeof source === 'string' 
    ? (source.startsWith('data:') ? Math.round((source.length * 3) / 4) : 0)
    : source.size;

  const img = await loadImageElement(source);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. Calcul dimensiuni pentru imaginea principală de showroom
  const { width: mainW, height: mainH } = calculateFitDimensions(origW, origH, maxWidth, maxHeight);

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = mainW;
  mainCanvas.height = mainH;

  const mainCtx = mainCanvas.getContext('2d', { alpha: false });
  if (!mainCtx) {
    throw new Error('Nu s-a putut obține contextul Canvas 2D');
  }

  // Netezire bicubică de înaltă fidelitate
  mainCtx.imageSmoothingEnabled = true;
  mainCtx.imageSmoothingQuality = 'high';

  // Fundal curat negru/neutru pentru consistență
  mainCtx.fillStyle = '#09090b';
  mainCtx.fillRect(0, 0, mainW, mainH);
  mainCtx.drawImage(img, 0, 0, mainW, mainH);

  if (applyWatermark) {
    await drawWatermarkOnCanvas(mainCtx, mainW, mainH, options);
  }

  const { blob: mainBlob, format } = await canvasToBlob(mainCanvas, 'image/webp', quality);
  const mainObjectUrl = URL.createObjectURL(mainBlob);

  // 2. Generare Thumbnail de mare viteză pentru tabele și carduri mici
  let thumbBlob: Blob | undefined;
  let thumbObjectUrl: string | undefined;
  let thumbW: number | undefined;
  let thumbH: number | undefined;

  if (generateThumbnail) {
    const thumbDims = calculateFitDimensions(origW, origH, thumbMaxWidth, Math.round((thumbMaxWidth * origH) / origW));
    thumbW = thumbDims.width;
    thumbH = thumbDims.height;

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;

    const thumbCtx = thumbCanvas.getContext('2d', { alpha: false });
    if (thumbCtx) {
      thumbCtx.imageSmoothingEnabled = true;
      thumbCtx.imageSmoothingQuality = 'medium';
      thumbCtx.drawImage(mainCanvas, 0, 0, thumbW, thumbH);
      const thumbResult = await canvasToBlob(thumbCanvas, 'image/webp', thumbQuality);
      thumbBlob = thumbResult.blob;
      thumbObjectUrl = URL.createObjectURL(thumbBlob);
    }
  }

  const sizeBytes = mainBlob.size;
  const compressionRatio = originalSizeBytes > 0 
    ? Math.max(0, Number((1 - sizeBytes / originalSizeBytes).toFixed(3)))
    : 0;

  return {
    blob: mainBlob,
    objectUrl: mainObjectUrl,
    width: mainW,
    height: mainH,
    sizeBytes,
    originalSizeBytes,
    compressionRatio,
    format,
    thumbnailBlob: thumbBlob,
    thumbnailObjectUrl: thumbObjectUrl,
    thumbnailWidth: thumbW,
    thumbnailHeight: thumbH
  };
}

/**
 * Procesează un lot de fotografii secvențial/în paralel cu raportare progres în timp real
 */
export async function processImageBatch(
  files: (File | Blob)[],
  options: ResizeOptions = {},
  onProgress?: (processedCount: number, totalCount: number, currentName?: string) => void
): Promise<ProcessedImageResult[]> {
  const results: ProcessedImageResult[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const fileName = (file as File).name || `foto_${i + 1}`;
    
    if (onProgress) {
      onProgress(i, total, fileName);
    }

    try {
      const processed = await resizeAndCompressImage(file, options);
      results.push(processed);
    } catch (err) {
      console.error(`Eroare la procesarea fișierului ${fileName}:`, err);
    }

    if (onProgress) {
      onProgress(i + 1, total, fileName);
    }
  }

  return results;
}
