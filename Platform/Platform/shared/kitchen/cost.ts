/** محرك التكلفة (COST): سعر الغرام من سعر وحدة البيع، وتكلفة الوجبة الحدّية بمراعاة نسبة الصالح للأكل. */
import { INGREDIENT_BY_SLUG } from './data/ingredients.js';
import { toGrams } from './units.js';
import type { Confidence, PricePoint, RecipeLine } from './types.js';

export type PriceMode = 'selected_store' | 'cheapest' | 'average';
const CONF_ORDER: Confidence[] = ['low', 'medium', 'high'];

/** فهرس أسعار: مكوّن ← متجر ← نقطة سعر */
export type PriceIndex = ReadonlyMap<string, ReadonlyMap<string, PricePoint>>;
export function indexPrices(points: readonly PricePoint[]): PriceIndex {
  const m = new Map<string, Map<string, PricePoint>>();
  for (const p of points) {
    let row = m.get(p.ingredient);
    if (!row) m.set(p.ingredient, (row = new Map()));
    row.set(p.store, p);
  }
  return m;
}

/** نقطة السعر المعتمدة لمكوّن بحسب الوضع (COST-03). average تُرجع نقطة مركّبة بأدنى ثقة. */
export function pickPrice(idx: PriceIndex, slug: string, mode: PriceMode, store: string): PricePoint | null {
  const row = idx.get(slug);
  if (!row || row.size === 0) return null;
  if (mode === 'selected_store') return row.get(store) ?? null;
  const all = [...row.values()];
  if (mode === 'cheapest') return all.reduce((a, b) => (b.price_rm < a.price_rm ? b : a));
  const avg = all.reduce((s, p) => s + p.price_rm, 0) / all.length;
  return { ...all[0]!, store: '*', price_rm: avg, price_min: Math.min(...all.map((p) => p.price_min)), price_max: Math.max(...all.map((p) => p.price_max)), confidence: minConfidence(all.map((p) => p.confidence)), unverified: all.some((p) => p.unverified) };
}

/** سعر الغرام المشترى (COST-01): سعر وحدة البيع ÷ غرامات وحدة البيع */
export function pricePerGram(slug: string, price_rm: number): number {
  const ing = INGREDIENT_BY_SLUG.get(slug);
  if (!ing) throw new Error(`مكوّن خارج القائمة المقفلة: ${slug}`);
  return price_rm / toGrams(ing, 1);
}

export const minConfidence = (cs: Confidence[]): Confidence => (cs.length ? cs.reduce((w, c) => (CONF_ORDER.indexOf(c) < CONF_ORDER.indexOf(w) ? c : w), 'high') : 'low');

export interface CostResult {
  /** تكلفة الوجبة الحدّية بالرينغيت (COST-02) */
  total_rm: number;
  /** أدنى ثقة بين المكوّنات (COST-04) */
  confidence: Confidence;
  /** أي مكوّن تقديري أو غير متحقَّق → شارة «تقديري» */
  estimated: boolean;
  /** مكوّنات بلا سعر في الوضع المختار */
  missing: string[];
}

/** COST-02: Σ (غرامات الاستعمال ÷ نسبة الصالح للأكل × سعر الغرام). الأسطر بلا كمية لا تُكلَّف. */
export function mealCost(lines: readonly RecipeLine[], idx: PriceIndex, opts: { mode?: PriceMode; store: string }): CostResult {
  let total = 0;
  const confs: Confidence[] = [];
  const missing: string[] = [];
  let estimated = false;
  for (const l of lines) {
    if (l.amount_g === null || l.amount_g === 0) continue;
    const p = pickPrice(idx, l.ingredient, opts.mode ?? 'selected_store', opts.store);
    if (!p) {
      missing.push(l.ingredient);
      continue;
    }
    const ing = INGREDIENT_BY_SLUG.get(l.ingredient)!;
    total += (l.amount_g / (ing.edible_yield || 1)) * pricePerGram(l.ingredient, p.price_rm);
    confs.push(p.confidence);
    if (p.source === 'estimate_tier' || p.unverified) estimated = true;
  }
  return { total_rm: total, confidence: minConfidence(confs), estimated, missing };
}

/** تكلفة الشراء بالعبوات الكاملة لكمية من وحدة البيع (COST-02 «تكلفة الشراء») */
export const purchaseCost = (qtyUnits: number, p: Pick<PricePoint, 'price_rm'>): number => qtyUnits * p.price_rm;
