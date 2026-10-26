// أدوات مشتركة لاختبارات Playwright (الزاحف + السيناريوهات). تُشغَّل على خادم يعمل مسبقًا.
//   BASE=http://127.0.0.1:4310 node scripts/e2e/crawl.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');
export const BASE = process.env.BASE ?? 'http://127.0.0.1:4310';
export const OUT = process.env.E2E_OUT ?? path.resolve('e2e-out');
fs.mkdirSync(OUT, { recursive: true });

let axeSrc = null;
function axeSource() {
  if (axeSrc) return axeSrc;
  for (const p of [path.resolve('node_modules/axe-core/axe.min.js'), process.env.AXE_PATH].filter(Boolean)) {
    if (fs.existsSync(p)) return (axeSrc = fs.readFileSync(p, 'utf8'));
  }
  try {
    return (axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
  } catch {
    return null;
  }
}

/** كل المسارات الثابتة + مسارات ديناميكية تُحلّ من الـ API */
export async function resolveRoutes(extra = []) {
  const j = async (u) => (await fetch(BASE + u)).json();
  const sems = await j('/api/semesters');
  const sem = sems.find((s) => s.is_active) ?? sems[0];
  const out = ['/', '/academic', '/academic/import', '/library', '/library/folders', '/library/youtube', '/library/settings', '/life', '/life/finance', '/life/prayers', '/life/habits', '/life/routine', '/life/body', '/life/alternatives', '/life/ledger', '/life/routine-map', '/life/insights', '/life/qada-plan', '/life/glossary', '/life/commands', '/life/settings', '/review', '/sports', '/sports/templates', '/sports/mine', '/settings', '/search?q=test'];
  if (sem) {
    const b = `/academic/s/${sem.id}`;
    out.push(b, `${b}/courses`, `${b}/timeline`, `${b}/calculator`, `${b}/weights`, `${b}/unknowns`, `${b}/print`);
    const bundle = await j(`/api/semesters/${sem.id}`);
    if (bundle.courses?.[0]) out.push(`${b}/courses/${bundle.courses[0].id}`);
  }
  try {
    const items = await j('/api/library/items?limit=1&kind=pdf');
    if (items.items?.[0]) out.push(`/library/f/${items.items[0].id}`);
    const yt = await j('/api/library/youtube');
    if (yt[0]) out.push(`/library/y/${yt[0].id}`);
  } catch { /* المكتبة غير متاحة */ }
  return [...out, ...extra];
}

/** يفتح صفحة ويجمع: أخطاء الكونسول، الطلبات الفاشلة، تجاوز العرض، نتائج axe. */
export async function newPage(browser, { width = 1280, theme = 'light', height } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: height ?? (width < 500 ? 844 : 900) }, locale: 'ar', colorScheme: theme, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('platform.theme', t); } catch {} }, theme);
  const page = await ctx.newPage();
  const log = { console: [], failed: [] };
  page.on('console', (m) => { if (m.type() === 'error') log.console.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => log.console.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.on('requestfailed', (r) => { const u = r.url(); if (!/youtube|google|drive/.test(u)) log.failed.push(`${r.failure()?.errorText ?? 'failed'} ${u.replace(BASE, '')}`); });
  page.on('response', (r) => { const u = r.url(); if (r.status() >= 400 && u.startsWith(BASE)) log.failed.push(`${r.status()} ${u.replace(BASE, '')}`); });
  return { ctx, page, log };
}

export async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
}

export async function overflow(page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    if (sw <= w + 1) return null;
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
        let p = el.parentElement, clipped = false;
        while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'hidden' || o === 'scroll' || o === 'clip') { clipped = true; break; } p = p.parentElement; }
        if (!clipped) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
      }
      if (bad.length > 4) break;
    }
    return { scrollWidth: sw, width: w, offenders: bad };
  });
}

export async function axe(page) {
  const src = axeSource();
  if (!src) return { skipped: true, violations: [] };
  await page.evaluate(src);
  const r = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  });
  return { violations: r };
}

export function save(name, data) {
  const f = path.join(OUT, name);
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  return f;
}

export function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT: ' + msg);
}
