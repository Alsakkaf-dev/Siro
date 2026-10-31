/** تنسيق الأرقام والعملة — أرقام 0-9 دائمًا (I18N-02، N-13). كل عرض رقمي في المطبخ يمر من هنا. */
const cache = new Map<string, Intl.NumberFormat>();
const nf = (min: number, max: number, group: boolean): Intl.NumberFormat => {
  const k = `${min}:${max}:${group}`;
  let f = cache.get(k);
  if (!f) cache.set(k, (f = new Intl.NumberFormat('ar-u-nu-latn', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: group })));
  return f;
};
const clean = (s: string): string => s.replace(/[‎‏؜]/g, '');

/** عدد بخانات عشرية حتى digits (بلا أصفار زائدة) */
export function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return clean(nf(0, digits, false).format(n));
}
/** سعرات: عدد صحيح (NUT-04) */
export const fmtKcal = (n: number): string => fmtNum(Math.round(n), 0);
/** مبلغ بالرينغيت بخانتين (I18N-03، WAL-05) */
export function fmtRM(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `RM ${clean(nf(2, 2, true).format(n))}`;
}
