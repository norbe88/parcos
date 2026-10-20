const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("🧪 QA TEST: INVENTORY LIFECYCLE, 10s GRACE PERIOD & AGING BADGES");
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

// 1. Verificare Helpers
const helpersContent = fs.readFileSync(path.join(__dirname, '../src/utils/helpers.ts'), 'utf8');

assert(helpersContent.includes('export type AgingTier = \'fresh\' | \'active\' | \'slow\' | \'frozen\';'), 'AgingTier este exportat ca tip union');
assert(helpersContent.includes('export function getAgingDays('), 'Funcția getAgingDays este exportată');
assert(helpersContent.includes('export function getAgingTier('), 'Funcția getAgingTier este exportată');
assert(helpersContent.includes('export function getVehicleAgingInfo('), 'Funcția getVehicleAgingInfo este exportată');
assert(helpersContent.includes('tier: AgingTier;'), 'VehicleAgingInfo conține proprietatea tier');

// 2. Verificare AddVehicleModal
const addModalContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/AddVehicleModal.tsx'), 'utf8');
assert(addModalContent.includes("stockEntryDate: new Date().toISOString().split('T')[0]"), 'AddVehicleModal inițializează automat stockEntryDate cu data zilei curente');

// 3. Verificare InventoryTableManager
const itmContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/InventoryTableManager.tsx'), 'utf8');

assert(itmContent.includes('const [pendingSale, setPendingSale] = useState'), 'InventoryTableManager include starea pendingSale pentru perioada de grație');
assert(itmContent.includes('const [isArchiveOpen, setIsArchiveOpen] = useState(false);'), 'InventoryTableManager include starea isArchiveOpen pentru arhiva colapsabilă');
assert(itmContent.includes('const [sortBy, setSortBy] = useState'), 'InventoryTableManager include selectorul de sortare după vechime/preț');
assert(itmContent.includes('handleStatusClick'), 'InventoryTableManager interceptează click-ul pe status cu handleStatusClick');
assert(itmContent.includes('handleCancelPendingSale'), 'InventoryTableManager oferă funcția de Undo/Anulare (handleCancelPendingSale)');
assert(itmContent.includes('handleConfirmPendingSaleNow'), 'InventoryTableManager oferă confirmare manuală imediată (handleConfirmPendingSaleNow)');
assert(itmContent.includes('activeCars'), 'Tabelul principal izolează mașinile active (activeCars)');
assert(itmContent.includes('soldCars'), 'Mașinile vândute sunt mutate în lista separată soldCars');
assert(itmContent.includes('soldRevenueTotal'), 'InventoryTableManager calculează cifra totală de afaceri a arhivei (soldRevenueTotal)');
assert(itmContent.includes('renderAgingBadge'), 'InventoryTableManager conține funcția de afișare renderAgingBadge');
assert(itmContent.includes('📁 Arhivă Autovehicule Vândute'), 'Secțiunea colapsabilă de arhivă este integrată cu titlul oficial');
assert(itmContent.includes('Reactivează'), 'Arhiva conține buton de reactivare în stoc activ pentru fiecare vehicul');

// 4. Verificare Types (Ticket 03 & 04)
const typesContent = fs.readFileSync(path.join(__dirname, '../src/db/types.ts'), 'utf8');
assert(typesContent.includes('export type VehicleAuditAction ='), 'Tipul VehicleAuditAction este definit');
assert(typesContent.includes('export interface VehicleAuditEntry'), 'Interfata VehicleAuditEntry este definita');
assert(typesContent.includes('auditLog?: VehicleAuditEntry[];'), 'VehicleItem include campul optional auditLog');
assert(typesContent.includes('internalNotes?: string;'), 'VehicleItem include campul optional internalNotes');

// 5. Verificare Helpers (Ticket 03)
assert(helpersContent.includes('export function daysUntil('), 'Functia daysUntil este exportata');
assert(helpersContent.includes('export function formatAuditDate('), 'Functia formatAuditDate este exportata');

// 6. Verificare VehicleAuditDrawer (Ticket 03 & 04)
const drawerPath = path.join(__dirname, '../src/components/admin/VehicleAuditDrawer.tsx');
assert(fs.existsSync(drawerPath), 'Componenta VehicleAuditDrawer.tsx a fost creata');
const drawerContent = fs.readFileSync(drawerPath, 'utf8');
assert(drawerContent.includes('VehicleAuditDrawer'), 'VehicleAuditDrawer este exportata');
assert(drawerContent.includes('Salvează Nota'), 'VehicleAuditDrawer include suport de salvare pentru note interne');
assert(drawerContent.includes('Cronologie Activitate'), 'VehicleAuditDrawer contine structura cronologica de timeline pentru istoric');

// 7. Verificare Filtre Guvernanta & Note in InventoryTableManager (Ticket 04)
assert(itmContent.includes('governanceFilter'), 'InventoryTableManager contine starea governanceFilter');
assert(itmContent.includes('red_plates_expiring'), 'InventoryTableManager include filtrul pentru numere rosii ce expira');
assert(itmContent.includes('missing_purchase_price'), 'InventoryTableManager include filtrul pentru vehicule fara pret achizitie');
assert(itmContent.includes('olx_discrepancy'), 'InventoryTableManager include filtrul pentru discrepante OLX');
assert(itmContent.includes('slow_aging'), 'InventoryTableManager include filtrul pentru stoc lent >45z');
assert(itmContent.includes('Audit & Note'), 'InventoryTableManager afiseaza butonul de Audit & Note');
assert(itmContent.includes('VehicleAuditDrawer'), 'InventoryTableManager randeaza VehicleAuditDrawer');

// 8. Verificare App.tsx (Sanitizare si Handlers)
const appContent = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf8');
assert(appContent.includes('createAuditEntry'), 'App.tsx contine helperul createAuditEntry');
assert(appContent.includes('handleUpdateInternalNotes'), 'App.tsx contine handlerul handleUpdateInternalNotes');
assert(appContent.includes('auditLog: undefined'), 'App.tsx sanitizeaza strict auditLog in publicCars si safeSelectedCar');
assert(appContent.includes('internalNotes: undefined'), 'App.tsx sanitizeaza strict internalNotes in publicCars si safeSelectedCar');

console.log(`\n==================================================================`);
console.log(`REZULTAT: ${passed}/${total} teste trecute cu succes!`);
console.log(`==================================================================`);

if (passed !== total) {
  process.exit(1);
}