/** محوّلات (adapters): تعرض بيانات المجالات القائمة كعناصر زمنية موحّدة — لليوم/الأسبوع/كل شيء.
 *  لا تنقل بيانات ولا تعدّل جداول المجالات (ADR-0002). */
import type { Db } from '../db.js';
import { allData } from '../repo.js';
import { dueSortMs, isOpen } from '../../shared/semester.js';
import { KIND_LABEL, STATUS_LABEL } from '../../shared/constants.js';
import { WEEKDAYS } from '../../shared/sports.js';
import { listSpaces, withComputed, itemFromRow } from './repo.js';
import type { WosItem } from '../../shared/wos.js';

export interface AgendaEntry {
  ref: string;
  kind: 'assessment' | 'item' | 'workout';
  title: string;
  subtitle: string;
  date: string | null;
  /** التاريخ تقريبي (نهاية أسبوع أو فترة امتحانات) — مبدأ «لا تخمين» */
  approx: boolean;
  color: string;
  to: string;
  done: boolean;
  status: string | null;
  status_label: string | null;
  category: 'todo' | 'active' | 'done' | 'blocked';
  space_id?: string;
  weight?: number;
}

const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const ASMT_CAT: Record<string, AgendaEntry['category']> = { unknown: 'todo', pending: 'todo', submitted: 'done', graded: 'done' };

export function academicEntries(db: Db): AgendaEntry[] {
  const d = allData(db);
  const sems = new Map(d.semesters.map((s) => [s.id, s]));
  const courses = new Map(d.courses.map((c) => [c.id, c]));
  const out: AgendaEntry[] = [];
  for (const a of d.assessments) {
    const c = courses.get(a.course_id);
    const s = c ? sems.get(c.semester_id) : undefined;
    if (!c || !s) continue;
    const ms = dueSortMs(a, s);
    out.push({
      ref: `acad:asmt:${a.id}`,
      kind: 'assessment',
      title: a.title,
      subtitle: `${c.code} · ${KIND_LABEL[a.kind]} · ${a.weight}%`,
      date: ms === null ? null : iso(ms),
      approx: a.timing !== 'date',
      color: c.color,
      to: `/academic/s/${s.id}/courses/${c.id}#a-${a.id}`,
      done: !isOpen(a),
      status: a.status,
      status_label: STATUS_LABEL[a.status],
      category: ASMT_CAT[a.status] ?? 'todo',
      weight: a.weight,
    });
  }
  return out;
}

export function itemEntries(db: Db, ws: string): AgendaEntry[] {
  const spaces = listSpaces(db, ws);
  const out: AgendaEntry[] = [];
  for (const s of spaces) {
    const rows = db.all<Record<string, unknown>>('SELECT * FROM wos_items WHERE workspace_id = ? AND space_id = ? AND archived = 0', ws, s.id).map(itemFromRow);
    for (const it of withComputed(db, ws, s.type, rows) as WosItem[]) {
      const st = s.type.statuses.find((x) => x.id === it.status);
      out.push({
        ref: `wos:${it.id}`,
        kind: 'item',
        title: it.title,
        subtitle: s.name,
        date: it.due,
        approx: false,
        color: s.color,
        to: `/spaces/${s.id}?item=${it.id}`,
        done: !!it.done_at,
        status: it.status,
        status_label: st?.name ?? null,
        category: st?.category ?? 'todo',
        space_id: s.id,
      });
    }
  }
  return out;
}

/** تماريني المعيّنة لأيام الأسبوع، مفرودة على تواريخ النطاق */
export function workoutEntries(db: Db, from: string, to: string): AgendaEntry[] {
  const week = new Map(db.all<{ day: string; workout_id: string | null; name: string | null }>('SELECT w.day, w.workout_id, s.name FROM spt_week w LEFT JOIN spt_workouts s ON s.id = w.workout_id').map((r) => [r.day, r]));
  if (![...week.values()].some((r) => r.workout_id)) return [];
  const out: AgendaEntry[] = [];
  // JS getUTCDay: 0=الأحد … 6=السبت ؛ WEEKDAYS يبدأ بالسبت
  const byJs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  for (let ms = Date.parse(from); ms <= Date.parse(to); ms += 86_400_000) {
    const day = byJs[new Date(ms).getUTCDay()]!;
    const r = week.get(day);
    if (!r?.workout_id || !(WEEKDAYS as readonly string[]).includes(day)) continue;
    out.push({ ref: `spt:w:${r.workout_id}`, kind: 'workout', title: r.name ?? 'تمرين', subtitle: 'تماريني', date: iso(ms), approx: false, color: '#F97362', to: '/sports/mine', done: false, status: null, status_label: null, category: 'todo' });
  }
  return out;
}

/** جدول الأعمال: المتأخر المفتوح + كل ما يقع في [from, to] */
export function agenda(db: Db, ws: string, from: string, to: string, today: string): { overdue: AgendaEntry[]; range: AgendaEntry[]; undated: number } {
  const all = [...academicEntries(db), ...itemEntries(db, ws)];
  const overdue = all.filter((e) => !e.done && e.date !== null && e.date < today).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  const range = [...all.filter((e) => e.date !== null && e.date >= from && e.date <= to), ...workoutEntries(db, from, to)].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || Number(a.done) - Number(b.done));
  const undated = all.filter((e) => e.date === null && !e.done).length;
  return { overdue, range, undated };
}
