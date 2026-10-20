-- ══════════════════════════════════════════════════════════════════
-- Migrare 01: Extindere Tabela dealers cu config JSONB & domain
-- Platformă: CARVANA SRL • DealerOS Turnkey Multi-Tenant Engine
-- Hosting: Netcup VPS (152.53.158.65) • Invariantă TVA: Strict 21%
-- ══════════════════════════════════════════════════════════════════

-- 1. Adăugare coloane multi-tenant (Idempotent)
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS domain VARCHAR(150) UNIQUE;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Index pentru rezoluție ultra-rapidă după domeniu web
CREATE INDEX IF NOT EXISTS idx_dealers_domain ON dealers(domain);
CREATE INDEX IF NOT EXISTS idx_dealers_is_active ON dealers(is_active);

-- 3. Upsert Profil Principal: RXM Automobile (Fondator)
INSERT INTO dealers (
  name, slug, domain, phone_primary, phone_secondary, whatsapp_number, email, 
  address_street, city, county, vat_number, opening_hours, is_active, config
) VALUES (
  'RXM AUTOMOBILE SRL',
  'rxm',
  'rxmautomobile.ro',
  '0748 892 937',
  '0758 042 979',
  '40748892937',
  'contact@rxmautomobile.ro',
  'Strada Colonia Hodai F.N.',
  'Cluj-Napoca',
  'Cluj',
  'RO48482214',
  'Luni - Vineri 10:00 - 18:00 | Sâmbătă - Duminică 10:00 - 16:00',
  TRUE,
  '{
    "themePreset": "obsidian_gold",
    "branding": {
      "tagline": "Autovehicule Rulate Premium • Cluj-Napoca",
      "logoUrl": "/rxm/images/rxm-emblem.png",
      "accentColor": "#f59e0b",
      "fontFamily": "Plus Jakarta Sans"
    },
    "bank": {
      "name": "Banca Transilvania",
      "ibanRon": "RO88 BTRL 0120 1205 8482 2101",
      "ibanEur": "RO35 BTRL 0120 4205 8482 2102",
      "warrantyTerm": "Cont de Garanție",
      "reservationTerm": "Garanție de Rezervare/Participare"
    },
    "vatRate": 0.21,
    "layout": {
      "sectionsOrder": ["hero", "inventory", "features", "financing", "reviews", "contact"],
      "introSplash": "classic"
    },
    "features": {
      "showFinancingCalculator": true,
      "showVatBreakdown": true,
      "allowInstantOffer": true,
      "allowTestDriveBooking": true,
      "enableWebPush": true
    }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  vat_number = EXCLUDED.vat_number,
  opening_hours = EXCLUDED.opening_hours;

-- 4. Seed Showroom Demo: MPI Auto Rulate (Clean White Luxury)
INSERT INTO dealers (
  name, slug, domain, phone_primary, phone_secondary, whatsapp_number, email, 
  address_street, city, county, vat_number, opening_hours, is_active, config
) VALUES (
  'MPI AUTO CLA S.R.L.',
  'mpi_auto',
  'mpiauto.ro',
  '0759 757 858',
  '0749 691 302',
  '40759757858',
  'contact@mpiauto.ro',
  'Centura Apahida (lângă sensul giratoriu)',
  'Apahida',
  'Cluj',
  'RO43460100',
  'Luni - Vineri 09:00 - 18:00 | Sâmbătă - Duminică 10:00 - 15:00',
  TRUE,
  '{
    "themePreset": "clean_white",
    "branding": {
      "tagline": "Rulate de Încredere Verificate Tehnic • Cluj",
      "logoUrl": "/images/mpi-logo.png",
      "accentColor": "#ffffff",
      "fontFamily": "Inter"
    },
    "bank": {
      "name": "Banca Transilvania",
      "ibanRon": "RO49 BTRL 0000 9999 4346 0100",
      "ibanEur": "RO22 BTRL 0000 9999 4346 0101",
      "warrantyTerm": "Cont de Garanție",
      "reservationTerm": "Garanție de Rezervare/Participare"
    },
    "vatRate": 0.21,
    "layout": {
      "sectionsOrder": ["hero", "inventory", "features", "financing", "contact"],
      "introSplash": "none"
    },
    "features": {
      "showFinancingCalculator": true,
      "showVatBreakdown": true,
      "allowInstantOffer": true,
      "allowTestDriveBooking": true,
      "enableWebPush": true
    }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active;

-- 5. Seed Showroom Demo: Top Auto Transilvania (Midnight Blue)
INSERT INTO dealers (
  name, slug, domain, phone_primary, phone_secondary, whatsapp_number, email, 
  address_street, city, county, vat_number, opening_hours, is_active, config
) VALUES (
  'TOP AUTO TRANSILVANIA S.R.L.',
  'top_auto',
  'topautotransilvania.ro',
  '0740 987 654',
  '0741 876 543',
  '40740987654',
  'office@topautotransilvania.ro',
  'B-dul Muncii nr. 18',
  'Cluj-Napoca',
  'Cluj',
  'RO41920199',
  'Luni - Vineri 09:00 - 17:30 | Sâmbătă 10:00 - 14:00',
  TRUE,
  '{
    "themePreset": "midnight_blue",
    "branding": {
      "tagline": "Showroom Auto Transilvania • Garanție Extinsă",
      "logoUrl": "/images/topauto-logo.png",
      "accentColor": "#3b82f6",
      "fontFamily": "Plus Jakarta Sans"
    },
    "bank": {
      "name": "Banca Comercială Română (BCR)",
      "ibanRon": "RO12 RNCB 0082 1450 4192 0199",
      "ibanEur": "RO89 RNCB 0082 1450 4192 0200",
      "warrantyTerm": "Cont de Garanție",
      "reservationTerm": "Garanție de Rezervare/Participare"
    },
    "vatRate": 0.21,
    "layout": {
      "sectionsOrder": ["hero", "inventory", "financing", "features", "contact"],
      "introSplash": "none"
    },
    "features": {
      "showFinancingCalculator": true,
      "showVatBreakdown": true,
      "allowInstantOffer": true,
      "allowTestDriveBooking": true,
      "enableWebPush": true
    }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active;
