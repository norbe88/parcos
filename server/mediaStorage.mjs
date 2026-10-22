/**
 * RXM Automobile — Local Disk Media Storage Manager
 * Salvează imaginile direct pe discul serverului Netcup VPS (sau local în dev)
 * Servite prin rutele canonice /cars/ și aliasul /rxm/cars/ cu revalidare inteligentă
 */

import fs from 'fs';
import path from 'path';

/**
 * Rezolvă directorul de bază pentru stocare:
 * Prioritate 1: MEDIA_STORAGE_PATH (configurat în Dockerfile / docker-compose, ex: /data/parcos/cars)
 * Prioritate 2: /data/parcos/cars (host bind mount pe Netcup VPS)
 * Prioritate 3: /data/rxm-showroom/cars (locație secundară Netcup VPS)
 * Prioritate 4: public/cars (local dev în repo)
 */
export function getBaseStoragePath() {
  if (process.env.MEDIA_STORAGE_PATH) {
    try {
      const resolved = path.resolve(process.env.MEDIA_STORAGE_PATH);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      return resolved;
    } catch {}
  }
  if (fs.existsSync('/data/parcos/cars')) {
    return '/data/parcos/cars';
  }
  if (fs.existsSync('/data/rxm-showroom/cars')) {
    return '/data/rxm-showroom/cars';
  }
  return path.join(process.cwd(), 'public', 'cars');
}

/**
 * Salvează un buffer binar de imagine pe disc pentru un anumit vehicul
 * @param {string} carId - ID-ul mașinii (ex: "car-rxm-1792255717677")
 * @param {Buffer} buffer - Datele binare ale imaginii
 * @param {number} index - Indexul fotografiei în galerie
 * @param {string} extension - Extensia fișierului (implicit "webp")
 * @returns {Promise<string>} URL-ul public relativ de acces
 */
export async function saveCarImageToDisk(carId, buffer, index = 0, extension = 'webp') {
  // Sanitizare strictă împotriva path traversal
  const safeCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const baseStorage = getBaseStoragePath();
  const targetDir = path.join(baseStorage, safeCarId);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const paddedIndex = String(index + 1).padStart(2, '0');
  const filename = `image_${paddedIndex}.${extension.replace('.', '')}`;
  const filePath = path.join(targetDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  // Dacă stocarea persistentă este în /data/..., salvăm și o copie în public/cars dacă există pentru servire statică instantanee
  try {
    const publicCarsDir = path.join(process.cwd(), 'public', 'cars', safeCarId);
    if (publicCarsDir !== targetDir) {
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(publicCarsDir, filename), buffer);
    }
  } catch {}

  // Returnează URL-ul public canonic servit de server cu token de invalidare cache
  const timestamp = Date.now();
  return `/cars/${safeCarId}/${filename}?t=${timestamp}`;
}

/**
 * Salvează o imagine transmisă ca Data URL (base64) sau Blob
 */
export async function saveCarImageDataUrl(carId, dataUrl, index = 0) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Data URL invalid');
  }

  let extension = 'webp';
  let base64Data = dataUrl;

  const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (matches) {
    extension = matches[1].toLowerCase().replace('jpeg', 'jpg');
    base64Data = matches[2];
  }

  const buffer = Buffer.from(base64Data, 'base64');
  return await saveCarImageToDisk(carId, buffer, index, extension);
}

/**
 * Șterge directorul de imagini al unei mașini la ștergerea vehiculului
 */
export async function deleteCarMediaFromDisk(carId) {
  try {
    const safeCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseStorage = getBaseStoragePath();
    const targetDir = path.join(baseStorage, safeCarId);
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }
    const publicCarsDir = path.join(process.cwd(), 'public', 'cars', safeCarId);
    if (publicCarsDir !== targetDir && fs.existsSync(publicCarsDir)) {
      await fs.promises.rm(publicCarsDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[mediaStorage] Nu s-a putut șterge directorul media pentru ${carId}:`, err.message);
  }
}
