export interface VehicleItem {
  id: string;
  stockNumber: string;
  brand: string;
  model: string;
  versionTrim: string;
  year: number;
  mileageKm: number;
  priceEur: number;
  vatDeductible: boolean;
  fuelType: "Diesel" | "Benzină" | "Hibrid" | "Electric";
  transmission: "Automată" | "Manuală";
  powerHp: number;
  engineCc: number;
  bodyType: "SUV" | "Sedan" | "Coupe" | "Break" | "Hatchback";
  drivetrain: "4x4 / AWD" | "Față" | "Spate";
  color: string;
  vin: string;
  isVinPublic?: boolean;
  warrantyMonths: 12 | 24 | 36;
  status: "in_stock" | "reserved" | "sold" | "preparing";
  images: string[];
  originalImages?: string[]; // Fotografii curate originale (fără watermark/plăcuțe) pentru funcția de Revert
  videoUrl?: string;
  tiktokUrl?: string;
  tiktokViews?: string;
  isHeroPinned?: boolean;
  heroOrder?: number;
  // ── Ofertă Specială / Deal of the Week ──────────────────────────────────────
  isDealOfWeek?: boolean;      // true = apare prima în catalog + glowing card + badge
  isPinnedToTop?: boolean;     // true = apare prima în catalog, fără badge "Oferta Săptămânii"
  oldPriceEur?: number;        // Preț de listă anterior barat (afișat tăiat lângă prețul curent)
  dealBadgeText?: string;      // Text badge personalizat (default: "OFERTA SĂPTĂMÂNII")
  docOriginCountry?: "DE" | "AT" | "FR" | "IT" | "RO" | "NL" | "BE" | "US" | "OTHER";
  equipmentSheetText?: string;
  olxUrl?: string;
  olxId?: string;
  olxStatus?: "active" | "expired" | "unlinked";
  olxDiscrepancy?: "none" | "sold_but_active_on_olx" | "in_stock_but_gone_on_olx";
  lastOlxSyncAt?: string;
  // Gestiune Financiară & Cheltuieli (RXM Dealer Intelligence)
  purchasePriceEur?: number;
  soldPriceEur?: number;
  soldAt?: string; // Format: ISO 8601 String al datei de vânzare (ex: 2026-10-13T12:00:00Z)
  stockEntryDate?: string; // Format: YYYY-MM-DD (Data intrării mașinii pe stocul parcului RXM)
  expenses?: VehicleExpenseItem[];
  marketEvaluation?: MarketPriceEvaluation;
  // Gestiune Termene Flotă & Numere Roșii (RXM Fleet Deadlines)
  hasRedPlates?: boolean;
  redPlatesExpiresAt?: string; // Format: YYYY-MM-DD
  itpExpiresAt?: string;       // Format: YYYY-MM-DD
  rarAppointmentDate?: string; // Format: YYYY-MM-DD
  civSeries?: string;          // Serie Carte Identitate Vehicul (CIV)
  licensePlate?: string;       // Număr de înmatriculare
  // Sindicare AutoLicit.ro (Ticket 04)
  autolicitSync?: {
    isSynced: boolean;
    mode: 'none' | 'direct_sale' | 'auction';
    startingBidEur?: number;
    syncedAt?: string;
  };
  // Jurnal Evenimente & Audit Trail (Ticket 03) + Note Administrative (Ticket 04)
  auditLog?: VehicleAuditEntry[];
  internalNotes?: string;
  features: {
    safety: string[];
    comfort: string[];
    multimedia: string[];
  };
  description: string;
}

export type VehicleAuditAction =
  | 'created'
  | 'status_changed'
  | 'price_updated'
  | 'deal_updated'
  | 'red_plates_updated'
  | 'vat_toggled'
  | 'expenses_added'
  | 'note_added'
  | 'specs_updated';

export interface VehicleAuditEntry {
  id: string;
  timestamp: string;
  action: VehicleAuditAction;
  author?: string;
  title: string;
  details: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

export type VehicleExpenseCategory = 
  | 'purchase_transport' 
  | 'rar_registration' 
  | 'mechanical_repairs' 
  | 'detailing_cleaning' 
  | 'bodywork_paint' 
  | 'marketing_ads' 
  | 'parts' 
  | 'other';

export interface VehicleExpenseItem {
  id: string;
  category: VehicleExpenseCategory;
  title: string;
  amountEur: number;
  date: string;
  invoiceRef?: string;
  notes?: string;
}

export interface DealerMarketBenchmark {
  minPriceEur?: number;
  avgPriceEur?: number;
  maxPriceEur?: number;
  notes?: string;
  savedAt: string;
}

export interface SimilarMarketListing {
  id: string;
  title: string;
  priceEur: number;
  year: number;
  mileageKm: number;
  source: 'OLX RO' | 'Autovit' | 'Piața Auto' | 'Mobile.de';
  location: string;
  url?: string;
  matchConfidencePct: number;
  isDirectListing?: boolean;
}

export interface MarketPriceEvaluation {
  evaluatedAt: string;
  dataSource?: 'sami_live' | 'reference' | 'synthetic' | 'dealer_benchmark';
  scannedByNode?: string;
  criteria: {
    brand: string;
    model: string;
    yearRange: string;
    kmRange: string;
    transmission?: string;
    fuelType?: string;
  };
  minPriceEur: number;
  avgPriceEur: number;
  maxPriceEur: number;
  recommendedQuickSalePriceEur: number;
  recommendedFairPriceEur: number;
  recommendedPremiumPriceEur: number;
  totalListingsCompared: number;
  marketPosition: 'below_market' | 'fair_market' | 'above_market';
  priceDifferenceEur: number;
  executiveSummary: string;
  similarListings: SimilarMarketListing[];
  searchLinks?: {
    olxUrl: string;
    autovitUrl: string;
    mobileDeUrl?: string;
    piataAutoUrl?: string;
  };
  dealerBenchmark?: DealerMarketBenchmark;
}

export type DealerThemePreset = 
  | 'obsidian_gold'     // 🌟 Dark Luxury Amber (Stil RXM Classic)
  | 'clean_white'       // ⚪ Nordic Clean White / Pearl Minimalist (Stil Polestar / Porsche Studio)
  | 'midnight_blue'     // 💎 High-Tech Sapphire / Corporate Blue (Stil BMW / Mercedes)
  | 'carbon_red'        // 🏎️ Sport Crimson / Dynamic Red (Stil Audi S-Line / Cupra)
  | 'emerald_prestige'; // 🌿 British Green / Eco Luxury (Stil Aston Martin / Alpina)

// ─── Landing Page Config ───────────────────────────────────────────────────
export type DealerHeroType =
  | 'video_loop'   // ShowroomVideoIntro 4K (curent RXM)
  | 'spotlight'    // HeroSpotlight — mașină vedetă pe piedestal
  | 'banner';      // DealerBannerHero — compact, axat pe stoc

export type DealerLayoutVariant =
  | 'luxury_cinematic'   // Dark, animat, video loop (RXM Classic)
  | 'nordic_clean'       // Alb, minimalist (stil Polestar)
  | 'compact_inventory'  // Filtre dense, viteza > estetic (stil AutoHero)
  | 'corporate_fleet';   // Corporativ, sobru (flote B2B)

export interface DealerHeroConfig {
  type: DealerHeroType;
  headline?: string;        // ex: "Autovehicule Rulate Premium • Cluj-Napoca"
  subheadline?: string;
  videoUrl?: string;        // folosit DOAR dacă type === 'video_loop'
  posterUrl?: string;
  primaryCtaText?: string;  // ex: "Explorează Stocul" (default dacă gol)
}

export interface DealerLandingSections {
  heroCinematic: boolean;        // HeroSpotlight / ShowroomVideoIntro / DealerBannerHero
  vehicleCatalog: boolean;       // VehicleCatalog (#stoc)
  whyChooseUs: boolean;          // WhyChooseUs (#why-us)
  financingSection: boolean;     // FinancingSection (#finantare)
  buyBackSection: boolean;       // BuyBackSection (#buyback)
  customOrderSection: boolean;   // CustomOrderSection (#comanda)
  googleReviewsSection: boolean; // GoogleReviewsSection (#recenzii)
}

export interface DealerLandingConfig {
  layoutVariant: DealerLayoutVariant;
  hero: DealerHeroConfig;
  visibleSections: DealerLandingSections;
  customBadges: string[]; // ex: ["Garanție 24 Luni", "TVA Deductibil 21%"]
}

export interface TenantFeatures {
  ocrCivTalon: boolean;         // Scanare automată CIV & Talon OCR v9
  olxStockSync: boolean;        // Sincronizare automată stoc OLX / Autovit
  tikTokStudio: boolean;        // Generator video TikTok Reel 9:16
  autolicitPush: boolean;       // Sincronizare B2B licitații AutoLicit.ro
  salesDocsEngine: boolean;     // Generator 1-click contracte & facturi
  windowStickersQr: boolean;    // Fișe de parbriz printabile cu cod QR
  financingCalculator: boolean;   // Calculator rate BT / TBI
  whatsappLeadsBot: boolean;    // Simulator cotații & leaduri WhatsApp
  fgoInvoicing?: boolean;       // Conectare Facturare & Proforme FGO.ro API v2
}

export type TenantTier = 'starter' | 'pro' | 'enterprise';
export type TenantStatus = 'active' | 'pending' | 'suspended' | 'demo';

export interface DealerProfile {
  name: string;
  cui: string;
  regCom?: string;
  shareCapital?: string;
  legalAddress?: string;
  showroomAddress?: string;
  serviceLocation?: string;
  // Date Bancare Tenant (Flexibile per dealer)
  bankName: string; // Ex: "Banca Transilvania", "ING Bank România", "Banca Comercială Română"
  ibanRon: string; // Cont IBAN principal în RON
  ibanEur?: string; // Cont IBAN opțional în EUR
  bankBranch?: string; // Sucursală / Agenție bancară
  phonePrimary: string; // Robert (0748 892 937) - Vânzări & General
  phoneSecondary: string; // Mădălina (0758 042 979) - Finanțare & Rate
  phoneFinance: string; // Mădălina (0758 042 979)
  whatsappNumber: string; // Robert (40748892937)
  whatsappFinance: string; // Mădălina (40758042979)
  financeContactName: string; // "Mădălina"
  generalContactName: string; // "Robert"
  email: string;
  tiktokHandle: string;
  tiktokUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  address: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  openingHours: string;
  financingPartners: string[];
  googleCalendarBookingUrl?: string;
  themePreset?: DealerThemePreset; // 🎨 Temă vizuală predefinită
  slug?: string;
  domain?: string;
  config?: Record<string, any>;
  // Matrice de Features & Cote SaaS (SuperAdmin Control Plane)
  features?: TenantFeatures;
  tier?: TenantTier;
  status?: TenantStatus;
  maxVehiclesQuota?: number;
  activeVehiclesCount?: number;
  // Integrare Social Media & Meta Graph API (Ticket 04)
  socialIntegration?: DealerSocialIntegration;
  // Configurare Landing Page Dinamică (Wave 1)
  landingConfig?: DealerLandingConfig;
}

export interface DealerSocialIntegration {
  metaEnabled?: boolean;
  facebookPageId?: string;
  facebookPageAccessToken?: string;
  instagramBusinessAccountId?: string;
  autoAddWatermarkPlates?: boolean;
}

export type DealerLeadStatus = 'new' | 'testdrive' | 'financing' | 'negotiation' | 'proforma' | 'closed_won' | 'closed_lost';

export interface DealerLeadItem {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  carId?: string;
  carTitle?: string;
  carPriceEur?: number;
  dealType: 'cash' | 'financing' | 'buyback';
  source: 'showroom_web' | 'whatsapp' | 'olx' | 'tiktok' | 'phone_call' | 'recommendation';
  status: DealerLeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  scheduledTestDriveAt?: string;
  recontactDate?: string;
}
