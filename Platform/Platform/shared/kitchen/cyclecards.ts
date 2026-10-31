/** بطاقات «دورتي» المطبّقة في Outlook (2.6): أوزان مصغّرة ثابتة من الوصفات الأصلية كبطاقات افتراضية `cy-<وصفة>` تُعيَّن في الجدول كأي بطاقة. */
import { CYCLE, cycleDayOf } from './data/cycle.js';
import { RECIPE_BY_SLUG } from './data/recipes.js';
import { scaleStepsText } from './outlook.js';
import type { PlanCard } from './plan.js';
import type { Slot } from './law.js';

export const CYCLE_PREFIX = 'cy-';
export interface CycleCard extends PlanCard { meal_slot: Slot; day: 1 | 2 | 3; recipe: string }

export const CYCLE_CARDS: readonly CycleCard[] = Object.freeze(
  CYCLE.flatMap((d) => d.meals.map((m): CycleCard => {
    const r = RECIPE_BY_SLUG.get(m.recipe)!;
    return { slug: `${CYCLE_PREFIX}${m.recipe}`, title_ar: m.title_ar, lines: m.lines, steps: scaleStepsText(r.steps_original, r.lines, m.lines).steps, flags: r.flags, meal_slot: m.slot, day: d.day, recipe: m.recipe };
  })),
);
export const CYCLE_CARD_BY_SLUG: ReadonlyMap<string, CycleCard> = new Map(CYCLE_CARDS.map((c) => [c.slug, c]));
/** بطاقات يوم الدورة لتاريخ ما بحسب الخانة */
export function cycleCardsFor(date: string): Record<Slot, CycleCard> {
  const day = cycleDayOf(date);
  return Object.fromEntries(CYCLE_CARDS.filter((c) => c.day === day).map((c) => [c.meal_slot, c])) as Record<Slot, CycleCard>;
}
