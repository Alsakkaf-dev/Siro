import { num1, fmtDayFull, useLife } from '../life/lifeKit.js';
import type { Body } from '../../../shared/life.js';
import { useMemo, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { ApiError, sports } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Skeleton } from '../ui/ui.js';
import { useNow } from '../widgets/tiles.js';
import { BodyMap, ConfBadge, ContentBanner, SafetyBadge, SafetyDisclaimer, sessionRegions, useExercises, useMine, usePlans } from '../sports/sportsKit.js';
import { describeSE, fmtRange, KIND_AR, LOCATION_AR, WEEKDAY_AR, WEEKDAYS, weekdayKL, type Exercise, type Session, type Template, type Weekday } from '../../../shared/sports.js';
import { Term } from '../glossary/glossary.js';

const KIND_COLOR: Record<string, string> = { strength: 'var(--sports)', cardio: '#4CC9F0', mobility: '#A78BFA', rest: '#8A92B2' };

function durationText(s: Session): string {
  const d = s.duration_minutes as { min?: number; max?: number; weeks_1_4?: { min: number; max: number }; weeks_5_plus?: { min: number; max: number } } | undefined;
  if (!d) return '';
  if (d.weeks_1_4 || d.weeks_5_plus) return [d.weeks_1_4 && `أسابيع 1–4: ${fmtRange(d.weeks_1_4)} د`, d.weeks_5_plus && `من الأسبوع 5: ${fmtRange(d.weeks_5_plus)} د`].filter(Boolean).join(' · ');
  if (typeof d.min === 'number' && typeof d.max === 'number') return `${fmtRange(d as { min: number; max: number })} دقيقة`;
  return '';
}

export default function SportsTemplates() {
  const plans = usePlans();
  const ex = useExercises();
  const { mine, set, loaded } = useMine();
  const { toast, confirm } = useApp();
  const now = useNow(60_000);
  const [loc, setLoc] = useState<'all' | 'home' | 'gym'>('all');
  const [pickId, setPickId] = useState<string | null>(null);
  const [sess, setSess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const life = useLife(['body']);
  const latest = (() => { const l = life.get<Body>('body')?.latest_recorded_weight; return l && typeof l.value_kg === 'number' && l.date ? { value_kg: l.value_kg, date: l.date } : null; })();
  const p = plans.data;
  const byEx = useMemo(() => new Map<string, Exercise>((ex.data?.exercises ?? []).map((e) => [e.id, e])), [ex.data]);
  const bySess = useMemo(() => new Map<string, Session>((p?.sessions ?? []).map((s) => [s.id, s])), [p]);
  const list = useMemo(() => (p?.templates ?? []).filter((t) => loc === 'all' || t.location === loc), [p, loc]);
  const cur: Template | undefined = list.find((t) => t.id === pickId) ?? list.find((t) => t.id === mine.template) ?? list[0];
  const today = weekdayKL(now);
  const head = <PageHead title="القوالب الأسبوعية" icon="calendar" sub="ستة قوالب مقترحة من راشد — كلها افتراض حتى تختار أنت." />;

  if (plans.loading) return <div className="page sports-page">{head}<Skeleton h={90} r={16} /><div style={{ height: 12 }} /><Skeleton h={320} r={16} /></div>;
  if (plans.error) return <div className="page sports-page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={plans.error} action={<Button onClick={plans.reload}>إعادة المحاولة</Button>} /></div>;
  if (!plans.rootExists || !p) {
    return (
      <div className="page sports-page">
        {head}
        <ContentBanner status={plans.status} label="قوالب التمرين" />
        <EmptyState icon="calendar" title="قوالب التمرين غير متاحة" text={!plans.rootExists ? 'مجلد صادرات راشد غير موجود.' : 'ملف القوالب غير متاح أو تغيّر تنسيقه.'} action={<Button to="/settings?tab=sources" icon="sliders">إعدادات الحياة</Button>} />
      </div>
    );
  }
  const shown = sess ? bySess.get(sess) : undefined;
  const rawSel = p.selected_template_id ?? null;

  const choose = async (t: Template): Promise<void> => {
    setBusy(true);
    try {
      const loc2 = t.location === 'home' || t.location === 'gym' ? t.location : undefined;
      set(await sports.settings({ template: t.id, ...(loc2 ? { location: loc2 } : {}) }));
      toast(`اعتمدتَ «${t.name_ar}» في موقعك`, { kind: 'ok' });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : (e as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  /** «ابدأ بهذا القالب»: ينشئ تمرينًا لكل جلسة (أو يعيد استعمال المنسوخ سابقًا بنفس الاسم)، ويعيّن أيام الأسبوع، ويعتمد القالب — بخطوة واحدة. */
  const start = async (t: Template): Promise<void> => {
    const ok = await confirm({ title: `ابدأ بقالب «${t.name_ar}»؟`, body: <p>تُنشأ تمارين الجلسات في «تمريني» وتُعيَّن على أيامها ({t.days.length} أيام). الأيام الأخرى لا تتغير. كله في موقعك فقط — ملفات راشد لا تُمس.</p>, confirmLabel: 'ابدأ' });
    if (!ok) return;
    setBusy(true);
    try {
      let cur = await sports.mine();
      const idFor = new Map<string, string>();
      for (const d of t.days) {
        const sid = d.sessions[0];
        const sObj = sid ? bySess.get(sid) : undefined;
        if (!sObj || idFor.has(sObj.id)) continue;
        const name = sObj.name_ar.slice(0, 80);
        const existing = cur.workouts.find((w) => w.name === name);
        if (existing) {
          idFor.set(sObj.id, existing.id);
          continue;
        }
        const items = (sObj.exercises ?? []).map((se) => {
          const e = byEx.get(se.exercise_id);
          return { exercise_id: se.exercise_id, en_name: e?.english_name ?? se.exercise_id, ar_name: e?.arabic_name ?? se.exercise_id, sets: se.sets?.min ?? null, reps_min: se.reps?.min ?? null, reps_max: se.reps?.max ?? null, duration_s: se.duration_seconds?.min ?? null, per_side: !!se.per_side };
        });
        const w = await sports.create({ name, note: `من قالب «${t.name_ar}» (افتراض). عدّل ما شئت.`, items });
        idFor.set(sObj.id, w.id);
      }
      for (const d of t.days) {
        const wid = d.sessions[0] ? idFor.get(d.sessions[0]) : undefined;
        if (wid && (WEEKDAYS as readonly string[]).includes(d.weekday)) cur = await sports.week(d.weekday as Weekday, wid);
      }
      const loc2 = t.location === 'home' || t.location === 'gym' ? t.location : undefined;
      set(await sports.settings({ template: t.id, ...(loc2 ? { location: loc2 } : {}) }));
      toast(`بدأتَ «${t.name_ar}»: ${idFor.size} تمارين على ${t.days.length} أيام`, { kind: 'ok' });
    } catch (e) {
      toast(e instanceof ApiError ? Object.values(e.fields)[0] ?? e.message : (e as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const copy = async (s: Session): Promise<void> => {
    setBusy(true);
    try {
      const items = (s.exercises ?? []).map((se) => {
        const e = byEx.get(se.exercise_id);
        return { exercise_id: se.exercise_id, en_name: e?.english_name ?? se.exercise_id, ar_name: e?.arabic_name ?? se.exercise_id, sets: se.sets?.min ?? null, reps_min: se.reps?.min ?? null, reps_max: se.reps?.max ?? null, duration_s: se.duration_seconds?.min ?? null, per_side: !!se.per_side };
      });
      await sports.create({ name: s.name_ar.slice(0, 80), note: 'نُسخ من قالب راشد (افتراض). عدّل ما شئت.', items });
      set(await sports.mine());
      toast('نُسخت الجلسة إلى «تمريني»', { kind: 'ok' });
    } catch (e) {
      toast(e instanceof ApiError ? Object.values(e.fields)[0] ?? e.message : (e as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page sports-page">
      {head}
      <ContentBanner status={plans.status} label="قوالب التمرين" />
      <p className="life-note warn"><span>{p.note_ar ?? 'كل محتوى القوالب افتراض.'} {p.selection_note_ar}</span></p>
      <SafetyDisclaimer doc={p.disclaimer_ar ? p : ex.data} />
      <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <div className="seg" role="group" aria-label="المكان">
          {(['all', 'home', 'gym'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={loc === k} onClick={() => setLoc(k)}>{k === 'all' ? 'الكل' : LOCATION_AR[k]}</button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          اختيار راشد المسجّل: {rawSel ? <b>{rawSel}</b> : <b>لم يُسجَّل بعد</b>}
          {loaded && mine.template && <> · اختيارك المحلي: <b>{p.templates.find((t) => t.id === mine.template)?.name_ar ?? mine.template}</b></>}
        </span>
      </div>
      <ul className="tpl-cards" aria-label="القوالب">
        {list.map((t) => (
          <li key={t.id}>
            <button type="button" className="tpl-card" aria-pressed={cur?.id === t.id} onClick={() => { setPickId(t.id); setSess(null); }}>
              <b>{t.name_ar}</b>
              <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <Badge>{t.days_per_week} أيام</Badge>
                <Badge dashed>{LOCATION_AR[t.location] ?? t.location}</Badge>
                {mine.template === t.id && <Badge tone="ok">اعتمدتُه</Badge>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!list.length && <EmptyState icon="calendar" title="لا قوالب لهذا المكان" text="جرّب «الكل»." />}
      {cur && (
        <Card>
          <CardHead title={cur.name_ar} icon="calendar">
            <ConfBadge c={cur.confidence ?? p.confidence} />
            <Button size="sm" variant={mine.template === cur.id ? 'ghost' : 'primary'} icon="check" disabled={busy || mine.template === cur.id} onClick={() => void choose(cur)}>{mine.template === cur.id ? 'معتمد عندك' : 'اعتمد هذا القالب محليًا'}</Button>
            <Button size="sm" variant="primary" icon="zap" disabled={busy} onClick={() => void start(cur)}>ابدأ بهذا القالب</Button>
          </CardHead>
          <p className="muted" style={{ marginBlockStart: 0 }}>الاعتماد هنا محلي في موقعك فقط؛ لا يغيّر ملفات راشد. إن أردت أن يسجّله راشد قله في المحادثة{cur.recommended_from_week ? ` — يوصى به من الأسبوع ${cur.recommended_from_week}` : ''}.</p>
          <ul className="week-grid" aria-label={`أيام ${cur.name_ar}`}>
            {(p.weekday_order ?? cur.days.map((d) => d.weekday)).map((wd) => {
              const d = cur.days.find((x) => x.weekday === wd);
              const label = d?.weekday_ar ?? WEEKDAY_AR[wd as keyof typeof WEEKDAY_AR] ?? wd;
              return (
                <li key={wd} className={`wk-day ${wd === today ? 'today' : ''}`}>
                  <h3>{label}{wd === today && <Badge tone="accent">اليوم</Badge>}</h3>
                  {d?.sessions.length ? d.sessions.map((sid) => {
                    const s = bySess.get(sid);
                    return (
                      <button key={sid} type="button" className="sess-btn" style={{ '--c': KIND_COLOR[s?.kind ?? ''] ?? 'var(--sports)' } as React.CSSProperties} aria-pressed={sess === sid} onClick={() => setSess(sess === sid ? null : sid)}>
                        {s?.name_ar ?? sid}
                      </button>
                    );
                  }) : <span className="muted">—</span>}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {shown && (
        <Card>
          <CardHead title={shown.name_ar} icon="dumbbell">
            <Badge>{KIND_AR[shown.kind] ?? shown.kind}</Badge>
            {shown.exercises?.length ? <Button size="sm" icon="plus" disabled={busy} onClick={() => void copy(shown)}>انسخ إلى تمريني</Button> : null}
          </CardHead>
          <div className="row" style={{ gap: 'var(--s-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {(shown.exercises?.length ?? 0) > 0 && <BodyMap active={sessionRegions(shown, byEx)} className="sm" />}
            <div style={{ flex: 1, minWidth: 220 }}>
              {durationText(shown) && <p style={{ marginBlockStart: 0 }}>المدة: <b className="num">{durationText(shown)}</b></p>}
              {shown.note_ar && <p className="muted" style={{ marginBlockStart: 0 }}>{shown.note_ar}</p>}
              {shown.exercises?.length ? (
                <ol className="sess-list">
                  {shown.exercises.map((se, i) => {
                    const e = byEx.get(se.exercise_id);
                    return (
                      <li key={`${se.exercise_id}-${i}`}>
                        <span><b>{e?.arabic_name ?? se.exercise_id}</b>{e && <small className="muted" lang="en" dir="ltr" style={{ display: 'block', textAlign: 'start' }}>{e.english_name}</small>}{!e && <small className="muted" style={{ display: 'block' }}>غير موجود في مكتبة التمارين الحالية</small>}</span>
                        <span className="t num">{describeSE(se)}</span>
                        {e && e.beginner_safe === false && <span style={{ gridColumn: '1 / -1' }}><SafetyBadge e={e} compact /> {e.safer_alternative_id && byEx.get(e.safer_alternative_id) ? <small>بديل أسلم: {byEx.get(e.safer_alternative_id)?.arabic_name}</small> : null}</span>}
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              {shown.safety_notes_ar?.length ? (
                <div className="safety-box" style={{ marginBlockStart: 'var(--s-3)' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 'var(--fs-sm)' }}>ملاحظات الأمان لهذه الجلسة <small className="muted">(من راشد)</small></h3>
                  <ul className="ses-safety">
                    {shown.safety_notes_ar.map((n, i) => {
                      const id = shown.safety_exercise_ids?.[i];
                      const e = id ? byEx.get(id) : undefined;
                      return <li key={i}>{e && <b>{e.arabic_name}: </b>}{n}</li>;
                    })}
                  </ul>
                </div>
              ) : null}
              {!shown.exercises?.length && <p className="muted" style={{ margin: 0 }}>{shown.kind === 'rest' ? <>يوم <Term id="active_rest">راحة</Term>.</> : 'لا تمارين محددة.'}</p>}
            </div>
          </div>
        </Card>
      )}
      <div className="grid cols-2 cols-1-1">
        {p.phases?.length ? (
          <Card>
            <CardHead title={<Term id="progressive_overload">مراحل التدرّج</Term>} icon="timer" />
            <ul className="life-list">
              {p.phases.map((ph) => (
                <li key={ph.id}>
                  <b>{ph.name_ar}</b> <ConfBadge c={ph.confidence} />
                  <small className="muted" style={{ display: 'block' }}>
                    {ph.sets && <><Term id="set">مجموعات</Term> {fmtRange(ph.sets)} · </>}{ph.reps && <><Term id="rep">تكرارات</Term> {fmtRange(ph.reps)} · </>}{ph.rest_seconds && <><Term id="rest_between_sets">راحة</Term> {fmtRange(ph.rest_seconds)} ث</>}{ph.lowering_seconds ? <> · <Term id="lowering_phase">نزول</Term> {ph.lowering_seconds} ث</> : null}
                  </small>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        {p.general_rules?.length ? (
          <Card>
            <CardHead title="قواعد عامة" icon="info" />
            <ul className="rules">
              {p.general_rules.map((r) => <li key={r.id}>{r.text_ar}</li>)}
            </ul>
          </Card>
        ) : null}
      </div>
      {p.changelog?.some((c) => c.changes?.length) && (
        <Card>
          <CardHead title="ما تغيّر في القوالب" icon="refresh" info="سجل تغييرات كتبه راشد. أُبدلت تمارين لأسباب أمان للمبتدئ." />
          {p.changelog.filter((c) => c.changes?.length).map((c) => (
            <details key={c.version} className="fold" open={c.version === Math.max(...(p.changelog ?? []).map((x) => x.version))}>
              <summary>النسخة {c.version}{c.date ? ` · ${c.date.slice(0, 10)}` : ''}</summary>
              {c.change_ar && <p className="muted" style={{ marginBlockStart: 0 }}>{c.change_ar}</p>}
              <ul className="life-list">
                {c.changes?.map((ch, i) => {
                  const nm = (id?: string): string => (id ? byEx.get(id)?.arabic_name ?? id : '');
                  const sn = bySess.get(ch.session_id)?.name_ar ?? ch.session_id;
                  return (
                    <li key={i}>
                      <b>{sn}</b>: {ch.removed_alternative_exercise_id ? <>حُذف البديل «{nm(ch.removed_alternative_exercise_id)}»</> : <>«{nm(ch.from_exercise_id)}» ← «{nm(ch.to_exercise_id)}»</>}
                      {ch.reason_ar && <small className="muted" style={{ display: 'block' }}>{ch.reason_ar}</small>}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </Card>
      )}
      {p.goal && (
        <Card>
          <CardHead title="الهدف" icon="flag"><ConfBadge c={p.goal.confidence} /></CardHead>
          <p style={{ margin: 0 }}>
            {latest ? <>آخر وزن مسجّل <b className="num">{num1(latest.value_kg)} كغ</b> <small className="muted">({fmtDayFull(latest.date)})</small></> : typeof p.goal.current_weight_kg === 'number' ? <>الوزن المسجّل <b className="num">{num1(p.goal.current_weight_kg)} كغ</b></> : <>الوزن الحالي: غير مسجل</>}
            {typeof p.goal.goal_weight_kg === 'number' && <> → الهدف <b className="num">{num1(p.goal.goal_weight_kg)} كغ</b></>}
          </p>
          {latest && typeof p.goal.current_weight_kg === 'number' && p.goal.current_weight_kg !== latest.value_kg && <p className="muted" style={{ marginBlock: '6px 0', fontSize: 'var(--fs-sm)' }}>وقت كتابة الخطة كان الوزن المسجّل {num1(p.goal.current_weight_kg)} كغ؛ الرقم أعلاه أحدث.</p>}
          {p.goal.note_ar && <p className="muted" style={{ marginBottom: 0 }}>{p.goal.note_ar}</p>}
        </Card>
      )}
    </div>
  );
}
