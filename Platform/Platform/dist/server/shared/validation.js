import { z } from 'zod';
import { isValidISODate, parseISO, weekOf } from './semester.js';
const blank = (v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v);
export const optText = (max) => z.preprocess(blank, z.string().max(max, `الحد الأقصى ${max} حرفًا`).nullable()).default(null);
export const optNum = (min, max) => z.preprocess((v) => (v === '' || v === undefined ? null : typeof v === 'string' ? Number(v) : v), z.number('رقم غير صالح').min(min, `الحد الأدنى ${min}`).max(max, `الحد الأقصى ${max}`).nullable()).default(null);
export const optInt = (min, max) => z.preprocess((v) => (v === '' || v === undefined ? null : typeof v === 'string' ? Number(v) : v), z.number('رقم غير صالح').int('يجب أن يكون عددًا صحيحًا').min(min, `الحد الأدنى ${min}`).max(max, `الحد الأقصى ${max}`).nullable()).default(null);
const isoDate = z.string('التاريخ مطلوب').refine(isValidISODate, 'تاريخ غير صالح (YYYY-MM-DD)');
const optIso = z.preprocess(blank, isoDate.nullable()).default(null);
const reqText = (max, msg = 'هذا الحقل مطلوب') => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string(msg).min(1, msg).max(max, `الحد الأقصى ${max} حرفًا`));
export const semesterBase = z.object({
    code: reqText(30),
    name: reqText(120),
    year_no: optInt(1, 8),
    sem_no: optInt(1, 16),
    start_date: isoDate,
    weeks: z.preprocess((v) => (v === '' || v === undefined || v === null ? 16 : typeof v === 'string' ? Number(v) : v), z.number('رقم غير صالح').int().min(1, 'على الأقل أسبوع واحد').max(40, 'الحد الأقصى 40 أسبوعًا')),
    break_weeks: z.preprocess((v) => v ?? [], z.array(z.number().int().min(1)).max(20)),
    exam_start: optIso,
    exam_end: optIso,
    note: optText(1000),
});
export function refineSemester(v, ctx) {
    for (const w of v.break_weeks) {
        if (w > v.weeks)
            ctx.addIssue({ code: 'custom', path: ['break_weeks'], message: `أسبوع الإجازة ${w} خارج عدد الأسابيع (${v.weeks})` });
    }
    if (v.exam_start && v.exam_end && parseISO(v.exam_end) < parseISO(v.exam_start)) {
        ctx.addIssue({ code: 'custom', path: ['exam_end'], message: 'نهاية الامتحانات قبل بدايتها' });
    }
    if (v.exam_start && parseISO(v.exam_start) < parseISO(v.start_date)) {
        ctx.addIssue({ code: 'custom', path: ['exam_start'], message: 'بداية الامتحانات قبل بداية الفصل' });
    }
}
export const semesterSchema = semesterBase.superRefine(refineSemester).transform((v) => ({ ...v, break_weeks: [...new Set(v.break_weeks)].sort((a, b) => a - b) }));
export const courseBase = z.object({
    code: reqText(30),
    name: reqText(160),
    name_ar: optText(160),
    credits: optNum(0, 30),
    section: optText(20),
    lecturer: optText(300),
    coordinator: optText(200),
    room: optText(120),
    schedule: optText(200),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'لون غير صالح (#RRGGBB)').default('#4CC9F0'),
    slt: optInt(0, 1000),
    source_file: optText(300),
    min_final: optNum(0, 100),
    clos: z.preprocess((v) => v ?? [], z.array(z.string().max(500)).max(20)),
    note: optText(1000),
});
export const courseSchema = courseBase;
export const assessmentBase = z.object({
    kind: z.enum(['quiz', 'test', 'lab', 'assignment', 'project', 'oral', 'final', 'other'], 'نوع غير صالح'),
    title: reqText(160),
    weight: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number('الوزن مطلوب').min(0, 'الوزن لا يقل عن 0').max(100, 'الوزن لا يزيد عن 100')),
    count: z.preprocess((v) => (v === '' || v === undefined || v === null ? 1 : typeof v === 'string' ? Number(v) : v), z.number().int('عدد صحيح').min(1).max(50)),
    timing: z.enum(['unknown', 'week', 'date', 'exam'], 'نوع الموعد غير صالح').default('unknown'),
    week_no: optInt(1, 60),
    week_from: optInt(1, 60),
    due_date: optIso,
    due_time: optText(30),
    venue: optText(120),
    status: z.enum(['unknown', 'pending', 'submitted', 'graded'], 'حالة غير صالحة').default('pending'),
    score: optNum(0, 100000),
    max_score: optNum(0.0001, 100000),
    weight_assumed: z.preprocess((v) => v === true || v === 1 || v === '1' || v === 'true', z.boolean()).default(false),
    crowd: z.preprocess((v) => (v === undefined ? true : v === true || v === 1 || v === '1' || v === 'true'), z.boolean()).default(true),
    note: optText(1000),
});
export const assessmentSchema = assessmentBase;
export class ValidationError extends Error {
    fields;
    constructor(fields) {
        super('بيانات غير صالحة');
        this.fields = fields;
    }
}
/** يطبّع التقييم حسب نوع الموعد وإعدادات الفصل. يرمي ValidationError عند التعارض. */
export function normalizeAssessment(v, sem) {
    const errs = {};
    let week_no = null;
    let due_date = null;
    let week_from = null;
    switch (v.timing) {
        case 'unknown':
        case 'exam':
            break;
        case 'week':
            if (v.week_no === null)
                errs['week_no'] = 'اكتب رقم الأسبوع';
            else if (v.week_no > sem.weeks)
                errs['week_no'] = `الأسبوع يجب أن يكون بين 1 و ${sem.weeks} (للامتحانات اختر «فترة الامتحانات»)`;
            else
                week_no = v.week_no;
            break;
        case 'date': {
            if (!v.due_date)
                errs['due_date'] = 'اختر التاريخ';
            else {
                due_date = v.due_date;
                const w = weekOf(parseISO(v.due_date), parseISO(sem.start_date));
                week_no = w >= 1 && w <= sem.weeks ? w : null;
            }
            break;
        }
    }
    if (v.week_from !== null && (v.timing === 'week' || v.timing === 'date')) {
        if (week_no !== null && v.week_from < week_no)
            week_from = v.week_from;
        else if (week_no !== null && v.week_from >= week_no)
            errs['week_from'] = '«من أسبوع» يجب أن يكون قبل أسبوع التسليم';
    }
    const max_score = v.max_score ?? (v.weight > 0 ? v.weight : 100);
    if (v.score !== null && v.score > max_score)
        errs['score'] = 'الدرجة أكبر من الدرجة الكاملة';
    if (Object.keys(errs).length)
        throw new ValidationError(errs);
    let status = v.status;
    if (v.score !== null && (status === 'pending' || status === 'unknown'))
        status = 'graded';
    if (v.score === null && status === 'graded')
        status = 'pending';
    return {
        kind: v.kind,
        title: v.title,
        weight: v.weight,
        count: v.count,
        timing: v.timing,
        week_no,
        week_from,
        due_date,
        due_time: v.timing === 'date' || v.timing === 'week' || v.timing === 'exam' ? v.due_time : null,
        venue: v.venue,
        status,
        score: v.score,
        max_score,
        weight_assumed: v.weight_assumed,
        crowd: v.crowd,
        note: v.note,
    };
}
export const noteSchema = z.object({
    course_id: optText(40),
    tag: z.enum(['unk', 'note']).default('note'),
    text: reqText(300),
    detail: optText(1000),
    resolved: z.preprocess((v) => v === true || v === 1, z.boolean()).default(false),
});
export function zodFields(err) {
    const out = {};
    for (const i of err.issues) {
        const key = i.path.join('.') || '_';
        if (!(key in out))
            out[key] = i.message;
    }
    return out;
}
export function parseOrThrow(schema, data) {
    const r = schema.safeParse(data);
    if (!r.success)
        throw new ValidationError(zodFields(r.error));
    return r.data;
}
