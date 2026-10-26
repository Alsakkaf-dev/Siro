import type { Assessment } from './types.js';
import { GRADE_TARGETS } from './constants.js';

export interface TargetRow {
  target: number;
  mode: 'final' | 'rest' | 'done';
  /** النسبة المئوية المطلوبة من العلامة المتبقية (قد تتجاوز 100 = غير ممكن) */
  need: number;
  /** نفس الهدف لو وزّعنا المطلوب بالتساوي على كل المتبقي (معادلة الـ Blueprint) */
  needAvg: number | null;
  /** المطلوب بوحدة الدرجات (من وزن المتبقي) */
  marks: number;
  pool: number;
  state: 'sure' | 'impossible' | 'ok';
  minApplied: boolean;
}

export interface CourseCalc {
  weightTotal: number;
  graded: number;
  gradedWeight: number;
  /** current = Σ (score/max) × weight على المصحَّح */
  earned: number;
  /** maxPossible = current + Σ weight للبنود غير المصححة */
  maxPossible: number;
  lost: number;
  /** أداؤك في المصحَّح % */
  performance: number | null;
  remainingCA: number;
  finalWeight: number;
  hasFinal: boolean;
  weightOk: boolean;
  rows: TargetRow[];
}

export interface CalcOptions {
  /** افتراض أداء المستخدم (%) في الأعمال الفصلية غير المصححة عند وجود نهائي */
  assume?: number;
  minFinal?: number | null;
  targets?: readonly number[];
}

export type MarkOverride = { score: number | null; max?: number };

export function isGraded(a: Assessment, ov?: MarkOverride): boolean {
  const score = ov ? ov.score : a.score;
  const max = ov && ov.max !== undefined ? ov.max : a.max_score;
  return score !== null && score !== undefined && Number.isFinite(score) && max > 0 && score >= 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** حاسبة المادة. overrides = تجارب «ماذا لو» حسب id التقييم. */
export function calcCourse(items: Assessment[], opts: CalcOptions = {}, overrides: Record<string, MarkOverride> = {}): CourseCalc {
  const assume = opts.assume ?? 70;
  const targets = opts.targets ?? GRADE_TARGETS;
  let earned = 0;
  let gradedWeight = 0;
  let remainingCA = 0;
  let finalWeight = 0;
  let graded = 0;
  let weightTotal = 0;
  for (const a of items) {
    weightTotal += a.weight;
    const ov = overrides[a.id];
    if (isGraded(a, ov)) {
      const score = ov ? (ov.score as number) : (a.score as number);
      const max = ov && ov.max !== undefined ? ov.max : a.max_score;
      earned += (Math.min(score, max) / max) * a.weight;
      gradedWeight += a.weight;
      graded += 1;
    } else if (a.kind === 'final') {
      finalWeight += a.weight;
    } else {
      remainingCA += a.weight;
    }
  }
  const remaining = remainingCA + finalWeight;
  const maxPossible = earned + remaining;
  const rows: TargetRow[] = targets.map((target) => {
    const needAvg = remaining > 0 ? ((target - earned) / remaining) * 100 : null;
    let mode: TargetRow['mode'];
    let need: number;
    let pool: number;
    let minApplied = false;
    if (finalWeight > 0) {
      mode = 'final';
      pool = finalWeight;
      const expected = earned + (remainingCA * assume) / 100;
      need = ((target - expected) / finalWeight) * 100;
      if (opts.minFinal !== null && opts.minFinal !== undefined && need < opts.minFinal) {
        need = opts.minFinal;
        minApplied = true;
      }
    } else if (remainingCA > 0) {
      mode = 'rest';
      pool = remainingCA;
      need = ((target - earned) / remainingCA) * 100;
    } else {
      mode = 'done';
      pool = 0;
      need = earned >= target ? 0 : Number.POSITIVE_INFINITY;
    }
    const state: TargetRow['state'] = need > 100 ? 'impossible' : need <= 0 ? 'sure' : 'ok';
    return {
      target,
      mode,
      need: Number.isFinite(need) ? round2(need) : need,
      needAvg: needAvg === null ? null : round2(needAvg),
      marks: Number.isFinite(need) ? round2(Math.max(0, need / 100) * pool) : 0,
      pool: round2(pool),
      state,
      minApplied,
    };
  });
  return {
    weightTotal: round2(weightTotal),
    graded,
    gradedWeight: round2(gradedWeight),
    earned: round2(earned),
    maxPossible: round2(maxPossible),
    lost: round2(gradedWeight - earned),
    performance: gradedWeight > 0 ? round2((earned / gradedWeight) * 100) : null,
    remainingCA: round2(remainingCA),
    finalWeight: round2(finalWeight),
    hasFinal: finalWeight > 0 || items.some((a) => a.kind === 'final'),
    weightOk: Math.abs(weightTotal - 100) < 0.005,
    rows,
  };
}
