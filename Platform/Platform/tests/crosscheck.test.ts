import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ageText, classifyFreshness, kgText, missingInputs, weightProgress, type Body, type Prayers } from '../shared/life.js';
import { missingTitle, plainDeep, plainText, UNIT_AR } from '../shared/plain.js';
import { EMPTY_LEDGER_FILTER, checkInsights, checkLedger, checkQadaPlan, checkRoutineBlocks, expenseSum, filterLedger, ledgerSpendByDay, overlapPairs, placeDay, sortLedger, type InsightsDoc, type LedgerDoc, type RoutineBlocksDoc } from '../shared/v8.js';
import { fieldLabel, fieldPathAr, checkFieldLabels } from '../shared/v8.js';
import { indicatorView } from '../shared/insights.js';
import { prayerWeek, reviewWindow, type Missing } from '../shared/weekly.js';

const at = (s: string): number => Date.parse(s);

describe('cross-check #1: weight is exact (83.65 / 20.65 / 0.65), never rounded to 1 decimal', () => {
  it('kgText keeps up to 2 decimals', () => {
    expect(kgText(83.65)).toBe('83.65');
    expect(kgText(20.650000000000006)).toBe('20.65');
    expect(kgText(0.65)).toBe('0.65');
    expect(kgText(63)).toBe('63');
    expect(kgText(null)).toBe('—');
  });
  it('weightProgress uses the LATEST reading, not the older 83.7/84.3 rows', () => {
    const b: Body = { goal_kg: 63, items: [{ key: 'weight', value: 84.3 } as never], latest_recorded_weight: { date: '2026-10-23', value_kg: 83.65 } };
    const p = weightProgress(b)!;
    expect([p.latest, p.remaining, p.lost]).toEqual([83.65, 20.65, 0.65]);
  });
});

describe('v9: goal_progress is used verbatim; baseline change and remaining-to-goal never mix', () => {
  const b: Body = { goal_kg: 63, latest_weight_kg: 83.65, latest_weight_date: '2026-10-23', items: [], goal_progress: { goal_kg: 63, latest_weight_kg: 83.65, remaining_to_goal_kg: 20.65, baseline_kg: 84.3, change_since_baseline_kg: -0.65 } };
  it('remaining 20.65 and change −0.65 (lost 0.65) come from the goal_progress fields', () => {
    const p = weightProgress(b)!;
    expect([p.baseline, p.latest, p.remaining, p.lost]).toEqual([84.3, 83.65, 20.65, 0.65]);
    expect(p.remaining).not.toBe(p.lost);
  });
  it('field labels give Arabic names and null (never the English key) when unknown', () => {
    const doc = { labels: { accounts: { label_ar: 'الحسابات' } }, missing_data_cards: [{ key: 'monthly_income', label_ar: 'الدخل الشهري' }] };
    expect(checkFieldLabels(doc)).toBeNull();
    expect(checkFieldLabels({ labels: { a: {} } })).not.toBeNull();
    expect(fieldLabel(doc, 'monthly_income')).toBe('الدخل الشهري');
    expect(fieldLabel(doc, 'accounts')).toBe('الحسابات');
    expect(fieldLabel(doc, 'zzz')).toBeNull();
    expect(fieldLabel(null, 'accounts')).toBeNull();
  });
});

describe('cross-check #5: freshness never says «الآن» unless truly recent', () => {
  const now = at('2026-10-26T22:00:00+08:00');
  it('a day-old file is not «الآن»; ageText only says الآن under 2 minutes', () => {
    const r = classifyFreshness({ nowMs: now, generatedAt: '2026-10-25T18:35:00+08:00', staleAfterHours: 24, bytesMeta: 10, bytesActual: 10 });
    expect(ageText(r.ageHours)).toBe('قبل 27 ساعة');
    expect(ageText(0.01)).toBe('الآن');
    expect(ageText(0.05)).toBe('قبل 3 دقيقة');
  });
  it('a future generated_at is inconsistent (no age), not «الآن»', () => {
    const r = classifyFreshness({ nowMs: now, generatedAt: '2026-10-27T10:00:00+08:00', staleAfterHours: 24, bytesMeta: 10, bytesActual: 10 });
    expect(r.state).toBe('inconsistent');
    expect(r.ageHours).toBeNull();
  });
  it('a timestamp without zone is read as Malaysia time, not the machine zone', () => {
    const a = classifyFreshness({ nowMs: at('2026-10-26T12:00:00+08:00'), generatedAt: '2026-10-26T11:00:00', staleAfterHours: 24, bytesMeta: 1, bytesActual: 1 });
    expect(Math.round(a.ageHours! * 10) / 10).toBe(1);
  });
});

describe('cross-check #7: today in the prayer table is unknown, and done_today of another day is not today', () => {
  const p = {
    attendance: { days: [{ date: '2026-10-25', status: { fajr: 'in_time', dhuhr: 'in_time', asr: 'in_time', maghrib: 'unknown', isha: 'unknown' }, confidence: 'مثبت' }] },
    qada: { as_of: '2026-10-25T18:35:00+08:00', done_today: 0, done_confidence: 'مثبت', done_total: 0, total_remaining: 10, remaining: {}, history: [] },
  } as unknown as Prayers;
  it('26 Oct has a row with all five prayers «unknown» (not «غير مسجل»/0)', () => {
    const w = reviewWindow(at('2026-10-26T12:00:00+08:00'));
    const r = prayerWeek(p, w, [] as Missing[])!;
    const today = r.rows.find((x) => x.date === '2026-10-26')!;
    expect(Object.values(today.cells)).toEqual(['unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
    expect(r.rows.find((x) => x.date === '2026-10-27')!.cells.fajr).toBe('future');
  });
  it('done_today written for 25 Oct is shown as unknown for 26 Oct with the old value kept aside', () => {
    const r = prayerWeek(p, reviewWindow(at('2026-10-26T12:00:00+08:00')), [] as Missing[])!;
    expect(r.qada.doneToday.value).toBeNull();
    expect(r.qada.doneTodayStale).toEqual({ value: 0, date: '2026-10-25' });
    const same = prayerWeek(p, reviewWindow(at('2026-10-25T20:00:00+08:00')), [] as Missing[])!;
    expect(same.qada.doneToday.value).toBe(0);
    expect(same.qada.doneTodayStale).toBeNull();
  });
});

describe('cross-check #8: internal codes are hidden or explained', () => {
  it('plainText removes R-/D-R-/RC- codes and explains file/field names', () => {
    expect(plainText('تتبع الصلاة أعلى أولوية (R-020).')).toBe('تتبع الصلاة أعلى أولوية.');
    expect(plainText('أكد محمد (القرار D-R-019) الوزن')).toBe('أكد محمد الوزن');
    expect(plainText('انظر RC-004 للتعارض')).toBe('انظر تعارض مسجّل للتعارض');
    expect(plainText('من CURRENT.md ومن LEDGER.csv')).toBe('من ملف الحالة ومن السجل المالي');
    expect(plainText('STATE/BODY_GOALS.md')).toBe('ملف أهداف الجسم');
    expect(plainText('cash_delta أقل من صفر و beginner_safe=false')).toBe('الأثر على الصندوق أقل من صفر و ليس للمبتدئ');
    expect(plainText('docs\\SPORTS_PLANS_AR.json')).toContain('SPORTS_PLANS_AR.json');
    expect(plainText('نص عربي عادي 83.65')).toBe('نص عربي عادي 83.65');
  });
  it('plainDeep cleans display strings but leaves ids and dates alone', () => {
    const o = plainDeep({ id: 'R-020', event_id: 'TNG-1', note_ar: 'حسب (R-020) و CURRENT.md', rows: [{ date: '2026-10-26', notes: 'LEDGER.csv' }] });
    expect(o).toEqual({ id: 'R-020', event_id: 'TNG-1', note_ar: 'حسب و ملف الحالة', rows: [{ date: '2026-10-26', notes: 'السجل المالي' }] });
  });
  it('missing-data cards get Arabic titles from the key map or note_ar, never the raw key', () => {
    expect(missingTitle('monthly_income', 'x')).toBe('الدخل الشهري');
    expect(missingTitle('some_new_key', 'وقت الفيب الأساسي في اليوم بالدقائق: لم يُسجل.')).toBe('وقت الفيب الأساسي في اليوم بالدقائق');
    expect(missingTitle('k', 'جملة بلا نقطتين فقط.')).toBe('جملة بلا نقطتين فقط');
    expect(missingTitle('k', '')).toBe('حقل غير مسمّى');
    expect(missingTitle('k', 'x', 'عنوان صريح')).toBe('عنوان صريح');
    expect(UNIT_AR['kg']).toBe('كغ');
    const items = missingInputs({ a: { value: null, note_ar: 'ن', label_ar: 'تسمية' } });
    expect(items[0]!.label).toBe('تسمية');
  });
});

const LED: LedgerDoc = { total_rows: 4, rows: [
  { order: 1, event_id: 'A', date: '2026-10-08', type: 'expense', amount: 100, wallet: 'يومية', cash_delta: -100, notes: 'غداء' },
  { order: 2, event_id: 'B', date: '2026-10-08', type: 'expense', amount: 35.9, wallet: 'غير محدد', cash_delta: 0, notes: 'أداة', text_redacted: true },
  { order: 3, event_id: 'C', date: '2026-10-13', type: 'expense', amount: 24.53, wallet: 'يومية', cash_delta: -24.53 },
  { order: 4, event_id: 'D', date: '2026-10-14', type: 'transfer', amount: 14, wallet: 'خزينة', cash_delta: 0 },
] };
describe('ledger table helpers (read-only)', () => {
  it('filters by text/type/wallet/date/flags and sorts', () => {
    expect(filterLedger(LED.rows, { ...EMPTY_LEDGER_FILTER, q: 'غداء' }).map((r) => r.event_id)).toEqual(['A']);
    expect(filterLedger(LED.rows, { ...EMPTY_LEDGER_FILTER, type: 'transfer' }).map((r) => r.event_id)).toEqual(['D']);
    expect(filterLedger(LED.rows, { ...EMPTY_LEDGER_FILTER, from: '2026-10-13' }).map((r) => r.event_id)).toEqual(['C', 'D']);
    expect(filterLedger(LED.rows, { ...EMPTY_LEDGER_FILTER, noBoxOnly: true }).map((r) => r.event_id)).toEqual(['B']);
    expect(filterLedger(LED.rows, { ...EMPTY_LEDGER_FILTER, redactedOnly: true }).map((r) => r.event_id)).toEqual(['B']);
    expect(sortLedger(LED.rows, 'amount', 'desc').map((r) => r.event_id)).toEqual(['A', 'B', 'C', 'D']);
    expect(LED.rows.length).toBe(4); // الأصل لا يتغيّر
    expect(expenseSum(LED.rows)).toEqual({ total: 160.43, count: 3 });
  });
  it('daily spend uses expense rows only and applies the recorded adjustment (no double count)', () => {
    const d = ledgerSpendByDay(LED.rows, [{ row_id: 'C', recorded_amount: 24.53, counted_amount: 10 }]);
    expect(d).toEqual([{ date: '2026-10-08', total: 135.9 }, { date: '2026-10-13', total: 10 }]);
    expect(ledgerSpendByDay(LED.rows).find((x) => x.date === '2026-10-13')!.total).toBe(24.53);
  });
  it('validators reject malformed files', () => {
    expect(checkLedger({ rows: 'x' })).not.toBeNull();
    expect(checkLedger(LED)).toBeNull();
    expect(checkRoutineBlocks({ blocks: [{ id: 'x' }], days: [] })).not.toBeNull();
    expect(checkInsights({ indicators: [{ id: 'a' }] })).not.toBeNull();
    expect(checkQadaPlan({ scenarios: [{}] })).not.toBeNull();
  });
});

describe('routine map helpers', () => {
  const doc = { blocks: [
    { id: 'F', day: 'mon', start_min: 360, end_min: 780, type: 'free', overlaps_with: ['L'] },
    { id: 'L', day: 'mon', start_min: 480, end_min: 600, type: 'lecture', overlaps_with: ['F'] },
    { id: 'P', day: 'mon', start_min: 500, end_min: 520, type: 'prayer', overlaps_with: [] },
  ] } as unknown as RoutineBlocksDoc;
  it('pairs come only from overlaps_with (each pair once); lanes never stack two overlapping blocks', () => {
    expect(overlapPairs(doc.blocks).map((p) => [p.a.id, p.b.id])).toEqual([['F', 'L']]);
    const { free, placed, lanes } = placeDay(doc.blocks);
    expect(free.map((x) => x.id)).toEqual(['F']);
    expect(lanes).toBe(2);
    expect(placed.find((x) => x.b.id === 'L')!.overlapped).toBe(true);
    expect(placed.find((x) => x.b.id === 'P')!.lane).not.toBe(placed.find((x) => x.b.id === 'L')!.lane);
  });
});

describe('insights: ready values only', () => {
  it('shows value_text_ar when a value exists, else the missing text; never computes', () => {
    expect(indicatorView({ id: 'a', name_ar: 'x', current_value: 18.7, value_text_ar: 'حوالي 18.70', confidence: 'محسوب' })).toMatchObject({ text: 'حوالي 18.70', tag: 'محسوب' });
    expect(indicatorView({ id: 'b', name_ar: 'x', current_value: null, value_text_ar: null, missing_text_ar: 'غير مسجل: لا بيانات' })).toMatchObject({ text: null, tag: 'غير مسجل', missing: 'غير مسجل: لا بيانات' });
  });
});

const SEED = path.resolve(import.meta.dirname, '..', 'seed');
const seedFile = (n: string): string => (n.startsWith('docs/') ? path.join(SEED, 'content', n.slice(5)) : path.join(SEED, 'life', n));
describe('bundled life data (v8)', () => {
  const read = <T,>(n: string): T => JSON.parse(fs.readFileSync(seedFile(n), 'utf8').replace(/^\ufeff/, '')) as T;
  it('ledger_full has all 67 rows and passes the validator', () => {
    const l = read<LedgerDoc>('ledger_full.json');
    expect(l.total_rows).toBe(67);
    expect(l.rows).toHaveLength(67);
    expect(checkLedger(l)).toBeNull();
  });
  it('daily spend chart: 8 Oct 335.90, 9 Oct 212.95, 13 Oct 10.00', () => {
    const l = read<LedgerDoc>('ledger_full.json');
    const i = read<InsightsDoc>('docs/FINANCE_INSIGHTS_AR.json');
    const d = new Map(ledgerSpendByDay(l.rows, i.spend_adjustments).map((x) => [x.date, x.total]));
    expect(d.get('2026-10-08')).toBe(335.9);
    expect(d.get('2026-10-09')).toBe(212.95);
    expect(d.get('2026-10-13')).toBe(10);
  });
  it('v9 body goal_progress + finance daily_box_rate are present and consistent with insights', () => {
    const b = read<Body>('body.json');
    expect(b.latest_weight_kg).toBe(83.65);
    expect(b.goal_progress?.remaining_to_goal_kg).toBe(20.65);
    const f = read<{ daily_box_rate?: { value: number; days_daily_box_lasts: number; explanation_ar: string } }>('finance.json');
    expect(f.daily_box_rate?.value).toBe(20.05);
    expect(f.daily_box_rate?.days_daily_box_lasts).toBe(0.98);
    expect(f.daily_box_rate?.explanation_ar).toContain('20.05');
    const i = read<InsightsDoc>('docs/FINANCE_INSIGHTS_AR.json');
    expect(i.indicators.find((x) => x.id === 'daily_box_burn')?.current_value).toBe(20.05);
  });
  it('FIELD_LABELS_AR: 572 keys, 17 missing-data cards, every card has an Arabic label', () => {
    const l = read<{ labels: Record<string, unknown>; missing_data_cards: { key: string; label_ar: string }[] }>('docs/FIELD_LABELS_AR.json');
    expect(checkFieldLabels(l)).toBeNull();
    expect(Object.keys(l.labels)).toHaveLength(572);
    expect(l.missing_data_cards).toHaveLength(17);
    expect(l.missing_data_cards.every((c) => /[\u0600-\u06FF]/.test(c.label_ar))).toBe(true);
  });
  it('body.json: latest 83.65, remaining 20.65, change 0.65', () => {
    const p = weightProgress(read<Body>('body.json'))!;
    expect([kgText(p.latest), kgText(p.remaining), kgText(p.lost)]).toEqual(['83.65', '20.65', '0.65']);
  });
  it('routine blocks + qada plan + insights validate', () => {
    expect(checkRoutineBlocks(read('docs/ROUTINE_BLOCKS_AR.json'))).toBeNull();
    expect(checkInsights(read('docs/FINANCE_INSIGHTS_AR.json'))).toBeNull();
    const q = read<{ scenarios: unknown[] }>('docs/PRAYER_QADA_PLAN_AR.json');
    expect(checkQadaPlan(q)).toBeNull();
    expect(q.scenarios).toHaveLength(3);
    const rb = read<RoutineBlocksDoc>('docs/ROUTINE_BLOCKS_AR.json');
    expect(rb.blocks).toHaveLength(107);
    expect(overlapPairs(rb.blocks).length).toBeGreaterThan(0);
  });
  it('no displayed text in the real files keeps internal codes after plainDeep', () => {
    for (const n of ['body.json', 'habits.json', 'prayers.json', 'finance.json']) {
      const vals: string[] = [];
      const HIDDEN = /^(id|related|source_ref|source_file)$/; // لا تُعرض في الواجهة
      const walk = (v: unknown): void => { if (typeof v === 'string') vals.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!HIDDEN.test(k)) walk(x); };
      walk(plainDeep(read(n)));
      const bad = vals.filter((x) => /\bD-R-\d+|\bRC-\d+|\bR-\d{3}\b|CURRENT\.md|LEDGER\.csv|cash_delta/.test(x));
      expect(bad.slice(0, 3), n).toEqual([]);
    }
  });
});

describe('field path display is Arabic only', () => {
  const doc = { labels: { attendance: { label_ar: 'الحضور' }, days: { label_ar: 'الأيام' } } };
  it('maps known segments, drops unknown English ones', () => {
    expect(fieldPathAr('prayers.json › attendance.days[]', doc)).toBe('ملف الصلاة ← الحضور ← الأيام');
    expect(fieldPathAr('finance.json › zzz_unknown', doc)).toBe('ملف المال');
    expect(fieldPathAr('prayers.json › attendance.days[]', null)).toBe('ملف الصلاة');
  });
});
