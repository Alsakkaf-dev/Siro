import { describe, expect, it } from 'vitest';
import { weightSum } from '../shared/semester.js';
import { asAssessment, loadSeed } from './helpers.js';

const seed = loadSeed();
const by = (code: string) => {
  const c = seed.courses.find((x) => x.code === code)!;
  return { c, items: seed.assessments.filter((a) => a.course_id === c.id).map(asAssessment) };
};
const sum = (xs: { weight: number; count: number }[], f: (x: never) => boolean = () => true): number => xs.filter(f as never).reduce((s, x) => s + x.weight, 0);

describe('seed integrity', () => {
  it('has 6 courses, 47 rows, Σcount 52 (matches the dashboard)', () => {
    expect(seed.courses).toHaveLength(6);
    expect(seed.assessments).toHaveLength(47);
    expect(seed.assessments.reduce((s, a) => s + a.count, 0)).toBe(52);
  });
  it('each course with assessments sums to exactly 100', () => {
    for (const c of seed.courses) {
      const items = seed.assessments.filter((a) => a.course_id === c.id);
      if (items.length) expect(weightSum(items as never), c.code).toBe(100);
    }
  });
  it('French has no invented assessments and unknown credits', () => {
    const fr = by('UHLF1112');
    expect(fr.items).toHaveLength(0);
    expect(fr.c.credits).toBeNull();
  });
  it('credits total 14 (3+3+3+3+2, French unknown)', () => {
    expect(seed.courses.reduce((s, c) => s + (c.credits ?? 0), 0)).toBe(14);
  });
  it('no invented grades: all scores null and status pending', () => {
    for (const a of seed.assessments) {
      expect(a.score).toBeNull();
      expect(a.status).toBe('pending');
    }
  });
  it('every assessment references a course and has valid timing data', () => {
    const ids = new Set(seed.courses.map((c) => c.id));
    for (const a of seed.assessments) {
      expect(ids.has(a.course_id)).toBe(true);
      if (a.timing === 'week') expect(a.week_no).toBeGreaterThanOrEqual(1);
      if (a.timing === 'date') expect(a.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (a.timing === 'unknown') expect(a.week_no).toBeNull();
    }
  });
});

/** حقائق مأخوذة يدويًا من ملفات الـCI (/workspace/ci/*.txt) بشكل مستقل عن الـseed. */
describe('seed matches the official CI documents', () => {
  it('SCSE3103: 3×5 quizzes, Test 15, project 5+10+10+5, final 40', () => {
    const { c, items } = by('SCSE3103');
    expect(c.credits).toBe(3);
    expect(sum(items, (a: { kind: string }) => a.kind === 'quiz')).toBe(15);
    expect(items.find((a) => a.title === 'Test 1')!.weight).toBe(15);
    expect(items.filter((a) => a.kind === 'project').map((a) => a.weight).sort((x, y) => x - y)).toEqual([5, 5, 10, 10]);
    const f = items.find((a) => a.kind === 'final')!;
    expect(f.weight).toBe(40);
    expect(f.timing).toBe('exam');
  });
  it('SCSE3143: no final; Mid-Term 25, quizzes 10, proposal 10, project dev 20, group assignment 20, problem solving 15', () => {
    const { items } = by('SCSE3143');
    expect(items.some((a) => a.kind === 'final')).toBe(false);
    expect(items.find((a) => a.kind === 'test')!.weight).toBe(25);
    expect(sum(items, (a: { kind: string }) => a.kind === 'quiz')).toBe(10);
    expect(items.find((a) => /Proposal/.test(a.title))!.weight).toBe(10);
    expect(items.find((a) => /Development/.test(a.title))!.weight).toBe(20);
    expect(items.find((a) => /Group Assignment/.test(a.title))!.weight).toBe(20);
    expect(sum(items, (a: { title: string }) => /Problem Solving/.test(a.title))).toBe(15);
  });
  it('SCSE3203: labs 5×3, quizzes 2×5, test 20 on 2026-12-10, assignment 10, project 3+7+5, final 30', () => {
    const { items } = by('SCSE3203');
    expect(items.filter((a) => a.kind === 'lab')).toHaveLength(5);
    expect(sum(items, (a: { kind: string }) => a.kind === 'lab')).toBe(15);
    expect(sum(items, (a: { kind: string }) => a.kind === 'quiz')).toBe(10);
    const t = items.find((a) => a.kind === 'test')!;
    expect(t.weight).toBe(20);
    expect(t.due_date).toBe('2026-12-10');
    expect(sum(items, (a: { title: string }) => /^Assignment/.test(a.title))).toBe(10);
    expect(sum(items, (a: { kind: string }) => a.kind === 'project')).toBe(15);
    expect(items.find((a) => a.kind === 'final')!.weight).toBe(30);
  });
  it('SKEX2123: tests 20+20 (20 Nov / 9 Jan), group assignments 20+20 (18 Dec / 16 Jan), individual 10 (11 Dec), 5 quizzes = 10', () => {
    const { items } = by('SKEX2123');
    const d = (t: string) => items.find((a) => a.title === t)!;
    expect(d('Test 1')).toMatchObject({ weight: 20, due_date: '2026-11-20' });
    expect(d('Test 2')).toMatchObject({ weight: 20, due_date: '2027-01-09' });
    expect(d('Group Assignment 1')).toMatchObject({ weight: 20, due_date: '2026-12-18' });
    expect(d('Group Assignment 2')).toMatchObject({ weight: 20, due_date: '2027-01-16' });
    expect(d('Individual Assignment')).toMatchObject({ weight: 10, due_date: '2026-12-11' });
    expect(items.filter((a) => a.kind === 'quiz')).toHaveLength(5);
    expect(sum(items, (a: { kind: string }) => a.kind === 'quiz')).toBe(10);
    expect(items.some((a) => a.kind === 'final')).toBe(false);
  });
  it('UHLB2122: online quizzes 10 (×6), group discussion 15, report 40, oral 15, response 20; 2 credits', () => {
    const { c, items } = by('UHLB2122');
    expect(c.credits).toBe(2);
    const q = items.find((a) => a.kind === 'quiz')!;
    expect(q.weight).toBe(10);
    expect(q.count).toBe(6);
    expect(items.find((a) => /Discussion/.test(a.title))!.weight).toBe(15);
    expect(items.find((a) => /Report/.test(a.title))!.weight).toBe(40);
    expect(items.find((a) => /Oral/.test(a.title))!.weight).toBe(15);
    expect(items.find((a) => /Response/.test(a.title))!.weight).toBe(20);
  });
  it('semester: starts 2026-10-12, 16 weeks, break week 8, exams 31 Jan – 19 Feb 2027', () => {
    expect(seed.semester).toMatchObject({ start_date: '2026-10-12', weeks: 16, break_weeks: [8], exam_start: '2027-01-31', exam_end: '2027-02-19' });
  });
});
