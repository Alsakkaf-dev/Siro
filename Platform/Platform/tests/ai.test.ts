/** نواة الذكاء (ADR-0009): البوابة، السلسلة الاحتياطية، المحوّلات الثلاثة، المفاتيح، السقف، القفل الأونلاين، وسم actor=ai، والمحادثات. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import type { AiEvent } from '../shared/ai.js';
import { DEFAULT_AI_CONFIG } from '../shared/ai.js';

let srv: Running;
let base: string;
let dir: string;

/* ───── مزوّدون وهميون ───── */
interface Mock { port: number; hits: { path: string; body: any; headers: http.IncomingHttpHeaders }[]; mode: Record<string, string>; close: () => Promise<void> }
async function mock(): Promise<Mock> {
  const m: Mock = { port: 0, hits: [], mode: {}, close: async () => undefined };
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : null;
      m.hits.push({ path: req.url ?? '', body, headers: req.headers });
      const mode = m.mode[req.url ?? ''] ?? 'ok';
      if (mode === 'fail') return void res.writeHead(500).end('{"error":"boom"}');
      if (req.url === '/api/tags') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return void res.end(JSON.stringify({ models: [{ name: 'nomic-embed-text:latest', size: 3e8 }, { name: 'qwen2.5:3b', size: 2e9 }, { name: 'qwen3.5:4b', size: 3.2e9 }] }));
      }
      if (req.url === '/api/chat') {
        res.writeHead(200, { 'content-type': 'application/x-ndjson' });
        const hasTool = (body.messages as { role: string }[]).some((x) => x.role === 'tool');
        if (mode === 'tool' && !hasTool) {
          res.write(JSON.stringify({ message: { content: '', tool_calls: [{ function: { name: 'search', arguments: { query: 'شبكات' } } }] }, done: false }) + '\n');
        } else {
          res.write(JSON.stringify({ message: { content: 'مرحبا ' }, done: false }) + '\n');
          res.write(JSON.stringify({ message: { content: 'بك' }, done: false }) + '\n');
        }
        return void res.end(JSON.stringify({ message: { content: '' }, done: true, prompt_eval_count: 12, eval_count: 3 }) + '\n');
      }
      if (req.url === '/v1/chat/completions') {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const d = (o: unknown): boolean => res.write(`data: ${JSON.stringify(o)}\n\n`);
        d({ choices: [{ delta: { content: 'من السحابة' } }] });
        d({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'agenda', arguments: '{"da' } }] } }] });
        d({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ys":3}' } }] } }] });
        d({ choices: [{ delta: {}, finish_reason: 'tool_calls' }] });
        d({ choices: [], usage: { prompt_tokens: 50, completion_tokens: 10 } });
        return void res.end('data: [DONE]\n\n');
      }
      if (req.url === '/v1/messages') {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const e = (type: string, o: Record<string, unknown>): boolean => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...o })}\n\n`);
        e('message_start', { message: { usage: { input_tokens: 400, cache_read_input_tokens: 600 } } });
        e('content_block_start', { index: 0, content_block: { type: 'text' } });
        e('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'Claude هنا' } });
        e('content_block_stop', { index: 0 });
        e('content_block_start', { index: 1, content_block: { type: 'tool_use', id: 'tu1', name: 'add_note' } });
        e('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: '{"text":"م' } });
        e('content_block_delta', { index: 1, delta: { type: 'input_json_delta', partial_json: 'لاحظة"}' } });
        e('content_block_stop', { index: 1 });
        e('message_delta', { usage: { output_tokens: 40 } });
        e('message_stop', {});
        return void res.end();
      }
      res.writeHead(404).end();
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  m.port = (server.address() as { port: number }).port;
  m.close = () => new Promise((r) => server.close(() => r()));
  return m;
}

let M: Mock;

async function call(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(base + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}
async function chat(body: unknown): Promise<AiEvent[]> {
  const r = await call('POST', '/api/ai/chat', body);
  expect(r.status).toBe(200);
  return r.text.split('\n\n').filter((x) => x.startsWith('data:')).map((x) => JSON.parse(x.slice(5)) as AiEvent);
}

function config(over: (c: typeof DEFAULT_AI_CONFIG) => void): typeof DEFAULT_AI_CONFIG {
  const c = structuredClone(DEFAULT_AI_CONFIG);
  for (const p of c.providers) {
    if (p.id === 'ollama') p.base_url = `http://127.0.0.1:${M.port}`;
    if (p.id === 'cloud-free') Object.assign(p, { base_url: `http://127.0.0.1:${M.port}/v1`, model: 'qwen/qwen3.5-4b:free' });
    if (p.id === 'anthropic') p.base_url = `http://127.0.0.1:${M.port}`;
  }
  over(c);
  return c;
}

beforeAll(async () => {
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  M = await mock();
  dir = tmpDir();
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  await M.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe(`AI core (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('gate is open on the PC version', async () => {
    expect((await call('GET', '/api/ai/gate')).json).toEqual({ online: false, gated: false, configured: true });
  });

  it('status detects memory + installed Ollama models and picks the best Qwen (not the embedder)', async () => {
    expect((await call('PUT', '/api/ai/config', config(() => undefined))).status).toBe(200);
    const s = (await call('GET', '/api/ai/status')).json;
    expect(s.memory_gb).toBeGreaterThan(0);
    expect(s.recommended).toMatch(/^qwen3\.5:/);
    expect(s.ollama.reachable).toBe(true);
    expect(s.ollama.resolved).toBe('qwen3.5:4b');
    const ol = s.config.providers.find((p: { id: string }) => p.id === 'ollama');
    expect(ol.usable).toBe(true);
    expect(s.config.providers.find((p: { id: string }) => p.id === 'cloud-free').why).toBe('معطّل');
  });

  it('chat streams Ollama NDJSON as unified SSE events (with num_ctx and think:false)', async () => {
    M.hits = [];
    const ev = await chat({ messages: [{ role: 'user', content: 'سلام' }] });
    expect(ev[0]).toEqual({ type: 'provider', id: 'ollama', label: expect.any(String), model: 'qwen3.5:4b' });
    expect(ev.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text).join('')).toBe('مرحبا بك');
    expect(ev.at(-1)).toEqual({ type: 'done' });
    const req = M.hits.find((h) => h.path === '/api/chat')!.body;
    expect(req.think).toBe(false);
    expect(req.options.num_ctx).toBeGreaterThanOrEqual(8192);
    expect(req.model).toBe('qwen3.5:4b');
  });

  it('Ollama tool calls arrive as tool_call events with JSON-string arguments', async () => {
    M.mode['/api/chat'] = 'tool';
    const ev = await chat({ messages: [{ role: 'user', content: 'ابحث' }], tools: [{ name: 'search', description: 'x', parameters: { type: 'object' } }] });
    const tc = ev.find((e) => e.type === 'tool_call') as { call: { name: string; arguments: string } };
    expect(tc.call.name).toBe('search');
    expect(JSON.parse(tc.call.arguments)).toEqual({ query: 'شبكات' });
    delete M.mode['/api/chat'];
  });

  it('keys are stored server-side only and never returned', async () => {
    expect((await call('PUT', '/api/ai/keys/cloud-free', { key: 'sk-test-SECRET-123456' })).status).toBe(200);
    const s = await call('GET', '/api/ai/status');
    expect(s.text).not.toContain('SECRET');
    expect(s.json.config.providers.find((p: { id: string }) => p.id === 'cloud-free').has_key).toBe(true);
    expect(fs.existsSync(path.join(dir, 'data', 'ai-secrets.json'))).toBe(true);
    // ليس في القاعدة
    expect(JSON.stringify(srv.getDb().all('SELECT * FROM core_settings'))).not.toContain('SECRET');
    expect((await call('PUT', '/api/ai/keys/cloud-free', { key: 'short' })).status).toBe(400);
  });

  it('falls back to the next provider when the first fails before any output; OpenAI deltas are assembled', async () => {
    await call('PUT', '/api/ai/config', config((c) => void (c.providers.find((p) => p.id === 'cloud-free')!.enabled = true)));
    M.mode['/api/chat'] = 'fail';
    M.hits = [];
    const ev = await chat({ messages: [{ role: 'user', content: 'x' }], tools: [{ name: 'agenda', description: 'a', parameters: { type: 'object' } }] });
    expect(ev.find((e) => e.type === 'provider')).toMatchObject({ id: 'cloud-free', model: 'qwen/qwen3.5-4b:free' });
    expect(ev.find((e) => e.type === 'tool_call')).toEqual({ type: 'tool_call', call: { id: 'c1', name: 'agenda', arguments: '{"days":3}' } });
    expect(ev.find((e) => e.type === 'usage')).toEqual({ type: 'usage', input: 50, output: 10 });
    const cloud = M.hits.find((h) => h.path === '/v1/chat/completions')!;
    expect(cloud.headers['authorization']).toBe('Bearer sk-test-SECRET-123456');
    expect(cloud.body.tools[0]).toEqual({ type: 'function', function: { name: 'agenda', description: 'a', parameters: { type: 'object' } } });
    delete M.mode['/api/chat'];
  });

  it('reports every provider error when all fail', async () => {
    M.mode['/api/chat'] = 'fail';
    M.mode['/v1/chat/completions'] = 'fail';
    const ev = await chat({ messages: [{ role: 'user', content: 'x' }] });
    const err = ev.find((e) => e.type === 'error') as { error: string };
    expect(err.error).toContain('Ollama');
    expect(err.error).toContain('سحابي');
    delete M.mode['/api/chat'];
    delete M.mode['/v1/chat/completions'];
  });

  it('Anthropic (paid): converts messages, caches system+tools, parses tool_use, counts usage and enforces the daily cap', async () => {
    await call('PUT', '/api/ai/keys/anthropic', { key: 'sk-ant-test-0000000000' });
    await call('PUT', '/api/ai/config', config((c) => {
      c.providers.find((p) => p.id === 'anthropic')!.enabled = true;
      c.order = ['anthropic', 'ollama'];
      c.daily_token_cap = 1500;
    }));
    M.hits = [];
    const ev = await chat({
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'q' },
        { role: 'assistant', content: '', tool_calls: [{ id: 't0', name: 'search', arguments: '{"query":"a"}' }] },
        { role: 'tool', tool_call_id: 't0', name: 'search', content: '{"ok":true}' },
      ],
      tools: [{ name: 'add_note', description: 'n', parameters: { type: 'object' } }],
    });
    expect(ev.find((e) => e.type === 'provider')).toMatchObject({ id: 'anthropic', model: 'claude-opus-5-5' });
    expect(ev.find((e) => e.type === 'tool_call')).toEqual({ type: 'tool_call', call: { id: 'tu1', name: 'add_note', arguments: '{"text":"ملاحظة"}' } });
    const h = M.hits.find((x) => x.path === '/v1/messages')!;
    expect(h.headers['x-api-key']).toBe('sk-ant-test-0000000000');
    expect(h.headers['anthropic-version']).toBe('2023-06-01');
    expect(h.body.system[0]).toMatchObject({ text: 'sys', cache_control: { type: 'ephemeral' } });
    expect(h.body.tools[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(h.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(h.body.messages[1].content[0]).toEqual({ type: 'tool_use', id: 't0', name: 'search', input: { query: 'a' } });
    expect(h.body.messages[2].content[0]).toEqual({ type: 'tool_result', tool_use_id: 't0', content: '{"ok":true}' });
    // 400 + 600 + 40 = 1040 توكن ← السقف 1500: الطلب التالي يمر، ثم يُتجاوز
    expect((await call('GET', '/api/ai/status')).json.usage_today).toBe(1040);
    await chat({ messages: [{ role: 'user', content: 'q' }] });
    const third = await chat({ messages: [{ role: 'user', content: 'q' }] });
    expect(third.find((e) => e.type === 'provider')).toMatchObject({ id: 'ollama' }); // تجاوز السقف ← المجاني
  });

  it('test endpoint pings one provider', async () => {
    const r = await call('POST', '/api/ai/test/ollama');
    expect(r.json.ok).toBe(true);
    expect(r.json.text).toBe('مرحبا بك');
  });

  it('x-actor: ai tags history entries (academic + spaces)', async () => {
    const sems = (await call('GET', '/api/semesters')).json;
    const b = (await call('GET', `/api/semesters/${sems[0].id}`)).json;
    const course = b.courses[0];
    const a = await call('POST', `/api/courses/${course.id}/assessments`, { kind: 'quiz', title: 'كويز الذكاء', weight: 5, timing: 'unknown' }, { 'x-actor': 'ai' });
    expect(a.status).toBe(201);
    const sp = (await call('POST', '/api/wos/spaces', { name: 'مساحة AI' })).json;
    const it = (await call('POST', `/api/wos/spaces/${sp.id}/items`, { title: 'عنصر' }, { 'x-actor': 'ai' })).json;
    await call('PATCH', `/api/wos/items/${it.id}`, { title: 'عنصر معدّل' }, { 'x-actor': 'ai' });
    await call('PATCH', `/api/wos/items/${it.id}`, { title: 'عنصر بيد المستخدم' });
    const h = (await call('GET', '/api/wos/history?limit=20')).json as { ref: string; actor: string; summary: string }[];
    expect(h.find((x) => x.ref === `acad:asmt:${a.json.id}`)?.actor).toBe('ai');
    const itemH = h.filter((x) => x.ref === `wos:${it.id}`);
    expect(itemH.map((x) => x.actor)).toEqual(['user', 'ai', 'ai']);
    expect(h.find((x) => x.ref === `space:${sp.id}`)?.actor).toBe('user');
  });

  it('threads and runs persist with their undo descriptors', async () => {
    const put = await call('PUT', '/api/ai/threads/t1', { title: 'محادثة', context_ref: null, messages: [{ role: 'user', content: 'أضف' }, { role: 'assistant', content: 'تم' }] });
    expect(put.status).toBe(200);
    const run = await call('POST', '/api/ai/threads/t1/runs', { tool: 'add_note', args: '{}', summary: 'أضيفت ملاحظة', status: 'done', undo: { kind: 'call', entity: 'note', op: 'delete', id: 'n1' } });
    expect(run.status).toBe(201);
    const t = (await call('GET', '/api/ai/threads/t1')).json;
    expect(t.messages).toHaveLength(2);
    expect(t.runs[0].undo).toEqual({ kind: 'call', entity: 'note', op: 'delete', id: 'n1' });
    await call('PATCH', `/api/ai/runs/${run.json.id}`, { status: 'undone' });
    expect((await call('GET', '/api/ai/threads/t1')).json.runs[0].status).toBe('undone');
    expect((await call('GET', '/api/ai/threads')).json.map((x: { id: string }) => x.id)).toContain('t1');
    expect((await call('PUT', '/api/ai/threads/t1', { title: '', messages: [] })).status).toBe(400);
    await call('DELETE', '/api/ai/threads/t1');
    expect((await call('GET', '/api/ai/threads/t1')).status).toBe(404);
  });

  it('online: every AI route except /gate is locked behind AI_ACCESS_KEY', async () => {
    process.env['PLATFORM_ONLINE'] = '1';
    try {
      delete process.env['AI_ACCESS_KEY'];
      expect((await call('GET', '/api/ai/gate')).json).toEqual({ online: true, gated: true, configured: false });
      expect((await call('GET', '/api/ai/status')).status).toBe(503);
      process.env['AI_ACCESS_KEY'] = 'owner-pass-123';
      expect((await call('GET', '/api/ai/status')).status).toBe(401);
      expect((await call('POST', '/api/ai/chat', { messages: [{ role: 'user', content: 'x' }] }, { 'x-ai-key': 'wrong' })).status).toBe(401);
      const ok = await call('GET', '/api/ai/status', undefined, { 'x-ai-key': 'owner-pass-123' });
      expect(ok.status).toBe(200);
      // الأونلاين: «Ollama على الجهاز» = جهاز Vercel — معطّل دائمًا
      expect(ok.json.config.providers.find((p: { id: string }) => p.id === 'ollama').enabled).toBe(false);
    } finally {
      delete process.env['PLATFORM_ONLINE'];
      delete process.env['AI_ACCESS_KEY'];
    }
  });

  it('env-defined provider (Vercel) appears first and is read-only', async () => {
    process.env['AI_BASE_URL'] = `http://127.0.0.1:${M.port}/v1`;
    process.env['AI_MODEL'] = 'qwen/qwen3.5-9b';
    process.env['AI_API_KEY'] = 'env-key-0000000000';
    try {
      const s = (await call('GET', '/api/ai/status')).json;
      expect(s.config.order[0]).toBe('env');
      const p = s.config.providers.find((x: { id: string }) => x.id === 'env');
      expect(p).toMatchObject({ env: true, has_key: true, usable: true, model: 'qwen/qwen3.5-9b' });
      expect((await call('PUT', '/api/ai/keys/env', { key: 'override-000000' })).status).toBe(409);
    } finally {
      delete process.env['AI_BASE_URL'];
      delete process.env['AI_MODEL'];
      delete process.env['AI_API_KEY'];
    }
  });

  it('daily brief (background) uses only free providers and lands in the inbox once a day', async () => {
    const { maybeBrief } = await import('../server/ai/background.js');
    const { Secrets } = await import('../server/ai/secrets.js');
    const sec = new Secrets(path.join(dir, 'data', 'ai-secrets.json'));
    await call('PUT', '/api/ai/config', config((c) => {
      c.order = ['anthropic', 'ollama'];
      c.providers.find((p) => p.id === 'anthropic')!.enabled = true;
      c.daily_token_cap = 0;
    }));
    // نضمن وجود شيء في الأجندة
    const sems = (await call('GET', '/api/semesters')).json;
    const b = (await call('GET', `/api/semesters/${sems[0].id}`)).json;
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    await call('POST', `/api/courses/${b.courses[0].id}/assessments`, { kind: 'test', title: 'اختبار اليوم', weight: 10, timing: 'date', due_date: today });
    M.hits = [];
    const noon = new Date(`${today}T12:00:00`);
    expect(await maybeBrief(srv.getDb(), sec, noon)).toBe(true);
    expect(M.hits.some((h) => h.path === '/v1/messages')).toBe(false); // لا مدفوع في الخلفية
    expect(M.hits.find((h) => h.path === '/api/chat')!.body.messages[0].content).toContain('اختبار اليوم');
    expect(await maybeBrief(srv.getDb(), sec, noon)).toBe(false); // مرة واحدة يوميًا
    const inbox = (await call('GET', '/api/wos/inbox')).json as { title: string; source: string }[];
    expect(inbox.find((x) => x.source === 'ai')?.title).toContain('موجز اليوم');
  });
});
