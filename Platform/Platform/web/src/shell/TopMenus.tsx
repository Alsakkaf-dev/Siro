import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { NEW_ACTIONS, sameSubpage } from '../core/registry.js';
import { semesterStatus, todayMs } from '../../../shared/semester.js';

/** قائمة منسدلة بسيطة: تُغلق بالنقر خارجها وبـ Esc. */
function useDismiss(open: boolean, close: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', d);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', d);
      document.removeEventListener('keydown', k);
    };
  }, [open, close]);
  return ref;
}

/** شريحة الفصل: تظهر في قسم الدراسة فقط، والتبديل يحفظ الصفحة الفرعية. */
export function SemChip({ current }: { current: string }) {
  const { semesters, reloadSemesters, toast } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const cur = semesters?.find((s) => s.id === current);
  if (!cur || !semesters) return null;
  const now = todayMs();
  const activate = async (): Promise<void> => {
    setOpen(false);
    try {
      await api.activate(cur.id);
      await reloadSemesters();
      toast(`${cur.code} هو الفصل النشط الآن`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="sem-chip" aria-haspopup="menu" aria-expanded={open} aria-label={`الفصل: ${cur.code}`} onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" size={16} /> <span className="lbl"><bdi>{cur.code}</bdi></span> <Icon name="down" size={14} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {semesters.map((s) => {
            const st = semesterStatus(now, s);
            return (
              <button key={s.id} role="menuitem" onClick={() => { setOpen(false); nav(sameSubpage(loc.pathname, loc.search, s.id)); }}>
                <span><bdi>{s.code}</bdi> <small className="muted">· {st === 'current' ? 'جارٍ' : st === 'past' ? 'منتهٍ' : 'قادم'}{s.is_active ? ' · النشط' : ''}</small></span>
                {s.id === current && <Icon name="check" size={16} />}
              </button>
            );
          })}
          <div className="sep" />
          {!cur.is_active && <button role="menuitem" onClick={() => void activate()}><span>تعيين <bdi>{cur.code}</bdi> كنشط</span><Icon name="check" size={16} /></button>}
          <button role="menuitem" onClick={() => { setOpen(false); nav('/academic'); }}><span>مدير الفصول</span><Icon name="layers" size={16} /></button>
        </div>
      )}
    </div>
  );
}

/** «+ جديد»: انتقال إلى المسار مع ?new=… (useNewParam في الصفحة يفتح النموذج). المفتاح c. */
export function NewMenu({ open, setOpen, semId }: { open: boolean; setOpen: (v: boolean) => void; semId: string | null }) {
  const nav = useNavigate();
  const ref = useDismiss(open, () => setOpen(false));
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) first.current?.focus();
  }, [open]);
  const items: ReactNode[] = NEW_ACTIONS.map((a, i) => {
    const to = a.to(semId);
    return (
      <button key={a.id} ref={i === 0 ? first : undefined} role="menuitem" disabled={!to} title={to ? undefined : 'يحتاج فصلًا — أضف فصلًا أولًا'} onClick={() => { setOpen(false); if (to) nav(to); }}>
        <span>{a.label}</span><Icon name={a.icon} size={16} />
      </button>
    );
  });
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="btn sm primary new-btn" aria-haspopup="menu" aria-expanded={open} title="إنشاء جديد (c)" onClick={() => setOpen(!open)}>
        <Icon name="plus" size={16} /> <span className="lbl">جديد</span>
      </button>
      {open && <div className="menu" role="menu" aria-label="إنشاء جديد">{items}</div>}
    </div>
  );
}
