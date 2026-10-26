import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function handleParcosStaticLanding(req: any, res: any): boolean {
  if (!req.url) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const [cleanUrl, rawQuery] = req.url.split('?');
  const searchParams = new URLSearchParams(rawQuery || '');

  // Dacă cererea vizează showroom-ul unui dealer, consola admin/portal sau asset-uri interne React/Vite, nu interceptăm
  if (
    searchParams.has('dealer') ||
    searchParams.get('mode') === 'showroom' ||
    searchParams.get('mode') === 'superadmin' ||
    searchParams.get('app') === 'true' ||
    searchParams.get('react') === 'true' ||
    cleanUrl.startsWith('/admin') ||
    cleanUrl.startsWith('/portal') ||
    cleanUrl.startsWith('/ghid') ||
    cleanUrl.startsWith('/livrare') ||
    cleanUrl.startsWith('/termeni') ||
    cleanUrl.startsWith('/cookie') ||
    cleanUrl.startsWith('/@') ||
    cleanUrl.startsWith('/src/') ||
    cleanUrl.startsWith('/node_modules/')
  ) {
    return false;
  }

  // 1. Pagina principală ParcOS (/ sau /index.html) -> Servește noul landing page static v5
  if (cleanUrl === '/' || cleanUrl === '/index.html') {
    const landingFile = path.resolve(process.cwd(), 'landing', 'index.html');
    if (fs.existsSync(landingFile)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(landingFile).pipe(res);
      return true;
    }
  }

  // 2. Pagina Politica de Confidențialitate
  if (cleanUrl === '/politica-de-confidentialitate' || cleanUrl === '/politica-de-confidentialitate.html') {
    const privacyFile = path.resolve(process.cwd(), 'landing', 'politica-de-confidentialitate.html');
    if (fs.existsSync(privacyFile)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(privacyFile).pipe(res);
      return true;
    }
  }

  return false;
}

export function landingStaticPlugin(): Plugin {
  return {
    name: 'parcos-landing-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handleParcosStaticLanding(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handleParcosStaticLanding(req, res)) return;
        next();
      });
    },
  };
}
