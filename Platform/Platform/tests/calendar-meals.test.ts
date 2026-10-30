// وجبات الجدول (النقي): الملاءمة المرنة AC-08، نطاق الجدوى CAL-35، التسوّق CAL-37، قراءة Outlook LAW-07/08، بطاقات الدورة، بصمة CAL-50.
import { describe, expect, it } from 'vitest';
import {
  CYCLE, CYCLE_CARDS, LAW, ORIGINAL_RECIPES, cardHash, cycleCardsFor, cycleDayOf, feasibleRange, nutritionOf, planDay, scaleDayFlexible, scaleLines, shoppingList, type PlanCard, type RecipeLine, type Slot,
} from '../shared/kitchen/index.js';
import { INGREDIENT_BY_SLUG } from '../shared/kitchen/index.js';
import { kcalFromDescription, mealEventsOf, outlookDayLaw, type CalEvent } from '../shared/calendar/index.js';

const L = (ingredient: string, amount_g: number): RecipeLine => ({ ingredient, amount_g });
const card = (slug: string, lines: RecipeLine[]): PlanCard => ({ slug, title_ar: slug, lines, steps: [], flags: [] });
const SL: Slot[] = ['فطور', 'غداء', 'عشاء'];
// حساب مستقل: kcal لمجموعة أسطر بمعامل (بلا مرور على planDay)
const kcalAt = (lines: RecipeLine[], k: number): number => nutritionOf(scaleLines(lines, k)).total.kcal;

describe('بطاقات الدورة (2.6/S5-ب)', () => {
  it('9 بطاقات cy-… بأوزان الدورة، وكل وجبة تطابق سعرات S5/Outlook ±3 ومجاميع الأيام 1361/1343/1214', () => {
    expect(CYCLE_CARDS).toHaveLength(9);
    const S5: Record<string, number> = { 'bk-03': 402, 'ln-01': 575, 'dn-04': 384, 'bk-04': 431, 'ln-03': 499, 'dn-03': 413, 'bk-02': 378, 'dn-02': 417, 'dn-01': 419 };
    // أرقام Outlook مكتوبة بجدول أقدم (فارق ±1–2 موثّق في 2.6، وdn-02 يبلغ 2.2) فنسمح بـ3
    for (const c of CYCLE_CARDS) expect(Math.abs(nutritionOf(c.lines).total.kcal - S5[c.recipe]!), c.recipe).toBeLessThanOrEqual(3);
    expect([1, 2, 3].map((day) => CYCLE.find((d) => d.day === day)!.outlook_total)).toEqual([1361, 1343, 1214]);
  });
  it('cycleDayOf: 23 أكتوبر 2026 = اليوم 1، و26 = اليوم 1 مجددًا، و30 = اليوم 2', () => {
    expect([cycleDayOf('2026-10-23'), cycleDayOf('2026-10-24'), cycleDayOf('2026-10-25'), cycleDayOf('2026-10-26'), cycleDayOf('2026-10-30')]).toEqual([1, 2, 3, 1, 2]);
    expect(cycleCardsFor('2026-10-30')['غداء'].recipe).toBe('ln-03');
  });
  it('خطوات بطاقة الدورة أُعيدت كتابتها بأوزانها (توست بالبيض والجبنة: 80 غراماً من البيض لا 120)', () => {
    const c = CYCLE_CARDS.find((x) => x.recipe === 'bk-03')!;
    const orig = ORIGINAL_RECIPES.find((r) => r.slug === 'bk-03')!;
    expect(c.steps.join(' ')).toContain('80 غراماً من البيض');
    expect(orig.steps_original.join(' ')).toContain('100 غرام من البيض');
  });
  it('كل أيام الدورة تمر القانون بلا ملاءمة (كلها داخل 1200–1500)', () => {
    for (const day of [1, 2, 3]) {
      const cc = CYCLE_CARDS.filter((c) => c.day === day);
      const p = planDay(Object.fromEntries(cc.map((c) => [c.meal_slot, { card: c }])));
      expect(p.ok && p.law.status === 'VALID').toBe(true);
    }
    expect(CYCLE).toHaveLength(3);
  });
});

describe('الملاءمة المرنة AC-08 (TST-03: خصائص)', () => {
  // مولّد حتمي بسيط
  let seed = 7;
  const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const ING = ['oil', 'rice', 'egg', 'chicken', 'toast', 'cheese', 'yogurt', 'banana', 'oats', 'sugar'];
  const rndCard = (i: number): PlanCard => card(`r${i}`, Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => L(ING[Math.floor(rnd() * ING.length)]!, 20 + Math.floor(rnd() * 40) * 5)));

  it('إن وُجد حل رياضيًا فالملاءمة تُرجع يومًا داخل المجال، وإلا «غير ممكن» بسبب — 200 حالة عشوائية', () => {
    let feasible = 0;
    let impossible = 0;
    for (let t = 0; t < 200; t++) {
      const cs = SL.map((_, i) => rndCard(t * 3 + i));
      const lo = cs.reduce((s, c) => s + kcalAt(c.lines, 0.4), 0);
      const hi = cs.reduce((s, c) => s + kcalAt(c.lines, 1.5), 0);
      const r = scaleDayFlexible(cs.map((c, i) => ({ slot: SL[i]!, lines: c.lines })));
      if (hi >= LAW.MIN + 80 && lo <= LAW.MAX - 80) {
        feasible++;
        expect(r.ok, `حالة ${t}: [${Math.round(lo)},${Math.round(hi)}]`).toBe(true);
        expect(r.total.kcal).toBeGreaterThanOrEqual(LAW.MIN);
        expect(r.total.kcal).toBeLessThanOrEqual(LAW.MAX);
        for (const m of r.meals) for (const l of m.lines) expect(l.amount_g).toBeGreaterThanOrEqual(1);
      } else if (hi < LAW.MIN || lo > LAW.MAX) {
        impossible++;
        expect(r.ok).toBe(false);
        expect(r.reason).toMatch(/^غير ممكن/);
      }
    }
    expect(feasible).toBeGreaterThan(30);
    expect(impossible).toBeGreaterThan(5);
  });
  it('planDay: مستحيل ⇒ autoFitReason صريحة، ومعها وجبة يدوية ⇒ لا ملاءمة بسبب معلن', () => {
    const tiny = card('t', [L('cucumber', 100)]);
    const p = planDay({ 'فطور': { card: tiny }, 'غداء': { card: tiny }, 'عشاء': { card: tiny } }, { autoFit: true });
    expect(p.ok).toBe(false);
    expect(p.autoFit).toBeNull();
    expect(p.autoFitReason).toMatch(/^غير ممكن/);
    const m = planDay({ 'فطور': { manual: { title_ar: 'يدوي', nutrition: { kcal: 400, protein_g: 20, carbs_g: 40, fat_g: 10, fiber_g: 3 } } }, 'غداء': { card: tiny }, 'عشاء': { card: tiny } }, { autoFit: true });
    expect(m.autoFitReason).toContain('وجبة يدوية');
    expect(m.slots[0]).toMatchObject({ source: 'manual', card_slug: 'manual', scale: 1 });
    expect(m.slots[0]!.body_text).toContain('السعرات الحرارية: 400 سعرة حرارية');
  });
  it('مصدر الخانة: بطاقة أصلية/دورة = codex، وprop source=creation يُحفظ', () => {
    const c = CYCLE_CARDS[0]!;
    const p = planDay({ 'فطور': { card: { ...c, source: 'creation' } } });
    expect(p.slots[0]!.source).toBe('creation');
    expect(planDay({ 'فطور': { card: c } }).slots[0]!.source).toBe('codex');
  });
});

describe('نطاق الجدوى CAL-35', () => {
  const light = [{ lines: [L('cucumber', 100)] }];
  it('أصغر وأعلى مجموع ممكن، وتحذير إن استحال الوصول', () => {
    const pool = [{ lines: [L('oil', 20)] }, { lines: [L('rice', 100), L('chicken', 150)] }];
    const r = feasibleRange(500, 2, pool);
    const lo = Math.min(kcalAt(pool[0]!.lines, 0.4), kcalAt(pool[1]!.lines, 0.4));
    const hi = Math.max(kcalAt(pool[0]!.lines, 1.5), kcalAt(pool[1]!.lines, 1.5));
    expect(r.min).toBeCloseTo(500 + 2 * lo, 5);
    expect(r.max).toBeCloseTo(500 + 2 * hi, 5);
    expect(feasibleRange(100, 2, light).reachable).toBe(false);
    expect(feasibleRange(100, 2, light).message).toContain('لا يبلغ اليوم 1200');
    expect(feasibleRange(1400, 2, [{ lines: [L('oil', 50)] }]).message).toContain('يتجاوز اليوم 1500');
    expect(feasibleRange(1300, 0, pool)).toMatchObject({ min: 1300, max: 1300, reachable: true });
  });
});

describe('قائمة التسوّق CAL-37', () => {
  it('الإجمالي بالغرام ناقص المخزن (الصالح للأكل)، والقليل (ملح) يُشترى فقط إن غاب', () => {
    const days = [{ slots: [{ lines: [L('egg', 80), L('oil', 5), L('salt', 1)] }, { lines: [L('egg', 100), L('rice', 60)] }] }, { slots: [{ lines: [L('egg', 120)] }] }];
    const s = shoppingList(days, { egg: 53 * 2, rice: 1000 });
    const by = Object.fromEntries(s.lines.map((l) => [l.ingredient, l]));
    expect(by['egg']).toMatchObject({ need_g: 300 });
    expect(by['egg']!.buy_g).toBeCloseTo(300 - 53 * 2 * INGREDIENT_BY_SLUG.get('egg')!.edible_yield, 5);
    expect(by['rice']).toMatchObject({ buy_g: 0, qty: null });
    expect(by['oil']!.qty).toBeGreaterThan(0);
    expect(by['salt']!.buy_g).toBe(1);
    expect(shoppingList(days, { salt: 500 }).lines.find((l) => l.ingredient === 'salt')!.buy_g).toBe(0);
    expect(s.cart.map((c) => c.ingredient)).toEqual(s.lines.filter((l) => l.buy_g > 0).map((l) => l.ingredient));
    expect(s.days).toBe(2);
  });
});

describe('بصمة البطاقة CAL-50', () => {
  it('تتغير بتغيّر الوزن أو الخطوات وتثبت بغيرهما', () => {
    const a = cardHash([L('egg', 80)], ['1: x']);
    expect(cardHash([L('egg', 80)], ['1: x'])).toBe(a);
    expect(cardHash([L('egg', 85)], ['1: x'])).not.toBe(a);
    expect(cardHash([L('egg', 80)], ['1: y'])).not.toBe(a);
  });
});

const ev = (id: string, title: string, start: string, description = '', calendar = 'روتين وصحة'): CalEvent => ({ id, source: 'import', calendar, title, start, end: start.replace(/T\d\d:\d\d$/, 'T23:00'), show_as: 'busy', categories: [], description, series: null });
const desc = (k: number): string => `س\n1: ص.\nالقيمة الغذائية الإجمالية للوجبة:\nالسعرات الحرارية: ${k} سعرة حرارية\nالبروتين: 1 غرام`;
describe('قراءة وجبات Outlook (LAW-02/07/08)', () => {
  it('يقرأ السعرات من الوصف (أرقام 0-9 والهندية)، ويربط الأحداث بالخانات بالعنوان', () => {
    expect(kcalFromDescription(desc(402))).toBe(402);
    expect(kcalFromDescription('السعرات الحرارية: ٣٨٤ سعرة')).toBe(384);
    expect(kcalFromDescription('بلا')).toBeNull();
    const evs = [ev('b', '🍳 فطور', '2026-10-26T07:00'), ev('l', 'غداء', '2026-10-26T13:00'), ev('d', 'عشاء', '2026-10-26T19:00'), ev('x', 'غداء', '2026-10-26T15:00')];
    const m = mealEventsOf(evs, '2026-10-26');
    expect(Object.keys(m.bySlot)).toEqual(['فطور', 'غداء', 'عشاء']);
    expect(m.extra.map((e) => e.id)).toEqual(['x']);
  });
  it('يوم 402+575+384=1361 نظيف، فوق 1500 يُبلَّغ، ووجبة بلا سعرات = مجهول لا صفر', () => {
    const ok = outlookDayLaw([ev('b', 'فطور', '2026-10-26T07:00', desc(402)), ev('l', 'غداء', '2026-10-26T13:00', desc(575)), ev('d', 'عشاء', '2026-10-26T19:00', desc(384))], '2026-10-26');
    expect(ok.known_kcal).toBe(1361);
    expect(ok.violation).toBe(false);
    const high = outlookDayLaw([ev('b', 'فطور', '2026-10-26T07:00', desc(600)), ev('l', 'غداء', '2026-10-26T13:00', desc(600)), ev('d', 'عشاء', '2026-10-26T19:00', desc(400))], '2026-10-26');
    expect(high.law!.status).toBe('INVALID_HIGH');
    expect(high.violation).toBe(true);
    const unk = outlookDayLaw([ev('b', 'فطور', '2026-10-26T07:00', desc(300)), ev('l', 'غداء', '2026-10-26T13:00', 'بلا سعرات')], '2026-10-26');
    expect(unk.unknown).toEqual(['غداء']);
    expect(unk.law).toBeNull();
    expect(unk.violation).toBe(false);
    const extra = outlookDayLaw([ev('b', 'فطور', '2026-10-26T07:00', desc(400)), ev('b2', 'فطور', '2026-10-26T10:00', desc(100))], '2026-10-26');
    expect(extra.extra).toHaveLength(1);
    expect(extra.violation).toBe(true);
  });
});
