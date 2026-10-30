// يحوّل مجلدات الفصول الحالية إلى خطط حزم SEM-X (لا ينقل ولا يعدّل أي ملف).
//   node scripts/package-semester.mjs [SEM-1 SEM-2 …|all] [--src "<Bachelor in Software Engineering>"]
// الناتج في packages/: SEM-N/semester.json + SEM-N.plan.json (المصدر ← مسار الحزمة) + REPORT.md
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMESTERS, CATEGORY_RULES, COLORS } from './package-rules.mjs';
import { checkPackage, courseDirName, CATEGORIES, GENERAL_DIR, MANIFEST, PACKAGE_VERSION } from '../shared/package.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const srcIdx = argv.indexOf('--src');
const libRoot = srcIdx >= 0 ? resolve(argv[srcIdx + 1]) : resolve(root, '..', '..', 'Bachelor in Software Engineering');
const repoRoot = resolve(root, '..', '..');
const wanted = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--src');
const ids = !wanted.length || wanted.includes('all') ? Object.keys(SEMESTERS) : wanted;
const outDir = join(root, 'packages');
const STANDARD = new Set(CATEGORIES.map((c) => c.dir));
const SKIP = new Set(['desktop.ini', 'thumbs.db', '.ds_store']);

/** ملفات مستبعدة عمدًا (بيانات IDE، كاش، ملفات قفل Office، ملفات النظام، ملفات مخفية) — تُذكر كلها في التقرير */
function walk(dir, rel = [], skipped = []) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.name.startsWith('.') || e.name.startsWith('~$') || SKIP.has(e.name.toLowerCase()) || e.isSymbolicLink()) {
      if (e.isDirectory()) skipped.push(...walkAll(p).map((x) => [...rel, e.name, ...x].join('/')));
      else skipped.push([...rel, e.name].join('/'));
      continue;
    }
    if (e.isDirectory()) out.push(...walk(p, [...rel, e.name], skipped));
    else if (e.isFile()) out.push({ rel: [...rel, e.name], size: statSync(p).size, abs: p });
  }
  return out;
}

function walkAll(dir, rel = []) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !e.isSymbolicLink()) out.push(...walkAll(join(dir, e.name), [...rel, e.name]));
    else out.push([...rel, e.name]);
  }
  return out;
}

function categoryOf(folder) {
  if (STANDARD.has(folder)) return { dir: folder, keep: false };
  for (const [re, dir] of CATEGORY_RULES) if (re.test(folder)) return { dir, keep: true };
  return { dir: '99-Other', keep: true };
}

function manifestFor(id, def) {
  if (def.seed) {
    const s = JSON.parse(readFileSync(join(root, def.seed), 'utf8'));
    return { package_version: PACKAGE_VERSION, source: s.source, semester: s.semester, courses: s.courses, assessments: s.assessments, notes: s.notes };
  }
  const semId = def.semester.id;
  return {
    package_version: PACKAGE_VERSION,
    source: `package:${id}`,
    semester: def.semester,
    courses: def.courses.map((c, i) => ({
      id: `${semId}-${c.code.toLowerCase()}`,
      code: c.code,
      name: c.name,
      section: c.section,
      credits: c.credits,
      color: COLORS[i % COLORS.length],
      sort: i + 1,
      note: c.note ?? null,
      result: c.result,
    })),
    assessments: [],
    notes: [],
  };
}

mkdirSync(outDir, { recursive: true });
const report = ['# تقرير تحويل الحزم', '', `المصدر: \`${relative(repoRoot, libRoot)}\``, ''];
let failed = false;

for (const id of ids) {
  const def = SEMESTERS[id];
  if (!def) throw new Error(`فصل غير معروف: ${id}`);
  const manifest = manifestFor(id, def);
  const byDir = new Map(def.courses.filter((c) => c.dir).map((c) => [c.dir, c]));
  const courseName = (code) => {
    const c = manifest.courses.find((x) => x.code === code);
    return courseDirName(code, c?.section ?? null, c?.name ?? '');
  };
  const skipped = [];
  const files = walk(join(libRoot, def.src), [], skipped);
  const entries = [];
  const remaps = new Map();
  for (const f of files) {
    const [top, ...rest] = f.rel;
    let dest;
    const course = byDir.get(top);
    if (course) {
      const cdir = courseName(course.code);
      if (rest.length === 1) dest = [cdir, '99-Other', rest[0]];
      else {
        const cat = categoryOf(rest[0]);
        dest = [cdir, cat.dir, ...(cat.keep ? [rest[0]] : []), ...rest.slice(1)];
        if (cat.keep) remaps.set(`${top}/${rest[0]}`, `${cdir}/${cat.dir}/${rest[0]}`);
      }
    } else if (top === '00-Semester-Records') dest = [GENERAL_DIR, 'Semester-Records', ...rest];
    else dest = [GENERAL_DIR, ...f.rel];
    entries.push({ src: relative(repoRoot, f.abs).split('\\').join('/'), dest: dest.join('/'), size: f.size });
  }
  const check = checkPackage([{ path: MANIFEST, size: 1 }, ...entries.map((e) => ({ path: e.dest, size: e.size }))], manifest.courses.map((c) => c.code));
  const dup = entries.length - new Set(entries.map((e) => e.dest)).size;
  mkdirSync(join(outDir, id), { recursive: true });
  writeFileSync(join(outDir, id, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(join(outDir, `${id}.plan.json`), JSON.stringify({ pkg: id, source_root: relative(repoRoot, libRoot), files: entries.length, bytes: entries.reduce((s, e) => s + e.size, 0), entries }, null, 1) + '\n');
  const ok = check.ok && dup === 0 && entries.length === files.length;
  failed ||= !ok;
  report.push(`## ${id} ${ok ? '✅' : '❌'}`, '', `- الملفات: ${entries.length} (+ ${skipped.length} مستبعد عمدًا، مذكور أدناه) · الحجم: ${(entries.reduce((s, e) => s + e.size, 0) / 1048576).toFixed(1)} MB · تكرار مسارات: ${dup}`);
  report.push(`- المواد: ${manifest.courses.map((c) => `${c.code}${c.result ? ` (${c.result.grade})` : ''}`).join('، ')}`);
  report.push('', '| المادة | ' + CATEGORIES.map((c) => c.dir.slice(0, 2)).join(' | ') + ' |', '|---|' + CATEGORIES.map(() => '---').join('|') + '|');
  for (const [code, counts] of Object.entries(check.counts).filter(([k]) => k !== '—')) report.push(`| ${code} | ${CATEGORIES.map((c) => counts[c.dir] ?? '').join(' | ')} |`);
  report.push(`| عام (00-General) | ${check.counts['—']?.[GENERAL_DIR] ?? 0} ملف |`);
  if (skipped.length) report.push('', `<details><summary>مستبعد عمدًا: ${skipped.length} ملف (بيانات IDE/كاش/ملفات قفل/مخفية)</summary>`, '', ...skipped.map((x) => `- \`${x}\``), '', '</details>');
  if (remaps.size) report.push('', '<details><summary>إعادة تسمية مجلدات (' + remaps.size + ')</summary>', '', ...[...remaps].map(([a, b]) => `- \`${a}\` → \`${b}\``), '', '</details>');
  const issues = check.issues.filter((i) => i.path !== MANIFEST);
  if (issues.length) report.push('', ...issues.map((i) => `- ${i.level === 'error' ? '❌' : '⚠️'} \`${i.path}\`: ${i.message}`));
  report.push('');
  console.log(`${ok ? 'OK ' : 'ERR'} ${id}: ${entries.length} files, ${check.issues.filter((i) => i.level === 'error').length} errors, ${check.issues.filter((i) => i.level === 'warning').length} warnings`);
}
writeFileSync(join(outDir, 'REPORT.md'), report.join('\n'));
process.exit(failed ? 1 : 0);
