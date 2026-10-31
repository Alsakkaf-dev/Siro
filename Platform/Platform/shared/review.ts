/** منطق مواعيد التسليم والتقييمات (تنبيهات الجرس والمراجعة). دوال نقية بلا وصول لملفات أو شبكة. مراجعة الأسبوع نفسها في weekly.ts. */
import { DAY_MS, dueSortMs, isOpen, parseISO, toISO, weekOf } from './semester.js';
import type { AcademicNote, Assessment, Course, Semester } from './types.js';

/** عدد «غير المعروف» في فصل: تقييمات بلا موعد/حالة + ملاحظات «غير معروف» مفتوحة + مواد بلا ساعات معتمدة. */
export function unknownTotal(b: { assessments: Assessment[]; notes: AcademicNote[]; courses: Course[] }): number {
  return b.assessments.filter((a) => a.timing === 'unknown' || a.status === 'unknown').length + b.notes.filter((n) => n.tag === 'unk' && !n.resolved).length + b.courses.filter((c) => c.credits === null).length;
}

export interface DeadlineAlert {
  id: string; title: string; course: string; color: string;
  /** dated: تاريخ محدد · week: أسبوع الفصل فقط (تقريبي) · exam: فترة الامتحانات */
  kind: 'dated' | 'week' | 'exam';
  daysLeft: number | null; dueDate: string | null; dueTime: string | null; overdue: boolean; weight: number;
}

/** مواعيد تحتاج انتباهًا: المحددة بتاريخ خلال horizon يومًا (أو فائتة لم تُسلَّم)، وتقييمات الأسبوع الحالي، والامتحانات القريبة. لا نخمّن تاريخًا لما ليس له تاريخ. */
export function deadlineAlerts(assessments: Assessment[], courses: Course[], sem: Semester, todayUtc: number, horizonDays = 7): DeadlineAlert[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const curWeek = weekOf(todayUtc, parseISO(sem.start_date));
  const out: DeadlineAlert[] = [];
  for (const a of assessments) {
    if (!isOpen(a)) continue;
    const c = byId.get(a.course_id);
    if (!c) continue;
    const base = { id: a.id, title: a.title, course: c.code, color: c.color, dueTime: a.due_time, weight: a.weight };
    if (a.timing === 'date' && a.due_date && !Number.isNaN(parseISO(a.due_date))) {
      const d = Math.round((parseISO(a.due_date) - todayUtc) / DAY_MS);
      if (d <= horizonDays) out.push({ ...base, kind: 'dated', daysLeft: d, dueDate: a.due_date, overdue: d < 0 });
    } else if (a.timing === 'week' && a.week_no !== null && curWeek >= 1 && curWeek <= sem.weeks) {
      const from = a.week_from ?? a.week_no;
      if (curWeek >= from && curWeek <= a.week_no) out.push({ ...base, kind: 'week', daysLeft: null, dueDate: null, overdue: false });
    } else if (a.timing === 'exam') {
      const t = dueSortMs(a, sem);
      if (t !== null) {
        const d = Math.round((t - todayUtc) / DAY_MS);
        if (d >= 0 && d <= horizonDays) out.push({ ...base, kind: 'exam', daysLeft: d, dueDate: toISO(t), overdue: false });
      }
    }
  }
  const rank = (x: DeadlineAlert): number => (x.overdue ? -1000 + (x.daysLeft ?? 0) : x.daysLeft ?? 500);
  return out.sort((a, b) => rank(a) - rank(b) || b.weight - a.weight);
}

export function daysLeftText(a: Pick<DeadlineAlert, 'kind' | 'daysLeft' | 'overdue'>): string {
  if (a.kind === 'week') return 'هذا الأسبوع (موعد تقريبي)';
  const d = a.daysLeft ?? 0;
  if (a.overdue) return d === -1 ? 'فات أمس' : `فات منذ ${-d} أيام`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غدًا';
  if (d === 2) return 'بعد يومين';
  return `بعد ${d} أيام`;
}

/** من نُرسل له إشعار نظام: المحددة بتاريخ فقط (اليوم أو غدًا)، ولا نُشعر بالتقريبية ولا الفائتة. */
export const notifiable = (a: DeadlineAlert): boolean => a.kind === 'dated' && !a.overdue && (a.daysLeft === 0 || a.daysLeft === 1);

/* ───── التقييمات ضمن مدى أيام ───── */
export interface RangeItem { a: Assessment; approx: boolean }
/** تقييمات الفصل التي تقع في [startMs, endMs]: المحددة بتاريخ داخل المدى، والمحددة بأسبوع دراسي يتقاطع مع المدى (approx = موعد تقريبي)، والامتحانات التي تبدأ فيه. */
export function assessmentsInRange(assessments: Assessment[], sem: Semester, startMs: number, endMs: number): RangeItem[] {
  const s0 = parseISO(sem.start_date);
  const wFrom = weekOf(startMs, s0);
  const wTo = weekOf(endMs, s0);
  const out: RangeItem[] = [];
  for (const a of assessments) {
    if (a.timing === 'date') {
      const t = a.due_date ? parseISO(a.due_date) : Number.NaN;
      if (!Number.isNaN(t) && t >= startMs && t <= endMs) out.push({ a, approx: false });
    } else if (a.timing === 'week' && a.week_no !== null) {
      const from = a.week_from ?? a.week_no;
      if (a.week_no >= wFrom && from <= wTo && wTo >= 1 && wFrom <= sem.weeks) out.push({ a, approx: true });
    } else if (a.timing === 'exam' && sem.exam_start) {
      const t = parseISO(sem.exam_start);
      if (!Number.isNaN(t) && t >= startMs && t <= endMs) out.push({ a, approx: false });
    }
  }
  return out.sort((x, y) => Number(x.approx) - Number(y.approx) || (dueSortMs(x.a, sem) ?? 0) - (dueSortMs(y.a, sem) ?? 0) || x.a.sort - y.a.sort);
}
