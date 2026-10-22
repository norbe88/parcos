/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Storage Lifecycle & Google Drive Vault Engine (PMH-404)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * Hard Cap: <= 500 MB local disk • Eviction LRU: 400 MB • Encryption: AES-256-GCM
 * ════════════════════════════════════════════════════════════════════════════════
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getSql } from './db.mjs';

export const HARD_CAP_BYTES = 500 * 1024 * 1024;         // 500 MB limită absolută pe VPS
export const EVICTION_THRESHOLD_BYTES = 400 * 1024 * 1024; // 400 MB trigger LRU

const MAGIC_HEADER = Buffer.from('PV01'); // ParcOS Vault v1 magic header

/**
 * Returnează calea directorului local de uploaduri
 */
export function getUploadsDir() {
  const uploadsPath = process.env.UPLOADS_DIR 
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  return uploadsPath;
}

/**
 * Returnează calea directorului cache pentru vault (backup local/mock)
 */
export function getVaultCacheDir() {
  const vaultPath = path.resolve(process.cwd(), '.vault_cache');
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  return vaultPath;
}

/**
 * Derivă cheia de 32 bytes AES-256 din VAULT_MASTER_KEY
 */
export function deriveVaultKey(masterKey = process.env.VAULT_MASTER_KEY) {
  const secret = String(masterKey || 'carvana-parcos-vault-master-key-2026-vps-500mb');
  return crypto.scryptSync(secret, 'carvana-parcos-vault-salt-netcup', 32);
}

/**
 * Criptează un Buffer folosind AES-256-GCM
 * Structură: [PV01 (4B)][IV (12B)][AuthTag (16B)][Ciphertext]
 */
export function encryptBuffer(buffer, key = deriveVaultKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([MAGIC_HEADER, iv, authTag, encrypted]);
}

/**
 * Decriptează un Buffer criptat cu AES-256-GCM
 */
export function decryptBuffer(encryptedBuffer, key = deriveVaultKey()) {
  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length < 32) {
    throw new Error('Buffer invalid sau prea scurt pentru decriptare');
  }

  const magic = encryptedBuffer.subarray(0, 4);
  if (!magic.equals(MAGIC_HEADER)) {
    throw new Error('Magic header invalid: nu este un fișier ParcOS Vault (PV01)');
  }

  const iv = encryptedBuffer.subarray(4, 16);
  const authTag = encryptedBuffer.subarray(16, 32);
  const ciphertext = encryptedBuffer.subarray(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Calculează consumul exact de spațiu pe disc al fișierelor locale (bytes)
 */
export async function getStorageUsageBytes(dirPath = getUploadsDir()) {
  if (!fs.existsSync(dirPath)) return 0;

  let totalBytes = 0;
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        totalBytes += stats.size;
      }
    }
  }

  scan(dirPath);
  return totalBytes;
}

/**
 * Obține token OAuth2 pentru Google Drive API folosind Service Account JSON
 */
async function getGoogleDriveAccessToken() {
  const saJsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJsonStr) return null;

  try {
    const sa = JSON.parse(saJsonStr);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat,
    })).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${claimSet}`);
    const signature = signer.sign(sa.private_key, 'base64url');
    const assertion = `${header}.${claimSet}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      return tokenData.access_token;
    }
  } catch (err) {
    console.warn('[Drive Auth] Nu s-a putut genera token Service Account:', err.message);
  }
  return null;
}

/**
 * Încarcă un fișier local criptat în Google Drive Vault (sau cache local de backup)
 */
export async function uploadToVault(localPath, metadata = {}) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Fișierul local nu există: ${localPath}`);
  }

  const rawBytes = fs.readFileSync(localPath);
  const checksum = crypto.createHash('sha256').update(rawBytes).digest('hex');
  const encryptedBytes = encryptBuffer(rawBytes);

  const folderId = process.env.GDRIVE_VAULT_FOLDER_ID;
  const accessToken = await getGoogleDriveAccessToken();

  let driveFileId = null;

  if (accessToken && folderId) {
    // Încărcare reală în Google Drive Vault
    try {
      const fileName = path.basename(localPath) + '.pv01';
      const meta = {
        name: fileName,
        parents: [folderId],
        description: `ParcOS Encrypted Vault - Checksum: ${checksum}`,
      };

      const boundary = '-------ParcOSVaultBoundary' + Date.now();
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = Buffer.concat([
        Buffer.from(
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(meta) +
          delimiter +
          'Content-Type: application/octet-stream\r\n\r\n'
        ),
        encryptedBytes,
        Buffer.from(closeDelimiter),
      ]);

      const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (driveRes.ok) {
        const driveData = await driveRes.json();
        driveFileId = driveData.id;
      }
    } catch (err) {
      console.warn('[Storage Vault] Eroare la streaming pe Google Drive:', err.message);
    }
  }

  // Fallback garantat în Vault Cache local dacă Drive nu este accesibil
  if (!driveFileId) {
    driveFileId = 'vault-' + crypto.randomUUID();
    const vaultCachePath = path.join(getVaultCacheDir(), `${driveFileId}.pv01`);
    fs.writeFileSync(vaultCachePath, encryptedBytes);
  }

  return {
    driveFileId,
    encryptedSize: encryptedBytes.length,
    originalSize: rawBytes.length,
    checksum,
  };
}

/**
 * Descarcă și decriptează un fișier din Google Drive Vault și îl trimite prin streaming pe HTTP
 */
export async function streamFileFromVault(driveFileId, res, options = {}) {
  let encryptedBytes = null;
  const accessToken = await getGoogleDriveAccessToken();

  if (accessToken && !driveFileId.startsWith('vault-')) {
    try {
      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (driveRes.ok) {
        const arrBuf = await driveRes.arrayBuffer();
        encryptedBytes = Buffer.from(arrBuf);
      }
    } catch (err) {
      console.warn('[Stream Vault] Eroare descărcare Google Drive:', err.message);
    }
  }

  // Verificare în vault cache local dacă nu a putut fi descărcat de pe Drive
  if (!encryptedBytes) {
    const cachePath = path.join(getVaultCacheDir(), `${driveFileId}.pv01`);
    if (fs.existsSync(cachePath)) {
      encryptedBytes = fs.readFileSync(cachePath);
    }
  }

  if (!encryptedBytes) {
    throw new Error(`Atașamentul solicitat din vault nu a putut fi localizat (${driveFileId})`);
  }

  // Decriptare în RAM (fără a scrie fișiere necriptate pe disc)
  const decryptedBytes = decryptBuffer(encryptedBytes);

  const fileName = options.fileName || 'document.pdf';
  const mimeType = options.mimeType || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': decryptedBytes.length,
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Cache-Control': 'private, max-age=3600',
    'X-ParcOS-Storage-Driver': 'GDRIVE_VAULT',
  });

  res.end(decryptedBytes);
}

/**
 * Verifică și aplică cota de stocare pe disc (LRU Eviction către Google Drive Vault)
 */
export async function enforceStorageQuota(options = {}) {
  const uploadsDir = options.uploadsDir || getUploadsDir();
  const currentUsage = await getStorageUsageBytes(uploadsDir);
  const threshold = options.thresholdBytes || EVICTION_THRESHOLD_BYTES;

  if (currentUsage <= threshold) {
    return {
      status: 'OK',
      evicted: 0,
      freedBytes: 0,
      remaining: currentUsage,
      threshold,
      hardCap: HARD_CAP_BYTES,
    };
  }

  console.log(`🧹 [LRU Eviction Triggered] Consum disk (${(currentUsage / (1024 * 1024)).toFixed(1)} MB) > Threshold (${(threshold / (1024 * 1024)).toFixed(0)} MB). Inițiere arhivare securizată în Google Drive Vault...`);

  // Adunare fișiere locale cu timestamp mtime
  const files = [];
  function gatherFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        gatherFiles(fullPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        files.push({
          path: fullPath,
          size: stat.size,
          mtime: stat.mtimeMs,
          fileName: entry.name,
        });
      }
    }
  }

  gatherFiles(uploadsDir);
  // Sortare LRU: cele mai vechi fișiere primele
  files.sort((a, b) => a.mtime - b.mtime);

  let evictedCount = 0;
  let freedBytes = 0;
  let usage = currentUsage;

  const sql = getSql();

  for (const file of files) {
    if (usage <= threshold) break;

    try {
      // 1. Încărcare criptată în Vault
      const vaultResult = await uploadToVault(file.path, { fileName: file.fileName });

      // 2. Actualizare DB mail_attachments dacă există referință
      try {
        await sql`
          UPDATE mail_attachments 
          SET storage_driver = 'GDRIVE_VAULT',
              storage_key = ${vaultResult.driveFileId},
              is_encrypted = TRUE
          WHERE file_name = ${file.fileName} OR storage_key = ${file.path}
        `;
      } catch {}

      // 3. Ștergere locală sigură doar după confirmarea vault
      fs.unlinkSync(file.path);
      evictedCount++;
      freedBytes += file.size;
      usage -= file.size;

      console.log(`  🔒 [Evacuat în Vault] ${file.fileName} (${(file.size / 1024).toFixed(1)} KB) -> ID: ${vaultResult.driveFileId}`);
    } catch (err) {
      console.warn(`  ⚠️ Nu s-a putut evacua fișierul ${file.path}:`, err.message);
    }
  }

  return {
    status: 'EVICTED',
    evicted: evictedCount,
    freedBytes,
    remaining: usage,
    threshold,
    hardCap: HARD_CAP_BYTES,
  };
}

/**
 * Returnează statistici agregate de stocare pentru widget-ul Admin Portal
 */
export async function getStorageStats() {
  const localBytes = await getStorageUsageBytes();
  let fileCount = 0;
  const uploadsDir = getUploadsDir();
  if (fs.existsSync(uploadsDir)) {
    const entries = fs.readdirSync(uploadsDir);
    fileCount = entries.length;
  }

  // Estimare bytes în Google Drive Vault din DB
  let vaultBytes = 0;
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT COALESCE(SUM(file_size), 0)::bigint AS vault_bytes 
      FROM mail_attachments 
      WHERE storage_driver = 'GDRIVE_VAULT'
    `;
    if (rows && rows[0]) {
      vaultBytes = Number(rows[0].vault_bytes || 0);
    }
  } catch {}

  return {
    localBytes,
    quotaBytes: HARD_CAP_BYTES,
    thresholdBytes: EVICTION_THRESHOLD_BYTES,
    vaultBytes,
    fileCount,
    isWithinQuota: localBytes <= HARD_CAP_BYTES,
  };
}
