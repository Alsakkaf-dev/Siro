// خط أصول المطبخ (K-M8، 7.7): يحسّن ملفات GLB ويتحقق منها ويحدّث البيان بالبصمة والحجم ويفحص ميزانيات PERF-20.
// الاستخدام: node tools/assets/optimize.mjs [--check] [--credits] [--skip-optimize]
//   (بلا خيارات)   يمرّ على كل أصل في assets.manifest.json له ملف: npx @gltf-transform/cli optimize ثم gltf-validator ثم يحدّث البيان
//   --check          فحص ميزانيات وبصمات وتراخيص فقط (بلا شبكة ولا تعديل)؛ رمز خروج 1 عند أي مخالفة
//   --credits        يعيد توليد CREDITS.md من البيان
// الأدوات تُستدعى بـnpx ولا تُضاف إلى package.json (قيد المالك).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'web', 'public', 'kitchen');
const manifestPath = join(dir, 'assets.manifest.json');
const args = new Set(process.argv.slice(2));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const B = manifest.budgets;
const errors = [];
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' }); return r.status === 0; };

function credits() {
  const rows = manifest.assets.map((a) => `| \`${a.id}\` | ${a.license} | ${a.source} | ${a.author ?? '—'} | ${a.attribution ?? '—'} | ${a.delivered ? 'نعم' : 'لا'} |`);
  const md = ['# إسنادات أصول المطبخ', '', 'يُنتَج من `assets.manifest.json` (`node tools/assets/optimize.mjs --credits`). لا أصل بلا ترخيص (AC-12).', '', '| الأصل | الترخيص | المصدر | المؤلف | الإسناد | مُسلَّم |', '|---|---|---|---|---|---|', ...rows, '', `المشهد الإجرائي (\`${manifest.procedural.source.split('/').pop()}\`): ${manifest.procedural.license}، بلا ملفات خارجية.`, ''].join('\n');
  writeFileSync(join(dir, 'CREDITS.md'), md);
  console.log('CREDITS.md محدّث');
}

for (const a of manifest.assets) {
  if (!a.license) errors.push(`${a.id}: بلا ترخيص (AC-12)`);
  if (!a.source) errors.push(`${a.id}: بلا مصدر`);
  const f = join(dir, a.file);
  if (!existsSync(f)) {
    if (a.delivered) errors.push(`${a.id}: موسوم delivered لكن الملف غير موجود`);
    continue;
  }
  if (!args.has('--check') && !args.has('--skip-optimize')) {
    const tmp = f.replace(/\.glb$/, '.opt.glb');
    if (!run('npx', ['--yes', '@gltf-transform/cli', 'optimize', f, tmp, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(B.environmentTextureMaxPx), '--flatten', 'false', '--join', 'false', '--instance', 'false', '--palette', 'false', '--simplify', 'false', '--prune', 'false'])) { errors.push(`${a.id}: فشل gltf-transform optimize`); continue; }
    const vdir = mkdtempSync(join(tmpdir(), 'gltfval-'));
    if (!run('npm', ['install', '--prefix', vdir, '--no-audit', '--no-fund', '--silent', 'gltf-validator']) || !run('node', [join(root, 'tools', 'assets', 'validate-glb.mjs'), vdir, tmp])) { errors.push(`${a.id}: فشل gltf-validator`); continue; }
    writeFileSync(f, readFileSync(tmp));
    unlinkSync(tmp);
  }
  const bytes = statSync(f).size;
  if (bytes > B.sceneMaxBytes) errors.push(`${a.id}: ${bytes} بايت > ميزانية المشهد ${B.sceneMaxBytes}`);
  if (a.kind === 'ingredient' && bytes > B.ingredientModelMaxBytes) errors.push(`${a.id}: ${bytes} بايت > ${B.ingredientModelMaxBytes} لنموذج مكوّن`);
  if (args.has('--check')) {
    if (a.sha256 && a.sha256 !== sha(f)) errors.push(`${a.id}: البصمة لا تطابق الملف`);
  } else {
    Object.assign(a, { bytes, sha256: sha(f), delivered: true });
  }
}
if (!args.has('--check')) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  credits();
} else if (args.has('--credits')) credits();
for (const e of errors) console.log('✗ ' + e);
console.log(errors.length ? `فشل: ${errors.length} مخالفة` : 'الأصول سليمة');
process.exit(errors.length ? 1 : 0);
