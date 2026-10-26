import express from 'express';
import { readContent, readLifeFile } from './life.js';
import { normalizeText } from '../shared/text.js';
const LIMIT = 6;
/** بحث موحّد خارج الفصول: المكتبة، الحياة (حركات وبنود)، الرياضة (تمارين وتماريني)، والمصطلحات. للقراءة فقط؛ لا يفتح ملفات المكتبة نفسها. */
export function searchMore(db, rawQ) {
    const q = normalizeText(rawQ);
    if (!q)
        return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const match = (...parts) => {
        const h = normalizeText(parts.filter(Boolean).join(' '));
        return tokens.every((t) => h.includes(t));
    };
    const out = [];
    const add = (kind, arr) => void out.push(...arr.slice(0, LIMIT));
    const files = db.all('SELECT id, name, folder, kind, course_hint FROM lib_files WHERE missing = 0');
    add('library', files.filter((f) => match(f.name, f.folder, f.course_hint)).map((f) => ({ kind: 'library', id: f.id, title: f.name, subtitle: f.folder || 'المكتبة', to: `/library/f/${f.id}` })));
    const yt = db.all('SELECT id, title, course_hint FROM lib_youtube');
    add('youtube', yt.filter((v) => match(v.title, v.course_hint)).map((v) => ({ kind: 'youtube', id: v.id, title: v.title, subtitle: 'YouTube', to: `/library/y/${v.id}` })));
    const fin = readLifeFile(db, 'finance').data;
    if (fin) {
        const tx = (fin.recent_transactions ?? []).filter((t) => match(t.label_ar, t.category_ar, t.wallet, t.type_ar, String(t.amount))).map((t) => ({ kind: 'life', id: t.id, title: t.label_ar ?? t.id, subtitle: `${t.date} · ${t.type_ar ?? t.type} · ${t.amount}`, to: `/life/finance?q=${encodeURIComponent(rawQ)}` }));
        const items = (fin.open_items ?? []).filter((o) => match(o.title_ar, o.detail_ar, o.id)).map((o) => ({ kind: 'life', id: o.id, title: o.title_ar ?? o.id, subtitle: 'بند مالي مفتوح', to: '/life/finance' }));
        add('life', [...items, ...tx]);
    }
    const ex = readContent(db, 'SPORTS_EXERCISES.json').data;
    if (ex)
        add('sports', ex.exercises.filter((e) => match(e.arabic_name, e.english_name, e.main_muscle_ar, e.category_ar)).map((e) => ({ kind: 'sports', id: e.id, title: `${e.arabic_name} — ${e.english_name}`, subtitle: e.main_muscle_ar, to: `/sports?q=${encodeURIComponent(e.english_name)}` })));
    const ws = db.all('SELECT id, name FROM spt_workouts');
    add('workout', ws.filter((w) => match(w.name)).map((w) => ({ kind: 'workout', id: w.id, title: w.name, subtitle: 'تمريني', to: '/sports/mine' })));
    const gl = readContent(db, 'GLOSSARY_AR.json').data;
    if (gl)
        add('glossary', gl.entries.filter((e) => match(e.term_ar, e.term_en, e.definition_ar)).map((e) => ({ kind: 'glossary', id: e.id, title: e.term_ar, subtitle: e.definition_ar, to: `/life/glossary#${e.id}` })));
    return out;
}
export function createSearchRouter(ctx) {
    const r = express.Router();
    r.get('/more', (req, res, next) => {
        try {
            const q = typeof req.query['q'] === 'string' ? req.query['q'].slice(0, 80) : '';
            res.json(searchMore(ctx.getDb(), q));
        }
        catch (e) {
            next(e);
        }
    });
    return r;
}
