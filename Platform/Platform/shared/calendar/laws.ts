/**
 * قوانين الجدول CAL-10…19 نقية: التصنيف والهرمية وثلاثية التحقق CAL-18 (تداخلات/فجوات/أقصر من 20 دقيقة).
 * المصدر مرجعه Outlook (CAL-02)؛ هنا نفحص ما يُعرض فقط.
 */
import { GAP_ABSORB_MAX, DEFAULT_CAL_NAMES, MIN_EVENT_MIN, NIGHT_FROM, NIGHT_TO, type Cal18, type CalEvent, type EventKind, type Gap, type Overlap } from './types.js';
import { addDays, dateOf, dayStartMin, daysBetween, hm, minWall, wallMin } from './tz.js';

const strip = (s: string): string => s.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s+/g, ' ').trim();
export const titleText = strip;

/** CAL-10: جبل (نوم، محاضرات) > ريح (صلوات) > موج (الباقي) */
export const HIERARCHY: Readonly<Record<EventKind, 'mountain' | 'wind' | 'wave'>> = {
  sleep: 'mountain', lecture: 'mountain', prayer: 'wind', meal: 'wave', free: 'wave', study: 'wave', workout: 'wave', routine: 'wave', other: 'wave',
};
export const RANK: Readonly<Record<'mountain' | 'wind' | 'wave', number>> = { mountain: 3, wind: 2, wave: 1 };
export const rankOf = (k: EventKind): number => RANK[HIERARCHY[k]];

const MEAL_TITLES = new Set(['فطور', 'غداء', 'عشاء']);
/** تصنيف الحدث: ما حدده المصدر ثم العنوان/التقويم/التصنيف */
export function kindOf(e: Pick<CalEvent, 'kind' | 'title' | 'calendar' | 'categories' | 'show_as'>): EventKind {
  if (e.kind) return e.kind;
  const t = e.title;
  const bare = strip(t);
  if (/😴|🛏|جاري النوم/u.test(t) || bare === 'نوم') return 'sleep';
  if (MEAL_TITLES.has(bare)) return 'meal';
  if (e.calendar === 'صلاة' || /^صلاة\s/.test(bare)) return 'prayer';
  if (e.calendar === 'وقت فراغ' || /^(\d+h(\.\d+m)?|\d+m)$/.test(bare)) return 'free';
  if (e.categories.some((c) => c === 'محاضرة') || (e.calendar === 'دراسة' && /محاضرة|lecture/i.test(t))) return 'lecture';
  if (e.calendar === 'دراسة') return 'study';
  if (/تمرين|رياضة/.test(bare)) return 'workout';
  if (e.calendar === 'روتين وصحة') return 'routine';
  return 'other';
}

/** CAL-11: عنوان حدث الفراغ 2h.33m / 2h / 49m / 1h.4m (بلا أصفار بادئة) */
export function freeTitle(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h.${m}m`;
  return h > 0 ? `${h}h` : `${m}m`;
}

interface Seg { id: string; title: string; s: number; e: number }
/** شرائح اليوم [0,1440) من الأحداث المقصوصة بحدود اليوم */
function segsOf(events: readonly CalEvent[], date: string): Seg[] {
  const d0 = dayStartMin(date);
  const out: Seg[] = [];
  for (const ev of events) {
    const s = wallMin(ev.start);
    const e = wallMin(ev.end);
    if (!(e > s)) continue;
    const a = Math.max(s, d0);
    const b = Math.min(e, d0 + 1440);
    if (b > a) out.push({ id: ev.id, title: ev.title, s: a - d0, e: b - d0 });
  }
  return out.sort((x, y) => x.s - y.s || x.e - y.e);
}

/** CAL-18 على مدى [from, to] شاملًا. الأحداث ليوم كامل (بلا وقت) غير مشمولة. */
export function verifyRange(events: readonly CalEvent[], from: string, to: string): Cal18 {
  const overlaps: Overlap[] = [];
  const gaps: Gap[] = [];
  const n = Math.max(0, daysBetween(from, to)) + 1;
  for (let i = 0; i < n; i++) {
    const date = addDays(from, i);
    const segs = segsOf(events, date);
    const d0 = dayStartMin(date);
    let cursor = 0;
    let lastTitle: string | null = null;
    let active: Seg[] = [];
    for (const sg of segs) {
      if (sg.s > cursor) {
        const minutes = sg.s - cursor;
        gaps.push({ date, start: minWall(d0 + cursor), end: minWall(d0 + sg.s), minutes, before: lastTitle, after: sg.title, action: minutes <= GAP_ABSORB_MAX ? 'absorb' : 'free_event' });
      }
      // كل زوج متداخل مرة واحدة (CAL-13)
      active = active.filter((a) => a.e > sg.s);
      for (const a of active) {
        const e = Math.min(sg.e, a.e);
        overlaps.push({ date, a: a.id, b: sg.id, a_title: a.title, b_title: sg.title, start: minWall(d0 + sg.s), end: minWall(d0 + e), minutes: e - sg.s });
      }
      active.push(sg);
      if (sg.e > cursor) {
        cursor = sg.e;
        lastTitle = sg.title;
      }
    }
    if (cursor < 1440) {
      const minutes = 1440 - cursor;
      gaps.push({ date, start: minWall(d0 + cursor), end: minWall(d0 + 1440), minutes, before: lastTitle, after: null, action: minutes <= GAP_ABSORB_MAX ? 'absorb' : 'free_event' });
    }
  }
  const fromMin = dayStartMin(from);
  const toMin = dayStartMin(to) + 1440;
  const inRange = (ev: CalEvent): boolean => wallMin(ev.end) > fromMin && wallMin(ev.start) < toMin;
  const visible = events.filter(inRange);
  const short = visible.filter((e) => wallMin(e.end) - wallMin(e.start) < MIN_EVENT_MIN).map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, minutes: wallMin(e.end) - wallMin(e.start) }));
  const default_calendar = visible.filter((e) => DEFAULT_CAL_NAMES.includes(e.calendar)).map((e) => ({ id: e.id, title: e.title }));
  // CAL-19 (استشاري): الليل 21:40–05:10 للنوم؛ ما سواه (عدا الفراغ) يُبلَّغ
  const nf = Number(NIGHT_FROM.slice(0, 2)) * 60 + Number(NIGHT_FROM.slice(3));
  const nt = Number(NIGHT_TO.slice(0, 2)) * 60 + Number(NIGHT_TO.slice(3));
  const night = visible
    .filter((e) => {
      const k = kindOf(e);
      if (k === 'sleep' || k === 'free') return false;
      const s = wallMin(e.start) - dayStartMin(dateOf(e.start));
      const e2 = wallMin(e.end) - dayStartMin(dateOf(e.start));
      return s < nt || e2 > nf;
    })
    .map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end }));
  return { from, to, overlaps, gaps, short, default_calendar, night, days_checked: n, ok: overlaps.length === 0 && gaps.length === 0 && short.length === 0 && default_calendar.length === 0 };
}

/** ملخص الثلاثية 0/0/0 */
export const triple = (v: Cal18): { overlaps: number; gaps: number; short: number } => ({ overlaps: v.overlaps.length, gaps: v.gaps.length, short: v.short.length });

export const fmtGap = (g: Gap): string => `${g.date} ${hm(wallMin(g.start) - dayStartMin(g.date))}–${g.minutes >= 1440 || wallMin(g.end) - dayStartMin(g.date) >= 1440 ? '24:00' : hm(wallMin(g.end) - dayStartMin(g.date))} (${g.minutes} د)`;
