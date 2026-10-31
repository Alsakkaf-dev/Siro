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
const SCN = arg('--scenario'); // يشغّل السيناريوهات المطابقة فقط (للتكرار السريع؛ عدة أنماط مفصولة بـ||)
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
    if (SCN && !SCN.split('||').some((x) => name.includes(x))) return;
    const ctx = await browser.newContext({ viewport: vp === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 }, locale: 'ar' });
    const page = await ctx.newPage();
    const errs = [];
    const track = (p) => {
      p.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
      // انقطاع الشبكة المتعمَّد في سيناريو «بلا اتصال» ليس خطأ
      p.on('console', (m) => m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED/.test(m.text()) && errs.push(`console: ${m.text().slice(0, 160)}`));
    };
    track(page);
    try {
      const msg = await fn(page, { ctx, track });
      if (errs.length) throw new Error(errs.join(' | '));
      scenarioLog.push({ name, ok: true, msg: msg || '' });
    } catch (e) {
      const at = /browser-smoke\.mjs:(\d+)/.exec(String(e.stack ?? ''))?.[1];
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `FAIL-${name.slice(0, 12).replace(/[^\w\u0600-\u06FF]+/g, '_')}.png`) }).catch(() => undefined);
      scenarioLog.push({ name, ok: false, msg: String(e.message ?? e).split('\n')[0] + (at ? ` (السطر ${at})` : '') });
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
  await run('المطبخ ظاهر في الشريط من أي صفحة، وg ثم 6 يفتحه (kitchen.enabled=true)', 'desktop', async (page) => {
    await ready(page, '/');
    if (!(await page.locator('aside nav >> text=المطبخ').count())) throw new Error('غير ظاهر في الشريط');
    await key(page, 'KeyG', 'ل');
    await key(page, 'Digit6', '٦');
    await expectPath(page, /^\/kitchen$/, 'g 6');
    await page.waitForSelector('nav[aria-label="عروض الصفحة"] a', { timeout: 8000 });
    const tabs = await page.locator('nav[aria-label="عروض الصفحة"] a').allTextContents();
    if (tabs.length < 7) throw new Error(`تبويبات القسم: ${tabs.length}`);
    return `تبويبات: ${tabs.map((t) => t.trim()).join('، ')}`;
  });
  /* ───── المطبخ: رحلات J1 وJ2 وJ3 وJ8 ومعايير AC-01…04 (المرحلة 2) ───── */
  const kapi = async (method, url, body) => {
    const r = await fetch(`${base}/api/kitchen${url}`, { method, headers: { 'Content-Type': 'application/json', 'X-Kitchen-Client': 'smoke' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const t = await r.text();
    try { return { status: r.status, ...JSON.parse(t) }; } catch { return { status: r.status }; }
  };
  const kitchenTimings = {};
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `scenario-${name}.png`) }).catch(() => undefined); };
  const waitSlug = (page, slug) => page.waitForFunction((s) => document.querySelector('.kt-prod')?.dataset.slug === s, slug, { timeout: 4000 });

  await run('J1 المتجر: بحث «بيض/بَيض/egg/telur» بلا تشكيل، فلتر، لوحة المنتج برابط عميق، تغذية ومبلغ لحظيان (AC-01/AC-02)', 'desktop', async (page) => {
    await ready(page, '/kitchen/store');
    await page.waitForSelector('.kt-prod', { timeout: 8000 });
    const n = await page.locator('.kt-prod').count();
    if (n !== 26) throw new Error(`منتجات: ${n}`);
    for (const q of ['بيض', 'بَيض', 'egg', 'telur']) {
      await page.fill('input[aria-label="بحث في المتجر"]', q);
      await waitSlug(page, 'egg').catch(() => { throw new Error(`أول نتيجة لـ«${q}» ليست البيض`); });
    }
    await page.fill('input[aria-label="بحث في المتجر"]', '');
    await page.click('.chip:has-text("ألبان وبيض")');
    await page.waitForFunction(() => document.querySelectorAll('.kt-prod').length === 4, null, { timeout: 4000 });
    if (!/cat=/.test(await path(page))) throw new Error('الفئة ليست في الرابط');
    await page.click('.kt-prod[data-slug=egg] a.kt-prod-main');
    await page.waitForSelector('[role=dialog]', { timeout: 5000 });
    await expectPath(page, /^\/kitchen\/store\/egg/, 'الرابط العميق');
    const amt = async () => (await page.locator('[data-testid=amount] b').first().textContent()).trim();
    if ((await amt()) !== 'RM 10.00') throw new Error(`مبلغ دستة بيض من Mydin: ${await amt()}`);
    const kcal = (await page.locator('.kt-live .kt-nutri dd b').first().textContent()).trim();
    if (kcal !== '986') throw new Error(`سعرات 12 بيضة: ${kcal} (المتوقع 986 = 636 غ صالحة × 155/100)`);
    const ms = await page.evaluate(() => new Promise((res) => {
      const el = document.querySelector('[data-testid=amount] b');
      const before = el.textContent;
      const t0 = performance.now();
      const mo = new MutationObserver(() => { if (el.textContent !== before) { mo.disconnect(); res(performance.now() - t0); } });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
      document.querySelector('button[aria-label="زِد"]').click();
      setTimeout(() => { mo.disconnect(); res(-1); }, 2000);
    }));
    if (ms < 0 || ms > 100) throw new Error(`تحديث المبلغ عند تغيير الكمية: ${ms.toFixed(1)}ms (الحد 100)`);
    if ((await amt()) !== 'RM 20.00') throw new Error(`مبلغ دستتين: ${await amt()}`);
    kitchenTimings.qtyMs = Math.round(ms * 10) / 10;
    await shot(page, 'j1-product-sheet');
    await page.click('[role=dialog] button:has-text("أضف إلى السلة")');
    await page.waitForFunction(() => document.querySelector('.kt-chip.cart .num')?.textContent === '1', null, { timeout: 4000 });
    const st = await kapi('GET', '/state');
    if (!st.cart?.some((l) => l.ingredient === 'egg' && l.qty === 2 && l.unit === 'dozen')) throw new Error('السلة في الخادم لا تحوي دستتَي البيض');
    return `تحديث الكمية ${kitchenTimings.qtyMs}ms (≤100)`;
  });

  await run('J2 تحديث سعر الدجاج 8.95→9.40: نفس التبويب ≤300ms، تبويب آخر ≤1s، سياق آخر ≤3s، تدقيق وتراجع (AC-03)', 'desktop', async (page, { ctx, track }) => {
    await kapi('DELETE', '/cart');
    await kapi('PUT', '/cart/chicken', { qty: 0.5, unit: 'kg', store: null });
    const observer = (price) => (p) => p.evaluate((pr) => {
      window.__seen = null;
      const check = () => { const el = document.querySelector('.kt-prod[data-slug="chicken"] .kt-price b'); if (el && el.textContent.includes(pr)) window.__seen ??= Date.now(); };
      new MutationObserver(check).observe(document.body, { subtree: true, childList: true, characterData: true });
      check();
    }, price);
    // أ: تبويب المتجر في نفس السياق (BroadcastChannel)، ج: سياق آخر تمامًا (SSE)
    const tabA = await ctx.newPage(); track(tabA);
    await ready(tabA, '/kitchen/store?q=%D8%AF%D8%AC%D8%A7%D8%AC');
    await tabA.waitForSelector('.kt-prod[data-slug=chicken]');
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ar' });
    const tabC = await ctx2.newPage(); track(tabC);
    try {
      await ready(tabC, '/kitchen/store?q=%D8%AF%D8%AC%D8%A7%D8%AC');
      await tabC.waitForSelector('.kt-prod[data-slug=chicken]');
      const before = (await tabA.locator('.kt-prod[data-slug=chicken] .kt-price b').textContent()).trim();
      if (before !== 'RM 8.95') throw new Error(`السعر قبل التعديل: ${before}`);
      await ready(page, '/kitchen/prices');
      await page.waitForSelector('[data-cell="chicken|mydin"] button');
      await tabA.waitForTimeout(600); // اتصال SSE/BC جاهز في التبويبين
      await observer('9.40')(tabA); await observer('9.40')(tabC);
      await page.evaluate(() => {
        window.__same = null;
        document.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.__t0 = Date.now(); }, true);
        const check = () => { const el = document.querySelector('[data-cell="chicken|mydin"] [data-price]'); if (el && el.textContent === '9.40' && document.querySelector('[data-testid=impact-cart]')) window.__same ??= Date.now(); };
        new MutationObserver(check).observe(document.body, { subtree: true, childList: true, characterData: true });
      });
      await page.click('[data-cell="chicken|mydin"] button');
      await page.fill('.kt-cell-in', '9.4');
      await page.keyboard.press('Enter');
      const t0 = await page.evaluate(() => window.__t0);
      await page.waitForFunction(() => window.__same, null, { timeout: 4000 });
      await tabA.waitForFunction(() => window.__seen, null, { timeout: 5000 });
      await tabC.waitForFunction(() => window.__seen, null, { timeout: 8000 });
      const same = (await page.evaluate(() => window.__same)) - t0;
      const bc = (await tabA.evaluate(() => window.__seen)) - t0;
      const sse = (await tabC.evaluate(() => window.__seen)) - t0;
      Object.assign(kitchenTimings, { sameTabMs: same, otherTabMs: bc, otherContextMs: sse });
      if (same > 300) throw new Error(`نفس التبويب ${same}ms > 300`);
      if (bc > 1000) throw new Error(`تبويب آخر ${bc}ms > 1000`);
      if (sse > 3000) throw new Error(`سياق آخر (SSE) ${sse}ms > 3000`);
      await shot(page, 'j2-prices-impact');
      const impact = (await page.locator('[data-testid=impact-cart]').textContent()).replace(/\s+/g, ' ');
      if (!/RM\s*4\.48.*RM\s*4\.70/.test(impact)) throw new Error(`أثر السلة: ${impact}`);
      // السلة وتكلفة البطاقات تنعكس أيضًا (AC-03)
      await ready(tabA, '/kitchen/cart');
      await tabA.waitForSelector('[data-testid=cart-total]');
      const cartTotal = (await tabA.locator('[data-testid=cart-total] b').textContent()).trim();
      if (cartTotal !== 'RM 4.70') throw new Error(`إجمالي السلة بعد التعديل: ${cartTotal}`);
      // سجل التدقيق + التراجع
      await ready(page, '/kitchen/prices?tab=audit');
      await page.waitForSelector('.kt-audit tbody tr');
      const row = (await page.locator('.kt-audit tbody tr').first().textContent()).replace(/\s+/g, ' ');
      if (!/دجاج/.test(row) || !/8\.95/.test(row) || !/9\.40/.test(row)) throw new Error(`سطر التدقيق: ${row}`);
      await page.click('.kt-audit tbody tr:first-child button:has-text("تراجع")');
      await page.waitForFunction(() => /تم التراجع/.test(document.querySelector('.kt-audit')?.textContent ?? ''), null, { timeout: 4000 });
      const st = await kapi('GET', '/prices');
      const pt = st.prices.find((x) => x.ingredient === 'chicken' && x.store === 'mydin');
      if (pt.price_rm !== 8.95 || pt.source !== 'estimate_tier') throw new Error(`بعد التراجع: ${pt.price_rm} ${pt.source}`);
      await tabA.close();
      return `نفس التبويب ${same}ms (≤300) · تبويب آخر ${bc}ms (≤1000) · سياق آخر SSE ${sse}ms (≤3000)`;
    } finally {
      await ctx2.close();
    }
  });

  await run('J8 السلة: مجاميع ومقارنة الأسواق والوجبات الممكنة وأيام التغطية، وأضف الناقص يجعلها جاهزة', 'desktop', async (page) => {
    await kapi('DELETE', '/cart');
    await kapi('PUT', '/cart/egg', { qty: 1, unit: 'dozen', store: null });
    await kapi('PUT', '/cart/toast', { qty: 1, unit: 'loaf', store: null });
    await kapi('PUT', '/cart/oil', { qty: 1, unit: 'bottle', store: null });
    await ready(page, '/kitchen/cart');
    await page.waitForSelector('[data-testid=cart-total]');
    const total = (await page.locator('[data-testid=cart-total] b').textContent()).trim();
    if (total !== 'RM 24.40') throw new Error(`إجمالي (بيض 10 + توست 3.40 + زيت 11): ${total}`);
    const stores = await page.locator('.kt-cmp-list li').count();
    if (stores !== 5) throw new Error(`أسواق المقارنة: ${stores}`);
    if (!(await page.locator('.kt-cmp-list li.best').count())) throw new Error('لا توصية بأرخص سوق');
    const bk03 = page.locator('li[data-card="bk-03"]');
    const txt = (await bk03.textContent()).replace(/\s+/g, ' ');
    if (!/جبنة/.test(txt) || !/تكلفة الإكمال/.test(txt)) throw new Error(`بطاقة الناقص: ${txt}`);
    await bk03.locator('button:has-text("أضف الناقص")').click();
    await page.waitForFunction(() => [...document.querySelectorAll('.kt-meals .card')].some((c) => /جاهزة الآن/.test(c.textContent) && /توست بالبيض والجبنة/.test(c.textContent)), null, { timeout: 5000 });
    await shot(page, 'j8-cart');
    const cov = (await page.locator('[data-testid=coverage]').textContent()).replace(/\s+/g, ' ');
    return `التغطية: ${cov.slice(0, 40)}`;
  });

  await run('المحفظة + «اشتريت» الذرّي: بلا ميزانية تُمنع، الحدّ الصارم يمنع، ثم الخصم والمخزن وتفريغ السلة معًا (AC-04)', 'desktop', async (page) => {
    await ready(page, '/kitchen/cart');
    await page.waitForSelector('[data-testid=cart-total]');
    const total = (await page.locator('[data-testid=cart-total] b').textContent()).trim();
    await page.click('button:has-text("اشتريت")');
    await page.waitForSelector('[role=dialog]');
    if (!(await page.locator('[role=dialog] a:has-text("اضبط الميزانية أولًا")').count())) throw new Error('لا طلب ضبط الميزانية');
    await page.keyboard.press('Escape');
    await kapi('PUT', '/wallet', { budget_rm: 5, period: 'week', hard_limit: true });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid=cart-total]');
    await page.click('button:has-text("اشتريت")');
    if (!(await page.locator('[role=dialog] button:has-text("زِد الميزانية")').count())) throw new Error('الحدّ الصارم لم يمنع');
    await page.keyboard.press('Escape');
    // ضبط الميزانية من صفحة المحفظة فعليًا
    await page.goto(base + '/kitchen/wallet', { waitUntil: 'domcontentloaded' });
    await page.fill('#wl-b', '200');
    await page.click('button:has-text("احفظ الميزانية")');
    await page.waitForFunction(() => document.querySelector('[data-testid=wallet-balance] b')?.textContent === 'RM 200.00', null, { timeout: 5000 });
    await shot(page, 'wallet');
    await page.goto(base + '/kitchen/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid=cart-total]');
    await page.click('button:has-text("اشتريت")');
    await page.click('[role=dialog] button:has-text("أكّد الشراء")');
    await page.waitForSelector('[data-testid=purchase-done]', { timeout: 6000 });
    await shot(page, 'cart-after-purchase');
    const st = await kapi('GET', '/state');
    const rm = Number(total.replace('RM ', ''));
    const g = Object.fromEntries(st.pantry.map((p) => [p.ingredient, p.grams]));
    if (st.cart.length !== 0) throw new Error('السلة لم تُفرَّغ');
    if (Math.abs(st.wallet.balance_rm - (200 - rm)) > 0.011) throw new Error(`الرصيد ${st.wallet.balance_rm} ≠ ${200 - rm}`);
    if (g.egg !== 720 || g.toast !== 400 || g.oil !== 1840 || g.cheese !== 200) throw new Error(`المخزن: ${JSON.stringify(g)}`);
    return `خُصم ${total} وأُضيفت 4 أصناف بالغرام وفُرّغت السلة`;
  });

  await run('المخزن: الأصناف المشتراة بتكلفة الغرام الفعلية، حدّ أدنى وتنبيه نقص، وتعديل بسبب', 'desktop', async (page) => {
    await ready(page, '/kitchen/pantry');
    await page.waitForSelector('.kt-pantry-tbl tbody tr', { timeout: 6000 });
    if ((await page.locator('.kt-pantry-tbl tbody tr').count()) !== 4) throw new Error('أصناف المخزن ≠ 4');
    await page.fill('input[aria-label="حدّ أدنى لـبيض"]', '2000');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid=low-stock]', { timeout: 5000 });
    await page.click('tr[data-ing=egg] button:has-text("تعديل")');
    await page.fill('#adj-d', '-60');
    await page.fill('#adj-r', 'تلف بيضة');
    await page.click('[role=dialog] button:has-text("احفظ")');
    await page.waitForFunction(() => /660/.test(document.querySelector('tr[data-ing=egg]')?.textContent ?? ''), null, { timeout: 5000 });
    await shot(page, 'pantry');
  });

  await run('J3 القاموس: 12 بطاقة بإحصاءات MC-10، قلب البطاقة، رابط عميق، عيب ln-02، فلاتر ومقارنة', 'desktop', async (page) => {
    await ready(page, '/kitchen/codex');
    await page.waitForSelector('.kt-pc', { timeout: 8000 });
    const n = await page.locator('.kt-pc').count();
    if (n !== 12) throw new Error(`بطاقات: ${n}`);
    const secs = await page.locator('.kt-section-head h2').allTextContents();
    if (!['فطور', 'غداء', 'عشاء'].every((m) => secs.some((s) => s.includes(m)))) throw new Error(`الأقسام: ${secs}`);
    const ovr = (await page.locator('.kt-pc[data-card="ln-03"] .kt-ovr b').textContent()).trim();
    if (ovr !== '91') throw new Error(`OVR ln-03: ${ovr}`);
    if (!/ينقصها أوزان/.test(await page.locator('.kt-pc[data-card="ln-02"]').textContent())) throw new Error('شارة ln-02');
    if (!/نص مطابق/.test(await page.locator('.kt-pc[data-card="ln-04"]').textContent())) throw new Error('شارة ln-04');
    await page.focus('.kt-pc[data-card="bk-03"] .kt-pc-hit');
    await page.keyboard.press('Enter'); // لوحة المفاتيح تقلب البطاقة
    await page.waitForSelector('.kt-pc[data-card="bk-03"].flipped');
    const back = (await page.locator('.kt-pc[data-card="bk-03"] .kt-back').textContent()).replace(/\s+/g, ' ');
    if (!/1: اسلق 100 غرام من البيض ثماني دقائق/.test(back)) throw new Error('نص الخطوات ليس حرفيًا');
    if (!/532/.test(back)) throw new Error('سعرات bk-03 ≠ 532');
    await page.fill('input[aria-label="بحث في القاموس"]', 'دجاج');
    await page.waitForFunction(() => document.querySelectorAll('.kt-pc').length === 6, null, { timeout: 4000 });
    await page.fill('input[aria-label="بحث في القاموس"]', '');
    await page.selectOption('select[aria-label="الفرز"]', 'ovr');
    await page.waitForFunction(() => /sort=ovr/.test(location.search), null, { timeout: 3000 });
    await page.check('.kt-pc-wrap:has([data-card="ln-03"]) input[type=checkbox]');
    await page.check('.kt-pc-wrap:has([data-card="bk-03"]) input[type=checkbox]');
    await page.waitForSelector('#compare', { timeout: 3000 });
    await shot(page, 'j3-codex-compare');
    await page.goto(base + '/kitchen/codex/dn-02', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[role=dialog] .kt-pc.flipped', { timeout: 6000 });
    await page.waitForTimeout(700);
    await shot(page, 'j3-card-back');
    const trip = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    return `بطاقات 12، الرابط العميق يفتح الظهر${trip ? ' (تقليل الحركة مفعّل)' : ''}`;
  });
  await run('القاموس بتقليل الحركة: لا تحويلات ثلاثية الأبعاد على الوجه', 'desktop', async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, '/kitchen/codex');
    await page.waitForSelector('.kt-pc');
    const tr = await page.evaluate(() => getComputedStyle(document.querySelector('.kt-pc-face.front')).transitionDuration);
    if (parseFloat(tr) > 0.001) throw new Error(`مدة الانتقال ${tr}`);
  });
  await run('المطبخ على الجوال: المتجر والقاموس والمصفوفة بلا تمرير أفقي', 'mobile', async (page) => {
    for (const u of ['/kitchen/store', '/kitchen/codex', '/kitchen/cart', '/kitchen/wallet']) {
      await ready(page, u);
      await page.waitForTimeout(300);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 1) throw new Error(`${u}: تمرير أفقي ${ov}px`);
    }
  });
  /* ───── المرحلة 3: المطبخ K — VS-1 وAC-05/06/07 وA11Y-10 والجودات وتقليل الحركة ───── */
  const clockSec = (page) => page.evaluate(() => { const [m, s] = (document.querySelector('.kt-time b')?.textContent ?? '0:0').trim().split(':').map(Number); return m * 60 + s; });
  const waitClock = (page, sec, timeout = 90000) => page.waitForFunction((t) => { const [m, x] = (document.querySelector('.kt-time b')?.textContent ?? '0:0').trim().split(':').map(Number); return m * 60 + x >= t; }, sec, { timeout });
  const takeUi = async (page, slug, grams) => {
    await page.click(`.kt-ing-btn[data-ing="${slug}"]`);
    await page.fill('[data-testid=qty-box] input[aria-label="الكمية بالغرام"]', String(grams));
    await page.click('[data-testid=take-btn]');
  };
  const addToUi = async (page, item, vessel) => {
    await page.click(`[data-item="${item}"]`);
    await page.selectOption('[data-testid=ctx] select[aria-label="الوعاء الهدف"]', vessel);
    await page.click('[data-testid=add-to]');
  };
  const setRange = (page, sel, v) => page.evaluate(([sel, v]) => {
    const el = document.querySelector(sel);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [sel, v]);
  const money = (t) => Number(String(t).replace(/[^\d.]/g, ''));
  const hasWebgl = (page) => page.evaluate(() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') ?? c.getContext('webgl')); } catch { return false; } });

  await run('VS-1: سعر ← شراء ← مخزن ← طبخ bk-03 يدويًا ×60 ← بطاقة 532±2 ← خانة ← قانون ← نص الوصف (AC-05/06/07)', 'desktop', async (page) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
    /* 1) السعر: تكلفة bk-03 في القاموس تتغير بتغيير سعر البيض */
    const costOf = async () => {
      await ready(page, '/kitchen/codex/bk-03');
      await page.waitForSelector('[role=dialog] .kt-store-costs li.sel b', { timeout: 8000 });
      return money(await page.locator('[role=dialog] .kt-store-costs li.sel b').first().textContent());
    };
    const costBefore = await costOf();
    await ready(page, '/kitchen/prices');
    await page.waitForSelector('[data-cell="egg|mydin"] button');
    await page.click('[data-cell="egg|mydin"] button');
    await page.fill('.kt-cell-in', '10.8');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-cell="egg|mydin"] [data-price]')?.textContent === '10.80', null, { timeout: 5000 });
    const costAfter = await costOf();
    if (!(costAfter > costBefore)) throw new Error(`التكلفة لم تتغير بتغيّر السعر: ${costBefore} → ${costAfter}`);
    /* 2) الشراء والمخزن */
    await kapi('PUT', '/wallet', { budget_rm: 1000, period: 'month', hard_limit: false });
    const need = { egg: 114, toast: 80, cheese: 40, oil: 5 };
    const stBefore = await kapi('GET', '/state');
    const haveB = Object.fromEntries(stBefore.pantry.map((p) => [p.ingredient, p.grams]));
    const buys = [['egg', 1, 'dozen'], ['toast', 1, 'loaf'], ['cheese', 1, 'pack'], ['oil', 1, 'bottle']].filter(([i]) => (haveB[i] ?? 0) < need[i]);
    for (const [i, q, u] of buys) await kapi('PUT', `/cart/${i}`, { qty: q, unit: u, store: null });
    if (buys.length && (await kapi('POST', '/checkout', { store: 'mydin' })).status !== 201) throw new Error('فشل الشراء');
    await ready(page, '/kitchen/pantry');
    const pantryTxt = await page.locator('#main').textContent();
    if (!/بيض/.test(pantryTxt)) throw new Error('المخزن لا يعرض البيض');
    const pre = Object.fromEntries((await kapi('GET', '/state')).pantry.map((p) => [p.ingredient, p.grams]));
    /* 3) الطبخ يدويًا بتسريع ×60 في الوضع الموجّه */
    await ready(page, '/kitchen/cook?recipe=bk-03&mode=guided');
    // اللوحة وحدها تُختبر هنا: العالم ثلاثي الأبعاد يُختبر في WORLD-1 (المصيّر البرمجي SwiftShader يجمّد الصفحة فيتأخر Playwright)
    const webgl = await hasWebgl(page);
    await page.waitForSelector(webgl ? 'canvas.kt-canvas' : '.kt-stage-off', { timeout: 15000 });
    if (webgl) await page.uncheck('.kt-check input');
    await page.click('[role=group][aria-label="أقسام اللوحة"] >> text=الإجراءات').catch(() => page.click('button:has-text("الإجراءات")'));
    await page.click('button.chip:has-text("×60")');
    await takeUi(page, 'toast', 80); // i1
    await page.click('[data-testid=ctx] button:has-text("حمّص")');
    // خروج التوست يُبطئ الزمن تلقائيًا (KIT-23): ننتظره ثم نعيد التسريع
    await page.waitForFunction(() => /خرج التوست/.test(document.querySelector('.kt-alerts')?.textContent ?? ''), null, { timeout: 30000 });
    await page.click('button.chip:has-text("×60")');
    await page.click('[data-testid="vessel-pot_small"] button:has-text("+500 غ ماء")');
    await page.click('[data-testid="vessel-pot_small"] button:has-text("+500 غ ماء")');
    await page.selectOption('[data-testid="vessel-pot_small"] select[aria-label="موقد القدر الصغير"]', '1');
    await page.waitForSelector('[data-testid="vessel-pot_small"] input[type=range]');
    await setRange(page, '[data-testid="vessel-pot_small"] input[type=range]', 10);
    await page.waitForFunction(() => /100°م/.test(document.querySelector('[data-testid="vessel-pot_small"]')?.textContent ?? ''), null, { timeout: 60000 });
    await takeUi(page, 'egg', 100); // i2
    await addToUi(page, 'i2', 'pot_small');
    const t0 = await clockSec(page);
    await waitClock(page, t0 + 481);
    await page.click('[data-item="i2"]');
    await page.click('[data-testid=ctx] button:has-text("أخرج")');
    await setRange(page, '[data-testid="vessel-pot_small"] input[type=range]', 0);
    await page.selectOption('[data-testid="vessel-pot_small"] select[aria-label="موقد القدر الصغير"]', '0');
    await page.click('[data-item="i2"]');
    await page.click('[data-testid=ctx] button:has-text("قشّر")');
    await page.selectOption('[data-testid=ctx] select[aria-label="شكل القطع"]', 'slices');
    await page.click('[data-testid=ctx] button:text-is("قطّع")');
    await takeUi(page, 'cheese', 40); // i3
    await takeUi(page, 'oil', 5);
    await page.selectOption('[data-testid=pour-box] select[aria-label="الوعاء"]', 'plate_1');
    await page.click('[data-testid=pour-box] button:text-is("اصبب")');
    await addToUi(page, 'i3', 'plate_1');
    await addToUi(page, 'i2', 'plate_1');
    await page.click('[role=group][aria-label="أقسام اللوحة"] >> text=الوصفة');
    await page.waitForSelector('.kt-recipe-steps li', { timeout: 4000 });
    const stepsDone = await page.locator('.kt-recipe-steps li[data-step-done="1"]').count();
    if (stepsDone !== 4) throw new Error(`الوضع الموجّه: ${stepsDone}/4 خطوات مكتملة بعد تنفيذ الوصفة كلها`);
    /* 4) قدّم ← مراجعة البطاقة ← حفظ كنسخة */
    await page.click('[data-testid=serve-btn]');
    await page.click('[data-testid=serve-confirm]');
    await page.waitForSelector('#rv-name', { timeout: 8000 });
    await shot(page, 'cook-review');
    const reviewOvr = Number((await page.locator('.kt-review-side .badge').first().textContent()).replace(/\D/g, ''));
    const reviewCost = money(await page.locator('.kt-review-side p:has-text("التكلفة")').first().textContent());
    await page.click('[data-testid=save-card]');
    const dup = await page.waitForSelector('[data-testid=dup-variant]', { timeout: 6000 }).catch(() => null);
    if (dup) await dup.click();
    await expectPath(page, /^\/kitchen\/codex\/my-[^/]+/, 'بعد الحفظ');
    const cards = (await kapi('GET', '/cards')).cards;
    const card = cards[0];
    if (!card) throw new Error('لا بطاقة محفوظة');
    const kcal = card.nutrition.kcal;
    if (!(kcal >= 530 && kcal <= 534)) throw new Error(`AC-05: السعرات ${kcal} ليست 532±2`);
    if (card.parent_slug !== 'bk-03') throw new Error(`الأصل: ${card.parent_slug}`);
    if (card.flags.some((f) => ['unsafe_chicken', 'burnt', 'undercooked'].includes(f))) throw new Error(`وسوم غير متوقعة: ${card.flags}`);
    if (Math.abs(card.cost_rm - costAfter) > 0.011) throw new Error(`تكلفة البطاقة ${card.cost_rm} ≠ تكلفة القاموس بعد تغيير السعر ${costAfter}`);
    if (Math.abs(card.cost_rm - reviewCost) > 0.011 || card.stats.OVR !== reviewOvr) throw new Error(`AC-06: عرض المراجعة (${reviewOvr}، ${reviewCost}) ≠ المحفوظ (${card.stats.OVR}، ${card.cost_rm})`);
    const post = Object.fromEntries((await kapi('GET', '/state')).pantry.map((p) => [p.ingredient, p.grams]));
    const d = (i) => Math.round((pre[i] - post[i]) * 10) / 10;
    if (Math.abs(d('egg') - 100 / 0.88) > 1 || d('toast') !== 80 || d('cheese') !== 40 || d('oil') !== 5) throw new Error(`خصم المخزن: ${JSON.stringify({ egg: d('egg'), toast: d('toast'), cheese: d('cheese'), oil: d('oil') })}`);
    /* 5) خانة الجدول: من بطاقتي إلى الخطة */
    await page.waitForSelector('[role=dialog] .kt-mycard', { timeout: 8000 });
    await page.click('[role=dialog] .kt-mycard >> text=ضعها في الجدول');
    await expectPath(page, /^\/kitchen\/plan\?card=my-[^&]+&slot=/, 'من البطاقة إلى الخطة');
    await page.waitForSelector('[data-testid=law-status] .badge', { timeout: 8000 });
    await page.selectOption('[data-testid="pick-غداء"]', 'ln-01');
    await page.selectOption('[data-testid="pick-عشاء"]', 'dn-04');
    await page.waitForSelector('[data-testid=law-reject]', { timeout: 6000 });
    const rej = await page.locator('[data-testid=law-reject]').textContent();
    const nSol = await page.locator('[data-testid=law-reject] li').count();
    if (!/مجموع اليوم \d+ سعرة، أعلى من الحد الأعلى \d+ بمقدار \d+/.test(rej) || nSol !== 3) throw new Error(`رسالة الرفض: ${rej.slice(0, 120)} (${nSol} حلول)`);
    if (!(await page.locator('[data-testid=save-plan]').isDisabled())) throw new Error('الحفظ ممكن رغم رفض القانون');
    await shot(page, 'plan-reject');
    await page.check('[data-testid=autofit]');
    await page.waitForFunction(() => !document.querySelector('[data-testid=law-reject]') && !document.querySelector('[data-testid=save-plan]')?.disabled, null, { timeout: 6000 });
    await page.click('[data-testid=save-plan]');
    await page.waitForFunction(() => /حُفظ/.test(document.body.textContent ?? ''), null, { timeout: 6000 });
    const day = (await kapi('GET', `/plan?from=${new Date().toISOString().slice(0, 10)}&days=1`)).days[0];
    if (!day || day.status !== 'proposal' || day.slots.length !== 3) throw new Error(`اليوم المحفوظ: ${JSON.stringify(day)?.slice(0, 120)}`);
    if (day.total_kcal < 1200 || day.total_kcal > 1500) throw new Error(`مجموع اليوم المحفوظ ${day.total_kcal}`);
    /* 6) نص الوصف بالقالب 2.6 مع «انسخ» */
    const body = await page.locator('[data-testid="body-غداء"]').textContent();
    if (!/^.+\n1: .+/m.test(body) || !body.includes('القيمة الغذائية الإجمالية للوجبة:') || !/السعرات الحرارية: \d+ سعرة حرارية/.test(body) || /<[a-z]/i.test(body)) throw new Error(`نص الوصف: ${body.slice(0, 100)}`);
    await page.click('[data-testid="copy-غداء"]');
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
    if (clip !== null && clip !== body) throw new Error('المنسوخ ≠ نص الوصف');
    await shot(page, 'plan-accepted');
    /* AC-07: لا طريق لحفظ يوم مخالف للقانون */
    const bad = await kapi('PUT', '/plan/2031-01-01', { slots: { فطور: { card: 'bk-04' }, غداء: { card: 'ln-01' }, عشاء: { card: 'dn-04' } }, auto_fit: false });
    const none = (await kapi('GET', '/plan?from=2031-01-01&days=1')).days;
    if (bad.code !== 'law' || none.length) throw new Error(`AC-07: ${bad.code} / محفوظ: ${none.length}`);
    return `WebGL ${webgl ? 'نعم' : 'لا'} · خطوات الوصفة المنجزة ${stepsDone}/4 · بطاقة ${kcal} سعرة OVR ${card.stats.OVR} تكلفة ${card.cost_rm} · اليوم ${Math.round(day.total_kcal)} سعرة`;
  });
  await run('A11Y-10: بلا WebGL تعمل لوحة الإجراءات وتنتج المراجعة نفسها (وضع التجربة)', 'desktop', async (page) => {
    await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(String(t)) ? null : o.call(this, t, ...a); }; });
    await ready(page, '/kitchen/cook?mode=sandbox');
    await page.waitForSelector('.kt-stage-off', { timeout: 8000 });
    if (!/WebGL غير متاح/.test(await page.locator('.kt-stage-off').textContent())) throw new Error('رسالة غياب WebGL');
    if (!(await page.locator('.kt-alerts[aria-live=polite]').count())) throw new Error('لا منطقة تنبيهات حيّة');
    await takeUi(page, 'egg', 100);
    await addToUi(page, 'i1', 'plate_1');
    await page.click('[data-testid=serve-btn]');
    await page.click('[data-testid=serve-confirm]');
    await page.waitForSelector('#rv-name', { timeout: 6000 });
    const txt = await page.locator('.kt-review').textContent();
    if (!/OVR/.test(txt) || !/بيض/.test(txt)) throw new Error('مراجعة البطاقة ناقصة');
    await shot(page, 'cook-a11y');
    return 'البطاقة تُبنى بلا مشهد ثلاثي الأبعاد';
  });
  await run('الجودات الثلاث + المحطات 1–7 + تقليل الحركة على المشهد', 'desktop', async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, '/kitchen/cook?mode=sandbox');
    if (!(await hasWebgl(page))) return 'WebGL غير متاح في هذا المتصفح — تُخطّى';
    await page.waitForSelector('canvas.kt-canvas', { timeout: 15000 });
    if ((await page.getAttribute('canvas.kt-canvas', 'data-reduced')) !== '1') throw new Error('تقليل الحركة لم يصل للمشهد');
    // سباق معروف: تغيير الجودة قبل أول رسم قد يضيع تحت SwiftShader؛ ننتظر أول إطار
    await page.waitForFunction(() => Number(document.querySelector('canvas.kt-canvas')?.dataset.calls) > 0, null, { timeout: 30000 });
    const shots = [];
    for (const q of ['lite', 'standard', 'high']) {
      await page.selectOption('select[aria-label="جودة الرسم"]', q);
      await page.waitForFunction((q) => document.querySelector('canvas.kt-canvas')?.dataset.quality === q, q, { timeout: 15000 }).catch(async () => { throw new Error(`الجودة ${q} لم تُطبَّق (الحالية: ${await page.evaluate(() => document.querySelector('canvas.kt-canvas')?.dataset.quality)})`); });
      await page.waitForTimeout(700);
    }
    await page.selectOption('select[aria-label="جودة الرسم"]', 'standard');
    for (const k of ['Digit1', 'Digit5']) {
      await page.evaluate((code) => window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })), k);
      await page.waitForTimeout(600);
      shots.push(await page.locator('canvas.kt-canvas').screenshot());
    }
    if (shots[0].equals(shots[1])) throw new Error('المشهد لم يتغير بين محطة الرفوف والطبخ');
    await page.waitForFunction(() => Number(document.querySelector('canvas.kt-canvas')?.dataset.calls) > 0, null, { timeout: 5000 });
    const st = await page.evaluate(() => { const c = document.querySelector('canvas.kt-canvas'); return { calls: Number(c.dataset.calls), tris: Number(c.dataset.tris), kit: c.dataset.kit }; });
    if (st.calls > 150 || st.tris > 250000) throw new Error(`PERF-20: draw calls ${st.calls} (≤150) · مثلثات ${st.tris} (≤250000)`);
    await shot(page, 'cook-3d');
    const fps = await page.locator('.kt-stations small').textContent().catch(() => '');
    return `الجودات الثلاث تعمل؛ PERF-20: draw calls ${st.calls} (≤150) · مثلثات ${st.tris} (≤250000) · الحزمة ${st.kit}؛ ${fps.trim() || 'fps غير ظاهر'} (SwiftShader بلا GPU: لا يمثل الجهاز الحقيقي)`;
  });
  await run('WORLD-1: عالم المطبخ بالشخص الأول — دخول، إمساك، قدر على موقد، مقبض اللهب، قطع بالسكين', 'desktop', async (page) => {
    await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new Error('stub')); Element.prototype.requestPointerLock = () => { throw new Error('stub'); }; });
    await ready(page, '/kitchen/cook?mode=sandbox&e2e=1');
    if (!(await hasWebgl(page))) return 'WebGL غير متاح في هذا المتصفح — تُخطّى';
    await page.waitForSelector('[data-testid=enter-kitchen]', { timeout: 60000 });
    const S = (expr) => page.evaluate(`(() => { const s = window.__kitchenScene; return ${expr}; })()`);
    const press = async (b = 0, ms = 100) => { await S(`s.e2e.press(${b}, ${ms})`); await page.waitForTimeout(450); };
    const holds = () => S('s.e2e.holds()');
    const wait = async (k) => { for (let i = 0; i < 24 && !(await holds()).includes(k); i++) await page.waitForTimeout(250); return holds(); };
    const faceNode = async (name, dy, back, dir) => { const p = await S(`s.e2e.node('${name}')`); if (!p) throw new Error(`عقدة ${name} غير موجودة`); await S(`s.e2e.stand(${p[0] + dir[0] * back}, ${p[2] + dir[1] * back})`); await S(`s.e2e.look(${p[0]}, ${p[1] + dy}, ${p[2]})`); await page.waitForTimeout(450); return p; };
    await page.evaluate(() => document.querySelector('[data-testid=enter-kitchen]').click());
    await page.waitForFunction(() => document.querySelector('.kt-world')?.dataset.game === 'on', null, { timeout: 5000 });
    // الحساسية تُحفظ وتُطبَّق من قائمة الإيقاف
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-testid=pause-menu]', { timeout: 4000 });
    await page.evaluate(() => { const i = document.querySelector('[aria-label="حساسية الفأرة"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '1.8'); i.dispatchEvent(new Event('input', { bubbles: true })); });
    if (!(await page.evaluate(() => localStorage.getItem('siro.kitchen.game'))).includes('1.8')) throw new Error('الحساسية لم تُحفظ');
    await page.evaluate(() => document.querySelector('[data-testid=resume-game]').click());
    // 1) قدر على الموقد
    await faceNode('equip_pot_small', 0.05, 0.9, [0, -1]); await press(); if (!(await wait('vessel')).includes('pot_small')) throw new Error('لم يُمسك القدر');
    const bp = await S("s.e2e.node('burner_2')");
    await S(`s.e2e.stand(${bp[0] - 1.0}, ${bp[2]})`); await S(`s.e2e.look(${bp[0]}, ${bp[1]}, ${bp[2]})`); await page.waitForTimeout(450); await press();
    if (JSON.parse(await S('s.e2e.vessels()')).find((v) => v.id === 'pot_small').burner !== 2) throw new Error('القدر لم يُوضع على الموقد 2');
    // 2) بيضة إلى القدر
    const sl = await S("s.e2e.slot('egg')"); await S(`s.e2e.stand(${sl[0]}, ${sl[2] + 0.95})`); await S(`s.e2e.look(${sl[0]}, ${sl[1]}, ${sl[2]})`); await page.waitForTimeout(450);
    await press(); if (!(await wait('item')).includes('"item"')) throw new Error('لم يُمسك المكوّن');
    await S(`s.e2e.stand(${bp[0] - 0.9}, ${bp[2]})`); await S(`s.e2e.look(${bp[0]}, ${bp[1] + 0.08}, ${bp[2]})`); await page.waitForTimeout(450); await press();
    if (!JSON.parse(await S('s.e2e.vessels()')).find((v) => v.id === 'pot_small').items.length) throw new Error('البيضة لم تدخل القدر');
    // 3) مقبض الموقد يشعل اللهب
    await S(`s.e2e.look(${bp[0] - 0.36}, ${bp[1] - 0.15}, ${bp[2]})`); await page.waitForTimeout(450); await press();
    if (!(await S('s.e2e.burners()'))[1]) throw new Error('المقبض لم يشعل اللهب');
    // 4) سكين وقطع على اللوح
    const sl2 = await S("s.e2e.slot('toast')"); await S(`s.e2e.stand(${sl2[0]}, ${sl2[2] + 0.95})`); await S(`s.e2e.look(${sl2[0]}, ${sl2[1]}, ${sl2[2]})`); await page.waitForTimeout(450);
    await press(); await wait('item');
    const bd = await S("s.e2e.node('board_main')"); await S(`s.e2e.stand(${bd[0]}, ${bd[2] + 0.75})`); await S(`s.e2e.look(${bd[0]}, ${bd[1]}, ${bd[2]})`); await page.waitForTimeout(450); await press();
    await faceNode('tool_knife', 0, 0.7, [0, 1]); await press(); if (!(await wait('tool')).includes('knife')) throw new Error('لم يُمسك السكين');
    await S(`s.e2e.stand(${bd[0]}, ${bd[2] + 0.75})`); await S(`s.e2e.look(${bd[0]}, ${bd[1]}, ${bd[2]})`); await page.waitForTimeout(450);
    for (let i = 0; i < 12; i++) { await S('s.e2e.swipe(150)'); await page.waitForTimeout(90); }
    await page.waitForTimeout(800);
    const snap = JSON.parse(await S('s.e2e.snap()'));
    if (!snap.some((i) => i.ing === 'toast' && i.cut)) throw new Error(`القطع بحركة الفأرة لم يعمل: ${JSON.stringify(snap)}`);
    const photo = await S('s.capturePhoto()');
    if (!photo || !photo.startsWith('data:image/webp') || photo.length < 4000) throw new Error('صورة البطاقة من العالم فارغة/مفقودة');
    await shot(page, 'cook-world');
    const st = await page.evaluate(() => { const c = document.querySelector('canvas.kt-canvas'); return { calls: Number(c.dataset.calls), nodes: c.dataset.worldNodes, gaps: c.dataset.worldGaps }; });
    if (st.gaps) throw new Error(`عقد ناقصة في عالم GLB: ${st.gaps}`);
    return `عالم GLB ${st.nodes} عقدة بلا نواقص؛ قدر→موقد، مكوّن→قدر، مقبض اللهب، قطع بالسكين تعمل؛ draw calls ${st.calls}`;
  });
  /* ───── الجدول CAL (K-M9) ───── */
  const capi = async (method, url, body) => {
    const r = await fetch(`${base}/api/calendar${url}`, { method, headers: { 'Content-Type': 'application/json', 'X-Kitchen-Client': 'smoke' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const t = await r.text();
    try { return { status: r.status, ...JSON.parse(t) }; } catch { return { status: r.status }; }
  };
  await run('CAL-1: الجدول — عروض أسبوعي/يومي/شهري/قائمة، فلاتر وتنبيه التقويم المخفي، مصدر موسوم، CAL-18 بالثلاثية', 'desktop', async (page) => {
    await ready(page, '/calendar?date=2026-10-26');
    await page.waitForSelector('[data-testid=cal-source]', { timeout: 8000 });
    const src = (await page.locator('[data-testid=cal-source]').textContent()) ?? '';
    if (!/خريطة الروتين/.test(src) || !/ليست أحداث Outlook/.test(src)) throw new Error(`المصدر غير موسوم: ${src.slice(0, 80)}`);
    const n = await page.locator('[data-testid=cal-event]').count();
    if (n < 1) throw new Error(`أحداث الأسبوع: ${n}`);
    const triple = ((await page.locator('[data-testid=cal18-triple]').textContent()) ?? '').trim();
    if (!/^\d+ \/ \d+ \/ \d+$/.test(triple)) throw new Error(`ثلاثية التحقق: ${triple}`);
    await page.locator('[data-testid=cal-event]:not(.is-free)').first().click();
    await page.waitForSelector('[role=dialog]', { timeout: 4000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role=dialog]', { state: 'detached', timeout: 4000 });
    // فلتر: إخفاء تقويم فيه أحداث يظهر تنبيه CAL-17 وتبقى الثلاثية ثابتة (الفحص على كل التقاويم)
    const chips = page.locator('.cal-fchip');
    const cnt = await chips.count();
    if (cnt < 1) throw new Error(`تقاويم: ${cnt}`);
    await chips.first().click();
    await page.waitForSelector('[data-testid=cal-hidden-warn]', { timeout: 4000 });
    const triple2 = ((await page.locator('[data-testid=cal18-triple]').textContent()) ?? '').trim();
    if (triple2 !== triple) throw new Error(`الثلاثية تغيّرت بالإخفاء: ${triple} → ${triple2}`);
    if (!/hide=/.test(await path(page))) throw new Error('الفلتر ليس في الرابط');
    await chips.first().click();
    for (const [lbl, re] of [['يومي', /view=day/], ['شهري', /view=month/], ['قائمة', /view=list/], ['أسبوعي', /^((?!view=).)*$/]]) {
      await page.click(`.seg button:has-text("${lbl}")`);
      await expectPath(page, re, `عرض ${lbl}`);
    }
    // الشهري: ضغط يوم يفتح اليومي
    await page.click('.seg button:has-text("شهري")');
    await page.waitForSelector('.cal-md', { timeout: 4000 });
    await page.locator('.cal-md:not(.out)').nth(3).click();
    await expectPath(page, /view=day/, 'من الشهر إلى اليوم');
    await shot(page, 'calendar-day');
    return `أحداث الأسبوع ${n}، ثلاثية ${triple}`;
  });
  await run('CAL-2: استيراد لقطة ICS يغيّر المصدر ويعرض 0/0/0 ليوم مغطّى، والكتابة ترفض بلا ترويسة', 'desktop', async (page) => {
    const ics = ['BEGIN:VCALENDAR', 'X-WR-CALNAME:روتين وصحة', 'BEGIN:VEVENT', 'UID:s1', 'SUMMARY:😴 نوم', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261111T000000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261111T060000', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:s2', 'SUMMARY:🌅 صباح', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261111T060000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261111T200000', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:s3', 'SUMMARY:😴 جاري النوم', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261111T200000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261112T000000', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const raw = await fetch(`${base}/api/calendar/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format: 'ics', text: ics, from: '2026-11-11', to: '2026-11-11' }) });
    if (raw.status !== 403) throw new Error(`الاستيراد بلا ترويسة: ${raw.status}`);
    const r = await capi('POST', '/import', { format: 'ics', text: ics, from: '2026-11-11', to: '2026-11-11' });
    if (r.status !== 201 || r.imported !== 3) throw new Error(`الاستيراد: ${JSON.stringify(r).slice(0, 120)}`);
    await ready(page, '/calendar?view=day&date=2026-11-11');
    await page.waitForSelector('[data-testid=cal-source]', { timeout: 8000 });
    const src = (await page.locator('[data-testid=cal-source]').textContent()) ?? '';
    if (!/لقطة مستوردة/.test(src)) throw new Error(`المصدر: ${src.slice(0, 60)}`);
    const triple = ((await page.locator('[data-testid=cal18-triple]').textContent()) ?? '').trim();
    if (triple !== '0 / 0 / 0') throw new Error(`CAL-18 ليوم مغطّى: ${triple}`);
    if ((await page.locator('[data-testid=cal18]').getAttribute('data-ok')) !== '1') throw new Error('data-ok');
    // ثغرة مزروعة: يوم ناقص يظهر فجوة
    await capi('DELETE', '/import');
    return 'استيراد ICS → المصدر «لقطة مستوردة» → 0 / 0 / 0';
  });
  const kput = (date, slots, auto_fit = false) => kapi('PUT', `/plan/${date}`, { slots, auto_fit });
  await run('J6/J7 من الجدول: حدث «غداء» ← بطاقة ← الملاءمة قبل/بعد ← الحفظ؛ يوم مخالف يُرفض بالمجموع والفرق وحلول بلا تجاوز (AC-07/08)', 'desktop', async (page) => {
    // لقطة تغطي 2026-11-12 كاملة وفيها حدث «غداء» (فطور/عشاء لا حدث لهما ⇒ خانتان افتراضيتان)
    const ics = ['BEGIN:VCALENDAR', 'X-WR-CALNAME:روتين وصحة', 'BEGIN:VEVENT', 'UID:m1', 'SUMMARY:نوم', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261112T000000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261112T120000', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:m2', 'SUMMARY:🍽️ غداء', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261112T120000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261112T130000', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:m3', 'SUMMARY:راحة', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261112T130000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261113T000000', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    if ((await capi('POST', '/import', { format: 'ics', text: ics, from: '2026-11-12', to: '2026-11-12' })).status !== 201) throw new Error('استيراد اللقطة');
    await ready(page, '/calendar?view=day&date=2026-11-12');
    await page.waitForSelector('[data-testid=cal-event]', { timeout: 8000 });
    await page.locator('[data-testid=cal-event]:has-text("غداء")').click();
    await page.waitForSelector('[role=dialog] [data-testid=day-meals]', { timeout: 8000 });
    const dlg = page.locator('[role=dialog]');
    // J6: اختيار بطاقة لثلاث خانات عبر المنتقي
    for (const [slot, slug] of [['فطور', 'cy-bk-03'], ['غداء', 'cy-ln-01'], ['عشاء', 'cy-dn-04']]) {
      await dlg.locator(`[data-testid=pick-btn-${slot}]`).click();
      await page.waitForSelector('[data-testid=meal-picker]', { timeout: 5000 });
      await page.locator(`[data-testid=meal-picker] [data-slug=${slug}]`).first().click();
      await page.waitForSelector('[data-testid=meal-picker]', { state: 'detached', timeout: 5000 });
    }
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('[role=dialog] [data-testid=law-total]')?.textContent?.trim()) - 1361) <= 3, null, { timeout: 8000 });
    if ((await dlg.locator('[data-testid=law-gauge]').getAttribute('data-state')) !== 'VALID') throw new Error('حالة القانون');
    // الملاءمة التلقائية: جدول قبل/بعد
    await dlg.locator('[data-testid=autofit]').check();
    await page.waitForSelector('[role=dialog] [data-testid=ba-table]', { timeout: 8000 });
    const after = Number((await dlg.locator('[data-testid=law-total]').textContent()).trim());
    if (Math.abs(after - 1300) > 50) throw new Error(`بعد الملاءمة: ${after}`);
    await dlg.locator('[data-testid=autofit]').uncheck();
    await dlg.locator('[data-testid=save-plan]').click();
    await page.waitForFunction(() => /محفوظ: 136\d/.test(document.querySelector('[role=dialog]')?.textContent ?? ''), null, { timeout: 8000 });
    await shot(page, 'meals-day');
    // J7: يوم مكتمل 1501 أو 1199 يُرفض (واجهة وخادم) بلا مسار تجاوز
    const man = (t, kcal) => ({ manual: { title_ar: t, kcal, protein_g: 10, carbs_g: 10, fat_g: 10, fiber_g: 1 } });
    const hi = await kput('2026-11-20', { 'فطور': man('أ', 500), 'غداء': man('ب', 600), 'عشاء': man('ج', 401) });
    const lo = await kput('2026-11-20', { 'فطور': man('أ', 400), 'غداء': man('ب', 400), 'عشاء': man('ج', 399) });
    if (hi.code !== 'law' || hi.total_kcal !== 1501 || hi.diff !== 1 || !hi.solutions?.length) throw new Error(`1501: ${JSON.stringify(hi).slice(0, 140)}`);
    if (lo.code !== 'law' || lo.total_kcal !== 1199) throw new Error(`1199: ${JSON.stringify(lo).slice(0, 140)}`);
    await page.keyboard.press('Escape');
    await ready(page, '/calendar/meals?date=2026-11-21');
    await page.waitForSelector('[data-testid=day-meals]', { timeout: 8000 });
    for (const [slot, slug] of [['فطور', 'cy-bk-03'], ['غداء', 'cy-ln-01'], ['عشاء', 'cy-dn-04']]) {
      await page.locator(`[data-testid=pick-btn-${slot}]`).click();
      await page.locator(`[data-testid=meal-picker] [data-slug=${slug}]`).first().click();
    }
    await page.locator('.dm-slot[data-slot=فطور] .chip:has-text("×1.5")').click();
    await page.locator('.dm-slot[data-slot=غداء] .chip:has-text("×1.5")').click();
    await page.waitForSelector('[data-testid=law-reject]', { timeout: 8000 });
    if (!(await page.locator('[data-testid=law-reject] li').count())) throw new Error('لا حلول في رسالة الرفض');
    if (!(await page.locator('[data-testid=save-plan]').isDisabled())) throw new Error('زر الحفظ مفعّل خارج المجال');
    if (await page.locator('button, [role=button], label, input[type=checkbox]').filter({ hasText: /تجاوز|override|bypass/i }).count()) throw new Error('يوجد مسار «تجاوز»');
    await capi('DELETE', '/import');
    await kapi('DELETE', '/plan/2026-11-12');
    return 'غداء ← منتقي ← ≈1361 داخل المجال ← ملاءمة نحو 1300 بجدول قبل/بعد ← حفظ؛ 1501/1199 مرفوضان ولا تجاوز';
  });
  await run('MEAL-2: الدورة 30 يومًا (30 سطرًا، رفض الدفعة، تطبيق)، قائمة التسوّق من الجدول مع السلة، والسجل التغذوي', 'desktop', async (page) => {
    await ready(page, '/calendar/meals?tab=cycle');
    await page.waitForSelector('[data-testid=cycle-table] tbody tr', { timeout: 8000 });
    await page.fill('input[aria-label="من تاريخ"]', '2026-12-01');
    await page.fill('input[aria-label="إلى تاريخ"]', '2026-12-30');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=cycle-table] tbody tr').length === 30, null, { timeout: 8000 });
    if (!/داخل المجال/.test(await page.locator('[data-testid=cycle-summary]').textContent())) throw new Error('الملخص');
    await page.selectOption('select[aria-label="معامل الحصة"]', '1.5');
    await page.waitForFunction(() => /مخالف/.test(document.querySelector('[data-testid=cycle-summary]')?.textContent ?? ''), null, { timeout: 8000 });
    if (!(await page.locator('[data-testid=cycle-apply]').isDisabled())) throw new Error('التطبيق مفعّل رغم المخالفات');
    await page.selectOption('select[aria-label="معامل الحصة"]', '1');
    await page.waitForFunction(() => /داخل المجال/.test(document.querySelector('[data-testid=cycle-summary]')?.textContent ?? ''), null, { timeout: 8000 });
    await page.locator('[data-testid=cycle-apply]').click();
    await page.waitForFunction(async () => (await (await fetch('/api/kitchen/plan?from=2026-12-01&days=30')).json()).days.length === 30, null, { timeout: 8000 });
    await shot(page, 'meals-cycle');
    // التسوّق
    await ready(page, '/calendar/meals?tab=shop');
    await page.fill('input[aria-label="من تاريخ"]', '2026-12-01');
    await page.fill('input[aria-label="إلى تاريخ"]', '2026-12-03');
    await page.waitForSelector('[data-testid=shop-table] tbody tr', { timeout: 8000 });
    const rows = await page.locator('[data-testid=shop-table] tbody tr').count();
    if (rows < 8) throw new Error(`أسطر التسوّق: ${rows}`);
    await page.waitForSelector('[data-testid=shop-cost]', { timeout: 4000 });
    await page.locator('[data-testid=shop-to-cart]').click();
    await page.waitForFunction(async () => (await (await fetch('/api/kitchen/state')).json()).cart.length >= 8, null, { timeout: 8000 });
    // السجل
    await ready(page, '/calendar/meals?tab=log');
    await page.fill('input[aria-label="من تاريخ"]', '2026-12-01');
    await page.fill('input[aria-label="إلى تاريخ"]', '2026-12-30');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=log-bars] .log-row').length === 30, null, { timeout: 8000 });
    await kapi('POST', '/plan/cycle', { from: '2026-12-01', to: '2026-12-30', apply: false });
    for (let d = 1; d <= 30; d++) await kapi('DELETE', `/plan/2026-12-${String(d).padStart(2, '0')}`);
    await kapi('DELETE', '/cart');
    return 'دورة 30 يومًا ← رفض ×1.5 ← تطبيق ← تسوّق إلى السلة ← سجل 30 يومًا';
  });
  await run('PROP-1: يوم الخطة ← اقتراحات بقالب حرفي وفرق ← اعتماد ← تصدير JSON ونص لراشد ← «مطبّق» بعد التصدير فقط، بلا كتابة في Outlook (AC-10)', 'desktop', async (page) => {
    const vev = (uid, t, a, b, cal = 'روتين وصحة') => ['BEGIN:VEVENT', `UID:${uid}`, `SUMMARY:${t}`, `DTSTART;TZID=Asia/Kuala_Lumpur:${a}`, `DTEND;TZID=Asia/Kuala_Lumpur:${b}`, `X-SIRO-CALENDAR:${cal}`, 'END:VEVENT'].join('\r\n');
    const ics = ['BEGIN:VCALENDAR', vev('p1', '😴 نوم', '20261116T000000', '20261116T060000'), vev('p2', 'فطور', '20261116T060000', '20261116T070000'), vev('p3', 'عمل', '20261116T070000', '20261116T120000'), vev('p4', 'غداء', '20261116T120000', '20261116T130000'), vev('p5', 'راحة', '20261116T130000', '20261116T230000'), vev('p6', '😴 جاري النوم', '20261116T230000', '20261117T000000'), 'END:VCALENDAR'].join('\r\n');
    if ((await capi('POST', '/import', { format: 'ics', text: ics, from: '2026-11-16', to: '2026-11-16' })).status !== 201) throw new Error('الاستيراد');
    const put = await kput('2026-11-16', { 'فطور': { card: 'cy-bk-03' }, 'غداء': { card: 'cy-ln-01' }, 'عشاء': { card: 'cy-dn-04' } });
    if (put.total_kcal < 1200) throw new Error(`حفظ اليوم: ${JSON.stringify(put).slice(0, 100)}`);
    await ready(page, '/calendar/proposals');
    await page.fill('input[aria-label="يوم الخطة"]', '2026-11-16');
    await page.click('[data-testid=gen-plan]');
    await page.waitForFunction(() => /أُنشئ 2 اقتراحًا/.test(document.querySelector('[data-testid=gen-result]')?.textContent ?? ''), null, { timeout: 8000 });
    if (!/لا حدث مقابل/.test(await page.locator('[data-testid=gen-result]').textContent())) throw new Error('عشاء بلا حدث لم يُتخطَّ بسببه');
    await page.waitForSelector('[data-testid=proposal][data-status=pending]', { timeout: 5000 });
    const diff = (await page.locator('[data-testid=diff]').first().textContent()) ?? '';
    if (!/القيمة الغذائية الإجمالية للوجبة:/.test(diff) || !/السعرات الحرارية: \d+ سعرة حرارية/.test(diff)) throw new Error('الفرق لا يعرض القالب الحرفي');
    if (/[٠-٩A-Za-z]/.test(diff)) throw new Error('حروف لاتينية/أرقام هندية في الوصف');
    if (!(await page.locator('[data-testid=export-all]').isDisabled())) throw new Error('التصدير مفعّل بلا معتمد');
    for (const n of [0, 1]) await page.locator('[data-testid=proposal][data-status=pending] button:has-text("اعتمد")').first().click().then(() => page.waitForTimeout(300));
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=proposal][data-status=approved]').length === 2, null, { timeout: 6000 });
    if (!(await page.locator('[data-testid=mark-applied]').first().isDisabled())) throw new Error('«مطبّق» مفعّل قبل التصدير');
    await page.click('[data-testid=export-all]');
    await page.waitForSelector('[data-testid=export-text]', { timeout: 6000 });
    const txt = (await page.locator('[data-testid=export-text]').textContent()) ?? '';
    if (!/لم يُطبَّق شيء/.test(txt) || !/1\. تعديل/.test(txt) || !/2\. تعديل/.test(txt)) throw new Error('نص التصدير');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 6000 }), page.click('[data-testid=dl-json]')]);
    const body = JSON.parse(readFileSync(await dl.path(), 'utf8'));
    if (body.kind !== 'siro.calendar.proposals' || body.count !== 2 || body.writer !== 'rashed' || body.requires_separate_run !== true) throw new Error('JSON التصدير');
    await page.waitForFunction(() => !document.querySelector('[data-testid=mark-applied]:disabled'), null, { timeout: 6000 });
    await page.locator('[data-testid=mark-applied]').first().click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=proposal][data-status=applied]').length === 1, null, { timeout: 6000 });
    await shot(page, 'proposals');
    // لا كتابة في Outlook: اللقطة كما هي (7 أحداث… يوم 16)
    const v = await capi('GET', '/view?from=2026-11-16&to=2026-11-16&source=import');
    if (v.events.length !== 6 || v.events.some((e) => e.description)) throw new Error('تغيّرت أحداث Outlook!');
    await capi('DELETE', '/import');
    await kapi('DELETE', '/plan/2026-11-16');
    return 'اقتراحان بالقالب الحرفي ← اعتماد ← تصدير JSON+نص ← مطبّق بعد التصدير؛ أحداث Outlook لم تتغير';
  });
  await run('اليوم: بطاقة «وجبات اليوم + حالة القانون» تظهر بيوم محفوظ وتختفي إن أُغلق المطبخ', 'desktop', async (page) => {
    const t = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    await kapi('DELETE', `/plan/${t}`); // VS-1 يحفظ يوم اليوم؛ نبدأ بلا خطة
    await ready(page, '/');
    await page.waitForSelector('text=يحتاج انتباهك', { timeout: 8000 });
    if (!(await page.locator('.today-meals').count())) throw new Error('البطاقة غائبة (لا خطة اليوم)');
    if (!/لا وجبات مخطّطة اليوم/.test((await page.locator('.today-meals').textContent()) ?? '')) throw new Error('حالة بلا خطة');
    const put = await kput(t, { 'فطور': { card: 'cy-bk-03' }, 'غداء': { card: 'cy-ln-01' }, 'عشاء': { card: 'cy-dn-04' } });
    if (!put.total_kcal) throw new Error('حفظ اليوم');
    await ready(page, '/');
    await page.waitForSelector('[data-testid=today-meals]', { timeout: 8000 });
    const law = (await page.locator('[data-testid=today-law]').textContent()) ?? '';
    if (!/داخل الحدود/.test(law) || !/136\d/.test(law)) throw new Error(`حالة القانون: ${law}`);
    await shot(page, 'today-meals');
    await kapi('DELETE', `/plan/${t}`);
    const ctx = page.context();
    const p2 = await ctx.newPage();
    await p2.addInitScript(() => localStorage.setItem('platform.flags', JSON.stringify({ 'kitchen.enabled': false })));
    await p2.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await p2.waitForSelector('text=يحتاج انتباهك', { timeout: 8000 });
    await p2.waitForTimeout(500);
    if (await p2.locator('.today-meals').count()) throw new Error('البطاقة ظاهرة والمطبخ مغلق');
    await p2.close();
    return 'بلا خطة: دعوة للتخطيط؛ بخطة: 136x داخل الحدود؛ المطبخ مغلق: تختفي';
  });
  await run('CAL-4: بلا اتصال يعرض الجدول آخر لقطة موسومة «قد تكون قديمة» (CAL-24/AC-15)', 'desktop', async (page) => {
    await ready(page, '/calendar?date=2026-10-26');
    await page.waitForSelector('[data-testid=cal-event]', { timeout: 8000 });
    const before = await page.locator('[data-testid=cal-event]').count();
    await page.context().setOffline(true);
    await page.click('button:has-text("تحديث")');
    await page.waitForFunction(() => /لا اتصال، لقطة محفوظة/.test(document.querySelector('[data-testid=cal-source]')?.textContent ?? ''), null, { timeout: 8000 });
    const after = await page.locator('[data-testid=cal-event]').count();
    if (after !== before || !before) throw new Error(`اللقطة المحلية ناقصة: ${before} ← ${after}`);
    await page.context().setOffline(false);
    return `بلا اتصال: ${after} حدثًا من اللقطة بوسم «قد تكون قديمة»`;
  });
  await run('CAL-3: الجدول على الجوال بلا تمرير أفقي للصفحة', 'mobile', async (page) => {
    await ready(page, '/calendar?date=2026-10-26');
    await page.waitForSelector('[data-testid=cal18]', { timeout: 8000 });
    for (const v of ['day', 'week', 'month', 'list']) {
      await page.goto(`${base}/calendar?view=${v}&date=2026-10-26`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid=cal18]', { timeout: 8000 });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ov > 1) throw new Error(`تمرير أفقي ${ov}px في ${v}`);
    }
    return 'يومي/أسبوعي/شهري/قائمة بلا تمرير أفقي';
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
  const space = (await api('/api/wos/spaces'))[0]?.id ?? (await post('/api/wos/spaces', { template_id: 'tasks' })).id;
  const ids = { ':sem': sem, ':course': course, ':file': file, ':yt': yt, ':space': space };
  const fill = (p) => Object.entries(ids).reduce((s, [k, v]) => s.replace(k, v), p);

  const routesFile = JSON.parse(readFileSync(join(root, 'scripts', 'smoke-routes.json'), 'utf8'));
  const routes = SCN ? [] : routesFile.routes.filter((r) => !ONLY || r.includes(ONLY));
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
        if (!is404 && !entries.has(target.split('?')[0]) && !info.crumbs) note(lvl, where, 'لا فتات خبز');
        if (info.bottomBar !== (vp.width <= 960)) note(lvl, where, `الشريط السفلي ${info.bottomBar ? 'ظاهر' : 'مخفي'}`);
        if (isRedirect && info.path.split('?')[0] !== fill(redirects[raw]).split('?')[0]) note('error', where, `التحويل وصل إلى ${info.path}`);
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
  if (!ONLY || SCN) await scenarios(browser, { sem, course, fill });
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
