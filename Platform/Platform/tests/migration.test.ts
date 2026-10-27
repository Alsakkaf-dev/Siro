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
