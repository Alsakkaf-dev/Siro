/**
 * أعلام الميزات (ARC-04): مغلقة افتراضيًا حتى تكتمل مرحلتها. التجاوز المحلي للتجربة فقط:
 * localStorage.setItem('platform.flags', '{"kitchen.enabled":true}') ثم أعد التحميل.
 */
import type { FlagName } from './registry.js';

const DEFAULTS: Record<FlagName, boolean> = {
  'kitchen.enabled': false,
  'kitchen.3d': false,
  'kitchen.apis.extended': false,
  'calendar.outlook.read': false,
  'calendar.outlook.proposals': false,
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
