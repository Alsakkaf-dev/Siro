import { describe, expect, it } from 'vitest';
import { daysLeftText, deadlineAlerts, notifiable, assessmentsInRange } from '../shared/review.js';
import type { Assessment, Course, Semester } from '../shared/types.js';

const D = (s: string): number => Date.parse(`${s}T00:00:00Z`);
const sem = { id: 's', code: 'S', name: 'S', year_no: 1, sem_no: 1, start_date: '2026-10-24', weeks: 14, break_weeks: [], exam_start: '2027-02-01', exam_end: '2027-02-12', note: null, source: 't' } as Semester;
const course = { id: 'c', semester_id: 's', code: 'SCSE1', name: 'x', color: '#fff' } as Course;
const a = (o: Partial<Assessment>): Assessment => ({ id: 'a' + Math.random(), course_id: 'c', kind: 'quiz', title: 't', weight: 5, count: 1, timing: 'date', week_no: null, week_from: null, due_date: null, due_time: null, venue: null, status: 'pending', score: null, max_score: 100, weight_assumed: false, crowd: false, note: null, sort: 0, source: 't', ...o });

describe('deadline alerts', () => {
  const today = D('2026-10-26');
  it('dated within horizon, overdue open ones, current-week approximate ones; nothing for unknown timing or done items', () => {
    const list = [
      a({ title: 'tomorrow', due_date: '2026-10-27' }),
      a({ title: 'today', due_date: '2026-10-26' }),
      a({ title: 'late', due_date: '2026-10-24' }),
      a({ title: 'far', due_date: '2026-12-01' }),
      a({ title: 'done', due_date: '2026-10-27', status: 'submitted' }),
      a({ title: 'week2', timing: 'week', week_no: 1 }),
      a({ title: 'week5', timing: 'week', week_no: 5 }),
      a({ title: 'unknown', timing: 'unknown' }),
    ];
    const r = deadlineAlerts(list, [course], sem, today);
    expect(r.map((x) => x.title)).toEqual(['late', 'today', 'tomorrow', 'week2']);
    expect(r[0]!.overdue).toBe(true);
    expect(r.find((x) => x.title === 'week2')!.kind).toBe('week');
    expect(r.map((x) => notifiable(x))).toEqual([false, true, true, false]);
    expect(daysLeftText(r[0]!)).toBe('فات منذ 2 أيام');
    expect(daysLeftText(r[1]!)).toBe('اليوم');
    expect(daysLeftText(r[2]!)).toBe('غدًا');
    expect(daysLeftText(r[3]!)).toMatch(/تقريبي/);
  });
  it('ignores assessments of unknown courses and invalid dates', () => {
    expect(deadlineAlerts([a({ course_id: 'zzz', due_date: '2026-10-27' }), a({ due_date: '2026-13-40' })], [course], sem, today)).toEqual([]);
  });
});

describe('assessmentsInRange', () => {
  it('dated inside range, week-based overlapping (approx), exam start; excludes outside', () => {
    const r = { start: D('2026-10-24'), end: D('2026-10-30') };
    const list = [
      a({ title: 'in', due_date: '2026-10-28' }),
      a({ title: 'out', due_date: '2026-11-03' }),
      a({ title: 'w1', timing: 'week', week_no: 1 }),
      a({ title: 'w3', timing: 'week', week_no: 3 }),
      a({ title: 'range', timing: 'week', week_from: 1, week_no: 2 }),
      a({ title: 'exam', timing: 'exam' }),
      a({ title: 'unk', timing: 'unknown' }),
    ];
    const res = assessmentsInRange(list, sem, r.start, r.end);
    expect(res.map((x) => x.a.title)).toEqual(['in', 'w1', 'range']);
    expect(res.map((x) => x.approx)).toEqual([false, true, true]);
    const exam = assessmentsInRange(list, sem, D('2027-01-30'), D('2027-02-05'));
    expect(exam.map((x) => x.a.title)).toEqual(['exam']);
  });
});
