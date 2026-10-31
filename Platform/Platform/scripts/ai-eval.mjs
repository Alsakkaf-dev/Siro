// تقييم أي موديل على أوامر المنصة العربية الحقيقية: هل يختار الأداة الصحيحة بالوسائط الصحيحة؟
//   npm run build && npm start   (في نافذة)   ثم:   npm run ai:eval [-- --provider=ollama] [--small]
// يمر عبر /api/ai/chat نفسه (نفس المزوّد والسلسلة الاحتياطية) ولا يغيّر أي بيانات: يقيس الخطوة الأولى فقط.
import { TOOL_DEFS, routeTools, specOf } from '../dist/server/shared/aiTools.js';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4310';
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const provider = arg('provider');
const small = process.argv.includes('--small');
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(Date.parse(`${today}T12:00:00Z`) + i * 864e5); return `${AR[d.getUTCDay()]}=${d.toISOString().slice(0, 10)}`; }).join(' · ');
const dayOf = (name) => new RegExp(`${name}=(\\d{4}-\\d{2}-\\d{2})`).exec(days)?.[1];

const sems = await (await fetch(`${BASE}/api/semesters`)).json();
const sem = sems.find((s) => s.is_active) ?? sems[0];
const b = sem ? await (await fetch(`${BASE}/api/semesters/${sem.id}`)).json() : { courses: [] };
const c0 = b.courses[0];
const spaces = await (await fetch(`${BASE}/api/wos/spaces`)).json();
const sp0 = spaces[0];

const SYSTEM = `You are «المساعد», the built-in AI of the user's personal platform (Arabic). Today: ${today}. Dates: ${days}.
${sem ? `Active semester: ${sem.code} (id ${sem.id}). Courses: ${b.courses.map((c) => `${c.code} ${c.name}${c.name_ar ? ` / ${c.name_ar}` : ''} [id ${c.id}]`).join('; ')}.` : ''}
${spaces.length ? `Spaces: ${spaces.map((s) => `${s.name} [id ${s.id}]`).join('; ')}.` : ''}
Rules: Reply in Arabic. Use tools for facts and actions; never invent ids, dates or weights; omit unknown fields. Convert relative days with the Dates line. Write tools ask the user themselves — just call them.`;

/** [الطلب، الأداة المتوقعة (أو بدائل)، فحص اختياري للوسائط] */
const CASES = [
  ['ما أهم شيء عليّ اليوم؟', ['agenda']],
  ['ماذا تأخّر عليّ؟', ['agenda']],
  ['أعطني موجز هذا الأسبوع', ['agenda']],
  ['افتح صفحة الأسبوع', ['open_page'], (a) => a.path === '/week'],
  ['افتح الإعدادات', ['open_page'], (a) => a.path?.startsWith('/settings')],
  ['ابحث عن كل شيء فيه كلمة مشروع', ['search'], (a) => /مشروع/.test(a.query)],
  ...(c0 ? [
    [`أضف كويز لمادة ${c0.code} يوم الخميس بوزن 5%`, ['add_assessment'], (a) => a.kind === 'quiz' && a.weight === 5 && a.due_date === dayOf('الخميس')],
    [`أضف واجب لمادة ${c0.code} بدون وزن`, ['add_assessment'], (a) => a.kind === 'assignment' && a.weight === undefined],
    [`أضف مشروع لمادة ${c0.code} في الأسبوع 10 بوزن 20%`, ['add_assessment'], (a) => a.kind === 'project' && a.week_no === 10 && a.weight === 20],
    [`كم أحتاج في ${c0.code} لأحصل 70%؟`, ['grade_needed'], (a) => a.target_percent === 70],
    [`ما تقييمات مادة ${c0.code}؟`, ['course_details']],
    [`ما وضعي في ${c0.name}؟`, ['course_details', 'grade_needed']],
    [`استخرج التقييمات وأضفها لمادة ${c0.code}:\nQuiz 1 (5%) week 3\nMidterm test (25%) 2026-11-20\nFinal exam (40%)`, ['add_assessments_bulk'], (a) => a.items?.length === 3 && a.items.some((i) => i.kind === 'final')],
    [`سجّل ملاحظة لمادة ${c0.code}: المحاضر قال الاختبار مفتوح الكتاب`, ['add_note']],
    ['عندي سؤال غير معروف: هل اللاب يحسب من الدرجة؟ سجله', ['add_note'], (a) => a.tag === 'unk'],
  ] : []),
  ['ما المواد في هذا الفصل؟', ['semester_overview']],
  ['ما المساحات عندي؟', ['list_spaces']],
  ...(sp0 ? [
    [`أضف مهمة «تحديث السيرة الذاتية» إلى ${sp0.name} موعدها الجمعة`, ['add_item'], (a) => a.due === dayOf('الجمعة')],
    [`ما العناصر في ${sp0.name}؟`, ['space_items']],
    [`أضف أتمتة لمساحة ${sp0.name}: عندما يصبح العنصر منجزًا أرشفه`, ['add_automation'], (a) => a.action?.kind === 'archive'],
  ] : []),
  ['أنشئ مساحة لتتبع طلبات التدريب فيها حقل الشركة والراتب', ['create_space'], (a) => (a.fields ?? []).length >= 2],
  ['ما القوالب الجاهزة للمساحات؟', ['list_templates']],
  ['ابحث في المكتبة عن محاضرات قواعد البيانات', ['library_search']],
  ['أضف هذا الفيديو للمكتبة https://www.youtube.com/watch?v=dQw4w9WgXcQ', ['add_youtube']],
  ['صليت الفجر اليوم في وقتها', ['life_log'], (a) => a.type === 'log_prayer' && a.payload?.prayer === 'fajr' && a.payload?.status === 'in_time'],
  ['صرفت 12 رنجت على الغداء اليوم', ['life_log'], (a) => a.type === 'log_expense' && a.payload?.amount === 12],
  ['ما تمريني اليوم؟', ['sports_week']],
  ['خلِّ يوم الجمعة راحة', ['sports_set_day'], (a) => a.day === 'fri' && !a.workout],
  ['ما آخر التغييرات في الموقع؟', ['recent_activity']],
  ['خذ نسخة احتياطية الآن', ['backup_now']],
];

const rows = [];
let pass = 0;
let toolOk = 0;
let ms = 0;
for (const [text, expect, check] of CASES.slice(0, 30)) {
  const tools = routeTools(text, '/', small ? 9 : null).map(specOf);
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/ai/chat`, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.AI_ACCESS_KEY ? { 'x-ai-key': process.env.AI_ACCESS_KEY } : {}) }, body: JSON.stringify({ messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: text }], tools, ...(provider ? { provider } : {}), max_tokens: 600 }) });
  const evs = (await res.text()).split('\n\n').filter((x) => x.startsWith('data:')).map((x) => JSON.parse(x.slice(5)));
  const dt = Date.now() - t0;
  ms += dt;
  const call = evs.find((e) => e.type === 'tool_call')?.call;
  const err = evs.find((e) => e.type === 'error')?.error;
  let args = {};
  try { args = call ? JSON.parse(call.arguments) : {}; } catch { /* */ }
  const nameOk = !!call && expect.includes(call.name);
  const argsOk = nameOk && (!check || !!check(args));
  if (nameOk) toolOk++;
  if (argsOk) pass++;
  rows.push({ text: text.split('\n')[0].slice(0, 50), expect: expect.join('|'), got: call?.name ?? (err ? `ERR ${err.slice(0, 40)}` : 'text'), args: argsOk ? '✓' : nameOk ? '✗ args' : '', ms: dt });
  process.stdout.write(argsOk ? '✓' : nameOk ? '~' : '✗');
}
const model = (await (await fetch(`${BASE}/api/ai/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'ok' }], max_tokens: 4, ...(provider ? { provider } : {}) }) })).text()).match(/"model":"([^"]+)"/)?.[1];
console.log(`\n\nالموديل: ${model ?? '?'}${small ? ' (أدوات موجّهة)' : ''}`);
console.table(rows);
console.log(`الأداة الصحيحة: ${toolOk}/${rows.length} · الأداة + الوسائط: ${pass}/${rows.length} · متوسط الزمن: ${(ms / rows.length / 1000).toFixed(1)} ث`);
console.log(`(${TOOL_DEFS.length} أداة في السجل)`);
