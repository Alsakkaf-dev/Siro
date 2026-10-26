import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { PLUGINS } from '../core/plugins.config.js';
import type { NavItem } from '../core/plugin.js';
import { Modal, Skeleton, cx } from '../ui/ui.js';
import { Palette } from './Palette.js';
import { DeadlineBell } from '../notify/Bell.js';
import { semesterStatus, todayMs } from '../../../shared/semester.js';
import { APP_NAME } from '../../../shared/constants.js';

const SHORTCUTS: { keys: string; what: string }[] = [
  { keys: '/ أو Ctrl+K', what: 'البحث في الفصول والمكتبة والحياة والرياضة + أوامر سريعة' },
  { keys: 'g ثم h', what: 'الصفحة الرئيسية' },
  { keys: 'g ثم s', what: 'مدير الفصول' },
  { keys: 'g ثم d', what: 'لوحة الفصل' },
  { keys: 'g ثم c', what: 'المواد' },
  { keys: 'g ثم t', what: 'الجدول الزمني' },
  { keys: 'g ثم k', what: 'حاسبة الدرجات' },
  { keys: 'g ثم w', what: 'خريطة الأوزان' },
  { keys: 'g ثم u', what: 'غير المعروف' },
  { keys: 'g ثم r', what: 'مراجعة الأسبوع' },
  { keys: 'g ثم ,', what: 'الإعدادات' },
  { keys: 'Esc', what: 'إغلاق النافذة أو القائمة' },
  { keys: '?', what: 'عرض هذه القائمة' },
];

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

export function Shell() {
  const { semesters, activeId, theme, setTheme, unknownCount, showShortcuts, setShowShortcuts } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const semMatch = /\/academic\/s\/([^/]+)/.exec(loc.pathname);
  const currentSemesterId = semMatch?.[1] ?? activeId;
  const plugin = PLUGINS.find((p) => loc.pathname.startsWith(p.basePath)) ?? null;
  const sections = useMemo(() => (plugin ?? PLUGINS[0]!).nav({ activeSemesterId: activeId, currentSemesterId, semesters: (semesters ?? []).map((s) => ({ id: s.id, code: s.code, name: s.name, is_active: s.is_active })), unknownCount }), [plugin, activeId, currentSemesterId, semesters, unknownCount]);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    document.title = `${plugin ? plugin.name.ar + ' · ' : ''}${APP_NAME}`;
  }, [plugin, loc.pathname]);

  useEffect(() => {
    let g = false;
    let timer = 0;
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (g) {
        g = false;
        window.clearTimeout(timer);
        const base = currentSemesterId ? `/academic/s/${currentSemesterId}` : '/academic';
        const map: Record<string, string> = { h: '/', s: '/academic', d: base, c: `${base}/courses`, t: `${base}/timeline`, k: `${base}/calculator`, w: `${base}/weights`, u: `${base}/unknowns`, r: '/review', ',': '/settings' };
        const to = map[e.key.toLowerCase()];
        if (to) {
          e.preventDefault();
          nav(to);
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'g') {
        g = true;
        timer = window.setTimeout(() => (g = false), 1200);
      } else if (e.key === '?') {
        setShowShortcuts(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [nav, currentSemesterId, setShowShortcuts]);

  const curSem = semesters?.find((s) => s.id === currentSemesterId);

  return (
    <div className="app">
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={cx('sidebar', open && 'open')} aria-label="القائمة الجانبية">
        <Link to="/" className="brand">
          <span className="brand-mark"><Icon name="sparkle" size={20} /></span>
          <span>{APP_NAME}</span>
        </Link>
        <PluginSwitcher cls="" />
        <nav aria-label="التنقل">
          {sections.map((sec, i) => (
            <div key={i} className="nav-sec">
              {sec.title && <div className="nav-title">{sec.title}</div>}
              {sec.items.map((it) => (
                <NavEntry key={it.to} item={it} />
              ))}
            </div>
          ))}
          <div className="nav-sec" style={{ marginBlockStart: 'var(--s-3)' }}>
            <div className="nav-title">عام</div>
            <NavEntry item={{ to: '/', label: 'الرئيسية', icon: 'home', end: true, hint: 'g h' }} />
            <NavEntry item={{ to: '/review', label: 'مراجعة الأسبوع', icon: 'sparkle', hint: 'g r' }} />
            <NavEntry item={{ to: '/settings', label: 'الإعدادات والنسخ', icon: 'sliders', hint: 'g ,' }} />
          </div>
        </nav>
        <div className="side-card">
          <h4><Icon name="lock" size={15} /> بياناتك عندك فقط</h4>
          <p>كل شيء محفوظ على جهازك في ملف واحد. لا إنترنت ولا حسابات ولا تتبّع.</p>
          <Link to="/settings" className="btn sm">النسخ الاحتياطي</Link>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" aria-label="فتح القائمة" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" size={20} /></button>
          <PluginSwitcher cls="top" />
          <div className="spacer" />
          <Palette inputRef={searchRef} />
          {curSem && semesters && (
            <SemChip current={curSem.id} />
          )}
          <DeadlineBell />
          <div className="theme-toggle" role="group" aria-label="المظهر">
            <button aria-pressed={theme === 'light'} aria-label="فاتح" onClick={() => setTheme('light')}><Icon name="sun" size={17} /></button>
            <button aria-pressed={theme === 'dark'} aria-label="داكن" onClick={() => setTheme('dark')}><Icon name="moon" size={17} /></button>
          </div>
          <button className="icon-btn" aria-label="اختصارات لوحة المفاتيح" title="اختصارات (؟)" onClick={() => setShowShortcuts(true)}><Icon name="hash" size={18} /></button>
          <span className="avatar" aria-hidden="true">م</span>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <Suspense fallback={<div className="page"><Skeleton h={40} w="35%" /><div style={{ height: 24 }} /><Skeleton h={280} r={20} /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {showShortcuts && (
        <Modal title="اختصارات لوحة المفاتيح" onClose={() => setShowShortcuts(false)}>
          <dl className="kv" style={{ gridTemplateColumns: 'auto 1fr' }}>
            {SHORTCUTS.map((s) => (
              <div key={s.keys} style={{ display: 'contents' }}>
                <dt><span className="kbd" dir="ltr">{s.keys}</span></dt>
                <dd>{s.what}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  );
}

function NavEntry({ item }: { item: NavItem }) {
  const loc = useLocation();
  const inSub = item.children?.some((c) => loc.pathname.startsWith(c.to));
  return (
    <>
      <NavLink to={item.to} end={item.end} className="nav-link">
        <Icon name={item.icon} size={18} />
        <span>{item.label}</span>
        {item.badge !== undefined && <span className="badge warn" style={{ marginInlineStart: 'auto' }}>{item.badge}</span>}
        {item.hint && item.badge === undefined && <span className="kbd-hint" dir="ltr">{item.hint}</span>}
      </NavLink>
      {item.children && item.children.length > 0 && (inSub || loc.pathname === item.to) && (
        <div className="nav-sub">
          {item.children.map((c) => (
            <NavLink key={c.to} to={c.to} className="nav-link">
              <span><bdi>{c.label}</bdi></span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}

function PluginSwitcher({ cls }: { cls: string }) {
  const loc = useLocation();
  return (
    <div className={cx('switcher', cls)} role="navigation" aria-label="المنصات">
      {PLUGINS.map((p) =>
        p.status === 'soon' ? (
          <Link key={p.id} to={p.basePath} className="soon" aria-current={loc.pathname.startsWith(p.basePath) ? 'page' : undefined} title="قريبًا">
            {p.name.ar} <span className="badge dashed" style={{ fontSize: 10, lineHeight: '16px' }}>قريبًا</span>
          </Link>
        ) : (
          <Link key={p.id} to={p.basePath} aria-current={loc.pathname.startsWith(p.basePath) ? 'page' : undefined}>
            <Icon name={p.icon} size={15} /> {p.name.ar}
          </Link>
        ),
      )}
    </div>
  );
}

function SemChip({ current }: { current: string }) {
  const { semesters } = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', d);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', d);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  const cur = semesters?.find((s) => s.id === current);
  if (!cur || !semesters) return null;
  const now = todayMs();
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="sem-chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" size={16} /> <span className="lbl"><bdi>{cur.code}</bdi></span> <Icon name="down" size={14} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {semesters.map((s) => (
            <button key={s.id} role="menuitem" onClick={() => { setOpen(false); nav(`/academic/s/${s.id}`); }}>
              <span><bdi>{s.code}</bdi> <small className="muted">· {semesterStatus(now, s) === 'current' ? 'جارٍ' : semesterStatus(now, s) === 'past' ? 'منتهٍ' : 'قادم'}</small></span>
              {s.id === current && <Icon name="check" size={16} />}
            </button>
          ))}
          <div className="sep" />
          <button role="menuitem" onClick={() => { setOpen(false); nav('/academic'); }}><span>مدير الفصول</span><Icon name="layers" size={16} /></button>
        </div>
      )}
    </div>
  );
}
