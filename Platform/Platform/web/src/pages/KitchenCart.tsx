import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, IconButton, Modal } from '../ui/ui.js';
import { useApp } from '../core/app-context.js';
import { KitchenChips, NutriGrid, Section, StoreSelect, storeName, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { KitchenApiError, checkout, clearCart, removeCartLine, setCartLine, type PurchaseOut } from '../kitchen/store.js';
import { IngIcon } from '../kitchen/kitchenIcons.js';
import {
  INGREDIENT_BY_SLUG, ORIGINAL_CARDS, toGrams, STORES, addToLine, cardFeasibility, cartTotals, clampQty, compareStores, coverageDays, fmtKcal, fmtNum, fmtRM, inventoryFrom, qtyBounds, qtyForEdible, unitAbbr, unitsFor,
  type CartLine, type SaleUnit,
} from '../../../shared/kitchen/index.js';

const UNIT_NAME: Partial<Record<SaleUnit, string>> = { g: 'غرام', piece: 'حبة' };
const unitName = (u: SaleUnit): string => UNIT_NAME[u] ?? unitAbbr(u);

/** نص قائمة التسوق مجمّعًا بالسوق ثم الفئة (CART-08) */
function shoppingText(lines: ReturnType<typeof cartTotals>['lines']): string {
  const byStore = new Map<string, typeof lines>();
  for (const l of lines) byStore.set(l.store, [...(byStore.get(l.store) ?? []), l]);
  const out: string[] = ['قائمة التسوق'];
  for (const [st, ls] of byStore) {
    out.push('', `— ${storeName(st)} —`);
    const byCat = new Map<string, typeof lines>();
    for (const l of ls) {
      const c = INGREDIENT_BY_SLUG.get(l.ingredient)!.category;
      byCat.set(c, [...(byCat.get(c) ?? []), l]);
    }
    for (const [c, cl] of byCat) {
      out.push(`${c}:`);
      for (const l of cl) out.push(`  • ${INGREDIENT_BY_SLUG.get(l.ingredient)!.name_ar}: ${fmtNum(l.qty, 2)} ${unitName(l.unit)}${l.line_rm !== null ? ` (${fmtRM(l.line_rm)})` : ''}`);
    }
  }
  return out.join('\n');
}

/** C — السلة: أسطر وتغذية ومجاميع المخزون، مقارنة الأسواق، الوجبات الممكنة، أيام التغطية، و«اشتريت» */
export default function KitchenCart() {
  const k = useKitchen();
  const act = useAct();
  const { toast } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState<PurchaseOut | null>(null);
  const totals = useMemo(() => cartTotals(k.cart, k.idx, k.store), [k.cart, k.idx, k.store]);
  const cmp = useMemo(() => compareStores(k.cart, k.idx, STORES, k.store), [k.cart, k.idx, k.store]);
  const pantryG = useMemo(() => Object.fromEntries(k.pantry.map((p) => [p.ingredient, p.grams])), [k.pantry]);
  const inv = useMemo(() => inventoryFrom(k.cart, pantryG), [k.cart, pantryG]);
  const cov = useMemo(() => coverageDays(inv, 30), [inv]);
  const cards = useMemo(() => ORIGINAL_CARDS(k.idx, k.store), [k.idx, k.store]);
  const meals = useMemo(() => {
    const rows = cards.filter((c) => c.computable).map((c) => ({ c, f: cardFeasibility(c, inv, { idx: k.idx, store: k.store }) }));
    return { ready: rows.filter((r) => r.f.status === 'ready'), missing: rows.filter((r) => r.f.status === 'missing'), impossible: rows.filter((r) => r.f.status === 'impossible'), excluded: cards.filter((c) => !c.computable) };
  }, [cards, inv, k.idx, k.store]);

  const setLine = (l: CartLine, qty: number, unit: SaleUnit, store: string | null): void => {
    const ing = INGREDIENT_BY_SLUG.get(l.ingredient)!;
    void act(() => setCartLine(l.ingredient, qty <= 0 ? 0 : clampQty(ing, unit, qty), unit, store));
  };
  const addMissing = async (c: (typeof meals.missing)[number]): Promise<void> => {
    const items = c.f.missing.filter((m) => m.grams !== null);
    for (const m of items) {
      const ing = INGREDIENT_BY_SLUG.get(m.ingredient)!;
      const have = k.cart.find((l) => l.ingredient === m.ingredient);
      const add = qtyForEdible(ing, m.grams!);
      const next = addToLine(ing, have ? { qty: have.qty, unit: have.unit } : undefined, add);
      await act(() => setCartLine(m.ingredient, next.qty, next.unit, have?.store ?? null));
    }
    toast(`أُضيف الناقص لـ«${c.c.title_ar}» إلى السلة`, { kind: 'ok' });
  };
  const useCheapest = (): void => {
    for (const it of cmp.perItem) {
      const l = k.cart.find((x) => x.ingredient === it.ingredient);
      if (l && (l.store ?? k.store) !== it.cheapest) setLine(l, l.qty, l.unit, it.cheapest);
    }
  };
  const copyList = (): void => {
    const t = shoppingText(totals.lines);
    void navigator.clipboard?.writeText(t).then(() => toast('نُسخت قائمة التسوق', { kind: 'ok' }), () => toast('تعذّر النسخ — استعمل الطباعة', { kind: 'error' }));
  };
  const empty = k.cart.length === 0;

  return (
    <div className="page kitchen kt-cart">
      <PageHead title="السلة" icon="list" sub="مجاميع مخزون لا مجموع يوم: القانون يخصّ الأيام لا السلة." actions={<KitchenChips />} />
      {done && (
        <div className="callout ok" role="status" data-testid="purchase-done">
          تم تسجيل الشراء: <b>{fmtRM(done.total_rm)}</b> من {storeName(done.store)} — الرصيد الآن <b>{fmtRM(done.balance_after_rm)}</b>. أُضيفت الأصناف إلى <Link to="/kitchen/pantry">المخزن</Link>.
          <Button size="sm" onClick={() => setDone(null)}>إخفاء</Button>
        </div>
      )}
      {empty ? (
        <EmptyState icon="list" title="السلة فارغة" text="أضف مكوّنات من المتجر، أو أضف الناقص من بطاقة وجبة في القاموس." action={<Button variant="primary" to="/kitchen/store">إلى المتجر</Button>} />
      ) : (
        <>
          <Card>
            <CardHead title="الأسطر" icon="list">
              <div className="row">
                <label className="kt-inline">السوق الافتراضي <StoreSelect /></label>
                <Button size="sm" icon="trash" onClick={() => void act(() => clearCart())}>تفريغ السلة</Button>
              </div>
            </CardHead>
            <div className="tbl-wrap">
              <table className="tbl kt-lines">
                <thead><tr><th>المنتج</th><th>الكمية</th><th>السوق</th><th>السعر</th><th>التغذية</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
                <tbody>
                  {totals.lines.map((l) => {
                    const ing = INGREDIENT_BY_SLUG.get(l.ingredient)!;
                    const b = qtyBounds(ing, l.unit);
                    const raw = k.cart.find((x) => x.ingredient === l.ingredient);
                    return (
                      <tr key={l.ingredient} data-ing={l.ingredient}>
                        <th scope="row"><span aria-hidden="true"><IngIcon slug={ing.slug} category={ing.category} /></span> <Link to={`/kitchen/store/${l.ingredient}`}>{ing.name_ar}</Link></th>
                        <td>
                          <div className="row kt-stepper">
                            <IconButton icon="down" label={`أنقص ${ing.name_ar}`} sm onClick={() => setLine(l, l.qty - b.step < b.min - 1e-9 ? 0 : l.qty - b.step, l.unit, raw?.store ?? null)} />
                            <b className="num" dir="ltr" aria-label={`الكمية ${l.qty}`}>{fmtNum(l.qty, 2)}</b>
                            <IconButton icon="up" label={`زِد ${ing.name_ar}`} sm onClick={() => setLine(l, l.qty + b.step, l.unit, raw?.store ?? null)} />
                            <select className="select kt-unit" aria-label={`وحدة ${ing.name_ar}`} value={l.unit} onChange={(e) => {
                              const u = e.target.value as SaleUnit;
                              const nb = qtyBounds(ing, u);
                              setLine(l, Math.max(nb.min, clampQty(ing, u, l.grossG / toGrams(ing, 1, u))), u, raw?.store ?? null);
                            }}>{unitsFor(ing).map((u) => <option key={u} value={u}>{unitName(u)}</option>)}</select>
                          </div>
                        </td>
                        <td>
                          <select className="select kt-store-select" aria-label={`سوق ${ing.name_ar}`} value={raw?.store ?? ''} onChange={(e) => setLine(l, l.qty, l.unit, e.target.value || null)}>
                            <option value="">المختار ({storeName(k.store)})</option>
                            {STORES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="num" dir="ltr">{l.line_rm === null ? <Badge tone="warn">لا سعر</Badge> : <>{fmtRM(l.line_rm)} {l.point?.source === 'estimate_tier' && <Badge dashed>تقديري</Badge>}</>}</td>
                        <td className="num kt-line-n"><span dir="ltr">{fmtKcal(l.nutrition.kcal)}</span> سعرة · <span dir="ltr">{fmtNum(l.nutrition.protein_g, 1)}</span> غ بروتين</td>
                        <td><IconButton icon="trash" label={`احذف ${ing.name_ar}`} sm tone="danger" onClick={() => void act(() => removeCartLine(l.ingredient))} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid cols-2 kt-cart-tot">
            <Card>
              <CardHead title="المجاميع" icon="calc" />
              <div className="kt-total big" data-testid="cart-total"><span>إجمالي السعر</span><b className="num" dir="ltr">{fmtRM(totals.total_rm)}</b></div>
              {totals.estimated && <p className="muted"><Badge dashed>تقديري</Badge> بعض الأسعار تقديرية — حدّثها من <Link to="/kitchen/prices">تحديث الأسعار</Link>.</p>}
              {totals.unpriced.length > 0 && <p className="callout warn">أصناف بلا سعر في سوقها: {totals.unpriced.map((s) => INGREDIENT_BY_SLUG.get(s)?.name_ar).join('، ')}</p>}
              <NutriGrid n={totals.nutrition} unitLabel="مجموع تغذية السلة (مخزون)" />
              <small className="muted">الوزن المشترى: <span className="num">{fmtNum(Math.round(totals.grossG), 0)}</span> غ</small>
              <div className="row kt-actions">
                <Button variant="primary" icon="check" onClick={() => setConfirmOpen(true)} disabled={totals.unpriced.length > 0 || k.offline}>اشتريت</Button>
                <Button icon="copy" onClick={copyList}>انسخ القائمة</Button>
                <Button icon="print" onClick={() => window.print()}>اطبع</Button>
              </div>
            </Card>

            <Card>
              <CardHead title="مقارنة الأسواق" icon="chart" />
              <ul className="plain kt-cmp-list">
                {cmp.perStore.map((s) => {
                  const diff = s.total_rm !== null && cmp.perStore.find((x) => x.store === k.store)?.total_rm != null ? s.total_rm - cmp.perStore.find((x) => x.store === k.store)!.total_rm! : null;
                  return (
                    <li key={s.store} className={s.store === cmp.cheapestStore ? 'best' : undefined}>
                      <span>{storeName(s.store)}{s.store === cmp.cheapestStore && <> <Badge tone="ok">الأرخص</Badge></>}{s.store === k.store && <> <Badge>المختار</Badge></>}</span>
                      <b className="num" dir="ltr">{s.total_rm === null ? 'ناقص سعر' : fmtRM(s.total_rm)}</b>
                      {diff !== null && s.store !== k.store && <small className="num" dir="ltr">{diff > 0 ? '+' : '−'}{fmtRM(Math.abs(diff))}</small>}
                    </li>
                  );
                })}
              </ul>
              {cmp.cheapestStore && <p>أرخص سوق للسلة كاملة: <b>{storeName(cmp.cheapestStore)}</b> — الفرق بين أغلى وأرخص <b className="num" dir="ltr">{fmtRM(cmp.spread_rm)}</b>.</p>}
              <h3>أرخص سوق لكل صنف</h3>
              <ul className="plain kt-item-cmp">
                {cmp.perItem.map((it) => (
                  <li key={it.ingredient}>{INGREDIENT_BY_SLUG.get(it.ingredient)?.name_ar} ← {storeName(it.cheapest)}{it.saving_rm > 0.004 && <small className="muted"> وفّر <span className="num" dir="ltr">{fmtRM(it.saving_rm)}</span></small>}</li>
                ))}
              </ul>
              <small className="muted">الشراء المقسّم على أرخص سوق لكل صنف: <b className="num" dir="ltr">{fmtRM(cmp.split_total_rm)}</b> — قد لا يتوفر كل صنف في كل سوق.</small>
              <div className="row"><Button size="sm" onClick={useCheapest}>اجعل كل صنف من أرخص سوق له</Button></div>
            </Card>
          </div>
        </>
      )}

      <Section title="أيام التغطية">
        <Card>
          <p data-testid="coverage"><b className="num">{fmtNum(cov.days, 0)}</b> {cov.days === 1 ? 'يوم' : cov.days >= 3 && cov.days <= 10 ? 'أيام' : 'يومًا'} متتاليًا من دورة الأيام الثلاثة يغطيها المخزن والسلة معًا{cov.days >= 30 ? ' (حدّ الفحص 30 يومًا)' : ''}.</p>
          {cov.blockedBy && <p className="muted">اليوم {fmtNum(cov.blockedBy.n, 0)} (من دورة اليوم {cov.blockedBy.day}) ينقصه: {cov.blockedBy.missing.length ? cov.blockedBy.missing.map((s) => INGREDIENT_BY_SLUG.get(s)?.name_ar).join('، ') : 'لا شيء — لكن القانون لا يسمح بالتغطية'}</p>}
          <small className="muted">كل يوم يُفحص بحدّ السعرات (<span className="num">1200–1500</span>) قبل أن يُعدّ مغطًّى.</small>
        </Card>
      </Section>

      <Section title="الوجبات التي يمكن صنعها">
        <div className="grid cols-3 kt-meals">
          <Card>
            <CardHead title={`جاهزة الآن (${fmtNum(meals.ready.length, 0)})`} icon="check" />
            {meals.ready.length === 0 ? <p className="muted">لا وجبة جاهزة بما في المخزن والسلة.</p> : <ul className="plain stack kt-tight">{meals.ready.map(({ c, f }) => <li key={c.slug}><Link to={`/kitchen/codex/${c.slug}`}>{c.title_ar}</Link> <Badge tone="ok">{fmtNum(f.servings, 0)} حصة</Badge></li>)}</ul>}
          </Card>
          <Card>
            <CardHead title={`ينقصها كذا (${fmtNum(meals.missing.length, 0)})`} icon="warn" />
            {meals.missing.length === 0 ? <p className="muted">لا وجبة ينقصها القليل.</p> : (
              <ul className="plain stack kt-tight">
                {meals.missing.map(({ c, f }) => (
                  <li key={c.slug} data-card={c.slug}>
                    <Link to={`/kitchen/codex/${c.slug}`}>{c.title_ar}</Link>
                    <small className="muted"> ينقصها: {f.missing.map((m) => `${INGREDIENT_BY_SLUG.get(m.ingredient)?.name_ar}${m.grams ? ` ${fmtNum(Math.ceil(m.grams), 0)} غ` : ''}`).join('، ')}</small>
                    <small> · تكلفة الإكمال: <b className="num" dir="ltr">{f.completionCost === null ? '—' : fmtRM(f.completionCost)}</b></small>
                    <Button size="sm" icon="plus" onClick={() => void addMissing({ c, f })}>أضف الناقص إلى السلة</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHead title={`غير ممكنة (${fmtNum(meals.impossible.length + meals.excluded.length, 0)})`} icon="x" />
            <ul className="plain stack kt-tight">
              {meals.impossible.map(({ c }) => <li key={c.slug}><Link to={`/kitchen/codex/${c.slug}`}>{c.title_ar}</Link></li>)}
              {meals.excluded.map((c) => <li key={c.slug}><Link to={`/kitchen/codex/${c.slug}`}>{c.title_ar}</Link> <Badge dashed>{c.badges.includes('needs_quantities') ? 'ينقصها أوزان' : 'نص مطابق لوصفة أخرى'}</Badge></li>)}
            </ul>
          </Card>
        </div>
      </Section>
      {confirmOpen && <CheckoutDialog onClose={() => setConfirmOpen(false)} total={totals.total_rm} onDone={(p) => { setDone(p); setConfirmOpen(false); }} />}
    </div>
  );
}

/** CART-06/07: نافذة التأكيد — المتجر والمجموع والرصيد بعد الشراء؛ الحدّ الصارم يمنع مع خيار «زيادة الميزانية» الصريح */
function CheckoutDialog({ total, onClose, onDone }: { total: number; onClose: () => void; onDone: (p: PurchaseOut) => void }) {
  const k = useKitchen();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<KitchenApiError | null>(null);
  const w = k.wallet;
  const balance = w?.balance_rm ?? 0;
  const short = w?.configured && w.hard_limit && total > balance + 1e-9 ? Math.round((total - balance) * 100) / 100 : 0;
  const go = async (raise?: number): Promise<void> => {
    setBusy(true);
    setErr(null);
    try {
      onDone(await checkout(k.store, raise));
    } catch (e) {
      setErr(e instanceof KitchenApiError ? e : new KitchenApiError(0, 'تعذّر الشراء'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="تأكيد «اشتريت»" onClose={onClose}
      footer={<>
        <Button onClick={onClose}>إلغاء</Button>
        {!w?.configured ? <Button variant="primary" to="/kitchen/wallet">اضبط الميزانية أولًا</Button> : short > 0 ? <Button variant="primary" disabled={busy} onClick={() => void go(short)}>زِد الميزانية بـ{fmtRM(short)} واشترِ</Button> : <Button variant="primary" icon="check" disabled={busy} onClick={() => void go()}>أكّد الشراء</Button>}
      </>}>
      <dl className="kt-confirm">
        <div><dt>السوق الافتراضي</dt><dd>{storeName(k.store)}</dd></div>
        <div><dt>المجموع</dt><dd className="num" dir="ltr">{fmtRM(total)}</dd></div>
        <div><dt>رصيد المحفظة الآن</dt><dd className="num" dir="ltr">{w?.configured ? fmtRM(balance) : 'غير مضبوطة'}</dd></div>
        <div><dt>الرصيد بعد الشراء</dt><dd className="num" dir="ltr">{w?.configured ? fmtRM(balance - total) : '—'}</dd></div>
      </dl>
      <p className="muted">تسجيل داخلي فقط: تُضاف الكميات إلى المخزن بالغرام، ويُخصم المبلغ من المحفظة، وتُفرَّغ السلة — في عملية واحدة. لا دفع حقيقي ولا اتصال بأي متجر.</p>
      {!w?.configured && <p className="callout warn" role="alert">حدّد ميزانية المحفظة أولًا.</p>}
      {short > 0 && <p className="callout danger" role="alert">الرصيد لا يكفي بمقدار <b>{fmtRM(short)}</b> والحدّ صارم. الزيادة فعل صريح منك.</p>}
      {err && err.code !== 'insufficient' && <p className="callout danger" role="alert">{err.message}</p>}
    </Modal>
  );
}
