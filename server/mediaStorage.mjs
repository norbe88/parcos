/**
 * RXM Automobile / ParcOS — Hybrid & Cloudflare R2 Media Storage Manager
 * 
 * Arhitectură Duală de Stocare:
 * 1. Prioritate 1: Cloudflare R2 Object Storage (Zero Egress, ultra-rapid nod București)
 * 2. Fallback / Local: Salvează imaginile direct pe discul serverului Netcup VPS (sau local în dev)
 * Servite prin CDN Cloudflare R2 sau rutele canonice /cars/ și aliasul /rxm/cars/ cu revalidare inteligentă.
 */

import fs from 'fs';
import path from 'path';
// Dynamic optional import for @aws-sdk (prevents crashing minimal or legacy container environments)
let S3Client = null;
let PutObjectCommand = null;
let ListObjectsV2Command = null;
let DeleteObjectsCommand = null;
let getSignedUrl = null;

try {
  const s3Module = await import('@aws-sdk/client-s3');
  S3Client = s3Module.S3Client;
  PutObjectCommand = s3Module.PutObjectCommand;
  ListObjectsV2Command = s3Module.ListObjectsV2Command;
  DeleteObjectsCommand = s3Module.DeleteObjectsCommand;
  const presignerModule = await import('@aws-sdk/s3-request-presigner');
  getSignedUrl = presignerModule.getSignedUrl;
} catch {
  // @aws-sdk absent in minimal environments; mediaStorage will gracefully fall back to local disk
}

// Auto-loader zero-dependency pentru .env dacă există în rădăcină
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
  }
} catch {}

let _r2Client = null;

/**
 * Returnează instanța S3 Client configurată pentru Cloudflare R2 dacă există credențiale
 */
export function getR2Client() {
  if (_r2Client) return _r2Client;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

  if (S3Client && accessKeyId && secretAccessKey && endpoint) {
    try {
      _r2Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      return _r2Client;
    } catch (err) {
      console.warn('[mediaStorage] Eroare inițializare client Cloudflare R2:', err.message);
    }
  }
  return null;
}

export function getR2BucketName() {
  return process.env.CLOUDFLARE_R2_BUCKET || 'parcos-media';
}

export function getR2PublicBaseUrl() {
  return (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');
}

/**
 * Rezolvă directorul de bază pentru stocare locală:
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
 * Salvează un buffer binar de imagine pe Cloudflare R2 (sau disc local ca fallback)
 * @param {string} carId - ID-ul mașinii (ex: "car-rxm-1792255717677")
 * @param {Buffer} buffer - Datele binare ale imaginii
 * @param {number} index - Indexul fotografiei în galerie
 * @param {string} extension - Extensia fișierului (implicit "webp")
 * @returns {Promise<string>} URL-ul public CDN de acces sau relativ local /cars/... sau /rxm/cars/...
 */
export async function saveCarImageToDisk(carId, buffer, index = 0, extension = 'webp') {
  const safeCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanExt = extension.replace('.', '').toLowerCase();
  const paddedIndex = String(index + 1).padStart(2, '0');
  const filename = `image_${paddedIndex}.${cleanExt}`;

  // 1. Încercare Upload Cloudflare R2 (Ultra-fast CDN)
  const r2 = getR2Client();
  const bucketName = getR2BucketName();
  const publicBaseUrl = getR2PublicBaseUrl();

  if (r2 && publicBaseUrl) {
    try {
      const mimeType = cleanExt === 'png' ? 'image/png' :
                       cleanExt === 'jpg' || cleanExt === 'jpeg' ? 'image/jpeg' :
                       cleanExt === 'avif' ? 'image/avif' : 'image/webp';
      const key = `cars/${safeCarId}/${filename}`;

      await r2.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      // Returnează URL-ul direct CDN public din Cloudflare R2
      return `${publicBaseUrl}/${key}`;
    } catch (r2Err) {
      console.warn('[mediaStorage] Eroare la upload în Cloudflare R2, se face fallback pe disc local:', r2Err.message);
    }
  }

  // 2. Salvare pe Disc Local (Fallback Netcup VPS / Dev)
  const baseStorage = getBaseStoragePath();
  const targetDir = path.join(baseStorage, safeCarId);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  // Copie în public/cars dacă există pentru servire statică instantanee locală
  try {
    const publicCarsDir = path.join(process.cwd(), 'public', 'cars', safeCarId);
    if (publicCarsDir !== targetDir) {
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(publicCarsDir, filename), buffer);
    }
  } catch {}

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
 * Șterge directorul de imagini al unei mașini (din Cloudflare R2 și de pe disc)
 */
export async function deleteCarMediaFromDisk(carId) {
  const safeCarId = carId.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Ștergere din Cloudflare R2
  const r2 = getR2Client();
  const bucketName = getR2BucketName();
  if (r2) {
    try {
      const prefix = `cars/${safeCarId}/`;
      const listed = await r2.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      }));

      if (listed.Contents && listed.Contents.length > 0) {
        await r2.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: listed.Contents.map(obj => ({ Key: obj.Key })),
          },
        }));
      }
    } catch (r2Err) {
      console.warn(`[mediaStorage] Eroare ștergere R2 pentru ${safeCarId}:`, r2Err.message);
    }
  }

  // 2. Ștergere locală (dacă există)
  try {
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
    console.warn(`[mediaStorage] Nu s-a putut șterge directorul local pentru ${carId}:`, err.message);
  }
}

/**
 * Generează un Presigned PUT URL pentru upload direct din browser către Cloudflare R2
 * @param {Object} params
 * @param {string} [params.tenantSlug='rxm'] - Slug-ul dealerului (ex: "mpi_auto", "rxm")
 * @param {'car' | 'branding' | 'landing'} [params.mediaType='car'] - Categoria de fișier
 * @param {string} [params.carId] - ID-ul mașinii (obligatoriu dacă mediaType === 'car')
 * @param {string} params.filename - Numele fișierului (ex: "logo.webp", "hero-loop.mp4")
 * @param {string} [params.contentType='image/webp'] - Tipul MIME (ex: "image/webp", "video/mp4")
 * @param {number} [params.expiresInSeconds=600] - Valabilitate token în secunde (default 10 min)
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, key: string } | null>}
 */
export async function createPresignedUploadUrl({
  tenantSlug = 'rxm',
  mediaType = 'car',
  carId,
  filename,
  contentType = 'image/webp',
  expiresInSeconds = 600,
}) {
  const r2 = getR2Client();
  const bucketName = getR2BucketName();
  const publicBaseUrl = getR2PublicBaseUrl();

  if (!r2 || !publicBaseUrl) {
    return null;
  }

  try {
    const safeTenant = String(tenantSlug || 'rxm').trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = path.basename(String(filename || `file_${Date.now()}`)).replace(/[^a-zA-Z0-9_.-]/g, '_');

    let key = '';
    if (mediaType === 'car' || mediaType === 'cars') {
      const safeCarId = String(carId || 'temp_car').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      key = `tenants/${safeTenant}/cars/${safeCarId}/${safeFilename}`;
    } else if (mediaType === 'branding') {
      key = `tenants/${safeTenant}/branding/${safeFilename}`;
    } else if (mediaType === 'landing') {
      key = `tenants/${safeTenant}/landing/${safeFilename}`;
    } else {
      key = `tenants/${safeTenant}/misc/${safeFilename}`;
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
    const publicUrl = `${publicBaseUrl}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (err) {
    console.error('[mediaStorage] Eroare la generarea URL-ului semnat R2:', err);
    return null;
  }
}

/**
 * Șterge un obiect din Cloudflare R2 după cheie.
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function deleteMediaFromR2(key) {
  const r2 = getR2Client();
  const bucketName = getR2BucketName();
  if (!r2 || !key) return false;

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await r2.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.warn(`[mediaStorage] Eroare la ștergerea cheii ${key} din R2:`, err.message);
    return false;
  }
}


