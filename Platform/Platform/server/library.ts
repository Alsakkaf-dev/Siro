import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './db.js';
import { getSetting, newId, setSetting } from './repo.js';
import { extOf, hintsFromPath, kindOfExt, previewOf, DOCTYPE_LABELS, KIND_LABELS, type DocType, type FileKind, type LibBookmark, type LibFacetCount, type LibItem, type LibListResult, type LibStatus, type LibTreeResult } from '../shared/library.js';
import { normalizeText } from '../shared/text.js';

/** المكتبة للقراءة فقط: لا يوجد في هذا الملف أي حذف أو نقل أو كتابة على ملفات المستخدم. */
export const DEFAULT_LIBRARY_ROOT = 'C:\\Users\\GIGIABYTE\\Desktop\\Storage\\The_Boots\\Bachelor in Software Engineering';
export const MAX_FILES = 200_000;
export const MAX_DEPTH = 25;
const SKIP_NAMES = new Set(['node_modules', '$recycle.bin', 'system volume information', 'thumbs.db', 'desktop.ini', '.ds_store']);

export function getRoot(db: Db): string {
  return getSetting(db, 'lib.root') || process.env['PLATFORM_LIBRARY_ROOT'] || DEFAULT_LIBRARY_ROOT;
}
export function getAutoMinutes(db: Db): number {
  const v = Number(getSetting(db, 'lib.auto_minutes'));
  return Number.isFinite(v) && v >= 0 ? v : 15;
}

export const fileIdOf = (rel: string): string => crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16);

/** يحلّ مسار ملف داخل الجذر بأمان (لا خروج من الجذر ولا عبر روابط رمزية). */
export function resolveInside(root: string, rel: string): string | null {
  if (!rel || rel.includes('\0')) return null;
  const parts = rel.split('/');
  if (parts.some((p) => p === '..' || p === '' || p === '.')) return null;
  const full = path.resolve(root, ...parts);
  const rootAbs = path.resolve(root);
  const inside = (p: string, r: string): boolean => p === r || p.startsWith(r.endsWith(path.sep) ? r : r + path.sep);
  if (!inside(full, rootAbs) || full === rootAbs) return null;
  try {
    const realRoot = fs.realpathSync(rootAbs);
    const realFull = fs.realpathSync(full);
    if (!inside(realFull, realRoot)) return null;
    return realFull;
  } catch {
    return null;
  }
}

/* ───── الفحص (Scan) ───── */
export interface ScanResult { at: string; ms: number; scanned: number; added: number; updated: number; missing: number; errors: number; truncated: boolean }
interface Found { rel: string; name: string; size: number; mtime: number }

async function walk(root: string, onFile: (f: Found) => void, stats: { errors: number; truncated: boolean; count: number }): Promise<void> {
  const stack: { abs: string; rel: string[]; depth: number }[] = [{ abs: root, rel: [], depth: 0 }];
  let tick = 0;
  while (stack.length) {
    const cur = stack.pop()!;
    let ents: fs.Dirent[];
    try {
      ents = await fs.promises.readdir(cur.abs, { withFileTypes: true });
    } catch {
      stats.errors++;
      continue;
    }
    for (const e of ents) {
      const name = e.name;
      const low = name.toLowerCase();
      if (name.startsWith('.') || name.startsWith('~$') || SKIP_NAMES.has(low)) continue;
      if (e.isSymbolicLink()) continue; // لا نتبع الروابط: نتجنب الحلقات والخروج من المجلد
      const abs = path.join(cur.abs, name);
      if (e.isDirectory()) {
        if (cur.depth + 1 <= MAX_DEPTH) stack.push({ abs, rel: [...cur.rel, name], depth: cur.depth + 1 });
        continue;
      }
      if (!e.isFile()) continue;
      if (stats.count >= MAX_FILES) {
        stats.truncated = true;
        return;
      }
      try {
        const st = await fs.promises.stat(abs);
        stats.count++;
        onFile({ rel: [...cur.rel, name].join('/'), name, size: st.size, mtime: Math.floor(st.mtimeMs) });
      } catch {
        stats.errors++;
      }
      if (++tick % 400 === 0) await new Promise<void>((r) => setImmediate(r));
    }
  }
}

export async function scanLibrary(db: Db, root: string): Promise<ScanResult> {
  const t0 = Date.now();
  const nowIso = new Date().toISOString();
  const stats = { errors: 0, truncated: false, count: 0 };
  const found: Found[] = [];
  await walk(root, (f) => found.push(f), stats);
  let added = 0;
  let updated = 0;
  let missing = 0;
  db.tx(() => {
    const existing = new Map(db.all<{ rel_path: string; size: number; mtime: number; missing: number }>("SELECT rel_path, size, mtime, missing FROM lib_files WHERE origin = 'local'").map((r) => [r.rel_path, r]));
    for (const f of found) {
      const prev = existing.get(f.rel);
      existing.delete(f.rel);
      const segs = f.rel.split('/');
      const ext = extOf(f.name);
      const kind = kindOfExt(ext);
      const h = hintsFromPath(segs);
      const folder = segs.slice(0, -1).join('/');
      if (!prev) {
        db.run(
          'INSERT INTO lib_files (id, rel_path, name, ext, kind, size, mtime, folder, sem_hint, course_hint, type_hint, missing, first_seen, last_seen) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?)',
          fileIdOf(f.rel), f.rel, f.name, ext, kind, f.size, f.mtime, folder, h.sem, h.course, h.type, nowIso, nowIso,
        );
        added++;
      } else {
        if (prev.size !== f.size || prev.mtime !== f.mtime || prev.missing) updated++;
        db.run('UPDATE lib_files SET name=?, ext=?, kind=?, size=?, mtime=?, folder=?, sem_hint=?, course_hint=?, type_hint=?, missing=0, last_seen=? WHERE rel_path=?', f.name, ext, kind, f.size, f.mtime, folder, h.sem, h.course, h.type, nowIso, f.rel);
      }
    }
    if (!stats.truncated) {
      for (const [rel, r] of existing) {
        if (!r.missing) {
          db.run('UPDATE lib_files SET missing=1 WHERE rel_path=?', rel);
          missing++;
        }
      }
    }
  });
  const res: ScanResult = { at: nowIso, ms: Date.now() - t0, scanned: found.length, added, updated, missing, errors: stats.errors, truncated: stats.truncated };
  setSetting(db, 'lib.last_scan', JSON.stringify(res));
  return res;
}

/* ───── حالة المكتبة ───── */
let scanning = false;
export const isScanning = (): boolean => scanning;

/** يشغّل فحصًا واحدًا في الخلفية؛ إن كان فحص جارٍ يعيد وعده الحالي. */
let current: Promise<ScanResult> | null = null;
export function startScan(getDb: () => Db): Promise<ScanResult> {
  if (current) return current;
  const db = getDb();
  const root = getRoot(db);
  scanning = true;
  current = (async () => {
    try {
      const st = await fs.promises.stat(root).catch(() => null);
      if (!st || !st.isDirectory()) throw new Error('مجلد المكتبة غير موجود');
      return await scanLibrary(getDb(), root);
    } finally {
      scanning = false;
      current = null;
    }
  })();
  current.catch(() => undefined);
  return current;
}

export function libraryStatus(db: Db): LibStatus {
  const root = getRoot(db);
  let exists = false;
  let isDir = false;
  try {
    const st = fs.statSync(root);
    exists = true;
    isDir = st.isDirectory();
  } catch {
    /* غير موجود */
  }
  let last: LibStatus['last_scan'] = null;
  try {
    const j = getSetting(db, 'lib.last_scan');
    last = j ? (JSON.parse(j) as LibStatus['last_scan']) : null;
  } catch {
    last = null;
  }
  const by_kind: Record<string, number> = {};
  for (const r of db.all<{ kind: string; n: number }>('SELECT kind, COUNT(*) n FROM lib_files WHERE missing=0 GROUP BY kind')) by_kind[r.kind] = r.n;
  const files = Object.values(by_kind).reduce((a, b) => a + b, 0);
  return {
    root,
    default_root: DEFAULT_LIBRARY_ROOT,
    root_exists: exists,
    root_is_dir: isDir,
    auto_minutes: getAutoMinutes(db),
    scanning,
    last_scan: last,
    counts: {
      files,
      missing: db.get<{ n: number }>('SELECT COUNT(*) n FROM lib_files WHERE missing=1')?.n ?? 0,
      youtube: db.get<{ n: number }>('SELECT COUNT(*) n FROM lib_youtube')?.n ?? 0,
      by_kind,
    },
  };
}

/* ───── الاستعلام ───── */
interface FileRow { id: string; rel_path: string; name: string; ext: string; kind: string; size: number; mtime: number; folder: string; sem_hint: string | null; course_hint: string | null; type_hint: string | null; missing: number; origin: 'local' | 'drive' | 'pkgdir'; remote_id: string | null; pkg: string | null }
interface MetaRow { ref: string; note: string | null; progress: number; duration: number | null; done: number; opened_at: string | null; opened_count: number }
interface YtRow { id: string; video_id: string; title: string; url: string; course_hint: string | null; added_at: string }

function loadMaps(db: Db): { meta: Map<string, MetaRow>; tags: Map<string, string[]>; courses: Map<string, NonNullable<LibItem['course']>> } {
  const meta = new Map(db.all<MetaRow>('SELECT * FROM lib_meta').map((m) => [m.ref, m]));
  const tags = new Map<string, string[]>();
  for (const t of db.all<{ ref: string; tag: string }>('SELECT ref, tag FROM lib_tags ORDER BY tag')) {
    const a = tags.get(t.ref);
    if (a) a.push(t.tag);
    else tags.set(t.ref, [t.tag]);
  }
  // أحدث فصل يحتوي رمز المادة هو المرجع
  const courses = new Map<string, NonNullable<LibItem['course']>>();
  for (const c of db.all<{ code: string; name: string; color: string; semester_id: string; scode: string }>(
    'SELECT c.code, c.name, c.color, c.semester_id, s.code scode FROM acad_courses c JOIN acad_semesters s ON s.id = c.semester_id ORDER BY s.start_date ASC',
  )) {
    courses.set(c.code.toUpperCase(), { code: c.code, name: c.name, color: c.color, semester_id: c.semester_id, semester_code: c.scode });
  }
  return { meta, tags, courses };
}

function fileItem(r: FileRow, m: ReturnType<typeof loadMaps>): LibItem {
  const ref = `f:${r.id}`;
  const mt = m.meta.get(ref);
  const course = r.course_hint ? (m.courses.get(r.course_hint) ?? null) : null;
  const kind = r.kind as FileKind;
  return {
    ref,
    source: 'file',
    id: r.id,
    title: r.name,
    rel_path: r.rel_path,
    folder: r.folder,
    ext: r.ext,
    kind,
    size: r.size,
    mtime: r.mtime,
    sem: r.sem_hint ?? course?.semester_code ?? null,
    course,
    course_code: r.course_hint,
    type: (r.type_hint as DocType | null) ?? null,
    tags: m.tags.get(ref) ?? [],
    progress: mt?.progress ?? 0,
    duration: mt?.duration ?? null,
    done: !!mt?.done,
    note: mt?.note ?? null,
    opened_at: mt?.opened_at ?? null,
    opened_count: mt?.opened_count ?? 0,
    preview: r.origin === 'drive' ? 'drive' : previewOf(r.ext, kind),
    missing: r.missing === 1,
    origin: r.origin,
    remote_id: r.remote_id,
  };
}
function ytItem(r: YtRow, m: ReturnType<typeof loadMaps>): LibItem {
  const ref = `y:${r.id}`;
  const mt = m.meta.get(ref);
  const course = r.course_hint ? (m.courses.get(r.course_hint.toUpperCase()) ?? null) : null;
  return {
    ref,
    source: 'youtube',
    id: r.id,
    title: r.title,
    rel_path: null,
    folder: '',
    ext: '',
    kind: 'youtube',
    size: 0,
    mtime: Date.parse(r.added_at),
    sem: course?.semester_code ?? null,
    course,
    course_code: r.course_hint,
    type: null,
    tags: m.tags.get(ref) ?? [],
    progress: mt?.progress ?? 0,
    duration: mt?.duration ?? null,
    done: !!mt?.done,
    note: mt?.note ?? null,
    opened_at: mt?.opened_at ?? null,
    opened_count: mt?.opened_count ?? 0,
    preview: null,
    missing: false,
    video_id: r.video_id,
  };
}

export function listYoutube(db: Db): LibItem[] {
  const m = loadMaps(db);
  return db.all<YtRow>('SELECT * FROM lib_youtube ORDER BY added_at DESC').map((r) => ytItem(r, m));
}

export function getItem(db: Db, ref: string): LibItem | null {
  const m = loadMaps(db);
  if (ref.startsWith('f:')) {
    const r = db.get<FileRow>('SELECT * FROM lib_files WHERE id = ?', ref.slice(2));
    return r ? fileItem(r, m) : null;
  }
  if (ref.startsWith('y:')) {
    const r = db.get<YtRow>('SELECT * FROM lib_youtube WHERE id = ?', ref.slice(2));
    return r ? ytItem(r, m) : null;
  }
  return null;
}

export interface ListQuery { q?: string; kind?: string; sem?: string; course?: string; type?: string; tag?: string; folder?: string; sort?: string; dir?: string; page?: number; limit?: number; includeYoutube?: boolean }

const semNum = (s: string): number => Number(/\d+/.exec(s)?.[0] ?? 0);

export function listItems(db: Db, q: ListQuery): LibListResult {
  const m = loadMaps(db);
  let all: LibItem[] = db.all<FileRow>('SELECT * FROM lib_files WHERE missing = 0').map((r) => fileItem(r, m));
  if (q.includeYoutube) all = all.concat(db.all<YtRow>('SELECT * FROM lib_youtube').map((r) => ytItem(r, m)));
  const needle = q.q ? normalizeText(q.q) : '';
  const words = needle.split(/\s+/).filter(Boolean);
  const hay = (i: LibItem): string => normalizeText([i.title, i.rel_path ?? '', i.tags.join(' '), i.note ?? '', i.course?.name ?? '', i.course_code ?? '', i.type ? DOCTYPE_LABELS[i.type] : ''].join(' '));
  const only = (skip: string) => (i: LibItem): boolean =>
    (skip === 'kind' || !q.kind || i.kind === q.kind) &&
    (skip === 'sem' || !q.sem || i.sem === q.sem) &&
    (skip === 'course' || !q.course || (i.course_code ?? '').toUpperCase() === q.course.toUpperCase()) &&
    (skip === 'type' || !q.type || i.type === q.type) &&
    (skip === 'tag' || !q.tag || i.tags.some((t) => t.toLowerCase() === q.tag!.toLowerCase())) &&
    (!q.folder || i.folder === q.folder || i.folder.startsWith(q.folder + '/')) &&
    (!words.length || (() => { const h = hay(i); return words.every((w) => h.includes(w)); })());
  const rows = all.filter(only(''));

  const count = (key: (i: LibItem) => string | null | string[], skip: string, label: (v: string) => string): LibFacetCount[] => {
    const mm = new Map<string, number>();
    for (const i of all.filter(only(skip))) {
      const k = key(i);
      for (const v of Array.isArray(k) ? k : k ? [k] : []) mm.set(v, (mm.get(v) ?? 0) + 1);
    }
    return [...mm].map(([value, c]) => ({ value, label: label(value), count: c })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  };
  const facets: LibListResult['facets'] = {
    kind: count((i) => i.kind, 'kind', (v) => (v === 'youtube' ? 'YouTube' : KIND_LABELS[v as FileKind] ?? v)),
    sem: count((i) => i.sem, 'sem', (v) => v).sort((a, b) => semNum(a.value) - semNum(b.value)),
    course: count((i) => i.course_code, 'course', (v) => { const c = m.courses.get(v.toUpperCase()); return c ? `${c.code} — ${c.name}` : v; }),
    type: count((i) => i.type, 'type', (v) => DOCTYPE_LABELS[v as DocType] ?? v),
    tag: count((i) => i.tags, 'tag', (v) => v),
  };

  const dir = q.dir === 'asc' ? 1 : -1;
  const sort = q.sort ?? 'name';
  const cmp: Record<string, (a: LibItem, b: LibItem) => number> = {
    name: (a, b) => a.title.localeCompare(b.title, 'ar', { numeric: true }),
    mtime: (a, b) => a.mtime - b.mtime,
    size: (a, b) => a.size - b.size,
    kind: (a, b) => String(a.kind).localeCompare(String(b.kind)) || a.title.localeCompare(b.title, 'ar', { numeric: true }),
    opened: (a, b) => (a.opened_at ?? '').localeCompare(b.opened_at ?? ''),
    path: (a, b) => (a.rel_path ?? '').localeCompare(b.rel_path ?? '', 'ar', { numeric: true }),
  };
  const f = cmp[sort] ?? cmp['name']!;
  const d = q.dir ? dir : sort === 'name' || sort === 'kind' || sort === 'path' ? 1 : -1;
  rows.sort((a, b) => d * f(a, b));
  const limit = Math.min(200, Math.max(1, q.limit ?? 50));
  const pages = Math.max(1, Math.ceil(rows.length / limit));
  const page = Math.min(pages, Math.max(1, q.page ?? 1));
  return { items: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, pages, facets };
}

export function treeAt(db: Db, folder: string): LibTreeResult {
  const m = loadMaps(db);
  const prefix = folder ? folder + '/' : '';
  const rows = db.all<FileRow>('SELECT * FROM lib_files WHERE missing = 0 AND (folder = ? OR folder LIKE ? ESCAPE \'\\\')', folder, prefix.replace(/[\\%_]/g, '\\$&') + '%');
  const sub = new Map<string, number>();
  const files: LibItem[] = [];
  for (const r of rows) {
    if (r.folder === folder) {
      files.push(fileItem(r, m));
      continue;
    }
    const rest = r.folder.slice(prefix.length);
    const name = rest.split('/')[0]!;
    sub.set(name, (sub.get(name) ?? 0) + 1);
  }
  files.sort((a, b) => a.title.localeCompare(b.title, 'ar', { numeric: true }));
  const folders = [...sub].map(([name, n]) => ({ name, path: prefix + name, files: n })).sort((a, b) => a.name.localeCompare(b.name, 'ar', { numeric: true }));
  return { path: folder, folders, files };
}

export function recentItems(db: Db, limit: number): LibItem[] {
  const m = loadMaps(db);
  const refs = db.all<{ ref: string }>('SELECT ref FROM lib_meta WHERE opened_at IS NOT NULL ORDER BY opened_at DESC LIMIT ?', Math.min(100, limit * 2));
  const out: LibItem[] = [];
  for (const { ref } of refs) {
    const it = ref.startsWith('f:')
      ? (() => { const r = db.get<FileRow>('SELECT * FROM lib_files WHERE id = ? AND missing = 0', ref.slice(2)); return r ? fileItem(r, m) : null; })()
      : (() => { const r = db.get<YtRow>('SELECT * FROM lib_youtube WHERE id = ?', ref.slice(2)); return r ? ytItem(r, m) : null; })();
    if (it) out.push(it);
    if (out.length >= limit) break;
  }
  return out;
}

/* ───── الوسوم والملاحظات والتقدّم والعلامات ───── */
export const REF_RE = /^[fy]:[0-9a-z]{16}$/;
export function refExists(db: Db, ref: string): boolean {
  if (!REF_RE.test(ref)) return false;
  return ref.startsWith('f:') ? !!db.get('SELECT 1 FROM lib_files WHERE id = ?', ref.slice(2)) : !!db.get('SELECT 1 FROM lib_youtube WHERE id = ?', ref.slice(2));
}
export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const t of input) {
    if (typeof t !== 'string') continue;
    const v = t.replace(/\s+/g, ' ').trim().replace(/^#+/, '').trim().slice(0, 30);
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out.slice(0, 20);
}
export function setTags(db: Db, ref: string, tags: string[]): void {
  db.tx(() => {
    db.run('DELETE FROM lib_tags WHERE ref = ?', ref);
    for (const t of tags) db.run('INSERT INTO lib_tags (ref, tag) VALUES (?, ?)', ref, t);
  });
}
export function allTags(db: Db): { tag: string; count: number }[] {
  return db.all<{ tag: string; count: number }>('SELECT tag, COUNT(*) count FROM lib_tags GROUP BY tag COLLATE NOCASE ORDER BY count DESC, tag');
}
function ensureMeta(db: Db, ref: string): void {
  db.run('INSERT OR IGNORE INTO lib_meta (ref) VALUES (?)', ref);
}
export function patchMeta(db: Db, ref: string, p: { note?: string | null; progress?: number; duration?: number | null; done?: boolean }): void {
  ensureMeta(db, ref);
  if (p.note !== undefined) db.run('UPDATE lib_meta SET note = ? WHERE ref = ?', p.note && p.note.trim() ? p.note.slice(0, 5000) : null, ref);
  if (p.progress !== undefined) db.run('UPDATE lib_meta SET progress = ? WHERE ref = ?', Math.max(0, p.progress), ref);
  if (p.duration !== undefined) db.run('UPDATE lib_meta SET duration = ? WHERE ref = ?', p.duration === null ? null : Math.max(0, p.duration), ref);
  if (p.done !== undefined) db.run('UPDATE lib_meta SET done = ? WHERE ref = ?', p.done ? 1 : 0, ref);
}
export function markOpened(db: Db, ref: string): void {
  ensureMeta(db, ref);
  db.run('UPDATE lib_meta SET opened_at = ?, opened_count = opened_count + 1 WHERE ref = ?', new Date().toISOString(), ref);
}
export function listBookmarks(db: Db, ref: string): LibBookmark[] {
  return db.all<LibBookmark>('SELECT id, ref, pos, label, created_at FROM lib_bookmarks WHERE ref = ? ORDER BY pos, created_at', ref);
}
export function addBookmark(db: Db, ref: string, pos: number, label: string | null): LibBookmark {
  const id = newId();
  const created_at = new Date().toISOString();
  db.run('INSERT INTO lib_bookmarks (id, ref, pos, label, created_at) VALUES (?,?,?,?,?)', id, ref, Math.max(0, pos), label && label.trim() ? label.trim().slice(0, 200) : null, created_at);
  return { id, ref, pos: Math.max(0, pos), label: label && label.trim() ? label.trim().slice(0, 200) : null, created_at };
}
