/** استيراد حزمة فصل (SEM-X): semester.json + ملفات المواد. المصدر: مجلد محلي، أو مجلد Google Drive عام، أو قائمة جاهزة. */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Db } from './db.js';
import { applyImport, diffImport, EXPORT_SCHEMA, parseImport, type DiffResult, type ParsedImport } from './exportImport.js';
import { fileIdOf } from './library.js';
import { checkPackage, semNoOfPackage, MANIFEST, PACKAGE_VERSION, type PackageEntry, type PackageReport } from '../shared/package.js';
import { extOf, kindOfExt } from '../shared/library.js';

const resultSchema = z.object({
  grade: z.string().max(4).nullable().default(null),
  points: z.number().min(0).max(4).nullable().default(null),
  credits: z.number().min(0).max(30).nullable().default(null),
  status: z.string().max(60).nullable().default(null),
});

const manifestSchema = z.object({
  package_version: z.literal(PACKAGE_VERSION, `package_version يجب أن يكون ${PACKAGE_VERSION}`),
  source: z.string().max(80).default('package'),
  semester: z.record(z.string(), z.unknown()),
  courses: z.array(z.record(z.string(), z.unknown())).default([]),
  assessments: z.array(z.record(z.string(), z.unknown())).default([]),
  notes: z.array(z.record(z.string(), z.unknown())).default([]),
});

export interface CourseResult { course_id: string; grade: string | null; points: number | null; credits: number | null; status: string | null }

export interface ParsedManifest { data: ParsedImport; results: CourseResult[]; codes: string[] }

/** يحوّل semester.json إلى صيغة الاستيراد الحالية ويتحقق منها بنفس قواعد الموقع. */
export function parseManifest(raw: unknown): { ok: true; value: ParsedManifest } | { ok: false; errors: string[] } {
  const m = manifestSchema.safeParse(raw);
  if (!m.success) return { ok: false, errors: m.error.issues.map((i) => `${MANIFEST}: ${i.path.join('.') || '—'} — ${i.message}`) };
  const sem = m.data.semester;
  const semId = typeof sem['id'] === 'string' ? sem['id'] : '';
  const results: CourseResult[] = [];
  const errors: string[] = [];
  const courses = m.data.courses.map((c) => {
    const { result, ...rest } = c as Record<string, unknown> & { result?: unknown };
    if (result !== undefined && result !== null) {
      const r = resultSchema.safeParse(result);
      if (!r.success) errors.push(`نتيجة المادة ${String(c['code'])}: ${r.error.issues.map((i) => i.message).join('؛ ')}`);
      else results.push({ course_id: String(c['id']), ...r.data });
    }
    return { source: m.data.source, ...rest, semester_id: semId };
  });
  if (errors.length) return { ok: false, errors };
  const p = parseImport({
    schema: EXPORT_SCHEMA,
    semesters: [{ source: m.data.source, ...sem }],
    courses,
    assessments: m.data.assessments.map((a) => ({ source: m.data.source, ...a })),
    notes: m.data.notes.map((n) => ({ ...n, semester_id: semId })),
    active_semester_id: null,
  });
  if (!p.ok) return { ok: false, errors: p.errors };
  return { ok: true, value: { data: p.data, results, codes: p.data.courses.map((c) => c.code) } };
}

/* ───── قراءة الحزمة من المصادر ───── */
export interface PackageSource {
  pkg: string; // "SEM-5"
  origin: 'local' | 'drive';
  location: string; // مسار محلي أو رابط Drive
  manifest: unknown;
  entries: PackageEntry[];
}

export async function readLocalPackage(dir: string): Promise<PackageSource> {
  const abs = path.resolve(dir);
  const st = await fs.promises.stat(abs).catch(() => null);
  if (!st?.isDirectory()) throw new Error('المجلد غير موجود');
  const entries: PackageEntry[] = [];
  const walk = async (d: string, rel: string[]): Promise<void> => {
    for (const e of await fs.promises.readdir(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.isSymbolicLink()) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p, [...rel, e.name]);
      else if (e.isFile()) entries.push({ path: [...rel, e.name].join('/'), size: (await fs.promises.stat(p)).size, ref: p });
    }
  };
  await walk(abs, []);
  const mf = path.join(abs, MANIFEST);
  const manifest = fs.existsSync(mf) ? (JSON.parse(fs.readFileSync(mf, 'utf8').replace(/^﻿/, '')) as unknown) : null;
  return { pkg: path.basename(abs), origin: 'local', location: abs, manifest, entries };
}

/** «https://drive.google.com/drive/folders/ID?usp=sharing» أو ID مباشر */
export function driveFolderId(input: string): string | null {
  const s = input.trim();
  const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(s) ?? /[?&]id=([A-Za-z0-9_-]{10,})/.exec(s);
  if (m) return m[1]!;
  return /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : null;
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
interface DriveFile { id: string; name: string; mimeType: string; size?: string }

async function driveList(folderId: string, key: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = '';
  do {
    const u = new URL(DRIVE_API);
    u.searchParams.set('q', `'${folderId}' in parents and trashed = false`);
    u.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size)');
    u.searchParams.set('pageSize', '1000');
    u.searchParams.set('key', key);
    if (pageToken) u.searchParams.set('pageToken', pageToken);
    const r = await fetch(u);
    if (!r.ok) throw new Error(r.status === 404 ? 'مجلد Drive غير موجود أو غير مشارك «لأي شخص لديه الرابط»' : `Drive API: ${r.status} ${(await r.text()).slice(0, 200)}`);
    const j = (await r.json()) as { files: DriveFile[]; nextPageToken?: string };
    out.push(...j.files);
    pageToken = j.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

/** يقرأ حزمة من مجلد Drive عام (يحتاج مفتاح API عام PLATFORM_DRIVE_API_KEY). */
export async function readDrivePackage(link: string, key: string | undefined): Promise<PackageSource> {
  if (!key) throw new Error('مفتاح Google Drive API غير مضبوط (PLATFORM_DRIVE_API_KEY) — استخدم «قائمة الحزمة» بدلًا منه');
  const rootId = driveFolderId(link);
  if (!rootId) throw new Error('رابط مجلد Drive غير صالح');
  const meta = await fetch(`${DRIVE_API}/${rootId}?fields=id,name,mimeType&key=${encodeURIComponent(key)}`);
  if (!meta.ok) throw new Error('تعذّر فتح المجلد — تأكد أنه مشارك «لأي شخص لديه الرابط: عارض»');
  const root = (await meta.json()) as DriveFile;
  const entries: PackageEntry[] = [];
  let manifestId: string | null = null;
  const stack: { id: string; rel: string[] }[] = [{ id: rootId, rel: [] }];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const f of await driveList(cur.id, key)) {
      if (f.mimeType === 'application/vnd.google-apps.folder') stack.push({ id: f.id, rel: [...cur.rel, f.name] });
      else {
        const p = [...cur.rel, f.name].join('/');
        if (p === MANIFEST) manifestId = f.id;
        entries.push({ path: p, size: Number(f.size ?? 0), ref: f.id });
      }
    }
  }
  let manifest: unknown = null;
  if (manifestId) {
    const r = await fetch(`${DRIVE_API}/${manifestId}?alt=media&key=${encodeURIComponent(key)}`);
    if (r.ok) manifest = JSON.parse((await r.text()).replace(/^﻿/, '')) as unknown;
  }
  return { pkg: root.name, origin: 'drive', location: `https://drive.google.com/drive/folders/${rootId}`, manifest, entries };
}

/** قائمة جاهزة (ناتج أداة الرفع): { pkg, location, manifest, entries:[{path,size,ref}] } */
const listingSchema = z.object({
  pkg: z.string().min(1).max(20),
  location: z.string().max(500).default(''),
  manifest: z.unknown(),
  entries: z.array(z.object({ path: z.string().min(1).max(1000), size: z.number().min(0), ref: z.string().max(200).optional() })).max(50_000),
});
export function readListing(raw: unknown): PackageSource {
  const l = listingSchema.parse(raw);
  return { pkg: l.pkg, origin: 'drive', location: l.location, manifest: l.manifest, entries: l.entries.map((e) => ({ path: e.path, size: e.size, ...(e.ref ? { ref: e.ref } : {}) })) };
}

/* ───── الفحص والتطبيق ───── */
export interface PackagePreview {
  pkg: string;
  origin: 'local' | 'drive';
  location: string;
  ok: boolean;
  errors: string[];
  report: PackageReport | null;
  diff: DiffResult | null;
  semester: { id: string; code: string; name: string } | null;
  results: number;
}

export function previewPackage(db: Db, src: PackageSource): PackagePreview & { parsed: ParsedManifest | null } {
  const base = { pkg: src.pkg, origin: src.origin, location: src.location };
  const errors: string[] = [];
  if (semNoOfPackage(src.pkg) === null) errors.push(`اسم المجلد «${src.pkg}» يجب أن يكون بصيغة SEM-رقم (مثل SEM-5)`);
  if (src.manifest === null || src.manifest === undefined) {
    return { ...base, ok: false, errors: [...errors, `الملف ${MANIFEST} مفقود أو غير صالح`], report: null, diff: null, semester: null, results: 0, parsed: null };
  }
  const pm = parseManifest(src.manifest);
  if (!pm.ok) return { ...base, ok: false, errors: [...errors, ...pm.errors], report: null, diff: null, semester: null, results: 0, parsed: null };
  const sem = pm.value.data.semesters[0]!;
  const n = semNoOfPackage(src.pkg);
  if (n !== null && sem.sem_no !== null && sem.sem_no !== n) errors.push(`رقم الفصل في ${MANIFEST} (${sem.sem_no}) لا يطابق اسم المجلد ${src.pkg}`);
  const report = checkPackage(src.entries, pm.value.codes);
  for (const i of report.issues) if (i.level === 'error') errors.push(`${i.path}: ${i.message}`);
  return {
    ...base,
    ok: errors.length === 0,
    errors,
    report,
    diff: diffImport(db, pm.value.data),
    semester: { id: sem.id, code: sem.code, name: sem.name },
    results: pm.value.results.length,
    parsed: pm.value,
  };
}

export interface ApplyResult { semester_id: string; files: number; removed_files: number; results: number }

/** يطبّق الحزمة: بيانات الفصل (merge) + النتائج الرسمية + فهرسة الملفات. إعادة الاستيراد آمنة (تستبدل ملفات نفس الحزمة فقط). */
export function applyPackage(db: Db, src: PackageSource, parsed: ParsedManifest, report: PackageReport): ApplyResult {
  const sem = parsed.data.semesters[0]!;
  const now = new Date().toISOString();
  const dbOrigin = src.origin === 'drive' ? 'drive' : 'pkgdir';
  let removed = 0;
  applyImport(db, parsed.data, 'merge');
  db.tx(() => {
    for (const r of parsed.results) {
      db.run('INSERT INTO acad_results (course_id, grade, points, credits, status, source) VALUES (?,?,?,?,?,?) ON CONFLICT(course_id) DO UPDATE SET grade=excluded.grade, points=excluded.points, credits=excluded.credits, status=excluded.status, source=excluded.source',
        r.course_id, r.grade, r.points, r.credits, r.status, `package:${src.pkg}`);
    }
    const keep = new Set<string>();
    for (const f of report.files) {
      const rel = `@${src.origin}/${src.pkg}/${f.path}`;
      keep.add(rel);
      const segs = f.path.split('/');
      const name = segs[segs.length - 1]!;
      const ext = extOf(name);
      const folder = [src.pkg, ...segs.slice(0, -1)].join('/');
      const remote = f.ref ?? null;
      const exists = db.get('SELECT 1 FROM lib_files WHERE rel_path = ?', rel);
      if (exists) {
        db.run('UPDATE lib_files SET size=?, folder=?, sem_hint=?, course_hint=?, type_hint=?, origin=?, remote_id=?, pkg=?, missing=0, last_seen=? WHERE rel_path=?',
          f.size, folder, sem.code, f.course_code, f.type, dbOrigin, remote, src.pkg, now, rel);
      } else {
        db.run('INSERT INTO lib_files (id, rel_path, name, ext, kind, size, mtime, folder, sem_hint, course_hint, type_hint, missing, first_seen, last_seen, origin, remote_id, pkg) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?)',
          fileIdOf(rel), rel, name, ext, kindOfExt(ext), f.size, Date.now(), folder, sem.code, f.course_code, f.type, now, now, dbOrigin, remote, src.pkg);
      }
    }
    for (const r of db.all<{ rel_path: string }>('SELECT rel_path FROM lib_files WHERE pkg = ? AND origin = ?', src.pkg, dbOrigin)) {
      if (!keep.has(r.rel_path)) {
        db.run('DELETE FROM lib_files WHERE rel_path = ?', r.rel_path);
        removed++;
      }
    }
    db.run('INSERT INTO pkg_imports (pkg, semester_id, origin, location, files, imported_at) VALUES (?,?,?,?,?,?) ON CONFLICT(pkg) DO UPDATE SET semester_id=excluded.semester_id, origin=excluded.origin, location=excluded.location, files=excluded.files, imported_at=excluded.imported_at',
      src.pkg, sem.id, src.origin, src.location, report.files.length, now);
  });
  return { semester_id: sem.id, files: report.files.length, removed_files: removed, results: parsed.results.length };
}

export function listImports(db: Db): { pkg: string; semester_id: string | null; origin: string; location: string; files: number; imported_at: string }[] {
  return db.all('SELECT * FROM pkg_imports ORDER BY pkg');
}

export function resultsFor(db: Db, semesterId: string): CourseResult[] {
  return db.all<CourseResult>('SELECT r.course_id, r.grade, r.points, r.credits, r.status FROM acad_results r JOIN acad_courses c ON c.id = r.course_id WHERE c.semester_id = ?', semesterId);
}
