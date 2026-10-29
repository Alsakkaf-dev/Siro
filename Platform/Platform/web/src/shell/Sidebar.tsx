import { Link } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, hrefFor, sidebarPages, type AreaId, type PageDef } from '../core/registry.js';
import { APP_NAME } from '../../../shared/constants.js';
import { cx } from '../ui/ui.js';

/** القائمة الجانبية الواحدة: كل الأقسام، والقسم النشط مفتوح. العنصر النشط واحد فقط (owner). */
export function Sidebar({ open, inert, semId, activeArea, owner, onShortcuts }: { open: boolean; inert: boolean; semId: string | null; activeArea: AreaId | null; owner: PageDef | null; onShortcuts: () => void }) {
  const { unknownCounts } = useApp();
  // القسم المخفي بعلم يظهر فقط حين تكون فيه (رابط مباشر) كي لا تضيع
  const areas = AREAS.filter((a) => !a.flag || flagEnabled(a.flag) || a.id === activeArea);
  return (
    <aside id="sidebar" className={cx('sidebar', open && 'open')} aria-label="القائمة الجانبية" inert={inert}>
      <Link to="/" className="brand">
        <span className="brand-mark"><Icon name="sparkle" size={20} /></span>
        <span>{APP_NAME}</span>
      </Link>
      <nav aria-label="التنقل">
        {areas.map((a) => {
          const on = a.id === activeArea;
          const items = sidebarPages(a.id).filter((p) => (!p.flag || flagEnabled(p.flag) || p.id === owner?.id) && (!p.needsSemester || semId));
          return (
            <div key={a.id} className={cx('nav-sec', on && 'open')}>
              <Link to={hrefFor(a.entry, semId)} className={cx('nav-link', 'nav-area', on && 'on')}>
                <Icon name={a.icon} size={18} />
                <span>{a.label}</span>
                <span className="kbd-hint" dir="ltr">g {a.kbd}</span>
              </Link>
              {on && (
                <div className="nav-items">
                  {items.map((p) => {
                    const badge = p.id === 'unknowns' && semId ? unknownCounts[semId] : undefined;
                    return (
                      <Link key={p.id} to={hrefFor(p.id, semId)} className="nav-link" aria-current={owner?.id === p.id ? 'page' : undefined}>
                        <Icon name={p.icon} size={17} />
                        <span>{p.label}</span>
                        {badge ? <span className="badge warn" style={{ marginInlineStart: 'auto' }} title="غير المعروف">{badge}</span> : p.kbd ? <span className="kbd-hint" dir="ltr">g {p.kbd}</span> : null}
                      </Link>
                    );
                  })}
                  {a.id === 'system' && (
                    <button type="button" className="nav-link" onClick={onShortcuts}>
                      <Icon name="hash" size={17} />
                      <span>اختصارات لوحة المفاتيح</span>
                      <span className="kbd-hint" dir="ltr">?</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="side-card">
        <h4><Icon name="lock" size={15} /> بياناتك عندك فقط</h4>
        <p>كل شيء محفوظ على جهازك في ملف واحد. لا إنترنت ولا حسابات ولا تتبّع.</p>
        <Link to="/settings" className="btn sm">النسخ الاحتياطي</Link>
      </div>
    </aside>
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
