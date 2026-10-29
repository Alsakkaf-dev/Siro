import { useCallback, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, EmptyState, Modal, Segmented, Skeleton, cx } from '../ui/ui.js';
import { useApp } from '../core/app-context.js';
import { useUrlParam } from '../core/useUrlParam.js';
import { KitchenChips, NutriGrid, Section, storeShort, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { setCartLine } from '../kitchen/store.js';
import {
  BADGE_LABEL, INGREDIENTS, INGREDIENT_BY_SLUG, ORIGINAL_CARDS, RARITY_LABEL, STORES, addToLine, cardFeasibility, cardOf, compareCards, fmtKcal, fmtNum, fmtRM, inventoryFrom, mealCost, nutritionOf, per100g, qtyForEdible, scaleLines,
  type CardStats, type CardView, type MealType, type Profile,
} from '../../../shared/kitchen/index.js';

const MEALS: MealType[] = ['فطور', 'غداء', 'عشاء'];
const MEAL_KEY: Record<MealType, string> = { فطور: 'bk', غداء: 'ln', عشاء: 'dn' };
const PROFILE_AR: Record<Profile, string> = { raw: 'نيء/جاف', cooked: 'مطبوخ', juice: 'عصير' };
const STAT_KEYS: (keyof Omit<CardStats, 'OVR'>)[] = ['ENG', 'PRO', 'CAR', 'FAT', 'FIB', 'ECO'];
const STAT_AR: Record<keyof CardStats, string> = { ENG: 'الطاقة', PRO: 'البروتين', CAR: 'الكربوهيدرات', FAT: 'الدهون', FIB: 'الألياف', ECO: 'الاقتصاد', OVR: 'التقييم' };
type Sort = 'order' | 'ovr' | 'kcal' | 'cost';

/** A2 — قاموس الوجبات: بطاقات على هيئة بطاقات لاعبين (إحصاءات MC-10) مقسّمة فطور/غداء/عشاء، فلاتر وفرز ومقارنة، وظهر البطاقة */
export default function KitchenCodex() {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const k = useKitchen();
  const [q, setQ] = useUrlParam<string>('q', '');
  const [meal, setMeal] = useUrlParam<'' | MealType>('meal', '', ['', ...MEALS] as const);
  const [ing, setIng] = useUrlParam<string>('ing', '');
  const [kmin, setKmin] = useUrlParam<string>('kmin', '');
  const [kmax, setKmax] = useUrlParam<string>('kmax', '');
  const [cmax, setCmax] = useUrlParam<string>('cmax', '');
  const [can, setCan] = useUrlParam<'' | '1'>('can', '', ['', '1'] as const);
  const [status, setStatus] = useUrlParam<'' | 'ok' | 'defect'>('status', '', ['', 'ok', 'defect'] as const);
  const [sort, setSort] = useUrlParam<Sort>('sort', 'order', ['order', 'ovr', 'kcal', 'cost'] as const);
  const [view, setView] = useUrlParam<'grid' | 'list'>('view', 'grid', ['grid', 'list'] as const);
  const [cmp, setCmp] = useState<string[]>([]);
  const [more, setMore] = useState(60);

  const cards = useMemo(() => ORIGINAL_CARDS(k.idx, k.store), [k.idx, k.store]);
  const pantryInv = useMemo(() => inventoryFrom([], Object.fromEntries(k.pantry.map((p) => [p.ingredient, p.grams]))), [k.pantry]);
  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    const out = cards.filter((c) => {
      if (meal && !c.meal_types.includes(meal)) return false;
      if (ing && !c.recipe.lines.some((l) => l.ingredient === ing)) return false;
      if (nq && !(c.title_ar.toLowerCase().includes(nq) || c.slug.includes(nq) || c.recipe.lines.some((l) => { const g = INGREDIENT_BY_SLUG.get(l.ingredient); return g && [g.name_ar, g.name_en, g.name_ms].some((f) => f.toLowerCase().includes(nq)); }))) return false;
      if (kmin && (c.nutrition?.kcal ?? -1) < Number(kmin)) return false;
      if (kmax && (c.nutrition === null || c.nutrition.kcal > Number(kmax))) return false;
      if (cmax && (c.cost_rm === null || c.cost_rm > Number(cmax))) return false;
      if (status === 'ok' && !c.computable) return false;
      if (status === 'defect' && c.computable && !c.badges.includes('text_duplicate')) return false;
      if (can && cardFeasibility(c, pantryInv).status !== 'ready') return false;
      return true;
    });
    const key: Record<Sort, (c: CardView) => number> = { order: () => 0, ovr: (c) => -(c.stats?.OVR ?? -1), kcal: (c) => c.nutrition?.kcal ?? Infinity, cost: (c) => c.cost_rm ?? Infinity };
    return sort === 'order' ? out : [...out].sort((a, b) => key[sort](a) - key[sort](b));
  }, [cards, q, meal, ing, kmin, kmax, cmax, status, can, sort, pantryInv]);

  const open = slug ? cards.find((c) => c.slug === slug) : undefined;
  const closeSheet = useCallback(() => nav(`/kitchen/codex${loc.search}`), [nav, loc.search]);
  const toggleCmp = (s: string): void => setCmp((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= 2 ? [cur[1]!, s] : [...cur, s]));
  const filtersOn = !!(q || meal || ing || kmin || kmax || cmax || can || status);
  const reset = (): void => { setQ(''); setMeal(''); setIng(''); setKmin(''); setKmax(''); setCmax(''); setCan(''); setStatus(''); };
  const sections: { key: string; title: string; items: CardView[] }[] = MEALS.map((m) => ({ key: m, title: m, items: list.filter((c) => c.meal_types[0] === m) }));
  const shown = (items: CardView[]): CardView[] => items.slice(0, more);
  const cmpCards = cmp.map((s) => cards.find((c) => c.slug === s)).filter((c): c is CardView => !!c);

  return (
    <div className="page kitchen kt-codex">
      <PageHead title="قاموس الوجبات" icon="book" sub="وصفاتك الأصلية الـ12 كبطاقات لاعبين. الإحصاءات للمتعة والمقارنة داخل المنصة وليست أحكامًا صحية." actions={<KitchenChips />} />
      <Card className="kt-filters">
        <div className="kt-filter-row">
          <input className="input kt-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الطبق أو مكوّن" aria-label="بحث في القاموس" />
          <label className="kt-inline">المكوّن
            <select className="select" aria-label="مكوّن معيّن" value={ing} onChange={(e) => setIng(e.target.value)}><option value="">أي مكوّن</option>{INGREDIENTS.map((i) => <option key={i.slug} value={i.slug}>{i.name_ar}</option>)}</select>
          </label>
          <label className="kt-inline">الفرز
            <select className="select" aria-label="الفرز" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="order">ترتيب الألبوم</option><option value="ovr">التقييم</option><option value="kcal">السعرات</option><option value="cost">التكلفة</option></select>
          </label>
          <Segmented<'grid' | 'list'> label="العرض" value={view} onChange={setView} options={[{ value: 'grid', label: 'بطاقات' }, { value: 'list', label: 'قائمة' }]} />
        </div>
        <div className="chips" role="group" aria-label="نوع الوجبة">
          <button type="button" className="chip" aria-pressed={!meal} onClick={() => setMeal('')}>الكل</button>
          {MEALS.map((m) => <button key={m} type="button" className="chip" aria-pressed={meal === m} onClick={() => setMeal(meal === m ? '' : m)}>{m}</button>)}
        </div>
        <div className="kt-filter-row sub">
          <label className="kt-inline">سعرات من <input className="input kt-num-in num" dir="ltr" inputMode="numeric" aria-label="أقل سعرات" value={kmin} onChange={(e) => setKmin(e.target.value.replace(/\D/g, ''))} /> إلى <input className="input kt-num-in num" dir="ltr" inputMode="numeric" aria-label="أكثر سعرات" value={kmax} onChange={(e) => setKmax(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="kt-inline">تكلفة حتى (RM) <input className="input kt-num-in num" dir="ltr" inputMode="decimal" aria-label="أعلى تكلفة" value={cmax} onChange={(e) => setCmax(e.target.value.replace(/[^\d.]/g, ''))} /></label>
          <Segmented<'' | 'ok' | 'defect'> label="الحالة" value={status} onChange={setStatus} options={[{ value: '', label: 'الكل' }, { value: 'ok', label: 'محسوبة' }, { value: 'defect', label: 'بها عيب معلوم' }]} />
          <label className="kt-check"><input type="checkbox" checked={can === '1'} onChange={(e) => setCan(e.target.checked ? '1' : '')} /> أستطيع طبخها الآن (من مخزني)</label>
          {filtersOn && <Button size="sm" icon="x" onClick={reset}>مسح الفلاتر</Button>}
        </div>
      </Card>

      <p className="kt-progress" role="status"><b className="num">{fmtNum(ORIGINAL_CARDS(k.idx, k.store).length, 0)}/12</b> بطاقة أصلية · <b className="num">0</b> ابتكار · يظهر <b className="num">{fmtNum(list.length, 0)}</b> الآن</p>

      {cmpCards.length === 2 && <Compare a={cmpCards[0]!} b={cmpCards[1]!} onClose={() => setCmp([])} />}
      {!k.ready ? <ul className="plain kt-cards"><li><Skeleton h={320} r={18} /></li><li><Skeleton h={320} r={18} /></li></ul> : list.length === 0 ? (
        <EmptyState icon="search" title="لا بطاقة تطابق الفلاتر" action={<Button onClick={reset}>مسح الفلاتر</Button>} />
      ) : (
        <>
          {sections.map((s) => (s.items.length || !filtersOn) && (
            <Section key={s.key} title={<span data-meal={s.key}>{s.title} <small className="muted num">{fmtNum(s.items.length, 0)}</small></span>}>
              {s.items.length === 0 ? <p className="muted">لا بطاقات في هذا القسم.</p> : (
                <ul className={cx('plain', view === 'grid' ? 'kt-cards' : 'kt-cards-list')}>
                  {shown(s.items).map((c) => <li key={c.slug}>{view === 'grid' ? <PlayerCard c={c} picked={cmp.includes(c.slug)} onPick={() => toggleCmp(c.slug)} /> : <ListRow c={c} picked={cmp.includes(c.slug)} onPick={() => toggleCmp(c.slug)} />}</li>)}
                </ul>
              )}
            </Section>
          ))}
          {list.length > more && <div className="row"><Button onClick={() => setMore(more + 60)}>عرض المزيد</Button></div>}
        </>
      )}
      <Section title="ابتكاراتي">
        <p className="muted">تظهر هنا الأطباق التي تصنعها في المطبخ ثلاثي الأبعاد وتحدّث القاموس فورًا — يصل في المرحلة 3. حالة الوصفات التي لا تُعدَّل في مكانها: تعديل بطاقة أصلية ينشئ نسخة جديدة موسومة (N-12).</p>
      </Section>
      {slug && (open ? <CardSheet c={open} onClose={closeSheet} /> : <Modal title="بطاقة غير موجودة" onClose={closeSheet}><p>«{slug}» ليست بين بطاقات القاموس.</p><Link to="/kitchen/codex">العودة للقاموس</Link></Modal>)}
    </div>
  );
}

const mealOf = (c: CardView): string => c.meal_types[0] ?? 'فطور';

/** وجه البطاقة 5:7 (A2-01…07) + ظهرها بالنقر. الإمالة تُعطَّل عند تقليل الحركة عبر CSS. */
function PlayerCard({ c, picked, onPick, startFlipped = false }: { c: CardView; picked?: boolean; onPick?: () => void; startFlipped?: boolean }) {
  const [flipped, setFlipped] = useState(startFlipped);
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: RPointerEvent<HTMLDivElement>): void => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--rx', `${(((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2)}deg`);
  };
  const leave = (): void => { ref.current?.style.removeProperty('--rx'); ref.current?.style.removeProperty('--ry'); };
  return (
    <div className="kt-pc-wrap">
      <div ref={ref} className={cx('kt-pc', flipped && 'flipped')} data-card={c.slug} data-rarity={c.rarity ?? 'none'} data-meal={MEAL_KEY[mealOf(c) as MealType]} onPointerMove={move} onPointerLeave={leave}>
        <div className="kt-pc-face front" aria-hidden={flipped} {...(flipped ? { inert: true } : {})}>
          <button type="button" className="kt-pc-hit" aria-label={`اقلب بطاقة ${c.title_ar}`} aria-pressed={flipped} onClick={() => setFlipped(true)} />
          <div className="kt-pc-top">
            <span className="kt-ovr" aria-label={c.stats ? `التقييم الإجمالي ${c.stats.OVR}` : 'التقييم غير متاح'}><b className="num">{c.stats ? c.stats.OVR : '—'}</b><small>OVR</small></span>
            <span className="kt-pc-meal">{mealOf(c)}</span>
            <span className="kt-pc-ico" aria-hidden="true">{c.mainIngredient ? INGREDIENT_BY_SLUG.get(c.mainIngredient)?.icon : '🍽️'}</span>
          </div>
          <div className="kt-pc-art" aria-hidden="true"><span>{c.mainIngredient ? INGREDIENT_BY_SLUG.get(c.mainIngredient)?.icon : '🍽️'}</span></div>
          <h3 className="kt-pc-name">{c.title_ar}</h3>
          {c.stats ? (
            <dl className="kt-pc-stats">
              {STAT_KEYS.map((s) => <div key={s}><dt title={STAT_AR[s]}>{s}</dt><dd className="num">{c.stats![s] ?? '—'}</dd></div>)}
            </dl>
          ) : <p className="kt-pc-na">لا إحصاءات: {c.badges.includes('needs_quantities') ? 'ينقصها أوزان (DEF-01)' : 'غير قابلة للحساب'}</p>}
          <div className="kt-pc-foot">
            <span><b className="num" dir="ltr">{c.nutrition ? fmtKcal(c.nutrition.kcal) : '—'}</b> سعرة</span>
            <span title="الزمن غير مسجّل في الوصفات الأصلية">⏱ غير معروف</span>
            <span><b className="num" dir="ltr">{c.cost_rm === null ? '—' : fmtRM(c.cost_rm)}</b>{c.estimated && c.cost_rm !== null && <small> تقديري</small>}</span>
            <span><b className="num">{fmtNum(c.ingredientCount, 0)}</b> مكوّنات</span>
          </div>
          <div className="kt-pc-badges">{c.badges.map((b) => <Badge key={b} tone={b === 'original' ? undefined : 'warn'} dashed={b !== 'original'}>{BADGE_LABEL[b]}</Badge>)}{c.rarity && <Badge tone="accent">{RARITY_LABEL[c.rarity]}</Badge>}</div>
        </div>
        <div className="kt-pc-face back" aria-hidden={!flipped} {...(!flipped ? { inert: true } : {})}>
          <CardBack c={c} onFlip={() => setFlipped(false)} />
        </div>
      </div>
      {onPick && <label className="kt-check kt-pick"><input type="checkbox" checked={!!picked} onChange={onPick} /> قارن</label>}
      <Link className="kt-deep" to={`/kitchen/codex/${c.slug}`}>رابط البطاقة</Link>
    </div>
  );
}

function ListRow({ c, picked, onPick }: { c: CardView; picked: boolean; onPick: () => void }) {
  return (
    <div className="kt-lrow" data-card={c.slug} data-rarity={c.rarity ?? 'none'}>
      <span className="kt-ovr sm"><b className="num">{c.stats ? c.stats.OVR : '—'}</b></span>
      <Link to={`/kitchen/codex/${c.slug}`}><strong>{c.title_ar}</strong></Link>
      <small className="muted">{mealOf(c)}</small>
      <span className="num" dir="ltr">{c.nutrition ? `${fmtKcal(c.nutrition.kcal)} سعرة` : '—'}</span>
      <span className="num" dir="ltr">{c.cost_rm === null ? '—' : fmtRM(c.cost_rm)}</span>
      <span className="row">{c.badges.filter((b) => b !== 'original').map((b) => <Badge key={b} tone="warn" dashed>{BADGE_LABEL[b]}</Badge>)}</span>
      <label className="kt-check"><input type="checkbox" checked={picked} onChange={onPick} /> قارن</label>
    </div>
  );
}

/** ظهر البطاقة (A2-10…13): المكوّنات بالغرام وملفها، الخطوات حرفيًا، القيم الغذائية والتكلفة في الأسواق، والأزرار */
function CardBack({ c, onFlip }: { c: CardView; onFlip: () => void }) {
  const k = useKitchen();
  const act = useAct();
  const { toast } = useApp();
  const [scaleK, setScaleK] = useState<'1' | '0.5' | '0.75' | '1.25'>('1');
  const lines = useMemo(() => (scaleK === '1' ? c.recipe.lines : scaleLines(c.recipe.lines, Number(scaleK))), [c.recipe.lines, scaleK]);
  const n = useMemo(() => nutritionOf(lines), [lines]);
  const totalG = lines.reduce((s, l) => s + (l.amount_g ?? 0), 0);
  const pantryInv = useMemo(() => inventoryFrom([], Object.fromEntries(k.pantry.map((p) => [p.ingredient, p.grams]))), [k.pantry]);
  const f = cardFeasibility(c, pantryInv, { idx: k.idx, store: k.store });
  const perStore = STORES.map((s) => ({ s, cost: mealCost(lines, k.idx, { store: s.slug }) }));

  const addMissing = async (): Promise<void> => {
    const items = f.missing.filter((m) => m.grams !== null);
    if (!items.length) return void toast('لا ناقص قابل للحساب', { kind: 'info' });
    for (const m of items) {
      const ing = INGREDIENT_BY_SLUG.get(m.ingredient)!;
      const have = k.cart.find((l) => l.ingredient === m.ingredient);
      const next = addToLine(ing, have ? { qty: have.qty, unit: have.unit } : undefined, qtyForEdible(ing, m.grams!));
      await act(() => setCartLine(m.ingredient, next.qty, next.unit, have?.store ?? null));
    }
    toast(`أُضيف الناقص لـ«${c.title_ar}» إلى السلة`, { kind: 'ok' });
  };
  const copy = (): void => {
    const t = [c.title_ar, '', ...c.recipe.steps_original].join('\n');
    void navigator.clipboard?.writeText(t).then(() => toast('نُسخت الوصفة', { kind: 'ok' }), () => toast('تعذّر النسخ', { kind: 'error' }));
  };

  return (
    <div className="kt-back">
      <div className="row"><h3>{c.title_ar}</h3><span className="grow" /><Button size="sm" onClick={onFlip}>اقلب للوجه</Button></div>
      {!c.computable && <p className="callout warn" role="note">{c.badges.includes('needs_quantities') ? 'هذه الوصفة بلا أوزان (DEF-01): معروضة كما هي ولا تدخل الحسابات.' : 'لا تُحسب.'}</p>}
      {c.badges.includes('text_duplicate') && <p className="callout warn" role="note">نصها مطابق لوصفة «صدور دجاج مع الأرز والخضار» (DEF-02) — محفوظة كما كتبتها.</p>}
      <h4>المكوّنات</h4>
      <ul className="plain kt-ing">
        {lines.map((l, i) => {
          const g = INGREDIENT_BY_SLUG.get(l.ingredient)!;
          const pr = l.profile ?? g.profile;
          return (
            <li key={`${l.ingredient}-${i}`}>
              <span aria-hidden="true">{g.icon}</span> <b>{g.name_ar}</b>
              <span className="num" dir="ltr">{l.amount_g === null ? 'بلا كمية' : `${fmtNum(l.amount_g, 0)} غ`}</span>
              <small className="muted">{PROFILE_AR[pr]}{l.amount_g && g.piece_edible_g ? ` · ≈ ${fmtNum(l.amount_g / g.piece_edible_g, 1)} حبة` : ''}{l.amount_g && g.slug === 'toast' ? ` · ≈ ${fmtNum(l.amount_g / 20, 1)} شريحة` : ''}</small>
            </li>
          );
        })}
      </ul>
      <h4>طريقة التحضير</h4>
      <ol className="plain kt-steps">{c.recipe.steps_original.map((s, i) => <li key={i} className="steps-original">{s}</li>)}</ol>
      {c.computable && (
        <>
          <h4>القيم الغذائية{scaleK !== '1' && <> <Badge dashed>معاينة بحصة ×<span className="num">{scaleK}</span></Badge></>}</h4>
          <NutriGrid n={n.total} unitLabel="مجموع الوجبة" />
          <small className="muted">لكل 100 غ: <span className="num" dir="ltr">{totalG ? fmtKcal((n.total.kcal / totalG) * 100) : '—'}</span> سعرة · وزن الوجبة <span className="num">{fmtNum(totalG, 0)}</span> غ{n.unmeasured.length ? ` · بلا كمية: ${n.unmeasured.map((s) => INGREDIENT_BY_SLUG.get(s)?.name_ar).join('، ')}` : ''}</small>
          <h4>التكلفة بحسب السوق</h4>
          <ul className="plain kt-store-costs">{perStore.map(({ s, cost }) => <li key={s.slug} className={s.slug === k.store ? 'sel' : undefined}>{storeShort(s.slug)} <b className="num" dir="ltr">{cost.missing.length ? '—' : fmtRM(cost.total_rm)}</b></li>)}</ul>
          <div className="row">
            <label className="kt-inline">حصة <select className="select" aria-label="معاينة بحصة مصغّرة" value={scaleK} onChange={(e) => setScaleK(e.target.value as typeof scaleK)}><option value="1">×1 (الأصل)</option><option value="0.5">×0.5 مصغّرة</option><option value="0.75">×0.75 مصغّرة</option><option value="1.25">×1.25</option></select></label>
            <small className="muted">الوصفة الأصلية لا تُعدَّل في مكانها — هذه معاينة فقط (N-12).</small>
          </div>
          <p>{f.status === 'ready' ? <Badge tone="ok">جاهزة بما في المخزن ({fmtNum(f.servings, 0)} حصة)</Badge> : f.status === 'missing' ? <Badge tone="warn">تنقصها {fmtNum(f.missing.length, 0)} أصناف{f.completionCost !== null ? ` · إكمالها ${fmtRM(f.completionCost)}` : ''}</Badge> : <Badge dashed>بعيدة عن المخزن</Badge>}</p>
        </>
      )}
      <div className="row kt-back-act">
        <Button variant="primary" icon="play" disabled title="المطبخ ثلاثي الأبعاد — المرحلة 3">اطبخها</Button>
        <Button icon="plus" disabled={!c.computable || k.offline} onClick={() => void addMissing()}>أضف المكونات الناقصة إلى السلة</Button>
        <Button icon="calendar" disabled title="الجدول والوجبات — المرحلة 4">ضعها في الجدول</Button>
        <Button icon="copy" onClick={copy}>انسخ الوصفة</Button>
      </div>
    </div>
  );
}

function CardSheet({ c, onClose }: { c: CardView; onClose: () => void }) {
  return (
    <Modal wide title={c.title_ar} onClose={onClose}>
      <div className="kt-sheet-card"><PlayerCard c={c} startFlipped /></div>
    </Modal>
  );
}

/** A2-22: مقارنة بطاقتين جنبًا إلى جنب */
function Compare({ a, b, onClose }: { a: CardView; b: CardView; onClose: () => void }) {
  const rows = compareCards(a, b);
  const names = (c: CardView): string => c.recipe.lines.map((l) => INGREDIENT_BY_SLUG.get(l.ingredient)?.name_ar).join('، ');
  return (
    <Card className="kt-compare" id="compare">
      <div className="row"><h2>مقارنة</h2><span className="grow" /><Button size="sm" icon="x" onClick={onClose}>أغلق</Button></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th /><th>{a.title_ar}</th><th>{b.title_ar}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.stat}><th scope="row">{STAT_AR[r.stat]} ({r.stat})</th><td className={cx('num', (r.a ?? 0) > (r.b ?? 0) && 'win')}>{r.a ?? '—'}</td><td className={cx('num', (r.b ?? 0) > (r.a ?? 0) && 'win')}>{r.b ?? '—'}</td></tr>)}
            <tr><th scope="row">السعرات</th><td className="num" dir="ltr">{a.nutrition ? fmtKcal(a.nutrition.kcal) : '—'}</td><td className="num" dir="ltr">{b.nutrition ? fmtKcal(b.nutrition.kcal) : '—'}</td></tr>
            <tr><th scope="row">التكلفة</th><td className="num" dir="ltr">{a.cost_rm === null ? '—' : fmtRM(a.cost_rm)}</td><td className="num" dir="ltr">{b.cost_rm === null ? '—' : fmtRM(b.cost_rm)}</td></tr>
            <tr><th scope="row">المكوّنات</th><td><small>{names(a)}</small></td><td><small>{names(b)}</small></td></tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
