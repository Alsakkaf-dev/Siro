import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './db.js';
import { getSetting, setSetting } from './repo.js';
import { findRoot } from './config.js';
import { PRAYER_KEYS, type PrayerKey } from '../shared/life.js';

/**
 * مخزن الحياة الأصيل: وثائق JSON في قاعدة التطبيق (life_docs) تُزرع مرة واحدة من seed/life ثم تُحدَّث بالتسجيل المباشر.
 * المحتوى الثابت (تمارين، قوالب، قاموس...) يُقرأ من seed/content ولا يتغير.
 */
export const LIVE_DOCS = ['dashboard_summary', 'finance', 'prayers', 'habits', 'body', 'routine', 'ledger_full'] as const;
export type LiveDoc = (typeof LIVE_DOCS)[number];
const SEEDED = 'life.seeded';

let seedRootCache: string | null = null;
const seedRoot = (): string => (seedRootCache ??= path.join(findRoot(), 'seed'));
/** للاختبارات فقط. */
export function setSeedRootForTests(p: string | null): void {
  seedRootCache = p;
  staticCache.clear();
}

const stripBom = (s: string): string => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const readJson = (file: string): unknown => JSON.parse(stripBom(fs.readFileSync(file, 'utf8')));

/** يزرع الوثائق الحية مرة واحدة فقط (لا يعيد زرعها بعد أن تُسجَّل أي بيانات). */
export function ensureLifeSeed(db: Db): void {
  if (getSetting(db, SEEDED)) return;
  const now = new Date().toISOString();
  db.tx(() => {
    for (const n of LIVE_DOCS) {
      const f = path.join(seedRoot(), 'life', `${n}.json`);
      if (!fs.existsSync(f)) continue;
      db.run('INSERT OR IGNORE INTO life_docs (name, body, updated_at) VALUES (?, ?, ?)', n, JSON.stringify(readJson(f)), now);
    }
    setSetting(db, SEEDED, now);
  });
}

export function getDoc<T = unknown>(db: Db, name: LiveDoc): { data: T | null; updated_at: string | null } {
  ensureLifeSeed(db);
  const row = db.get<{ body: string; updated_at: string }>('SELECT body, updated_at FROM life_docs WHERE name = ?', name);
  if (!row) return { data: null, updated_at: null };
  try {
    return { data: JSON.parse(row.body) as T, updated_at: row.updated_at };
  } catch {
    return { data: null, updated_at: row.updated_at };
  }
}

const staticCache = new Map<string, unknown>();
export function readStatic(name: string): unknown {
  if (!/^[A-Za-z0-9_]+\.json$/.test(name)) return null;
  if (staticCache.has(name)) return staticCache.get(name);
  const f = path.join(seedRoot(), 'content', name);
  let v: unknown = null;
  try {
    v = readJson(f);
  } catch {
    v = null;
  }
  staticCache.set(name, v);
  return v;
}

/* ───── تسجيل مباشر مع تراجع ───── */
type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** تاريخ اليوم بتوقيت ماليزيا. */
export const todayKL = (now = new Date()): string => new Date(now.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface LifeEvent { id: string; at: string; type: string; payload: Record<string, unknown>; summary: string; undone: boolean }

function eventId(db: Db, now: Date): string {
  const kl = new Date(now.getTime() + 8 * 3_600_000).toISOString();
  const base = `EV-${kl.slice(0, 10).replace(/-/g, '')}-${kl.slice(11, 19).replace(/:/g, '')}`;
  for (let i = 1; i < 100; i++) {
    const id = `${base}-${String(i).padStart(3, '0')}`;
    if (!db.get('SELECT 1 AS x FROM life_events WHERE id = ?', id)) return id;
  }
  throw new Error('تعذّر توليد رقم تسجيل فريد');
}

/** ينفّذ دالة تعدّل الوثائق، ويحفظ لقطة ما قبل للتراجع. */
function mutate(db: Db, type: string, payload: Record<string, unknown>, docs: LiveDoc[], fn: (d: Record<LiveDoc, Obj>) => string, now: Date): LifeEvent {
  ensureLifeSeed(db);
  return db.tx(() => {
    const before: Record<string, string> = {};
    const cur = {} as Record<LiveDoc, Obj>;
    for (const n of docs) {
      const row = db.get<{ body: string }>('SELECT body FROM life_docs WHERE name = ?', n);
      before[n] = row?.body ?? '{}';
      cur[n] = JSON.parse(before[n]!) as Obj;
    }
    const summary = fn(cur);
    const at = now.toISOString();
    for (const n of docs) {
      db.run('INSERT INTO life_docs (name, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at', n, JSON.stringify(cur[n]), at);
    }
    const id = eventId(db, now);
    db.run('INSERT INTO life_events (id, at, type, payload, summary, undo, undone) VALUES (?, ?, ?, ?, ?, ?, 0)', id, at, type, JSON.stringify(payload), summary, JSON.stringify(before));
    return { id, at, type, payload, summary, undone: false };
  });
}

export function listEvents(db: Db, limit = 100): LifeEvent[] {
  return db
    .all<{ id: string; at: string; type: string; payload: string; summary: string; undone: number }>('SELECT id, at, type, payload, summary, undone FROM life_events ORDER BY at DESC, id DESC LIMIT ?', limit)
    .map((r) => ({ id: r.id, at: r.at, type: r.type, payload: JSON.parse(r.payload) as Record<string, unknown>, summary: r.summary, undone: r.undone === 1 }));
}

/** يتراجع عن آخر تسجيل غير ملغى فقط (حتى لا تتعارض اللقطات). */
export function undoEvent(db: Db, id: string): { ok: true } | { ok: false; error: string } {
  const row = db.get<{ id: string; undo: string; undone: number }>('SELECT id, undo, undone FROM life_events WHERE id = ?', id);
  if (!row) return { ok: false, error: 'التسجيل غير موجود' };
  if (row.undone) return { ok: false, error: 'سبق التراجع عنه' };
  const last = db.get<{ id: string }>('SELECT id FROM life_events WHERE undone = 0 ORDER BY at DESC, id DESC LIMIT 1');
  if (!last || last.id !== id) return { ok: false, error: 'يمكن التراجع عن آخر تسجيل فقط' };
  const before = JSON.parse(row.undo) as Record<string, string>;
  const now = new Date().toISOString();
  db.tx(() => {
    for (const [n, body] of Object.entries(before)) db.run('UPDATE life_docs SET body = ?, updated_at = ? WHERE name = ?', body, now, n);
    db.run('UPDATE life_events SET undone = 1 WHERE id = ?', id);
  });
  return { ok: true };
}

const PRAYER_NAME: Record<PrayerKey, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
const STATUS_AR: Record<string, string> = { in_time: 'في وقتها', late: 'متأخرة', missed: 'فاتت' };

function recount(day: Obj): void {
  const c = { in_time: 0, late: 0, missed: 0, unknown: 0 };
  for (const k of PRAYER_KEYS) {
    const v = day.status?.[k];
    if (v === 'in_time' || v === 'late' || v === 'missed') c[v as 'in_time' | 'late' | 'missed']++;
    else c.unknown++;
  }
  day.counts = c;
}

export function logPrayer(db: Db, p: { date: string; prayer: PrayerKey; status: 'in_time' | 'late' | 'missed'; kind: 'fard' | 'qada'; note_ar?: string }, now = new Date()): LifeEvent {
  return mutate(db, 'log_prayer', p, ['prayers', 'dashboard_summary'], (d) => {
    const pr = d.prayers;
    pr.qada ??= {};
    const q = pr.qada;
    q.remaining ??= {};
    const rem = (k: PrayerKey): { count: number } => (q.remaining[k] ??= { count: 0, name_ar: PRAYER_NAME[k] });
    const bump = (k: PrayerKey, by: number): void => {
      const r = rem(k);
      r.count = Math.max(0, (r.count ?? 0) + by);
      q.total_remaining = PRAYER_KEYS.reduce((s, x) => s + (rem(x).count ?? 0), 0);
    };
    if (p.kind === 'qada') {
      if (p.status === 'missed') throw new Error('القضاء لا يُسجَّل «فاتت»');
      bump(p.prayer, -1);
      q.done_total = (q.done_total ?? 0) + 1;
      if (p.date === todayKL(now)) q.done_today = (q.done_today ?? 0) + 1;
      q.as_of = now.toISOString();
      q.done_confidence = 'مثبت';
      return `قضاء ${PRAYER_NAME[p.prayer]} (${p.date})`;
    }
    pr.attendance ??= { days: [] };
    pr.attendance.days ??= [];
    let day = pr.attendance.days.find((x: Obj) => x.date === p.date);
    if (!day) {
      day = { date: p.date, status: {}, confidence: 'مثبت' };
      pr.attendance.days.push(day);
      pr.attendance.days.sort((a: Obj, b: Obj) => String(a.date).localeCompare(String(b.date)));
    }
    day.status ??= {};
    const prev = day.status[p.prayer];
    day.status[p.prayer] = p.status;
    day.confidence = 'مثبت';
    if (p.note_ar) day.note_ar = p.note_ar;
    recount(day);
    if (p.status === 'missed' && prev !== 'missed') bump(p.prayer, 1);
    else if (p.status !== 'missed' && prev === 'missed') bump(p.prayer, -1);
    const t = { in_time: 0, late: 0, missed: 0 } as Record<string, number>;
    for (const x of pr.attendance.days as Obj[]) for (const k of PRAYER_KEYS) if (t[x.status?.[k]] !== undefined) t[x.status[k]]!++;
    pr.attendance.totals = t;
    return `${PRAYER_NAME[p.prayer]} ${STATUS_AR[p.status]} (${p.date})`;
  }, now);
}

const SRC_ACCOUNT: Record<string, string> = { rhb: 'rhb', tng: 'tng' };
const BOX_ITEM: Record<string, string> = { treasury: 'treasury', monthly: 'monthly', daily: 'daily' };
const BOX_AR: Record<string, string> = { treasury: 'الخزينة', monthly: 'الشهري', daily: 'اليومية', unknown: 'غير محدد' };

export function logExpense(db: Db, p: { date: string; amount: number; currency: 'RM'; box: string; label_ar: string; category_ar: string; payment_source: string; note_ar?: string }, now = new Date()): LifeEvent {
  return mutate(db, 'log_expense', p, ['finance', 'ledger_full', 'dashboard_summary'], (d) => {
    const fin = d.finance;
    const led = d.ledger_full;
    const stamp = now.getTime().toString(36).toUpperCase();
    const id = `EXP-${p.date.replace(/-/g, '')}-${stamp}`;
    const applied = p.box !== 'unknown' && p.payment_source !== 'unknown';
    const delta = applied ? -p.amount : 0;
    led.rows ??= [];
    led.rows.push({ order: led.rows.length + 1, event_id: id, occurred_at: p.date, date: p.date, type: 'expense', amount: p.amount, currency: 'RM', wallet: BOX_AR[p.box], cash_delta: delta, receivable_delta: 0, source: 'تسجيل مباشر', notes: `${p.label_ar} — ${p.category_ar}${p.note_ar ? ' — ' + p.note_ar : ''}`, text_redacted: false });
    led.total_rows = led.rows.length;
    fin.recent_transactions ??= [];
    fin.recent_transactions.push({ id, order: led.rows.length, date: p.date, type: 'expense', type_ar: 'مصروف', amount: p.amount, currency: 'RM', wallet: BOX_AR[p.box], label_ar: p.label_ar, confidence: 'مثبت', cash_delta: delta, category_ar: p.category_ar, category_confidence: 'مثبت' });
    if (applied) {
      for (const a of (fin.accounts ?? []) as Obj[]) if (a.key === SRC_ACCOUNT[p.payment_source] && typeof a.amount === 'number') a.amount = round2(a.amount - p.amount);
      const items = (fin.balances_block?.items ?? []) as Obj[];
      const boxKey = BOX_ITEM[p.box];
      for (const it of items) {
        if ((it.key === boxKey || it.key === 'total') && typeof it.amount === 'number') it.amount = round2(it.amount - p.amount);
      }
      if (fin.balances_block) fin.balances_block.as_of = now.toISOString();
    }
    return `مصروف ${p.amount} RM — ${p.label_ar}${applied ? '' : ' (لم يُطبَّق على صندوق)'}`;
  }, now);
}

export function logWeight(db: Db, p: { date: string; weight_kg: number; note_ar?: string }, now = new Date()): LifeEvent {
  return mutate(db, 'log_weight', p, ['body'], (d) => {
    const b = d.body;
    b.weight_history ??= [];
    const i = (b.weight_history as Obj[]).findIndex((x) => x.date === p.date);
    const row = { date: p.date, value_kg: p.weight_kg, confidence: 'مثبت', ...(p.note_ar ? { note_ar: p.note_ar } : {}) };
    if (i >= 0) b.weight_history[i] = { ...b.weight_history[i], ...row };
    else b.weight_history.push(row);
    b.weight_history.sort((x: Obj, y: Obj) => String(x.date).localeCompare(String(y.date)));
    const last = b.weight_history[b.weight_history.length - 1] as Obj;
    b.latest_weight_kg = last.value_kg;
    b.latest_weight_date = last.date;
    b.latest_weight_confidence = 'مثبت';
    b.latest_recorded_weight = { date: last.date, value_kg: last.value_kg, confidence: 'مثبت' };
    const gp = (b.goal_progress ??= {}) as Obj;
    const goal = typeof b.goal_kg === 'number' ? b.goal_kg : gp.goal_kg;
    gp.latest_weight_kg = last.value_kg;
    if (typeof goal === 'number') gp.remaining_to_goal_kg = round2(last.value_kg - goal);
    if (typeof gp.baseline_kg === 'number') gp.change_since_baseline_kg = round2(last.value_kg - gp.baseline_kg);
    return `الوزن ${p.weight_kg} كغ (${p.date})`;
  }, now);
}

const HABIT_FIELD: Record<string, (v: number | boolean, date: string) => Obj> = {
  vape: (v, date) => ({ date, kept_limit: v ? 'yes' : 'no' }),
  tea_sugar: (v, date) => ({ date, actual_sugar_g: typeof v === 'number' ? v : null }),
  water: (v, date) => ({ date, water_l: typeof v === 'number' ? v : null }),
  sleep: (v, date) => ({ date, on_target: v === true || (typeof v === 'number' && v > 0) }),
  food: (v, date) => ({ date, kcal_estimate: typeof v === 'number' ? v : null }),
  workout: (v, date) => ({ date, done: v ? 'yes' : 'no' }),
};

function upsertHabitLog(h: Obj, date: string, entry: Obj): void {
  h.log ??= [];
  const row = { ...entry, confidence: 'مثبت' };
  const i = (h.log as Obj[]).findIndex((x) => x.date === date);
  if (i >= 0) h.log[i] = { ...h.log[i], ...row };
  else h.log.push(row);
  h.log.sort((a: Obj, b: Obj) => String(a.date).localeCompare(String(b.date)));
}

export function logHabit(db: Db, p: { habit: string; date: string; value: number | boolean }, now = new Date()): LifeEvent {
  return mutate(db, 'log_habit', p, ['habits'], (d) => {
    const h = ((d.habits.habits ?? []) as Obj[]).find((x) => x.key === p.habit);
    const make = HABIT_FIELD[p.habit];
    if (!h || !make) throw new Error('عادة غير معروفة');
    upsertHabitLog(h, p.date, make(p.value, p.date));
    return `عادة ${h.name_ar ?? p.habit} (${p.date})`;
  }, now);
}

export function startHabit(db: Db, p: { habit: string; start_date: string }, now = new Date()): LifeEvent {
  return mutate(db, 'start_habit', p, ['habits'], (d) => {
    const h = ((d.habits.habits ?? []) as Obj[]).find((x) => x.key === p.habit);
    if (!h) throw new Error('عادة غير معروفة');
    h.start_date = p.start_date;
    return `بدء ${h.name_ar ?? p.habit} من ${p.start_date}`;
  }, now);
}

export function habitRelapse(db: Db, p: { habit: string; date: string; note_ar?: string }, now = new Date()): LifeEvent {
  return mutate(db, 'habit_relapse', p, ['habits'], (d) => {
    const h = ((d.habits.habits ?? []) as Obj[]).find((x) => x.key === p.habit);
    if (!h) throw new Error('عادة غير معروفة');
    upsertHabitLog(h, p.date, { date: p.date, relapse: true, ...(p.note_ar ? { note_ar: p.note_ar } : {}) });
    return `انتكاسة ${h.name_ar ?? p.habit} (${p.date})`;
  }, now);
}
