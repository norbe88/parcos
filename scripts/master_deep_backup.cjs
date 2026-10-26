/**
 * ══════════════════════════════════════════════════════════════════
 * ParcOS / RXM Automobile — Master Deep Holding Backup Orchestrator
 * Target Node: Zety (HP ZBook Workstation) -> VPS: Netcup (152.53.158.65)
 * Holding: CARVANA SRL • Cloud Hub: Google Drive I:\
 * ══════════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NETCUP_HOST = 'root@152.53.158.65';
const REMOTE_SCRIPTS_DIR = '/data/parcos/scripts';
const REMOTE_BACKUP_BASE = '/data/parcos/backups';
const GDRIVE_DEST = 'gdrive:Carvana_Backups/ParcOS_RXM';
const LOCAL_BACKUP_BASE = path.resolve(__dirname, '..', 'backups');
const GDRIVE_DB_DIR = 'I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS\\08_Database_Backups';
const GDRIVE_MEDIA_DIR = 'I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS\\09_Vehicle_Media_Vault';
const GDRIVE_REPO_DIR = 'I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS\\Repo_Sync';
const REPO_ROOT = path.resolve(__dirname, '..');

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

function runSsh(cmd) {
  return execSync(`ssh -o BatchMode=yes -o ConnectTimeout=20 ${NETCUP_HOST} "${cmd.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
}

function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

async function main() {
  const timestamp = getTimestamp();
  const masterFolderName = `master_${timestamp}`;
  const remoteTargetDir = `${REMOTE_BACKUP_BASE}/${masterFolderName}`;
  const localTargetDir = path.join(LOCAL_BACKUP_BASE, masterFolderName);
  const hasGDrive = fs.existsSync('I:\\My Drive\\CARVANA_SRL\\08_PROJECT_PARCOS');

  console.log(`\n===============================================================`);
  console.log(`🛡️  PARCOS & RXM AUTOMOBILE — MASTER DEEP BACKUP ORCHESTRATOR`);
  console.log(`Timestamp: ${timestamp} • Folder: ${masterFolderName}`);
  console.log(`Node Ident: Zety (zbook-norby) • VPS: Netcup (152.53.158.65)`);
  console.log(`Google Drive Mount: ${hasGDrive ? '✓ ACTIV (I:\\)' : '⚠️ INACTIV (Doar local)'}`);
  console.log(`===============================================================\n`);

  if (!fs.existsSync(localTargetDir)) {
    fs.mkdirSync(localTargetDir, { recursive: true });
  }

  // ─────────────────────────────────────────────────────────────
  // ETAPA 1: DEPLOY SCRIPT PE VPS SI EXECUTIE NATIVA PE LINUX
  // ─────────────────────────────────────────────────────────────
  console.log(`🚀 [ETAPA 1/5] Sincronizare runner pe Netcup VPS & Rulare nativă...`);
  const localScriptPath = path.join(__dirname, 'vps_master_backup.mjs');
  execSync(`scp -o BatchMode=yes "${localScriptPath}" ${NETCUP_HOST}:${REMOTE_SCRIPTS_DIR}/vps_master_backup.mjs`, { stdio: 'pipe' });
  console.log(`  ✓ Scriptul vps_master_backup.mjs sincronizat pe server.`);

  console.log(`  ▶ Pornire proces de backup pe Netcup VPS...`);
  const vpsOutput = runSsh(`node ${REMOTE_SCRIPTS_DIR}/vps_master_backup.mjs ${timestamp}`);
  
  const jsonMatch = vpsOutput.match(/\[MASTER_BACKUP_START\](.*?)\[MASTER_BACKUP_END\]/s);
  if (!jsonMatch) {
    console.error(`Eșec la citirea manifestului server:`, vpsOutput);
    throw new Error('Serverul nu a returnat un manifest JSON valid.');
  }

  const vpsManifest = JSON.parse(jsonMatch[1]);
  console.log(`  ✓ Snapshot VPS generat: ${vpsManifest.totalFiles} fișiere (${vpsManifest.totalSizeMb})`);
  console.log(`  ✓ Vehicule securizate: ${vpsManifest.tableCounts.vehicles || 0} vehicule în catalog`);

  // ─────────────────────────────────────────────────────────────
  // ETAPA 2: DESCARCARE FULL SNAPSHOT PE ZETY (LOCAL)
  // ─────────────────────────────────────────────────────────────
  console.log(`\n📥 [ETAPA 2/5] Descărcare snapshot complet pe stația Zety...`);
  const remoteFilesRaw = runSsh(`ls -1 ${remoteTargetDir}`);
  const remoteFiles = remoteFilesRaw.split('\n').map(s => s.trim()).filter(Boolean);

  for (const file of remoteFiles) {
    const remoteFile = `${remoteTargetDir}/${file}`;
    const localFile = path.join(localTargetDir, file);
    process.stdout.write(`  ⬇️ Descărcare: ${file.padEnd(46)} ... `);
    execSync(`scp -o BatchMode=yes -o ConnectTimeout=20 ${NETCUP_HOST}:${remoteFile} "${localFile}"`, { stdio: 'pipe' });
    const sizeMb = (fs.statSync(localFile).size / (1024 * 1024)).toFixed(2);
    console.log(`[OK] (${sizeMb.padStart(6)} MB)`);
  }

  // ─────────────────────────────────────────────────────────────
  // ETAPA 3: PRESERVARE CODEBASE LOCAL PARCOS (ZETY WORKSPACE)
  // ─────────────────────────────────────────────────────────────
  console.log(`\n💻 [ETAPA 3/5] Preservare Codebase Local ParcOS & Working Tree...`);

  // 3.1 Git Bundle complet
  const gitBundlePath = path.join(localTargetDir, `parcos_git_repo_${timestamp}.bundle`);
  console.log(`  ▶ 3.1 Generare Git Bundle complet (.bundle)...`);
  execSync(`git bundle create "${gitBundlePath}" --all`, { cwd: REPO_ROOT, stdio: 'pipe' });
  const bundleSizeMb = (fs.statSync(gitBundlePath).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✓ Git Bundle creat: parcos_git_repo_${timestamp}.bundle (${bundleSizeMb} MB)`);

  // 3.2 Working Tree Snapshot (toate modificările uncommitted + untracked)
  const workingTreeTarPath = path.join(localTargetDir, `parcos_working_tree_snapshot_${timestamp}.tar.gz`);
  console.log(`  ▶ 3.2 Arhivare stare workspace Zety (fisiere modificate + untracked)...`);
  execSync(`tar -czf "${workingTreeTarPath}" --exclude=node_modules --exclude=dist --exclude=.git --exclude=.vite --exclude=backups .`, {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });
  const workingTreeSizeMb = (fs.statSync(workingTreeTarPath).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✓ Working Tree Snapshot salvat: parcos_working_tree_snapshot_${timestamp}.tar.gz (${workingTreeSizeMb} MB)`);

  // ─────────────────────────────────────────────────────────────
  // ETAPA 4: REPLICARE REPO ZETY -> GOOGLE DRIVE REPO_SYNC
  // ─────────────────────────────────────────────────────────────
  console.log(`\n☁️  [ETAPA 4/5] Oglindire cod sursă Zety -> Google Drive Repo_Sync...`);
  if (hasGDrive) {
    if (!fs.existsSync(GDRIVE_REPO_DIR)) fs.mkdirSync(GDRIVE_REPO_DIR, { recursive: true });
    try {
      execSync(`robocopy "${REPO_ROOT}" "${GDRIVE_REPO_DIR}" /MIR /XD node_modules dist .next .vite backups /XF *.log *.tmp /R:1 /W:1 /MT:8 /NP /NDL`, {
        stdio: 'pipe',
      });
      console.log(`  ✓ Repo_Sync actualizat 1:1 pe Google Drive I:`);
    } catch (rcErr) {
      if (rcErr.status < 8) {
        console.log(`  ✓ Repo_Sync actualizat 1:1 pe Google Drive I: (Cod Robocopy: ${rcErr.status})`);
      } else {
        console.warn(`  ⚠️ Avertisment Robocopy: Cod ${rcErr.status}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ETAPA 5: REPLICARE IN HOLDING VAULT PE GOOGLE DRIVE (I:\)
  // ─────────────────────────────────────────────────────────────
  console.log(`\n📂 [ETAPA 5/5] Replicare arhive în Google Drive Holding Vault (Drive I:)...`);
  if (hasGDrive) {
    const gDriveMasterTarget = path.join(GDRIVE_DB_DIR, masterFolderName);
    if (!fs.existsSync(gDriveMasterTarget)) fs.mkdirSync(gDriveMasterTarget, { recursive: true });

    const localFiles = fs.readdirSync(localTargetDir);
    for (const file of localFiles) {
      const src = path.join(localTargetDir, file);
      const dest = path.join(gDriveMasterTarget, file);
      fs.copyFileSync(src, dest);

      // Replicare media și în 09_Vehicle_Media_Vault
      if (file.includes('media') || file.includes('rxm_showroom')) {
        if (!fs.existsSync(GDRIVE_MEDIA_DIR)) fs.mkdirSync(GDRIVE_MEDIA_DIR, { recursive: true });
        fs.copyFileSync(src, path.join(GDRIVE_MEDIA_DIR, file));
      }
    }
    console.log(`  ✓ Copiat complet în Vault: ${gDriveMasterTarget}`);
    console.log(`  ✓ Arhive media replicate în: ${GDRIVE_MEDIA_DIR}`);
  }

  // ─────────────────────────────────────────────────────────────
  // MANIFEST FINAL & RAPORT DETALIAT
  // ─────────────────────────────────────────────────────────────
  const localFiles = fs.readdirSync(localTargetDir);
  const auditReport = [];
  let totalBytes = 0;

  for (const f of localFiles) {
    const fullP = path.join(localTargetDir, f);
    const stat = fs.statSync(fullP);
    totalBytes += stat.size;
    auditReport.push({
      file: f,
      sizeBytes: stat.size,
      sizeMb: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
      sha256: computeSha256(fullP),
    });
  }

  const finalManifest = {
    backupName: masterFolderName,
    timestamp,
    generatedAt: new Date().toISOString(),
    nodeIdentity: 'Zety (zbook-norby)',
    vpsHost: 'Netcup VPS (152.53.158.65)',
    vpsManifest,
    totalFiles: auditReport.length,
    totalSizeMb: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
    files: auditReport,
  };

  fs.writeFileSync(path.join(localTargetDir, 'master_manifest.json'), JSON.stringify(finalManifest, null, 2), 'utf8');

  // Actualizare latest local
  const latestLocalDir = path.join(LOCAL_BACKUP_BASE, 'latest');
  if (!fs.existsSync(latestLocalDir)) fs.mkdirSync(latestLocalDir, { recursive: true });
  fs.writeFileSync(path.join(latestLocalDir, 'latest_master_manifest.json'), JSON.stringify(finalManifest, null, 2), 'utf8');

  if (hasGDrive) {
    fs.copyFileSync(path.join(localTargetDir, 'master_manifest.json'), path.join(GDRIVE_DB_DIR, masterFolderName, 'master_manifest.json'));
  }

  console.log(`\n===============================================================`);
  console.log(`🎉 MASTER DEEP BACKUP FINALIZAT CU SUCCES!`);
  console.log(`===============================================================`);
  console.log(`📁 Director Local:       ${localTargetDir}`);
  console.log(`☁️  Netcup VPS Path:     ${remoteTargetDir}`);
  console.log(`☁️  Google Drive Cloud:  ${GDRIVE_DEST}/${masterFolderName}`);
  console.log(`💾 Holding Drive I::    ${GDRIVE_DB_DIR}\\${masterFolderName}`);
  console.log(`📊 Volum Total Securizat: ${finalManifest.totalSizeMb} (${finalManifest.totalFiles} fișiere)\n`);

  console.log(`Detaliu fișiere securizate & hash-uri SHA-256:`);
  auditReport.forEach((r) => {
    console.log(`  • ${r.file.padEnd(52)} | ${r.sizeMb.padStart(10)} | SHA-256: ${r.sha256.slice(0, 16)}...`);
  });

  return finalManifest;
}

main().catch((err) => {
  console.error('\n❌ Eroare critică în Master Backup Runner:', err);
  process.exit(1);
});
