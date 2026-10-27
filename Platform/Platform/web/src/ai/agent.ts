/** حلقة الوكيل: موديل ← أدوات ← نتائج ← موديل … (حد 8 خطوات). تعمل في المتصفح؛ الأدوات تمر عبر واجهات المنصة نفسها. */
import { asAi } from '../lib/api.js';
import { stripThinking, type AiEvent, type AiMessage, type AiPolicy, type AiToolCall, type UndoOp } from '../../../shared/ai.js';
import { TOOL_BY_NAME, routeTools, specOf, type ToolDef } from '../../../shared/aiTools.js';
import { TOOL_IMPLS, ToolError, type ToolCtx, type ToolResult } from './tools.js';
import type { Transport } from './client.js';

export const MAX_STEPS = 8;

export type CardStatus = 'awaiting' | 'running' | 'done' | 'error' | 'denied' | 'undone';
export interface ToolCard { id: string; name: string; label: string; tier: ToolDef['tier']; args: string; status: CardStatus; preview?: string; summary?: string; undo?: UndoOp | null; runId?: string; refresh?: ToolResult['refresh'] }

export interface AgentEnv {
  transport: Transport;
  /** ميزانية الأدوات للموديلات الصغيرة (null = كل الأدوات) */
  toolBudget: number | null;
  path: string;
  policy: AiPolicy;
  ctx: ToolCtx;
  signal: AbortSignal;
  onProvider: (label: string, model: string) => void;
  onText: (full: string) => void;
  onCard: (c: ToolCard) => void;
  /** بداية خطوة موديل جديدة (لإظهار «يفكّر» بعد الأدوات) */
  onStep?: () => void;
  /** يعرض بطاقة تأكيد وينتظر قرار المستخدم */
  confirm: (c: ToolCard) => Promise<boolean>;
  recordRun: (c: ToolCard) => Promise<string | undefined>;
}

/** Qwen الصغير أحيانًا يكتب استدعاء الأداة نصًا بدل الحقل المخصص — نلتقطه */
export function textToolCalls(text: string): AiToolCall[] {
  const out: AiToolCall[] = [];
  const re = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = re.exec(text))) candidates.push(m[1]!);
  if (!candidates.length) {
    const t = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    if (t.startsWith('{') && t.endsWith('}')) candidates.push(t);
  }
  for (const c of candidates) {
    try {
      const j = JSON.parse(c) as { name?: string; arguments?: unknown; parameters?: unknown };
      if (j.name && TOOL_BY_NAME.has(j.name)) out.push({ id: `txt_${out.length}_${Date.now().toString(36)}`, name: j.name, arguments: JSON.stringify(j.arguments ?? j.parameters ?? {}) });
    } catch {
      /* ليس استدعاء */
    }
  }
  return out;
}

/** آخر جزء من المحادثة فقط (سياق الموديلات الصغيرة + حد الطلب)، يبدأ دائمًا برسالة مستخدم كي لا تنفصل نتيجة أداة عن استدعائها */
export function trimHistory(h: AiMessage[], max = 30): AiMessage[] {
  if (h.length <= max) return h;
  const tail = h.slice(-max);
  const i = tail.findIndex((m) => m.role === 'user');
  return i < 0 ? [] : tail.slice(i);
}

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}… [truncated]` : s);

async function execute(call: AiToolCall, env: AgentEnv): Promise<{ content: string; card: ToolCard }> {
  const def = TOOL_BY_NAME.get(call.name);
  const card: ToolCard = { id: call.id, name: call.name, label: def?.label ?? call.name, tier: def?.tier ?? 'read', args: call.arguments, status: 'running' };
  if (!def) {
    card.status = 'error';
    card.summary = `أداة غير معروفة: ${call.name}`;
    env.onCard(card);
    return { content: JSON.stringify({ ok: false, error: `Unknown tool "${call.name}". Available: ${[...TOOL_BY_NAME.keys()].join(', ')}` }), card };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(call.arguments || '{}');
  } catch {
    card.status = 'error';
    card.summary = 'وسائط غير صالحة';
    env.onCard(card);
    return { content: JSON.stringify({ ok: false, error: 'Arguments are not valid JSON. Call again with a JSON object.' }), card };
  }
  const parsed = def.schema.safeParse(raw);
  if (!parsed.success) {
    card.status = 'error';
    card.summary = 'وسائط ناقصة أو خاطئة';
    env.onCard(card);
    return { content: JSON.stringify({ ok: false, error: `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}` }), card };
  }
  const impl = TOOL_IMPLS[def.name as keyof typeof TOOL_IMPLS] as { run: (a: unknown, c: ToolCtx) => Promise<ToolResult>; preview?: (a: unknown, c: ToolCtx) => Promise<string> | string };
  const needsOk = def.tier === 'danger' || (def.tier === 'write' && env.policy === 'ask');
  if (def.tier !== 'read') {
    try {
      card.preview = impl.preview ? await impl.preview(parsed.data, env.ctx) : def.label;
    } catch (e) {
      // المعاينة تفشل غالبًا لنفس سبب التنفيذ (معرّف/مادة غير موجودة) — نعيده للموديل
      card.status = 'error';
      card.summary = (e as Error).message;
      env.onCard(card);
      return { content: JSON.stringify({ ok: false, error: (e as Error).message }), card };
    }
  }
  if (needsOk) {
    card.status = 'awaiting';
    env.onCard({ ...card });
    const ok = await env.confirm(card);
    if (!ok) {
      card.status = 'denied';
      card.summary = 'رفضتَ التنفيذ';
      env.onCard({ ...card });
      card.runId = await env.recordRun(card);
      return { content: JSON.stringify({ ok: false, error: 'The user declined this action. Do not retry it; ask briefly what to change.' }), card };
    }
    card.status = 'running';
  }
  env.onCard({ ...card });
  try {
    const r = await asAi(() => impl.run(parsed.data, env.ctx));
    card.status = 'done';
    card.summary = r.summary;
    card.undo = r.undo ?? null;
    if (r.refresh) card.refresh = r.refresh;
    if (def.tier !== 'read') card.runId = await env.recordRun(card);
    env.onCard({ ...card });
    return { content: clip(JSON.stringify({ ok: true, result: r.data }), 7000), card };
  } catch (e) {
    const msg = (e as Error).message || String(e);
    card.status = 'error';
    card.summary = msg;
    env.onCard({ ...card });
    const hint = e instanceof ToolError ? '' : ' (platform rejected it — fix the arguments or explain to the user)';
    return { content: JSON.stringify({ ok: false, error: msg + hint }), card };
  }
}

/** دور واحد للمستخدم. يعيد الرسائل الجديدة (للحفظ) والبطاقات. */
export async function runTurn(history: AiMessage[], userText: string, system: string, env: AgentEnv): Promise<{ messages: AiMessage[]; cards: ToolCard[]; error: string | null }> {
  const added: AiMessage[] = [{ role: 'user', content: userText }];
  const past = trimHistory(history);
  const cards: ToolCard[] = [];
  const tools = routeTools(userText, env.path, env.toolBudget).map(specOf);
  const seen = new Map<string, number>();
  for (let step = 0; step < MAX_STEPS; step++) {
    if (step > 0) env.onStep?.();
    const msgs: AiMessage[] = [{ role: 'system', content: system }, ...past, ...added];
    let text = '';
    const calls: AiToolCall[] = [];
    let error: string | null = null;
    try {
      for await (const ev of env.transport.chat(msgs, tools, env.signal) as AsyncGenerator<AiEvent>) {
        if (ev.type === 'provider') env.onProvider(ev.label, ev.model);
        else if (ev.type === 'text') {
          text += ev.text;
          env.onText(stripThinking(text));
        } else if (ev.type === 'tool_call') calls.push(ev.call);
        else if (ev.type === 'error') error = ev.error;
      }
    } catch (e) {
      if (env.signal.aborted) return { messages: added, cards, error: null };
      error = (e as Error).message;
    }
    if (env.signal.aborted) return { messages: added, cards, error: null };
    if (error && !text && !calls.length) return { messages: added, cards, error };
    if (!calls.length) calls.push(...textToolCalls(stripThinking(text)));
    const shown = calls.length && /<tool_call>|^\s*\{/.test(text) ? '' : stripThinking(text);
    added.push({ role: 'assistant', content: shown, ...(calls.length ? { tool_calls: calls } : {}) });
    if (!calls.length) return { messages: added, cards, error };
    for (const c of calls) {
      // حماية من الحلقات: نفس الاستدعاء 3 مرات = توقف
      const sig = `${c.name}:${c.arguments}`;
      const n = (seen.get(sig) ?? 0) + 1;
      seen.set(sig, n);
      if (n > 2) {
        added.push({ role: 'tool', tool_call_id: c.id, name: c.name, content: JSON.stringify({ ok: false, error: 'Repeated identical call. Stop calling tools and answer the user with what you have.' }) });
        continue;
      }
      const { content, card } = await execute(c, env);
      cards.push(card);
      added.push({ role: 'tool', tool_call_id: c.id, name: c.name, content });
      if (env.signal.aborted) return { messages: added, cards, error: null };
    }
  }
  added.push({ role: 'assistant', content: 'توقفت بعد عدة خطوات حتى لا أدخل في حلقة. أخبرني بما تريد إكماله.' });
  return { messages: added, cards, error: null };
}
