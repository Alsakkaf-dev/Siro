import '../styles/kitchen.css';
import '../styles/calendar.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { KitchenChips, StoreSelect, storeName, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { applyCycle, fetchPlan, previewCycle, setCartLine, type CycleOut, type PlanDayRow } from '../kitchen/store.js';
import { INGREDIENT_BY_SLUG, LAW, STORES, compareStores, fmtKcal, fmtNum, fmtRM, shoppingList, unitAbbr } from '../../../shared/kitchen/index.js';
import { addDays, isDate, outlookDayLaw, todayKL, type CalEvent } from '../../../shared/calendar/index.js';
import { fetchView } from '../calendar/api.js';
import { DayMeals } from '../calendar/DayMeals.js';
import { dayName, fmtDay } from '../calendar/fmt.js';

type Tab = 'day' | 'cycle' | 'shop' | 'log';
const TABS: readonly Tab[] = ['day', 'cycle', 'shop', 'log'];
const dayDiff = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000) + 1;

/** وحدة الوجبات في الجدول (K-M10): اليوم، تطبيق «دورتي» على مدى، قائمة التسوّق من الجدول، والسجل التغذوي. */
export default function CalendarMeals() {
  const [tab, setTab] = useUrlParam<Tab>('tab', 'day', TABS);
  return (
    <div className="page kitchen cal-page">
      <PageHead title="وجبات الجدول" icon="utensils" sub="ثلاث خانات في اليوم: فطور وغداء وعشاء. القانون حاجز: لا يُحفظ يوم خارج المجال. الناتج اقتراح داخل المنصة فقط." actions={<KitchenChips />} />
      <div className="cal-bar"><Segmented<Tab> label="القسم" value={tab} onChange={setTab} options={[{ value: 'day', label: 'اليوم' }, { value: 'cycle', label: 'الدورة' }, { value: 'shop', label: 'قائمة التسوّق' }, { value: 'log', label: 'السجل التغذوي' }]} /></div>
      {tab === 'day' && <DayTab />}
      {tab === 'cycle' && <CycleTab />}
      {tab === 'shop' && <ShopTab />}
      {tab === 'log' && <LogTab />}
    </div>
  );
}

function DayTab() {
  const [dateRaw, setDate] = useUrlParam<string>('date', '');
  const date = isDate(dateRaw) ? dateRaw : todayKL();
  const [events, setEvents] = useState<CalEvent[] | undefined>(undefined);
  useEffect(() => { setEvents(undefined); void fetchView(date, date, 'auto').then((r) => setEvents(r.data.events)).catch(() => setEvents(undefined)); }, [date]);
  return (
    <Card>
      <CardHead title={fmtDay(date)} icon="calendar" />
      <div className="row kt-plan-date">
        <Button size="sm" icon="right" aria-label="اليوم السابق" onClick={() => setDate(addDays(date, -1))} />
        <input className="input" type="date" aria-label="تاريخ اليوم" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} dir="ltr" />
        <Button size="sm" icon="left" aria-label="اليوم التالي" onClick={() => setDate(addDays(date, 1))} />
        {date !== todayKL() && <Button size="sm" onClick={() => setDate('')}>اليوم</Button>}
        <span className="grow" />
        <Link to={`/calendar?view=day&date=${date}`}>افتح اليوم في الجدول</Link>
      </div>
      <DayMeals date={date} {...(events ? { events } : {})} />
    </Card>
  );
}

function CycleTab() {
  const { toast } = useApp();
  const act = useAct();
  const k = useKitchen();
  const [from, setFrom] = useState(todayKL());
  const [to, setTo] = useState(addDays(todayKL(), 29));
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [pre, setPre] = useState<CycleOut | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const valid = isDate(from) && isDate(to) && to >= from && dayDiff(from, to) <= 120;
  useEffect(() => {
    if (!valid) { setPre(null); setErr(isDate(from) && isDate(to) ? 'المدى غير صالح (حتى 120 يومًا)' : ''); return; }
    const my = ++seq.current;
    const t = setTimeout(() => { previewCycle({ from, to, scale, auto_fit: autoFit }).then((r) => { if (my === seq.current) { setPre(r); setErr(''); } }).catch((e: Error) => { if (my === seq.current) { setPre(null); setErr(e.message); } }); }, 200);
    return () => clearTimeout(t);
  }, [from, to, scale, autoFit, valid, k.version]);
  const doApply = async (): Promise<void> => {
    setBusy(true);
    try {
      const r = await applyCycle({ from, to, scale, auto_fit: autoFit, overwrite });
      toast(`طُبّقت الدورة على ${r.saved} يومًا كاقتراحات داخل المنصة`, { kind: 'ok' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'تعذّر التطبيق', { kind: 'error' });
    } finally { setBusy(false); }
  };
  void act;
  return (
    <Card>
      <CardHead title="تطبيق دورة الأيام الثلاثة على مدى" icon="layers" info="الدورة المطبّقة في Outlook: اليوم = (التاريخ − 2026-10-23) mod 3. المعاينة تعرض مجموع كل يوم وحالة القانون قبل الحفظ، ويُرفض الدفعة كلها إن خالف يوم." />
      <div className="row kt-filter-row">
        <label className="kt-inline">من <input className="input" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="من تاريخ" /></label>
        <label className="kt-inline">إلى <input className="input" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} aria-label="إلى تاريخ" /></label>
        <label className="kt-inline">الحصة <select className="select" value={scale} onChange={(e) => setScale(Number(e.target.value))} disabled={autoFit} aria-label="معامل الحصة">{[0.5, 0.75, 1, 1.25, 1.5].map((s) => <option key={s} value={s}>×{s}</option>)}</select></label>
        <label className="kt-check"><input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} data-testid="cycle-autofit" /> ملاءمة تلقائية لكل يوم</label>
        <label className="kt-check"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> استبدل الأيام المحفوظة</label>
      </div>
      {err && <p className="callout danger" role="alert">{err}</p>}
      {pre && (
        <>
          <p data-testid="cycle-summary">{pre.violations === 0 ? <Badge tone="ok"><Icon name="check" size={12} /> كل الأيام الـ<span className="num">{fmtNum(pre.days, 0)}</span> داخل المجال</Badge> : <Badge tone="danger"><Icon name="warn" size={12} /> <span className="num">{fmtNum(pre.violations, 0)}</span> يومًا مخالفًا — ستُرفض الدفعة كلها</Badge>} {pre.conflicts > 0 && <Badge tone="warn">{fmtNum(pre.conflicts, 0)} يومًا محفوظًا مسبقًا</Badge>}</p>
          <div className="cal-wrap" role="region" aria-label="معاينة الدورة" tabIndex={0} style={{ maxBlockSize: '46vh' }}>
            <table className="cy-table" data-testid="cycle-table">
              <thead><tr><th>التاريخ</th><th>يوم الدورة</th><th>السعرات</th><th>الحالة</th><th /></tr></thead>
              <tbody>
                {pre.rows.map((r) => (
                  <tr key={r.date} className={r.ok ? '' : 'bad'}>
                    <td className="num" dir="ltr">{r.date} <small className="muted">{dayName(r.date)}</small></td>
                    <td className="num">{r.cycle_day}</td>
                    <td className="num" dir="ltr">{fmtKcal(r.total_kcal)}</td>
                    <td>{r.ok ? <Badge tone="ok"><Icon name="check" size={11} /> داخل المجال</Badge> : <Badge tone="danger"><Icon name="warn" size={11} /> {r.message}</Badge>}</td>
                    <td>{r.existing && <Badge dashed>محفوظ</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row"><Button variant="primary" icon="save" disabled={busy || !pre.ok || (pre.conflicts > 0 && !overwrite) || k.offline} onClick={() => void doApply()} data-testid="cycle-apply">طبّق الدورة (اقتراحات داخل المنصة)</Button><small className="muted">لا يُكتب شيء في Outlook.</small></div>
        </>
      )}
    </Card>
  );
}

function usePlanRange(from: string, days: number): PlanDayRow[] | null {
  const k = useKitchen();
  const [rows, setRows] = useState<PlanDayRow[] | null>(null);
  useEffect(() => { if (days < 1 || days > 400) { setRows([]); return; } let live = true; void fetchPlan(from, days).then((r) => live && setRows(r.days)).catch(() => live && setRows([])); return () => { live = false; }; }, [from, days, k.version]);
  return rows;
}

function ShopTab() {
  const k = useKitchen();
  const act = useAct();
  const [from, setFrom] = useState(todayKL());
  const [to, setTo] = useState(addDays(todayKL(), 6));
  const n = isDate(from) && isDate(to) && to >= from ? dayDiff(from, to) : 0;
  const days = usePlanRange(from, n);
  const list = useMemo(() => shoppingList((days ?? []).filter((d) => d.date <= to), Object.fromEntries(k.pantry.map((p) => [p.ingredient, p.grams]))), [days, to, k.pantry]);
  const cmp = useMemo(() => (list.cart.length ? compareStores(list.cart, k.idx, STORES, k.store) : null), [list.cart, k.idx, k.store]);
  const addAll = async (): Promise<void> => {
    for (const l of list.cart) if (!(await act(() => setCartLine(l.ingredient, l.qty, l.unit, null)))) return;
    await Promise.resolve();
  };
  return (
    <Card>
      <CardHead title="قائمة التسوّق من الجدول" icon="list" info="إجمالي مكوّنات الأيام المحفوظة في المدى بالغرام، ناقص المخزن. المكوّنات القليلة (ملح/كمون) تُشترى فقط إن لم يوجد منها شيء." />
      <div className="row kt-filter-row">
        <label className="kt-inline">من <input className="input" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="من تاريخ" /></label>
        <label className="kt-inline">إلى <input className="input" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} aria-label="إلى تاريخ" /></label>
        <StoreSelect label="السوق" />
      </div>
      {days === null ? <p className="muted">جارٍ التحميل…</p> : days.length === 0 ? <EmptyState icon="calendar" title="لا أيام محفوظة في هذا المدى" text="احفظ أيامًا من تبويب «اليوم» أو طبّق الدورة أولًا." /> : (
        <>
          <p><Badge>{fmtNum(list.days, 0)} يومًا محفوظًا</Badge> · يحتاج شراء: <b className="num">{fmtNum(list.cart.length, 0)}</b> صنفًا</p>
          <div className="cal-wrap" tabIndex={0} role="region" aria-label="قائمة التسوّق" style={{ maxBlockSize: '46vh' }}>
            <table className="cy-table" data-testid="shop-table">
              <thead><tr><th>المكوّن</th><th>المطلوب (غ)</th><th>في المخزن (غ)</th><th>الناقص (غ)</th><th>يُشترى</th></tr></thead>
              <tbody>
                {list.lines.map((l) => (
                  <tr key={l.ingredient}>
                    <td>{INGREDIENT_BY_SLUG.get(l.ingredient)?.name_ar ?? l.ingredient}</td>
                    <td className="num" dir="ltr">{fmtNum(l.need_g, 0)}</td><td className="num" dir="ltr">{fmtNum(l.have_g, 0)}</td><td className="num" dir="ltr">{fmtNum(l.buy_g, 0)}</td>
                    <td className="num" dir="ltr">{l.qty === null ? '—' : `${fmtNum(l.qty, 0)} ${unitAbbr(l.unit!)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cmp && (
            <div className="stack" data-testid="shop-cost">
              <b>التكلفة لكل سوق</b>
              <ul className="plain row kt-tight" style={{ flexWrap: 'wrap' }}>
                {cmp.perStore.map((s) => <li key={s.store}><Badge tone={s.store === cmp.cheapestStore ? 'ok' : undefined}>{storeName(s.store)}: <span className="num" dir="ltr">{s.total_rm === null ? 'تكلفة غير معروفة' : fmtRM(s.total_rm)}</span></Badge></li>)}
              </ul>
              <small className="muted">الأسعار تقديرية حتى تحدّثها من «الأسعار».</small>
            </div>
          )}
          <div className="row"><Button variant="primary" icon="plus" disabled={!list.cart.length} onClick={() => void addAll()} data-testid="shop-to-cart">أضف الناقص إلى السلة</Button><Link to="/kitchen/cart">افتح السلة</Link></div>
        </>
      )}
    </Card>
  );
}

function LogTab() {
  const today = todayKL();
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(addDays(today, 14));
  const n = isDate(from) && isDate(to) && to >= from ? dayDiff(from, to) : 0;
  const days = usePlanRange(from, n);
  const [events, setEvents] = useState<CalEvent[]>([]);
  useEffect(() => {
    if (n < 1 || n > 62) { setEvents([]); return; }
    let live = true;
    void fetchView(from, to, 'auto').then((r) => live && setEvents(r.data.events)).catch(() => live && setEvents([]));
    return () => { live = false; };
  }, [from, to, n]);
  const rows = (days ?? []).filter((d) => d.date <= to);
  const outlook = useMemo(() => { const out = []; for (let i = 0; i < Math.min(n, 62); i++) { const o = outlookDayLaw(events, addDays(from, i)); if (o.meals.length) out.push(o); } return out; }, [events, from, n]);
  return (
    <Card>
      <CardHead title="السجل التغذوي" icon="chart" info="مجموع سعرات كل يوم محفوظ مع حالة القانون. أرقام فقط: بلا أحكام ولا أوزان جسم ولا تقدّم «حمية»." />
      <div className="row kt-filter-row">
        <label className="kt-inline">من <input className="input" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="من تاريخ" /></label>
        <label className="kt-inline">إلى <input className="input" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} aria-label="إلى تاريخ" /></label>
      </div>
      {days === null ? <p className="muted">جارٍ التحميل…</p> : rows.length === 0 ? <EmptyState icon="chart" title="لا أيام محفوظة في هذا المدى" /> : (
        <div className="log-bars" data-testid="log-bars" role="list" aria-label="أيام السجل">
          {rows.map((d) => {
            const st = d.status === 'partial' ? 'part' : d.total_kcal < LAW.MIN || d.total_kcal > LAW.MAX ? 'bad' : '';
            return (
              <div key={d.date} className="log-row" role="listitem">
                <span className="num" dir="ltr">{d.date} <small className="muted">{dayName(d.date)}</small></span>
                <span className="log-track" aria-hidden="true"><i className={st} style={{ inlineSize: `${Math.min(100, (d.total_kcal / 1800) * 100)}%` }} /></span>
                <span><b className="num" dir="ltr">{fmtKcal(d.total_kcal)}</b> سعرة {d.status === 'partial' ? <Badge tone="warn">جزئي</Badge> : st === 'bad' ? <Badge tone="danger">خارج المجال</Badge> : <Badge tone="ok"><Icon name="check" size={11} /> داخل المجال</Badge>}</span>
              </div>
            );
          })}
        </div>
      )}
      {outlook.length > 0 && (
        <div className="stack" data-testid="log-outlook">
          <b>أيام Outlook المقروءة (LAW-07)</b>
          <ul className="plain stack kt-tight">
            {outlook.map((o) => <li key={o.date}><span className="num" dir="ltr">{o.date}</span>: {o.unknown.length ? <Badge dashed>سعرات غير معروفة: {o.unknown.join('، ')}</Badge> : null} <span className="num" dir="ltr">{fmtKcal(o.known_kcal)}</span> سعرة {o.violation ? <Badge tone="danger"><Icon name="warn" size={11} /> مخالفة</Badge> : <Badge tone="ok">داخل المجال</Badge>}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
