import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Card, CardHead, EmptyState, Segmented, Switch, Unknown, cx } from '../ui/ui.js';
import { AreaLine, Scatter, type ScatterPt } from '../widgets/charts.js';
import { DeadlineRow } from '../widgets/tiles.js';
import { VirtualList } from '../widgets/catalog.js';
import { KIND_COLOR, KIND_LABEL } from '../../../shared/constants.js';
import { assessmentColumn, weekStartMs } from '../../../shared/semester.js';
import type { Assessment, Kind } from '../../../shared/types.js';
import { fmtDateShort, fmtNum, weekRangeLabel, whenText } from '../lib/format.js';

type View = 'heat' | 'gantt' | 'scatter' | 'area';

export default function Timeline() {
  const S = useSem();
  const { sem, courses, assessments, phase, loads } = S;
  const base = `/academic/s/${sem.id}`;
  const [view, setView] = useState<View>('heat');
  const [filter, setFilter] = useState<Set<string>>(new Set());
  const [showUnknown, setShowUnknown] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [cell, setCell] = useState<{ courseId: string | null; col: number } | null>(null);

  const shownCourses = courses.filter((c) => filter.size === 0 || filter.has(c.id));
  const items = useMemo(() => assessments.filter((a) => (filter.size === 0 || filter.has(a.course_id)) && (!onlyOpen || (a.status !== 'graded' && a.status !== 'submitted'))), [assessments, filter, onlyOpen]);
  const colOf = useMemo(() => new Map(items.map((a) => [a.id, assessmentColumn(a, sem)])), [items, sem]);
  const W = sem.weeks;
  const cols = Array.from({ length: W + 1 }, (_, i) => i + 1); // 1..W, W+1 = فترة الامتحانات
  const unknownCol = 0;

  // grid[courseId][col] = {w, list}
  const grid = useMemo(() => {
    const m = new Map<string, Map<number, Assessment[]>>();
    for (const c of courses) m.set(c.id, new Map());
    for (const a of items) {
      const col = colOf.get(a.id) ?? 0;
      const row = m.get(a.course_id);
      if (row) row.set(col, [...(row.get(col) ?? []), a]);
    }
    return m;
  }, [items, colOf, courses]);
  const cellW = (list: Assessment[] | undefined): number => (list ?? []).reduce((s, a) => s + a.weight, 0);
  const maxCell = Math.max(1, ...[...grid.values()].flatMap((r) => [...r.values()].map(cellW)));
  const lvl = (w: number): number => (w <= 0 ? 0 : Math.min(4, Math.ceil((w / maxCell) * 4)));
  const totals = useMemo(() => {
    const t = new Map<number, number>();
    for (const a of items) {
      const col = colOf.get(a.id) ?? 0;
      t.set(col, (t.get(col) ?? 0) + a.weight);
    }
    return t;
  }, [items, colOf]);

  const toggle = (id: string): void => {
    const n = new Set(filter);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setFilter(n);
    setCell(null);
  };

  const cellItems = cell ? ((cell.courseId ? grid.get(cell.courseId)?.get(cell.col) : items.filter((a) => (colOf.get(a.id) ?? 0) === cell.col)) ?? []) : [];

  const scatter: ScatterPt[] = items
    .filter((a) => (colOf.get(a.id) ?? 0) >= 1)
    .map((a) => ({ x: colOf.get(a.id) ?? 0, y: a.weight, color: S.courseById.get(a.course_id)?.color ?? 'var(--accent)', shape: (['quiz', 'lab', 'oral'] as Kind[]).includes(a.kind) ? 'c' : (['project', 'assignment'] as Kind[]).includes(a.kind) ? 't' : 's', label: `${S.courseById.get(a.course_id)?.code} · ${a.title} · ${a.weight}%` }));
  const weeklyW = Array.from({ length: W }, (_, i) => items.filter((a) => colOf.get(a.id) === i + 1).reduce((s, a) => s + a.weight, 0));
  const cumul = weeklyW.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
  const dated = items.filter((a) => (colOf.get(a.id) ?? 0) >= 1).sort((a, b) => (colOf.get(a.id) ?? 0) - (colOf.get(b.id) ?? 0) || a.sort - b.sort);
  const unknownItems = items.filter((a) => (colOf.get(a.id) ?? 0) === 0);

  return (
    <div className="page">
      <PageHead title="التقييمات والمواعيد" icon="clock" crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: sem.code }, { label: 'التقييمات والمواعيد' }]} sub="أين تتكدّس التقييمات؟ الأسابيع المزدحمة مُظلَّلة." />

      <div className="tl-controls">
        <div className="chips" role="group" aria-label="تصفية حسب المادة">
          {courses.map((c) => (
            <button key={c.id} className="chip" aria-pressed={filter.has(c.id)} style={{ '--c': c.color } as never} onClick={() => toggle(c.id)}>
              <i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi>
            </button>
          ))}
          {filter.size > 0 && <button className="btn sm ghost" onClick={() => setFilter(new Set())}>الكل</button>}
        </div>
        <div className="row">
          <Switch checked={showUnknown} onChange={setShowUnknown} label="عمود «غير معروف»" />
          <Switch checked={onlyOpen} onChange={setOnlyOpen} label="غير المُنجَز فقط" />
          <Segmented<View> label="طريقة العرض" value={view} onChange={setView} options={[{ value: 'heat', label: 'خريطة حرارية', icon: 'grid' }, { value: 'gantt', label: 'جانت', icon: 'board' }, { value: 'scatter', label: 'تشتت', icon: 'chart' }, { value: 'area', label: 'تراكمي', icon: 'zap' }]} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="calendar" title="لا توجد تقييمات للعرض" text="غيّر المرشحات أو أضف تقييمات من صفحة المادة." />
      ) : view === 'heat' ? (
        <Card className="heat-card">
          <div className="heat-scroll">
            <div className="heat" style={{ '--cols': W + 1 + (showUnknown ? 1 : 0) } as never} role="group" aria-label="خريطة حرارية: المواد × الأسابيع">
              <div className="h-corner" role="presentation" />
              {cols.map((k) => {
                const crowded = k <= W && loads[k]?.crowded;
                const brk = sem.break_weeks.includes(k);
                return (
                  <div key={k} className={cx('h-col', crowded && 'crowded', brk && 'brk', phase.week === k && 'now', k === W + 1 && 'exam')} title={k <= W ? weekRangeLabel(sem, k) : 'فترة الامتحانات'}>
                    <b>{k === W + 1 ? 'امتحانات' : k}</b>
                    {crowded && <i className="h-flag" aria-label="أسبوع مزدحم">●</i>}
                  </div>
                );
              })}
              {showUnknown && <div className="h-col unk"><b>؟</b></div>}

              {shownCourses.map((c) => (
                <div key={c.id} style={{ display: 'contents' }}>
                  <Link to={`${base}/courses/${c.id}`} className="h-row" style={{ '--c': c.color } as never}>
                    <i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi>
                  </Link>
                  {cols.map((k) => {
                    const list = grid.get(c.id)?.get(k);
                    const w = cellW(list);
                    const sel2 = cell?.courseId === c.id && cell.col === k;
                    return (
                      <button key={k} className={cx('h-cell', `l${lvl(w)}`, sem.break_weeks.includes(k) && 'brk', sel2 && 'sel', k <= W && loads[k]?.crowded && 'crowded')} style={{ '--c': c.color, animationDelay: `${(k % 20) * 14}ms` } as never} disabled={!list} onClick={() => setCell({ courseId: c.id, col: k })}>
                        {list ? <><span className="num">{fmtNum(w, 0)}</span><span className="sr-only">{` — ${c.code}، ${k === W + 1 ? 'الامتحانات' : 'الأسبوع ' + k}: ${fmtNum(w)}%`}</span></> : <span className="sr-only">{`${c.code}، ${k}: فارغ`}</span>}
                      </button>
                    );
                  })}
                  {showUnknown && (() => {
                    const list = grid.get(c.id)?.get(unknownCol);
                    return (
                      <button className={cx('h-cell unk', list && 'has')} disabled={!list} onClick={() => setCell({ courseId: c.id, col: 0 })}>
                        {list ? <><span className="num">{list.length}</span><span className="sr-only">{` — ${c.code}: غير معروف`}</span></> : <span className="sr-only">{`${c.code}: غير معروف — فارغ`}</span>}
                      </button>
                    );
                  })()}
                </div>
              ))}

              <div className="h-row total">المجموع</div>
              {cols.map((k) => (
                <div key={k} className={cx('h-tot num', k <= W && loads[k]?.crowded && 'crowded')}>{totals.get(k) ? fmtNum(totals.get(k) ?? 0, 0) : ''}</div>
              ))}
              {showUnknown && <div className="h-tot num">{totals.get(0) ? fmtNum(totals.get(0) ?? 0, 0) : ''}</div>}
            </div>
          </div>
          <div className="legend" style={{ marginBlockStart: 'var(--s-4)' }}>
            <span className="heat-scale">أخف <i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> أثقل</span>
            <span><i className="dot" style={{ background: 'var(--lime)' }} /> أسبوع مزدحم</span>
            <span><i className="dot hatchdot" /> إجازة</span>
            <Unknown text="؟ = بلا موعد" />
          </div>
          {cell && (
            <div className="cell-detail" role="region" aria-live="polite" aria-label="تفاصيل الخانة">
              <h3>{cell.col === 0 ? 'بنود بلا موعد' : cell.col === W + 1 ? 'فترة الامتحانات' : `الأسبوع ${cell.col} · ${weekRangeLabel(sem, cell.col)}`}{cell.courseId ? <> · <bdi>{S.courseById.get(cell.courseId)?.code}</bdi></> : ''}</h3>
              <div className="dl-list">
                {cellItems.map((a) => (
                  <DeadlineRow key={a.id} a={a} course={S.courseById.get(a.course_id)} sem={sem} now={S.now} to={`${base}/courses/${a.course_id}#a-${a.id}`} />
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : view === 'gantt' ? (
        <Card>
          <CardHead title="جانت: مدى كل تقييم عبر الأسابيع" icon="board" />
          <div className="gantt" style={{ '--cols': W + 1 } as never}>
            <div className="g-head">
              <span />
              {cols.map((k) => (<b key={k} className={cx(sem.break_weeks.includes(k) && 'brk', phase.week === k && 'now')}>{k === W + 1 ? 'ام' : k}</b>))}
            </div>
            <VirtualList items={dated} rowHeight={40} maxHeight={520} ariaLabel="تقييمات الجدول" render={(a) => {
              const end = colOf.get(a.id) ?? 1;
              const from = a.week_from !== null && a.week_from < end ? a.week_from : end;
              const c = S.courseById.get(a.course_id);
              return (
                <Link to={`${base}/courses/${a.course_id}#a-${a.id}`} className="g-row" title={`${a.title} — ${whenText(a, sem)}`}>
                  <span className="g-l"><i className="dot" style={{ background: c?.color }} /> <bdi>{c?.code}</bdi> · <bdi>{a.title}</bdi></span>
                  <span className="g-track">
                    <i className="g-bar" style={{ gridColumn: `${from} / ${end + 1}`, background: c?.color }}><b className="num">{a.weight}%</b></i>
                  </span>
                </Link>
              );
            }} />
          </div>
          {unknownItems.length > 0 && <p className="muted" style={{ marginBlockStart: 'var(--s-3)' }}>{unknownItems.length} بند بلا موعد لا يظهر هنا — <Link to={`${base}/unknowns`}>عرض غير المعروف</Link></p>}
        </Card>
      ) : view === 'scatter' ? (
        <Card>
          <CardHead title="تشتت: الأسبوع × الوزن" icon="chart" info="دائرة = اختبار قصير/معمل، مربع = اختبار/نهائي، مثلث = مشروع/واجب. اللون = المادة." />
          <Scatter points={scatter} xMax={W + 1} yMax={Math.max(10, Math.ceil(Math.max(...scatter.map((p) => p.y), 10) / 10) * 10)} />
          <div className="legend"><span>● اختصار</span><span>■ اختبار</span><span>▲ مشروع/واجب</span></div>
        </Card>
      ) : (
        <Card>
          <CardHead title="الحمل التراكمي عبر الأسابيع" icon="zap" />
          <AreaLine values={cumul} labels={Array.from({ length: W }, (_, i) => `W${i + 1}`)} unit="%" hotIdx={Math.max(0, (phase.week ?? 1) - 1)} height={220} />
          <p className="muted" style={{ marginTop: 'var(--s-3)' }}>النسبة التراكمية من مجموع الأوزان المجدولة حتى كل أسبوع (بدون «غير معروف» والامتحانات).</p>
        </Card>
      )}
      <p className="muted" style={{ marginBlockStart: 'var(--s-4)', fontSize: 'var(--fs-xs)' }}>بداية الأسبوع 1: {fmtDateShort(weekStartMs(sem, 1))}</p>
      <Badge>{items.length} بند</Badge>
    </div>
  );
}
void KIND_COLOR; void KIND_LABEL;
