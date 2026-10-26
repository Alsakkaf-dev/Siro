import fs from 'node:fs';
import { getSetting, insertAssessment, insertCourse, insertNote, insertSemester, setSetting } from './repo.js';
const SEED_FLAG = 'seed:sem5-dashboard';
/** يزرع الفصل 5 مرة واحدة فقط (حتى لو حذفته لاحقًا ما يرجع). */
export function seedIfNeeded(db, seedFile) {
    if (getSetting(db, SEED_FLAG))
        return false;
    if (!fs.existsSync(seedFile)) {
        console.warn('[seed] ملف البذرة غير موجود:', seedFile);
        return false;
    }
    const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    db.tx(() => {
        const sem = seed.semester;
        insertSemester(db, sem.id, { ...sem, source: seed.source });
        for (const c of seed.courses) {
            insertCourse(db, c.id, sem.id, { ...c, source: c.source ?? seed.source });
        }
        for (const a of seed.assessments) {
            insertAssessment(db, a.id, a.course_id, { ...a, weight_assumed: a.weight_assumed === 1, crowd: a.crowd === 1, source: seed.source });
        }
        for (const n of seed.notes) {
            insertNote(db, n.id, sem.id, { course_id: n.course_id, tag: n.tag, text: n.text, detail: n.detail, resolved: n.resolved === 1 });
        }
        if (!getSetting(db, 'active_semester_id'))
            setSetting(db, 'active_semester_id', sem.id);
        setSetting(db, SEED_FLAG, new Date().toISOString());
    });
    return true;
}
