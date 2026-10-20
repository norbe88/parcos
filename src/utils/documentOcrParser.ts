// =========================================================================
// RXM AUTOMOBILE — Parser Documente Auto (Directiva 1999/37/CE & US Title)
// Extrage codurile armonizate UE și convertește tehnic (kW ➔ CP, Mile ➔ Km)
// =========================================================================

export type DocOriginCountry = 'DE' | 'AT' | 'FR' | 'IT' | 'RO' | 'NL' | 'BE' | 'US' | 'OTHER';

export interface ParsedVehicleDocument {
  // Identificare
  vin: string;
  isVinValid: boolean;
  maskedVin: string;
  civNumber?: string;
  docOriginCountry: DocOriginCountry;

  // Date Tehnice
  brand?: string;
  model?: string;
  versionTrim?: string;
  year?: number;
  registrationDate?: string;
  firstRegistrationDate?: string;
  engineCc?: number;
  powerKw?: number;
  powerHp?: number;
  fuelType?: 'Diesel' | 'Benzină' | 'Hibrid' | 'Electric';
  color?: string;
  bodyType?: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback';
  mileageKm?: number;
  drivetrain?: '4x4 / AWD' | 'Față' | 'Spate';
  transmission?: 'Automată' | 'Manuală';

  // Metadate & Scor Încredere
  confidenceScore: number; // 0 - 100
  extractedCodes: Record<string, string>;
  recognizedFieldsCount: number;
  rawText: string;
  warnings: string[];
}

// Lista mărci auto standard recunoscute în showroom-urile auto
const KNOWN_BRANDS: Array<{ brand: string; aliases: string[]; defaultBody?: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback' }> = [
  { brand: 'Dacia', aliases: ['DACIA', 'AUTOMOBILE DACIA', 'DACIA PITEȘTI', 'DACIA PITESTI'] },
  { brand: 'MINI', aliases: ['MINI', 'MINI COOPER', 'BMW MINI'], defaultBody: 'Hatchback' },
  { brand: 'BMW', aliases: ['BMW', 'B.M.W', 'BAYERISCHE MOTOREN'] },
  { brand: 'Mercedes-Benz', aliases: ['MERCEDES-BENZ', 'MERCEDES', 'DAIMLER', 'BENZ'] },
  { brand: 'Audi', aliases: ['AUDI', 'AUDI AG'] },
  { brand: 'Volkswagen', aliases: ['VOLKSWAGEN', 'VW', 'VOLKSWAGEN AG', 'V.W.'] },
  { brand: 'Volvo', aliases: ['VOLVO', 'VOLVO CARS'] },
  { brand: 'Ford', aliases: ['FORD', 'FORD MOTOR', 'FORD WERKE'] },
  { brand: 'Porsche', aliases: ['PORSCHE', 'DR. ING. H.C. F. PORSCHE'] },
  { brand: 'Jeep', aliases: ['JEEP', 'CHRYSLER JEEP', 'STELLANTIS'] },
  { brand: 'Land Rover', aliases: ['LAND ROVER', 'RANGE ROVER', 'JAGUAR LAND ROVER'] },
  { brand: 'Toyota', aliases: ['TOYOTA', 'TOYOTA MOTOR'] },
  { brand: 'Skoda', aliases: ['SKODA', 'ŠKODA', 'SKODA AUTO'] },
  { brand: 'Seat', aliases: ['SEAT', 'SEAT S.A.', 'CUPRA'] },
  { brand: 'Peugeot', aliases: ['PEUGEOT', 'AUTOMOBILES PEUGEOT'] },
  { brand: 'Renault', aliases: ['RENAULT', 'RENAULT S.A.S.'] },
  { brand: 'Hyundai', aliases: ['HYUNDAI', 'HYUNDAI MOTOR'] },
  { brand: 'Kia', aliases: ['KIA', 'KIA MOTORS'] },
  { brand: 'Mazda', aliases: ['MAZDA', 'MAZDA MOTOR'] },
  { brand: 'Nissan', aliases: ['NISSAN', 'NISSAN MOTOR', 'DATSUN'], defaultBody: 'SUV' },
  { brand: 'Opel', aliases: ['OPEL', 'ADAM OPEL', 'VAUXHALL'] }
];

// Curățare și normalizare caractere specifice VIN (ISO 3779 interzice I, O, Q)
export function sanitizeVin(rawCandidate: string): string {
  return rawCandidate
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[IOQ]/g, (char) => {
      if (char === 'I') return '1';
      if (char === 'O' || char === 'Q') return '0';
      return char;
    })
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Verifică dacă seria VIN respectă lungimea de 17 caractere și caracterele admise
 */
export function isValidVin(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  // Fără I, O, Q conform ISO 3779
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

/**
 * Mascare VIN pentru securitate și protecție fraudă
 */
export function maskVinString(vin?: string): string {
  if (!vin || vin.length < 8) return 'VIN Protejat';
  const first3 = vin.slice(0, 3);
  const last4 = vin.slice(-4);
  return `${first3}••••••••••${last4}`;
}

/**
 * Conversie kW în CP conform Directivei 1999/37/CE (1 kW = 1.35962 CP)
 */
export function convertKwToHp(kw: number): number {
  if (!kw || kw <= 0) return 0;
  return Math.round(kw * 1.35962);
}

/**
 * Conversie Mile în Kilometri conform US Title (1 Milă = 1.60934 Km)
 */
export function convertMilesToKm(miles: number): number {
  if (!miles || miles <= 0) return 0;
  return Math.round(miles * 1.60934);
}

/**
 * Parser Principal: Transformă textul OCR brut în date structurate de înmatriculare
 */
export function parseVehicleDocumentText(rawText: string, forcedCountry?: DocOriginCountry): ParsedVehicleDocument {
  const extractedCodes: Record<string, string> = {};
  const warnings: string[] = [];
  const normalizedText = rawText.replace(/\r\n/g, '\n');

  // 1. Detectare Țară Proveniență Document
  let detectedCountry: DocOriginCountry = forcedCountry && forcedCountry !== 'OTHER' ? forcedCountry : 'RO';

  const textUpper = normalizedText.toUpperCase();
  if (
    textUpper.includes('ÖSTERREICH') ||
    textUpper.includes('OESTERREICH') ||
    textUpper.includes('KFG 1967') ||
    textUpper.includes('KRAFTFAHRGESETZ') ||
    textUpper.includes('ZULASSUNGSSTELLE') ||
    textUpper.includes('WIENER STÄDTISCHE') ||
    textUpper.includes('UNIQA') ||
    textUpper.includes('NATIONALER CODE') ||
    textUpper.includes('GENEHMIGUNGSDATUM') ||
    textUpper.includes('GENEHMIGUNGSNUMMER') ||
    (textUpper.includes('ZULASSUNGSBESCHEINIGUNG') && (textUpper.includes('FIN') || textUpper.includes('ANTRIEBSART') || textUpper.includes('MEHRZWECKFAHRZEUG') || textUpper.includes('SALZBURG') || textUpper.includes('PONGAU')))
  ) {
    detectedCountry = 'AT';
  } else if (textUpper.includes('ZULASSUNGSBESCHEINIGUNG') || textUpper.includes('BUNDESREPUBLIK DEUTSCHLAND') || textUpper.includes('KRAFTFAHRT-BUNDESAMT')) {
    detectedCountry = 'DE';
  } else if (textUpper.includes('CERTIFICAT D\'IMMATRICULATION') || textUpper.includes('CARTE GRISE') || textUpper.includes('RÉPUBLIQUE FRANÇAISE')) {
    detectedCountry = 'FR';
  } else if (textUpper.includes('CARTA DI CIRCOLAZIONE') || textUpper.includes('DOCUMENTO UNICO') || textUpper.includes('REPUBBLICA ITALIANA')) {
    detectedCountry = 'IT';
  } else if (textUpper.includes('KENTEKENCARD') || textUpper.includes('KONINKRIJK DER NEDERLANDEN') || textUpper.includes('RDW')) {
    detectedCountry = 'NL';
  } else if (textUpper.includes('CERTIFICAT D\'IMMATRICULATION BELGIQUE') || textUpper.includes('ROYAUME DE BELGIQUE')) {
    detectedCountry = 'BE';
  } else if (textUpper.includes('CERTIFICATE OF TITLE') || textUpper.includes('STATE OF') || textUpper.includes('ODOMETER DISCLOSURE')) {
    detectedCountry = 'US';
  } else if (textUpper.includes('CARTE DE IDENTITATE A VEHICULULUI') || textUpper.includes('REGISTRUL AUTO ROMAN') || textUpper.includes('CERTIFICAT DE INMATRICULARE') || textUpper.includes('ROMANIA')) {
    detectedCountry = 'RO';
  } else if (forcedCountry) {
    detectedCountry = forcedCountry;
  }

  // 2. Extragere Serie Șasiu VIN (Cod E / Directive 1999/37/CE sau ISO 3779)
  let foundVin = '';
  // Căutare explicită după etichetă (E) sau VIN (inclusiv etichete specifice CIV / Talon România și FIN Austria/Germania)
  const vinLabelPatterns = [
    /(?:1\.?\s*NUM[ĂA]RUL?\s*DE\s*IDENTIFICARE|NR\.?\s*DE\s*IDENTIFICARE|NUM[ĂA]R\s*IDENTIFICARE|SERIE\s*ȘASIU|SERIA\s*DE\s*ȘASIU)\s*:?\s*([A-HJ-NPR-Z0-9\s]{16,20})/i,
    /(?:E\s*FIN\b|FIN\b|FAHRZEUG-IDENTIFIZIERUNGSNUMMER|FAHRGESTELLNUMMER)\s*:?\s*([A-HJ-NPR-Z0-9\s]{16,20})/i,
    /(?:\(E\)|E\b|E\.?\s*:?|VIN\s*:?|SERIE\s*ȘASIU\s*:?|IDENTIFICATION\s*NO\.?\s*:?)\s*([A-HJ-NPR-Z0-9\s]{16,20})/i,
    /(?:CHASSIS|CHASSIS\s*NUMBER)\s*:?\s*([A-HJ-NPR-Z0-9\s]{16,20})/i
  ];

  for (const pattern of vinLabelPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const sanitized = sanitizeVin(match[1]);
      if (sanitized.length === 17) {
        foundVin = sanitized;
        extractedCodes['E'] = foundVin;
        break;
      }
    }
  }

  // Căutare secundară generică după pattern ISO 3779 (17 caractere alfanumerice fără I, O, Q)
  if (!foundVin) {
    const genericMatches = normalizedText.match(/\b[A-HJ-NPR-Z0-9]{17}\b/gi);
    if (genericMatches && genericMatches.length > 0) {
      // Prioritizare WMI (World Manufacturer Identifier) uzuale: UU1 (Dacia), WBA, WAU, WVG, YV1, 1FA, 1C4, VF1, SJN (Nissan), etc.
      const prioritized = genericMatches.find(v => /^(UU1|WBA|WBS|WAU|WA1|WVG|WVW|YV1|1FA|1C4|VF|WP0|SAL|SHS|KMH|VSS|TMB|SJN|JN)/i.test(v)) || genericMatches[0];
      foundVin = sanitizeVin(prioritized);
      extractedCodes['E'] = foundVin;
    }
  }

  // 3. Extragere Dată & An Fabricație (Cod B - Prima Înmatriculare sau Câmpul 7 CIV România)
  let foundYear: number | undefined;
  let foundDate: string | undefined;

  const dateLabelPatterns = [
    /(?:7\.?\s*ANUL\s*FABRICA[ȚT]IEI|AN\s*FABRICA[ȚT]IE|ANUL\s*FABRICA[ȚT]IEI)\s*:?\s*([0-9]{4})/i,
    /(?:(?:\(B\)|\bB\b|\bB\.?\s*:?)\s*(?:ERSTMALIGE\s*ZULASSUNG(?:\s*AM)?|ERSTZULASSUNG|DATA\s*PRIMEI\s*ÎNMATRICULĂRI|1ST\s*REGISTRATION|DATE\s*DE\s*PREMI[ÈE]RE\s*IMMATRICULATION)?|DATA\s*PRIMEI\s*ÎNMATRICULĂRI|1ST\s*REGISTRATION|ERSTZULASSUNG|ERSTMALIGE\s*ZULASSUNG(?:\s*AM)?|DATE\s*DE\s*PREMI[ÈE]RE\s*IMMATRICULATION)\s*:?\s*([0-9]{2}[./\-][0-9]{2}[./\-][0-9]{4})/i,
    /(?:\(B\)|\bB\b|\bB\.?\s*:?)\s*([0-9]{4})/i
  ];

  for (const pattern of dateLabelPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const rawVal = match[1].trim();
      extractedCodes['B'] = rawVal;
      foundDate = rawVal;

      const yearMatch = rawVal.match(/([12][0-9]{3})/);
      if (yearMatch) {
        const parsedYear = parseInt(yearMatch[1], 10);
        if (parsedYear >= 1990 && parsedYear <= new Date().getFullYear() + 1) {
          foundYear = parsedYear;
          break;
        }
      }
    }
  }

  // Fallback an dacă nu s-a găsit Cod B etichetat
  if (!foundYear) {
    const yearMatches = normalizedText.match(/\b(20[0-2][0-9]|199[5-9])\b/g);
    if (yearMatches && yearMatches.length > 0) {
      foundYear = parseInt(yearMatches[0], 10);
    }
  }

  // 4. Extragere Marcă (Cod D.1) & Model (Cod D.3)
  let foundBrand: string | undefined;
  let foundModel: string | undefined;

  // Căutare explicită Cod D.1 / Câmpul 2 CIV România / Marke Austria
  const d1Match = normalizedText.match(/(?:2\.?\s*MARC[ĂA]|(?:\(D\.1\)|D\.1\b|D1\b)\s*(?:MARKE|MARQUE|MAKE|MARCĂ)?|MARKE|MARQUE|MARCĂ|MAKE)\s*:?\s*([A-Za-z0-9\- ]{2,30})/i);
  if (d1Match && d1Match[1]) {
    const candidate = d1Match[1].trim();
    extractedCodes['D.1'] = candidate;
    const matched = KNOWN_BRANDS.find(b => b.aliases.some(a => candidate.toUpperCase().includes(a)));
    if (matched) foundBrand = matched.brand;
  }

  // Căutare prin recunoaștere globală de mărci dacă D.1 nu a funcționat
  if (!foundBrand) {
    for (const kb of KNOWN_BRANDS) {
      if (kb.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(normalizedText))) {
        foundBrand = kb.brand;
        break;
      }
    }
  }

  // Căutare Cod D.3 (Model / Denumire Comercială / Câmpul 3 CIV România / Handelsbezeichnung Austria)
  const d3Match = normalizedText.match(/(?:3\.?\s*TIPUL\s*[\/\-]\s*VARIANTA(?:\s*[\/\-]\s*VERSIUNEA)?|TIPUL\s*[\/\-]\s*VARIANTA|(?:\(D\.3\)|D\.3\b|D3\b)\s*(?:HANDELSBEZEICHNUNG|MODEL|COMMERCIAL\s*NAME)?|HANDELSBEZEICHNUNG|COMMERCIAL\s*NAME|MODEL)\s*:?\s*([A-Za-z0-9\- ăîâșțĂÎÂȘȚ]{2,30})/i);
  if (d3Match && d3Match[1]) {
    foundModel = d3Match[1].trim();
    extractedCodes['D.3'] = foundModel;
  }

  // Model euristic dacă marca e cunoscută sau normalizare denumiri comerciale
  if (!foundModel && foundBrand) {
    if (foundBrand === 'Dacia') {
      const match = normalizedText.match(/\b(Duster|Logan(?:\s*MCV)?|Sandero(?:\s*Stepway)?|Jogger|Spring|Lodgy|Dokker)\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Nissan') {
      const match = normalizedText.match(/\b(Qashqai(?:\s*\+2)?|X-Trail|Juke|Micra|Navara|Leaf|Ariya|Patrol|Note)\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'BMW') {
      const match = normalizedText.match(/\b(Seria\s*[1-8]|520[a-z]?|530[a-z]?|320[a-z]?|330[a-z]?|X[1-7]|M[2-5])\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Volvo') {
      const match = normalizedText.match(/\b(XC[469]0|V[469]0|S[69]0)\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Audi') {
      const match = normalizedText.match(/\b(A[1-8]|Q[2-8]|RS[3-6]|S[3-6])\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Volkswagen') {
      const match = normalizedText.match(/\b(Golf|Tiguan|Passat|Touareg|Arteon|T-Roc|Polo)\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Ford') {
      const match = normalizedText.match(/\b(Mustang|Kuga|Focus|Mondeo|Puma|Ranger)\b/i);
      if (match) foundModel = match[1];
    } else if (foundBrand === 'Jeep') {
      const match = normalizedText.match(/\b(Grand\s*Cherokee|Wrangler|Compass|Renegade)\b/i);
      if (match) foundModel = match[1];
    }
  }

  // Elimină marca din denumirea modelului dacă a fost duplicată (ex: "NISSAN QASHQAI" ➔ "Qashqai")
  if (foundModel && foundBrand) {
    foundModel = foundModel.replace(new RegExp(`^${foundBrand}\\s*`, 'i'), '').trim();
  }

  // Curățare și normalizare model comercial
  if (foundModel) {
    if (/DUSTER/i.test(foundModel)) foundModel = 'Duster';
    else if (/LOGAN/i.test(foundModel)) foundModel = 'Logan';
    else if (/SANDERO/i.test(foundModel)) foundModel = 'Sandero';
    else if (/JOGGER/i.test(foundModel)) foundModel = 'Jogger';
    else if (/SPRING/i.test(foundModel)) foundModel = 'Spring';
    else if (/QASHQAI/i.test(foundModel)) foundModel = 'Qashqai';
  }

  // 5. Extragere Capacitate Cilindrică (Cod P.1 / Câmpul P.1 CIV România / Hubraum)
  let foundEngineCc: number | undefined;
  const p1Match = normalizedText.match(/(?:(?:\(P\.1\)|P\.1\b|P1\b)\s*(?:HUBRAUM|CAPACITATEA?\s*CILINDRIC[ĂA]|CILINDREE|CYLINDREE|DISPLACEMENT)?|HUBRAUM|CAPACITATEA?\s*CILINDRIC[ĂA]|CILINDREE|CYLINDREE|DISPLACEMENT)\s*:?\s*([0-9]{3,5})\b/i);
  if (p1Match && p1Match[1]) {
    const cc = parseInt(p1Match[1], 10);
    if (cc >= 800 && cc <= 6500) {
      foundEngineCc = cc;
      extractedCodes['P.1'] = cc.toString();
    }
  }

  // 6. Extragere Putere Motor kW (Cod P.2 / Câmpul P.2 CIV România / Leistung) & Conversie CP
  let foundPowerKw: number | undefined;
  let foundPowerHp: number | undefined;
  const p2Match = normalizedText.match(/(?:(?:\(P\.2\)|P\.2\b|P2\b)\s*(?:LEISTUNG|PUTEREA?\s*MAXIM[ĂA]\s*NET[ĂA]|PUTERE\s*NET[ĂA]|PUTERE|PUISSANCE)?|LEISTUNG|PUTEREA?\s*MAXIM[ĂA]\s*NET[ĂA]|PUTERE\s*NET[ĂA]|PUTERE|PUISSANCE)\s*:?\s*([0-9]{2,4})(?:[.,][0-9])?\s*(?:KW)?\b/i);
  if (p2Match && p2Match[1]) {
    const kw = parseInt(p2Match[1], 10);
    if (kw >= 40 && kw <= 800) {
      foundPowerKw = kw;
      foundPowerHp = convertKwToHp(kw);
      extractedCodes['P.2'] = `${kw} kW (${foundPowerHp} CP)`;
    }
  }

  // 7. Extragere Tip Combustibil (Cod P.3 / Câmpul P.3 CIV România / Antriebsart)
  let foundFuel: 'Diesel' | 'Benzină' | 'Hibrid' | 'Electric' | undefined;
  const p3Match = normalizedText.match(/(?:(?:\(P\.3\)|P\.3\b|P3\b)\s*(?:ANTRIEBSART|KRAFTSTOFF|COMBUSTIBILUL?|ENERGIE|FUEL)?|ANTRIEBSART|KRAFTSTOFF|COMBUSTIBILUL?|ENERGIE|FUEL)\s*:?\s*([A-Za-z0-9/\- ăîâșțĂÎÂȘȚ]{1,25})/i);
  const fuelRaw = (p3Match ? p3Match[1] : normalizedText).toUpperCase();

  if (fuelRaw.includes('HYBRID') || fuelRaw.includes('HIBRID') || fuelRaw.includes('PHEV') || fuelRaw.includes('MILD')) {
    foundFuel = 'Hibrid';
    extractedCodes['P.3'] = 'Hibrid';
  } else if (fuelRaw.includes('ELEKTR') || fuelRaw.includes('ELECTRIC') || fuelRaw.includes('BEV')) {
    foundFuel = 'Electric';
    extractedCodes['P.3'] = 'Electric';
  } else if (fuelRaw.includes('DIESEL') || fuelRaw.includes('MOTORINA') || fuelRaw.includes('MOTORINĂ') || fuelRaw.includes('GASOLIO') || fuelRaw.includes('GAZOLE') || /\bP\.3\s*:?\s*D\b/i.test(normalizedText)) {
    foundFuel = 'Diesel';
    extractedCodes['P.3'] = 'Diesel';
  } else if (fuelRaw.includes('BENZIN') || fuelRaw.includes('BENZINA') || fuelRaw.includes('BENZINĂ') || fuelRaw.includes('ESSENCE') || fuelRaw.includes('PETROL') || fuelRaw.includes('GASOLINE')) {
    foundFuel = 'Benzină';
    extractedCodes['P.3'] = 'Benzină';
  }

  // 8. Extragere Culoare (Cod R / Farbe)
  let foundColor: string | undefined;
  const rMatch = normalizedText.match(/(?:(?:\(R\)|\bR\b|\bR\.?\s*:?)\s*(?:FARBE|CULOARE|COULEUR|COLOR)?|FARBE|CULOARE|COULEUR|COLOR)\s*:?\s*([A-Za-z0-9\- ßäöüÄÖÜ]{3,25})/i);
  if (rMatch && rMatch[1]) {
    const rawColor = rMatch[1].replace(/^(?:FARBE|CULOARE|COULEUR|COLOR)\s*:?\s*/i, '').trim();
    const cVal = rawColor.toUpperCase();
    extractedCodes['R'] = cVal;
    if (cVal.includes('ALB') || cVal.includes('WEISS') || cVal.includes('WEIß') || cVal.includes('WHITE') || cVal.includes('BLANC')) foundColor = 'Alb';
    else if (cVal.includes('NEGRU') || cVal.includes('SCHWARZ') || cVal.includes('BLACK') || cVal.includes('NOIR')) foundColor = 'Negru Metalizat';
    else if (cVal.includes('GRI') || cVal.includes('GRAU') || cVal.includes('GREY') || cVal.includes('GRIS')) foundColor = 'Gri';
    else if (cVal.includes('ALBASTRU') || cVal.includes('BLAU') || cVal.includes('BLUE') || cVal.includes('BLEU')) foundColor = 'Albastru';
    else if (cVal.includes('ROSU') || cVal.includes('ROȘU') || cVal.includes('ROT') || cVal.includes('RED') || cVal.includes('ROUGE')) foundColor = 'Roșu';
  }

  // 9. Extragere Serie CIV / Număr Certificat / Nationaler Code (Cod A / Seria C.I.V. România / A7 Austria)
  let foundCiv: string | undefined;
  const civMatch = normalizedText.match(/(?:SERIA\s*(?:C\.?I\.?V\.?)?|\(X\)|SERIA\s*C[ĂA]R[ȚT]II\s*DE\s*IDENTITATE|CARTE\s*CIV)[:\s\-]*([A-Z])\s*[-–\s]?\s*(\d{6})\b/i) ||
                   normalizedText.match(/\b([A-Z])\s*[-–]\s*(\d{6})\b/i) ||
                   normalizedText.match(/(?:SERIE\s*CIV|DOCUMENT\s*NO\.?|TITLE\s*NO\.?|CERTIFICAT\s*NR\.?)\s*:?\s*([A-Z0-9]{7,12})/i);
  if (civMatch) {
    if (civMatch[1] && civMatch[2]) {
      foundCiv = `${civMatch[1].toUpperCase()}-${civMatch[2]}`;
    } else if (civMatch[1]) {
      foundCiv = civMatch[1].trim();
    }
    if (foundCiv) extractedCodes['A'] = foundCiv;
  }

  // Suport dedicat cod național Austria (A7 Nationaler Code)
  const austrianCodeMatch = normalizedText.match(/(?:NATIONALER\s*CODE|A7\b|A7\.)\s*:?\s*([0-9]{4,10})/i);
  if (!foundCiv && austrianCodeMatch && austrianCodeMatch[1]) {
    foundCiv = `AT-${austrianCodeMatch[1]}`;
    extractedCodes['A'] = foundCiv;
  }

  // 10. Extragere Tip Caroserie (A8 Aufbau / Mehrzweckfahrzeug / M1G / Teren ➔ SUV)
  let foundBody: 'SUV' | 'Sedan' | 'Coupe' | 'Break' | 'Hatchback' = 'SUV';
  if (textUpper.includes('MEHRZWECKFAHRZEUG') || textUpper.includes('SUV') || textUpper.includes('TEREN') || textUpper.includes('M1G') || (foundBrand === 'Nissan' && foundModel === 'Qashqai')) {
    foundBody = 'SUV';
  } else if (textUpper.includes('KOMBI') || textUpper.includes('BREAK') || textUpper.includes('STATION WAGON')) {
    foundBody = 'Break';
  } else if (textUpper.includes('COUPE') || textUpper.includes('COUPÉ')) {
    foundBody = 'Coupe';
  } else if (textUpper.includes('HATCHBACK') || textUpper.includes('SCHRÄGHECK')) {
    foundBody = 'Hatchback';
  } else if (textUpper.includes('SEDAN') || textUpper.includes('LIMOUSINE') || textUpper.includes('BERLINE')) {
    foundBody = 'Sedan';
  }

  // 11. Extragere Odometru US Title (Conversie Mile ➔ Km)
  let foundMileageKm: number | undefined;
  if (detectedCountry === 'US' || textUpper.includes('MILES') || textUpper.includes('ODOMETER')) {
    const odoMatch = normalizedText.match(/(?:ODOMETER|MILEAGE|READING)\s*:?\s*([0-9]{1,3}(?:[,.][0-9]{3})*)\s*(?:MILES)?/i);
    if (odoMatch && odoMatch[1]) {
      const milesClean = parseInt(odoMatch[1].replace(/[,.]/g, ''), 10);
      if (milesClean > 0 && milesClean < 500000) {
        foundMileageKm = convertMilesToKm(milesClean);
        extractedCodes['ODOMETER'] = `${milesClean.toLocaleString('ro-RO')} Mile ➔ ${foundMileageKm.toLocaleString('ro-RO')} Km`;
      }
    }
  }

  // Calcul scor de încredere (Confidence Score)
  let score = 0;
  if (foundVin && isValidVin(foundVin)) score += 35;
  if (foundBrand) score += 20;
  if (foundModel) score += 15;
  if (foundYear) score += 10;
  if (foundPowerHp) score += 10;
  if (foundEngineCc) score += 5;
  if (foundFuel) score += 5;

  if (!foundVin) warnings.push('Seria VIN (Cod E) nu a fost detectată cu certitudine.');
  if (!foundBrand) warnings.push('Marca vehiculului (Cod D.1) necesită completare manuală.');
  if (!foundYear) warnings.push('Anul fabricației (Cod B) nu a putut fi extras.');

  return {
    vin: foundVin,
    isVinValid: isValidVin(foundVin),
    maskedVin: maskVinString(foundVin),
    civNumber: foundCiv,
    docOriginCountry: detectedCountry,
    brand: foundBrand,
    model: foundModel,
    versionTrim: foundModel ? `${foundModel} ${foundPowerHp ? foundPowerHp + ' CP' : ''}`.trim() : undefined,
    year: foundYear,
    registrationDate: foundDate,
    firstRegistrationDate: foundDate,
    engineCc: foundEngineCc,
    powerKw: foundPowerKw,
    powerHp: foundPowerHp,
    fuelType: foundFuel,
    color: foundColor,
    bodyType: foundBody,
    mileageKm: foundMileageKm,
    confidenceScore: Math.min(100, score),
    extractedCodes,
    recognizedFieldsCount: Object.keys(extractedCodes).length,
    rawText,
    warnings
  };
}
