import express from 'express';
import type { Ctx } from './routes.js';
import type { Db } from './db.js';
import { readContent, readLifeFile } from './life.js';
import { normalizeText } from '../shared/text.js';
import type { ExercisesDoc, GlossaryDoc } from '../shared/sports.js';
import type { Finance } from '../shared/life.js';
import type { MoreHit } from '../shared/types.js';

const LIMIT = 6;

/** بحث موحّد خارج الفصول: المكتبة، الحياة (حركات وبنود)، الرياضة (تمارين وتماريني)، والمصطلحات. للقراءة فقط؛ لا يفتح ملفات المكتبة نفسها. */
export function searchMore(db: Db, rawQ: string): MoreHit[] {
  const q = normalizeText(rawQ);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const match = (...parts: (string | null | undefined)[]): boolean => {
    const h = normalizeText(parts.filter(Boolean).join(' '));
    return tokens.every((t) => h.includes(t));
  };
  const out: MoreHit[] = [];
  const add = (kind: MoreHit['kind'], arr: MoreHit[]): void => void out.push(...arr.slice(0, LIMIT));

  // مساحاتي: المساحات والعناصر (كل الحقول النصية)
  const spaces = db.all<{ id: string; name: string; description: string | null }>("SELECT id, name, description FROM wos_spaces WHERE archived = 0");
  add('space', spaces.filter((x) => match(x.name, x.description)).map((x) => ({ kind: 'space', id: x.id, title: x.name, subtitle: 'مساحة', to: `/spaces/${x.id}` })));
  const items = db.all<{ id: string; title: string; data: string; space_id: string; space: string }>('SELECT i.id, i.title, i.data, i.space_id, s.name AS space FROM wos_items i JOIN wos_spaces s ON s.id = i.space_id WHERE i.archived = 0 AND s.archived = 0 ORDER BY i.updated_at DESC');
  add('item', items.filter((x) => match(x.title, x.data.replace(/"[a-z0-9_]+":/g, ' '))).map((x) => ({ kind: 'item', id: x.id, title: x.title, subtitle: x.space, to: `/spaces/${x.space_id}?item=${x.id}` })));

  const files = db.all<{ id: string; name: string; folder: string; kind: string; course_hint: string | null }>('SELECT id, name, folder, kind, course_hint FROM lib_files WHERE missing = 0');
  add('library', files.filter((f) => match(f.name, f.folder, f.course_hint)).map((f) => ({ kind: 'library', id: f.id, title: f.name, subtitle: f.folder || 'المكتبة', to: `/library/f/${f.id}` })));
  const yt = db.all<{ id: string; title: string; course_hint: string | null }>('SELECT id, title, course_hint FROM lib_youtube');
  add('youtube', yt.filter((v) => match(v.title, v.course_hint)).map((v) => ({ kind: 'youtube', id: v.id, title: v.title, subtitle: 'YouTube', to: `/library/y/${v.id}` })));

  const fin = readLifeFile(db, 'finance').data as Finance | null;
  if (fin) {
    const tx = (fin.recent_transactions ?? []).filter((t) => match(t.label_ar, t.category_ar, t.wallet, t.type_ar, String(t.amount))).map((t) => ({ kind: 'life' as const, id: t.id, title: t.label_ar ?? t.id, subtitle: `${t.date} · ${t.type_ar ?? t.type} · ${t.amount}`, to: `/life/finance?q=${encodeURIComponent(rawQ)}` }));
    const items = (fin.open_items ?? []).filter((o) => match(o.title_ar, o.detail_ar, o.id)).map((o) => ({ kind: 'life' as const, id: o.id, title: o.title_ar ?? o.id, subtitle: 'بند مالي مفتوح', to: '/life/finance' }));
    add('life', [...items, ...tx]);
  }
  const ex = readContent(db, 'SPORTS_EXERCISES.json').data as ExercisesDoc | null;
  if (ex) add('sports', ex.exercises.filter((e) => match(e.arabic_name, e.english_name, e.main_muscle_ar, e.category_ar)).map((e) => ({ kind: 'sports', id: e.id, title: `${e.arabic_name} — ${e.english_name}`, subtitle: e.main_muscle_ar, to: `/sports?q=${encodeURIComponent(e.english_name)}` })));
  const ws = db.all<{ id: string; name: string }>('SELECT id, name FROM spt_workouts');
  add('workout', ws.filter((w) => match(w.name)).map((w) => ({ kind: 'workout', id: w.id, title: w.name, subtitle: 'تمريني', to: '/sports/mine' })));
  const gl = readContent(db, 'GLOSSARY_AR.json').data as GlossaryDoc | null;
  if (gl) add('glossary', gl.entries.filter((e) => match(e.term_ar, e.term_en, e.definition_ar)).map((e) => ({ kind: 'glossary', id: e.id, title: e.term_ar, subtitle: e.definition_ar, to: `/life/glossary#${e.id}` })));
  return out;
}

export function createSearchRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  r.get('/more', (req, res, next) => {
    try {
      const q = typeof req.query['q'] === 'string' ? req.query['q'].slice(0, 80) : '';
      res.json(searchMore(ctx.getDb(), q));
    } catch (e) {
      next(e);
    }
  });
  return r;
}
