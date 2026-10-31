import { Link } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { PageHead } from '../ui/page.js';
import { Button, Card, CardHead, EmptyState } from '../ui/ui.js';
import { CourseCalcPanel } from '../widgets/CourseCalcPanel.js';
import { isGraded } from '../../../shared/calc.js';
import { fmtNum } from '../lib/format.js';

/** حاسبة الدرجات: المادة في الرابط (?course=<id>)، والحاسبة نفسها مكوّن مشترك مع صفحة المادة. */
export default function Calculator() {
  const S = useSem();
  const { sem, courses } = S;
  const base = `/academic/s/${sem.id}`;
  const [courseId, setCourseId] = useUrlParam('course', courses[0]?.id ?? '');
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  if (!course) return <div className="page"><PageHead title="حاسبة الدرجات" icon="calc" /><EmptyState icon="calc" title="لا مواد في هذا الفصل" text="أضف مادة وتقييماتها لتستخدم الحاسبة." action={<Button variant="primary" to={`${base}/courses?new=1`}>إضافة مادة</Button>} /></div>;
  const overview = courses.map((c) => ({ c, calc: S.calcs.get(c.id)! }));
  return (
    <div className="page">
      <PageHead title="حاسبة الدرجات" icon="calc" crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: sem.code }, { label: 'حاسبة الدرجات' }]} sub="كم تحتاج من العلامة المتبقية لتصل إلى 50 / 60 / 70 / 80؟ لا تُدخل أرقامًا وهمية — جرّب «ماذا لو» فقط." actions={<Button icon="book" to={`${base}/courses/${course.id}?tab=calc`}>فتح في المادة</Button>} />
      <div className="chips" role="tablist" aria-label="اختر المادة" style={{ marginBlockEnd: 'var(--s-5)' }}>
        {courses.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === course.id} className="chip" style={{ '--c': c.color } as never} onClick={() => setCourseId(c.id)}>
            <i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi>
          </button>
        ))}
      </div>
      <CourseCalcPanel key={course.id} course={course} />
      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="نظرة على كل المواد" icon="layers" />
        <div className="table-wrap" tabIndex={0} role="region" aria-label="جدول الحاسبة">
          <table className="t">
            <thead><tr><th>المادة</th><th>مكتسب</th><th>أقصى ممكن</th>{[50, 60, 70, 80].map((t) => (<th key={t}>هدف {t}</th>))}</tr></thead>
            <tbody>
              {overview.map(({ c, calc: cc }) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setCourseId(c.id)}>
                  <td><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi></span></td>
                  <td className="n">{fmtNum(cc.earned)}</td>
                  <td className="n">{fmtNum(cc.maxPossible)}</td>
                  {cc.rows.map((r) => (<td key={r.target} className="n"><span className={`tcell ${r.state}`}>{r.state === 'sure' ? '✓' : r.state === 'impossible' ? '✕' : `${fmtNum(r.need, 0)}%`}</span></td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBlockStart: 'var(--s-3)', fontSize: 'var(--fs-xs)' }}>الأرقام = النسبة المطلوبة من المتبقي (بافتراض 70% للأعمال الفصلية). لا درجات حقيقية مُدخلة بعد في أي مادة {courses.some((c) => (S.byCourse.get(c.id) ?? []).some((a) => isGraded(a))) ? '' : '— لذلك لا شيء «مكتسب»'}.</p>
      </Card>
    </div>
  );
}
void Link;
