/**
 * إثراء المطبخ (K-M12، API-10/11/21): تطبيع استجابات الواجهات الخارجية إلى «لكل 100 غرام» ومقارنتها بجدول S4 المحلي.
 * القاعدة API-21: أي اختلاف لا يُطبَّق تلقائيًا؛ يُعرض كـ«اقتراح تحديث قيمة» مع المصدر ويقرّره المالك. نقي بلا شبكة.
 */
import { NUTRITION_PER_100G } from './data/nutrition.js';
import { INGREDIENT_BY_SLUG } from './data/ingredients.js';
import type { NutritionVector } from './types.js';

export type EnrichSource = 'usda' | 'off' | 'mock';
export interface Per100 { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }
export interface FoodHit { id: string; name: string; source: EnrichSource; /** وسم الثقة: الملصق أو USDA */ basis: string; per100: Per100 | null; data_type?: string }

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const USDA_NUM: Record<string, keyof Per100> = { '208': 'kcal', '203': 'protein_g', '205': 'carbs_g', '204': 'fat_g', '291': 'fiber_g' };

/** استجابة USDA FoodData Central /foods/search (الشكل الموثّق؛ غير مُتحقَّق منه حيًّا هنا) */
export function parseUsdaSearch(j: unknown): FoodHit[] {
  const foods = (j as { foods?: unknown[] } | null)?.foods;
  if (!Array.isArray(foods)) throw new Error('شكل استجابة USDA غير متوقع');
  return foods.slice(0, 10).flatMap((f) => {
    const o = f as { fdcId?: unknown; description?: unknown; dataType?: unknown; foodNutrients?: unknown[] };
    if (typeof o.description !== 'string' || (typeof o.fdcId !== 'number' && typeof o.fdcId !== 'string')) return [];
    const p: Partial<Per100> = {};
    for (const n of Array.isArray(o.foodNutrients) ? (o.foodNutrients as { nutrientNumber?: unknown; nutrientId?: unknown; value?: unknown; unitName?: unknown }[]) : []) {
      const key = USDA_NUM[String(n.nutrientNumber ?? n.nutrientId ?? '')];
      const val = num(n.value);
      if (key && val !== null && (key !== 'kcal' || String(n.unitName ?? 'KCAL').toUpperCase() === 'KCAL')) p[key] = val;
    }
    const full = (['kcal', 'protein_g', 'carbs_g', 'fat_g'] as const).every((k) => p[k] !== undefined);
    return [{ id: String(o.fdcId), name: o.description, source: 'usda' as const, basis: `USDA ${typeof o.dataType === 'string' ? o.dataType : ''}`.trim(), per100: full ? { kcal: p.kcal!, protein_g: p.protein_g!, carbs_g: p.carbs_g!, fat_g: p.fat_g!, fiber_g: p.fiber_g ?? 0 } : null, ...(typeof o.dataType === 'string' ? { data_type: o.dataType } : {}) }];
  });
}

/** استجابة Open Food Facts /api/v2/product/<barcode> — القيم «من الملصق» وجودتها متفاوتة */
export function parseOffProduct(j: unknown): FoodHit | null {
  const o = j as { status?: unknown; code?: unknown; product?: { product_name?: unknown; nutriments?: Record<string, unknown> } } | null;
  if (!o || o.status !== 1 || !o.product) return null;
  const n = o.product.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g']);
  const protein = num(n['proteins_100g']);
  const carbs = num(n['carbohydrates_100g']);
  const fat = num(n['fat_100g']);
  const name = typeof o.product.product_name === 'string' && o.product.product_name ? o.product.product_name : '(بلا اسم)';
  const per100 = kcal !== null && protein !== null && carbs !== null && fat !== null ? { kcal, protein_g: protein, carbs_g: carbs, fat_g: fat, fiber_g: num(n['fiber_100g']) ?? 0 } : null;
  return { id: String(o.code ?? ''), name, source: 'off', basis: 'من الملصق (Open Food Facts)', per100 };
}

export interface Delta { field: keyof Per100; seed: number; external: number; diff: number; pct: number | null }
export interface Suggestion {
  ingredient: string;
  name_ar: string;
  source: EnrichSource;
  hit: string;
  basis: string;
  /** لا يُطبَّق أبدًا تلقائيًا (API-21) */
  auto_applied: false;
  deltas: Delta[];
  /** أي حقل تجاوز العتبة: يستحق نظرة المالك */
  worth_review: boolean;
}
const FIELDS: (keyof Per100)[] = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];
/** مقارنة قيمة خارجية بجدول S4 (لكل 100 غرام صالحة؛ الملف الافتراضي للمكوّن) — العتبة 10% للسعرات و15% لغيرها مع حدّ مطلق صغير */
export function compareToSeed(slug: string, hit: FoodHit): Suggestion | null {
  const ing = INGREDIENT_BY_SLUG.get(slug);
  const seed: NutritionVector | undefined = NUTRITION_PER_100G[slug]?.[ing?.profile ?? 'raw'] ?? Object.values(NUTRITION_PER_100G[slug] ?? {})[0];
  if (!ing || !seed || !hit.per100) return null;
  const deltas: Delta[] = FIELDS.map((f) => {
    const s = seed[f];
    const e = hit.per100![f];
    return { field: f, seed: s, external: e, diff: Math.round((e - s) * 100) / 100, pct: s > 0 ? Math.round(((e - s) / s) * 1000) / 10 : null };
  });
  const worth = deltas.some((d) => (d.field === 'kcal' ? Math.abs(d.diff) > 10 && Math.abs(d.pct ?? 100) > 10 : Math.abs(d.diff) > 2 && Math.abs(d.pct ?? 100) > 15));
  return { ingredient: slug, name_ar: ing.name_ar, source: hit.source, hit: hit.name, basis: hit.basis, auto_applied: false, deltas, worth_review: worth };
}
