import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Load .env
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value.trim();
  }
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'parcos-media';
const PUBLIC_BASE = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

const filesToUpload = [
  {
    localPath: 'public/videos/parcos-showroom-intro.mp4',
    r2Key: 'videos/parcos-showroom-intro.mp4',
    contentType: 'video/mp4',
  },
  {
    localPath: 'public/videos/parcos-showroom-intro.webm',
    r2Key: 'videos/parcos-showroom-intro.webm',
    contentType: 'video/webm',
  },
  {
    localPath: 'public/images/parcos-showroom-hall.jpg',
    r2Key: 'images/parcos-showroom-hall.jpg',
    contentType: 'image/jpeg',
  },
  {
    localPath: 'public/images/parcos-showroom-hall-lastframe.jpg',
    r2Key: 'images/parcos-showroom-hall-lastframe.jpg',
    contentType: 'image/jpeg',
  },
  {
    localPath: 'public/images/showcase/porsche-cayenne-showcase.jpg',
    r2Key: 'images/showcase/porsche-cayenne-showcase.jpg',
    contentType: 'image/jpeg',
  },
  {
    localPath: 'public/images/showcase/mercedes-e-class-showcase.jpg',
    r2Key: 'images/showcase/mercedes-e-class-showcase.jpg',
    contentType: 'image/jpeg',
  },
  {
    localPath: 'public/images/showcase/audi-rs7-showcase.jpg',
    r2Key: 'images/showcase/audi-rs7-showcase.jpg',
    contentType: 'image/jpeg',
  },
  {
    localPath: 'public/images/showcase/bmw-x5-showcase.jpg',
    r2Key: 'images/showcase/bmw-x5-showcase.jpg',
    contentType: 'image/jpeg',
  },
];

async function main() {
  console.log(`Starting upload to Cloudflare R2 bucket "${BUCKET}"...`);
  console.log(`Public CDN Base URL: ${PUBLIC_BASE}`);

  for (const item of filesToUpload) {
    const fullLocalPath = path.join(process.cwd(), item.localPath);
    if (!fs.existsSync(fullLocalPath)) {
      console.warn(`⚠️ Fișierul local lipsește: ${item.localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(fullLocalPath);
    const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`\nUploading ${item.localPath} (${sizeMb} MB) -> ${item.r2Key}...`);

    const startTime = Date.now();
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: item.r2Key,
      Body: fileBuffer,
      ContentType: item.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const durationMs = Date.now() - startTime;
    console.log(`✅ Upload finalizat în ${durationMs}ms`);

    // Verificare publică prin CDN
    const publicUrl = `${PUBLIC_BASE}/${item.r2Key}`;
    try {
      const headRes = await fetch(publicUrl, { method: 'HEAD' });
      console.log(`   CDN Status: ${headRes.status} ${headRes.statusText}`);
      console.log(`   Content-Type: ${headRes.headers.get('content-type')}`);
      console.log(`   Content-Length: ${headRes.headers.get('content-length')} bytes`);
      console.log(`   URL: ${publicUrl}`);
    } catch (err) {
      console.error(`   Eroare verificare CDN:`, err.message);
    }
  }

  console.log('\n🎉 Toate fișierele de intro au fost migrate în Cloudflare R2!');
}

main().catch(console.error);
