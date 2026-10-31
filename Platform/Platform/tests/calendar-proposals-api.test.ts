// طابور الاقتراحات: J6 (يوم الخطة ← اقتراحات)، AC-10 (قالب حرفي + فحص CAL-43 + لا كتابة في Outlook)، التصدير لراشد، DEF-10، والمسار الحالات.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import { validateMealBody } from '../shared/calendar/index.js';
import { nutritionOf, outlookBody, ORIGINAL_RECIPES } from '../shared/kitchen/index.js';

let srv: Running;
let base: string;
let dir: string;
const H = { 'X-Kitchen-Client': 'prop-test' };
const rashed = path.join(__dirname, '..', '..', 'exchange', 'rashed');
async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...H }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}
const snapshotDir = (d: string): string => (fs.existsSync(d) ? fs.readdirSync(d, { recursive: true, withFileTypes: false }).map(String).sort().map((f) => { const p = path.join(d, f); const st = fs.statSync(p); return `${f}:${st.isFile() ? st.size : 'd'}:${st.mtimeMs}`; }).join('|') : 'absent');

const bk = ORIGINAL_RECIPES.find((r) => r.slug === 'bk-03')!;
const WRONG = outlookBody(bk.title_ar, ['اسلق 100 غراماً من البيض.', 'حمّص 80 غراماً من التوست.'], nutritionOf(bk.lines).total);
const esc = (s: string): string => s.replace(/\n/g, '\\n');
const vev = (uid: string, title: string, a: string, b: string, desc = '', cal = 'روتين وصحة'): string => ['BEGIN:VEVENT', `UID:${uid}`, `SUMMARY:${title}`, `DTSTART;TZID=Asia/Kuala_Lumpur:2026110${a}`, `DTEND;TZID=Asia/Kuala_Lumpur:2026110${b}`, ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []), `X-SIRO-CALENDAR:${cal}`, 'END:VEVENT'].join('\r\n');
// يوم 2 نوفمبر 2026 مغطّى بالكامل؛ عشاء بلا حدث (خانة افتراضية)
const ICS = ['BEGIN:VCALENDAR',
  vev('a', '😴 نوم', '2T000000', '2T060000'),
  vev('b', '🍳 فطور', '2T060000', '2T070000', WRONG),
  vev('c', '💼 عمل', '2T070000', '2T120000'),
  vev('d', '🍽️ غداء', '2T120000', '2T130000'),
  vev('e', '🕌 صلاة الظهر', '2T130000', '2T133000', '', 'صلاة'),
  vev('f', 'راحة', '2T133000', '2T230000'),
  vev('g', '😴 جاري النوم', '2T230000', '3T000000'),
  'END:VCALENDAR'].join('\r\n');

beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  process.env['PLATFORM_LIFE_ROOT'] = rashed;
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
  expect((await call('POST', '/api/calendar/import', { format: 'ics', text: ICS, from: '2026-11-02', to: '2026-11-02' })).status).toBe(201);
});
afterAll(async () => {
  await srv.close();
  delete process.env['PLATFORM_LIFE_ROOT'];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('J6: يوم الخطة ← اقتراحات Outlook بالقالب الحرفي (AC-10)', () => {
  const rashedBefore = snapshotDir(rashed);
  const eventsBefore = (): number => srv.getDb().get<{ n: number }>('SELECT COUNT(*) n FROM calendar_events')!.n;
  let ids: string[] = [];
  it('بلا يوم محفوظ ← 404', async () => {
    expect((await call('POST', '/api/calendar/proposals/from-plan', { date: '2026-11-02' })).status).toBe(404);
  });
  it('اليوم المحفوظ يُنتج اقتراحي تحديث (فطور/غداء) بنص القالب نفسه، وعشاء بلا حدث يُتخطّى بسببه', async () => {
    const put = await call('PUT', '/api/kitchen/plan/2026-11-02', { slots: { 'فطور': { card: 'cy-bk-03' }, 'غداء': { card: 'cy-ln-01' }, 'عشاء': { card: 'cy-dn-04' } } });
    expect(put.status).toBe(200);
    const n0 = eventsBefore();
    const r = await call('POST', '/api/calendar/proposals/from-plan', { date: '2026-11-02' });
    expect(r.status).toBe(201);
    expect(r.json.created.map((c: any) => [c.slot, c.kind])).toEqual([['فطور', 'update'], ['غداء', 'update']]);
    expect(r.json.skipped).toEqual([{ slot: 'عشاء', reason: expect.stringContaining('لا حدث مقابل') }]);
    expect(r.json.note).toContain('لم يُكتب شيء في Outlook');
    ids = r.json.created.map((c: any) => c.id);
    const list = (await call('GET', '/api/calendar/proposals')).json.proposals;
    expect(list).toHaveLength(2);
    for (const p of list) {
      const slotBody = put.json.slots.find((s: any) => s.slot === p.after.title.replace(/[^؀-ۿ]/g, ''))?.body_text;
      expect(p.status).toBe('pending');
      expect(p.after.description).toBe(slotBody);
      expect(validateMealBody(p.after.description)).toEqual([]);
      expect(/[A-Za-z٠-٩]/.test(p.after.description)).toBe(false);
      expect(p.after.start).toBe(p.before.start);
      expect(p.lint.ok).toBe(true);
      expect(p.lint.after).toEqual(p.lint.before);
    }
    expect(eventsBefore()).toBe(n0);
  });
  it('فطور: الوصف بعد الاقتراح أصلح غرام DEF-10 ضمنيًا لأنه مولَّد بالقواعد، ولا ازدواج عند إعادة التوليد (يُستبدل المعلّق)', async () => {
    const r = await call('POST', '/api/calendar/proposals/from-plan', { date: '2026-11-02' });
    expect(r.json.created).toHaveLength(2);
    expect((await call('GET', '/api/calendar/proposals')).json.proposals).toHaveLength(2);
    ids = r.json.created.map((c: any) => c.id);
  });
  it('إنشاء حدث عشاء بوقت يتداخل مع «راحة» يُرفض بفحص CAL-43 بسببه ولا يُنشأ', async () => {
    const r = await call('POST', '/api/calendar/proposals/from-plan', { date: '2026-11-02', times: { 'عشاء': { start: '19:00', end: '20:00' } } });
    expect(r.json.rejected).toHaveLength(1);
    expect(r.json.rejected[0]).toMatchObject({ slot: 'عشاء' });
    expect(r.json.rejected[0].errors.map((e: any) => e.code)).toContain('CAL-13');
    expect((await call('GET', '/api/calendar/proposals')).json.proposals).toHaveLength(2);
  });
  it('اقتراح عام يمسّ صلاة يُرفض بـCAL-47، وتقويم افتراضي بـCAL-14، وحدث غير موجود 404', async () => {
    const pr = { kind: 'update', calendar: 'صلاة', event_id: 'e', before: { title: '🕌 صلاة الظهر', start: '2026-11-02T13:00', end: '2026-11-02T13:30', description: '', categories: [] }, after: { title: '🕌 صلاة الظهر', start: '2026-11-02T13:00', end: '2026-11-02T13:30', description: 'وصف', categories: [] }, reason: 'اختبار الحماية' };
    const a = await call('POST', '/api/calendar/proposals', pr);
    expect(a.status).toBe(422);
    expect(a.json.errors.map((e: any) => e.code)).toContain('CAL-47');
    expect((await call('POST', '/api/calendar/proposals', { ...pr, calendar: 'التقويم' })).json.errors.map((e: any) => e.code)).toContain('CAL-14');
    expect((await call('POST', '/api/calendar/proposals', { ...pr, event_id: 'nope' })).status).toBe(404);
    expect((await call('POST', '/api/calendar/proposals', { ...pr, explicit: true })).status).toBe(201);
    const extra = (await call('GET', '/api/calendar/proposals')).json.proposals.find((p: any) => p.explicit);
    await call('DELETE', `/api/calendar/proposals/${extra.id}`);
  });
  it('مسار الحالة: لا قفز إلى «مطبّق» قبل الاعتماد والتصدير، ولا تصدير بلا معتمد', async () => {
    ids = (await call('GET', '/api/calendar/proposals?status=pending')).json.proposals.map((p: any) => p.id);
    expect(ids).toHaveLength(2);
    expect((await call('POST', '/api/calendar/proposals/export', {})).json.code).toBe('nothing_to_export');
    expect((await call('PATCH', `/api/calendar/proposals/${ids[0]}`, { status: 'applied' })).json.code).toBe('bad_transition');
    expect((await call('PATCH', `/api/calendar/proposals/${ids[0]}`, { status: 'approved' })).status).toBe(200);
    expect((await call('PATCH', `/api/calendar/proposals/${ids[0]}`, { status: 'applied' })).json.code).toBe('not_exported');
    // غير المعتمد لا يُصدَّر افتراضيًا
    const ex = await call('POST', '/api/calendar/proposals/export', {});
    expect(ex.status).toBe(200);
    expect(ex.json.count).toBe(1);
    expect(ex.json.json).toMatchObject({ kind: 'siro.calendar.proposals', writer: 'rashed', requires_separate_run: true, count: 1 });
    expect(ex.json.json.proposals[0]).toMatchObject({ id: ids[0], kind: 'update', event_id: expect.any(String) });
    expect(ex.json.text).toContain('لم يُطبَّق شيء');
    expect(ex.json.text).toContain('القيمة الغذائية الإجمالية للوجبة:');
    expect((await call('PATCH', `/api/calendar/proposals/${ids[0]}`, { status: 'applied' })).status).toBe(200);
    expect((await call('DELETE', `/api/calendar/proposals/${ids[0]}`)).json.code).toBe('locked');
    expect((await call('PATCH', `/api/calendar/proposals/${ids[0]}`, { status: 'pending' })).json.code).toBe('bad_transition');
    expect((await call('PATCH', `/api/calendar/proposals/${ids[1]}`, { status: 'rejected' })).status).toBe(200);
    expect((await call('DELETE', `/api/calendar/proposals/${ids[1]}`)).status).toBe(200);
  });
  it('سجل التدقيق يحمل إنشاء/حالة/تصدير، ولم يُكتب شيء في Outlook ولا في مجلد راشد', async () => {
    const actions = (await call('GET', '/api/calendar/audit')).json.audit.map((a: any) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['create', 'status', 'export', 'delete']));
    expect(snapshotDir(rashed)).toBe(rashedBefore);
  });
  it('الكتابة بلا ترويسة العميل ممنوعة', async () => {
    const r = await fetch(`${base}/api/calendar/proposals/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(r.status).toBe(403);
  });
});

describe('DEF-10: إصلاحات صياغة الغرام كاقتراحات (CAL-45)', () => {
  it('الوصف القديم «100 غراماً» يُكشف، والمعاينة لا تكتب، والتوليد يُنشئ اقتراح إصلاح بوصف مصحّح يمرّ القالب', async () => {
    const dry = await call('POST', '/api/calendar/proposals/fix-grams', { from: '2026-11-02', to: '2026-11-02', dry_run: true });
    expect(dry.json.found).toBe(1);
    expect(dry.json.list[0].changes).toEqual([{ from: '100 غراماً', to: '100 غرام' }]);
    expect((await call('GET', '/api/calendar/proposals?status=pending')).json.proposals).toHaveLength(0);
    const r = await call('POST', '/api/calendar/proposals/fix-grams', { from: '2026-11-02', to: '2026-11-02' });
    expect(r.status).toBe(201);
    expect(r.json.created).toHaveLength(1);
    const p = (await call('GET', '/api/calendar/proposals?status=pending')).json.proposals[0];
    expect(p.after.description).toContain('100 غرام من البيض');
    expect(p.after.description).toContain('80 غراماً من التوست');
    expect(p.before.description).toContain('100 غراماً من البيض'); // الأصل لا يُغيَّر في المنصة ولا Outlook
    expect(p.reason).toContain('DEF-10');
    expect(validateMealBody(p.after.description)).toEqual([]);
  });
  it('مدى معكوس أو كبير يُرفض', async () => {
    expect((await call('POST', '/api/calendar/proposals/fix-grams', { from: '2026-11-05', to: '2026-11-02' })).json.code).toBe('bad_range');
    expect((await call('POST', '/api/calendar/proposals/fix-grams', { from: '2026-01-01', to: '2026-12-31' })).json.code).toBe('range_too_big');
  });
});
