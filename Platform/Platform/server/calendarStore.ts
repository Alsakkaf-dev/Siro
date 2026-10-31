import type { Db } from './db.js';
import { nowIso } from './kitchenRoutes.js';
import { readContent } from './life.js';
import { addDays, holidaysIn, routineToEvents, type CalEvent, type RoutineDocLike, type SourceId } from '../shared/calendar/index.js';

/** مخزن أحداث الجدول: لقطات import/graph في القاعدة، وإسقاط خريطة الروتين. مشترك بين مسارات العرض والاقتراحات. */
interface Row { source: string; id: string; calendar: string; title: string; start: string; end: string; show_as: string; categories: string; description: string; series: string | null; imported_at: string }
const toEvent = (r: Row): CalEvent => ({ id: r.id, source: r.source as SourceId, calendar: r.calendar, title: r.title, start: r.start, end: r.end, show_as: r.show_as === 'free' ? 'free' : 'busy', categories: JSON.parse(r.categories) as string[], description: r.description, series: r.series });

export interface SyncRow { source: string; last_sync: string; from_d: string | null; to_d: string | null; count: number; note: string | null }
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

