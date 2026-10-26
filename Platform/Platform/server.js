// نقطة التشغيل: node server
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const entry = fileURLToPath(new URL('./dist/server/server/main.js', import.meta.url));
if (!fs.existsSync(entry)) {
  console.error('الخادم غير مبني بعد. شغّل: npm run build');
  process.exit(1);
}
await import(pathToFileURL(entry).href);
