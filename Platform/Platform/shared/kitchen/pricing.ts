/** قواعد تغيير السعر (B1-04) والقِدم (B1-09): نقية، يشاركها الخادم (فرض) والواجهة (معاينة). */
import { SEED_PRICES } from './data/prices.js';
import type { PricePoint } from './types.js';

export const PRICE_MAX_RM = 100_000;
export const STALE_DAYS = 30;
/** تغيّر أكبر من ×3 أو أقل من ÷3 يتطلب تأكيدًا */
export const CONFIRM_RATIO = 3;

const SEED_BY_KEY: ReadonlyMap<string, PricePoint> = new Map(SEED_PRICES.map((p) => [`${p.ingredient}|${p.store}`, p]));
/** نطاق شريحة السوق الأصلي للخلية (من بذرة S3) */
export const tierRange = (ingredient: string, store: string): { min: number; max: number } | null => {
  const s = SEED_BY_KEY.get(`${ingredient}|${store}`);
  return s ? { min: s.price_min, max: s.price_max } : null;
};

export interface PriceCheck {
  ok: boolean;
  /** سبب الرفض (سعر ≤ 0 أو غير صالح) */
  error?: string;
  /** يتطلب confirm=true */
  needsConfirm: boolean;
  ratio: number | null;
  /** تحذيرات لا تمنع (خارج نطاق الشريحة) */
  warnings: string[];
}

export function checkPriceChange(ingredient: string, store: string, oldPrice: number | null, next: number): PriceCheck {
  if (!Number.isFinite(next) || next <= 0) return { ok: false, error: 'السعر يجب أن يكون أكبر من صفر', needsConfirm: false, ratio: null, warnings: [] };
  if (next > PRICE_MAX_RM) return { ok: false, error: `السعر أكبر من الحد المعقول (${PRICE_MAX_RM})`, needsConfirm: false, ratio: null, warnings: [] };
  const ratio = oldPrice && oldPrice > 0 ? next / oldPrice : null;
  const needsConfirm = ratio !== null && (ratio > CONFIRM_RATIO || ratio < 1 / CONFIRM_RATIO);
  const warnings: string[] = [];
  const tr = tierRange(ingredient, store);
  if (tr && (next < tr.min || next > tr.max)) warnings.push(`خارج نطاق شريحة السوق الأصلي (${tr.min}–${tr.max})`);
  return { ok: true, needsConfirm, ratio, warnings };
}

/** B1-09: قديم إن مضى أكثر من `days` يومًا على آخر تحديث (التاريخ YYYY-MM-DD أو ISO) */
export function isStale(observedAt: string, now: Date | number = Date.now(), days: number = STALE_DAYS): boolean {
  const t = Date.parse(observedAt.length === 10 ? `${observedAt}T00:00:00Z` : observedAt);
  if (!Number.isFinite(t)) return false;
  return (new Date(now).getTime() - t) / 86_400_000 > days;
}

/** تسمية المصدر بالعربية (وسم الثقة) */
export const SOURCE_LABEL: Readonly<Record<PricePoint['source'], string>> = Object.freeze({ estimate_tier: 'تقديري', manual: 'يدوي', receipt: 'إيصال', pricecatcher: 'PriceCatcher' });
