/** دورة الأيام الثلاثة المطبّقة في Outlook (2.6/S5-ب): أوزان مصغّرة من وصفات المالك. */
import type { RecipeLine } from '../types.js';
import type { Slot } from '../law.js';

export const CYCLE_EPOCH = '2026-10-23';
export interface CycleMeal { slot: Slot; recipe: string; title_ar: string; lines: RecipeLine[]; outlook_kcal: number }
export interface CycleDay { day: 1 | 2 | 3; meals: CycleMeal[]; outlook_total: number }

const l = (ingredient: string, amount_g: number, profile?: RecipeLine['profile']): RecipeLine => (profile ? { ingredient, amount_g, profile } : { ingredient, amount_g });

export const CYCLE: readonly CycleDay[] = Object.freeze([
  {
    day: 1, outlook_total: 1361,
    meals: [
      { slot: 'فطور', recipe: 'bk-03', title_ar: 'توست بالبيض والجبنة', outlook_kcal: 402, lines: [l('egg', 80), l('toast', 60), l('cheese', 25), l('oil', 5)] },
      { slot: 'غداء', recipe: 'ln-01', title_ar: 'صدور دجاج مع الأرز والخضار', outlook_kcal: 575, lines: [l('chicken', 150), l('oil', 8), l('rice', 60), l('carrot', 40), l('cucumber', 60), l('toast', 30)] },
      { slot: 'عشاء', recipe: 'dn-04', title_ar: 'أومليت بالجبنة والزبادي', outlook_kcal: 384, lines: [l('egg', 100), l('oil', 4), l('cheese', 20), l('yogurt', 100), l('cucumber', 40), l('toast', 25)] },
    ],
  },
  {
    day: 2, outlook_total: 1343,
    meals: [
      { slot: 'فطور', recipe: 'bk-04', title_ar: 'شوفان بالحليب والبيض والموز والعسل', outlook_kcal: 431, lines: [l('oats', 40), l('milk', 200), l('egg', 60), l('banana', 40), l('honey', 8)] },
      { slot: 'غداء', recipe: 'ln-03', title_ar: 'باذنجان بالدجاج والأرز', outlook_kcal: 499, lines: [l('eggplant', 200), l('oil', 10), l('chicken', 130), l('onion', 25), l('garlic', 4), l('tomato', 70), l('rice', 30), l('toast', 25)] },
      { slot: 'عشاء', recipe: 'dn-03', title_ar: 'زبادي بالخيار والثوم والجبنة والبيض', outlook_kcal: 413, lines: [l('egg', 70), l('cucumber', 50), l('yogurt', 200), l('garlic', 3), l('oil', 5), l('cheese', 20), l('toast', 25)] },
    ],
  },
  {
    day: 3, outlook_total: 1214,
    meals: [
      { slot: 'فطور', recipe: 'bk-02', title_ar: 'أومليت الخضار بالجبنة', outlook_kcal: 378, lines: [l('egg', 120), l('tomato', 40), l('onion', 25), l('oil', 4), l('cheese', 20), l('toast', 30)] },
      { slot: 'غداء', recipe: 'dn-02', title_ar: 'سلطة دجاج بالخيار والطماطم والأرز', outlook_kcal: 417, lines: [l('chicken', 130), l('oil', 5), l('cucumber', 80), l('tomato', 80), l('lemon', 15, 'juice'), l('rice', 30), l('toast', 30)] },
      { slot: 'عشاء', recipe: 'dn-01', title_ar: 'شوربة دجاج بالخضار والأرز والبطاطا', outlook_kcal: 419, lines: [l('chicken', 130), l('carrot', 45), l('onion', 35), l('tomato', 70), l('potato', 70), l('rice', 20), l('cumin', 3), l('toast', 30)] },
    ],
  },
] satisfies CycleDay[]);

/** cycle_index = (date − 2026-10-23).days mod 3 → اليوم 1..3. date بصيغة YYYY-MM-DD (تقويم KL). */
export function cycleDayOf(dateISO: string): 1 | 2 | 3 {
  const d = Math.round((Date.parse(`${dateISO}T00:00:00Z`) - Date.parse(`${CYCLE_EPOCH}T00:00:00Z`)) / 86_400_000);
  return ((((d % 3) + 3) % 3) + 1) as 1 | 2 | 3;
}
