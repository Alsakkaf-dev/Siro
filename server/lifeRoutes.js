import express from 'express';
import fs from 'node:fs';
import { HttpError } from './routes.js';
import { ValidationError } from './validation.js';
import { getSetting, setSetting } from './repo.js';
import * as life from './life.js';
import { COMMAND_TYPES, LIFE_CONTENT, LIFE_QADA_CHOICE_RE, LIFE_DATA_FILES, LIFE_DOCS, validatePayload } from '../shared/life.js';
const str = (v) => (typeof v === 'string' ? v : '');
const wrap = (fn) => (req, res, next) => {
    Promise.resolve()
        .then(() => fn(req, res))
        .catch(next);
};
const isFile = (n) => LIFE_DATA_FILES.includes(n);
export function createLifeRouter(ctx) {
    const r = express.Router();
    const db = () => ctx.getDb();
    r.get('/status', wrap((_req, res) => void res.json(life.lifeStatus(db()))));
    r.put('/settings', wrap((req, res) => {
        const root = str(req.body?.root).trim();
        if (!root)
            throw new ValidationError({ root: 'اكتب مسار المجلد' });
        if (!/^([A-Za-z]:[\\/]|\\\\|\/)/.test(root))
            throw new ValidationError({ root: 'يجب أن يكون المسار كاملًا، مثل C:\\Users\\...' });
        try {
            if (!fs.statSync(root).isDirectory())
                throw new Error();
        }
        catch {
            throw new ValidationError({ root: 'المجلد غير موجود على هذا الجهاز' });
        }
        setSetting(db(), 'life.root', root);
        res.json(life.lifeStatus(db()));
    }));
    r.get('/data/:name', wrap((req, res) => {
        const name = str(req.params['name']);
        if (!isFile(name))
            throw new HttpError(404, 'ملف غير معروف');
        res.json(life.readLifeFile(db(), name));
    }));
    r.get('/bundle', wrap((req, res) => {
        const wanted = str(req.query['files']).split(',').map((s) => s.trim()).filter(Boolean);
        const names = (wanted.length ? wanted : [...LIFE_DATA_FILES]).filter(isFile);
        const st = life.lifeStatus(db());
        const files = {};
        for (const n of names)
            files[n] = life.readLifeFile(db(), n).data ?? null;
        res.json({ status: st, files });
    }));
    r.get('/docs/:name', wrap((req, res) => {
        const name = str(req.params['name']);
        if (!LIFE_DOCS.includes(name))
            throw new HttpError(404, 'وثيقة غير معروفة');
        const text = life.readDoc(db(), name);
        if (text === null)
            throw new HttpError(404, 'الوثيقة غير موجودة عند راشد');
        res.json({ name, text });
    }));
    /** محتوى الرياضة وبدائل العادات (JSON داخل docs) بقائمة بيضاء. */
    r.get('/content/:name', wrap((req, res) => {
        const name = str(req.params['name']);
        if (!LIFE_CONTENT.includes(name))
            throw new HttpError(404, 'محتوى غير معروف');
        const st = life.lifeStatus(db());
        if (!st.root_exists) {
            res.json({ name, data: null, status: { state: 'unavailable', generated_at: null, age_hours: null, stale_after_hours: null, error: 'مجلد راشد غير موجود' }, root_exists: false });
            return;
        }
        res.json({ ...life.readContent(db(), name), root_exists: true });
    }));
    /** اختيار محمد المحلي لسيناريو القضاء (في قاعدة الموقع فقط؛ لا يكتب في ملفات راشد، وselected_scenario عنده يبقى كما هو حتى يسجّله راشد). */
    r.get('/qada-choice', wrap((_req, res) => void res.json({ scenario: getSetting(db(), 'life.qada_scenario') })));
    r.put('/qada-choice', wrap((req, res) => {
        const v = req.body?.['scenario'];
        if (v !== null && !(typeof v === 'string' && LIFE_QADA_CHOICE_RE.test(v)))
            throw new ValidationError({ scenario: 'معرّف سيناريو غير صالح' });
        setSetting(db(), 'life.qada_scenario', v);
        res.json({ scenario: v });
    }));
    r.get('/commands', wrap((_req, res) => void res.json(life.listCommands(db()))));
    /** مسودة أمر: ملف جديد pending في commands. لا تنفيذ بدون موافقة محمد الصريحة في المحادثة مع راشد. */
    r.post('/commands', wrap((req, res) => {
        const b = (req.body ?? {});
        if (b.confirm !== true)
            throw new ValidationError({ confirm: 'أكّد أنك تفهم أن الأمر لن يُنفَّذ إلا بموافقتك الصريحة في المحادثة' });
        const type = str(b.type);
        if (!COMMAND_TYPES.includes(type))
            throw new ValidationError({ type: 'نوع أمر غير مسموح' });
        const payload = b.payload && typeof b.payload === 'object' && !Array.isArray(b.payload) ? b.payload : null;
        if (!payload)
            throw new ValidationError({ payload: 'payload مطلوب' });
        const errs = validatePayload(type, payload);
        if (Object.keys(errs).length)
            throw new ValidationError(errs);
        try {
            res.status(201).json(life.createCommandFile(db(), type, payload));
        }
        catch (e) {
            throw new HttpError(409, e instanceof Error ? e.message : 'تعذّر إنشاء ملف الأمر');
        }
    }));
    return r;
}
