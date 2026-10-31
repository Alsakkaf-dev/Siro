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

export interface FlexScaledDay extends ScaledDay {
  /** معامل كل وجبة (متطابق عند الحل بمعامل واحد) */
  ks: number[];
  uniform: boolean;
}

/**
 * ملاءمة تلقائية بمعامل واحد أولًا، وإن استحال فبمعامل لكل وجبة (شبكة 0.05 داخل الحدود) باختيار أقرب مجموع إلى الهدف مع أقل تباين بين المعاملات.
 * AC-08: تُرجع يومًا داخل المجال كلما كان ممكنًا رياضيًا بالبطاقات المختارة، وإلا «غير ممكن» مع السبب.
 */
export function scaleDayFlexible(meals: readonly ScaleMeal[], opts: ScaleOptions = {}): FlexScaledDay {
  const uni = scaleDay(meals, opts);
  if (uni.ok) return { ...uni, ks: meals.map(() => uni.k), uniform: true };
  const target = opts.target ?? LAW_TARGET;
  const minK = opts.minScale ?? 0.4;
  const maxK = opts.maxScale ?? 1.5;
  const grid: number[] = [];
  for (let i = Math.round(minK * 20); i <= Math.round(maxK * 20); i++) grid.push(i / 20);
  const kcal = meals.map((m) => grid.map((k) => nutritionOf(scaleLines(m.lines, k)).total.kcal));
  let best: { ks: number[]; score: number } | null = null;
  const pick = (i: number, ks: number[], total: number): void => {
    if (i === meals.length) {
      if (!withinLaw(total)) return;
      const spread = Math.max(...ks) - Math.min(...ks);
      const score = Math.abs(total - target) + spread * 200;
      if (!best || score < best.score) best = { ks: [...ks], score };
      return;
    }
    for (let j = 0; j < grid.length; j++) {
      ks[i] = grid[j]!;
      pick(i + 1, ks, total + kcal[i]![j]!);
    }
  };
  if (meals.length && meals.length <= 4) pick(0, [], 0);
  const found = best as { ks: number[]; score: number } | null;
  if (!found) return { ...uni, ks: meals.map(() => uni.k), uniform: true };
  const out = meals.map((m, i) => {
    const lines = scaleLines(m.lines, found.ks[i]!);
    return { slot: m.slot, lines, nutrition: nutritionOf(lines).total };
  });
  const total = sum(out.map((m) => m.nutrition));
  const law = evaluateDay(Object.fromEntries(out.map((m) => [m.slot, m.nutrition])));
  return { ok: law.ok && withinLaw(total.kcal), k: r2(found.ks.reduce((a, b) => a + b, 0) / found.ks.length), meals: out, total, law, range: uni.range, ks: found.ks, uniform: false };
}
