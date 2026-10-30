/**
 * خطة اليوم (خانة الجدول الأساسية، VS-1): ثلاث خانات، حصص مقسّمة، قانون السعرات حاجز صارم، ونص الوصف بالقالب 2.6.
 * نقية: يستعملها الخادم (الفرض) والواجهة (المعاينة). الثوابت من law.ts وحده.
 */
import { LAW, LAW_TARGET, SLOTS, evaluateDay, type LawResult, type Slot } from './law.js';
import { nutritionOf, sum, ZERO } from './nutrition.js';
import { outlookBody, scaleStepsText } from './outlook.js';
import { scaleDayFlexible, scaleLines } from './scaler.js';
import type { NutritionVector, RecipeLine } from './types.js';

export type SlotSource = 'codex' | 'creation' | 'manual';
export interface PlanCard { slug: string; title_ar: string; lines: readonly RecipeLine[]; steps: readonly string[]; flags: readonly string[]; status?: string; /** مصدر الخانة (CAL-52) */ source?: Exclude<SlotSource, 'manual'> }
/** CAL-52 manual: وجبة بأرقام يدوية بلا وصفة (لا ملاءمة تلقائية لها) */
export interface ManualMeal { title_ar: string; nutrition: NutritionVector }
export interface PlanSlotIn { card?: PlanCard; scale?: number; manual?: ManualMeal }
export interface PlanSlotOut { slot: Slot; card_slug: string; title_ar: string; scale: number; lines: RecipeLine[]; nutrition: NutritionVector; steps: string[]; body_text: string; unmapped: string[]; source: SlotSource }
export interface PlanResult {
  ok: boolean;
  complete: boolean;
  law: LawResult;
  slots: PlanSlotOut[];
  total: NutritionVector;
  /** رسالة الرفض بالعربية: المجموع والفرق */
  message: string | null;
  /** ثلاثة حلول عند الرفض */
  solutions: string[];
  /** معامل الملاءمة التلقائية إن طُلبت ونجحت */
  autoFit: { k: number; ks: number[]; uniform: boolean } | null;
  /** سبب تعذّر الملاءمة التلقائية إن طُلبت (AC-08: «غير ممكن» صريحة) */
  autoFitReason: string | null;
}

/** MC-05: بطاقات لا تُعيَّن في الجدول */
const BLOCK_FLAGS = ['unsafe_chicken', 'burnt', 'undercooked'];
export function blockedReason(c: Pick<PlanCard, 'status' | 'flags' | 'title_ar'>): string | null {
  if (c.status === 'needs_quantities') return `«${c.title_ar}» بلا أوزان (DEF-01) فلا تُعيَّن في الجدول`;
  if (c.status === 'proposed') return `«${c.title_ar}» مقترحة فقط ولم تُعتمد`;
  const f = c.flags.find((x) => BLOCK_FLAGS.includes(x));
  if (f) return `«${c.title_ar}» موسومة (${f === 'unsafe_chicken' ? 'دجاج غير ناضج' : f === 'burnt' ? 'محترقة' : 'نصف ناضجة'}) فلا تُعيَّن في الجدول`;
  return null;
}

const fmt = (n: number): string => String(Math.round(n));

export function lawMessage(law: LawResult): string | null {
  if (law.status === 'INVALID_HIGH') return `مجموع اليوم ${fmt(law.total_kcal)} سعرة، أعلى من الحد الأعلى ${LAW.MAX} بمقدار ${fmt(law.excess ?? 0)}.`;
  if (law.status === 'INVALID_LOW') return `مجموع اليوم ${fmt(law.total_kcal)} سعرة، أقل من الحد الأدنى ${LAW.MIN} بمقدار ${fmt(law.deficit ?? 0)}.`;
  return null;
}

/** ثلاثة حلول ملموسة (J7): تصغير/تكبير حصة، استبدال بطاقة، والملاءمة التلقائية */
export function lawSolutions(law: LawResult, slots: readonly Pick<PlanSlotOut, 'slot' | 'title_ar' | 'nutrition' | 'scale'>[]): string[] {
  if (!slots.length) return [];
  const high = law.status === 'INVALID_HIGH';
  const gap = high ? (law.excess ?? 0) : (law.deficit ?? 0);
  const pick = [...slots].sort((a, b) => (high ? b.nutrition.kcal - a.nutrition.kcal : a.nutrition.kcal - b.nutrition.kcal))[0]!;
  const kcal = pick.nutrition.kcal;
  const target = high ? Math.max(0, kcal - gap) : kcal + gap;
  const s = kcal > 0 ? Math.max(0.1, Math.round((pick.scale * target * 100) / kcal) / 100) : pick.scale;
  return [
    `${high ? 'صغّر' : 'كبّر'} حصة «${pick.title_ar}» (${pick.slot}) إلى ≈ ×${s}.`,
    `استبدل «${pick.title_ar}» ببطاقة ${high ? `أخف (أقل من ${fmt(target)} سعرة)` : `أكبر (نحو ${fmt(target)} سعرة)`}.`,
    `فعّل الملاءمة التلقائية لتوزيع ${fmt(gap)} سعرة على الوجبات الثلاث بمعامل واحد.`,
  ];
}

/** يبني اليوم: يقسّم الأوزان، يحسب التغذية، يقيّم القانون، ويولّد نص الوصف لكل خانة */
export function planDay(inputs: Partial<Record<Slot, PlanSlotIn>>, opts: { autoFit?: boolean } = {}): PlanResult {
  const filled = SLOTS.filter((s) => inputs[s]);
  const complete = filled.length === SLOTS.length;
  let autoFit: PlanResult['autoFit'] = null;
  let autoFitReason: string | null = null;
  const scaleOf: Partial<Record<Slot, number>> = {};
  for (const s of filled) scaleOf[s] = inputs[s]!.scale ?? 1;
  if (opts.autoFit) {
    if (!complete) autoFitReason = 'الملاءمة التلقائية تحتاج اليوم مكتملًا (الخانات الثلاث).';
    else if (filled.some((s) => inputs[s]!.manual)) autoFitReason = 'غير ممكن: بين الوجبات وجبة يدوية بأرقام ثابتة لا تُقسَّم.';
    else {
      const d = scaleDayFlexible(filled.map((s) => ({ slot: s, lines: inputs[s]!.card!.lines })));
      if (d.ok) {
        autoFit = { k: d.k, ks: d.ks, uniform: d.uniform };
        filled.forEach((s, i) => { scaleOf[s] = d.ks[i]!; });
      } else autoFitReason = d.reason ?? 'غير ممكن بالبطاقات المختارة.';
    }
  }
  const slots: PlanSlotOut[] = filled.map((slot) => {
    const inp = inputs[slot]!;
    if (inp.manual) {
      const n = inp.manual.nutrition;
      return { slot, card_slug: 'manual', title_ar: inp.manual.title_ar, scale: 1, lines: [], nutrition: n, steps: [], body_text: outlookBody(inp.manual.title_ar, [], n), unmapped: [], source: 'manual' };
    }
    const card = inp.card!;
    const k = scaleOf[slot]!;
    const lines = k === 1 ? card.lines.map((l) => ({ ...l })) : scaleLines(card.lines, k);
    const nutrition = nutritionOf(lines).total;
    const sc = k === 1 ? { steps: [...card.steps], unmapped: [] as string[] } : scaleStepsText(card.steps, card.lines, lines);
    return { slot, card_slug: card.slug, title_ar: card.title_ar, scale: k, lines, nutrition, steps: sc.steps, body_text: outlookBody(card.title_ar, sc.steps, nutrition), unmapped: sc.unmapped, source: card.source ?? 'codex' };
  });
  const law = evaluateDay(Object.fromEntries(slots.map((s) => [s.slot, s.nutrition])), SLOTS);
  const total = slots.length ? sum(slots.map((s) => s.nutrition)) : ZERO;
  const message = lawMessage(law);
  const extra = opts.autoFit && !autoFit && autoFitReason ? [autoFitReason] : [];
  return { ok: law.ok, complete, law, slots, total, message, solutions: law.ok ? [] : [...lawSolutions(law, slots), ...extra].slice(0, 3), autoFit, autoFitReason };
}
export { LAW_TARGET };
