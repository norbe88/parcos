/**
 * Optimizator Imagini Sharp & Uploader Cloudflare R2 pentru stocul MPI Auto
 * Descarcă pozele, le convertește în WebP (max 1600px) și le urcă pe R2 CDN.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Auto-loader .env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[match[1]]) process.env[match[1]] = val;
    }
  });
}

const DATA_DIR = path.resolve(__dirname, '../../data/import/mpi');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const CARS_JSON = path.join(DATA_DIR, 'cars.json');
const CARS_WITH_CDN_JSON = path.join(DATA_DIR, 'cars_with_cdn.json');

const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'parcos-media';
const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-5ced75b7fce64ed6b6a934bdc3a279c0.r2.dev').replace(/\/$/, '');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'ParcOS-import/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} la ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Timeout la descărcare ${url}`));
    });
  });
}

async function uploadToR2(key, body, contentType = 'image/webp') {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable'
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function processSingleImage(carId, rawUrl, idx) {
  const carFolder = path.join(IMAGES_DIR, carId);
  if (!fs.existsSync(carFolder)) fs.mkdirSync(carFolder, { recursive: true });

  const localWebpPath = path.join(carFolder, `image_${String(idx + 1).padStart(2, '0')}.webp`);
  const r2Key = `cars/${carId}/image_${String(idx + 1).padStart(2, '0')}.webp`;
  const expectedCdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;

  let webpBuffer;

  if (fs.existsSync(localWebpPath)) {
    webpBuffer = fs.readFileSync(localWebpPath);
  } else {
    try {
      const rawBuf = await downloadBuffer(rawUrl);
      webpBuffer = await sharp(rawBuf, { failOnError: false })
        .rotate()
        .resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(localWebpPath, webpBuffer);
    } catch (err) {
      console.warn(`  ⚠️ [${carId} #${idx + 1}] Skip:`, err.message);
      return null;
    }
  }

  try {
    await uploadToR2(r2Key, webpBuffer);
    return expectedCdnUrl;
  } catch (r2Err) {
    console.warn(`  ⚠️ Upload eșuat [${r2Key}]:`, r2Err.message);
    return null;
  }
}

// Procesare imagini per mașină cu concurență controlată (3 paralele)
async function processCarImages(car, maxImages = 10) {
  const rawImages = car.images || [];
  const targetImages = maxImages > 0 ? rawImages.slice(0, maxImages) : rawImages;
  const cdnUrls = [];

  const CONCURRENCY = 3;
  for (let i = 0; i < targetImages.length; i += CONCURRENCY) {
    const slice = targetImages.slice(i, i + CONCURRENCY);
    const promises = slice.map((url, offset) => processSingleImage(car.id, url, i + offset));
    const results = await Promise.all(promises);
    results.forEach(res => {
      if (res) cdnUrls.push(res);
    });
  }

  return cdnUrls;
}

async function run() {
  if (!fs.existsSync(CARS_JSON)) {
    throw new Error(`Nu s-a găsit fișierul ${CARS_JSON}. Rulați mai întâi scrape_mpi_stock.cjs!`);
  }

  const cars = JSON.parse(fs.readFileSync(CARS_JSON, 'utf8'));
  console.log(`🚀 Începem optimizarea și upload-ul pentru ${cars.length} autovehicule în Cloudflare R2...`);

  // Detectăm opțiuni: ex --max-images=8
  const maxImagesArg = process.argv.find(a => a.startsWith('--max-images='));
  const maxImages = maxImagesArg ? parseInt(maxImagesArg.split('=')[1], 10) : 8;
  console.log(`📸 Imagini per vehicul: max ${maxImages}`);

  // Încărcare cache parțial dacă reluăm
  let processedCars = [];
  if (fs.existsSync(CARS_WITH_CDN_JSON)) {
    try {
      processedCars = JSON.parse(fs.readFileSync(CARS_WITH_CDN_JSON, 'utf8'));
    } catch {}
  }
  const processedMap = new Map(processedCars.map(c => [c.id, c]));

  let totalUploaded = 0;

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    
    // Verificăm dacă a fost deja complet procesat cu imagini CDN
    if (processedMap.has(car.id)) {
      const existing = processedMap.get(car.id);
      if (existing.images && existing.images.length >= maxImages && existing.images[0].includes('r2.dev')) {
        process.stdout.write(`[${i + 1}/${cars.length}] ${car.stockNumber} ${car.brand} ${car.model}... ⏭️ Deja procesat (${existing.images.length} poze)\n`);
        totalUploaded += existing.images.length;
        continue;
      }
    }

    const t0 = Date.now();
    process.stdout.write(`[${i + 1}/${cars.length}] ${car.stockNumber} ${car.brand} ${car.model}... `);

    const cdnImages = await processCarImages(car, maxImages);
    totalUploaded += cdnImages.length;

    const carWithCdn = {
      ...car,
      images: cdnImages.length > 0 ? cdnImages : car.images,
      originalImages: car.images
    };

    processedMap.set(car.id, carWithCdn);
    console.log(`✅ ${cdnImages.length} poze în ${((Date.now() - t0)/1000).toFixed(1)}s`);

    // Salvare incrementală la fiecare mașină
    const updatedList = Array.from(processedMap.values());
    fs.writeFileSync(CARS_WITH_CDN_JSON, JSON.stringify(updatedList, null, 2), 'utf8');
  }

  console.log(`\n🎉 Finalizat! Total poze optimizate & urcate în R2: ${totalUploaded}`);
  console.log(`💾 Salvat inventar actualizat cu CDN în: ${CARS_WITH_CDN_JSON}`);
}

if (require.main === module) {
  run().catch(err => {
    console.error('💥 Eroare fatală:', err);
    process.exit(1);
  });
}

module.exports = { processCarImages, uploadToR2 };
