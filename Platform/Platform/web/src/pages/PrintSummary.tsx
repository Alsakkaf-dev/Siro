import { useSem } from '../core/sem-context.js';
import { PageHead } from '../ui/page.js';
import { Button } from '../ui/ui.js';
import { KIND_LABEL, STATUS_LABEL } from '../../../shared/constants.js';
import { dueSortMs, weightSum } from '../../../shared/semester.js';
import { fmtISOFull, fmtNum, prettySchedule, whenText } from '../lib/format.js';

export default function PrintSummary() {
  const S = useSem();
  const { sem } = S;
  return (
    <div className="page print-page">
      <div className="no-print">
        <PageHead title="ملخص الفصل للطباعة" icon="print" crumbs={[{ to: '/academic', label: 'الفصول' }, { to: `/academic/s/${sem.id}`, label: sem.code }, { label: 'طباعة' }]} actions={<Button variant="primary" icon="print" onClick={() => window.print()}>طباعة / حفظ PDF</Button>} />
      </div>
      <header className="print-head">
        <h1><bdi>{sem.code}</bdi> — <bdi>{sem.name}</bdi></h1>
        <p>البداية {fmtISOFull(sem.start_date)} · {sem.weeks} أسبوعًا{sem.break_weeks.length ? ` · إجازة: أسبوع ${sem.break_weeks.join('، ')}` : ''}{sem.exam_start ? ` · الامتحانات من ${fmtISOFull(sem.exam_start)}` : ' · موعد الامتحانات غير معروف'}</p>
      </header>
      {S.courses.map((c) => {
        const items = [...(S.byCourse.get(c.id) ?? [])].sort((a, b) => (dueSortMs(a, sem) ?? Infinity) - (dueSortMs(b, sem) ?? Infinity));
        return (
          <section key={c.id} className="print-course">
            <h2><bdi>{c.code}</bdi> — <bdi>{c.name}</bdi> <small>({c.credits ?? 'ساعات غير معروفة'}{c.credits !== null ? ' ساعات' : ''})</small></h2>
            <p className="muted">{c.lecturer ? <bdi>{c.lecturer}</bdi> : 'المحاضر غير معروف'}{c.schedule ? ' · ' : ''}{c.schedule ? <bdi>{prettySchedule(c.schedule)}</bdi> : ''}</p>
            <div className="table-wrap" tabIndex={0} role="region" aria-label="جدول قابل للتمرير"><table className="t">
              <thead><tr><th>التقييم</th><th>النوع</th><th>الوزن</th><th>الموعد</th><th>الحالة</th></tr></thead>
              <tbody>
                {items.map((a) => (<tr key={a.id}><td><bdi>{a.title}</bdi>{a.count > 1 ? ` ×${a.count}` : ''}</td><td>{KIND_LABEL[a.kind]}</td><td className="n">{fmtNum(a.weight)}%</td><td>{whenText(a, sem)}</td><td>{a.score !== null ? `${fmtNum(a.score)}/${fmtNum(a.max_score)}` : STATUS_LABEL[a.status]}</td></tr>))}
                <tr><td colSpan={2}><b>المجموع</b></td><td className="n"><b>{fmtNum(weightSum(items))}%</b></td><td colSpan={2}>{Math.abs(weightSum(items) - 100) > 0.005 && items.length ? '⚠ ليس 100%' : ''}</td></tr>
              </tbody>
            </table></div>
          </section>
        );
      })}
      <footer className="print-foot">طُبع من المنصة الشخصية — البيانات محلية. «غير معروف» = لا معلومة مؤكدة.</footer>
    </div>
  );
}
