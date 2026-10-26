import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { useApp } from '../core/app-context.js';
import { cx } from '../ui/ui.js';
import { daysLeftText, deadlineAlerts, notifiable, type DeadlineAlert } from '../../../shared/review.js';
import { todayMs } from '../../../shared/semester.js';
import type { SemesterBundle } from '../../../shared/types.js';
import { getNotifyEnabled, markFired, notifyPermission, wasFired } from './prefs.js';

/** جرس المواعيد: يعرض المواعيد خلال 7 أيام للفصل النشط (والفائتة المفتوحة)، ويُطلق إشعار المتصفح مرة واحدة فقط للتي لها تاريخ محدد (اليوم/غدًا) إن فعّله المستخدم. */
export function DeadlineBell() {
  const { activeId } = useApp();
  const loc = useLocation();
  const [bundle, setBundle] = useState<SemesterBundle | null>(null);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!activeId || document.hidden) return;
    api.bundle(activeId).then(setBundle).catch(() => undefined);
  }, [activeId]);

  // صفحات الفصل تُعلن حزمتها (platform:bundle) فلا نطلبها ثانية؛ في غيرها نجلبها بعد التحميل بوقت كافٍ (لا تنافس أول رسم)
  const have = useRef(false);
  useEffect(() => {
    have.current = false;
    const on = (e: Event): void => {
      const b = (e as CustomEvent<SemesterBundle>).detail;
      if (b.semester.id === activeId) {
        have.current = true;
        setBundle(b);
      }
    };
    window.addEventListener('platform:bundle', on);
    const t = window.setTimeout(() => {
      if (!have.current) load();
    }, 3500);
    return () => {
      window.removeEventListener('platform:bundle', on);
      window.clearTimeout(t);
    };
  }, [activeId, load]);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((x) => x + 1);
      load();
    }, 10 * 60_000);
    const vis = (): void => {
      if (!document.hidden) setTick((x) => x + 1);
    };
    const pn = (): void => setTick((x) => x + 1);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('platform-notify', pn);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('platform-notify', pn);
    };
  }, [load]);

  const alerts = useMemo(() => (bundle ? deadlineAlerts(bundle.assessments, bundle.courses, bundle.semester, todayMs()) : []), [bundle, tick]);

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
  }, [alerts]);

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

  const urgent = alerts.filter((a) => a.kind !== 'week' && (a.overdue || (a.daysLeft ?? 9) <= 2)).length;
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
          <Link to={`${base}/timeline`}>الجدول الزمني <Icon name="left" size={14} /></Link>
          <Link to="/settings#appearance">إعدادات الإشعارات <Icon name="bell" size={14} /></Link>
        </div>
      )}
    </div>
  );
}
