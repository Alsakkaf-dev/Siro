// يتأكد أن حزم npm مثبّتة ومطابقة لـ package.json (مثلاً بعد مزامنة نسخة أحدث من المشروع). start.bat يستدعيه.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const stampFile = join(root, 'node_modules', '.platform-deps-stamp');
const want = { dependencies: pkg.dependencies ?? {}, devDependencies: pkg.devDependencies ?? {} };
const hash = createHash('sha1').update(JSON.stringify(want)).digest('hex');

const missing = Object.keys({ ...want.dependencies, ...want.devDependencies }).filter((n) => !existsSync(join(root, 'node_modules', n, 'package.json')));
const stale = !existsSync(stampFile) || readFileSync(stampFile, 'utf8').trim() !== hash;

if (!missing.length && !stale) process.exit(0);

console.log(
  missing.length
    ? `  Installing packages (${missing.length} missing, needs internet ONE time only, may take 1-2 minutes)...`
    : '  package.json changed - updating packages (needs internet once)...',
);
const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (r.status !== 0) {
  console.error('\n  [ERROR] npm install failed. Check your internet connection and run start.bat again.');
  process.exit(1);
}
const still = Object.keys({ ...want.dependencies, ...want.devDependencies }).filter((n) => !existsSync(join(root, 'node_modules', n, 'package.json')));
if (still.length) {
  console.error('\n  [ERROR] These packages are still missing after install: ' + still.join(', '));
  process.exit(1);
}
mkdirSync(dirname(stampFile), { recursive: true });
writeFileSync(stampFile, hash);
