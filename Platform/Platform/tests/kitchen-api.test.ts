import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import { INGREDIENTS, SEED_PRICES, STORES } from '../shared/kitchen/index.js';

let srv: Running;
let base: string;
let dir: string;
const H = { 'X-Kitchen-Client': 'test-1' };
async function call(method: string, url: string, body?: unknown, headers: Record<string, string> = H): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}

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

describe('kitchen API — البذر والحماية', () => {
  it('يبذر الأسعار من SEED_PRICES (26 × 5) بإصدار 1 وتدقيق بذرة، والمكوّنات كلها ضمن القائمة المقفلة (AC-11)', async () => {
    const s = await call('GET', '/api/kitchen/state');
    expect(s.status).toBe(200);
    expect(s.json.prices).toHaveLength(SEED_PRICES.length);
    expect(s.json.prices).toHaveLength(INGREDIENTS.length * STORES.length);
    expect(s.json.version).toBe(1);
    const slugs = new Set(INGREDIENTS.map((i) => i.slug));
    expect(s.json.prices.every((p: any) => slugs.has(p.ingredient))).toBe(true);
    expect(s.json.prices.find((p: any) => p.ingredient === 'chicken' && p.store === 'mydin')).toMatchObject({ price_rm: 8.95, source: 'estimate_tier', unverified: true });
    expect(s.json.wallet).toMatchObject({ configured: false, balance_rm: 0 });
    // التدقيق الافتراضي لا يعرض البذرة
    expect((await call('GET', '/api/kitchen/prices/audit')).json.audit).toEqual([]);
    expect((await call('GET', '/api/kitchen/prices/audit?seed=1&limit=500')).json.audit).toHaveLength(SEED_PRICES.length);
  });
  it('الكتابة بلا ترويسة X-Kitchen-Client مرفوضة (SEC-02) والقراءة مسموحة', async () => {
    const r = await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 12 }, {});
    expect(r.status).toBe(403);
    expect((await call('GET', '/api/kitchen/prices', undefined, {})).status).toBe(200);
  });
  it('رفض مكوّن خارج القائمة المقفلة وسوق مجهول وجسم غير صالح', async () => {
    expect((await call('PUT', '/api/kitchen/prices/avocado/mydin', { price_rm: 5 })).status).toBe(400);
    expect((await call('PUT', '/api/kitchen/prices/egg/nowhere', { price_rm: 5 })).status).toBe(400);
    expect((await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 'x' })).status).toBe(400);
  });
});

describe('kitchen API — الأسعار والتدقيق والتراجع (AC-03)', () => {
  let auditId = '';
  it('تعديل سعر الدجاج في Mydin من 8.95 إلى 9.40: يُحفظ ويرفع الإصدار ويُدقَّق (J2)', async () => {
    const r = await call('PUT', '/api/kitchen/prices/chicken/mydin', { price_rm: 9.4, reason: 'اختبار' });
    expect(r.status).toBe(200);
    expect(r.json.version).toBe(2);
    expect(r.json.point).toMatchObject({ price_rm: 9.4, source: 'manual', confidence: 'medium' });
    expect(r.json.point.unverified).toBeUndefined();
    const a = (await call('GET', '/api/kitchen/prices/audit')).json.audit;
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ ingredient: 'chicken', store: 'mydin', old_price: 8.95, new_price: 9.4, old_source: 'estimate_tier', new_source: 'manual', kind: 'edit', reason: 'اختبار' });
    auditId = a[0].id;
  });
  it('السعر ≤ 0 مرفوض، وتغيّر ×3 يتطلب تأكيدًا، والخروج عن نطاق الشريحة تحذير لا منع', async () => {
    expect((await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 0 })).status).toBe(400);
    expect((await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: -3 })).status).toBe(400);
    const c = await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 40 });
    expect(c.status).toBe(409);
    expect(c.json.code).toBe('confirm');
    const ok = await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 40, confirm: true });
    expect(ok.status).toBe(200);
    expect(ok.json.warnings.join(' ')).toMatch(/خارج نطاق/);
    const cheap = await call('PUT', '/api/kitchen/prices/egg/mydin', { price_rm: 10.5, confirm: true }); // داخل 9–11
    expect(cheap.json.warnings).toEqual([]);
  });
  it('التراجع يعيد القيمة القديمة بمصدرها ويُدقَّق، ولا يتراجع مرتين', async () => {
    const r = await call('POST', `/api/kitchen/prices/audit/${auditId}/revert`);
    expect(r.status).toBe(200);
    expect(r.json.point).toMatchObject({ ingredient: 'chicken', price_rm: 8.95, source: 'estimate_tier' });
    expect((await call('POST', `/api/kitchen/prices/audit/${auditId}/revert`)).json.code).toBe('already_reverted');
    const last = (await call('GET', '/api/kitchen/prices/audit?limit=1')).json.audit[0];
    expect(last).toMatchObject({ kind: 'revert', reverted_of: auditId, new_price: 8.95 });
  });
  it('تعديل جماعي بنسبة يغيّر سوقًا كاملًا بإصدار واحد، ويُرفض بلا تأكيد إن تجاوز ×3', async () => {
    const before = (await call('GET', '/api/kitchen/prices')).json;
    const r = await call('POST', '/api/kitchen/prices/bulk', { store: 'aeon', percent: 10, category: 'خضروات' });
    expect(r.status).toBe(200);
    expect(r.json.version).toBe(before.version + 1);
    const potato = (store: string, j: any) => j.prices.find((p: any) => p.ingredient === 'potato' && p.store === store);
    const after = (await call('GET', '/api/kitchen/prices')).json;
    expect(potato('aeon', after).price_rm).toBeCloseTo(potato('aeon', before).price_rm * 1.1, 2);
    expect(potato('mydin', after).price_rm).toBe(potato('mydin', before).price_rm);
    expect((await call('POST', '/api/kitchen/prices/bulk', { store: 'aeon', percent: 300 })).json.code).toBe('confirm');
  });
});

describe('kitchen API — السلة والمحفظة و«اشتريت» الذرّي (AC-04)', () => {
  it('السلة: إضافة بوحدة صحيحة، رفض وحدة/كمية/خطوة غير مناسبة، وحذف بكمية 0', async () => {
    expect((await call('PUT', '/api/kitchen/cart/egg', { qty: 1, unit: 'dozen', store: null })).status).toBe(200);
    expect((await call('PUT', '/api/kitchen/cart/egg', { qty: 1, unit: 'l', store: null })).json.code).toBe('bad_unit');
    expect((await call('PUT', '/api/kitchen/cart/chicken', { qty: 0.33, unit: 'kg', store: null })).json.code).toBe('bad_qty');
    expect((await call('PUT', '/api/kitchen/cart/chicken', { qty: 99, unit: 'kg', store: null })).json.code).toBe('bad_qty');
    expect((await call('PUT', '/api/kitchen/cart/chicken', { qty: 0.5, unit: 'kg', store: 'kip' })).status).toBe(200);
    expect((await call('PUT', '/api/kitchen/cart/milk', { qty: 1, unit: 'l', store: null })).status).toBe(200);
    const del = await call('PUT', '/api/kitchen/cart/milk', { qty: 0, unit: 'l', store: null });
    expect(del.json.cart.map((l: any) => l.ingredient)).toEqual(['egg', 'chicken']);
  });
  it('اشتريت بلا ميزانية مضبوطة → wallet_unset ولا يتغير شيء', async () => {
    const r = await call('POST', '/api/kitchen/checkout', { store: 'mydin' });
    expect(r.status).toBe(409);
    expect(r.json.code).toBe('wallet_unset');
    expect((await call('GET', '/api/kitchen/state')).json.cart).toHaveLength(2);
  });
  it('الحدّ الصارم: الرصيد الناقص يمنع، والزيادة الصريحة تسمح', async () => {
    await call('PUT', '/api/kitchen/wallet', { budget_rm: 5, period: 'week', hard_limit: true });
    const r = await call('POST', '/api/kitchen/checkout', { store: 'mydin' });
    expect(r.status).toBe(409);
    expect(r.json).toMatchObject({ code: 'insufficient', balance_rm: 5 });
    expect(r.json.shortfall_rm).toBeGreaterThan(0);
    expect((await call('GET', '/api/kitchen/pantry')).json.pantry).toEqual([]);
  });
  it('اشتريت: خصم المحفظة + مخزن بالغرام + تفريغ السلة + سجل حركات في عملية واحدة', async () => {
    await call('PUT', '/api/kitchen/wallet', { budget_rm: 100, period: 'week', hard_limit: true });
    const st = (await call('GET', '/api/kitchen/state')).json;
    const price = (ing: string, store: string) => st.prices.find((p: any) => p.ingredient === ing && p.store === store).price_rm;
    const expected = Math.round((price('egg', 'mydin') + 0.5 * price('chicken', 'kip')) * 100) / 100;
    const r = await call('POST', '/api/kitchen/checkout', { store: 'mydin' });
    expect(r.status).toBe(201);
    expect(r.json.total_rm).toBeCloseTo(expected, 2);
    expect(r.json.balance_after_rm).toBeCloseTo(100 - expected, 2);
    const after = (await call('GET', '/api/kitchen/state')).json;
    expect(after.cart).toEqual([]);
    expect(after.wallet.balance_rm).toBeCloseTo(100 - expected, 2);
    const pantry = Object.fromEntries(after.pantry.map((p: any) => [p.ingredient, p.grams]));
    expect(pantry).toEqual({ egg: 720, chicken: 500 });
    const moves = (await call('GET', '/api/kitchen/pantry')).json.moves;
    expect(moves.map((m: any) => m.kind)).toEqual(['purchase', 'purchase']);
    expect(after.wallet.txs[0]).toMatchObject({ kind: 'purchase', amount_rm: -expected });
    expect((await call('POST', '/api/kitchen/checkout', {})).json.code).toBe('empty_cart');
  });
  it('الذرّية: فشل أثناء كتابة المحفظة يتراجع عن كل شيء (لا حالة نصفية)', async () => {
    const db = srv.getDb();
    await call('PUT', '/api/kitchen/cart/onion', { qty: 1, unit: 'kg', store: null });
    const before = (await call('GET', '/api/kitchen/state')).json;
    db.exec("CREATE TRIGGER kt_fail BEFORE INSERT ON kitchen_wallet_tx WHEN NEW.kind = 'purchase' BEGIN SELECT RAISE(ABORT, 'محاكاة فشل'); END");
    try {
      const r = await call('POST', '/api/kitchen/checkout', { store: 'mydin' });
      expect(r.status).toBe(500);
    } finally {
      db.exec('DROP TRIGGER kt_fail');
    }
    const after = (await call('GET', '/api/kitchen/state')).json;
    expect(after.cart).toEqual(before.cart);
    expect(after.pantry).toEqual(before.pantry);
    expect(after.wallet.balance_rm).toBe(before.wallet.balance_rm);
    expect(db.get<{ n: number }>('SELECT COUNT(*) n FROM kitchen_purchases')!.n).toBe(1);
    await call('DELETE', '/api/kitchen/cart');
  });
  it('شراء سريع من المطبخ يخصم ويضيف دون المرور بالسلة', async () => {
    const before = (await call('GET', '/api/kitchen/wallet')).json.balance_rm;
    const r = await call('POST', '/api/kitchen/quick-buy', { ingredient: 'cheese', qty: 1, unit: 'pack', store: 'mydin' });
    expect(r.status).toBe(201);
    expect((await call('GET', '/api/kitchen/wallet')).json.balance_rm).toBeCloseTo(before - r.json.total_rm, 2);
    expect((await call('GET', '/api/kitchen/pantry')).json.pantry.find((p: any) => p.ingredient === 'cheese').grams).toBe(200);
  });
  it('المحفظة: تحذير 80%/100% وتعديل مسجّل', async () => {
    await call('PUT', '/api/kitchen/wallet', { budget_rm: 100, period: 'week', hard_limit: true });
    expect((await call('GET', '/api/kitchen/wallet')).json).toMatchObject({ balance_rm: 100, level: 'ok' });
    await call('POST', '/api/kitchen/wallet/adjust', { amount_rm: -85, note: 'اختبار' });
    expect((await call('GET', '/api/kitchen/wallet')).json.level).toBe('warn');
    await call('POST', '/api/kitchen/wallet/adjust', { amount_rm: -15 });
    expect((await call('GET', '/api/kitchen/wallet')).json.level).toBe('full');
    expect((await call('POST', '/api/kitchen/wallet/adjust', { amount_rm: 0 })).status).toBe(400);
  });
});

describe('kitchen API — المخزن وطلبات المكوّنات', () => {
  it('تعديل المخزن يتطلب سببًا، والاستهلاك الذرّي يرفض ما يزيد عن المتوفر دون تغيير', async () => {
    expect((await call('POST', '/api/kitchen/pantry/adjust', { ingredient: 'egg', delta_g: -60 })).json.code).toBe('reason_required');
    expect((await call('POST', '/api/kitchen/pantry/adjust', { ingredient: 'egg', delta_g: -60, reason: 'تلف' })).status).toBe(200);
    const r = await call('POST', '/api/kitchen/pantry/consume', { lines: [{ ingredient: 'egg', grams: 100 }, { ingredient: 'chicken', grams: 9999 }], ref: 'cook-1' });
    expect(r.status).toBe(409);
    expect(r.json.code).toBe('pantry_insufficient');
    const egg = (await call('GET', '/api/kitchen/pantry')).json.pantry.find((p: any) => p.ingredient === 'egg');
    expect(egg.grams).toBe(660);
    expect((await call('POST', '/api/kitchen/pantry/consume', { lines: [{ ingredient: 'egg', grams: 100 }, { ingredient: 'chicken', grams: 150 }] })).status).toBe(200);
    expect((await call('PUT', '/api/kitchen/pantry/egg/min', { min_g: 200 })).status).toBe(200);
  });
  it('تكلفة الغرام الفعلية تنقص تناسبيًا مع الاستهلاك', async () => {
    const chicken = (await call('GET', '/api/kitchen/pantry')).json.pantry.find((p: any) => p.ingredient === 'chicken');
    expect(chicken.grams).toBe(350);
    expect(chicken.cost_rm / chicken.grams).toBeCloseTo(chicken.cost_rm / 350, 6);
    const perG = (await call('GET', '/api/kitchen/state')).json.prices.find((p: any) => p.ingredient === 'chicken' && p.store === 'kip').price_rm / 1000;
    expect(chicken.cost_rm / chicken.grams).toBeCloseTo(perG, 4);
  });
  it('طلب مكوّن جديد: يُسجَّل معلّقًا، ومكوّن موجود يُرفض، والموافقة لا تضيف مكوّنًا (N-01)', async () => {
    expect((await call('POST', '/api/kitchen/ingredient-requests', { name_ar: 'بيض' })).json.code).toBe('exists');
    const r = await call('POST', '/api/kitchen/ingredient-requests', { name_ar: 'سمك سلمون', note: 'للعشاء' });
    expect(r.status).toBe(201);
    expect(r.json.status).toBe('pending');
    const p = await call('PATCH', `/api/kitchen/ingredient-requests/${r.json.id}`, { status: 'approved' });
    expect(p.json.status).toBe('approved');
    expect(p.json.note_g04).toMatch(/G-04/);
    const s = (await call('GET', '/api/kitchen/state')).json;
    expect(new Set(s.prices.map((x: any) => x.ingredient)).size).toBe(26);
  });
});

describe('kitchen API — SSE /stream (ARC-05)', () => {
  it('غير مضغوط، وينقل حدث الأسعار خلال ≤ 3 ث (الفعلي أقل بكثير) وينسبه لصاحبه', async () => {
    const ctl = new AbortController();
    const res = await fetch(`${base}/api/kitchen/stream`, { headers: { 'Accept-Encoding': 'gzip, br' }, signal: ctl.signal });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/);
    expect(res.headers.get('content-encoding')).toBeNull();
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const until = async (re: RegExp, ms: number): Promise<string> => {
      const t0 = Date.now();
      while (!re.test(buf)) {
        if (Date.now() - t0 > ms) throw new Error('مهلة SSE. المستلم: ' + buf);
        const { value, done } = await Promise.race([reader.read(), new Promise<{ value: undefined; done: true }>((r) => setTimeout(() => r({ value: undefined, done: true }), ms))]);
        if (value) buf += dec.decode(value);
        if (done) break;
      }
      return buf;
    };
    await until(/event: hello/, 2000);
    const t0 = Date.now();
    await call('PUT', '/api/kitchen/prices/oats/mydin', { price_rm: 11.5 }, { 'X-Kitchen-Client': 'writer-9' });
    await until(/event: kitchen\ndata: .*"type":"prices"/, 3000);
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(3000);
    const ev = JSON.parse(/event: kitchen\ndata: (.*)\n/.exec(buf)![1]!);
    expect(ev).toMatchObject({ type: 'prices', by: 'writer-9' });
    expect(ev.version).toBeGreaterThan(1);
    ctl.abort();
  });
});
