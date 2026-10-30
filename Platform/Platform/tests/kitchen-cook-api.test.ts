import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import { BOTS, Cook } from '../shared/kitchen/sim/bot.js';
import { CYCLE, ORIGINAL_RECIPES, evaluateDay, nutritionOf, planDay, sum, type RecipeLine } from '../shared/kitchen/index.js';

let srv: Running;
let base: string;
let dir: string;
const H = { 'X-Kitchen-Client': 'cook-test' };
async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...H }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}
const ops = (slug: string) => {
  const c = new Cook();
  BOTS[slug]!(c);
  return c.ops;
};
const pantry = async (): Promise<Record<string, number>> => Object.fromEntries((await call('GET', '/api/kitchen/pantry')).json.pantry.map((p: any) => [p.ingredient, p.grams]));

beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('VS-1 على الخادم: شراء → مخزن → طبخ → بطاقة (AC-05/06)', () => {
  it('الطبخ بلا مخزن يُرفض ذرّيًا (لا بطاقة ولا جلسة)', async () => {
    await call('PUT', '/api/kitchen/wallet', { budget_rm: 200, period: 'week', hard_limit: true });
    const r = await call('POST', '/api/kitchen/cook/serve', { mode: 'real', seed: 1, ops: ops('bk-03'), accept_duplicate: 'variant' });
    expect(r.status).toBe(409);
    expect(r.json.code).toBe('pantry_insufficient');
    expect((await call('GET', '/api/kitchen/cards')).json.cards).toEqual([]);
    expect(srv.getDb().get<{ n: number }>('SELECT COUNT(*) n FROM kitchen_cook_sessions')!.n).toBe(0);
  });
  it('شراء البيض والتوست والجبنة والزيت ثم الطبخ: خصم المخزن بالكميات الفعلية وبطاقة بـ532 سعرة', async () => {
    for (const [ing, qty, unit] of [['egg', 1, 'dozen'], ['toast', 1, 'loaf'], ['cheese', 1, 'pack'], ['oil', 1, 'bottle']] as const) {
      expect((await call('PUT', `/api/kitchen/cart/${ing}`, { qty, unit, store: null })).status).toBe(200);
    }
    expect((await call('POST', '/api/kitchen/checkout', { store: 'mydin' })).status).toBe(201);
    const before = await pantry();
    expect(before).toMatchObject({ egg: 720, toast: 400, cheese: 200, oil: 1840 });
    const r = await call('POST', '/api/kitchen/cook/serve', { mode: 'real', seed: 1, ops: ops('bk-03') });
    expect(r.status).toBe(409);
    expect(r.json).toMatchObject({ code: 'duplicate', slug: 'bk-03' });
    const ok = await call('POST', '/api/kitchen/cook/serve', { mode: 'real', seed: 1, ops: ops('bk-03'), accept_duplicate: 'variant' });
    expect(ok.status).toBe(201);
    const card = ok.json.card;
    expect(card.kind).toBe('variant');
    expect(card.parent_slug).toBe('bk-03');
    expect(card.nutrition.kcal).toBeGreaterThan(530);
    expect(card.nutrition.kcal).toBeLessThan(534);
    expect(card.name_ar).toBe('توست بالبيض والجبنة');
    expect(card.steps_ar[0]).toContain('اسلق 100 غرام من البيض ثماني دقائق');
    expect(card.flags).toEqual([]);
    const after = await pantry();
    expect(after['egg']).toBeCloseTo(720 - 100 / 0.88, 0);
    expect(after['toast']).toBe(320);
    expect(after['cheese']).toBe(160);
    expect(after['oil']).toBe(1835);
    expect(srv.getDb().get<{ n: number }>('SELECT COUNT(*) n FROM kitchen_cook_sessions')!.n).toBe(1);
    const moves = (await call('GET', '/api/kitchen/pantry')).json.moves.filter((m: any) => m.kind === 'consume');
    expect(moves.length).toBe(4);
  });
  it('AC-06: الخادم يعيد الحساب من السجل (لا يثق بالعميل) وتكرار السجل ينتج البطاقة نفسها', async () => {
    const o = ops('dn-04');
    for (const [ing, qty, unit] of [['egg', 1, 'dozen'], ['cheese', 1, 'pack'], ['yogurt', 1, 'tub'], ['cucumber', 0.5, 'kg']] as const) await call('PUT', `/api/kitchen/cart/${ing}`, { qty, unit, store: null });
    expect((await call('POST', '/api/kitchen/checkout', { store: 'mydin' })).status).toBe(201);
    const a = await call('POST', '/api/kitchen/cook/serve', { mode: 'sandbox', confirm_sandbox: true, seed: 1, ops: o, accept_duplicate: 'new' });
    const b = await call('POST', '/api/kitchen/cook/serve', { mode: 'sandbox', confirm_sandbox: true, seed: 1, ops: o, accept_duplicate: 'new' });
    expect(a.status).toBe(201);
    const strip = (c: any) => ({ ...c, slug: 0, created_at: 0, updated_at: 0, origin: 0 });
    expect(strip(b.json.card)).toEqual(strip(a.json.card));
    expect(a.json.card.flags).toContain('sandbox');
    expect(a.json.card.nutrition.kcal).toBeCloseTo(nutritionOf(ORIGINAL_RECIPES.find((r) => r.slug === 'dn-04')!.lines).total.kcal, 0);
  });
  it('وضع التجربة بلا تأكيد يُرفض، وسجل غير صالح يُرفض، ومكوّن خارج القائمة يُرفض', async () => {
    expect((await call('POST', '/api/kitchen/cook/serve', { mode: 'sandbox', ops: ops('bk-03'), accept_duplicate: 'new' })).json.code).toBe('sandbox_confirm');
    expect((await call('POST', '/api/kitchen/cook/serve', { ops: [{ t: 0, type: 'bogus' }] })).status).toBe(400);
    const bad = [{ t: 0, type: 'take', id: 'x1', ingredient: 'avocado', grams: 100 }, { t: 1, type: 'serve', from: ['x1'], plate: 'plate_1' }];
    const r = await call('POST', '/api/kitchen/cook/serve', { mode: 'sandbox', confirm_sandbox: true, ops: bad });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('bad_ops');
    const none = await call('POST', '/api/kitchen/cook/serve', { mode: 'sandbox', confirm_sandbox: true, ops: [{ t: 0, type: 'take', id: 'x1', ingredient: 'egg', grams: 50 }] });
    expect(none.json.code).toBe('nothing_served');
  });
  it('البطاقات الأصلية لا تُعدَّل ولا تُحذف؛ الابتكارية تُعدَّل وتُحذف؛ والنسخة المصغّرة تعيد كتابة الأوزان والخطوات', async () => {
    expect((await call('PATCH', '/api/kitchen/cards/bk-03', { name_ar: 'x' })).status).toBe(403);
    expect((await call('DELETE', '/api/kitchen/cards/bk-03')).status).toBe(403);
    const v = await call('POST', '/api/kitchen/cards/variant', { parent_slug: 'bk-03', scale: 0.5 });
    expect(v.status).toBe(201);
    expect(v.json.card.steps_ar[0]).toBe('1: اسلق 50 غراماً من البيض ثماني دقائق، ثم قشّره وقطّعه شرائح.');
    expect(v.json.card.lines.map((l: RecipeLine) => l.amount_g)).toEqual([50, 40, 20, 3]); // 2.5 غ تُقرَّب لغرام واحد (قاعدة المقسّم: خطوة 1 غ لما دون 20 غ)
    expect(v.json.card.nutrition.kcal).toBeLessThan(300);
    const orig = ORIGINAL_RECIPES.find((r) => r.slug === 'bk-03')!;
    expect(orig.steps_original[0]).toContain('100 غرام من البيض');
    expect((await call('POST', '/api/kitchen/cards/variant', { parent_slug: 'ln-02', scale: 0.5 })).json.code).toBe('blocked');
    const slug = v.json.card.slug;
    expect((await call('PATCH', `/api/kitchen/cards/${slug}`, { name_ar: 'فطوري الصغير' })).json.card.name_ar).toBe('فطوري الصغير');
    expect((await call('DELETE', `/api/kitchen/cards/${slug}`)).status).toBe(200);
    expect((await call('DELETE', `/api/kitchen/cards/${slug}`)).status).toBe(404);
  });
});

describe('الخطة وقانون السعرات حاجز صارم (AC-07، J6/J7)', () => {
  const put = (date: string, slots: Record<string, { card: string; scale?: number }>, auto = false) => call('PUT', `/api/kitchen/plan/${date}`, { slots, auto_fit: auto });
  it('J7: 532 + 794 + 572 = 1898 مرفوض برسالة المجموع والفرق وثلاثة حلول، ولا يُحفظ شيء', async () => {
    const r = await put('2026-11-02', { 'فطور': { card: 'bk-03' }, 'غداء': { card: 'ln-01' }, 'عشاء': { card: 'dn-04' } });
    expect(r.status).toBe(422);
    expect(r.json.code).toBe('law');
    expect(r.json.error).toContain('أعلى من الحد الأعلى 1500');
    expect(r.json.error).toMatch(/\b39\d\b/);
    expect(r.json.total_kcal).toBeGreaterThan(1890);
    expect(r.json.solutions).toHaveLength(3);
    expect((await call('GET', '/api/kitchen/plan?from=2026-11-01&days=10')).json.days).toEqual([]);
  });
  it('J6: الملاءمة التلقائية تعيد يومًا داخل المجال بمعامل واحد، وتُحفظ خطة بنص الوصف الحرفي', async () => {
    const r = await put('2026-11-02', { 'فطور': { card: 'bk-03' }, 'غداء': { card: 'ln-01' }, 'عشاء': { card: 'dn-04' } }, true);
    expect(r.status).toBe(200);
    expect(r.json.autoFit.k).toBeLessThan(1);
    expect(r.json.total_kcal).toBeGreaterThanOrEqual(1200);
    expect(r.json.total_kcal).toBeLessThanOrEqual(1500);
    expect(r.json.status).toBe('proposal');
    const body: string = r.json.slots[0].body_text;
    expect(body.split('\n')[0]).toBe('توست بالبيض والجبنة');
    expect(body).toContain('القيمة الغذائية الإجمالية للوجبة:');
    expect(body).toMatch(/السعرات الحرارية: \d+ سعرة حرارية/);
    expect(body).not.toMatch(/[٠-٩]/);
    const saved = (await call('GET', '/api/kitchen/plan?from=2026-11-01&days=10')).json.days;
    expect(saved).toHaveLength(1);
    expect(saved[0].slots.map((s: any) => s.card_slug)).toEqual(['bk-03', 'ln-01', 'dn-04']);
  });
  it('يوم جزئي مقبول تحت الحد الأعلى ومرفوض فوقه فورًا (LAW-03)، والبطاقات المعيبة لا تُعيَّن (MC-05)', async () => {
    expect((await put('2026-11-03', { 'فطور': { card: 'bk-03' } })).json.status).toBe('partial');
    const over = await put('2026-11-03', { 'فطور': { card: 'ln-01' }, 'غداء': { card: 'ln-03' }, 'عشاء': { card: 'dn-01' } });
    expect(over.status).toBe(422);
    const high = await put('2026-11-04', { 'فطور': { card: 'ln-01', scale: 1.5 }, 'غداء': { card: 'ln-03', scale: 1.5 } });
    expect(high.status).toBe(422);
    expect(high.json.code).toBe('law');
    expect((await put('2026-11-05', { 'غداء': { card: 'ln-02' } })).json.code).toBe('blocked');
    expect((await put('2026-11-05', { 'غداء': { card: 'nope' } })).status).toBe(404);
    expect((await call('POST', '/api/kitchen/plan/preview', { slots: { 'فطور': { card: 'bk-03' }, 'غداء': { card: 'ln-01' }, 'عشاء': { card: 'dn-04' } } })).json).toMatchObject({ ok: false });
  });
  it('AC-07 (مسح نقاط الحفظ): نقطة كتابة واحدة فقط لجدول الأيام، وهي تمرّ على planDay', () => {
    const files = fs.readdirSync(path.join(__dirname, '..', 'server')).filter((f) => f.endsWith('.ts'));
    let inserts = 0;
    let updates = 0;
    let calls = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(__dirname, '..', 'server', f), 'utf8');
      inserts += (src.match(/INSERT (?:OR REPLACE )?INTO kitchen_plan_days/g) ?? []).length;
      updates += (src.match(/UPDATE kitchen_plan_days/g) ?? []).length;
      calls += (src.match(/savePlanDay\(/g) ?? []).length;
    }
    expect(inserts).toBe(1);
    expect(updates).toBe(0);
    expect(calls).toBe(3); // التعريف + مسار اليوم + مسار الدورة الدفعي (كلاهما بعد رفض القانون)
    const route = fs.readFileSync(path.join(__dirname, '..', 'server', 'kitchenCook.ts'), 'utf8');
    expect(route.indexOf('planDay(inputs')).toBeLessThan(route.indexOf('savePlanDay(d, date'));
    expect(route.slice(route.indexOf('planDay(inputs'), route.indexOf('savePlanDay(d, date'))).toContain('!plan.ok');
    // الدفعة: كل الأيام تُقيَّم بـplanDay ويُرفض الكل عند أي مخالف قبل أي حفظ
    const cyc = route.slice(route.indexOf("r.post('/plan/cycle'"));
    expect(cyc.indexOf('planDay(inputs')).toBeGreaterThan(-1);
    expect(cyc.indexOf('planDay(inputs')).toBeLessThan(cyc.indexOf('savePlanDay('));
    expect(cyc.slice(cyc.indexOf('planDay(inputs'), cyc.indexOf('savePlanDay('))).toContain("throw new CodedError(422, 'cycle_violation'");
    expect(cyc.slice(cyc.indexOf('planDay(inputs'), cyc.indexOf('savePlanDay('))).toContain('!x.ok');
  });
});

describe('planDay (نقي): حدود 1199/1200/1500/1501 بلا استثناء', () => {
  /** بطاقات اصطناعية من الزيت/السكر/الأرز بأوزان تُضبط حتى يصيب المجموع الحدّ المطلوب (بحث قسري صغير) */
  const card = (slug: string, lines: RecipeLine[]) => ({ slug, title_ar: slug, lines, steps: ['1: خطوة.'], flags: [] as string[] });
  const find = (lo: number, hi: number) => {
    for (let oil = 20; oil <= 120; oil++)
      for (let sugar = 5; sugar <= 150; sugar++)
        for (let rice = 5; rice <= 150; rice++) {
          const l1: RecipeLine[] = [{ ingredient: 'oil', amount_g: oil }];
          const l2: RecipeLine[] = [{ ingredient: 'sugar', amount_g: sugar }];
          const l3: RecipeLine[] = [{ ingredient: 'rice', amount_g: rice }];
          const k = sum([nutritionOf(l1).total, nutritionOf(l2).total, nutritionOf(l3).total]).kcal;
          if (k >= lo && k <= hi) return { l1, l2, l3, k };
        }
    throw new Error('لا تركيبة');
  };
  const run = (lo: number, hi: number) => {
    const f = find(lo, hi);
    return { f, r: planDay({ 'فطور': { card: card('a', f.l1) }, 'غداء': { card: card('b', f.l2) }, 'عشاء': { card: card('c', f.l3) } }) };
  };
  it('1199.x مرفوض (أقل)، 1200.0 مقبول، 1500.0 مقبول، 1500.5+ مرفوض (أعلى) مع المجموع والفرق وثلاثة حلول', () => {
    const low = run(1199.0, 1199.99);
    expect(low.r.ok).toBe(false);
    expect(low.r.law.status).toBe('INVALID_LOW');
    expect(low.r.message).toContain('أقل من الحد الأدنى 1200');
    expect(low.r.solutions).toHaveLength(3);
    const lo = run(1200.0, 1200.6);
    expect(lo.r.ok).toBe(true);
    const hi = run(1499.4, 1500.0);
    expect(hi.r.ok).toBe(true);
    const over = run(1500.01, 1501.99);
    expect(over.r.ok).toBe(false);
    expect(over.r.law.status).toBe('INVALID_HIGH');
    expect(over.r.message).toContain('أعلى من الحد الأعلى 1500');
    expect(over.r.solutions).toHaveLength(3);
  });
  it('دورة الأيام الثلاثة بمقسّم الخطة تبقى داخل المجال لكل يوم ولو بحصص مختلفة', () => {
    for (const d of CYCLE) {
      const r = planDay(Object.fromEntries(d.meals.map((m) => [m.slot, { card: card(m.recipe, m.lines), scale: 1 }])));
      expect(r.law.status).toBe('VALID');
      expect(evaluateDay(Object.fromEntries(r.slots.map((s) => [s.slot, s.nutrition]))).ok).toBe(true);
    }
  });
});
