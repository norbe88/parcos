// =========================================================================
// PARCOS SAAS SHOWCASE — Client Demo OCR Service cu Quota & Image Optimizer
// Invariante: Zero chei în browser, Max 3 scanări / IP & Device, Toate actele EU
// =========================================================================

export interface DemoVehicleData {
  docOriginCountry: 'RO' | 'DE' | 'AT' | 'FR' | 'IT' | 'NL' | 'BE' | 'US' | 'OTHER';
  docType: string;
  brand: string;
  model: string;
  versionTrim?: string;
  vin: string;
  year: number;
  registrationDate?: string;
  powerKw?: number;
  powerHp?: number;
  engineCc?: number;
  fuelType?: string;
  color?: string;
  bodyType?: string;
  civNumber?: string;
  plateNumber?: string;
  euroNorm?: string;
  co2?: string;
  confidenceScore?: number;
}

export interface DemoScanResult {
  success: boolean;
  remainingScans: number;
  limitReached: boolean;
  vehicleData?: DemoVehicleData;
  error?: string;
  message?: string;
}

export interface DemoScanQuota {
  used: number;
  remaining: number;
  maxAllowed: number;
  isLimitReached: boolean;
  deviceToken: string;
}

const STORAGE_KEY = 'parcos_demo_ocr_quota_v1';
export const DEMO_MAX_SCANS = 3;

/**
 * Obține sau generează un token anonim unic per dispozitiv (UUID v4)
 */
export function getOrCreateDeviceToken(): string {
  try {
    const existing = localStorage.getItem('parcos_device_uuid');
    if (existing && existing.length >= 16) return existing;
    const newToken = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('parcos_device_uuid', newToken);
    return newToken;
  } catch {
    return 'dev_ephemeral_' + Date.now();
  }
}

/**
 * Citește cota locală stocată în browser
 */
export function getLocalDemoQuota(): DemoScanQuota {
  const deviceToken = getOrCreateDeviceToken();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const used = Math.min(DEMO_MAX_SCANS, Math.max(0, Number(data.used) || 0));
      const remaining = Math.max(0, DEMO_MAX_SCANS - used);
      return {
        used,
        remaining,
        maxAllowed: DEMO_MAX_SCANS,
        isLimitReached: remaining <= 0,
        deviceToken
      };
    }
  } catch {}

  return {
    used: 0,
    remaining: DEMO_MAX_SCANS,
    maxAllowed: DEMO_MAX_SCANS,
    isLimitReached: false,
    deviceToken
  };
}

/**
 * Actualizează cota locală după o scanare
 */
export function saveLocalDemoQuota(remainingFromServer?: number): DemoScanQuota {
  const current = getLocalDemoQuota();
  let newRemaining: number;
  let newUsed: number;

  if (typeof remainingFromServer === 'number') {
    newRemaining = Math.max(0, Math.min(DEMO_MAX_SCANS, remainingFromServer));
    newUsed = DEMO_MAX_SCANS - newRemaining;
  } else {
    newUsed = Math.min(DEMO_MAX_SCANS, current.used + 1);
    newRemaining = Math.max(0, DEMO_MAX_SCANS - newUsed);
  }

  const updated: DemoScanQuota = {
    used: newUsed,
    remaining: newRemaining,
    maxAllowed: DEMO_MAX_SCANS,
    isLimitReached: newRemaining <= 0,
    deviceToken: current.deviceToken
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return updated;
}

/**
 * Interoghează cota reală rămasă direct din server
 */
export async function fetchServerDemoQuota(): Promise<DemoScanQuota> {
  const token = getOrCreateDeviceToken();
  try {
    const res = await fetch(`/api/demo/ocr-quota?clientToken=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'x-client-token': token
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.remainingScans === 'number') {
        return saveLocalDemoQuota(data.remainingScans);
      }
    }
  } catch (err) {
    console.warn('[DemoOcrService] Eroare la verificarea cotei pe server:', err);
  }

  return getLocalDemoQuota();
}

/**
 * Comprimă și redimensionează imaginea pentru upload rapid pe mobil (<500KB)
 */
export async function optimizeDocumentImage(file: Blob | File, maxWidth = 1920): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formatul imaginii nu a putut fi decodat.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback dacă canvas nu este disponibil
          const fullDataUrl = e.target?.result as string;
          const comma = fullDataUrl.indexOf(',');
          return resolve({
            base64Data: fullDataUrl.slice(comma + 1),
            mimeType: 'image/jpeg'
          });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const comma = compressedDataUrl.indexOf(',');

        resolve({
          base64Data: compressedDataUrl.slice(comma + 1),
          mimeType: 'image/jpeg'
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Curăță și normalizează mesajele de eroare OCR pentru a preveni scurgerea
 * de detalii tehnice despre backend (Google Gemini, endpoint-uri, chei sau coduri brute de stare).
 */
export function sanitizePublicOcrError(raw: any): string {
  if (!raw) {
    return 'Documentul nu a putut fi analizat automat. Vă rugăm să folosiți o fotografie clară a talonului sau brief-ului.';
  }
  const text = typeof raw === 'string' ? raw : (raw.error || raw.message || '');
  const lower = text.toLowerCase();

  // Păstrăm mesajele prietenoase legate strict de limita de utilizare a testului demo
  if (lower.includes('limit') || lower.includes('3 scanări') || lower.includes('solicită un cont')) {
    return text;
  }

  // Mascăm orice referință la Google, Gemini, coduri HTTP de server sau API
  if (
    lower.includes('gemini') ||
    lower.includes('google') ||
    lower.includes('api error') ||
    lower.includes('status 4') ||
    lower.includes('status 5') ||
    lower.includes('403') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('422') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('generativelanguage') ||
    lower.includes('proxy')
  ) {
    return 'Documentul nu a putut fi procesat automat. Vă rugăm să asigurați o iluminare bună și o focalizare clară a talonului sau brief-ului și să reîncercați.';
  }

  return text;
}

/**
 * Apelează endpoint-ul securizat ParcOS pentru scanarea documentului real
 */
export async function scanDemoVehicleDocument(
  fileOrBlob: Blob | File,
  onProgress?: (progress: number, message: string) => void
): Promise<DemoScanResult> {
  const localQuota = getLocalDemoQuota();
  if (localQuota.isLimitReached) {
    return {
      success: false,
      remainingScans: 0,
      limitReached: true,
      error: 'Ați atins limita de 3 scanări gratuite pentru test.',
      message: 'Ai testat scannerul ParcOS AI pe 3 documente reale. Pentru scanări nelimitate în parcul tău auto, solicită un cont complet de dealer.'
    };
  }

  onProgress?.(15, '> [PARCOS] Optimizare cadru & compresie adaptivă HD...');
  const { base64Data, mimeType } = await optimizeDocumentImage(fileOrBlob);

  onProgress?.(35, '> [AI-OCR 3.5] Conexiune securizată către Gateway ParcOS...');
  const deviceToken = getOrCreateDeviceToken();

  try {
    const res = await fetch('/api/demo/ocr-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-token': deviceToken
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        clientToken: deviceToken
      })
    });

    if (res.status === 429) {
      saveLocalDemoQuota(0);
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        remainingScans: 0,
        limitReached: true,
        error: errData.error || 'Ați atins limita de 3 scanări demo.',
        message: errData.message || 'Limita de 3 teste a fost atinsă pentru acest dispozitiv/IP.'
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(sanitizePublicOcrError(errJson.error || errJson.message || `Eroare server (${res.status})`));
    }

    const data = await res.json();
    onProgress?.(85, '> [PARSER] Fişă tehnică extrasă conform Directivei Europene 1999/37/CE...');

    if (data.success && data.vehicleData) {
      saveLocalDemoQuota(data.remainingScans);
      return {
        success: true,
        remainingScans: data.remainingScans ?? Math.max(0, localQuota.remaining - 1),
        limitReached: data.limitReached || data.remainingScans === 0,
        vehicleData: data.vehicleData
      };
    }

    throw new Error(sanitizePublicOcrError(data.error || 'Răspuns invalid de la scannerul AI.'));
  } catch (err: any) {
    console.error('[DemoOcrService] Eroare la apelul OCR:', err);
    return {
      success: false,
      remainingScans: localQuota.remaining,
      limitReached: localQuota.isLimitReached,
      error: sanitizePublicOcrError(err.message || 'Eroare de conexiune la serviciul OCR. Vă rugăm să reîncercați.')
    };
  }
}

