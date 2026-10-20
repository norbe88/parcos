const fs = require('fs');
const path = require('path');

const vehiclesTsPath = path.join(__dirname, '..', 'src', 'db', 'vehicles.ts');
const newVehiclesPreviewPath = path.join(__dirname, '..', '.scratch', 'new_vehicles_preview.json');

const newVehicles = JSON.parse(fs.readFileSync(newVehiclesPreviewPath, 'utf8'));

// Read existing vehicles.ts content
const existingContent = fs.readFileSync(vehiclesTsPath, 'utf8');

// We find where SEED_VEHICLES array closes (the last "];")
const lastBracketIndex = existingContent.lastIndexOf('];');
if (lastBracketIndex === -1) {
  console.error("Could not find ending of SEED_VEHICLES array");
  process.exit(1);
}

// Convert each new vehicle to formatted TypeScript object
function formatVehicleToTs(v) {
  return `  {
    id: ${JSON.stringify(v.id)},
    stockNumber: ${JSON.stringify(v.stockNumber)},
    brand: ${JSON.stringify(v.brand)},
    model: ${JSON.stringify(v.model)},
    versionTrim: ${JSON.stringify(v.versionTrim)},
    year: ${v.year},
    mileageKm: ${v.mileageKm},
    priceEur: ${v.priceEur},
    vatDeductible: ${v.vatDeductible},
    fuelType: ${JSON.stringify(v.fuelType)},
    transmission: ${JSON.stringify(v.transmission)},
    powerHp: ${v.powerHp},
    engineCc: ${v.engineCc},
    bodyType: ${JSON.stringify(v.bodyType)},
    drivetrain: ${JSON.stringify(v.drivetrain)},
    color: ${JSON.stringify(v.color)},
    vin: ${JSON.stringify(v.vin)},
    warrantyMonths: ${v.warrantyMonths},
    status: ${JSON.stringify(v.status)},
    images: ${JSON.stringify(v.images, null, 6).replace(/\n\s{6}/g, '\n      ')},
    olxUrl: ${JSON.stringify(v.olxUrl)},
    olxId: ${JSON.stringify(v.olxId)},
    olxStatus: "active",
    olxDiscrepancy: "none",
    lastOlxSyncAt: ${JSON.stringify(v.lastOlxSyncAt)},
    features: {
      safety: ${JSON.stringify(v.features.safety, null, 8).replace(/\n\s{8}/g, '\n        ')},
      comfort: ${JSON.stringify(v.features.comfort, null, 8).replace(/\n\s{8}/g, '\n        ')},
      multimedia: ${JSON.stringify(v.features.multimedia, null, 8).replace(/\n\s{8}/g, '\n        ')}
    },
    description: ${JSON.stringify(v.description)}
  }`;
}

const newVehiclesTsBlocks = newVehicles.map(formatVehicleToTs).join(',\n');

// Before the last "];", we add a comma (if needed) and our new vehicles
const beforeClosing = existingContent.slice(0, lastBracketIndex).trimEnd();
const separator = beforeClosing.endsWith(',') ? '\n' : ',\n';

const updatedContent = beforeClosing + separator + newVehiclesTsBlocks + '\n];\n';

fs.writeFileSync(vehiclesTsPath, updatedContent, 'utf8');
console.log(`Successfully merged ${newVehicles.length} new vehicles into src/db/vehicles.ts!`);
