import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';

let srv: Running;
let base: string;
let dir: string;

async function call(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

beforeAll(async () => {
  dir = tmpDir();
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe(`API (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('health + info', async () => {
    const h = await call('GET', '/api/health');
    expect(h.status).toBe(200);
    expect(h.json.ok).toBe(true);
    const i = await call('GET', '/api/info');
    expect(i.json.host).toBe('127.0.0.1');
  });

  it('binds to 127.0.0.1 only', () => {
    const a = srv.server.address();
    expect(typeof a === 'object' && a?.address).toBe('127.0.0.1');
  });

  it('rejects a foreign Host header (DNS-rebinding guard)', async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: srv.cfg.port, path: '/api/health', headers: { Host: 'evil.example.com' } }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', reject);
      req.end();
    });
    expect(status).toBe(403);
  });

  it('seeded SEM 5 with 6 courses / 52 assessments', async () => {
    const l = await call('GET', '/api/semesters');
    expect(l.json).toHaveLength(1);
    expect(l.json[0]).toMatchObject({ code: 'SEM 5', course_count: 6, assessment_count: 52, is_active: true });
  });

  let semId = '';
  let courseId = '';
  let assId = '';

  it('adds SEM 6 manually, validates input', async () => {
    const bad = await call('POST', '/api/semesters', { code: '', name: '', start_date: 'xx', weeks: 99 });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.json.fields)).toEqual(expect.arrayContaining(['code', 'name', 'start_date', 'weeks']));
    const badBreak = await call('POST', '/api/semesters', { code: 'SEM X', name: 'x', start_date: '2027-03-01', weeks: 14, break_weeks: [20] });
    expect(badBreak.status).toBe(400);
    const ok = await call('POST', '/api/semesters', { code: 'SEM 6', name: 'Semester II 2026/27', year_no: 3, sem_no: 6, start_date: '2027-03-08', weeks: 14, break_weeks: [7], exam_start: '2027-06-14', exam_end: '2027-06-25' });
    expect(ok.status).toBe(201);
    semId = ok.json.semester.id;
    const dup = await call('POST', '/api/semesters', { code: 'SEM 6', name: 'dup', start_date: '2027-03-08', weeks: 14 });
    expect(dup.status).toBeGreaterThanOrEqual(400);
  });

  it('adds a course and an assessment; week bounds are enforced', async () => {
    const c = await call('POST', `/api/semesters/${semId}/courses`, { code: 'TEST1001', name: 'Testing', credits: 3 });
    expect(c.status).toBe(201);
    courseId = c.json.id;
    const bad = await call('POST', `/api/courses/${courseId}/assessments`, { kind: 'test', title: 'T', weight: 20, timing: 'week', week_no: 40 });
    expect(bad.status).toBe(400);
    expect(bad.json.fields.week_no).toBeTruthy();
    const a = await call('POST', `/api/courses/${courseId}/assessments`, { kind: 'test', title: 'Midterm', weight: 20, timing: 'week', week_no: 6 });
    expect(a.status).toBe(201);
    assId = a.json.id;
    expect(a.json).toMatchObject({ weight: 20, week_no: 6, status: 'pending', score: null });
    const over = await call('PATCH', `/api/assessments/${assId}`, { score: 30 });
    expect(over.status).toBe(400);
    const graded = await call('PATCH', `/api/assessments/${assId}`, { score: 15 });
    expect(graded.json).toMatchObject({ score: 15, status: 'graded' });
  });

  it('search understands kind aliases (كويز / لاب / ميدتيرم)', async () => {
    const q = await call('GET', `/api/search?q=${encodeURIComponent('ميدتيرم')}`);
    expect(q.json.some((h: any) => h.title === 'Midterm')).toBe(true);
    const quiz = await call('GET', `/api/search?q=${encodeURIComponent('كويز')}`);
    expect(quiz.json.length).toBeGreaterThan(3);
    const lab = await call('GET', `/api/search?q=lab`);
    expect(lab.json.some((h: any) => /Lab Exercise/.test(h.title))).toBe(true);
    const none = await call('GET', `/api/search?q=zzzzqqq`);
    expect(none.json).toEqual([]);
  });

  it('delete + undo restores the course with its assessments', async () => {
    const d = await call('DELETE', `/api/courses/${courseId}`);
    expect(d.status).toBe(200);
    expect((await call('GET', `/api/semesters/${semId}`)).json.courses).toHaveLength(0);
    const u = await call('POST', `/api/undo/${d.json.undo}`);
    expect(u.status).toBe(200);
    const b = await call('GET', `/api/semesters/${semId}`);
    expect(b.json.courses).toHaveLength(1);
    expect(b.json.assessments).toHaveLength(1);
    expect(b.json.assessments[0].score).toBe(15);
    const again = await call('POST', `/api/undo/${d.json.undo}`);
    expect(again.status).toBeGreaterThanOrEqual(400);
  });

  it('activates a semester', async () => {
    expect((await call('POST', `/api/semesters/${semId}/activate`)).status).toBe(200);
    const l = await call('GET', '/api/semesters');
    expect(l.json.find((s: any) => s.id === semId).is_active).toBe(true);
    expect(l.json.filter((s: any) => s.is_active)).toHaveLength(1);
  });

  it('export → import diff preview → apply (merge)', async () => {
    const ex = await call('GET', '/api/export');
    expect(ex.status).toBe(200);
    // تعديل ملف التصدير: وزن مختلف + مادة جديدة
    const file = JSON.parse(JSON.stringify(ex.json));
    const sem5 = file.semesters.find((s: any) => s.code === 'SEM 5') ?? file.semesters[0];
    expect(sem5).toBeTruthy();
    const none = await call('POST', '/api/import/preview', file);
    expect(none.json.diff.totals).toMatchObject({ added: 0, changed: 0, removed: 0 });
    const a0 = file.assessments.find((a: any) => a.title === 'Midterm');
    a0.weight = 25;
    const prev = await call('POST', '/api/import/preview', file);
    expect(prev.status).toBe(200);
    expect(prev.json.diff.assessments.changed).toHaveLength(1);
    const bad = await call('POST', '/api/import/preview', { nope: true });
    expect(bad.status).toBe(422);
    const ap = await call('POST', '/api/import/apply', { file, mode: 'merge' });
    expect(ap.status).toBe(200);
    expect(ap.json.backup).toBeTruthy();
    const b = await call('GET', `/api/semesters/${semId}`);
    expect(b.json.assessments[0].weight).toBe(25);
  });

  it('manual backup + list', async () => {
    const m = await call('POST', '/api/backups');
    expect(m.status).toBe(201);
    const l = await call('GET', '/api/backups');
    expect(l.json.length).toBeGreaterThanOrEqual(1);
  });

  it('serves gzip/brotli with immutable cache for hashed assets (if built)', async () => {
    const idx = path.join(srv.cfg.webDir, 'index.html');
    if (!fs.existsSync(idx)) return;
    const html = await (await fetch(base + '/')).text();
    expect(html).toContain('<div id="root">');
    const m = /src="(\/assets\/[^"]+\.js)"/.exec(html) ?? /href="(\/assets\/[^"]+\.js)"/.exec(html);
    expect(m).toBeTruthy();
    const r = await fetch(base + m![1]!, { headers: { 'Accept-Encoding': 'br' } });
    expect(r.headers.get('cache-control')).toMatch(/immutable/);
    expect(['br', 'gzip', null]).toContain(r.headers.get('content-encoding'));
    const spa = await fetch(base + '/academic/s/sem5/courses');
    expect(spa.status).toBe(200);
    expect(await spa.text()).toContain('<div id="root">');
  });
});
