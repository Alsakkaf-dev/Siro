import { useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { useBarFade } from '../core/hscroll.js';
import { PAGE_BY_ID, crumbsFor, hrefFor, matchPage, resolvePath, subTabsFor } from '../core/registry.js';

/** وصف أطول من هذا الحد يُعدّ شرحًا فيصير أيقونة ⓘ؛ الأقصر (تاريخ، عدّاد) يبقى ظاهرًا */
const LONG_SUB = 56;

/** رأس الصفحة: فتات الخبز افتراضيًا من السجل (ما لم تُمرَّر صراحة للصفحات الديناميكية)، وتبويبات tabGroup تلقائيًا. */
export function PageHead({ title, icon, sub, crumbs, actions, badge }: { title: ReactNode; icon?: IconName; sub?: ReactNode; crumbs?: { to?: string; label: string }[]; actions?: ReactNode; badge?: ReactNode }) {
  const loc = useLocation();
  const { activeId } = useApp();
  const m = matchPage(loc.pathname);
  const params = m?.params ?? {};
  const semId = params['semId'] ?? activeId;
  const auto = m ? crumbsFor(m.page) : [];
  const list = crumbs ?? (auto.length > 1 ? auto.map((c, i) => ({ label: c.label, ...(i < auto.length - 1 ? { to: c.areaEntry ? hrefFor(c.id, semId) : (resolvePath(PAGE_BY_ID.get(c.id)!, { ...params, semId }) ?? hrefFor(c.id, semId)) } : {}) })) : undefined);
  const tabs = m ? subTabsFor(m.page) : [];
  const tabsRef = useRef<HTMLElement>(null);
  useBarFade(tabsRef, `${m?.page.id ?? ''}:${tabs.length}`);
  return (
    <header className="page-head">
      <div>
        {list && (
          <nav className="crumbs" aria-label="مسار التنقل">
            {list.map((c, i) => (
              <span key={i} className="row" style={{ gap: 6 }}>
                {c.to ? <Link to={c.to}><bdi>{c.label}</bdi></Link> : <bdi>{c.label}</bdi>}
                {i < list.length - 1 && <Icon name="left" size={12} />}
              </span>
            ))}
          </nav>
        )}
        <h1>
          {icon && <span className="h-ico"><Icon name={icon} size={22} /></span>}
          {title}
          {badge}
          {typeof sub === 'string' && sub.length > LONG_SUB && <span className="h-info" tabIndex={0} role="note" aria-label={sub} data-tip={sub}><Icon name="info" size={16} /></span>}
        </h1>
        {sub && (typeof sub !== 'string' || sub.length <= LONG_SUB) && <p>{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
      {tabs.length > 1 && (
        <nav ref={tabsRef} className="tabs page-tabs hscroll" aria-label="عروض الصفحة">
          {tabs.map((t) => {
            const to = resolvePath(t, { ...params, semId });
            return to ? (
              <Link key={t.id} to={to} className="tab" aria-current={t.id === m?.page.id ? 'page' : undefined}>
                <Icon name={t.icon} size={15} /> {t.tabLabel ?? t.label}
              </Link>
            ) : null;
          })}
        </nav>
      )}
    </header>
  );
}
