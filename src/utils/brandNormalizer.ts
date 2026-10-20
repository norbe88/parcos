/**
 * src/utils/brandNormalizer.ts
 * Motor Central de Normalizare & Auto-Ajustare a Mărcilor Auto — RXM Automobile
 * Invariantă: Mărci canonice cu scriere oficială (acronime ALL CAPS, diacritice, hyphen-uri).
 * Elimină duplicările precum "BMW" vs "Bmw" sau "RENAULT" vs "Renault" în filtre și formulare.
 */

export interface BrandDefinition {
  canonical: string;
  aliases: string[];
}

export const CANONICAL_AUTO_BRANDS: BrandDefinition[] = [
  // Acronime internaționale oficiale (ALL CAPS obligatoriu)
  { canonical: 'BMW', aliases: ['B.M.W.', 'B.M.W', 'B MW', 'BAYERISCHE MOTOREN WERKE', 'BAYERISCHE MOTOREN'] },
  { canonical: 'MINI', aliases: ['MINI COOPER', 'BMW MINI'] },
  { canonical: 'DS Automobiles', aliases: ['DS', 'DS AUTOMOBILES', 'CITROEN DS'] },
  { canonical: 'BYD', aliases: ['B.Y.D.', 'BYD AUTO'] },

  // Denumiri compuse cu cratimă / spațiu
  { canonical: 'Mercedes-Benz', aliases: ['MERCEDES', 'MERCEDES BENZ', 'DAIMLER', 'DAIMLER-BENZ', 'BENZ', 'MERCEDES-BENZ AG'] },
  { canonical: 'Alfa Romeo', aliases: ['ALFA', 'ALFA-ROMEO', 'ALFA ROMEO S.P.A.'] },
  { canonical: 'Land Rover', aliases: ['RANGE ROVER', 'LAND-ROVER', 'JAGUAR LAND ROVER'] },
  { canonical: 'Aston Martin', aliases: ['ASTON-MARTIN'] },
  { canonical: 'Rolls-Royce', aliases: ['ROLLS ROYCE', 'ROLLS-ROYCE'] },

  // Mărci uzuale europene & internaționale (Title Case oficial)
  { canonical: 'Audi', aliases: ['AUDI AG', 'AUDI SPORT'] },
  { canonical: 'Dacia', aliases: ['AUTOMOBILE DACIA', 'DACIA PITESTI', 'DACIA PITEȘTI', 'DACIA PITEŞTI'] },
  { canonical: 'Volkswagen', aliases: ['VW', 'VOLKSWAGEN AG', 'V.W.', 'VOLKSWAGON', 'VOLKSWAGEN DEUTSCHLAND'] },
  { canonical: 'Renault', aliases: ['RENAULT S.A.S.', 'RENAULT SAS', 'RENAULT NISSAN'] },
  { canonical: 'Ford', aliases: ['FORD MOTOR', 'FORD WERKE', 'FORD MOTOR COMPANY'] },
  { canonical: 'Skoda', aliases: ['ŠKODA', 'SKODA AUTO', 'SKODA AUTO A.S.', 'ŠKODA AUTO'] },
  { canonical: 'Seat', aliases: ['SEAT S.A.', 'SEAT SA', 'SEAT ESPANA'] },
  { canonical: 'Cupra', aliases: ['CUPRA RACING', 'SEAT CUPRA'] },
  { canonical: 'Peugeot', aliases: ['AUTOMOBILES PEUGEOT', 'PEUGEOT CITROEN'] },
  { canonical: 'Opel', aliases: ['ADAM OPEL', 'VAUXHALL', 'OPEL AUTOMOBILE'] },
  { canonical: 'Volvo', aliases: ['VOLVO CARS', 'VOLVO CAR', 'VOLVO CAR CORPORATION'] },
  { canonical: 'Jeep', aliases: ['CHRYSLER JEEP', 'STELLANTIS JEEP'] },
  { canonical: 'Porsche', aliases: ['PORSCHE AG', 'DR. ING. H.C. F. PORSCHE'] },
  { canonical: 'Toyota', aliases: ['TOYOTA MOTOR', 'TOYOTA MOTOR CORPORATION'] },
  { canonical: 'Hyundai', aliases: ['HYUNDAI MOTOR', 'HYUNDAI MOTOR COMPANY'] },
  { canonical: 'Kia', aliases: ['KIA MOTORS', 'KIA CORPORATION'] },
  { canonical: 'Mazda', aliases: ['MAZDA MOTOR', 'MAZDA MOTOR CORP'] },
  { canonical: 'Nissan', aliases: ['NISSAN MOTOR', 'NISSAN MOTOR CO.'] },
  { canonical: 'Honda', aliases: ['HONDA MOTOR'] },
  { canonical: 'Fiat', aliases: ['FIAT AUTO', 'F.I.A.T.', 'FIAT CHRYSLER'] },
  { canonical: 'Citroen', aliases: ['CITROËN', 'AUTOMOBILES CITROEN', 'CITROEN S.A.'] },
  { canonical: 'Smart', aliases: ['SMART GMBH', 'MCC SMART'] },
  { canonical: 'Suzuki', aliases: ['SUZUKI MOTOR'] },
  { canonical: 'Mitsubishi', aliases: ['MITSUBISHI MOTORS'] },
  { canonical: 'Jaguar', aliases: ['JAGUAR CARS'] },
  { canonical: 'Lexus', aliases: ['LEXUS MOTOR'] },
  { canonical: 'Subaru', aliases: ['SUBARU CORP'] },
  { canonical: 'Chevrolet', aliases: ['CHEVY', 'CHEVROLET MOTOR'] },
  { canonical: 'Tesla', aliases: ['TESLA MOTORS', 'TESLA INC'] },
  { canonical: 'Infiniti', aliases: ['INFINITI MOTOR'] },
  { canonical: 'Abarth', aliases: [] },
  { canonical: 'Maserati', aliases: [] },
  { canonical: 'Bentley', aliases: [] },
  { canonical: 'Ferrari', aliases: [] },
  { canonical: 'Lamborghini', aliases: [] },
  { canonical: 'Iveco', aliases: ['IVECO S.P.A.'] },
  { canonical: 'Isuzu', aliases: ['ISUZU MOTORS'] },
  { canonical: 'SsangYong', aliases: ['SSANGYONG', 'KGM', 'KG MOBILITY'] },
];

// Mapare rapidă O(1) de la text simplificat fără spații/diacritice la denumirea canonică
const LOOKUP_MAP = new Map<string, string>();

function simplifyKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimină diacriticele (ex: Š -> S)
    .replace(/[^a-z0-9]/g, '');      // Elimină cratime, puncte, spații
}

// Populare dicționar de căutare
CANONICAL_AUTO_BRANDS.forEach(({ canonical, aliases }) => {
  LOOKUP_MAP.set(simplifyKey(canonical), canonical);
  aliases.forEach(alias => {
    LOOKUP_MAP.set(simplifyKey(alias), canonical);
  });
});

/**
 * Listă de stringuri canonice ordonate alfabetic (ideală pentru datalist / select UI)
 */
export const CANONICAL_BRAND_NAMES: string[] = Array.from(
  new Set(CANONICAL_AUTO_BRANDS.map(b => b.canonical))
).sort((a, b) => a.localeCompare(b, 'ro'));

/**
 * Normalizează o denumire brută de marcă auto la forma canonică oficială.
 * Exemple:
 *  - "bmw" | "Bmw" | "BMW" | "b.m.w" -> "BMW"
 *  - "renault" | "RENAULT" | "Renault S.A.S." -> "Renault"
 *  - "mercedes" | "mercedes benz" | "MERCEDES-BENZ" -> "Mercedes-Benz"
 *  - "vw" | "volkswagen ag" -> "Volkswagen"
 *  - "škoda" | "SKODA" -> "Skoda"
 *  - "dacia pitesti" -> "Dacia"
 */
export function normalizeBrand(rawBrand?: string): string {
  if (!rawBrand) return '';
  const trimmed = rawBrand.trim();
  if (!trimmed) return '';

  const key = simplifyKey(trimmed);
  if (LOOKUP_MAP.has(key)) {
    return LOOKUP_MAP.get(key)!;
  }

  // Verificare potrivire prefix/subșir (ex: "BMW Seria 3" introdus eronat în câmpul de marcă)
  for (const [lookupKey, canonical] of LOOKUP_MAP.entries()) {
    if (lookupKey.length >= 3 && (key.startsWith(lookupKey) || key.includes(lookupKey))) {
      return canonical;
    }
  }

  // Fallback de bun simț: Capitalizare inteligentă Title Case pentru mărci necunoscute / rare
  return trimmed
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Verifică dacă o marcă este în catalogul oficial recunoscut
 */
export function isKnownBrand(candidate?: string): boolean {
  if (!candidate) return false;
  return LOOKUP_MAP.has(simplifyKey(candidate));
}

/**
 * Returnează sugestii de mărci canonice pe baza input-ului parțial al utilizatorului
 */
export function getBrandSuggestions(query: string, limit: number = 8): string[] {
  if (!query) return CANONICAL_BRAND_NAMES.slice(0, limit);
  const q = simplifyKey(query);
  return CANONICAL_BRAND_NAMES.filter(b => simplifyKey(b).includes(q)).slice(0, limit);
}
