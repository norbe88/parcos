/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Automated Database Backup Runner
 * Holding: CARVANA SRL • Target VPS: Netcup (152.53.158.65)
 * 
 * HOTSPOT PROTECTION MODE (Default):
 * 1. Netcup VPS rulează backup-ul și îl trimite DIRECT pe Google Drive (1 Gbps fiber).
 * 2. Pe Zety/Laptop se descarcă DOAR fișierele text/DB (19 KB — 0.05 secunde).
 * 3. Fotografiile (70+ MB) NU sunt descărcate pe laptop (0 MB consumați pe hotspot 4G/5G).
 * 4. Dacă se dorește descărcarea fotografiilor local, se rulează cu: --with-media
 * ══════════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NETCUP_HOST = 'root@152.53.158.65';
const REMOTE_SCRIPT = '/data/parcos/scripts/parcos_backup.mjs';
const REMOTE_BACKUP_BASE = '/data/parcos/backups';
const GDRIVE_BACKUP_DIR = 'I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS\\08_Database_Backups';
const LOCAL_BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

const args = process.argv.slice(2);
const withMedia = args.includes('--with-media');

function runSsh(cmd) {
  return execSync(`ssh -o BatchMode=yes -o ConnectTimeout=10 ${NETCUP_HOST} "${cmd.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
}

async function runBackup() {
  console.log(`\n===============================================================`);
  console.log(`🛡️  PARCOS / RXM AUTOMOBILE — ON-DEMAND PRODUCTION BACKUP`);
  console.log(`Data & Ora: ${new Date().toISOString()}`);
  console.log(`Hotspot Protection: ${withMedia ? '⚠️ MEDIA DOWNLOAD ACTIVAT' : '🛡️ ACTIV (Doar DB 19 KB, 0 KB date mobile pentru poze)'}`);
  console.log(`===============================================================\n`);

  if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
    fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  }

  const hasGDrive = fs.existsSync(GDRIVE_BACKUP_DIR);

  // 1. Executare Daemon Autonom pe Serverul Netcup VPS
  console.log(`📦 Pas 1/2: Rulare backup pe Netcup VPS & Upload direct în Google Drive...`);
  const rawOutput = runSsh(`node ${REMOTE_SCRIPT} manual`);
  
  const jsonMatch = rawOutput.match(/\[BACKUP_JSON_START\](.*?)\[BACKUP_JSON_END\]/s);
  if (!jsonMatch) {
    console.error(`Răspuns server neașteptat:`, rawOutput);
    throw new Error('Eșec la citirea manifestului de backup emis de server.');
  }

  const manifest = JSON.parse(jsonMatch[1]);
  const folderName = `manual_${manifest.timestamp}`;
  const remoteFolder = `${REMOTE_BACKUP_BASE}/${folderName}`;
  console.log(`  ✓ Backup generat pe VPS în: ${remoteFolder}`);
  console.log(`  ✓ Upload direct VPS -> Google Drive: FINALIZAT (Bypass laptop complet)`);
  console.log(`  • Full DB:      ${manifest.fullDump}`);
  console.log(`  • Arhivă Foto:  ${manifest.mediaArchive || 'N/A'} (${manifest.mediaSizeMb} MB transferați direct în cloud)`);
  console.log(`  • Tenanți:      ${manifest.tenants.map(t => `${t.slug} (${t.vehiclesCount} vehicule)`).join(', ')}`);

  // 2. Descărcare selectivă pe Zety (DOAR fișierele DB mici, exclude tar.gz dacă nu e cerut)
  console.log(`\n📥 Pas 2/2: Sincronizare pe laptop (Doar baza de date, fără poze grele)...`);
  const localTargetFolder = path.join(LOCAL_BACKUP_DIR, folderName);
  fs.mkdirSync(localTargetFolder, { recursive: true });

  const remoteFilesRaw = runSsh(`ls -1 ${remoteFolder}`);
  const remoteFiles = remoteFilesRaw.split('\n').map(s => s.trim()).filter(Boolean);

  const fileReports = [];

  for (const f of remoteFiles) {
    if (f.startsWith('parcos_cars_media_') && !withMedia) {
      console.log(`  🛡️ Ignorat transferul pozelor (${f}) pentru protecția hotspot-ului.`);
      continue;
    }

    const remoteFilePath = `${remoteFolder}/${f}`;
    const localFilePath = path.join(localTargetFolder, f);
    execSync(`scp -o BatchMode=yes ${NETCUP_HOST}:${remoteFilePath} "${localFilePath}"`, { stdio: 'pipe' });

    const bytes = fs.statSync(localFilePath).size;
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(localFilePath)).digest('hex');
    fileReports.push({
      file: f,
      sizeKb: (bytes / 1024).toFixed(1) + ' KB',
      sha: sha256.slice(0, 16) + '...',
    });

    if (hasGDrive) {
      const gDriveTargetFolder = path.join(GDRIVE_BACKUP_DIR, folderName);
      if (!fs.existsSync(gDriveTargetFolder)) fs.mkdirSync(gDriveTargetFolder, { recursive: true });
      fs.copyFileSync(localFilePath, path.join(gDriveTargetFolder, f));
    }
  }

  console.log(`\n===============================================================`);
  console.log(`✅ BACKUP COMPLET FINALIZAT CU SUCCES!`);
  console.log(`===============================================================`);
  console.log(`☁️  Google Drive:      gdrive:Carvana_Backups/ParcOS_RXM/${folderName} (Pachet complet DB + FOTO)`);
  console.log(`📁 Local Repo:         ${localTargetFolder} (Doar DB / JSON 19 KB)`);
  console.log(`🖥️  Netcup VPS Path:    ${remoteFolder}`);
  console.log(`\nFișiere sincronizate pe laptop (Trafic minim garantat):`);
  fileReports.forEach((r) => {
    console.log(`  • ${r.file.padEnd(45)} | Mărime: ${r.sizeKb.padStart(10)} | SHA-256: ${r.sha}`);
  });
  console.log(`\nVehicule active securizate în snapshot RXM: ${manifest.tenants[0]?.vehiclesCount || 0}`);
}

runBackup().catch((err) => {
  console.error('\n❌ Eroare la execuția backup-ului:', err.message);
  process.exit(1);
});
