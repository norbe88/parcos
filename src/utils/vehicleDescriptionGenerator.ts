import { DealerProfile } from '../db/types';
import { SEED_DEALER } from '../db/dealer';
/**
 * RXM AUTOMOBILE — Smart Vehicle Description Generator
 * Generator profesional de descrieri auto pentru showroom și canale media.
 * 
 * Fundamentat pe benchmark-ul celor mai de succes dealeri (Carvana, Autohero, Mobile.de)
 * și adaptat pentru specificul pieței din România (RXM Automobile Cluj-Napoca).
 * 
 * Invariante:
 * - Fără texte redundante despre condiții de creditare (diurne, birou de credit, etc.) - acestea există deja în secțiunea de rate.
 * - TVA 21% reflectat corect pentru mașinile cu TVA deductibil (VAT_RATE = 0.21).
 * - Menționare clară garanție 12-36 luni și transport național / numere roșii.
 */

export interface VehicleDescriptionParams {
  brand: string;
  model: string;
  versionTrim?: string;
  year: number;
  mileageKm?: number;
  priceEur?: number;
  vatDeductible?: boolean;
  fuelType?: string;
  transmission?: string;
  powerHp?: number;
  engineCc?: number;
  drivetrain?: string;
  bodyType?: string;
  color?: string;
  selectedFeatures?: string[];
  hasRedPlates?: boolean;
  warrantyMonths?: 12 | 24 | 36;
  civNumber?: string;
  vin?: string;
}

export type DescriptionTone = 'editorial' | 'technical' | 'social';

export interface GenerateDescriptionOptions {
  tone?: DescriptionTone;
  includeShowroomLocation?: boolean;
  includeWarranty?: boolean;
  includeDelivery?: boolean;
  dealer?: DealerProfile;
}

import { isInvalidCorruptedFeature } from './featuresCatalogService';
import { isTrivialNoiseFeature } from './equipmentSheetOcrEngine';

/**
 * Filtrează zgomotul și ordonează dotările după impactul comercial (Hero Scoring)
 */
export function getPrioritizedShowroomFeatures(features: string[]): string[] {
  const HIGH_IMPACT_WEIGHTS: Array<[RegExp, number]> = [
    [/bose|harman|burmester|bang\s*&\s*olufsen|audio\s*premium/i, 100],
    [/matrix|laser|full\s*led|adaptiv.*led/i, 95],
    [/head-?up|hud/i, 90],
    [/360|surround\s*view|area\s*view/i, 88],
    [/distronic|acc|pilot\s*automat\s*adaptiv/i, 85],
    [/hayon\s*electric|portbagaj\s*electric/i, 82],
    [/scaun.*[iî]nc[aă]lzit|sitzheizung|ventilati|memori/i, 80],
    [/volan.*[iî]nc[aă]lzit|lenkradheizung/i, 78],
    [/unghi\s*mort|blind\s*spot|absm|rcta/i, 75],
    [/panoram|trap[aă]|sunroof/i, 75],
    [/carplay|android\s*auto|virtual\s*cockpit|bord\s*digital/i, 72],
    [/pachet.*(m-?sport|s-?line|r-?line|amg)/i, 70],
    [/jante.*(1[89]|20|21)/i, 65],
    [/keyless|confort\s*acces|kessy/i, 65],
    [/climatronic/i, 60],
    [/c[aâ]rlig/i, 55]
  ];

  // 1. Eliminare artefacte corupte și zgomot banal (mufă 12V, suport pahare etc.)
  const validFeatures = features.filter(f => {
    return Boolean(f) && !isInvalidCorruptedFeature(f) && !isTrivialNoiseFeature(f);
  });

  // 2. Calcul scor de relevanță pentru fiecare dotare
  const scored = validFeatures.map(feat => {
    let score = 10; // scor de bază
    for (const [rx, weight] of HIGH_IMPACT_WEIGHTS) {
      if (rx.test(feat)) {
        score = Math.max(score, weight);
      }
    }
    return { feat, score };
  });

  // 3. Sortare descrescătoare după scor
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.feat);
}

/**
 * Grupează dotările pe categorii funcționale pentru un aspect curat și aerisit
 */
export function categorizeFeatures(features: string[]) {
  const safetyKeywords = /senzor|asistent|camer|distronic|lane|led|xenon|front|sign|pilot|braking|abs|esp|isofix|unghi|bsm|absm|matrix|frana|hold/i;
  const comfortKeywords = /scaun|climatronic|plafon|trap|masaj|piele|keyless|memori|volan|oglinzi|portbagaj|hayon|webasto|confort|geamuri|incalzit/i;
  const techKeywords = /virtual|cockpit|navig|audio|carplay|bose|harman|logic|bluetooth|usb|ecran|touch|head-?up|hud|dab|radio|boxe/i;

  const safety: string[] = [];
  const comfort: string[] = [];
  const tech: string[] = [];
  const dynamic: string[] = [];

  features.forEach(feat => {
    if (isInvalidCorruptedFeature(feat)) return;
    if (safetyKeywords.test(feat)) {
      safety.push(feat);
    } else if (comfortKeywords.test(feat)) {
      comfort.push(feat);
    } else if (techKeywords.test(feat)) {
      tech.push(feat);
    } else {
      dynamic.push(feat);
    }
  });

  return { safety, comfort, tech, dynamic };
}

/**
 * Generează descrierea completă a vehiculului pe baza parametrilor furnizați
 */
export function generateVehicleDescription(
  params: VehicleDescriptionParams,
  options: GenerateDescriptionOptions = {}
): string {
  const {
    tone = 'editorial',
    includeShowroomLocation = true,
    includeWarranty = true,
    includeDelivery = true,
    dealer = SEED_DEALER
  } = options;
  const dealerBrand = (dealer?.name || 'Showroom').split(' ')[0];
  const showroomLocation = dealer?.showroomAddress || dealer?.address || 'Cluj-Napoca';
  const contactPhone = dealer?.phonePrimary || dealer?.whatsappNumber || dealer?.phoneSecondary || '';

  const brand = (params.brand || 'Autoturism').trim();
  const model = (params.model || '').trim();
  const versionTrim = (params.versionTrim || '').trim();
  const year = params.year || new Date().getFullYear();
  const mileageKm = params.mileageKm ? Number(params.mileageKm) : 0;
  const formattedMileage = mileageKm > 0 ? `${mileageKm.toLocaleString('ro-RO')} km` : 'Rulaj certificat';
  const powerHp = params.powerHp ? `${params.powerHp} CP` : '';
  const engineCc = params.engineCc ? `${params.engineCc} cm³` : '';
  const fuelType = params.fuelType || 'Combustibil verificat';
  const transmission = params.transmission || 'Transmisie automată';
  const drivetrain = params.drivetrain && params.drivetrain !== 'Față' ? `• Tracțiune ${params.drivetrain}` : '';
  const warranty = params.warrantyMonths || 12;
  const rawFeatures = params.selectedFeatures || [];
  const isVat = !!params.vatDeductible;

  // Dotări filtrate de zgomot și ordonate după impact
  const prioritizedFeatures = getPrioritizedShowroomFeatures(rawFeatures);

  // 1. TON EDITORIAL SHOWROOM (Standardul de Aur — Elegant, Curat, Persuasiv)
  if (tone === 'editorial') {
    const titleHeader = `${brand} ${model}${versionTrim ? ` ${versionTrim}` : ''} (${year})`;
    const technicalSummary = [engineCc, fuelType, powerHp, transmission, drivetrain].filter(Boolean).join(' • ');

    let text = `${titleHeader} — exemplar certificat disponibil în showroom-ul ${dealer?.name || 'nostru'}.\n`;
    text += `${technicalSummary} | ${formattedMileage} garantați pe factură fiscală.\n\n`;

    text += `Autoturismul se prezintă într-o stare tehnică și estetică remarcabilă, beneficiind de istoric verificat și revizie la zi. Fără vicii ascunse sau elemente structurale afectate, gata de drum.\n\n`;

    if (prioritizedFeatures.length > 0) {
      text += `Pachet Dotări Cheie Evidențiate:\n`;
      const displayFeatures = prioritizedFeatures.slice(0, 10);
      displayFeatures.forEach(feat => {
        text += `• ${feat}\n`;
      });
      if (rawFeatures.length > displayFeatures.length) {
        text += `• Și multe altele (+ ${rawFeatures.length - displayFeatures.length} dotări de confort și siguranță în fișa tehnică a vehiculului)\n`;
      }
      text += `\n`;
    }

    if (isVat) {
      text += `💼 Regim Fiscal B2B:\n`;
      text += `• TVA deductibil (21%) inclus pe factura fiscală. Posibilitate deducere integrală pentru persoane juridice eligibile.\n\n`;
    }

    if (includeWarranty || includeDelivery) {
      text += `🛡️ Servicii & Siguranță Incluse ${dealerBrand}:\n`;
      if (includeWarranty) {
        text += `• Garanție scrisă de conformitate ${warranty} luni inclusă în preț (fără costuri ascunse)\n`;
      }
      text += `• Kilometraj garantat contractual trecut expres pe documentele de vânzare\n`;
      text += `• Verificare mecanică detaliată (acceptăm orice testare autorizată pe elevator)\n`;
      if (includeDelivery) {
        text += `• Eliberare numere roșii provizorii pe loc sau transport gratuit pe platformă oriunde în România\n`;
      }
      text += `\n`;
    }

    if (includeShowroomLocation) {
      text += `Disponibil pentru vizionare și test drive în parcul auto ${dealer?.name || 'nostru'} (${showroomLocation}).`;
    }

    return text.trim();
  }

  // 2. TON SINTETIC & TEHNIC (Bullet Points — Rapid, Direct, Structurat)
  if (tone === 'technical') {
    let text = `=== ${brand.toUpperCase()} ${model.toUpperCase()}${versionTrim ? ` ${versionTrim.toUpperCase()}` : ''} (${year}) ===\n\n`;

    text += `⚙️ DATE TEHNICE CHEIE:\n`;
    text += `• Motorizare: ${engineCc || 'Standard'} ${fuelType} ${powerHp ? `(${powerHp})` : ''}\n`;
    text += `• Cutie de viteze: ${transmission}\n`;
    if (params.drivetrain) {
      text += `• Tracțiune: ${params.drivetrain}\n`;
    }
    text += `• Rulaj odometru: ${formattedMileage} (certificat cu istoric service)\n`;
    text += `• An fabricație: ${year}\n`;
    text += `• Regim TVA: ${isVat ? 'TVA Deductibil (21%) pe factură' : 'Regim Special de Marjă (TVA inclus)'}\n\n`;

    if (prioritizedFeatures.length > 0) {
      text += `✨ PACHET DOTĂRI & OPȚIONALE RELEVANTE:\n`;
      prioritizedFeatures.slice(0, 15).forEach(feat => {
        text += `• ${feat}\n`;
      });
      if (rawFeatures.length > 15) {
        text += `• Fișă completă cu ${rawFeatures.length} dotări din fabrică disponibilă în showroom.\n`;
      }
      text += `\n`;
    }

    text += `📋 BENEFICII INCLUSE ÎN PREȚ:\n`;
    text += `• Garanție scrisă ${warranty} luni inclusă (posibilitate extindere 24/36 luni)\n`;
    text += `• Istoric transparent și kilometraj menționat pe factură\n`;
    text += `• Numere roșii provizorii pe loc / Transport asigurat pe platformă\n`;
    text += `• Verificare tehnică pe elevator și test drive (${showroomLocation}).`;

    return text.trim();
  }

  // 3. TON SOCIAL MEDIA / VIDEO SCRIPT (Captivant, Alert, Emojis, Optimizat Reels/TikTok)
  if (tone === 'social') {
    let text = `🔥 NOU ÎN SHOWROOM: ${brand} ${model}${versionTrim ? ` ${versionTrim}` : ''} (${year})!\n\n`;
    text += `💎 ${powerHp || 'Performanță garantată'} • ${transmission} • ${formattedMileage}\n\n`;

    if (prioritizedFeatures.length > 0) {
      text += `Top Opționale:\n`;
      prioritizedFeatures.slice(0, 6).forEach(feat => {
        text += `✔️ ${feat}\n`;
      });
      text += `\n`;
    }

    text += `✅ Garanție comercială ${warranty} luni inclusă\n`;
    text += isVat ? `✅ TVA deductibil 21% pe factură fiscală\n` : `✅ Kilometraj 100% garantat contractual\n`;
    text += `✅ Livrare gratuită la domiciliu oriunde în România sau numere roșii pe loc!\n\n`;
    text += `📍 Vizionare & Test Drive: ${showroomLocation}\n`;
    text += `📞 Contact Showroom: ${contactPhone}${dealer?.phoneFinance ? ' / ' + dealer.phoneFinance : ''}`;

    return text.trim();
  }

  return '';
}
