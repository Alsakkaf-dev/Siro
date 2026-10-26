// ينسخ موارد pdf.js (خطوط قياسية، CMaps، wasm) إلى dist/web/pdfjs ليخدمها الخادم محليًا بلا اتصال بالإنترنت.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist');
const out = join(root, 'dist', 'web', 'pdfjs');
if (!existsSync(src)) {
  console.error('pdfjs-dist غير مثبّت. شغّل: npm install');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const d of ['standard_fonts', 'cmaps', 'wasm', 'iccs']) cpSync(join(src, d), join(out, d), { recursive: true });
console.log('pdfjs assets ->', out);
