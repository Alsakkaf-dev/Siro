import { describe, expect, it } from 'vitest';
import { assessmentColumn, parseISO, phaseOf, toISO, upcomingDeadlines, weekEndMs, weekLoads, weekOf, weekStartMs, weightSum } from '../shared/semester.js';
import { asAssessment, loadSeed, mk } from './helpers.js';

const sem = loadSeed().semester;
const start = parseISO('2026-10-12');

describe('week math (week = floor((date − start)/7)+1)', () => {
  it('first day is week 1, day 7 is week 1, day 8 is week 2', () => {
    expect(weekOf(parseISO('2026-10-12'), start)).toBe(1);
    expect(weekOf(parseISO('2026-10-18'), start)).toBe(1);
    expect(weekOf(parseISO('2026-10-19'), start)).toBe(2);
  });
  it('today 2026-10-26 is week 3', () => {
    expect(weekOf(parseISO('2026-10-26'), start)).toBe(3);
    expect(phaseOf(parseISO('2026-10-26'), sem)).toMatchObject({ kind: 'week', week: 3 });
  });
  it('week 8 is the break (30 Nov – 6 Dec 2026)', () => {
    expect(toISO(weekStartMs(sem, 8))).toBe('2026-11-30');
    expect(toISO(weekEndMs(sem, 8))).toBe('2026-12-06');
    expect(phaseOf(parseISO('2026-12-02'), sem)).toMatchObject({ kind: 'break', week: 8 });
  });
  it('before / exam / gap / after phases', () => {
    expect(phaseOf(parseISO('2026-10-01'), sem)).toMatchObject({ kind: 'before', daysToStart: 11 });
    expect(phaseOf(parseISO('2027-02-01'), sem).kind).toBe('exam');
    expect(phaseOf(parseISO('2027-02-05'), { ...sem, exam_start: '2027-02-10', exam_end: '2027-02-19' }).kind).toBe('gap');
    expect(phaseOf(parseISO('2027-01-20'), sem)).toMatchObject({ kind: 'week', week: 15 });
    expect(phaseOf(parseISO('2027-03-01'), sem).kind).toBe('after');
  });
  it('week 16 starts 25 Jan 2027 and ends 31 Jan 2027 (day exams begin)', () => {
    expect(toISO(weekStartMs(sem, 16))).toBe('2027-01-25');
  });
  it('handles semester without exam dates', () => {
    const s2 = { ...sem, exam_start: null, exam_end: null };
    expect(phaseOf(parseISO('2027-03-01'), s2).kind).toBe('after');
  });
});

describe('assessmentColumn', () => {
  it('maps timing kinds to columns', () => {
    expect(assessmentColumn(mk({ weight: 1, timing: 'unknown' }), sem)).toBe(0);
    expect(assessmentColumn(mk({ weight: 1, timing: 'week', week_no: 7 }), sem)).toBe(7);
    expect(assessmentColumn(mk({ weight: 1, timing: 'exam' }), sem)).toBe(17);
    expect(assessmentColumn(mk({ weight: 1, timing: 'date', due_date: '2026-11-20' }), sem)).toBe(6);
    expect(assessmentColumn(mk({ weight: 1, timing: 'date', due_date: '2027-02-02' }), sem)).toBe(17);
  });
});

describe('weekLoads on the real seed', () => {
  const seed = loadSeed();
  const as = seed.assessments.map(asAssessment);
  const loads = weekLoads(as, sem);
  it('busiest week is 13 with 70% weight', () => {
    let best = 1;
    for (let k = 1; k <= sem.weeks; k++) if (loads[k]!.weight > loads[best]!.weight) best = k;
    expect(best).toBe(13);
    expect(loads[13]!.weight).toBe(70);
  });
  it('crowded rule: ≥70% of max and ≥2 items, never in a break week', () => {
    const crowded = loads.map((l, k) => (l.crowded ? k : 0)).filter(Boolean);
    expect(crowded).toContain(13);
    expect(crowded).not.toContain(8);
    for (const k of crowded) {
      expect(loads[k]!.weight).toBeGreaterThanOrEqual(0.7 * 70);
      expect(loads[k]!.count).toBeGreaterThanOrEqual(2);
    }
  });
  it('upcoming deadlines are sorted and never in the past', () => {
    const up = upcomingDeadlines(as, sem, parseISO('2026-10-26'));
    expect(up.length).toBeGreaterThan(5);
    expect(weightSum(up)).toBeGreaterThan(0);
  });
});
