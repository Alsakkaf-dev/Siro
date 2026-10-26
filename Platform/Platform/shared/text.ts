/** تطبيع نص للبحث: عربي/إنجليزي، بدون تشكيل، همزات موحّدة. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();
}
