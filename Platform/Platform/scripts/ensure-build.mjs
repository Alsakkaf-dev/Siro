// يتأكد أن المشروع مبنيًا وحديثًا. start.bat يستدعيه قبل التشغيل.
//   node scripts/ensure-build.mjs          → يبني إن لزم
//   node scripts/ensure-build.mjs --stamp  → يسجّل بصمة المصدر بعد بناء ناجح (يُستدعى من npm run build)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stampFile = join(root, 'dist', '.build-stamp');
const SRC = ['web', 'server', 'shared', 'scripts', 'vite.config.ts', 'tsconfig.json', 'tsconfig.server.json', 'tsconfig.web.json', 'package.json', 'seed'];

function walk(p, out) {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isDirectory()) {
    for (const n of readdirSync(p).sort()) walk(join(p, n), out);
  } else out.push(p);
}
function fingerprint() {
  const files = [];
  for (const s of SRC) walk(join(root, s), files);
  const h = createHash('sha1');
  for (const f of files) {
    h.update(relative(root, f).replaceAll('\\', '/'));
    h.update(readFileSync(f));
  }
  return h.digest('hex');
}

if (process.argv.includes('--stamp')) {
  mkdirSync(dirname(stampFile), { recursive: true });
  writeFileSync(stampFile, fingerprint());
  process.exit(0);
}

const built = existsSync(join(root, 'dist', 'web', 'index.html')) && existsSync(join(root, 'dist', 'server', 'server', 'main.js'));
const fresh = built && existsSync(stampFile) && readFileSync(stampFile, 'utf8').trim() === fingerprint();
if (fresh) {
  console.log('البناء حديث — لا حاجة لإعادة البناء. (Build is up to date)');
  process.exit(0);
}
console.log('جارٍ بناء المنصة (مرة واحدة، قد يأخذ دقيقة)… (Building)');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const r = spawnSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(r.status ?? 1);
