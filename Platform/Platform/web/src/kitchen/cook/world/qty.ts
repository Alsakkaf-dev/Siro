/** كميات افتراضية للأخذ بحسب المكوّن (غرام): حبة تقريبية أو حصة */
const UNIT: Record<string, number> = {
  potato: 150, onion: 150, tomato: 120, carrot: 80, cucumber: 200, toast: 20, lemon: 80, oats: 40, egg: 60, banana: 100, milk: 200, honey: 30, cheese: 20, oil: 100,
  salt: 5, cumin: 3, sugar: 10, rice: 100, chicken: 200, yogurt: 100, green_beans: 100, tomato_paste: 50, garlic: 10, ginger: 10, coriander: 10, eggplant: 250,
};
export const defaultGrams = (slug: string): number => UNIT[slug] ?? 100;
/** حجم «الحبة» لقائمة الكمية (يُظهر حبة/حبتان/…) */
export const unitGrams = (slug: string): number | null => (['potato', 'onion', 'tomato', 'carrot', 'cucumber', 'toast', 'lemon', 'egg', 'banana', 'eggplant'].includes(slug) ? UNIT[slug]! : null);
export const PRESET_GRAMS = [10, 25, 50, 100, 150, 200, 250, 300, 500, 750, 1000];
