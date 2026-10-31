import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

/** بصمة النسخة: SHA الالتزام على Vercel، وإلا وقت البناء محليًا. تظهر في الإعدادات ويقارنها العميل مع الخادم لتحديث النسخة القديمة. */
const BUILD_ID = (process.env['VERCEL_GIT_COMMIT_SHA'] ?? '').slice(0, 7) || `local-${Date.now().toString(36)}`;
const outDir = path.resolve(import.meta.dirname, 'dist/web');

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'web'),
  base: '/',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    { name: 'build-id', closeBundle() { mkdirSync(outDir, { recursive: true }); writeFileSync(path.join(outDir, 'build.json'), JSON.stringify({ id: BUILD_ID })); } },
  ],
  publicDir: path.resolve(import.meta.dirname, 'web/public'),
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 480,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:4310' },
  },
});
