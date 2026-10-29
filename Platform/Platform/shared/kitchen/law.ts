/** قانون السعرات (LAW) — الملف الوحيد الذي يحتوي الثوابت (LAW-01). تغييره قرار المالك وحده (G-05). */
import type { NutritionVector } from './types.js';

export const LAW = Object.freeze({ MIN: 1200, MAX: 1500 } as const);
/** نطاق مريح للتصميم فقط، ليس قانونًا */
export const COMFORT = Object.freeze({ LOW: 1250, HIGH: 1450 } as const);
/** هدف المقسّم ونطاق الهامش (LAW-09) */
export const LAW_TARGET = 1300;
export const LAW_MARGIN_WARN = 50;
/** خانات اليوم ثلاث فقط — لا سناكات ولا وجبة رابعة (LAW-08) */
export const SLOTS = ['فطور', 'غداء', 'عشاء'] as const;
export type Slot = (typeof SLOTS)[number];

export type DayStatus = 'EMPTY' | 'PARTIAL' | 'VALID' | 'INVALID_LOW' | 'INVALID_HIGH';
export interface LawResult {
  ok: boolean;
  status: DayStatus;
  total_kcal: number;
  min: typeof LAW.MIN;
  max: typeof LAW.MAX;
  deficit?: number;
  excess?: number;
  remaining?: { minNeeded: number; maxAllowed: number };
  marginToFloor: number;
  marginToCeil: number;
}

/** يقيّم يومًا: الجزئي فوق الحدّ الأعلى مرفوض فورًا، والمكتمل تحت الأدنى مرفوض (LAW-03). الحدّان مسموحان. */
export function evaluateDay(slots: Partial<Record<string, NutritionVector | undefined>>, required: readonly string[] = SLOTS): LawResult {
  const filled = Object.values(slots).filter((n): n is NutritionVector => !!n);
  const total = filled.reduce((s, n) => s + n.kcal, 0);
  const complete = required.every((k) => slots[k]);
  const base = { total_kcal: total, min: LAW.MIN, max: LAW.MAX, marginToFloor: total - LAW.MIN, marginToCeil: LAW.MAX - total };
  if (total > LAW.MAX) return { ...base, ok: false, status: 'INVALID_HIGH', excess: total - LAW.MAX };
  if (complete && total < LAW.MIN) return { ...base, ok: false, status: 'INVALID_LOW', deficit: LAW.MIN - total };
  if (!complete) return { ...base, ok: true, status: filled.length ? 'PARTIAL' : 'EMPTY', remaining: { minNeeded: Math.max(0, LAW.MIN - total), maxAllowed: LAW.MAX - total } };
  return { ...base, ok: true, status: 'VALID' };
}

/** داخل المجال؟ (يُستعمل حيث تُقارن المجاميع بدل تكرار الأرقام) */
export const withinLaw = (kcal: number): boolean => kcal >= LAW.MIN && kcal <= LAW.MAX;

/**
 * LAW-04: بعد التعيين الجزئي، هل يبقى إكمال الخانات الفارغة ممكنًا؟
 * emptyRange = لكل خانة فارغة أصغر وأكبر سعرات ممكنة لها (بأصغر/أكبر حصص مسموحة).
 */
export function canComplete(partialKcal: number, emptyRange: { min: number; max: number }[]): boolean {
  const lo = partialKcal + emptyRange.reduce((s, r) => s + r.min, 0);
  const hi = partialKcal + emptyRange.reduce((s, r) => s + r.max, 0);
  return hi >= LAW.MIN && lo <= LAW.MAX;
}

/** حالة مؤشر القانون (LAW-06): ok داخل المريح، near قرب الحدّين (≤ هامش)، out خارجه. */
export function gaugeTone(kcal: number): 'ok' | 'near' | 'out' {
  if (!withinLaw(kcal)) return 'out';
  if (kcal - LAW.MIN <= LAW_MARGIN_WARN || LAW.MAX - kcal <= LAW_MARGIN_WARN) return 'near';
  return 'ok';
}
