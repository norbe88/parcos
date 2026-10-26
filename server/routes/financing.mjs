/**
 * Dosare F&I comune per parc. Izolate pe dealer_slug din resolveTenant.
 * Rata și comisionul se recalculează aici. Sumele din body nu sunt sursa de adevăr.
 * Formula este aceeași cu calculateMonthlyRate / calculateDealerCommission
 * din src/services/financingService.ts. Nu o schimba separat.
 */

import {
  listFinancingDossiers,
  findFinancingDossierOwner,
  findFinancingDossierByLead,
  findFinancingDossier,
  insertFinancingDossier,
  updateFinancingDossier,
} from '../db.mjs';

const DOSSIER_STATUSES = new Set([
  'draft', 'docs_pending', 'submitted', 'under_review', 'conditional',
  'approved', 'contract_signed', 'funded', 'delivered', 'rejected', 'canceled',
]);
const CREDITORS = new Set(['tbi', 'bt', 'unicredit', 'creditfix', 'mogo', 'other']);
const EMPLOYMENT = new Set(['salariat_ro', 'salariat_diaspora', 'pensionar', 'pfa_srl', 'co_platitor']);
const PAYOUTS = new Set(['pending', 'invoiced', 'collected']);

const EMPTY_DOCUMENTS = {
  idCardUploaded: false,
  anafConsentSigned: false,
  incomeProofUploaded: false,
  bankContractUploaded: false,
};

function isFinancingPath(pathname) {
  return pathname === '/api/financing-dossiers' || pathname.startsWith('/api/financing-dossiers/');
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

function asMoney(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function asCount(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

function asPct(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function asEnum(value, allowed) {
  const text = String(value || '').trim();
  return allowed.has(text) ? text : null;
}

function asIsoOrNull(value) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function asDocuments(value) {
  let source = value;
  if (typeof value === 'string') {
    try { source = JSON.parse(value); } catch { source = null; }
  }
  if (!source || typeof source !== 'object') return { ...EMPTY_DOCUMENTS };
  return {
    idCardUploaded: source.idCardUploaded === true,
    anafConsentSigned: source.anafConsentSigned === true,
    incomeProofUploaded: source.incomeProofUploaded === true,
    bankContractUploaded: source.bankContractUploaded === true,
  };
}

/**
 * R = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
 * Aceeași rotunjire ca în financingService.ts.
 */
export function calculateMonthlyRate(principalRon, tenureMonths, annualInterestPct) {
  if (!principalRon || principalRon <= 0 || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualInterestPct || annualInterestPct <= 0) {
    return Math.round(principalRon / tenureMonths);
  }
  const monthlyRate = annualInterestPct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyPayment = (principalRon * monthlyRate * factor) / (factor - 1);
  return Math.round(monthlyPayment);
}

/** Aceeași rotunjire ca în financingService.ts. */
export function calculateDealerCommission(financedAmountRon, commissionPct = 2.0) {
  if (!financedAmountRon || financedAmountRon <= 0 || !commissionPct || commissionPct <= 0) return 0;
  return Math.round((financedAmountRon * commissionPct) / 100);
}

function applyDerivedAmounts(row) {
  const financed = row.financedAmountRon;
  const tenure = row.tenureMonths;
  const interest = row.interestRatePct;
  const pct = row.brokerCommissionPct == null ? 2 : row.brokerCommissionPct;
  if (financed == null) {
    return {
      ...row,
      monthlyInstallmentRon: null,
      brokerCommissionRon: null,
    };
  }
  return {
    ...row,
    brokerCommissionPct: pct,
    monthlyInstallmentRon: tenure == null ? null : calculateMonthlyRate(financed, tenure, interest || 0),
    brokerCommissionRon: calculateDealerCommission(financed, pct),
  };
}

function iso(value, fallback) {
  if (value instanceof Date) return value.toISOString();
  if (value) return String(value);
  return fallback;
}

function reqNum(value) {
  if (value == null || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function optNum(value) {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function mapFinancingDossierRow(row) {
  if (!row) return null;
  const created = iso(row.created_at, new Date().toISOString());
  const updated = iso(row.updated_at, created);
  return {
    id: row.id,
    leadId: row.lead_id || undefined,
    carId: row.car_id || '',
    carTitle: row.car_title || '',
    carPriceEur: reqNum(row.car_price_eur),
    carPriceRon: reqNum(row.car_price_ron),
    clientName: row.client_name || '',
    clientPhone: row.client_phone || '',
    clientEmail: row.client_email || undefined,
    clientCnp: row.client_cnp || undefined,
    clientEmploymentType: EMPLOYMENT.has(row.client_employment_type) ? row.client_employment_type : 'salariat_ro',
    monthlyNetIncomeRon: optNum(row.monthly_net_income_ron),
    existingDebtsRon: optNum(row.existing_debts_ron),
    creditor: CREDITORS.has(row.creditor) ? row.creditor : 'tbi',
    downPaymentEur: reqNum(row.down_payment_eur),
    downPaymentRon: reqNum(row.down_payment_ron),
    downPaymentPct: reqNum(row.down_payment_pct),
    financedAmountRon: reqNum(row.financed_amount_ron),
    tenureMonths: row.tenure_months == null ? 0 : reqNum(row.tenure_months),
    interestRatePct: reqNum(row.interest_rate_pct),
    monthlyInstallmentRon: reqNum(row.monthly_installment_ron),
    status: DOSSIER_STATUSES.has(row.status) ? row.status : 'draft',
    rejectionReason: row.rejection_reason || undefined,
    conditionNotes: row.condition_notes || undefined,
    documents: asDocuments(row.documents),
    brokerCommissionPct: optNum(row.broker_commission_pct),
    brokerCommissionRon: optNum(row.broker_commission_ron),
    commissionPayoutStatus: PAYOUTS.has(row.commission_payout_status) ? row.commission_payout_status : 'pending',
    assignedOfficer: row.assigned_officer || '',
    internalNotes: row.internal_notes || undefined,
    createdAt: created,
    updatedAt: updated,
  };
}

function payloadToRow(body, dealerSlug, { preserveTimestamps = false } = {}) {
  const now = new Date().toISOString();
  const id = cleanId(body?.id) || `dossier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const leadId = cleanId(body?.leadId) || null;
  const row = {
    id,
    dealerSlug,
    leadId,
    carId: asOptionalString(body?.carId, 80),
    carTitle: asOptionalString(body?.carTitle, 240),
    carPriceEur: asMoney(body?.carPriceEur),
    carPriceRon: asMoney(body?.carPriceRon),
    clientName: asOptionalString(body?.clientName, 200),
    clientPhone: asOptionalString(body?.clientPhone, 40),
    clientEmail: asOptionalString(body?.clientEmail, 200),
    clientCnp: asOptionalString(body?.clientCnp, 20),
    clientEmploymentType: asEnum(body?.clientEmploymentType, EMPLOYMENT) || 'salariat_ro',
    monthlyNetIncomeRon: asMoney(body?.monthlyNetIncomeRon),
    existingDebtsRon: asMoney(body?.existingDebtsRon),
    creditor: asEnum(body?.creditor, CREDITORS) || 'tbi',
    downPaymentEur: asMoney(body?.downPaymentEur),
    downPaymentRon: asMoney(body?.downPaymentRon),
    downPaymentPct: asPct(body?.downPaymentPct),
    financedAmountRon: asMoney(body?.financedAmountRon),
    tenureMonths: asCount(body?.tenureMonths),
    interestRatePct: asPct(body?.interestRatePct),
    status: asEnum(body?.status, DOSSIER_STATUSES) || 'draft',
    rejectionReason: asOptionalString(body?.rejectionReason, 2000),
    conditionNotes: asOptionalString(body?.conditionNotes, 2000),
    documents: asDocuments(body?.documents),
    brokerCommissionPct: asPct(body?.brokerCommissionPct),
    commissionPayoutStatus: asEnum(body?.commissionPayoutStatus, PAYOUTS) || 'pending',
    assignedOfficer: asOptionalString(body?.assignedOfficer, 120),
    internalNotes: asOptionalString(body?.internalNotes, 4000),
    createdAt: preserveTimestamps ? (asIsoOrNull(body?.createdAt) || now) : now,
    updatedAt: preserveTimestamps ? (asIsoOrNull(body?.updatedAt) || now) : now,
  };
  return applyDerivedAmounts(row);
}

function storedMoney(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mergePatch(existingRow, body) {
  const currentStatus = DOSSIER_STATUSES.has(existingRow.status) ? existingRow.status : 'draft';
  const currentEmployment = EMPLOYMENT.has(existingRow.client_employment_type) ? existingRow.client_employment_type : 'salariat_ro';
  const currentCreditor = CREDITORS.has(existingRow.creditor) ? existingRow.creditor : 'tbi';
  const currentPayout = PAYOUTS.has(existingRow.commission_payout_status) ? existingRow.commission_payout_status : 'pending';
  const next = {
    id: existingRow.id,
    dealerSlug: existingRow.dealer_slug,
    leadId: body.leadId !== undefined ? (cleanId(body.leadId) || null) : (existingRow.lead_id || null),
    carId: body.carId !== undefined ? asOptionalString(body.carId, 80) : (existingRow.car_id || null),
    carTitle: body.carTitle !== undefined ? asOptionalString(body.carTitle, 240) : (existingRow.car_title || null),
    carPriceEur: body.carPriceEur !== undefined ? asMoney(body.carPriceEur) : storedMoney(existingRow.car_price_eur),
    carPriceRon: body.carPriceRon !== undefined ? asMoney(body.carPriceRon) : storedMoney(existingRow.car_price_ron),
    clientName: body.clientName !== undefined ? asOptionalString(body.clientName, 200) : (existingRow.client_name || null),
    clientPhone: body.clientPhone !== undefined ? asOptionalString(body.clientPhone, 40) : (existingRow.client_phone || null),
    clientEmail: body.clientEmail !== undefined ? asOptionalString(body.clientEmail, 200) : (existingRow.client_email || null),
    clientCnp: body.clientCnp !== undefined ? asOptionalString(body.clientCnp, 20) : (existingRow.client_cnp || null),
    clientEmploymentType: body.clientEmploymentType !== undefined
      ? (asEnum(body.clientEmploymentType, EMPLOYMENT) || currentEmployment)
      : currentEmployment,
    monthlyNetIncomeRon: body.monthlyNetIncomeRon !== undefined ? asMoney(body.monthlyNetIncomeRon) : storedMoney(existingRow.monthly_net_income_ron),
    existingDebtsRon: body.existingDebtsRon !== undefined ? asMoney(body.existingDebtsRon) : storedMoney(existingRow.existing_debts_ron),
    creditor: body.creditor !== undefined ? (asEnum(body.creditor, CREDITORS) || currentCreditor) : currentCreditor,
    downPaymentEur: body.downPaymentEur !== undefined ? asMoney(body.downPaymentEur) : storedMoney(existingRow.down_payment_eur),
    downPaymentRon: body.downPaymentRon !== undefined ? asMoney(body.downPaymentRon) : storedMoney(existingRow.down_payment_ron),
    downPaymentPct: body.downPaymentPct !== undefined ? asPct(body.downPaymentPct) : storedMoney(existingRow.down_payment_pct),
    financedAmountRon: body.financedAmountRon !== undefined ? asMoney(body.financedAmountRon) : storedMoney(existingRow.financed_amount_ron),
    tenureMonths: body.tenureMonths !== undefined ? asCount(body.tenureMonths) : (existingRow.tenure_months == null ? null : Number(existingRow.tenure_months)),
    interestRatePct: body.interestRatePct !== undefined ? asPct(body.interestRatePct) : storedMoney(existingRow.interest_rate_pct),
    status: body.status !== undefined ? (asEnum(body.status, DOSSIER_STATUSES) || currentStatus) : currentStatus,
    rejectionReason: body.rejectionReason !== undefined ? asOptionalString(body.rejectionReason, 2000) : (existingRow.rejection_reason || null),
    conditionNotes: body.conditionNotes !== undefined ? asOptionalString(body.conditionNotes, 2000) : (existingRow.condition_notes || null),
    documents: body.documents !== undefined ? asDocuments(body.documents) : asDocuments(existingRow.documents),
    brokerCommissionPct: body.brokerCommissionPct !== undefined ? asPct(body.brokerCommissionPct) : storedMoney(existingRow.broker_commission_pct),
    commissionPayoutStatus: body.commissionPayoutStatus !== undefined
      ? (asEnum(body.commissionPayoutStatus, PAYOUTS) || currentPayout)
      : currentPayout,
    assignedOfficer: body.assignedOfficer !== undefined ? asOptionalString(body.assignedOfficer, 120) : (existingRow.assigned_officer || null),
    internalNotes: body.internalNotes !== undefined ? asOptionalString(body.internalNotes, 4000) : (existingRow.internal_notes || null),
    createdAt: iso(existingRow.created_at, new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };
  return applyDerivedAmounts(next);
}

async function readJson(req, readRequestBody, limit) {
  const raw = await readRequestBody(req, limit);
  return JSON.parse(raw.toString('utf8'));
}

async function replyExisting(sendJson, res, row) {
  sendJson(res, 200, { success: true, dossier: mapFinancingDossierRow(row), duplicate: true });
}

export async function handleFinancingRoutes(req, res, urlObj, pathname, {
  sendJson,
  readRequestBody,
  resolveTenant,
  isAuthorizedAdmin,
}) {
  if (!isFinancingPath(pathname)) return false;

  const tenant = await resolveTenant(req, urlObj);
  if (!tenant || tenant.unconfigured === true || !tenant.slug) {
    sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
    return true;
  }
  const dealerSlug = String(tenant.slug).trim().toLowerCase();

  if (!isAuthorizedAdmin(req)) {
    sendJson(res, 401, { success: false, error: 'Acces interzis.' });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/financing-dossiers') {
    const rows = await listFinancingDossiers(dealerSlug);
    sendJson(res, 200, {
      success: true,
      dealerSlug,
      dossiers: rows.map(mapFinancingDossierRow),
    });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/financing-dossiers/import') {
    let body;
    try {
      body = await readJson(req, readRequestBody, 2 * 1024 * 1024);
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }
    const incoming = Array.isArray(body?.dossiers) ? body.dossiers.slice(0, 500) : [];
    let imported = 0;
    let skipped = 0;
    const acceptedIds = [];
    for (const raw of incoming) {
      const id = cleanId(raw?.id);
      if (!id) {
        skipped += 1;
        continue;
      }
      const owner = await findFinancingDossierOwner(id);
      if (owner) {
        skipped += 1;
        acceptedIds.push(id);
        continue;
      }
      const leadId = cleanId(raw?.leadId);
      if (leadId) {
        const byLead = await findFinancingDossierByLead(dealerSlug, leadId);
        if (byLead) {
          skipped += 1;
          acceptedIds.push(id);
          continue;
        }
      }
      const row = payloadToRow({ ...raw, id }, dealerSlug, { preserveTimestamps: true });
      const inserted = await insertFinancingDossier(row);
      if (inserted) {
        imported += 1;
        acceptedIds.push(id);
      } else {
        skipped += 1;
        acceptedIds.push(id);
      }
    }
    sendJson(res, 200, { success: true, imported, skipped, acceptedIds });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/financing-dossiers') {
    let body;
    try {
      body = await readJson(req, readRequestBody, 64 * 1024);
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }
    const leadId = cleanId(body?.leadId);
    if (leadId) {
      const byLead = await findFinancingDossierByLead(dealerSlug, leadId);
      if (byLead) {
        await replyExisting(sendJson, res, byLead);
        return true;
      }
    }
    const requestedId = cleanId(body?.id);
    if (requestedId) {
      const owner = await findFinancingDossierOwner(requestedId);
      if (owner && owner !== dealerSlug) {
        sendJson(res, 404, { success: false, error: 'Dosarul nu a fost găsit' });
        return true;
      }
      if (owner === dealerSlug) {
        const own = await findFinancingDossier(requestedId, dealerSlug);
        if (own) {
          await replyExisting(sendJson, res, own);
          return true;
        }
      }
    }
    const row = payloadToRow(body, dealerSlug, { preserveTimestamps: false });
    const inserted = await insertFinancingDossier(row);
    if (!inserted) {
      if (row.leadId) {
        const byLead = await findFinancingDossierByLead(dealerSlug, row.leadId);
        if (byLead) {
          await replyExisting(sendJson, res, byLead);
          return true;
        }
      }
      const owner = await findFinancingDossierOwner(row.id);
      if (owner && owner !== dealerSlug) {
        sendJson(res, 404, { success: false, error: 'Dosarul nu a fost găsit' });
        return true;
      }
      if (owner === dealerSlug) {
        const own = await findFinancingDossier(row.id, dealerSlug);
        if (own) {
          await replyExisting(sendJson, res, own);
          return true;
        }
      }
      sendJson(res, 409, { success: false, error: 'Dosarul nu a putut fi creat.' });
      return true;
    }
    sendJson(res, 201, { success: true, dossier: mapFinancingDossierRow(inserted) });
    return true;
  }

  const idMatch = pathname.match(/^\/api\/financing-dossiers\/([^/]+)$/);
  if (!idMatch || idMatch[1] === 'import') {
    sendJson(res, 405, { success: false, error: 'Metodă neacceptată' });
    return true;
  }

  const id = cleanId(decodeURIComponent(idMatch[1]));
  if (!id) {
    sendJson(res, 400, { success: false, error: 'ID dosar invalid' });
    return true;
  }

  const owner = await findFinancingDossierOwner(id);
  if (!owner || owner !== dealerSlug) {
    sendJson(res, 404, { success: false, error: 'Dosarul nu a fost găsit' });
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
    const existing = await findFinancingDossier(id, dealerSlug);
    if (!existing) {
      sendJson(res, 404, { success: false, error: 'Dosarul nu a fost găsit' });
      return true;
    }
    const row = mergePatch(existing, body || {});
    const updated = await updateFinancingDossier(id, dealerSlug, row);
    if (!updated) {
      sendJson(res, 409, { success: false, error: 'Dosarul nu a putut fi actualizat.' });
      return true;
    }
    sendJson(res, 200, { success: true, dossier: mapFinancingDossierRow(updated) });
    return true;
  }

  sendJson(res, 405, { success: false, error: 'Metodă neacceptată' });
  return true;
}
