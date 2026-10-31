// TST-01/03: محركات المطبخ النقية + خصائص (property-based بمولّد حتمي بلا اعتماديات).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  INGREDIENTS, INGREDIENT_BY_SLUG, NUTRITION_PER_100G, ORIGINAL_RECIPES, RECIPE_BY_SLUG, SEED_PRICES, STORES, CYCLE, LAW,
  atwaterDeviation, canComplete, countPhrase, editDistance, evaluateDay, feasibility, fmtKcal, fmtNum, fmtRM, gaugeTone, indexPrices,
  mealCost, normalizeAr, nutritionOf, packsFor, per100g, pickPrice, pricePerGram, qtyStep, roundGrams, roundToStep, scaleDay,
  searchIngredients, toGrams, withinLaw, type NutritionVector,
} from '../shared/kitchen/index.js';

const ROOT = join(__dirname, '..');
const N = (kcal: number): NutritionVector => ({ kcal, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

// مولّد حتمي (mulberry32) لاختبارات الخصائص
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// S1: القائمة المقفلة حرفيًا (N-01/AC-11)
const LOCKED = ['potato', 'onion', 'tomato', 'carrot', 'cucumber', 'toast', 'lemon', 'oats', 'egg', 'banana', 'milk', 'honey', 'cheese', 'yogurt', 'chicken', 'garlic', 'rice', 'eggplant', 'green_beans', 'ginger', 'coriander', 'cumin', 'tomato_paste', 'salt', 'sugar', 'oil'];
const NAMES_AR = ['بطاط', 'بصل', 'طماطم', 'جزر', 'خيار', 'توست', 'ليمون', 'شوفان', 'بيض', 'موز', 'حليب', 'عسل', 'جبنة مراعي', 'زبادي', 'دجاج مقطع', 'ثوم', 'أرز', 'باذنجان', 'فاصوليا خضراء', 'زنجبيل', 'كزبرة', 'كمون مطحون', 'معجون طماطم (كاتشب)', 'ملح', 'سكر', 'زيت'];

describe('البذرة والقائمة المقفلة (K-M1, AC-11)', () => {
  it('26 مكوّنًا بالضبط وبالأسماء كما كتبها المالك', () => {
    expect(INGREDIENTS.map((i) => i.slug)).toEqual(LOCKED);
    expect(INGREDIENTS.map((i) => i.name_ar)).toEqual(NAMES_AR);
  });
  it('لا مكوّن خارج الـ26 في الأسعار والوصفات والدورة وجدول التغذية', () => {
    const set = new Set(LOCKED);
    for (const p of SEED_PRICES) expect(set.has(p.ingredient)).toBe(true);
    for (const r of ORIGINAL_RECIPES) for (const l of r.lines) expect(set.has(l.ingredient)).toBe(true);
    for (const d of CYCLE) for (const m of d.meals) for (const l of m.lines) expect(set.has(l.ingredient)).toBe(true);
    expect(Object.keys(NUTRITION_PER_100G).sort()).toEqual([...LOCKED].sort());
  });
  it('كل مكوّن له سعر في الأسواق الخمسة، وكلها تقديرية موسومة (N-03)', () => {
    expect(SEED_PRICES.length).toBe(26 * STORES.length);
    for (const p of SEED_PRICES) {
      expect(p.source).toBe('estimate_tier');
      expect(p.confidence).toBe('low');
      expect(p.price_rm).toBeGreaterThan(0);
      expect(p.price_rm).toBeGreaterThanOrEqual(p.price_min);
      expect(p.price_rm).toBeLessThanOrEqual(p.price_max);
    }
    expect(pickPrice(indexPrices(SEED_PRICES), 'sugar', 'selected_store', 'aeon')?.unverified).toBe(true);
    expect(pickPrice(indexPrices(SEED_PRICES), 'chicken', 'selected_store', 'mydin')?.price_rm).toBe(8.95);
  });
  it('الوصفات 12: 4 فطور و4 غداء و4 عشاء', () => {
    expect(ORIGINAL_RECIPES.length).toBe(12);
    for (const t of ['فطور', 'غداء', 'عشاء'] as const) expect(ORIGINAL_RECIPES.filter((r) => r.meal_types.includes(t)).length).toBe(4);
  });
  it('الثلاثة غير المستعملة في الوصفات تبقى (DEF-09)', () => {
    const used = new Set(ORIGINAL_RECIPES.flatMap((r) => r.lines.map((l) => l.ingredient)));
    expect(['ginger', 'coriander', 'sugar'].every((s) => !used.has(s) && INGREDIENT_BY_SLUG.has(s))).toBe(true);
  });
});

describe('LAW (4.6)', () => {
  it('الحدّان مسموحان، وخارجهما مرفوض (AC-07)', () => {
    const day = (a: number, b: number, c: number) => evaluateDay({ فطور: N(a), غداء: N(b), عشاء: N(c) });
    expect(day(400, 400, 400).status).toBe('VALID');
    expect(day(500, 500, 500).status).toBe('VALID');
    expect(day(400, 400, 399).status).toBe('INVALID_LOW');
    expect(day(400, 400, 399).deficit).toBe(1);
    expect(day(500, 500, 501).status).toBe('INVALID_HIGH');
    expect(day(500, 500, 501).excess).toBe(1);
  });
  it('الجزئي فوق الأعلى يُرفض فورًا؛ والجزئي تحت الأدنى مقبول مع الباقي (LAW-03)', () => {
    expect(evaluateDay({ فطور: N(1501) }).ok).toBe(false);
    const p = evaluateDay({ فطور: N(500) });
    expect(p.status).toBe('PARTIAL');
    expect(p.remaining).toEqual({ minNeeded: 700, maxAllowed: 1000 });
    expect(evaluateDay({}).status).toBe('EMPTY');
  });
  it('LAW-04 إمكانية الإكمال', () => {
    expect(canComplete(900, [{ min: 100, max: 200 }])).toBe(false);
    expect(canComplete(900, [{ min: 100, max: 400 }])).toBe(true);
    expect(canComplete(1450, [{ min: 100, max: 400 }])).toBe(false);
  });
  it('مؤشر القانون (LAW-06)', () => {
    expect(gaugeTone(1300)).toBe('ok');
    expect(gaugeTone(1214)).toBe('near');
    expect(gaugeTone(1499)).toBe('near');
    expect(gaugeTone(1501)).toBe('out');
  });
  it('TST-03 خاصية: evaluateDay لا تقول «مقبول» لمكتمل خارج المجال', () => {
    const r = rng(7);
    for (let i = 0; i < 2000; i++) {
      const a = Math.round(r() * 900), b = Math.round(r() * 900), c = Math.round(r() * 900);
      const res = evaluateDay({ فطور: N(a), غداء: N(b), عشاء: N(c) });
      expect(res.ok).toBe(a + b + c >= LAW.MIN && a + b + c <= LAW.MAX);
    }
  });
  it('LAW-01: الثابتان لا يتكرران كأرقام خارج law.ts في شيفرة المطبخ', () => {
    const files: string[] = [];
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f)) files.push(p);
      }
    };
    walk(join(ROOT, 'shared', 'kitchen'));
    walk(join(ROOT, 'web', 'src', 'kitchen'));
    files.push(join(ROOT, 'web', 'src', 'pages', 'Kitchen.tsx'));
    const bad = files.filter((f) => !f.endsWith(join('shared', 'kitchen', 'law.ts')) && /\b(1200|1500)\b/.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f));
    expect(bad).toEqual([]);
  });
});

describe('التغذية (NUT)', () => {
  it('per100g من S4، والبيض مطبوخ افتراضيًا والنيء متاح', () => {
    expect(per100g('egg').kcal).toBe(155);
    expect(per100g('egg', 'raw').kcal).toBe(143);
    expect(per100g('lemon').kcal).toBe(22);
    expect(() => per100g('lentils')).toThrow();
  });
  it('NUT-01: 12 بيضة (720 غ صالحة ×0.88) — قيمة محسوبة يدويًا', () => {
    const grams = 720 * 0.88;
    expect(nutritionOf([{ ingredient: 'egg', amount_g: grams }]).total.kcal).toBeCloseTo(155 * grams / 100, 6);
  });
  it('NUT-03 أتووتر: الأرز والدجاج ضمن 10%', () => {
    expect(atwaterDeviation(per100g('rice'))).toBeLessThan(0.1);
    expect(atwaterDeviation(per100g('chicken'))).toBeLessThan(0.1);
  });
});

describe('الوحدات (UNIT)', () => {
  it('UNIT-01 الخطوات', () => {
    expect(qtyStep(INGREDIENT_BY_SLUG.get('potato')!)).toBe(0.1);
    expect(qtyStep(INGREDIENT_BY_SLUG.get('garlic')!)).toBe(0.05);
    expect(qtyStep(INGREDIENT_BY_SLUG.get('milk')!)).toBe(0.25);
    expect(qtyStep(INGREDIENT_BY_SLUG.get('egg')!)).toBe(1);
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(0.37, 0.05)).toBe(0.35);
  });
  it('toGrams بحسب الوحدة', () => {
    const egg = INGREDIENT_BY_SLUG.get('egg')!;
    expect(toGrams(egg, 1)).toBe(720);
    expect(toGrams(egg, 2, 'piece')).toBe(120);
    expect(toGrams(INGREDIENT_BY_SLUG.get('rice')!, 1)).toBe(10000);
    expect(toGrams(INGREDIENT_BY_SLUG.get('potato')!, 0.5)).toBe(500);
    expect(toGrams(INGREDIENT_BY_SLUG.get('oil')!, 1)).toBe(1840);
    expect(packsFor(INGREDIENT_BY_SLUG.get('toast')!, 80)).toBe(1);
    expect(packsFor(INGREDIENT_BY_SLUG.get('toast')!, 401)).toBe(2);
  });
  it('UNIT-02 أسماء الوحدات', () => {
    expect(countPhrase(1, 'dozen')).toBe('دستة واحدة');
    expect(countPhrase(2, 'dozen')).toBe('دستتان');
    expect(countPhrase(3, 'dozen')).toBe('3 دستات');
    expect(countPhrase(12, 'loaf')).toBe('12 رغيفاً');
    expect(countPhrase(1.5, 'kg')).toBe('1.5 كغ');
  });
});

describe('التكلفة (COST)', () => {
  const idx = indexPrices(SEED_PRICES);
  it('COST-01 سعر الغرام', () => {
    expect(pricePerGram('egg', 10)).toBeCloseTo(10 / 720, 10);
    expect(pricePerGram('potato', 4)).toBeCloseTo(0.004, 10);
    expect(pricePerGram('rice', 27)).toBeCloseTo(0.0027, 10);
  });
  it('COST-02 تكلفة bk-03 في Mydin = حساب يدوي من الجدول', () => {
    // بيض 100÷0.88×10/720 + توست 80×3.40/400 + جبنة 40×16.50/200 + زيت 5×11/1840
    const hand = (100 / 0.88) * (10 / 720) + 80 * (3.4 / 400) + 40 * (16.5 / 200) + 5 * (11 / 1840);
    const c = mealCost(RECIPE_BY_SLUG.get('bk-03')!.lines, idx, { store: 'mydin' });
    expect(c.total_rm).toBeCloseTo(hand, 10);
    expect(c.estimated).toBe(true);
    expect(c.confidence).toBe('low');
  });
  it('COST-03 الأرخص ≤ المختار، والمتوسط بين الطرفين', () => {
    const lines = RECIPE_BY_SLUG.get('ln-01')!.lines;
    const cheap = mealCost(lines, idx, { store: 'aeon', mode: 'cheapest' }).total_rm;
    const aeon = mealCost(lines, idx, { store: 'aeon' }).total_rm;
    const avg = mealCost(lines, idx, { store: 'aeon', mode: 'average' }).total_rm;
    expect(cheap).toBeLessThanOrEqual(avg);
    expect(avg).toBeLessThanOrEqual(aeon);
  });
});

describe('المقسّم (SCL) — TST-03', () => {
  it('التقريب: 5 غ لما ≥ 20، و1 غ لما دونه، ولا صفر', () => {
    expect(roundGrams(87)).toBe(85);
    expect(roundGrams(12.6)).toBe(13);
    expect(roundGrams(0.2)).toBe(1);
  });
  it('خاصية: لا وزن سالب/صفري، والناتج داخل المجال متى كان ممكنًا', () => {
    const r = rng(42);
    const usable = ORIGINAL_RECIPES.filter((x) => x.status === 'verified');
    for (let i = 0; i < 150; i++) {
      const pick = [0, 1, 2].map(() => usable[Math.floor(r() * usable.length)]!);
      const res = scaleDay(pick.map((p, j) => ({ slot: ['فطور', 'غداء', 'عشاء'][j]!, lines: p.lines })));
      for (const m of res.meals) for (const l of m.lines) if (l.amount_g !== null) expect(l.amount_g).toBeGreaterThan(0);
      const feasible = res.range.min <= LAW.MAX && res.range.max >= LAW.MIN;
      if (res.ok) expect(withinLaw(res.total.kcal)).toBe(true);
      if (feasible) expect(res.ok).toBe(true);
      else expect(res.reason).toBeTruthy();
    }
  });
  it('AC-08: يقول «غير ممكن» مع السبب حين يستحيل', () => {
    const res = scaleDay([{ slot: 'فطور', lines: [{ ingredient: 'cucumber', amount_g: 50 }] }]);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/غير ممكن/);
  });
});

describe('الجدوى (FEA)', () => {
  const idx = indexPrices(SEED_PRICES);
  const bk03 = RECIPE_BY_SLUG.get('bk-03')!;
  it('جاهزة الآن بحصتين', () => {
    const f = feasibility(bk03, { egg: 250, toast: 400, cheese: 200, oil: 900 });
    expect(f.status).toBe('ready');
    expect(f.servings).toBe(2);
    expect(f.limiting).toBe('egg');
  });
  it('ينقصها الجبنة 40 غ مع تكلفة الإكمال (J4)', () => {
    const f = feasibility(bk03, { egg: 300, toast: 400, oil: 900 }, { idx, store: 'mydin' });
    expect(f.status).toBe('missing');
    expect(f.missing).toEqual([{ ingredient: 'cheese', grams: 40 }]);
    expect(f.completionCost).toBeCloseTo(40 * (16.5 / 200), 10);
  });
  it('غير ممكنة حين ينقص أكثر من 3', () => {
    expect(feasibility(bk03, {}).status).toBe('impossible');
  });
  it('الملح والكمون «قليل»: يكفي أي مقدار (FEA)', () => {
    const ln01 = RECIPE_BY_SLUG.get('ln-01')!;
    const inv = { chicken: 1000, salt: 1, cumin: 1, oil: 500, rice: 1000, carrot: 500, cucumber: 500, toast: 400 };
    expect(feasibility(ln01, inv).status).toBe('ready');
  });
  it('FEA-04: الوصفات المعيبة مستبعدة', () => {
    expect(feasibility(RECIPE_BY_SLUG.get('ln-02')!, {}).status).toBe('excluded');
    expect(feasibility(RECIPE_BY_SLUG.get('ln-04')!, {}).status).toBe('excluded');
  });
});

describe('البحث (SRCH) — AC-02', () => {
  it('بيض / بَيض / egg / telur → البيض أولًا', () => {
    for (const q of ['بيض', 'بَيض', 'egg', 'telur', 'Telur Ayam']) expect(searchIngredients(q, INGREDIENTS)[0]?.item.slug).toBe('egg');
    expect(searchIngredients('بَيض', INGREDIENTS).map((h) => h.item.slug)).toEqual(searchIngredients('بيض', INGREDIENTS).map((h) => h.item.slug));
  });
  it('المرادفات والهمزة والتاء المربوطة و«ال»', () => {
    expect(searchIngredients('بطاطس', INGREDIENTS)[0]?.item.slug).toBe('potato');
    expect(searchIngredients('رز', INGREDIENTS)[0]?.item.slug).toBe('rice');
    expect(searchIngredients('ارز', INGREDIENTS)[0]?.item.slug).toBe('rice');
    expect(searchIngredients('الكزبرة', INGREDIENTS)[0]?.item.slug).toBe('coriander');
    expect(searchIngredients('لبن', INGREDIENTS)[0]?.item.slug).toBe('yogurt');
  });
  it('SRCH-02 تسامح حرف واحد لكلمات ≥ 4', () => {
    expect(searchIngredients('باذنجن', INGREDIENTS)[0]?.item.slug).toBe('eggplant');
    expect(editDistance('ab', 'ba')).toBe(1);
  });
  it('SRCH-03 الترتيب: تام قبل بادئة', () => {
    const hits = searchIngredients('egg', INGREDIENTS);
    expect(hits.map((h) => h.item.slug).slice(0, 2)).toEqual(['egg', 'eggplant']);
  });
  it('SRCH-04 الأداء < 30ms', () => {
    const t = performance.now();
    for (let i = 0; i < 20; i++) searchIngredients('دجاج', INGREDIENTS);
    expect((performance.now() - t) / 20).toBeLessThan(30);
  });
  it('normalizeAr', () => {
    expect(normalizeAr('أُرزٌّ')).toBe('ارز');
    expect(normalizeAr('الطماطم')).toBe('طماطم');
  });
});

describe('الأرقام 0-9 (I18N-02, N-13)', () => {
  it('لا أرقام هندية-عربية في التنسيق', () => {
    for (const s of [fmtNum(1234.56, 2), fmtKcal(1305.5), fmtRM(1234.5), fmtNum(-3.25)]) expect(s).not.toMatch(/[٠-٩۰-۹]/);
    expect(fmtRM(3.4)).toBe('RM 3.40');
    expect(fmtKcal(531.6)).toBe('532');
    expect(fmtNum(null)).toBe('—');
  });
});
