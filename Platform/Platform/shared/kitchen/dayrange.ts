/** نطاق الجدوى لليوم غير المكتمل (CAL-35) وبصمة البطاقة (CAL-50). نقي. */
import { LAW, canComplete } from './law.js';
import { nutritionOf } from './nutrition.js';
import { scaleLines } from './scaler.js';
import type { RecipeLine } from './types.js';

export interface FeasibleRange { min: number; max: number; /** هل يمكن الوصول إلى المجال القانوني بالبطاقات المتاحة */ reachable: boolean; message: string | null }

const kcalAt = (lines: readonly RecipeLine[], k: number): number => nutritionOf(scaleLines(lines, k)).total.kcal;

/**
 * partialKcal = مجموع الخانات المعبّأة، emptySlots = عدد الخانات الفارغة، pool = بطاقات متاحة (أوزانها).
 * لكل خانة فارغة: أصغر سعرات ممكنة (أصغر بطاقة بأصغر حصة) وأكبرها (أكبر بطاقة بأكبر حصة).
 */
export function feasibleRange(partialKcal: number, emptySlots: number, pool: readonly { lines: readonly RecipeLine[] }[], minK = 0.4, maxK = 1.5): FeasibleRange {
  if (emptySlots <= 0) return { min: partialKcal, max: partialKcal, reachable: partialKcal >= LAW.MIN && partialKcal <= LAW.MAX, message: null };
  const ranks = pool.filter((c) => c.lines.some((l) => l.amount_g)).map((c) => ({ lo: kcalAt(c.lines, minK), hi: kcalAt(c.lines, maxK) }));
  if (!ranks.length) return { min: partialKcal, max: partialKcal, reachable: false, message: 'لا بطاقات متاحة لإكمال اليوم.' };
  const lo = Math.min(...ranks.map((r) => r.lo));
  const hi = Math.max(...ranks.map((r) => r.hi));
  const min = partialKcal + lo * emptySlots;
  const max = partialKcal + hi * emptySlots;
  const reachable = canComplete(partialKcal, Array.from({ length: emptySlots }, () => ({ min: lo, max: hi })));
  const message = reachable ? null : max < LAW.MIN ? `حتى بأكبر البطاقات والحصص لا يبلغ اليوم ${LAW.MIN}: أقصى مجموع ممكن ${Math.round(max)} سعرة.` : `حتى بأصغر البطاقات والحصص يتجاوز اليوم ${LAW.MAX}: أدنى مجموع ممكن ${Math.round(min)} سعرة.`;
  return { min, max, reachable, message };
}

/** بصمة محتوى البطاقة (الأوزان والخطوات): تغيّرها = «البطاقة تحدّثت» */
export function cardHash(lines: readonly RecipeLine[], steps: readonly string[]): string {
  const s = JSON.stringify([lines.map((l) => [l.ingredient, l.amount_g, l.profile ?? null]), steps]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
