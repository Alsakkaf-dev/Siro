import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSem } from '../core/sem-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, TrustTag, Unknown } from '../ui/ui.js';
import { Funnel, Gauge, Ring } from '../widgets/charts.js';
import { calcCourse, isGraded, type MarkOverride, type TargetRow } from '../../../shared/calc.js';
import { KIND_LABEL } from '../../../shared/constants.js';
import { dueSortMs } from '../../../shared/semester.js';
import { fmtNum, whenText } from '../lib/format.js';

const latin = (s: string): string => s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace('٫', '.');

export default function Calculator() {
  const S = useSem();
  const { sem, courses } = S;
  const base = `/academic/s/${sem.id}`;
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [assume, setAssume] = useState(70);
  const [ov, setOv] = useState<Record<string, Record<string, MarkOverride>>>({});
  const course = courses.find((c) => c.id === courseId) ?? courses[0];

  const items = useMemo(() => [...(S.byCourse.get(course?.id ?? '') ?? [])].sort((a, b) => (dueSortMs(a, sem) ?? Infinity) - (dueSortMs(b, sem) ?? Infinity) || a.sort - b.sort), [S.byCourse, course, sem]);
  const overrides = ov[course?.id ?? ''] ?? {};
  const calc = useMemo(() => calcCourse(items, { assume, minFinal: course?.min_final ?? null }, overrides), [items, assume, course, overrides]);

  if (!course) return <div className="page"><EmptyState icon="calc" title="لا مواد في هذا الفصل" text="أضف مادة وتقييماتها لتستخدم الحاسبة." action={<Button variant="primary" to={`${base}/courses?new=1`}>إضافة مادة</Button>} /></div>;
  if (items.length === 0) {
    return <div className="page"><PageHead title="حاسبة الدرجات" icon="calc" /><CourseTabs /><EmptyState icon="list" title="لا تقييمات لهذه المادة" action={<Button to={`${base}/courses/${course.id}`}>فتح المادة</Button>} /></div>;
  }

  function CourseTabs() {
    return (
      <div className="chips" role="tablist" aria-label="اختر المادة" style={{ marginBlockEnd: 'var(--s-5)' }}>
        {courses.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === course!.id} className="chip" style={{ '--c': c.color } as never} onClick={() => setCourseId(c.id)}>
            <i className="dot" style={{ background: c.color }} /> <bdi>{c.code}</bdi>
          </button>
        ))}
      </div>
    );
  }

  const setScore = (id: string, raw: string, max: number): void => {
    const cid = course.id;
    setOv((p) => {
      const cur = { ...(p[cid] ?? {}) };
      const v = latin(raw).trim();
      if (v === '') delete cur[id];
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) cur[id] = { score: Math.min(n, max), max };
      }
      return { ...p, [cid]: cur };
    });
  };
  const whatIf = Object.keys(overrides).length > 0;
  const hasAssumedWeights = items.some((a) => a.weight_assumed);
  const pct = calc.maxPossible > 0 ? (calc.earned / 100) * 100 : 0;
  const lostPct = Math.round((calc.lost + 0) * 10) / 10;

  const stateText = (r: TargetRow): string => (r.state === 'sure' ? 'مضمون ✓' : r.state === 'impossible' ? 'غير ممكن' : `${fmtNum(r.need)}%`);
  const rowLabel = (r: TargetRow): string => (r.mode === 'final' ? 'من النهائي' : r.mode === 'rest' ? 'من المتبقي' : 'مكتمل');

  // overview across courses
  const overview = courses.map((c) => ({ c, calc: S.calcs.get(c.id)! }));

  return (
    <div className="page">
      <PageHead title="حاسبة الدرجات" icon="calc" crumbs={[{ to: '/academic', label: 'الفصول' }, { to: base, label: sem.code }, { label: 'الحاسبة' }]} sub="كم تحتاج من العلامة المتبقية لتصل إلى 50 / 60 / 70 / 80؟ لا تُدخل أرقامًا وهمية — جرّب «ماذا لو» فقط." />
      <CourseTabs />

      <div className="grid cols-2-1">
        <Card>
          <CardHead title={<><bdi>{course.code}</bdi> — <bdi>{course.name}</bdi></>} icon="target">
            <TrustTag kind="calc" />
            {whatIf && <Badge tone="warn">وضع «ماذا لو» — لا يُحفظ</Badge>}
          </CardHead>
          <div className="calc-top">
            <Gauge value={calc.earned} target={50} label={<>{fmtNum(calc.earned)}<small>/100</small></>} sub={calc.performance === null ? 'لا علامات بعد' : `أداؤك في المصحَّح ${fmtNum(calc.performance, 0)}%`} />
            <div className="calc-facts">
              <div><small>مكتسب</small><strong className="num">{fmtNum(calc.earned)}</strong></div>
              <div><small>مفقود</small><strong className="num">{fmtNum(lostPct)}</strong></div>
              <div><small>أقصى ممكن</small><strong className="num">{fmtNum(calc.maxPossible)}</strong></div>
              <div><small>متبقٍّ</small><strong className="num">{fmtNum(calc.remainingCA + calc.finalWeight)}</strong></div>
            </div>
          </div>
          <Funnel steps={[{ label: 'الإجمالي', value: calc.weightTotal, sub: `${fmtNum(calc.weightTotal, 0)}` }, { label: 'مصحَّح', value: calc.gradedWeight, sub: `${fmtNum(calc.gradedWeight, 0)}` }, { label: 'مكتسب', value: calc.earned, sub: `${fmtNum(calc.earned)}` }, { label: 'متبقٍّ', value: calc.remainingCA + calc.finalWeight, sub: `${fmtNum(calc.remainingCA + calc.finalWeight, 0)}` }]} />
          {!calc.weightOk && <div className="callout warn" role="alert" style={{ marginBlockStart: 'var(--s-4)' }}><span>مجموع أوزان هذه المادة {fmtNum(calc.weightTotal)}% وليس 100% — النتائج غير دقيقة حتى تصحّح الأوزان. <Link to={`${base}/courses/${course.id}`}>تعديل التقييمات</Link></span></div>}
          {hasAssumedWeights && <div className="callout warn" style={{ marginBlockStart: 'var(--s-3)' }}><span>بعض الأوزان <TrustTag kind="assumed" /> (افتراض غير مؤكد) — تدخل في الحساب. أكّدها من الملف الرسمي.</span></div>}
        </Card>

        <Card>
          <CardHead title="كم أحتاج؟" icon="target" info="النسبة المطلوبة من العلامة المتبقية. إن وُجد نهائي: تُحسب منه بافتراض أدائك في الأعمال الفصلية المتبقية. بدون نهائي: من كل المتبقي." />
          {calc.hasFinal && calc.remainingCA > 0 && (
            <div className="field" style={{ marginBlockEnd: 'var(--s-4)' }}>
              <label htmlFor="assume">افتراض أدائك في الأعمال الفصلية المتبقية: <b className="num">{assume}%</b> <TrustTag kind="assumed" /></label>
              <input id="assume" type="range" min={0} max={100} step={5} value={assume} onChange={(e) => setAssume(Number(e.target.value))} aria-valuetext={`${assume}%`} />
            </div>
          )}
          <div className="targets" role="table" aria-label="العلامة المطلوبة لكل هدف">
            {calc.rows.map((r) => (
              <div key={r.target} className={`target ${r.state}`}>
                <Ring value={r.state === 'impossible' ? 100 : r.state === 'sure' ? 0 : r.need} size={54} stroke={6} color={r.state === 'impossible' ? 'var(--danger)' : r.state === 'sure' ? 'var(--ok)' : 'var(--accent)'} label={r.target} sub={`هدف ${r.target}`} />
                <div className="t-main">
                  <strong className="num">{stateText(r)}</strong>
                  <small>{r.state === 'ok' ? `${rowLabel(r)} ≈ ${fmtNum(r.marks)} من ${fmtNum(r.pool, 0)} درجة` : r.state === 'sure' ? 'لقد تجاوزته بما حصلت عليه' : 'حتى لو أخذت الكامل لن يكفي'}</small>
                  {r.minApplied && <Badge dashed>طُبّق الحد الأدنى للنهائي {course.min_final}</Badge>}
                </div>
              </div>
            ))}
          </div>
          {!calc.hasFinal && <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginBlockStart: 'var(--s-3)' }}>هذه المادة بلا نهائي: المطلوب موزَّع على كل التقييمات المتبقية.</p>}
        </Card>
      </div>

      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="ماذا لو؟ — جرّب درجات" icon="zap" info="اكتب درجة افتراضية لأي تقييم لترى أثرها. لا تُحفظ في قاعدة البيانات.">
          {whatIf && <Button size="sm" variant="ghost" onClick={() => setOv((p) => ({ ...p, [course.id]: {} }))}>تفريغ التجارب</Button>}
        </CardHead>
        <div className="whatif">
          {items.map((a) => {
            const real = isGraded(a);
            return (
              <div key={a.id} className="wi-row">
                <span className="wi-t"><strong><bdi>{a.title}</bdi></strong><small>{KIND_LABEL[a.kind]} · {a.weight}% · {whenText(a, sem)}</small></span>
                {real ? (
                  <Badge tone="ok">{fmtNum(a.score)}/{fmtNum(a.max_score)} <TrustTag kind="proven" /></Badge>
                ) : (
                  <label className="wi-in">
                    <span className="sr-only">درجة افتراضية لـ {a.title}</span>
                    <input className="input ltr-in num" inputMode="decimal" placeholder={`/${fmtNum(a.max_score)}`} value={overrides[a.id]?.score ?? ''} onChange={(e) => setScore(a.id, e.target.value, a.max_score)} aria-label={`درجة افتراضية لـ ${a.title} من ${fmtNum(a.max_score)}`} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ marginBlockStart: 'var(--s-5)' }}>
        <CardHead title="نظرة على كل المواد" icon="layers" />
        <div className="table-wrap">
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
void Unknown; void pctNoop;
function pctNoop() {}
