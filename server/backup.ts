import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './db.js';

export interface BackupInfo {
  /** مسار نسبي آمن مثل 2026-10-26/platform_auto.db */
  name: string;
  date: string;
  file: string;
  size: number;
  mtime: string;
}

const NAME_RE = /^\d{4}-\d{2}-\d{2}\/[A-Za-z0-9_.-]+\.db$/;
export const KEEP_DAYS = 14;

const pad = (n: number): string => String(n).padStart(2, '0');
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function localTime(d = new Date()): string {
  return `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function listBackups(dir: string): BackupInfo[] {
  if (!fs.existsSync(dir)) return [];
  const out: BackupInfo[] = [];
  for (const day of fs.readdirSync(dir)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const dp = path.join(dir, day);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const f of fs.readdirSync(dp)) {
      if (!f.endsWith('.db')) continue;
      const st = fs.statSync(path.join(dp, f));
      out.push({ name: `${day}/${f}`, date: day, file: f, size: st.size, mtime: st.mtime.toISOString() });
    }
  }
  return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

export function createBackup(db: Db, dir: string, label = 'manual'): BackupInfo {
  const day = localDate();
  const safe = label.replace(/[^A-Za-z0-9_-]/g, '');
  const file = label === 'auto' ? 'platform_auto.db' : `platform_${safe}_${localTime()}.db`;
  const target = path.join(dir, day, file);
  db.backupTo(target);
  pruneBackups(dir);
  const st = fs.statSync(target);
  return { name: `${day}/${file}`, date: day, file, size: st.size, mtime: st.mtime.toISOString() };
}

/** نسخة يومية تلقائية (مرة واحدة باليوم). */
export function ensureDailyBackup(db: Db, dir: string): BackupInfo | null {
  if (fs.existsSync(path.join(dir, localDate(), 'platform_auto.db'))) return null;
  return createBackup(db, dir, 'auto');
}

/** نحتفظ بآخر 14 يومًا فقط. */
export function pruneBackups(dir: string): void {
  if (!fs.existsSync(dir)) return;
  const days = fs
    .readdirSync(dir)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();
  for (const d of days.slice(KEEP_DAYS)) fs.rmSync(path.join(dir, d), { recursive: true, force: true });
}

export function resolveBackup(dir: string, name: string): string | null {
  if (!NAME_RE.test(name)) return null;
  const full = path.resolve(dir, name);
  if (!full.startsWith(path.resolve(dir) + path.sep)) return null;
  return fs.existsSync(full) ? full : null;
}
