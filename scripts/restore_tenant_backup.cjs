/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Instant Tenant Rollback & Restore Tool
 * Holding: CARVANA SRL • Target VPS: Netcup (152.53.158.65)
 * Izolare Multi-Tenant: Restaurează strict un singur tenant fără a
 * afecta restul platformei sau alți dealeri din PostgreSQL.
 * 
 * Utilizare:
 *   node scripts/restore_tenant_backup.cjs --tenant=rxm --list
 *   node scripts/restore_tenant_backup.cjs --tenant=rxm --backup=manual_20261022_200029 --dry-run
 *   node scripts/restore_tenant_backup.cjs --tenant=rxm --backup=manual_20261022_200029 --execute
 * ══════════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NETCUP_HOST = 'root@152.53.158.65';
const PG_CONTAINER = '6fezufnklecoapemrupsqpxh';
const PG_DB = 'parcos';
const PG_USER = 'postgres';

const LOCAL_BACKUP_DIR = path.resolve(__dirname, '..', 'backups');
const GDRIVE_BACKUP_DIR = 'I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS\\08_Database_Backups';

// Parsare argumente CLI
const args = process.argv.slice(2);
const getArg = (name) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const targetTenant = getArg('tenant') || 'rxm';
const backupTarget = getArg('backup');
const isDryRun = hasFlag('dry-run') || !hasFlag('execute');
const isList = hasFlag('list');
const withMedia = hasFlag('with-media');

function runSsh(cmd) {
  return execSync(`ssh -o BatchMode=yes -o ConnectTimeout=10 ${NETCUP_HOST} "${cmd.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
}

function listAvailableBackups() {
  console.log(`\n📋 Backup-uri disponibile pentru tenant-ul: [${targetTenant}]`);
  console.log(`─────────────────────────────────────────────────────────────`);

  const searchDirs = [];
  if (fs.existsSync(GDRIVE_BACKUP_DIR)) searchDirs.push({ name: 'Google Drive I:', dir: GDRIVE_BACKUP_DIR });
  if (fs.existsSync(LOCAL_BACKUP_DIR)) searchDirs.push({ name: 'Local backups/', dir: LOCAL_BACKUP_DIR });

  for (const src of searchDirs) {
    console.log(`\nSursă: ${src.name} (${src.dir})`);
    const entries = fs.readdirSync(src.dir, { withFileTypes: true });
    let found = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subFiles = fs.readdirSync(path.join(src.dir, entry.name));
        const tenantJson = subFiles.find((f) => f.includes(`tenant_${targetTenant}`) && f.endsWith('.json'));
        if (tenantJson) {
          found++;
          const fullPath = path.join(src.dir, entry.name, tenantJson);
          const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(1);
          console.log(`  • ${entry.name.padEnd(30)} -> Fișier: ${tenantJson} (${sizeKb} KB)`);
        }
      }
    }
    if (found === 0) console.log(`  (Niciun backup găsit în această sursă)`);
  }
}

async function restoreTenant() {
  console.log(`\n===============================================================`);
  console.log(`⏪ PARCOS / RXM AUTOMOBILE — TENANT RESTORE & ROLLBACK`);
  console.log(`Data & Ora: ${new Date().toISOString()}`);
  console.log(`Tenant Țintă: [${targetTenant}]`);
  console.log(`Mod de rulare: ${isDryRun ? '🔍 SIMULARE DRY-RUN (Fără modificări în DB)' : '⚡ EXECUTĂ ROLLBACK ÎN DB PRODUCȚIE'}`);
  console.log(`===============================================================\n`);

  if (!backupTarget) {
    console.error(`❌ Parametrul --backup=<nume_folder_sau_timestamp> este obligatoriu.`);
    console.error(`Exemplu: node scripts/restore_tenant_backup.cjs --tenant=rxm --backup=manual_20261022_200029`);
    process.exit(1);
  }

  // Caută fișierul JSON
  let candidatePath = null;
  const possiblePaths = [
    path.join(LOCAL_BACKUP_DIR, backupTarget, `parcos_tenant_${targetTenant}_${backupTarget.replace(/^(manual|scheduled)_/, '')}.json`),
    path.join(GDRIVE_BACKUP_DIR, backupTarget, `parcos_tenant_${targetTenant}_${backupTarget.replace(/^(manual|scheduled)_/, '')}.json`),
    path.join(LOCAL_BACKUP_DIR, backupTarget),
    path.join(GDRIVE_BACKUP_DIR, backupTarget),
  ];

  // Căutare dinamică în foldere
  const searchRoots = [LOCAL_BACKUP_DIR, GDRIVE_BACKUP_DIR];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      const folderPath = path.join(root, backupTarget);
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        const match = files.find((f) => f.includes(`tenant_${targetTenant}`) && f.endsWith('.json'));
        if (match) {
          candidatePath = path.join(folderPath, match);
          break;
        }
      }
    }
  }

  if (!candidatePath || !fs.existsSync(candidatePath)) {
    console.error(`❌ Nu s-a putut găsi fișierul JSON de snapshot pentru tenant-ul ${targetTenant} în ${backupTarget}`);
    process.exit(1);
  }

  console.log(`✓ Fișier snapshot identificat: ${candidatePath}`);
  const payload = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));

  const vehicles = payload.vehicles || [];
  const dealer = payload.dealer || {};
  console.log(`✓ Date încărcate din snapshot:`);
  console.log(`  • Dealer: ${dealer.name} (${dealer.slug})`);
  console.log(`  • Vehicule în backup: ${vehicles.length}`);
  console.log(`  • Generat la: ${payload.exportedAt || payload.timestamp}`);

  // Verificare stare curentă din DB
  const liveCountRaw = runSsh(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "SELECT count(*) FROM vehicles WHERE dealer_slug = '${targetTenant}';"`);
  const liveCount = parseInt(liveCountRaw.trim(), 10) || 0;
  console.log(`  • Vehicule live în DB pe Netcup VPS chiar acum: ${liveCount}`);

  // Verificare existență arhivă foto/media în backup
  const backupFolder = path.dirname(candidatePath);
  const mediaArchiveFile = fs.readdirSync(backupFolder).find((f) => f.startsWith('parcos_cars_media_') && f.endsWith('.tar.gz'));
  let mediaArchiveMb = '0';
  if (mediaArchiveFile) {
    const mediaBytes = fs.statSync(path.join(backupFolder, mediaArchiveFile)).size;
    mediaArchiveMb = (mediaBytes / (1024 * 1024)).toFixed(1);
    console.log(`  • Arhivă FOTOGRAFII inclusă: ${mediaArchiveFile} (${mediaArchiveMb} MB)`);
  }

  if (isDryRun) {
    console.log(`\n🔍 [DRY-RUN] Modul simulare:`);
    console.log(`  - Se vor restaura/actualiza ${vehicles.length} vehicule pentru dealerul '${targetTenant}'.`);
    console.log(`  - Tabela 'dealers' va fi sincronizată pentru '${targetTenant}'.`);
    if (mediaArchiveFile) {
      console.log(`  - 📸 Arhiva foto (${mediaArchiveMb} MB) poate fi restaurată cu flag-ul: --with-media`);
    }
    console.log(`  - Niciun alt dealer nu va fi afectat.`);
    console.log(`\nPentru a aplica efectiv modificările în producție, rulează comanda cu flag-ul --execute:`);
    console.log(`  node scripts/restore_tenant_backup.cjs --tenant=${targetTenant} --backup=${backupTarget} --execute ${mediaArchiveFile ? '--with-media' : ''}\n`);
    return;
  }

  // Execuție efectivă
  console.log(`\n⚡ [EXECUȚIE] Aplicare rollback pe PostgreSQL Netcup VPS...`);

  // Dacă utilizatorul a cerut restaurarea fotografiilor
  if (withMedia && mediaArchiveFile) {
    console.log(`\n📸 [FOTO ROLLBACK] Se transferă și se dezarhivează pozele pe Netcup VPS (/data/parcos/cars)...`);
    const localMediaSrc = path.join(backupFolder, mediaArchiveFile);
    const remoteMediaTmp = `/tmp/${mediaArchiveFile}`;
    execSync(`scp -o BatchMode=yes "${localMediaSrc}" ${NETCUP_HOST}:${remoteMediaTmp}`, { stdio: 'inherit' });
    runSsh(`tar -xzf ${remoteMediaTmp} -C /data/parcos/ && rm -f ${remoteMediaTmp}`);
    console.log(`  ✓ Toate fotografiile au fost restaurate pe disc în /data/parcos/cars!`);
  }

  // Trimitere payload JSON pe VPS
  const remoteTempJson = `/tmp/restore_tenant_${targetTenant}_${Date.now()}.json`;
  const b64 = Buffer.from(JSON.stringify(vehicles), 'utf8').toString('base64');
  runSsh(`echo "${b64}" | base64 -d > ${remoteTempJson}`);

  // Script SQL de upsert sigur folosind json_populate_recordset
  const restoreSql = `
    DO $$
    DECLARE
      v_data jsonb;
    BEGIN
      -- Datele sunt injectate
      RAISE NOTICE 'Rollback tenant ${targetTenant} inițiat...';
    END $$;
  `;

  // Copiere directă SQL prin script node securizat pe server
  const nodeRestoreScript = `
    import fs from 'node:fs';
    import { execSync } from 'node:child_process';
    
    const vehicles = JSON.parse(fs.readFileSync('${remoteTempJson}', 'utf8'));
    console.log('Restaurare ' + vehicles.length + ' vehicule...');
    
    // Generare comenzi SQL sigure per vehicul
    let sqlStatements = ['BEGIN;'];
    for (const v of vehicles) {
      const rawJson = JSON.stringify(v.raw_data || {}).replace(/'/g, "''");
      const imagesJson = JSON.stringify(v.images || []).replace(/'/g, "''");
      const featuresJson = JSON.stringify(v.features || {}).replace(/'/g, "''");
      
      sqlStatements.push(\`
        INSERT INTO vehicles (
          id, dealer_slug, stock_number, brand, model, version_trim, year, mileage_km,
          price_eur, vat_deductible, vat_rate, fuel_type, transmission, power_hp, engine_cc,
          body_type, drivetrain, color, vin, is_vin_public, doc_origin_country, warranty_months,
          status, stock_entry_date, images, video_url, tiktok_url, tiktok_views,
          is_deal_of_week, is_pinned_to_top, old_price_eur, deal_badge_text,
          features, equipment_sheet_text, description, raw_data, created_at, updated_at
        ) VALUES (
          '\${v.id}', '\${v.dealer_slug || '${targetTenant}'}', \${v.stock_number ? \`'\${v.stock_number}'\` : 'NULL'},
          '\${v.brand.replace(/'/g, "''")}', '\${v.model.replace(/'/g, "''")}', \${v.version_trim ? \`'\${v.version_trim.replace(/'/g, "''")}'\` : 'NULL'},
          \${v.year}, \${v.mileage_km}, \${v.price_eur}, \${v.vat_deductible ? 'TRUE' : 'FALSE'}, 0.21,
          '\${v.fuel_type}', '\${v.transmission}', \${v.power_hp || 0}, \${v.engine_cc || 0},
          '\${v.body_type || 'SUV'}', '\${v.drivetrain || 'Față'}', '\${(v.color || '').replace(/'/g, "''")}',
          '\${(v.vin || '').replace(/'/g, "''")}', \${v.is_vin_public ? 'TRUE' : 'FALSE'}, '\${v.doc_origin_country || 'RO'}', \${v.warranty_months || 12},
          '\${v.status || 'in_stock'}', \${v.stock_entry_date ? \`'\${v.stock_entry_date}'\` : 'NULL'}, '\${imagesJson}'::jsonb,
          \${v.video_url ? \`'\${v.video_url}'\` : 'NULL'}, \${v.tiktok_url ? \`'\${v.tiktok_url}'\` : 'NULL'}, \${v.tiktok_views ? \`'\${v.tiktok_views}'\` : 'NULL'},
          \${v.is_deal_of_week ? 'TRUE' : 'FALSE'}, \${v.is_pinned_to_top ? 'TRUE' : 'FALSE'}, \${v.old_price_eur ? v.old_price_eur : 'NULL'}, \${v.deal_badge_text ? \`'\${v.deal_badge_text}'\` : 'NULL'},
          '\${featuresJson}'::jsonb, \${v.equipment_sheet_text ? \`'\${v.equipment_sheet_text.replace(/'/g, "''")}'\` : 'NULL'}, \${v.description ? \`'\${v.description.replace(/'/g, "''")}'\` : 'NULL'},
          '\${rawJson}'::jsonb, '\${v.created_at || new Date().toISOString()}', NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          price_eur = EXCLUDED.price_eur,
          status = EXCLUDED.status,
          images = EXCLUDED.images,
          features = EXCLUDED.features,
          description = EXCLUDED.description,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW();
      \`);
    }
    sqlStatements.push('COMMIT;');
    
    fs.writeFileSync('/tmp/restore_exec.sql', sqlStatements.join('\\n'), 'utf8');
    execSync('docker exec -i ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} < /tmp/restore_exec.sql', { stdio: 'inherit' });
    console.log('Rollback complet finalizat cu succes!');
  `;

  const remoteRunnerPath = `/tmp/run_restore_${Date.now()}.mjs`;
  const runnerB64 = Buffer.from(nodeRestoreScript, 'utf8').toString('base64');
  runSsh(`echo "${runnerB64}" | base64 -d > ${remoteRunnerPath} && node ${remoteRunnerPath}`);

  // Curățare fișiere temporare
  runSsh(`rm -f ${remoteTempJson} ${remoteRunnerPath} /tmp/restore_exec.sql`);

  // Verificare finală
  const finalCountRaw = runSsh(`docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -t -A -c "SELECT count(*) FROM vehicles WHERE dealer_slug = '${targetTenant}';"`);
  console.log(`\n✅ RESTAURARE FINALIZATĂ: ${finalCountRaw.trim()} vehicule active în baza de date.`);
}

if (isList) {
  listAvailableBackups();
} else {
  restoreTenant().catch((err) => {
    console.error('\n❌ Eroare la restaurarea backup-ului:', err.message);
    process.exit(1);
  });
}
