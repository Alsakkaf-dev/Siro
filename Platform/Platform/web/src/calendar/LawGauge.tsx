import { Icon } from '../lib/icons.js';
import { LAW, fmtKcal, fmtNum } from '../../../shared/kitchen/index.js';

const SCALE_MAX = 1800;
export type GaugeState = 'EMPTY' | 'PARTIAL' | 'VALID' | 'INVALID_LOW' | 'INVALID_HIGH';

/** شريط القانون الحيّ (CAL-32/LAW-06): المجموع + حدّان + الهامش بالأرقام + أيقونة ونص (A11Y-01: لا باللون وحده). أرقام فقط بلا نصيحة. */
export function LawGauge({ kcal, state }: { kcal: number; state: GaugeState }) {
  const pct = Math.min(100, (kcal / SCALE_MAX) * 100);
  const low = kcal < LAW.MIN;
  const tone = state === 'INVALID_HIGH' || state === 'INVALID_LOW' ? 'bad' : state === 'PARTIAL' || state === 'EMPTY' ? (kcal > LAW.MAX ? 'bad' : 'part') : kcal - LAW.MIN <= 50 || LAW.MAX - kcal <= 50 ? 'near' : 'ok';
  const text = state === 'EMPTY' ? 'لا وجبات بعد'
    : state === 'INVALID_HIGH' ? `أعلى بـ${fmtKcal(kcal - LAW.MAX)}`
      : state === 'INVALID_LOW' ? `أقل بـ${fmtKcal(LAW.MIN - kcal)}`
        : state === 'PARTIAL' ? (kcal > LAW.MAX ? `أعلى بـ${fmtKcal(kcal - LAW.MAX)}` : 'غير مكتمل')
          : 'داخل الحدود';
  return (
    <div className={`law-gauge t-${tone}`} data-testid="law-gauge" data-state={state} data-tone={tone}>
      <div className="row law-top">
        <b className="num law-total" dir="ltr" data-testid="law-total">{fmtKcal(kcal)}</b> <span>سعرة</span>
        <span className="law-state"><Icon name={tone === 'ok' ? 'check' : tone === 'near' || tone === 'part' ? 'info' : 'warn'} size={14} /> {text}</span>
      </div>
      <div className="law-bar" role="meter" aria-label="مجموع سعرات اليوم" aria-valuenow={Math.round(kcal)} aria-valuemin={0} aria-valuemax={SCALE_MAX} aria-valuetext={`${fmtKcal(kcal)} سعرة، ${text}`}>
        <i className="law-band" style={{ insetInlineStart: `${(LAW.MIN / SCALE_MAX) * 100}%`, inlineSize: `${((LAW.MAX - LAW.MIN) / SCALE_MAX) * 100}%` }} aria-hidden="true" />
        <i className="law-fill" style={{ inlineSize: `${pct}%` }} aria-hidden="true" />
        <i className="law-tick" style={{ insetInlineStart: `${(LAW.MIN / SCALE_MAX) * 100}%` }} aria-hidden="true" />
        <i className="law-tick" style={{ insetInlineStart: `${(LAW.MAX / SCALE_MAX) * 100}%` }} aria-hidden="true" />
      </div>
      <div className="row law-margins num" dir="ltr">
        <small>{LAW.MIN}</small>
        <small data-testid="law-margins">{low ? `+${fmtNum(Math.round(LAW.MIN - kcal), 0)} للأدنى` : `${fmtNum(Math.round(kcal - LAW.MIN), 0)} فوق الأدنى`} · {kcal > LAW.MAX ? `${fmtNum(Math.round(kcal - LAW.MAX), 0)} فوق الأعلى` : `${fmtNum(Math.round(LAW.MAX - kcal), 0)} تحت الأعلى`}</small>
        <small>{LAW.MAX}</small>
      </div>
    </div>
  );
}
