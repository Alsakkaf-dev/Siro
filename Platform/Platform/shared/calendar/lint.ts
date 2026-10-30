/**
 * فحص القوانين قبل الاقتراح (CAL-43): كل اقتراح يمرّ على CAL-10…19 ولا يُنشأ إن خالف أيًّا منها بالسبب.
 * القاعدة: المخالفة التي «يُدخلها» الاقتراح خطأ (الثلاثية بعده أسوأ منها قبله)؛ المخالفات القائمة في Outlook تُعرض تحذيرًا ولا تحجب (لا نتحمّل مسؤولية ما كُتب قبلنا).
 */
import { gramsAr } from '../kitchen/phrases.js';
import { DEFAULT_CAL_NAMES, MIN_EVENT_MIN, USED_CALENDARS, type CalEvent } from './types.js';
import { kindOf, titleText, verifyRange } from './laws.js';
import { mealSlotOf } from './meals.js';
import { dateOf, wallMin } from './tz.js';

export type PropKind = 'create' | 'update' | 'delete';
export interface EventFields { title: string; start: string; end: string; description: string; categories: string[]; show_as?: 'busy' | 'free' }
export interface ProposalDraft {
  kind: PropKind;
  calendar: string;
  event_id: string | null;
  series: string | null;
  before: EventFields | null;
  after: EventFields | null;
  reason: string;
  /** طلب صريح من المالك باسم الحدث لمسّ صلاة/محاضرة/امتحان (CAL-47) */
  explicit?: boolean;
  /** استثناءات السلسلة التي يجب إعادة تطبيقها بعد التعديل (CAL-48) */
  exceptions?: { date: string; note: string }[];
  /** إقرار بأن السلسلة بلا استثناءات */
  no_exceptions?: boolean;
}
export interface LintIssue { code: string; msg: string }
export interface Triple { overlaps: number; gaps: number; short: number }
export interface LintResult { ok: boolean; errors: LintIssue[]; warnings: LintIssue[]; before: Triple; after: Triple }

const tri = (v: ReturnType<typeof verifyRange>): Triple => ({ overlaps: v.overlaps.length, gaps: v.gaps.length, short: v.short.length });
const PROTECTED = /امتحان|اختبار|exam|الانتقال للجامعة|انتقال للجامعة/i;

/** CAL-44: قالب وصف الوجبة الحرفي (2.6) */
export function validateMealBody(desc: string): LintIssue[] {
  const out: LintIssue[] = [];
  const lines = desc.split('\n');
  const hi = lines.indexOf('القيمة الغذائية الإجمالية للوجبة:');
  if (!lines[0]?.trim()) out.push({ code: 'CAL-44', msg: 'سطر اسم الطبق مفقود' });
  if (hi < 1) return [...out, { code: 'CAL-44', msg: 'سطر «القيمة الغذائية الإجمالية للوجبة:» مفقود' }];
  lines.slice(1, hi).forEach((l, i) => { if (!new RegExp(`^${i + 1}: .+\\.$`).test(l)) out.push({ code: 'CAL-44', msg: `الخطوة ${i + 1} ليست بصيغة «${i + 1}: نص.»` }); });
  const tail = lines.slice(hi + 1);
  const want = [/^السعرات الحرارية: \d+ سعرة حرارية$/, /^البروتين: \d+ غرام$/, /^الكربوهيدرات: \d+ غرام$/, /^الدهون: \d+ غرام$/, /^الألياف: \d+ غرام$/];
  if (tail.length !== 5 || want.some((re, i) => !re.test(tail[i] ?? ''))) out.push({ code: 'CAL-44', msg: 'أسطر القيم الغذائية الخمسة ليست بالقالب (أعداد صحيحة بعد النقطتين)' });
  return out;
}

/** عيوب صياغة الغرام في نص (DEF-10/CAL-45): تعيد (قبل ← بعد) لكل عبارة مخالفة لقواعد S6 */
export function gramsIssues(text: string): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  // كمية مكوّن فقط («N غراماً من X»)؛ أسطر القيم الغذائية «البروتين: N غرام» قالب ثابت لا يخضع لقاعدة الغرام
  const re = /(\d+)\s*(غرامات|غرامان|غرامين|غراماً|غراما|غرام واحد|غرام)(?= من )/g;
  for (const m of text.matchAll(re)) {
    const n = Number(m[1]);
    const want = gramsAr(n);
    if (m[0] !== want && !(n === 2 && m[0] === '2 غرامين')) out.push({ from: m[0], to: want });
  }
  return out;
}
/** يصلح عبارات الغرام في نص (يُستعمل لتوليد اقتراحات الإصلاح فقط، لا يُطبَّق على Outlook) */
export function fixGramsText(text: string): { text: string; changes: { from: string; to: string }[] } {
  const changes = gramsIssues(text);
  return { text: text.replace(/(\d+)\s*(غرامات|غرامان|غرامين|غراماً|غراما|غرام واحد|غرام)(?= من )/g, (m, n: string) => { const w = gramsAr(Number(n)); if (m !== w) return w; return m; }), changes };
}

export function lintProposal(d: ProposalDraft, events: readonly CalEvent[]): LintResult {
  const errors: LintIssue[] = [];
  const warnings: LintIssue[] = [];
  const target = d.event_id ? events.find((e) => e.id === d.event_id) : undefined;
  const fields = d.after ?? d.before;
  if (!fields) errors.push({ code: 'shape', msg: 'اقتراح بلا قبل ولا بعد' });
  if (d.kind !== 'create' && !d.event_id) errors.push({ code: 'shape', msg: 'التعديل والحذف يحتاجان معرّف الحدث' });
  if (d.kind === 'create' && !d.after) errors.push({ code: 'shape', msg: 'الإنشاء يحتاج حقول «بعد»' });
  if (d.kind === 'delete' && !d.before) errors.push({ code: 'shape', msg: 'الحذف يحتاج حقول «قبل»' });
  // CAL-14: التقويم الافتراضي ممنوع، والتقاويم المستعملة محصورة
  if (DEFAULT_CAL_NAMES.includes(d.calendar)) errors.push({ code: 'CAL-14', msg: `ممنوع إنشاء أو تعديل أي شيء في التقويم الافتراضي «${d.calendar}»` });
  else if (d.kind !== 'delete' && !(USED_CALENDARS as readonly string[]).includes(d.calendar)) errors.push({ code: 'CAL-14', msg: `التقويم «${d.calendar}» ليس من التقاويم المستعملة (${USED_CALENDARS.join('، ')})` });
  // CAL-47: الصلوات والمحاضرات والامتحانات والانتقال للجامعة
  const probe = target ?? (d.before ? { title: d.before.title, calendar: d.calendar, categories: d.before.categories, show_as: d.before.show_as ?? 'busy' } : null);
  if (probe) {
    const k = kindOf(probe as Pick<CalEvent, 'title' | 'calendar' | 'categories' | 'show_as'>);
    if ((k === 'prayer' || k === 'lecture' || PROTECTED.test(probe.title)) && !d.explicit) errors.push({ code: 'CAL-47', msg: 'لا يُمسّ هذا الحدث (صلاة/محاضرة/امتحان/انتقال للجامعة) إلا بطلب صريح منك باسمه' });
  }
  if (d.after) {
    const a = d.after;
    if (!(wallMin(a.end) > wallMin(a.start))) errors.push({ code: 'time', msg: 'نهاية الحدث قبل بدايته' });
    else if (wallMin(a.end) - wallMin(a.start) < MIN_EVENT_MIN) errors.push({ code: 'CAL-12', msg: `ممنوع حدث أقصر من ${MIN_EVENT_MIN} دقيقة` });
    if (/[A-Za-z]/.test(a.description)) errors.push({ code: 'CAL-16', msg: 'الوصف عربي فقط (وُجدت أحرف لاتينية)' });
    if (/[٠-٩]/.test(a.description + a.title)) errors.push({ code: 'N-13', msg: 'أرقام 0-9 فقط (وُجدت أرقام هندية)' });
    const meal = mealSlotOf(a) || (target ? kindOf(target) === 'meal' : false);
    if (meal) errors.push(...validateMealBody(a.description));
    const g = gramsIssues(a.description);
    if (g.length) errors.push({ code: 'CAL-45', msg: `صياغة الغرام تخالف S6: ${g.slice(0, 3).map((x) => `«${x.from}» ← «${x.to}»`).join('، ')}` });
  }
  // CAL-48: تعديل وقت سلسلة يصفّر استثناءاتها: لا اقتراح بلا قائمة الاستثناءات أو إقرار بخلوّها
  const series = d.series ?? target?.series ?? null;
  if (series && d.kind === 'update' && d.before && d.after && (d.before.start.slice(11) !== d.after.start.slice(11) || d.before.end.slice(11) !== d.after.end.slice(11)) && !(d.exceptions?.length || d.no_exceptions)) {
    errors.push({ code: 'CAL-48', msg: 'تعديل وقت سلسلة متكررة يُصفّر استثناءاتها: أرفق قائمة الاستثناءات التي تُعاد، أو أقرّ بخلوّها' });
  }
  // CAL-10/11/13/18: الثلاثية قبل وبعد على الأيام التي يمسّها الاقتراح
  const dates = [...new Set([d.before?.start, d.before?.end, d.after?.start, d.after?.end].filter((x): x is string => !!x).map(dateOf))].sort();
  let before: Triple = { overlaps: 0, gaps: 0, short: 0 };
  let after: Triple = { overlaps: 0, gaps: 0, short: 0 };
  if (dates.length) {
    const from = dates[0]!;
    const to = dates[dates.length - 1]!;
    const base = events.filter((e) => !d.event_id || e.id !== d.event_id);
    const original = d.event_id ? events : base;
    const next: CalEvent[] = [...base];
    if (d.kind !== 'delete' && d.after) next.push({ id: d.event_id ?? 'proposed', source: 'import', calendar: d.calendar, title: d.after.title, start: d.after.start, end: d.after.end, show_as: d.after.show_as ?? 'busy', categories: d.after.categories, description: d.after.description, series });
    const vb = verifyRange(original, from, to);
    const va = verifyRange(next, from, to);
    before = tri(vb);
    after = tri(va);
    if (after.overlaps > before.overlaps) errors.push({ code: 'CAL-13', msg: `يُدخل ${after.overlaps - before.overlaps} تداخلًا جديدًا (ممنوع التداخل)` });
    if (after.gaps > before.gaps) errors.push({ code: 'CAL-11', msg: `يُدخل ${after.gaps - before.gaps} فجوة جديدة (≤19 دقيقة تُضاف للجار، ≥20 تُغطّى بحدث فراغ)` });
    if (after.short > before.short) errors.push({ code: 'CAL-12', msg: `يُدخل ${after.short - before.short} حدثًا أقصر من ${MIN_EVENT_MIN} دقيقة` });
    if (before.overlaps + before.gaps + before.short > 0) warnings.push({ code: 'CAL-18', msg: `المدى فيه مخالفات قائمة قبل الاقتراح (${before.overlaps}/${before.gaps}/${before.short}) لا يعالجها هذا الاقتراح` });
  }
  void titleText;
  return { ok: errors.length === 0, errors, warnings, before, after };
}
