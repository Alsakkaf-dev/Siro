/**
 * ربط الجدول بالوجبات (CAL-30): أحداث الفطور/الغداء/العشاء في Outlook تُربط بالعنوان؛ وقراءة السعرات من أوصافها (LAW-02-6, LAW-07, LAW-08). نقي.
 * «غير معروف» لا «صفر»: وجبة بلا سطر سعرات تجعل المجموع غير معروف ولا تُحسب 0.
 */
import { LAW, evaluateDay, type LawResult } from '../kitchen/law.js';
import { dateOf } from './tz.js';
import { titleText } from './laws.js';
import type { CalEvent } from './types.js';

export const MEAL_SLOTS = ['فطور', 'غداء', 'عشاء'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const mealSlotOf = (e: Pick<CalEvent, 'title'>): MealSlot | null => {
  const t = titleText(e.title);
  return (MEAL_SLOTS as readonly string[]).includes(t) ? (t as MealSlot) : null;
};

/** حدث الوجبة المقابل لكل خانة في يوم: الأوّل زمنًا، وتكرار الخانة يُعدّ إضافيًا (LAW-08) */
export function mealEventsOf(events: readonly CalEvent[], date: string): { bySlot: Partial<Record<MealSlot, CalEvent>>; extra: CalEvent[] } {
  const day = events.filter((e) => dateOf(e.start) === date && mealSlotOf(e)).sort((a, b) => a.start.localeCompare(b.start));
  const bySlot: Partial<Record<MealSlot, CalEvent>> = {};
  const extra: CalEvent[] = [];
  for (const e of day) {
    const s = mealSlotOf(e)!;
    if (bySlot[s]) extra.push(e);
    else bySlot[s] = e;
  }
  return { bySlot, extra };
}

/** «السعرات الحرارية: 402 سعرة حرارية» من وصف الحدث (بقالب 2.6) أو null إن غاب السطر */
export function kcalFromDescription(desc: string): number | null {
  const m = /السعرات الحرارية\s*:\s*(\d{1,4})(?:[.,]\d+)?/.exec(desc.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  return m ? Number(m[1]) : null;
}

export interface OutlookDay {
  date: string;
  meals: { slot: MealSlot; title: string; kcal: number | null }[];
  extra: { title: string; kcal: number | null }[];
  /** مجموع الوجبات المعروفة سعراتها */
  known_kcal: number;
  unknown: string[];
  /** null إن وُجدت وجبة بلا سعرات (لا نخمّن) */
  law: LawResult | null;
  violation: boolean;
}

/** مدقّق خلفية للأيام المقروءة من Outlook: يبلّغ المخالفات ولا يغيّر شيئًا */
export function outlookDayLaw(events: readonly CalEvent[], date: string): OutlookDay {
  const { bySlot, extra } = mealEventsOf(events, date);
  const meals = MEAL_SLOTS.filter((s) => bySlot[s]).map((s) => ({ slot: s, title: bySlot[s]!.title, kcal: kcalFromDescription(bySlot[s]!.description) }));
  const ex = extra.map((e) => ({ title: e.title, kcal: kcalFromDescription(e.description) }));
  const unknown = [...meals.filter((m) => m.kcal === null).map((m) => m.slot as string), ...ex.filter((m) => m.kcal === null).map((m) => m.title)];
  const known = meals.reduce((s, m) => s + (m.kcal ?? 0), 0) + ex.reduce((s, m) => s + (m.kcal ?? 0), 0);
  let law: LawResult | null = null;
  if (!unknown.length && meals.length) {
    const slots: Record<string, { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }> = {};
    for (const m of meals) slots[m.slot] = { kcal: m.kcal!, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    if (ex.length) slots['إضافي'] = { kcal: ex.reduce((s, m) => s + m.kcal!, 0), protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    law = evaluateDay(slots, MEAL_SLOTS);
  }
  // فوق الحد الأعلى يُبلَّغ حتى مع وجود مجهول (المعروف وحده كافٍ)؛ ما دون الأدنى لا يُحكم عليه ما دام فيه مجهول
  const violation = (law ? !law.ok : false) || known > LAW.MAX || ex.length > 0;
  return { date, meals, extra: ex, known_kcal: known, unknown, law, violation };
}
