/**
 * محوّل Microsoft Graph (API-19) — قراءة فقط. غير مُتحقَّق منه ضد Outlook حقيقي هنا (لا بيانات اعتماد): يُختبر بـfixtures بشكل الاستجابة الموثّق.
 * CAL-23: الجلب لكل تقويم على حدة (بلا تحديد التقويم يُعيد الافتراضي فقط)، 5 طلبات متوازية كحد أقصى (CAL-25).
 */
import { TZ, convertWall, normalizeTz } from './tz.js';
import type { CalEvent } from './types.js';

export const GRAPH_HOST = 'graph.microsoft.com';
export const GRAPH_MAX_PARALLEL = 5;

export interface GraphEvent {
  id: string;
  subject?: string | null;
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  showAs?: string;
  categories?: string[];
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  type?: 'singleInstance' | 'occurrence' | 'exception' | 'seriesMaster';
  seriesMasterId?: string | null;
  isAllDay?: boolean;
  isCancelled?: boolean;
}
const wallOf = (t: { dateTime: string; timeZone?: string } | undefined): string | null => {
  if (!t?.dateTime) return null;
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(t.dateTime);
  if (!m) return null;
  const tz = normalizeTz(t.timeZone ?? 'UTC');
  return tz ? convertWall(`${m[1]}T${m[2]}`, tz) : null;
};

/** حدث Graph → CalEvent (null للأحداث الملغاة/اليوم الكامل/الماستر/غير المفهومة) */
export function mapGraphEvent(g: GraphEvent, calendar: string): CalEvent | null {
  if (g.isCancelled || g.isAllDay || g.type === 'seriesMaster') return null;
  const start = wallOf(g.start);
  const end = wallOf(g.end);
  if (!start || !end) return null;
  const desc = g.body?.contentType === 'html' ? (g.bodyPreview ?? '') : (g.body?.content ?? g.bodyPreview ?? '');
  return {
    id: g.id, source: 'graph', calendar, title: g.subject?.trim() || '(بلا عنوان)', start, end,
    show_as: g.showAs === 'free' ? 'free' : 'busy', categories: g.categories ?? [], description: desc.replace(/\r\n?/g, '\n').trim(), series: g.seriesMasterId ?? null,
  };
}

export function calendarViewUrl(calendarId: string, from: string, to: string, top = 200): string {
  const q = new URLSearchParams({ startDateTime: `${from}T00:00:00`, endDateTime: `${to}T23:59:59`, $top: String(top), $select: 'id,subject,start,end,showAs,categories,body,bodyPreview,type,seriesMasterId,isAllDay,isCancelled' });
  return `https://${GRAPH_HOST}/v1.0/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${q.toString()}`;
}
/** SSRF (SEC-05): لا نتبع إلا روابط Graph نفسها */
export const isGraphUrl = (u: string): boolean => {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && x.hostname === GRAPH_HOST;
  } catch {
    return false;
  }
};

type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export interface GraphCalendar { id: string; name: string }

/** يجلب أحداث تقويم واحد بترقيم @odata.nextLink (سقف 20 صفحة) */
export async function fetchCalendar(f: FetchLike, token: string, cal: GraphCalendar, from: string, to: string): Promise<{ events: CalEvent[]; error: string | null }> {
  const events: CalEvent[] = [];
  let url: string | null = calendarViewUrl(cal.id, from, to);
  for (let page = 0; url && page < 20; page++) {
    if (!isGraphUrl(url)) return { events, error: 'رابط ترقيم خارج Graph' };
    let res;
    try {
      res = await f(url, { headers: { Authorization: `Bearer ${token}`, Prefer: `outlook.timezone="${TZ}"`, Accept: 'application/json' } });
    } catch {
      return { events, error: 'تعذّر الاتصال بـGraph' };
    }
    if (!res.ok) return { events, error: res.status === 401 || res.status === 403 ? 'رمز Graph مرفوض أو منتهٍ' : res.status === 429 ? 'Graph يخنق الطلبات (429)' : `Graph أعاد ${res.status}` };
    const j = (await res.json()) as { value?: GraphEvent[]; '@odata.nextLink'?: string };
    for (const g of j.value ?? []) {
      const e = mapGraphEvent(g, cal.name);
      if (e) events.push(e);
    }
    url = typeof j['@odata.nextLink'] === 'string' ? j['@odata.nextLink'] : null;
  }
  return { events, error: null };
}

/** كل التقاويم بتزامن محدود (CAL-25) */
export async function fetchAllCalendars(f: FetchLike, token: string, cals: readonly GraphCalendar[], from: string, to: string): Promise<{ events: CalEvent[]; errors: { calendar: string; error: string }[]; per: Record<string, number> }> {
  const events: CalEvent[] = [];
  const errors: { calendar: string; error: string }[] = [];
  const per: Record<string, number> = {};
  let i = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const c = cals[i++];
      if (!c) return;
      const r = await fetchCalendar(f, token, c, from, to);
      if (r.error) errors.push({ calendar: c.name, error: r.error });
      per[c.name] = r.events.length;
      events.push(...r.events);
    }
  };
  await Promise.all(Array.from({ length: Math.min(GRAPH_MAX_PARALLEL, cals.length) }, worker));
  return { events, errors, per };
}
