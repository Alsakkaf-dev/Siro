/** خريطة المترو: يحسب «أين أنا» (الخط + المحطة + مسار التنقل) من سجل الخطوط — مصدر واحد للتنقل كله. */
import { ownsPath, type NavItem, type PlatformPlugin, type PluginCtx } from './plugin.js';
import { PLUGINS } from './plugins.config.js';

export interface Crumb { to?: string; label: string }

export function lineOf(pathname: string): PlatformPlugin | null {
  // الأطول أولًا كي لا يبتلع «/» بقية الخطوط
  return [...PLUGINS].sort((a, b) => b.basePath.length - a.basePath.length).find((p) => ownsPath(p, pathname)) ?? null;
}

/** كل المحطات المسطّحة لخط (مع الأبناء) */
export function stationsOf(p: PlatformPlugin, ctx: PluginCtx): (NavItem & { group?: string; interchange?: boolean })[] {
  const out: (NavItem & { group?: string; interchange?: boolean })[] = [];
  for (const sec of p.nav(ctx)) {
    for (const it of sec.items) {
      out.push({ ...it, ...(sec.title ? { group: sec.title } : {}), ...(sec.interchange ? { interchange: true } : {}) });
      for (const c of it.children ?? []) out.push({ ...c, group: it.label });
    }
  }
  return out;
}

/** أعمق محطة يطابق مسارها المسار الحالي */
export function stationOf(p: PlatformPlugin, ctx: PluginCtx, pathname: string): NavItem | null {
  let best: NavItem | null = null;
  for (const s of stationsOf(p, ctx)) {
    if ((s as { interchange?: boolean }).interchange) continue;
    const hit = s.end ? pathname === s.to : pathname === s.to || pathname.startsWith(s.to + '/');
    if (hit && (!best || s.to.length > best.to.length)) best = s;
  }
  return best;
}

/** مسار تلقائي لصفحات لا تعلن مسارها: الخط › المحطة */
export function autoCrumbs(pathname: string, ctx: PluginCtx): Crumb[] {
  const line = lineOf(pathname);
  if (!line) {
    const GLOBAL: Record<string, string> = { '/settings': 'الإعدادات والبيانات', '/trash': 'سلة المحذوفات', '/search': 'البحث' };
    const label = GLOBAL[pathname];
    return label ? [{ label }] : [];
  }
  const st = stationOf(line, ctx, pathname);
  return st && st.to !== line.basePath ? [{ to: st.to, label: st.label }] : [];
}
