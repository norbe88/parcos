import { pgTable, serial, text, integer, numeric, boolean, timestamp, varchar, uuid, jsonb, bigint } from 'drizzle-orm/pg-core';

// 1. Profil Dealer Auto
export const dealers = pgTable('dealers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  phonePrimary: varchar('phone_primary', { length: 30 }).notNull(),
  phoneSecondary: varchar('phone_secondary', { length: 30 }),
  whatsappNumber: varchar('whatsapp_number', { length: 30 }).notNull(),
  email: varchar('email', { length: 120 }).notNull(),
  addressStreet: text('address_street').notNull(),
  city: varchar('city', { length: 80 }).notNull(),
  county: varchar('county', { length: 80 }).notNull(),
  googleMapsUrl: text('google_maps_url'),
  openingHours: text('opening_hours'),
  vatNumber: varchar('vat_number', { length: 30 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Inventar Vehicule (Strict TVA 21%)
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  dealerId: integer('dealer_id').references(() => dealers.id).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 80 }).notNull(),
  model: varchar('model', { length: 80 }).notNull(),
  versionTrim: varchar('version_trim', { length: 120 }),
  year: integer('year').notNull(),
  mileageKm: integer('mileage_km').notNull(),
  
  // Regim Fiscal (Strict TVA 21%)
  priceEur: numeric('price_eur', { precision: 12, scale: 2 }).notNull(),
  vatDeductible: boolean('vat_deductible').default(false).notNull(),
  vatRate: numeric('vat_rate', { precision: 4, scale: 2 }).default('0.21').notNull(),
  
  // Specificații Motor & Transmisie
  fuelType: varchar('fuel_type', { length: 40 }).notNull(),
  transmission: varchar('transmission', { length: 40 }).notNull(),
  drivetrain: varchar('drivetrain', { length: 40 }).notNull(),
  engineCc: integer('engine_cc'),
  powerHp: integer('power_hp').notNull(),
  pollutionStandard: varchar('pollution_standard', { length: 30 }),
  
  // Caroserie & Culoare
  bodyType: varchar('body_type', { length: 50 }).notNull(),
  doors: integer('doors').default(5),
  seats: integer('seats').default(5),
  exteriorColor: varchar('exterior_color', { length: 60 }),
  interiorColor: varchar('interior_color', { length: 60 }),
  interiorMaterial: varchar('interior_material', { length: 60 }),
  
  // Garanție & Identificare
  vin: varchar('vin', { length: 17 }),
  warrantyMonths: integer('warranty_months').default(12),
  hasCertifiedKm: boolean('has_certified_km').default(true),
  
  // Stare Stoc
  status: varchar('status', { length: 30 }).default('in_stock').notNull(), // in_stock, reserved, sold
  videoUrl: text('video_url'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Imagini WebP Responsive
export const vehicleImages = pgTable('vehicle_images', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  originalUrl: text('original_url').notNull(),
  w480WebpUrl: text('w480_webp_url').notNull(),
  w960WebpUrl: text('w960_webp_url').notNull(),
  w1600WebpUrl: text('w1600_webp_url').notNull(),
  isCover: boolean('is_cover').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Dotări Vehicul
export const vehicleFeatures = pgTable('vehicle_features', {
  id: serial('id').primaryKey(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // safety, comfort, multimedia
  name: varchar('name', { length: 150 }).notNull(),
});

// ══════════════════════════════════════════════════════════════════
// 5. ParcOS Mail Hub — Enterprise Hybrid Email Engine (Sprint 1)
// ══════════════════════════════════════════════════════════════════

// Utilizatori / Personal ParcOS
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerSlug: text('dealer_slug').default('rxm').notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  role: varchar('role', { length: 50 }).default('dealer_admin').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Căsuțe poștale per angajat (PMH-101)
export const mailAccounts = pgTable('mail_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: text('dealer_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 320 }).notNull(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  role: varchar('role', { length: 30 }).notNull(), // ADMIN, SALES, MECHANIC, FINANCE, SUPPORT
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Fire de conversație per client / context vehicul (PMH-101)
export const mailThreads = pgTable('mail_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: text('dealer_id').notNull(),
  assignedAccountId: uuid('assigned_account_id').references(() => mailAccounts.id, { onDelete: 'set null' }),
  vehicleId: text('vehicle_id'), // context auto detectat (RXM-XXXX sau VIN)
  subject: text('subject').notNull(),
  customerEmail: varchar('customer_email', { length: 320 }).notNull(),
  customerName: varchar('customer_name', { length: 200 }),
  status: varchar('status', { length: 30 }).default('UNREAD').notNull(), // UNREAD, READ, PENDING_OFFER, OFFER_SENT, RESERVED, ARCHIVED
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Mesaje individuale cu idempotență RFC 2822 Message-ID (PMH-101)
export const mailMessages = pgTable('mail_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').references(() => mailThreads.id, { onDelete: 'cascade' }).notNull(),
  messageId: varchar('message_id', { length: 998 }).notNull().unique(), // RFC 2822
  direction: varchar('direction', { length: 10 }).notNull(), // INBOUND, OUTBOUND
  sender: varchar('sender', { length: 320 }).notNull(),
  recipient: varchar('recipient', { length: 320 }).notNull(),
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  s3Key: varchar('s3_key', { length: 1000 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Atașamente cu stocare hibridă (S3 temp + Google Drive Vault permanent) (PMH-101 / PMH-104)
export const mailAttachments = pgTable('mail_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => mailMessages.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 200 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  storageDriver: varchar('storage_driver', { length: 20 }).notNull(), // S3_TEMP, GDRIVE_VAULT
  storageKey: varchar('storage_key', { length: 1000 }).notNull(),
  isEncrypted: boolean('is_encrypted').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Abonamente Web Push VAPID per angajat (PMH-101)
export const dealerPushSubscriptions = pgTable('dealer_push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').references(() => mailAccounts.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dhKey: text('p256dh_key').notNull(),
  authKey: text('auth_key').notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Audit Log GDPR (PMH-101)
export const mailGdprAuditLog = pgTable('mail_gdpr_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: text('dealer_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
  performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').default('{}'),
});

// Listă de Supresie SES Bounces & Complaints (PMH-106)
export const mailSuppressionList = pgTable('mail_suppression_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  reason: varchar('reason', { length: 20 }).notNull(), // HARD_BOUNCE, COMPLAINT, MANUAL
  dealerId: text('dealer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Dead Letter Queue (DLQ)
export const mailParseFailures = pgTable('mail_parse_failures', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: varchar('message_id', { length: 998 }),
  s3Key: varchar('s3_key', { length: 1000 }),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

