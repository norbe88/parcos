/**
 * RXM Automobile — Local Disk Media Storage Manager
 * Salvează imaginile direct pe discul serverului Hetzner VPS (sau local în dev)
 * Servite direct prin Nginx cu Cache-Control de 1 an
 */

import fs from 'fs';
import path from 'path';

// Calea de bază pentru stocare: în Docker este /data/rxm-showroom/cars, local în dev este public/cars
const BASE_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'public', 'cars');

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
  const targetDir = path.join(BASE_STORAGE_PATH, safeCarId);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const paddedIndex = String(index + 1).padStart(2, '0');
  const filename = `image_${paddedIndex}.${extension.replace('.', '')}`;
  const filePath = path.join(targetDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  // Returnează URL-ul public relativ servit de Nginx
  return `/rxm/cars/${safeCarId}/${filename}`;
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
    const targetDir = path.join(BASE_STORAGE_PATH, safeCarId);
    if (fs.existsSync(targetDir)) {
      await fs.promises.rm(targetDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[mediaStorage] Nu s-a putut șterge directorul media pentru ${carId}:`, err.message);
  }
}
