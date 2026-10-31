import { Fragment, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, KBD_ALIASES, PAGES, gTarget, matchPage, sidebarOwner, titleFor } from '../core/registry.js';
import { TitleProvider } from '../core/title.js';
import { pushRecent } from '../core/recent.js';
import { Modal, Skeleton } from '../ui/ui.js';
import { Palette } from './Palette.js';
import { AreaBar, BottomBar, Sidebar } from './Sidebar.js';
import { NewMenu, SemChip } from './TopMenus.js';
import { DeadlineBell } from '../notify/Bell.js';

const CreateLayer = lazy(() => import('./Create.js'));
// نواة الذكاء تُحمَّل عند أول فتح فقط — لا تزيد الحزمة الأولى
const AiPanel = lazy(() => import('../ai/AiPanel.js'));

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

function useMedia(q: string): boolean {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = (): void => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

/** قائمة الاختصارات تُشتق من السجل (لا قائمة يدوية ثانية). */
function shortcutRows(): { keys: string; what: string }[] {
  return [
    { keys: '/ أو Ctrl+K', what: 'البحث والأوامر (الصفحات، المواد، المكتبة، الحياة، الرياضة)' },
    ...AREAS.filter((a) => !a.flag || flagEnabled(a.flag)).map((a) => ({ keys: `g ثم ${a.kbd}`, what: `قسم ${a.label}` })),
    ...PAGES.filter((p) => p.kbd && (!p.flag || flagEnabled(p.flag))).map((p) => ({ keys: `g ثم ${p.kbd}`, what: p.label })),
    ...Object.entries(KBD_ALIASES).map(([k, a]) => ({ keys: `g ثم ${k}`, what: a.label })),
    { keys: 'c', what: 'إنشاء جديد (مادة، تقييم، فصل، فيديو، تسجيل، تمرين، عنصر في مساحاتي)' },
    { keys: 'Ctrl+J', what: 'المساعد الذكي: اطلب بجملة (يبحث، يضيف، يعدّل، يحسب، يلخّص)' },
    { keys: 'Esc', what: 'إغلاق النافذة أو القائمة' },
    { keys: '? أو ؟', what: 'عرض هذه القائمة' },
  ];
}

export function Shell() {
  const { semesters, activeId, theme, setTheme, showShortcuts, setShowShortcuts, createCmd, profileName, aiCmd, openAi, dataRev } = useApp();
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    if (aiCmd) setAiOpen(true);
  }, [aiCmd]);
  const loc = useLocation();
  const nav = useNavigate();
  const navType = useNavigationType();
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [gWait, setGWait] = useState(false);
  const [titleOv, setTitleOv] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobile = useMedia('(max-width: 960px)');

  const match = useMemo(() => matchPage(loc.pathname), [loc.pathname]);
  const page = match?.page ?? null;
  const urlSem = match?.params['semId'] ?? null;
  const semId = urlSem ?? activeId;
  const owner = page ? sidebarOwner(page) : null;
  const activeArea = page?.area ?? null;
  const curSem = semesters?.find((s) => s.id === semId);

  // العنوان: تجاوز الصفحة (إن وُجد) أو تسمية السجل + القسم + المنصة
  useEffect(() => {
    document.title = titleFor(page, titleOv);
  }, [page, titleOv]);
  useEffect(() => {
    if (page && page.id !== 'today') pushRecent(loc.pathname + loc.search, titleOv ?? page.label);
  }, [page, titleOv, loc.pathname, loc.search]);

  // التمرير والتركيز عند تغيّر المسار فقط (لا search ولا hash)؛ Back يسترجع موضع التمرير
  const first = useRef(true);
  useEffect(() => {
    const k = `scroll:${loc.key}`;
    let raf = 0;
    const on = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(k, String(Math.round(window.scrollY)));
        } catch {
          /* غير متاح */
        }
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
    };
  }, [loc.key]);
  useLayoutEffect(() => {
    setOpen(false);
    setNewOpen(false);
    if (first.current) {
      first.current = false;
      return;
    }
    if (navType === 'POP') {
      let y = 0;
      try {
        y = Number(sessionStorage.getItem(`scroll:${loc.key}`) ?? 0);
      } catch {
        /* غير متاح */
      }
      let n = 0;
      const tryScroll = (): void => {
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        if (Math.abs(window.scrollY - y) > 2 && n++ < 30) requestAnimationFrame(tryScroll);
      };
      tryScroll();
    } else if (!loc.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // الانتقال فوري؛ التمرير الناعم للمراسي فقط
    if (!loc.hash) mainRef.current?.focus({ preventScroll: true });
  }, [loc.pathname]);

  // الاختصارات بـ e.code: تعمل بلوحة عربية أو لاتينية
  useEffect(() => {
    let g = false;
    let timer = 0;
    const stopG = (): void => {
      g = false;
      window.clearTimeout(timer);
      setGWait(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyJ') {
        e.preventDefault();
        setAiOpen((v) => {
          if (!v) openAi();
          return !v;
        });
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (g) {
        stopG();
        const to = gTarget(e.code, { semId, enabled: flagEnabled });
        if (to) {
          e.preventDefault();
          nav(to);
        }
        return;
      }
      const question = (e.code === 'Slash' && e.shiftKey) || e.key === '?' || e.key === '؟';
      if (question) {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.code === 'Slash') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.code === 'KeyG' && !e.shiftKey) {
        g = true;
        setGWait(true);
        timer = window.setTimeout(stopG, 1200);
      } else if (e.code === 'KeyC' && !e.shiftKey) {
        e.preventDefault();
        setNewOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [nav, semId, setShowShortcuts, open, openAi]);

  const setTitle = useCallback((t: string | null) => setTitleOv(t), []);
  const skip = (e: React.MouseEvent): void => {
    e.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <div className={aiOpen ? 'app ai-docked' : 'app'}>
      <a href="#main" className="skip-link" onClick={skip}>تخطَّ إلى المحتوى</a>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <Sidebar open={open} inert={mobile && !open} semId={semId} activeArea={activeArea} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn burger" aria-label="فتح القائمة" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}><Icon name="menu" size={20} /></button>
          <Palette inputRef={searchRef} semId={semId} />
          <div className="spacer" />
          <NewMenu open={newOpen} setOpen={setNewOpen} semId={semId} />
          {activeArea === 'study' && curSem && <SemChip current={curSem.id} />}
          <button className="icon-btn ai-launch" aria-label="المساعد الذكي (Ctrl+J)" title="المساعد الذكي (Ctrl+J)" aria-pressed={aiOpen} onClick={() => (aiOpen ? setAiOpen(false) : openAi())}><Icon name="sparkle" size={18} /></button>
          <DeadlineBell />
          <div className="theme-toggle" role="group" aria-label="المظهر">
            <button aria-pressed={theme === 'light'} aria-label="فاتح" onClick={() => setTheme('light')}><Icon name="sun" size={17} /></button>
            <button aria-pressed={theme === 'dark'} aria-label="داكن" onClick={() => setTheme('dark')}><Icon name="moon" size={17} /></button>
          </div>
          <button className="icon-btn hide-sm" aria-label="اختصارات لوحة المفاتيح" title="اختصارات (؟)" onClick={() => setShowShortcuts(true)}><Icon name="hash" size={18} /></button>
          <Link to="/settings#profile" className="avatar" aria-label="الملف الشخصي والإعدادات">{(profileName ?? 'م').trim().slice(0, 1) || 'م'}</Link>
        </header>
        <AreaBar semId={semId} activeArea={activeArea} owner={owner} onShortcuts={() => setShowShortcuts(true)} />
        <main id="main" className="content" tabIndex={-1} ref={mainRef}>
          <TitleProvider set={setTitle}>
            <Suspense fallback={<div className="page"><Skeleton h={40} w="35%" /><div style={{ height: 24 }} /><Skeleton h={280} r={20} /></div>}>
              {/* بعد أن يعدّل المساعد بيانات: إعادة تحميل الصفحة الحالية لتظهر التغييرات فورًا */}
              <Fragment key={dataRev}>
                <Outlet />
              </Fragment>
            </Suspense>
          </TitleProvider>
        </main>
      </div>
      <BottomBar semId={semId} activeArea={activeArea} onMore={() => setOpen(true)} moreOpen={open} />
      {aiOpen && (
        <Suspense fallback={null}>
          <AiPanel onClose={() => { setAiOpen(false); openAi(null); }} />
        </Suspense>
      )}
      {createCmd && (
        <Suspense fallback={null}>
          <CreateLayer />
        </Suspense>
      )}
      {gWait && <div className="g-wait" role="status" aria-live="polite" dir="ltr">g …</div>}
      {showShortcuts && (
        <Modal title="اختصارات لوحة المفاتيح" onClose={() => setShowShortcuts(false)}>
          <p className="muted" style={{ marginBlockEnd: 'var(--s-3)' }}>تعمل بأي لغة لوحة مفاتيح (عربية أو إنجليزية).</p>
          <dl className="kv" style={{ gridTemplateColumns: 'auto 1fr' }}>
            {shortcutRows().map((s) => (
              <div key={s.keys + s.what} style={{ display: 'contents' }}>
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
