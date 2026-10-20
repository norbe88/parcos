// =========================================================================
// QA AGENTIC TEAM — Test Suite: CIV / Talon PDF OCR & Multi-Photo Pipeline
// Executat de Orchi (Orchestrator) & Worky (Worker Pool)
// =========================================================================

import { 
  sanitizeVin, 
  isValidVin, 
  maskVinString, 
  convertKwToHp, 
  convertMilesToKm, 
  parseVehicleDocumentText 
} from '../src/utils/documentOcrParser';

import { isPdfDocument } from '../src/utils/pdfDocumentEngine';

interface TestResult {
  name: string;
  tier: 'Frontend' | 'Engine/OCR' | 'Process/Invariants';
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, tier: TestResult['tier'], details?: string) {
  results.push({
    name,
    tier,
    passed: condition,
    details: condition ? undefined : details || 'Assertion failed'
  });
}

console.log('🚀 [QA Agentic Team] Lansare suita automată de verificare...\n');

// -------------------------------------------------------------------------
// TIER 1: PDF Document Detection & File Guards
// -------------------------------------------------------------------------
assert(isPdfDocument('document.pdf'), 'Detectează extensie .pdf din string', 'Engine/OCR');
assert(isPdfDocument('CERTIFICAT_CIV_RAR.PDF'), 'Detectează extensie .PDF uppercase', 'Engine/OCR');
assert(isPdfDocument('data:application/pdf;base64,JVBERi0xLjQ...'), 'Detectează data URL application/pdf', 'Engine/OCR');
assert(!isPdfDocument('poza_masina.jpg'), 'Respinge fișiere non-PDF (JPG)', 'Engine/OCR');
assert(!isPdfDocument(''), 'Gestionează string gol în siguranță', 'Engine/OCR');
assert(!isPdfDocument(null), 'Gestionează null în siguranță', 'Engine/OCR');
assert(!isPdfDocument(undefined), 'Gestionează undefined în siguranță', 'Engine/OCR');

// -------------------------------------------------------------------------
// TIER 2: VIN Sanitization & Validation (ISO 3779 Standard)
// -------------------------------------------------------------------------
const rawVinWithIOQ = 'uu1hsdacg6o123456';
const cleanVin = sanitizeVin(rawVinWithIOQ);
assert(cleanVin === 'UU1HSDACG60123456', 'Sanitizează litere O -> 0 și normalizează uppercase', 'Engine/OCR', `Got: ${cleanVin}`);
assert(isValidVin(cleanVin), 'Validare VIN Dacia conform ISO 3779 (17 caractere)', 'Engine/OCR');

const invalidVinShort = 'WBA3A51070F256';
assert(!isValidVin(invalidVinShort), 'Respinge VIN mai scurt de 17 caractere', 'Engine/OCR');

const maskedVin = maskVinString('UU1HSDACG60123456');
assert(maskedVin === 'UU1••••••••••3456', 'Mască anti-fraudă VIN corectă (primele 3 + ultimele 4)', 'Process/Invariants', `Got: ${maskedVin}`);

// -------------------------------------------------------------------------
// TIER 3: Calcule Tehnice & Conversii Armonizate UE
// -------------------------------------------------------------------------
// Dacia 1.5 dCi: 80 kW -> 109 CP
assert(convertKwToHp(80) === 109, 'Conversie Dacia 80 kW ➔ 109 CP (rotunjit conform 1.35962)', 'Process/Invariants', `Got: ${convertKwToHp(80)}`);
// BMW / VW 2.0: 140 kW -> 190 CP
assert(convertKwToHp(140) === 190, 'Conversie BMW 140 kW ➔ 190 CP', 'Process/Invariants', `Got: ${convertKwToHp(140)}`);
// MINI Cooper S: 141 kW -> 192 CP
assert(convertKwToHp(141) === 192, 'Conversie MINI 141 kW ➔ 192 CP', 'Process/Invariants', `Got: ${convertKwToHp(141)}`);
// Volvo XC60 B4: 145 kW -> 197 CP
assert(convertKwToHp(145) === 197, 'Conversie Volvo 145 kW ➔ 197 CP', 'Process/Invariants', `Got: ${convertKwToHp(145)}`);
// Jeep Grand Cherokee: 184 kW -> 250 CP
assert(convertKwToHp(184) === 250, 'Conversie Jeep 184 kW ➔ 250 CP', 'Process/Invariants', `Got: ${convertKwToHp(184)}`);
// Mile -> Km: 45.000 Mile -> 72.420 Km
assert(convertMilesToKm(45000) === 72420, 'Conversie US Title: 45.000 Mile ➔ 72.420 Km', 'Process/Invariants', `Got: ${convertMilesToKm(45000)}`);

// -------------------------------------------------------------------------
// TIER 4: Parser Documente Auto — Mostră Reală CIV România (Dacia Duster)
// -------------------------------------------------------------------------
const sampleCivRomaniaText = `
ROMÂNIA
MINISTERUL TRANSPORTURILOR ȘI INFRASTRUCTURII
REGISTRUL AUTO ROMÂN
CARTEA DE IDENTITATE A VEHICULULUI
Seria M-789012

1. Numărul de identificare: UU1HSDACG60123456
2. Marcă: DACIA
3. Tipul / Varianta / Versiunea: DUSTER HSDACG
4. Categoria: Autoturism M1G
5. Caroserie: Teren / SUV
6. Număr de omologare: e19*2007/46*0026*02
7. Anul fabricației: 2018
P.1 Capacitatea cilindrică: 1461 cm3
P.2 Puterea maximă netă: 80 kW
P.3 Combustibilul: MOTORINĂ
P.5 Seria motorului: K9K858
V.9 Norma de poluare: Euro 6
R Culoare: ALB
`;

const parsedCiv = parseVehicleDocumentText(sampleCivRomaniaText, 'RO');

assert(parsedCiv.docOriginCountry === 'RO', 'Identifică originea România a documentului CIV', 'Engine/OCR');
assert(parsedCiv.brand === 'Dacia', 'Recunoaște marca autohtona DACIA', 'Engine/OCR', `Got: ${parsedCiv.brand}`);
assert(parsedCiv.model === 'DUSTER HSDACG' || parsedCiv.model === 'Duster', 'Recunoaște modelul Duster', 'Engine/OCR', `Got: ${parsedCiv.model}`);
assert(parsedCiv.vin === 'UU1HSDACG60123456', 'Extrage seria VIN corectă din CIV (17 caractere)', 'Engine/OCR', `Got: ${parsedCiv.vin}`);
assert(parsedCiv.year === 2018, 'Extrage anul fabricației 2018 din câmpul 7 CIV', 'Engine/OCR', `Got: ${parsedCiv.year}`);
assert(parsedCiv.engineCc === 1461, 'Extrage cilindreea 1461 cmc din câmpul P.1', 'Engine/OCR', `Got: ${parsedCiv.engineCc}`);
assert(parsedCiv.powerKw === 80, 'Extrage puterea 80 kW din câmpul P.2', 'Engine/OCR', `Got: ${parsedCiv.powerKw}`);
assert(parsedCiv.powerHp === 109, 'Calculează automat 109 CP din puterea kW', 'Engine/OCR', `Got: ${parsedCiv.powerHp}`);
assert(parsedCiv.fuelType === 'Diesel', 'Identifică MOTORINĂ ca Diesel', 'Engine/OCR', `Got: ${parsedCiv.fuelType}`);
assert(parsedCiv.civNumber === 'M-789012', 'Extrage Seria C.I.V. (M-789012) din antet', 'Engine/OCR', `Got: ${parsedCiv.civNumber}`);
assert(parsedCiv.isVinValid === true, 'Flag isVinValid este true', 'Engine/OCR');
assert(parsedCiv.confidenceScore >= 80, 'Scor de încredere ridicat (>80%)', 'Engine/OCR', `Got: ${parsedCiv.confidenceScore}`);

// -------------------------------------------------------------------------
// TIER 5: Parser Documente Auto — Mostră Germania (BMW 520d)
// -------------------------------------------------------------------------
const sampleDeText = `
BUNDESREPUBLIK DEUTSCHLAND
ZULASSUNGSBESCHEINIGUNG TEIL I
(Fahrzeugschein)
(B) 14.05.2019
(E) WBA3A51070F256789
(D.1) BMW
(D.3) 520d
(P.1) 01995
(P.2) 0140 / 04000
(P.3) DIESEL
(R) SCHWARZ
`;

const parsedDe = parseVehicleDocumentText(sampleDeText, 'DE');

assert(parsedDe.docOriginCountry === 'DE', 'Identifică Germania din antetul documentului', 'Engine/OCR');
assert(parsedDe.brand === 'BMW', 'Recunoaște marca BMW din codul D.1', 'Engine/OCR', `Got: ${parsedDe.brand}`);
assert(parsedDe.model === '520d', 'Recunoaște modelul 520d din codul D.3', 'Engine/OCR', `Got: ${parsedDe.model}`);
assert(parsedDe.vin === 'WBA3A51070F256789', 'Extrage VIN BMW din codul E', 'Engine/OCR', `Got: ${parsedDe.vin}`);
assert(parsedDe.year === 2019, 'Extrage anul 2019 din codul B', 'Engine/OCR', `Got: ${parsedDe.year}`);
assert(parsedDe.engineCc === 1995, 'Extrage cilindreea 1995 cmc din codul P.1', 'Engine/OCR', `Got: ${parsedDe.engineCc}`);
assert(parsedDe.powerKw === 140, 'Extrage puterea 140 kW din codul P.2', 'Engine/OCR', `Got: ${parsedDe.powerKw}`);
assert(parsedDe.powerHp === 190, 'Calculează 190 CP din 140 kW', 'Engine/OCR', `Got: ${parsedDe.powerHp}`);

// -------------------------------------------------------------------------
// TIER 6: Parser Documente Auto — Mostră Reală Austria (Nissan Qashqai J11, KFG 1967)
// -------------------------------------------------------------------------
const sampleAustriaText = `
A1 Zulassungsstelle 5041901 UNIQA St. Johann/Pongau
A2 DVR Nr 0018813
A Kennzeichen JO-268HK
I Zugelassen am: 12.01.2017
C1.1 Nachname Mittersteiner
C1.2 Vorname / A3 Geb.datum Gottfried / 24.02.1957
C1.3 Anschrift Pfunerweg 39/4 Maschl, 5600 Sankt Johann im Pongau
C4 Antragsteller ist: Besitzer, dies ist kein Eigentumsnachweis
A4 Verwendungsbestimmung 01
E FIN: SJNFAAJ11U1120210
B Erstmalige Zulassung am: 09.04.2015 A6 Genehmigungsdatum 10.12.2013
A5 Genehmigungsgrundlage EG-Betriebserlaubnis
K Genehmigungsnummer e11*2007/46*0963*01
A7 Nationaler Code 202676
J Klasse / Fahrzeugart M1/Personenkraftwagen
D1 Marke NISSAN
D3 Handelsbezeichnung NISSAN QASHQAI
D2 Type/Variante/Version J11/A/A01
A8 Aufbau Mehrzweckfahrzeug
R Farbe Weiß A16 Beg. Plakette weiß
G Eigengewicht 1432 kg S1/S2 Sitz-/Stehplätze 5/-
F1 Techn. zul. Gesamtmasse 1910 kg N höchste zulässige Achslasten 1 1010 kg 2 970 kg
F2 Gesamtgewicht 1910 kg
P5 Motortype K9K
P3 Antriebsart Diesel
T Höchstgeschw. 182 km/h P1 Hubraum 1461 ccm
P2 Leistung 81 kW bei Drehzahl 4000 min-1
V9 Abgasklasse/-verhalten nach Euro 5b/(EU)195/2013J
V8 Kraftstoffverbrauch gesamt 3,8 l/100 km V7 CO2 99 g/km
Zulassungsstelle-Nr. 5012404 WIENER STÄDTISCHE Versicherung AGMG
Ungültig gemäß § 40a KFG 1967
`;

const parsedAt = parseVehicleDocumentText(sampleAustriaText, 'AUTO');

assert(parsedAt.docOriginCountry === 'AT', 'Identifică automat originea Austria (KFG 1967 / St. Johann)', 'Engine/OCR', `Got: ${parsedAt.docOriginCountry}`);
assert(parsedAt.brand === 'Nissan', 'Recunoaște marca Nissan din câmpul D1', 'Engine/OCR', `Got: ${parsedAt.brand}`);
assert(parsedAt.model === 'Qashqai', 'Normalizează modelul Qashqai (elimină marca duplicată D3)', 'Engine/OCR', `Got: ${parsedAt.model}`);
assert(parsedAt.vin === 'SJNFAAJ11U1120210', 'Extrage VIN complet din "E FIN: SJNFAAJ11U1120210"', 'Engine/OCR', `Got: ${parsedAt.vin}`);
assert(parsedAt.isVinValid === true, 'Validează VIN-ul britanic SJN conform ISO 3779', 'Engine/OCR');
assert(parsedAt.year === 2015, 'Extrage anul fabricației 2015 din Erstmalige Zulassung (Cod B)', 'Engine/OCR', `Got: ${parsedAt.year}`);
assert(parsedAt.firstRegistrationDate === '09.04.2015', 'Extrage data completă a primei înmatriculări 09.04.2015', 'Engine/OCR', `Got: ${parsedAt.firstRegistrationDate}`);
assert(parsedAt.engineCc === 1461, 'Extrage cilindreea 1461 ccm din P1 Hubraum', 'Engine/OCR', `Got: ${parsedAt.engineCc}`);
assert(parsedAt.powerKw === 81, 'Extrage puterea 81 kW din P2 Leistung', 'Engine/OCR', `Got: ${parsedAt.powerKw}`);
assert(parsedAt.powerHp === 110, 'Calculează automat 110 CP din 81 kW (rotunjire 1.35962)', 'Engine/OCR', `Got: ${parsedAt.powerHp}`);
assert(parsedAt.fuelType === 'Diesel', 'Identifică combustibil Diesel din P3 Antriebsart', 'Engine/OCR', `Got: ${parsedAt.fuelType}`);
assert(parsedAt.color === 'Alb', 'Convertește culoarea Weiß în Alb', 'Engine/OCR', `Got: ${parsedAt.color}`);
assert(parsedAt.bodyType === 'SUV', 'Mapează A8 Aufbau: Mehrzweckfahrzeug în SUV', 'Engine/OCR', `Got: ${parsedAt.bodyType}`);
assert(parsedAt.civNumber === 'AT-202676', 'Extrage Codul Național A7 ca AT-202676', 'Engine/OCR', `Got: ${parsedAt.civNumber}`);
assert(parsedAt.confidenceScore >= 80, 'Scor de încredere ridicat pentru document Austria (>80%)', 'Engine/OCR', `Got: ${parsedAt.confidenceScore}`);


// -------------------------------------------------------------------------
// RAPORTARE REZULTATE
// -------------------------------------------------------------------------
console.log('='.repeat(70));
console.log('           REZUMAT REZULTATE TESTE QA AGENTIC TEAM');
console.log('='.repeat(70));

let passCount = 0;
let failCount = 0;

results.forEach((r, idx) => {
  const icon = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} #${idx + 1} [${r.tier}] ${r.name}`);
  if (!r.passed && r.details) {
    console.log(`    ↳ Detalii eroare: ${r.details}`);
  }
  if (r.passed) passCount++;
  else failCount++;
});

console.log('='.repeat(70));
console.log(`TOTAL: ${results.length} teste | TRECUTE: ${passCount} | EȘUATE: ${failCount}`);
console.log('='.repeat(70));

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 Toate aserțiunile QA au trecut cu succes 100%!');
  process.exit(0);
}
