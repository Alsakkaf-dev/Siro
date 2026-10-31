import express from 'express';
import { z } from 'zod';
import type { Ctx } from './routes.js';
import type { Db } from './db.js';
import { parseOrThrow } from './validation.js';
import { CodedError, nowIso, wrap } from './kitchenRoutes.js';
import { INGREDIENT_BY_SLUG, compareToSeed, parseOffProduct, parseUsdaSearch, type FoodHit } from '../shared/kitchen/index.js';

/**
 * بوابة الإثراء (BFF، API-01…07): المسار الحرج محلي تمامًا (API-02)؛ هذه إضافة اختيارية معطّلة افتراضيًا (SIRO_ENRICH_ENABLED=1).
 * المفاتيح في متغيرات بيئة الخادم وحدها (N-08)، قائمة بيضاء للمضيفات (SEC-05)، ذاكرة مؤقتة في api_cache (API-05)،
 * سقف يومي لكل خدمة أدنى من سقفها (API-06)، محاولتان بتراجع أسّي ثم فشل صامت نحو البذرة، والاستجابات الخارجية تُتحقَّق ولا يُوثق بها (SEC-04).
 * كل خدمة موسومة UNVERIFIED: لم نتحقق من ترخيصها وحدودها وشكل استجابتها حيًّا (الشبكة مقيّدة هنا).
 */
export type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export interface EnrichOpts { fetch?: FetchLike; env?: NodeJS.ProcessEnv; sleep?: (ms: number) => Promise<void> }

interface Svc { id: 'usda' | 'off'; label: string; host: string; keyEnv: string | null; capEnv: string; capDefault: number; ttlDays: number; docs: string }
export const SERVICES: readonly Svc[] = [
  { id: 'usda', label: 'USDA FoodData Central (API-10)', host: 'api.nal.usda.gov', keyEnv: 'SIRO_USDA_KEY', capEnv: 'SIRO_USDA_DAILY_CAP', capDefault: 200, ttlDays: 14, docs: 'https://fdc.nal.usda.gov/api-guide.html' },
  { id: 'off', label: 'Open Food Facts (API-11)', host: 'world.openfoodfacts.org', keyEnv: null, capEnv: 'SIRO_OFF_DAILY_CAP', capDefault: 100, ttlDays: 14, docs: 'https://openfoodfacts.github.io/openfoodfacts-server/api/' },
];
const HOSTS = new Set(SERVICES.map((s) => s.host));
const UA = 'SiroPlatform/1.0 (personal, single-user; contact via GitHub Alsakkaf-dev)';
const slugQ = z.string().refine((s) => INGREDIENT_BY_SLUG.has(s), 'مكوّن خارج القائمة المقفلة');

export function createEnrichRouter(ctx: Ctx, opts: EnrichOpts = {}): express.Router {
  const r = express.Router();
  const env = opts.env ?? process.env;
  const doFetch: FetchLike = opts.fetch ?? ((u, i) => fetch(u, i) as unknown as ReturnType<FetchLike>);
  const sleep = opts.sleep ?? ((ms) => new Promise<void>((res) => setTimeout(res, ms)));
  const db = (): Db => ctx.getDb();
  const enabled = (): boolean => env['SIRO_ENRICH_ENABLED'] === '1';
  const cap = (s: Svc): number => Math.max(0, Number(env[s.capEnv] ?? s.capDefault) || s.capDefault);
  const usage = (d: Db, s: Svc): number => d.get<{ n: number }>('SELECT n FROM api_usage WHERE day = ? AND service = ?', nowIso().slice(0, 10), s.id)?.n ?? 0;
  const reason = (s: Svc): string | null => (!enabled() ? 'معطّل: عيّن SIRO_ENRICH_ENABLED=1 على الخادم' : s.keyEnv && !env[s.keyEnv] ? `لا مفتاح: عيّن ${s.keyEnv} على الخادم (انظر API_KEYS_NEEDED.md)` : null);

  /** يجلب عبر الذاكرة المؤقتة والسقف والمحاولتين؛ يرمي CodedError مرمّزًا */
  async function guarded(s: Svc, cacheKey: string, url: string): Promise<{ json: unknown; cached: boolean }> {
    const why = reason(s);
    if (why) throw new CodedError(503, enabled() ? 'no_key' : 'enrich_disabled', `${s.label}: ${why}`);
    const d = db();
    const hit = d.get<{ body: string; expires_at: string }>('SELECT body, expires_at FROM api_cache WHERE key = ?', cacheKey);
    if (hit && hit.expires_at > nowIso()) return { json: JSON.parse(hit.body) as unknown, cached: true };
    if (usage(d, s) >= cap(s)) throw new CodedError(429, 'cap_reached', `${s.label}: بلغ السقف اليومي المحلي (${cap(s)}) — الأقل من سقف الخدمة بقصد (API-06).`);
    const u = new URL(url);
    if (u.protocol !== 'https:' || !HOSTS.has(u.hostname) || u.hostname !== s.host) throw new CodedError(400, 'host_blocked', 'مضيف غير مسموح (SEC-05)');
    let last = 'تعذّر الاتصال';
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await sleep(attempt === 1 ? 250 : 1000);
      d.run('INSERT INTO api_usage (day, service, n) VALUES (?,?,1) ON CONFLICT(day, service) DO UPDATE SET n = n + 1', nowIso().slice(0, 10), s.id);
      try {
        const res = await doFetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
        if (res.status === 429 || res.status >= 500) { last = `الخدمة ردّت ${res.status}`; continue; }
        if (!res.ok) throw new CodedError(502, 'upstream_failed', `${s.label}: ردّت ${res.status}`);
        const json = await res.json();
        d.run('INSERT OR REPLACE INTO api_cache (key, service, body, fetched_at, expires_at) VALUES (?,?,?,?,?)', cacheKey, s.id, JSON.stringify(json), nowIso(), new Date(Date.now() + s.ttlDays * 86_400_000).toISOString());
        return { json, cached: false };
      } catch (e) {
        if (e instanceof CodedError) throw e;
        last = 'تعذّر الاتصال';
      }
    }
    throw new CodedError(502, 'upstream_failed', `${s.label}: ${last} — تعمل المنصة من البذرة المحلية.`);
  }

  r.get('/status', wrap((_req, res) => {
    const d = db();
    res.json({
      enabled: enabled(),
      note: 'إثراء فقط: لو انقطعت كل الواجهات تعمل المنصة 100% من البذرة (API-02). لا يُطبَّق أي تغيير تلقائيًا (API-21).',
      services: SERVICES.map((s) => ({ id: s.id, label: s.label, host: s.host, configured: !reason(s), reason: reason(s), used_today: usage(d, s), cap: cap(s), docs: s.docs, verified: false, verified_note: 'UNVERIFIED: الترخيص والحدود وشكل الاستجابة لم تُتحقَّق حيًّا (الشبكة مقيّدة في بيئة التطوير)' })),
    });
  }));

  r.get('/off/barcode/:code', wrap(async (req, res) => {
    const code = parseOrThrow(z.string().regex(/^\d{8,14}$/, 'باركود غير صالح'), String(req.params['code']));
    const s = SERVICES[1]!;
    const g = await guarded(s, `off:${code}`, `https://${s.host}/api/v2/product/${code}.json?fields=code,product_name,nutriments`);
    let item: FoodHit | null;
    try {
      item = parseOffProduct(g.json);
    } catch {
      throw new CodedError(502, 'bad_upstream', 'استجابة Open Food Facts غير صالحة الشكل (SEC-04)');
    }
    if (!item) throw new CodedError(404, 'not_found', 'المنتج غير موجود في Open Food Facts');
    res.json({ item, cached: g.cached, note: 'قيم الملصق: جودتها متفاوتة وتُعرض كما هي ولا تُطبَّق.' });
  }));

  r.get('/usda/search', wrap(async (req, res) => {
    const q = parseOrThrow(z.string().trim().min(2).max(60), String(req.query['q'] ?? ''));
    const s = SERVICES[0]!;
    const g = await guarded(s, `usda:s:${q.toLowerCase()}`, `https://${s.host}/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&dataType=Foundation,SR%20Legacy&api_key=${encodeURIComponent(env[s.keyEnv!] ?? '')}`);
    let items: FoodHit[];
    try {
      items = parseUsdaSearch(g.json);
    } catch {
      throw new CodedError(502, 'bad_upstream', 'استجابة USDA غير صالحة الشكل (SEC-04)');
    }
    res.json({ items, cached: g.cached });
  }));

  /** API-21: مقارنة قيمة مكوّن في البذرة بأعلى نتيجة USDA كـ«اقتراح تحديث» لا يُطبَّق */
  r.get('/compare/:slug', wrap(async (req, res) => {
    const slug = parseOrThrow(slugQ, String(req.params['slug']));
    const name = INGREDIENT_BY_SLUG.get(slug)!.name_en;
    const s = SERVICES[0]!;
    const g = await guarded(s, `usda:s:${name.toLowerCase()}`, `https://${s.host}/fdc/v1/foods/search?query=${encodeURIComponent(name)}&pageSize=10&dataType=Foundation,SR%20Legacy&api_key=${encodeURIComponent(env[s.keyEnv!] ?? '')}`);
    let items: FoodHit[];
    try {
      items = parseUsdaSearch(g.json);
    } catch {
      throw new CodedError(502, 'bad_upstream', 'استجابة USDA غير صالحة الشكل (SEC-04)');
    }
    const top = items.find((i) => i.per100);
    const suggestion = top ? compareToSeed(slug, top) : null;
    res.json({ ingredient: slug, query: name, suggestion, candidates: items.slice(0, 5).map((i) => ({ id: i.id, name: i.name, basis: i.basis })), cached: g.cached, note: 'اقتراح فقط: القيم المحلية (S4) لا تتغير إلا بقرارك (API-21).' });
  }));

  r.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof CodedError) return void res.status(err.status).json({ error: err.message, code: err.code, ...err.extra });
    next(err);
  });
  return r;
}
