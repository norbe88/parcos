const fs = require('fs');
const path = require('path');

// Extract vehicles from src/db/vehicles.ts and src/db/mpiVehicles.ts
const vehiclesTsPath = path.join(__dirname, '..', 'src', 'db', 'vehicles.ts');
const content = fs.readFileSync(vehiclesTsPath, 'utf8');

const match = content.match(/export const SEED_VEHICLES: VehicleItem\[\] = (\[[\s\S]*?\]);\s*$/);
if (!match) {
  console.error('Nu am putut extrage SEED_VEHICLES din vehicles.ts');
  process.exit(1);
}

const rawArrayStr = match[1];
const rxmVehicles = new Function(`return ${rawArrayStr}`)();

let mpiVehicles = [];
const mpiTsPath = path.join(__dirname, '..', 'src', 'db', 'mpiVehicles.ts');
if (fs.existsSync(mpiTsPath)) {
  const mpiContent = fs.readFileSync(mpiTsPath, 'utf8');
  const mpiMatch = mpiContent.match(/export const SEED_MPI_VEHICLES: VehicleItem\[\] = (\[[\s\S]*?\]);\s*$/);
  if (mpiMatch) {
    mpiVehicles = new Function(`return ${mpiMatch[1]}`)();
  }
}

const seedVehicles = [...rxmVehicles, ...mpiVehicles];

const outDir = path.join(__dirname, '..', 'server');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'seeds.json');
fs.writeFileSync(outPath, JSON.stringify(seedVehicles, null, 2), 'utf8');
console.log(`✅ Exportat cu succes ${seedVehicles.length} mașini în ${outPath}`);
