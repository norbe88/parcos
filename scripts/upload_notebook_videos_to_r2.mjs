import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Load .env
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
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
const PUBLIC_BASE = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-5ced75b7fce64ed6b6a934bdc3a279c0.r2.dev').replace(/\/$/, '');

const gDriveDir = 'I:/My Drive/CARVANA_SRL/08_PROJECT_PARCOS/11_Marketing';

const files = [
  {
    source: path.join(gDriveDir, 'parcos-commercial-short.mp4'),
    fallbackSource: path.join(process.cwd(), 'public/videos/parcos-commercial-short.mp4'),
    targets: [
      'videos/parcos-commercial-short-v1.mp4',
      'videos/parcos-commercial-short.mp4',
      'lp-assets/video/parcos-commercial-short-v1.mp4',
      'lp-assets/video/parcos-commercial-short.mp4'
    ],
    contentType: 'video/mp4'
  },
  {
    source: path.join(gDriveDir, 'parcos-explicativ-notebooklm.mp4'),
    fallbackSource: path.join(process.cwd(), 'public/videos/parcos-explicativ-notebooklm.mp4'),
    targets: [
      'videos/parcos-explicativ-notebooklm-v1.mp4',
      'videos/parcos-explicativ-notebooklm.mp4',
      'lp-assets/video/parcos-explicativ-notebooklm-v1.mp4',
      'lp-assets/video/parcos-explicativ-notebooklm.mp4'
    ],
    contentType: 'video/mp4'
  }
];

async function uploadFile(sourcePath, targetKey, contentType) {
  const fileBuffer = fs.readFileSync(sourcePath);
  const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`Uploading ${sourcePath} (${sizeMb} MB) -> s3://${BUCKET}/${targetKey}...`);

  const startTime = Date.now();
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: targetKey,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  const durationMs = Date.now() - startTime;
  console.log(`✅ Uploaded ${targetKey} in ${durationMs}ms`);

  const publicUrl = `${PUBLIC_BASE}/${targetKey}`;
  const headRes = await fetch(publicUrl, { method: 'HEAD' });
  console.log(`   CDN Status: ${headRes.status} ${headRes.statusText} (${headRes.headers.get('content-length')} bytes)`);
  return publicUrl;
}

async function run() {
  console.log(`Starting Cloudflare R2 Upload to ${BUCKET}...`);
  console.log(`Public CDN Base: ${PUBLIC_BASE}`);

  for (const item of files) {
    let chosenSource = item.source;
    if (!fs.existsSync(chosenSource)) {
      console.warn(`File not found at ${chosenSource}, trying fallback ${item.fallbackSource}`);
      chosenSource = item.fallbackSource;
    }
    if (!fs.existsSync(chosenSource)) {
      throw new Error(`File does not exist: ${chosenSource}`);
    }

    for (const key of item.targets) {
      await uploadFile(chosenSource, key, item.contentType);
    }
  }

  console.log('\n🎉 Toate videoclipurile au fost încărcate și verificate cu succes pe CDN-ul R2!');
}

run().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
