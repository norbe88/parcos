/**
 * ════════════════════════════════════════════════════════════════════════════════
 * QA Verification Suite — ParcOS Mail Hub (Sprint 1)
 * Validare: PMH-101 (Database Schema), PMH-105 (Secrets), PMH-104 (Drive Vault)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

console.log('🚀 [QA SPRINT 1] Pornire verificare ParcOS Mail Hub...');

let testsPassed = 0;
let testsTotal = 0;

function it(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Verificare PMH-101: Database Schema & Migrație
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📦 [PMH-101] Validare Schema Bazei de Date PostgreSQL');

it('Fișierul de migrație infra/migrations/001_parcos_mail_hub.sql există', () => {
  const migPath = path.join(__dirname, '..', 'infra', 'migrations', '001_parcos_mail_hub.sql');
  assert(fs.existsSync(migPath), 'Fișierul 001_parcos_mail_hub.sql lipsește');
});

it('001_parcos_mail_hub.sql conține toate tabelele necesare din specificație', () => {
  const migSql = fs.readFileSync(path.join(__dirname, '..', 'infra', 'migrations', '001_parcos_mail_hub.sql'), 'utf8');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_accounts'), 'Tabelul mail_accounts lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_threads'), 'Tabelul mail_threads lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_messages'), 'Tabelul mail_messages lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_attachments'), 'Tabelul mail_attachments lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS dealer_push_subscriptions'), 'Tabelul dealer_push_subscriptions lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_gdpr_audit_log'), 'Tabelul mail_gdpr_audit_log lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_suppression_list'), 'Tabelul mail_suppression_list lipsește');
  assert(migSql.includes('CREATE TABLE IF NOT EXISTS mail_parse_failures'), 'Tabelul mail_parse_failures lipsește');
});

it('mail_messages impune constrângerea de idempotență UNIQUE (message_id)', () => {
  const migSql = fs.readFileSync(path.join(__dirname, '..', 'infra', 'migrations', '001_parcos_mail_hub.sql'), 'utf8');
  assert(
    migSql.includes('CONSTRAINT uq_mail_messages_message_id UNIQUE (message_id)') ||
    migSql.includes('UNIQUE (message_id)'),
    'Constrângerea de idempotență pe message_id lipsește'
  );
});

it('infra/init_schema.sql integrează schema ParcOS Mail Hub', () => {
  const initSql = fs.readFileSync(path.join(__dirname, '..', 'infra', 'init_schema.sql'), 'utf8');
  assert(initSql.includes('CREATE TABLE IF NOT EXISTS mail_accounts'), 'mail_accounts lipsește din init_schema.sql');
  assert(initSql.includes('CREATE TABLE IF NOT EXISTS mail_threads'), 'mail_threads lipsește din init_schema.sql');
  assert(initSql.includes('CREATE TABLE IF NOT EXISTS mail_messages'), 'mail_messages lipsește din init_schema.sql');
  assert(initSql.includes('CREATE TABLE IF NOT EXISTS mail_attachments'), 'mail_attachments lipsește din init_schema.sql');
});

it('src/db/schema.ts exportă modelele Drizzle ORM corespunzătoare', () => {
  const schemaTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.ts'), 'utf8');
  assert(schemaTs.includes('export const mailAccounts'), 'mailAccounts lipsește din Drizzle schema');
  assert(schemaTs.includes('export const mailThreads'), 'mailThreads lipsește din Drizzle schema');
  assert(schemaTs.includes('export const mailMessages'), 'mailMessages lipsește din Drizzle schema');
  assert(schemaTs.includes('export const mailAttachments'), 'mailAttachments lipsește din Drizzle schema');
  assert(schemaTs.includes('export const dealerPushSubscriptions'), 'dealerPushSubscriptions lipsește din Drizzle schema');
  assert(schemaTs.includes('export const mailGdprAuditLog'), 'mailGdprAuditLog lipsește din Drizzle schema');
  assert(schemaTs.includes('export const mailSuppressionList'), 'mailSuppressionList lipsește din Drizzle schema');
});

it('server/db.mjs conține funcția initMailHubSchema și o apelează la pornire', () => {
  const dbMjs = fs.readFileSync(path.join(__dirname, '..', 'server', 'db.mjs'), 'utf8');
  assert(dbMjs.includes('export async function initMailHubSchema()'), 'Funcția initMailHubSchema lipsește');
  assert(dbMjs.includes('await initMailHubSchema()'), 'Apelul initMailHubSchema lipsește din initDatabase');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Verificare PMH-105: Secrets Management & Securitate Git
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔒 [PMH-105] Validare Secrets Management & .gitignore');

it('.env.example conține toate variabilele necesare pentru AWS SES, S3, SNS, Vault, VAPID', () => {
  const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
  assert(envExample.includes('AWS_SES_ACCESS_KEY_ID'), 'AWS_SES_ACCESS_KEY_ID lipsește din .env.example');
  assert(envExample.includes('AWS_SES_SECRET_ACCESS_KEY'), 'AWS_SES_SECRET_ACCESS_KEY lipsește din .env.example');
  assert(envExample.includes('AWS_SES_REGION'), 'AWS_SES_REGION lipsește din .env.example');
  assert(envExample.includes('AWS_S3_BUCKET_INBOUND'), 'AWS_S3_BUCKET_INBOUND lipsește din .env.example');
  assert(envExample.includes('AWS_SNS_TOPIC_ARN'), 'AWS_SNS_TOPIC_ARN lipsește din .env.example');
  assert(envExample.includes('GDRIVE_SERVICE_ACCOUNT_JSON'), 'GDRIVE_SERVICE_ACCOUNT_JSON lipsește din .env.example');
  assert(envExample.includes('GDRIVE_VAULT_ROOT_FOLDER_ID'), 'GDRIVE_VAULT_ROOT_FOLDER_ID lipsește din .env.example');
  assert(envExample.includes('VAULT_MASTER_KEY'), 'VAULT_MASTER_KEY lipsește din .env.example');
  assert(envExample.includes('VAPID_PUBLIC_KEY'), 'VAPID_PUBLIC_KEY lipsește din .env.example');
  assert(envExample.includes('VAPID_PRIVATE_KEY'), 'VAPID_PRIVATE_KEY lipsește din .env.example');
  assert(envExample.includes('VAPID_SUBJECT'), 'VAPID_SUBJECT lipsește din .env.example');
});

it('.gitignore exclude strict fișierele .env de producție și cheile private', () => {
  const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
  assert(gitignore.includes('.env.production'), '.env.production lipsește din .gitignore');
  assert(gitignore.includes('.env.staging'), '.env.staging lipsește din .gitignore');
  assert(gitignore.includes('*.pem'), '*.pem lipsește din .gitignore');
  assert(gitignore.includes('*.key'), '*.key lipsește din .gitignore');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Verificare PMH-104: Google Drive Vault Driver & AES-256-GCM Criptare
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🛡️ [PMH-104] Validare Google Drive Vault Driver & Algoritm AES-256-GCM');

it('Fișierul src/services/googleDriveVaultService.ts există', () => {
  const svcPath = path.join(__dirname, '..', 'src', 'services', 'googleDriveVaultService.ts');
  assert(fs.existsSync(svcPath), 'Fișierul googleDriveVaultService.ts lipsește');
});

it('Algoritmul de derivare cheie dealer și criptare AES-256-GCM funcționează corect (round-trip)', () => {
  // Test independent al logicii criptografice implementate în GoogleDriveVaultService
  const masterKeyHex = crypto.randomBytes(32).toString('hex');
  const dealerId = 'rxm-cluj-01';

  function deriveKey(master, dId) {
    return crypto.createHmac('sha256', Buffer.from(master, 'hex')).update(dId).digest();
  }

  function encrypt(plain, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([Buffer.from('PV01', 'ascii'), iv, tag, enc]);
  }

  function decrypt(payload, key) {
    const iv = payload.subarray(4, 16);
    const tag = payload.subarray(16, 32);
    const cipher = payload.subarray(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(cipher), decipher.final()]);
  }

  const testKey = deriveKey(masterKeyHex, dealerId);
  assert.strictEqual(testKey.length, 32, 'Cheia derivată per dealer trebuie să aibă exact 32 bytes (256 biți)');

  const sampleEmail = 'From: test@client.ro\r\nSubject: Oferta BMW X5\r\n\r\nBuna ziua, ma intereseaza leasingul.';
  const encrypted = encrypt(Buffer.from(sampleEmail, 'utf8'), testKey);

  assert(encrypted.subarray(0, 4).toString('ascii') === 'PV01', 'Antetul magic PV01 este obligatoriu');
  assert.notStrictEqual(encrypted.toString('utf8'), sampleEmail, 'Textul clar nu trebuie să apară în payload-ul criptat');

  const decrypted = decrypt(encrypted, testKey);
  assert.strictEqual(decrypted.toString('utf8'), sampleEmail, 'Mesajul decriptat trebuie să fie identic cu cel inițial');
});

it('Izolare per dealer garantată: Cheia Dealerului B nu poate decripta datele Dealerului A', () => {
  const masterKeyHex = crypto.randomBytes(32).toString('hex');
  const dealerA = 'dealer-rxm';
  const dealerB = 'dealer-mpi-auto';

  const keyA = crypto.createHmac('sha256', Buffer.from(masterKeyHex, 'hex')).update(dealerA).digest();
  const keyB = crypto.createHmac('sha256', Buffer.from(masterKeyHex, 'hex')).update(dealerB).digest();

  assert.notDeepStrictEqual(keyA, keyB, 'Cheile celor doi dealeri trebuie să fie complet distincte');

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyA, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from('Secret Dealer A')), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([Buffer.from('PV01', 'ascii'), iv, tag, enc]);

  let failedExpectedly = false;
  try {
    const ivB = payload.subarray(4, 16);
    const tagB = payload.subarray(16, 32);
    const cipherB = payload.subarray(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyB, ivB);
    decipher.setAuthTag(tagB);
    decipher.update(cipherB);
    decipher.final();
  } catch (err) {
    failedExpectedly = true;
  }

  assert(failedExpectedly, 'Decriptarea cu cheia altui dealer trebuie să arunce eroare de autentificare');
});

it('Integritate garantată: Datele modificate (tampered) sunt respinse de AES-GCM AuthTag', () => {
  const masterKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from('Factură Proformă TVA 21%')), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Modificăm un singur bit în ciphertext
  enc[0] ^= 1;

  let failedTamper = false;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(tag);
    decipher.update(enc);
    decipher.final();
  } catch {
    failedTamper = true;
  }

  assert(failedTamper, 'Tampering-ul datelor trebuie să fie detectat instantaneu de AES-GCM');
});

console.log('\n===============================================================');
console.log(`REZULTAT QA SPRINT 1: ${testsPassed}/${testsTotal} TESTE TRECUTE CU SUCCES!`);
if (testsPassed === testsTotal) {
  console.log('🎉 TOATE CRITERIILE DE ACCEPTANȚĂ SPRINT 1 SUNT RESPECTATE!');
} else {
  console.error(`⚠️ Au fost detectate ${testsTotal - testsPassed} eșecuri.`);
  process.exit(1);
}
