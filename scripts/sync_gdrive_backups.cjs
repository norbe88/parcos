/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Automated Google Drive Sync for Backups
 * Holding: CARVANA SRL • Target VPS: Netcup (152.53.158.65)
 * Sincronizează noile backup-uri zilnice de pe VPS direct pe
 * Google Drive I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\08_Database_Backups
 * 
 * HOTSPOT PROTECTION:
 * Descarcă exclusiv fișierele text/DB (19 KB).
 * Nu descarcă niciodată arhivele grele de poze pe laptop prin hotspot!
 * ══════════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NETCUP_HOST = 'root@152.53.158.65';
const REMOTE_BACKUP_DIR = '/data/parcos/backups';
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

async function syncBackups() {
  console.log(`\n===============================================================`);
  console.log(`🔄 PARCOS — SYNC BACKUP-URI POSTGRESQL -> GOOGLE DRIVE I:`);
  console.log(`Data & Ora: ${new Date().toISOString()}`);
  console.log(`Hotspot Protection: ${withMedia ? '⚠️ MEDIA DOWNLOAD ACTIVAT' : '🛡️ ACTIV (Doar DB 19 KB, 0 KB date mobile pentru poze)'}`);
  console.log(`===============================================================\n`);

  if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
    fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  }

  const hasGDrive = fs.existsSync(GDRIVE_BACKUP_DIR);
  if (!hasGDrive) {
    console.warn(`⚠️ Google Drive nu este montat pe I: (backup-urile se vor descărca doar local în backups/).`);
  } else {
    console.log(`✓ Google Drive Holding Mount activ: ${GDRIVE_BACKUP_DIR}`);
  }

  // Listare foldere de pe Netcup VPS
  const remoteListingRaw = runSsh(`ls -1 ${REMOTE_BACKUP_DIR} | grep -E '^(manual|scheduled)_'`);
  const remoteFolders = remoteListingRaw.split('\n').map((s) => s.trim()).filter(Boolean);

  console.log(`✓ Găsite ${remoteFolders.length} directoare de backup pe Netcup VPS.`);

  let newlySynced = 0;
  for (const folder of remoteFolders) {
    const localFolderPath = path.join(LOCAL_BACKUP_DIR, folder);
    const gDriveFolderPath = hasGDrive ? path.join(GDRIVE_BACKUP_DIR, folder) : null;

    if (!fs.existsSync(localFolderPath)) {
      fs.mkdirSync(localFolderPath, { recursive: true });
    }

    const remoteFilesRaw = runSsh(`ls -1 ${REMOTE_BACKUP_DIR}/${folder}`);
    const remoteFiles = remoteFilesRaw.split('\n').map(s => s.trim()).filter(Boolean);

    let folderUpdated = false;
    for (const f of remoteFiles) {
      if (f.startsWith('parcos_cars_media_') && !withMedia) {
        continue; // Hotspot protection: nu descărca pozele mari pe laptop!
      }

      const localFilePath = path.join(localFolderPath, f);
      if (!fs.existsSync(localFilePath)) {
        const remoteFilePath = `${REMOTE_BACKUP_DIR}/${folder}/${f}`;
        console.log(`  ⬇️ Descărcare fișier: ${folder}/${f}...`);
        execSync(`scp -o BatchMode=yes ${NETCUP_HOST}:${remoteFilePath} "${localFilePath}"`, { stdio: 'pipe' });
        folderUpdated = true;

        if (hasGDrive) {
          if (!fs.existsSync(gDriveFolderPath)) fs.mkdirSync(gDriveFolderPath, { recursive: true });
          fs.copyFileSync(localFilePath, path.join(gDriveFolderPath, f));
        }
      }
    }

    if (folderUpdated) {
      newlySynced++;
    } else {
      console.log(`  ✓ Deja sincronizat: ${folder}`);
    }
  }

  console.log(`\n===============================================================`);
  console.log(`✅ SINCRONIZARE FINALIZATĂ (${newlySynced} directoare sincronizate)`);
  console.log(`===============================================================`);
}

syncBackups().catch((err) => {
  console.error('Eroare la sincronizarea backup-urilor:', err.message);
  process.exit(1);
});
