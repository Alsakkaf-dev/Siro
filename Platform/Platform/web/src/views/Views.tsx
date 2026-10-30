/** العروض العامة فوق عناصر أي مساحة: قائمة، لوحة، جدول، تقويم، خط زمني، معرض، لوحة مؤشرات. */
import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../lib/icons.js';
import { cx } from '../ui/ui.js';
import { FieldEditor, FieldValueView, StatusBadge, StatusSelect } from './fields.js';
import { dateOf, groupItems, patchForGroup } from './engine.js';
import { STATUS_CATEGORY_LABEL, type DashWidget, type FieldDef, type ViewConfig, type WosItem, type WosType } from '../../../shared/wos.js';
import { fmtDateShort, fmtMonth } from '../lib/format.js';

export interface ViewProps {
  type: WosType;
  items: WosItem[];
  config: ViewConfig;
  onOpen: (id: string) => void;
  onPatch: (id: string, patch: { status?: string; data?: Record<string, unknown>; title?: string; due?: string | null; start?: string | null }) => void | Promise<void>;
  onAdd?: (partial: { title: string; status?: string; due?: string; data?: Record<string, unknown> }) => void | Promise<void>;
  sel?: Set<string>;
  toggleSel?: (id: string) => void;
  onSort?: (field: string) => void;
  /** إضافة عنصر بتاريخ (من التقويم) */
  onAddAt?: (due: string) => void;
  readonly?: boolean;
}

const todayIso = (): string => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
const day = (iso: string): number => Date.parse(`${iso}T00:00:00`);
const visibleFields = (type: WosType, cfg: ViewConfig, n: number): FieldDef[] => {
  const all = type.fields.filter((f) => !f.hidden && f.kind !== 'longtext' && f.kind !== 'relation');
  if (cfg.columns?.length) return cfg.columns.map((c) => type.fields.find((f) => f.id === c)).filter((f): f is FieldDef => !!f).slice(0, n);
  return all.slice(0, n);
};

function SelBox({ id, title, p }: { id: string; title: string; p: ViewProps }) {
  if (!p.toggleSel || p.readonly) return null;
  return <input type="checkbox" className="sel-box" aria-label={`تحديد «${title}»`} checked={p.sel?.has(id) ?? false} onChange={() => p.toggleSel!(id)} onClick={(e) => e.stopPropagation()} />;
}

function QuickAdd({ onAdd, preset, label = 'إضافة عنصر' }: { onAdd: NonNullable<ViewProps['onAdd']>; preset?: { status?: string; due?: string; data?: Record<string, unknown> }; label?: string }) {
  const [v, setV] = useState('');
  return (
    <form className="quick-add" onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (!t) return; setV(''); void onAdd({ title: t, ...preset }); }}>
      <Icon name="plus" size={15} aria-hidden="true" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={`${label}… (Enter)`} aria-label={label} maxLength={300} />
    </form>
  );
}

function ItemTitle({ i, p }: { i: WosItem; p: ViewProps }) {
  return (
    <button type="button" className="item-title" onClick={() => p.onOpen(i.id)}>
      <bdi>{i.title}</bdi>
      {(i.child_count ?? 0) > 0 && <span className="sub-n" aria-label={`${i.child_count} عنصر فرعي`}><Icon name="list" size={12} />{i.child_count}</span>}
    </button>
  );
}

function Due({ i }: { i: WosItem }) {
  if (!i.due) return null;
  const late = !i.done_at && i.due < todayIso();
  return <span className={cx('due', late && 'late')}><Icon name="clock" size={12} /> {fmtDateShort(day(i.due))}</span>;
}

/* ───────── قائمة ───────── */
export function ListView(p: ViewProps) {
  const groups = groupItems(p.items, p.type, p.config.groupBy);
  const fields = visibleFields(p.type, p.config, 3);
  return (
    <div className="v-list">
      {groups.map((g) => (
        <section key={g.key} className="v-group" aria-label={g.label}>
          {groups.length > 1 && <h3 className="v-group-h"><i style={{ background: g.color ?? 'var(--text-3)' }} aria-hidden="true" />{g.label} <span className="muted num">{g.items.length}</span></h3>}
          <ul className="plain">
            {g.items.map((i) => (
              <li key={i.id} className={cx('v-row', i.done_at && 'done', p.sel?.has(i.id) && 'selected')}>
                <SelBox id={i.id} title={i.title} p={p} />
                {p.readonly ? <StatusBadge statuses={p.type.statuses} value={i.status} /> : <StatusSelect statuses={p.type.statuses} value={i.status} label={`حالة «${i.title}»`} onChange={(s) => void p.onPatch(i.id, { status: s })} />}
                <ItemTitle i={i} p={p} />
                <span className="v-meta">
                  {fields.map((f) => <span key={f.id} className="v-field" title={f.name}><FieldValueView f={f} v={i.computed?.[f.id] ?? i.data[f.id]} /></span>)}
                  <Due i={i} />
                </span>
              </li>
            ))}
          </ul>
          {!p.readonly && p.onAdd && <QuickAdd onAdd={p.onAdd} preset={g.key !== '_all' && g.key !== '_none' && p.config.groupBy ? patchForGroup(p.config.groupBy, g.key, p.type.fields.find((f) => f.id === p.config.groupBy)) as never : undefined} />}
        </section>
      ))}
      {!p.items.length && !p.onAdd && <p className="muted">لا عناصر.</p>}
    </div>
  );
}

/* ───────── لوحة (Kanban) ───────── */
export function BoardView(p: ViewProps) {
  const by = p.config.groupBy ?? 'status';
  const groups = groupItems(p.items, p.type, by);
  const field = p.type.fields.find((f) => f.id === by);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const fields = visibleFields(p.type, p.config, 2);
  return (
    <div className="v-board" role="list" aria-label="لوحة حسب المجموعات">
      {groups.map((g) => (
        <section
          key={g.key}
          role="listitem"
          aria-label={`${g.label} (${g.items.length})`}
          className={cx('b-col', over === g.key && 'over')}
          onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(g.key); } }}
          onDragLeave={() => setOver((o) => (o === g.key ? null : o))}
          onDrop={(e) => { e.preventDefault(); setOver(null); if (drag) void p.onPatch(drag, patchForGroup(by, g.key, field) as never); setDrag(null); }}
        >
          <h3 className="b-head"><i style={{ background: g.color ?? 'var(--text-3)' }} aria-hidden="true" />{g.label}<span className="muted num">{g.items.length}</span></h3>
          <ul className="plain b-cards">
            {g.items.map((i) => (
              <li key={i.id} className={cx('b-card', i.done_at && 'done', drag === i.id && 'dragging', p.sel?.has(i.id) && 'selected')} draggable={!p.readonly} onDragStart={() => setDrag(i.id)} onDragEnd={() => { setDrag(null); setOver(null); }}>
                <div className="row" style={{ gap: 6, alignItems: 'flex-start' }}>
                  <SelBox id={i.id} title={i.title} p={p} />
                  <ItemTitle i={i} p={p} />
                </div>
                <div className="b-meta">
                  {fields.map((f) => { const v = i.computed?.[f.id] ?? i.data[f.id]; return v === null || v === undefined || v === '' ? null : <span key={f.id} className="v-field" title={f.name}><FieldValueView f={f} v={v} /></span>; })}
                  <Due i={i} />
                </div>
                {!p.readonly && (
                  // بديل لوحة المفاتيح للسحب والإفلات: تغيير المجموعة من القائمة
                  by === 'status'
                    ? <StatusSelect statuses={p.type.statuses} value={i.status} label={`نقل «${i.title}» إلى حالة`} onChange={(s) => void p.onPatch(i.id, { status: s })} />
                    : field?.kind === 'select' ? (
                      <select className="b-move" aria-label={`نقل «${i.title}» إلى ${field.name}`} value={(i.data[field.id] as string) ?? ''} onChange={(e) => void p.onPatch(i.id, { data: { [field.id]: e.target.value || null } })}>
                        <option value="">بلا {field.name}</option>
                        {(field.options ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    ) : null
                )}
              </li>
            ))}
          </ul>
          {!p.readonly && p.onAdd && <QuickAdd onAdd={p.onAdd} preset={g.key !== '_none' ? (patchForGroup(by, g.key, field) as never) : undefined} label={`إضافة إلى «${g.label}»`} />}
        </section>
      ))}
    </div>
  );
}

/* ───────── جدول ───────── */
const INLINE = new Set(['text', 'number', 'currency', 'date', 'select', 'checkbox', 'rating', 'progress', 'url']);
export function TableView(p: ViewProps) {
  const cols = p.config.columns?.length ? p.config.columns : ['status', ...p.type.fields.filter((f) => !f.hidden && f.kind !== 'longtext' && f.kind !== 'relation').map((f) => f.id), 'due'];
  const sort = p.config.sort;
  const head = (id: string, label: string): ReactNode => (
    <th key={id} scope="col" aria-sort={sort?.field === id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      {p.onSort ? <button type="button" className="th-sort" onClick={() => p.onSort!(id)}>{label}{sort?.field === id && <Icon name={sort.dir === 'asc' ? 'up' : 'down'} size={12} />}</button> : label}
    </th>
  );
  const allSel = !!p.sel && p.items.length > 0 && p.items.every((i) => p.sel!.has(i.id));
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="جدول العناصر (قابل للتمرير)">
      <table className="v-table">
        <thead>
          <tr>
            {p.toggleSel && !p.readonly && <th scope="col" className="sel-col"><input type="checkbox" aria-label="تحديد الكل" checked={allSel} onChange={() => p.items.forEach((i) => { if (allSel || !p.sel!.has(i.id)) p.toggleSel!(i.id); })} /></th>}
            {head('title', 'العنوان')}
            {cols.map((c) => {
              if (c === 'status') return head('status', 'الحالة');
              if (c === 'due') return head('due', 'الموعد');
              if (c === 'start') return head('start', 'البداية');
              const f = p.type.fields.find((x) => x.id === c);
              return f ? head(f.id, f.name) : null;
            })}
          </tr>
        </thead>
        <tbody>
          {p.items.map((i) => (
            <tr key={i.id} className={cx(i.done_at && 'done', p.sel?.has(i.id) && 'selected')}>
              {p.toggleSel && !p.readonly && <td className="sel-col"><SelBox id={i.id} title={i.title} p={p} /></td>}
              <th scope="row"><ItemTitle i={i} p={p} /></th>
              {cols.map((c) => {
                if (c === 'status') return <td key={c}>{p.readonly ? <StatusBadge statuses={p.type.statuses} value={i.status} /> : <StatusSelect statuses={p.type.statuses} value={i.status} label={`حالة «${i.title}»`} onChange={(s) => void p.onPatch(i.id, { status: s })} />}</td>;
                if (c === 'due' || c === 'start') return <td key={c}>{p.readonly ? (i[c] ? fmtDateShort(day(i[c]!)) : '—') : <input type="date" aria-label={`${c === 'due' ? 'موعد' : 'بداية'} «${i.title}»`} value={i[c] ?? ''} onChange={(e) => void p.onPatch(i.id, { [c]: e.target.value || null })} />}</td>;
                const f = p.type.fields.find((x) => x.id === c);
                if (!f) return null;
                const v = i.computed?.[f.id] ?? i.data[f.id];
                return <td key={c}>{!p.readonly && INLINE.has(f.kind) ? <FieldEditor f={f} v={v} id={`c-${i.id}-${f.id}`} label={`${f.name} — ${i.title}`} onChange={(x) => void p.onPatch(i.id, { data: { [f.id]: x } })} /> : <FieldValueView f={f} v={v} />}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!p.readonly && p.onAdd && <QuickAdd onAdd={p.onAdd} />}
    </div>
  );
}

/* ───────── تقويم (شهر) ───────── */
export function CalendarView(p: ViewProps) {
  const [anchor, setAnchor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(anchor.y, anchor.m, 1);
  const startDow = first.getDay(); // 0 = الأحد
  const daysIn = new Date(anchor.y, anchor.m + 1, 0).getDate();
  const iso = (d: number): string => `${anchor.y}-${String(anchor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const by = useMemo(() => {
    const m = new Map<string, WosItem[]>();
    for (const i of p.items) { const d = dateOf(i, p.config.dateField); if (d) m.set(d.slice(0, 10), [...(m.get(d.slice(0, 10)) ?? []), i]); }
    return m;
  }, [p.items, p.config.dateField]);
  const undated = p.items.filter((i) => !dateOf(i, p.config.dateField));
  const today = todayIso();
  const cells: (number | null)[] = [...Array<null>(startDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const editableDate = (p.config.dateField ?? 'due') === 'due' || p.config.dateField === 'start';
  return (
    <div className="v-cal">
      <div className="row cal-nav">
        <button type="button" className="icon-btn sm" aria-label="الشهر السابق" onClick={() => setAnchor((a) => (a.m === 0 ? { y: a.y - 1, m: 11 } : { y: a.y, m: a.m - 1 }))}><Icon name="right" size={16} /></button>
        <h3 aria-live="polite">{fmtMonth(first.getTime())}</h3>
        <button type="button" className="icon-btn sm" aria-label="الشهر التالي" onClick={() => setAnchor((a) => (a.m === 11 ? { y: a.y + 1, m: 0 } : { y: a.y, m: a.m + 1 }))}><Icon name="left" size={16} /></button>
      </div>
      <div className="cal-grid" role="grid" aria-label={fmtMonth(first.getTime())}>
        {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
        {cells.map((d, k) => (
          <div key={k} role="gridcell" className={cx('cal-cell', d === null && 'pad', d !== null && iso(d) === today && 'today')}>
            {d !== null && (
              <>
                <div className="cal-d"><span className="num">{d}</span>{!p.readonly && p.onAddAt && editableDate && <button type="button" className="cal-add" aria-label={`إضافة عنصر يوم ${iso(d)}`} onClick={() => p.onAddAt!(iso(d))}><Icon name="plus" size={12} /></button>}</div>
                {(by.get(iso(d)) ?? []).map((i) => (
                  <button key={i.id} type="button" className={cx('cal-chip', i.done_at && 'done')} style={{ '--c': p.type.statuses.find((s) => s.id === i.status)?.color ?? 'var(--accent)' } as never} onClick={() => p.onOpen(i.id)}><bdi>{i.title}</bdi></button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      {undated.length > 0 && <p className="muted small">{undated.length} عنصرًا بلا تاريخ لا تظهر في التقويم.</p>}
    </div>
  );
}
/* ───────── خط زمني (Gantt مبسّط) ───────── */
export function TimelineView(p: ViewProps) {
  const today = todayIso();
  const [from, setFrom] = useState(() => { const t = day(today); const dow = new Date(t).getDay(); return new Date(t - dow * 86_400_000).toISOString().slice(0, 10); });
  const DAYS = 56;
  const f0 = day(from);
  const rows = p.items.map((i) => {
    const end = i.due ?? i.start;
    const start = i.start ?? i.due;
    return { i, s: start ? Math.round((day(start) - f0) / 86_400_000) : null, e: end ? Math.round((day(end) - f0) / 86_400_000) : null };
  });
  const t = Math.round((day(today) - f0) / 86_400_000);
  return (
    <div className="v-tl">
      <div className="row cal-nav">
        <button type="button" className="icon-btn sm" aria-label="أسبوعان للخلف" onClick={() => setFrom(new Date(f0 - 14 * 86_400_000).toISOString().slice(0, 10))}><Icon name="right" size={16} /></button>
        <h3>{fmtDateShort(f0)} – {fmtDateShort(f0 + (DAYS - 1) * 86_400_000)}</h3>
        <button type="button" className="icon-btn sm" aria-label="أسبوعان للأمام" onClick={() => setFrom(new Date(f0 + 14 * 86_400_000).toISOString().slice(0, 10))}><Icon name="left" size={16} /></button>
      </div>
      <div className="gt-wrap" tabIndex={0} role="region" aria-label="الخط الزمني (قابل للتمرير)">
        <div className="gt" style={{ '--days': DAYS } as never}>
          <div className="gt-weeks" aria-hidden="true">{Array.from({ length: DAYS / 7 }, (_, w) => <span key={w}>{fmtDateShort(f0 + w * 7 * 86_400_000)}</span>)}</div>
          {t >= 0 && t < DAYS && <div className="gt-today" style={{ '--x': t } as never} aria-hidden="true" />}
          {rows.map(({ i, s, e }) => (
            <div key={i.id} className="gt-row">
              <span className="gt-label"><ItemTitle i={i} p={p} /></span>
              <div className="gt-lane">
                {s !== null && e !== null && e >= 0 && s < DAYS ? (
                  <button type="button" className={cx('gt-bar', i.done_at && 'done')} style={{ '--s': Math.max(0, s), '--e': Math.min(DAYS - 1, e), '--c': p.type.statuses.find((x) => x.id === i.status)?.color ?? 'var(--accent)' } as never} onClick={() => p.onOpen(i.id)} aria-label={`${i.title}: ${i.start ?? i.due} → ${i.due ?? i.start}`} />
                ) : <span className="muted small">{s === null ? 'بلا تاريخ' : 'خارج النطاق'}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── معرض ───────── */
export function GalleryView(p: ViewProps) {
  const fields = visibleFields(p.type, p.config, 4);
  return (
    <ul className="plain v-gallery">
      {p.items.map((i) => (
        <li key={i.id} className={cx('g-card', i.done_at && 'done', p.sel?.has(i.id) && 'selected')} style={{ '--c': p.type.statuses.find((s) => s.id === i.status)?.color ?? p.type.color } as never}>
          <div className="g-band" aria-hidden="true"><Icon name={(p.type.icon || 'layers') as 'layers'} size={22} /></div>
          <div className="g-body">
            <div className="row" style={{ gap: 6 }}><SelBox id={i.id} title={i.title} p={p} /><ItemTitle i={i} p={p} /></div>
            <StatusBadge statuses={p.type.statuses} value={i.status} />
            <dl className="g-fields">
              {fields.map((f) => <div key={f.id}><dt>{f.name}</dt><dd><FieldValueView f={f} v={i.computed?.[f.id] ?? i.data[f.id]} /></dd></div>)}
            </dl>
            <Due i={i} />
          </div>
        </li>
      ))}
      {!p.readonly && p.onAdd && <li className="g-card add"><QuickAdd onAdd={p.onAdd} /></li>}
    </ul>
  );
}

/* ───────── لوحة مؤشرات ───────── */
const DEFAULT_WIDGETS: DashWidget[] = [{ id: 'w1', kind: 'total' }, { id: 'w2', kind: 'progress' }, { id: 'w3', kind: 'by_status' }, { id: 'w4', kind: 'upcoming' }];
export function DashboardView(p: ViewProps & { all?: WosItem[] }) {
  const items = p.all ?? p.items;
  const top = items.filter((i) => !i.parent_id);
  const widgets = p.config.widgets?.length ? p.config.widgets : DEFAULT_WIDGETS;
  const done = top.filter((i) => i.done_at).length;
  const today = todayIso();
  const render = (w: DashWidget): ReactNode => {
    const f = p.type.fields.find((x) => x.id === w.field);
    switch (w.kind) {
      case 'total':
        return <div className="dw-big"><b className="num">{top.length}</b><span>عنصر</span></div>;
      case 'progress': {
        const pct = top.length ? Math.round((done / top.length) * 100) : 0;
        return <div className="dw-big"><b className="num">{pct}%</b><span>منجز ({done} من {top.length})</span><span className="prog" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span></div>;
      }
      case 'by_status': {
        const max = Math.max(1, ...p.type.statuses.map((s) => top.filter((i) => i.status === s.id).length));
        return <ul className="plain dw-bars">{p.type.statuses.map((s) => { const n = top.filter((i) => i.status === s.id).length; return <li key={s.id}><span>{s.name} <small className="muted">({STATUS_CATEGORY_LABEL[s.category]})</small></span><span className="bar"><i style={{ width: `${(n / max) * 100}%`, background: s.color }} /></span><b className="num">{n}</b></li>; })}</ul>;
      }
      case 'by_field': {
        if (!f || f.kind !== 'select') return <span className="muted">اختر حقل «اختيار واحد»</span>;
        const max = Math.max(1, ...(f.options ?? []).map((o) => top.filter((i) => i.data[f.id] === o.id).length));
        return <ul className="plain dw-bars">{(f.options ?? []).map((o) => { const n = top.filter((i) => i.data[f.id] === o.id).length; return <li key={o.id}><span>{o.name}</span><span className="bar"><i style={{ width: `${(n / max) * 100}%`, background: o.color ?? 'var(--accent)' }} /></span><b className="num">{n}</b></li>; })}</ul>;
      }
      case 'sum':
      case 'avg': {
        if (!f) return <span className="muted">اختر حقلًا رقميًا</span>;
        const nums = top.map((i) => Number(i.computed?.[f.id] ?? i.data[f.id])).filter((n) => Number.isFinite(n));
        const v = nums.length ? (w.kind === 'sum' ? nums.reduce((a, b) => a + b, 0) : nums.reduce((a, b) => a + b, 0) / nums.length) : null;
        return <div className="dw-big"><b className="num">{v === null ? '—' : Math.round(v * 100) / 100}</b><span>{w.kind === 'sum' ? 'المجموع' : 'المتوسط'} · {f.name} <small className="muted">(من {nums.length} قيمة؛ الفارغ لا يُحسب صفرًا)</small></span></div>;
      }
      case 'upcoming': {
        const up = top.filter((i) => !i.done_at && i.due).sort((a, b) => a.due!.localeCompare(b.due!)).slice(0, 6);
        return up.length ? <ul className="plain mini-list">{up.map((i) => <li key={i.id}><button type="button" className="link-btn" onClick={() => p.onOpen(i.id)}><bdi>{i.title}</bdi></button> <small className={cx('muted', i.due! < today && 'late')}>{fmtDateShort(day(i.due!))}</small></li>)}</ul> : <span className="muted">لا مواعيد قادمة.</span>;
      }
    }
  };
  const TITLE: Record<DashWidget['kind'], string> = { total: 'العدد', progress: 'نسبة الإنجاز', by_status: 'حسب الحالة', by_field: 'حسب الحقل', sum: 'مجموع', avg: 'متوسط', upcoming: 'المواعيد القادمة' };
  return (
    <div className="v-dash">
      {widgets.map((w) => (
        <section key={w.id} className="card dw" aria-label={w.title ?? TITLE[w.kind]}>
          <h3>{w.title ?? TITLE[w.kind]}</h3>
          {render(w)}
        </section>
      ))}
    </div>
  );
}

export const VIEW_COMPONENTS = { list: ListView, board: BoardView, table: TableView, calendar: CalendarView, timeline: TimelineView, gallery: GalleryView, dashboard: DashboardView } as const;
