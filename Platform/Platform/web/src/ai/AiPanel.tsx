/** لوحة المساعد: جانبية غير حاجبة (ترى الصفحة تتغيّر)، تعرف سياق الصفحة، تعرض كل أداة كبطاقة مع معاينة/تأكيد/تراجع. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { usePluginCtx } from '../shell/Shell.js';
import { autoCrumbs } from '../core/metro.js';
import { cx } from '../ui/ui.js';
const newId = (): string => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
import { isSmallModel, type AiMessage, type AiRun, type AiStatus, type AiThread } from '../../../shared/ai.js';
import { lineOfPath } from '../../../shared/aiTools.js';
import { accessKey, ai, firstUsable, setAccessKey, transportFor } from './client.js';
import { runTurn, type ToolCard } from './agent.js';
import { buildSystemPrompt, invalidatePromptCache, localToday } from './prompt.js';
import { invalidateToolCaches, runUndo } from './tools.js';
import './ai.css';

type Entry = { k: 'user'; text: string } | { k: 'assistant'; text: string; live?: boolean } | { k: 'card'; card: ToolCard } | { k: 'error'; text: string } | { k: 'tool'; label: string };

const SUGGEST: Record<string, string[]> = {
  home: ['ما أهم شيء عليّ اليوم؟', 'أعطني موجز هذا الأسبوع', 'ماذا تأخّر عليّ؟'],
  academic: ['ما التقييمات القادمة هذا الأسبوع؟', 'كم أحتاج في النهائي لأحصل 70% في كل مادة؟', 'التقاط ذكي: الصق خطة مادة'],
  course: ['لخّص وضعي في هذه المادة', 'كم أحتاج لأحصل 80% في هذه المادة؟', 'اكتب لي 5 أسئلة مراجعة لهذه المادة'],
  library: ['ابحث عن محاضرات الأسبوع الماضي', 'ما الملفات غير المقروءة لمادتي الحالية؟'],
  file: ['لخّص هذا الملف في نقاط', 'اسألني 5 أسئلة من هذا الملف', 'اشرح أصعب فكرة في هذا الملف'],
  spaces: ['أنشئ مساحة لتتبع طلبات التدريب الصيفي', 'ما المهام المتأخرة في مساحاتي؟'],
  space: ['أضف أتمتة: عندما يصبح العنصر منجزًا أرشفه', 'ما العناصر المفتوحة هنا؟', 'أضف مهمة: …'],
  life: ['صليت الفجر في وقتها اليوم', 'صرفت 12 رنجت على الغداء'],
  sports: ['ما تمريني اليوم؟', 'خلِّ يوم الأحد راحة'],
};
const CAPTURE = 'استخرج التقييمات من النص التالي وأضفها لمادة «…» (لا تخمّن أي وزن أو تاريخ غير مذكور):\n\n';

/** سياق الصفحة الحالية للموديل */
function pageContext(path: string): { context: string | null; key: string } {
  let m: RegExpExecArray | null;
  if ((m = /\/courses\/([^/#?]+)/.exec(path))) return { context: `The user is viewing course id ${m[1]}. "هذه المادة" = this course.`, key: 'course' };
  if ((m = /^\/library\/f\/([^/]+)/.exec(path))) return { context: `The user is viewing library file ref f:${m[1]}. "هذا الملف" = this file.`, key: 'file' };
  if ((m = /^\/library\/y\/([^/]+)/.exec(path))) return { context: `The user is viewing YouTube item ref y:${m[1]}.`, key: 'library' };
  if ((m = /^\/spaces\/([^/]+)/.exec(path)) && !['templates', 'automations', 'new'].includes(m[1]!)) return { context: `The user is viewing space id ${m[1]}. "هنا"/"هذه المساحة" = this space.`, key: 'space' };
  const line = lineOfPath(path);
  return { context: null, key: line ?? (path === '/' || /^\/(week|everything|inbox|today)/.test(path) ? 'home' : 'home') };
}

export default function AiPanel({ onClose }: { onClose: () => void }) {
  const { aiCmd, profileName, activeId, crumbs, reloadSemesters, reloadSpaces, bumpData, toast } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const pctx = usePluginCtx();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [gate, setGate] = useState<{ gated: boolean; configured: boolean } | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [threadId, setThreadId] = useState(() => newId());
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState<AiThread[] | null>(null);
  const abort = useRef<AbortController | null>(null);
  const pending = useRef(new Map<string, (ok: boolean) => void>());
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCmd = useRef(0);

  const loadStatus = useCallback(async () => {
    setStatusErr(null);
    try {
      const g = await ai.gate();
      setGate(g);
      if (g.gated && !accessKey()) return;
      setStatus(await ai.status());
    } catch (e) {
      setStatusErr((e as Error).message);
    }
  }, []);
  useEffect(() => void loadStatus(), [loadStatus]);

  const usable = status ? firstUsable(status) : null;
  const ctxInfo = pageContext(loc.pathname);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [entries]);

  const upsertCard = (c: ToolCard): void => {
    setEntries((es) => {
      const i = es.findIndex((e) => e.k === 'card' && e.card.id === c.id);
      if (i < 0) return [...es, { k: 'card', card: c }];
      const n = [...es];
      n[i] = { k: 'card', card: c };
      return n;
    });
  };

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    if (!status) {
      toast('المساعد غير جاهز بعد', { kind: 'error' });
      return;
    }
    setInput('');
    setBusy(true);
    const ac = new AbortController();
    abort.current = ac;
    setEntries((es) => [...es, { k: 'user', text: t }, { k: 'assistant', text: '', live: true }]);
    const system = await buildSystemPrompt({ name: profileName, path: loc.pathname, crumbs: (crumbs ?? autoCrumbs(loc.pathname, pctx)).map((c) => c.label), activeSemesterId: activeId, context: ctxInfo.context });
    const model = usable?.kind === 'ollama' ? (usable.model === 'auto' ? status.ollama.resolved ?? '' : usable.model) : usable?.model ?? '';
    const small = usable ? isSmallModel(model, usable.tier) || (usable.browser && usable.model === 'auto') : true;
    let wrote = false;
    const refresh = new Set<string>();
    const tid = threadId;
    const { messages: added, error } = await runTurn(messages, t, system, {
      transport: transportFor(status),
      toolBudget: small ? 9 : null,
      path: loc.pathname,
      policy: status.config.policy,
      ctx: { nav: (p) => nav(p), activeSemesterId: activeId, today: localToday() },
      signal: ac.signal,
      onProvider: (label, m) => setProvider(`${label} · ${m}`),
      onText: (full) =>
        setEntries((es) => {
          const n = [...es];
          for (let i = n.length - 1; i >= 0; i--) {
            const e = n[i]!;
            if (e.k === 'assistant' && e.live) {
              n[i] = { ...e, text: full };
              return n;
            }
          }
          return [...n, { k: 'assistant', text: full, live: true }];
        }),
      onStep: () =>
        setEntries((es) => (es.some((e) => e.k === 'assistant' && e.live) ? es : [...es, { k: 'assistant', text: '', live: true }])),
      onCard: (c) => {
        // بطاقة جديدة تُغلق فقاعة النص الحالية؛ نص الخطوة التالية يبدأ فقاعة جديدة
        setEntries((es) => es.filter((e) => !(e.k === 'assistant' && e.live && !e.text.trim())).map((e) => (e.k === 'assistant' && e.live ? { ...e, live: false } : e)));
        upsertCard(c);
        if (c.status === 'done' && c.tier !== 'read') {
          wrote = true;
          c.refresh?.forEach((r) => refresh.add(r));
        }
      },
      confirm: (c) => new Promise<boolean>((resolve) => pending.current.set(c.id, resolve)),
      recordRun: async (c) => {
        try {
          const r = await ai.addRun(tid, { tool: c.name, args: c.args.slice(0, 20_000), summary: (c.summary ?? c.preview ?? c.label).slice(0, 300), status: c.status === 'done' ? 'done' : c.status === 'denied' ? 'denied' : 'error', undo: c.undo ?? null });
          setRuns((rs) => [...rs, { id: r.id, thread_id: tid, tool: c.name, args: c.args, summary: c.summary ?? '', status: c.status === 'done' ? 'done' : 'denied', undo: c.undo ?? null, at: new Date().toISOString() }]);
          return r.id;
        } catch {
          return undefined;
        }
      },
    });
    setEntries((es) => {
      const n = es.filter((e) => !(e.k === 'assistant' && !e.text.trim()));
      return n.map((e) => (e.k === 'assistant' ? { ...e, live: false } : e)).concat(error ? [{ k: 'error', text: error }] : []);
    });
    const all = [...messages, ...added];
    setMessages(all);
    setBusy(false);
    abort.current = null;
    if (wrote) {
      invalidatePromptCache();
      invalidateToolCaches();
      if (refresh.has('semesters')) void reloadSemesters();
      if (refresh.has('spaces')) void reloadSpaces();
      bumpData();
    }
    // حفظ المحادثة (بدون رسائل النظام)
    const firstUser = all.find((m) => m.role === 'user')?.content ?? t;
    void ai.saveThread(tid, { title: firstUser.slice(0, 80), context_ref: ctxInfo.context ? loc.pathname : null, messages: all }).catch(() => undefined);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [busy, status, profileName, loc.pathname, crumbs, pctx, activeId, ctxInfo.context, usable, threadId, messages, nav, toast, reloadSemesters, reloadSpaces, bumpData]);

  // أوامر من أماكن أخرى (شريط الأوامر، أزرار «بالذكاء» في الصفحات)
  useEffect(() => {
    if (!aiCmd || aiCmd.seq === lastCmd.current) return;
    if (aiCmd.send && aiCmd.prompt && !status) return; // ننتظر الحالة ثم نرسل
    lastCmd.current = aiCmd.seq;
    if (aiCmd.prompt && aiCmd.send) void send(aiCmd.prompt);
    else if (aiCmd.prompt) {
      setInput(aiCmd.prompt);
      window.setTimeout(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 30);
    } else window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [aiCmd, status, send]);

  useEffect(() => {
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !document.querySelector('.modal-wrap, .drawer-wrap')) {
        if (busy) abort.current?.abort();
        else onClose();
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [busy, onClose]);

  const decide = (id: string, ok: boolean): void => {
    const r = pending.current.get(id);
    pending.current.delete(id);
    r?.(ok);
  };

  const undoRun = async (runId: string | undefined, card?: ToolCard): Promise<void> => {
    const run = runs.find((r) => r.id === runId) ?? (card?.undo ? { id: runId ?? '', undo: card.undo } as AiRun : null);
    if (!run?.undo) return;
    try {
      await runUndo(run.undo);
      if (run.id) await ai.setRun(run.id, 'undone').catch(() => undefined);
      setRuns((rs) => rs.map((r) => (r.id === run.id ? { ...r, status: 'undone' } : r)));
      if (card) upsertCard({ ...card, status: 'undone' });
      invalidatePromptCache();
      invalidateToolCaches();
      void reloadSemesters();
      void reloadSpaces();
      bumpData();
      toast('تم التراجع', { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const undoAll = async (): Promise<void> => {
    const list = runs.filter((r) => r.status === 'done' && r.undo).reverse();
    let n = 0;
    for (const r of list) {
      try {
        await runUndo(r.undo!);
        await ai.setRun(r.id, 'undone').catch(() => undefined);
        n++;
      } catch {
        /* نكمل البقية */
      }
    }
    setRuns((rs) => rs.map((r) => (list.some((x) => x.id === r.id) ? { ...r, status: 'undone' } : r)));
    setEntries((es) => es.map((e) => (e.k === 'card' && e.card.status === 'done' && e.card.undo ? { ...e, card: { ...e.card, status: 'undone' } } : e)));
    invalidatePromptCache();
    invalidateToolCaches();
    void reloadSemesters();
    void reloadSpaces();
    bumpData();
    toast(`تراجعتُ عن ${n} فعل`, { kind: 'ok' });
  };

  const newChat = (): void => {
    if (busy) abort.current?.abort();
    setThreadId(newId());
    setMessages([]);
    setEntries([]);
    setRuns([]);
    setShowThreads(null);
    inputRef.current?.focus();
  };

  const openThread = async (id: string): Promise<void> => {
    try {
      const t = await ai.thread(id);
      setThreadId(t.id);
      setMessages(t.messages);
      setRuns(t.runs);
      const es: Entry[] = [];
      for (const m of t.messages) {
        if (m.role === 'user') es.push({ k: 'user', text: m.content });
        else if (m.role === 'assistant' && m.content.trim()) es.push({ k: 'assistant', text: m.content });
        else if (m.role === 'tool') {
          const run = t.runs.find((r) => r.tool === m.name && !es.some((e) => e.k === 'card' && e.card.runId === r.id));
          if (run) es.push({ k: 'card', card: { id: run.id, name: run.tool, label: run.tool, tier: 'write', args: run.args, status: run.status === 'undone' ? 'undone' : run.status === 'denied' ? 'denied' : run.status === 'error' ? 'error' : 'done', summary: run.summary, undo: run.undo, runId: run.id } });
          else es.push({ k: 'tool', label: m.name });
        }
      }
      setEntries(es);
      setShowThreads(null);
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };

  const undoable = runs.filter((r) => r.status === 'done' && r.undo).length;
  const suggestions = useMemo(() => SUGGEST[ctxInfo.key] ?? SUGGEST['home']!, [ctxInfo.key]);
  const needKey = gate?.gated && (!accessKey() || statusErr?.includes('رمز'));

  return (
    <aside className="ai-panel" role="complementary" aria-label="المساعد الذكي">
      <header className="ai-head">
        <div className="ai-title">
          <span className="ai-mark" aria-hidden="true"><Icon name="sparkle" size={16} /></span>
          <div>
            <h2>المساعد</h2>
            <p className="ai-prov" title={provider ?? undefined}>{provider ?? (usable ? `${usable.label}${usable.kind === 'ollama' && status?.ollama.resolved ? ` · ${status.ollama.resolved}` : usable.model && usable.model !== 'auto' ? ` · ${usable.model}` : ''}` : status ? 'لا مزوّد جاهز' : '…')}</p>
          </div>
        </div>
        <div className="row" style={{ gap: 2 }}>
          <button className="icon-btn sm" aria-label="محادثة جديدة" title="محادثة جديدة" onClick={newChat}><Icon name="plus" size={16} /></button>
          <button className="icon-btn sm" aria-label="المحادثات السابقة" title="المحادثات السابقة" aria-pressed={!!showThreads} onClick={() => (showThreads ? setShowThreads(null) : void ai.threads().then(setShowThreads).catch((e: Error) => toast(e.message, { kind: 'error' })))}><Icon name="clock" size={16} /></button>
          <Link className="icon-btn sm" aria-label="إعدادات الذكاء" title="إعدادات الذكاء" to="/settings#ai"><Icon name="sliders" size={16} /></Link>
          <button className="icon-btn sm" aria-label="إغلاق المساعد" title="إغلاق (Esc)" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
      </header>

      <div className="ai-body" ref={bodyRef} aria-live="polite" aria-busy={busy}>
        {showThreads ? (
          <div className="ai-threads">
            <h3>المحادثات السابقة</h3>
            {showThreads.length === 0 && <p className="muted">لا توجد محادثات محفوظة بعد.</p>}
            <ul>
              {showThreads.map((t) => (
                <li key={t.id}>
                  <button className="ai-thread" onClick={() => void openThread(t.id)}>
                    <bdi>{t.title}</bdi>
                    <span className="muted" dir="ltr">{t.updated_at.slice(0, 16).replace('T', ' ')}</span>
                  </button>
                  <button className="icon-btn sm" aria-label={`حذف «${t.title}»`} onClick={() => void ai.delThread(t.id).then(() => setShowThreads((x) => x?.filter((y) => y.id !== t.id) ?? null))}><Icon name="trash" size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
        ) : needKey ? (
          <form className="ai-setup" onSubmit={(e) => { e.preventDefault(); setAccessKey(keyInput.trim()); setKeyInput(''); void loadStatus(); }}>
            <Icon name="lock" size={22} />
            <h3>رمز دخول الذكاء</h3>
            <p>النسخة الأونلاين محمية حتى لا يستهلك أحد مفاتيحك. أدخل قيمة <code dir="ltr">AI_ACCESS_KEY</code> (تُحفظ في هذا المتصفح فقط).</p>
            {!gate?.configured && <p className="ai-warn">لم يُضبط <code dir="ltr">AI_ACCESS_KEY</code> في Vercel بعد.</p>}
            {statusErr && <p className="ai-warn">{statusErr}</p>}
            <label className="sr-only" htmlFor="ai-key">الرمز</label>
            <input id="ai-key" className="input" type="password" autoComplete="off" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} dir="ltr" />
            <button className="btn primary" disabled={!keyInput.trim()}>دخول</button>
          </form>
        ) : status && !usable ? (
          <div className="ai-setup">
            <Icon name="zap" size={22} />
            <h3>شغّل دماغ المنصة</h3>
            {status.online ? (
              <p>أضف مزوّدًا سحابيًا (مجانيًا أو مدفوعًا) أو اسمح للموقع باستخدام Qwen على حاسوبك.</p>
            ) : (
              <>
                <p>المجاني الأقوى لجهازك ({status.memory_gb}GB ذاكرة): <b dir="ltr">{status.recommended}</b></p>
                <ol>
                  <li>ثبّت Ollama من <span dir="ltr">ollama.com</span> وشغّله.</li>
                  <li>نفّذ: <code dir="ltr">ollama pull {status.recommended}</code></li>
                  <li>ارجع هنا — يُكتشف تلقائيًا.</li>
                </ol>
              </>
            )}
            <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
              <button className="btn" onClick={() => void loadStatus()}><Icon name="refresh" size={15} /> أعد الفحص</button>
              <Link className="btn primary" to="/settings#ai">الإعدادات</Link>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="ai-empty">
            <p className="ai-hello">{profileName ? `أهلًا ${profileName}.` : 'أهلًا.'} اطلب بجملة — أبحث وأضيف وأعدّل وأحسب وألخّص، وكل فعل قابل للتراجع.</p>
            <div className="ai-sugs">
              {suggestions.map((s) => (
                <button key={s} className="ai-sug" onClick={() => (s.startsWith('التقاط ذكي') ? setInput(CAPTURE) : s.includes('…') ? setInput(s.replace('…', '')) : void send(s))}>{s}</button>
              ))}
              {ctxInfo.key !== 'academic' && <button className="ai-sug" onClick={() => setInput(CAPTURE)}>التقاط ذكي: الصق خطة مادة</button>}
            </div>
            {statusErr && <p className="ai-warn">{statusErr}</p>}
          </div>
        ) : (
          entries.map((e, i) =>
            e.k === 'user' ? (
              <div key={i} className="ai-msg user"><bdi>{e.text}</bdi></div>
            ) : e.k === 'assistant' ? (
              e.text || e.live ? <div key={i} className={cx('ai-msg bot', e.live && 'live')}>{e.text ? <Rich text={e.text} /> : <span className="ai-dots" role="img" aria-label="يفكّر"><i /><i /><i /></span>}</div> : null
            ) : e.k === 'error' ? (
              <div key={i} className="ai-msg err" role="alert"><Icon name="warn" size={15} /> <span style={{ whiteSpace: 'pre-line' }}>{e.text}</span></div>
            ) : e.k === 'tool' ? (
              <div key={i} className="ai-tool-chip"><Icon name="zap" size={12} /> {e.label}</div>
            ) : (
              <Card key={e.card.id} c={e.card} onDecide={decide} onUndo={() => void undoRun(e.card.runId, e.card)} />
            ),
          )
        )}
      </div>

      {undoable > 0 && !showThreads && (
        <div className="ai-undo-all">
          <span>{undoable} فعل في هذه المحادثة</span>
          <button className="btn sm" onClick={() => void undoAll()}><Icon name="undo" size={14} /> تراجع عن الكل</button>
        </div>
      )}

      <form className="ai-compose" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <label className="sr-only" htmlFor="ai-input">اكتب طلبك</label>
        <textarea
          id="ai-input"
          ref={inputRef}
          value={input}
          rows={input.split('\n').length > 2 ? 5 : 2}
          placeholder={busy ? 'يعمل…' : 'مثال: أضف كويز للشبكات الخميس بوزن 5%'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
          disabled={!status || !!needKey}
        />
        {busy ? (
          <button type="button" className="btn ai-send" aria-label="إيقاف" title="إيقاف (Esc)" onClick={() => abort.current?.abort()}><Icon name="x" size={16} /></button>
        ) : (
          <button className="btn primary ai-send" aria-label="إرسال" title="إرسال (Enter)" disabled={!input.trim() || !status}><Icon name="left" size={16} /></button>
        )}
      </form>
    </aside>
  );
}

function Card({ c, onDecide, onUndo }: { c: ToolCard; onDecide: (id: string, ok: boolean) => void; onUndo: () => void }) {
  const icon = c.status === 'done' ? 'check' : c.status === 'error' ? 'warn' : c.status === 'denied' || c.status === 'undone' ? 'undo' : c.status === 'awaiting' ? (c.tier === 'danger' ? 'warn' : 'edit') : 'zap';
  const label = c.status === 'awaiting' ? (c.tier === 'danger' ? 'يحتاج تأكيدك' : 'معاينة — هل أنفّذ؟') : c.status === 'running' ? 'يعمل…' : c.status === 'denied' ? 'لم يُنفَّذ' : c.status === 'undone' ? 'تم التراجع' : c.status === 'error' ? 'تعذّر' : 'تم';
  if (c.tier === 'read' && c.status !== 'error') {
    return <div className={cx('ai-tool-chip', c.status === 'running' && 'running')}><Icon name={c.status === 'running' ? 'search' : 'check'} size={12} /> {c.summary ?? c.label}</div>;
  }
  return (
    <div className={cx('ai-card', `st-${c.status}`, c.tier === 'danger' && 'danger')}>
      <div className="ai-card-head">
        <Icon name={icon} size={15} />
        <b>{c.label}</b>
        <span className="ai-card-st">{label}</span>
      </div>
      {(c.preview || c.summary) && <p className="ai-card-text">{ltrDates((c.status === 'awaiting' || !c.summary ? c.preview : c.summary) ?? '')}</p>}
      {c.status === 'awaiting' && (
        <div className="ai-card-actions">
          <button className={cx('btn sm', c.tier === 'danger' ? 'danger' : 'primary')} onClick={() => onDecide(c.id, true)} autoFocus><Icon name="check" size={14} /> {c.tier === 'danger' ? 'نعم، احذف' : 'نفّذ'}</button>
          <button className="btn sm" onClick={() => onDecide(c.id, false)}>لا</button>
        </div>
      )}
      {c.status === 'done' && c.undo && (
        <div className="ai-card-actions">
          <button className="btn sm ghost" onClick={onUndo}><Icon name="undo" size={14} /> تراجع</button>
        </div>
      )}
    </div>
  );
}

/** التواريخ ISO داخل نص عربي تنقلب بصريًا — نعزلها باتجاه LTR */
const ltrDates = (s: string): string => s.replace(/\d{4}-\d{2}-\d{2}/g, (m) => `\u2066${m.replace(/-/g, '\u2011')}\u2069`);

/** تنسيق بسيط وآمن: أسطر، نقاط، **عريض**، `كود` — بلا HTML خام */
function Rich({ text }: { text: string }) {
  const lines = ltrDates(text).split('\n');
  const inline = (s: string, k: number) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**') ? <b key={`${k}-${j}`}>{p.slice(2, -2)}</b> : p.startsWith('`') && p.endsWith('`') ? <code key={`${k}-${j}`} dir="auto">{p.slice(1, -1)}</code> : <span key={`${k}-${j}`}>{p}</span>,
    );
  return (
    <div className="ai-rich">
      {lines.map((l, i) => {
        const t = l.replace(/^#{1,4}\s+/, '');
        if (/^\s*[-*•]\s+/.test(t)) return <p key={i} className="li">{inline(t.replace(/^\s*[-*•]\s+/, ''), i)}</p>;
        if (/^\s*\d+[.)]\s+/.test(t)) return <p key={i} className="li num">{inline(t, i)}</p>;
        return t.trim() ? <p key={i}>{inline(t, i)}</p> : null;
      })}
    </div>
  );
}
