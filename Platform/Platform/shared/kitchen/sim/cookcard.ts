/**
 * من سجل العمليات إلى بطاقة وجبة (MC-01): الأوزان الفعلية، التغذية والتكلفة، الاسم (MC-20)، الخطوات (MC-30)، الإحصاءات والندرة.
 * نقي وحتمي: السجل نفسه ينتج البطاقة نفسها حرفيًا (AC-06).
 */
import { INGREDIENT_BY_SLUG } from '../data/ingredients.js';
import { ORIGINAL_RECIPES } from '../data/recipes.js';
import { cardStats, rarityOf, type CardStats, type Rarity } from '../cards.js';
import { mealCost, type PriceIndex } from '../cost.js';
import { nutritionOf } from '../nutrition.js';
import { gramsAr, minutesAr } from '../phrases.js';
import type { MealType, NutritionVector, RecipeLine } from '../types.js';
import { Sim, isUnsafe, type CutShape, type CutSize, type Op, type Snapshot } from './engine.js';

/** الاسم المعرَّف كما يُكتب في عبارات الوصفات (S6): «من البيض»، «بالجبنة»… بحسب لوحة المالك */
export const AR_DEF: Readonly<Record<string, string>> = Object.freeze({
  potato: 'البطاط', onion: 'البصل', tomato: 'الطماطم', carrot: 'الجزر', cucumber: 'الخيار', toast: 'التوست', lemon: 'الليمون', oats: 'الشوفان', egg: 'البيض', banana: 'الموز', milk: 'الحليب', honey: 'العسل',
  cheese: 'الجبنة', yogurt: 'الزبادي', chicken: 'الدجاج', garlic: 'الثوم', rice: 'الأرز', eggplant: 'الباذنجان', green_beans: 'الفاصوليا الخضراء', ginger: 'الزنجبيل', coriander: 'الكزبرة', cumin: 'الكمون',
  tomato_paste: 'معجون الطماطم', salt: 'الملح', sugar: 'السكر', oil: 'الزيت',
});
const SEASON = new Set(['salt', 'cumin', 'sugar', 'oil']);
const grams = (g: number): string => gramsAr(Math.max(1, Math.round(g)));
const defOf = (slug: string): string => AR_DEF[slug] ?? slug;

/* ───── تحليل السجل ───── */
type Method = 'boil' | 'simmer' | 'fry' | 'toast' | 'pressure' | 'raw';
interface AddEv { boilAt: number | null; t: number; item: string; ing: string; g: number; vessel: string; kind: string; method: Method; liquidG: number; oilG: number; level: number; endT: number }
interface PrepEv { t: number; item: string; ing: string; g: number; action: string; shape?: CutShape | undefined; size?: CutSize | undefined }
export interface Analysis {
  sim: Sim;
  adds: AddEv[];
  preps: PrepEv[];
  pours: { t: number; ing: string; g: number; vessel: string }[];
  methods: Record<string, Set<Method>>;
  peakLiquid: number;
  whisked: boolean;
  endT: number;
}

export function analyze(ops: readonly Op[], seed = 1): Analysis {
  const sim = new Sim(seed);
  const sorted = [...ops].sort((a, b) => a.t - b.t);
  const adds: AddEv[] = [];
  const preps: PrepEv[] = [];
  const pours: Analysis['pours'] = [];
  const methods: Record<string, Set<Method>> = {};
  const heatLog = new Map<string, { t: number; on: boolean }[]>();
  const heated = (id: string): boolean => {
    const v = sim.vessels.get(id)!;
    return v.burner > 0 && sim.burners[v.burner - 1]! > 0;
  };
  const note = (id: string): void => {
    const log = heatLog.get(id) ?? [];
    const on = heated(id);
    if (!log.length || log[log.length - 1]!.on !== on) log.push({ t: sim.t, on });
    heatLog.set(id, log);
  };
  let peakLiquid = 0;
  let whisked = false;
  const liquidAt = new Map<string, number>();
  const stays: { item: string; vessel: string; start: number; end: number | null }[] = [];
  const boilAt = new Map<string, number>();
  const probe = (): void => {
    for (const v of sim.vessels.values()) if (!boilAt.has(v.id) && v.T >= 99.5 && (v.waterG + v.milkG) > 1) boilAt.set(v.id, sim.t);
  };
  for (const op of sorted) {
    // نتقدّم بخطوات ≤ 2 ث لنلتقط لحظة الغليان لكل وعاء (النتيجة مطابقة لأن الشبكة ثابتة)
    while (sim.t + 2 < op.t) {
      sim.advanceTo(sim.t + 2);
      probe();
    }
    sim.apply(op);
    probe();
    for (const id of sim.vessels.keys()) note(id);
    if (op.type === 'pour') liquidAt.set(op.vessel, Math.max(liquidAt.get(op.vessel) ?? 0, (sim.vessels.get(op.vessel)!.waterG + sim.vessels.get(op.vessel)!.milkG)));
    switch (op.type) {
      case 'prep': {
        const it = sim.items.get(op.item)!;
        preps.push({ t: sim.t, item: op.item, ing: it.ingredient, g: it.g0, action: op.action, shape: op.shape, size: op.size });
        if (op.action === 'whisk') whisked = true;
        break;
      }
      case 'pour':
        pours.push({ t: sim.t, ing: op.ingredient, g: op.grams, vessel: op.vessel });
        break;
      case 'add': {
        const it = sim.items.get(op.item)!;
        const v = sim.vessels.get(op.vessel)!;
        const liquid = v.waterG + v.milkG;
        peakLiquid = Math.max(peakLiquid, liquid);
        liquidAt.set(op.vessel, Math.max(liquidAt.get(op.vessel) ?? 0, liquid));
        const hot = heated(op.vessel) || v.pressure !== 'off';
        let method: Method = 'raw';
        if (v.kind === 'pressure_cooker') method = 'pressure';
        else if (hot || v.T > 60) method = liquid > Math.max(60, it.g0 * 0.5) ? (sim.burners[v.burner - 1]! <= 3 ? 'simmer' : 'boil') : 'fry';
        adds.push({ boilAt: null, t: sim.t, item: op.item, ing: it.ingredient, g: it.g0, vessel: op.vessel, kind: v.kind, method, liquidG: liquid, oilG: v.oilG, level: v.burner ? sim.burners[v.burner - 1]! : 0, endT: sim.t });
        stays.push({ item: op.item, vessel: op.vessel, start: sim.t, end: null });
        break;
      }
      case 'toast': {
        const it = sim.items.get(op.item)!;
        (methods[it.ingredient] ??= new Set()).add('toast');
        adds.push({ boilAt: null, t: sim.t, item: op.item, ing: it.ingredient, g: it.g0, vessel: 'toaster', kind: 'toaster', method: 'toast', liquidG: 0, oilG: 0, level: op.level, endT: sim.t + 40 + 30 * op.level });
        break;
      }
      case 'remove':
        for (const s of stays) if (s.item === op.item && s.end === null) s.end = sim.t;
        break;
      case 'discard':
        for (const s of stays) if ((s.item === op.target || s.vessel === op.target) && s.end === null) s.end = sim.t;
        break;
      case 'serve':
        for (const s of stays) if (s.end === null && (op.from.includes(s.vessel) || op.from.includes(s.item))) s.end = sim.t;
        break;
      default:
    }
  }
  const endT = sim.t;
  for (const a of adds) a.boilAt = boilAt.get(a.vessel) ?? null;
  // نهاية بقاء كل إضافة: إخراج القطعة، أو إطفاء الوعاء، أو التقديم
  for (const a of adds) {
    if (a.kind === 'toaster') continue;
    const st = stays.find((s) => s.item === a.item && s.vessel === a.vessel && s.start === a.t);
    const log = heatLog.get(a.vessel) ?? [];
    const off = log.find((l) => !l.on && l.t > a.t);
    const candidates = [st?.end ?? Infinity, off ? off.t : Infinity, endT];
    a.endT = Math.min(...candidates);
    // هل سُخِّن الوعاء أثناء بقاء القطعة؟ (التسخين قد يبدأ بعد الإضافة، كالشوفان في الحليب)
    let heatedDuring = false;
    let on = false;
    for (const l of log) {
      if (l.t <= a.t) on = l.on;
      else if (l.t < a.endT) {
        if (l.on) heatedDuring = true;
      }
    }
    if (on) heatedDuring = true;
    if (a.kind !== 'pressure_cooker' && !heatedDuring) {
      a.method = 'raw';
    } else if (a.kind !== 'pressure_cooker') {
      const liquid = Math.max(a.liquidG, liquidAt.get(a.vessel) ?? 0);
      a.method = liquid > Math.max(60, a.g * 0.5) ? (a.level <= 3 && a.level > 0 ? 'simmer' : 'boil') : 'fry';
    }
    (methods[a.ing] ??= new Set()).add(a.method);
  }
  return { sim, adds, preps, pours, methods, peakLiquid, whisked, endT };
}

/* ───── الأوزان ───── */
export interface CookResult { lines: RecipeLine[]; taken: Record<string, number>; served: Record<string, number>; waste: Record<string, number> }
export function linesFromSim(sim: Sim): CookResult {
  const snap = sim.snapshot();
  const served: Record<string, number> = {};
  for (const s of snap.served) for (const [k, g] of Object.entries(s.byIngredient)) served[k] = (served[k] ?? 0) + g;
  // التوابل لا تُقدَّم بالوزن: تُحتسب مستعملة بما أُخذ ناقصًا ما أُهدر
  for (const k of ['salt', 'cumin', 'sugar']) if (snap.taken[k]) served[k] = Math.max(0, snap.taken[k]! - (snap.waste[k] ?? 0));
  const waste: Record<string, number> = {};
  for (const [k, g] of Object.entries(snap.taken)) {
    const w = Math.max(0, g - (served[k] ?? 0));
    if (w > 0.5) waste[k] = Math.round(w);
  }
  const order = Object.keys(snap.taken);
  const lines: RecipeLine[] = order.filter((k) => (served[k] ?? 0) >= 0.5 && INGREDIENT_BY_SLUG.has(k)).map((k) => ({ ingredient: k, amount_g: Math.max(1, Math.round(served[k]!)) }));
  return { lines, taken: Object.fromEntries(Object.entries(snap.taken).map(([k, g]) => [k, Math.round(g * 10) / 10])), served, waste };
}

/* ───── التشابه (MC-06) ───── */
/** تشابه مكوّنات بالأوزان: Σmin ÷ Σmax على اتحاد المكوّنات (1 = مطابق) */
export function cardSimilarity(a: readonly RecipeLine[], b: readonly RecipeLine[]): number {
  const m = (ls: readonly RecipeLine[]): Map<string, number> => {
    const r = new Map<string, number>();
    for (const l of ls) if (l.amount_g) r.set(l.ingredient, (r.get(l.ingredient) ?? 0) + l.amount_g);
    return r;
  };
  const A = m(a);
  const B = m(b);
  let mn = 0;
  let mx = 0;
  for (const k of new Set([...A.keys(), ...B.keys()])) {
    mn += Math.min(A.get(k) ?? 0, B.get(k) ?? 0);
    mx += Math.max(A.get(k) ?? 0, B.get(k) ?? 0);
  }
  return mx === 0 ? 0 : mn / mx;
}
export const DUPLICATE_THRESHOLD = 0.9;
export function findDuplicate(lines: readonly RecipeLine[], others: readonly { slug: string; title_ar: string; lines: readonly RecipeLine[] }[]): { slug: string; title_ar: string; similarity: number } | null {
  let best: { slug: string; title_ar: string; similarity: number } | null = null;
  for (const o of others) {
    const s = cardSimilarity(lines, o.lines);
    if (s >= DUPLICATE_THRESHOLD && (!best || s > best.similarity)) best = { slug: o.slug, title_ar: o.title_ar, similarity: s };
  }
  return best;
}

/* ───── مسمّي الأطباق (MC-20) ───── */
export function nameDish(lines: readonly RecipeLine[], an: Analysis, known: readonly { slug: string; title_ar: string; lines: readonly RecipeLine[] }[] = ORIGINAL_RECIPES): { name: string; matched: string | null } {
  const dup = findDuplicate(lines, known);
  if (dup) return { name: dup.title_ar, matched: dup.slug };
  const g = (k: string): number => lines.find((l) => l.ingredient === k)?.amount_g ?? 0;
  const has = (k: string): boolean => g(k) > 0;
  const m = (k: string): Set<Method> => an.methods[k] ?? new Set();
  const fried = (k: string): boolean => m(k).has('fry');
  const boiled = (k: string): boolean => m(k).has('boil') || m(k).has('simmer');
  let base: string;
  let skip = new Set<string>();
  if (has('egg') && an.whisked && fried('egg')) {
    base = 'أومليت';
    skip = new Set(['egg']);
  } else if (has('egg') && boiled('egg') && has('toast')) {
    base = 'توست بالبيض';
    skip = new Set(['egg', 'toast']);
  } else if (has('oats') && (boiled('oats') || m('oats').has('simmer')) && (has('milk') || has('yogurt'))) {
    base = `شوفان ب${has('milk') ? 'الحليب' : 'الزبادي'}`;
    skip = new Set(['oats', 'milk']);
  } else if (has('oats') && has('yogurt')) {
    base = 'زبادي بالشوفان';
    skip = new Set(['oats', 'yogurt']);
  } else if (has('chicken') && an.peakLiquid >= 500 && (boiled('chicken') || m('chicken').has('pressure'))) {
    base = 'شوربة دجاج';
    skip = new Set(['chicken']);
  } else if (has('chicken') && has('tomato_paste')) {
    base = 'إيدام الدجاج';
    skip = new Set(['chicken', 'tomato_paste']);
  } else if (has('chicken') && has('eggplant')) {
    base = 'باذنجان بالدجاج';
    skip = new Set(['chicken', 'eggplant']);
  } else if (has('chicken') && has('rice') && !(has('cucumber') && has('tomato') && !fried('tomato'))) {
    base = 'دجاج مع الأرز';
    skip = new Set(['chicken', 'rice']);
  } else if (has('chicken') && (has('cucumber') || has('tomato')) && m('cucumber').size + m('tomato').size <= 2) {
    base = 'سلطة دجاج';
    skip = new Set(['chicken']);
  } else {
    const main = [...lines].filter((l) => !SEASON.has(l.ingredient)).sort((a, b) => (b.amount_g ?? 0) - (a.amount_g ?? 0))[0];
    base = main ? `طبق ${defOf(main.ingredient)}` : 'طبق جديد';
    skip = new Set(main ? [main.ingredient] : []);
  }
  const sec = [...lines]
    .filter((l) => !SEASON.has(l.ingredient) && !skip.has(l.ingredient) && l.ingredient !== 'water')
    .sort((a, b) => (b.amount_g ?? 0) - (a.amount_g ?? 0))
    .slice(0, 3)
    .map((l) => defOf(l.ingredient));
  // حد أقصى 5 كلمات أساسية: نقلّل الثانويات حتى يتسع الاسم
  const words = (s: string): number => s.split(/\s+/).filter((w) => w !== 'و' && w.length > 0).length;
  let name = base;
  const picked: string[] = [];
  for (const s of sec) {
    const candidate = `${base} ${[...picked, s].map((x, i) => (i === 0 ? `ب${x}` : `و${x}`)).join(' ')}`.replace(/ و(?=\S)/g, ' و');
    if (words(candidate) <= 5) picked.push(s);
  }
  if (picked.length) name = `${base} ${picked.map((x, i) => (i === 0 ? `ب${x}` : `و${x}`)).join(' ')}`;
  return { name, matched: null };
}

/* ───── كاتب الخطوات (MC-30) ───── */
const SHAPE_AR = (shape: CutShape, size?: CutSize): string => {
  switch (shape) {
    case 'slices': return 'شرائح';
    case 'cubes': return size === 'small' ? 'مكعبات صغيرة' : size === 'large' ? 'مكعبات كبيرة' : 'مكعبات';
    case 'diced': return 'مكعبات صغيرة';
    case 'sticks': return 'أعواداً';
    case 'minced': return 'فرماً ناعماً';
    default: return 'قطعاً';
  }
};
const MIN_ROUND = (s: number): number => Math.max(1, Math.round(s / 60));
const dur = (s: number): string => minutesAr(MIN_ROUND(s), { words: true });
const joinAr = (xs: string[]): string => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join('، ')} و${xs[xs.length - 1]}`);

export function writeSteps(an: Analysis): string[] {
  const out: string[] = [];
  const done = new Set<string>(); // قطع جرى ذكر تحضيرها
  const prepOf = (item: string): PrepEv[] => an.preps.filter((p) => p.item === item);
  const itemName = (item: string): string => defOf(an.sim.items.get(item)!.ingredient);
  const itemG = (item: string): string => grams(an.sim.items.get(item)!.g0);

  // 1) تحضيرات مستقلة (قطع/بشر/هرس/خفق/عصر/ترشيش) تسبق الطهي
  const mentionedAfterCook = new Set<string>();
  const firstAdd = new Map<string, number>();
  for (const a of an.adds) if (!firstAdd.has(a.item)) firstAdd.set(a.item, a.t);
  const removedAfterCook = new Set<string>();
  void removedAfterCook;
  for (const p of an.preps) {
    const ta = firstAdd.get(p.item);
    const afterCook = ta !== undefined && p.t > ta;
    if (afterCook) {
      mentionedAfterCook.add(p.item);
      continue;
    }
    const key = `${p.item}:${p.action}`;
    if (done.has(key)) continue;
    done.add(key);
    const name = itemName(p.item);
    const g = itemG(p.item);
    switch (p.action) {
      case 'cut': out.push(`قطّع ${g} من ${name} ${SHAPE_AR(p.shape!, p.size)}.`); break;
      case 'grate': out.push(`ابشر ${g} من ${name}.`); break;
      case 'mash': out.push(`اهرس ${g} من ${name}.`); break;
      case 'whisk': out.push(`اخفق ${g} من ${name} في كاسة.`); break;
      case 'juice': out.push(`اعصر ${g} من الليمون.`); break;
      case 'salt_rest': out.push(`رُشّ ${g} من ${name} بالملح 5 دقائق ثم اشطفها وجفّفها بسرعة.`); break;
      default:
    }
  }

  // 2) مجموعات الطهي لكل وعاء: إضافات متقاربة (< 45 ث) تُدمج في جملة واحدة
  const byVessel = new Map<string, AddEv[]>();
  for (const a of an.adds) if (a.method !== 'raw') (byVessel.get(a.vessel) ?? byVessel.set(a.vessel, []).get(a.vessel)!).push(a);
  const groups: { t: number; vessel: string; adds: AddEv[] }[] = [];
  for (const [vessel, list] of byVessel) {
    const sorted = [...list].sort((a, b) => a.t - b.t);
    let cur: AddEv[] = [];
    for (const a of sorted) {
      if (cur.length && a.t - cur[cur.length - 1]!.t > 45) {
        groups.push({ t: cur[0]!.t, vessel, adds: cur });
        cur = [];
      }
      cur.push(a);
    }
    if (cur.length) groups.push({ t: cur[0]!.t, vessel, adds: cur });
  }
  groups.sort((a, b) => a.t - b.t);
  const poured = (vessel: string, ing: string, before: number): number => an.pours.filter((p) => p.vessel === vessel && p.ing === ing && p.t <= before + 1).reduce((s, p) => s + p.g, 0);
  const oilSaid = new Set<string>();
  const firstInVessel = new Set<string>();
  const nextStart = (g: { t: number; vessel: string }): number => groups.filter((x) => x.vessel === g.vessel && x.t > g.t).reduce((m, x) => Math.min(m, x.t), Infinity);

  for (const grp of groups) {
    const first = grp.adds[0]!;
    const isFirst = !firstInVessel.has(grp.vessel);
    firstInVessel.add(grp.vessel);
    const vkind = first.kind;
    // مدة المجموعة: حتى بداية المجموعة التالية في الوعاء نفسه أو نهاية بقاء أحدهم
    const end = Math.min(nextStart(grp), Math.max(...grp.adds.map((a) => a.endT)));
    // للشوربة والإيدام: المدة من لحظة الغليان (نار هادئة) لا من لحظة الوضع في الوعاء البارد
    const simmerFrom = first.boilAt !== null && first.boilAt > first.t && first.boilAt < end ? first.boilAt : first.t;
    const stay = Math.max(30, end - first.t);
    const stayFromBoil = Math.max(30, end - simmerFrom);
    const names = grp.adds.map((a) => `${grams(a.g)} من ${defOf(a.ing)}`);
    const oilNow = poured(grp.vessel, 'oil', first.t);
    const oil = oilSaid.has(grp.vessel) ? 0 : oilNow;
    if (oil) oilSaid.add(grp.vessel);
    const milk = poured(grp.vessel, 'milk', first.t);
    const ings = grp.adds.map((a) => a.ing);
    const itemOf = (ing: string) => grp.adds.find((a) => a.ing === ing)!;
    let s = '';
    if (ings.includes('egg') && vkind !== 'pan') {
      const eggAdd = itemOf('egg');
      s = `اسلق ${grams(eggAdd.g)} من البيض ${dur(stay)}`;
      const post = prepOf(eggAdd.item).filter((p) => p.t > eggAdd.t);
      if (post.length) {
        const peeled = post.some((p) => p.action === 'peel');
        const cut = post.find((p) => p.action === 'cut');
        s += `، ثم ${[peeled ? 'قشّره' : '', cut ? `قطّعه ${SHAPE_AR(cut.shape!, cut.size)}` : ''].filter(Boolean).join(' و')}`;
      }
      s += '.';
    } else if (ings.includes('oats') && milk > 0) {
      s = `ضع ${grams(itemOf('oats').g)} من الشوفان في قدر مع ${grams(milk)} من الحليب، واطبخ على نار هادئة ${dur(stay)} مع التحريك.`;
    } else if (ings.includes('rice') && ings.length === 1 && vkind !== 'pan') {
      s = `اسلق ${grams(itemOf('rice').g)} من الأرز الجاف في ماء مملّح ${dur(stay)}.`;
    } else if (vkind === 'pan') {
      const eggAdd = grp.adds.find((a) => a.ing === 'egg' && an.sim.items.get(a.item)?.whisked);
      if (eggAdd) {
        const others = grp.adds.filter((a) => a !== eggAdd).map((a) => `${grams(a.g)} من ${defOf(a.ing)}`);
        s = `${isFirst || oil ? `سخّن مقلاة${oil ? ` مع ${grams(oil)} من الزيت` : ''} وأضف` : 'أضف'} ${grams(eggAdd.g)} من البيض المخفوق${others.length ? `، ثم ${joinAr(others)} فوقه` : ''} واتركه حتى ينضج.`;
      } else {
        const fryEggplant = grp.adds.some((a) => a.ing === 'eggplant' && (an.sim.items.get(a.item)?.browning ?? 0) >= 0.3);
        const verb = fryEggplant ? 'واقلِ' : 'واطبخ';
        s = `${oil ? `سخّن ${grams(oil)} من الزيت ${verb} ${joinAr(names)}` : `${isFirst ? 'اطبخ' : 'أضف'} ${joinAr(names)}`} ${dur(stay)}${fryEggplant ? ' حتى يحمرّ' : ''}.`;
      }
    } else if (vkind === 'toaster') {
      s = '';
    } else if (grp.adds.length >= 4 && an.peakLiquid >= 500) {
      s = `ضع ${joinAr(names)} في قدر مع ماء يغطيها، واترك الشوربة على نار هادئة ${dur(stayFromBoil)} حتى تنضج تماماً.`;
    } else if (first.method === 'pressure') {
      s = `ضع ${joinAr(names)} في قدر الضغط مع قليل من الماء، وأغلقه واطبخ بعد الصفير ${dur(stay)}.`;
    } else if (isFirst) {
      s = `${oil ? `سخّن ${grams(oil)} من الزيت و` : ''}اطبخ ${joinAr(names)} ${dur(stay)}.`;
    } else {
      s = `أضف ${joinAr(names)} واترك على نار ${first.level <= 3 ? 'هادئة' : 'متوسطة'} ${dur(stay)}.`;
    }
    if (s) out.push(s);
  }

  // 3) التحميص
  for (const a of an.adds.filter((x) => x.method === 'toast')) out.splice(Math.min(out.length, 1), 0, `حمّص ${grams(a.g)} من التوست.`);

  // 4) التجميع بلا حرارة: إضافات خام إلى وعاء/صحن (جبنة فوق التوست…)
  const raw = an.adds.filter((a) => a.method === 'raw' && !SEASON.has(a.ing));
  const rawByVessel = new Map<string, AddEv[]>();
  for (const a of raw) (rawByVessel.get(a.vessel) ?? rawByVessel.set(a.vessel, []).get(a.vessel)!).push(a);
  for (const [vessel, list] of rawByVessel) {
    const cooked = new Set(an.adds.filter((a) => a.method !== 'raw').map((a) => a.item));
    const fresh = list.filter((a) => !cooked.has(a.item));
    if (!fresh.length) continue;
    const phr = fresh.map((a) => `${grams(a.g)} من ${defOf(a.ing)}`);
    const withToast = an.adds.some((a) => a.method === 'toast');
    const target = vessel === 'plate_1' && withToast ? 'فوق التوست' : vessel.startsWith('bowl') ? 'في وعاء التقديم' : 'في الصحن';
    out.push(`ضع ${joinAr(phr)} ${target}.`);
  }
  // الزيت المصبوب على الوجبة مباشرة
  for (const p of an.pours.filter((x) => x.ing === 'oil' && (x.vessel === 'plate_1' || x.vessel === 'bowl'))) out.push(`وزّع ${grams(p.g)} من الزيت فوق الوجبة قبل التقديم.`);
  // التوابل
  const seasons = an.sim.taken;
  if (seasons['salt'] || seasons['cumin']) {
    const parts = [seasons['cumin'] ? 'الكمون' : '', seasons['salt'] ? 'الملح' : ''].filter(Boolean);
    if (parts.length) out.unshift(`تبّل ب${joinAr(parts)}.`);
  }
  // التقديم: ما قُدّم بلا حرارة ولا تحضير مذكور سابقًا
  const servedIng = new Set(an.sim.served.flatMap((s) => s.itemIds.map((id) => an.sim.items.get(id)!.ingredient)));
  const mentioned = out.join(' ');
  const rest = [...servedIng].filter((k) => !SEASON.has(k) && !mentioned.includes(defOf(k)));
  if (rest.length) {
    const phr = rest.map((k) => {
      const it = [...an.sim.items.values()].find((i) => i.ingredient === k && an.sim.served.some((s) => s.itemIds.includes(i.id)))!;
      return `${grams(it.g0)} من ${defOf(k)}`;
    });
    out.push(`قدّمه مع ${joinAr(phr)}.`);
  } else out.push('قدّم الوجبة.');
  return out.map((s, i) => `${i + 1}: ${s.replace(/\s+/g, ' ').trim()}`);
}

/* ───── البطاقة ───── */
export interface CookedCard {
  name_ar: string;
  matched: string | null;
  lines: RecipeLine[];
  steps_ar: string[];
  nutrition: NutritionVector;
  cost_rm: number | null;
  cost_confidence: 'low' | 'medium' | 'high';
  estimated: boolean;
  stats: CardStats;
  rarity: Rarity;
  meal_types: MealType[];
  flags: string[];
  waste: Record<string, number>;
  taken: Record<string, number>;
  waste_cost_rm: number | null;
  events: { t: number; type: string; ref: string }[];
  snapshot: Snapshot;
}

export function suggestMealTypes(lines: readonly RecipeLine[], an: Analysis): MealType[] {
  const has = (k: string): boolean => lines.some((l) => l.ingredient === k);
  if (has('oats') || (has('egg') && has('toast')) || an.whisked) return ['فطور'];
  if (has('chicken') && has('rice')) return ['غداء'];
  if (has('chicken')) return ['غداء', 'عشاء'];
  return ['عشاء'];
}

export function cookToCard(ops: readonly Op[], idx: PriceIndex, store: string, seed = 1): CookedCard {
  const an = analyze(ops, seed);
  const res = linesFromSim(an.sim);
  const nm = nameDish(res.lines, an);
  const steps = writeSteps(an);
  const nut = nutritionOf(res.lines).total;
  const cost = mealCost(res.lines, idx, { store });
  const total = cost.missing.length ? null : cost.total_rm;
  const stats = cardStats(nut, total, res.lines);
  const flags: string[] = [];
  const servedItems = an.sim.served.flatMap((s) => s.itemIds).map((id) => an.sim.items.get(id)!);
  if (servedItems.some((i) => isUnsafe({ ...i, loc: 'x' }))) flags.push('unsafe_chicken');
  if (servedItems.some((i) => i.burn >= 0.5)) flags.push('burnt');
  if (servedItems.some((i) => stageIsRaw(i))) flags.push('undercooked');
  if (Object.keys(res.waste).length) flags.push('has_waste');
  const wasteLines = Object.entries(res.waste).filter(([k]) => INGREDIENT_BY_SLUG.has(k)).map(([k, g]) => ({ ingredient: k, amount_g: g }));
  const wcost = wasteLines.length ? mealCost(wasteLines, idx, { store }) : null;
  return {
    name_ar: nm.name, matched: nm.matched, lines: res.lines, steps_ar: steps, nutrition: nut, cost_rm: total, cost_confidence: cost.confidence, estimated: cost.estimated, stats, rarity: rarityOf(stats.OVR),
    meal_types: suggestMealTypes(res.lines, an), flags, waste: res.waste, taken: res.taken, waste_cost_rm: wcost && !wcost.missing.length ? wcost.total_rm : null, events: an.sim.events.map((e) => ({ ...e })), snapshot: an.sim.snapshot(),
  };
}
/** نصف ناضج: قطعة طُهيت (قلبها وصل ≥ 50°م) ولم تبلغ نضجها، من أصناف لا تُؤكل نصف مطبوخة */
const stageIsRaw = (i: { ingredient: string; doneness: number; tMax: number }): boolean => ['chicken', 'potato', 'rice', 'eggplant', 'green_beans'].includes(i.ingredient) && i.tMax >= 50 && i.doneness < 0.9;
