/** التعليمات العامة للموديل: من هو، أين المستخدم الآن، التاريخ، والقواعد. تُولَّد من سجل المترو — لا تكرار يدوي. */
import { PLUGINS } from '../core/plugins.config.js';
import { api } from '../lib/api.js';
import { wos } from '../lib/wos.js';
import { WEEKDAY_AR, type Weekday } from '../../../shared/sports.js';

const WD: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function localToday(d = new Date()): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** «الخميس = 2026-10-29» للأيام الثمانية القادمة — الموديلات الصغيرة تخطئ في حساب التواريخ */
export function dayTable(today: string): string {
  const base = Date.parse(`${today}T12:00:00Z`);
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(base + i * 86_400_000);
    return `${i === 0 ? 'اليوم' : i === 1 ? 'غدًا' : ''} ${WEEKDAY_AR[WD[d.getUTCDay()]!]}=${d.toISOString().slice(0, 10)}`.trim();
  }).join(' · ');
}

export interface PromptInput { name: string | null; path: string; crumbs: string[]; activeSemesterId: string | null; context: string | null }

let cache: { at: number; key: string; v: string } | null = null;

/** ملخّص صغير للبيانات (المواد والمساحات) — يقلل خطوات البحث للموديلات الصغيرة */
async function dataDigest(semId: string | null): Promise<string> {
  const key = semId ?? '-';
  if (cache && cache.key === key && Date.now() - cache.at < 60_000) return cache.v;
  const parts: string[] = [];
  try {
    if (semId) {
      const b = await api.bundle(semId);
      parts.push(`Active semester: ${b.semester.code} — ${b.semester.name} (id ${b.semester.id}).`);
      if (b.courses.length) parts.push(`Courses: ${b.courses.slice(0, 14).map((c) => `${c.code} ${c.name}${c.name_ar ? ` / ${c.name_ar}` : ''} [id ${c.id}]`).join('; ')}.`);
    }
    const sp = await wos.spaces();
    if (sp.length) parts.push(`Spaces: ${sp.slice(0, 14).map((s) => `${s.name} [id ${s.id}]`).join('; ')}.`);
  } catch {
    /* نكمل بدونها */
  }
  const v = parts.join('\n');
  cache = { at: Date.now(), key, v };
  return v;
}

export function invalidatePromptCache(): void {
  cache = null;
}

export async function buildSystemPrompt(p: PromptInput): Promise<string> {
  const today = localToday();
  const lines = PLUGINS.map((x) => `- ${x.name.ar} (${x.basePath}): ${x.tagline}`).join('\n');
  const digest = await dataDigest(p.activeSemesterId);
  return `You are «المساعد», the built-in AI of the user's personal platform «المنصة الشخصية» (Arabic, RTL).
User: ${p.name ?? 'المستخدم'}. Today: ${today}. Dates: ${dayTable(today)}.
Current page: ${p.path}${p.crumbs.length ? ` (${p.crumbs.join(' › ')})` : ''}.${p.context ? `\nContext: ${p.context}` : ''}
${digest}

Platform areas:
${lines}

Rules:
1. Reply in Arabic, short and direct (1–4 lines unless asked for more). No greetings, no filler.
2. Use tools for facts. Never invent ids, dates, weights, grades or file contents.
3. Unknown info stays unknown: omit missing fields (the platform marks them «غير معروف»). Never guess. Ask one short question only if the action is impossible without it.
4. Need an id? Use the ids listed above or call search / course_details / space_items first.
5. Convert relative days (اليوم، غدًا، الخميس…) to YYYY-MM-DD using the Dates line.
6. Write/destructive tools show the user a preview and ask for approval themselves — just call the tool; do not ask "هل أنفذ؟" in text.
7. After acting, state in one line what changed. If a tool fails, fix the arguments once or explain the problem.
8. For summaries and questions about a library file, call library_read first and answer only from its text.`;
}
