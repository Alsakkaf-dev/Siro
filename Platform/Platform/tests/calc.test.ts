import { describe, expect, it } from 'vitest';
import { calcCourse } from '../shared/calc.js';
import { mk } from './helpers.js';

describe('calculator', () => {
  it('no grades yet: need = (target − 0) / remaining', () => {
    // CA 60 + final 40, assume 70% CA → expected 42; target 50 → 8/40 = 20%
    const items = [mk({ weight: 60, kind: 'assignment' }), mk({ weight: 40, kind: 'final' })];
    const c = calcCourse(items, { assume: 70 });
    const r50 = c.rows.find((r) => r.target === 50)!;
    expect(r50.mode).toBe('final');
    expect(r50.need).toBe(20);
    expect(r50.marks).toBe(8);
    expect(c.rows.find((r) => r.target === 80)!.need).toBe(95);
    expect(c.weightOk).toBe(true);
    expect(c.earned).toBe(0);
  });

  it('course without a final: need is spread over the rest', () => {
    const items = [mk({ weight: 25, kind: 'test', score: 20, max_score: 25, status: 'graded' }), mk({ weight: 75, kind: 'project' })];
    const c = calcCourse(items);
    expect(c.hasFinal).toBe(false);
    expect(c.earned).toBe(20);
    const r = c.rows.find((x) => x.target === 50)!;
    expect(r.mode).toBe('rest');
    expect(r.need).toBe(40); // (50−20)/75
  });

  it('target already secured → state sure', () => {
    const items = [mk({ weight: 60, score: 55, max_score: 60, status: 'graded' }), mk({ weight: 40, kind: 'final' })];
    const c = calcCourse(items);
    expect(c.rows.find((r) => r.target === 50)!.state).toBe('sure');
    expect(c.rows.find((r) => r.target === 80)!.state).toBe('ok');
  });

  it('impossible target when even 100% is not enough', () => {
    const items = [mk({ weight: 60, score: 0, max_score: 60, status: 'graded' }), mk({ weight: 40, kind: 'final' })];
    const c = calcCourse(items);
    expect(c.maxPossible).toBe(40);
    expect(c.rows.find((r) => r.target === 50)!.state).toBe('impossible');
    expect(c.rows.find((r) => r.target === 80)!.state).toBe('impossible');
  });

  it('everything graded: mode done, earned is final', () => {
    const items = [mk({ weight: 50, score: 40, max_score: 50, status: 'graded' }), mk({ weight: 50, kind: 'final', score: 30, max_score: 50, status: 'graded' })];
    const c = calcCourse(items);
    expect(c.earned).toBe(70);
    expect(c.rows.every((r) => r.mode === 'done')).toBe(true);
    expect(c.rows.find((r) => r.target === 70)!.state).toBe('sure');
    expect(c.rows.find((r) => r.target === 80)!.state).toBe('impossible');
    expect(c.performance).toBe(70);
  });

  it('minimum final mark overrides a lower requirement', () => {
    const items = [mk({ weight: 70, score: 70, max_score: 70, status: 'graded' }), mk({ weight: 30, kind: 'final' })];
    const c = calcCourse(items, { minFinal: 40 });
    const r = c.rows.find((x) => x.target === 50)!;
    expect(r.need).toBe(40);
    expect(r.minApplied).toBe(true);
    expect(r.state).toBe('ok');
  });

  it('flags incomplete weights (≠ 100)', () => {
    expect(calcCourse([mk({ weight: 60 }), mk({ weight: 30 })]).weightOk).toBe(false);
    expect(calcCourse([mk({ weight: 33.3 }), mk({ weight: 66.7 })]).weightOk).toBe(true);
  });

  it('empty course does not crash', () => {
    const c = calcCourse([]);
    expect(c.performance).toBeNull();
    expect(c.earned).toBe(0);
    expect(c.rows).toHaveLength(4);
    expect(c.rows[0]!.state).toBe('impossible');
  });

  it('what-if overrides do not mutate input and clamp to max', () => {
    const a = mk({ id: 'a', weight: 50 });
    const b = mk({ id: 'b', weight: 50, kind: 'final' });
    const c = calcCourse([a, b], {}, { a: { score: 60, max: 50 } });
    expect(c.earned).toBe(50); // 60/50 clamped to 1
    expect(a.score).toBeNull();
  });

  it('score 0 is a real grade (not "unknown")', () => {
    const c = calcCourse([mk({ weight: 20, score: 0, max_score: 20, status: 'graded' }), mk({ weight: 80, kind: 'final' })]);
    expect(c.graded).toBe(1);
    expect(c.lost).toBe(20);
    expect(c.maxPossible).toBe(80);
  });
});
