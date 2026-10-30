/** بطاقة «الذكاء» في الإعدادات: الحالة والكشف، المزوّدون بالترتيب (سلسلة احتياطية)، المفاتيح، سياسة التنفيذ، والسقف. */
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { Icon } from '../lib/icons.js';
import { Badge, Button, Card, CardHead, Field, Segmented, Skeleton, Switch } from '../ui/ui.js';
import { ANTHROPIC_MODELS, KIND_LABEL_AI, TIER_LABEL, type AiConfig, type AiPolicy, type AiProviderView, type AiStatus } from '../../../shared/ai.js';
import { accessKey, ai, firstUsable, setAccessKey } from './client.js';

export function AiSettingsCard() {
  const { toast } = useApp();
  const [st, setSt] = useState<AiStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cfg, setCfg] = useState<(Omit<AiConfig, 'providers'> & { providers: AiProviderView[] }) | null>(null);
  const [dirty, setDirty] = useState(false);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [access, setAccess] = useState(accessKey());

  const load = useCallback(async () => {
    setErr(null);
    try {
      const s = await ai.status();
      setSt(s);
      setCfg(structuredClone(s.config));
      setDirty(false);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const patch = (f: (c: NonNullable<typeof cfg>) => void): void => {
    setCfg((c) => {
      if (!c) return c;
      const n = structuredClone(c);
      f(n);
      return n;
    });
    setDirty(true);
  };
  const ordered = cfg ? cfg.order.map((id) => cfg.providers.find((p) => p.id === id)).filter((p): p is AiProviderView => !!p) : [];
  const move = (id: string, d: -1 | 1): void => patch((c) => {
    const i = c.order.indexOf(id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= c.order.length) return;
    [c.order[i], c.order[j]] = [c.order[j]!, c.order[i]!];
  });

  const save = async (): Promise<void> => {
    if (!cfg) return;
    try {
      await ai.saveConfig({ ...cfg, providers: cfg.providers.filter((p) => !p.env).map(({ has_key: _h, needs_key: _n, usable: _u, why: _w, ...p }) => p) });
      toast('حُفظت إعدادات الذكاء', { kind: 'ok' });
      await load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const saveKey = async (id: string): Promise<void> => {
    const k = keys[id]?.trim();
    if (!k) return;
    try {
      const r = await ai.setKey(id, k);
      setKeys((x) => ({ ...x, [id]: '' }));
      toast(r.ephemeral ? 'حُفظ المفتاح مؤقتًا (أونلاين: ضعه في متغيرات Vercel ليبقى)' : 'حُفظ المفتاح على جهازك', { kind: 'ok' });
      await load();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  const test = async (id: string): Promise<void> => {
    if (dirty) await save();
    setTests((t) => ({ ...t, [id]: '…' }));
    try {
      const r = await ai.test(id);
      setTests((t) => ({ ...t, [id]: r.ok ? `يعمل · ${(r.ms / 1000).toFixed(1)} ث · ${r.provider ?? ''}` : `فشل: ${r.error ?? ''}` }));
    } catch (e) {
      setTests((t) => ({ ...t, [id]: `فشل: ${(e as Error).message}` }));
    }
  };
  const loadModels = (id: string): void => {
    if (models[id]) return;
    void ai.models(id).then((r) => setModels((m) => ({ ...m, [id]: r.models }))).catch(() => setModels((m) => ({ ...m, [id]: [] })));
  };

  const active = st ? firstUsable(st) : null;

  return (
    <Card id="ai">
      <CardHead title="الذكاء (المساعد)" icon="sparkle" info="مجاني أولًا: Qwen محليًا عبر Ollama. ثم أي مزوّد سحابي بمفتاح (مجاني أو مدفوع مثل Claude Opus 5.5). يُجرَّب المزوّدون بالترتيب: إن فشل الأول ينتقل للتالي.">
        <Button size="sm" icon="refresh" onClick={() => void load()}>أعد الفحص</Button>
      </CardHead>

      {(err || st?.gated) && (
        <form className="stack" style={{ gap: 'var(--s-2)', marginBlockEnd: 'var(--s-3)' }} onSubmit={(e) => { e.preventDefault(); setAccessKey(access.trim()); void load(); }}>
          {err && <div className="callout danger" role="alert">{err}</div>}
          <Field label="رمز دخول الذكاء (AI_ACCESS_KEY) — يُحفظ في هذا المتصفح فقط" htmlFor="ai-access">
            <div className="row" style={{ gap: 8 }}>
              <input id="ai-access" className="input" type="password" dir="ltr" value={access} onChange={(e) => setAccess(e.target.value)} autoComplete="off" />
              <Button type="submit" size="sm">حفظ</Button>
            </div>
          </Field>
        </form>
      )}

      {!st || !cfg ? (
        !err && <Skeleton h={120} />
      ) : (
        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <dl className="kv ai-kv">
            <dt>الفعّال الآن</dt>
            <dd>{active ? <><b>{active.label}</b> · <span dir="ltr">{active.kind === 'ollama' && active.model === 'auto' ? st.ollama.resolved ?? 'auto' : active.model}</span></> : <span className="muted">لا مزوّد جاهز</span>}</dd>
            {!st.online && (
              <>
                <dt>جهازك</dt>
                <dd>{st.memory_gb}GB ذاكرة · {st.cpus} أنوية · الموصى به: <code dir="ltr">{st.recommended}</code></dd>
                <dt>Ollama</dt>
                <dd>{st.ollama.reachable ? <>يعمل · {st.ollama.models.length ? <span dir="ltr">{st.ollama.models.map((m) => m.name).join('، ')}</span> : 'لا موديلات — نفّذ: '}{!st.ollama.models.length && <code dir="ltr">ollama pull {st.recommended}</code>}</> : <>غير شغّال — ثبّته من <span dir="ltr">ollama.com</span> ثم: <code dir="ltr">ollama pull {st.recommended}</code></>}</dd>
              </>
            )}
            <dt>الاستهلاك المدفوع اليوم</dt>
            <dd>{st.usage_today.toLocaleString('en')} توكن{cfg.daily_token_cap ? ` من ${cfg.daily_token_cap.toLocaleString('en')}` : ''}</dd>
          </dl>

          <Segmented<AiPolicy> label="سياسة التنفيذ" value={cfg.policy} onChange={(v) => patch((c) => void (c.policy = v))} options={[{ value: 'ask', label: 'معاينة قبل كل تعديل' }, { value: 'auto', label: 'نفّذ مباشرة (مع تراجع)' }]} />
          <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>الحذف يطلب تأكيدك دائمًا، وكل فعل يُسجَّل باسم «ai» في سجل النشاط ويمكن التراجع عنه.</p>

          <div className="row" style={{ gap: 'var(--s-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {!st.online && <Switch checked={cfg.background} onChange={(v) => patch((c) => void (c.background = v))} label="موجز اليوم في الوارد (في الخلفية، مجاني فقط)" />}
            <Field label="سقف يومي للمدفوع (توكن، 0 = بلا سقف)" htmlFor="ai-cap">
              <input id="ai-cap" className="input" type="number" min={0} step={10000} dir="ltr" style={{ width: 160 }} value={cfg.daily_token_cap} onChange={(e) => patch((c) => void (c.daily_token_cap = Math.max(0, Math.floor(Number(e.target.value) || 0))))} />
            </Field>
          </div>

          <div>
            <h3 className="ai-set-h">المزوّدون — بالترتيب</h3>
            <ol className="ai-provs">
              {ordered.map((p, i) => {
                const isOpen = open === p.id;
                return (
                  <li key={p.id} className={p.usable ? 'ok' : undefined}>
                    <div className="ai-prov-row">
                      <span className="ai-ord" aria-hidden="true">{i + 1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b>{p.label}</b>{' '}
                        <Badge tone={p.tier === 'paid' ? 'warn' : 'ok'}>{TIER_LABEL[p.tier]}</Badge>{' '}
                        <small className="muted">{KIND_LABEL_AI[p.kind]}{p.browser ? ' · من المتصفح' : ''}{p.env ? ' · من متغيرات البيئة' : ''}</small>
                        <div className="muted ai-prov-why">{p.usable ? <span style={{ color: 'var(--ok)' }}>جاهز</span> : p.why}{tests[p.id] ? ` · ${tests[p.id]}` : ''}</div>
                      </div>
                      {!p.env && <Switch checked={p.enabled} onChange={(v) => patch((c) => void (c.providers.find((x) => x.id === p.id)!.enabled = v))} label={`تفعيل ${p.label}`} hideLabel />}
                      <div className="row" style={{ gap: 2 }}>
                        <button className="icon-btn sm" aria-label={`أعلى: ${p.label}`} disabled={i === 0} onClick={() => move(p.id, -1)}><Icon name="up" size={14} /></button>
                        <button className="icon-btn sm" aria-label={`أسفل: ${p.label}`} disabled={i === ordered.length - 1} onClick={() => move(p.id, 1)}><Icon name="down" size={14} /></button>
                        <button className="icon-btn sm" aria-label={`تفاصيل ${p.label}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)}><Icon name="kebab" size={14} /></button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="ai-prov-more">
                        <Field label="الموديل" htmlFor={`m-${p.id}`} hint={p.kind === 'ollama' ? '«auto» = أفضل Qwen مثبّت تلقائيًا' : p.tier === 'free' ? 'مثال OpenRouter: موديل ينتهي بـ :free' : undefined}>
                          <input id={`m-${p.id}`} className="input" dir="ltr" list={`ml-${p.id}`} disabled={p.env} value={p.model} onFocus={() => loadModels(p.id)} onChange={(e) => patch((c) => void (c.providers.find((x) => x.id === p.id)!.model = e.target.value))} />
                          <datalist id={`ml-${p.id}`}>
                            {(p.kind === 'anthropic' ? ANTHROPIC_MODELS.map((m) => m.id) : models[p.id] ?? []).map((m) => <option key={m} value={m} />)}
                          </datalist>
                        </Field>
                        <Field label="العنوان (Base URL)" htmlFor={`u-${p.id}`}>
                          <input id={`u-${p.id}`} className="input" dir="ltr" disabled={p.env} value={p.base_url} onChange={(e) => patch((c) => void (c.providers.find((x) => x.id === p.id)!.base_url = e.target.value.trim()))} />
                        </Field>
                        {p.needs_key && !p.env && (
                          <Field label={p.has_key ? 'المفتاح محفوظ — أدخل جديدًا لاستبداله' : 'مفتاح API'} htmlFor={`k-${p.id}`} hint="يُحفظ على الخادم فقط، لا يعود للمتصفح أبدًا">
                            <div className="row" style={{ gap: 8 }}>
                              <input id={`k-${p.id}`} className="input" type="password" dir="ltr" autoComplete="off" value={keys[p.id] ?? ''} onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))} />
                              <Button size="sm" disabled={!keys[p.id]?.trim()} onClick={() => void saveKey(p.id)}>حفظ</Button>
                              {p.has_key && <Button size="sm" variant="ghost" onClick={() => void ai.delKey(p.id).then(load)}>حذف</Button>}
                            </div>
                          </Field>
                        )}
                        {p.browser && (
                          <p className="muted ai-help">يستخدم Ollama على الحاسوب الذي تفتح منه الموقع. للنسخة الأونلاين اسمح للموقع مرة واحدة ثم أعد تشغيل Ollama:<br /><code dir="ltr">setx OLLAMA_ORIGINS "{location.origin}"</code></p>
                        )}
                        {!p.browser && <Button size="sm" icon="zap" onClick={() => void test(p.id)}>اختبر الاتصال</Button>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="primary" disabled={!dirty} onClick={() => void save()}>حفظ الإعدادات</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
