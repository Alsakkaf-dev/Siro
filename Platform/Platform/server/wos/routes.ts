/** واجهة /api/wos — مساحاتي + الخدمات المشتركة (سجل، سلة، روابط، وارد، جدول أعمال، مشاركة). */
import express from 'express';
import type { Db } from '../db.js';
import type { Ctx } from '../routes.js';
import { HttpError } from '../routes.js';
import { getSetting, newId, setSetting } from '../repo.js';
import { currentActor } from '../actor.js';
import { ValidationError, parseOrThrow } from '../validation.js';
import {
  automationSchema, itemPatchSchema, itemSchema, relationSchema, spaceSchema, typeSchema, viewSchema, valueText,
  type WosItem, type WosType,
} from '../../shared/wos.js';
import { BLANK_TEMPLATE, BUILTIN_TEMPLATES, type TemplateInfo, type TemplatePayload } from '../../shared/templates.js';
import {
  addRelation, dropRelations, linksOf, listHistory, listTrash, notify, record, relationSnap, resolveRef, searchRefs, snapshot, trashPurge, trashPut, trashRestore, workspaceOf, type SnapSpec,
} from './core.js';
import {
  automationFromRow, createFromTemplate, getItem, getSpace, getType, insertAutomation, insertItem, insertView, itemFromRow, listAutomations, listItems, listSpaces, listViews, patchItem, spaceToTemplate, updateType, viewFromRow, withComputed,
} from './repo.js';
import { dueSweep, localToday, runItemEvent } from './automations.js';
import { agenda, academicEntries, itemEntries } from './agenda.js';

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
const isoDay = (v: unknown, d: string): string => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : d);
const addDays = (iso: string, n: number): string => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

/** لقطات الحذف لعنصر وكل فروعه وروابطها */
function itemTree(db: Db, ws: string, id: string): string[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) for (const c of db.all<{ id: string }>('SELECT id FROM wos_items WHERE parent_id = ? AND workspace_id = ?', out[i]!, ws)) out.push(c.id);
  return out;
}
function itemSnapSpecs(ids: string[], ws: string): SnapSpec[] {
  const ph = ids.map(() => '?').join(',');
  const refs = ids.map((i) => `wos:${i}`);
  const rph = refs.map(() => '?').join(',');
  return [
    // الآباء أولًا: نرتب حسب parent_id IS NULL ثم created_at كي تنجح القيود عند الاستعادة
    { table: 'wos_items', where: `id IN (${ph}) AND workspace_id = ? ORDER BY parent_id IS NOT NULL, created_at`, params: [...ids, ws] },
    { table: 'wos_relations', where: `workspace_id = ? AND (src IN (${rph}) OR dst IN (${rph}))`, params: [ws, ...refs, ...refs] },
  ];
}

export function templateList(db: Db, ws: string): TemplateInfo[] {
  const user = db.all<{ id: string; name: string; description: string | null; icon: string; color: string; payload: string }>('SELECT id, name, description, icon, color, payload FROM wos_templates WHERE workspace_id = ? ORDER BY created_at DESC', ws)
    .map((r) => ({ id: r.id, name: r.name, description: r.description ?? '', icon: r.icon, color: r.color, builtin: false, payload: JSON.parse(r.payload) as TemplatePayload }));
  return [...BUILTIN_TEMPLATES, ...user];
}

export function createWosRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = (): Db => ctx.getDb();
  const ws = (req: express.Request): string => workspaceOf(req);

  const spaceOr404 = (req: express.Request, id: string) => {
    const s = getSpace(db(), ws(req), id);
    if (!s) throw new HttpError(404, 'المساحة غير موجودة');
    return s;
  };
  const itemOr404 = (req: express.Request, id: string): { item: WosItem; type: WosType; space: NonNullable<ReturnType<typeof getSpace>> } => {
    const item = getItem(db(), ws(req), id);
    if (!item) throw new HttpError(404, 'العنصر غير موجود');
    const space = spaceOr404(req, item.space_id);
    return { item, type: space.type, space };
  };
  const fullItem = (req: express.Request, it: WosItem, type: WosType): WosItem => {
    const [x] = withComputed(db(), ws(req), type, [it]);
    return { ...x!, child_count: db().get<{ n: number }>('SELECT COUNT(*) AS n FROM wos_items WHERE parent_id = ?', it.id)?.n ?? 0 };
  };

  /* ───── الملف الشخصي (اسم المالك — لا أسماء مثبتة في المنطق) ───── */
  r.get('/profile', wrap((_req, res) => void res.json({ name: getSetting(db(), 'profile.name') })));
  r.put('/profile', wrap((req, res) => {
    const name = str((req.body as { name?: unknown } | undefined)?.name).trim().slice(0, 40);
    setSetting(db(), 'profile.name', name || null);
    res.json({ name: name || null });
  }));

  /* ───── المساحات ───── */
  r.get('/spaces', wrap((req, res) => void res.json(listSpaces(db(), ws(req), req.query['archived'] === '1'))));

  r.post('/spaces', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    let payload: TemplatePayload = BLANK_TEMPLATE;
    const tid = str(b['template_id']);
    if (tid) {
      const t = templateList(db(), ws(req)).find((x) => x.id === tid);
      if (!t) throw new ValidationError({ template_id: 'القالب غير موجود' });
      payload = t.payload;
    }
    const meta = parseOrThrow(spaceSchema, { name: b['name'] ?? payload.space.name, icon: b['icon'] ?? payload.space.icon, color: b['color'] ?? payload.space.color, description: b['description'] ?? payload.space.description, type: b['type'] });
    if (meta.type) payload = { ...payload, type: meta.type };
    const id = createFromTemplate(db(), ws(req), { ...payload, space: { ...payload.space, description: meta.description } }, { name: meta.name, icon: meta.icon, color: meta.color });
    record(db(), ws(req), { ref: `space:${id}`, action: 'create', summary: `أُنشئت المساحة «${meta.name}»${tid ? ` من قالب` : ''}` });
    res.status(201).json(getSpace(db(), ws(req), id));
  }));

  r.put('/spaces/order', wrap((req, res) => {
    const ids = (req.body as { ids?: unknown } | undefined)?.ids;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) throw new ValidationError({ ids: 'قائمة معرّفات مطلوبة' });
    db().tx(() => (ids as string[]).forEach((x, i) => db().run('UPDATE wos_spaces SET sort = ? WHERE id = ? AND workspace_id = ?', i, x, ws(req))));
    res.json(listSpaces(db(), ws(req)));
  }));

  r.get('/spaces/:id', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const archived = req.query['archived'] === '1';
    const items = withComputed(db(), ws(req), s.type, listItems(db(), ws(req), s.id, { archived }));
    const counts = new Map<string, number>();
    for (const i of items) if (i.parent_id) counts.set(i.parent_id, (counts.get(i.parent_id) ?? 0) + 1);
    res.json({ space: s, items: items.map((i) => ({ ...i, child_count: counts.get(i.id) ?? 0 })), views: listViews(db(), ws(req), `space:${s.id}`), automations: listAutomations(db(), ws(req), s.id) });
  }));

  r.patch('/spaces/:id', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const b = (req.body ?? {}) as Record<string, unknown>;
    const m = parseOrThrow(spaceSchema, { name: b['name'] ?? s.name, icon: b['icon'] ?? s.icon, color: b['color'] ?? s.color, description: b['description'] !== undefined ? b['description'] : s.description });
    const archived = b['archived'] === undefined ? s.archived : b['archived'] === true;
    db().run('UPDATE wos_spaces SET name=?, icon=?, color=?, description=?, archived=?, updated_at=? WHERE id=?', m.name, m.icon, m.color, m.description, archived ? 1 : 0, new Date().toISOString(), s.id);
    record(db(), ws(req), { ref: `space:${s.id}`, action: 'update', summary: archived !== s.archived ? (archived ? `أُرشفت المساحة «${m.name}»` : `أُعيدت المساحة «${m.name}»`) : `عُدّلت المساحة «${m.name}»` });
    res.json(getSpace(db(), ws(req), s.id));
  }));

  r.put('/spaces/:id/type', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const t = parseOrThrow(typeSchema, req.body);
    db().tx(() => updateType(db(), ws(req), s.type_id, t));
    record(db(), ws(req), { ref: `space:${s.id}`, action: 'update', summary: `عُدّلت حقول/حالات «${s.name}» (${t.fields.length} حقل، ${t.statuses.length} حالة)` });
    res.json(getSpace(db(), ws(req), s.id));
  }));

  r.delete('/spaces/:id', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const w = ws(req);
    const ids = db().all<{ id: string }>('SELECT id FROM wos_items WHERE space_id = ?', s.id).map((x) => x.id);
    const shared = (db().get<{ n: number }>('SELECT COUNT(*) AS n FROM wos_spaces WHERE type_id = ?', s.type_id)?.n ?? 0) > 1;
    const specs: SnapSpec[] = [
      ...(shared ? [] : [{ table: 'wos_types', where: 'id = ?', params: [s.type_id] }]),
      { table: 'wos_spaces', where: 'id = ?', params: [s.id] },
      ...(ids.length ? itemSnapSpecs(ids, w) : []),
      { table: 'wos_views', where: 'workspace_id = ? AND scope = ?', params: [w, `space:${s.id}`] },
      { table: 'wos_automations', where: 'space_id = ?', params: [s.id] },
      relationSnap(`space:${s.id}`, w),
    ];
    const token = db().tx(() => {
      const t = trashPut(db(), w, { kind: 'space', label: `المساحة «${s.name}»`, sets: snapshot(db(), specs) });
      for (const i of ids) dropRelations(db(), w, `wos:${i}`);
      dropRelations(db(), w, `space:${s.id}`);
      db().run('DELETE FROM wos_views WHERE workspace_id = ? AND scope = ?', w, `space:${s.id}`);
      db().run('DELETE FROM wos_spaces WHERE id = ?', s.id); // يحذف العناصر والأتمتة (CASCADE)
      if (!shared) db().run('DELETE FROM wos_types WHERE id = ?', s.type_id);
      record(db(), w, { ref: `space:${s.id}`, action: 'delete', summary: `حُذفت المساحة «${s.name}» (${ids.length} عنصر)` });
      return t;
    });
    res.json({ ok: true, undo: token });
  }));

  r.post('/spaces/:id/duplicate', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const withItems = (req.body as { with_items?: unknown } | undefined)?.with_items !== false;
    const p = spaceToTemplate(db(), ws(req), s.id, withItems);
    const id = createFromTemplate(db(), ws(req), p, { name: `${s.name} (نسخة)` });
    record(db(), ws(req), { ref: `space:${id}`, action: 'create', summary: `نُسخت المساحة «${s.name}»` });
    res.status(201).json(getSpace(db(), ws(req), id));
  }));

  r.post('/spaces/:id/save-template', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const b = (req.body ?? {}) as Record<string, unknown>;
    const name = str(b['name']).trim().slice(0, 80) || s.name;
    const payload = spaceToTemplate(db(), ws(req), s.id, b['with_items'] === true);
    const id = newId();
    db().run('INSERT INTO wos_templates (id, workspace_id, name, description, icon, color, payload, created_at) VALUES (?,?,?,?,?,?,?,?)', id, ws(req), name, str(b['description']).slice(0, 300) || null, s.icon, s.color, JSON.stringify(payload), new Date().toISOString());
    record(db(), ws(req), { ref: `space:${s.id}`, action: 'template', summary: `حُفظت «${s.name}» كقالب «${name}»` });
    res.status(201).json({ id, name });
  }));

  r.get('/spaces/:id/export', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const items = withComputed(db(), ws(req), s.type, listItems(db(), ws(req), s.id));
    const day = new Date().toISOString().slice(0, 10);
    const safe = s.name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'space';
    if (req.query['format'] === 'csv') {
      const fields = s.type.fields.filter((f) => f.kind !== 'relation');
      const esc = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const head = ['العنوان', 'الحالة', 'البداية', 'الموعد', ...fields.map((f) => f.name)];
      const lines = items.map((i) => [i.title, s.type.statuses.find((x) => x.id === i.status)?.name ?? '', i.start ?? '', i.due ?? '', ...fields.map((f) => valueText(f, i.computed?.[f.id] ?? i.data[f.id]))].map((v) => esc(String(v))).join(','));
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${safe}_${day}.csv`)}`);
      return void res.type('text/csv; charset=utf-8').send('﻿' + [head.map(esc).join(','), ...lines].join('\r\n'));
    }
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${safe}_${day}.json`)}`);
    res.type('application/json').send(JSON.stringify({ format: 'siro-space', version: 1, exported_at: new Date().toISOString(), template: spaceToTemplate(db(), ws(req), s.id, false), items }, null, 2));
  }));

  /* ───── العناصر ───── */
  r.post('/spaces/:id/items', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const i = parseOrThrow(itemSchema, req.body);
    const w = ws(req);
    const it = db().tx(() => {
      const it = insertItem(db(), w, s, { title: i.title, status: i.status ?? null, parent_id: i.parent_id ?? null, data: i.data, start: i.start ?? null, due: i.due ?? null, ...(i.sort !== undefined ? { sort: i.sort } : {}) });
      record(db(), w, { ref: `wos:${it.id}`, action: 'create', summary: `أُنشئ «${it.title}» في «${s.name}»`, after: it });
      runItemEvent(db(), w, { kind: 'created', after: it });
      return getItem(db(), w, it.id)!;
    });
    res.status(201).json(fullItem(req, it, s.type));
  }));

  r.get('/items/:id', wrap((req, res) => {
    const { item, type, space } = itemOr404(req, str(req.params['id']));
    const children = withComputed(db(), ws(req), type, db().all<Record<string, unknown>>('SELECT * FROM wos_items WHERE parent_id = ? ORDER BY sort, created_at', item.id).map(itemFromRow));
    res.json({ item: fullItem(req, item, type), space, children, links: linksOf(db(), ws(req), `wos:${item.id}`), history: listHistory(db(), ws(req), { ref: `wos:${item.id}`, limit: 50 }) });
  }));

  const applyPatch = (req: express.Request, id: string, body: unknown, actor = currentActor()): WosItem => {
    const { item, type } = itemOr404(req, id);
    const p = parseOrThrow(itemPatchSchema, body);
    const w = ws(req);
    if (p.space_id && p.space_id !== item.space_id) {
      const target = spaceOr404(req, p.space_id);
      if (target.type_id !== type.id) throw new ValidationError({ space_id: 'النقل متاح فقط بين مساحات من نفس النوع' });
    }
    if (p.parent_id && p.parent_id !== item.parent_id) {
      if (itemTree(db(), w, item.id).includes(p.parent_id)) throw new ValidationError({ parent_id: 'لا يمكن جعل العنصر فرعًا من نفسه' });
    }
    return db().tx(() => {
      const after = patchItem(db(), w, item, type, { ...p, ...(p.status === undefined ? {} : { status: p.status }) });
      const changed = Object.keys(p).filter((k) => JSON.stringify((item as unknown as Record<string, unknown>)[k]) !== JSON.stringify((after as unknown as Record<string, unknown>)[k]));
      if (changed.length) {
        const st = p.status && p.status !== item.status ? `الحالة ← ${type.statuses.find((x) => x.id === p.status)?.name}` : '';
        record(db(), w, { ref: `wos:${item.id}`, action: 'update', summary: `«${after.title}»: ${st || `تعديل ${changed.map((k) => (k === 'data' ? 'الحقول' : k === 'title' ? 'العنوان' : k === 'due' ? 'الموعد' : k === 'archived' ? (after.archived ? 'أرشفة' : 'إلغاء أرشفة') : k)).join('، ')}`}`, before: item, after, actor });
        runItemEvent(db(), w, { kind: 'updated', before: item, after });
      }
      return getItem(db(), w, item.id)!;
    });
  };

  r.patch('/items/:id', wrap((req, res) => {
    const it = applyPatch(req, str(req.params['id']), req.body);
    res.json(fullItem(req, it, itemOr404(req, it.id).type));
  }));

  const deleteItems = (req: express.Request, ids: string[], label: string): string => {
    const w = ws(req);
    const all = [...new Set(ids.flatMap((id) => itemTree(db(), w, id)))];
    return db().tx(() => {
      const token = trashPut(db(), w, { kind: 'items', label, sets: snapshot(db(), itemSnapSpecs(all, w)) });
      for (const i of all) dropRelations(db(), w, `wos:${i}`);
      for (const id of ids) {
        const it = getItem(db(), w, id);
        if (!it) continue;
        db().run('DELETE FROM wos_items WHERE id = ?', id);
        record(db(), w, { ref: `wos:${id}`, action: 'delete', summary: `حُذف «${it.title}»`, before: it });
      }
      return token;
    });
  };

  r.delete('/items/:id', wrap((req, res) => {
    const { item } = itemOr404(req, str(req.params['id']));
    res.json({ ok: true, undo: deleteItems(req, [item.id], `«${item.title}»`) });
  }));

  r.post('/items/:id/duplicate', wrap((req, res) => {
    const { item, space } = itemOr404(req, str(req.params['id']));
    const w = ws(req);
    const copy = db().tx(() => {
      const c = insertItem(db(), w, space, { title: `${item.title} (نسخة)`, status: item.status, parent_id: item.parent_id, data: item.data, start: item.start, due: item.due });
      record(db(), w, { ref: `wos:${c.id}`, action: 'create', summary: `نُسخ «${item.title}»`, after: c });
      return c;
    });
    res.status(201).json(fullItem(req, copy, space.type));
  }));

  r.post('/items/bulk', wrap((req, res) => {
    const b = (req.body ?? {}) as { ids?: unknown; op?: unknown; patch?: unknown; space_id?: unknown };
    if (!Array.isArray(b.ids) || !b.ids.length || b.ids.some((x) => typeof x !== 'string') || b.ids.length > 500) throw new ValidationError({ ids: 'اختر عنصرًا واحدًا على الأقل' });
    const ids = b.ids as string[];
    const op = str(b.op);
    if (op === 'delete') return void res.json({ ok: true, count: ids.length, undo: deleteItems(req, ids, `${ids.length} عنصر`) });
    const patch: Record<string, unknown> = op === 'archive' ? { archived: true } : op === 'unarchive' ? { archived: false } : op === 'move' ? { space_id: str(b.space_id) } : op === 'update' ? ((b.patch ?? {}) as Record<string, unknown>) : (() => { throw new ValidationError({ op: 'عملية غير معروفة' }); })();
    const errors: { id: string; error: string }[] = [];
    let ok = 0;
    for (const id of ids) {
      try {
        applyPatch(req, id, patch);
        ok++;
      } catch (e) {
        errors.push({ id, error: e instanceof ValidationError ? Object.values(e.fields).join('، ') : (e as Error).message });
      }
    }
    res.json({ ok: true, count: ok, errors });
  }));

  /* ───── العروض ───── */
  r.post('/views', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const scope = str(b['scope']);
    if (!/^(space:[A-Za-z0-9_-]+|everything)$/.test(scope)) throw new ValidationError({ scope: 'نطاق غير صالح' });
    if (scope.startsWith('space:')) spaceOr404(req, scope.slice(6));
    const v = parseOrThrow(viewSchema, b);
    const id = insertView(db(), ws(req), scope, v.name, v.kind, v.config as never);
    res.status(201).json(viewFromRow(db().get('SELECT * FROM wos_views WHERE id = ?', id)!));
  }));
  r.patch('/views/:id', wrap((req, res) => {
    const cur = db().get<Record<string, unknown>>('SELECT * FROM wos_views WHERE id = ? AND workspace_id = ?', str(req.params['id']), ws(req));
    if (!cur) throw new HttpError(404, 'العرض غير موجود');
    const old = viewFromRow(cur);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const v = parseOrThrow(viewSchema, { name: b['name'] ?? old.name, kind: b['kind'] ?? old.kind, config: b['config'] ?? old.config });
    db().run('UPDATE wos_views SET name=?, kind=?, config=?, sort=?, updated_at=? WHERE id=?', v.name, v.kind, JSON.stringify(v.config), typeof b['sort'] === 'number' ? b['sort'] : old.sort, new Date().toISOString(), old.id);
    res.json(viewFromRow(db().get('SELECT * FROM wos_views WHERE id = ?', old.id)!));
  }));
  r.delete('/views/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = db().get<{ name: string }>('SELECT name FROM wos_views WHERE id = ? AND workspace_id = ?', id, ws(req));
    if (!cur) throw new HttpError(404, 'العرض غير موجود');
    const token = trashPut(db(), ws(req), { kind: 'view', label: `العرض «${cur.name}»`, sets: snapshot(db(), [{ table: 'wos_views', where: 'id = ?', params: [id] }]) });
    db().run('DELETE FROM wos_views WHERE id = ?', id);
    res.json({ ok: true, undo: token });
  }));

  /* ───── الأتمتة ───── */
  r.post('/spaces/:id/automations', wrap((req, res) => {
    const s = spaceOr404(req, str(req.params['id']));
    const a = parseOrThrow(automationSchema, req.body);
    const id = insertAutomation(db(), ws(req), s.id, a as never);
    record(db(), ws(req), { ref: `space:${s.id}`, action: 'automation', summary: `أضيفت أتمتة «${a.name}» إلى «${s.name}»` });
    dueSweep(db(), ws(req));
    res.status(201).json(automationFromRow(db().get('SELECT * FROM wos_automations WHERE id = ?', id)!));
  }));
  r.get('/automations', wrap((req, res) => void res.json(listAutomations(db(), ws(req)))));
  r.patch('/automations/:id', wrap((req, res) => {
    const cur = db().get<Record<string, unknown>>('SELECT * FROM wos_automations WHERE id = ? AND workspace_id = ?', str(req.params['id']), ws(req));
    if (!cur) throw new HttpError(404, 'الأتمتة غير موجودة');
    const old = automationFromRow(cur);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const a = parseOrThrow(automationSchema, { name: b['name'] ?? old.name, enabled: b['enabled'] ?? old.enabled, trigger: b['trigger'] ?? old.trigger, action: b['action'] ?? old.action });
    db().run('UPDATE wos_automations SET name=?, enabled=?, trigger=?, action=? WHERE id=?', a.name, a.enabled ? 1 : 0, JSON.stringify(a.trigger), JSON.stringify(a.action), old.id);
    res.json(automationFromRow(db().get('SELECT * FROM wos_automations WHERE id = ?', old.id)!));
  }));
  r.delete('/automations/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = db().get<{ name: string }>('SELECT name FROM wos_automations WHERE id = ? AND workspace_id = ?', id, ws(req));
    if (!cur) throw new HttpError(404, 'الأتمتة غير موجودة');
    const token = trashPut(db(), ws(req), { kind: 'automation', label: `الأتمتة «${cur.name}»`, sets: snapshot(db(), [{ table: 'wos_automations', where: 'id = ?', params: [id] }]) });
    db().run('DELETE FROM wos_automations WHERE id = ?', id);
    res.json({ ok: true, undo: token });
  }));

  /* ───── القوالب ───── */
  r.get('/templates', wrap((req, res) => void res.json(templateList(db(), ws(req)))));
  r.delete('/templates/:id', wrap((req, res) => {
    const n = db().run('DELETE FROM wos_templates WHERE id = ? AND workspace_id = ?', str(req.params['id']), ws(req)).changes;
    if (!n) throw new HttpError(404, 'القالب غير موجود (القوالب الجاهزة لا تُحذف)');
    res.json({ ok: true });
  }));

  /* ───── الروابط والمراجع ───── */
  r.get('/refs', wrap((req, res) => void res.json(searchRefs(db(), ws(req), str(req.query['q']).slice(0, 80)))));
  r.get('/refs/resolve', wrap((req, res) => void res.json(resolveRef(db(), str(req.query['ref'])))));
  r.get('/links', wrap((req, res) => void res.json(linksOf(db(), ws(req), str(req.query['ref'])))));
  r.post('/relations', wrap((req, res) => {
    const v = parseOrThrow(relationSchema, req.body);
    for (const x of [v.src, v.dst]) if (resolveRef(db(), x).missing) throw new ValidationError({ dst: 'أحد الطرفين غير موجود' });
    let id: string;
    try {
      id = addRelation(db(), ws(req), v.src, v.dst, v.kind);
    } catch (e) {
      throw new ValidationError({ dst: (e as Error).message });
    }
    record(db(), ws(req), { ref: v.src, action: 'link', summary: `رُبط «${resolveRef(db(), v.src).title}» ← «${resolveRef(db(), v.dst).title}»` });
    res.status(201).json({ id, links: linksOf(db(), ws(req), v.src) });
  }));
  r.delete('/relations/:id', wrap((req, res) => {
    const id = str(req.params['id']);
    const cur = db().get<{ src: string; dst: string }>('SELECT src, dst FROM wos_relations WHERE id = ? AND workspace_id = ?', id, ws(req));
    if (!cur) throw new HttpError(404, 'الرابط غير موجود');
    const token = trashPut(db(), ws(req), { kind: 'relation', label: 'رابط', sets: snapshot(db(), [{ table: 'wos_relations', where: 'id = ?', params: [id] }]) });
    db().run('DELETE FROM wos_relations WHERE id = ?', id);
    record(db(), ws(req), { ref: cur.src, action: 'unlink', summary: `أُزيل رابط «${resolveRef(db(), cur.src).title}» ↔ «${resolveRef(db(), cur.dst).title}»` });
    res.json({ ok: true, undo: token });
  }));

  /* ───── السجل ───── */
  r.get('/history', wrap((req, res) => {
    const rows = listHistory(db(), ws(req), { ref: str(req.query['ref']) || undefined, limit: Number(req.query['limit']) || 100, before: str(req.query['before']) || undefined });
    res.json(rows.map((h) => {
      const info = resolveRef(db(), h.ref);
      return { ...h, title: info.title, to: info.to };
    }));
  }));
  r.post('/history/:id/revert', wrap((req, res) => {
    const h = db().get<{ ref: string; before: string | null; reverted: number; action: string }>('SELECT ref, before, reverted, action FROM wos_history WHERE id = ? AND workspace_id = ?', str(req.params['id']), ws(req));
    if (!h || !h.before || h.reverted || h.action !== 'update' || !h.ref.startsWith('wos:')) throw new HttpError(409, 'لا يمكن التراجع عن هذا الإدخال');
    const before = JSON.parse(h.before) as WosItem;
    const { item, type } = itemOr404(req, h.ref.slice(4));
    const w = ws(req);
    db().tx(() => {
      const after = patchItem(db(), w, item, type, { title: before.title, status: before.status, data: before.data, start: before.start, due: before.due, archived: before.archived, parent_id: before.parent_id }, { enforceTransitions: false });
      db().run('UPDATE wos_history SET reverted = 1 WHERE id = ?', str(req.params['id']));
      record(db(), w, { ref: h.ref, action: 'update', summary: `تراجع: «${after.title}» أُعيد لما كان عليه`, before: item, after });
    });
    res.json({ ok: true });
  }));

  /* ───── سلة المحذوفات ───── */
  r.get('/trash', wrap((req, res) => void res.json(listTrash(db(), ws(req)))));
  r.post('/trash/:token/restore', wrap((req, res) => {
    const e = trashRestore(db(), ws(req), str(req.params['token']));
    if (!e) throw new HttpError(410, 'انتهت صلاحية الاستعادة أو تمت مسبقًا');
    if (e.makeActive) setSetting(db(), 'active_semester_id', e.makeActive);
    record(db(), ws(req), { ref: 'trash', action: 'restore', summary: `استُعيد ${e.label}` });
    res.json({ ok: true, label: e.label, restored: e.restored });
  }));
  r.delete('/trash/:token', wrap((req, res) => void res.json({ ok: true, removed: trashPurge(db(), ws(req), str(req.params['token'])) })));
  r.delete('/trash', wrap((req, res) => void res.json({ ok: true, removed: trashPurge(db(), ws(req)) })));

  /* ───── الوارد ───── */
  r.get('/inbox', wrap((req, res) => {
    dueSweep(db(), ws(req));
    const rows = db().all<{ id: string; ref: string | null; title: string; body: string | null; source: string; read: number; at: string }>('SELECT * FROM wos_inbox WHERE workspace_id = ? ORDER BY at DESC LIMIT 200', ws(req));
    res.json(rows.map((x) => ({ ...x, read: x.read === 1, to: x.ref ? resolveRef(db(), x.ref).to : null })));
  }));
  r.post('/inbox/read', wrap((req, res) => {
    const ids = (req.body as { ids?: unknown } | undefined)?.ids;
    if (Array.isArray(ids)) for (const id of ids) db().run('UPDATE wos_inbox SET read = 1 WHERE id = ? AND workspace_id = ?', str(id), ws(req));
    else db().run('UPDATE wos_inbox SET read = 1 WHERE workspace_id = ?', ws(req));
    res.json({ ok: true });
  }));
  r.post('/inbox', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const title = str(b['title']).trim();
    if (!title) throw new ValidationError({ title: 'العنوان مطلوب' });
    notify(db(), ws(req), { title, body: str(b['body']) || null, source: 'user', ref: str(b['ref']) || null });
    res.status(201).json({ ok: true });
  }));

  /* ───── جدول الأعمال وكل شيء ───── */
  r.get('/agenda', wrap((req, res) => {
    const today = isoDay(req.query['today'], localToday());
    const from = isoDay(req.query['from'], today);
    const to = isoDay(req.query['to'], addDays(from, 6));
    if (Date.parse(to) - Date.parse(from) > 62 * 86_400_000) throw new ValidationError({ to: 'النطاق الأقصى شهران' });
    dueSweep(db(), ws(req), today);
    res.json({ today, from, to, ...agenda(db(), ws(req), from, to, today) });
  }));
  r.get('/everything', wrap((req, res) => {
    res.json({ spaces: listSpaces(db(), ws(req)), entries: [...academicEntries(db()), ...itemEntries(db(), ws(req))] });
  }));

  /* ───── المشاركة (رابط قراءة فقط) ───── */
  r.get('/shares', wrap((req, res) => void res.json(db().all('SELECT token, scope, view_id, created_at FROM wos_shares WHERE workspace_id = ? AND revoked = 0 AND scope = ?', ws(req), str(req.query['scope'])))));
  r.post('/shares', wrap((req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const scope = str(b['scope']);
    if (!scope.startsWith('space:')) throw new ValidationError({ scope: 'المشاركة متاحة للمساحات' });
    const s = spaceOr404(req, scope.slice(6));
    const token = `${newId()}${newId()}`;
    db().run('INSERT INTO wos_shares (token, workspace_id, scope, view_id, created_at) VALUES (?,?,?,?,?)', token, ws(req), scope, str(b['view_id']) || null, new Date().toISOString());
    record(db(), ws(req), { ref: scope, action: 'share', summary: `أُنشئ رابط قراءة فقط لـ «${s.name}»` });
    res.status(201).json({ token, url: `/p/${token}` });
  }));
  r.delete('/shares/:token', wrap((req, res) => {
    db().run('UPDATE wos_shares SET revoked = 1 WHERE token = ? AND workspace_id = ?', str(req.params['token']), ws(req));
    res.json({ ok: true });
  }));

  return r;
}

/** /api/public/:token — قراءة فقط، بلا أي كتابة */
export function createPublicRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  r.get('/:token', (req, res, next) => {
    try {
      const db = ctx.getDb();
      const sh = db.get<{ workspace_id: string; scope: string; view_id: string | null }>('SELECT workspace_id, scope, view_id FROM wos_shares WHERE token = ? AND revoked = 0', String(req.params['token']));
      if (!sh) throw new HttpError(404, 'الرابط غير صالح أو أُلغي');
      const s = getSpace(db, sh.workspace_id, sh.scope.slice(6));
      if (!s) throw new HttpError(404, 'المساحة لم تعد موجودة');
      const items = withComputed(db, sh.workspace_id, s.type, listItems(db, sh.workspace_id, s.id));
      const views = listViews(db, sh.workspace_id, `space:${s.id}`);
      res.json({ space: { name: s.name, icon: s.icon, color: s.color, description: s.description }, type: s.type, items, view: views.find((v) => v.id === sh.view_id) ?? views[0] ?? null });
    } catch (e) {
      next(e);
    }
  });
  return r;
}

export { getType };
