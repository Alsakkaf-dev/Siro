/** /api/ai — بوابة الموديل (المتصفح يدير حلقة الوكيل والأدوات؛ الخادم يمرّر ويحمي المفاتيح) + المحادثات المحفوظة. */
import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { z } from 'zod';
import type { Ctx } from '../routes.js';
import { HttpError } from '../routes.js';
import { newId } from '../repo.js';
import { workspaceOf } from '../wos/core.js';
import { parseOrThrow } from '../validation.js';
import { aiConfigSchema, chatRequestSchema, recommendModel, type AiMessage, type AiRun, type AiStatus, type AiThread, type UndoOp } from '../../shared/ai.js';
import { cpuCount, memoryGb, probeOllama, resolveAuto, clearProbeCache } from './detect.js';
import { Secrets } from './secrets.js';
import { chatWithFallback, complete, loadConfig, saveConfig, usageToday, viewOf } from './service.js';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const online = (): boolean => process.env['PLATFORM_ONLINE'] === '1';
const nowIso = (): string => new Date().toISOString();

const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function secretsFor(ctx: Ctx): Secrets {
  return new Secrets(path.join(ctx.cfg.dataDir, 'ai-secrets.json'));
}

const threadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  context_ref: z.string().max(120).nullable().default(null),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'tool']), content: z.string().max(60_000) }).passthrough()).max(400),
});
const undoSchema = z.union([
  z.object({ kind: z.literal('trash'), token: z.string().max(80) }),
  z.object({ kind: z.literal('call'), entity: z.string().max(40), op: z.string().max(40), id: z.string().max(80), body: z.unknown().optional() }),
  z.object({ kind: z.literal('revert'), history_id: z.string().max(80) }),
]);
const runSchema = z.object({
  tool: z.string().max(64),
  args: z.string().max(20_000),
  summary: z.string().max(300),
  status: z.enum(['done', 'denied', 'error', 'undone']),
  undo: undoSchema.nullable().default(null),
});

export function createAiRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = () => ctx.getDb();
  const secrets = secretsFor(ctx);

  /** حالة القفل — بلا قفل (الواجهة تعرف منها هل تطلب رمز الدخول) */
  r.get('/gate', (_req, res) => {
    res.json({ online: online(), gated: online(), configured: !online() || !!process.env['AI_ACCESS_KEY'] });
  });

  // النسخة الأونلاين بلا تسجيل دخول: لا أحد يستهلك مفاتيحك أو يقرأ محادثاتك دون رمز AI_ACCESS_KEY
  r.use((req, _res, next) => {
    if (!online()) return next();
    const key = process.env['AI_ACCESS_KEY'];
    if (!key) return next(new HttpError(503, 'الذكاء غير مفعّل في النسخة الأونلاين: أضف AI_ACCESS_KEY في إعدادات Vercel'));
    if (!safeEq(req.get('x-ai-key') ?? '', key)) return next(new HttpError(401, 'رمز دخول الذكاء غير صحيح'));
    next();
  });

  r.get('/status', wrap(async (_req, res) => {
    const cfg = loadConfig(db(), secrets);
    const local = cfg.providers.find((p) => p.id === 'ollama');
    const probe = local && !online() ? await probeOllama(local.base_url) : { reachable: false, models: [] };
    const mem = memoryGb();
    const out: AiStatus = {
      online: online(),
      gated: online(),
      memory_gb: mem,
      cpus: cpuCount(),
      recommended: recommendModel(mem),
      ollama: { ...probe, resolved: probe.reachable ? resolveAuto(probe, mem).model : null },
      config: { ...cfg, providers: cfg.providers.map((p) => viewOf(p, secrets)) },
      usage_today: usageToday(db()),
    };
    res.json(out);
  }));

  r.put('/config', wrap((req, res) => {
    const cfg = parseOrThrow(aiConfigSchema, req.body);
    saveConfig(db(), cfg);
    clearProbeCache();
    res.json({ ok: true });
  }));

  r.put('/keys/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const key = str((req.body as { key?: unknown } | undefined)?.key).trim();
    if (!/^[a-z0-9-]{1,40}$/.test(id)) throw new HttpError(400, 'معرّف غير صالح');
    if (key.length < 8 || key.length > 400 || /\s/.test(key)) throw new HttpError(400, 'مفتاح غير صالح');
    if (secrets.fromEnv(id)) throw new HttpError(409, 'هذا المفتاح معرّف في متغيرات البيئة — غيّره هناك');
    secrets.set(id, key);
    res.json({ ok: true, has_key: true, ephemeral: online() });
  }));

  r.delete('/keys/:id', wrap((req, res) => {
    secrets.del(str(req.params['id']));
    res.json({ ok: true, has_key: secrets.has(str(req.params['id'])) });
  }));

  /** الموديلات المتاحة عند مزوّد (Ollama: المثبّت · OpenAI-compatible: /models) */
  r.get('/models/:id', wrap(async (req, res) => {
    const p = loadConfig(db(), secrets).providers.find((x) => x.id === str(req.params['id']));
    if (!p) throw new HttpError(404, 'مزوّد غير موجود');
    if (p.kind === 'ollama') {
      const probe = await probeOllama(p.base_url);
      return void res.json({ models: probe.models.map((m) => m.name) });
    }
    if (p.kind === 'anthropic') return void res.json({ models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'] });
    const key = secrets.get(p.id);
    const rr = await fetch(`${p.base_url.replace(/\/+$/, '')}/models`, { headers: key ? { authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(8000) });
    if (!rr.ok) throw new HttpError(502, `تعذّر جلب الموديلات (${rr.status})`);
    const j = (await rr.json()) as { data?: { id?: string }[] };
    res.json({ models: (j.data ?? []).map((m) => m.id ?? '').filter(Boolean).slice(0, 400) });
  }));

  /** فحص سريع لمزوّد واحد */
  r.post('/test/:id', wrap(async (req, res) => {
    const t0 = Date.now();
    const ac = new AbortController();
    const out = await complete(db(), secrets, { provider: str(req.params['id']), messages: [{ role: 'user', content: 'Reply with exactly: OK' }], max_tokens: 16, signal: ac.signal });
    res.json({ ok: !out.error, ms: Date.now() - t0, provider: out.provider, text: out.text.slice(0, 80), error: out.error });
  }));

  /** المحادثة — تدفق SSE */
  r.post('/chat', wrap(async (req, res) => {
    const body = parseOrThrow(chatRequestSchema, req.body);
    const ac = new AbortController();
    res.on('close', () => {
      if (!res.writableFinished) ac.abort();
    });
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no', connection: 'keep-alive' });
    res.flushHeaders();
    const send = (ev: unknown): void => {
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
    };
    try {
      for await (const ev of chatWithFallback(db(), secrets, { messages: body.messages as AiMessage[], tools: body.tools, max_tokens: body.max_tokens, provider: body.provider, signal: ac.signal })) send(ev);
    } catch (e) {
      send({ type: 'error', error: (e as Error).message });
    }
    res.end();
  }));

  /* ───── المحادثات المحفوظة ───── */
  const ws = workspaceOf();
  const threadRow = (t: { id: string; title: string; context_ref: string | null; created_at: string; updated_at: string }): AiThread => ({ id: t.id, title: t.title, context_ref: t.context_ref, created_at: t.created_at, updated_at: t.updated_at });
  const runRow = (x: { id: string; thread_id: string; tool: string; args: string; summary: string; status: AiRun['status']; undo: string | null; at: string }): AiRun => ({ ...x, undo: x.undo ? (JSON.parse(x.undo) as UndoOp) : null });

  r.get('/threads', wrap((_req, res) => {
    res.json(db().all<{ id: string; title: string; context_ref: string | null; created_at: string; updated_at: string }>('SELECT id, title, context_ref, created_at, updated_at FROM ai_threads WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 50', ws).map(threadRow));
  }));

  r.get('/threads/:id', wrap((req, res) => {
    const t = db().get<{ id: string; title: string; context_ref: string | null; messages: string; created_at: string; updated_at: string }>('SELECT * FROM ai_threads WHERE id = ? AND workspace_id = ?', str(req.params['id']), ws);
    if (!t) throw new HttpError(404, 'المحادثة غير موجودة');
    const runs = db().all<Parameters<typeof runRow>[0]>('SELECT id, thread_id, tool, args, summary, status, undo, at FROM ai_runs WHERE thread_id = ? ORDER BY at, rowid', t.id).map(runRow);
    res.json({ ...threadRow(t), messages: JSON.parse(t.messages) as AiMessage[], runs });
  }));

  r.put('/threads/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new HttpError(400, 'معرّف غير صالح');
    const b = parseOrThrow(threadSchema, req.body);
    const at = nowIso();
    db().run(
      'INSERT INTO ai_threads (id, workspace_id, title, context_ref, messages, created_at, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, context_ref = excluded.context_ref, messages = excluded.messages, updated_at = excluded.updated_at',
      id, ws, b.title, b.context_ref, JSON.stringify(b.messages), at, at,
    );
    res.json({ ok: true, id, updated_at: at });
  }));

  r.delete('/threads/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    db().tx(() => {
      db().run('DELETE FROM ai_runs WHERE thread_id = ? AND workspace_id = ?', id, ws);
      db().run('DELETE FROM ai_threads WHERE id = ? AND workspace_id = ?', id, ws);
    });
    res.json({ ok: true });
  }));

  r.post('/threads/:id/runs', wrap((req, res) => {
    const b = parseOrThrow(runSchema, req.body);
    const id = newId();
    db().run('INSERT INTO ai_runs (id, workspace_id, thread_id, tool, args, summary, status, undo, at) VALUES (?,?,?,?,?,?,?,?,?)', id, ws, str(req.params['id']), b.tool, b.args, b.summary, b.status, b.undo ? JSON.stringify(b.undo) : null, nowIso());
    res.status(201).json({ id });
  }));

  r.patch('/runs/:id', wrap((req, res) => {
    const st = str((req.body as { status?: unknown } | undefined)?.status);
    if (!['done', 'denied', 'error', 'undone'].includes(st)) throw new HttpError(400, 'حالة غير صالحة');
    db().run('UPDATE ai_runs SET status = ? WHERE id = ? AND workspace_id = ?', st, str(req.params['id']), ws);
    res.json({ ok: true });
  }));

  /** آخر أفعال الذكاء عبر كل المحادثات (للسجل) */
  r.get('/runs', wrap((_req, res) => {
    res.json(db().all<Parameters<typeof runRow>[0]>("SELECT id, thread_id, tool, args, summary, status, undo, at FROM ai_runs WHERE workspace_id = ? AND status IN ('done','undone') ORDER BY at DESC LIMIT 100", ws).map(runRow));
  }));

  return r;
}
