/** حارس «لا حذف»: كل مسار في خط الأساس (قبل إعادة التصميم) ما زال يعمل — صفحة مسجّلة أو تحويل معلن — والأسماء البديلة تحوّل. */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGES, REDIRECTS, matchPage } from '../web/src/core/registry.js';
import { ROOT } from './helpers.js';

const BASELINE = [
  '/academic', '/academic/import', '/academic/s/:semId', '/academic/s/:semId/courses', '/academic/s/:semId/courses/:courseId', '/academic/s/:semId/timeline', '/academic/s/:semId/calculator', '/academic/s/:semId/weights', '/academic/s/:semId/unknowns', '/academic/s/:semId/print',
  '/library', '/library/folders', '/library/youtube', '/library/settings', '/library/f/:id', '/library/y/:id',
  '/life', '/life/finance', '/life/prayers', '/life/habits', '/life/routine', '/life/body', '/life/alternatives', '/life/ledger', '/life/routine-map', '/life/insights', '/life/qada-plan', '/life/glossary', '/life/log', '/life/settings',
  '/review', '/sports', '/sports/templates', '/sports/mine', '/settings', '/search', '/home',
];
const NEW = ['/week', '/everything', '/inbox', '/map', '/trash', '/activity', '/spaces', '/spaces/templates', '/spaces/automations', '/spaces/:id', '/review/progress', '/today', '/study', '/settings/trash'];
const redirectFrom = new Set(REDIRECTS.map((r) => r.from));
const served = (p: string): boolean => redirectFrom.has(p) || matchPage(p.replace(/:\w+/g, 'x1')) !== null || PAGES.some((x) => x.path === p);

describe('routes: zero removals', () => {
  const src = fs.readFileSync(path.join(ROOT, 'web', 'src', 'App.tsx'), 'utf8');
  it('every baseline route still exists (page or declared redirect)', () => {
    for (const p of BASELINE) expect({ p, ok: served(p) }).toEqual({ p, ok: true });
  });
  it('index route is Today', () => expect(src).toMatch(/<Route index element=\{<Today \/>\}/));
  it('new stations and aliases exist', () => {
    for (const p of NEW) expect({ p, ok: served(p) }).toEqual({ p, ok: true });
  });
  it('public share link route exists outside the shell', () => expect(src).toContain('path="p/:token"'));
  it('catch-all 404 exists', () => expect(src).toContain('path="*"'));
});
