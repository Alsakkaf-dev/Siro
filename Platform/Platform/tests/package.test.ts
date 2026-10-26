import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { checkPackage, parseCourseDir, courseDirName, semNoOfPackage, CATEGORIES } from '../shared/package.js';
import { driveFolderId } from '../server/package.js';
import { loadSeed, ROOT, tmpDir } from './helpers.js';

describe('package format (pure)', () => {
  it('parses course folders with and without section; rejects free names', () => {
    expect(parseCourseDir('SCSE3103-05 Cognitive Computing')).toEqual({ code: 'SCSE3103', section: '05', title: 'Cognitive Computing' });
    expect(parseCourseDir('UHLB2122')).toEqual({ code: 'UHLB2122', section: null, title: null });
    expect(parseCourseDir('CC SCSE3103-05')).toBeNull();
    expect(parseCourseDir('DB')).toBeNull();
    expect(courseDirName('SCSR1013', '01', 'Digital: Logic/x')).toBe('SCSR1013-01 Digital Logic x');
  });
  it('SEM-N names only', () => {
    expect(semNoOfPackage('SEM-5')).toBe(5);
    expect(semNoOfPackage('SEM 5')).toBeNull();
    expect(semNoOfPackage('Year 3')).toBeNull();
  });
  it('keeps the existing numbering convention', () => {
    expect(CATEGORIES.slice(0, 8).map((c) => c.dir)).toEqual(['01-Course-Information', '02-Lectures', '03-Labs', '04-Assignments', '05-Projects', '06-Exams', '07-Study-Notes', '08-Recordings']);
  });
  it('classifies files deterministically and reports every problem class', () => {
    const r = checkPackage(
      [
        { path: 'semester.json', size: 10 },
        { path: '00-General/timetable.pdf', size: 1 },
        { path: 'SCSE3103-05 CC/02-Lectures/w1.pdf', size: 1 },
        { path: 'SCSE3103-05 CC/02-Lectures/Part A/w2 محاضرة.pdf', size: 1 },
        { path: 'SCSE3103-05 CC/06-Exams/mid.pdf', size: 1 },
        { path: 'SCSE3103-05 CC/loose.pdf', size: 1 },
        { path: 'SCSE3103-05 CC/Slides/x.pdf', size: 1 },
        { path: 'SCSE9999-01 Ghost/02-Lectures/a.pdf', size: 1 },
        { path: 'Random/a.pdf', size: 1 },
        { path: 'notes.txt', size: 1 },
      ],
      ['SCSE3103', 'UHLB2122'],
    );
    expect(r.ok).toBe(false);
    const byPath = new Map(r.files.map((f) => [f.path, f]));
    expect(byPath.get('SCSE3103-05 CC/02-Lectures/w1.pdf')).toMatchObject({ course_code: 'SCSE3103', category: '02-Lectures', type: 'lecture' });
    expect(byPath.get('SCSE3103-05 CC/02-Lectures/Part A/w2 محاضرة.pdf')?.type).toBe('lecture');
    expect(byPath.get('SCSE3103-05 CC/06-Exams/mid.pdf')?.type).toBe('exam');
    expect(byPath.get('00-General/timetable.pdf')).toMatchObject({ course_code: null, category: '00-General' });
    expect(byPath.get('SCSE3103-05 CC/loose.pdf')?.category).toBe('99-Other');
    const errs = r.issues.filter((i) => i.level === 'error').map((i) => i.path);
    expect(errs).toEqual(expect.arrayContaining(['SCSE3103-05 CC/Slides', 'SCSE9999-01 Ghost', 'Random']));
    const warns = r.issues.filter((i) => i.level === 'warning').map((i) => i.path);
    expect(warns).toEqual(expect.arrayContaining(['notes.txt', 'SCSE3103-05 CC/loose.pdf', 'UHLB2122']));
    expect(r.counts['SCSE3103']?.['02-Lectures']).toBe(2);
  });
  it('missing manifest is an error', () => {
    expect(checkPackage([{ path: '00-General/a.pdf', size: 1 }], []).issues.some((i) => i.level === 'error' && i.path === 'semester.json')).toBe(true);
  });
  it('reads Drive folder links and bare ids', () => {
    expect(driveFolderId('https://drive.google.com/drive/folders/1jvePBsCM5uLHntbBBCNqfuLa8b7RXkQ5?usp=sharing')).toBe('1jvePBsCM5uLHntbBBCNqfuLa8b7RXkQ5');
    expect(driveFolderId('1jvePBsCM5uLHntbBBCNqfuLa8b7RXkQ5')).toBe('1jvePBsCM5uLHntbBBCNqfuLa8b7RXkQ5');
    expect(driveFolderId('not a link')).toBeNull();
  });
});

/* ───── استيراد كامل عبر الـ API ───── */
let srv: Running;
let base: string;
let dir: string;
async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  return { status: res.status, json: t ? JSON.parse(t) : null };
}

function seedManifest(): Record<string, unknown> {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', 'sem5-dashboard.json'), 'utf8')) as Record<string, unknown>;
  return { package_version: 1, source: seed['source'], semester: seed['semester'], courses: seed['courses'], assessments: seed['assessments'], notes: seed['notes'] };
}

function writePkg(root: string, name: string, manifest: unknown, files: string[]): string {
  const p = path.join(root, name);
  for (const f of files) {
    fs.mkdirSync(path.dirname(path.join(p, f)), { recursive: true });
    fs.writeFileSync(path.join(p, f), `content of ${f}`);
  }
  fs.mkdirSync(p, { recursive: true });
  if (manifest !== null) fs.writeFileSync(path.join(p, 'semester.json'), JSON.stringify(manifest));
  return p;
}

beforeAll(async () => {
  dir = tmpDir('platform-pkg-');
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('package import (API)', () => {
  it('SEM-5 package built from the seed reproduces the seeded data exactly (no changes)', async () => {
    const p = writePkg(dir, 'SEM-5', seedManifest(), ['SCSE3103-05 Cognitive Computing/02-Lectures/w1.pdf', '00-General/timetable.pdf']);
    const r = await call('POST', '/api/packages/preview', { kind: 'local', path: p });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.diff.totals).toMatchObject({ added: 0, removed: 0, changed: 0 });
    expect(r.json.diff.totals.unchanged).toBe(1 + loadSeed().courses.length + loadSeed().assessments.length + loadSeed().notes.length);
  });

  it('imports an archived semester with official results and indexes its files; re-import is idempotent', async () => {
    const m = {
      package_version: 1,
      source: 'package:SEM-1',
      semester: { id: 'sem1', code: 'SEM 1', name: 'Semester I 2024/25', year_no: 1, sem_no: 1, start_date: '2024-10-06', weeks: 16, break_weeks: [], exam_start: null, exam_end: null, note: null },
      courses: [
        { id: 'sem1-dg', code: 'SCSR1013', name: 'Digital Logic', section: '01', credits: 3, color: '#4CC9F0', result: { grade: 'C+', points: 2.33, credits: 3, status: null } },
        { id: 'sem1-db', code: 'SCST1143', name: 'Database Engineering', section: '02', credits: 3, color: '#F72585', result: { grade: 'C+', points: 2.33, credits: 3, status: null } },
      ],
      assessments: [],
      notes: [],
    };
    const p = writePkg(dir, 'SEM-1', m, ['SCSR1013-01 Digital Logic/02-Lectures/ch1.pdf', 'SCSR1013-01 Digital Logic/06-Exams/final.pdf', 'SCST1143-02 Database Engineering/03-Labs/lab1.sql']);
    const pre = await call('POST', '/api/packages/preview', { kind: 'local', path: p });
    expect(pre.json.ok).toBe(true);
    expect(pre.json.diff.totals.added).toBe(3);
    expect(pre.json.results).toBe(2);
    const ap = await call('POST', '/api/packages/apply', { kind: 'local', path: p });
    expect(ap.status).toBe(200);
    expect(ap.json).toMatchObject({ ok: true, semester_id: 'sem1', files: 3, results: 2 });
    const res = await call('GET', '/api/packages/results/sem1');
    expect(res.json).toEqual(expect.arrayContaining([expect.objectContaining({ course_id: 'sem1-dg', grade: 'C+', points: 2.33 })]));
    const items = await call('GET', '/api/library/items?sem=SEM%201&limit=50');
    expect(items.json.total).toBe(3);
    const exam = items.json.items.find((i: { title: string }) => i.title === 'final.pdf');
    expect(exam).toMatchObject({ course_code: 'SCSR1013', type: 'exam', origin: 'pkgdir' });
    const raw = await fetch(`${base}/api/library/files/${exam.id}/raw`);
    expect(await raw.text()).toBe('content of SCSR1013-01 Digital Logic/06-Exams/final.pdf');
    // إعادة الاستيراد بعد حذف ملف: الملف يختفي، لا تكرار
    fs.rmSync(path.join(p, 'SCST1143-02 Database Engineering/03-Labs/lab1.sql'));
    const again = await call('POST', '/api/packages/apply', { kind: 'local', path: p });
    expect(again.json).toMatchObject({ files: 2, removed_files: 1 });
    expect((await call('GET', '/api/library/items?sem=SEM%201&limit=50')).json.total).toBe(2);
    const list = await call('GET', '/api/packages');
    expect(list.json.imports).toEqual(expect.arrayContaining([expect.objectContaining({ pkg: 'SEM-1', semester_id: 'sem1', files: 2 })]));
  });

  it('drive listing: files become Drive items (preview in Drive, raw redirects)', async () => {
    const m = { ...seedManifest() };
    const listing = { pkg: 'SEM-5', location: 'https://drive.google.com/drive/folders/X', manifest: m, entries: [{ path: 'semester.json', size: 5, ref: 'id0000000000' }, { path: 'SCSE3203-03 Software Testing/02-Lectures/L1.pdf', size: 99, ref: 'driveFileId123' }] };
    const ap = await call('POST', '/api/packages/apply', { kind: 'listing', listing });
    expect(ap.status).toBe(200);
    const items = await call('GET', '/api/library/items?q=L1.pdf');
    const it0 = items.json.items[0];
    expect(it0).toMatchObject({ origin: 'drive', remote_id: 'driveFileId123', preview: 'drive', course_code: 'SCSE3203', type: 'lecture' });
    const raw = await fetch(`${base}/api/library/files/${it0.id}/raw`, { redirect: 'manual' });
    expect(raw.status).toBe(302);
    expect(raw.headers.get('location')).toContain('driveFileId123');
  });

  it('blocks import on errors and changes nothing', async () => {
    const bad = writePkg(dir, 'SEM-7', { ...seedManifest(), semester: { ...(seedManifest()['semester'] as object), id: 'sem7x' } }, ['Loose Folder/a.pdf']);
    const pre = await call('POST', '/api/packages/preview', { kind: 'local', path: bad });
    expect(pre.json.ok).toBe(false);
    expect(pre.json.errors.join(' ')).toMatch(/Loose Folder/);
    expect(pre.json.errors.join(' ')).toMatch(/SEM-7/); // sem_no 5 ≠ SEM-7
    const ap = await call('POST', '/api/packages/apply', { kind: 'local', path: bad });
    expect(ap.status).toBe(422);
    expect((await call('GET', '/api/semesters')).json.some((s: { id: string }) => s.id === 'sem7x')).toBe(false);
    const noManifest = writePkg(dir, 'SEM-8', null, ['00-General/a.pdf']);
    expect((await call('POST', '/api/packages/preview', { kind: 'local', path: noManifest })).json.errors.join(' ')).toMatch(/semester\.json/);
  });

  it('a local folder scan never touches package files', async () => {
    await call('POST', '/api/library/scan', {});
    await new Promise((r) => setTimeout(r, 300));
    const items = await call('GET', '/api/library/items?sem=SEM%201&limit=50');
    expect(items.json.total).toBe(2);
  });
});

describe('generated packages (packages/SEM-*)', () => {
  const pkgDir = path.join(ROOT, 'packages');
  const ids = fs.existsSync(pkgDir) ? fs.readdirSync(pkgDir).filter((n) => /^SEM-\d+$/.test(n)) : [];
  it.skipIf(!ids.length)('every semester.json passes the import validator and its plan passes the checker with no errors', async () => {
    const { parseManifest } = await import('../server/package.js');
    for (const id of ids) {
      const m = parseManifest(JSON.parse(fs.readFileSync(path.join(pkgDir, id, 'semester.json'), 'utf8')));
      expect(m.ok, `${id}: ${m.ok ? '' : m.errors.join(' | ')}`).toBe(true);
      if (!m.ok) continue;
      expect(m.value.data.semesters[0]!.sem_no).toBe(Number(id.slice(4)));
      const plan = JSON.parse(fs.readFileSync(path.join(pkgDir, `${id}.plan.json`), 'utf8')) as { entries: { dest: string; size: number }[] };
      const r = checkPackage([{ path: 'semester.json', size: 1 }, ...plan.entries.map((e) => ({ path: e.dest, size: e.size }))], m.value.codes);
      expect(r.issues.filter((i) => i.level === 'error'), id).toEqual([]);
    }
  });
});
