/** محرك الجدوى «ماذا أستطيع أن أطبخ؟» (FEA, 4.8): من المخزون (السلة ∪ المخزن) ووصفة. */
import { INGREDIENT_BY_SLUG, TINY } from './data/ingredients.js';
import { pickPrice, pricePerGram, type PriceIndex, type PriceMode } from './cost.js';
import type { Recipe } from './types.js';

export type FeaStatus = 'ready' | 'missing' | 'impossible' | 'excluded';
export interface MissingItem { ingredient: string; /** null = مكوّن «قليل» بلا كمية محددة */ grams: number | null }
export interface Feasibility {
  status: FeaStatus;
  servings: number;
  limiting: string | null;
  missing: MissingItem[];
  /** تكلفة إكمال حصة واحدة من السوق المختار (null إن تعذّر تسعير شيء) */
  completionCost: number | null;
}

export function feasibility(recipe: Recipe, inventory: Readonly<Record<string, number>>, price?: { idx: PriceIndex; store: string; mode?: PriceMode }): Feasibility {
  // FEA-04: الوصفات المعيبة تُعرض بشارة ولا تدخل الحسابات
  if (recipe.status === 'needs_quantities' || recipe.status === 'body_mismatch_title' || recipe.status === 'proposed') return { status: 'excluded', servings: 0, limiting: null, missing: [], completionCost: null };
  let minRatio = Infinity;
  let limiting: string | null = null;
  const missing: MissingItem[] = [];
  for (const l of recipe.lines) {
    const have = inventory[l.ingredient] ?? 0;
    if (l.amount_g === null || TINY.has(l.ingredient)) {
      if (have <= 0) {
        missing.push({ ingredient: l.ingredient, grams: l.amount_g });
        minRatio = 0;
        limiting ??= l.ingredient;
      }
      continue;
    }
    const ratio = have / l.amount_g;
    if (ratio < minRatio) {
      minRatio = ratio;
      limiting = l.ingredient;
    }
    if (have < l.amount_g) missing.push({ ingredient: l.ingredient, grams: l.amount_g - have });
  }
  const servings = minRatio === Infinity ? 1 : Math.floor(minRatio + 1e-9);
  let completionCost: number | null = 0;
  if (price) {
    for (const m of missing) {
      const p = pickPrice(price.idx, m.ingredient, price.mode ?? 'selected_store', price.store);
      if (!p || m.grams === null) {
        completionCost = null;
        break;
      }
      completionCost += (m.grams / (INGREDIENT_BY_SLUG.get(m.ingredient)?.edible_yield || 1)) * pricePerGram(m.ingredient, p.price_rm);
    }
  } else completionCost = null;
  const status: FeaStatus = servings >= 1 ? 'ready' : missing.length <= 3 ? 'missing' : 'impossible';
  return { status, servings, limiting: servings >= 1 ? limiting : (missing[0]?.ingredient ?? limiting), missing, completionCost };
}
