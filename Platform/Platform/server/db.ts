import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export type SqlValue = string | number | bigint | null | boolean | undefined;

export interface Db {
  readonly driver: 'better-sqlite3' | 'node:sqlite';
  readonly file: string;
  exec(sql: string): void;
  all<T = Record<string, unknown>>(sql: string, ...params: SqlValue[]): T[];
  get<T = Record<string, unknown>>(sql: string, ...params: SqlValue[]): T | undefined;
  run(sql: string, ...params: SqlValue[]): { changes: number };
  tx<T>(fn: () => T): T;
  /** نسخة احتياطية متسقة (VACUUM INTO) */
  backupTo(file: string): void;
  close(): void;
}

interface RawStatement {
  all(...p: unknown[]): unknown[];
  get(...p: unknown[]): unknown;
  run(...p: unknown[]): { changes: number | bigint };
}
interface RawDb {
  exec(sql: string): void;
  prepare(sql: string): RawStatement;
  close(): void;
}

const require = createRequire(import.meta.url);

function clean(params: SqlValue[]): unknown[] {
  return params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
}

function openRaw(file: string): { raw: RawDb; driver: Db['driver'] } {
  const forced = process.env['PLATFORM_DB_DRIVER'];
  if (forced !== 'node:sqlite') {
    try {
      const BetterSqlite = require('better-sqlite3') as new (f: string) => RawDb;
      return { raw: new BetterSqlite(file), driver: 'better-sqlite3' };
    } catch (err) {
      if (forced === 'better-sqlite3') throw err;
      console.warn('[db] better-sqlite3 غير متاح، سيتم استخدام node:sqlite المدمج.');
    }
  }
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (f: string) => RawDb };
  return { raw: new DatabaseSync(file), driver: 'node:sqlite' };
}

export function openDb(file: string): Db {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { raw, driver } = openRaw(file);
  raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;');
  let depth = 0;
  const db: Db = {
    driver,
    file,
    exec: (sql) => raw.exec(sql),
    all: <T>(sql: string, ...params: SqlValue[]) => raw.prepare(sql).all(...clean(params)) as T[],
    get: <T>(sql: string, ...params: SqlValue[]) => raw.prepare(sql).get(...clean(params)) as T | undefined,
    run: (sql, ...params) => {
      const r = raw.prepare(sql).run(...clean(params));
      return { changes: Number(r.changes) };
    },
    tx: <T>(fn: () => T): T => {
      if (depth > 0) return fn();
      raw.exec('BEGIN IMMEDIATE');
      depth++;
      try {
        const r = fn();
        raw.exec('COMMIT');
        return r;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      } finally {
        depth--;
      }
    },
    backupTo: (target) => {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) fs.rmSync(target);
      raw.prepare('VACUUM INTO ?').run(target);
    },
    close: () => raw.close(),
  };
  return db;
}
