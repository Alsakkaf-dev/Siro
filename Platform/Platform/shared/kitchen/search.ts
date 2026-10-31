/** البحث العربي (SRCH, 4.9): بلا اعتماد على التشكيل والهمزة والتاء المربوطة و«ال»، مع تسامح حرف واحد. */
import type { Ingredient } from './types.js';

export function normalizeAr(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[ً-ٰٟـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/^ال/, '') : w))
    .join(' ')
    .trim();
}

/** مسافة Damerau-Levenshtein (المحدودة OSA) */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[m]![n]!;
}

/** درجة تطابق نص مُطبَّع مع حقل: تام 4 > بادئة 3 > احتواء 2 > تقريبي 1 (SRCH-03) */
export function matchScore(nq: string, field: string): number {
  const f = normalizeAr(field);
  if (!nq || !f) return 0;
  if (f === nq) return 4;
  if (f.startsWith(nq) || f.split(' ').some((w) => w.startsWith(nq))) return 3;
  if (f.includes(nq)) return 2;
  if (nq.length >= 4 && f.split(' ').some((w) => editDistance(w, nq) <= 1)) return 1;
  return 0;
}

export interface Hit<T> { item: T; score: number }

/** SRCH-01: الاسم العربي، المرادفات، الملايو، الإنجليزي */
export function searchIngredients(q: string, list: readonly Ingredient[]): Hit<Ingredient>[] {
  const nq = normalizeAr(q);
  if (!nq) return list.map((item) => ({ item, score: 0 }));
  const out: Hit<Ingredient>[] = [];
  list.forEach((item) => {
    const score = Math.max(...[item.name_ar, item.name_ms, item.name_en, ...item.synonyms].map((f) => matchScore(nq, f)));
    if (score > 0) out.push({ item, score });
  });
  return out.sort((a, b) => b.score - a.score);
}
