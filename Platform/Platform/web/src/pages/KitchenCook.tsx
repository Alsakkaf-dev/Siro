import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Field, Modal, Segmented, cx } from '../ui/ui.js';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { KitchenChips, NutriGrid, StoreSelect, storeName, useAct, useKitchen } from '../kitchen/kitchenKit.js';
import { quickBuy, serveCook, type CardRowC } from '../kitchen/store.js';
import { SimClient, type SimView } from '../kitchen/cook/simClient.js';
import type { GameHost, KitchenScene, Pick, Quality, StationName } from '../kitchen/cook/Scene3D.js';
import { defaultGrams } from '../kitchen/cook/world/qty.js';
import {
  INGREDIENTS, INGREDIENT_BY_SLUG, ORIGINAL_RECIPES, RECIPE_BY_SLUG, STORES, fmtKcal, fmtNum, fmtRM, indexPrices, mealCost, nutritionOf, per100g, qtyView, type MealType, type RecipeLine,
} from '../../../shared/kitchen/index.js';
import { SimError, cookToCard, detectSteps, findDuplicate, parseSteps, SPEEDS, type Item, type OpIn, type Speed } from '../../../shared/kitchen/sim/index.js';
import { IngIcon } from '../kitchen/kitchenIcons.js';
import { Icon } from '../lib/icons.js';

const Mini3D = lazy(() => import('../kitchen/cook/Stage3D.js'));

const MODE_AR = { guided: 'موجّه', free: 'حر', sandbox: 'تجريبي' } as const;
type Mode = keyof typeof MODE_AR;
const ASSIST_AR = { strict: 'صارم', normal: 'عادي', easy: 'مريح' } as const;
type Assist = keyof typeof ASSIST_AR;
const STATION_KEYS: StationName[] = ['shelves', 'equipment', 'tools', 'prep', 'stove', 'sink', 'serve'];
const STATION_AR: Record<StationName, string> = { shelves: 'الرفوف', equipment: 'المعدات', tools: 'الأدوات', prep: 'التحضير', stove: 'الطبخ', sink: 'الغسيل', serve: 'التقديم' };
const VESSEL_AR: Record<string, string> = { pan: 'المقلاة', pot_small: 'القدر الصغير', pot_large: 'القدر الكبير', pressure_cooker: 'قدر الضغط', bowl: 'وعاء الخلط', plate_1: 'صحن التقديم' };
let webglCache: boolean | null = null;
/** كشف WebGL مرة واحدة لكل صفحة (فتح سياق جديد في كل رسم كان يُسقط سياق المشهد الحقيقي) */
function webglProbe(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    webglCache = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { webglCache = false; }
  return webglCache;
}
const TOOL_AR: Record<string, string> = { knife: 'السكين', peeler: 'المقشرة', grater: 'المبشرة', masher: 'الهراسة', whisk: 'الخفّاقة', spoon: 'الملعقة الخشبية', spatula: 'المجرفة', bottle_oil: 'زجاجة الزيت', carton_milk: 'علبة الحليب', shaker_salt: 'مملحة الملح', shaker_cumin: 'علبة الكمون', shaker_sugar: 'علبة السكر' };
const LOC_AR = (loc: string): string => (loc === 'board' ? 'لوح التقطيع' : loc === 'toaster' ? 'المحمّصة' : (VESSEL_AR[loc] ?? loc));
const SHAPES: { v: 'slices' | 'cubes' | 'diced' | 'sticks' | 'minced'; l: string; sizes: ('small' | 'medium' | 'large' | null)[] }[] = [
  { v: 'slices', l: 'شرائح', sizes: [null] }, { v: 'cubes', l: 'مكعبات', sizes: ['small', 'medium', 'large'] }, { v: 'diced', l: 'مكعبات صغيرة', sizes: [null] }, { v: 'sticks', l: 'أعواد', sizes: ['medium'] }, { v: 'minced', l: 'فرم', sizes: [null] },
];
const SIZE_AR = { small: 'صغير', medium: 'وسط', large: 'كبير' } as const;
const GRATE = new Set(['carrot', 'cucumber', 'cheese', 'ginger']);
const MASH = new Set(['garlic', 'banana']);
const PEEL = new Set(['potato', 'onion', 'carrot', 'garlic', 'banana', 'egg', 'ginger', 'eggplant']);
const EVENT_AR: Record<string, string> = { done: 'نضج', burn: 'يحترق!', smoke: 'الزيت يدخّن', boil_over: 'الحليب فار', whistle: 'صفير قدر الضغط', toast_pop: 'خرج التوست', stuck: 'التصق بالقاع', rinse_early: 'الشطف مبكر: انتظر 5 دقائق بعد الملح', pressure_released: 'أُطلق الضغط', unsafe: 'دجاج غير ناضج!' };

/** K — المطبخ: مشهد ثلاثي الأبعاد + لوحة إجراءات ثنائية الأبعاد مكافئة تنتج سجل العمليات نفسه (A11Y-10) */
export default function KitchenCook() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const k = useKitchen();
  const act = useAct();
  const { toast, confirm } = useApp();
  const recipeSlug = sp.get('recipe') ?? '';
  const recipe = recipeSlug ? RECIPE_BY_SLUG.get(recipeSlug) : undefined;
  const mode = ((sp.get('mode') as Mode) in MODE_AR ? sp.get('mode') : recipe ? 'guided' : 'free') as Mode;
  const [assist, setAssist] = useState<Assist>('normal');
  const [view, setView] = useState<SimView | null>(null);
  const [tab, setTab] = useState<'act' | 'recipe' | 'log'>(recipe ? 'recipe' : 'act');
  const [selIng, setSelIng] = useState<string | null>(null);
  const [selItem, setSelItem] = useState<string | null>(null);
  const [grams, setGrams] = useState('100');
  const [logLines, setLogLines] = useState<{ t: number; msg: string; tone: 'ok' | 'warn' | 'err'; id: number; at: number }[]>([]);
  const logId = useRef(0);
  const [qty, setQtyState] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem('siro.kitchen.qty') ?? '{}') as Record<string, number>; } catch { return {}; } });
  const [serveOpen, setServeOpen] = useState(false);
  const [use3d, setUse3d] = useState(() => flagEnabled('kitchen.3d'));
  const [quality, setQuality] = useState<Quality>('standard');
  const [station, setStation] = useState<StationName>('prep');
  const [fps, setFps] = useState<number | null>(null);
  const [liveMsg, setLiveMsg] = useState('');
  const clientRef = useRef<SimClient | null>(null);
  const sceneRef = useRef<KitchenScene | null>(null);
  const idN = useRef(0);
  const seenEv = useRef(0);
  const slowSeen = useRef('');
  const seed = useRef(1);
  const stockRef = useRef<Record<string, number>>({});

  const push = useCallback((msg: string, tone: 'ok' | 'warn' | 'err' = 'ok', t = 0): void => {
    setLogLines((l) => [...l.slice(-80), { t, msg, tone, id: ++logId.current, at: Date.now() }]);
    setLiveMsg(msg);
  }, []);

  /* جلسة المحاكاة */
  const start = useCallback((ops: readonly never[] = []) => {
    clientRef.current?.dispose();
    seenEv.current = 0;
    idN.current = ops.filter((o: { type: string }) => o.type === 'take').length;
    const c = new SimClient((v) => setView(v), seed.current, ops);
    clientRef.current = c;
    setLogLines([]);
  }, []);
  useEffect(() => {
    start();
    return () => clientRef.current?.dispose();
  }, [start]);

  /* المخزن المتاح (غرامات مشتراة) = المخزن − المأخوذ في الجلسة؛ التجريبي بلا حدّ (PAN-04) */
  const taken = view?.snap.taken ?? {};
  const stock = useMemo(() => {
    const out: Record<string, number> = {};
    for (const i of INGREDIENTS) {
      if (mode === 'sandbox') out[i.slug] = 1e9;
      else {
        const have = k.pantry.find((p) => p.ingredient === i.slug)?.grams ?? 0;
        out[i.slug] = Math.max(0, have - (taken[i.slug] ?? 0) / (i.slug === 'milk' || i.slug === 'oil' || ['salt', 'cumin', 'sugar'].includes(i.slug) ? 1 : i.edible_yield || 1));
      }
    }
    return out;
  }, [k.pantry, taken, mode]);
  stockRef.current = stock;

  /* تنبيهات الأحداث (aria-live وتوقف التسريع) */
  useEffect(() => {
    if (!view) return;
    const ev = view.snap.events;
    for (let i = Math.max(seenEv.current, 0); i < ev.length; i++) {
      const e = ev[i]!;
      if (EVENT_AR[e.type]) {
        const it = view.snap.items.find((x) => x.id === e.ref);
        const what = it ? INGREDIENT_BY_SLUG.get(it.ingredient)?.name_ar : e.ref in VESSEL_AR ? VESSEL_AR[e.ref] : '';
        push(`${EVENT_AR[e.type]}${what ? ` — ${what}` : ''}`, ['burn', 'smoke', 'boil_over', 'stuck', 'unsafe'].includes(e.type) ? 'warn' : 'ok', e.t);
      }
    }
    seenEv.current = ev.length;
    if (view.slowed) {
      const key = `${view.slowed.type}@${view.slowed.t}`;
      if (slowSeen.current !== key) {
        slowSeen.current = key;
        push(`أُبطئ الزمن تلقائيًا: ${EVENT_AR[view.slowed.type] ?? view.slowed.type}`, 'warn', view.slowed.t);
      }
    }
  }, [view, push]);

  /* المشهد */
  useEffect(() => {
    if (view && sceneRef.current) sceneRef.current.update(view, stockRef.current);
  }, [view, stock]);

  const run = useCallback(async (op: OpIn, ok?: string): Promise<boolean> => {
    try {
      await clientRef.current!.op(op);
      if (ok) push(ok, 'ok', view?.snap.t ?? 0);
      return true;
    } catch (e) {
      const m = e instanceof SimError || e instanceof Error ? e.message : 'تعذّر الفعل';
      push(m, 'err', view?.snap.t ?? 0);
      toast(m, { kind: 'error' });
      return false;
    }
  }, [push, toast, view?.snap.t]);

  const items = view?.snap.items.filter((i) => i.loc !== 'gone') ?? [];
  const selected = items.find((i) => i.id === selItem) ?? null;
  const vessels = view?.snap.vessels ?? [];
  const served = (view?.snap.served.length ?? 0) > 0;

  /* أخذ مكوّن: يتحقق من المخزن ويعرض «ينقصك X غ» مع شراء سريع (KIT-21) */
  const takeIng = async (slug: string, g: number): Promise<void> => {
    const ing = INGREDIENT_BY_SLUG.get(slug)!;
    const isLiquid = slug === 'oil' || slug === 'milk';
    if (!(g > 0) || g > 5000) return void toast('كمية غير صالحة', { kind: 'error' });
    const need = isLiquid ? g : g / (ing.edible_yield || 1);
    if (mode !== 'sandbox' && need > (stockRef.current[slug] ?? 0) + 1e-6) {
      const miss = Math.ceil(need - (stockRef.current[slug] ?? 0));
      const ok = await confirm({ title: `ينقصك ${fmtNum(miss, 0)} غ من ${ing.name_ar}`, body: <>اشترِ الآن من {storeName(k.store)} (يُخصم من المحفظة) أو قلّل الكمية. <b>لا دفع حقيقي.</b></>, confirmLabel: 'شراء سريع' });
      if (!ok) return;
      const unit = ing.sale_unit;
      const r = await act(() => quickBuy(slug, unit === 'kg' || unit === 'l' ? Math.max(0.1, Math.ceil((miss / (unit === 'kg' ? 1000 : 1000)) * 10) / 10) : 1, unit, k.store), 'سُجّل الشراء السريع');
      if (!r) return;
    }
    if (isLiquid) {
      setSelIng(null);
      toast(`اختر الوعاء لصبّ ${ing.name_ar}`, { kind: 'info' });
      setPourFor(slug as 'oil' | 'milk');
      return;
    }
    if (['salt', 'cumin', 'sugar'].includes(slug)) {
      setSelIng(null);
      setSeasonFor(slug as 'salt' | 'cumin' | 'sugar');
      return;
    }
    const id = `i${++idN.current}`;
    if (await run({ type: 'take', id, ingredient: slug, grams: g }, `أُخذ ${fmtNum(g, 0)} غ من ${ing.name_ar}`)) {
      setSelItem(id);
      setSelIng(null);
      setTab('act');
    }
  };
  const [pourFor, setPourFor] = useState<'oil' | 'milk' | null>(null);
  const [seasonFor, setSeasonFor] = useState<'salt' | 'cumin' | 'sugar' | null>(null);

  const onPick = useCallback((p: Pick) => {
    if (p.kind === 'ingredient') setSelIng(p.id);
    else if (p.kind === 'item') setSelItem(p.id);
    else if (p.kind === 'vessel') setVesselFocus(p.id);
    setTab('act');
  }, []);
  const [vesselFocus, setVesselFocus] = useState<string | null>(null);

  /* واجهة عالم اللعبة: كل فعل في العالم عملية محاكاة؛ الكميات تُحفظ لكل مكوّن في المتصفح */
  const viewRef = useRef(view);
  viewRef.current = view;
  const qtyRef = useRef(qty);
  qtyRef.current = qty;
  const setQty = useCallback((slug: string, g: number): void => {
    setQtyState((q) => { const n = { ...q, [slug]: g }; try { localStorage.setItem('siro.kitchen.qty', JSON.stringify(n)); } catch { /* اختياري */ } return n; });
  }, []);
  const game = useRef<GameHost | null>(null);
  game.current = {
    take: async (slug, g) => {
      const ing = INGREDIENT_BY_SLUG.get(slug);
      if (!ing || !(g > 0) || g > 5000) { push('كمية غير صالحة', 'err'); return null; }
      const need = g / (ing.edible_yield || 1);
      if (mode !== 'sandbox' && need > (stockRef.current[slug] ?? 0) + 1e-6) {
        push(`ينقصك ${fmtNum(Math.ceil(need - (stockRef.current[slug] ?? 0)), 0)} غ من ${ing.name_ar} — اشترِ من المتجر أو جرّب الوضع التجريبي`, 'warn');
        return null;
      }
      const id = `i${++idN.current}`;
      return (await run({ type: 'take', id, ingredient: slug, grams: g }, `أخذت ${fmtNum(g, 0)} غ من ${ing.name_ar}`)) ? id : null;
    },
    op: (op, okMsg) => run(op, okMsg),
    quantity: (slug) => qtyRef.current[slug] ?? defaultGrams(slug),
    askQuantity: () => undefined, // تضعه Stage3D (قائمة داخل اللعبة)
    say: (m, tone) => push(m, tone ?? 'ok'),
    serve: () => doServe(),
  };
  const gameHost = useMemo<GameHost>(() => ({
    take: (s, g) => game.current!.take(s, g), op: (o, m) => game.current!.op(o, m), quantity: (s) => game.current!.quantity(s),
    askQuantity: (s) => game.current!.askQuantity(s), say: (m, t) => game.current!.say(m, t), serve: () => game.current!.serve(),
  }), []);
  const hoverLabel = useCallback((p: Pick): string => {
    if (p.kind === 'ingredient') return `${INGREDIENT_BY_SLUG.get(p.id)?.name_ar ?? p.id} — ${fmtNum(qtyRef.current[p.id] ?? defaultGrams(p.id), 0)} غ (أيمن: الكمية)`;
    if (p.kind === 'tool') return TOOL_AR[p.id] ?? p.id;
    if (p.kind === 'vessel' || p.kind === 'plate') return VESSEL_AR[p.id] ?? p.id;
    if (p.kind === 'burner') return `الموقد ${p.id}`;
    if (p.kind === 'knob') return `مقبض الموقد ${p.id} (انقر لتغيير اللهب)`;
    if (p.kind === 'toaster') return 'المحمّصة';
    if (p.kind === 'board') return 'لوح التقطيع';
    const it = viewRef.current?.snap.items.find((x) => x.id === p.id);
    return it ? (INGREDIENT_BY_SLUG.get(it.ingredient)?.name_ar ?? p.id) : p.id;
  }, []);

  /* الوصفة الموجّهة */
  const specs = useMemo(() => (recipe ? parseSteps(recipe.steps_original) : []), [recipe]);
  const stepStates = useMemo(() => (view && specs.length ? detectSteps(specs, view.snap) : []), [specs, view]);

  /* حيّ: تغذية وتكلفة الطبق (WAL-04) من المأخوذ − المهدر */
  const liveLines: RecipeLine[] = useMemo(() => {
    const t = view?.snap.taken ?? {};
    const w = view?.snap.waste ?? {};
    return Object.keys(t).filter((s) => INGREDIENT_BY_SLUG.has(s)).map((s) => ({ ingredient: s, amount_g: Math.max(0, Math.round(((t[s] ?? 0) - (w[s] ?? 0)) * 10) / 10) })).filter((l) => (l.amount_g ?? 0) > 0);
  }, [view]);
  const idx = useMemo(() => indexPrices(k.prices), [k.prices]);
  const liveN = useMemo(() => nutritionOf(liveLines).total, [liveLines]);
  const liveCost = useMemo(() => mealCost(liveLines, idx, { store: k.store }), [liveLines, idx, k.store]);

  const doServe = (): void => {
    const sources = [...vessels.filter((v) => v.items.length || v.oilG > 0 || v.milkG > 0).map((v) => v.id), ...items.filter((i) => i.loc === 'board' || i.loc === 'toaster').map((i) => i.id)];
    if (!sources.length) return void toast('لا شيء لتقديمه بعد', { kind: 'error' });
    setServeSrc(new Set(sources));
    setServeOpen(true);
  };
  const [serveSrc, setServeSrc] = useState<Set<string>>(new Set());

  const webgl = useMemo(() => webglProbe(), []); // مرة واحدة: كل فحص يفتح سياق WebGL ويُفقد سياق المشهد عند تجاوز الحد
  const showStage = use3d && webgl;

  return (
    <div className="page kitchen kt-cook">
      <PageHead title="المطبخ" icon="utensils" sub={recipe ? `الوضع الموجّه: ${recipe.title_ar}` : `الوضع ${MODE_AR[mode]} — اطبخ بيديك؛ الموقع يفهم حركاتك ويبني الوصفة والبطاقة.`} actions={<KitchenChips />} />
      <div className="kt-hud" role="toolbar" aria-label="لوحة التحكم">
        <Segmented<Mode> label="وضع الطبخ" value={mode} onChange={(m) => { const n = new URLSearchParams(sp); n.set('mode', m); if (m !== 'guided') n.delete('recipe'); setSp(n, { replace: true }); }} options={[{ value: 'guided', label: 'موجّه' }, { value: 'free', label: 'حر' }, { value: 'sandbox', label: 'تجريبي' }]} />
        <label className="kt-inline">المساعدة <select className="select" aria-label="مستوى المساعدة" value={assist} onChange={(e) => setAssist(e.target.value as Assist)}>{(Object.keys(ASSIST_AR) as Assist[]).map((a) => <option key={a} value={a}>{ASSIST_AR[a]}</option>)}</select></label>
        <label className="kt-inline">السوق <StoreSelect /></label>
        <span className="kt-hud-sep" />
        <div className="row" role="group" aria-label="سرعة الزمن">
          {SPEEDS.map((s) => <button key={s} type="button" className="chip" aria-pressed={view?.speed === s} onClick={() => clientRef.current?.setSpeed(s as Speed)}>×{s}</button>)}
          <Button size="sm" onClick={() => clientRef.current?.setPaused(!view?.paused)} aria-pressed={!!view?.paused}>{view?.paused ? 'استئناف' : 'إيقاف مؤقت'}</Button>
          <Button size="sm" icon="undo" disabled={!view?.canUndo} onClick={() => void clientRef.current?.undo().then((ok) => !ok && toast('لا يُعكس ما بعد الحرارة', { kind: 'info' }))}>تراجع</Button>
          <Button size="sm" onClick={async () => { if (!view?.nOps || (await confirm({ title: 'إعادة الجلسة؟', body: 'تُمسح كل الأفعال ويبدأ الطبخ من جديد.', confirmLabel: 'أعد' }))) start(); }}>إعادة</Button>
        </div>
        <span className="kt-hud-sep" />
        <span className="kt-time" aria-label="زمن اللعبة">⏱ <b className="num" dir="ltr">{fmtClock(view?.snap.t ?? 0)}</b></span>
        <span className="kt-cost" aria-label="تكلفة الطبق حتى الآن">تكلفة الطبق: <b className="num" dir="ltr">{liveCost.missing.length ? '—' : fmtRM(liveCost.total_rm)}</b></span>
        <Button variant="primary" icon="check" onClick={doServe} data-testid="serve-btn">قدّم</Button>
      </div>

      <div className="kt-cook-grid">
        <div className="kt-stage">
          {showStage ? (
            <Suspense fallback={<div className="kt-stage-load" role="status">جارٍ تحميل المطبخ ثلاثي الأبعاد…</div>}>
              <Mini3D quality={quality} onQuality={(q, why) => { setQuality(q); push(why, 'warn'); }} onPick={onPick} host={gameHost} ingName={(sl) => INGREDIENT_BY_SLUG.get(sl)?.name_ar ?? sl} qty={(sl) => qty[sl] ?? defaultGrams(sl)} onQty={setQty} hoverLabel={hoverLabel} hud={{ time: fmtClock(view?.snap.t ?? 0), cost: liveCost.missing.length ? 'تكلفة الطبق —' : `تكلفة الطبق ${fmtRM(liveCost.total_rm)}`, log: logLines.slice(-6) }} station={station} view={view} stock={stock} onReady={(s) => { sceneRef.current = s; if (view) s.update(view, stockRef.current); }} onFps={setFps} />
            </Suspense>
          ) : (
            <div className="kt-stage-off" role="note">{webgl ? 'العرض ثلاثي الأبعاد مطفأ — لوحة الإجراءات تعمل بالكامل وتنتج البطاقة نفسها.' : 'WebGL غير متاح على هذا الجهاز — لوحة الإجراءات كاملة الوظائف وتنتج البطاقة نفسها (A11Y-10).'}</div>
          )}
          <div className="kt-stations" role="group" aria-label="محطات المطبخ (1–7)">
            {STATION_KEYS.map((s, i) => <button key={s} type="button" className="chip" aria-pressed={station === s} onClick={() => { setStation(s); sceneRef.current?.goStation(s); }}><kbd>{i + 1}</kbd> {STATION_AR[s]}</button>)}
            <label className="kt-inline">الجودة <select className="select" aria-label="جودة الرسم" value={quality} onChange={(e) => { const q = e.target.value as Quality; setQuality(q); sceneRef.current?.setQuality(q); }}><option value="lite">خفيفة</option><option value="standard">عادية</option><option value="high">عالية</option></select></label>
            <label className="kt-check"><input type="checkbox" checked={use3d} onChange={(e) => setUse3d(e.target.checked)} /> مشهد 3D</label>
            {fps !== null && <small className="muted num" dir="ltr">{fps} fps</small>}
          </div>
          <div className="kt-live-nutri"><NutriGrid n={liveN} unitLabel="تغذية الطبق حتى الآن" /></div>
          <div className="kt-alerts" role="log" aria-live="polite" aria-label="تنبيهات المطبخ">{liveMsg}</div>
        </div>

        <aside className="kt-side" aria-label="لوحة الطبخ">
          <Segmented<'act' | 'recipe' | 'log'> label="أقسام اللوحة" value={tab} onChange={setTab} options={[{ value: 'act', label: 'الإجراءات' }, ...(recipe ? [{ value: 'recipe' as const, label: 'الوصفة' }] : []), { value: 'log', label: 'السجل' }]} />
          {tab === 'recipe' && recipe && (
            <Card>
              <CardHead title={recipe.title_ar} icon="book" />
              <ol className="plain kt-recipe-steps">
                {recipe.steps_original.map((s, i) => (
                  <li key={i} className={cx(stepStates[i]?.done && 'done')} data-step-done={stepStates[i]?.done ? '1' : '0'}>
                    <span aria-hidden="true"><Icon name={stepStates[i]?.done ? 'checkCircle' : 'circle'} size={16} /></span> {s.replace(/^\d+:\s*/, '')}
                    {!stepStates[i]?.done && stepStates[i] && stepStates[i]!.missing.length > 0 && <small className="muted"> — {stepStates[i]!.missing[0]}</small>}
                  </li>
                ))}
              </ol>
              <div className="row">{recipe.lines.filter((l) => l.amount_g).map((l) => <button key={l.ingredient} type="button" className="chip" onClick={() => { setSelIng(l.ingredient); setGrams(String(l.amount_g)); }}><IngIcon slug={l.ingredient} category={INGREDIENT_BY_SLUG.get(l.ingredient)?.category} size={14} /> {INGREDIENT_BY_SLUG.get(l.ingredient)?.name_ar} {l.amount_g} غ</button>)}</div>
            </Card>
          )}
          {tab === 'log' && (
            <Card>
              <CardHead title="سجل الأفعال والتنبيهات" icon="list" />
              <ul className="plain kt-log" data-testid="cook-log">{logLines.length === 0 ? <li className="muted">لا شيء بعد.</li> : [...logLines].reverse().map((l, i) => <li key={i} className={l.tone}><small className="num" dir="ltr">{fmtClock(l.t)}</small> {l.msg}</li>)}</ul>
            </Card>
          )}
          {tab === 'act' && (
            <ActionPanel
              view={view} items={items} selected={selected} selIng={selIng} setSelIng={setSelIng} setSelItem={setSelItem} grams={grams} setGrams={setGrams} stock={stock} mode={mode} recipe={recipe?.lines ?? null}
              takeIng={takeIng} run={run} pourFor={pourFor} setPourFor={setPourFor} seasonFor={seasonFor} setSeasonFor={setSeasonFor} vesselFocus={vesselFocus} setVesselFocus={setVesselFocus}
            />
          )}
        </aside>
      </div>
      {served && !serveOpen && <p className="callout ok" role="status">قُدّمت الوجبة. افتح «قدّم» لمراجعة البطاقة وحفظها.</p>}
      {serveOpen && <ServeDialog sources={serveSrc} setSources={setServeSrc} onClose={() => setServeOpen(false)} client={clientRef.current!} mode={mode} seed={seed.current} scene={sceneRef.current} onSaved={(c) => nav(`/kitchen/codex/${c.slug}`)} view={view} />}
    </div>
  );
}

const fmtClock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ───── لوحة الإجراءات (A11Y-10): مكافئة كاملة للمشهد ───── */
function ActionPanel(p: {
  view: SimView | null; items: (Item & { stage: string; unsafe: boolean })[]; selected: (Item & { stage: string; unsafe: boolean }) | null; selIng: string | null; setSelIng: (s: string | null) => void; setSelItem: (s: string | null) => void;
  grams: string; setGrams: (s: string) => void; stock: Record<string, number>; mode: Mode; recipe: readonly RecipeLine[] | null;
  takeIng: (slug: string, g: number) => Promise<void>; run: (op: OpIn, ok?: string) => Promise<boolean>;
  pourFor: 'oil' | 'milk' | null; setPourFor: (s: 'oil' | 'milk' | null) => void; seasonFor: 'salt' | 'cumin' | 'sugar' | null; setSeasonFor: (s: 'salt' | 'cumin' | 'sugar' | null) => void; vesselFocus: string | null; setVesselFocus: (s: string | null) => void;
}) {
  const { view, items, selected, run } = p;
  const vessels = view?.snap.vessels ?? [];
  const [shape, setShape] = useState<(typeof SHAPES)[number]['v']>('cubes');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [target, setTarget] = useState('pan');
  const [pourG, setPourG] = useState('10');
  const [pourVessel, setPourVessel] = useState('pan');
  const [seasonG, setSeasonG] = useState('2');
  const [seasonTarget, setSeasonTarget] = useState('pot_large');
  const [toastLevel, setToastLevel] = useState<1 | 2 | 3 | 4>(2);
  const sel = selected;
  const sp = SHAPES.find((s) => s.v === shape)!;
  const rec = p.selIng && p.recipe?.find((l) => l.ingredient === p.selIng)?.amount_g;
  const ingN = p.selIng ? per100g(p.selIng) : null;
  const gnum = Number(p.grams);

  return (
    <div className="kt-act stack">
      <Card>
        <CardHead title="1 — المكوّنات (26 معتمدًا)" icon="list" />
        <div className="kt-ing-pick" role="group" aria-label="اختر مكوّنًا">
          {INGREDIENTS.map((i) => {
            const have = p.stock[i.slug] ?? 0;
            return (
              <button key={i.slug} type="button" className={cx('kt-ing-btn', have <= 0 && 'out')} aria-pressed={p.selIng === i.slug} onClick={() => { p.setSelIng(i.slug); const r = p.recipe?.find((l) => l.ingredient === i.slug)?.amount_g; p.setGrams(String(r ?? (['oil', 'milk'].includes(i.slug) ? 10 : ['salt', 'cumin', 'sugar'].includes(i.slug) ? 2 : 100))); }} data-ing={i.slug} title={have <= 0 ? 'غير موجود في مخزني' : `في مخزني ${fmtNum(have, 0)} غ`}>
                <span aria-hidden="true"><IngIcon slug={i.slug} category={i.category} size={16} /></span> <span>{i.name_ar}</span>
                <small className="muted">{p.mode === 'sandbox' ? '∞' : fmtNum(Math.round(have), 0)}</small>
              </button>
            );
          })}
        </div>
        {p.selIng && (
          <div className="kt-qty-box" data-testid="qty-box">
            <b>{INGREDIENT_BY_SLUG.get(p.selIng)?.name_ar}</b>
            <div className="row">
              <input className="input num kt-g-in" dir="ltr" inputMode="decimal" aria-label="الكمية بالغرام" value={p.grams} onChange={(e) => p.setGrams(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void p.takeIng(p.selIng!, gnum)} />
              <span>غ</span>
              {[10, 50, 100, 200, 300].map((g) => <button key={g} type="button" className="chip" onClick={() => p.setGrams(String(g))}>{g}</button>)}
              {rec ? <button type="button" className="chip" onClick={() => p.setGrams(String(rec))}>من الوصفة: {rec}</button> : null}
            </div>
            {ingN && Number.isFinite(gnum) && <small className="muted">≈ <span className="num" dir="ltr">{fmtKcal((ingN.kcal * gnum) / 100)}</span> سعرة · بروتين <span className="num">{fmtNum((ingN.protein_g * gnum) / 100, 1)}</span> غ</small>}
            <div className="row"><Button variant="primary" icon="plus" data-testid="take-btn" onClick={() => void p.takeIng(p.selIng!, gnum)}>{['oil', 'milk'].includes(p.selIng) ? 'اصبب…' : ['salt', 'cumin', 'sugar'].includes(p.selIng) ? 'أضف…' : 'خذ'}</Button><Button size="sm" onClick={() => p.setSelIng(null)}>إغلاق</Button></div>
          </div>
        )}
        {p.pourFor && (
          <div className="kt-qty-box" data-testid="pour-box">
            <b>صبّ {INGREDIENT_BY_SLUG.get(p.pourFor)?.name_ar} (غ)</b>
            <div className="row"><input className="input num kt-g-in" dir="ltr" aria-label="غرامات الصبّ" value={p.grams} onChange={(e) => p.setGrams(e.target.value)} />
              <select className="select" aria-label="الوعاء" value={pourVessel} onChange={(e) => setPourVessel(e.target.value)}>{vessels.map((v) => <option key={v.id} value={v.id}>{VESSEL_AR[v.id]}</option>)}</select>
              <Button variant="primary" onClick={() => void run({ type: 'pour', ingredient: p.pourFor!, grams: Number(p.grams), vessel: pourVessel }, `صُبّ ${p.grams} غ من ${INGREDIENT_BY_SLUG.get(p.pourFor!)?.name_ar} في ${VESSEL_AR[pourVessel]}`).then((ok) => ok && p.setPourFor(null))}>اصبب</Button><Button size="sm" onClick={() => p.setPourFor(null)}>إلغاء</Button></div>
          </div>
        )}
        {p.seasonFor && (
          <div className="kt-qty-box" data-testid="season-box">
            <b>{INGREDIENT_BY_SLUG.get(p.seasonFor)?.name_ar} (غ)</b>
            <div className="row"><input className="input num kt-g-in" dir="ltr" aria-label="غرامات التوابل" value={seasonG} onChange={(e) => setSeasonG(e.target.value)} />
              <select className="select" aria-label="الهدف" value={seasonTarget} onChange={(e) => setSeasonTarget(e.target.value)}>{vessels.map((v) => <option key={v.id} value={v.id}>{VESSEL_AR[v.id]}</option>)}{items.map((i) => <option key={i.id} value={i.id}>{INGREDIENT_BY_SLUG.get(i.ingredient)?.name_ar} ({i.id})</option>)}</select>
              <Button variant="primary" onClick={() => void run({ type: 'season', ingredient: p.seasonFor!, grams: Number(seasonG), target: seasonTarget }, 'أُضيف').then((ok) => ok && p.setSeasonFor(null))}>أضف</Button><Button size="sm" onClick={() => p.setSeasonFor(null)}>إلغاء</Button></div>
          </div>
        )}
      </Card>

      <Card>
        <CardHead title="2 — القطع" icon="board" />
        {items.length === 0 ? <p className="muted">لا قطع بعد: اختر مكوّنًا من الأعلى.</p> : (
          <ul className="plain kt-items" data-testid="item-list">
            {items.map((i) => (
              <li key={i.id}><button type="button" className={cx('kt-item-btn', sel?.id === i.id && 'sel')} aria-pressed={sel?.id === i.id} onClick={() => p.setSelItem(i.id)} data-item={i.id}>
                <IngIcon slug={i.ingredient} category={INGREDIENT_BY_SLUG.get(i.ingredient)?.category} size={14} /> {INGREDIENT_BY_SLUG.get(i.ingredient)?.name_ar} <b className="num" dir="ltr">{fmtNum(i.g0, 0)} غ</b> · {LOC_AR(i.loc)}
                {i.cut && <Badge>{SHAPES.find((s) => s.v === i.cut!.shape)?.l ?? (i.cut.shape === 'grated' ? 'مبشور' : i.cut.shape === 'mashed' ? 'مهروس' : i.cut.shape)}</Badge>}
                {i.whisked && <Badge>مخفوق</Badge>}{i.peeled && <Badge>مقشّر</Badge>}{i.juiced && <Badge>معصور</Badge>}
                <Badge tone={i.stage === 'done' ? 'ok' : i.stage === 'burnt' ? 'danger' : i.stage === 'undercooked' ? 'warn' : undefined}>{({ raw: 'نيء', undercooked: 'نصف ناضج', done: 'ناضج', overdone: 'زائد النضج', burnt: 'محترق' } as Record<string, string>)[i.stage]}</Badge>
                {i.unsafe && <Badge tone="danger">غير آمن</Badge>}
              </button></li>
            ))}
          </ul>
        )}
        {sel && (
          <div className="kt-ctx" role="group" aria-label={`إجراءات ${INGREDIENT_BY_SLUG.get(sel.ingredient)?.name_ar}`} data-testid="ctx">
            <div className="row">
              {PEEL.has(sel.ingredient) && <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'peel' }, 'قُشِّر')}>قشّر</Button>}
              <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'wash' }, 'غُسل')}>اغسل</Button>
              {sel.ingredient === 'egg' && <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'whisk' }, 'خُفق البيض')}>اخفق</Button>}
              {sel.ingredient === 'lemon' && <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'juice' }, 'عُصر')}>اعصر</Button>}
              {GRATE.has(sel.ingredient) && <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'grate' }, 'بُشر')}>ابشر</Button>}
              {MASH.has(sel.ingredient) && <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'mash' }, 'هُرس')}>اهرس</Button>}
              {sel.ingredient === 'eggplant' && <><Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'salt_rest' }, 'رُشّ بالملح — انتظر 5 دقائق')}>رشّ ملحًا وانقع</Button><Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'rinse_dry' }, 'شُطف وجُفّف')}>اشطف وجفّف</Button></>}
            </div>
            {!['rice', 'oats', 'cheese', 'honey', 'yogurt', 'milk', 'oil', 'salt', 'cumin', 'sugar'].includes(sel.ingredient) && (
              <div className="row">
                <label className="kt-inline">قطع <select className="select" aria-label="شكل القطع" value={shape} onChange={(e) => { const v = e.target.value as typeof shape; setShape(v); setSize((SHAPES.find((s) => s.v === v)!.sizes[0] ?? 'medium') as typeof size); }}>{SHAPES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></label>
                {sp.sizes[0] !== null && <label className="kt-inline">الحجم <select className="select" aria-label="حجم القطع" value={size} onChange={(e) => setSize(e.target.value as typeof size)}>{sp.sizes.map((z) => z && <option key={z} value={z}>{SIZE_AR[z]}</option>)}</select></label>}
                <Button size="sm" onClick={() => void run({ type: 'prep', item: sel.id, action: 'cut', shape, ...(sp.sizes[0] !== null ? { size } : {}) }, 'قُطّع')}>قطّع</Button>
              </div>
            )}
            {sel.ingredient === 'toast' && (
              <div className="row">
                <label className="kt-inline">التحميص <select className="select" aria-label="درجة التحميص" value={toastLevel} onChange={(e) => setToastLevel(Number(e.target.value) as typeof toastLevel)}><option value={1}>فاتح</option><option value={2}>ذهبي</option><option value={3}>داكن</option><option value={4}>محروق</option></select></label>
                <Button size="sm" variant="primary" onClick={() => void run({ type: 'toast', item: sel.id, level: toastLevel }, 'التوست في المحمّصة')}>حمّص</Button>
              </div>
            )}
            <div className="row">
              <label className="kt-inline">أضف إلى <select className="select" aria-label="الوعاء الهدف" value={target} onChange={(e) => setTarget(e.target.value)}>{vessels.map((v) => <option key={v.id} value={v.id}>{VESSEL_AR[v.id]}</option>)}</select></label>
              <Button size="sm" variant="primary" data-testid="add-to" onClick={() => void run({ type: 'add', item: sel.id, vessel: target }, `أُضيف إلى ${VESSEL_AR[target]}`)}>أضف</Button>
              {sel.loc !== 'board' && sel.loc !== 'plate_1' && sel.loc !== 'toaster' && <Button size="sm" onClick={() => void run({ type: 'remove', item: sel.id }, 'أُخرج إلى اللوح')}>أخرج</Button>}
              <Button size="sm" tone-danger="1" onClick={() => void run({ type: 'discard', target: sel.id }, 'رُمي (إهدار مسجّل)').then(() => p.setSelItem(null))}>ارمِ</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHead title="3 — الأوعية والمواقد" icon="utensils" />
        <div className="kt-vessels">
          {vessels.filter((v) => v.id !== 'plate_1').map((v) => (
            <VesselCard key={v.id} v={v} burners={view?.snap.burners ?? [0, 0, 0, 0]} run={run} items={items.filter((i) => i.loc === v.id)} focus={p.vesselFocus === v.id} onPour={(ing) => { p.setPourFor(ing); }} onSeason={(s) => p.setSeasonFor(s)} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function VesselCard({ v, burners, run, items, focus, onPour, onSeason }: { v: NonNullable<SimView['snap']['vessels']>[number]; burners: number[]; run: (op: OpIn, ok?: string) => Promise<boolean>; items: Item[]; focus: boolean; onPour: (i: 'oil' | 'milk') => void; onSeason: (s: 'salt' | 'cumin' | 'sugar') => void }) {
  const lvl = v.burner ? burners[v.burner - 1] ?? 0 : 0;
  const [lv, setLv] = useState(String(lvl || 6));
  useEffect(() => { if (v.burner) setLv(String(burners[v.burner - 1] ?? 0)); }, [v.burner, burners]);
  const pc = v.kind === 'pressure_cooker';
  return (
    <div className={cx('kt-vessel', focus && 'focus', v.T > 100 && 'hot')} data-vessel={v.id} data-testid={`vessel-${v.id}`}>
      <div className="row"><b>{VESSEL_AR[v.id]}</b><span className="grow" /><Badge tone={v.T > 160 ? 'danger' : v.T > 90 ? 'warn' : undefined}>{fmtNum(v.T, 0)}°م</Badge>{v.smoking && <Badge tone="danger">دخان</Badge>}{pc && v.pressure !== 'off' && <Badge tone="warn">ضغط: {v.pressure === 'building' ? 'يبني' : v.pressure === 'holding' ? 'محتجز' : 'يُطلق'}</Badge>}</div>
      <small className="muted">{items.length ? items.map((i) => INGREDIENT_BY_SLUG.get(i.ingredient)?.name_ar).join('، ') : 'فارغ'}{v.waterG > 1 ? ` · ماء ${fmtNum(Math.round(v.waterG), 0)} غ` : ''}{v.oilG > 0.3 ? ` · زيت ${fmtNum(Math.round(v.oilG * 10) / 10, 1)} غ` : ''}{v.milkG > 1 ? ` · حليب ${fmtNum(Math.round(v.milkG), 0)} غ` : ''}</small>
      <div className="row">
        <label className="kt-inline">الموقد <select className="select" aria-label={`موقد ${VESSEL_AR[v.id]}`} value={v.burner} onChange={(e) => void run({ type: 'place', vessel: v.id, burner: Number(e.target.value) as 0 | 1 | 2 | 3 | 4 }, e.target.value === '0' ? 'رُفع عن الموقد' : `وُضع على الموقد ${e.target.value}`)}><option value={0}>بلا</option>{[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}</option>)}</select></label>
        {v.burner > 0 && <label className="kt-inline">اللهب <input type="range" min={0} max={10} step={1} aria-label={`درجة لهب ${VESSEL_AR[v.id]}`} value={lv} onChange={(e) => { setLv(e.target.value); void run({ type: 'heat', burner: v.burner as 1 | 2 | 3 | 4, level: Number(e.target.value) }); }} /> <b className="num">{lv}</b></label>}
      </div>
      <div className="row">
        <Button size="sm" onClick={() => void run({ type: 'stir', vessel: v.id }, 'حُرِّك')}>حرّك</Button>
        {v.kind !== 'pan' && v.kind !== 'bowl' && <Button size="sm" aria-pressed={v.lid} onClick={() => void run({ type: 'lid', vessel: v.id, on: !v.lid }, v.lid ? 'فُتح الغطاء' : 'أُغلق الغطاء')}>{v.lid ? 'افتح الغطاء' : 'أغلق الغطاء'}</Button>}
        {pc && v.pressure !== 'off' && <><Button size="sm" onClick={() => void run({ type: 'release', vessel: v.id, mode: 'natural' }, 'إطلاق طبيعي')}>إطلاق طبيعي</Button><Button size="sm" onClick={() => void run({ type: 'release', vessel: v.id, mode: 'quick' }, 'إطلاق سريع')}>إطلاق سريع</Button></>}
        <Button size="sm" onClick={() => onPour('oil')}>زيت</Button><Button size="sm" onClick={() => onPour('milk')}>حليب</Button>
        <Button size="sm" onClick={() => void run({ type: 'pour', ingredient: 'water', grams: 500, vessel: v.id }, 'صُبّ 500 غ ماء')}>+500 غ ماء</Button>
        <Button size="sm" onClick={() => onSeason('salt')}>ملح/كمون</Button>
        {v.waterG > 1 && <Button size="sm" onClick={() => void run({ type: 'drain', vessel: v.id }, 'صُفّي الماء')}>صفِّ</Button>}
        {(items.length > 0 || v.oilG > 0 || v.milkG > 0) && <Button size="sm" onClick={() => void run({ type: 'discard', target: v.id }, 'أُفرغ الوعاء (إهدار)')}>أفرغ</Button>}
      </div>
    </div>
  );
}

/* ───── «قدّم»: مراجعة البطاقة وحفظها (MC-01) ───── */
function ServeDialog({ sources, setSources, onClose, client, mode, seed, scene, onSaved, view }: { sources: Set<string>; setSources: (s: Set<string>) => void; onClose: () => void; client: SimClient; mode: Mode; seed: number; scene: KitchenScene | null; onSaved: (c: CardRowC) => void; view: SimView | null }) {
  const k = useKitchen();
  const { toast } = useApp();
  const [ops, setOps] = useState<import('../../../shared/kitchen/sim/index.js').Op[] | null>(null);
  const [step, setStep] = useState<'pick' | 'review'>('pick');
  const [name, setName] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [types, setTypes] = useState<MealType[]>([]);
  const [err, setErr] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [dupAsk, setDupAsk] = useState<{ slug: string; title_ar: string } | null>(null);
  const [confirmSandbox, setConfirmSandbox] = useState(false);
  const [busy, setBusy] = useState(false);
  const vessels = view?.snap.vessels.filter((v) => v.items.length || v.oilG > 0 || v.milkG > 0) ?? [];
  const loose = view?.snap.items.filter((i) => i.loc === 'board' || i.loc === 'toaster') ?? [];
  const idx = useMemo(() => indexPrices(k.prices), [k.prices]);
  const card = useMemo(() => {
    if (!ops) return null;
    try {
      return cookToCard(ops, idx, k.store, seed);
    } catch (e) {
      return e instanceof SimError ? { error: e.message } : null;
    }
  }, [ops, idx, k.store, seed]);

  const review = async (): Promise<void> => {
    try {
      await client.op({ type: 'serve', from: [...sources], plate: 'plate_1' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر التقديم');
      return;
    }
    const log = await client.log();
    setOps(log.ops);
    setPhoto(scene?.capturePhoto() ?? null);
    setStep('review');
  };
  useEffect(() => {
    if (card && !('error' in card)) {
      setName(card.name_ar);
      setStepsText(card.steps_ar.join('\n'));
      setTypes(card.meal_types);
    }
  }, [ops]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (accept?: 'new' | 'variant'): Promise<void> => {
    if (!ops) return;
    // اكتشاف التكرار محليًا قبل الإرسال (نفس قاعدة الخادم ≥90%) فلا طلب مرفوض ولا ضجيج في الشبكة؛ الخادم يفرضها أيضًا
    if (!accept && good) {
      const others = [...ORIGINAL_RECIPES.filter((x) => x.status === 'verified' || x.status === 'body_mismatch_title').map((x) => ({ slug: x.slug, title_ar: x.title_ar, lines: x.lines })), ...k.cards.map((c) => ({ slug: c.slug, title_ar: c.name_ar, lines: c.lines }))];
      const dup = findDuplicate(good.lines, others);
      if (dup) return void setDupAsk({ slug: dup.slug, title_ar: dup.title_ar });
    }
    setBusy(true);
    setErr('');
    try {
      const r = await serveCook({ mode: mode === 'sandbox' ? 'sandbox' : 'real', seed, ops, store: k.store, name_ar: name.trim() || undefined, steps_ar: stepsText.split('\n').map((s) => s.trim()).filter(Boolean), meal_types: types, ...(mode === 'sandbox' ? { confirm_sandbox: confirmSandbox } : {}), ...(accept ? { accept_duplicate: accept } : {}), ...(photo ? { image: photo } : {}) });
      toast(`حُفظت البطاقة «${r.card.name_ar}» في ابتكاراتي`, { kind: 'ok' });
      onSaved(r.card);
    } catch (e) {
      const ex = e as { code?: string; message: string; data?: { slug?: string; title_ar?: string } };
      if (ex.code === 'duplicate') setDupAsk({ slug: ex.data?.slug ?? '', title_ar: ex.data?.title_ar ?? '' });
      else setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };
  const good = card && !('error' in card) ? card : null;

  return (
    <Modal wide title={step === 'pick' ? 'قدّم: ما الذي يدخل الصحن؟' : 'مراجعة البطاقة'} onClose={onClose}
      footer={step === 'pick' ? <><Button onClick={onClose}>إلغاء</Button><Button variant="primary" data-testid="serve-confirm" onClick={() => void review()} disabled={!sources.size}>قدّم وراجع</Button></> : <><Button onClick={onClose}>إغلاق</Button><Button variant="primary" data-testid="save-card" onClick={() => void save()} disabled={busy || !good || !name.trim() || !types.length || (mode === 'sandbox' && !confirmSandbox)}>احفظ في ابتكاراتي</Button></>}>
      {err && <p className="callout danger" role="alert">{err}</p>}
      {step === 'pick' ? (
        <div className="stack">
          <p className="muted">اختر الأوعية والقطع التي تُقدَّم. ما لا تختاره يُسجَّل إهدارًا بتكلفته.</p>
          <ul className="plain stack kt-tight">
            {vessels.map((v) => <li key={v.id}><label className="kt-check"><input type="checkbox" checked={sources.has(v.id)} onChange={() => { const n = new Set(sources); n.has(v.id) ? n.delete(v.id) : n.add(v.id); setSources(n); }} /> {VESSEL_AR[v.id]} ({v.items.length} قطعة{v.oilG > 0.3 ? ` + زيت ${fmtNum(Math.round(v.oilG * 10) / 10, 1)} غ` : ''})</label></li>)}
            {loose.map((i) => <li key={i.id}><label className="kt-check"><input type="checkbox" checked={sources.has(i.id)} onChange={() => { const n = new Set(sources); n.has(i.id) ? n.delete(i.id) : n.add(i.id); setSources(n); }} /> {INGREDIENT_BY_SLUG.get(i.ingredient)?.name_ar} {fmtNum(i.g0, 0)} غ ({LOC_AR(i.loc)})</label></li>)}
          </ul>
        </div>
      ) : !good ? (
        <p className="callout danger">{card && 'error' in card ? card.error : 'تعذّر بناء البطاقة'}</p>
      ) : (
        <div className="kt-review">
          <div className="kt-review-main">
            <Field label="اسم الطبق (يمكن تعديله)" htmlFor="rv-name"><input id="rv-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />{good.matched && <small className="muted">طابق بطاقة «{RECIPE_BY_SLUG.get(good.matched)?.title_ar}»</small>}</Field>
            <Field label="الخطوات (سطر لكل خطوة — مولّدة بأسلوب لوحتك)" htmlFor="rv-steps"><textarea id="rv-steps" className="textarea" rows={7} value={stepsText} onChange={(e) => setStepsText(e.target.value)} /></Field>
            <div className="row" role="group" aria-label="نوع الوجبة">{(['فطور', 'غداء', 'عشاء'] as MealType[]).map((m) => <button key={m} type="button" className="chip" aria-pressed={types.includes(m)} onClick={() => setTypes(types.includes(m) ? types.filter((x) => x !== m) : [...types, m])}>{m}</button>)}</div>
            {mode === 'sandbox' && <label className="kt-check"><input type="checkbox" checked={confirmSandbox} onChange={(e) => setConfirmSandbox(e.target.checked)} /> أفهم أن هذه الطبخة في وضع التجربة بلا خصم من المخزن وسأشتري المكوّنات لاحقًا</label>}
          </div>
          <div className="kt-review-side">
            {photo ? <img className="kt-photo" src={photo} alt={`صورة طبق ${name}`} /> : <div className="kt-photo-cover" role="img" aria-label="غلاف مولّد">{INGREDIENT_BY_SLUG.get(good.lines[0]?.ingredient ?? '')?.icon ?? '🍽️'}<b>{name}</b></div>}
            <div className="row"><Badge tone="accent">OVR {good.stats.OVR}</Badge><Badge>{({ bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', iconic: 'أيقوني' } as Record<string, string>)[good.rarity]}</Badge>{good.flags.map((f) => <Badge key={f} tone="warn">{({ unsafe_chicken: 'دجاج غير ناضج', burnt: 'محترق', undercooked: 'نصف ناضج', has_waste: 'فيه إهدار' } as Record<string, string>)[f] ?? f}</Badge>)}</div>
            <NutriGrid n={good.nutrition} unitLabel="تغذية البطاقة" />
            <p>التكلفة: <b className="num" dir="ltr">{good.cost_rm === null ? '—' : fmtRM(good.cost_rm)}</b> {good.estimated && <Badge dashed>تقديري</Badge>}</p>
            {Object.keys(good.waste).length > 0 && <p className="callout warn">إهدار: {Object.entries(good.waste).map(([s, g]) => `${INGREDIENT_BY_SLUG.get(s)?.name_ar} ${g} غ`).join('، ')}{good.waste_cost_rm !== null ? ` — ${fmtRM(good.waste_cost_rm)}` : ''}</p>}
            <ul className="plain kt-tight">{good.lines.map((l) => <li key={l.ingredient}>{INGREDIENT_BY_SLUG.get(l.ingredient)?.name_ar} <b className="num" dir="ltr">{l.amount_g} غ</b></li>)}</ul>
          </div>
        </div>
      )}
      {dupAsk && (
        <Modal title="بطاقة مطابقة" onClose={() => setDupAsk(null)} footer={<><Button onClick={() => { setDupAsk(null); void save('new'); }}>احفظ بطاقة جديدة</Button><Button variant="primary" data-testid="dup-variant" onClick={() => { setDupAsk(null); void save('variant'); }}>احفظ كنسخة</Button></>}>
          <p>هذه هي بطاقة «{dupAsk.title_ar}» (تشابه ≥ 90% بالأوزان). احفظ كنسخة منها؟</p>
        </Modal>
      )}
    </Modal>
  );
}
