import { Link } from 'react-router-dom';
import { Badge, Card, CardHead } from '../ui/ui.js';
import { ContentPage } from '../life/v8Kit.js';
import { fmtDay, fmtAt, money } from '../life/lifeKit.js';
import { useContent } from '../sports/sportsKit.js';
import { TagBadge } from '../review/kit.js';
import { tagFrom } from '../../../shared/weekly.js';
import { indicatorView } from '../../../shared/insights.js';
import type { InsightsDoc } from '../../../shared/v8.js';

const FILE_AR: Record<string, string> = { 'LEDGER.csv': 'السجل المالي', 'ledger_full.json': 'السجل المالي الكامل', 'finance.json': 'ملف المال', 'prayers.json': 'ملف الصلاة', 'dashboard_summary.json': 'ملخص اللوحة' };

export default function LifeInsights() {
  const c = useContent<InsightsDoc>('FINANCE_INSIGHTS_AR.json');
  return (
    <ContentPage c={c} title="مؤشرات المال" icon="chart" label="المؤشرات المالية" sub="أرقام جاهزة  — الموقع يعرضها كما هي ولا يعيد حسابها.">
      {(d) => (
        <>
          <div className="life-alert info" role="note">
            <div>
              <p style={{ margin: 0 }}>{d.purpose_ar}</p>
              {d.data_period && <p style={{ margin: '6px 0 0' }}><b>الفترة:</b> من {fmtDay(d.data_period.from)} إلى {fmtDay(d.data_period.to)} ({d.data_period.days} يومًا) <TagBadge tag={tagFrom(d.data_period.confidence)} />{d.data_period.period_assumption_ar && <small className="muted" style={{ display: 'block' }}>{d.data_period.period_assumption_ar}</small>}</p>}
              {d.spend_definition_ar && <p style={{ margin: '6px 0 0' }}><b>ما هو «الصرف»؟</b> {d.spend_definition_ar}</p>}
              {d.recompute_check?.status_ar && <p className="muted rv-fine" style={{ margin: '6px 0 0' }}>{d.recompute_check.status_ar} <TagBadge tag={tagFrom(d.recompute_check.confidence)} /></p>}
            </div>
          </div>
          <div className="ins-grid">
            {d.indicators.map((i) => {
              const v = indicatorView(i);
              return (
                <Card key={i.id} className="ins-card">
                  <CardHead title={i.name_ar} icon="chart"><TagBadge tag={v.tag} /></CardHead>
                  {v.text ? <p className="ins-v">{v.text}</p> : <p className="ins-v ins-na"><Badge dashed>غير مسجل</Badge> <span>{v.missing}</span></p>}
                  {i.unit && <small className="muted">الوحدة: {i.unit}</small>}
                  <details className="safety-more">
                    <summary>كيف حُسب؟</summary>
                    {i.formula_ar && <p>{i.formula_ar}</p>}
                    {i.arithmetic && <p className="num" dir="auto" style={{ unicodeBidi: 'plaintext' }}>{i.arithmetic}</p>}
                    {i.confidence_note_ar && <p className="muted">{i.confidence_note_ar}</p>}
                    {i.source_fields?.length ? <p className="muted rv-fine">المصدر: {[...new Set(i.source_fields.map((s) => FILE_AR[s.file ?? ''] ?? 'السجل'))].join('، ')}</p> : null}
                  </details>
                </Card>
              );
            })}
          </div>
          {d.spend_adjustments?.length ? (
            <Card>
              <CardHead title="تعديل واحد على الصرف" icon="info" />
              <ul className="life-list">{d.spend_adjustments.map((a) => <li key={a.row_id}>سُجّل <bdi className="num">{money(a.recorded_amount)}</bdi> وحُسب <bdi className="num">{money(a.counted_amount)}</bdi> حتى لا يتكرر المبلغ. {a.reason_ar} <TagBadge tag={tagFrom(a.confidence)} /></li>)}</ul>
            </Card>
          ) : null}
          {d.limitations_ar?.length ? (
            <Card>
              <CardHead title="حدود هذه الأرقام" icon="warn" />
              <ul className="rules">{d.limitations_ar.map((l, k) => <li key={k}>{l}</li>)}</ul>
            </Card>
          ) : null}
          <p className="muted rv-fine">آخر توليد: {d.generated_at ? fmtAt(d.generated_at) : 'غير مسجل'} · <Link to="/life/ledger">السجل الكامل</Link> · <Link to="/life/finance">تفاصيل المال</Link></p>
        </>
      )}
    </ContentPage>
  );
}
