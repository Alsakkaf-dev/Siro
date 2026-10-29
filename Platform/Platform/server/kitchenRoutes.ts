import express from 'express';
import { z } from 'zod';
import type { Ctx } from './routes.js';
import type { Db } from './db.js';
import { newId } from './repo.js';
import { parseOrThrow } from './validation.js';
import {
  DEFAULT_STORE, INGREDIENT_BY_SLUG, SEED_PRICES, STORES, checkPriceChange, clampQty, searchIngredients, INGREDIENTS, tierRange, toGrams, unitsFor, qtyBounds,
  type Confidence, type PricePoint, type PriceSource, type SaleUnit,
} from '../shared/kitchen/index.js';

/**
 * المطبخ (K-M3/K-M4): أسعار + تدقيق + سلة + شراء + مخزن + محفظة + طلبات مكوّنات. جداول kitchen_* فقط.
 * المالك واحد (مستخدم المنصة المحلي): الفرض هنا بحماية Host/Origin العامة + ترويسة X-Kitchen-Client على كل كتابة (تمنع نماذج CSRF البسيطة).
 */
const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve().then(() => fn(req, res)).catch(next);
  };

const round2 = (n: number): number => Math.round(n * 100) / 100;
const nowIso = (): string => new Date().toISOString();

/** رد برمز آلي (يقرؤه العميل) بدل رسالة نصية فقط */
class CodedError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export interface KitchenEvent { type: 'prices' | 'cart' | 'pantry' | 'wallet' | 'requests'; version: number; by: string; at: string }

const SOURCES = ['estimate_tier', 'manual', 'receipt', 'pricecatcher'] as const;
const CONF_OF: Record<PriceSource, Confidence> = { estimate_tier: 'low', manual: 'medium', receipt: 'high', pricecatcher: 'medium' };
const ingSlug = z.string().refine((s) => INGREDIENT_BY_SLUG.has(s), 'مكوّن خارج القائمة المقفلة');
const storeSlug = z.string().refine((s) => STORES.some((x) => x.slug === s), 'سوق غير معروف');
const reason = z.string().trim().max(200).optional();

interface PriceRow { ingredient: string; store: string; price_rm: number; price_min: number; price_max: number; source: string; confidence: string; unverified: number; observed_at: string }
const toPoint = (r: PriceRow): PricePoint => ({
  ingredient: r.ingredient, store: r.store, price_rm: r.price_rm, price_min: r.price_min, price_max: r.price_max,
  source: r.source as PriceSource, confidence: r.confidence as Confidence, observed_at: r.observed_at, ...(r.unverified ? { unverified: true } : {}),
});

/* ───── البذر ───── */
const seeded = new WeakSet<Db>();
export function ensureKitchenSeed(db: Db): void {
  if (seeded.has(db)) return;
  db.tx(() => {
    if ((db.get<{ n: number }>('SELECT COUNT(*) n FROM kitchen_prices')?.n ?? 0) === 0) {
      const at = nowIso();
      for (const p of SEED_PRICES) {
        db.run('INSERT INTO kitchen_prices (ingredient, store, price_rm, price_min, price_max, source, confidence, unverified, observed_at, version) VALUES (?,?,?,?,?,?,?,?,?,1)', p.ingredient, p.store, p.price_rm, p.price_min, p.price_max, p.source, p.confidence, p.unverified ? 1 : 0, p.observed_at);
        db.run('INSERT INTO kitchen_price_audit (id, ingredient, store, old_price, new_price, old_source, new_source, kind, reason, price_version, at) VALUES (?,?,?,?,?,?,?,?,?,?,?)', newId(), p.ingredient, p.store, null, p.price_rm, null, p.source, 'seed', 'بذرة S3 التقديرية', 1, at);
      }
      db.run("INSERT OR REPLACE INTO kitchen_meta (key, value) VALUES ('price_version', '1')");
    }
    db.run('INSERT OR IGNORE INTO kitchen_wallet (id, budget_rm, period, period_start, hard_limit, updated_at) VALUES (1, 0, ?, NULL, 1, ?)', 'week', nowIso());
  });
  seeded.add(db);
}

const priceVersion = (db: Db): number => Number(db.get<{ value: string }>("SELECT value FROM kitchen_meta WHERE key = 'price_version'")?.value ?? 1);
const bumpVersion = (db: Db): number => {
  const v = priceVersion(db) + 1;
  db.run("INSERT OR REPLACE INTO kitchen_meta (key, value) VALUES ('price_version', ?)", String(v));
  return v;
};

/* ───── الأسعار ───── */
interface SetPriceOpts { source: PriceSource; kind: 'edit' | 'bulk' | 'receipt' | 'revert'; reason?: string | undefined; revertedOf?: string }
/** يكتب سعرًا واحدًا + سطر تدقيق. يُستدعى داخل db.tx من المنادي (الإصدار يُرفع مرة لكل عملية). */
function writePrice(db: Db, ingredient: string, store: string, price: number, version: number, o: SetPriceOpts, at: string, restore?: { min: number; max: number }): void {
  const old = db.get<PriceRow>('SELECT * FROM kitchen_prices WHERE ingredient = ? AND store = ?', ingredient, store);
  if (!old) throw new CodedError(404, 'no_price', 'لا نقطة سعر لهذا المكوّن في هذا السوق');
  const tr = o.source === 'estimate_tier' ? (restore ?? tierRange(ingredient, store) ?? { min: price, max: price }) : { min: price, max: price };
  db.run('UPDATE kitchen_prices SET price_rm = ?, price_min = ?, price_max = ?, source = ?, confidence = ?, unverified = 0, observed_at = ?, version = version + 1 WHERE ingredient = ? AND store = ?', price, tr.min, tr.max, o.source, CONF_OF[o.source], at, ingredient, store);
  db.run('INSERT INTO kitchen_price_audit (id, ingredient, store, old_price, new_price, old_source, new_source, kind, reason, reverted_of, price_version, at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', newId(), ingredient, store, old.price_rm, price, old.source, o.source, o.kind, o.reason ?? null, o.revertedOf ?? null, version, at);
}

/* ───── المحفظة ───── */
interface WalletRow { budget_rm: number; period: string; period_start: string | null; hard_limit: number; updated_at: string }
interface TxRow { id: string; kind: string; amount_rm: number; ref: string | null; note: string | null; at: string }
const balanceOf = (db: Db): number => round2(db.get<{ s: number | null }>('SELECT SUM(amount_rm) s FROM kitchen_wallet_tx')?.s ?? 0);
function walletView(db: Db): Record<string, unknown> {
  const w = db.get<WalletRow>('SELECT * FROM kitchen_wallet WHERE id = 1')!;
  const balance = balanceOf(db);
  const spent = w.budget_rm > 0 ? Math.max(0, round2(w.budget_rm - balance)) : 0;
  const ratio = w.budget_rm > 0 ? spent / w.budget_rm : null;
  return {
    configured: w.period_start !== null, budget_rm: w.budget_rm, period: w.period, period_start: w.period_start, hard_limit: !!w.hard_limit,
    balance_rm: balance, spent_rm: spent, ratio, level: ratio === null ? 'none' : ratio >= 1 ? 'full' : ratio >= 0.8 ? 'warn' : 'ok',
    txs: db.all<TxRow>('SELECT * FROM kitchen_wallet_tx ORDER BY at DESC, rowid DESC LIMIT 60'),
  };
}

/* ───── المخزن ───── */
interface PantryRow { ingredient: string; grams: number; cost_rm: number; bought_at: string | null; min_g: number | null; note: string | null; updated_at: string }
function pantryMove(db: Db, ingredient: string, delta: number, kind: string, reason: string | null, ref: string | null, at: string, addCost = 0): void {
  const row = db.get<PantryRow>('SELECT * FROM kitchen_pantry WHERE ingredient = ?', ingredient);
  const cur = row?.grams ?? 0;
  const next = cur + delta;
  if (next < -1e-9) throw new CodedError(409, 'pantry_insufficient', `المخزن لا يكفي من «${INGREDIENT_BY_SLUG.get(ingredient)?.name_ar}» (المتوفر ${Math.round(cur)} غ)`, { ingredient, have_g: cur, need_g: -delta });
  const cost = delta < 0 && cur > 0 ? (row?.cost_rm ?? 0) * (Math.max(0, next) / cur) : (row?.cost_rm ?? 0) + addCost;
  if (row) db.run('UPDATE kitchen_pantry SET grams = ?, cost_rm = ?, bought_at = COALESCE(?, bought_at), updated_at = ? WHERE ingredient = ?', Math.max(0, next), cost, kind === 'purchase' ? at : null, at, ingredient);
  else db.run('INSERT INTO kitchen_pantry (ingredient, grams, cost_rm, bought_at, updated_at) VALUES (?,?,?,?,?)', ingredient, Math.max(0, next), cost, kind === 'purchase' ? at : null, at);
  db.run('INSERT INTO kitchen_pantry_moves (id, ingredient, delta_g, kind, reason, ref, at) VALUES (?,?,?,?,?,?,?)', newId(), ingredient, delta, kind, reason, ref, at);
}

/* ───── الشراء الذرّي ───── */
interface BuyLine { ingredient: string; qty: number; unit: SaleUnit; store: string }
export interface PurchaseResult { id: string; store: string; total_rm: number; lines: { ingredient: string; qty: number; unit: string; store: string; grams: number; unit_price_rm: number; line_rm: number }[]; balance_after_rm: number; budget_raised_by: number }

/** CART-06 / AC-04: شراء + مخزن + محفظة + تفريغ السلة في db.tx واحدة. أي فشل = تراجع كامل. */
function buy(db: Db, lines: BuyLine[], kind: 'purchase' | 'quick', opts: { increaseBudgetBy?: number | undefined; clearCart: boolean }): PurchaseResult {
  return db.tx(() => {
    const at = nowIso();
    const priced = lines.map((l) => {
      const ing = INGREDIENT_BY_SLUG.get(l.ingredient)!;
      const p = db.get<PriceRow>('SELECT * FROM kitchen_prices WHERE ingredient = ? AND store = ?', l.ingredient, l.store);
      if (!p) throw new CodedError(422, 'no_price', `لا سعر لـ«${ing.name_ar}» في هذا السوق`, { ingredient: l.ingredient, store: l.store });
      const grams = toGrams(ing, l.qty, l.unit);
      const line_rm = round2((grams / toGrams(ing, 1)) * p.price_rm);
      return { ...l, grams, unit_price_rm: p.price_rm, line_rm, source: p.source, confidence: p.confidence };
    });
    const total = round2(priced.reduce((s, l) => s + l.line_rm, 0));
    const w = db.get<WalletRow>('SELECT * FROM kitchen_wallet WHERE id = 1')!;
    if (!w.period_start) throw new CodedError(409, 'wallet_unset', 'حدّد ميزانية المحفظة أولًا قبل «اشتريت».');
    let balance = balanceOf(db);
    let raised = 0;
    if (w.hard_limit && total > balance + 1e-9) {
      const shortfall = round2(total - balance);
      if (!opts.increaseBudgetBy || opts.increaseBudgetBy + 1e-9 < shortfall) throw new CodedError(409, 'insufficient', `الرصيد لا يكفي: المطلوب RM ${total.toFixed(2)} والرصيد RM ${balance.toFixed(2)}.`, { total_rm: total, balance_rm: balance, shortfall_rm: shortfall });
      raised = round2(opts.increaseBudgetBy);
      db.run("INSERT INTO kitchen_wallet_tx (id, kind, amount_rm, ref, note, at) VALUES (?, 'budget', ?, NULL, ?, ?)", newId(), raised, 'زيادة صريحة للميزانية عند الشراء', at);
      db.run('UPDATE kitchen_wallet SET budget_rm = budget_rm + ?, updated_at = ? WHERE id = 1', raised, at);
      balance = round2(balance + raised);
    }
    const id = newId();
    db.run('INSERT INTO kitchen_purchases (id, store, total_rm, price_version, at) VALUES (?,?,?,?,?)', id, priced[0]?.store ?? DEFAULT_STORE, total, priceVersion(db), at);
    for (const l of priced) {
      db.run('INSERT INTO kitchen_purchase_lines (purchase_id, ingredient, qty, unit, store, grams, unit_price_rm, line_rm, source, confidence) VALUES (?,?,?,?,?,?,?,?,?,?)', id, l.ingredient, l.qty, l.unit, l.store, l.grams, l.unit_price_rm, l.line_rm, l.source, l.confidence);
      pantryMove(db, l.ingredient, l.grams, 'purchase', null, id, at, l.line_rm);
    }
    db.run('INSERT INTO kitchen_wallet_tx (id, kind, amount_rm, ref, note, at) VALUES (?,?,?,?,?,?)', newId(), kind, -total, id, null, at);
    if (opts.clearCart) db.run('DELETE FROM kitchen_cart');
    return { id, store: priced[0]?.store ?? DEFAULT_STORE, total_rm: total, lines: priced.map(({ ingredient, qty, unit, store, grams, unit_price_rm, line_rm }) => ({ ingredient, qty, unit, store, grams, unit_price_rm, line_rm })), balance_after_rm: round2(balance - total), budget_raised_by: raised };
  });
}

/* ───── المخططات ───── */
const priceBody = z.object({ price_rm: z.number('رقم غير صالح'), source: z.enum(SOURCES).default('manual'), reason, confirm: z.boolean().default(false) });
const bulkBody = z.object({
  store: storeSlug,
  percent: z.number('رقم غير صالح').min(-90, 'أقل من −90%').max(500, 'أكثر من +500%'),
  category: z.string().max(40).optional(),
  reason,
  confirm: z.boolean().default(false),
});
const copyBody = z.object({ from: storeSlug, to: storeSlug, reason, confirm: z.boolean().default(false) });
const cartBody = z.object({ qty: z.number('رقم غير صالح'), unit: z.string(), store: storeSlug.nullable().default(null) });
const checkoutBody = z.object({ store: storeSlug.default(DEFAULT_STORE), increase_budget_by: z.number().positive().max(100_000).optional() });
const quickBody = z.object({ ingredient: ingSlug, qty: z.number().positive(), unit: z.string(), store: storeSlug.default(DEFAULT_STORE), increase_budget_by: z.number().positive().max(100_000).optional() });
const walletBody = z.object({ budget_rm: z.number('رقم غير صالح').min(0).max(1_000_000), period: z.enum(['week', 'month', 'custom']).default('week'), hard_limit: z.boolean().default(true) });
const adjustBody = z.object({ amount_rm: z.number().refine((n) => n !== 0, 'المبلغ لا يكون صفرًا').refine((n) => Math.abs(n) <= 1_000_000, 'مبلغ كبير'), kind: z.enum(['adjust', 'refund']).default('adjust'), note: z.string().trim().max(200).optional() });
const pantryAdjustBody = z.object({ ingredient: ingSlug, delta_g: z.number().refine((n) => n !== 0 && Math.abs(n) <= 100_000, 'كمية غير صالحة'), kind: z.enum(['adjust', 'consume']).default('adjust'), reason: z.string().trim().max(200).optional(), ref: z.string().max(80).optional() });
const consumeBody = z.object({ lines: z.array(z.object({ ingredient: ingSlug, grams: z.number().positive().max(100_000) })).min(1).max(60), ref: z.string().max(80).optional() });
const minBody = z.object({ min_g: z.number().min(0).max(100_000).nullable() });
const requestBody = z.object({ name_ar: z.string().trim().min(2, 'الاسم قصير').max(60, 'الاسم طويل'), note: z.string().trim().max(300).optional() });
const requestPatch = z.object({ status: z.enum(['pending', 'approved', 'rejected']) });

function validUnit(slug: string, unit: string): SaleUnit {
  const ing = INGREDIENT_BY_SLUG.get(slug)!;
  const u = unitsFor(ing).find((x) => x === unit);
  if (!u) throw new CodedError(400, 'bad_unit', `وحدة غير مناسبة لـ«${ing.name_ar}»`);
  return u;
}
function validQty(slug: string, unit: SaleUnit, qty: number): void {
  const ing = INGREDIENT_BY_SLUG.get(slug)!;
  const b = qtyBounds(ing, unit);
  if (!(qty >= b.min - 1e-9 && qty <= b.max + 1e-9)) throw new CodedError(400, 'bad_qty', `الكمية بين ${b.min} و${b.max}`);
  if (Math.abs(clampQty(ing, unit, qty) - qty) > 1e-6) throw new CodedError(400, 'bad_qty', `الكمية بخطوة ${b.step}`);
}

export function createKitchenRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = (): Db => {
    const d = ctx.getDb();
    ensureKitchenSeed(d);
    return d;
  };

  /* SSE */
  const clients = new Set<express.Response>();
  const publish = (type: KitchenEvent['type'], req: express.Request, version?: number): void => {
    const ev: KitchenEvent = { type, version: version ?? priceVersion(ctx.getDb()), by: String(req.headers['x-kitchen-client'] ?? ''), at: nowIso() };
    const frame = `event: kitchen\ndata: ${JSON.stringify(ev)}\n\n`;
    for (const c of clients) {
      c.write(frame);
      (c as unknown as { flush?: () => void }).flush?.();
    }
  };

  r.get('/stream', (req, res) => {
    res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    res.write(`retry: 1000\nevent: hello\ndata: ${JSON.stringify({ version: priceVersion(db()) })}\n\n`);
    clients.add(res);
    const hb = setInterval(() => res.write(': hb\n\n'), 15_000);
    hb.unref();
    req.on('close', () => {
      clearInterval(hb);
      clients.delete(res);
    });
  });

  // كل كتابة تحمل ترويسة العميل (SEC-02) — الأحداث تُنسب إليه كي لا يعيد التحميل لنفسه
  r.use((req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    if (!/^[\w-]{1,64}$/.test(String(req.headers['x-kitchen-client'] ?? ''))) return next(new CodedError(403, 'forbidden', 'كتابة المطبخ تتطلب ترويسة X-Kitchen-Client'));
    next();
  });

  /* حالة كاملة بطلب واحد */
  r.get('/state', wrap((_req, res) => {
    const d = db();
    res.json({
      version: priceVersion(d),
      prices: d.all<PriceRow>('SELECT * FROM kitchen_prices ORDER BY ingredient, store').map(toPoint),
      cart: d.all('SELECT ingredient, qty, unit, store FROM kitchen_cart ORDER BY updated_at, ingredient'),
      pantry: d.all<PantryRow>('SELECT * FROM kitchen_pantry ORDER BY ingredient'),
      wallet: walletView(d),
      requests: d.all('SELECT * FROM kitchen_ingredient_requests ORDER BY created_at DESC LIMIT 100'),
    });
  }));

  /* ───── الأسعار ───── */
  r.get('/prices', wrap((_req, res) => {
    const d = db();
    res.json({ version: priceVersion(d), prices: d.all<PriceRow>('SELECT * FROM kitchen_prices ORDER BY ingredient, store').map(toPoint) });
  }));

  r.put('/prices/:ingredient/:store', wrap((req, res) => {
    const d = db();
    const ingredient = parseOrThrow(ingSlug, String(req.params['ingredient']));
    const store = parseOrThrow(storeSlug, req.params['store']);
    const b = parseOrThrow(priceBody, req.body);
    const old = d.get<PriceRow>('SELECT * FROM kitchen_prices WHERE ingredient = ? AND store = ?', ingredient, store);
    const price = round2(b.price_rm);
    const chk = checkPriceChange(ingredient, store, old?.price_rm ?? null, price);
    if (!chk.ok) throw new CodedError(400, 'bad_price', chk.error ?? 'سعر غير صالح');
    if (chk.needsConfirm && !b.confirm) throw new CodedError(409, 'confirm', `تغيّر كبير (×${(chk.ratio ?? 0).toFixed(2)}) — أكّد الحفظ.`, { ratio: chk.ratio, old_price: old?.price_rm });
    const version = d.tx(() => {
      const v = bumpVersion(d);
      writePrice(d, ingredient, store, price, v, { source: b.source, kind: 'edit', reason: b.reason }, nowIso());
      return v;
    });
    publish('prices', req, version);
    res.json({ version, warnings: chk.warnings, point: toPoint(d.get<PriceRow>('SELECT * FROM kitchen_prices WHERE ingredient = ? AND store = ?', ingredient, store)!) });
  }));

  r.post('/prices/bulk', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(bulkBody, req.body);
    const factor = 1 + b.percent / 100;
    if ((factor > 3 || factor < 1 / 3) && !b.confirm) throw new CodedError(409, 'confirm', `تغيير جماعي كبير (×${factor.toFixed(2)}) — أكّد.`, { ratio: factor });
    const rows = d.all<PriceRow>('SELECT * FROM kitchen_prices WHERE store = ?', b.store).filter((p) => !b.category || INGREDIENT_BY_SLUG.get(p.ingredient)?.category === b.category);
    if (!rows.length) throw new CodedError(400, 'empty', 'لا أسعار مطابقة');
    const version = d.tx(() => {
      const v = bumpVersion(d);
      const at = nowIso();
      for (const p of rows) writePrice(d, p.ingredient, b.store, Math.max(0.01, round2(p.price_rm * factor)), v, { source: 'manual', kind: 'bulk', reason: b.reason ?? `${b.percent > 0 ? '+' : ''}${b.percent}%` }, at);
      return v;
    });
    publish('prices', req, version);
    res.json({ version, changed: rows.length });
  }));

  r.post('/prices/copy', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(copyBody, req.body);
    if (b.from === b.to) throw new CodedError(400, 'same_store', 'السوقان متطابقان');
    const src = d.all<PriceRow>('SELECT * FROM kitchen_prices WHERE store = ?', b.from);
    const version = d.tx(() => {
      const v = bumpVersion(d);
      const at = nowIso();
      for (const p of src) writePrice(d, p.ingredient, b.to, p.price_rm, v, { source: 'manual', kind: 'bulk', reason: b.reason ?? `نسخ من ${b.from}` }, at);
      return v;
    });
    publish('prices', req, version);
    res.json({ version, changed: src.length });
  }));

  r.get('/prices/audit', wrap((req, res) => {
    const limit = Math.min(500, Math.max(1, Number(req.query['limit']) || 100));
    const all = req.query['seed'] === '1';
    const rows = db().all<Record<string, unknown>>(`SELECT * FROM kitchen_price_audit ${all ? '' : "WHERE kind != 'seed'"} ORDER BY at DESC, rowid DESC LIMIT ?`, limit);
    res.json({ audit: rows });
  }));

  /** B1-05: تراجع عن أي نقطة في السجل (يعيد القيمة القديمة ويُسجَّل تدقيقًا جديدًا) */
  r.post('/prices/audit/:id/revert', wrap((req, res) => {
    const d = db();
    const a = d.get<{ id: string; ingredient: string; store: string; old_price: number | null; old_source: string | null; kind: string; reverted_of: string | null }>('SELECT * FROM kitchen_price_audit WHERE id = ?', String(req.params['id']));
    if (!a) throw new CodedError(404, 'not_found', 'سجل غير موجود');
    if (a.kind === 'seed' || a.old_price === null) throw new CodedError(409, 'not_revertible', 'بذرة البدء لا يُتراجع عنها');
    if (d.get('SELECT 1 FROM kitchen_price_audit WHERE reverted_of = ?', a.id)) throw new CodedError(409, 'already_reverted', 'سبق التراجع عن هذا التغيير');
    const src = (SOURCES as readonly string[]).includes(a.old_source ?? '') ? (a.old_source as PriceSource) : 'manual';
    const version = d.tx(() => {
      const v = bumpVersion(d);
      writePrice(d, a.ingredient, a.store, a.old_price!, v, { source: src, kind: 'revert', reason: 'تراجع', revertedOf: a.id }, nowIso());
      return v;
    });
    publish('prices', req, version);
    res.json({ version, point: toPoint(d.get<PriceRow>('SELECT * FROM kitchen_prices WHERE ingredient = ? AND store = ?', a.ingredient, a.store)!) });
  }));

  /* ───── السلة ───── */
  r.put('/cart/:ingredient', wrap((req, res) => {
    const d = db();
    const slug = parseOrThrow(ingSlug, String(req.params['ingredient']));
    const b = parseOrThrow(cartBody, req.body);
    if (b.qty <= 0) {
      d.run('DELETE FROM kitchen_cart WHERE ingredient = ?', slug);
    } else {
      const unit = validUnit(slug, b.unit);
      validQty(slug, unit, b.qty);
      d.run('INSERT INTO kitchen_cart (ingredient, qty, unit, store, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(ingredient) DO UPDATE SET qty = excluded.qty, unit = excluded.unit, store = excluded.store, updated_at = excluded.updated_at', slug, b.qty, unit, b.store, nowIso());
    }
    publish('cart', req);
    res.json({ cart: d.all('SELECT ingredient, qty, unit, store FROM kitchen_cart ORDER BY updated_at, ingredient') });
  }));
  r.delete('/cart/:ingredient', wrap((req, res) => {
    const d = db();
    d.run('DELETE FROM kitchen_cart WHERE ingredient = ?', String(req.params['ingredient']));
    publish('cart', req);
    res.json({ cart: d.all('SELECT ingredient, qty, unit, store FROM kitchen_cart ORDER BY updated_at, ingredient') });
  }));
  r.delete('/cart', wrap((req, res) => {
    db().run('DELETE FROM kitchen_cart');
    publish('cart', req);
    res.json({ cart: [] });
  }));

  /* ───── اشتريت (ذرّي) ───── */
  r.post('/checkout', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(checkoutBody, req.body);
    const rows = d.all<{ ingredient: string; qty: number; unit: string; store: string | null }>('SELECT * FROM kitchen_cart ORDER BY updated_at');
    if (!rows.length) throw new CodedError(400, 'empty_cart', 'السلة فارغة');
    const out = buy(d, rows.map((l) => ({ ingredient: l.ingredient, qty: l.qty, unit: l.unit as SaleUnit, store: l.store ?? b.store })), 'purchase', { increaseBudgetBy: b.increase_budget_by, clearCart: true });
    publish('cart', req);
    publish('pantry', req);
    publish('wallet', req);
    res.status(201).json(out);
  }));

  /** شراء سريع من المطبخ K (WAL-02): سطر واحد بلا مرور بالسلة */
  r.post('/quick-buy', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(quickBody, req.body);
    const unit = validUnit(b.ingredient, b.unit);
    validQty(b.ingredient, unit, b.qty);
    const out = buy(d, [{ ingredient: b.ingredient, qty: b.qty, unit, store: b.store }], 'quick', { increaseBudgetBy: b.increase_budget_by, clearCart: false });
    publish('pantry', req);
    publish('wallet', req);
    res.status(201).json(out);
  }));

  /* ───── المخزن ───── */
  r.get('/pantry', wrap((_req, res) => {
    const d = db();
    res.json({ pantry: d.all<PantryRow>('SELECT * FROM kitchen_pantry ORDER BY ingredient'), moves: d.all('SELECT * FROM kitchen_pantry_moves ORDER BY at DESC, rowid DESC LIMIT 100') });
  }));
  r.post('/pantry/adjust', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(pantryAdjustBody, req.body);
    if (b.kind === 'adjust' && !b.reason) throw new CodedError(400, 'reason_required', 'اذكر سبب التعديل (تصحيح جرد، تلف، هدية…)');
    d.tx(() => pantryMove(d, b.ingredient, b.delta_g, b.kind, b.reason ?? null, b.ref ?? null, nowIso()));
    publish('pantry', req);
    res.json({ pantry: d.all<PantryRow>('SELECT * FROM kitchen_pantry ORDER BY ingredient') });
  }));
  /** استهلاك آلي من المطبخ K بالكميات الفعلية (PAN-02) — ذرّي */
  r.post('/pantry/consume', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(consumeBody, req.body);
    d.tx(() => {
      const at = nowIso();
      for (const l of b.lines) pantryMove(d, l.ingredient, -l.grams, 'consume', null, b.ref ?? null, at);
    });
    publish('pantry', req);
    res.json({ pantry: d.all<PantryRow>('SELECT * FROM kitchen_pantry ORDER BY ingredient') });
  }));
  r.put('/pantry/:ingredient/min', wrap((req, res) => {
    const d = db();
    const slug = parseOrThrow(ingSlug, String(req.params['ingredient']));
    const b = parseOrThrow(minBody, req.body);
    d.run('INSERT INTO kitchen_pantry (ingredient, grams, cost_rm, min_g, updated_at) VALUES (?,0,0,?,?) ON CONFLICT(ingredient) DO UPDATE SET min_g = excluded.min_g, updated_at = excluded.updated_at', slug, b.min_g, nowIso());
    publish('pantry', req);
    res.json({ pantry: d.all<PantryRow>('SELECT * FROM kitchen_pantry ORDER BY ingredient') });
  }));

  /* ───── المحفظة ───── */
  r.get('/wallet', wrap((_req, res) => void res.json(walletView(db()))));
  r.put('/wallet', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(walletBody, req.body);
    d.tx(() => {
      const at = nowIso();
      const before = balanceOf(d);
      d.run('UPDATE kitchen_wallet SET budget_rm = ?, period = ?, period_start = ?, hard_limit = ?, updated_at = ? WHERE id = 1', b.budget_rm, b.period, at, b.hard_limit, at);
      d.run("INSERT INTO kitchen_wallet_tx (id, kind, amount_rm, ref, note, at) VALUES (?, 'budget', ?, NULL, ?, ?)", newId(), round2(b.budget_rm - before), `ضبط الميزانية (${b.period})`, at);
    });
    publish('wallet', req);
    res.json(walletView(d));
  }));
  r.post('/wallet/adjust', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(adjustBody, req.body);
    d.run('INSERT INTO kitchen_wallet_tx (id, kind, amount_rm, ref, note, at) VALUES (?,?,?,NULL,?,?)', newId(), b.kind, round2(b.amount_rm), b.note ?? null, nowIso());
    publish('wallet', req);
    res.json(walletView(d));
  }));

  /* ───── طلبات المكوّنات (N-01: لا تُضاف مكوّنات من هنا) ───── */
  r.get('/ingredient-requests', wrap((_req, res) => void res.json({ requests: db().all('SELECT * FROM kitchen_ingredient_requests ORDER BY created_at DESC LIMIT 100') })));
  r.post('/ingredient-requests', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(requestBody, req.body);
    const hit = searchIngredients(b.name_ar, INGREDIENTS).find((h) => h.score >= 3);
    if (hit) throw new CodedError(409, 'exists', `«${hit.item.name_ar}» موجود في القائمة المقفلة.`, { slug: hit.item.slug });
    const id = newId();
    d.run('INSERT INTO kitchen_ingredient_requests (id, name_ar, note, status, created_at) VALUES (?,?,?,?,?)', id, b.name_ar, b.note ?? null, 'pending', nowIso());
    publish('requests', req);
    res.status(201).json(d.get('SELECT * FROM kitchen_ingredient_requests WHERE id = ?', id));
  }));
  r.patch('/ingredient-requests/:id', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(requestPatch, req.body);
    const n = d.run('UPDATE kitchen_ingredient_requests SET status = ?, decided_at = ? WHERE id = ?', b.status, b.status === 'pending' ? null : nowIso(), String(req.params['id'])).changes;
    if (!n) throw new CodedError(404, 'not_found', 'طلب غير موجود');
    publish('requests', req);
    res.json({ ...(d.get('SELECT * FROM kitchen_ingredient_requests WHERE id = ?', String(req.params['id'])) as object), note_g04: 'الموافقة تسجّل القرار فقط؛ إضافة المكوّن فعليًا تغيير برمجي بموافقتك (G-04).' });
  }));

  // أخطاء مرمّزة بشكل يقرؤه العميل
  r.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof CodedError) return void res.status(err.status).json({ error: err.message, code: err.code, ...err.extra });
    next(err);
  });
  return r;
}
