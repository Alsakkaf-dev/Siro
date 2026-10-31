import { useState } from 'react';
import { UNIT_AR } from '../../../shared/plain.js';
import { useApp } from '../core/app-context.js';
import { life } from '../lib/api.js';
import { Button, Card, CardHead, Unknown } from '../ui/ui.js';
import { Ring } from '../widgets/charts.js';
import { Conf, Kpi, LifePage, LineChart, MissingInputsCards, Note, fmtDayFull, num1, useLife, TblWrap } from '../life/lifeKit.js';
import { weightProgress, type Body } from '../../../shared/life.js';

export default function LifeBody() {
  const d = useLife(['body']);
  const b = d.get<Body>('body');
  return (
    <LifePage title="الجسم والوزن" icon="target" names={['body']} data={d} sub="الوزن والقياسات.">
      <QuickWeight onDone={d.reload} />
      {b && <Inner b={b} />}
    </LifePage>
  );
}

/** تسجيل وزن اليوم مباشرة. */
function QuickWeight({ onDone }: { onDone: () => void }) {
  const { toast } = useApp();
  const [v, setV] = useState('');
  const save = async (): Promise<void> => {
    const n = Number(v);
    try {
      const r = await life.log('log_weight', { date: new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10), weight_kg: n });
      toast(`سُجّل: ${r.event.summary}`, { kind: 'ok', action: { label: 'تراجع', run: () => void life.undo(r.event.id).then(onDone) } });
      setV('');
      onDone();
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <Card>
      <CardHead title="سجّل وزن اليوم" icon="target" />
      <form className="row" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label className="sr-only" htmlFor="qw">الوزن بالكيلوغرام</label>
        <input id="qw" className="input" inputMode="decimal" placeholder="مثال: 83.5" value={v} onChange={(e) => setV(e.target.value)} style={{ maxInlineSize: 160 }} />
        <span className="muted">كغ</span>
        <Button variant="primary" type="submit" disabled={!v.trim()}>سجّل</Button>
      </form>
    </Card>
  );
}

function Inner({ b }: { b: Body }) {
  const prog = weightProgress(b);
  const latestKg = b.latest_weight_kg ?? b.latest_recorded_weight?.value_kg ?? null;
  const latestDate = b.latest_weight_date ?? b.latest_recorded_weight?.date;
  const gp = b.goal_progress;
  const hist = [...(b.weight_history ?? [])].sort((x, y) => x.date.localeCompare(y.date));
  return (
    <>
      <div className="kpis">
        <Kpi label="آخر وزن مسجّل" value={latestKg != null ? `${num1(latestKg)} كغ` : <Unknown />} sub={<>{latestDate ? fmtDayFull(latestDate) : ''} <Conf c={b.latest_weight_confidence ?? b.latest_recorded_weight?.confidence} /></>} tone="var(--life)" icon="target" />
        <Kpi label="الهدف" value={b.goal_kg != null ? `${num1(b.goal_kg)} كغ` : <Unknown />} sub={<Conf c={b.goal_kg_confidence} />} />
        <Kpi label="المتبقي للهدف" value={prog ? `${num1(prog.remaining)} كغ` : <Unknown />} sub={prog ? <>محسوب <Conf c="محسوب" /></> : 'يحتاج وزنًا مرجعيًا وهدفًا وقراءة'} />
      </div>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="التقدّم نحو الهدف" icon="flag">
            <Conf c="محسوب" />
          </CardHead>
          {prog ? (
            <div className="row" style={{ gap: 'var(--s-5)' }}>
              <Ring value={prog.pct} size={112} stroke={10} color="var(--life)" label={`${Math.round(prog.pct)}%`} sub="من المسافة" />
              <ul className="life-list" style={{ flex: 1, minWidth: 180 }}>
                <li>خط الأساس{gp?.baseline_date ? ` (${fmtDayFull(gp.baseline_date)})` : ''}: <b className="num">{num1(prog.baseline)} كغ</b></li>
                <li>آخر وزن مسجّل: <b className="num">{num1(prog.latest)} كغ</b></li>
                <li>{prog.lost >= 0 ? 'النزول عن خط الأساس' : 'الزيادة عن خط الأساس'}: <b className="num">{num1(Math.abs(prog.lost))} كغ</b> <small className="muted">(غير المتبقي للهدف)</small></li>
                <li>الهدف: <b className="num">{num1(prog.goal)} كغ</b></li>
                <li>المتبقي للهدف: <b className="num">{num1(prog.remaining)} كغ</b></li>
              </ul>
            </div>
          ) : (
            <p className="muted">لا تكفي الأرقام لحساب التقدّم (يلزم وزن مرجعي وهدف وقراءة أحدث). لا نخمّن.</p>
          )}
          {gp?.arithmetic && <Note>{gp.arithmetic}</Note>}
          {gp?.note_ar && <Note>{gp.note_ar}</Note>}
        </Card>
        <Card>
          <CardHead title="القياسات" icon="list" />
          <ul className="life-list">
            {(b.items ?? []).map((i) => (
              <li key={i.key}>
                <b>{i.label_ar ?? i.key}</b>: {typeof i.value === 'number' ? <bdi className="num">{i.approx ? '≈ ' : ''}{i.value} {i.unit ? UNIT_AR[i.unit] ?? i.unit : ''}</bdi> : <Unknown />} <Conf c={i.confidence} />
                {i.date && <small className="muted"> — {fmtDayFull(i.date)}</small>}
                {i.note_ar && <small className="muted" style={{ display: 'block' }}>{i.note_ar}</small>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <CardHead title="سجل الوزن" icon="chart" />
        {hist.length >= 2 ? (
          <LineChart fitY ariaLabel="الوزن عبر الزمن" fmt={(v) => `${num1(v)} كغ`} series={[{ key: 'w', name: 'الوزن (كغ)', color: 'var(--life)', points: hist.map((h) => ({ t: Date.parse(`${h.date}T12:00:00+08:00`), v: h.value_kg })) }]} />
        ) : (
          <p className="muted">يلزم قراءتان على الأقل لرسم المنحنى.</p>
        )}
        {hist.length >= 2 && <p className="muted rv-fine" style={{ margin: '6px 0 0' }}>محور الأوزان لا يبدأ من الصفر (يُقرّب النطاق من القراءات كي يظهر الفرق)؛ الأرقام الدقيقة في الجدول.</p>}
        {hist.length > 0 && (
          <TblWrap label="سجل الوزن">
            <table className="life-tbl">
              <thead><tr><th>التاريخ</th><th className="n">الوزن</th><th>الحالة</th></tr></thead>
              <tbody>
                {[...hist].reverse().map((h) => (
                  <tr key={h.date + h.value_kg}>
                    <td><bdi>{fmtDayFull(h.date)}</bdi></td>
                    <td className="n num">{num1(h.value_kg)} كغ <Conf c={h.confidence} /></td>
                    <td>{h.status_ar ?? ''}{h.note_ar && <small className="muted" style={{ display: 'block' }}>{h.note_ar}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TblWrap>
        )}
        {b.weight_history_note_ar && <Note tone="warn">{b.weight_history_note_ar}</Note>}
      </Card>
      <MissingInputsCards title={b.unrecorded_inputs_title_ar} data={b.unrecorded_inputs} />
    </>
  );
}
