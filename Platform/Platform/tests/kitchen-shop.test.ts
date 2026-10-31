import { describe, expect, it } from 'vitest';
import {
  CARD_COEF, CYCLE, INGREDIENTS, ORIGINAL_CARDS, ORIGINAL_RECIPES, SEED_PRICES, STORES, amountRm, cardOf, cardStats, cartTotals, checkPriceChange, clampQty, compareStores, coverageDays, edibleGrams,
  filterCatalog, indexPrices, inventoryFrom, isStale, normalizeAr, packNotice, per100g, qtyBounds, qtyView, quickQty, rarityOf, searchIngredients, unitsFor, INGREDIENT_BY_SLUG, cardFeasibility, compareCards, recipeUsage,
  type CartLine,
} from '../shared/kitchen/index.js';

const idx = indexPrices(SEED_PRICES);
const egg = INGREDIENT_BY_SLUG.get('egg')!;

describe('A1 — منتقي الكمية (AC-01)', () => {
  it('بيض — دستة — 1: 12 بيضة بالصالح للأكل ببيانات S4، والسعر من جدول المتجر', () => {
    const v = qtyView('egg', 1, 'dozen');
    expect(v.edibleG).toBeCloseTo(12 * 53, 6);
    expect(v.nutrition.kcal).toBeCloseTo((per100g('egg').kcal * 636) / 100, 6);
    expect(v.nutrition.protein_g).toBeCloseTo((per100g('egg').protein_g * 636) / 100, 6);
    expect(amountRm('egg', 1, 'dozen', idx.get('egg')!.get('mydin')!.price_rm)).toBeCloseTo(10, 6);
  });
  it('تغيير الكمية خالص وسريع (< 100ms لـ1000 حسابًا) ويتناسب خطيًا', () => {
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) qtyView('chicken', 0.1 + (i % 50) / 10, 'kg');
    expect(performance.now() - t0).toBeLessThan(100);
    expect(qtyView('chicken', 1, 'kg').nutrition.kcal).toBeCloseTo(qtyView('chicken', 0.5, 'kg').nutrition.kcal * 2, 6);
  });
  it('الوحدات والحدود والخطوات: كغ بخطوة 0.1، لتر 0.25، حبة/دستة للبيض، وتبديل للغرام', () => {
    expect(unitsFor(egg)).toEqual(['dozen', 'piece', 'g']);
    expect(unitsFor(INGREDIENT_BY_SLUG.get('milk')!)).toEqual(['l', 'g']);
    expect(qtyBounds(INGREDIENT_BY_SLUG.get('chicken')!, 'kg')).toMatchObject({ step: 0.1, min: 0.1 });
    expect(qtyBounds(INGREDIENT_BY_SLUG.get('milk')!, 'l').step).toBe(0.25);
    expect(clampQty(INGREDIENT_BY_SLUG.get('garlic')!, 'kg', 0.07)).toBe(0.05);
    expect(clampQty(egg, 'dozen', 99)).toBe(20);
    expect(quickQty(INGREDIENT_BY_SLUG.get('chicken')!, 'kg').map((q) => q.qty)).toEqual([0.25, 0.5, 1]);
    // الغرام يحوّل ويسعّر بنسبة وحدة البيع
    expect(amountRm('chicken', 500, 'g', 9)).toBeCloseTo(4.5, 6);
    expect(edibleGrams(INGREDIENT_BY_SLUG.get('rice')!, 1, 'bag')).toBe(10000);
  });
  it('تنبيه العبوة الكاملة عند شراء جزء من علبة/عبوة', () => {
    const n = packNotice('cheese', 50, 'g', 20)!;
    expect(n).toMatchObject({ packs: 1, fullRm: 20, exceeds: true });
    expect(packNotice('chicken', 0.3, 'kg', 9)).toBeNull();
  });
});

describe('AC-02 — البحث', () => {
  it('«بيض» و«بَيض» و«egg» و«telur» تعطي النتيجة نفسها', () => {
    const first = (q: string) => searchIngredients(q, INGREDIENTS)[0]?.item.slug;
    expect(['بيض', 'بَيض', 'egg', 'telur', 'Egg'].map(first)).toEqual(Array(5).fill('egg'));
    expect(normalizeAr('بَيْض')).toBe(normalizeAr('بيض'));
  });
});

describe('A1 — الفلاتر والفرز (A1-20…22)', () => {
  it('الفئة والمخزن والسلة ووصفة والاعتبارات الغذائية والنطاق السعري', () => {
    const slugs = (f: Parameters<typeof filterCatalog>[2]) => filterCatalog(idx, 'mydin', f).map((i) => i.slug);
    expect(slugs({ category: 'ألبان وبيض' }).sort()).toEqual(['cheese', 'egg', 'milk', 'yogurt']);
    expect(slugs({ inPantry: new Set(['egg', 'rice']) }).sort()).toEqual(['egg', 'rice']);
    expect(slugs({ inCart: new Set(['honey']) })).toEqual(['honey']);
    expect(slugs({ recipe: 'bk-03' }).sort()).toEqual(['cheese', 'egg', 'oil', 'toast']);
    expect(slugs({ highProtein: true })).toEqual(expect.arrayContaining(['chicken', 'egg']));
    expect(slugs({ highFiber: true }).includes('chicken')).toBe(false);
    expect(slugs({ priceMin: 20, priceMax: 40 }).sort()).toEqual(['rice']); // أرز 27 / كيس
    expect(slugs({ q: 'telur' })).toEqual(['egg']);
    expect(slugs({ q: 'zzzz' })).toEqual([]);
  });
  it('الفرز: الاسم، السعر، السعرات/100غ، الأكثر استخدامًا', () => {
    const order = (sort: Parameters<typeof filterCatalog>[2]['sort']) => filterCatalog(idx, 'mydin', { sort }).map((i) => i.slug);
    expect(order('price')[0]).toBe('salt');
    expect(order('kcal100').slice(-1)[0]).toBe('oil');
    const u = order('usage').map((x) => recipeUsage(x));
    expect(u).toEqual([...u].sort((a, b) => b - a));
    expect(u[0]).toBeGreaterThanOrEqual(8);
    expect(order('name')).toHaveLength(26);
    expect(order('protein_per_rm')).toHaveLength(26);
  });
});

describe('CART — المجاميع ومقارنة الأسواق والتغطية (CART-02/03/05)', () => {
  const lines: CartLine[] = [{ ingredient: 'egg', qty: 1, unit: 'dozen', store: null }, { ingredient: 'chicken', qty: 0.5, unit: 'kg', store: null }, { ingredient: 'rice', qty: 1, unit: 'bag', store: null }];
  it('إجمالي السعر والتغذية والغرامات بمتجر مختار', () => {
    const t = cartTotals(lines, idx, 'mydin');
    expect(t.total_rm).toBeCloseTo(10 + 4.475 + 27, 4);
    expect(t.grossG).toBeCloseTo(720 + 500 + 10000, 6);
    expect(t.nutrition.kcal).toBeCloseTo(qtyView('egg', 1, 'dozen').nutrition.kcal + qtyView('chicken', 0.5, 'kg').nutrition.kcal + qtyView('rice', 1, 'bag').nutrition.kcal, 6);
    expect(t.estimated).toBe(true);
    expect(t.unpriced).toEqual([]);
  });
  it('مقارنة الأسواق: أرخص سوق للسلة وللصنف، والفرق بالرينغيت', () => {
    const c = compareStores(lines, idx, STORES, 'aeon');
    expect(c.perStore).toHaveLength(5);
    expect(c.cheapestStore).toBe('mydin');
    expect(c.spread_rm).toBeGreaterThan(0);
    const aeon = c.perStore.find((s) => s.store === 'aeon')!.total_rm!;
    const mydin = c.perStore.find((s) => s.store === 'mydin')!.total_rm!;
    expect(aeon - mydin).toBeCloseTo(c.spread_rm, 6);
    expect(c.perItem.find((x) => x.ingredient === 'chicken')).toMatchObject({ cheapest: 'mydin' });
    expect(c.perItem.every((x) => x.saving_rm >= 0)).toBe(true);
    expect(c.split_total_rm).toBeLessThanOrEqual(mydin + 1e-9);
  });
  it('أيام التغطية: مخزون يغطي يوم 1 فقط، ثم يومين، والقانون مُنفَّذ لكل يوم', () => {
    const day1 = Object.fromEntries(CYCLE[0]!.meals.flatMap((m) => m.lines).map((l) => [l.ingredient, 0] as const));
    for (const m of CYCLE[0]!.meals) for (const l of m.lines) day1[l.ingredient] = (day1[l.ingredient] ?? 0) + l.amount_g!;
    expect(coverageDays({}).days).toBe(0);
    const one = coverageDays(day1);
    expect(one.days).toBe(1);
    expect(one.blockedBy?.day).toBe(2);
    expect(one.detail[0]!.law.status).toBe('VALID');
    const big = Object.fromEntries(INGREDIENTS.map((i) => [i.slug, 1_000_000]));
    expect(coverageDays(big, 30).days).toBe(30);
    expect(coverageDays(big, 30).detail.every((d) => d.law.ok && d.law.total_kcal >= 1200 && d.law.total_kcal <= 1500)).toBe(true);
  });
  it('المخزون = المخزن ∪ السلة بالصالح للأكل', () => {
    const inv = inventoryFrom([{ ingredient: 'egg', qty: 1, unit: 'dozen', store: null }], { egg: 100, chicken: 1000 });
    expect(inv['chicken']).toBe(1000);
    expect(inv['egg']).toBeCloseTo(100 * 0.88 + 636, 6);
  });
});

describe('B1 — قواعد تغيير السعر', () => {
  it('> 0، تأكيد عند ×3 و÷3، تحذير نطاق الشريحة، قِدم 30 يومًا', () => {
    expect(checkPriceChange('egg', 'mydin', 10, 0).ok).toBe(false);
    expect(checkPriceChange('egg', 'mydin', 10, -1).ok).toBe(false);
    expect(checkPriceChange('egg', 'mydin', 10, 31)).toMatchObject({ ok: true, needsConfirm: true });
    expect(checkPriceChange('egg', 'mydin', 10, 3.2)).toMatchObject({ ok: true, needsConfirm: true });
    expect(checkPriceChange('egg', 'mydin', 10, 10.5)).toMatchObject({ needsConfirm: false, warnings: [] });
    expect(checkPriceChange('egg', 'mydin', 10, 14).warnings).toHaveLength(1);
    expect(isStale('2026-09-01', Date.parse('2026-10-29T00:00:00Z'))).toBe(true);
    expect(isStale('2026-10-20', Date.parse('2026-10-29T00:00:00Z'))).toBe(false);
  });
});

describe('A2 — إحصاءات البطاقات (MC-10/MC-12)', () => {
  const cards = Object.fromEntries(ORIGINAL_CARDS(idx, 'mydin').map((c) => [c.slug, c]));
  it('قيم ذهبية ثابتة للبطاقات الـ11 المحسوبة (أي تغيير في المعادلة أو الأسعار المبذورة يكسرها عمدًا)', () => {
    const golden: Record<string, [number, number, number, number, number, number, number, string]> = {
      'bk-01': [71, 67, 55, 56, 50, 65, 65, 'silver'],
      'bk-02': [68, 67, 35, 71, 23, 51, 56, 'silver'],
      'bk-03': [67, 59, 40, 65, 17, 51, 49, 'bronze'],
      'bk-04': [82, 72, 70, 59, 71, 57, 71, 'gold'],
      'ln-01': [99, 99, 90, 42, 35, 87, 82, 'gold'],
      'ln-03': [91, 99, 71, 55, 99, 67, 91, 'iconic'],
      'ln-04': [99, 99, 90, 42, 35, 87, 82, 'gold'],
      'dn-01': [76, 99, 74, 19, 70, 66, 82, 'gold'],
      'dn-02': [72, 99, 55, 35, 29, 70, 76, 'gold'],
      'dn-03': [78, 72, 37, 87, 13, 55, 50, 'bronze'],
      'dn-04': [72, 73, 29, 81, 11, 52, 49, 'bronze'],
    };
    for (const [slug, [ENG, PRO, CAR, FAT, FIB, ECO, OVR, rarity]] of Object.entries(golden)) {
      expect(cards[slug]!.stats, slug).toEqual({ ENG, PRO, CAR, FAT, FIB, ECO, OVR });
      expect(cards[slug]!.rarity, slug).toBe(rarity);
    }
  });
  it('ln-02 بلا إحصاءات (ينقصها أوزان)، وln-04 بشارة النص المطابق؛ لا تُخفى ولا تُعدَّل (A2-26)', () => {
    expect(cards['ln-02']).toMatchObject({ computable: false, stats: null, rarity: null });
    expect(cards['ln-02']!.badges).toContain('needs_quantities');
    expect(cards['ln-04']!.badges).toContain('text_duplicate');
    expect(Object.keys(cards)).toHaveLength(12);
    expect(ORIGINAL_RECIPES.find((r) => r.slug === 'ln-02')!.lines.every((l) => l.amount_g === null)).toBe(true);
  });
  it('المعادلات: القص 1–99، ENG = kcal/8، حدود الندرة، وECO غير معروفة عند غياب التكلفة', () => {
    const n = { kcal: 600, protein_g: 30, carbs_g: 60, fat_g: 20, fiber_g: 5 };
    const s = cardStats(n, 5, [{ ingredient: 'chicken', amount_g: 100 }]);
    expect(s.ENG).toBe(75);
    expect(s.PRO).toBe(66);
    expect(cardStats({ ...n, kcal: 5000, protein_g: 500 }, 5, []).PRO).toBe(99);
    expect(cardStats({ ...n, kcal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0 }, 5, []).ENG).toBe(1);
    expect(cardStats(n, null, []).ECO).toBeNull();
    expect([85, 84, 70, 69, 55, 54].map(rarityOf)).toEqual(['iconic', 'gold', 'gold', 'silver', 'silver', 'bronze']);
    expect(CARD_COEF.rarity).toEqual({ iconic: 85, gold: 70, silver: 55 });
  });
  it('تغيّر السعر يغيّر ECO وحدها (MC-11)، والجدوى والمقارنة تعملان', () => {
    const dear = indexPrices(SEED_PRICES.map((p) => (p.ingredient === 'chicken' ? { ...p, price_rm: p.price_rm * 2 } : p)));
    const a = cards['ln-01']!.stats!;
    const b = cardOf(ORIGINAL_RECIPES.find((r) => r.slug === 'ln-01')!, dear, 'mydin').stats!;
    expect({ ...b, ECO: 0, OVR: 0 }).toEqual({ ...a, ECO: 0, OVR: 0 });
    expect(b.ECO!).toBeLessThan(a.ECO!);
    const f = cardFeasibility(cards['bk-03']!, Object.fromEntries(cards['bk-03']!.recipe.lines.map((l) => [l.ingredient, l.amount_g!])));
    expect(f.status).toBe('ready');
    expect(cardFeasibility(cards['bk-03']!, Object.fromEntries(cards['bk-03']!.recipe.lines.filter((l) => l.ingredient !== 'cheese').map((l) => [l.ingredient, l.amount_g!])), { idx, store: 'mydin' })).toMatchObject({ status: 'missing', completionCost: expect.any(Number) });
    expect(compareCards(cards['bk-03']!, cards['ln-01']!).find((x) => x.stat === 'ENG')).toEqual({ stat: 'ENG', a: 67, b: 99 });
  });
});

describe('إكمال الناقص وجمع الكميات (CART-04)', () => {
  it('qtyForEdible: كغ بخطوة 0.1، عبوة كاملة، والبيض بالحبة', async () => {
    const { qtyForEdible, addToLine } = await import('../shared/kitchen/index.js');
    expect(qtyForEdible(INGREDIENT_BY_SLUG.get('chicken')!, 250)).toEqual({ qty: 0.3, unit: 'kg' });
    expect(qtyForEdible(INGREDIENT_BY_SLUG.get('cheese')!, 40)).toEqual({ qty: 1, unit: 'pack' });
    expect(qtyForEdible(egg, 106)).toEqual({ qty: 2, unit: 'piece' });
    expect(qtyForEdible(INGREDIENT_BY_SLUG.get('milk')!, 200)).toEqual({ qty: 0.25, unit: 'l' });
    expect(addToLine(INGREDIENT_BY_SLUG.get('chicken')!, { qty: 0.5, unit: 'kg' }, { qty: 250, unit: 'g' })).toEqual({ qty: 750, unit: 'g' });
    expect(addToLine(INGREDIENT_BY_SLUG.get('chicken')!, { qty: 0.5, unit: 'kg' }, { qty: 300, unit: 'g' })).toEqual({ qty: 0.8, unit: 'kg' });
    expect(addToLine(egg, undefined, { qty: 3, unit: 'piece' })).toEqual({ qty: 3, unit: 'piece' });
    expect(addToLine(egg, { qty: 1, unit: 'dozen' }, { qty: 6, unit: 'piece' })).toEqual({ qty: 18, unit: 'piece' });
  });
});
