/** سجل أدوات الذكاء — «DNA المنصة» كما يراها الموديل. المواصفات هنا (مشتركة: الواجهة + ai:eval)، والتنفيذ في web/src/ai/tools.ts.
 *  المستويات: read = فوري · write = معاينة/تراجع · danger = تأكيد صريح دائمًا · (الممنوع لا يُعرض أصلًا: الاستعادة، الاستيراد، الإعدادات، المفاتيح). */
import { z } from 'zod';
import type { AiToolSpec } from './ai.js';
import { normalizeText } from './text.js';

export type ToolTier = 'read' | 'write' | 'danger';
export type ToolLine = 'global' | 'academic' | 'library' | 'life' | 'sports' | 'spaces';

export interface ToolDef<S extends z.ZodType = z.ZodType> {
  name: string;
  line: ToolLine;
  tier: ToolTier;
  /** للموديل (إنجليزي: الموديلات الصغيرة تتبع التعليمات الإنجليزية أدق) */
  description: string;
  /** للواجهة */
  label: string;
  /** كلمات توجيه عربية/إنجليزية — لاختيار الأدوات للموديلات الصغيرة */
  keywords: string[];
  schema: S;
}

const s = z.string();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('YYYY-MM-DD');
const course = s.describe('Course id, code (e.g. "SWE3013") or name (Arabic or English)');
const space = s.describe('Space id or name');
const KINDS = ['quiz', 'test', 'lab', 'assignment', 'project', 'oral', 'final', 'other'] as const;
const FIELD_KINDS_AI = ['text', 'longtext', 'number', 'currency', 'date', 'select', 'multiselect', 'checkbox', 'rating', 'progress', 'url'] as const;

const assessmentFields = {
  kind: z.enum(KINDS),
  title: s.min(1).max(160),
  weight: z.number().min(0).max(100).optional().describe('Percent of course grade. OMIT if the user did not state it — never guess'),
  timing: z.enum(['unknown', 'week', 'date', 'exam']).optional().describe('week = week_no given, date = due_date given, exam = final exam period, unknown otherwise'),
  week_no: z.number().int().min(1).max(60).optional(),
  due_date: day.optional(),
  due_time: s.max(30).optional(),
  venue: s.max(120).optional(),
  note: s.max(1000).optional(),
};

export const TOOL_DEFS = [
  /* ───────── عام ───────── */
  { name: 'search', line: 'global', tier: 'read', label: 'بحث شامل', keywords: ['ابحث', 'وين', 'أين', 'search', 'find', 'دور'], description: 'Search everything in the platform (courses, assessments, notes, library files, videos, spaces, items, workouts, glossary). Use first when you need an id.', schema: z.object({ query: s.min(1).max(200) }) },
  { name: 'open_page', line: 'global', tier: 'read', label: 'فتح صفحة', keywords: ['افتح', 'روح', 'اذهب', 'open', 'go', 'صفحة'], description: 'Navigate the app to a page. Examples: "/", "/week", "/academic", "/courses/<id>", "/calculator", "/library", "/library/f/<id>", "/spaces", "/spaces/<id>", "/life", "/sports/mine", "/review", "/activity", "/inbox", "/trash", "/settings".', schema: z.object({ path: s.regex(/^\/[^\s]*$/).max(200) }) },
  { name: 'agenda', line: 'global', tier: 'read', label: 'الأجندة', keywords: ['اليوم', 'الأسبوع', 'موعد', 'مواعيد', 'متأخر', 'agenda', 'today', 'week', 'due', 'موجز', 'وش عندي', 'ماذا لدي'], description: 'Upcoming and overdue things across study, spaces and workouts for the next N days.', schema: z.object({ days: z.number().int().min(1).max(60).optional() }) },
  { name: 'recent_activity', line: 'global', tier: 'read', label: 'آخر التغييرات', keywords: ['سجل', 'تغير', 'آخر', 'history', 'activity', 'changed'], description: 'Recent changes log (who changed what).', schema: z.object({ limit: z.number().int().min(1).max(50).optional() }) },
  { name: 'backup_now', line: 'global', tier: 'write', label: 'نسخة احتياطية', keywords: ['نسخة', 'احتياطية', 'backup'], description: 'Create a database backup now.', schema: z.object({}) },

  /* ───────── الدراسة ───────── */
  { name: 'semester_overview', line: 'academic', tier: 'read', label: 'نظرة على الفصل', keywords: ['فصل', 'مواد', 'مادة', 'مقرر', 'semester', 'courses', 'دراسة'], description: 'Active semester (or given id): its courses with ids, codes, names, credits and assessment counts.', schema: z.object({ semester_id: s.optional() }) },
  { name: 'course_details', line: 'academic', tier: 'read', label: 'تفاصيل مادة', keywords: ['مادة', 'تقييم', 'اختبار', 'واجب', 'درجة', 'course', 'grade', 'كويز', 'مشروع'], description: 'One course: info, all assessments (id, kind, title, weight, timing, due, status, score) and notes, plus current grade summary.', schema: z.object({ course }) },
  { name: 'grade_needed', line: 'academic', tier: 'read', label: 'كم أحتاج', keywords: ['كم أحتاج', 'أحتاج', 'أنجح', 'هدف', 'need', 'pass', 'target', 'حاسبة', 'calculator', 'B+', 'A'], description: 'Calculator: what percent the user needs in the remaining assessments/final to reach a target total percent in a course.', schema: z.object({ course, target_percent: z.number().min(1).max(100) }) },
  { name: 'add_assessment', line: 'academic', tier: 'write', label: 'إضافة تقييم', keywords: ['أضف', 'اختبار', 'كويز', 'واجب', 'مشروع', 'نهائي', 'تقييم', 'add', 'quiz', 'test', 'assignment'], description: 'Add one assessment to a course. Leave unknown fields out (they become "unknown").', schema: z.object({ course, ...assessmentFields }) },
  { name: 'add_assessments_bulk', line: 'academic', tier: 'write', label: 'إضافة تقييمات دفعة', keywords: ['خطة', 'syllabus', 'تقييمات', 'جدول', 'استخرج', 'extract', 'كلها', 'paste'], description: 'Add many assessments to one course at once (e.g. extracted from a pasted syllabus/course plan).', schema: z.object({ course, items: z.array(z.object(assessmentFields)).min(1).max(40) }) },
  { name: 'update_assessment', line: 'academic', tier: 'write', label: 'تعديل تقييم', keywords: ['عدل', 'غير', 'درجة', 'علامة', 'سلمت', 'update', 'score', 'submitted', 'أجل'], description: 'Change fields of an assessment (by id). Use status "submitted"/"graded" and score+max_score to record marks.', schema: z.object({ id: s, title: s.max(160).optional(), weight: z.number().min(0).max(100).optional(), timing: z.enum(['unknown', 'week', 'date', 'exam']).optional(), week_no: z.number().int().min(1).max(60).optional(), due_date: day.optional(), due_time: s.max(30).optional(), venue: s.max(120).optional(), status: z.enum(['unknown', 'pending', 'submitted', 'graded']).optional(), score: z.number().min(0).optional(), max_score: z.number().positive().optional(), note: s.max(1000).optional() }) },
  { name: 'set_assessments_status', line: 'academic', tier: 'write', label: 'حالة تقييمات', keywords: ['سلمت', 'خلصت', 'انتهيت', 'submitted', 'done', 'حالة'], description: 'Set the status of several assessments at once.', schema: z.object({ ids: z.array(s).min(1).max(100), status: z.enum(['unknown', 'pending', 'submitted', 'graded']) }) },
  { name: 'delete_assessment', line: 'academic', tier: 'danger', label: 'حذف تقييم', keywords: ['احذف', 'امسح', 'delete', 'remove'], description: 'Delete an assessment (goes to trash, restorable 30 days).', schema: z.object({ id: s }) },
  { name: 'add_note', line: 'academic', tier: 'write', label: 'ملاحظة دراسية', keywords: ['ملاحظة', 'note', 'سؤال', 'غير معروف', 'تذكير'], description: 'Add a study note to the active semester (optionally tied to a course). tag "unk" = an open question/unknown to verify.', schema: z.object({ text: s.min(1).max(300), course: course.optional(), tag: z.enum(['note', 'unk']).optional(), detail: s.max(1000).optional() }) },

  /* ───────── مساحاتي ───────── */
  { name: 'list_spaces', line: 'spaces', tier: 'read', label: 'المساحات', keywords: ['مساحة', 'مساحات', 'قائمة', 'space', 'list', 'مشروع', 'مهام'], description: 'List user spaces (id, name, item counts, field names, statuses).', schema: z.object({}) },
  { name: 'space_items', line: 'spaces', tier: 'read', label: 'عناصر مساحة', keywords: ['عناصر', 'مهام', 'items', 'tasks'], description: 'Items of a space with status, dates and field values. Optional text filter.', schema: z.object({ space, query: s.max(100).optional(), limit: z.number().int().min(1).max(100).optional() }) },
  { name: 'add_item', line: 'spaces', tier: 'write', label: 'إضافة عنصر', keywords: ['أضف', 'مهمة', 'عنصر', 'add', 'task', 'item'], description: 'Add an item to a space. fields = object keyed by field name or id.', schema: z.object({ space, title: s.min(1).max(300), status: s.max(40).optional().describe('Status name or id'), due: day.optional(), start: day.optional(), fields: z.record(s, z.unknown()).optional() }) },
  { name: 'update_item', line: 'spaces', tier: 'write', label: 'تعديل عنصر', keywords: ['عدل', 'غير', 'انقل', 'خلصت', 'update', 'move', 'done'], description: 'Update an item (by id): title, status (name or id), dates, fields.', schema: z.object({ id: s, title: s.max(300).optional(), status: s.max(40).optional(), due: day.optional(), start: day.optional(), fields: z.record(s, z.unknown()).optional() }) },
  { name: 'delete_items', line: 'spaces', tier: 'danger', label: 'حذف عناصر', keywords: ['احذف', 'امسح', 'delete'], description: 'Delete items by id (trash, restorable).', schema: z.object({ ids: z.array(s).min(1).max(100) }) },
  { name: 'create_space', line: 'spaces', tier: 'write', label: 'إنشاء مساحة', keywords: ['أنشئ', 'مساحة', 'نظام', 'تتبع', 'create', 'tracker', 'space', 'قالب'], description: 'Create a new space. Either template_id (see list_templates) or a custom design: fields + statuses.', schema: z.object({ name: s.min(1).max(80), description: s.max(1000).optional(), template_id: s.optional(), icon: s.regex(/^[a-z0-9-]{1,30}$/).optional(), color: s.regex(/^#[0-9A-Fa-f]{6}$/).optional(), fields: z.array(z.object({ name: s.min(1).max(60), kind: z.enum(FIELD_KINDS_AI), options: z.array(s.max(60)).max(30).optional() })).max(30).optional(), statuses: z.array(z.object({ name: s.min(1).max(40), category: z.enum(['todo', 'active', 'done', 'blocked']) })).max(12).optional() }) },
  { name: 'list_templates', line: 'spaces', tier: 'read', label: 'القوالب', keywords: ['قالب', 'template', 'جاهز'], description: 'Available space templates (id, name, description).', schema: z.object({}) },
  { name: 'add_automation', line: 'spaces', tier: 'write', label: 'إضافة أتمتة', keywords: ['أتمتة', 'تلقائي', 'عندما', 'automation', 'when', 'rule', 'كل أسبوع', 'تكرار'], description: 'Add an automation rule to a space. trigger: item_created | status_changed(to) | field_changed(field) | due_soon(days). action: set_status(status) | set_field(field,value) | notify(text) | create_next(every: day|week|month) | archive.', schema: z.object({ space, name: s.min(1).max(80), trigger: z.object({ kind: z.enum(['item_created', 'status_changed', 'field_changed', 'due_soon']), to: s.max(40).optional(), field: s.max(60).optional(), days: z.number().int().min(0).max(60).optional() }), action: z.object({ kind: z.enum(['set_status', 'set_field', 'notify', 'create_next', 'archive']), status: s.max(40).optional(), field: s.max(60).optional(), value: z.unknown().optional(), text: s.max(200).optional(), every: z.enum(['day', 'week', 'month']).optional() }) }) },
  { name: 'link', line: 'spaces', tier: 'write', label: 'ربط', keywords: ['اربط', 'ربط', 'link', 'relate'], description: 'Link two things by ref (refs come from search: e.g. "wos:<id>", "acad:asmt:<id>", "lib:f:<id>").', schema: z.object({ src: s, dst: s, kind: z.enum(['relates', 'blocks', 'blocked_by', 'belongs_to', 'contains', 'derived_from', 'attachment_of']).optional() }) },

  /* ───────── المكتبة ───────── */
  { name: 'library_search', line: 'library', tier: 'read', label: 'بحث في المكتبة', keywords: ['ملف', 'ملفات', 'محاضرة', 'pdf', 'فيديو', 'مكتبة', 'library', 'file', 'slides'], description: 'Find library files/videos by text, tag or course code.', schema: z.object({ query: s.max(200).optional(), tag: s.max(60).optional(), course: s.max(40).optional(), limit: z.number().int().min(1).max(50).optional() }) },
  { name: 'library_read', line: 'library', tier: 'read', label: 'قراءة ملف', keywords: ['لخص', 'تلخيص', 'اقرأ', 'اشرح', 'summarize', 'read', 'explain', 'أسئلة', 'quiz me'], description: 'Read the text of a library file (ref "f:<id>"). Give a question to get the most relevant passages.', schema: z.object({ ref: s, question: s.max(300).optional() }) },
  { name: 'library_tag', line: 'library', tier: 'write', label: 'وسم ملفات', keywords: ['وسم', 'tag', 'صنف'], description: 'Add (or remove) a tag on library items.', schema: z.object({ refs: z.array(s).min(1).max(100), tag: s.min(1).max(60), remove: z.boolean().optional() }) },
  { name: 'add_youtube', line: 'library', tier: 'write', label: 'إضافة فيديو', keywords: ['يوتيوب', 'فيديو', 'youtube', 'video', 'رابط'], description: 'Add a YouTube link to the library (optionally tied to a course code).', schema: z.object({ url: s.url(), title: s.max(200).optional(), course: s.max(40).optional() }) },

  /* ───────── الحياة ───────── */
  { name: 'life_overview', line: 'life', tier: 'read', label: 'حالة الحياة', keywords: ['حياة', 'مال', 'صلاة', 'عادات', 'life', 'money', 'prayer', 'habits'], description: 'Status of Life data (exports from Rashed: freshness, files).', schema: z.object({}) },
  { name: 'life_log', line: 'life', tier: 'write', label: 'تسجيل في الحياة', keywords: ['صليت', 'صلاة', 'صرفت', 'مصروف', 'دفعت', 'عادة', 'انتكاسة', 'prayed', 'spent', 'habit', 'رنجت'], description: 'Draft a Life command for Rashed (he applies it). Types and payload: log_prayer{date,prayer:fajr|dhuhr|asr|maghrib|isha,status:in_time|late|missed,kind:fard|qada} · log_expense{date,amount,currency:"RM",box:treasury|monthly|daily|unknown,label_ar,category_ar,payment_source:rhb|tng|cash|unknown} · start_habit{habit:vape|tea_sugar|water|sleep|food|workout,start_date} · habit_relapse{habit,date}. Use "unknown" for unstated choices.', schema: z.object({ type: z.enum(['log_expense', 'log_prayer', 'start_habit', 'habit_relapse']), payload: z.record(s, z.unknown()) }) },

  /* ───────── الرياضة ───────── */
  { name: 'sports_week', line: 'sports', tier: 'read', label: 'أسبوعي الرياضي', keywords: ['تمرين', 'تمارين', 'رياضة', 'جيم', 'workout', 'gym', 'sport'], description: 'My workouts and which workout is assigned to each weekday.', schema: z.object({}) },
  { name: 'sports_set_day', line: 'sports', tier: 'write', label: 'تعيين يوم تمرين', keywords: ['تمرين', 'راحة', 'جيم', 'assign workout', 'rest day'], description: 'Assign a workout (name or id) to a weekday, or clear it (omit workout).', schema: z.object({ day: z.enum(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']), workout: s.optional() }) },
  { name: 'sports_create_workout', line: 'sports', tier: 'write', label: 'تمرين جديد', keywords: ['تمرين جديد', 'أنشئ تمرين', 'new workout'], description: 'Create a new (empty) workout with a name and note.', schema: z.object({ name: s.min(1).max(80), note: s.max(500).optional() }) },
] as const satisfies readonly ToolDef[];

export type ToolName = (typeof TOOL_DEFS)[number]['name'];
export type ToolArgs<N extends ToolName> = z.infer<Extract<(typeof TOOL_DEFS)[number], { name: N }>['schema']>;

export const TOOL_BY_NAME: ReadonlyMap<string, ToolDef> = new Map(TOOL_DEFS.map((t) => [t.name, t as ToolDef]));

export function specOf(t: ToolDef): AiToolSpec {
  const js = z.toJSONSchema(t.schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
  delete js['$schema'];
  const tag = t.tier === 'danger' ? ' [DESTRUCTIVE: needs user confirmation]' : t.tier === 'write' ? ' [changes data]' : '';
  return { name: t.name, description: t.description + tag, parameters: js };
}

const CORE: ToolName[] = ['search', 'open_page', 'agenda'];
const LINE_OF_PATH: [RegExp, ToolLine][] = [
  [/^\/(academic|courses|calculator|timeline|weights|unknowns|print|study)/, 'academic'],
  [/^\/library/, 'library'],
  [/^\/life/, 'life'],
  [/^\/sports/, 'sports'],
  [/^\/spaces/, 'spaces'],
];
export const lineOfPath = (path: string): ToolLine | null => LINE_OF_PATH.find(([re]) => re.test(path))?.[1] ?? null;

/** توجيه: للموديلات الصغيرة نرسل الأدوات الأقرب للطلب فقط (الأساسية + أعلى تطابق + خط الصفحة الحالية) */
export function routeTools(text: string, path: string, budget: number | null): ToolDef[] {
  if (budget === null) return TOOL_DEFS as unknown as ToolDef[];
  // تطبيع (تشكيل، همزات، ة/ه): «لخّص» تطابق «لخص»
  const t = normalizeText(text);
  const line = lineOfPath(path);
  const scored = (TOOL_DEFS as unknown as ToolDef[]).map((d) => {
    let sc = 0;
    for (const k of d.keywords) if (t.includes(normalizeText(k))) sc += k.length > 3 ? 3 : 2;
    if (line && d.line === line) sc += 1.5;
    if ((CORE as string[]).includes(d.name)) sc += 1;
    return { d, sc };
  });
  const lineHit = new Set(scored.filter((x) => x.sc >= 2 && x.d.line !== 'global').map((x) => x.d.line));
  // أداة واحدة من خط = نحتاج غالبًا أدوات القراءة من نفس الخط (لإيجاد المعرّفات)
  for (const x of scored) if (lineHit.has(x.d.line) && x.d.tier === 'read') x.sc += 1;
  const picked = scored.filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, budget).map((x) => x.d);
  for (const c of CORE) if (!picked.some((p) => p.name === c)) picked.push(TOOL_BY_NAME.get(c)!);
  return picked;
}
