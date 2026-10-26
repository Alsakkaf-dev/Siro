import fs from 'node:fs';
import path from 'node:path';
import { getSetting } from './repo.js';
import { COMMAND_ID_RE, DEFAULT_LIFE_ROOT, LIFE_CONTENT_AT_ROOT, LIFE_DATA_FILES, LIFE_FILE_LABEL, PROTOCOL_STALE_HOURS, checkShape, classifyFreshness, commandId, worstOf, } from '../shared/life.js';
import { checkContent } from '../shared/sports.js';
import { checkInsights, checkLedger, checkQadaPlan, checkFieldLabels, checkRoutineBlocks } from '../shared/v8.js';
/**
 * منصة الحياة: قراءة فقط من صادرات راشد.
 * الكتابة الوحيدة في هذا الملف: إنشاء ملف أمر جديد داخل <root>/commands (flag 'wx' = لا استبدال أبدًا) حين يطلب محمد ذلك صراحةً من الواجهة.
 * لا حذف ولا تعديل لأي ملف موجود.
 */
export const MAX_JSON_BYTES = 5 * 1024 * 1024;
export function getLifeRoot(db) {
    return getSetting(db, 'life.root') || process.env['PLATFORM_LIFE_ROOT'] || DEFAULT_LIFE_ROOT;
}
const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
function readText(file, max = MAX_JSON_BYTES) {
    try {
        const st = fs.statSync(file);
        if (!st.isFile())
            return { ok: false, error: 'ليس ملفًا' };
        if (st.size > max)
            return { ok: false, error: `الملف أكبر من الحد المسموح (${Math.round(max / 1024)} KB)` };
        const buf = fs.readFileSync(file);
        return { ok: true, text: stripBom(buf.toString('utf8')), bytes: buf.length, mtime: st.mtime.toISOString() };
    }
    catch (e) {
        const code = e.code;
        return { ok: false, error: code === 'ENOENT' ? 'الملف غير موجود' : `تعذّرت القراءة (${code ?? 'خطأ'})` };
    }
}
export function readMeta(root) {
    const r = readText(path.join(root, 'exports_meta.json'), 1024 * 1024);
    if (!r.ok)
        return { meta: null, error: r.error === 'الملف غير موجود' ? 'exports_meta.json غير موجود' : r.error };
    try {
        const j = JSON.parse(r.text);
        if (!j || typeof j !== 'object' || Array.isArray(j))
            return { meta: null, error: 'exports_meta.json ليس كائنًا' };
        return { meta: j, error: null };
    }
    catch {
        return { meta: null, error: 'exports_meta.json لا يمكن قراءته (JSON غير صالح)' };
    }
}
export function lifeStatus(db, nowMs = Date.now()) {
    const root = getLifeRoot(db);
    let rootExists = false;
    try {
        rootExists = fs.statSync(root).isDirectory();
    }
    catch {
        rootExists = false;
    }
    const { meta, error } = rootExists ? readMeta(root) : { meta: null, error: 'مجلد راشد غير موجود' };
    const files = LIFE_DATA_FILES.map((name) => {
        const m = meta?.files?.find((f) => f.name === `${name}.json`);
        const raw = rootExists ? readText(path.join(root, `${name}.json`)) : { ok: false, error: 'المجلد غير موجود' };
        let fileError = raw.ok ? null : raw.error;
        if (raw.ok) {
            try {
                const parsed = JSON.parse(raw.text);
                const bad = checkShape(name, parsed);
                if (bad)
                    fileError = `تغيّر تنسيق الملف: ${bad}`;
            }
            catch {
                fileError = 'JSON غير صالح';
            }
        }
        const metaHours = typeof m?.stale_after_hours === 'number' ? m.stale_after_hours : null;
        const hours = metaHours ?? PROTOCOL_STALE_HOURS[name];
        const c = classifyFreshness({
            nowMs,
            generatedAt: m?.generated_at ?? null,
            staleAfterHours: hours,
            bytesMeta: typeof m?.bytes === 'number' ? m.bytes : null,
            bytesActual: raw.ok ? raw.bytes : null,
            fileError: fileError !== null,
        });
        return {
            name,
            label: LIFE_FILE_LABEL[name],
            state: c.state,
            generated_at: m?.generated_at ?? null,
            age_hours: c.ageHours,
            stale_after_hours: hours,
            threshold_source: metaHours !== null ? 'meta' : 'protocol-default',
            bytes_meta: typeof m?.bytes === 'number' ? m.bytes : null,
            bytes_actual: raw.ok ? raw.bytes : null,
            mtime: raw.ok ? raw.mtime : null,
            error: fileError ?? (m ? null : meta ? 'الملف غير مذكور في exports_meta.json' : null),
        };
    });
    let commandsDir = false;
    try {
        commandsDir = rootExists && fs.statSync(path.join(root, 'commands')).isDirectory();
    }
    catch {
        commandsDir = false;
    }
    return {
        root,
        default_root: DEFAULT_LIFE_ROOT,
        root_exists: rootExists,
        meta: meta
            ? { version: typeof meta.version === 'number' ? meta.version : null, generated_at: meta.generated_at ?? null, writer: meta.writer ?? null, read_only: typeof meta.read_only === 'boolean' ? meta.read_only : null, timezone: meta.timezone ?? null }
            : null,
        meta_error: error,
        files,
        worst: worstOf(files.map((f) => f.state)),
        now: new Date(nowMs).toISOString(),
        commands_dir: commandsDir,
    };
}
export function readLifeFile(db, name, nowMs = Date.now()) {
    const status = lifeStatus(db, nowMs).files.find((f) => f.name === name);
    const root = getLifeRoot(db);
    const raw = readText(path.join(root, `${name}.json`));
    let data = null;
    if (raw.ok && !status.error?.startsWith('تغيّر تنسيق') && status.error !== 'JSON غير صالح') {
        try {
            data = JSON.parse(raw.text);
        }
        catch {
            data = null;
        }
    }
    return { name, data: data, status };
}
export function readDoc(db, name) {
    const r = readText(path.join(getLifeRoot(db), 'docs', name), 1024 * 1024);
    return r.ok ? r.text : null;
}
/** ملف محتوى JSON داخل docs (تمارين / قوالب / بدائل). القِدم من exports_meta كما للبيانات. */
export function readContent(db, name, nowMs = Date.now()) {
    const root = getLifeRoot(db);
    const { meta } = readMeta(root);
    const atRoot = LIFE_CONTENT_AT_ROOT.includes(name);
    const m = meta?.files?.find((f) => f.name === (atRoot ? name : `docs/${name}`));
    const raw = readText(atRoot ? path.join(root, name) : path.join(root, 'docs', name));
    let data = null;
    let error = raw.ok ? null : raw.error;
    if (raw.ok) {
        try {
            data = JSON.parse(raw.text);
            const bad = checkContent(name, data) ?? (name === 'ledger_full.json' ? checkLedger(data) : name === 'ROUTINE_BLOCKS_AR.json' ? checkRoutineBlocks(data) : name === 'FINANCE_INSIGHTS_AR.json' ? checkInsights(data) : name === 'PRAYER_QADA_PLAN_AR.json' ? checkQadaPlan(data) : name === 'FIELD_LABELS_AR.json' ? checkFieldLabels(data) : null);
            if (bad) {
                error = `تغيّر تنسيق الملف: ${bad}`;
                data = null;
            }
        }
        catch {
            error = 'JSON غير صالح';
        }
    }
    const hours = typeof m?.stale_after_hours === 'number' ? m.stale_after_hours : 720;
    const c = classifyFreshness({ nowMs, generatedAt: m?.generated_at ?? null, staleAfterHours: hours, bytesMeta: typeof m?.bytes === 'number' ? m.bytes : null, bytesActual: raw.ok ? raw.bytes : null, fileError: error !== null });
    return { name, data, status: { state: c.state, generated_at: m?.generated_at ?? null, age_hours: c.ageHours, stale_after_hours: hours, error } };
}
/* ───── الأوامر ───── */
export function listCommands(db) {
    const dir = path.join(getLifeRoot(db), 'commands');
    let names = [];
    try {
        names = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.json')).map((d) => d.name);
    }
    catch {
        return { commands: [], dir_exists: false };
    }
    const out = [];
    for (const n of names.slice(0, 500)) {
        const r = readText(path.join(dir, n), 256 * 1024);
        if (!r.ok)
            continue;
        try {
            const j = JSON.parse(r.text);
            if (j && typeof j === 'object' && typeof j.id === 'string')
                out.push({ ...j, file: n });
        }
        catch {
            out.push({ id: n, created_at: '', type: 'refresh_exports', payload: {}, status: 'invalid', file: n, error: 'JSON غير صالح' });
        }
    }
    out.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { commands: out, dir_exists: true };
}
/** ينشئ ملف أمر جديد بحالة pending. لا ينفّذ شيئًا ولا يستبدل ملفًا موجودًا. */
export function createCommandFile(db, type, payload, now = new Date()) {
    const dir = path.join(getLifeRoot(db), 'commands');
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
        throw new Error('مجلد commands غير موجود عند راشد؛ لن أنشئه بنفسي');
    for (let seq = 1; seq <= 99; seq++) {
        const id = commandId(now, seq);
        if (!COMMAND_ID_RE.test(id))
            throw new Error('رقم أمر غير صالح');
        const file = path.join(dir, `${id}.json`);
        const command = { id, created_at: new Date(now.getTime() + 8 * 3_600_000).toISOString().slice(0, 19) + '+08:00', type, payload, status: 'pending', created_by: 'site' };
        let fd;
        try {
            fd = fs.openSync(file, 'wx');
        }
        catch (e) {
            if (e.code === 'EEXIST')
                continue;
            throw e;
        }
        try {
            fs.writeFileSync(fd, JSON.stringify(command, null, 2) + '\n', 'utf8');
        }
        finally {
            fs.closeSync(fd);
        }
        return { command, file: `${id}.json` };
    }
    throw new Error('تعذّر توليد رقم أمر فريد');
}
