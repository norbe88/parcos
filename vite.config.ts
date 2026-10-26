import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { mediaStreamingPlugin } from './scripts/vite-plugins/mediaStreamingPlugin';
import { landingStaticPlugin } from './scripts/vite-plugins/landingStaticPlugin';
import { geminiOcrPlugin, handleGeminiOcrProxy } from './scripts/vite-plugins/geminiOcrPlugin';
// Re-exportat pentru compatibilitate teste QA: handleGeminiOcrProxy
export { handleGeminiOcrProxy };
import { marketScraperPlugin } from './scripts/vite-plugins/marketScraperPlugin';

export default defineConfig({
  plugins: [
    react(),
    mediaStreamingPlugin(),
    landingStaticPlugin(),
    geminiOcrPlugin(),
    marketScraperPlugin(),
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
      '/api/lead': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/autolicit-sync': {
        target: process.env.VITE_AUTOLICIT_SYNC_URL || 'https://autolicit.ro/api/v1/dealers/sync',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/autolicit-sync/, ''),
        secure: false,
      },
      '/api/demo': {
        target: process.env.VITE_API_TARGET || 'https://rxmautomobile.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/auth': {
        target: process.env.VITE_API_TARGET || 'https://parcos.ro',
        changeOrigin: true,
        secure: false,
      },
      '/api/superadmin': {
        target: process.env.VITE_API_TARGET || 'https://parcos.ro',
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
