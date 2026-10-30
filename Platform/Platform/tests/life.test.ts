import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';
import {
  ageText, blocksForDay, checkShape, classifyFreshness, commandId, coverage, dailySpendRate, nowAndNext, parseBalanceHistory, spendingByCategory, spendingByDay, validatePayload, missingInputs, countMissing, weightProgress, worstOf,
  type Finance, type Tx,
} from '../shared/life.js';
// @ts-expect-error JS helper
import { buildLifeFixture } from '../scripts/life-fixture.mjs';

const H = 3_600_000;
describe('freshness rules (REFRESH_PROTOCOL §2)', () => {
  const now = Date.parse('2026-10-27T12:00:00+08:00');
  const base = { nowMs: now, bytesMeta: 10, bytesActual: 10 };
  it('fresh / stale / expired thresholds at 1x and 3x', () => {
    const at = (h: number) => new Date(now - h * H).toISOString();
    expect(classifyFreshness({ ...base, generatedAt: at(23), staleAfterHours: 24 }).state).toBe('fresh');
    expect(classifyFreshness({ ...base, generatedAt: at(25), staleAfterHours: 24 }).state).toBe('stale');
    expect(classifyFreshness({ ...base, generatedAt: at(72), staleAfterHours: 24 }).state).toBe('stale');
    expect(classifyFreshness({ ...base, generatedAt: at(73), staleAfterHours: 24 }).state).toBe('expired');
    expect(classifyFreshness({ ...base, generatedAt: at(13), staleAfterHours: 12 }).state).toBe('stale');
  });
  it('unavailable when missing, unreadable or no date; inconsistent when bytes differ', () => {
    expect(classifyFreshness({ ...base, generatedAt: null, staleAfterHours: 24 }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, bytesActual: null, generatedAt: new Date(now).toISOString(), staleAfterHours: 24 }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, generatedAt: new Date(now).toISOString(), staleAfterHours: 24, fileError: true }).state).toBe('unavailable');
    expect(classifyFreshness({ ...base, bytesActual: 11, generatedAt: new Date(now).toISOString(), staleAfterHours: 24 }).state).toBe('inconsistent');
  });
  it('worst state and age text', () => {
    expect(worstOf(['fresh', 'stale', 'expired'])).toBe('expired');
    expect(worstOf(['fresh', 'unavailable', 'expired'])).toBe('unavailable');
    expect(ageText(0.01)).toBe('الآن');
    expect(ageText(5)).toBe('قبل 5 ساعة');
    expect(ageText(72)).toBe('قبل 3 يوم');
    expect(ageText(null)).toBe('غير معروف');
  });
});

describe('derived finance numbers', () => {
  const tx: Tx[] = [
    { id: '1', date: '2026-10-20', type: 'expense', amount: 10, wallet: 'يومية', cash_delta: -10, category_ar: 'طعام وبقالة' },
    { id: '2', date: '2026-10-22', type: 'expense', amount: 5.5, wallet: 'يومية', cash_delta: -5.5, category_ar: 'طعام وبقالة' },
    { id: '3', date: '2026-10-22', type: 'expense', amount: 4, wallet: 'خزينة', cash_delta: -4 },
    { id: '4', date: '2026-10-22', type: 'transfer', amount: 99, wallet: 'خزينة→يومية', cash_delta: 0 },
    { id: '5', date: '2026-10-23', type: 'expense', amount: 9, wallet: 'يومية', cash_delta: 0, category_ar: 'اشتراكات' },
  ];
  it('categories count only expenses and keep «unknown» honest', () => {
    const c = spendingByCategory(tx);
    expect(c[0]).toEqual({ category: 'طعام وبقالة', total: 15.5, count: 2 });
    expect(c.find((x) => x.category === 'غير مصنّف')?.total).toBe(4);
    expect(c.reduce((s, x) => s + x.total, 0)).toBe(28.5);
  });
  it('by day', () => {
    expect(spendingByDay(tx)).toEqual([{ date: '2026-10-20', total: 10 }, { date: '2026-10-22', total: 9.5 }, { date: '2026-10-23', total: 9 }]);
  });
  it('daily rate ignores cash_delta=0 (not applied to a box) and spans first..last day inclusive', () => {
    expect(dailySpendRate(tx)).toEqual({ rate: 5.17, days: 3, total: 15.5, count: 2 });
    expect(dailySpendRate([])).toBeNull();
  });
  it('coverage never divides by zero or null', () => {
    expect(coverage(58, 14)).toBe(4.14);
    expect(coverage(58, 0)).toBeNull();
    expect(coverage(null, 14)).toBeNull();
  });
});

describe('balance_history parsing (approved field; tolerant shapes, never invents points)', () => {
  const f = (v: unknown, key = 'balance_history'): Finance => ({ [key]: v }) as Finance;
  it('absent → no points, field null (UI shows «history not recorded yet»)', () => {
    expect(parseBalanceHistory({})).toEqual({ points: [], skipped: 0, field: null, title: null, method: null, omitted: [] });
    expect(parseBalanceHistory(null)).toMatchObject({ points: [], skipped: 0, field: null, omitted: [] });
  });
  it('flat points, items points, nested balances and the alias name', () => {
    const flat = parseBalanceHistory(f([{ date: '2026-10-02', treasury: 5, monthly: 1, daily: 2, total: 8 }, { date: '2026-10-01', treasury: 4, monthly: null, daily: 2 }]));
    expect(flat.points.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(flat.points[0]).toMatchObject({ treasury: 4, monthly: null, total: null });
    const items = parseBalanceHistory(f([{ as_of: '2026-10-03T10:00:00+08:00', items: [{ key: 'treasury', amount: 9 }, { key: 'total', amount: 12 }] }]));
    expect(items.points[0]).toMatchObject({ treasury: 9, total: 12, daily: null });
    expect(parseBalanceHistory(f([{ date: '2026-10-03', balances: { daily: 3 } }])).points[0]?.daily).toBe(3);
    expect(parseBalanceHistory(f([{ date: '2026-10-03', daily: 3 }], 'balances_history')).field).toBe('balances_history');
    expect(parseBalanceHistory(f({ points: [{ date: '2026-10-03', daily: 3 }] })).points).toHaveLength(1);
  });
  it('garbage is counted as skipped, not guessed', () => {
    const r = parseBalanceHistory(f([{ foo: 1 }, 'x', { date: 'nope', treasury: 1 }, { date: '2026-10-03' }, { date: '2026-10-04', treasury: 1 }]));
    expect(r.points).toHaveLength(1);
    expect(r.skipped).toBe(4);
  });
});

describe('balance_history v4 (Rashed real shape) + missing inputs', () => {
  const fin = {
    balance_history_title_ar: 'تطور', balance_history_method: 'طريقة',
    balance_history: [
      { date: '2026-10-20', as_of: null, treasury: 10, monthly: 5, daily: 1, total: 16, confidence: 'محسوب', source_row: null, event_ar: 'بداية', note_ar: 'أقدم حالة' },
      { date: '2026-10-20', as_of: '2026-10-20T14:25:00+08:00', treasury: 10, monthly: 5, daily: -3.38, total: 11.62, confidence: 'محسوب', source_row: 'TNG-1', event_ar: 'بعد استيراد' },
      { date: '2026-10-26', as_of: '2026-10-26T14:20:00+08:00', treasury: 9, monthly: 5, daily: -3.38, total: 10.62, confidence: 'محسوب', source_row: 'X' },
    ],
    balance_history_omitted: [{ rows: '1-38', dates: 'a إلى b', reason_ar: 'سبب' }, { rows: '58', reason_ar: 'دمج' }, { foo: 1 }],
  } as unknown as Finance;
  it('parses date-only first point, negative balances, events, confidence, omitted ranges', () => {
    const r = parseBalanceHistory(fin);
    expect(r.points).toHaveLength(3);
    expect(r.points[0]).toMatchObject({ dateOnly: true, event: 'بداية', note: 'أقدم حالة', sourceRow: null, confidence: 'محسوب' });
    expect(r.points[1]).toMatchObject({ dateOnly: false, daily: -3.38, sourceRow: 'TNG-1' });
    expect(r.points.map((p) => p.t)).toEqual([...r.points.map((p) => p.t)].sort((a, b) => a - b));
    expect(r.omitted).toEqual([{ rows: '1-38', dates: 'a إلى b', reason: 'سبب' }, { rows: '58', dates: null, reason: 'دمج' }]);
    expect(r.title).toBe('تطور');
    expect(r.method).toBe('طريقة');
    expect(r.skipped).toBe(0);
  });
  it('missing inputs keep null as null and never fill values', () => {
    const m = missingInputs({ a: { value: null, unit: 'RM', note_ar: 'ن', confidence: 'غير مسجل', needed_for_ar: 'ل', related: 'R-1' }, b: { value: 5, unit: null, note_ar: 'x' }, c: 'bad' });
    expect(m).toHaveLength(2);
    expect(m[0]).toEqual({ key: 'a', label: null, value: null, unit: 'RM', note: 'ن', confidence: 'غير مسجل', needed_for: 'ل', related: 'R-1' });
    expect(countMissing(m)).toBe(1);
    expect(missingInputs(null)).toEqual([]);
    expect(missingInputs([1])).toEqual([]);
  });
});

describe('body, routine and commands helpers', () => {
  it('weight progress uses confirmed baseline, latest recorded reading and goal', () => {
    const p = weightProgress({ items: [{ key: 'weight', value: 84.3 }], goal_kg: 63, latest_recorded_weight: { value_kg: 83.65 } });
    expect(p).toMatchObject({ baseline: 84.3, latest: 83.65, goal: 63, lost: 0.65, remaining: 20.65 });
    expect(p!.pct).toBeCloseTo(3.05, 1);
    expect(weightProgress({ items: [], goal_kg: 63 })).toBeNull();
  });
  it('routine now/next in Kuala Lumpur time', () => {
    const r = { daily_blocks: [{ name: 'نوم', start: '00:00', end: '05:00', days: ['mon'] }, { name: 'غداء', start: '13:00', end: '14:00', days: ['mon'] }], weekly_study_blocks: [{ name: 'محاضرة', start: '08:00', end: '10:00', days: ['mon'] }] };
    expect(blocksForDay(r, 'mon').map((x) => x.b.name)).toEqual(['نوم', 'محاضرة', 'غداء']);
    const a = nowAndNext(r, Date.parse('2026-10-26T08:30:00+08:00'));
    expect(a.day).toBe('mon');
    expect(a.current.map((x) => x.b.name)).toEqual(['محاضرة']);
    expect(a.next?.b.name).toBe('غداء');
    expect(nowAndNext(r, Date.parse('2026-10-26T20:00:00+08:00')).next).toBeNull();
    expect(nowAndNext(r, Date.parse('2026-10-26T00:30:00+00:00')).day).toBe('mon'); // 08:30 KL
  });
  it('command ids and payload validation', () => {
    expect(commandId(new Date('2026-10-26T10:05:00Z'), 1)).toBe('CMD-20261026-180500-001');
    expect(validatePayload('log_expense', { date: '2026-10-26', amount: 9.29, currency: 'RM', box: 'daily', category_ar: 'طعام', label_ar: 'غداء', payment_source: 'tng' })).toEqual({});
    expect(Object.keys(validatePayload('log_expense', { date: 'x', amount: -1, currency: 'USD', box: 'q' }))).toEqual(expect.arrayContaining(['date', 'amount', 'currency', 'box', 'label_ar', 'category_ar', 'payment_source']));
    expect(validatePayload('log_prayer', { date: '2026-10-26', prayer: 'fajr', status: 'late', kind: 'qada' })).toEqual({});
    expect(validatePayload('log_prayer', { date: '2026-10-26', prayer: 'zuhr', status: 'late', kind: 'x' })).toHaveProperty('prayer');
    expect(validatePayload('refresh_exports', { files: [] })).toEqual({});
    expect(validatePayload('refresh_exports', { files: [1] })).toHaveProperty('files');
    expect(validatePayload('start_habit', { habit: 'vape', start_date: '2026-10-26', note_ar: 'x'.repeat(501) })).toHaveProperty('note_ar');
  });
  it('shape check catches wrong container types but accepts new fields', () => {
    expect(checkShape('finance', { recent_transactions: 'x' })).toMatch(/recent_transactions/);
    expect(checkShape('finance', { recent_transactions: [{ date: 'x' }] })).toMatch(/amount/);
    expect(checkShape('finance', { brand_new_field: 1, recent_transactions: [] })).toBeNull();
    expect(checkShape('habits', { habits: [{ key: 'a' }] })).toMatch(/name_ar/);
    expect(checkShape('body', [])).toMatch(/ليس كائن/);
  });
});

/* ───── API ───── */
let srv: Running;
let base: string;
let dir: string;
async function call(method: string, url: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(base + url, { method, headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  const t = await res.text();
  let j: unknown = t;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    /* نص */
  }
  return { status: res.status, json: j };
}
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const n of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, n.name);
      if (n.isDirectory()) walk(p);
      else out[path.relative(root, p)] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex') + ':' + fs.statSync(p).mtimeMs;
    }
  };
  walk(root);
  return out;
}

beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  process.env['PLATFORM_LIFE_ROOT'] = path.join(dir, 'missing');
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  delete process.env['PLATFORM_LIFE_ROOT'];
  fs.rmSync(dir, { recursive: true, force: true });
});

describe(`life API (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('missing folder → unavailable, clear message, no crash', async () => {
    const s = await call('GET', '/api/life/status');
    expect(s.status).toBe(200);
    expect(s.json.root_exists).toBe(false);
    expect(s.json.worst).toBe('unavailable');
    expect(s.json.default_root).toContain('The_Boots');
    expect(s.json.default_root).toContain('exchange\\rashed');
    const d = await call('GET', '/api/life/data/finance');
    expect(d.json.data).toBeFalsy();
    expect(d.json.status.state).toBe('unavailable');
  });
  it('validates settings', async () => {
    expect((await call('PUT', '/api/life/settings', { root: 'rel' })).status).toBe(400);
    expect((await call('PUT', '/api/life/settings', { root: path.join(dir, 'nope2') })).json.fields.root).toMatch(/غير موجود/);
  });

  let root: string;
  let before: Record<string, string>;
  it('fresh fixture → all fresh, meta read', async () => {
    root = path.join(dir, 'rashed');
    buildLifeFixture(root, { balanceHistory: 'v4' });
    before = snapshot(root);
    const put = await call('PUT', '/api/life/settings', { root });
    expect(put.status).toBe(200);
    expect(put.json.meta).toMatchObject({ version: 4, writer: 'FIXTURE (synthetic)', read_only: true });
    expect(put.json.worst).toBe('fresh');
    expect(put.json.files.map((f: any) => f.name).sort()).toEqual(['body', 'dashboard_summary', 'finance', 'habits', 'prayers', 'routine']);
    expect(put.json.files.every((f: any) => f.bytes_meta === f.bytes_actual && f.threshold_source === 'meta')).toBe(true);
    expect(put.json.commands_dir).toBe(true);
  });
  it('serves each file and a bundle', async () => {
    for (const n of ['finance', 'prayers', 'habits', 'routine', 'body', 'dashboard_summary']) {
      const r = await call('GET', `/api/life/data/${n}`);
      expect(r.status).toBe(200);
      expect(r.json.data).toBeTruthy();
      expect(r.json.status.state).toBe('fresh');
    }
    const b = await call('GET', '/api/life/bundle?files=finance,body,../../etc/passwd');
    expect(Object.keys(b.json.files).sort()).toEqual(['body', 'finance']);
    expect((await call('GET', '/api/life/data/..%2Fexports_meta')).status).toBe(404);
    expect((await call('GET', '/api/life/data/exports_meta')).status).toBe(404);
  });
  it('content endpoint: whitelisted JSON docs with freshness; others 404', async () => {
    const e = await call('GET', '/api/life/content/SPORTS_EXERCISES.json');
    expect(e.status).toBe(200);
    expect(e.json.data.exercises).toHaveLength(6);
    expect(e.json.status).toMatchObject({ state: 'fresh', stale_after_hours: 720, error: null });
    expect((await call('GET', '/api/life/content/SPORTS_PLANS_AR.json')).json.data.templates).toHaveLength(2);
    expect((await call('GET', '/api/life/content/HABITS_ALTERNATIVES_AR.json')).json.data.habits).toHaveLength(2);
    expect((await call('GET', '/api/life/content/GLOSSARY_AR.json')).json.data.entries.length).toBe(8);
    expect((await call('GET', '/api/life/content/finance.json')).status).toBe(404);
    expect((await call('GET', '/api/life/content/..%2Ffinance.json')).status).toBe(404);
  });
  it('docs whitelist only', async () => {
    expect((await call('GET', '/api/life/docs/SPORTS_CONTENT_AR.md')).json.text).toContain('وهمي');
    expect((await call('GET', '/api/life/docs/..%2Ffinance.json')).status).toBe(404);
    expect((await call('GET', '/api/life/docs/README.md')).status).toBe(404);
    expect((await call('GET', '/api/life/docs/SITE_IDEAS_AR.md')).status).toBe(404); // غير موجود في الفيكستشر
  });
  it('reading never changes the exports (sha1 + mtime identical)', async () => {
    await call('GET', '/api/life/status');
    await call('GET', '/api/life/bundle');
    await call('GET', '/api/life/commands');
    expect(snapshot(root)).toEqual(before);
  });

  it('stale and expired states follow generated_at and stale_after_hours', async () => {
    const old = (h: number) => new Date(Date.now() - h * H).toISOString();
    const r2 = path.join(dir, 'rashed_old');
    buildLifeFixture(r2, { fileGeneratedAt: { finance: old(30), prayers: old(40), habits: old(1) } });
    await call('PUT', '/api/life/settings', { root: r2 });
    const s = (await call('GET', '/api/life/status')).json;
    const st = Object.fromEntries(s.files.map((f: any) => [f.name, f.state]));
    expect(st).toMatchObject({ finance: 'stale', prayers: 'expired', habits: 'fresh' });
    expect(s.worst).toBe('expired');
  });
  it('size mismatch → inconsistent; invalid JSON / changed format → unavailable with reason', async () => {
    const r3 = path.join(dir, 'rashed_bad');
    buildLifeFixture(r3, { badBytes: 'body' });
    fs.writeFileSync(path.join(r3, 'routine.json'), '{ not json');
    const fin = JSON.parse(fs.readFileSync(path.join(r3, 'finance.json'), 'utf8'));
    fin.recent_transactions = 'oops';
    fs.writeFileSync(path.join(r3, 'finance.json'), JSON.stringify(fin));
    await call('PUT', '/api/life/settings', { root: r3 });
    const s = (await call('GET', '/api/life/status')).json;
    const by = Object.fromEntries(s.files.map((f: any) => [f.name, f]));
    expect(by.body.state).toBe('inconsistent');
    expect(by.routine.state).toBe('unavailable');
    expect(by.routine.error).toMatch(/JSON/);
    expect(by.finance.state).toBe('unavailable');
    expect(by.finance.error).toMatch(/تغيّر تنسيق/);
    expect((await call('GET', '/api/life/data/finance')).json.data).toBeFalsy();
    expect((await call('GET', '/api/life/data/body')).json.data).toBeTruthy();
  });
  it('missing exports_meta → everything unavailable (REFRESH_PROTOCOL §2.5) but data still readable', async () => {
    const r4 = path.join(dir, 'rashed_nometa');
    buildLifeFixture(r4, { noMeta: true });
    await call('PUT', '/api/life/settings', { root: r4 });
    const s = (await call('GET', '/api/life/status')).json;
    expect(s.meta).toBeNull();
    expect(s.meta_error).toMatch(/exports_meta/);
    expect(s.files.every((f: any) => f.state === 'unavailable')).toBe(true);
  });
  it('BOM-prefixed JSON (Windows PowerShell) is read correctly', async () => {
    const r5 = path.join(dir, 'rashed_bom');
    buildLifeFixture(r5);
    const p = path.join(r5, 'body.json');
    const txt = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, '\ufeff' + txt);
    const meta = JSON.parse(fs.readFileSync(path.join(r5, 'exports_meta.json'), 'utf8'));
    meta.files.find((f: any) => f.name === 'body.json').bytes = Buffer.byteLength('\ufeff' + txt);
    fs.writeFileSync(path.join(r5, 'exports_meta.json'), JSON.stringify(meta));
    await call('PUT', '/api/life/settings', { root: r5 });
    const d = await call('GET', '/api/life/data/body');
    expect(d.json.data.goal_kg).toBe(70);
  });

  describe('commands (drafts only)', () => {
    const good = { type: 'log_expense', confirm: true, payload: { date: '2026-10-26', amount: 9.29, currency: 'RM', box: 'daily', category_ar: 'طعام وبقالة', label_ar: 'غداء', payment_source: 'tng' } };
    let r6: string;
    it('refuses without explicit confirm, bad type, bad payload, missing commands dir', async () => {
      r6 = path.join(dir, 'rashed_cmd');
      buildLifeFixture(r6);
      await call('PUT', '/api/life/settings', { root: r6 });
      const b0 = snapshot(r6);
      expect((await call('POST', '/api/life/commands', { ...good, confirm: false })).json.fields.confirm).toBeTruthy();
      expect((await call('POST', '/api/life/commands', { ...good, type: 'delete_everything' })).status).toBe(400);
      expect((await call('POST', '/api/life/commands', { ...good, payload: { ...good.payload, amount: -5 } })).json.fields.amount).toBeTruthy();
      expect((await call('POST', '/api/life/commands', { ...good, payload: undefined })).status).toBe(400);
      expect(snapshot(r6)).toEqual(b0);
      const nodir = path.join(dir, 'rashed_nocmd');
      buildLifeFixture(nodir);
      fs.rmSync(path.join(nodir, 'commands'), { recursive: true });
      await call('PUT', '/api/life/settings', { root: nodir });
      expect((await call('POST', '/api/life/commands', good)).status).toBe(409);
      expect(fs.existsSync(path.join(nodir, 'commands'))).toBe(false);
      await call('PUT', '/api/life/settings', { root: r6 });
    });
    it('creates exactly one NEW pending file; nothing else changes; never overwrites; examples ignored in list', async () => {
      const b0 = snapshot(r6);
      const c1 = await call('POST', '/api/life/commands', good);
      expect(c1.status).toBe(201);
      expect(c1.json.command).toMatchObject({ status: 'pending', created_by: 'site', type: 'log_expense' });
      expect(c1.json.command.id).toMatch(/^CMD-\d{8}-\d{6}-\d{3}$/);
      const c2 = await call('POST', '/api/life/commands', good);
      expect(c2.json.command.id).not.toBe(c1.json.command.id);
      const after = snapshot(r6);
      const added = Object.keys(after).filter((k) => !(k in b0));
      expect(added.sort()).toEqual([path.join('commands', c1.json.file), path.join('commands', c2.json.file)].sort());
      for (const k of Object.keys(b0)) expect(after[k]).toBe(b0[k]);
      const file = JSON.parse(fs.readFileSync(path.join(r6, 'commands', c1.json.file), 'utf8'));
      expect(file).toMatchObject({ id: c1.json.command.id, status: 'pending', payload: good.payload });
      expect(fs.readFileSync(path.join(r6, 'commands', c1.json.file))[0]).not.toBe(0xef); // بلا BOM
      const l = await call('GET', '/api/life/commands');
      expect(l.json.commands.map((c: any) => c.id)).toEqual(expect.arrayContaining([c1.json.command.id, c2.json.command.id]));
      expect(l.json.commands.some((c: any) => String(c.id).startsWith('EXAMPLE'))).toBe(false);
    });
  });
});
const BUNDLED = path.resolve(import.meta.dirname, '..', '..', 'exchange', 'rashed');
const REAL = process.env['RASHED_FIXTURE_DIR'] ?? (fs.existsSync(BUNDLED) ? BUNDLED : '/workspace/rashed_fixture');
describe.skipIf(!fs.existsSync(path.join(REAL, 'exports_meta.json')))('real Rashed exports (local copy only; skipped elsewhere)', () => {
  it('every data file passes the shape check and is consistent with exports_meta', async () => {
    await call('PUT', '/api/life/settings', { root: REAL });
    const s = (await call('GET', '/api/life/status')).json;
    for (const f of s.files) {
      expect(f.error, f.name).toBeNull();
      expect(f.state === 'unavailable' || f.state === 'inconsistent', f.name).toBe(false);
    }
    const fin = (await call('GET', '/api/life/data/finance')).json.data;
    expect(fin.recent_transactions.length).toBeGreaterThan(0);
    expect(spendingByCategory(fin.recent_transactions).length).toBeGreaterThan(0);
    const h = parseBalanceHistory(fin);
    if (fin.balance_history !== undefined) {
      expect(h.points.length).toBeGreaterThanOrEqual(2);
      expect(h.skipped).toBe(0);
      expect(h.points.every((p) => p.total !== null && Math.abs((p.treasury ?? 0) + (p.monthly ?? 0) + (p.daily ?? 0) - p.total) < 0.011)).toBe(true);
      expect(h.omitted.length).toBeGreaterThan(0);
    }
    for (const n of ['SPORTS_EXERCISES.json', 'SPORTS_PLANS_AR.json', 'HABITS_ALTERNATIVES_AR.json', 'GLOSSARY_AR.json']) {
      if (fs.existsSync(path.join(REAL, 'docs', n))) {
        const c = (await call('GET', `/api/life/content/${n}`)).json;
        expect(c.status.error, n).toBeNull();
        expect(c.data, n).toBeTruthy();
      }
    }
  });
});
