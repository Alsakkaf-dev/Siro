/**
 * الوضع الموجّه (KIT-30): كل خطوة من نص الوصفة تُترجَم إلى مواصفة (فعل + مكوّنات + أوزان) بنافذة تسامح،
 * وتُعلَّم منجزة تلقائيًا من حالة المحاكي. نقي: يعمل على لقطة Snapshot فقط.
 */
import { INGREDIENT_BY_SLUG } from '../data/ingredients.js';
import type { Snapshot } from './engine.js';

/** صيغ الأسماء كما في نصوص الوصفات الأصلية */
const FORMS: Readonly<Record<string, readonly string[]>> = {
  potato: ['البطاط', 'البطاطا'], onion: ['البصل'], tomato: ['الطماطم'], carrot: ['الجزر'], cucumber: ['الخيار'], toast: ['التوست'], lemon: ['عصير الليمون', 'الليمون'], oats: ['الشوفان'], egg: ['البيض'],
  banana: ['الموز'], milk: ['الحليب'], honey: ['العسل'], cheese: ['الجبنة'], yogurt: ['الزبادي'], chicken: ['صدر الدجاج', 'الدجاج'], garlic: ['الثوم'], rice: ['الأرز الجاف', 'الأرز'], eggplant: ['الباذنجان'],
  green_beans: ['الفاصوليا الخضراء', 'الفاصوليا'], oil: ['الزيت'], cumin: ['الكمون'], salt: ['الملح'], sugar: ['السكر'], tomato_paste: ['معجون الطماطم'],
};
export type StepVerb = 'boil' | 'whisk' | 'cut' | 'grate' | 'mash' | 'toast' | 'cook' | 'add' | 'serve' | 'juice' | 'salt_rest' | 'other';
export interface Mention { ingredient: string; grams: number; /** الفعل الأقرب قبل الذكر في النص */ verb: StepVerb }
export interface StepSpec { index: number; text: string; verbs: StepVerb[]; mentions: Mention[]; /** مدّة مذكورة بالدقائق (إن وُجدت) */ minutes: number | null }

const WORD_MIN: Record<string, number> = { 'دقيقة واحدة': 1, دقيقتين: 2, ثلاث: 3, أربع: 4, خمس: 5, ست: 6, سبع: 7, ثماني: 8, تسع: 9, عشر: 10 };
const GR = /(\d+) (?:غرام(?:اً|ات)?|غرامان)/g;

const VERB_RES: [StepVerb, RegExp][] = [
  ['boil', /اسلق/], ['whisk', /اخفق/], ['cut', /قطّع|قطعاً/], ['grate', /ابشر/], ['mash', /اهرس/], ['toast', /حمّص/], ['juice', /اعصر/], ['salt_rest', /رُشّ/],
  ['cook', /سخّن|اطبخ|اقلِ|اشوه|اشوِ|شوّح|اسكب/], ['serve', /قدّم|قدّمه|قدّمها/], ['add', /ضع|أضف|وزّع|قلّب/],
];
function verbBefore(text: string, pos: number): StepVerb {
  let best: { v: StepVerb; at: number } | null = null;
  for (const [v, re] of VERB_RES) {
    const g = new RegExp(re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = g.exec(text)) && m.index < pos) if (!best || m.index > best.at) best = { v, at: m.index };
  }
  return best?.v ?? 'other';
}

export function parseStep(text: string, index: number): StepSpec {
  const mentions: Mention[] = [];
  const names = Object.entries(FORMS).flatMap(([slug, fs]) => fs.map((f) => ({ slug, f }))).sort((a, b) => b.f.length - a.f.length);
  let m: RegExpExecArray | null;
  GR.lastIndex = 0;
  while ((m = GR.exec(text))) {
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 40);
    const hit = names.find((n) => after.startsWith(` من ${n.f}`));
    if (hit) mentions.push({ ingredient: hit.slug, grams: Number(m[1]), verb: verbBefore(text, m.index) });
  }
  const verbs: StepVerb[] = [];
  for (const [v, re] of VERB_RES) if (re.test(text) || (v === 'cook' && /اترك الشوربة|على نار/.test(text)) || (v === 'juice' && /عصير الليمون/.test(text))) verbs.push(v);
  if (!verbs.length) verbs.push('other');
  const dm = /(\d+) دقيقة|دقيقة واحدة|دقيقتين|(ثلاث|أربع|خمس|ست|سبع|ثماني|تسع|عشر) دقائق|(\d+) دقائق/.exec(text);
  const minutes = dm ? (dm[1] ? Number(dm[1]) : dm[3] ? Number(dm[3]) : dm[2] ? (WORD_MIN[dm[2]] ?? null) : (WORD_MIN[dm[0]] ?? null)) : null;
  return { index, text, verbs, mentions, minutes };
}
export const parseSteps = (steps: readonly string[]): StepSpec[] => steps.map((s, i) => parseStep(s, i));

export interface StepState { done: boolean; /** أسباب عدم الإنجاز بالعربية */ missing: string[]; /** دقة الأوزان 0..1 (متوسط 1 − الانحراف النسبي) */ accuracy: number }

/** تسامح الوزن: ±3% في «عادي» (KIT-02)، ±8% هنا لنقبل التقريب اليدوي، و±0 في «مريح» تلقائيًا */
export const WEIGHT_TOL = 0.08;

export function detectSteps(specs: readonly StepSpec[], snap: Snapshot): StepState[] {
  const items = snap.items;
  const byIng = (ing: string) => items.filter((i) => i.ingredient === ing);
  const tookG = (ing: string): number => snap.taken[ing] ?? 0;
  const served = snap.served.length > 0;
  return specs.map((sp) => {
    const missing: string[] = [];
    const accs: number[] = [];
    const nm = (k: string): string => INGREDIENT_BY_SLUG.get(k)?.name_ar ?? k;
    for (const m of sp.mentions) {
      const got = tookG(m.ingredient);
      const dev = Math.abs(got - m.grams) / m.grams;
      accs.push(Math.max(0, 1 - dev));
      if (got <= 0) missing.push(`لم تأخذ ${nm(m.ingredient)} بعد`);
      else if (dev > WEIGHT_TOL) missing.push(`وزن ${nm(m.ingredient)} ${Math.round(got)} غ والمطلوب ${m.grams} غ`);
    }
    const any = (pred: (i: (typeof items)[number]) => boolean, ing: string): boolean => byIng(ing).some(pred);
    const NOCUT = ['oil', 'cheese', 'oats', 'rice', 'toast', 'yogurt', 'honey', 'cumin', 'salt', 'milk'];
    const NOCOOK = ['oil', 'cheese', 'toast', 'cucumber', 'lemon', 'yogurt', 'honey', 'banana'];
    for (const m of sp.mentions) {
      const g = m.ingredient;
      switch (m.verb) {
        case 'boil':
          if (g === 'egg' || g === 'rice') {
            if (!any((i) => i.doneness >= 0.9, g)) missing.push(`لم ينضج ${nm(g)} بالسلق بعد`);
            if (g === 'egg' && /قشّر/.test(sp.text) && !any((i) => i.peeled, 'egg')) missing.push('لم يُقشَّر البيض');
            if (g === 'egg' && /قطّع/.test(sp.text) && !any((i) => i.cut !== null, 'egg')) missing.push('لم يُقطَّع البيض');
          }
          break;
        case 'whisk':
          if (!any((i) => i.whisked, g)) missing.push('لم يُخفَق البيض');
          break;
        case 'cut':
          if (!NOCUT.includes(g) && !any((i) => i.cut !== null, g)) missing.push(`لم يُقطَّع ${nm(g)}`);
          break;
        case 'grate':
          if (!any((i) => i.cut?.shape === 'grated', g)) missing.push(`لم يُبشَر ${nm(g)}`);
          break;
        case 'mash':
          if (!any((i) => i.mashed, g)) missing.push(`لم يُهرَس ${nm(g)}`);
          break;
        case 'toast':
          if (g === 'toast' && !any((i) => i.browning >= 0.2 || i.toast !== null, 'toast')) missing.push('لم يُحمَّص التوست');
          break;
        case 'juice':
          if (g === 'lemon' && !any((i) => i.juiced, 'lemon')) missing.push('لم يُعصَر الليمون');
          break;
        case 'salt_rest':
          if (!any((i) => i.rinsed, g)) missing.push(`لم تُشطف شرائح ${nm(g)} بعد الملح`);
          break;
        case 'cook': {
          if (NOCOOK.includes(g) || !INGREDIENT_BY_SLUG.has(g)) break;
          const its = byIng(g);
          const needsDone = g === 'chicken' || g === 'rice' || g === 'potato' || g === 'eggplant';
          if (its.length && !its.some((i) => i.tMax >= 55 && (needsDone ? i.doneness >= 0.9 : i.doneness >= 0.4 || i.browning >= 0.2 || i.tMax >= 80))) missing.push(`لم ينضج ${nm(g)}`);
          break;
        }
        default:
      }
    }
    if (sp.verbs.includes('serve') && !served) missing.push('لم تُقدَّم الوجبة');
    // الخطوة العامة بلا مواصفة قابلة للكشف («اخلط…»): تُعدّ منجزة إن اكتملت التي قبلها (تُحسم في الواجهة)
    return { done: missing.length === 0, missing: [...new Set(missing)], accuracy: accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : 1 };
  });
}
