/**
 * RXM AUTOMOBILE & ParcOS — FGO API v2 Fiscal Payload & e-Factura Builder
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Regim Marjă Art. 312 • Cont de Garanție
 */

export const VAT_RATE = 0.21; // Strict 21% TVA (Legea 227/2015 Cod Fiscal)
export const MARGIN_SCHEME_LEGAL_NOTE = 'Regimul marjei - bunuri second-hand conform art. 312 din Codul Fiscal';
export const GUARANTEE_ACCOUNT_TITLE = 'Cont de Garanție';

/**
 * Calculează defalcarea fiscală exactă pentru regim normal 21% TVA vs Regimul Marjei Art. 312
 * @param {{ grossAmount: number; regime?: 'margin_scheme' | 'standard_vat' }} params
 */
export function calculateFiscalAmounts({ grossAmount, regime = 'margin_scheme' }) {
  const gross = Number(grossAmount);
  if (isNaN(gross) || gross < 0) {
    throw new Error('Suma brută trebuie să fie un număr pozitiv valid.');
  }

  if (regime === 'standard_vat') {
    // Calcul TVA 21% deductibil: Bază = Brut / 1.21, TVA = Brut - Bază
    const baseAmount = Number((gross / (1 + VAT_RATE)).toFixed(2));
    const vatAmount = Number((gross - baseAmount).toFixed(2));
    return {
      grossAmount: Number(gross.toFixed(2)),
      baseAmount,
      vatAmount,
      vatRate: 21,
      isMarginScheme: false,
      legalNote: 'TVA deductibil 21% inclus conform Codului Fiscal'
    };
  }

  // Regimul Special al Marjei (Art. 312 Cod Fiscal):
  // Cota TVA 0%, fără evidențierea distinctă a TVA-ului pe factură către cumpărător
  return {
    grossAmount: Number(gross.toFixed(2)),
    baseAmount: Number(gross.toFixed(2)),
    vatAmount: 0,
    vatRate: 0,
    isMarginScheme: true,
    legalNote: MARGIN_SCHEME_LEGAL_NOTE
  };
}

/**
 * Construiește payload-ul REST compatibil cu FGO.ro API v2 și RO e-Factura SPV
 * @param {Object} options
 */
export function buildFgoInvoicePayload(options = {}) {
  const {
    dealerSlug = 'rxm',
    dealerProfile = {},
    dealerConfig = {},
    invoiceType = 'proforma', // 'proforma' | 'invoice'
    client = {},
    vehicle = {},
    amount = 0,
    currency = 'EUR',
    exchangeRateRon = 1,
    regime = 'margin_scheme',
    customNotes = ''
  } = options;

  // 1. INVARIANTĂ SECURITATE SPV: Sandbox și Test UAT au transmiterea în SPV ANAF BLOCATĂ la nivel de cod
  const isSandbox = dealerSlug === 'rxm_sandbox';
  const effectiveEnv = isSandbox ? 'test' : (dealerConfig?.invoicing?.fgo?.environment || 'live');
  const isTestEnv = effectiveEnv === 'test';

  let trimiteInSPV = Boolean(dealerConfig?.invoicing?.fgo?.autoSendSpv);
  if (isSandbox || isTestEnv) {
    trimiteInSPV = false;
    console.warn(`[SECURITY] SPV dispatch blocked for sandbox tenant: ${dealerSlug} (Environment: ${effectiveEnv})`);
  }

  // 2. Determinare serie fiscală sau proformă
  const fgoCfg = dealerConfig?.invoicing?.fgo || {};
  let serie = invoiceType === 'proforma'
    ? (fgoCfg.seriesProforma || 'PROF').toUpperCase()
    : (fgoCfg.seriesFiscal || 'RXM').toUpperCase();

  if (isSandbox) {
    serie = invoiceType === 'proforma' ? 'SANDBOX' : 'TEST';
  }

  // 3. Calcul valori fiscale
  const fiscal = calculateFiscalAmounts({ grossAmount: amount, regime });

  // 4. Linie produs / autovehicul
  let descriere = '';
  if (invoiceType === 'proforma') {
    descriere = vehicle.make && vehicle.model
      ? `Garanție de Rezervare / Participare autoturism ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin || 'N/A'})`
      : 'Garanție de Rezervare / Participare autoturism';
  } else {
    descriere = vehicle.make && vehicle.model
      ? `Autoturism ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin || 'N/A'}, An: ${vehicle.year || 'N/A'})`
      : 'Vânzare autoturism rulat conform contract';
  }

  // 5. Mențiuni și instrucțiuni de plată (Strict "Cont de Garanție")
  const observatiiList = [];
  if (fiscal.isMarginScheme) {
    observatiiList.push(MARGIN_SCHEME_LEGAL_NOTE);
  }
  if (invoiceType === 'proforma') {
    observatiiList.push(`Încasare exclusiv în ${GUARANTEE_ACCOUNT_TITLE} (Garanție de Rezervare/Participare).`);
  }
  if (dealerProfile?.ibanRon) {
    observatiiList.push(`IBAN RON (${dealerProfile.bankName || 'Banca Transilvania'}): ${dealerProfile.ibanRon}`);
  }
  if (dealerProfile?.ibanEur) {
    observatiiList.push(`IBAN EUR (${dealerProfile.bankName || 'Banca Transilvania'}): ${dealerProfile.ibanEur}`);
  }
  if (customNotes) {
    observatiiList.push(customNotes);
  }

  const issuerCui = String(fgoCfg.cui || dealerProfile.cui || '').replace(/[^0-9]/g, '');

  const payload = {
    TipFactura: invoiceType === 'proforma' ? 'Proforma' : 'Factura',
    CodUnicIdentificare: issuerCui,
    Serie: serie,
    Data: new Date().toISOString().split('T')[0],
    Scadenta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Moneda: currency.toUpperCase(),
    CursValutar: currency.toUpperCase() === 'RON' ? 1 : (Number(exchangeRateRon) || 1),
    TrimiteInSPV: trimiteInSPV,
    Client: {
      Denumire: client.name || 'Client Persoană Fizică',
      CodUnicIdentificare: client.cuiOrCnp ? String(client.cuiOrCnp).trim() : '',
      NrRegCom: client.regCom || '',
      Adresa: client.address || 'România',
      Email: client.email || '',
      Telefon: client.phone || ''
    },
    Continut: [
      {
        Denumire: descriere,
        UM: 'Buc',
        Cantitate: 1,
        PretUnitar: fiscal.baseAmount,
        CotaTVA: fiscal.vatRate,
        Valoare: fiscal.baseAmount,
        ValoareTVA: fiscal.vatAmount,
        ValoareTotala: fiscal.grossAmount,
        Observatii: fiscal.legalNote
      }
    ],
    Observatii: observatiiList.join(' • '),
    TotalNet: fiscal.baseAmount,
    TotalTVA: fiscal.vatAmount,
    TotalGeneral: fiscal.grossAmount
  };

  return {
    payload,
    fiscalSummary: fiscal,
    securityFlags: {
      dealerSlug,
      isSandbox,
      effectiveEnvironment: effectiveEnv,
      isTestEnv,
      trimiteInSPV,
      spvBlocked: !trimiteInSPV
    }
  };
}
