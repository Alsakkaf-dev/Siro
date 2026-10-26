import { useCallback, useEffect, useState } from 'react';
import { life } from '../lib/api.js';
import { Badge, Button, Card, CardHead } from '../ui/ui.js';
import { ContentPage } from '../life/v8Kit.js';
import { fmtAt } from '../life/lifeKit.js';
import { useContent } from '../sports/sportsKit.js';
import { TagBadge } from '../review/kit.js';
import { useApp } from '../core/app-context.js';
import { Term } from '../glossary/glossary.js';
import { tagFrom } from '../../../shared/weekly.js';
import type { QadaPlanDoc, QadaScenario } from '../../../shared/v8.js';

export default function LifeQadaPlan() {
  const c = useContent<QadaPlanDoc>('PRAYER_QADA_PLAN_AR.json');
  const { toast } = useApp();
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  useEffect(() => { life.qadaChoice().then((x) => setChoice(x.scenario)).catch(() => setChoice(null)); }, []);
  const pick = useCallback(async (id: string | null) => {
    try {
      setChoice((await life.setQadaChoice(id)).scenario);
      toast(id ? 'حُفظ اختيارك محليًا في هذا الموقع فقط' : 'أُلغي الاختيار', { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  }, [toast]);
  return (
    <ContentPage c={c} title="خطة القضاء المقترحة" icon="clock" label="خطة القضاء" sub="أرقام للتوضيح فقط — بلا التزام ولا ضغط.">
      {(d) => (
        <>
          <div className="life-alert warn" role="note">
            <div>
              <strong>{d.tone_ar}</strong>
              <p style={{ margin: '6px 0 0' }}>{d.status_ar}. السيناريوهات افتراضات حسابية <TagBadge tag={tagFrom(d.confidence)} />. {d.confidence_note_ar}</p>
              <p style={{ margin: '6px 0 0' }}>{d.educational_disclaimer_ar}</p>
            </div>
          </div>
          <Card>
            <CardHead title="الوضع الحالي" icon="info" />
            <ul className="life-list">
              <li>القضاء المتبقي حتى {d.as_of ? fmtAt(d.as_of) : 'تاريخ غير مسجل'}: <b className="num">{String(d.counts?.['total'] ?? '—')}</b> <TagBadge tag={tagFrom(d.counts?.['confidence'])} />{typeof d.counts?.['total_arithmetic_ar'] === 'string' && <small className="muted" style={{ display: 'block' }}>{d.counts['total_arithmetic_ar'] as string}</small>}</li>
              <li>المنجز: <b className="num">{String(d.counts?.['done_total'] ?? '—')}</b> {typeof d.counts?.['done_note_ar'] === 'string' && <small className="muted">— {d.counts['done_note_ar'] as string}</small>}</li>
              <li>تاريخ البداية: {d.start_date ? <b>{d.start_date}</b> : <><TagBadge tag="غير مسجل" /> <small className="muted">{d.start_date_missing_text_ar}</small></>}</li>
              <li>السيناريو عند راشد: {d.selected_scenario ? <b>{d.selected_scenario}</b> : <><TagBadge tag="غير مسجل" /> <small className="muted">{d.selected_scenario_missing_text_ar}</small></>}</li>
              <li>اختيارك هنا (محلي، لا يُرسل لراشد): {choice === undefined ? '…' : choice ? <b>{d.scenarios.find((s) => s.id === choice)?.label_ar ?? choice}</b> : <span className="muted">لم تختر</span>}</li>
            </ul>
          </Card>
          <div className="ins-grid">
            {d.scenarios.map((s) => <Scenario key={s.id} s={s} chosen={choice === s.id} onPick={() => void pick(choice === s.id ? null : s.id)} />)}
          </div>
          {d.growth_note_ar?.text_ar && (
            <Card>
              <CardHead title="ملاحظة: الأعداد قد تزيد" icon="warn" />
              <p style={{ marginBlockStart: 0 }}>{d.growth_note_ar.text_ar}</p>
              {d.growth_note_ar.history_fact && <p className="muted">{d.growth_note_ar.history_fact.arithmetic_ar} — {d.growth_note_ar.history_fact.note_ar}</p>}
            </Card>
          )}
          {d.method_ar && (
            <Card>
              <CardHead title="طريقة الحساب" icon="info" />
              <p style={{ marginBlockStart: 0 }}>{d.method_ar.rounding_ar}</p>
              <ul className="rules">{d.method_ar.assumptions_ar?.map((a, k) => <li key={k}>{a}</li>)}</ul>
              {d.method_ar.what_is_not_computed_ar && <p className="muted">{d.method_ar.what_is_not_computed_ar}</p>}
            </Card>
          )}
          <p className="muted rv-fine"><Term id="qada">القضاء</Term>: الفرض الفائت يزيد القضاء، وينقص فقط بصلاة قضاء يقولها محمد.</p>
        </>
      )}
    </ContentPage>
  );
}

function Scenario({ s, chosen, onPick }: { s: QadaScenario; chosen: boolean; onPick: () => void }) {
  const t = s.total_days_if_counts_stay_fixed;
  const items = s.sequential_by_name?.items ?? [];
  return (
    <Card className={chosen ? 'qs chosen' : 'qs'}>
      <CardHead title={s.label_ar} icon="clock">{chosen && <Badge tone="ok">اخترتَه</Badge>}</CardHead>
      <p className="ins-v">{t?.days !== undefined ? <>{t.days} يومًا <small className="muted">≈ {t.months_approx} شهر ≈ {t.years_approx} سنة</small></> : <TagBadge tag="غير مسجل" />}</p>
      {t?.arithmetic_ar && <small className="muted" style={{ display: 'block' }}>{t.arithmetic_ar}</small>}
      <details className="safety-more">
        <summary>ترتيب الأسماء (فجر ثم ظهر …)</summary>
        <p>{s.sequential_by_name?.description_ar}</p>
        <ul className="life-list">{items.map((i) => <li key={i.prayer}>{i.name_ar}: {i.count} — {i.arithmetic_ar}</li>)}</ul>
      </details>
      <Button size="sm" variant={chosen ? 'ghost' : undefined} aria-pressed={chosen} onClick={onPick}>{chosen ? 'إلغاء اختياري' : 'اخترتُ هذا (محليًا)'}</Button>
    </Card>
  );
}
