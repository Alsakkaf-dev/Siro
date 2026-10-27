/** محوّلات المزوّدين: تبني الطلب وتحلّل التدفق إلى AiEvent موحّدة.
 *  مشترك: الخادم يستخدمه كبوابة، والمتصفح يستخدمه مباشرة مع Ollama على حاسوب المستخدم. fetch فقط — بلا حزم. */
import type { AiEvent, AiMessage, AiToolCall, AiToolSpec, ProviderKind } from './ai.js';

export interface StreamParams {
  kind: ProviderKind;
  base_url: string;
  model: string;
  key?: string | null;
  messages: AiMessage[];
  tools: AiToolSpec[];
  max_tokens: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

const trimSlash = (u: string): string => u.replace(/\/+$/, '');

/* ───────── بناء الطلب ───────── */
export function buildRequest(p: StreamParams): { url: string; headers: Record<string, string>; body: unknown } {
  const base = trimSlash(p.base_url);
  if (p.kind === 'ollama') {
    return {
      url: `${base}/api/chat`,
      headers: { 'content-type': 'application/json' },
      body: {
        model: p.model,
        stream: true,
        // التفكير يبطئ الموديلات الصغيرة كثيرًا ويستهلك السياق؛ الأدوات تكفي
        think: false,
        // السياق الافتراضي في Ollama صغير (2–4K) فيقطع التعليمات والأدوات بصمت
        options: { num_ctx: 16384, temperature: 0.2, num_predict: p.max_tokens },
        keep_alive: '30m',
        messages: p.messages.map((m) =>
          m.role === 'assistant'
            ? { role: 'assistant', content: m.content, ...(m.tool_calls?.length ? { tool_calls: m.tool_calls.map((c) => ({ function: { name: c.name, arguments: safeJson(c.arguments) } })) } : {}) }
            : m.role === 'tool'
              ? { role: 'tool', content: m.content, tool_name: m.name }
              : { role: m.role, content: m.content },
        ),
        ...(p.tools.length ? { tools: p.tools.map((t) => ({ type: 'function', function: t })) } : {}),
      },
    };
  }
  if (p.kind === 'openai') {
    return {
      url: `${base}/chat/completions`,
      headers: { 'content-type': 'application/json', ...(p.key ? { authorization: `Bearer ${p.key}` } : {}) },
      body: {
        model: p.model,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.2,
        max_tokens: p.max_tokens,
        messages: p.messages.map((m) =>
          m.role === 'assistant'
            ? { role: 'assistant', content: m.content || null, ...(m.tool_calls?.length ? { tool_calls: m.tool_calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } })) } : {}) }
            : m.role === 'tool'
              ? { role: 'tool', content: m.content, tool_call_id: m.tool_call_id }
              : { role: m.role, content: m.content },
        ),
        ...(p.tools.length ? { tools: p.tools.map((t) => ({ type: 'function', function: t })) } : {}),
      },
    };
  }
  // Anthropic Messages API — التعليمات والأدوات ثابتة بين الخطوات فنخزّنها مؤقتًا (prompt caching)
  const system = p.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const tools = p.tools.map((t, i) => ({ name: t.name, description: t.description, input_schema: t.parameters, ...(i === p.tools.length - 1 ? { cache_control: { type: 'ephemeral' } } : {}) }));
  return {
    url: `${base}/v1/messages`,
    headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', ...(p.key ? { 'x-api-key': p.key } : {}) },
    body: {
      model: p.model,
      stream: true,
      max_tokens: p.max_tokens,
      temperature: 0.2,
      ...(system ? { system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }] } : {}),
      ...(tools.length ? { tools } : {}),
      messages: toAnthropic(p.messages),
    },
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

/** رسائل Anthropic: نتائج الأدوات = رسالة user فيها tool_result، والأدوار المتتالية تُدمج */
export function toAnthropic(msgs: AiMessage[]): { role: 'user' | 'assistant'; content: unknown[] }[] {
  const out: { role: 'user' | 'assistant'; content: unknown[] }[] = [];
  const push = (role: 'user' | 'assistant', block: unknown): void => {
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(block);
    else out.push({ role, content: [block] });
  };
  for (const m of msgs) {
    if (m.role === 'system') continue;
    if (m.role === 'user') push('user', { type: 'text', text: m.content });
    else if (m.role === 'tool') push('user', { type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content });
    else {
      if (m.content) push('assistant', { type: 'text', text: m.content });
      for (const c of m.tool_calls ?? []) push('assistant', { type: 'tool_use', id: c.id, name: c.name, input: safeJson(c.arguments) });
    }
  }
  return out;
}

/* ───────── قراءة التدفق ───────── */
async function* lines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        yield buf.slice(0, i).replace(/\r$/, '');
        buf = buf.slice(i + 1);
      }
    }
    buf += dec.decode();
    if (buf) yield buf;
  } finally {
    reader.releaseLock();
  }
}

let seq = 0;
const callId = (): string => `call_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** محلّل Ollama الأصلي (NDJSON) */
export async function* parseOllama(src: AsyncIterable<string>): AsyncGenerator<AiEvent> {
  for await (const line of src) {
    if (!line.trim()) continue;
    let j: { message?: { content?: string; tool_calls?: { function?: { name?: string; arguments?: unknown } }[] }; done?: boolean; error?: string; prompt_eval_count?: number; eval_count?: number };
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.error) {
      yield { type: 'error', error: j.error };
      return;
    }
    if (j.message?.content) yield { type: 'text', text: j.message.content };
    for (const c of j.message?.tool_calls ?? []) {
      if (!c.function?.name) continue;
      const a = c.function.arguments;
      yield { type: 'tool_call', call: { id: callId(), name: c.function.name, arguments: typeof a === 'string' ? a : JSON.stringify(a ?? {}) } };
    }
    if (j.done) {
      yield { type: 'usage', input: j.prompt_eval_count ?? 0, output: j.eval_count ?? 0 };
      return;
    }
  }
}

/** محلّل OpenAI (SSE) — أجزاء tool_calls تُجمع حسب index */
export async function* parseOpenAI(src: AsyncIterable<string>): AsyncGenerator<AiEvent> {
  const calls = new Map<number, AiToolCall>();
  const flush = function* (): Generator<AiEvent> {
    for (const c of [...calls.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1])) if (c.name) yield { type: 'tool_call', call: { ...c, arguments: c.arguments || '{}' } };
    calls.clear();
  };
  for await (const line of src) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') break;
    let j: { choices?: { delta?: { content?: string | null; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string | null }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
    try {
      j = JSON.parse(data);
    } catch {
      continue;
    }
    if (j.error) {
      yield { type: 'error', error: j.error.message ?? 'خطأ من المزوّد' };
      return;
    }
    const ch = j.choices?.[0];
    if (ch?.delta?.content) yield { type: 'text', text: ch.delta.content };
    for (const t of ch?.delta?.tool_calls ?? []) {
      const i = t.index ?? 0;
      const cur = calls.get(i) ?? { id: t.id ?? callId(), name: '', arguments: '' };
      if (t.id) cur.id = t.id;
      if (t.function?.name) cur.name += t.function.name;
      if (t.function?.arguments) cur.arguments += t.function.arguments;
      calls.set(i, cur);
    }
    if (ch?.finish_reason) yield* flush();
    if (j.usage) yield { type: 'usage', input: j.usage.prompt_tokens ?? 0, output: j.usage.completion_tokens ?? 0 };
  }
  yield* flush();
}

/** محلّل Anthropic (SSE بأحداث مسمّاة) */
export async function* parseAnthropic(src: AsyncIterable<string>): AsyncGenerator<AiEvent> {
  const blocks = new Map<number, AiToolCall>();
  let input = 0;
  let output = 0;
  for await (const line of src) {
    if (!line.startsWith('data:')) continue;
    let j: { type?: string; index?: number; content_block?: { type?: string; id?: string; name?: string }; delta?: { type?: string; text?: string; partial_json?: string }; message?: { usage?: { input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number } }; usage?: { output_tokens?: number }; error?: { message?: string } };
    try {
      j = JSON.parse(line.slice(5).trim());
    } catch {
      continue;
    }
    switch (j.type) {
      case 'message_start': {
        const u = j.message?.usage;
        input = (u?.input_tokens ?? 0) + (u?.cache_read_input_tokens ?? 0) + (u?.cache_creation_input_tokens ?? 0);
        break;
      }
      case 'content_block_start':
        if (j.content_block?.type === 'tool_use') blocks.set(j.index ?? 0, { id: j.content_block.id ?? callId(), name: j.content_block.name ?? '', arguments: '' });
        break;
      case 'content_block_delta':
        if (j.delta?.type === 'text_delta' && j.delta.text) yield { type: 'text', text: j.delta.text };
        else if (j.delta?.type === 'input_json_delta') {
          const b = blocks.get(j.index ?? 0);
          if (b) b.arguments += j.delta.partial_json ?? '';
        }
        break;
      case 'content_block_stop': {
        const b = blocks.get(j.index ?? 0);
        if (b) {
          yield { type: 'tool_call', call: { ...b, arguments: b.arguments || '{}' } };
          blocks.delete(j.index ?? 0);
        }
        break;
      }
      case 'message_delta':
        output = j.usage?.output_tokens ?? output;
        break;
      case 'error':
        yield { type: 'error', error: j.error?.message ?? 'خطأ من Anthropic' };
        return;
      case 'message_stop':
        yield { type: 'usage', input, output };
        return;
    }
  }
}

/** يرسل الطلب ويُرجع أحداثًا موحّدة. يرمي عند فشل الاتصال أو رمز HTTP غير ناجح (ليجرّب المستدعي المزوّد التالي). */
export async function* streamChat(p: StreamParams): AsyncGenerator<AiEvent> {
  const r = buildRequest(p);
  const f = p.fetchImpl ?? fetch;
  const res = await f(r.url, { method: 'POST', headers: r.headers, body: JSON.stringify(r.body), ...(p.signal ? { signal: p.signal } : {}) });
  if (!res.ok || !res.body) {
    let msg = '';
    try {
      msg = (await res.text()).slice(0, 300);
    } catch {
      /* لا شيء */
    }
    throw new ProviderError(res.status, describeHttp(res.status, msg));
  }
  const src = lines(res.body);
  yield* p.kind === 'ollama' ? parseOllama(src) : p.kind === 'openai' ? parseOpenAI(src) : parseAnthropic(src);
}

export class ProviderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function describeHttp(status: number, body: string): string {
  let detail = body;
  try {
    const j = JSON.parse(body) as { error?: string | { message?: string } };
    detail = typeof j.error === 'string' ? j.error : j.error?.message ?? body;
  } catch {
    /* نص خام */
  }
  if (status === 401 || status === 403) return `المفتاح مرفوض (${status})`;
  if (status === 404 && /model/i.test(detail)) return `الموديل غير موجود: ${detail}`;
  if (status === 429) return 'تجاوزت حد الطلبات عند المزوّد — حاول بعد قليل';
  return `خطأ ${status}${detail ? `: ${detail.slice(0, 160)}` : ''}`;
}
