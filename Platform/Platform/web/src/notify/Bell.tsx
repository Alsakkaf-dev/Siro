import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { useInbox } from '../core/inbox.js';
import { cx } from '../ui/ui.js';
import { daysLeftText, notifiable, type DeadlineAlert } from '../../../shared/review.js';
import { getNotifyEnabled, markFired, notifyPermission, wasFired } from './prefs.js';

/** جرس المواعيد (من الوارد core/inbox): يعرض المواعيد خلال 7 أيام للفصل النشط (والفائتة المفتوحة)، ويُطلق إشعار المتصفح مرة واحدة فقط للتي لها تاريخ محدد (اليوم/غدًا) إن فعّله المستخدم. */
export function DeadlineBell() {
  const { bundle, alerts, urgent } = useInbox();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // تفعيل الإشعارات من الإعدادات يُطلق platform-notify فنعيد الفحص فورًا
  const [pn, setPn] = useState(0);
  useEffect(() => {
    const on = (): void => setPn((x) => x + 1);
    window.addEventListener('platform-notify', on);
    return () => window.removeEventListener('platform-notify', on);
  }, []);

  useEffect(() => {
    if (!getNotifyEnabled() || notifyPermission() !== 'granted') return;
    for (const a of alerts.filter(notifiable)) {
      const key = `${a.id}:${a.dueDate}:${a.daysLeft}`;
      if (wasFired(key)) continue;
      markFired(key);
      try {
        const n = new Notification(`${a.daysLeft === 0 ? 'اليوم' : 'غدًا'}: ${a.title}`, { body: `${a.course}${a.dueTime ? ` · ${a.dueTime}` : ''} · الوزن ${a.weight}%`, tag: key, lang: 'ar', dir: 'rtl' });
        n.onclick = () => window.focus();
      } catch {
        /* بعض البيئات تمنع الإنشاء المباشر */
      }
    }
  }, [alerts, pn]);

  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', d);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', d);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  useEffect(() => setOpen(false), [loc.pathname]);

  const base = bundle ? `/academic/s/${bundle.semester.id}` : '/academic';
  const row = (a: DeadlineAlert): ReactElement => (
    <li key={a.id}>
      <Link to={`${base}/courses/${bundle?.courses.find((c) => c.code === a.course)?.id ?? ''}#a-${a.id}`} className={cx('bell-row', a.overdue && 'late')}>
        <i className="dot" style={{ background: a.color }} />
        <span><bdi>{a.title}</bdi><small><bdi>{a.course}</bdi> · {daysLeftText(a)}{a.dueTime ? ` · ${a.dueTime}` : ''}</small></span>
      </Link>
    </li>
  );

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn bell" aria-label={urgent ? `المواعيد القريبة (${urgent})` : 'المواعيد القريبة'} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" size={18} />
        {urgent > 0 && <span className="bell-n" aria-hidden="true">{urgent}</span>}
      </button>
      {open && (
        <div className="menu bell-pop" role="region" aria-label="المواعيد القريبة">
          <div className="hit-group">خلال 7 أيام</div>
          {alerts.length === 0 ? (
            <p className="muted" style={{ padding: 'var(--s-3)', margin: 0 }}>{bundle ? 'لا مواعيد محددة قريبة. التقييمات بلا تاريخ لا تظهر هنا حتى تُحدَّد.' : 'جارٍ التحميل…'}</p>
          ) : (
            <ul className="plain">{alerts.slice(0, 8).map(row)}</ul>
          )}
          <div className="sep" />
          <Link to={`${base}/timeline`}>التقييمات والمواعيد <Icon name="left" size={14} /></Link>
          <Link to="/settings#notify">إعدادات الإشعارات <Icon name="bell" size={14} /></Link>
        </div>
      )}
    </div>
  );
}
