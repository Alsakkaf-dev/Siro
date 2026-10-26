/** أسماء المفاتيح من docs/FIELD_LABELS_AR.json (ملف صغير حتى لا تجرّ صفحات الحياة بقية v8). */
/* ───── أسماء المفاتيح (docs/FIELD_LABELS_AR.json) ───── */
export interface FieldLabelsDoc { labels: Record<string, { label_ar: string; where_used?: string[] }>; missing_data_cards?: { key: string; label_ar: string; file?: string; path?: string }[] }
export function checkFieldLabels(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'المحتوى ليس كائنًا';
  const l = (d as Record<string, unknown>)['labels'];
  if (!l || typeof l !== 'object' || Array.isArray(l)) return 'labels يجب أن يكون كائنًا';
  for (const v of Object.values(l as Record<string, unknown>)) if (!v || typeof (v as { label_ar?: unknown }).label_ar !== 'string') return 'labels: كل مفتاح يحتاج label_ar';
  return null;
}
/** اسم عربي لمفتاح تقني: بطاقات البيانات الناقصة أولًا، ثم labels؛ وإلا null (لا نعرض المفتاح الإنجليزي). */
export function fieldLabel(doc: FieldLabelsDoc | null | undefined, key: string): string | null {
  return doc?.missing_data_cards?.find((c) => c.key === key)?.label_ar ?? doc?.labels?.[key]?.label_ar ?? null;
}

