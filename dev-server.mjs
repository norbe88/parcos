import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  try {
    const server = await createServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      root: __dirname,
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
    });
    await server.listen();
    console.log('✅ RXM Dealer Showroom running on http://localhost:5173/rxm/');
    server.printUrls();

    // Menține procesul activ pe termen nedeterminat
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('❌ Failed to start Vite server:', err);
    process.exit(1);
  }
}

process.on('exit', (code) => console.log('Process exit with code:', code));
process.on('beforeExit', (code) => console.log('Process beforeExit with code:', code));

start();
