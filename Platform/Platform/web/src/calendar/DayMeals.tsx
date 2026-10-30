import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { NutriGrid, useKitchen } from '../kitchen/kitchenKit.js';
import { KitchenApiError, deletePlanDay, fetchPlan, previewPlan, savePlan, type ManualIn, type PlanDayRow, type PlanSlotsIn, type PreviewOut } from '../kitchen/store.js';
import { INGREDIENT_BY_SLUG, SLOTS, feasibleRange, fmtKcal, fmtNum, fmtRM, mealCost, type NutritionVector, type Slot } from '../../../shared/kitchen/index.js';
import { mealEventsOf, outlookDayLaw, type CalEvent } from '../../../shared/calendar/index.js';
import { LawGauge, type GaugeState } from './LawGauge.js';
import { MealPicker, usePickOptions } from './MealPicker.js';
import { timeRange } from './fmt.js';
import { fromPlan } from './api.js';
import { Link } from 'react-router-dom';

const SCALES = [0.5, 0.75, 1, 1.25, 1.5] as const;
type CardPick = { kind: 'card'; card: string; scale: number };
type ManualPick = { kind: 'manual'; m: ManualIn };
type Pick = CardPick | ManualPick;
type Picks = Partial<Record<Slot, Pick>>;
const EMPTY_M: ManualIn = { title_ar: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
const ingName = (s: string): string => INGREDIENT_BY_SLUG.get(s)?.name_ar ?? s;

/** محرر وجبات يوم (K-M10): ثلاث خانات، منتقي البطاقات، شريط القانون الحيّ، نطاق الجدوى، الملاءمة قبل/بعد، الحفظ تحت حاجز القانون. اقتراح داخل المنصة فقط. */
export function DayMeals({ date, focus, events, onSaved }: { date: string; focus?: Slot; events?: CalEvent[]; onSaved?: () => void }) {
  const k = useKitchen();
  const { toast, confirm } = useApp();
  const opts = usePickOptions();
  const [picks, setPicks] = useState<Picks>({});
  const [autoFit, setAutoFit] = useState(false);
  const [pre, setPre] = useState<PreviewOut | null>(null);
  const [before, setBefore] = useState<PreviewOut | null>(null);
  const [preErr, setPreErr] = useState('');
  const [saved, setSaved] = useState<PlanDayRow | null>(null);
  const [picker, setPicker] = useState<Slot | null>(null);
  const [manualFor, setManualFor] = useState<Slot | null>(null);
  const [mdraft, setMdraft] = useState<ManualIn>(EMPTY_M);
  const [rej, setRej] = useState<{ message: string; solutions: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const filled = useRef('');

  const loadSaved = (): void => { void fetchPlan(date, 1).then((r) => setSaved(r.days[0] ?? null)).catch(() => setSaved(null)); };
  useEffect(() => { setPicks({}); setPre(null); setBefore(null); setRej(null); setAutoFit(false); filled.current = ''; }, [date]);
  useEffect(loadSaved, [date, k.version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!saved || filled.current === date || Object.keys(picks).length) return;
    filled.current = date;
    const o: Picks = {};
    for (const s of saved.slots) {
      if (!(SLOTS as readonly string[]).includes(s.slot)) continue;
      o[s.slot as Slot] = s.card_slug === 'manual'
        ? { kind: 'manual', m: { title_ar: s.title_ar, kcal: s.nutrition['kcal'] ?? 0, protein_g: s.nutrition['protein_g'] ?? 0, carbs_g: s.nutrition['carbs_g'] ?? 0, fat_g: s.nutrition['fat_g'] ?? 0, fiber_g: s.nutrition['fiber_g'] ?? 0 } }
        : { kind: 'card', card: s.card_slug, scale: s.scale };
    }
    setPicks(o);
  }, [saved, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = useMemo<PlanSlotsIn>(() => Object.fromEntries(Object.entries(picks).map(([s, p]) => [s, p.kind === 'manual' ? { manual: p.m } : { card: p.card, ...(p.scale !== 1 ? { scale: p.scale } : {}) }])) as PlanSlotsIn, [picks]);
  const key = JSON.stringify(body) + autoFit;
  useEffect(() => {
    if (!Object.keys(body).length) { setPre(null); setBefore(null); setPreErr(''); return; }
    const my = ++seq.current;
    const t = setTimeout(() => {
      Promise.all([previewPlan(body, autoFit), autoFit ? previewPlan(body, false) : Promise.resolve(null)])
        .then(([a, b]) => { if (my === seq.current) { setPre(a); setBefore(b); setPreErr(''); } })
        .catch((e: Error) => { if (my === seq.current) { setPre(null); setBefore(null); setPreErr(e.message); } });
    }, 150);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPick = (slot: Slot, v: Pick | null): void => { setRej(null); setPicks((p) => { const n = { ...p }; if (v) n[slot] = v; else delete n[slot]; return n; }); };
  const empties = SLOTS.filter((s) => !picks[s]);
  const total = pre?.law.total_kcal ?? 0;
  const state: GaugeState = (pre?.law.status as GaugeState | undefined) ?? 'EMPTY';
  const range = useMemo(() => (pre && state === 'PARTIAL' && empties.length ? feasibleRange(total, empties.length, opts) : null), [pre, state, total, empties.length, opts]);
  const blocked = pre?.blocked ?? [];
  const canSave = !!pre && pre.ok && !blocked.length && Object.keys(picks).length > 0 && !k.offline && !(autoFit && !pre.autoFit);
  const day = useMemo(() => (events ? mealEventsOf(events, date) : null), [events, date]);
  const odl = useMemo(() => (events ? outlookDayLaw(events, date) : null), [events, date]);
  const staleSlots = saved?.slots.filter((s) => s.card_updated || s.card_missing) ?? [];

  const doSave = async (): Promise<void> => {
    setBusy(true);
    try {
      const r = await savePlan(date, body, autoFit);
      toast(r.status === 'proposal' ? 'حُفظ اليوم كاقتراح داخل المنصة (لا كتابة في Outlook)' : 'حُفظ اليوم جزئيًا', { kind: 'ok' });
      setRej(null);
      loadSaved();
      onSaved?.();
    } catch (e) {
      const ex = e as KitchenApiError;
      if (ex.code === 'law') setRej({ message: ex.message, solutions: ((ex.data['solutions'] as string[] | undefined) ?? []) });
      toast(ex.code === 'law' ? `رُفض: ${ex.message}` : ex.message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const [prop, setProp] = useState<string[] | null>(null);
  const doPropose = async (): Promise<void> => {
    try {
      const r = await fromPlan(date);
      setProp([`أُنشئ ${r.created.length} اقتراحًا`, ...r.skipped.map((s) => `تُخطّي «${s.slot}»: ${s.reason}`), ...r.rejected.map((x) => `رُفض «${x.slot}»: ${x.errors.map((e) => `${e.code} ${e.msg}`).join(' | ')}`)]);
    } catch (e) { toast(e instanceof Error ? e.message : 'تعذّر إنشاء الاقتراح', { kind: 'error' }); }
  };
  const doClear = async (): Promise<void> => {
    if (!(await confirm({ title: 'حذف اقتراح هذا اليوم؟', body: 'يُحذف الاقتراح من المنصة فقط.', confirmLabel: 'احذف' }))) return;
    await deletePlanDay(date);
    setPicks({}); setPre(null); setBefore(null); filled.current = '';
    loadSaved();
    onSaved?.();
  };
  const slotCost = (lines: { ingredient: string; amount_g: number | null }[]): number | null => { const c = mealCost(lines, k.idx, { store: k.store }); return c.missing.length ? null : c.total_rm; };

  return (
    <div className="stack dm" data-testid="day-meals" data-date={date}>
      {staleSlots.length > 0 && (
        <p className="callout warn" role="alert" data-testid="card-updated">
          <Icon name="warn" size={14} /> {staleSlots.some((s) => s.card_missing) ? 'بطاقة محفوظة في هذا اليوم لم تعد موجودة.' : 'البطاقة تحدّثت بعد حفظ هذا اليوم'} — حدّث اليوم؟ <Button size="sm" onClick={() => void doSave()} disabled={busy}>حدّث اليوم</Button>
        </p>
      )}
      <div className="dm-slots">
        {SLOTS.map((slot) => {
          const p = picks[slot];
          const sv = pre?.slots.find((x) => x.slot === slot);
          const opt = p?.kind === 'card' ? opts.find((o) => o.slug === p.card) : null;
          const ev = day?.bySlot[slot];
          return (
            <section key={slot} className={`dm-slot${focus === slot ? ' focus' : ''}`} aria-label={slot} data-slot={slot}>
              <h3 className="row">{slot} {ev && <small className="muted num" dir="ltr" title="حدث Outlook المقابل">{timeRange(ev.start, ev.end)}</small>}{!ev && events && <Badge dashed>خانة افتراضية</Badge>}</h3>
              {!p && (
                <div className="row">
                  <Button variant="primary" size="sm" icon="plus" onClick={() => setPicker(slot)} data-testid={`pick-btn-${slot}`}>عيّن بطاقة</Button>
                  <Button size="sm" onClick={() => { setManualFor(slot); setMdraft(EMPTY_M); }}>وجبة يدوية</Button>
                </div>
              )}
              {p && (
                <>
                  <p className="dm-title"><b>{p.kind === 'manual' ? p.m.title_ar : (sv?.title_ar ?? opt?.title ?? p.card)}</b> {p.kind === 'manual' ? <Badge dashed>يدوي</Badge> : opt?.group === 'cycle' ? <Badge dashed>دورتي</Badge> : null}</p>
                  {sv && <p className="kt-plan-kcal"><b className="num" dir="ltr">{fmtKcal(sv.nutrition['kcal'] ?? 0)}</b> سعرة{sv.scale !== 1 && <> · <Badge dashed>×<span className="num">{fmtNum(sv.scale, 2)}</span></Badge></>}{(() => { const c = slotCost(sv.lines); return c !== null ? <> · <span className="num" dir="ltr">{fmtRM(c)}</span></> : null; })()}</p>}
                  {p.kind === 'card' && (
                    <div className="row" role="group" aria-label={`حصة ${slot}`}>
                      {SCALES.map((s) => <button key={s} type="button" className="chip" aria-pressed={p.scale === s} disabled={autoFit} onClick={() => setPick(slot, { ...p, scale: s })}>×{s}</button>)}
                    </div>
                  )}
                  {sv && sv.unmapped.length > 0 && <p className="callout warn" role="note">تعذّر تعديل وزن في النص: {sv.unmapped.map(ingName).join('، ')} — راجع النص يدويًا.</p>}
                  <div className="row">
                    <Button size="sm" onClick={() => setPicker(slot)}>غيّر</Button>
                    <Button size="sm" icon="x" onClick={() => setPick(slot, null)}>أفرغ</Button>
                  </div>
                </>
              )}
              {manualFor === slot && (
                <form className="stack" onSubmit={(e) => { e.preventDefault(); if (mdraft.title_ar.trim() && mdraft.kcal > 0) { setPick(slot, { kind: 'manual', m: { ...mdraft, title_ar: mdraft.title_ar.trim() } }); setManualFor(null); } }} aria-label="وجبة يدوية">
                  <input className="input" placeholder="اسم الوجبة" aria-label="اسم الوجبة" value={mdraft.title_ar} onChange={(e) => setMdraft({ ...mdraft, title_ar: e.target.value })} />
                  <div className="dm-manual">
                    {([['kcal', 'سعرات'], ['protein_g', 'بروتين'], ['carbs_g', 'كربوهيدرات'], ['fat_g', 'دهون'], ['fiber_g', 'ألياف']] as const).map(([f, l]) => (
                      <label key={f} className="kt-inline">{l}<input className="input kt-num-in" type="number" min={0} step="any" dir="ltr" aria-label={l} value={mdraft[f] || ''} onChange={(e) => setMdraft({ ...mdraft, [f]: Number(e.target.value) || 0 })} /></label>
                    ))}
                  </div>
                  <div className="row"><Button size="sm" variant="primary" type="submit" disabled={!mdraft.title_ar.trim() || mdraft.kcal <= 0}>أضف</Button><Button size="sm" type="button" onClick={() => setManualFor(null)}>إلغاء</Button></div>
                </form>
              )}
            </section>
          );
        })}
      </div>

      <div className="stack dm-law">
        <div className="row">
          <label className="kt-check"><input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} data-testid="autofit" /> ملاءمة تلقائية (نحو 1300)</label>
          <small className="muted">اقتراح لا تطبيق: لا يُحفظ إلا بقبولك.</small>
        </div>
        <LawGauge kcal={total} state={state} />
        {!pre && !preErr && <p className="muted">عيّن بطاقة لخانة واحدة على الأقل.</p>}
        {range && (
          <p className={`callout ${range.reachable ? '' : 'warn'}`} role="note" data-testid="range-note">
            نطاق الجدوى بالبطاقات المتاحة: من <b className="num" dir="ltr">{fmtKcal(range.min)}</b> إلى <b className="num" dir="ltr">{fmtKcal(range.max)}</b> سعرة{range.message ? ` — ${range.message}` : '.'}
          </p>
        )}
        {preErr && <p className="callout danger" role="alert">{preErr}</p>}
        {blocked.map((b) => <p key={b} className="callout danger" role="alert">{b}</p>)}
        {autoFit && pre && !pre.autoFit && pre.autoFitReason && <p className="callout danger" role="alert" data-testid="autofit-impossible">{pre.autoFitReason}</p>}
        {pre && !pre.ok && pre.message && (
          <div className="callout danger" role="alert" data-testid="law-reject">
            <b>{pre.message}</b>
            <ol className="plain kt-tight">{pre.solutions.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        )}
        {rej && !(pre && !pre.ok) && <div className="callout danger" role="alert"><b>{rej.message}</b><ol className="plain kt-tight">{rej.solutions.map((s, i) => <li key={i}>{s}</li>)}</ol></div>}
        {autoFit && pre?.autoFit && before && <BeforeAfter before={before} after={pre} cost={slotCost} />}
        {pre && pre.slots.length > 0 && <NutriGrid n={pre.total as unknown as NutritionVector} unitLabel="تغذية اليوم" />}
        <div className="row">
          <Button variant="primary" icon="save" disabled={!canSave || busy} onClick={() => void doSave()} data-testid="save-plan">احفظ اقتراح اليوم</Button>
          {saved && <Button icon="trash" onClick={() => void doClear()}>احذف الاقتراح</Button>}
          {saved && saved.status === 'proposal' && flagEnabled('calendar.outlook.proposals') && <Button icon="mail" onClick={() => void doPropose()} data-testid="propose-outlook">اقترح تحديث Outlook</Button>}
          {saved && <Badge tone="ok">محفوظ: {fmtKcal(saved.total_kcal)} سعرة</Badge>}
        </div>
        <small className="muted">لا زر «تجاوز» ولا إعداد يعطّل القانون. يُحفظ داخل المنصة فقط؛ التصدير إلى Outlook بقرار منفصل.</small>
        {prop && <div className="callout" role="status" data-testid="propose-result"><ul className="plain kt-tight">{prop.map((x, i) => <li key={i}>{x}</li>)}</ul><Link to="/calendar/proposals">افتح الاقتراحات</Link> — لم يُكتب شيء في Outlook.</div>}
        {odl && odl.meals.length > 0 && (
          <p className={`callout ${odl.violation ? 'warn' : ''}`} role="note" data-testid="outlook-day">
            في Outlook لهذا اليوم: {odl.meals.map((m) => `${m.slot} ${m.kcal === null ? 'سعراته غير معروفة' : `${fmtKcal(m.kcal)} سعرة`}`).join(' · ')}.
            {odl.law && !odl.law.ok && ' مجموعه خارج القانون.'}{odl.extra.length > 0 && ` يوجد ${odl.extra.length} وجبة إضافية (LAW-08).`}
          </p>
        )}
      </div>
      {picker && <MealPicker slot={picker} onClose={() => setPicker(null)} onPick={(slug) => { setPick(picker, { kind: 'card', card: slug, scale: 1 }); setPicker(null); }} />}
    </div>
  );
}

/** CAL-33: الأوزان والسعرات والتكلفة قبل/بعد لكل وجبة */
function BeforeAfter({ before, after, cost }: { before: PreviewOut; after: PreviewOut; cost: (l: { ingredient: string; amount_g: number | null }[]) => number | null }) {
  const sumCost = (o: PreviewOut): number | null => { let t = 0; for (const s of o.slots) { const c = cost(s.lines); if (c === null) return null; t += c; } return t; };
  const cb = sumCost(before);
  const ca = sumCost(after);
  return (
    <div className="stack" data-testid="ba-table">
      <b>الملاءمة التلقائية — قبل وبعد (×<span className="num">{fmtNum(after.autoFit?.k ?? 1, 2)}</span>)</b>
      <table className="dm-ba">
        <thead><tr><th>الوجبة / المكوّن</th><th>قبل (غ)</th><th>بعد (غ)</th></tr></thead>
        <tbody>
          {after.slots.map((s) => {
            const b = before.slots.find((x) => x.slot === s.slot);
            return [
              <tr key={s.slot}><th colSpan={3}>{s.slot}: {s.title_ar} — <span className="num" dir="ltr">{fmtKcal(b?.nutrition['kcal'] ?? 0)} ← {fmtKcal(s.nutrition['kcal'] ?? 0)}</span> سعرة</th></tr>,
              ...s.lines.map((l) => <tr key={s.slot + l.ingredient}><td>{ingName(l.ingredient)}</td><td className="num" dir="ltr">{b?.lines.find((x) => x.ingredient === l.ingredient)?.amount_g ?? '—'}</td><td className="num" dir="ltr">{l.amount_g ?? '—'}</td></tr>),
            ];
          })}
          <tr><th>مجموع السعرات</th><td className="num" dir="ltr">{fmtKcal(before.law.total_kcal)}</td><td className="num" dir="ltr">{fmtKcal(after.law.total_kcal)}</td></tr>
          <tr><th>التكلفة</th><td className="num" dir="ltr">{cb === null ? 'غير معروفة' : fmtRM(cb)}</td><td className="num" dir="ltr">{ca === null ? 'غير معروفة' : fmtRM(ca)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
