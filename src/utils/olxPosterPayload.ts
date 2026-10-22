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
 * Generează titlul comercial optimizat pentru indexare și căutare pe OLX (max 70 caractere)
 */
export function generateOlxTitle(car: VehicleItem): string {
  const brand = car.brand.trim();
  const model = car.model.trim();
  const trim = (car.versionTrim || '').trim();
  const isAuto = car.transmission?.toLowerCase().includes('auto');
  const engine = car.engineCc ? `${(car.engineCc / 1000).toFixed(1)}` : '';
  const year = car.year;

  // Încercăm varianta completă
  let fullTitle = `${brand} ${model} ${trim} ${isAuto ? 'Automat' : ''} ${engine ? `${engine}L` : ''} ${year}`.replace(/\s+/g, ' ').trim();
  if (fullTitle.length <= 70) {
    return fullTitle;
  }

  // Fallback mai scurt dacă depășește 70 caractere
  let shorterTitle = `${brand} ${model} ${isAuto ? 'Automat' : ''} ${year}`.replace(/\s+/g, ' ').trim();
  return shorterTitle.slice(0, 70);
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

export interface OlxDescriptionOptions {
  includeFinancing?: boolean;
  includeWarranty?: boolean;
  includeBuyBack?: boolean;
  includeDelivery?: boolean;
  includeVinInText?: boolean;
  includeContGarantie?: boolean;
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
    includeBuyBack = true,
    includeDelivery = true,
    includeVinInText = true,
    includeContGarantie = true,
    customNotes = ''
  } = options;

  const brand = car.brand.toUpperCase();
  const model = car.model.toUpperCase();
  const trim = (car.versionTrim || '').toUpperCase();
  const year = car.year;
  const mileageKm = car.mileageKm ? Number(car.mileageKm).toLocaleString('ro-RO') : '0';
  const engineCc = car.engineCc ? `${car.engineCc} cm³` : '';
  const powerHp = car.powerHp ? `${car.powerHp} CP` : '';
  const fuel = car.fuelType || 'Diesel';
  const transmission = car.transmission || 'Transmisie Automată';
  const dealerName = dealer?.name || 'RXM Automobile Cluj-Napoca';
  const phone = dealer?.phonePrimary || '0748 892 937';
  const address = dealer?.address || dealer?.showroomAddress || 'Cluj-Napoca, jud. Cluj';

  let text = `=== ${brand} ${model}${trim ? ` ${trim}` : ''} (${year}) ===\n`;
  text += `Parc Auto Partener Autorizat — ${dealerName}\n\n`;

  text += `📌 SPECIFICAȚII TEHNICE PRINCIPALE:\n`;
  text += `• Rulaj garantat pe factură: ${mileageKm} km\n`;
  text += `• An fabricație: ${year}\n`;
  text += `• Motorizare: ${engineCc} ${fuel} ${powerHp ? `(${powerHp})` : ''}\n`;
  text += `• Transmisie: ${transmission}\n`;
  if (car.drivetrain) {
    text += `• Tracțiune: ${car.drivetrain}\n`;
  }
  if (car.vatDeductible) {
    text += `• Regim fiscal: TVA deductibil 21% inclus în preț (eligibil deducere integrală persoane juridice)\n`;
  } else {
    text += `• Regim fiscal: Regim special al marjei (TVA inclus și nedeductibil conform Codului Fiscal Art. 312)\n`;
  }
  if (includeVinInText && car.vin) {
    text += `• Serie de șasiu (VIN): ${car.vin}\n`;
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
    text += `✨ DOTĂRI ȘI OPȚIONALE RELEVANTE:\n`;
    features.slice(0, 12).forEach(f => {
      text += `✔ ${f}\n`;
    });
    if (features.length > 12) {
      text += `✔ Pachet complet cu ${features.length} dotări verificabile la vizionare în showroom.\n`;
    }
    text += `\n`;
  }

  // Finanțare în rate
  if (includeFinancing) {
    text += `💳 FINANȚARE ÎN RATE RAPIDE & LEASING AUTO:\n`;
    text += `• Aprobare online rapidă în 1-2 ore, doar cu buletinul, fără adeverință de venit obligatorie\n`;
    text += `• Parteneri financiari oficiali: TBI Bank, Banca Transilvania (BT Direct), UniCredit Consumer Financing\n`;
    text += `• Posibilitate finanțare cu Avans 0% pe o perioadă de până la 60 luni cu rate fixe\n`;
    text += `• Eligibil pentru persoane fizice, contracte de muncă externe (diurne), pensionari sau persoane juridice (SRL / PFA)\n\n`;
  }

  // Garanție și siguranță
  if (includeWarranty || includeContGarantie) {
    text += `🛡️ SIGURANȚĂ & GARANȚIE:\n`;
    if (includeWarranty) {
      text += `• Garanție comercială scrisă de 12 luni inclusă în preț (fără costuri ascunse)\n`;
    }
    if (includeContGarantie) {
      text += `• Tranzacție 100% securizată: acceptăm plată prin Cont de Garanție sau transfer bancar securizat\n`;
    }
    text += `• Kilometraj atestat contractual și trecut expres pe factura fiscală\n`;
    text += `• Autoturism inspectat tehnic în atelier autorizat (acceptăm orice testare autorizată)\n\n`;
  }

  // Buy-back și livrare
  if (includeBuyBack || includeDelivery) {
    text += `🔄 SERVICII SUPLIMENTARE SHOWROOM:\n`;
    if (includeBuyBack) {
      text += `• BUY-BACK / TRADE-IN: preluăm mașina dumneavoastră actuală ca avans pentru mașina nouă\n`;
    }
    if (includeDelivery) {
      text += `• Numere provizorii (roșii) eliberate pe loc sau transport asigurat pe platformă oriunde în România\n`;
    }
    text += `\n`;
  }

  if (customNotes.trim()) {
    text += `📝 NOTE SPECIALE DEALER:\n${customNotes.trim()}\n\n`;
  }

  text += `📍 VIZIONARE & TEST DRIVE:\n`;
  text += `Locație parc auto: ${address}\n`;
  text += `📞 Informații și programări test drive: ${phone}\n`;

  return text.trim();
}
