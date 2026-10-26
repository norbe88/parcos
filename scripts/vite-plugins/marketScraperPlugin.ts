import type { Plugin } from 'vite';
import { fetchAutovitLive } from '../marketScraperHelper.js';

export function marketScraperPlugin(): Plugin {
  const handleMarketLookup = async (req: any, res: any): Promise<boolean> => {
    if (!req.url || !req.url.startsWith('/api/market-lookup')) return false;

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
      return true;
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, reason: err.message, ads: [] }));
      return true;
    }
  };

  return {
    name: 'parcos-market-scraper',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (await handleMarketLookup(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (await handleMarketLookup(req, res)) return;
        next();
      });
    },
  };
}
