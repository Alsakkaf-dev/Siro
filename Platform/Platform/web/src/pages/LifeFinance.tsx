import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Button, Card, CardHead, EmptyState, Segmented, Unknown } from '../ui/ui.js';
import { Donut, LegendRows, CapsuleBars } from '../widgets/charts.js';
import { Conf, Kpi, LifePage, LineChart, MissingInputsCards, Money, Note, fmtAt, fmtDay, fmtDayFull, money, num2, useLife, TblWrap } from '../life/lifeKit.js';
import { useContent } from '../sports/sportsKit.js';
import { ledgerSpendByDay, type InsightsDoc, type LedgerDoc } from '../../../shared/v8.js';
import { coverage, dailySpendRate, parseBalanceHistory, spendingByCategory, spendingByDay, UNCATEGORIZED, type Conf as ConfT, type Finance, type Tx } from '../../../shared/life.js';
import { Term } from '../glossary/glossary.js';

const KEY_TERM: Record<string, string> = { treasury: 'treasury', monthly: 'monthly_box', daily: 'daily_box', total: 'total_balance' };
const PAL = ['#4ADE80', '#4CC9F0', '#F2A93B', '#A78BFA', '#F472B6', '#F97362', '#5B45F0', '#C9A227'];

export default function LifeFinance() {
  const d = useLife(['finance']);
  const f = d.get<Finance>('finance');
  return (
    <LifePage title="المال" icon="database" names={['finance']} data={d} sub="أرصدة الصناديق والمصاريف كما صدّرها راشد — قراءة فقط." actions={<Button icon="edit" to="/life/commands?type=log_expense">سجّل مصروف</Button>}>
      {f && <Body f={f} />}
    </LifePage>
  );
}

function Body({ f }: { f: Finance }) {
  const tx = useMemo(() => f.recent_transactions ?? [], [f]);
  const items = f.balances_block?.items ?? [];
  const by = (k: string) => items.find((i) => i.key === k);
  const rate = useMemo(() => dailySpendRate(tx), [tx]);
  const cats = useMemo(() => spendingByCategory(tx), [tx]);
  const ledger = useContent<LedgerDoc>('ledger_full.json');
  const insights = useContent<InsightsDoc>('FINANCE_INSIGHTS_AR.json');
  const ledgerRows = ledger.data?.rows;
  const adj = insights.data?.spend_adjustments;
  const days = useMemo(() => (ledgerRows ? ledgerSpendByDay(ledgerRows, adj) : spendingByDay(tx)), [ledgerRows, adj, tx]);
  const burn = insights.data?.indicators.find((i) => i.id === 'daily_box_burn');
  const hist = useMemo(() => parseBalanceHistory(f), [f]);
  const cover = coverage(by('daily')?.amount, rate?.rate);
  return (
    <>
      <div className="kpis">
        {items.map((i) => (
          <Kpi key={i.key} label={KEY_TERM[i.key] ? <Term id={KEY_TERM[i.key]!}>{i.label_ar ?? i.key}</Term> : (i.label_ar ?? i.key)} value={<Money v={i.amount} c={i.confidence} />} tone={i.key === 'total' ? 'var(--accent)' : undefined} sub={i.key === 'total' ? `حتى ${fmtAt(f.balances_block?.as_of)}` : undefined} />
        ))}
      </div>
      {f.balances_block?.as_of_note_ar && <Note>{f.balances_block.as_of_note_ar}</Note>}

      <Card>
        <CardHead title={<Term id="balance_history">الأرصدة عبر الزمن</Term>} icon="chart" info="يُرسم فقط من الحقل balance_history في finance.json. لا نُنشئ نقاطًا من حركات أو تخمين." />
        <History hist={hist} />
      </Card>

      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="المصاريف حسب الفئة" icon="pie">
            <Conf c="محسوب" />
          </CardHead>
          {cats.length ? (
            <div className="stack">
              <div className="row" style={{ gap: 'var(--s-5)', alignItems: 'center' }}>
                <Donut segments={cats.map((c, i) => ({ label: c.category, value: c.total, color: c.category === UNCATEGORIZED ? '#8A92B2' : PAL[i % PAL.length]! }))} centerTop={num2(cats.reduce((s, c) => s + c.total, 0))} centerBottom="RM مصاريف" size={160} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <LegendRows rows={cats.map((c, i) => ({ label: `${c.category} (${c.count})`, value: c.total, max: cats[0]!.total, color: c.category === UNCATEGORIZED ? '#8A92B2' : PAL[i % PAL.length]!, right: <bdi>{money(c.total)}</bdi> }))} />
                </div>
              </div>
              <Note tone="warn">الفئات تصنيف مبدئي من راشد (وسمها «افتراض»)؛ غير المصنّف يبقى «{UNCATEGORIZED}» ولا نخمّنه. هذا المجموع يخص آخر {tx.length} حركة فقط، لا الشهر كله.</Note>
            </div>
          ) : (
            <EmptyState icon="pie" title="لا مصاريف مسجّلة" text="لم يُصدِّر راشد حركات مصاريف بعد." />
          )}
        </Card>

        <Card>
          <CardHead title={<>معدّل صرف «<Term id="daily_box">اليومية</Term>»</>} icon="timer">
            <Conf c="محسوب" />
          </CardHead>
          {f.daily_box_rate && typeof f.daily_box_rate.value === 'number' ? (
            <div className="stack">
              <div className="kpis">
                <Kpi label="المعدّل اليومي (راشد)" value={`${money(f.daily_box_rate.value)} / يوم`} sub={typeof f.daily_box_rate.total_spent_rm === 'number' ? `${money(f.daily_box_rate.total_spent_rm)} ÷ ${f.daily_box_rate.days} يوم (من ${fmtDay(f.daily_box_rate.window_from)} إلى ${fmtDay(f.daily_box_rate.window_to)})` : undefined} />
                <Kpi label="رصيد اليومية يكفي" value={typeof f.daily_box_rate.days_daily_box_lasts === 'number' ? `${f.daily_box_rate.days_daily_box_lasts} يوم` : <Unknown />} sub={typeof f.daily_box_rate.scheduled_per_day_rm === 'number' ? `التعبئة المجدولة ${money(f.daily_box_rate.scheduled_per_day_rm)} يوميًا` : undefined} />
              </div>
              {f.daily_box_rate.explanation_ar && <Note>{f.daily_box_rate.explanation_ar}</Note>}
              <small className="muted">رقم جاهز من راشد (لا يعيد الموقع حسابه) <Conf c={f.daily_box_rate.confidence} />. <Link to="/life/insights">كل المؤشرات</Link></small>
            </div>
          ) : burn && typeof burn.current_value === 'number' && burn.value_text_ar ? (
            <div className="stack">
              <div className="kpis">
                <Kpi label="المعدّل اليومي (راشد)" value={burn.value_text_ar.replace(/^حوالي\s*/, '≈ ')} sub={typeof burn.details?.['daily_spend_total_rm'] === 'number' ? `${money(burn.details['daily_spend_total_rm'] as number)} ÷ ${String(burn.details['days'])} يوم` : undefined} />
                <Kpi label="رصيد اليومية يكفي" value={(() => { const v = (burn.details?.['days_daily_box_lasts_at_this_burn'] as { value?: number } | undefined)?.value; return typeof v === 'number' ? `${v} يوم` : <Unknown />; })()} sub="بهذا المعدّل" />
              </div>
              <Note>{burn.formula_ar} {burn.confidence_note_ar}</Note>
              <small className="muted">أرقام جاهزة من راشد (لا يعيد الموقع حسابها). <Link to="/life/insights">كل المؤشرات</Link></small>
            </div>
          ) : rate ? (
            <div className="stack">
              <div className="kpis">
                <Kpi label="المعدّل اليومي" value={money(rate.rate)} sub={`${money(rate.total)} ÷ ${rate.days} يوم`} />
                <Kpi label="رصيد اليومية يكفي" value={cover === null ? <Unknown /> : `${cover} يوم`} sub={cover === null ? undefined : 'بهذا المعدّل'} />
              </div>
              <Note>تقدير الموقع (مؤشرات راشد غير متاحة): مصاريف محفظة «يومية» التي خصمت فعلًا مقسومة على الأيام بين أول وآخر حركة منها، شاملة. {rate.count} حركة.</Note>
            </div>
          ) : (
            <EmptyState icon="timer" title="لا بيانات كافية" text="لا توجد حركات يومية خصمت فعلًا لحساب المعدّل." />
          )}
        </Card>
      </div>

      <Card>
        <CardHead title="المصروف اليومي" icon="chart">
          <Conf c="محسوب" />
        </CardHead>
        <DaySpend days={days} />
        <p className="muted rv-fine" style={{ margin: '8px 0 0' }}>
          {ledgerRows ? <>من السجل الكامل ({ledger.data?.total_rows} صفًّا): مصاريف كل يوم بالمبلغ المسجّل{adj?.length ? '، وصف واحد مُعدَّل لتجنب تكرار مبلغ (' + adj.map((a) => `${money(a.recorded_amount)} ← ${money(a.counted_amount)}`).join('، ') + ')' : ''}. </> : <>من آخر {tx.length} حركة فقط (السجل الكامل غير متاح). </>}
          الفئات في هذه الصفحة <b>تقديرية</b> (تصنيف مبدئي من راشد)، والمجموع اليومي هنا لا يعتمد عليها.
        </p>
      </Card>

      <Card>
        <CardHead title={`الحركات الأخيرة (${tx.length})`} icon="list" />
        <Tx tx={tx} note={f.recent_transactions_note_ar} />
      </Card>

      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title={<Term id="auto_transfer">التحويل التلقائي</Term>} icon="refresh" />
          {f.schedule ? (
            <div className="stack">
              <p style={{ margin: 0 }}>
                <b>{f.schedule.title_ar}</b> <Conf c={f.schedule.time_confidence} />
                <br />
                <span className="muted">الوقت: {f.schedule.time_ar ?? '—'}</span>
              </p>
              <ul className="life-list">
                {(f.schedule.periods ?? []).map((p, i) => (
                  <li key={i}>
                    <bdi>{fmtDayFull(p.from)}</bdi> → <bdi>{p.to ? fmtDayFull(p.to) : 'مفتوح'}</bdi>: <b className="num">{money(p.per_day)}</b> / يوم <Conf c={p.confidence} /> <Badge tone={p.status === 'active' ? 'ok' : undefined}>{p.status === 'active' ? 'فعّالة' : p.status === 'open' ? 'مفتوحة' : p.status ?? '—'}</Badge>
                    {p.note_ar && <small className="muted"> — {p.note_ar}</small>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Unknown />
          )}
        </Card>
        <Card>
          <CardHead title={<Term id="open_item">بنود مفتوحة</Term>} icon="flag" />
          {f.open_items?.length ? (
            <ul className="life-list">
              {f.open_items.map((o) => (
                <li key={o.id}>
                  <b>{o.title_ar ?? 'بند مفتوح'}</b> {typeof o.amount === 'number' && <bdi className="num">{money(o.amount)}</bdi>} <Conf c={o.confidence} /> {o.applied_to_boxes === false && <Badge dashed>غير مُطبَّق على الصناديق</Badge>}
                  {o.detail_ar && <small className="muted" style={{ display: 'block' }}>{o.detail_ar}</small>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">لا بنود مفتوحة.</p>
          )}
        </Card>
      </div>

      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="الحسابات" icon="shield" />
          <ul className="life-list">
            {(f.accounts ?? []).map((a) => (
              <li key={a.key}>
                <b>{a.label_ar ?? a.key}</b>: <Money v={a.amount} c={a.confidence} /> {a.stated_at && <small className="muted">— أفاد به {fmtAt(a.stated_at)}</small>}
              </li>
            ))}
          </ul>
          {(f.receivables?.length ?? 0) > 0 && (
            <>
              <h3 style={{ marginBlock: 'var(--s-4) var(--s-2)' }}>ديون لك</h3>
              <ul className="life-list">
                {f.receivables!.map((r, i) => (
                  <li key={i}>
                    <b>{r.person_ar}</b>: {typeof r.amount === 'number' ? <Money v={r.amount} c={r.confidence} /> : <><Unknown text="المبلغ غير مؤكد" /> {typeof r.last_recorded_amount === 'number' && <small className="muted">آخر مبلغ مسجّل {money(r.last_recorded_amount)}</small>}</>} {r.note_ar && <small className="muted"> — {r.note_ar}</small>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card>
          <CardHead title="ملاحظات محسوبة وقواعد" icon="calc" />
          <ul className="life-list">
            {(f.computed_notes ?? []).map((n, i) => (
              <li key={i}>
                {n.text_ar} <Conf c={n.confidence} />
                {n.math && <code className="muted" style={{ display: 'block', direction: 'ltr', textAlign: 'start' }}>{n.math}</code>}
              </li>
            ))}
            {(f.rules_summary ?? []).map((n, i) => (
              <li key={'r' + i}>
                {n.text_ar} <Conf c={n.confidence} />
              </li>
            ))}
          </ul>
          {f.verification?.method_ar && <Note>{f.verification.method_ar}</Note>}
        </Card>
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
        لتسجيل مصروف: <Link to="/life/commands?type=log_expense">أنشئ مسودة أمر</Link> — لا يُنفَّذ إلا بموافقتك الصريحة في المحادثة.
      </p>
      <MissingInputsCards title={f.planning_inputs_title_ar} data={f.planning_inputs} />
    </>
  );
}

function History({ hist }: { hist: ReturnType<typeof parseBalanceHistory> }) {
  const n = hist.points.length;
  const omitted = hist.omitted.length ? (
    <details className="omit-box">
      <summary>نطاقات تركها راشد خارج السجل ({hist.omitted.length}) — لماذا لا يبدأ الرسم من أقدم صف؟</summary>
      <ul>
        {hist.omitted.map((o, i) => (
          <li key={i}>
            {o.rows && <>الصفوف <bdi className="num">{o.rows}</bdi>{o.dates ? <> ({o.dates})</> : null}: </>}
            {!o.rows && o.dates && <>{o.dates}: </>}
            {o.reason}
          </li>
        ))}
      </ul>
    </details>
  ) : null;
  if (n >= 2) {
    const mk = (key: 'treasury' | 'monthly' | 'daily' | 'total', name: string, color: string) => ({ key, name, color, points: hist.points.map((p) => ({ t: p.t, v: p[key] })) });
    const rows = [...hist.points].reverse();
    const dateOnly = hist.points.filter((p) => p.dateOnly).length;
    return (
      <div className="stack">
        {hist.title && <p className="muted" style={{ margin: 0 }}>{hist.title}</p>}
        <LineChart ariaLabel="الأرصدة عبر الزمن" fmt={(v) => money(v)} series={[mk('total', 'المجموع', 'var(--accent)'), mk('treasury', 'الخزينة', '#4ADE80'), mk('monthly', 'الشهري', '#F2A93B'), mk('daily', 'اليومية', '#4CC9F0')].filter((s) => s.points.some((p) => p.v !== null))} />
        <Note>
          {n} نقطة مسجّلة من الحقل <code>{hist.field}</code>{hist.skipped ? ` — تم تجاهل ${hist.skipped} إدخالًا غير مفهوم` : ''}. القيم الفارغة تقطع الخط ولا تُعامل كصفر.
          {dateOnly > 0 && ` ${dateOnly === 1 ? 'نقطة بلا ساعة' : `${dateOnly} نقاط بلا ساعة`} (تاريخ فقط) فتوضع عند ظهر ذلك اليوم.`}
          {new Set(hist.points.map((p) => p.t)).size < n && ' توجد نقاط بنفس اللحظة؛ يُظهر المؤشر آخرها ويعرضها كلها الجدول.'}
        </Note>
        {omitted}
        {hist.method && (
          <details className="omit-box">
            <summary>كيف حُسب هذا السجل (طريقة راشد)</summary>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>{hist.method}</p>
          </details>
        )}
        <TblWrap label="نقاط سجل الأرصدة">
          <table className="life-tbl">
            <thead><tr><th>التاريخ</th><th>الحدث</th><th className="n"><Term id="treasury">الخزينة</Term></th><th className="n"><Term id="monthly_box">الشهري</Term></th><th className="n"><Term id="daily_box">اليومية</Term></th><th className="n"><Term id="total_balance">المجموع</Term></th></tr></thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={`${p.t}-${i}`}>
                  <td><bdi>{p.dateOnly ? fmtDayFull(p.date) : fmtAt(new Date(p.t).toISOString())}</bdi>{p.dateOnly && <small className="muted" style={{ display: 'block' }}>بلا ساعة</small>}</td>
                  <td>{p.event ?? '—'}{p.note && <small className="muted" style={{ display: 'block' }}>{p.note}</small>}</td>
                  <td className="n num">{money(p.treasury)}</td>
                  <td className="n num">{money(p.monthly)}</td>
                  <td className="n num">{money(p.daily)}</td>
                  <td className="n num"><b>{money(p.total)}</b> <Conf c={p.confidence as ConfT} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TblWrap>
      </div>
    );
  }
  if (n === 1) {
    const p = hist.points[0]!;
    return (
      <div className="stack">
        <div className="empty-hist">
          <strong>نقطة واحدة فقط حتى الآن</strong>
          <span className="muted">يلزم نقطتان على الأقل لرسم خط. النقطة المسجّلة: {fmtDayFull(p.date)} — المجموع {money(p.total)}.</span>
        </div>
        {omitted}
      </div>
    );
  }
  if (hist.field) {
    return (
      <div className="stack">
        <div className="empty-hist">
          <strong>الحقل {hist.field} موجود لكنه لا يحوي نقاطًا مفهومة</strong>
          <span className="muted">{hist.skipped ? `تم تجاهل ${hist.skipped} إدخالًا لعدم فهم شكله (يلزم تاريخ وأرقام الصناديق).` : 'القائمة فارغة.'} لن نرسم شيئًا قبل أن تصل بيانات صالحة.</span>
        </div>
        {omitted}
      </div>
    );
  }
  return (
    <div className="empty-hist">
      <strong>لم يُسجَّل سجل الأرصدة بعد</strong>
      <span className="muted">ملف المال الحالي يعرض رصيد اللحظة فقط. وافقتَ على أن يضيف راشد حقل <code>balance_history</code>؛ ما إن يظهر في finance.json يُرسم هذا المخطط تلقائيًا. لا نرسم خطًا من حركات أو تقدير.</span>
    </div>
  );
}

function DaySpend({ days }: { days: { date: string; total: number }[] }) {
  const [sel, setSel] = useState<string | null>(null);
  if (!days.length) return <p className="muted">لا مصاريف مسجّلة.</p>;
  const shown = days.slice(-21);
  const cur = shown.find((x) => x.date === sel) ?? shown[shown.length - 1]!;
  return (
    <div className="stack">
      <CapsuleBars ariaLabel="المصروف اليومي" selected={cur.date} onSelect={setSel} data={shown.map((x) => ({ key: x.date, label: fmtDay(x.date).split(' ')[0] ?? '', value: x.total, tip: money(x.total) }))} unit=" RM" />
      <p className="muted" style={{ margin: 0 }}>
        {fmtDayFull(cur.date)}: <b className="num">{money(cur.total)}</b>
      </p>
    </div>
  );
}

function Tx({ tx, note }: { tx: Tx[]; note?: string | undefined }) {
  const [type, setType] = useState<'all' | 'expense' | 'other'>('all');
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q')?.slice(0, 80) ?? '');
  const loc = useLocation();
  useEffect(() => {
    const v = new URLSearchParams(loc.search).get('q');
    if (v !== null) setQ(v.slice(0, 80));
  }, [loc.search]);
  const [limit, setLimit] = useState(15);
  const rows = useMemo(
    () =>
      [...tx]
        .sort((a, b) => b.date.localeCompare(a.date) || (b.order ?? 0) - (a.order ?? 0))
        .filter((t) => (type === 'all' ? true : type === 'expense' ? t.type === 'expense' : t.type !== 'expense'))
        .filter((t) => !q.trim() || `${t.label_ar ?? ''} ${t.category_ar ?? ''} ${t.wallet ?? ''}`.includes(q.trim())),
    [tx, type, q],
  );
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Segmented label="نوع الحركة" value={type} onChange={(v) => { setType(v); setLimit(15); }} options={[{ value: 'all', label: 'الكل' }, { value: 'expense', label: 'مصاريف' }, { value: 'other', label: 'غيرها' }]} />
        <input className="input" style={{ maxInlineSize: 240 }} placeholder="بحث في الوصف أو الفئة" aria-label="بحث في الحركات" value={q} onChange={(e) => { setQ(e.target.value); setLimit(15); }} />
      </div>
      {rows.length ? (
        <TblWrap label="الحركات الأخيرة">
          <table className="life-tbl">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>الفئة</th>
                <th>المحفظة</th>
                <th className="n">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((t) => (
                <tr key={t.id}>
                  <td>
                    <bdi>{fmtDay(t.date)}</bdi>
                  </td>
                  <td>
                    {t.label_ar ?? '—'} <Conf c={t.confidence} />
                    <small className="muted" style={{ display: 'block' }}>
                      {t.type_ar ?? t.type}
                    </small>
                  </td>
                  <td>{t.category_ar ? <>{t.category_ar} <Conf c={t.category_confidence} /></> : <span className="muted">{UNCATEGORIZED}</span>}</td>
                  <td>{t.wallet ?? '—'}</td>
                  <td className="n num">
                    <span className={typeof t.cash_delta === 'number' ? (t.cash_delta < 0 ? 'neg' : t.cash_delta > 0 ? 'pos' : '') : ''}>{money(t.amount)}</span>
                    {t.cash_delta === 0 && <small className="muted" style={{ display: 'block' }}>لم يخصم من صندوق</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TblWrap>
      ) : (
        <EmptyState icon="search" title="لا حركات مطابقة" text="غيّر الفلتر أو البحث." />
      )}
      {rows.length > limit && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button onClick={() => setLimit((x) => x + 15)}>عرض المزيد ({rows.length - limit} متبقية)</Button>
        </div>
      )}
      {note && <Note>{note}</Note>}
    </div>
  );
}
