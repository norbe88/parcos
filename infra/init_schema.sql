-- ══════════════════════════════════════════════════════════════════
-- RXM Automobile — Self-Hosted PostgreSQL Schema DDL (Netcup VPS)
-- Versiune: 2.0 • Multi-Tenant Engine • 2026-10-20
-- Hosting: Netcup VPS (152.53.158.65) • Invariantă TVA: Strict 21%
-- ══════════════════════════════════════════════════════════════════

-- 1. Tabel Profil Dealer Auto & Multi-Tenant Engine
CREATE TABLE IF NOT EXISTS dealers (
  id                  SERIAL        PRIMARY KEY,
  name                VARCHAR(150)  NOT NULL,
  slug                VARCHAR(150)  NOT NULL UNIQUE,
  domain              VARCHAR(150)  UNIQUE,
  phone_primary       VARCHAR(30)   NOT NULL,
  phone_secondary     VARCHAR(30),
  whatsapp_number     VARCHAR(30)   NOT NULL,
  email               VARCHAR(120)  NOT NULL,
  address_street      TEXT          NOT NULL,
  city                VARCHAR(80)   NOT NULL,
  county              VARCHAR(80)   NOT NULL,
  google_maps_url     TEXT,
  opening_hours       TEXT,
  vat_number          VARCHAR(30),
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  config              JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dealers_domain ON dealers(domain);
CREATE INDEX IF NOT EXISTS idx_dealers_is_active ON dealers(is_active);

-- Seed dealer implicit RXM Automobile (Fondator)
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
  '{"themePreset":"obsidian_gold","vatRate":0.21,"bank":{"name":"Banca Transilvania","warrantyTerm":"Cont de Garanție","reservationTerm":"Garanție de Rezervare/Participare"}}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  domain = EXCLUDED.domain,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active;

-- 2. Tabel Inventar Vehicule (Mapare 1:1 cu VehicleItem)
CREATE TABLE IF NOT EXISTS vehicles (
  -- Identitate
  id                  TEXT          PRIMARY KEY,                    -- ex: "car-rxm-1792255717677" sau "audi-a6-2011-l0lya"
  dealer_slug         TEXT          NOT NULL DEFAULT 'rxm',         -- Multi-tenant: 'rxm', 'mpi-auto', etc.
  stock_number        TEXT,                                         -- ex: "RXM-5100"

  -- Date Tehnice Vehicul
  brand               TEXT          NOT NULL,
  model               TEXT          NOT NULL,
  version_trim        TEXT,
  year                INTEGER       NOT NULL,
  mileage_km          INTEGER       NOT NULL,
  
  -- Regim Fiscal (Strict TVA 21%)
  price_eur           NUMERIC(12,2) NOT NULL,
  vat_deductible      BOOLEAN       DEFAULT FALSE NOT NULL,
  vat_rate            NUMERIC(4,2)  DEFAULT 0.21 NOT NULL,          -- Strict TVA 21%
  
  -- Specificații Motor & Transmisie
  fuel_type           TEXT          NOT NULL,                       -- "Diesel" | "Benzină" | "Hibrid" | "Electric"
  transmission        TEXT          NOT NULL,                       -- "Automată" | "Manuală"
  power_hp            INTEGER       DEFAULT 0,
  engine_cc           INTEGER       DEFAULT 0,
  body_type           TEXT          DEFAULT 'SUV',                  -- "SUV" | "Sedan" | "Coupe" | "Break" | "Hatchback"
  drivetrain          TEXT          DEFAULT 'Față',                 -- "4x4 / AWD" | "Față" | "Spate"
  color               TEXT          DEFAULT '',
  vin                 TEXT          DEFAULT '',
  is_vin_public       BOOLEAN       DEFAULT FALSE,
  doc_origin_country  TEXT          DEFAULT 'RO',                   -- "DE" | "FR" | "IT" | "RO" | "NL" | "BE"
  warranty_months     INTEGER       DEFAULT 12,                     -- 12 | 24 | 36

  -- Status & Listare
  status              TEXT          NOT NULL DEFAULT 'in_stock',    -- "in_stock" | "reserved" | "sold" | "preparing"
  stock_entry_date    TEXT,                                         -- Format: YYYY-MM-DD

  -- Media (Array de URL-uri WebP relative sau absolute)
  images              JSONB         DEFAULT '[]'::jsonb,
  video_url           TEXT,
  tiktok_url          TEXT,
  tiktok_views        TEXT,

  -- Ofertă Specială / Deal of the Week
  is_deal_of_week     BOOLEAN       DEFAULT FALSE,
  is_pinned_to_top    BOOLEAN       DEFAULT FALSE,
  old_price_eur       NUMERIC(12,2),
  deal_badge_text     TEXT,

  -- Dotări & Descriere
  features            JSONB         DEFAULT '{"safety":[],"comfort":[],"multimedia":[]}'::jsonb,
  equipment_sheet_text TEXT,
  description         TEXT,

  -- Câmpuri Complexe (auditLog, expenses, marketEvaluation, internalNotes, etc.)
  raw_data            JSONB         DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

-- Indexuri performante pentru căutare rapidă în showroom
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_slug ON vehicles(dealer_slug);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_status ON vehicles(dealer_slug, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_price_eur ON vehicles(price_eur);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

-- ══════════════════════════════════════════════════════════════════
-- 3. ParcOS Mail Hub — Enterprise Hybrid Email Engine (Sprint 1)
-- Invariante: Zero-Daemon VPS • S3-First • Idempotență RFC 2822
-- ══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabel Utilizatori / Personal ParcOS
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_slug  TEXT NOT NULL DEFAULT 'rxm',
  email        VARCHAR(320) NOT NULL UNIQUE,
  full_name    VARCHAR(200) NOT NULL,
  role         VARCHAR(50) NOT NULL DEFAULT 'dealer_admin',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_dealer_slug ON users(dealer_slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Căsuțe poștale per angajat (PMH-101)
CREATE TABLE IF NOT EXISTS mail_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id    TEXT NOT NULL,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  email        VARCHAR(320) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  role         VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN','SALES','MECHANIC','FINANCE','SUPPORT')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_mail_accounts_dealer_email UNIQUE (dealer_id, email)
);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_dealer ON mail_accounts(dealer_id);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_email  ON mail_accounts(email);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_active ON mail_accounts(dealer_id, is_active);

-- Fire de conversație grupate per client / vehicul (PMH-101)
CREATE TABLE IF NOT EXISTS mail_threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id           TEXT NOT NULL,
  assigned_account_id UUID REFERENCES mail_accounts(id) ON DELETE SET NULL,
  vehicle_id          TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  subject             TEXT NOT NULL,
  customer_email      VARCHAR(320) NOT NULL,
  customer_name       VARCHAR(200),
  status              VARCHAR(30) NOT NULL DEFAULT 'UNREAD'
                      CHECK (status IN ('UNREAD','READ','PENDING_OFFER','OFFER_SENT','RESERVED','ARCHIVED')),
  last_message_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mail_threads_dealer       ON mail_threads(dealer_id);
CREATE INDEX IF NOT EXISTS idx_mail_threads_status       ON mail_threads(dealer_id, status);
CREATE INDEX IF NOT EXISTS idx_mail_threads_vehicle      ON mail_threads(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mail_threads_customer     ON mail_threads(customer_email);
CREATE INDEX IF NOT EXISTS idx_mail_threads_last_msg     ON mail_threads(dealer_id, last_message_at DESC);

-- Mesaje individuale cu idempotență garantată pe RFC 2822 Message-ID (PMH-101)
CREATE TABLE IF NOT EXISTS mail_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES mail_threads(id) ON DELETE CASCADE,
  message_id  VARCHAR(998) NOT NULL,
  direction   VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND')),
  sender      VARCHAR(320) NOT NULL,
  recipient   VARCHAR(320) NOT NULL,
  body_html   TEXT,
  body_text   TEXT,
  s3_key      VARCHAR(1000),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_mail_messages_message_id UNIQUE (message_id)
);
CREATE INDEX IF NOT EXISTS idx_mail_messages_thread    ON mail_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_created   ON mail_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_messages_msg_id    ON mail_messages(message_id);

-- Atașamente (S3 temp + Drive Vault permanent) (PMH-101 / PMH-104)
CREATE TABLE IF NOT EXISTS mail_attachments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     UUID NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
  file_name      VARCHAR(500) NOT NULL,
  mime_type      VARCHAR(200) NOT NULL,
  file_size      BIGINT NOT NULL,
  storage_driver VARCHAR(20) NOT NULL CHECK (storage_driver IN ('S3_TEMP','GDRIVE_VAULT')),
  storage_key    VARCHAR(1000) NOT NULL,
  is_encrypted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_message ON mail_attachments(message_id);

-- Abonamente Web Push VAPID per angajat (PMH-101)
CREATE TABLE IF NOT EXISTS dealer_push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh_key   TEXT NOT NULL,
  auth_key     TEXT NOT NULL,
  user_agent   VARCHAR(500),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dealer_push_account_endpoint UNIQUE (account_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_sub_account ON dealer_push_subscriptions(account_id);

-- Audit Log ștergeri GDPR (PMH-101)
CREATE TABLE IF NOT EXISTS mail_gdpr_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id    TEXT NOT NULL,
  action       VARCHAR(50) NOT NULL,
  target_id    UUID NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata     JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_dealer    ON mail_gdpr_audit_log(dealer_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_performed ON mail_gdpr_audit_log(performed_at DESC);

-- Listă Supresie SES Bounces & Complaints (PMH-106)
CREATE TABLE IF NOT EXISTS mail_suppression_list (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(320) NOT NULL UNIQUE,
  reason     VARCHAR(20) NOT NULL CHECK (reason IN ('HARD_BOUNCE','COMPLAINT','MANUAL')),
  dealer_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppression_email ON mail_suppression_list(email);

-- Dead Letter Queue (DLQ)
CREATE TABLE IF NOT EXISTS mail_parse_failures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    VARCHAR(998),
  s3_key        VARCHAR(1000),
  error_message TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parse_failures_created ON mail_parse_failures(created_at DESC);

