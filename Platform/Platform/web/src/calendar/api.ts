/**
 * عميل الجدول: قراءة /api/calendar مع لقطة محلية (CAL-24: بلا اتصال يعرض آخر لقطة موسومة «قد تكون قديمة»).
 * الكتابة الوحيدة هنا: استيراد لقطة (ICS/JSON) إلى قاعدة المنصة نفسها؛ لا كتابة في Outlook.
 */
import type { Cal18, CalEvent } from '../../../shared/calendar/index.js';

export type SourceChoice = 'auto' | 'graph' | 'import' | 'routine';
export interface ViewResp {
  from: string; to: string; tz: string;
  source: 'graph' | 'import' | 'routine' | 'none';
  note: string | null; last_sync: string | null; stale: boolean;
  holidays: { name_ar: string; from: string; to: string }[];
  calendars: { name: string; count: number }[];
  events: CalEvent[];
  verify: Cal18;
}
export interface SourceInfo { id: string; label: string; configured: boolean; reason: string | null; sync: { last_sync: string; count: number; from_d: string | null; to_d: string | null } | null; verified: boolean; verified_note: string | null }

export class CalendarApiError extends Error {
  constructor(public status: number, message: string, public code = '') {
    super(message);
  }
}
const CLIENT_ID = (() => {
  try {
    const k = 'kitchen.client';
    let v = sessionStorage.getItem(k);
    if (!v) sessionStorage.setItem(k, (v = `c${Math.random().toString(36).slice(2, 10)}`));
    return v;
  } catch {
    return `c${Math.random().toString(36).slice(2, 10)}`;
  }
})();

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/calendar${url}`, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-Kitchen-Client': CLIENT_ID } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new CalendarApiError(0, 'لا اتصال بالخادم', 'offline');
  }
  const t = await res.text();
  let j: Record<string, unknown> = {};
  try {
    j = t ? (JSON.parse(t) as Record<string, unknown>) : {};
  } catch {
    /* نص */
  }
  if (!res.ok) throw new CalendarApiError(res.status, String(j['error'] ?? `خطأ ${res.status}`), String(j['code'] ?? ''));
  return j as T;
}

const SNAP = 'calendar.snap.v1';
interface Snap { k: string; at: number; data: ViewResp }
const readSnaps = (): Snap[] => {
  try {
    const v = JSON.parse(localStorage.getItem(SNAP) ?? '[]') as unknown;
    return Array.isArray(v) ? (v as Snap[]) : [];
  } catch {
    return [];
  }
};
function writeSnap(k: string, data: ViewResp): void {
  try {
    const keep = readSnaps().filter((s) => s.k !== k).slice(-5);
    keep.push({ k, at: Date.now(), data });
    localStorage.setItem(SNAP, JSON.stringify(keep));
  } catch {
    /* تخزين ممتلئ أو غير متاح */
  }
}

export interface ViewResult { data: ViewResp; offline: boolean; savedAt: number | null }
export async function fetchView(from: string, to: string, source: SourceChoice): Promise<ViewResult> {
  const k = `${source}|${from}|${to}`;
  try {
    const data = await call<ViewResp>('GET', `/view?from=${from}&to=${to}&source=${source}`);
    writeSnap(k, data);
    return { data, offline: false, savedAt: null };
  } catch (e) {
    if (e instanceof CalendarApiError && e.code === 'offline') {
      const s = readSnaps().find((x) => x.k === k);
      if (s) return { data: s.data, offline: true, savedAt: s.at };
    }
    throw e;
  }
}
export const fetchSources = (): Promise<{ sources: SourceInfo[] }> => call('GET', '/sources');
export const importSnapshot = (b: { format: 'ics' | 'json'; text: string; calendar?: string; from?: string; to?: string }): Promise<{ imported: number; calendars: string[]; skipped: string[]; skipped_count: number; range: { from: string; to: string } }> => call('POST', '/import', b);
export const clearImport = (): Promise<{ ok: true }> => call('DELETE', '/import');
export const syncGraph = (from: string, to: string): Promise<{ synced: number; errors: { calendar: string; error: string }[] }> => call('POST', '/sync', { from, to });
export { call as calendarCall };
