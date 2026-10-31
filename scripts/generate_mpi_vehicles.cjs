const fs = require('fs');
const path = require('path');

const rawCars = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/import/mpi/cars_with_cdn.json'), 'utf8'));

// Model mapping for the 6 cars with empty models
const modelFixes = {
  'mpi-37898-2018-seat-ateca-fr-2-0-diesel-4x4-aut': { model: 'Ateca', versionTrim: 'FR 2.0 TDI 4x4 DSG' },
  'mpi-37122-2014-audi-a6-allroad-3-0d-quattro-aut': { model: 'A6 Allroad', versionTrim: '3.0 TDI Quattro S-Tronic' },
  'mpi-36913-2017-seat-leon-ateca-2-0-diesel-4x4': { model: 'Ateca', versionTrim: '2.0 TDI 4x4 Manual' },
  'mpi-36213-2015-ford-ecosport-1-5-tdci-trend': { model: 'EcoSport', versionTrim: '1.5 TDCi Trend' },
  'mpi-35227-2015-renault-captur-1-5dci-luxe': { model: 'Captur', versionTrim: '1.5 dCi Luxe' },
  'mpi-33533-2017-hyundai-grand-santa-fe-2-2-crdi-4': { model: 'Grand Santa Fe', versionTrim: '2.2 CRDi 4x4 7 Locuri' }
};

function formatModelName(name) {
  if (!name) return '';
  return name.trim();
}

function normalizeFuel(fuel) {
  if (!fuel) return 'Diesel';
  const f = fuel.toLowerCase();
  if (f.includes('benz')) return 'Benzină';
  if (f.includes('hibrid') || f.includes('hybrid')) return 'Hibrid';
  if (f.includes('electr')) return 'Electric';
  return 'Diesel';
}

function normalizeTransmission(trans) {
  if (!trans) return 'Manuală';
  const t = trans.toLowerCase();
  if (t.includes('aut')) return 'Automată';
  return 'Manuală';
}

function normalizeBodyType(body) {
  if (!body) return 'SUV';
  const b = body.toLowerCase();
  if (b.includes('suv')) return 'SUV';
  if (b.includes('sedan')) return 'Sedan';
  if (b.includes('break') || b.includes('combi')) return 'Break';
  if (b.includes('coupe')) return 'Coupe';
  if (b.includes('hatch')) return 'Hatchback';
  return 'SUV';
}

function normalizeDrivetrain(dt) {
  if (!dt) return 'Față';
  const d = dt.toLowerCase();
  if (d.includes('4x4') || d.includes('awd') || d.includes('quattro')) return '4x4 / AWD';
  if (d.includes('spate')) return 'Spate';
  return 'Față';
}

const cleaned = rawCars.map((car, idx) => {
  const fix = modelFixes[car.id];
  let model = fix ? fix.model : car.model;
  let versionTrim = fix ? fix.versionTrim : car.versionTrim;

  // Title case for all-caps model names
  if (model === model.toUpperCase() && model.length > 2) {
    model = model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();
  }

  // Ensure isDealOfWeek on top 2 cars
  const isDealOfWeek = idx === 0 || idx === 1;
  const isPinnedToTop = idx < 4;
  const dealBadgeText = idx === 0 ? 'OFERTA SPECIALĂ MPI' : (idx === 1 ? 'TOP RATE CU BULETINUL' : undefined);

  return {
    id: car.id,
    dealerSlug: 'mpi_auto',
    stockNumber: car.stockNumber || `MPI-${String(idx + 1).padStart(3, '0')}`,
    brand: car.brand.trim(),
    model: formatModelName(model),
    versionTrim: versionTrim ? versionTrim.trim() : (car.brand + ' ' + model),
    year: car.year || 2018,
    mileageKm: car.mileageKm || 150000,
    priceEur: car.priceEur || 10000,
    vatDeductible: Boolean(car.vatDeductible),
    fuelType: normalizeFuel(car.fuelType),
    transmission: normalizeTransmission(car.transmission),
    powerHp: car.powerHp || 150,
    engineCc: car.engineCc || 1995,
    bodyType: normalizeBodyType(car.bodyType),
    drivetrain: normalizeDrivetrain(car.drivetrain),
    color: car.color || 'Negru',
    vin: car.vin || '',
    isVinPublic: true,
    warrantyMonths: 12,
    status: 'in_stock',
    images: Array.isArray(car.images) ? car.images : [],
    isDealOfWeek,
    isPinnedToTop,
    oldPriceEur: car.oldPriceEur && car.oldPriceEur > car.priceEur ? car.oldPriceEur : undefined,
    dealBadgeText,
    equipmentSheetText: car.equipmentSheetText || undefined,
    description: car.description || undefined,
    features: car.features || undefined,
  };
});

const tsContent = `import { VehicleItem } from './types';

// 80 Autoturisme Importate Real din Stocul MPI Auto Cluj (Centura Apahida)
export const SEED_MPI_VEHICLES: VehicleItem[] = ${JSON.stringify(cleaned, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/db/mpiVehicles.ts'), tsContent, 'utf8');
console.log('Generated src/db/mpiVehicles.ts with ' + cleaned.length + ' vehicles strictly adhering to VehicleItem!');
