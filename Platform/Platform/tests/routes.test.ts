/** حارس «لا حذف»: كل مسار في خط الأساس (قبل إعادة التصميم) ما زال معرّفًا في App.tsx، والأسماء البديلة تحوّل. */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from './helpers.js';

const BASELINE = [
  'academic', 'academic/import', 'academic/s/:semId', 'courses', 'courses/:courseId', 'timeline', 'calculator', 'weights', 'unknowns', 'print',
  'library', 'library/folders', 'library/youtube', 'library/settings', 'library/f/:id', 'library/y/:id',
  'life', 'life/finance', 'life/prayers', 'life/habits', 'life/routine', 'life/body', 'life/alternatives', 'life/ledger', 'life/routine-map', 'life/insights', 'life/qada-plan', 'life/glossary', 'life/commands', 'life/settings',
  'review', 'sports', 'sports/templates', 'sports/mine', 'settings', 'search', 'home', '*',
];
const NEW = ['week', 'everything', 'inbox', 'map', 'trash', 'activity', 'spaces', 'spaces/templates', 'spaces/automations', 'spaces/:id', 'review/progress', 'p/:token', 'today', 'study', 'settings/trash', 'spaces/new'];

describe('routes: zero removals', () => {
  const src = fs.readFileSync(path.join(ROOT, 'web', 'src', 'App.tsx'), 'utf8');
  const paths = new Set([...src.matchAll(/path="([^"]+)"/g)].map((m) => m[1]));
  it('every baseline route still exists', () => {
    for (const p of BASELINE) expect({ p, ok: paths.has(p) }).toEqual({ p, ok: true });
  });
  it('index route (home) exists', () => expect(src).toMatch(/<Route index element=\{<Home \/>\}/));
  it('new stations and aliases exist', () => {
    for (const p of NEW) expect({ p, ok: paths.has(p) }).toEqual({ p, ok: true });
  });
  it('every line registered in the metro registry (≤ 7 lines)', () => {
    const cfg = fs.readFileSync(path.join(ROOT, 'web', 'src', 'core', 'plugins.config.tsx'), 'utf8');
    const list = /export const PLUGINS: PlatformPlugin\[\] = \[([^\]]+)\]/.exec(cfg)?.[1]?.split(',').map((x) => x.trim()) ?? [];
    expect(list).toEqual(['home', 'academic', 'library', 'life', 'sports', 'spaces', 'review']);
    expect(list.length).toBeLessThanOrEqual(7);
  });
});
