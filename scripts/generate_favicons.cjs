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

async function buildCircleCarFavicon() {
  console.log('Building authentic RXM Car-in-Circle Favicon...');

  // 1. Extract FULL emblem (bounds: left 0, top 12, width 600, height 564)
  const rawData = await sharp('public/images/rxm-emblem.png')
    .extract({ left: 0, top: 12, width: 600, height: 564 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = rawData.info.width;
  const h = rawData.info.height;

  // 2. Morphological dilation to thicken the circle and car lines so they pop on small screens
  // We dilate by 2 pixels radius
  const thickened = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let maxA = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            const a = rawData.data[(ny * w + nx) * 4 + 3];
            if (a > maxA) maxA = a;
          }
        }
      }
      const idx = (y * w + x) * 4;
      thickened[idx] = 255;     // Pure White
      thickened[idx + 1] = 255; // Pure White
      thickened[idx + 2] = 255; // Pure White
      thickened[idx + 3] = maxA;
    }
  }

  const thickCircleCarPng = await sharp(thickened, {
    raw: { width: w, height: h, channels: 4 }
  }).png().toBuffer();

  // Save reference full-size white circle car
  fs.writeFileSync('public/images/rxm-emblem-circle-white.png', thickCircleCarPng);

  // 3. Render icon function
  async function renderIcon(size) {
    const cornerRadius = Math.round(size * 0.22);
    const borderWidth = Math.max(1, Math.round(size * (size <= 32 ? 0.05 : 0.018)));
    const innerOffset = Math.ceil(borderWidth / 2);
    const innerSize = size - borderWidth;

    // Squircle background with amber accent border
    const bgSvg = Buffer.from(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#09090b"/>
        <rect x="${innerOffset}" y="${innerOffset}" width="${innerSize}" height="${innerSize}" rx="${Math.max(1, cornerRadius - innerOffset)}" fill="none" stroke="#f59e0b" stroke-opacity="0.45" stroke-width="${borderWidth}"/>
      </svg>
    `);

    // Scale circle car emblem: fills 82% of size (for 16/32px: 88%)
    const emblemW = Math.round(size * (size <= 32 ? 0.88 : 0.82));
    const emblemH = Math.round(emblemW * (h / w));

    let emblemSharp = sharp(thickCircleCarPng).resize(emblemW, emblemH, {
      fit: 'contain',
      kernel: size <= 32 ? 'mitchell' : 'lanczos3'
    });

    if (size <= 32) {
      emblemSharp = emblemSharp.linear(1.3, 0); // Increase brightness/contrast
    }

    const resizedEmblem = await emblemSharp.toBuffer();

    const top = Math.round((size - emblemH) / 2);
    const left = Math.round((size - emblemW) / 2);

    const result = await sharp(bgSvg)
      .composite([{ input: resizedEmblem, top, left }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    return result;
  }

  console.log('Rendering 512x512...');
  const png512 = await renderIcon(512);
  fs.writeFileSync('public/favicon-512x512.png', png512);

  console.log('Rendering 192x192...');
  const png192 = await renderIcon(192);
  fs.writeFileSync('public/favicon-192x192.png', png192);

  console.log('Rendering 180x180 (Apple Touch Icon)...');
  const png180 = await renderIcon(180);
  fs.writeFileSync('public/apple-touch-icon.png', png180);

  console.log('Rendering 48x48...');
  const png48 = await renderIcon(48);
  fs.writeFileSync('public/favicon-48x48.png', png48);

  console.log('Rendering 32x32...');
  const png32 = await renderIcon(32);
  fs.writeFileSync('public/favicon-32x32.png', png32);
  fs.writeFileSync('public/favicon.png', png32);

  console.log('Rendering 16x16...');
  const png16 = await renderIcon(16);
  fs.writeFileSync('public/favicon-16x16.png', png16);

  console.log('Packaging multi-res favicon.ico...');
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);

  console.log('Generating scalable favicon.svg...');
  const b64_512 = png512.toString('base64');
  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- RXM Automobile Official Car-in-Circle Emblem Favicon -->
  <image href="data:image/png;base64,${b64_512}" x="0" y="0" width="512" height="512"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgFavicon.trim());

  // Copy to public/rxm/
  fs.mkdirSync('public/rxm', { recursive: true });
  fs.copyFileSync('public/favicon.svg', 'public/rxm/favicon.svg');
  fs.copyFileSync('public/favicon.ico', 'public/rxm/favicon.ico');
  fs.copyFileSync('public/favicon-32x32.png', 'public/rxm/favicon-32x32.png');
  fs.copyFileSync('public/favicon-16x16.png', 'public/rxm/favicon-16x16.png');
  fs.copyFileSync('public/apple-touch-icon.png', 'public/rxm/apple-touch-icon.png');
  fs.copyFileSync('public/favicon-512x512.png', 'public/rxm/favicon-512x512.png');

  console.log('Authentic RXM Car-in-Circle Favicon successfully built and deployed!');
}

buildCircleCarFavicon().catch(err => {
  console.error('Error building circle car favicon:', err);
  process.exit(1);
});
