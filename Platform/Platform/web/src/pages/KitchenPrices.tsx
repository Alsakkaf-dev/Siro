import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field, Segmented, cx } from '../ui/ui.js';
import { useApp } from '../core/app-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { KitchenChips, Section, storeName, storeShort, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { bulkPercent, copyPrices, decideRequest, fetchAudit, requestIngredient, revertAudit, setPrice, type AuditRow, KitchenApiError } from '../kitchen/store.js';
import { IngIcon } from '../kitchen/kitchenIcons.js';
import { Icon } from '../lib/icons.js';
import {
  INGREDIENTS, INGREDIENT_BY_SLUG, ORIGINAL_CARDS, SOURCE_LABEL, STORES, cardOf, cartTotals, checkPriceChange, fmtNum, fmtRM, indexPrices, isStale, toGrams, unitAbbr,
  type Category, type PricePoint,
} from '../../../shared/kitchen/index.js';

type Tab = 'matrix' | 'audit' | 'tools' | 'requests';
const CATS: Category[] = ['خضروات', 'فواكه', 'لحوم ودواجن', 'ألبان وبيض', 'حبوب ونشويات', 'مخبوزات', 'توابل', 'زيوت', 'محليات', 'معلبات وصلصات'];

/** B1 — تحديث الأسعار (للمالك): مصفوفة 26 × 5 بتحرير مباشر (Enter يحفظ، Esc يلغي)، أثر فوري، تدقيق وتراجع، أدوات جماعية، وطلبات المكوّنات */
export default function KitchenPrices() {
  const k = useKitchen();
  const [tab, setTab] = useUrlParam<Tab>('tab', 'matrix', ['matrix', 'audit', 'tools', 'requests'] as const);
  return (
    <div className="page kitchen kt-prices">
      <PageHead title="تحديث الأسعار" icon="tag" sub="أي تعديل هنا يظهر فورًا في المتجر والسلة وتكلفة البطاقات. الكتابة للمالك فقط ويُفرض ذلك على الخادم." actions={<KitchenChips />} />
      <Segmented<Tab> label="أقسام الصفحة" value={tab} onChange={setTab} options={[{ value: 'matrix', label: 'المصفوفة' }, { value: 'audit', label: 'سجل التدقيق' }, { value: 'tools', label: 'أدوات جماعية' }, { value: 'requests', label: `طلبات مكوّنات${k.requests.filter((r) => r.status === 'pending').length ? ` (${fmtNum(k.requests.filter((r) => r.status === 'pending').length, 0)})` : ''}` }]} />
      <div className="kt-tab-gap" />
      {tab === 'matrix' && <Matrix />}
      {tab === 'audit' && <Audit />}
      {tab === 'tools' && <Tools />}
      {tab === 'requests' && <Requests />}
    </div>
  );
}

function Matrix() {
  const k = useKitchen();
  const act = useAct();
  const { confirm, toast } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | Category>('');
  const rows = useMemo(() => INGREDIENTS.filter((i) => (!cat || i.category === cat) && (!q.trim() || [i.name_ar, i.name_en, i.name_ms, ...i.synonyms].some((f) => f.toLowerCase().includes(q.trim().toLowerCase())))), [q, cat]);
  const byKey = useMemo(() => new Map(k.prices.map((p) => [`${p.ingredient}|${p.store}`, p])), [k.prices]);

  const save = useCallback(async (ingredient: string, store: string, raw: string): Promise<boolean> => {
    const n = Number(raw.replace(',', '.'));
    const old = getOld(ingredient, store);
    const chk = checkPriceChange(ingredient, store, old, n);
    if (!chk.ok) {
      toast(chk.error ?? 'سعر غير صالح', { kind: 'error' });
      return false;
    }
    if (chk.needsConfirm && !(await confirm({ title: 'تغيّر كبير في السعر', body: <>من <b>{old === null ? '—' : fmtRM(old)}</b> إلى <b>{fmtRM(n)}</b> (×{fmtNum(chk.ratio ?? 0, 2)}). هل هو صحيح؟</>, confirmLabel: 'نعم، احفظ' }))) return false;
    const r = await act(() => setPrice(ingredient, store, n, { confirm: chk.needsConfirm }));
    if (r === null) return false;
    for (const w of r.warnings) toast(`تحذير: ${w}`, { kind: 'info' });
    return true;
  }, [act, confirm, toast]);
  const getOld = (ingredient: string, store: string): number | null => byKey.get(`${ingredient}|${store}`)?.price_rm ?? null;

  return (
    <>
      <Card>
        <div className="row kt-filter-row">
          <input className="input kt-search" type="search" placeholder="ابحث عن مكوّن" aria-label="ابحث عن مكوّن" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" aria-label="الفئة" value={cat} onChange={(e) => setCat(e.target.value as '' | Category)}><option value="">كل الفئات</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <small className="muted">انقر خلية للتحرير · Enter يحفظ · Esc يلغي · «قديم» بعد 30 يومًا من التحديث</small>
        </div>
        <div className="tbl-wrap kt-matrix-wrap">
          <table className="tbl kt-matrix" aria-label="مصفوفة أسعار المكوّنات في الأسواق الخمسة">
            <thead>
              <tr>
                <th scope="col">المكوّن</th><th scope="col">وحدة البيع</th>
                {STORES.map((s) => <th key={s.slug} scope="col" title={s.name}>{storeShort(s.slug)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.slug} data-ing={i.slug}>
                  <th scope="row"><span aria-hidden="true"><IngIcon slug={i.slug} category={i.category} /></span> {i.name_ar}</th>
                  <td><small className="muted">{unitAbbr(i.sale_unit)} · <span className="num" dir="ltr">{fmtNum(toGrams(i, 1), 0)}</span> غ</small></td>
                  {STORES.map((s) => <Cell key={s.slug} point={byKey.get(`${i.slug}|${s.slug}`)} ingredient={i.slug} store={s.slug} onSave={save} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="muted">لا مكوّن يطابق البحث.</p>}
      </Card>
      <Impact />
    </>
  );
}

const Cell = memo(function Cell({ point, ingredient, store, onSave }: { point: PricePoint | undefined; ingredient: string; store: string; onSave: (ing: string, store: string, raw: string) => Promise<boolean> }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (edit) { ref.current?.focus(); ref.current?.select(); } }, [edit]);
  const stale = point && point.source !== 'estimate_tier' && isStale(point.observed_at);
  const commit = async (): Promise<void> => {
    setEdit(false);
    if (point && Number(val) === point.price_rm) return;
    await onSave(ingredient, store, val);
  };
  return (
    <td className={cx('kt-cell', point?.source === 'estimate_tier' && 'est')} data-cell={`${ingredient}|${store}`}>
      {edit ? (
        <input ref={ref} className="input kt-cell-in num" dir="ltr" inputMode="decimal" aria-label={`سعر ${INGREDIENT_BY_SLUG.get(ingredient)?.name_ar} في ${storeName(store)}`} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void commit(); else if (e.key === 'Escape') setEdit(false); }} onBlur={() => setEdit(false)} />
      ) : (
        <button type="button" className="kt-cell-btn" onClick={() => { setVal(point ? String(point.price_rm) : ''); setEdit(true); }}>
          <span className="sr-only">{INGREDIENT_BY_SLUG.get(ingredient)?.name_ar} في {storeName(store)}: </span>
          <b className="num" dir="ltr" data-price>{point ? point.price_rm.toFixed(2) : '—'}</b>
          {point && <small title={`آخر تحديث ${point.observed_at.slice(0, 10)}`}>{SOURCE_LABEL[point.source]}{point.unverified ? <Icon name="warn" size={11} /> : null}{stale ? ' · قديم' : ''} · <span className="num" dir="ltr">{point.observed_at.slice(5, 10)}</span></small>}
          <span className="sr-only"> — تحرير</span>
        </button>
      )}
    </td>
  );
});

/** B1-03 «ماذا تغيّر»: أثر آخر تعديل على السلة وتكلفة البطاقات */
function Impact() {
  const k = useKitchen();
  const c = k.lastChange;
  const impact = useMemo(() => {
    if (!c || c.from === null) return null;
    const before = indexPrices(k.prices.map((p) => (p.ingredient === c.ingredient && p.store === c.store ? { ...p, price_rm: c.from! } : p)));
    const cartAfter = cartTotals(k.cart, k.idx, k.store).total_rm;
    const cartBefore = cartTotals(k.cart, before, k.store).total_rm;
    const cards = ORIGINAL_CARDS(k.idx, k.store).filter((cd) => cd.recipe.lines.some((l) => l.ingredient === c.ingredient)).map((cd) => {
      const b = cardOf(cd.recipe, before, k.store);
      return { cd, delta: cd.cost_rm !== null && b.cost_rm !== null ? cd.cost_rm - b.cost_rm : null, eco: [b.stats?.ECO ?? null, cd.stats?.ECO ?? null] as const };
    });
    return { cartAfter, cartBefore, cards };
  }, [c, k.prices, k.cart, k.idx, k.store]);
  if (!c) return null;
  const ing = INGREDIENT_BY_SLUG.get(c.ingredient);
  return (
    <Section title="ماذا تغيّر">
      <Card>
        <p data-testid="impact-head"><b>{ing?.name_ar}</b> في {storeName(c.store)}: <span className="num" dir="ltr">{c.from === null ? '—' : fmtRM(c.from)}</span> ← <b className="num" dir="ltr">{fmtRM(c.to)}</b></p>
        {impact && (
          <>
            <p data-testid="impact-cart">أثره على السلة الحالية ({storeName(k.store)}): <span className="num" dir="ltr">{fmtRM(impact.cartBefore)}</span> ← <b className="num" dir="ltr">{fmtRM(impact.cartAfter)}</b> ({impact.cartAfter - impact.cartBefore >= 0 ? '+' : '−'}<span className="num" dir="ltr">{fmtRM(Math.abs(impact.cartAfter - impact.cartBefore))}</span>)</p>
            {impact.cards.length > 0 && (
              <ul className="plain kt-impact-cards">
                {impact.cards.map(({ cd, delta, eco }) => <li key={cd.slug}>{cd.title_ar}: {delta === null ? 'تكلفة غير معروفة' : <b className="num" dir="ltr">{delta >= 0 ? '+' : '−'}{fmtRM(Math.abs(delta))}</b>}{eco[0] !== null && eco[1] !== null && eco[0] !== eco[1] && <small className="muted"> · ECO <span className="num">{eco[0]}</span> ← <span className="num">{eco[1]}</span></small>}</li>)}
              </ul>
            )}
          </>
        )}
      </Card>
    </Section>
  );
}

function Audit() {
  const k = useKitchen();
  const act = useAct();
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const load = useCallback(() => { void fetchAudit(200).then((r) => setRows(r.audit)).catch(() => setRows([])); }, []);
  useEffect(load, [load, k.version]);
  const reverted = useMemo(() => new Set((rows ?? []).map((r) => r.reverted_of).filter(Boolean)), [rows]);
  if (rows === null) return <p className="muted">جارٍ التحميل…</p>;
  if (rows.length === 0) return <EmptyState icon="list" title="لا تعديلات بعد" text="كل تعديل سعر يُسجَّل هنا: قديم ← جديد، والمصدر والوقت، مع تراجع." />;
  return (
    <Card>
      <CardHead title="سجل التدقيق" icon="list" />
      <div className="tbl-wrap">
        <table className="tbl kt-audit">
          <thead><tr><th>الوقت</th><th>المكوّن</th><th>السوق</th><th>التغيير</th><th>المصدر</th><th>السبب</th><th><span className="sr-only">تراجع</span></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-kind={r.kind}>
                <td className="num" dir="ltr">{r.at.slice(0, 16).replace('T', ' ')}</td>
                <td>{INGREDIENT_BY_SLUG.get(r.ingredient)?.name_ar}</td>
                <td>{storeShort(r.store)}</td>
                <td className="num" dir="ltr">{r.old_price === null ? '—' : r.old_price.toFixed(2)} ← <b>{r.new_price.toFixed(2)}</b></td>
                <td>{SOURCE_LABEL[r.new_source as keyof typeof SOURCE_LABEL] ?? r.new_source}{r.kind === 'revert' && <> <Badge>تراجع</Badge></>}{r.kind === 'bulk' && <> <Badge>جماعي</Badge></>}</td>
                <td><small className="muted">{r.reason ?? ''}</small></td>
                <td>{r.kind === 'seed' || r.kind === 'revert' || reverted.has(r.id) ? (reverted.has(r.id) ? <Badge dashed>تم التراجع</Badge> : null) : <Button size="sm" icon="undo" onClick={() => void act(() => revertAudit(r.id), 'تم التراجع').then(load)}>تراجع</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Tools() {
  const k = useKitchen();
  const act = useAct();
  const { confirm } = useApp();
  const [store, setStore] = useState(k.store);
  const [pct, setPct] = useState('');
  const [cat, setCat] = useState<'' | Category>('');
  const [from, setFrom] = useState(STORES[0]!.slug);
  const [to, setTo] = useState(STORES[1]!.slug);
  const p = Number(pct);
  const apply = async (): Promise<void> => {
    const factor = 1 + p / 100;
    const big = factor > 3 || factor < 1 / 3;
    if (!(await confirm({ title: 'تعديل جماعي', body: <>تعديل أسعار <b>{storeName(store)}</b>{cat ? <> (فئة {cat})</> : ' كاملةً'} بنسبة <b className="num" dir="ltr">{p > 0 ? '+' : ''}{p}%</b>؟ يمكن التراجع عن كل سعر من سجل التدقيق.</>, confirmLabel: 'طبّق', danger: big }))) return;
    await act(() => bulkPercent(store, p, { ...(cat ? { category: cat } : {}), confirm: big }), 'طُبّق التعديل الجماعي');
  };
  const doCopy = async (): Promise<void> => {
    if (!(await confirm({ title: 'نسخ أسعار سوق', body: <>نسخ كل أسعار <b>{storeName(from)}</b> إلى <b>{storeName(to)}</b> (يستبدل أسعاره الحالية).</>, confirmLabel: 'انسخ', danger: true }))) return;
    await act(() => copyPrices(from, to, true), 'نُسخت الأسعار');
  };
  return (
    <div className="grid cols-2">
      <Card>
        <CardHead title="تعديل بنسبة (±%)" icon="sliders" />
        <div className="grid cols-2">
          <Field label="السوق" htmlFor="bk-s"><select id="bk-s" className="select" value={store} onChange={(e) => setStore(e.target.value)}>{STORES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
          <Field label="الفئة" htmlFor="bk-c"><select id="bk-c" className="select" value={cat} onChange={(e) => setCat(e.target.value as '' | Category)}><option value="">كل الفئات</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="النسبة %" htmlFor="bk-p" hint="مثال: 5 أو ‎-10"><input id="bk-p" className="input num" dir="ltr" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        </div>
        <div className="row"><Button variant="primary" disabled={!pct.trim() || !Number.isFinite(p) || p < -90 || p > 500 || p === 0} onClick={() => void apply()}>طبّق</Button></div>
      </Card>
      <Card>
        <CardHead title="نسخ أسعار سوق إلى آخر" icon="copy" />
        <div className="grid cols-2">
          <Field label="من" htmlFor="cp-f"><select id="cp-f" className="select" value={from} onChange={(e) => setFrom(e.target.value)}>{STORES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
          <Field label="إلى" htmlFor="cp-t"><select id="cp-t" className="select" value={to} onChange={(e) => setTo(e.target.value)}>{STORES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
        </div>
        <div className="row"><Button disabled={from === to} onClick={() => void doCopy()}>انسخ</Button></div>
        <p className="muted">غير متاح بعد في هذه المرحلة: استيراد/تصدير CSV، وضع الإيصال، PriceCatcher، تعديل حجم العبوة، تبويب المتاجر (مسجّل في ASSUMPTIONS_LOG).</p>
      </Card>
    </div>
  );
}

function Requests() {
  const k = useKitchen();
  const act = useAct();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const STATUS: Record<string, string> = { pending: 'معلّق', approved: 'موافَق', rejected: 'مرفوض' };
  return (
    <div className="grid cols-2">
      <Card>
        <CardHead title="طلب إضافة مكوّن" icon="plus" />
        <p className="muted">القائمة مقفلة على 26 مكوّنًا. الطلب يُسجَّل فقط، والموافقة قرارك، وإضافة المكوّن فعليًا تغيير برمجي (G-04).</p>
        <Field label="اسم المكوّن" htmlFor="rq-n"><input id="rq-n" className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="ملاحظة" htmlFor="rq-t"><input id="rq-t" className="input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="row"><Button variant="primary" disabled={name.trim().length < 2} onClick={() => void act(() => requestIngredient(name.trim(), note.trim() || undefined), 'سُجّل الطلب').then((r) => { if (r !== null) { setName(''); setNote(''); } })}>سجّل الطلب</Button></div>
      </Card>
      <Card>
        <CardHead title="الطلبات" icon="list" />
        {k.requests.length === 0 ? <p className="muted">لا طلبات.</p> : (
          <ul className="plain stack kt-tight">
            {k.requests.map((r) => (
              <li key={r.id} data-req={r.status}>
                <b>{r.name_ar}</b> <Badge tone={r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'danger' : 'warn'}>{STATUS[r.status]}</Badge>
                {r.note && <small className="muted"> — {r.note}</small>}
                <div className="row">
                  {r.status !== 'approved' && <Button size="sm" onClick={() => void act(() => decideRequest(r.id, 'approved'))}>وافق</Button>}
                  {r.status !== 'rejected' && <Button size="sm" onClick={() => void act(() => decideRequest(r.id, 'rejected'))}>ارفض</Button>}
                  {r.status !== 'pending' && <Button size="sm" onClick={() => void act(() => decideRequest(r.id, 'pending'))}>أعد للمعلّق</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
