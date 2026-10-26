const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🛡️ RULARE TESTE QA: INVARIANTE SERVICE & RECON TRACKER SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// [Test 1] Verificare Invariante Holding CARVANA: Strict 21% TVA
// -------------------------------------------------------------
console.log('[Test 1] Verificare Invariante Financiare: Strict 21% TVA');
const reconHelpersPath = path.join(__dirname, '../../src/components/admin/service-tracker/reconHelpers.ts');
const reconHelpersContent = fs.readFileSync(reconHelpersPath, 'utf8');

assert(
  reconHelpersContent.includes('export const VAT_RATE = 0.21;'),
  'VAT_RATE este strict 0.21 (21% TVA deductibil holding)'
);

assert(
  reconHelpersContent.includes('Math.round(roundedAmount * VAT_RATE * 100) / 100'),
  'Formula de calcul a TVA mecanic utilizează direct VAT_RATE'
);

// -------------------------------------------------------------
// [Test 2] Verificare Holding Cost & Standard RapidRecon
// -------------------------------------------------------------
console.log('\n[Test 2] Verificare Holding Cost Calculator (RapidRecon)');
assert(
  reconHelpersContent.includes('export const HOLDING_COST_PER_DAY_EUR = 35;'),
  'Holding cost per zi este setat la benchmark-ul de 35 €/zi'
);

assert(
  reconHelpersContent.includes('export const HOLDING_COST_ALERT_DAYS = 5;'),
  'Pragul de alertă depășire atelier este de 5 zile'
);

assert(
  reconHelpersContent.includes('getCarHoldingCostMetrics'),
  'Funcția getCarHoldingCostMetrics este exportată'
);

// -------------------------------------------------------------
// [Test 3] Verificare 5 Coloane Canonice Recon
// -------------------------------------------------------------
console.log('\n[Test 3] Verificare 5 Coloane Canonice (Trello Elimination)');
const requiredColumns = [
  'intake_inspection',
  'in_workshop',
  'detailing',
  'rar_itp',
  'ready_for_sale'
];

requiredColumns.forEach(col => {
  assert(
    reconHelpersContent.includes(`id: '${col}'`),
    `Coloana canonică '${col}' este definită în RECON_COLUMNS`
  );
});

// -------------------------------------------------------------
// [Test 4] Verificare Audit Log & Trasabilitate
// -------------------------------------------------------------
console.log('\n[Test 4] Verificare Audit Log la Tranziție Recon');
assert(
  reconHelpersContent.includes('createReconStatusAuditEntry'),
  'Helper-ul createReconStatusAuditEntry este definit'
);

const drawerPath = path.join(__dirname, '../../src/components/admin/service-tracker/ReconVehicleDrawer.tsx');
const drawerContent = fs.readFileSync(drawerPath, 'utf8');

assert(
  drawerContent.includes('createReconStatusAuditEntry(car.reconStatus, nextStatus)'),
  'Drawer-ul apelează createReconStatusAuditEntry la schimbarea stadiului'
);

assert(
  drawerContent.includes('reconStatusChangedAt: new Date().toISOString()'),
  'Drawer-ul actualizează reconStatusChangedAt pentru calculul exact al zilelor'
);

// -------------------------------------------------------------
// [Test 5] Verificare Modularitate & Limită Linii Cod (<1000 linii)
// -------------------------------------------------------------
console.log('\n[Test 5] Verificare Modularitate (<1000 linii per componentă)');
const filesToCheck = [
  { name: 'VehicleReconBoard.tsx', maxLines: 450 },
  { name: 'ReconKanbanBoard.tsx', maxLines: 400 },
  { name: 'ReconTableView.tsx', maxLines: 300 },
  { name: 'ReconDocumentVault.tsx', maxLines: 350 },
  { name: 'ReconVehicleDrawer.tsx', maxLines: 700 },
  { name: 'ReconDocumentViewerModal.tsx', maxLines: 200 },
  { name: 'ReconVaultConfigModal.tsx', maxLines: 150 },
  { name: 'reconHelpers.ts', maxLines: 200 }
];

filesToCheck.forEach(f => {
  const filePath = path.join(__dirname, '../../src/components/admin/service-tracker/', f.name);
  assert(fs.existsSync(filePath), `Fișierul ${f.name} există`);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
  assert(
    lines <= f.maxLines,
    `${f.name} este suplu și modular (${lines} linii <= max ${f.maxLines} linii)`
  );
});

// -------------------------------------------------------------
// [Test 6] Verificare Seif Documente & Sincronizare Google Drive
// -------------------------------------------------------------
console.log('\n[Test 6] Verificare High-Res Document Vault & Google Drive Sync');
const viewerPath = path.join(__dirname, '../../src/components/admin/service-tracker/ReconDocumentViewerModal.tsx');
const viewerContent = fs.readFileSync(viewerPath, 'utf8');

assert(
  viewerContent.includes('scale(${zoomLevel}) rotate(${rotation}deg)'),
  'Viewer-ul suportă zoom optic continuu și rotire la 90°'
);

assert(
  viewerContent.includes('contrast-150 brightness-110 grayscale'),
  'Viewer-ul include filtru Contrast+ pentru bonuri șterse'
);

assert(
  drawerContent.includes('queueFileForGDriveSync'),
  'Încărcarea de bonuri trimite fișierul către coada Google Drive Vault'
);

console.log('\n================================================================');
console.log(`🎉 REZULTAT: ${passedTests}/${totalTests} TESTE AU TRECUT CU SUCCES!`);
console.log('================================================================\n');
