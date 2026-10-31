import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, CardHead, Skeleton } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { flagEnabled } from '../core/flags.js';
import { LAW, evaluateDay } from '../../../shared/kitchen/law.js';
import { fmtKcal } from '../../../shared/kitchen/fmt.js';
import { todayKL } from '../../../shared/calendar/tz.js';

interface Slot { slot: string; title_ar: string; nutrition: Record<string, number> }
interface Day { date: string; slots: Slot[]; total_kcal: number; status: string }

/** «وجبات اليوم + حالة القانون» في «اليوم». مصدرها خطة الوجبات في المنصة؛ تختفي إن غابت (المطبخ مغلق أو الخادم لا يردّ). */
export function MealsToday() {
  const [day, setDay] = useState<Day | null | 'none' | 'gone'>(null);
  const date = todayKL();
  useEffect(() => {
    if (!flagEnabled('kitchen.enabled')) { setDay('gone'); return; }
    let live = true;
    fetch(`/api/kitchen/plan?from=${date}&days=1`)
      .then((r) => (r.ok ? (r.json() as Promise<{ days: Day[] }>) : Promise.reject(new Error('x'))))
      .then((j) => live && setDay(j.days[0] ?? 'none'))
      .catch(() => live && setDay('gone'));
    return () => { live = false; };
  }, [date]);
  if (day === 'gone') return null;
  if (day === null) return <Card><Skeleton h={90} /></Card>;
  if (day === 'none') {
    return (
      <Card className="today-meals">
        <CardHead title="وجبات اليوم" icon="utensils"><Link to={`/calendar/meals?date=${date}`} className="btn sm ghost">خطّط اليوم</Link></CardHead>
        <p className="muted">لا وجبات مخطّطة اليوم. المجال المسموح <span className="num" dir="ltr">{LAW.MIN}–{LAW.MAX}</span> سعرة.</p>
      </Card>
    );
  }
  const law = evaluateDay(Object.fromEntries(day.slots.map((s) => [s.slot, { kcal: s.nutrition['kcal'] ?? 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }])));
  const text = law.status === 'VALID' ? 'داخل الحدود' : law.status === 'PARTIAL' ? 'غير مكتمل' : law.status === 'INVALID_HIGH' ? `أعلى بـ${fmtKcal(law.excess ?? 0)}` : `أقل بـ${fmtKcal(law.deficit ?? 0)}`;
  return (
    <Card className="today-meals">
      <CardHead title="وجبات اليوم" icon="utensils"><Link to={`/calendar/meals?date=${date}`} className="btn sm ghost">الوجبات</Link></CardHead>
      <ul className="plain" data-testid="today-meals">
        {day.slots.map((s) => <li key={s.slot}><b>{s.slot}</b>: <bdi>{s.title_ar}</bdi> <span className="muted num" dir="ltr">· {fmtKcal(s.nutrition['kcal'] ?? 0)} سعرة</span></li>)}
      </ul>
      <p data-testid="today-law">المجموع <b className="num" dir="ltr">{fmtKcal(law.total_kcal)}</b> سعرة · <Badge tone={law.status === 'VALID' ? 'ok' : law.status === 'PARTIAL' ? 'warn' : 'danger'}><Icon name={law.status === 'VALID' ? 'check' : law.status === 'PARTIAL' ? 'info' : 'warn'} size={12} /> {text}</Badge> <small className="muted">المجال <span className="num" dir="ltr">{LAW.MIN}–{LAW.MAX}</span></small></p>
    </Card>
  );
}
