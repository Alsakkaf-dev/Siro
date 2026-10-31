import express from 'express';
import type { Ctx } from './routes.js';
import { HttpError } from './routes.js';
import { ValidationError } from './validation.js';
import { getSetting, setSetting } from './repo.js';
import * as life from './life.js';
import * as store from './lifeStore.js';
import { COMMAND_TYPES, LIFE_CONTENT, LIFE_QADA_CHOICE_RE, LIFE_DATA_FILES, validatePayload, type CommandType, type LifeFile } from '../shared/life.js';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const wrap =
  (fn: (req: express.Request, res: express.Response) => void | Promise<void>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };
const isFile = (n: string): n is LifeFile => (LIFE_DATA_FILES as readonly string[]).includes(n);

export function createLifeRouter(ctx: Ctx): express.Router {
  const r = express.Router();
  const db = () => ctx.getDb();

  r.get('/status', wrap((_req, res) => void res.json(life.lifeStatus(db()))));

  r.get('/data/:name', wrap((req, res) => {
    const name = str(req.params['name']);
    if (!isFile(name)) throw new HttpError(404, 'ملف غير معروف');
    res.json(life.readLifeFile(db(), name));
  }));

  r.get('/bundle', wrap((req, res) => {
    const wanted = str(req.query['files']).split(',').map((s) => s.trim()).filter(Boolean);
    const names = (wanted.length ? wanted : [...LIFE_DATA_FILES]).filter(isFile);
    const st = life.lifeStatus(db());
    const files: Record<string, unknown> = {};
    for (const n of names) files[n] = life.readLifeFile(db(), n).data ?? null;
    res.json({ status: st, files });
  }));

  /** محتوى الرياضة وبدائل العادات والقاموس (قائمة بيضاء). */
  r.get('/content/:name', wrap((req, res) => {
    const name = str(req.params['name']);
    if (!(LIFE_CONTENT as readonly string[]).includes(name)) throw new HttpError(404, 'محتوى غير معروف');
    res.json({ ...life.readContent(db(), name as (typeof LIFE_CONTENT)[number]), root_exists: true });
  }));

  /** اختيار سيناريو القضاء المحلي. */
  r.get('/qada-choice', wrap((_req, res) => void res.json({ scenario: getSetting(db(), 'life.qada_scenario') })));
  r.put('/qada-choice', wrap((req, res) => {
    const v = (req.body as Record<string, unknown> | undefined)?.['scenario'];
    if (v !== null && !(typeof v === 'string' && LIFE_QADA_CHOICE_RE.test(v))) throw new ValidationError({ scenario: 'معرّف سيناريو غير صالح' });
    setSetting(db(), 'life.qada_scenario', v);
    res.json({ scenario: v });
  }));

  /** سجل التسجيلات (الأحدث أولًا). */
  r.get('/events', wrap((_req, res) => void res.json({ events: store.listEvents(db()) })));

  /** تسجيل مباشر: صلاة، مصروف، وزن، عادة. يُنفَّذ فورًا ويمكن التراجع عن آخر تسجيل. */
  r.post('/log', wrap((req, res) => {
    const b = (req.body ?? {}) as { type?: unknown; payload?: unknown };
    const type = str(b.type) as CommandType;
    if (!(COMMAND_TYPES as readonly string[]).includes(type)) throw new ValidationError({ type: 'نوع تسجيل غير مسموح' });
    const payload = b.payload && typeof b.payload === 'object' && !Array.isArray(b.payload) ? (b.payload as Record<string, unknown>) : null;
    if (!payload) throw new ValidationError({ payload: 'البيانات مطلوبة' });
    const errs = validatePayload(type, payload);
    if (Object.keys(errs).length) throw new ValidationError(errs);
    const p = payload as never;
    try {
      const ev =
        type === 'log_prayer' ? store.logPrayer(db(), p)
        : type === 'log_expense' ? store.logExpense(db(), p)
        : type === 'log_weight' ? store.logWeight(db(), p)
        : type === 'log_habit' ? store.logHabit(db(), p)
        : type === 'start_habit' ? store.startHabit(db(), p)
        : store.habitRelapse(db(), p);
      res.status(201).json({ event: ev });
    } catch (e) {
      throw new HttpError(409, e instanceof Error ? e.message : 'تعذّر التسجيل');
    }
  }));

  r.post('/events/:id/undo', wrap((req, res) => {
    const out = store.undoEvent(db(), str(req.params['id']));
    if (!out.ok) throw new HttpError(409, out.error);
    res.json({ ok: true });
  }));

  return r;
}
