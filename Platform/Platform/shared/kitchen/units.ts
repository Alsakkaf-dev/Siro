/** الوحدات والتحويلات (UNIT-xx): الغرام هو الأساس للكتلة، والعدّ يُحوَّل بوزن الحبة، والسوائل بالكثافة. */
import type { Ingredient, SaleUnit } from './types.js';

/** خطوة الكمية في المتجر بحسب وحدة البيع (UNIT-01) */
export function qtyStep(ing: Pick<Ingredient, 'slug' | 'sale_unit'>, unit: SaleUnit = ing.sale_unit): number {
  if (unit === 'kg') return ing.slug === 'garlic' || ing.slug === 'ginger' ? 0.05 : 0.1;
  if (unit === 'l') return 0.25;
  if (unit === 'g') return 1;
  return 1;
}

/** تقريب لأقرب خطوة بلا كسور عائمة سخيفة (0.30000000000000004) */
export function roundToStep(qty: number, step: number): number {
  if (!(step > 0)) return qty;
  const n = Math.round(qty / step);
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)) + 1);
  return Number((n * step).toFixed(decimals));
}

/** غرامات (الوزن المشترى الكامل) في كمية من وحدة ما */
export function toGrams(ing: Ingredient, qty: number, unit: SaleUnit = ing.sale_unit): number {
  switch (unit) {
    case 'g': return qty;
    case 'kg': return qty * 1000;
    case 'piece': return qty * (ing.piece_g ?? ing.pack_g);
    case 'dozen': return qty * 12 * (ing.piece_g ?? ing.pack_g / 12);
    case 'l': return qty * 1000 * (ing.density_g_ml ?? 1);
    default: return qty * ing.pack_g; // loaf/pack/box/jar/tub/bunch/bottle/bag = عبوة كاملة
  }
}

/** كم وحدة بيع تكفي لهذه الغرامات (الصالحة للأكل) — بالتقريب للأعلى للعبوات */
export function packsFor(ing: Ingredient, edibleGrams: number): number {
  const gross = edibleGrams / (ing.edible_yield || 1);
  return Math.ceil(gross / toGrams(ing, 1) - 1e-9);
}

/** أسماء الوحدات العربية: مفرد/مثنى/جمع/تمييز (UNIT-02، S6) */
const UNIT_FORMS: Record<SaleUnit, [one: string, two: string, few: string, many: string, abbr: string]> = {
  kg: ['كيلوغرام واحد', 'كيلوغرامان', 'كيلوغرامات', 'كيلوغراماً', 'كغ'],
  g: ['غرام واحد', 'غرامان', 'غرامات', 'غراماً', 'غ'],
  piece: ['حبة واحدة', 'حبتان', 'حبات', 'حبة', 'حبة'],
  dozen: ['دستة واحدة', 'دستتان', 'دستات', 'دستة', 'دستة'],
  loaf: ['رغيف واحد', 'رغيفان', 'أرغفة', 'رغيفاً', 'رغيف'],
  pack: ['عبوة واحدة', 'عبوتان', 'عبوات', 'عبوة', 'عبوة'],
  box: ['علبة واحدة', 'علبتان', 'علب', 'علبة', 'علبة'],
  jar: ['عبوة واحدة', 'عبوتان', 'عبوات', 'عبوة', 'عبوة'],
  tub: ['علبة واحدة', 'علبتان', 'علب', 'علبة', 'علبة'],
  bunch: ['حزمة واحدة', 'حزمتان', 'حزم', 'حزمة', 'حزمة'],
  l: ['لتر واحد', 'لتران', 'لترات', 'لتراً', 'لتر'],
  bottle: ['عبوة واحدة', 'عبوتان', 'عبوات', 'عبوة', 'عبوة'],
  bag: ['كيس واحد', 'كيسان', 'أكياس', 'كيساً', 'كيس'],
};

/** الاسم المختصر للوحدة («RM 3.40 / رغيف») */
export const unitAbbr = (u: SaleUnit): string => UNIT_FORMS[u][4];

/** عدد + معدود بالقاعدة العربية بحسب آخر خانتين؛ الكسور تُكتب بالاختصار */
export function countPhrase(n: number, u: SaleUnit): string {
  const f = UNIT_FORMS[u];
  if (!Number.isInteger(n)) return `${n} ${f[4]}`;
  const r = n % 100;
  if (n === 1) return f[0];
  if (n === 2) return f[1];
  if (r === 0 || r === 1 || r === 2) return `${n} ${f[3] === f[4] ? f[3] : stripTanween(f[3])}`;
  if (r >= 3 && r <= 10) return `${n} ${f[2]}`;
  return `${n} ${f[3]}`;
}
const stripTanween = (s: string): string => s.replace(/اً$/, '').replace(/ً$/, '');
