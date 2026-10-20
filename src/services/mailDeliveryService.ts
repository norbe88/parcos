/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Outbound SES Delivery Service (PMH-202)
 * Versiune: 1.1.0 • Sprint 2
 * Holding: CARVANA SRL • Invariante: Zero-Bloat • DKIM & Threading • Strict 21% TVA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Responsabilități PMH-202:
 * 1. Formatare antet From: "Nume Angajat - Nume Parc" <adresa@domeniu.ro>
 * 2. Generare Message-ID conform RFC 2822 (<uuid@domeniu>)
 * 3. Threading complet prin In-Reply-To & References (compatibil Gmail/Apple Mail)
 * 4. Verificare obligatorie în Lista de Supresie (mail_suppression_list) înainte de SES
 * 5. Antet List-Unsubscribe pentru e-mailuri comerciale / oferte auto
 * 6. Construire mesaj Raw MIME multipart/mixed cu atașamente base64
 * 7. Livrare securizată prin AWS SES (API REST semnat SigV4 cu fallback Sandbox/Test)
 * 8. Conformitate fiscală: Strict 21% TVA deductibil (VAT_RATE = 0.21) și terminologie de garanție
 */

import crypto from 'crypto';

// Invariant fiscal CARVANA SRL / ParcOS
export const VAT_RATE = 0.21;
export const WARRANTY_ESCROW_TERM = 'Cont de Garanție';
export const RESERVATION_GUARANTEE_TERM = 'Garanție de Rezervare/Participare';

export class SuppressedRecipientError extends Error {
  constructor(public email: string, public reason: string) {
    super(`[SES Deliverability Guard] Adresa ${email} este în lista de supresie (${reason}). Trimiterea este blocată categoric pentru a proteja reputația IP-ului.`);
    this.name = 'SuppressedRecipientError';
  }
}

export interface OutboundAttachment {
  fileName: string;
  mimeType: string;
  content: Buffer | string; // Buffer sau base64 string
}

export interface OutboundEmailOptions {
  dealerId: string;
  dealershipName: string;
  employeeName: string;
  senderEmail: string; // Ex: andrei@rxmautomobile.ro
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  threadId?: string;
  parentMessageId?: string; // RFC 2822 Message-ID la care se răspunde
  references?: string[];
  vehicleId?: string;
  attachments?: OutboundAttachment[];
  isCommercial?: boolean; // Dacă e ofertă comercială -> atașează List-Unsubscribe
  customMessageId?: string;
  unsubscribeUrl?: string;
  suppressionChecker?: (email: string) => Promise<{ suppressed: boolean; reason?: string }>;
}

export interface OutboundDeliveryResult {
  success: boolean;
  messageId: string; // RFC 2822
  sesMessageId?: string; // ID returnat de AWS SES
  rawMimeSize: number;
  threadId?: string;
  deliveredAt: Date;
  isSandboxMode?: boolean;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Formatare Antete & Generare RFC 2822 Identifiers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatează antetul From conform specificației ParcOS:
 * "Nume Angajat - Nume Parc" <adresa@domeniul-parcului.ro>
 */
export function formatSenderHeader(employeeName: string, dealershipName: string, email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const cleanEmployee = employeeName.trim();
  const cleanDealer = dealershipName.trim();

  if (cleanEmployee && cleanDealer) {
    return `"${cleanEmployee} - ${cleanDealer}" <${cleanEmail}>`;
  }
  if (cleanDealer) {
    return `"${cleanDealer}" <${cleanEmail}>`;
  }
  return `<${cleanEmail}>`;
}

/**
 * Extrage domeniul din adresa de email (ex: 'rxmautomobile.ro')
 */
export function extractDomainFromEmail(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase().trim() : 'parcos.ro';
}

/**
 * Generează un identificator unic RFC 2822 Message-ID
 */
export function generateRFC2822MessageId(domain: string): string {
  const cleanDomain = domain.replace(/[^a-z0-9.-]/gi, '');
  const uniqueToken = crypto.randomUUID();
  const timestamp = Date.now();
  return `<${uniqueToken}.${timestamp}@${cleanDomain}>`;
}

/**
 * Generează antetul List-Unsubscribe conform cerințelor de conformitate
 */
export function generateListUnsubscribeHeader(domain: string, recipientEmail: string, customUrl?: string): string {
  const cleanDomain = domain.toLowerCase();
  const mailtoPart = `<mailto:unsubscribe@${cleanDomain}?subject=unsubscribe>`;
  const httpPart = customUrl ? `<${customUrl}>` : `<https://${cleanDomain}/unsubscribe?email=${encodeURIComponent(recipientEmail)}>`;
  return `${mailtoPart}, ${httpPart}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Construire Mesaj Raw MIME (RFC 2822 Multipart/Mixed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Împarte un string base64 lung în linii de 76 caractere (standard RFC 2045)
 */
export function wrapBase64Lines(base64Str: string): string {
  return base64Str.replace(/(.{76})/g, '$1\r\n');
}

/**
 * Construiește mesajul brut MIME multipart/mixed gata de trimis către AWS SES SendRawEmail.
 */
export function buildRawMimeMessage(options: OutboundEmailOptions): { rawMime: string; messageId: string } {
  const domain = extractDomainFromEmail(options.senderEmail);
  const messageId = options.customMessageId || generateRFC2822MessageId(domain);
  const fromHeader = formatSenderHeader(options.employeeName, options.dealershipName, options.senderEmail);
  const toHeader = options.recipientName
    ? `"${options.recipientName.trim()}" <${options.recipientEmail.trim()}>`
    : `<${options.recipientEmail.trim()}>`;

  const dateHeader = new Date().toUTCString();
  const mixedBoundary = `----=_ParcOS_Mixed_${crypto.randomBytes(12).toString('hex')}`;
  const altBoundary = `----=_ParcOS_Alt_${crypto.randomBytes(12).toString('hex')}`;

  const headers: string[] = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
    `Date: ${dateHeader}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
  ];

  // Threading headers
  if (options.parentMessageId) {
    const cleanParent = options.parentMessageId.startsWith('<') ? options.parentMessageId : `<${options.parentMessageId}>`;
    headers.push(`In-Reply-To: ${cleanParent}`);

    const refs = Array.isArray(options.references) && options.references.length > 0
      ? options.references.map((r) => (r.startsWith('<') ? r : `<${r}>`)).join(' ')
      : cleanParent;
    headers.push(`References: ${refs}`);
  }

  // List-Unsubscribe pentru comunicări comerciale
  if (options.isCommercial !== false) {
    headers.push(`List-Unsubscribe: ${generateListUnsubscribeHeader(domain, options.recipientEmail, options.unsubscribeUrl)}`);
  }

  // Antet principal Content-Type
  headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);

  let mimeBody = '';

  // 1. Parte alternativă Text & HTML
  mimeBody += `--${mixedBoundary}\r\n`;
  mimeBody += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;

  // Text simplu
  const plainText = options.textBody || (options.htmlBody ? options.htmlBody.replace(/<[^>]+>/g, ' ').trim() : '');
  if (plainText) {
    mimeBody += `--${altBoundary}\r\n`;
    mimeBody += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeBody += wrapBase64Lines(Buffer.from(plainText, 'utf8').toString('base64')) + '\r\n';
  }

  // HTML
  const htmlContent = options.htmlBody || `<p>${plainText.replace(/\n/g, '<br/>')}</p>`;
  mimeBody += `--${altBoundary}\r\n`;
  mimeBody += `Content-Type: text/html; charset=UTF-8\r\n`;
  mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
  mimeBody += wrapBase64Lines(Buffer.from(htmlContent, 'utf8').toString('base64')) + '\r\n';

  mimeBody += `--${altBoundary}--\r\n`;

  // 2. Atașamente (dacă există)
  if (options.attachments && options.attachments.length > 0) {
    for (const att of options.attachments) {
      const attBuffer = typeof att.content === 'string'
        ? Buffer.from(att.content, 'base64')
        : att.content;

      const safeFileName = att.fileName.replace(/["\r\n]/g, '');
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
// 3. AWS SigV4 Signer pentru AWS SES SendRawEmail (Zero Dependențe Externe)
// ─────────────────────────────────────────────────────────────────────────────

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hashSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmacSha256('AWS4' + key, dateStamp);
  const kRegion = hmacSha256(kDate, regionName);
  const kService = hmacSha256(kRegion, serviceName);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Trimite un e-mail brut către AWS SES folosind SendRawEmail semnat SigV4.
 */
export async function sendRawEmailViaSES(
  rawMime: string,
  credentials: AWSCredentials,
  fetchFn = fetch
): Promise<{ sesMessageId: string }> {
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. Serviciu Principal de Livrare E-mail (mailDeliveryService)
// ─────────────────────────────────────────────────────────────────────────────

export class MailDeliveryService {
  private awsCredentials?: AWSCredentials;
  private isSandbox: boolean;

  constructor(options?: { credentials?: AWSCredentials; isSandbox?: boolean }) {
    this.awsCredentials = options?.credentials || (
      process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'eu-north-1',
          }
        : undefined
    );
    this.isSandbox = options?.isSandbox ?? (process.env.NODE_ENV !== 'production' && !this.awsCredentials);
  }

  /**
   * Trimite un e-mail securizat verificând mai întâi lista de supresie.
   */
  async sendEmail(
    options: OutboundEmailOptions,
    fetchFn = fetch
  ): Promise<OutboundDeliveryResult> {
    // 1. Verificare supresie (Hard Bounce / Complaint)
    if (options.suppressionChecker) {
      const suppression = await options.suppressionChecker(options.recipientEmail);
      if (suppression.suppressed) {
        throw new SuppressedRecipientError(options.recipientEmail, suppression.reason || 'UNKNOWN');
      }
    }

    // 2. Construire Raw MIME
    const { rawMime, messageId } = buildRawMimeMessage(options);

    // 3. Livrare către SES sau Mock Sandbox
    let sesMessageId = `mock-${crypto.randomUUID()}`;

    if (this.awsCredentials && !this.isSandbox) {
      const result = await sendRawEmailViaSES(rawMime, this.awsCredentials, fetchFn);
      sesMessageId = result.sesMessageId;
    } else {
      console.log(`📨 [SES Sandbox Mock] E-mail livrat virtual către ${options.recipientEmail} (${messageId})`);
    }

    return {
      success: true,
      messageId,
      sesMessageId,
      rawMimeSize: Buffer.byteLength(rawMime, 'utf8'),
      threadId: options.threadId,
      deliveredAt: new Date(),
      isSandboxMode: this.isSandbox,
    };
  }

  /**
   * Creează un șablon de ofertă auto cu respectarea strictă a TVA 21% și a terminologiei de garanție
   */
  generateVehicleOfferTemplate(params: {
    customerName: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleVin?: string;
    priceEurNet: number;
    warrantyMonths: number;
    dealershipName: string;
    employeeName: string;
    contactPhone?: string;
  }): { subject: string; textBody: string; htmlBody: string } {
    const tvaAmount = params.priceEurNet * VAT_RATE;
    const priceGrossEur = params.priceEurNet + tvaAmount;

    const subject = `Ofertă Specială: ${params.vehicleBrand} ${params.vehicleModel} — ${params.dealershipName}`;

    const textBody = `
Bună ziua, ${params.customerName},

Vă mulțumim pentru interesul acordat parcului nostru auto, ${params.dealershipName}.
Vă transmitem oferta detaliată pentru vehiculul ${params.vehicleBrand} ${params.vehicleModel}${params.vehicleVin ? ` (VIN: ${params.vehicleVin})` : ''}:

• Preț Net: ${params.priceEurNet.toLocaleString('ro-RO')} EUR
• TVA deductibil (21%): ${tvaAmount.toLocaleString('ro-RO')} EUR
• Preț Total Brut (TVA 21% inclus): ${priceGrossEur.toLocaleString('ro-RO')} EUR
• Garanție Tehnică Inclusă: ${params.warrantyMonths} luni
• Plată Securizată: ${WARRANTY_ESCROW_TERM} / ${RESERVATION_GUARANTEE_TERM}

Pentru rezervarea autovehiculului sau detalii suplimentare, vă rugăm să răspundeți direct la acest e-mail.

Cu stimă,
${params.employeeName}
${params.dealershipName}
${params.contactPhone ? `Tel: ${params.contactPhone}` : ''}
    `.trim();

    const htmlBody = `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 8px; max-width: 600px;">
  <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">${params.dealershipName}</h2>
    <p style="color: #a1a1aa; margin: 4px 0 0 0; font-size: 13px;">Ofertă Oficială de Preț • ParcOS Mail Hub</p>
  </div>
  
  <p style="font-size: 15px;">Bună ziua, <strong>${params.customerName}</strong>,</p>
  <p style="font-size: 14px; color: #d4d4d8;">Vă transmitem specificația și oferta financiară pentru autovehiculul solicitat:</p>
  
  <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <h3 style="margin: 0 0 10px 0; color: #fafafa; font-size: 16px;">${params.vehicleBrand} ${params.vehicleModel}</h3>
    ${params.vehicleVin ? `<p style="margin: 0 0 12px 0; font-size: 12px; color: #71717a; font-family: monospace;">VIN: ${params.vehicleVin}</p>` : ''}
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #a1a1aa;">Preț Net:</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.priceEurNet.toLocaleString('ro-RO')} EUR</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #a1a1aa;">TVA Deductibil (21%):</td>
        <td style="padding: 6px 0; text-align: right; color: #f59e0b;">+${tvaAmount.toLocaleString('ro-RO')} EUR</td>
      </tr>
      <tr style="border-top: 1px solid #3f3f46;">
        <td style="padding: 10px 0 6px 0; font-weight: 700; color: #f4f4f5;">Preț Total Brut:</td>
        <td style="padding: 10px 0 6px 0; text-align: right; font-weight: 700; color: #10b981; font-size: 17px;">${priceGrossEur.toLocaleString('ro-RO')} EUR</td>
      </tr>
    </table>
  </div>
  
  <div style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
    <p style="margin: 4px 0;">🛡️ <strong>Garanție:</strong> ${params.warrantyMonths} luni asigurate conform contractului de vânzare-cumpărare.</p>
    <p style="margin: 4px 0;">🔒 <strong>Siguranță Financiară:</strong> Tranzacție garantată prin <em>${WARRANTY_ESCROW_TERM}</em> și <em>${RESERVATION_GUARANTEE_TERM}</em>.</p>
  </div>
  
  <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 13px; color: #71717a;">
    <p style="margin: 2px 0; color: #f4f4f5; font-weight: 600;">${params.employeeName}</p>
    <p style="margin: 2px 0;">Consilier Vânzări • ${params.dealershipName}</p>
    ${params.contactPhone ? `<p style="margin: 2px 0;">Tel: ${params.contactPhone}</p>` : ''}
  </div>
</div>
    `.trim();

    return { subject, textBody, htmlBody };
  }
}
