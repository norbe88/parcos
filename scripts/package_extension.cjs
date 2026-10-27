/**
 * scripts/package_extension.cjs
 * împachetează extensia Chrome `extensions/parcos-olx-publisher` într-un fișier ZIP standardizat,
 * 100% compatibil cu Windows Explorer, macOS Archive Utility și Chrome Extensions.
 * 
 * Invariante:
 * - Fără prefixuri de tip './' în header-ul ZIP (care cauzează erori 'zip-ul este gol' în Windows)
 * - Fără backslash-uri în căile fișierelor (standard ZIP compliant)
 * - Zero dependențe externe (utilizează zlib.deflateRawSync și zlib.crc32 nativ din Node.js)
 * - Salvează automat în public/downloads/ și dist/downloads/
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function buildCompliantZip(sourceDir) {
  const files = [];

  function walk(dir) {
    const items = fs.readdirSync(dir).sort();
    for (const item of items) {
      if (item.startsWith('.') || item === 'Thumbs.db') continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (stat.isFile()) {
        const rel = path.relative(sourceDir, full).replace(/\\/g, '/');
        files.push({ full, rel, mtime: stat.mtime });
      }
    }
  }

  walk(sourceDir);

  const localParts = [];
  const cdParts = [];
  let currentOffset = 0;

  for (const f of files) {
    const data = fs.readFileSync(f.full);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data);
    const date = new Date(f.mtime);

    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

    const nameBuf = Buffer.from(f.rel, 'utf8');

    // Local Header (30 bytes + nameBuf.length + compressed.length)
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // Local file header signature
    lh.writeUInt16LE(20, 4);         // Version needed: 2.0
    lh.writeUInt16LE(0x0800, 6);     // General purpose bit flag (UTF-8 filename)
    lh.writeUInt16LE(8, 8);          // Compression method: Deflate
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);         // Extra field length

    const localEntry = Buffer.concat([lh, nameBuf, compressed]);
    localParts.push(localEntry);

    // Central Directory Header (46 bytes + nameBuf.length)
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0); // Central directory signature
    cdh.writeUInt16LE(20, 4);         // Version made by
    cdh.writeUInt16LE(20, 6);         // Version needed
    cdh.writeUInt16LE(0x0800, 8);     // UTF-8 flag
    cdh.writeUInt16LE(8, 10);         // Deflate
    cdh.writeUInt16LE(dosTime, 12);
    cdh.writeUInt16LE(dosDate, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(compressed.length, 20);
    cdh.writeUInt32LE(data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);         // Extra field length
    cdh.writeUInt16LE(0, 32);         // Comment length
    cdh.writeUInt16LE(0, 34);         // Disk number start
    cdh.writeUInt16LE(0, 36);         // Internal file attributes
    cdh.writeUInt32LE(0x81a40000, 38); // External file attributes (-rw-r--r--)
    cdh.writeUInt32LE(currentOffset, 42); // Relative offset of local header

    cdParts.push(Buffer.concat([cdh, nameBuf]));
    currentOffset += localEntry.length;
  }

  const cdBuffer = Buffer.concat(cdParts);
  const cdOffset = currentOffset;

  // End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                 // Disk number
  eocd.writeUInt16LE(0, 6);                 // Disk with central directory
  eocd.writeUInt16LE(files.length, 8);      // Entries on this disk
  eocd.writeUInt16LE(files.length, 10);     // Total entries
  eocd.writeUInt32LE(cdBuffer.length, 12);  // Size of central directory
  eocd.writeUInt32LE(cdOffset, 16);         // Offset of central directory
  eocd.writeUInt16LE(0, 20);                // Comment length

  return {
    buffer: Buffer.concat([...localParts, cdBuffer, eocd]),
    filesCount: files.length,
    filesList: files.map(f => f.rel)
  };
}

function packageExtension() {
  const extensionDir = path.resolve(__dirname, '../extensions/parcos-olx-publisher');
  const publicDownloadsDir = path.resolve(__dirname, '../public/downloads');
  const distDownloadsDir = path.resolve(__dirname, '../dist/downloads');

  if (!fs.existsSync(extensionDir)) {
    throw new Error(`Directorul extensiei nu există: ${extensionDir}`);
  }

  // Citire versiune din manifest.json
  const manifestPath = path.join(extensionDir, 'manifest.json');
  let version = '1.0.0';
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    version = manifest.version || version;
  } catch (e) {}

  console.log(`📦 Împachetare extensie ParcOS OLX Publisher v${version}...`);

  const { buffer, filesCount, filesList } = buildCompliantZip(extensionDir);

  // 1. Salvare în public/downloads/
  if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
  }
  const publicTarget = path.join(publicDownloadsDir, 'parcos-olx-publisher.zip');
  fs.writeFileSync(publicTarget, buffer);
  console.log(`✓ Scris: public/downloads/parcos-olx-publisher.zip (${(buffer.length / 1024).toFixed(1)} KB)`);

  // 2. Salvare în dist/downloads/ (dacă există folderul dist)
  if (fs.existsSync(path.resolve(__dirname, '../dist'))) {
    if (!fs.existsSync(distDownloadsDir)) {
      fs.mkdirSync(distDownloadsDir, { recursive: true });
    }
    const distTarget = path.join(distDownloadsDir, 'parcos-olx-publisher.zip');
    fs.writeFileSync(distTarget, buffer);
    console.log(`✓ Scris: dist/downloads/parcos-olx-publisher.zip (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`🎉 Extensia v${version} a fost împachetată cu succes (${filesCount} fișiere):`);
  filesList.forEach(f => console.log(`   • ${f}`));
}

packageExtension();
