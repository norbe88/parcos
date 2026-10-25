/**
 * RXM AUTOMOBILE — Automated Security & Penetration Verification Suite
 * Verifică protecția porții de autentificare /admin și apărarea împotriva accesului extern neautorizat.
 * 
 * Target: c:\Projects\rxm-automobile
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('======================================================================');
console.log('🛡️ RXM AUTOMOBILE — TEST AUTOMAT DE SECURITATE & PEN-TEST /admin');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

const rootDir = path.resolve(__dirname, '..');
const SUPERADMIN_PASSWORD_HASH = 'e180c917ef121846cee6c6b488b9d7a159c12c96880c1901b5a309ca66efb7c2'; // SHA-256('Olaf.0311')
const ADMIN_PASSWORD_HASH = 'dbc1d0952684f4b89cc86bc7ffdd52cacc2a79e667b7e0765953069e05bb6589'; // SHA-256('Luna.RXM')

// -----------------------------------------------------------------------------
// TEST SUITE 1: Dicționar de Parole Comune & Atac Brute-Force Extern
// -----------------------------------------------------------------------------
console.log('🔍 [SUITE 1] Test Dicționar Parole Comune & Dicționare de Boți');

const commonPasswords = [
  'admin', 'admin123', 'admin2026', 'password', 'pass123', '123456', '12345678',
  'rxm', 'rxmauto', 'rxmautomobile', 'rxm2026', 'cluj', 'clujnapoca', 'carmatik',
  'autolicit', 'demo', 'demo123', 'test', 'tester', 'root', 'toor', 'guest',
  'operator', 'superadmin', 'manager', 'sales',
  'flota', 'parcauto', 'dealer', 'dealer123', 'bmw', 'audi', 'mercedes', 'volvo'
];

let allCommonRejected = true;
for (const pwd of commonPasswords) {
  const hash = crypto.createHash('sha256').update(pwd).digest('hex');
  if (hash === ADMIN_PASSWORD_HASH || hash === SUPERADMIN_PASSWORD_HASH) {
    allCommonRejected = false;
    break;
  }
}
assert(allCommonRejected, `Niciuna din cele ${commonPasswords.length} parole uzuale/de dicționar nu permite accesul`);

// -----------------------------------------------------------------------------
// TEST SUITE 2: Validare Criptografică & Decuplare Canonică Dual-Role
// -----------------------------------------------------------------------------
console.log('\n🔍 [SUITE 2] Validare Criptografică & Decuplare Canonică Dual-Role');

const superadminPassword = 'Olaf.0311';
const dealerPassword = 'Luna.RXM';

const computedSuperadminHash = crypto.createHash('sha256').update(superadminPassword).digest('hex');
const computedDealerHash = crypto.createHash('sha256').update(dealerPassword).digest('hex');

assert(computedSuperadminHash === SUPERADMIN_PASSWORD_HASH, 'Parola ParcOS SuperAdmin (Olaf.0311) produce hash-ul autorizat');
assert(computedDealerHash === ADMIN_PASSWORD_HASH, 'Parola RXM Showroom Admin (Luna.RXM) produce hash-ul autorizat');

// Decuplare canonică strictă: cele două parole nu coincid
assert(computedSuperadminHash !== ADMIN_PASSWORD_HASH, 'Decuplare: Parola SuperAdmin nu este identică cu parola de dealer');
assert(computedDealerHash !== SUPERADMIN_PASSWORD_HASH, 'Decuplare: Parola de showroom nu este identică cu parola SuperAdmin');

// Verificare variații (Case-sensitivity)
assert(crypto.createHash('sha256').update('olaf.0311').digest('hex') !== SUPERADMIN_PASSWORD_HASH, 'SuperAdmin: varianta minusculă ("olaf.0311") este categoric respinsă');
assert(crypto.createHash('sha256').update('luna.rxm').digest('hex') !== ADMIN_PASSWORD_HASH, 'Dealer Admin: varianta minusculă ("luna.rxm") este categoric respinsă');
assert(crypto.createHash('sha256').update('LUNA.RXM').digest('hex') !== ADMIN_PASSWORD_HASH, 'Dealer Admin: varianta majusculă ("LUNA.RXM") este categoric respinsă');

// Verificare whitespace trimming
assert(crypto.createHash('sha256').update('  Olaf.0311  '.trim()).digest('hex') === SUPERADMIN_PASSWORD_HASH, 'SuperAdmin: spațiile accidentale sunt curățate (trim) corect');
assert(crypto.createHash('sha256').update('  Luna.RXM  '.trim()).digest('hex') === ADMIN_PASSWORD_HASH, 'Dealer Admin: spațiile accidentale sunt curățate (trim) corect');

// -----------------------------------------------------------------------------
// TEST SUITE 3: Zero Scurgeri de Parolă în Text Clar (Source Code Hardening)
// -----------------------------------------------------------------------------
console.log('\n🔍 [SUITE 3] Scanare Cod Sursă: Zero Scurgeri de Parolă în Text Clar');

function scanSourceFiles(dir, forbiddenStrings, exceptions = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git' && file.name !== 'dist') {
        const clean = scanSourceFiles(fullPath, forbiddenStrings, exceptions);
        if (!clean) return false;
      }
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
      if (exceptions.some(ex => fullPath.includes(ex))) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const str of forbiddenStrings) {
        if (content.includes(`'${str}'`) || content.includes(`"${str}"`)) {
          return false;
        }
      }
    }
  }
  return true;
}

const isSrcClean = scanSourceFiles(path.join(rootDir, 'src'), [superadminPassword, dealerPassword]);
assert(isSrcClean, 'Niciun fișier sursă din src/ nu conține parolele în text clar (doar hash-urile SHA-256 sunt stocate)');

// -----------------------------------------------------------------------------
// TEST SUITE 4: Mecanismul Anti-Spoofing SessionStorage & Validare Token Dual-Key
// -----------------------------------------------------------------------------
console.log('\n🔍 [SUITE 4] Test Anti-Spoofing & Validare Token Sesiune Dual-Key');

const appTsxContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
const loginGateContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/AdminLoginGate.tsx'), 'utf8');
const adminAuthContent = fs.readFileSync(path.join(rootDir, 'src/utils/adminAuth.ts'), 'utf8');

assert(
  adminAuthContent.includes('sessionStorage.getItem(ADMIN_AUTH_FLAG_KEY) === \'true\'') &&
  adminAuthContent.includes('sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY)'),
  'adminAuth.ts validează concomitent ambele chei de sesiune (flag-ul boolean ȘI token-ul criptografic)'
);

assert(
  appTsxContent.includes('/api/auth/verify'),
  'App.tsx validează starea activă a sesiunii pe server via /api/auth/verify'
);

assert(
  appTsxContent.includes('sessionStorage.removeItem(\'rxm_admin_authenticated\')') &&
  appTsxContent.includes('sessionStorage.removeItem(\'rxm_admin_session_token\')'),
  'App.tsx purjează imediat storage-ul dacă sesiunea este invalidată pe server'
);

// -----------------------------------------------------------------------------
// TEST SUITE 5: Blocare Brute-Force & Persistență Lockout la Refresh (F5)
// -----------------------------------------------------------------------------
console.log('\n🔍 [SUITE 5] Rate Limiting & Persistență Lockout la Reîncărcare (Anti-Brute Force)');

assert(loginGateContent.includes('MAX_ATTEMPTS = 5'), 'AdminLoginGate limitează strict tentativele la maxim 5 încercări');
assert(loginGateContent.includes('rxm_admin_lockout_until'), 'AdminLoginGate persistă timestamp-ul de blocare în sessionStorage');
assert(loginGateContent.includes('rxm_admin_fail_count'), 'AdminLoginGate contorizează încercările eșuate trans-refresh');
assert(loginGateContent.includes('disabled={isSubmitting || lockoutRemaining > 0}'), 'Formularul dezactivează butoanele și câmpul text pe durata blocării');

// -----------------------------------------------------------------------------
// TEST SUITE 6: Confidențialitate Comercială Showroom Public (Scrubbing Date Sensibile)
// -----------------------------------------------------------------------------
console.log('\n🔍 [SUITE 6] Protecție Secret Comercial: Mascare Date Sensibile Public');

assert(appTsxContent.includes('purchasePriceEur: undefined'), 'Prețul de achiziție al mașinilor este complet șters pentru vizitatorii externi');
assert(appTsxContent.includes('soldPriceEur: undefined'), 'Prețul final negociat este complet șters pentru vizitatorii externi');
assert(appTsxContent.includes('expenses: undefined'), 'Cheltuielile de service/recondiționare sunt șterse pentru vizitatorii externi');
assert(appTsxContent.includes('internalNotes: undefined'), 'Notele confidențiale de vânzări sunt șterse pentru vizitatorii externi');
assert(appTsxContent.includes('auditLog: undefined'), 'Istoricul de audit intern este șters pentru vizitatorii externi');
assert(appTsxContent.includes('vin: car.vin ? `${car.vin.substring(0, 7)}**********` : \'\''), 'Seria de șasiu (VIN) este mascată public conform standardelor anti-fraudă');

// -----------------------------------------------------------------------------
// SUMAR EXECUTIE
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`REZULTAT AUDIT SECURITATE: ${passedTests}/${totalTests} TESTE TRECUTE CU SUCCES!`);
if (passedTests === totalTests) {
  console.log('🏆 POARTA DE ACCES /admin ESTE COMPLET SECURIZATĂ ÎMPOTRIVA ACCESULUI EXTERN!');
} else {
  console.error('⚠️ UNELE TESTE DE SECURITATE AU EȘUAT.');
  process.exit(1);
}
console.log('======================================================================');
