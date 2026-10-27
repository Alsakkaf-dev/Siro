/** خدمات مشتركة لكل المجالات: السجل (history)، سلة المحذوفات الدائمة، الروابط، وحلّ المراجع (refs). */
import type express from 'express';
import type { Db, SqlValue } from '../db.js';
import { newId } from '../repo.js';
import { currentActor } from '../actor.js';
import { DEFAULT_WORKSPACE, RELATION_INVERSE, RELATION_LABEL, type HistoryEntry, type LinkView, type RefInfo, type RelationKind, type TrashEntry } from '../../shared/wos.js';

/** نقطة ربط تعدد المستخدمين (ADR-0007): اليوم مساحة عمل واحدة. */
export function workspaceOf(_req?: express.Request): string {
  return DEFAULT_WORKSPACE;
}

const nowIso = (): string => new Date().toISOString();

/* ───────── السجل ───────── */
export interface HistoryInput { ref: string; action: string; summary: string; before?: unknown; after?: unknown; actor?: string }
export function record(db: Db, ws: string, h: HistoryInput): string {
  const id = newId();
  db.run(
    'INSERT INTO wos_history (id, workspace_id, ref, action, summary, before, after, actor, at) VALUES (?,?,?,?,?,?,?,?,?)',
    id, ws, h.ref, h.action, h.summary.slice(0, 300),
    h.before === undefined ? null : JSON.stringify(h.before),
    h.after === undefined ? null : JSON.stringify(h.after),
    h.actor ?? currentActor(), nowIso(),
  );
  return id;
}

export function listHistory(db: Db, ws: string, o: { ref?: string; limit?: number; before?: string } = {}): HistoryEntry[] {
  const p: SqlValue[] = [ws];
  let sql = 'SELECT id, ref, action, summary, actor, at, reverted, before IS NOT NULL AS has_before FROM wos_history WHERE workspace_id = ?';
  if (o.ref) {
    sql += ' AND ref = ?';
    p.push(o.ref);
  }
  if (o.before) {
    sql += ' AND at < ?';
    p.push(o.before);
  }
  sql += ' ORDER BY at DESC, rowid DESC LIMIT ?';
  p.push(Math.min(500, o.limit ?? 100));
  return db.all<{ id: string; ref: string; action: string; summary: string; actor: string; at: string; reverted: number; has_before: number }>(sql, ...p).map((r) => ({
    id: r.id,
    ref: r.ref,
    action: r.action,
    summary: r.summary,
    actor: r.actor,
    at: r.at,
    reverted: r.reverted === 1,
    revertible: r.has_before === 1 && r.reverted === 0 && r.ref.startsWith('wos:') && r.action === 'update',
  }));
}

/* ───────── سلة المحذوفات (دائمة، 30 يومًا) ─────────
 * الحمولة = لقطة صفوف خام من جداول مسموحة بترتيب الإدراج (الآباء أولًا).
 * الاستعادة = INSERT OR IGNORE لنفس الأعمدة → لا تكتب فوق تعديلات لاحقة ولا تفقد جداول تابعة (مثل acad_results). */
const RESTORABLE = new Set([
  'acad_semesters', 'acad_courses', 'acad_assessments', 'acad_notes', 'acad_results',
  'lib_youtube', 'lib_tags', 'lib_meta', 'lib_bookmarks',
  'spt_workouts', 'spt_items', 'spt_week',
  'wos_types', 'wos_spaces', 'wos_items', 'wos_views', 'wos_relations', 'wos_automations',
]);
export interface RowSet { table: string; rows: Record<string, unknown>[] }
export interface SnapSpec { table: string; where: string; params: SqlValue[] }

export function snapshot(db: Db, specs: SnapSpec[]): RowSet[] {
  return specs.map((s) => {
    if (!RESTORABLE.has(s.table)) throw new Error(`جدول غير مسموح للسلة: ${s.table}`);
    return { table: s.table, rows: db.all<Record<string, unknown>>(`SELECT * FROM ${s.table} WHERE ${s.where}`, ...s.params) };
  });
}

export function restoreRows(db: Db, sets: RowSet[]): number {
  let n = 0;
  db.tx(() => {
    for (const s of sets) {
      if (!RESTORABLE.has(s.table)) continue;
      for (const row of s.rows) {
        const cols = Object.keys(row).filter((c) => /^[a-z_]+$/.test(c));
        if (!cols.length) continue;
        const r = db.run(`INSERT OR IGNORE INTO ${s.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, ...cols.map((c) => row[c] as SqlValue));
        n += r.changes;
      }
    }
  });
  return n;
}

const TTL_DAYS = 30;
export function trashPut(db: Db, ws: string, o: { kind: string; label: string; sets: RowSet[]; makeActive?: string | null }): string {
  const token = newId();
  const at = new Date();
  db.run(
    'INSERT INTO wos_trash (token, workspace_id, label, kind, payload, make_active, deleted_at, expires_at) VALUES (?,?,?,?,?,?,?,?)',
    token, ws, o.label, o.kind, JSON.stringify(o.sets), o.makeActive ?? null, at.toISOString(), new Date(at.getTime() + TTL_DAYS * 86_400_000).toISOString(),
  );
  return token;
}

export function trashSweep(db: Db): void {
  db.run('DELETE FROM wos_trash WHERE expires_at < ? OR (restored_at IS NOT NULL AND restored_at < ?)', nowIso(), new Date(Date.now() - 86_400_000).toISOString());
}

/** يستعيد عنصرًا من السلة مرة واحدة فقط. يعيد null إن انتهت صلاحيته أو استُعيد سابقًا. */
export function trashRestore(db: Db, ws: string, token: string): { label: string; kind: string; makeActive: string | null; restored: number } | null {
  trashSweep(db);
  const e = db.get<{ label: string; kind: string; payload: string; make_active: string | null; restored_at: string | null }>('SELECT label, kind, payload, make_active, restored_at FROM wos_trash WHERE token = ? AND workspace_id = ?', token, ws);
  if (!e || e.restored_at) return null;
  const sets = JSON.parse(e.payload) as RowSet[];
  const restored = restoreRows(db, sets);
  db.run('UPDATE wos_trash SET restored_at = ? WHERE token = ?', nowIso(), token);
  return { label: e.label, kind: e.kind, makeActive: e.make_active, restored };
}

export function listTrash(db: Db, ws: string): (TrashEntry & { count: number })[] {
  trashSweep(db);
  return db.all<{ token: string; label: string; kind: string; deleted_at: string; expires_at: string; restored_at: string | null; payload: string }>(
    'SELECT token, label, kind, deleted_at, expires_at, restored_at, payload FROM wos_trash WHERE workspace_id = ? AND restored_at IS NULL ORDER BY deleted_at DESC LIMIT 200', ws,
  ).map(({ payload, ...r }) => ({ ...r, count: (JSON.parse(payload) as RowSet[]).reduce((s, x) => s + x.rows.length, 0) }));
}

export function trashPurge(db: Db, ws: string, token?: string): number {
  return token ? db.run('DELETE FROM wos_trash WHERE workspace_id = ? AND token = ?', ws, token).changes : db.run('DELETE FROM wos_trash WHERE workspace_id = ?', ws).changes;
}

/* ───────── المراجع ───────── */
type Row = Record<string, unknown>;
const S = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** يحلّ مرجعًا إلى عنوان ورابط — لكل المجالات. */
export function resolveRef(db: Db, ref: string): RefInfo {
  const miss = (kind: string): RefInfo => ({ ref, title: 'عنصر محذوف أو غير متاح', to: null, kind, missing: true, readonly: true });
  const [ns, a, b] = ref.split(':');
  if (ns === 'wos' && a) {
    const r = db.get<Row>('SELECT i.title, i.space_id, s.name AS space, s.color FROM wos_items i JOIN wos_spaces s ON s.id = i.space_id WHERE i.id = ?', a);
    return r ? { ref, title: S(r['title']), subtitle: S(r['space']), to: `/spaces/${S(r['space_id'])}?item=${a}`, kind: 'item', color: S(r['color']), icon: 'check' } : miss('item');
  }
  if (ns === 'space' && a) {
    const r = db.get<Row>('SELECT name, color, icon FROM wos_spaces WHERE id = ?', a);
    return r ? { ref, title: S(r['name']), subtitle: 'مساحة', to: `/spaces/${a}`, kind: 'space', color: S(r['color']), icon: S(r['icon']) } : miss('space');
  }
  if (ns === 'acad' && b) {
    if (a === 'sem') {
      const r = db.get<Row>('SELECT code, name FROM acad_semesters WHERE id = ?', b);
      return r ? { ref, title: S(r['code']), subtitle: S(r['name']), to: `/academic/s/${b}`, kind: 'semester', icon: 'calendar' } : miss('semester');
    }
    if (a === 'course') {
      const r = db.get<Row>('SELECT code, name, color, semester_id FROM acad_courses WHERE id = ?', b);
      return r ? { ref, title: `${S(r['code'])} — ${S(r['name'])}`, subtitle: 'مادة', to: `/academic/s/${S(r['semester_id'])}/courses/${b}`, kind: 'course', color: S(r['color']), icon: 'book' } : miss('course');
    }
    if (a === 'asmt') {
      const r = db.get<Row>('SELECT a.title, a.weight, c.code, c.color, c.id AS cid, c.semester_id FROM acad_assessments a JOIN acad_courses c ON c.id = a.course_id WHERE a.id = ?', b);
      return r ? { ref, title: S(r['title']), subtitle: `${S(r['code'])} · ${S(r['weight'])}%`, to: `/academic/s/${S(r['semester_id'])}/courses/${S(r['cid'])}#a-${b}`, kind: 'assessment', color: S(r['color']), icon: 'target' } : miss('assessment');
    }
    if (a === 'note') {
      const r = db.get<Row>('SELECT text, semester_id FROM acad_notes WHERE id = ?', b);
      return r ? { ref, title: S(r['text']).slice(0, 80), subtitle: 'ملاحظة', to: `/academic/s/${S(r['semester_id'])}/unknowns`, kind: 'note', icon: 'help' } : miss('note');
    }
  }
  if (ns === 'lib' && b) {
    if (a === 'f') {
      const r = db.get<Row>('SELECT name, folder FROM lib_files WHERE id = ?', b);
      return r ? { ref, title: S(r['name']), subtitle: S(r['folder']) || 'المكتبة', to: `/library/f/${b}`, kind: 'file', icon: 'file' } : miss('file');
    }
    if (a === 'y') {
      const r = db.get<Row>('SELECT title FROM lib_youtube WHERE id = ?', b);
      return r ? { ref, title: S(r['title']), subtitle: 'YouTube', to: `/library/y/${b}`, kind: 'video', icon: 'play' } : miss('video');
    }
  }
  if (ns === 'spt' && a === 'w' && b) {
    const r = db.get<Row>('SELECT name FROM spt_workouts WHERE id = ?', b);
    return r ? { ref, title: S(r['name']), subtitle: 'تماريني', to: '/sports/mine', kind: 'workout', icon: 'dumbbell' } : miss('workout');
  }
  if (ns === 'life' && a) {
    const LIFE: Record<string, [string, string]> = { finance: ['المال', '/life/finance'], prayers: ['الصلاة', '/life/prayers'], habits: ['العادات', '/life/habits'], body: ['الجسم', '/life/body'], routine: ['الروتين', '/life/routine'] };
    const x = LIFE[a];
    return x ? { ref, title: x[0], subtitle: 'الحياة (قراءة فقط)', to: x[1], kind: 'life', icon: 'heart', readonly: true } : miss('life');
  }
  return miss('unknown');
}

/** بحث في كل أنواع المراجع (لمنتقي الروابط). */
export function searchRefs(db: Db, ws: string, q: string, limit = 20): RefInfo[] {
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const out: RefInfo[] = [];
  const push = (refs: string[]): void => void out.push(...refs.map((r) => resolveRef(db, r)));
  push(db.all<{ id: string }>('SELECT id FROM wos_items WHERE workspace_id = ? AND archived = 0 AND title LIKE ? ORDER BY updated_at DESC LIMIT 8', ws, like).map((r) => `wos:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM wos_spaces WHERE workspace_id = ? AND name LIKE ? LIMIT 4', ws, like).map((r) => `space:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM acad_courses WHERE code LIKE ? OR name LIKE ? OR name_ar LIKE ? LIMIT 5', like, like, like).map((r) => `acad:course:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM acad_assessments WHERE title LIKE ? LIMIT 6', like).map((r) => `acad:asmt:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM lib_files WHERE missing = 0 AND name LIKE ? LIMIT 6', like).map((r) => `lib:f:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM lib_youtube WHERE title LIKE ? LIMIT 4', like).map((r) => `lib:y:${r.id}`));
  push(db.all<{ id: string }>('SELECT id FROM spt_workouts WHERE name LIKE ? LIMIT 4', like).map((r) => `spt:w:${r.id}`));
  return out.slice(0, limit);
}

/* ───────── الروابط ───────── */
export function addRelation(db: Db, ws: string, src: string, dst: string, kind: RelationKind): string {
  if (src === dst) throw new Error('لا يمكن ربط العنصر بنفسه');
  const inv = RELATION_INVERSE[kind];
  // تجنّب التكرار في الاتجاه المعاكس (الربط يُخزّن مرة واحدة)
  const dup = db.get<{ id: string }>('SELECT id FROM wos_relations WHERE workspace_id = ? AND ((src = ? AND dst = ? AND kind = ?) OR (src = ? AND dst = ? AND kind = ?))', ws, src, dst, kind, dst, src, inv);
  if (dup) return dup.id;
  const id = newId();
  db.run('INSERT INTO wos_relations (id, workspace_id, src, dst, kind, created_at) VALUES (?,?,?,?,?,?)', id, ws, src, dst, kind, nowIso());
  return id;
}

export function linksOf(db: Db, ws: string, ref: string): LinkView[] {
  const rows = db.all<{ id: string; src: string; dst: string; kind: RelationKind }>('SELECT id, src, dst, kind FROM wos_relations WHERE workspace_id = ? AND (src = ? OR dst = ?) ORDER BY created_at', ws, ref, ref);
  return rows.map((r) => {
    const out = r.src === ref;
    const kind = out ? r.kind : RELATION_INVERSE[r.kind];
    return { id: r.id, kind, label: RELATION_LABEL[kind], other: resolveRef(db, out ? r.dst : r.src), direction: out ? 'out' : 'in' };
  });
}

/** يحذف كل روابط مرجع (عند حذف الكيان) ويعيد اللقطة للسلة */
export function relationSnap(ref: string, ws: string): SnapSpec {
  return { table: 'wos_relations', where: 'workspace_id = ? AND (src = ? OR dst = ?)', params: [ws, ref, ref] };
}
export function dropRelations(db: Db, ws: string, ref: string): void {
  db.run('DELETE FROM wos_relations WHERE workspace_id = ? AND (src = ? OR dst = ?)', ws, ref, ref);
}

/* ───────── الوارد ───────── */
export function notify(db: Db, ws: string, o: { ref?: string | null; title: string; body?: string | null; source: string }): void {
  db.run('INSERT INTO wos_inbox (id, workspace_id, ref, title, body, source, at) VALUES (?,?,?,?,?,?,?)', newId(), ws, o.ref ?? null, o.title.slice(0, 200), o.body?.slice(0, 1000) ?? null, o.source, nowIso());
}
