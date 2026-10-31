import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import {
  ageText, blocksForDay, checkShape, classifyFreshness, coverage, dailySpendRate, nowAndNext, parseBalanceHistory, spendingByCategory, spendingByDay, validatePayload, missingInputs, countMissing, weightProgress, worstOf,
  type Finance, type Tx,
} from '../shared/life.js';

const H = 3_600_000;
describe('freshness rules (REFRESH_PROTOCOL §2)', () => {
  const now = Date.parse('2026-10-27T12:00:00+08:00');
  const base = { nowMs: now, bytesMeta: 10, bytesActual: 10 };
  it('fresh / stale / expired thresholds at 1x and 3x', () => {
    const at = (h: number) => new Date(now - h * H).toISOString();
    expect(classifyFreshness({ ...base, generatedAt: at(23), staleAfterHours: 24 }).state).toBe('fresh');
    expect(classifyFreshness({ ...base, generatedAt: at(25), staleAfterHours: 24 }).state).toBe('stale');
    expect(classifyFreshness({ ...base, generatedAt: at(72), staleAfterHours: 24 }).state).toBe('stale');
    expect(classifyFreshness({ ...base, generatedAt: at(73), staleAfterHours: 24 }).state).toBe('expired');
    expect(classifyFreshness({ ...base, generatedAt: at(13), staleAfterHours: 12 }).state).toBe('stale');
  });
  it('unavailable when missing, unreadable or no date; inconsistent when bytes differ', () => {
    expect(classifyFreshness({ ...base, generatedAt: null, staleAfterHours: 24 }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, bytesActual: null, generatedAt: new Date(now).toISOString(), staleAfterHours: 24 }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, generatedAt: new Date(now).toISOString(), staleAfterHours: 24, fileError: true }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, bytesActual: 11, generatedAt: new Date(now).toISOString(), staleAfterHours: 24 }).state).toBe('inconsistent');
  });
  it('worst state and age text', () => {
    expect(worstOf(['fresh', 'stale', 'expired'])).toBe('expired');
    expect(worstOf(['fresh', 'unavailable', 'expired'])).toBe('unavailable');
    expect(ageText(0.01)).toBe('الآن');
    expect(ageText(5)).toBe('قبل 5 ساعة');
    expect(ageText(72)).toBe('قبل 3 يوم');
    expect(ageText(null)).toBe('غير معروف');
  });
});

describe('derived finance numbers', () => {
  const tx: Tx[] = [
    { id: '1', date: '2026-10-20', type: 'expense', amount: 10, wallet: 'يومية', cash_delta: -10, category_ar: 'طعام وبقالة' },
    { id: '2', date: '2026-10-22', type: 'expense', amount: 5.5, wallet: 'يومية', cash_delta: -5.5, category_ar: 'طعام وبقالة' },
    { id: '3', date: '2026-10-22', type: 'expense', amount: 4, wallet: 'خزينة', cash_delta: -4 },
    { id: '4', date: '2026-10-22', type: 'transfer', amount: 99, wallet: 'خزينة→يومية', cash_delta: 0 },
    { id: '5', date: '2026-10-23', type: 'expense', amount: 9, wallet: 'يومية', cash_delta: 0, category_ar: 'اشتراكات' },
  ];
  it('categories count only expenses and keep «unknown» honest', () => {
    const c = spendingByCategory(tx);
    expect(c[0]).toEqual({ category: 'طعام وبقالة', total: 15.5, count: 2 });
    expect(c.find((x) => x.category === 'غير مصنّف')?.total).toBe(4);
    expect(c.reduce((s, x) => s + x.total, 0)).toBe(28.5);
  });
  it('by day', () => {
    expect(spendingByDay(tx)).toEqual([{ date: '2026-10-20', total: 10 }, { date: '2026-10-22', total: 9.5 }, { date: '2026-10-23', total: 9 }]);
  });
  it('daily rate ignores cash_delta=0 (not applied to a box) and spans first..last day inclusive', () => {
    expect(dailySpendRate(tx)).toEqual({ rate: 5.17, days: 3, total: 15.5, count: 2 });
    expect(dailySpendRate([])).toBeNull();
  });
  it('coverage never divides by zero or null', () => {
    expect(coverage(58, 14)).toBe(4.14);
    expect(coverage(58, 0)).toBeNull();
    expect(coverage(null, 14)).toBeNull();
  });
});

describe('balance_history parsing (approved field; tolerant shapes, never invents points)', () => {
  const f = (v: unknown, key = 'balance_history'): Finance => ({ [key]: v }) as Finance;
  it('absent → no points, field null (UI shows «history not recorded yet»)', () => {
    expect(parseBalanceHistory({})).toEqual({ points: [], skipped: 0, field: null, title: null, method: null, omitted: [] });
    expect(parseBalanceHistory(null)).toMatchObject({ points: [], skipped: 0, field: null, omitted: [] });
  });
  it('flat points, items points, nested balances and the alias name', () => {
    const flat = parseBalanceHistory(f([{ date: '2026-10-02', treasury: 5, monthly: 1, daily: 2, total: 8 }, { date: '2026-10-01', treasury: 4, monthly: null, daily: 2 }]));
    expect(flat.points.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(flat.points[0]).toMatchObject({ treasury: 4, monthly: null, total: null });
    const items = parseBalanceHistory(f([{ as_of: '2026-10-03T10:00:00+08:00', items: [{ key: 'treasury', amount: 9 }, { key: 'total', amount: 12 }] }]));
    expect(items.points[0]).toMatchObject({ treasury: 9, total: 12, daily: null });
    expect(parseBalanceHistory(f([{ date: '2026-10-03', balances: { daily: 3 } }])).points[0]?.daily).toBe(3);
    expect(parseBalanceHistory(f([{ date: '2026-10-03', daily: 3 }], 'balances_history')).field).toBe('balances_history');
    expect(parseBalanceHistory(f({ points: [{ date: '2026-10-03', daily: 3 }] })).points).toHaveLength(1);
  });
  it('garbage is counted as skipped, not guessed', () => {
    const r = parseBalanceHistory(f([{ foo: 1 }, 'x', { date: 'nope', treasury: 1 }, { date: '2026-10-03' }, { date: '2026-10-04', treasury: 1 }]));
    expect(r.points).toHaveLength(1);
    expect(r.skipped).toBe(4);
  });
});

describe('balance_history v4 (real shape) + missing inputs', () => {
  const fin = {
    balance_history_title_ar: 'تطور', balance_history_method: 'طريقة',
    balance_history: [
      { date: '2026-10-20', as_of: null, treasury: 10, monthly: 5, daily: 1, total: 16, confidence: 'محسوب', source_row: null, event_ar: 'بداية', note_ar: 'أقدم حالة' },
      { date: '2026-10-20', as_of: '2026-10-20T14:25:00+08:00', treasury: 10, monthly: 5, daily: -3.38, total: 11.62, confidence: 'محسوب', source_row: 'TNG-1', event_ar: 'بعد استيراد' },
      { date: '2026-10-26', as_of: '2026-10-26T14:20:00+08:00', treasury: 9, monthly: 5, daily: -3.38, total: 10.62, confidence: 'محسوب', source_row: 'X' },
    ],
    balance_history_omitted: [{ rows: '1-38', dates: 'a إلى b', reason_ar: 'سبب' }, { rows: '58', reason_ar: 'دمج' }, { foo: 1 }],
  } as unknown as Finance;
  it('parses date-only first point, negative balances, events, confidence, omitted ranges', () => {
    const r = parseBalanceHistory(fin);
    expect(r.points).toHaveLength(3);
    expect(r.points[0]).toMatchObject({ dateOnly: true, event: 'بداية', note: 'أقدم حالة', sourceRow: null, confidence: 'محسوب' });
    expect(r.points[1]).toMatchObject({ dateOnly: false, daily: -3.38, sourceRow: 'TNG-1' });
    expect(r.points.map((p) => p.t)).toEqual([...r.points.map((p) => p.t)].sort((a, b) => a - b));
    expect(r.omitted).toEqual([{ rows: '1-38', dates: 'a إلى b', reason: 'سبب' }, { rows: '58', dates: null, reason: 'دمج' }]);
    expect(r.title).toBe('تطور');
    expect(r.method).toBe('طريقة');
    expect(r.skipped).toBe(0);
  });
  it('missing inputs keep null as null and never fill values', () => {
    const m = missingInputs({ a: { value: null, unit: 'RM', note_ar: 'ن', confidence: 'غير مسجل', needed_for_ar: 'ل', related: 'R-1' }, b: { value: 5, unit: null, note_ar: 'x' }, c: 'bad' });
    expect(m).toHaveLength(2);
    expect(m[0]).toEqual({ key: 'a', label: null, value: null, unit: 'RM', note: 'ن', confidence: 'غير مسجل', needed_for: 'ل', related: 'R-1' });
    expect(countMissing(m)).toBe(1);
    expect(missingInputs(null)).toEqual([]);
    expect(missingInputs([1])).toEqual([]);
  });
});

describe('body, routine and commands helpers', () => {
  it('weight progress uses confirmed baseline, latest recorded reading and goal', () => {
    const p = weightProgress({ items: [{ key: 'weight', value: 84.3 }], goal_kg: 63, latest_recorded_weight: { value_kg: 83.65 } });
    expect(p).toMatchObject({ baseline: 84.3, latest: 83.65, goal: 63, lost: 0.65, remaining: 20.65 });
    expect(p!.pct).toBeCloseTo(3.05, 1);
    expect(weightProgress({ items: [], goal_kg: 63 })).toBeNull();
  });
  it('routine now/next in Kuala Lumpur time', () => {
    const r = { daily_blocks: [{ name: 'نوم', start: '00:00', end: '05:00', days: ['mon'] }, { name: 'غداء', start: '13:00', end: '14:00', days: ['mon'] }], weekly_study_blocks: [{ name: 'محاضرة', start: '08:00', end: '10:00', days: ['mon'] }] };
    expect(blocksForDay(r, 'mon').map((x) => x.b.name)).toEqual(['نوم', 'محاضرة', 'غداء']);
    const a = nowAndNext(r, Date.parse('2026-10-26T08:30:00+08:00'));
    expect(a.day).toBe('mon');
    expect(a.current.map((x) => x.b.name)).toEqual(['محاضرة']);
    expect(a.next?.b.name).toBe('غداء');
    expect(nowAndNext(r, Date.parse('2026-10-26T20:00:00+08:00')).next).toBeNull();
    expect(nowAndNext(r, Date.parse('2026-10-26T00:30:00+00:00')).day).toBe('mon'); // 08:30 KL
  });
  it('command ids and payload validation', () => {
    expect(validatePayload('log_expense', { date: '2026-10-26', amount: 9.29, currency: 'RM', box: 'daily', category_ar: 'طعام', label_ar: 'غداء', payment_source: 'tng' })).toEqual({});
    expect(Object.keys(validatePayload('log_expense', { date: 'x', amount: -1, currency: 'USD', box: 'q' }))).toEqual(expect.arrayContaining(['date', 'amount', 'currency', 'box', 'label_ar', 'category_ar', 'payment_source']));
    expect(validatePayload('log_prayer', { date: '2026-10-26', prayer: 'fajr', status: 'late', kind: 'qada' })).toEqual({});
    expect(validatePayload('log_prayer', { date: '2026-10-26', prayer: 'zuhr', status: 'late', kind: 'x' })).toHaveProperty('prayer');
    expect(validatePayload('log_weight', { date: '2026-10-26', weight_kg: 83.2 })).toEqual({});
    expect(validatePayload('log_weight', { date: '2026-10-26', weight_kg: 5 })).toHaveProperty('weight_kg');
    expect(validatePayload('log_habit', { habit: 'water', date: '2026-10-26', value: 2.5 })).toEqual({});
    expect(validatePayload('log_habit', { habit: 'water', date: '2026-10-26', value: 'x' })).toHaveProperty('value');
    expect(validatePayload('start_habit', { habit: 'vape', start_date: '2026-10-26', note_ar: 'x'.repeat(501) })).toHaveProperty('note_ar');
  });
  it('shape check catches wrong container types but accepts new fields', () => {
    expect(checkShape('finance', { recent_transactions: 'x' })).toMatch(/recent_transactions/);
    expect(checkShape('finance', { recent_transactions: [{ date: 'x' }] })).toMatch(/amount/);
    expect(checkShape('finance', { brand_new_field: 1, recent_transactions: [] })).toBeNull();
    expect(checkShape('habits', { habits: [{ key: 'a' }] })).toMatch(/name_ar/);
    expect(checkShape('body', [])).toMatch(/ليس كائن/);
  });
});

/* ───── API (التخزين الأصيل) ───── */
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
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe(`life native store (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('seeds once: all data files are available and consistent', async () => {
    const s = (await call('GET', '/api/life/status')).json;
    expect(s.files).toHaveLength(6);
    for (const f of s.files) {
      expect(f.error, f.name).toBeNull();
      expect(f.state, f.name).toBe('fresh');
    }
    expect(s.worst).toBe('fresh');
    const b = (await call('GET', '/api/life/bundle')).json;
    expect(b.files.prayers.qada.total_remaining).toBe(1926);
    expect(b.files.body.latest_weight_kg).toBe(83.65);
    expect(Object.keys(b.files)).toHaveLength(6);
  });
  it('serves static content with counts; unknown names 404; no path traversal', async () => {
    const ex = (await call('GET', '/api/life/content/SPORTS_EXERCISES.json')).json;
    expect(ex.data.exercises).toHaveLength(81);
    expect((await call('GET', '/api/life/content/GLOSSARY_AR.json')).json.data.entries).toHaveLength(69);
    expect((await call('GET', '/api/life/content/SPORTS_PLANS_AR.json')).json.data.templates).toHaveLength(6);
    expect((await call('GET', '/api/life/content/ledger_full.json')).json.data.rows).toHaveLength(67);
    expect((await call('GET', '/api/life/content/nope.json')).status).toBe(404);
    expect((await call('GET', '/api/life/content/..%2Fbody.json')).status).toBe(404);
    expect((await call('GET', '/api/life/data/secrets')).status).toBe(404);
  });
  it('no trace of the old persona in served data', async () => {
    const all = JSON.stringify((await call('GET', '/api/life/bundle')).json) + JSON.stringify((await call('GET', '/api/life/content/SPORTS_EXERCISES.json')).json) + JSON.stringify((await call('GET', '/api/life/content/GLOSSARY_AR.json')).json);
    expect(all).not.toMatch(new RegExp('\u0631\u0627\u0634\u062f|' + 'rash' + 'ed', 'i'));
  });
  it('validation: bad type / payload rejected with fields', async () => {
    expect((await call('POST', '/api/life/log', { type: 'delete_everything', payload: {} })).status).toBe(400);
    expect((await call('POST', '/api/life/log', { type: 'log_weight', payload: { date: 'x', weight_kg: 1 } })).json.fields).toHaveProperty('weight_kg');
    expect((await call('POST', '/api/life/log', { type: 'log_expense', payload: undefined })).status).toBe(400);
  });
  it('log_prayer fard missed adds to qada; undo restores exactly', async () => {
    const before = (await call('GET', '/api/life/data/prayers')).json.data.qada;
    const r = await call('POST', '/api/life/log', { type: 'log_prayer', payload: { date: '2026-10-30', prayer: 'fajr', status: 'missed', kind: 'fard' } });
    expect(r.status).toBe(201);
    const mid = (await call('GET', '/api/life/data/prayers')).json.data.qada;
    expect(mid.remaining.fajr.count).toBe(before.remaining.fajr.count + 1);
    expect(mid.total_remaining).toBe(before.total_remaining + 1);
    const u = await call('POST', `/api/life/events/${r.json.event.id}/undo`);
    expect(u.status).toBe(200);
    const after = (await call('GET', '/api/life/data/prayers')).json.data.qada;
    expect(after.total_remaining).toBe(before.total_remaining);
    expect((await call('POST', `/api/life/events/${r.json.event.id}/undo`)).status).toBe(409);
  });
  it('qada prayer decrements and counts done; only the latest event can be undone', async () => {
    const before = (await call('GET', '/api/life/data/prayers')).json.data.qada;
    const e1 = await call('POST', '/api/life/log', { type: 'log_prayer', payload: { date: '2026-10-31', prayer: 'asr', status: 'in_time', kind: 'qada' } });
    const e2 = await call('POST', '/api/life/log', { type: 'log_weight', payload: { date: '2026-10-31', weight_kg: 83.2 } });
    const q = (await call('GET', '/api/life/data/prayers')).json.data.qada;
    expect(q.remaining.asr.count).toBe(before.remaining.asr.count - 1);
    expect(q.done_total).toBe((before.done_total ?? 0) + 1);
    expect((await call('POST', `/api/life/events/${e1.json.event.id}/undo`)).status).toBe(409);
    expect((await call('POST', `/api/life/events/${e2.json.event.id}/undo`)).status).toBe(200);
    expect((await call('POST', `/api/life/events/${e1.json.event.id}/undo`)).status).toBe(200);
  });
  it('log_weight updates latest and goal progress; log_expense updates account and ledger', async () => {
    const w = await call('POST', '/api/life/log', { type: 'log_weight', payload: { date: '2026-10-31', weight_kg: 82.9 } });
    const body = (await call('GET', '/api/life/data/body')).json.data;
    expect(body.latest_weight_kg).toBe(82.9);
    expect(body.goal_progress.remaining_to_goal_kg).toBe(19.9);
    await call('POST', `/api/life/events/${w.json.event.id}/undo`);
    const fin0 = (await call('GET', '/api/life/data/finance')).json.data;
    const tng0 = fin0.accounts.find((a: any) => a.key === 'tng').amount;
    const rows0 = (await call('GET', '/api/life/content/ledger_full.json')).json.data.rows.length;
    const ex = await call('POST', '/api/life/log', { type: 'log_expense', payload: { date: '2026-10-31', amount: 5, currency: 'RM', box: 'daily', label_ar: 'قهوة', category_ar: 'طعام', payment_source: 'tng' } });
    expect(ex.status).toBe(201);
    const fin1 = (await call('GET', '/api/life/data/finance')).json.data;
    expect(fin1.accounts.find((a: any) => a.key === 'tng').amount).toBe(Math.round((tng0 - 5) * 100) / 100);
    expect((await call('GET', '/api/life/content/ledger_full.json')).json.data.rows.length).toBe(rows0 + 1);
    expect(fin1.recent_transactions.at(-1).label_ar).toBe('قهوة');
    await call('POST', `/api/life/events/${ex.json.event.id}/undo`);
    expect((await call('GET', '/api/life/content/ledger_full.json')).json.data.rows.length).toBe(rows0);
  });
  it('expense with unknown box is recorded but not applied to any balance', async () => {
    const fin0 = (await call('GET', '/api/life/data/finance')).json.data;
    const ex = await call('POST', '/api/life/log', { type: 'log_expense', payload: { date: '2026-10-31', amount: 7, currency: 'RM', box: 'unknown', label_ar: 'غداء', category_ar: 'طعام', payment_source: 'unknown' } });
    const fin1 = (await call('GET', '/api/life/data/finance')).json.data;
    expect(fin1.accounts).toEqual(fin0.accounts);
    await call('POST', `/api/life/events/${ex.json.event.id}/undo`);
  });
  it('habits: log, start and relapse write to the habit log', async () => {
    const h = await call('POST', '/api/life/log', { type: 'log_habit', payload: { habit: 'water', date: '2026-10-31', value: 2.5 } });
    expect(h.status).toBe(201);
    const water = (await call('GET', '/api/life/data/habits')).json.data.habits.find((x: any) => x.key === 'water');
    expect(water.log.find((l: any) => l.date === '2026-10-31').water_l).toBe(2.5);
    await call('POST', `/api/life/events/${h.json.event.id}/undo`);
    expect((await call('POST', '/api/life/log', { type: 'habit_relapse', payload: { habit: 'vape', date: '2026-10-31' } })).status).toBe(201);
    const ev = (await call('GET', '/api/life/events')).json.events;
    expect(ev[0].type).toBe('habit_relapse');
    await call('POST', `/api/life/events/${ev[0].id}/undo`);
  });
  it('qada scenario choice persists locally', async () => {
    expect((await call('PUT', '/api/life/qada-choice', { scenario: 'x1' })).json.scenario).toBe('x1');
    expect((await call('PUT', '/api/life/qada-choice', { scenario: 'Bad Id!' })).status).toBe(400);
  });
});
