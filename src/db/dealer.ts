import { DealerProfile, TenantFeatures, DealerLandingConfig } from './types';

export function explicitVehicleQuota(value: unknown, fallback = 25): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export const DEFAULT_TENANT_FEATURES: TenantFeatures = {
  ocrCivTalon: true,
  olxStockSync: true,
  tikTokStudio: true,
  autolicitPush: true,
  salesDocsEngine: true,
  windowStickersQr: true,
  financingCalculator: true,
  whatsappLeadsBot: true,
  financingPortfolio: false, // Strict blocat implicit pe producție
  reconTracker: false,       // Rollout controlat (activat per tenant)
  googleDriveVault: false,   // Rollout controlat per tenant
  mailHub: false,            // Cutia de mail pornește doar cu true explicit
};

/**
 * A rollout flag is on only when the JSON says `true`.
 * A missing key stays off, except for a slug whose seed profile already stores `true`
 * (legacy rows that never received the key). An explicit `false` wins for every flag
 * except `financingPortfolio`: RXM and the sandbox seed keep that module on, because the
 * `dealers.features` column default writes the key as false and was hiding Finanțări plus
 * the BNR/BT settings from the admin sidebar.
 */
export function isTenantFeatureEnabled(
  features: Partial<TenantFeatures> | null | undefined,
  key: keyof TenantFeatures,
  slug?: string | null,
): boolean {
  if (key === 'financingPortfolio' && slug && seededSlugKeepsMissingFeature(key, slug)) return true;
  if (features?.[key] === true) return true;
  if (features?.[key] === false) return false;
  if (!slug) return false;
  return seededSlugKeepsMissingFeature(key, slug);
}

// ─── Config Landing Default (fallback sigur pentru orice dealer nou) ──────────
export const DEFAULT_LANDING_CONFIG: DealerLandingConfig = {
  layoutVariant: 'luxury_cinematic',
  hero: { type: 'spotlight' },
  visibleSections: {
    heroCinematic: true,
    vehicleCatalog: true,
    whyChooseUs: true,
    financingSection: true,
    buyBackSection: true,
    customOrderSection: true,
    googleReviewsSection: true,
  },
  customBadges: ['Garanție 24 Luni', 'TVA Deductibil 21%', 'Livrare Națională'],
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
  features: { 
    ...DEFAULT_TENANT_FEATURES,
    financingPortfolio: true,
    mailHub: true,
  },
  socialIntegration: {
    metaEnabled: false,
    facebookPageId: "61550788350781",
    instagramBusinessAccountId: "",
    autoAddWatermarkPlates: true
  },
  landingConfig: {
    ...DEFAULT_LANDING_CONFIG,
    hero: { type: 'spotlight' }
  },
  logoUrl: "/images/rxm-logo-gold.png",
  windowStickerConfig: {
    showLogo: true,
    logoPosition: "header_left",
    showEngineCc: true,
    showPowerHp: true,
    showFuelType: true,
    showTransmission: true,
    showDrivetrain: true,
    showExchangeRateDisclaimer: true,
    exchangeRateDisclaimerText: "Plata în LEI la curs BNR + 2% din ziua facturării",
    showVin: false,
    showMonthlyRate: true,
    showVatDetails: true,
    showTopFeatures: true,
    showQrCode: true,
    showWarrantyBadge: true
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
    reconTracker: true,       // Activ pentru gestiune mecanică & defecte MPI AUTO
    googleDriveVault: true,   // Activ pentru arhivare bonuri & documente optimizate
  },
  landingConfig: {
    layoutVariant: 'compact_inventory',
    hero: { type: 'spotlight', headline: 'MPI Auto Cluj — Stoc Rotit Săptămânal' },
    visibleSections: {
      heroCinematic: true,
      vehicleCatalog: true,
      whyChooseUs: true,
      financingSection: true,
      buyBackSection: true,
      customOrderSection: false,
      googleReviewsSection: false,
    },
    customBadges: ['Garanție 12 Luni', 'Rate BT / TBI'],
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
  },
  landingConfig: {
    layoutVariant: 'nordic_clean',
    hero: { type: 'spotlight', headline: 'ALD Autoland Cluj — Vehicule Corporate Verificate' },
    visibleSections: {
      heroCinematic: true,
      vehicleCatalog: true,
      whyChooseUs: true,
      financingSection: true,
      buyBackSection: false,
      customOrderSection: false,
      googleReviewsSection: false,
    },
    customBadges: ['Garanție 12 Luni', 'Ideal Flotă B2B'],
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
  },
  landingConfig: DEFAULT_LANDING_CONFIG
};

export const DEALER_RXM_SANDBOX: DealerProfile = {
  ...SEED_DEALER,
  name: "RXM Automobile [SANDBOX STAGING]",
  slug: "rxm_sandbox",
  domain: "sandbox.rxmautomobile.ro",
  cui: "RO00000000-TEST",
  tier: "enterprise",
  status: "active",
  maxVehiclesQuota: 100,
  features: {
    ...DEFAULT_TENANT_FEATURES,
    fgoInvoicing: true,
    financingPortfolio: true, // Activ pentru testare pe staging
    reconTracker: true,       // Activ pentru testare completă pe Staging Sandbox
    googleDriveVault: true,   // Activ pentru testare Vault pe Staging Sandbox
  },
  config: {
    ...(SEED_DEALER.config || {}),
    isSandboxEnvironment: true,
    sandboxClonedFrom: "rxm",
    invoicing: {
      provider: "fgo",
      fgo: {
        environment: "test", // Strict UAT Test FGO
        seriesFiscal: "TEST",
        seriesProforma: "SANDBOX",
        autoSendSpv: false // Strict interzis SPV ANAF pe mediul de test
      }
    }
  }
};

export const TENANT_DEALERS: Record<string, DealerProfile> = {
  autonord_cluj: DEALER_AUTONORD_CLUJ,
  rxm: SEED_DEALER,
  rxm_sandbox: DEALER_RXM_SANDBOX,
  mpi_auto: DEALER_MPI_AUTO,
  top_auto: DEALER_TOP_AUTO
};

// Modele / template-uri de referință pentru viitoare parcuri auto partenere
export const DEALER_PARTNER_TEMPLATES: Record<string, DealerProfile> = {
  mpi_auto: DEALER_MPI_AUTO,
  top_auto: DEALER_TOP_AUTO
};

const ROLLOUT_FEATURE_KEYS = ['reconTracker', 'financingPortfolio', 'googleDriveVault'] as const;
type RolloutFeatureKey = (typeof ROLLOUT_FEATURE_KEYS)[number];

function isRolloutFeatureKey(key: keyof TenantFeatures): key is RolloutFeatureKey {
  return (ROLLOUT_FEATURE_KEYS as readonly string[]).includes(key);
}

/** Allow-list built only from profiles that already store an explicit true. False parks are never listed. */
function seededSlugKeepsMissingFeature(key: keyof TenantFeatures, slug: string): boolean {
  if (!isRolloutFeatureKey(key)) return false;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  const profiles: DealerProfile[] = [SEED_DEALER, ...Object.values(TENANT_DEALERS)];
  for (const profile of profiles) {
    if (profile.slug?.trim().toLowerCase() === normalized && profile.features?.[key] === true) {
      return true;
    }
  }
  return false;
}

/** Keep F&I on for parks whose seed already stores financingPortfolio: true. */
export function withSeededFinancingPortfolio<T extends { slug?: string | null; features?: Partial<TenantFeatures> | null }>(profile: T): T {
  const slug = profile.slug?.trim().toLowerCase();
  if (!slug || profile.features?.financingPortfolio === true) return profile;
  if (!seededSlugKeepsMissingFeature('financingPortfolio', slug)) return profile;
  return {
    ...profile,
    features: {
      ...(profile.features || {}),
      financingPortfolio: true,
    },
  };
}
