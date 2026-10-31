import express from 'express';
import { z } from 'zod';
import type { Db } from './db.js';
import { newId } from './repo.js';
import { parseOrThrow } from './validation.js';
import { CodedError, nowIso, wrap } from './kitchenRoutes.js';
import { resolveEvents } from './calendarStore.js';
import {
  buildExportJson, buildExportText, dateOf, evaluateDayTotals, fixGramsText, gramsIssues, isDate, lintProposal, mealEventsOf,
  type CalEvent, type EventFields, type ExportItem, type LintResult, type ProposalDraft,
} from '../shared/calendar/index.js';

/**
 * طابور الاقتراحات (K-M11): كل تغيير يستهدف Outlook اقتراح فقط. المنصة لا تكتب في Outlook ولا في ملفات راشد أبدًا:
 * تُنتج الاقتراح بعد فحص CAL-43 ثم تُصدّره (JSON + نص) ليُنفَّذ عند راشد بـ«رن» منفصلة، ثم يُوسَم مطبّقًا يدويًا (CAL-40…48).
 */
const wallS = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const fields = z.object({ title: z.string().trim().min(1).max(300), start: wallS, end: wallS, description: z.string().max(8000).default(''), categories: z.array(z.string().max(60)).max(20).default([]), show_as: z.enum(['busy', 'free']).optional() });
const draftBody = z.object({
  kind: z.enum(['create', 'update', 'delete']),
  calendar: z.string().trim().min(1).max(60),
  event_id: z.string().max(200).nullable().default(null),
  series: z.string().max(200).nullable().default(null),
  before: fields.nullable().default(null),
  after: fields.nullable().default(null),
  reason: z.string().trim().min(3).max(400),
  explicit: z.boolean().default(false),
  exceptions: z.array(z.object({ date: z.string().max(10), note: z.string().max(200) })).max(200).default([]),
  no_exceptions: z.boolean().default(false),
});
const dateQ = z.string().refine(isDate, 'تاريخ غير صالح');
const fromPlanBody = z.object({ date: dateQ, times: z.object({ 'فطور': z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(), 'غداء': z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional(), 'عشاء': z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) }).optional() }).default({}) });
const fixBody = z.object({ from: dateQ, to: dateQ, dry_run: z.boolean().default(false) });
const statusBody = z.object({ status: z.enum(['pending', 'approved', 'applied', 'rejected']) });
const exportBody = z.object({ ids: z.array(z.string().max(60)).max(500).optional(), include: z.enum(['approved', 'pending', 'all']).default('approved') });

interface PRow { id: string; kind: string; calendar: string; event_id: string | null; series: string | null; date: string; before_json: string | null; after_json: string | null; reason: string; exceptions: string; explicit: number; lint: string; status: string; batch: string | null; created_at: string; updated_at: string; decided_at: string | null; exported_at: string | null }
const view = (r: PRow) => ({
  id: r.id, kind: r.kind, calendar: r.calendar, event_id: r.event_id, series: r.series, date: r.date,
  before: r.before_json ? (JSON.parse(r.before_json) as EventFields) : null, after: r.after_json ? (JSON.parse(r.after_json) as EventFields) : null,
  reason: r.reason, exceptions: JSON.parse(r.exceptions) as { date: string; note: string }[], explicit: !!r.explicit, lint: JSON.parse(r.lint) as LintResult,
  status: r.status, batch: r.batch, created_at: r.created_at, updated_at: r.updated_at, decided_at: r.decided_at, exported_at: r.exported_at,
});
const fieldsOf = (e: CalEvent): EventFields => ({ title: e.title, start: e.start, end: e.end, description: e.description, categories: e.categories, show_as: e.show_as });

const ALLOWED: Record<string, string[]> = { pending: ['approved', 'rejected'], approved: ['applied', 'rejected', 'pending'], rejected: ['pending'], applied: [] };

export function mountProposals(r: express.Router, deps: { db: () => Db }): void {
  const { db } = deps;
  const actor = (req: express.Request): string => String(req.headers['x-kitchen-client'] ?? '');
  const audit = (d: Db, req: express.Request, action: string, id: string | null, detail: unknown): void => {
    d.run('INSERT INTO calendar_audit (id, at, actor, action, proposal_id, detail) VALUES (?,?,?,?,?,?)', newId(), nowIso(), actor(req), action, id, JSON.stringify(detail));
  };

  /** يفحص CAL-43 على أحداث الأيام التي يمسّها الاقتراح، ثم يحفظه pending؛ أي خطأ فحص يمنع الإنشاء */
  const create = (d: Db, req: express.Request, draft: ProposalDraft, events: readonly CalEvent[], batch: string | null): { id: string; lint: LintResult } => {
    const lint = lintProposal(draft, events);
    if (!lint.ok) throw new CodedError(422, 'lint', `رُفض الاقتراح: ${lint.errors.map((e) => `${e.code} ${e.msg}`).join(' | ')}`, { errors: lint.errors, warnings: lint.warnings });
    const id = newId();
    const at = nowIso();
    const date = dateOf((draft.after ?? draft.before)!.start);
    d.run('INSERT INTO calendar_proposals (id, kind, calendar, event_id, series, date, before_json, after_json, reason, exceptions, explicit, lint, status, batch, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      id, draft.kind, draft.calendar, draft.event_id, draft.series, date, draft.before ? JSON.stringify(draft.before) : null, draft.after ? JSON.stringify(draft.after) : null, draft.reason, JSON.stringify(draft.exceptions ?? []), draft.explicit ? 1 : 0, JSON.stringify(lint), 'pending', batch, at, at);
    audit(d, req, 'create', id, { kind: draft.kind, calendar: draft.calendar, event_id: draft.event_id, before: draft.before, after: draft.after });
    return { id, lint };
  };
  const eventsAround = (d: Db, a: string, b: string): CalEvent[] => resolveEvents(d, a, b, 'auto').events;

  r.get('/proposals', wrap((req, res) => {
    const st = String(req.query['status'] ?? '');
    const rows = (st ? db().all<PRow>('SELECT * FROM calendar_proposals WHERE status = ? ORDER BY date, created_at', st) : db().all<PRow>('SELECT * FROM calendar_proposals ORDER BY date, created_at')).map(view);
    const counts = Object.fromEntries(db().all<{ status: string; n: number }>('SELECT status, COUNT(*) n FROM calendar_proposals GROUP BY status').map((x) => [x.status, x.n]));
    res.json({ proposals: rows, counts });
  }));

  r.post('/proposals', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(draftBody, req.body);
    const dates = [...new Set([b.before?.start, b.after?.start, b.before?.end, b.after?.end].filter((x): x is string => !!x).map(dateOf))].sort();
    if (!dates.length) throw new CodedError(400, 'shape', 'اقتراح بلا قبل ولا بعد');
    const events = eventsAround(d, dates[0]!, dates[dates.length - 1]!);
    if (b.kind !== 'create' && !events.some((e) => e.id === b.event_id)) throw new CodedError(404, 'event_not_found', 'الحدث غير موجود في المصدر الحالي للجدول');
    const out = create(d, req, { ...b, ...(b.explicit ? { explicit: true } : {}) } as ProposalDraft, events, null);
    res.status(201).json({ id: out.id, lint: out.lint });
  }));

  /** J6: يوم محفوظ في الخطة ← اقتراح تحديث وصف حدث كل وجبة بالقالب الحرفي 2.6؛ لا يُكتب شيء في Outlook */
  r.post('/proposals/from-plan', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(fromPlanBody, req.body);
    const row = d.get<{ slots: string; total_kcal: number; status: string }>('SELECT slots, total_kcal, status FROM kitchen_plan_days WHERE date = ?', b.date);
    if (!row) throw new CodedError(404, 'no_plan', 'لا اقتراح محفوظ لهذا اليوم في خطة الوجبات');
    const slots = JSON.parse(row.slots) as { slot: '' | 'فطور' | 'غداء' | 'عشاء'; title_ar: string; body_text: string; nutrition: Record<string, number> }[];
    // LAW-02-5: لا اقتراح ليوم مكتمل خارج المجال حتى لو وُجد محفوظًا بطريق ما
    const law = evaluateDayTotals(slots.map((s) => ({ slot: s.slot, kcal: s.nutrition['kcal'] ?? 0 })));
    if (!law.ok) throw new CodedError(422, 'law', 'اليوم المحفوظ خارج قانون السعرات: لا يُنتَج منه اقتراح.');
    const events = eventsAround(d, b.date, b.date);
    const { bySlot } = mealEventsOf(events, b.date);
    const batch = newId();
    const created: { slot: string; id: string; kind: string; warnings: number }[] = [];
    const rejected: { slot: string; errors: { code: string; msg: string }[] }[] = [];
    const skipped: { slot: string; reason: string }[] = [];
    d.tx(() => {
      for (const s of slots) {
        const ev = s.slot ? bySlot[s.slot] : undefined;
        let draft: ProposalDraft;
        if (ev) {
          const before = fieldsOf(ev);
          if (before.description === s.body_text) { skipped.push({ slot: s.slot, reason: 'الوصف في Outlook مطابق للقالب أصلًا' }); continue; }
          draft = { kind: 'update', calendar: ev.calendar, event_id: ev.id, series: ev.series, before, after: { ...before, description: s.body_text }, reason: `تحديث وصف «${s.slot}» ببطاقة «${s.title_ar}» من خطة الوجبات (قالب 2.6)`, exceptions: [], no_exceptions: !ev.series };
        } else {
          const t = s.slot ? b.times[s.slot] : undefined;
          if (!t) { skipped.push({ slot: s.slot, reason: 'لا حدث مقابل في Outlook: حدّد وقتًا لإنشائه أو أنشئه هناك' }); continue; }
          draft = { kind: 'create', calendar: 'روتين وصحة', event_id: null, series: null, before: null, after: { title: s.slot, start: `${b.date}T${t.start}`, end: `${b.date}T${t.end}`, description: s.body_text, categories: [] }, reason: `إنشاء حدث «${s.slot}» ببطاقة «${s.title_ar}» من خطة الوجبات`, exceptions: [] };
        }
        // اقتراح معلّق سابق لنفس الحدث/اليوم يُستبدل (لا تكرار)
        d.run("DELETE FROM calendar_proposals WHERE status = 'pending' AND date = ? AND ((event_id IS NOT NULL AND event_id = ?) OR (event_id IS NULL AND kind = 'create' AND json_extract(after_json, '$.title') = ?))", b.date, draft.event_id, s.slot);
        try {
          const o = create(d, req, draft, events, batch);
          created.push({ slot: s.slot, id: o.id, kind: draft.kind, warnings: o.lint.warnings.length });
        } catch (e) {
          if (e instanceof CodedError && e.code === 'lint') rejected.push({ slot: s.slot, errors: e.extra['errors'] as { code: string; msg: string }[] });
          else throw e;
        }
      }
    });
    res.status(created.length ? 201 : 200).json({ date: b.date, batch, created, rejected, skipped, note: 'لم يُكتب شيء في Outlook: الاقتراحات تُصدَّر لراشد وتُنفَّذ بـ«رن» منفصلة.' });
  }));

  /** DEF-10/CAL-45: أوصاف Outlook بصياغة غرام خاطئة ← قائمة إصلاحات كاقتراحات (لا إصلاح تلقائي) */
  r.post('/proposals/fix-grams', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(fixBody, req.body);
    if (b.to < b.from) throw new CodedError(400, 'bad_range', 'نهاية المدى قبل بدايته');
    if (Math.round((Date.parse(`${b.to}T00:00:00Z`) - Date.parse(`${b.from}T00:00:00Z`)) / 86_400_000) > 120) throw new CodedError(400, 'range_too_big', 'المدى أكبر من 120 يومًا');
    const events = eventsAround(d, b.from, b.to);
    const found = events.filter((e) => e.description && gramsIssues(e.description).length);
    const list = found.map((e) => ({ event_id: e.id, title: e.title, date: dateOf(e.start), changes: fixGramsText(e.description).changes }));
    if (b.dry_run) return void res.json({ found: list.length, list, created: [], rejected: [] });
    const batch = newId();
    const created: string[] = [];
    const rejected: { event_id: string; errors: { code: string; msg: string }[] }[] = [];
    d.tx(() => {
      for (const e of found) {
        const before = fieldsOf(e);
        const fx = fixGramsText(e.description);
        d.run("DELETE FROM calendar_proposals WHERE status = 'pending' AND event_id = ? AND date = ?", e.id, dateOf(e.start));
        try {
          created.push(create(d, req, { kind: 'update', calendar: e.calendar, event_id: e.id, series: e.series, before, after: { ...before, description: fx.text }, reason: `إصلاح صياغة الغرام في الوصف (DEF-10): ${fx.changes.slice(0, 3).map((c) => `«${c.from}» ← «${c.to}»`).join('، ')}`, exceptions: [], no_exceptions: !e.series }, events, batch).id);
        } catch (err) {
          if (err instanceof CodedError && err.code === 'lint') rejected.push({ event_id: e.id, errors: err.extra['errors'] as { code: string; msg: string }[] });
          else throw err;
        }
      }
    });
    res.status(created.length ? 201 : 200).json({ found: list.length, list, created, rejected, batch });
  }));

  r.patch('/proposals/:id', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(statusBody, req.body);
    const id = String(req.params['id']);
    const row = d.get<PRow>('SELECT * FROM calendar_proposals WHERE id = ?', id);
    if (!row) throw new CodedError(404, 'not_found', 'اقتراح غير موجود');
    if (!(ALLOWED[row.status] ?? []).includes(b.status)) throw new CodedError(409, 'bad_transition', `لا انتقال من «${row.status}» إلى «${b.status}»`);
    if (b.status === 'applied' && !row.exported_at) throw new CodedError(409, 'not_exported', 'صدِّر الاقتراح لراشد أولًا ثم وسمه مطبّقًا بعد «رن» عنده.');
    d.tx(() => {
      d.run('UPDATE calendar_proposals SET status = ?, updated_at = ?, decided_at = ? WHERE id = ?', b.status, nowIso(), b.status === 'pending' ? null : nowIso(), id);
      audit(d, req, 'status', id, { from: row.status, to: b.status });
    });
    res.json({ proposal: view(d.get<PRow>('SELECT * FROM calendar_proposals WHERE id = ?', id)!) });
  }));

  r.delete('/proposals/:id', wrap((req, res) => {
    const d = db();
    const id = String(req.params['id']);
    const row = d.get<PRow>('SELECT * FROM calendar_proposals WHERE id = ?', id);
    if (!row) throw new CodedError(404, 'not_found', 'اقتراح غير موجود');
    if (row.status !== 'pending' && row.status !== 'rejected') throw new CodedError(409, 'locked', 'الاقتراح المعتمد أو المطبّق لا يُحذف (يبقى في السجل).');
    d.tx(() => {
      d.run('DELETE FROM calendar_proposals WHERE id = ?', id);
      audit(d, req, 'delete', id, { status: row.status });
    });
    res.json({ ok: true });
  }));

  /** CAL-42: تصدير بصيغتين (JSON لراشد + نص عربي) ووسم وقت التصدير. لا كتابة في راشد ولا Outlook. */
  r.post('/proposals/export', wrap((req, res) => {
    const d = db();
    const b = parseOrThrow(exportBody, req.body ?? {});
    const rows = (b.ids?.length
      ? d.all<PRow>(`SELECT * FROM calendar_proposals WHERE id IN (${b.ids.map(() => '?').join(',')}) ORDER BY date, created_at`, ...b.ids)
      : d.all<PRow>(b.include === 'all' ? 'SELECT * FROM calendar_proposals ORDER BY date, created_at' : 'SELECT * FROM calendar_proposals WHERE status = ? ORDER BY date, created_at', ...(b.include === 'all' ? [] : [b.include]))).filter((x) => x.status !== 'rejected');
    if (!rows.length) throw new CodedError(422, 'nothing_to_export', 'لا اقتراحات معتمدة للتصدير: اعتمد اقتراحًا أولًا.');
    const items: ExportItem[] = rows.map((x) => { const v = view(x); return { id: v.id, kind: v.kind as ExportItem['kind'], calendar: v.calendar, event_id: v.event_id, series: v.series, before: v.before, after: v.after, reason: v.reason, exceptions: v.exceptions, lint_warnings: v.lint.warnings, created_at: v.created_at }; });
    const at = nowIso();
    d.tx(() => {
      for (const x of rows) d.run('UPDATE calendar_proposals SET exported_at = ? WHERE id = ?', at, x.id);
      audit(d, req, 'export', null, { ids: rows.map((x) => x.id) });
    });
    res.json({ count: items.length, json: buildExportJson(items), text: buildExportText(items), exported_at: at });
  }));

  r.get('/audit', wrap((_req, res) => {
    res.json({ audit: db().all<{ id: string; at: string; actor: string; action: string; proposal_id: string | null; detail: string }>('SELECT * FROM calendar_audit ORDER BY at DESC LIMIT 200').map((a) => ({ ...a, detail: JSON.parse(a.detail) as unknown })) });
  }));
}
