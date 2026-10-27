const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateExtensionIcons() {
  const masterSource = path.join(__dirname, '../public/brand/parcos-app-icon.png');
  const targetDir = path.join(__dirname, '../extensions/parcos-olx-publisher/icons');

  if (!fs.existsSync(masterSource)) {
    throw new Error('Master source does not exist: ' + masterSource);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const sizes = [16, 32, 48, 128];

  for (const size of sizes) {
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

    if (size <= 32) {
      pipeline = pipeline.sharpen({ sigma: 1.0, m1: 1.5, m2: 0.7 });
    }

    const buffer = await pipeline
      .composite([{ input: maskSvg, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    const destPath = path.join(targetDir, `icon${size}.png`);
    fs.writeFileSync(destPath, buffer);
    console.log(`✓ Generated icon${size}.png (${buffer.length} bytes)`);
  }

  console.log('🎉 Extension icons generated successfully in', targetDir);
}

generateExtensionIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
