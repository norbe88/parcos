/**
 * src/utils/watermarkEngine.ts
 * Motor de aplicare watermark pe fotografii auto:
 * DOAR LOGO-UL OFICIAL RXM ÎN SINE:
 * - Cerculețul cu mașina în el (Emblema oficială)
 * - Pe lângă el, RXM Automobile (Logo-ul oficial text)
 * - Fără fundal / fără chenar / fără text suplimentar ("Atâta.")
 */

export type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
export type WatermarkColor = 'white' | 'gold';
export type WatermarkVariant = 'emblem-text' | 'emblem-only' | 'badge-only';

export interface WatermarkOptions {
  position?: WatermarkPosition;
  opacity?: number;        // 0.2 - 1.0 (implicit 0.92)
  scaleRatio?: number;     // din lățimea imaginii (implicit 0.22)
  marginPx?: number;       // marginea față de colț (implicit 28)
  color?: WatermarkColor;  // 'white' (Alb oficial) | 'gold' (Auriu luxury)
  variant?: WatermarkVariant; // 'emblem-text' (Recomandat) | 'emblem-only' | 'badge-only'
  dealerName?: string;     // Denumirea dealerului pentru text fallback
  platformTag?: 'facebook' | 'autovit' | 'olx' | 'all';
}

// Cache în memorie pentru imaginile de branding (evită re-decodarea la fiecare poză dintr-un set)
const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Nu setăm crossOrigin pe rute relative, blob-uri sau data-uri pentru a evita blocajele CORS
    // dacă serverul/proxy-ul local nu întoarce antetul Access-Control-Allow-Origin
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const urlObj = new URL(src);
        if (typeof window !== 'undefined' && urlObj.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous';
        }
      } catch {
        img.crossOrigin = 'anonymous';
      }
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // 🛡️ Ștergem din cache promisiunea eșuată pentru a permite reîncercări curate
      imageCache.delete(src);
      reject(new Error(`Eroare la încărcarea imaginii: ${src}`));
    };
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

/**
 * Rezolvă calea către un asset static ținând cont de base URL configurat
 */
function resolveAssetUrl(relativePath: string): string {
  const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
  const baseUrl = meta.env?.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
}

async function tryLoadFirst(urls: string[]): Promise<HTMLImageElement> {
  for (const url of urls) {
    try {
      return await loadImage(url);
    } catch {
      // Încearcă următoarea variantă de URL
    }
  }
  throw new Error(`Nu s-a putut încărca niciun asset din: ${urls.join(', ')}`);
}

/**
 * Încarcă cerculețul cu mașina (emblema oficială RXM)
 */
export async function loadOfficialEmblem(color: WatermarkColor = 'white'): Promise<HTMLImageElement> {
  const emblemFileName = color === 'gold' ? 'rxm-emblem-gold.png' : 'rxm-emblem-white.png';
  const emblemCandidateUrls = [
    `/images/${emblemFileName}`,
    resolveAssetUrl(`images/${emblemFileName}`),
    `/rxm/images/${emblemFileName}`,
    `./images/${emblemFileName}`
  ];
  if (color === 'white') {
    emblemCandidateUrls.push(
      '/images/rxm-emblem-circle-white.png',
      resolveAssetUrl('images/rxm-emblem-circle-white.png'),
      '/rxm/images/rxm-emblem-circle-white.png'
    );
  }
  return tryLoadFirst(emblemCandidateUrls);
}

/**
 * Încarcă badge-ul circular complet oficial RXM Automobile
 */
export async function loadOfficialBadge(): Promise<HTMLImageElement> {
  const badgeCandidateUrls = [
    '/images/rxm-badge.png',
    resolveAssetUrl('images/rxm-badge.png'),
    '/rxm/images/rxm-badge.png',
    './images/rxm-badge.png'
  ];
  return tryLoadFirst(badgeCandidateUrls);
}

/**
 * Încarcă cerculețul cu mașina (emblema) și logo-ul oficial RXM Automobile
 */
async function loadOfficialLogo(color: WatermarkColor = 'white'): Promise<{ logo: HTMLImageElement; emblem: HTMLImageElement }> {
  const logoFileName = color === 'gold' ? 'rxm-logo-gold.png' : 'rxm-logo-white.png';

  const logoCandidateUrls = [
    `/images/${logoFileName}`,
    resolveAssetUrl(`images/${logoFileName}`),
    `/rxm/images/${logoFileName}`,
    `./images/${logoFileName}`
  ];

  const [logo, emblem] = await Promise.all([
    tryLoadFirst(logoCandidateUrls),
    loadOfficialEmblem(color)
  ]);

  return { logo, emblem };
}

/**
 * Desenează watermark-ul oficial RXM direct pe un context 2D de Canvas existent
 */
export async function applyWatermarkToCanvasInternal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions = {}
): Promise<void> {
  const {
    position = 'bottom-right',
    opacity = 0.92,
    scaleRatio = 0.22,
    marginPx = 28,
    color = 'white',
    variant = 'emblem-text',
    dealerName = 'RXM AUTOMOBILE'
  } = options;

  let totalWidth = 0;
  let totalHeight = 0;
  let emblemSize = 0;
  let logoWidth = 0;
  let logoHeight = 0;
  let gap = 0;

  if (variant === 'emblem-only') {
    emblemSize = Math.min(width * 0.22, Math.max(90, width * scaleRatio * 0.65));
    totalWidth = emblemSize;
    totalHeight = emblemSize;
  } else if (variant === 'badge-only') {
    const badgeSize = Math.min(width * 0.24, Math.max(100, width * scaleRatio * 0.75));
    totalWidth = badgeSize;
    totalHeight = badgeSize;
  } else {
    // 'emblem-text' (Recomandat: Emblema oficială + Text)
    const logoTotalWidth = Math.min(width * 0.38, Math.max(220, width * scaleRatio));
    emblemSize = logoTotalWidth * 0.27;
    gap = logoTotalWidth * 0.04;
    logoWidth = logoTotalWidth - emblemSize - gap;
    logoHeight = logoWidth / 2.58; // aspect ratio original rxm-logo.png (921 / 357)
    totalWidth = logoTotalWidth;
    totalHeight = Math.max(emblemSize, logoHeight);
  }

  const margin = Math.max(16, (width / 1280) * marginPx);

  let posX = 0;
  let posY = 0;

  switch (position) {
    case 'bottom-right':
      posX = width - totalWidth - margin;
      posY = height - totalHeight - margin;
      break;
    case 'bottom-left':
      posX = margin;
      posY = height - totalHeight - margin;
      break;
    case 'top-right':
      posX = width - totalWidth - margin;
      posY = margin;
      break;
    case 'top-left':
      posX = margin;
      posY = margin;
      break;
    case 'center':
      posX = (width - totalWidth) / 2;
      posY = (height - totalHeight) / 2;
      break;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = Math.max(0.2, Math.min(1.0, opacity));

  try {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (variant === 'emblem-only') {
      const emblem = await loadOfficialEmblem(color);
      ctx.drawImage(emblem, posX, posY, totalWidth, totalHeight);
    } else if (variant === 'badge-only') {
      const badge = await loadOfficialBadge();
      ctx.drawImage(badge, posX, posY, totalWidth, totalHeight);
    } else {
      const { logo, emblem } = await loadOfficialLogo(color);

      const emblemY = posY + (totalHeight - emblemSize) / 2;
      const logoY = posY + (totalHeight - logoHeight) / 2;
      const logoX = posX + emblemSize + gap;

      ctx.drawImage(emblem, posX, emblemY, emblemSize, emblemSize);
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn('[WatermarkEngine] Asset PNG indisponibil, se activează fallback tipografic:', err);
    // 🛡️ Fallback tipografic de lux dacă imaginile PNG nu sunt disponibile
    const badgeHeight = Math.max(34, width * 0.038);
    const badgePaddingX = badgeHeight * 0.5;
    const isGold = color === 'gold';
    const primaryColor = isGold ? '#f59e0b' : '#ffffff';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Emblema cerc cu contur de lux
    const circleRadius = badgeHeight * 0.45;
    const circleCenterX = posX + circleRadius + 4;
    const circleCenterY = posY + badgeHeight / 2;

    ctx.beginPath();
    ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 12, 15, 0.75)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    // Siluetă mașină stilizată în interiorul cercului
    ctx.beginPath();
    ctx.arc(circleCenterX, circleCenterY - 2, circleRadius * 0.35, Math.PI, 0);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    // Textul dealerului cu font luxury
    ctx.font = `800 ${Math.round(badgeHeight * 0.44)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '1px';
    ctx.fillText(dealerName.toUpperCase(), circleCenterX + circleRadius + gap, circleCenterY);
  }

  ctx.restore();
}

/**
 * Aplică watermark cu logo oficial RXM (cerculețul cu mașina + RXM Automobile) pe o singură imagine
 * Suportă căi canonice statice, Blob URLs și chei rxm-media://
 * Returnează DataURL în format JPEG de înaltă fidelitate (calitate 92%)
 */
export async function applyWatermarkToImage(
  imageSrc: string,
  options: WatermarkOptions = {}
): Promise<string> {
  let effectiveSrc = imageSrc;
  if (imageSrc.startsWith('rxm-media://')) {
    const { resolveMediaUrl, getMediaBlob } = await import('./mediaVaultDb');
    const cached = resolveMediaUrl(imageSrc);
    if (cached && !cached.startsWith('rxm-media://')) {
      effectiveSrc = cached;
    } else {
      const blob = await getMediaBlob(imageSrc);
      if (blob) {
        effectiveSrc = URL.createObjectURL(blob);
      }
    }
  }
  effectiveSrc = effectiveSrc.replace(/\/rxm\/cars\//g, '/cars/');

  const baseImage = await loadImage(effectiveSrc);

  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth || baseImage.width || 1280;
  canvas.height = baseImage.naturalHeight || baseImage.height || 720;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas');
  }

  // 1. Desenare imagine originală
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // 2. Aplicare watermark direct pe canvas
  await applyWatermarkToCanvasInternal(ctx, canvas.width, canvas.height, options);

  // 3. Export la calitate 92% JPEG
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Generează un Blob binar cu watermark aplicat (zero Base64 în memorie)
 * Ideal pentru descărcare directă sau upload pe Facebook, Autovit și OLX
 */
export async function applyWatermarkToBlob(
  imageSrc: string,
  options: WatermarkOptions = {},
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  let effectiveSrc = imageSrc;
  if (imageSrc.startsWith('rxm-media://')) {
    const { resolveMediaUrl, getMediaBlob } = await import('./mediaVaultDb');
    const cached = resolveMediaUrl(imageSrc);
    if (cached && !cached.startsWith('rxm-media://')) {
      effectiveSrc = cached;
    } else {
      const blob = await getMediaBlob(imageSrc);
      if (blob) {
        effectiveSrc = URL.createObjectURL(blob);
      }
    }
  }
  effectiveSrc = effectiveSrc.replace(/\/rxm\/cars\//g, '/cars/');

  const baseImage = await loadImage(effectiveSrc);

  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth || baseImage.width || 1280;
  canvas.height = baseImage.naturalHeight || baseImage.height || 720;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas');
  }

  // 1. Desenare imagine originală
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // 2. Aplicare watermark direct pe canvas
  await applyWatermarkToCanvasInternal(ctx, canvas.width, canvas.height, options);

  // 3. Conversie binară toBlob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Nu s-a putut genera Blob din canvas')),
      format,
      quality
    );
  });
}

/**
 * Aplică watermark în serie (batch) pe toate fotografiile unei mașini
 */
export async function batchApplyWatermark(
  images: string[],
  options: WatermarkOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const result: string[] = [];
  for (let i = 0; i < images.length; i++) {
    try {
      const branded = await applyWatermarkToImage(images[i], options);
      result.push(branded);
    } catch (e) {
      console.warn(`Nu s-a putut aplica watermark pe imaginea ${i + 1}:`, e);
      result.push(images[i]);
    }
    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }
  return result;
}
