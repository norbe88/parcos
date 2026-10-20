/**
 * ══════════════════════════════════════════════════════════════════
 * QA Test Suite 25: Coolify Self-Hosted PostgreSQL & Media API Engine
 * CARVANA SRL • RXM Automobile • Invariantă Strict 21% TVA
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n🔍 [SUITE 25] Coolify Self-Hosted PostgreSQL & Media API Engine');

let passes = 0;
let failures = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passes++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
    failures++;
  }
}

// 1. Docker Compose Invariants
it('infra/docker-compose.yml definește containerul rxm-postgres cu postgres:16-alpine', () => {
  const composePath = path.join(__dirname, '..', 'infra', 'docker-compose.yml');
  assert(fs.existsSync(composePath), 'Fișierul infra/docker-compose.yml lipsește');
  const content = fs.readFileSync(composePath, 'utf8');
  assert(content.includes('rxm-postgres:'), 'Serviciul rxm-postgres lipsește din compose');
  assert(content.includes('postgres:16-alpine'), 'Imaginea postgres:16-alpine lipsește');
  assert(content.includes('/data/rxm-showroom/pgdata'), 'Volumul persistent pgdata lipsește');
});

it('infra/docker-compose.yml definește containerul rxm-api și rețeaua internă bridge', () => {
  const composePath = path.join(__dirname, '..', 'infra', 'docker-compose.yml');
  const content = fs.readFileSync(composePath, 'utf8');
  assert(content.includes('rxm-api:'), 'Serviciul rxm-api lipsește');
  assert(content.includes('Dockerfile.api'), 'Referința Dockerfile.api lipsește');
  assert(content.includes('rxm-internal:'), 'Rețeaua internă izolată rxm-internal lipsește');
});

// 2. PostgreSQL DDL Invariants
it('infra/init_schema.sql conține tabelele dealers și vehicles cu TVA strict 21%', () => {
  const schemaPath = path.join(__dirname, '..', 'infra', 'init_schema.sql');
  assert(fs.existsSync(schemaPath), 'Fișierul infra/init_schema.sql lipsește');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS dealers'), 'Tabelul dealers lipsește');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS vehicles'), 'Tabelul vehicles lipsește');
  assert(sql.includes('vat_rate') && sql.includes('0.21'), 'Invariantul TVA 21% lipsește din schema DDL');
  assert(sql.includes('idx_vehicles_dealer_slug'), 'Indexul dealer_slug lipsește');
});

// 3. Micro-API Engine Structure
it('server/api.mjs definește micro-serverul HTTP cu rutele REST vehicles și upload', () => {
  const apiPath = path.join(__dirname, '..', 'server', 'api.mjs');
  assert(fs.existsSync(apiPath), 'Fișierul server/api.mjs lipsește');
  const content = fs.readFileSync(apiPath, 'utf8');
  assert(content.includes('/api/vehicles'), 'Ruta /api/vehicles lipsește');
  assert(content.includes('/api/upload'), 'Ruta /api/upload lipsește');
  assert(content.includes('/api/health'), 'Health check endpoint lipsește');
});

it('server/db.mjs conține logica de conectare postgres.js și auto-seeding', () => {
  const dbPath = path.join(__dirname, '..', 'server', 'db.mjs');
  assert(fs.existsSync(dbPath), 'Fișierul server/db.mjs lipsește');
  const content = fs.readFileSync(dbPath, 'utf8');
  assert(content.includes('getAllVehicles'), 'Funcția getAllVehicles lipsește');
  assert(content.includes('upsertVehicle'), 'Funcția upsertVehicle lipsește');
  assert(content.includes('seeds.json'), 'Referința la auto-seeding lipsește');
});

it('server/seeds.json conține cel puțin 30 de vehicule canonice exportate', () => {
  const seedsPath = path.join(__dirname, '..', 'server', 'seeds.json');
  assert(fs.existsSync(seedsPath), 'Fișierul server/seeds.json lipsește');
  const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
  assert(Array.isArray(seeds) && seeds.length >= 30, `Număr insuficient de vehicule în seed: ${seeds.length}`);
});

it('server/mediaStorage.mjs asigură salvarea pe discul VPS și returnează URL /rxm/cars/...', () => {
  const mediaPath = path.join(__dirname, '..', 'server', 'mediaStorage.mjs');
  assert(fs.existsSync(mediaPath), 'Fișierul server/mediaStorage.mjs lipsește');
  const content = fs.readFileSync(mediaPath, 'utf8');
  assert(content.includes('/rxm/cars/'), 'URL-ul de acces /rxm/cars/ lipsește');
  assert(content.includes('saveCarImageToDisk'), 'Funcția saveCarImageToDisk lipsește');
});

// 4. Frontend Integration
it('vehicleRepository.ts apelează prioritar API-ul self-hosted /rxm/api/vehicles cu fallback SWR', () => {
  const repoPath = path.join(__dirname, '..', 'src', 'services', 'vehicleRepository.ts');
  const content = fs.readFileSync(repoPath, 'utf8');
  assert(content.includes('/rxm/api/vehicles'), 'Apelul la /rxm/api/vehicles lipsește din vehicleRepository');
  assert(content.includes('syncFromSelfHostedApi'), 'Funcția syncFromSelfHostedApi lipsește');
});

it('cloudMediaStorage.ts încearcă upload pe discul VPS (/rxm/api/upload) înainte de fallback', () => {
  const storagePath = path.join(__dirname, '..', 'src', 'services', 'cloudMediaStorage.ts');
  const content = fs.readFileSync(storagePath, 'utf8');
  assert(content.includes('/rxm/api/upload'), 'Upload-ul la /rxm/api/upload lipsește din cloudMediaStorage');
});

// 5. Nginx Proxy & Caching
it('infra/nginx.conf rutează /rxm/api/ către rxm-api:3001 și servește /rxm/cars/ din disc', () => {
  const nginxPath = path.join(__dirname, '..', 'infra', 'nginx.conf');
  const content = fs.readFileSync(nginxPath, 'utf8');
  assert(content.includes('rxm-api:3001') && content.includes('proxy_pass'), 'Proxy pass către rxm-api lipsește');
  assert(content.includes('location /rxm/cars/'), 'Directiva statică /rxm/cars/ lipsește');
  assert(content.includes('Cache-Control "public, max-age=31536000'), 'Cache-ul pe 1 an pentru mașini lipsește');
});

// 6. Vite Proxy
it('vite.config.ts include proxy către micro-API pentru development', () => {
  const vitePath = path.join(__dirname, '..', 'vite.config.ts');
  const content = fs.readFileSync(vitePath, 'utf8');
  assert(content.includes('/api/vehicles') && (content.includes('rxmautomobile.ro') || content.includes('localhost')), 'Proxy dev /api/vehicles lipsește');
  assert(content.includes('/api/upload') && (content.includes('rxmautomobile.ro') || content.includes('localhost')), 'Proxy dev /api/upload lipsește');
});

// 7. Sanitizare JSON & Invariantă Recuperare Imagini Seed
it('server/db.mjs sanitizează câmpurile JSONB (images, features, raw_data)', () => {
  const dbPath = path.join(__dirname, '..', 'server', 'db.mjs');
  const content = fs.readFileSync(dbPath, 'utf8');
  assert(content.includes('sanitizeVehicleRow'), 'Funcția sanitizeVehicleRow lipsește din server/db.mjs');
  assert(content.includes('sql.json'), 'Parametrizarea nativă sql.json lipsește din server/db.mjs');
});

it('vehicleRepository.ts conține protecție JSON.parse și fallback de recuperare imagini seed', () => {
  const repoPath = path.join(__dirname, '..', 'src', 'services', 'vehicleRepository.ts');
  const content = fs.readFileSync(repoPath, 'utf8');
  assert(content.includes('SEED_VEHICLES.find'), 'Fallback-ul de recuperare a imaginilor seed lipsește din vehicleRepository');
  assert(content.includes('v10_db_images_json_parse_2026_10_18'), 'Versiunea v10 de migrare cache local lipsește');
});

if (failures > 0) {
  console.error(`\n❌ [SUITE 25] EȘEC: ${failures} teste au picat.`);
  process.exit(1);
} else {
  console.log(`\n🎉 [SUITE 25] TOATE CELE ${passes} TESTE AU TRECUT CU SUCCES!`);
}
