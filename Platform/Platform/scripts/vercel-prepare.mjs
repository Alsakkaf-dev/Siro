// Vercel: عند بناء المشروع من main يكون جذر المشروع Platform/Platform، وبيانات راشد الثابتة في ../exchange/rashed.
// ندخلها إلى ./exchange/rashed لتُضمَّن مع الدالة (includeFiles في vercel.json). بلا أثر في بنية فرع النشر القديمة.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = '../exchange/rashed';
const dst = 'exchange/rashed';
if (existsSync(src) && !existsSync(dst)) {
  mkdirSync('exchange', { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log('vercel-prepare: copied', src, '->', dst);
} else console.log('vercel-prepare: nothing to copy');
