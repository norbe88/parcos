import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { fetchAutovitLive } from './scripts/marketScraperHelper.js';

async function handleGeminiOcrProxy(req: any, res: any): Promise<boolean> {
  if (!req.url || (!req.url.startsWith('/api/ocr/gemini/') && !req.url.startsWith('/api/admin/ocr/gemini/'))) return false;

  try {
    const subpath = req.url.replace(/^\/api\/(?:admin\/)?ocr\/gemini\//, '');
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const secretKeys = (process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const apiKey = secretKeys[0];

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY nu este configurat în mediu pentru dev proxy.' }));
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
    res.end(JSON.stringify({ error: err.message }));
    return true;
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rxm-path-rewrite',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
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
      configurePreviewServer(server) {
        server.middlewares.use(async (req, res, next) => {
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
