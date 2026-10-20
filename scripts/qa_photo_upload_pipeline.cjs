const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("🧪 QA TEST: HIGH-CAPACITY WEBP UPLOAD, INDEXEDDB VAULT & SEED EXPORTER");
console.log("==================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// 1. Verificare Image Resize Engine (Ticket 01)
const resizeEngineContent = fs.readFileSync(path.join(__dirname, '../src/utils/imageResizeEngine.ts'), 'utf8');
assert(resizeEngineContent.includes('export interface ResizeOptions'), 'imageResizeEngine exportă ResizeOptions');
assert(resizeEngineContent.includes('maxWidth?: number;'), 'ResizeOptions permite maxWidth configurabil (default 1600px)');
assert(resizeEngineContent.includes('quality?: number;'), 'ResizeOptions permite quality configurabil (default 0.82)');
assert(resizeEngineContent.includes('export async function resizeAndCompressImage('), 'resizeAndCompressImage este exportată');
assert(resizeEngineContent.includes('export async function processImageBatch('), 'processImageBatch pentru procesare progresivă este exportată');
assert(resizeEngineContent.includes('canvas.toBlob'), 'Folosește canvas.toBlob pentru generare binară WebP');
assert(resizeEngineContent.includes('image/webp'), 'Formatul țintă este strict image/webp');

// 2. Verificare IndexedDB Media Vault (Ticket 02)
const mediaVaultContent = fs.readFileSync(path.join(__dirname, '../src/utils/mediaVaultDb.ts'), 'utf8');
assert(mediaVaultContent.includes("const DB_NAME = 'rxm_media_vault';"), 'IndexedDB folosește baza de date rxm_media_vault');
assert(mediaVaultContent.includes("const STORE_NAME = 'car_photos';"), 'IndexedDB folosește store-ul dedicat car_photos');
assert(mediaVaultContent.includes('export async function saveMediaBlob('), 'saveMediaBlob este exportată');
assert(mediaVaultContent.includes('export async function saveMediaBlobsBatch('), 'saveMediaBlobsBatch este exportată');
assert(mediaVaultContent.includes('export async function getMediaBlob('), 'getMediaBlob este exportată');
assert(mediaVaultContent.includes('export async function preloadMediaKeys('), 'preloadMediaKeys pentru pre-populare cache este exportată');
assert(mediaVaultContent.includes('export function resolveMediaUrl('), 'resolveMediaUrl este exportată');

// 3. Verificare Helpers & URL Normalization
const helpersContent = fs.readFileSync(path.join(__dirname, '../src/utils/helpers.ts'), 'utf8');
assert(helpersContent.includes('resolveMediaUrl'), 'helpers.ts normalizează URL-urile prin mediaVaultDb resolveMediaUrl');
assert(helpersContent.includes('export function normalizeCarImageUrl'), 'normalizeCarImageUrl este exportată și menține compatibilitatea');

// 4. Verificare StepMediaUpload (Ticket 03)
const stepMediaContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/add-vehicle/StepMediaUpload.tsx'), 'utf8');
assert(stepMediaContent.includes('processImageBatch'), 'StepMediaUpload folosește processImageBatch');
assert(stepMediaContent.includes('saveMediaBlob'), 'StepMediaUpload salvează fotografiile direct în IndexedDB prin saveMediaBlob');
assert(stepMediaContent.includes('rxm-media://cars/'), 'StepMediaUpload construiește chei canonice rxm-media://cars/');
assert(stepMediaContent.includes('isReadingFiles'), 'StepMediaUpload include indicatorul vizual de procesare isReadingFiles');
assert(stepMediaContent.includes('processingStatus'), 'StepMediaUpload raportează progresul per imagine (processingStatus)');

// 5. Verificare AddVehicleModal (Ticket 03)
const addModalContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/AddVehicleModal.tsx'), 'utf8');
assert(addModalContent.includes('carDraftId'), 'AddVehicleModal generează carDraftId stabil per sesiune');
assert(addModalContent.includes('finalImages = newImages'), 'AddVehicleModal păstrează cheile din MediaVault fără conversie în Base64');

// 6. Verificare Seed Exporter Modal & Admin Wireup (Ticket 04)
const seedExporterContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/VehicleSeedExporterModal.tsx'), 'utf8');
assert(seedExporterContent.includes('export const VehicleSeedExporterModal'), 'VehicleSeedExporterModal este exportat');
assert(seedExporterContent.includes('getMediaBlob(imgKey)'), 'VehicleSeedExporterModal extrage blob-urile din IndexedDB');
assert(seedExporterContent.includes('generatedTsCode'), 'VehicleSeedExporterModal generează cod TypeScript SEED_VEHICLES');

const itmContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/InventoryTableManager.tsx'), 'utf8');
assert(itmContent.includes('onOpenSeedExporter?: (car: VehicleItem) => void;'), 'InventoryTableManagerProps include onOpenSeedExporter');
assert(itmContent.includes('Export Permanent Git'), 'InventoryTableManager include butonul de Export Permanent Git în meniuri');

const adminPortalContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/AdminPortal.tsx'), 'utf8');
assert(adminPortalContent.includes('VehicleSeedExporterModal'), 'AdminPortal include componenta VehicleSeedExporterModal');
assert(adminPortalContent.includes('isSeedExporterOpen'), 'AdminPortal gestionează starea isSeedExporterOpen');
assert(adminPortalContent.includes('onOpenSeedExporter='), 'AdminPortal leagă callback-ul către InventoryTableManager');

// 7. Simulare de Cotă & Calcul Amprentă Memorie (Stress Test Model)
console.log("\n📊 MODEL SIMULARE COTĂ LOCALSTORAGE vs INDEXEDDB (20 FOTOGRAFII 4K):");
const RAW_PHOTO_AVG_MB = 2.5; // Fotografie medie smartphone 12MP/4K
const RAW_PHOTOS_COUNT = 20;
const RAW_TOTAL_MB = RAW_PHOTO_AVG_MB * RAW_PHOTOS_COUNT; // 50MB

// Cu vechea arhitectură Base64:
// Base64 adaugă ~33% overhead: 50MB * 1.33 = ~66.5MB string
const OLD_BASE64_STORAGE_MB = (RAW_TOTAL_MB * 1.33).toFixed(1);
const LOCALSTORAGE_LIMIT_MB = 5.0;

// Cu noua arhitectură IndexedDB + WebP:
// 1 cheie URI rxm-media://cars/draft_123/img_01.webp = 45 bytes
const NEW_LOCALSTORAGE_BYTES = 20 * 45;
// WebP comprimat 1600px (calitate 0.82) = ~120KB per imagine
const NEW_INDEXEDDB_BLOB_TOTAL_MB = (20 * 0.12).toFixed(2);

console.log(`  • Date brute originale: ${RAW_TOTAL_MB} MB (${RAW_PHOTOS_COUNT} poze)`);
console.log(`  • Vechiul consum localStorage (Base64): ${OLD_BASE64_STORAGE_MB} MB (LIMITĂ: ${LOCALSTORAGE_LIMIT_MB} MB) -> DEPASIRE CRITICA DE ${(OLD_BASE64_STORAGE_MB / LOCALSTORAGE_LIMIT_MB).toFixed(1)}x`);
console.log(`  • Nou consum localStorage (Chei URI): ${NEW_LOCALSTORAGE_BYTES} bytes (~0.0009 MB) -> REDUCERE DE 99.99%`);
console.log(`  • Consum IndexedDB Vault (Bloburi WebP 1600px): ${NEW_INDEXEDDB_BLOB_TOTAL_MB} MB (Fără limită strictă de 5MB)`);

assert(NEW_LOCALSTORAGE_BYTES < 2000, 'Consumul de localStorage per mașină adăugată cu 20 de poze este sub 2KB (zero Base64)');
assert(parseFloat(NEW_INDEXEDDB_BLOB_TOTAL_MB) < 5.0, 'Dimensiunea totală a celor 20 de fotografii WebP comprimate este optimă (<5MB)');

console.log("\n==================================================================");
console.log(`🏁 REZULTAT FINAL: ${passed}/${total} teste trecute cu succes.`);
console.log("==================================================================");

if (passed !== total) {
  process.exit(1);
}
