import { Badge, Button, Card, CardHead, Unknown } from '../ui/ui.js';
import { AreaLine } from '../widgets/charts.js';
import { Conf, LifePage, MissingInputsCards, Note, fmtDay, fmtDayFull, useLife } from '../life/lifeKit.js';
import { DAY_AR, type Habit, type Habits } from '../../../shared/life.js';
import { Term } from '../glossary/glossary.js';

const KIND: Record<string, string> = { taper: 'تقليل تدريجي', daily_target: 'هدف يومي', schedule: 'جدول' };
const UNIT: Record<string, string> = { minutes: 'دقيقة', grams: 'غرام', liters: 'لتر', sessions: 'جلسة' };

export default function LifeHabits() {
  const d = useLife(['habits']);
  const h = d.get<Habits>('habits');
  return (
    <LifePage title="العادات" icon="check" names={['habits']} data={d} sub="الخطط والعدادات." actions={<><Button variant="primary" icon="zap" to="/life/alternatives">اشتهاء الآن؟</Button><Button icon="edit" to="/life/commands?type=habit_relapse">سجّل انتكاسة</Button></>}>
      {h && <Body h={h} />}
    </LifePage>
  );
}

const logMark = (e: Record<string, unknown>): 'yes' | 'no' | 'unknown' => {
  const v = e['kept_limit'] ?? e['done'] ?? e['on_target'] ?? e['kept'];
  return v === 'yes' || v === true ? 'yes' : v === 'no' || v === false ? 'no' : 'unknown';
};

function Body({ h }: { h: Habits }) {
  const started = h.status?.started === true;
  return (
    <>
      <Card>
        <CardHead title="حالة البرنامج" icon="flag" />
        <p className="row" style={{ margin: 0, gap: 8 }}>
          {started ? <Badge tone="ok">بدأت العادات</Badge> : <Badge tone="warn">لم تبدأ بعد</Badge>} <Conf c={h.status?.started_confidence} />
        </p>
        {h.status?.note_ar && <Note>{h.status.note_ar}</Note>}
        {h.unknown_is_not_zero_ar && <Note>{h.unknown_is_not_zero_ar}</Note>}
      </Card>
      <div className="grid cols-2 cols-1-1">
        {(h.habits ?? []).map((x) => (
          <HabitCard key={x.key} h={x} started={started} />
        ))}
      </div>
      {h.streak_definition_ar && <Note>{h.streak_definition_ar}</Note>}
      <MissingInputsCards title={h.unrecorded_inputs_title_ar} data={h.unrecorded_inputs} />
    </>
  );
}

const COUNTER_ROWS: [string, string][] = [
  ['days_logged', 'أيام مسجّلة'], ['days_kept', 'التزم'], ['days_not_kept', 'لم يلتزم'], ['days_within_limit', 'ضمن الحد'], ['days_over_limit', 'تجاوز الحد'],
  ['days_done', 'تمرّن'], ['days_not_done', 'لم يتمرّن'], ['days_on_target', 'حقّق الهدف'], ['days_unknown', 'نتيجته غير معروفة'],
];

function HabitCard({ h, started }: { h: Habit; started: boolean }) {
  const c = h.counters;
  const val = (n: number | null | undefined) => (typeof n === 'number' ? n : <Unknown />);
  const tg = h.targets ?? [];
  const tv = tg.map((t) => t.reduction_min ?? t.sugar_limit_g ?? 0);
  const unit = h.unit ? UNIT[h.unit] ?? h.unit : '';
  const todayTarget = h.today?.reduction_min ?? h.today?.sugar_limit_g;
  const log = (h.log ?? []).slice(-28);
  return (
    <Card>
      <div className="habit-card">
        <div className="habit-top">
          <h3>{h.name_ar}</h3>
          <span className="row" style={{ gap: 6 }}>
            {h.kind && <Badge>{h.kind === 'taper' ? <Term id="taper">{KIND[h.kind]}</Term> : h.kind === 'daily_target' ? <Term id="daily_target">{KIND[h.kind]}</Term> : KIND[h.kind] ?? h.kind}</Badge>}
            {typeof h.priority === 'number' && <Badge tone="accent">أولوية {h.priority}</Badge>}
          </span>
        </div>
        {h.today && (
          <div className="habit-today">
            <small className="muted">اليوم {h.today.date ? fmtDay(h.today.date) : ''}{h.today.plan_day ? ` — اليوم ${h.today.plan_day} في الجدول المقترح${started ? '' : ' (الجدول مكتوب لكن البرنامج لم يبدأ فعليًا)'}` : ''}</small>
            {typeof todayTarget === 'number' ? (
              <strong>الحد المسموح: <bdi className="num">{todayTarget} {unit}</bdi> <Conf c={h.today.confidence} /></strong>
            ) : h.today.type_ar ? (
              <strong>{h.today.type_ar} <Conf c={h.today.confidence} /></strong>
            ) : null}
          </div>
        )}
        {h.kind === 'daily_target' && (
          <p className="muted" style={{ margin: 0 }}>
            {typeof h.target === 'number' && <>الهدف: <b className="num">{h.target} {unit}</b>. </>}
            {typeof h.target_kcal === 'number' && <>السعرات: <b className="num">{h.target_kcal}</b>. </>}
            {typeof h.target_protein_g === 'number' && <>بروتين: <b className="num">{h.target_protein_g} غ</b>. </>}
            {h.target_bedtime && <>موعد النوم: <b className="num">{h.target_bedtime}</b>. </>}
          </p>
        )}
        {tv.length > 1 && (
          <div>
            <small className="muted">خطة الحد اليومي ({unit}) — الأقدم يمينًا</small>
            <AreaLine values={tv} labels={tg.map((t) => String(t.plan_day ?? ''))} unit={` ${unit}`} height={130} color="var(--life)" />
          </div>
        )}
        {h.week_plan && (
          <div className="week-plan" role="list" aria-label="خطة الأسبوع">
            {h.week_plan.map((w) => (
              <div key={w.day} role="listitem">
                <b>{w.day_ar ?? DAY_AR[w.day] ?? w.day}</b>
                <span>{w.type_ar ?? w.type ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
        {h.time_slot?.start && <p className="muted" style={{ margin: 0 }}>الوقت: <bdi className="num">{h.time_slot.start}–{h.time_slot.end}</bdi> <Conf c={h.time_slot.confidence} /></p>}
        {h.rule_ar && <Note>{h.rule_ar}</Note>}
        {h.no_vape_windows_ar && <Note>{h.no_vape_windows_ar}</Note>}
        {h.baseline_daily_minutes === null && h.kind === 'taper' && <p className="row" style={{ margin: 0, gap: 6 }}><Term id="baseline">خط الأساس</Term>: <Unknown text="لم يُحدَّد بعد" /></p>}
        {c && (
          <>
            <dl className="meta-dl">
              {COUNTER_ROWS.filter(([k]) => k in c).map(([k, label]) => {
                const v = (c as Record<string, unknown>)[k];
                return <div key={k} style={{ display: 'contents' }}><dt>{label}</dt><dd className="num">{typeof v === 'number' ? (k !== 'days_logged' && c.days_logged === 0 ? <Badge dashed>لا سجلات بعد</Badge> : v) : <Unknown />}</dd></div>;
              })}
              <dt><Term id="streak">السلسلة</Term> الحالية</dt><dd className="num">{started ? val(c.current_streak_days) : <Badge dashed>لم تبدأ</Badge>}</dd>
              <dt>أفضل <Term id="streak">سلسلة</Term></dt><dd className="num">{started ? val(c.best_streak_days) : <Badge dashed>لم تبدأ</Badge>}</dd>
            </dl>
            {typeof (c as Record<string, unknown>)['days_unknown'] === 'number' && ((c as Record<string, unknown>)['days_unknown'] as number) > 0 && (
              <p className="muted rv-fine" style={{ margin: 0 }}>«غير معروف» = يوم له سجل لكن النتيجة لم تُحدَّد؛ لا يُعدّ التزامًا ولا إخفاقًا.{(c as Record<string, unknown>)['days_unknown'] === c.days_logged ? ' كل الأيام المسجّلة هنا غير معروفة النتيجة.' : ''}</p>
            )}
          </>
        )}
        {log.length > 0 ? (
          <div>
            <small className="muted">آخر السجلات (<Term id="counter">عدّاد</Term> يومي)</small>
            <div className="habit-days" role="list" aria-label="سجل الالتزام">
              {log.map((e, i) => {
                const m = logMark(e);
                const date = typeof e['date'] === 'string' ? e['date'] : '';
                return <i key={i} role="listitem" className={m} title={`${date ? fmtDayFull(date) : ''}: ${m === 'yes' ? 'نعم' : m === 'no' ? 'لا' : 'غير معروف'}`} aria-label={`${date}: ${m}`} />;
              })}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>لا سجلات بعد.</p>
        )}
      </div>
    </Card>
  );
}
