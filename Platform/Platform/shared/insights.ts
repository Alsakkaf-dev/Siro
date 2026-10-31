import { tagFrom, type Tag } from './weekly.js';
import type { Indicator } from './v8.js';

/** قيمة المؤشر كما كتبها النظام: النص الجاهز أولًا؛ إن غاب نعرض missing_text_ar، ولا نحسب شيئًا. */
export function indicatorView(i: Indicator): { text: string | null; tag: Tag; missing: string | null } {
  const text = typeof i.value_text_ar === 'string' && i.value_text_ar.trim() ? i.value_text_ar : null;
  const missing = typeof i.missing_text_ar === 'string' && i.missing_text_ar.trim() ? i.missing_text_ar : null;
  if (text && i.current_value !== null && i.current_value !== undefined) return { text, tag: tagFrom(i.confidence), missing: null };
  return { text: null, tag: 'غير مسجل', missing: missing ?? 'غير مسجل: لم يُرسل النظام قيمة لهذا المؤشر.' };
}
