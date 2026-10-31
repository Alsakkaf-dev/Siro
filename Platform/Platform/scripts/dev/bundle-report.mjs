// تقرير الحزم (PERF-01/02): يسرد مقاطع dist/web/assets/*.js بالحجم الخام وgzip ويقارن بتقرير سابق.
// الاستخدام: node scripts/dev/bundle-report.mjs [--json out.json] [--compare before.json]
// «لا يدفع أحد ثمن المطبخ»: كل مقطع خارج المطبخ يجب ألا يزيد بايتًا (المقارنة تفشل عند زيادة خارج المسموح: index +3KB لسطور السجل).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const dir = join(root, 'dist', 'web', 'assets');
const out = {};
for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const name = f.replace(/-[A-Za-z0-9_-]{8}\.js$/, '');
  const buf = readFileSync(join(dir, f));
  out[name] = { raw: buf.length, gzip: gzipSync(buf).length };
}
const KITCHEN = /^(Kitchen|kitchen|Scene3D|GLTFLoader|meshopt|three\.core|sim\.worker|kitApply|Stage3D|simClient)/;
// مقاطع يعيد Rollup توزيع المشترك بينها عند إضافة صفحات (مجموعها هو المقياس)
const SHUFFLE = new Set(['index', 'jsx-runtime', 'icons']);
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(out, null, 1));
const before = arg('--compare') ? JSON.parse(readFileSync(arg('--compare'), 'utf8')) : null;
let bad = 0;
const rows = Object.keys({ ...out, ...(before ?? {}) }).sort();
console.log('المقطع'.padEnd(26), 'gzip الآن'.padStart(10), 'قبل'.padStart(10), 'فرق'.padStart(8), ' ', 'خام الآن'.padStart(9));
for (const n of rows) {
  const a = out[n]; const b = before?.[n];
  const d = (a?.gzip ?? 0) - (b?.gzip ?? 0);
  const kit = KITCHEN.test(n);
  const flag = before && !kit && !SHUFFLE.has(n) && d > 64 ? ' ✗' : '';
  if (flag) bad++;
  if (before && d === 0 && !kit) continue;
  console.log(n.padEnd(26), String(a?.gzip ?? '—').padStart(10), String(b?.gzip ?? '—').padStart(10), String(d).padStart(8), kit ? ' (مطبخ)' : '       ', String(a?.raw ?? '—').padStart(9), flag);
}
const non = Object.entries(out).filter(([n]) => !KITCHEN.test(n)).reduce((s, [, v]) => s + v.gzip, 0);
const nonB = before ? Object.entries(before).filter(([n]) => !KITCHEN.test(n)).reduce((s, [, v]) => s + v.gzip, 0) : null;
console.log(`\nمجموع غير المطبخ (gzip): ${non}${nonB !== null ? ` (قبل ${nonB}، فرق ${non - nonB})` : ''}`);
const delta = nonB === null ? 0 : non - nonB;
console.log(delta > 3072 ? '✗ زيادة غير المطبخ فوق 3KB' : 'غير المطبخ: لا زيادة تُذكر (ضجيج أسماء المقاطع ≤ 64 بايت لكل مقطع + صفوف السجل في index)');
process.exit(bad || delta > 3072 ? 1 : 0);
