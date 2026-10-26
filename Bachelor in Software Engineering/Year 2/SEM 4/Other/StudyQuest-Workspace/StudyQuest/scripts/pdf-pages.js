// Print page counts for all PDFs under converted/ (or a given subfolder).
// Usage: node scripts/pdf-pages.js [subfolder]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const arg = process.argv[2] ?? '';
const root = path.isAbsolute(arg)
  ? arg
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'converted', arg);

function* walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(p);
    else if (d.name.toLowerCase().endsWith('.pdf')) yield p;
  }
}

for (const file of walk(root)) {
  try {
    const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(file)), useWorkerFetch: false, isEvalSupported: false }).promise;
    console.log(`${doc.numPages}\t${path.relative(root, file)}`);
    await doc.destroy();
  } catch (e) {
    console.log(`ERR\t${path.relative(root, file)}\t${e.message}`);
  }
}
