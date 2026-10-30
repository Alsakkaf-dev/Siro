/** مستودع «مساحاتي»: الأنواع، المساحات، العناصر، العروض، القوالب. كل الكتابات بمعاملات + سجل. */
import type { Db } from '../db.js';
import { newId } from '../repo.js';
import { evaluateFormula, type FVal } from '../../shared/formula.js';
import {
  COMPUTED_KINDS, canTransition, coerceValue, isDoneStatus, statusOf,
  type Automation, type FieldDef, type FieldValue, type StatusDef, type ViewConfig, type ViewKind, type WosItem, type WosSpace, type WosType, type WosView,
} from '../../shared/wos.js';
import type { TemplatePayload } from '../../shared/templates.js';
import { ValidationError } from '../validation.js';

type Row = Record<string, unknown>;
const nowIso = (): string => new Date().toISOString();
const json = <T>(v: unknown, d: T): T => {
  try {
    return v === null || v === undefined ? d : (JSON.parse(String(v)) as T);
  } catch {
    return d;
  }
};

export const typeFromRow = (r: Row): WosType => ({
  id: String(r['id']), workspace_id: String(r['workspace_id']), name: String(r['name']), icon: String(r['icon']), color: String(r['color']),
  fields: json<FieldDef[]>(r['fields'], []), statuses: json<StatusDef[]>(r['statuses'], []), created_at: String(r['created_at']), updated_at: String(r['updated_at']),
});
export const spaceFromRow = (r: Row): WosSpace => ({
  id: String(r['id']), workspace_id: String(r['workspace_id']), type_id: String(r['type_id']), name: String(r['name']), icon: String(r['icon']), color: String(r['color']),
  description: r['description'] === null ? null : String(r['description']), sort: Number(r['sort']), archived: Number(r['archived']) === 1, created_at: String(r['created_at']), updated_at: String(r['updated_at']),
  ...(r['item_count'] !== undefined ? { item_count: Number(r['item_count']), done_count: Number(r['done_count'] ?? 0) } : {}),
});
export const itemFromRow = (r: Row): WosItem => ({
  id: String(r['id']), workspace_id: String(r['workspace_id']), space_id: String(r['space_id']), parent_id: r['parent_id'] === null ? null : String(r['parent_id']),
  title: String(r['title']), status: r['status'] === null ? null : String(r['status']), data: json<Record<string, FieldValue>>(r['data'], {}),
  start: r['start'] === null ? null : String(r['start']), due: r['due'] === null ? null : String(r['due']), sort: Number(r['sort']), archived: Number(r['archived']) === 1,
  done_at: r['done_at'] === null ? null : String(r['done_at']), created_at: String(r['created_at']), updated_at: String(r['updated_at']),
});
export const viewFromRow = (r: Row): WosView => ({
  id: String(r['id']), workspace_id: String(r['workspace_id']), scope: String(r['scope']), name: String(r['name']), kind: String(r['kind']) as ViewKind,
  config: json<ViewConfig>(r['config'], {}), sort: Number(r['sort']), created_at: String(r['created_at']), updated_at: String(r['updated_at']),
});
export const automationFromRow = (r: Row): Automation => ({
  id: String(r['id']), workspace_id: String(r['workspace_id']), space_id: String(r['space_id']), name: String(r['name']), enabled: Number(r['enabled']) === 1,
  trigger: json(r['trigger'], { kind: 'item_created' }), action: json(r['action'], { kind: 'notify' }), runs: Number(r['runs']), last_run: r['last_run'] === null ? null : String(r['last_run']), created_at: String(r['created_at']),
});

/* ───────── الأنواع ───────── */
export function getType(db: Db, ws: string, id: string): WosType | null {
  const r = db.get<Row>('SELECT * FROM wos_types WHERE id = ? AND workspace_id = ?', id, ws);
  return r ? typeFromRow(r) : null;
}
export function insertType(db: Db, ws: string, t: Pick<WosType, 'name' | 'icon' | 'color' | 'fields' | 'statuses'>): string {
  const id = newId();
  const at = nowIso();
  db.run('INSERT INTO wos_types (id, workspace_id, name, icon, color, fields, statuses, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)', id, ws, t.name, t.icon, t.color, JSON.stringify(t.fields), JSON.stringify(t.statuses), at, at);
  return id;
}
export function updateType(db: Db, ws: string, id: string, t: Pick<WosType, 'name' | 'icon' | 'color' | 'fields' | 'statuses'>): void {
  db.run('UPDATE wos_types SET name=?, icon=?, color=?, fields=?, statuses=?, updated_at=? WHERE id=? AND workspace_id=?', t.name, t.icon, t.color, JSON.stringify(t.fields), JSON.stringify(t.statuses), nowIso(), id, ws);
  // عناصر بحالة لم تعد موجودة → أول حالة (لا تبقى عناصر «يتيمة» بلا عمود في اللوحة)
  const ids = t.statuses.map((s) => s.id);
  const first = t.statuses[0]?.id ?? null;
  for (const sp of db.all<{ id: string }>('SELECT id FROM wos_spaces WHERE type_id = ?', id)) {
    db.run(`UPDATE wos_items SET status = ? WHERE space_id = ? AND (status IS NULL OR status NOT IN (${ids.map(() => '?').join(',') || "''"}))`, first, sp.id, ...ids);
  }
}

/* ───────── المساحات ───────── */
export function listSpaces(db: Db, ws: string, includeArchived = false): (WosSpace & { type: WosType })[] {
  const rows = db.all<Row>(
    `SELECT s.*, (SELECT COUNT(*) FROM wos_items i WHERE i.space_id = s.id AND i.archived = 0 AND i.parent_id IS NULL) AS item_count,
            (SELECT COUNT(*) FROM wos_items i WHERE i.space_id = s.id AND i.archived = 0 AND i.parent_id IS NULL AND i.done_at IS NOT NULL) AS done_count
     FROM wos_spaces s WHERE s.workspace_id = ? ${includeArchived ? '' : 'AND s.archived = 0'} ORDER BY s.sort, s.created_at`,
    ws,
  );
  const types = new Map(db.all<Row>('SELECT * FROM wos_types WHERE workspace_id = ?', ws).map((r) => [String(r['id']), typeFromRow(r)]));
  return rows.map((r) => ({ ...spaceFromRow(r), type: types.get(String(r['type_id']))! })).filter((s) => s.type);
}
export function getSpace(db: Db, ws: string, id: string): (WosSpace & { type: WosType }) | null {
  const r = db.get<Row>('SELECT * FROM wos_spaces WHERE id = ? AND workspace_id = ?', id, ws);
  if (!r) return null;
  const t = getType(db, ws, String(r['type_id']));
  return t ? { ...spaceFromRow(r), type: t } : null;
}

/** ينشئ مساحة كاملة من قالب (نوع + مساحة + عروض + أتمتة + عناصر). */
export function createFromTemplate(db: Db, ws: string, p: TemplatePayload, override: { name?: string; color?: string; icon?: string } = {}): string {
  return db.tx(() => {
    const typeId = insertType(db, ws, p.type);
    const id = newId();
    const at = nowIso();
    const max = db.get<{ m: number | null }>('SELECT MAX(sort) AS m FROM wos_spaces WHERE workspace_id = ?', ws)?.m ?? -1;
    db.run('INSERT INTO wos_spaces (id, workspace_id, type_id, name, icon, color, description, sort, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      id, ws, typeId, override.name ?? p.space.name, override.icon ?? p.space.icon, override.color ?? p.space.color, p.space.description, max + 1, at, at);
    p.views.forEach((v, i) => insertView(db, ws, `space:${id}`, v.name, v.kind, v.config, i));
    for (const a of p.automations) insertAutomation(db, ws, id, { name: a.name, enabled: true, trigger: a.trigger, action: a.action });
    const type = getType(db, ws, typeId)!;
    p.items.forEach((it, i) => insertItem(db, ws, { id, type }, { title: it.title, status: it.status ?? null, data: it.data ?? {}, due: it.due ?? null, start: it.start ?? null, sort: i }));
    return id;
  });
}

/** يصدّر مساحة كقالب (بدون العناصر افتراضيًا) */
export function spaceToTemplate(db: Db, ws: string, spaceId: string, withItems = false): TemplatePayload {
  const s = getSpace(db, ws, spaceId);
  if (!s) throw new ValidationError({ space: 'المساحة غير موجودة' });
  return {
    type: { name: s.type.name, icon: s.type.icon, color: s.type.color, fields: s.type.fields, statuses: s.type.statuses },
    space: { name: s.name, icon: s.icon, color: s.color, description: s.description },
    views: listViews(db, ws, `space:${spaceId}`).map((v) => ({ name: v.name, kind: v.kind, config: v.config })),
    automations: listAutomations(db, ws, spaceId).map((a) => ({ name: a.name, trigger: a.trigger, action: a.action })),
    items: withItems ? listItems(db, ws, spaceId).filter((i) => !i.parent_id).map((i) => ({ title: i.title, status: i.status, due: i.due, start: i.start, data: i.data })) : [],
  };
}

/* ───────── العناصر ───────── */
export function getItem(db: Db, ws: string, id: string): WosItem | null {
  const r = db.get<Row>('SELECT * FROM wos_items WHERE id = ? AND workspace_id = ?', id, ws);
  return r ? itemFromRow(r) : null;
}

export function listItems(db: Db, ws: string, spaceId: string, o: { archived?: boolean } = {}): WosItem[] {
  return db.all<Row>(`SELECT * FROM wos_items WHERE workspace_id = ? AND space_id = ? AND archived = ? ORDER BY sort, created_at`, ws, spaceId, o.archived ? 1 : 0).map(itemFromRow);
}

/** يتحقق من قيم الحقول ويحوّلها لأنواعها؛ يرمي ValidationError برسالة عربية */
export function cleanData(type: WosType, data: Record<string, unknown>, prev: Record<string, FieldValue> = {}): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  const known = new Map(type.fields.map((f) => [f.id, f]));
  // نحتفظ فقط بمفاتيح الحقول الموجودة (المفاتيح اليتيمة تسقط عند الكتابة — ADR-0004)
  for (const [k, v] of Object.entries(prev)) if (known.has(k)) out[k] = v;
  for (const [k, v] of Object.entries(data)) {
    const f = known.get(k);
    if (!f || COMPUTED_KINDS.has(f.kind)) continue;
    try {
      out[k] = coerceValue(f, v);
    } catch (e) {
      throw new ValidationError({ [k]: (e as Error).message });
    }
  }
  for (const f of type.fields) if (f.required && (out[f.id] === null || out[f.id] === undefined || out[f.id] === '')) throw new ValidationError({ [f.id]: `«${f.name}» مطلوب` });
  return out;
}

export interface ItemInput { title: string; status?: string | null; parent_id?: string | null; data?: Record<string, unknown>; start?: string | null; due?: string | null; sort?: number }
export function insertItem(db: Db, ws: string, sp: { id: string; type: WosType }, i: ItemInput): WosItem {
  const id = newId();
  const at = nowIso();
  const status = i.status && sp.type.statuses.some((s) => s.id === i.status) ? i.status : (sp.type.statuses[0]?.id ?? null);
  if (i.parent_id) {
    const p = getItem(db, ws, i.parent_id);
    if (!p || p.space_id !== sp.id) throw new ValidationError({ parent_id: 'العنصر الأب غير موجود في هذه المساحة' });
  }
  const sort = i.sort ?? (db.get<{ m: number | null }>('SELECT MAX(sort) AS m FROM wos_items WHERE space_id = ?', sp.id)?.m ?? -1) + 1;
  db.run('INSERT INTO wos_items (id, workspace_id, space_id, parent_id, title, status, data, start, due, sort, done_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id, ws, sp.id, i.parent_id ?? null, i.title, status, JSON.stringify(cleanData(sp.type, i.data ?? {})), i.start ?? null, i.due ?? null, sort,
    isDoneStatus(sp.type.statuses, status) ? at : null, at, at);
  return getItem(db, ws, id)!;
}

export interface ItemPatch { title?: string; status?: string | null; parent_id?: string | null; data?: Record<string, unknown>; start?: string | null; due?: string | null; sort?: number; archived?: boolean; space_id?: string }
/** يطبّق تعديلًا؛ يتحقق من مسار الحالات (Jira-style validators) */
export function patchItem(db: Db, ws: string, cur: WosItem, type: WosType, p: ItemPatch, opts: { enforceTransitions?: boolean } = {}): WosItem {
  let status = cur.status;
  if (p.status !== undefined && p.status !== cur.status) {
    if (p.status === null || !type.statuses.some((s) => s.id === p.status)) throw new ValidationError({ status: 'حالة غير معروفة' });
    if (opts.enforceTransitions !== false && !canTransition(type.statuses, cur.status, p.status)) {
      const from = statusOf(type.statuses, cur.status)?.name ?? cur.status;
      throw new ValidationError({ status: `لا يمكن الانتقال من «${from}» إلى «${statusOf(type.statuses, p.status)?.name}» في هذا المسار` });
    }
    status = p.status;
  }
  const doneNow = isDoneStatus(type.statuses, status);
  const done_at = doneNow ? (cur.done_at ?? nowIso()) : null;
  const data = p.data ? cleanData(type, p.data, cur.data) : cur.data;
  db.run('UPDATE wos_items SET title=?, status=?, parent_id=?, data=?, start=?, due=?, sort=?, archived=?, space_id=?, done_at=?, updated_at=? WHERE id=? AND workspace_id=?',
    p.title ?? cur.title, status, p.parent_id !== undefined ? p.parent_id : cur.parent_id, JSON.stringify(data),
    p.start !== undefined ? p.start : cur.start, p.due !== undefined ? p.due : cur.due, p.sort ?? cur.sort,
    p.archived !== undefined ? (p.archived ? 1 : 0) : cur.archived ? 1 : 0, p.space_id ?? cur.space_id, done_at, nowIso(), cur.id, ws);
  return getItem(db, ws, cur.id)!;
}

/** الحقول المحسوبة: معادلات + تجميع (من العناصر الفرعية أو الروابط) */
export function withComputed(db: Db, ws: string, type: WosType, items: WosItem[]): WosItem[] {
  const formulas = type.fields.filter((f) => f.kind === 'formula' && f.formula);
  const rollups = type.fields.filter((f) => f.kind === 'rollup' && f.rollup);
  if (!formulas.length && !rollups.length) return items;
  const children = new Map<string, WosItem[]>();
  if (rollups.some((r) => r.rollup!.source === 'children')) {
    const spaceIds = [...new Set(items.map((i) => i.space_id))];
    for (const sid of spaceIds) for (const c of listItems(db, ws, sid)) if (c.parent_id) children.set(c.parent_id, [...(children.get(c.parent_id) ?? []), c]);
  }
  const byName = new Map<string, FieldDef>();
  for (const f of type.fields) {
    byName.set(f.name, f);
    byName.set(f.id, f);
  }
  return items.map((it) => {
    const computed: Record<string, FieldValue> = {};
    for (const f of rollups) {
      const spec = f.rollup!;
      let src: WosItem[] = [];
      if (spec.source === 'children') src = children.get(it.id) ?? [];
      else {
        const refs = db.all<{ other: string }>("SELECT CASE WHEN src = ? THEN dst ELSE src END AS other FROM wos_relations WHERE workspace_id = ? AND (src = ? OR dst = ?)", `wos:${it.id}`, ws, `wos:${it.id}`, `wos:${it.id}`);
        src = refs.filter((r) => r.other.startsWith('wos:')).map((r) => getItem(db, ws, r.other.slice(4))).filter((x): x is WosItem => !!x);
      }
      const nums = spec.field ? src.map((x) => Number(x.data[spec.field!])).filter((n) => Number.isFinite(n)) : [];
      computed[f.id] =
        spec.agg === 'count' ? src.length
        : spec.agg === 'percent_done' ? (src.length ? Math.round((src.filter((x) => x.done_at).length / src.length) * 100) : null)
        : !nums.length ? null
        : spec.agg === 'sum' ? nums.reduce((a, b) => a + b, 0)
        : spec.agg === 'avg' ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
        : spec.agg === 'min' ? Math.min(...nums)
        : Math.max(...nums);
    }
    const get = (name: string): FVal => {
      if (name === 'title' || name === 'العنوان') return it.title;
      if (name === 'status' || name === 'الحالة') return it.status;
      if (name === 'due' || name === 'الموعد') return it.due;
      if (name === 'start' || name === 'البداية') return it.start;
      const f = byName.get(name);
      if (!f) return null;
      const v = computed[f.id] ?? it.data[f.id];
      return v === undefined || (typeof v === 'object' && v !== null) ? null : (v as FVal);
    };
    for (const f of formulas) computed[f.id] = evaluateFormula(f.formula!, get) as FieldValue;
    return { ...it, computed };
  });
}

/* ───────── العروض ───────── */
export function listViews(db: Db, ws: string, scope: string): WosView[] {
  return db.all<Row>('SELECT * FROM wos_views WHERE workspace_id = ? AND scope = ? ORDER BY sort, created_at', ws, scope).map(viewFromRow);
}
export function insertView(db: Db, ws: string, scope: string, name: string, kind: ViewKind, config: ViewConfig, sort?: number): string {
  const id = newId();
  const at = nowIso();
  const s = sort ?? (db.get<{ m: number | null }>('SELECT MAX(sort) AS m FROM wos_views WHERE workspace_id = ? AND scope = ?', ws, scope)?.m ?? -1) + 1;
  db.run('INSERT INTO wos_views (id, workspace_id, scope, name, kind, config, sort, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)', id, ws, scope, name, kind, JSON.stringify(config), s, at, at);
  return id;
}

/* ───────── الأتمتة ───────── */
export function listAutomations(db: Db, ws: string, spaceId?: string): Automation[] {
  return (spaceId
    ? db.all<Row>('SELECT * FROM wos_automations WHERE workspace_id = ? AND space_id = ? ORDER BY created_at', ws, spaceId)
    : db.all<Row>('SELECT * FROM wos_automations WHERE workspace_id = ? ORDER BY created_at', ws)
  ).map(automationFromRow);
}
export function insertAutomation(db: Db, ws: string, spaceId: string, a: Pick<Automation, 'name' | 'enabled' | 'trigger' | 'action'>): string {
  const id = newId();
  db.run('INSERT INTO wos_automations (id, workspace_id, space_id, name, enabled, trigger, action, created_at) VALUES (?,?,?,?,?,?,?,?)', id, ws, spaceId, a.name, a.enabled ? 1 : 0, JSON.stringify(a.trigger), JSON.stringify(a.action), nowIso());
  return id;
}
