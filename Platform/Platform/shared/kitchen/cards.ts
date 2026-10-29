/**
 * بطاقات الوجبات (A2): الإحصاءات الست والتقييم والندرة بمعادلات MC-10 (6.2). لعبة ومقارنة داخل المنصة لا نصيحة طبية.
 * المعاملات هنا وحدها؛ ECO مرجعها ثابت من تكلفة دورة الأيام الثلاثة ببذرة S3 (فلا يتغير بتغيّر السعر الحيّ إلا ECO نفسها).
 */
import { INGREDIENT_BY_SLUG } from './data/ingredients.js';
import { CYCLE } from './data/cycle.js';
import { SEED_PRICES } from './data/prices.js';
import { DEFAULT_STORE } from './data/stores.js';
import { ORIGINAL_RECIPES } from './data/recipes.js';
import { indexPrices, mealCost, type PriceIndex } from './cost.js';
import { feasibility, type Feasibility } from './feasibility.js';
import { nutritionOf } from './nutrition.js';
import type { Confidence, MealType, NutritionVector, Recipe, RecipeLine } from './types.js';

export const CARD_COEF = Object.freeze({
  eng: 1 / 8, pro: 2.2, car: 0.9, fat: 2.4, fib: 9, ecoBase: 60, ecoExp: 0.5,
  w: { pro: 0.3, fib: 0.2, eco: 0.2, bal: 0.15, comp: 0.15 },
  balance: { carbShare: 0.5, fatShare: 0.3, k: 140 },
  complete: { protein_g: 15, veg_g: 80, starch_g: 30 },
  rarity: { iconic: 85, gold: 70, silver: 55 },
} as const);

const clamp = (n: number): number => Math.min(99, Math.max(1, Math.round(n)));
export type Rarity = 'bronze' | 'silver' | 'gold' | 'iconic';
export const RARITY_LABEL: Readonly<Record<Rarity, string>> = Object.freeze({ bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', iconic: 'أيقوني' });

export interface CardStats { ENG: number; PRO: number; CAR: number; FAT: number; FIB: number; /** null = تكلفة غير معروفة */ ECO: number | null; OVR: number }

/** مرجع ECO: kcal لكل رينغيت في متوسط يوم الدورة ببذرة المتجر الافتراضي */
export const REF_KCAL_PER_RM: number = (() => {
  const idx = indexPrices(SEED_PRICES);
  let kcal = 0;
  let rm = 0;
  for (const d of CYCLE) for (const m of d.meals) {
    kcal += nutritionOf(m.lines).total.kcal;
    rm += mealCost(m.lines, idx, { store: DEFAULT_STORE }).total_rm;
  }
  return kcal / rm;
})();

/** غرامات الخضار (بلا البطاطا: نشويات) والنشويات من أسطر الوصفة — للاكتمال */
export function groupGrams(lines: readonly RecipeLine[]): { veg: number; starch: number } {
  let veg = 0;
  let starch = 0;
  for (const l of lines) {
    const ing = INGREDIENT_BY_SLUG.get(l.ingredient);
    if (!ing || !l.amount_g) continue;
    if (ing.slug === 'potato' || ing.category === 'حبوب ونشويات' || ing.category === 'مخبوزات') starch += l.amount_g;
    else if (ing.category === 'خضروات' && !['garlic', 'ginger', 'coriander'].includes(ing.slug)) veg += l.amount_g;
  }
  return { veg, starch };
}

/** MC-10: الإحصاءات من التغذية والتكلفة الحيّتين. cost_rm = null → ECO غير معروفة ويُعاد توزيع وزنها (لا نخمّن). */
export function cardStats(n: NutritionVector, cost_rm: number | null, lines: readonly RecipeLine[]): CardStats {
  const C = CARD_COEF;
  const kcal = Math.max(n.kcal, 1);
  const carbShare = (n.carbs_g * 4) / kcal;
  const fatShare = (n.fat_g * 9) / kcal;
  const balance = 99 - Math.min(99, Math.abs(carbShare - C.balance.carbShare) * C.balance.k + Math.abs(fatShare - C.balance.fatShare) * C.balance.k);
  const g = groupGrams(lines);
  const completeness = 33 * +(n.protein_g >= C.complete.protein_g) + 33 * +(g.veg >= C.complete.veg_g) + 33 * +(g.starch >= C.complete.starch_g);
  const PRO = clamp(n.protein_g * C.pro);
  const FIB = clamp(n.fiber_g * C.fib);
  const ECO = cost_rm && cost_rm > 0 ? clamp(C.ecoBase * Math.sqrt(n.kcal / cost_rm / REF_KCAL_PER_RM)) : null;
  const w = C.w;
  const OVR = ECO === null
    ? clamp((w.pro * PRO + w.fib * FIB + w.bal * balance + w.comp * completeness) / (1 - w.eco))
    : clamp(w.pro * PRO + w.fib * FIB + w.eco * ECO + w.bal * balance + w.comp * completeness);
  return { ENG: clamp(n.kcal * C.eng), PRO, CAR: clamp(n.carbs_g * C.car), FAT: clamp(n.fat_g * C.fat), FIB, ECO, OVR };
}

export const rarityOf = (ovr: number): Rarity => (ovr >= CARD_COEF.rarity.iconic ? 'iconic' : ovr >= CARD_COEF.rarity.gold ? 'gold' : ovr >= CARD_COEF.rarity.silver ? 'silver' : 'bronze');

export type CardBadge = 'original' | 'custom' | 'mini' | 'needs_quantities' | 'text_duplicate' | 'proposed';
export const BADGE_LABEL: Readonly<Record<CardBadge, string>> = Object.freeze({ original: 'أصلية', custom: 'ابتكاري', mini: 'مصغّرة', needs_quantities: 'ينقصها أوزان', text_duplicate: 'نص مطابق لوصفة أخرى', proposed: 'مقترحة' });

export interface CardView {
  slug: string;
  title_ar: string;
  meal_types: MealType[];
  origin: Recipe['origin'];
  badges: CardBadge[];
  /** ln-02 ونحوها لا تُحسب (A2-26) */
  computable: boolean;
  nutrition: NutritionVector | null;
  cost_rm: number | null;
  confidence: Confidence;
  estimated: boolean;
  stats: CardStats | null;
  rarity: Rarity | null;
  totalG: number;
  ingredientCount: number;
  mainIngredient: string | null;
  recipe: Recipe;
}

export function cardOf(r: Recipe, idx: PriceIndex, store: string): CardView {
  const computable = r.status !== 'needs_quantities' && r.status !== 'proposed' && r.lines.some((l) => l.amount_g);
  const badges: CardBadge[] = [r.origin === 'board' ? 'original' : r.origin === 'variant' ? 'mini' : 'custom'];
  if (r.status === 'needs_quantities') badges.push('needs_quantities');
  if (r.status === 'body_mismatch_title') badges.push('text_duplicate');
  if (r.status === 'proposed') badges.push('proposed');
  const measured = r.lines.filter((l) => l.amount_g);
  const main = measured.length ? measured.reduce((a, b) => (b.amount_g! > a.amount_g! ? b : a)).ingredient : null;
  if (!computable) return { slug: r.slug, title_ar: r.title_ar, meal_types: r.meal_types, origin: r.origin, badges, computable, nutrition: null, cost_rm: null, confidence: 'low', estimated: true, stats: null, rarity: null, totalG: 0, ingredientCount: r.lines.length, mainIngredient: main, recipe: r };
  const n = nutritionOf(r.lines).total;
  const c = mealCost(r.lines, idx, { store });
  const cost = c.missing.length ? null : c.total_rm;
  const stats = cardStats(n, cost, r.lines);
  return { slug: r.slug, title_ar: r.title_ar, meal_types: r.meal_types, origin: r.origin, badges, computable, nutrition: n, cost_rm: cost, confidence: c.confidence, estimated: c.estimated, stats, rarity: rarityOf(stats.OVR), totalG: measured.reduce((s, l) => s + l.amount_g!, 0), ingredientCount: r.lines.length, mainIngredient: main, recipe: r };
}

export const ORIGINAL_CARDS = (idx: PriceIndex, store: string): CardView[] => ORIGINAL_RECIPES.map((r) => cardOf(r, idx, store));

/** A2-21 «أستطيع طبخها الآن» وCART-04: تصنيف الجدوى لكل بطاقة */
export function cardFeasibility(c: CardView, inventory: Readonly<Record<string, number>>, price?: Parameters<typeof feasibility>[2]): Feasibility {
  return feasibility(c.recipe, inventory, price);
}

/** مقارنة بطاقتين (A2-22): فروق الإحصاءات والتكلفة والسعرات */
export function compareCards(a: CardView, b: CardView): { stat: keyof CardStats; a: number | null; b: number | null }[] {
  const keys: (keyof CardStats)[] = ['OVR', 'ENG', 'PRO', 'CAR', 'FAT', 'FIB', 'ECO'];
  return keys.map((k) => ({ stat: k, a: a.stats?.[k] ?? null, b: b.stats?.[k] ?? null }));
}
