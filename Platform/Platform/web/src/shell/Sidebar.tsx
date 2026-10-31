import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, AREA_BY_ID, hrefFor, sidebarPages, type AreaId, type PageDef } from '../core/registry.js';
import { APP_NAME } from '../../../shared/constants.js';
import { cx } from '../ui/ui.js';
import { useBarFade } from '../core/hscroll.js';

/** القائمة الجانبية: الأقسام الثمانية فقط، بلا انسدال. صفحات كل قسم في شريطه الأفقي (AreaBar) أعلى الصفحة. */
export function Sidebar({ open, inert, semId, activeArea }: { open: boolean; inert: boolean; semId: string | null; activeArea: AreaId | null }) {
  // القسم المخفي بعلم يظهر فقط حين تكون فيه (رابط مباشر) كي لا تضيع
  const areas = AREAS.filter((a) => !a.flag || flagEnabled(a.flag) || a.id === activeArea);
  return (
    <aside id="sidebar" className={cx('sidebar', open && 'open')} aria-label="القائمة الجانبية" inert={inert}>
      <Link to="/" className="brand">
        <span className="brand-mark"><Icon name="sparkle" size={20} /></span>
        <span>{APP_NAME}</span>
      </Link>
      <nav aria-label="الأقسام">
        {areas.map((a) => (
          <Link key={a.id} to={hrefFor(a.entry, semId)} className="nav-link nav-area" aria-current={a.id === activeArea ? 'page' : undefined}>
            <Icon name={a.icon} size={18} />
            <span>{a.label}</span>
            <span className="kbd-hint" dir="ltr">g {a.kbd}</span>
          </Link>
        ))}
      </nav>
      <div className="side-card">
        <h4><Icon name="lock" size={15} /> بياناتك عندك فقط</h4>
        <p>كل شيء محفوظ على جهازك في ملف واحد. لا إنترنت ولا حسابات ولا تتبّع.</p>
        <Link to="/settings" className="btn sm">النسخ الاحتياطي</Link>
      </div>
    </aside>
  );
}

/** شريط القسم الأفقي: كل صفحات القسم النشط في مكان واحد أعلى المحتوى (يحل محل القوائم المنسدلة والتبويبات المكررة). */
export function AreaBar({ semId, activeArea, owner, onShortcuts }: { semId: string | null; activeArea: AreaId | null; owner: PageDef | null; onShortcuts: () => void }) {
  const { unknownCounts } = useApp();
  const ref = useRef<HTMLElement>(null);
  useBarFade(ref, `${activeArea}:${owner?.id ?? ''}:${semId ?? ''}`);
  if (!activeArea) return null;
  const items = sidebarPages(activeArea).filter((p) => (!p.flag || flagEnabled(p.flag) || p.id === owner?.id) && (!p.needsSemester || semId));
  const system = activeArea === 'system';
  if (items.length + (system ? 1 : 0) < 2) return null;
  const area = AREA_BY_ID.get(activeArea)!;
  return (
    <nav ref={ref} className="area-bar hscroll" aria-label={`صفحات ${area.label}`}>
      {items.map((p) => {
        const badge = p.id === 'unknowns' && semId ? unknownCounts[semId] : undefined;
        return (
          <Link key={p.id} to={hrefFor(p.id, semId)} className="area-tab" aria-current={owner?.id === p.id ? 'page' : undefined} title={p.kbd ? `g ${p.kbd}` : undefined}>
            <Icon name={p.icon} size={16} />
            <span>{p.label}</span>
            {badge ? <span className="badge warn" title="غير المعروف">{badge}</span> : null}
          </Link>
        );
      })}
      {system && (
        <button type="button" className="area-tab" onClick={onShortcuts} title="؟">
          <Icon name="hash" size={16} />
          <span>اختصارات لوحة المفاتيح</span>
        </button>
      )}
    </nav>
  );
}

/** الشريط السفلي للجوال (≤960): أقسام mobile + «المزيد» يفتح الدرج الكامل. */
export function BottomBar({ semId, activeArea, onMore, moreOpen }: { semId: string | null; activeArea: AreaId | null; onMore: () => void; moreOpen: boolean }) {
  const items = AREAS.filter((a) => a.mobile && (!a.flag || flagEnabled(a.flag)));
  const inMore = activeArea !== null && !items.some((a) => a.id === activeArea);
  return (
    <nav className="bottom-bar" aria-label="التنقل السريع">
      {items.map((a) => (
        <Link key={a.id} to={hrefFor(a.entry, semId)} className={cx('bb-item', a.id === activeArea && 'on')} aria-current={a.id === activeArea ? 'true' : undefined}>
          <Icon name={a.id === 'home' ? 'sparkle' : a.icon} size={20} />
          <span>{a.id === 'home' ? 'اليوم' : a.label}</span>
        </Link>
      ))}
      <button type="button" className={cx('bb-item', inMore && 'on')} aria-expanded={moreOpen} aria-controls="sidebar" onClick={onMore}>
        <Icon name="menu" size={20} />
        <span>المزيد</span>
      </button>
    </nav>
  );
}
