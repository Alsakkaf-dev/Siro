import { useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, AREA_BY_ID, hrefFor, sidebarPages, type AreaId, type PageDef } from '../core/registry.js';
import { APP_NAME } from '../../../shared/constants.js';
import { cx } from '../ui/ui.js';
import { useBarFade } from '../core/hscroll.js';

/** القائمة الجانبية: شريط أيقونات مضغوط (56px) للأقسام الثمانية. لا يتوسّع عند المرور؛ العنصر الممرَّر عليه وحده يُظهر تلميحه.
 *  في الجوال (≤960) يصير الدرج بأسماء كاملة. صفحات كل قسم في شريطه الأفقي (AreaBar). */
export function Sidebar({ open, inert, semId, activeArea }: { open: boolean; inert: boolean; semId: string | null; activeArea: AreaId | null }) {
  // القسم المخفي بعلم يظهر فقط حين تكون فيه (رابط مباشر) كي لا تضيع
  const areas = AREAS.filter((a) => !a.flag || flagEnabled(a.flag) || a.id === activeArea);
  const idx = areas.findIndex((a) => a.id === activeArea);
  return (
    <aside id="sidebar" className={cx('sidebar', open && 'open')} aria-label="القائمة الجانبية" inert={inert}>
      <Link to="/" className="rail-item brand" aria-label={APP_NAME}>
        <span className="brand-mark"><Icon name="sparkle" size={18} /></span>
        <span className="rail-label">{APP_NAME}</span>
        <span className="rail-tip" aria-hidden="true"><span>{APP_NAME}</span></span>
      </Link>
      <nav aria-label="الأقسام" className="rail-nav" style={{ '--i': idx } as CSSProperties}>
        <i className="rail-ind" aria-hidden="true" data-on={idx >= 0 || undefined} />
        {areas.map((a) => (
          <Link key={a.id} to={hrefFor(a.entry, semId)} className="rail-item" aria-current={a.id === activeArea ? 'page' : undefined}>
            <Icon name={a.icon} size={19} />
            <span className="rail-label">{a.label}</span>
            <span className="kbd-hint" dir="ltr" aria-hidden="true">g {a.kbd}</span>
            <span className="rail-tip" aria-hidden="true"><span>{a.label}</span><kbd dir="ltr">g {a.kbd}</kbd></span>
          </Link>
        ))}
      </nav>
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
