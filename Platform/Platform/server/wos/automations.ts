/** محرك الأتمتة المحلي: «عندما … ثم …». حتمي، مسجَّل في السجل، وقابل للتراجع (ADR-0005). */
import type { Db } from '../db.js';
import { getItem, getSpace, insertItem, listAutomations, patchItem } from './repo.js';
import { notify, record } from './core.js';
import type { Automation, FieldValue, WosItem, WosType } from '../../shared/wos.js';

const MAX_DEPTH = 3;

export function localToday(d = new Date()): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function shiftDay(iso: string, every: 'day' | 'week' | 'month'): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (every === 'day') dt.setUTCDate(dt.getUTCDate() + 1);
  else if (every === 'week') dt.setUTCDate(dt.getUTCDate() + 7);
  else dt.setUTCMonth(dt.getUTCMonth() + 1);
  return dt.toISOString().slice(0, 10);
}
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function matches(a: Automation, ev: { kind: 'created' | 'updated'; before?: WosItem; after: WosItem }): boolean {
  const t = a.trigger;
  if (t.kind === 'item_created') return ev.kind === 'created';
  if (ev.kind !== 'updated' || !ev.before) return false;
  if (t.kind === 'status_changed') return ev.before.status !== ev.after.status && (!t.to || ev.after.status === t.to);
  if (t.kind === 'field_changed') {
    if (!t.field) return !same(ev.before.data, ev.after.data);
    if (t.field === 'due' || t.field === 'start' || t.field === 'title') return ev.before[t.field] !== ev.after[t.field];
    return !same(ev.before.data[t.field], ev.after.data[t.field]);
  }
  return false;
}

/** يُنفَّذ بعد كل إنشاء/تعديل عنصر. يعيد عدد القواعد التي عملت. */
export function runItemEvent(db: Db, ws: string, ev: { kind: 'created' | 'updated'; before?: WosItem; after: WosItem }, depth = 0): number {
  if (depth >= MAX_DEPTH) return 0;
  const rules = listAutomations(db, ws, ev.after.space_id).filter((a) => a.enabled && a.trigger.kind !== 'due_soon' && matches(a, ev));
  let n = 0;
  for (const a of rules) {
    const cur = getItem(db, ws, ev.after.id);
    if (!cur) break;
    if (execute(db, ws, a, cur, depth)) n++;
  }
  return n;
}

/** تنفيذ الإجراء على عنصر */
export function execute(db: Db, ws: string, a: Automation, item: WosItem, depth: number): boolean {
  const sp = getSpace(db, ws, item.space_id);
  if (!sp) return false;
  const type: WosType = sp.type;
  const actor = `automation:${a.id}`;
  const x = a.action;
  const apply = (patch: Parameters<typeof patchItem>[4], summary: string): void => {
    const after = patchItem(db, ws, item, type, patch, { enforceTransitions: false });
    record(db, ws, { ref: `wos:${item.id}`, action: 'update', summary: `أتمتة «${a.name}»: ${summary}`, before: item, after, actor });
    runItemEvent(db, ws, { kind: 'updated', before: item, after }, depth + 1);
  };
  let ran = true;
  switch (x.kind) {
    case 'set_status':
      if (!x.status || item.status === x.status || !type.statuses.some((s) => s.id === x.status)) ran = false;
      else apply({ status: x.status }, `الحالة ← ${type.statuses.find((s) => s.id === x.status)?.name ?? x.status}`);
      break;
    case 'set_field': {
      if (!x.field) { ran = false; break; }
      const v: FieldValue = x.value === 'today' ? localToday() : x.value === 'now' ? new Date().toISOString() : ((x.value ?? null) as FieldValue);
      if (x.field === 'due' || x.field === 'start') {
        if (item[x.field] === v) { ran = false; break; }
        apply({ [x.field]: v === null ? null : String(v) }, `${x.field === 'due' ? 'الموعد' : 'البداية'} ← ${v ?? 'فارغ'}`);
      } else {
        if (same(item.data[x.field], v)) { ran = false; break; }
        apply({ data: { [x.field]: v } }, `${type.fields.find((f) => f.id === x.field)?.name ?? x.field} ← ${String(v ?? 'فارغ')}`);
      }
      break;
    }
    case 'notify':
      notify(db, ws, { ref: `wos:${item.id}`, title: x.text?.trim() || a.name, body: `${item.title} · ${sp.name}`, source: actor });
      break;
    case 'create_next': {
      const every = x.every ?? 'week';
      const base = item.due ?? localToday();
      const next = insertItem(db, ws, sp, { title: item.title, data: item.data, due: shiftDay(base, every), start: item.start ? shiftDay(item.start, every) : null, parent_id: item.parent_id });
      record(db, ws, { ref: `wos:${next.id}`, action: 'create', summary: `أتمتة «${a.name}»: نسخة متكررة (${next.due})`, after: next, actor });
      break;
    }
    case 'archive':
      if (item.archived) ran = false;
      else apply({ archived: true }, 'أُرشف');
      break;
  }
  if (ran) db.run('UPDATE wos_automations SET runs = runs + 1, last_run = ? WHERE id = ?', new Date().toISOString(), a.id);
  return ran;
}

/** مسح زمني (idempotent): قواعد «عند اقتراب الموعد». */
export function dueSweep(db: Db, ws: string, today = localToday()): number {
  let n = 0;
  const rules = listAutomations(db, ws).filter((a) => a.enabled && a.trigger.kind === 'due_soon');
  for (const a of rules) {
    const days = a.trigger.days ?? 1;
    const items = db.all<{ id: string; due: string }>("SELECT id, due FROM wos_items WHERE workspace_id = ? AND space_id = ? AND archived = 0 AND done_at IS NULL AND due IS NOT NULL AND due >= ?", ws, a.space_id, today);
    for (const it of items) {
      const diff = Math.round((Date.parse(it.due) - Date.parse(today)) / 86_400_000);
      if (diff < 0 || diff > days) continue;
      const fresh = db.run('INSERT OR IGNORE INTO wos_auto_fired (automation_id, item_id, key, at) VALUES (?,?,?,?)', a.id, it.id, `due:${it.due}`, new Date().toISOString()).changes;
      if (!fresh) continue;
      const item = getItem(db, ws, it.id);
      if (item && execute(db, ws, a, item, 0)) n++;
    }
  }
  return n;
}

