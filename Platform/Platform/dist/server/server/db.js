import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function clean(params) {
    return params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));
}
function openRaw(file) {
    const forced = process.env['PLATFORM_DB_DRIVER'];
    if (forced !== 'node:sqlite') {
        try {
            const BetterSqlite = require('better-sqlite3');
            return { raw: new BetterSqlite(file), driver: 'better-sqlite3' };
        }
        catch (err) {
            if (forced === 'better-sqlite3')
                throw err;
            console.warn('[db] better-sqlite3 غير متاح، سيتم استخدام node:sqlite المدمج.');
        }
    }
    const { DatabaseSync } = require('node:sqlite');
    return { raw: new DatabaseSync(file), driver: 'node:sqlite' };
}
export function openDb(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const { raw, driver } = openRaw(file);
    raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;');
    let depth = 0;
    const db = {
        driver,
        file,
        exec: (sql) => raw.exec(sql),
        all: (sql, ...params) => raw.prepare(sql).all(...clean(params)),
        get: (sql, ...params) => raw.prepare(sql).get(...clean(params)),
        run: (sql, ...params) => {
            const r = raw.prepare(sql).run(...clean(params));
            return { changes: Number(r.changes) };
        },
        tx: (fn) => {
            if (depth > 0)
                return fn();
            raw.exec('BEGIN IMMEDIATE');
            depth++;
            try {
                const r = fn();
                raw.exec('COMMIT');
                return r;
            }
            catch (e) {
                raw.exec('ROLLBACK');
                throw e;
            }
            finally {
                depth--;
            }
        },
        backupTo: (target) => {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            if (fs.existsSync(target))
                fs.rmSync(target);
            raw.prepare('VACUUM INTO ?').run(target);
        },
        close: () => raw.close(),
    };
    return db;
}
