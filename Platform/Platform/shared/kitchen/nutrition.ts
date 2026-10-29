/** محرك التغذية (NUT): Σ قيم/100غ × الوزن ÷ 100 من الجدول القانوني S4 بالأوزان الخام/الجافة. */
import { INGREDIENT_BY_SLUG } from './data/ingredients.js';
import { NUTRITION_PER_100G } from './data/nutrition.js';
import type { NutritionVector, Profile, RecipeLine } from './types.js';

export const ZERO: NutritionVector = Object.freeze({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

export function add(a: NutritionVector, b: NutritionVector): NutritionVector {
  return { kcal: a.kcal + b.kcal, protein_g: a.protein_g + b.protein_g, carbs_g: a.carbs_g + b.carbs_g, fat_g: a.fat_g + b.fat_g, fiber_g: a.fiber_g + b.fiber_g };
}
export function scale(a: NutritionVector, k: number): NutritionVector {
  return { kcal: a.kcal * k, protein_g: a.protein_g * k, carbs_g: a.carbs_g * k, fat_g: a.fat_g * k, fiber_g: a.fiber_g * k };
}
export const sum = (xs: NutritionVector[]): NutritionVector => xs.reduce(add, ZERO);

/** القيم لكل 100 غ لمكوّن بملف معيّن (الافتراضي ملف المكوّن). يرمي خطأً لمكوّن خارج القائمة المقفلة. */
export function per100g(slug: string, profile?: Profile): NutritionVector {
  const ing = INGREDIENT_BY_SLUG.get(slug);
  const row = NUTRITION_PER_100G[slug];
  if (!ing || !row) throw new Error(`مكوّن خارج القائمة المقفلة: ${slug}`);
  const p = row[profile ?? ing.profile] ?? row[ing.profile];
  if (!p) throw new Error(`لا ملف غذائي «${profile}» للمكوّن ${slug}`);
  return p;
}

/** تغذية سطر واحد. السطر بلا كمية (null) يُحسب صفرًا ويُعلَّم بـ unmeasured. */
export const lineNutrition = (l: RecipeLine): NutritionVector => (l.amount_g === null ? ZERO : scale(per100g(l.ingredient, l.profile), l.amount_g / 100));

export interface NutritionResult { total: NutritionVector; unmeasured: string[] }
/** NUT-01 */
export function nutritionOf(lines: readonly RecipeLine[]): NutritionResult {
  return { total: sum(lines.map(lineNutrition)), unmeasured: lines.filter((l) => l.amount_g === null).map((l) => l.ingredient) };
}

/** NUT-03 تحقق أتووتر: |kcal − (4P+4C+9F)| / kcal — للتحذير في التطوير فقط، لا للحكم. */
export function atwaterDeviation(n: NutritionVector): number {
  if (n.kcal <= 0) return 0;
  return Math.abs(n.kcal - (4 * n.protein_g + 4 * n.carbs_g + 9 * n.fat_g)) / n.kcal;
}

/** NUT-04: kcal عدد صحيح، والماكروز خانة عشرية واحدة (للعرض). */
export function roundForDisplay(n: NutritionVector): NutritionVector {
  const r1 = (x: number): number => Math.round(x * 10) / 10;
  return { kcal: Math.round(n.kcal), protein_g: r1(n.protein_g), carbs_g: r1(n.carbs_g), fat_g: r1(n.fat_g), fiber_g: r1(n.fiber_g) };
}
