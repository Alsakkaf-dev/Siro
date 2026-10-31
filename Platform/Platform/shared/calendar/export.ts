/**
 * تصدير الاقتراحات لراشد (CAL-42): (أ) JSON بنية صريحة يستهلكها راشد، (ب) نص عربي مختصر مرتّب. راشد هو الكاتب الوحيد في Outlook:
 * التصدير لا يكتب شيئًا، ولا يُنفَّذ إلا بـ«رن» منفصلة منك عند راشد (G-03).
 */
import { TZ } from './tz.js';
import type { EventFields, LintIssue, PropKind } from './lint.js';

export interface ExportItem {
  id: string; kind: PropKind; calendar: string; event_id: string | null; series: string | null;
  before: EventFields | null; after: EventFields | null; reason: string;
  exceptions: { date: string; note: string }[]; lint_warnings: LintIssue[]; created_at: string;
}
export const EXPORT_KIND = 'siro.calendar.proposals';
export const OP_AR: Record<PropKind, string> = { create: 'إنشاء', update: 'تعديل', delete: 'حذف' };

export function buildExportJson(items: readonly ExportItem[], now = new Date()): Record<string, unknown> {
  return {
    kind: EXPORT_KIND,
    version: 1,
    generated_at: now.toISOString(),
    timezone: TZ,
    writer: 'rashed',
    read_only_source: 'siro-platform',
    requires_separate_run: true,
    instructions_ar: 'اقتراحات تغيير على تقويم Outlook. لا شيء منها طُبّق. راشد وحده يكتب في Outlook وبعد «رن» منفصلة من محمد. بعد كل دفعة تُجرى ثلاثية التحقق (تداخلات/فجوات/أقصر من 20 دقيقة = 0) ثم يُوسَم كل اقتراح مطبّقًا في المنصة. السلاسل: أعد تطبيق استثناءاتها المرفقة بعد التعديل.',
    count: items.length,
    proposals: items.map((p, i) => ({ order: i + 1, ...p })),
  };
}

const t = (s: string): string => s.slice(11, 16);
const d = (s: string): string => s.slice(0, 10);
/** نص عربي مختصر قابل للنسخ يشرح التغييرات بالترتيب */
export function buildExportText(items: readonly ExportItem[]): string {
  const out: string[] = ['اقتراحات تغيير على Outlook (لم يُطبَّق شيء — تنفيذها بـ«رن» منفصلة عند راشد):'];
  items.forEach((p, i) => {
    const a = p.after;
    const b = p.before;
    const when = a ? `${d(a.start)} ${t(a.start)}–${t(a.end)}` : b ? `${d(b.start)} ${t(b.start)}–${t(b.end)}` : '';
    out.push('', `${i + 1}. ${OP_AR[p.kind]} «${(a ?? b)?.title ?? ''}» في تقويم «${p.calendar}» — ${when}`);
    out.push(`السبب: ${p.reason}`);
    if (p.kind === 'update' && a && b) {
      if (b.start !== a.start || b.end !== a.end) out.push(`الوقت: ${t(b.start)}–${t(b.end)} ← ${t(a.start)}–${t(a.end)}`);
      if (b.title !== a.title) out.push(`العنوان: ${b.title} ← ${a.title}`);
      if (b.description !== a.description) out.push('الوصف الجديد:', ...a.description.split('\n').map((l) => `  ${l}`));
    } else if (p.kind === 'create' && a) out.push('الوصف:', ...a.description.split('\n').map((l) => `  ${l}`));
    if (p.series) out.push(`سلسلة: ${p.series}${p.exceptions.length ? ` — أعد الاستثناءات: ${p.exceptions.map((e) => `${e.date} (${e.note})`).join('، ')}` : ''}`);
    for (const w of p.lint_warnings) out.push(`تنبيه: ${w.msg}`);
  });
  return out.join('\n');
}
