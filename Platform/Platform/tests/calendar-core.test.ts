// النواة النقية للجدول: توقيت KL، قوانين CAL-10…19، التخطيط، ICS، الإسقاط من خريطة الروتين، Graph. TST-11: قيم مستقلة لا ناتج الدالة نفسها.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addDays, convertWall, dowOf, freeTitle, kindOf, layoutDay, mapGraphEvent, minWall, msToWall, parseIcs, routineToEvents, verifyRange, wallMin, wallToMs, weekStartOf, fetchAllCalendars, isGraphUrl, calendarViewUrl,
  type CalEvent, type RoutineDocLike,
} from '../shared/calendar/index.js';
import { overlapPairs, type RBlock } from '../shared/v8.js';

const ev = (id: string, start: string, end: string, over: Partial<CalEvent> = {}): CalEvent => ({ id, source: 'import', calendar: 'روتين وصحة', title: id, start, end, show_as: 'busy', categories: [], description: '', series: null, ...over });
const D = '2026-10-26';

describe('التوقيت (I18N-04)', () => {
  it('KL = UTC+8: 2026-10-23T00:00Z ↔ 08:00 محلي، ذهابًا وإيابًا', () => {
    expect(msToWall(Date.UTC(2026, 9, 23, 0, 0))).toBe('2026-10-23T08:00');
    expect(wallToMs('2026-10-23T08:00')).toBe(Date.UTC(2026, 9, 23, 0, 0));
    expect(convertWall('2026-10-23T20:00', 'UTC')).toBe('2026-10-24T04:00');
    expect(convertWall('2026-10-23T08:00', 'America/New_York')).toBe('2026-10-23T20:00');
  });
  it('التواريخ: الأحد بداية الأسبوع، 23 أكتوبر 2026 جمعة', () => {
    expect(dowOf('2026-10-23')).toBe(5);
    expect(weekStartOf('2026-10-23')).toBe('2026-10-18');
    expect(weekStartOf('2026-10-18')).toBe('2026-10-18');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(minWall(wallMin('2026-10-23T08:05') + 55)).toBe('2026-10-23T09:00');
  });
});

describe('التسمية والتصنيف', () => {
  it('عنوان حدث الفراغ CAL-11: 2h.33m / 2h / 49m / 1h.4m', () => {
    expect([153, 120, 49, 64, 20].map(freeTitle)).toEqual(['2h.33m', '2h', '49m', '1h.4m', '20m']);
  });
  it('الهرمية CAL-10: النوم والمحاضرة جبل، الصلاة ريح، الباقي موج', () => {
    const k = (title: string, calendar: string, categories: string[] = []): string => kindOf({ title, calendar, categories, show_as: 'busy' });
    expect(k('😴 نوم', 'روتين وصحة')).toBe('sleep');
    expect(k('🛏️ جاري النوم', 'روتين وصحة')).toBe('sleep');
    expect(k('🕌 صلاة الظهر', 'صلاة')).toBe('prayer');
    expect(k('📘 SCSE3203', 'دراسة', ['محاضرة'])).toBe('lecture');
    expect(k('📘 مذاكرة', 'دراسة')).toBe('study');
    expect(k('فطور', 'روتين وصحة')).toBe('meal');
    expect(k('2h.33m', 'وقت فراغ')).toBe('free');
  });
});

describe('CAL-18: التداخلات والفجوات وأقصر من 20 دقيقة', () => {
  it('يوم مغطّى تمامًا ومتجاور = 0/0/0', () => {
    const v = verifyRange([ev('a', `${D}T00:00`, `${D}T08:00`), ev('b', `${D}T08:00`, `${D}T13:00`), ev('c', `${D}T13:00`, `${addDays(D, 1)}T00:00`)], D, D);
    expect({ o: v.overlaps.length, g: v.gaps.length, s: v.short.length, ok: v.ok }).toEqual({ o: 0, g: 0, s: 0, ok: true });
  });
  it('فجوة 19 دقيقة = absorb و20 = free_event، وفجوة نهاية اليوم تُحسب', () => {
    const v = verifyRange([ev('a', `${D}T00:00`, `${D}T08:00`), ev('b', `${D}T08:19`, `${D}T12:00`), ev('c', `${D}T12:20`, `${D}T23:40`)], D, D);
    expect(v.gaps.map((g) => [g.minutes, g.action])).toEqual([[19, 'absorb'], [20, 'free_event'], [20, 'free_event']]);
    expect(v.gaps[0]).toMatchObject({ start: `${D}T08:00`, end: `${D}T08:19`, before: 'a', after: 'b' });
    expect(v.gaps[2]).toMatchObject({ start: `${D}T23:40`, after: null });
  });
  it('كل زوج متداخل يُعدّ (ثلاثة متراكبة = 3 أزواج)، والتماسّ ليس تداخلًا', () => {
    const v = verifyRange([ev('a', `${D}T00:00`, `${D}T10:00`), ev('b', `${D}T09:00`, `${D}T11:00`), ev('c', `${D}T09:30`, `${D}T12:00`), ev('d', `${D}T12:00`, `${addDays(D, 1)}T00:00`)], D, D);
    expect(v.overlaps.map((o) => [o.a, o.b, o.minutes]).sort()).toEqual([['a', 'b', 60], ['a', 'c', 30], ['b', 'c', 90]].sort());
    expect(v.gaps).toHaveLength(0);
  });
  it('حدث أقصر من 20 دقيقة يُبلَّغ (CAL-12) وحدث في التقويم «Calendar» (CAL-14)', () => {
    const v = verifyRange([ev('a', `${D}T00:00`, `${D}T12:00`), ev('x', `${D}T12:00`, `${D}T12:15`, { calendar: 'Calendar' }), ev('b', `${D}T12:15`, `${addDays(D, 1)}T00:00`)], D, D);
    expect(v.short.map((s) => [s.id, s.minutes])).toEqual([['x', 15]]);
    expect(v.default_calendar.map((s) => s.id)).toEqual(['x']);
    expect(v.ok).toBe(false);
    // الاسم العربي للتقويم الافتراضي يُلتقط أيضًا
    const ar = verifyRange([ev('a', `${D}T00:00`, `${D}T12:00`, { calendar: 'التقويم الافتراضي' }), ev('b', `${D}T12:00`, `${addDays(D, 1)}T00:00`)], D, D);
    expect(ar.default_calendar.map((x) => x.id)).toEqual(['a']);
  });
  it('حدث يعبر منتصف الليل يغطي الطرفين', () => {
    const v = verifyRange([ev('s', `${D}T22:00`, `${addDays(D, 1)}T05:00`), ev('d', `${D}T00:00`, `${D}T22:00`), ev('e', `${addDays(D, 1)}T05:00`, `${addDays(D, 2)}T00:00`)], D, addDays(D, 1));
    expect(v.gaps).toHaveLength(0);
    expect(v.days_checked).toBe(2);
  });
  it('يوم بلا أي حدث = فجوة واحدة 1440 دقيقة (لا نخفيها)', () => {
    const v = verifyRange([], D, D);
    expect(v.gaps).toHaveLength(1);
    expect(v.gaps[0]!.minutes).toBe(1440);
  });
  it('CAL-19 استشاري: غير النوم/الفراغ بعد 21:40 يُبلَّغ', () => {
    const v = verifyRange([ev('s0', `${D}T00:00`, `${D}T05:10`, { title: '😴 نوم' }), ev('a', `${D}T05:10`, `${D}T21:30`), ev('late', `${D}T21:30`, `${D}T22:00`), ev('s', `${D}T22:00`, `${addDays(D, 1)}T00:00`, { title: '😴 نوم' })], D, D);
    expect(v.night.map((n) => n.id)).toEqual(['late']);
  });
});

describe('تخطيط الشبكة (أعمدة المتداخلات)', () => {
  it('متداخلان = عمودان، تاليهما منفرد = عمود واحد', () => {
    const p = layoutDay([ev('a', `${D}T09:00`, `${D}T11:00`), ev('b', `${D}T10:00`, `${D}T12:00`), ev('c', `${D}T12:00`, `${D}T13:00`)], D);
    const by = Object.fromEntries(p.map((x) => [x.ev.id, x]));
    expect([by['a']!.col, by['a']!.cols, by['b']!.col, by['b']!.cols, by['c']!.col, by['c']!.cols]).toEqual([0, 2, 1, 2, 0, 1]);
    expect(by['a']).toMatchObject({ top: 540, height: 120 });
  });
});

const ICS = [
  'BEGIN:VCALENDAR', 'X-WR-CALNAME:دراسة',
  'BEGIN:VEVENT', 'UID:w1', 'SUMMARY:📘 SCSE3203\\, Special', 'DTSTART;TZID=Malay Peninsula Standard Time:20261026T110000', 'DTEND;TZID=Malay Peninsula Standard Time:20261026T125000',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261111T000000Z', 'EXDATE;TZID=Malay Peninsula Standard Time:20261102T110000', 'CATEGORIES:محاضرة',
  'DESCRIPTION:سطر 1\\nسطر 2', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:w1', 'RECURRENCE-ID;TZID=Malay Peninsula Standard Time:20261104T110000', 'SUMMARY:📘 SCSE3203 (منقولة)', 'DTSTART;TZID=Malay Peninsula Standard Time:20261104T140000', 'DTEND;TZID=Malay Peninsula Standard Time:20261104T155000', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:u1', 'SUMMARY:اجتماع UTC', 'DTSTART:20261026T000000Z', 'DTEND:20261026T010000Z', 'X-MICROSOFT-CDO-BUSYSTATUS:FREE', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:ad', 'SUMMARY:يوم كامل', 'DTSTART;VALUE=DATE:20261026', 'DTEND;VALUE=DATE:20261027', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:bad', 'SUMMARY:معقّد', 'DTSTART:20261026T000000Z', 'DTEND:20261026T010000Z', 'RRULE:FREQ=MONTHLY;BYSETPOS=2;BYDAY=TU', 'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

describe('قارئ ICS', () => {
  const r = parseIcs(ICS, { from: '2026-10-25', to: '2026-11-14' });
  it('يفرد RRULE الأسبوعي (الإثنين والأربعاء) إلى UNTIL ويحذف EXDATE ويستبدل الاستثناء', () => {
    const w = r.events.filter((e) => e.id.startsWith('w1')).map((e) => `${e.start} ${e.title}`).sort();
    expect(w).toEqual([
      '2026-10-26T11:00 📘 SCSE3203, Special',
      '2026-10-28T11:00 📘 SCSE3203, Special',
      '2026-11-04T14:00 📘 SCSE3203 (منقولة)',
      '2026-11-09T11:00 📘 SCSE3203, Special',
      '2026-11-11T11:00 📘 SCSE3203, Special',
    ].sort());
    // 2 نوفمبر (EXDATE) غائب، و4 نوفمبر الأصلي 11:00 غائب
    expect(r.events.some((e) => e.start.startsWith('2026-11-02'))).toBe(false);
    const e0 = r.events.find((e) => e.start === '2026-10-26T11:00')!;
    expect(e0).toMatchObject({ end: '2026-10-26T12:50', calendar: 'دراسة', categories: ['محاضرة'], description: 'سطر 1\nسطر 2', series: 'w1' });
  });
  it('UTC يُحوَّل إلى KL، FREE يصبح free، ويوم كامل وتكرار غير مدعوم يُسجَّلان متخطّيين بسببهما', () => {
    const u = r.events.find((e) => e.id === 'u1')!;
    expect(u).toMatchObject({ start: '2026-10-26T08:00', end: '2026-10-26T09:00', show_as: 'free' });
    expect(r.skipped.join('|')).toContain('ad: حدث ليوم كامل');
    expect(r.skipped.join('|')).toContain('bad: تكرار غير مدعوم (BYSETPOS)');
  });
  it('COUNT يوقف التكرار', () => {
    const t = parseIcs('BEGIN:VEVENT\nUID:c\nSUMMARY:x\nDTSTART:20261026T000000Z\nDTEND:20261026T010000Z\nRRULE:FREQ=DAILY;COUNT=3\nEND:VEVENT', { from: '2026-10-25', to: '2026-11-30' });
    expect(t.events.map((e) => e.start.slice(0, 10))).toEqual(['2026-10-26', '2026-10-27', '2026-10-28']);
  });
});

describe('خريطة الروتين من راشد (بيانات حقيقية)', () => {
  const file = path.join(__dirname, '..', '..', 'exchange', 'rashed', 'docs', 'ROUTINE_BLOCKS_AR.json');
  const have = fs.existsSync(file);
  const doc = have ? (JSON.parse(fs.readFileSync(file, 'utf8')) as RoutineDocLike & { blocks: RBlock[] }) : null;
  it.skipIf(!have)('أسبوع واحد: عدد الأحداث = كتل ذلك اليوم (بلا النقاط)، والأوقات ضمن اليوم', () => {
    const evs = routineToEvents(doc!, '2026-10-25', '2026-10-31');
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const expected = doc!.blocks.filter((b) => b.type !== 'local_routine' && b.end_min > b.start_min).length;
    expect(evs).toHaveLength(expected);
    for (const e of evs) expect(wallMin(e.end)).toBeGreaterThan(wallMin(e.start));
    const mon = evs.filter((e) => e.start.startsWith('2026-10-26')).length;
    expect(mon).toBe(doc!.blocks.filter((b) => b.day === keys[dowOf('2026-10-26')] && b.type !== 'local_routine').length);
  });
  it.skipIf(!have)('كل تداخل عند راشد (overlaps_with) يظهر عندنا بين الحدثين نفسيهما في الأسبوع', () => {
    const evs = routineToEvents(doc!, '2026-10-25', '2026-10-31');
    const v = verifyRange(evs, '2026-10-25', '2026-10-31');
    const keys = new Set(v.overlaps.map((o) => [o.a.replace(/^rt:|:\d{4}-\d{2}-\d{2}$/g, ''), o.b.replace(/^rt:|:\d{4}-\d{2}-\d{2}$/g, '')].sort().join('|')));
    const pairs = overlapPairs(doc!.blocks);
    expect(pairs.length).toBeGreaterThan(0);
    // أزواج راشد التي تمسّ لحظة فعلية (>0 دقيقة) كلها عندنا
    let touching = 0;
    for (const { a, b } of pairs) {
      if (Math.min(a.end_min, b.end_min) - Math.max(a.start_min, b.start_min) > 0) {
        touching++;
        expect(keys.has([a.id, b.id].sort().join('|')), `${a.id}⟷${b.id}`).toBe(true);
      }
    }
    expect(touching).toBeGreaterThan(0);
    // ولا نخترع تداخلًا غير موجود في البيانات الأصلية
    expect(v.overlaps.length).toBeLessThanOrEqual(pairs.length);
  });
});

describe('Graph (fixtures بشكل الاستجابة الموثّق — لا اتصال حقيقي)', () => {
  it('يحوّل الحدث ويتجاهل الملغى/اليوم الكامل/الماستر ويحوّل UTC إلى KL', () => {
    const e = mapGraphEvent({ id: 'g1', subject: ' غداء ', start: { dateTime: '2026-10-26T05:00:00.0000000', timeZone: 'UTC' }, end: { dateTime: '2026-10-26T06:00:00.0000000', timeZone: 'UTC' }, showAs: 'busy', categories: ['x'], body: { contentType: 'text', content: 'وصف' }, seriesMasterId: 'm' }, 'روتين وصحة')!;
    expect(e).toMatchObject({ id: 'g1', title: 'غداء', start: '2026-10-26T13:00', end: '2026-10-26T14:00', series: 'm', description: 'وصف', source: 'graph' });
    expect(mapGraphEvent({ id: 'c', isCancelled: true, start: { dateTime: '2026-10-26T05:00:00' }, end: { dateTime: '2026-10-26T06:00:00' } }, 'x')).toBeNull();
    expect(mapGraphEvent({ id: 'a', isAllDay: true, start: { dateTime: '2026-10-26T00:00:00' }, end: { dateTime: '2026-10-27T00:00:00' } }, 'x')).toBeNull();
    expect(mapGraphEvent({ id: 'm', type: 'seriesMaster', start: { dateTime: '2026-10-26T00:00:00' }, end: { dateTime: '2026-10-26T01:00:00' } }, 'x')).toBeNull();
  });
  it('الجلب لكل تقويم على حدة بترقيم، ≤5 طلبات متوازية، وفشل تقويم لا يُسقط البقية، وSSRF مقفل', async () => {
    let live = 0;
    let peak = 0;
    const seen: string[] = [];
    const f = async (url: string, init: { headers: Record<string, string> }) => {
      live++;
      peak = Math.max(peak, live);
      seen.push(url);
      await new Promise((r) => setTimeout(r, 5));
      live--;
      expect(init.headers['Authorization']).toBe('Bearer T');
      expect(init.headers['Prefer']).toContain('Asia/Kuala_Lumpur');
      if (url.includes('/calendars/bad/')) return { ok: false, status: 403, json: async () => ({}) };
      if (url.includes('/calendars/c0/') && !url.includes('skip=1')) return { ok: true, status: 200, json: async () => ({ value: [{ id: 'p1', subject: 'a', start: { dateTime: '2026-10-26T01:00:00', timeZone: 'UTC' }, end: { dateTime: '2026-10-26T02:00:00', timeZone: 'UTC' } }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/calendars/c0/calendarView?skip=1' }) };
      return { ok: true, status: 200, json: async () => ({ value: [{ id: `e-${url.length}`, subject: 'b', start: { dateTime: '2026-10-27T01:00:00', timeZone: 'UTC' }, end: { dateTime: '2026-10-27T02:00:00', timeZone: 'UTC' } }] }) };
    };
    const cals = [...Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, name: `cal${i}` })), { id: 'bad', name: 'bad' }];
    const out = await fetchAllCalendars(f, 'T', cals, '2026-10-26', '2026-10-31');
    expect(peak).toBeLessThanOrEqual(5);
    expect(out.errors).toEqual([{ calendar: 'bad', error: 'رمز Graph مرفوض أو منتهٍ' }]);
    expect(out.per['cal0']).toBe(2);
    expect(out.events).toHaveLength(9);
    expect(seen.every((u) => isGraphUrl(u))).toBe(true);
    expect(isGraphUrl('https://evil.example/v1.0/me')).toBe(false);
    expect(isGraphUrl('http://graph.microsoft.com/x')).toBe(false);
    expect(calendarViewUrl('a b', '2026-10-26', '2026-10-31')).toContain('/calendars/a%20b/calendarView?');
  });
});
