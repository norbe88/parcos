/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Server-Side Master Deep Backup Engine
 * Runs on Netcup VPS (152.53.158.65)
 * Holding: CARVANA SRL
 * ══════════════════════════════════════════════════════════════════
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PG_CONTAINER = '6fezufnklecoapemrupsqpxh';
const BASE_BACKUP_DIR = '/data/parcos/backups';
const GDRIVE_DEST = 'gdrive:Carvana_Backups/ParcOS_RXM';

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

function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

export async function runVpsMasterBackup(customTimestamp) {
  const timestamp = customTimestamp || getTimestamp();
  const folderName = `master_${timestamp}`;
  const targetDir = path.join(BASE_BACKUP_DIR, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`\n===============================================================`);
  console.log(`🛡️  NETCUP VPS MASTER BACKUP ENGINE — STARTING`);
  console.log(`Timestamp: ${timestamp} • Target: ${targetDir}`);
  console.log(`===============================================================`);

  // 1. Full Raw SQL Dump + Gzip (parcos database)
  console.log(`\n▶ 1. Dump complet PostgreSQL 'parcos' (Raw SQL & Gzip)...`);
  const rawSqlPath = path.join(targetDir, `parcos_full_db_${timestamp}.sql`);
  const gzSqlPath = path.join(targetDir, `parcos_full_db_${timestamp}.sql.gz`);
  execSync(`docker exec ${PG_CONTAINER} pg_dump -U postgres -d parcos > "${rawSqlPath}"`);
  execSync(`gzip -c "${rawSqlPath}" > "${gzSqlPath}"`);
  console.log(`  ✓ Raw SQL: ${(fs.statSync(rawSqlPath).size / 1024).toFixed(1)} KB`);
  console.log(`  ✓ Gzip SQL: ${(fs.statSync(gzSqlPath).size / 1024).toFixed(1)} KB`);

  // 2. Full Staging Database Dump (parcos_staging)
  console.log(`\n▶ 2. Dump PostgreSQL 'parcos_staging'...`);
  const stagingGzPath = path.join(targetDir, `parcos_staging_db_${timestamp}.sql.gz`);
  execSync(`docker exec ${PG_CONTAINER} pg_dump -U postgres -d parcos_staging | gzip > "${stagingGzPath}"`);
  console.log(`  ✓ Staging Dump: ${(fs.statSync(stagingGzPath).size / 1024).toFixed(1)} KB`);

  // 3. Export tabele cheie în format JSON
  console.log(`\n▶ 3. Export structurat JSON per tabelă...`);
  const tables = ['dealers', 'vehicles', 'users', 'landing_leads', 'mail_accounts', 'mail_messages', 'mail_threads'];
  const tableCounts = {};
  for (const tbl of tables) {
    try {
      const sql = `SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (SELECT * FROM ${tbl}) t;`;
      const outJson = execSync(`docker exec ${PG_CONTAINER} psql -U postgres -d parcos -t -A -c "${sql}"`, { encoding: 'utf8' }).trim();
      const parsed = JSON.parse(outJson || '[]');
      tableCounts[tbl] = parsed.length;
      fs.writeFileSync(path.join(targetDir, `table_${tbl}_${timestamp}.json`), JSON.stringify(parsed, null, 2), 'utf8');
      console.log(`  ✓ Tabelă: ${tbl.padEnd(20)} (${parsed.length} rânduri)`);
    } catch (tblErr) {
      console.warn(`  ⚠️ Tabelă omisă (${tbl}):`, tblErr.message);
    }
  }

  // 4. Export per-tenant (RXM, MPI Auto, Top Auto)
  console.log(`\n▶ 4. Generare snapshot-uri izolate per-tenant...`);
  const rawDealers = execSync(`docker exec ${PG_CONTAINER} psql -U postgres -d parcos -t -A -c "SELECT slug, name FROM dealers;"`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  const tenantSummaries = [];
  for (const line of rawDealers) {
    const parts = line.split('|');
    const slug = parts[0]?.trim();
    const name = parts[1]?.trim() || slug;
    if (!slug) continue;

    const vehSql = `SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM (SELECT * FROM vehicles WHERE dealer_slug = '${slug}') v;`;
    const vehJson = execSync(`docker exec ${PG_CONTAINER} psql -U postgres -d parcos -t -A -c "${vehSql}"`, { encoding: 'utf8' }).trim();
    let vehicles = [];
    try { vehicles = JSON.parse(vehJson) || []; } catch {}

    const tenantPayload = {
      dealerSlug: slug,
      dealerName: name,
      exportedAt: new Date().toISOString(),
      timestamp,
      vehiclesCount: vehicles.length,
      vehicles,
    };

    const tenantJsonName = `tenant_${slug}_vehicles_${timestamp}.json`;
    fs.writeFileSync(path.join(targetDir, tenantJsonName), JSON.stringify(tenantPayload, null, 2), 'utf8');

    const tenantSqlName = `tenant_${slug}_data_${timestamp}.sql.gz`;
    execSync(`docker exec ${PG_CONTAINER} pg_dump -U postgres -d parcos --table=vehicles --data-only | gzip > "${path.join(targetDir, tenantSqlName)}"`);

    tenantSummaries.push({
      slug,
      name,
      vehiclesCount: vehicles.length,
      jsonFile: tenantJsonName,
      sqlFile: tenantSqlName,
    });
    console.log(`  ✓ Tenant: ${slug.padEnd(15)} | ${name.padEnd(25)} | ${vehicles.length} vehicule`);
  }

  // 5. Arhivare RXM Showroom (/data/rxm-showroom)
  console.log(`\n▶ 5. Arhivare completă server RXM Showroom (/data/rxm-showroom)...`);
  const rxmShowroomTar = path.join(targetDir, `rxm_showroom_full_${timestamp}.tar.gz`);
  execSync(`tar -czf "${rxmShowroomTar}" -C /data rxm-showroom`);
  console.log(`  ✓ Arhivă RXM Showroom: ${(fs.statSync(rxmShowroomTar).size / (1024 * 1024)).toFixed(2)} MB`);

  // 6. Arhivare container API RXM (/data/rxm-api)
  console.log(`\n▶ 6. Arhivare container RXM API (/data/rxm-api)...`);
  const rxmApiTar = path.join(targetDir, `rxm_api_full_${timestamp}.tar.gz`);
  execSync(`tar -czf "${rxmApiTar}" -C /data rxm-api`);
  console.log(`  ✓ Arhivă RXM API: ${(fs.statSync(rxmApiTar).size / 1024).toFixed(1)} KB`);

  // 7. Arhivare Fotografii Vehicule ParcOS (/data/parcos/cars)
  console.log(`\n▶ 7. Arhivare ParcOS Car Media Vault (/data/parcos/cars)...`);
  const parcosCarsTar = path.join(targetDir, `parcos_cars_media_${timestamp}.tar.gz`);
  if (fs.existsSync('/data/parcos/cars')) {
    execSync(`tar -czf "${parcosCarsTar}" -C /data/parcos cars`);
    console.log(`  ✓ Arhivă ParcOS Cars Media: ${(fs.statSync(parcosCarsTar).size / (1024 * 1024)).toFixed(2)} MB`);
  }

  // 8. Arhivare Scripturi Server ParcOS (/data/parcos/scripts)
  console.log(`\n▶ 8. Arhivare Scripturi Server ParcOS (/data/parcos/scripts)...`);
  const parcosScriptsTar = path.join(targetDir, `parcos_scripts_${timestamp}.tar.gz`);
  execSync(`tar -czf "${parcosScriptsTar}" -C /data/parcos scripts`);
  console.log(`  ✓ Arhivă ParcOS Scripts: ${(fs.statSync(parcosScriptsTar).size / 1024).toFixed(1)} KB`);

  // 9. Generare Manifest & Checksums
  console.log(`\n▶ 9. Generare checksums SHA-256 pe server...`);
  execSync(`cd "${targetDir}" && sha256sum * > checksums.sha256`);

  const fileEntries = fs.readdirSync(targetDir);
  const filesReport = [];
  let totalBytes = 0;
  for (const f of fileEntries) {
    const fullP = path.join(targetDir, f);
    const stat = fs.statSync(fullP);
    totalBytes += stat.size;
    filesReport.push({
      fileName: f,
      sizeBytes: stat.size,
      sizeMb: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
      sha256: computeSha256(fullP),
    });
  }

  const manifest = {
    folderName,
    timestamp,
    generatedAt: new Date().toISOString(),
    vpsHost: '152.53.158.65 (Netcup VPS)',
    tableCounts,
    tenants: tenantSummaries,
    totalFiles: filesReport.length,
    totalSizeMb: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
    files: filesReport,
  };
  fs.writeFileSync(path.join(targetDir, `master_manifest_${timestamp}.json`), JSON.stringify(manifest, null, 2), 'utf8');

  // Copiere latest
  const latestDir = path.join(BASE_BACKUP_DIR, 'latest');
  fs.mkdirSync(latestDir, { recursive: true });
  fs.writeFileSync(path.join(latestDir, 'latest_master_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // 10. Replicare directă Netcup VPS -> Google Drive (rclone)
  console.log(`\n▶ 10. Replicare directă VPS -> Google Drive (${GDRIVE_DEST}/${folderName})...`);
  let gdriveSuccess = false;
  try {
    execSync(`rclone copy "${targetDir}" "${GDRIVE_DEST}/${folderName}" --fast-list`);
    console.log(`  ✓ Upload finalizat cu succes via rclone!`);
    gdriveSuccess = true;
  } catch (rclErr) {
    console.warn(`  ⚠️ Avertisment rclone upload:`, rclErr.message);
  }

  console.log(`\n===============================================================`);
  console.log(`✅ NETCUP VPS MASTER SNAPSHOT COMPLET! (${manifest.totalSizeMb})`);
  console.log(`===============================================================`);

  return { targetDir, manifest, gdriveSuccess };
}

if (process.argv[1] && process.argv[1].endsWith('vps_master_backup.mjs')) {
  const ts = process.argv[2];
  runVpsMasterBackup(ts).then((res) => {
    console.log('\n[MASTER_BACKUP_START]' + JSON.stringify(res.manifest) + '[MASTER_BACKUP_END]');
  }).catch((err) => {
    console.error('Fatal error during VPS master backup:', err);
    process.exit(1);
  });
}
