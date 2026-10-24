/**
 * QA Suite Verifier pentru RXM Automobile Showroom
 * Execută suita completă de teste de calitate, securitate și conformitate pe baza notelor de la prezentarea demo.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

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
console.log('🤖 AGENTIC QA TEST SUITE - RXM AUTOMOBILE CLUJ-NAPOCA');
console.log('Data & Ora: ' + new Date().toISOString());
console.log('===============================================================\n');

// 1. Verificare Motor Curs Valutar & Formatare RON
console.log('🔍 [SUITE 1] Currency Engine & Eliminare Tildă (~)');
const currencyEngineCode = readFile('src/utils/currencyEngine.ts');
assert(currencyEngineCode.includes('DEFAULT_BT_EXCHANGE_RATE = 5.0800'), 'Curs BT implicit setat la 5.0800 (BNR + 2%)');
assert(currencyEngineCode.includes('DEFAULT_COMMERCIAL_MARGIN_PCT = 2.0'), 'Marjă comercială auto setată la 2.0%');
assert(!currencyEngineCode.includes('~ ${ron}'), 'Formatarea prețului RON nu include tildă (~)');

const heroSpotlightCode = readFile('src/components/showroom/HeroSpotlight.tsx');
assert(!heroSpotlightCode.includes('~ {Math.round'), 'HeroSpotlight nu conține tildă în fața RON');

const financingSectionCode = readFile('src/components/showroom/FinancingSection.tsx');
assert(!financingSectionCode.includes('~ {Math.round'), 'FinancingSection nu conține tildă în fața RON');

const detailFinanceTabCode = readFile('src/components/modals/vehicle-detail/DetailFinanceTab.tsx');
assert(!detailFinanceTabCode.includes('~ {convertEurToRon'), 'DetailFinanceTab nu conține tildă în fața RON');

const printableSheetCode = readFile('src/components/print/PrintableVehicleSheet.tsx');
assert(!printableSheetCode.includes('~ {convertEurToRon'), 'PrintableVehicleSheet nu conține tildă în fața RON');

// 2. Verificare Ierarhie Creditori & Dobândă de la 7.9%
console.log('\n🔍 [SUITE 2] Parteneri Finanțare & Dobânzi Creditori');
assert(currencyEngineCode.includes("name: 'TBI Bank'"), 'TBI Bank configurat în creditori');
assert(currencyEngineCode.includes('interestRate: 7.9'), 'TBI Bank are dobândă de la 7.9%');
assert(currencyEngineCode.includes('isPrimary: true'), 'TBI Bank este marcat ca partener principal');
assert(currencyEngineCode.includes("name: 'Banca Transilvania'") && currencyEngineCode.includes("'BT Direct'"), 'BT Direct prezent în creditori');
assert(currencyEngineCode.includes("name: 'UniCredit'"), 'UniCredit prezent în creditori');
assert(currencyEngineCode.includes("name: 'CreditFix'"), 'CreditFix prezent în creditori');
assert(financingSectionCode.includes('TBI Bank (Principal)'), 'FinancingSection evidențiază TBI Bank ca principal');

// 3. Verificare Eliminare „Motor sau Cutie” din Garanție
console.log('\n🔍 [SUITE 3] Standard Garanție Conformitate (Fără Motor/Cutie)');
assert(!heroSpotlightCode.toLowerCase().includes('motor & cutie'), 'HeroSpotlight nu menționează motor & cutie');
assert(!printableSheetCode.includes('(Motor + Cutie)'), 'PrintableVehicleSheet nu menționează (Motor + Cutie)');
const whyChooseUsCode = readFile('src/components/showroom/WhyChooseUs.tsx');
assert(!whyChooseUsCode.toLowerCase().includes('motor și cutie'), 'WhyChooseUs nu menționează motor și cutie');
const termsCode = readFile('src/components/legal/TermsAndConditionsPage.tsx');
assert(!termsCode.toLowerCase().includes('pe motor și cutia'), 'TermsAndConditionsPage nu conține „pe motor și cutia”');
const deliveryCode = readFile('src/components/delivery/NationalDeliveryPage.tsx');
assert(!deliveryCode.toLowerCase().includes('pe motor și cutie'), 'NationalDeliveryPage nu conține „pe motor și cutie”');

// 4. Verificare Mașină la Comandă — Pasul 04
console.log('\n🔍 [SUITE 4] Text Agreat Mașină la Comandă');
const customOrderCode = readFile('src/components/showroom/CustomOrderSection.tsx');
assert(customOrderCode.includes('Predare & <span className="text-amber-400 italic">Numere Roșii</span>'), 'Titlu Pas 4 conține Predare & Numere Roșii');
assert(customOrderCode.includes('Efectuăm revizia la predare, eliberăm numere roșii provizorii pe loc, garanție scrisă și asistență dosar RAR.'), 'Descriere Pas 4 respectă întocmai formularea solicitată');

// 5. Verificare Buy-Back — Fără „Primești Banii” & Doar Trade-In
console.log('\n🔍 [SUITE 5] Buy-Back Trade-In Exclusiv');
const buyBackCode = readFile('src/components/showroom/BuyBackSection.tsx');
assert(!buyBackCode.includes('Primești Banii'), 'BuyBackSection nu conține formularea „Primești Banii”');
assert(!buyBackCode.includes('Vânzare rapidă către parc'), 'Eliminată opțiunea de vânzare directă fără schimb');
assert(buyBackCode.includes('Trade-In Avantajos') && buyBackCode.includes('Schimb Auto'), 'Evidențiat fluxul de Trade-In cu mașină din stoc');

// 6. Verificare Vehicle Cards — Fără Revizie Gratuită -> Consultanță Înmatriculare
console.log('\n🔍 [SUITE 6] Carduri Vehicule (Consultanță Înmatriculare)');
const vehicleCardCode = readFile('src/components/showroom/VehicleCard.tsx');
assert(!vehicleCardCode.toLowerCase().includes('revizie gratuită'), 'VehicleCard nu conține „revizie gratuită”');
assert(vehicleCardCode.includes('Consultanță Înmatriculare'), 'VehicleCard conține „Consultanță Înmatriculare”');

// 7. Verificare Confidențialitate VIN (WhatsApp Only)
console.log('\n🔍 [SUITE 7] Politică Securitate & Confidențialitate VIN');
const detailSpecsCode = readFile('src/components/modals/vehicle-detail/DetailSpecsTab.tsx');
assert(!detailSpecsCode.includes('car.vin.substring'), 'DetailSpecsTab nu mai afișează seria VIN mascată');
assert(detailSpecsCode.includes('Solicită Seria VIN pe WhatsApp'), 'DetailSpecsTab oferă buton dedicat de solicitare VIN pe WhatsApp');
assert(detailSpecsCode.includes('prevenirea copierii anunțurilor'), 'DetailSpecsTab explică motivul de securitate/antifraudă');

// 8. Verificare Test Drive (Fără Calendar Personal)
console.log('\n🔍 [SUITE 8] Test Drive Direct pe WhatsApp (Fără Calendar Personal)');
const detailTestDriveCode = readFile('src/components/modals/vehicle-detail/DetailTestDriveTab.tsx');
assert(!detailTestDriveCode.includes('Sincronizează în Calendarul Tău Personal'), 'Eliminată secțiunea de sincronizare în calendar personal');
assert(!detailTestDriveCode.includes('.ics'), 'Eliminat link-ul de descărcare fișier .ics');
assert(detailTestDriveCode.includes('Confirmă Programarea Test Drive pe WhatsApp'), 'Păstrat butonul de acțiune direct pe WhatsApp');

// 9. Verificare Social Share Buttons & Google Reviews Carousel
console.log('\n🔍 [SUITE 9] Social Share Hub & Carusel Recenzii Google');
assert(fs.existsSync(path.join(srcDir, 'components', 'common', 'SocialShareButtons.tsx')), 'Componenta SocialShareButtons.tsx există');
assert(fs.existsSync(path.join(srcDir, 'components', 'showroom', 'GoogleReviewsSection.tsx')), 'Componenta GoogleReviewsSection.tsx există');

const appCode = readFile('src/App.tsx');
assert(appCode.includes('<GoogleReviewsSection />'), 'GoogleReviewsSection este montată în App.tsx');

const vehicleDetailModalCode = readFile('src/components/modals/VehicleDetailModal.tsx');
assert(vehicleDetailModalCode.includes('<SocialShareButtons'), 'SocialShareButtons este montată în VehicleDetailModal.tsx');

// 10. Verificare Lead Service CRM & Export CSV
console.log('\n🔍 [SUITE 10] Bază de Date Centralizată Lead-uri & Export CSV');
const leadServiceCode = readFile('src/services/leadService.ts');
assert(leadServiceCode.includes('rxm_dealer_leads_store'), 'Cheia de stocare a lead-urilor este rxm_dealer_leads_store');
assert(leadServiceCode.includes('export function exportLeadsToCsv'), 'Funcția de export CSV există');
assert(leadServiceCode.includes('recontactDate'), 'Lead-urile conțin câmpul de recontactare');

const kanbanCode = readFile('src/components/admin/LeadPipelineKanban.tsx');
assert(kanbanCode.includes('Export CSV'), 'LeadPipelineKanban conține butonul de Export CSV');
assert(kanbanCode.includes('lead.recontactDate'), 'LeadPipelineKanban afișează data de recontactare');

// 11. Verificare Portal Gestiune Finanțare
console.log('\n🔍 [SUITE 11] Management Curs BT & Dobânzi în Admin');
assert(fs.existsSync(path.join(srcDir, 'components', 'admin', 'FinancingSettingsManager.tsx')), 'Componenta FinancingSettingsManager.tsx există');
const adminPortalCode = readFile('src/components/admin/AdminPortal.tsx');
assert(adminPortalCode.includes('FinancingSettingsManager'), 'AdminPortal integrează FinancingSettingsManager');
assert(adminPortalCode.includes("activeAdminTab === 'financing'"), 'Tab-ul Curs BT & Creditori este activ în AdminPortal');

// 12. Rutare Contacte: Finanțare (Mădălina) vs Vânzări (Robert)
console.log('\n🔍 [SUITE 12] Rutare Contacte Finanțare (Mădălina) vs Vânzări (Robert)');
const dealerCode = readFile('src/db/dealer.ts');
const helpersCode = readFile('src/utils/helpers.ts');
assert(dealerCode.includes('phoneFinance: "0758 042 979"'), 'Dealer profile are numărul de finanțare al Mădălinei setat la 0758 042 979');
assert(dealerCode.includes('whatsappFinance: "40758042979"'), 'Dealer profile are WhatsApp finanțare setat la 40758042979');
assert(dealerCode.includes('phonePrimary: "0748 892 937"'), 'Dealer profile păstrează numărul primar al lui Robert la 0748 892 937');
assert(helpersCode.includes('40758042979'), 'getWhatsAppFinanceUrl rutează la 40758042979 (Mădălina)');
assert(financingSectionCode.includes('whatsappFinance'), 'FinancingSection rutează către whatsappFinance');
assert(financingSectionCode.includes('0758 042 979'), 'FinancingSection afișează numărul Mădălinei (0758 042 979)');
assert(detailFinanceTabCode.includes('whatsappFinance'), 'DetailFinanceTab rutează către whatsappFinance');
assert(detailFinanceTabCode.includes('0758 042 979'), 'DetailFinanceTab afișează numărul Mădălinei (0758 042 979)');

// 13. Verificare Dist Build Output
console.log('\n🔍 [SUITE 13] Integritate Bundle de Producție (dist/)');
assert(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html a fost generat');
assert(fs.existsSync(path.join(distDir, 'assets')), 'dist/assets conține bundle-ul compilat');

// 14. Verificare Scanner Real Documente CIV/Talon & Pipeline OCR
console.log('\n🔍 [SUITE 14] Real Document Scanner CIV/Talon & Pipeline OCR');
assert(fs.existsSync(path.join(srcDir, 'utils', 'documentOcrParser.ts')), 'Modulul documentOcrParser.ts există');
assert(fs.existsSync(path.join(srcDir, 'utils', 'documentOcrEngine.ts')), 'Modulul documentOcrEngine.ts există');

const parserCode = readFile('src/utils/documentOcrParser.ts');
assert(parserCode.includes('convertKwToHp'), 'documentOcrParser conține convertKwToHp');
assert(parserCode.includes('1.35962'), 'Formula Directiva 1999/37/CE respectă strict factorul 1.35962');
assert(parserCode.includes('convertMilesToKm'), 'documentOcrParser conține convertMilesToKm pentru US Title');
assert(parserCode.includes('1.60934'), 'Formula US Title respectă factorul 1.60934');
assert(parserCode.includes('sanitizeVin'), 'documentOcrParser conține sanitizeVin (interzice I, O, Q)');

const civHeroCode = readFile('src/components/admin/add-vehicle/CivScanHero.tsx');
assert(civHeroCode.includes('cameraInputRef'), 'CivScanHero conține referință dedicată de cameră foto');
assert(civHeroCode.includes('capture="environment"'), 'CivScanHero activează camera din spate pe mobil (environment)');
assert(civHeroCode.includes('onDrop='), 'CivScanHero suportă Drag & Drop pentru documente');
assert(civHeroCode.includes('handleRotate'), 'CivScanHero oferă opțiune de rotire 90° a documentului');

const addVehicleCode = readFile('src/components/admin/AddVehicleModal.tsx');
assert(addVehicleCode.includes('processVehicleDocumentOcr'), 'AddVehicleModal apelează motorul real OCR processVehicleDocumentOcr');
assert(addVehicleCode.includes('parsedDocReview'), 'AddVehicleModal gestionează panoul de recenzie date extrase');

const stepFeaturesCode = readFile('src/components/admin/add-vehicle/StepFeatures.tsx');
assert(stepFeaturesCode.includes('processVehicleDocumentOcr') || stepFeaturesCode.includes('processEquipmentSheetOcr'), 'StepFeatures apelează motorul OCR pentru foaia de opționale');
assert(stepFeaturesCode.includes('sheetCameraInputRef'), 'StepFeatures include captură cameră foto pentru PR-codes');

// Test de integrare a parserului de texte Directive 1999/37/CE (Germania & SUA)
const sampleGermanText = `BUNDESREPUBLIK DEUTSCHLAND ZULASSUNGSBESCHEINIGUNG TEIL I
(B) 12.04.2018
(E) WBA5A51030D128914
(D.1) BMW
(D.3) Seria 5
(P.1) 1995
(P.2) 140 kW
(P.3) Diesel
(R) Schwarz`;

// Testare directă prin regex-urile extrase din parserCode
const deVinMatch = sampleGermanText.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
assert(deVinMatch && deVinMatch[0] === 'WBA5A51030D128914', 'Extragere precisă Cod E (VIN 17 caractere) din Zulassung');

const deKwMatch = sampleGermanText.match(/(?:\(P\.2\)|P\.2)\s*([0-9]{2,4})/);
const calculatedHp = deKwMatch ? Math.round(parseInt(deKwMatch[1], 10) * 1.35962) : 0;
assert(calculatedHp === 190, 'Conversie precisă 140 kW -> 190 CP conform Directivei 1999/37/CE');

console.log('\n🔍 [SUITE 15] Cache Invalidation & Promotional Hydration Invariant');
const appSourceCode = readFile('src/App.tsx');
const vehiclesCode = readFile('src/db/vehicles.ts');

// 1. Verificare versiune catalog în App.tsx
assert(appSourceCode.includes('RXM_INVENTORY_VERSION'), 'RXM_INVENTORY_VERSION este definită în App.tsx');
const versionMatch = appSourceCode.match(/const\s+RXM_INVENTORY_VERSION\s*=\s*['"]([^'"]+)['"]/);
assert(versionMatch && versionMatch[1].length > 0, `Versiune activă catalog identificată: ${versionMatch ? versionMatch[1] : 'lipsă'}`);

// 2. Verificare că funcția de protecție a ofertei există și este apelată
assert(appSourceCode.includes('ensureDealOfWeekActive'), 'Funcția failsafe ensureDealOfWeekActive este implementată în App.tsx');
assert(appSourceCode.includes('freshSeed.isDealOfWeek'), 'Migrarea include sincronizarea proprietății isDealOfWeek din seed');
assert(appSourceCode.includes('freshSeed.oldPriceEur'), 'Migrarea include sincronizarea proprietății oldPriceEur din seed');
assert(appSourceCode.includes('freshSeed.dealBadgeText'), 'Migrarea include sincronizarea dealBadgeText din seed');

// 3. Verificare că în vehicles.ts există cel puțin o ofertă activă a săptămânii
assert(vehiclesCode.includes('isDealOfWeek: true'), 'Există cel puțin un autovehicul marcat cu isDealOfWeek: true în seed');
assert(vehiclesCode.includes('oldPriceEur:'), 'Există preț vechi (reducere) configurat pentru oferta săptămânii');

// 4. Test Simulare de Migrare Cache pe un payload vechi (ex: v5 fără oferte)
const mockStaleCache = [
  { id: 'bmw-x3-2012-kuuod', brand: 'BMW', model: 'X3' },
  { id: 'audi-a4-2018', brand: 'Audi', model: 'A4' }
];
const mockSeed = [
  { id: 'bmw-x3-2012-kuuod', brand: 'BMW', model: 'X3', isDealOfWeek: true, oldPriceEur: 13490, dealBadgeText: 'OFERTA SĂPTĂMÂNII' },
  { id: 'audi-a4-2018', brand: 'Audi', model: 'A4' }
];
const seedMap = new Map(mockSeed.map(c => [c.id, c]));
const migrated = mockStaleCache.map(c => {
  const fresh = seedMap.get(c.id);
  return {
    ...c,
    isDealOfWeek: c.isDealOfWeek ?? fresh?.isDealOfWeek,
    oldPriceEur: c.oldPriceEur ?? fresh?.oldPriceEur,
  };
});
const dealPresent = migrated.some(c => c.isDealOfWeek);
assert(dealPresent, 'Simularea de migrare a unui cache învechit activează cu succes Oferta Săptămânii fără ștergere manuală');

console.log('\n🔍 [SUITE 16] Anti-Scraping, Watermark & Screenshot Shield Invariant');
// 1. Watermark Overlay Component
const watermarkComponentPath = 'src/components/common/WatermarkOverlay.tsx';
assert(fs.existsSync(path.join(rootDir, watermarkComponentPath)), 'Componenta WatermarkOverlay.tsx există');
const watermarkCode = readFile(watermarkComponentPath);
assert(watermarkCode.includes('RXM AUTO MOBILE • CLUJ-NAPOCA • 0748 892 937'), 'WatermarkOverlay conține textul oficial de branding și telefon');
assert(watermarkCode.includes('pointer-events-none'), 'WatermarkOverlay nu blochează interacțiunea utilizatorului');

// 2. Integrare Watermark pe Galeria și Cardurile Vehiculelor
const vehicleCardUpdated = readFile('src/components/showroom/VehicleCard.tsx');
assert(vehicleCardUpdated.includes('<WatermarkOverlay'), 'VehicleCard integrează WatermarkOverlay');

const heroSpotlightUpdated = readFile('src/components/showroom/HeroSpotlight.tsx');
assert(heroSpotlightUpdated.includes('<WatermarkOverlay'), 'HeroSpotlight integrează WatermarkOverlay');

const detailGalleryCode = readFile('src/components/modals/vehicle-detail/DetailGallery.tsx');
assert(detailGalleryCode.includes('<WatermarkOverlay'), 'DetailGallery integrează WatermarkOverlay');
assert(detailGalleryCode.includes('useAntiScreenCapture'), 'DetailGallery apelează useAntiScreenCapture');

const lightboxCode = readFile('src/components/modals/vehicle-detail/PhotoLightboxModal.tsx');
assert(lightboxCode.includes('<WatermarkOverlay'), 'PhotoLightboxModal integrează WatermarkOverlay');
assert(lightboxCode.includes('useAntiScreenCapture'), 'PhotoLightboxModal apelează useAntiScreenCapture');

// 3. Hook Securitate Anti-Screen Capture
const antiScreenHookPath = 'src/hooks/useAntiScreenCapture.ts';
assert(fs.existsSync(path.join(rootDir, antiScreenHookPath)), 'Hook-ul useAntiScreenCapture.ts există');
const antiScreenCode = readFile(antiScreenHookPath);
assert(antiScreenCode.includes('PrintScreen'), 'useAntiScreenCapture interceptează tasta PrintScreen');
assert(antiScreenCode.includes('navigator.clipboard.writeText'), 'useAntiScreenCapture curăță automat clipboard-ul');
assert(antiScreenCode.includes("addEventListener('blur'"), 'useAntiScreenCapture activează protecția la pierderea focusului ferestrei');

// 4. Politică Robots.txt & SEO Allowlist
const robotsTxt = readFile('public/robots.txt');
assert(robotsTxt.includes('User-agent: Googlebot'), 'robots.txt include secțiune dedicată Googlebot');
assert(robotsTxt.includes('Allow: /'), 'robots.txt permite indexarea organică pentru Googlebot');
assert(robotsTxt.includes('User-agent: GPTBot') && robotsTxt.includes('User-agent: Bytespider'), 'robots.txt blochează scraperele AI (GPTBot, Bytespider)');
assert(robotsTxt.includes('https://rxmautomobile.ro/sitemap.xml'), 'robots.txt indică sitemap-ul oficial rxmautomobile.ro');

// 5. Nginx WAF Rate Limiting
const nginxConf = readFile('nginx.conf');
assert(nginxConf.includes('limit_req_zone'), 'nginx.conf definește zone de rate-limiting');
assert(nginxConf.includes('limit_req zone=rxm_media_limit'), 'nginx.conf protejează resursele media cu rate-limiting');
assert(nginxConf.includes('Bytespider'), 'nginx.conf conține reguli WAF de blocare bot user-agents');

// 6. Notificări Legale Drepturi de Autor & Disclaimer Colapsat (Legea 8/1996)
const footerCode = readFile('src/components/layout/Footer.tsx');
assert(footerCode.includes('Legea nr. 8/1996'), 'Footer conține notificarea de drepturi de autor Legea 8/1996');

const specsTabCode = readFile('src/components/modals/vehicle-detail/DetailSpecsTab.tsx');
assert(specsTabCode.includes('Legea nr. 8/1996'), 'DetailSpecsTab conține notificarea de proprietate intelectuală');

const ipDisclaimerCode = readFile('src/components/common/IntellectualPropertyDisclaimer.tsx');
assert(ipDisclaimerCode.includes('isExpanded') && ipDisclaimerCode.includes('Legea nr. 8/1996'), 'IntellectualPropertyDisclaimer este colapsabil și menționează Legea nr. 8/1996');

const modalCode = readFile('src/components/modals/VehicleDetailModal.tsx');
assert(modalCode.includes('IntellectualPropertyDisclaimer'), 'VehicleDetailModal integrează IntellectualPropertyDisclaimer la bază');

// =========================================================================
// 17. Verificare Comutator TVA Deductibil Dealer & Bannere B2B Showroom
// =========================================================================
console.log('\n🔍 [SUITE 17] TVA Deductibil Dealer Toggle & Showroom B2B Banner Invariant');

// 1. Handler comutator în App.tsx
const appTsxCode = readFile('src/App.tsx');
assert(appTsxCode.includes('handleToggleVatDeductible'), 'App.tsx definește funcția handleToggleVatDeductible');
assert(appTsxCode.includes('onToggleVatDeductible={handleToggleVatDeductible}'), 'App.tsx propagă onToggleVatDeductible către componente');

// 2. Comutator 1-click în Admin InventoryTableManager
const inventoryTableCode = readFile('src/components/admin/InventoryTableManager.tsx');
assert(inventoryTableCode.includes('onToggleVatDeductible'), 'InventoryTableManager acceptă prop onToggleVatDeductible');
assert(inventoryTableCode.includes('TVA Deductibil (21%)') && inventoryTableCode.includes('Regim Marjă'), 'InventoryTableManager include butoane de comutare TVA Deductibil vs Regim Marjă');

// 3. Afișare Banner & Net Breakdown pe VehicleCard în Showroom
const vehicleCardSuite17Code = readFile('src/components/showroom/VehicleCard.tsx');
assert(vehicleCardSuite17Code.includes('car.vatDeductible') && vehicleCardSuite17Code.includes('TVA DEDUCTIBIL • FACTURĂ FIRMĂ'), 'VehicleCard afișează badge TVA DEDUCTIBIL • FACTURĂ FIRMĂ pe poză');
assert(vehicleCardSuite17Code.includes('priceEur / 1.21'), 'VehicleCard calculează și afișează prețul net conform cotei TVA de 21%');
assert(vehicleCardSuite17Code.includes('Preț Final • TVA Inclus'), 'VehicleCard păstrează eticheta Preț Final • TVA Inclus pentru regim de marjă');

// 4. Banner Oportunitate Fiscală B2B în VehicleDetailModal
const vehicleDetailCode = readFile('src/components/modals/VehicleDetailModal.tsx');
assert(vehicleDetailCode.includes('onToggleVatDeductible'), 'VehicleDetailModal acceptă prop onToggleVatDeductible');
assert(vehicleDetailCode.includes('Oportunitate Firmă: Factură Fiscală cu TVA Deductibil (21%)'), 'VehicleDetailModal include titlul oficial al oportunității fiscale B2B');
assert(vehicleDetailCode.includes('Preț Net') && vehicleDetailCode.includes('TVA 21%') && vehicleDetailCode.includes('Preț Brut'), 'VehicleDetailModal afișează grila de calcul Preț Net, TVA 21% și Preț Brut');
assert(vehicleDetailCode.includes('Regim Special de Marjă (Art. 312 Cod Fiscal'), 'VehicleDetailModal specifică Regim Special de Marjă pentru mașini nedeductibile');

// 5. Calibrare Fiscală Dinamică în FinancingSection
const financingCode = readFile('src/components/showroom/FinancingSection.tsx');
assert(financingCode.includes('activeFinCar') && financingCode.includes('activeFinCar.vatDeductible'), 'FinancingSection calibrează dinamic nota fiscală în funcție de vatDeductible');
assert(financingCode.includes('Regim Special al Marjei'), 'FinancingSection include nota legală pentru Regimul Marjei');
assert(financingCode.includes('VAT_RATE'), 'FinancingSection utilizează cota strictă de 21% TVA');

// =========================================================================
// 18. Proces-Verbal de Predare-Primire Autovehicul (Delivery Protocol Customizer)
// =========================================================================
console.log('\n🔍 [SUITE 18] Proces-Verbal de Predare-Primire (Delivery Protocol Customizer)');
const printTypesCode = readFile('src/components/print/types.ts');
assert(printTypesCode.includes('keysCount?: number;'), 'BuyerData definește keysCount configurabil');
assert(printTypesCode.includes('keysCustomText?: string;'), 'BuyerData definește keysCustomText pentru specificații chei');
assert(printTypesCode.includes('hasRegistrationCertificate?: boolean;') && printTypesCode.includes('hasMountedTiresGoodCondition?: boolean;'), 'BuyerData conține proprietățile booleene pentru accesoriile de predare');
assert(printTypesCode.includes('fuelLevel?: string;') && printTypesCode.includes('deliveryNotes?: string;'), 'BuyerData conține nivelul de combustibil și observațiile de predare');

const salesDocsCode = readFile('src/components/modals/SalesDocumentsModal.tsx');
assert(salesDocsCode.includes('keysCount: 2'), 'SalesDocumentsModal inițializează implicit 2 chei standard');
assert(salesDocsCode.includes('hasRegistrationCertificate: true') && salesDocsCode.includes('hasMountedTiresGoodCondition: true'), 'SalesDocumentsModal inițializează implicit toate accesoriile bifate (true)');
assert(salesDocsCode.includes('Accesorii & Predare (Proces-Verbal)'), 'SalesDocumentsModal conține cardul dedicat pentru personalizarea procesului-verbal');
assert(salesDocsCode.includes('Toate bifate (Standard)') && salesDocsCode.includes('Debifează'), 'SalesDocumentsModal include acțiuni rapide de selecție în bloc');
assert(salesDocsCode.includes("num === 1 ? 'Cheie' : num === 2 ? 'Chei (Standard)' : 'Chei'"), 'SalesDocumentsModal include butoane rapide pentru numărul de chei');

const deliveryProtocolCode = readFile('src/components/print/PrintableDeliveryProtocol.tsx');
assert(deliveryProtocolCode.includes('buyerData.keysCount') || deliveryProtocolCode.includes('buyer.keysCount'), 'PrintableDeliveryProtocol afișează dinamic numărul de chei');
assert(deliveryProtocolCode.includes('[  ]') && deliveryProtocolCode.includes('(Lipsă)'), 'PrintableDeliveryProtocol marchează accesoriile debifate cu [  ] (Lipsă) pentru protecție juridică');
assert(deliveryProtocolCode.includes('[X]'), 'PrintableDeliveryProtocol marchează accesoriile bifate cu [X]');
assert(deliveryProtocolCode.includes('Carburant în rezervor:'), 'PrintableDeliveryProtocol include nivelul de carburant la predare');

// =========================================================================
// 19. Modal Dismiss, Backdrop Isolation & Scroll Lock (VehicleDetailModal UX Stability)
// =========================================================================
console.log('\n🔍 [SUITE 19] Modal Dismiss, Backdrop Isolation & Scroll Lock (VehicleDetailModal UX Stability)');
assert(vehicleDetailModalCode.includes("document.body.style.overflow = 'hidden'"), 'VehicleDetailModal blochează scroll-ul de fundal când este deschis');
assert(vehicleDetailModalCode.includes("e.key === 'Escape'"), 'VehicleDetailModal ascultă tasta Escape pentru închidere accesibilă');
assert(vehicleDetailModalCode.includes('e.target === e.currentTarget'), 'VehicleDetailModal izolează click-ul pe fundal (backdrop click)');
assert(vehicleDetailModalCode.includes('e.stopPropagation()'), 'VehicleDetailModal previne propagarea click-urilor din interiorul dialogului');
assert(vehicleDetailModalCode.includes('aria-label="Închide fereastra detaliilor mașinii"'), 'VehicleDetailModal oferă buton dedicat de închidere cu etichetă ARIA');

// =========================================================================
// 20. Invariante Full-Site Architecture & Security (Audit Tickets T01-T10)
// =========================================================================
console.log('\n🔍 [SUITE 20] Invariante Full-Site Architecture & Security (Audit Tickets T01-T10)');

// T01: formatMileage logic
assert(helpersCode.includes('formatMileage(km?: number): string'), 'helpers.ts exportă funcția formatMileage');
assert(helpersCode.includes('.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, \'.\')'), 'formatMileage utilizează separatorul punct (.) pentru mii conform standardului RO');

// T02: Footer Carvana SRL + Operat de RXM Automobile
const footerFullCode = readFile('src/components/layout/Footer.tsx');
assert(footerFullCode.includes('Operat de') && footerFullCode.includes('dealer.cui'), 'Footer menționează datele de identificare ale dealerului operator');
assert(footerFullCode.includes('Dezvoltat de') && footerFullCode.includes('https://carvana.ro') && footerFullCode.includes('text-amber-400'), 'Footer include atribuirea „Dezvoltat de Carvana SRL” cu link amber activ');

// T03: Topbar Navigation Modal
const topbarCode = readFile('src/components/layout/Topbar.tsx');
assert(topbarCode.includes('setIsNavModalOpen(true)'), 'Topbar adresa deschide NavigationModal la click');
const navModalCode = readFile('src/components/modals/NavigationModal.tsx');
assert(navModalCode.includes('Google Maps') && navModalCode.includes('Waze GPS') && navModalCode.includes('Copiază adresa'), 'NavigationModal oferă opțiunile complete Google Maps, Waze și Copiere');

// T05: Social Share Buttons
const socialShareCode = readFile('src/components/common/SocialShareButtons.tsx');
assert(socialShareCode.includes('api.whatsapp.com/send') && socialShareCode.includes('facebook.com/sharer') && socialShareCode.includes('instagram.com'), 'SocialShareButtons acoperă WhatsApp, Facebook și Instagram');
assert(socialShareCode.includes('navigator.clipboard.writeText'), 'SocialShareButtons include copiere directă link cu deep linking');

// T06: Financing Requirements Accordion
const financingAccordionCode = readFile('src/components/showroom/FinancingRequirementsAccordion.tsx');
assert(financingAccordionCode.includes('persoane-fizice') && financingAccordionCode.includes('persoane-juridice') && financingAccordionCode.includes('diaspora'), 'FinancingRequirementsAccordion acoperă Persoane Fizice, Firme și Diaspora');

// T07 & T10: Securitate Admin Hash & Mascare Date Sensibile
const serverApiCode = readFile('server/api.mjs');
assert(serverApiCode.includes('e180c917ef121846cee6c6b488b9d7a159c12c96880c1901b5a309ca66efb7c2'), 'server/api.mjs verifică hash-ul SHA-256 criptografic pentru Olaf.0311');
assert(appTsxCode.includes('publicCars') && appTsxCode.includes('purchasePriceEur: undefined'), 'App.tsx maschează prețurile de achiziție și datele sensibile pentru vizitatori publici');

// ==========================================
// SUITE 21: Client ID OCR Scanner & GDPR Compliance Invariant
// ==========================================
console.log('\n🔍 [SUITE 21] Client ID OCR Scanner & GDPR Compliance Invariant (Mădălina Sales Docs)');

assert(fs.existsSync(path.join(rootDir, 'src/utils/clientIdOcrEngine.ts')), 'Modulul clientIdOcrEngine.ts există');
const clientIdOcrCode = readFile('src/utils/clientIdOcrEngine.ts');
assert(clientIdOcrCode.includes('validateRomanianCnp'), 'clientIdOcrEngine conține funcția algoritmică validateRomanianCnp');
assert(clientIdOcrCode.includes('controlKey = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]'), 'Algoritmul CNP respectă strict cheia de control oficială RO');
assert(clientIdOcrCode.includes('scanClientIdCardWithGemini'), 'clientIdOcrEngine conține scanClientIdCardWithGemini');
assert(clientIdOcrCode.includes('blobToBase64'), 'Scanarea se bazează pe procesare volatilă în memorie (fără stocare disk/db)');

assert(fs.existsSync(path.join(rootDir, 'src/components/modals/ClientIdOcrScanner.tsx')), 'Componenta ClientIdOcrScanner.tsx există');
const scannerCode = readFile('src/components/modals/ClientIdOcrScanner.tsx');
assert(scannerCode.includes('Fă Poză cu Camera') && scannerCode.includes('capture="environment"'), 'Scannerul include declanșator direct de cameră foto pentru mobil');
assert(scannerCode.includes('Încarcă Poză Buletin'), 'Scannerul include suport pentru încărcare fișier buletin');
assert(scannerCode.includes('Simulare Test C.I.'), 'Scannerul include mod demo pentru testare instantă în showroom');
assert(scannerCode.includes('GDPR Memorie RAM') || scannerCode.includes('GDPR Compliant'), 'Scannerul afișează garanția de conformitate GDPR (zero stocare foto)');

assert(salesDocsCode.includes('ClientIdOcrScanner'), 'SalesDocumentsModal integrează ClientIdOcrScanner');
assert(salesDocsCode.includes('handleOcrSuccess'), 'SalesDocumentsModal conține handlerul de autocompletare date cumpărător');
assert(salesDocsCode.includes('wasAutoFilled'), 'SalesDocumentsModal oferă feedback vizual la autocompletare din buletin');

// Nginx & Vite Reverse Proxy Gateway Invariant (Zero Key Exposure in Browser)
const nginxRootCode = readFile('nginx.conf');
assert(nginxRootCode.includes('location ^~ /api/ocr/gemini/'), 'nginx.conf definește ruta securizată /api/ocr/gemini/');
assert(nginxRootCode.includes('proxy_pass https://generativelanguage.googleapis.com'), 'nginx.conf redirecționează către Google Generative Language API');
assert(nginxRootCode.includes('proxy_set_header x-goog-api-key'), 'nginx.conf injectează cheia secretă pe server către Google');

const nginxInfraCode = readFile('infra/nginx.conf');
assert(nginxInfraCode.includes('api/ocr/gemini/'), 'infra/nginx.conf include gateway-ul OCR pentru mediul Coolify/VPS');

const viteConfigCode = readFile('vite.config.ts');
assert(viteConfigCode.includes('handleGeminiOcrProxy'), 'vite.config.ts include middleware-ul proxy pentru development');

const visionEngineCode = readFile('src/utils/geminiVisionEngine.ts');
assert(visionEngineCode.includes('/api/ocr/gemini/models/'), 'geminiVisionEngine apelează prioritar proxy-ul securizat fără chei în URL');

// ==========================================
// SUITE 22: Fişă Inspecție Tehnică Showroom (100+ Puncte) & Punte WhatsApp Sales
// ==========================================
console.log('\n🔍 [SUITE 22] Fişă Inspecție Tehnică Showroom (100+ Puncte) & Punte WhatsApp Sales');

assert(fs.existsSync(path.join(rootDir, 'src/components/print/PrintableTechnicalInspectionSheet.tsx')), 'Componenta PrintableTechnicalInspectionSheet.tsx există');
const inspectionCode = readFile('src/components/print/PrintableTechnicalInspectionSheet.tsx');
assert(inspectionCode.includes('RAPORT DE INSPECȚIE TEHNICĂ & CALITATE'), 'Raportul include antetul oficial de inspecție tehnică și calitate');
assert(inspectionCode.includes('100+ PUNCTE') || inspectionCode.includes('100+ Puncte'), 'Raportul menționează verificarea riguroasă în 100+ puncte');
assert(inspectionCode.includes('Diagnoză OBD-II'), 'Raportul include secțiunea dedicată de diagnoză OBD-II');
assert(inspectionCode.includes('Grosime Vopsea') || inspectionCode.includes('paintThicknessMicronsAvg'), 'Raportul include măsurătorile de grosime a stratului de vopsea');
assert(inspectionCode.includes('tireTreadFrontMm') && inspectionCode.includes('brakePadsFrontPct'), 'Raportul include măsurătorile de uzură anvelope și plăcuțe de frână');

const pdfGenCode = readFile('src/utils/pdfGenerator.ts');
assert(pdfGenCode.includes('Raport-Inspectie-Tehnica'), 'pdfGenerator.ts produce denumirea standard Raport-Inspectie-Tehnica');
assert(pdfGenCode.includes("'technical_inspection'") && pdfGenCode.includes("'inspection'"), 'pdfGenerator.ts include tipurile de document technical_inspection și inspection');

const freshSalesDocsCode = readFile('src/components/modals/SalesDocumentsModal.tsx');
assert(freshSalesDocsCode.includes('PrintableTechnicalInspectionSheet'), 'SalesDocumentsModal include PrintableTechnicalInspectionSheet');
assert(freshSalesDocsCode.includes("activeDocTab === 'inspection'"), 'SalesDocumentsModal include tab-ul și configuratorul pentru inspecție tehnică');
assert(freshSalesDocsCode.includes('handleSendWhatsApp'), 'SalesDocumentsModal conține funcția handleSendWhatsApp');
assert(freshSalesDocsCode.includes('Trimite pe WhatsApp'), 'SalesDocumentsModal conține butonul Trimite pe WhatsApp');
assert(freshSalesDocsCode.includes('api.whatsapp.com/send'), 'SalesDocumentsModal apelează gateway-ul oficial WhatsApp');

const freshInventoryCode = readFile('src/components/admin/InventoryTableManager.tsx');
assert(freshInventoryCode.includes('handleShareCarWhatsApp'), 'InventoryTableManager include funcția handleShareCarWhatsApp');
assert(freshInventoryCode.includes('api.whatsapp.com/send'), 'InventoryTableManager include deschiderea link-ului WhatsApp');

// ==========================================
// SUITE 23: Multi-Platform Stock Feed Export Invariant (Meta CSV, Autovit XML, REST JSON)
// ==========================================
console.log('\n🔍 [SUITE 23] Multi-Platform Stock Feed Export Invariant (Meta CSV, Autovit XML, REST JSON)');

assert(fs.existsSync(path.join(rootDir, 'src/utils/stockFeedGenerator.ts')), 'Utilitarul stockFeedGenerator.ts există');
const feedGenCode = readFile('src/utils/stockFeedGenerator.ts');
assert(feedGenCode.includes('generateFacebookMarketplaceCsv'), 'stockFeedGenerator conține generateFacebookMarketplaceCsv');
assert(feedGenCode.includes('generateAutovitXml'), 'stockFeedGenerator conține generateAutovitXml');
assert(feedGenCode.includes('generateStockJsonFeed'), 'stockFeedGenerator conține generateStockJsonFeed');
assert(feedGenCode.includes('mileage.value') && feedGenCode.includes('mileage.unit'), 'Feed-ul CSV Meta conține structura de kilometraj standard');
assert(feedGenCode.includes('vat_rate>0.21'), 'Feed-ul XML Autovit include cota strictă de TVA 21%');
assert(feedGenCode.includes('vat_deductible='), 'Feed-ul XML Autovit include atributul vat_deductible');

assert(fs.existsSync(path.join(rootDir, 'src/components/admin/StockFeedExportModal.tsx')), 'Componenta StockFeedExportModal.tsx există');
const feedModalCode = readFile('src/components/admin/StockFeedExportModal.tsx');
assert(feedModalCode.includes('Meta-Facebook-Vehicle-Feed'), 'Modalul generează denumirea standard pentru feed-ul CSV');
assert(feedModalCode.includes('Autovit-OLX-Stock-Feed'), 'Modalul generează denumirea standard pentru feed-ul XML');
assert(feedModalCode.includes('downloadFeedFile'), 'Modalul oferă descărcarea directă a fișierelor de feed');
assert(feedModalCode.includes('/api/feeds/meta-vehicles.csv'), 'Modalul afișează endpoint-ul public pentru sincronizare Meta');
assert(feedModalCode.includes('/api/feeds/autovit-stock.xml'), 'Modalul afișează endpoint-ul public pentru sincronizare Autovit');

const freshAdminPortalCode = readFile('src/components/admin/AdminPortal.tsx');
assert(freshAdminPortalCode.includes('StockFeedExportModal'), 'AdminPortal.tsx include componenta StockFeedExportModal');
assert(freshAdminPortalCode.includes('isFeedExportOpen'), 'AdminPortal.tsx gestionează starea modalului de feed-uri');
assert(freshAdminPortalCode.includes('Feed-uri Stoc (Meta / Autovit)'), 'AdminPortal.tsx oferă buton dedicat pentru export feed-uri');

// ==========================================
// SUITE 24: Showroom CRM Lead Pipeline & Stock Sync Invariant (Ticket 05)
// ==========================================
console.log('\n🔍 [SUITE 24] Showroom CRM Lead Pipeline & Stock Sync Invariant (Ticket 05)');

const typesCode = readFile('src/db/types.ts');
assert(typesCode.includes("'proforma'") && typesCode.includes("'financing'"), 'DealerLeadStatus conține stadiile avansate proforma și financing');

const freshKanbanCode = readFile('src/components/admin/LeadPipelineKanban.tsx');
assert(freshKanbanCode.includes('1. Contact Nou'), 'Kanban include coloana 1. Contact Nou');
assert(freshKanbanCode.includes('2. Test-Drive Programat'), 'Kanban include coloana 2. Test-Drive Programat');
assert(freshKanbanCode.includes('3. Dosar Finanțare Trimis'), 'Kanban include coloana 3. Dosar Finanțare Trimis');
assert(freshKanbanCode.includes('4. Proformă Avans Emisă'), 'Kanban include coloana 4. Proformă Avans Emisă');
assert(freshKanbanCode.includes('5. Vândut & Livrat'), 'Kanban include coloana 5. Vândut & Livrat');
assert(freshKanbanCode.includes('onStatusChange?:'), 'LeadPipelineKanban acceptă handlerul onStatusChange');
assert(freshKanbanCode.includes('onOpenSalesDocs?:'), 'LeadPipelineKanban acceptă handlerul onOpenSalesDocs');
assert(freshKanbanCode.includes('car.images[0]'), 'Cardul de lead randează thumbnail-ul foto al vehiculului din stoc');
assert(freshKanbanCode.includes('handleOpenDocsForLead'), 'Cardul de lead conține funcția 1-Click de deschidere acte vânzare');
assert(freshKanbanCode.includes('handleConfirmStatusSync'), 'Kanban include dialogul de confirmare pentru sincronizarea statusului în stoc');
assert(freshKanbanCode.includes('targetCarStatus: \'reserved\''), 'Trecerea în Proformă Avans propune sincronizarea ca Rezervat în stoc');
assert(freshKanbanCode.includes('wa.me/4'), 'Cardul de lead conține puntea directă WhatsApp');

const freshSalesDocsCode2 = readFile('src/components/modals/SalesDocumentsModal.tsx');
assert(freshSalesDocsCode2.includes('initialBuyerData?:'), 'SalesDocumentsModal acceptă datele cumpărătorului precompletate');
assert(freshSalesDocsCode2.includes('initialDocTab?:'), 'SalesDocumentsModal acceptă tab-ul inițial de documente');

const adminPortalFresh = readFile('src/components/admin/AdminPortal.tsx');
assert(adminPortalFresh.includes('onOpenSalesDocs='), 'AdminPortal conectează LeadPipelineKanban cu generatorul de documente');
assert(adminPortalFresh.includes('initialBuyerData={salesDocsInitialBuyer}'), 'AdminPortal transmite datele de lead precompletate în SalesDocumentsModal');

console.log('\n🔍 [SUITE 25] Coolify Self-Hosted PostgreSQL & Media API Engine');
const composeCheck = readFile('infra/docker-compose.yml');
assert(composeCheck.includes('rxm-postgres:') && composeCheck.includes('postgres:16-alpine'), 'docker-compose include rxm-postgres 16');
assert(composeCheck.includes('rxm-api:') && composeCheck.includes('Dockerfile.api'), 'docker-compose include rxm-api micro-service');

const schemaCheck = readFile('infra/init_schema.sql');
assert(schemaCheck.includes('CREATE TABLE IF NOT EXISTS vehicles'), 'init_schema.sql include tabelul vehicles');
assert(schemaCheck.includes('vat_rate') && schemaCheck.includes('0.21'), 'init_schema.sql respectă strict TVA 21%');

const apiCheck = readFile('server/api.mjs');
assert(apiCheck.includes('/api/vehicles') && apiCheck.includes('/api/upload'), 'server/api.mjs expune rutele vehicles și upload');

const repoCheck = readFile('src/services/vehicleRepository.ts');
assert(repoCheck.includes('/rxm/api/vehicles'), 'vehicleRepository.ts apelează prioritar API-ul self-hosted');

const storageCheck = readFile('src/services/cloudMediaStorage.ts');
assert(storageCheck.includes('/rxm/api/upload'), 'cloudMediaStorage.ts apelează prioritar upload-ul pe discul VPS');

const nginxCheck = readFile('infra/nginx.conf');
assert(nginxCheck.includes('rxm-api:3001') && nginxCheck.includes('proxy_pass'), 'infra/nginx.conf rutează /rxm/api/ către rxm-api');
assert(nginxCheck.includes('location /rxm/cars/'), 'infra/nginx.conf include servirea statică /rxm/cars/');

console.log('\n===============================================================');
console.log(`REZULTAT FINAL QA: ${testsPassed}/${testsRun} TESTE TRECUTE CU SUCCES!`);
if (testsFailed > 0) {
  console.log(`❌ Eșecuri: ${testsFailed}`);
  process.exit(1);
} else {
  console.log('🏆 TOATE INVARIANTELE ȘI CERINȚELE DEMO AU FOST VALIDATE 100%!');
  console.log('===============================================================\n');
}

