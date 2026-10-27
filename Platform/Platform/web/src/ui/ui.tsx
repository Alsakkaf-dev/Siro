import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';

export function cx(...a: (string | false | null | undefined)[]): string {
  return a.filter(Boolean).join(' ');
}

export function Skeleton({ h = 16, w = '100%', r = 12 }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r }} />;
}

export function Badge({ tone, dashed, children, title }: { tone?: 'ok' | 'warn' | 'danger' | 'accent' | 'core'; dashed?: boolean; children: ReactNode; title?: string }) {
  return (
    <span className={cx('badge', tone, dashed && 'dashed')} title={title}>
      {children}
    </span>
  );
}

export function Unknown({ text = 'غير معروف' }: { text?: string }) {
  return (
    <span className="badge warn" title="لا توجد معلومة مؤكدة">
      <Icon name="help" size={12} /> {text}
    </span>
  );
}

/** وسم الثقة الإجباري بجانب الأرقام: مثبت / محسوب / افتراض */
export function TrustTag({ kind }: { kind: 'proven' | 'calc' | 'assumed' }) {
  const t = { proven: 'مثبت', calc: 'محسوب', assumed: 'افتراض' }[kind];
  const tip = { proven: 'معلومة جاءت منك أو من ملفاتك', calc: 'ناتج حساب', assumed: 'تخمين يحتاج تأكيدك' }[kind];
  return (
    <span className={`trust t-${kind}`} title={tip}>
      {t}
    </span>
  );
}

export function Button({ variant, size, icon, children, to, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'ghost' | 'ink'; size?: 'sm'; icon?: IconName; to?: string }) {
  const cls = cx('btn', variant, size);
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}

export function IconButton({ icon, label, onClick, tone, sm, ghost, disabled }: { icon: IconName; label: string; onClick?: () => void; tone?: 'danger'; sm?: boolean; ghost?: boolean; disabled?: boolean }) {
  return (
    <button type="button" className={cx('icon-btn', sm && 'sm', ghost && 'ghost', tone)} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      <Icon name={icon} size={sm ? 16 : 18} />
    </button>
  );
}

export function Card({ children, className, style, hover, id }: { children: ReactNode; className?: string; style?: CSSProperties; hover?: boolean; id?: string }) {
  return (
    <section id={id} className={cx('card', hover && 'hover', className)} style={style}>
      {children}
    </section>
  );
}

export function CardHead({ title, icon, children, info }: { title: ReactNode; icon?: IconName; children?: ReactNode; info?: string }) {
  return (
    <div className="card-head">
      <h2>
        {icon && <span className="ch-ico"><Icon name={icon} size={18} /></span>}
        {title}
        {info && (
          <span className="info-tip" title={info} tabIndex={0} role="img" aria-label={info}>
            <Icon name="info" size={15} />
          </span>
        )}
      </h2>
      {children && <div className="row">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon = 'folder', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="em-ico">
        <Icon name={icon} size={30} />
      </div>
      <h2>{title}</h2>
      {text && <p style={{ maxWidth: 460 }}>{text}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button.primary');
    first?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const a = f[0]!;
        const z = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  // عبر portal إلى body: لا يحبسه سياق تكديس الصفحة (كان الشريط السفلي في الجوال يغطي أزرار الحفظ)
  return createPortal(
    <div className="modal-wrap">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-labelledby={id} ref={ref}>
        <div className="modal-head">
          <h2 id={id}>{title}</h2>
          <IconButton icon="x" label="إغلاق" onClick={onClose} sm />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** لوحة جانبية (تفاصيل عنصر — نمط ClickUp/Jira): تحبس التركيز، Esc يغلق، ويعود التركيز لمكانه. */
export function Drawer({ title, onClose, children, actions }: { title: ReactNode; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !document.querySelector('.modal-wrap')) {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && ref.current && !document.querySelector('.modal-wrap')) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const a = f[0]!;
        const z = f[f.length - 1]!;
        if (e.shiftKey && (document.activeElement === a || document.activeElement === ref.current)) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, []);
  return createPortal(
    <div className="drawer-wrap">
      <div className="modal-backdrop" onClick={() => closeRef.current()} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1}>
        <div className="drawer-head">
          <h2 id={id}>{title}</h2>
          <div className="row" style={{ gap: 4 }}>
            {actions}
            <IconButton icon="x" label="إغلاق اللوحة" onClick={() => closeRef.current()} sm />
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

/** تحديد متعدد (Set) مع مسح بـ Esc */
export function useSelection(): { sel: Set<string>; toggle: (id: string) => void; clear: () => void; setAll: (ids: string[]) => void } {
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const toggle = useCallback((id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const clear = useCallback(() => setSel(new Set()), []);
  const setAll = useCallback((ids: string[]) => setSel(new Set(ids)), []);
  useEffect(() => {
    if (!sel.size) return;
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !document.querySelector('.modal-wrap, .drawer-wrap')) clear();
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [sel.size, clear]);
  return { sel, toggle, clear, setAll };
}

/** شريط الإجراءات الجماعية — يظهر عند تحديد عنصر أو أكثر */
export function BulkBar({ count, onClear, children, total, onAll }: { count: number; onClear: () => void; children: ReactNode; total?: number; onAll?: () => void }) {
  if (!count) return null;
  return (
    <div className="bulk-bar" role="toolbar" aria-label={`إجراءات على ${count} محدد`}>
      <b className="num">{count}</b> <span>محدد</span>
      {onAll && total !== undefined && count < total && <button type="button" className="link-btn" onClick={onAll}>تحديد الكل ({total})</button>}
      <span className="bulk-actions">{children}</span>
      <IconButton icon="x" label="إلغاء التحديد (Esc)" onClick={onClear} sm ghost />
    </div>
  );
}

export function Field({ label, error, hint, children, full, htmlFor }: { label: string; error?: string | undefined; hint?: string; children: ReactNode; full?: boolean; htmlFor?: string }) {
  return (
    <div className={cx('field', full && 'full')}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span className="err" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon?: IconName }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={14} />} {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; hideLabel?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    </label>
  );
}

export function KebabMenu({ items, label = 'خيارات' }: { items: { label: string; icon?: IconName; onClick: () => void; danger?: boolean }[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const place = useCallback((): void => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const w = menuRef.current?.offsetWidth ?? 200;
    const h = menuRef.current?.offsetHeight ?? 200;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    const top = r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6;
    setPos({ left, top });
  }, []);
  // القائمة تُرسم في body (portal) كي لا تُغطّيها البطاقات المجاورة ولا يقصّها overflow
  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
    };
    const close = (): void => place();
    document.addEventListener('mousedown', d);
    document.addEventListener('keydown', k);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', d);
      document.removeEventListener('keydown', k);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, place]);
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, [open, pos]);
  return (
    <div className="menu-wrap" ref={ref}>
      <IconButton icon="kebab" label={label} onClick={() => { setPos(null); setOpen((o) => !o); }} sm ghost />
      {open &&
        createPortal(
          <div className="menu menu-fixed" role="menu" ref={menuRef} style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
            {items.map((it, i) => (
              <button
                key={i}
                role="menuitem"
                style={it.danger ? { color: 'var(--danger)' } : undefined}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                <span className="row" style={{ gap: 8 }}>
                  {it.icon && <Icon name={it.icon} size={16} />}
                  {it.label}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function Pager({ page, pages, total, from, to, onPage }: { page: number; pages: number; total: number; from: number; to: number; onPage: (p: number) => void }) {
  return (
    <div className="pager">
      <span className="muted">
        عرض {from}–{to} من {total}
      </span>
      <span className="row">
        <button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          السابق
        </button>
        <button className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          التالي
        </button>
      </span>
    </div>
  );
}

export function Avatar({ text, color }: { text: string; color?: string }) {
  return (
    <span className="av" style={color ? ({ '--c': color } as CSSProperties) : undefined} aria-hidden="true">
      {text}
    </span>
  );
}

export function AvatarStack({ names, color }: { names: string[]; color?: string }) {
  return (
    <span className="av-stack" title={names.join('، ')}>
      {names.slice(0, 3).map((n, i) => (
        <Avatar key={i} text={n} {...(color ? { color } : {})} />
      ))}
      {names.length > 3 && <span className="av more">+{names.length - 3}</span>}
    </span>
  );
}

export function useDebounced<T>(v: T, ms: number): T {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = window.setTimeout(() => setX(v), ms);
    return () => window.clearTimeout(t);
  }, [v, ms]);
  return x;
}

/** سحب وإفلات لإعادة الترتيب بالفأرة (HTML5). المقبض فقط يبدأ السحب؛ أزرار رفع/خفض تبقى للوحة المفاتيح واللمس. */
export function useDragReorder(onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const armed = useRef(false);
  const handle = {
    className: 'drag-handle',
    title: 'اسحب لإعادة الترتيب',
    'aria-hidden': true as const,
    onPointerDown: () => {
      armed.current = true;
    },
    onPointerUp: () => {
      armed.current = false;
    },
  };
  const row = (i: number) => ({
    draggable: true as const,
    'data-drag-over': drag && drag.over === i && drag.from !== i ? (drag.from < i ? 'after' : 'before') : undefined,
    'data-dragging': drag?.from === i ? 'true' : undefined,
    onDragStart: (e: React.DragEvent) => {
      if (!armed.current) return void e.preventDefault();
      setDrag({ from: i, over: i });
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
    },
    onDragOver: (e: React.DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      setDrag((d) => (d && d.over !== i ? { ...d, over: i } : d));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (drag && drag.from !== i) onMove(drag.from, i);
      setDrag(null);
      armed.current = false;
    },
    onDragEnd: () => {
      setDrag(null);
      armed.current = false;
    },
  });
  return { handle, row };
}

export function DragHandle({ handle }: { handle: ReturnType<typeof useDragReorder>['handle'] }) {
  return (
    <span {...handle}>
      <Icon name="grip" size={18} />
    </span>
  );
}
