// Vercel: مجلد مخرجات ثابتة فارغ تقريبًا — كل الصفحات والملفات يخدمها التطبيق نفسه (api/index.mjs)
// حتى لا يُنشر أي ملف من شجرة المشروع كملف ثابت.
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('vercel-static', { recursive: true });
writeFileSync('vercel-static/.keep', '');
