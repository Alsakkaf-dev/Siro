import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUrlParam, useUrlSet } from '../core/useUrlParam.js';
import { AssessmentQuickActions } from '../widgets/AssessmentQuickActions.js';
import { Skeleton } from '../ui/ui.js';
import { useSem } from '../core/sem-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented, Switch, Unknown, cx } from '../ui/ui.js';
import { AreaLine, Scatter, type ScatterPt } from '../widgets/charts.js';
import { DeadlineRow } from '../widgets/tiles.js';
import { VirtualList } from '../widgets/catalog.js';
import { KIND_COLOR, KIND_LABEL, KINDS, STATUS_LABEL } from '../../../shared/constants.js';
import { assessmentColumn, dueSortMs, parseISO, weekOf, weekStartMs } from '../../../shared/semester.js';
import type { Assessment, Kind } from '../../../shared/types.js';
import { fmtDateShort, fmtNum, weekRangeLabel, whenText } from '../lib/format.js';

const WeightsBody = lazy(() => import('./Weights.js').then((m) => ({ default: m.WeightsBody })));

type View = 'list' | 'weeks' | 'gantt' | 'weights';
type Mode = 'heat' | 'scatter' | 'area';
const VIEWS = ['list', 'weeks', 'gantt', 'weights'] as const;
const MODES = ['heat', 'scatter', 'area'] as const;

/** «التقييمات والمواعيد»: بيانات واحدة بعروض في الرابط (?view=list|weeks|gantt|weights). */
export default function Timeline() {
  const S = useSem();
  const { sem, courses, assessments, phase, loads } = S;
  const base = `/academic/s/${sem.id}`;
  const [view, setView] = useUrlParam<View>('view', 'list', VIEWS);
  const [mode, setMode] = useUrlParam<Mode>('mode', 'heat', MODES);
  const [filter, setFilter] = useUrlSet('course');
  const [showUnknown, setShowUnknown] = useState(true);
  const [openP, setOpenP] = useUrlParam<'' | '1'>('open', '', ['', '1']);
  const onlyOpen = openP === '1';
  const setOnlyOpen = (v: boolean): void => setOpenP(v ? '1' : '');
  const [cell, setCell] = useState<{ courseId: string | null; col: number } | null>(null);

  const shownCourses = courses.filter((c) => filter.size === 0 || filter.has(c.id));
  const filterKey = [...filter].join(',');
  const items = useMemo(() => assessments.filter((a) => (filter.size === 0 || filter.has(a.course_id)) && (!onlyOpen || (a.status !== 'graded' && a.status !== 'submitted'))), [assessments, filterKey, onlyOpen]);
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

      <div className="row" style={{ marginBlockEnd: 'var(--s-4)' }}>
        <Segmented<View> label="العرض" value={view} onChange={setView} options={[{ value: 'list', label: 'قائمة', icon: 'list' }, { value: 'weeks', label: 'أسابيع', icon: 'grid' }, { value: 'gantt', label: 'جانت', icon: 'board' }, { value: 'weights', label: 'أوزان', icon: 'pie' }]} />
      </div>
      {view === 'weights' ? (
        <Suspense fallback={<Skeleton h={320} r={20} />}><WeightsBody /></Suspense>
      ) : view === 'list' ? (
        <ListView items={items} filter={filter} toggle={toggle} clear={() => setFilter(new Set())} onlyOpen={onlyOpen} setOnlyOpen={setOnlyOpen} />
      ) : (<>
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
          {view === 'weeks' && mode === 'heat' && <Switch checked={showUnknown} onChange={setShowUnknown} label="عمود «غير معروف»" />}
          <Switch checked={onlyOpen} onChange={setOnlyOpen} label="غير المُنجَز فقط" />
          {view === 'weeks' && <Segmented<Mode> label="طريقة عرض الأسابيع" value={mode} onChange={setMode} options={[{ value: 'heat', label: 'خريطة حرارية', icon: 'grid' }, { value: 'scatter', label: 'تشتت', icon: 'chart' }, { value: 'area', label: 'تراكمي', icon: 'zap' }]} />}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="calendar" title="لا توجد تقييمات للعرض" text="غيّر المرشحات أو أضف تقييمًا." action={<div className="row" style={{ justifyContent: 'center' }}>{filter.size > 0 || onlyOpen ? <Button onClick={() => { setFilter(new Set()); setOnlyOpen(false); }}>مسح المرشحات</Button> : null}<Button variant="primary" icon="plus" to={`${base}/courses?new=assessment`}>إضافة تقييم</Button></div>} />
      ) : view === 'weeks' && mode === 'heat' ? (
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
      ) : mode === 'scatter' ? (
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
      </>)}
      <p className="muted" style={{ marginBlockStart: 'var(--s-4)', fontSize: 'var(--fs-xs)' }}>بداية الأسبوع 1: {fmtDateShort(weekStartMs(sem, 1))}</p>
      <Badge>{items.length} بند</Badge>
    </div>
  );
}

type Group = 'week' | 'course' | 'status';
const STATUSES = ['unknown', 'pending', 'submitted', 'graded'] as const;

/** عرض القائمة: كل التقييمات زمنيًا، تجميع وفلاتر في الرابط، وإجراءات مباشرة. غير المؤرَّخ في «بلا موعد». */
function ListView({ items, filter, toggle, clear, onlyOpen, setOnlyOpen }: { items: Assessment[]; filter: Set<string>; toggle: (id: string) => void; clear: () => void; onlyOpen: boolean; setOnlyOpen: (v: boolean) => void }) {
  const S = useSem();
  const { sem, courses } = S;
  const base = `/academic/s/${sem.id}`;
  const [group, setGroup] = useUrlParam<Group>('group', 'week', ['week', 'course', 'status']);
  const [kinds, setKinds] = useUrlSet('kind');
  const [statuses, setStatuses] = useUrlSet('status');
  const [day, setDay] = useUrlParam<string>('day', '');
  const dayMs = day ? parseISO(day) : Number.NaN;
  const rows = items
    .filter((a) => (kinds.size === 0 || kinds.has(a.kind)) && (statuses.size === 0 || statuses.has(a.status)))
    .filter((a) => Number.isNaN(dayMs) || dueSortMs(a, sem) === dayMs || (a.timing === 'week' && a.week_no !== null && weekOf(dayMs, parseISO(sem.start_date)) >= (a.week_from ?? a.week_no) && weekOf(dayMs, parseISO(sem.start_date)) <= a.week_no))
    .map((a) => ({ a, t: dueSortMs(a, sem) }))
    .sort((x, y) => (x.t ?? Infinity) - (y.t ?? Infinity) || x.a.sort - y.a.sort);
  const keyOf = (x: { a: Assessment; t: number | null }): string => {
    if (group === 'course') return S.courseById.get(x.a.course_id)?.code ?? '—';
    if (group === 'status') return STATUS_LABEL[x.a.status];
    if (x.t === null) return 'بلا موعد';
    if (x.a.timing === 'exam') return 'فترة الامتحانات';
    const w = weekOf(x.t, parseISO(sem.start_date));
    return w >= 1 && w <= sem.weeks ? `الأسبوع ${w} · ${weekRangeLabel(sem, w)}` : fmtDateShort(x.t);
  };
  const groups = new Map<string, typeof rows>();
  for (const r of rows) groups.set(keyOf(r), [...(groups.get(keyOf(r)) ?? []), r]);
  const tog = (set: Set<string>, setter: (s: Set<string>) => void, v: string): void => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };
  const usedKinds = KINDS.filter((k) => items.some((a) => a.kind === k));
  return (
    <>
      <div className="tl-controls">
        <div className="chips" role="group" aria-label="تصفية حسب المادة">
          {courses.map((c) => (
            <button key={c.id} className="chip" aria-pressed={filter.has(c.id)} style={{ '--c': c.color } as never} onClick={() => toggle(c.id)}>
              <i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi>
            </button>
          ))}
          {filter.size > 0 && <button className="btn sm ghost" onClick={clear}>كل المواد</button>}
        </div>
        <div className="chips" role="group" aria-label="تصفية حسب النوع">
          {usedKinds.map((k) => <button key={k} className="chip" aria-pressed={kinds.has(k)} onClick={() => tog(kinds, setKinds, k)}>{KIND_LABEL[k]}</button>)}
        </div>
        <div className="chips" role="group" aria-label="تصفية حسب الحالة">
          {STATUSES.map((st) => <button key={st} className="chip" aria-pressed={statuses.has(st)} onClick={() => tog(statuses, setStatuses, st)}>{STATUS_LABEL[st]}</button>)}
        </div>
        <div className="row">
          <Switch checked={onlyOpen} onChange={setOnlyOpen} label="غير المُنجَز فقط" />
          <Segmented<Group> label="التجميع" value={group} onChange={setGroup} options={[{ value: 'week', label: 'حسب الأسبوع' }, { value: 'course', label: 'حسب المادة' }, { value: 'status', label: 'حسب الحالة' }]} />
          {day && <button className="chip" aria-pressed="true" onClick={() => setDay('')}>يوم {fmtDateShort(dayMs)} ✕</button>}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="list" title="لا تقييمات تطابق المرشحات" action={<div className="row" style={{ justifyContent: 'center' }}><Button onClick={() => { clear(); setKinds(new Set()); setStatuses(new Set()); setDay(''); setOnlyOpen(false); }}>مسح المرشحات</Button><Button variant="primary" icon="plus" to={`${base}/courses?new=assessment`}>إضافة تقييم</Button></div>} />
      ) : (
        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          {[...groups.entries()].map(([g, list]) => (
            <Card key={g}>
              <CardHead title={g} icon="calendar"><Badge>{list.length}</Badge></CardHead>
              <div className="table-wrap">
                <table className="t as-list">
                  <thead><tr><th>التقييم</th><th>المادة</th><th>الموعد</th><th>الوزن</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {list.map(({ a }) => {
                      const c = S.courseById.get(a.course_id);
                      return (
                        <tr key={a.id}>
                          <td><Link to={`${base}/courses/${a.course_id}#a-${a.id}`}><bdi>{a.title}</bdi></Link> <small className="muted">{KIND_LABEL[a.kind]}</small></td>
                          <td><span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><i className="dot" style={{ background: c?.color }} /><bdi>{c?.code}</bdi></span></td>
                          <td>{whenText(a, sem)}</td>
                          <td className="n">{fmtNum(a.weight)}%</td>
                          <td>{a.status === 'graded' && a.score !== null ? <Badge tone="ok">{fmtNum(a.score)}/{fmtNum(a.max_score)}</Badge> : <Badge tone={a.status === 'unknown' ? 'warn' : undefined}>{STATUS_LABEL[a.status]}</Badge>}</td>
                          <td><AssessmentQuickActions a={a} onDone={() => void S.reload()} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
