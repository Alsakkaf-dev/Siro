import express from 'express';
import type { Db } from './db.js';
import type { AppConfig } from './config.js';
import type { EventBus } from './events.js';
import * as repo from './repo.js';
import { SCHEMA_VERSION } from './schema.js';
import { assessmentSchema, courseSchema, noteSchema, normalizeAssessment, parseOrThrow, semesterSchema, ValidationError } from './validation.js';
import { createBackup, listBackups, resolveBackup } from './backup.js';
import { applyImport, buildExport, diffImport, parseImport } from './exportImport.js';
import { createWosRouter, createPublicRouter } from './wos/routes.js';
import { record, snapshot, trashPut, trashRestore, workspaceOf, type SnapSpec } from './wos/core.js';
import { KIND_ALIASES, KIND_LABEL, STATUS_LABEL, TIMING_LABEL } from '../shared/constants.js';
import { normalizeText } from '../shared/text.js';
import type { SearchHit } from '../shared/types.js';
import fs from 'node:fs';
import { createLibraryRouter } from './libraryRoutes.js';
import { createLifeRouter } from './lifeRoutes.js';
import { createSportsRouter } from './sportsRoutes.js';
import { createSearchRouter } from './searchRoutes.js';
import { createPackageRouter } from './packageRoutes.js';
import { createAiRouter } from './ai/routes.js';
import path from 'node:path';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface Ctx {
  cfg: AppConfig;
  getDb: () => Db;
  /** يغلق القاعدة، يستبدل الملف، ويفتحها من جديد */
  restoreDb: (file: string) => void;
  bus: EventBus;
}

const wrap =
  (fn: (req: express.Request, res: express.Response) => void) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    try {
      fn(req, res);
    } catch (e) {
      next(e);
    }
  };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function uniqueGuard<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof Error && /UNIQUE constraint failed/i.test(e.message)) {
      if (/acad_semesters\.code/i.test(e.message)) throw new ValidationError({ code: 'يوجد فصل بنفس الرمز' });
      throw new ValidationError({ code: 'توجد مادة بنفس الرمز والشعبة في هذا الفصل' });
    }
    throw e;
  }
}

export function createApiRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = (): Db => ctx.getDb();
  const ws = workspaceOf();
  const IN_COURSES_OF_SEM = 'course_id IN (SELECT id FROM acad_courses WHERE semester_id = ?)';
  /** لقطة صفوف أكاديمية للسلة الدائمة (تشمل النتائج الرسمية — كانت تضيع عند التراجع سابقًا) */
  const acadTrash = (label: string, specs: SnapSpec[], makeActive?: string | null): string => trashPut(db(), ws, { kind: 'academic', label, sets: snapshot(db(), specs), makeActive: makeActive ?? null });

  r.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'platform', version: ctx.cfg.version, schema: SCHEMA_VERSION, driver: db().driver, time: new Date().toISOString() });
  });

  r.use('/library', createLibraryRouter(ctx));
  r.use('/life', createLifeRouter(ctx));
  r.use('/sports', createSportsRouter(ctx));
  r.use('/search', createSearchRouter(ctx));
  r.use('/packages', createPackageRouter(ctx));
  r.use('/wos', createWosRouter(ctx));
  r.use('/public', createPublicRouter(ctx));
  r.use('/ai', createAiRouter(ctx));

  /* ───── الفصول ───── */
  r.get('/semesters', wrap((_req, res) => void res.json(repo.listSemesters(db()))));

  r.post('/semesters', wrap((req, res) => {
    const i = parseOrThrow(semesterSchema, req.body);
    const id = repo.newId();
    uniqueGuard(() => repo.insertSemester(db(), id, i));
    if (!repo.getSetting(db(), 'active_semester_id')) repo.setSetting(db(), 'active_semester_id', id);
    ctx.bus.publish('academic.semester.created', 'academic', { id, code: i.code });
    record(db(), ws, { ref: `acad:sem:${id}`, action: 'create', summary: `أُنشئ الفصل ${i.code}` });
    res.status(201).json(repo.getBundle(db(), id));
  }));

  r.get('/semesters/:id', wrap((req, res) => {
    const b = repo.getBundle(db(), str(req.params['id']));
    if (!b) throw new HttpError(404, 'الفصل غير موجود');
    res.json(b);
  }));

  r.patch('/semesters/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getSemester(db(), id);
    if (!cur) throw new HttpError(404, 'الفصل غير موجود');
    const i = parseOrThrow(semesterSchema, { ...cur, ...(req.body as object) });
    uniqueGuard(() => repo.updateSemester(db(), id, i));
    ctx.bus.publish('academic.semester.updated', 'academic', { id });
    record(db(), ws, { ref: `acad:sem:${id}`, action: 'update', summary: `عُدّل الفصل ${i.code}` });
    res.json(repo.getBundle(db(), id));
  }));

  r.post('/semesters/:id/activate', wrap((req, res) => {
    const id = str(req.params['id']);
    if (!repo.getSemester(db(), id)) throw new HttpError(404, 'الفصل غير موجود');
    repo.setSetting(db(), 'active_semester_id', id);
    ctx.bus.publish('academic.semester.activated', 'academic', { id });
    res.json({ ok: true });
  }));

  r.delete('/semesters/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const b = repo.getBundle(db(), id);
    if (!b) throw new HttpError(404, 'الفصل غير موجود');
    const token = acadTrash(`الفصل ${b.semester.code}`, [
      { table: 'acad_semesters', where: 'id = ?', params: [id] },
      { table: 'acad_courses', where: 'semester_id = ?', params: [id] },
      { table: 'acad_assessments', where: IN_COURSES_OF_SEM, params: [id] },
      { table: 'acad_notes', where: 'semester_id = ?', params: [id] },
      { table: 'acad_results', where: IN_COURSES_OF_SEM, params: [id] },
    ], b.is_active ? id : null);
    repo.deleteSemester(db(), id);
    record(db(), ws, { ref: `acad:sem:${id}`, action: 'delete', summary: `حُذف الفصل ${b.semester.code} (${b.courses.length} مادة)` });
    ctx.bus.publish('academic.semester.deleted', 'academic', { id });
    res.json({ ok: true, undo: token });
  }));

  /* ───── المواد ───── */
  r.post('/semesters/:id/courses', wrap((req, res) => {
    const sid = str(req.params['id']);
    if (!repo.getSemester(db(), sid)) throw new HttpError(404, 'الفصل غير موجود');
    const i = parseOrThrow(courseSchema, req.body);
    const id = repo.newId();
    uniqueGuard(() => repo.insertCourse(db(), id, sid, i));
    ctx.bus.publish('academic.course.created', 'academic', { id, semester_id: sid });
    record(db(), ws, { ref: `acad:course:${id}`, action: 'create', summary: `أُضيفت المادة ${i.code}` });
    res.status(201).json(repo.getCourse(db(), id));
  }));

  r.patch('/courses/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getCourse(db(), id);
    if (!cur) throw new HttpError(404, 'المادة غير موجودة');
    const i = parseOrThrow(courseSchema, { ...cur, ...(req.body as object) });
    uniqueGuard(() => repo.updateCourse(db(), id, i));
    record(db(), ws, { ref: `acad:course:${id}`, action: 'update', summary: `عُدّلت المادة ${i.code}` });
    res.json(repo.getCourse(db(), id));
  }));

  r.delete('/courses/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const c = repo.getCourse(db(), id);
    if (!c) throw new HttpError(404, 'المادة غير موجودة');
    const token = acadTrash(`المادة ${c.code}`, [
      { table: 'acad_courses', where: 'id = ?', params: [id] },
      { table: 'acad_assessments', where: 'course_id = ?', params: [id] },
      { table: 'acad_notes', where: 'course_id = ?', params: [id] },
      { table: 'acad_results', where: 'course_id = ?', params: [id] },
    ]);
    repo.deleteCourse(db(), id);
    record(db(), ws, { ref: `acad:course:${id}`, action: 'delete', summary: `حُذفت المادة ${c.code}` });
    res.json({ ok: true, undo: token });
  }));

  /* ───── التقييمات ───── */
  const semOfCourse = (courseId: string) => {
    const c = repo.getCourse(db(), courseId);
    if (!c) throw new HttpError(404, 'المادة غير موجودة');
    return { course: c, sem: repo.getSemester(db(), c.semester_id)! };
  };

  r.post('/courses/:id/assessments', wrap((req, res) => {
    const { course, sem } = semOfCourse(str(req.params['id']));
    const i = normalizeAssessment(parseOrThrow(assessmentSchema, req.body), sem);
    const id = repo.newId();
    repo.insertAssessment(db(), id, course.id, i);
    ctx.bus.publish('academic.assessment.created', 'academic', { id, course_id: course.id });
    record(db(), ws, { ref: `acad:asmt:${id}`, action: 'create', summary: `أُضيف التقييم «${i.title}» (${course.code})` });
    res.status(201).json(repo.getAssessment(db(), id));
  }));

  r.patch('/assessments/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getAssessment(db(), id);
    if (!cur) throw new HttpError(404, 'التقييم غير موجود');
    const { sem } = semOfCourse(cur.course_id);
    const i = normalizeAssessment(parseOrThrow(assessmentSchema, { ...cur, ...(req.body as object) }), sem);
    repo.updateAssessment(db(), id, i);
    record(db(), ws, { ref: `acad:asmt:${id}`, action: 'update', summary: cur.status !== i.status ? `«${i.title}»: الحالة ← ${STATUS_LABEL[i.status]}` : `عُدّل التقييم «${i.title}»` });
    res.json(repo.getAssessment(db(), id));
  }));

  r.delete('/assessments/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const a = repo.getAssessment(db(), id);
    if (!a) throw new HttpError(404, 'التقييم غير موجود');
    const token = acadTrash(`التقييم ${a.title}`, [{ table: 'acad_assessments', where: 'id = ?', params: [id] }]);
    repo.deleteAssessment(db(), id);
    record(db(), ws, { ref: `acad:asmt:${id}`, action: 'delete', summary: `حُذف التقييم «${a.title}»` });
    res.json({ ok: true, undo: token });
  }));

  /* ───── الملاحظات / الفراغات ───── */
  r.post('/semesters/:id/notes', wrap((req, res) => {
    const sid = str(req.params['id']);
    if (!repo.getSemester(db(), sid)) throw new HttpError(404, 'الفصل غير موجود');
    const i = parseOrThrow(noteSchema, req.body);
    if (i.course_id && !repo.getCourse(db(), i.course_id)) throw new ValidationError({ course_id: 'المادة غير موجودة' });
    const id = repo.newId();
    repo.insertNote(db(), id, sid, i);
    res.status(201).json(repo.getNote(db(), id));
  }));

  r.patch('/notes/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getNote(db(), id);
    if (!cur) throw new HttpError(404, 'الملاحظة غير موجودة');
    const i = parseOrThrow(noteSchema, { ...cur, ...(req.body as object) });
    repo.updateNote(db(), id, i);
    res.json(repo.getNote(db(), id));
  }));

  r.delete('/notes/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const n = repo.getNote(db(), id);
    if (!n) throw new HttpError(404, 'الملاحظة غير موجودة');
    const token = acadTrash('الملاحظة', [{ table: 'acad_notes', where: 'id = ?', params: [id] }]);
    repo.deleteNote(db(), id);
    record(db(), ws, { ref: `acad:note:${id}`, action: 'delete', summary: `حُذفت ملاحظة: ${n.text.slice(0, 60)}` });
    res.json({ ok: true, undo: token });
  }));

  /* ───── عمليات جماعية ───── */
  const idList = (v: unknown): string[] => {
    if (!Array.isArray(v) || !v.length || v.length > 500 || v.some((x) => typeof x !== 'string')) throw new ValidationError({ ids: 'اختر عنصرًا واحدًا على الأقل' });
    return v as string[];
  };
  r.post('/assessments/bulk', wrap((req, res) => {
    const b = (req.body ?? {}) as { ids?: unknown; op?: unknown; status?: unknown };
    const ids = idList(b.ids);
    const rows = ids.map((id) => repo.getAssessment(db(), id)).filter((a): a is NonNullable<typeof a> => !!a);
    if (b.op === 'delete') {
      const token = acadTrash(`${rows.length} تقييم`, [{ table: 'acad_assessments', where: `id IN (${rows.map(() => '?').join(',') || "''"})`, params: rows.map((a) => a.id) }]);
      db().tx(() => rows.forEach((a) => {
        repo.deleteAssessment(db(), a.id);
        record(db(), ws, { ref: `acad:asmt:${a.id}`, action: 'delete', summary: `حُذف التقييم «${a.title}» (جماعي)` });
      }));
      return void res.json({ ok: true, count: rows.length, undo: token });
    }
    if (b.op === 'status') {
      const status = String(b.status);
      if (!(status in STATUS_LABEL)) throw new ValidationError({ status: 'حالة غير معروفة' });
      db().tx(() => rows.forEach((a) => {
        const { sem } = semOfCourse(a.course_id);
        const i = normalizeAssessment(parseOrThrow(assessmentSchema, { ...a, status }), sem);
        repo.updateAssessment(db(), a.id, i);
        record(db(), ws, { ref: `acad:asmt:${a.id}`, action: 'update', summary: `«${a.title}»: الحالة ← ${STATUS_LABEL[i.status]} (جماعي)` });
      }));
      return void res.json({ ok: true, count: rows.length });
    }
    throw new ValidationError({ op: 'عملية غير معروفة' });
  }));
  r.post('/semesters/bulk', wrap((req, res) => {
    const b = (req.body ?? {}) as { ids?: unknown; op?: unknown };
    if (b.op !== 'delete') throw new ValidationError({ op: 'عملية غير معروفة' });
    const rows = idList(b.ids).map((id) => repo.getBundle(db(), id)).filter((x): x is NonNullable<typeof x> => !!x);
    const ids = rows.map((x) => x.semester.id);
    const ph = ids.map(() => '?').join(',') || "''";
    const inC = `course_id IN (SELECT id FROM acad_courses WHERE semester_id IN (${ph}))`;
    const active = rows.find((x) => x.is_active)?.semester.id ?? null;
    const token = acadTrash(`${rows.length} فصل`, [
      { table: 'acad_semesters', where: `id IN (${ph})`, params: ids },
      { table: 'acad_courses', where: `semester_id IN (${ph})`, params: ids },
      { table: 'acad_assessments', where: inC, params: ids },
      { table: 'acad_notes', where: `semester_id IN (${ph})`, params: ids },
      { table: 'acad_results', where: inC, params: ids },
    ], active);
    db().tx(() => rows.forEach((x) => {
      repo.deleteSemester(db(), x.semester.id);
      record(db(), ws, { ref: `acad:sem:${x.semester.id}`, action: 'delete', summary: `حُذف الفصل ${x.semester.code} (جماعي)` });
    }));
    res.json({ ok: true, count: rows.length, undo: token });
  }));
  r.post('/courses/bulk', wrap((req, res) => {
    const b = (req.body ?? {}) as { ids?: unknown; op?: unknown };
    if (b.op !== 'delete') throw new ValidationError({ op: 'عملية غير معروفة' });
    const rows = idList(b.ids).map((id) => repo.getCourse(db(), id)).filter((c): c is NonNullable<typeof c> => !!c);
    const ph = rows.map(() => '?').join(',') || "''";
    const ids = rows.map((c) => c.id);
    const token = acadTrash(`${rows.length} مادة`, [
      { table: 'acad_courses', where: `id IN (${ph})`, params: ids },
      { table: 'acad_assessments', where: `course_id IN (${ph})`, params: ids },
      { table: 'acad_notes', where: `course_id IN (${ph})`, params: ids },
      { table: 'acad_results', where: `course_id IN (${ph})`, params: ids },
    ]);
    db().tx(() => rows.forEach((c) => {
      repo.deleteCourse(db(), c.id);
      record(db(), ws, { ref: `acad:course:${c.id}`, action: 'delete', summary: `حُذفت المادة ${c.code} (جماعي)` });
    }));
    res.json({ ok: true, count: rows.length, undo: token });
  }));
  r.post('/notes/bulk', wrap((req, res) => {
    const b = (req.body ?? {}) as { ids?: unknown; op?: unknown };
    const ids = idList(b.ids);
    const rows = ids.map((id) => repo.getNote(db(), id)).filter((n): n is NonNullable<typeof n> => !!n);
    if (b.op === 'delete') {
      const token = acadTrash(`${rows.length} ملاحظة`, [{ table: 'acad_notes', where: `id IN (${rows.map(() => '?').join(',') || "''"})`, params: rows.map((n) => n.id) }]);
      db().tx(() => rows.forEach((n) => repo.deleteNote(db(), n.id)));
      record(db(), ws, { ref: 'acad:notes', action: 'delete', summary: `حُذفت ${rows.length} ملاحظة (جماعي)` });
      return void res.json({ ok: true, count: rows.length, undo: token });
    }
    if (b.op === 'resolve' || b.op === 'unresolve') {
      db().tx(() => rows.forEach((n) => repo.updateNote(db(), n.id, parseOrThrow(noteSchema, { ...n, resolved: b.op === 'resolve' }))));
      record(db(), ws, { ref: 'acad:notes', action: 'update', summary: `${b.op === 'resolve' ? 'حُلّت' : 'أُعيد فتح'} ${rows.length} ملاحظة` });
      return void res.json({ ok: true, count: rows.length });
    }
    throw new ValidationError({ op: 'عملية غير معروفة' });
  }));

  /* ───── تراجع ───── */
  r.post('/undo/:token', wrap((req, res) => {
    const e = trashRestore(db(), ws, str(req.params['token']));
    if (!e) throw new HttpError(410, 'انتهت مهلة التراجع');
    if (e.makeActive) repo.setSetting(db(), 'active_semester_id', e.makeActive);
    record(db(), ws, { ref: 'trash', action: 'restore', summary: `استُعيد ${e.label}` });
    res.json({ ok: true, label: e.label });
  }));

  /* ───── البحث ───── */
  r.get('/search', wrap((req, res) => {
    const q = normalizeText(str(req.query['q']));
    if (q.length < 1) return void res.json([]);
    const d = repo.allData(db());
    const sem = new Map(d.semesters.map((s) => [s.id, s]));
    const courses = new Map(d.courses.map((c) => [c.id, c]));
    const hits: SearchHit[] = [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const match = (hay: string): boolean => {
      const h = normalizeText(hay);
      return tokens.every((t) => h.includes(t));
    };
    for (const c of d.courses) {
      if (match([c.code, c.name, c.name_ar ?? '', c.lecturer ?? '', c.coordinator ?? '', c.room ?? '', c.section ?? ''].join(' '))) {
        const s = sem.get(c.semester_id)!;
        hits.push({ type: 'course', id: c.id, semester_id: s.id, semester_code: s.code, course_id: c.id, title: `${c.code} — ${c.name}`, subtitle: c.name_ar ?? c.lecturer ?? '', color: c.color });
      }
    }
    for (const a of d.assessments) {
      const c = courses.get(a.course_id);
      if (!c) continue;
      if (match([a.title, KIND_LABEL[a.kind], a.kind, ...KIND_ALIASES[a.kind], a.note ?? '', STATUS_LABEL[a.status], TIMING_LABEL[a.timing], c.code].join(' '))) {
        const s = sem.get(c.semester_id)!;
        hits.push({ type: 'assessment', id: a.id, semester_id: s.id, semester_code: s.code, course_id: c.id, title: a.title, subtitle: `${c.code} · ${KIND_LABEL[a.kind]} · ${a.weight}%`, color: c.color });
      }
    }
    res.json(hits.slice(0, 60));
  }));

  /* ───── تصدير / استيراد ───── */
  r.get('/export', wrap((_req, res) => {
    const day = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="academic_export_${day}.json"`);
    res.type('application/json').send(JSON.stringify(buildExport(db()), null, 2));
  }));

  r.post('/import/preview', wrap((req, res) => {
    const p = parseImport(req.body);
    if (!p.ok) return void res.status(422).json({ ok: false, errors: p.errors });
    res.json({ ok: true, diff: diffImport(db(), p.data) });
  }));

  r.post('/import/apply', wrap((req, res) => {
    const body = req.body as { mode?: string; file?: unknown };
    const mode = body.mode === 'replace' ? 'replace' : 'merge';
    const p = parseImport(body.file);
    if (!p.ok) return void res.status(422).json({ ok: false, errors: p.errors });
    const pre = createBackup(db(), ctx.cfg.backupsDir, 'pre-import');
    applyImport(db(), p.data, mode);
    ctx.bus.publish('academic.import.applied', 'core', { mode });
    res.json({ ok: true, backup: pre.name, diff: diffImport(db(), p.data) });
  }));

  /* ───── النسخ الاحتياطي ───── */
  r.get('/backups', wrap((_req, res) => void res.json(listBackups(ctx.cfg.backupsDir))));

  r.post('/backups', wrap((_req, res) => {
    res.status(201).json(createBackup(db(), ctx.cfg.backupsDir, 'manual'));
  }));

  r.post('/backups/restore', wrap((req, res) => {
    const name = str((req.body as { name?: unknown }).name);
    const file = resolveBackup(ctx.cfg.backupsDir, name);
    if (!file) throw new HttpError(404, 'النسخة غير موجودة');
    const pre = createBackup(db(), ctx.cfg.backupsDir, 'pre-restore');
    ctx.restoreDb(file);
    ctx.bus.publish('core.backup.restored', 'core', { name });
    res.json({ ok: true, safety_backup: pre.name });
  }));

  r.get('/info', wrap((_req, res) => {
    const dbFile = db().file;
    const size = fs.existsSync(dbFile) ? fs.statSync(dbFile).size : 0;
    res.json({ version: ctx.cfg.version, driver: db().driver, schema: SCHEMA_VERSION, db_file: path.relative(ctx.cfg.root, dbFile), db_size: size, port: ctx.cfg.port, host: ctx.cfg.host });
  }));

  r.use((_req, _res, next) => next(new HttpError(404, 'المسار غير موجود')));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  r.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ValidationError) return void res.status(400).json({ error: 'بيانات غير صالحة', fields: err.fields });
    if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
    if (err instanceof SyntaxError) return void res.status(400).json({ error: 'JSON غير صالح' });
    if ((err as { type?: string }).type === 'entity.too.large') return void res.status(413).json({ error: 'الملف كبير جدًا' });
    console.error('[api]', err);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  });

  return r;
}

