/**
 * Media Storage Service pentru RXM Automobile
 * Încarcă fotografiile mașinilor direct pe discul Netcup VPS (/rxm/api/upload)
 * cu fallback transparent către IndexedDB/stocare locală când serverul este offline.
 */

import { getMediaBlob } from '../utils/mediaVaultDb';
import { getAdminAuthHeaders } from '../utils/adminAuth';

export interface UploadProgressCallback {
  (current: number, total: number, percent: number): void;
}

/**
 * Convertește un data URL sau un blob URL într-un Blob binar.
 */
async function dataUrlOrBlobUrlToBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch (err) {
    console.warn('[cloudMediaStorage] Eroare la conversia URL-ului în Blob:', err);
    return null;
  }
}

/**
 * Încarcă o singură imagine pe discul Netcup VPS (/rxm/api/upload).
 *
 * Sursele suportate:
 * 1. URL extern ("https://...") sau cale statică ("/...") -> returnează direct fără re-upload
 * 2. Referință locală IndexedDB ("rxm-media://...") -> extrage din IndexedDB și uploadează
 * 3. Data URL ("data:image/...") sau Blob URL ("blob:...") -> convertește la Blob și uploadează
 * 4. Obiect File sau Blob -> upload direct
 *
 * Dacă serverul este offline sau upload-ul eșuează, returnează sursa locală inițială (zero crash).
 */
export async function uploadCarImage(
  carId: string,
  imageSource: File | Blob | string,
  index: number,
  dealerSlug: string = 'rxm'
): Promise<string> {
  // Dacă imageSource este string și este deja un URL public/static, returnează direct
  if (typeof imageSource === 'string') {
    if (
      imageSource.startsWith('https://') ||
      imageSource.startsWith('http://') ||
      imageSource.startsWith('/')
    ) {
      return imageSource;
    }
  }

  let blobToUpload: Blob | null = null;
  const originalReference = typeof imageSource === 'string' ? imageSource : '';

  try {
    if (typeof imageSource === 'string') {
      if (imageSource.startsWith('rxm-media://')) {
        blobToUpload = await getMediaBlob(imageSource);
        if (!blobToUpload) {
          console.warn(`[cloudMediaStorage] Blob-ul IndexedDB nu a fost găsit pentru ${imageSource}`);
          return imageSource;
        }
      } else if (imageSource.startsWith('data:') || imageSource.startsWith('blob:')) {
        blobToUpload = await dataUrlOrBlobUrlToBlob(imageSource);
        if (!blobToUpload) return imageSource;
      } else {
        // String necunoscut, returnează as-is
        return imageSource;
      }
    } else {
      // File sau Blob direct
      blobToUpload = imageSource;
    }

    // 1. Prioritate 1: Upload direct pe discul VPS Netcup (/rxm/api/upload)
    try {
      const ext = blobToUpload.type && blobToUpload.type.includes('jpeg') ? 'jpg' : 'webp';
      const authHeaders = getAdminAuthHeaders();
      const apiRes = await fetch('/rxm/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': blobToUpload.type || 'image/webp',
          'x-car-id': carId,
          'x-image-index': String(index),
          'x-file-ext': ext,
          ...authHeaders,
        },
        body: blobToUpload,
      });

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && json.success && json.url) {
          return json.url;
        }
      }
    } catch {
      // API micro-serviciu indisponibil temporar, fallback pe stocarea locală IndexedDB
    }

    // 2. Fallback pe referința locală IndexedDB / Blob URL (Zero-crash)
    return originalReference || (blobToUpload ? URL.createObjectURL(blobToUpload) : '');
  } catch (err) {
    console.warn(`[cloudMediaStorage] Excepție la upload-ul imaginii #${index} pentru ${carId}:`, err);
    return originalReference || (blobToUpload ? URL.createObjectURL(blobToUpload) : '');
  }
}

/**
 * Încarcă un lot de imagini cu raportare granulară de progres.
 * Execuție secvențială optimizată pentru serverul Netcup VPS.
 */
export async function uploadCarImagesBatch(
  carId: string,
  images: Array<File | Blob | string>,
  dealerSlug: string = 'rxm',
  onProgress?: UploadProgressCallback
): Promise<string[]> {
  const total = images.length;
  if (total === 0) return [];

  // Raportează progres inițial 0%
  if (onProgress) {
    onProgress(0, total, 0);
  }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < total; i++) {
    const source = images[i];
    try {
      const publicUrl = await uploadCarImage(carId, source, i, dealerSlug);
      uploadedUrls.push(publicUrl);
    } catch (err) {
      console.warn(`[cloudMediaStorage] Eșec la imaginea #${i} din lotul ${carId}:`, err);
      uploadedUrls.push(typeof source === 'string' ? source : '');
    }

    const current = i + 1;
    const percent = Math.round((current / total) * 100);
    if (onProgress) {
      onProgress(current, total, percent);
    }
  }

  return uploadedUrls;
}

/**
 * Șterge fotografiile asociate unei mașini.
 * Pe Netcup VPS, ștergerea de pe disc este orchestrată automat de endpoint-ul DELETE /api/vehicles/:id.
 */
export async function deleteCarImages(
  _carId: string,
  _dealerSlug: string = 'rxm'
): Promise<boolean> {
  return true;
}
