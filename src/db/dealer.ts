import { DealerProfile, TenantFeatures } from './types';

export const DEFAULT_TENANT_FEATURES: TenantFeatures = {
  ocrCivTalon: true,
  olxStockSync: true,
  tikTokStudio: true,
  autolicitPush: true,
  salesDocsEngine: true,
  windowStickersQr: true,
  financingCalculator: true,
  whatsappLeadsBot: true,
};

/**
 * ============================================================================
 * 🏢 DEALER OS — CONFIGURARE PROFIL PARC AUTO (STANDALONE SUITE)
 * ============================================================================
 * Fiecare parc auto partener primește propria instanță autonomă a suitei.
 * Pentru a replica și configura suita pentru un dealer nou:
 * 
 * 1. Modifică datele din `SEED_DEALER` de mai jos (CUI, IBAN, telefoane, adresă).
 * 2. Pune sigla noului dealer în `public/images/logo.png`.
 * 3. Consultă ghidul pas-cu-pas: `docs/DEALER_SUITE_REPLICATION_PLAYBOOK.md`
 * ============================================================================
 */
export const SEED_DEALER: DealerProfile = {
  name: "RXM AUTOMOBILE SRL",
  cui: "RO48482214",
  regCom: "J12/3012/13.07.2023",
  shareCapital: "200 RON",
  legalAddress: "jud. Cluj, loc. Florești, str. Gheorghe Doja nr. 1I, bl. I1, ap. 12",
  showroomAddress: "mun. Cluj-Napoca, str. Colonia Hoia FN, jud. Cluj",
  serviceLocation: "jud. Cluj, loc. Cluj-Napoca",
  bankName: "Banca Transilvania",
  ibanRon: "RO88 BTRL 0120 1205 8482 2101",
  ibanEur: "RO35 BTRL 0120 4205 8482 2102",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: "0748 892 937", // Robert - Vânzări & Informații Generale
  phoneSecondary: "0758 042 979", // Mădălina - Consultanță Finanțare & Rate
  phoneFinance: "0758 042 979", // Mădălina - Consultanță Finanțare & Rate
  whatsappNumber: "40748892937", // Robert - Vânzări & Showroom
  whatsappFinance: "40758042979", // Mădălina - Consultanță Finanțare & Rate
  financeContactName: "Consilier Finanțare",
  generalContactName: "Consilier Vânzări",
  email: "contact@rxmautomobile.ro",
  tiktokHandle: "@rxm.automobile",
  tiktokUrl: "https://www.tiktok.com/@rxm.automobile",
  facebookUrl: "https://www.facebook.com/profile.php?id=61550788350781",
  instagramUrl: "https://www.instagram.com/rxmautomobile/",
  address: "Strada Colonia Hodai F.N., Cluj-Napoca, jud. Cluj",
  googleMapsUrl: "https://www.google.com/maps/place/RXM+Automobile/@46.7987323,23.6716857,17z/data=!3m1!4b1!4m6!3m5!1s0x691a396c3c3458f3:0x9cec8cb127b27fff!8m2!3d46.7987287!4d23.6742606!16s%2Fg%2F11zfqg_ndk?hl=en-GB&entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D",
  wazeUrl: "https://waze.com/ul?ll=46.798729,23.674261&q=RXM+Automobile+Cluj&navigate=yes",
  openingHours: "Luni - Vineri 10:00 - 18:00 | Sâmbătă - Duminică 10:00 - 16:00",
  financingPartners: ["TBI Bank", "Banca Transilvania (BT Direct)", "UniCredit Consumer Financing", "CreditFix"],
  googleCalendarBookingUrl: "https://calendar.google.com/calendar/u/0/r",
  themePreset: "obsidian_gold",
  slug: "rxm",
  domain: "rxmautomobile.ro",
  tier: "enterprise",
  status: "active",
  maxVehiclesQuota: 100,
  features: { ...DEFAULT_TENANT_FEATURES },
  socialIntegration: {
    metaEnabled: false,
    facebookPageId: "61550788350781",
    instagramBusinessAccountId: "",
    autoAddWatermarkPlates: true
  }
};

export const DEALER_MPI_AUTO: DealerProfile = {
  name: "MPI AUTO CLA S.R.L.",
  cui: "RO43460100",
  regCom: "J12/4202/2020",
  shareCapital: "500 RON",
  legalAddress: "Mun. Cluj-Napoca, Str. Scorțarilor nr. 5, bl. D7, jud. Cluj",
  showroomAddress: "Centura Apahida, jud. Cluj (lângă sensul giratoriu)",
  serviceLocation: "jud. Cluj, loc. Apahida",
  bankName: "Banca Transilvania",
  ibanRon: "RO49 BTRL 0000 9999 4346 0100",
  ibanEur: "RO22 BTRL 0000 9999 4346 0101",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: "0759 757 858", // Vânzări & Informații Generale MPI Auto
  phoneSecondary: "0749 691 302", // Consultanță Finanțare & Rate
  phoneFinance: "0749 691 302", // Consultanță Finanțare & Rate
  whatsappNumber: "40759757858", // WhatsApp Vânzări Showroom
  whatsappFinance: "40749691302", // WhatsApp Finanțare
  financeContactName: "Consilier Finanțare MPI",
  generalContactName: "Consilier Vânzări MPI",
  email: "contact@mpiauto.ro",
  tiktokHandle: "@mpiautocluj",
  tiktokUrl: "https://www.tiktok.com",
  facebookUrl: "https://www.facebook.com/MPIAUTOCLUJ",
  instagramUrl: "https://www.instagram.com/mpiautocluj",
  address: "Centura Apahida, jud. Cluj",
  googleMapsUrl: "https://maps.google.com/?q=MPI+Auto+Cluj+Centura+Apahida",
  wazeUrl: "https://waze.com/ul?q=MPI+Auto+Cluj",
  openingHours: "Luni - Vineri 09:00 - 18:00 | Sâmbătă - Duminică 10:00 - 15:00",
  financingPartners: ["Banca Transilvania (BT Direct)", "TBI Bank", "UniCredit Consumer Financing", "Mogo"],
  themePreset: "clean_white",
  slug: "mpi_auto",
  domain: "mpiauto.ro",
  tier: "pro",
  status: "active",
  maxVehiclesQuota: 50,
  features: {
    ...DEFAULT_TENANT_FEATURES,
    tikTokStudio: false,
    autolicitPush: false,
  }
};

export const DEALER_TOP_AUTO: DealerProfile = {
  name: "ALD AUTOLAND S.R.L.",
  cui: "RO41920199",
  regCom: "J12/4500/2020",
  shareCapital: "200 RON",
  legalAddress: "Mun. Cluj-Napoca, B-dul Muncii nr. 18, jud. Cluj",
  showroomAddress: "B-dul Muncii nr. 18, Cluj-Napoca, jud. Cluj",
  serviceLocation: "jud. Cluj, loc. Cluj-Napoca",
  bankName: "Banca Comercială Română (BCR)",
  ibanRon: "RO12 RNCB 0082 1450 4192 0199",
  ibanEur: "RO89 RNCB 0082 1450 4192 0200",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: "0740 987 654",
  phoneSecondary: "0741 876 543",
  phoneFinance: "0741 876 543",
  whatsappNumber: "40740987654",
  whatsappFinance: "40741876543",
  financeContactName: "Consilier Credite ALD Autoland",
  generalContactName: "Vânzări ALD Autoland",
  email: "office@aldautoland.ro",
  tiktokHandle: "@ald.autoland",
  tiktokUrl: "https://www.tiktok.com",
  facebookUrl: "https://www.facebook.com",
  instagramUrl: "https://www.instagram.com",
  address: "B-dul Muncii nr. 18, Cluj-Napoca, jud. Cluj",
  openingHours: "Luni - Vineri 09:00 - 17:30 | Sâmbătă 10:00 - 14:00",
  financingPartners: ["Banca Transilvania (BT Direct)", "Mogo", "TBI Bank"],
  themePreset: "midnight_blue",
  slug: "top_auto",
  domain: "aldautoland.ro",
  tier: "starter",
  status: "demo",
  maxVehiclesQuota: 25,
  features: {
    ...DEFAULT_TENANT_FEATURES,
    ocrCivTalon: false,
    olxStockSync: false,
    tikTokStudio: false,
    autolicitPush: false,
  }
};

export const DEALER_AUTONORD_CLUJ: DealerProfile = {
  name: "Auto Nord Transilvania S.R.L.",
  cui: "RO43460100",
  regCom: "J12/1000/2024",
  shareCapital: "500 RON",
  legalAddress: "Cluj-Napoca, jud. Cluj",
  showroomAddress: "Cluj-Napoca, jud. Cluj",
  serviceLocation: "jud. Cluj, loc. Cluj-Napoca",
  bankName: "Banca Transilvania",
  ibanRon: "RO00 BTRL 0000 0000 0000 0000",
  ibanEur: "RO00 BTRL 0000 0000 0000 0001",
  bankBranch: "Sucursala Cluj-Napoca",
  phonePrimary: "0740 999 888",
  phoneSecondary: "0740 999 888",
  phoneFinance: "0740 999 888",
  whatsappNumber: "40740999888",
  whatsappFinance: "40740999888",
  financeContactName: "Consilier Finanțare",
  generalContactName: "Consilier Vânzări",
  email: "contact@autonordcluj.ro",
  tiktokHandle: "@autonord_cluj",
  tiktokUrl: "https://www.tiktok.com",
  facebookUrl: "https://www.facebook.com",
  instagramUrl: "https://www.instagram.com",
  address: "Cluj-Napoca, jud. Cluj",
  openingHours: "Luni - Vineri 09:00 - 18:00 | Sâmbătă 10:00 - 14:00",
  financingPartners: ["Banca Transilvania (BT Direct)", "TBI Bank", "UniCredit Consumer Financing"],
  themePreset: "clean_white",
  slug: "autonord_cluj",
  domain: "autonordcluj.ro",
  tier: "pro",
  status: "active",
  maxVehiclesQuota: 50,
  features: {
    ...DEFAULT_TENANT_FEATURES,
    autolicitPush: false,
  }
};

export const TENANT_DEALERS: Record<string, DealerProfile> = {
  autonord_cluj: DEALER_AUTONORD_CLUJ,
  rxm: SEED_DEALER,
  mpi_auto: DEALER_MPI_AUTO,
  top_auto: DEALER_TOP_AUTO
};

// Modele / template-uri de referință pentru viitoare parcuri auto partenere
export const DEALER_PARTNER_TEMPLATES: Record<string, DealerProfile> = {
  mpi_auto: DEALER_MPI_AUTO,
  top_auto: DEALER_TOP_AUTO
};
