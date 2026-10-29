/** رياضيات المتجر والسلة والمخزن (A1/C/P): نقية. الغرام أساس الكتلة؛ التغذية على الصالح للأكل (نسبة المردود)، والسعر على الوزن المشترى. */
import { INGREDIENTS, INGREDIENT_BY_SLUG, TINY } from './data/ingredients.js';
import { CYCLE } from './data/cycle.js';
import { evaluateDay, type LawResult } from './law.js';
import { per100g, scale, sum, ZERO } from './nutrition.js';
import { pickPrice, type PriceIndex, type PriceMode } from './cost.js';
import { qtyStep, roundToStep, toGrams, packsFor } from './units.js';
import { normalizeAr, searchIngredients } from './search.js';
import { ORIGINAL_RECIPES } from './data/recipes.js';
import { nutritionOf } from './nutrition.js';
import type { Category, Confidence, Ingredient, NutritionVector, PricePoint, SaleUnit, Store } from './types.js';

export interface CartLine { ingredient: string; qty: number; unit: SaleUnit; /** null = المتجر المختار */ store: string | null }

/** الوحدات المتاحة في منتقي الكمية: وحدة البيع + الغرام (+ الحبة للبيض) — A1-11 */
export function unitsFor(ing: Ingredient): SaleUnit[] {
  const u: SaleUnit[] = [ing.sale_unit];
  if (ing.piece_g && ing.sale_unit !== 'piece') u.push('piece');
  if (ing.sale_unit !== 'g') u.push('g');
  return u;
}

/** حدّان منطقيان للكمية (A1-11) */
export function qtyBounds(ing: Ingredient, unit: SaleUnit): { min: number; max: number; step: number } {
  const step = qtyStep(ing, unit);
  if (unit === 'g') return { min: 1, max: 20_000, step: 1 };
  if (unit === 'kg') return { min: step, max: 20, step };
  if (unit === 'l') return { min: step, max: 10, step };
  if (unit === 'piece') return { min: 1, max: 120, step: 1 };
  return { min: 1, max: 20, step: 1 };
}

/** اختصارات الكمية (A1-11) لكل وحدة */
export function quickQty(ing: Ingredient, unit: SaleUnit): { label: string; qty: number }[] {
  if (unit === 'kg') return [{ label: '250 غ', qty: 0.25 }, { label: '500 غ', qty: 0.5 }, { label: '1 كغ', qty: 1 }];
  if (unit === 'g') return [{ label: '100 غ', qty: 100 }, { label: '250 غ', qty: 250 }, { label: '500 غ', qty: 500 }];
  return [{ label: '1', qty: 1 }, { label: '2', qty: 2 }, { label: '3', qty: 3 }].filter((q) => q.qty <= qtyBounds(ing, unit).max);
}

export const clampQty = (ing: Ingredient, unit: SaleUnit, qty: number): number => {
  const b = qtyBounds(ing, unit);
  return roundToStep(Math.min(b.max, Math.max(b.min, qty)), b.step);
};

/** الغرامات الصالحة للأكل في كمية: البيض بالحبة يستعمل وزن الحبة الصالح (S1)، وغيره المردود */
export function edibleGrams(ing: Ingredient, qty: number, unit: SaleUnit): number {
  if (ing.piece_edible_g && (unit === 'piece' || unit === 'dozen')) return qty * (unit === 'dozen' ? 12 : 1) * ing.piece_edible_g;
  return toGrams(ing, qty, unit) * ing.edible_yield;
}

export interface QtyView { grossG: number; edibleG: number; nutrition: NutritionVector; per100: NutritionVector }
/** A1-12: التغذية للكمية المختارة (≤100ms: حساب خالص بلا شبكة) */
export function qtyView(slug: string, qty: number, unit: SaleUnit): QtyView {
  const ing = INGREDIENT_BY_SLUG.get(slug);
  if (!ing) throw new Error(`مكوّن خارج القائمة المقفلة: ${slug}`);
  const edibleG = edibleGrams(ing, qty, unit);
  return { grossG: toGrams(ing, qty, unit), edibleG, nutrition: scale(per100g(slug), edibleG / 100), per100: per100g(slug) };
}

/** ثمن كمية بسعر وحدة البيع: بالنسبة إلى غرامات وحدة البيع (الشراء الفعلي بالعبوات أدناه) */
export function amountRm(slug: string, qty: number, unit: SaleUnit, saleUnitPrice: number): number {
  const ing = INGREDIENT_BY_SLUG.get(slug)!;
  return (toGrams(ing, qty, unit) / toGrams(ing, 1)) * saleUnitPrice;
}
/** كم عبوة كاملة تلزم لهذه الكمية، وهل الشراء الكامل أكبر من المطلوب (A1-12) */
export function packNotice(slug: string, qty: number, unit: SaleUnit, saleUnitPrice: number): { packs: number; fullRm: number; exceeds: boolean } | null {
  const ing = INGREDIENT_BY_SLUG.get(slug)!;
  if (ing.sale_unit === 'kg' || ing.sale_unit === 'l' || ing.sale_unit === 'g') return null;
  const needG = toGrams(ing, qty, unit);
  const packs = Math.max(1, Math.ceil(needG / toGrams(ing, 1) - 1e-9));
  const fullRm = packs * saleUnitPrice;
  return { packs, fullRm, exceeds: packs * toGrams(ing, 1) - needG > 1e-6 };
}

/** كمية بوحدة مناسبة تغطي غرامات صالحة للأكل (للإكمال من الناقص): كغ/لتر بالخطوة، والعبوات تقريبًا للأعلى، والبيض بالحبة */
export function qtyForEdible(ing: Ingredient, edibleG: number): { qty: number; unit: SaleUnit } {
  if (ing.piece_edible_g && ing.piece_g) return { qty: Math.max(1, Math.ceil(edibleG / ing.piece_edible_g - 1e-9)), unit: 'piece' };
  const unit = ing.sale_unit;
  const step = qtyStep(ing, unit);
  const units = (edibleG / (ing.edible_yield || 1)) / toGrams(ing, 1);
  const q = unit === 'kg' || unit === 'l' ? Math.ceil(units / step - 1e-9) * step : Math.ceil(units - 1e-9);
  return { qty: clampQty(ing, unit, Math.max(step, q)), unit };
}

/** جمع كمية إلى سطر قائم (وحدات مختلفة): عبر الوزن المشترى، ويبقى بوحدة السطر القائم */
export function addToLine(ing: Ingredient, existing: { qty: number; unit: SaleUnit } | undefined, add: { qty: number; unit: SaleUnit }): { qty: number; unit: SaleUnit } {
  if (!existing) return { qty: clampQty(ing, add.unit, add.qty), unit: add.unit };
  const g = toGrams(ing, existing.qty, existing.unit) + toGrams(ing, add.qty, add.unit);
  const exact = g / toGrams(ing, 1, existing.unit);
  const c = clampQty(ing, existing.unit, exact);
  if (Math.abs(c - exact) < 1e-6) return { qty: c, unit: existing.unit };
  // لا تُقرَّب الكمية لأعلى بصمت: نحوّل لوحدة أدق (حبة للبيض وإلا غرام) فيبقى المجموع دقيقًا
  const fine: SaleUnit = ing.piece_g ? 'piece' : 'g';
  return { qty: clampQty(ing, fine, g / toGrams(ing, 1, fine)), unit: fine };
}

/* ───── السلة ───── */
export interface CartLineView extends CartLine { store: string; price_rm: number | null; line_rm: number | null; nutrition: NutritionVector; grossG: number; point: PricePoint | null }
export interface CartTotals { lines: CartLineView[]; total_rm: number; nutrition: NutritionVector; grossG: number; unpriced: string[]; confidence: Confidence; estimated: boolean }

const CONF: Confidence[] = ['low', 'medium', 'high'];
/** CART-01/02: أسطر مسعّرة ومجاميع مخزون (لا مجموع «يوم») */
export function cartTotals(lines: readonly CartLine[], idx: PriceIndex, selectedStore: string): CartTotals {
  const out: CartLineView[] = lines.map((l) => {
    const store = l.store ?? selectedStore;
    const point = pickPrice(idx, l.ingredient, 'selected_store', store);
    const v = qtyView(l.ingredient, l.qty, l.unit);
    const line_rm = point ? amountRm(l.ingredient, l.qty, l.unit, point.price_rm) : null;
    return { ...l, store, price_rm: point?.price_rm ?? null, line_rm, nutrition: v.nutrition, grossG: v.grossG, point };
  });
  const priced = out.filter((l) => l.point);
  return {
    lines: out,
    total_rm: out.reduce((s, l) => s + (l.line_rm ?? 0), 0),
    nutrition: sum(out.map((l) => l.nutrition)),
    grossG: out.reduce((s, l) => s + l.grossG, 0),
    unpriced: out.filter((l) => !l.point).map((l) => l.ingredient),
    confidence: priced.length ? priced.reduce((w, l) => (CONF.indexOf(l.point!.confidence) < CONF.indexOf(w) ? l.point!.confidence : w), 'high' as Confidence) : 'low',
    estimated: priced.some((l) => l.point!.source === 'estimate_tier' || l.point!.unverified),
  };
}

export interface StoreComparison {
  /** كلفة السلة كاملة في كل سوق (null = ينقصها سعر) */
  perStore: { store: string; total_rm: number | null; missing: string[] }[];
  cheapestStore: string | null;
  /** الفرق بين أغلى وأرخص سوق مكتمل */
  spread_rm: number;
  /** أرخص سوق لكل صنف والتوفير مقابل المتجر المختار */
  perItem: { ingredient: string; cheapest: string; price_rm: number; saving_rm: number }[];
  /** مجموع شراء كل صنف من أرخص سوق له */
  split_total_rm: number;
}
/** CART-03: مقارنة الأسواق الخمسة لكل السلة ولكل صنف */
export function compareStores(lines: readonly CartLine[], idx: PriceIndex, stores: readonly Store[], selectedStore: string): StoreComparison {
  const perStore = stores.map((s) => {
    let total = 0;
    const missing: string[] = [];
    for (const l of lines) {
      const p = pickPrice(idx, l.ingredient, 'selected_store', s.slug);
      if (!p) missing.push(l.ingredient);
      else total += amountRm(l.ingredient, l.qty, l.unit, p.price_rm);
    }
    return { store: s.slug, total_rm: missing.length ? null : total, missing };
  });
  const full = perStore.filter((s) => s.total_rm !== null) as { store: string; total_rm: number; missing: string[] }[];
  const cheapest = full.length ? full.reduce((a, b) => (b.total_rm < a.total_rm ? b : a)) : null;
  const dear = full.length ? full.reduce((a, b) => (b.total_rm > a.total_rm ? b : a)) : null;
  const perItem = lines.flatMap((l) => {
    const row = stores.map((s) => ({ s: s.slug, p: pickPrice(idx, l.ingredient, 'selected_store', s.slug) })).filter((x) => x.p);
    if (!row.length) return [];
    const best = row.reduce((a, b) => (b.p!.price_rm < a.p!.price_rm ? b : a));
    const sel = pickPrice(idx, l.ingredient, 'selected_store', l.store ?? selectedStore);
    return [{ ingredient: l.ingredient, cheapest: best.s, price_rm: best.p!.price_rm, saving_rm: sel ? amountRm(l.ingredient, l.qty, l.unit, sel.price_rm - best.p!.price_rm) : 0 }];
  });
  return { perStore, cheapestStore: cheapest?.store ?? null, spread_rm: cheapest && dear ? dear.total_rm - cheapest.total_rm : 0, perItem, split_total_rm: lines.reduce((s, l) => { const it = perItem.find((x) => x.ingredient === l.ingredient); return s + (it ? amountRm(l.ingredient, l.qty, l.unit, it.price_rm) : 0); }, 0) };
}

/* ───── المخزون (السلة ∪ المخزن) والتغطية ───── */
/** غرامات مشتراة (أو في المخزن) → غرامات صالحة للأكل لمقارنتها بأوزان الوصفات */
export const usableGrams = (slug: string, grossG: number): number => grossG * (INGREDIENT_BY_SLUG.get(slug)?.edible_yield ?? 1);

export function inventoryFrom(cart: readonly CartLine[], pantry: Readonly<Record<string, number>>): Record<string, number> {
  const inv: Record<string, number> = {};
  for (const [slug, g] of Object.entries(pantry)) if (g > 0) inv[slug] = usableGrams(slug, g);
  for (const l of cart) {
    const ing = INGREDIENT_BY_SLUG.get(l.ingredient);
    if (ing) inv[l.ingredient] = (inv[l.ingredient] ?? 0) + edibleGrams(ing, l.qty, l.unit);
  }
  return inv;
}

export interface CoverageDay { day: 1 | 2 | 3; n: number; ok: boolean; law: LawResult; missing: string[] }
export interface Coverage { days: number; detail: CoverageDay[]; /** أول يوم لم يُغطَّ */ blockedBy: CoverageDay | null }
/** CART-05: كم يومًا متتاليًا من دورة الأيام الثلاثة يغطيها المخزون، بإنفاذ LAW على كل يوم */
export function coverageDays(inventory: Readonly<Record<string, number>>, maxDays = 30): Coverage {
  const inv = { ...inventory };
  const detail: CoverageDay[] = [];
  for (let n = 1; n <= maxDays; n++) {
    const d = CYCLE[(n - 1) % CYCLE.length]!;
    const slots = Object.fromEntries(d.meals.map((m) => [m.slot, nutritionOf(m.lines).total]));
    const law = evaluateDay(slots);
    const need = new Map<string, number>();
    for (const m of d.meals) for (const l of m.lines) if (l.amount_g) need.set(l.ingredient, (need.get(l.ingredient) ?? 0) + l.amount_g);
    const missing = [...need].filter(([s, g]) => (TINY.has(s) ? (inv[s] ?? 0) <= 0 : (inv[s] ?? 0) + 1e-9 < g)).map(([s]) => s);
    const row: CoverageDay = { day: d.day, n, ok: law.ok && law.status === 'VALID' && missing.length === 0, law, missing };
    detail.push(row);
    if (!row.ok) return { days: n - 1, detail, blockedBy: row };
    for (const [s, g] of need) if (!TINY.has(s)) inv[s] = (inv[s] ?? 0) - g;
  }
  return { days: maxDays, detail, blockedBy: null };
}

/* ───── الكتالوج (A1-20…22) ───── */
export type CatalogSort = 'name' | 'price' | 'kcal100' | 'protein_per_rm' | 'usage';
export interface CatalogFilter {
  q?: string;
  category?: Category | null;
  /** سعر وحدة البيع (min,max) */
  priceMin?: number;
  priceMax?: number;
  inPantry?: ReadonlySet<string> | null;
  inCart?: ReadonlySet<string> | null;
  recipe?: string | null;
  highProtein?: boolean;
  highFiber?: boolean;
  lowKcal?: boolean;
  sort?: CatalogSort;
}
/** عتبات «مرتفع/منخفض» لكل 100 غ — مرشحات عرض لا أحكام صحية */
export const NUTRI_THRESH = Object.freeze({ protein: 10, fiber: 3, kcalLow: 60 } as const);

const RECIPE_USAGE: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>();
  for (const r of ORIGINAL_RECIPES) for (const s of new Set(r.lines.map((l) => l.ingredient))) m.set(s, (m.get(s) ?? 0) + 1);
  return m;
})();
export const recipeUsage = (slug: string): number => RECIPE_USAGE.get(slug) ?? 0;

export function filterCatalog(idx: PriceIndex, store: string, f: CatalogFilter): Ingredient[] {
  const hits = f.q && normalizeAr(f.q) ? searchIngredients(f.q, INGREDIENTS).map((h) => h.item) : [...INGREDIENTS];
  const recipeSlugs = f.recipe ? new Set(ORIGINAL_RECIPES.find((r) => r.slug === f.recipe)?.lines.map((l) => l.ingredient) ?? []) : null;
  const price = (i: Ingredient): number | null => pickPrice(idx, i.slug, 'selected_store', store)?.price_rm ?? null;
  const out = hits.filter((i) => {
    if (f.category && i.category !== f.category) return false;
    const p = price(i);
    if (f.priceMin !== undefined && (p === null || p < f.priceMin)) return false;
    if (f.priceMax !== undefined && (p === null || p > f.priceMax)) return false;
    if (f.inPantry && !f.inPantry.has(i.slug)) return false;
    if (f.inCart && !f.inCart.has(i.slug)) return false;
    if (recipeSlugs && !recipeSlugs.has(i.slug)) return false;
    const n = per100g(i.slug);
    if (f.highProtein && n.protein_g < NUTRI_THRESH.protein) return false;
    if (f.highFiber && n.fiber_g < NUTRI_THRESH.fiber) return false;
    if (f.lowKcal && n.kcal > NUTRI_THRESH.kcalLow) return false;
    return true;
  });
  const sort = f.sort ?? (f.q ? undefined : 'name');
  if (!sort) return out; // ترتيب صلة البحث
  const proteinPerRm = (i: Ingredient): number => {
    const p = price(i);
    if (!p) return -1;
    return (per100g(i.slug).protein_g * (toGrams(i, 1) * i.edible_yield / 100)) / p;
  };
  const cmp: Record<CatalogSort, (a: Ingredient, b: Ingredient) => number> = {
    name: (a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'),
    price: (a, b) => (price(a) ?? Infinity) - (price(b) ?? Infinity),
    kcal100: (a, b) => per100g(a.slug).kcal - per100g(b.slug).kcal,
    protein_per_rm: (a, b) => proteinPerRm(b) - proteinPerRm(a),
    usage: (a, b) => recipeUsage(b.slug) - recipeUsage(a.slug),
  };
  return [...out].sort(cmp[sort]);
}

export { ZERO, packsFor };
export type { PriceMode };
