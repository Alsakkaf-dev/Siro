/**
 * مقسّم الحصص (SCL, 4.7): شرط لاستخدام البطاقات في الجدول تحت القانون.
 * معامل واحد k لكل الوجبات، تقريب الأوزان (5 غ لما ≥ 20 غ، و1 غ لما دونه، ولا وزن يصير صفرًا)،
 * ثم إعادة الحساب الفعلي بعد التقريب؛ وإن خرج عن المجال يُبحث عن k بخطوات 0.01 داخل الحدود.
 * الناتج نسخة جديدة دائمًا؛ الوصفة الأصلية لا تُمسّ (SCL-03/N-12).
 */
import { LAW, LAW_TARGET, evaluateDay, withinLaw, type LawResult } from './law.js';
import { nutritionOf, sum } from './nutrition.js';
import type { NutritionVector, RecipeLine } from './types.js';

export interface ScaleMeal { slot: string; lines: readonly RecipeLine[] }
export interface ScaledMeal { slot: string; lines: RecipeLine[]; nutrition: NutritionVector }
export interface ScaleOptions { target?: number; minScale?: number; maxScale?: number }
export interface ScaledDay {
  ok: boolean;
  k: number;
  meals: ScaledMeal[];
  total: NutritionVector;
  law: LawResult;
  /** سبب الاستحالة بالعربية (AC-08) */
  reason?: string;
  /** أصغر وأكبر مجموع ممكن بحدود الحصص */
  range: { min: number; max: number };
}

export function roundGrams(g: number): number {
  const step = g >= 20 ? 5 : 1;
  return Math.max(1, Math.round(g / step) * step);
}

export const scaleLines = (lines: readonly RecipeLine[], k: number): RecipeLine[] => lines.map((l) => (l.amount_g === null ? { ...l } : { ...l, amount_g: roundGrams(l.amount_g * k) }));

function at(meals: readonly ScaleMeal[], k: number): { meals: ScaledMeal[]; total: NutritionVector } {
  const out = meals.map((m) => {
    const lines = scaleLines(m.lines, k);
    return { slot: m.slot, lines, nutrition: nutritionOf(lines).total };
  });
  return { meals: out, total: sum(out.map((m) => m.nutrition)) };
}

const r2 = (x: number): number => Math.round(x * 100) / 100;

export function scaleDay(meals: readonly ScaleMeal[], opts: ScaleOptions = {}): ScaledDay {
  const target = opts.target ?? LAW_TARGET;
  const minK = opts.minScale ?? 0.4;
  const maxK = opts.maxScale ?? 1.5;
  const slotsOf = (ms: ScaledMeal[]): Record<string, NutritionVector> => Object.fromEntries(ms.map((m) => [m.slot, m.nutrition]));
  const lo = at(meals, minK).total.kcal;
  const hi = at(meals, maxK).total.kcal;
  const base = sum(meals.map((m) => nutritionOf(m.lines).total)).kcal;
  if (base <= 0) {
    const z = at(meals, 1);
    return { ok: false, k: 1, ...z, law: evaluateDay(slotsOf(z.meals)), reason: 'لا سعرات محسوبة في الوجبات المختارة (أوزان غير معروفة).', range: { min: lo, max: hi } };
  }
  const k0 = r2(Math.min(maxK, Math.max(minK, target / base)));
  let best = { k: k0, ...at(meals, k0) };
  if (!withinLaw(best.total.kcal)) {
    let found: typeof best | null = null;
    for (let i = Math.round(minK * 100); i <= Math.round(maxK * 100); i++) {
      const k = i / 100;
      const c = { k, ...at(meals, k) };
      if (withinLaw(c.total.kcal) && (!found || Math.abs(c.total.kcal - target) < Math.abs(found.total.kcal - target))) found = c;
    }
    if (found) best = found;
  }
  const law = evaluateDay(slotsOf(best.meals));
  if (law.ok && withinLaw(best.total.kcal)) return { ok: true, k: best.k, meals: best.meals, total: best.total, law, range: { min: lo, max: hi } };
  const reason = hi < LAW.MIN
    ? `غير ممكن: أكبر مجموع بحصة ×${maxK} هو ${Math.round(hi)} سعرة، أقل من ${LAW.MIN}.`
    : lo > LAW.MAX
      ? `غير ممكن: أصغر مجموع بحصة ×${minK} هو ${Math.round(lo)} سعرة، أعلى من ${LAW.MAX}.`
      : 'غير ممكن بتقريب الأوزان المتاح؛ جرّب استبدال بطاقة.';
  return { ok: false, k: best.k, meals: best.meals, total: best.total, law, reason, range: { min: lo, max: hi } };
}
