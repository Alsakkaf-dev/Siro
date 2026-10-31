import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { Badge, Button, Card, CardHead, EmptyState, TrustTag } from '../ui/ui.js';
import { Donut, GroupedBars, LegendRows, Sankey } from '../widgets/charts.js';
import { KIND_COLOR, KIND_LABEL, KINDS } from '../../../shared/constants.js';
import { weightSum } from '../../../shared/semester.js';
import { fmtNum } from '../lib/format.js';

/** عرض «أوزان» داخل «التقييمات والمواعيد» (?view=weights). */
export function WeightsBody() {
  const S = useSem();
  const { sem, courses } = S;
  const base = `/academic/s/${sem.id}`;
  const matrix = useMemo(() => courses.map((c) => {
    const items = S.byCourse.get(c.id) ?? [];
    const m = new Map<string, number>();
    for (const a of items) m.set(a.kind, (m.get(a.kind) ?? 0) + a.weight);
    return { c, m, sum: weightSum(items), n: items.length };
  }), [courses, S.byCourse]);
  const kindTotals = KINDS.map((k) => ({ k, v: matrix.reduce((s, r) => s + (r.m.get(k) ?? 0), 0) })).filter((x) => x.v > 0);
  const grand = kindTotals.reduce((s, x) => s + x.v, 0);

  if (courses.length === 0 || grand === 0) return <EmptyState icon="pie" title="لا أوزان لعرضها" text="أضف مواد وتقييمات لتظهر الخريطة." action={<Button variant="primary" icon="plus" to={`${base}/courses?new=assessment`}>إضافة تقييم</Button>} />;

  const finalShare = matrix.map((r) => ({ label: r.c.code, ca: Math.round(((r.sum - (r.m.get('final') ?? 0)) ) * 10) / 10, fin: r.m.get('final') ?? 0 }));
  const maxCell = Math.max(1, ...matrix.flatMap((r) => [...r.m.values()]));

  return (
    <div>
      <div className="stack stagger" style={{ gap: 'var(--s-5)' }}>
        <Card>
          <CardHead title="تدفق الأوزان: المواد ← أنواع التقييم" icon="layers" info="سُمك الشريط = مجموع الوزن. مرّر الفأرة على مادة أو نوع لإبرازه."><TrustTag kind="calc" /></CardHead>
          <Sankey
            left={matrix.filter((r) => r.sum > 0).map((r) => ({ id: r.c.id, label: r.c.code, value: r.sum, color: r.c.color }))}
            right={kindTotals.map((x) => ({ id: x.k, label: KIND_LABEL[x.k], value: x.v, color: KIND_COLOR[x.k] }))}
            links={matrix.filter((r) => r.sum > 0).flatMap((r) => [...r.m.entries()].map(([k, v]) => ({ from: r.c.id, to: k, value: v })))}
            height={Math.max(260, courses.length * 54)}
          />
        </Card>

        <div className="grid cols-2">
          <Card>
            <CardHead title="حسب النوع" icon="pie" />
            <div className="donut-row">
              <Donut segments={kindTotals.map((x) => ({ label: KIND_LABEL[x.k], value: x.v, color: KIND_COLOR[x.k] }))} centerTop={fmtNum(grand, 0)} centerBottom={`إجمالي أوزان ${courses.length} مواد`} />
              <LegendRows rows={kindTotals.map((x) => ({ label: KIND_LABEL[x.k], value: x.v, max: kindTotals[0]?.v ?? 1, color: KIND_COLOR[x.k], right: `${fmtNum((x.v / grand) * 100, 0)}%` }))} />
            </div>
          </Card>
          <Card>
            <CardHead title="أعمال فصلية مقابل النهائي" icon="chart" />
            <GroupedBars labels={finalShare.map((f) => f.label)} series={[{ name: 'أعمال فصلية', color: 'var(--accent)', values: finalShare.map((f) => f.ca) }, { name: 'نهائي', color: 'var(--lime)', values: finalShare.map((f) => f.fin) }]} height={190} />
          </Card>
        </div>

        <Card>
          <CardHead title="المصفوفة: المادة × النوع" icon="table" />
          <div className="table-wrap" tabIndex={0} role="region" aria-label="جدول الأوزان">
            <table className="t wm">
              <thead><tr><th>المادة</th>{kindTotals.map((x) => (<th key={x.k}>{KIND_LABEL[x.k]}</th>))}<th>المجموع</th></tr></thead>
              <tbody>
                {matrix.map((r) => (
                  <tr key={r.c.id}>
                    <td><Link to={`${base}/courses/${r.c.id}`} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><i className="dot" style={{ background: r.c.color }} /><bdi>{r.c.code}</bdi></Link></td>
                    {kindTotals.map((x) => {
                      const v = r.m.get(x.k) ?? 0;
                      return <td key={x.k} className="n"><span className="wm-cell" style={{ '--a': v / maxCell, '--c': KIND_COLOR[x.k] } as never}>{v ? fmtNum(v) : ''}</span></td>;
                    })}
                    <td className="n">{r.n === 0 ? '—' : Math.abs(r.sum - 100) > 0.005 ? <Badge tone="warn">{fmtNum(r.sum)}%</Badge> : <Badge tone="ok">100%</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
