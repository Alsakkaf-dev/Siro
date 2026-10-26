import { createHash } from 'node:crypto';
import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from './config.js';
import { createApiRouter, type Ctx } from './routes.js';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.bcmap': 'application/octet-stream',
  '.pfb': 'application/octet-stream',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

export function buildCsp(scriptHashes: string[] = []): string {
  return [
  "default-src 'self'",
  `script-src 'self' 'wasm-unsafe-eval'${scriptHashes.map((h) => ` 'sha256-${h}'`).join('')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "worker-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ].join('; ');
}
export const CSP = buildCsp();

export function createApp(ctx: Ctx): express.Express {
  const { cfg } = ctx;
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', 'strong');

  const web = cfg.webDir;
  const indexFile = path.join(web, 'index.html');
  // بصمات السكربتات المضمَّنة في index.html (مثل سكربت المظهر) — تُخزَّن حسب وقت تعديل الملف
  let hashCache: { mtime: number; hashes: string[] } = { mtime: -1, hashes: [] };
  const inlineScriptHashes = (): string[] => {
    try {
      const m = fs.statSync(indexFile).mtimeMs;
      if (m !== hashCache.mtime) {
        const html = fs.readFileSync(indexFile, 'utf8');
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => createHash('sha256').update(x[1] ?? '').digest('base64'));
        hashCache = { mtime: m, hashes };
      }
    } catch {
      hashCache = { mtime: -1, hashes: [] };
    }
    return hashCache.hashes;
  };
  // تُحسب عند كل طلب لأن المنفذ قد يُحدَّد بعد الاستماع (المنفذ 0 في الاختبارات)
  const allowedHosts = { has: (h: string): boolean => h === `127.0.0.1:${cfg.port}` || h === `localhost:${cfg.port}` };
  const allowedOrigins = { has: (o: string): boolean => o === `http://127.0.0.1:${cfg.port}` || o === `http://localhost:${cfg.port}` };

  // حماية من DNS-rebinding و CSRF: لا نقبل إلا Host / Origin المحلي
  app.use((req, res, next) => {
    const host = req.headers.host ?? '';
    if (!allowedHosts.has(host)) return void res.status(403).type('text/plain').send('Forbidden host');
    const origin = req.headers.origin;
    if (req.method !== 'GET' && req.method !== 'HEAD' && origin !== undefined && !allowedOrigins.has(origin)) {
      return void res.status(403).type('text/plain').send('Forbidden origin');
    }
    res.setHeader('Content-Security-Policy', buildCsp(inlineScriptHashes()));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    next();
  });

  app.use('/api', compression({ threshold: 512, filter: (req, res) => !/\/raw$/.test(req.path) && compression.filter(req, res) }), (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  }, express.json({ limit: '5mb' }), createApiRouter(ctx));


  function sendWithEncoding(req: express.Request, res: express.Response, abs: string, cache: string): void {
    const ext = path.extname(abs).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', cache);
    res.setHeader('Vary', 'Accept-Encoding');
    const ae = String(req.headers['accept-encoding'] ?? '');
    const compressible = ['.html', '.js', '.mjs', '.css', '.svg', '.json', '.txt'].includes(ext);
    let file = abs;
    if (compressible && /\bbr\b/.test(ae) && fs.existsSync(abs + '.br')) {
      file = abs + '.br';
      res.setHeader('Content-Encoding', 'br');
    } else if (compressible && /\bgzip\b/.test(ae) && fs.existsSync(abs + '.gz')) {
      file = abs + '.gz';
      res.setHeader('Content-Encoding', 'gzip');
    }
    res.sendFile(file, { dotfiles: 'deny', headers: {} }, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  }

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return void res.status(405).end();
    if (!fs.existsSync(indexFile)) {
      return void res.status(503).type('text/plain; charset=utf-8').send('الواجهة غير مبنية بعد. شغّل: npm run build');
    }
    let rel: string;
    try {
      rel = decodeURIComponent(req.path);
    } catch {
      return void res.status(400).end();
    }
    const abs = path.resolve(web, '.' + path.posix.normalize('/' + rel));
    if (!abs.startsWith(path.resolve(web) + path.sep) && abs !== path.resolve(web)) return void res.status(403).end();
    if (path.extname(abs) !== '' && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const immutable = rel.startsWith('/assets/');
      const noCache = rel === '/sw.js' || rel === '/offline.html' || rel === '/manifest.webmanifest';
      return void sendWithEncoding(req, res, abs, immutable ? 'public, max-age=31536000, immutable' : noCache ? 'no-cache' : 'public, max-age=3600');
    }
    if (path.extname(abs) !== '') return void next();
    // مسارات الـ SPA
    return void sendWithEncoding(req, res, indexFile, 'no-cache');
  });

  app.use((_req, res) => void res.status(404).type('text/plain; charset=utf-8').send('غير موجود'));
  return app;
}
