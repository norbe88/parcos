/**
 * Lead-uri comune per parc. Izolate pe dealer_slug din resolveTenant.
 * POST /api/lead (formularul de marketing) nu trece prin acest modul.
 */

import {
  listDealerLeads,
  findDealerLeadOwner,
  findRecentDealerLead,
  insertDealerLead,
  updateDealerLead,
  deleteDealerLead,
} from '../db.mjs';

const LEAD_STATUSES = new Set(['new', 'testdrive', 'financing', 'negotiation', 'proforma', 'closed_won', 'closed_lost']);
const DEAL_TYPES = new Set(['cash', 'financing', 'buyback']);
const SOURCES = new Set(['showroom_web', 'whatsapp', 'olx', 'tiktok', 'phone_call', 'recommendation']);

const intakeRateLimit = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PUBLIC_INTAKES = 20;

function isLeadsPath(pathname) {
  return pathname === '/api/leads' || pathname.startsWith('/api/leads/');
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function cleanId(value) {
  const id = String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return id.length >= 3 ? id : '';
}

function asOptionalString(value, max = 500) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
}

function asPrice(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function asStatus(value) {
  const status = String(value || '').trim();
  return LEAD_STATUSES.has(status) ? status : null;
}

function asDealType(value) {
  const dealType = String(value || '').trim();
  return DEAL_TYPES.has(dealType) ? dealType : null;
}

function asSource(value) {
  const source = String(value || '').trim();
  return SOURCES.has(source) ? source : null;
}

function asIsoOrNull(value) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function asDateOnly(value) {
  if (value == null || value === '') return null;
  const text = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function mapDealerLeadRow(row) {
  if (!row) return null;
  const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || new Date().toISOString());
  const updated = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || created);
  const testDrive = row.scheduled_test_drive_at
    ? (row.scheduled_test_drive_at instanceof Date ? row.scheduled_test_drive_at.toISOString() : String(row.scheduled_test_drive_at))
    : undefined;
  const recontact = row.recontact_date
    ? (row.recontact_date instanceof Date ? row.recontact_date.toISOString().slice(0, 10) : String(row.recontact_date).slice(0, 10))
    : undefined;
  return {
    id: row.id,
    clientName: row.client_name || '',
    clientPhone: row.client_phone || '',
    clientEmail: row.client_email || undefined,
    carId: row.car_id || undefined,
    carTitle: row.car_title || undefined,
    carPriceEur: row.car_price_eur == null ? undefined : Number(row.car_price_eur),
    dealType: DEAL_TYPES.has(row.deal_type) ? row.deal_type : 'cash',
    source: SOURCES.has(row.source) ? row.source : 'showroom_web',
    status: LEAD_STATUSES.has(row.status) ? row.status : 'new',
    notes: row.notes || undefined,
    createdAt: created,
    updatedAt: updated,
    scheduledTestDriveAt: testDrive,
    recontactDate: recontact,
  };
}

function payloadToLead(body, dealerSlug, { preserveTimestamps = false } = {}) {
  const now = new Date().toISOString();
  const id = cleanId(body?.id) || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    dealerSlug,
    clientName: asOptionalString(body?.clientName, 200),
    clientPhone: asOptionalString(body?.clientPhone, 40),
    clientEmail: asOptionalString(body?.clientEmail, 200),
    carId: asOptionalString(body?.carId, 80),
    carTitle: asOptionalString(body?.carTitle, 240),
    carPriceEur: asPrice(body?.carPriceEur),
    dealType: asDealType(body?.dealType) || 'cash',
    source: asSource(body?.source) || 'showroom_web',
    status: asStatus(body?.status) || 'new',
    notes: asOptionalString(body?.notes, 4000),
    createdAt: preserveTimestamps ? (asIsoOrNull(body?.createdAt) || now) : now,
    updatedAt: preserveTimestamps ? (asIsoOrNull(body?.updatedAt) || now) : now,
    scheduledTestDriveAt: asIsoOrNull(body?.scheduledTestDriveAt),
    recontactDate: asDateOnly(body?.recontactDate),
  };
}

function allowPublicIntake(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  const now = Date.now();
  const entry = intakeRateLimit.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    intakeRateLimit.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_PUBLIC_INTAKES) return false;
  entry.count += 1;
  intakeRateLimit.set(ip, entry);
  return true;
}

async function readJson(req, readRequestBody, limit) {
  const raw = await readRequestBody(req, limit);
  return JSON.parse(raw.toString('utf8'));
}

export async function handleLeadRoutes(req, res, urlObj, pathname, {
  sendJson,
  readRequestBody,
  resolveTenant,
  isAuthorizedAdmin,
}) {
  if (!isLeadsPath(pathname)) return false;

  const tenant = await resolveTenant(req, urlObj);
  if (!tenant || tenant.unconfigured === true || !tenant.slug) {
    sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
    return true;
  }
  const dealerSlug = String(tenant.slug).trim().toLowerCase();

  if (req.method === 'GET' && pathname === '/api/leads') {
    if (!isAuthorizedAdmin(req)) {
      sendJson(res, 401, { success: false, error: 'Acces interzis.' });
      return true;
    }
    const rows = await listDealerLeads(dealerSlug);
    sendJson(res, 200, {
      success: true,
      dealerSlug,
      leads: rows.map(mapDealerLeadRow),
    });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/leads/import') {
    if (!isAuthorizedAdmin(req)) {
      sendJson(res, 401, { success: false, error: 'Acces interzis.' });
      return true;
    }
    let body;
    try {
      body = await readJson(req, readRequestBody, 2 * 1024 * 1024);
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }
    const incoming = Array.isArray(body?.leads) ? body.leads.slice(0, 500) : [];
    let imported = 0;
    let skipped = 0;
    const acceptedIds = [];
    for (const raw of incoming) {
      const id = cleanId(raw?.id);
      if (!id) {
        skipped += 1;
        continue;
      }
      const owner = await findDealerLeadOwner(id);
      if (owner) {
        skipped += 1;
        acceptedIds.push(id);
        continue;
      }
      const lead = payloadToLead({ ...raw, id }, dealerSlug, { preserveTimestamps: true });
      const inserted = await insertDealerLead(lead);
      if (inserted) imported += 1;
      else skipped += 1;
      acceptedIds.push(id);
    }
    sendJson(res, 200, { success: true, imported, skipped, acceptedIds });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/leads') {
    if (!isAuthorizedAdmin(req) && !allowPublicIntake(req)) {
      sendJson(res, 429, { success: false, error: 'Prea multe cereri. Încearcă din nou peste câteva minute.' });
      return true;
    }
    let body;
    try {
      body = await readJson(req, readRequestBody, 64 * 1024);
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }
    const lead = payloadToLead(body, dealerSlug, { preserveTimestamps: false });
    const recent = await findRecentDealerLead({
      dealerSlug,
      phoneDigits: phoneDigits(lead.clientPhone),
      carId: lead.carId || '',
    });
    if (recent) {
      sendJson(res, 200, { success: true, lead: mapDealerLeadRow(recent), duplicate: true });
      return true;
    }
    const inserted = await insertDealerLead(lead);
    sendJson(res, 201, { success: true, lead: mapDealerLeadRow(inserted || { ...leadRowFromPayload(lead) }) });
    return true;
  }

  const idMatch = pathname.match(/^\/api\/leads\/([^/]+)$/);
  if (!idMatch) return false;
  if (idMatch[1] === 'import') return false;

  if (!isAuthorizedAdmin(req)) {
    sendJson(res, 401, { success: false, error: 'Acces interzis.' });
    return true;
  }

  const id = cleanId(decodeURIComponent(idMatch[1]));
  if (!id) {
    sendJson(res, 400, { success: false, error: 'ID lead invalid' });
    return true;
  }

  const owner = await findDealerLeadOwner(id);
  if (!owner) {
    sendJson(res, 404, { success: false, error: 'Lead-ul nu a fost găsit' });
    return true;
  }
  if (owner.trim().toLowerCase() !== dealerSlug) {
    sendJson(res, 403, { success: false, error: 'Lead-ul aparține altui parc.' });
    return true;
  }

  if (req.method === 'DELETE') {
    await deleteDealerLead(id, dealerSlug);
    sendJson(res, 200, { success: true, deletedId: id });
    return true;
  }

  if (req.method === 'PATCH') {
    let body;
    try {
      body = await readJson(req, readRequestBody, 64 * 1024);
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }
    const patch = {};
    if (body.clientName != null) patch.clientName = asOptionalString(body.clientName, 200);
    if (body.clientPhone != null) patch.clientPhone = asOptionalString(body.clientPhone, 40);
    if (body.clientEmail != null) patch.clientEmail = asOptionalString(body.clientEmail, 200);
    if (body.carId != null) patch.carId = asOptionalString(body.carId, 80);
    if (body.carTitle != null) patch.carTitle = asOptionalString(body.carTitle, 240);
    if (body.carPriceEur != null) patch.carPriceEur = asPrice(body.carPriceEur);
    if (body.dealType != null) patch.dealType = asDealType(body.dealType);
    if (body.source != null) patch.source = asSource(body.source);
    if (body.status != null) patch.status = asStatus(body.status);
    if (body.notes != null) patch.notes = asOptionalString(body.notes, 4000);
    if (body.scheduledTestDriveAt != null) patch.scheduledTestDriveAt = asIsoOrNull(body.scheduledTestDriveAt);
    if (body.recontactDate != null) patch.recontactDate = asDateOnly(body.recontactDate);
    const updated = await updateDealerLead(id, dealerSlug, patch);
    if (!updated) {
      sendJson(res, 404, { success: false, error: 'Lead-ul nu a fost găsit' });
      return true;
    }
    sendJson(res, 200, { success: true, lead: mapDealerLeadRow(updated) });
    return true;
  }

  sendJson(res, 405, { success: false, error: 'Metodă neacceptată' });
  return true;
}

function leadRowFromPayload(lead) {
  return {
    id: lead.id,
    client_name: lead.clientName,
    client_phone: lead.clientPhone,
    client_email: lead.clientEmail,
    car_id: lead.carId,
    car_title: lead.carTitle,
    car_price_eur: lead.carPriceEur,
    deal_type: lead.dealType,
    source: lead.source,
    status: lead.status,
    notes: lead.notes,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    scheduled_test_drive_at: lead.scheduledTestDriveAt,
    recontact_date: lead.recontactDate,
  };
}
