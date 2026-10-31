/** ترحيل 5 + 6 على نسخة من القاعدة الحقيقية: لا فقدان بيانات (عدّ كل جدول قبل/بعد) + إضافات فقط. */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDb } from '../server/db.js';
import { migrate, SCHEMA_VERSION } from '../server/schema.js';
import { ROOT, tmpDir } from './helpers.js';

const REAL = path.join(ROOT, 'data', 'platform.db');

describe.skipIf(!fs.existsSync(REAL))(`migration on a copy of the real DB (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('keeps every row of every existing table and adds the work-os tables', () => {
    const dir = tmpDir('platform-mig-');
    const file = path.join(dir, 'platform.db');
    // ننسخ الملف مع WAL/SHM ثم نفتح النسخة فقط — الملف الأصلي (متتبَّع في git) لا يُفتح إطلاقًا
    for (const ext of ['', '-wal', '-shm']) if (fs.existsSync(REAL + ext)) fs.copyFileSync(REAL + ext, file + ext);
    const db = openDb(file);
    const tables = (): string[] => db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
    const count = (t: string): number => db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`)!.n;
    const before = new Map(tables().map((t) => [t, count(t)]));
    const ver0 = db.get<{ v: number }>('SELECT MAX(id) AS v FROM core_migrations')!.v;
    migrate(db);
    migrate(db); // إعادة التشغيل لا تغيّر شيئًا
    const after = new Map(tables().map((t) => [t, count(t)]));
    for (const [t, n] of before) {
      if (t === 'core_migrations') continue;
      if (t === 'core_settings') expect(after.get(t)).toBeGreaterThanOrEqual(n);
      else expect({ t, n: after.get(t) }).toEqual({ t, n });
    }
    expect(db.get<{ v: number }>('SELECT MAX(id) AS v FROM core_migrations')!.v).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBeGreaterThan(ver0);
    for (const t of ['wos_spaces', 'wos_items', 'wos_types', 'wos_views', 'wos_relations', 'wos_history', 'wos_trash', 'wos_automations', 'wos_inbox', 'wos_shares', 'wos_templates', 'ai_threads', 'ai_runs']) expect(tables()).toContain(t);
    expect(count('wos_workspaces')).toBe(1);
    // البيانات الحقيقية المهمة موجودة
    expect(count('acad_semesters')).toBeGreaterThan(0);
    expect(count('lib_files')).toBeGreaterThan(0);
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe(`legacy migration ids from the work-os line (${process.env['PLATFORM_DB_DRIVER'] ?? 'auto'})`, () => {
  it('a DB that applied work-os as 4–6 is renumbered to 10–12 and then gets the kitchen migrations 4–6', () => {
    const dir = tmpDir('platform-mig-legacy-');
    const db = openDb(path.join(dir, 'platform.db'));
    migrate(db);
    // نُحاكي قاعدة الخط القديم: ترحيلات 4/5/6 بأسمائها القديمة (حزم/work-os/ai_core) وبلا جداول المطبخ
    const names = new Map(db.all<{ id: number; name: string }>('SELECT id, name FROM core_migrations WHERE id >= 10').map((r) => [r.id, r.name]));
    for (const id of [4, 5, 6]) db.run('DELETE FROM core_migrations WHERE id = ?', id);
    for (const [from, to] of [[10, 4], [11, 5], [12, 6]] as const) db.run('UPDATE core_migrations SET id = ? WHERE id = ?', to, from);
    for (const t of db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE 'kitchen_%')").map((r) => r.name)) db.exec(`DROP TABLE ${t}`);
    const rowsBefore = db.get<{ n: number }>('SELECT COUNT(*) AS n FROM wos_workspaces')!.n;
    migrate(db);
    const ids = db.all<{ id: number; name: string }>('SELECT id, name FROM core_migrations ORDER BY id');
    expect(ids.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(ids.find((r) => r.id === 10)!.name).toBe(names.get(10));
    expect(ids.find((r) => r.id === 4)!.name).toMatch(/^kitchen/);
    expect(db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'kitchen_prices'")!.n).toBe(1);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM wos_workspaces')!.n).toBe(rowsBefore);
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
