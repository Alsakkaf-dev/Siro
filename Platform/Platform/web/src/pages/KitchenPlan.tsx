import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented, cx } from '../ui/ui.js';
import { useApp } from '../core/app-context.js';
import { KitchenChips, NutriGrid, Section, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { deletePlanDay, fetchPlan, previewPlan, savePlan, type PlanDayRow, type PlanSlotsIn, type PlanSlotView } from '../kitchen/store.js';
import { LAW, SLOTS, fmtKcal, fmtNum, type NutritionVector, type Slot } from '../../../shared/kitchen/index.js';
import { CYCLE_CARDS, ORIGINAL_CARDS, nutritionOf } from '../../../shared/kitchen/index.js';

const SCALES = [0.5, 0.75, 1, 1.25, 1.5] as const;
type Pre = Awaited<ReturnType<typeof previewPlan>>;
const today = (): string => new Date().toISOString().slice(0, 10);
const shiftDay = (d: string, n: number): string => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const isSlot = (s: string): s is Slot => (SLOTS as readonly string[]).includes(s);

interface Pick { card: string; scale: number }
type Picks = Partial<Record<Slot, Pick>>;

/** خطة اليوم (VS-1): ثلاث خانات، معاينة حيّة بقانون السعرات، ملاءمة تلقائية، رفض بثلاثة حلول، ونص الوصف بالقالب 2.6. اقتراح داخل المنصة فقط. */
export default function KitchenPlan() {
  const k = useKitchen();
  const act = useAct();
  const { toast, confirm } = useApp();
  const [sp, setSp] = useSearchParams();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.get('date') ?? '') ? sp.get('date')! : today();
  const [picks, setPicks] = useState<Picks>({});
  const [autoFit, setAutoFit] = useState(false);
  const [pre, setPre] = useState<Pre | null>(null);
  const [preErr, setPreErr] = useState('');
  const [saved, setSaved] = useState<PlanDayRow[]>([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  /* كل البطاقات المسموح تعيينها: الأصلية المحسوبة + ابتكاراتي/النسخ (غير المخفية) */
  const options = useMemo(() => {
    const orig = ORIGINAL_CARDS(k.idx, k.store).filter((c) => c.computable).map((c) => ({ slug: c.slug, title: c.title_ar, meals: c.meal_types as string[], kcal: c.nutrition?.kcal ?? null }));
    const mine = k.cards.filter((c) => !c.hidden && !c.flags.some((f) => ['unsafe_chicken', 'burnt', 'undercooked'].includes(f))).map((c) => ({ slug: c.slug, title: c.name_ar, meals: c.meal_types, kcal: c.nutrition['kcal'] ?? null }));
    const cyc = CYCLE_CARDS.map((c) => ({ slug: c.slug, title: `${c.title_ar} (دورتي)`, meals: [c.meal_slot as string], kcal: nutritionOf(c.lines).total.kcal }));
    return [...orig, ...cyc, ...mine];
  }, [k.idx, k.store, k.cards]);

  /* تحميل مسبق من القاموس: ?card=&slot= */
  const preload = useRef(false);
  useEffect(() => {
    if (preload.current) return;
    const c = sp.get('card');
    const s = sp.get('slot') ?? '';
    if (c && isSlot(s)) {
      preload.current = true;
      setPicks((p) => ({ ...p, [s]: { card: c, scale: 1 } }));
    }
  }, [sp]);

  const loadDays = (): void => {
    void fetchPlan(date, 14).then((r) => setSaved(r.days)).catch(() => setSaved([]));
  };
  useEffect(loadDays, [date, k.version]);
  /* اليوم المحفوظ يملأ الخانات عند فتح التاريخ */
  const savedDay = saved.find((d) => d.date === date);
  const filledFor = useRef('');
  useEffect(() => {
    if (!savedDay || filledFor.current === date || Object.keys(picks).length) return;
    filledFor.current = date;
    const o: Picks = {};
    for (const s of savedDay.slots) if (isSlot(s.slot) && s.card_slug !== 'manual') o[s.slot] = { card: s.card_slug, scale: s.scale };
    setPicks(o);
  }, [savedDay, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = useMemo<PlanSlotsIn>(() => Object.fromEntries(Object.entries(picks).map(([s, p]) => [s, { card: p.card, ...(p.scale !== 1 ? { scale: p.scale } : {}) }])) as PlanSlotsIn, [picks]);
  const bodyKey = JSON.stringify(body) + autoFit;

  /* معاينة حيّة (مؤجّلة 150ms): نفس حساب الخادم */
  useEffect(() => {
    if (!Object.keys(body).length) { setPre(null); setPreErr(''); return; }
    const my = ++seq.current;
    const t = setTimeout(() => {
      previewPlan(body, autoFit).then((r) => { if (my === seq.current) { setPre(r); setPreErr(''); } }).catch((e: Error) => { if (my === seq.current) { setPre(null); setPreErr(e.message); } });
    }, 150);
    return () => clearTimeout(t);
  }, [bodyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setDate = (d: string): void => { const n = new URLSearchParams(sp); n.set('date', d); setSp(n, { replace: true }); filledFor.current = ''; setPicks({}); setPre(null); };
  const setPick = (slot: Slot, v: Pick | null): void => setPicks((p) => { const n = { ...p }; if (v) n[slot] = v; else delete n[slot]; return n; });

  const total = pre?.law.total_kcal ?? 0;
  const pct = Math.min(100, Math.max(0, (total / LAW.MAX) * 100));
  const blocked = pre?.blocked ?? [];
  const canSave = !!pre && pre.ok && blocked.length === 0 && Object.keys(picks).length > 0 && !k.offline;

  const doSave = async (): Promise<void> => {
    setBusy(true);
    try {
      const r = await savePlan(date, body, autoFit);
      toast(r.status === 'proposal' ? 'حُفظ اليوم كاقتراح داخل المنصة (لا كتابة في Outlook)' : 'حُفظ اليوم جزئيًا', { kind: 'ok' });
      loadDays();
    } catch (e) {
      const ex = e as { code?: string; message: string; data?: { solutions?: string[] } };
      toast(ex.code === 'law' ? `رُفض: ${ex.message}` : ex.message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const doClear = async (): Promise<void> => {
    if (!(await confirm({ title: 'حذف اقتراح هذا اليوم؟', body: 'يُحذف الاقتراح من المنصة فقط.', confirmLabel: 'احذف' }))) return;
    await act(() => deletePlanDay(date), 'حُذف اقتراح اليوم');
    setPicks({}); setPre(null); filledFor.current = '';
    loadDays();
  };
  const copy = (t: string): void => void navigator.clipboard?.writeText(t).then(() => toast('نُسخ نص الوصف', { kind: 'ok' }), () => toast('تعذّر النسخ', { kind: 'error' }));

  return (
    <div className="page kitchen kt-plan">
      <PageHead title="خطة اليوم" icon="calendar" sub="ثلاث خانات: فطور وغداء وعشاء. القانون حاجز: لا يُحفظ يوم خارج المجال. الناتج اقتراح داخل المنصة فقط ولا يُكتب شيء في Outlook." actions={<KitchenChips />} />

      <Card>
        <div className="row kt-plan-date">
          <Button size="sm" icon="right" aria-label="اليوم السابق" onClick={() => setDate(shiftDay(date, -1))} />
          <input className="input" type="date" aria-label="تاريخ اليوم" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} dir="ltr" />
          <Button size="sm" icon="left" aria-label="اليوم التالي" onClick={() => setDate(shiftDay(date, 1))} />
          {date !== today() && <Button size="sm" onClick={() => setDate(today())}>اليوم</Button>}
          <span className="grow" />
          <label className="kt-check"><input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} data-testid="autofit" /> ملاءمة تلقائية</label>
        </div>
      </Card>

      <div className="kt-plan-grid">
        {SLOTS.map((slot) => {
          const p = picks[slot];
          const sv: PlanSlotView | undefined = pre?.slots.find((x) => x.slot === slot);
          return (
            <Card key={slot} className="kt-plan-slot">
              <CardHead title={slot} icon="utensils" />
              <div className="stack">
                <select className="select" aria-label={`بطاقة ${slot}`} data-testid={`pick-${slot}`} value={p?.card ?? ''} onChange={(e) => setPick(slot, e.target.value ? { card: e.target.value, scale: p?.scale ?? 1 } : null)}>
                  <option value="">— اختر بطاقة —</option>
                  {[...options].sort((a, b) => Number(b.meals.includes(slot)) - Number(a.meals.includes(slot))).map((o) => <option key={o.slug} value={o.slug}>{o.title}{o.kcal !== null ? ` · ${fmtKcal(o.kcal)} سعرة` : ''}</option>)}
                </select>
                {p && (
                  <div className="row" role="group" aria-label={`حصة ${slot}`}>
                    {SCALES.map((s) => <button key={s} type="button" className="chip" aria-pressed={p.scale === s} disabled={autoFit} onClick={() => setPick(slot, { ...p, scale: s })}>×{s}</button>)}
                    <Button size="sm" icon="x" onClick={() => setPick(slot, null)}>أفرغ</Button>
                  </div>
                )}
                {sv && (
                  <>
                    <p className="kt-plan-kcal"><b className="num" dir="ltr">{fmtKcal(sv.nutrition['kcal'] ?? 0)}</b> سعرة{sv.scale !== 1 && <> · <Badge dashed>×<span className="num">{fmtNum(sv.scale, 2)}</span></Badge></>}</p>
                    {sv.unmapped.length > 0 && <p className="callout warn" role="note">تعذّر تعديل وزن في النص: {sv.unmapped.join('، ')} — راجع النص يدويًا.</p>}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHead title="قانون السعرات (حيّ)" icon="target" />
        <div role="meter" aria-label="مجموع سعرات اليوم" aria-valuenow={Math.round(total)} aria-valuemin={0} aria-valuemax={LAW.MAX} className={cx('kt-meter', pre && !pre.ok && 'full', pre?.law.status === 'PARTIAL' && 'warn')} data-testid="law-meter"><i style={{ inlineSize: `${pct}%` }} /></div>
        <p data-testid="law-status">
          {!pre ? <span className="muted">اختر بطاقة لخانة واحدة على الأقل.</span> : <>المجموع <b className="num" dir="ltr">{fmtKcal(total)}</b> سعرة · المجال المسموح <span className="num" dir="ltr">{LAW.MIN}–{LAW.MAX}</span> {' '}
            {pre.law.status === 'VALID' && <Badge tone="ok">داخل المجال</Badge>}
            {pre.law.status === 'PARTIAL' && <Badge tone="warn">جزئي — يتبقى {fmtKcal(pre.law.remaining?.minNeeded ?? 0)}–{fmtKcal(pre.law.remaining?.maxAllowed ?? 0)}</Badge>}
            {(pre.law.status === 'INVALID_HIGH' || pre.law.status === 'INVALID_LOW') && <Badge tone="danger">مرفوض</Badge>}
            {pre.autoFit && <Badge>ملاءمة ×<span className="num">{fmtNum(pre.autoFit.k, 2)}</span></Badge>}</>}
        </p>
        {preErr && <p className="callout danger" role="alert">{preErr}</p>}
        {blocked.map((b) => <p key={b} className="callout danger" role="alert">{b}</p>)}
        {pre && !pre.ok && pre.message && (
          <div className="callout danger" role="alert" data-testid="law-reject">
            <b>{pre.message}</b>
            <ol className="plain kt-tight">{pre.solutions.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        )}
        {pre && pre.slots.length > 0 && <NutriGrid n={pre.total as unknown as NutritionVector} unitLabel="تغذية اليوم" />}
        <div className="row">
          <Button variant="primary" icon="save" disabled={!canSave || busy} onClick={() => void doSave()} data-testid="save-plan">احفظ اقتراح اليوم</Button>
          {savedDay && <Button icon="trash" onClick={() => void doClear()}>احذف الاقتراح</Button>}
          <small className="muted">يُحفظ داخل المنصة فقط؛ التصدير إلى Outlook بقرار منفصل لاحقًا.</small>
        </div>
      </Card>

      {pre && pre.slots.length > 0 && (
        <Section title="نص الوصف (قالب الحدث)">
          <div className="stack">
            {pre.slots.map((s) => (
              <Card key={s.slot}>
                <CardHead title={`${s.slot} — ${s.title_ar}`} icon="mail"><Button size="sm" icon="copy" onClick={() => copy(s.body_text)} data-testid={`copy-${s.slot}`}>انسخ</Button></CardHead>
                <pre className="kt-body-text" dir="rtl" data-testid={`body-${s.slot}`}>{s.body_text}</pre>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section title="أيام محفوظة (14 يومًا)">
        {saved.length === 0 ? <EmptyState icon="calendar" title="لا اقتراحات محفوظة" /> : (
          <ul className="plain stack kt-tight">
            {saved.map((d) => (
              <li key={d.date} className="row"><Button size="sm" onClick={() => setDate(d.date)} aria-current={d.date === date}><span className="num" dir="ltr">{d.date}</span></Button> <b className="num" dir="ltr">{fmtKcal(d.total_kcal)}</b> سعرة <Badge tone={d.status === 'proposal' ? 'ok' : 'warn'}>{d.status === 'proposal' ? 'اقتراح' : 'جزئي'}</Badge> <small className="muted">{d.slots.map((s) => s.title_ar).join(' · ')}</small></li>
            ))}
          </ul>
        )}
      </Section>
      <p className="muted"><Link to="/kitchen/codex">اختر البطاقات من القاموس</Link> · <Link to="/kitchen/cook">اطبخ طبقًا جديدًا</Link></p>
    </div>
  );
}
