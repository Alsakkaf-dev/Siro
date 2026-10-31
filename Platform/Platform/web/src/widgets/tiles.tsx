import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { cx } from '../ui/ui.js';
import type { Assessment, Course, Semester } from '../../../shared/types.js';
import { DAY_MS, dueSortMs, parseISO, toISO } from '../../../shared/semester.js';
import { KIND_LABEL } from '../../../shared/constants.js';
import { daysFrom, relDays, whenText, fmtDateShort, fmtMonth, fmtWeekday, parseSlots, hhmm } from '../lib/format.js';
import { DAY_AR } from '../../../shared/constants.js';

const css = (c: string): CSSProperties => ({ '--c': c }) as CSSProperties;

export function useNow(ms = 30_000): number {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setN(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return n;
}

/* ───────── Pastel stat tile (d02 d07 d09) ───────── */
export function StatTile({ tone = 'purple', icon, label, value, sub, extra, to }: { tone?: 'purple' | 'orange' | 'blue' | 'green' | 'pink' | 'ink' | 'lime'; icon: IconName; label: string; value: ReactNode; sub?: ReactNode; extra?: ReactNode; to?: string }) {
  const body = (
    <>
      <span className="tile-ico"><Icon name={icon} size={20} /></span>
      <span className="tile-l">{label}</span>
      <strong className="tile-v num">{value}</strong>
      {sub && <span className="tile-s">{sub}</span>}
      {extra && <span className="tile-x">{extra}</span>}
    </>
  );
  return to ? <Link to={to} className={cx('tile', `tone-${tone}`)}>{body}</Link> : <div className={cx('tile', `tone-${tone}`)}>{body}</div>;
}

/* ───────── Hero gradient card (d11) ───────── */
export function Hero({ eyebrow, title, text, children, aside }: { eyebrow?: ReactNode; title: ReactNode; text?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-main">
        {eyebrow && <span className="hero-eb">{eyebrow}</span>}
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {children && <div className="row" style={{ marginBlockStart: 'var(--s-4)' }}>{children}</div>}
      </div>
      {aside && <div className="hero-aside">{aside}</div>}
    </section>
  );
}

/* ───────── Countdown timer card (d09 / d05 stopwatch) ───────── */
export function Countdown({ target, label, color = 'var(--accent)' }: { target: number; label: string; color?: string }) {
  const now = useNow(1000);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / DAY_MS);
  const h = Math.floor((diff % DAY_MS) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const p = (n: number): string => String(n).padStart(2, '0');
  return (
    <div className="countdown" style={css(color)}>
      <small>{label}</small>
      <div className="cd-digits num" dir="ltr" aria-label={`${d} يومًا و ${h} ساعة و ${m} دقيقة`}>
        <b>{d}</b><i>يوم</i>
        <b>{p(h)}</b><i>:</i>
        <b>{p(m)}</b><i>:</i>
        <b className="cd-s">{p(s)}</b>
      </div>
    </div>
  );
}

/* ───────── Deadline row with course-colour stripe (x03 x04 d09) ───────── */
export function DeadlineRow({ a, course, sem, now, to, compact }: { a: Assessment; course: Course | undefined; sem: Semester; now: number; to?: string; compact?: boolean }) {
  const due = dueSortMs(a, sem);
  const d = due === null ? null : daysFrom(now, due);
  const inner = (
    <>
      <span className="dl-stripe" style={{ background: course?.color ?? 'var(--accent)' }} />
      <span className="dl-main">
        <strong><bdi>{a.title}</bdi></strong>
        <small>
          <bdi>{course?.code}</bdi> · {KIND_LABEL[a.kind]}
          {!compact && <> · {whenText(a, sem)}</>}
        </small>
      </span>
      <span className="dl-r">
        <b className="num">{a.weight}%</b>
        {d !== null && <em className={cx(d <= 3 && 'hot')}>{relDays(d)}</em>}
      </span>
    </>
  );
  return to ? <Link to={to} className="dl">{inner}</Link> : <div className="dl">{inner}</div>;
}

/* ───────── Info carousel (d11) ───────── */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number): void => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8) * -1, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className="carousel" role="region" aria-label={label}>
      <div className="car-track" ref={ref} tabIndex={0}>
        {children}
      </div>
      <div className="car-nav">
        <button className="icon-btn sm" aria-label="السابق" onClick={() => go(-1)}><Icon name="right" size={16} /></button>
        <button className="icon-btn sm" aria-label="التالي" onClick={() => go(1)}><Icon name="left" size={16} /></button>
      </div>
    </div>
  );
}

/* ───────── Horizontal stepper with flags (x01) ───────── */
export function Stepper({ steps }: { steps: { label: string; sub?: string; state: 'done' | 'now' | 'next'; color?: string; flag?: string }[] }) {
  return (
    <ol className="stepper">
      {steps.map((s, i) => (
        <li key={i} className={`st-${s.state}`} style={css(s.color ?? 'var(--accent)')}>
          {s.flag && <span className="st-flag">{s.flag}</span>}
          <span className="st-node">{s.state === 'done' ? <Icon name="check" size={13} /> : <i />}</span>
          <strong>{s.label}</strong>
          {s.sub && <small>{s.sub}</small>}
        </li>
      ))}
    </ol>
  );
}

/* ───────── Vertical steps with big numbers (d10) ───────── */
export function VSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="vsteps">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="vs-n num">{i + 1}</span>
          <div>
            <strong>{s.title}</strong>
            <p>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ───────── Mini month calendar with deadline dots (d05 x02) ───────── */
export function MiniCalendar({ year, month, marks, today, onDay, selected }: { year: number; month: number; marks: Map<string, string[]>; today: number; onDay?: (iso: string) => void; selected?: string | null }) {
  const first = Date.UTC(year, month, 1);
  const startDow = new Date(first).getUTCDay(); // 0=Sun
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array<null>(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const todayISO = toISO(today);
  const names = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  return (
    <div className="minical">
      <div className="mc-head"><strong>{fmtMonth(first)}</strong></div>
      <div className="mc-grid" role="group" aria-label={fmtMonth(first)}>
        {names.map((n) => (
          <span key={n} className="mc-dow" aria-hidden="true">{n.slice(0, 2)}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const iso = toISO(Date.UTC(year, month, d));
          const cols = marks.get(iso);
          return (
            <button key={i} type="button" className={cx('mc-day', iso === todayISO && 'today', cols && 'has', selected === iso && 'sel')} onClick={() => onDay?.(iso)} aria-label={`${d} ${fmtMonth(first)}${cols ? ` — ${cols.length} موعد` : ''}`}>
              <span className="num">{d}</span>
              {cols && (
                <span className="mc-dots">
                  {cols.slice(0, 3).map((c, k) => (
                    <i key={k} style={{ background: c }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Week timetable from schedule strings (x02 d05) ───────── */
export function WeekTimetable({ courses, todayDow }: { courses: Course[]; todayDow: number }) {
  const slots = courses.flatMap((c) => parseSlots(c.schedule).map((s) => ({ c, s })));
  if (!slots.length) return <p className="muted">لا توجد أوقات محاضرات مسجّلة بعد.</p>;
  const min = Math.floor(Math.min(...slots.map((x) => x.s.start), 8 * 60) / 60) * 60;
  const max = Math.ceil(Math.max(...slots.map((x) => x.s.end), 17 * 60) / 60) * 60;
  const hours: number[] = [];
  for (let m = min; m < max; m += 60) hours.push(m);
  // الأحد–الخميس دائمًا، والجمعة/السبت إن وُجدت فيهما محاضرة (مثل SKEX2123 الجمعة)
  const days = [0, 1, 2, 3, 4, ...[5, 6].filter((d) => slots.some((x) => x.s.day === d))];
  const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  void DAY_AR;
  const H = 52;
  return (
    <div className="tt-wrap" tabIndex={0} role="region" aria-label="الجدول الأسبوعي للمحاضرات"><div className="tt" style={{ '--rows': hours.length, '--h': `${H}px`, gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` } as CSSProperties}>
      <div className="tt-corner" />
      {days.map((d) => (
        <div key={d} className={cx('tt-dh', d === todayDow && 'today')}>{dayName[d]}</div>
      ))}
      <div className="tt-hours">
        {hours.map((h) => (
          <span key={h} style={{ height: H }}>{hhmm(h)}</span>
        ))}
      </div>
      {days.map((d) => (
        <div key={d} className={cx('tt-col', d === todayDow && 'today')} style={{ height: hours.length * H }}>
          {hours.map((h) => (
            <i key={h} style={{ height: H }} />
          ))}
          {slots
            .filter((x) => x.s.day === d)
            .map((x, i) => (
              <div key={i} className="tt-ev" style={{ top: ((x.s.start - min) / 60) * H + 2, height: ((x.s.end - x.s.start) / 60) * H - 4, ...css(x.c.color) }} title={`${x.c.name} · ${hhmm(x.s.start)}–${hhmm(x.s.end)}`}>
                <strong><bdi>{x.c.code}</bdi></strong>
                <small className="num" dir="ltr">{hhmm(x.s.start)}–{hhmm(x.s.end)}</small>
              </div>
            ))}
        </div>
      ))}
    </div></div>
  );
}

export { fmtDateShort, fmtWeekday, parseISO };
