// واجهة الجدول /api/calendar: المصادر والعرض والاستيراد والمزامنة (Graph بـfetch وهمي) — قراءة فقط (G-03).
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { createCalendarRouter } from '../server/calendarRoutes.js';
import { tmpDir } from './helpers.js';

let srv: Running;
let base: string;
let dir: string;
const rashed = path.join(__dirname, '..', '..', 'exchange', 'rashed');
const have = fs.existsSync(path.join(rashed, 'docs', 'ROUTINE_BLOCKS_AR.json'));
const H = { 'X-Kitchen-Client': 'cal-test' };
async function call(method: string, url: string, body?: unknown, headers: Record<string, string> = H, b = base): Promise<{ status: number; json: any }> {
  const res = await fetch(b + url, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}

beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  process.env['PLATFORM_LIFE_ROOT'] = have ? rashed : path.join(dir, 'no-rashed');
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  delete process.env['PLATFORM_LIFE_ROOT'];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('المصادر والعرض', () => {
  it.skipIf(!have)('بلا لقطة: المصدر الافتراضي خريطة الروتين بتنبيه «ليست Outlook»، والعرض أسبوع كامل مع CAL-18', async () => {
    const r = await call('GET', '/api/calendar/view?from=2026-10-25&to=2026-10-31', undefined, {});
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ source: 'routine', tz: 'Asia/Kuala_Lumpur' });
    expect(r.json.note).toContain('ليست أحداث Outlook');
    expect(r.json.events.length).toBeGreaterThan(50);
    expect(r.json.verify.days_checked).toBe(7);
    expect(typeof r.json.verify.ok).toBe('boolean');
    expect(r.json.calendars.map((c: any) => c.name)).toContain('صلاة');
  });
  it('المدى: تاريخ سيئ 400، أكبر من 62 يومًا 400، والنهاية قبل البداية 400', async () => {
    expect((await call('GET', '/api/calendar/view?from=nope', undefined, {})).status).toBe(400);
    expect((await call('GET', '/api/calendar/view?from=2026-10-01&to=2026-12-31', undefined, {})).json.code).toBe('range_too_big');
    expect((await call('GET', '/api/calendar/view?from=2026-10-10&to=2026-10-01', undefined, {})).json.code).toBe('bad_range');
  });
  it('المصادر: Graph غير مهيأ بسبب صريح ووسم UNVERIFIED', async () => {
    const r = await call('GET', '/api/calendar/sources', undefined, {});
    const g = r.json.sources.find((s: any) => s.id === 'graph');
    expect(g.configured).toBe(false);
    expect(g.reason).toContain('SIRO_GRAPH_TOKEN');
    expect(g.verified_note).toContain('UNVERIFIED');
  });
});

describe('الاستيراد (لقطة ICS/JSON)', () => {
  const ics = [
    'BEGIN:VCALENDAR', 'X-WR-CALNAME:روتين وصحة',
    'BEGIN:VEVENT', 'UID:a', 'SUMMARY:😴 نوم', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261026T000000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261026T120000', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:b', 'SUMMARY:غداء', 'DTSTART;TZID=Asia/Kuala_Lumpur:20261026T120000', 'DTEND;TZID=Asia/Kuala_Lumpur:20261027T000000', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  it('الكتابة بلا ترويسة العميل ممنوعة', async () => {
    expect((await call('POST', '/api/calendar/import', { format: 'ics', text: ics }, {})).status).toBe(403);
  });
  it('يستورد ICS، ثم يصبح المصدر الافتراضي لمدى يغطيه، وCAL-18 نظيف ليوم مغطّى', async () => {
    const r = await call('POST', '/api/calendar/import', { format: 'ics', text: ics, from: '2026-10-26', to: '2026-10-26' });
    expect(r.status).toBe(201);
    expect(r.json).toMatchObject({ imported: 2, calendars: ['روتين وصحة'] });
    const v = await call('GET', '/api/calendar/view?from=2026-10-26&to=2026-10-26', undefined, {});
    expect(v.json.source).toBe('import');
    expect(v.json.events.map((e: any) => e.title)).toEqual(['😴 نوم', 'غداء']);
    expect(v.json.verify).toMatchObject({ ok: true });
    expect(v.json.last_sync).toBeTruthy();
    // مدى لا تغطيه اللقطة يعود للروتين (أو لا شيء) ولا يعرض لقطة ناقصة
    const other = await call('GET', '/api/calendar/view?from=2026-11-15&to=2026-11-15', undefined, {});
    expect(other.json.source).not.toBe('import');
  });
  it('JSON بحدث نهايته قبل بدايته يُتخطّى بسبب، وخارج الشكل يُرفض، وإعادة الاستيراد تستبدل تقويم اللقطة', async () => {
    const bad = await call('POST', '/api/calendar/import', { format: 'json', text: JSON.stringify([{ calendar: 'عام', title: 'x', start: '2026-10-27T10:00', end: '2026-10-27T09:00' }]) });
    expect(bad.status).toBe(422);
    expect(bad.json.code).toBe('empty_import');
    expect((await call('POST', '/api/calendar/import', { format: 'json', text: '{nope' })).json.code).toBe('bad_json');
    const ok = await call('POST', '/api/calendar/import', { format: 'json', text: JSON.stringify({ events: [{ calendar: 'عام', title: 'أ', start: '2026-10-27T00:00', end: '2026-10-28T00:00' }, { calendar: 'عام', title: 'ب', start: '2026-10-27T10:00', end: '2026-10-27T09:00' }] }), from: '2026-10-27', to: '2026-10-27' });
    expect(ok.json).toMatchObject({ imported: 1, skipped_count: 1 });
    const again = await call('POST', '/api/calendar/import', { format: 'json', text: JSON.stringify([{ calendar: 'عام', title: 'جديد', start: '2026-10-27T00:00', end: '2026-10-28T00:00' }]), from: '2026-10-27', to: '2026-10-27' });
    expect(again.status).toBe(201);
    const v = await call('GET', '/api/calendar/view?from=2026-10-27&to=2026-10-27&source=import', undefined, {});
    expect(v.json.events.map((e: any) => e.title)).toEqual(['جديد']);
    expect(srv.getDb().get<{ n: number }>("SELECT COUNT(*) n FROM calendar_events WHERE source='import' AND calendar='روتين وصحة'")!.n).toBe(2);
  });
  it('الحذف يفرّغ اللقطة فقط', async () => {
    expect((await call('DELETE', '/api/calendar/import')).status).toBe(200);
    expect(srv.getDb().get<{ n: number }>('SELECT COUNT(*) n FROM calendar_events')!.n).toBe(0);
    expect((await call('GET', '/api/calendar/view?from=2026-10-26&to=2026-10-26', undefined, {})).json.source).not.toBe('import');
  });
});

describe('Graph عبر الخادم (fetch وهمي — UNVERIFIED على Outlook الحقيقي)', () => {
  let server: Server;
  let gbase: string;
  const make = async (env: NodeJS.ProcessEnv, f: any): Promise<void> => {
    await new Promise<void>((r) => server?.close(() => r()) ?? r());
    const app = express().use(express.json()).use('/api/calendar', createCalendarRouter({ getDb: srv.getDb } as any, { env, fetch: f }));
    app.use((err: any, _req: any, res: any, _n: any) => res.status(500).json({ error: String(err?.message) }));
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()); });
    gbase = `http://127.0.0.1:${(server.address() as any).port}`;
  };
  afterAll(async () => { await new Promise<void>((r) => server?.close(() => r()) ?? r()); });
  it('بلا رمز: 503 graph_unconfigured وبلا أي طلب خارجي', async () => {
    let calls = 0;
    await make({}, async () => { calls++; return { ok: true, status: 200, json: async () => ({}) }; });
    const r = await call('POST', '/api/calendar/sync', {}, H, gbase);
    expect(r.status).toBe(503);
    expect(r.json.code).toBe('graph_unconfigured');
    expect(calls).toBe(0);
  });
  it('بالرمز: يجلب كل تقويم على حدة ويخزّن، وفشل تقويم واحد لا يمسح لقطته السابقة', async () => {
    const cals = JSON.stringify([{ id: 'A', name: 'دراسة' }, { id: 'B', name: 'صلاة' }]);
    const ev = (id: string) => ({ value: [{ id, subject: id, start: { dateTime: '2026-10-26T01:00:00', timeZone: 'UTC' }, end: { dateTime: '2026-10-26T02:00:00', timeZone: 'UTC' } }] });
    let failB = false;
    const urls: string[] = [];
    await make({ SIRO_GRAPH_TOKEN: 'tok', SIRO_GRAPH_CALENDARS: cals }, async (url: string) => {
      urls.push(url);
      if (url.includes('/calendars/B/') && failB) return { ok: false, status: 429, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ev(url.includes('/calendars/A/') ? 'a1' : 'b1') };
    });
    const r1 = await call('POST', '/api/calendar/sync', { from: '2026-10-26', to: '2026-10-26' }, H, gbase);
    expect(r1.status).toBe(200);
    expect(r1.json.synced).toBe(2);
    expect(urls.some((u) => u.includes('/calendars/A/calendarView')) && urls.some((u) => u.includes('/calendars/B/calendarView'))).toBe(true);
    failB = true;
    const r2 = await call('POST', '/api/calendar/sync', { from: '2026-10-26', to: '2026-10-26' }, H, gbase);
    expect(r2.json.errors).toEqual([{ calendar: 'صلاة', error: 'Graph يخنق الطلبات (429)' }]);
    const v = await call('GET', '/api/calendar/view?from=2026-10-26&to=2026-10-26', undefined, {});
    expect(v.json.source).toBe('graph');
    expect(v.json.events.map((e: any) => e.id).sort()).toEqual(['a1', 'b1']);
    expect(v.json.events.find((e: any) => e.id === 'a1')).toMatchObject({ start: '2026-10-26T09:00', calendar: 'دراسة' });
  });
});
