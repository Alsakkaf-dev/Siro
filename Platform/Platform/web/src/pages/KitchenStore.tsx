import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Modal, Segmented, Skeleton, cx, useDebounced } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { useApp } from '../core/app-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { KitchenChips, NutriGrid, PriceTag, StoreSelect, storeName, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { quickBuy, setCartLine } from '../kitchen/store.js';
import { IngIcon } from '../kitchen/kitchenIcons.js';
import {
  INGREDIENTS, INGREDIENT_BY_SLUG, ORIGINAL_RECIPES, STORES, SOURCE_LABEL, amountRm, clampQty, countPhrase, filterCatalog, fmtKcal, fmtNum, fmtRM, isStale, packNotice, per100g, pickPrice, qtyBounds, qtyView, quickQty, recipeUsage, roundToStep, unitAbbr, unitsFor,
  type CatalogSort, type Category, type Ingredient, type SaleUnit,
} from '../../../shared/kitchen/index.js';

const CATS: Category[] = ['خضروات', 'فواكه', 'لحوم ودواجن', 'ألبان وبيض', 'حبوب ونشويات', 'مخبوزات', 'توابل', 'زيوت', 'محليات', 'معلبات وصلصات'];
const SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'name', label: 'الاسم' }, { value: 'price', label: 'السعر' }, { value: 'kcal100', label: 'السعرات لكل 100 غ' }, { value: 'protein_per_rm', label: 'البروتين لكل رينغيت' }, { value: 'usage', label: 'الأكثر استخدامًا في وصفاتي' },
];
const UNIT_NAME: Partial<Record<SaleUnit, string>> = { g: 'غرام', piece: 'حبة' };
const unitName = (u: SaleUnit): string => UNIT_NAME[u] ?? unitAbbr(u);
/** الكمية الافتراضية السريعة: 0.5 كغ / 1 وحدة */
const defaultQty = (ing: Ingredient): { qty: number; unit: SaleUnit } => (ing.sale_unit === 'kg' ? { qty: 0.5, unit: 'kg' } : { qty: 1, unit: ing.sale_unit });
/** وصف سطر واحد من بيانات المكوّن فقط — لا اختلاق (N-09/AS-12) */
const blurb = (i: Ingredient): string => i.note ?? `${i.category} · ${fmtKcal(per100g(i.slug).kcal)} سعرة لكل 100 غ`;

/** A1 — المتجر: شبكة منتجات بفلاتر وبحث وفرز في الرابط، ولوحة منتج برابط عميق /kitchen/store/:slug */
export default function KitchenStore() {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const k = useKitchen();
  const act = useAct();
  const [qRaw, setQ] = useUrlParam<string>('q', '');
  const q = useDebounced(qRaw, 80);
  const [cat, setCat] = useUrlParam<string>('cat', '');
  const [sort, setSort] = useUrlParam<CatalogSort | ''>('sort', '', ['', ...SORTS.map((s) => s.value)] as const);
  const [view, setView] = useUrlParam<'in' | 'cart' | ''>('only', '', ['', 'in', 'cart'] as const);
  const [recipe, setRecipe] = useUrlParam<string>('recipe', '');
  const [diet, setDiet] = useUrlParam<'' | 'hp' | 'hf' | 'lk'>('diet', '', ['', 'hp', 'hf', 'lk'] as const);
  const [pmax, setPmax] = useUrlParam<string>('pmax', '');
  const pantrySet = useMemo(() => new Set(k.pantry.filter((p) => p.grams > 0).map((p) => p.ingredient)), [k.pantry]);
  const cartSet = useMemo(() => new Set(k.cart.map((l) => l.ingredient)), [k.cart]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...INGREDIENTS.map((i) => pickPrice(k.idx, i.slug, 'selected_store', k.store)?.price_rm ?? 0))), [k.idx, k.store]);
  const list = useMemo(
    () => filterCatalog(k.idx, k.store, {
      q, category: (cat as Category) || null, sort: sort || undefined,
      ...(view === 'in' ? { inPantry: pantrySet } : {}), ...(view === 'cart' ? { inCart: cartSet } : {}),
      recipe: recipe || null, highProtein: diet === 'hp', highFiber: diet === 'hf', lowKcal: diet === 'lk', ...(pmax ? { priceMax: Number(pmax) } : {}),
    }),
    [k.idx, k.store, q, cat, sort, view, recipe, diet, pmax, pantrySet, cartSet],
  );
  const open = slug ? INGREDIENT_BY_SLUG.get(slug) : undefined;
  const base = `/kitchen/store${loc.search}`;
  const closeSheet = useCallback(() => nav(base), [nav, base]);
  const filtersOn = !!(qRaw || cat || sort || view || recipe || diet || pmax);
  const reset = (): void => { setQ(''); setCat(''); setSort(''); setView(''); setRecipe(''); setDiet(''); setPmax(''); };

  const quickAdd = (i: Ingredient): void => {
    const d = defaultQty(i);
    const have = k.cart.find((l) => l.ingredient === i.slug);
    void act(() => setCartLine(i.slug, have && have.unit === d.unit ? clampQty(i, d.unit, have.qty + d.qty) : d.qty, d.unit, have?.store ?? null), `أُضيف «${i.name_ar}» إلى السلة`);
  };

  return (
    <div className="page kitchen kt-store">
      <PageHead title="المتجر" icon="board" sub="26 مكوّنًا مقفلًا بأسعار الأسواق الخمسة. اضغط منتجًا لتحديد الكمية ورؤية التغذية والمبلغ فورًا." actions={<KitchenChips />} />
      <Card className="kt-filters">
        <div className="kt-filter-row">
          <input className="input kt-search" type="search" value={qRaw} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: بيض، egg، telur، كزبره…" aria-label="بحث في المتجر" />
          <label className="kt-inline">السوق <StoreSelect /></label>
          <label className="kt-inline">الفرز
            <select className="select" aria-label="الفرز" value={sort} onChange={(e) => setSort(e.target.value as CatalogSort | '')}>
              <option value="">{q ? 'الأكثر صلة' : 'الاسم'}</option>
              {SORTS.filter((s) => s.value !== 'name').map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <div className="chips" role="group" aria-label="الفئات">
          <button type="button" className={cx('chip', !cat && 'active')} aria-pressed={!cat} onClick={() => setCat('')}>الكل</button>
          {CATS.map((c) => <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>)}
        </div>
        <div className="kt-filter-row sub">
          <Segmented<'' | 'in' | 'cart'> label="نطاق العرض" value={view} onChange={setView} options={[{ value: '', label: 'الكل' }, { value: 'in', label: 'في مخزني' }, { value: 'cart', label: 'في السلة' }]} />
          <Segmented<'' | 'hp' | 'hf' | 'lk'> label="اعتبارات غذائية (عرض لا أحكام صحية)" value={diet} onChange={setDiet} options={[{ value: '', label: 'بلا' }, { value: 'hp', label: 'بروتين مرتفع' }, { value: 'hf', label: 'ألياف مرتفعة' }, { value: 'lk', label: 'سعرات منخفضة لكل 100 غ' }]} />
          <label className="kt-inline">يُستخدم في
            <select className="select" aria-label="يُستخدم في وصفة" value={recipe} onChange={(e) => setRecipe(e.target.value)}>
              <option value="">أي وصفة</option>
              {ORIGINAL_RECIPES.map((r) => <option key={r.slug} value={r.slug}>{r.title_ar}</option>)}
            </select>
          </label>
          <label className="kt-inline">سقف السعر <input type="range" min={1} max={maxPrice} step={1} value={pmax || maxPrice} onChange={(e) => setPmax(Number(e.target.value) >= maxPrice ? '' : e.target.value)} aria-label="سقف سعر الوحدة" /> <b className="num" dir="ltr">{pmax ? fmtRM(Number(pmax)) : 'بلا سقف'}</b></label>
          {filtersOn && <Button size="sm" icon="x" onClick={reset}>مسح الفلاتر</Button>}
        </div>
      </Card>

      <p className="muted kt-count" role="status" aria-live="polite">{fmtNum(list.length, 0)} من {fmtNum(INGREDIENTS.length, 0)} منتجًا</p>
      {!k.ready ? (
        <ul className="plain kt-grid" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <li key={i}><Skeleton h={190} r={14} /></li>)}</ul>
      ) : list.length === 0 ? (
        <EmptyState icon="search" title="لا منتج يطابق الفلاتر" text={q ? `لا نتيجة لـ«${q}». جرّب اسمًا آخر أو امسح الفلاتر.` : 'خفّف الفلاتر لرؤية منتجات أكثر.'} action={<Button onClick={reset}>مسح الفلاتر</Button>} />
      ) : (
        <ul className="plain kt-grid">
          {list.map((i) => {
            const p = pickPrice(k.idx, i.slug, 'selected_store', k.store);
            const stock = k.pantry.find((x) => x.ingredient === i.slug && x.grams > 0);
            const used = recipeUsage(i.slug);
            const inCart = k.cart.find((l) => l.ingredient === i.slug);
            return (
              <li key={i.slug} className="kt-prod" data-slug={i.slug}>
                <Link to={`/kitchen/store/${i.slug}${loc.search}`} className="kt-prod-main">
                  <span className="kt-ico" aria-hidden="true"><IngIcon slug={i.slug} category={i.category} size={20} /></span>
                  <strong>{i.name_ar}</strong>
                  <small className="muted" dir="ltr">{i.name_ms}</small>
                  <small className="muted">{blurb(i)}</small>
                  <PriceTag ing={i} point={p} />
                  <span className="kt-badges">
                    {stock && <Badge tone="ok">في مخزني: <span className="num">{fmtNum(Math.round(stock.grams), 0)}</span> غ</Badge>}
                    {inCart && <Badge tone="accent">في السلة</Badge>}
                    <Badge>{used ? `يُستخدم في ${fmtNum(used, 0)} وصفة` : 'غير مستعمل في الـ12'}</Badge>
                  </span>
                </Link>
                <div className="row kt-prod-act">
                  <Button size="sm" variant="primary" icon="plus" onClick={() => quickAdd(i)} aria-label={`أضف ${i.name_ar} إلى السلة`}>أضف</Button>
                  <Button size="sm" to={`/kitchen/store/${i.slug}${loc.search}`}>تفاصيل</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && <ProductSheet ing={open} onClose={closeSheet} />}
      {slug && !open && <Modal title="منتج غير موجود" onClose={closeSheet}><p>«{slug}» خارج القائمة المقفلة (26 مكوّنًا).</p><Link to="/kitchen/store">العودة للمتجر</Link></Modal>}
    </div>
  );
}

/** A1-10…16: لوحة المنتج — كمية بوحدة المنتج، تغذية ومبلغ لحظيان، مقارنة الأسواق، إضافة وشراء */
function ProductSheet({ ing, onClose }: { ing: Ingredient; onClose: () => void }) {
  const k = useKitchen();
  const act = useAct();
  const { confirm } = useApp();
  const nav = useNavigate();
  const inCart = k.cart.find((l) => l.ingredient === ing.slug);
  const d0 = inCart ? { qty: inCart.qty, unit: inCart.unit } : defaultQty(ing);
  const [unit, setUnit] = useState<SaleUnit>(d0.unit);
  const [qty, setQty] = useState<number>(d0.qty);
  const [text, setText] = useState<string>(String(d0.qty));
  const [bump, setBump] = useState(false);
  const b = qtyBounds(ing, unit);
  const units = unitsFor(ing);
  const point = pickPrice(k.idx, ing.slug, 'selected_store', k.store);
  const v = useMemo(() => qtyView(ing.slug, qty, unit), [ing.slug, qty, unit]);
  const cost = point ? amountRm(ing.slug, qty, unit, point.price_rm) : null;
  const notice = point ? packNotice(ing.slug, qty, unit, point.price_rm) : null;
  const used = ORIGINAL_RECIPES.filter((r) => r.lines.some((l) => l.ingredient === ing.slug));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const apply = (n: number): void => {
    const c = clampQty(ing, unit, Number.isFinite(n) ? n : b.min);
    setQty(c);
    setText(String(c));
  };
  const changeUnit = (u: SaleUnit): void => {
    // نحافظ على الوزن الإجمالي عند التبديل (كغ ↔ غ ↔ حبة)
    const g = qtyView(ing.slug, qty, unit).grossG;
    const per = qtyView(ing.slug, 1, u).grossG;
    const nb = qtyBounds(ing, u);
    const c = roundToStep(Math.min(nb.max, Math.max(nb.min, g / per)), nb.step);
    setUnit(u);
    setQty(c);
    setText(String(c));
  };
  const add = (): void => {
    void act(() => setCartLine(ing.slug, qty, unit, inCart?.store ?? null), `أُضيف «${ing.name_ar}» إلى السلة`).then((r) => {
      if (r !== null) {
        setBump(true);
        timer.current = setTimeout(() => setBump(false), 700);
      }
    });
  };
  const buyNow = async (): Promise<void> => {
    if (!point || cost === null) return;
    const ok = await confirm({ title: `اشترِ الآن: ${ing.name_ar}؟`, body: <>سيُسجَّل شراء داخلي بمبلغ <b>{fmtRM(cost)}</b> من {storeName(k.store)} ويُخصم من المحفظة ويُضاف إلى المخزن. <b>لا دفع حقيقي.</b></>, confirmLabel: 'سجّل الشراء' });
    if (!ok) return;
    const r = await act(() => quickBuy(ing.slug, qty, unit, k.store), 'سُجّل الشراء وأُضيف إلى المخزن');
    if (r === null && !k.wallet?.configured) nav('/kitchen/wallet');
  };

  return (
    <Modal wide title={<span className="kt-sheet-title"><span aria-hidden="true"><IngIcon slug={ing.slug} category={ing.category} size={20} /></span> {ing.name_ar} <small className="muted" dir="ltr">{ing.name_ms}</small></span>} onClose={onClose}
      footer={<>
        <Button onClick={onClose}>إغلاق</Button>
        <Button icon="check" onClick={() => void buyNow()} disabled={!point}>اشترِ الآن</Button>
        <span className={bump ? 'kt-bump' : undefined}><Button variant="primary" icon="plus" onClick={add}>{inCart ? 'حدّث الكمية في السلة' : 'أضف إلى السلة'}</Button></span>
      </>}>
      <div className="kt-sheet">
        <div className="kt-sheet-main">
          <p className="muted">{ing.category} · {blurb(ing)}</p>
          <div className="row kt-flags">
            {ing.flags.includes('assumed_pack') && <Badge dashed title="DEF-07">حجم العبوة غير مؤكد</Badge>}
            {ing.flags.includes('needs_label_verification') && <Badge tone="warn" title="DEF-04">القيمة الغذائية تحتاج مطابقة الملصق</Badge>}
            {ing.flags.includes('needs_owner_confirmation') && <Badge tone="warn">يحتاج تأكيدك</Badge>}
            {point?.source === 'estimate_tier' && <Badge dashed>تقديري</Badge>}
          </div>
          {ing.slug === 'chicken' && <p className="callout" role="note">النوع غير محدد (DEF-05): القيم الغذائية محسوبة على صدر نيء. حدّد نوع الدجاج الذي تشتريه فعلًا عند تأكيد الملصق.</p>}
          {ing.slug === 'tomato_paste' && <p className="callout" role="note">سمّيتَه «الكاتشب» (DEF-03): قد يكون معجون طماطم أو كاتشبًا. القيم الحالية لمعجون الطماطم.</p>}

          <div className="kt-qty" role="group" aria-label="الكمية">
            <div className="row">
              <button type="button" className="icon-btn" aria-label="أنقص" onClick={() => apply(qty - b.step)} disabled={qty <= b.min}><Icon name="down" size={16} /></button>
              <input className="input kt-qty-in num" dir="ltr" inputMode="decimal" aria-label={`الكمية بـ${unitName(unit)}`} value={text}
                onChange={(e) => { setText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && e.target.value.trim() !== '') setQty(Math.min(b.max, Math.max(b.min, n))); }}
                onBlur={() => apply(Number(text))} onKeyDown={(e) => { if (e.key === 'Enter') apply(Number(text)); }} />
              <button type="button" className="icon-btn" aria-label="زِد" onClick={() => apply(qty + b.step)} disabled={qty >= b.max}><Icon name="up" size={16} /></button>
              <Segmented<SaleUnit> label="الوحدة" value={unit} onChange={changeUnit} options={units.map((u) => ({ value: u, label: unitName(u) }))} />
            </div>
            <div className="row kt-quick">{quickQty(ing, unit).map((qq) => <button key={qq.label} type="button" className="chip" onClick={() => apply(qq.qty)}>{qq.label}</button>)}</div>
            <small className="muted">خطوة <span className="num">{fmtNum(b.step, 2)}</span> · من <span className="num">{fmtNum(b.min, 2)}</span> إلى <span className="num">{fmtNum(b.max, 2)}</span> · الكمية: {countPhrase(qty, unit)}</small>
          </div>

          <div className="kt-live" aria-live="polite">
            <NutriGrid n={v.nutrition} unitLabel="القيم الغذائية للكمية المختارة" />
            <small className="muted">للكمية المختارة (<span className="num">{fmtNum(Math.round(v.edibleG), 0)}</span> غ صالحة للأكل من <span className="num">{fmtNum(Math.round(v.grossG), 0)}</span> غ مشتراة) · لكل 100 غ: <span className="num" dir="ltr">{fmtKcal(v.per100.kcal)}</span> سعرة · بروتين <span className="num">{fmtNum(v.per100.protein_g, 1)}</span> · كارب <span className="num">{fmtNum(v.per100.carbs_g, 1)}</span> · دهن <span className="num">{fmtNum(v.per100.fat_g, 1)}</span> · ألياف <span className="num">{fmtNum(v.per100.fiber_g, 1)}</span></small>
            <div className="kt-total" data-testid="amount">
              <span>المبلغ من {storeName(k.store)}</span>
              <b className="num" dir="ltr">{cost === null ? '—' : fmtRM(cost)}</b>
            </div>
            {point && <small className="muted">سعر {unitAbbr(ing.sale_unit)}: <span className="num" dir="ltr">{fmtRM(point.price_rm)}</span> × <span className="num">{fmtNum(qtyView(ing.slug, qty, unit).grossG / qtyView(ing.slug, 1, ing.sale_unit).grossG, 3)}</span></small>}
            {notice?.exceeds && point && <p className="callout warn" role="note">الشراء الفعلي بعبوة كاملة: <span className="num">{fmtNum(notice.packs, 0)}</span> × {fmtRM(point.price_rm)} = <b>{fmtRM(notice.fullRm)}</b> (أكبر من الكمية المطلوبة).</p>}
          </div>
        </div>

        <div className="kt-sheet-side">
          <h3>مقارنة الأسواق</h3>
          <div className="tbl-wrap">
            <table className="tbl kt-cmp">
              <thead><tr><th>السوق</th><th>سعر {unitAbbr(ing.sale_unit)}</th><th>المصدر</th><th>آخر تحديث</th></tr></thead>
              <tbody>
                {STORES.map((s) => {
                  const p = pickPrice(k.idx, ing.slug, 'selected_store', s.slug);
                  const cheapest = STORES.every((o) => (pickPrice(k.idx, ing.slug, 'selected_store', o.slug)?.price_rm ?? Infinity) >= (p?.price_rm ?? Infinity));
                  return (
                    <tr key={s.slug} className={cx(s.slug === k.store && 'sel')}>
                      <th scope="row">{s.name}{cheapest && <> <Badge tone="ok">الأرخص</Badge></>}</th>
                      <td className="num" dir="ltr">{p ? fmtRM(p.price_rm) : '—'}</td>
                      <td>{p ? <>{SOURCE_LABEL[p.source]}{p.unverified && <> <Badge tone="warn">غير متحقَّق</Badge></>}</> : '—'}</td>
                      <td className="num" dir="ltr">{p ? p.observed_at.slice(0, 10) : '—'}{p && p.source !== 'estimate_tier' && isStale(p.observed_at) ? ' · قديم' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <label className="kt-inline">السوق المختار <StoreSelect /></label>
          <h3>يُستخدم في</h3>
          {used.length === 0 ? <p className="muted">غير مستعمل في الوصفات الـ12.</p> : (
            <div className="row">{used.map((r) => <Link key={r.slug} to={`/kitchen/codex/${r.slug}`} className="chip">{r.title_ar}</Link>)}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
