import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { readRecent } from '../core/recent.js';
import { AREAS, AREA_BY_ID, NEW_ACTIONS, PAGES, hrefFor, resolvePath, scoreText } from '../core/registry.js';
import { Skeleton, cx, useDebounced } from '../ui/ui.js';
import { normalizeText } from '../../../shared/text.js';
import type { MoreHit, SearchHit } from '../../../shared/types.js';
import { lib } from '../lib/api.js';

interface Row { key: string; group: string; title: string; sub?: string; color?: string; icon?: IconName; to?: string; run?: () => void; score: number }

const GROUPS: [MoreHit['kind'], string][] = [['space', 'مساحاتي'], ['item', 'عناصر المساحات'], ['library', 'المكتبة'], ['youtube', 'YouTube'], ['life', 'الحياة'], ['sports', 'تمارين'], ['workout', 'تماريني'], ['glossary', 'المصطلحات']];
// روابط الخادم القديمة تُصحَّح هنا مباشرة بدل المرور بالتحويل
const fixTo = (to: string): string => to.replace(/^\/life\/glossary(?=[#?]|$)/, '/glossary');

/** ترتيب المجموعات بأعلى درجة فيها، والصفوف داخلها بالدرجة؛ Enter = أول صف معروض. */
export function orderRows(rows: Row[]): Row[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) groups.set(r.group, [...(groups.get(r.group) ?? []), r]);
  return [...groups.values()]
    .map((g) => g.map((r, i) => ({ r, i })).sort((a, b) => b.r.score - a.r.score || a.i - b.i).map((x) => x.r))
    .map((g, i) => ({ g, i, top: g[0]?.score ?? 0 }))
    .sort((a, b) => b.top - a.top || a.i - b.i)
    .flatMap((x) => x.g);
}

export function Palette({ inputRef, semId }: { inputRef: React.RefObject<HTMLInputElement | null>; semId: string | null }) {
  const { theme, setTheme, setShowShortcuts, openCreate, openAi, toast } = useApp();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim(), 160);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [more, setMore] = useState<MoreHit[]>([]);
  const [focus, setFocus] = useState(false);
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  useEffect(() => {
    setFocus(false);
    setQ('');
  }, [loc.pathname, loc.search]);

  useEffect(() => {
    let live = true;
    if (!dq) {
      setHits(null);
      setMore([]);
      return;
    }
    api.search(dq).then((h) => live && (setHits(h), setSel(0))).catch(() => live && setHits([]));
    api.searchMore(dq).then((m) => live && setMore(m)).catch(() => live && setMore([]));
    return () => {
      live = false;
    };
  }, [dq]);

  useEffect(() => {
    const d = (e: MouseEvent): void => {
      if (!wrap.current?.contains(e.target as Node)) setFocus(false);
    };
    document.addEventListener('mousedown', d);
    return () => document.removeEventListener('mousedown', d);
  }, []);

  const nq = normalizeText(q);
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    if (!nq) {
      readRecent().filter((r) => r.path !== loc.pathname + loc.search).forEach((r, i) => out.push({ key: `r-${r.path}`, group: 'زرتَه مؤخرًا', title: r.title, icon: 'clock', to: r.path, score: 90 - i }));
      AREAS.filter((a) => !a.flag || flagEnabled(a.flag)).forEach((a, i) => out.push({ key: `ar-${a.id}`, group: 'الأقسام', title: a.label, icon: a.icon, to: hrefFor(a.entry, semId), sub: `g ${a.kbd}`, score: 50 - i }));
      return orderRows(out);
    }
    const pages = PAGES.filter((p) => !p.flag || flagEnabled(p.flag))
      .map((p) => {
        const to = resolvePath(p, { semId });
        const score = Math.max(scoreText(nq, normalizeText(p.label), normalizeText(p.keywords ?? '')), p.tabLabel ? scoreText(nq, normalizeText(p.tabLabel)) : 0);
        return { p, to, score };
      })
      .filter((x) => x.to && x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    pages.forEach(({ p, to, score }) => out.push({ key: `p-${p.id}`, group: 'صفحات', title: p.label, sub: AREA_BY_ID.get(p.area)?.label, icon: p.icon, to: to!, score }));
    for (const a of NEW_ACTIONS) {
      const to = a.to(semId);
      const score = Math.max(scoreText(nq, normalizeText(`إنشاء ${a.label}`)), scoreText(nq, normalizeText(a.label)) ? 30 : 0, scoreText(nq, '', 'new create جديد اضافه انشاء') ? 25 : 0);
      if (to && score > 0) out.push({ key: `n-${a.id}`, group: 'إنشاء', title: `إنشاء: ${a.label}`, icon: 'plus', to, score });
    }
    const misc: { id: string; title: string; icon: IconName; kw: string; to?: string; run?: () => void }[] = [
      { id: 'theme', title: theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن', icon: theme === 'dark' ? 'sun' : 'moon', kw: 'theme dark light مظهر داكن فاتح', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'notify', title: 'إعدادات الإشعارات والمظهر', icon: 'bell', kw: 'notifications accent لون تنبيه اشعارات', to: '/settings#notify' },
      { id: 'new-item', title: 'أنشئ عنصرًا في مساحاتي', icon: 'plus', kw: 'new item space task مهمة عنصر جديد اضافه انشئ', run: () => openCreate({ kind: 'quick-item' }) },
      { id: 'new-space', title: 'أنشئ مساحة جديدة', icon: 'layers', kw: 'new space template مساحة قالب جديد انشئ', to: '/spaces/templates' },
      { id: 'profile', title: 'الملف الشخصي (الاسم)', icon: 'user', kw: 'profile name اسم', to: '/settings#profile' },
      { id: 'backup', title: 'خذ نسخة احتياطية الآن', icon: 'download', kw: 'backup now نسخة احتياطية', run: () => void api.backupNow().then((b) => toast(`تم إنشاء النسخة ${b.name}`, { kind: 'ok' })).catch((e: Error) => toast(e.message, { kind: 'error' })) },
      { id: 'scan', title: 'افحص مجلد المكتبة الآن', icon: 'refresh', kw: 'scan library فحص مكتبة', run: () => void lib.scan().then(() => toast('بدأ فحص المكتبة', { kind: 'ok' })).catch((e: Error) => toast(e.message, { kind: 'error' })) },
      { id: 'keys', title: 'اختصارات لوحة المفاتيح', icon: 'hash', kw: 'shortcuts keyboard اختصارات', run: () => setShowShortcuts(true) },
    ];
    for (const c of misc) {
      const score = scoreText(nq, normalizeText(c.title), normalizeText(c.kw));
      if (score > 0) out.push({ key: `c-${c.id}`, group: 'أوامر', title: c.title, icon: c.icon, score, ...(c.to ? { to: c.to } : {}), ...(c.run ? { run: c.run } : {}) });
    }
    const academic = (hits ?? []).slice(0, 12);
    const urlOf = (h: SearchHit): string => `/academic/s/${h.semester_id}/courses/${h.course_id}${h.type === 'assessment' ? `#a-${h.id}` : ''}`;
    for (const h of academic) {
      const code = normalizeText(h.title.split(' — ')[0] ?? '');
      const score = h.type === 'course' && code === nq ? 100 : 50;
      out.push({ key: `a-${h.id}`, group: h.type === 'course' ? 'المواد' : 'التقييمات', title: h.title, sub: [h.subtitle, h.semester_code].filter(Boolean).join(' · '), color: h.color, to: urlOf(h), score });
    }
    for (const [k, label] of GROUPS) more.filter((m) => m.kind === k).forEach((m) => out.push({ key: `${k}-${m.id}`, group: label, title: m.title, sub: m.subtitle, to: fixTo(m.to), score: 45 }));
    // المساعد: جملة (3 كلمات فأكثر) = طلب ← أول صف؛ غير ذلك آخر صف
    const text = q.trim();
    if (text.length >= 2) {
      const long = text.split(/\s+/).length >= 3;
      out.push({ key: 'ai', group: 'المساعد', title: `اطلب من المساعد: «${text.length > 60 ? `${text.slice(0, 60)}…` : text}»`, sub: 'Ctrl+Enter', icon: 'sparkle', run: () => openAi({ prompt: text, send: true }), score: long ? 101 : 0 });
    }
    return orderRows(out);
  }, [nq, q, hits, more, semId, theme, setTheme, setShowShortcuts, openCreate, openAi, toast, loc.pathname, loc.search]);

  const open = focus;
  const go = (r: Row | undefined): void => {
    if (!r) {
      if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
      return;
    }
    setFocus(false);
    inputRef.current?.blur();
    if (r.run) r.run();
    else if (r.to) nav(r.to);
  };
  const loading = dq !== '' && hits === null;
  const groups: { name: string; rows: { r: Row; i: number }[] }[] = [];
  rows.forEach((r, i) => {
    const g = groups[groups.length - 1];
    if (g && g.name === r.group) g.rows.push({ r, i });
    else groups.push({ name: r.group, rows: [{ r, i }] });
  });

  return (
    <div className="search" ref={wrap} role="search">
      <Icon name="search" size={17} className="s-ico" />
      <input
        ref={inputRef}
        value={q}
        placeholder={typeof window !== 'undefined' && window.innerWidth < 480 ? 'ابحث…' : 'ابحث أو اكتب أمرًا… (Ctrl+K)'}
        aria-label="بحث شامل"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-pop"
        aria-autocomplete="list"
        aria-activedescendant={open && rows[sel] ? `pal-${sel}` : undefined}
        onFocus={() => setFocus(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setFocus(false);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocus(true);
            setSel((s) => Math.min(rows.length - 1, s + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSel((s) => Math.max(0, s - 1));
          } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && q.trim()) {
            e.preventDefault();
            go(rows.find((r) => r.key === 'ai'));
          } else if (e.key === 'Enter') {
            go(rows[sel]);
          }
        }}
      />
      <span className="kbd" dir="ltr">/</span>
      {open && (
        <div className="search-pop pal" id="search-pop" role="listbox" aria-label="نتائج البحث والأوامر">
          {loading && rows.length === 0 && <div style={{ padding: 12 }}><Skeleton h={14} /><div style={{ height: 8 }} /><Skeleton h={14} w="70%" /></div>}
          {!loading && dq !== '' && rows.length === 0 && <div className="muted" style={{ padding: 16, textAlign: 'center' }}>لا نتائج لـ «{q.trim()}»</div>}
          {groups.map((g) => (
            <div key={g.name} role="group" aria-label={g.name}>
              <div className="hit-group">{g.name}</div>
              {g.rows.map(({ r, i }) => (
                <button key={r.key} id={`pal-${i}`} type="button" role="option" aria-selected={sel === i} className={cx('hit', sel === i && 'on')} onMouseEnter={() => setSel(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(r)}>
                  {r.color ? <i className="dot" style={{ background: r.color }} /> : r.icon ? <Icon name={r.icon} size={16} className="hit-ico" /> : null}
                  <span><bdi>{r.title}</bdi>{r.sub ? <small><bdi>{r.sub}</bdi></small> : null}</span>
                </button>
              ))}
            </div>
          ))}
          {dq !== '' && rows.length > 0 && <button type="button" className="hit" style={{ justifyContent: 'center', color: 'var(--accent)' }} onMouseDown={(e) => e.preventDefault()} onClick={() => { setFocus(false); nav(`/search?q=${encodeURIComponent(q.trim())}`); }}>كل النتائج</button>}
        </div>
      )}
    </div>
  );
}
