/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🛡️ QA SUITE: TENANT BRAND & THEME ISOLATION VERIFIER (ANTI-LEAK SAFEGUARD)
 * Verifică izolarea 100% a brandului pentru chiriași B2B (MPI Auto, Top Auto etc.)
 * Asigură că tema luminoasă (clean_white / Light Modern) este complet funcțională
 * și că NICIUN reziduu sau string hardcodat RXM nu scapă în showroom-ul altui tenant.
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
console.log('🏢 PARCOS MULTI-TENANT BRAND & THEME ISOLATION SUITE');
console.log('Target: MPI Auto & Clean White Theme Verification');
console.log('===============================================================\n');

// ─── 1. Verificare Configurație Tenant MPI AUTO ──────────────────────────────
console.log('🔍 [SUITE 1] Profil & Identitate MPI AUTO (DEALER_MPI_AUTO)');
const dealerTs = readFile('src/db/dealer.ts');

assert(dealerTs.includes('slug: "mpi_auto"'), 'Slug-ul MPI este corect configurat ca "mpi_auto"');
assert(dealerTs.includes('themePreset: "clean_white"'), 'Tema presetată MPI este "clean_white"');
assert(dealerTs.includes('logoUrl: "/images/mpi-logo.png"') || dealerTs.includes('logoUrl: "/images/mpi-logo.svg"'), 'Logo-ul dedicat MPI este configurat în profil');
assert(fs.existsSync(path.join(rootDir, 'public/images/mpi-logo.png')), 'Fișierul public/images/mpi-logo.png există pe disc');
assert(fs.existsSync(path.join(rootDir, 'public/images/mpi-logo.svg')), 'Fișierul public/images/mpi-logo.svg există pe disc');

// ─── 2. Verificare Temă Luminoasă (Clean White Light Modern) ─────────────────
console.log('\n🔍 [SUITE 2] Integritate Temă Luminoasă Clean White');
const themePresetsTs = readFile('src/utils/themePresets.ts');

assert(themePresetsTs.includes('id: \'clean_white\''), 'Presetul clean_white există în THEME_PRESETS');
assert(themePresetsTs.includes('isLightMode: true'), 'clean_white are isLightMode: true');
assert(themePresetsTs.includes('previewBg: \'#f8fafc\''), 'clean_white folosește fundal luminos #f8fafc');
assert(themePresetsTs.includes('previewCard: \'#ffffff\''), 'clean_white folosește carduri albe #ffffff');

const indexCss = readFile('src/index.css');
assert(indexCss.includes('[data-theme="clean_white"]'), 'Regula [data-theme="clean_white"] este definită în index.css');
assert(indexCss.includes('color-scheme: light;'), 'clean_white definește color-scheme: light');
assert(indexCss.includes('background-color: #f8fafc !important;'), 'clean_white suprascrie fundalul general la #f8fafc');
assert(indexCss.includes('background-color: #ffffff !important;'), 'clean_white suprascrie cardurile la #ffffff');
assert(indexCss.includes('color: #0f172a !important;'), 'clean_white asigură text închis la culoare cu contrast ridicat');

const tenantContextTs = readFile('src/context/TenantContext.tsx');
assert(tenantContextTs.includes('data-theme-mode'), 'TenantContext setează atributul data-theme-mode');
assert(tenantContextTs.includes('light-theme'), 'TenantContext adaugă clasa light-theme la activarea temei luminoase');

// ─── 3. Verificare Scanare Anti-Leak RXM în Componente Showroom ──────────────
console.log('\n🔍 [SUITE 3] Absența Stringurilor Hardcodate RXM în Showroom');

const buyBackTs = readFile('src/components/showroom/BuyBackSection.tsx');
assert(!buyBackTs.includes('stocul RXM'), 'BuyBackSection nu conține "stocul RXM"');
assert(!buyBackTs.includes('RXM Automobile Cluj'), 'BuyBackSection nu conține "RXM Automobile Cluj"');
assert(!buyBackTs.includes('consilierii RXM'), 'BuyBackSection nu conține "consilierii RXM"');
assert(!buyBackTs.includes('Specialiștii RXM'), 'BuyBackSection nu conține "Specialiștii RXM"');

const customOrderTs = readFile('src/components/showroom/CustomOrderSection.tsx');
assert(!customOrderTs.includes('RXM Automobile Cluj'), 'CustomOrderSection nu conține "RXM Automobile Cluj"');
assert(!customOrderTs.includes('Echipa <strong>RXM Automobile</strong>'), 'CustomOrderSection nu conține "Echipa RXM Automobile"');

const financingSectionTs = readFile('src/components/showroom/FinancingSection.tsx');
assert(!financingSectionTs.includes('stocul RXM'), 'FinancingSection nu conține "stocul RXM"');
assert(!financingSectionTs.includes('la%20RXM%20Automobile'), 'FinancingSection nu conține link WhatsApp cu "RXM Automobile"');

const financingAccordionTs = readFile('src/components/showroom/FinancingRequirementsAccordion.tsx');
assert(!financingAccordionTs.includes('La RXM Automobile acceptăm'), 'FinancingRequirementsAccordion nu conține "La RXM Automobile acceptăm"');
assert(!financingAccordionTs.includes('la%20RXM%20Automobile'), 'FinancingRequirementsAccordion nu conține WhatsApp cu "RXM Automobile"');

const heroSpotlightTs = readFile('src/components/showroom/HeroSpotlight.tsx');
assert(!heroSpotlightTs.includes('RXM Video Lounge'), 'HeroSpotlight nu conține hardcodat "RXM Video Lounge"');
assert(!heroSpotlightTs.includes('TikTok RXM Automobile'), 'HeroSpotlight nu conține hardcodat "TikTok RXM Automobile"');

const whyChooseUsTs = readFile('src/components/showroom/WhyChooseUs.tsx');
assert(whyChooseUsTs.includes('dealer?: DealerProfile'), 'WhyChooseUs acceptă prop dealer');

const googleReviewsTs = readFile('src/components/showroom/GoogleReviewsSection.tsx');
assert(googleReviewsTs.includes('dealer?: DealerProfile'), 'GoogleReviewsSection acceptă prop dealer');
assert(!googleReviewsTs.includes('comunitatea RXM!'), 'GoogleReviewsSection nu conține "comunitatea RXM!"');

// ─── 4. Verificare Modale & Generatoare Copie ─────────────────────────────────
console.log('\n🔍 [SUITE 4] Absența Scurgerilor de Brand în Modale & Copie Socială');

const navModalTs = readFile('src/components/modals/NavigationModal.tsx');
assert(!navModalTs.includes('Showroom RXM Automobile'), 'NavigationModal nu conține hardcodat "Showroom RXM Automobile"');

const vehicleDetailModalTs = readFile('src/components/modals/VehicleDetailModal.tsx');
assert(!vehicleDetailModalTs.includes('showroom-ului RXM Automobile în momentul tranzacției'), 'VehicleDetailModal nu conține showroom RXM în disclaimer');
assert(!vehicleDetailModalTs.includes('Am văzut pe rxmautomobile.ro că'), 'VehicleDetailModal nu conține rxmautomobile.ro în WhatsApp inquiry');

const testDriveTabTs = readFile('src/components/modals/vehicle-detail/DetailTestDriveTab.tsx');
assert(!testDriveTabTs.includes('Consilierul RXM Automobile'), 'DetailTestDriveTab nu conține "Consilierul RXM Automobile"');

const videoTabTs = readFile('src/components/modals/vehicle-detail/DetailVideoTab.tsx');
assert(!videoTabTs.includes('Echipa RXM Automobile filmează'), 'DetailVideoTab nu conține "Echipa RXM Automobile filmează"');

const socialPostModalTs = readFile('src/components/modals/VehicleSocialPostModal.tsx');
assert(!socialPostModalTs.includes('• RXM Automobile`'), 'VehicleSocialPostModal nu are titlu hardcodat RXM Automobile');

const footerTs = readFile('src/components/layout/Footer.tsx');
assert(!footerTs.includes('Facebook RXM Automobile"'), 'Footer nu are aria-label hardcodat Facebook RXM Automobile');
assert(!footerTs.includes('Instagram RXM Automobile"'), 'Footer nu are aria-label hardcodat Instagram RXM Automobile');

const socialCopyTs = readFile('src/utils/socialCopyGenerator.ts');
assert(!socialCopyTs.includes('#RXMAutomobile'), 'socialCopyGenerator nu conține hashtag hardcodat #RXMAutomobile');

const vehicleDescTs = readFile('src/utils/vehicleDescriptionGenerator.ts');
assert(!vehicleDescTs.includes('în showroom-ul RXM Automobile'), 'vehicleDescriptionGenerator nu conține "în showroom-ul RXM Automobile"');
assert(!vehicleDescTs.includes('Servicii & Siguranță Incluse RXM:'), 'vehicleDescriptionGenerator nu conține "Servicii & Siguranță Incluse RXM:"');

const navbarTs = readFile('src/components/layout/Navbar.tsx');
assert(!navbarTs.includes('@rxm.automobile'), 'Navbar nu conține cont TikTok hardcodat @rxm.automobile');
assert(!navbarTs.includes('TikTok RXM Automobile'), 'Navbar nu conține aria-label hardcodat TikTok RXM Automobile');
assert(!navbarTs.includes('Contactează RXM Automobile'), 'Navbar nu conține aria-label hardcodat Contactează RXM Automobile');
assert(!navbarTs.includes('stocul RXM Automobile'), 'Navbar nu conține WhatsApp hardcodat cu stocul RXM Automobile');

const tenantCtxTs = readFile('src/context/TenantContext.tsx');
assert(tenantCtxTs.includes('subDealer = getSubdomainDealer'), 'TenantContext acordă prioritate subdomeniului în URL resolve');

// ─── 5. Verificare Clauză Proprietate Intelectuală & Drepturi de Autor ────────
console.log('\n🔍 [SUITE 5] Izolare Clauză Proprietate Intelectuală (Legea nr. 8/1996)');

const ipDisclaimerTs = readFile('src/components/common/IntellectualPropertyDisclaimer.tsx');
assert(!ipDisclaimerTs.includes('Proprietate Intelectuală RXM AUTO MOBILE SRL:'), 'IntellectualPropertyDisclaimer nu are titlu hardcodat RXM AUTO MOBILE SRL');
assert(!ipDisclaimerTs.includes('aparțin exclusiv RXM AUTO MOBILE SRL'), 'IntellectualPropertyDisclaimer nu are descriere hardcodată RXM AUTO MOBILE SRL');
assert(!ipDisclaimerTs.includes('Parteneriat Media RXM Automobile'), 'IntellectualPropertyDisclaimer nu are subiect email hardcodat RXM Automobile');
assert(ipDisclaimerTs.includes('getIntellectualPropertyNotice'), 'IntellectualPropertyDisclaimer exportă getIntellectualPropertyNotice');
assert(ipDisclaimerTs.includes('Proprietate Intelectuală {dealerName}:'), 'IntellectualPropertyDisclaimer afișează dinamic dealerName în titlu');

const antiCaptureTs = readFile('src/hooks/useAntiScreenCapture.ts');
assert(antiCaptureTs.includes('dealerName?: string'), 'useAntiScreenCapture acceptă dealerName opțional');
assert(antiCaptureTs.includes('getCopyrightLegalNotice'), 'useAntiScreenCapture exportă getCopyrightLegalNotice');

assert(vehicleDetailModalTs.includes('dealerName: dealer?.name'), 'VehicleDetailModal transmite dealer?.name către useAntiScreenCapture');
assert(vehicleDetailModalTs.includes('<IntellectualPropertyDisclaimer dealer={dealer} />'), 'VehicleDetailModal transmite dealer către IntellectualPropertyDisclaimer');
assert(footerTs.includes('<IntellectualPropertyDisclaimer dealer={dealer} />'), 'Footer transmite dealer către IntellectualPropertyDisclaimer');

// ─── 6. Verificare Audit Profund (Social Share, Delivery FAQ, Print & Calendar) ─
console.log('\n🔍 [SUITE 6] Audit Profund Eliminare Reziduuri RXM (Share, Delivery, Doc Print)');

const socialShareTs = readFile('src/components/common/SocialShareButtons.tsx');
assert(!socialShareTs.includes('• RXM Automobile Cluj'), 'SocialShareButtons nu are shareTitle hardcodat RXM');
assert(!socialShareTs.includes('la RXM Automobile Cluj-Napoca'), 'SocialShareButtons nu are shareText hardcodat RXM');
assert(!socialShareTs.includes(`https://rxmautomobile.ro/#catalog?car=`), 'SocialShareButtons nu forțează domeniul rxmautomobile.ro');
assert(socialShareTs.includes('dealer?: DealerProfile'), 'SocialShareButtons acceptă prop dealer');
assert(vehicleDetailModalTs.includes('<SocialShareButtons car={selectedCar} dealer={dealer}'), 'VehicleDetailModal transmite dealer={dealer} către SocialShareButtons');

const deliveryTs = readFile('src/components/delivery/NationalDeliveryPage.tsx');
assert(!deliveryTs.includes('emisă de RXM AUTO MOBILE'), 'NationalDeliveryPage FAQ nu conține garanție emisă de RXM AUTO MOBILE');
assert(!deliveryTs.includes('/rxm/images/rxm-emblem.png'), 'NationalDeliveryPage nu are thumbnail hardcodat cu emblemă RXM');
assert(deliveryTs.includes('getDeliveryFaqs'), 'NationalDeliveryPage utilizează generator dinamic de FAQ per dealer');

const socialCopyGenTs = readFile('src/utils/socialCopyGenerator.ts');
assert(!socialCopyGenTs.includes("'rxmautomobile',"), 'socialCopyGenerator nu conține hashtag hardcodat rxmautomobile');
assert(!socialCopyGenTs.includes("'contact@rxmautomobile.ro'"), 'socialCopyGenerator nu conține email fallback fix de RXM');

const helpersFullTs = readFile('src/utils/helpers.ts');
assert(!helpersFullTs.includes('Test Drive RXM:'), 'helpers.ts nu are titlu hardcodat Test Drive RXM în linkurile de calendar');
assert(!helpersFullTs.includes('@rxmautomobile.ro'), 'helpers.ts nu are UID fix de rxmautomobile.ro în generarea .ics');
assert(helpersFullTs.includes("car.dealerSlug === 'mpi_auto' ? 'MPI'"), 'helpers.ts getStockNumber generează prefixul MPI pentru mpi_auto');

const gdprPrintTs = readFile('src/components/print/PrintableGdprConsent.tsx');
assert(!gdprPrintTs.includes('src="/images/rxm-logo.png"'), 'PrintableGdprConsent nu forțează logo-ul RXM pe antet');
assert(!gdprPrintTs.includes('RXM Automobile &bull; Conform'), 'PrintableGdprConsent nu conține RXM în subsolul de conformitate');

const warrantyPrintTs = readFile('src/components/print/PrintableWarrantyCertificate.tsx');
assert(!warrantyPrintTs.includes('src="/images/rxm-logo.png"'), 'PrintableWarrantyCertificate nu forțează logo-ul RXM');
assert(!warrantyPrintTs.includes('SERIE: RXM-GAR-'), 'PrintableWarrantyCertificate generează seria dinamic per dealerPrefix');

// ─── 7. Verificare Audit Gestiune Stoc, Admin & Salvare Multi-Tenant ─────────
console.log('\n🔍 [SUITE 7] Audit Gestiune Stoc, Admin & Persistență Multi-Tenant');

const appTs = readFile('src/App.tsx');
assert(appTs.includes('vehicleRepository.saveVehicle(updatedCar, currentDealerSlug)'), 'App.tsx persistă vehiculul folosind currentDealerSlug');
assert(appTs.includes('vehicleRepository.deleteVehicle(id, currentDealerSlug)'), 'App.tsx șterge vehiculul folosind currentDealerSlug');
assert(appTs.includes('dealer={tenant}'), 'App.tsx transmite dealer={tenant} către AddVehicleModal');

const addVehicleTs = readFile('src/components/admin/AddVehicleModal.tsx');
assert(addVehicleTs.includes('dealer?: DealerProfile | null'), 'AddVehicleModal acceptă prop dealer');
assert(addVehicleTs.includes("dealerSlug === 'mpi_auto' ? 'MPI'"), 'AddVehicleModal deduce dealerPrefix MPI pentru mpi_auto');
assert(!addVehicleTs.includes("saveVehicle(created, 'rxm')"), 'AddVehicleModal nu hardcodează salvarea pe tenant rxm (quick save)');
assert(!addVehicleTs.includes("saveVehicle(savedCar, 'rxm')"), 'AddVehicleModal nu hardcodează salvarea pe tenant rxm (publish)');
assert(!addVehicleTs.includes("uploadCarImagesBatch(\n          carDraftId,\n          newImages,\n          'rxm'"), 'AddVehicleModal nu uploadează poze cu tenant fix rxm');

const adminPortalTs = readFile('src/components/admin/AdminPortal.tsx');
assert(adminPortalTs.includes('dealer={activeDealer}'), 'AdminPortal transmite dealer={activeDealer} către InventoryTableManager');
assert(!adminPortalTs.includes('pentru RXM Auto Mobile de Carvana S.R.L.'), 'AdminPortal nu conține text hardcodat pentru RXM Auto Mobile');

const invTableTs = readFile('src/components/admin/InventoryTableManager.tsx');
assert(invTableTs.includes('dealer?: DealerProfile | null'), 'InventoryTableManager acceptă prop dealer');
assert(invTableTs.includes('saveVehicle(carWithCdnImages, effectiveDealerSlug)'), 'InventoryTableManager salvează în baza de date a tenantului activ');

const salesDocsTs = readFile('src/components/modals/SalesDocumentsModal.tsx');
assert(!salesDocsTs.includes("stockNumber: 'RXM-MANUAL'"), 'SalesDocumentsModal nu hardcodează RXM-MANUAL');
assert(salesDocsTs.includes("dealerPrefix = dealer?.slug === 'mpi_auto' ? 'MPI'"), 'SalesDocumentsModal calculează prefixul MPI');

const buyerDataTs = readFile('src/components/modals/sales-docs/BuyerDataSidebarSection.tsx');
assert(!buyerDataTs.includes('<span>Factură & Garanție RXM</span>'), 'BuyerDataSidebarSection nu are antet hardcodat RXM');
assert(buyerDataTs.includes('dealer?.name ? dealer.name.split'), 'BuyerDataSidebarSection afișează dinamic numele dealerului');

const vehicleDataTs = readFile('src/components/modals/sales-docs/VehicleDataSidebarSection.tsx');
assert(!vehicleDataTs.includes('invoiceNumber: `RXM-FT-'), 'VehicleDataSidebarSection nu hardcodează RXM-FT-');
assert(!vehicleDataTs.includes('placeholder="CJ 01 RXM"'), 'VehicleDataSidebarSection nu are placeholder fix CJ 01 RXM');

const accessoriesTs = readFile('src/components/modals/sales-docs/AccessoriesSidebarSection.tsx');
assert(!accessoriesTs.includes('(Standard RXM)'), 'AccessoriesSidebarSection nu conține Standard RXM');

const dealPriceTs = readFile('src/components/admin/DealPriceModal.tsx');
assert(!dealPriceTs.includes("'SUPER DEAL RXM'"), 'DealPriceModal nu are preset hardcodat SUPER DEAL RXM');

// ─── 8. Izolare Motor Generic Showroom Intro & Agnostic Data Contract ───────
console.log('\n🔍 [SUITE 8] Motor Generic Showroom Intro & Izolare Tenanți Agnostică');

const cinematicIntroTs = readFile('src/components/CinematicIntro.tsx');
assert(!cinematicIntroTs.includes('mpi_auto'), 'CinematicIntro.tsx nu conține slug hardcodat mpi_auto');
assert(!cinematicIntroTs.includes('isMpi'), 'CinematicIntro.tsx nu conține flag hardcodat isMpi');
assert(!cinematicIntroTs.includes('MPI AUTO CLUJ'), 'CinematicIntro.tsx nu conține text fix MPI AUTO CLUJ');
assert(!cinematicIntroTs.includes('Centura Apahida'), 'CinematicIntro.tsx nu conține adresă fixă Centura Apahida');
assert(!cinematicIntroTs.includes('RXM AUTO MOBILE'), 'CinematicIntro.tsx nu conține text fix RXM AUTO MOBILE');
assert(cinematicIntroTs.includes("introType === 'none'"), "CinematicIntro.tsx gestionează modul 'none' pentru bypass instant");
assert(cinematicIntroTs.includes("introType === 'cinematic_video'"), "CinematicIntro.tsx gestionează modul 'cinematic_video' dinamic");
assert(cinematicIntroTs.includes("introType === 'split_shutter'"), "CinematicIntro.tsx gestionează modul 'split_shutter' dinamic");

assert(!appTs.includes("tenantId === 'rxm' || tenantId === 'mpi_auto'"), 'App.tsx nu restricționează intro-ul la tenanți specifici');
assert(!appTs.includes("hostname.includes('parcos')"), 'App.tsx nu folosește hostname.includes(\'parcos\') care suprima subdomeniile');
assert(appTs.includes('isParcos = isParcosDomain(hostname, port)'), 'App.tsx folosește isParcosDomain(hostname, port) pentru detectare precisă');
assert(appTs.includes('${slug}_intro_seen'), 'App.tsx generează chei de storage izolate dinamic per tenant slug');

const typesTs = readFile('src/db/types.ts');
assert(typesTs.includes('export interface DealerIntroConfig'), 'types.ts definește interfața strongly-typed DealerIntroConfig');
assert(typesTs.includes('intro?: DealerIntroConfig;'), 'DealerLandingConfig include câmpul opțional intro');

assert(dealerTs.includes("type: 'cinematic_video'"), 'dealer.ts conține presetul video cinematic pentru DEALER_MPI_AUTO');
assert(dealerTs.includes("type: 'split_shutter'"), 'dealer.ts conține presetul split shutter pentru SEED_DEALER');

console.log('\n===============================================================');
console.log(`REZULTAT QA IZOLARE BRAND & TEMĂ: ${testsPassed}/${testsRun} TESTE TRECUTE!`);
if (testsFailed > 0) {
  console.error(`❌ Eșecuri detectate: ${testsFailed}`);
  process.exit(1);
} else {
  console.log('🎉 SUCCES: Niciun reziduu de brand RXM nu a scăpat. Izolare completă garantată!');
  process.exit(0);
}
