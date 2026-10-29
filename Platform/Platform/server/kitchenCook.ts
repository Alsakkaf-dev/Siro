import express from 'express';
import { z } from 'zod';
import type { Db } from './db.js';
import { newId } from './repo.js';
import { parseOrThrow } from './validation.js';
import { CodedError, nowIso, pantryMove, priceVersion, toPoint, wrap, type KitchenEvent, type PriceRow } from './kitchenRoutes.js';
import {
  INGREDIENT_BY_SLUG, ORIGINAL_RECIPES, SLOTS, STORES, DEFAULT_STORE, blockedReason, cardStats, indexPrices, mealCost, nutritionOf, planDay, rarityOf, scaleLines, scaleStepsText, type PlanCard, type RecipeLine, type Slot,
} from '../shared/kitchen/index.js';
import { SimError, cookToCard, findDuplicate, type Op } from '../shared/kitchen/sim/index.js';

/** أوامر المحاكي كما تصل من الواجهة: نتحقق منها كلها (SEC-04) ثم نعيد حساب البطاقة على الخادم ولا نثق بأي ناتج من العميل */
const t = z.number().min(0).max(86_400);
const id = z.string().regex(/^[a-z0-9_]{1,24}$/);
const vessel = z.string().regex(/^[a-z0-9_]{1,24}$/);
const opSchema = z.discriminatedUnion('type', [
  z.object({ t, type: z.literal('take'), id, ingredient: z.string().max(24), grams: z.number().positive().max(5000) }),
  z.object({ t, type: z.literal('prep'), item: id, action: z.enum(['peel', 'wash', 'cut', 'mash', 'whisk', 'grate', 'juice', 'salt_rest', 'rinse_dry', 'trim']), shape: z.enum(['slices', 'cubes', 'sticks', 'minced', 'diced', 'grated', 'mashed']).optional(), size: z.enum(['small', 'medium', 'large']).optional() }),
  z.object({ t, type: z.literal('pour'), ingredient: z.enum(['oil', 'milk', 'water']), grams: z.number().positive().max(5000), vessel }),
  z.object({ t, type: z.literal('season'), ingredient: z.enum(['salt', 'cumin', 'sugar']), grams: z.number().positive().max(100), target: z.string().regex(/^[a-z0-9_]{1,24}$/) }),
  z.object({ t, type: z.literal('add'), item: id, vessel }),
  z.object({ t, type: z.literal('remove'), item: id }),
  z.object({ t, type: z.literal('place'), vessel, burner: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) }),
  z.object({ t, type: z.literal('heat'), burner: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), level: z.number().min(0).max(10) }),
  z.object({ t, type: z.literal('stir'), vessel }),
  z.object({ t, type: z.literal('lid'), vessel, on: z.boolean() }),
  z.object({ t, type: z.literal('toast'), item: id, level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) }),
  z.object({ t, type: z.literal('release'), vessel, mode: z.enum(['natural', 'quick']) }),
  z.object({ t, type: z.literal('drain'), vessel }),
  z.object({ t, type: z.literal('serve'), from: z.array(z.string().regex(/^[a-z0-9_]{1,24}$/)).min(1).max(40), plate: z.string().regex(/^[a-z0-9_]{1,24}$/) }),
  z.object({ t, type: z.literal('discard'), target: z.string().regex(/^[a-z0-9_]{1,24}$/) }),
]);
const storeSlug = z.string().refine((s) => STORES.some((x) => x.slug === s), 'سوق غير معروف');
const mealType = z.enum(['فطور', 'غداء', 'عشاء']);
const serveBody = z.object({
  mode: z.enum(['real', 'sandbox']).default('real'),
  seed: z.number().int().min(0).max(2 ** 31).default(1),
  ops: z.array(opSchema).min(1).max(3000),
  store: storeSlug.default(DEFAULT_STORE),
  name_ar: z.string().trim().min(1).max(80).optional(),
  steps_ar: z.array(z.string().trim().min(1).max(400)).max(40).optional(),
  meal_types: z.array(mealType).min(1).max(3).optional(),
  confirm_sandbox: z.boolean().default(false),
  accept_duplicate: z.enum(['new', 'variant']).optional(),
  image: z.string().max(450_000).regex(/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/).optional(),
});
const patchBody = z.object({ name_ar: z.string().trim().min(1).max(80).optional(), steps_ar: z.array(z.string().trim().min(1).max(400)).max(40).optional(), meal_types: z.array(mealType).min(1).max(3).optional(), hidden: z.boolean().optional() });
const variantBody = z.object({ parent_slug: z.string().max(60), scale: z.number().min(0.3).max(2), name_ar: z.string().trim().min(1).max(80).optional() });
const planBody = z.object({
  slots: z.object({ 'فطور': z.object({ card: z.string().max(60), scale: z.number().min(0.3).max(2).optional() }).optional(), 'غداء': z.object({ card: z.string().max(60), scale: z.number().min(0.3).max(2).optional() }).optional(), 'عشاء': z.object({ card: z.string().max(60), scale: z.number().min(0.3).max(2).optional() }).optional() }),
  auto_fit: z.boolean().default(false),
});
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), 'تاريخ غير صالح');

export interface CardRow { slug: string; kind: string; parent_slug: string | null; name_ar: string; meal_types: string; lines: string; steps: string; nutrition: string; cost_rm: number | null; price_version: number; stats: string; rarity: string; origin: string; flags: string; image: string | null; hidden: number; created_at: string; updated_at: string }
const parseCard = (r: CardRow) => ({
  slug: r.slug, kind: r.kind, parent_slug: r.parent_slug, name_ar: r.name_ar, meal_types: JSON.parse(r.meal_types) as string[], lines: JSON.parse(r.lines) as RecipeLine[], steps_ar: JSON.parse(r.steps) as string[],
  nutrition: JSON.parse(r.nutrition) as Record<string, number>, cost_rm: r.cost_rm, price_version: r.price_version, stats: JSON.parse(r.stats) as Record<string, number | null>, rarity: r.rarity, origin: JSON.parse(r.origin) as Record<string, unknown>,
  flags: JSON.parse(r.flags) as string[], image: r.image, hidden: !!r.hidden, created_at: r.created_at, updated_at: r.updated_at,
});

/** بطاقة للخطة: أصلية (ثابتة) أو ابتكارية (من القاعدة) */
function planCardOf(db: Db, slug: string): (PlanCard & { meal_types: string[] }) | null {
  const o = ORIGINAL_RECIPES.find((r) => r.slug === slug);
  if (o) return { slug: o.slug, title_ar: o.title_ar, lines: o.lines, steps: o.steps_original, flags: o.flags, status: o.status, meal_types: o.meal_types };
  const row = db.get<CardRow>('SELECT * FROM kitchen_cards WHERE slug = ?', slug);
  if (!row) return null;
  const c = parseCard(row);
  return { slug: c.slug, title_ar: c.name_ar, lines: c.lines, steps: c.steps_ar, flags: c.flags, meal_types: c.meal_types };
}

const priceIdx = (db: Db) => indexPrices(db.all<PriceRow>('SELECT * FROM kitchen_prices').map(toPoint));

/** نقطة الحفظ الوحيدة لأيام الخطة (AC-07): يُرفض أي يوم مخالف للقانون قبل الوصول إلى هنا، ولا استعلام INSERT آخر على الجدول */
function savePlanDay(db: Db, date: string, slots: unknown, totalKcal: number, status: 'proposal' | 'partial'): void {
  db.run('INSERT INTO kitchen_plan_days (date, slots, total_kcal, status, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(date) DO UPDATE SET slots = excluded.slots, total_kcal = excluded.total_kcal, status = excluded.status, updated_at = excluded.updated_at', date, JSON.stringify(slots), totalKcal, status, nowIso());
}

export function mountCook(r: express.Router, deps: { db: () => Db; publish: (type: KitchenEvent['type'], req: express.Request) => void }): void {
  const { db } = deps;

  r.get('/cards', wrap((_req, res) => {
    res.json({ cards: db().all<CardRow>('SELECT * FROM kitchen_cards ORDER BY created_at DESC').map(parseCard) });
  }));

  /** «قدّم»: يعيد بناء البطاقة من السجل على الخادم، يخصم المخزن بالكميات الفعلية (واقعي) ويحفظ البطاقة والجلسة ذرّيًا (MC-01/02، KIT-40) */
  r.post('/cook/serve', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(serveBody, req.body);
    const ops = b.ops as Op[];
    let card: ReturnType<typeof cookToCard>;
    try {
      card = cookToCard(ops, priceIdx(d), b.store, b.seed);
    } catch (e) {
      if (e instanceof SimError) throw new CodedError(400, 'bad_ops', e.message);
      throw e;
    }
    if (!card.lines.length) throw new CodedError(400, 'nothing_served', 'لم تُقدَّم أي مكوّنات بعد: ضع الطعام في الصحن ثم «قدّم».');
    if (b.mode === 'sandbox' && !b.confirm_sandbox) throw new CodedError(409, 'sandbox_confirm', 'وضع التجربة بلا خصم من المخزن أو المحفظة: تأكّد أنك ستشتري المكوّنات لاحقًا قبل حفظ بطاقة ابتكارية.');
    const others = [
      ...ORIGINAL_RECIPES.filter((x) => x.status === 'verified' || x.status === 'body_mismatch_title').map((x) => ({ slug: x.slug, title_ar: x.title_ar, lines: x.lines })),
      ...d.all<CardRow>('SELECT * FROM kitchen_cards').map((x) => ({ slug: x.slug, title_ar: x.name_ar, lines: JSON.parse(x.lines) as RecipeLine[] })),
    ];
    const dup = findDuplicate(card.lines, others);
    if (dup && !b.accept_duplicate) throw new CodedError(409, 'duplicate', `هذه هي بطاقة «${dup.title_ar}»؛ احفظ كنسخة؟`, { slug: dup.slug, title_ar: dup.title_ar, similarity: dup.similarity });
    const sessionId = newId();
    const slug = `my-${sessionId}`;
    const at = nowIso();
    d.tx(() => {
      if (b.mode === 'real') {
        for (const [ing, g] of Object.entries(card.taken)) {
          const spec = INGREDIENT_BY_SLUG.get(ing);
          if (!spec || g <= 0) continue;
          // الوزن المأخوذ صالح للأكل؛ المخزن بالوزن المشترى (÷ المردود)
          pantryMove(d, ing, -Math.ceil((g / (spec.edible_yield || 1)) * 10) / 10, 'consume', 'طبخ', sessionId, at);
        }
      }
      d.run('INSERT INTO kitchen_cook_sessions (id, mode, seed, ops, card_slug, taken, waste, waste_cost_rm, created_at) VALUES (?,?,?,?,?,?,?,?,?)', sessionId, b.mode, b.seed, JSON.stringify(b.ops), slug, JSON.stringify(card.taken), JSON.stringify(card.waste), card.waste_cost_rm, at);
      const flags = [...card.flags, ...(b.mode === 'sandbox' ? ['sandbox'] : [])];
      d.run('INSERT INTO kitchen_cards (slug, kind, parent_slug, name_ar, meal_types, lines, steps, nutrition, cost_rm, price_version, stats, rarity, origin, flags, image, hidden, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)',
        slug, b.accept_duplicate === 'variant' && dup ? 'variant' : 'custom', b.accept_duplicate === 'variant' && dup ? dup.slug : null, b.name_ar ?? card.name_ar, JSON.stringify(b.meal_types ?? card.meal_types), JSON.stringify(card.lines), JSON.stringify(b.steps_ar ?? card.steps_ar),
        JSON.stringify(card.nutrition), card.cost_rm, priceVersion(d), JSON.stringify(card.stats), card.rarity, JSON.stringify({ cookSessionId: sessionId, seed: b.seed, opLogRef: sessionId, mode: b.mode }), JSON.stringify(flags), b.image ?? null, at, at);
    });
    deps.publish('cards', req);
    if (b.mode === 'real') deps.publish('pantry', req);
    const row = d.get<CardRow>('SELECT * FROM kitchen_cards WHERE slug = ?', slug)!;
    res.status(201).json({ card: parseCard(row), waste: card.waste, waste_cost_rm: card.waste_cost_rm, session: sessionId, events: card.events.slice(-30) });
  }));

  r.patch('/cards/:slug', wrap((req, res) => {
    const d = db();
    const slug = String(req.params['slug']);
    const b = parseOrThrow(patchBody, req.body);
    if (ORIGINAL_RECIPES.some((x) => x.slug === slug)) throw new CodedError(403, 'original_locked', 'البطاقات الأصلية لا تُعدَّل في مكانها: أنشئ نسخة (N-12).');
    const row = d.get<CardRow>('SELECT * FROM kitchen_cards WHERE slug = ?', slug);
    if (!row) throw new CodedError(404, 'not_found', 'بطاقة غير موجودة');
    d.run('UPDATE kitchen_cards SET name_ar = ?, steps = ?, meal_types = ?, hidden = ?, updated_at = ? WHERE slug = ?', b.name_ar ?? row.name_ar, b.steps_ar ? JSON.stringify(b.steps_ar) : row.steps, b.meal_types ? JSON.stringify(b.meal_types) : row.meal_types, b.hidden === undefined ? row.hidden : +b.hidden, nowIso(), slug);
    deps.publish('cards', req);
    res.json({ card: parseCard(d.get<CardRow>('SELECT * FROM kitchen_cards WHERE slug = ?', slug)!) });
  }));

  r.delete('/cards/:slug', wrap((req, res) => {
    const d = db();
    const slug = String(req.params['slug']);
    if (ORIGINAL_RECIPES.some((x) => x.slug === slug)) throw new CodedError(403, 'original_locked', 'حذف البطاقة الأصلية ممنوع.');
    if (!d.run('DELETE FROM kitchen_cards WHERE slug = ?', slug).changes) throw new CodedError(404, 'not_found', 'بطاقة غير موجودة');
    deps.publish('cards', req);
    res.json({ ok: true });
  }));

  /** نسخة (variant) مصغّرة/مكبّرة من بطاقة بأوزان مقسّمة وخطوات مُعاد كتابتها (MC-03، SCL) — الأصل لا يُمس */
  r.post('/cards/variant', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(variantBody, req.body);
    const parent = planCardOf(d, b.parent_slug);
    if (!parent) throw new CodedError(404, 'not_found', 'بطاقة الأصل غير موجودة');
    const why = blockedReason(parent);
    if (why) throw new CodedError(422, 'blocked', why);
    const lines = scaleLines(parent.lines, b.scale);
    const sc = scaleStepsText(parent.steps, parent.lines, lines);
    const nut = nutritionOf(lines).total;
    const idx = priceIdx(d);
    const cost = mealCost(lines, idx, { store: DEFAULT_STORE });
    const total = cost.missing.length ? null : cost.total_rm;
    const stats = cardStats(nut, total, lines);
    const slug = `v-${newId()}`;
    const at = nowIso();
    d.run('INSERT INTO kitchen_cards (slug, kind, parent_slug, name_ar, meal_types, lines, steps, nutrition, cost_rm, price_version, stats, rarity, origin, flags, image, hidden, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,0,?,?)',
      slug, 'variant', parent.slug, b.name_ar ?? `${parent.title_ar} (×${b.scale})`, JSON.stringify(parent.meal_types), JSON.stringify(lines), JSON.stringify(sc.steps), JSON.stringify(nut), total, priceVersion(d), JSON.stringify(stats), rarityOf(stats.OVR), JSON.stringify({ parent: parent.slug, scale: b.scale }), JSON.stringify(parent.flags), at, at);
    deps.publish('cards', req);
    res.status(201).json({ card: parseCard(d.get<CardRow>('SELECT * FROM kitchen_cards WHERE slug = ?', slug)!), unmapped: sc.unmapped });
  }));

  /* ───── الخطة (خانة الجدول الأساسية) ───── */
  r.get('/plan', wrap((req, res) => {
    const from = parseOrThrow(dateStr, String(req.query['from'] ?? new Date().toISOString().slice(0, 10)));
    const days = Math.min(60, Math.max(1, Number(req.query['days']) || 14));
    const end = new Date(Date.parse(`${from}T00:00:00Z`) + (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const rows = db().all<{ date: string; slots: string; total_kcal: number; status: string; updated_at: string }>('SELECT * FROM kitchen_plan_days WHERE date >= ? AND date <= ? ORDER BY date', from, end);
    res.json({ days: rows.map((x) => ({ ...x, slots: JSON.parse(x.slots) as unknown })) });
  }));

  r.put('/plan/:date', wrap((req, res) => {
    const d = db();
    const date = parseOrThrow(dateStr, String(req.params['date']));
    const b = parseOrThrow(planBody, req.body);
    const inputs: Partial<Record<Slot, { card: PlanCard; scale?: number }>> = {};
    for (const slot of SLOTS) {
      const s = b.slots[slot];
      if (!s) continue;
      const card = planCardOf(d, s.card);
      if (!card) throw new CodedError(404, 'card_not_found', `البطاقة «${s.card}» غير موجودة`);
      const why = blockedReason(card);
      if (why) throw new CodedError(422, 'blocked', why);
      inputs[slot] = { card, ...(s.scale ? { scale: s.scale } : {}) };
    }
    if (!Object.keys(inputs).length) throw new CodedError(400, 'empty', 'اختر بطاقة لخانة واحدة على الأقل');
    const plan = planDay(inputs, { autoFit: b.auto_fit });
    // القانون حاجز صارم (LAW-03): الجزئي فوق الحد الأعلى مرفوض، والمكتمل خارج المجال مرفوض
    if (!plan.ok) throw new CodedError(422, 'law', plan.message ?? 'خارج قانون السعرات', { total_kcal: Math.round(plan.law.total_kcal), status: plan.law.status, diff: Math.round(plan.law.excess ?? plan.law.deficit ?? 0), solutions: plan.solutions });
    d.tx(() => savePlanDay(d, date, plan.slots, plan.law.total_kcal, plan.complete ? 'proposal' : 'partial'));
    deps.publish('plan', req);
    res.json({ date, status: plan.complete ? 'proposal' : 'partial', total_kcal: plan.law.total_kcal, law: plan.law, slots: plan.slots, autoFit: plan.autoFit, note: 'اقتراح داخل المنصة فقط: لا يُكتب شيء في Outlook ولا في سجلات راشد (G-03).' });
  }));

  /** معاينة بلا حفظ: نفس الحساب (الواجهة تعرض مؤشر القانون الحيّ والرفض قبل المحاولة) */
  r.post('/plan/preview', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(planBody, req.body);
    const inputs: Partial<Record<Slot, { card: PlanCard; scale?: number }>> = {};
    const blocked: string[] = [];
    for (const slot of SLOTS) {
      const s = b.slots[slot];
      if (!s) continue;
      const card = planCardOf(d, s.card);
      if (!card) throw new CodedError(404, 'card_not_found', `البطاقة «${s.card}» غير موجودة`);
      const why = blockedReason(card);
      if (why) blocked.push(why);
      else inputs[slot] = { card, ...(s.scale ? { scale: s.scale } : {}) };
    }
    const plan = planDay(inputs, { autoFit: b.auto_fit });
    res.json({ ok: plan.ok && !blocked.length, blocked, message: plan.message, solutions: plan.solutions, law: plan.law, slots: plan.slots, total: plan.total, autoFit: plan.autoFit, complete: plan.complete });
  }));

  r.delete('/plan/:date', wrap((req, res) => {
    const date = parseOrThrow(dateStr, String(req.params['date']));
    db().run('DELETE FROM kitchen_plan_days WHERE date = ?', date);
    deps.publish('plan', req);
    res.json({ ok: true });
  }));
}
