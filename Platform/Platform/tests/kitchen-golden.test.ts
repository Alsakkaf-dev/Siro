// TST-02: القيم الذهبية من S5 — تُقارن بأرقام المالك المكتوبة (لا بناتج الدوال نفسها، TST-11). أي انحراف = فشل بناء.
import { describe, expect, it } from 'vitest';
import { CYCLE, ORIGINAL_RECIPES, RECIPE_BY_SLUG, LAW, cycleDayOf, evaluateDay, nutritionOf, scaleDay, withinLaw, gramsAr, minutesAr } from '../shared/kitchen/index.js';

// S5-أ: البطاقات الـ11 القابلة للحساب (ln-02 بلا جرامات)
const GOLD: Record<string, number> = { 'bk-01': 568, 'bk-02': 547, 'bk-03': 532, 'bk-04': 655, 'ln-01': 794, 'ln-03': 724, 'ln-04': 794, 'dn-01': 609, 'dn-02': 577, 'dn-03': 623, 'dn-04': 572 };
// S5-ب: المحسوب من S4 لكل يوم من الدورة
const CYCLE_COMPUTED: Record<number, number> = { 1: 1361.6, 2: 1342.7, 3: 1216.6 };

describe('S5-أ البطاقات الأصلية', () => {
  for (const [slug, kcal] of Object.entries(GOLD)) {
    it(`${slug} = ${kcal} ±2`, () => {
      const r = RECIPE_BY_SLUG.get(slug)!;
      expect(Math.abs(nutritionOf(r.lines).total.kcal - kcal)).toBeLessThanOrEqual(2);
    });
  }
  it('ln-02 بلا أوزان ولا تُحسب (DEF-01)', () => {
    const r = RECIPE_BY_SLUG.get('ln-02')!;
    expect(r.status).toBe('needs_quantities');
    expect(nutritionOf(r.lines).unmeasured.length).toBe(r.lines.length);
  });
  it('ln-04 نصّها مطابق لـ ln-01 وموسومة ولا تُدمج (DEF-02)', () => {
    const a = RECIPE_BY_SLUG.get('ln-01')!;
    const b = RECIPE_BY_SLUG.get('ln-04')!;
    expect(b.steps_original).toEqual(a.steps_original);
    expect(b.status).toBe('body_mismatch_title');
    expect(b.title_ar).not.toBe(a.title_ar);
  });
  it('مجموع ثلاث وصفات أصلية يتجاوز القانون: bk-03 + ln-01 + dn-04 ≈ 1898', () => {
    const t = ['bk-03', 'ln-01', 'dn-04'].reduce((s, k) => s + nutritionOf(RECIPE_BY_SLUG.get(k)!.lines).total.kcal, 0);
    expect(Math.abs(t - 1898)).toBeLessThanOrEqual(2);
    expect(withinLaw(t)).toBe(false);
  });
});

describe('S5-ب دورة الأيام الثلاثة', () => {
  for (const d of CYCLE) {
    it(`اليوم ${d.day}: ${CYCLE_COMPUTED[d.day]} ±2 وداخل القانون`, () => {
      const slots = Object.fromEntries(d.meals.map((m) => [m.slot, nutritionOf(m.lines).total]));
      const law = evaluateDay(slots);
      expect(Math.abs(law.total_kcal - CYCLE_COMPUTED[d.day]!)).toBeLessThanOrEqual(2);
      expect(law.status).toBe('VALID');
      // المعلن في Outlook يطابق بفارق صغير (الملحق: ±1–2؛ غداء اليوم 3 يفرق 2.2 — مسجّل في CONFLICT_REGISTER)
      for (const m of d.meals) expect(Math.abs(nutritionOf(m.lines).total.kcal - m.outlook_kcal)).toBeLessThanOrEqual(2.5);
    });
  }
  it('هامش اليوم 3 ضيق (DEF-11): أقل من 50 عن الحدّ الأدنى', () => {
    const d3 = CYCLE[2]!;
    const t = d3.meals.reduce((s, m) => s + nutritionOf(m.lines).total.kcal, 0);
    expect(t - LAW.MIN).toBeLessThan(50);
    expect(t - LAW.MIN).toBeGreaterThan(0);
  });
  it('صيغة الدورة: (التاريخ − 2026-10-23) mod 3', () => {
    expect(cycleDayOf('2026-10-23')).toBe(1);
    expect(cycleDayOf('2026-10-30')).toBe(2); // 7 أيام → 1 → اليوم 2
    expect(cycleDayOf('2026-10-25')).toBe(3);
    expect(cycleDayOf('2027-02-07')).toBe(((107 % 3) + 1) as 1 | 2 | 3);
  });
  it('SCL-01: المقسّم على أيام الدورة يبقيها داخل القانون', () => {
    for (const d of CYCLE) {
      const r = scaleDay(d.meals.map((m) => ({ slot: m.slot, lines: m.lines })));
      expect(r.ok).toBe(true);
      expect(withinLaw(r.total.kcal)).toBe(true);
    }
  });
  it('SCL: الوصفات الأصلية (1898) تُصغَّر إلى داخل المجال ولا تُعدَّل الأصلية', () => {
    const picks = ['bk-03', 'ln-01', 'dn-04'].map((k) => RECIPE_BY_SLUG.get(k)!);
    const before = JSON.stringify(picks);
    const r = scaleDay(picks.map((p, i) => ({ slot: ['فطور', 'غداء', 'عشاء'][i]!, lines: p.lines })));
    expect(r.ok).toBe(true);
    expect(withinLaw(r.total.kcal)).toBe(true);
    expect(r.k).toBeLessThan(1);
    expect(JSON.stringify(picks)).toBe(before);
  });
});

describe('S6 صياغة الكميات تطابق نص المالك', () => {
  const texts = ORIGINAL_RECIPES.flatMap((r) => r.steps_original);
  it('كل «N غرام…» في الوصفات الـ12 يُولَّد حرفيًا', () => {
    const found = texts.flatMap((t) => [...t.matchAll(/(\d+) (غراماً|غرامات|غرام)/g)].map((m) => [Number(m[1]), m[0]] as const));
    expect(found.length).toBeGreaterThan(50);
    for (const [n, phrase] of found) expect(gramsAr(n)).toBe(phrase);
  });
  it('الدقائق: الأعداد والحروف كما في اللوحة', () => {
    const found = texts.flatMap((t) => [...t.matchAll(/(\d+) (دقائق|دقيقة)/g)].map((m) => [Number(m[1]), m[0]] as const));
    expect(found.length).toBeGreaterThan(5);
    for (const [n, phrase] of found) expect(minutesAr(n)).toBe(phrase);
    expect(minutesAr(8, { words: true })).toBe('ثماني دقائق');
    expect(minutesAr(2)).toBe('دقيقتين');
    expect(texts.some((t) => t.includes('ثماني دقائق'))).toBe(true);
  });
  it('غرام واحد وغرامان', () => {
    expect(gramsAr(1)).toBe('غرام واحد');
    expect(gramsAr(2)).toBe('غرامان');
    expect(gramsAr(105)).toBe('105 غرامات');
  });
});
