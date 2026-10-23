import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

import { fetchAutovitLive } from './scripts/marketScraperHelper.js';

function handleMediaStreaming(req: any, res: any): boolean {
  if (!req.url) return false;
  const cleanUrl = req.url.split('?')[0];
  const isVideo = cleanUrl.startsWith('/videos/') || cleanUrl.endsWith('.mp4');
  const isCarImage = cleanUrl.startsWith('/cars/') || cleanUrl.startsWith('/rxm/cars/') || cleanUrl.endsWith('.webp');

  if (!isVideo && !isCarImage) {
    return false;
  }

  let relativePath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
  let filePath = path.resolve(__dirname, 'public', relativePath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    if (relativePath.startsWith('cars/')) {
      filePath = path.resolve(__dirname, 'public', 'rxm', relativePath);
    } else if (relativePath.startsWith('rxm/cars/')) {
      filePath = path.resolve(__dirname, 'public', relativePath.replace('rxm/cars/', 'cars/'));
    }
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.mp4' ? 'video/mp4' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
  const range = req.headers.range;

  if (range && ext === '.mp4') {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
      });
      res.end();
      return true;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    });
    file.pipe(res);
    return true;
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
}

async function handleGeminiOcrProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/ocr/gemini/') && !req.url.startsWith('/api/admin/ocr/gemini/'))) return false;

  try {
    const subpath = req.url.replace(/^\/api\/(?:admin\/)?ocr\/gemini\//, '');
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const availableKeys = (process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const apiKey = availableKeys[0];

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Serviciul de procesare automată a documentelor nu este disponibil.' }));
      return true;
    }

    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${subpath}`;
    const upstreamRes = await fetch(targetUrl, {
      method: req.method || 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'x-goog-api-key': apiKey
      },
      body: bodyBuffer.length > 0 ? bodyBuffer : undefined
    });

    res.statusCode = upstreamRes.status;
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    const resText = await upstreamRes.text();
    res.end(resText);
    return true;
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Eroare la procesarea internă a documentului.' }));
    return true;
  }
}

const DEV_DEMO_MAX_SCANS = 3;
const devDemoScanMap = new Map<string, { count: number; resetAt: number }>();

async function handleDemoOcrProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/demo/ocr-scan') && !req.url.startsWith('/api/demo/ocr-quota'))) {
    return false;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  // GET /api/demo/ocr-quota
  if (req.method === 'GET' && req.url.startsWith('/api/demo/ocr-quota')) {
    const urlObj = new URL(req.url, 'http://localhost');
    const clientToken = urlObj.searchParams.get('clientToken') || (req.headers['x-client-token'] as string) || '';
    
    let maxUsed = 0;
    const now = Date.now();
    for (const key of [clientIp, clientToken].filter(Boolean)) {
      const entry = devDemoScanMap.get(key);
      if (entry && now < entry.resetAt) {
        maxUsed = Math.max(maxUsed, entry.count);
      }
    }
    const remaining = Math.max(0, DEV_DEMO_MAX_SCANS - maxUsed);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      remainingScans: remaining,
      limitReached: remaining <= 0,
      maxAllowed: DEV_DEMO_MAX_SCANS
    }));
    return true;
  }

  // POST /api/demo/ocr-scan
  if (req.method === 'POST' && req.url.startsWith('/api/demo/ocr-scan')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    let parsed: any = {};
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'JSON invalid' }));
      return true;
    }

    const clientToken = parsed.clientToken || (req.headers['x-client-token'] as string) || '';
    let maxUsed = 0;
    const now = Date.now();
    for (const key of [clientIp, clientToken].filter(Boolean)) {
      const entry = devDemoScanMap.get(key);
      if (entry && now < entry.resetAt) {
        maxUsed = Math.max(maxUsed, entry.count);
      }
    }

    if (maxUsed >= DEV_DEMO_MAX_SCANS) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        limitReached: true,
        remainingScans: 0,
        error: 'Ați atins limita de 3 scanări gratuite pentru test.',
        message: 'Ai testat puterea scannerului ParcOS AI pe 3 documente reale. Pentru scanări nelimitate, integrare automată în contracte și acces complet la platformă, solicită un cont dealer sau programează un demo live.'
      }));
      return true;
    }

    const { imageBase64, mimeType = 'image/jpeg' } = parsed;
    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Lipsă imageBase64' }));
      return true;
    }

    const availableKeys = (process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();
    const promptText = `You are an expert automotive document analyst specializing in European vehicle registration documents:
- Romania: CIV & Talon
- Germany: Zulassungsbescheinigung Teil I & II
- Austria: Zulassungsbescheinigung Teil I (Zulassungsschein) & Typenschein (KFG 1967).
- France: Carte Grise
- Italy: Carta di Circolazione
Analyze the document image. Extract strict JSON:
{
  "docOriginCountry": "AT", // "RO", "DE", "AT", "FR", "IT", "OTHER"
  "docType": "Zulassungsbescheinigung Teil I",
  "brand": "VOLKSWAGEN",
  "model": "Passat",
  "versionTrim": "",
  "vin": "WVWZZZ...",
  "year": 2018,
  "registrationDate": "14.05.2018",
  "powerKw": 110,
  "powerHp": 150,
  "engineCc": 1968,
  "fuelType": "Diesel",
  "color": "Negru",
  "bodyType": "Break",
  "civNumber": "",
  "plateNumber": "",
  "euroNorm": "Euro 6",
  "co2": "108 g/km",
  "confidenceScore": 99
}
Strict Rules:
1. Brand is actual brand, model must NOT repeat brand.
2. VIN must be exactly 17 alphanumeric characters (field E or FIN).
3. For Austria: Field B gives Erstmalige Zulassung, P.1 Hubraum, P.2 Leistung (kW), P.3 Antriebsart.
4. Return null for unreadable fields. Strictly output JSON with no fences.`;

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    let extracted: any = null;

    try {
      for (const model of candidateModels) {
        if (extracted) break;
        for (const devKey of availableKeys) {
          try {
            const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${devKey}`;
            const upstreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: cleanedBase64 } }] }],
                generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
              })
            });

            if (!upstreamRes.ok) {
              continue;
            }

            const resJson = await upstreamRes.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
              extracted = JSON.parse(cleanJsonText);
              break;
            }
          } catch (_) {}
        }
      }

      if (!extracted) {
        res.statusCode = 422;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: false,
          error: 'Documentul nu a putut fi citit automat. Vă rugăm să folosiți o fotografie clară, bine focalizată a documentului.'
        }));
        return true;
      }

      // increment usage
      const resetAt = now + 24 * 60 * 60 * 1000;
      let newCount = 1;
      for (const key of [clientIp, clientToken].filter(Boolean)) {
        const entry = devDemoScanMap.get(key);
        if (!entry || now > entry.resetAt) {
          devDemoScanMap.set(key, { count: 1, resetAt });
        } else {
          entry.count += 1;
          newCount = Math.max(newCount, entry.count);
        }
      }

      const remaining = Math.max(0, DEV_DEMO_MAX_SCANS - newCount);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        remainingScans: remaining,
        limitReached: remaining <= 0,
        vehicleData: extracted
      }));
      return true;
    } catch (_) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Documentul nu a putut fi citit automat. Vă rugăm să folosiți o fotografie clară, bine iluminată și focalizată.'
      }));
      return true;
    }
  }

  return false;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rxm-path-rewrite',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (handleMediaStreaming(req, res)) return;
          if (await handleGeminiOcrProxy(req, res)) return;
          if (await handleDemoOcrProxy(req, res)) return;

          if (req.url && req.url.startsWith('/api/market-lookup')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost');
              const brand = urlObj.searchParams.get('brand') || '';
              const model = urlObj.searchParams.get('model') || '';
              const year = parseInt(urlObj.searchParams.get('year') || '2015', 10);
              const mileage = parseInt(urlObj.searchParams.get('mileage') || '160000', 10);

              const yearFrom = urlObj.searchParams.get('yearFrom') ? parseInt(urlObj.searchParams.get('yearFrom')!, 10) : undefined;
              const yearTo = urlObj.searchParams.get('yearTo') ? parseInt(urlObj.searchParams.get('yearTo')!, 10) : undefined;
              const maxKm = urlObj.searchParams.get('maxKm') ? parseInt(urlObj.searchParams.get('maxKm')!, 10) : undefined;

              const result = await fetchAutovitLive(brand, model, year, mileage, { yearFrom, yearTo, maxKm });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, reason: err.message, ads: [] }));
              return;
            }
          }
          if (req.url && req.url.startsWith('/rxm/cars/')) {
            req.url = req.url.replace('/rxm/cars/', '/cars/');
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (handleMediaStreaming(req, res)) return;
          if (await handleGeminiOcrProxy(req, res)) return;

          if (req.url && req.url.startsWith('/api/market-lookup')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost');
              const brand = urlObj.searchParams.get('brand') || '';
              const model = urlObj.searchParams.get('model') || '';
              const year = parseInt(urlObj.searchParams.get('year') || '2015', 10);
              const mileage = parseInt(urlObj.searchParams.get('mileage') || '160000', 10);

              const yearFrom = urlObj.searchParams.get('yearFrom') ? parseInt(urlObj.searchParams.get('yearFrom')!, 10) : undefined;
              const yearTo = urlObj.searchParams.get('yearTo') ? parseInt(urlObj.searchParams.get('yearTo')!, 10) : undefined;
              const maxKm = urlObj.searchParams.get('maxKm') ? parseInt(urlObj.searchParams.get('maxKm')!, 10) : undefined;

              const result = await fetchAutovitLive(brand, model, year, mileage, { yearFrom, yearTo, maxKm });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, reason: err.message, ads: [] }));
              return;
            }
          }
          if (req.url && req.url.startsWith('/rxm/cars/')) {
            req.url = req.url.replace('/rxm/cars/', '/cars/');
          }
          next();
        });
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    cors: true,
    watch: {
      ignored: ['**/public/**', '**/.git/**'],
    },
    proxy: {
      '/api/demo': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/auth': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/admin': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/vehicles': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/upload': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/mail': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/rxm/api': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/cars': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
      '/rxm/cars': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
