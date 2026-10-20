const fs = require('fs');
const path = require('path');

const extractedPath = path.join(__dirname, '..', '.scratch', 'raw_extracted_32_cars.json');
const mapPath = path.join(__dirname, '..', '.scratch', 'car_folder_map.json');
const vehiclesTsPath = path.join(__dirname, '..', 'src', 'db', 'vehicles.ts');

const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
const folderMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// Helper normalizers
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

function normalizeBodyType(body, model, text) {
  const combined = ((body || '') + ' ' + (model || '') + ' ' + (text || '')).toLowerCase();
  if (combined.includes('suv') || combined.includes('countryman') || combined.includes('cherokee') || combined.includes('koleos') || combined.includes('captur') || combined.includes('tiguan') || combined.includes('duster')) return 'SUV';
  if (combined.includes('break') || combined.includes('avant') || combined.includes('touring') || combined.includes('variant') || combined.includes('wagon')) return 'Break';
  if (combined.includes('coupe') || combined.includes('cc')) return 'Coupe';
  if (combined.includes('hatchback') || combined.includes('golf') || combined.includes('fabia') || combined.includes('208') || combined.includes('megane') || combined.includes('leon') || combined.includes('clio') || combined.includes('fortwo')) return 'Hatchback';
  return 'Sedan';
}

function normalizeDrivetrain(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('4x4') || t.includes('awd') || t.includes('quattro') || t.includes('4motion') || t.includes('xdrive') || t.includes('x-drive') || t.includes('all4')) return '4x4 / AWD';
  if (t.includes('spate') || t.includes('rwd') || (t.includes('bmw') && !t.includes('xdrive'))) return 'Spate';
  return 'Față';
}

function parseNumber(text, fallback = 0) {
  if (!text) return fallback;
  const num = parseInt(String(text).replace(/\D/g, ''), 10);
  return isNaN(num) ? fallback : num;
}

function generateCleanFeatures(car) {
  const text = (car.title + ' ' + car.description).toLowerCase();
  
  const safety = [];
  if (text.includes('front assist') || text.includes('pre sense') || text.includes('braking guard')) safety.push('Front Assist cu frânare automată');
  if (text.includes('lane assist')) safety.push('Lane Assist (Asistent menținere bandă)');
  if (text.includes('sign assist')) safety.push('Sign Assist (Recunoaștere indicatoare rutiere)');
  if (text.includes('distronic') || text.includes('pilot automat') || text.includes('tempomat')) safety.push('Pilot automat adaptiv (Tempomat)');
  if (text.includes('led') || text.includes('xenon') || text.includes('matrix')) safety.push('Faruri LED / Xenon cu lumini de zi');
  if (text.includes('senzori de parcare') || text.includes('park assist')) safety.push('Senzori parcare față/spate cu avertizare');
  if (text.includes('camera') || text.includes('360')) safety.push('Cameră video marșarier / 360°');
  if (text.includes('isofix')) safety.push('Sistem prindere scaune copii ISOFIX');
  if (safety.length === 0) safety.push('Sistem avansat de siguranță activă și pasivă (ESP, ABS, Airbag-uri)');

  const comfort = [];
  if (text.includes('panoramic') || text.includes('trapa')) comfort.push('Plafon Panoramic / Trapă din sticlă');
  if (text.includes('incalzire in scaune') || text.includes('scaune incalzite') || text.includes('încălzite')) comfort.push('Scaune încălzite față');
  if (text.includes('ventilatie') || text.includes('ventilație')) comfort.push('Scaune ventilate');
  if (text.includes('climatronic') || text.includes('dublu')) comfort.push('Dublu Climatronic automat bi-zonal');
  if (text.includes('keyless')) comfort.push('Keyless Entry & Keyless Go (Pornire buton)');
  if (text.includes('piele') || text.includes('nappa') || text.includes('recaro')) comfort.push('Tapițerie din piele / Scaune confort');
  if (text.includes('volan') && text.includes('comenzi')) comfort.push('Volan multifuncțional îmbrăcat în piele cu comenzi');
  if (comfort.length === 0) comfort.push('Aer condiționat automat, geamuri și oglinzi electrice');

  const multimedia = [];
  if (text.includes('virtual') || text.includes('digital') || text.includes('ceasuri')) multimedia.push('Ceasuri de bord digitale (Virtual Cockpit)');
  if (text.includes('navigatie') || text.includes('navigație') || text.includes('3d')) multimedia.push('Sistem de navigație profesional 3D cu hărți Europa');
  if (text.includes('bluetooth') || text.includes('carplay') || text.includes('android')) multimedia.push('Conectivitate Bluetooth Audio & Handsfree');
  if (text.includes('bose') || text.includes('logic 7') || text.includes('harman') || text.includes('sound')) multimedia.push('Sistem sonorizare premium');
  if (multimedia.length === 0) multimedia.push('Sistem multimedia cu ecran color și conexiune USB/Bluetooth');

  return { safety, comfort, multimedia };
}

function cleanDescription(car) {
  const brand = normalizeBrand(car.brand);
  const model = car.model || '';
  const year = car.year;
  const km = parseMileage(car);
  const trans = normalizeTransmission(car.params?.join(' ') + ' ' + car.title);
  
  return `${brand} ${model} din anul ${year}, într-o stare estetică și tehnică excelentă, rulaj garantat de ${km.toLocaleString('ro-RO')} km cu istoric verificat. ` +
    `Beneficiază de garanție scrisă 12 luni inclusă în preț, posibilitate finanțare în rate fixe avantajoase prin BT Direct / TBI Bank / UniCredit și eliberare numere roșii provizorii pe loc.`;
}

function parseMileage(car) {
  const combined = (car.params?.join(' ') + ' ' + car.title + ' ' + car.description).toLowerCase();
  const kmMatch = combined.match(/(\d{2,3}[\s.]?\d{3})\s*km/);
  if (kmMatch) {
    return parseInt(kmMatch[1].replace(/[\s.]/g, ''), 10);
  }
  return 150000;
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

console.log('Helpers defined. Total extracted cars:', extracted.length);
