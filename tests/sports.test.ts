import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import { checkContent, describeSE, fmtRange, regionsOf, REGIONS, weekdayKL, withRegions, type ExercisesDoc, type PlansDoc, type AltsDoc, type GlossaryDoc } from '../shared/sports.js';
// @ts-expect-error JS helper
import { buildLifeFixture } from '../scripts/life-fixture.mjs';

describe('muscle → body region mapping (site classification of Rashed\'s main_muscle_ar)', () => {
  it('maps common names, multi-region names and pseudo groups', () => {
    expect(regionsOf('الصدر')).toEqual(['chest']);
    expect(regionsOf('الصدر العلوي')).toEqual(['chest']);
    expect(regionsOf('الصدر السفلي والترايسبس').sort()).toEqual(['chest', 'triceps']);
    expect(regionsOf('الفخذ الأمامي والأرداف').sort()).toEqual(['glutes', 'quads']);
    expect(regionsOf('الفخذ الخلفي وأسفل الظهر').sort()).toEqual(['hamstrings', 'lower_back']);
    expect(regionsOf('الفخذ والأرداف').sort()).toEqual(['glutes', 'quads']);
    expect(regionsOf('الكتف الخلفي وأعلى الظهر').sort()).toEqual(['rear_delts', 'upper_back']);
    expect(regionsOf('الظهر العريض والصدر').sort()).toEqual(['chest', 'lats']);
    expect(regionsOf('الظهر').sort()).toEqual(['lats', 'upper_back']);
    expect(regionsOf('أسفل الظهر')).toEqual(['lower_back']);
    expect(regionsOf('الأكتاف والترابيس').sort()).toEqual(['shoulders', 'traps']);
    expect(regionsOf('البطن والجذع كله').sort()).toEqual(['abs', 'obliques']);
    expect(regionsOf('كامل الجسم والقلب').sort()).toEqual(['cardio', 'full']);
    expect(regionsOf('الأرجل والقلب').sort()).toEqual(['calves', 'cardio', 'glutes', 'hamstrings', 'quads']);
    expect(regionsOf('السمانة العميقة')).toEqual(['calves']);
    expect(regionsOf('شيء غير معروف')).toEqual([]);
  });
  it('every region id used exists in REGIONS or is a pseudo group', () => {
    const ids = new Set([...REGIONS.map((r) => r.id), 'full', 'cardio']);
    for (const m of ['الصدر', 'الترايسبس', 'الفخذ الداخلي والأرداف', 'عضلات الجوانب والبطن', 'الترابيس (أعلى الظهر والرقبة)', 'البايسبس والساعد']) for (const r of regionsOf(m)) expect(ids.has(r), `${m} → ${r}`).toBe(true);
  });
  it('range / session text helpers and weekday', () => {
    expect(fmtRange({ min: 3, max: 3 })).toBe('3');
    expect(fmtRange({ min: 10, max: 15 }, ' ث')).toBe('10–15 ث');
    expect(describeSE({ exercise_id: 'x', sets: { min: 3, max: 3 }, reps: { min: 10, max: 15 }, per_side: true })).toBe('3 مجموعات × 10–15 تكرار لكل جهة');
    expect(describeSE({ exercise_id: 'plank', sets: { min: 2, max: 3 }, duration_seconds: { min: 20, max: 45 } })).toBe('2–3 مجموعات 20–45 ثانية');
    expect(weekdayKL(Date.parse('2026-10-26T20:00:00+08:00'))).toBe('mon');
    expect(weekdayKL(Date.parse('2026-10-26T20:00:00+00:00'))).toBe('tue'); // 04:00 KL next day
  });
  it('content shape guard', () => {
    expect(checkContent('SPORTS_EXERCISES.json', { exercises: [{ id: 'a' }] })).toMatch(/exercises/);
    expect(checkContent('SPORTS_EXERCISES.json', { exercises: [{ id: 'a', english_name: 'A', arabic_name: 'أ' }], new_field: 1 })).toBeNull();
    expect(checkContent('SPORTS_PLANS_AR.json', { sessions: [] })).toMatch(/templates/);
    expect(checkContent('HABITS_ALTERNATIVES_AR.json', { habits: [{ id: 'v' }] })).toMatch(/alternatives/);
    expect(checkContent('SPORTS_EXERCISES.json', [])).toMatch(/كائن/);
  });
});

let srv: Running;
let base: string;
let dir: string;
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
beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  process.env['PLATFORM_LIFE_ROOT'] = path.join(dir, 'rashed');
  buildLifeFixture(path.join(dir, 'rashed'));
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  delete process.env['PLATFORM_LIFE_ROOT'];
  fs.rmSync(dir, { recursive: true, force: true });
});

const item = (over: Record<string, unknown> = {}) => ({ exercise_id: 'push_up', en_name: 'Push-Up', ar_name: 'ضغط أرضي', sets: 3, reps_min: 8, reps_max: 12, ...over });

describe(`my workouts API (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  let a = '';
  let b = '';
  it('starts empty with a null week and no local selection', async () => {
    const m = await call('GET', '/api/sports/mine');
    expect(m.status).toBe(200);
    expect(m.json.workouts).toEqual([]);
    expect(Object.keys(m.json.week)).toEqual(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']);
    expect(Object.values(m.json.week).every((v) => v === null)).toBe(true);
    expect(m.json.template).toBeNull();
    expect(m.json.location).toBeNull();
  });
  it('creates workouts with items; rejects bad names and items with field errors', async () => {
    expect((await call('POST', '/api/sports/workouts', { name: '  ' })).json.fields.name).toBeTruthy();
    expect((await call('POST', '/api/sports/workouts', { name: 'x'.repeat(81) })).status).toBe(400);
    const bad = await call('POST', '/api/sports/workouts', { name: 'س', items: [item({ sets: 0, reps_min: 20, reps_max: 5, exercise_id: 'Bad Id' })] });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.json.fields)).toEqual(expect.arrayContaining(['items.0.sets', 'items.0.reps_max', 'items.0.exercise_id']));
    const r1 = await call('POST', '/api/sports/workouts', { name: 'تمرين أ', note: 'ملاحظة', items: [item(), item({ exercise_id: 'plank', en_name: 'Plank', ar_name: 'بلانك', sets: 3, reps_min: null, reps_max: null, duration_s: 30 })] });
    expect(r1.status).toBe(201);
    a = r1.json.id;
    expect(r1.json.items.map((x: any) => x.exercise_id)).toEqual(['push_up', 'plank']);
    expect(r1.json.items[1]).toMatchObject({ duration_s: 30, reps_min: null, per_side: false });
    b = (await call('POST', '/api/sports/workouts', { name: 'تمرين ب' })).json.id;
    expect((await call('GET', '/api/sports/mine')).json.workouts.map((w: any) => w.id)).toEqual([a, b]);
  });
  it('replaces items (reorder + edit) and renames', async () => {
    const r = await call('PUT', `/api/sports/workouts/${a}/items`, { items: [item({ exercise_id: 'plank', en_name: 'Plank', ar_name: 'بلانك', per_side: true }), item({ sets: 4 })] });
    expect(r.json.items.map((x: any) => [x.exercise_id, x.sets, x.per_side])).toEqual([['plank', 3, true], ['push_up', 4, false]]);
    expect((await call('PATCH', `/api/sports/workouts/${a}`, { name: 'الاسم الجديد' })).json.name).toBe('الاسم الجديد');
    expect((await call('PUT', `/api/sports/workouts/${a}/items`, { items: 'x' })).status).toBe(400);
    expect((await call('PUT', '/api/sports/workouts/nope/items', { items: [] })).status).toBe(404);
    expect((await call('PUT', `/api/sports/workouts/${a}/items`, { items: Array.from({ length: 61 }, () => item()) })).status).toBe(400);
  });
  it('reorders workouts and validates the id list', async () => {
    expect((await call('PUT', '/api/sports/order', { ids: [b, a] })).json.workouts.map((w: any) => w.id)).toEqual([b, a]);
    expect((await call('PUT', '/api/sports/order', { ids: [a] })).status).toBe(400);
  });
  it('assigns workouts to weekdays; unknown day / workout rejected; delete clears the week', async () => {
    expect((await call('PUT', '/api/sports/week', { day: 'sat', workout_id: a })).json.week.sat).toBe(a);
    expect((await call('PUT', '/api/sports/week', { day: 'xxx', workout_id: a })).status).toBe(400);
    expect((await call('PUT', '/api/sports/week', { day: 'sun', workout_id: 'nope' })).status).toBe(404);
    expect((await call('DELETE', `/api/sports/workouts/${a}`)).json.ok).toBe(true);
    const m = (await call('GET', '/api/sports/mine')).json;
    expect(m.week.sat).toBeNull();
    expect(m.workouts.map((w: any) => w.id)).toEqual([b]);
    expect((await call('DELETE', `/api/sports/workouts/${a}`)).status).toBe(404);
  });
  it('local template / location choice is stored in the site DB only', async () => {
    const s = await call('PUT', '/api/sports/settings', { template: 'home_3day', location: 'home' });
    expect(s.json.template).toBe('home_3day');
    expect(s.json.location).toBe('home');
    expect((await call('PUT', '/api/sports/settings', { location: 'moon' })).status).toBe(400);
    expect((await call('PUT', '/api/sports/settings', { template: 'Bad Id!' })).status).toBe(400);
    expect((await call('PUT', '/api/sports/settings', { template: null })).json.template).toBeNull();
    const plans = (await call('GET', '/api/life/content/SPORTS_PLANS_AR.json')).json.data as PlansDoc;
    expect(plans.selected_template_id).toBeNull(); // ملف راشد لم يتغير
  });
  it('habit alternative picks toggle', async () => {
    expect((await call('PUT', '/api/sports/alt-picks', { alt_id: 'vape_water', habit_id: 'vape' })).json).toEqual([{ alt_id: 'vape_water', habit_id: 'vape' }]);
    await call('PUT', '/api/sports/alt-picks', { alt_id: 'vape_water', habit_id: 'vape' });
    expect((await call('GET', '/api/sports/alt-picks')).json).toHaveLength(1);
    expect((await call('PUT', '/api/sports/alt-picks', { alt_id: 'vape_water', habit_id: 'vape', picked: false })).json).toEqual([]);
    expect((await call('PUT', '/api/sports/alt-picks', { alt_id: 'BAD ID', habit_id: 'vape' })).status).toBe(400);
  });
  it('never touches the exports folder', async () => {
    const before = fs.readdirSync(path.join(dir, 'rashed', 'docs')).sort();
    await call('POST', '/api/sports/workouts', { name: 'ج' });
    expect(fs.readdirSync(path.join(dir, 'rashed', 'docs')).sort()).toEqual(before);
    expect(fs.readdirSync(path.join(dir, 'rashed', 'commands')).filter((f) => f.endsWith('.json'))).toEqual([]);
  });
});

const REAL = process.env['RASHED_FIXTURE_DIR'] ?? '/workspace/rashed_fixture';
describe.skipIf(!fs.existsSync(path.join(REAL, 'docs', 'SPORTS_EXERCISES.json')))('real Rashed sports content (local copy only; skipped elsewhere)', () => {
  const read = <T,>(n: string): T => JSON.parse(fs.readFileSync(path.join(REAL, 'docs', n), 'utf8').replace(/^\ufeff/, '')) as T;
  it('81 exercises, all pass the shape check, every one maps to a region or full/cardio', () => {
    const doc = read<ExercisesDoc>('SPORTS_EXERCISES.json');
    expect(checkContent('SPORTS_EXERCISES.json', doc)).toBeNull();
    expect(doc.exercises).toHaveLength(81);
    expect(new Set(doc.exercises.map((e) => e.id)).size).toBe(81);
    const none = withRegions(doc.exercises).filter((e) => e.regions.length === 0).map((e) => `${e.id}: ${e.main_muscle_ar}`);
    expect(none).toEqual([]);
    const known = new Set(Object.keys(doc.equipment_key_values ?? {}));
    for (const e of doc.exercises) for (const k of e.equipment_keys ?? []) expect(known.has(k), `${e.id} ${k}`).toBe(true);
  });
  it('v5 details: instructions/secondary/level are present and well-formed (null allowed, never invented)', () => {
    const doc = read<ExercisesDoc>('SPORTS_EXERCISES.json');
    for (const e of doc.exercises) {
      if (e.instructions_ar != null) expect(Array.isArray(e.instructions_ar) && e.instructions_ar.length >= 1 && e.instructions_ar.every((x) => typeof x === 'string' && x.trim()), e.id).toBe(true);
      if (e.secondary_muscles_ar != null) expect(Array.isArray(e.secondary_muscles_ar), e.id).toBe(true);
      if (e.level != null) expect(doc.level_values_ar ?? ['مبتدئ', 'متوسط', 'متقدم']).toContain(e.level);
    }
    expect(doc.details_note_ar).toBeTruthy();
  });
  it('v6 safety: 29 beginner_safe=false, safer ids resolve, summary lists match, session safety pairs align, changelog ids resolve', () => {
    const doc = read<ExercisesDoc>('SPORTS_EXERCISES.json');
    const plans = read<PlansDoc>('SPORTS_PLANS_AR.json');
    const ids = new Set(doc.exercises.map((e) => e.id));
    const unsafe = doc.exercises.filter((e) => e.beginner_safe === false).map((e) => e.id);
    expect(unsafe).toHaveLength(29);
    expect(new Set(doc.safety_review?.beginner_unsafe_ids ?? unsafe)).toEqual(new Set(unsafe));
    for (const e of doc.exercises) {
      if (e.beginner_safe != null) expect(typeof e.beginner_safe, e.id).toBe('boolean');
      if (e.safer_alternative_id) expect(ids.has(e.safer_alternative_id), `${e.id} -> ${e.safer_alternative_id}`).toBe(true);
    }
    expect(doc.safety_review?.disclaimer_ar ?? plans.disclaimer_ar).toBeTruthy();
    for (const s of plans.sessions) {
      expect((s.safety_notes_ar ?? []).length, s.id).toBe((s.safety_exercise_ids ?? []).length);
      for (const id of s.safety_exercise_ids ?? []) expect(ids.has(id), `${s.id} ${id}`).toBe(true);
    }
    const sess = new Set(plans.sessions.map((s) => s.id));
    for (const c of plans.changelog ?? []) for (const ch of c.changes ?? []) {
      expect(sess.has(ch.session_id), ch.session_id).toBe(true);
      for (const id of [ch.from_exercise_id, ch.to_exercise_id, ch.removed_alternative_exercise_id]) if (id) expect(ids.has(id), id).toBe(true);
    }
  });
  it('glossary: 69 unique terms with categories', () => {
    const g = read<GlossaryDoc>('GLOSSARY_AR.json');
    expect(checkContent('GLOSSARY_AR.json', g)).toBeNull();
    expect(g.entries).toHaveLength(69);
    expect(new Set(g.entries.map((x) => x.id)).size).toBe(69);
    for (const x of g.entries) expect(Object.keys(g.categories ?? {}), x.id).toContain(x.category);
  });
  it('plans: 6 templates, all assumption, selection null, every session exercise resolves, every template session exists', () => {
    const plans = read<PlansDoc>('SPORTS_PLANS_AR.json');
    const ex = new Set(read<ExercisesDoc>('SPORTS_EXERCISES.json').exercises.map((e) => e.id));
    expect(checkContent('SPORTS_PLANS_AR.json', plans)).toBeNull();
    expect(plans.templates).toHaveLength(6);
    expect(plans.selected_template_id).toBeNull();
    const sess = new Set(plans.sessions.map((s) => s.id));
    for (const s of plans.sessions) for (const x of s.exercises ?? []) expect(ex.has(x.exercise_id), `${s.id} ${x.exercise_id}`).toBe(true);
    for (const t of plans.templates) for (const d of t.days) for (const s of d.sessions) expect(sess.has(s), `${t.id} ${s}`).toBe(true);
  });
  it('alternatives: 6 habits, 27 alternatives, ids unique', () => {
    const a = read<AltsDoc>('HABITS_ALTERNATIVES_AR.json');
    expect(checkContent('HABITS_ALTERNATIVES_AR.json', a)).toBeNull();
    expect(a.habits).toHaveLength(6);
    const ids = a.habits.flatMap((h) => h.alternatives.map((x) => x.id));
    expect(ids).toHaveLength(27);
    expect(new Set(ids).size).toBe(27);
  });
});

describe(`unified search /api/search/more (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('finds exercises, glossary terms and workouts; empty and no-match are empty; query is length-capped', async () => {
    expect((await call('GET', '/api/search/more?q=')).json).toEqual([]);
    expect((await call('GET', '/api/search/more?q=zzzqqq')).json).toEqual([]);
    const ex = (await call('GET', '/api/search/more?q=push')).json as { kind: string; to: string }[];
    expect(ex.some((h) => h.kind === 'sports' && h.to.startsWith('/sports?q='))).toBe(true);
    const g = (await call('GET', '/api/search/more?q=' + encodeURIComponent('تكرار'))).json as { kind: string; to: string }[];
    expect(g.some((h) => h.kind === 'glossary')).toBe(true);
    expect(g.every((h) => ['glossary', 'sports', 'workout', 'life', 'library', 'youtube'].includes(h.kind))).toBe(true);
    const w = await call('POST', '/api/sports/workouts', { name: 'تمرين البحث الفريد', items: [] });
    const found = (await call('GET', '/api/search/more?q=' + encodeURIComponent('الفريد'))).json as { kind: string; id: string }[];
    expect(found.find((h) => h.kind === 'workout')?.id).toBe(w.json.id);
    expect((await call('GET', '/api/search/more?q=' + 'a'.repeat(5000))).status).toBe(200);
  });
});

describe(`v7/v8 content endpoints + local qada choice (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('serves ledger_full (root), routine blocks, insights and qada plan with freshness; unknown names 404', async () => {
    for (const n of ['ledger_full.json', 'ROUTINE_BLOCKS_AR.json', 'FINANCE_INSIGHTS_AR.json', 'PRAYER_QADA_PLAN_AR.json']) {
      const r = await call('GET', '/api/life/content/' + n);
      expect(r.status, n).toBe(200);
      expect(r.json.data, n).not.toBeNull();
      expect(r.json.status.error, n).toBeNull();
      expect(r.json.status.generated_at, n).toBeTruthy();
    }
    expect((await call('GET', '/api/life/content/..%2Fbody.json')).status).toBe(404);
    expect((await call('GET', '/api/life/content/body.json')).status).toBe(404);
  });
  it('qada choice is stored in the site DB only, validated, clearable', async () => {
    expect((await call('GET', '/api/life/qada-choice')).json.scenario).toBeNull();
    expect((await call('PUT', '/api/life/qada-choice', { scenario: 's2' })).json.scenario).toBe('s2');
    expect((await call('GET', '/api/life/qada-choice')).json.scenario).toBe('s2');
    expect((await call('PUT', '/api/life/qada-choice', { scenario: '../x' })).status).toBe(400);
    expect((await call('PUT', '/api/life/qada-choice', { scenario: null })).json.scenario).toBeNull();
  });
});
