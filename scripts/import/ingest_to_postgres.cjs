/**
 * Ingestion Script: Import stoc MPI Auto în PostgreSQL (Netcup VPS)
 * Actualizează cota la 100 și execută UPSERT idempotent pentru cele 80 de mașini.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.resolve(__dirname, '../../data/import/mpi');
const CARS_JSON = path.join(DATA_DIR, 'cars.json');
const CARS_WITH_CDN_JSON = path.join(DATA_DIR, 'cars_with_cdn.json');
const SQL_OUTPUT_PATH = path.join(DATA_DIR, 'ingest.sql');

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlJson(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function generateIngestSql() {
  if (!fs.existsSync(CARS_JSON)) {
    throw new Error(`Nu s-a găsit fișierul ${CARS_JSON}.`);
  }

  const baseCars = JSON.parse(fs.readFileSync(CARS_JSON, 'utf8'));
  let cdnCarsMap = new Map();
  if (fs.existsSync(CARS_WITH_CDN_JSON)) {
    try {
      const cdnCars = JSON.parse(fs.readFileSync(CARS_WITH_CDN_JSON, 'utf8'));
      cdnCarsMap = new Map(cdnCars.map(c => [c.id, c]));
    } catch {}
  }

  console.log(`📋 Generăm SQL de ingestie pentru ${baseCars.length} vehicule...`);
  console.log(`🖼️ Mașini cu imagini CDN gata: ${cdnCarsMap.size}/${baseCars.length}`);

  const sqlStatements = [];
  sqlStatements.push('-- ParcOS Multi-Tenant Ingestion: MPI AUTO CLA S.R.L.');
  sqlStatements.push('BEGIN;');
  sqlStatements.push('');
  sqlStatements.push('-- 1. Majorare cotă dealer mpi_auto la 100');
  sqlStatements.push("UPDATE dealers SET max_vehicles_quota = 100 WHERE slug = 'mpi_auto';");
  sqlStatements.push('');

  let firstDealSet = false;

  for (const car of baseCars) {
    const cdnCar = cdnCarsMap.get(car.id);
    const images = (cdnCar && cdnCar.images && cdnCar.images.length > 0) ? cdnCar.images : car.images;

    const id = car.id;
    const dealerSlug = 'mpi_auto';
    const stockNumber = car.stockNumber || null;
    const brand = car.brand || 'MPI';
    const model = car.model || 'Auto';
    const versionTrim = car.versionTrim || '';
    const year = parseInt(car.year, 10) || 2019;
    const mileageKm = parseInt(car.mileageKm, 10) || 0;
    const priceEur = parseFloat(car.priceEur) || 0;
    const oldPriceEur = car.oldPriceEur ? parseFloat(car.oldPriceEur) : null;
    const vatDeductible = !!car.vatDeductible;
    const vatRate = 0.21;
    const fuelType = car.fuelType || 'Benzină';
    const transmission = car.transmission || 'Manuală';
    const powerHp = parseInt(car.powerHp, 10) || 0;
    const engineCc = parseInt(car.engineCc, 10) || 0;
    const bodyType = car.bodyType || 'SUV';
    const drivetrain = car.drivetrain || 'Față';
    const color = car.color || 'Negru';
    const vin = car.vin || '';
    const isVinPublic = true;
    const docOriginCountry = 'RO';
    const warrantyMonths = 12;
    const status = 'in_stock';
    const stockEntryDate = new Date().toISOString().split('T')[0];

    // Punem deal of the week pe prima mașină cu reducere
    let isDealOfWeek = false;
    let dealBadgeText = null;
    if (!firstDealSet && oldPriceEur && oldPriceEur > priceEur) {
      isDealOfWeek = true;
      dealBadgeText = 'OFERTA SĂPTĂMÂNII';
      firstDealSet = true;
    }

    const features = car.features || { safety: [], comfort: [], multimedia: [] };
    const equipmentSheetText = car.equipmentSheetText || '';
    const description = car.description || `${brand} ${model} ${versionTrim}`;

    const rawData = {
      sourceUrl: car.sourceUrl,
      importNotes: car.importNotes,
      originalImagesCount: (car.images || []).length,
      importedAt: new Date().toISOString(),
      dealerName: 'MPI AUTO CLA S.R.L.'
    };

    const insertSql = `
INSERT INTO vehicles (
  id, dealer_slug, stock_number, brand, model, version_trim, year, mileage_km,
  price_eur, vat_deductible, vat_rate, fuel_type, transmission, power_hp, engine_cc,
  body_type, drivetrain, color, vin, is_vin_public, doc_origin_country, warranty_months,
  status, stock_entry_date, images, video_url, tiktok_url, tiktok_views,
  is_deal_of_week, is_pinned_to_top, old_price_eur, deal_badge_text,
  features, equipment_sheet_text, description, raw_data, updated_at
) VALUES (
  ${escapeSqlString(id)},
  ${escapeSqlString(dealerSlug)},
  ${escapeSqlString(stockNumber)},
  ${escapeSqlString(brand)},
  ${escapeSqlString(model)},
  ${escapeSqlString(versionTrim)},
  ${year},
  ${mileageKm},
  ${priceEur},
  ${vatDeductible},
  ${vatRate},
  ${escapeSqlString(fuelType)},
  ${escapeSqlString(transmission)},
  ${powerHp},
  ${engineCc},
  ${escapeSqlString(bodyType)},
  ${escapeSqlString(drivetrain)},
  ${escapeSqlString(color)},
  ${escapeSqlString(vin)},
  ${isVinPublic},
  ${escapeSqlString(docOriginCountry)},
  ${warrantyMonths},
  ${escapeSqlString(status)},
  ${escapeSqlString(stockEntryDate)},
  ${escapeSqlJson(images)},
  NULL, NULL, NULL,
  ${isDealOfWeek},
  FALSE,
  ${oldPriceEur !== null ? oldPriceEur : 'NULL'},
  ${escapeSqlString(dealBadgeText)},
  ${escapeSqlJson(features)},
  ${escapeSqlString(equipmentSheetText)},
  ${escapeSqlString(description)},
  ${escapeSqlJson(rawData)},
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  dealer_slug = EXCLUDED.dealer_slug,
  stock_number = EXCLUDED.stock_number,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  version_trim = EXCLUDED.version_trim,
  year = EXCLUDED.year,
  mileage_km = EXCLUDED.mileage_km,
  price_eur = EXCLUDED.price_eur,
  vat_deductible = EXCLUDED.vat_deductible,
  vat_rate = EXCLUDED.vat_rate,
  fuel_type = EXCLUDED.fuel_type,
  transmission = EXCLUDED.transmission,
  power_hp = EXCLUDED.power_hp,
  engine_cc = EXCLUDED.engine_cc,
  body_type = EXCLUDED.body_type,
  drivetrain = EXCLUDED.drivetrain,
  color = EXCLUDED.color,
  vin = EXCLUDED.vin,
  is_vin_public = EXCLUDED.is_vin_public,
  doc_origin_country = EXCLUDED.doc_origin_country,
  warranty_months = EXCLUDED.warranty_months,
  status = EXCLUDED.status,
  stock_entry_date = EXCLUDED.stock_entry_date,
  images = EXCLUDED.images,
  is_deal_of_week = EXCLUDED.is_deal_of_week,
  old_price_eur = EXCLUDED.old_price_eur,
  deal_badge_text = EXCLUDED.deal_badge_text,
  features = EXCLUDED.features,
  equipment_sheet_text = EXCLUDED.equipment_sheet_text,
  description = EXCLUDED.description,
  raw_data = EXCLUDED.raw_data,
  updated_at = NOW();
    `.trim();

    sqlStatements.push(insertSql);
  }

  sqlStatements.push('');
  sqlStatements.push('COMMIT;');
  sqlStatements.push('');

  const fullSql = sqlStatements.join('\n');
  fs.writeFileSync(SQL_OUTPUT_PATH, fullSql, 'utf8');
  console.log(`💾 Fișier SQL salvat în: ${SQL_OUTPUT_PATH} (${(fullSql.length / 1024).toFixed(1)} KB)`);

  return SQL_OUTPUT_PATH;
}

function executeIngestOnVps() {
  const sqlPath = generateIngestSql();
  console.log('🚀 Executăm scriptul de ingestie pe Netcup VPS (152.53.158.65)...');

  const cmd = `ssh -o BatchMode=yes -o ConnectTimeout=10 root@152.53.158.65 "docker exec -i 6fezufnklecoapemrupsqpxh psql -U postgres -d parcos" < "${sqlPath}"`;
  
  try {
    const output = execSync(cmd, { stdio: 'pipe' }).toString();
    console.log('✅ Răspuns PostgreSQL:\n', output.slice(-300));

    // Verificare număr vehicule via stdin
    const verifySql = `
SELECT count(*) AS total_mpi_vehicles FROM vehicles WHERE dealer_slug = 'mpi_auto';
SELECT slug, name, max_vehicles_quota FROM dealers WHERE slug = 'mpi_auto';
SELECT id, brand, model, year, price_eur FROM vehicles WHERE dealer_slug = 'mpi_auto' LIMIT 3;
`;
    const verifyOutput = execSync('ssh -o BatchMode=yes -o ConnectTimeout=10 root@152.53.158.65 "docker exec -i 6fezufnklecoapemrupsqpxh psql -U postgres -d parcos"', { input: verifySql }).toString();
    console.log('\n📊 Rezultat Verificare Ingestie:\n', verifyOutput);

  } catch (err) {
    console.error('❌ Eroare la execuția pe VPS:', err.message);
    if (err.stderr) console.error('Stderr:', err.stderr.toString());
    process.exit(1);
  }
}

if (require.main === module) {
  executeIngestOnVps();
}

module.exports = { generateIngestSql, executeIngestOnVps };
