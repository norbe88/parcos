/**
 * src/utils/olxPosterPayload.ts
 * Generator de payload și utilitare de extracție pentru publicarea pe OLX România (olx.ro/adding/)
 * 
 * Invariante CARVANA SRL & RXM Automobile:
 * - Strict 21% TVA (VAT_RATE = 0.21) pentru autovehiculele cu TVA deductibil
 * - Terminologie de securitate: "Cont de Garanție" (niciodată "escrow")
 * - Format monedă OLX: simbolul "€" sau "lei" (NU "EUR" sau "RON")
 * - Număr maxim de imagini permise pe OLX: STRICT 8 fotografii
 * - Autoprelungire anunț: implicit FALSE (evitarea costurilor neprevăzute pentru dealer)
 */

import { VehicleItem } from '../db/seed';
import { DealerProfile } from '../db/types';
import { getPrioritizedShowroomFeatures } from './vehicleDescriptionGenerator';

export interface OlxVehiclePayload {
  title: string;
  brand: string;
  model: string;
  carBody: string; // Berlina, Break, SUV, Coupe, Monovolum, Cabriolet, Combi, etc.
  color: string; // Negru, Alb, Gri, Albastru, Rosu, Argintiu, etc.
  doors: string; // "4", "5", "2", "3"
  fuel: 'Diesel' | 'Benzina' | 'Hibrid' | 'Electric' | 'GPL';
  gearbox: 'automat' | 'manual';
  state: 'used' | 'new';
  steeringWheel: 'lhd' | 'rhd';
  registration: 'registered' | 'unregistered';
  sellerType: 'business'; // Firmă
  engineCc?: number;
  powerHp?: number;
  year: number;
  mileageKm: number;
  vin?: string;
  price: number;
  currency: '€' | 'lei';
  negotiable: boolean;
  autoExtension: boolean; // default false
  location: string;
  contactPerson: string;
  contactPhone: string;
  description: string;
  photos: string[]; // max 8
  exportedAt: string;
  vehicleId: string;
  origin?: string;
}

/**
 * Mapează tipul de caroserie intern ParcOS la opțiunile recunoscute de selectorul OLX
 */
export function mapToOlxCarBody(rawBody?: string): string {
  if (!rawBody) return 'Berlina';
  const b = rawBody.toLowerCase();
  if (b.includes('suv') || b.includes('crossover')) return 'SUV';
  if (b.includes('break') || b.includes('combi') || b.includes('touring') || b.includes('avant') || b.includes('estate')) return 'Break';
  if (b.includes('coupe') || b.includes('coupé')) return 'Coupe';
  if (b.includes('cabrio') || b.includes('convertible') || b.includes('roadster')) return 'Cabriolet';
  if (b.includes('monovolum') || b.includes('van') || b.includes('mpv')) return 'Monovolum';
  if (b.includes('hatchback')) return 'Hatchback';
  return 'Berlina';
}

/**
 * Mapează culoarea internă la opțiunile standardizate OLX
 */
export function mapToOlxColor(rawColor?: string): string {
  if (!rawColor) return 'Negru';
  const c = rawColor.toLowerCase();
  if (c.includes('alb') || c.includes('white')) return 'Alb';
  if (c.includes('gri') || c.includes('grey') || c.includes('gray')) return 'Gri';
  if (c.includes('argintiu') || c.includes('silver')) return 'Argintiu';
  if (c.includes('albastr') || c.includes('blue')) return 'Albastru';
  if (c.includes('rosu') || c.includes('red') || c.includes('roșu')) return 'Rosu';
  if (c.includes('maro') || c.includes('brown')) return 'Maro';
  if (c.includes('verde') || c.includes('green')) return 'Verde';
  if (c.includes('galben') || c.includes('yellow')) return 'Galben';
  if (c.includes('portocaliu') || c.includes('orange')) return 'Portocaliu';
  return 'Negru';
}

/**
 * Mapează combustibilul la opțiunile standardizate OLX
 */
export function mapToOlxFuel(rawFuel?: string): 'Diesel' | 'Benzina' | 'Hibrid' | 'Electric' | 'GPL' {
  if (!rawFuel) return 'Diesel';
  const f = rawFuel.toLowerCase();
  if (f.includes('diesel') || f.includes('motorină')) return 'Diesel';
  if (f.includes('hibrid') || f.includes('hybrid') || f.includes('phev')) return 'Hibrid';
  if (f.includes('electric') || f.includes('ev')) return 'Electric';
  if (f.includes('gpl') || f.includes('lpg')) return 'GPL';
  return 'Benzina';
}

/**
 * Mapează tipul de transmisie / titlu la opțiunea OLX ('automat' | 'manual')
 */
export function mapToOlxGearbox(rawTransmission?: string, title?: string): 'automat' | 'manual' {
  const t = (rawTransmission || '').toLowerCase();
  const tit = (title || '').toLowerCase();
  if (
    t.includes('auto') ||
    t.includes('dsg') ||
    t.includes('step') ||
    t.includes('tip') ||
    t.includes('s-tronic') ||
    t.includes('stronic') ||
    t.includes('edc') ||
    t.includes('pdk') ||
    t.includes('7g') ||
    t.includes('9g') ||
    tit.includes('automat') ||
    tit.includes('dsg')
  ) {
    return 'automat';
  }
  return 'manual';
}

/**
 * Curăță modelul de prefixul mărcii dacă există (ex: "Dacia Duster" -> "Duster")
 */
export function cleanCarModel(brand?: string, model?: string): string {
  if (!model) return '';
  let cleanM = model.trim();
  const b = (brand || '').trim().toLowerCase();
  if (b && cleanM.toLowerCase().startsWith(b)) {
    cleanM = cleanM.slice(b.length).trim();
  }
  return cleanM || model.trim();
}

/**
 * Curăță și elimină redundanțele de marcă/model din versiune/echipare (version_trim)
 */
export function cleanCarTrim(brand?: string, model?: string, trim?: string): string {
  if (!trim) return '';
  let cleanTrim = trim.trim();
  const b = (brand || '').trim().toLowerCase();
  const m = (model || '').trim().toLowerCase();
  const combined = `${b} ${m}`.trim();

  // 1. Dacă trim-ul începe cu marca + model (ex: "Dacia Duster 1.2 TCe")
  if (combined && cleanTrim.toLowerCase().startsWith(combined)) {
    cleanTrim = cleanTrim.slice(combined.length).trim();
  }
  // 2. Dacă trim-ul începe cu modelul (ex: "Duster 1.5 dCi")
  else if (m && cleanTrim.toLowerCase().startsWith(m)) {
    cleanTrim = cleanTrim.slice(m.length).trim();
  }
  // 3. Dacă trim-ul începe cu marca (ex: "Dacia 1.2 TCe")
  else if (b && cleanTrim.toLowerCase().startsWith(b)) {
    cleanTrim = cleanTrim.slice(b.length).trim();
  }

  // 4. Dacă după curățare este identic cu brand, model sau marca+model
  const lower = cleanTrim.toLowerCase();
  if (lower === b || lower === m || lower === combined) {
    cleanTrim = '';
  }

  return cleanTrim;
}

/**
 * Elimină repetițiile accidentale de cuvinte și fraze consecutive (ex: "Dacia Duster Dacia Duster" -> "Dacia Duster")
 */
export function deduplicateRepeatedPhrases(text: string): string {
  if (!text) return '';
  let result = text.replace(/\s+/g, ' ').trim();
  result = result.replace(/\b([a-zA-Z0-9_-]+)\s+\1\b/gi, '$1');
  result = result.replace(/\b([a-zA-Z0-9_-]+\s+[a-zA-Z0-9_-]+)\s+\1\b/gi, '$1');
  result = result.replace(/\b([a-zA-Z0-9_-]+\s+[a-zA-Z0-9_-]+\s+[a-zA-Z0-9_-]+)\s+\1\b/gi, '$1');
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Generează titlul comercial optimizat pentru indexare și căutare pe OLX (max 70 caractere)
 */
export function generateOlxTitle(car: VehicleItem): string {
  const brand = car.brand.trim();
  const rawModel = car.model.trim();
  const model = cleanCarModel(brand, rawModel);
  const trim = cleanCarTrim(brand, model, car.versionTrim);
  const isAuto = car.transmission?.toLowerCase().includes('auto');
  const engine = car.engineCc ? `${(car.engineCc / 1000).toFixed(1)}` : '';
  const year = car.year;

  // Încercăm varianta completă
  let fullTitle = `${brand} ${model} ${trim} ${isAuto ? 'Automat' : ''} ${engine ? `${engine}L` : ''} ${year}`.replace(/\s+/g, ' ').trim();
  fullTitle = deduplicateRepeatedPhrases(fullTitle);
  if (fullTitle.length <= 70) {
    return fullTitle;
  }

  // Fallback mai scurt dacă depășește 70 caractere
  let shorterTitle = `${brand} ${model} ${trim} ${year}`.replace(/\s+/g, ' ').trim();
  shorterTitle = deduplicateRepeatedPhrases(shorterTitle);
  if (shorterTitle.length <= 70) {
    return shorterTitle;
  }

  let minimalTitle = `${brand} ${model} ${isAuto ? 'Automat' : ''} ${year}`.replace(/\s+/g, ' ').trim();
  return deduplicateRepeatedPhrases(minimalTitle).slice(0, 70);
}

/**
 * Selectează până la 8 imagini optime pentru galeria OLX
 */
export function pickRecommendedOlxPhotos(images: string[]): string[] {
  if (!images || images.length === 0) return [];
  if (images.length <= 8) return [...images];

  // Algoritm de eșantionare echilibrat (față, interior, spate, detalii)
  // Dacă avem 15-20 poze, alegem:
  // 0: Hero față dreapta
  // 1: Spate/lateral
  // 2: Lateral complet
  // 3: Bord/volan
  // 4: Scaune față
  // 5: Consolă navigație
  // 6: Banchetă spate
  // 7: Detaliu jantă / motor
  const step = Math.floor(images.length / 8);
  const picked: string[] = [];
  for (let i = 0; i < 8; i++) {
    const idx = Math.min(i * step, images.length - 1);
    if (!picked.includes(images[idx])) {
      picked.push(images[idx]);
    }
  }
  // Completăm până la 8 dacă au existat duplicate
  for (const img of images) {
    if (picked.length >= 8) break;
    if (!picked.includes(img)) {
      picked.push(img);
    }
  }
  return picked.slice(0, 8);
}

export interface OlxDealerTemplateConfig {
  includeFinancing: boolean;
  includeWarranty: boolean;
  warrantyMonths: number;
  includeContGarantie: boolean;
  includeBuyBack: boolean;
  includeDelivery: boolean;
  includeVinInText: boolean;
  customHeader?: string;
  customFooter?: string;
  customNotes?: string;
}

export const DEFAULT_OLX_TEMPLATE_CONFIG: OlxDealerTemplateConfig = {
  includeFinancing: true,
  includeWarranty: true,
  warrantyMonths: 12,
  includeContGarantie: true,
  includeBuyBack: true,
  includeDelivery: true,
  includeVinInText: true,
  customHeader: '',
  customFooter: '',
  customNotes: ''
};

export function getDealerOlxTemplate(dealerId?: string): OlxDealerTemplateConfig {
  if (typeof window === 'undefined') return DEFAULT_OLX_TEMPLATE_CONFIG;
  try {
    const key = dealerId ? `parcos_olx_dealer_template_${dealerId}` : 'parcos_olx_dealer_template_default';
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_OLX_TEMPLATE_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_OLX_TEMPLATE_CONFIG;
}

export function saveDealerOlxTemplate(config: OlxDealerTemplateConfig, dealerId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = dealerId ? `parcos_olx_dealer_template_${dealerId}` : 'parcos_olx_dealer_template_default';
    localStorage.setItem(key, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('parcos-olx-template-changed', { detail: config }));
  } catch (e) {}
}

export interface OlxDescriptionOptions {
  includeFinancing?: boolean;
  includeWarranty?: boolean;
  warrantyMonths?: number;
  includeBuyBack?: boolean;
  includeDelivery?: boolean;
  includeVinInText?: boolean;
  includeContGarantie?: boolean;
  customHeader?: string;
  customFooter?: string;
  customNotes?: string;
}

/**
 * Generează descrierea comercială persuasivă și structurată pentru anunțul OLX
 */
export function generateOlxDescription(
  car: VehicleItem,
  dealer?: DealerProfile,
  options: OlxDescriptionOptions = {}
): string {
  const {
    includeFinancing = true,
    includeWarranty = true,
    warrantyMonths = 12,
    includeBuyBack = true,
    includeDelivery = true,
    includeVinInText = true,
    includeContGarantie = true,
    customHeader = '',
    customFooter = '',
    customNotes = ''
  } = options;

  const brand = car.brand.trim();
  const rawModel = car.model.trim();
  const model = cleanCarModel(brand, rawModel);
  const trim = cleanCarTrim(brand, model, car.versionTrim);
  const year = car.year;
  const mileageKm = car.mileageKm ? Number(car.mileageKm).toLocaleString('ro-RO') : '0';
  const engineCc = car.engineCc ? `${car.engineCc} cmc` : '';
  const powerHp = car.powerHp ? `${car.powerHp} CP` : '';
  const fuel = car.fuelType || 'Diesel';
  const transmission = car.transmission || 'Transmisie Automata';
  const dealerName = dealer?.name || 'RXM Automobile Cluj-Napoca';
  const phone = formatPhoneForOlx(dealer?.phonePrimary || '0748 892 937');
  const address = dealer?.address || dealer?.showroomAddress || 'Cluj-Napoca, jud. Cluj';

  let headerTitle = `${brand} ${model}${trim ? ` ${trim}` : ''} (${year})`;
  headerTitle = deduplicateRepeatedPhrases(headerTitle);

  let text = `${headerTitle.toUpperCase()}\n`;
  text += `Parc Auto Partener Autorizat - ${dealerName}\n\n`;

  if (customHeader.trim()) {
    text += `${customHeader.trim()}\n\n`;
  }

  text += `SPECIFICATII TEHNICE PRINCIPALE:\n`;
  text += `- Rulaj garantat pe factura: ${mileageKm} km\n`;
  text += `- An fabricatie: ${year}\n`;
  text += `- Motorizare: ${engineCc} ${fuel} ${powerHp ? `(${powerHp})` : ''}\n`;
  text += `- Transmisie: ${transmission}\n`;
  if (car.drivetrain) {
    text += `- Tractiune: ${car.drivetrain}\n`;
  }
  if (car.vatDeductible) {
    text += `- Regim fiscal: TVA deductibil 21% inclus in pret (eligibil deducere integrala persoane juridice)\n`;
  } else {
    text += `- Regim fiscal: Regim special al marjei (TVA inclus si nedeductibil conform Codului Fiscal Art. 312)\n`;
  }
  if (includeVinInText && car.vin) {
    const cleanVin = car.vin.replace(/\*/g, 'X');
    text += `- Serie de sasiu (VIN): ${cleanVin}\n`;
  }
  text += `\n`;

  // Dotări selectate prioritizate (fără zgomot)
  const rawFeatures: string[] = Array.isArray(car.features)
    ? car.features
    : car.features && typeof car.features === 'object'
      ? [
          ...(Array.isArray((car.features as any).safety) ? (car.features as any).safety : []),
          ...(Array.isArray((car.features as any).comfort) ? (car.features as any).comfort : []),
          ...(Array.isArray((car.features as any).multimedia) ? (car.features as any).multimedia : []),
          ...(Array.isArray((car.features as any).dynamic) ? (car.features as any).dynamic : [])
        ]
      : [];

  const features = getPrioritizedShowroomFeatures(rawFeatures);
  if (features.length > 0) {
    text += `DOTARI SI OPTIONALE RELEVANTE:\n`;
    features.slice(0, 12).forEach(f => {
      text += `- ${f}\n`;
    });
    if (features.length > 12) {
      text += `- Pachet complet cu ${features.length} dotari verificabile la vizionare in showroom.\n`;
    }
    text += `\n`;
  }

  // Finanțare în rate
  if (includeFinancing) {
    text += `FINANTARE IN RATE RAPIDE & LEASING AUTO:\n`;
    text += `- Aprobare online rapida in 1-2 ore, doar cu buletinul, fara adeverinta de venit obligatorie\n`;
    text += `- Parteneri financiari oficiali: TBI Bank, Banca Transilvania (BT Direct), UniCredit Consumer Financing\n`;
    text += `- Posibilitate finantare cu Avans 0% pe o perioada de pana la 60 luni cu rate fixe\n`;
    text += `- Eligibil pentru persoane fizice, contracte de munca externe (diurne), pensionari sau persoane juridice (SRL / PFA)\n\n`;
  }

  // Garanție și siguranță
  if (includeWarranty || includeContGarantie) {
    text += `SIGURANTA & GARANTIE:\n`;
    if (includeWarranty) {
      text += `- Garantie comerciala scrisa de ${warrantyMonths} luni inclusa in pret (fara costuri ascunse)\n`;
    }
    if (includeContGarantie) {
      text += `- Tranzactie 100% securizata: acceptam plata prin Cont de Garantie sau transfer bancar securizat\n`;
    }
    text += `- Kilometraj atestat contractual si trecut expres pe factura fiscala\n`;
    text += `- Autoturism inspectat tehnic in atelier autorizat (acceptam orice testare autorizata)\n\n`;
  }

  // Buy-back și livrare
  if (includeBuyBack || includeDelivery) {
    text += `SERVICII SUPLIMENTARE SHOWROOM:\n`;
    if (includeBuyBack) {
      text += `- BUY-BACK / TRADE-IN: preluam masina dumneavoastra actuala ca avans pentru masina noua\n`;
    }
    if (includeDelivery) {
      text += `- Numere provizorii (rosii) eliberate pe loc sau transport asigurat pe platforma oriunde in Romania\n`;
    }
    text += `\n`;
  }

  if (customNotes.trim()) {
    text += `NOTE SPECIALE DEALER:\n${customNotes.trim()}\n\n`;
  }

  if (customFooter.trim()) {
    text += `${customFooter.trim()}\n\n`;
  }

  text += `VIZIONARE & TEST DRIVE:\n`;
  text += `Locatie parc auto: ${address}\n`;
  text += `Informatii si programari test drive: ${phone}\n`;

  return sanitizeForOlx(text);
}

/**
 * Formatează numărul de telefon conform cerințelor de afișare și anti-mascare OLX:
 * 0748_892_937 (grupuri de 4_3_3 separate prin underscore)
 */
export function formatPhoneForOlx(rawPhone?: string): string {
  if (!rawPhone) return '0748_892_937';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0040')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('40') && digits.length >= 11) {
    digits = digits.slice(2);
  }
  if (digits.length === 9 && digits.startsWith('7')) {
    digits = '0' + digits;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}_${digits.slice(4, 7)}_${digits.slice(7, 10)}`;
  }
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (last10.startsWith('07')) {
      return `${last10.slice(0, 4)}_${last10.slice(4, 7)}_${last10.slice(7, 10)}`;
    }
  }
  return rawPhone.trim();
}

/**
 * Curăță descrierea pentru a respecta strict validatorul OLX România:
 * "Scrie doar litere si cifre (fara caractere speciale)"
 * Păstrează underscore-ul '_' pentru formatul numerelor de telefon (0748_892_937).
 */
export function sanitizeForOlx(text: string): string {
  if (!text) return '';

  let cleaned = text
    // 0. Formatare automată a numerelor de telefon în formatul cerut de OLX (07xx_xxx_xxx)
    .replace(/(?:(?:\+?40|0040)\s*|0)(7\d{2})[\s.\-_]?(\d{3})[\s.\-_]?(\d{3})\b/g, '0$1_$2_$3')
    // 1. Înlocuire superscript / subscript
    .replace(/cm³/gi, 'cmc')
    .replace(/m³/gi, 'm3')
    .replace(/³/g, '3')
    .replace(/²/g, '2')
    // 2. Înlocuire bullet points și simboluri grafice cu cratimă normală
    .replace(/[•●○◦‣⁃*]/g, '-')
    .replace(/[✔✓☑]/g, '-')
    // 3. Înlocuire em-dash, en-dash, tilde cu cratimă normală (păstrăm underscore-ul _ pentru numere de telefon)
    .replace(/[—–~]/g, '-')
    // 4. Înlocuire paranteze pătrate sau acolade cu paranteze rotunde
    .replace(/[\[\{]/g, '(')
    .replace(/[\]\}]/g, ')')
    // 5. Înlocuire ghilimele speciale
    .replace(/[„”«»]/g, '"')
    .replace(/[''‚‛]/g, "'")
    // 6. Eliminare secvențe decorative de egal sau minus repetat (=== sau ---)
    .replace(/={2,}/g, '')
    // 7. Eliminare completă a tuturor emoji-urilor și simbolurilor speciale Unicode
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
    // 8. Filtrare strictă: permitem DOAR litere (inclusiv diacritice românești), cifre, spații, newlines, underscore și semne uzuale de punctuație
    .replace(/[^\p{L}\p{N}\s.,:;!?()\-/%+&"'_]/gu, ' ')
    // 9. Curățare spații multiple pe aceeași linie
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}
