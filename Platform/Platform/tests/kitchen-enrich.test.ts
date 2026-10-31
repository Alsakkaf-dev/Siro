// بوابة الإثراء (K-M12): تطبيع الاستجابات، المقارنة كاقتراح لا يُطبَّق (API-21)، الذاكرة المؤقتة والسقف والمحاولتان، وعدم تسريب المفتاح (N-08). fetch وهمي — لا شبكة.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { createEnrichRouter } from '../server/enrich.js';
import { tmpDir } from './helpers.js';
import { ValidationError } from '../server/validation.js';
import { INGREDIENT_BY_SLUG, NUTRITION_PER_100G, compareToSeed, parseOffProduct, parseUsdaSearch } from '../shared/kitchen/index.js';

const eggSeed = NUTRITION_PER_100G['egg']![INGREDIENT_BY_SLUG.get('egg')!.profile]!;
const fdc = (kcal: number, extra: Record<string, unknown> = {}) => ({ foods: [{ fdcId: 748967, description: 'Egg, whole, raw, fresh', dataType: 'SR Legacy', foodNutrients: [{ nutrientNumber: '208', nutrientName: 'Energy', unitName: 'KCAL', value: kcal }, { nutrientNumber: '203', value: 12.56 }, { nutrientNumber: '205', value: 0.72 }, { nutrientNumber: '204', value: 9.51 }, { nutrientNumber: '291', value: 0 }, { nutrientNumber: '268', unitName: 'KJ', value: 599 }], ...extra }] });
const off = { status: 1, code: '9556001234567', product: { product_name: 'Cheese Slices', nutriments: { 'energy-kcal_100g': 310, proteins_100g: 18, carbohydrates_100g: 4.5, fat_100g: 24, fiber_100g: 0 } } };

describe('التطبيع والمقارنة (نقي)', () => {
  it('USDA: يقرأ الطاقة بالسعرة لا الكيلوجول ويُسقط ما ينقصه تغذية أساسية', () => {
    const h = parseUsdaSearch(fdc(143));
    expect(h[0]).toMatchObject({ id: '748967', source: 'usda', per100: { kcal: 143, protein_g: 12.56, carbs_g: 0.72, fat_g: 9.51, fiber_g: 0 } });
    expect(parseUsdaSearch({ foods: [{ fdcId: 1, description: 'ناقص', foodNutrients: [{ nutrientNumber: '208', unitName: 'KCAL', value: 100 }] }] })[0]!.per100).toBeNull();
    expect(() => parseUsdaSearch({ nope: 1 })).toThrow();
  });
  it('OFF: قيم الملصق، ومنتج غير موجود null، وأرقام سالبة/نص تُهمَل', () => {
    expect(parseOffProduct(off)).toMatchObject({ source: 'off', basis: expect.stringContaining('الملصق'), per100: { kcal: 310, fat_g: 24 } });
    expect(parseOffProduct({ status: 0 })).toBeNull();
    expect(parseOffProduct({ status: 1, product: { nutriments: { 'energy-kcal_100g': -5, proteins_100g: 'x' } } })!.per100).toBeNull();
  });
  it('المقارنة اقتراح فقط: auto_applied=false والبذرة لا تتغير، والعتبة تميّز الفرق الكبير', () => {
    const before = JSON.stringify(NUTRITION_PER_100G);
    const small = compareToSeed('egg', parseUsdaSearch(fdc(eggSeed.kcal + 2))[0]!)!;
    expect(small.auto_applied).toBe(false);
    expect(small.worth_review).toBe(false);
    const big = compareToSeed('egg', parseUsdaSearch(fdc(eggSeed.kcal + 60))[0]!)!;
    expect(big.worth_review).toBe(true);
    expect(big.deltas.find((d) => d.field === 'kcal')).toMatchObject({ seed: eggSeed.kcal, external: eggSeed.kcal + 60, diff: 60 });
    expect(JSON.stringify(NUTRITION_PER_100G)).toBe(before);
    expect(compareToSeed('nope', parseUsdaSearch(fdc(1))[0]!)).toBeNull();
  });
});

describe('البوابة /api/enrich (fetch وهمي)', () => {
  let srv: Running;
  let dir: string;
  let server: Server | undefined;
  beforeAll(async () => {
    dir = tmpDir();
    process.env['PLATFORM_NO_AUTOSCAN'] = '1';
    srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  });
  afterEach(async () => { await new Promise<void>((r) => (server ? server.close(() => r()) : r())); server = undefined; });
  afterAll(async () => { await srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

  const boot = async (env: NodeJS.ProcessEnv, f: (u: string, i: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>, sleeps: number[] = []) => {
    const app = express().use('/api/enrich', createEnrichRouter({ getDb: srv.getDb } as any, { env, fetch: f, sleep: async (ms) => { sleeps.push(ms); } }));
    app.use((err: any, _q: any, res: any, _n: any) => res.status(err instanceof ValidationError ? 400 : 500).json({ error: String(err?.message) }));
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()); });
    const b = `http://127.0.0.1:${(server!.address() as any).port}`;
    return async (u: string): Promise<{ status: number; json: any; text: string }> => { const res = await fetch(b + u); const t = await res.text(); return { status: res.status, json: t.startsWith('{') ? JSON.parse(t) : null, text: t }; };
  };
  const ok = (j: unknown) => async () => ({ ok: true, status: 200, json: async () => j });
  const reset = (): void => { srv.getDb().exec('DELETE FROM api_cache; DELETE FROM api_usage;'); };

  it('معطّلة افتراضيًا: 503 بلا أي طلب خارجي، والحالة تشرح السبب ووسم UNVERIFIED', async () => {
    reset();
    let calls = 0;
    const get = await boot({}, async () => { calls++; return { ok: true, status: 200, json: async () => ({}) }; });
    const r = await get('/api/enrich/off/barcode/9556001234567');
    expect(r.status).toBe(503);
    expect(r.json.code).toBe('enrich_disabled');
    expect(calls).toBe(0);
    const st = (await get('/api/enrich/status')).json;
    expect(st.enabled).toBe(false);
    expect(st.services.every((s: any) => s.verified === false && s.verified_note.includes('UNVERIFIED'))).toBe(true);
  });
  it('OFF بلا مفتاح: يجلب مرة ويخزّن مؤقتًا (الطلب الثاني من الذاكرة)، والمضيف/User-Agent صحيحان', async () => {
    reset();
    const seen: { url: string; ua: string }[] = [];
    const get = await boot({ SIRO_ENRICH_ENABLED: '1' }, async (u, i) => { seen.push({ url: u, ua: i.headers['User-Agent']! }); return { ok: true, status: 200, json: async () => off }; });
    const a = await get('/api/enrich/off/barcode/9556001234567');
    const b = await get('/api/enrich/off/barcode/9556001234567');
    expect([a.json.cached, b.json.cached]).toEqual([false, true]);
    expect(a.json.item.per100).toMatchObject({ kcal: 310 });
    expect(seen).toHaveLength(1);
    expect(new URL(seen[0]!.url).hostname).toBe('world.openfoodfacts.org');
    expect(seen[0]!.ua).toContain('SiroPlatform');
    expect((await get('/api/enrich/off/barcode/abc')).status).toBe(400);
  });
  it('USDA يحتاج مفتاحًا على الخادم، والمفتاح لا يظهر في أي رد أو خطأ', async () => {
    reset();
    const none = await boot({ SIRO_ENRICH_ENABLED: '1' }, ok(fdc(143)));
    expect((await none('/api/enrich/usda/search?q=egg')).json.code).toBe('no_key');
    await new Promise<void>((r) => server!.close(() => r()));
    const bodies: string[] = [];
    const get = await boot({ SIRO_ENRICH_ENABLED: '1', SIRO_USDA_KEY: 'SECRETKEY123' }, async (u) => { expect(u).toContain('api_key=SECRETKEY123'); return { ok: true, status: 200, json: async () => fdc(143) }; });
    for (const u of ['/api/enrich/usda/search?q=egg', '/api/enrich/status', '/api/enrich/compare/egg', '/api/enrich/usda/search?q=x']) bodies.push((await get(u)).text);
    expect(bodies.join('\n')).not.toContain('SECRETKEY123');
  });
  it('السقف اليومي المحلي: الثالث 429 بعد سقف 2، والمخزَّن ما زال يُخدَم', async () => {
    reset();
    let calls = 0;
    const get = await boot({ SIRO_ENRICH_ENABLED: '1', SIRO_OFF_DAILY_CAP: '2' }, async () => { calls++; return { ok: true, status: 200, json: async () => off }; });
    expect((await get('/api/enrich/off/barcode/11111111')).status).toBe(200);
    expect((await get('/api/enrich/off/barcode/22222222')).status).toBe(200);
    const third = await get('/api/enrich/off/barcode/33333333');
    expect(third.status).toBe(429);
    expect(third.json.code).toBe('cap_reached');
    expect((await get('/api/enrich/off/barcode/11111111')).json.cached).toBe(true);
    expect(calls).toBe(2);
    expect((await get('/api/enrich/status')).json.services.find((s: any) => s.id === 'off')).toMatchObject({ used_today: 2, cap: 2 });
  });
  it('محاولتان بتراجع 250ms ثم فشل صامت نحو البذرة (502) بلا ثالثة', async () => {
    reset();
    let n = 0;
    const sleeps: number[] = [];
    const get = await boot({ SIRO_ENRICH_ENABLED: '1' }, async () => { n++; return n === 1 ? { ok: false, status: 503, json: async () => ({}) } : { ok: true, status: 200, json: async () => off }; }, sleeps);
    expect((await get('/api/enrich/off/barcode/44444444')).status).toBe(200);
    expect(n).toBe(2);
    expect(sleeps).toEqual([250]);
    reset();
    n = 0;
    const get2 = await boot({ SIRO_ENRICH_ENABLED: '1' }, async () => { n++; return { ok: false, status: 500, json: async () => ({}) }; });
    const r = await get2('/api/enrich/off/barcode/55555555');
    expect(r.status).toBe(502);
    expect(r.json.code).toBe('upstream_failed');
    expect(r.json.error).toContain('البذرة المحلية');
    expect(n).toBe(2);
  });
  it('استجابة بشكل غير متوقع تُرفض (SEC-04)، ومنتج غير موجود 404', async () => {
    reset();
    const bad = await boot({ SIRO_ENRICH_ENABLED: '1', SIRO_USDA_KEY: 'k' }, ok({ weird: true }));
    expect((await bad('/api/enrich/usda/search?q=egg')).json.code).toBe('bad_upstream');
    await new Promise<void>((r) => server!.close(() => r()));
    reset();
    const nf = await boot({ SIRO_ENRICH_ENABLED: '1' }, ok({ status: 0 }));
    expect((await nf('/api/enrich/off/barcode/66666666')).status).toBe(404);
  });
  it('المقارنة: اقتراح بلا تطبيق، ومكوّن خارج القائمة المقفلة يُرفض (AC-11/N-01)', async () => {
    reset();
    const get = await boot({ SIRO_ENRICH_ENABLED: '1', SIRO_USDA_KEY: 'k' }, ok(fdc(eggSeed.kcal + 60)));
    const r = (await get('/api/enrich/compare/egg')).json;
    expect(r.suggestion).toMatchObject({ ingredient: 'egg', auto_applied: false, worth_review: true });
    expect(r.note).toContain('لا تتغير إلا بقرارك');
    expect((await get('/api/enrich/compare/quinoa')).status).toBe(400);
  });
  it('لا مفاتيح ولا أسماء متغيرات الخادم في شيفرة الواجهة (N-08)', () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [path.join(d, e.name)] : []));
    for (const f of walk(path.join(__dirname, '..', 'web', 'src'))) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/SIRO_(USDA|GRAPH|OFF|ENRICH)|api_key=/);
  });
});
