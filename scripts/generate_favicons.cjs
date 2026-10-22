const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const directorySize = 16 * count;
  let offset = headerSize + directorySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function buildParcOSFavicons() {
  console.log('🚀 Building official ParcOS Favicon suite from public/brand/parcos-app-icon.png...');

  const masterSource = 'public/brand/parcos-app-icon.png';
  if (!fs.existsSync(masterSource)) {
    throw new Error(`Master brand source ${masterSource} does not exist!`);
  }

  // 1. Render Squircle Icon Function (with transparent rounded corners)
  async function renderSquircleIcon(size) {
    const cornerRadius = Math.round(size * 0.22);
    const maskSvg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff"/>
      </svg>`
    );

    let pipeline = sharp(masterSource)
      .resize(size, size, {
        kernel: size <= 32 ? sharp.kernel.mitchell : sharp.kernel.lanczos3
      });

    // Enhance clarity for tiny sizes (16, 32)
    if (size <= 32) {
      pipeline = pipeline.sharpen({ sigma: 1.0, m1: 1.5, m2: 0.7 });
    }

    const result = await pipeline
      .composite([{ input: maskSvg, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    return result;
  }

  // 2. Render Full-Bleed Square Icon (for Apple Touch Icon as required by iOS)
  async function renderSquareIcon(size) {
    return await sharp(masterSource)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  console.log('  -> Rendering 512x512...');
  const png512 = await renderSquircleIcon(512);
  fs.writeFileSync('public/favicon-512x512.png', png512);
  fs.writeFileSync('public/brand/icon-512x512.png', png512);

  console.log('  -> Rendering 192x192...');
  const png192 = await renderSquircleIcon(192);
  fs.writeFileSync('public/favicon-192x192.png', png192);
  fs.writeFileSync('public/brand/icon-192x192.png', png192);

  console.log('  -> Rendering 180x180 (Apple Touch Icon - Full Bleed)...');
  const png180 = await renderSquareIcon(180);
  fs.writeFileSync('public/apple-touch-icon.png', png180);

  console.log('  -> Rendering 64x64...');
  const png64 = await renderSquircleIcon(64);
  fs.writeFileSync('public/favicon-64x64.png', png64);
  fs.writeFileSync('public/brand/icon-64x64.png', png64);

  console.log('  -> Rendering 48x48...');
  const png48 = await renderSquircleIcon(48);
  fs.writeFileSync('public/favicon-48x48.png', png48);

  console.log('  -> Rendering 32x32...');
  const png32 = await renderSquircleIcon(32);
  fs.writeFileSync('public/favicon-32x32.png', png32);
  fs.writeFileSync('public/favicon.png', png32);
  fs.writeFileSync('public/brand/icon-32x32.png', png32);

  console.log('  -> Rendering 16x16...');
  const png16 = await renderSquircleIcon(16);
  fs.writeFileSync('public/favicon-16x16.png', png16);
  fs.writeFileSync('public/brand/icon-16x16.png', png16);

  console.log('  -> Packaging multi-resolution favicon.ico (16x16, 32x32, 48x48)...');
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);

  console.log('  -> Generating scalable modern favicon.svg...');
  const b64_512 = png512.toString('base64');
  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- ParcOS Official Brand Logo Favicon -->
  <defs>
    <clipPath id="parcos-squircle">
      <rect width="512" height="512" rx="112" ry="112" />
    </clipPath>
  </defs>
  <g clip-path="url(#parcos-squircle)">
    <image href="data:image/png;base64,${b64_512}" x="0" y="0" width="512" height="512" />
  </g>
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgFavicon.trim());

  console.log('✅ Official ParcOS Favicon suite successfully generated and deployed to /public!');
}

buildParcOSFavicons().catch(err => {
  console.error('❌ Error building ParcOS favicons:', err);
  process.exit(1);
});
