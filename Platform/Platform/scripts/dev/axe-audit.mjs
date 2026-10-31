// فحص الوصول TST-10: يشغّل axe-core على كل مسارات smoke-routes.json بعرضَي 1280/390 على خادم مؤقت.
// axe-core ليس اعتمادية للمشروع عمدًا: ثبّته خارج المستودع ومرّر مساره:  AXE_CORE_PATH=/path/to/node_modules/axe-core/axe.min.js node scripts/dev/axe-audit.mjs
// يفشل (exit 1) عند أي مخالفة critical/serious؛ moderate/minor تُطبع فقط.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AXE = process.env.AXE_CORE_PATH;
if (!AXE || !existsSync(AXE)) { console.log('axe-audit: تخطّي — عيّن AXE_CORE_PATH إلى axe.min.js'); process.exit(0); }
const pw = createRequire(import.meta.url)('playwright');
const tmp = mkdtempSync(join(tmpdir(), 'platform-axe-'));
const { buildLibraryFixture } = await import(pathToFileURL(join(root, 'scripts', 'lib-fixture.mjs')).href);
const { buildLifeFixture } = await import(pathToFileURL(join(root, 'scripts', 'life-fixture.mjs')).href);
const port = 4700 + Math.floor(Math.random() * 90);
const env = { ...process.env, PLATFORM_PORT: String(port), PLATFORM_DATA_DIR: join(tmp, 'data'), PLATFORM_BACKUPS_DIR: join(tmp, 'b'), PLATFORM_LIBRARY_ROOT: await buildLibraryFixture(join(tmp, 'lib')), PLATFORM_LIFE_ROOT: buildLifeFixture(join(tmp, 'rashed'), { balanceHistory: 'v4' }), PLATFORM_NO_AUTOSCAN: '1' };
const child = spawn(process.execPath, ['server'], { cwd: root, env, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* بدء */ } await new Promise((r) => setTimeout(r, 250)); }
const api = async (p) => (await fetch(base + p)).json();
const sem = (await api('/api/semesters'))[0].id;
const course = (await api(`/api/semesters/${sem}`)).courses[0].id;
await fetch(base + '/api/library/scan?wait=1', { method: 'POST' });
const items = (await api('/api/library/items?limit=50')).items;
const file = (items.find((i) => /\.pdf$/i.test(i.title)) ?? items[0]).id;
const yt = (await (await fetch(base + '/api/library/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'axe' }) })).json()).id;
const ids = { ':sem': sem, ':course': course, ':file': file, ':yt': yt };
const routes = JSON.parse(readFileSync(join(root, 'scripts', 'smoke-routes.json'), 'utf8')).routes.filter((r) => r !== '/no-such-page' && !/cook/.test(r));
const axeSrc = readFileSync(AXE, 'utf8');
const browser = await pw.chromium.launch();
const bad = [];
const soft = new Map();
let n = 0;
for (const vp of [{ w: 1280, h: 800 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, locale: 'ar', bypassCSP: true }); // حقن axe فقط: CSP الصارمة تمنع السكربت المضمّن
  for (const raw of routes) {
    const url = Object.entries(ids).reduce((s, [k, v]) => s.replace(k, v), raw);
    const page = await ctx.newPage();
    try {
      await page.goto(base + url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#main h1', { timeout: 8000 }).catch(() => undefined);
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
      await page.waitForTimeout(250);
      await page.addScriptTag({ content: axeSrc });
      const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, t: v.nodes[0].target.join(' ') })));
      n++;
      for (const v of res) {
        if (v.impact === 'critical' || v.impact === 'serious') bad.push(`${vp.w} ${raw}: ${v.id} (${v.impact}) ×${v.n} — ${v.help} — ${v.t}`);
        else soft.set(v.id, (soft.get(v.id) ?? 0) + 1);
      }
    } catch (e) { bad.push(`${vp.w} ${raw}: استثناء ${String(e.message).split('\n')[0]}`); } finally { await page.close(); }
  }
  await ctx.close();
}
await browser.close();
child.kill();
console.log(`axe-audit: ${n} صفحة×عرض فُحصت (WCAG 2.1 A/AA) — حاسمة/خطيرة: ${bad.length}`);
for (const b of bad) console.log('  ✗', b);
for (const [id, c] of soft) console.log(`  · ${id} (متوسطة/طفيفة) في ${c} صفحة`);
writeFileSync(join(tmp, 'axe.json'), JSON.stringify({ bad, soft: [...soft] }));
process.exit(bad.length ? 1 : 0);
