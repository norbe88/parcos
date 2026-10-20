/**
 * src/utils/plateOverlayEngine.ts
 * Motor de acoperire numere de înmatriculare (Plate Overlay) preluat și adaptat din AutoLicit / Carvanaro.
 * 
 * Funcționalități:
 * - Suprapunere plăcuță oficială dealer RXM Automobile (1040x220 px, standard EU 4.72:1)
 * - Poziționare automată (geometrie bumper jos 72%, centrat orizontal)
 * - Poziționare manuală (drag & drop, click-to-snap, ajustare fină pixeli)
 * - Control scalare (lățime relativă) și unghi de rotație (-25° la +25° pentru unghiuri 3/4)
 * - Umbră realistă de încastrare în suportul de număr
 * - Randare Canvas HTML5 la rezoluția nativă a imaginii
 */

export interface PlateOverlayOptions {
  /** Poziție X relativă a centrului plăcuței (0.0 - 1.0, implicit 0.50) */
  centerX?: number;
  /** Poziție Y relativă a centrului plăcuței (0.0 - 1.0, implicit 0.72) */
  centerY?: number;
  /** Lățimea plăcuței relativă la lățimea imaginii (implicit 0.24, între 0.10 și 0.50) */
  widthRatio?: number;
  /** Unghi de rotație în grade (-25° la +25°, implicit 0) */
  rotationDeg?: number;
  /** Efect de umbră/încastrare suport număr (implicit true) */
  addShadow?: boolean;
}

export type BumperViewPreset = 'front-center' | 'rear-center' | 'angled-left' | 'angled-right' | 'auto';

// Cache în memorie pentru șablonul de plăcuță
let plateImageCache: Promise<HTMLImageElement> | null = null;

/**
 * Rezolvă calea către un asset static ținând cont de BASE_URL din Vite
 */
function resolveAssetUrl(relativePath: string): string {
  const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
  const baseUrl = meta.env?.BASE_URL || '/rxm/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Încarcă o imagine într-un element Image cu suport CORS doar pentru resurse externe
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Nu setăm crossOrigin pe data: sau blob: URIs deoarece blochează încărcarea în unele browsere
    if (!src.startsWith('data:') && !src.startsWith('blob:') && (src.startsWith('http://') || src.startsWith('https://'))) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Eroare la încărcarea imaginii: ${src} (${err})`));
    img.src = src;
  });
}

/**
 * Încarcă șablonul oficial de plăcuță RXM (rxm-dealer-plate.png)
 */
export async function loadRxmDealerPlate(): Promise<HTMLImageElement> {
  if (plateImageCache) {
    return plateImageCache;
  }

  const candidateUrls = [
    resolveAssetUrl('images/rxm-dealer-plate.png'),
    '/rxm/images/rxm-dealer-plate.png',
    '/images/rxm-dealer-plate.png',
    './images/rxm-dealer-plate.png'
  ];

  plateImageCache = (async () => {
    for (const url of candidateUrls) {
      try {
        const img = await loadImage(url);
        return img;
      } catch {
        // Încearcă următorul URL
      }
    }
    throw new Error('Nu s-a putut încărca șablonul plăcuței RXM din nicio locație.');
  })();

  return plateImageCache;
}

/**
 * Calculează coordonatele și dimensiunile implicite pentru preset-uri de caroserie
 */
export function getPresetOptions(preset: BumperViewPreset): PlateOverlayOptions {
  switch (preset) {
    case 'angled-left':
      // Poza din perspectivă 3/4 stânga (fața mașinii ușor înclinată spre stânga)
      return {
        centerX: 0.52,
        centerY: 0.71,
        widthRatio: 0.23,
        rotationDeg: -3.8,
        addShadow: true
      };
    case 'angled-right':
      // Poza din perspectivă 3/4 dreapta
      return {
        centerX: 0.48,
        centerY: 0.71,
        widthRatio: 0.23,
        rotationDeg: 3.8,
        addShadow: true
      };
    case 'rear-center':
      // Spate mașină (plăcuța pe hayon sau bumper jos)
      return {
        centerX: 0.50,
        centerY: 0.73,
        widthRatio: 0.24,
        rotationDeg: 0,
        addShadow: true
      };
    case 'front-center':
    case 'auto':
    default:
      // Față mașină clasică
      return {
        centerX: 0.50,
        centerY: 0.72,
        widthRatio: 0.24,
        rotationDeg: 0,
        addShadow: true
      };
  }
}

/**
 * Aplică plăcuța de dealer RXM peste numărul de înmatriculare al mașinii
 * Folosește Canvas HTML5 la rezoluția nativă a imaginii
 * 
 * @param imageSrc Sursa imaginii (URL sau DataURL)
 * @param options Opțiuni de poziționare, scalare și unghi
 * @returns DataURL JPEG la fidelitate superioară (calitate 92%)
 */
export async function applyPlateOverlayToImage(
  imageSrc: string,
  options: PlateOverlayOptions = {}
): Promise<string> {
  const {
    centerX = 0.50,
    centerY = 0.72,
    widthRatio = 0.24,
    rotationDeg = 0,
    addShadow = true
  } = options;

  const [baseImage, plateTemplate] = await Promise.all([
    loadImage(imageSrc),
    loadRxmDealerPlate()
  ]);

  const canvas = document.createElement('canvas');
  const imgW = baseImage.naturalWidth || baseImage.width || 1280;
  const imgH = baseImage.naturalHeight || baseImage.height || 720;
  canvas.width = imgW;
  canvas.height = imgH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas');
  }

  // 1. Randare fotografie originală
  ctx.drawImage(baseImage, 0, 0, imgW, imgH);

  // 2. Calcul dimensiuni plăcuță conform standardului european EU (ratio ~4.72:1)
  // Șablonul nativ are 1040 x 220 px
  const plateW = Math.max(80, Math.min(imgW * 0.60, imgW * widthRatio));
  const plateAspect = (plateTemplate.naturalWidth || 1040) / (plateTemplate.naturalHeight || 220);
  const plateH = plateW / plateAspect;

  // Coordonate centru în pixeli
  const posX = imgW * Math.max(0.05, Math.min(0.95, centerX));
  const posY = imgH * Math.max(0.05, Math.min(0.95, centerY));

  ctx.save();
  // Translatăm în centrul plăcuței
  ctx.translate(posX, posY);

  // Rotim la unghiul dorit
  if (rotationDeg !== 0) {
    ctx.rotate((rotationDeg * Math.PI) / 180);
  }

  // 3. Efect de umbră realistă (suport de număr negru subțire + umbră adâncă pe bară)
  if (addShadow) {
    // A. Margine/Suport negru subtil al ramei de număr
    ctx.fillStyle = '#0f1013';
    const holderPadX = Math.max(2, plateW * 0.012);
    const holderPadY = Math.max(2, plateH * 0.04);
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = Math.max(6, plateH * 0.35);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(2, plateH * 0.12);

    // Colțuri rotunjite suport număr
    const r = Math.max(4, plateH * 0.10);
    const hx = -plateW / 2 - holderPadX;
    const hy = -plateH / 2 - holderPadY;
    const hw = plateW + holderPadX * 2;
    const hh = plateH + holderPadY * 2;

    ctx.beginPath();
    ctx.roundRect(hx, hy, hw, hh, r);
    ctx.fill();

    // Resetare umbră pentru plăcuța propriu-zisă
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // 4. Desenare plăcuță RXM centrată
  ctx.drawImage(plateTemplate, -plateW / 2, -plateH / 2, plateW, plateH);

  ctx.restore();

  // 5. Export la calitate superioară JPEG
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Aplică plăcuța automat în serie pe o listă de fotografii (batch)
 */
export async function batchApplyPlateOverlay(
  images: string[],
  options: PlateOverlayOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const result: string[] = [];
  for (let i = 0; i < images.length; i++) {
    try {
      const overlaid = await applyPlateOverlayToImage(images[i], options);
      result.push(overlaid);
    } catch (e) {
      console.warn(`Nu s-a putut aplica plăcuța pe imaginea ${i + 1}:`, e);
      result.push(images[i]);
    }
    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }
  return result;
}
