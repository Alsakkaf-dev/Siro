// الزاحف الشامل: كل مسار × العروض (1280/768/390) × (فاتح/داكن): أخطاء، طلبات فاشلة، تجاوز أفقي، axe، لقطات.
//   BASE=http://127.0.0.1:4310 E2E_OUT=/tmp/out node scripts/e2e/crawl.mjs [--quick] [--clicks]
import path from 'node:path';
import fs from 'node:fs';
import { chromium, newPage, settle, overflow, axe, resolveRoutes, save, BASE, OUT } from './lib.mjs';

const quick = process.argv.includes('--quick');
const clicks = process.argv.includes('--clicks');
const widths = quick ? [1280, 390] : [1280, 768, 390];
const themes = quick ? ['light'] : ['light', 'dark'];
const extra = (process.env.E2E_EXTRA ?? '').split(',').filter(Boolean);
const routes = await resolveRoutes(extra);
const browser = await chromium.launch();
const shots = path.join(OUT, 'shots');
fs.mkdirSync(shots, { recursive: true });
const report = { base: BASE, at: new Date().toISOString(), routes: routes.length, results: [] };
let problems = 0;

for (const theme of themes) {
  for (const width of widths) {
    const { ctx, page, log } = await newPage(browser, { width, theme });
    for (const r of routes) {
      log.console.length = 0; log.failed.length = 0;
      const t0 = Date.now();
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await settle(page);
      const ms = Date.now() - t0;
      const info = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim().slice(0, 80) ?? null,
        crumbs: !!document.querySelector('nav.crumbs, [aria-label="مسار التنقل"]'),
        buttons: document.querySelectorAll('main button, main a.btn').length,
        notFound: !!document.querySelector('[data-notfound]'),
      }));
      const ov = await overflow(page);
      const ax = await axe(page);
      const serious = ax.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const slug = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
      const shot = path.join(shots, `${slug}__${width}_${theme}.png`);
      if (!quick || width !== 768) await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      let clickErrors = [];
      if (clicks && width === 1280 && theme === 'light') clickErrors = await clickSweep(page, r, log);
      const row = { route: r, width, theme, ms, ...info, console: [...log.console], failed: [...log.failed], overflow: ov, axe: ax.violations, serious: serious.length, clickErrors };
      if (row.console.length || row.failed.length || ov || serious.length || clickErrors.length) problems++;
      report.results.push(row);
      process.stdout.write(`${row.console.length || row.failed.length || ov || serious.length || clickErrors.length ? '✗' : '✓'} ${width} ${theme} ${r} ${ms}ms${serious.length ? ` axe:${serious.map((v) => v.id).join(',')}` : ''}${ov ? ` overflow:${ov.scrollWidth}` : ''}${row.console.length ? ` console:${row.console.length}` : ''}${row.failed.length ? ` failed:${row.failed.join('|')}` : ''}${clickErrors.length ? ` clicks:${clickErrors.length}` : ''}\n`);
    }
    await ctx.close();
  }
}
await browser.close();
report.problems = problems;
console.log(`\n${problems === 0 ? 'ALL CLEAN' : `PROBLEMS: ${problems}`} — report: ${save('crawl.json', report)}`);
process.exit(problems === 0 ? 0 : 1);

/** ينقر كل زر غير خطِر في الصفحة ويسجّل أي خطأ ينتج عنه */
async function clickSweep(page, route, log) {
  const errs = [];
  const SKIP = /حذف|احذف|استعد|استبدال|استبدل|delete|remove|restore|replace|تطبيق|طبّق|إرسال|أرسل|مسح|افرغ|فحص الآن|نسخة احتياطية الآن/i;
  const n = await page.locator('main button:visible').count();
  for (let i = 0; i < Math.min(n, 30); i++) {
    const b = page.locator('main button:visible').nth(i);
    const label = ((await b.getAttribute('aria-label').catch(() => null)) ?? (await b.innerText().catch(() => ''))).trim().slice(0, 40);
    if (!label || SKIP.test(label) || (await b.isDisabled().catch(() => true))) continue;
    const before = log.console.length;
    await b.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(120);
    if (log.console.length > before) errs.push(`${label}: ${log.console.slice(before).join(' / ')}`);
    await page.keyboard.press('Escape').catch(() => {});
    if (!page.url().endsWith(route)) { await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }); await settle(page); }
  }
  return errs;
}
