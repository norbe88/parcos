/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Google Drive Vault Storage Driver (Cold Storage)
 * Versiune: 1.1.0 • Sprint 1 (PMH-104)
 * Holding: CARVANA SRL • Invariante: Zero-Daemon VPS • Zero-Disk Buffering • AES-256-GCM
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Driver modular conectat prin Google Drive API v3 (Service Account) pentru arhivarea
 * permanentă și gratuită a e-mailurilor brute și atașamentelor mari.
 * 
 * Structura folderelor pe Google Drive:
 * ParcOS Vault (root)
 * ├── dealers/
 * │   ├── {dealer_id}/
 * │   │   ├── threads/
 * │   │   │   └── {thread_id}/
 * │   │   │       ├── {message_id}.eml.enc      # EML criptat AES-256-GCM
 * │   │   │       └── attachments/
 * │   │   │           └── {attachment_id}_{filename}
 */

import crypto from 'crypto';
import { Readable, Transform } from 'stream';

// Invariant antet magic pentru payload-uri criptate (ParcOS Vault v1)
const VAULT_MAGIC_HEADER = Buffer.from('PV01', 'ascii'); // 4 bytes
const IV_LENGTH = 12; // 12 bytes IV recomandat pentru AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes Auth Tag pentru integritate cryptographică

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri?: string;
  token_uri?: string;
}

export interface VaultUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isEncrypted: boolean;
  driveFolderId: string;
  webViewLink?: string;
}

export interface VaultQuotaInfo {
  totalBytes: number;
  usedBytes: number;
  usagePercent: number;
  isCritical: boolean; // True dacă utilizarea depășește 80% din cotă
}

export interface UploadRawEmailOptions {
  dealerId: string;
  threadId: string;
  messageId: string;
  rawEml: Buffer | string;
}

export interface UploadAttachmentOptions {
  dealerId: string;
  threadId: string;
  attachmentId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
  encrypt?: boolean;
}

export interface DownloadStreamOptions {
  fileId: string;
  isEncrypted?: boolean;
  dealerId?: string;
}

export class GoogleDriveVaultService {
  private serviceAccount: ServiceAccountCredentials | null = null;
  private rootFolderId: string = '';
  private masterKey: string = '';
  private cachedAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  // Cache în memorie pentru foldere: key = `${parentId}:${name}` -> folderId
  private folderCache: Map<string, string> = new Map();

  constructor(options?: {
    serviceAccountJson?: string;
    rootFolderId?: string;
    vaultMasterKey?: string;
  }) {
    this.initCredentials(options);
  }

  /**
   * Inițializează credențialele din parametru sau variabilele de mediu
   */
  private initCredentials(options?: {
    serviceAccountJson?: string;
    rootFolderId?: string;
    vaultMasterKey?: string;
  }) {
    // 1. Service Account JSON (suportă string brut sau base64)
    const rawJson = options?.serviceAccountJson || process.env.GDRIVE_SERVICE_ACCOUNT_JSON || '';
    if (rawJson) {
      try {
        let decoded = rawJson.trim();
        if (!decoded.startsWith('{')) {
          decoded = Buffer.from(decoded, 'base64').toString('utf8');
        }
        this.serviceAccount = JSON.parse(decoded);
      } catch (err: any) {
        console.warn('[GDriveVault] Avertisment: Nu s-a putut parsa GDRIVE_SERVICE_ACCOUNT_JSON:', err.message);
      }
    }

    // 2. Folderul rădăcină al arhivei
    this.rootFolderId = options?.rootFolderId || process.env.GDRIVE_VAULT_ROOT_FOLDER_ID || '';

    // 3. Cheia master de criptare (32 bytes hex)
    this.masterKey = options?.vaultMasterKey || process.env.VAULT_MASTER_KEY || '';
    if (this.masterKey && this.masterKey.length < 64) {
      console.warn('[GDriveVault] Avertisment: VAULT_MASTER_KEY trebuie să aibă minim 64 de caractere hex (32 bytes).');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔐 CRIPTARE AES-256-GCM CU IZOLARE STRICTĂ PER DEALER
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Derivează o cheie simetrică unică de 32 bytes per dealer folosind HMAC-SHA256
   * Invariant: Dealerul A nu poate decripta niciodată datele dealerului B, chiar dacă obține acces la Drive.
   */
  public deriveDealerKey(dealerId: string): Buffer {
    if (!this.masterKey) {
      throw new Error('❌ [GDriveVault] VAULT_MASTER_KEY nu este configurată în mediu.');
    }
    const cleanMasterKey = this.masterKey.padEnd(64, '0').slice(0, 64);
    return crypto
      .createHmac('sha256', Buffer.from(cleanMasterKey, 'hex'))
      .update(dealerId)
      .digest();
  }

  /**
   * Criptează un buffer cu AES-256-GCM.
   * Format payload: [MAGIC_HEADER (4B)] + [IV (12B)] + [AUTH_TAG (16B)] + [CIPHERTEXT]
   */
  public encryptBuffer(plainBuffer: Buffer, dealerId: string): Buffer {
    const key = this.deriveDealerKey(dealerId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([VAULT_MAGIC_HEADER, iv, authTag, encrypted]);
  }

  /**
   * Decriptează un payload AES-256-GCM produs de encryptBuffer
   */
  public decryptBuffer(encryptedBuffer: Buffer, dealerId: string): Buffer {
    if (encryptedBuffer.length < VAULT_MAGIC_HEADER.length + IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('❌ [GDriveVault] Buffer-ul criptat este invalid sau corupt (lungime insuficientă).');
    }

    // Verificare Magic Header
    const magic = encryptedBuffer.subarray(0, VAULT_MAGIC_HEADER.length);
    let offset = 0;
    if (magic.equals(VAULT_MAGIC_HEADER)) {
      offset = VAULT_MAGIC_HEADER.length;
    }

    const iv = encryptedBuffer.subarray(offset, offset + IV_LENGTH);
    const authTag = encryptedBuffer.subarray(offset + IV_LENGTH, offset + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encryptedBuffer.subarray(offset + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = this.deriveDealerKey(dealerId);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔑 GOOGLE SERVICE ACCOUNT OAUTH2 (ZERO EXTERNAL DEPENDENCIES)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Obține un access token OAuth2 valid pentru Google Drive API v3
   * Folosește semnătură JWT RS256 nativă (RFC 7523) cu cache și reînnoire transparentă.
   */
  private async getAccessToken(): Promise<string> {
    const nowSec = Math.floor(Date.now() / 1000);
    if (this.cachedAccessToken && this.tokenExpiresAt > nowSec + 60) {
      return this.cachedAccessToken;
    }

    if (!this.serviceAccount) {
      throw new Error('❌ [GDriveVault] Google Service Account nu este configurat (GDRIVE_SERVICE_ACCOUNT_JSON lipsește).');
    }

    // Construire JWT Header & Payload
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: this.serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signInput = `${b64Header}.${b64Payload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(this.serviceAccount.private_key, 'base64url');
    const assertion = `${signInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`❌ [GDriveVault] Eroare la obținerea OAuth token: ${res.status} ${errText}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedAccessToken = data.access_token;
    this.tokenExpiresAt = nowSec + data.expires_in;

    return this.cachedAccessToken;
  }

  /**
   * Execută o cerere HTTP către Google Drive API cu exponential backoff pe 429 / 5xx
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries = 4): Promise<Response> {
    const backoffs = [1000, 5000, 30000, 120000]; // 1s, 5s, 30s, 2m

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const token = await this.getAccessToken();
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);

        const res = await fetch(url, { ...options, headers });

        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt < retries) {
            const delay = backoffs[attempt] || 5000;
            console.warn(`⏳ [GDriveVault] Rate limit / Server error (${res.status}). Retry în ${delay}ms... (încercare ${attempt + 1}/${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        return res;
      } catch (err: any) {
        if (attempt < retries) {
          const delay = backoffs[attempt] || 5000;
          console.warn(`⏳ [GDriveVault] Eroare de rețea (${err.message}). Retry în ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }

    throw new Error(`❌ [GDriveVault] Eșec apel Google Drive API după ${retries} încercări.`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 📂 GESTIUNE STRUCTURĂ FOLDERE PER DEALER
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Căută sau creează un folder Google Drive în directorul părinte
   * Folosește cache în memorie pentru a minimiza apelurile către API (cota 1.000 req/100s)
   */
  public async getOrCreateFolder(parentFolderId: string, folderName: string): Promise<string> {
    const cacheKey = `${parentFolderId}:${folderName}`;
    const cached = this.folderCache.get(cacheKey);
    if (cached) return cached;

    // 1. Căutare folder existent
    const q = `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;

    const res = await this.fetchWithRetry(searchUrl, { method: 'GET' });
    if (res.ok) {
      const data = (await res.json()) as { files?: Array<{ id: string; name: string }> };
      if (data.files && data.files.length > 0) {
        const folderId = data.files[0].id;
        this.folderCache.set(cacheKey, folderId);
        return folderId;
      }
    }

    // 2. Creare folder nou dacă nu există
    const createUrl = 'https://www.googleapis.com/drive/v3/files?fields=id,name';
    const createRes = await this.fetchWithRetry(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`❌ [GDriveVault] Nu s-a putut crea folderul '${folderName}': ${createRes.status} ${err}`);
    }

    const created = (await createRes.json()) as { id: string; name: string };
    this.folderCache.set(cacheKey, created.id);
    return created.id;
  }

  /**
   * Rezolvă arborele de directoare conform specificației:
   * root -> dealers -> {dealer_id} -> threads -> {thread_id} -> (attachments)
   */
  public async resolveThreadFolders(dealerId: string, threadId: string): Promise<{
    threadFolderId: string;
    attachmentsFolderId: string;
  }> {
    const rootId = this.rootFolderId || 'root';

    // 1. dealers/
    const dealersFolderId = await this.getOrCreateFolder(rootId, 'dealers');

    // 2. dealers/{dealer_id}/
    const dealerFolderId = await this.getOrCreateFolder(dealersFolderId, dealerId);

    // 3. dealers/{dealer_id}/threads/
    const threadsRootId = await this.getOrCreateFolder(dealerFolderId, 'threads');

    // 4. dealers/{dealer_id}/threads/{thread_id}/
    const threadFolderId = await this.getOrCreateFolder(threadsRootId, threadId);

    // 5. dealers/{dealer_id}/threads/{thread_id}/attachments/
    const attachmentsFolderId = await this.getOrCreateFolder(threadFolderId, 'attachments');

    return { threadFolderId, attachmentsFolderId };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 📤 UPLOAD E-MAILURI & ATAȘAMENTE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Încarcă un e-mail brut EML criptat AES-256-GCM
   */
  public async uploadEmailRaw(options: UploadRawEmailOptions): Promise<VaultUploadResult> {
    const { dealerId, threadId, messageId, rawEml } = options;

    const emlBuffer = Buffer.isBuffer(rawEml) ? rawEml : Buffer.from(rawEml, 'utf8');
    const encryptedPayload = this.encryptBuffer(emlBuffer, dealerId);

    const { threadFolderId } = await this.resolveThreadFolders(dealerId, threadId);
    const fileName = `${messageId.replace(/[<>:"/\\|?*]/g, '_')}.eml.enc`;

    return this.uploadMultipartFile({
      parentFolderId: threadFolderId,
      fileName,
      mimeType: 'application/octet-stream',
      data: encryptedPayload,
      isEncrypted: true,
    });
  }

  /**
   * Încarcă un atașament (PDF, DOCX, imagine CIV) cu opțiune de criptare AES-256-GCM
   */
  public async uploadAttachment(options: UploadAttachmentOptions): Promise<VaultUploadResult> {
    const { dealerId, threadId, attachmentId, fileName, mimeType, data, encrypt = false } = options;

    const payload = encrypt ? this.encryptBuffer(data, dealerId) : data;
    const cleanFileName = `${attachmentId}_${fileName.replace(/[/\\?%*:|"<>]/g, '_')}${encrypt ? '.enc' : ''}`;

    const { attachmentsFolderId } = await this.resolveThreadFolders(dealerId, threadId);

    return this.uploadMultipartFile({
      parentFolderId: attachmentsFolderId,
      fileName: cleanFileName,
      mimeType: encrypt ? 'application/octet-stream' : mimeType,
      data: payload,
      isEncrypted: encrypt,
    });
  }

  /**
   * Upload intern multipart Google Drive API v3
   */
  private async uploadMultipartFile(params: {
    parentFolderId: string;
    fileName: string;
    mimeType: string;
    data: Buffer;
    isEncrypted: boolean;
  }): Promise<VaultUploadResult> {
    const { parentFolderId, fileName, mimeType, data, isEncrypted } = params;

    const boundary = `-------ParcOSVaultBoundary${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [parentFolderId],
      properties: {
        parcosEncrypted: isEncrypted ? 'true' : 'false',
        parcosUploadedAt: new Date().toISOString(),
      },
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`
      ),
      data,
      Buffer.from(closeDelimiter),
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink';
    const res = await this.fetchWithRetry(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartRequestBody.length),
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`❌ [GDriveVault] Upload eșuat pentru '${fileName}': ${res.status} ${err}`);
    }

    const result = (await res.json()) as {
      id: string;
      name: string;
      size?: string;
      mimeType: string;
      webViewLink?: string;
    };

    return {
      fileId: result.id,
      fileName: result.name,
      fileSize: data.length,
      mimeType: result.mimeType,
      isEncrypted,
      driveFolderId: parentFolderId,
      webViewLink: result.webViewLink,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 📥 STREAMING DOWNLOAD & DECRIPTARE DIRECTĂ CĂTRE CLIENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Descarcă un fișier din Google Drive prin streaming direct
   * Dacă fișierul este criptat, îl decriptează pe parcurs fără scriere pe discul VPS (zero disk footprint!).
   */
  public async downloadFileStream(options: DownloadStreamOptions): Promise<Readable> {
    const { fileId, isEncrypted = false, dealerId } = options;

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await this.fetchWithRetry(downloadUrl, { method: 'GET' });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`❌ [GDriveVault] Nu s-a putut descărca fișierul '${fileId}': ${res.status} ${err}`);
    }

    if (!res.body) {
      throw new Error(`❌ [GDriveVault] Răspunsul pentru '${fileId}' nu conține corp de stream.`);
    }

    const nodeStream = Readable.fromWeb(res.body as any);

    // Dacă fișierul nu este criptat, returnăm stream-ul direct
    if (!isEncrypted) {
      return nodeStream;
    }

    if (!dealerId) {
      throw new Error('❌ [GDriveVault] dealerId este obligatoriu pentru decriptarea fișierului.');
    }

    // Pentru fișiere criptate AES-GCM, este necesară verificarea auth tag-ului
    // Bufferizăm stream-ul în memorie volatilă pentru decriptare precisă (zero disk)
    const chunks: Buffer[] = [];
    return new Promise<Readable>((resolve, reject) => {
      nodeStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      nodeStream.on('error', (err) => reject(err));
      nodeStream.on('end', () => {
        try {
          const encryptedBuffer = Buffer.concat(chunks);
          const decryptedBuffer = this.decryptBuffer(encryptedBuffer, dealerId);
          resolve(Readable.from(decryptedBuffer));
        } catch (decErr) {
          reject(decErr);
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 📊 MONITORIZARE COTĂ DRIVE & ALERTE SLACK
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verifică cota de stocare Google Drive și semnalează dacă depășește pragul de 80%
   */
  public async checkVaultQuota(): Promise<VaultQuotaInfo> {
    const url = 'https://www.googleapis.com/drive/v3/about?fields=storageQuota';
    const res = await this.fetchWithRetry(url, { method: 'GET' });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`❌ [GDriveVault] Eroare la verificarea cotei Drive: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      storageQuota?: {
        limit?: string;
        usage?: string;
        usageInDrive?: string;
      };
    };

    const quota = data.storageQuota || {};
    const totalBytes = Number(quota.limit) || 15 * 1024 * 1024 * 1024; // Implicit 15 GB dacă e nelimitat
    const usedBytes = Number(quota.usage) || 0;
    const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
    const isCritical = usagePercent >= 80;

    if (isCritical) {
      console.warn(`⚠️ [GDriveVault CRITICAL] Cota Google Drive este la ${usagePercent.toFixed(1)}% (${(usedBytes / 1e9).toFixed(2)} GB / ${(totalBytes / 1e9).toFixed(2)} GB)!`);
    }

    return {
      totalBytes,
      usedBytes,
      usagePercent,
      isCritical,
    };
  }
}

// Singleton export pentru reutilizare facilă în API routes
let vaultServiceInstance: GoogleDriveVaultService | null = null;

export function getGoogleDriveVaultService(): GoogleDriveVaultService {
  if (!vaultServiceInstance) {
    vaultServiceInstance = new GoogleDriveVaultService();
  }
  return vaultServiceInstance;
}
