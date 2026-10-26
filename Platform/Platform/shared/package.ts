/** حزمة الفصل (Semester Package v1): صيغة مجلد SEM-X التي يستوردها الموقع. المواصفة: docs/SEMESTER_PACKAGE_SPEC.md */
import type { DocType } from './library.js';

export const PACKAGE_VERSION = 1;
export const MANIFEST = 'semester.json';
export const GENERAL_DIR = '00-General';

/** مجلدات التصنيف داخل كل مادة (نفس ترقيمك الحالي + 09/10/99). */
export const CATEGORIES = [
  { dir: '01-Course-Information', type: 'syllabus', label: 'معلومات المادة' },
  { dir: '02-Lectures', type: 'lecture', label: 'المحاضرات' },
  { dir: '03-Labs', type: 'lab', label: 'المختبرات' },
  { dir: '04-Assignments', type: 'assignment', label: 'الواجبات' },
  { dir: '05-Projects', type: 'project', label: 'المشاريع' },
  { dir: '06-Exams', type: 'exam', label: 'الامتحانات والكويزات' },
  { dir: '07-Study-Notes', type: 'notes', label: 'الملخصات' },
  { dir: '08-Recordings', type: null, label: 'التسجيلات' },
  { dir: '09-Tutorials', type: 'tutorial', label: 'التمارين' },
  { dir: '10-References', type: 'book', label: 'المراجع' },
  { dir: '99-Other', type: null, label: 'أخرى' },
] as const satisfies readonly { dir: string; type: DocType | null; label: string }[];

export type CategoryDir = (typeof CATEGORIES)[number]['dir'];
const CAT_BY_DIR = new Map<string, (typeof CATEGORIES)[number]>(CATEGORIES.map((c) => [c.dir, c]));

/** «SEM-5» → 5 */
export function semNoOfPackage(name: string): number | null {
  const m = /^SEM-(\d{1,2})$/.exec(name.trim());
  return m ? Number(m[1]) : null;
}

/** مجلد مادة: «SCSE3103-05 Cognitive Computing» أو «SCSE3103 Cognitive Computing» */
const COURSE_DIR = /^([A-Z]{4}\d{4})(?:-(\d{1,3}))?(?: (.+))?$/;
export function parseCourseDir(name: string): { code: string; section: string | null; title: string | null } | null {
  const m = COURSE_DIR.exec(name);
  return m ? { code: m[1]!, section: m[2] ?? null, title: m[3]?.trim() || null } : null;
}

export function courseDirName(code: string, section: string | null, name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  return `${code}${section ? `-${section}` : ''}${safe ? ` ${safe}` : ''}`;
}

export interface PackageEntry {
  /** مسار نسبي داخل الحزمة بفاصل «/»، مثل «SCSE3103-05 CC/02-Lectures/w1.pdf» */
  path: string;
  size: number;
  /** معرّف المصدر (Drive id أو مسار محلي) — يمر كما هو */
  ref?: string;
}

export interface PackageFile {
  path: string;
  size: number;
  ref?: string;
  course_code: string | null;
  category: CategoryDir | typeof GENERAL_DIR;
  type: DocType | null;
}

export interface PackageIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

export interface PackageReport {
  ok: boolean;
  files: PackageFile[];
  issues: PackageIssue[];
  /** عدد الملفات لكل مادة/تصنيف */
  counts: Record<string, Record<string, number>>;
}

/** يفحص قائمة ملفات الحزمة مقابل رموز المواد في semester.json. لا يخمّن: ما لا يطابق القواعد يُبلَّغ عنه. */
export function checkPackage(entries: PackageEntry[], courseCodes: string[]): PackageReport {
  const codes = new Set(courseCodes);
  const issues: PackageIssue[] = [];
  const files: PackageFile[] = [];
  const counts: Record<string, Record<string, number>> = {};
  const bump = (course: string, cat: string): void => {
    (counts[course] ??= {})[cat] = (counts[course]![cat] ?? 0) + 1;
  };
  const seenCourseDirs = new Map<string, string>();
  let manifest = false;

  for (const e of entries) {
    const parts = e.path.split('/').filter(Boolean);
    if (parts.some((p) => p === '..' || p.startsWith('.'))) {
      issues.push({ level: 'warning', path: e.path, message: 'ملف مخفي أو مسار غير صالح — تم تجاهله' });
      continue;
    }
    const top = parts[0]!;
    if (parts.length === 1) {
      if (top === MANIFEST) manifest = true;
      else if (!/^README(\.md)?$/i.test(top)) issues.push({ level: 'warning', path: e.path, message: `ملف في جذر الحزمة — ضعه داخل ${GENERAL_DIR}` });
      continue;
    }
    if (top === GENERAL_DIR) {
      files.push({ path: e.path, size: e.size, ...(e.ref ? { ref: e.ref } : {}), course_code: null, category: GENERAL_DIR, type: null });
      bump('—', GENERAL_DIR);
      continue;
    }
    const course = parseCourseDir(top);
    if (!course) {
      issues.push({ level: 'error', path: top, message: `مجلد غير معروف في جذر الحزمة. المسموح: ${GENERAL_DIR} أو مجلد مادة بصيغة «CODE-SECTION Name»` });
      continue;
    }
    if (!codes.has(course.code)) {
      issues.push({ level: 'error', path: top, message: `رمز المادة ${course.code} غير موجود في ${MANIFEST}` });
      continue;
    }
    const prev = seenCourseDirs.get(course.code);
    if (prev && prev !== top) issues.push({ level: 'error', path: top, message: `أكثر من مجلد للمادة ${course.code} («${prev}» و«${top}»)` });
    seenCourseDirs.set(course.code, top);
    if (parts.length === 2) {
      issues.push({ level: 'warning', path: e.path, message: 'ملف مباشرة داخل مجلد المادة — يُعامل كـ 99-Other' });
      files.push({ path: e.path, size: e.size, ...(e.ref ? { ref: e.ref } : {}), course_code: course.code, category: '99-Other', type: null });
      bump(course.code, '99-Other');
      continue;
    }
    const cat = CAT_BY_DIR.get(parts[1]!);
    if (!cat) {
      issues.push({ level: 'error', path: `${top}/${parts[1]}`, message: `تصنيف غير معروف. المسموح: ${CATEGORIES.map((c) => c.dir).join('، ')}` });
      continue;
    }
    files.push({ path: e.path, size: e.size, ...(e.ref ? { ref: e.ref } : {}), course_code: course.code, category: cat.dir, type: cat.type });
    bump(course.code, cat.dir);
  }
  if (!manifest) issues.push({ level: 'error', path: MANIFEST, message: `الملف ${MANIFEST} مفقود — لا يمكن الاستيراد بدونه` });
  for (const code of codes) if (!seenCourseDirs.has(code)) issues.push({ level: 'warning', path: code, message: `المادة ${code} موجودة في ${MANIFEST} بدون مجلد ملفات` });
  return { ok: !issues.some((i) => i.level === 'error'), files, issues, counts };
}
