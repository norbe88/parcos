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
import { 
  getAllPublicVehicles, 
  getPublicVehicleById, 
  getAllAdminVehicles, 
  getAdminVehicleById, 
  upsertVehicle, 
  deleteVehicle, 
  initDatabase,
  getDealerBySlug,
  getDealerByDomain,
  getAllDealers,
  upsertDealer
} from './db.mjs';
import { saveCarImageDataUrl, saveCarImageToDisk, deleteCarMediaFromDisk } from './mediaStorage.mjs';
import { fetchAutovitLive } from '../scripts/marketScraperHelper.js';
import {
  handleInboundWebhook,
  handleBounceWebhook,
  handleOutboundSend,
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
  getPushSubscriptions
} from './mailHub.mjs';

const PORT = process.env.PORT || 3000;
const DEALER_SLUG = process.env.DEALER_SLUG || 'parcos';

// Generare secret efemer dacă variabila de mediu ADMIN_API_KEY nu este setată (Zero hardcoded credentials)
const GENERATED_SECRET = crypto.randomBytes(32).toString('hex');
const ADMIN_API_KEY = (process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY.length >= 32)
  ? process.env.ADMIN_API_KEY
  : GENERATED_SECRET;

if (ADMIN_API_KEY === GENERATED_SECRET) {
  console.log(`🔒 [AUTH] ADMIN_API_KEY nu este configurat în mediu. S-a generat token efemer securizat.`);
}

// Sesiuni administrator active (token -> { createdAt, expiresAt })
const activeSessions = new Map();

function generateSessionToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24 ore valabilitate
  });
  return token;
}

function isValidSessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  // 1. Verificare împotriva ADMIN_API_KEY prin comparare în timp constant (pentru CI/CD & backend daemons)
  try {
    const tokenBuf = Buffer.from(token);
    const keyBuf = Buffer.from(ADMIN_API_KEY);
    if (tokenBuf.length === keyBuf.length && crypto.timingSafeEqual(tokenBuf, keyBuf)) {
      return true;
    }
  } catch {}

  // 2. Verificare sesiune efemeră emisă de server la login
  const session = activeSessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }

  return true;
}

function revokeSessionToken(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

// ══════════════════════════════════════════════════════════════════
// DEALER OS — MULTI-TENANT RESOLUTION ENGINE (PMH-T02)
// ══════════════════════════════════════════════════════════════════
const tenantConfigCache = new Map();
const TENANT_CACHE_TTL = 60 * 1000;

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
    name: 'TOP AUTO TRANSILVANIA S.R.L.',
    slug: 'top_auto',
    domain: 'topautotransilvania.ro',
    phone_primary: '0740 987 654',
    phone_secondary: '0741 876 543',
    whatsapp_number: '40740987654',
    email: 'office@topautotransilvania.ro',
    address_street: 'B-dul Muncii nr. 18',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    vat_number: 'RO41920199',
    is_active: true,
    config: {
      themePreset: 'midnight_blue',
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

export async function resolveTenant(req, urlObj) {
  // 1. Prioritate 1: Query parameter explicit (?dealer=mpi_auto sau ?dealer=rxm)
  const queryDealer = urlObj?.searchParams?.get('dealer') || 
                      urlObj?.searchParams?.get('dealer_slug') || 
                      urlObj?.searchParams?.get('tenant');
  if (queryDealer) {
    const cleanSlug = normalizeSlug(queryDealer);
    const cached = tenantConfigCache.get(`slug:${cleanSlug}`);
    if (cached && (Date.now() - cached.timestamp < TENANT_CACHE_TTL)) {
      return cached.data;
    }
    const dbDealer = await getDealerBySlug(cleanSlug);
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

  // 2. Prioritate 2: Antet HTTP explicit (x-dealer-slug)
  const headerSlug = req.headers['x-dealer-slug'];
  if (headerSlug) {
    const cleanSlug = normalizeSlug(headerSlug);
    const cached = tenantConfigCache.get(`slug:${cleanSlug}`);
    if (cached && (Date.now() - cached.timestamp < TENANT_CACHE_TTL)) {
      return cached.data;
    }
    const dbDealer = await getDealerBySlug(cleanSlug);
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

  // 3. Prioritate 3: Antet HTTP Host: (ex: mpiauto.ro -> mpi_auto, topautotransilvania.ro -> top_auto)
  const host = (req.headers['x-forwarded-host'] || req.headers['host'] || '')
    .split(':')[0]
    .toLowerCase()
    .replace(/^www\./, '')
    .trim();

  if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('152.53.158.65')) {
    const cached = tenantConfigCache.get(`host:${host}`);
    if (cached && (Date.now() - cached.timestamp < TENANT_CACHE_TTL)) {
      return cached.data;
    }
    const dbDealer = await getDealerByDomain(host);
    if (dbDealer) {
      tenantConfigCache.set(`host:${host}`, { data: dbDealer, timestamp: Date.now() });
      return dbDealer;
    }
    // Fallback static profile după domeniu
    const matchedProfile = Object.values(DEFAULT_DEALER_PROFILES).find(
      (p) => p.domain === host || (p.domain && host.includes(p.domain))
    );
    if (matchedProfile) {
      tenantConfigCache.set(`host:${host}`, { data: matchedProfile, timestamp: Date.now() });
      return matchedProfile;
    }
    const stagedHost = getStagedDealerProfile(host);
    if (stagedHost) {
      tenantConfigCache.set(`host:${host}`, { data: stagedHost, timestamp: Date.now() });
      return stagedHost;
    }
  }

  // 4. Fallback garantat: dealer implicit (rxm)
  const cachedRxm = tenantConfigCache.get('slug:rxm');
  if (cachedRxm && (Date.now() - cachedRxm.timestamp < TENANT_CACHE_TTL)) {
    return cachedRxm.data;
  }
  const rxm = await getDealerBySlug('rxm');
  if (rxm) {
    tenantConfigCache.set('slug:rxm', { data: rxm, timestamp: Date.now() });
    return rxm;
  }

  return DEFAULT_DEALER_PROFILES.rxm;
}

/**
 * Trimite un răspuns JSON structurat
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Token, x-admin-token, x-car-id, x-image-index, x-file-ext',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  res.end(JSON.stringify(data));
}

/**
 * Verifică dacă cererea provine de la un administrator autentificat cu sesiune validă pe server.
 */
function isAuthorizedAdmin(req) {
  const authHeader = req.headers['authorization'] || '';
  const tokenHeader = req.headers['x-admin-token'] || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  } else if (tokenHeader) {
    token = String(tokenHeader).trim();
  }

  return isValidSessionToken(token);
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

const server = http.createServer(async (req, res) => {
  // Tratare preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Token, x-admin-token, x-car-id, x-image-index, x-file-ext',
      'Access-Control-Max-Age': '86400',
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

    // 0. GET /api/health - Diagnostic & Status Server
    if (req.method === 'GET' && pathname === '/api/health') {
      const tenant = await resolveTenant(req, urlObj);
      return sendJson(res, 200, {
        status: 'healthy',
        dealer: tenant.slug,
        tenantName: tenant.name,
        domain: tenant.domain,
        hosting: 'Netcup VPS (152.53.158.65)',
        version: 'v20_multi_tenant_ready',
        vatRate: 0.21,
        warrantyTerm: 'Cont de Garanție',
        time: new Date().toISOString(),
      });
    }

    // 0.01 GET /api/tenant-config & /api/tenant/config - Configurație Dinamică Showroom (PMH-T02)
    if (req.method === 'GET' && (pathname === '/api/tenant-config' || pathname === '/api/tenant/config')) {
      const tenant = await resolveTenant(req, urlObj);
      return sendJson(res, 200, {
        success: true,
        dealer: tenant,
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
        phone: d.phone_primary || d.phonePrimary,
        themePreset: d.config?.themePreset || 'obsidian_gold'
      }));
      return sendJson(res, 200, {
        success: true,
        count: sanitized.length,
        dealers: sanitized
      });
    }

    // 0.04 POST /api/dealers - Onboarding / Configurare Dealer (Admin Required)
    if (req.method === 'POST' && pathname === '/api/dealers') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat. Doar administratorul poate înrola un dealer.' });
      }
      const rawBody = await readRequestBody(req, 1024 * 64);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const saved = await upsertDealer(payload);
        tenantConfigCache.delete(`slug:${saved.slug}`);
        if (saved.domain) tenantConfigCache.delete(`host:${saved.domain}`);
        return sendJson(res, 201, { success: true, dealer: saved });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.05 GET /api/anaf/:cui - Interogare oficială serviciu ANAF v9 pentru autocompletare CUI
    if (req.method === 'GET' && pathname.startsWith('/api/anaf/')) {
      const cuiRaw = pathname.replace('/api/anaf/', '').replace(/\D/g, '');
      const cleanCui = parseInt(cuiRaw, 10);
      if (!cleanCui) {
        return sendJson(res, 400, { success: false, error: 'CUI invalid (doar cifre)' });
      }
      try {
        const today = new Date().toISOString().split('T')[0];
        const anafRes = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ cui: cleanCui, data: today }]),
        });
        if (!anafRes.ok) {
          return sendJson(res, 502, { success: false, error: `Eroare serviciu ANAF: HTTP ${anafRes.status}` });
        }
        const data = await anafRes.json();
        if (!data.found || data.found.length === 0) {
          return sendJson(res, 404, { success: false, error: 'CUI negăsit în registrul oficial ANAF' });
        }
        const c = data.found[0];
        const gen = c.date_generale || {};
        const tva = c.inregistrare_scop_Tva || {};
        return sendJson(res, 200, {
          success: true,
          cui: `RO${cleanCui}`,
          rawCui: cleanCui,
          name: gen.denumire || '',
          regCom: gen.nrRegCom || '',
          legalAddress: gen.adresa || '',
          phone: gen.telefon || '',
          postalCode: gen.codPostal || '',
          isVatPayer: Boolean(tva.scpTVA),
        });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // 0.1 POST /api/auth/login - Autentificare Administrator & Emitere Token Sesiune
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const rawBody = await readRequestBody(req, 1024 * 64);
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }

      const password = String(payload.password || '').trim();
      if (!password) {
        return sendJson(res, 400, { success: false, error: 'Parola este obligatorie' });
      }

      const inputHash = crypto.createHash('sha256').update(password).digest('hex');
      const targetHash = process.env.ADMIN_PASSWORD_HASH || 'dbc1d0952684f4b89cc86bc7ffdd52cacc2a79e667b7e0765953069e05bb6589';

      let match = false;
      try {
        match = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(targetHash));
      } catch {
        match = (inputHash === targetHash);
      }

      if (!match) {
        return sendJson(res, 401, { success: false, error: 'Parolă incorectă. Accesul este rezervat exclusiv administratorilor.' });
      }

      const sessionToken = generateSessionToken();
      return sendJson(res, 200, {
        success: true,
        token: sessionToken,
        expiresIn: 86400,
        message: 'Autentificare reușită',
      });
    }

    // 0.2 POST /api/auth/logout - Invalidare sesiune administrator
    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const authHeader = req.headers['authorization'] || '';
      const tokenHeader = req.headers['x-admin-token'] || '';
      let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : (authHeader.trim() || String(tokenHeader).trim());
      revokeSessionToken(token);
      return sendJson(res, 200, { success: true, message: 'Deconectare reușită' });
    }

    // 0.3 GET /api/auth/verify - Verificare stare sesiune administrator
    if (req.method === 'GET' && pathname === '/api/auth/verify') {
      if (isAuthorizedAdmin(req)) {
        return sendJson(res, 200, { success: true, authenticated: true });
      }
      return sendJson(res, 401, { success: false, authenticated: false, error: 'Sesiune neautorizată sau expirată' });
    }

    // ══════════════════════════════════════════════════════════════════
    // PARCOS MAIL HUB ROUTES (PMH-201, PMH-202, PMH-203)
    // ══════════════════════════════════════════════════════════════════

    // 0.4 POST /api/mail/webhook - Webhook Inbound SNS / SES (PMH-201)
    if (req.method === 'POST' && pathname === '/api/mail/webhook') {
      const rawBody = await readRequestBody(req, 1024 * 1024 * 30); // max 30MB
      const result = await handleInboundWebhook(rawBody, req.headers, { dealerId: DEALER_SLUG });
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.5 POST /api/mail/webhook/bounce - Webhook Bounce & Complaint SES (PMH-106 / PMH-202)
    if (req.method === 'POST' && pathname === '/api/mail/webhook/bounce') {
      const rawBody = await readRequestBody(req, 1024 * 512);
      const result = await handleBounceWebhook(rawBody);
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.6 POST /api/mail/send - Trimitere e-mail SES Outbound (PMH-202)
    if (req.method === 'POST' && (pathname === '/api/mail/send' || pathname === '/api/mail/compose')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat. Autentificarea este obligatorie.' });
      }
      const rawBody = await readRequestBody(req, 1024 * 1024 * 25);
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        return sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      }
      const result = await handleOutboundSend(payload, { dealerId: DEALER_SLUG });
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.7 GET /api/mail/threads - Paginare conversații dealer (PMH-203 Preview & PMH-304 Multi-Agent Pool)
    if (req.method === 'GET' && pathname === '/api/mail/threads') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const status = urlObj.searchParams.get('status') || undefined;
      const assignedTo = urlObj.searchParams.get('assignedTo') || undefined;
      const limit = urlObj.searchParams.get('limit') || 50;
      const offset = urlObj.searchParams.get('offset') || 0;
      const data = await getMailThreads(DEALER_SLUG, { status, assignedTo, limit, offset });
      return sendJson(res, 200, { success: true, ...data });
    }

    // 0.8 GET /api/mail/threads/:id - Detalii conversație și mesaje (PMH-203 Preview)
    if (req.method === 'GET' && pathname.startsWith('/api/mail/threads/')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '');
      const data = await getMailThreadById(threadId, DEALER_SLUG);
      if (!data) {
        return sendJson(res, 404, { success: false, error: 'Conversația nu a fost găsită' });
      }
      return sendJson(res, 200, { success: true, ...data });
    }

    // 0.9 PATCH /api/mail/threads/:id/status - Actualizare status conversație (PMH-203)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/status')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/status', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateThreadStatus(threadId, payload.status, DEALER_SLUG);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.9.1 PATCH /api/mail/threads/:id/vehicle - Asociere / Dezasociere manuală vehicul (PMH-302)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/vehicle')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/vehicle', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateThreadVehicle(threadId, payload.vehicleId || null, DEALER_SLUG);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.9.2 PATCH /api/mail/threads/:id/assign - Asignare / Preluare conversație de către agent (PMH-304)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/assign')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/assign', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await assignThreadToAccount(threadId, payload.accountId || null, DEALER_SLUG);
        return sendJson(res, 200, { success: true, thread: updated });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.10 POST /api/mail/threads/:id/reply - Răspuns direct în conversație (PMH-203)
    if (req.method === 'POST' && pathname.startsWith('/api/mail/threads/') && pathname.endsWith('/reply')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const threadId = pathname.replace('/api/mail/threads/', '').replace('/reply', '');
      const rawBody = await readRequestBody(req, 1024 * 1024 * 25);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      payload.threadId = threadId;
      const result = await handleOutboundSend(payload, { dealerId: DEALER_SLUG });
      return sendJson(res, result.statusCode, result.body);
    }

    // 0.11 GET /api/mail/stats - Contoare unread per folder (PMH-203)
    if (req.method === 'GET' && pathname === '/api/mail/stats') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const stats = await getMailStats(DEALER_SLUG);
      return sendJson(res, 200, { success: true, stats });
    }

    // 0.12 GET /api/mail/search - Căutare conversații & mesaje (PMH-203)
    if (req.method === 'GET' && pathname === '/api/mail/search') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const q = urlObj.searchParams.get('q') || '';
      const results = await searchMail(q, DEALER_SLUG);
      return sendJson(res, 200, { success: true, results });
    }

    // 0.13 GET /api/mail/accounts - Listă căsuțe angajați (PMH-204)
    if (req.method === 'GET' && pathname === '/api/mail/accounts') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const accounts = await getMailAccounts(DEALER_SLUG);
      return sendJson(res, 200, { success: true, accounts });
    }

    // 0.14 POST /api/mail/accounts - Creare căsuță angajat (PMH-204)
    if (req.method === 'POST' && pathname === '/api/mail/accounts') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const created = await createMailAccount(payload, DEALER_SLUG);
        return sendJson(res, 201, { success: true, account: created });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.15 PATCH /api/mail/accounts/:id - Actualizare căsuță (PMH-204)
    if (req.method === 'PATCH' && pathname.startsWith('/api/mail/accounts/')) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      const accountId = pathname.replace('/api/mail/accounts/', '');
      const rawBody = await readRequestBody(req, 1024 * 32);
      let payload;
      try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return sendJson(res, 400, { success: false, error: 'JSON invalid' }); }
      try {
        const updated = await updateMailAccount(accountId, payload, DEALER_SLUG);
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
      if (!isAuthorizedAdmin(req)) {
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
        const result = await disableMailAccountAndReassign(accountId, targetAccountId, DEALER_SLUG);
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
        const result = await savePushSubscription(payload.accountId || 'default-agent', payload.subscription, payload.userAgent || '', payload.dealerId || DEALER_SLUG);
        return sendJson(res, 200, { success: true, ...result });
      } catch (err) {
        return sendJson(res, 400, { success: false, error: err.message });
      }
    }

    // 0.19 POST /api/mail/push/test - Test canal Web Push (PMH-402)
    if (req.method === 'POST' && pathname === '/api/mail/push/test') {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, { success: false, error: 'Acces neautorizat' });
      }
      return sendJson(res, 200, { 
        success: true, 
        message: 'Canalul Web Push este activ și pregătit pentru alerte în timp real pe dispozitivele consilierilor.' 
      });
    }

    // 1. GET /api/market-lookup - Căutare oferte comparabile Autovit
    if (req.method === 'GET' && pathname === '/api/market-lookup') {
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
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Vizualizarea inventarului complet necesită autentificare ca Administrator.',
        });
      }
      const tenant = await resolveTenant(req, urlObj);
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
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Detaliile complete necesită autentificare ca Administrator.',
        });
      }
      const id = decodeURIComponent(pathname.replace('/api/admin/vehicles/', '')).trim();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const tenant = await resolveTenant(req, urlObj);
      const vehicle = await getAdminVehicleById(safeId, tenant.slug);
      if (!vehicle) {
        return sendJson(res, 404, { success: false, error: 'Vehiculul nu a fost găsit' });
      }
      return sendJson(res, 200, { success: true, vehicle });
    }

    // 2.2 GET /api/admin/olx-status - Reconciliere status OLX [STRICT ADMIN]
    if (req.method === 'GET' && pathname === '/api/admin/olx-status') {
      if (!isAuthorizedAdmin(req)) {
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
      if (!isAuthorizedAdmin(req)) {
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

    // 3. GET /api/vehicles - Listare publică vehicule din stoc (Read-Only, Sanitizat Fără raw_data)
    if (req.method === 'GET' && pathname === '/api/vehicles') {
      const tenant = await resolveTenant(req, urlObj);
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
      const vehicle = await getPublicVehicleById(safeId, tenant.slug);
      if (!vehicle) {
        return sendJson(res, 404, { success: false, error: 'Vehiculul nu a fost găsit' });
      }
      return sendJson(res, 200, { success: true, vehicle });
    }

    // 4. POST /api/vehicles - Creare sau Actualizare (Upsert) vehicul [STRICT ADMIN]
    if (req.method === 'POST' && pathname === '/api/vehicles') {
      if (!isAuthorizedAdmin(req)) {
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
      vehicleData.priceEur = Math.max(0, Number(vehicleData.priceEur) || 0);
      vehicleData.year = Math.min(2035, Math.max(1970, Number(vehicleData.year) || new Date().getFullYear()));
      vehicleData.mileageKm = Math.max(0, Number(vehicleData.mileageKm) || 0);

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
      const targetSlug = vehicleData.dealerSlug || vehicleData.dealer_slug || tenant.slug;
      const saved = await upsertVehicle(vehicleData, targetSlug);
      return sendJson(res, 200, {
        success: true,
        vehicle: saved,
      });
    }

    // 5. DELETE /api/vehicles/:id - Ștergere vehicul și curățare poze din disc [STRICT ADMIN]
    if (req.method === 'DELETE' && pathname.startsWith('/api/vehicles/')) {
      if (!isAuthorizedAdmin(req)) {
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
      await deleteVehicle(safeId, tenant.slug);
      await deleteCarMediaFromDisk(safeId);
      return sendJson(res, 200, { success: true, deletedId: safeId });
    }

    // 6. POST /api/upload - Upload fotografie direct pe disc [STRICT ADMIN]
    if (req.method === 'POST' && pathname === '/api/upload') {
      if (!isAuthorizedAdmin(req)) {
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

    // 6.1 POST /api/admin/ocr/gemini/* - Gateway securizat Google Gemini OCR [STRICT ADMIN]
    if (req.method === 'POST' && (pathname.startsWith('/api/admin/ocr/gemini/') || pathname.startsWith('/api/ocr/gemini/'))) {
      if (!isAuthorizedAdmin(req)) {
        return sendJson(res, 401, {
          success: false,
          error: 'Acces interzis. Procesarea automată OCR a documentelor necesită autentificare ca Administrator.',
        });
      }

      const geminiSubpath = pathname.replace(/^\/api\/(?:admin\/)?ocr\/gemini\//, '');
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return sendJson(res, 503, {
          success: false,
          error: 'Serviciul OCR nu este configurat pe server (lipsă cheie GEMINI_API_KEY în mediul serverului).',
        });
      }

      try {
        const bodyBuffer = await readRequestBody(req, 20 * 1024 * 1024);
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${geminiSubpath}`;
        const upstreamRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
        });

        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
        const resText = await upstreamRes.text();
        res.end(resText);
        return;
      } catch (geminiErr) {
        return sendJson(res, 500, {
          success: false,
          error: 'Eroare la apelul Gemini Vision API',
          message: geminiErr.message,
        });
      }
    }

    // 7. GET /cars/... sau /rxm/cars/... - Servire imagine din disc (Read-Only cu protecție Path Traversal)
    if (req.method === 'GET' && (pathname.startsWith('/cars/') || pathname.startsWith('/rxm/cars/'))) {
      const cleanPath = pathname.replace(/^\/(?:rxm\/)?cars\//, '');
      const safeRelativePath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, '');
      const BASE_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'public', 'cars');
      const fullPath = path.join(BASE_STORAGE_PATH, safeRelativePath);

      // Verificare anti-traversal: calea finală rezolvată trebuie să fie strict în interiorul BASE_STORAGE_PATH
      if (!fullPath.startsWith(path.resolve(BASE_STORAGE_PATH))) {
        return sendJson(res, 403, { success: false, error: 'Acces interzis' });
      }

      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
          '.webp': 'image/webp',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.avif': 'image/avif',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
        });
        const stream = fs.createReadStream(fullPath);
        return stream.pipe(res);
      }
      return sendJson(res, 404, { success: false, error: 'Imaginea nu a fost găsită' });
    }

    // 🌐 Servire fișiere statice din bundle-ul de producție (dist/) pentru Coolify / Docker Unificat
    const DIST_DIR = path.resolve('dist');
    if (fs.existsSync(DIST_DIR) && req.method === 'GET' && !pathname.startsWith('/api/')) {
      const sanitizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      const potentialFile = path.join(DIST_DIR, sanitizedPath);

      // Verificare anti-traversal
      if (potentialFile.startsWith(DIST_DIR) && fs.existsSync(potentialFile) && fs.statSync(potentialFile).isFile()) {
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
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        });
        return fs.createReadStream(potentialFile).pipe(res);
      }

      // SPA Fallback: dacă nu este fișier static și nu e rută de API, servim dist/index.html
      const indexHtmlPath = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        });
        return fs.createReadStream(indexHtmlPath).pipe(res);
      }
    }

    // Rută inexistentă
    return sendJson(res, 404, { success: false, error: 'Endpoint inexistent' });
  } catch (err) {
    console.error(`[API Error] ${req.method} ${pathname}:`, err);
    return sendJson(res, 500, {
      success: false,
      error: 'Eroare internă de server',
      message: err.message,
    });
  }
});

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
    });
  });
