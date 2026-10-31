import { describe, expect, it } from 'vitest';
import { checkFormula, evaluateFormula } from '../shared/formula.js';
import { canTransition, coerceValue, describeAutomation, matchFilter, sortItems, type WosItem } from '../shared/wos.js';

const vals: Record<string, number | string | null> = { السعر: 12.5, الكمية: 4, الحالة: 'done', due: '2026-11-03', فارغ: null };
const get = (n: string) => vals[n] ?? null;
const now = new Date('2026-10-27T10:00:00Z');

describe('formula language (safe, no eval)', () => {
  it('arithmetic & precedence', () => {
    expect(evaluateFormula('{السعر} * {الكمية}', get)).toBe(50);
    expect(evaluateFormula('1 + 2 * 3', get)).toBe(7);
    expect(evaluateFormula('(1 + 2) * 3', get)).toBe(9);
    expect(evaluateFormula('10 - 4 - 3', get)).toBe(3);
    expect(evaluateFormula('-2 + 5', get)).toBe(3);
    expect(evaluateFormula('7 % 4', get)).toBe(3);
  });
  it('logic, comparisons, if', () => {
    expect(evaluateFormula('if({الحالة} == "done", 100, 0)', get)).toBe(100);
    expect(evaluateFormula('{الكمية} > 3 and {السعر} < 20', get)).toBe(true);
    expect(evaluateFormula('not ({الكمية} > 3) or false', get)).toBe(false);
  });
  it('functions', () => {
    expect(evaluateFormula('round(10 / 3, 2)', get)).toBe(3.33);
    expect(evaluateFormula('max(1, 9, 4) + min(3, 2)', get)).toBe(11);
    expect(evaluateFormula('concat("a", "-", 3)', get)).toBe('a-3');
    expect(evaluateFormula('"x" & {الكمية}', get)).toBe('x4');
    expect(evaluateFormula('days(today(), {due})', get, now)).toBe(7);
    expect(evaluateFormula('coalesce({فارغ}, "بديل")', get)).toBe('بديل');
    expect(evaluateFormula('len("مرحبا")', get)).toBe(5);
  });
  it('errors are values, never exceptions; division by zero → null', () => {
    expect(evaluateFormula('1 / 0', get)).toBeNull();
    expect(String(evaluateFormula('foo(1)', get))).toMatch(/^#خطأ/);
    expect(String(evaluateFormula('(1 + 2', get))).toMatch(/^#خطأ/);
    expect(String(evaluateFormula('process.exit()', get))).toMatch(/^#خطأ/);
    expect(String(evaluateFormula('"x'.repeat(300), get))).toMatch(/^#خطأ/);
    expect(checkFormula('{a} +')).not.toBeNull();
    expect(checkFormula('{a} + 1')).toBeNull();
  });
  it('deeply nested input cannot blow the stack', () => {
    expect(String(evaluateFormula('('.repeat(200) + '1' + ')'.repeat(200), get))).toMatch(/^#خطأ/);
  });
});

describe('field values, filters, transitions', () => {
  it('coerces and validates per field kind', () => {
    expect(coerceValue({ id: 'n', name: 'n', kind: 'number' }, '42')).toBe(42);
    expect(() => coerceValue({ id: 'n', name: 'n', kind: 'number' }, 'x')).toThrow();
    expect(coerceValue({ id: 'p', name: 'p', kind: 'progress' }, 140)).toBe(100);
    expect(coerceValue({ id: 'r', name: 'r', kind: 'rating' }, 4.6)).toBe(5);
    expect(coerceValue({ id: 'c', name: 'c', kind: 'checkbox' }, 'true')).toBe(true);
    expect(() => coerceValue({ id: 's', name: 's', kind: 'select', options: [{ id: 'a', name: 'A' }] }, 'b')).toThrow();
    expect(coerceValue({ id: 'm', name: 'm', kind: 'multiselect', options: [{ id: 'a', name: 'A' }] }, ['a', 'a'])).toEqual(['a']);
    expect(() => coerceValue({ id: 'u', name: 'u', kind: 'url' }, 'javascript:alert(1)')).toThrow();
    expect(coerceValue({ id: 'd', name: 'd', kind: 'date' }, '')).toBeNull();
  });
  const item = (over: Partial<WosItem>): WosItem => ({ id: 'i', workspace_id: 'default', space_id: 's', parent_id: null, title: 't', status: 'todo', data: {}, start: null, due: null, sort: 0, archived: false, done_at: null, created_at: '', updated_at: '', ...over });
  const type = { fields: [{ id: 'n', name: 'n', kind: 'number' as const }, { id: 'tags', name: 'tags', kind: 'multiselect' as const }], statuses: [] };
  it('filters', () => {
    expect(matchFilter(item({ data: { n: 5 } }), { field: 'n', op: 'gt', value: 3 }, type)).toBe(true);
    expect(matchFilter(item({ data: {} }), { field: 'n', op: 'empty' }, type)).toBe(true);
    expect(matchFilter(item({ data: { tags: ['a', 'b'] } }), { field: 'tags', op: 'has', value: 'b' }, type)).toBe(true);
    expect(matchFilter(item({ title: 'Clean Code' }), { field: 'title', op: 'contains', value: 'clean' }, type)).toBe(true);
    expect(matchFilter(item({ due: '2026-11-01' }), { field: 'due', op: 'before', value: '2026-12-01' }, type)).toBe(true);
  });
  it('sorting puts empties last', () => {
    const out = sortItems([item({ id: 'a', data: {} }), item({ id: 'b', data: { n: 2 } }), item({ id: 'c', data: { n: 1 } })], { field: 'n', dir: 'asc' }, type);
    expect(out.map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });
  it('transitions', () => {
    const st = [{ id: 'a', name: 'A', color: '#000000', category: 'todo' as const, next: ['b'] }, { id: 'b', name: 'B', color: '#000000', category: 'done' as const }];
    expect(canTransition(st, 'a', 'b')).toBe(true);
    expect(canTransition(st, 'b', 'a')).toBe(true); // next فارغ = حرية
    expect(canTransition([{ ...st[0]!, next: [] }, st[1]!], 'a', 'b')).toBe(true);
    expect(canTransition(st, 'a', 'zzz')).toBe(false);
  });
  it('automation sentence in Arabic', () => {
    expect(describeAutomation({ trigger: { kind: 'status_changed', to: 'b' }, action: { kind: 'set_field', field: 'n', value: 'today' } }, { fields: type.fields, statuses: [{ id: 'b', name: 'منجز', color: '#000000', category: 'done' }] })).toBe('عندما تصبح الحالة «منجز» ← اضبط «n» = اليوم');
  });
});
