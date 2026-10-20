/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Inbound SNS/SES Webhook & MIME Parsing Service (PMH-201)
 * Versiune: 1.1.0 • Sprint 2
 * Holding: CARVANA SRL • Invariante: Zero-Daemon VPS • X.509 Verification • Strict 21% TVA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Responsabilități PMH-201:
 * 1. Verificare semnătură criptografică AWS SNS (X.509 SHA1withRSA / SHA256withRSA)
 * 2. Confirmare automată SubscriptionConfirmation AWS SNS
 * 3. Filtru strict de idempotență RFC 2822 Message-ID
 * 4. Parsare MIME robustă (MIME-Version, multipart, decodare base64 / quoted-printable)
 * 5. Curățare Reply-Chain (eliminare istoric citat On ... wrote / În data de ... a scris)
 * 6. Identificare automată context vehicul (RXM-XXXX, CVN-XXXXX, VIN 17 caractere)
 * 7. Gestionare Dead Letter Queue (DLQ) pentru eșecuri de procesare
 */

import crypto from 'crypto';

// Cache în memorie pentru certificate X.509 SNS (URL -> PemString) pentru performanță
const certCache = new Map<string, { pem: string; expiresAt: number }>();
const CERT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore

export interface SNSMessagePayload {
  Type: 'Notification' | 'SubscriptionConfirmation' | 'UnsubscribeConfirmation';
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  Token?: string;
  UnsubscribeURL?: string;
}

export interface SESReceiptAction {
  type: string;
  topicArn?: string;
  bucketName?: string;
  objectKey?: string;
}

export interface SESMailHeader {
  name: string;
  value: string;
}

export interface SESInboundNotification {
  notificationType: string;
  mail: {
    timestamp: string;
    source: string;
    messageId: string;
    destination: string[];
    headersTruncated: boolean;
    headers: SESMailHeader[];
    commonHeaders: {
      from?: string[];
      to?: string[];
      subject?: string;
      messageId?: string;
      date?: string;
      returnPath?: string;
    };
  };
  receipt: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    spamVerdict: { status: string };
    virusVerdict: { status: string };
    spfVerdict: { status: string };
    dkimVerdict: { status: string };
    dmarcVerdict: { status: string };
    action: SESReceiptAction;
  };
  content?: string; // EML brut opțional transmis direct
}

export interface ParsedEmailAttachment {
  fileName: string;
  mimeType: string;
  fileSize: number;
  content: Buffer;
  contentId?: string;
}

export interface ParsedEmailMessage {
  messageId: string;
  from: string;
  senderName: string;
  to: string[];
  cc: string[];
  subject: string;
  date: Date;
  inReplyTo?: string;
  references: string[];
  bodyText: string;
  bodyHtml: string;
  cleanBodyText: string;
  attachments: ParsedEmailAttachment[];
  detectedVehicleId?: string;
  detectedVin?: string;
}

export interface InboundProcessResult {
  status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'SUBSCRIPTION_CONFIRMED' | 'DLQ_FAILED';
  messageId?: string;
  threadId?: string;
  vehicleId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Verificare Semnătură Criptografică AWS SNS (Security Gate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validează URL-ul certificatului de semnare AWS SNS.
 * Cerințe de securitate AWS:
 * - Protocol strict https://
 * - Hostname strict în domeniul amazonaws.com (ex: sns.eu-north-1.amazonaws.com)
 * - Cale ce se termină cu fișier .pem
 */
export function validateSNSCertUrl(certUrl: string): boolean {
  if (!certUrl || typeof certUrl !== 'string') return false;
  try {
    const parsed = new URL(certUrl);
    if (parsed.protocol !== 'https:') return false;
    // Format permis: sns.<region>.amazonaws.com
    const hostRegex = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;
    if (!hostRegex.test(parsed.hostname)) return false;
    if (!parsed.pathname.endsWith('.pem')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Construiește stringul canonic de semnare AWS SNS conform specificației oficiale.
 */
export function buildSNSCanonicalString(payload: SNSMessagePayload): string {
  const type = payload.Type;
  let canonical = '';

  if (type === 'Notification') {
    canonical += `Message\n${payload.Message}\n`;
    canonical += `MessageId\n${payload.MessageId}\n`;
    if (payload.Subject !== undefined && payload.Subject !== null) {
      canonical += `Subject\n${payload.Subject}\n`;
    }
    canonical += `Timestamp\n${payload.Timestamp}\n`;
    canonical += `TopicArn\n${payload.TopicArn}\n`;
    canonical += `Type\n${payload.Type}\n`;
  } else if (type === 'SubscriptionConfirmation' || type === 'UnsubscribeConfirmation') {
    canonical += `Message\n${payload.Message}\n`;
    canonical += `MessageId\n${payload.MessageId}\n`;
    if (payload.SubscribeURL) {
      canonical += `SubscribeURL\n${payload.SubscribeURL}\n`;
    }
    canonical += `Timestamp\n${payload.Timestamp}\n`;
    if (payload.Token) {
      canonical += `Token\n${payload.Token}\n`;
    }
    canonical += `TopicArn\n${payload.TopicArn}\n`;
    canonical += `Type\n${payload.Type}\n`;
  } else {
    throw new Error(`Tip de notificare SNS necunoscut: ${type}`);
  }

  return canonical;
}

/**
 * Descarcă certificatul X.509 de la URL-ul AWS specificat sau din cache.
 */
export async function fetchSNSCertificate(certUrl: string, fetchFn = fetch): Promise<string> {
  if (!validateSNSCertUrl(certUrl)) {
    throw new Error(`[SNS Security Gate] URL certificat nesigur sau nepermis: ${certUrl}`);
  }

  const cached = certCache.get(certUrl);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.pem;
  }

  const res = await fetchFn(certUrl);
  if (!res.ok) {
    throw new Error(`[SNS Security Gate] Nu s-a putut descărca certificatul (${res.status} ${res.statusText})`);
  }

  const pem = await res.text();
  certCache.set(certUrl, {
    pem,
    expiresAt: Date.now() + CERT_CACHE_TTL_MS,
  });

  return pem;
}

/**
 * Verifică integritatea și autenticitatea semnăturii AWS SNS.
 * Respinge orice cerere modificată, falsificată sau nesemnată.
 */
export async function verifySNSSignature(
  payload: SNSMessagePayload,
  options?: { certFetcher?: (url: string) => Promise<string> }
): Promise<boolean> {
  if (!payload || !payload.Signature || !payload.SigningCertURL) {
    return false;
  }

  if (!validateSNSCertUrl(payload.SigningCertURL)) {
    return false;
  }

  try {
    const certPem = options?.certFetcher
      ? await options.certFetcher(payload.SigningCertURL)
      : await fetchSNSCertificate(payload.SigningCertURL);

    const canonicalString = buildSNSCanonicalString(payload);
    const signature = Buffer.from(payload.Signature, 'base64');

    // SignatureVersion 1 = SHA1withRSA; SignatureVersion 2 = SHA256withRSA
    const algorithm = payload.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';

    const verifier = crypto.createVerify(algorithm);
    verifier.update(canonicalString, 'utf8');
    return verifier.verify(certPem, signature);
  } catch (err) {
    console.warn('[SNS Security Gate] Eroare la verificarea semnăturii:', (err as Error).message);
    return false;
  }
}

/**
 * Confirmă automat abonarea la Topic-ul AWS SNS (SubscriptionConfirmation).
 */
export async function confirmSNSSubscription(payload: SNSMessagePayload, fetchFn = fetch): Promise<boolean> {
  if (payload.Type !== 'SubscriptionConfirmation' || !payload.SubscribeURL) {
    return false;
  }
  try {
    const res = await fetchFn(payload.SubscribeURL);
    return res.ok;
  } catch (err) {
    console.error('[SNS Subscription] Eroare la apelul SubscribeURL:', (err as Error).message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Curățare Reply-Chain & Regex Detecție Vehicul / VIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Elimină istoricul repetitiv citat din mesaje de e-mail (On ... wrote, În data de ... a scris etc.)
 */
export function cleanReplyChain(text: string): string {
  if (!text) return '';

  const cleaned = text
    // On <date>, <someone> wrote:
    .replace(/(?:^|\n)On\s+[\s\S]+?wrote:[\s\S]*$/i, '')
    // În data de <date>, <cineva> a scris:
    .replace(/(?:^|\n)În\s+data\s+de\s+[\s\S]+?a\s+scris:[\s\S]*$/i, '')
    // La data de ...
    .replace(/(?:^|\n)La\s+data\s+de\s+[\s\S]+?a\s+scris:[\s\S]*$/i, '')
    // -----Original Message-----
    .replace(/(?:^|\n)-----+\s*Original\s+Message\s*-----+[\s\S]*$/i, '')
    // De la: ... Trimis la: ...
    .replace(/(?:^|\n)De\s+la:\s+[\s\S]+?Trimis\s+la:[\s\S]*$/i, '')
    // From: ... Sent: ...
    .replace(/(?:^|\n)From:\s+[\s\S]+?Sent:\s+[\s\S]*$/i, '')
    // Linii separatoare lungi (ex: _______________)
    .replace(/(?:^|\n)_{8,}[\s\S]*$/i, '')
    // Separator cu cratime: --- Răspuns / Original ---
    .replace(/(?:^|\n)-{3,}\s*(?:Răspuns|Original|Forwarded)[\s\S]*$/i, '')
    .trim();

  return cleaned || text.trim();
}

/**
 * Detectează contextul auto din subiect și corpul mesajului:
 * - Tag vehicul: RXM-XXXX, CVN-XXXXX, PARC-XXXX
 * - VIN auto (17 caractere alfanumerice excluzând literele I, O, Q)
 */
export function detectVehicleContext(
  subject: string,
  body: string
): { vehicleId?: string; vin?: string } {
  const combined = `${subject || ''}\n${body || ''}`;

  // 1. Căutare tag auto de tip RXM-1234, CVN-1024, PARC-99
  const tagMatch = combined.match(/\b(RXM|CVN|PARC)-[A-Z0-9]{3,8}\b/i);
  const vehicleId = tagMatch ? tagMatch[0].toUpperCase() : undefined;

  // 2. Căutare VIN conform standardului ISO 3779 (17 caractere fără I, O, Q)
  const vinMatch = combined.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
  const vin = vinMatch ? vinMatch[0].toUpperCase() : undefined;

  return { vehicleId, vin };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Parser MIME Robust RFC 2822 (Zero Dependențe Grele)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decodifică transfer encoding quoted-printable în text UTF-8.
 */
export function decodeQuotedPrintable(input: string): string {
  // Elimină soft line breaks: =\r\n sau =\n
  const unwrapped = input.replace(/=\r?\n/g, '');
  // Decodare secvențe =XX în octeți
  const bytes: number[] = [];
  for (let i = 0; i < unwrapped.length; i++) {
    if (unwrapped[i] === '=' && i + 2 < unwrapped.length) {
      const hex = unwrapped.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(unwrapped.charCodeAt(i));
  }
  return Buffer.from(bytes).toString('utf8');
}

/**
 * Decodifică antetele RFC 2047 (ex: =?UTF-8?B?...?= sau =?UTF-8?Q?...?=).
 */
export function decodeEncodedWords(header: string): string {
  if (!header || !header.includes('=?')) return header;

  return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      const enc = encoding.toUpperCase();
      if (enc === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'latin1');
      } else if (enc === 'Q') {
        const qDecoded = text.replace(/_/g, ' ');
        return decodeQuotedPrintable(qDecoded);
      }
    } catch {
      return text;
    }
    return text;
  });
}

/**
 * Extrage adresa de e-mail curată și numele din formatul "Nume <email@domeniu.ro>".
 */
export function parseEmailAddress(raw: string): { email: string; name: string } {
  if (!raw) return { email: '', name: '' };
  const decoded = decodeEncodedWords(raw).trim();
  const match = decoded.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);
  if (match) {
    return {
      name: (match[1] || '').trim(),
      email: (match[2] || '').trim().toLowerCase(),
    };
  }
  // Format direct email
  return {
    name: '',
    email: decoded.replace(/[<>]/g, '').trim().toLowerCase(),
  };
}

/**
 * Desface corpul EML multipart conform graniței (boundary).
 */
function parseMultipartParts(body: string, boundary: string): string[] {
  const parts: string[] = [];
  const cleanBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const delimiterRegex = new RegExp(`--${cleanBoundary}(?:--)?\r?\n?`, 'g');

  const rawSplits = body.split(delimiterRegex);
  for (const part of rawSplits) {
    const trimmed = part.trim();
    if (trimmed && trimmed !== '--') {
      parts.push(part);
    }
  }
  return parts;
}

/**
 * Parser complet RFC 2822 MIME.
 * Suportă mesaje simple, multipart/mixed, multipart/alternative și atașamente base64.
 */
export function parseRawMimeEmail(rawEml: string | Buffer): ParsedEmailMessage {
  const rawString = typeof rawEml === 'string' ? rawEml : rawEml.toString('latin1');

  // Separare anteturi de corp la prima linie goală
  const splitIndex = rawString.search(/\r?\n\r?\n/);
  const headerSection = splitIndex !== -1 ? rawString.substring(0, splitIndex) : rawString;
  const bodySection = splitIndex !== -1 ? rawString.substring(splitIndex).replace(/^\r?\n\r?\n/, '') : '';

  // Desfacere unfolding pentru anteturi multiline (RFC 2822: linie începută cu spațiu/tab)
  const unfoldedHeaders = headerSection.replace(/\r?\n[ \t]+/g, ' ');
  const headerLines = unfoldedHeaders.split(/\r?\n/);

  const headers: Record<string, string> = {};
  for (const line of headerLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const val = line.substring(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  const rawFrom = headers['from'] || '';
  const parsedFrom = parseEmailAddress(rawFrom);
  const subject = decodeEncodedWords(headers['subject'] || '(Fără Subiect)');
  const rawDate = headers['date'] || '';
  const parsedDate = rawDate ? new Date(rawDate) : new Date();

  // RFC 2822 Message-ID (sau generat dacă lipsește)
  let messageId = headers['message-id'] || '';
  messageId = messageId.replace(/[<>]/g, '').trim();
  if (!messageId) {
    messageId = `msg-${crypto.randomUUID()}@inbound.parcos.ro`;
  }

  const inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'].replace(/[<>]/g, '').trim() : undefined;
  const referencesRaw = headers['references'] || '';
  const references = referencesRaw
    .split(/\s+/)
    .map((r) => r.replace(/[<>]/g, '').trim())
    .filter(Boolean);

  const toList = (headers['to'] || '')
    .split(',')
    .map((t) => parseEmailAddress(t).email)
    .filter(Boolean);

  const ccList = (headers['cc'] || '')
    .split(',')
    .map((t) => parseEmailAddress(t).email)
    .filter(Boolean);

  const contentTypeHeader = headers['content-type'] || 'text/plain; charset=utf-8';
  let bodyText = '';
  let bodyHtml = '';
  const attachments: ParsedEmailAttachment[] = [];

  function processMimePart(partHeadersStr: string, partBodyStr: string) {
    const partHeadersUnfolded = partHeadersStr.replace(/\r?\n[ \t]+/g, ' ');
    const pLines = partHeadersUnfolded.split(/\r?\n/);
    const pHeaders: Record<string, string> = {};
    for (const pl of pLines) {
      const cIdx = pl.indexOf(':');
      if (cIdx > 0) {
        pHeaders[pl.substring(0, cIdx).trim().toLowerCase()] = pl.substring(cIdx + 1).trim();
      }
    }

    const cType = pHeaders['content-type'] || 'text/plain';
    const cTransfer = (pHeaders['content-transfer-encoding'] || '7bit').toLowerCase();
    const cDisposition = pHeaders['content-disposition'] || '';

    // Verifică dacă este atașament
    const isAttachment =
      cDisposition.toLowerCase().includes('attachment') ||
      cType.toLowerCase().includes('name=') ||
      cDisposition.toLowerCase().includes('filename=');

    if (isAttachment) {
      // Extrage nume fișier
      let fileName = 'attachment.bin';
      const fnMatch = cDisposition.match(/filename\*?=(?:"([^"]+)"|([^;\s]+))/i) ||
                      cType.match(/name\*?=(?:"([^"]+)"|([^;\s]+))/i);
      if (fnMatch) {
        fileName = decodeEncodedWords(fnMatch[1] || fnMatch[2] || 'attachment.bin');
      }

      const mimeType = cType.split(';')[0].trim().toLowerCase() || 'application/octet-stream';
      let contentBuffer: Buffer;

      if (cTransfer === 'base64') {
        const cleanBase64 = partBodyStr.replace(/\s+/g, '');
        contentBuffer = Buffer.from(cleanBase64, 'base64');
      } else if (cTransfer === 'quoted-printable') {
        contentBuffer = Buffer.from(decodeQuotedPrintable(partBodyStr), 'utf8');
      } else {
        contentBuffer = Buffer.from(partBodyStr, 'latin1');
      }

      attachments.push({
        fileName,
        mimeType,
        fileSize: contentBuffer.length,
        content: contentBuffer,
        contentId: pHeaders['content-id']?.replace(/[<>]/g, ''),
      });
      return;
    }

    // Parte recursivă multipart
    if (cType.toLowerCase().startsWith('multipart/')) {
      const bMatch = cType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
      if (bMatch) {
        const b = bMatch[1] || bMatch[2];
        const subParts = parseMultipartParts(partBodyStr, b);
        for (const sp of subParts) {
          const spSplit = sp.search(/\r?\n\r?\n/);
          if (spSplit !== -1) {
            processMimePart(sp.substring(0, spSplit), sp.substring(spSplit).replace(/^\r?\n\r?\n/, ''));
          } else {
            processMimePart('', sp);
          }
        }
      }
      return;
    }

    // Text sau HTML
    let decodedPartText = partBodyStr;
    if (cTransfer === 'base64') {
      try {
        decodedPartText = Buffer.from(partBodyStr.replace(/\s+/g, ''), 'base64').toString('utf8');
      } catch {
        decodedPartText = partBodyStr;
      }
    } else if (cTransfer === 'quoted-printable') {
      decodedPartText = decodeQuotedPrintable(partBodyStr);
    }

    if (cType.toLowerCase().includes('text/html')) {
      bodyHtml = decodedPartText;
    } else if (cType.toLowerCase().includes('text/plain')) {
      bodyText = decodedPartText;
    }
  }

  // Verificare dacă întregul mesaj este multipart
  if (contentTypeHeader.toLowerCase().startsWith('multipart/')) {
    const boundaryMatch = contentTypeHeader.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1] || boundaryMatch[2];
      const parts = parseMultipartParts(bodySection, boundary);
      for (const part of parts) {
        const partSplit = part.search(/\r?\n\r?\n/);
        if (partSplit !== -1) {
          processMimePart(part.substring(0, partSplit), part.substring(partSplit).replace(/^\r?\n\r?\n/, ''));
        } else {
          processMimePart('', part);
        }
      }
    }
  } else {
    // Mesaj simplu fără multipart
    processMimePart(headerSection, bodySection);
  }

  // Fallback: dacă nu avem text dar avem HTML, extragem text curățat
  if (!bodyText && bodyHtml) {
    bodyText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const cleanBodyText = cleanReplyChain(bodyText);
  const { vehicleId: detectedVehicleId, vin: detectedVin } = detectVehicleContext(subject, cleanBodyText);

  return {
    messageId,
    from: parsedFrom.email,
    senderName: parsedFrom.name,
    to: toList,
    cc: ccList,
    subject,
    date: parsedDate,
    inReplyTo,
    references,
    bodyText,
    bodyHtml,
    cleanBodyText,
    attachments,
    detectedVehicleId,
    detectedVin,
  };
}
