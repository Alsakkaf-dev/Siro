import express from 'express';
import type { Db } from './db.js';
import type { AppConfig } from './config.js';
import type { EventBus } from './events.js';
import * as repo from './repo.js';
import { SCHEMA_VERSION } from './schema.js';
import { assessmentSchema, courseSchema, noteSchema, normalizeAssessment, parseOrThrow, semesterSchema, ValidationError } from './validation.js';
import { createBackup, listBackups, resolveBackup } from './backup.js';
import { applyImport, buildExport, diffImport, parseImport } from './exportImport.js';
import { Trash } from './trash.js';
import { KIND_ALIASES, KIND_LABEL, STATUS_LABEL, TIMING_LABEL } from '../shared/constants.js';
import { normalizeText } from '../shared/text.js';
import type { SearchHit } from '../shared/types.js';
import fs from 'node:fs';
import { createLibraryRouter } from './libraryRoutes.js';
import { createLifeRouter } from './lifeRoutes.js';
import { createSportsRouter } from './sportsRoutes.js';
import { createSearchRouter } from './searchRoutes.js';
import { createKitchenRouter } from './kitchenRoutes.js';
import { createCalendarRouter } from './calendarRoutes.js';
import { createEnrichRouter } from './enrich.js';
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
  const trash = new Trash();

  r.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'platform', version: ctx.cfg.version, schema: SCHEMA_VERSION, driver: db().driver, time: new Date().toISOString() });
  });

  r.use('/library', createLibraryRouter(ctx));
  r.use('/life', createLifeRouter(ctx));
  r.use('/sports', createSportsRouter(ctx));
  r.use('/search', createSearchRouter(ctx));
  r.use('/kitchen', createKitchenRouter(ctx));
  r.use('/calendar', createCalendarRouter(ctx));
  r.use('/enrich', createEnrichRouter(ctx));

  /* ───── الفصول ───── */
  r.get('/semesters', wrap((_req, res) => void res.json(repo.listSemesters(db()))));

  r.post('/semesters', wrap((req, res) => {
    const i = parseOrThrow(semesterSchema, req.body);
    const id = repo.newId();
    uniqueGuard(() => repo.insertSemester(db(), id, i));
    if (!repo.getSetting(db(), 'active_semester_id')) repo.setSetting(db(), 'active_semester_id', id);
    ctx.bus.publish('academic.semester.created', 'academic', { id, code: i.code });
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
    const token = trash.put(
      { semesters: [{ ...b.semester }], courses: b.courses, assessments: b.assessments, notes: b.notes, active_semester_id: null },
      `الفصل ${b.semester.code}`,
      b.is_active ? id : undefined,
    );
    repo.deleteSemester(db(), id);
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
    res.status(201).json(repo.getCourse(db(), id));
  }));

  r.patch('/courses/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getCourse(db(), id);
    if (!cur) throw new HttpError(404, 'المادة غير موجودة');
    const i = parseOrThrow(courseSchema, { ...cur, ...(req.body as object) });
    uniqueGuard(() => repo.updateCourse(db(), id, i));
    res.json(repo.getCourse(db(), id));
  }));

  r.delete('/courses/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const c = repo.getCourse(db(), id);
    if (!c) throw new HttpError(404, 'المادة غير موجودة');
    const b = repo.getBundle(db(), c.semester_id);
    const sem = b!.semester;
    const token = trash.put(
      {
        semesters: [sem],
        courses: [c],
        assessments: b!.assessments.filter((a) => a.course_id === id),
        notes: b!.notes.filter((n) => n.course_id === id),
        active_semester_id: null,
      },
      `المادة ${c.code}`,
    );
    repo.deleteCourse(db(), id);
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
    res.status(201).json(repo.getAssessment(db(), id));
  }));

  r.patch('/assessments/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = repo.getAssessment(db(), id);
    if (!cur) throw new HttpError(404, 'التقييم غير موجود');
    const { sem } = semOfCourse(cur.course_id);
    const i = normalizeAssessment(parseOrThrow(assessmentSchema, { ...cur, ...(req.body as object) }), sem);
    repo.updateAssessment(db(), id, i);
    res.json(repo.getAssessment(db(), id));
  }));

  r.delete('/assessments/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const a = repo.getAssessment(db(), id);
    if (!a) throw new HttpError(404, 'التقييم غير موجود');
    const { sem, course } = semOfCourse(a.course_id);
    const token = trash.put({ semesters: [sem], courses: [course], assessments: [a], notes: [], active_semester_id: null }, `التقييم ${a.title}`);
    repo.deleteAssessment(db(), id);
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
    const sem = repo.getSemester(db(), n.semester_id)!;
    const token = trash.put({ semesters: [sem], courses: [], assessments: [], notes: [n], active_semester_id: null }, 'الملاحظة');
    repo.deleteNote(db(), id);
    res.json({ ok: true, undo: token });
  }));

  /* ───── تراجع ───── */
  r.post('/undo/:token', wrap((req, res) => {
    const e = trash.take(str(req.params['token']));
    if (!e) throw new HttpError(410, 'انتهت مهلة التراجع');
    // التراجع يستعيد فقط ما كان محذوفًا (الفصل/المادة الأب قد يكونان موجودين)
    const d = e.data;
    applyImport(db(), d, 'merge');
    if (e.makeActive) repo.setSetting(db(), 'active_semester_id', e.makeActive);
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

