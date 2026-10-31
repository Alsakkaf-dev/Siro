import { SCHEMA_VERSION } from '../server/schema.js';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';

let srv: Running;
let base: string;
let dir: string;

async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any; text: string; headers: Headers }> {
  const res = await fetch(base + url, { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

beforeAll(async () => {
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  dir = tmpDir();
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const today = (): string => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const plus = (n: number): string => new Date(Date.parse(today()) + n * 86_400_000).toISOString().slice(0, 10);

describe(`Work-OS core (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('latest schema + profile name setting', async () => {
    expect((await call('GET', '/api/health')).json.schema).toBe(SCHEMA_VERSION);
    expect((await call('GET', '/api/wos/profile')).json.name).toBe('محمد');
    expect((await call('PUT', '/api/wos/profile', { name: 'سارة' })).json.name).toBe('سارة');
    await call('PUT', '/api/wos/profile', { name: 'محمد' });
  });

  it('lists built-in templates', async () => {
    const t = await call('GET', '/api/wos/templates');
    const ids = t.json.map((x: { id: string }) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['reading-list', 'job-applications', 'project', 'goals', 'tasks']));
  });

  let reading: any;
  it('creates "Reading list" from a template with type, views and automations', async () => {
    const r = await call('POST', '/api/wos/spaces', { template_id: 'reading-list' });
    expect(r.status).toBe(201);
    reading = r.json;
    expect(reading.type.fields.map((f: { id: string }) => f.id)).toContain('progress');
    const full = await call('GET', `/api/wos/spaces/${reading.id}`);
    expect(full.json.views.map((v: { kind: string }) => v.kind)).toEqual(['board', 'table', 'gallery']);
    expect(full.json.automations.length).toBe(2);
    expect(full.json.items.length).toBe(1); // عنصر المثال
  });

  it('item CRUD, field validation, automation on status change, history + revert', async () => {
    const bad = await call('POST', `/api/wos/spaces/${reading.id}/items`, { title: 'X', data: { pages: 'abc' } });
    expect(bad.status).toBe(400);
    const badUrl = await call('POST', `/api/wos/spaces/${reading.id}/items`, { title: 'X', data: { link: 'ftp://x' } });
    expect(badUrl.status).toBe(400);
    const c = await call('POST', `/api/wos/spaces/${reading.id}/items`, { title: 'SICP', data: { pages: 657, author: 'Abelson' } });
    expect(c.status).toBe(201);
    expect(c.json.status).toBe('want');
    const done = await call('PATCH', `/api/wos/items/${c.json.id}`, { status: 'done' });
    expect(done.status).toBe(200);
    // الأتمتة: تاريخ الإنهاء = اليوم، والإنجاز = 100
    expect(done.json.data.finished).toBe(today());
    expect(done.json.data.progress).toBe(100);
    expect(done.json.done_at).toBeTruthy();
    const detail = await call('GET', `/api/wos/items/${c.json.id}`);
    const auto = detail.json.history.filter((h: { actor: string }) => h.actor.startsWith('automation:'));
    expect(auto.length).toBe(2);
    // التراجع عن تشغيل أتمتة
    const rv = await call('POST', `/api/wos/history/${auto[0].id}/revert`);
    expect(rv.status).toBe(200);
    const again = await call('POST', `/api/wos/history/${auto[0].id}/revert`);
    expect(again.status).toBe(409);
  });

  let jobs: any;
  it('Jira-style transitions are enforced for "Job applications"', async () => {
    jobs = (await call('POST', '/api/wos/spaces', { template_id: 'job-applications', name: 'طلبات 2027' })).json;
    expect(jobs.name).toBe('طلبات 2027');
    const it1 = (await call('POST', `/api/wos/spaces/${jobs.id}/items`, { title: 'Google — intern', data: { company: 'Google', kind: 'intern' } })).json;
    const skip = await call('PATCH', `/api/wos/items/${it1.id}`, { status: 'offer' });
    expect(skip.status).toBe(400);
    expect(skip.json.fields.status).toMatch(/لا يمكن الانتقال/);
    const ok = await call('PATCH', `/api/wos/items/${it1.id}`, { status: 'applied' });
    expect(ok.json.data.applied).toBe(today());
  });

  it('due_soon automation notifies once (idempotent sweep) into the inbox', async () => {
    const it2 = (await call('POST', `/api/wos/spaces/${jobs.id}/items`, { title: 'Grab — interview', due: plus(1) })).json;
    expect(it2.id).toBeTruthy();
    const a = await call('GET', '/api/wos/inbox');
    const b = await call('GET', '/api/wos/inbox');
    const mine = (x: any[]) => x.filter((n) => n.body?.includes('Grab'));
    expect(mine(a.json).length).toBe(1);
    expect(mine(b.json).length).toBe(1);
    expect(mine(a.json)[0].to).toContain(`/spaces/${jobs.id}`);
    await call('POST', '/api/wos/inbox/read', {});
    expect((await call('GET', '/api/wos/inbox')).json.every((n: { read: boolean }) => n.read)).toBe(true);
  });

  it('recurring: create_next makes tomorrow\'s copy', async () => {
    const h = (await call('POST', '/api/wos/spaces', { template_id: 'habit-tracker' })).json;
    const x = (await call('POST', `/api/wos/spaces/${h.id}/items`, { title: 'مشي 20 دقيقة', due: today() })).json;
    await call('PATCH', `/api/wos/items/${x.id}`, { status: 'done' });
    const items = (await call('GET', `/api/wos/spaces/${h.id}`)).json.items;
    expect(items.length).toBe(2);
    expect(items.find((i: { id: string }) => i.id !== x.id).due).toBe(plus(1));
  });

  it('formula + rollup fields are computed', async () => {
    const g = (await call('POST', '/api/wos/spaces', { template_id: 'goals' })).json;
    const x = (await call('POST', `/api/wos/spaces/${g.id}/items`, { title: 'وزن', data: { current: 15, target: 20 } })).json;
    expect(x.computed.pct).toBe(75);
    const p = (await call('POST', '/api/wos/spaces', { template_id: 'project' })).json;
    const parent = (await call('POST', `/api/wos/spaces/${p.id}/items`, { title: 'المشروع' })).json;
    const c1 = (await call('POST', `/api/wos/spaces/${p.id}/items`, { title: 'أ', parent_id: parent.id })).json;
    await call('POST', `/api/wos/spaces/${p.id}/items`, { title: 'ب', parent_id: parent.id });
    await call('PATCH', `/api/wos/items/${c1.id}`, { status: 'done' });
    const got = (await call('GET', `/api/wos/items/${parent.id}`)).json;
    expect(got.item.computed.subdone).toBe(50);
    expect(got.children.length).toBe(2);
    expect(got.item.child_count).toBe(2);
  });

  it('custom type editing from scratch (blank space + fields + statuses)', async () => {
    const s = (await call('POST', '/api/wos/spaces', { name: 'رحلات' })).json;
    const t = await call('PUT', `/api/wos/spaces/${s.id}/type`, {
      name: 'رحلة',
      icon: 'pin',
      color: '#0369A1',
      fields: [{ id: 'city', name: 'المدينة', kind: 'text' }, { id: 'cost', name: 'التكلفة', kind: 'currency' }, { id: 'per', name: 'لكل يوم', kind: 'formula', formula: 'round({التكلفة} / 3, 1)' }],
      statuses: [{ id: 'idea', name: 'فكرة', color: '#8A92B2', category: 'todo' }, { id: 'booked', name: 'محجوز', color: '#12703F', category: 'done' }],
    });
    expect(t.status).toBe(200);
    const bad = await call('PUT', `/api/wos/spaces/${s.id}/type`, { name: 'x', fields: [{ id: 'f', name: 'f', kind: 'formula' }], statuses: [{ id: 'a', name: 'a', color: '#000000', category: 'todo' }] });
    expect(bad.status).toBe(400);
    const i = (await call('POST', `/api/wos/spaces/${s.id}/items`, { title: 'كوالالمبور', data: { city: 'KL', cost: 300 } })).json;
    expect(i.status).toBe('idea');
    expect(i.computed.per).toBe(100);
  });

  it('bulk update/archive/delete with undo through the persistent trash', async () => {
    const s = (await call('POST', '/api/wos/spaces', { template_id: 'tasks' })).json;
    const ids: string[] = [];
    for (const t of ['a', 'b', 'c']) ids.push((await call('POST', `/api/wos/spaces/${s.id}/items`, { title: t })).json.id);
    const u = await call('POST', '/api/wos/items/bulk', { ids, op: 'update', patch: { status: 'done' } });
    expect(u.json.count).toBe(3);
    const d = await call('POST', '/api/wos/items/bulk', { ids, op: 'delete' });
    expect(d.json.undo).toBeTruthy();
    expect((await call('GET', `/api/wos/spaces/${s.id}`)).json.items.length).toBe(0);
    const trash = (await call('GET', '/api/wos/trash')).json;
    expect(trash.some((t: { token: string }) => t.token === d.json.undo)).toBe(true);
    const rs = await call('POST', `/api/wos/trash/${d.json.undo}/restore`);
    expect(rs.status).toBe(200);
    expect((await call('GET', `/api/wos/spaces/${s.id}`)).json.items.length).toBe(3);
    expect((await call('POST', `/api/wos/trash/${d.json.undo}/restore`)).status).toBe(410);
  });

  it('deleting a whole space restores with items, views and automations', async () => {
    const before = (await call('GET', `/api/wos/spaces/${jobs.id}`)).json;
    const d = await call('DELETE', `/api/wos/spaces/${jobs.id}`);
    expect((await call('GET', `/api/wos/spaces/${jobs.id}`)).status).toBe(404);
    await call('POST', `/api/undo/${d.json.undo}`);
    const after = (await call('GET', `/api/wos/spaces/${jobs.id}`)).json;
    expect(after.items.length).toBe(before.items.length);
    expect(after.views.length).toBe(before.views.length);
    expect(after.automations.length).toBe(before.automations.length);
  });

  it('relations across domains with backlinks', async () => {
    const sem = (await call('GET', '/api/semesters')).json[0];
    const bundle = (await call('GET', `/api/semesters/${sem.id}`)).json;
    const asmt = bundle.assessments[0];
    const item = (await call('GET', `/api/wos/spaces/${reading.id}`)).json.items[0];
    const rel = await call('POST', '/api/wos/relations', { src: `wos:${item.id}`, dst: `acad:asmt:${asmt.id}`, kind: 'relates' });
    expect(rel.status).toBe(201);
    const back = (await call('GET', `/api/wos/links?ref=acad:asmt:${asmt.id}`)).json;
    expect(back.length).toBe(1);
    expect(back[0].other.ref).toBe(`wos:${item.id}`);
    expect(back[0].direction).toBe('in');
    const self = await call('POST', '/api/wos/relations', { src: `wos:${item.id}`, dst: `wos:${item.id}` });
    expect(self.status).toBe(400);
    const missing = await call('POST', '/api/wos/relations', { src: `wos:${item.id}`, dst: 'acad:asmt:nope' });
    expect(missing.status).toBe(400);
    const refs = (await call('GET', `/api/wos/refs?q=${encodeURIComponent(asmt.title.slice(0, 4))}`)).json;
    expect(refs.some((x: { ref: string }) => x.ref === `acad:asmt:${asmt.id}`)).toBe(true);
    const del = await call('DELETE', `/api/wos/relations/${rel.json.id}`);
    expect((await call('GET', `/api/wos/links?ref=acad:asmt:${asmt.id}`)).json.length).toBe(0);
    await call('POST', `/api/wos/trash/${del.json.undo}/restore`);
    expect((await call('GET', `/api/wos/links?ref=acad:asmt:${asmt.id}`)).json.length).toBe(1);
  });

  it('agenda merges academic deadlines + space items + workouts; everything lists both', async () => {
    const t = (await call('POST', '/api/wos/spaces', { template_id: 'tasks' })).json;
    await call('POST', `/api/wos/spaces/${t.id}/items`, { title: 'تسليم مهم', due: plus(2) });
    await call('POST', `/api/wos/spaces/${t.id}/items`, { title: 'متأخر', due: plus(-3) });
    const w = (await call('POST', '/api/sports/workouts', { name: 'تمرين A' })).json;
    for (const day of ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']) await call('PUT', '/api/sports/week', { day, workout_id: w.id });
    const a = (await call('GET', `/api/wos/agenda?from=${today()}&to=${plus(6)}`)).json;
    expect(a.range.some((e: { title: string }) => e.title === 'تسليم مهم')).toBe(true);
    expect(a.range.filter((e: { kind: string }) => e.kind === 'workout').length).toBe(7);
    expect(a.overdue.some((e: { title: string }) => e.title === 'متأخر')).toBe(true);
    const all = (await call('GET', '/api/wos/everything')).json;
    expect(all.entries.some((e: { kind: string }) => e.kind === 'assessment')).toBe(true);
    expect(all.entries.some((e: { kind: string }) => e.kind === 'item')).toBe(true);
    expect((await call('GET', '/api/wos/agenda?from=2026-01-01&to=2026-12-31')).status).toBe(400);
  });

  it('export JSON/CSV, save as template, duplicate, public read-only share', async () => {
    const csv = await call('GET', `/api/wos/spaces/${reading.id}/export?format=csv`);
    expect(csv.headers.get('content-type')).toMatch(/text\/csv/);
    expect(csv.text).toContain('العنوان');
    const js = await call('GET', `/api/wos/spaces/${reading.id}/export`);
    expect(js.json.format).toBe('siro-space');
    const st = await call('POST', `/api/wos/spaces/${reading.id}/save-template`, { name: 'قراءتي' });
    expect(st.status).toBe(201);
    expect((await call('GET', '/api/wos/templates')).json.some((x: { name: string; builtin: boolean }) => x.name === 'قراءتي' && !x.builtin)).toBe(true);
    const fromUser = await call('POST', '/api/wos/spaces', { template_id: st.json.id });
    expect(fromUser.json.type.fields.length).toBe(reading.type.fields.length);
    const dup = await call('POST', `/api/wos/spaces/${reading.id}/duplicate`);
    expect(dup.json.name).toContain('نسخة');
    const sh = await call('POST', '/api/wos/shares', { scope: `space:${reading.id}` });
    const pub = await call('GET', `/api/public/${sh.json.token}`);
    expect(pub.status).toBe(200);
    expect(pub.json.items.length).toBeGreaterThan(0);
    await call('DELETE', `/api/wos/shares/${sh.json.token}`);
    expect((await call('GET', `/api/public/${sh.json.token}`)).status).toBe(404);
  });

  it('existing domains: persistent undo for academic, YouTube, workouts; bulk endpoints; history', async () => {
    const sem = (await call('GET', '/api/semesters')).json[0];
    const b = (await call('GET', `/api/semesters/${sem.id}`)).json;
    const ids = b.assessments.slice(0, 3).map((a: { id: string }) => a.id);
    const st = await call('POST', '/api/assessments/bulk', { ids, op: 'status', status: 'submitted' });
    expect(st.json.count).toBe(3);
    const del = await call('POST', '/api/assessments/bulk', { ids, op: 'delete' });
    expect((await call('GET', `/api/semesters/${sem.id}`)).json.assessments.length).toBe(b.assessments.length - 3);
    await call('POST', `/api/undo/${del.json.undo}`);
    const back = (await call('GET', `/api/semesters/${sem.id}`)).json.assessments;
    expect(back.length).toBe(b.assessments.length);
    expect(back.filter((a: { id: string; status: string }) => ids.includes(a.id)).every((a: { status: string }) => a.status === 'submitted')).toBe(true);

    const notes = b.notes.slice(0, 2).map((n: { id: string }) => n.id);
    expect((await call('POST', '/api/notes/bulk', { ids: notes, op: 'resolve' })).json.count).toBe(2);

    const yt = await call('POST', '/api/library/youtube', { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'فيديو' });
    const dy = await call('DELETE', `/api/library/youtube/${yt.json.id}`);
    expect(dy.json.undo).toBeTruthy();
    await call('POST', `/api/undo/${dy.json.undo}`);
    expect((await call('GET', '/api/library/youtube')).json.length).toBe(1);

    const w = (await call('POST', '/api/sports/workouts', { name: 'للحذف' })).json;
    const dw = await call('DELETE', `/api/sports/workouts/${w.id}`);
    await call('POST', `/api/undo/${dw.json.undo}`);
    expect((await call('GET', '/api/sports/mine')).json.workouts.some((x: { id: string }) => x.id === w.id)).toBe(true);

    const hist = (await call('GET', '/api/wos/history?limit=200')).json;
    expect(hist.some((h: { ref: string }) => h.ref.startsWith('acad:asmt:'))).toBe(true);
    expect(hist.some((h: { ref: string }) => h.ref.startsWith('lib:y:'))).toBe(true);
  });

  it('semester delete + undo keeps official results (regression)', async () => {
    const sem = (await call('POST', '/api/semesters', { code: 'TST-R', name: 'r', start_date: '2026-01-04' })).json.semester;
    const c = (await call('POST', `/api/semesters/${sem.id}/courses`, { code: 'X1', name: 'X', color: '#4CC9F0' })).json;
    srv.getDb().run("INSERT INTO acad_results (course_id, grade, points, credits, status, source) VALUES (?, 'A', 4, 3, 'pass', 'test')", c.id);
    const d = await call('DELETE', `/api/semesters/${sem.id}`);
    expect(srv.getDb().get('SELECT 1 FROM acad_results WHERE course_id = ?', c.id)).toBeUndefined();
    await call('POST', `/api/undo/${d.json.undo}`);
    expect(srv.getDb().get<{ grade: string }>('SELECT grade FROM acad_results WHERE course_id = ?', c.id)?.grade).toBe('A');
  });

  it('views: create, update, delete with undo; invalid scope rejected', async () => {
    const v = await call('POST', '/api/wos/views', { scope: `space:${reading.id}`, name: 'تقويم', kind: 'calendar', config: { dateField: 'finished' } });
    expect(v.status).toBe(201);
    const p = await call('PATCH', `/api/wos/views/${v.json.id}`, { config: { dateField: 'due', filters: [{ field: 'status', op: 'is', value: 'reading' }] } });
    expect(p.json.config.filters.length).toBe(1);
    const d = await call('DELETE', `/api/wos/views/${v.json.id}`);
    await call('POST', `/api/wos/trash/${d.json.undo}/restore`);
    expect((await call('GET', `/api/wos/spaces/${reading.id}`)).json.views.some((x: { id: string }) => x.id === v.json.id)).toBe(true);
    expect((await call('POST', '/api/wos/views', { scope: 'evil', name: 'x', kind: 'list' })).status).toBe(400);
  });
});

describe('semester package export (round-trip with the v1 importer)', () => {
  it('exported semester.json parses with the same importer and keeps results', async () => {
    const { parseManifest } = await import('../server/package.js');
    const sem = (await call('GET', '/api/semesters')).json.find((s: { code: string }) => s.code === 'SEM 5');
    const c = (await call('GET', `/api/semesters/${sem.id}`)).json.courses[0];
    srv.getDb().run("INSERT OR REPLACE INTO acad_results (course_id, grade, points, credits, status, source) VALUES (?, 'A-', 3.67, 3, null, 'test')", c.id);
    const ex = await call('GET', `/api/packages/export/${sem.id}`);
    expect(ex.status).toBe(200);
    expect(ex.headers.get('content-disposition')).toContain('SEM-5.semester.json');
    expect(ex.json.package_version).toBe(1);
    const p = parseManifest(ex.json);
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.value.data.courses.length).toBe(ex.json.courses.length);
      expect(p.value.results.find((r) => r.course_id === c.id)?.grade).toBe('A-');
    }
    const f = await call('GET', `/api/packages/export/${sem.id}?format=folders`);
    expect(f.json.folders[0]).toBe('00-General');
    expect(f.json.folders.length).toBe(ex.json.courses.length + 1);
  });
});

describe('bulk delete for courses and semesters with undo', () => {
  it('deletes and restores courses and whole semesters', async () => {
    const s = (await call('POST', '/api/semesters', { code: 'BULK-1', name: 'b', start_date: '2026-01-04' })).json.semester;
    const s2 = (await call('POST', '/api/semesters', { code: 'BULK-2', name: 'b', start_date: '2026-01-04' })).json.semester;
    const c1 = (await call('POST', `/api/semesters/${s.id}/courses`, { code: 'BLK1001', name: 'A', color: '#4CC9F0' })).json;
    const c2 = (await call('POST', `/api/semesters/${s.id}/courses`, { code: 'BLK1002', name: 'B', color: '#4CC9F0' })).json;
    const dc = await call('POST', '/api/courses/bulk', { ids: [c1.id, c2.id], op: 'delete' });
    expect(dc.json.count).toBe(2);
    expect((await call('GET', `/api/semesters/${s.id}`)).json.courses.length).toBe(0);
    await call('POST', `/api/undo/${dc.json.undo}`);
    expect((await call('GET', `/api/semesters/${s.id}`)).json.courses.length).toBe(2);
    const ds = await call('POST', '/api/semesters/bulk', { ids: [s.id, s2.id], op: 'delete' });
    expect(ds.json.count).toBe(2);
    expect((await call('GET', `/api/semesters/${s.id}`)).status).toBe(404);
    await call('POST', `/api/undo/${ds.json.undo}`);
    expect((await call('GET', `/api/semesters/${s.id}`)).json.courses.length).toBe(2);
    expect((await call('GET', `/api/semesters/${s2.id}`)).status).toBe(200);
  });
});
