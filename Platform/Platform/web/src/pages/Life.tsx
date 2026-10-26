import { Link } from 'react-router-dom';
import { Badge, Card, CardHead, Unknown } from '../ui/ui.js';
import { LegendRows } from '../widgets/charts.js';
import { useNow } from '../widgets/tiles.js';
import { Conf, FreshBadge, Kpi, LifePage, Money, Note, PageLinks, fmtAt, money, num1, useLife } from '../life/lifeKit.js';
import { hm } from './LifeRoutine.js';
import { coverage, countMissing, dailySpendRate, missingInputs, LIFE_FILE_LABEL, nowAndNext, PRAYER_AR, PRAYER_KEYS, weightProgress, type Body, type Finance, type Habits, type Prayers, type Routine, type Summary } from '../../../shared/life.js';
import { Term } from '../glossary/glossary.js';

const ALL = ['dashboard_summary', 'finance', 'prayers', 'habits', 'body', 'routine'] as const;

export default function Life() {
  const d = useLife([...ALL]);
  const now = useNow(30_000);
  const fin = d.get<Finance>('finance');
  const pr = d.get<Prayers>('prayers');
  const hb = d.get<Habits>('habits');
  const bd = d.get<Body>('body');
  const rt = d.get<Routine>('routine');
  const sm = d.get<Summary>('dashboard_summary');
  const items = fin?.balances_block?.items ?? [];
  const by = (k: string) => items.find((i) => i.key === k);
  const rate = fin ? dailySpendRate(fin.recent_transactions ?? []) : null;
  const cover = coverage(by('daily')?.amount, rate?.rate);
  const nn = rt ? nowAndNext(rt, now) : null;
  const prog = weightProgress(bd);
  const q = pr?.qada;
  const maxQ = Math.max(1, ...PRAYER_KEYS.map((k) => q?.remaining?.[k]?.count ?? 0));
  const loops = sm?.open_loops_count;
  const miss = [
    { to: '/life/finance', label: 'المال', n: countMissing(missingInputs(fin?.planning_inputs)), all: missingInputs(fin?.planning_inputs).length },
    { to: '/life/habits', label: 'العادات', n: countMissing(missingInputs(hb?.unrecorded_inputs)), all: missingInputs(hb?.unrecorded_inputs).length },
    { to: '/life/body', label: 'الجسم', n: countMissing(missingInputs(bd?.unrecorded_inputs)), all: missingInputs(bd?.unrecorded_inputs).length },
  ].filter((m) => m.all > 0);
  const missTotal = miss.reduce((s, m) => s + m.n, 0);
  return (
    <LifePage title="الحياة" icon="heart" names={[...ALL]} data={d} sub="نظرة واحدة على المال والصلاة والعادات والروتين والجسم — قراءة فقط من صادرات راشد." crumbs={[{ label: 'الحياة' }]}>
      <div className="kpis">
        <Kpi label="مجموع الأرصدة" value={<Money v={by('total')?.amount} c={by('total')?.confidence} />} sub={fin?.balances_block?.as_of ? `حتى ${fmtAt(fin.balances_block.as_of)}` : undefined} tone="var(--life)" icon="database" />
        <Kpi label="رصيد اليومية" value={<Money v={by('daily')?.amount} c={by('daily')?.confidence} />} sub={cover !== null ? <>يكفي ≈ {cover} يوم بمعدّل الصرف <Conf c="محسوب" /></> : 'لا يمكن حساب الكفاية'} icon="timer" />
        <Kpi label="القضاء المتبقي" value={typeof q?.total_remaining === 'number' ? q.total_remaining : <Unknown />} sub="صلاة" icon="clock" tone="#4CC9F0" />
        <Kpi label="الوزن الحالي" value={(bd?.latest_weight_kg ?? bd?.latest_recorded_weight?.value_kg) != null ? `${num1(bd?.latest_weight_kg ?? bd?.latest_recorded_weight?.value_kg)} كغ` : <Unknown />} sub={prog ? <>باقي {num1(prog.remaining)} كغ للهدف <Conf c="محسوب" /></> : bd?.goal_kg ? `الهدف ${num1(bd.goal_kg)} كغ` : undefined} icon="target" tone="#F2A93B" />
      </div>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="الآن والتالي" icon="clock">
            <Link to="/life/routine">الروتين</Link>
          </CardHead>
          {nn ? (
            <div className="now-card">
              {nn.current.length ? nn.current.map((c) => <div key={c.b.name + c.start}><span className="muted">الآن · <bdi className="num">{hm(c.start)}–{hm(c.end)}</bdi></span><div className="big">{c.b.name}</div></div>) : <div className="big muted">لا كتلة حالية</div>}
              {nn.next ? <p style={{ margin: 0 }}>التالي: <b>{nn.next.b.name}</b> عند <bdi className="num">{hm(nn.next.start)}</bdi></p> : <p className="muted" style={{ margin: 0 }}>لا كتل أخرى اليوم.</p>}
            </div>
          ) : <p className="muted">ملف الروتين غير متاح.</p>}
        </Card>
        <Card>
          <CardHead title="العادات" icon="check">
            <Link to="/life/habits">التفاصيل</Link>
          </CardHead>
          {hb ? (
            <div className="stack">
              <p style={{ margin: 0 }}>{hb.status?.started ? <Badge tone="ok">بدأت</Badge> : <Badge tone="warn">لم تبدأ بعد</Badge>} <Conf c={hb.status?.started_confidence} /></p>
              <ul className="life-list">
                {(hb.habits ?? []).filter((h) => h.today).slice(0, 3).map((h) => (
                  <li key={h.key}><b>{h.name_ar}</b>: {h.today?.reduction_min != null ? <bdi className="num">حد {h.today.reduction_min} د</bdi> : h.today?.sugar_limit_g != null ? <bdi className="num">حد {h.today.sugar_limit_g} غ</bdi> : h.today?.type_ar ?? '—'}</li>
                ))}
              </ul>
              {hb.status?.note_ar && <Note>{hb.status.note_ar}</Note>}
            </div>
          ) : <p className="muted">ملف العادات غير متاح.</p>}
        </Card>
      </div>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title={<><Term id="qada">القضاء</Term> لكل صلاة</>} icon="layers">
            <Link to="/life/prayers">التفاصيل</Link>
          </CardHead>
          {q ? <LegendRows rows={PRAYER_KEYS.map((k, i) => ({ label: PRAYER_AR[k], value: q.remaining?.[k]?.count ?? 0, max: maxQ, color: ['#4CC9F0', '#F2A93B', '#F97362', '#A78BFA', '#4ADE80'][i]!, right: q.remaining?.[k]?.count ?? <Unknown /> }))} /> : <p className="muted">ملف الصلاة غير متاح.</p>}
        </Card>
        <Card>
          <CardHead title={<Term id="open_item">بنود مفتوحة</Term>} icon="flag">
            <Link to="/life/finance">المال</Link>
          </CardHead>
          <ul className="life-list">
            <li>بنود مالية مفتوحة: <b className="num">{fin?.open_items?.length ?? sm?.open_finance_items?.items?.length ?? '—'}</b></li>
            {loops && <li>حلقات مفتوحة أو معلّقة: <b className="num">{loops.open_or_waiting ?? '—'}</b> من {loops.total_rows ?? '—'} <Conf c={loops.confidence} /></li>}
            {rate && <li>معدّل صرف اليومية: <b className="num">{money(rate.rate)}</b> / يوم <Conf c="محسوب" /></li>}
          </ul>
        </Card>
      </div>
      {miss.length > 0 && (
        <Card>
          <CardHead title="بيانات ناقصة" icon="help" info="حقول فارغة عند راشد بانتظار أن تقولها أنت. لا نملؤها ولا نخمّنها.">
            <Badge tone={missTotal ? 'warn' : 'ok'}>{missTotal ? `${missTotal} غير مسجّل` : 'مسجّلة'}</Badge>
          </CardHead>
          <div className="fresh-rows">
            {miss.map((m) => (
              <div key={m.to}>
                <Link to={m.to}>{m.label}</Link>
                <span className="num">{m.n} من {m.all} غير مسجّل</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <CardHead title="حداثة البيانات" icon="refresh">
          <Link to="/life/settings">الإعدادات</Link>
        </CardHead>
        <div className="fresh-rows">
          {d.status?.files.map((f) => (
            <div key={f.name}>
              <span>{LIFE_FILE_LABEL[f.name]}</span>
              <FreshBadge f={f} />
            </div>
          ))}
        </div>
      </Card>
      <PageLinks
        items={[
          { to: '/life/finance', label: 'المال', icon: 'database', sub: 'أرصدة وحركات وفئات' },
          { to: '/life/prayers', label: 'الصلاة', icon: 'clock', sub: 'حضور وقضاء' },
          { to: '/life/habits', label: 'العادات', icon: 'check', sub: 'خطط وعدادات' },
          { to: '/life/routine', label: 'الروتين', icon: 'timer', sub: 'جدول اليوم' },
          { to: '/life/body', label: 'الجسم', icon: 'target', sub: 'الوزن والهدف' },
          { to: '/life/alternatives', label: 'بدائل العادات', icon: 'zap', sub: 'ماذا أسوي بدل العادة؟' },
          { to: '/life/commands', label: 'الأوامر', icon: 'mail', sub: 'مسودات لراشد' },
        ]}
      />
    </LifePage>
  );
}
