/**
 * إسقاط «خريطة الروتين» (ROUTINE_BLOCKS_AR ) على تواريخ حقيقية.
 * ليس Outlook: قالب أسبوعي مستخرج منه. الأحداث موسومة source=routine ويعرضها الجدول بتنبيه «ليست من Outlook مباشرة» (CAL-02).
 * الصلوات تقريبية (جدول 14 أكتوبر)؛ النقاط بلا مدة (RP-xx) ليست أحداثًا فلا تُسقَط.
 */
import { addDays, daysBetween, dowOf, minWall, dayStartMin } from './tz.js';
import type { CalEvent, EventKind } from './types.js';

export interface RoutineBlockLike { id: string; day: string; start_min: number; end_min: number; type: string; label_ar?: string; name_original?: string; note_ar?: string | null; confidence?: string; moves_with_prayer_time?: boolean; source?: { calendar?: string | null; source_id?: string } }
export interface RoutineDocLike { blocks: RoutineBlockLike[]; holidays?: { name_ar: string; from: string; to?: string | null }[]; generated_at?: string; exported_at?: string }

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const KIND: Record<string, EventKind | null> = { sleep: 'sleep', routine: 'routine', prayer: 'prayer', free: 'free', lecture: 'lecture', travel: 'other', local_routine: null };
const CAL_OF_KIND: Record<string, string> = { sleep: 'روتين وصحة', routine: 'روتين وصحة', prayer: 'صلاة', free: 'وقت فراغ', lecture: 'دراسة', travel: 'عام' };

export function routineToEvents(doc: RoutineDocLike, from: string, to: string): CalEvent[] {
  const byDay = new Map<string, RoutineBlockLike[]>();
  for (const b of doc.blocks) {
    if (KIND[b.type] === undefined || KIND[b.type] === null || !(b.end_min > b.start_min)) continue;
    (byDay.get(b.day) ?? byDay.set(b.day, []).get(b.day)!).push(b);
  }
  const out: CalEvent[] = [];
  const n = Math.max(0, daysBetween(from, to)) + 1;
  for (let i = 0; i < n; i++) {
    const date = addDays(from, i);
    const d0 = dayStartMin(date);
    for (const b of byDay.get(DAY_KEYS[dowOf(date)]!) ?? []) {
      const kind = KIND[b.type]!;
      const cal = b.source?.calendar || CAL_OF_KIND[b.type] || 'عام';
      out.push({
        id: `rt:${b.id}:${date}`,
        source: 'routine',
        calendar: cal,
        title: b.name_original ?? b.label_ar ?? b.id,
        start: minWall(d0 + b.start_min),
        end: minWall(d0 + b.end_min),
        show_as: b.type === 'free' ? 'free' : 'busy',
        categories: [],
        description: b.note_ar ?? '',
        series: `rt:${b.id}`,
        kind,
      });
    }
  }
  return out;
}

export function holidaysIn(doc: RoutineDocLike, from: string, to: string): { name_ar: string; from: string; to: string }[] {
  return (doc.holidays ?? []).map((h) => ({ name_ar: h.name_ar, from: h.from, to: h.to ?? h.from })).filter((h) => h.to >= from && h.from <= to);
}
