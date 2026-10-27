/** حلقة الوكيل + السجل + المحوّلات (وحدات بلا خادم): الصلاحيات، التأكيد، الرفض، الحماية من الحلقات، التوجيه للموديلات الصغيرة. */
import { describe, expect, it, vi } from 'vitest';
import { runTurn, textToolCalls, trimHistory, MAX_STEPS, type AgentEnv, type ToolCard } from '../web/src/ai/agent.js';
import type { Transport } from '../web/src/ai/client.js';
import { TOOL_DEFS, routeTools, specOf, TOOL_BY_NAME } from '../shared/aiTools.js';
import { TOOL_IMPLS } from '../web/src/ai/tools.js';
import { isSmallModel, paramsOf, pickCloudModel, pickInstalled, recommendModel, stripThinking, type AiEvent, type AiMessage } from '../shared/ai.js';
import { buildRequest, parseOpenAI, toAnthropic } from '../shared/aiStream.js';
import { dayTable } from '../web/src/ai/prompt.js';

/** نقل وهمي: كل خطوة = قائمة أحداث */
function scripted(steps: AiEvent[][]): Transport & { seen: AiMessage[][]; tools: string[][] } {
  let i = 0;
  const t = {
    seen: [] as AiMessage[][],
    tools: [] as string[][],
    async *chat(messages: AiMessage[], tools: { name: string }[]) {
      t.seen.push(messages);
      t.tools.push(tools.map((x) => x.name));
      yield { type: 'provider', id: 'm', label: 'mock', model: 'qwen3.5:4b' } as AiEvent;
      for (const ev of steps[Math.min(i, steps.length - 1)]!) yield ev;
      i++;
    },
  };
  return t;
}
const call = (name: string, args: unknown, id = name): AiEvent => ({ type: 'tool_call', call: { id, name, arguments: JSON.stringify(args) } });
const text = (s: string): AiEvent => ({ type: 'text', text: s });

function env(tr: Transport, over: Partial<AgentEnv> = {}): AgentEnv & { cards: ToolCard[]; navs: string[] } {
  const cards: ToolCard[] = [];
  const navs: string[] = [];
  return {
    transport: tr,
    toolBudget: null,
    path: '/',
    policy: 'ask',
    ctx: { nav: (p) => navs.push(p), activeSemesterId: null, today: '2026-10-27' },
    signal: new AbortController().signal,
    onProvider: () => undefined,
    onText: () => undefined,
    onCard: (c) => cards.push({ ...c }),
    confirm: async () => true,
    recordRun: async () => 'run1',
    cards,
    navs,
    ...over,
  };
}

describe('agent loop', () => {
  it('runs a read tool, feeds the result back, and stops on the final answer', async () => {
    const tr = scripted([[call('open_page', { path: '/week' })], [text('فتحت لك الأسبوع.')]]);
    const e = env(tr);
    const r = await runTurn([], 'افتح الأسبوع', 'SYS', e);
    expect(e.navs).toEqual(['/week']);
    expect(r.error).toBeNull();
    expect(r.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool', 'assistant']);
    expect(JSON.parse((r.messages[2] as { content: string }).content)).toEqual({ ok: true, result: 'Opened /week' });
    expect(tr.seen[1]![0]).toEqual({ role: 'system', content: 'SYS' });
    expect(tr.seen[1]!.at(-1)!.role).toBe('tool');
  });

  it('destructive tools always ask — even with policy "auto" — and a refusal is reported to the model', async () => {
    const confirm = vi.fn(async () => false);
    const tr = scripted([[call('delete_items', { ids: ['a', 'b'] })], [text('حسنًا، لم أحذف شيئًا.')]]);
    const e = env(tr, { policy: 'auto', confirm });
    const r = await runTurn([], 'احذف', 'S', e);
    expect(confirm).toHaveBeenCalledOnce();
    const card = e.cards.at(-1)!;
    expect(card.status).toBe('denied');
    expect(card.preview).toContain('حذف 2');
    const tool = JSON.parse((r.messages[2] as { content: string }).content);
    expect(tool.ok).toBe(false);
    expect(tool.error).toMatch(/declined/);
  });

  it('write tools ask under policy "ask" and run directly under "auto"', async () => {
    const run = vi.spyOn(TOOL_IMPLS.open_page, 'run');
    // أداة كتابة بلا شبكة: نستبدل تنفيذها مؤقتًا
    const orig = TOOL_IMPLS.backup_now.run;
    TOOL_IMPLS.backup_now.run = async () => ({ data: { name: 'b1' }, summary: 'نسخة', undo: null });
    try {
      const askConfirm = vi.fn(async () => true);
      await runTurn([], 'نسخة', 'S', env(scripted([[call('backup_now', {})], [text('تم')]]), { confirm: askConfirm }));
      expect(askConfirm).toHaveBeenCalledOnce();
      const autoConfirm = vi.fn(async () => true);
      const e = env(scripted([[call('backup_now', {})], [text('تم')]]), { policy: 'auto', confirm: autoConfirm });
      await runTurn([], 'نسخة', 'S', e);
      expect(autoConfirm).not.toHaveBeenCalled();
      expect(e.cards.at(-1)).toMatchObject({ status: 'done', summary: 'نسخة', runId: 'run1' });
    } finally {
      TOOL_IMPLS.backup_now.run = orig;
      run.mockRestore();
    }
  });

  it('invalid arguments and unknown tools are returned to the model for self-correction', async () => {
    const tr = scripted([[call('open_page', { path: 'no-slash' }, 'a'), call('fly_to_moon', {}, 'b')], [text('خطأ')]]);
    const r = await runTurn([], 'x', 'S', env(tr));
    const [a, b] = r.messages.filter((m) => m.role === 'tool').map((m) => JSON.parse(m.content));
    expect(a.error).toMatch(/Invalid arguments: path/);
    expect(b.error).toMatch(/Unknown tool/);
  });

  it('stops identical repeated calls and caps the number of steps', async () => {
    const loop = scripted([[call('open_page', { path: '/' })]]);
    const r = await runTurn([], 'x', 'S', env(loop));
    expect(loop.seen.length).toBe(MAX_STEPS);
    expect(r.messages.filter((m) => m.role === 'tool').some((m) => /Repeated identical call/.test(m.content))).toBe(true);
    expect(r.messages.at(-1)!.content).toContain('توقفت');
  });

  it('recovers tool calls a small model wrote as text (<tool_call> or bare JSON)', async () => {
    expect(textToolCalls('<tool_call>{"name":"open_page","arguments":{"path":"/life"}}</tool_call>')[0]).toMatchObject({ name: 'open_page', arguments: '{"path":"/life"}' });
    expect(textToolCalls('```json\n{"name":"agenda","arguments":{"days":3}}\n```')[0]).toMatchObject({ name: 'agenda' });
    expect(textToolCalls('{"name":"not_a_tool"}')).toEqual([]);
    expect(textToolCalls('جملة عادية')).toEqual([]);
    const tr = scripted([[text('<tool_call>{"name":"open_page","arguments":{"path":"/sports"}}</tool_call>')], [text('تم')]]);
    const e = env(tr);
    await runTurn([], 'x', 'S', e);
    expect(e.navs).toEqual(['/sports']);
  });

  it('long histories are trimmed to start at a user turn (no orphan tool results)', () => {
    const h: AiMessage[] = [];
    for (let i = 0; i < 30; i++) h.push({ role: 'user', content: `u${i}` }, { role: 'assistant', content: '', tool_calls: [{ id: `c${i}`, name: 'agenda', arguments: '{}' }] }, { role: 'tool', tool_call_id: `c${i}`, name: 'agenda', content: '{}' }, { role: 'assistant', content: `a${i}` });
    const t = trimHistory(h);
    expect(t.length).toBeLessThanOrEqual(30);
    expect(t[0]!.role).toBe('user');
    expect(t.at(-1)).toEqual({ role: 'assistant', content: 'a29' });
    expect(trimHistory(h.slice(0, 8))).toHaveLength(8);
  });

  it('a provider error before any output is surfaced', async () => {
    const r = await runTurn([], 'x', 'S', env(scripted([[{ type: 'error', error: 'لا مزوّد' }]])));
    expect(r.error).toBe('لا مزوّد');
  });

  it('small models get a routed subset of tools; big models get all', async () => {
    const small = scripted([[text('.')]]);
    await runTurn([], 'أضف كويز لمادة الشبكات يوم الخميس بوزن 5%', 'S', env(small, { toolBudget: 9, path: '/academic' }));
    const names = small.tools[0]!;
    expect(names.length).toBeLessThanOrEqual(12);
    expect(names).toEqual(expect.arrayContaining(['add_assessment', 'course_details', 'search', 'open_page', 'agenda']));
    expect(names).not.toContain('sports_set_day');
    const big = scripted([[text('.')]]);
    await runTurn([], 'x', 'S', env(big));
    expect(big.tools[0]!.length).toBe(TOOL_DEFS.length);
  });
});

describe('tool registry', () => {
  it('every tool has an implementation, a valid object JSON schema and an Arabic label', () => {
    for (const d of TOOL_DEFS) {
      expect(TOOL_IMPLS[d.name as keyof typeof TOOL_IMPLS]).toBeDefined();
      const s = specOf(d);
      expect(s.parameters['type']).toBe('object');
      expect(s.parameters['$schema']).toBeUndefined();
      expect(d.label).toMatch(/[؀-ۿ]/);
      if (d.tier !== 'read') expect(s.description).toMatch(/changes data|DESTRUCTIVE/);
    }
    expect(Object.keys(TOOL_IMPLS).sort()).toEqual(TOOL_DEFS.map((d) => d.name).sort());
  });

  it('forbidden capabilities are not exposed at all (restore, import, settings, keys)', () => {
    for (const n of TOOL_BY_NAME.keys()) expect(n).not.toMatch(/restore|import|setting|key|purge/);
  });

  it('routing keeps line tools for the current page', () => {
    const r = routeTools('صليت الفجر', '/life', 9).map((t) => t.name);
    expect(r).toContain('life_log');
    expect(routeTools('لخص هذا الملف', '/library/f/x', 9).map((t) => t.name)).toContain('library_read');
  });
});

describe('model selection + adapters', () => {
  it('recommends Qwen3.5 sizes by memory and picks the best installed Qwen', () => {
    expect(recommendModel(4)).toBe('qwen3.5:2b');
    expect(recommendModel(8)).toBe('qwen3.5:4b');
    expect(recommendModel(32)).toBe('qwen3.5:9b');
    expect(pickInstalled([{ name: 'qwen2.5:3b', size_gb: 1.9 }, { name: 'qwen3.5:4b', size_gb: 3.3 }, { name: 'llama3.2:3b', size_gb: 2 }], 8)).toBe('qwen3.5:4b');
    expect(pickInstalled([{ name: 'qwen3.5:9b', size_gb: 6.6 }, { name: 'qwen3.5:4b', size_gb: 3.3 }], 8)).toBe('qwen3.5:4b'); // 9B لا يتسع في 8GB
    expect(pickInstalled([{ name: 'qwen2.5:3b', size_gb: 1.9 }], 8)).toBe('qwen2.5:3b'); // «qwen-3b» الموجود عند المستخدم
    expect(pickInstalled([{ name: 'nomic-embed-text', size_gb: 0.3 }, { name: 'gemma4:e4b', size_gb: 3 }], 8)).toBe('gemma4:e4b');
    expect(pickInstalled([], 8)).toBeNull();
    expect(paramsOf('qwen3.5:4b')).toBe(4);
    expect(isSmallModel('qwen3.5:9b', 'local')).toBe(false);
    expect(isSmallModel('qwen3.5:2b', 'local')).toBe(true);
    expect(isSmallModel('claude-opus-5-5', 'paid')).toBe(false);
  });

  it('«auto» on a cloud gateway picks the newest text Qwen', () => {
    expect(pickCloudModel(['openai/gpt-6', 'alibaba/qwen3-coder', 'alibaba/qwen-3-32b', 'alibaba/qwen3.5-plus', 'alibaba/qwen3-vl-instruct', 'alibaba/qwen3.5-max'])).toBe('alibaba/qwen3.5-max');
    expect(pickCloudModel(['alibaba/qwen-3-14b', 'alibaba/qwen-3-235b'])).toBe('alibaba/qwen-3-235b');
    expect(pickCloudModel(['openai/gpt-6', 'x/embed'])).toBe('openai/gpt-6');
    expect(pickCloudModel([])).toBeNull();
  });

  it('strips Qwen thinking blocks', () => {
    expect(stripThinking('<think>hmm\n</think>\nالجواب')).toBe('الجواب');
    expect(stripThinking('<think>still thinking')).toBe('');
  });

  it('Ollama request: native /api/chat, tool args as objects, tool_name on results', () => {
    const r = buildRequest({ kind: 'ollama', base_url: 'http://x:11434/', model: 'qwen3.5:4b', max_tokens: 100, tools: [], messages: [{ role: 'assistant', content: '', tool_calls: [{ id: '1', name: 'search', arguments: '{"query":"a"}' }] }, { role: 'tool', tool_call_id: '1', name: 'search', content: 'r' }] });
    expect(r.url).toBe('http://x:11434/api/chat');
    const b = r.body as { messages: unknown[]; think: boolean };
    expect(b.messages[0]).toEqual({ role: 'assistant', content: '', tool_calls: [{ function: { name: 'search', arguments: { query: 'a' } } }] });
    expect(b.messages[1]).toEqual({ role: 'tool', content: 'r', tool_name: 'search' });
  });

  it('Anthropic: consecutive tool results merge into one user turn', () => {
    const m = toAnthropic([
      { role: 'user', content: 'q' },
      { role: 'assistant', content: 'x', tool_calls: [{ id: 'a', name: 's', arguments: '{}' }, { id: 'b', name: 's', arguments: '{}' }] },
      { role: 'tool', tool_call_id: 'a', name: 's', content: '1' },
      { role: 'tool', tool_call_id: 'b', name: 's', content: '2' },
    ]);
    expect(m.map((x) => [x.role, x.content.length])).toEqual([['user', 1], ['assistant', 3], ['user', 2]]);
  });

  it('OpenAI parser flushes multiple parallel tool calls in index order', async () => {
    async function* src() {
      yield 'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"y","function":{"name":"agenda","arguments":"{}"}}]}}]}';
      yield 'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"x","function":{"name":"search","arguments":"{\\"query\\":\\"a\\"}"}}]}}]}';
      yield 'data: [DONE]';
    }
    const out: AiEvent[] = [];
    for await (const e of parseOpenAI(src())) out.push(e);
    expect(out.map((e) => (e.type === 'tool_call' ? e.call.name : e.type))).toEqual(['search', 'agenda']);
  });

  it('date table resolves weekdays for small models', () => {
    const t = dayTable('2026-10-27');
    expect(t).toContain('اليوم الثلاثاء=2026-10-27');
    expect(t).toContain('الخميس=2026-10-29');
  });
});
