import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { resolveInside, fileIdOf } from '../server/library.js';
import { hintsFromPath, parseYouTube, previewOf, kindOfExt, extOf, fmtTime } from '../shared/library.js';
import { tmpDir } from './helpers.js';
// @ts-expect-error JS helper
import { buildLibraryFixture } from '../scripts/lib-fixture.mjs';

describe('library hints (path → semester/course/type)', () => {
  it('reads course code, semester and type from folders', () => {
    const h = hintsFromPath(['Year 3', 'Semester 1', 'SCSE3103 Cognitive Computing', 'Lectures', 'Lecture 1 Intro.pdf']);
    expect(h).toEqual({ sem: 'SEM 5', course: 'SCSE3103', type: 'lecture' });
    expect(hintsFromPath(['Year 2', 'Semester 2', 'Past Year Exam 2024.pdf'])).toEqual({ sem: 'SEM 4', course: null, type: 'exam' });
    expect(hintsFromPath(['SEM 6', 'skex 2123', 'quiz 1.pdf'])).toMatchObject({ sem: 'SEM 6', course: 'SKEX2123', type: 'quiz' });
    expect(hintsFromPath(['random', 'file.bin'])).toEqual({ sem: null, course: null, type: null });
    expect(hintsFromPath(['الفصل 3', 'محاضرة 2.pdf'])).toMatchObject({ sem: 'SEM 3', type: 'lecture' });
  });
  it('does not invent: 2024 / 1080 are not course codes', () => {
    expect(hintsFromPath(['report 2024.pdf']).course).toBeNull();
  });
  it('kinds and previews', () => {
    expect(kindOfExt('PDF')).toBe('pdf');
    expect(extOf('a.b.DOCX')).toBe('docx');
    expect(previewOf('docx', 'word')).toBe('docx');
    expect(previewOf('doc', 'word')).toBeNull();
    expect(previewOf('mkv', 'video')).toBeNull();
    expect(previewOf('mp4', 'video')).toBe('video');
    expect(fmtTime(3725)).toBe('1:02:05');
  });
  it('parses YouTube urls', () => {
    expect(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s')).toEqual({ id: 'dQw4w9WgXcQ', start: 90 });
    expect(parseYouTube('https://youtu.be/dQw4w9WgXcQ?t=1m5s')).toEqual({ id: 'dQw4w9WgXcQ', start: 65 });
    expect(parseYouTube('dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ');
    expect(parseYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ');
    expect(parseYouTube('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseYouTube('not a url')).toBeNull();
  });
});

let srv: Running;
let base: string;
let dir: string;
let lib: string;
async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      if (n.isDirectory()) walk(p);
      else out[path.relative(root, p)] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex') + ':' + fs.statSync(p).mtimeMs;
    }
  };
  walk(root);
  return out;
}

beforeAll(async () => {
  dir = tmpDir();
  lib = path.join(dir, 'MyLibrary');
  await buildLibraryFixture(lib);
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  // لا نمسح المجلد الحقيقي The_Boots أثناء الاختبار: نوجّه الجذر عبر env إلى مسار مفقود.
  process.env['PLATFORM_LIBRARY_ROOT'] = path.join(dir, 'missing-library-root');
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  delete process.env['PLATFORM_LIBRARY_ROOT'];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe(`library API (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  let before: Record<string, string>;
  let pdfRef = '';
  it('reports a missing folder clearly and refuses to scan', async () => {
    const s = await call('GET', '/api/library/status');
    expect(s.json.root_exists).toBe(false);
    expect(s.json.default_root).toContain('The_Boots');
    expect(s.json.default_root).toContain('Bachelor in Software Engineering');
    const sc = await call('POST', '/api/library/scan?wait=1');
    expect(sc.status).toBe(422);
  });
  it('validates settings', async () => {
    expect((await call('PUT', '/api/library/settings', { root: 'relative/path' })).status).toBe(400);
    expect((await call('PUT', '/api/library/settings', { root: path.join(dir, 'nope') })).json.fields.root).toMatch(/غير موجود/);
    expect((await call('PUT', '/api/library/settings', { auto_minutes: -1 })).status).toBe(400);
  });
  it('scans a folder; skips hidden / temp / node_modules; read-only', async () => {
    before = snapshot(lib);
    const put = await call('PUT', '/api/library/settings', { root: lib, auto_minutes: 30 });
    expect(put.status).toBe(200);
    const sc = await call('POST', '/api/library/scan?wait=1');
    expect(sc.status).toBe(200);
    expect(sc.json.result.scanned).toBe(10);
    expect(sc.json.result.added).toBe(10);
    const again = await call('POST', '/api/library/scan?wait=1');
    expect(again.json.result.added).toBe(0);
    expect(again.json.result.updated).toBe(0);
    const st = await call('GET', '/api/library/status');
    expect(st.json.counts.files).toBe(10);
    expect(st.json.counts.by_kind.pdf).toBe(2);
    expect(st.json.auto_minutes).toBe(30);
  });
  it('lists with facets and filters', async () => {
    const all = await call('GET', '/api/library/items?limit=100');
    expect(all.json.total).toBe(10);
    const k = Object.fromEntries(all.json.facets.kind.map((f: any) => [f.value, f.count]));
    expect(k).toMatchObject({ pdf: 2, word: 1, image: 1, video: 2 });
    const sem5 = await call('GET', '/api/library/items?sem=' + encodeURIComponent('SEM 5'));
    expect(sem5.json.total).toBe(5);
    // SCSE3103 موجودة في بيانات SEM 5 → ربط بالمادة الحقيقية
    const c = await call('GET', '/api/library/items?course=SCSE3103');
    expect(c.json.total).toBe(3);
    expect(c.json.items[0].course.semester_code).toBe('SEM 5');
    expect((await call('GET', '/api/library/items?type=quiz')).json.total).toBe(1);
    expect((await call('GET', '/api/library/items?q=' + encodeURIComponent('lab report'))).json.total).toBe(1);
    expect((await call('GET', '/api/library/items?q=nothing-like-this')).json.total).toBe(0);
    pdfRef = (await call('GET', '/api/library/items?kind=pdf&q=lecture')).json.items[0].ref;
    expect(pdfRef).toMatch(/^f:[0-9a-f]{16}$/);
  });
  it('browses the folder tree', async () => {
    const root = await call('GET', '/api/library/tree');
    expect(root.json.folders.map((f: any) => f.name).sort()).toEqual(['Misc', 'Year 2', 'Year 3']);
    const sub = await call('GET', '/api/library/tree?path=' + encodeURIComponent('Year 3/Semester 1/SCSE3103 Cognitive Computing/Labs'));
    expect(sub.json.files.map((f: any) => f.title)).toEqual(['Lab 2 Report.docx']);
    expect((await call('GET', '/api/library/tree?path=../etc')).status).toBe(400);
  });
  it('serves raw files with Range support and a sandbox CSP', async () => {
    const vid = (await call('GET', '/api/library/items?q=clip')).json.items[0];
    expect(vid.preview).toBe('video');
    const r1 = await fetch(`${base}/api/library/files/${vid.id}/raw`, { headers: { Range: 'bytes=10-19' } });
    expect(r1.status).toBe(206);
    expect(r1.headers.get('content-range')).toBe('bytes 10-19/20000');
    expect(r1.headers.get('content-type')).toBe('video/mp4');
    expect(r1.headers.get('content-security-policy')).toMatch(/sandbox/);
    expect((await r1.arrayBuffer()).byteLength).toBe(10);
    const r2 = await fetch(`${base}/api/library/files/${vid.id}/raw`, { headers: { Range: 'bytes=-5' } });
    expect(r2.headers.get('content-range')).toBe('bytes 19995-19999/20000');
    expect((await fetch(`${base}/api/library/files/${vid.id}/raw`, { headers: { Range: 'bytes=999999-' } })).status).toBe(416);
    const full = await fetch(`${base}/api/library/files/${vid.id}/raw`);
    expect(full.status).toBe(200);
    expect((await full.arrayBuffer()).byteLength).toBe(20000);
  });
  it('previews docx and text; refuses unsupported', async () => {
    const d = (await call('GET', '/api/library/items?q=lab')).json.items[0];
    const h = await call('GET', `/api/library/files/${d.id}/docx`);
    expect(h.json.html).toContain('Lab report body text');
    const t = (await call('GET', '/api/library/items?q=quiz1')).json.items[0];
    expect((await call('GET', `/api/library/files/${t.id}/text`)).json.text).toContain('42');
    expect((await call('GET', `/api/library/files/${t.id}/docx`)).status).toBe(415);
    const md = (await call('GET', '/api/library/items?q=summary')).json.items[0];
    expect((await call('GET', `/api/library/files/${md.id}/text`)).json.text).toContain('مرحبا');
  });
  it('cannot escape the library folder', async () => {
    expect(resolveInside(lib, '../data/platform.db')).toBeNull();
    expect(resolveInside(lib, 'Misc/../../x')).toBeNull();
    expect(resolveInside(lib, '/etc/passwd')).toBeNull();
    expect(resolveInside(lib, 'Misc/diagram.png')).toBeTruthy();
    // رابط رمزي يخرج من الجذر
    const outside = path.join(dir, 'outside.txt');
    fs.writeFileSync(outside, 'secret');
    try {
      fs.symlinkSync(outside, path.join(lib, 'Misc', 'link.txt'));
      expect(resolveInside(lib, 'Misc/link.txt')).toBeNull();
      // الفحص لا يتبع الروابط الرمزية أصلًا
      const sc = await call('POST', '/api/library/scan?wait=1');
      expect(sc.json.result.scanned).toBe(10);
      fs.rmSync(path.join(lib, 'Misc', 'link.txt'));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EPERM') throw e;
    }
    expect((await fetch(`${base}/api/library/files/${fileIdOf('../../etc/passwd')}/raw`)).status).toBe(404);
  });
  it('tags, notes, progress, done, recent', async () => {
    expect((await call('PUT', `/api/library/tags/${pdfRef}`, { tags: [' #خوارزميات ', 'exam', 'EXAM', ''] })).json.tags).toEqual(['exam', 'خوارزميات']);
    expect((await call('GET', '/api/library/items?tag=EXAM')).json.total).toBe(1);
    expect((await call('GET', '/api/library/tags')).json.map((t: any) => t.tag).sort()).toEqual(['exam', 'خوارزميات']);
    const m = await call('PUT', `/api/library/meta/${pdfRef}`, { note: 'مراجعة قبل الميدتيرم', progress: 2, duration: 3 });
    expect(m.json).toMatchObject({ note: 'مراجعة قبل الميدتيرم', progress: 2, duration: 3, done: false });
    expect((await call('PUT', `/api/library/meta/${pdfRef}`, { progress: -1 })).status).toBe(400);
    expect((await call('PUT', `/api/library/meta/${pdfRef}`, { done: true })).json.done).toBe(true);
    expect((await call('GET', '/api/library/recent')).json).toEqual([]);
    expect((await call('POST', `/api/library/open/${pdfRef}`)).status).toBe(200);
    const rec = (await call('GET', '/api/library/recent')).json;
    expect(rec).toHaveLength(1);
    expect(rec[0].opened_count).toBe(1);
    expect((await call('PUT', '/api/library/tags/f:0000000000000000', { tags: ['x'] })).status).toBe(404);
    expect((await call('PUT', '/api/library/tags/bad', { tags: ['x'] })).status).toBe(404);
  });
  it('bookmarks (pages / seconds)', async () => {
    const b1 = await call('POST', `/api/library/bookmarks/${pdfRef}`, { pos: 3, label: 'تعريف مهم' });
    expect(b1.status).toBe(201);
    await call('POST', `/api/library/bookmarks/${pdfRef}`, { pos: 1 });
    const list = (await call('GET', `/api/library/bookmarks/${pdfRef}`)).json;
    expect(list.map((b: any) => b.pos)).toEqual([1, 3]);
    expect((await call('POST', `/api/library/bookmarks/${pdfRef}`, { pos: -4 })).status).toBe(400);
    expect((await call('PATCH', `/api/library/bookmark/${b1.json.id}`, { label: 'جديد' })).status).toBe(200);
    expect((await call('DELETE', `/api/library/bookmark/${b1.json.id}`)).status).toBe(200);
    expect((await call('GET', `/api/library/bookmarks/${pdfRef}`)).json).toHaveLength(1);
  });
  it('YouTube items: add, duplicate, progress, edit, delete record only', async () => {
    const bad = await call('POST', '/api/library/youtube', { url: 'https://example.com/x' });
    expect(bad.status).toBe(400);
    const ok = await call('POST', '/api/library/youtube', { url: 'https://youtu.be/dQw4w9WgXcQ?t=30', title: 'محاضرة خارجية', course: 'scse3103' });
    expect(ok.status).toBe(201);
    expect(ok.json).toMatchObject({ source: 'youtube', title: 'محاضرة خارجية', video_id: 'dQw4w9WgXcQ', progress: 30, course_code: 'SCSE3103' });
    expect(ok.json.course.semester_code).toBe('SEM 5');
    expect((await call('POST', '/api/library/youtube', { url: 'dQw4w9WgXcQ' })).json.fields.url).toMatch(/مسبقًا/);
    const ref = ok.json.ref;
    await call('PUT', `/api/library/meta/${ref}`, { progress: 75.5, duration: 212 });
    await call('POST', `/api/library/bookmarks/${ref}`, { pos: 61, label: 'الشرح' });
    expect((await call('PATCH', `/api/library/youtube/${ok.json.id}`, { title: 'عنوان معدّل' })).json.title).toBe('عنوان معدّل');
    expect((await call('GET', '/api/library/items?yt=1&q=' + encodeURIComponent('معدّل'))).json.total).toBe(1);
    expect((await call('GET', '/api/library/youtube')).json).toHaveLength(1);
    expect((await call('DELETE', `/api/library/youtube/${ok.json.id}`)).status).toBe(200);
    expect((await call('GET', `/api/library/bookmarks/${ref}`)).status).toBe(404);
  });
  it('marks vanished files as missing but keeps their tags', async () => {
    const gone = path.join(lib, 'Misc', 'diagram.png');
    const bak = fs.readFileSync(gone);
    const img = (await call('GET', '/api/library/items?q=diagram')).json.items[0];
    await call('PUT', `/api/library/tags/${img.ref}`, { tags: ['keep'] });
    fs.rmSync(gone);
    const sc = await call('POST', '/api/library/scan?wait=1');
    expect(sc.json.result.missing).toBe(1);
    expect((await call('GET', '/api/library/items?q=diagram')).json.total).toBe(0);
    expect((await call('GET', `/api/library/files/${img.id}/raw`)).status).toBe(404);
    fs.writeFileSync(gone, bak);
    await call('POST', '/api/library/scan?wait=1');
    expect((await call('GET', '/api/library/items?q=diagram')).json.items[0].tags).toEqual(['keep']);
  });
  it('NEVER modifies the library files (hash + mtime identical)', () => {
    const after = snapshot(lib);
    for (const [k, v] of Object.entries(before)) {
      if (k.endsWith('diagram.png')) continue; // أعدنا كتابته داخل الاختبار نفسه
      expect(after[k], k).toBe(v);
    }
  });
  it('library endpoints reject foreign Host', async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: srv.cfg.port, path: '/api/library/status', headers: { Host: 'evil.example.com' } }, (res) => { res.resume(); resolve(res.statusCode ?? 0); });
      req.on('error', reject);
      req.end();
    });
    expect(status).toBe(403);
  });
});
