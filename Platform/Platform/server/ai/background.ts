/** الذكاء في الخلفية (نسخة الجهاز فقط): «موجز اليوم» في الوارد مرة يوميًا.
 *  قراءة فقط — لا يكتب في بياناتك شيئًا سوى رسالة الوارد، ولا يستخدم مزوّدًا مدفوعًا أبدًا. */
import type { Db } from '../db.js';
import { getSetting, setSetting } from '../repo.js';
import { agenda } from '../wos/agenda.js';
import { localToday } from '../wos/automations.js';
import { notify, workspaceOf } from '../wos/core.js';
import { stripThinking } from '../../shared/ai.js';
import type { Secrets } from './secrets.js';
import { complete, loadConfig } from './service.js';

const LAST = 'ai.brief.last';

export function briefPrompt(today: string, a: ReturnType<typeof agenda>): string {
  const row = (e: { title: string; subtitle: string; date: string | null; done: boolean; weight?: number }): string => `- ${e.date ?? 'بلا تاريخ'} · ${e.title}${e.subtitle ? ` (${e.subtitle})` : ''}${e.weight ? ` · وزن ${e.weight}%` : ''}${e.done ? ' · منجز' : ''}`;
  const open = a.range.filter((e) => !e.done);
  return [
    `Today is ${today}. Write a short daily brief in Arabic (max 6 bullet lines, no greeting, no markdown headings).`,
    'Prioritize: overdue first, then today, then the next 7 days by weight. Use only the data below — never invent items or dates.',
    '',
    `متأخر (${a.overdue.length}):`,
    ...a.overdue.slice(0, 15).map(row),
    `الأيام السبعة القادمة (${open.length}):`,
    ...open.slice(0, 25).map(row),
    `بلا تاريخ: ${a.undated}`,
  ].join('\n');
}

/** يولّد الموجز إن لم يُولَّد اليوم. يعيد true إن أُرسل. */
export async function maybeBrief(db: Db, secrets: Secrets, now = new Date()): Promise<boolean> {
  const cfg = loadConfig(db, secrets);
  if (!cfg.background) return false;
  const today = localToday(now);
  if (getSetting(db, LAST) === today || now.getHours() < 5) return false;
  const ws = workspaceOf();
  const to = localToday(new Date(now.getTime() + 7 * 86_400_000));
  const a = agenda(db, ws, today, to, today);
  if (!a.overdue.length && !a.range.some((e) => !e.done)) {
    setSetting(db, LAST, today);
    return false;
  }
  const ac = new AbortController();
  const out = await complete(db, secrets, { messages: [{ role: 'user', content: briefPrompt(today, a) }], max_tokens: 500, signal: ac.signal, allowPaid: false });
  const text = stripThinking(out.text).trim();
  if (out.error || !text) return false; // لا مزوّد جاهز الآن — نحاول لاحقًا
  notify(db, ws, { title: `موجز اليوم · ${today}`, body: text, source: 'ai' });
  setSetting(db, LAST, today);
  return true;
}

/** حلقة خفيفة: محاولة كل 30 دقيقة (أول مرة بعد دقيقة من التشغيل) */
export function startBackground(getDb: () => Db, secrets: Secrets): () => void {
  let stop = false;
  let t: NodeJS.Timeout;
  const tick = (): void => {
    if (stop) return;
    void maybeBrief(getDb(), secrets)
      .catch(() => false)
      .finally(() => {
        if (!stop) {
          t = setTimeout(tick, 30 * 60_000);
          t.unref();
        }
      });
  };
  t = setTimeout(tick, 60_000);
  t.unref();
  return () => {
    stop = true;
    clearTimeout(t);
  };
}
