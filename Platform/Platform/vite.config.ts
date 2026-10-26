import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'web'),
  base: '/',
  plugins: [react()],
  publicDir: path.resolve(__dirname, 'web/public'),
  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
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
