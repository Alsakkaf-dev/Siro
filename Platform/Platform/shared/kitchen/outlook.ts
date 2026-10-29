/** قالب وصف الحدث (2.6) وإعادة كتابة أوزان الخطوات للحصة المقسّمة. نقي. الاقتراح فقط: لا كتابة في Outlook (N-14/G-03). */
import { gramsAr } from './phrases.js';
import { INGREDIENT_BY_SLUG } from './data/ingredients.js';
import type { NutritionVector, RecipeLine } from './types.js';

/** صيغ الاسم كما تظهر في نصوص الوصفات الأصلية بعد «من» */
const NAME_FORMS: Readonly<Record<string, readonly string[]>> = {
  potato: ['البطاط', 'البطاطا'], onion: ['البصل'], tomato: ['الطماطم'], carrot: ['الجزر'], cucumber: ['الخيار'], toast: ['التوست'], lemon: ['عصير الليمون', 'الليمون'], oats: ['الشوفان'], egg: ['البيض'],
  banana: ['الموز'], milk: ['الحليب'], honey: ['العسل'], cheese: ['الجبنة'], yogurt: ['الزبادي'], chicken: ['صدر الدجاج', 'الدجاج'], garlic: ['الثوم'], rice: ['الأرز الجاف', 'الأرز'], eggplant: ['الباذنجان'],
  green_beans: ['الفاصوليا الخضراء', 'الفاصوليا'], ginger: ['الزنجبيل'], coriander: ['الكزبرة'], oil: ['الزيت'], cumin: ['الكمون'], salt: ['الملح'], sugar: ['السكر'], tomato_paste: ['معجون الطماطم'],
};

export interface ScaledSteps { steps: string[]; /** مكوّنات لم يُعثر على عبارة وزنها في النص (يُلحق بها سطر تنبيه) */ unmapped: string[] }

/**
 * يعيد كتابة عبارات «N غرام من X» في الخطوات بحسب الأوزان المقسّمة. الاستبدال بمرور واحد (لا سلاسل) فلا يلتبس وزنان متساويان.
 * الأرقام داخل المدد («ثماني دقائق») لا تُمسّ لأن الوقت لا يتغير بحجم الحصة.
 */
export function scaleStepsText(steps: readonly string[], from: readonly RecipeLine[], to: readonly RecipeLine[]): ScaledSteps {
  const unmapped: string[] = [];
  const toBy = new Map(to.map((l) => [l.ingredient, l.amount_g]));
  const out = [...steps];
  for (const l of from) {
    if (l.amount_g === null || l.amount_g === 0) continue;
    const b = toBy.get(l.ingredient);
    if (b === null || b === undefined || b === l.amount_g) continue;
    const forms = NAME_FORMS[l.ingredient] ?? [INGREDIENT_BY_SLUG.get(l.ingredient)?.name_ar ?? l.ingredient];
    const phrase = gramsAr(l.amount_g);
    const re = new RegExp(`${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?= من (?:${forms.join('|')}))`, 'g');
    let hit = false;
    for (let i = 0; i < out.length; i++) {
      out[i] = out[i]!.replace(re, () => {
        hit = true;
        return `⁣${gramsAr(b)}⁣`;
      });
    }
    if (!hit) unmapped.push(l.ingredient);
  }
  return { steps: out.map((s) => s.replace(/⁣/g, '')), unmapped };
}

const i0 = (n: number): string => String(Math.round(n));
/** القالب الحرفي 2.6: اسم الطبق، الخطوات مرقّمة، ثم القيمة الغذائية الإجمالية (أعداد صحيحة، عربي فقط، نص لا HTML) */
export function outlookBody(title: string, steps: readonly string[], n: NutritionVector): string {
  return [
    title,
    ...steps.map((s, i) => (/^\d+:/.test(s) ? s : `${i + 1}: ${s}`)),
    'القيمة الغذائية الإجمالية للوجبة:',
    `السعرات الحرارية: ${i0(n.kcal)} سعرة حرارية`,
    `البروتين: ${i0(n.protein_g)} غرام`,
    `الكربوهيدرات: ${i0(n.carbs_g)} غرام`,
    `الدهون: ${i0(n.fat_g)} غرام`,
    `الألياف: ${i0(n.fiber_g)} غرام`,
  ].join('\n');
}
