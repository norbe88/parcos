/**
 * RXM Automobile — Self-Hosted Micro-API Server
 * Zero-Bloat Node.js HTTP Server • Port 3001
 * Invariante: Strict 21% TVA • Stocare Locală VPS • PostgreSQL 18
 * Securitate: Autentificare strictă Admin pentru toate operațiunile de scriere/ștergere/upload
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';
import { 
  getAllPublicVehicles, 
  getPublicVehicleById, 
  getAllAdminVehicles, 
  getAdminVehicleById, 
  upsertVehicle, 
  deleteVehicle, 
  updateVehicleOlxLink,
  initDatabase,
  getDealerBySlug,
  getDealerByDomain,
  getAllDealers,
  updateDealer,
  updateDealerFeatures,
  propagateFeatureGlobally,
  upsertDealer,
  insertLandingLead,
  recordVehicleView,
  getTopViewedVehicles,
  recordTrafficEvent,
  getSiteTrafficAnalytics,
  getSql
} from './db.mjs';
import { requestPhoneOtp, verifyPhoneOtp, isPhoneRecentlyVerified, dispatchSmsWithFallback } from './services/smsGatewayService.mjs';
import { saveCarImageDataUrl, saveCarImageToDisk, deleteCarMediaFromDisk, createPresignedUploadUrl } from './mediaStorage.mjs';
import { fetchAutovitLive } from '../scripts/marketScraperHelper.js';
import {
  handleInboundWebhook,
  isMailHubEnabled,
  handleBounceWebhook,
  handleOutboundSend,
  buildRawMimeMessage,
  sendRawEmailViaSESWithRetry,
  getMailThreads,
  getMailThreadById,
  updateThreadStatus,
  updateThreadVehicle,
  assignThreadToAccount,
  searchMail,
  getMailStats,
  getMailAccounts,
  createMailAccount,
  updateMailAccount,
  disableMailAccountAndReassign,
  savePushSubscription,
  unsubscribePush,
  getPushSubscriptions
} from './mailHub.mjs';
import {
  registerDomainInSES,
  syncDnsToCloudflare,
  checkDomainVerificationStatus,
  buildDnsChecklist,
  saveDomainRecord
} from './mailDomainProvisioner.mjs';
import {
  getStorageStats,
  enforceStorageQuota,
  streamFileFromVault,
  getUploadsDir
} from './storageLifecycle.mjs';
import {
  getTierPricing,
  generateSaasInvoiceForTenant,
  checkOverdueSubscriptions,
  markInvoicePaid,
  CARVANA_HOLDING_ISSUER,
  SAAS_TIER_PRICING
} from './saasBillingService.mjs';
import { handleSuperAdminRoutes } from './routes/superadmin.mjs';
import { handleBackupRoutes } from './routes/backups.mjs';
import { handleAnafRoutes } from './routes/anaf.mjs';
import { handleAuthRoutes } from './routes/auth.mjs';
import { handleLeadRoutes } from './routes/leads.mjs';
import { handleFinancingRoutes } from './routes/financing.mjs';

const PORT = process.env.PORT || 3000;
// Fallback de localhost și IP de infrastructură. Host-ul de producție nu citește această constantă.
const DEALER_SLUG = process.env.DEALER_SLUG || 'rxm';

// Generare secret efemer dacă variabila de mediu ADMIN_API_KEY nu este setată (Zero hardcoded credentials)
const GENERATED_SECRET = crypto.randomBytes(32).toString('hex');
export const ADMIN_API_KEY = (process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY.length >= 32)
  ? process.env.ADMIN_API_KEY
  : GENERATED_SECRET;

if (ADMIN_API_KEY === GENERATED_SECRET) {
  console.log(`🔒 [AUTH] ADMIN_API_KEY nu este configurat în mediu. S-a generat token efemer securizat.`);
}

// Master Key SuperAdmin configurată în mediu sau cheie de dev securizată
export const SUPERADMIN_MASTER_KEY = process.env.SUPERADMIN_MASTER_KEY || 'parcos_superadmin_dev_secret_2026';

// Hash-uri de autentificare decuplate canonic:
// 1. ParcOS SuperAdmin (parcos.ro): 'Olaf.0311'
export const SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH || 'e180c917ef121846cee6c6b488b9d7a159c12c96880c1901b5a309ca66efb7c2'; // SHA-256('Olaf.0311')
// 2. RXM Showroom Admin (rxmautomobile.ro): 'Luna.RXM'
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'dbc1d0952684f4b89cc86bc7ffdd52cacc2a79e667b7e0765953069e05bb6589'; // SHA-256('Luna.RXM')

// Sesiuni administrator active (token -> { createdAt, expiresAt, role })
const activeSessions = new Map();

const DEALER_SESSION_SLUG = /^[a-z0-9_]+$/;

function generateSessionToken(role = 'dealer_admin', dealerSlug) {
  const slug = String(dealerSlug || '').trim().toLowerCase();
  if (!DEALER_SESSION_SLUG.test(slug)) return null;
  const randomPart = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
  const payload = `${expiresAt}.${slug}.${randomPart}`;
  const hmac = crypto.createHmac('sha256', ADMIN_API_KEY).update(payload).digest('hex');
  const token = `${payload}.${hmac}`;
  activeSessions.set(token, {
    createdAt: Date.now(),
    expiresAt,
    role,
    dealerSlug: slug
  });
  return token;
}

export function generateSuperAdminSessionToken() {
  const randomPart = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
  const payload = `${expiresAt}.${randomPart}`;
  const hmac = crypto.createHmac('sha256', SUPERADMIN_MASTER_KEY).update(payload).digest('hex');
  const token = `${payload}.${hmac}`;
  activeSessions.set(token, {
    createdAt: Date.now(),
    expiresAt,
    role: 'superadmin'
  });
  return token;
}

function hmacMatches(payload, signature) {
  const expectedSig = crypto.createHmac('sha256', ADMIN_API_KEY).update(payload).digest('hex');
  const sigBuf = Buffer.from(String(signature));
  const expectedBuf = Buffer.from(expectedSig);
  return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
}

function isLegacyDealerHost(expectedSlug) {
  const slug = String(expectedSlug || '').trim().toLowerCase();
  const envSlug = String(DEALER_SLUG || 'rxm').trim().toLowerCase();
  return slug === 'rxm' || slug === envSlug;
}

function isValidSessionToken(token, expectedSlug) {
  if (!token || typeof token !== 'string') return false;

  // Cheia brută rămâne calea de daemon. Nu este o sesiune de parc.
  try {
    const tokenBuf = Buffer.from(token);
    const keyBuf = Buffer.from(ADMIN_API_KEY);
    if (tokenBuf.length === keyBuf.length && crypto.timingSafeEqual(tokenBuf, keyBuf)) {
      return true;
    }
  } catch {}

  const slug = String(expectedSlug || '').trim().toLowerCase();
  if (!DEALER_SESSION_SLUG.test(slug)) return false;

  try {
    const parts = token.split('.');
    if (parts.length === 4) {
      const [expiresAtStr, dealerSlug, randomPart, signature] = parts;
      if (dealerSlug !== slug) return false;
      const expiresAt = Number(expiresAtStr);
      if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
      return hmacMatches(`${expiresAtStr}.${dealerSlug}.${randomPart}`, signature);
    }
    if (parts.length === 3 && isLegacyDealerHost(slug)) {
      const [expiresAtStr, randomPart, signature] = parts;
      const expiresAt = Number(expiresAtStr);
      if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
      return hmacMatches(`${expiresAtStr}.${randomPart}`, signature);
    }
  } catch {}

  return false;
}

function revokeSessionToken(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

// ══════════════════════════════════════════════════════════════════
// GEMINI VISION OCR ENGINE & KEY ROTATION (HOLDING RESILIENT POOL)
// ══════════════════════════════════════════════════════════════════
let geminiKeyRoundRobinIndex = 0;
export function getResolvedGeminiKeys() {
  let envKeyStr = process.env.GEMINI_API_KEY || '';
  if (!envKeyStr) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
        if (match && match[1]) {
          envKeyStr = match[1].trim();
        }
      }
    } catch {}
  }
  const parsed = envKeyStr.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  if (parsed.length <= 1) return parsed;

  // Load balancing automat (Round-Robin) între cheile din pool (AutoLicit-2 & silentx2z)
  const offset = geminiKeyRoundRobinIndex % parsed.length;
  geminiKeyRoundRobinIndex = (geminiKeyRoundRobinIndex + 1) % parsed.length;
  return [...parsed.slice(offset), ...parsed.slice(0, offset)];
}

// ══════════════════════════════════════════════════════════════════
// PARCOS DEMO OCR SCANNER — RATE LIMITING & SECURITY (MAX 3 SCANS)
// ══════════════════════════════════════════════════════════════════
export const DEMO_OCR_MAX_SCANS = 3;
const DEMO_OCR_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore
const demoOcrUsageMap = new Map(); // key (ip or clientToken) -> { count: number, resetAt: number }

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export function checkDemoOcrLimit(ip, clientToken) {
  const now = Date.now();
  let maxUsed = 0;
  
  for (const key of [ip, clientToken].filter(Boolean)) {
    const entry = demoOcrUsageMap.get(key);
    if (entry) {
      if (now > entry.resetAt) {
        demoOcrUsageMap.delete(key);
      } else {
        maxUsed = Math.max(maxUsed, entry.count);
      }
    }
  }

  const remaining = Math.max(0, DEMO_OCR_MAX_SCANS - maxUsed);
  return {
    allowed: remaining > 0,
    remaining,
    used: maxUsed,
    maxAllowed: DEMO_OCR_MAX_SCANS
  };
}

export function incrementDemoOcrUsage(ip, clientToken) {
  const now = Date.now();
  const resetAt = now + DEMO_OCR_TTL_MS;
  let newCount = 1;

  for (const key of [ip, clientToken].filter(Boolean)) {
    const entry = demoOcrUsageMap.get(key);
    if (!entry || now > entry.resetAt) {
      demoOcrUsageMap.set(key, { count: 1, resetAt });
      newCount = Math.max(newCount, 1);
    } else {
      entry.count += 1;
      newCount = Math.max(newCount, entry.count);
    }
  }

  return Math.max(0, DEMO_OCR_MAX_SCANS - newCount);
}

export const VEHICLE_DOC_PROMPT = `You are an expert automotive document analyst specializing in European and International vehicle registration documents:
- Romania: CIV (Cartea de Identitate a Vehiculului — CIV RAR) & Talon (Certificat de Înmatriculare)
- Germany: Zulassungsbescheinigung Teil I (Fahrzeugschein) & Teil II (Fahrzeugbrief)
- Austria: Zulassungsbescheinigung Teil I (Zulassungsschein) & Teil II (Typenschein / Einzelgenehmigung / KFG 1967)
- France: Certificat d'immatriculation (Carte Grise)
- Italy: Carta di Circolazione / Documento Unico
- Netherlands / Belgium: Kentekenbewijs (RDW) / Inschrijvingsbewijs
- USA: Certificate of Title

Analyze the document image.
Extract all technical, identification and registration data into a strict JSON object (NO markdown fences, NO explanatory text):
{
  "docOriginCountry": "AT", // One of: "RO", "DE", "AT", "FR", "IT", "NL", "BE", "US", "OTHER"
  "docType": "Zulassungsbescheinigung Teil I", // or "Cartea de Identitate a Vehiculului (CIV)", "Talon Auto", "Zulassungsschein"
  "brand": "Nissan", // Exact brand (field D.1 or 2. Marcă on CIV, e.g. Dacia, Nissan, BMW, Volkswagen, Audi)
  "model": "Qashqai", // Commercial model name without brand prefix (field D.3 or 3. Tipul/Varianta, e.g. Qashqai, Duster, Golf, 520d)
  "versionTrim": "1.5 dCi J11", // Commercial trim level, version, or engine designation (field D.2)
  "vin": "SJNFAAJ11U1120210", // 17-character VIN (field E or E FIN on Austrian/German brief, field 1 on CIV)
  "year": 2015, // 4-digit manufacturing/registration year (field B: Erstmalige Zulassung am)
  "registrationDate": "09.04.2015", // Full date of first registration (field B)
  "powerKw": 81, // Net power in kW from field P.2 (Leistung)
  "powerHp": 110, // Power in HP calculated as round(powerKw * 1.35962)
  "engineCc": 1461, // Displacement in cm3 from field P.1 (Hubraum)
  "fuelType": "Diesel", // One of: "Diesel", "Benzină", "Hibrid", "Electric" (from P.3 Antriebsart/Kraftstoff)
  "color": "Alb", // Color in Romanian: Alb (Weiß), Negru Metalizat (Schwarz), Gri (Grau), Albastru (Blau), Roșu (Rot)
  "bodyType": "SUV", // One of: "SUV", "Sedan", "Break", "Hatchback", "Coupe"
  "civNumber": "AT-202676", // National code or document number (Seria CIV pe RO, field A7 pe AT)
  "plateNumber": "JO-268HK", // License plate number if visible (field A)
  "euroNorm": "Euro 5", // Euro norm from field V.9
  "co2": "108 g/km", // CO2 emissions
  "confidenceScore": 98
}
Strict Rules:
1. Brand MUST be actual brand, model MUST NOT repeat brand.
2. VIN MUST be exactly 17 characters (no I, O, Q).
3. Do NOT invent data — return null for unreadable fields.`;

export const ID_CARD_PROMPT = `You are a specialized European Identity Document OCR AI Analyst for Romanian Identity Cards (Cărți de Identitate):
1. Romanian Identity Card - Classic Format (Carte de Identitate Românească clasică)
2. Romanian Electronic Identity Card (Carte Electronică de Identitate nouă / format card UE)
3. Romanian Passport (Pașaport Românesc)

Your job is to read the photo of the identity card and extract the customer's personal data into a STRICT JSON object (NO markdown fences, NO explanatory text).

Target JSON Schema:
{
  "fullName": "POPESCU MIHAI", // Complete Full Name (Last Name + First Name) in uppercase or capitalized
  "lastName": "POPESCU", // Nume de familie
  "firstName": "MIHAI", // Prenume
  "cnp": "1850412125890", // Exactly 13 numeric digits of the C.N.P. (Cod Numeric Personal)
  "idSeries": "CJ", // 2 uppercase letters for the series (e.g. CJ, KX, HD, IF, RT, XR, etc.)
  "idNumber": "874521", // Exactly 6 digits for the ID number (Număr)
  "address": "Str. Memorandumului nr. 12, Bl. A, Sc. 1, Ap. 4", // Clean full address (Street, Number, Block, Staircase, Flat/Apartment) WITHOUT repeating the county
  "city": "Cluj-Napoca", // Municipality / City / Commune / Village
  "county": "Cluj", // County (Județ) - e.g. Cluj, Bihor, Maramureș, Sălaj, București, Ilfov, Alba, Mureș, etc.
  "issuingAuthority": "SPCLEP Cluj-Napoca", // Emis de (e.g. SPCLEP Cluj-Napoca, Politia...)
  "expiryDate": "12.05.2030", // Expiration date DD.MM.YYYY
  "docTypeDetected": "CI_RO_CLASIC", // "CI_RO_CLASIC" | "CI_RO_ELECTRONIC" | "PASAPORT" | "ALT_ACT"
  "confidenceScore": 98 // 0-100 score
}

Strict Rules:
1. CNP MUST be 13 digits. Look for the label "CNP" or the 13-digit sequence in MRZ (Machine Readable Zone at the bottom).
2. Seria is always 2 letters, Număr is always 6 digits (found near "SERIA" and "NR" or in the MRZ line).
3. In Romanian classic ID:
   - "Nume/Nom/Last name" is the family name.
   - "Prenume/Prenom/First name" is the given name.
   - "Domiciliu/Adresse/Address" contains the full residential address: Street, Number, Block, Apartment.
4. Clean up any OCR noise or stray punctuation.
5. If the document is partially cut or blurry, do your best extraction and set confidenceScore accordingly.
6. Return ONLY the raw JSON object.`;

// ══════════════════════════════════════════════════════════════════
// DEALER OS — MULTI-TENANT RESOLUTION ENGINE (PMH-T02)
// ══════════════════════════════════════════════════════════════════
const tenantConfigCache = new Map();
const TENANT_CACHE_TTL = 60 * 1000;

// Cache ANAF (CUI -> dateFiscale, TTL 24h) & Rate Limiting
const anafCache = new Map();
const ANAF_CACHE_TTL = 24 * 60 * 60 * 1000;
const anafRateMap = new Map();
const ANAF_RATE_LIMIT = 30; // max 30 req/min
const ANAF_RATE_WINDOW = 60 * 1000;

// Rate-limit Market Lookup (Autovit Live Scraper Proxy)
const marketLookupRateMap = new Map();
const MARKET_LOOKUP_RATE_LIMIT = 20; // max 20 req/min

// ══════════════════════════════════════════════════════════════════
// PARCOS MULTI-TENANT AI RATE LIMITER & CIRCUIT BREAKER (T03)
// ══════════════════════════════════════════════════════════════════
export const TENANT_AI_MINUTE_LIMIT = 15; // max 15 cereri / minut
export const TENANT_AI_DAILY_LIMIT = 100; // max 100 cereri / zi
const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Map: tenantId -> { minuteRequests: number[], dailyRequests: number[] }
const tenantAiUsageMap = new Map();

// Circuit Breaker State
const circuitBreakerState = {
  failures: 0,
  maxFailures: 3,
  state: 'CLOSED', // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  cooldownMs: 30 * 1000, // 30 secunde cooldown
  nextAttempt: 0
};

export function checkTenantAiRateLimit(tenantId) {
  const now = Date.now();
  let usage = tenantAiUsageMap.get(tenantId);
  if (!usage) {
    usage = { minuteRequests: [], dailyRequests: [] };
    tenantAiUsageMap.set(tenantId, usage);
  }

  // Curățare ferestre de timp expirate
  usage.minuteRequests = usage.minuteRequests.filter(ts => now - ts < ONE_MINUTE_MS);
  usage.dailyRequests = usage.dailyRequests.filter(ts => now - ts < ONE_DAY_MS);

  if (usage.minuteRequests.length >= TENANT_AI_MINUTE_LIMIT) {
    const oldest = usage.minuteRequests[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + ONE_MINUTE_MS - now) / 1000));
    return {
      allowed: false,
      limitType: 'per_minute',
      remaining: 0,
      limit: TENANT_AI_MINUTE_LIMIT,
      retryAfterSeconds: retryAfter,
      message: 'Ați atins limita de procesare simultană a documentelor. Vă rugăm să așteptați câteva momente.'
    };
  }

  if (usage.dailyRequests.length >= TENANT_AI_DAILY_LIMIT) {
    const oldest = usage.dailyRequests[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + ONE_DAY_MS - now) / 1000));
    return {
      allowed: false,
      limitType: 'per_day',
      remaining: 0,
      limit: TENANT_AI_DAILY_LIMIT,
      retryAfterSeconds: retryAfter,
      message: 'Ați atins limita zilnică de procesare a documentelor (max 100/zi). Vă rugăm să contactați suportul.'
    };
  }

  return {
    allowed: true,
    remainingMinute: TENANT_AI_MINUTE_LIMIT - usage.minuteRequests.length,
    remainingDaily: TENANT_AI_DAILY_LIMIT - usage.dailyRequests.length
  };
}

export function recordTenantAiUsage(tenantId) {
  const now = Date.now();
  let usage = tenantAiUsageMap.get(tenantId);
  if (!usage) {
    usage = { minuteRequests: [], dailyRequests: [] };
    tenantAiUsageMap.set(tenantId, usage);
  }
  usage.minuteRequests.push(now);
  usage.dailyRequests.push(now);
}

export function resetTenantAiUsage(tenantId) {
  tenantAiUsageMap.delete(tenantId);
}

export function checkAiCircuitBreaker() {
  const now = Date.now();
  if (circuitBreakerState.state === 'OPEN') {
    if (now < circuitBreakerState.nextAttempt) {
      return {
        isOpen: true,
        retryAfterMs: circuitBreakerState.nextAttempt - now,
        message: 'Serviciul inteligent este temporar indisponibil la furnizor. Datele mașinii pot fi completate manual.'
      };
    }
    circuitBreakerState.state = 'HALF_OPEN';
  }
  return { isOpen: false };
}

export function recordAiSuccess() {
  circuitBreakerState.failures = 0;
  circuitBreakerState.state = 'CLOSED';
}

export function recordAiFailure() {
  circuitBreakerState.failures++;
  if (circuitBreakerState.failures >= circuitBreakerState.maxFailures) {
    circuitBreakerState.state = 'OPEN';
    circuitBreakerState.nextAttempt = Date.now() + circuitBreakerState.cooldownMs;
    console.warn(`[AI Circuit-Breaker] Declanșat OPEN pentru ${circuitBreakerState.cooldownMs / 1000}s după ${circuitBreakerState.failures} erori consecutive.`);
  }
}

export const DEFAULT_DEALER_PROFILES = {
  rxm: {
    id: 1,
    name: 'RXM AUTOMOBILE SRL',
    slug: 'rxm',
    domain: 'rxmautomobile.ro',
    phone_primary: '0748 892 937',
    phone_secondary: '0758 042 979',
    whatsapp_number: '40748892937',
    email: 'contact@rxmautomobile.ro',
    address_street: 'Strada Colonia Hodai F.N.',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    vat_number: 'RO48482214',
    is_active: true,
    features: { mailHub: true },
    config: {
      themePreset: 'obsidian_gold',
      vatRate: 0.21,
      bank: {
        name: 'Banca Transilvania',
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare'
      }
    }
  },
  mpi_auto: {
    id: 2,
    name: 'MPI AUTO CLA S.R.L.',
    slug: 'mpi_auto',
    domain: 'mpiauto.ro',
    phone_primary: '0759 757 858',
    phone_secondary: '0749 691 302',
    whatsapp_number: '40759757858',
    email: 'contact@mpiauto.ro',
    address_street: 'Centura Apahida, jud. Cluj',
    city: 'Apahida',
    county: 'Cluj',
    vat_number: 'RO43460100',
    is_active: true,
    features: { mailHub: false },
    config: {
      themePreset: 'clean_white',
      vatRate: 0.21,
      bank: {
        name: 'Banca Transilvania',
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare'
      }
    }
  },
  top_auto: {
    id: 3,
    name: 'ALD AUTOLAND S.R.L.',
    slug: 'top_auto',
    domain: 'aldautoland.ro',
    phone_primary: '0740 987 654',
    phone_secondary: '0741 876 543',
    whatsapp_number: '40740987654',
    email: 'office@aldautoland.ro',
    address_street: 'B-dul Muncii nr. 18',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    vat_number: 'RO41920199',
    is_active: true,
    features: { mailHub: false },
    config: {
      themePreset: 'midnight_blue',
      vatRate: 0.21,
      bank: {
        name: 'Banca Transilvania',
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare'
      }
    }
  },
  parcos: {
    id: 10,
    name: 'ParcOS — Dealership Operating System',
    slug: 'parcos',
    domain: 'parcos.ro',
    phone_primary: '0748 892 937',
    phone_secondary: '0758 042 979',
    whatsapp_number: '40748892937',
    email: 'contact@parcos.ro',
    address_street: 'Cluj-Napoca / Turnkey Cloud',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    vat_number: 'RO48482214',
    is_active: true,
    features: { mailHub: false },
    config: {
      themePreset: 'obsidian_gold',
      vatRate: 0.21,
      bank: {
        name: 'Banca Transilvania',
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare'
      }
    }
  }
};

function normalizeSlug(raw) {
  if (!raw) return '';
  const s = String(raw).trim().toLowerCase();
  if (s === 'topauto' || s === 'top_auto_transilvania' || s === 'top-auto') return 'top_auto';
  if (s === 'mpi' || s === 'mpiauto' || s === 'mpi-auto') return 'mpi_auto';
  if (s === 'rxm-automobile' || s === 'rxmautomobile') return 'rxm';
  return s;
}

function getStagedDealerProfile(slugOrHost) {
  try {
    const configPath = path.join(process.cwd(), 'staged_imports', 'dealers_config.json');
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data[slugOrHost]) {
        const d = data[slugOrHost];
        return {
          id: d.id || 99,
          name: d.name,
          slug: d.key,
          domain: d.domain,
          phone_primary: d.phonePrimary || d.phone || '',
          phone_secondary: d.phoneSecondary || '',
          whatsapp_number: d.whatsappNumber || d.phonePrimary || '',
          email: d.sellerEmail || d.email || '',
          address_street: d.pickupAddress || d.address || '',
          city: d.location?.split(',')[0]?.trim() || 'Cluj-Napoca',
          county: 'Cluj',
          vat_number: d.companyCui,
          is_active: true,
          config: {
            themePreset: d.themePreset || 'obsidian_gold',
            vatRate: 0.21,
            bank: {
              name: 'Banca Transilvania',
              warrantyTerm: 'Cont de Garanție',
              reservationTerm: 'Garanție de Rezervare/Participare'
            }
          }
        };
      }
      // Check by domain
      const byDomain = Object.values(data).find(
        (d) => d.domain === slugOrHost || (d.domain && slugOrHost.includes(d.domain))
      );
      if (byDomain) {
        return {
          id: byDomain.id || 99,
          name: byDomain.name,
          slug: byDomain.key,
          domain: byDomain.domain,
          phone_primary: byDomain.phonePrimary || byDomain.phone || '',
          phone_secondary: byDomain.phoneSecondary || '',
          whatsapp_number: byDomain.whatsappNumber || byDomain.phonePrimary || '',
          email: byDomain.sellerEmail || byDomain.email || '',
          address_street: byDomain.pickupAddress || byDomain.address || '',
          city: byDomain.location?.split(',')[0]?.trim() || 'Cluj-Napoca',
          county: 'Cluj',
          vat_number: byDomain.companyCui,
          is_active: true,
          config: {
            themePreset: byDomain.themePreset || 'obsidian_gold',
            vatRate: 0.21,
            bank: {
              name: 'Banca Transilvania',
              warrantyTerm: 'Cont de Garanție',
              reservationTerm: 'Garanție de Rezervare/Participare'
            }
          }
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Verifică dacă cererea provine de la un administrator autentificat cu sesiune validă pe server.
 */
function readDealerAdminToken(req) {
  const authHeader = req?.headers?.['authorization'] || '';
  const tokenHeader = req?.headers?.['x-admin-token'] || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.substring(7).trim();
  if (authHeader) return authHeader.trim();
  if (tokenHeader) return String(tokenHeader).trim();
  return '';
}

async function expectedDealerSlug(req, urlObj) {
  try {
    const tenant = await resolveTenant(req, urlObj);
    if (!tenant || tenant.unconfigured === true || !tenant.slug) return '';
    return String(tenant.slug).trim().toLowerCase();
  } catch {
    return '';
  }
}

async function isAuthorizedAdmin(req, urlObj) {
  if (!req || !req.headers) return false;
  if (isAuthorizedSuperAdmin(req)) return true;
  const slug = await expectedDealerSlug(req, urlObj);
  if (!slug) return false;
  return isValidSessionToken(readDealerAdminToken(req), slug);
}

/**
 * Extrage și normalizează identificatorul de tenant din cerere (Header, Body, Host)
 */
export function resolveTenantIdFromReq(req, body = {}) {
  const headerTenant = req.headers['x-tenant-id'] || req.headers['x-dealer-id'] || '';
  const bodyTenant = body.tenantId || body.tenant_id || body.dealerId || '';
  const candidate = normalizeSlug(bodyTenant || headerTenant);
  if (candidate && (DEFAULT_DEALER_PROFILES[candidate] || candidate.length >= 2)) {
    return candidate;
  }
  const host = (req.headers['host'] || '').toLowerCase();
  for (const [key, profile] of Object.entries(DEFAULT_DEALER_PROFILES)) {
    if (profile.domain && host.includes(profile.domain)) {
      return key;
    }
  }
  return process.env.DEALER_SLUG || 'rxm';
}

// Origini CORS autorizate pentru holding Carvana SRL & dealeri parteneri
export const ALLOWED_CORS_ORIGINS = new Set([
  'https://rxmautomobile.ro',
  'https://www.rxmautomobile.ro',
  'https://mpiauto.ro',
  'https://www.mpiauto.ro',
  'https://topautotransilvania.ro',
  'https://www.topautotransilvania.ro',
  'https://parcos.ro',
  'https://www.parcos.ro',
  'https://showroom.autolit.ro',
  'https://autolit.ro',
  'https://carvana.ro',
  'https://www.carvana.ro',
  'https://autolicit.ro',
  'https://www.autolicit.ro',
  'https://www.olx.ro',
  'https://olx.ro'
]);

/**
 * Validează autorizarea cererii pentru un tenant specific (SuperAdmin, Admin, Tenant Session Token, sau apel direct din propriul domeniu autorizat)
 */
export async function isAuthorizedTenantReq(req, tenantId, urlObj) {
  if (isAuthorizedSuperAdmin(req)) return true;
  if (await isAuthorizedAdmin(req, urlObj)) return true;

  const authHeader = req?.headers?.['authorization'] || '';
  const tokenHeader = req?.headers?.['x-admin-token'] || req?.headers?.['x-tenant-token'] || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  } else if (tokenHeader) {
    token = String(tokenHeader).trim();
  }

  const slug = await expectedDealerSlug(req, urlObj);
  if (slug && isValidSessionToken(token, slug)) return true;

  // Verificare cerere directă din showroom / portal dealer pe origini autorizate
  const origin = (req?.headers?.['origin'] || '').toLowerCase();
  const referer = (req?.headers?.['referer'] || '').toLowerCase();

  if (ALLOWED_CORS_ORIGINS.has(origin)) return true;
  for (const allowed of ALLOWED_CORS_ORIGINS) {
    if (referer.startsWith(allowed)) {
      return true;
    }
  }

  return false;
}


/**
 * Verifică dacă cererea provine de la un SuperAdmin autentificat cu cheie master sau sesiune validă.
 */
export function isAuthorizedSuperAdmin(req) {
  if (!req || !req.headers) return false;
  const authHeader = req.headers['authorization'] || '';
  const superKeyHeader = req.headers['x-superadmin-key'] || req.headers['x-superadmin-token'] || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  } else if (superKeyHeader) {
    token = String(superKeyHeader).trim();
  }

  if (!token) return false;

  // 1. Verificare directă împotriva SUPERADMIN_MASTER_KEY prin timingSafeEqual
  try {
    const tokenBuf = Buffer.from(token);
    const masterBuf = Buffer.from(SUPERADMIN_MASTER_KEY);
    if (tokenBuf.length === masterBuf.length && crypto.timingSafeEqual(tokenBuf, masterBuf)) {
      return true;
    }
  } catch {}

  // 2. Verificare sesiune HMAC emisă cu cheia master
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const [expiresAtStr, randomPart, signature] = parts;
      const expiresAt = Number(expiresAtStr);
      if (Date.now() <= expiresAt) {
        const payload = `${expiresAtStr}.${randomPart}`;
        const expectedSig = crypto.createHmac('sha256', SUPERADMIN_MASTER_KEY).update(payload).digest('hex');
        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return true;
        }
      }
    }
  } catch {}

  // 3. Fallback: dacă tokenul coincide cu ADMIN_API_KEY
  try {
    const tokenBuf = Buffer.from(token);
    const adminKeyBuf = Buffer.from(ADMIN_API_KEY);
    if (tokenBuf.length === adminKeyBuf.length && crypto.timingSafeEqual(tokenBuf, adminKeyBuf)) {
      return true;
    }
  } catch {}

  return false;
}


function resolveCorsOrigin(req) {
  const origin = req?.headers?.['origin'];
  if (!origin) return 'https://rxmautomobile.ro';
  if (ALLOWED_CORS_ORIGINS.has(origin)) return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  if (/^https?:\/\/(www\.)?olx\.ro$/.test(origin)) return origin;
  if (origin.startsWith('chrome-extension://')) return origin;
  return 'https://rxmautomobile.ro';
}

const isStagingDeployment = process.env.IS_STAGING === 'true' || process.env.COOLIFY_APP_NAME === 'parcos-staging';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.tiktok.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://rxmautomobile.ro https://*.googleapis.com https://*.tiktok.com https://*.tiktokv.com; frame-src 'self' https://www.tiktok.com https://*.tiktok.com https://www.youtube.com https://*.youtube.com https://maps.google.com https://www.google.com; frame-ancestors 'self';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  ...(isStagingDeployment ? { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } : {})
};

const PLATFORM_CONSOLE_HOSTS = new Set(['app.parcos.ro', 'admin.parcos.ro']);
const CANONICAL_DEALER_HOSTS = {
  'rxmautomobile.ro': 'rxm',
  'mpiauto.ro': 'mpi_auto',
  'topautotransilvania.ro': 'top_auto',
};
const INFRA_HEALTH_HOSTS = new Set(['152.53.158.65']);

function isUnconfiguredTenant(tenant) {
  return !tenant || tenant.unconfigured === true;
}

function sendUnconfiguredShowroom(res) {
  return sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
}

async function requireMailHub(req, res, urlObj) {
  const tenant = await resolveTenant(req, urlObj);
  if (isUnconfiguredTenant(tenant)) {
    sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
    return null;
  }
  if (!isMailHubEnabled(tenant)) {
    sendJson(res, 404, { success: false, error: 'Mail Hub este oprit' });
    return null;
  }
  return String(tenant.slug).trim().toLowerCase();
}

function cacheTenantHost(host, profile) {
  tenantConfigCache.set(`host:${host}`, { data: profile, timestamp: Date.now() });
  return profile;
}

export async function resolveTenant(req, urlObj) {
  // 1. Deducere domeniu real din antetul Host (fără spoofing din exterior)
  const rawHost = (req?.headers?.['host'] || '').split(':')[0].toLowerCase().trim();
  const host = rawHost.replace(/^www\./, '');
  const isLocalDev = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
  const isSuperAdmin = isAuthorizedSuperAdmin(req);
  const isPlatformHost = host === 'parcos.ro' || host === 'staging.parcos.ro' || PLATFORM_CONSOLE_HOSTS.has(host) || isLocalDev;

  // 2. Protecție Strictă Multi-Tenant în Producție:
  // Pe domenii de producție dedicate (ex: rxmautomobile.ro, mpiauto.ro), tenantul este determinat STRICT din domeniu.
  // Pe domeniul central al platformei (parcos.ro, staging.parcos.ro) sau mediul local, parametrul ?dealer=...
  // este autorizat pentru a permite accesul și previzualizarea showroom-urilor din platformă.
  const queryDealer = urlObj?.searchParams?.get('dealer') || 
                      urlObj?.searchParams?.get('dealer_slug') || 
                      urlObj?.searchParams?.get('tenant');
  const headerSlug = req?.headers?.['x-dealer-slug'];

  if ((isPlatformHost || isSuperAdmin) && (queryDealer || headerSlug)) {
    const rawTarget = (isSuperAdmin && headerSlug) ? headerSlug : (queryDealer || headerSlug);
    const cleanSlug = normalizeSlug(rawTarget);
    if (cleanSlug && cleanSlug !== 'parcos') {
      const cached = tenantConfigCache.get(`slug:${cleanSlug}`);
      if (cached && (Date.now() - cached.timestamp < TENANT_CACHE_TTL)) {
        return cached.data;
      }
      const dbDealer = await getDealerBySlug(cleanSlug, true);
      if (dbDealer) {
        tenantConfigCache.set(`slug:${cleanSlug}`, { data: dbDealer, timestamp: Date.now() });
        return dbDealer;
      }
      if (DEFAULT_DEALER_PROFILES[cleanSlug]) {
        tenantConfigCache.set(`slug:${cleanSlug}`, { data: DEFAULT_DEALER_PROFILES[cleanSlug], timestamp: Date.now() });
        return DEFAULT_DEALER_PROFILES[cleanSlug];
      }
      const staged = getStagedDealerProfile(cleanSlug);
      if (staged) {
        tenantConfigCache.set(`slug:${cleanSlug}`, { data: staged, timestamp: Date.now() });
        return staged;
      }
    }
  }

  // 3. Rezoluție bazată pe domeniul verificat al cererii
  if (host) {
    const cached = tenantConfigCache.get(`host:${host}`);
    if (cached && (Date.now() - cached.timestamp < TENANT_CACHE_TTL)) {
      return cached.data;
    }

    // Listă închisă de host-uri de platformă. Nu folosi host.includes('parcos.ro'):
    // un subdomeniu de parc trebuie să ajungă la getDealerByDomain, nu la marketing.
    // www. este deja eliminat din `host`, deci www.parcos.ro intră pe parcos.ro.
    if (host === 'parcos.ro' || PLATFORM_CONSOLE_HOSTS.has(host)) {
      return cacheTenantHost(host, DEFAULT_DEALER_PROFILES.parcos);
    }

    // 3.1. Rutare Dinamică Subdomenii ParcOS (*.parcos.ro -> [dealer_slug])
    // Permite oricărui showroom nou înrolat să fie accesibil instantaneu pe slug.parcos.ro (ex: mpiauto.parcos.ro) fără redeploy!
    if (host.endsWith('.parcos.ro')) {
      const sub = host.slice(0, -'.parcos.ro'.length);
      if (sub && !PLATFORM_CONSOLE_HOSTS.has(host) && sub !== 'www' && sub !== 'sandbox' && sub !== 'staging') {
        const cleanSubSlug = normalizeSlug(sub);
        const cachedSub = tenantConfigCache.get(`slug:${cleanSubSlug}`);
        if (cachedSub && (Date.now() - cachedSub.timestamp < TENANT_CACHE_TTL)) {
          return cacheTenantHost(host, cachedSub.data);
        }
        const dbDealer = await getDealerBySlug(cleanSubSlug, true);
        if (dbDealer) {
          tenantConfigCache.set(`slug:${cleanSubSlug}`, { data: dbDealer, timestamp: Date.now() });
          return cacheTenantHost(host, dbDealer);
        }
        if (DEFAULT_DEALER_PROFILES[cleanSubSlug]) {
          return cacheTenantHost(host, DEFAULT_DEALER_PROFILES[cleanSubSlug]);
        }
        const staged = getStagedDealerProfile(cleanSubSlug);
        if (staged) {
          return cacheTenantHost(host, staged);
        }
      }
    }
    const canonicalSlug = CANONICAL_DEALER_HOSTS[host];
    if (canonicalSlug && DEFAULT_DEALER_PROFILES[canonicalSlug]) {
      return cacheTenantHost(host, DEFAULT_DEALER_PROFILES[canonicalSlug]);
    }

    // Producție: rândul din dealers bate fallback-ul. Lipsa rândului nu cade pe RXM.
    // IP-ul de infrastructură rămâne pe fallback, ca health-check-ul să nu primească 404.
    const isInfraHost = INFRA_HEALTH_HOSTS.has(host);
    if (!isLocalDev && !isInfraHost) {
      const dbDealer = await getDealerByDomain(host);
      if (dbDealer) {
        return cacheTenantHost(host, dbDealer);
      }
      return cacheTenantHost(host, { unconfigured: true });
    }
  }

  // 4. Fallback doar pentru localhost, 127.0.0.1, ::1, *.local și IP-ul de infrastructură.
  const fallbackSlug = normalizeSlug(DEALER_SLUG) || 'rxm';
  const cachedFallback = tenantConfigCache.get(`slug:${fallbackSlug}`);
  if (cachedFallback && (Date.now() - cachedFallback.timestamp < TENANT_CACHE_TTL)) {
    return cachedFallback.data;
  }
  const dbDealer = await getDealerBySlug(fallbackSlug);
  if (dbDealer) {
    tenantConfigCache.set(`slug:${fallbackSlug}`, { data: dbDealer, timestamp: Date.now() });
    return dbDealer;
  }

  return DEFAULT_DEALER_PROFILES[fallbackSlug] || DEFAULT_DEALER_PROFILES.rxm;
}

/**
 * ══════════════════════════════════════════════════════════════════
 * SSR DYNAMIC OPEN GRAPH & METADATA INJECTION ENGINE
 * Asigură că partajarea link-urilor (WhatsApp, Facebook, LinkedIn,
 * Twitter/X, Telegram, iMessage) reflectă domeniul corect:
 *  - parcos.ro -> ParcOS SaaS Dealership Operating System
 *  - rxmautomobile.ro -> RXM Automobile Showroom Cluj
 *  - ?car=XYZ -> Card dedicat vehicul cu foto primară și specificații
 * ══════════════════════════════════════════════════════════════════
 */

let cachedHtmlTemplate = null;
let cachedHtmlMtime = 0;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function getOrLoadHtmlTemplate(htmlFilePath) {
  try {
    const stat = fs.statSync(htmlFilePath);
    if (!cachedHtmlTemplate || stat.mtimeMs > cachedHtmlMtime) {
      cachedHtmlTemplate = fs.readFileSync(htmlFilePath, 'utf8');
      cachedHtmlMtime = stat.mtimeMs;
    }
    return cachedHtmlTemplate;
  } catch (err) {
    if (cachedHtmlTemplate) return cachedHtmlTemplate;
    throw err;
  }
}

async function renderDynamicHtml(html, req, urlObj) {
  const rawHost = (req?.headers?.['x-forwarded-host'] || req?.headers?.['host'] || '').split(',')[0].split(':')[0].toLowerCase().trim();
  const host = rawHost.replace(/^www\./, '');
  const pathname = (urlObj?.pathname || '/').toLowerCase();
  const searchParams = urlObj?.searchParams || new URLSearchParams();
  const queryDealer = searchParams.get('dealer') || searchParams.get('dealer_slug');

  const isPlatformParcosHost = host === 'parcos.ro' ||
                   host === 'app.parcos.ro' ||
                   host === 'admin.parcos.ro' ||
                   host === 'parcos.local';
  const isParcos = isPlatformParcosHost ||
                   pathname.startsWith('/saas') || 
                   searchParams.has('saas') ||
                   queryDealer === 'parcos';
  const isRxm = host.includes('rxmautomobile.ro') || (!isParcos && (host === 'localhost' || host === '127.0.0.1'));

  let title = '';
  let description = '';
  let keywords = '';
  let canonicalUrl = '';
  let ogTitle = '';
  let ogDescription = '';
  let ogImage = '';
  let ogImageWidth = '1200';
  let ogImageHeight = '630';
  let ogImageAlt = '';
  let ogUrl = '';
  let ogSiteName = '';
  let ogType = 'website';
  let twitterCard = 'summary_large_image';
  let jsonLdSchema = null;

  if (isParcos) {
    // 🏷️ PARCOS — Multi-Tenant Dealership Operating System (SaaS)
    title = 'ParcOS — Program Complet pentru Parcuri Auto: Site Propriu & Gestiune Vânzări';
    description = 'Platformă completă de gestiune și showroom digital pentru parcuri auto rulate. Scanare automată CIV & Talon cu AI, generare contracte DITL pe loc, sincronizare stoc și facturare fiscală.';
    keywords = 'program parc auto, soft gestiune parc auto, site parc auto, software vanzari auto, scanare civ talon, contracte auto, fgo facturare, dms auto romania, parcos, carvana';
    canonicalUrl = `https://parcos.ro${pathname === '/index.html' || pathname === '/' ? '/' : pathname}`;
    ogSiteName = 'ParcOS';
    ogType = 'website';
    ogTitle = title;
    ogDescription = description;
    ogImage = 'https://parcos.ro/brand/parcos-og-icon.png';
    ogImageWidth = '600';
    ogImageHeight = '600';
    ogImageAlt = 'ParcOS — Dealership Operating System';
    ogUrl = canonicalUrl;

    jsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ParcOS",
      "alternateName": "ParcOS — Dealership Operating System",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, Cloud SaaS",
      "description": description,
      "url": "https://parcos.ro/",
      "logo": "https://parcos.ro/brand/parcos-og-icon.png",
      "image": "https://parcos.ro/brand/parcos-og-icon.png",
      "publisher": {
        "@type": "Organization",
        "name": "CARVANA SRL",
        "url": "https://parcos.ro/"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Pachete Starter, Pro și Enterprise pentru parcuri auto rulate"
      }
    };
  } else {
    // 🚗 DEALER SHOWROOM (RXM Automobile sau Tenant Specific)
    const carId = searchParams.get('car') || pathname.match(/^\/(?:cars|masini)\/([^\/]+)/)?.[1];

    let vehicle = null;
    let showroomUnconfigured = false;
    if (carId) {
      try {
        const currentTenant = await resolveTenant(req, { searchParams });
        if (isUnconfiguredTenant(currentTenant)) {
          showroomUnconfigured = true;
        } else {
          const tenantSlug = currentTenant?.slug || (isRxm ? 'rxm' : 'rxm');
          vehicle = await getPublicVehicleById(carId, tenantSlug);
        }
      } catch (e) {
        // Ignoră eroare DB temporară
      }
      if (!vehicle && !showroomUnconfigured) {
        try {
          const seedsPath = path.resolve('server/seeds.json');
          if (fs.existsSync(seedsPath)) {
            const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
            vehicle = seeds.find(c => c.id === carId || c.stockNumber === carId);
          }
        } catch {}
      }
    }

    if (vehicle) {
      // 🚘 Partajare Link Dedicat Mașină
      const dealerBrand = isRxm ? 'RXM Automobile Cluj-Napoca' : (DEFAULT_DEALER_PROFILES[host]?.name || 'Dealer Auto');
      const domainName = isRxm ? 'rxmautomobile.ro' : (host || 'rxmautomobile.ro');
      const formattedPrice = Number(vehicle.priceEur || vehicle.price_eur || 0).toLocaleString('ro-RO');
      const mileageStr = Number(vehicle.mileage || vehicle.mileage_km || 0).toLocaleString('ro-RO');

      title = `${vehicle.brand} ${vehicle.model} ${vehicle.year} • ${formattedPrice} € — ${dealerBrand}`;
      description = `De vânzare la ${dealerBrand}: ${vehicle.brand} ${vehicle.model} (${vehicle.year}), ${mileageStr} km, motorizare ${vehicle.fuel || vehicle.fuel_type || ''} ${vehicle.transmission || ''}. Garanție 12-24 luni, revizie gratuită, finanțare rapidă cu 0% avans.`;
      canonicalUrl = `https://${domainName}/?car=${encodeURIComponent(carId)}`;
      ogSiteName = dealerBrand;
      ogType = 'article';
      ogTitle = title;
      ogDescription = description;
      ogUrl = canonicalUrl;

      let rawImg = (vehicle.images && vehicle.images[0]) || vehicle.main_image || '/rxm/images/rxm-emblem.png';
      if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
        ogImage = rawImg;
      } else {
        const cleanPath = rawImg.startsWith('/') ? rawImg : `/${rawImg}`;
        ogImage = `https://${domainName}${cleanPath}`;
      }
      ogImageAlt = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    } else {
      // 🏢 Pagină Principală Dealer
      if (isRxm) {
        title = 'RXM AUTO MOBILE — Autovehicule Rulate Premium | Cluj-Napoca';
        description = 'Dealer auto Cluj-Napoca. Mașini rulate atent selectate, cu garanție 12-24 luni, kilometraj certificat și finanțare rapidă cu 0% avans.';
        keywords = 'parc auto cluj, masini rulate cluj-napoca, dealer auto cluj, garantie auto 12 luni, finantare auto 0 avans, autovehicule rulate cluj, rxm automobile';
        canonicalUrl = 'https://rxmautomobile.ro/';
        ogSiteName = 'RXM AUTO MOBILE';
        ogType = 'website';
        ogTitle = title;
        ogDescription = description;
        ogImage = 'https://rxmautomobile.ro/rxm/images/rxm-emblem.png';
        ogImageAlt = 'RXM AUTO MOBILE Cluj-Napoca';
        ogUrl = 'https://rxmautomobile.ro/';

        jsonLdSchema = {
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          "name": "RXM AUTO MOBILE",
          "legalName": "RXM AUTO MOBILE SRL",
          "description": description,
          "url": "https://rxmautomobile.ro/",
          "logo": "https://rxmautomobile.ro/rxm/images/rxm-emblem.png",
          "image": "https://rxmautomobile.ro/rxm/images/rxm-emblem.png",
          "telephone": "+40748892937",
          "email": "contact@rxmautomobile.ro",
          "priceRange": "€€€",
          "currenciesAccepted": "EUR, RON",
          "paymentAccepted": "Transfer bancar, Finanțare rate fixe, Leasing, Buy-Back",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Strada Colonia Hodai F.N.",
            "addressLocality": "Cluj-Napoca",
            "addressRegion": "Cluj",
            "postalCode": "400000",
            "addressCountry": "RO"
          }
        };
      } else {
        const tenant = await resolveTenant(req, urlObj);
        if (isUnconfiguredTenant(tenant) || showroomUnconfigured) {
          title = 'Showroom neconfigurat';
          description = 'Acest domeniu nu are un showroom configurat.';
          canonicalUrl = host ? `https://${host}/` : 'https://parcos.ro/';
          ogSiteName = 'ParcOS';
          ogType = 'website';
          ogTitle = title;
          ogDescription = description;
          ogImage = 'https://parcos.ro/brand/parcos-og-icon.png';
          ogUrl = canonicalUrl;
        } else {
          title = `${tenant.name} — Autovehicule Rulate Verificate`;
          description = `Parc auto autorizat ${tenant.city || 'România'}. Garanție extinsă, kilometri certificați și rate fixe fără avans.`;
          canonicalUrl = `https://${host}/`;
          ogSiteName = tenant.name;
          ogType = 'website';
          ogTitle = title;
          ogDescription = description;
          const isTenantRxm = tenant.slug === 'rxm' || tenant.slug === 'rxm_sandbox';
          ogImage = tenant.logo_url || tenant.logoUrl || (isTenantRxm ? `https://${host}/rxm/images/rxm-emblem.png` : 'https://parcos.ro/brand/parcos-og-icon.png');
          ogUrl = canonicalUrl;
        }
      }
    }
  }

  let output = html;

  // Actualizare <title>
  if (/<title>[\s\S]*?<\/title>/i.test(output)) {
    output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  } else {
    output = output.replace('</head>', `  <title>${escapeHtml(title)}</title>\n</head>`);
  }

  // Actualizare <meta name="description">
  if (/<meta\s+name=["']description["'][^>]*>/i.test(output)) {
    output = output.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  } else {
    output = output.replace('</head>', `  <meta name="description" content="${escapeHtml(description)}" />\n</head>`);
  }

  // Actualizare <meta name="keywords">
  if (keywords) {
    if (/<meta\s+name=["']keywords["'][^>]*>/i.test(output)) {
      output = output.replace(/<meta\s+name=["']keywords["'][^>]*>/i, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
    } else {
      output = output.replace('</head>', `  <meta name="keywords" content="${escapeHtml(keywords)}" />\n</head>`);
    }
  }

  // Actualizare <link rel="canonical">
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(output)) {
    output = output.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  } else {
    output = output.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n</head>`);
  }

  // Curățare deterministă a tuturor tag-urilor og:image existente din template pentru a evita dublurile în crawlerele Meta/WhatsApp
  output = output.replace(/<meta\s+property=["']og:image[^"']*["'][^>]*>\s*/gi, '');

  // Actualizare Open Graph Tags
  const ogReplacements = [
    { property: 'og:site_name', content: ogSiteName },
    { property: 'og:type', content: ogType },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:secure_url', content: ogImage },
    { property: 'og:image:width', content: ogImageWidth },
    { property: 'og:image:height', content: ogImageHeight },
    { property: 'og:image:alt', content: ogImageAlt },
    { property: 'og:url', content: ogUrl },
    { property: 'og:locale', content: 'ro_RO' },
  ];

  for (const { property, content } of ogReplacements) {
    if (!content) continue;
    const regex = new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, 'i');
    const newTag = `<meta property="${property}" content="${escapeHtml(content)}" />`;
    if (regex.test(output)) {
      output = output.replace(regex, newTag);
    } else {
      output = output.replace('</head>', `  ${newTag}\n</head>`);
    }
  }

  // Actualizare Twitter Card Tags
  const twitterReplacements = [
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: ogTitle },
    { name: 'twitter:description', content: ogDescription },
    { name: 'twitter:image', content: ogImage },
  ];

  for (const { name, content } of twitterReplacements) {
    if (!content) continue;
    const regex = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'i');
    const newTag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
    if (regex.test(output)) {
      output = output.replace(regex, newTag);
    } else {
      output = output.replace('</head>', `  ${newTag}\n</head>`);
    }
  }

  // Actualizare Schema.org JSON-LD
  if (jsonLdSchema) {
    const jsonLdTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLdSchema, null, 2)}\n    </script>`;
    if (/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i.test(output)) {
      output = output.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i, jsonLdTag);
    } else {
      output = output.replace('</head>', `  ${jsonLdTag}\n</head>`);
    }
  }

  // Gestionare preîncărcare video, titlu Apple Web App și Favicon per-tenant:
  // Pe showroom de dealer (RXM etc.), NU preîncărcăm video-ul SaaS parcos-showroom-intro.mp4
  if (!isParcos) {
    output = output.replace(/<link\s+rel=["']preload["'][^>]*parcos-showroom-intro\.mp4[^>]*>\s*/gi, '');
    output = output.replace(/<link\s+rel=["']preload["'][^>]*parcos-showroom-hall\.jpg[^>]*>\s*/gi, '');
    output = output.replace(/<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>/gi, `<meta name="apple-mobile-web-app-title" content="${escapeHtml(ogSiteName || (isRxm ? 'RXM Automobile' : 'Dealer Showroom'))}" />`);

    // 🛡️ Înlocuire dinamică Favicon & Web App Manifest pentru showroom dealer (RXM Automobile etc.)
    const dealerAssetPrefix = isRxm ? '/rxm' : '/rxm';
    output = output.replace(/href=["']\/favicon\.svg(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/favicon.svg?v=rxm2026"`);
    output = output.replace(/href=["']\/favicon-32x32\.png(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/favicon-32x32.png?v=rxm2026"`);
    output = output.replace(/href=["']\/favicon-16x16\.png(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/favicon-16x16.png?v=rxm2026"`);
    output = output.replace(/href=["']\/favicon\.ico(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/favicon.ico?v=rxm2026"`);
    output = output.replace(/href=["']\/apple-touch-icon\.png(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/apple-touch-icon.png?v=rxm2026"`);
    output = output.replace(/href=["']\/site\.webmanifest(?:\?[^"']*)?["']/gi, `href="${dealerAssetPrefix}/site.webmanifest?v=rxm2026"`);
  } else {
    output = output.replace(/<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>/gi, `<meta name="apple-mobile-web-app-title" content="ParcOS" />`);
  }

  return output;
}

async function serveHtmlWithDynamicMeta(req, res, htmlFilePath, urlObj) {
  try {
    const rawTemplate = await getOrLoadHtmlTemplate(htmlFilePath);
    const rendered = await renderDynamicHtml(rawTemplate, req, urlObj);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(rendered, 'utf8'),
      ...SECURITY_HEADERS
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(rendered);
  } catch (err) {
    console.error('[HTML SSR Error]', err);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      ...SECURITY_HEADERS
    });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(htmlFilePath).pipe(res);
  }
}

/**
 * Trimite un răspuns JSON structurat cu CORS securizat
 */
function sendJson(res, statusCode, data) {
  const req = res.req;
  const allowedOrigin = resolveCorsOrigin(req);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Token, x-admin-token, X-SuperAdmin-Key, x-superadmin-key, X-SuperAdmin-Token, x-superadmin-token, x-car-id, x-image-index, x-file-ext',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  res.end(JSON.stringify(data));
}

/**
 * Citește corpul cererii HTTP ca text/buffer cu limită strictă de mărime
 */
async function readRequestBody(req, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error(`Payload-ul cererii depășește limita admisă de ${Math.round(maxBytes / 1024 / 1024)}MB`));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARCOS.RO STATIC LANDING ENGINE (v4) & LEAD DISPATCHER
// Invariante: Servire strict pe parcos.ro & www.parcos.ro la / și /lp-assets/*
// Orice altă rută și orice alt domeniu merg neschimbate către aplicație/tenanți
// ─────────────────────────────────────────────────────────────────────────────

const LANDING_DIR = path.resolve('landing');
const EXTRA_LANDING_HOSTS = (process.env.LANDING_HOSTS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);
const LANDING_HOSTS = new Set(['parcos.ro', 'www.parcos.ro', ...EXTRA_LANDING_HOSTS]);
const LANDING_FILES = new Set(['/favicon.ico', '/favicon-32x32.png', '/apple-touch-icon.png']);

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function hostOfRequest(req) {
  return String(req.headers['x-forwarded-host'] || req.headers['host'] || '')
    .split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
}

function isLandingHost(req, urlObj) {
  const h = hostOfRequest(req);
  if (LANDING_HOSTS.has(h)) return true;

  // ⚠️ Override-ul de test ?host=parcos.ro este permis STRICT în mediu local de dezvoltare (NODE_ENV !== 'production')
  // și DOAR dacă Host-ul cererii este localhost / 127.0.0.1.
  // În producție, pe domeniile dealerilor (ex. rxmautomobile.ro), parametrul ?host=parcos.ro este IGNORAT complet.
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocalHost = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  if (isDev && isLocalHost) {
    if (urlObj.searchParams.get('host') === 'parcos.ro' || 
        urlObj.searchParams.get('landing') === 'true' || 
        req.headers['x-landing'] === 'true') {
      return true;
    }
  }
  return false;
}

async function tryServeLanding(req, res, urlObj, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  if (!isLandingHost(req, urlObj)) return false;

  let rel = null;
  let cacheHeader = 'public, max-age=2592000'; // 30 zile

  if (pathname === '/' || pathname === '/index.html') {
    rel = 'index.html';
    cacheHeader = 'no-cache';
  } else if (pathname === '/politica-de-confidentialitate' || pathname === '/politica-de-confidentialitate.html') {
    rel = 'politica-de-confidentialitate.html';
    cacheHeader = 'no-cache';
  } else if (pathname.startsWith('/lp-assets/') || LANDING_FILES.has(pathname)) {
    rel = decodeURIComponent(pathname.replace(/^\/+/, ''));
    if (/\.(css|js)$/.test(rel)) {
      cacheHeader = 'public, max-age=31536000, immutable';
    } else if (LANDING_FILES.has(pathname)) {
      cacheHeader = 'public, max-age=604800';
    }
  }

  if (!rel) return false;

  const targetFile = path.resolve(LANDING_DIR, rel);
  const landingBase = path.resolve(LANDING_DIR);

  // Anti-path traversal guard
  if (!targetFile.startsWith(landingBase + path.sep) && 
      targetFile !== path.resolve(landingBase, 'index.html') && 
      targetFile !== path.resolve(landingBase, 'politica-de-confidentialitate.html')) {
    return false;
  }

  if (!fs.existsSync(targetFile)) return false;
  const stat = fs.statSync(targetFile);
  if (!stat.isFile()) return false;

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  const isStagingReq = process.env.IS_STAGING === 'true' || 
                       process.env.COOLIFY_APP_NAME === 'parcos-staging' || 
                       hostOfRequest(req).includes('staging');

  const responseHeaders = {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': cacheHeader,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (isStagingReq) {
    responseHeaders['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
  }

  res.writeHead(200, responseHeaders);

  if (req.method === 'HEAD') {
    res.end();
    return true;
  }

  fs.createReadStream(targetFile).pipe(res);
  return true;
}

// In-memory rate limiting pentru /api/lead: max 5 req / 10 min per IP hash
const leadRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_LEADS_PER_WINDOW = 5;

// Curățare periodică memorie rate limiter
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of leadRateLimitMap.entries()) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      leadRateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

async function handleLandingLead(req, res) {
  try {
    // 1. Verificare Origin/Referer (Same-Origin / Doar pe parcos.ro)
    const origin = req.headers['origin'] || '';
    const referer = req.headers['referer'] || '';
    const originCheck = origin || referer;
    if (originCheck) {
      const isAllowedOrigin = 
        originCheck.includes('parcos.ro') || 
        originCheck.includes('localhost') || 
        originCheck.includes('127.0.0.1');
      if (!isAllowedOrigin) {
        return sendJson(res, 403, { ok: false, error: 'forbidden' });
      }
    }

    // 2. Rate limit pe bază de hash IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
    const salt = process.env.LEAD_SALT || 'parcos_lead_salt_2026';
    const ipHash = crypto.createHash('sha256').update(clientIp + salt).digest('hex');

    const now = Date.now();
    const rateRecord = leadRateLimitMap.get(ipHash) || { count: 0, startTime: now };
    if (now - rateRecord.startTime < RATE_LIMIT_WINDOW_MS) {
      if (rateRecord.count >= MAX_LEADS_PER_WINDOW) {
        console.warn(`🛑 [/api/lead] Rate limit depășit pentru ipHash: ${ipHash.slice(0, 10)}...`);
        return sendJson(res, 429, { ok: false, error: 'rate_limit' });
      }
      rateRecord.count++;
    } else {
      rateRecord.count = 1;
      rateRecord.startTime = now;
    }
    leadRateLimitMap.set(ipHash, rateRecord);

    // 3. Citire corpul cererii cu limită strictă de 2 KB
    let rawBody;
    try {
      rawBody = await readRequestBody(req, 2048);
    } catch (sizeErr) {
      return sendJson(res, 400, { ok: false, error: 'payload_too_large' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid_json' });
    }

    const { nume, telefon, parc, consent, website, sursa } = payload || {};

    // 4. Honeypot check: dacă câmpul website este completat de bot, returnăm 200 fără a salva
    if (website && String(website).trim().length > 0) {
      console.log('🛡️ [/api/lead] Honeypot declanșat de bot. Lead respins silențios.');
      return sendJson(res, 200, { ok: true });
    }

    // 5. Validare nume (2-80 caractere)
    const cleanNume = String(nume || '').trim();
    if (!cleanNume || cleanNume.length < 2 || cleanNume.length > 80) {
      return sendJson(res, 400, { ok: false, error: 'validare_nume' });
    }

    // 6. Validare acord GDPR (trebuie să fie strict true)
    if (consent !== true) {
      return sendJson(res, 400, { ok: false, error: 'validare_consimtamant' });
    }

    // 7. Normalizare și validare telefon RO: ^(\+?40|0040|0)[237]\d{8}$
    const rawPhone = String(telefon || '').replace(/[\s\.\-\(\)]/g, '').trim();
    const phoneRoRegex = /^(\+?40|0040|0)[237]\d{8}$/;
    if (!phoneRoRegex.test(rawPhone)) {
      return sendJson(res, 400, { ok: false, error: 'validare_telefon' });
    }

    // Normalizare în format E.164 (+40...)
    let e164Phone = rawPhone;
    if (e164Phone.startsWith('0040')) {
      e164Phone = '+' + e164Phone.slice(2);
    } else if (e164Phone.startsWith('0')) {
      e164Phone = '+40' + e164Phone.slice(1);
    } else if (!e164Phone.startsWith('+')) {
      e164Phone = '+' + e164Phone;
    }

    const cleanParc = parc ? String(parc).trim().slice(0, 100) : null;
    const cleanSursa = sursa ? String(sursa).trim().slice(0, 80) : 'parcos.ro';

    // 8. Salvare în PostgreSQL (tabel dedicat landing_leads)
    const leadRecord = {
      nume: cleanNume,
      telefon_e164: e164Phone,
      parc: cleanParc,
      consent_at: new Date(),
      consent_text_version: 'v4-20261025',
      ip_hash: ipHash,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 255),
      sursa: cleanSursa,
      status: 'new'
    };

    const savedLead = await insertLandingLead(leadRecord);
    const maskedPhone = e164Phone.slice(0, 5) + 'xxx' + e164Phone.slice(-3);
    console.log(`📥 [/api/lead] Lead nou înregistrat (ID: ${savedLead?.id}) de la ${cleanNume} (${cleanParc || 'Fără parc'}), Tel: ${maskedPhone}`);

    // 9. Răspuns imediat 200 către client (nu așteaptă e-mailul)
    sendJson(res, 200, { ok: true, id: savedLead?.id });

    // 10. Trimitere e-mail notificare asincronă via AWS SES către contact@parcos.ro
    (async () => {
      try {
        const isStagingEnv = process.env.IS_STAGING === 'true' || 
                             process.env.COOLIFY_APP_NAME === 'parcos-staging' || 
                             hostOfRequest(req).includes('staging');

        if (isStagingEnv) {
          console.log(`🔒 [STAGING GUARD] Notificare externă email/SES blocată pe mediul de staging pentru lead #${savedLead?.id}.`);
          return;
        }

        const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
        const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1';

        if (!accessKeyId || !secretAccessKey) {
          console.warn(`⚠️ [Lead Notification] AWS_SES_ACCESS_KEY_ID / SECRET nu sunt configurate în env. Notificarea lead-ului #${savedLead?.id} a rulat în mock mode.`);
          return;
        }

        const subject = `Lead nou parcos.ro: ${cleanNume}${cleanParc ? ` (${cleanParc})` : ''}`;
        const htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #18181b; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; border: 1px solid #e4e4e7;">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #059669; margin: 0; font-size: 20px;">Lead Nou Înregistrat pe ParcOS.ro</h2>
              <span style="font-size: 12px; color: #71717a;">Notificare automată de platformă</span>
            </div>
            <p style="font-size: 14px; margin-bottom: 16px;">A fost trimisă o cerere de testare / contact din formularul principal al landing-ului:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #e4e4e7;">
                <td style="padding: 8px 0; color: #71717a; width: 140px;"><strong>Nume:</strong></td>
                <td style="padding: 8px 0; font-weight: bold; color: #18181b;">${cleanNume}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e4e4e7;">
                <td style="padding: 8px 0; color: #71717a;"><strong>Telefon:</strong></td>
                <td style="padding: 8px 0; font-weight: bold;"><a href="tel:${e164Phone}" style="color: #059669; text-decoration: none;">${e164Phone}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e4e4e7;">
                <td style="padding: 8px 0; color: #71717a;"><strong>Parc Auto:</strong></td>
                <td style="padding: 8px 0; color: #18181b;">${cleanParc || 'Nespecificat'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e4e4e7;">
                <td style="padding: 8px 0; color: #71717a;"><strong>Sursă:</strong></td>
                <td style="padding: 8px 0; color: #18181b;">${cleanSursa}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #71717a;"><strong>Data / Ora:</strong></td>
                <td style="padding: 8px 0; color: #18181b;">${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}</td>
              </tr>
            </table>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #065f46;">
              👉 <strong>Acțiune recomandată:</strong> Contactați clientul pe WhatsApp sau telefonic în maxim 15 minute pentru demonstrație și onboarding.
            </div>
            <p style="font-size: 11px; color: #a1a1aa; margin: 0; text-align: center;">CARVANA S.R.L. · CUI RO48206022 · ParcOS Auto Platform</p>
          </div>
        `;

        const { rawMime } = buildRawMimeMessage({
          senderEmail: 'contact@parcos.ro',
          recipientEmail: 'contact@parcos.ro',
          subject,
          htmlBody,
          textBody: `Lead nou parcos.ro\nNume: ${cleanNume}\nTelefon: ${e164Phone}\nParc: ${cleanParc || 'Nespecificat'}\nData: ${new Date().toISOString()}`,
          dealershipName: 'ParcOS Platform',
          employeeName: 'Notificări Leads',
          isCommercial: false
        });

        await sendRawEmailViaSESWithRetry(rawMime, { accessKeyId, secretAccessKey, region }, 1, 10000);
        console.log(`📧 [Lead Notification] Email de notificare trimis cu succes către contact@parcos.ro pentru lead-ul #${savedLead?.id}`);
      } catch (mailErr) {
        console.warn(`⚠️ [Lead Notification] Eroare la trimiterea email-ului de notificare (lead-ul este salvat în DB):`, mailErr.message);
      }
    })();

  } catch (err) {
    console.error('❌ [/api/lead] Eroare neașteptată:', err);
    sendJson(res, 500, { ok: false, error: 'internal_error' });
  }
}

/**
 * Clasifică tipul de dispozitiv pe baza User-Agent-ului (Mobile / Tablet / Desktop)
 * @param {string} userAgent
 * @returns {'mobile'|'desktop'|'tablet'}
 */
export function detectDeviceType(userAgent) {
  const ua = String(userAgent || '').toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'tablet';
  if (/mobi|iphone|android|touch/.test(ua)) return 'mobile';
  return 'desktop';
}

export const server = http.createServer(async (req, res) => {
  // Tratare preflight CORS
  if (req.method === 'OPTIONS') {
    const allowedOrigin = resolveCorsOrigin(req);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Token, x-admin-token, X-SuperAdmin-Key, x-superadmin-key, X-SuperAdmin-Token, x-superadmin-token, x-car-id, x-image-index, x-file-ext',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end();
  }

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = urlObj.pathname;

    // Normalizare prefix legacy /rxm/api -> /api
    if (pathname.startsWith('/rxm/api/')) {
      pathname = pathname.replace('/rxm/api/', '/api/');
    }

    // 0.00 PARCOS.RO STATIC LANDING (v4) & LEAD DISPATCHER
    // Izolare strictă: Se servește DOAR pe parcos.ro & www.parcos.ro la / și /lp-assets/*
    // Toate celelalte căi și domeniile tenanților merg neschimbate către aplicație
    if (await tryServeLanding(req, res, urlObj, pathname)) {
      return;
    }

    if (await handleLeadRoutes(req, res, urlObj, pathname, {
      sendJson,
      readRequestBody,
      resolveTenant,
      isAuthorizedAdmin,
    })) {
      return;
    }

    if (await handleFinancingRoutes(req, res, urlObj, pathname, {
      sendJson,
      readRequestBody,
      resolveTenant,
      isAuthorizedAdmin,
    })) {
      return;
    }

    if (req.method === 'POST' && pathname === '/api/lead') {
      return await handleLandingLead(req, res);
    }

    // 0. GET /api/health - Diagnostic & Status Server [Sanitizat Anonim]
    if (req.method === 'GET' && pathname === '/api/health') {
      if (await isAuthorizedAdmin(req, urlObj)) {
        const tenant = await resolveTenant(req, urlObj);
        if (isUnconfiguredTenant(tenant)) {
          return sendJson(res, 200, {
            status: 'healthy',
            version: 'v20_multi_tenant_ready',
            vatRate: 0.21,
            warrantyTerm: 'Cont de Garanție',
            uptime: Math.floor(process.uptime()),
            time: new Date().toISOString(),
          });
        }
        return sendJson(res, 200, {
          status: 'healthy',
          dealer: tenant.slug,
          tenantName: tenant.name,
          domain: tenant.domain,
          version: 'v20_multi_tenant_ready',
          vatRate: 0.21,
          warrantyTerm: 'Cont de Garanție',
          uptime: Math.floor(process.uptime()),
          time: new Date().toISOString(),
        });
      }
      return sendJson(res, 200, {
        status: 'healthy',
        vatRate: 0.21,
        warrantyTerm: 'Cont de Garanție',
        hosting: 'Netcup VPS (152.53.158.65)',
        version: 'v20_multi_tenant_ready'
      });
    }

    // 0.01 GET /api/tenant-config & /api/tenant/config - Configurație Dinamică Showroom (PMH-T02)
    if (req.method === 'GET' && (pathname === '/api/tenant-config' || pathname === '/api/tenant/config')) {
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      return sendJson(res, 200, {
        success: true,
        dealer: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          phone_primary: tenant.phone_primary || tenant.phonePrimary || '',
          phone_secondary: tenant.phone_secondary || tenant.phoneSecondary || '',
          whatsapp_number: tenant.whatsapp_number || tenant.whatsappNumber || '',
          email: tenant.email || '',
          vat_number: tenant.vat_number || tenant.vatNumber || '',
          address_street: tenant.address_street || tenant.address || '',
          city: tenant.city || '',
          county: tenant.county || '',
          status: tenant.status || 'active',
          is_active: tenant.is_active !== undefined ? tenant.is_active : true,
          phone_verified: Boolean(tenant.phone_verified),
          config: tenant.config || {},
        },
        config: tenant.config || {},
        themePreset: tenant.config?.themePreset || 'obsidian_gold',
        vatRate: 0.21,
        warrantyTerm: 'Cont de Garanție',
        reservationTerm: 'Garanție de Rezervare/Participare'
      });
    }

    // 0.02 GET /api/tenant/resolve - Rezoluție Rapidă Tenant ID
    if (req.method === 'GET' && pathname === '/api/tenant/resolve') {
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      return sendJson(res, 200, {
        success: true,
        slug: tenant.slug,
        name: tenant.name,
        domain: tenant.domain,
        themePreset: tenant.config?.themePreset || 'obsidian_gold',
      });
    }

    // 0.03 GET /api/dealers - Listare Showroom-uri Active
    if (req.method === 'GET' && pathname === '/api/dealers') {
      let allDealers = await getAllDealers();
      if (!allDealers || allDealers.length === 0) {
        allDealers = Object.values(DEFAULT_DEALER_PROFILES);
        try {
          const configPath = path.join(process.cwd(), 'staged_imports', 'dealers_config.json');
          if (fs.existsSync(configPath)) {
            const stagedData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            Object.values(stagedData).forEach((sd) => {
              if (!allDealers.some((d) => d.slug === sd.key)) {
                allDealers.push({
                  id: sd.id || 99,
                  name: sd.name,
                  slug: sd.key,
                  domain: sd.domain,
                  phone_primary: sd.phonePrimary || sd.phone || '',
                  city: sd.location?.split(',')[0]?.trim() || 'Cluj-Napoca',
                  config: { themePreset: sd.themePreset || 'obsidian_gold' }
                });
              }
            });
          }
        } catch {}
      }
      const sanitized = allDealers.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        domain: d.domain,
        city: d.city,
        themePreset: d.config?.themePreset || 'obsidian_gold'
      }));
      return sendJson(res, 200, {
        success: true,
        count: sanitized.length,
        dealers: sanitized
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // PARCOS SUPERADMIN CONTROL PLANE — MASTER ENDPOINTS & ROUTE GUARD
    // ══════════════════════════════════════════════════════════════════
    // Note: Suportă pathname.startsWith('/api/superadmin/') inclusiv
    // pathname === '/api/superadmin/auth/verify', pathname === '/api/superadmin/tenants',
    // pathname === '/api/superadmin/propagation/feature', updateDealerFeatures, propagateFeatureGlobally
    if (pathname.startsWith('/api/superadmin/')) {
      if (await handleSuperAdminRoutes(req, res, urlObj, pathname, {
        sendJson,
        readRequestBody,
        isAuthorizedSuperAdmin,
        getAllDealers,
        upsertDealer,
        normalizeSlug,
        tenantConfigCache,
        propagateFeatureGlobally,
        updateDealerFeatures,
        updateDealer,
        getDealerBySlug,
        getSql,
        getTierPricing,
        SAAS_TIER_PRICING,
        CARVANA_HOLDING_ISSUER,
        generateSaasInvoiceForTenant,
        markInvoicePaid,
        checkOverdueSubscriptions
      })) {
        return;
      }
    }


    // ══════════════════════════════════════════════════════════════════
    // BACKUP & ROLLBACK DISASTER RECOVERY ENDPOINTS [STRICT SUPERADMIN]
    // ══════════════════════════════════════════════════════════════════
    if (await handleBackupRoutes(req, res, urlObj, pathname, {
      sendJson,
      parseJsonBody: async (r) => JSON.parse((await readRequestBody(r, 1024 * 64)).toString('utf8')),
      isAuthorizedSuperAdmin
    })) {
      return;
    }






    // 0.04 POST /api/dealers - Onboarding / Configurare Dealer [SuperAdmin Required]
    if (req.method === 'POST' && pathname === '/api/dealers') {
      if (!isAuthorizedSuperAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat. Doar SuperAdmin ParcOS poate înrola sau reconfigura un dealer.' });
      }
      const rawBody = await readRequestBody(req, 1024 * 64);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const cleanSlug = normalizeSlug(payload.slug);
        if (!cleanSlug) return sendJson(res, 400, { success: false, error: 'Dealer slug este obligatoriu' });
        const existing = await getDealerBySlug(cleanSlug, true);
        if (existing && !payload.overwrite && !payload.upsert) return sendJson(res, 409, { success: false, error: 'Showroom-ul există deja.' });
        const saved = await upsertDealer({ ...payload, slug: cleanSlug });
        tenantConfigCache.delete(`slug:${saved.slug}`);
        if (saved.domain) tenantConfigCache.delete(`host:${saved.domain}`);
        return sendJson(res, 201, { success: true, dealer: saved });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.041 POST /api/onboarding/sms/send-otp - Trimitere SMS OTP prin Node-SAMY (Failover Node-S9+)
    if (req.method === 'POST' && pathname === '/api/onboarding/sms/send-otp') {
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload = {};
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch {
        return sendJson(res, 400, { success: false, error: 'JSON invalid' });
      }
      try {
        const result = await requestPhoneOtp(payload.phone, payload.dealerName || 'ParcOS');
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        const status = err.statusCode || (err.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400);
        return sendJson(res, status, { success: false, error: err.message, code: err.code });
      }
    }

    // 0.042 POST /api/onboarding/sms/verify-otp - Validare Cod OTP SMS (SHA-256 Salted, 3 încercări, 10m TTL)
    if (req.method === 'POST' && pathname === '/api/onboarding/sms/verify-otp') {
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload = {};
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch {
        return sendJson(res, 400, { success: false, error: 'JSON invalid' });
      }
      try {
        const result = await verifyPhoneOtp(payload.phone, payload.code);
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        const status = err.statusCode || 400;
        return sendJson(res, status, {
          success: false,
          error: err.message,
          code: err.code,
          attempts_left: err.attempts_left
        });
      }
    }

    // 0.043 POST /api/onboarding/register - Safeguard Înregistrare Parc: Status Obligatoriu 'pending_approval'
    if (req.method === 'POST' && pathname === '/api/onboarding/register') {
      const rawBody = await readRequestBody(req, 1024 * 64);
      let payload = {};
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch {
        return sendJson(res, 400, { success: false, error: 'JSON invalid' });
      }

      const cleanPhone = String(payload.phonePrimary || payload.phone || '').trim();
      if (!cleanPhone) {
        return sendJson(res, 400, { success: false, error: 'Numărul de telefon este obligatoriu' });
      }

      // 🛡️ BARIERĂ STRICTĂ: Verificare dacă telefonul a primit și validat codul SMS recent (30 min)
      const isVerified = await isPhoneRecentlyVerified(cleanPhone, 30);
      if (!isVerified) {
        return sendJson(res, 403, {
          success: false,
          error: 'Numărul de telefon nu a fost verificat prin cod SMS. Vă rugăm să validați numărul de telefon mai întâi.',
          code: 'PHONE_NOT_VERIFIED'
        });
      }

      const cleanSlug = normalizeSlug(payload.slug || payload.name);
      if (!cleanSlug) {
        return sendJson(res, 400, { success: false, error: 'Slug-ul sau numele este obligatoriu' });
      }

      const existing = await getDealerBySlug(cleanSlug, true);
      if (existing) {
        return sendJson(res, 409, { success: false, error: 'Un cont cu acest nume sau subdomeniu există deja.' });
      }

      // 🛡️ Creare cont cu status 'pending_approval' și is_active = false
      const saved = await upsertDealer({
        ...payload,
        slug: cleanSlug,
        phonePrimary: cleanPhone,
        status: 'pending_approval',
        is_active: false,
        phone_verified: true,
        tier: payload.tier || 'starter',
        maxVehiclesQuota: 25
      });

      tenantConfigCache.clear();
      console.log(`🛡️ [ONBOARDING SAFEGUARD] Dealer nou înregistrat în așteptare aprobare: ${saved.name} (${saved.slug}), Tel: ${cleanPhone}`);

      return sendJson(res, 201, {
        success: true,
        status: 'pending_approval',
        is_active: false,
        dealer: {
          name: saved.name,
          slug: saved.slug,
          domain: saved.domain,
          status: 'pending_approval'
        },
        message: 'Contul dvs. a fost înregistrat cu succes și este în curs de aprobare de către echipa ParcOS. Vă vom notifica prin SMS odată ce contul a fost activat.'
      });
    }

    // 0.05 GET /api/anaf/:cui - Interogare oficială serviciu ANAF v9 pentru autocompletare CUI [Admin Required]
    if (await handleAnafRoutes(req, res, urlObj, pathname, { sendJson, isAuthorizedAdmin })) {
      return;
    }


    // ══════════════════════════════════════════════════════════════════
    // AUTHENTICATION & SUPERADMIN VERIFY ROUTES (MODULAR: server/routes/auth.mjs)
    // ══════════════════════════════════════════════════════════════════
    // Note: Suportă pathname === '/api/superadmin/auth/verify', /api/auth/login, /api/auth/logout, /api/auth/verify
    if (await handleAuthRoutes(req, res, urlObj, pathname, {
      sendJson,
      readRequestBody,
      SUPERADMIN_PASSWORD_HASH,
      ADMIN_PASSWORD_HASH,
      SUPERADMIN_MASTER_KEY,
      generateSuperAdminSessionToken,
      generateSessionToken,
      revokeSessionToken,
      isAuthorizedAdmin,
      isAuthorizedSuperAdmin,
      normalizeSlug,
      resolveTenant
    })) {
      return;
    }


    // ══════════════════════════════════════════════════════════════════
    // PARCOS MAIL HUB ROUTES (PMH-201, PMH-202, PMH-203)
    // ══════════════════════════════════════════════════════════════════

    const inboundWebhook = req.method === 'POST' && pathname === '/api/mail/webhook';
    const bounceWebhook = req.method === 'POST' && pathname === '/api/mail/webhook/bounce';
    let mailDealerSlug = null;
    if (pathname.startsWith('/api/mail/') && !inboundWebhook && !bounceWebhook) {
      mailDealerSlug = await requireMailHub(req, res, urlObj);
      if (!mailDealerSlug) return;
    }

    // 0.4 POST /api/mail/webhook - Webhook Inbound SNS / SES (PMH-201)
    // Parcul se alege după domeniul destinatar, nu după DEALER_SLUG.
    if (inboundWebhook) {
      const rawBody = await readRequestBody(req, 1024 * 1024 * 30); // max 30MB
      const result = await handleInboundWebhook(rawBody, req.headers, {});
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.5 POST /api/mail/webhook/bounce - Webhook Bounce & Complaint SES (PMH-106 / PMH-202)
    if (bounceWebhook) {
      const rawBody = await readRequestBody(req, 1024 * 512);
      const result = await handleBounceWebhook(rawBody);
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.6 POST /api/mail/send - Trimitere e-mail SES Outbound (PMH-202)
    if (req.method === 'POST' && (pathname === '/api/mail/send' || pathname === '/api/mail/compose')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat. Autentificarea este obligatorie.' });
      }
      const rawBody = await readRequestBody(req, 1024 * 1024 * 25);
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }
      const result = await handleOutboundSend(payload, { dealerId: mailDealerSlug });
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.7 GET /api/mail/threads - Paginare conversații dealer (PMH-203 Preview & PMH-304 Multi-Agent Pool)
    if (req.method === 'GET' && pathname === '/api/mail/threads') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const status = urlObj.searchParams.get('status') || undefined;
      const assignedTo = urlObj.searchParams.get('assignedTo') || undefined;
      const currentRole = urlObj.searchParams.get('currentRole') || undefined;
      const folder = urlObj.searchParams.get('folder') || undefined;
      const limit = urlObj.searchParams.get('limit') || 50;
      const offset = urlObj.searchParams.get('offset') || 0;
      const data = await getMailThreads(mailDealerSlug, { status, assignedTo, limit, offset, currentRole, folder });
      return sendJson(res, 200, { success: true, ...data });
    }

    // 0.8 GET /api/mail/threads/:id - Detalii conversație și mesaje (PMH-203 Preview)
    if (req.method === 'GET' && pathname.startsWith('/api/mail/threads/')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '');
      const data = await getMailThreadById(threadId, mailDealerSlug);
      if (!data) {
        return sendJson(res, 404, { success: false, error: 'Conversația nu a fost găsită' });
      }
      return sendJson(res, 200, { success: true, ...data });
    }

    // 0.9 PATCH /api/mail/threads/:id/status - Actualizare status conversație (PMH-203)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/status')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/status', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateThreadStatus(threadId, payload.status, mailDealerSlug);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.9.1 PATCH /api/mail/threads/:id/vehicle - Asociere / Dezasociere manuală vehicul (PMH-302)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/vehicle')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/vehicle', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateThreadVehicle(threadId, payload.vehicleId || null, mailDealerSlug);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.9.2 PATCH /api/mail/threads/:id/assign - Asignare / Preluare conversație de către agent (PMH-304)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/assign')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/assign', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await assignThreadToAccount(threadId, payload.accountId || null, mailDealerSlug);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.10 POST /api/mail/threads/:id/reply - Răspuns direct în conversație (PMH-203)
    if (req.method === 'POST' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/reply')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/reply', '');
      const rawBody = await readRequestBody(req, 1024 * 1024 * 25);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      payload.threadId = threadId;
      const result = await handleOutboundSend(payload, { dealerId: mailDealerSlug });
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.11 GET /api/mail/stats - Contoare unread per folder (PMH-203)
    if (req.method === 'GET' && pathname === '/api/mail/stats') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const stats = await getMailStats(mailDealerSlug);
      return sendJson(res, 200, { success: true, stats });
    }

    // 0.12 GET /api/mail/search - Căutare conversații & mesaje (PMH-203)
    if (req.method === 'GET' && pathname === '/api/mail/search') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const q = urlObj.searchParams.get('q') || '';
      const results = await searchMail(q, mailDealerSlug);
      return sendJson(res, 200, { success: true, results });
    }

    // 0.13 GET /api/mail/accounts - Listă căsuțe angajați (PMH-204)
    if (req.method === 'GET' && pathname === '/api/mail/accounts') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const accounts = await getMailAccounts(mailDealerSlug);
      return sendJson(res, 200, { success: true, accounts });
    }

    // 0.14 POST /api/mail/accounts - Creare căsuță angajat (PMH-204)
    if (req.method === 'POST' && pathname === '/api/mail/accounts') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const created = await createMailAccount(payload, mailDealerSlug);
        return sendJson(res, 201, { success: true, account: created });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.15 PATCH/PUT /api/mail/accounts/:id - Actualizare căsuță (PMH-204)
    if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/mail/accounts/')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const accountId = pathname.replace('/api/mail/accounts/', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateMailAccount(accountId, payload, mailDealerSlug);
        return sendJson(res, 200, { success: true, account: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.16 DELETE sau POST /reassign - Dezactivare căsuță și reasignare threaduri (PMH-204)
    if (
      (req.method === 'DELETE' && pathname.startsWith('/api/mail/accounts/')) ||
      (req.method === 'POST' && pathname.includes('/api/mail/accounts/') && pathname.endsWith('/reassign'))
    ) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const accountId = pathname.replace('/api/mail/accounts/', '').replace('/reassign', '');
      let targetAccountId = null;
      if (req.method === 'POST') {
        const rawBody = await readRequestBody(req, 1024 * 32);
        try {
          const body = JSON.parse(rawBody.toString('utf8'));
          targetAccountId = body.targetAccountId || null;
        } catch {}
      }
      try {
        const result = await disableMailAccountAndReassign(accountId, targetAccountId, mailDealerSlug);
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.17 GET /api/mail/push/vapid-key - Cheie publică VAPID pentru abonare (PMH-402)
    if (req.method === 'GET' && pathname === '/api/mail/push/vapid-key') {
      const publicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      return sendJson(res, 200, { success: true, publicKey });
    }

    // 0.18 POST /api/mail/push/subscribe - Salvare abonament Web Push browser/telefon (PMH-402)
    if (req.method === 'POST' && pathname === '/api/mail/push/subscribe') {
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const result = await savePushSubscription(payload.accountId || 'default-agent', payload.subscription, payload.userAgent || '', mailDealerSlug);
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.18b DELETE /api/mail/push/unsubscribe - Dezabonare Web Push (PMH-402)
    if (req.method === 'DELETE' && pathname === '/api/mail/push/unsubscribe') {
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload = {};
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch {}
      try {
        const result = await unsubscribePush(payload.endpoint, payload.accountId);
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.19 POST /api/mail/push/test - Test canal Web Push (PMH-402)
    if (req.method === 'POST' && pathname === '/api/mail/push/test') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      return sendJson(res, 200, { 
        success: true, 
        message: 'Canalul Web Push este activ și pregătit pentru alerte în timp real pe dispozitivele consilierilor.' 
      });
    }

    // 0.20 POST /api/mail/domains/verify - Înregistrare & verificare domeniu nou (SES v2 + Cloudflare DNS) (PMH-202)
    if (req.method === 'POST' && pathname === '/api/mail/domains/verify') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      
      const domain = String(payload.domain || '').trim().toLowerCase();
      if (!domain) {
        return sendJson(res, 400, { success: false, error: 'Domeniul este obligatoriu' });
      }

      try {
        const sesResult = await registerDomainInSES(domain);
        const cfResult = await syncDnsToCloudflare(
          payload.cloudflareZoneId,
          sesResult.dkimTokens,
          sesResult.spfRecord,
          payload.cloudflareApiToken,
          domain
        );

        const dnsChecklist = buildDnsChecklist(domain, sesResult.dkimTokens, sesResult.spfRecord);

        const domainRecord = await saveDomainRecord(mailDealerSlug, domain, {
          verificationStatus: sesResult.verificationStatus,
          dkimStatus: sesResult.dkimStatus,
          dkimTokens: sesResult.dkimTokens,
          spfRecord: sesResult.spfRecord,
          mxRecord: sesResult.mxRecord,
          isCloudflareSynced: cfResult.isCloudflareSynced,
          cloudflareZoneId: payload.cloudflareZoneId,
        });

        return sendJson(res, 200, {
          success: true,
          domain,
          dkimTokens: sesResult.dkimTokens,
          spfRecord: sesResult.spfRecord,
          mxRecord: sesResult.mxRecord,
          verificationStatus: sesResult.verificationStatus,
          dkimStatus: sesResult.dkimStatus,
          isCloudflareSynced: cfResult.isCloudflareSynced,
          dnsChecklist,
          record: domainRecord,
        });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 0.21 GET /api/mail/domains/:domain/status - Interogare status verificare domeniu (SES v2)
    if (req.method === 'GET' && pathname.startsWith('/api/mail/domains/') && pathname.endsWith('/status')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const domain = pathname.replace('/api/mail/domains/', '').replace('/status', '');
      const statusResult = await checkDomainVerificationStatus(domain);
      return sendJson(res, 200, statusResult);
    }

    // 0.22 GET /api/mail/domains - Listă domenii configurate pentru dealer
    if (req.method === 'GET' && pathname === '/api/mail/domains') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const sql = getSql();
      try {
        const rows = await sql`
          SELECT * FROM mail_domains WHERE dealer_id = ${mailDealerSlug} ORDER BY created_at DESC
        `;
        return sendJson(res, 200, { success: true, domains: rows });
      } catch {
        return sendJson(res, 200, { success: true, domains: [] });
      }
    }

    // 0.23 GET /api/admin/storage/stats - Statistici stocare VPS & Google Drive Vault (PMH-404)
    if (req.method === 'GET' && pathname === '/api/admin/storage/stats') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      try {
        const stats = await getStorageStats();
        return sendJson(res, 200, { success: true, ...stats });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 0.24 POST /api/admin/storage/enforce-quota - Rulare forțată verificare cotă & LRU eviction (PMH-404)
    if (req.method === 'POST' && pathname === '/api/admin/storage/enforce-quota') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      try {
        const result = await enforceStorageQuota();
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 0.25 GET /api/mail/attachments/:id/download - Descărcare transparentă atașament (Local sau Google Drive Vault) [Admin Required]
    if (req.method === 'GET' && pathname.startsWith('/api/mail/attachments/') && pathname.endsWith('/download')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat. Descărcarea atașamentelor necesită sesiune de administrator.' });
      }
      const attachmentId = pathname.replace('/api/mail/attachments/', '').replace('/download', '');
      const sql = getSql();

      let attachment = null;
      try {
        const rows = await sql`
          SELECT * FROM mail_attachments WHERE id = ${attachmentId} LIMIT 1
        `;
        if (rows && rows[0]) attachment = rows[0];
      } catch {}

      // 1. Verificare pe disc local uploads/
      const uploadsDir = getUploadsDir();
      const localCandidate = attachment?.file_name 
        ? path.join(uploadsDir, attachment.file_name)
        : path.join(uploadsDir, attachmentId);

      if (fs.existsSync(localCandidate)) {
        const stat = fs.statSync(localCandidate);
        const mimeType = attachment?.mime_type || 'application/octet-stream';
        const fileName = attachment?.file_name || path.basename(localCandidate);

        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': stat.size,
          'Content-Disposition': `inline; filename="${fileName}"`,
          'X-ParcOS-Storage-Driver': 'LOCAL_DISK',
        });
        return fs.createReadStream(localCandidate).pipe(res);
      }

      // 2. Descărcare transparentă din Google Drive Vault
      const vaultKey = attachment?.storage_key || attachmentId;
      try {
        return await streamFileFromVault(vaultKey, res, {
          fileName: attachment?.file_name || 'document.pdf',
          mimeType: attachment?.mime_type || 'application/pdf',
        });
      } catch (err) {
        return sendJson(res, 404, {
          success: false,
          error: `Atașamentul nu a putut fi recuperat: ${err.message}`,
        });
      }
    }

    // 1. GET /api/market-lookup - Căutare oferte comparabile Autovit [Admin Required]
    if (req.method === 'GET' && pathname === '/api/market-lookup') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Căutarea comparativă de piață necesită autentificare de Administrator.',
          ads: []
        });
      }

      // Rate-limit: max 20 req/min per token admin
      const adminToken = (req.headers['authorization'] || req.headers['x-admin-token'] || '').slice(0, 64);
      const mlRate = marketLookupRateMap.get(adminToken) || { count: 0, windowStart: Date.now() };
      if (Date.now() - mlRate.windowStart > 60000) {
        mlRate.count = 0;
        mlRate.windowStart = Date.now();
      }
      mlRate.count++;
      marketLookupRateMap.set(adminToken, mlRate);
      if (mlRate.count > MARKET_LOOKUP_RATE_LIMIT) {
        return sendJson(res, 429, { success: false, error: 'Rate limit depășit. Max 20 căutări/minut.', ads: [] });
      }

      const brand = urlObj.searchParams.get('brand');
      const model = urlObj.searchParams.get('model');
      const year = urlObj.searchParams.get('year') ? parseInt(urlObj.searchParams.get('year'), 10) : undefined;
      const mileage = urlObj.searchParams.get('mileage') ? parseInt(urlObj.searchParams.get('mileage'), 10) : undefined;

      if (!brand || !model) {
        return sendJson(res, 400, {
          success: false,
          error: 'Parametrii "brand" și "model" sunt obligatorii',
          ads: []
        });
      }

      const yearFrom = urlObj.searchParams.get('yearFrom') ? parseInt(urlObj.searchParams.get('yearFrom'), 10) : undefined;
      const maxKm = urlObj.searchParams.get('maxKm') ? parseInt(urlObj.searchParams.get('maxKm'), 10) : undefined;

      try {
        const result = await fetchAutovitLive(brand, model, year, mileage, { yearFrom, yearTo: undefined, maxKm });
        return sendJson(res, 200, result);
      } catch (lookupErr) {
        return sendJson(res, 500, {
          success: false,
          reason: lookupErr.message || 'Eroare la căutarea ofertelor din piață',
          ads: []
        });
      }
    }

    // 2. GET /api/admin/vehicles - Listare completă inventar cu date financiare [STRICT ADMIN]
    if (req.method === 'GET' && pathname === '/api/admin/vehicles') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Vizualizarea inventarului complet necesită autentificare ca Administrator.',
        });
      }
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      const rows = await getAllAdminVehicles(tenant.slug);
      return sendJson(res, 200, {
        success: true,
        count: rows.length,
        dealer: tenant.slug,
        vehicles: rows,
      });
    }

    // 2.1 GET /api/admin/vehicles/:id - Detalii complete vehicul cu date financiare [STRICT ADMIN]
    if (req.method === 'GET' && pathname.startsWith('/api/admin/vehicles/')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Detaliile complete necesită autentificare ca Administrator.',
        });
      }
      const id = decodeURIComponent(pathname.replace('/api/admin/vehicles/', '')).trim();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      const vehicle = await getAdminVehicleById(safeId, tenant.slug);
      if (!vehicle) {
        return sendJson(res, 404, { success: false, error: 'Vehiculul nu a fost găsit' });
      }
      return sendJson(res, 200, { success: true, vehicle });
    }

    // 2.2 GET /api/admin/olx-status - Reconciliere status OLX [STRICT ADMIN]
    if (req.method === 'GET' && pathname === '/api/admin/olx-status') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Reconcilierea OLX necesită autentificare ca Administrator.',
        });
      }
      const filePath = path.join(process.cwd(), 'server', 'data', 'olx_live_status.json');
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return sendJson(res, 200, content);
        } catch {
          return sendJson(res, 500, { success: false, error: 'Eroare la parsarea fișierului de status OLX' });
        }
      }
      return sendJson(res, 404, { success: false, error: 'Snapshot-ul OLX nu a fost găsit pe server' });
    }

    // 2.3 GET /api/admin/market-competitors - Snapshot oferte concurente piață [STRICT ADMIN]
    if (req.method === 'GET' && pathname === '/api/admin/market-competitors') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Analiza concurenței necesită autentificare ca Administrator.',
        });
      }
      const filePath = path.join(process.cwd(), 'server', 'data', 'market_competitors.json');
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return sendJson(res, 200, content);
        } catch {
          return sendJson(res, 500, { success: false, error: 'Eroare la parsarea datelor despre concurență' });
        }
      }
      return sendJson(res, 404, { success: false, error: 'Datele de concurență nu au fost găsite pe server' });
    }

    // 6.0.1 GET /api/demo/ocr-quota - Verificare cota rămasă scanări demo (Public)
    if (req.method === 'GET' && pathname === '/api/demo/ocr-quota') {
      const clientIp = getClientIp(req);
      const urlObj = new URL(req.url, 'http://localhost');
      const clientToken = urlObj.searchParams.get('clientToken') || req.headers['x-client-token'] || '';
      const limitStatus = checkDemoOcrLimit(clientIp, clientToken);

      return sendJson(res, 200, {
        success: true,
        remainingScans: limitStatus.remaining,
        limitReached: !limitStatus.allowed,
        maxAllowed: DEMO_OCR_MAX_SCANS,
      });
    }

    // 6.0.2 POST /api/demo/ocr-scan - Scanner Demo Public securizat (Rate limit max 3 scanări / IP)
    if (req.method === 'POST' && pathname === '/api/demo/ocr-scan') {
      const clientIp = getClientIp(req);
      const rawHeaderToken = req.headers['x-client-token'];
      
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 15 * 1024 * 1024);
        parsedBody = JSON.parse(bodyBuffer.toString('utf-8'));
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Format JSON invalid pentru scanare demo.',
          message: err.message,
        });
      }

      const clientToken = parsedBody.clientToken || rawHeaderToken || '';
      const limitStatus = checkDemoOcrLimit(clientIp, clientToken);

      if (!limitStatus.allowed) {
        return sendJson(res, 429, {
          success: false,
          limitReached: true,
          remainingScans: 0,
          error: 'Ați atins limita de 3 scanări gratuite pentru test.',
          message: 'Ai testat puterea scannerului ParcOS AI pe 3 documente reale. Pentru scanări nelimitate, integrare automată în contracte și acces complet la platformă, solicită un cont dealer sau programează un demo live.',
        });
      }

      const { imageBase64, mimeType = 'image/jpeg' } = parsedBody;
      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 50) {
        return sendJson(res, 400, {
          success: false,
          error: 'Lipsă imagine document (câmpul imageBase64 este obligatoriu).',
        });
      }

      const availableKeys = getResolvedGeminiKeys();
      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastError = null;
      let extractedData = null;

      const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();

      for (const model of candidateModels) {
        if (extractedData) break;
        for (const geminiApiKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: VEHICLE_DOC_PROMPT },
                      { inline_data: { mime_type: mimeType, data: cleanedBase64 } }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.1,
                  response_mime_type: 'application/json'
                }
              })
            });

            if (!upstreamRes.ok) {
              const errBody = await upstreamRes.text();
              console.warn(`[Demo OCR] Model ${model} a returnat status ${upstreamRes.status}:`, errBody.slice(0, 150));
              if (upstreamRes.status === 429) continue;
              continue;
            }

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extractedData = JSON.parse(cleanJsonText);
              break;
            }
          } catch (e) {
            lastError = e;
          }
        }
      }

      if (!extractedData) {
        return sendJson(res, 422, {
          success: false,
          error: 'Documentul nu a putut fi analizat optic. Vă rugăm să reîncercați cu o fotografie mai clară.',
          message: 'Serviciul inteligent de procesare a documentelor întâmpină o indisponibilitate temporară. Vă rugăm să reîncercați.',
        });
      }

      // Normalizare Seria CIV (format X-123456)
      if (extractedData.civNumber && typeof extractedData.civNumber === 'string') {
        const civMatch = extractedData.civNumber.trim().toUpperCase().replace(/\s+/g, '').match(/^([A-Z])[-–]?(\d{6})$/i);
        if (civMatch) extractedData.civNumber = `${civMatch[1].toUpperCase()}-${civMatch[2]}`;
      }

      // Înregistrare consum cotă pentru acest IP/Device
      const remainingAfterScan = incrementDemoOcrUsage(clientIp, clientToken);

      return sendJson(res, 200, {
        success: true,
        remainingScans: remainingAfterScan,
        limitReached: remainingAfterScan <= 0,
        vehicleData: extractedData,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // 6.0.3 POST /api/parcos/vehicles/scan-civ — Multi-Tenant Backend-as-a-Proxy OCR
    // ══════════════════════════════════════════════════════════════════
    if (req.method === 'POST' && pathname === '/api/parcos/vehicles/scan-civ') {
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 20 * 1024 * 1024);
        parsedBody = JSON.parse(bodyBuffer.toString('utf-8'));
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Format JSON invalid pentru scanare CIV/Talon.',
          message: err.message,
        });
      }

      const tenantId = resolveTenantIdFromReq(req, parsedBody);
      if (!(await isAuthorizedTenantReq(req, tenantId, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Procesarea documentelor CIV/Talon necesită sesiune tenant autorizată.',
        });
      }

      // 1. Verificare Rate Limit per Tenant (max 15/min, max 100/zi)
      const rateStatus = checkTenantAiRateLimit(tenantId);
      if (!rateStatus.allowed) {
        res.setHeader('Retry-After', String(rateStatus.retryAfterSeconds));
        res.setHeader('X-RateLimit-Limit', String(rateStatus.limit));
        res.setHeader('X-RateLimit-Remaining', '0');
        return sendJson(res, 429, {
          success: false,
          limitReached: true,
          error: 'Ați atins limita de procesare simultană a documentelor. Vă rugăm să așteptați câteva momente.',
          message: rateStatus.message,
          retryAfterSeconds: rateStatus.retryAfterSeconds,
          limitType: rateStatus.limitType,
          manualFallback: true,
        });
      }

      // Consumă cota tenantului pentru această cerere autorizată
      recordTenantAiUsage(tenantId);

      // 2. Verificare Circuit Breaker (Protecție anti-flooding dacă Google este picat)
      const cbStatus = checkAiCircuitBreaker();
      if (cbStatus.isOpen) {
        return sendJson(res, 503, {
          success: false,
          circuitOpen: true,
          error: cbStatus.message,
          message: 'Furnizorul central de procesare automată este temporar indisponibil. Datele pot fi introduse manual.',
          manualFallback: true,
        });
      }

      const { imageBase64, mimeType = 'image/jpeg', countryHint = 'AUTO' } = parsedBody;
      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 50) {
        return sendJson(res, 400, {
          success: false,
          error: 'Lipsă imagine document (câmpul imageBase64 este obligatoriu).',
        });
      }

      const availableKeys = getResolvedGeminiKeys();
      if (availableKeys.length === 0) {
        return sendJson(res, 503, {
          success: false,
          error: 'Serviciul centralizat de OCR nu este configurat (lipsă credențiale holding).',
        });
      }

      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastError = null;
      let extractedData = null;
      const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();

      let customPrompt = VEHICLE_DOC_PROMPT;
      if (countryHint && countryHint !== 'AUTO') {
        customPrompt += `\nHint for this document: The document is issued by country code "${countryHint}". Prioritize matching national fields for this country.`;
      }

      for (const model of candidateModels) {
        if (extractedData) break;
        for (const geminiApiKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: customPrompt },
                      { inline_data: { mime_type: mimeType, data: cleanedBase64 } }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.1,
                  response_mime_type: 'application/json'
                }
              })
            });

            if (!upstreamRes.ok) {
              const errBody = await upstreamRes.text();
              console.warn(`[Parcos OCR Proxy] Model ${model} returned status ${upstreamRes.status}:`, errBody.slice(0, 150));
              if (upstreamRes.status >= 500) {
                recordAiFailure();
              }
              if (upstreamRes.status === 429) continue;
              continue;
            }

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extractedData = JSON.parse(cleanJsonText);
              break;
            }
          } catch (e) {
            lastError = e;
          }
        }
      }

      if (!extractedData) {
        recordAiFailure();
        return sendJson(res, 422, {
          success: false,
          error: 'Documentul nu a putut fi analizat optic. Asigurați o fotografie bine focalizată și iluminată.',
          message: 'Serviciul inteligent de procesare a documentelor întâmpină o indisponibilitate temporară. Puteți introduce datele manual.',
          manualFallback: true,
        });
      }

      recordAiSuccess();

      // Normalizare Seria CIV (format X-123456)
      if (extractedData.civNumber && typeof extractedData.civNumber === 'string') {
        const civMatch = extractedData.civNumber.trim().toUpperCase().replace(/\s+/g, '').match(/^([A-Z])[-–]?(\d{6})$/i);
        if (civMatch) extractedData.civNumber = `${civMatch[1].toUpperCase()}-${civMatch[2]}`;
      }

      // Calcul și sincronizare putere kW/HP
      if (extractedData.powerKw && !extractedData.powerHp) {
        extractedData.powerHp = Math.round(extractedData.powerKw * 1.35962);
      } else if (extractedData.powerHp && !extractedData.powerKw) {
        extractedData.powerKw = Math.round(extractedData.powerHp / 1.35962);
      }

      return sendJson(res, 200, {
        success: true,
        tenantId,
        vehicleData: extractedData,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // 6.0.4 POST /api/parcos/ai/sanitize-description — Multi-Tenant AI Description Sanitizer
    // ══════════════════════════════════════════════════════════════════
    if (req.method === 'POST' && pathname === '/api/parcos/ai/sanitize-description') {
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 2 * 1024 * 1024);
        parsedBody = JSON.parse(bodyBuffer.toString('utf-8'));
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Format JSON invalid pentru generare descriere.',
          message: err.message,
        });
      }

      const tenantId = resolveTenantIdFromReq(req, parsedBody);
      if (!(await isAuthorizedTenantReq(req, tenantId, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Generarea descrierilor asistate AI necesită sesiune tenant autorizată.',
        });
      }

      // 1. Verificare Rate Limit per Tenant (max 15/min, max 100/zi)
      const rateStatus = checkTenantAiRateLimit(tenantId);
      if (!rateStatus.allowed) {
        res.setHeader('Retry-After', String(rateStatus.retryAfterSeconds));
        res.setHeader('X-RateLimit-Limit', String(rateStatus.limit));
        res.setHeader('X-RateLimit-Remaining', '0');
        return sendJson(res, 429, {
          success: false,
          limitReached: true,
          error: 'Ați atins limita de procesare simultană a documentelor. Vă rugăm să așteptați câteva momente.',
          message: rateStatus.message,
          retryAfterSeconds: rateStatus.retryAfterSeconds,
          limitType: rateStatus.limitType,
          manualFallback: true,
        });
      }

      // Consumă cota tenantului pentru această cerere autorizată
      recordTenantAiUsage(tenantId);

      // 2. Verificare Circuit Breaker
      const cbStatus = checkAiCircuitBreaker();
      if (cbStatus.isOpen) {
        return sendJson(res, 503, {
          success: false,
          circuitOpen: true,
          error: cbStatus.message,
          message: 'Furnizorul central de procesare automată este temporar indisponibil. Descrierea poate fi editată manual.',
          manualFallback: true,
        });
      }

      const {
        brand = '',
        model = '',
        versionTrim = '',
        year = new Date().getFullYear(),
        specs = '',
        rawDescription = '',
        tone = 'editorial',
        selectedFeatures = [],
        vatDeductible = true,
        warrantyMonths = 12,
      } = parsedBody;

      if (!brand && !model && !rawDescription) {
        return sendJson(res, 400, {
          success: false,
          error: 'Specificați cel puțin marca, modelul sau textul brut al anunțului.',
        });
      }

      const availableKeys = getResolvedGeminiKeys();
      if (availableKeys.length === 0) {
        return sendJson(res, 503, {
          success: false,
          error: 'Serviciul centralizat AI nu este configurat pe server.',
        });
      }

      const promptText = `Ești copywriter auto de elită pentru showroom-uri din rețeaua ParcOS / CARVANA SRL.
Redactează și restructurează descrierea comercială a acestui vehicul într-un format profesional, captivant și curat:

VEHICUL: ${brand} ${model} ${versionTrim} (An ${year})
SPECIFICAȚII: ${specs || 'Standard'}
DOTĂRI CHEIE: ${Array.isArray(selectedFeatures) ? selectedFeatures.join(', ') : ''}
DESCRIERE BRUTĂ FURNIZATĂ: ${rawDescription || 'Fără descriere brută'}
TON SOLICITAT: ${tone} (editorial / showroom profesional)

REGULI STRICTE & INVARIANTE HOLDING:
1. Limba: Română impecabilă, formulări elegante, fără clișee vulgare („full fără trapă”, „nu bate nu troncăne”).
2. Regim TVA: Folosește STRICT sintagma „TVA Deductibil 21%” dacă este deductibil (${vatDeductible ? 'DA' : 'NU'}), sau „Regim Special de Marjă (TVA inclus)” dacă nu este deductibil.
3. Garanții & Plăți: Folosește STRICT termenul „Cont de Garanție” sau „Garanție de Rezervare”. NU folosi niciodată termenul „escrow” sau „cont fiduciar”.
4. Beneficii: Include garanție scrisă ${warrantyMonths} luni, kilometraj certificat pe factură, verificare tehnică și posibilitate finanțare.
5. Format: Returnează un obiect JSON STRICT (fără markdown fences, fără alte câmpuri):
{
  "sanitizedDescription": "textul complet structurat al descrierii, cu paragrafe și bullet points bine aerisite"
}`;

      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let sanitizedText = '';

      for (const model of candidateModels) {
        if (sanitizedText) break;
        for (const geminiApiKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                  temperature: 0.3,
                  response_mime_type: 'application/json'
                }
              })
            });

            if (!upstreamRes.ok) continue;

            const resJson = await upstreamRes.json();
            const rawReply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawReply) {
              const cleaned = rawReply.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(cleaned);
              sanitizedText = parsed.sanitizedDescription || '';
              if (sanitizedText) break;
            }
          } catch (_) {}
        }
      }

      if (!sanitizedText) {
        recordAiFailure();
        return sendJson(res, 502, {
          success: false,
          error: 'Generarea automată a descrierii întâmpină o indisponibilitate temporară. Puteți redacta textul manual.',
          manualFallback: true,
        });
      }

      recordAiSuccess();

      return sendJson(res, 200, {
        success: true,
        tenantId,
        description: sanitizedText,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // 6.0.5 POST /api/parcos/clients/scan-id — Multi-Tenant Backend-as-a-Proxy Client ID Card (Buletin) OCR
    // ══════════════════════════════════════════════════════════════════
    if (req.method === 'POST' && pathname === '/api/parcos/clients/scan-id') {
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 20 * 1024 * 1024);
        parsedBody = JSON.parse(bodyBuffer.toString('utf-8'));
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Format JSON invalid pentru scanare act de identitate.',
          message: err.message,
        });
      }

      const tenantId = resolveTenantIdFromReq(req, parsedBody);
      if (!(await isAuthorizedTenantReq(req, tenantId, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Procesarea actelor de identitate necesită sesiune tenant autorizată.',
        });
      }

      // 1. Verificare Rate Limit per Tenant (max 15/min, max 100/zi)
      const rateStatus = checkTenantAiRateLimit(tenantId);
      if (!rateStatus.allowed) {
        res.setHeader('Retry-After', String(rateStatus.retryAfterSeconds));
        res.setHeader('X-RateLimit-Limit', String(rateStatus.limit));
        res.setHeader('X-RateLimit-Remaining', '0');
        return sendJson(res, 429, {
          success: false,
          limitReached: true,
          error: 'Ați atins limita de procesare simultană a documentelor. Vă rugăm să așteptați câteva momente.',
          message: rateStatus.message,
          retryAfterSeconds: rateStatus.retryAfterSeconds,
          limitType: rateStatus.limitType,
          manualFallback: true,
        });
      }

      // Consumă cota tenantului pentru această cerere autorizată
      recordTenantAiUsage(tenantId);

      // 2. Verificare Circuit Breaker (Protecție anti-flooding dacă Google este picat)
      const cbStatus = checkAiCircuitBreaker();
      if (cbStatus.isOpen) {
        return sendJson(res, 503, {
          success: false,
          circuitOpen: true,
          error: cbStatus.message,
          message: 'Furnizorul central de procesare automată este temporar indisponibil. Datele clientului pot fi introduse manual.',
          manualFallback: true,
        });
      }

      const { imageBase64, mimeType = 'image/jpeg' } = parsedBody;
      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 50) {
        return sendJson(res, 400, {
          success: false,
          error: 'Lipsă imagine act de identitate (câmpul imageBase64 este obligatoriu).',
        });
      }

      const availableKeys = getResolvedGeminiKeys();
      if (availableKeys.length === 0) {
        return sendJson(res, 503, {
          success: false,
          error: 'Serviciul centralizat de OCR nu este configurat (lipsă credențiale holding).',
        });
      }

      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastError = null;
      let extractedData = null;
      const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();

      for (const model of candidateModels) {
        if (extractedData) break;
        for (const geminiApiKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: ID_CARD_PROMPT },
                      { inline_data: { mime_type: mimeType, data: cleanedBase64 } }
                    ]
                  }
                ],
                generationConfig: {
                  temperature: 0.1,
                  response_mime_type: 'application/json'
                }
              })
            });

            if (!upstreamRes.ok) {
              const errBody = await upstreamRes.text();
              console.warn(`[Parcos ID OCR Proxy] Model ${model} returned status ${upstreamRes.status}:`, errBody.slice(0, 150));
              if (upstreamRes.status >= 500) {
                recordAiFailure();
              }
              if (upstreamRes.status === 429) continue;
              continue;
            }

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extractedData = JSON.parse(cleanJsonText);
              break;
            }
          } catch (e) {
            lastError = e;
          }
        }
      }

      if (!extractedData) {
        recordAiFailure();
        return sendJson(res, 422, {
          success: false,
          error: 'Actul de identitate nu a putut fi analizat optic. Asigurați o fotografie bine focalizată și iluminată.',
          message: 'Serviciul inteligent de procesare a documentelor întâmpină o indisponibilitate temporară. Puteți introduce datele manual.',
          manualFallback: true,
        });
      }

      recordAiSuccess();

      return sendJson(res, 200, {
        success: true,
        tenantId,
        idData: extractedData,
      });
    }

    // 6.1 POST /api/admin/ocr/gemini/* & /api/ocr/gemini/* - Gateway securizat Google Gemini OCR [STRICT ADMIN]
    if (req.method === 'POST' && (pathname.startsWith('/api/admin/ocr/gemini/') || pathname.startsWith('/api/ocr/gemini/'))) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Procesarea automată OCR a documentelor necesită autentificare ca Administrator.',
        });
      }

      const geminiSubpath = pathname.replace(/^\/api\/(?:admin\/)?ocr\/gemini\//, '');
      const availableKeys = getResolvedGeminiKeys();
      if (availableKeys.length === 0) {
        return sendJson(res, 503, {
          success: false,
          error: 'Serviciul OCR nu este configurat pe server (lipsă chei API).',
        });
      }

      try {
        const bodyBuffer = await readRequestBody(req, 20 * 1024 * 1024);
        let lastProxyStatus = 500;
        let lastProxyText = '';

        for (const activeKey of availableKeys) {
          const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${geminiSubpath}`;
          const upstreamRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'x-goog-api-key': activeKey,
            },
            body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
          });

          lastProxyStatus = upstreamRes.status;
          lastProxyText = await upstreamRes.text();

          if (upstreamRes.ok) {
            const allowedOrigin = resolveCorsOrigin(req);
            res.writeHead(200, {
              'Content-Type': upstreamRes.headers.get('content-type') || 'application/json',
              'Access-Control-Allow-Origin': allowedOrigin,
              'Vary': 'Origin',
              'X-Content-Type-Options': 'nosniff',
            });
            return res.end(lastProxyText);
          }

          if (upstreamRes.status === 429) {
            console.warn(`[OCR Gateway] Limită 429 pe cheia curentă, se încearcă următoarea cheie din pool...`);
            continue;
          }
          break;
        }

        const allowedOrigin = resolveCorsOrigin(req);
        res.writeHead(lastProxyStatus, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin',
          'X-Content-Type-Options': 'nosniff',
        });
        return res.end(lastProxyText);
      } catch (geminiErr) {
        return sendJson(res, 500, {
          success: false,
          error: 'Eroare la apelul Gemini Vision API',
          message: geminiErr.message,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // AUTOLICIT CORE SYNC BRIDGE PROXY (DESY INGESTION ROUTER)
    // ══════════════════════════════════════════════════════════════════
    if (pathname.startsWith('/api/autolicit-sync')) {
      const subpath = pathname.replace(/^\/api\/autolicit-sync/, '');
      const syncBaseUrl = (process.env.AUTOLICIT_SYNC_URL || 'https://autolicit.ro/api/v1/dealers/sync').replace(/\/$/, '');
      const targetUrl = `${syncBaseUrl}${subpath}`;
      const bridgeKey = process.env.AUTOLICIT_BRIDGE_KEY || process.env.SUPERADMIN_MASTER_KEY || 'parcos_superadmin_dev_secret_2026';
      
      let dealerSlug = req.headers['x-dealer-slug'];
      if (!dealerSlug) {
        try {
          const tenant = await resolveTenant(req, urlObj);
          if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
          dealerSlug = tenant.slug || 'rxm';
        } catch {
          dealerSlug = 'rxm';
        }
      }

      let bodyData = null;
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        bodyData = await readRequestBody(req, 10 * 1024 * 1024);
      }

      try {
        const upstreamHeaders = {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'X-Holding-Bridge-Key': bridgeKey,
          'X-Dealer-Slug': dealerSlug,
        };

        const upstreamRes = await fetch(targetUrl, {
          method: req.method,
          headers: upstreamHeaders,
          body: bodyData && bodyData.length > 0 ? bodyData : undefined,
        });

        const status = upstreamRes.status;
        const respText = await upstreamRes.text();
        res.writeHead(status, {
          'Content-Type': upstreamRes.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': resolveCorsOrigin(req),
        });
        return res.end(respText);
      } catch (err) {
        return sendJson(res, 502, {
          success: false,
          error: `Eroare contactare nod Desy (${targetUrl}): ${err.message}`,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // VEHICLE VIEWS TELEMETRY & AUDIENCE INTELLIGENCE (WAVE 2)
    // ══════════════════════════════════════════════════════════════════

    // 1. POST /api/telemetry/vehicle-view — Ingestie debounced vizualizare showroom (suport JSON + sendBeacon)
    if (req.method === 'POST' && pathname === '/api/telemetry/vehicle-view') {
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 128 * 1024); // max 128 KB
        const rawText = bodyBuffer.toString('utf-8').trim();
        if (rawText) {
          parsedBody = JSON.parse(rawText);
        }
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Format JSON invalid pentru semnalul de telemetrie.',
          message: err.message,
        });
      }

      const vehicleId = String(parsedBody.vehicleId || parsedBody.vehicle_id || parsedBody.id || '').trim();
      if (!vehicleId) {
        return sendJson(res, 400, {
          success: false,
          error: 'Parametrul "vehicleId" este obligatoriu.',
        });
      }

      // Rezoluție tenant / dealer slug
      let dealerSlug = String(parsedBody.dealerSlug || parsedBody.dealer_slug || '').trim().toLowerCase();
      if (!dealerSlug) {
        try {
          const tenant = await resolveTenant(req, urlObj);
          dealerSlug = tenant?.slug || 'rxm';
        } catch {
          dealerSlug = 'rxm';
        }
      }

      const source = String(parsedBody.source || 'showroom').trim().slice(0, 30);

      // Calcul session_hash GDPR compliant: SHA256(IP + UserAgent + DataZilnică)
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const clientIp = String(rawIp).split(',')[0].trim();
      const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 200);
      const todayDate = new Date().toISOString().split('T')[0];

      const sessionHash = crypto.createHash('sha256')
        .update(`${clientIp}-${userAgent}-${todayDate}`)
        .digest('hex');

      try {
        const result = await recordVehicleView(vehicleId, dealerSlug, source, sessionHash);
        return sendJson(res, 200, {
          success: true,
          ...result,
        });
      } catch (err) {
        return sendJson(res, 500, {
          success: false,
          error: 'Eroare la salvarea telemetriei',
          message: err.message,
        });
      }
    }

    // 2. GET /api/dealers/:dealerSlug/analytics/top-viewed & /api/analytics/top-viewed — Agregare top mașini
    const topViewedMatch = pathname.match(/^\/api\/dealers\/([^/]+)\/analytics\/top-viewed$/) || (pathname === '/api/analytics/top-viewed' ? [pathname, ''] : null);
    if (req.method === 'GET' && topViewedMatch) {
      let dealerSlug = topViewedMatch[1] ? decodeURIComponent(topViewedMatch[1]).trim().toLowerCase() : (urlObj.searchParams.get('dealer') || urlObj.searchParams.get('dealer_slug') || '');
      if (!dealerSlug) {
        try {
          const tenant = await resolveTenant(req, urlObj);
          dealerSlug = tenant?.slug || 'rxm';
        } catch {
          dealerSlug = 'rxm';
        }
      }

      const timeframe = urlObj.searchParams.get('timeframe') || 'all';
      const limit = Math.max(1, Math.min(100, parseInt(urlObj.searchParams.get('limit') || '10', 10)));

      try {
        const topCars = await getTopViewedVehicles(dealerSlug, timeframe, limit);
        return sendJson(res, 200, {
          success: true,
          dealer: dealerSlug,
          timeframe,
          count: topCars.length,
          topCars,
        });
      } catch (err) {
        return sendJson(res, 500, {
          success: false,
          error: 'Eroare la interogarea clasamentului de vizualizări',
          message: err.message,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // SITE VISITORS & CONVERSION TELEMETRY (WAVE 1)
    // ══════════════════════════════════════════════════════════════════

    // 1. POST /api/telemetry/traffic-event — Ingestie debounced trafic site & interacțiuni (suport JSON + sendBeacon)
    if (req.method === 'POST' && pathname === '/api/telemetry/traffic-event') {
      let parsedBody = {};
      try {
        const bodyBuffer = await readRequestBody(req, 64 * 1024); // max 64 KB
        const rawText = bodyBuffer.toString('utf-8').trim();
        if (rawText) {
          try {
            parsedBody = JSON.parse(rawText);
          } catch {
            parsedBody = {};
          }
        }
      } catch (err) {
        parsedBody = {};
      }

      // Rezoluție tenant / dealer slug
      let dealerSlug = String(parsedBody.dealerSlug || parsedBody.dealer_slug || '').trim().toLowerCase();
      if (!dealerSlug) {
        try {
          const tenant = await resolveTenant(req, urlObj);
          dealerSlug = tenant?.slug || 'parcos';
        } catch {
          dealerSlug = 'parcos';
        }
      }

      const eventType = String(parsedBody.eventType || parsedBody.event_type || 'pageview').trim().toLowerCase();
      const pagePath = String(parsedBody.pagePath || parsedBody.page_path || '/').trim();
      const source = String(parsedBody.source || 'direct').trim().toLowerCase().slice(0, 50);
      const referrer = parsedBody.referrer ? String(parsedBody.referrer).trim().slice(0, 500) : null;
      const metadata = parsedBody.metadata || {};

      // Calcul session_hash GDPR compliant: SHA256(IP + UserAgent + DataZilnică + Salt)
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const clientIp = String(rawIp).split(',')[0].trim();
      const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 300);
      const todayYmd = new Date().toISOString().split('T')[0];

      const sessionHash = crypto.createHash('sha256')
        .update(`${clientIp}-${userAgent}-${todayYmd}-parcos-telemetry-v1`)
        .digest('hex');

      const deviceType = detectDeviceType(userAgent);

      try {
        const result = await recordTrafficEvent({
          dealerSlug,
          sessionHash,
          eventType,
          pagePath,
          source,
          deviceType,
          referrer,
          metadata
        });

        return sendJson(res, 200, {
          success: true,
          recorded: Boolean(result?.success),
          eventId: result?.eventId || null,
          dealer: dealerSlug,
          sessionHash,
          deviceType,
          ...(result?.error ? { warning: result.error } : {})
        });
      } catch (err) {
        return sendJson(res, 200, {
          success: true,
          recorded: false,
          error: 'Eroare la înregistrarea telemetriei de trafic',
          message: err.message
        });
      }
    }

    // 2. GET /api/dealers/:dealerSlug/analytics/traffic-summary & /api/analytics/traffic-summary — Sumar metrici trafic
    const trafficSummaryMatch = pathname.match(/^\/api\/dealers\/([^/]+)\/analytics\/traffic-summary$/) || (pathname === '/api/analytics/traffic-summary' ? [pathname, ''] : null);
    if (req.method === 'GET' && trafficSummaryMatch) {
      let dealerSlug = trafficSummaryMatch[1] ? decodeURIComponent(trafficSummaryMatch[1]).trim().toLowerCase() : (urlObj.searchParams.get('dealer') || urlObj.searchParams.get('dealer_slug') || '');
      if (!dealerSlug) {
        try {
          const tenant = await resolveTenant(req, urlObj);
          dealerSlug = tenant?.slug || 'parcos';
        } catch {
          dealerSlug = 'parcos';
        }
      }

      const timeframe = urlObj.searchParams.get('timeframe') || '30d';

      try {
        const summary = await getSiteTrafficAnalytics(dealerSlug, timeframe);
        return sendJson(res, 200, {
          success: true,
          dealer: dealerSlug,
          timeframe,
          summary,
          ...summary
        });
      } catch (err) {
        return sendJson(res, 500, {
          success: false,
          error: 'Eroare la agregarea sumarului de trafic',
          message: err.message
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // FEED-URI PUBLICE DE SINDICARE STOC (AUTOVIT PRO & META CATALOG)
    // ══════════════════════════════════════════════════════════════════

    // 2.8. GET /api/feed/autovit/:slug & /api/feed/autovit - Feed XML Autovit Pro
    const autovitFeedMatch = pathname.match(/^\/api\/feed\/autovit(?:\/([^/]+))?$/);
    if (req.method === 'GET' && autovitFeedMatch) {
      try {
        const rawSlug = autovitFeedMatch[1] ? decodeURIComponent(autovitFeedMatch[1]) : (urlObj.searchParams.get('dealer') || urlObj.searchParams.get('dealer_slug') || 'rxm');
        const slug = normalizeSlug(rawSlug) || 'rxm';

        let tenant = null;
        try {
          tenant = await getDealerBySlug(slug, true);
        } catch {}
        if (!tenant) {
          tenant = DEFAULT_DEALER_PROFILES[slug] || DEFAULT_DEALER_PROFILES['rxm'];
        }

        let allVehicles = [];
        try {
          allVehicles = await getAllPublicVehicles(slug);
        } catch {
          allVehicles = [];
        }

        // Invariantă: Excludem mașinile vândute ('sold') sau în pregătire ('in_preparation')
        const activeVehicles = allVehicles.filter(v => {
          const st = String(v.status || 'in_stock').toLowerCase();
          return st === 'in_stock' || st === 'available';
        });

        const escapeXml = (unsafe) => {
          if (unsafe == null) return '';
          return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ads>\n';
        for (const v of activeVehicles) {
          const title = `${v.brand || ''} ${v.model || ''} ${v.version_trim || ''}`.trim() || 'Vehicul ParcOS';
          const price = v.price_eur || 0;
          const vatDeductible = v.vat_deductible ? 1 : 0;
          const images = Array.isArray(v.images) ? v.images : [];
          const desc = v.description || v.equipment_sheet_text || `${title} - Disponibil în stoc.`;

          xml += `  <ad>\n`;
          xml += `    <id>${escapeXml(v.id)}</id>\n`;
          xml += `    <stock_number>${escapeXml(v.stock_number || v.id)}</stock_number>\n`;
          xml += `    <title>${escapeXml(title)}</title>\n`;
          xml += `    <make>${escapeXml(v.brand)}</make>\n`;
          xml += `    <model>${escapeXml(v.model)}</model>\n`;
          if (v.version_trim) xml += `    <version>${escapeXml(v.version_trim)}</version>\n`;
          xml += `    <year>${v.year || ''}</year>\n`;
          xml += `    <mileage>${v.mileage_km || 0}</mileage>\n`;
          xml += `    <price currency="EUR">${price}</price>\n`;
          xml += `    <vat_deductible>${vatDeductible}</vat_deductible>\n`;
          xml += `    <fuel_type>${escapeXml(v.fuel_type || 'Benzina')}</fuel_type>\n`;
          if (v.engine_cc) xml += `    <engine_capacity>${v.engine_cc}</engine_capacity>\n`;
          if (v.power_hp) xml += `    <engine_power>${v.power_hp}</engine_power>\n`;
          xml += `    <transmission>${escapeXml(v.transmission || 'Automata')}</transmission>\n`;
          xml += `    <body_type>${escapeXml(v.body_type || 'Sedan')}</body_type>\n`;
          if (v.vin) xml += `    <vin>${escapeXml(v.vin)}</vin>\n`;
          if (v.color) xml += `    <color>${escapeXml(v.color)}</color>\n`;
          xml += `    <description><![CDATA[${desc}]]></description>\n`;
          xml += `    <images>\n`;
          for (const img of images) {
            const imgUrl = String(img).startsWith('http') 
              ? img 
              : `https://${tenant.domain || 'parcos.ro'}${String(img).startsWith('/') ? '' : '/'}${img}`;
            xml += `      <image url="${escapeXml(imgUrl)}" />\n`;
          }
          xml += `    </images>\n`;
          xml += `    <dealer>\n`;
          xml += `      <name>${escapeXml(tenant.name)}</name>\n`;
          xml += `      <phone>${escapeXml(tenant.phone_primary || tenant.phonePrimary || '')}</phone>\n`;
          xml += `      <address>${escapeXml(tenant.address_street || tenant.address || '')}</address>\n`;
          xml += `      <cui>${escapeXml(tenant.cui || '')}</cui>\n`;
          xml += `    </dealer>\n`;
          xml += `  </ad>\n`;
        }
        xml += '</ads>';

        res.writeHead(200, {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300'
        });
        return res.end(xml);
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 2.9. GET /api/feed/csv/:slug & /api/feed/meta-catalog.csv - Feed CSV Meta / Facebook Catalog
    const csvFeedMatch = pathname.match(/^\/api\/feed\/(?:csv(?:\/([^/]+))?|meta-catalog\.csv)$/);
    if (req.method === 'GET' && csvFeedMatch) {
      try {
        const rawSlug = csvFeedMatch[1] ? decodeURIComponent(csvFeedMatch[1]) : (urlObj.searchParams.get('dealer') || urlObj.searchParams.get('dealer_slug') || 'rxm');
        const slug = normalizeSlug(rawSlug) || 'rxm';

        let tenant = null;
        try {
          tenant = await getDealerBySlug(slug, true);
        } catch {}
        if (!tenant) {
          tenant = DEFAULT_DEALER_PROFILES[slug] || DEFAULT_DEALER_PROFILES['rxm'];
        }

        let allVehicles = [];
        try {
          allVehicles = await getAllPublicVehicles(slug);
        } catch {
          allVehicles = [];
        }

        const activeVehicles = allVehicles.filter(v => {
          const st = String(v.status || 'in_stock').toLowerCase();
          return st === 'in_stock' || st === 'available';
        });

        const escapeCsv = (val) => {
          if (val == null) return '""';
          const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
          return `"${str}"`;
        };

        const headers = [
          'id', 'title', 'description', 'availability', 'condition',
          'price', 'currency', 'url', 'image_link', 'brand', 'make',
          'model', 'year', 'mileage.value', 'mileage.unit', 'transmission',
          'body_style', 'fuel_type', 'vin', 'dealer_phone'
        ];

        const rows = [headers.join(',')];

        for (const v of activeVehicles) {
          const title = `${v.brand || ''} ${v.model || ''} ${v.version_trim || ''}`.trim() || 'Vehicul ParcOS';
          const price = `${v.price_eur || 0} EUR`;
          const images = Array.isArray(v.images) ? v.images : [];
          const primaryImg = images[0] 
            ? (String(images[0]).startsWith('http') ? images[0] : `https://${tenant.domain || 'parcos.ro'}${String(images[0]).startsWith('/') ? '' : '/'}${images[0]}`) 
            : '';
          const vehicleUrl = `https://${tenant.domain || 'parcos.ro'}/cars/${v.id}`;
          const phone = tenant.phone_primary || tenant.phonePrimary || '';

          rows.push([
            escapeCsv(v.id),
            escapeCsv(title),
            escapeCsv(v.description || title),
            escapeCsv('in_stock'),
            escapeCsv('used'),
            escapeCsv(price),
            escapeCsv('EUR'),
            escapeCsv(vehicleUrl),
            escapeCsv(primaryImg),
            escapeCsv(v.brand),
            escapeCsv(v.brand),
            escapeCsv(v.model),
            escapeCsv(v.year || ''),
            escapeCsv(v.mileage_km || 0),
            escapeCsv('KM'),
            escapeCsv(v.transmission || 'automatic'),
            escapeCsv(v.body_type || 'other'),
            escapeCsv(v.fuel_type || 'other'),
            escapeCsv(v.vin || ''),
            escapeCsv(phone)
          ].join(','));
        }

        const csvContent = rows.join('\r\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'public, max-age=300'
        });
        return res.end(csvContent);
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 3. GET /api/vehicles - Listare publică vehicule din stoc (Read-Only, Sanitizat Fără raw_data)
    if (req.method === 'GET' && pathname === '/api/vehicles') {
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      if ((tenant.status === 'pending_approval' || (tenant.status === 'pending' && !tenant.is_active)) && !isAuthorizedSuperAdmin(req)) {
        return sendJson(res, 200, {
          success: true,
          count: 0,
          dealer: tenant.slug,
          vehicles: [],
          pending_approval: true,
          message: 'Showroom-ul este în curs de aprobare și activare de către echipa ParcOS.'
        });
      }
      const rows = await getAllPublicVehicles(tenant.slug);
      return sendJson(res, 200, {
        success: true,
        count: rows.length,
        dealer: tenant.slug,
        vehicles: rows,
      });
    }

    // 3.1 GET /api/vehicles/:id - Detalii publice vehicul (Read-Only, Sanitizat Fără raw_data)
    if (req.method === 'GET' && pathname.startsWith('/api/vehicles/')) {
      const id = decodeURIComponent(pathname.replace('/api/vehicles/', '')).trim();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      const vehicle = await getPublicVehicleById(safeId, tenant.slug);
      if (!vehicle) {
        return sendJson(res, 404, { success: false, error: 'Vehiculul nu a fost găsit' });
      }
      return sendJson(res, 200, { success: true, vehicle });
    }

    // 4. POST /api/vehicles - Creare sau Actualizare (Upsert) vehicul [STRICT ADMIN]
    if (req.method === 'POST' && pathname === '/api/vehicles') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Modificarea parcului auto necesită autentificare ca Administrator.',
        });
      }

      const rawBody = await readRequestBody(req, 10 * 1024 * 1024);
      let vehicleData;
      try {
        vehicleData = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }

      if (!vehicleData || typeof vehicleData !== 'object') {
        return sendJson(res, 400, { success: false, error: 'Payload-ul trebuie să fie un obiect valid' });
      }

      // Validare și sanitizare ID
      if (!vehicleData.id || typeof vehicleData.id !== 'string') {
        return sendJson(res, 400, { success: false, error: 'Câmpul id este obligatoriu' });
      }
      const safeId = vehicleData.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (safeId.length < 3 || safeId.length > 100) {
        return sendJson(res, 400, { success: false, error: 'ID-ul vehiculului este invalid (trebuie să conțină între 3 și 100 de caractere sigure)' });
      }
      vehicleData.id = safeId;

      if (!vehicleData.brand || !vehicleData.model) {
        return sendJson(res, 400, {
          success: false,
          error: 'Câmpurile id, brand și model sunt obligatorii',
        });
      }

      // Sanitizare câmpuri text & numerice
      vehicleData.brand = String(vehicleData.brand).trim().slice(0, 80);
      vehicleData.model = String(vehicleData.model).trim().slice(0, 80);
      const rawPrice = vehicleData.priceEur !== undefined ? vehicleData.priceEur : vehicleData.price_eur;
      vehicleData.priceEur = Math.max(0, Number(rawPrice) || 0);
      const rawYear = vehicleData.year;
      vehicleData.year = Math.min(2035, Math.max(1970, Number(rawYear) || new Date().getFullYear()));
      const rawMileage = vehicleData.mileageKm !== undefined ? vehicleData.mileageKm : vehicleData.mileage_km;
      vehicleData.mileageKm = Math.max(0, Number(rawMileage) || 0);

      // Invariantă fiscală absolută Carvana SRL: Strict TVA 21%
      vehicleData.vatRate = 0.21;

      // Sanitizare imagini: prevenire injectare scheme nesigure (javascript:, etc.)
      if (Array.isArray(vehicleData.images)) {
        vehicleData.images = vehicleData.images
          .filter(img => typeof img === 'string' && img.length < 1000)
          .filter(img => !img.toLowerCase().startsWith('javascript:') && !img.toLowerCase().startsWith('vbscript:'))
          .slice(0, 60);
      } else {
        vehicleData.images = [];
      }

      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      const isSuperAdmin = isAuthorizedSuperAdmin(req);
      const targetSlug = isSuperAdmin
        ? (vehicleData.dealerSlug || vehicleData.dealer_slug || tenant.slug)
        : tenant.slug;

      // 🛡️ Prevenire suprascriere sau coliziune cross-tenant:
      // Dacă vehiculul există deja în DB dar aparține altui dealer, blocăm operațiunea pentru non-superadmin
      if (!isSuperAdmin && vehicleData.id) {
        const existingAnyDealer = await getPublicVehicleById(vehicleData.id).catch(() => null);
        if (existingAnyDealer && existingAnyDealer.dealer_slug && String(existingAnyDealer.dealer_slug).toLowerCase() !== String(tenant.slug).toLowerCase()) {
          return sendJson(res, 403, {
            success: false,
            error: 'Acces interzis. Identificatorul vehiculului aparține altui showroom și nu poate fi modificat.'
          });
        }
      }

      // 🛡️ Alocator Cote Stoc: Verificare dacă dealerul depășește cota de vehicule active (Ticket 02)
      // Doar dacă este mașină NOUĂ (nu editare) și nu are status 'sold'
      const existingVehicle = await getPublicVehicleById(vehicleData.id, targetSlug).catch(() => null);
      if (!existingVehicle && vehicleData.status !== 'sold') {
        const dealerProfile = await getDealerBySlug(targetSlug, true).catch(() => null);
        const quota = Number(dealerProfile?.max_vehicles_quota || dealerProfile?.maxVehiclesQuota || 25);
        const isEnterprise = dealerProfile?.tier === 'enterprise' || quota >= 999;
        
        if (!isEnterprise) {
          const currentVehicles = await getAllPublicVehicles(targetSlug).catch(() => []);
          const activeCount = currentVehicles.filter(v => v.status !== 'sold').length;
          if (activeCount >= quota) {
            return sendJson(res, 403, {
              success: false,
              quotaExceeded: true,
              activeCount,
              quota,
              error: `Cotă de stoc atinsă (${activeCount}/${quota} vehicule active). Pentru a adăuga mai multe vehicule, contactați echipa ParcOS pentru upgrade de pachet.`
            });
          }
        }
      }

      const saved = await upsertVehicle(vehicleData, targetSlug);
      return sendJson(res, 200, {
        success: true,
        vehicle: saved,
      });
    }

    // 5. DELETE /api/vehicles/:id - Ștergere vehicul și curățare poze din disc [STRICT ADMIN]
    if (req.method === 'DELETE' && pathname.startsWith('/api/vehicles/')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Ștergerea vehiculelor necesită autentificare ca Administrator.',
        });
      }

      const id = decodeURIComponent(pathname.replace('/api/vehicles/', '')).trim();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (!safeId || safeId.length < 3) {
        return sendJson(res, 400, { success: false, error: 'ID vehicul invalid' });
      }

      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      await deleteVehicle(safeId, tenant.slug);
      await deleteCarMediaFromDisk(safeId);
      return sendJson(res, 200, { success: true, deletedId: safeId });
    }

    // 5.1 POST /api/vehicles/:id/olx-link & POST /api/admin/vehicles/:id/olx-link - Actualizare automată link OLX (Extension / Sync)
    const olxLinkMatch = pathname.match(/^\/api\/(?:admin\/)?vehicles\/([^/]+)\/olx-link$/);
    if (req.method === 'POST' && olxLinkMatch) {
      const rawCarId = decodeURIComponent(olxLinkMatch[1]).trim();
      const safeCarId = rawCarId.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant)) return sendUnconfiguredShowroom(res);
      const isSuper = isAuthorizedSuperAdmin(req);
      const isAdmin = await isAuthorizedAdmin(req, urlObj);

      const rawBody = await readRequestBody(req, 1024 * 64);
      let payload = {};
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }

      // Permitem autentificare fie prin sesiune admin clasică, fie prin secret API / adminToken inclus în body de extensie
      const bodyToken = payload?.adminToken || payload?.token || '';
      const isBodyTokenValid = bodyToken && (
        isValidSessionToken(bodyToken, tenant.slug) || 
        bodyToken === ADMIN_API_KEY || 
        bodyToken === SUPERADMIN_MASTER_KEY
      );

      if (!isAdmin && !isSuper && !isBodyTokenValid) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces neautorizat. Salvarea linkului OLX necesită autentificare de administrator.'
        });
      }

      const { olxUrl, olxId, olxStatus = 'active' } = payload;
      if (!olxUrl || typeof olxUrl !== 'string' || !olxUrl.includes('olx.ro')) {
        return sendJson(res, 400, {
          success: false,
          error: 'Link-ul OLX este invalid sau nu aparține domeniului olx.ro'
        });
      }

      const updated = await updateVehicleOlxLink(
        safeCarId,
        { olxUrl, olxId, olxStatus },
        tenant.slug
      );

      if (!updated) {
        return sendJson(res, 404, {
          success: false,
          error: `Vehiculul cu ID-ul ${safeCarId} nu a fost găsit în stoc.`
        });
      }

      console.log(`🔗 [OLX Sync Engine] Link OLX actualizat cu succes pentru ${safeCarId}: ${olxUrl} (status: ${updated.olxStatus})`);

      return sendJson(res, 200, {
        success: true,
        message: 'Link-ul OLX a fost actualizat cu succes.',
        data: updated
      });
    }

    // 5.5 POST /api/media/presign-upload - Generare Presigned PUT URLs pentru Cloudflare R2 [STRICT ADMIN]
    if (req.method === 'POST' && (pathname === '/api/media/presign-upload' || pathname === '/rxm/api/media/presign-upload')) {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Generarea de URL-uri semnate necesită autentificare ca Administrator.',
        });
      }

      const rawBody = await readRequestBody(req, 1024 * 1024); // max 1MB
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }

      const tenant = await resolveTenant(req, urlObj);
      if (isUnconfiguredTenant(tenant) && !payload.tenantSlug) return sendUnconfiguredShowroom(res);
      const tenantSlug = String(payload.tenantSlug || tenant.slug || 'rxm').trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
      const mediaType = ['car', 'branding', 'landing'].includes(payload.mediaType) ? payload.mediaType : 'car';
      const carId = payload.carId ? String(payload.carId).trim().replace(/[^a-zA-Z0-9_-]/g, '_') : undefined;

      const rawFiles = Array.isArray(payload.files) ? payload.files : (payload.file ? [payload.file] : []);
      if (rawFiles.length === 0) {
        return sendJson(res, 400, {
          success: false,
          error: 'Lista de fișiere este obligatorie (files[] sau file)',
        });
      }

      const allowedMimes = [
        'image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'image/avif', 'image/svg+xml',
        'video/mp4', 'video/webm',
        'application/pdf'
      ];

      const filesToSign = rawFiles.slice(0, 50); // limită max 50 fișiere per request
      const results = [];

      for (const item of filesToSign) {
        const rawFilename = String(item.filename || `file_${Date.now()}`);
        const contentType = String(item.contentType || 'image/webp').toLowerCase().trim();

        if (!allowedMimes.includes(contentType)) {
          return sendJson(res, 400, {
            success: false,
            error: `Tip de fișier nepermis: ${contentType}`,
          });
        }

        const presignRes = await createPresignedUploadUrl({
          tenantSlug,
          mediaType,
          carId,
          filename: rawFilename,
          contentType,
          expiresInSeconds: 600, // 10 min
        });

        if (!presignRes) {
          // Cloudflare R2 nu este configurat sau a eșuat inițializarea
          return sendJson(res, 200, {
            success: false,
            fallbackToVps: true,
            message: 'Stocarea Cloudflare R2 nu este configurată sau a eșuat. Se recomandă fallback pe /api/upload.',
          });
        }

        results.push({
          filename: rawFilename,
          uploadUrl: presignRes.uploadUrl,
          publicUrl: presignRes.publicUrl,
          key: presignRes.key,
        });
      }

      return sendJson(res, 200, {
        success: true,
        tenant: tenantSlug,
        mediaType,
        results,
      });
    }

    // 6. POST /api/upload - Upload fotografie direct pe disc [STRICT ADMIN]
    if (req.method === 'POST' && pathname === '/api/upload') {
      if (!(await isAuthorizedAdmin(req, urlObj))) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Încărcarea de fotografii necesită autentificare ca Administrator.',
        });
      }

      const rawBody = await readRequestBody(req, 20 * 1024 * 1024); // max 20MB
      const contentType = req.headers['content-type'] || '';
      const allowedExts = ['webp', 'jpg', 'jpeg', 'png', 'avif'];

      if (contentType.includes('application/json')) {
        let payload;
        try {
          payload = JSON.parse(rawBody.toString('utf8'));
        } catch {
          return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
        }

        const { carId, dataUrl, index } = payload;
        if (!carId || !dataUrl) {
          return sendJson(res, 400, {
            success: false,
            error: 'Parametrii carId și dataUrl sunt obligatorii',
          });
        }

        const safeCarId = String(carId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const publicUrl = await saveCarImageDataUrl(safeCarId, dataUrl, Math.max(0, Number(index) || 0));
        return sendJson(res, 200, {
          success: true,
          url: publicUrl,
        });
      } else {
        // Binary buffer direct
        const rawCarId = req.headers['x-car-id'] || 'temp_car';
        const safeCarId = String(rawCarId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const index = Math.max(0, Number(req.headers['x-image-index']) || 0);
        let ext = String(req.headers['x-file-ext'] || 'webp').toLowerCase().replace('.', '').trim();

        if (!allowedExts.includes(ext)) {
          ext = 'webp';
        }

        const publicUrl = await saveCarImageToDisk(safeCarId, rawBody, index, ext);
        return sendJson(res, 200, {
          success: true,
          url: publicUrl,
        });
      }
    }

    // 7. GET & HEAD /cars/... sau /rxm/cars/... - Servire imagine din disc (Read-Only cu căutare ierarhică multi-locație)
    if ((req.method === 'GET' || req.method === 'HEAD') && (pathname.startsWith('/cars/') || pathname.startsWith('/rxm/cars/'))) {
      const cleanPath = pathname.replace(/^\/(?:rxm\/)?cars\//, '');
      const safeRelativePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');

      // Lista ordonată de directoare candidate pentru rezolvarea imaginii:
      // 1. Storage dinamic configurat pe VPS (MEDIA_STORAGE_PATH, ex: /data/parcos/cars sau /data/rxm-showroom/cars)
      // 2. Directoare gazdă alternative cunoscute pe Netcup VPS
      // 3. Bundle-ul dist/cars din producție Vite
      // 4. Directorul public/cars din rădăcina proiectului
      // 5. Căi alternative cu prefixul /rxm
      const candidateRoots = [
        process.env.MEDIA_STORAGE_PATH,
        '/data/parcos/cars',
        '/data/rxm-showroom/cars',
        path.join(process.cwd(), 'dist', 'cars'),
        path.join(process.cwd(), 'public', 'cars'),
        path.join(process.cwd(), 'dist', 'rxm', 'cars'),
        path.join(process.cwd(), 'public', 'rxm', 'cars'),
      ].filter(Boolean);

      let foundPath = null;
      for (const rootDir of candidateRoots) {
        try {
          const resolvedRoot = path.resolve(rootDir);
          const candidatePath = path.join(resolvedRoot, safeRelativePath);
          // Verificare strictă anti-path-traversal
          if (candidatePath.startsWith(resolvedRoot) && fs.existsSync(candidatePath)) {
            const stat = fs.statSync(candidatePath);
            if (stat.isFile()) {
              foundPath = candidatePath;
              break;
            }
          }
        } catch {
          // Ignoră erorile pe căile inexistente
        }
      }

      if (foundPath) {
        const stat = fs.statSync(foundPath);
        const ext = path.extname(foundPath).toLowerCase();
        const mimeTypes = {
          '.webp': 'image/webp',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.avif': 'image/avif',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
        const lastModified = stat.mtime.toUTCString();

        // 🛡️ Failsafe 304 Not Modified: Dacă browserul are deja versiunea curentă, răspunde instantaneu
        if (req.headers['if-none-match'] === etag || req.headers['if-modified-since'] === lastModified) {
          res.writeHead(304, {
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'ETag': etag,
            'Last-Modified': lastModified,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Vary': 'Origin',
          });
          return res.end();
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'ETag': etag,
          'Last-Modified': lastModified,
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Vary': 'Origin',
        });
        if (req.method === 'HEAD') return res.end();
        const stream = fs.createReadStream(foundPath);
        return stream.pipe(res);
      }
      return sendJson(res, 404, { success: false, error: 'Imaginea nu a fost găsită' });
    }

    // 🌐 Servire fișiere statice din bundle-ul de producție (dist/) și public/ pentru Coolify / Docker Unificat
    const DIST_DIR = path.resolve('dist');
    const PUBLIC_DIR = path.resolve('public');
    if ((fs.existsSync(DIST_DIR) || fs.existsSync(PUBLIC_DIR)) && (req.method === 'GET' || req.method === 'HEAD') && !pathname.startsWith('/api/')) {
      const rawHost = (req.headers['x-forwarded-host'] || req.headers['host'] || '').split(',')[0].split(':')[0].toLowerCase().trim().replace(/^www\./, '');
      const isParcosHost = rawHost === 'parcos.ro' || rawHost === 'parcos.local' || rawHost.includes('parcos');
      const isRxmHost = rawHost.includes('rxmautomobile.ro') || (!isParcosHost && (rawHost === 'localhost' || rawHost === '127.0.0.1'));

      // 🗺️ Sitemap Dinamic diferențiat per domeniu (parcos.ro vs rxmautomobile.ro)
      if (pathname === '/sitemap.xml') {
        if (isParcosHost) {
          const parcosSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://parcos.ro/</loc><lastmod>2026-10-25</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>https://parcos.ro/termeni-si-conditii</loc><lastmod>2026-10-25</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://parcos.ro/politica-de-confidentialitate</loc><lastmod>2026-10-25</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://parcos.ro/politica-de-cookies</loc><lastmod>2026-10-25</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;
          res.writeHead(200, {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff'
          });
          if (req.method === 'HEAD') return res.end();
          return res.end(parcosSitemap);
        }
      }

      const sanitizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      let potentialFile = path.join(DIST_DIR, sanitizedPath);

      // 🛡️ Multi-Tenant Favicon & Root Branding Isolation:
      // Dacă cererea vine de pe rxmautomobile.ro (sau alt showroom de dealer) și cere un favicon direct la rădăcină (/favicon.ico, /favicon.svg etc.)
      const cleanPathForBranding = sanitizedPath.replace(/^[\\\/]+/, '');
      const isRootBrandingFile = /^(?:favicon[^\/\\]*|apple-touch-icon[^\/\\]*|site\.webmanifest)$/i.test(cleanPathForBranding);
      if (isRootBrandingFile && !isParcosHost) {
        const tenantFolder = isRxmHost ? 'rxm' : 'rxm';
        const tenantDistFile = path.join(DIST_DIR, tenantFolder, cleanPathForBranding);
        const tenantPublicFile = path.join(PUBLIC_DIR, tenantFolder, cleanPathForBranding);
        if (fs.existsSync(tenantDistFile) && fs.statSync(tenantDistFile).isFile()) {
          potentialFile = tenantDistFile;
        } else if (fs.existsSync(tenantPublicFile) && fs.statSync(tenantPublicFile).isFile()) {
          potentialFile = tenantPublicFile;
        }
      } else {
        if (!fs.existsSync(potentialFile) || !fs.statSync(potentialFile).isFile()) {
          const altPublicFile = path.join(PUBLIC_DIR, sanitizedPath);
          if (fs.existsSync(altPublicFile) && fs.statSync(altPublicFile).isFile()) {
            potentialFile = altPublicFile;
          }
        }
      }

      // Verificare anti-traversal
      const isUnderDist = DIST_DIR && potentialFile.startsWith(DIST_DIR);
      const isUnderPublic = PUBLIC_DIR && potentialFile.startsWith(PUBLIC_DIR);
      if ((isUnderDist || isUnderPublic) && fs.existsSync(potentialFile) && fs.statSync(potentialFile).isFile()) {
        const ext = path.extname(potentialFile).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.mjs': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
          '.txt': 'text/plain; charset=utf-8',
          '.xml': 'application/xml; charset=utf-8',
          '.zip': 'application/zip',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const isHtml = ext === '.html';

        if (isHtml) {
          return await serveHtmlWithDynamicMeta(req, res, potentialFile, urlObj);
        }

        const isDownload = pathname.startsWith('/downloads/') || ext === '.zip';
        const cacheControl = isDownload 
          ? 'public, max-age=60, must-revalidate' 
          : 'public, max-age=31536000, immutable';

        const headers = {
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
        };
        if (isDownload) {
          headers['Content-Disposition'] = `attachment; filename="${path.basename(potentialFile)}"`;
        }
        res.writeHead(200, headers);
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(potentialFile).pipe(res);
      }

      // Protecție Asset-uri Statice & Dotfiles:
      // Dacă cererea este pentru un dotfile sau fișier/asset static inexistent (/assets/* sau extensie de fișier),
      // returnăm strict 404 Not Found (NU cădem pe index.html, prevenind soft-404).
      const isDotfile = /^\/\./.test(pathname);
      if (isDotfile) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        return res.end(JSON.stringify({ success: false, error: 'Not found' }));
      }

      const isStaticAsset = pathname.startsWith('/assets/') || 
                            pathname.startsWith('/static/') || 
                            /\.[a-zA-Z0-9]{2,8}$/.test(pathname);

      if (isStaticAsset) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        return res.end(JSON.stringify({ success: false, error: 'Asset static inexistent' }));
      }

      // SPA Fallback: dacă nu este fișier static și nu e rută de API, servim dist/index.html cu meta tag-uri SSR dinamice
      const indexHtmlPath = fs.existsSync(path.join(DIST_DIR, 'index.html'))
        ? path.join(DIST_DIR, 'index.html')
        : (fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))
          ? path.join(PUBLIC_DIR, 'index.html')
          : path.resolve('index.html'));

      if (fs.existsSync(indexHtmlPath)) {
        return await serveHtmlWithDynamicMeta(req, res, indexHtmlPath, urlObj);
      }
    }

    // Rută inexistentă
    return sendJson(res, 404, { success: false, error: 'Endpoint inexistent' });
  } catch (err) {
    console.error(`[API Error] ${req.method} ${req.url}:`, err);
    return sendJson(res, 500, {
      success: false,
      error: 'Eroare internă de server',
      message: err.message,
    });
  }
});

async function syncSeedCarsToMediaStorage() {
  const targetRoot = process.env.MEDIA_STORAGE_PATH;
  if (!targetRoot) return;

  const candidateSources = [
    path.join(process.cwd(), 'dist', 'cars'),
    path.join(process.cwd(), 'public', 'cars'),
  ];

  let sourceDir = null;
  for (const s of candidateSources) {
    if (fs.existsSync(s)) {
      sourceDir = s;
      break;
    }
  }

  if (!sourceDir) return;

  try {
    const resolvedTarget = path.resolve(targetRoot);
    if (!fs.existsSync(resolvedTarget)) {
      fs.mkdirSync(resolvedTarget, { recursive: true });
    }

    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    let copiedDirs = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const srcSub = path.join(sourceDir, entry.name);
        const dstSub = path.join(resolvedTarget, entry.name);
        if (!fs.existsSync(dstSub)) {
          await fs.promises.cp(srcSub, dstSub, { recursive: true });
          copiedDirs++;
        }
      }
    }
    if (copiedDirs > 0) {
      console.log(`✅ [MediaStorageSync] Sincronizate ${copiedDirs} directoare foto seed în ${resolvedTarget}`);
    }
  } catch (err) {
    console.warn('⚠️ [MediaStorageSync] Notă sincronizare imagini seed:', err.message);
  }
}

const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('api.mjs')
);

if (isDirectRun || process.env.AUTO_START_SERVER === 'true') {
  initDatabase()
    .then(() => {
      console.log('✅ [Database] PostgreSQL inițializat cu succes.');
    })
    .catch((err) => {
      console.error('⚠️ [RXM/ParcOS Micro-API] Avertisment la inițializarea bazei de date (continuăm în mod fallback):', err.message);
    })
    .finally(() => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 [RXM/ParcOS Micro-API] Running on port ${PORT} (Dealer: ${DEALER_SLUG}) [Auth: ENABLED]`);
        syncSeedCarsToMediaStorage().catch(() => {});
      });
    });
}

export { renderDynamicHtml };
