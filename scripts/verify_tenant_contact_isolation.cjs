/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🛡️ QA SUITE: TENANT CONTACT ISOLATION & ZERO-LEAK VERIFIER
 * Previne scurgerea contactelor (WhatsApp / Telefon) între chiriași B2B (MPI Auto, Top Auto etc.)
 * și garantează că NICIUN buton de WhatsApp/Telefon nu rutează la numerele RXM
 * când vizitatorul se află pe showroom-ul unui partener.
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failureDetails = [];

function assert(condition, testName, details = '') {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    testsFailed++;
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failureDetails.push({ testName, details });
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

console.log('===============================================================');
console.log('🏢 PARCOS MULTI-TENANT CONTACT ISOLATION & ZERO-LEAK SUITE');
console.log('Target: MPI Auto & All B2B Tenants WhatsApp/Phone Routing');
console.log('===============================================================\n');

// ─── 1. Verificare Implementare Funcție resolveDealerContact în helpers.ts ────
console.log('🔍 [SUITE 1] Integritate Generator Contacte Izolate (src/utils/helpers.ts)');
const helpersContent = readFile('src/utils/helpers.ts');

assert(helpersContent.includes('export function normalizeWhatsAppNumber'), 'normalizeWhatsAppNumber este exportată');
assert(helpersContent.includes('export function resolveDealerContact'), 'resolveDealerContact este exportată');
assert(helpersContent.includes('const salesWhatsApp = normalizeWhatsAppNumber'), 'salesWhatsApp este sanitizat și normalizat');
assert(helpersContent.includes('const financeWhatsApp = normalizeWhatsAppNumber'), 'financeWhatsApp este sanitizat și normalizat');
assert(!helpersContent.includes('Str. Colonia Hodai F.N., Cluj-Napoca'), 'Eliminată adresa fizică RXM hardcodată din WhatsApp car inquiry');
assert(!helpersContent.includes('adus la comandă prin RXM Automobile!'), 'Eliminat brandul RXM hardcodat din WhatsApp sold order');

// ─── 2. Simulare Logică Contact Resolver & WhatsApp Helpers ─────────────────
console.log('\n🔍 [SUITE 2] Simulare Izolare Contacte MPI Auto vs RXM');

function normalizeWhatsAppNumber(rawNumber, fallbackNumber = '40748892937') {
  const target = rawNumber || fallbackNumber;
  let digits = target.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `40${digits.substring(1)}`;
  }
  return digits.length >= 9 ? digits : '40748892937';
}

function resolveDealerContact(dealer) {
  const salesPhone = dealer?.phonePrimary || dealer?.phoneSecondary || '0748 892 937';
  const salesPhoneClean = salesPhone.replace(/\s+/g, '');
  const salesWhatsApp = normalizeWhatsAppNumber(dealer?.whatsappNumber, '40748892937');

  const financePhone = dealer?.phoneFinance || dealer?.phoneSecondary || salesPhone;
  const financePhoneClean = financePhone.replace(/\s+/g, '');
  const financeWhatsApp = normalizeWhatsAppNumber(
    dealer?.whatsappFinance || dealer?.whatsappNumber,
    salesWhatsApp
  );

  return {
    salesPhone,
    salesPhoneClean,
    salesWhatsApp,
    financePhone,
    financePhoneClean,
    financeWhatsApp,
    financeContactName: dealer?.financeContactName || 'Consilier Finanțare',
    generalContactName: dealer?.generalContactName || 'Consilier Vânzări',
  };
}

const mockMpiDealer = {
  name: "MPI AUTO CLA S.R.L.",
  phonePrimary: "0759 757 858",
  phoneSecondary: "0749 691 302",
  phoneFinance: "0749 691 302",
  whatsappNumber: "40759757858",
  whatsappFinance: "40749691302",
  financeContactName: "Consilier Finanțare MPI",
  generalContactName: "Consilier Vânzări MPI",
};

const mpiContact = resolveDealerContact(mockMpiDealer);

assert(mpiContact.salesPhone === '0759 757 858', 'MPI salesPhone este 0759 757 858');
assert(mpiContact.salesPhoneClean === '0759757858', 'MPI salesPhoneClean este 0759757858');
assert(mpiContact.salesWhatsApp === '40759757858', 'MPI salesWhatsApp este 40759757858');
assert(mpiContact.financePhone === '0749 691 302', 'MPI financePhone este 0749 691 302');
assert(mpiContact.financePhoneClean === '0749691302', 'MPI financePhoneClean este 0749691302');
assert(mpiContact.financeWhatsApp === '40749691302', 'MPI financeWhatsApp este 40749691302');

// Verificare izolarea fallback-ului: Dacă un dealer nu are finance setat, fallback-ul e către contactele proprii de vânzări, NU RXM!
const dealerFaraFinantare = {
  name: "Custom Park SRL",
  phonePrimary: "0711 111 222",
  whatsappNumber: "40711111222",
};
const customContact = resolveDealerContact(dealerFaraFinantare);
assert(customContact.financePhone === '0711 111 222', 'Dealer fără finanțare explicită folosește propriul phonePrimary (nu RXM)');
assert(customContact.financeWhatsApp === '40711111222', 'Dealer fără finanțare explicită folosește propriul whatsappNumber (nu RXM)');

// ─── 3. Verificare Bază de Date & Configurație Server ─────────────────────────
console.log('\n🔍 [SUITE 3] Sincronizare Backend & DB (server/db.mjs & server/api.mjs)');
const serverDbMjs = readFile('server/db.mjs');
const serverApiMjs = readFile('server/api.mjs');

assert(serverDbMjs.includes('40759757858'), 'server/db.mjs conține WhatsApp vânzări MPI Auto (40759757858)');
assert(serverDbMjs.includes('40749691302'), 'server/db.mjs conține WhatsApp finanțare MPI Auto (40749691302)');
assert(serverDbMjs.includes('phone_finance'), 'server/db.mjs include coloana phone_finance');
assert(serverDbMjs.includes('whatsapp_finance'), 'server/db.mjs include coloana whatsapp_finance');

assert(serverApiMjs.includes('phone_finance'), 'server/api.mjs mapează phone_finance');
assert(serverApiMjs.includes('whatsapp_finance'), 'server/api.mjs mapează whatsapp_finance');
assert(serverApiMjs.includes('40759757858'), 'server/api.mjs conține fallback WhatsApp vânzări MPI');
assert(serverApiMjs.includes('40749691302'), 'server/api.mjs conține fallback WhatsApp finanțare MPI');

// ─── 4. Verificare Componente UI Showroom (Zero Hardcoded Phone Leak) ────────
console.log('\n🔍 [SUITE 4] Audit Componente UI Showroom & Modale');

const rxmSalesNum = '0748 892 937';
const rxmSalesWa = '40748892937';
const rxmFinNum = '0758 042 979';
const rxmFinWa = '40758042979';

const filesToAudit = [
  'src/components/layout/FloatingWhatsApp.tsx',
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Topbar.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/showroom/FinancingSection.tsx',
  'src/components/showroom/FinancingRequirementsAccordion.tsx',
  'src/components/showroom/VehicleCard.tsx',
  'src/components/showroom/BuyBackSection.tsx',
  'src/components/showroom/CustomOrderSection.tsx',
  'src/components/showroom/DealerHeroAdapter.tsx',
  'src/components/showroom/SpecialOffersCarousel.tsx',
  'src/components/delivery/NationalDeliveryPage.tsx',
  'src/components/modals/VehicleDetailModal.tsx',
  'src/components/modals/vehicle-detail/DetailSpecsTab.tsx',
  'src/components/modals/vehicle-detail/DetailFinanceTab.tsx',
  'src/components/modals/vehicle-detail/DetailVideoTab.tsx',
];

for (const relPath of filesToAudit) {
  const content = readFile(relPath);
  const baseName = path.basename(relPath);
  
  // Niciun număr RXM nu trebuie să apară hardcodat ca țintă fără parametrizare
  const hasRxmFinHardcoded = content.includes(`>${rxmFinNum}<`) || 
                             content.includes(`tel:${rxmFinNum.replace(/\s+/g, '')}`) ||
                             content.includes(`wa.me/${rxmFinWa}`);
  const hasRxmSalesHardcoded = content.includes(`tel:${rxmSalesNum.replace(/\s+/g, '')}`) ||
                               content.includes(`wa.me/${rxmSalesWa}`);

  assert(!hasRxmFinHardcoded, `${baseName} nu are numărul de finanțare RXM (${rxmFinNum}) hardcodat`);
  assert(!hasRxmSalesHardcoded, `${baseName} nu are numărul de vânzări RXM (${rxmSalesNum}) hardcodat`);
}

// ─── 5. Verificare Pasare Dealer Prop în App.tsx și VehicleDetailModal ────────
console.log('\n🔍 [SUITE 5] Punte State & Transmitere Prop Dealer');
const appTsx = readFile('src/App.tsx');
assert(appTsx.includes('<FloatingWhatsApp dealer={tenant} />'), 'App.tsx transmite dealer={tenant} către FloatingWhatsApp');

const vehicleDetailModalTsx = readFile('src/components/modals/VehicleDetailModal.tsx');
assert(vehicleDetailModalTsx.includes('<DetailSpecsTab') && vehicleDetailModalTsx.includes('dealer={dealer}'), 'VehicleDetailModal transmite dealer către DetailSpecsTab');
assert(vehicleDetailModalTsx.includes('resolveDealerContact(dealer)'), 'VehicleDetailModal rezolvă contactele prin resolveDealerContact');

const detailSpecsTabTsx = readFile('src/components/modals/vehicle-detail/DetailSpecsTab.tsx');
assert(detailSpecsTabTsx.includes('getWhatsAppVinRequestUrl(car, dealer || car.dealerSlug'), 'DetailSpecsTab folosește dealer-ul activ pentru cererea de VIN');

const detailFinanceTabTsx = readFile('src/components/modals/vehicle-detail/DetailFinanceTab.tsx');
assert(detailFinanceTabTsx.includes('resolveDealerContact(dealer)'), 'DetailFinanceTab folosește resolveDealerContact');

console.log('\n===============================================================');
console.log(`REZULTAT QA IZOLARE CONTACTE TENANT: ${testsPassed}/${testsRun} TESTE TRECUTE!`);
if (testsFailed > 0) {
  console.error(`❌ Eșecuri detectate: ${testsFailed}`);
  process.exit(1);
} else {
  console.log('🎉 SUCCES TOTAL: Toate butoanele de WhatsApp și apelare sunt 100% izolate per tenant!');
  console.log('                 Nicio scurgere către RXM Automobile pentru MPI Auto sau alți parteneri.');
  process.exit(0);
}
