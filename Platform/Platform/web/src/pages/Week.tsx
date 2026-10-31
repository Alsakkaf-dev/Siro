import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../core/app-context.js';
import { PageHead } from '../ui/page.js';
import { Button, Card, IconButton, Skeleton, cx } from '../ui/ui.js';
import { AgendaList, addDays, dayMs, localToday } from '../widgets/agenda.js';
import { wos, type Agenda } from '../lib/wos.js';
import { fmtDateShort, fmtWeekday } from '../lib/format.js';

/** هذا الأسبوع: 7 أيام من كل الخطوط (تقييمات + عناصر + تماريني) — أفق «الأسبوع» كأفق تنقّل أساسي. */
export default function Week() {
  const { openCreate } = useApp();
  const today = localToday();
  const [start, setStart] = useState(today);
  const [ag, setAg] = useState<Agenda | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    wos.agenda(start, addDays(start, 6)).then((a) => { setAg(a); setErr(null); }).catch((e: Error) => setErr(e.message));
  }, [start]);
  useEffect(() => {
    setAg(null);
    load();
    const on = (): void => load();
    window.addEventListener('platform:items-changed', on);
    window.addEventListener('platform:sem-changed', on);
    return () => {
      window.removeEventListener('platform:items-changed', on);
      window.removeEventListener('platform:sem-changed', on);
    };
  }, [load]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const total = ag?.range.filter((e) => e.kind !== 'workout' && !e.done).length ?? 0;
  return (
    <div className="page">
      <PageHead
        title="هذا الأسبوع"
        icon="calendar"
        sub={<>{fmtDateShort(dayMs(days[0]!))} – {fmtDateShort(dayMs(days[6]!))}{ag ? ` · ${total} بندًا مفتوحًا` : ''}</>}
        actions={
          <div className="row" style={{ gap: 6 }}>
            <IconButton icon="right" label="الأسبوع السابق" onClick={() => setStart(addDays(start, -7))} />
            <Button size="sm" onClick={() => setStart(today)} disabled={start === today}>اليوم</Button>
            <IconButton icon="left" label="الأسبوع التالي" onClick={() => setStart(addDays(start, 7))} />
          </div>
        }
      />
      {err && <div className="callout warn" role="alert">{err}</div>}
      {ag && ag.overdue.length > 0 && start === today && (
        <Card className="stack" style={{ marginBlockEnd: 'var(--s-4)' }}>
          <h2 className="h3 late-h">متأخرة ({ag.overdue.length})</h2>
          <AgendaList entries={ag.overdue} today={today} onChanged={load} />
        </Card>
      )}
      <div className="wk-grid">
        {days.map((d) => {
          const list = ag?.range.filter((e) => e.date === d) ?? [];
          return (
            <Card key={d} className={cx('week-day', d === today && 'is-today')}>
              <div className="wd-head">
                <h2 className="h3"><span>{fmtWeekday(dayMs(d))}</span> <small className="muted num">{fmtDateShort(dayMs(d))}</small></h2>
                <IconButton icon="plus" sm ghost label={`إضافة عنصر ليوم ${fmtWeekday(dayMs(d))}`} onClick={() => openCreate({ kind: 'quick-item', due: d })} />
              </div>
              {!ag ? <Skeleton h={14} /> : <AgendaList entries={list} today={today} onChanged={load} empty="—" compact />}
            </Card>
          );
        })}
      </div>
      {ag && ag.undated > 0 && <p className="muted" style={{ marginBlockStart: 'var(--s-4)' }}>{ag.undated} بندًا بلا موعد معروف لا تظهر في الأيام — تجدها في «كل شيء».</p>}
    </div>
  );
}
