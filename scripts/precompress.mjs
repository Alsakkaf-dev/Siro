// يضغط ملفات الواجهة مسبقًا (brotli + gzip) ليخدمها الخادم مباشرة بسرعة.
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web');
const EXT = /\.(js|mjs|css|html|svg|json|map|txt|woff2?)$/;
let n = 0;
let raw = 0;
let br = 0;
let gz = 0;
function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'pdfjs') walk(p);
    }
    else if (EXT.test(name) && !/\.(br|gz)$/.test(name) && !/\.woff2?$/.test(name)) {
      const buf = readFileSync(p);
      if (buf.length < 512) continue;
      const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
      const g = gzipSync(buf, { level: 9 });
      writeFileSync(p + '.br', b);
      writeFileSync(p + '.gz', g);
      n++;
      raw += buf.length;
      br += b.length;
      gz += g.length;
    }
  }
}
walk(dist);
const kb = (x) => (x / 1024).toFixed(1) + ' KB';
console.log(`precompress: ${n} files — raw ${kb(raw)} → gzip ${kb(gz)} · brotli ${kb(br)}`);
