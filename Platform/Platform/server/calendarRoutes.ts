import express from 'express';
import { z } from 'zod';
import type { Ctx } from './routes.js';
import type { Db } from './db.js';
import { parseOrThrow } from './validation.js';
import { CodedError, nowIso, wrap } from './kitchenRoutes.js';
import { readContent } from './life.js';
import {
  MAX_RANGE_DAYS, TERM_WINDOW, addDays, daysBetween, fetchAllCalendars, holidaysIn, isDate, parseIcs, routineToEvents, verifyRange, wallMin,
  type CalEvent, type GraphCalendar, type RoutineDocLike, type SourceId,
} from '../shared/calendar/index.js';

/**
 * الجدول (K-M9): قراءة فقط. المصدر الأعلى Outlook (CAL-02)، ولا نصل إليه هنا إلا عبر (أ) Graph من الخادم بعلم/متغيرات بيئة، أو (ب) لقطة مستوردة ICS/JSON،
 * أو (ج) خريطة الروتين من راشد كقالب أسبوعي (ليست Outlook). لا كتابة في Outlook ولا في ملفات راشد من هذا الملف.
 */
const dateQ = z.string().refine(isDate, 'تاريخ غير صالح');
const wallS = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const jsonEvent = z.object({
  id: z.string().min(1).max(200).optional(),
  calendar: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(300),
  start: wallS,
  end: wallS,
  show_as: z.enum(['busy', 'free']).default('busy'),
  categories: z.array(z.string().max(60)).max(20).default([]),
  description: z.string().max(8000).default(''),
  series: z.string().max(200).nullable().default(null),
});
const importBody = z.object({
  format: z.enum(['ics', 'json']),
  text: z.string().min(2).max(4_500_000),
  calendar: z.string().trim().min(1).max(60).optional(),
  from: dateQ.optional(),
  to: dateQ.optional(),
});
const syncBody = z.object({ from: dateQ.default(TERM_WINDOW.from), to: dateQ.default(TERM_WINDOW.to) });

interface Row { source: string; id: string; calendar: string; title: string; start: string; end: string; show_as: string; categories: string; description: string; series: string | null; imported_at: string }
const toEvent = (r: Row): CalEvent => ({ id: r.id, source: r.source as SourceId, calendar: r.calendar, title: r.title, start: r.start, end: r.end, show_as: r.show_as === 'free' ? 'free' : 'busy', categories: JSON.parse(r.categories) as string[], description: r.description, series: r.series });

export type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export interface CalendarOpts { fetch?: FetchLike; env?: NodeJS.ProcessEnv }

interface SyncRow { source: string; last_sync: string; from_d: string | null; to_d: string | null; count: number; note: string | null }
/** أحداث محفوظة تمسّ المدى (لقطة import أو graph) */
export function storedEvents(db: Db, source: SourceId, from: string, to: string): CalEvent[] {
  return db.all<Row>('SELECT * FROM calendar_events WHERE source = ? AND end > ? AND start < ? ORDER BY start, end, id', source, `${from}T00:00`, `${addDays(to, 1)}T00:00`).map(toEvent);
}

export interface Resolved { source: SourceId | 'none'; events: CalEvent[]; note: string | null; holidays: { name_ar: string; from: string; to: string }[]; last_sync: string | null; routine_generated_at: string | null }
/** ترتيب التفضيل (auto): Graph ← لقطة مستوردة تغطّي المدى ← خريطة الروتين ← لا شيء */
export function resolveEvents(db: Db, from: string, to: string, want: 'auto' | SourceId = 'auto'): Resolved {
  const sync = (s: string): SyncRow | undefined => db.get<SyncRow>('SELECT * FROM calendar_sync WHERE source = ?', s);
  const covers = (s: SyncRow | undefined): boolean => !!s && !!s.from_d && !!s.to_d && s.from_d <= to && s.to_d >= from;
  const holidaysFor = (): Resolved['holidays'] => {
    const r = readContent(db, 'ROUTINE_BLOCKS_AR.json');
    return r.data ? holidaysIn(r.data as RoutineDocLike, from, to) : [];
  };
  for (const s of ['graph', 'import'] as const) {
    if (want === s || (want === 'auto' && covers(sync(s)))) {
      const sy = sync(s);
      return { source: s, events: storedEvents(db, s, from, to), note: s === 'graph' ? null : 'لقطة مستوردة يدويًا: قد تكون قديمة عن Outlook الحقيقي.', holidays: holidaysFor(), last_sync: sy?.last_sync ?? null, routine_generated_at: null };
    }
  }
  if (want === 'auto' || want === 'routine') {
    const r = readContent(db, 'ROUTINE_BLOCKS_AR.json');
    if (r.data) {
      const doc = r.data as RoutineDocLike & { generated_at?: string };
      return {
        source: 'routine', events: routineToEvents(doc, from, to),
        note: 'هذه ليست أحداث Outlook نفسها: قالب أسبوعي من «خريطة الروتين» عند راشد (الصلوات تقريبية). استورد ملف ICS من Outlook أو فعّل Graph للمطابقة التامة.',
        holidays: holidaysIn(doc, from, to), last_sync: r.status.generated_at, routine_generated_at: doc.generated_at ?? r.status.generated_at,
      };
    }
  }
  return { source: 'none', events: [], note: want === 'auto' || want === 'routine' ? 'لا مصدر للجدول: مجلد راشد غائب ولا لقطة مستوردة. استورد ملف ICS/JSON من Outlook.' : 'لا أحداث محفوظة لهذا المصدر.', holidays: [], last_sync: null, routine_generated_at: null };
}

export function replaceStored(db: Db, source: SourceId, events: readonly CalEvent[], range: { from: string; to: string }, note: string | null): void {
  const cals = [...new Set(events.map((e) => e.calendar))];
  const at = nowIso();
  db.tx(() => {
    for (const c of cals) db.run('DELETE FROM calendar_events WHERE source = ? AND calendar = ?', source, c);
    for (const e of events) {
      db.run('INSERT OR REPLACE INTO calendar_events (source, id, calendar, title, start, end, show_as, categories, description, series, imported_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)', source, e.id, e.calendar, e.title, e.start, e.end, e.show_as, JSON.stringify(e.categories), e.description, e.series, at);
    }
    const prev = db.get<SyncRow>('SELECT * FROM calendar_sync WHERE source = ?', source);
    const from_d = prev?.from_d && prev.from_d < range.from ? prev.from_d : range.from;
    const to_d = prev?.to_d && prev.to_d > range.to ? prev.to_d : range.to;
    const count = db.get<{ n: number }>('SELECT COUNT(*) n FROM calendar_events WHERE source = ?', source)!.n;
    db.run('INSERT INTO calendar_sync (source, last_sync, from_d, to_d, count, note) VALUES (?,?,?,?,?,?) ON CONFLICT(source) DO UPDATE SET last_sync = excluded.last_sync, from_d = excluded.from_d, to_d = excluded.to_d, count = excluded.count, note = excluded.note', source, at, from_d, to_d, count, note);
  });
}

const STALE_H = 36;
export function createCalendarRouter(ctx: Ctx, opts: CalendarOpts = {}): express.Router {
  const r = express.Router();
  const env = opts.env ?? process.env;
  const db = (): Db => ctx.getDb();
  const doFetch: FetchLike = opts.fetch ?? ((url, init) => fetch(url, init) as unknown as ReturnType<FetchLike>);

  r.use((req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    if (!/^[\w-]{1,64}$/.test(String(req.headers['x-kitchen-client'] ?? ''))) return next(new CodedError(403, 'forbidden', 'كتابة الجدول تتطلب ترويسة X-Kitchen-Client'));
    next();
  });

  const graphCals = (): GraphCalendar[] | null => {
    try {
      const v = JSON.parse(env['SIRO_GRAPH_CALENDARS'] ?? '[]') as unknown;
      const arr = z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })).parse(v);
      return arr.length ? arr : null;
    } catch {
      return null;
    }
  };
  const graphReason = (): string | null => (!env['SIRO_GRAPH_TOKEN'] ? 'لا رمز: عيّن SIRO_GRAPH_TOKEN على الخادم (انظر API_KEYS_NEEDED.md)' : !graphCals() ? 'عيّن SIRO_GRAPH_CALENDARS (قائمة JSON بمعرّف واسم كل تقويم)' : null);

  r.get('/sources', wrap((_req, res) => {
    const d = db();
    const sy = (s: string): SyncRow | null => d.get<SyncRow>('SELECT * FROM calendar_sync WHERE source = ?', s) ?? null;
    const rt = readContent(d, 'ROUTINE_BLOCKS_AR.json');
    res.json({
      sources: [
        { id: 'graph', label: 'Outlook عبر Graph', configured: !graphReason(), reason: graphReason(), sync: sy('graph'), verified: false, verified_note: 'UNVERIFIED: لم يُجرَّب على حساب Outlook حقيقي في بيئة التطوير' },
        { id: 'import', label: 'لقطة مستوردة (ICS/JSON)', configured: true, reason: null, sync: sy('import'), verified: true, verified_note: null },
        { id: 'routine', label: 'خريطة الروتين (راشد)', configured: !!rt.data, reason: rt.data ? null : (rt.status.error ?? 'غير متاح'), sync: null, verified: true, verified_note: 'قالب أسبوعي وليس Outlook' },
      ],
    });
  }));

  r.get('/view', wrap((req, res) => {
    const from = parseOrThrow(dateQ, String(req.query['from'] ?? ''));
    const to = parseOrThrow(dateQ, String(req.query['to'] ?? from));
    if (to < from) throw new CodedError(400, 'bad_range', 'نهاية المدى قبل بدايته');
    if (daysBetween(from, to) + 1 > MAX_RANGE_DAYS) throw new CodedError(400, 'range_too_big', `المدى أكبر من ${MAX_RANGE_DAYS} يومًا`);
    const want = parseOrThrow(z.enum(['auto', 'graph', 'import', 'routine']), String(req.query['source'] ?? 'auto'));
    const rs = resolveEvents(db(), from, to, want);
    const count = new Map<string, number>();
    for (const e of rs.events) count.set(e.calendar, (count.get(e.calendar) ?? 0) + 1);
    const verify = verifyRange(rs.events, from, to);
    const stale = rs.source === 'routine' ? false : rs.last_sync ? Date.now() - Date.parse(rs.last_sync) > STALE_H * 3_600_000 : false;
    res.json({ from, to, tz: 'Asia/Kuala_Lumpur', source: rs.source, note: rs.note, last_sync: rs.last_sync, stale, holidays: rs.holidays, calendars: [...count].map(([name, n]) => ({ name, count: n })).sort((a, b) => a.name.localeCompare(b.name, 'ar')), events: rs.events, verify });
  }));

  r.post('/import', wrap((req, res) => {
    const b = parseOrThrow(importBody, req.body);
    const from = b.from ?? TERM_WINDOW.from;
    const to = b.to ?? TERM_WINDOW.to;
    if (daysBetween(from, to) > 400) throw new CodedError(400, 'range_too_big', 'مدى الاستيراد أكبر من 400 يوم');
    let events: CalEvent[] = [];
    let skipped: string[] = [];
    if (b.format === 'ics') {
      const r2 = parseIcs(b.text, { from, to, ...(b.calendar ? { calendar: b.calendar } : {}), source: 'import' });
      events = r2.events;
      skipped = r2.skipped;
    } else {
      let raw: unknown;
      try {
        raw = JSON.parse(b.text);
      } catch {
        throw new CodedError(400, 'bad_json', 'JSON غير صالح');
      }
      const arr = parseOrThrow(z.array(jsonEvent).max(20_000), Array.isArray(raw) ? raw : (raw as { events?: unknown })?.events);
      events = arr.map((e, i) => ({ id: e.id ?? `j${i}-${e.start}`, source: 'import' as const, calendar: b.calendar ?? e.calendar, title: e.title, start: e.start, end: e.end, show_as: e.show_as, categories: e.categories, description: e.description, series: e.series }));
      skipped = events.filter((e) => !(wallMin(e.end) > wallMin(e.start))).map((e) => `${e.id}: النهاية قبل البداية`);
      events = events.filter((e) => wallMin(e.end) > wallMin(e.start));
    }
    if (!events.length) throw new CodedError(422, 'empty_import', 'لا أحداث صالحة في الملف' + (skipped.length ? ` (تخطّيت ${skipped.length})` : ''), { skipped: skipped.slice(0, 20) });
    replaceStored(db(), 'import', events, { from, to }, skipped.length ? `${skipped.length} عنصرًا متخطّى` : null);
    res.status(201).json({ imported: events.length, calendars: [...new Set(events.map((e) => e.calendar))], skipped: skipped.slice(0, 50), skipped_count: skipped.length, range: { from, to } });
  }));

  r.delete('/import', wrap((_req, res) => {
    const d = db();
    d.tx(() => {
      d.run("DELETE FROM calendar_events WHERE source = 'import'");
      d.run("DELETE FROM calendar_sync WHERE source = 'import'");
    });
    res.json({ ok: true });
  }));

  r.post('/sync', wrap(async (req, res) => {
    const b = parseOrThrow(syncBody, req.body ?? {});
    const why = graphReason();
    if (why) throw new CodedError(503, 'graph_unconfigured', `Graph غير مهيأ: ${why}`);
    if (daysBetween(b.from, b.to) > 400) throw new CodedError(400, 'range_too_big', 'مدى المزامنة أكبر من 400 يوم');
    const cals = graphCals()!;
    const out = await fetchAllCalendars(doFetch, env['SIRO_GRAPH_TOKEN']!, cals, b.from, b.to);
    if (out.errors.length === cals.length) throw new CodedError(502, 'graph_failed', `فشلت المزامنة: ${out.errors.map((e) => `${e.calendar}: ${e.error}`).join('، ')}`);
    // نستبدل فقط التقاويم التي نجح جلبها (فشل تقويم لا يمسح لقطته السابقة)
    const okCals = new Set(cals.filter((c) => !out.errors.some((e) => e.calendar === c.name)).map((c) => c.name));
    const events = out.events.filter((e) => okCals.has(e.calendar));
    const d = db();
    if (events.length || okCals.size) {
      d.tx(() => {
        for (const c of okCals) d.run("DELETE FROM calendar_events WHERE source = 'graph' AND calendar = ?", c);
      });
      if (events.length) replaceStored(d, 'graph', events, b, out.errors.length ? `أخفقت: ${out.errors.map((e) => e.calendar).join('، ')}` : null);
    }
    res.json({ synced: events.length, per_calendar: out.per, errors: out.errors, range: b });
  }));

  r.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof CodedError) return void res.status(err.status).json({ error: err.message, code: err.code, ...err.extra });
    next(err);
  });
  return r;
}
