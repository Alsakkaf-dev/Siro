import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PORT } from '../shared/constants.js';
function findRoot() {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i++) {
        const pj = path.join(dir, 'package.json');
        if (fs.existsSync(pj)) {
            try {
                const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
                if (j.name === 'platform')
                    return dir;
            }
            catch {
                /* تجاهل */
            }
        }
        dir = path.dirname(dir);
    }
    throw new Error('تعذّر تحديد مجلد المشروع (Platform)');
}
export function loadConfig(overrides = {}) {
    const root = findRoot();
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const envPort = Number(process.env['PLATFORM_PORT']);
    const port = overrides.port ?? (Number.isInteger(envPort) && envPort > 0 && envPort < 65536 ? envPort : DEFAULT_PORT);
    const dataDir = overrides.dataDir ?? (process.env['PLATFORM_DATA_DIR'] ? path.resolve(process.env['PLATFORM_DATA_DIR']) : path.join(root, 'data'));
    const backupsDir = overrides.backupsDir ?? (process.env['PLATFORM_BACKUPS_DIR'] ? path.resolve(process.env['PLATFORM_BACKUPS_DIR']) : path.join(root, 'backups'));
    return {
        root,
        port,
        host: '127.0.0.1',
        dataDir,
        backupsDir,
        webDir: path.join(root, 'dist', 'web'),
        seedFile: path.join(root, 'seed', 'sem5-dashboard.json'),
        version: pkg.version,
    };
}
