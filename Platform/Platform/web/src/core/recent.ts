/** «زرتَه مؤخرًا»: آخر 8 صفحات (عدا اليوم) في localStorage platform.recent. */
export interface RecentEntry { path: string; title: string; at: number }
const KEY = 'platform.recent';

export function readRecent(): RecentEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(v) ? (v as RecentEntry[]).filter((x) => x && typeof x.path === 'string' && typeof x.title === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function pushRecent(path: string, title: string): void {
  if (path === '/' || !title) return;
  try {
    const list = [{ path, title, at: Date.now() }, ...readRecent().filter((x) => x.path !== path)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* تخزين غير متاح */
  }
}
