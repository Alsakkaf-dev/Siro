import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '../lib/icons.js';
import { Badge } from '../ui/ui.js';
import { addDays, dayStartMin, eventsOnDay, hm, kindOf, layoutDay, todayKL, wallMin, type Cal18, type CalEvent } from '../../../shared/calendar/index.js';
import { fmtNum } from '../../../shared/kitchen/index.js';
import { dayName, dayNum, durText, fmtDay, timeRange } from './fmt.js';

export const HOUR_H = 44;

/** لون التقويم (CAL-21): من رموز التصميم الموجودة فقط */
const CAL_CLASS: Record<string, string> = { 'دراسة': 'c-study', 'صلاة': 'c-prayer', 'روتين وصحة': 'c-routine', 'وقت فراغ': 'c-free', 'مال وفواتير': 'c-money', 'عام': 'c-general' };
export const calClass = (name: string): string => CAL_CLASS[name] ?? 'c-other';

export const KIND_LABEL: Record<string, string> = { sleep: 'نوم', lecture: 'محاضرة', prayer: 'صلاة', meal: 'وجبة', free: 'وقت فراغ', study: 'دراسة', workout: 'تمرين', routine: 'روتين', other: 'آخر' };

export function EventBlock({ ev, top, height, col, cols, onPick, extra }: { ev: CalEvent; top: number; height: number; col: number; cols: number; onPick: (e: CalEvent) => void; extra?: string }) {
  const kind = kindOf(ev);
  const mins = wallMin(ev.end) - wallMin(ev.start);
  return (
    <button
      type="button"
      className={`cal-ev ${calClass(ev.calendar)} k-${kind}${ev.show_as === 'free' ? ' is-free' : ''}${mins < 20 ? ' is-short' : ''}${extra ? ` ${extra}` : ''}`}
      style={{ insetBlockStart: `${(top / 1440) * 100}%`, blockSize: `${(height / 1440) * 100}%`, insetInlineStart: `${(col / cols) * 100}%`, inlineSize: `${100 / cols}%` }}
      onClick={() => onPick(ev)}
      aria-label={`${ev.title}، ${timeRange(ev.start, ev.end)}، ${ev.calendar}`}
      title={`${ev.title} · ${timeRange(ev.start, ev.end)} · ${ev.calendar}`}
      data-testid="cal-event"
    >
      <span className="cal-ev-t">{ev.title}</span>
      {height >= 40 && <span className="cal-ev-s num" dir="ltr">{timeRange(ev.start, ev.end)}</span>}
    </button>
  );
}

/** شبكة زمنية: أعمدة أيام (واحد أو سبعة) وخط الزمن 00–24 */
export function TimeGrid({ days, events, onPick, overlay, onDayClick, headExtra }: { days: string[]; events: CalEvent[]; onPick: (e: CalEvent) => void; overlay?: (date: string) => React.ReactNode; onDayClick?: (d: string) => void; headExtra?: (date: string) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const today = todayKL();
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 5.5 * HOUR_H;
  }, [days[0], days.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const nowMin = (() => {
    const w = new Date(Date.now() + 8 * 3_600_000);
    return w.getUTCHours() * 60 + w.getUTCMinutes();
  })();
  // أحداث «متاح» (الفراغ) خلفية بعرض كامل؛ الباقي يتجاور بأعمدة فلا تضيق المحاضرة بسبب الفراغ
  const placed = useMemo(() => days.map((d) => {
    const day = eventsOnDay(events, d);
    const free = layoutDay(day.filter((e) => e.show_as === 'free'), d).map((p) => ({ ...p, col: 0, cols: 1, bg: true }));
    const busy = layoutDay(day.filter((e) => e.show_as !== 'free'), d).map((p) => ({ ...p, bg: false }));
    return { d, items: [...free, ...busy] };
  }), [days, events]);
  return (
    <div className="cal-wrap" ref={ref} tabIndex={0} role="region" aria-label="شبكة الجدول الزمنية">
      <div className="cal-grid" style={{ ['--cols' as string]: days.length, ['--hh' as string]: `${HOUR_H}px` }}>
        <div className="cal-head cal-corner" />
        {days.map((d) => (
          <div key={d} className={`cal-head${d === today ? ' today' : ''}`}>
            {onDayClick ? <button type="button" className="cal-head-b" onClick={() => onDayClick(d)} aria-label={`افتح ${fmtDay(d)}`}><b>{dayName(d)}</b> <span className="num">{fmtNum(dayNum(d))}</span></button> : <><b>{dayName(d)}</b> <span className="num">{fmtNum(dayNum(d))}</span></>}
            {headExtra?.(d)}
          </div>
        ))}
        <div className="cal-hours" aria-hidden="true">
          {Array.from({ length: 24 }, (_, h) => <span key={h} style={{ insetBlockStart: `${(h / 24) * 100}%` }} className="num" dir="ltr">{hm(h * 60)}</span>)}
        </div>
        {placed.map(({ d, items }) => (
          <div key={d} className={`cal-col${d === today ? ' today' : ''}`} role="group" aria-label={fmtDay(d)}>
            {Array.from({ length: 23 }, (_, h) => <i key={h} className="cal-line" style={{ insetBlockStart: `${((h + 1) / 24) * 100}%` }} aria-hidden="true" />)}
            {items.map((p) => <EventBlock key={p.ev.id + d} ev={p.ev} top={p.top} height={p.height} col={p.col} cols={p.cols} onPick={onPick} {...(p.bg ? { extra: 'bg' } : {})} />)}
            {overlay?.(d)}
            {d === today && <i className="cal-now" style={{ insetBlockStart: `${(nowMin / 1440) * 100}%` }} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthGrid({ month, from, to, events, onDay }: { month: string; from: string; to: string; events: CalEvent[]; onDay: (d: string) => void }) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const today = todayKL();
  return (
    <div className="cal-month" role="grid" aria-label="الشهر">
      {days.slice(0, 7).map((d) => <div key={d} className="cal-mh" role="columnheader">{dayName(d)}</div>)}
      {days.map((d) => {
        const evs = eventsOnDay(events, d).filter((e) => e.show_as !== 'free' && kindOf(e) !== 'sleep');
        const mine = d.slice(0, 7) === month.slice(0, 7);
        return (
          <button key={d} type="button" role="gridcell" className={`cal-md${d === today ? ' today' : ''}${mine ? '' : ' out'}`} onClick={() => onDay(d)} aria-label={`${fmtDay(d)}: ${evs.length} حدثًا`}>
            <b className="num">{fmtNum(dayNum(d))}</b>
            <span className="cal-md-n">{evs.slice(0, 3).map((e) => <span key={e.id} className={`cal-chip ${calClass(e.calendar)}`}>{e.title}</span>)}</span>
            {evs.length > 3 && <small className="muted">+<span className="num">{fmtNum(evs.length - 3)}</span></small>}
          </button>
        );
      })}
    </div>
  );
}

export function ListView({ days, events, onPick }: { days: string[]; events: CalEvent[]; onPick: (e: CalEvent) => void }) {
  return (
    <div className="cal-list">
      {days.map((d) => {
        const evs = eventsOnDay(events, d).sort((a, b) => wallMin(a.start) - wallMin(b.start));
        return (
          <section key={d} aria-label={fmtDay(d)}>
            <h3 className="cal-list-h">{fmtDay(d)} <small className="muted num">{fmtNum(evs.length)}</small></h3>
            {evs.length === 0 ? <p className="muted">لا أحداث.</p> : (
              <ul className="plain">
                {evs.map((e) => (
                  <li key={e.id + d}>
                    <button type="button" className={`cal-row ${calClass(e.calendar)}`} onClick={() => onPick(e)}>
                      <span className="cal-row-t num" dir="ltr">{timeRange(e.start, e.end)}</span>
                      <span className="cal-row-n">{e.title}</span>
                      <small className="muted">{e.calendar}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function EventDetail({ ev }: { ev: CalEvent }) {
  const min = wallMin(ev.end) - wallMin(ev.start);
  return (
    <div className="stack">
      <p><b>{ev.title}</b></p>
      <p className="row cal-det"><Icon name="clock" size={15} /> <span className="num" dir="ltr">{ev.start.slice(0, 10)} {timeRange(ev.start, ev.end)}</span> <small className="muted">({durText(min)})</small></p>
      <p className="row cal-det"><span className={`cal-sw ${calClass(ev.calendar)}`} aria-hidden="true" /> {ev.calendar} · <Badge dashed>{KIND_LABEL[kindOf(ev)]}</Badge>{ev.series && <Badge dashed>سلسلة</Badge>}{ev.show_as === 'free' && <Badge dashed>متاح (free)</Badge>}</p>
      {ev.categories.length > 0 && <p className="row cal-det">{ev.categories.map((c) => <Badge key={c}>{c}</Badge>)}</p>}
      {ev.description ? <pre className="kt-body-text" dir="rtl">{ev.description}</pre> : <p className="muted">بلا وصف.</p>}
    </div>
  );
}

/** بطاقة ثلاثية التحقق CAL-18 (0/0/0) مع تفاصيل قابلة للفتح */
export function VerifyCard({ v, source }: { v: Cal18; source: string }) {
  const items: { key: string; label: string; n: number; rows: string[] }[] = [
    { key: 'overlaps', label: 'تداخلات', n: v.overlaps.length, rows: v.overlaps.slice(0, 40).map((o) => `${o.date} ${o.start.slice(11)}–${o.end.slice(11)} (${o.minutes} د): ${o.a_title} ⟷ ${o.b_title}`) },
    { key: 'gaps', label: 'فجوات', n: v.gaps.length, rows: v.gaps.slice(0, 40).map((g) => `${g.date} ${g.start.slice(11)}–${g.minutes >= 1440 ? '24:00' : g.end.slice(11)} (${g.minutes} د${g.action === 'absorb' ? '، تُضاف للجار' : '، تُغطّى بحدث فراغ'})${g.before ? ` بعد «${g.before}»` : ''}`) },
    { key: 'short', label: 'أقصر من 20 دقيقة', n: v.short.length, rows: v.short.slice(0, 40).map((s) => `${s.start.slice(0, 10)} ${s.start.slice(11)}: ${s.title} (${s.minutes} د)`) },
  ];
  return (
    <section className="cal-verify" aria-label="التحقق CAL-18" data-testid="cal18" data-ok={v.ok ? '1' : '0'}>
      <div className="row cal-verify-top">
        <b>التحقق CAL-18</b>
        <span className="cal-triple num" dir="ltr" data-testid="cal18-triple">{items.map((i) => fmtNum(i.n)).join(' / ')}</span>
        {v.ok ? <Badge tone="ok"><Icon name="check" size={12} /> نظيف</Badge> : <Badge tone="danger"><Icon name="warn" size={12} /> مخالفات</Badge>}
        <small className="muted">يشمل كل التقاويم حتى المخفية في العرض (CAL-17) · {fmtNum(v.days_checked)} أيام</small>
      </div>
      <div className="cal-verify-tiles">
        {items.map((i) => (
          <details key={i.key} className={i.n ? 'bad' : 'good'}>
            <summary><b className="num">{fmtNum(i.n)}</b> {i.label} {i.n === 0 ? <Icon name="check" size={13} /> : <Icon name="warn" size={13} />}</summary>
            {i.rows.length > 0 && <ul className="plain kt-tight">{i.rows.map((r, k) => <li key={k}><small className="num">{r}</small></li>)}</ul>}
          </details>
        ))}
      </div>
      {v.default_calendar.length > 0 && <p className="callout danger" role="alert">أحداث داخل التقويم الافتراضي «Calendar» (CAL-14): {v.default_calendar.slice(0, 5).map((x) => x.title).join('، ')}</p>}
      {v.night.length > 0 && <p className="callout warn" role="note">{fmtNum(v.night.length)} حدثًا يمسّ الليل المحجوز 21:40–05:10 (CAL-19، استشاري).</p>}
      {source === 'routine' && <small className="muted">الفحص هنا على قالب «خريطة الروتين» لا على أحداث Outlook نفسها؛ الفجوات المبلّغ عنها قد تكون في القالب لا في تقويمك.</small>}
    </section>
  );
}
