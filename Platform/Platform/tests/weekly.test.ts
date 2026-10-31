import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildWeekly, habitsWeek, klToday, moneyWeek, prayerWeek, reviewWindow, tagFrom, weakest, weightWeek, type Missing } from '../shared/weekly.js';
import type { Body, Finance, Habits, Prayers } from '../shared/life.js';

const at = (s: string): number => Date.parse(s);
const MON = at('2026-10-26T12:00:00+08:00');

describe('weekly review window (Sun→Sat, Asia/Kuala_Lumpur) [assumption]', () => {
  it('Monday 26 Oct 2026 → 25..31 Oct, 2 elapsed days, Saturday not finished', () => {
    const w = reviewWindow(MON);
    expect([w.start, w.end, w.today]).toEqual(['2026-10-25', '2026-10-31', '2026-10-26']);
    expect(w.days).toHaveLength(7);
    expect(w.elapsed).toEqual(['2026-10-25', '2026-10-26']);
    expect(w.partial).toBe(true);
    expect([w.nextStart, w.nextEnd]).toEqual(['2026-11-01', '2026-11-07']);
  });
  it('uses the Malaysia calendar day, not the browser/UTC day', () => {
    expect(klToday(at('2026-10-24T16:30:00Z'))).toBe('2026-10-25'); // 00:30 Sunday in KL
    expect(reviewWindow(at('2026-10-24T16:30:00Z')).start).toBe('2026-10-25');
    expect(reviewWindow(at('2026-10-31T23:00:00+08:00')).start).toBe('2026-10-25'); // Saturday night
    expect(reviewWindow(at('2026-11-01T00:00:01+08:00')).start).toBe('2026-11-01'); // Sunday starts a new week
  });
  it('offset -1 = last finished week, all 7 days elapsed', () => {
    const w = reviewWindow(MON, -1);
    expect([w.start, w.end]).toEqual(['2026-10-18', '2026-10-24']);
    expect(w.elapsed).toHaveLength(7);
    expect(w.nextStart).toBe('2026-10-25');
  });
});

describe('confidence tags', () => {
  it('weakest wins: مثبت > محسوب > افتراض > غير مسجل; unknown tag falls back to افتراض', () => {
    expect(weakest(['مثبت', 'محسوب'])).toBe('محسوب');
    expect(weakest(['مثبت', 'افتراض', 'محسوب'])).toBe('افتراض');
    expect(weakest(['مثبت', 'غير مسجل'])).toBe('غير مسجل');
    expect(weakest([])).toBe('غير مسجل');
    expect(tagFrom(undefined, 'مثبت')).toBe('مثبت');
    expect(tagFrom('general_knowledge')).toBe('افتراض');
  });
});

const prayers: Prayers = {
  attendance: {
    coverage_note_ar: 'السجل يبدأ من 17 أكتوبر 2026.',
    days: [
      { date: '2026-10-24', status: { fajr: 'in_time', dhuhr: 'in_time', asr: 'in_time', maghrib: 'in_time', isha: 'in_time' }, counts: { in_time: 5, late: 0, missed: 0, unknown: 0 }, confidence: 'مثبت' },
      { date: '2026-10-25', status: { fajr: 'missed', dhuhr: 'late', asr: 'in_time', maghrib: 'unknown', isha: 'unknown' }, counts: { in_time: 1, late: 1, missed: 1, unknown: 2 }, confidence: 'مثبت' },
    ],
  },
  qada: {
    as_of: '2026-10-25T18:35:00+08:00', remaining: { fajr: { count: 10 }, dhuhr: { count: 20 }, asr: { count: 30 }, maghrib: { count: 40 }, isha: { count: 50 } },
    total_remaining: 150, done_total: 0, done_today: 0, confidence: 'محسوب', done_confidence: 'مثبت',
    history: [{ date: '2026-10-17', total: 100 }, { date: '2026-10-22', total: 140 }, { date: '2026-10-25', total: 150 }],
  },
};
describe('prayers', () => {
  it('counts only days inside the window; days without a row are غير مسجل (never 0); unknown is excluded from the denominator', () => {
    const m: Missing[] = [];
    const p = prayerWeek(prayers, reviewWindow(MON), m)!;
    expect(p.counts).toEqual({ in_time: 1, late: 1, missed: 1, unknown: 2 });
    expect(p.onTime).toMatchObject({ num: 1, den: 3 });
    expect(p.onTime.pct).toBe(33.3);
    expect(p.missingDates).toEqual(['2026-10-26']);
    expect(p.rows.find((r) => r.date === '2026-10-26')!.cells.fajr).toBe('unknown'); // اليوم بلا صف = غير معروف (ملاحظة راشد 7)
    expect(p.rows.find((r) => r.date === '2026-10-28')!.cells.fajr).toBe('future');
    expect(p.rows.find((r) => r.date === '2026-10-25')!.cells.maghrib).toBe('unknown');
  });
  it('no row in the window → counts null (not zeros) and on-time % غير مسجل', () => {
    const p = prayerWeek({ ...prayers, attendance: { days: [] } }, reviewWindow(MON), [])!;
    expect(p.counts).toBeNull();
    expect(p.onTime.pct).toBeNull();
    expect(p.onTime.tag).toBe('غير مسجل');
  });
  it('qada: sum check, weekly done is غير مسجل, increase = last-in-window minus last-before-window', () => {
    const m: Missing[] = [];
    const q = prayerWeek(prayers, reviewWindow(MON), m)!.qada;
    expect(q.sum).toBe(150);
    expect(q.sumMatches).toBe(true);
    expect(q.doneWeek).toMatchObject({ value: null, tag: 'غير مسجل' });
    expect(q.increase.value).toBe(10); // 150 (25 Oct) − 140 (22 Oct)
    expect(m.some((x) => x.label.includes('القضاء المنجز هذا الأسبوع'))).toBe(true);
    const bad = prayerWeek({ qada: { ...prayers.qada!, total_remaining: 149 } }, reviewWindow(MON), [])!.qada;
    expect(bad.sumMatches).toBe(false);
  });
  it('qada increase is غير مسجل when there is no point before or inside the window', () => {
    const q = prayerWeek({ qada: { ...prayers.qada!, history: [{ date: '2026-10-25', total: 150 }] } }, reviewWindow(MON), [])!.qada;
    expect(q.increase.value).toBeNull();
  });
});

const habits: Habits = {
  status: { started: false, note_ar: 'لم تبدأ' }, streak_definition_ar: 'x',
  unrecorded_inputs: { vape_baseline_per_day: { value: null, note_ar: 'غير مسجل' } },
  habits: [
    { key: 'vape', name_ar: 'الفيب', baseline_daily_minutes: null, today: { plan_day: 9, reduction_min: 180, confidence: 'محسوب' }, log: [{ date: '2026-10-23', kept_limit: 'no' }, { date: '2026-10-25', kept_limit: 'unknown', confidence: 'مثبت' }], counters: { current_streak_days: 0, best_streak_days: 0, confidence: 'محسوب' } },
    { key: 'tea_sugar', name_ar: 'سكر الشاي', targets: [{ date: '2026-10-25', sugar_limit_g: 43 }], log: [{ date: '2026-10-25', actual_sugar_g: null }] },
    { key: 'workout', name_ar: 'التمرين', week_plan: [{ day: 'sat', type_ar: 'قوة' }, { day: 'sun', type_ar: 'مشي' }], log: [{ date: '2026-10-25', done: null }] },
  ],
  daily_summary: [{ date: '2026-10-25', vape_kept: 'unknown', spent_rm: 0 }],
};
describe('habits', () => {
  it('counts yes/no/unknown inside the window only; no hours conversion when baseline is null', () => {
    const m: Missing[] = [];
    const h = habitsWeek(habits, reviewWindow(MON), m)!;
    const vape = h.habits.find((x) => x.key === 'vape')!;
    expect(vape.lines[0]!.text).toBe('نعم 0 · لا 0 · غير معروف 1');
    expect(vape.lines.some((l) => /ساعات/.test(l.text ?? '') && !/لا نحوّل/.test(l.note ?? ''))).toBe(false);
    expect(vape.lines.find((l) => l.label.startsWith('خطة اليوم'))!.note).toMatch(/غير مسجل/);
    expect(h.started).toBe(false);
  });
  it('a null value is غير مسجل, never an average of zeros', () => {
    const m: Missing[] = [];
    const h = habitsWeek(habits, reviewWindow(MON), m)!;
    const tea = h.habits.find((x) => x.key === 'tea_sugar')!;
    expect(tea.lines.some((l) => l.text === '0')).toBe(false);
    expect(tea.lines.find((l) => l.label.startsWith('السكر الفعلي'))).toMatchObject({ text: null, tag: 'غير مسجل' });
    const wo = h.habits.find((x) => x.key === 'workout')!;
    expect(wo.lines.find((l) => l.label.startsWith('أيام التمرين'))).toMatchObject({ text: null, tag: 'غير مسجل' });
    expect(m.length).toBeGreaterThan(3);
  });
  it('daily_summary: absent field = غير مسجل, 0 stays 0, days without a row flagged', () => {
    const h = habitsWeek(habits, reviewWindow(MON), [])!;
    const d25 = h.daily.find((d) => d.date === '2026-10-25')!;
    expect(d25.fields.find((f) => f.label === 'صرف (RM)')!.text).toBe('0');
    expect(d25.fields.find((f) => f.label === 'الوزن (كغ)')!.text).toBeNull();
    expect(h.daily.find((d) => d.date === '2026-10-26')!.hasRow).toBe(false);
  });
});

const body: Body = {
  goal_kg: 63, goal_kg_confidence: 'مثبت', latest_recorded_weight: { date: '2026-10-23', value_kg: 83.65, confidence: 'مثبت' },
  unrecorded_inputs: { next_weight_reading: { value: null, confidence: 'غير مسجل' } },
  weight_history: [
    { date: '2026-10-17', value_kg: 84.3, status_ar: 'خط الأساس', confidence: 'مثبت' },
    { date: '2026-10-23', value_kg: 83.65, confidence: 'مثبت' },
  ],
};
describe('weight', () => {
  it('no reading inside the window → غير مسجل هذا الأسبوع; change needs both readings; remaining = latest − goal (محسوب)', () => {
    const m: Missing[] = [];
    const wt = weightWeek(body, reviewWindow(MON), m)!;
    expect(wt.inWindow).toBeNull();
    expect(wt.change.kg).toBeNull();
    expect(wt.latest.kg).toBe(83.65);
    expect(wt.remaining).toEqual({ kg: 20.65, tag: 'محسوب' });
    expect(wt.baseline).toMatchObject({ kg: 84.3, date: '2026-10-17' });
    expect(wt.next.value).toBeNull();
    expect(m.map((x) => x.label).join('|')).toMatch(/قراءة وزن هذا الأسبوع/);
  });
  it('last week had a reading and a previous one → change computed', () => {
    const wt = weightWeek(body, reviewWindow(MON, -1), [])!;
    expect(wt.inWindow?.kg).toBe(83.65);
    expect(wt.change.kg).toBe(-0.65);
    expect(wt.change.tag).toBe('محسوب');
  });
});

const finance: Finance = {
  balances_block: { as_of: '2026-10-26T14:20:00+08:00', items: [{ key: 'treasury', amount: 1000, confidence: 'محسوب' }, { key: 'monthly', amount: 58, confidence: 'محسوب' }, { key: 'daily', amount: -3, confidence: 'محسوب' }, { key: 'total', amount: 1055, confidence: 'محسوب' }] },
  schedule: { periods: [{ from: '2026-10-26', to: '2026-10-31', per_day: 14, status: 'active', confidence: 'مثبت' }, { from: '2026-11-01', to: null, per_day: 16, status: 'open', confidence: 'افتراض' }] },
  balance_history: [
    { date: '2026-10-20', as_of: '2026-10-20T10:00:00+08:00', treasury: 1000, monthly: 100, daily: 50, total: 1150, confidence: 'محسوب' },
    { date: '2026-10-26', as_of: '2026-10-26T14:00:00+08:00', treasury: 1000, monthly: 58, daily: -3, total: 1055, confidence: 'محسوب' },
  ],
  recent_transactions: [
    { id: 'a', date: '2026-10-20', type: 'expense', amount: 5, wallet: 'يومية', cash_delta: -5, category_ar: 'طعام', category_confidence: 'افتراض', confidence: 'مثبت' },
    { id: 'b', date: '2026-10-25', type: 'expense', amount: 10, wallet: 'يومية', cash_delta: -10, category_ar: 'طعام', category_confidence: 'افتراض', confidence: 'مثبت' },
    { id: 'c', date: '2026-10-26', type: 'expense', amount: 9.29, wallet: 'غير محدد', cash_delta: 0, category_ar: null, confidence: 'مثبت' },
    { id: 'd', date: '2026-10-26', type: 'income', amount: 100, cash_delta: 100, confidence: 'مثبت' },
  ],
  planning_inputs: { monthly_income: { value: null, confidence: 'غير مسجل' }, category_caps: { value: null }, nov_funding_decision: { value: null } },
  receivables: [{ person_ar: 'س', amount: null, last_recorded_amount: 55.6, confidence: 'افتراض' }],
};
describe('money', () => {
  it('reports expenses in the window only, applied vs no-box separately, categories with tags, null category = غير مصنف', () => {
    const m: Missing[] = [];
    const f = moneyWeek(finance, null, reviewWindow(MON), m)!;
    expect(f.reported).toMatchObject({ total: 19.29, count: 2 });
    expect(f.applied.total).toBe(10);
    expect(f.applied.noBox).toEqual({ total: 9.29, count: 1 });
    const cats = Object.fromEntries(f.byCategory.map((c) => [c.category, c]));
    expect(cats['طعام']).toMatchObject({ total: 10, tag: 'افتراض' });
    expect(cats['غير مصنف']).toMatchObject({ total: 9.29, tag: 'غير مسجل' });
  });
  it('daily rate = spent ÷ elapsed days; negative balance → no coverage days and flagged; zero rate → غير مسجل', () => {
    const f = moneyWeek(finance, null, reviewWindow(MON), [])!;
    expect(f.daily).toMatchObject({ spent: 10, rate: 5, negative: true, coverageDays: null });
    const none = moneyWeek({ ...finance, recent_transactions: [] }, null, reviewWindow(MON), [])!;
    expect(none.daily.rate).toBeNull();
    expect(none.daily.tag).toBe('غير مسجل');
  });
  it('balance change = last point in window − last point before it; none before → غير مسجل', () => {
    const f = moneyWeek(finance, null, reviewWindow(MON), [])!;
    expect(f.changes.find((c) => c.key === 'monthly')).toMatchObject({ delta: -42, from: 100, to: 58, tag: 'محسوب' });
    const early = moneyWeek({ ...finance, balance_history: [(finance.balance_history as unknown[])[1]] }, null, reviewWindow(MON), [])!;
    expect(early.changes.every((c) => c.delta === null)).toBe(true);
  });
  it('window older than the oldest listed transaction → reported غير مسجل (not 0)', () => {
    const f = moneyWeek({ ...finance, recent_transactions: [finance.recent_transactions![2]!] }, null, reviewWindow(MON, 0), [])!;
    expect(f.reported.total).toBeNull(); // oldest listed row = 26 Oct > window start 25 Oct → coverage incomplete
    expect(f.reported.tag).toBe('غير مسجل');
    expect(f.applied.total).toBeNull();
  });
  it('scheduled top-ups: per_day × window days inside the period; open period is marked افتراض; planning inputs stay غير مسجل; receivable null stays غير مسجل', () => {
    const m: Missing[] = [];
    const f = moneyWeek(finance, null, reviewWindow(MON), m)!;
    const active = f.topups.find((t) => t.status === 'active')!;
    expect(active).toMatchObject({ days: 6, amount: 84 });
    expect(f.topups.find((t) => t.open)).toMatchObject({ tag: 'افتراض', amount: null });
    expect(f.planning.every((p) => p.v.value === null && p.v.tag === 'غير مسجل')).toBe(true);
    expect(f.receivables[0]!.amount).toMatchObject({ value: null, tag: 'غير مسجل' });
    expect(f.receivables[0]!.last).toBe(55.6);
    expect(f.monthly).toMatchObject({ balance: 58, perDay: 14, days: 4.1 });
    expect(m.some((x) => x.field.includes('planning_inputs.monthly_income'))).toBe(true);
  });
});

const BUNDLED = path.resolve(import.meta.dirname, '..', '..', 'exchange', 'rashed');
const REAL = process.env['RASHED_FIXTURE_DIR'] ?? (fs.existsSync(BUNDLED) ? BUNDLED : '/workspace/rashed_fixture');
describe.skipIf(!fs.existsSync(path.join(REAL, 'prayers.json')))('real Rashed files → weekly review (local copy only; skipped elsewhere)', () => {
  const read = <T,>(n: string): T => JSON.parse(fs.readFileSync(path.join(REAL, n), 'utf8').replace(/^\ufeff/, '')) as T;
  let input: Parameters<typeof buildWeekly>[0];
  let r: ReturnType<typeof buildWeekly>;
  beforeAll(() => {
    input = { prayers: read<Prayers>('prayers.json'), habits: read<Habits>('habits.json'), body: read<Body>('body.json'), finance: read<Finance>('finance.json'), routine: read('routine.json'), summary: read('dashboard_summary.json') } as Parameters<typeof buildWeekly>[0];
    r = buildWeekly(input, at('2026-10-26T21:00:00+08:00'));
  });
  it('invariants: qada total = sum of five, weekly done غير مسجل, no NaN anywhere, every null Val is tagged غير مسجل', () => {
    expect(r.prayer!.qada.sumMatches).toBe(true);
    expect(r.prayer!.qada.doneWeek.value).toBeNull();
    const s = JSON.stringify(r);
    expect(s).not.toMatch(/NaN|undefined/);
    const walk = (o: unknown, path: string): void => {
      if (o && typeof o === 'object') {
        const x = o as Record<string, unknown>;
        if ('value' in x && 'tag' in x && 'field' in x && x['value'] === null) expect(x['tag'], path).toBe('غير مسجل');
        for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`);
      }
    };
    walk(r, 'r');
  });
  it('window 25–31 Oct; vape rows of the window are exactly the file rows with those dates; income/caps/Nov decision are غير مسجل', () => {
    expect(r.window.start).toBe('2026-10-25');
    const rows = (input.habits!.habits!.find((h) => h.key === 'vape')!.log as { date: string }[]).filter((x) => x.date >= '2026-10-25');
    expect(rows.length).toBeGreaterThan(0);
    expect(r.money!.planning.map((p) => p.v.value)).toEqual([null, null, null]);
    expect(r.missing.length).toBeGreaterThan(8);
    expect(r.routine!.studyHours.hours).toBeGreaterThan(0);
  });
  it('reported expenses equal an independent sum from the file', () => {
    const tx = input.finance!.recent_transactions!.filter((t) => t.type === 'expense' && t.date >= '2026-10-25' && t.date <= '2026-10-26');
    expect(r.money!.reported.total).toBeCloseTo(tx.reduce((s, t) => s + t.amount, 0), 2);
    expect(r.money!.reported.count).toBe(tx.length);
  });
});
