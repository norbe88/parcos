import { VehicleItem, DealerProfile } from '../db/types';
import { SEED_DEALER } from '../db/dealer';
import { getStockNumber, resolveDealerContact } from './helpers';
import { getPrioritizedShowroomFeatures } from './vehicleDescriptionGenerator';

export interface SocialCopyOptions {
  includeFinancing?: boolean;
  includeWarranty?: boolean;
  includeLocation?: boolean;
  customHashtags?: string[];
  publicBaseUrl?: string;
}

export interface GeneratedSocialPost {
  facebook: {
    headline: string;
    specsText: string;
    featuresText: string;
    financeAndWarrantyText: string;
    ctaAndContactText: string;
    fullCopy: string;
  };
  instagram: {
    hook: string;
    body: string;
    cta: string;
    hashtags: string;
    fullCaption: string;
  };
}

/**
 * Calculează prețul brut și net conform invariantului strict CARVANA: VAT_RATE = 0.21
 */
export function formatVatPriceSummary(priceEur: number, vatDeductible: boolean): string {
  const formattedGross = priceEur.toLocaleString('ro-RO');
  if (vatDeductible) {
    const netEur = Math.round(priceEur / 1.21);
    const formattedNet = netEur.toLocaleString('ro-RO');
    return `💰 ${formattedGross} € (TVA 21% deductibil inclus)\n   ↳ ${formattedNet} € Net (+21% TVA deductibil)`;
  }
  return `💰 ${formattedGross} € (Regim de Marjă - TVA nedeductibil conform Cod Fiscal)`;
}

/**
 * Generează URL-ul canonic al mașinii pentru distribuire garantată fără 404
 */
export function getCanonicalCarShareUrl(carId: string, baseUrl?: string, dealerDomain?: string): string {
  if (baseUrl) {
    const clean = baseUrl.replace(/\/+$/, '');
    return `${clean}/#catalog?car=${carId}`;
  }
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return `${origin}/#catalog?car=${carId}`;
    }
  }
  return `https://${dealerDomain || 'parcos.ro'}/#catalog?car=${carId}`;
}

/**
 * Extrage top dotări cheie din dotările vehiculului
 */
function extractKeyFeaturesList(car: VehicleItem, limit = 8): string[] {
  const allFeatures: string[] = [
    ...(car.features?.safety || []),
    ...(car.features?.comfort || []),
    ...(car.features?.multimedia || [])
  ];

  if (allFeatures.length > 0) {
    const prioritized = getPrioritizedShowroomFeatures(allFeatures);
    return prioritized.slice(0, limit);
  }

  // Fallback dacă mașina nu are dotări structurate
  const fallbackList: string[] = [];
  if (car.transmission === 'Automată') fallbackList.push('Transmisie automată');
  if (car.drivetrain.includes('4x4') || car.drivetrain.includes('AWD')) fallbackList.push(`Tracțiune integrală ${car.drivetrain}`);
  if (car.powerHp > 150) fallbackList.push(`Motorizare dinamică ${car.powerHp} CP`);
  fallbackList.push('Istoric de service verificabil');
  return fallbackList;
}

/**
 * Generator complet de texte pentru Facebook (Postare pagină / grupuri auto)
 */
export function generateFacebookPostCopy(
  car: VehicleItem,
  dealer: DealerProfile = SEED_DEALER,
  options: SocialCopyOptions = {}
): GeneratedSocialPost['facebook'] {
  const stockRef = getStockNumber(car);
  const shareUrl = getCanonicalCarShareUrl(car.id, options.publicBaseUrl, dealer.domain);
  const priceInfo = formatVatPriceSummary(car.priceEur, car.vatDeductible);
  const topFeatures = extractKeyFeaturesList(car, 8);

  const headline = `🔥 DISPONIBIL ÎN SHOWROOM: ${car.brand} ${car.model} ${car.versionTrim ? car.versionTrim : ''} (${car.year})`;

  const specsLines = [
    `📌 Ref. Stoc: ${stockRef}`,
    `📅 An fabricație: ${car.year}`,
    `🛣️ Rulaj: ${car.mileageKm.toLocaleString('ro-RO')} km`,
    `⚡ Motorizare: ${car.engineCc > 0 ? `${car.engineCc} cm³` : ''} ${car.fuelType} • ${car.powerHp} CP`,
    `🕹️ Transmisie: ${car.transmission}`,
    `🚘 Tracțiune: ${car.drivetrain}`,
    `🎨 Caroserie: ${car.bodyType} • Culoare: ${car.color || 'Metalizat'}`
  ];
  if (car.vin && car.isVinPublic !== false) {
    specsLines.push(`🔍 Serie Șasiu (VIN): ${car.vin}`);
  }
  const specsText = specsLines.join('\n');

  const featuresText = topFeatures.length > 0
    ? `✨ Dotări de Top & Confort:\n` + topFeatures.map(f => `  ✔ ${f}`).join('\n')
    : '';

  const financeAndWarrantyText = [
    `🛡️ Garanție & Transparență:`,
    `  • Garanție inclusă ${car.warrantyMonths || 12} luni / 10.000 km`,
    `  • Kilometraj garantat juridic pe factura fiscală`,
    `  • Rezervare online securizată exclusiv prin Cont de Garanție (Banca Transilvania)`,
    ``,
    `💳 Opțiuni Finanțare & Rate (Persoane Fizice & Juridice):`,
    `  • Credit auto sau Leasing financiar cu avans de la 0%`,
    `  • Aprobare rapidă în 2 ore prin partenerii noștri (${dealer.financingPartners?.slice(0, 3).join(', ') || 'TBI Bank, BT Direct'})`
  ].join('\n');

  const contact = resolveDealerContact(dealer);
  const ctaAndContactText = [
    `📍 Vezi galeria completă cu toate fotografiile HD și raportul detaliat:`,
    `👉 ${shareUrl}`,
    ``,
    `📞 Contact & Programare Vizionare:`,
    `  • Vânzări (${dealer.generalContactName}): ${contact.salesPhone}`,
    `  • Finanțare & Rate (${dealer.financeContactName}): ${contact.financePhone}`,
    `  • WhatsApp: https://wa.me/${contact.salesWhatsApp}?text=${encodeURIComponent(`Bună ziua, sunt interesat de ${car.brand} ${car.model} (${stockRef})`)}`,
    `  • Adresă: ${dealer.showroomAddress || dealer.address}`
  ].join('\n');

  const fullCopy = [
    headline,
    ``,
    priceInfo,
    ``,
    specsText,
    ``,
    featuresText,
    ``,
    financeAndWarrantyText,
    ``,
    ctaAndContactText,
    ``,
    `#${dealer.name.replace(/[^a-zA-Z0-9]/g, '')} #MasiniCluj #DealerAuto #MasiniRulate #${car.brand} #${car.brand}${car.model.replace(/\s+/g, '')} #ParcAuto`
  ].filter(Boolean).join('\n');

  return {
    headline,
    specsText,
    featuresText,
    financeAndWarrantyText,
    ctaAndContactText,
    fullCopy
  };
}

/**
 * Generator de caption optimizat pentru Instagram (Hook scurt, Carusel, Hashtags)
 */
export function generateInstagramCaption(
  car: VehicleItem,
  dealer: DealerProfile = SEED_DEALER,
  options: SocialCopyOptions = {}
): GeneratedSocialPost['instagram'] {
  const stockRef = getStockNumber(car);
  const shareUrl = getCanonicalCarShareUrl(car.id, options.publicBaseUrl);
  const topFeatures = extractKeyFeaturesList(car, 6);

  const priceFormatted = car.priceEur.toLocaleString('ro-RO');
  const vatNote = car.vatDeductible ? '(TVA 21% deductibil)' : '(Regim marjă)';

  const hook = `Swipe pentru detalii! 👉 ${car.brand} ${car.model} (${car.year}) | ${priceFormatted} € ${vatNote}`;

  const bodyLines = [
    `🚗 ${car.brand} ${car.model} ${car.versionTrim || ''}`,
    `💰 Preț: ${priceFormatted} € ${vatNote}`,
    `📍 Ref: ${stockRef}`,
    ``,
    `▪️ An: ${car.year}`,
    `▪️ Rulaj: ${car.mileageKm.toLocaleString('ro-RO')} km`,
    `▪️ Motor: ${car.engineCc ? `${car.engineCc} cm³ ` : ''}${car.fuelType} (${car.powerHp} CP)`,
    `▪️ Cutie: ${car.transmission}`,
    `▪️ Tracțiune: ${car.drivetrain}`,
    ``,
    `✨ Puncte forte:`,
    ...topFeatures.map(f => `▫️ ${f}`),
    ``,
    `🛡️ Garanție ${car.warrantyMonths || 12} luni inclusă • Rezervare sigură prin Cont de Garanție`,
    `💳 Rate flexibile fără avans prin partenerii noștri financiari.`
  ];

  const body = bodyLines.join('\n');

  const cta = [
    `🔗 Galeria completă de poze HD și fișa tehnică sunt disponibile la link-ul din Bio!`,
    `📩 Trimite-ne un mesaj privat (DM) sau pe WhatsApp la ${dealer.phonePrimary} pentru detalii!`
  ].join('\n');

  // Hashtags relevante (mix local + brand + nișă auto)
  const dealerHashtag = dealer.tiktokHandle 
    ? dealer.tiktokHandle.replace('@', '').toLowerCase() 
    : (dealer.slug || 'autorulate').replace(/[^a-z0-9]/gi, '').toLowerCase();

  const defaultHashtags = [
    dealerHashtag,
    'masinicluj',
    'dealerautocluj',
    'masinirulatecluj',
    'clujnapoca',
    'masinidevanzare',
    'masinirulate',
    'autorulate',
    'autoocazie',
    'leasingauto',
    'finantareauto',
    car.brand.toLowerCase(),
    `${car.brand.toLowerCase()}${car.model.toLowerCase().replace(/\s+/g, '')}`,
    car.bodyType.toLowerCase(),
    'parcautocluj',
    'livrarenationala'
  ];

  const combinedHashtags = Array.from(new Set([...defaultHashtags, ...(options.customHashtags || [])]))
    .map(h => h.startsWith('#') ? h : `#${h}`)
    .slice(0, 25)
    .join(' ');

  const fullCaption = [
    hook,
    ``,
    body,
    ``,
    cta,
    ``,
    combinedHashtags
  ].join('\n');

  return {
    hook,
    body,
    cta,
    hashtags: combinedHashtags,
    fullCaption
  };
}

/**
 * Funcție unificată care returnează ambele formate simultan
 */
export function generateSocialPostBundle(
  car: VehicleItem,
  dealer: DealerProfile = SEED_DEALER,
  options: SocialCopyOptions = {}
): GeneratedSocialPost {
  return {
    facebook: generateFacebookPostCopy(car, dealer, options),
    instagram: generateInstagramCaption(car, dealer, options)
  };
}

/**
 * Generează textul optimizat pentru listarea directă pe OLX.ro și Autovit.ro
 * Include TVA deductibil 21%, dotările tehnice, garanția și datele de contact oficiale.
 */
export function generateAutovitOlxCopy(
  car: VehicleItem,
  dealer: DealerProfile = SEED_DEALER,
  options: SocialCopyOptions = {}
): {
  title: string;
  olxText: string;
  autovitText: string;
} {
  const stockRef = getStockNumber(car);
  const title = `${car.brand} ${car.model} ${car.versionTrim || ''} • ${car.year} • ${car.powerHp} CP • TVA 21%`.replace(/\s+/g, ' ').trim();
  const priceFormatted = car.priceEur.toLocaleString('ro-RO');
  const vatNotice = car.vatDeductible 
    ? `Preț: ${priceFormatted} € (TVA 21% deductibil inclus)` 
    : `Preț: ${priceFormatted} € (TVA nedeductibil, regim marjă)`;

  const prioritizedFeatures = extractKeyFeaturesList(car, 16);
  const featuresList = prioritizedFeatures.slice(0, 16).map(f => `  • ${f}`).join('\n');

  const textBody = [
    `🚘 ${car.brand} ${car.model} (${car.year}) — Showroom ${dealer.name}`,
    `Cod Stoc: ${stockRef}`,
    `----------------------------------------------------`,
    `💰 ${vatNotice}`,
    `📍 Locație: ${dealer.showroomAddress || dealer.address}`,
    `📞 Contact & Programări Test Drive: ${dealer.phonePrimary || '0748892937'}`,
    ``,
    `📋 SPECIFICAȚII TEHNICE:`,
    `  • Kilometraj: ${car.mileageKm.toLocaleString('ro-RO')} km (certificați pe factură fiscală)`,
    `  • An Fabricație: ${car.year}`,
    `  • Motorizare: ${car.engineCc || 1998} cm³ • ${car.powerHp} CP`,
    `  • Cutie de Viteze: ${car.transmission || 'Manuală'}`,
    `  • Combustibil: ${car.fuelType || 'Diesel'}`,
    `  • Tracțiune: ${car.drivetrain || 'Față'}`,
    `  • Serie Șasiu (VIN): ${car.isVinPublic ? car.vin : `${car.vin.slice(0, 7)}********** (istoric carVertical verificat)`}`,
    ``,
    `✨ DOTĂRI & ECHIPAMENTE:`,
    featuresList || `  • Climatizare automată\n  • Senzori parcare\n  • Sistem navigație multimedia\n  • Jante aliaj`,
    ``,
    `🛡️ BENEFICII INCLUSE DE SHOWROOM:`,
    `  ✓ Garanție 12 Luni inclusă (Garanție de Participare / Fără costuri ascunse)`,
    `  ✓ Verificare tehnică completă în peste 50 de puncte`,
    `  ✓ Kilometraj 100% garantat și menționat pe factura fiscală`,
    `  ✓ Posibilitate finanțare Leasing / Credit Auto (aprobare rapidă)`,
    `  ✓ Livrare la domiciliu oriunde în România`,
    ``,
    `🏢 ${dealer.name} • ${dealer.email || (dealer.domain ? `contact@${dealer.domain}` : 'contact@showroom.ro')}`
  ].join('\n');

  return {
    title,
    olxText: textBody,
    autovitText: textBody
  };
}
