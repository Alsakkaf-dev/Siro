import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Deleted } from '../lib/api.js';
import type { SemesterSummary } from '../../../shared/types.js';
import { Icon } from '../lib/icons.js';

export interface ToastItem { id: number; kind: 'info' | 'ok' | 'error'; msg: string; action?: { label: string; run: () => void } }
export interface ConfirmOpts { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean }

interface Ctx {
  semesters: SemesterSummary[] | null;
  reloadSemesters: () => Promise<void>;
  activeId: string | null;
  toast: (msg: string, o?: { kind?: ToastItem['kind']; action?: ToastItem['action']; ms?: number }) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  theme: 'light' | 'dark';
  /** التفضيل المحفوظ: فاتح/داكن/حسب النظام */
  themePref: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  deleteWithUndo: (label: string, run: () => Promise<Deleted>, after: () => void | Promise<void>) => Promise<void>;
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
  unknownCount: number;
  setUnknownCount: (n: number) => void;
}

const C = createContext<Ctx | null>(null);
export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('AppProvider مفقود');
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [semesters, setSemesters] = useState<SemesterSummary[] | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'));
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const v = localStorage.getItem('platform.theme');
      return v === 'dark' || v === 'system' ? v : 'light';
    } catch {
      return 'light';
    }
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [unknownCount, setUnknownCount] = useState(0);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);

  const reloadSemesters = useCallback(async () => {
    try {
      setSemesters(await api.semesters());
    } catch {
      setSemesters([]);
    }
  }, []);
  useEffect(() => void reloadSemesters(), [reloadSemesters]);

  const toast = useCallback<Ctx['toast']>((msg, o = {}) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-3), { id, kind: o.kind ?? 'info', msg, ...(o.action ? { action: o.action } : {}) }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), o.ms ?? (o.action ? 9000 : 4200));
  }, []);

  const setTheme = useCallback((t: 'light' | 'dark' | 'system') => {
    try {
      localStorage.setItem('platform.theme', t);
    } catch {
      /* تجاهل */
    }
    setThemePref(t);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (): void => {
      const r = themePref === 'system' ? (mq.matches ? 'dark' : 'light') : themePref;
      document.documentElement.setAttribute('data-theme', r);
      setThemeState(r);
    };
    apply();
    if (themePref !== 'system') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themePref]);

  const confirm = useCallback<Ctx['confirm']>((o) => new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })), []);

  const deleteWithUndo = useCallback<Ctx['deleteWithUndo']>(
    async (label, run, after) => {
      try {
        const r = await run();
        await after();
        toast(`تم حذف ${label}`, {
          kind: 'ok',
          action: {
            label: 'تراجع',
            run: () => {
              api
                .undo(r.undo)
                .then(async () => {
                  await after();
                  await reloadSemesters();
                  toast(`تمت استعادة ${label}`, { kind: 'ok' });
                })
                .catch((e: Error) => toast(e.message, { kind: 'error' }));
            },
          },
        });
        void reloadSemesters();
      } catch (e) {
        toast((e as Error).message, { kind: 'error' });
      }
    },
    [toast, reloadSemesters],
  );

  const activeId = useMemo(() => semesters?.find((s) => s.is_active)?.id ?? semesters?.[0]?.id ?? null, [semesters]);

  const value = useMemo<Ctx>(
    () => ({ semesters, reloadSemesters, activeId, toast, confirm, theme, themePref, setTheme, deleteWithUndo, showShortcuts, setShowShortcuts, unknownCount, setUnknownCount }),
    [semesters, reloadSemesters, activeId, toast, confirm, theme, themePref, setTheme, deleteWithUndo, showShortcuts, unknownCount],
  );

  return (
    <C.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span className="msg">{t.msg}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.run();
                  setToasts((x) => x.filter((y) => y.id !== t.id));
                }}
              >
                <Icon name="undo" size={14} /> {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      {confirmState && <ConfirmDialog {...confirmState} onClose={(v) => { confirmState.resolve(v); setConfirmState(null); }} />}
    </C.Provider>
  );
}

function ConfirmDialog({ title, body, confirmLabel, danger, onClose }: ConfirmOpts & { onClose: (v: boolean) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose(false);
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-wrap">
      <div className="modal-backdrop" onClick={() => onClose(false)} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" style={{ width: 'min(100%, 460px)' }}>
        <div className="modal-head">
          <h2 id="cf-title">{title}</h2>
        </div>
        {body && <div className="modal-body">{body}</div>}
        <div className="modal-foot">
          <button className="btn ghost" onClick={() => onClose(false)}>إلغاء</button>
          <button ref={ref} className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => onClose(true)}>
            {confirmLabel ?? 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
}
