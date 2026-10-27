import type { IconName } from '../lib/icons.js';

/** عقد المنصة (Plugin Contract) v2 — كل «خط» في خريطة الموقع = ملف plugin + سطر في plugins.config.tsx.
 *  الشريط الجانبي، مبدّل الخطوط، الشريط السفلي، مسار التنقل، لوحة الأوامر، قائمة الإنشاء (+) وصفحة الخريطة كلها تُبنى من هنا. */
export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number | string;
  hint?: string;
  children?: NavItem[];
  /** كلمات بحث إضافية للوحة الأوامر */
  kw?: string;
}
export interface NavSection {
  title?: string;
  items: NavItem[];
  /** تقاطع مع خط آخر (يُرسم بإطار متقطع) */
  interchange?: boolean;
}
export interface PluginCtx {
  activeSemesterId: string | null;
  currentSemesterId: string | null;
  semesters: { id: string; code: string; name: string; is_active: boolean }[];
  unknownCount: number;
  spaces: { id: string; name: string; icon: string; color: string }[];
}
/** إجراء في قائمة الإنشاء (+) ولوحة الأوامر */
export interface CreateAction {
  id: string;
  label: string;
  icon: IconName;
  /** وصف قصير يظهر تحت الاسم */
  sub?: string;
  /** وجهة (رابط) أو أمر داخلي يفسّره Shell (مثل 'quick-item', 'quick-assessment') */
  to?: (c: PluginCtx) => string | null;
  command?: 'quick-item' | 'quick-assessment' | 'quick-note';
}
export interface PlatformPlugin {
  id: string;
  name: { ar: string; en: string };
  tagline: string;
  /** لون الخط (متغير CSS) */
  color: string;
  version: string;
  basePath: string;
  /** مسارات إضافية يملكها الخط (مثل /activity لخط المراجعة) */
  owns?: string[];
  icon: IconName;
  status: 'active' | 'soon';
  /** اختصار لوحة المفاتيح: g ثم المفتاح */
  key?: string;
  nav: (ctx: PluginCtx) => NavSection[];
  create?: CreateAction[];
}

/** هل المسار ضمن هذا الخط؟ */
export function ownsPath(p: PlatformPlugin, pathname: string): boolean {
  const hit = (base: string): boolean => (base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(base + '/'));
  return hit(p.basePath) || (p.owns ?? []).some(hit);
}
