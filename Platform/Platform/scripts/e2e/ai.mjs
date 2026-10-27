// سيناريوهات نواة الذكاء من الواجهة فقط (مع fake-qwen.mjs على 11434):
//   node scripts/e2e/fake-qwen.mjs & BASE=http://127.0.0.1:4310 node scripts/e2e/ai.mjs [--width=1280|390]
import { chromium, newPage, settle, assert, BASE, save, axe } from './lib.mjs';

const WIDTH = Number((process.argv.find((a) => a.startsWith('--width=')) ?? '--width=1280').split('=')[1]);
const browser = await chromium.launch();
const { page, log } = await newPage(browser, { width: WIDTH });
const results = [];
const step = async (name, fn) => {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`✓ ${name} (${Date.now() - t0}ms)`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message ?? e).slice(0, 400) });
    console.log(`✗ ${name}: ${String(e.message ?? e).slice(0, 300)}`);
    await page.screenshot({ path: `${process.env.E2E_OUT ?? '.'}/fail_ai_${name.replace(/\W+/g, '_')}_${WIDTH}.png` }).catch(() => {});
  }
};
const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); await settle(page); };
const panel = () => page.locator('.ai-panel');
const ask = async (text) => {
  await panel().locator('#ai-input').fill(text);
  await panel().locator('#ai-input').press('Enter');
};
const j = async (u) => (await fetch(BASE + u)).json();

// تأكد أن Ollama الوهمي هو الأول والسياسة «معاينة»
const st = await j('/api/ai/status');
await fetch(BASE + '/api/ai/config', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...st.config, policy: 'ask', providers: st.config.providers.filter((p) => !p.env).map(({ has_key, needs_key, usable, why, ...p }) => p) }) });

await step('Ctrl+J opens the panel with provider + contextual suggestions; axe clean', async () => {
  await go('/');
  await page.keyboard.press('Control+j');
  await panel().waitFor();
  await page.waitForFunction(() => /qwen3\.5:4b/.test(document.querySelector('.ai-prov')?.textContent ?? ''), null, { timeout: 8000 });
  assert(await panel().locator('.ai-sug').count() >= 3, 'suggestions');
  const { violations } = await axe(page);
  assert(violations.length === 0, `axe: ${JSON.stringify(violations)}`);
});

await step('read tool + streamed answer: «موجز» → agenda chip → bullet answer', async () => {
  await ask('أعطني موجز اليوم');
  await panel().locator('.ai-tool-chip').filter({ hasText: 'الأجندة' }).waitFor({ timeout: 8000 });
  await panel().locator('.ai-msg.bot').filter({ hasText: 'قادم هذا الأسبوع' }).waitFor({ timeout: 8000 });
});

let asmtId = '';
await step('write tool: preview → نفّذ → assessment exists, tagged actor=ai → تراجع removes it', async () => {
  const sems = await j('/api/semesters');
  const sem = sems.find((s) => s.is_active) ?? sems[0];
  const before = (await j(`/api/semesters/${sem.id}`)).assessments.length;
  await ask('أضف كويز للمادة الأولى الخميس بوزن 5%');
  const card = panel().locator('.ai-card.st-awaiting');
  await card.waitFor({ timeout: 8000 });
  assert((await card.innerText()).includes('كويز المساعد'), 'preview has title');
  await card.getByRole('button', { name: 'نفّذ' }).click();
  await panel().locator('.ai-card.st-done').waitFor({ timeout: 8000 });
  const b = await j(`/api/semesters/${sem.id}`);
  assert(b.assessments.length === before + 1, 'added');
  const a = b.assessments.find((x) => x.title === 'كويز المساعد');
  asmtId = a.id;
  assert(a.weight === 5 && a.timing === 'date' && a.due_date, 'fields');
  const h = await j('/api/wos/history?limit=10');
  assert(h.find((x) => x.ref === `acad:asmt:${a.id}`)?.actor === 'ai', 'actor ai');
  await panel().locator('.ai-card.st-done').getByRole('button', { name: 'تراجع' }).click();
  await panel().locator('.ai-card.st-undone').waitFor({ timeout: 8000 });
  const after = await j(`/api/semesters/${sem.id}`);
  assert(after.assessments.length === before, 'undone');
});

await step('destructive tool always asks; «لا» = nothing happens and the model is told', async () => {
  await ask('احذف المهمة القديمة');
  const card = panel().locator('.ai-card.danger.st-awaiting');
  await card.waitFor({ timeout: 8000 });
  await card.getByRole('button', { name: 'لا' }).click();
  await panel().locator('.ai-card.st-denied').waitFor({ timeout: 8000 });
  await panel().locator('.ai-msg.bot').filter({ hasText: 'لم يتم' }).waitFor({ timeout: 8000 });
});

await step('palette sentence → Enter → panel sends it (open_page navigates)', async () => {
  await panel().getByRole('button', { name: 'محادثة جديدة' }).click();
  await page.getByRole('button', { name: 'إغلاق المساعد' }).click();
  await panel().waitFor({ state: 'detached' });
  const box = page.locator('.search input').first();
  await box.click();
  await box.fill('افتح الأسبوع من فضلك');
  await page.locator('#search-pop').getByText('اطلب من المساعد').waitFor();
  await box.press('Enter');
  await panel().waitFor();
  await page.waitForURL(/\/week$/, { timeout: 8000 });
});

let spaceId = '';
await step('space builder: «صمّمها بالذكاء» → create_space → page shows the new space after نفّذ', async () => {
  await go('/spaces');
  await page.getByRole('button', { name: /صمّمها بالذكاء/ }).click();
  await panel().waitFor();
  const v = await panel().locator('#ai-input').inputValue();
  assert(v.startsWith('أنشئ مساحة'), 'prefilled');
  await panel().locator('#ai-input').fill('أنشئ مساحة لتتبع التدريب الصيفي');
  await panel().locator('#ai-input').press('Enter');
  const card = panel().locator('.ai-card.st-awaiting');
  await card.waitFor({ timeout: 8000 });
  assert((await card.innerText()).includes('الراتب'), 'preview lists fields');
  await card.getByRole('button', { name: 'نفّذ' }).click();
  await panel().locator('.ai-card.st-done').waitFor({ timeout: 8000 });
  const sp = (await j('/api/wos/spaces')).find((s) => s.name === 'تتبع التدريب');
  assert(sp, 'space exists');
  spaceId = sp.id;
  assert(sp.type.fields.some((f) => f.kind === 'currency') && sp.type.statuses.length === 3, 'type built');
  // الصفحة الحالية أعيد تحميلها: المساحة الجديدة ظاهرة
  await page.locator('.space-grid').getByText('تتبع التدريب').first().waitFor({ timeout: 8000 });
});

await step('undo all in this conversation deletes the AI-created space (to trash)', async () => {
  await panel().getByRole('button', { name: 'تراجع عن الكل' }).click();
  await page.waitForFunction(async (id) => !(await (await fetch('/api/wos/spaces')).json()).some((s) => s.id === id), spaceId, { timeout: 8000 });
});

await step('threads are saved and can be reopened', async () => {
  await panel().getByRole('button', { name: 'المحادثات السابقة' }).click();
  await panel().locator('.ai-thread').first().waitFor();
  await panel().locator('.ai-thread').first().click();
  await panel().locator('.ai-msg.user').first().waitFor();
});

await step('settings: AI card lists providers in order with the detected model', async () => {
  await go('/settings#ai');
  const c = page.locator('#ai');
  await c.getByText('Qwen على جهازي').first().waitFor();
  await c.getByText('qwen3.5:4b').first().waitFor();
  assert(await c.locator('.ai-provs > li').count() >= 5, 'providers');
});

await step('Escape closes the panel', async () => {
  await page.keyboard.press('Control+j');
  await panel().waitFor();
  await page.keyboard.press('Escape');
  await panel().waitFor({ state: 'detached' });
});

if (asmtId) {
  // تنظيف: لا شيء — التراجع أزاله
}
// Playwright يَسِم طلبات البث ذات الجسم الكبير (> ~3KB) بـ ERR_ABORTED رغم استلام الجسم كاملًا
// (مُتحقَّق: curl يُغلق التدفق نظيفًا، والصفحة تقرأ كل البايتات). نفصلها عن الإخفاقات الحقيقية.
const artifact = log.failed.filter((f) => f === 'net::ERR_ABORTED /api/ai/chat');
log.failed = log.failed.filter((f) => f !== 'net::ERR_ABORTED /api/ai/chat');
if (artifact.length) console.log(`(ignored ${artifact.length} Playwright stream-flag artifacts on /api/ai/chat)`);
const fails = results.filter((r) => !r.ok);
save(`ai_${WIDTH}.json`, { width: WIDTH, results, console: log.console, failed: log.failed });
console.log(`\n${results.length - fails.length}/${results.length} passed · console errors: ${log.console.length} · failed requests: ${log.failed.length}`);
if (log.console.length) console.log(log.console.slice(0, 5));
if (log.failed.length) console.log(log.failed.slice(0, 5));
await browser.close();
process.exit(fails.length ? 1 : 0);
