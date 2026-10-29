/**
 * بذرة الأسعار S3 (= جدول 2.7) — كلها تقديرية [estimate_tier, low] بالرينغيت لوحدة البيع (N-03).
 * سعر الخلية = منتصف نطاق شريحة السوق. السكر والدجاج «المضبوطان» غير متحقَّق منهما (unverified).
 */
import type { PricePoint, StoreTier } from '../types.js';
import { STORES } from './stores.js';

type Tier = [min: number, max: number, mid: number];
const SEED_DATE = '2026-10-29';

/** [رخيص Mydin/NSK, متوسط KIP/Bestari, أعلى Aeon] */
const TABLE: Record<string, { cheap: Tier; mid: Tier; high: Tier; unverified?: StoreTier[] }> = {
  potato: { cheap: [3.5, 4.5, 4.0], mid: [4, 5, 4.5], high: [4.5, 6, 5.25] },
  onion: { cheap: [3.5, 5, 4.25], mid: [4, 6, 5.0], high: [5, 7, 6.0] },
  tomato: { cheap: [3.5, 5, 4.25], mid: [4, 6, 5.0], high: [5, 8, 6.5] },
  carrot: { cheap: [3.5, 5, 4.25], mid: [4, 6, 5.0], high: [5, 7, 6.0] },
  cucumber: { cheap: [1.8, 2.5, 2.15], mid: [2, 3, 2.5], high: [3, 4, 3.5] },
  toast: { cheap: [2.8, 4, 3.4], mid: [3, 4.5, 3.75], high: [4, 6, 5.0] },
  lemon: { cheap: [5, 7, 6.0], mid: [6, 8, 7.0], high: [7, 10, 8.5] },
  oats: { cheap: [9, 13, 11.0], mid: [10, 15, 12.5], high: [12, 18, 15.0] },
  egg: { cheap: [9, 11, 10.0], mid: [10, 13, 11.5], high: [11, 14, 12.5] },
  banana: { cheap: [2.5, 4, 3.25], mid: [3, 5, 4.0], high: [4, 6, 5.0] },
  milk: { cheap: [7, 9, 8.0], mid: [8, 10, 9.0], high: [9, 12, 10.5] },
  honey: { cheap: [12, 20, 16.0], mid: [15, 25, 20.0], high: [18, 30, 24.0] },
  cheese: { cheap: [13, 20, 16.5], mid: [15, 25, 20.0], high: [18, 30, 24.0] },
  yogurt: { cheap: [2.5, 4, 3.25], mid: [3, 5, 4.0], high: [4, 6, 5.0] },
  chicken: { cheap: [8.5, 9.4, 8.95], mid: [9.4, 15, 12.2], high: [15, 20, 17.5], unverified: ['cheap'] },
  garlic: { cheap: [8, 12, 10.0], mid: [10, 15, 12.5], high: [12, 18, 15.0] },
  rice: { cheap: [22, 32, 27.0], mid: [25, 40, 32.5], high: [30, 45, 37.5] },
  eggplant: { cheap: [3.5, 5, 4.25], mid: [4, 6, 5.0], high: [5, 7, 6.0] },
  green_beans: { cheap: [4, 6, 5.0], mid: [5, 8, 6.5], high: [6, 9, 7.5] },
  ginger: { cheap: [7, 10, 8.5], mid: [8, 12, 10.0], high: [10, 15, 12.5] },
  coriander: { cheap: [1.5, 3, 2.25], mid: [2, 4, 3.0], high: [3, 5, 4.0] },
  cumin: { cheap: [4, 6, 5.0], mid: [5, 8, 6.5], high: [6, 10, 8.0] },
  tomato_paste: { cheap: [2.5, 5, 3.75], mid: [3, 7, 5.0], high: [4, 8, 6.0] },
  salt: { cheap: [0.8, 1.5, 1.15], mid: [1, 2, 1.5], high: [1.5, 2.5, 2.0] },
  sugar: { cheap: [2.85, 2.85, 2.85], mid: [2.85, 2.85, 2.85], high: [2.85, 2.85, 2.85], unverified: ['cheap', 'mid', 'high'] },
  oil: { cheap: [9, 13, 11.0], mid: [10, 15, 12.5], high: [12, 18, 15.0] },
};

export const SEED_PRICES: readonly PricePoint[] = Object.freeze(
  Object.entries(TABLE).flatMap(([ingredient, row]) =>
    STORES.map((s): PricePoint => {
      const [price_min, price_max, price_rm] = row[s.tier];
      return { ingredient, store: s.slug, price_rm, price_min, price_max, source: 'estimate_tier', confidence: 'low', observed_at: SEED_DATE, ...(row.unverified?.includes(s.tier) ? { unverified: true } : {}) };
    }),
  ),
);
