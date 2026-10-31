import type { ComponentType, SVGProps } from 'react';
import { LuApple, LuBanana, LuBean, LuCandy, LuCarrot, LuCitrus, LuCroissant, LuDroplet, LuDrumstick, LuEgg, LuLeaf, LuMilk, LuPackage, LuSprout, LuUtensils, LuWheat } from 'react-icons/lu';

type Ico = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
/** أيقونة مكوّن بخط موحّد بدل الإيموجي: حسب المكوّن ثم الفئة. (في حزمة المطبخ فقط، لا في الحزمة الرئيسية) */
const BY_SLUG: Record<string, Ico> = {
  potato: LuPackage, onion: LuLeaf, tomato: LuApple, carrot: LuCarrot, cucumber: LuLeaf, toast: LuCroissant, lemon: LuCitrus, oats: LuWheat, egg: LuEgg, banana: LuBanana,
  milk: LuMilk, honey: LuDroplet, cheese: LuPackage, yogurt: LuMilk, chicken: LuDrumstick, garlic: LuSprout, rice: LuWheat, eggplant: LuLeaf, green_beans: LuBean,
  ginger: LuSprout, coriander: LuSprout, cumin: LuSprout, tomato_paste: LuPackage, salt: LuPackage, sugar: LuCandy, oil: LuDroplet,
};
const BY_CATEGORY: Record<string, Ico> = { 'خضروات': LuLeaf, 'فواكه': LuApple, 'ألبان وبيض': LuEgg, 'لحوم ودواجن': LuDrumstick, 'حبوب ونشويات': LuWheat, 'مخبوزات': LuCroissant, 'توابل': LuSprout, 'محليات': LuCandy, 'زيوت': LuDroplet, 'معلبات وصلصات': LuPackage };

export function IngIcon({ slug, category, size = 16 }: { slug?: string | undefined; category?: string | undefined; size?: number }) {
  const C = (slug && BY_SLUG[slug]) || (category && BY_CATEGORY[category]) || LuUtensils;
  return <C size={size} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}
