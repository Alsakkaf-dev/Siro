import { useMemo } from 'react';
import { Button, Card, CardHead, EmptyState, Unknown } from '../ui/ui.js';
import { LegendRows, SegBar } from '../widgets/charts.js';
import { Conf, Kpi, LifePage, LineChart, Note, fmtDay, fmtDayFull, useLife } from '../life/lifeKit.js';
import { klDay, klToday } from '../../../shared/weekly.js';
import { PRAYER_AR, PRAYER_KEYS, type Prayers } from '../../../shared/life.js';
import { Term } from '../glossary/glossary.js';

const SYM: Record<string, [string, string]> = { in_time: ['✓', 'في وقتها'], late: ['~', 'متأخرة'], missed: ['✕', 'فاتت'], unknown: ['؟', 'غير معروف'] };
const COLORS = ['#4CC9F0', '#F2A93B', '#F97362', '#A78BFA', '#4ADE80'];

export default function LifePrayers() {
  const d = useLife(['prayers']);
  const p = d.get<Prayers>('prayers');
  return (
    <LifePage title="الصلاة" icon="clock" names={['prayers']} data={d} sub="سجل الحضور والقضاء كما صدّره راشد — قراءة فقط." actions={<Button icon="edit" to="/life/commands?type=log_prayer">سجّل صلاة</Button>}>
      {p && <Body p={p} />}
    </LifePage>
  );
}

function Body({ p }: { p: Prayers }) {
  const a = p.attendance;
  const q = p.qada;
  const today = klToday(Date.now());
  const asOfDay = q?.as_of ? klDay(q.as_of) : null;
  const doneTodayStale = asOfDay !== null && asOfDay !== today;
  const days = useMemo(() => [...(a?.days ?? [])].sort((x, y) => y.date.localeCompare(x.date)), [a]);
  const noToday = !days.some((x) => x.date === today);
  const rem = PRAYER_KEYS.map((k) => ({ k, n: q?.remaining?.[k]?.count ?? null }));
  const max = Math.max(1, ...rem.map((r) => r.n ?? 0));
  const hist = (q?.history ?? []).filter((h) => typeof h.total === 'number').map((h) => ({ t: Date.parse(`${h.date}T12:00:00+08:00`), v: h.total as number }));
  const t = a?.totals ?? {};
  return (
    <>
      {p.highest_priority_ar && <Note tone="warn">{p.highest_priority_ar}</Note>}
      <div className="kpis">
        <Kpi label="القضاء المتبقي" value={typeof q?.total_remaining === 'number' ? q.total_remaining : <Unknown />} sub={<>محسوب <Conf c={q?.confidence} /></>} tone="var(--life)" icon="clock" />
        <Kpi label="قُضي حتى الآن" value={typeof q?.done_total === 'number' ? q.done_total : <Unknown />} sub={doneTodayStale || typeof q?.done_today !== 'number' ? <>اليوم: غير معروف{doneTodayStale && typeof q?.done_today === 'number' ? ` (آخر قيمة ${q.done_today} كانت ليوم ${fmtDay(asOfDay!)})` : ''}</> : <>اليوم: {q.done_today} <Conf c={q?.done_confidence} /></>} />
        <Kpi label="أيام فيها سجل" value={days.length} sub={a?.totals_confidence ? <>الإجماليات <Conf c={a.totals_confidence} /></> : undefined} />
        <Kpi label="الأساس المعتمد" value={typeof q?.baseline?.total === 'number' ? q.baseline.total : <Unknown />} sub={q?.baseline?.date ? fmtDayFull(q.baseline.date) : undefined} />
      </div>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title={<><Term id="qada">القضاء</Term> المتبقي لكل صلاة</>} icon="layers">
            <Conf c={q?.confidence} />
          </CardHead>
          <LegendRows rows={rem.map((r, i) => ({ label: PRAYER_AR[r.k], value: r.n ?? 0, max, color: COLORS[i]!, right: r.n === null ? <Unknown /> : r.n }))} />
          {q?.rule_ar && <Note>{q.rule_ar}</Note>}
          {q?.pending_ar && <Note tone="warn">{q.pending_ar}</Note>}
        </Card>
        <Card>
          <CardHead title="إجمالي الحضور المسجّل" icon="check" />
          <SegBar segments={[{ label: 'في وقتها', value: t.in_time ?? 0, color: 'var(--ok)' }, { label: 'متأخرة', value: t.late ?? 0, color: 'var(--warn)' }, { label: 'فاتت', value: t.missed ?? 0, color: 'var(--danger)' }, { label: 'غير معروف', value: t.unknown ?? 0, color: '#8A92B2' }]} />
          {a?.coverage_note_ar && <Note>{a.coverage_note_ar}</Note>}
        </Card>
      </div>
      <Card>
        <CardHead title="حضور الأيام" icon="calendar" />
        {days.length ? (
          <div className="stack">
            <div className="pray-grid" role="table" aria-label="حضور الصلوات حسب اليوم">
              <div role="row" style={{ display: 'contents' }}>
                <span className="h" role="columnheader">اليوم</span>
                {PRAYER_KEYS.map((k) => (
                  <span key={k} className="h" role="columnheader">{PRAYER_AR[k]}</span>
                ))}
              </div>
              {noToday && (
                <div role="row" style={{ display: 'contents' }}>
                  <span role="rowheader"><bdi>{fmtDay(today)}</bdi> <small className="muted">اليوم</small></span>
                  {PRAYER_KEYS.map((k) => (
                    <span key={k} role="cell" className="pray-cell unknown" title={`${PRAYER_AR[k]}: غير معروف`}><span aria-hidden="true">؟</span><span className="sr-only">غير معروف</span></span>
                  ))}
                </div>
              )}
              {days.slice(0, 21).map((d) => (
                <div key={d.date} role="row" style={{ display: 'contents' }}>
                  <span role="rowheader"><bdi>{fmtDay(d.date)}</bdi> <Conf c={d.confidence} /></span>
                  {PRAYER_KEYS.map((k) => {
                    const s = String(d.status?.[k] ?? 'unknown');
                    const [sym, txt] = SYM[s] ?? SYM['unknown']!;
                    return (
                      <span key={k} role="cell" className={`pray-cell ${SYM[s] ? s : 'unknown'}`} title={`${PRAYER_AR[k]}: ${txt}`}>
                        <span aria-hidden="true">{sym}</span>
                        <span className="sr-only">{txt}</span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="legend">
              {Object.entries(SYM).map(([k, [s, t2]]) => (
                <span key={k}><b className={`pray-cell ${k}`} style={{ inlineSize: 24, blockSize: 24, display: 'inline-grid' }}>{s}</b> {t2}</span>
              ))}
            </div>
            <Note>«غير معروف» ليس «فاتت»: اليوم الذي لم يُسجَّل لا نحسبه تقصيرًا.</Note>
            {days.some((x) => x.note_ar) && (
              <ul className="life-list">
                {days.filter((x) => x.note_ar).map((x) => (
                  <li key={x.date}><bdi>{fmtDayFull(x.date)}</bdi>: {x.note_ar}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <EmptyState icon="calendar" title="لا أيام مسجّلة" text="لم يُصدِّر راشد سجل حضور بعد." />
        )}
      </Card>
      <Card>
        <CardHead title="تطوّر إجمالي القضاء" icon="chart" />
        {hist.length >= 2 ? <LineChart ariaLabel="إجمالي القضاء عبر الزمن" fmt={(v) => String(Math.round(v))} series={[{ key: 'total', name: 'المتبقي', color: 'var(--life)', points: hist }]} /> : <p className="muted">يلزم تسجيلان على الأقل في history لرسم المنحنى{hist.length === 1 ? ' (يوجد واحد)' : ''}.</p>}
      </Card>
    </>
  );
}
