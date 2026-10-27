/** النسخة المنشورة على الإنترنت (Vercel): نفس التطبيق، مع حفظ القاعدة في Vercel Blob واستيراد حزم الفصول تلقائيًا.
 *  نسخة الجهاز (start.bat) لا تستخدم هذا الملف إطلاقًا. */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { loadConfig } from './config.js';
import { openDb, type Db } from './db.js';
import { migrate } from './schema.js';
import { seedIfNeeded } from './seed.js';
import { EventBus } from './events.js';
import { createApp } from './app.js';
import { applyPackage, fetchDriveListing, listImports, previewPackage } from './package.js';

const DB_BLOB = 'platform.db';

/* ───── Vercel Blob (REST مباشرة — بدون حزمة إضافية) ───── */
const token = (): string | null => process.env['BLOB_READ_WRITE_TOKEN'] || null;
const storeId = (t: string): string => t.split('_')[3] ?? '';

async function blobGet(pathname: string): Promise<Buffer | null> {
  const t = token();
  if (!t) return null;
  const r = await fetch(`https://${storeId(t)}.private.blob.vercel-storage.com/${pathname}`, { headers: { authorization: `Bearer ${t}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`blob get ${pathname}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function blobPut(pathname: string, body: Buffer): Promise<void> {
  const t = token();
  if (!t) return;
  const r = await fetch(`https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`, {
    method: 'PUT',
    body: new Uint8Array(body),
    headers: {
      authorization: `Bearer ${t}`,
      'x-api-version': '13',
      'x-vercel-blob-store-id': storeId(t),
      'x-vercel-blob-access': 'private',
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-content-type': 'application/vnd.sqlite3',
      'x-cache-control-max-age': '60',
    },
  });
  if (!r.ok) throw new Error(`blob put ${pathname}: ${r.status} ${(await r.text()).slice(0, 200)}`);
}

/** «SEM-1=<fileId>,SEM-2=<fileId>» → قائمة */
export function parseListingEnv(v: string | undefined): { pkg: string; id: string }[] {
  return (v ?? '').split(',').map((x) => x.trim()).filter(Boolean).flatMap((x) => {
    const [pkg, id] = x.split('=').map((y) => y?.trim() ?? '');
    return pkg && id ? [{ pkg, id }] : [];
  });
}

export async function createOnlineHandler(): Promise<express.Express> {
  const TMP = process.env['PLATFORM_TMP'] ?? '/tmp/platform';
  process.env['PLATFORM_ONLINE'] = '1';
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  const dataDir = path.join(TMP, 'data');
  const backupsDir = path.join(TMP, 'backups');
  fs.mkdirSync(dataDir, { recursive: true });
  const cfg = loadConfig({ dataDir, backupsDir });
  const dbFile = path.join(dataDir, 'platform.db');

  // بيانات راشد: نسخة قابلة للكتابة في /tmp (مسودات الأوامر تُكتب هناك فقط)
  const rashedSrc = path.join(cfg.root, 'exchange', 'rashed');
  const rashed = path.join(TMP, 'rashed');
  if (fs.existsSync(rashedSrc) && !fs.existsSync(rashed)) fs.cpSync(rashedSrc, rashed, { recursive: true });
  if (fs.existsSync(rashed)) process.env['PLATFORM_LIFE_ROOT'] = rashed;

  // استعادة القاعدة من Blob (أول تشغيل للنسخة)
  if (!fs.existsSync(dbFile)) {
    try {
      const buf = await blobGet(DB_BLOB);
      if (buf) fs.writeFileSync(dbFile, buf);
    } catch (e) {
      console.error('[online] تعذّرت استعادة القاعدة من Blob — سنبدأ بقاعدة جديدة', e);
    }
  }
  let db: Db = openDb(dbFile);
  migrate(db);
  seedIfNeeded(db, cfg.seedFile);

  /* الحفظ: لقطة متسقة (VACUUM INTO) ← Blob. متسلسل: لا حفظان في نفس الوقت. */
  let chain: Promise<void> = Promise.resolve();
  let lastDaily = '';
  const persist = (): Promise<void> => {
    chain = chain.then(async () => {
      if (!token()) return;
      const snap = path.join(TMP, `snap-${process.pid}.db`);
      fs.rmSync(snap, { force: true });
      db.backupTo(snap);
      const buf = fs.readFileSync(snap);
      fs.rmSync(snap, { force: true });
      await blobPut(DB_BLOB, buf);
      const day = new Date().toISOString().slice(0, 10);
      if (day !== lastDaily) {
        await blobPut(`backups/${day}.db`, buf);
        lastDaily = day;
      }
    }).catch((e) => console.error('[online] فشل حفظ القاعدة في Blob', e));
    return chain;
  };

  // استيراد حزم الفصول المعرّفة في PLATFORM_PACKAGE_LISTINGS (مرة واحدة لكل حزمة)
  const done = new Set(listImports(db).map((i) => i.pkg));
  let imported = 0;
  for (const { pkg, id } of parseListingEnv(process.env['PLATFORM_PACKAGE_LISTINGS'])) {
    if (done.has(pkg)) continue;
    try {
      const src = await fetchDriveListing(id);
      const p = previewPackage(db, src);
      if (!p.ok || !p.parsed || !p.report) {
        console.error(`[online] الحزمة ${pkg} فيها أخطاء:`, p.errors.slice(0, 5));
        continue;
      }
      applyPackage(db, src, p.parsed, p.report);
      imported++;
    } catch (e) {
      console.error(`[online] تعذّر استيراد ${pkg}`, e);
    }
  }
  if (imported) await persist();

  const bus = new EventBus(() => db);
  const restoreDb = (file: string): void => {
    db.close();
    for (const ext of ['-wal', '-shm']) fs.rmSync(dbFile + ext, { force: true });
    fs.copyFileSync(file, dbFile);
    db = openDb(dbFile);
    migrate(db);
  };
  const app = createApp({ cfg, getDb: () => db, restoreDb, bus });

  const outer = express();
  outer.disable('x-powered-by');
  // كل طلب يغيّر البيانات: نحفظ في Blob قبل إنهاء الاستجابة (الدالة قد تتجمّد بعد الرد)
  // رمز OIDC الذي يحقنه Vercel في كل طلب ← مفتاح Vercel AI Gateway بلا أي مفتاح يدوي
  outer.use((req, _res, next) => {
    const t = req.headers['x-vercel-oidc-token'];
    if (typeof t === 'string' && t) process.env['VERCEL_OIDC_TOKEN'] = t;
    next();
  });
  outer.use((req, res, next) => {
    // تدفق الذكاء لا يغيّر القاعدة (المحادثات تُحفظ بطلب منفصل)
    if (req.method === 'GET' || req.method === 'HEAD' || !req.path.startsWith('/api/') || /^\/api\/ai\/(chat|test\/)/.test(req.path)) return void next();
    const end = res.end.bind(res) as (...a: unknown[]) => express.Response;
    let ended = false;
    (res as { end: unknown }).end = (...args: unknown[]): express.Response => {
      if (ended) return res;
      ended = true;
      void persist().finally(() => end(...args));
      return res;
    };
    next();
  });
  outer.use(app);
  return outer;
}
