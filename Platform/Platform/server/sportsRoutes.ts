import express from 'express';
import type { Ctx } from './routes.js';
import { HttpError } from './routes.js';
import { ValidationError } from './validation.js';
import { getSetting, newId, setSetting } from './repo.js';
import type { Db } from './db.js';
import { WEEKDAYS, type MyItem, type MyWeek, type MyWorkout } from '../shared/sports.js';

/** تمريني: يُحفظ في قاعدة الموقع فقط، لا في ملفات راشد. المحتوى (أسماء التمارين) لقطة وقت الإضافة كي لا يضيع إن تغيّر الملف. */
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };
export const MAX_WORKOUTS = 50;
export const MAX_ITEMS = 60;

interface ItemRow { id: string; workout_id: string; exercise_id: string; en_name: string; ar_name: string; sets: number | null; reps_min: number | null; reps_max: number | null; duration_s: number | null; per_side: number; note: string | null; sort: number }
const toItem = (r: ItemRow): MyItem => ({ ...r, per_side: !!r.per_side });

export function loadAll(db: Db): MyWeek {
  const ws = db.all<Omit<MyWorkout, 'items'>>('SELECT id, name, note, sort, created_at, updated_at FROM spt_workouts ORDER BY sort, created_at');
  const items = db.all<ItemRow>('SELECT * FROM spt_items ORDER BY workout_id, sort');
  const week: Record<string, string | null> = {};
  for (const d of WEEKDAYS) week[d] = null;
  for (const r of db.all<{ day: string; workout_id: string | null }>('SELECT day, workout_id FROM spt_week')) if (r.day in week) week[r.day] = r.workout_id;
  return {
    workouts: ws.map((w) => ({ ...w, items: items.filter((i) => i.workout_id === w.id).map(toItem) })),
    week,
    template: getSetting(db, 'sports.template'),
    location: getSetting(db, 'sports.location'),
  };
}

const intOrNull = (v: unknown, min: number, max: number, field: string, errs: Record<string, string>): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    errs[field] = `رقم صحيح بين ${min} و${max}`;
    return null;
  }
  return n;
};
interface ItemIn { exercise_id: string; en_name: string; ar_name: string; sets: number | null; reps_min: number | null; reps_max: number | null; duration_s: number | null; per_side: boolean; note: string | null }
function parseItems(v: unknown): ItemIn[] {
  if (!Array.isArray(v)) throw new ValidationError({ items: 'قائمة التمارين مطلوبة' });
  if (v.length > MAX_ITEMS) throw new ValidationError({ items: `الحد الأقصى ${MAX_ITEMS} تمرينًا في التمرين الواحد` });
  const errs: Record<string, string> = {};
  const out = v.map((raw, i) => {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const e: Record<string, string> = {};
    const exercise_id = str(o['exercise_id']);
    if (!/^[a-z0-9_]{1,80}$/.test(exercise_id)) e['exercise_id'] = 'معرّف تمرين غير صالح';
    const en = str(o['en_name']).trim().slice(0, 120);
    const ar = str(o['ar_name']).trim().slice(0, 120);
    if (!en || !ar) e['name'] = 'اسم التمرين مطلوب';
    const sets = intOrNull(o['sets'], 1, 20, 'sets', e);
    const reps_min = intOrNull(o['reps_min'], 1, 500, 'reps_min', e);
    const reps_max = intOrNull(o['reps_max'], 1, 500, 'reps_max', e);
    if (reps_min !== null && reps_max !== null && reps_min > reps_max) e['reps_max'] = 'الحد الأعلى أقل من الأدنى';
    const duration_s = intOrNull(o['duration_s'], 1, 7200, 'duration_s', e);
    const note = str(o['note']).trim().slice(0, 300) || null;
    for (const [k, m] of Object.entries(e)) errs[`items.${i}.${k}`] = m;
    return { exercise_id, en_name: en, ar_name: ar, sets, reps_min, reps_max, duration_s, per_side: o['per_side'] === true, note };
  });
  if (Object.keys(errs).length) throw new ValidationError(errs);
  return out;
}
function writeItems(db: Db, workoutId: string, items: ItemIn[]): void {
  db.run('DELETE FROM spt_items WHERE workout_id = ?', workoutId);
  items.forEach((it, i) => db.run('INSERT INTO spt_items (id, workout_id, exercise_id, en_name, ar_name, sets, reps_min, reps_max, duration_s, per_side, note, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', newId(), workoutId, it.exercise_id, it.en_name, it.ar_name, it.sets, it.reps_min, it.reps_max, it.duration_s, it.per_side ? 1 : 0, it.note, i));
}
const nameOf = (v: unknown): string => {
  const n = str(v).trim();
  if (!n) throw new ValidationError({ name: 'اكتب اسم التمرين' });
  if (n.length > 80) throw new ValidationError({ name: 'الاسم أطول من 80 حرفًا' });
  return n;
};

export function createSportsRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = () => ctx.getDb();
  const one = (id: string): MyWorkout => {
    const w = loadAll(db()).workouts.find((x) => x.id === id);
    if (!w) throw new HttpError(404, 'التمرين غير موجود');
    return w;
  };

  r.get('/mine', wrap((_req, res) => void res.json(loadAll(db()))));

  r.post('/workouts', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const name = nameOf(b['name']);
    const items = b['items'] === undefined ? [] : parseItems(b['items']);
    if ((db().get<{ n: number }>('SELECT COUNT(*) AS n FROM spt_workouts')?.n ?? 0) >= MAX_WORKOUTS) throw new ValidationError({ name: `الحد الأقصى ${MAX_WORKOUTS} تمرينًا محفوظًا` });
    const id = newId();
    const now = new Date().toISOString();
    const note = str(b['note']).trim().slice(0, 500) || null;
    db().tx(() => {
      const max = db().get<{ m: number | null }>('SELECT MAX(sort) AS m FROM spt_workouts')?.m ?? -1;
      db().run('INSERT INTO spt_workouts (id, name, note, sort, created_at, updated_at) VALUES (?,?,?,?,?,?)', id, name, note, max + 1, now, now);
      writeItems(db(), id, items);
    });
    res.status(201).json(one(id));
  }));

  r.patch('/workouts/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    one(id);
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (b['name'] !== undefined) db().run('UPDATE spt_workouts SET name = ?, updated_at = ? WHERE id = ?', nameOf(b['name']), new Date().toISOString(), id);
    if (b['note'] !== undefined) db().run('UPDATE spt_workouts SET note = ?, updated_at = ? WHERE id = ?', str(b['note']).trim().slice(0, 500) || null, new Date().toISOString(), id);
    res.json(one(id));
  }));

  r.put('/workouts/:id/items', wrap((req, res) => {
    const id = str(req.params['id']);
    one(id);
    const items = parseItems((req.body as { items?: unknown } | undefined)?.items);
    db().tx(() => {
      writeItems(db(), id, items);
      db().run('UPDATE spt_workouts SET updated_at = ? WHERE id = ?', new Date().toISOString(), id);
    });
    res.json(one(id));
  }));

  r.delete('/workouts/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    one(id);
    db().tx(() => {
      db().run('UPDATE spt_week SET workout_id = NULL WHERE workout_id = ?', id);
      db().run('DELETE FROM spt_items WHERE workout_id = ?', id);
      db().run('DELETE FROM spt_workouts WHERE id = ?', id);
    });
    res.json({ ok: true });
  }));

  r.put('/order', wrap((req, res) => {
    const ids = (req.body as { ids?: unknown } | undefined)?.ids;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) throw new ValidationError({ ids: 'قائمة معرّفات مطلوبة' });
    const known = new Set(db().all<{ id: string }>('SELECT id FROM spt_workouts').map((x) => x.id));
    if (ids.length !== known.size || ids.some((x: string) => !known.has(x))) throw new ValidationError({ ids: 'القائمة لا تطابق التمارين المحفوظة' });
    db().tx(() => (ids as string[]).forEach((x, i) => db().run('UPDATE spt_workouts SET sort = ? WHERE id = ?', i, x)));
    res.json(loadAll(db()));
  }));

  r.put('/week', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const day = str(b['day']);
    if (!(WEEKDAYS as readonly string[]).includes(day)) throw new ValidationError({ day: 'يوم غير صالح' });
    const wid = b['workout_id'] === null || b['workout_id'] === undefined || b['workout_id'] === '' ? null : str(b['workout_id']);
    if (wid !== null) one(wid);
    db().run('INSERT INTO spt_week (day, workout_id) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET workout_id = excluded.workout_id', day, wid);
    res.json(loadAll(db()));
  }));

  /** اختيارك المحلي للقالب/المكان (لا يغيّر ملفات راشد؛ selected_template_id عنده يبقى كما هو حتى يسجّله راشد). */
  r.put('/settings', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (b['template'] !== undefined) {
      const t = b['template'] === null ? null : str(b['template']);
      if (t !== null && !/^[a-z0-9_]{1,60}$/.test(t)) throw new ValidationError({ template: 'معرّف قالب غير صالح' });
      setSetting(db(), 'sports.template', t);
    }
    if (b['location'] !== undefined) {
      const l = b['location'] === null ? null : str(b['location']);
      if (l !== null && l !== 'home' && l !== 'gym') throw new ValidationError({ location: 'بيت أو جيم' });
      setSetting(db(), 'sports.location', l);
    }
    res.json(loadAll(db()));
  }));

  r.get('/alt-picks', wrap((_req, res) => void res.json(db().all<{ alt_id: string; habit_id: string }>('SELECT alt_id, habit_id FROM life_alt_picks ORDER BY picked_at'))));
  r.put('/alt-picks', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const alt = str(b['alt_id']);
    const habit = str(b['habit_id']);
    if (!/^[a-z0-9_]{1,80}$/.test(alt) || !/^[a-z0-9_]{1,80}$/.test(habit)) throw new ValidationError({ alt_id: 'معرّف غير صالح' });
    if (b['picked'] === false) db().run('DELETE FROM life_alt_picks WHERE alt_id = ?', alt);
    else db().run('INSERT INTO life_alt_picks (alt_id, habit_id, picked_at) VALUES (?,?,?) ON CONFLICT(alt_id) DO NOTHING', alt, habit, new Date().toISOString());
    res.json(db().all<{ alt_id: string; habit_id: string }>('SELECT alt_id, habit_id FROM life_alt_picks ORDER BY picked_at'));
  }));
  return r;
}
