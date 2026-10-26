import type { IconName } from '../lib/icons.js';

/** عقد المنصة (Plugin Contract) — نسخة الواجهة. أي منصة جديدة = ملف plugin + سطر في plugins.config.ts */
export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number | string;
  hint?: string;
  children?: NavItem[];
}
export interface NavSection {
  title?: string;
  items: NavItem[];
}
export interface PluginCtx {
  activeSemesterId: string | null;
  currentSemesterId: string | null;
  semesters: { id: string; code: string; name: string; is_active: boolean }[];
  unknownCount: number;
}
export interface PlatformPlugin {
  id: string;
  name: { ar: string; en: string };
  tagline: string;
  color: string;
  version: string;
  basePath: string;
  icon: IconName;
  status: 'active' | 'soon';
  nav: (ctx: PluginCtx) => NavSection[];
}
