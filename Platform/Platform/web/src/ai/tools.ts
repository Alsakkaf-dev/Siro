/** تنفيذ أدوات الذكاء — كلها عبر نفس عملاء الواجهة (api / wos / lib / life / sports):
 *  نفس التحقق، نفس السجل (موسوم «ai»)، نفس السلة الدائمة. لكل كتابة طريقة تراجع (UndoOp). */
import { api, lib, life, sports } from '../lib/api.js';
import { wos, type Space } from '../lib/wos.js';
import { normalizeText } from '../../../shared/text.js';
import { calcCourse } from '../../../shared/calc.js';
import { KIND_LABEL, STATUS_LABEL } from '../../../shared/constants.js';
import { slugId, typeSchema, type FieldDef, type StatusDef } from '../../../shared/wos.js';
import { validatePayload, type CommandType } from '../../../shared/life.js';
import { WEEKDAY_AR, type Weekday } from '../../../shared/sports.js';
import type { UndoOp } from '../../../shared/ai.js';
import type { ToolArgs, ToolName } from '../../../shared/aiTools.js';
import type { Course, SemesterBundle } from '../../../shared/types.js';

export interface ToolCtx {
  nav: (path: string) => void;
  activeSemesterId: string | null;
  today: string;
}
export interface ToolResult { data: unknown; summary: string; undo?: UndoOp | null; refresh?: ('semesters' | 'spaces')[] }
/** خطأ موجّه للموديل (يُعاد له ليصحح) */
export class ToolError extends Error {}

type Impl<N extends ToolName> = { run: (a: ToolArgs<N>, c: ToolCtx) => Promise<ToolResult>; preview?: (a: ToolArgs<N>, c: ToolCtx) => Promise<string> | string };

/* ───── مساعدات ───── */
const norm = (s: string | null | undefined): string => normalizeText(s ?? '');
const pick = <T extends object>(o: T, keys: (keyof T)[]): Partial<T> => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== null).map((k) => [k, o[k]])) as Partial<T>;

const bundleCache = new Map<string, { at: number; b: SemesterBundle }>();
async function bundle(c: ToolCtx, semId?: string): Promise<SemesterBundle> {
  const id = semId ?? c.activeSemesterId;
  if (!id) throw new ToolError('No semester exists yet. Ask the user to create or import one (page /academic).');
  const hit = bundleCache.get(id);
  if (hit && Date.now() - hit.at < 4000) return hit.b;
  const b = await api.bundle(id);
  bundleCache.set(id, { at: Date.now(), b });
  return b;
}
const invalidate = (): void => bundleCache.clear();

function matchCourse(courses: Course[], q: string): Course {
  const nq = norm(q);
  const exact = courses.find((c) => c.id === q || norm(c.code) === nq);
  if (exact) return exact;
  const hits = courses.filter((c) => [c.code, c.name, c.name_ar].some((x) => x && (norm(x).includes(nq) || nq.includes(norm(x)))));
  if (hits.length === 1) return hits[0]!;
  // تطابق كلمات: «الشبكات» ↔ «شبكات الحاسوب»
  const words = nq.split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/^ال/, ''));
  const byWord = courses.filter((c) => words.some((w) => [c.name, c.name_ar].some((x) => x && norm(x).includes(w))));
  if (byWord.length === 1) return byWord[0]!;
  const list = (hits.length ? hits : byWord.length ? byWord : courses).map((c) => `${c.id} = ${c.code} ${c.name}${c.name_ar ? ` (${c.name_ar})` : ''}`).join('; ');
  throw new ToolError(`Course "${q}" is ${hits.length || byWord.length ? 'ambiguous' : 'not found'}. Candidates: ${list}. Call again with the course id.`);
}
async function findCourse(c: ToolCtx, q: string): Promise<{ course: Course; b: SemesterBundle }> {
  const b = await bundle(c);
  return { course: matchCourse(b.courses, q), b };
}

let spacesCache: { at: number; v: Space[] } | null = null;
async function spaces(): Promise<Space[]> {
  if (spacesCache && Date.now() - spacesCache.at < 4000) return spacesCache.v;
  const v = await wos.spaces();
  spacesCache = { at: Date.now(), v };
  return v;
}
async function findSpace(q: string): Promise<Space> {
  const all = await spaces();
  const nq = norm(q);
  const s = all.find((x) => x.id === q) ?? all.find((x) => norm(x.name) === nq) ?? (all.filter((x) => norm(x.name).includes(nq)).length === 1 ? all.find((x) => norm(x.name).includes(nq)) : undefined);
  if (!s) throw new ToolError(`Space "${q}" not found. Spaces: ${all.map((x) => `${x.id} = ${x.name}`).join('; ') || 'none'}.`);
  return s;
}
function statusId(statuses: StatusDef[], q: string | undefined): string | undefined {
  if (q === undefined) return undefined;
  const nq = norm(q);
  const s = statuses.find((x) => x.id === q) ?? statuses.find((x) => norm(x.name) === nq) ?? statuses.find((x) => norm(x.name).includes(nq)) ?? statuses.find((x) => x.category === (/(done|منجز|خلص|انته)/.test(nq) ? 'done' : /(doing|active|قيد|جار)/.test(nq) ? 'active' : '_'));
  if (!s) throw new ToolError(`Unknown status "${q}". Valid: ${statuses.map((x) => `${x.id} (${x.name})`).join(', ')}`);
  return s.id;
}
function fieldsToData(fields: FieldDef[], input: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!input) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    const nk = norm(k);
    const f = fields.find((x) => x.id === k) ?? fields.find((x) => norm(x.name) === nk) ?? fields.find((x) => norm(x.name).includes(nk));
    if (!f) throw new ToolError(`Unknown field "${k}". Fields: ${fields.map((x) => `${x.id} (${x.name}, ${x.kind})`).join(', ')}`);
    if ((f.kind === 'select' || f.kind === 'multiselect') && f.options) {
      const one = (val: unknown): unknown => f.options!.find((o) => o.id === val || norm(o.name) === norm(String(val)))?.id ?? val;
      out[f.id] = Array.isArray(v) ? v.map(one) : one(v);
    } else out[f.id] = v;
  }
  return out;
}
const asmtLine = (a: SemesterBundle['assessments'][number]): string =>
  `${a.id} | ${KIND_LABEL[a.kind]} «${a.title}» | weight ${a.weight}%${a.weight_assumed ? ' (assumed)' : ''} | ${a.timing === 'date' ? a.due_date : a.timing === 'week' ? `week ${a.week_no}` : a.timing === 'exam' ? 'exam period' : 'date unknown'}${a.due_time ? ` ${a.due_time}` : ''} | ${a.status}${a.score !== null ? ` | ${a.score}/${a.max_score}` : ''}`;

function timingOf(a: { timing?: string | undefined; due_date?: string | undefined; week_no?: number | undefined }): 'unknown' | 'week' | 'date' | 'exam' {
  if (a.timing) return a.timing as 'unknown';
  if (a.due_date) return 'date';
  if (a.week_no) return 'week';
  return 'unknown';
}
function assessmentBody(a: ToolArgs<'add_assessment'> | ToolArgs<'add_assessments_bulk'>['items'][number]): Record<string, unknown> {
  // «لا تخمين»: وزن غير مذكور = 0 موسوم «مفترض» ويظهر في صفحة غير المعروف
  const known = typeof a.weight === 'number';
  return {
    kind: a.kind,
    title: a.title,
    weight: known ? a.weight : 0,
    weight_assumed: !known,
    timing: timingOf(a),
    week_no: a.week_no ?? null,
    due_date: a.due_date ?? null,
    due_time: a.due_time ?? null,
    venue: a.venue ?? null,
    note: a.note ?? (known ? null : 'الوزن غير معروف — أُضيف بواسطة الذكاء'),
    status: 'pending',
  };
}
const multi = (ops: UndoOp[]): UndoOp | null => (ops.length === 0 ? null : ops.length === 1 ? ops[0]! : { kind: 'call', entity: 'multi', op: 'all', id: '-', body: ops });

/* ───── التنفيذ ───── */
export const TOOL_IMPLS: { [N in ToolName]: Impl<N> } = {
  search: {
    async run(a) {
      const [hits, more] = await Promise.all([api.search(a.query), api.searchMore(a.query).catch(() => [])]);
      const data = [
        ...hits.slice(0, 12).map((h) => ({ type: h.type, id: h.id, course_id: h.course_id, title: h.title, sub: h.subtitle, ref: h.type === 'assessment' ? `acad:asmt:${h.id}` : `acad:course:${h.id}`, open: `/courses/${h.course_id}` })),
        ...more.slice(0, 12).map((h) => ({ type: h.kind, id: h.id, title: h.title, sub: h.subtitle, to: h.to })),
      ];
      return { data: data.length ? data : 'No results', summary: `بحث «${a.query}»: ${data.length} نتيجة` };
    },
  },
  open_page: {
    async run(a, c) {
      c.nav(a.path);
      return { data: `Opened ${a.path}`, summary: `فُتحت الصفحة ${a.path}` };
    },
  },
  agenda: {
    async run(a, c) {
      const to = new Date(Date.parse(c.today) + (a.days ?? 7) * 86_400_000).toISOString().slice(0, 10);
      const g = await wos.agenda(c.today, to);
      const row = (e: (typeof g.range)[number]): string => `${e.date ?? 'no date'}${e.approx ? '~' : ''} | ${e.kind} | ${e.title}${e.subtitle ? ` (${e.subtitle})` : ''}${e.weight ? ` | ${e.weight}%` : ''}${e.done ? ' | done' : ''} | ref ${e.ref}`;
      return { data: { today: g.today, overdue: g.overdue.map(row), upcoming: g.range.map(row), undated: g.undated }, summary: `الأجندة: ${g.overdue.length} متأخر · ${g.range.length} قادم` };
    },
  },
  recent_activity: {
    async run(a) {
      const h = await wos.history({ limit: a.limit ?? 15 });
      return { data: h.map((x) => `${x.at.slice(0, 16)} | ${x.actor} | ${x.summary}`), summary: `آخر ${h.length} تغيير` };
    },
  },
  backup_now: {
    async run() {
      const b = await api.backupNow();
      return { data: { name: b.name }, summary: `نسخة احتياطية: ${b.name}` };
    },
    preview: () => 'إنشاء نسخة احتياطية الآن',
  },

  semester_overview: {
    async run(a, c) {
      const b = await bundle(c, a.semester_id);
      const data = {
        semester: { id: b.semester.id, code: b.semester.code, name: b.semester.name, start: b.semester.start_date, weeks: b.semester.weeks, exams: [b.semester.exam_start, b.semester.exam_end], active: b.is_active },
        courses: b.courses.map((x) => ({ id: x.id, code: x.code, name: x.name, name_ar: x.name_ar, credits: x.credits, assessments: b.assessments.filter((y) => y.course_id === x.id).length })),
        open_unknowns: b.notes.filter((n) => n.tag === 'unk' && !n.resolved).length,
      };
      return { data, summary: `الفصل ${b.semester.code}: ${b.courses.length} مواد` };
    },
  },
  course_details: {
    async run(a, c) {
      const { course: x, b } = await findCourse(c, a.course);
      const items = b.assessments.filter((y) => y.course_id === x.id);
      const calc = calcCourse(items, { minFinal: x.min_final });
      return {
        data: {
          course: pick(x, ['id', 'code', 'name', 'name_ar', 'credits', 'lecturer', 'room', 'schedule', 'min_final']),
          assessments: items.map(asmtLine),
          notes: b.notes.filter((n) => n.course_id === x.id).map((n) => `${n.id} | ${n.tag}${n.resolved ? ' (resolved)' : ''} | ${n.text}`),
          grade: { earned: calc.earned, max_possible: calc.maxPossible, lost: calc.lost, performance_percent: calc.performance, weight_total: calc.weightTotal, weights_ok: calc.weightOk },
        },
        summary: `مادة ${x.code}: ${items.length} تقييم`,
      };
    },
  },
  grade_needed: {
    async run(a, c) {
      const { course: x, b } = await findCourse(c, a.course);
      const items = b.assessments.filter((y) => y.course_id === x.id);
      const calc = calcCourse(items, { minFinal: x.min_final, targets: [a.target_percent] });
      const r = calc.rows[0];
      return {
        data: { course: x.code, target: a.target_percent, earned_so_far: calc.earned, max_possible: calc.maxPossible, need_percent_of_remaining: r?.need, need_marks: r?.marks, remaining_weight: r?.pool, state: r?.state, mode: r?.mode, weights_ok: calc.weightOk, note: 'state: sure = already secured, impossible = cannot reach' },
        summary: `${x.code}: لهدف ${a.target_percent}% تحتاج ${r ? `${r.need}%` : '؟'}`,
      };
    },
  },
  add_assessment: {
    async preview(a, c) {
      const { course } = await findCourse(c, a.course);
      return `إضافة ${KIND_LABEL[a.kind]} «${a.title}» إلى ${course.code} · ${typeof a.weight === 'number' ? `وزن ${a.weight}%` : 'الوزن غير معروف'} · ${a.due_date ?? (a.week_no ? `الأسبوع ${a.week_no}` : 'الموعد غير معروف')}`;
    },
    async run(a, c) {
      const { course } = await findCourse(c, a.course);
      const r = await api.addAssessment(course.id, assessmentBody(a));
      invalidate();
      return { data: { id: r.id, ok: true }, summary: `أُضيف «${r.title}» إلى ${course.code}`, undo: { kind: 'call', entity: 'assessment', op: 'delete', id: r.id }, refresh: ['semesters'] };
    },
  },
  add_assessments_bulk: {
    async preview(a, c) {
      const { course } = await findCourse(c, a.course);
      return `إضافة ${a.items.length} تقييمات إلى ${course.code}:\n${a.items.map((i) => `• ${KIND_LABEL[i.kind]} «${i.title}» · ${typeof i.weight === 'number' ? `${i.weight}%` : 'وزن غير معروف'} · ${i.due_date ?? (i.week_no ? `أسبوع ${i.week_no}` : 'موعد غير معروف')}`).join('\n')}`;
    },
    async run(a, c) {
      const { course } = await findCourse(c, a.course);
      const done: string[] = [];
      const errors: string[] = [];
      for (const it of a.items) {
        try {
          done.push((await api.addAssessment(course.id, assessmentBody(it))).id);
        } catch (e) {
          errors.push(`«${it.title}»: ${(e as Error).message}`);
        }
      }
      invalidate();
      return { data: { added: done.length, errors }, summary: `أُضيف ${done.length} تقييم إلى ${course.code}${errors.length ? ` · فشل ${errors.length}` : ''}`, undo: multi(done.map((id) => ({ kind: 'call', entity: 'assessment', op: 'delete', id }))), refresh: ['semesters'] };
    },
  },
  update_assessment: {
    async preview(a, c) {
      const b = await bundle(c);
      const cur = b.assessments.find((x) => x.id === a.id);
      const { id: _id, ...rest } = a;
      return `تعديل «${cur?.title ?? a.id}»: ${Object.entries(rest).map(([k, v]) => `${k} ← ${String(v)}`).join('، ')}`;
    },
    async run(a, c) {
      const b = await bundle(c);
      const cur = b.assessments.find((x) => x.id === a.id);
      if (!cur) throw new ToolError(`Assessment ${a.id} not found in the active semester. Use course_details to get ids.`);
      const { id, ...patch } = a;
      const body: Record<string, unknown> = { ...patch };
      if (patch.due_date && !patch.timing) body['timing'] = 'date';
      if (patch.week_no && !patch.timing) body['timing'] = 'week';
      if (patch.weight !== undefined) body['weight_assumed'] = false;
      const before = pick(cur, Object.keys(body) as (keyof typeof cur)[]);
      const r = await api.editAssessment(id, body);
      invalidate();
      return { data: { ok: true, now: asmtLine(r) }, summary: `عُدّل «${r.title}»`, undo: { kind: 'call', entity: 'assessment', op: 'patch', id, body: { ...before, timing: cur.timing, week_no: cur.week_no, due_date: cur.due_date, weight_assumed: cur.weight_assumed } }, refresh: ['semesters'] };
    },
  },
  set_assessments_status: {
    preview: (a) => `تغيير حالة ${a.ids.length} تقييم إلى «${STATUS_LABEL[a.status]}»`,
    async run(a, c) {
      const b = await bundle(c);
      const prev = a.ids.map((id) => b.assessments.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
      if (!prev.length) throw new ToolError('None of these ids exist in the active semester.');
      const r = await api.bulkAssessments(prev.map((x) => x.id), 'status', a.status);
      invalidate();
      return { data: { updated: r.count }, summary: `${r.count} تقييم ← ${STATUS_LABEL[a.status]}`, undo: multi(prev.map((x) => ({ kind: 'call', entity: 'assessment', op: 'patch', id: x.id, body: { status: x.status } }))), refresh: ['semesters'] };
    },
  },
  delete_assessment: {
    async preview(a, c) {
      const cur = (await bundle(c)).assessments.find((x) => x.id === a.id);
      return `حذف التقييم «${cur?.title ?? a.id}» (يذهب إلى السلة 30 يومًا)`;
    },
    async run(a) {
      const r = await api.delAssessment(a.id);
      invalidate();
      return { data: { ok: true }, summary: 'حُذف التقييم (في السلة)', undo: { kind: 'trash', token: r.undo }, refresh: ['semesters'] };
    },
  },
  add_note: {
    preview: (a) => `ملاحظة${a.tag === 'unk' ? ' (سؤال مفتوح)' : ''}: «${a.text}»${a.course ? ` · ${a.course}` : ''}`,
    async run(a, c) {
      const b = await bundle(c);
      const course = a.course ? matchCourse(b.courses, a.course) : null;
      const r = await api.addNote(b.semester.id, { text: a.text, tag: a.tag ?? 'note', course_id: course?.id ?? null, detail: a.detail ?? null });
      invalidate();
      return { data: { id: r.id }, summary: `أُضيفت ملاحظة${course ? ` لـ ${course.code}` : ''}`, undo: { kind: 'call', entity: 'note', op: 'delete', id: r.id }, refresh: ['semesters'] };
    },
  },

  list_spaces: {
    async run() {
      const all = await spaces();
      return { data: all.map((s) => ({ id: s.id, name: s.name, items: s.item_count ?? null, done: s.done_count ?? null, fields: s.type.fields.map((f) => `${f.name} (${f.kind})`), statuses: s.type.statuses.map((x) => x.name) })), summary: `${all.length} مساحة` };
    },
  },
  space_items: {
    async run(a) {
      const sp = await findSpace(a.space);
      const full = await wos.space(sp.id);
      const st = new Map(sp.type.statuses.map((s) => [s.id, s.name]));
      const fname = new Map(sp.type.fields.map((f) => [f.id, f.name]));
      const nq = a.query ? norm(a.query) : '';
      const items = full.items.filter((i) => !nq || norm(i.title).includes(nq)).slice(0, a.limit ?? 40);
      return {
        data: { space: { id: sp.id, name: sp.name }, total: full.items.length, items: items.map((i) => ({ id: i.id, title: i.title, status: i.status ? st.get(i.status) ?? i.status : null, due: i.due, start: i.start, fields: Object.fromEntries(Object.entries(i.data).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [fname.get(k) ?? k, v])) })) },
        summary: `«${sp.name}»: ${items.length} عنصر`,
      };
    },
  },
  add_item: {
    async preview(a) {
      const sp = await findSpace(a.space);
      return `إضافة «${a.title}» إلى «${sp.name}»${a.status ? ` · ${a.status}` : ''}${a.due ? ` · موعد ${a.due}` : ''}`;
    },
    async run(a) {
      const sp = await findSpace(a.space);
      const data = fieldsToData(sp.type.fields, a.fields);
      const status = statusId(sp.type.statuses, a.status);
      const r = await wos.addItem(sp.id, { title: a.title, ...(status ? { status } : {}), ...(a.due ? { due: a.due } : {}), ...(a.start ? { start: a.start } : {}), ...(data ? { data } : {}) });
      spacesCache = null;
      return { data: { id: r.id, ref: `wos:${r.id}` }, summary: `أُضيف «${r.title}» إلى «${sp.name}»`, undo: { kind: 'call', entity: 'item', op: 'delete', id: r.id }, refresh: ['spaces'] };
    },
  },
  update_item: {
    preview: (a) => `تعديل العنصر ${a.title ? `«${a.title}»` : a.id}${a.status ? ` · الحالة ← ${a.status}` : ''}${a.due ? ` · موعد ${a.due}` : ''}`,
    async run(a) {
      const full = await wos.item(a.id).catch(() => {
        throw new ToolError(`Item ${a.id} not found. Use space_items or search to get ids.`);
      });
      const t = full.space.type;
      const data = fieldsToData(t.fields, a.fields);
      const status = statusId(t.statuses, a.status);
      const r = await wos.editItem(a.id, { ...(a.title ? { title: a.title } : {}), ...(status ? { status } : {}), ...(a.due ? { due: a.due } : {}), ...(a.start ? { start: a.start } : {}), ...(data ? { data } : {}) });
      const h = (await wos.history({ ref: `wos:${a.id}`, limit: 1 }))[0];
      return { data: { ok: true, status: r.status, title: r.title }, summary: `عُدّل «${r.title}»`, undo: h?.revertible ? { kind: 'revert', history_id: h.id } : null, refresh: ['spaces'] };
    },
  },
  delete_items: {
    preview: (a) => `حذف ${a.ids.length} عنصر (مع فروعها) — يذهب إلى السلة`,
    async run(a) {
      const r = await wos.bulk(a.ids, 'delete');
      spacesCache = null;
      return { data: { deleted: r.count }, summary: `حُذف ${r.count} عنصر (في السلة)`, undo: r.undo ? { kind: 'trash', token: r.undo } : null, refresh: ['spaces'] };
    },
  },
  create_space: {
    preview: (a) => `إنشاء مساحة «${a.name}»${a.template_id ? ` من القالب ${a.template_id}` : ''}${a.fields?.length ? `\nالحقول: ${a.fields.map((f) => `${f.name} (${f.kind})`).join('، ')}` : ''}${a.statuses?.length ? `\nالحالات: ${a.statuses.map((s) => s.name).join(' ← ')}` : ''}`,
    async run(a) {
      let type: unknown;
      if (!a.template_id && (a.fields?.length || a.statuses?.length)) {
        const taken: string[] = [];
        const fields = (a.fields ?? []).map((f) => {
          const id = slugId(f.name, taken);
          taken.push(id);
          const oTaken: string[] = [];
          return { id, name: f.name, kind: f.kind, ...(f.options?.length ? { options: f.options.map((o) => { const oid = slugId(o, oTaken); oTaken.push(oid); return { id: oid, name: o }; }) } : {}) };
        });
        const sTaken: string[] = [];
        const COLORS = { todo: '#8A92B2', active: '#5B45F0', done: '#12703F', blocked: '#AD3323' } as const;
        const statuses = a.statuses?.length ? a.statuses.map((s) => { const id = slugId(s.name, sTaken); sTaken.push(id); return { id, name: s.name, color: COLORS[s.category], category: s.category }; }) : undefined;
        const r = typeSchema.safeParse({ name: a.name, ...(a.icon ? { icon: a.icon } : {}), ...(a.color ? { color: a.color } : {}), fields, ...(statuses ? { statuses } : {}) });
        if (!r.success) throw new ToolError(`Invalid space design: ${r.error.issues.map((i) => i.message).join('; ')}`);
        type = r.data;
      }
      const sp = await wos.createSpace({ name: a.name, ...(a.template_id ? { template_id: a.template_id } : {}), ...(a.icon ? { icon: a.icon } : {}), ...(a.color ? { color: a.color } : {}), description: a.description ?? null, ...(type ? { type } : {}) } as Parameters<typeof wos.createSpace>[0]);
      spacesCache = null;
      return { data: { id: sp.id, open: `/spaces/${sp.id}` }, summary: `أُنشئت المساحة «${sp.name}»`, undo: { kind: 'call', entity: 'space', op: 'delete', id: sp.id }, refresh: ['spaces'] };
    },
  },
  list_templates: {
    async run() {
      const t = await wos.templates();
      return { data: t.map((x) => ({ id: x.id, name: x.name, description: x.description })), summary: `${t.length} قالب` };
    },
  },
  add_automation: {
    async preview(a) {
      const sp = await findSpace(a.space);
      return `أتمتة «${a.name}» في «${sp.name}»: عندما ${a.trigger.kind}${a.trigger.to ? `(${a.trigger.to})` : ''} ← ${a.action.kind}${a.action.status ? `(${a.action.status})` : ''}${a.action.every ? `(${a.action.every})` : ''}`;
    },
    async run(a) {
      const sp = await findSpace(a.space);
      const fieldId = (q: string | undefined): string | null => {
        if (!q) return null;
        const f = sp.type.fields.find((x) => x.id === q || norm(x.name) === norm(q)) ?? sp.type.fields.find((x) => norm(x.name).includes(norm(q)));
        if (!f) throw new ToolError(`Unknown field "${q}". Fields: ${sp.type.fields.map((x) => x.name).join(', ')}`);
        return f.id;
      };
      const trigger = { kind: a.trigger.kind, to: a.trigger.to ? statusId(sp.type.statuses, a.trigger.to) ?? null : null, field: fieldId(a.trigger.field), days: a.trigger.days ?? (a.trigger.kind === 'due_soon' ? 1 : null) };
      const action = { kind: a.action.kind, status: a.action.status ? statusId(sp.type.statuses, a.action.status) ?? null : null, field: fieldId(a.action.field), ...(a.action.value !== undefined ? { value: a.action.value } : {}), text: a.action.text ?? null, every: a.action.every ?? (a.action.kind === 'create_next' ? 'week' : null) };
      const r = await wos.addAutomation(sp.id, { name: a.name, enabled: true, trigger, action } as Parameters<typeof wos.addAutomation>[1]);
      return { data: { id: r.id }, summary: `أُضيفت الأتمتة «${r.name}»`, undo: { kind: 'call', entity: 'automation', op: 'delete', id: r.id }, refresh: ['spaces'] };
    },
  },
  link: {
    preview: (a) => `ربط ${a.src} ↔ ${a.dst}`,
    async run(a) {
      const r = await wos.link(a.src, a.dst, a.kind ?? 'relates');
      return { data: { id: r.id }, summary: 'تم الربط', undo: { kind: 'call', entity: 'relation', op: 'delete', id: r.id } };
    },
  },

  library_search: {
    async run(a) {
      const r = await lib.items({ ...(a.query ? { q: a.query } : {}), ...(a.tag ? { tag: a.tag } : {}), ...(a.course ? { course: a.course } : {}), limit: a.limit ?? 15 });
      return { data: { total: r.total, items: r.items.map((i) => ({ ref: i.ref, title: i.title, kind: i.kind, course: i.course_code, tags: i.tags, done: i.done, open: i.source === 'file' ? `/library/f/${i.id}` : `/library/y/${i.id}` })) }, summary: `المكتبة: ${r.total} نتيجة` };
    },
  },
  library_read: {
    async run(a) {
      const id = a.ref.replace(/^(lib:)?f:/, '');
      if (/^(lib:)?y:/.test(a.ref)) throw new ToolError('YouTube items have no text. Only files (f:<id>).');
      const t = await lib.text(id).catch((e: Error) => {
        throw new ToolError(`Cannot read file: ${e.message}`);
      });
      const text = t.text.replace(/\s+\n/g, '\n').trim();
      if (!text) return { data: 'The file has no extractable text (scanned image?).', summary: `«${t.name}»: لا نص` };
      const MAX = 7000;
      if (text.length <= MAX || !a.question) return { data: { name: t.name, truncated: t.truncated || text.length > MAX, text: text.slice(0, MAX) }, summary: `قُرئ «${t.name}»` };
      // أقرب المقاطع للسؤال (بلا تضمين: تطابق كلمات مطبّعة)
      const words = norm(a.question).split(/\s+/).filter((w) => w.length > 2);
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += 1400) chunks.push(text.slice(i, i + 1600));
      const scored = chunks.map((ch, i) => ({ i, ch, sc: words.reduce((s, w) => s + (norm(ch).split(w).length - 1), 0) })).sort((x, y) => y.sc - x.sc);
      const top = [chunks[0]!, ...scored.filter((x) => x.i !== 0).slice(0, 3).sort((x, y) => x.i - y.i).map((x) => x.ch)];
      return { data: { name: t.name, note: 'Most relevant passages only', passages: top }, summary: `قُرئت أهم مقاطع «${t.name}»` };
    },
  },
  library_tag: {
    preview: (a) => `${a.remove ? 'إزالة' : 'إضافة'} الوسم «${a.tag}» ${a.remove ? 'من' : 'على'} ${a.refs.length} عنصر`,
    async run(a) {
      const refs = a.refs.map((r) => r.replace(/^lib:/, ''));
      const r = await lib.bulk(refs, a.remove ? 'untag' : 'tag', a.tag);
      return { data: { count: r.count }, summary: `${a.remove ? 'أُزيل' : 'أُضيف'} الوسم «${a.tag}» (${r.count})`, undo: { kind: 'call', entity: 'libtag', op: a.remove ? 'tag' : 'untag', id: a.tag, body: refs } };
    },
  },
  add_youtube: {
    preview: (a) => `إضافة فيديو ${a.title ? `«${a.title}»` : a.url}${a.course ? ` لمادة ${a.course}` : ''}`,
    async run(a) {
      const r = await lib.addYoutube({ url: a.url, ...(a.title ? { title: a.title } : {}), ...(a.course ? { course: a.course } : {}) });
      return { data: { ref: r.ref }, summary: `أُضيف الفيديو «${r.title}»`, undo: { kind: 'call', entity: 'youtube', op: 'delete', id: r.id } };
    },
  },

  life_overview: {
    async run() {
      const s = await life.status();
      return { data: { exports_folder_exists: s.root_exists, generated_at: s.meta?.generated_at ?? null, freshness: s.worst, files: s.files.map((f) => ({ name: (f as { name?: string }).name, fresh: (f as { freshness?: string }).freshness })) }, summary: `بيانات الحياة: ${s.worst}` };
    },
  },
  life_log: {
    preview: (a) => `مسودة أمر لراشد (${a.type}): ${Object.entries(a.payload).map(([k, v]) => `${k}=${String(v)}`).join('، ')}`,
    async run(a) {
      const p = { ...a.payload } as Record<string, unknown>;
      if (a.type === 'log_expense' && p['currency'] === undefined) p['currency'] = 'RM';
      const errs = validatePayload(a.type as CommandType, p);
      if (Object.keys(errs).length) throw new ToolError(`Invalid payload: ${Object.entries(errs).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
      const r = await life.draft(a.type as CommandType, p);
      return { data: { id: r.command.id, status: r.command.status, note: 'Draft only — Rashed applies it after approval' }, summary: `مسودة أمر ${r.command.id} (بانتظار راشد)` };
    },
  },

  sports_week: {
    async run() {
      const w = await sports.mine();
      const name = new Map(w.workouts.map((x) => [x.id, x.name]));
      return { data: { workouts: w.workouts.map((x) => ({ id: x.id, name: x.name, exercises: x.items.length })), week: Object.fromEntries(Object.entries(w.week).map(([d, id]) => [d, id ? name.get(id) ?? id : null])) }, summary: `${w.workouts.length} تمرين` };
    },
  },
  sports_set_day: {
    preview: (a) => `${WEEKDAY_AR[a.day as Weekday]}: ${a.workout ?? 'راحة'}`,
    async run(a) {
      const w = await sports.mine();
      let wid: string | null = null;
      if (a.workout) {
        const nq = norm(a.workout);
        const hit = w.workouts.find((x) => x.id === a.workout) ?? w.workouts.find((x) => norm(x.name) === nq) ?? w.workouts.find((x) => norm(x.name).includes(nq));
        if (!hit) throw new ToolError(`Workout "${a.workout}" not found. Workouts: ${w.workouts.map((x) => x.name).join(', ') || 'none'}`);
        wid = hit.id;
      }
      const prev = w.week[a.day] ?? null;
      await sports.week(a.day as Weekday, wid);
      return { data: { ok: true }, summary: `${WEEKDAY_AR[a.day as Weekday]} ← ${a.workout ?? 'راحة'}`, undo: { kind: 'call', entity: 'sportsday', op: 'set', id: a.day, body: prev } };
    },
  },
  sports_create_workout: {
    preview: (a) => `تمرين جديد «${a.name}»`,
    async run(a) {
      const r = await sports.create({ name: a.name, ...(a.note ? { note: a.note } : {}) });
      return { data: { id: r.id, open: '/sports/mine' }, summary: `أُنشئ التمرين «${r.name}»`, undo: { kind: 'call', entity: 'workout', op: 'delete', id: r.id } };
    },
  },
};

/** ينفّذ عملية تراجع (بالعكس للمتعددة) */
export async function runUndo(u: UndoOp): Promise<void> {
  if (u.kind === 'trash') return void (await api.undo(u.token));
  if (u.kind === 'revert') return void (await wos.revert(u.history_id));
  const { entity, op, id, body } = u;
  switch (`${entity}.${op}`) {
    case 'multi.all':
      for (const x of [...(body as UndoOp[])].reverse()) await runUndo(x);
      return;
    case 'assessment.delete':
      return void (await api.delAssessment(id));
    case 'assessment.patch':
      return void (await api.editAssessment(id, body));
    case 'note.delete':
      return void (await api.delNote(id));
    case 'item.delete':
      return void (await wos.delItem(id));
    case 'space.delete':
      return void (await wos.delSpace(id));
    case 'automation.delete':
      return void (await wos.delAutomation(id));
    case 'relation.delete':
      return void (await wos.unlink(id));
    case 'youtube.delete':
      return void (await lib.delYoutube(id));
    case 'libtag.tag':
    case 'libtag.untag':
      return void (await lib.bulk(body as string[], op as 'tag' | 'untag', id));
    case 'sportsday.set':
      return void (await sports.week(id as Weekday, (body as string | null) ?? null));
    case 'workout.delete':
      return void (await sports.del(id));
  }
  throw new Error(`لا أعرف كيف أتراجع عن ${entity}.${op}`);
}

export function invalidateToolCaches(): void {
  invalidate();
  spacesCache = null;
}
