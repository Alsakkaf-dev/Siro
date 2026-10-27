import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Card, CardHead, EmptyState, Skeleton } from '../ui/ui.js';
import { wos, type AgendaEntry, type Space } from '../lib/wos.js';
import { localToday, addDays } from '../widgets/agenda.js';
import { Icon } from '../lib/icons.js';

/** لوحة التقدّم: نسب الإنجاز عبر الدراسة وكل المساحات + ما أُنجز هذا الأسبوع (Asana Goals/Portfolios مبسّطة). */
export default function ReviewProgress() {
  const [d, setD] = useState<{ spaces: Space[]; entries: AgendaEntry[] } | null>(null);
  useEffect(() => void wos.everything().then(setD).catch(() => setD({ spaces: [], entries: [] })), []);
  const today = localToday();
  if (!d) return <div className="page"><PageHead title="لوحة التقدّم" icon="chart" /><Skeleton h={200} r={20} /></div>;
  const study = d.entries.filter((e) => e.kind === 'assessment');
  const rows: { key: string; label: string; to: string; color: string; total: number; done: number; overdue: number; next: number; icon: string }[] = [
    { key: 'study', label: 'الدراسة (كل التقييمات)', to: '/academic', color: 'var(--acad)', icon: 'calendar', total: study.length, done: study.filter((e) => e.done).length, overdue: study.filter((e) => !e.done && e.date && e.date < today).length, next: study.filter((e) => !e.done && e.date && e.date >= today && e.date <= addDays(today, 6)).length },
    ...d.spaces.map((s) => {
      const es = d.entries.filter((e) => e.space_id === s.id);
      return { key: s.id, label: s.name, to: `/spaces/${s.id}`, color: s.color, icon: s.icon, total: es.length, done: es.filter((e) => e.done).length, overdue: es.filter((e) => !e.done && e.date && e.date < today).length, next: es.filter((e) => !e.done && e.date && e.date >= today && e.date <= addDays(today, 6)).length };
    }),
  ];
  const totalDone = rows.reduce((s, r) => s + r.done, 0);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  const weightDone = study.filter((e) => e.done).reduce((s, e) => s + (e.weight ?? 0), 0);
  return (
    <div className="page">
      <PageHead title="لوحة التقدّم" icon="chart" sub="أين وصلت في كل شيء — بلا تخمين: المنجز هو ما علّمته منجزًا، والمتأخر ما تجاوز موعده المعروف." />
      <div className="kpis">
        <div className="wkpi card"><span className="muted small">المنجز الكلي</span><b className="num">{totalAll ? Math.round((totalDone / totalAll) * 100) : 0}%</b><small className="muted">{totalDone} من {totalAll}</small></div>
        <div className="wkpi card"><span className="muted small">أوزان التقييمات المسلّمة</span><b className="num">{Math.round(weightDone)}%</b><small className="muted">مجموع أوزان ما سُلّم (عبر كل المواد والفصول)</small></div>
        <div className="wkpi card"><span className="muted small">متأخر</span><b className="num">{rows.reduce((s, r) => s + r.overdue, 0)}</b><small className="muted"><Link to="/everything?horizon=overdue">راجعها</Link></small></div>
        <div className="wkpi card"><span className="muted small">مستحق خلال 7 أيام</span><b className="num">{rows.reduce((s, r) => s + r.next, 0)}</b><small className="muted"><Link to="/week">هذا الأسبوع</Link></small></div>
      </div>
      <Card>
        <CardHead title="حسب المصدر" icon="layers" />
        {rows.length ? (
          <ul className="plain prog-rows">
            {rows.map((r) => {
              const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
              return (
                <li key={r.key} style={{ '--c': r.color } as never}>
                  <Link to={r.to}><Icon name={r.icon as 'layers'} size={16} /> <bdi>{r.label}</bdi></Link>
                  <span className="prog wide" role="img" aria-label={`${pct}% منجز`}><i style={{ width: `${pct}%`, background: r.color }} /></span>
                  <span className="num small">{r.done}/{r.total}</span>
                  {r.overdue > 0 && <span className="badge danger">{r.overdue} متأخر</span>}
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title="لا بيانات بعد" />}
      </Card>
    </div>
  );
}
