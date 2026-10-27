import { useEffect, type ReactNode } from 'react';
import { Icon, type IconName } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';

/** رأس الصفحة: العنوان + الوصف + الأفعال. مسار التنقل (crumbs) يُعلَن للإطار الذي يرسمه مرة واحدة أعلى كل صفحة
 *  مع شارة الخط — كي يكون في نفس المكان دائمًا (docs/design/NAVIGATION_SPEC.md). */
export function PageHead({ title, icon, sub, crumbs, actions, badge }: { title: ReactNode; icon?: IconName; sub?: ReactNode; crumbs?: { to?: string; label: string }[]; actions?: ReactNode; badge?: ReactNode }) {
  const { setCrumbs } = useApp();
  const key = crumbs ? JSON.stringify(crumbs) : '';
  useEffect(() => {
    setCrumbs(key ? (JSON.parse(key) as { to?: string; label: string }[]) : null);
    return () => setCrumbs(null);
  }, [key, setCrumbs]);
  return (
    <header className="page-head">
      <div>
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
