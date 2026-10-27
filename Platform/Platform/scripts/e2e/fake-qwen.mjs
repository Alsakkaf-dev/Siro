// «Qwen وهمي» يحاكي Ollama (المنفذ 11434) لاختبار نواة الذكاء من المتصفح بلا موديل حقيقي.
//   node scripts/e2e/fake-qwen.mjs [port]
// يقرأ آخر رسالة ويرد باستدعاء أداة مناسب أو بنص — بنفس صيغة Ollama الأصلية (NDJSON).
import http from 'node:http';

const PORT = Number(process.argv[2] ?? 11434);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decide(messages) {
  const sys = messages.find((m) => m.role === 'system')?.content ?? '';
  const last = messages[messages.length - 1];
  if (last.role === 'tool') {
    const r = JSON.parse(last.content);
    if (!r.ok) return { text: `لم يتم: ${String(r.error).slice(0, 120)}` };
    if (last.tool_name === 'agenda') return { text: `- متأخر: ${r.result.overdue.length}\n- قادم هذا الأسبوع: ${r.result.upcoming.length}` };
    return { text: 'تم ✔' };
  }
  const u = last.content;
  const thu = /الخميس=(\d{4}-\d{2}-\d{2})/.exec(sys)?.[1];
  const course = /Courses: ([A-Z]{2,}[0-9]{3,})/.exec(sys)?.[1];
  if (/افتح الأسبوع/.test(u)) return { tool: ['open_page', { path: '/week' }] };
  if (/أضف كويز/.test(u)) return { tool: ['add_assessment', { course, kind: 'quiz', title: 'كويز المساعد', weight: 5, due_date: thu }] };
  if (/احذف/.test(u)) return { tool: ['delete_items', { ids: ['does-not-exist'] }] };
  if (/أنشئ مساحة/.test(u)) return { tool: ['create_space', { name: 'تتبع التدريب', fields: [{ name: 'الشركة', kind: 'text' }, { name: 'الراتب', kind: 'currency' }], statuses: [{ name: 'مقدَّم', category: 'todo' }, { name: 'مقابلة', category: 'active' }, { name: 'مقبول', category: 'done' }] }] };
  if (/موجز/.test(u)) return { tool: ['agenda', { days: 7 }] };
  return { text: 'أهلًا! اطلب ما تريد.' };
}

http
  .createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      // CORS كما يفعل Ollama (للمزوّد «من المتصفح»)
      res.setHeader('access-control-allow-origin', req.headers.origin ?? '*');
      res.setHeader('access-control-allow-headers', 'content-type');
      if (req.method === 'OPTIONS') return void res.writeHead(204).end();
      if (req.url === '/api/tags') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return void res.end(JSON.stringify({ models: [{ name: 'qwen3.5:4b', size: 3.3e9 }] }));
      }
      if (req.url !== '/api/chat') return void res.writeHead(404).end();
      const body = JSON.parse(raw);
      const d = decide(body.messages);
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      if (d.tool) {
        await sleep(120);
        res.write(JSON.stringify({ message: { content: '', tool_calls: [{ function: { name: d.tool[0], arguments: d.tool[1] } }] }, done: false }) + '\n');
      } else {
        for (const w of d.text.split(/(\s+)/)) {
          res.write(JSON.stringify({ message: { content: w }, done: false }) + '\n');
          await sleep(15);
        }
      }
      res.end(JSON.stringify({ message: { content: '' }, done: true, prompt_eval_count: 100, eval_count: 10 }) + '\n');
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`fake qwen on :${PORT}`));
