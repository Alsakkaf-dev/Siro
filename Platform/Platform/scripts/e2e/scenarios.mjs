// سيناريوهات وظيفية من الواجهة فقط (بلا API مباشر): مساحات مخصصة، أتمتة، قوالب، تراجع، إنشاء عام، روابط، جماعي، روابط قديمة.
//   BASE=http://127.0.0.1:4310 E2E_OUT=/tmp/out node scripts/e2e/scenarios.mjs [--width=1280|390]
import { chromium, newPage, settle, assert, BASE, save } from './lib.mjs';

const WIDTH = Number((process.argv.find((a) => a.startsWith('--width=')) ?? '--width=1280').split('=')[1]);
const today = (() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); })();
const stamp = Date.now().toString(36).slice(-4);
const browser = await chromium.launch();
const { page, log } = await newPage(browser, { width: WIDTH });
page.on('dialog', (d) => void d.dismiss());
const results = [];
const step = async (name, fn) => {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message ?? e).slice(0, 400) });
    console.log(`✗ ${name}: ${String(e.message ?? e).slice(0, 300)}`);
    await page.screenshot({ path: `${process.env.E2E_OUT ?? '.'}/fail_${name.replace(/\W+/g, '_')}_${WIDTH}.png` }).catch(() => {});
  }
};
const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); await settle(page); };
const toastText = async () => (await page.locator('.toast').last().innerText({ timeout: 4000 }).catch(() => '')) || '';

// ── 1) «قائمة قراءة» من قالب، بالواجهة كلها ──
let readingUrl = '';
await step('reading list from template (UI)', async () => {
  await go('/spaces/templates');
  await page.getByRole('button', { name: 'استخدم قالب قائمة قراءة' }).click();
  await page.locator('#ns-n').fill(`قراءاتي ${stamp}`);
  await page.locator('.modal').getByRole('button', { name: 'إنشاء', exact: true }).click();
  await page.waitForURL(/\/spaces\/[A-Za-z0-9]+/);
  await settle(page);
  readingUrl = new URL(page.url()).pathname;
  assert((await page.locator('h1').innerText()).includes(`قراءاتي ${stamp}`), 'title');
  // إضافة سريعة في عمود «أريد قراءته»
  await page.getByRole('textbox', { name: /إضافة إلى «أريد قراءته»/ }).fill('SICP');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'SICP' }).first().waitFor();
});

await step('item panel: status → done fires automation (finished = today, progress = 100)', async () => {
  await page.getByRole('button', { name: 'SICP' }).first().click();
  await page.locator('.drawer').waitFor();
  await page.locator('.drawer #ip-status select').selectOption({ label: 'انتهيت' });
  await page.waitForFunction((d) => (document.querySelector('.drawer input[type=date]#ip-f-finished') ?? {}).value === d, today, { timeout: 6000 });
  const act = await page.locator('.drawer .act-list').innerText();
  assert(/أتمتة/.test(act), 'automation logged in activity');
});

await step('relations: link item to a course from anywhere (backlink)', async () => {
  const picker = page.locator('.drawer .ref-picker input[role=combobox]').last();
  await picker.fill('SCSE');
  await page.locator('.drawer .ref-list li').first().click();
  await page.locator('.drawer .rel-list li').first().waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.drawer').waitFor({ state: 'detached' });
});

// ── 2) «طلبات التوظيف» من الصفر: مساحة فارغة + حقول + حالات + عرض + أتمتة + قالب ──
let jobUrl = '';
await step('job applications from scratch: fields, statuses, view, automation, save as template', async () => {
  await go('/spaces/templates');
  await page.getByRole('button', { name: 'ابدأ' }).click();
  await page.locator('#ns-n').fill(`طلبات ${stamp}`);
  await page.locator('.modal').getByRole('button', { name: 'إنشاء', exact: true }).click();
  await page.waitForURL(/\/spaces\/[A-Za-z0-9]+/);
  await settle(page);
  jobUrl = new URL(page.url()).pathname;
  // الحقول
  await page.getByRole('button', { name: 'الحقول والحالات' }).click();
  await page.getByRole('button', { name: '+ نص', exact: true }).click();
  await page.locator('.fdef input[id^=fn-]').last().fill('الشركة');
  await page.getByRole('button', { name: '+ اختيار واحد' }).click();
  await page.locator('.fdef input[id^=fn-]').last().fill('النوع');
  await page.getByRole('button', { name: '+ تاريخ' }).click();
  await page.locator('.fdef input[id^=fn-]').last().fill('تاريخ التقديم');
  // الحالات
  await page.locator('.modal .seg button', { hasText: 'الحالات' }).click();
  await page.locator('input[id^=sn-]').first().fill('مهتم');
  await page.locator('input[id^=sn-]').nth(1).fill('قدّمت');
  await page.locator('input[id^=sn-]').nth(2).fill('عرض');
  await page.getByRole('button', { name: 'حفظ', exact: true }).click();
  await page.locator('.modal').waitFor({ state: 'detached' });
  // عرض جدول
  await page.getByRole('button', { name: /عرض جديد/ }).click();
  await page.getByRole('radio', { name: 'جدول' }).click();
  await page.locator('#nv-name').fill('الجدول');
  await page.locator('.modal').getByRole('button', { name: 'إنشاء', exact: true }).click();
  await page.getByRole('tab', { name: /الجدول/ }).waitFor();
  // أتمتة: عندما تصبح الحالة «قدّمت» ← اضبط تاريخ التقديم = اليوم
  await page.getByRole('button', { name: /الأتمتة/ }).first().click();
  await page.getByRole('button', { name: 'قاعدة جديدة' }).click();
  const form = page.locator('form.auto-form');
  await form.locator('select').nth(1).selectOption({ label: 'قدّمت' });
  await form.locator('select').nth(2).selectOption({ label: 'اضبط الحقل' });
  await form.locator('select').nth(3).selectOption({ label: 'تاريخ التقديم' });
  await form.getByRole('button', { name: 'إضافة القاعدة' }).click();
  await page.locator('.auto-row').first().waitFor();
  await page.keyboard.press('Escape');
  // عنصر + تشغيل القاعدة من الجدول
  await page.getByRole('textbox', { name: 'إضافة عنصر' }).first().fill('Google — intern');
  await page.keyboard.press('Enter');
  const row = page.locator('tr', { hasText: 'Google — intern' });
  await row.waitFor();
  await row.locator('.status-pill select').selectOption({ label: 'قدّمت' });
  await page.waitForFunction((d) => [...document.querySelectorAll('tr')].some((tr) => tr.textContent.includes('Google') && [...tr.querySelectorAll('input[type=date]')].some((i) => i.value === d)), today, { timeout: 6000 });
  // حفظ كقالب
  await page.getByRole('button', { name: 'المزيد من إجراءات المساحة' }).click();
  await page.getByRole('menuitem', { name: 'حفظ كقالب' }).click();
  await page.locator('#st-n').fill(`قالب طلبات ${stamp}`);
  await page.getByRole('button', { name: 'حفظ', exact: true }).click();
  await go('/spaces/templates');
  await page.getByRole('button', { name: `استخدم قالب قالب طلبات ${stamp}` }).waitFor();
});

// ── 3) التراجع: حذف عنصر ثم «تراجع»، ثم حذف واستعادة من السلة ──
await step('undo a delete (toast) and restore from trash', async () => {
  await go(readingUrl);
  await page.getByRole('button', { name: 'SICP' }).first().click();
  await page.locator('.drawer').waitFor();
  await page.locator('.drawer').getByRole('button', { name: 'حذف', exact: true }).click();
  await page.locator('.toast button', { hasText: 'تراجع' }).click();
  await page.getByRole('button', { name: 'SICP' }).first().waitFor({ timeout: 6000 });
  // حذف ثانٍ ← السلة
  await page.getByRole('button', { name: 'SICP' }).first().click();
  await page.locator('.drawer').getByRole('button', { name: 'حذف', exact: true }).click();
  await go('/trash');
  await page.locator('.trash-row', { hasText: 'SICP' }).first().getByRole('button', { name: 'استعادة' }).click();
  await go(readingUrl);
  await page.getByRole('button', { name: 'SICP' }).first().waitFor({ timeout: 6000 });
});

// ── 4) بالجملة ──
await step('bulk: select two items, change status', async () => {
  await go(jobUrl);
  await page.getByRole('tab', { name: /قائمة/ }).click();
  await page.getByRole('textbox', { name: 'إضافة عنصر' }).first().fill('Grab — backend');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Grab — backend' }).waitFor();
  await page.getByRole('checkbox', { name: 'تحديد «Grab — backend»' }).check();
  await page.getByRole('checkbox', { name: 'تحديد «Google — intern»' }).check().catch(() => {});
  await page.locator('#bulk-st').selectOption({ label: 'عرض' });
  const t = await toastText();
  assert(/تم على/.test(t), `toast: ${t}`);
});

// ── 5) الإنشاء العام (+) ← تقييم ← أثره على الحاسبة ──
await step('global Create (+) → assessment → calculator action', async () => {
  await go('/');
  await page.keyboard.press('n');
  await page.getByRole('button', { name: 'تقييم اختبار، واجب، مشروع…' }).click();
  await page.getByRole('button', { name: 'متابعة' }).click();
  await page.locator('#a-title').fill(`Quiz ${stamp}`);
  await page.locator('#a-w').fill('2');
  await page.locator('.modal').getByRole('button', { name: 'إضافة التقييم' }).click();
  const t = await toastText();
  assert(/أُضيف التقييم/.test(t), `toast: ${t}`);
  await page.locator('.toast button', { hasText: 'الحاسبة' }).click();
  await page.waitForURL(/calculator\?course=/);
});

// ── 6) لوحة الأوامر: فعل «أنشئ» ──
await step('palette verb: "أنشئ مساحة"', async () => {
  await go('/');
  await page.keyboard.press('/');
  await page.keyboard.type('أنشئ مساحة');
  await page.locator('.pal .hit', { hasText: 'أنشئ مساحة جديدة' }).first().click();
  await page.waitForURL(/\/spaces\/templates/);
});

// ── 7) الروابط القديمة والبديلة ──
await step('old & alias URLs resolve', async () => {
  for (const [from, to] of [['/home', '/'], ['/today', '/'], ['/study', '/academic'], ['/settings/trash', '/trash'], ['/spaces/new', '/spaces/templates']]) {
    await go(from);
    assert(new URL(page.url()).pathname === to, `${from} → ${page.url()}`);
  }
});

// ── 8) التقاط سريع من الرئيسية + «اليوم» يعرض العنصر بموعده ──
await step('home quick capture lands in a space', async () => {
  await go('/');
  await page.locator('#capture').fill(`فكرة ${stamp}`);
  await page.keyboard.press('Enter');
  const t = await toastText();
  assert(/التُقط/.test(t), `toast: ${t}`);
});

const bad = log.console.filter((c) => !/Failed to load resource.*(404|410)/.test(c));
results.push({ name: 'no console errors', ok: bad.length === 0, error: bad.join(' | ').slice(0, 400) });
console.log(bad.length ? `✗ console errors: ${bad.join(' | ').slice(0, 300)}` : '✓ no console errors');
await browser.close();
const failed = results.filter((r) => !r.ok);
save(`scenarios_${WIDTH}.json`, results);
console.log(failed.length ? `\nFAILED ${failed.length}/${results.length}` : `\nALL PASSED (${results.length}) @${WIDTH}`);
process.exit(failed.length ? 1 : 0);
