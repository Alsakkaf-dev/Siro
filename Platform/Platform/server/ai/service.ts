/** خدمة الذكاء: الإعدادات (في core_settings — بلا مفاتيح)، السلسلة الاحتياطية، وسقف الاستهلاك. */
import type { Db } from '../db.js';
import { getSetting, setSetting } from '../repo.js';
import { aiConfigSchema, DEFAULT_AI_CONFIG, providerSchema, rankCloudModels, type AiConfig, type AiEvent, type AiMessage, type AiProvider, type AiProviderView, type AiToolSpec } from '../../shared/ai.js';
import { streamChat } from '../../shared/aiStream.js';
import { probeOllama, resolveAuto } from './detect.js';
import type { Secrets } from './secrets.js';

const CFG_KEY = 'ai.config';
const today = (): string => new Date().toISOString().slice(0, 10);

/** مزوّد معرّف بالكامل من متغيرات البيئة (Vercel): AI_BASE_URL + AI_MODEL [+ AI_KIND, AI_TIER, AI_LABEL, AI_API_KEY] */
function envProvider(): AiProvider | null {
  const base = process.env['AI_BASE_URL'];
  const model = process.env['AI_MODEL'];
  if (!base || !model) return null;
  const r = providerSchema.safeParse({
    id: 'env',
    label: process.env['AI_LABEL'] ?? 'مزوّد الخادم',
    kind: process.env['AI_KIND'] ?? 'openai',
    tier: process.env['AI_TIER'] ?? 'free',
    base_url: base,
    model,
    enabled: true,
    browser: false,
    env: true,
  });
  return r.success ? r.data : null;
}

export function loadConfig(db: Db, secrets: Secrets): AiConfig {
  let saved: AiConfig | null = null;
  try {
    const raw = getSetting(db, CFG_KEY);
    if (raw) {
      const r = aiConfigSchema.safeParse(JSON.parse(raw));
      if (r.success) saved = r.data;
    }
  } catch {
    /* إعدادات تالفة ← الافتراضي */
  }
  const cfg: AiConfig = saved ?? structuredClone(DEFAULT_AI_CONFIG);
  // مزوّدون افتراضيون جدد (بعد تحديث) يُضافون دون لمس إعدادات المستخدم
  for (const d of DEFAULT_AI_CONFIG.providers) {
    if (!cfg.providers.some((p) => p.id === d.id)) {
      cfg.providers.push(structuredClone(d));
      if (!cfg.order.includes(d.id)) cfg.order.push(d.id);
    }
  }
  cfg.providers = cfg.providers.filter((p) => !p.env);
  const env = envProvider();
  if (env) {
    cfg.providers.unshift(env);
    cfg.order = ['env', ...cfg.order.filter((x) => x !== 'env')];
  }
  // مفتاح في البيئة ولم يحفظ المستخدم إعداداته بعد = نية واضحة لتفعيله
  if (!saved) for (const p of cfg.providers) if (!p.env && p.tier !== 'local' && secrets.fromEnv(p.id) && p.model) p.enabled = true;
  // الأونلاين: Ollama «على الجهاز» يعني جهاز Vercel — لا وجود له
  if (process.env['PLATFORM_ONLINE'] === '1') for (const p of cfg.providers) if (p.id === 'ollama') p.enabled = false;
  cfg.order = [...cfg.order.filter((id) => cfg.providers.some((p) => p.id === id)), ...cfg.providers.filter((p) => !cfg.order.includes(p.id)).map((p) => p.id)];
  return cfg;
}

export function saveConfig(db: Db, cfg: AiConfig): void {
  const clean = { ...cfg, providers: cfg.providers.filter((p) => !p.env) };
  setSetting(db, CFG_KEY, JSON.stringify(aiConfigSchema.parse(clean)));
}

export function viewOf(p: AiProvider, secrets: Secrets): AiProviderView {
  const needs = p.kind !== 'ollama';
  const has = secrets.has(p.id);
  let why: string | undefined;
  if (!p.enabled) why = 'معطّل';
  else if (needs && !has) why = 'يحتاج مفتاح API';
  else if (!p.model) why = 'اختر الموديل';
  return { ...p, has_key: has, needs_key: needs, usable: !why, ...(why ? { why } : {}) };
}

/* ───── الاستهلاك اليومي (للمدفوع فقط) ───── */
export function usageToday(db: Db): number {
  return Number(getSetting(db, `ai.usage.${today()}`) ?? 0) || 0;
}
export function addUsage(db: Db, n: number): void {
  if (n > 0) setSetting(db, `ai.usage.${today()}`, String(usageToday(db) + n));
}

const cloudModels = new Map<string, { at: number; ids: string[] }>();
/** موديلات رفضها الحساب (مثل «Free tier users do not have access») — لا نعيد تجربتها، ونتذكر أول موديل نجح */
const blockedModels = new Set<string>();
const workingModel = new Map<string, string>();
const isTierDenial = (msg: string): boolean => /(free tier|do not have access|not available on your plan|model.*not.*(allowed|permitted))/i.test(msg);
/** المزوّدات التي تُحسب ضمن السقف اليومي: المدفوعة + بوابة Vercel */
const metered = (p: AiProvider): boolean => p.tier === 'paid' || /ai-gateway\.vercel\.sh/i.test(p.base_url);

export async function modelFor(p: AiProvider, key?: string | null): Promise<string> {
  if (p.kind === 'openai' && p.model === 'auto') {
    const hit = cloudModels.get(p.base_url);
    let ids = hit && Date.now() - hit.at < 3_600_000 ? hit.ids : null;
    if (!ids) {
      const r = await fetch(`${p.base_url.replace(/\/+$/, '')}/models`, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`تعذّر جلب قائمة الموديلات (${r.status})`);
      const j = (await r.json()) as { data?: { id?: string }[] };
      ids = (j.data ?? []).map((m) => m.id ?? '').filter(Boolean);
      cloudModels.set(p.base_url, { at: Date.now(), ids });
    }
    const w = workingModel.get(p.base_url);
    if (w && !blockedModels.has(`${p.base_url}|${w}`)) return w;
    const m = rankCloudModels(ids).find((id) => !blockedModels.has(`${p.base_url}|${id}`));
    if (!m) throw new Error('لا يوجد موديل متاح لحسابك عند هذا المزوّد');
    return m;
  }
  if (p.kind === 'ollama' && (p.model === 'auto' || !p.model)) {
    const probe = await probeOllama(p.base_url);
    if (!probe.reachable) throw new Error('Ollama غير شغّال على هذا الجهاز (ثبّته من ollama.com ثم شغّله)');
    const r = resolveAuto(probe);
    if (!r.installed) throw new Error(`لا يوجد موديل مثبّت. شغّل: ollama pull ${r.model}`);
    return r.model;
  }
  return p.model;
}

export interface ChatOpts { messages: AiMessage[]; tools: AiToolSpec[]; max_tokens: number; provider?: string | undefined; signal: AbortSignal; allowPaid?: boolean }

/** يجرب المزوّدين بالترتيب؛ ينتقل للتالي فقط إن فشل قبل أن يُخرج أي محتوى. */
export async function* chatWithFallback(db: Db, secrets: Secrets, o: ChatOpts): AsyncGenerator<AiEvent> {
  const cfg = loadConfig(db, secrets);
  const byId = new Map(cfg.providers.map((p) => [p.id, p]));
  const ids = o.provider ? [o.provider] : cfg.order;
  const cands = ids.map((id) => byId.get(id)).filter((p): p is AiProvider => !!p && !p.browser && viewOf(p, secrets).usable);
  if (!cands.length) {
    yield { type: 'error', error: 'لا يوجد مزوّد ذكاء جاهز. افتح الإعدادات ← الذكاء: شغّل Ollama على جهازك أو أضف مفتاح مزوّد.' };
    return;
  }
  const errors: string[] = [];
  for (const p of cands) {
    if (p.tier === 'paid' && o.allowPaid === false) {
      errors.push(`${p.label}: مدفوع — لا يُستخدم في الخلفية`);
      continue;
    }
    if (metered(p)) {
      if (cfg.daily_token_cap > 0 && usageToday(db) >= cfg.daily_token_cap) {
        errors.push(`${p.label}: بلغت السقف اليومي (${cfg.daily_token_cap.toLocaleString('en')} توكن)`);
        continue;
      }
    }
    // «auto» عند بوابة سحابية: إن رفض الحساب موديلًا نجرب التالي (حتى 8 مرشحين) ونتذكر الذي نجح
    for (let tryN = 0; tryN < 8; tryN++) {
      let emitted = false;
      let retry = false;
      let model = '';
      const attempt = new AbortController();
      const onAbort = (): void => attempt.abort();
      o.signal.addEventListener('abort', onAbort);
      // مهلة حتى أول حدث (تحميل الموديل المحلي أول مرة قد يأخذ ثوانٍ)
      const timer = setTimeout(() => attempt.abort(), p.tier === 'local' ? 90_000 : 45_000);
      try {
        model = await modelFor(p, secrets.get(p.id));
        const stream = streamChat({ kind: p.kind, base_url: p.base_url, model, key: secrets.get(p.id), messages: o.messages, tools: o.tools, max_tokens: o.max_tokens, signal: attempt.signal });
        let announced = false;
        for await (const ev of stream) {
          if (ev.type === 'error' && !emitted) throw new Error(ev.error);
          if (!announced) {
            yield { type: 'provider', id: p.id, label: p.label, model };
            announced = true;
          }
          clearTimeout(timer);
          emitted = true;
          if (ev.type === 'usage' && metered(p)) addUsage(db, ev.input + ev.output);
          yield ev;
        }
        if (!announced) yield { type: 'provider', id: p.id, label: p.label, model };
        if (p.model === 'auto') workingModel.set(p.base_url, model);
        yield { type: 'done' };
        return;
      } catch (e) {
        if (o.signal.aborted) return;
        const msg = attempt.signal.aborted ? 'انتهت المهلة' : (e as Error).message || String(e);
        if (emitted) {
          yield { type: 'error', error: `${p.label}: ${msg}` };
          return;
        }
        if (p.kind === 'openai' && p.model === 'auto' && model && isTierDenial(msg)) {
          blockedModels.add(`${p.base_url}|${model}`);
          workingModel.delete(p.base_url);
          retry = true;
        } else errors.push(`${p.label}: ${msg}`);
      } finally {
        clearTimeout(timer);
        o.signal.removeEventListener('abort', onAbort);
      }
      if (!retry) break;
      if (tryN === 7) errors.push(`${p.label}: لا يوجد موديل مسموح لحسابك بعد 8 محاولات`);
    }
  }
  yield { type: 'error', error: `تعذّر الوصول لأي مزوّد:\n${errors.join('\n')}` };
}

/** نص كامل بلا أدوات (للخلفية والاختبار) */
export async function complete(db: Db, secrets: Secrets, o: Omit<ChatOpts, 'tools'>): Promise<{ text: string; provider: string | null; error: string | null }> {
  let text = '';
  let provider: string | null = null;
  let error: string | null = null;
  for await (const ev of chatWithFallback(db, secrets, { ...o, tools: [] })) {
    if (ev.type === 'text') text += ev.text;
    else if (ev.type === 'provider') provider = `${ev.label} · ${ev.model}`;
    else if (ev.type === 'error') error = ev.error;
  }
  return { text, provider, error };
}
