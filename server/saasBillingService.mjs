/**
 * RXM AUTOMOBILE & ParcOS — SaaS Subscription Auto-Billing & Grace Period Service
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA (VAT_RATE = 0.21) • Banca Transilvania
 * Cont de Garanție: RO45BTRL01301205P88888XX (RON) / RO12BTRL01304205P88888XX (EUR)
 */

import { getDealerBySlug, getAllDealers, updateDealer } from './db.mjs';

export const VAT_RATE = 0.21; // Strict 21% TVA deductibil (Art. 291 Cod Fiscal)
export const GRACE_PERIOD_DAYS = 14; // 14 zile termen de grație pentru achitare

export const CARVANA_HOLDING_ISSUER = {
  name: 'CARVANA SRL',
  cui: 'RO48392019',
  regCom: 'J12/2890/2023',
  address: 'Cluj-Napoca, Str. Observatorului 109, Jud. Cluj',
  bankName: 'Banca Transilvania',
  accountTitle: 'Cont de Garanție / Curent B2B',
  ibanRon: 'RO45BTRL01301205P88888XX',
  ibanEur: 'RO12BTRL01304205P88888XX',
  email: 'billing@parcos.ro'
};

export const SAAS_TIER_PRICING = {
  starter: {
    tier: 'starter',
    name: 'ParcOS Starter',
    vehiclesLimit: 25,
    netEur: 99.00,
    vatEur: 20.79,
    grossEur: 119.79,
    currency: 'EUR',
    features: ['25 vehicule stoc', 'OCR CIV & Talon', 'FGO e-Factura', 'Sincronizare OLX']
  },
  pro: {
    tier: 'pro',
    name: 'ParcOS Pro',
    vehiclesLimit: 60,
    netEur: 199.00,
    vatEur: 41.79,
    grossEur: 240.79,
    currency: 'EUR',
    features: ['60 vehicule stoc', 'TikTok Studio & Video', 'ParcOS Mail Hub SES', 'Autovit S9 Sync']
  },
  enterprise: {
    tier: 'enterprise',
    name: 'ParcOS Enterprise',
    vehiclesLimit: 999999,
    netEur: 349.00,
    vatEur: 73.29,
    grossEur: 422.29,
    currency: 'EUR',
    features: ['Stoc Nelimitat', 'Domeniu Propriu Custom', 'Suport Prioritar 24/7', 'Push Autolicit']
  }
};

/**
 * Returnează detaliile de preț pentru un anumit nivel de abonament
 */
export function getTierPricing(tier = 'starter') {
  const cleanTier = String(tier || 'starter').toLowerCase();
  return SAAS_TIER_PRICING[cleanTier] || SAAS_TIER_PRICING.starter;
}

/**
 * Generează factura lunară B2B pentru un tenant specificat
 */
export async function generateSaasInvoiceForTenant(tenantSlug, options = {}) {
  const cleanSlug = String(tenantSlug || '').trim().toLowerCase();
  const tenant = await getDealerBySlug(cleanSlug, true);
  if (!tenant) {
    throw new Error(`Tenantul "${cleanSlug}" nu a fost găsit.`);
  }

  const tier = (options.tier || tenant.tier || 'starter').toLowerCase();
  const pricing = getTierPricing(tier);

  const now = new Date();
  const dueDate = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const invoiceNumber = `INV-PARCOS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const invoiceRecord = {
    id: invoiceNumber,
    series: 'PARCOS',
    number: invoiceNumber,
    tenantSlug: cleanSlug,
    tenantName: tenant.name,
    tier: pricing.tier,
    tierName: pricing.name,
    issueDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    gracePeriodUntil: dueDate.toISOString(),
    amountNetEur: pricing.netEur,
    vatRate: 21,
    vatEur: pricing.vatEur,
    totalGrossEur: pricing.grossEur,
    currency: pricing.currency,
    status: 'issued', // 'issued' | 'paid' | 'overdue' | 'cancelled'
    paidAt: null,
    description: `Abonament lunar ${pricing.name} (${pricing.vehiclesLimit === 999999 ? 'Nelimitat' : pricing.vehiclesLimit} autoturisme stoc activ)`,
    issuer: { ...CARVANA_HOLDING_ISSUER },
    client: {
      name: tenant.name,
      slug: tenant.slug,
      cui: tenant.cui || tenant.vat_number || 'N/A',
      regCom: tenant.reg_com || 'N/A',
      address: `${tenant.address_street || ''}, ${tenant.city || ''}, ${tenant.county || ''}`,
      email: tenant.email,
      phone: tenant.phone_primary
    },
    paymentInstructions: `Plată prin ordin de plată în ${CARVANA_HOLDING_ISSUER.accountTitle} Banca Transilvania. IBAN EUR: ${CARVANA_HOLDING_ISSUER.ibanEur}. Mențiune: ${invoiceNumber}`,
    fgo: {
      fgoInvoiceNumber: `FGO-${invoiceNumber}`,
      spvSent: false,
      environment: options.isSandbox ? 'test' : 'live'
    }
  };

  // Preluare și actualizare config.billing al dealerului
  const currentConfig = (tenant.config && typeof tenant.config === 'object') ? { ...tenant.config } : {};
  const currentBilling = (currentConfig.billing && typeof currentConfig.billing === 'object') ? { ...currentConfig.billing } : {};
  const currentInvoices = Array.isArray(currentBilling.invoices) ? [...currentBilling.invoices] : [];

  currentInvoices.unshift(invoiceRecord);

  // Data următoarei facturări: +30 de zile de la emitere
  const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const updatedConfig = {
    ...currentConfig,
    billing: {
      ...currentBilling,
      invoices: currentInvoices,
      lastInvoiceId: invoiceRecord.id,
      lastInvoiceDate: invoiceRecord.issueDate,
      nextBillingDate: nextBillingDate.toISOString(),
      subscriptionStatus: 'active',
      gracePeriodUntil: invoiceRecord.dueDate
    }
  };

  await updateDealer(cleanSlug, { config: updatedConfig });

  console.log(`🧾 [SAAS BILLING] Factură emisă pentru dealer "${cleanSlug}": ${invoiceRecord.id} (${pricing.grossEur} EUR brut cu 21% TVA)`);

  return invoiceRecord;
}

/**
 * Verifică toate abonamentele parcurilor auto și aplică starea "suspended" dacă termenul de grație de 14 zile a expirat
 */
export async function checkOverdueSubscriptions() {
  const allTenants = await getAllDealers(true);
  const now = new Date();
  const results = {
    checked: allTenants.length,
    active: 0,
    inGracePeriod: 0,
    suspended: 0,
    suspendedTenants: []
  };

  for (const tenant of allTenants) {
    const config = tenant.config || {};
    const billing = config.billing || {};
    const invoices = Array.isArray(billing.invoices) ? billing.invoices : [];

    // Găsim cea mai recentă factură neachitată
    const unpaidInvoices = invoices.filter(inv => inv.status === 'issued' || inv.status === 'overdue');
    if (unpaidInvoices.length === 0) {
      results.active++;
      continue;
    }

    let isSuspendedNow = false;
    let hasGraceWarning = false;

    for (const inv of unpaidInvoices) {
      const due = new Date(inv.dueDate);
      if (now > due) {
        inv.status = 'overdue';
        isSuspendedNow = true;
      } else {
        hasGraceWarning = true;
      }
    }

    if (isSuspendedNow) {
      results.suspended++;
      results.suspendedTenants.push(tenant.slug);

      const updatedConfig = {
        ...config,
        billing: {
          ...billing,
          invoices,
          subscriptionStatus: 'suspended'
        }
      };

      await updateDealer(tenant.slug, {
        status: 'suspended',
        isActive: false,
        config: updatedConfig
      });

      console.warn(`⚠️ [SAAS BILLING] Tenant "${tenant.slug}" suspendat automat — factură neachitată după perioada de grație de 14 zile!`);
    } else if (hasGraceWarning) {
      results.inGracePeriod++;
      const updatedConfig = {
        ...config,
        billing: {
          ...billing,
          invoices,
          subscriptionStatus: 'in_grace_period'
        }
      };
      await updateDealer(tenant.slug, { config: updatedConfig });
    } else {
      results.active++;
    }
  }

  return results;
}

/**
 * Marchează o factură ca achitată și reactivează showroomul dacă era suspendat
 */
export async function markInvoicePaid(tenantSlug, invoiceId) {
  const cleanSlug = String(tenantSlug || '').trim().toLowerCase();
  const tenant = await getDealerBySlug(cleanSlug, true);
  if (!tenant) throw new Error(`Tenantul "${cleanSlug}" nu a fost găsit.`);

  const config = (tenant.config && typeof tenant.config === 'object') ? { ...tenant.config } : {};
  const billing = (config.billing && typeof config.billing === 'object') ? { ...config.billing } : {};
  const invoices = Array.isArray(billing.invoices) ? [...billing.invoices] : [];

  const invoice = invoices.find(inv => String(inv.id) === String(invoiceId));
  if (!invoice) {
    throw new Error(`Factura "${invoiceId}" nu a fost găsită.`);
  }

  invoice.status = 'paid';
  invoice.paidAt = new Date().toISOString();

  // Verificăm dacă mai sunt alte facturi restante
  const remainingOverdue = invoices.some(inv => inv.status === 'overdue');
  const newSubscriptionStatus = remainingOverdue ? 'suspended' : 'active';
  const newDealerStatus = remainingOverdue ? 'suspended' : 'active';

  const updatedConfig = {
    ...config,
    billing: {
      ...billing,
      invoices,
      subscriptionStatus: newSubscriptionStatus
    }
  };

  await updateDealer(cleanSlug, {
    status: newDealerStatus,
    isActive: newDealerStatus === 'active',
    config: updatedConfig
  });

  console.log(`✅ [SAAS BILLING] Factura ${invoiceId} marcată ca plătită pentru "${cleanSlug}". Stare tenant: ${newDealerStatus}`);

  return invoice;
}
