import '../styles/kitchen.css';
import '../styles/calendar.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Field, Modal, Segmented, Skeleton } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { useUrlParam, useUrlSet } from '../core/useUrlParam.js';
import { addDays, dateOf, eventsOnDay, isDate, mealSlotOf, todayKL, weekStartOf, TERM_WINDOW, type CalEvent } from '../../../shared/calendar/index.js';
import { LAW, fmtKcal, type Slot } from '../../../shared/kitchen/index.js';
import { fetchPlan, type PlanDayRow } from '../kitchen/store.js';
import { DayMeals } from '../calendar/DayMeals.js';
import { fmtNum } from '../../../shared/kitchen/index.js';
import { CalendarApiError, clearImport, fetchSources, fetchView, importSnapshot, syncGraph, type SourceChoice, type SourceInfo, type ViewResp } from '../calendar/api.js';
import { EventDetail, ListView, MonthGrid, TimeGrid, VerifyCard, calClass } from '../calendar/grid.js';
import { dayName, dayNum, fmtDay, monthGridRange, monthName, sinceText } from '../calendar/fmt.js';

type View = 'week' | 'day' | 'month' | 'list';
const VIEWS: readonly View[] = ['week', 'day', 'month', 'list'];
const SOURCE_NAME: Record<string, string> = { graph: 'Outlook (Graph)', import: 'لقطة مستوردة', routine: 'خريطة الروتين', none: 'لا مصدر' };

/** الجدول CAL (K-M9): قراءة فقط. الشبكة الأسبوعية/اليومية/الشهرية/القائمة، فلاتر التقاويم، التحقق CAL-18، لقطة بلا اتصال. */
export default function Calendar() {
  const { toast, confirm } = useApp();
  const narrow = typeof window !== 'undefined' && window.innerWidth < 700;
  const [view, setView] = useUrlParam<View>('view', narrow ? 'day' : 'week', VIEWS);
  const [dateRaw, setDate] = useUrlParam<string>('date', '');
  const [src, setSrc] = useUrlParam<SourceChoice>('source', 'auto', ['auto', 'graph', 'import', 'routine']);
  const [hidden, setHidden] = useUrlSet('hide');
  const today = todayKL();
  const date = isDate(dateRaw) ? dateRaw : today;
  const range = useMemo(() => {
    if (view === 'day') return { from: date, to: date };
    if (view === 'month') return monthGridRange(date);
    const w = weekStartOf(date);
    return { from: w, to: addDays(w, view === 'list' ? 13 : 6) };
  }, [view, date]);
  const [data, setData] = useState<ViewResp | null>(null);
  const [offline, setOffline] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<CalEvent | null>(null);
  const [imp, setImp] = useState(false);
  const [meal, setMeal] = useState<{ date: string; slot: Slot } | null>(null);
  const [planDays, setPlanDays] = useState<PlanDayRow[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const seq = useRef(0);

  const load = useCallback(() => {
    const my = ++seq.current;
    setBusy(true);
    fetchView(range.from, range.to, src)
      .then((r) => { if (my === seq.current) { setData(r.data); setOffline(r.offline ? r.savedAt : null); setErr(''); } })
      .catch((e: unknown) => { if (my === seq.current) setErr(e instanceof Error ? e.message : 'تعذّر التحميل'); })
      .finally(() => { if (my === seq.current) setBusy(false); });
  }, [range.from, range.to, src]);
  useEffect(load, [load]);
  useEffect(() => { void fetchSources().then((r) => setSources(r.sources)).catch(() => setSources([])); }, [data?.source]);

  useEffect(() => { if (view === 'week' || view === 'day') void fetchPlan(range.from, view === 'day' ? 1 : 7).then((r) => setPlanDays(r.days)).catch(() => setPlanDays([])); }, [view, range.from, meal]);
  const onPickEvent = (e: CalEvent): void => { const s = mealSlotOf(e); if (s) setMeal({ date: dateOf(e.start), slot: s }); else setPick(e); };
  const shown = useMemo(() => (data?.events ?? []).filter((e) => !hidden.has(e.calendar)), [data, hidden]);
  const hiddenWith = useMemo(() => (data?.calendars ?? []).filter((c) => hidden.has(c.name) && c.count > 0), [data, hidden]);
  const toggleCal = (n: string): void => { const s = new Set(hidden); if (s.has(n)) s.delete(n); else s.add(n); setHidden(s); };
  const step = view === 'month' ? 0 : view === 'day' ? 1 : 7;
  const go = (dir: -1 | 1): void => {
    if (view === 'month') {
      const [y, m] = [Number(date.slice(0, 4)), Number(date.slice(5, 7))];
      const t = new Date(Date.UTC(y, m - 1 + dir, 1)).toISOString().slice(0, 10);
      setDate(t);
    } else setDate(addDays(date, dir * step));
  };
  const days = useMemo(() => { const o: string[] = []; for (let d = range.from; d <= range.to; d = addDays(d, 1)) o.push(d); return o; }, [range]);
  const title = view === 'day' ? fmtDay(date) : view === 'month' ? `${monthName(date)} ${date.slice(0, 4)}` : `${dayNum(range.from)} ${monthName(range.from)} – ${dayNum(range.to)} ${monthName(range.to)} ${range.to.slice(0, 4)}`;

  const doImport = async (b: Parameters<typeof importSnapshot>[0]): Promise<void> => {
    try {
      const r = await importSnapshot(b);
      toast(`استُوردت ${r.imported} حدثًا${r.skipped_count ? ` (تخطّيت ${r.skipped_count})` : ''}`, { kind: 'ok' });
      setImp(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'فشل الاستيراد', { kind: 'error' });
    }
  };
  const graph = sources.find((s) => s.id === 'graph');
  const doSync = async (): Promise<void> => {
    try {
      const r = await syncGraph(TERM_WINDOW.from, TERM_WINDOW.to);
      toast(`زوامن ${r.synced} حدثًا${r.errors.length ? ` — أخفق: ${r.errors.map((x) => x.calendar).join('، ')}` : ''}`, { kind: r.errors.length ? 'error' : 'ok' });
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'فشلت المزامنة', { kind: 'error' });
    }
  };
  const doClear = async (): Promise<void> => {
    if (!(await confirm({ title: 'حذف اللقطة المستوردة؟', body: 'تُحذف من قاعدة المنصة فقط؛ Outlook لا يتأثر.', confirmLabel: 'احذف' }))) return;
    await clearImport();
    load();
  };

  return (
    <div className="page cal-page">
      <PageHead title="الجدول" icon="calendar" sub="قراءة فقط: بتوقيت كوالالمبور. لا شيء يُكتب في Outlook من هنا." actions={<div className="row"><Button size="sm" icon="upload" onClick={() => setImp(true)}>استيراد لقطة</Button><Button size="sm" icon="refresh" onClick={load} disabled={busy} aria-label="تحديث">تحديث</Button></div>} />

      <div className="cal-bar" role="toolbar" aria-label="أدوات الجدول">
        <Button size="sm" icon="right" aria-label={view === 'month' ? 'الشهر السابق' : view === 'day' ? 'اليوم السابق' : 'الأسبوع السابق'} onClick={() => go(-1)} />
        <Button size="sm" icon="left" aria-label={view === 'month' ? 'الشهر التالي' : view === 'day' ? 'اليوم التالي' : 'الأسبوع التالي'} onClick={() => go(1)} />
        <Button size="sm" onClick={() => setDate('')} disabled={date === today}>اليوم</Button>
        <h2 className="cal-title" data-testid="cal-title">{title}</h2>
        <span className="grow" />
        <Segmented<View> label="العرض" value={view} onChange={setView} options={[{ value: 'week', label: 'أسبوعي' }, { value: 'day', label: 'يومي' }, { value: 'month', label: 'شهري' }, { value: 'list', label: 'قائمة' }]} />
        <select className="select" aria-label="مصدر الجدول" value={src} onChange={(e) => setSrc(e.target.value as SourceChoice)}>
          <option value="auto">المصدر: تلقائي</option>
          <option value="graph">Outlook (Graph)</option>
          <option value="import">لقطة مستوردة</option>
          <option value="routine">خريطة الروتين</option>
        </select>
      </div>

      {data && (
        <div className="cal-banner row" role="status" data-testid="cal-source">
          <Badge tone={data.source === 'graph' ? 'ok' : data.source === 'none' ? 'danger' : 'warn'}>{SOURCE_NAME[data.source]}</Badge>
          {data.last_sync && <small>آخر مزامنة: {sinceText(data.last_sync)}</small>}
          {(data.stale || offline) && <Badge tone="warn">قد تكون قديمة{offline ? ' — لا اتصال، لقطة محفوظة' : ''}</Badge>}
          {data.note && <small className="muted">{data.note}</small>}
          {graph?.configured && flagEnabled('calendar.outlook.read') && <Button size="sm" icon="refresh" onClick={() => void doSync()}>زامن Outlook</Button>}
          {data.source === 'import' && <Button size="sm" icon="trash" onClick={() => void doClear()}>احذف اللقطة</Button>}
        </div>
      )}
      {data && data.holidays.length > 0 && <p className="callout" role="note">{data.holidays.map((h) => `${h.name_ar} (${h.from}${h.to !== h.from ? ` → ${h.to}` : ''})`).join(' · ')} — عطل مسجّلة؛ القالب لا يحذف المحاضرات فيها.</p>}
      {err && !data && <p className="callout danger" role="alert">{err}</p>}

      {data && data.calendars.length > 0 && (
        <div className="cal-filters" role="group" aria-label="التقاويم">
          {data.calendars.map((c) => (
            <button key={c.name} type="button" className={`cal-fchip ${calClass(c.name)}${hidden.has(c.name) && c.count ? ' hidden-has' : ''}`} aria-pressed={!hidden.has(c.name)} onClick={() => toggleCal(c.name)}>
              <i className="cal-sw" aria-hidden="true" /> {c.name} <small className="num">{fmtNum(c.count)}</small>
            </button>
          ))}
        </div>
      )}
      {hiddenWith.length > 0 && <p className="callout warn" role="note" data-testid="cal-hidden-warn"><Icon name="warn" size={14} /> تقاويم مخفية في هذا العرض وفيها أحداث: {hiddenWith.map((c) => `${c.name} (${fmtNum(c.count)})`).join('، ')} — ستبدو لك فراغًا.</p>}

      {!data && !err && <Skeleton h={360} />}
      {data && data.source === 'none' && <EmptyState icon="calendar" title="لا مصدر للجدول بعد" text="لا لقطة مستوردة. صدّر تقويم Outlook كملف ICS ثم استورده." action={<Button variant="primary" icon="upload" onClick={() => setImp(true)}>استيراد لقطة</Button>} />}
      {data && data.source !== 'none' && (
        <Card>
          {view === 'week' || view === 'day' ? <TimeGrid days={days} events={shown} onPick={onPickEvent} onDayClick={view === 'week' ? (d) => { setDate(d); setView('day'); } : undefined} headExtra={(d) => { const pd = planDays.find((x) => x.date === d); return pd ? <span className={`cal-head-chip ${pd.status === 'partial' ? 'part' : pd.total_kcal >= LAW.MIN && pd.total_kcal <= LAW.MAX ? 'ok' : 'bad'}`} title="مجموع وجبات اليوم المخطّطة"><Icon name="utensils" size={10} /> <span className="num">{fmtKcal(pd.total_kcal)}</span></span> : null; }} /> : null}
          {view === 'month' && <MonthGrid month={date} from={range.from} to={range.to} events={shown} onDay={(d) => { setDate(d); setView('day'); }} />}
          {view === 'list' && <ListView days={days} events={shown} onPick={onPickEvent} />}
          {shown.length === 0 && <p className="muted">لا أحداث ظاهرة في هذا المدى{hidden.size ? ' (بعض التقاويم مخفية)' : ''}.</p>}
        </Card>
      )}
      {data && data.source !== 'none' && <VerifyCard v={data.verify} source={data.source} />}
      {data && view === 'day' && (
        <Card id="day-meals">
          <div className="row"><h2 className="cal-title">وجبات اليوم</h2><span className="grow" /><Button size="sm" to={`/calendar/meals?date=${date}`}>صفحة الوجبات</Button></div>
          <DayMeals date={date} events={data.events} />
        </Card>
      )}
      <p className="muted"><small>{eventsOnDay(shown, date).length > 0 && view === 'day' ? `${dayName(date)}: ${fmtNum(eventsOnDay(shown, date).length)} حدثًا.` : null}</small></p>

      {meal && <Modal title={`وجبات ${fmtDay(meal.date)}`} wide onClose={() => setMeal(null)} footer={<Button onClick={() => setMeal(null)}>إغلاق</Button>}><DayMeals date={meal.date} focus={meal.slot} events={data?.events ?? []} /></Modal>}
      {pick && <Modal title={pick.title} onClose={() => setPick(null)} footer={<Button onClick={() => setPick(null)}>إغلاق</Button>}><EventDetail ev={pick} /></Modal>}
      {imp && <ImportModal onClose={() => setImp(false)} onImport={(b) => void doImport(b)} />}
    </div>
  );
}

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (b: { format: 'ics' | 'json'; text: string; calendar?: string; from?: string; to?: string }) => void }) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [from, setFrom] = useState<string>(TERM_WINDOW.from);
  const [to, setTo] = useState<string>(TERM_WINDOW.to);
  const fmt = /^\s*[[{]/.test(text) ? 'json' : 'ics';
  const onFile = (f: File | undefined): void => {
    if (!f) return;
    void f.text().then((t) => {
      setText(t);
      if (!name && f.name.toLowerCase().endsWith('.ics')) setName(f.name.replace(/\.ics$/i, ''));
    });
  };
  return (
    <Modal title="استيراد لقطة من Outlook" onClose={onClose} wide footer={<><Button onClick={onClose}>إلغاء</Button><Button variant="primary" icon="upload" disabled={text.trim().length < 2} onClick={() => onImport({ format: fmt, text, ...(name.trim() ? { calendar: name.trim() } : {}), from, to })}>استورد</Button></>}>
      <div className="stack">
        <p className="muted">صدّر تقويمًا واحدًا من Outlook كملف ICS (أو JSON بالتنسيق الموثّق) والصقه أو اخترْه. اللقطة تُخزَّن في قاعدة المنصة وتحلّ محل ما سبق لنفس التقويم. لا تُكتب أي بيانات في Outlook.</p>
        <Field label="ملف ICS / JSON"><input type="file" accept=".ics,.json,text/calendar,application/json" onChange={(e) => onFile(e.target.files?.[0])} /></Field>
        <Field label="أو الصق المحتوى"><textarea className="input cal-import-text" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="BEGIN:VCALENDAR …" /></Field>
        <div className="row">
          <Field label="اسم التقويم (إن لم يذكره الملف)"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="دراسة" /></Field>
          <Field label="من"><input className="input" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="إلى"><input className="input" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <small className="muted">الصيغة المكتشفة: {fmt.toUpperCase()}. المتكرر يُفرَد ضمن المدى فقط (حتى 400 يوم).</small>
      </div>
    </Modal>
  );
}
