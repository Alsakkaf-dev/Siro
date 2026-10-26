import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../lib/icons.js';

export function PageHead({ title, icon, sub, crumbs, actions, badge }: { title: ReactNode; icon?: IconName; sub?: ReactNode; crumbs?: { to?: string; label: string }[]; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {crumbs && (
          <nav className="crumbs" aria-label="مسار التنقل">
            {crumbs.map((c, i) => (
              <span key={i} className="row" style={{ gap: 6 }}>
                {c.to ? <Link to={c.to}><bdi>{c.label}</bdi></Link> : <bdi>{c.label}</bdi>}
                {i < crumbs.length - 1 && <Icon name="left" size={12} />}
              </span>
            ))}
          </nav>
        )}
        <h1>
          {icon && <span className="h-ico"><Icon name={icon} size={22} /></span>}
          {title}
          {badge}
        </h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
