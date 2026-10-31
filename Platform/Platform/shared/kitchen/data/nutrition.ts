/**
 * جدول التغذية القانوني S4 — المصدر الواحد لكل حساب (لكل 100 غرام صالحة للأكل، وزن خام/جاف).
 * المرجع: قيم USDA القياسية للمواد الخام كما وردت في S4؛ لا تُغيَّر إلا بقرار المالك (تحقق API في K-M12).
 */
import type { NutritionVector, Profile } from '../types.js';

const v = (kcal: number, protein_g: number, carbs_g: number, fat_g: number, fiber_g: number): NutritionVector => Object.freeze({ kcal, protein_g, carbs_g, fat_g, fiber_g });

/** المفتاح = slug المكوّن، والقيمة = الملفات المتاحة. الافتراضي في INGREDIENTS[].profile. */
export const NUTRITION_PER_100G: Readonly<Record<string, Partial<Record<Profile, NutritionVector>>>> = Object.freeze({
  potato: { raw: v(77, 2.05, 17.49, 0.09, 2.1) },
  onion: { raw: v(40, 1.1, 9.34, 0.1, 1.7) },
  tomato: { raw: v(18, 0.88, 3.92, 0.2, 1.2) },
  carrot: { raw: v(41, 0.93, 9.58, 0.24, 2.8) },
  cucumber: { raw: v(15, 0.65, 3.63, 0.11, 0.5) },
  toast: { raw: v(266, 8.85, 50.61, 3.33, 2.4) },
  lemon: { juice: v(22, 0.35, 6.9, 0.24, 0.3) },
  oats: { raw: v(389, 16.89, 66.27, 6.9, 10.6) },
  egg: { cooked: v(155, 12.58, 1.12, 10.61, 0), raw: v(143, 12.56, 0.72, 9.51, 0) },
  banana: { raw: v(89, 1.09, 22.84, 0.33, 2.6) },
  milk: { raw: v(61, 3.15, 4.8, 3.25, 0) },
  honey: { raw: v(304, 0.3, 82.4, 0, 0.2) },
  cheese: { raw: v(300, 18, 6, 22, 0) }, // تقديري عام — DEF-04: يُستبدل بقيم الملصق
  yogurt: { raw: v(61, 3.47, 4.66, 3.25, 0) },
  chicken: { raw: v(120, 22.5, 0, 2.62, 0) },
  garlic: { raw: v(149, 6.36, 33.06, 0.5, 2.1) },
  rice: { raw: v(365, 7.13, 79.95, 0.66, 1.3) },
  eggplant: { raw: v(25, 0.98, 5.88, 0.18, 3) },
  green_beans: { raw: v(31, 1.83, 6.97, 0.22, 2.7) },
  ginger: { raw: v(80, 1.82, 17.77, 0.75, 2) },
  coriander: { raw: v(23, 2.13, 3.67, 0.52, 2.8) },
  cumin: { raw: v(375, 17.81, 44.24, 22.27, 10.5) },
  tomato_paste: { raw: v(82, 4.32, 18.91, 0.47, 4.1) },
  salt: { raw: v(0, 0, 0, 0, 0) },
  sugar: { raw: v(387, 0, 99.98, 0, 0) },
  oil: { raw: v(884, 0, 0, 100, 0) },
});
