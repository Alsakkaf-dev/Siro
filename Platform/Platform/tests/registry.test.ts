// سجل التنقل: تفرّد، آباء، تطابق مع App.tsx وsmoke-routes.json وinline-html، عنصر نشط واحد، الاختصارات والتحويلات.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AREAS, AREA_BY_ID, PAGES, PAGE_BY_ID, REDIRECTS, crumbsFor, gTarget, hrefFor, matchPage, resolvePath, sameSubpage, scoreText, sidebarOwner, tabsFor, titleFor } from '../web/src/core/registry.js';

const ROOT = join(__dirname, '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');

/** يستخرج المسارات المطلقة من <Route> في App.tsx مع تتبع التداخل (يتجاوز {…} داخل الوسم) */
function appRoutes(src: string): string[] {
  const out: string[] = [];
  const stack: string[] = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('</Route>', i)) {
      stack.pop();
      i += 8;
      continue;
    }
    if (!src.startsWith('<Route', i) || /[A-Za-z]/.test(src[i + 6] ?? '')) {
      i++;
      continue;
    }
    let j = i + 6;
    let depth = 0;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    const attrs = src.slice(i + 6, j);
    const selfClose = attrs.trimEnd().endsWith('/');
    const path = /\bpath="([^"]*)"/.exec(attrs)?.[1];
    const index = /^\s*index\b|\sindex\b/.test(attrs);
    const prefix = stack.filter(Boolean).join('/');
    const full = path !== undefined ? '/' + [prefix, path].filter(Boolean).join('/') : index ? '/' + prefix : null;
    if (selfClose) {
      if (full) out.push(full.replace(/\/$/, '') || '/');
    } else stack.push(path ?? '');
    i = j + 1;
  }
  return out;
}

describe('سجل التنقل', () => {
  it('معرّفات ومسارات فريدة، والآباء والأقسام موجودة', () => {
    expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((p) => p.path)).size).toBe(PAGES.length);
    for (const p of PAGES) {
      expect(AREA_BY_ID.has(p.area)).toBe(true);
      if (p.parent) expect(PAGE_BY_ID.has(p.parent), `${p.id} → ${p.parent}`).toBe(true);
    }
    for (const a of AREAS) expect(PAGE_BY_ID.get(a.entry)?.area).toBe(a.id);
    expect(AREAS.map((a) => a.kbd)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(new Set(PAGES.filter((p) => p.kbd).map((p) => p.kbd)).size).toBe(PAGES.filter((p) => p.kbd).length);
  });

  it('كل مسار في App.tsx مسجّل ولا مسار زائد', () => {
    const routes = appRoutes(read('web/src/App.tsx')).filter((r) => r !== '/*');
    // التحويلات تُولَّد من REDIRECTS بالخريطة (لا تُكتب يدويًا)
    expect(read('web/src/App.tsx')).toContain('REDIRECTS.map');
    const registered = PAGES.map((p) => p.path).sort();
    expect([...new Set(routes)].sort()).toEqual(registered);
  });

  it('المقاطع: كل صفحة كسولة لها import في App.tsx، وكل مقطع في inline-html موجود كملف', () => {
    const app = read('web/src/App.tsx');
    for (const p of PAGES.filter((x) => x.chunk)) expect(app, p.chunk!).toContain(`import('./pages/${p.chunk}.js')`);
    const inline = read('scripts/inline-html.mjs');
    const block = /const routes = \{([\s\S]*?)\n\};/.exec(inline)?.[1] ?? '';
    const names = new Set([...block.matchAll(/'([A-Za-z0-9]+)'/g)].map((m) => m[1]!));
    expect(names.size).toBeGreaterThan(10);
    const files = new Set<string>();
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const pth = join(d, f);
        if (statSync(pth).isDirectory()) walk(pth);
        else files.add(f.replace(/\.(tsx?|css)$/, ''));
      }
    };
    walk(join(ROOT, 'web', 'src'));
    for (const n of names) expect(files.has(n), `inline-html: ${n}`).toBe(true);
    expect(names.has('Today')).toBe(true);
    expect(names.has('Home')).toBe(false);
  });

  it('smoke-routes.json يغطي كل صفحة مسجلة وكل تحويل', () => {
    const smoke = (JSON.parse(read('scripts/smoke-routes.json')) as { routes: string[] }).routes.map((r) => r.split('?')[0]!);
    const fill: Record<string, string> = { semId: 'sem5', courseId: 'c1', id: 'x1' };
    const filled = smoke.map((r) => r.replace(':sem', 'sem5').replace(':course', 'c1').replace(':file', 'x1').replace(':yt', 'x1'));
    for (const p of PAGES) {
      const url = resolvePath(p, fill)!;
      expect(filled.some((r) => matchPage(r)?.page.id === p.id), `${p.id} ${url}`).toBe(true);
    }
    for (const r of REDIRECTS) expect(smoke, r.from).toContain(r.from);
    // مداخل الأقسام (بلا فتات) والتحويلات كما يعلنها الملف تطابق السجل
    const j = JSON.parse(read('scripts/smoke-routes.json')) as { entries: string[]; redirects: Record<string, string> };
    expect(j.entries.map((e) => matchPage(e.replace(':sem', 'sem5'))?.page.id).sort()).toEqual(AREAS.map((a) => a.entry).sort());
    expect(j.redirects).toEqual(Object.fromEntries(REDIRECTS.map((r) => [r.from, r.to])));
  });

  it('التبويبات متسقة: نفس القسم، وفي كل مجموعة صفحة شريط واحدة على الأقل', () => {
    const groups = new Set(PAGES.map((p) => p.tabGroup).filter(Boolean));
    for (const g of groups) {
      const ms = PAGES.filter((p) => p.tabGroup === g);
      expect(ms.length).toBeGreaterThan(1);
      expect(new Set(ms.map((p) => p.area)).size).toBe(1);
      expect(ms.some((p) => p.surface === 'sidebar')).toBe(true);
      for (const p of ms) expect(tabsFor(p).map((x) => x.id)).toEqual(ms.map((x) => x.id));
    }
  });

  it('عنصر نشط واحد: كل صفحة تؤول إلى صفحة شريط واحدة في قسمها', () => {
    for (const p of PAGES) {
      const o = sidebarOwner(p);
      expect(o.surface, p.id).toBe('sidebar');
      expect(o.area, p.id).toBe(p.area);
    }
    expect(sidebarOwner(PAGE_BY_ID.get('course')!).id).toBe('courses');
    expect(sidebarOwner(PAGE_BY_ID.get('weights')!).id).toBe('timeline');
    expect(sidebarOwner(PAGE_BY_ID.get('library-video')!).id).toBe('library');
    expect(sidebarOwner(PAGE_BY_ID.get('life-ledger')!).id).toBe('life-finance');
  });

  it('التحويلات: لا سلاسل، والوجهة مسجلة، والمصدر غير مسجل', () => {
    const froms = new Set(REDIRECTS.map((r) => r.from));
    for (const r of REDIRECTS) {
      expect(froms.has(r.to.split(/[?#]/)[0]!), r.to).toBe(false);
      expect(matchPage(r.to.split(/[?#]/)[0]!), r.to).not.toBeNull();
      expect(matchPage(r.from), r.from).toBeNull();
    }
  });

  it('matchPage يختار الأكثر تحديدًا', () => {
    expect(matchPage('/')?.page.id).toBe('today');
    expect(matchPage('/academic/s/sem5')?.page.id).toBe('dashboard');
    expect(matchPage('/academic/s/sem5/courses/abc')).toEqual({ page: PAGE_BY_ID.get('course'), params: { semId: 'sem5', courseId: 'abc' } });
    expect(matchPage('/library/f/123')?.page.id).toBe('library-file');
    expect(matchPage('/life/finance/')?.page.id).toBe('life-finance');
    expect(matchPage('/nope')).toBeNull();
  });

  it('العناوين فريدة لكل صفحة مسجلة وبلا تكرار للقسم', () => {
    const titles = PAGES.map((p) => titleFor(p));
    expect(new Set(titles).size).toBe(PAGES.length);
    expect(titleFor(PAGE_BY_ID.get('kitchen')!)).toBe('المطبخ · المنصة الشخصية');
    expect(titleFor(PAGE_BY_ID.get('courses')!)).toBe('المواد · الدراسة · المنصة الشخصية');
    expect(titleFor(PAGE_BY_ID.get('course')!, 'SCSE1234 — X')).toBe('SCSE1234 — X · الدراسة · المنصة الشخصية');
    expect(titleFor(null)).toContain('غير موجودة');
  });

  it('فتات الخبز: القسم ثم الآباء', () => {
    expect(crumbsFor(PAGE_BY_ID.get('today')!).length).toBe(1);
    expect(crumbsFor(PAGE_BY_ID.get('review')!).map((c) => c.label)).toEqual(['الرئيسية', 'مراجعة الأسبوع']);
    expect(crumbsFor(PAGE_BY_ID.get('course')!).map((c) => c.id)).toEqual(['dashboard', 'courses', 'course']);
    expect(crumbsFor(PAGE_BY_ID.get('life-qada')!).map((c) => c.id)).toEqual(['life', 'life-prayers', 'life-qada']);
  });

  it('g: أرقام الأقسام والحروف بـ e.code، والمطبخ خلف العلم، وبلا فصل → /academic', () => {
    const off = { semId: 'sem5', enabled: () => false };
    expect(gTarget('Digit1', off)).toBe('/');
    expect(gTarget('Digit2', off)).toBe('/academic/s/sem5');
    expect(gTarget('Digit2', { ...off, semId: null })).toBe('/academic');
    expect(gTarget('KeyC', { ...off, semId: null })).toBe('/academic');
    expect(gTarget('KeyC', off)).toBe('/academic/s/sem5/courses');
    expect(gTarget('Comma', off)).toBe('/settings');
    expect(gTarget('Digit6', off)).toBeNull();
    expect(gTarget('Digit6', { ...off, enabled: () => true })).toBe('/kitchen');
    expect(gTarget('Digit7', off)).toBe('/settings');
    expect(gTarget('Digit5', off)).toBe('/sports/mine');
    expect(gTarget('KeyZ', off)).toBeNull();
    expect(hrefFor('timeline', null)).toBe('/academic');
  });

  it('تبديل الفصل يحفظ الصفحة الفرعية', () => {
    expect(sameSubpage('/academic/s/a/timeline', '?view=list', 'b')).toBe('/academic/s/b/timeline?view=list');
    expect(sameSubpage('/academic/s/a/courses/xyz', '', 'b')).toBe('/academic/s/b/courses');
    expect(sameSubpage('/academic', '', 'b')).toBe('/academic/s/b');
  });

  it('درجات لوحة الأوامر', () => {
    expect(scoreText('المواد', 'المواد')).toBe(100);
    expect(scoreText('الم', 'المواد')).toBe(80);
    expect(scoreText('الاسبوع', 'مراجعه الاسبوع')).toBe(60);
    expect(scoreText('واد', 'المواد')).toBe(40);
    expect(scoreText('courses', 'المواد', 'courses subjects')).toBe(20);
  });

  it('لا بقايا للمنصات القديمة', () => {
    for (const f of ['web/src/core/plugins.config.tsx', 'web/src/core/plugin.ts', 'web/src/pages/Soon.tsx', 'web/src/pages/Home.tsx']) expect(existsSync(join(ROOT, f)), f).toBe(false);
  });
});
