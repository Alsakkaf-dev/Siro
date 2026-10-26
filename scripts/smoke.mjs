// اختبار دخان: يشغّل الخادم على منفذ مؤقت وبيانات مؤقتة ويتحقق من أهم المسارات. الاستخدام: npm run smoke
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4300 + Math.floor(Math.random() * 90);
const tmp = mkdtempSync(join(tmpdir(), 'platform-smoke-'));
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
let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${cond ? '' : '  ' + extra}`);
};
const get = async (p, opt = {}) => {
  const r = await fetch(base + p, opt);
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch { /* ليس JSON */ }
  return { r, t, j };
};

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/api/health')).ok) break; } catch { /* لم يبدأ بعد */ }
    await sleep(250);
  }
  console.log(`smoke → ${base}`);
  const h = await get('/api/health');
  ok('GET /api/health', h.j?.ok === true, h.t);
  ok('sqlite driver', ['better-sqlite3', 'node:sqlite'].includes(h.j?.driver), String(h.j?.driver));
  const s = await get('/api/semesters');
  ok('seeded SEM 5 (6 courses, 52 assessments)', s.j?.[0]?.code === 'SEM 5' && s.j[0].course_count === 6 && s.j[0].assessment_count === 52, JSON.stringify(s.j?.[0]));
  const b = await get('/api/semesters/sem5');
  const sums = b.j.courses.map((c) => b.j.assessments.filter((a) => a.course_id === c.id).reduce((x, a) => x + a.weight, 0));
  ok('each course weights = 100 (French has none)', sums.filter((x) => x === 100).length === 5 && sums.filter((x) => x === 0).length === 1, sums.join(','));
  ok('search «كويز»', (await get('/api/search?q=' + encodeURIComponent('كويز'))).j.length > 3);
  ok('search «SCSE3203»', (await get('/api/search?q=SCSE3203')).j.length > 5);
  ok('export has semesters/courses/assessments', (await get('/api/export')).j?.assessments?.length === 47);
  const idx = await get('/');
  ok('GET / serves the app', idx.t.includes('<div id="root">') && idx.r.headers.get('content-security-policy'), 'dist/web missing? run: npm run build');
  const spa = await get('/academic/s/sem5/courses');
  ok('SPA fallback', spa.r.status === 200 && spa.t.includes('<div id="root">'));
  const js = /\/assets\/index-[^"]+\.js/.exec(idx.t)?.[0];
  const asset = await get(js, { headers: { 'Accept-Encoding': 'br' } });
  ok('hashed asset: immutable cache', /immutable/.test(asset.r.headers.get('cache-control') ?? ''));
  ok('hashed asset: brotli', asset.r.headers.get('content-encoding') === 'br');
  const bad = await new Promise((res) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/api/health', headers: { Host: 'evil.example' } }, (r) => { r.resume(); res(r.statusCode); });
    req.on('error', () => res(0));
    req.end();
  });
  ok('foreign Host header → 403', bad === 403, String(bad));
  const v = await get('/api/semesters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '' }) });
  ok('validation error → 400 with fields', v.r.status === 400 && v.j?.fields?.code, v.t);

  // ── المكتبة ──
  const st0 = await get('/api/library/status');
  ok('library status: root exists', st0.j?.root_exists === true && st0.j.root === libRoot, st0.t);
  const sc = await get('/api/library/scan?wait=1', { method: 'POST' });
  ok('library scan: 10 files (hidden/node_modules/temp skipped)', sc.j?.result?.scanned === 10 && sc.j.result.added === 10, sc.t);
  const li = await get('/api/library/items?limit=50');
  ok('library items + facets', li.j?.total === 10 && li.j.facets.sem.some((f) => f.value === 'SEM 5'), li.t.slice(0, 200));
  const pdf = li.j.items.find((i) => i.title === 'Lecture 1 Intro.pdf');
  const rawPdf = await get(`/api/library/files/${pdf.id}/raw`);
  ok('raw pdf: application/pdf + sandbox CSP', rawPdf.r.headers.get('content-type') === 'application/pdf' && /sandbox/.test(rawPdf.r.headers.get('content-security-policy') ?? ''), String(rawPdf.r.headers.get('content-type')));
  const mp4 = li.j.items.find((i) => i.title === 'clip.mp4');
  const rng = await fetch(`${base}/api/library/files/${mp4.id}/raw`, { headers: { Range: 'bytes=0-99' } });
  ok('raw video: Range → 206', rng.status === 206 && (await rng.arrayBuffer()).byteLength === 100, String(rng.status));
  const trav = await get('/api/library/files/..%2F..%2Fetc%2Fpasswd/raw');
  ok('raw: bad id → 404', trav.r.status === 404, String(trav.r.status));
  const worker = readdirSync(join(root, 'dist', 'web', 'assets')).find((f) => /^pdf\.worker\.min-.*\.mjs$/.test(f));
  const workerUrl = worker ? '/assets/' + worker : null;
  ok('pdf worker bundled as asset', !!worker);
  if (workerUrl) {
    const w = await fetch(base + workerUrl);
    ok('pdf worker served as javascript', /javascript/.test(w.headers.get('content-type') ?? '') && w.status === 200, w.headers.get('content-type') ?? '');
  }
  const fonts = await fetch(base + '/pdfjs/standard_fonts/FoxitSerif.pfb');
  ok('pdfjs standard fonts served locally', fonts.status === 200, String(fonts.status));
  const ytAdd = await get('/api/library/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'smoke' }) });
  ok('youtube add', ytAdd.r.status === 201 && ytAdd.j?.video_id === 'dQw4w9WgXcQ', ytAdd.t);
  const ytBad = await get('/api/library/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://evil.example/watch?v=dQw4w9WgXcQ' }) });
  ok('youtube: non-YouTube url rejected', ytBad.r.status === 400 || ytBad.r.status === 422, String(ytBad.r.status));
  const ytDel = await get(`/api/library/youtube/${ytAdd.j.id}`, { method: 'DELETE' });
  ok('youtube delete (record only)', ytDel.j?.ok === true, ytDel.t);
  ok('files untouched by scan', (await get('/api/library/items?limit=50')).j.total === 10);
  const ls = await get('/api/life/status');
  ok('life status: 6 files, all fresh, commands dir', ls.j?.files?.length === 6 && ls.j.worst === 'fresh' && ls.j.commands_dir === true, ls.t.slice(0, 200));
  const lf = await get('/api/life/data/finance');
  ok('life finance data served read-only', lf.j?.data?.balances_block?.items?.length === 4 && lf.j.status.state === 'fresh', lf.t.slice(0, 200));
  ok('life unknown file / traversal rejected', (await get('/api/life/data/exports_meta')).r.status === 404 && (await get('/api/life/docs/..%2Ffinance.json')).r.status === 404);
  const post = (b) => get('/api/life/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  const cmd = { type: 'log_prayer', payload: { date: '2026-10-26', prayer: 'fajr', status: 'late', kind: 'qada' } };
  ok('life command refused without explicit confirm', (await post(cmd)).r.status === 400);
  const made = await post({ ...cmd, confirm: true });
  ok('life command draft saved as a new pending file', made.r.status === 201 && made.j.command.status === 'pending' && readdirSync(join(lifeRoot, 'commands')).includes(made.j.file), made.t.slice(0, 200));
  const meta = JSON.parse(readFileSync(join(lifeRoot, 'exports_meta.json'), 'utf8'));
  ok('life exports not modified (sizes match exports_meta)', meta.files.every((f) => readFileSync(join(lifeRoot, f.name)).length === f.bytes));
  const cj = (m, b) => ({ method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  const ce = await get('/api/life/content/SPORTS_EXERCISES.json');
  ok('sports content served (whitelisted, fresh)', ce.j?.data?.exercises?.length === 6 && ce.j.status.state === 'fresh', ce.t.slice(0, 160));
  ok('sports content: unknown name rejected', (await get('/api/life/content/finance.json')).r.status === 404);
  const w1 = await get('/api/sports/workouts', cj('POST', { name: 'smoke', items: [{ exercise_id: 'push_up', en_name: 'Push-Up', ar_name: 'ضغط', sets: 3, reps_min: 8, reps_max: 12 }] }));
  ok('sports: workout saved in site DB', w1.r.status === 201 && w1.j.items.length === 1, w1.t.slice(0, 160));
  ok('sports: bad item rejected with field errors', (await get('/api/sports/workouts', cj('POST', { name: 'x', items: [{ exercise_id: 'push_up', en_name: 'a', ar_name: 'b', sets: 0 }] }))).r.status === 400);
  ok('sports: assign weekday + read back', (await get('/api/sports/week', cj('PUT', { day: 'sat', workout_id: w1.j.id }))).j?.week?.sat === w1.j.id);
  ok('sports: delete workout clears week', (await get(`/api/sports/workouts/${w1.j.id}`, { method: 'DELETE' })).j?.ok === true && (await get('/api/sports/mine')).j.week.sat === null);
  ok('sports: nothing written into Rashed folder', !readdirSync(join(lifeRoot, 'commands')).some((f) => /sport|workout/i.test(f)));
} catch (e) {
  fail++;
  console.log('  ✗ exception', e);
} finally {
  child.kill();
  await sleep(300);
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${fail ? 'FAILED' : 'OK'} — ${pass} passed, ${fail} failed`);
if (fail) console.log(log);
process.exit(fail ? 1 : 0);
