// اختبار متصفح: يشغّل الخادم على منفذ وبيانات مؤقتة ثم يزور كل مسار بعرضَي سطح المكتب والجوال ويتحقق من أساسيات التنقل.
// الاستخدام: node scripts/browser-smoke.mjs [--strict] [--shots <dir>] [--only <نص>] [--json <ملف>]
// يحتاج Playwright (غير مضاف للاعتماديات عمدًا): إن غاب يتخطى برسالة واضحة ولا يفشل.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? '') : null;
};
const STRICT = process.argv.includes('--strict');
const SHOTS = arg('--shots');
const ONLY = arg('--only');
const JSON_OUT = arg('--json');

let pw;
try {
  pw = createRequire(import.meta.url)('playwright');
} catch {
  console.log('browser-smoke: تخطّي — Playwright غير مثبت (npm i -D playwright لتشغيله).');
  process.exit(0);
}
if (!existsSync(join(root, 'dist', 'web', 'index.html'))) {
  console.log('browser-smoke: dist/web غير موجود. شغّل: npm run build');
  process.exit(1);
}

const port = 4400 + Math.floor(Math.random() * 90);
const tmp = mkdtempSync(join(tmpdir(), 'platform-browser-'));
const { buildLibraryFixture } = await import(pathToFileURL(join(root, 'scripts', 'lib-fixture.mjs')).href);
const libRoot = await buildLibraryFixture(join(tmp, 'library'));
const { buildLifeFixture } = await import(pathToFileURL(join(root, 'scripts', 'life-fixture.mjs')).href);
const lifeRoot = buildLifeFixture(join(tmp, 'rashed'), { balanceHistory: 'v4' });
const env = { ...process.env, PLATFORM_PORT: String(port), PLATFORM_DATA_DIR: join(tmp, 'data'), PLATFORM_BACKUPS_DIR: join(tmp, 'backups'), PLATFORM_LIBRARY_ROOT: libRoot, PLATFORM_LIFE_ROOT: lifeRoot, PLATFORM_NO_AUTOSCAN: '1' };
const child = spawn(process.execPath, ['server'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
child.stdout.on('data', (d) => (log += d));
child.stderr.on('data', (d) => (log += d));

const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (p, init) => {
  const r = await fetch(base + p, init);
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
};
const post = (p, b) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
const problems = [];
const rows = [];
const note = (level, where, msg) => problems.push({ level, where, msg });

let browser;
try {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* لم يبدأ بعد */ }
    await sleep(250);
  }
  const sems = await api('/api/semesters');
  const sem = sems[0].id;
  const bundle = await api(`/api/semesters/${sem}`);
  const course = bundle.courses[0].id;
  await api('/api/library/scan?wait=1', { method: 'POST' });
  const items = await api('/api/library/items?limit=50');
  const file = (items.items.find((i) => /\.pdf$/i.test(i.title)) ?? items.items[0]).id;
  const yt = (await post('/api/library/youtube', { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'smoke video' })).id;
  const ids = { ':sem': sem, ':course': course, ':file': file, ':yt': yt };
  const fill = (p) => Object.entries(ids).reduce((s, [k, v]) => s.replace(k, v), p);

  const routes = JSON.parse(readFileSync(join(root, 'scripts', 'smoke-routes.json'), 'utf8')).routes.filter((r) => !ONLY || r.includes(ONLY));

  browser = await pw.chromium.launch();
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  console.log(`browser-smoke → ${base}  (${routes.length} routes × ${VIEWPORTS.length} viewports${STRICT ? ', strict' : ''})`);

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'ar' });
    for (const raw of routes) {
      const url = fill(raw);
      const where = `${vp.name} ${raw}`;
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 200)}`);
      });
      page.on('response', (r) => {
        if (r.status() >= 500) errs.push(`http ${r.status()}: ${r.url().replace(base, '')}`);
      });
      try {
        await page.goto(base + url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#main h1', { timeout: 7000 }).catch(() => undefined);
        await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
        await sleep(150);
        const info = await page.evaluate(() => {
          const navActive = document.querySelectorAll('aside nav [aria-current="page"]').length;
          return {
            title: document.title,
            h1: document.querySelector('#main h1')?.textContent?.trim() ?? '',
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            navActive,
            crumbs: !!document.querySelector('#main nav.crumbs'),
            bottomBar: !!document.querySelector('nav.bottom-bar'),
            path: location.pathname + location.search,
          };
        });
        rows.push({ viewport: vp.name, route: raw, ...info, errors: errs.length });
        for (const e of errs) note('error', where, e);
        if (info.overflow > 1) note('warn', where, `تمرير أفقي ${info.overflow}px`);
        if (!info.h1 && raw !== '/no-such-page') note('warn', where, 'لا h1');
        if (SHOTS) await page.screenshot({ path: join(SHOTS, `${vp.name}-${raw.replace(/[^\w]+/g, '_') || 'root'}.png`) });
      } catch (e) {
        note('error', where, `استثناء: ${e.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }
    await ctx.close();
  }
} catch (e) {
  note('error', 'harness', String(e?.stack ?? e).split('\n').slice(0, 3).join(' | '));
} finally {
  await browser?.close();
  child.kill();
  await sleep(300);
  rmSync(tmp, { recursive: true, force: true });
}

const errors = problems.filter((p) => p.level === 'error');
const warns = problems.filter((p) => p.level === 'warn');
for (const p of problems) console.log(`  ${p.level === 'error' ? '✗' : '!'} ${p.where}: ${p.msg}`);
const titles = new Map();
for (const r of rows.filter((x) => x.viewport === 'desktop')) titles.set(r.title, (titles.get(r.title) ?? 0) + 1);
console.log(`\nصفحات: ${rows.length / VIEWPORTS.length}  ·  عناوين فريدة: ${titles.size}  ·  أخطاء: ${errors.length}  ·  تحذيرات: ${warns.length}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ rows, problems }, null, 1));
if (errors.length) console.log(log.split('\n').slice(-12).join('\n'));
process.exit(STRICT && errors.length ? 1 : 0);
