/**
 * أعلام الميزات (ARC-04): مغلقة افتراضيًا حتى تكتمل مرحلتها. التجاوز المحلي للتجربة فقط:
 * من «الإعدادات ← عام ← ميزات تجريبية» (يُحفظ في localStorage platform.flags).
 */
import type { FlagName } from './registry.js';

const DEFAULTS: Record<FlagName, boolean> = {
  // المرحلة 2 مكتملة: قسم المطبخ ظاهر (A1/C/P/W/B1/A2)
  'kitchen.enabled': true,
  'kitchen.3d': true,
  'kitchen.apis.extended': false,
  'calendar.outlook.read': false,
  'calendar.outlook.proposals': true,
};

function overrides(): Partial<Record<FlagName, boolean>> {
  try {
    const v = JSON.parse(localStorage.getItem('platform.flags') ?? '{}') as unknown;
    return v && typeof v === 'object' ? (v as Partial<Record<FlagName, boolean>>) : {};
  } catch {
    return {};
  }
}

export function flagEnabled(f: FlagName): boolean {
  const o = overrides()[f];
  return typeof o === 'boolean' ? o : DEFAULTS[f];
}

export const FLAG_LABELS: Record<FlagName, string> = {
  'kitchen.enabled': 'قسم المطبخ',
  'kitchen.3d': 'المطبخ ثلاثي الأبعاد',
  'kitchen.apis.extended': 'واجهات المطبخ الخارجية (تجريبية — تحتاج مفاتيح على الخادم)',
  'calendar.outlook.read': 'زر «زامن Outlook» (تجريبي — يحتاج رمزًا على الخادم)',
  'calendar.outlook.proposals': 'اقتراحات Outlook وتصديرها',
};

export function setFlag(f: FlagName, v: boolean): void {
  try {
    const cur = JSON.parse(localStorage.getItem('platform.flags') ?? '{}') as Record<string, boolean>;
    if (v === DEFAULTS[f]) delete cur[f];
    else cur[f] = v;
    localStorage.setItem('platform.flags', JSON.stringify(cur));
  } catch {
    /* تخزين غير متاح */
  }
}
