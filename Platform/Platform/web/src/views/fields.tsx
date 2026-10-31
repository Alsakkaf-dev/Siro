/** محررات وعارضات الحقول لكل نوع (سجل الأنواع في shared/wos.ts). كل محرر له اسم وصول عربي. */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { wos } from '../lib/wos.js';
import { cx, useDebounced } from '../ui/ui.js';
import { valueText, type FieldDef, type FieldValue, type StatusDef } from '../../../shared/wos.js';
import type { RefInfo } from '../../../shared/wos.js';

/** الحالة كقائمة منسدلة أصلية (لوحة مفاتيح + قارئ شاشة مجانًا) بشكل «حبة» ملوّنة */
export function StatusSelect({ statuses, value, onChange, label = 'الحالة', disabled }: { statuses: StatusDef[]; value: string | null; onChange: (v: string) => void; label?: string; disabled?: boolean }) {
  const cur = statuses.find((s) => s.id === value);
  return (
    <span className={cx('status-pill', `cat-${cur?.category ?? 'todo'}`)} style={{ '--c': cur?.color ?? 'var(--st-todo)' } as never}>
      <i aria-hidden="true" />
      <select aria-label={label} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} onClick={(e) => e.stopPropagation()}>
        {!cur && <option value="">—</option>}
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </span>
  );
}

export function StatusBadge({ statuses, value }: { statuses: StatusDef[]; value: string | null }) {
  const cur = statuses.find((s) => s.id === value);
  if (!cur) return null;
  return <span className={cx('status-pill ro', `cat-${cur.category}`)} style={{ '--c': cur.color } as never}><i aria-hidden="true" />{cur.name}</span>;
}

function LibLink({ v }: { v: string }) {
  const [info, setInfo] = useState<RefInfo | null>(null);
  useEffect(() => {
    let live = true;
    wos.resolve(v).then((j) => live && setInfo(j)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [v]);
  return info?.to ? <Link to={info.to} onClick={(e) => e.stopPropagation()}><Icon name="file" size={13} /> <bdi>{info.title}</bdi></Link> : <span className="muted">…</span>;
}

/** عرض قيمة (للقوائم والجداول والبطاقات) */
export function FieldValueView({ f, v }: { f: FieldDef; v: FieldValue | undefined }) {
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return <span className="fv-empty" aria-label="فارغ">—</span>;
  switch (f.kind) {
    case 'select': {
      const o = f.options?.find((x) => x.id === v);
      return <span className="opt-pill" style={{ '--c': o?.color ?? 'var(--text-3)' } as never}>{o?.name ?? String(v)}</span>;
    }
    case 'multiselect':
      return <span className="row" style={{ gap: 4, flexWrap: 'wrap' }}>{(v as string[]).map((x) => { const o = f.options?.find((y) => y.id === x); return <span key={x} className="opt-pill" style={{ '--c': o?.color ?? 'var(--text-3)' } as never}>{o?.name ?? x}</span>; })}</span>;
    case 'checkbox':
      return v ? <Icon name="check" size={16} aria-label="نعم" /> : <span className="muted">لا</span>;
    case 'rating':
      return <span className="stars" aria-label={`${v} من 5`}>{Array.from({ length: Number(v) }, (_, i) => <Icon key={i} name="star" size={14} fill="currentColor" />)}<span className="off">{Array.from({ length: 5 - Number(v) }, (_, i) => <Icon key={i} name="star" size={14} fill="currentColor" />)}</span></span>;
    case 'progress':
      return <span className="prog" aria-label={`${v}%`}><i style={{ width: `${Number(v)}%` }} /><b className="num">{Number(v)}%</b></span>;
    case 'url':
      return <a href={String(v)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} dir="ltr" className="ellipsis">{String(v).replace(/^https?:\/\//, '').slice(0, 40)}</a>;
    case 'library':
      return <LibLink v={String(v)} />;
    case 'formula':
    case 'rollup':
      return typeof v === 'string' && v.startsWith('#خطأ') ? <span className="fv-err" title={v}><Icon name="warn" size={12} /> خطأ</span> : <span className="num">{f.kind === 'rollup' && f.rollup?.agg === 'percent_done' ? `${v}%` : String(v)}</span>;
    case 'longtext':
      return <span className="ellipsis">{String(v).slice(0, 80)}</span>;
    default:
      return <span className="ellipsis"><bdi>{valueText(f, v)}</bdi></span>;
  }
}

/** محرر قيمة واحدة. onChange يُستدعى بالقيمة النهائية (قد تكون null). */
export function FieldEditor({ f, v, onChange, id, label }: { f: FieldDef; v: FieldValue | undefined; onChange: (v: unknown) => void; id: string; label?: string }) {
  const al = label ? { 'aria-label': label } : {};
  const [local, setLocal] = useState<string>(() => (v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v)));
  useEffect(() => setLocal(v === null || v === undefined ? '' : typeof v === 'object' ? '' : String(v)), [v]);
  const commit = (): void => {
    const cur = v === null || v === undefined ? '' : String(v);
    if (local !== cur) onChange(local === '' ? null : local);
  };
  switch (f.kind) {
    case 'longtext':
      return <textarea id={id} {...al} rows={4} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} maxLength={20000} />;
    case 'number':
    case 'currency':
      return <input id={id} {...al} type="number" inputMode="decimal" value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />;
    case 'date':
      return <input id={id} {...al} type="date" value={local} onChange={(e) => onChange(e.target.value || null)} />;
    case 'daterange': {
      const r = (v && typeof v === 'object' && !Array.isArray(v) ? v : { start: null, end: null }) as { start: string | null; end: string | null };
      return (
        <span className="row" style={{ gap: 6 }}>
          <input id={id} {...al} type="date" aria-label={`${f.name}: من`} value={r.start ?? ''} onChange={(e) => onChange({ ...r, start: e.target.value || null })} />
          <input type="date" aria-label={`${f.name}: إلى`} value={r.end ?? ''} onChange={(e) => onChange({ ...r, end: e.target.value || null })} />
        </span>
      );
    }
    case 'select':
      return (
        <select id={id} {...al} value={(v as string | null) ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {(f.options ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      );
    case 'multiselect': {
      const arr = Array.isArray(v) ? v : [];
      return (
        <span id={id} className="chip-set" role="group" aria-label={label ?? f.name}>
          {(f.options ?? []).map((o) => {
            const on = arr.includes(o.id);
            return <button key={o.id} type="button" className={cx('chip', on && 'on')} aria-pressed={on} onClick={() => onChange(on ? arr.filter((x) => x !== o.id) : [...arr, o.id])}>{o.name}</button>;
          })}
        </span>
      );
    }
    case 'checkbox':
      return <input id={id} {...al} type="checkbox" checked={v === true} onChange={(e) => onChange(e.target.checked)} />;
    case 'rating': {
      const n = Number(v ?? 0);
      return (
        <span id={id} className="star-input" role="radiogroup" aria-label={label ?? f.name}>
          {[1, 2, 3, 4, 5].map((k) => <button key={k} type="button" role="radio" aria-checked={n === k} aria-label={`${k} من 5`} className={cx(k <= n && 'on')} onClick={() => onChange(n === k ? 0 : k)}><Icon name="star" size={18} fill="currentColor" /></button>)}
        </span>
      );
    }
    case 'progress':
      return (
        <span className="row" style={{ gap: 8 }}>
          <input id={id} {...al} type="range" min={0} max={100} step={5} value={Number(v ?? 0)} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${Number(v ?? 0)}%`} />
          <b className="num">{Number(v ?? 0)}%</b>
        </span>
      );
    case 'url':
      return <input id={id} {...al} type="url" dir="ltr" placeholder="https://" value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} />;
    case 'library':
      return <RefPicker id={id} label={f.name} kinds={['file', 'video']} value={(v as string | null) ?? null} onPick={(r) => onChange(r?.ref ?? null)} />;
    case 'formula':
    case 'rollup':
    case 'relation':
      return <span className="muted"><FieldValueView f={f} v={v} /> <small>(محسوب)</small></span>;
    default:
      return <input id={id} {...al} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} maxLength={1000} />;
  }
}

/** منتقي مراجع: يبحث في كل الخطوط (عناصر، مواد، تقييمات، ملفات، فيديوهات، تمارين) */
export function RefPicker({ id, label, value, onPick, kinds, exclude, placeholder }: { id: string; label: string; value?: string | null; onPick: (r: RefInfo | null) => void; kinds?: string[]; exclude?: string[]; placeholder?: string }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 200);
  const [res, setRes] = useState<RefInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dq) return setRes([]);
    let live = true;
    wos.refs(dq).then((r) => live && setRes(r.filter((x) => (!kinds || kinds.includes(x.kind)) && !(exclude ?? []).includes(x.ref)))).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [dq, kinds, exclude]);
  useEffect(() => {
    const d = (e: MouseEvent): void => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', d);
    return () => document.removeEventListener('mousedown', d);
  }, []);
  const pick = (r: RefInfo): void => {
    onPick(r);
    setQ('');
    setOpen(false);
  };
  return (
    <div className="ref-picker" ref={wrap}>
      {value && <span className="ref-cur"><LibLink v={value} /> <button type="button" className="icon-btn sm ghost" aria-label={`إزالة ${label}`} onClick={() => onPick(null)}><Icon name="x" size={14} /></button></span>}
      <input
        id={id}
        role="combobox"
        aria-expanded={open && res.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-label={label}
        placeholder={placeholder ?? 'ابحث في كل الموقع…'}
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setSel(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(res.length - 1, s + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          else if (e.key === 'Enter' && res[sel]) { e.preventDefault(); pick(res[sel]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && res.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="ref-list" aria-label="نتائج">
          {res.map((r, i) => (
            <li key={r.ref} role="option" aria-selected={i === sel} className={cx(i === sel && 'on')} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)}>
              <Icon name={(r.icon ?? 'link') as 'link'} size={14} /> <span><bdi>{r.title}</bdi><small>{r.subtitle}</small></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
