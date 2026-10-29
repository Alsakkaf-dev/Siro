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
const scenarioLog = [];

/** سيناريوهات تفاعلية (عقود PLAN §6ب): اختصارات بمفاتيح عربية، لوحة الأوامر، «+ جديد»، التحويلات، تبديل الفصل، Back، اليوم بلا مجلد راشد، 404، المطبخ. */
async function scenarios(browser, { sem, course }) {
  const run = async (name, vp, fn) => {
    const ctx = await browser.newContext({ viewport: vp === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 }, locale: 'ar' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errs.push(`console: ${m.text().slice(0, 160)}`));
    try {
      const msg = await fn(page);
      if (errs.length) throw new Error(errs.join(' | '));
      scenarioLog.push({ name, ok: true, msg: msg || '' });
    } catch (e) {
      scenarioLog.push({ name, ok: false, msg: String(e.message ?? e).split('\n')[0] });
      note('error', `scenario: ${name}`, String(e.message ?? e).split('\n')[0]);
    } finally {
      await ctx.close();
    }
  };
  const ready = async (page, url) => {
    await page.goto(base + url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#main h1', { timeout: 8000 });
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
  };
  const key = (page, code, k, shift = false) => page.evaluate(([code, k, shift]) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: k, shiftKey: shift, bubbles: true })), [code, k, shift]);
  const path = (page) => page.evaluate(() => location.pathname + location.search + location.hash);
  const expectPath = async (page, re, what) => {
    await page.waitForFunction((src) => new RegExp(src).test(location.pathname + location.search + location.hash), re.source, { timeout: 6000 }).catch(() => undefined);
    const p = await path(page);
    if (!re.test(p)) throw new Error(`${what}: ${p}`);
    return p;
  };

  await run('g ثم 3 بلوحة عربية (code=KeyG/Digit3، key=ل/٣) → المكتبة', 'desktop', async (page) => {
    await ready(page, '/');
    await key(page, 'KeyG', 'ل');
    const ind = await page.locator('.g-wait').count();
    await key(page, 'Digit3', '٣');
    await expectPath(page, /^\/library$/, 'المسار');
    return `مؤشر g ظاهر: ${ind === 1 ? 'نعم' : 'لا'}`;
  });
  await run('g ثم c بلوحة عربية → المواد، وg ثم 2 → لوحة الفصل', 'desktop', async (page) => {
    await ready(page, '/review');
    await key(page, 'KeyG', 'ل');
    await key(page, 'KeyC', 'ؤ');
    await expectPath(page, /^\/academic\/s\/[^/]+\/courses$/, 'g c');
    await key(page, 'KeyG', 'ل');
    await key(page, 'Digit2', '2');
    await expectPath(page, /^\/academic\/s\/[^/]+$/, 'g 2');
  });
  await run('؟ تفتح نافذة الاختصارات', 'desktop', async (page) => {
    await ready(page, '/');
    await key(page, 'Slash', '؟', true);
    await page.waitForSelector('[role=dialog]', { timeout: 3000 });
  });
  await run('لوحة الأوامر: «SCSE3103» + Enter يفتح المادة', 'desktop', async (page) => {
    await ready(page, '/');
    await page.click('input[aria-label="بحث شامل"]');
    await page.keyboard.type('SCSE3103');
    await page.waitForSelector('#search-pop .hit .dot', { timeout: 5000 });
    await page.waitForTimeout(250);
    await page.keyboard.press('Enter');
    await expectPath(page, /^\/academic\/s\/[^/]+\/courses\/[^/#]+/, 'المسار');
  });
  await run('لوحة الأوامر فارغة: «زرتَه مؤخرًا» ثم «الأقسام»', 'desktop', async (page) => {
    await ready(page, '/review');
    await ready(page, '/life/finance');
    await page.click('input[aria-label="بحث شامل"]');
    const groups = await page.locator('#search-pop .hit-group').allTextContents();
    if (groups[0] !== 'زرتَه مؤخرًا' || !groups.includes('الأقسام')) throw new Error(groups.join('،'));
  });
  await run('«+ جديد» بالمفتاح c → مادة يفتح النموذج ويُحذف ?new', 'desktop', async (page) => {
    await ready(page, '/');
    await key(page, 'KeyC', 'ؤ');
    await page.waitForSelector('[role=menu][aria-label="إنشاء جديد"]', { timeout: 3000 });
    await page.click('[role=menu][aria-label="إنشاء جديد"] >> text=مادة');
    await page.waitForSelector('[role=dialog]', { timeout: 6000 });
    await expectPath(page, /^\/academic\/s\/[^/]+\/courses$/, 'المسار بعد الاستهلاك');
  });
  await run('«+ جديد» → تقييم يطلب اختيار المادة', 'desktop', async (page) => {
    await ready(page, `/academic/s/${sem}/courses?new=assessment`);
    await page.waitForSelector('[role=dialog] >> text=اختر المادة', { timeout: 6000 });
  });
  await run('«+ جديد» → فصل يفتح نموذج الفصل', 'desktop', async (page) => {
    await ready(page, '/academic?new=1');
    await page.waitForSelector('[role=dialog]', { timeout: 6000 });
    await expectPath(page, /^\/academic$/, 'المسار');
  });
  await run('التحويلات القديمة تحفظ search وhash', 'desktop', async (page) => {
    await page.goto(base + '/life/glossary?x=1#conf_confirmed', { waitUntil: 'domcontentloaded' });
    await expectPath(page, /^\/glossary\?x=1#conf_confirmed$/, '/life/glossary');
    await page.goto(base + '/home', { waitUntil: 'domcontentloaded' });
    await expectPath(page, /^\/$/, '/home');
  });
  await run('تبديل الفصل يحفظ الصفحة الفرعية (التقييمات والمواعيد)', 'desktop', async (page) => {
    const other = (await post('/api/semesters', { code: 'SEM 6', name: 'smoke semester', start_date: '2026-10-26', weeks: 14, break_weeks: [] }))?.semester?.id;
    if (!other) throw new Error('تعذّر إنشاء فصل ثانٍ');
    await ready(page, `/academic/s/${sem}/timeline`);
    await page.click('button.sem-chip');
    await page.click(`[role=menu] >> text=SEM 6`);
    await expectPath(page, new RegExp(`^/academic/s/${other}/timeline$`), 'المسار');
    await page.waitForSelector('.sem-inactive', { timeout: 6000 });
    return 'شريط «فصل غير نشط» ظاهر';
  });
  await run('SemChip داخل الدراسة فقط', 'desktop', async (page) => {
    await ready(page, '/library');
    if (await page.locator('button.sem-chip').count()) throw new Error('ظاهرة في المكتبة');
  });
  await run('Back يسترجع موضع التمرير', 'mobile', async (page) => {
    await ready(page, `/academic/s/${sem}`);
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(200);
    const y0 = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => document.querySelector('#main a[href$="/courses"]')?.click());
    await expectPath(page, /\/courses$/, 'الانتقال');
    await page.waitForTimeout(300);
    const top = await page.evaluate(() => window.scrollY);
    await page.goBack();
    await page.waitForTimeout(700);
    const y1 = await page.evaluate(() => window.scrollY);
    if (top > 5) throw new Error(`لم يبدأ أعلى الصفحة الجديدة: ${top}`);
    if (Math.abs(y1 - y0) > 40) throw new Error(`قبل ${y0} بعد ${y1}`);
    return `y=${y1}`;
  });
  await run('الجوال: «المزيد» يفتح الدرج وEsc يغلقه، والدرج المغلق inert', 'mobile', async (page) => {
    await ready(page, '/');
    if ((await page.getAttribute('aside.sidebar', 'inert')) === null) throw new Error('الدرج المغلق ليس inert');
    await page.click('nav.bottom-bar >> text=المزيد');
    await page.waitForSelector('aside.sidebar.open', { timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector('aside.sidebar:not(.open)', { timeout: 3000 });
  });
  await run('404: رجوع وبحث وروابط الأقسام', 'desktop', async (page) => {
    await page.goto(base + '/no-such-page', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=الصفحة غير موجودة', { timeout: 6000 });
    for (const t of ['رجوع', 'بحث']) if (!(await page.locator(`#main button:has-text("${t}")`).count())) throw new Error(`لا زر ${t}`);
    if ((await page.locator('#main nav[aria-label="الأقسام"] a').count()) < 6) throw new Error('روابط الأقسام ناقصة');
  });
  await run('المطبخ: HUB بـ26 مكوّنًا وأرقام 0-9 وبحث «بَيض»', 'desktop', async (page) => {
    await ready(page, '/kitchen');
    const n = await page.locator('.ing-card').count();
    if (n !== 26) throw new Error(`مكوّنات: ${n}`);
    await page.fill('input[type=search]', 'بَيض');
    const first = await page.locator('.ing-card strong').first().textContent();
    if (first !== 'بيض') throw new Error(`أول نتيجة: ${first}`);
    const kitchenInNav = await page.locator('aside nav >> text=المطبخ').count();
    return `القسم ظاهر في الشريط وأنت داخله: ${kitchenInNav ? 'نعم' : 'لا'}`;
  });
  await run('المطبخ مخفي من التنقل خارج القسم (kitchen.enabled=false)', 'desktop', async (page) => {
    await ready(page, '/');
    if (await page.locator('aside nav >> text=المطبخ').count()) throw new Error('ظاهر في الشريط');
  });
  await run('اليوم يعمل بلا مجلد راشد', 'desktop', async (page) => {
    // الخادم يقبل مجلدًا موجودًا فقط: نعيّنه ثم نحذفه ليصير «مجلد راشد غير موجود» كما على جهاز بلا راشد
    const gone = join(tmp, 'rashed-gone');
    mkdirSync(gone, { recursive: true });
    const st = await api('/api/life/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ root: gone }) });
    if (!st || st.root !== gone) throw new Error('تعذّر تغيير مجلد راشد');
    rmSync(gone, { recursive: true, force: true });
    await ready(page, '/');
    await page.waitForSelector('text=يحتاج انتباهك', { timeout: 8000 });
    const h = await page.locator('#main .card h3, #main .card h2').allTextContents().catch(() => []);
    return `بطاقات: ${h.length}`;
  });
}
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

  const routesFile = JSON.parse(readFileSync(join(root, 'scripts', 'smoke-routes.json'), 'utf8'));
  const routes = routesFile.routes.filter((r) => !ONLY || r.includes(ONLY));
  const entries = new Set(routesFile.entries ?? []);
  const redirects = routesFile.redirects ?? {};

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
            bottomBar: (() => {
              const b = document.querySelector('nav.bottom-bar');
              return !!b && getComputedStyle(b).display !== 'none';
            })(),
            indic: /[\u0660-\u0669\u06F0-\u06F9]/.test(document.querySelector('#main')?.textContent ?? ''),
            path: location.pathname + location.search,
          };
        });
        rows.push({ viewport: vp.name, route: raw, ...info, errors: errs.length });
        for (const e of errs) note('error', where, e);
        const lvl = STRICT ? 'error' : 'warn';
        const is404 = raw === '/no-such-page';
        const isRedirect = raw in redirects;
        if (info.overflow > 1) note(lvl, where, `تمرير أفقي ${info.overflow}px`);
        if (!info.h1 && !is404) note(lvl, where, 'لا h1');
        // بوابات P1: عنصر نشط واحد لكل صفحة مسجلة، وفتات خبز لكل صفحة ليست مدخل قسم، والشريط السفلي ≤960 فقط
        if (!is404 && info.navActive !== 1) note(lvl, where, `عناصر نشطة في الشريط: ${info.navActive}`);
        if (is404 && info.navActive > 1) note(lvl, where, `404 بعناصر نشطة: ${info.navActive}`);
        const target = isRedirect ? redirects[raw] : raw;
        if (!is404 && !entries.has(target) && !info.crumbs) note(lvl, where, 'لا فتات خبز');
        if (info.bottomBar !== (vp.width <= 960)) note(lvl, where, `الشريط السفلي ${info.bottomBar ? 'ظاهر' : 'مخفي'}`);
        if (isRedirect && info.path.split('?')[0] !== redirects[raw]) note('error', where, `التحويل وصل إلى ${info.path}`);
        if (info.indic) note('error', where, 'أرقام هندية-عربية في المحتوى (N-13)');
        if (SHOTS) await page.screenshot({ path: join(SHOTS, `${vp.name}-${raw.replace(/[^\w]+/g, '_') || 'root'}.png`) });
      } catch (e) {
        note('error', where, `استثناء: ${e.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }
    await ctx.close();
  }
  if (!ONLY) await scenarios(browser, { sem, course, fill });
} catch (e) {
  note('error', 'harness', String(e?.stack ?? e).split('\n').slice(0, 3).join(' | '));
} finally {
  await browser?.close();
  child.kill();
  await sleep(300);
  rmSync(tmp, { recursive: true, force: true });
}

const errors = problems.filter((p) => p.level === 'error');
if (STRICT && rows.length) {
  const uniq = new Set(rows.filter((x) => x.viewport === 'desktop').map((x) => x.title)).size;
  if (uniq < 33) errors.push({ level: 'error', where: 'titles', msg: `عناوين فريدة ${uniq} < 33` });
}
const warns = problems.filter((p) => p.level === 'warn');
for (const p of problems) console.log(`  ${p.level === 'error' ? '✗' : '!'} ${p.where}: ${p.msg}`);
const titles = new Map();
for (const r of rows.filter((x) => x.viewport === 'desktop')) titles.set(r.title, (titles.get(r.title) ?? 0) + 1);
console.log(`\nصفحات: ${rows.length / VIEWPORTS.length}  ·  عناوين فريدة: ${titles.size}  ·  أخطاء: ${errors.length}  ·  تحذيرات: ${warns.length}`);
for (const sc of scenarioLog) console.log(`  ${sc.ok ? '✓' : '✗'} ${sc.name}${sc.msg ? ' — ' + sc.msg : ''}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ rows, problems, scenarios: scenarioLog }, null, 1));
if (errors.length) console.log(log.split('\n').slice(-12).join('\n'));
process.exit(STRICT && errors.length ? 1 : 0);
