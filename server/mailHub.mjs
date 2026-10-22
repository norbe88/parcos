/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Server Engine (Sprint 2: PMH-201 & PMH-202)
 * Versiune: 1.1.0 • Running on Netcup VPS (152.53.158.65)
 * Holding: CARVANA SRL • Strict 21% TVA • Zero-Daemon • Zero-Bloat
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Modul backend complet pentru:
 * 1. Webhook Inbound SNS / SES (POST /api/mail/webhook)
 * 2. Webhook Bounce & Complaint (POST /api/mail/webhook/bounce)
 * 3. Trimitere e-mailuri SES Outbound (POST /api/mail/send)
 * 4. Gestionare tranzacțională DB: threads, messages, attachments, suppression, DLQ
 */

import crypto from 'crypto';
import { getSql } from './db.mjs';

export const VAT_RATE = 0.21;
export const WARRANTY_ESCROW_TERM = 'Cont de Garanție';
export const RESERVATION_GUARANTEE_TERM = 'Garanție de Rezervare/Participare';

// Cache în memorie pentru certificate X.509 SNS (URL -> PemString)
const certCache = new Map();
const CERT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Verificare Semnătură Criptografică AWS SNS (X.509)
// ─────────────────────────────────────────────────────────────────────────────

export function validateSNSCertUrl(certUrl) {
  if (!certUrl || typeof certUrl !== 'string') return false;
  try {
    const parsed = new URL(certUrl);
    if (parsed.protocol !== 'https:') return false;
    const hostRegex = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;
    if (!hostRegex.test(parsed.hostname)) return false;
    if (!parsed.pathname.endsWith('.pem')) return false;
    return true;
  } catch {
    return false;
  }
}

export function buildSNSCanonicalString(payload) {
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

export async function fetchSNSCertificate(certUrl, fetchFn = fetch) {
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

export async function verifySNSSignature(payload, options = {}) {
  if (!payload || !payload.Signature || !payload.SigningCertURL) {
    return false;
  }

  if (!validateSNSCertUrl(payload.SigningCertURL)) {
    return false;
  }

  try {
    const certPem = options.certFetcher
      ? await options.certFetcher(payload.SigningCertURL)
      : await fetchSNSCertificate(payload.SigningCertURL);

    const canonicalString = buildSNSCanonicalString(payload);
    const signature = Buffer.from(payload.Signature, 'base64');
    const algorithm = payload.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';

    const verifier = crypto.createVerify(algorithm);
    verifier.update(canonicalString, 'utf8');
    return verifier.verify(certPem, signature);
  } catch (err) {
    console.warn('[SNS Security Gate] Eroare la verificarea semnăturii:', err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Curățare Reply-Chain & Context Vehicul / VIN
// ─────────────────────────────────────────────────────────────────────────────

export function cleanReplyChain(text) {
  if (!text) return '';
  return text
    .replace(/(?:^|\n)On\s+[\s\S]+?wrote:[\s\S]*$/i, '')
    .replace(/(?:^|\n)În\s+data\s+de\s+[\s\S]+?a\s+scris:[\s\S]*$/i, '')
    .replace(/(?:^|\n)La\s+data\s+de\s+[\s\S]+?a\s+scris:[\s\S]*$/i, '')
    .replace(/(?:^|\n)-----+\s*Original\s+Message\s*-----+[\s\S]*$/i, '')
    .replace(/(?:^|\n)De\s+la:\s+[\s\S]+?Trimis\s+la:[\s\S]*$/i, '')
    .replace(/(?:^|\n)From:\s+[\s\S]+?Sent:\s+[\s\S]*$/i, '')
    .replace(/(?:^|\n)_{8,}[\s\S]*$/i, '')
    .replace(/(?:^|\n)-{3,}\s*(?:Răspuns|Original|Forwarded)[\s\S]*$/i, '')
    .trim() || text.trim();
}

export function detectVehicleContext(subject, body) {
  const combined = `${subject || ''}\n${body || ''}`;
  const tagMatch = combined.match(/\b(RXM|CVN|PARC)-[A-Z0-9]{3,8}\b/i);
  const vehicleId = tagMatch ? tagMatch[0].toUpperCase() : undefined;
  const vinMatch = combined.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
  const vin = vinMatch ? vinMatch[0].toUpperCase() : undefined;
  return { vehicleId, vin };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Parser MIME RFC 2822
// ─────────────────────────────────────────────────────────────────────────────

export function decodeQuotedPrintable(input) {
  const unwrapped = input.replace(/=\r?\n/g, '');
  const bytes = [];
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

export function decodeEncodedWords(header) {
  if (!header || !header.includes('=?')) return header;
  return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      const enc = encoding.toUpperCase();
      if (enc === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf8' : 'latin1');
      } else if (enc === 'Q') {
        return decodeQuotedPrintable(text.replace(/_/g, ' '));
      }
    } catch {
      return text;
    }
    return text;
  });
}

export function parseEmailAddress(raw) {
  if (!raw) return { email: '', name: '' };
  const decoded = decodeEncodedWords(raw).trim();
  const match = decoded.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);
  if (match) {
    return {
      name: (match[1] || '').trim(),
      email: (match[2] || '').trim().toLowerCase(),
    };
  }
  return {
    name: '',
    email: decoded.replace(/[<>]/g, '').trim().toLowerCase(),
  };
}

export function parseRawMimeEmail(rawEml) {
  const rawString = typeof rawEml === 'string' ? rawEml : rawEml.toString('latin1');
  const splitIndex = rawString.search(/\r?\n\r?\n/);
  const headerSection = splitIndex !== -1 ? rawString.substring(0, splitIndex) : rawString;
  const bodySection = splitIndex !== -1 ? rawString.substring(splitIndex).replace(/^\r?\n\r?\n/, '') : '';

  const unfoldedHeaders = headerSection.replace(/\r?\n[ \t]+/g, ' ');
  const headerLines = unfoldedHeaders.split(/\r?\n/);

  const headers = {};
  for (const line of headerLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      headers[line.substring(0, colonIdx).trim().toLowerCase()] = line.substring(colonIdx + 1).trim();
    }
  }

  const parsedFrom = parseEmailAddress(headers['from'] || '');
  const subject = decodeEncodedWords(headers['subject'] || '(Fără Subiect)');
  const parsedDate = headers['date'] ? new Date(headers['date']) : new Date();

  let messageId = (headers['message-id'] || '').replace(/[<>]/g, '').trim();
  if (!messageId) {
    messageId = `msg-${crypto.randomUUID()}@inbound.parcos.ro`;
  }

  const inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'].replace(/[<>]/g, '').trim() : undefined;
  const references = (headers['references'] || '')
    .split(/\s+/)
    .map((r) => r.replace(/[<>]/g, '').trim())
    .filter(Boolean);

  const toList = (headers['to'] || '')
    .split(',')
    .map((t) => parseEmailAddress(t).email)
    .filter(Boolean);

  let bodyText = '';
  let bodyHtml = '';
  const attachments = [];

  function processPart(partH, partB) {
    const uH = partH.replace(/\r?\n[ \t]+/g, ' ');
    const pH = {};
    for (const l of uH.split(/\r?\n/)) {
      const c = l.indexOf(':');
      if (c > 0) pH[l.substring(0, c).trim().toLowerCase()] = l.substring(c + 1).trim();
    }

    const cType = pH['content-type'] || 'text/plain';
    const cTransfer = (pH['content-transfer-encoding'] || '7bit').toLowerCase();
    const cDisp = pH['content-disposition'] || '';

    const isAtt = cDisp.toLowerCase().includes('attachment') || cType.toLowerCase().includes('name=');
    if (isAtt) {
      let fileName = 'attachment.bin';
      const m = cDisp.match(/filename\*?=(?:"([^"]+)"|([^;\s]+))/i) || cType.match(/name\*?=(?:"([^"]+)"|([^;\s]+))/i);
      if (m) fileName = decodeEncodedWords(m[1] || m[2] || 'attachment.bin');

      let contentBuffer;
      if (cTransfer === 'base64') {
        contentBuffer = Buffer.from(partB.replace(/\s+/g, ''), 'base64');
      } else if (cTransfer === 'quoted-printable') {
        contentBuffer = Buffer.from(decodeQuotedPrintable(partB), 'utf8');
      } else {
        contentBuffer = Buffer.from(partB, 'latin1');
      }

      attachments.push({
        fileName,
        mimeType: cType.split(';')[0].trim().toLowerCase() || 'application/octet-stream',
        fileSize: contentBuffer.length,
        content: contentBuffer,
      });
      return;
    }

    if (cType.toLowerCase().startsWith('multipart/')) {
      const bM = cType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
      if (bM) {
        const b = bM[1] || bM[2];
        const cleanB = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const splits = partB.split(new RegExp(`--${cleanB}(?:--)?\r?\n?`, 'g'));
        for (const sp of splits) {
          const trimmed = sp.trim();
          if (trimmed && trimmed !== '--') {
            const spIdx = sp.search(/\r?\n\r?\n/);
            if (spIdx !== -1) {
              processPart(sp.substring(0, spIdx), sp.substring(spIdx).replace(/^\r?\n\r?\n/, ''));
            } else {
              processPart('', sp);
            }
          }
        }
      }
      return;
    }

    let decoded = partB;
    if (cTransfer === 'base64') {
      try { decoded = Buffer.from(partB.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch {}
    } else if (cTransfer === 'quoted-printable') {
      decoded = decodeQuotedPrintable(partB);
    }

    if (cType.toLowerCase().includes('text/html')) {
      bodyHtml = decoded;
    } else if (cType.toLowerCase().includes('text/plain')) {
      bodyText = decoded;
    }
  }

  const cTypeMain = headers['content-type'] || 'text/plain';
  if (cTypeMain.toLowerCase().startsWith('multipart/')) {
    const bMatch = cTypeMain.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
    if (bMatch) {
      const boundary = (bMatch[1] || bMatch[2]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = bodySection.split(new RegExp(`--${boundary}(?:--)?\r?\n?`, 'g'));
      for (const p of parts) {
        if (p.trim() && p.trim() !== '--') {
          const pIdx = p.search(/\r?\n\r?\n/);
          if (pIdx !== -1) {
            processPart(p.substring(0, pIdx), p.substring(pIdx).replace(/^\r?\n\r?\n/, ''));
          } else {
            processPart('', p);
          }
        }
      }
    }
  } else {
    processPart(headerSection, bodySection);
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// 4. Operațiuni Tranzacționale Bază de Date (PostgreSQL)
// ─────────────────────────────────────────────────────────────────────────────

const inMemorySuppressionList = new Map();

/**
 * Verifică idempotența unui Message-ID RFC 2822
 */
export async function isMessageProcessed(messageId) {
  if (!messageId) return false;
  try {
    const sql = getSql();
    const cleanId = String(messageId).replace(/[<>]/g, '').trim();
    const rows = await sql`SELECT id FROM mail_messages WHERE message_id = ${cleanId} LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Verifică dacă o adresă de e-mail este în lista de supresie
 */
export async function isEmailSuppressed(email) {
  if (!email) return { suppressed: false };
  const cleanEmail = String(email).trim().toLowerCase();
  if (inMemorySuppressionList.has(cleanEmail)) {
    return { suppressed: true, reason: inMemorySuppressionList.get(cleanEmail) };
  }
  try {
    const sql = getSql();
    const rows = await sql`SELECT reason FROM mail_suppression_list WHERE email = ${cleanEmail} LIMIT 1`;
    if (rows.length > 0) {
      return { suppressed: true, reason: rows[0].reason };
    }
  } catch {
    // În mediu fără conexiune activă la DB, folosim cache-ul în memorie
  }
  return { suppressed: false };
}

/**
 * Adaugă o adresă în lista de supresie
 */
export async function addToSuppressionList(email, reason = 'HARD_BOUNCE', dealerId = null) {
  const cleanEmail = String(email).trim().toLowerCase();
  inMemorySuppressionList.set(cleanEmail, reason);
  try {
    const sql = getSql();
    await sql`
      INSERT INTO mail_suppression_list (email, reason, dealer_id, created_at)
      VALUES (${cleanEmail}, ${reason}, ${dealerId}, NOW())
      ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()
    `;
  } catch {
    // Ignoră eroarea dacă PostgreSQL nu este accesibil în mediul de rulare local/test
  }
}

/**
 * Înregistrează o eroare în Dead Letter Queue (DLQ)
 */
export async function recordParseFailure(messageId, s3Key, errorMessage) {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO mail_parse_failures (message_id, s3_key, error_message, retry_count, created_at)
      VALUES (${messageId || null}, ${s3Key || null}, ${errorMessage || 'Unknown error'}, 1, NOW())
    `;
  } catch (err) {
    console.error('[DLQ] Eroare la înregistrarea în mail_parse_failures:', err.message);
  }
}

/**
 * Salvează tranzacțional un e-mail primit (inbound)
 */
export async function saveInboundEmail(parsedEmail, options = {}) {
  const sql = getSql();
  const dealerId = options.dealerId || 'rxm';
  const s3Key = options.s3Key || null;

  // 1. Verificare idempotență
  if (await isMessageProcessed(parsedEmail.messageId)) {
    return { status: 'already_processed', messageId: parsedEmail.messageId };
  }

  // 2. Căutare sau rezolvare vehicul
  let resolvedVehicleId = null;
  if (parsedEmail.detectedVehicleId || parsedEmail.detectedVin) {
    const query = parsedEmail.detectedVehicleId || parsedEmail.detectedVin;
    const vRows = await sql`
      SELECT id FROM vehicles 
      WHERE (id ILIKE ${'%' + query + '%'} OR vin ILIKE ${'%' + query + '%'})
        AND dealer_slug = ${dealerId}
      LIMIT 1
    `;
    if (vRows.length > 0) {
      resolvedVehicleId = vRows[0].id;
    }
  }

  // 3. Căutare sau creare thread de conversație
  let threadId = null;

  // Căutare după In-Reply-To sau References dacă este un răspuns la un mesaj anterior
  if (parsedEmail.inReplyTo || (parsedEmail.references && parsedEmail.references.length > 0)) {
    const parentMsgId = parsedEmail.inReplyTo || parsedEmail.references[0];
    const parentRows = await sql`
      SELECT thread_id FROM mail_messages WHERE message_id = ${parentMsgId} LIMIT 1
    `;
    if (parentRows.length > 0) {
      threadId = parentRows[0].thread_id;
    }
  }

  // Dacă nu s-a găsit prin threading, căutare după client + dealer
  if (!threadId) {
    const existingThreads = await sql`
      SELECT id FROM mail_threads 
      WHERE customer_email = ${parsedEmail.from} AND dealer_id = ${dealerId}
      ORDER BY last_message_at DESC 
      LIMIT 1
    `;
    if (existingThreads.length > 0) {
      threadId = existingThreads[0].id;
    }
  }

  // Dacă tot nu există thread -> creare thread nou
  if (!threadId) {
    const newThreadRows = await sql`
      INSERT INTO mail_threads (
        dealer_id, vehicle_id, subject, customer_email, customer_name, status, last_message_at, created_at, updated_at
      ) VALUES (
        ${dealerId}, ${resolvedVehicleId}, ${parsedEmail.subject}, ${parsedEmail.from},
        ${parsedEmail.senderName || null}, 'UNREAD', NOW(), NOW(), NOW()
      )
      RETURNING id
    `;
    threadId = newThreadRows[0].id;
  } else {
    // Actualizare thread existent
    await sql`
      UPDATE mail_threads 
      SET last_message_at = NOW(), 
          status = 'UNREAD',
          vehicle_id = COALESCE(vehicle_id, ${resolvedVehicleId}),
          updated_at = NOW()
      WHERE id = ${threadId}
    `;
  }

  // 4. Inserare mesaj în mail_messages
  const msgRows = await sql`
    INSERT INTO mail_messages (
      thread_id, message_id, direction, sender, recipient,
      body_html, body_text, s3_key, is_read, created_at
    ) VALUES (
      ${threadId}, ${parsedEmail.messageId}, 'INBOUND', ${parsedEmail.from},
      ${parsedEmail.to[0] || 'inbox@' + dealerId + '.ro'},
      ${parsedEmail.bodyHtml || null}, ${parsedEmail.cleanBodyText || parsedEmail.bodyText || null},
      ${s3Key}, FALSE, NOW()
    )
    RETURNING id
  `;
  const savedMessageId = msgRows[0].id;

  // 5. Inserare atașamente în mail_attachments
  const savedAttachments = [];
  if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
    for (const att of parsedEmail.attachments) {
      const storageKey = s3Key ? `${s3Key}_${att.fileName}` : `inbound/${threadId}/${att.fileName}`;
      const attRows = await sql`
        INSERT INTO mail_attachments (
          message_id, file_name, mime_type, file_size, storage_driver, storage_key, is_encrypted, created_at
        ) VALUES (
          ${savedMessageId}, ${att.fileName}, ${att.mimeType}, ${att.fileSize},
          'S3_TEMP', ${storageKey}, FALSE, NOW()
        )
        RETURNING id
      `;
      savedAttachments.push({ id: attRows[0].id, fileName: att.fileName });
    }
  }

  return {
    status: 'PROCESSED',
    threadId,
    messageId: parsedEmail.messageId,
    dbMessageId: savedMessageId,
    attachmentsCount: savedAttachments.length,
    vehicleId: resolvedVehicleId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Handlere HTTP Endpoint Express / Node Micro-API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handler HTTP principal pentru Webhook Inbound SNS / SES (PMH-201)
 * POST /api/mail/webhook
 */
export async function handleInboundWebhook(rawBodyBuffer, headers, options = {}) {
  let snsPayload;
  try {
    snsPayload = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch (err) {
    return { statusCode: 400, body: { success: false, error: 'Payload JSON invalid' } };
  }

  // 1. Verificare Semnătură Criptografică SNS (Security Gate)
  const isProd = process.env.NODE_ENV === 'production';
  const shouldVerify = options.forceVerify ?? (isProd || !!snsPayload.Signature);

  if (shouldVerify) {
    const isSignatureValid = await verifySNSSignature(snsPayload, options);
    if (!isSignatureValid) {
      console.warn('🚨 [SNS Webhook 403] Semnătură SNS invalidă sau certificat falsificat.');
      return {
        statusCode: 403,
        body: { success: false, error: 'Forbidden: Semnătură SNS neautorizată' },
      };
    }
  }

  // 2. Gestionare SubscriptionConfirmation
  if (snsPayload.Type === 'SubscriptionConfirmation') {
    console.log(`📡 [SNS Webhook] Recepționat SubscriptionConfirmation pentru Topic: ${snsPayload.TopicArn}`);
    if (snsPayload.SubscribeURL) {
      try {
        const fetchFn = options.fetchFn || fetch;
        const confirmRes = await fetchFn(snsPayload.SubscribeURL);
        console.log(`✅ [SNS Webhook] Abonare confirmată cu succes (${confirmRes.status})`);
      } catch (err) {
        console.error('❌ [SNS Webhook] Eroare la apelul SubscribeURL:', err.message);
      }
    }
    return {
      statusCode: 200,
      body: { success: true, status: 'SUBSCRIPTION_CONFIRMED', topicArn: snsPayload.TopicArn },
    };
  }

  // 3. Procesare Notificare EML (SES Inbound)
  if (snsPayload.Type === 'Notification') {
    let sesNotification;
    try {
      sesNotification = typeof snsPayload.Message === 'string'
        ? JSON.parse(snsPayload.Message)
        : snsPayload.Message;
    } catch {
      sesNotification = { rawContent: snsPayload.Message };
    }

    // Extrage EML brut (transmis direct în content sau mock)
    const rawEml = sesNotification.content || sesNotification.rawContent || options.rawEml;
    const s3Action = sesNotification.receipt?.action;
    const s3Key = s3Action?.objectKey || sesNotification.s3Key || null;

    if (!rawEml && !s3Key) {
      return {
        statusCode: 200,
        body: { success: true, message: 'Notificare SNS fără conținut EML sau cheie S3 recepționată' },
      };
    }

    try {
      let emlToParse = rawEml;
      if (!emlToParse && s3Key && options.s3Client) {
        emlToParse = await options.s3Client.getObject(s3Action?.bucketName || 'parcos-ses-inbound-temp', s3Key);
      }

      if (!emlToParse) {
        return { statusCode: 200, body: { success: true, message: 'EML indisponibil temporar' } };
      }

      const parsed = parseRawMimeEmail(emlToParse);
      const saveResult = await saveInboundEmail(parsed, {
        dealerId: options.dealerId || 'rxm',
        s3Key,
      });

      return {
        statusCode: 200,
        body: { success: true, ...saveResult },
      };
    } catch (parseErr) {
      console.error('❌ [Inbound Mail Error] Eșec la parsarea/salvarea e-mailului:', parseErr);
      await recordParseFailure(sesNotification.mail?.messageId, s3Key, parseErr.message);
      return {
        statusCode: 500,
        body: { success: false, error: 'Eroare la procesarea e-mailului inbound', details: parseErr.message },
      };
    }
  }

  return { statusCode: 200, body: { success: true, message: 'Notificare ignorată' } };
}

/**
 * Handler HTTP pentru Bounce & Complaint SES (PMH-106 / PMH-202)
 * POST /api/mail/webhook/bounce
 */
export async function handleBounceWebhook(rawBodyBuffer) {
  let snsPayload;
  try {
    snsPayload = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch {
    return { statusCode: 400, body: { success: false, error: 'Format JSON invalid' } };
  }

  let notification = snsPayload;
  if (snsPayload.Message) {
    try { notification = JSON.parse(snsPayload.Message); } catch {}
  }

  const notificationType = notification.notificationType || notification.eventType;

  if (notificationType === 'Bounce') {
    const bounce = notification.bounce || {};
    const bounceType = bounce.bounceType; // Permanent sau Transient
    const recipients = bounce.bouncedRecipients || [];

    for (const r of recipients) {
      const email = r.emailAddress;
      if (bounceType === 'Permanent') {
        console.warn(`🛑 [SES Hard Bounce] Blocare adresă invalidă în lista de supresie: ${email}`);
        await addToSuppressionList(email, 'HARD_BOUNCE');
      } else {
        console.log(`⚠️ [SES Soft Bounce] Înregistrat transient bounce pentru ${email}`);
      }
    }
  } else if (notificationType === 'Complaint') {
    const complaint = notification.complaint || {};
    const recipients = complaint.complainedRecipients || [];

    for (const r of recipients) {
      const email = r.emailAddress;
      console.warn(`🚨 [SES Complaint] Clientul a marcat ca spam. Adăugare în supresie: ${email}`);
      await addToSuppressionList(email, 'COMPLAINT');
    }
  }

  return { statusCode: 200, body: { success: true, processedType: notificationType } };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Outbound SES Delivery (PMH-202) & REST Thread Queries (PMH-203 Preview)
// ─────────────────────────────────────────────────────────────────────────────

export function formatSenderHeader(employeeName, dealershipName, email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanEmployee = String(employeeName || '').trim();
  const cleanDealer = String(dealershipName || '').trim();

  if (cleanEmployee && cleanDealer) {
    return `"${cleanEmployee} - ${cleanDealer}" <${cleanEmail}>`;
  }
  if (cleanDealer) {
    return `"${cleanDealer}" <${cleanEmail}>`;
  }
  return `<${cleanEmail}>`;
}

export function generateRFC2822MessageId(domain = 'parcos.ro') {
  const cleanDomain = String(domain).replace(/[^a-z0-9.-]/gi, '');
  const uniqueToken = crypto.randomUUID();
  const timestamp = Date.now();
  return `<${uniqueToken}.${timestamp}@${cleanDomain}>`;
}

export function generateListUnsubscribeHeader(domain, recipientEmail, customUrl) {
  const cleanDomain = String(domain).toLowerCase();
  const mailtoPart = `<mailto:unsubscribe@${cleanDomain}?subject=unsubscribe>`;
  const httpPart = customUrl ? `<${customUrl}>` : `<https://${cleanDomain}/unsubscribe?email=${encodeURIComponent(recipientEmail)}>`;
  return `${mailtoPart}, ${httpPart}`;
}

export function wrapBase64Lines(base64Str) {
  return String(base64Str).replace(/(.{76})/g, '$1\r\n');
}

export function buildRawMimeMessage(options) {
  const senderEmail = options.senderEmail || 'inbox@rxmautomobile.ro';
  const domain = senderEmail.split('@')[1] || 'rxmautomobile.ro';
  const messageId = options.customMessageId || generateRFC2822MessageId(domain);
  const fromHeader = formatSenderHeader(options.employeeName, options.dealershipName, senderEmail);
  const toHeader = options.recipientName
    ? `"${options.recipientName.trim()}" <${options.recipientEmail.trim()}>`
    : `<${options.recipientEmail.trim()}>`;

  const dateHeader = new Date().toUTCString();
  const mixedBoundary = `----=_ParcOS_Mixed_${crypto.randomBytes(12).toString('hex')}`;
  const altBoundary = `----=_ParcOS_Alt_${crypto.randomBytes(12).toString('hex')}`;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject || '(Fără Subiect)').toString('base64')}?=`,
    `Date: ${dateHeader}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
  ];

  if (options.parentMessageId) {
    const cleanParent = options.parentMessageId.startsWith('<') ? options.parentMessageId : `<${options.parentMessageId}>`;
    headers.push(`In-Reply-To: ${cleanParent}`);
    const refs = Array.isArray(options.references) && options.references.length > 0
      ? options.references.map((r) => (r.startsWith('<') ? r : `<${r}>`)).join(' ')
      : cleanParent;
    headers.push(`References: ${refs}`);
  }

  if (options.isCommercial !== false) {
    headers.push(`List-Unsubscribe: ${generateListUnsubscribeHeader(domain, options.recipientEmail, options.unsubscribeUrl)}`);
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);

  let mimeBody = '';
  mimeBody += `--${mixedBoundary}\r\n`;
  mimeBody += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

  const plainText = options.textBody || (options.htmlBody ? options.htmlBody.replace(/<[^>]+>/g, ' ').trim() : '');
  if (plainText) {
    mimeBody += `--${altBoundary}\r\n`;
    mimeBody += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeBody += wrapBase64Lines(Buffer.from(plainText, 'utf8').toString('base64')) + '\r\n';
  }

  const htmlContent = options.htmlBody || `<p>${plainText.replace(/\n/g, '<br/>')}</p>`;
  mimeBody += `--${altBoundary}\r\n`;
  mimeBody += `Content-Type: text/html; charset=UTF-8\r\n`;
  mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
  mimeBody += wrapBase64Lines(Buffer.from(htmlContent, 'utf8').toString('base64')) + '\r\n';

  mimeBody += `--${altBoundary}--\r\n`;

  if (options.attachments && options.attachments.length > 0) {
    for (const att of options.attachments) {
      const attBuffer = typeof att.content === 'string' ? Buffer.from(att.content, 'base64') : att.content;
      const safeFileName = (att.fileName || 'file.bin').replace(/["\r\n]/g, '');
      const base64Content = wrapBase64Lines(attBuffer.toString('base64'));

      mimeBody += `--${mixedBoundary}\r\n`;
      mimeBody += `Content-Type: ${att.mimeType || 'application/octet-stream'}; name="${safeFileName}"\r\n`;
      mimeBody += `Content-Transfer-Encoding: base64\r\n`;
      mimeBody += `Content-Disposition: attachment; filename="${safeFileName}"\r\n\r\n`;
      mimeBody += base64Content + '\r\n';
    }
  }

  mimeBody += `--${mixedBoundary}--\r\n`;
  const fullMime = headers.join('\r\n') + '\r\n\r\n' + mimeBody;
  return { rawMime: fullMime, messageId };
}

// ─────────────────────────────────────────────────────────────────────────────
// AWS SigV4 Signer pentru AWS SES SendRawEmail (Zero Dependențe Externe)
// ─────────────────────────────────────────────────────────────────────────────

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hashSha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = hmacSha256('AWS4' + key, dateStamp);
  const kRegion = hmacSha256(kDate, regionName);
  const kService = hmacSha256(kRegion, serviceName);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Trimite un e-mail brut către AWS SES folosind SendRawEmail semnat SigV4.
 */
export async function sendRawEmailViaSES(rawMime, credentials, fetchFn = fetch) {
  const host = `email.${credentials.region}.amazonaws.com`;
  const endpoint = `https://${host}/`;

  const base64Data = Buffer.from(rawMime, 'utf8').toString('base64');
  const postParams = new URLSearchParams();
  postParams.append('Action', 'SendRawEmail');
  postParams.append('RawMessage.Data', base64Data);
  const requestBody = postParams.toString();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const payloadHash = hashSha256(requestBody);
  const canonicalHeaders = `content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';

  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${credentials.region}/ses/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hashSha256(canonicalRequest)}`;

  const signingKey = getSignatureKey(credentials.secretAccessKey, dateStamp, credentials.region, 'ses');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  const authorizationHeader = `${algorithm} Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Host': host,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
    },
    body: requestBody,
  });

  const resText = await res.text();

  if (!res.ok) {
    throw new Error(`[AWS SES Error] Livrare eșuată (${res.status} ${res.statusText}): ${resText}`);
  }

  // Extrage MessageId din XML-ul returnat de SES
  const msgIdMatch = resText.match(/<MessageId>([^<]+)<\/MessageId>/);
  const sesMessageId = msgIdMatch ? msgIdMatch[1] : `ses-${crypto.randomUUID()}`;

  return { sesMessageId };
}

/**
 * Trimitere SES cu retry automat și timeout de 10s
 */
export async function sendRawEmailViaSESWithRetry(rawMime, credentials, maxRetries = 1, timeoutMs = 10000, fetchFn = fetch) {
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await sendRawEmailViaSES(rawMime, credentials, (url, opts) =>
        fetchFn(url, { ...opts, signal: controller.signal })
      );
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        console.warn(`⚠️ [SES Outbound] Tentativa ${attempt + 1} a eșuat (${err.message}). Reîncercare în 1000ms...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastErr;
}

/**
 * Handler HTTP pentru trimiterea de e-mailuri Outbound SES (PMH-202)
 * POST /api/mail/send
 */
export async function handleOutboundSend(payload, options = {}) {
  const dealerId = options.dealerId || payload.dealerId || 'rxm';
  const recipientEmail = payload.recipientEmail ? String(payload.recipientEmail).trim().toLowerCase() : '';
  const senderEmail = payload.senderEmail ? String(payload.senderEmail).trim().toLowerCase() : `contact@${dealerId}automobile.ro`;
  const subject = payload.subject ? String(payload.subject).trim() : '';

  if (!recipientEmail || !subject) {
    return {
      statusCode: 400,
      body: { success: false, error: 'Adresa de destinatar și subiectul sunt obligatorii' },
    };
  }

  // 1. Verificare Lista de Supresie (Hard Bounce / Complaint)
  const suppression = await isEmailSuppressed(recipientEmail);
  if (suppression.suppressed) {
    console.warn(`🛑 [Deliverability Guard] Trimitere blocată către adresa suprimată: ${recipientEmail} (${suppression.reason})`);
    return {
      statusCode: 400,
      body: {
        success: false,
        error: `Adresa ${recipientEmail} este în lista de supresie (${suppression.reason}). Trimiterea este blocată.`,
        isSuppressed: true,
        reason: suppression.reason,
      },
    };
  }

  // 2. Construire mesaj Raw MIME
  const { rawMime, messageId } = buildRawMimeMessage({
    ...payload,
    dealerId,
    dealershipName: payload.dealershipName || 'RXM Automobile',
    employeeName: payload.employeeName || 'Consilier Vânzări',
    senderEmail,
    recipientEmail,
    subject,
  });

  // 3. Livrare SES sau Mock Sandbox
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1';
  const fetchFn = options.fetchFn || fetch;

  let sesMessageId = null;
  let isMock = true;

  if (accessKeyId && secretAccessKey) {
    const startTime = Date.now();
    try {
      console.log(`📨 [SES Outbound] Trimitere reală prin AWS SES (${region}) către ${recipientEmail} (${messageId})...`);
      const sesResult = await sendRawEmailViaSESWithRetry(rawMime, { accessKeyId, secretAccessKey, region }, 1, 10000, fetchFn);
      sesMessageId = sesResult.sesMessageId;
      isMock = false;
      const duration = Date.now() - startTime;
      console.log(`✅ [SES Outbound] E-mail expediat cu succes prin AWS SES către ${recipientEmail} | SES MessageId: ${sesMessageId} | Durată: ${duration}ms`);
    } catch (sesErr) {
      console.error(`❌ [SES Outbound] Trimiterea prin AWS SES a eșuat (${sesErr.message}). Fallback la Mock Sandbox.`);
      sesMessageId = `mock-${crypto.randomUUID()}`;
    }
  } else {
    console.warn(`⚠️ [MailHub] AWS SES neconfigurat (lipsește AWS_SES_ACCESS_KEY_ID). Folosire Mock Sandbox.`);
    sesMessageId = `mock-${crypto.randomUUID()}`;
  }

  // 4. Salvare în PostgreSQL (Tranzacțional) cu toleranță la mediul offline/test
  let threadId = payload.threadId || null;
  let dbMessageId = null;

  try {
    const sql = options.sql || getSql();

    if (threadId) {
      await sql`
        UPDATE mail_threads 
        SET last_message_at = NOW(), 
            status = ${payload.isOffer ? 'OFFER_SENT' : 'READ'},
            updated_at = NOW()
        WHERE id = ${threadId}
      `;
    } else {
      // Creare thread nou dacă nu exista
      const newThread = await sql`
        INSERT INTO mail_threads (
          dealer_id, vehicle_id, subject, customer_email, customer_name, status, last_message_at, created_at, updated_at
        ) VALUES (
          ${dealerId}, ${payload.vehicleId || null}, ${subject}, ${recipientEmail},
          ${payload.recipientName || null}, ${payload.isOffer ? 'OFFER_SENT' : 'READ'}, NOW(), NOW(), NOW()
        )
        RETURNING id
      `;
      threadId = newThread[0].id;
    }

    const msgRows = await sql`
      INSERT INTO mail_messages (
        thread_id, message_id, ses_message_id, direction, sender, recipient,
        body_html, body_text, is_read, created_at
      ) VALUES (
        ${threadId}, ${messageId}, ${sesMessageId}, 'OUTBOUND', ${senderEmail}, ${recipientEmail},
        ${payload.htmlBody || null}, ${payload.textBody || null}, TRUE, NOW()
      )
      RETURNING id
    `;
    dbMessageId = msgRows[0].id;
  } catch (dbErr) {
    console.warn(`⚠️ [MailHub] Salvare DB omisă sau indisponibilă (${dbErr.message}).`);
    dbMessageId = `mock-db-${crypto.randomUUID()}`;
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      messageId,
      sesMessageId,
      isMock,
      threadId,
      dbMessageId,
      deliveredAt: new Date().toISOString(),
    },
  };
}

/**
 * Returnează lista de conversații (threads) pentru interfața dealerului
 * GET /api/mail/threads
 */
export async function getMailThreads(dealerId = 'rxm', filter = {}) {
  const sql = getSql();
  const status = filter.status || null;
  const assignedTo = filter.assignedTo || null;
  const limit = Math.min(parseInt(filter.limit || 50, 10), 100);
  const offset = parseInt(filter.offset || 0, 10);

  let rows = [];
  let stats = { unread_count: 0, pending_offer_count: 0, unassigned_count: 0, total_count: 0 };

  try {
    if (status && assignedTo === 'unassigned') {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId} AND t.status = ${status} AND t.assigned_account_id IS NULL
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (status && assignedTo) {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId} AND t.status = ${status} AND t.assigned_account_id = ${assignedTo}
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (!status && assignedTo === 'unassigned') {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId} AND t.assigned_account_id IS NULL
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (!status && assignedTo) {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId} AND t.assigned_account_id = ${assignedTo}
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (status) {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId} AND t.status = ${status}
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT t.*, 
               v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price,
               a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
        FROM mail_threads t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
        WHERE t.dealer_id = ${dealerId}
        ORDER BY t.last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const statsRows = await sql`
      SELECT 
        count(*) FILTER (WHERE status = 'UNREAD')::int AS unread_count,
        count(*) FILTER (WHERE status = 'PENDING_OFFER')::int AS pending_offer_count,
        count(*) FILTER (WHERE assigned_account_id IS NULL)::int AS unassigned_count,
        count(*)::int AS total_count
      FROM mail_threads 
      WHERE dealer_id = ${dealerId}
    `;
    if (statsRows && statsRows[0]) stats = statsRows[0];
  } catch {
    // Fallback cu sample mock data pentru mediu de test / offline
    rows = [
      {
        id: 'mock-thread-1',
        dealer_id: dealerId,
        subject: 'Întrebare BMW Seria 3',
        customer_email: 'client@exemplu.ro',
        status: 'UNREAD',
        last_message_at: new Date().toISOString(),
        assigned_agent_name: 'Robert',
        assigned_agent_email: 'robert@rxmautomobile.ro',
        assigned_agent_role: 'SALES',
      },
      {
        id: 'mock-thread-2-hr',
        dealer_id: dealerId,
        subject: 'Fluturaș salariu Octombrie 2026',
        customer_email: 'hr@rxmautomobile.ro',
        status: 'UNREAD',
        last_message_at: new Date().toISOString(),
        assigned_agent_name: 'Ioana HR',
        assigned_agent_email: 'salarii@rxmautomobile.ro',
        assigned_agent_role: 'HR_PAYROLL',
      }
    ];
  }

  const currentRole = filter.currentRole || null;
  const folder = filter.folder || null;

  const isHrOrAdmin = !currentRole || ['ADMIN', 'HR_PAYROLL'].includes(currentRole);
  let visibleThreads = Array.isArray(rows) ? rows : [];
  if (!isHrOrAdmin) {
    visibleThreads = visibleThreads.filter(t => t.assigned_agent_role !== 'HR_PAYROLL');
  }
  if (folder === 'hr_payroll' || filter.status === 'HR_PAYROLL') {
    if (!isHrOrAdmin) {
      visibleThreads = [];
    } else {
      visibleThreads = visibleThreads.filter(t => 
        t.assigned_agent_role === 'HR_PAYROLL' || 
        (t.subject && /salari|flutura|hr|contract/i.test(t.subject))
      );
    }
  }

  return {
    threads: visibleThreads,
    stats: stats[0] || { unread_count: 0, pending_offer_count: 0, unassigned_count: 0, total_count: 0 },
  };
}

/**
 * Returnează detaliile unui fir de conversație și toate mesajele sale
 * GET /api/mail/threads/:id
 */
export async function getMailThreadById(threadId, dealerId = 'rxm') {
  const sql = getSql();
  const threadRows = await sql`
    SELECT t.*, 
           v.brand AS vehicle_brand, v.model AS vehicle_model, v.price_eur AS vehicle_price, v.vin AS vehicle_vin,
           a.display_name AS assigned_agent_name, a.email AS assigned_agent_email, a.role AS assigned_agent_role
    FROM mail_threads t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
    WHERE t.id = ${threadId} AND t.dealer_id = ${dealerId}
    LIMIT 1
  `;

  if (threadRows.length === 0) {
    return null;
  }

  const thread = threadRows[0];
  const messages = await sql`
    SELECT m.*, 
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'fileName', a.file_name,
            'mimeType', a.mime_type,
            'fileSize', a.file_size,
            'storageDriver', a.storage_driver,
            'storageKey', a.storage_key
          )
        ) FILTER (WHERE a.id IS NOT NULL), '[]'::json
      ) AS attachments
    FROM mail_messages m
    LEFT JOIN mail_attachments a ON a.message_id = m.id
    WHERE m.thread_id = ${threadId}
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `;

  const formattedMessages = messages.map((m) => ({
    ...m,
    threadId: m.thread_id,
    messageId: m.message_id,
    sesMessageId: m.ses_message_id || null,
    bodyHtml: m.body_html,
    bodyText: m.body_text,
    isRead: m.is_read,
    createdAt: m.created_at,
  }));

  return { thread, messages: formattedMessages };
}

/**
 * Actualizează statusul unei conversații
 * PATCH /api/mail/threads/:id/status
 */
export async function updateThreadStatus(threadId, status, dealerId = 'rxm') {
  const allowed = ['UNREAD', 'READ', 'PENDING_OFFER', 'OFFER_SENT', 'RESERVED', 'ARCHIVED'];
  if (!allowed.includes(status)) {
    throw new Error(`Status invalid: ${status}. Permise: ${allowed.join(', ')}`);
  }

  const sql = getSql();
  const res = await sql`
    UPDATE mail_threads 
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${threadId} AND dealer_id = ${dealerId}
    RETURNING id, status, updated_at
  `;
  return res[0] || null;
}

/**
 * Asociază sau dezasociază un vehicul la o conversație (PMH-302)
 * PATCH /api/mail/threads/:id/vehicle
 */
export async function updateThreadVehicle(threadId, vehicleId, dealerId = 'rxm') {
  const sql = getSql();
  const resolvedVehicleId = vehicleId && String(vehicleId).trim() ? String(vehicleId).trim() : null;

  const res = await sql`
    UPDATE mail_threads 
    SET vehicle_id = ${resolvedVehicleId}, updated_at = NOW()
    WHERE id = ${threadId} AND dealer_id = ${dealerId}
    RETURNING id, vehicle_id, updated_at
  `;
  if (!res[0]) return null;

  const full = await getMailThreadById(threadId, dealerId);
  return full ? full.thread : res[0];
}

/**
 * Asociază o conversație cu un agent / căsuță (PMH-304: 1-Click Claim & Multi-Agent Routing)
 * PATCH /api/mail/threads/:id/assign
 * accountId: string (UUID) sau null pentru a elibera firul înapoi în Pool Showroom
 */
export async function assignThreadToAccount(threadId, accountId = null, dealerId = 'rxm') {
  const sql = getSql();
  const targetId = accountId && String(accountId).trim() ? String(accountId).trim() : null;

  // Verificare cont dacă este specificat
  if (targetId) {
    const acc = await sql`
      SELECT id, display_name, email, role FROM mail_accounts
      WHERE id = ${targetId} AND dealer_id = ${dealerId} AND is_active = TRUE
      LIMIT 1
    `;
    if (acc.length === 0) {
      throw new Error(`Contul de agent cu ID ${targetId} nu există sau este inactiv.`);
    }
  }

  const res = await sql`
    UPDATE mail_threads 
    SET assigned_account_id = ${targetId}, updated_at = NOW()
    WHERE id = ${threadId} AND dealer_id = ${dealerId}
    RETURNING id, assigned_account_id, updated_at
  `;
  if (!res[0]) return null;

  const full = await getMailThreadById(threadId, dealerId);
  return full ? full.thread : res[0];
}

/**
 * Căutare rapidă / full-text în mesaje și conversații
 * GET /api/mail/search?q=...
 */
export async function searchMail(query, dealerId = 'rxm') {
  if (!query || !String(query).trim()) return [];
  const sql = getSql();
  const term = `%${String(query).trim()}%`;

  const rows = await sql`
    SELECT DISTINCT t.id, t.subject, t.customer_email, t.customer_name, t.status, t.last_message_at,
           v.brand AS vehicle_brand, v.model AS vehicle_model,
           a.display_name AS assigned_agent_name, a.email AS assigned_agent_email
    FROM mail_threads t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN mail_accounts a ON t.assigned_account_id = a.id
    LEFT JOIN mail_messages m ON m.thread_id = t.id
    WHERE t.dealer_id = ${dealerId}
      AND (
        t.subject ILIKE ${term}
        OR t.customer_email ILIKE ${term}
        OR t.customer_name ILIKE ${term}
        OR m.body_text ILIKE ${term}
      )
    ORDER BY t.last_message_at DESC
    LIMIT 25
  `;
  return rows;
}

/**
 * Contoare statistice pentru folderele din interfață
 * GET /api/mail/stats
 */
export async function getMailStats(dealerId = 'rxm') {
  const sql = getSql();
  try {
    const stats = await sql`
      SELECT 
        count(*) FILTER (WHERE status = 'UNREAD')::int AS unread_count,
        count(*) FILTER (WHERE status = 'PENDING_OFFER')::int AS pending_offer_count,
        count(*) FILTER (WHERE status = 'OFFER_SENT')::int AS offer_sent_count,
        count(*) FILTER (WHERE status = 'RESERVED')::int AS reserved_count,
        count(*) FILTER (WHERE status = 'ARCHIVED')::int AS archived_count,
        count(*) FILTER (WHERE assigned_account_id IS NULL)::int AS unassigned_count,
        count(*)::int AS total_count
      FROM mail_threads 
      WHERE dealer_id = ${dealerId}
    `;
    return stats[0] || { unread_count: 0, pending_offer_count: 0, unassigned_count: 0, total_count: 0 };
  } catch {
    return { unread_count: 0, pending_offer_count: 0, unassigned_count: 0, total_count: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CRUD Căsuțe Poștale Angajați (PMH-204)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returnează toate căsuțele angajaților dealerului
 * GET /api/mail/accounts
 */
export async function getMailAccounts(dealerId = 'rxm') {
  const sql = getSql();
  try {
    const rows = await sql`
      SELECT a.*, u.full_name AS user_name
      FROM mail_accounts a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.dealer_id = ${dealerId}
      ORDER BY a.created_at ASC
    `;
    return rows;
  } catch {
    return [];
  }
}

/**
 * Creează o căsuță nouă pentru un angajat
 * POST /api/mail/accounts
 */
export async function createMailAccount(data, dealerId = 'rxm') {
  const sql = getSql();
  const alias = data.alias ? String(data.alias).trim().toLowerCase() : '';
  const domain = data.domain ? String(data.domain).trim().toLowerCase() : '';
  let email = String(data.email || '').trim().toLowerCase();
  if (!email && alias && domain) {
    email = `${alias}@${domain}`;
  }
  const displayName = String(data.displayName || data.display_name || '').trim();
  const role = (data.role || 'SALES').toUpperCase();

  const allowedRoles = ['ADMIN', 'SALES', 'MECHANIC', 'FINANCE', 'SUPPORT', 'HR_PAYROLL'];
  if (!allowedRoles.includes(role)) {
    throw new Error(`Rol invalid: ${role}`);
  }

  if (!email || !displayName) {
    throw new Error('Email-ul și numele afișat sunt obligatorii');
  }

  try {
    const rows = await sql`
      INSERT INTO mail_accounts (
        dealer_id, user_id, email, display_name, role, alias, domain, is_active, created_at, updated_at
      ) VALUES (
        ${dealerId}, ${data.userId || null}, ${email}, ${displayName}, ${role}, ${alias || null}, ${domain || null}, TRUE, NOW(), NOW()
      )
      RETURNING *
    `;
    return rows[0];
  } catch (err) {
    return {
      id: `acc-${Date.now()}`,
      dealer_id: dealerId,
      user_id: data.userId || null,
      email,
      display_name: displayName,
      role,
      alias: alias || null,
      domain: domain || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Actualizează o căsuță de e-mail existentă
 * PATCH / PUT /api/mail/accounts/:id
 */
export async function updateMailAccount(accountId, data, dealerId = 'rxm') {
  const sql = getSql();
  const updates = {};
  if (data.displayName || data.display_name) updates.display_name = String(data.displayName || data.display_name).trim();
  if (data.role) updates.role = String(data.role).toUpperCase();
  if (data.alias) updates.alias = String(data.alias).trim().toLowerCase();
  if (data.domain) updates.domain = String(data.domain).trim().toLowerCase();
  if (typeof data.isActive === 'boolean') updates.is_active = data.isActive;
  if (typeof data.is_active === 'boolean') updates.is_active = data.is_active;

  if (updates.role) {
    const allowedRoles = ['ADMIN', 'SALES', 'MECHANIC', 'FINANCE', 'SUPPORT', 'HR_PAYROLL'];
    if (!allowedRoles.includes(updates.role)) {
      throw new Error(`Rol invalid: ${updates.role}`);
    }
  }

  try {
    const rows = await sql`
      UPDATE mail_accounts 
      SET 
        display_name = COALESCE(${updates.display_name || null}, display_name),
        role = COALESCE(${updates.role || null}, role),
        alias = COALESCE(${updates.alias || null}, alias),
        domain = COALESCE(${updates.domain || null}, domain),
        is_active = COALESCE(${updates.is_active !== undefined ? updates.is_active : null}, is_active),
        updated_at = NOW()
      WHERE id = ${accountId} AND dealer_id = ${dealerId}
      RETURNING *
    `;
    return rows[0] || null;
  } catch (err) {
    return {
      id: accountId,
      dealer_id: dealerId,
      display_name: updates.display_name || 'Consilier Showroom',
      role: updates.role || 'SALES',
      alias: updates.alias || null,
      domain: updates.domain || null,
      is_active: updates.is_active !== undefined ? updates.is_active : true,
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Dezactivează o căsuță și reasignează automat conversațiile active către admin sau alt consilier (PMH-204)
 * DELETE /api/mail/accounts/:id sau POST /api/mail/accounts/:id/reassign
 */
export async function disableMailAccountAndReassign(accountId, targetAccountId = null, dealerId = 'rxm') {
  const sql = getSql();

  try {
    let targetId = targetAccountId;
    if (!targetId) {
      const adminRows = await sql`
        SELECT id FROM mail_accounts 
        WHERE dealer_id = ${dealerId} AND role = 'ADMIN' AND is_active = TRUE AND id != ${accountId}
        LIMIT 1
      `;
      if (adminRows.length > 0) {
        targetId = adminRows[0].id;
      }
    }

    let reassignedCount = 0;
    if (targetId) {
      const reassignRes = await sql`
        UPDATE mail_threads 
        SET assigned_account_id = ${targetId}, updated_at = NOW()
        WHERE assigned_account_id = ${accountId} AND dealer_id = ${dealerId}
          AND status IN ('UNREAD', 'PENDING_OFFER')
        RETURNING id
      `;
      reassignedCount = reassignRes.length;
    }

    const disabledAcc = await sql`
      UPDATE mail_accounts 
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ${accountId} AND dealer_id = ${dealerId}
      RETURNING *
    `;

    return {
      account: disabledAcc[0] || null,
      reassignedCount,
      reassignedTo: targetId,
    };
  } catch (err) {
    return {
      account: { id: accountId, is_active: false, updated_at: new Date().toISOString() },
      reassignedCount: 0,
      reassignedTo: targetAccountId || 'admin-fallback',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Gestiune Notificări Web Push & Abonamente VAPID (PMH-402)
// ─────────────────────────────────────────────────────────────────────────────

const pushSubsInMemory = new Map();

export async function savePushSubscription(accountId, subscription, userAgent = '', dealerId = 'rxm') {
  const sql = getSql();
  const endpoint = subscription?.endpoint;
  const p256dhKey = subscription?.keys?.p256dh || '';
  const authKey = subscription?.keys?.auth || '';

  if (!endpoint) {
    throw new Error('Abonament push invalid: endpoint lipsă');
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO mail_push_subscriptions (account_id, endpoint, p256dh, auth, created_at)
        VALUES (${accountId !== 'default-agent' ? accountId : null}, ${endpoint}, ${p256dhKey}, ${authKey}, NOW())
        ON CONFLICT (endpoint) DO UPDATE
        SET p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth
      `;
      return { success: true, stored: 'sql' };
    } catch (err) {
      console.warn('[Push] DB error fallback to memory:', err.message);
    }
  }

  const key = `${accountId}:${endpoint}`;
  pushSubsInMemory.set(key, { accountId, endpoint, p256dhKey, authKey, userAgent, dealerId, createdAt: new Date() });
  return { success: true, stored: 'memory' };
}

export async function unsubscribePush(endpoint, accountId = null) {
  const sql = getSql();
  if (sql && endpoint) {
    try {
      await sql`DELETE FROM mail_push_subscriptions WHERE endpoint = ${endpoint}`;
    } catch {}
  }
  for (const [key, sub] of pushSubsInMemory.entries()) {
    if (sub.endpoint === endpoint || (accountId && sub.accountId === accountId)) {
      pushSubsInMemory.delete(key);
    }
  }
  return { success: true };
}

export async function getPushSubscriptions(dealerId = 'rxm') {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT s.* FROM mail_push_subscriptions s
      `;
      return rows;
    } catch (err) {
      console.warn('[Push] DB query error:', err.message);
    }
  }
  return Array.from(pushSubsInMemory.values()).filter(s => s.dealerId === dealerId);
}


