import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { Skeleton, cx, useDebounced } from '../ui/ui.js';
import { normalizeText } from '../../../shared/text.js';
import type { MoreHit, SearchHit } from '../../../shared/types.js';
import { PLUGINS } from '../core/plugins.config.js';
import { stationsOf } from '../core/metro.js';
import { usePluginCtx } from './Shell.js';
import { lib } from '../lib/api.js';

interface Cmd { id: string; title: string; sub?: string; icon: IconName; keys?: string; to?: string; run?: () => void; top?: boolean }
interface Row { key: string; group: string; title: string; sub?: string; color?: string; icon?: IconName; to?: string; run?: () => void }

/** صفحات لا تظهر كمحطات في الخطوط (عامة) */
const GLOBAL_PAGES: { to: string; title: string; icon: IconName; kw: string }[] = [
  { to: '/settings', title: 'الإعدادات والبيانات', icon: 'sliders', kw: 'settings backup نسخ احتياطي تصدير استيراد مظهر' },
  { to: '/trash', title: 'سلة المحذوفات', icon: 'trash', kw: 'trash restore استعادة محذوف تراجع' },
  { to: '/settings#profile', title: 'الملف الشخصي (الاسم)', icon: 'user', kw: 'profile name اسم' },
];
const TOP = new Set(['/', '/week', '/academic', '/library', '/life', '/spaces', '/review', '/settings']);

const GROUPS: [MoreHit['kind'], string][] = [['space', 'مساحاتي'], ['item', 'عناصر المساحات'], ['library', 'المكتبة'], ['youtube', 'YouTube'], ['life', 'الحياة'], ['sports', 'تمارين'], ['workout', 'تماريني'], ['glossary', 'المصطلحات']];

export function Palette({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { theme, setTheme, setShowShortcuts, openCreate, toast } = useApp();
  const pctx = usePluginCtx();
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

  const cmds: Cmd[] = useMemo(() => {
    const out: Cmd[] = [];
    // أفعال «أنشئ …» من كل الخطوط (نفس قائمة +)
    for (const p of PLUGINS) {
      for (const a of p.create ?? []) {
        const to = a.to?.(pctx) ?? undefined;
        if (a.to && !to) continue;
        out.push({ id: `new-${p.id}-${a.id}`, title: `أنشئ ${a.label}`, sub: `create new add جديد إضافة ${p.name.ar}`, icon: 'plus', ...(a.command ? { run: () => openCreate(a.command === 'quick-item' ? { kind: 'quick-item' } : { kind: a.command! }) } : { to }) });
      }
    }
    // محطات كل الخطوط (مصدر واحد: سجل الخطوط)
    const seen = new Set<string>();
    for (const p of PLUGINS) {
      for (const st of stationsOf(p, pctx)) {
        if (st.interchange || seen.has(st.to)) continue;
        seen.add(st.to);
        out.push({ id: st.to, title: st.label === p.name.ar || st.to === p.basePath ? st.label : `${st.label} — ${p.name.ar}`, icon: st.icon, to: st.to, sub: `${st.kw ?? ''} ${p.name.en} ${p.name.ar}`, top: TOP.has(st.to) });
      }
    }
    for (const g of GLOBAL_PAGES) out.push({ id: g.to, title: g.title, icon: g.icon, to: g.to, sub: g.kw, top: TOP.has(g.to) });
    out.push(
      { id: 'theme', title: theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن', icon: theme === 'dark' ? 'sun' : 'moon', sub: 'theme dark light مظهر', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'backup', title: 'خذ نسخة احتياطية الآن', icon: 'download', sub: 'backup now نسخة احتياطية', run: () => void api.backupNow().then((b) => toast(`تم إنشاء النسخة ${b.name}`, { kind: 'ok' })).catch((e: Error) => toast(e.message, { kind: 'error' })) },
      { id: 'scan', title: 'افحص مجلد المكتبة الآن', icon: 'refresh', sub: 'scan library فحص', run: () => void lib.scan().then(() => toast('بدأ فحص المكتبة', { kind: 'ok' })).catch((e: Error) => toast(e.message, { kind: 'error' })) },
      { id: 'notify', title: 'إعدادات الإشعارات والمظهر', icon: 'bell', to: '/settings#appearance', sub: 'notifications accent لون تنبيه' },
      { id: 'keys', title: 'اختصارات لوحة المفاتيح', icon: 'hash', run: () => setShowShortcuts(true), sub: 'shortcuts' },
    );
    return out;
  }, [theme, setTheme, setShowShortcuts, pctx, openCreate, toast]);

  const nq = normalizeText(q);
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const cm = (nq ? cmds.filter((c) => { const h = normalizeText(`${c.title} ${c.sub ?? ''}`); return nq.split(/\s+/).every((t) => h.includes(t)); }).sort((a, b) => Number(!!b.run || b.id.startsWith('new-')) - Number(!!a.run || a.id.startsWith('new-'))) : cmds.filter((c) => c.top)).slice(0, nq ? 8 : 8);
    cm.forEach((c) => out.push({ key: `c-${c.id}`, group: nq ? (c.id.startsWith('new-') || c.run ? 'افعل' : 'اذهب إلى') : 'اذهب إلى', title: c.title, icon: c.icon, ...(c.to ? { to: c.to } : {}), ...(c.run ? { run: c.run } : {}) }));
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
