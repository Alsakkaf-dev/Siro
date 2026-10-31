/** عميل نواة الذكاء: إعدادات/حالة/محادثات عبر /api/ai، والنقل (بوابة الخادم أو Ollama مباشرة من المتصفح). */
import { ApiError } from '../lib/api.js';
import type { AiConfig, AiEvent, AiMessage, AiProviderView, AiRun, AiStatus, AiThread, AiToolSpec, UndoOp } from '../../../shared/ai.js';
import { streamChat } from '../../../shared/aiStream.js';
import { pickInstalled } from '../../../shared/ai.js';

const KEY_LS = 'platform.ai.access';
export function accessKey(): string {
  try {
    return localStorage.getItem(KEY_LS) ?? '';
  } catch {
    return '';
  }
}
export function setAccessKey(v: string): void {
  try {
    if (v) localStorage.setItem(KEY_LS, v);
    else localStorage.removeItem(KEY_LS);
  } catch {
    /* تجاهل */
  }
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const k = accessKey();
  if (k) headers['x-ai-key'] = k;
  const res = await fetch(url, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ليس JSON */
  }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; fields?: Record<string, string> };
    throw new ApiError(res.status, d.error ?? `خطأ ${res.status}`, d.fields ?? {});
  }
  return data as T;
}

export const ai = {
  gate: () => call<{ online: boolean; gated: boolean; configured: boolean }>('GET', '/api/ai/gate'),
  status: () => call<AiStatus>('GET', '/api/ai/status'),
  saveConfig: (c: AiConfig) => call<{ ok: boolean }>('PUT', '/api/ai/config', c),
  setKey: (id: string, key: string) => call<{ ok: boolean; ephemeral: boolean }>('PUT', `/api/ai/keys/${encodeURIComponent(id)}`, { key }),
  delKey: (id: string) => call<{ ok: boolean }>('DELETE', `/api/ai/keys/${encodeURIComponent(id)}`),
  models: (id: string) => call<{ models: string[] }>('GET', `/api/ai/models/${encodeURIComponent(id)}`),
  test: (id: string) => call<{ ok: boolean; ms: number; provider: string | null; text: string; error: string | null }>('POST', `/api/ai/test/${encodeURIComponent(id)}`),
  threads: () => call<AiThread[]>('GET', '/api/ai/threads'),
  thread: (id: string) => call<AiThread & { messages: AiMessage[]; runs: AiRun[] }>('GET', `/api/ai/threads/${encodeURIComponent(id)}`),
  saveThread: (id: string, b: { title: string; context_ref: string | null; messages: AiMessage[] }) => call<{ ok: boolean }>('PUT', `/api/ai/threads/${encodeURIComponent(id)}`, b),
  delThread: (id: string) => call<{ ok: boolean }>('DELETE', `/api/ai/threads/${encodeURIComponent(id)}`),
  addRun: (thread: string, b: { tool: string; args: string; summary: string; status: AiRun['status']; undo: UndoOp | null }) => call<{ id: string }>('POST', `/api/ai/threads/${encodeURIComponent(thread)}/runs`, b),
  setRun: (id: string, status: AiRun['status']) => call<{ ok: boolean }>('PATCH', `/api/ai/runs/${encodeURIComponent(id)}`, { status }),
  runs: () => call<AiRun[]>('GET', '/api/ai/runs'),
};

/** قراءة SSE من بوابة الخادم */
async function* sse(res: Response, signal: AbortSignal): AsyncGenerator<AiEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  // الإيقاف عبر إلغاء القارئ (لا signal على fetch: Chromium يَسِم الطلب المقروء كاملًا «ملغى» عند إرفاقه)
  const stop = (): void => void reader.cancel().catch(() => undefined);
  signal.addEventListener('abort', stop, { once: true });
  try {
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      if (signal.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i);
        buf = buf.slice(i + 2);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data:')) continue;
          try {
            yield JSON.parse(line.slice(5).trim()) as AiEvent;
          } catch {
            /* سطر تالف */
          }
        }
      }
    }
  } finally {
    signal.removeEventListener('abort', stop);
    reader.releaseLock();
  }
}

export interface Transport {
  chat: (messages: AiMessage[], tools: AiToolSpec[], signal: AbortSignal) => AsyncGenerator<AiEvent>;
}

/** ينتقي النقل: المزوّد «من المتصفح» (Ollama على حاسوب المستخدم) إن كان الأول الجاهز في الترتيب، وإلا بوابة الخادم. */
export function transportFor(status: AiStatus | null): Transport {
  const first = status ? firstUsable(status) : null;
  if (!first?.browser) return serverTransport();
  const b = browserTransport(first);
  const s = serverTransport();
  const hasServerProvider = !!status?.config.providers.some((p) => p.usable && !p.browser);
  // المتصفح أولًا؛ إن فشل قبل أي محتوى ننتقل لبوابة الخادم (السلسلة الاحتياطية نفسها)
  return {
    async *chat(messages, tools, signal) {
      let started = false;
      let firstError: string | null = null;
      for await (const ev of b.chat(messages, tools, signal)) {
        if (!started && ev.type === 'error') {
          firstError = ev.error;
          break;
        }
        if (ev.type !== 'provider') started = true;
        yield ev;
      }
      if (firstError === null) return;
      if (!hasServerProvider) {
        yield { type: 'error', error: firstError };
        return;
      }
      yield* s.chat(messages, tools, signal);
    },
  };
}

export function firstUsable(st: AiStatus): AiProviderView | null {
  const by = new Map(st.config.providers.map((p) => [p.id, p]));
  for (const id of st.config.order) {
    const p = by.get(id);
    if (p?.usable) return p;
  }
  return null;
}

export function serverTransport(): Transport {
  return {
    async *chat(messages, tools, signal) {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const k = accessKey();
      if (k) headers['x-ai-key'] = k;
      if (signal.aborted) return;
      const res = await fetch('/api/ai/chat', { method: 'POST', headers, body: JSON.stringify({ messages, tools }) });
      if (!res.ok) {
        let msg = `خطأ ${res.status}`;
        try {
          msg = ((await res.json()) as { error?: string }).error ?? msg;
        } catch {
          /* لا شيء */
        }
        yield { type: 'error', error: msg };
        return;
      }
      yield* sse(res, signal);
    },
  };
}

/** Ollama على حاسوب المستخدم مباشرة من المتصفح (يتطلب OLLAMA_ORIGINS للنسخة الأونلاين) */
export function browserTransport(p: AiProviderView): Transport {
  let resolved: string | null = p.model && p.model !== 'auto' ? p.model : null;
  return {
    async *chat(messages, tools, signal) {
      try {
        if (!resolved) {
          const r = await fetch(`${p.base_url.replace(/\/+$/, '')}/api/tags`, { signal });
          const j = (await r.json()) as { models?: { name: string; size?: number }[] };
          const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
          resolved = pickInstalled((j.models ?? []).map((m) => ({ name: m.name, size_gb: (m.size ?? 0) / 1024 ** 3 })), Math.max(mem, 8));
          if (!resolved) throw new Error('لا يوجد موديل مثبّت في Ollama على حاسوبك. شغّل: ollama pull qwen3.5:4b');
        }
        yield { type: 'provider', id: p.id, label: p.label, model: resolved };
        yield* streamChat({ kind: 'ollama', base_url: p.base_url, model: resolved, messages, tools, max_tokens: 2048, signal });
        yield { type: 'done' };
      } catch (e) {
        if (signal.aborted) return;
        const m = (e as Error).message;
        yield { type: 'error', error: /fetch|network|Failed/i.test(m) ? 'تعذّر الوصول إلى Ollama على حاسوبك. تأكد أنه يعمل وأن OLLAMA_ORIGINS يسمح لهذا الموقع (انظر الإعدادات ← الذكاء).' : m };
      }
    },
  };
}
