/** قائمة التسوّق من الجدول (CAL-37): مدى تاريخي ← إجمالي المكوّنات بالغرام ← يُطرح المخزن ← سلة قابلة للتوليد. نقية. */
import { INGREDIENT_BY_SLUG, TINY } from './data/ingredients.js';
import { qtyForEdible, usableGrams, type CartLine } from './shop.js';
import type { RecipeLine } from './types.js';

export interface ShopLine { ingredient: string; need_g: number; have_g: number; buy_g: number; qty: number | null; unit: CartLine['unit'] | null }
export interface ShoppingList { days: number; lines: ShopLine[]; cart: CartLine[] }

/** days = أسطر خانات كل يوم؛ pantry = غرامات المخزن (مشترى)؛ الأرصدة تُقارَن بالصالح للأكل كما في بقية المنصة (AS-19) */
export function shoppingList(days: readonly { slots: readonly { lines: readonly RecipeLine[] }[] }[], pantry: Readonly<Record<string, number>>): ShoppingList {
  const need = new Map<string, number>();
  for (const d of days) for (const s of d.slots) for (const l of s.lines) if (l.amount_g) need.set(l.ingredient, (need.get(l.ingredient) ?? 0) + l.amount_g);
  const lines: ShopLine[] = [];
  const cart: CartLine[] = [];
  for (const [slug, n] of [...need].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ing = INGREDIENT_BY_SLUG.get(slug);
    if (!ing) continue;
    const have = usableGrams(slug, pantry[slug] ?? 0);
    // المكوّنات «القليلة» (ملح/كمون): تُشترى فقط إن لم يوجد منها شيء
    const buy = TINY.has(slug) ? (have > 0 ? 0 : n) : Math.max(0, n - have);
    if (buy <= 1e-9) {
      lines.push({ ingredient: slug, need_g: n, have_g: have, buy_g: 0, qty: null, unit: null });
      continue;
    }
    const q = qtyForEdible(ing, buy);
    lines.push({ ingredient: slug, need_g: n, have_g: have, buy_g: buy, qty: q.qty, unit: q.unit });
    cart.push({ ingredient: slug, qty: q.qty, unit: q.unit, store: null });
  }
  return { days: days.length, lines, cart };
}
