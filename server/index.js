import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.js';
import { openDb } from './db.js';
import { migrate } from './schema.js';
import { seedIfNeeded } from './seed.js';
import { EventBus } from './events.js';
import { ensureDailyBackup } from './backup.js';
import * as lib from './library.js';
import { createApp } from './app.js';
export function startServer(overrides = {}) {
    const cfg = loadConfig(overrides);
    fs.mkdirSync(cfg.dataDir, { recursive: true });
    const dbFile = path.join(cfg.dataDir, 'platform.db');
    let db = openDb(dbFile);
    migrate(db);
    const seeded = seedIfNeeded(db, cfg.seedFile);
    if (seeded)
        console.log('[seed] تم زرع الفصل 5 (Semester I 2026/27) لأول مرة.');
    try {
        const b = ensureDailyBackup(db, cfg.backupsDir);
        if (b)
            console.log('[backup] نسخة يومية:', b.name);
    }
    catch (e) {
        console.warn('[backup] تعذّر النسخ الاحتياطي اليومي', e);
    }
    const bus = new EventBus(() => db);
    const restoreDb = (file) => {
        db.close();
        for (const ext of ['-wal', '-shm'])
            fs.rmSync(dbFile + ext, { force: true });
        fs.copyFileSync(file, dbFile);
        db = openDb(dbFile);
        migrate(db);
    };
    const app = createApp({ cfg, getDb: () => db, restoreDb, bus });
    return new Promise((resolve, reject) => {
        const server = app.listen(cfg.port, cfg.host, () => {
            const addr = server.address();
            const port = typeof addr === 'object' && addr ? addr.port : cfg.port;
            cfg.port = port;
            // فحص أولي للمكتبة في الخلفية ثم فحص دوري (إن كان المجلد موجودًا). لا يمس ملفات المستخدم: قراءة فقط.
            let timer = null;
            if (process.env['PLATFORM_NO_AUTOSCAN'] !== '1') {
                const tick = () => {
                    try {
                        if (lib.libraryStatus(db).root_is_dir)
                            void lib.startScan(() => db).catch(() => undefined);
                    }
                    catch {
                        /* تجاهل */
                    }
                };
                setTimeout(tick, 1500).unref();
                const loop = () => {
                    const min = lib.getAutoMinutes(db);
                    timer = setTimeout(() => {
                        if (min > 0)
                            tick();
                        loop();
                    }, Math.max(1, min || 5) * 60_000);
                    timer.unref();
                };
                loop();
            }
            resolve({
                cfg,
                server,
                getDb: () => db,
                close: () => new Promise((res) => {
                    if (timer)
                        clearTimeout(timer);
                    server.close(() => {
                        db.close();
                        res();
                    });
                    server.closeAllConnections();
                }),
            });
        });
        server.once('error', (e) => {
            db.close();
            reject(e);
        });
    });
}
