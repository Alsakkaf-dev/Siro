/** تنسيق الجدول: أرقام 0-9 (I18N-02) وتواريخ ميلادية عربية. */
import { addDays, dowOf, hm, minWall, wallMin, dayStartMin } from '../../../shared/calendar/index.js';

export const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] as const;
export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] as const;
export const dayName = (date: string): string => DAYS_AR[dowOf(date)]!;
export const dayNum = (date: string): number => Number(date.slice(8, 10));
export const monthName = (date: string): string => MONTHS_AR[Number(date.slice(5, 7)) - 1]!;
export const fmtDay = (date: string): string => `${dayName(date)} ${dayNum(date)} ${monthName(date)} ${date.slice(0, 4)}`;
export const timeRange = (s: string, e: string): string => {
  const d0 = dayStartMin(s.slice(0, 10));
  const sm = wallMin(s) - d0;
  const em = wallMin(e) - d0;
  return `${hm(sm)}–${em >= 1440 ? (em === 1440 ? '24:00' : `${hm(em)} (+${Math.floor(em / 1440)})`) : hm(em)}`;
};
export const durText = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h} س ${m} د` : h ? `${h} س` : `${m} د`;
};
export const monthGridRange = (date: string): { from: string; to: string } => {
  const first = `${date.slice(0, 7)}-01`;
  const lastD = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0)).getUTCDate();
  const last = `${date.slice(0, 7)}-${String(lastD).padStart(2, '0')}`;
  return { from: addDays(first, -dowOf(first)), to: addDays(last, 6 - dowOf(last)) };
};
export const sinceText = (iso: string, nowMs = Date.now()): string => {
  const min = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 60_000));
  if (min < 2) return 'الآن';
  if (min < 60) return min <= 10 ? `قبل ${min} دقائق` : `قبل ${min} دقيقة`;
  if (min < 1440) {
    const h = Math.round(min / 60);
    return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : h <= 10 ? `قبل ${h} ساعات` : `قبل ${h} ساعة`;
  }
  const d = Math.round(min / 1440);
  return d === 1 ? 'قبل يوم' : d === 2 ? 'قبل يومين' : d <= 10 ? `قبل ${d} أيام` : `قبل ${d} يومًا`;
};
export { minWall };
