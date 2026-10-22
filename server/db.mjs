/**
 * RXM Automobile — Self-Hosted PostgreSQL Database Client & Repository
 * Powered by postgres.js • Invariantă TVA: Strict 21% (VAT_RATE = 0.21)
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NETCUP_DEFAULT_PG = 'postgres://postgres:O1MLK6Ezk4Y9IxEC0hwndUS7LDIijuUjZ76sDLPpHWAL55tsM76pokKe2vxdg1UR@6fezufnklecoapemrupsqpxh:5432/parcos';
const DATABASE_URL = process.env.DATABASE_URL || (
  process.env.NODE_ENV === 'production'
    ? NETCUP_DEFAULT_PG
    : 'postgres://postgres:postgres@localhost:5432/rxm_automobile'
);

let sqlClient = null;

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {}, // Ignoră spam-ul de notificări din PG
    });
  }
  return sqlClient;
}

/**
 * Inițializează structura bazei de date și efectuează auto-seeding la prima pornire
 */
export async function initDatabase() {
  const sql = getSql();
  try {
    // 0. Inițializare tabelă dealeri & migrare multi-tenant (DealerOS)
    await sql`
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
    `;
    await sql`ALTER TABLE dealers ADD COLUMN IF NOT EXISTS domain VARCHAR(150) UNIQUE;`;
    await sql`ALTER TABLE dealers ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;`;
    await sql`ALTER TABLE dealers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dealers_domain ON dealers(domain);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dealers_is_active ON dealers(is_active);`;

    // Auto-seeding dealeri impliciți (RXM, MPI Auto, Top Auto)
    await sql`
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
    `;

    // 1. Inițializare tabelă vehicule
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id                  TEXT          PRIMARY KEY,
        dealer_slug         TEXT          NOT NULL DEFAULT 'rxm',
        stock_number        TEXT,
        brand               TEXT          NOT NULL,
        model               TEXT          NOT NULL,
        version_trim        TEXT,
        year                INTEGER       NOT NULL,
        mileage_km          INTEGER       NOT NULL,
        price_eur           NUMERIC(12,2) NOT NULL,
        vat_deductible      BOOLEAN       DEFAULT FALSE NOT NULL,
        vat_rate            NUMERIC(4,2)  DEFAULT 0.21 NOT NULL,
        fuel_type           TEXT          NOT NULL,
        transmission        TEXT          NOT NULL,
        power_hp            INTEGER       DEFAULT 0,
        engine_cc           INTEGER       DEFAULT 0,
        body_type           TEXT          DEFAULT 'SUV',
        drivetrain          TEXT          DEFAULT 'Față',
        color               TEXT          DEFAULT '',
        vin                 TEXT          DEFAULT '',
        is_vin_public       BOOLEAN       DEFAULT FALSE,
        doc_origin_country  TEXT          DEFAULT 'RO',
        warranty_months     INTEGER       DEFAULT 12,
        status              TEXT          NOT NULL DEFAULT 'in_stock',
        stock_entry_date    TEXT,
        images              JSONB         DEFAULT '[]'::jsonb,
        video_url           TEXT,
        tiktok_url          TEXT,
        tiktok_views        TEXT,
        is_deal_of_week     BOOLEAN       DEFAULT FALSE,
        is_pinned_to_top    BOOLEAN       DEFAULT FALSE,
        old_price_eur       NUMERIC(12,2),
        deal_badge_text     TEXT,
        features            JSONB         DEFAULT '{"safety":[],"comfort":[],"multimedia":[]}'::jsonb,
        equipment_sheet_text TEXT,
        description         TEXT,
        raw_data            JSONB         DEFAULT '{}'::jsonb,
        created_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL,
        updated_at          TIMESTAMPTZ   DEFAULT NOW() NOT NULL
      );
    `;

    const countResult = await sql`SELECT count(*)::int AS count FROM vehicles WHERE dealer_slug = 'rxm'`;
    if (countResult[0]?.count === 0) {
      console.log('📦 [DB] Baza de date este goală. Rulăm auto-seeding din seeds.json...');
      const seedsPath = path.join(__dirname, 'seeds.json');
      if (fs.existsSync(seedsPath)) {
        const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
        for (const car of seeds) {
          await upsertVehicle(car, 'rxm');
        }
        console.log(`✅ [DB] Auto-seeding finalizat cu succes: ${seeds.length} vehicule inserate.`);
      }
    }

    // Inițializare structură ParcOS Mail Hub (Sprint 1: PMH-101 / PMH-106)
    await initMailHubSchema();
  } catch (err) {
    console.warn('[DB Init] Warning la verificarea conexiunii PostgreSQL:', err.message);
  }
}

/**
 * Inițializează tabelele modulului ParcOS Mail Hub (Enterprise Email Hub)
 */
export async function initMailHubSchema() {
  const sql = getSql();
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
    await sql`
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
    `;
    await sql`
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
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_accounts_dealer ON mail_accounts(dealer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_accounts_email ON mail_accounts(email);`;
    await sql`
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
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_threads_dealer ON mail_threads(dealer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_threads_status ON mail_threads(dealer_id, status);`;
    await sql`
      CREATE TABLE IF NOT EXISTS mail_messages (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id   UUID NOT NULL REFERENCES mail_threads(id) ON DELETE CASCADE,
        message_id  VARCHAR(998) NOT NULL,
        ses_message_id VARCHAR(500),
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
    `;
    await sql`ALTER TABLE mail_messages ADD COLUMN IF NOT EXISTS ses_message_id VARCHAR(500);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_messages_thread ON mail_messages(thread_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_messages_ses_id ON mail_messages(ses_message_id);`;
    await sql`
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
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_attachments_message ON mail_attachments(message_id);`;
    await sql`
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
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mail_gdpr_audit_log (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dealer_id    TEXT NOT NULL,
        action       VARCHAR(50) NOT NULL,
        target_id    UUID NOT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata     JSONB DEFAULT '{}'::jsonb
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mail_suppression_list (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email      VARCHAR(320) NOT NULL UNIQUE,
        reason     VARCHAR(20) NOT NULL CHECK (reason IN ('HARD_BOUNCE','COMPLAINT','MANUAL')),
        dealer_id  TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mail_parse_failures (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id    VARCHAR(998),
        s3_key        VARCHAR(1000),
        error_message TEXT,
        retry_count   INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mail_domains (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dealer_id            TEXT NOT NULL,
        domain               VARCHAR(255) NOT NULL,
        verification_status  VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        dkim_status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        spf_status           VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        dkim_tokens          JSONB DEFAULT '[]'::jsonb,
        spf_record           TEXT,
        mx_record            TEXT,
        is_cloudflare_synced BOOLEAN NOT NULL DEFAULT FALSE,
        cloudflare_zone_id   VARCHAR(100),
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_mail_domains_dealer_domain UNIQUE (dealer_id, domain)
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_domains_dealer ON mail_domains(dealer_id);`;

    // 0.7 Migrație mail_accounts: alias, domain, rol HR_PAYROLL
    try {
      await sql`ALTER TABLE mail_accounts ADD COLUMN IF NOT EXISTS alias TEXT;`;
      await sql`ALTER TABLE mail_accounts ADD COLUMN IF NOT EXISTS domain TEXT;`;
      await sql`ALTER TABLE mail_accounts DROP CONSTRAINT IF EXISTS mail_accounts_role_check;`;
      await sql`ALTER TABLE mail_accounts ADD CONSTRAINT mail_accounts_role_check CHECK (role IN ('ADMIN','SALES','MECHANIC','FINANCE','SUPPORT','HR_PAYROLL'));`;
    } catch (e) {
      // Ignoră dacă DB mock sau constraint deja setat
    }

    // 0.8 Tabel abonamente Web Push (VAPID / PWA Mobile)
    await sql`
      CREATE TABLE IF NOT EXISTS mail_push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES mail_accounts(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mail_push_account ON mail_push_subscriptions(account_id);`;

    // Auto-seeding căsuțe poștale angajați / agenți showroom (PMH-304)
    const rxmAccounts = await sql`SELECT count(*)::int AS count FROM mail_accounts WHERE dealer_id = 'rxm'`;
    if (rxmAccounts[0]?.count === 0) {
      await sql`
        INSERT INTO mail_accounts (dealer_id, email, display_name, role, is_active)
        VALUES 
          ('rxm', 'contact@rxmautomobile.ro', 'Mădălina (Finanțare & Admin)', 'ADMIN', TRUE),
          ('rxm', 'robert@rxmautomobile.ro', 'Robert (Showroom & Vânzări)', 'SALES', TRUE)
        ON CONFLICT (dealer_id, email) DO NOTHING
      `;
      console.log('✅ [DB] Auto-seeding căsuțe angajați RXM Automobile finalizat (Mădălina & Robert).');
    }

    const mpiAccounts = await sql`SELECT count(*)::int AS count FROM mail_accounts WHERE dealer_id = 'mpi'`;
    if (mpiAccounts[0]?.count === 0) {
      await sql`
        INSERT INTO mail_accounts (dealer_id, email, display_name, role, is_active)
        VALUES 
          ('mpi', 'contact@mpiauto.ro', 'Dan Morar (Lead Closer)', 'SALES', TRUE),
          ('mpi', 'andrei@mpiauto.ro', 'Andrei C. (Consilier Vânzări)', 'SALES', TRUE),
          ('mpi', 'alexandru@mpiauto.ro', 'Alexandru P. (Consilier Vânzări)', 'SALES', TRUE)
        ON CONFLICT (dealer_id, email) DO NOTHING
      `;
      console.log('✅ [DB] Auto-seeding căsuțe angajați MPI Auto finalizat (Echipa de vânzări).');
    }
  } catch (err) {
    console.warn('[DB Init Mail Hub] Eroare la inițializarea schemelor ParcOS Mail Hub:', err.message);
  }
}


/**
 * Asigură că toate câmpurile JSON (images, features, raw_data) sunt obiecte/array-uri JS native,
 * prevenind bug-ul de dublă serializare sau pierdere de date la clienți.
 */
export function sanitizeVehicleRow(row) {
  if (!row) return row;
  let images = row.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  let features = row.features;
  if (typeof features === 'string') {
    try { features = JSON.parse(features); } catch { features = { safety: [], comfort: [], multimedia: [] }; }
  }
  let rawData = row.raw_data;
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch { rawData = {}; }
  }
  return {
    ...row,
    images: Array.isArray(images) ? images : [],
    features: (features && typeof features === 'object') ? features : { safety: [], comfort: [], multimedia: [] },
    raw_data: (rawData && typeof rawData === 'object') ? rawData : {},
  };
}

/**
 * Sanitizare strictă pentru Showroom-ul Public:
 * Elimină categoric raw_data, prețurile de achiziție, cheltuielile, notele interne și jurnalul de audit.
 * Maschează seria VIN dacă nu este marcată explicit ca publică.
 */
export function sanitizePublicVehicleRow(row) {
  if (!row) return row;
  const sanitized = sanitizeVehicleRow(row);
  delete sanitized.raw_data;

  // Mascare server-side a seriei VIN
  if (!sanitized.is_vin_public && sanitized.vin && sanitized.vin.length >= 7) {
    sanitized.vin = `${sanitized.vin.substring(0, 7)}**********`;
  } else if (!sanitized.is_vin_public) {
    sanitized.vin = '';
  }

  return sanitized;
}

/**
 * Returnează vehiculele publice din showroom (Read-Only)
 * SELECT strict pe coloanele de catalog — zero date financiare interne expuse.
 */
export async function getAllPublicVehicles(dealerSlug = 'rxm') {
  const sql = getSql();
  const rows = await sql`
    SELECT 
      id, dealer_slug, stock_number, brand, model, version_trim, year, mileage_km,
      price_eur, vat_deductible, vat_rate, fuel_type, transmission, power_hp, engine_cc,
      body_type, drivetrain, color, vin, is_vin_public, doc_origin_country, warranty_months,
      status, stock_entry_date, images, video_url, tiktok_url, tiktok_views,
      is_deal_of_week, is_pinned_to_top, old_price_eur, deal_badge_text,
      features, equipment_sheet_text, description, created_at, updated_at
    FROM vehicles 
    WHERE dealer_slug = ${dealerSlug} 
    ORDER BY created_at DESC
  `;
  return rows.map(sanitizePublicVehicleRow);
}

/**
 * Returnează un vehicul public după ID (fără raw_data)
 */
export async function getPublicVehicleById(id, dealerSlug = 'rxm') {
  const sql = getSql();
  const rows = await sql`
    SELECT 
      id, dealer_slug, stock_number, brand, model, version_trim, year, mileage_km,
      price_eur, vat_deductible, vat_rate, fuel_type, transmission, power_hp, engine_cc,
      body_type, drivetrain, color, vin, is_vin_public, doc_origin_country, warranty_months,
      status, stock_entry_date, images, video_url, tiktok_url, tiktok_views,
      is_deal_of_week, is_pinned_to_top, old_price_eur, deal_badge_text,
      features, equipment_sheet_text, description, created_at, updated_at
    FROM vehicles 
    WHERE id = ${id} AND dealer_slug = ${dealerSlug}
    LIMIT 1
  `;
  return rows[0] ? sanitizePublicVehicleRow(rows[0]) : null;
}

/**
 * Returnează toate vehiculele cu datele complete pentru Administrare (Strict Protejat)
 */
export async function getAllAdminVehicles(dealerSlug = 'rxm') {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM vehicles 
    WHERE dealer_slug = ${dealerSlug} 
    ORDER BY created_at DESC
  `;
  return rows.map(sanitizeVehicleRow);
}

/**
 * Returnează un vehicul cu datele complete pentru Administrare (Strict Protejat)
 */
export async function getAdminVehicleById(id, dealerSlug = 'rxm') {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM vehicles 
    WHERE id = ${id} AND dealer_slug = ${dealerSlug}
    LIMIT 1
  `;
  return rows[0] ? sanitizeVehicleRow(rows[0]) : null;
}

// Aliasuri de compatibilitate retroactivă: getAllVehicles folosește implicit versiunea publică securizată
export const getAllVehicles = getAllPublicVehicles;
export const getVehicleById = getPublicVehicleById;

/**
 * Salvează sau actualizează un vehicul (Strict TVA 21%)
 */
export async function upsertVehicle(car, dealerSlug = 'rxm') {
  const sql = getSql();

  const vatRate = 0.21;
  const rawPrice = car.priceEur !== undefined ? car.priceEur : car.price_eur;
  const priceEur = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const rawMileage = car.mileageKm !== undefined ? car.mileageKm : car.mileage_km;
  const mileageKm = typeof rawMileage === 'number' ? rawMileage : Number(rawMileage) || 0;
  const vatDeductible = car.vatDeductible !== undefined ? !!car.vatDeductible : !!car.vat_deductible;

  const rawPowerHp = car.powerHp !== undefined ? car.powerHp : car.power_hp;
  const powerHp = rawPowerHp !== undefined && rawPowerHp !== null ? (Number(rawPowerHp) || 0) : 0;
  const rawEngineCc = car.engineCc !== undefined ? car.engineCc : car.engine_cc;
  const engineCc = rawEngineCc !== undefined && rawEngineCc !== null ? (Number(rawEngineCc) || 0) : 0;
  const stockNumber = car.stockNumber || car.stock_number || null;
  const versionTrim = car.versionTrim || car.version_trim || null;
  const year = Number(car.year) || new Date().getFullYear();
  const fuelType = car.fuelType || car.fuel_type || 'Diesel';
  const transmission = car.transmission || 'Automată';
  const bodyType = car.bodyType || car.body_type || 'SUV';
  const drivetrain = car.drivetrain || 'Față';
  const color = car.color || '';
  const vin = car.vin || '';
  const isVinPublic = car.isVinPublic !== undefined ? !!car.isVinPublic : !!car.is_vin_public;
  const docOriginCountry = car.docOriginCountry || car.doc_origin_country || 'RO';
  const warrantyMonths = car.warrantyMonths !== undefined ? car.warrantyMonths : (car.warranty_months || 12);
  const status = car.status || 'in_stock';
  const stockEntryDate = car.stockEntryDate || car.stock_entry_date || null;
  const videoUrl = car.videoUrl || car.video_url || null;
  const tiktokUrl = car.tiktokUrl || car.tiktok_url || null;
  const tiktokViews = car.tiktokViews !== undefined ? car.tiktokViews : (car.tiktok_views || null);
  const isDealOfWeek = car.isDealOfWeek !== undefined ? !!car.isDealOfWeek : !!car.is_deal_of_week;
  const isPinnedToTop = car.isPinnedToTop !== undefined ? !!car.isPinnedToTop : !!car.is_pinned_to_top;
  const rawOldPriceEur = car.oldPriceEur !== undefined ? car.oldPriceEur : car.old_price_eur;
  const oldPriceEur = rawOldPriceEur ? Number(rawOldPriceEur) : null;
  const dealBadgeText = car.dealBadgeText || car.deal_badge_text || null;
  const equipmentSheetText = car.equipmentSheetText || car.equipment_sheet_text || null;
  const description = car.description || null;
  const images = car.images;
  const features = car.features;

  const {
    id,
    ...rawDataRest
  } = car;

  let cleanImages = images;
  if (typeof cleanImages === 'string') {
    try { cleanImages = JSON.parse(cleanImages); } catch { cleanImages = []; }
  }
  if (!Array.isArray(cleanImages)) cleanImages = [];

  let cleanFeatures = features;
  if (typeof cleanFeatures === 'string') {
    try { cleanFeatures = JSON.parse(cleanFeatures); } catch { cleanFeatures = { safety: [], comfort: [], multimedia: [] }; }
  }
  if (!cleanFeatures || typeof cleanFeatures !== 'object') {
    cleanFeatures = { safety: [], comfort: [], multimedia: [] };
  }

  // 🛡️ Protecție date financiare & audit log: prevenire ștergere accidentală la actualizări parțiale
  const existingRows = await sql`SELECT raw_data, vin FROM vehicles WHERE id = ${id} AND dealer_slug = ${dealerSlug} LIMIT 1`;
  const existingRaw = (existingRows[0]?.raw_data && typeof existingRows[0].raw_data === 'object') ? existingRows[0].raw_data : {};
  
  let cleanVin = vin || '';
  if (cleanVin.includes('***') && existingRows[0]?.vin) {
    cleanVin = existingRows[0].vin;
  }

  const mergedAuditLog = (Array.isArray(car.auditLog) && car.auditLog.length > 0) 
    ? car.auditLog 
    : (existingRaw.auditLog || []);

  const mergedExpenses = (Array.isArray(car.expenses) && car.expenses.length > 0)
    ? car.expenses
    : (existingRaw.expenses || []);

  const purchasePriceEur = car.purchasePriceEur !== undefined
    ? car.purchasePriceEur
    : (existingRaw.purchasePriceEur || null);

  const rawData = {
    ...existingRaw,
    ...rawDataRest,
    purchasePriceEur,
    auditLog: mergedAuditLog,
    expenses: mergedExpenses,
    autolicitSync: car.autolicitSync !== undefined ? car.autolicitSync : (existingRaw.autolicitSync || null),
  };
  let cleanRawData = rawData;
  if (typeof cleanRawData === 'string') {
    try { cleanRawData = JSON.parse(cleanRawData); } catch { cleanRawData = {}; }
  }

  await sql`
    INSERT INTO vehicles (
      id, dealer_slug, stock_number, brand, model, version_trim, year, mileage_km,
      price_eur, vat_deductible, vat_rate, fuel_type, transmission, power_hp, engine_cc,
      body_type, drivetrain, color, vin, is_vin_public, doc_origin_country, warranty_months,
      status, stock_entry_date, images, video_url, tiktok_url, tiktok_views,
      is_deal_of_week, is_pinned_to_top, old_price_eur, deal_badge_text,
      features, equipment_sheet_text, description, raw_data, updated_at
    ) VALUES (
      ${id}, ${dealerSlug}, ${stockNumber || null}, ${car.brand || ''}, ${car.model || ''}, ${versionTrim || null},
      ${Number(year) || new Date().getFullYear()}, ${Number(mileageKm) || 0}, ${priceEur}, ${vatDeductible},
      ${vatRate}, ${fuelType || 'Diesel'}, ${transmission || 'Automată'}, ${Number(powerHp) || 0}, ${Number(engineCc) || 0},
      ${bodyType || 'SUV'}, ${drivetrain || 'Față'}, ${color || ''}, ${cleanVin}, ${!!isVinPublic},
      ${docOriginCountry || 'RO'}, ${Number(warrantyMonths) || 12}, ${status || 'in_stock'}, ${stockEntryDate || null},
      ${sql.json(cleanImages)}, ${videoUrl || null}, ${tiktokUrl || null}, ${tiktokViews || null},
      ${!!isDealOfWeek}, ${!!isPinnedToTop}, ${oldPriceEur ? Number(oldPriceEur) : null}, ${dealBadgeText || null},
      ${sql.json(cleanFeatures)}, ${equipmentSheetText || null}, ${description || null},
      ${sql.json(cleanRawData)}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      stock_number = EXCLUDED.stock_number,
      brand = EXCLUDED.brand,
      model = EXCLUDED.model,
      version_trim = EXCLUDED.version_trim,
      year = EXCLUDED.year,
      mileage_km = EXCLUDED.mileage_km,
      price_eur = EXCLUDED.price_eur,
      vat_deductible = EXCLUDED.vat_deductible,
      vat_rate = EXCLUDED.vat_rate,
      fuel_type = EXCLUDED.fuel_type,
      transmission = EXCLUDED.transmission,
      power_hp = EXCLUDED.power_hp,
      engine_cc = EXCLUDED.engine_cc,
      body_type = EXCLUDED.body_type,
      drivetrain = EXCLUDED.drivetrain,
      color = EXCLUDED.color,
      vin = EXCLUDED.vin,
      is_vin_public = EXCLUDED.is_vin_public,
      doc_origin_country = EXCLUDED.doc_origin_country,
      warranty_months = EXCLUDED.warranty_months,
      status = EXCLUDED.status,
      stock_entry_date = EXCLUDED.stock_entry_date,
      images = EXCLUDED.images,
      video_url = EXCLUDED.video_url,
      tiktok_url = EXCLUDED.tiktok_url,
      tiktok_views = EXCLUDED.tiktok_views,
      is_deal_of_week = EXCLUDED.is_deal_of_week,
      is_pinned_to_top = EXCLUDED.is_pinned_to_top,
      old_price_eur = EXCLUDED.old_price_eur,
      deal_badge_text = EXCLUDED.deal_badge_text,
      features = EXCLUDED.features,
      equipment_sheet_text = EXCLUDED.equipment_sheet_text,
      description = EXCLUDED.description,
      raw_data = EXCLUDED.raw_data,
      updated_at = NOW()
  `;

  const updatedRow = await getAdminVehicleById(id, dealerSlug);
  return updatedRow || car;
}

/**
 * Șterge un vehicul din baza de date
 */
export async function deleteVehicle(id, dealerSlug = 'rxm') {
  const sql = getSql();
  await sql`
    DELETE FROM vehicles 
    WHERE id = ${id} AND dealer_slug = ${dealerSlug}
  `;
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// DEALER OS — MULTI-TENANT REPOSITORY (PMH-T01 / PMH-T02)
// ══════════════════════════════════════════════════════════════════

/**
 * Preluare profil dealer după slug (ex: 'rxm', 'mpi_auto')
 */
export async function getDealerBySlug(slug) {
  const sql = getSql();
  try {
    const rows = await sql`
      SELECT * FROM dealers WHERE slug = ${slug} AND is_active = TRUE LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[DB] getDealerBySlug error:', err.message);
    return null;
  }
}

/**
 * Rezoluție dinamică profil dealer după domeniu web (ex: 'rxmautomobile.ro', 'mpiauto.ro')
 */
export async function getDealerByDomain(domain) {
  const sql = getSql();
  try {
    const cleanDomain = String(domain || '').toLowerCase().replace(/:\d+$/, '').trim();
    const rows = await sql`
      SELECT * FROM dealers WHERE lower(domain) = ${cleanDomain} AND is_active = TRUE LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[DB] getDealerByDomain error:', err.message);
    return null;
  }
}

/**
 * Listare toți dealerii activi din ecosistem
 */
export async function getAllDealers() {
  const sql = getSql();
  try {
    return await sql`SELECT * FROM dealers ORDER BY id ASC`;
  } catch (err) {
    console.warn('[DB] getAllDealers error:', err.message);
    return [];
  }
}

/**
 * Adăugare sau actualizare profil dealer (idempotent ON CONFLICT slug)
 */
export async function upsertDealer(data) {
  const sql = getSql();
  const slug = String(data.slug || '').trim().toLowerCase();
  if (!slug) throw new Error('Dealer slug este obligatoriu');

  const name = String(data.name || '').trim();
  const domain = data.domain ? String(data.domain).trim().toLowerCase() : null;
  const phonePrimary = String(data.phonePrimary || data.phone_primary || '').trim();
  const phoneSecondary = data.phoneSecondary || data.phone_secondary || null;
  const whatsappNumber = String(data.whatsappNumber || data.whatsapp_number || phonePrimary).trim();
  const email = String(data.email || '').trim().toLowerCase();
  const addressStreet = String(data.addressStreet || data.address_street || data.address || '').trim();
  const city = String(data.city || 'Cluj-Napoca').trim();
  const county = String(data.county || 'Cluj').trim();
  const vatNumber = data.vatNumber || data.vat_number || data.cui || null;
  const openingHours = data.openingHours || data.opening_hours || null;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
  const config = (data.config && typeof data.config === 'object') ? data.config : {};

  const rows = await sql`
    INSERT INTO dealers (
      name, slug, domain, phone_primary, phone_secondary, whatsapp_number, email,
      address_street, city, county, vat_number, opening_hours, is_active, config
    ) VALUES (
      ${name}, ${slug}, ${domain}, ${phonePrimary}, ${phoneSecondary}, ${whatsappNumber}, ${email},
      ${addressStreet}, ${city}, ${county}, ${vatNumber}, ${openingHours}, ${isActive}, ${sql.json(config)}
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      domain = COALESCE(EXCLUDED.domain, dealers.domain),
      phone_primary = EXCLUDED.phone_primary,
      phone_secondary = EXCLUDED.phone_secondary,
      whatsapp_number = EXCLUDED.whatsapp_number,
      email = EXCLUDED.email,
      address_street = EXCLUDED.address_street,
      city = EXCLUDED.city,
      county = EXCLUDED.county,
      vat_number = EXCLUDED.vat_number,
      opening_hours = EXCLUDED.opening_hours,
      is_active = EXCLUDED.is_active,
      config = EXCLUDED.config
    RETURNING *
  `;
  return rows[0];
}

