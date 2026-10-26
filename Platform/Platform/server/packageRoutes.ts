import express from 'express';
import type { Ctx } from './routes.js';
import { HttpError } from './routes.js';
import { ValidationError } from './validation.js';
import { createBackup } from './backup.js';
import * as pkg from './package.js';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };

/** المصدر في جسم الطلب: { kind: 'drive', link } | { kind: 'local', path } | { kind: 'listing', listing } */
async function readSource(body: unknown): Promise<pkg.PackageSource> {
  const b = (body ?? {}) as { kind?: unknown; link?: unknown; path?: unknown; listing?: unknown };
  try {
    if (b.kind === 'drive') return await pkg.readDrivePackage(str(b.link), process.env['PLATFORM_DRIVE_API_KEY']);
    if (b.kind === 'local') {
      if (process.env['PLATFORM_ONLINE'] === '1') throw new Error('الاستيراد من مجلد محلي متاح فقط في نسخة الجهاز');
      const p = str(b.path).trim();
      if (!/^([A-Za-z]:[\\/]|\\\\|\/)/.test(p)) throw new Error('اكتب المسار الكامل للمجلد');
      return await pkg.readLocalPackage(p);
    }
    if (b.kind === 'listing') return typeof (b as { link?: unknown }).link === 'string' && str((b as { link?: unknown }).link).trim() ? await pkg.fetchDriveListing(str((b as { link?: unknown }).link)) : pkg.readListing(b.listing);
  } catch (e) {
    throw new ValidationError({ source: e instanceof Error ? e.message : 'تعذّر قراءة الحزمة' });
  }
  throw new ValidationError({ source: 'اختر مصدر الحزمة' });
}

const publicPreview = (p: ReturnType<typeof pkg.previewPackage>): pkg.PackagePreview => {
  const { parsed: _parsed, ...rest } = p;
  return rest;
};

export function createPackageRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = () => ctx.getDb();

  r.get('/', wrap((_req, res) => void res.json({ imports: pkg.listImports(db()), drive_api: !!process.env['PLATFORM_DRIVE_API_KEY'], online: process.env['PLATFORM_ONLINE'] === '1' })));

  r.post('/preview', wrap(async (req, res) => {
    const src = await readSource(req.body);
    res.json(publicPreview(pkg.previewPackage(db(), src)));
  }));

  r.post('/apply', wrap(async (req, res) => {
    const src = await readSource(req.body);
    const p = pkg.previewPackage(db(), src);
    if (!p.ok || !p.parsed || !p.report) throw new HttpError(422, `الحزمة فيها أخطاء — لم يُستورد شيء: ${p.errors.slice(0, 3).join(' | ')}`);
    const backup = createBackup(db(), ctx.cfg.backupsDir, 'pre-package');
    const result = pkg.applyPackage(db(), src, p.parsed, p.report);
    res.json({ ok: true, backup: backup.name, ...result });
  }));

  r.get('/results/:semId', wrap((req, res) => void res.json(pkg.resultsFor(db(), str(req.params['semId'])))));

  return r;
}
