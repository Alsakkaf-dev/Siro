import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api.js';
import { useApp } from './app-context.js';
import { deadlineAlerts, unknownTotal, type DeadlineAlert } from '../../../shared/review.js';
import { todayMs } from '../../../shared/semester.js';
import type { SemesterBundle } from '../../../shared/types.js';

/** الوارد الواحد: حزمة الفصل النشط + تنبيهات المواعيد + «غير المعروف». يستهلكه الجرس و«اليوم». */
export interface Inbox {
  bundle: SemesterBundle | null;
  alerts: DeadlineAlert[];
  /** متأخر أو خلال يومين (المحدد بتاريخ أو امتحان) */
  urgent: number;
  /** null = لم يُحمَّل بعد */
  unknown: number | null;
  error: boolean;
  refresh: () => void;
}
const C = createContext<Inbox | null>(null);
export function useInbox(): Inbox {
  const c = useContext(C);
  if (!c) throw new Error('InboxProvider مفقود');
  return c;
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const { activeId, setUnknownCount } = useApp();
  const [bundle, setBundle] = useState<SemesterBundle | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    if (!activeId || document.hidden) return;
    api
      .bundle(activeId)
      .then((b) => {
        setBundle(b);
        setError(false);
      })
      .catch(() => setError(true));
  }, [activeId]);

  // صفحات الفصل تُعلن حزمتها (platform:bundle)؛ «اليوم» يحتاجها فورًا، وغيره بعد أول رسم بوقت كافٍ
  useEffect(() => {
    setBundle((b) => (b && b.semester.id === activeId ? b : null));
    if (!activeId) return;
    let have = false;
    const on = (e: Event): void => {
      const b = (e as CustomEvent<SemesterBundle>).detail;
      if (b.semester.id === activeId) {
        have = true;
        setBundle(b);
        setError(false);
      }
    };
    window.addEventListener('platform:bundle', on);
    const t = window.setTimeout(() => {
      if (!have) load();
    }, location.pathname === '/' ? 0 : 3500);
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
      if (!document.hidden) {
        setTick((x) => x + 1);
        load();
      }
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [load]);

  const alerts = useMemo(() => (bundle ? deadlineAlerts(bundle.assessments, bundle.courses, bundle.semester, todayMs()) : []), [bundle, tick]);
  const unknown = bundle ? unknownTotal(bundle) : null;
  useEffect(() => {
    if (bundle && unknown !== null) setUnknownCount(bundle.semester.id, unknown);
  }, [bundle, unknown, setUnknownCount]);

  const value = useMemo<Inbox>(
    () => ({ bundle, alerts, urgent: alerts.filter((a) => a.kind !== 'week' && (a.overdue || (a.daysLeft ?? 9) <= 2)).length, unknown, error, refresh: load }),
    [bundle, alerts, unknown, error, load],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
