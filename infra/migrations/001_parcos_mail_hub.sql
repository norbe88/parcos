-- ════════════════════════════════════════════════════════════════════════════════
-- ParcOS Mail Hub — Migration 001: Data Model & Infrastructure Schema
-- Versiune: 1.1.0 • Sprint 1 (PMH-101 / PMH-106)
-- Target: Netcup VPS PostgreSQL (152.53.158.65) / parcos-db
-- Invariante: Zero-Daemon VPS • S3-First • Idempotență RFC 2822 • Strict 21% TVA
-- ════════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. Tabel Utilizatori / Personal ParcOS (suport audit log & asignare conturi)
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_slug  TEXT NOT NULL DEFAULT 'rxm',
  email        VARCHAR(320) NOT NULL UNIQUE,
  full_name    VARCHAR(200) NOT NULL,
  role         VARCHAR(50) NOT NULL DEFAULT 'dealer_admin', -- dealer_admin, sales_agent, finance_consultant, mechanic
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_dealer_slug ON users(dealer_slug);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 1. Căsuțe poștale per angajat, legate de dealer (PMH-101)
-- Suportă mii de căsuțe nelimitate per dealer (ex: andrei@parc.ro, vanzari@parc.ro)
CREATE TABLE IF NOT EXISTS mail_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id    TEXT NOT NULL,                                       -- ID dealer sau dealer_slug (ex: 'rxm', 'mpi-auto', UUID)
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,        -- Opțional: angajat cu cont ParcOS
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

-- 2. Fire de conversație grupate per client / vehicul (PMH-101)
CREATE TABLE IF NOT EXISTS mail_threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id           TEXT NOT NULL,
  assigned_account_id UUID REFERENCES mail_accounts(id) ON DELETE SET NULL,
  vehicle_id          TEXT REFERENCES vehicles(id) ON DELETE SET NULL, -- Context auto detectat (RXM-XXXX sau VIN)
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

-- 3. Mesaje individuale cu idempotență garantată pe RFC 2822 Message-ID (PMH-101)
CREATE TABLE IF NOT EXISTS mail_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES mail_threads(id) ON DELETE CASCADE,
  message_id  VARCHAR(998) NOT NULL,                                -- RFC 2822 Message-ID header (ex: <uuid@domain.com>)
  direction   VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND')),
  sender      VARCHAR(320) NOT NULL,
  recipient   VARCHAR(320) NOT NULL,
  body_html   TEXT,
  body_text   TEXT,
  s3_key      VARCHAR(1000),                                        -- Cheie EML brut în S3 temp până la arhivare Drive
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_mail_messages_message_id UNIQUE (message_id)        -- CRITIC: Blochează duplicatele retransmisiilor SNS
);
CREATE INDEX IF NOT EXISTS idx_mail_messages_thread    ON mail_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_created   ON mail_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_messages_msg_id    ON mail_messages(message_id);

-- 4. Atașamente cu referință duală: S3 temp + Google Drive Vault permanent (PMH-101 / PMH-104)
CREATE TABLE IF NOT EXISTS mail_attachments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     UUID NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
  file_name      VARCHAR(500) NOT NULL,
  mime_type      VARCHAR(200) NOT NULL,
  file_size      BIGINT NOT NULL,
  storage_driver VARCHAR(20) NOT NULL CHECK (storage_driver IN ('S3_TEMP','GDRIVE_VAULT')),
  storage_key    VARCHAR(1000) NOT NULL,                             -- S3 Key SAU Google Drive File ID
  is_encrypted   BOOLEAN NOT NULL DEFAULT FALSE,                    -- True dacă payload-ul e criptat AES-256-GCM
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_message ON mail_attachments(message_id);

-- 5. Abonamente Web Push VAPID per angajat / dispozitiv (PMH-101 / PMH-402)
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

-- 6. Audit Log ștergeri și conformitate GDPR (PMH-101 / PMH-405)
CREATE TABLE IF NOT EXISTS mail_gdpr_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id    TEXT NOT NULL,
  action       VARCHAR(50) NOT NULL,                                 -- 'DELETE_THREAD', 'DELETE_ACCOUNT', 'EXPORT_DATA', 'PURGE_ATTACHMENT'
  target_id    UUID NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata     JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_dealer    ON mail_gdpr_audit_log(dealer_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_performed ON mail_gdpr_audit_log(performed_at DESC);

-- 7. Listă de Supresie Reputație SES (PMH-106: Hard Bounces & Complaints)
CREATE TABLE IF NOT EXISTS mail_suppression_list (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(320) NOT NULL UNIQUE,
  reason     VARCHAR(20) NOT NULL CHECK (reason IN ('HARD_BOUNCE','COMPLAINT','MANUAL')),
  dealer_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppression_email ON mail_suppression_list(email);

-- 8. Dead Letter Queue (DLQ) pentru eșecuri de parsare EML (PMH-201 Step 8)
CREATE TABLE IF NOT EXISTS mail_parse_failures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    VARCHAR(998),
  s3_key        VARCHAR(1000),
  error_message TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parse_failures_created ON mail_parse_failures(created_at DESC);
