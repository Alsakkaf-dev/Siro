/** مولّد عبارات الكميات بالعربية (S6): يطابق صياغة المالك في لوحته حرفًا بحرف. */

/**
 * الغرامات بحسب آخر خانتين: 1 «غرام واحد»، 2 «غرامان»، 3–10 «غرامات»، 11–99 «غراماً»،
 * والمئات التامة «غرام» (100 غرام، 300 غرام — كما في S2 وDEF-10).
 */
export function gramsAr(n: number): string {
  if (!Number.isInteger(n) || n < 0) return `${n} غرام`;
  if (n === 1) return 'غرام واحد';
  if (n === 2) return 'غرامان';
  const r = n % 100;
  if (r >= 3 && r <= 10) return `${n} غرامات`;
  if (r >= 11) return `${n} غراماً`;
  return `${n} غرام`; // 0 أو مئات تامة أو 101/102
}

const MIN_WORDS: Record<number, string> = { 3: 'ثلاث', 4: 'أربع', 5: 'خمس', 6: 'ست', 7: 'سبع', 8: 'ثماني', 9: 'تسع', 10: 'عشر' };

/** الدقائق: «دقيقة واحدة»، «دقيقتين»، 3–10 «دقائق» (بالحروف اختياريًا: «ثماني دقائق»)، 11+ «دقيقة». */
export function minutesAr(n: number, opts: { words?: boolean } = {}): string {
  if (!Number.isInteger(n) || n < 0) return `${n} دقيقة`;
  if (n === 1) return 'دقيقة واحدة';
  if (n === 2) return 'دقيقتين';
  const r = n % 100;
  if (r >= 3 && r <= 10) return `${opts.words && n <= 10 ? MIN_WORDS[n] : n} دقائق`;
  return `${n} دقيقة`;
}
