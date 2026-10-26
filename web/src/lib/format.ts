import { DAY_AR } from '../../../shared/constants.js';
import { DAY_MS, parseISO, weekEndMs, weekStartMs } from '../../../shared/semester.js';
import type { Assessment, Semester } from '../../../shared/types.js';

const LOC = 'ar-SA-u-ca-gregory-nu-latn';
const dfFull = new Intl.DateTimeFormat(LOC, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dfShort = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dfMonth = new Intl.DateTimeFormat(LOC, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dfWeekday = new Intl.DateTimeFormat(LOC, { weekday: 'short', timeZone: 'UTC' });

export const fmtDateFull = (ms: number): string => dfFull.format(ms);
export const fmtDateShort = (ms: number): string => dfShort.format(ms);
export const fmtMonth = (ms: number): string => dfMonth.format(ms);
export const fmtWeekday = (ms: number): string => dfWeekday.format(ms);
export const fmtISOFull = (iso: string): string => fmtDateFull(parseISO(iso));
export const fmtISOShort = (iso: string): string => fmtDateShort(parseISO(iso));

export function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return String(r);
}

export function weekRangeLabel(sem: Pick<Semester, 'start_date'>, k: number): string {
  return `${fmtDateShort(weekStartMs(sem, k))} – ${fmtDateShort(weekEndMs(sem, k))}`;
}

export function daysFrom(nowMs: number, targetMs: number): number {
  return Math.round((targetMs - nowMs) / DAY_MS);
}

export function relDays(d: number): string {
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غدًا';
  if (d === 2) return 'بعد يومين';
  if (d > 2 && d <= 10) return `بعد ${d} أيام`;
  if (d > 10) return `بعد ${d} يومًا`;
  if (d === -1) return 'أمس';
  return `قبل ${Math.abs(d)} يومًا`;
}

export function whenText(a: Assessment, sem: Semester): string {
  switch (a.timing) {
    case 'unknown':
      return 'الموعد غير معروف';
    case 'exam':
      return a.due_time ? `فترة الامتحانات · ${a.due_time}` : 'فترة الامتحانات — التاريخ غير معروف';
    case 'date': {
      const base = a.due_date ? fmtISOFull(a.due_date) : '';
      return `${base}${a.due_time ? ' · ' + a.due_time : ''}${a.week_no ? ' · الأسبوع ' + a.week_no : ''}`;
    }
    case 'week': {
      if (a.week_no === null) return 'الموعد غير معروف';
      if (a.week_from !== null && a.week_from < a.week_no) return `الأسابيع ${a.week_from} – ${a.week_no}`;
      return `الأسبوع ${a.week_no} (${weekRangeLabel(sem, a.week_no)})`;
    }
  }
}

/** يترجم أسماء الأيام داخل نص الجدول (Mon → الاثنين). */
export function prettySchedule(s: string | null): string {
  if (!s) return '';
  return s.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (d) => DAY_AR[d] ?? d);
}

export interface Slot { day: number; start: number; end: number; raw: string }
const DAY_IDX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
/** يستخرج الحصص من نص مثل: «Mon 11:00–13:00 (CCNA) · Wed 08:00–10:00 (CSL)». */
export function parseSlots(s: string | null): Slot[] {
  if (!s) return [];
  const out: Slot[] = [];
  const re = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s+(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    out.push({ day: DAY_IDX[m[1]!]!, start: Number(m[2]) * 60 + Number(m[3]), end: Number(m[4]) * 60 + Number(m[5]), raw: m[0] });
  }
  return out;
}

export const hhmm = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function initials(s: string): string {
  const w = s.replace(/\(.*?\)/g, '').replace(/\b(Dr|Prof|Mr|Mrs|Pn|Ir|Encik|binti|bin|Binti)\b\.?/gi, '').trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase() || '؟';
}
