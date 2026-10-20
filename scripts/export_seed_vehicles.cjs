const fs = require('fs');
const path = require('path');

// Extract vehicles from src/db/vehicles.ts
const vehiclesTsPath = path.join(__dirname, '..', 'src', 'db', 'vehicles.ts');
const content = fs.readFileSync(vehiclesTsPath, 'utf8');

// Use regex or eval to get the array
const match = content.match(/export const SEED_VEHICLES: VehicleItem\[\] = (\[[\s\S]*?\]);\s*$/);
if (!match) {
  console.error('Nu am putut extrage SEED_VEHICLES din vehicles.ts');
  process.exit(1);
}

const rawArrayStr = match[1];
// Parse using safe Function constructor or eval
const seedVehicles = new Function(`return ${rawArrayStr}`)();

const outDir = path.join(__dirname, '..', 'server');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'seeds.json');
fs.writeFileSync(outPath, JSON.stringify(seedVehicles, null, 2), 'utf8');
console.log(`✅ Exportat cu succes ${seedVehicles.length} mașini în ${outPath}`);
