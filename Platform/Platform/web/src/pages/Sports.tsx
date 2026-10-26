import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { ApiError } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field, Modal, Skeleton } from '../ui/ui.js';
import { BodyMap, ContentBanner, SafetyBadge, SafetyDisclaimer, addExerciseTo, norm, useExercises, useMine, usePlans } from '../sports/sportsKit.js';
import { Term } from '../glossary/glossary.js';
import { LEVEL_TONE, PSEUDO, REGIONS, REGION_AR, regionsOf, withRegions, type ExerciseView, type ExercisesDoc, type MyWeek, type Session, type Template } from '../../../shared/sports.js';

const ALL_REGION_CHIPS = [...REGIONS.map((r) => ({ id: r.id, ar: r.ar })), ...PSEUDO.map((p) => ({ id: p.id, ar: p.ar }))];

export default function Sports() {
  const ex = useExercises();
  const plans = usePlans();
  const { mine, set } = useMine();
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q')?.slice(0, 80) ?? '');
  const loc = useLocation();
  useEffect(() => {
    const v = new URLSearchParams(loc.search).get('q');
    if (v !== null) setQ(v.slice(0, 80));
  }, [loc.search]);
  const [regions, setRegions] = useState<ReadonlySet<string>>(new Set());
  const [equip, setEquip] = useState<ReadonlySet<string>>(new Set());
  const [cat, setCat] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [safeOnly, setSafeOnly] = useState(false);
  const [wide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 901px)').matches);
  const [open, setOpen] = useState<ExerciseView | null>(null);

  const all = useMemo(() => withRegions(ex.data?.exercises ?? []), [ex.data]);
  const byId = useMemo(() => new Map(all.map((e) => [e.id, e] as const)), [all]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of all) for (const r of e.regions) c[r] = (c[r] ?? 0) + 1;
    return c;
  }, [all]);
  const levels = useMemo(() => (ex.data?.level_values_ar ?? ['مبتدئ', 'متوسط', 'متقدم']).filter((l) => all.some((e) => e.level === l)), [ex.data, all]);
  const cats = useMemo(() => [...new Set(all.map((e) => e.category_ar).filter((x): x is string => !!x))], [all]);
  const equipKeys = ex.data?.equipment_key_values ?? {};
  const equipUsed = useMemo(() => Object.keys(equipKeys).filter((k) => all.some((e) => e.equipment_keys?.includes(k))), [equipKeys, all]);
  const result = useMemo(() => {
    const nq = norm(q);
    return all.filter((e) => {
      if (nq && !norm(`${e.arabic_name} ${e.english_name} ${e.main_muscle_ar} ${e.category_ar ?? ''}`).includes(nq)) return false;
      if (regions.size && !e.regions.some((r) => regions.has(r))) return false;
      if (cat && e.category_ar !== cat) return false;
      if (level && e.level !== level) return false;
      if (safeOnly && e.beginner_safe !== true) return false;
      if (equip.size && e.equipment_keys?.length && !e.equipment_keys.every((k) => equip.has(k) || k === 'none')) return false;
      return true;
    });
  }, [all, q, regions, equip, cat, level, safeOnly]);
  const toggle = (s: ReadonlySet<string>, id: string): Set<string> => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };
  const filtered = q || regions.size || equip.size || cat || level || safeOnly;
  const reset = (): void => {
    setQ('');
    setRegions(new Set());
    setEquip(new Set());
    setCat(null);
    setLevel(null);
    setSafeOnly(false);
  };

  const head = <PageHead title="الرياضة" icon="dumbbell" sub="مكتبة التمارين من راشد — تصفّح حسب العضلة والمعدات، وابنِ تمرينك الخاص." crumbs={[{ label: 'الرياضة' }]} actions={<><Button to="/sports/templates" icon="calendar">القوالب الأسبوعية</Button><Button to="/sports/mine" variant="primary" icon="plus">تمريني</Button></>} />;
  if (ex.loading) return <div className="page sports-page">{head}<Skeleton h={90} r={16} /><div style={{ height: 12 }} /><Skeleton h={320} r={16} /></div>;
  if (ex.error) return <div className="page sports-page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={ex.error} action={<Button onClick={ex.reload}>إعادة المحاولة</Button>} /></div>;
  if (!ex.rootExists || !ex.data) {
    return (
      <div className="page sports-page">
        {head}
        <ContentBanner status={ex.status} label="مكتبة التمارين" />
        <EmptyState icon="dumbbell" title="مكتبة التمارين غير متاحة" text={!ex.rootExists ? 'مجلد صادرات راشد غير موجود. اضبط المسار من إعدادات الحياة.' : 'ملف التمارين غير متاح أو تغيّر تنسيقه. تمريني المحلي ما زال يعمل.'} action={<><Button to="/life/settings" icon="sliders">إعدادات الحياة</Button> <Button to="/sports/mine">تمريني</Button></>} />
      </div>
    );
  }

  return (
    <div className="page sports-page">
      {head}
      <ContentBanner status={ex.status} label="مكتبة التمارين">
        {ex.data.note_ar && <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>{ex.data.note_ar}</p>}
      </ContentBanner>
      <SafetyDisclaimer doc={ex.data} />
      <div className="sports-layout">
        <aside className="sticky-side" aria-label="الفلاتر">
          <Card>
            <CardHead title="اختر العضلة" icon="target" info="التصنيف إلى مناطق الجسم من الموقع (تقريبي) انطلاقًا من اسم العضلة الرئيسية عند راشد. الرسم أصلي ولا يستخدم صورًا خارجية.">
              {regions.size > 0 && <Button size="sm" variant="ghost" onClick={() => setRegions(new Set())}>مسح</Button>}
            </CardHead>
            <BodyMap active={regions} counts={counts} onToggle={(id) => setRegions((s) => toggle(s, id))} />
            <details className="fold" open={wide}>
              <summary>كل العضلات <span className="num">({ALL_REGION_CHIPS.length})</span></summary>
              <ul className="chips" aria-label="العضلات">
                {ALL_REGION_CHIPS.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="chip" aria-pressed={regions.has(r.id)} onClick={() => setRegions((s) => toggle(s, r.id))}>
                      {r.ar} <span className="n num">{counts[r.id] ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </Card>
          <Card>
            <details className="fold" open={wide}>
              <summary>فلاتر إضافية{equip.size || cat || level || safeOnly ? <Badge tone="accent">{equip.size + (cat ? 1 : 0) + (level ? 1 : 0) + (safeOnly ? 1 : 0)}</Badge> : null}</summary>
              <div className="stack">
                <div className="filter-block">
                  <h3>المعدات المتاحة لدي</h3>
                  <ul className="chips">
                    {equipUsed.map((k) => (
                      <li key={k}>
                        <button type="button" className="chip" aria-pressed={equip.has(k)} onClick={() => setEquip((s) => toggle(s, k))}>{equipKeys[k]}</button>
                      </li>
                    ))}
                  </ul>
                  <small className="muted">{equip.size ? 'يظهر ما يكفيه ما اخترته فقط.' : 'بلا اختيار تظهر كل التمارين.'}</small>
                </div>
                {all.some((e) => e.beginner_safe !== undefined && e.beginner_safe !== null) && (
                  <div className="filter-block">
                    <h3>الأمان</h3>
                    <ul className="chips">
                      <li><button type="button" className="chip" aria-pressed={safeOnly} onClick={() => setSafeOnly((v) => !v)}>مناسب للمبتدئ فقط</button></li>
                    </ul>
                    <small className="muted">حسب مراجعة راشد. التمارين غير المراجَعة تُخفى عند التفعيل.</small>
                  </div>
                )}
                {levels.length > 0 && (
                  <div className="filter-block">
                    <h3>المستوى</h3>
                    <ul className="chips">
                      {levels.map((l) => (
                        <li key={l}>
                          <button type="button" className="chip" aria-pressed={level === l} onClick={() => setLevel(level === l ? null : l)}>{l}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="filter-block">
                  <h3>الفئة</h3>
                  <ul className="chips">
                    {cats.map((c) => (
                      <li key={c}>
                        <button type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </Card>
        </aside>
        <div className="stack sp-main">
          <Card className="sp-search">
            <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap', alignItems: 'end' }}>
              <div style={{ flex: '1 1 240px' }}>
                <Field label="بحث بالعربي أو الإنجليزي" htmlFor="ex-q">
                  <input id="ex-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: ضغط، squat، دمبل…" autoComplete="off" />
                </Field>
              </div>
              {filtered && <Button variant="ghost" icon="x" onClick={reset}>مسح الفلاتر</Button>}
            </div>
            <p className="muted" style={{ margin: 'var(--s-3) 0 0' }} aria-live="polite">
              <b className="num">{result.length}</b> من <span className="num">{all.length}</span> تمرينًا
              {regions.size > 0 && <> — {[...regions].map((r) => REGION_AR[r] ?? r).join('، ')}</>}
            </p>
          </Card>
          {result.length ? (
            <ul className="ex-grid">
              {result.map((e) => (
                <li key={e.id} className="ex-card">
                  <button type="button" className="ex-main" onClick={() => setOpen(e)} aria-label={`${e.arabic_name} — تفاصيل`}>
                    <span className="ex-ar">{e.arabic_name}</span>
                    <span className="ex-en" lang="en">{e.english_name}</span>
                  </button>
                  <div className="ex-meta">
                    <Badge>{e.main_muscle_ar}</Badge>
                    {e.equipment && <Badge dashed>{e.equipment}</Badge>}
                    {e.level && <Badge tone={LEVEL_TONE[e.level]}>{e.level}</Badge>}
                    <SafetyBadge e={e} compact />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="search" title="لا تمارين بهذه الفلاتر" text="خفّف الفلاتر أو امسحها. لا نخترع تمارين غير موجودة في مكتبة راشد." action={<Button onClick={reset}>مسح الفلاتر</Button>} />
          )}
          {ex.data.safety_note_ar && <p className="life-note warn"><span>{ex.data.safety_note_ar}</span></p>}
        </div>
      </div>
      {open && <Detail e={open} doc={ex.data} byId={byId} onOpen={setOpen} onClose={() => setOpen(null)} sessions={plans.data?.sessions} templates={plans.data?.templates} mine={mine} onMine={set} />}
    </div>
  );
}

function Detail({ e, doc, byId, onOpen, onClose, sessions, templates, mine, onMine }: { e: ExerciseView; doc: ExercisesDoc; byId: Map<string, ExerciseView>; onOpen: (e: ExerciseView) => void; onClose: () => void; sessions: Session[] | undefined; templates: Template[] | undefined; mine: MyWeek; onMine: (w: MyWeek) => void }) {
  const { toast } = useApp();
  const [target, setTarget] = useState<string>(mine.workouts[0]?.id ?? '');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const used = (sessions ?? []).filter((s) => s.exercises?.some((x) => x.exercise_id === e.id));
  const usedIn = (sid: string): number => (templates ?? []).filter((t) => t.days.some((d) => d.sessions.includes(sid))).length;
  const sec = e.secondary_muscles_ar ?? [];
  const secRegions = useMemo(() => [...new Set(sec.flatMap((m) => regionsOf(m)))].filter((r) => !e.regions.includes(r)), [sec, e.regions]);
  const steps = e.instructions_ar ?? [];
  const add = async (ev: FormEvent): Promise<void> => {
    ev.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const next = await addExerciseTo(mine, target || null, name.trim(), e);
      onMine(next);
      toast(target ? 'أُضيف التمرين إلى تمريني' : 'أُنشئ تمرين جديد وأُضيف إليه', { kind: 'ok' });
      onClose();
    } catch (er) {
      setErr(er instanceof ApiError ? Object.values(er.fields)[0] ?? er.message : (er as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={<>{e.arabic_name} <small className="muted" lang="en" dir="ltr">{e.english_name}</small></>} onClose={onClose}>
      <div className="stack">
        <div className="row" style={{ gap: 'var(--s-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <BodyMap active={e.regions} secondary={secRegions} className="sm" />
          <ul className="life-list" style={{ flex: 1, minWidth: 180 }}>
            <li>العضلة الرئيسية: <b>{e.main_muscle_ar}</b></li>
            {sec.length > 0 && <li>عضلات مساعدة: <b>{sec.join('، ')}</b> <small className="muted">(منقّطة في الرسم)</small></li>}
            {e.level && <li>المستوى: <Badge tone={LEVEL_TONE[e.level]}>{e.level}</Badge></li>}
            {e.category_ar && <li>الفئة: <b>{e.category_ar}</b></li>}
            {e.equipment && <li>المعدات: <b>{e.equipment}</b></li>}
            <li>المناطق: {e.regions.length ? e.regions.map((r) => REGION_AR[r] ?? r).join('، ') : 'غير مصنّفة'} <small className="muted">(تصنيف الموقع، تقريبي)</small></li>
          </ul>
        </div>
        {(e.beginner_safe !== undefined && e.beginner_safe !== null) || e.safety_note_ar ? (
          <section aria-labelledby="ex-safety" className={`safety-box${e.beginner_safe === false ? ' bad' : ''}`}>
            <h3 id="ex-safety" style={{ margin: '0 0 6px', fontSize: 'var(--fs-sm)' }}>الأمان <SafetyBadge e={e} /></h3>
            {e.safety_note_ar && <p style={{ margin: 0 }}>{e.safety_note_ar}</p>}
            {e.safer_alternative_id && (() => {
              const alt = byId.get(e.safer_alternative_id);
              return alt ? (
                <p style={{ margin: '8px 0 0' }}>
                  {e.beginner_safe === false ? 'بديل أسلم' : 'نسخة أسهل'}:{' '}
                  <button type="button" className="chip" onClick={() => onOpen(alt)}>{alt.arabic_name} <small lang="en" dir="ltr">{alt.english_name}</small></button>
                </p>
              ) : <p className="muted" style={{ margin: '8px 0 0' }}>بديل راشد ({e.safer_alternative_id}) غير موجود في المكتبة.</p>;
            })()}
            <p className="muted" style={{ margin: '8px 0 0', fontSize: 'var(--fs-xs)' }}>مراجعة راشد من المعرفة العامة لمبتدئ — ليست نصيحة طبية.</p>
          </section>
        ) : <p className="muted" style={{ margin: 0 }}>لم يراجع راشد أمان هذا التمرين بعد (غير مسجل).</p>}
        <section aria-labelledby="ex-steps">
          <h3 id="ex-steps" style={{ margin: '0 0 6px', fontSize: 'var(--fs-sm)' }}>كيف تؤدّيه <small className="muted">(<Term id="form">الشكل الصحيح</Term> أهم من الوزن)</small></h3>
          {steps.length ? (
            <ol className="instr">{steps.map((t, i) => <li key={i}>{t}</li>)}</ol>
          ) : (
            <p className="muted" style={{ margin: 0 }}>لم يكتب راشد خطوات لهذا التمرين. لا نضيف من عندنا؛ اطلب منه إكمالها أو استشر مدرّبًا.</p>
          )}
          <p className="edu-note" style={{ marginBlockStart: 'var(--s-2)' }}>
            <Badge tone="warn">{e.details_confidence === 'general_knowledge' ? <Term id="conf_general_knowledge" bare>معرفة عامة</Term> : e.details_confidence ?? 'غير موسوم'}</Badge>
            <span>{doc.details_note_ar ?? 'هذه الخطوات شرح تعليمي من المعرفة العامة وليست نصيحة طبية.'} {doc.safety_note_ar}</span>
          </p>
        </section>
        {used.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 'var(--fs-sm)' }}>يدخل في جلسات راشد المقترحة</h3>
            <ul className="chips">{used.map((s) => <li key={s.id}><Badge>{s.name_ar} · {usedIn(s.id)} قالب</Badge></li>)}</ul>
          </div>
        )}
        <form onSubmit={add} className="stack" aria-label="إضافة إلى تمريني">
          <h3 style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>أضِف إلى تمريني (يُحفظ في موقعك فقط)</h3>
          <Field label="إلى أي تمرين؟" htmlFor="ex-target" error={err}>
            <select id="ex-target" value={target} onChange={(ev) => setTarget(ev.target.value)}>
              {mine.workouts.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.items.length})</option>)}
              <option value="">+ تمرين جديد…</option>
            </select>
          </Field>
          {!target && (
            <Field label="اسم التمرين الجديد" htmlFor="ex-newname">
              <input id="ex-newname" value={name} maxLength={80} onChange={(ev) => setName(ev.target.value)} placeholder="مثال: تمرين الصدر" required />
            </Field>
          )}
          <div className="row" style={{ gap: 8 }}>
            <Button type="submit" variant="primary" icon="plus" disabled={busy}>إضافة</Button>
            <Link to="/sports/mine">فتح تمريني</Link>
          </div>
        </form>
      </div>
    </Modal>
  );
}
