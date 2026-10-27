import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Deleted } from '../lib/api.js';
import { wos, type Space } from '../lib/wos.js';
import type { Crumb } from './metro.js';
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
  /** مساحاتي (للقائمة والإنشاء السريع) */
  spaces: Space[] | null;
  reloadSpaces: () => Promise<void>;
  /** اسم المالك (إعداد profile.name) */
  profileName: string | null;
  setProfileName: (n: string | null) => void;
  /** مسار التنقل الذي تعلنه الصفحة (يرسمه الإطار مرة واحدة) */
  crumbs: Crumb[] | null;
  setCrumbs: (c: Crumb[] | null) => void;
  /** فتح قائمة الإنشاء أو نموذج إنشاء سريع من أي مكان */
  createCmd: CreateCmd | null;
  openCreate: (c: CreateCmd | null) => void;
}
export type CreateCmd = { kind: 'menu' } | { kind: 'quick-item'; spaceId?: string; due?: string } | { kind: 'quick-assessment'; courseId?: string } | { kind: 'quick-note' };

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
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  const [createCmd, openCreate] = useState<CreateCmd | null>(null);
  const reloadSpaces = useCallback(async () => {
    try {
      setSpaces(await wos.spaces());
    } catch {
      setSpaces([]);
    }
  }, []);
  useEffect(() => {
    // بعد أول رسم: لا تنافس طلبات الصفحة الأولى
    const t = window.setTimeout(() => {
      void reloadSpaces();
      wos.profile().then((p) => setProfileName(p.name)).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(t);
  }, [reloadSpaces]);

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
                  void reloadSpaces();
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
    [toast, reloadSemesters, reloadSpaces],
  );

  const activeId = useMemo(() => semesters?.find((s) => s.is_active)?.id ?? semesters?.[0]?.id ?? null, [semesters]);

  const value = useMemo<Ctx>(
    () => ({ semesters, reloadSemesters, activeId, toast, confirm, theme, themePref, setTheme, deleteWithUndo, showShortcuts, setShowShortcuts, unknownCount, setUnknownCount, spaces, reloadSpaces, profileName, setProfileName, crumbs, setCrumbs, createCmd, openCreate }),
    [semesters, reloadSemesters, activeId, toast, confirm, theme, themePref, setTheme, deleteWithUndo, showShortcuts, unknownCount, spaces, reloadSpaces, profileName, crumbs, createCmd],
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
