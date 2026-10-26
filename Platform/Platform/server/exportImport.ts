import { z } from 'zod';
import type { Db } from './db.js';
import { allData, insertAssessment, insertCourse, insertNote, insertSemester, getSetting, setSetting } from './repo.js';
import { assessmentBase, courseBase, noteSchema, refineSemester, semesterBase, normalizeAssessment, zodFields, ValidationError } from './validation.js';
import type { AcademicNote, Assessment, Course, Semester } from '../shared/types.js';

export const EXPORT_SCHEMA = 'platform.academic/v1';

export interface ExportFile {
  schema: typeof EXPORT_SCHEMA;
  app: 'platform';
  exported_at: string;
  active_semester_id: string | null;
  semesters: Semester[];
  courses: Course[];
  assessments: Assessment[];
  notes: AcademicNote[];
}

export function buildExport(db: Db): ExportFile {
  const d = allData(db);
  return { schema: EXPORT_SCHEMA, app: 'platform', exported_at: new Date().toISOString(), active_semester_id: getSetting(db, 'active_semester_id'), ...d };
}

const idStr = z.string().min(1).max(60).regex(/^[A-Za-z0-9_.-]+$/, 'معرّف غير صالح');
const srcStr = z.string().max(80).default('import');

const importSemester = semesterBase.extend({ id: idStr, source: srcStr });
const importCourse = courseBase.extend({ id: idStr, semester_id: idStr, sort: z.number().int().default(0), source: srcStr });
const importAssessment = assessmentBase.extend({ id: idStr, course_id: idStr, sort: z.number().int().default(0), source: srcStr });
const importNote = noteSchema.extend({ id: idStr, semester_id: idStr });

const fileSchema = z.object({
  schema: z.string(),
  semesters: z.array(z.unknown()).default([]),
  courses: z.array(z.unknown()).default([]),
  assessments: z.array(z.unknown()).default([]),
  notes: z.array(z.unknown()).default([]),
  active_semester_id: z.string().nullable().optional(),
});

export interface ParsedImport {
  semesters: Semester[];
  courses: Course[];
  assessments: Assessment[];
  notes: AcademicNote[];
  active_semester_id: string | null;
}

/** يتحقق من الملف كاملًا؛ يرجع errors لو فيه مشكلة (ولا يخمّن). */
export function parseImport(raw: unknown): { ok: true; data: ParsedImport } | { ok: false; errors: string[] } {
  const f = fileSchema.safeParse(raw);
  if (!f.success) return { ok: false, errors: ['الملف ليس بصيغة تصدير المنصة (JSON غير مفهوم).'] };
  if (f.data.schema !== EXPORT_SCHEMA) {
    return { ok: false, errors: [`إصدار الملف «${f.data.schema}» غير معروف — المتوقع «${EXPORT_SCHEMA}». لن نخمّن؛ لم يتم استيراد شيء.`] };
  }
  const errors: string[] = [];
  const semesters: Semester[] = [];
  const courses: Course[] = [];
  const assessments: Assessment[] = [];
  const notes: AcademicNote[] = [];
  const semMap = new Map<string, Semester>();

  f.data.semesters.forEach((x, i) => {
    const r = importSemester.superRefine(refineSemester).safeParse(x);
    if (!r.success) return void errors.push(`فصل #${i + 1}: ${Object.entries(zodFields(r.error)).map(([k, m]) => `${k} — ${m}`).join('؛ ')}`);
    const s: Semester = { ...r.data, break_weeks: [...new Set(r.data.break_weeks)].sort((a, b) => a - b) };
    if (semMap.has(s.id)) return void errors.push(`فصل مكرر: ${s.id}`);
    semMap.set(s.id, s);
    semesters.push(s);
  });
  const courseIds = new Set<string>();
  f.data.courses.forEach((x, i) => {
    const r = importCourse.safeParse(x);
    if (!r.success) return void errors.push(`مادة #${i + 1}: ${Object.entries(zodFields(r.error)).map(([k, m]) => `${k} — ${m}`).join('؛ ')}`);
    if (!semMap.has(r.data.semester_id)) return void errors.push(`مادة ${r.data.code}: الفصل ${r.data.semester_id} غير موجود في الملف`);
    if (courseIds.has(r.data.id)) return void errors.push(`مادة مكررة: ${r.data.id}`);
    courseIds.add(r.data.id);
    courses.push(r.data);
  });
  const courseSem = new Map(courses.map((c) => [c.id, c.semester_id]));
  f.data.assessments.forEach((x, i) => {
    const r = importAssessment.safeParse(x);
    if (!r.success) return void errors.push(`تقييم #${i + 1}: ${Object.entries(zodFields(r.error)).map(([k, m]) => `${k} — ${m}`).join('؛ ')}`);
    const sem = semMap.get(courseSem.get(r.data.course_id) ?? '');
    if (!sem) return void errors.push(`تقييم ${r.data.title}: المادة ${r.data.course_id} غير موجودة في الملف`);
    try {
      const norm = normalizeAssessment(r.data, sem);
      assessments.push({ ...norm, id: r.data.id, course_id: r.data.course_id, sort: r.data.sort, source: r.data.source });
    } catch (e) {
      if (e instanceof ValidationError) errors.push(`تقييم ${r.data.title}: ${Object.values(e.fields).join('؛ ')}`);
      else throw e;
    }
  });
  f.data.notes.forEach((x, i) => {
    const r = importNote.safeParse(x);
    if (!r.success) return void errors.push(`ملاحظة #${i + 1}: ${Object.entries(zodFields(r.error)).map(([k, m]) => `${k} — ${m}`).join('؛ ')}`);
    if (!semMap.has(r.data.semester_id)) return void errors.push(`ملاحظة: الفصل ${r.data.semester_id} غير موجود`);
    notes.push({ ...r.data, course_id: r.data.course_id && courseIds.has(r.data.course_id) ? r.data.course_id : null });
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { semesters, courses, assessments, notes, active_semester_id: f.data.active_semester_id ?? null } };
}

/* ───── Diff ───── */
export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}
export interface EntityDiff {
  added: { id: string; label: string }[];
  removed: { id: string; label: string }[];
  changed: { id: string; label: string; fields: FieldChange[] }[];
  unchanged: number;
}
export interface DiffResult {
  semesters: EntityDiff;
  courses: EntityDiff;
  assessments: EntityDiff;
  notes: EntityDiff;
  totals: { added: number; removed: number; changed: number; unchanged: number };
}

function diffEntities<T extends { id: string }>(current: T[], incoming: T[], label: (x: T) => string): EntityDiff {
  const cur = new Map(current.map((x) => [x.id, x]));
  const inc = new Map(incoming.map((x) => [x.id, x]));
  const out: EntityDiff = { added: [], removed: [], changed: [], unchanged: 0 };
  for (const [id, x] of inc) {
    const c = cur.get(id);
    if (!c) {
      out.added.push({ id, label: label(x) });
      continue;
    }
    const fields: FieldChange[] = [];
    for (const k of new Set([...Object.keys(c), ...Object.keys(x)])) {
      const a = (c as Record<string, unknown>)[k];
      const b = (x as Record<string, unknown>)[k];
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) fields.push({ field: k, from: a ?? null, to: b ?? null });
    }
    if (fields.length) out.changed.push({ id, label: label(x), fields });
    else out.unchanged++;
  }
  for (const [id, x] of cur) if (!inc.has(id)) out.removed.push({ id, label: label(x) });
  return out;
}

export function diffImport(db: Db, data: ParsedImport): DiffResult {
  const cur = allData(db);
  const semCode = new Map([...cur.semesters, ...data.semesters].map((s) => [s.id, s.code]));
  const courseCode = new Map([...cur.courses, ...data.courses].map((c) => [c.id, c.code]));
  const semesters = diffEntities(cur.semesters, data.semesters, (s) => `${s.code} — ${s.name}`);
  const courses = diffEntities(cur.courses, data.courses, (c) => `${semCode.get(c.semester_id) ?? '?'} · ${c.code} ${c.name}`);
  const assessments = diffEntities(cur.assessments, data.assessments, (a) => `${courseCode.get(a.course_id) ?? '?'} · ${a.title}`);
  const notes = diffEntities(cur.notes, data.notes, (n) => n.text);
  const all = [semesters, courses, assessments, notes];
  return {
    semesters,
    courses,
    assessments,
    notes,
    totals: {
      added: all.reduce((s, d) => s + d.added.length, 0),
      removed: all.reduce((s, d) => s + d.removed.length, 0),
      changed: all.reduce((s, d) => s + d.changed.length, 0),
      unchanged: all.reduce((s, d) => s + d.unchanged, 0),
    },
  };
}

/** merge = إضافة + تحديث فقط (بدون حذف). replace = القاعدة تصير مطابقة للملف (يحذف الناقص). */
export function applyImport(db: Db, data: ParsedImport, mode: 'merge' | 'replace'): void {
  db.tx(() => {
    if (mode === 'replace') {
      const keepSem = new Set(data.semesters.map((s) => s.id));
      for (const s of allData(db).semesters) if (!keepSem.has(s.id)) db.run('DELETE FROM acad_semesters WHERE id = ?', s.id);
      const keepCourse = new Set(data.courses.map((c) => c.id));
      for (const c of allData(db).courses) if (!keepCourse.has(c.id)) db.run('DELETE FROM acad_courses WHERE id = ?', c.id);
      const keepA = new Set(data.assessments.map((a) => a.id));
      for (const a of allData(db).assessments) if (!keepA.has(a.id)) db.run('DELETE FROM acad_assessments WHERE id = ?', a.id);
      const keepN = new Set(data.notes.map((n) => n.id));
      for (const n of allData(db).notes) if (!keepN.has(n.id)) db.run('DELETE FROM acad_notes WHERE id = ?', n.id);
    }
    for (const s of data.semesters) {
      const exists = db.get('SELECT 1 AS x FROM acad_semesters WHERE id = ?', s.id);
      if (exists) {
        db.run('UPDATE acad_semesters SET code=?, name=?, year_no=?, sem_no=?, start_date=?, weeks=?, break_weeks=?, exam_start=?, exam_end=?, note=?, source=?, updated_at=? WHERE id=?',
          s.code, s.name, s.year_no, s.sem_no, s.start_date, s.weeks, JSON.stringify(s.break_weeks), s.exam_start, s.exam_end, s.note, s.source, new Date().toISOString(), s.id);
      } else insertSemester(db, s.id, s);
    }
    for (const c of data.courses) {
      if (db.get('SELECT 1 AS x FROM acad_courses WHERE id = ?', c.id)) {
        db.run('UPDATE acad_courses SET semester_id=?, code=?, name=?, name_ar=?, credits=?, section=?, lecturer=?, coordinator=?, room=?, schedule=?, color=?, slt=?, source_file=?, min_final=?, clos=?, note=?, sort=?, source=?, updated_at=? WHERE id=?',
          c.semester_id, c.code, c.name, c.name_ar, c.credits, c.section, c.lecturer, c.coordinator, c.room, c.schedule, c.color, c.slt, c.source_file, c.min_final, JSON.stringify(c.clos), c.note, c.sort, c.source, new Date().toISOString(), c.id);
      } else insertCourse(db, c.id, c.semester_id, c);
    }
    for (const a of data.assessments) {
      if (db.get('SELECT 1 AS x FROM acad_assessments WHERE id = ?', a.id)) {
        db.run('UPDATE acad_assessments SET course_id=?, kind=?, title=?, weight=?, count=?, timing=?, week_no=?, week_from=?, due_date=?, due_time=?, venue=?, status=?, score=?, max_score=?, weight_assumed=?, crowd=?, note=?, sort=?, source=?, updated_at=? WHERE id=?',
          a.course_id, a.kind, a.title, a.weight, a.count, a.timing, a.week_no, a.week_from, a.due_date, a.due_time, a.venue, a.status, a.score, a.max_score, a.weight_assumed ? 1 : 0, a.crowd ? 1 : 0, a.note, a.sort, a.source, new Date().toISOString(), a.id);
      } else insertAssessment(db, a.id, a.course_id, a);
    }
    for (const n of data.notes) {
      if (db.get('SELECT 1 AS x FROM acad_notes WHERE id = ?', n.id)) {
        db.run('UPDATE acad_notes SET semester_id=?, course_id=?, tag=?, text=?, detail=?, resolved=? WHERE id=?', n.semester_id, n.course_id, n.tag, n.text, n.detail, n.resolved ? 1 : 0, n.id);
      } else insertNote(db, n.id, n.semester_id, n);
    }
    if (data.active_semester_id && db.get('SELECT 1 AS x FROM acad_semesters WHERE id = ?', data.active_semester_id) && !getSetting(db, 'active_semester_id')) {
      setSetting(db, 'active_semester_id', data.active_semester_id);
    }
  });
}
