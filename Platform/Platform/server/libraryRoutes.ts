import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Ctx } from './routes.js';
import { HttpError } from './routes.js';
import { ValidationError } from './validation.js';
import { newId, setSetting } from './repo.js';
import * as lib from './library.js';
import { MIME, driveUrls, parseYouTube } from '../shared/library.js';

const require = createRequire(import.meta.url);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };

/** ملفات تُقدَّم كنص لا كـ HTML/SVG حتى لا تُنفَّذ داخل أصل الموقع. */
const TEXTY = new Set(['html', 'htm', 'xhtml', 'js', 'mjs', 'xml']);

export function createLibraryRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = () => ctx.getDb();

  const fileOr404 = (id: string): { row: { rel_path: string; name: string; ext: string; size: number; mtime: number }; abs: string } => {
    const row = db().get<{ rel_path: string; name: string; ext: string; size: number; mtime: number; missing: number; origin: string; remote_id: string | null }>('SELECT rel_path, name, ext, size, mtime, missing, origin, remote_id FROM lib_files WHERE id = ?', id);
    if (!row) throw new HttpError(404, 'الملف غير موجود في المكتبة');
    if (row.origin === 'drive') throw new HttpError(409, 'هذا الملف محفوظ في Google Drive — افتحه من معاينة Drive');
    if (row.origin === 'pkgdir') {
      // ملف من حزمة محلية: المسار المطلق محفوظ وقت الاستيراد
      if (!row.remote_id || !fs.existsSync(row.remote_id)) throw new HttpError(404, 'الملف لم يعد موجودًا على القرص (أعد استيراد الحزمة)');
      return { row, abs: row.remote_id };
    }
    const abs = lib.resolveInside(lib.getRoot(db()), row.rel_path);
    if (!abs) throw new HttpError(404, 'الملف لم يعد موجودًا على القرص (أعد الفحص)');
    return { row, abs };
  };
  const refOr404 = (ref: string): string => {
    if (!lib.refExists(db(), ref)) throw new HttpError(404, 'العنصر غير موجود');
    return ref;
  };

  /* ── الحالة والإعدادات والفحص ── */
  r.get('/status', wrap((_req, res) => void res.json(lib.libraryStatus(db()))));

  r.put('/settings', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const errors: Record<string, string> = {};
    if (b['root'] !== undefined) {
      const root = str(b['root']).trim();
      if (!root) errors['root'] = 'اكتب مسار المجلد';
      else if (!path.isAbsolute(root) && !/^[A-Za-z]:[\\/]/.test(root)) errors['root'] = 'يجب أن يكون المسار كاملًا، مثل C:\\Users\\...';
      else {
        try {
          if (!fs.statSync(root).isDirectory()) errors['root'] = 'هذا المسار ليس مجلدًا';
        } catch {
          errors['root'] = 'المجلد غير موجود على هذا الجهاز';
        }
      }
      if (!errors['root']) setSetting(db(), 'lib.root', root);
    }
    if (b['auto_minutes'] !== undefined) {
      const n = num(b['auto_minutes']);
      if (n === undefined || !Number.isInteger(n) || n < 0 || n > 1440) errors['auto_minutes'] = 'رقم صحيح من 0 (إيقاف) إلى 1440 دقيقة';
      else setSetting(db(), 'lib.auto_minutes', String(n));
    }
    if (Object.keys(errors).length) throw new ValidationError(errors);
    if (b['root'] !== undefined) void lib.startScan(ctx.getDb).catch(() => undefined);
    res.json(lib.libraryStatus(db()));
  }));

  r.post('/scan', wrap(async (req, res) => {
    const p = lib.startScan(ctx.getDb);
    if (req.query['wait'] === '1') {
      try {
        res.json({ ok: true, result: await p });
      } catch (e) {
        throw new HttpError(422, e instanceof Error ? e.message : 'فشل الفحص');
      }
      return;
    }
    p.catch(() => undefined);
    res.status(202).json({ ok: true, started: true });
  }));

  /* ── القوائم ── */
  r.get('/items', wrap((req, res) => {
    const q = req.query;
    res.json(
      lib.listItems(db(), {
        q: str(q['q']),
        kind: str(q['kind']) || undefined,
        sem: str(q['sem']) || undefined,
        course: str(q['course']) || undefined,
        type: str(q['type']) || undefined,
        tag: str(q['tag']) || undefined,
        folder: str(q['folder']) || undefined,
        sort: str(q['sort']) || undefined,
        dir: str(q['dir']) || undefined,
        page: num(q['page']),
        limit: num(q['limit']),
        includeYoutube: q['yt'] === '1',
      }),
    );
  }));
  r.get('/tree', wrap((req, res) => {
    const folder = str(req.query['path']).replace(/^\/+|\/+$/g, '');
    if (folder.split('/').some((p) => p === '..')) throw new HttpError(400, 'مسار غير صالح');
    res.json(lib.treeAt(db(), folder));
  }));
  r.get('/recent', wrap((req, res) => void res.json(lib.recentItems(db(), Math.min(50, num(req.query['limit']) ?? 12)))));
  r.get('/tags', wrap((_req, res) => void res.json(lib.allTags(db()))));
  r.get('/item/:ref', wrap((req, res) => {
    const it = lib.getItem(db(), str(req.params['ref']));
    if (!it) throw new HttpError(404, 'العنصر غير موجود');
    res.json(it);
  }));

  /* ── محتوى الملفات (قراءة فقط) ── */
  r.get('/files/:id/raw', wrap((req, res) => {
    const remote = db().get<{ remote_id: string | null }>("SELECT remote_id FROM lib_files WHERE id = ? AND origin = 'drive'", str(req.params['id']));
    if (remote?.remote_id) return void res.redirect(302, driveUrls(remote.remote_id).download);
    const { row, abs } = fileOr404(str(req.params['id']));
    let st: fs.Stats;
    try {
      st = fs.statSync(abs);
    } catch {
      throw new HttpError(404, 'الملف لم يعد موجودًا على القرص');
    }
    if (!st.isFile()) throw new HttpError(404, 'ليس ملفًا');
    const ext = row.ext.toLowerCase();
    const download = req.query['download'] === '1';
    const type = TEXTY.has(ext) ? 'text/plain; charset=utf-8' : (MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Content-Type', type);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.setHeader('ETag', `W/"${st.size}-${Math.floor(st.mtimeMs)}"`);
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'");
    const fname = encodeURIComponent(row.name);
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${fname}`);
    if (req.headers['if-none-match'] === res.getHeader('ETag')) return void res.status(304).end();
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers['range'] ?? ''));
    let start = 0;
    let end = st.size - 1;
    if (range && st.size > 0) {
      if (range[1] === '' && range[2] !== '') {
        start = Math.max(0, st.size - Number(range[2]));
      } else {
        start = Number(range[1]);
        if (range[2] !== '') end = Math.min(end, Number(range[2]));
      }
      if (!(start <= end) || start >= st.size) {
        res.setHeader('Content-Range', `bytes */${st.size}`);
        return void res.status(416).end();
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`);
    }
    res.setHeader('Content-Length', st.size === 0 ? 0 : end - start + 1);
    if (req.method === 'HEAD' || st.size === 0) return void res.end();
    const stream = fs.createReadStream(abs, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }));

  r.get('/files/:id/text', wrap(async (req, res) => {
    const { row, abs } = fileOr404(str(req.params['id']));
    const max = Math.min(2_000_000, num(req.query['max']) ?? 400_000);
    const fh = await fs.promises.open(abs, 'r');
    try {
      const st = await fh.stat();
      const len = Math.min(st.size, max);
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, 0);
      let text = buf.toString('utf8');
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      res.json({ name: row.name, text, truncated: st.size > max, size: st.size });
    } finally {
      await fh.close();
    }
  }));

  r.get('/files/:id/docx', wrap(async (req, res) => {
    const { row, abs } = fileOr404(str(req.params['id']));
    if (row.ext.toLowerCase() !== 'docx') throw new HttpError(415, 'المعاينة متاحة لملفات docx فقط');
    if (row.size > 40 * 1024 * 1024) throw new HttpError(413, 'الملف كبير جدًا للمعاينة (أكثر من 40 ميغابايت)');
    const mammoth = require('mammoth') as { convertToHtml: (i: { path: string }) => Promise<{ value: string; messages: { type: string; message: string }[] }> };
    try {
      const out = await mammoth.convertToHtml({ path: abs });
      res.json({ html: out.value, messages: out.messages.slice(0, 10).map((m) => m.message) });
    } catch (e) {
      throw new HttpError(422, 'تعذّرت قراءة المستند: ' + (e instanceof Error ? e.message : ''));
    }
  }));

  /* ── يوتيوب ── */
  r.post('/youtube', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const p = parseYouTube(str(b['url']));
    if (!p) throw new ValidationError({ url: 'رابط YouTube غير صالح' });
    const title = str(b['title']).trim().slice(0, 200) || `فيديو YouTube ${p.id}`;
    const course = str(b['course']).trim().toUpperCase().slice(0, 20) || null;
    if (db().get('SELECT 1 FROM lib_youtube WHERE video_id = ?', p.id)) throw new ValidationError({ url: 'هذا الفيديو مضاف مسبقًا' });
    const id = newId();
    db().run('INSERT INTO lib_youtube (id, video_id, title, url, course_hint, added_at) VALUES (?,?,?,?,?,?)', id, p.id, title, `https://www.youtube.com/watch?v=${p.id}`, course, new Date().toISOString());
    if (p.start > 0) lib.patchMeta(db(), `y:${id}`, { progress: p.start });
    res.status(201).json(lib.getItem(db(), `y:${id}`));
  }));
  r.get('/youtube', wrap((_req, res) => void res.json(lib.listYoutube(db()))));
  r.patch('/youtube/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = db().get<{ id: string }>('SELECT id FROM lib_youtube WHERE id = ?', id);
    if (!cur) throw new HttpError(404, 'الفيديو غير موجود');
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (b['title'] !== undefined) {
      const t = str(b['title']).trim().slice(0, 200);
      if (!t) throw new ValidationError({ title: 'العنوان مطلوب' });
      db().run('UPDATE lib_youtube SET title = ? WHERE id = ?', t, id);
    }
    if (b['course'] !== undefined) db().run('UPDATE lib_youtube SET course_hint = ? WHERE id = ?', str(b['course']).trim().toUpperCase().slice(0, 20) || null, id);
    res.json(lib.getItem(db(), `y:${id}`));
  }));
  /** يحذف سجل الفيديو من الموقع فقط (لا علاقة له بملفات الجهاز). */
  r.delete('/youtube/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const ref = `y:${id}`;
    if (!lib.refExists(db(), ref)) throw new HttpError(404, 'الفيديو غير موجود');
    db().tx(() => {
      db().run('DELETE FROM lib_youtube WHERE id = ?', id);
      db().run('DELETE FROM lib_tags WHERE ref = ?', ref);
      db().run('DELETE FROM lib_meta WHERE ref = ?', ref);
      db().run('DELETE FROM lib_bookmarks WHERE ref = ?', ref);
    });
    res.json({ ok: true });
  }));

  /* ── الوسوم / الملاحظات / التقدّم / العلامات ── */
  r.put('/tags/:ref', wrap((req, res) => {
    const ref = refOr404(str(req.params['ref']));
    lib.setTags(db(), ref, lib.normalizeTags((req.body as { tags?: unknown } | undefined)?.tags));
    res.json(lib.getItem(db(), ref));
  }));
  r.put('/meta/:ref', wrap((req, res) => {
    const ref = refOr404(str(req.params['ref']));
    const b = (req.body ?? {}) as Record<string, unknown>;
    const p: Parameters<typeof lib.patchMeta>[2] = {};
    if (b['note'] !== undefined) p.note = b['note'] === null ? null : str(b['note']);
    if (b['progress'] !== undefined) {
      const n = num(b['progress']);
      if (n === undefined || n < 0) throw new ValidationError({ progress: 'قيمة غير صالحة' });
      p.progress = n;
    }
    if (b['duration'] !== undefined) {
      const n = b['duration'] === null ? null : num(b['duration']);
      if (n === undefined) throw new ValidationError({ duration: 'قيمة غير صالحة' });
      p.duration = n;
    }
    if (b['done'] !== undefined) p.done = b['done'] === true;
    lib.patchMeta(db(), ref, p);
    res.json(lib.getItem(db(), ref));
  }));
  r.post('/open/:ref', wrap((req, res) => {
    const ref = refOr404(str(req.params['ref']));
    lib.markOpened(db(), ref);
    res.json({ ok: true });
  }));
  r.get('/bookmarks/:ref', wrap((req, res) => void res.json(lib.listBookmarks(db(), refOr404(str(req.params['ref']))))));
  r.post('/bookmarks/:ref', wrap((req, res) => {
    const ref = refOr404(str(req.params['ref']));
    const b = (req.body ?? {}) as Record<string, unknown>;
    const pos = num(b['pos']);
    if (pos === undefined || pos < 0) throw new ValidationError({ pos: 'الموضع مطلوب (ثوانٍ أو رقم صفحة)' });
    res.status(201).json(lib.addBookmark(db(), ref, pos, b['label'] === undefined ? null : str(b['label'])));
  }));
  r.patch('/bookmark/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    if (!db().get('SELECT 1 FROM lib_bookmarks WHERE id = ?', id)) throw new HttpError(404, 'العلامة غير موجودة');
    db().run('UPDATE lib_bookmarks SET label = ? WHERE id = ?', str((req.body as { label?: unknown } | undefined)?.label).trim().slice(0, 200) || null, id);
    res.json({ ok: true });
  }));
  r.delete('/bookmark/:id', wrap((req, res) => {
    const n = db().run('DELETE FROM lib_bookmarks WHERE id = ?', str(req.params['id'])).changes;
    if (!n) throw new HttpError(404, 'العلامة غير موجودة');
    res.json({ ok: true });
  }));

  return r;
}
