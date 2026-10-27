/**
 * ParcOS — ANAF CUI Lookup Routes
 * Modular Route Handler: GET /api/anaf/:cui
 */

const ANAF_RATE_LIMIT = 30; // Max 30 interogări / minut per admin
const ANAF_RATE_WINDOW = 60 * 1000;
const ANAF_CACHE_TTL = 24 * 60 * 60 * 1000; // Cache 24 ore
const anafRateMap = new Map();
const anafCache = new Map();

export async function handleAnafRoutes(req, res, urlObj, pathname, { sendJson, isAuthorizedAdmin }) {
  if (!pathname.startsWith('/api/anaf/') || req.method !== 'GET') {
    return false;
  }

  if (!(await isAuthorizedAdmin(req, urlObj))) {
    sendJson(res, 401, { success: false, error: 'Acces restricționat: Autentificare de administrator necesară pentru interogare ANAF.' });
    return true;
  }

  const cuiRaw = pathname.replace('/api/anaf/', '').replace(/\D/g, '');
  const cleanCui = parseInt(cuiRaw, 10);
  if (!cleanCui || String(cleanCui).length < 6 || String(cleanCui).length > 10) {
    sendJson(res, 400, { success: false, error: 'CUI invalid (6-10 cifre)' });
    return true;
  }

  // Rate limit per token admin (max 30 req/min)
  const adminToken = (req.headers['authorization'] || req.headers['x-admin-token'] || '').slice(0, 64);
  const rateEntry = anafRateMap.get(adminToken) || { count: 0, windowStart: Date.now() };
  if (Date.now() - rateEntry.windowStart > ANAF_RATE_WINDOW) {
    rateEntry.count = 0;
    rateEntry.windowStart = Date.now();
  }
  rateEntry.count++;
  anafRateMap.set(adminToken, rateEntry);
  if (rateEntry.count > ANAF_RATE_LIMIT) {
    sendJson(res, 429, { success: false, error: 'Limită interogări ANAF depășită. Max 30 interogări/minut.' });
    return true;
  }

  // Verificare cache 24h
  const cached = anafCache.get(cleanCui);
  if (cached && Date.now() - cached.cachedAt < ANAF_CACHE_TTL) {
    sendJson(res, 200, cached.data);
    return true;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const anafRes = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: cleanCui, data: today }]),
    });
    if (!anafRes.ok) {
      sendJson(res, 502, { success: false, error: `Eroare serviciu ANAF: HTTP ${anafRes.status}` });
      return true;
    }
    const data = await anafRes.json();
    if (!data.found || data.found.length === 0) {
      sendJson(res, 404, { success: false, error: 'CUI negăsit în registrul oficial ANAF' });
      return true;
    }
    const c = data.found[0];
    const gen = c.date_generale || {};
    const tva = c.inregistrare_scop_Tva || {};
    const payload = {
      success: true,
      cui: `RO${cleanCui}`,
      rawCui: cleanCui,
      name: gen.denumire || '',
      regCom: gen.nrRegCom || '',
      legalAddress: gen.adresa || '',
      phone: gen.telefon || '',
      postalCode: gen.codPostal || '',
      isVatPayer: Boolean(tva.scpTVA),
    };
    anafCache.set(cleanCui, { data: payload, cachedAt: Date.now() });
    sendJson(res, 200, payload);
    return true;
  } catch (err) {
    sendJson(res, 500, { success: false, error: err.message });
    return true;
  }
}
