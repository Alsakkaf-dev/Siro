import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { Avatar, Badge, KebabMenu, Unknown, cx } from '../ui/ui.js';
import { Ring } from './charts.js';
import type { Assessment, Course, Semester } from '../../../shared/types.js';
import type { CourseCalc } from '../../../shared/calc.js';
import { KIND_COLOR, KIND_LABEL } from '../../../shared/constants.js';
import { dueSortMs, weightSum } from '../../../shared/semester.js';
import { daysFrom, initials, prettySchedule, relDays } from '../lib/format.js';

const css = (c: string): CSSProperties => ({ '--c': c }) as CSSProperties;

/* ───────── Course catalog card (grid) / row (list): d02 d07 d11 ───────── */
export function CourseCard({ course, items, calc, sem, now, to, view, onEdit, onDelete, onAdd }: { course: Course; items: Assessment[]; calc: CourseCalc; sem: Semester; now: number; to: string; view: 'grid' | 'list'; onEdit: () => void; onDelete: () => void; onAdd: () => void }) {
  const sum = weightSum(items);
  const unknown = items.filter((a) => a.timing === 'unknown').length;
  const kinds = new Map<string, number>();
  for (const a of items) kinds.set(a.kind, (kinds.get(a.kind) ?? 0) + a.weight);
  const next = items
    .filter((a) => a.status !== 'graded' && a.status !== 'submitted')
    .map((a) => ({ a, t: dueSortMs(a, sem) }))
    .filter((x): x is { a: Assessment; t: number } => x.t !== null && x.t >= now)
    .sort((x, y) => x.t - y.t)[0];
  const lecturer = course.lecturer ?? null;
  const menu = [
    { label: 'تعديل المادة', icon: 'edit' as IconName, onClick: onEdit },
    { label: 'إضافة تقييم', icon: 'plus' as IconName, onClick: onAdd },
    { label: 'حذف المادة', icon: 'trash' as IconName, onClick: onDelete, danger: true },
  ];
  const ring = <Ring value={calc.graded ? (calc.performance ?? 0) : 0} size={52} stroke={6} color={course.color} label={calc.graded ? Math.round(calc.performance ?? 0) : '—'} sub={calc.graded ? `أداؤك في المصحَّح ${Math.round(calc.performance ?? 0)}%` : 'لا توجد علامات بعد'} />;
  const mix = (
    <div className="mix" role="img" aria-label="توزيع الأوزان حسب النوع">
      {[...kinds.entries()].sort((x, y) => y[1] - x[1]).map(([k, w]) => (
        <i key={k} style={{ flexGrow: w, background: KIND_COLOR[k as keyof typeof KIND_COLOR] }} title={`${KIND_LABEL[k as keyof typeof KIND_LABEL]} ${Math.round(w * 10) / 10}%`} />
      ))}
    </div>
  );
  if (view === 'list') {
    return (
      <article className="cc cc-row" style={css(course.color)}>
        <span className="cc-stripe" />
        <Link to={to} className="cc-main">
          <strong className="cc-code"><bdi>{course.code}</bdi></strong>
          <span className="cc-name"><bdi>{course.name}</bdi></span>
        </Link>
        <span className="cc-cell"><Icon name="user" size={14} /> <bdi>{lecturer ?? 'غير معروف'}</bdi></span>
        <span className="cc-cell num">{course.credits ?? '؟'} ساعات</span>
        <span className="cc-cell num">{items.length} تقييم</span>
        <span className="cc-cell">{Math.abs(sum - 100) > 0.005 && items.length > 0 ? <Badge tone="warn">مجموع الأوزان {sum}%</Badge> : <Badge tone="ok">100%</Badge>}</span>
        {ring}
        <button type="button" className="btn sm ghost" onClick={onAdd} aria-label={`إضافة تقييم إلى ${course.code}`}><Icon name="plus" size={14} /> تقييم</button>
        <KebabMenu items={menu} label={`خيارات ${course.code}`} />
      </article>
    );
  }
  return (
    <article className="cc" style={css(course.color)}>
      <Link to={to} className="cc-cover">
        <span className="sr-only">افتح {course.name}: </span><span className="cc-code"><bdi>{course.code}</bdi></span>
        <span className="cc-credit">{course.credits === null ? <Unknown text="الساعات؟" /> : <span className="pill-dark num">{course.credits} ساعات</span>}</span>
        <span className="cc-pattern" aria-hidden="true" />
      </Link>
      <div className="cc-body">
        <div className="cc-titlerow">
          <div style={{ minWidth: 0 }}>
            <Link to={to} className="cc-title"><bdi>{course.name}</bdi></Link>
            {course.name_ar && <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{course.name_ar}</div>}
          </div>
          <span className="row" style={{ gap: 2, flexWrap: 'nowrap' }}>
            <button type="button" className="btn sm ghost" onClick={onAdd} aria-label={`إضافة تقييم إلى ${course.code}`}><Icon name="plus" size={14} /> تقييم</button>
            <KebabMenu items={menu} label={`خيارات ${course.code}`} />
          </span>
        </div>
        <div className="cc-meta">
          <span>{lecturer ? <><Avatar text={initials(lecturer)} color={course.color} /> <bdi>{lecturer}</bdi></> : <><Icon name="user" size={14} /> <Unknown text="المحاضر غير معروف" /></>}</span>
          {course.schedule && <span><Icon name="clock" size={14} /> <bdi>{prettySchedule(course.schedule).split('·')[0]?.trim()}</bdi></span>}
        </div>
        {mix}
        <div className="cc-tags">
          <Badge tone="accent">{items.length} تقييم</Badge>
          {items.length > 0 && (Math.abs(sum - 100) > 0.005 ? <Badge tone="warn" title="يجب أن يكون المجموع 100%">مجموع الأوزان {sum}%</Badge> : <Badge tone="ok">100%</Badge>)}
          {unknown > 0 && <Unknown text={`${unknown} بلا موعد`} />}
          {course.min_final !== null && <Badge dashed>حدّ أدنى للنهائي {course.min_final}</Badge>}
        </div>
      </div>
      <div className="cc-foot">
        {ring}
        <div className="cc-next">
          {next ? (
            <>
              <small>الأقرب</small>
              <strong><bdi>{next.a.title}</bdi></strong>
              <em className="num">{relDays(daysFrom(now, next.t))} · {next.a.weight}%</em>
            </>
          ) : (
            <>
              <small>الأقرب</small>
              <strong>{items.length ? 'لا موعد معروف' : 'لا تقييمات'}</strong>
            </>
          )}
        </div>
        <Link to={to} className="btn sm ghost" aria-label={`فتح ${course.code}`}>فتح <Icon name="left" size={14} /></Link>
      </div>
    </article>
  );
}

/* ───────── Facet panel (checkbox groups with counts): d02 d07 ───────── */
export function Facet({ title, options, selected, onToggle }: { title: string; options: { value: string; label: string; count: number; color?: string }[]; selected: Set<string>; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <fieldset className="facet">
      <legend>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {title} <Icon name={open ? 'up' : 'down'} size={14} />
        </button>
      </legend>
      {open &&
        options.map((o) => (
          <label key={o.value} className="facet-opt">
            <input type="checkbox" checked={selected.has(o.value)} onChange={() => onToggle(o.value)} />
            <i className="fx" style={o.color ? { '--c': o.color } as CSSProperties : undefined} />
            <span className="fx-l"><bdi>{o.label}</bdi></span>
            <span className="fx-n num">{o.count}</span>
          </label>
        ))}
    </fieldset>
  );
}

/* ───────── Active filter chips row (d02) ───────── */
export function FilterChips({ chips, onClear, onRemove }: { chips: { key: string; label: string }[]; onClear: () => void; onRemove: (k: string) => void }) {
  if (!chips.length) return null;
  return (
    <div className="fchips" aria-label="المرشحات المفعّلة">
      {chips.map((c) => (
        <button key={c.key} type="button" className="chip active" onClick={() => onRemove(c.key)} aria-label={`إزالة ${c.label}`}>
          {c.label} <Icon name="x" size={12} />
        </button>
      ))}
      <button type="button" className="btn sm ghost" onClick={onClear}>مسح الكل</button>
    </div>
  );
}

/* ───────── Document-hub table (d01 d13 d14): header, checkboxes, type icon, tags, pager ───────── */
export interface Col<T> { key: string; head: string; width?: string; cell: (r: T) => ReactNode; sort?: (a: T, b: T) => number; numeric?: boolean }
export function DocTable<T extends { id: string }>({ rows, cols, selectable, selected, onSelect, empty, sortKey, sortDir, onSort, rowTo, rowLabel }: { rows: T[]; cols: Col<T>[]; selectable?: boolean; selected?: Set<string>; onSelect?: (id: string, on: boolean) => void; empty?: ReactNode; sortKey?: string; sortDir?: 1 | -1; onSort?: (k: string) => void; rowTo?: (r: T) => string; rowLabel?: (r: T) => string }) {
  if (!rows.length) return <>{empty}</>;
  const tpl = `${selectable ? '44px ' : ''}${cols.map((c) => c.width ?? 'minmax(0,1fr)').join(' ')}`;
  return (
    <div className="dt" role="table">
      <div className="dt-head" role="row" style={{ gridTemplateColumns: tpl }}>
        {selectable && <span role="columnheader" />}
        {cols.map((c) => (
          <span key={c.key} role="columnheader" aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
            {c.sort && onSort ? (
              <button type="button" className="dt-sort" onClick={() => onSort(c.key)}>
                {c.head} <Icon name="sort" size={13} />
              </button>
            ) : (
              c.head
            )}
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <div key={r.id} className={cx('dt-row', selected?.has(r.id) && 'sel')} role="row" style={{ gridTemplateColumns: tpl }}>
          {selectable && (
            <span role="cell">
              <input type="checkbox" aria-label="تحديد الصف" checked={selected?.has(r.id) ?? false} onChange={(e) => onSelect?.(r.id, e.target.checked)} />
            </span>
          )}
          {cols.map((c) => (
            <span key={c.key} role="cell" className={cx(c.numeric && 'num')}>
              {c.cell(r)}
            </span>
          ))}
          {rowTo && <span role="cell" className="dt-link-cell"><Link to={rowTo(r)} className="dt-link" aria-label={rowLabel ? rowLabel(r) : 'فتح'} /></span>}
        </div>
      ))}
    </div>
  );
}

/* ───────── Virtualised list (long lists): fixed row height ───────── */
export function VirtualList<T>({ items, rowHeight, maxHeight = 560, render, ariaLabel }: { items: T[]; rowHeight: number; maxHeight?: number; render: (item: T, i: number) => ReactNode; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [h, setH] = useState(maxHeight);
  const total = items.length * rowHeight;
  const height = Math.min(maxHeight, total);
  useLayoutEffect(() => setH(height), [height]);
  useEffect(() => setTop(0), [items.length]);
  const buffer = 6;
  const start = Math.max(0, Math.floor(top / rowHeight) - buffer);
  const end = Math.min(items.length, Math.ceil((top + h) / rowHeight) + buffer);
  return (
    <div ref={ref} className="vlist" role="list" aria-label={ariaLabel} style={{ height }} onScroll={(e) => setTop((e.target as HTMLDivElement).scrollTop)}>
      <div style={{ height: total, position: 'relative' }}>
        {items.slice(start, end).map((it, i) => (
          <div key={start + i} role="listitem" style={{ position: 'absolute', insetInline: 0, top: (start + i) * rowHeight, height: rowHeight }}>
            {render(it, start + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
