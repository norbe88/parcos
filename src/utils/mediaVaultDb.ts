/**
 * src/utils/mediaVaultDb.ts
 * Vault Binar IndexedDB pentru stocarea fotografiilor auto fără Base64 în LocalStorage
 * Gestionează persistarea fișierelor WebP mari și rezolvarea lor rapidă prin Blob URLs.
 */

const DB_NAME = 'rxm_media_vault';
const DB_VERSION = 1;
const STORE_NAME = 'car_photos';

export interface StoredPhotoRecord {
  key: string;          // ex: rxm-media://cars/car-123/img_0.webp
  carId: string;
  index: number;
  blob: Blob;
  width?: number;
  height?: number;
  sizeBytes: number;
  createdAt: string;
}

// Cache în memorie pentru Blob URLs create prin URL.createObjectURL()
// Garantează acces instant la 60fps fără flicker
const objectUrlMemoryCache = new Map<string, string>();
const pendingLoads = new Map<string, Promise<string | null>>();

let dbInstancePromise: Promise<IDBDatabase> | null = null;

/**
 * Inițializează baza de date IndexedDB cu magazinul de obiecte dedicat
 */
export function getMediaDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB nu este suportat în acest mediu.'));
  }

  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('carId', 'carId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Nu s-a putut deschide baza de date IndexedDB'));
    };
  });

  return dbInstancePromise;
}

/**
 * Salvează un singur Blob WebP în IndexedDB sub o cheie unică structurată
 */
export async function saveMediaBlob(
  key: string,
  blob: Blob,
  meta: { carId?: string; index?: number; width?: number; height?: number } = {}
): Promise<string> {
  const db = await getMediaDb();
  const carId = meta.carId || key.split('/')[3] || 'unknown_car';
  const index = meta.index ?? 0;

  const record: StoredPhotoRecord = {
    key,
    carId,
    index,
    blob,
    width: meta.width,
    height: meta.height,
    sizeBytes: blob.size,
    createdAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => {
      // Reîmprospătăm cache-ul din memorie
      if (objectUrlMemoryCache.has(key)) {
        try {
          URL.revokeObjectURL(objectUrlMemoryCache.get(key)!);
        } catch {}
      }
      const newUrl = URL.createObjectURL(blob);
      objectUrlMemoryCache.set(key, newUrl);
      resolve(key);
    };

    req.onerror = () => {
      reject(req.error || new Error(`Eroare la salvarea fotografiei ${key}`));
    };
  });
}

/**
 * Salvează un lot întreg de fotografii pentru un vehicul
 * Returnează lista compactă de chei URI: ['rxm-media://cars/{carId}/img_0.webp', ...]
 */
export async function saveMediaBlobsBatch(
  carId: string,
  blobs: Blob[],
  dimensions?: { width: number; height: number }[]
): Promise<string[]> {
  const keys: string[] = [];
  for (let i = 0; i < blobs.length; i++) {
    const key = `rxm-media://cars/${carId}/img_${i}.webp`;
    const dim = dimensions ? dimensions[i] : undefined;
    await saveMediaBlob(key, blobs[i], {
      carId,
      index: i,
      width: dim?.width,
      height: dim?.height
    });
    keys.push(key);
  }
  return keys;
}

/**
 * Extrage un Blob binar din IndexedDB după cheie
 */
export async function getMediaBlob(key: string): Promise<Blob | null> {
  const db = await getMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.get(key);

    req.onsuccess = () => {
      const record = req.result as StoredPhotoRecord | undefined;
      resolve(record?.blob || null);
    };

    req.onerror = () => {
      reject(req.error || new Error(`Eroare la citirea fotografiei ${key}`));
    };
  });
}

/**
 * Returnează toate fotografiile stocate pentru un vehicul specific
 */
export async function getMediaBlobsForCar(carId: string): Promise<StoredPhotoRecord[]> {
  const db = await getMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('carId');
    const req = index.getAll(carId);

    req.onsuccess = () => {
      const records = (req.result as StoredPhotoRecord[] || []).sort((a, b) => a.index - b.index);
      resolve(records);
    };

    req.onerror = () => {
      reject(req.error || new Error(`Eroare la extragerea fotografiilor mașinii ${carId}`));
    };
  });
}

/**
 * Șterge toate fotografiile asociate unei mașini din IndexedDB
 */
export async function deleteMediaForCar(carId: string): Promise<void> {
  const records = await getMediaBlobsForCar(carId);
  if (records.length === 0) return;

  const db = await getMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const record of records) {
      store.delete(record.key);
      if (objectUrlMemoryCache.has(record.key)) {
        try {
          URL.revokeObjectURL(objectUrlMemoryCache.get(record.key)!);
        } catch {}
        objectUrlMemoryCache.delete(record.key);
      }
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Preîncarcă asincron o listă de chei media în memoria ObjectURL
 */
export async function preloadMediaKeys(keys: string[]): Promise<Map<string, string>> {
  const mediaKeys = keys.filter(k => k.startsWith('rxm-media://'));
  const results = new Map<string, string>();

  await Promise.all(
    mediaKeys.map(async (key) => {
      if (objectUrlMemoryCache.has(key)) {
        results.set(key, objectUrlMemoryCache.get(key)!);
        return;
      }

      if (pendingLoads.has(key)) {
        const url = await pendingLoads.get(key)!;
        if (url) results.set(key, url);
        return;
      }

      const promise = (async () => {
        try {
          const blob = await getMediaBlob(key);
          if (blob) {
            const url = URL.createObjectURL(blob);
            objectUrlMemoryCache.set(key, url);
            return url;
          }
        } catch (e) {
          console.warn(`Nu s-a putut preîncărca ${key}:`, e);
        }
        return null;
      })();

      pendingLoads.set(key, promise);
      const resolved = await promise;
      pendingLoads.delete(key);
      if (resolved) results.set(key, resolved);
    })
  );

  return results;
}

/**
 * Rezolvă un URL de imagine din inventar.
 * - Dacă este o cale statică (/cars/...) sau URL web (http/https): îl returnează intact.
 * - Dacă este o cheie `rxm-media://...`: returnează Blob URL-ul din cache.
 *   Dacă nu este încă în cache, declanșează încărcarea asincronă și returnează temporar cheia sau un placeholder.
 */
export function resolveMediaUrl(url: string | undefined): string {
  if (!url) return '/images/placeholder-car.webp';

  // 1. Căi statice normale
  if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 2. Cheie internă IndexedDB Vault
  if (url.startsWith('rxm-media://')) {
    if (objectUrlMemoryCache.has(url)) {
      return objectUrlMemoryCache.get(url)!;
    }

    // Declanșează încărcarea asincronă dacă nu este deja în curs
    if (!pendingLoads.has(url)) {
      const promise = (async () => {
        try {
          const blob = await getMediaBlob(url);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            objectUrlMemoryCache.set(url, blobUrl);
            // Emite eveniment global pentru componentele care ascultă rezolvări foto
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('rxm_media_resolved', { detail: { key: url, blobUrl } }));
            }
            return blobUrl;
          }
        } catch (e) {
          console.warn(`Eroare rezolvare media ${url}:`, e);
        }
        return null;
      })();
      pendingLoads.set(url, promise);
    }
  }

  return url;
}
