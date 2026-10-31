/**
 * Script de curățare profundă pentru dotările și descrierile mașinilor din seed (MPI Auto & ParcOS)
 * - Convertește toate cheile raw (snake_case, typo-uri, caractere invizibile \u2060, carlig_copy) în denumiri auto premium românești
 * - Deduplică dotările redundante (ex: trapă + trapă panoramică, cârlig + carlig_copy)
 * - Generează descrieri editoriale complete, structurate și convingătoare pentru fiecare automobil din stoc
 * - Păstrează izolarea 100% de brand (Zero-Bleed: fără referințe RXM în datele MPI Auto)
 * - Actualizează src/db/mpiVehicles.ts, server/seeds.json, data/import/mpi/* și baza de date PostgreSQL de pe Netcup VPS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FEATURE_LABEL_MAP = {
  // Siguranță & Asistență la condus
  'senzor_ploaie': 'Senzori de ploaie cu acționare automată',
  'senzor_lumini': 'Senzori de lumină (aprindere automată faruri)',
  'senzoriparcarefata': 'Senzori de parcare față',
  'senzoriparcarespate': 'Senzori de parcare spate',
  'parktronic': 'Sistem asistență parcare Parktronic (față/spate)',
  'parcarea': 'Asistent parcare automată (Park Assist)',
  'farurixenon': 'Faruri Bi-Xenon / Xenon adaptive',
  'spalatoarefar': 'Spălătoare faruri telescopice',
  'cameramarsarier': 'Cameră video marșarier',
  'adaptivecruisecontrol': 'Pilot automat adaptiv (Adaptive Cruise Control)',
  'speed warning': 'Avertizare depășire viteză (Speed Warning)',
  'stopuri led': 'Stopuri spate cu tehnologie LED',
  'lumini de zi led': 'Lumini de zi LED (Daylight)',
  'laneassist': 'Lane Assist (Asistent activ menținere bandă)',
  'semne': 'Sign Assist (Recunoaștere indicatoare rutiere)',
  'frontassis': 'Front Assist cu frânare autonomă de urgență',
  'driveralert': 'Driver Alert (Sistem detectare oboseală șofer)',
  'asistentiesireparcare': 'Rear Traffic Alert (Asistent ieșire parcare)',
  'blindsportassist': 'Blind Spot Assist (Asistent monitorizare unghi mort)',
  'asistent faza lunga': 'Asistent fază lungă automată (High Beam Assist)',
  'roata de rezerva': 'Roată de rezervă completă',

  // Confort & Interior
  'servo_directie': 'Servodirecție asistată electronic',
  'clima': 'Climatizare automată Climatronic',
  'geamuri_electrice': 'Geamuri electrice față / spate',
  'computer_bord': 'Computer de bord multifuncțional',
  'incalzire_scaune': 'Scaune față încălzite cu reglaj termic',
  'incalzire_oglinzi': 'Oglinzi exterioare încălzite și reglabile electric',
  'oglinzirabatabileelectric': 'Oglinzi exterioare rabatabile electric',
  'interior_piele': 'Tapițerie interior piele de înaltă calitate',
  'keyless entry': 'Keyless Entry (Acces fără cheie)',
  'keyless go': 'Keyless GO (Pornire motor la buton)',
  'moduri de condus': 'Selector moduri de condus (Drive Mode Select)',
  'carlig': 'Cârlig de remorcare omologat',
  'carlig_copy': 'Cârlig de remorcare omologat',
  'haionelectric': 'Portbagaj / Haion acționat electric',
  'trapapanoramica': 'Plafon panoramic din sticlă',
  'trapa': 'Trapă electrică rabatabilă',
  'volansport': 'Volan sport multifuncțional îmbrăcat în piele',
  'incalzireinvolan': 'Volan încălzit cu reglaj termic',
  'scaune sport': 'Scaune sport ergonomice cu suport lateral',
  'incalzirebancheta': 'Banchetă spate încălzită',
  'incalzireinparbriz': 'Parbriz cu degivrare termică încălzit',
  'set complet roti de iarna/vara extra': 'Set complet roți suplimentare (Iarnă / Vară)',
  'webasto': 'Încălzire auxiliară programabilă (Webasto)',
  'scaunemasaj': 'Scaune ergonomice cu funcție de masaj',
  'cruise_control': 'Pilot automat (Cruise Control / Tempomat)',

  // Tehnologie & Multimedia
  'usbaux': 'Conexiune multimedia USB & AUX-In',
  'bluethooth': 'Conectivitate Bluetooth Audio & Handsfree',
  'navigatie_gps': 'Sistem de navigație GPS profesional',
  'applecarplay': 'Conectivitate Apple CarPlay',
  'androidauto': 'Conectivitate Android Auto',
  'sistemsonorizarepremium': 'Sistem sonorizare audio premium',
  'bordvirtual': 'Ceasuri de bord digitale (Virtual Cockpit)',
  'wirelesstel': 'Încărcare telefon prin inducție (Wireless Charging)'
};

const LABEL_TO_CANONICAL_KEY = {};
for (const [key, label] of Object.entries(FEATURE_LABEL_MAP)) {
  LABEL_TO_CANONICAL_KEY[key] = key;
  LABEL_TO_CANONICAL_KEY[label.toLowerCase()] = key;
}
LABEL_TO_CANONICAL_KEY['plafon panoramic din sticlă'] = 'trapapanoramica';
LABEL_TO_CANONICAL_KEY['trapă electrică rabatabilă'] = 'trapa';
LABEL_TO_CANONICAL_KEY['plafon panoramic mare din sticlă cu trapă rabatabilă electric'] = 'trapapanoramica_si_trapa';
LABEL_TO_CANONICAL_KEY['cârlig de remorcare omologat'] = 'carlig';

function cleanRawKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/^[\u2060\u00a0\s]+|[\u2060\u00a0\s]+$/g, '')
    .toLowerCase()
    .trim();
}

function normalizeFeaturesForCar(car) {
  const rawList = [];
  ['safety', 'comfort', 'multimedia'].forEach(cat => {
    (car.features?.[cat] || []).forEach(f => rawList.push(f));
  });

  const keys = new Set(
    rawList
      .map(cleanRawKey)
      .map(k => LABEL_TO_CANONICAL_KEY[k] || k)
      .filter(Boolean)
  );
  const hasPanoramica = keys.has('trapapanoramica') || keys.has('trapapanoramica_si_trapa');
  const hasTrapa = keys.has('trapa') || keys.has('trapapanoramica_si_trapa');

  const safety = [];
  const comfort = [];
  const multimedia = [];

  const safetyKeys = [
    'senzor_ploaie', 'senzor_lumini', 'senzoriparcarefata', 'senzoriparcarespate',
    'parktronic', 'parcarea', 'farurixenon', 'spalatoarefar', 'cameramarsarier',
    'adaptivecruisecontrol', 'speed warning', 'stopuri led', 'lumini de zi led',
    'laneassist', 'semne', 'frontassis', 'driveralert', 'asistentiesireparcare',
    'blindsportassist', 'asistent faza lunga', 'roata de rezerva'
  ];

  const multimediaKeys = [
    'usbaux', 'bluethooth', 'navigatie_gps', 'applecarplay', 'androidauto',
    'sistemsonorizarepremium', 'bordvirtual', 'wirelesstel'
  ];

  // Adăugare trapă / panoramic deduplicate
  if (hasPanoramica && hasTrapa) {
    comfort.push('Plafon panoramic mare din sticlă cu trapă rabatabilă electric');
  } else if (hasPanoramica) {
    comfort.push('Plafon panoramic din sticlă');
  } else if (hasTrapa) {
    comfort.push('Trapă electrică rabatabilă');
  }

  // Cârlig deduplicate
  const hasCarlig = keys.has('carlig') || keys.has('carlig_copy');
  if (hasCarlig) {
    comfort.push('Cârlig de remorcare omologat');
  }

  // Parcurgere chei
  for (const k of keys) {
    if (k === 'trapa' || k === 'trapapanoramica' || k === 'trapapanoramica_si_trapa' || k === 'carlig' || k === 'carlig_copy') continue;
    const label = FEATURE_LABEL_MAP[k] || (k.charAt(0).toUpperCase() + k.slice(1));
    if (safetyKeys.includes(k)) {
      safety.push(label);
    } else if (multimediaKeys.includes(k)) {
      multimedia.push(label);
    } else {
      comfort.push(label);
    }
  }

  const allCleanList = [...safety, ...comfort, ...multimedia];
  const equipmentSheetText = allCleanList.join(' • ');

  return {
    features: { safety, comfort, multimedia },
    equipmentSheetText,
    allCleanList
  };
}

function generateCleanEditorialDescription(car, allCleanList) {
  const brand = car.brand || 'Autoturism';
  const rawModel = car.model || '';
  const cleanModel = rawModel.replace(/avant|limuzina|sedan|break|hatchback|coupe/gi, '').trim() || rawModel;
  const versionTrim = (car.versionTrim || '').trim();
  const year = car.year || 2018;
  const mileageKm = car.mileageKm ? Number(car.mileageKm) : 0;
  const formattedMileage = mileageKm > 0 ? `${mileageKm.toLocaleString('ro-RO')} km` : 'Rulaj certificat';
  const fuelType = car.fuelType || 'Diesel';
  const transmission = car.transmission || 'Automată';
  const engineCc = car.engineCc ? `${car.engineCc} cm³` : '';
  const powerHp = (car.powerHp && Number(car.powerHp) > 0) ? `${car.powerHp} CP` : '';
  const drivetrain = car.drivetrain && car.drivetrain !== 'Față' ? `Tracțiune ${car.drivetrain}` : '';

  const techSpecs = [engineCc, fuelType, powerHp, transmission, drivetrain].filter(Boolean).join(' • ');

  const titleHeader = `${year} ${brand} ${cleanModel}${versionTrim ? ` ${versionTrim}` : ''}`;

  let desc = `${titleHeader}\n`;
  desc += `${techSpecs} | ${formattedMileage} garantați contractual pe factură fiscală.\n\n`;
  desc += `Autoturismul se prezintă într-o stare tehnică și estetică remarcabilă, import recent, cu revizie efectuată și istoric transparent verificat. Fără daune structurale sau vicii ascunse, pregătit pentru utilizare imediată.\n\n`;

  // Top dotări (primele 8-10 cele mai relevante)
  if (allCleanList.length > 0) {
    desc += `Dotări & Echipamente Principale:\n`;
    const topFeats = allCleanList.slice(0, 10);
    topFeats.forEach(f => {
      desc += `• ${f}\n`;
    });
    if (allCleanList.length > 10) {
      desc += `• Și multe altele (+${allCleanList.length - 10} dotări complete în fișa tehnică a vehiculului)\n`;
    }
    desc += `\n`;
  }

  if (car.vatDeductible) {
    desc += `💼 Regim Fiscal B2B:\n• Preț cu TVA deductibil inclus pe factură (posibilitate deducere integrală pentru firme eligibile).\n\n`;
  }

  desc += `🛡️ Servicii & Siguranță Incluse MPI Auto:\n`;
  desc += `• Garanție scrisă contractuală 12 luni MPI Car Protect inclusă în preț (fără costuri ascunse)\n`;
  desc += `• Rulaj garantat juridic, consemnat expres pe contractul de vânzare și factura fiscală\n`;
  desc += `• Posibilitate achiziție în rate fixe avantajoase doar cu buletinul (TBI Bank, BT Leasing) cu aprobare rapidă în sub 24h\n`;
  desc += `• Livrare gratuită pe platformă la domiciliu oriunde în România sau eliberare numere roșii provizorii pe loc\n`;
  desc += `• Serviciu profesionist de Buy-Back (evaluare corectă a mașinii vechi ca avans)`;

  return desc;
}

function cleanMpiCars() {
  console.log('🚗 Începem procesul de curățare dotări și descrieri pentru stocul MPI Auto...');

  const mpiTsPath = path.join(__dirname, '..', 'src', 'db', 'mpiVehicles.ts');
  const content = fs.readFileSync(mpiTsPath, 'utf8');
  const match = content.match(/export const SEED_MPI_VEHICLES: VehicleItem\[\] = (\[[\s\S]*?\]);\s*$/);
  if (!match) {
    throw new Error('Nu am putut citi SEED_MPI_VEHICLES din src/db/mpiVehicles.ts');
  }

  const rawCars = new Function('return ' + match[1])();
  console.log(`📦 Găsite ${rawCars.length} vehicule în mpiVehicles.ts.`);

  const cleanedCars = rawCars.map((car, index) => {
    const { features, equipmentSheetText, allCleanList } = normalizeFeaturesForCar(car);
    const description = generateCleanEditorialDescription(car, allCleanList);

    return {
      ...car,
      features,
      equipmentSheetText,
      description
    };
  });

  // 1. Salvare în src/db/mpiVehicles.ts
  const newMpiContent = `import { VehicleItem } from './types';\n\n// 80 Autoturisme Importate Real din Stocul MPI Auto Cluj (Centura Apahida) - Date Curățate & Standardizate\nexport const SEED_MPI_VEHICLES: VehicleItem[] = ${JSON.stringify(cleanedCars, null, 2)};\n`;
  fs.writeFileSync(mpiTsPath, newMpiContent, 'utf8');
  console.log(`✅ [1/5] Actualizat cu succes ${cleanedCars.length} mașini în src/db/mpiVehicles.ts.`);

  // 2. Salvare în data/import/mpi/cars.json și cars_with_cdn.json
  const dataDir = path.join(__dirname, '..', 'data', 'import', 'mpi');
  const carsJsonPath = path.join(dataDir, 'cars.json');
  const cdnJsonPath = path.join(dataDir, 'cars_with_cdn.json');

  if (fs.existsSync(carsJsonPath)) {
    fs.writeFileSync(carsJsonPath, JSON.stringify(cleanedCars, null, 2), 'utf8');
    console.log(`✅ [2/5] Actualizat data/import/mpi/cars.json.`);
  }

  if (fs.existsSync(cdnJsonPath)) {
    const cdnCars = JSON.parse(fs.readFileSync(cdnJsonPath, 'utf8'));
    const cleanMap = new Map(cleanedCars.map(c => [c.id, c]));
    const updatedCdnCars = cdnCars.map(car => {
      const clean = cleanMap.get(car.id);
      if (clean) {
        return {
          ...car,
          features: clean.features,
          equipmentSheetText: clean.equipmentSheetText,
          description: clean.description
        };
      }
      return car;
    });
    fs.writeFileSync(cdnJsonPath, JSON.stringify(updatedCdnCars, null, 2), 'utf8');
    console.log(`✅ [3/5] Actualizat data/import/mpi/cars_with_cdn.json.`);
  }

  // 3. Salvare în server/seeds.json
  const seedsPath = path.join(__dirname, '..', 'server', 'seeds.json');
  if (fs.existsSync(seedsPath)) {
    const allSeeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
    const cleanMap = new Map(cleanedCars.map(c => [c.id, c]));
    const updatedSeeds = allSeeds.map(car => {
      if (cleanMap.has(car.id)) {
        const clean = cleanMap.get(car.id);
        return {
          ...car,
          features: clean.features,
          equipmentSheetText: clean.equipmentSheetText,
          description: clean.description
        };
      }
      return car;
    });
    fs.writeFileSync(seedsPath, JSON.stringify(updatedSeeds, null, 2), 'utf8');
    console.log(`✅ [4/5] Actualizat server/seeds.json (${updatedSeeds.length} vehicule totale).`);
  }

  // 4. Generare script SQL de update pentru PostgreSQL VPS (Netcup)
  console.log('🔄 [5/5] Generăm SQL de actualizare pentru PostgreSQL pe Netcup VPS...');
  const sqlLines = [];
  sqlLines.push('SET client_encoding = \'UTF8\';');
  sqlLines.push('BEGIN;');

  for (const car of cleanedCars) {
    const escapedDesc = car.description.replace(/'/g, "''");
    const escapedSheet = car.equipmentSheetText.replace(/'/g, "''");
    const escapedFeatures = JSON.stringify(car.features).replace(/'/g, "''");
    const escapedId = car.id.replace(/'/g, "''");

    sqlLines.push(`UPDATE vehicles SET features = '${escapedFeatures}'::jsonb, equipment_sheet_text = '${escapedSheet}', description = '${escapedDesc}', updated_at = NOW() WHERE id = '${escapedId}' AND dealer_slug = 'mpi_auto';`);
  }

  sqlLines.push('COMMIT;');
  sqlLines.push('');

  const sqlFilePath = path.join(dataDir, 'update_clean_features_desc.sql');
  fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
  console.log(`💾 Salvat fișier SQL: ${sqlFilePath} (${(fs.statSync(sqlFilePath).size / 1024).toFixed(1)} KB).`);

  // Execuție SQL pe VPS via SSH cu stream pur UTF-8
  console.log('🚀 Executăm actualizarea în PostgreSQL pe Netcup VPS (152.53.158.65) cu stream UTF-8 pur...');
  try {
    const sqlBuffer = fs.readFileSync(sqlFilePath);
    const res = execSync('ssh -o BatchMode=yes -o ConnectTimeout=10 root@152.53.158.65 "docker exec -i 6fezufnklecoapemrupsqpxh psql -U postgres -d parcos"', { input: sqlBuffer }).toString('utf8');
    console.log('✅ Răspuns PostgreSQL VPS:\n', res.slice(-300));
  } catch (err) {
    console.error('⚠️ Eroare la rularea pe VPS:', err.message);
  }

  console.log('\n🎉 Curățare completă finalizată cu succes!');
}

if (require.main === module) {
  cleanMpiCars();
}

module.exports = { cleanMpiCars, normalizeFeaturesForCar, generateCleanEditorialDescription };
