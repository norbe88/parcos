/**
 * Engine pentru editare, rotire și procesare fotografii în browser (Canvas HTML5)
 */

/**
 * Încarcă o imagine într-un element Image cu suport CORS
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Eroare la încărcarea imaginii: ${err}`));
    img.src = src;
  });
}

export interface NormalizedCropArea {
  x: number;      // 0.0 to 1.0 (sau pixeli dacă > 1)
  y: number;      // 0.0 to 1.0 (sau pixeli dacă > 1)
  width: number;  // 0.0 to 1.0 (sau pixeli dacă > 1)
  height: number; // 0.0 to 1.0 (sau pixeli dacă > 1)
}

/**
 * Rotește o imagine la 90, 180, 270 sau -90 de grade folosind Canvas HTML5
 * @param imageSrc URL-ul sau DataURL-ul imaginii sursă
 * @param degrees Unghiul de rotație (implicit 90 grade)
 * @returns DataURL cu imaginea rotită la calitate superioară (0.92)
 */
export async function rotateImage(
  imageSrc: string,
  degrees: 90 | 180 | 270 | -90 = 90
): Promise<string> {
  const normalizedDegrees = degrees === -90 ? 270 : degrees;
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas');
  }

  // Dacă rotim la 90 sau 270 grade, inversăm lățimea cu înălțimea
  if (normalizedDegrees === 90 || normalizedDegrees === 270) {
    canvas.width = img.naturalHeight || img.height;
    canvas.height = img.naturalWidth || img.width;
  } else {
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
  }

  ctx.save();
  // Translatăm originea în centrul noului canvas
  ctx.translate(canvas.width / 2, canvas.height / 2);
  // Rotim cu unghiul specificat în radiani
  ctx.rotate((normalizedDegrees * Math.PI) / 180);
  // Desenăm imaginea centrată
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();

  // Exportăm ca JPEG la calitate înaltă
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Decupează o imagine la coordonatele specificate (Crop)
 * @param imageSrc URL-ul sau DataURL-ul imaginii sursă
 * @param crop Coordonate normalizate (0..1) sau în pixeli ale zonei de decupare
 * @returns DataURL cu imaginea decupată
 */
export async function cropImage(
  imageSrc: string,
  crop: NormalizedCropArea
): Promise<string> {
  const img = await loadImage(imageSrc);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;

  // Detectăm dacă coordonatele sunt normalizate (0..1) sau pixeli absoluți
  const isNormalized = crop.width <= 1.0 && crop.height <= 1.0 && crop.x <= 1.0 && crop.y <= 1.0;

  let sx = isNormalized ? crop.x * natW : crop.x;
  let sy = isNormalized ? crop.y * natH : crop.y;
  let sWidth = isNormalized ? crop.width * natW : crop.width;
  let sHeight = isNormalized ? crop.height * natH : crop.height;

  // Clamping de siguranță pentru a preveni ieșirea din limitele imaginii
  sx = Math.max(0, Math.min(natW - 10, sx));
  sy = Math.max(0, Math.min(natH - 10, sy));
  sWidth = Math.max(10, Math.min(natW - sx, sWidth));
  sHeight = Math.max(10, Math.min(natH - sy, sHeight));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sWidth);
  canvas.height = Math.round(sHeight);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul 2D Canvas pentru decupare');
  }

  // Setăm opțiuni de randare de calitate maximă
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    img,
    Math.round(sx),
    Math.round(sy),
    Math.round(sWidth),
    Math.round(sHeight),
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Inversează imaginea în oglindă (Flip orizontal)
 */
export async function flipHorizontalImage(imageSrc: string): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nu s-a putut inițializa contextul 2D Canvas');

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Citește un fișier încărcat de utilizator (File) ca DataURL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Format neacceptat pentru citirea fișierului'));
      }
    };
    reader.onerror = () => reject(new Error('Eroare la citirea fișierului local'));
    reader.readAsDataURL(file);
  });
}

/**
 * Muta un element la un nou index în cadrul unui array (reordonare sigură)
 */
export function moveItemInArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex >= array.length) {
    return array;
  }
  const copy = [...array];
  const [movedItem] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, movedItem);
  return copy;
}
