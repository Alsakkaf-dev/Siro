import crypto from 'node:crypto';
export const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const nowIso = () => new Date().toISOString();
const s = (v) => (v === null || v === undefined ? null : String(v));
const n = (v) => (v === null || v === undefined ? null : Number(v));
function parseJsonArray(v) {
    try {
        const j = JSON.parse(String(v ?? '[]'));
        return Array.isArray(j) ? j : [];
    }
    catch {
        return [];
    }
}
export function semesterFromRow(r) {
    return {
        id: String(r['id']),
        code: String(r['code']),
        name: String(r['name']),
        year_no: n(r['year_no']),
        sem_no: n(r['sem_no']),
        start_date: String(r['start_date']),
        weeks: Number(r['weeks']),
        break_weeks: parseJsonArray(r['break_weeks']),
        exam_start: s(r['exam_start']),
        exam_end: s(r['exam_end']),
        note: s(r['note']),
        source: String(r['source']),
    };
}
export function courseFromRow(r) {
    return {
        id: String(r['id']),
        semester_id: String(r['semester_id']),
        code: String(r['code']),
        name: String(r['name']),
        name_ar: s(r['name_ar']),
        credits: n(r['credits']),
        section: s(r['section']),
        lecturer: s(r['lecturer']),
        coordinator: s(r['coordinator']),
        room: s(r['room']),
        schedule: s(r['schedule']),
        color: String(r['color']),
        slt: n(r['slt']),
        source_file: s(r['source_file']),
        min_final: n(r['min_final']),
        clos: parseJsonArray(r['clos']),
        note: s(r['note']),
        sort: Number(r['sort']),
        source: String(r['source']),
    };
}
export function assessmentFromRow(r) {
    return {
        id: String(r['id']),
        course_id: String(r['course_id']),
        kind: String(r['kind']),
        title: String(r['title']),
        weight: Number(r['weight']),
        count: Number(r['count']),
        timing: String(r['timing']),
        week_no: n(r['week_no']),
        week_from: n(r['week_from']),
        due_date: s(r['due_date']),
        due_time: s(r['due_time']),
        venue: s(r['venue']),
        status: String(r['status']),
        score: n(r['score']),
        max_score: Number(r['max_score']),
        weight_assumed: Number(r['weight_assumed']) === 1,
        crowd: Number(r['crowd']) === 1,
        note: s(r['note']),
        sort: Number(r['sort']),
        source: String(r['source']),
    };
}
export function noteFromRow(r) {
    return {
        id: String(r['id']),
        semester_id: String(r['semester_id']),
        course_id: s(r['course_id']),
        tag: String(r['tag']),
        text: String(r['text']),
        detail: s(r['detail']),
        resolved: Number(r['resolved']) === 1,
    };
}
/* ───── Settings ───── */
export function getSetting(db, key) {
    const r = db.get('SELECT value FROM core_settings WHERE key = ?', key);
    return r?.value ?? null;
}
export function setSetting(db, key, value) {
    db.run('INSERT INTO core_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}
/* ───── Semesters ───── */
export function listSemesters(db) {
    const active = getSetting(db, 'active_semester_id');
    const rows = db.all(`
    SELECT s.*,
      (SELECT COUNT(*) FROM acad_courses c WHERE c.semester_id = s.id) AS course_count,
      (SELECT COUNT(*) FROM acad_assessments a JOIN acad_courses c ON c.id = a.course_id WHERE c.semester_id = s.id) AS assessment_rows,
      (SELECT COALESCE(SUM(a.count), 0) FROM acad_assessments a JOIN acad_courses c ON c.id = a.course_id WHERE c.semester_id = s.id) AS assessment_count
    FROM acad_semesters s ORDER BY s.start_date DESC, s.code`);
    return rows.map((r) => ({
        ...semesterFromRow(r),
        course_count: Number(r['course_count']),
        assessment_rows: Number(r['assessment_rows']),
        assessment_count: Number(r['assessment_count']),
        is_active: String(r['id']) === active,
    }));
}
export function getSemester(db, id) {
    const r = db.get('SELECT * FROM acad_semesters WHERE id = ?', id);
    return r ? semesterFromRow(r) : undefined;
}
export function getBundle(db, id) {
    const semester = getSemester(db, id);
    if (!semester)
        return undefined;
    const courses = db.all('SELECT * FROM acad_courses WHERE semester_id = ? ORDER BY sort, code', id).map(courseFromRow);
    const assessments = db
        .all('SELECT a.* FROM acad_assessments a JOIN acad_courses c ON c.id = a.course_id WHERE c.semester_id = ? ORDER BY a.sort, a.created_at', id)
        .map(assessmentFromRow);
    const notes = db.all('SELECT * FROM acad_notes WHERE semester_id = ? ORDER BY resolved, rowid', id).map(noteFromRow);
    return { semester, courses, assessments, notes, is_active: getSetting(db, 'active_semester_id') === id };
}
export function insertSemester(db, id, i) {
    const t = nowIso();
    db.run(`INSERT INTO acad_semesters (id, code, name, year_no, sem_no, start_date, weeks, break_weeks, exam_start, exam_end, note, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, i.code, i.name, i.year_no, i.sem_no, i.start_date, i.weeks, JSON.stringify(i.break_weeks), i.exam_start, i.exam_end, i.note, i.source ?? 'manual', t, t);
}
export function updateSemester(db, id, i) {
    db.run(`UPDATE acad_semesters SET code=?, name=?, year_no=?, sem_no=?, start_date=?, weeks=?, break_weeks=?, exam_start=?, exam_end=?, note=?, updated_at=? WHERE id=?`, i.code, i.name, i.year_no, i.sem_no, i.start_date, i.weeks, JSON.stringify(i.break_weeks), i.exam_start, i.exam_end, i.note, nowIso(), id);
}
export function deleteSemester(db, id) {
    db.tx(() => {
        db.run('DELETE FROM acad_semesters WHERE id = ?', id);
        if (getSetting(db, 'active_semester_id') === id) {
            const next = db.get('SELECT id FROM acad_semesters ORDER BY start_date DESC LIMIT 1');
            setSetting(db, 'active_semester_id', next?.id ?? null);
        }
    });
}
export function getCourse(db, id) {
    const r = db.get('SELECT * FROM acad_courses WHERE id = ?', id);
    return r ? courseFromRow(r) : undefined;
}
export function insertCourse(db, id, semesterId, i) {
    const t = nowIso();
    const sort = i.sort ?? Number(db.get('SELECT MAX(sort) AS m FROM acad_courses WHERE semester_id = ?', semesterId)?.m ?? 0) + 1;
    db.run(`INSERT INTO acad_courses (id, semester_id, code, name, name_ar, credits, section, lecturer, coordinator, room, schedule, color, slt, source_file, min_final, clos, note, sort, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, semesterId, i.code, i.name, i.name_ar, i.credits, i.section, i.lecturer, i.coordinator, i.room, i.schedule, i.color, i.slt, i.source_file, i.min_final, JSON.stringify(i.clos), i.note, sort, i.source ?? 'manual', t, t);
}
export function updateCourse(db, id, i) {
    db.run(`UPDATE acad_courses SET code=?, name=?, name_ar=?, credits=?, section=?, lecturer=?, coordinator=?, room=?, schedule=?, color=?, slt=?, source_file=?, min_final=?, clos=?, note=?, updated_at=? WHERE id=?`, i.code, i.name, i.name_ar, i.credits, i.section, i.lecturer, i.coordinator, i.room, i.schedule, i.color, i.slt, i.source_file, i.min_final, JSON.stringify(i.clos), i.note, nowIso(), id);
}
export function deleteCourse(db, id) {
    db.run('DELETE FROM acad_courses WHERE id = ?', id);
}
export function getAssessment(db, id) {
    const r = db.get('SELECT * FROM acad_assessments WHERE id = ?', id);
    return r ? assessmentFromRow(r) : undefined;
}
export function insertAssessment(db, id, courseId, i) {
    const t = nowIso();
    const sort = i.sort ?? Number(db.get('SELECT MAX(sort) AS m FROM acad_assessments WHERE course_id = ?', courseId)?.m ?? 0) + 1;
    db.run(`INSERT INTO acad_assessments (id, course_id, kind, title, weight, count, timing, week_no, week_from, due_date, due_time, venue, status, score, max_score, weight_assumed, crowd, note, sort, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, courseId, i.kind, i.title, i.weight, i.count, i.timing, i.week_no, i.week_from, i.due_date, i.due_time, i.venue, i.status, i.score, i.max_score, i.weight_assumed ? 1 : 0, i.crowd ? 1 : 0, i.note, sort, i.source ?? 'manual', t, t);
}
export function updateAssessment(db, id, i) {
    db.run(`UPDATE acad_assessments SET kind=?, title=?, weight=?, count=?, timing=?, week_no=?, week_from=?, due_date=?, due_time=?, venue=?, status=?, score=?, max_score=?, weight_assumed=?, crowd=?, note=?, updated_at=? WHERE id=?`, i.kind, i.title, i.weight, i.count, i.timing, i.week_no, i.week_from, i.due_date, i.due_time, i.venue, i.status, i.score, i.max_score, i.weight_assumed ? 1 : 0, i.crowd ? 1 : 0, i.note, nowIso(), id);
}
export function deleteAssessment(db, id) {
    db.run('DELETE FROM acad_assessments WHERE id = ?', id);
}
/* ───── Notes ───── */
export function insertNote(db, id, semesterId, i) {
    db.run('INSERT INTO acad_notes (id, semester_id, course_id, tag, text, detail, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, semesterId, i.course_id, i.tag, i.text, i.detail, i.resolved ? 1 : 0, nowIso());
}
export function updateNote(db, id, i) {
    db.run('UPDATE acad_notes SET course_id=?, tag=?, text=?, detail=?, resolved=? WHERE id=?', i.course_id, i.tag, i.text, i.detail, i.resolved ? 1 : 0, id);
}
export function getNote(db, id) {
    const r = db.get('SELECT * FROM acad_notes WHERE id = ?', id);
    return r ? noteFromRow(r) : undefined;
}
export function deleteNote(db, id) {
    db.run('DELETE FROM acad_notes WHERE id = ?', id);
}
/* ───── كل البيانات (للتصدير والبحث) ───── */
export function allData(db) {
    return {
        semesters: db.all('SELECT * FROM acad_semesters ORDER BY start_date, code').map(semesterFromRow),
        courses: db.all('SELECT * FROM acad_courses ORDER BY semester_id, sort, code').map(courseFromRow),
        assessments: db.all('SELECT * FROM acad_assessments ORDER BY course_id, sort').map(assessmentFromRow),
        notes: db.all('SELECT * FROM acad_notes ORDER BY semester_id, rowid').map(noteFromRow),
    };
}
