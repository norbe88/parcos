/**
 * ==============================================================================
 * CARVANA SRL Holding — ParcOS Dealership Operating System
 * Component: SMS Gateway & Multi-Node Hardware Dispatcher (Ported from Tenoia Clinic OS)
 * Invariants: E.164 Romanian Mobile (+407xxxxxxxx), Salted SHA-256 Hashing,
 *             Anti-Flood Rate Limiting (max 3/15m), 10m TTL, 3 Attempts Lockout
 * Gateway Priority:
 *   1. Node-SAMY (Primary Cellular Edge Gateway SM-G998B / SIM Nelimitat)
 *   2. Node-S9+ (Office Cellular Gateway Failover SM-G965F)
 *   3. SMSLink / Twilio (Commercial Failover)
 *   4. Dev Mock Fallback (with { dev_otp })
 * ==============================================================================
 */

import crypto from 'crypto';
import { getSql } from '../db.mjs';

const DEFAULT_SAMY_URL = process.env.NODE_SAMY_SMS_URL || 'http://10.0.0.88:8088/send-sms';
const DEFAULT_S9_URL = process.env.NODE_S9_SMS_URL || 'http://10.0.0.89:8088/send-sms';
const GATEWAY_TOKEN = process.env.EDGE_GATEWAY_TOKEN || 'samy_holding_edge_secret_2026';

/**
 * Normalizes Romanian mobile phone number to international E.164 format (+407xxxxxxxx)
 * Rejects non-Romanian numbers, landlines, and invalid sequences.
 */
export function normalizeRoPhone(phone) {
  if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) {
    const err = new Error('Numărul de telefon este obligatoriu.');
    err.statusCode = 400;
    err.code = 'INVALID_PHONE_NUMBER';
    throw err;
  }

  // Eliminare spații, puncte, cratime, paranteze
  let cleaned = String(phone).trim().replace(/[\s\.\-\(\)]/g, '');

  if (cleaned.startsWith('0040')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (cleaned.startsWith('07')) {
    cleaned = '+40' + cleaned.slice(1);
  } else if (cleaned.startsWith('407')) {
    cleaned = '+' + cleaned;
  }

  // Validare strictă telefon mobil România: +40 urmat de 7 și 8 cifre (12 caractere)
  const roMobileRegex = /^\+407[0-9]{8}$/;
  if (!roMobileRegex.test(cleaned)) {
    const err = new Error(
      'Numărul de telefon este invalid. Introduceți un număr mobil din România valid (ex: 07xxxxxxxx sau +407xxxxxxxx).'
    );
    err.statusCode = 400;
    err.code = 'INVALID_RO_PHONE';
    throw err;
  }

  return cleaned;
}

/**
 * Multi-Gateway SMS Dispatcher with Strict Priority:
 * 1. Node-SAMY (Primary Cellular Edge Gateway)
 * 2. Node-S9+ (Office Cellular Gateway Failover)
 * 3. Commercial Fallover (SMSLink / Twilio)
 * 4. Dev / Test simulation
 */
export async function dispatchSmsWithFallback(phone, message, options = {}) {
  let normalizedPhone;
  try {
    normalizedPhone = normalizeRoPhone(phone);
  } catch (err) {
    normalizedPhone = String(phone).replace(/[^\d+]/g, '');
  }

  const token = process.env.EDGE_GATEWAY_TOKEN || GATEWAY_TOKEN;
  const timeoutMs = options.timeoutMs || 2500;
  const outboxId = options.outboxId || 'sms_' + crypto.randomBytes(8).toString('hex');

  // Înregistrare în outbox dacă DB este conectat
  try {
    const sql = getSql();
    await sql`
      INSERT INTO sms_outbox (id, phone, message, status, attempts)
      VALUES (${outboxId}, ${normalizedPhone}, ${message}, 'PENDING', 1)
      ON CONFLICT (id) DO UPDATE SET attempts = sms_outbox.attempts + 1
    `;
  } catch (e) {
    // Tabela nu există încă sau DB indisponibil
  }

  const markSent = async (provider) => {
    try {
      const sql = getSql();
      await sql`
        UPDATE sms_outbox 
        SET status = 'SENT', provider = ${provider}, sent_at = NOW() 
        WHERE id = ${outboxId}
      `;
    } catch (e) {}
  };

  // 1. Primary: Node-SAMY Edge Gateway
  const candidateUrls = [
    process.env.NODE_SAMY_SMS_URL,
    (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8088/send-sms' : null),
    (process.env.NODE_ENV === 'production' ? DEFAULT_SAMY_URL : null)
  ].filter(Boolean);

  for (const samyUrl of candidateUrls) {
    if (process.env.NODE_ENV === 'test') break;
    try {
      const res = await fetch(samyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Edge-Token': token
        },
        body: JSON.stringify({ phone: normalizedPhone, message, text: message }),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await markSent('node_samy');
        console.log(`📡 [SMS GATEWAY] Trimis cu succes prin Node-SAMY către ${normalizedPhone}`);
        return { ok: true, provider: 'node_samy', dispatched: true, outboxId, response: data };
      }
    } catch (err) {
      console.warn(`[SMS GATEWAY] Node-SAMY candidate (${samyUrl}) failed: ${err.message}`);
    }
  }

  // 2. Hardware Failover: Node-S9+ (Office Cellular Gateway SM-G965F)
  const s9CandidateUrls = [
    process.env.NODE_S9_SMS_URL,
    (process.env.NODE_ENV === 'production' ? DEFAULT_S9_URL : null)
  ].filter(Boolean);

  for (const s9Url of s9CandidateUrls) {
    if (process.env.NODE_ENV === 'test') break;
    try {
      const res = await fetch(s9Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Edge-Token': token
        },
        body: JSON.stringify({ phone: normalizedPhone, message, text: message }),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await markSent('node_s9');
        console.log(`📡 [SMS GATEWAY] Failover reușit prin Node-S9+ către ${normalizedPhone}`);
        return { ok: true, provider: 'node_s9', dispatched: true, outboxId, response: data };
      }
    } catch (err) {
      console.warn(`[SMS GATEWAY] Node-S9+ candidate (${s9Url}) failed: ${err.message}`);
    }
  }

  // 3. Commercial Fallover: SMSLink.ro
  if (process.env.SMSLINK_CONNECTION_ID && process.env.SMSLINK_PASSWORD) {
    try {
      const smsLinkUrl = `https://www.smslink.ro/sms/gateway/communicate/index.php?connection_id=${process.env.SMSLINK_CONNECTION_ID}&password=${process.env.SMSLINK_PASSWORD}&to=${encodeURIComponent(normalizedPhone)}&message=${encodeURIComponent(message)}`;
      const res = await fetch(smsLinkUrl, { signal: AbortSignal.timeout(4000) });
      const text = await res.text();
      if (res.ok && text.startsWith('MESSAGEACK')) {
        await markSent('smslink');
        console.log(`📡 [SMS GATEWAY] Trimis prin SMSLink către ${normalizedPhone}`);
        return { ok: true, provider: 'smslink', dispatched: true, outboxId, response: text };
      }
    } catch (err) {
      console.warn(`[SMS GATEWAY] SMSLink fallback failed: ${err.message}`);
    }
  }

  // 4. Commercial Fallover: Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const formParams = new URLSearchParams();
      formParams.append('To', normalizedPhone);
      formParams.append('From', process.env.TWILIO_PHONE_NUMBER);
      formParams.append('Body', message);

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formParams.toString(),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await markSent('twilio');
        console.log(`📡 [SMS GATEWAY] Trimis prin Twilio către ${normalizedPhone}`);
        return { ok: true, provider: 'twilio', dispatched: true, outboxId, response: data };
      }
    } catch (err) {
      console.warn(`[SMS GATEWAY] Twilio fallback failed: ${err.message}`);
    }
  }

  // 5. Dev Mock Fallback (Simulator pentru medii locale sau fără conexiune GSM)
  console.log(`⚠️ [SMS GATEWAY DEV MOCK] Către: ${normalizedPhone} | Mesaj: "${message}"`);
  await markSent('dev_mock');
  return {
    ok: true,
    provider: 'dev_mock',
    dispatched: false,
    dev_fallback: true,
    outboxId,
    message: 'SMS simulat în dev mode (hardware edge indisponibil).'
  };
}

/**
 * Solicitare cod OTP pentru verificare număr de telefon
 * Anti-Flood: Max 3 cereri / 15 minute
 * TTL: 10 minute
 * Salted SHA-256 hashing
 */
export async function requestPhoneOtp(phone, dealerName = 'ParcOS') {
  const normalizedPhone = normalizeRoPhone(phone);
  const sql = getSql();
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;

  // 1. Anti-Flood Rate Limiting (max 3 per 15 min)
  try {
    const recentRequests = await sql`
      SELECT count(*)::int as count 
      FROM phone_otp_requests 
      WHERE phone = ${normalizedPhone} AND requested_at > ${fifteenMinutesAgo}
    `;
    const count = recentRequests[0]?.count || 0;
    if (count >= 3) {
      const err = new Error(
        'Ați atins limita maximă de 3 coduri SMS pentru acest număr. Vă rugăm să așteptați 15 minute.'
      );
      err.statusCode = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }
  } catch (err) {
    if (err.code === 'RATE_LIMIT_EXCEEDED') throw err;
    // Tabela nu există încă sau altă eroare DB tranzitorie
  }

  // 2. Generare cod OTP de 6 cifre, salt și hash SHA-256
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = crypto.createHash('sha256').update(otp + salt).digest('hex');
  const expiresAt = now + 10 * 60 * 1000; // 10 minute TTL

  // 3. Înregistrare cerere în PostgreSQL
  try {
    await sql`
      INSERT INTO phone_otp_requests (phone, requested_at) 
      VALUES (${normalizedPhone}, ${now})
    `;
  } catch (e) {
    console.warn('[SMS OTP] Warning inserting into phone_otp_requests:', e.message);
  }

  // 4. Salvare sesiune OTP în PostgreSQL
  try {
    await sql`
      INSERT INTO phone_verifications 
        (phone, otp_hash, salt, attempts_left, expires_at, created_at, verified_at)
      VALUES 
        (${normalizedPhone}, ${otpHash}, ${salt}, 3, ${expiresAt}, ${now}, NULL)
      ON CONFLICT (phone) DO UPDATE SET
        otp_hash = EXCLUDED.otp_hash,
        salt = EXCLUDED.salt,
        attempts_left = 3,
        expires_at = EXCLUDED.expires_at,
        created_at = EXCLUDED.created_at,
        verified_at = NULL
    `;
  } catch (e) {
    console.warn('[SMS OTP] Warning saving phone_verifications:', e.message);
  }

  // 5. Trimitere SMS prin Node-SAMY cu failover pe Node-S9+
  const cleanName = (dealerName && dealerName !== 'ParcOS') ? ` (${dealerName})` : '';
  const smsText = `Codul tau de securitate pentru activare cont ParcOS${cleanName} este: ${otp}. Valabil 10 minute.`;
  const dispatchResult = await dispatchSmsWithFallback(normalizedPhone, smsText);

  const isDevMode =
    process.env.NODE_ENV !== 'production' ||
    dispatchResult.dev_fallback ||
    process.env.SMS_DEV_FALLBACK === '1';

  return {
    ok: true,
    phone: normalizedPhone,
    message: 'Codul de verificare a fost trimis prin SMS.',
    expires_in_seconds: 600,
    ...(isDevMode ? { dev_otp: otp } : {})
  };
}

/**
 * Verifică codul OTP introdus de utilizator
 * Verifică expirarea (10m) și blochează după 3 încercări eșuate
 */
export async function verifyPhoneOtp(phone, inputCode) {
  const normalizedPhone = normalizeRoPhone(phone);

  if (!inputCode || typeof inputCode !== 'string' || !/^[0-9]{6}$/.test(inputCode.trim())) {
    const err = new Error('Codul de verificare trebuie să conțină exact 6 cifre numerice.');
    err.statusCode = 400;
    err.code = 'INVALID_OTP_FORMAT';
    throw err;
  }

  const cleanCode = inputCode.trim();
  const sql = getSql();

  let rows = [];
  try {
    rows = await sql`
      SELECT * FROM phone_verifications 
      WHERE phone = ${normalizedPhone} 
      LIMIT 1
    `;
  } catch (e) {
    console.error('[SMS OTP] DB error reading phone_verifications:', e.message);
  }

  const record = rows[0];
  if (!record) {
    const err = new Error('Nu a fost găsită nicio sesiune de verificare activă pentru acest număr de telefon.');
    err.statusCode = 400;
    err.code = 'OTP_SESSION_NOT_FOUND';
    throw err;
  }

  // Verificare TTL Expirare
  const expiresAtNum = Number(record.expires_at);
  if (Date.now() > expiresAtNum) {
    const err = new Error('Codul de verificare a expirat. Vă rugăm să solicitați un nou cod prin SMS.');
    err.statusCode = 400;
    err.code = 'OTP_EXPIRED';
    throw err;
  }

  // Verificare Încercări Rămase
  if (record.attempts_left <= 0) {
    const err = new Error(
      'Ați depășit numărul maxim de încercări permise. Codul de verificare a fost invalidat.'
    );
    err.statusCode = 400;
    err.code = 'ATTEMPTS_EXHAUSTED';
    err.attempts_left = 0;
    throw err;
  }

  // Verificare Hash Criptografic SHA-256 cu Salt
  const computedHash = crypto.createHash('sha256').update(cleanCode + record.salt).digest('hex');

  if (computedHash !== record.otp_hash) {
    const remaining = record.attempts_left - 1;
    try {
      await sql`
        UPDATE phone_verifications 
        SET attempts_left = ${remaining} 
        WHERE phone = ${normalizedPhone}
      `;
    } catch (e) {}

    const msg =
      remaining > 0
        ? `Cod incorect. Mai aveți ${remaining} ${remaining === 1 ? 'încercare' : 'încercări'}.`
        : 'Cod incorect. Ați depășit numărul maxim de încercări permise.';

    const err = new Error(msg);
    err.statusCode = 400;
    err.code = 'INVALID_OTP';
    err.attempts_left = remaining;
    throw err;
  }

  // Validare Reușită!
  const now = Date.now();
  try {
    await sql`
      UPDATE phone_verifications 
      SET verified_at = ${now}, attempts_left = 3 
      WHERE phone = ${normalizedPhone}
    `;
  } catch (e) {}

  return {
    ok: true,
    phone_verified: true,
    phone: normalizedPhone,
    message: 'Număr de telefon verificat cu succes prin SMS.'
  };
}

/**
 * Verifică dacă numărul de telefon a fost verificat recent (ex: în ultimele 30 minute)
 * Folosit ca barieră obligatorie înainte de crearea unui cont dealer
 */
export async function isPhoneRecentlyVerified(phone, maxAgeMinutes = 30) {
  try {
    const normalizedPhone = normalizeRoPhone(phone);
    const sql = getSql();
    const threshold = Date.now() - maxAgeMinutes * 60 * 1000;

    const rows = await sql`
      SELECT verified_at 
      FROM phone_verifications 
      WHERE phone = ${normalizedPhone} AND verified_at IS NOT NULL AND verified_at >= ${threshold}
      LIMIT 1
    `;
    return Boolean(rows && rows.length > 0);
  } catch (e) {
    console.warn('[SMS OTP] Check isPhoneRecentlyVerified error:', e.message);
    return false;
  }
}

/**
 * Trimite SMS de confirmare a aprobării când SuperAdmin validează contul
 */
export async function sendApprovalConfirmationSms(phone, dealerName, slug) {
  try {
    const normalizedPhone = normalizeRoPhone(phone);
    const message = `Felicitari! Contul ParcOS pentru ${dealerName} a fost aprobat si activat. Showroom-ul dvs. este live la: https://${slug}.parcos.ro`;
    return await dispatchSmsWithFallback(normalizedPhone, message);
  } catch (e) {
    console.warn('[SMS OTP] Confirmation SMS failed:', e.message);
    return { ok: false, error: e.message };
  }
}
