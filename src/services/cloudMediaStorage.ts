/**
 * Media Storage Service pentru ParcOS & RXM Automobile
 *
 * Arhitectură Hibridă de Performanță:
 * 1. Direct-to-R2 Upload: Browserul trimite binarele direct în Cloudflare R2 prin presigned PUT URLs.
 *    0 KB bandwidth tranzitat prin Netcup VPS pentru pozele încărcate de dealeri.
 * 2. RXM Automobile Invariant: Showroom-ul oficial `rxm` folosește în continuare fluxul pe disc
 *    până la activarea explicită a flag-ului `VITE_ENABLE_RXM_R2_DIRECT === 'true'`.
 * 3. Zero-Crash Fallback: Dacă R2 este temporar indisponibil sau presign-ul eșuează, comută transparent
 *    pe uploadul pe disc (/rxm/api/upload) și apoi pe stocarea locală IndexedDB (Zero-crash guarantee).
 */

import { getMediaBlob } from '../utils/mediaVaultDb';
import { getAdminAuthHeaders } from '../utils/adminAuth';

export interface UploadProgressCallback {
  (current: number, total: number, percent: number): void;
}

/**
 * Determinare dacă upload-ul direct în Cloudflare R2 este activ pentru un tenant dat.
 * - Pentru toți dealerii terți ParcOS (ex: mpi_auto, test): ACTIV implicit
 * - Pentru RXM Automobile (rxm, rxmautomobile): ACTIV doar cu flag explicit
 */
export function isDirectR2UploadEnabled(dealerSlug: string = 'rxm'): boolean {
  const cleanSlug = (dealerSlug || 'rxm').toLowerCase().trim();
  if (cleanSlug !== 'rxm' && cleanSlug !== 'rxmautomobile') {
    return true;
  }
  return import.meta.env.VITE_ENABLE_RXM_R2_DIRECT === 'true';
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
 * Rezolvă orice sursă de imagine (string, Blob, File, IndexedDB URI) într-un Blob binar.
 */
async function resolveImageSourceToBlob(
  source: File | Blob | string
): Promise<{ blob: Blob | null; originalRef: string }> {
  if (typeof source === 'string') {
    if (source.startsWith('rxm-media://')) {
      const blob = await getMediaBlob(source);
      return { blob, originalRef: source };
    }
    if (source.startsWith('data:') || source.startsWith('blob:')) {
      const blob = await dataUrlOrBlobUrlToBlob(source);
      return { blob, originalRef: source };
    }
    return { blob: null, originalRef: source };
  }
  return { blob: source, originalRef: '' };
}

/**
 * Upload clasic pe discul serverului Netcup VPS (/rxm/api/upload).
 */
async function uploadToVpsDisk(
  carId: string,
  blob: Blob,
  index: number
): Promise<string | null> {
  try {
    const ext = blob.type && blob.type.includes('jpeg') ? 'jpg' : 'webp';
    const authHeaders = getAdminAuthHeaders();
    const apiRes = await fetch('/rxm/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'image/webp',
        'x-car-id': carId,
        'x-image-index': String(index),
        'x-file-ext': ext,
        ...authHeaders,
      },
      body: blob,
    });

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && json.url) {
        return json.url;
      }
    }
  } catch (err) {
    console.warn(`[cloudMediaStorage] Eșec upload VPS pentru ${carId} #${index}:`, err);
  }
  return null;
}

/**
 * Încarcă o singură imagine (cu selecție dinamică Direct-R2 sau VPS disk).
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

  const { blob: blobToUpload, originalRef } = await resolveImageSourceToBlob(imageSource);
  if (!blobToUpload) {
    return originalRef;
  }

  const ext = blobToUpload.type && blobToUpload.type.includes('jpeg') ? 'jpg' : 'webp';
  const filename = `photo_${String(index + 1).padStart(2, '0')}.${ext}`;

  // 1. Încercare Direct R2 dacă este activat
  if (isDirectR2UploadEnabled(dealerSlug)) {
    try {
      const authHeaders = getAdminAuthHeaders();
      const presignRes = await fetch('/api/media/presign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          tenantSlug: dealerSlug || 'rxm',
          mediaType: 'cars',
          carId,
          files: [
            {
              filename,
              contentType: blobToUpload.type || 'image/webp',
            },
          ],
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        if (presignData.success && Array.isArray(presignData.results) && presignData.results.length > 0) {
          const { uploadUrl, publicUrl } = presignData.results[0];
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': blobToUpload.type || 'image/webp',
            },
            body: blobToUpload,
          });

          if (putRes.ok) {
            return publicUrl;
          }
        }
      }
    } catch (r2Err) {
      console.warn(`[cloudMediaStorage] Direct R2 single upload eșuat pentru ${carId} #${index}, fallback VPS:`, r2Err);
    }
  }

  // 2. Upload pe discul VPS (/rxm/api/upload)
  const vpsUrl = await uploadToVpsDisk(carId, blobToUpload, index);
  if (vpsUrl) {
    return vpsUrl;
  }

  // 3. Fallback pe referința locală IndexedDB / Blob URL (Zero-crash)
  return originalRef || URL.createObjectURL(blobToUpload);
}

/**
 * Încarcă un lot de imagini cu suport pentru Direct Cloudflare R2 Upload.
 * Pentru dealeri terți: generează batch presigned URLs și transmite binarele direct în R2.
 * Pentru RXM / fallback: utilizează fluxul de scriere pe discul VPS Netcup.
 */
export async function uploadCarImagesBatch(
  carId: string,
  images: Array<File | Blob | string>,
  dealerSlug: string = 'rxm',
  onProgress?: UploadProgressCallback
): Promise<string[]> {
  const total = images.length;
  if (total === 0) return [];

  if (onProgress) {
    onProgress(0, total, 0);
  }

  const useDirectR2 = isDirectR2UploadEnabled(dealerSlug);

  if (useDirectR2) {
    try {
      // Rezolvăm toate sursele în paralel pentru a pregăti cererea batch către R2
      const resolved = await Promise.all(
        images.map(async (img, idx) => {
          if (
            typeof img === 'string' &&
            (img.startsWith('https://') || img.startsWith('http://') || img.startsWith('/'))
          ) {
            return { isAlreadyUrl: true, url: img, blob: null as Blob | null, originalRef: img, originalIndex: idx };
          }
          const { blob, originalRef } = await resolveImageSourceToBlob(img);
          return { isAlreadyUrl: false, url: '', blob, originalRef, originalIndex: idx };
        })
      );

      const itemsToUpload = resolved.filter(item => !item.isAlreadyUrl && item.blob !== null);

      if (itemsToUpload.length > 0) {
        const authHeaders = getAdminAuthHeaders();
        const presignRes = await fetch('/api/media/presign-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            tenantSlug: dealerSlug || 'rxm',
            mediaType: 'cars',
            carId,
            files: itemsToUpload.map(item => {
              const ext = item.blob!.type && item.blob!.type.includes('jpeg') ? 'jpg' : 'webp';
              return {
                filename: `photo_${String(item.originalIndex + 1).padStart(2, '0')}.${ext}`,
                contentType: item.blob!.type || 'image/webp',
              };
            }),
          }),
        });

        if (presignRes.ok) {
          const presignData = await presignRes.json();
          if (
            presignData.success &&
            Array.isArray(presignData.results) &&
            presignData.results.length === itemsToUpload.length
          ) {
            const resultsMap = new Map<number, string>();
            let completedCount = 0;

            for (let i = 0; i < itemsToUpload.length; i++) {
              const item = itemsToUpload[i];
              const { uploadUrl, publicUrl } = presignData.results[i];
              const blob = item.blob!;

              try {
                const putRes = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': blob.type || 'image/webp',
                  },
                  body: blob,
                });

                if (putRes.ok) {
                  resultsMap.set(item.originalIndex, publicUrl);
                } else {
                  console.warn(`[cloudMediaStorage] R2 PUT HTTP ${putRes.status} la #${item.originalIndex}, încercare VPS fallback...`);
                  const vpsUrl = await uploadToVpsDisk(carId, blob, item.originalIndex);
                  resultsMap.set(item.originalIndex, vpsUrl || item.originalRef || URL.createObjectURL(blob));
                }
              } catch (putErr) {
                console.warn(`[cloudMediaStorage] R2 PUT rețea eșuat la #${item.originalIndex}, VPS fallback:`, putErr);
                const vpsUrl = await uploadToVpsDisk(carId, blob, item.originalIndex);
                resultsMap.set(item.originalIndex, vpsUrl || item.originalRef || URL.createObjectURL(blob));
              }

              completedCount++;
              if (onProgress) {
                const pct = Math.round((completedCount / total) * 100);
                onProgress(completedCount, total, pct);
              }
            }

            // Reasamblare în ordinea exactă inițială a fotografiilor
            return resolved.map(item => {
              if (item.isAlreadyUrl) return item.url;
              return resultsMap.get(item.originalIndex) || item.originalRef || '';
            });
          }
        }
      } else {
        // Toate imaginile din listă erau deja URL-uri publice/statice
        if (onProgress) onProgress(total, total, 100);
        return resolved.map(item => item.url);
      }
    } catch (directErr) {
      console.warn('[cloudMediaStorage] Eroare în pipeline-ul Direct R2 Batch, comutare defensivă pe VPS:', directErr);
    }
  }

  // 2. Flux Secvențial pe VPS (pentru RXM fără flag sau ca fallback complet)
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
