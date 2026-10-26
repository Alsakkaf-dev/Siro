import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { Skeleton, cx, useDebounced } from '../ui/ui.js';
import { normalizeText } from '../../../shared/text.js';
import type { MoreHit, SearchHit } from '../../../shared/types.js';

interface Cmd { id: string; title: string; sub?: string; icon: IconName; keys?: string; to?: string; run?: () => void; top?: boolean }
interface Row { key: string; group: string; title: string; sub?: string; color?: string; icon?: IconName; to?: string; run?: () => void }

const TOP = new Set(['/', '/academic', '/library', '/life', '/life/finance', '/sports', '/review', '/settings']);
const PAGES: { to: string; title: string; icon: IconName; kw: string }[] = [
  { to: '/', title: 'الرئيسية', icon: 'home', kw: 'home dashboard' },
  { to: '/academic', title: 'الفصول الدراسية', icon: 'calendar', kw: 'academic semesters' },
  { to: '/library', title: 'المكتبة', icon: 'book', kw: 'library pdf files' },
  { to: '/library/youtube', title: 'مكتبة YouTube', icon: 'play', kw: 'youtube videos' },
  { to: '/life', title: 'الحياة — اللوحة', icon: 'heart', kw: 'life dashboard' },
  { to: '/life/finance', title: 'المالية', icon: 'chart', kw: 'finance money spending مصروف فلوس' },
  { to: '/life/prayers', title: 'الصلاة والقضاء', icon: 'moon', kw: 'prayers qada' },
  { to: '/life/habits', title: 'العادات', icon: 'check', kw: 'habits vape sugar تدخين سكر' },
  { to: '/life/routine', title: 'الروتين اليومي', icon: 'clock', kw: 'routine schedule' },
  { to: '/life/body', title: 'الجسم والوزن', icon: 'target', kw: 'body weight وزن' },
  { to: '/life/alternatives', title: 'بدائل العادات', icon: 'zap', kw: 'alternatives' },
  { to: '/life/ledger', title: 'السجل المالي الكامل', icon: 'database', kw: 'ledger سجل مصروفات' },
  { to: '/life/insights', title: 'مؤشرات المال', icon: 'chart', kw: 'insights مؤشرات متوسط الصرف' },
  { to: '/life/routine-map', title: 'خريطة الروتين الأسبوعي', icon: 'timer', kw: 'routine map كتل' },
  { to: '/life/qada-plan', title: 'خطة القضاء', icon: 'clock', kw: 'qada plan قضاء سيناريو' },
  { to: '/life/glossary', title: 'المصطلحات', icon: 'book', kw: 'glossary terms قاموس' },
  { to: '/sports', title: 'الرياضة — التمارين', icon: 'dumbbell', kw: 'sports exercises muscles عضلات' },
  { to: '/sports/templates', title: 'قوالب التمارين', icon: 'dumbbell', kw: 'templates plans' },
  { to: '/sports/mine', title: 'تماريني', icon: 'dumbbell', kw: 'my workouts' },
  { to: '/review', title: 'مراجعة الأسبوع', icon: 'sparkle', kw: 'weekly review المراجعة الأسبوعية' },
  { to: '/settings', title: 'الإعدادات والنسخ الاحتياطي', icon: 'sliders', kw: 'settings backup' },
];

const GROUPS: [MoreHit['kind'], string][] = [['library', 'المكتبة'], ['youtube', 'YouTube'], ['life', 'الحياة'], ['sports', 'تمارين'], ['workout', 'تماريني'], ['glossary', 'المصطلحات']];

export function Palette({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { theme, setTheme, setShowShortcuts } = useApp();
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

  const cmds: Cmd[] = useMemo(
    () => [
      ...PAGES.map((p): Cmd => ({ id: p.to, title: p.title, icon: p.icon, to: p.to, sub: p.kw, top: TOP.has(p.to) })),
      { id: 'theme', title: theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن', icon: theme === 'dark' ? 'sun' : 'moon', sub: 'theme dark light مظهر', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'notify', title: 'إعدادات الإشعارات والمظهر', icon: 'bell', to: '/settings#appearance', sub: 'notifications accent لون تنبيه' },
      { id: 'keys', title: 'اختصارات لوحة المفاتيح', icon: 'hash', run: () => setShowShortcuts(true), sub: 'shortcuts' },
    ],
    [theme, setTheme, setShowShortcuts],
  );

  const nq = normalizeText(q);
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const cm = (nq ? cmds.filter((c) => normalizeText(`${c.title} ${c.sub ?? ''}`).includes(nq)) : cmds.filter((c) => c.top)).slice(0, nq ? 5 : 8);
    cm.forEach((c) => out.push({ key: `c-${c.id}`, group: nq ? 'صفحات وأوامر' : 'اذهب إلى', title: c.title, icon: c.icon, ...(c.to ? { to: c.to } : {}), ...(c.run ? { run: c.run } : {}) }));
    const academic = (hits ?? []).slice(0, 12);
    const urlOf = (h: SearchHit): string => `/academic/s/${h.semester_id}/courses/${h.course_id}${h.type === 'assessment' ? `#a-${h.id}` : ''}`;
    academic.filter((h) => h.type === 'course').forEach((h) => out.push({ key: `a-${h.id}`, group: 'المواد', title: h.title, sub: h.subtitle, color: h.color, to: urlOf(h) }));
    academic.filter((h) => h.type === 'assessment').forEach((h) => out.push({ key: `a-${h.id}`, group: 'التقييمات', title: h.title, sub: h.subtitle, color: h.color, to: urlOf(h) }));
    for (const [k, label] of GROUPS) more.filter((m) => m.kind === k).forEach((m) => out.push({ key: `${k}-${m.id}`, group: label, title: m.title, sub: m.subtitle, to: m.to }));
    return out;
  }, [cmds, nq, hits, more]);

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
