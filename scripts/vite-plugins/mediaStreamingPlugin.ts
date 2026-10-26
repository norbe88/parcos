import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function handleMediaStreaming(req: any, res: any): boolean {
  if (!req.url) return false;
  const cleanUrl = req.url.split('?')[0];
  const isVideo = cleanUrl.startsWith('/videos/') || cleanUrl.endsWith('.mp4');
  const isCarImage = cleanUrl.startsWith('/cars/') || cleanUrl.startsWith('/rxm/cars/') || cleanUrl.endsWith('.webp');

  if (!isVideo && !isCarImage) {
    return false;
  }

  let relativePath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
  let filePath = path.resolve(process.cwd(), 'public', relativePath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    if (relativePath.startsWith('cars/')) {
      filePath = path.resolve(process.cwd(), 'public', 'rxm', relativePath);
    } else if (relativePath.startsWith('rxm/cars/')) {
      filePath = path.resolve(process.cwd(), 'public', relativePath.replace('rxm/cars/', 'cars/'));
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

export function mediaStreamingPlugin(): Plugin {
  return {
    name: 'parcos-media-streaming',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handleMediaStreaming(req, res)) return;
        if (req.url && req.url.startsWith('/rxm/cars/')) {
          req.url = req.url.replace('/rxm/cars/', '/cars/');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handleMediaStreaming(req, res)) return;
        if (req.url && req.url.startsWith('/rxm/cars/')) {
          req.url = req.url.replace('/rxm/cars/', '/cars/');
        }
        next();
      });
    },
  };
}
