const fs = require('fs');
const path = require('path');

const extractedPath = path.join(__dirname, '..', '.scratch', 'raw_extracted_32_cars.json');
const mapPath = path.join(__dirname, '..', '.scratch', 'car_folder_map.json');

const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
const folderMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// The 12 existing vehicle IDs in vehicles.ts
const existingOlxIds = new Set([
  'kCF6U', // bmw 520d
  'k8Cta', // jeep
  'kyTQw', // bmw 420d
  'kThcp', // vw golf
  'kBGFP', // audi a5
  'kHruD', // vw passat cc
  'kNuug', // audi q3
  'jvsgr', // opel insignia
  'kRcZI', // skoda fabia
  'kTvy7', // renault koleos
  'kebU3', // mercedes c
  'kVf2b'  // renault talisman
]);

function normalizeBrand(raw) {
  if (!raw) return 'Necunoscut';
  const r = raw.trim();
  if (/bmw/i.test(r)) return 'BMW';
  if (/audi/i.test(r)) return 'Audi';
  if (/mercedes/i.test(r)) return 'Mercedes-Benz';
  if (/volkswagen|vw/i.test(r)) return 'Volkswagen';
  if (/renault/i.test(r)) return 'Renault';
  if (/peugeot/i.test(r)) return 'Peugeot';
  if (/skoda|škoda/i.test(r)) return 'Skoda';
  if (/ford/i.test(r)) return 'Ford';
  if (/jeep/i.test(r)) return 'Jeep';
  if (/seat/i.test(r)) return 'Seat';
  if (/dacia/i.test(r)) return 'Dacia';
  if (/volvo/i.test(r)) return 'Volvo';
  if (/mini|minicooper/i.test(r)) return 'Mini';
  if (/smart/i.test(r)) return 'Smart';
  if (/opel/i.test(r)) return 'Opel';
  return r;
}

function normalizeFuel(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('diesel')) return 'Diesel';
  if (t.includes('benzin') || t.includes('petrol')) return 'Benzină';
  if (t.includes('hibrid') || t.includes('hybrid')) return 'Hibrid';
  if (t.includes('electric')) return 'Electric';
  return 'Diesel';
}

function normalizeTransmission(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('automat') || t.includes('dsg') || t.includes('tiptronic') || t.includes('steptronic') || t.includes('edc')) return 'Automată';
  return 'Manuală';
}

function normalizeBodyType(model, title, paramsText) {
  const combined = ((model || '') + ' ' + (title || '') + ' ' + (paramsText || '')).toLowerCase();
  if (combined.includes('suv') || combined.includes('countryman') || combined.includes('cherokee') || combined.includes('koleos') || combined.includes('captur') || combined.includes('tiguan') || combined.includes('duster') || combined.includes('2008') || combined.includes('x1') || combined.includes('x3') || combined.includes('q3') || combined.includes('q5')) return 'SUV';
  if (combined.includes('break') || combined.includes('avant') || combined.includes('touring') || combined.includes('variant') || combined.includes('wagon')) return 'Break';
  if (combined.includes('coupe') || combined.includes('cc')) return 'Coupe';
  if (combined.includes('hatchback') || combined.includes('golf') || combined.includes('fabia') || combined.includes('208') || combined.includes('megane') || combined.includes('leon') || combined.includes('clio') || combined.includes('fortwo') || combined.includes('sandero')) return 'Hatchback';
  return 'Sedan';
}

function normalizeDrivetrain(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('4x4') || t.includes('awd') || t.includes('quattro') || t.includes('4motion') || t.includes('4 motion') || t.includes('xdrive') || t.includes('x-drive') || t.includes('all4')) return '4x4 / AWD';
  if (t.includes('spate') || t.includes('rwd') || (t.includes('bmw') && !t.includes('xdrive'))) return 'Spate';
  return 'Față';
}

function parseMileage(car) {
  const combined = (car.params?.join(' ') + ' ' + car.title + ' ' + car.description).toLowerCase();
  const kmMatch = combined.match(/(\d{2,3}[\s.]?\d{3})\s*km/);
  if (kmMatch) {
    return parseInt(kmMatch[1].replace(/[\s.]/g, ''), 10);
  }
  return 155000;
}

function parsePower(car) {
  const combined = (car.params?.join(' ') + ' ' + car.title + ' ' + car.description).toLowerCase();
  const cpMatch = combined.match(/(\d{2,3})\s*cp/);
  if (cpMatch) {
    return parseInt(cpMatch[1], 10);
  }
  return 150;
}

function parseEngineCc(car) {
  const combined = (car.params?.join(' ') + ' ' + car.title + ' ' + car.description).toLowerCase();
  const ccMatch = combined.match(/(\d[\s.]?\d{3})\s*cm/);
  if (ccMatch) {
    return parseInt(ccMatch[1].replace(/[\s.]/g, ''), 10);
  }
  return 1995;
}

function normalizeColor(car) {
  const c = (car.color || '').toLowerCase();
  if (c.includes('albastru') || c.includes('blue')) return 'Albastru Metalizat';
  if (c.includes('negru') || c.includes('black')) return 'Negru Cristal';
  if (c.includes('gri') || c.includes('gray') || c.includes('grey') || c.includes('argintiu') || c.includes('silver')) return 'Gri Metalizat';
  if (c.includes('alb') || c.includes('white')) return 'Alb Pur';
  if (c.includes('rosu') || c.includes('red')) return 'Roșu';
  if (c.includes('maro') || c.includes('brown')) return 'Maro';
  if (c.includes('verde') || c.includes('green')) return 'Verde';
  return 'Gri Metalizat';
}

function generateCleanFeatures(car) {
  const text = (car.title + ' ' + car.description).toLowerCase();
  
  const safety = [];
  if (text.includes('front assist') || text.includes('pre sense') || text.includes('braking guard')) safety.push('Front Assist cu frânare autonomă de urgență');
  if (text.includes('lane assist')) safety.push('Lane Assist (Asistent menținere bandă de rulare)');
  if (text.includes('sign assist')) safety.push('Sign Assist (Recunoaștere indicatoare rutiere)');
  if (text.includes('distronic') || text.includes('pilot automat') || text.includes('tempomat')) safety.push('Pilot automat (Tempomat cu limitator de viteză)');
  if (text.includes('led') || text.includes('xenon') || text.includes('matrix') || text.includes('bi-xenon')) safety.push('Faruri LED / Bi-Xenon cu lumini de zi automate');
  if (text.includes('senzori de parcare') || text.includes('park assist')) safety.push('Senzori parcare față / spate cu afișaj acustic și grafic');
  if (text.includes('camera') || text.includes('360')) safety.push('Cameră video marșarier / 360°');
  if (text.includes('isofix')) safety.push('Sistem de prindere scaune copii ISOFIX');
  if (safety.length === 0) safety.push('Sisteme avansate de siguranță activă (ESP, ABS, Airbag-uri multiple)');

  const comfort = [];
  if (text.includes('panoramic') || text.includes('trapa')) comfort.push('Plafon Panoramic mare din sticlă rabatabil electric');
  if (text.includes('incalzire') || text.includes('încălzite') || text.includes('scaune incalzite')) comfort.push('Scaune față încălzite cu reglaj termic');
  if (text.includes('ventilatie') || text.includes('ventilație')) comfort.push('Scaune ventilate cu micro-perforații');
  if (text.includes('climatronic') || text.includes('dublu climatronic')) comfort.push('Dublu Climatronic automat pe 2 zone');
  if (text.includes('keyless')) comfort.push('Keyless Entry & Keyless Go (Acces și pornire fără cheie)');
  if (text.includes('piele') || text.includes('nappa') || text.includes('recaro') || text.includes('alcantara')) comfort.push('Tapițerie confort piele / alcantara de înaltă calitate');
  if (text.includes('volan') && (text.includes('comenzi') || text.includes('multifunctional') || text.includes('multifuncțional'))) comfort.push('Volan sport multifuncțional îmbrăcat în piele cu comenzi');
  if (comfort.length === 0) comfort.push('Climatizare automată, oglinzi electrice heliomate și geamuri electrice');

  const multimedia = [];
  if (text.includes('virtual') || text.includes('digital') || text.includes('ceasuri digitale')) multimedia.push('Ceasuri de bord digitale (Virtual Cockpit)');
  if (text.includes('navigatie') || text.includes('navigație') || text.includes('3d') || text.includes('gps')) multimedia.push('Sistem de navigație profesional 3D cu hărți complete Europa');
  if (text.includes('bluetooth') || text.includes('carplay') || text.includes('android')) multimedia.push('Conectivitate extinsă Bluetooth Audio & Handsfree');
  if (text.includes('bose') || text.includes('logic 7') || text.includes('harman') || text.includes('sound') || text.includes('audio')) multimedia.push('Sistem audio de înaltă fidelitate cu procesor acustic');
  if (multimedia.length === 0) multimedia.push('Sistem multimedia color cu intrare USB și conexiune Bluetooth');

  return { safety, comfort, multimedia };
}

function cleanDescription(car, brand, model, year, km) {
  return `${brand} ${model} din anul ${year}, în stare tehnică și estetică remarcabilă, rulaj garantat de ${km.toLocaleString('ro-RO')} km cu istoric verificat. ` +
    `Beneficiază de garanție scrisă 12 luni inclusă în preț, posibilitate finanțare în rate fixe avantajoase prin partenerii noștri (BT Direct, TBI Bank, UniCredit) și eliberare numere roșii provizorii pe loc.`;
}

// Convert all extracted new cars
const newVehicles = [];
let stockCounter = 9100;

for (const car of extracted) {
  if (existingOlxIds.has(car.olxId)) {
    continue; // Already handled in vehicles.ts
  }

  const brand = normalizeBrand(car.brand);
  const rawModel = car.model || '';
  const cleanModel = rawModel.replace(/avant|limuzina|sedan|break|hatchback|coupe/gi, '').trim() || car.title.split(' ')[1] || 'Model';
  const year = car.year || 2016;
  const km = parseMileage(car);
  const priceEur = car.priceEur || 10000;
  const paramsStr = (car.params || []).join(' ');
  const fuelType = normalizeFuel(paramsStr + ' ' + car.title);
  const transmission = normalizeTransmission(paramsStr + ' ' + car.title);
  const powerHp = parsePower(car);
  const engineCc = parseEngineCc(car);
  const bodyType = normalizeBodyType(cleanModel, car.title, paramsStr);
  const drivetrain = normalizeDrivetrain(paramsStr + ' ' + car.title);
  const color = normalizeColor(car);
  const folderName = folderMap[car.olxId] || `OLXRXM_${car.olxId}`;

  // Build clean images list
  const images = [];
  for (let i = 1; i <= 8; i++) {
    images.push(`/cars/${folderName}/image_${String(i).padStart(2, '0')}.webp`);
  }

  const slug = `${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${cleanModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}-${car.olxId.toLowerCase()}`;
  stockCounter++;
  const stockNumber = `RXM-${stockCounter}`;

  // Extract clean trim subtitle
  const titleParts = car.title.split('!').map(s => s.trim()).filter(s => s && !s.toLowerCase().includes('rate') && !s.toLowerCase().includes('garan') && !s.toLowerCase().includes('km'));
  const versionTrim = titleParts.slice(1).join(' • ') || `${cleanModel} Edition`;

  const item = {
    id: slug,
    stockNumber,
    brand,
    model: cleanModel,
    versionTrim,
    year,
    mileageKm: km,
    priceEur,
    vatDeductible: false,
    fuelType,
    transmission,
    powerHp,
    engineCc,
    bodyType,
    drivetrain,
    color,
    vin: `VF1RXM${stockCounter}CLUJ99`,
    warrantyMonths: 12,
    status: 'in_stock',
    images,
    olxUrl: car.url,
    olxId: car.olxId,
    olxStatus: 'active',
    olxDiscrepancy: 'none',
    lastOlxSyncAt: '2026-10-11T16:00:00Z',
    features: generateCleanFeatures(car),
    description: cleanDescription(car, brand, cleanModel, year, km)
  };

  newVehicles.push(item);
}

console.log(`Generated ${newVehicles.length} new vehicles from live OLX catalog!`);
fs.writeFileSync('.scratch/new_vehicles_preview.json', JSON.stringify(newVehicles, null, 2), 'utf8');
