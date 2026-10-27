import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { PLUGINS } from '../core/plugins.config.js';
import type { NavItem, PluginCtx } from '../core/plugin.js';
import { autoCrumbs, lineOf } from '../core/metro.js';
import { Modal, Skeleton, cx } from '../ui/ui.js';
import { Palette } from './Palette.js';
import { DeadlineBell } from '../notify/Bell.js';
import { semesterStatus, todayMs } from '../../../shared/semester.js';
import { APP_NAME } from '../../../shared/constants.js';

const CreateLayer = lazy(() => import('./Create.js'));

const isLocal = typeof location !== 'undefined' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost');

const SHORTCUTS: { keys: string; what: string }[] = [
  { keys: '/ أو Ctrl+K', what: 'البحث في كل شيء + أوامر سريعة («أنشئ…»، «اذهب إلى…»)' },
  { keys: 'n', what: 'إنشاء (+): تقييم، عنصر، مساحة، فيديو، تمرين…' },
  { keys: 'g ثم h', what: 'اليوم (الرئيسية)' },
  { keys: 'g ثم j', what: 'هذا الأسبوع' },
  { keys: 'g ثم e', what: 'كل شيء' },
  { keys: 'g ثم i', what: 'الوارد' },
  { keys: 'g ثم s', what: 'الدراسة: الفصول' },
  { keys: 'g ثم d / c / t / k / w / u', what: 'لوحة الفصل / المواد / الجدول الزمني / الحاسبة / الأوزان / غير المعروف' },
  { keys: 'g ثم l', what: 'المكتبة' },
  { keys: 'g ثم f', what: 'الحياة' },
  { keys: 'g ثم p', what: 'الرياضة' },
  { keys: 'g ثم m', what: 'مساحاتي' },
  { keys: 'g ثم r', what: 'مراجعة الأسبوع' },
  { keys: 'g ثم ,', what: 'الإعدادات والبيانات' },
  { keys: 'Esc', what: 'إغلاق النافذة أو القائمة أو اللوحة الجانبية' },
  { keys: '?', what: 'عرض هذه القائمة' },
];

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

export function usePluginCtx(): PluginCtx & { currentSemesterId: string | null } {
  const { semesters, activeId, unknownCount, spaces } = useApp();
  const loc = useLocation();
  const semMatch = /\/academic\/s\/([^/]+)/.exec(loc.pathname);
  const currentSemesterId = semMatch?.[1] ?? activeId;
  return useMemo(
    () => ({
      activeSemesterId: activeId,
      currentSemesterId,
      semesters: (semesters ?? []).map((s) => ({ id: s.id, code: s.code, name: s.name, is_active: s.is_active })),
      unknownCount,
      spaces: (spaces ?? []).map((s) => ({ id: s.id, name: s.name, icon: s.icon, color: s.color })),
    }),
    [activeId, currentSemesterId, semesters, unknownCount, spaces],
  );
}

export function Shell() {
  const { semesters, theme, setTheme, showShortcuts, setShowShortcuts, crumbs, createCmd, openCreate, profileName } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const ctx = usePluginCtx();
  const currentSemesterId = ctx.currentSemesterId;

  const line = lineOf(loc.pathname);
  const shown = line ?? PLUGINS[0]!;
  const sections = useMemo(() => shown.nav(ctx), [shown, ctx]);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    document.title = `${line && line.id !== 'home' ? line.name.ar + ' · ' : ''}${APP_NAME}`;
  }, [line, loc.pathname]);

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
      if (document.querySelector('.modal-wrap, .drawer-wrap')) return;
      if (g) {
        g = false;
        window.clearTimeout(timer);
        const base = currentSemesterId ? `/academic/s/${currentSemesterId}` : '/academic';
        const map: Record<string, string> = {
          h: '/', j: '/week', e: '/everything', i: '/inbox', s: '/academic', d: base, c: `${base}/courses`, t: `${base}/timeline`, k: `${base}/calculator`, w: `${base}/weights`, u: `${base}/unknowns`,
          l: '/library', f: '/life', p: '/sports', m: '/spaces', r: '/review', ',': '/settings',
        };
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
      } else if (e.key === 'n') {
        e.preventDefault();
        openCreate({ kind: 'menu' });
      } else if (e.key === '?') {
        setShowShortcuts(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [nav, currentSemesterId, setShowShortcuts, openCreate]);

  const curSem = semesters?.find((s) => s.id === currentSemesterId);
  const trail = crumbs ?? autoCrumbs(loc.pathname, ctx);
  // أول عنصر في مسار الصفحة غالبًا اسم الخط/الصفحة الأم القديم — لا نكرره بعد شارة الخط
  const lineLabels = new Set([shown.name.ar, 'الفصول', 'الحياة', 'الرياضة', 'المكتبة']);
  const trailShown = line && trail.length && trail[0]!.to === line.basePath && lineLabels.has(trail[0]!.label) ? trail.slice(1) : trail;

  return (
    <div className="app" style={{ '--line': shown.color } as never}>
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى</a>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={cx('sidebar', open && 'open')} aria-label="القائمة الجانبية">
        <Link to="/" className="brand">
          <span className="brand-mark"><Icon name="sparkle" size={20} /></span>
          <span>{APP_NAME}</span>
        </Link>
        <nav className="metro" aria-label="الخطوط والمحطات">
          {PLUGINS.map((p) => {
            const on = p.id === shown.id;
            return (
              <div key={p.id} className={cx('metro-line', on && 'on')} style={{ '--lc': p.color } as never}>
                <Link to={p.basePath} className="line-link" aria-current={on && loc.pathname === p.basePath ? 'page' : undefined} aria-expanded={on}>
                  <i className="lc-dot" aria-hidden="true" />
                  <Icon name={p.icon} size={17} />
                  <span>{p.name.ar}</span>
                  {p.key && <span className="kbd-hint" dir="ltr" aria-hidden="true">g {p.key}</span>}
                </Link>
                {on && (
                  <div className="stations">
                    {sections.map((sec, i) => (
                      <div key={i} className={cx('nav-sec', sec.interchange && 'interchange')}>
                        {sec.title && <div className="nav-title">{sec.interchange && <Icon name="link" size={12} />} {sec.title}</div>}
                        {sec.items.map((it) => (
                          <NavEntry key={it.to} item={it} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="nav-sec metro-global">
            <NavEntry item={{ to: '/settings', label: 'الإعدادات والبيانات', icon: 'sliders', hint: 'g ,' }} />
            <NavEntry item={{ to: '/trash', label: 'سلة المحذوفات', icon: 'trash' }} />
          </div>
        </nav>
        <div className="side-card">
          <h4><Icon name="lock" size={15} /> {isLocal ? 'بياناتك عندك فقط' : 'النسخة المنشورة'}</h4>
          <p>{isLocal ? 'كل شيء محفوظ على جهازك في ملف واحد. لا حسابات ولا تتبّع.' : 'تعمل على الإنترنت؛ الحفظ الدائم يتطلب تخزين Vercel Blob (انظر الإعدادات).'}</p>
          <Link to="/settings#data" className="btn sm">النسخ الاحتياطي</Link>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" aria-label="فتح القائمة" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" size={20} /></button>
          <div className="spacer" />
          <Palette inputRef={searchRef} />
          <button className="btn primary create-btn" aria-label="إنشاء جديد (n)" title="إنشاء جديد (n)" aria-haspopup="dialog" onClick={() => openCreate({ kind: 'menu' })}>
            <Icon name="plus" size={18} /> <span className="lbl">إنشاء</span>
          </button>
          {curSem && semesters && <SemChip current={curSem.id} />}
          <DeadlineBell />
          <div className="theme-toggle" role="group" aria-label="المظهر">
            <button aria-pressed={theme === 'light'} aria-label="فاتح" onClick={() => setTheme('light')}><Icon name="sun" size={17} /></button>
            <button aria-pressed={theme === 'dark'} aria-label="داكن" onClick={() => setTheme('dark')}><Icon name="moon" size={17} /></button>
          </div>
          <button className="icon-btn" aria-label="اختصارات لوحة المفاتيح" title="اختصارات (؟)" onClick={() => setShowShortcuts(true)}><Icon name="hash" size={18} /></button>
          <Link to="/settings#profile" className="avatar" aria-label="الملف الشخصي والإعدادات">{(profileName ?? 'م').trim().slice(0, 1) || 'م'}</Link>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <nav className="crumbs line-crumbs" aria-label="أنت هنا">
            <Link to={shown.basePath} className="line-chip"><span className="line-dot" aria-hidden="true" /><bdi>{shown.name.ar}</bdi></Link>
            {trailShown.map((c, i) => (
              <span key={i} className="row" style={{ gap: 6 }}>
                <Icon name="left" size={12} />
                {c.to && i < trailShown.length - 1 ? <Link to={c.to}><bdi>{c.label}</bdi></Link> : <span aria-current={i === trailShown.length - 1 ? 'page' : undefined}><bdi>{c.label}</bdi></span>}
              </span>
            ))}
          </nav>
          <Suspense fallback={<div className="page"><Skeleton h={40} w="35%" /><div style={{ height: 24 }} /><Skeleton h={280} r={20} /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomBar onMore={() => setOpen(true)} />
      {createCmd && (
        <Suspense fallback={null}>
          <CreateLayer />
        </Suspense>
      )}
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
        {item.badge !== undefined && <span className="badge warn" style={{ marginInlineStart: 'auto' }} aria-label={`${item.badge} عنصر`}>{item.badge}</span>}
        {item.hint && item.badge === undefined && <span className="kbd-hint" dir="ltr" aria-hidden="true">{item.hint}</span>}
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

/** شريط سفلي للجوال: 5 أهداف كبيرة (Fitts) — الرئيسية، الدراسة، إنشاء، مساحاتي، المزيد */
function BottomBar({ onMore }: { onMore: () => void }) {
  const loc = useLocation();
  const { openCreate } = useApp();
  const cur = lineOf(loc.pathname)?.id;
  const item = (to: string, id: string, label: string, icon: Parameters<typeof Icon>[0]['name']) => (
    <Link to={to} aria-current={cur === id ? 'page' : undefined}><Icon name={icon} size={20} /><span>{label}</span></Link>
  );
  return (
    <nav className="bottom-bar" aria-label="التنقل السريع">
      {item('/', 'home', 'اليوم', 'home')}
      {item('/academic', 'academic', 'الدراسة', 'calendar')}
      <button type="button" className="bb-create" aria-label="إنشاء جديد" onClick={() => openCreate({ kind: 'menu' })}><Icon name="plus" size={22} /></button>
      {item('/spaces', 'spaces', 'مساحاتي', 'layers')}
      <button type="button" onClick={onMore} aria-label="كل الخطوط والقائمة"><Icon name="menu" size={20} /><span>المزيد</span></button>
    </nav>
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
      <button className="sem-chip" aria-label={`الفصل: ${cur.code} — تغيير الفصل`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
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
          <button role="menuitem" onClick={() => { setOpen(false); nav('/academic'); }}><span>الفصول</span><Icon name="layers" size={16} /></button>
        </div>
      )}
    </div>
  );
}
