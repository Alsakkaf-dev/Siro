/** نواة الذكاء (ADR-0009): أنواع مشتركة بين الخادم والواجهة — المزوّدون، الرسائل، الإعدادات، والأحداث المتدفقة.
 *  لا مفاتيح هنا أبدًا: المفاتيح تعيش على الخادم فقط (server/ai/secrets.ts). */
import { z } from 'zod';

/* ───────── الرسائل ───────── */
export interface AiToolCall { id: string; name: string; arguments: string }
export type AiMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; tool_calls?: AiToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string; name: string };

/** وصف أداة كما يراها الموديل (JSON Schema) */
export interface AiToolSpec { name: string; description: string; parameters: Record<string, unknown> }

/** أحداث التدفق (SSE من الخادم، أو مباشرة من المتصفح إلى Ollama) */
export type AiEvent =
  | { type: 'provider'; id: string; label: string; model: string }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; call: AiToolCall }
  | { type: 'usage'; input: number; output: number }
  | { type: 'done' }
  | { type: 'error'; error: string };

/* ───────── المزوّدون ───────── */
export const PROVIDER_KINDS = ['ollama', 'openai', 'anthropic'] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];
export const PROVIDER_TIERS = ['local', 'free', 'paid'] as const;
export type ProviderTier = (typeof PROVIDER_TIERS)[number];
export const TIER_LABEL: Record<ProviderTier, string> = { local: 'محلي مجاني', free: 'سحابي مجاني', paid: 'مدفوع' };
export const KIND_LABEL_AI: Record<ProviderKind, string> = { ollama: 'Ollama', openai: 'OpenAI-compatible', anthropic: 'Anthropic' };

const pid = z.string().regex(/^[a-z0-9-]{1,40}$/, 'معرّف غير صالح');
export const providerSchema = z.object({
  id: pid,
  label: z.string().trim().min(1).max(60),
  kind: z.enum(PROVIDER_KINDS),
  tier: z.enum(PROVIDER_TIERS),
  base_url: z.string().trim().max(300).regex(/^https?:\/\/[^\s]+$/, 'رابط غير صالح (http/https)'),
  /** «auto» لـ Ollama = أفضل Qwen مثبّت أو الموصى به حسب الذاكرة */
  model: z.string().trim().max(120),
  enabled: z.boolean(),
  /** يتصل المتصفح مباشرة (Ollama على حاسوب المستخدم من النسخة الأونلاين) — بلا مفتاح */
  browser: z.boolean().default(false),
  /** مصدره متغيرات البيئة (Vercel) — للقراءة فقط في الواجهة */
  env: z.boolean().default(false),
});
export type AiProvider = z.infer<typeof providerSchema>;

export const POLICIES = ['ask', 'auto'] as const;
export type AiPolicy = (typeof POLICIES)[number];

export const aiConfigSchema = z.object({
  providers: z.array(providerSchema).max(12),
  /** ترتيب المحاولة (سلسلة احتياطية) */
  order: z.array(pid).max(12),
  /** ask = معاينة ثم «نفّذ» لكل كتابة · auto = تنفيذ مباشر مع زر تراجع (الحذف يُسأل دائمًا) */
  policy: z.enum(POLICIES),
  /** سقف التوكنات اليومي للمزوّدات المدفوعة (0 = بلا سقف) */
  daily_token_cap: z.number().int().min(0).max(50_000_000),
  /** موجز اليوم في الخلفية (نسخة الجهاز فقط) */
  background: z.boolean(),
});
export type AiConfig = z.infer<typeof aiConfigSchema>;

export const DEFAULT_AI_CONFIG: AiConfig = {
  providers: [
    { id: 'ollama', label: 'Qwen على جهازي (Ollama)', kind: 'ollama', tier: 'local', base_url: 'http://127.0.0.1:11434', model: 'auto', enabled: true, browser: false, env: false },
    { id: 'ollama-browser', label: 'Qwen على حاسوبي (من المتصفح)', kind: 'ollama', tier: 'local', base_url: 'http://localhost:11434', model: 'auto', enabled: false, browser: true, env: false },
    { id: 'cloud-free', label: 'مزوّد سحابي مجاني', kind: 'openai', tier: 'free', base_url: 'https://openrouter.ai/api/v1', model: '', enabled: false, browser: false, env: false },
    { id: 'anthropic', label: 'Claude (Anthropic)', kind: 'anthropic', tier: 'paid', base_url: 'https://api.anthropic.com', model: 'claude-opus-5-5', enabled: false, browser: false, env: false },
    { id: 'paid-openai', label: 'مزوّد مدفوع (OpenAI-compatible)', kind: 'openai', tier: 'paid', base_url: 'https://api.openai.com/v1', model: '', enabled: false, browser: false, env: false },
  ],
  order: ['ollama', 'ollama-browser', 'cloud-free', 'anthropic', 'paid-openai'],
  policy: 'ask',
  daily_token_cap: 200_000,
  background: true,
};

export const ANTHROPIC_MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5 — الأقوى' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 — متوازن' },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 — الأسرع والأرخص' },
] as const;

/** حالة المزوّد كما تُعرض للواجهة (بلا مفتاح) */
export interface AiProviderView extends AiProvider { has_key: boolean; needs_key: boolean; usable: boolean; why?: string }
export interface AiStatus {
  online: boolean;
  /** النسخة الأونلاين تتطلب رمز دخول */
  gated: boolean;
  memory_gb: number;
  cpus: number;
  recommended: string;
  ollama: { reachable: boolean; models: { name: string; size_gb: number }[]; resolved: string | null };
  config: Omit<AiConfig, 'providers'> & { providers: AiProviderView[] };
  usage_today: number;
}

/* ───────── اختيار الموديل ───────── */
/** أقوى موديل مجاني يتسع في الذاكرة (أكتوبر 2026: عائلة Qwen3.5 — Apache-2.0، أدوات أصلية) */
export function recommendModel(memGb: number): string {
  if (memGb >= 15) return 'qwen3.5:9b';
  if (memGb >= 7) return 'qwen3.5:4b';
  return 'qwen3.5:2b';
}

/** حجم الموديل بالمليارات من وسمه (qwen3.5:4b → 4) — null إن لم يُعرف */
export function paramsOf(model: string): number | null {
  const m = /[:\-_](\d+(?:\.\d+)?)b\b/i.exec(model);
  return m ? Number(m[1]) : null;
}

/** يختار أفضل موديل مثبّت: Qwen أولًا (الأحدث ثم الأكبر الذي يتسع)، ثم أي موديل آخر */
export function pickInstalled(models: { name: string; size_gb: number }[], memGb: number): string | null {
  if (!models.length) return null;
  const fits = (m: { size_gb: number }): boolean => m.size_gb === 0 || m.size_gb < memGb * 0.75;
  const gen = (n: string): number => {
    const m = /qwen(\d+(?:\.\d+)?)/i.exec(n);
    return m ? Number(m[1]) : n.toLowerCase().startsWith('qwen') ? 1 : 0;
  };
  const embed = (n: string): boolean => /embed/i.test(n);
  const cands = models.filter((m) => !embed(m.name));
  const qwen = cands.filter((m) => /qwen/i.test(m.name) && fits(m)).sort((a, b) => gen(b.name) - gen(a.name) || (paramsOf(b.name) ?? 0) - (paramsOf(a.name) ?? 0));
  if (qwen[0]) return qwen[0].name;
  const other = cands.filter(fits).sort((a, b) => b.size_gb - a.size_gb);
  return other[0]?.name ?? cands[0]?.name ?? null;
}

/** «auto» عند مزوّد سحابي (Vercel AI Gateway / OpenRouter): أحدث Qwen نصي يدعم المحادثة؛ وإلا أول موديل */
export function pickCloudModel(ids: string[]): string | null {
  return rankCloudModels(ids)[0] ?? null;
}

/** ترتيب المرشحين: كل Qwen النصية (الأحدث فالأقوى)، ثم الموديلات الخفيفة الأخرى — لتجربتها بالترتيب حين يرفض الحساب المجاني موديلًا */
export function rankCloudModels(ids: string[]): string[] {
  const text = ids.filter((id) => !/(embed|vl|vision|image|coder|tts|audio|omni|wan|video|rerank|guard)/i.test(id));
  const gen = (id: string): number => Number(/qwen-?(\d+(?:\.\d+)?)/i.exec(id)?.[1] ?? (/qwen/i.test(id) ? 1 : 0));
  const tierOf = (id: string): number => (/max/i.test(id) ? 3 : /plus/i.test(id) ? 2 : 1) + (paramsOf(id) ?? 0) / 1000;
  const qwen = text.filter((id) => /qwen/i.test(id)).sort((a, b) => gen(b) - gen(a) || tierOf(b) - tierOf(a));
  const light = text.filter((id) => !/qwen/i.test(id) && /(flash|mini|lite|small|haiku|nano)/i.test(id));
  const out = [...qwen, ...light, ...text.filter((id) => !qwen.includes(id) && !light.includes(id))];
  return out.length ? out : ids;
}

/** الموديلات الصغيرة (≤ 4B) تأخذ مجموعة أدوات أصغر (توجيه) */
export function isSmallModel(model: string, tier: ProviderTier): boolean {
  if (tier !== 'local') return false;
  const p = paramsOf(model);
  return p === null || p <= 4.5;
}

/** يزيل كتل التفكير <think>…</think> من نص الموديل (Qwen) */
export function stripThinking(s: string): string {
  return s.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
}

/* ───────── طلب المحادثة ───────── */
export const chatRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string().max(200_000) }).passthrough()).min(1).max(200),
  tools: z.array(z.object({ name: z.string().max(64), description: z.string().max(2000), parameters: z.record(z.string(), z.unknown()) })).max(64).default([]),
  provider: pid.optional(),
  max_tokens: z.number().int().min(16).max(16_000).default(2048),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/* ───────── المحادثات المحفوظة ───────── */
export type UndoOp =
  | { kind: 'trash'; token: string }
  | { kind: 'call'; entity: string; op: string; id: string; body?: unknown }
  | { kind: 'revert'; history_id: string };
export interface AiRun { id: string; thread_id: string; tool: string; args: string; summary: string; status: 'done' | 'denied' | 'error' | 'undone'; undo: UndoOp | null; at: string }
export interface AiThread { id: string; title: string; context_ref: string | null; created_at: string; updated_at: string; messages?: AiMessage[]; runs?: AiRun[] }
