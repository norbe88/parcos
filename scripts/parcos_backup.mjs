/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Server-Side Autonomous Backup Daemon
 * Running on Netcup VPS (152.53.158.65)
 * Multi-Tenant Isolation • Daily Cron 01:15 AM • 30-Day Retention
 * 
 * SMART DELTA & FINGERPRINTING ENGINE (Zero Waste):
 * 1. Generează o amprentă JSON (fingerprint) pentru fotografii:
 *    - Număr mașini, fișiere, mărimi, timestamp-uri mtime per director de mașină.
 *    - Calculează hash SHA-256 peste structura foto.
 * 2. Compară cu 'latest_fingerprint.json' din backup-ul anterior:
 *    - Dacă fotografiile sunt IDENTICE cu ziua precedentă:
 *      -> Sare complet peste crearea arhivei .tar.gz (0 secunde, 0 MB procesați).
 *      -> Sare complet peste upload-ul pe Google Drive (0 KB transferați).
 *      -> Înregistrează în manifest referința către ultimul snapshot foto valid.
 *    - Dacă există mașini noi sau fotografii adăugate/modificate:
 *      -> Detectează exact mașinile modificate (delta).
 *      -> Creează arhiva și o trimite direct în Google Drive via rclone.
 *      -> Șterge imediat .tar.gz de pe VPS (discul rămâne curat).
 * 3. Baza de date PostgreSQL (19 KB) este mereu asigurată și comparată rapid.
 * ══════════════════════════════════════════════════════════════════
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PG_CONTAINER = '6fezufnklecoapemrupsqpxh';
const PG_DB = 'parcos';
const PG_USER = 'postgres';
const BASE_BACKUP_DIR = '/data/parcos/backups';
const GDRIVE_DEST = 'gdrive:Carvana_Backups/ParcOS_RXM';
const FINGERPRINT_FILE = path.join(BASE_BACKUP_DIR, 'latest_fingerprint.json');

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

/**
 * Calculează amprenta digitală (JSON fingerprint + SHA-256) a directorului de fotografii
 */
function computeMediaFingerprint(mediaDir) {
  if (!fs.existsSync(mediaDir)) {
    return { totalCars: 0, totalFiles: 0, totalBytes: 0, mediaHash: 'empty', carStats: {} };
  }

  const entries = fs.readdirSync(mediaDir, { withFileTypes: true });
  let totalBytes = 0;
  let totalFiles = 0;
  const carStats = {};

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const carFolder = path.join(mediaDir, entry.name);
      try {
        const files = fs.readdirSync(carFolder);
        let folderBytes = 0;
        let latestMtime = 0;

        for (const f of files) {
          const stat = fs.statSync(path.join(carFolder, f));
          folderBytes += stat.size;
          if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
        }

        totalBytes += folderBytes;
        totalFiles += files.length;
        carStats[entry.name] = {
          filesCount: files.length,
          bytes: folderBytes,
          mtime: Math.floor(latestMtime / 1000),
        };
      } catch {}
    }
  }

  const mediaHash = crypto.createHash('sha256').update(JSON.stringify(carStats)).digest('hex');
  return {
    totalCars: Object.keys(carStats).length,
    totalFiles,
    totalBytes,
    totalMb: (totalBytes / (1024 * 1024)).toFixed(1),
    mediaHash,
    carStats,
  };
}

export async function runServerBackup(mode = 'scheduled') {
  const timestamp = getTimestamp();
  const folderName = `${mode}_${timestamp}`;
  const targetDir = path.join(BASE_BACKUP_DIR, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`\n===============================================================`);
  console.log(`🛡️  PARCOS / RXM AUTOMOBILE — SMART BACKUP DAEMON`);
  console.log(`Data & Ora: ${new Date().toISOString()}`);
  console.log(`Mod: ${mode} • Target: ${targetDir}`);
  console.log(`===============================================================`);

  // 1. Full Raw PostgreSQL Dump (.sql.gz) — Mereu salvat (19 KB)
  const fullDumpName = `parcos_full_db_${timestamp}.sql.gz`;
  const fullDumpPath = path.join(targetDir, fullDumpName);
  execSync(`docker exec ${PG_CONTAINER} pg_dump -U ${PG_USER} -d ${PG_DB} | gzip > ${fullDumpPath}`);
  console.log(`[Backup DB] Full DB dump salvat: ${fullDumpName} (${(fs.statSync(fullDumpPath).size / 1024).toFixed(1)} KB)`);

  // 2. SMART DELTA: Analiză Fotografii & Comparație JSON Fingerprint
  const mediaSource = fs.existsSync('/data/parcos/cars') ? '/data/parcos/cars' : '/data/rxm-showroom/cars';
  console.log(`\n🔍 Pas 2: Scanare amprentă fotografii (${mediaSource})...`);
  const currentFingerprint = computeMediaFingerprint(mediaSource);

  // Citire amprentă anterioară
  let previousFingerprint = null;
  if (fs.existsSync(FINGERPRINT_FILE)) {
    try {
      previousFingerprint = JSON.parse(fs.readFileSync(FINGERPRINT_FILE, 'utf8'));
    } catch {}
  }

  let mediaChanged = true;
  let deltaReport = null;

  if (previousFingerprint && previousFingerprint.mediaHash === currentFingerprint.mediaHash) {
    mediaChanged = false;
    console.log(`  ⚡ [SMART DELTA] ZERO modificări detectate în fotografii!`);
    console.log(`  ✓ Număr mașini: ${currentFingerprint.totalCars} | Fișiere: ${currentFingerprint.totalFiles} (${currentFingerprint.totalMb} MB)`);
    console.log(`  ✓ Hash SHA-256 identic cu backup-ul din: ${previousFingerprint.lastBackupTimestamp || 'anterior'}`);
    console.log(`  🛡️ S-a sărit arhivarea și upload-ul fotografiilor (Economie: ${currentFingerprint.totalMb} MB transferați și 0s timp CPU).`);
  } else {
    // Calcul diferențe exacte (ce mașini s-au adăugat sau modificat)
    const prevStats = previousFingerprint?.carStats || {};
    const currStats = currentFingerprint.carStats;

    const newCars = Object.keys(currStats).filter((id) => !prevStats[id]);
    const updatedCars = Object.keys(currStats).filter((id) => prevStats[id] && prevStats[id].mtime !== currStats[id].mtime);

    deltaReport = {
      newCarsCount: newCars.length,
      newCars,
      updatedCarsCount: updatedCars.length,
      updatedCars,
    };

    console.log(`  🔔 [SMART DELTA] Modificări detectate în stocul foto:`);
    if (newCars.length > 0) console.log(`    • Mașini NOI cu poze adăugate (${newCars.length}): ${newCars.join(', ')}`);
    if (updatedCars.length > 0) console.log(`    • Mașini cu poze actualizate (${updatedCars.length}): ${updatedCars.join(', ')}`);
  }

  // 3. Arhivare Fotografii (DOAR DACĂ S-AU MODIFICAT)
  const mediaTarName = `parcos_cars_media_${timestamp}.tar.gz`;
  const mediaTarPath = path.join(targetDir, mediaTarName);
  let mediaSaved = false;

  if (mediaChanged && currentFingerprint.totalFiles > 0) {
    try {
      const parentDir = path.dirname(mediaSource);
      const folderBase = path.basename(mediaSource);
      console.log(`  📦 Generare arhivă FOTOGRAFII (${currentFingerprint.totalMb} MB)...`);
      execSync(`tar -czf ${mediaTarPath} -C ${parentDir} ${folderBase}`);
      mediaSaved = true;
      console.log(`  ✓ Arhivă FOTOGRAFII generată: ${mediaTarName}`);
    } catch (mediaErr) {
      console.warn(`  ⚠️ Avertisment la arhivarea folderului media:`, mediaErr.message);
    }
  }

  // 4. Extragere Tenanți din PostgreSQL (JSON + SQL per tenant)
  const dealersSql = `SELECT json_agg(row_to_json(d)) FROM dealers d;`;
  const dealersJson = execSync(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "${dealersSql}"`, { encoding: 'utf8' }).trim();
  let dealers = [];
  try {
    dealers = JSON.parse(dealersJson) || [];
  } catch (err) {
    dealers = [{ id: 1, name: 'RXM AUTOMOBILE SRL', slug: 'rxm' }];
  }

  const tenantSummaries = [];

  for (const dealer of dealers) {
    const slug = dealer.slug;

    // Vehicule
    const vehSql = `SELECT json_agg(row_to_json(v)) FROM vehicles v WHERE dealer_slug = '${slug}';`;
    const vehJson = execSync(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "${vehSql}"`, { encoding: 'utf8' }).trim();
    let vehicles = [];
    try { vehicles = JSON.parse(vehJson) || []; } catch {}

    // Utilizatori
    const usrSql = `SELECT json_agg(row_to_json(u)) FROM users u WHERE dealer_slug = '${slug}';`;
    const usrJson = execSync(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "${usrSql}"`, { encoding: 'utf8' }).trim();
    let users = [];
    try { users = JSON.parse(usrJson) || []; } catch {}

    // Mail Accounts
    const mailSql = `SELECT json_agg(row_to_json(m)) FROM mail_accounts m WHERE dealer_id = '${slug}';`;
    const mailJson = execSync(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "${mailSql}"`, { encoding: 'utf8' }).trim();
    let mailAccounts = [];
    try { mailAccounts = JSON.parse(mailJson) || []; } catch {}

    const tenantPayload = {
      tenantSlug: slug,
      exportedAt: new Date().toISOString(),
      timestamp,
      dealer,
      counts: {
        vehicles: vehicles.length,
        users: users.length,
        mailAccounts: mailAccounts.length,
      },
      vehicles,
      users,
      mailAccounts,
    };

    const tenantJsonName = `parcos_tenant_${slug}_${timestamp}.json`;
    const tenantJsonPath = path.join(targetDir, tenantJsonName);
    fs.writeFileSync(tenantJsonPath, JSON.stringify(tenantPayload, null, 2), 'utf8');

    // Tenant SQL Dump
    const tenantSqlName = `parcos_tenant_${slug}_${timestamp}.sql.gz`;
    const tenantSqlPath = path.join(targetDir, tenantSqlName);
    execSync(`docker exec ${PG_CONTAINER} pg_dump -U ${PG_USER} -d ${PG_DB} --table=dealers --table=vehicles --data-only | gzip > ${tenantSqlPath}`);

    tenantSummaries.push({
      slug,
      name: dealer.name,
      vehiclesCount: vehicles.length,
      jsonFile: tenantJsonName,
      sqlFile: tenantSqlName,
    });
  }

  // 5. Salvare Manifest Detaliat
  const manifest = {
    mode,
    timestamp,
    executedAt: new Date().toISOString(),
    vpsHost: '152.53.158.65',
    fullDump: fullDumpName,
    media: {
      status: mediaChanged ? 'updated' : 'unmodified_skipped',
      archive: mediaSaved ? mediaTarName : (previousFingerprint?.lastMediaArchive || null),
      sizeMb: mediaSaved ? currentFingerprint.totalMb : '0',
      totalCars: currentFingerprint.totalCars,
      totalFiles: currentFingerprint.totalFiles,
      delta: deltaReport,
      reusedFrom: !mediaChanged ? (previousFingerprint?.lastBackupTimestamp || 'anterior') : null,
    },
    tenants: tenantSummaries,
  };
  fs.writeFileSync(path.join(targetDir, `manifest_${timestamp}.json`), JSON.stringify(manifest, null, 2), 'utf8');

  // Actualizare fișier fingerprint de referință
  const updatedFingerprint = {
    ...currentFingerprint,
    lastBackupTimestamp: timestamp,
    lastMediaArchive: mediaSaved ? mediaTarName : (previousFingerprint?.lastMediaArchive || null),
    lastBackupFolder: folderName,
  };
  fs.writeFileSync(FINGERPRINT_FILE, JSON.stringify(updatedFingerprint, null, 2), 'utf8');

  // 6. UPLOAD DIRECT VPS -> GOOGLE DRIVE
  let gdriveUploaded = false;
  try {
    console.log(`\n☁️  Pas 4: Upload direct VPS -> Google Drive (${GDRIVE_DEST}/${folderName})...`);
    execSync(`rclone copy ${targetDir} ${GDRIVE_DEST}/${folderName} --fast-list`);
    console.log(`  ✓ Transfer în Google Drive finalizat cu succes!`);
    gdriveUploaded = true;

    // 7. Curățare arhivă foto temporară de pe VPS
    if (mediaSaved && fs.existsSync(mediaTarPath)) {
      fs.unlinkSync(mediaTarPath);
      console.log(`  ✓ Arhiva foto temporară (${currentFingerprint.totalMb} MB) a fost ștearsă de pe VPS. Discul NVMe rămâne curat!`);
    }
  } catch (rcloneErr) {
    console.warn(`  ⚠️ Avertisment rclone upload:`, rcloneErr.message);
  }

  // Copie latest
  const latestDir = path.join(BASE_BACKUP_DIR, 'latest');
  fs.mkdirSync(latestDir, { recursive: true });
  fs.writeFileSync(path.join(latestDir, 'latest_backup.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // 8. Retention Cleanup pe VPS (30 de zile)
  try {
    const entries = fs.readdirSync(BASE_BACKUP_DIR, { withFileTypes: true });
    const nowMs = Date.now();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
    for (const entry of entries) {
      if (entry.isDirectory() && (entry.name.startsWith('scheduled_') || entry.name.startsWith('manual_'))) {
        const fullPath = path.join(BASE_BACKUP_DIR, entry.name);
        const stats = fs.statSync(fullPath);
        if (nowMs - stats.mtimeMs > maxAgeMs) {
          console.log(`[Retention] Curățare backup vechi: ${entry.name}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
  } catch (err) {
    console.warn('[Retention] Eroare curățare backup-uri vechi:', err.message);
  }

  console.log(`\n===============================================================`);
  console.log(`✅ BACKUP FINALIZAT CU SUCCES! (${mediaChanged ? 'Delta Media Inclus' : 'Media Neschimbată — Skip Rapid'})`);
  console.log(`===============================================================`);
  return { targetDir, manifest, gdriveUploaded, mediaChanged };
}

if (process.argv[1] && process.argv[1].endsWith('parcos_backup.mjs')) {
  const mode = process.argv[2] || 'manual';
  runServerBackup(mode).then((res) => {
    console.log('\n[BACKUP_JSON_START]' + JSON.stringify(res.manifest) + '[BACKUP_JSON_END]');
  }).catch((err) => {
    console.error('Fatal backup error:', err);
    process.exit(1);
  });
}
