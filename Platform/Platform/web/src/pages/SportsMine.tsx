import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useApp } from '../core/app-context.js';
import { useNewParam } from '../core/useNewParam.js';
import { ApiError, sports, type ItemInput } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, DragHandle, EmptyState, Field, IconButton, Modal, Skeleton, useDragReorder } from '../ui/ui.js';
import { useNow } from '../widgets/tiles.js';
import { Term } from '../glossary/glossary.js';
import { ContentBanner, SafetyBadge, SafetyDisclaimer, itemText, norm, toInput, useExercises, useMine } from '../sports/sportsKit.js';
import { WEEKDAYS, WEEKDAY_AR, weekdayKL, type Exercise, type MyItem, type MyWeek, type MyWorkout } from '../../../shared/sports.js';

export default function SportsMine() {
  const { mine, loaded, error, set, reload } = useMine();
  const ex = useExercises();
  const { toast, confirm } = useApp();
  const now = useNow(60_000);
  const [edit, setEdit] = useState<MyWorkout | 'new' | null>(null);
  useNewParam(() => setEdit('new'));
  const today = weekdayKL(now);
  const byId = useMemo(() => new Map(mine.workouts.map((w) => [w.id, w])), [mine.workouts]);
  const todayW = mine.week[today] ? byId.get(mine.week[today]!) : undefined;
  const fail = (e: unknown): void => toast(e instanceof ApiError ? Object.values(e.fields)[0] ?? e.message : (e as Error).message, { kind: 'error' });

  const exById = useMemo(() => new Map((ex.data?.exercises ?? []).map((e) => [e.id, e] as const)), [ex.data]);
  const swapSafer = async (w: MyWorkout, itemId: string): Promise<void> => {
    const cur = w.items.find((x) => x.id === itemId);
    const alt = cur ? exById.get(exById.get(cur.exercise_id)?.safer_alternative_id ?? '') : undefined;
    if (!cur || !alt) return;
    try {
      await sports.setItems(w.id, w.items.map((x) => (x.id === itemId ? { ...toInput(x), exercise_id: alt.id, en_name: alt.english_name, ar_name: alt.arabic_name } : toInput(x))));
      toast(`استُبدل «${cur.ar_name}» بـ «${alt.arabic_name}»`, { kind: 'ok' });
    } catch (e) {
      fail(e);
    }
  };
  const itemLi = (w: MyWorkout, it: MyItem): ReactNode => {
    const e = exById.get(it.exercise_id);
    const alt = e?.beginner_safe === false && e.safer_alternative_id ? exById.get(e.safer_alternative_id) : undefined;
    return (
      <li key={it.id}>
        {it.ar_name} <small className="muted num">{itemText(it)}</small>
        {e && e.beginner_safe === false && (
          <span className="mine-warn"> <SafetyBadge e={e} compact />{alt && <> <button type="button" className="chip" onClick={() => void swapSafer(w, it.id)}>استبدل بـ «{alt.arabic_name}»</button></>}</span>
        )}
      </li>
    );
  };
  const dnd = useDragReorder((from, to) => {
    const ids = mine.workouts.map((w) => w.id);
    const [m] = ids.splice(from, 1);
    ids.splice(to, 0, m!);
    sports.order(ids).then(set).catch(fail);
  });
  const head = <PageHead title="تمريني" icon="dumbbell" sub="تمارينك وجدولك الأسبوعي — تُحفظ في موقعك فقط، لا في ملفات راشد." actions={<><Button to="/sports" icon="search">تصفّح التمارين</Button><Button variant="primary" icon="plus" onClick={() => setEdit('new')}>تمرين جديد</Button></>} />;
  if (error) return <div className="page sports-page">{head}<EmptyState icon="warn" title="تعذّر الاتصال بالخادم" text={error} action={<Button onClick={reload}>إعادة المحاولة</Button>} /></div>;
  if (!loaded) return <div className="page sports-page">{head}<Skeleton h={120} r={16} /></div>;

  const move = async (i: number, d: -1 | 1): Promise<void> => {
    const ids = mine.workouts.map((w) => w.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    try {
      set(await sports.order(ids));
    } catch (e) {
      fail(e);
    }
  };
  const del = async (w: MyWorkout): Promise<void> => {
    if (!(await confirm({ title: `حذف «${w.name}»؟`, body: <p>يُحذف التمرين من موقعك ويُفرَّغ من أيام الأسبوع المعيّن لها. لا يمسّ ملفات راشد.</p>, confirmLabel: 'حذف', danger: true }))) return;
    try {
      await sports.del(w.id);
      set(await sports.mine());
      toast('حُذف التمرين', { kind: 'ok' });
    } catch (e) {
      fail(e);
    }
  };
  const assign = async (day: (typeof WEEKDAYS)[number], id: string): Promise<void> => {
    try {
      set(await sports.week(day, id || null));
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="page sports-page">
      {head}
      {ex.status && ex.status.state !== 'fresh' && <ContentBanner status={ex.status} label="مكتبة التمارين" />}
      {mine.workouts.some((w) => w.items.some((i) => exById.get(i.exercise_id)?.beginner_safe === false)) && <SafetyDisclaimer doc={ex.data} />}
      <section className="today-card" aria-label="تمرين اليوم">
        <span className="muted">اليوم · {WEEKDAY_AR[today]}</span>
        {todayW ? (
          <>
            <h2 style={{ margin: 0 }}>{todayW.name}</h2>
            <ol className="wo-items">{todayW.items.map((i) => <li key={i.id}><b>{i.ar_name}</b> <small className="muted num">{itemText(i)}</small></li>)}</ol>
            {!todayW.items.length && <p className="muted" style={{ margin: 0 }}>لا تمارين داخل هذا التمرين بعد.</p>}
          </>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>{mine.workouts.length ? 'لا تمرين معيّن لليوم' : 'ابدأ ببناء أول تمرين'}</h2>
            <p className="muted" style={{ margin: 0 }}>{mine.workouts.length ? 'عيّن تمرينًا ليوم اليوم من «جدولي الأسبوعي» أدناه، أو اعتبره يوم راحة.' : 'اختر تمارين من المكتبة أو انسخ جلسة من القوالب، ثم رتّبها على أيام الأسبوع.'}</p>
          </>
        )}
      </section>
      <Card>
        <CardHead title="جدولي الأسبوعي" icon="calendar" info="تعيين تمرين لكل يوم؛ الفارغ يعني لا تمرين (راحة). يُحفظ محليًا." />
        {mine.workouts.length ? (
          <div className="week-plan">
            {WEEKDAYS.map((d) => (
              <label key={d}>
                <span>{WEEKDAY_AR[d]}{d === today && ' · اليوم'}</span>
                <select value={mine.week[d] ?? ''} onChange={(e) => void assign(d, e.target.value)} aria-label={`تمرين يوم ${WEEKDAY_AR[d]}`}>
                  <option value="">— راحة —</option>
                  {mine.workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        ) : <p className="muted" style={{ margin: 0 }}>أنشئ تمرينًا أولًا لتعيّنه على الأيام.</p>}
      </Card>
      {mine.workouts.length ? (
        <ul className="wo-list" aria-label="تماريني">
          {mine.workouts.map((w, i) => (
            <li key={w.id} className="wo-card" {...dnd.row(i)}>
              <div className="ed-row-head">
                <h3><DragHandle handle={dnd.handle} />{w.name}</h3>
                <span className="row" style={{ gap: 2 }}>
                  <IconButton icon="up" label={`رفع «${w.name}»`} sm ghost disabled={i === 0} onClick={() => void move(i, -1)} />
                  <IconButton icon="down" label={`خفض «${w.name}»`} sm ghost disabled={i === mine.workouts.length - 1} onClick={() => void move(i, 1)} />
                  <IconButton icon="edit" label={`تعديل «${w.name}»`} sm ghost onClick={() => setEdit(w)} />
                  <IconButton icon="trash" label={`حذف «${w.name}»`} sm ghost tone="danger" onClick={() => void del(w)} />
                </span>
              </div>
              {w.note && <p className="muted" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>{w.note}</p>}
              {w.items.length ? <ol className="wo-items">{w.items.map((it) => itemLi(w, it))}</ol> : <p className="muted" style={{ margin: 0 }}>فارغ — أضف تمارين.</p>}
              <p style={{ margin: 0 }} className="row">
                {WEEKDAYS.filter((d) => mine.week[d] === w.id).map((d) => <Badge key={d} tone="accent">{WEEKDAY_AR[d]}</Badge>)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="dumbbell" title="لا تمارين محفوظة بعد" text="أنشئ تمرينك الأول، أو انسخ جلسة جاهزة من قوالب راشد." action={<><Button variant="primary" icon="plus" onClick={() => setEdit('new')}>تمرين جديد</Button> <Button to="/sports/templates">القوالب</Button></>} />
      )}
      {edit && <Editor w={edit === 'new' ? null : edit} exercises={ex.data?.exercises ?? []} onClose={() => setEdit(null)} onSaved={(m) => { set(m); setEdit(null); }} />}
    </div>
  );
}

function Editor({ w, exercises, onClose, onSaved }: { w: MyWorkout | null; exercises: Exercise[]; onClose: () => void; onSaved: (m: MyWeek) => void }) {
  const { toast } = useApp();
  const [name, setName] = useState(w?.name ?? '');
  const [note, setNote] = useState(w?.note ?? '');
  const [rows, setRows] = useState<ItemInput[]>(() => (w?.items ?? []).map(toInput));
  const [q, setQ] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const found = useMemo(() => {
    const nq = norm(q);
    if (!nq) return [];
    return exercises.filter((e) => norm(`${e.arabic_name} ${e.english_name} ${e.main_muscle_ar}`).includes(nq)).slice(0, 30);
  }, [q, exercises]);
  const patch = (i: number, p: Partial<ItemInput>): void => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const num = (v: string): number | null => (v === '' ? null : Number(v));
  const swap = (i: number, d: -1 | 1): void =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j]!, c[i]!];
      return c;
    });
  const dnd = useDragReorder((from, to) =>
    setRows((r) => {
      const c = [...r];
      const [m] = c.splice(from, 1);
      c.splice(to, 0, m!);
      return c;
    }),
  );
  const save = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setFields({});
    try {
      if (!w) await sports.create({ name, note, items: rows });
      else {
        await sports.edit(w.id, { name, note });
        await sports.setItems(w.id, rows);
      }
      onSaved(await sports.mine());
      toast('حُفظ التمرين', { kind: 'ok' });
    } catch (er) {
      if (er instanceof ApiError && Object.keys(er.fields).length) setFields(er.fields);
      else toast((er as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal wide title={w ? 'تعديل التمرين' : 'تمرين جديد'} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" type="submit" form="wo-form" disabled={busy}>حفظ</Button></>}>
      <form id="wo-form" onSubmit={save} className="stack">
        <div className="form-grid">
          <Field label="اسم التمرين" htmlFor="wo-name" error={fields['name']}>
            <input id="wo-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="مثال: صدر وترايسبس" required />
          </Field>
          <Field label="ملاحظة (اختياري)" htmlFor="wo-note" error={fields['note']}>
            <input id="wo-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 'var(--fs-sm)' }}>التمارين ({rows.length})</h3>
          {rows.length ? (
            <ol className="ed-rows">
              {rows.map((r, i) => (
                <li key={`${r.exercise_id}-${i}`} className="ed-row" {...dnd.row(i)}>
                  <div className="ed-row-head">
                    <span><DragHandle handle={dnd.handle} /><b>{r.ar_name}</b> <small className="muted" lang="en" dir="ltr">{r.en_name}</small></span>
                    <span className="row" style={{ gap: 2 }}>
                      <IconButton icon="up" label={`رفع ${r.ar_name}`} sm ghost disabled={i === 0} onClick={() => swap(i, -1)} />
                      <IconButton icon="down" label={`خفض ${r.ar_name}`} sm ghost disabled={i === rows.length - 1} onClick={() => swap(i, 1)} />
                      <IconButton icon="x" label={`إزالة ${r.ar_name}`} sm ghost tone="danger" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} />
                    </span>
                  </div>
                  <div className="ed-nums">
                    <label><Term id="set">مجموعات</Term><input type="number" min={1} max={20} inputMode="numeric" value={r.sets ?? ''} onChange={(e) => patch(i, { sets: num(e.target.value) })} aria-label={`مجموعات ${r.ar_name}`} /></label>
                    <label><Term id="rep">تكرار</Term> من<input type="number" min={1} max={200} inputMode="numeric" value={r.reps_min ?? ''} onChange={(e) => patch(i, { reps_min: num(e.target.value) })} aria-label={`أقل تكرار ${r.ar_name}`} /></label>
                    <label>تكرار إلى<input type="number" min={1} max={200} inputMode="numeric" value={r.reps_max ?? ''} onChange={(e) => patch(i, { reps_max: num(e.target.value) })} aria-label={`أعلى تكرار ${r.ar_name}`} /></label>
                    <label>ثوانٍ<input type="number" min={1} max={3600} inputMode="numeric" value={r.duration_s ?? ''} onChange={(e) => patch(i, { duration_s: num(e.target.value) })} aria-label={`مدة بالثواني ${r.ar_name}`} /></label>
                    <label className="row" style={{ gap: 6, alignItems: 'center', flexDirection: 'row' }}><input type="checkbox" checked={!!r.per_side} onChange={(e) => patch(i, { per_side: e.target.checked })} /> <Term id="per_side">لكل جهة</Term></label>
                  </div>
                  {(fields[`items.${i}.sets`] || fields[`items.${i}.reps_min`] || fields[`items.${i}.reps_max`] || fields[`items.${i}.duration_s`]) && <span className="err" role="alert">{fields[`items.${i}.sets`] ?? fields[`items.${i}.reps_min`] ?? fields[`items.${i}.reps_max`] ?? fields[`items.${i}.duration_s`]}</span>}
                </li>
              ))}
            </ol>
          ) : <p className="muted" style={{ margin: 0 }}>لا تمارين بعد. ابحث أدناه وأضف.</p>}
          {fields['items'] && <span className="err" role="alert">{fields['items']}</span>}
        </div>
        <Field label="أضف تمرينًا من مكتبة راشد" htmlFor="wo-q" hint={exercises.length ? 'اكتب جزءًا من الاسم بالعربي أو الإنجليزي.' : 'المكتبة غير متاحة الآن.'}>
          <input id="wo-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} disabled={!exercises.length} autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const f = found[0]; if (f) { setRows((r) => [...r, { exercise_id: f.id, en_name: f.english_name, ar_name: f.arabic_name, sets: 3, reps_min: 10, reps_max: 12, duration_s: null, per_side: false, note: null }]); setQ(''); } } }} />
        </Field>
        {q && (found.length ? (
          <ul className="pick-list" aria-label="نتائج البحث">
            {found.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => { setRows((r) => [...r, { exercise_id: e.id, en_name: e.english_name, ar_name: e.arabic_name, sets: 3, reps_min: 10, reps_max: 12, duration_s: null, per_side: false, note: null }]); setQ(''); }}>
                  <span><b>{e.arabic_name}</b> <small className="muted" lang="en" dir="ltr">{e.english_name}</small></span>
                  <small className="muted">{e.main_muscle_ar}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="muted" style={{ margin: 0 }}>لا نتائج.</p>)}
      </form>
    </Modal>
  );
}
