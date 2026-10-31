// واجهة وجبات الجدول: الدورة الدفعية AC-09، الوجبة اليدوية CAL-52، لقطة CAL-50، أرشفة CAL-51، والقانون حاجز في كل المسارات (AC-07/J7).
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Running } from '../server/index.js';
import { tmpDir } from './helpers.js';

let srv: Running;
let base: string;
let dir: string;
const H = { 'X-Kitchen-Client': 'meals-test' };
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
const plan = async (from: string, days: number): Promise<any[]> => (await call('GET', `/api/kitchen/plan?from=${from}&days=${days}`)).json.days;
const count = (): number => srv.getDb().get<{ n: number }>('SELECT COUNT(*) n FROM kitchen_plan_days')!.n;

beforeAll(async () => {
  dir = tmpDir();
  process.env['PLATFORM_NO_AUTOSCAN'] = '1';
  srv = await startServer({ port: 0, dataDir: path.join(dir, 'data'), backupsDir: path.join(dir, 'backups') });
  base = `http://127.0.0.1:${srv.cfg.port}`;
});
afterAll(async () => {
  await srv.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('الدورة الدفعية (CAL-36، AC-09)', () => {
  const b = { from: '2026-11-01', to: '2026-11-30', scale: 1, auto_fit: false };
  it('معاينة 30 يومًا = 30 سطرًا كلها داخل المجال، ودورة الأيام تتبع (التاريخ − 2026-10-23) mod 3', async () => {
    const r = await call('POST', '/api/kitchen/plan/cycle', { ...b, apply: false });
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ ok: true, days: 30, violations: 0, conflicts: 0 });
    expect(r.json.rows).toHaveLength(30);
    for (const row of r.json.rows) {
      expect(row.total_kcal).toBeGreaterThanOrEqual(1200);
      expect(row.total_kcal).toBeLessThanOrEqual(1500);
      const off = Math.round((Date.parse(`${row.date}T00:00:00Z`) - Date.parse('2026-10-23T00:00:00Z')) / 86_400_000);
      expect(row.cycle_day).toBe((off % 3) + 1);
    }
    expect(count()).toBe(0); // المعاينة لا تحفظ
  });
  it('دفعة فيها يوم مخالف تُرفض كلها بلا أي حفظ (مضاعف ×1.5 يكسر الحد الأعلى)', async () => {
    const pv = await call('POST', '/api/kitchen/plan/cycle', { ...b, scale: 1.5, apply: false });
    expect(pv.json.ok).toBe(false);
    expect(pv.json.violations).toBeGreaterThan(0);
    const ap = await call('POST', '/api/kitchen/plan/cycle', { ...b, scale: 1.5, apply: true });
    expect(ap.status).toBe(422);
    expect(ap.json.code).toBe('cycle_violation');
    expect(count()).toBe(0);
  });
  it('التطبيق يحفظ 30 يومًا ذرّيًا بلقطة CAL-50 (بصمة + مصدر codex)، وتعارض الأيام يمنع إلا بالاستبدال', async () => {
    const ap = await call('POST', '/api/kitchen/plan/cycle', { ...b, apply: true });
    expect(ap.status).toBe(201);
    expect(ap.json.saved).toBe(30);
    expect(count()).toBe(30);
    const days = await plan('2026-11-01', 30);
    expect(days).toHaveLength(30);
    const d1 = days.find((d) => d.date === '2026-11-01')!;
    expect(d1.status).toBe('proposal');
    expect(d1.slots.map((s: any) => s.source)).toEqual(['codex', 'codex', 'codex']);
    expect(d1.slots.every((s: any) => typeof s.card_hash === 'string' && s.saved_at)).toBe(true);
    const again = await call('POST', '/api/kitchen/plan/cycle', { ...b, apply: true });
    expect(again.status).toBe(409);
    expect(again.json.code).toBe('conflict');
    expect((await call('POST', '/api/kitchen/plan/cycle', { ...b, apply: true, overwrite: true })).status).toBe(201);
    expect(count()).toBe(30);
  });
  it('الملاءمة التلقائية في الدورة تقرّب الأيام من 1300 (LAW-09: اليوم 3 هامشه 14 فقط)', async () => {
    const r = await call('POST', '/api/kitchen/plan/cycle', { from: '2026-12-01', to: '2026-12-03', scale: 1, auto_fit: true, apply: false });
    expect(r.json.ok).toBe(true);
    for (const row of r.json.rows) expect(Math.abs(row.total_kcal - 1300)).toBeLessThanOrEqual(50);
  });
  it('مدى أكبر من 120 يومًا أو معكوس يُرفض', async () => {
    expect((await call('POST', '/api/kitchen/plan/cycle', { ...b, to: '2027-06-30' })).json.code).toBe('range_too_big');
    expect((await call('POST', '/api/kitchen/plan/cycle', { ...b, from: '2026-11-30', to: '2026-11-01' })).json.code).toBe('bad_range');
  });
  it('الكتابة بلا ترويسة العميل ممنوعة', async () => {
    const r = await fetch(`${base}/api/kitchen/plan/cycle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, apply: true }) });
    expect(r.status).toBe(403);
  });
});

describe('الوجبة اليدوية CAL-52 والقانون حاجز', () => {
  const man = (title: string, kcal: number) => ({ manual: { title_ar: title, kcal, protein_g: 20, carbs_g: 40, fat_g: 10, fiber_g: 3 } });
  it('يوم يدوي بـ1300 يُحفظ بمصدر manual؛ 1501 أو 1199 مكتملًا يُرفض برسالة المجموع والفرق وحلول', async () => {
    const ok = await call('PUT', '/api/kitchen/plan/2026-12-10', { slots: { 'فطور': man('أ', 400), 'غداء': man('ب', 500), 'عشاء': man('ج', 400) } });
    expect(ok.status).toBe(200);
    expect(ok.json.slots.map((s: any) => s.source)).toEqual(['manual', 'manual', 'manual']);
    const hi = await call('PUT', '/api/kitchen/plan/2026-12-11', { slots: { 'فطور': man('أ', 500), 'غداء': man('ب', 600), 'عشاء': man('ج', 401) } });
    expect(hi.status).toBe(422);
    expect(hi.json).toMatchObject({ code: 'law', total_kcal: 1501, diff: 1 });
    expect(hi.json.solutions.length).toBeGreaterThanOrEqual(1);
    const lo = await call('PUT', '/api/kitchen/plan/2026-12-11', { slots: { 'فطور': man('أ', 400), 'غداء': man('ب', 400), 'عشاء': man('ج', 399) } });
    expect(lo.json).toMatchObject({ code: 'law', total_kcal: 1199, diff: 1 });
    expect((await plan('2026-12-11', 1))).toHaveLength(0);
  });
  it('الاختيار بين بطاقة ويدوي إلزامي، والملاءمة مع يدوي تُرفض بسبب معلن في المعاينة', async () => {
    expect((await call('PUT', '/api/kitchen/plan/2026-12-12', { slots: { 'فطور': { card: 'bk-03', ...man('x', 1) } } })).status).toBe(400);
    const pv = await call('POST', '/api/kitchen/plan/preview', { slots: { 'فطور': man('أ', 300), 'غداء': { card: 'cy-ln-01' }, 'عشاء': { card: 'cy-dn-04' } }, auto_fit: true });
    expect(pv.json.autoFit).toBeNull();
    expect(pv.json.autoFitReason).toContain('وجبة يدوية');
  });
  it('بطاقة دورة cy-… تُقبل في الخانة بمصدر codex', async () => {
    const r = await call('PUT', '/api/kitchen/plan/2026-12-13', { slots: { 'فطور': { card: 'cy-bk-03' } } });
    expect(r.status).toBe(200);
    expect(r.json.slots[0]).toMatchObject({ card_slug: 'cy-bk-03', source: 'codex' });
  });
});

describe('لقطة CAL-50 وأرشفة CAL-51', () => {
  const FUT = '2099-01-05';
  let slug = '';
  it('تغيير البطاقة بعد الحفظ يعلّم اليوم المستقبلي «البطاقة تحدّثت»، واليوم الماضي لا يُعلَّم', async () => {
    const v = await call('POST', '/api/kitchen/cards/variant', { parent_slug: 'bk-03', scale: 0.5, name_ar: 'نسخة اختبار' });
    expect(v.status).toBe(201);
    slug = v.json.card.slug;
    expect((await call('PUT', `/api/kitchen/plan/${FUT}`, { slots: { 'فطور': { card: slug } } })).json.slots[0].source).toBe('creation');
    expect((await call('PUT', '/api/kitchen/plan/2020-01-05', { slots: { 'فطور': { card: slug } } })).status).toBe(200);
    expect((await plan(FUT, 1))[0].slots[0].card_updated).toBeUndefined();
    expect((await call('PATCH', `/api/kitchen/cards/${slug}`, { steps_ar: ['1: خطوة جديدة تغيّر البصمة.'] })).status).toBe(200);
    expect((await plan(FUT, 1))[0].slots[0].card_updated).toBe(true);
    expect((await plan('2020-01-05', 1))[0].slots[0].card_updated).toBeUndefined();
  });
  it('الحذف الصلب لبطاقة مستعملة في الجدول يُمنع (409) مع الأيام، والأرشفة تنجح ولا تمسّ اللقطة', async () => {
    const del = await call('DELETE', `/api/kitchen/cards/${slug}`);
    expect(del.status).toBe(409);
    expect(del.json.code).toBe('used_in_plan');
    expect(del.json.days).toEqual(['2020-01-05', FUT]);
    expect((await call('PATCH', `/api/kitchen/cards/${slug}`, { hidden: true })).status).toBe(200);
    expect((await plan(FUT, 1))[0].slots[0].card_slug).toBe(slug);
    expect((await call('DELETE', `/api/kitchen/plan/${FUT}`)).status).toBe(200);
    expect((await call('DELETE', `/api/kitchen/plan/2020-01-05`)).status).toBe(200);
    expect((await call('DELETE', `/api/kitchen/cards/${slug}`)).status).toBe(200);
  });
});
