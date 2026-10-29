/** منطق المكتبة المشترك (خادم + واجهة): تصنيف الملفات، استنتاج الفصل/المادة/النوع من المسار، وقراءة روابط YouTube. */

export type FileKind = 'pdf' | 'word' | 'slides' | 'sheet' | 'text' | 'code' | 'image' | 'video' | 'audio' | 'archive' | 'other';
export type Preview = 'pdf' | 'docx' | 'image' | 'video' | 'audio' | 'text' | null;

export const KIND_LABELS: Record<FileKind, string> = {
  pdf: 'PDF',
  word: 'مستند Word',
  slides: 'شرائح',
  sheet: 'جدول بيانات',
  text: 'نص',
  code: 'كود',
  image: 'صورة',
  video: 'فيديو',
  audio: 'صوت',
  archive: 'مضغوط',
  other: 'أخرى',
};

const EXT: Record<FileKind, string[]> = {
  pdf: ['pdf'],
  word: ['doc', 'docx', 'rtf', 'odt'],
  slides: ['ppt', 'pptx', 'pps', 'ppsx', 'odp', 'key'],
  sheet: ['xls', 'xlsx', 'csv', 'ods'],
  text: ['txt', 'md', 'markdown', 'log', 'json', 'xml', 'yaml', 'yml', 'ini', 'tex'],
  code: ['js', 'mjs', 'ts', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs', 'html', 'htm', 'css', 'sql', 'sh', 'bat', 'ps1', 'php', 'rb', 'go', 'rs', 'kt', 'swift', 'ipynb', 'r', 'm', 'asm', 'vue'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'],
  video: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv', 'wmv', 'flv'],
  audio: ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'flac', 'aac', 'opus'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2'],
  other: [],
};
const EXT_TO_KIND = new Map<string, FileKind>();
for (const [k, list] of Object.entries(EXT) as [FileKind, string[]][]) for (const e of list) EXT_TO_KIND.set(e, k);

export function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i <= 0 || i === name.length - 1 ? '' : name.slice(i + 1).toLowerCase();
}
export function kindOfExt(ext: string): FileKind {
  return EXT_TO_KIND.get(ext.toLowerCase()) ?? 'other';
}

/** هل يمكن معاينته داخل الموقع؟ (الفيديو بصيغ يدعمها المتصفح فقط) */
const BROWSER_VIDEO = new Set(['mp4', 'webm', 'ogv', 'm4v', 'mov']);
const BROWSER_AUDIO = new Set(['mp3', 'wav', 'm4a', 'ogg', 'oga', 'flac', 'aac', 'opus']);
const BROWSER_IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico']);
export function previewOf(ext: string, kind: FileKind): Preview {
  const e = ext.toLowerCase();
  if (e === 'pdf') return 'pdf';
  if (e === 'docx') return 'docx';
  if (kind === 'image' && BROWSER_IMAGE.has(e)) return 'image';
  if (kind === 'video' && BROWSER_VIDEO.has(e)) return 'video';
  if (kind === 'audio' && BROWSER_AUDIO.has(e)) return 'audio';
  if (kind === 'text' || kind === 'code' || e === 'csv') return 'text';
  return null;
}

export const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon',
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg', oga: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', opus: 'audio/ogg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

/* ───── استنتاج المعلومات من المسار (تلميحات وليست حقائق) ───── */
export type DocType = 'lecture' | 'lab' | 'tutorial' | 'assignment' | 'exam' | 'quiz' | 'project' | 'notes' | 'book' | 'syllabus';
export const DOCTYPE_LABELS: Record<DocType, string> = {
  lecture: 'محاضرة',
  lab: 'مختبر',
  tutorial: 'تمرين / Tutorial',
  assignment: 'واجب',
  exam: 'امتحان',
  quiz: 'كويز',
  project: 'مشروع',
  notes: 'ملخص / ملاحظات',
  book: 'كتاب',
  syllabus: 'توصيف المادة',
};
const TYPE_RULES: [DocType, RegExp][] = [
  ['quiz', /\bquiz(zes)?\b|كويز|اختبار قصير/i],
  ['exam', /\bexams?\b|\bfinals?\b|mid[\s_-]?terms?|\btests?\b|past[\s_-]?(year|paper)s?|امتحان|اختبار|فاينل|ميدتيرم/i],
  ['lab', /\blabs?\b|laboratory|مختبر|لاب/i],
  ['tutorial', /\btut(orial)?s?\b|تمرين|تمارين/i],
  ['assignment', /\bassign(ment)?s?\b|\bhw\b|homework|واجب|تكليف/i],
  ['project', /\bproject(s)?\b|\bcapstone\b|مشروع/i],
  ['syllabus', /syllabus|course[\s_-]?(information|outline|info)|\bCI\b|توصيف/i],
  ['book', /\bbooks?\b|textbook|ebook|\bchapter\b|كتاب|مرجع/i],
  ['notes', /\bnotes?\b|summary|summaries|cheat[\s_-]?sheet|ملخص|ملاحظات/i],
  ['lecture', /\blect(ure)?s?\b|\bslides?\b|\bweek[\s_-]?\d+|محاضرة|شرائح|اسبوع|أسبوع/i],
];
const COURSE_RE = /(?:^|[^A-Za-z0-9])([A-Za-z]{3,5})[\s_-]?(\d{4})(?![0-9])/g;
const NOT_COURSE = new Set(['exam', 'year', 'week', 'quiz', 'test', 'lab', 'labs', 'lec', 'sem', 'final', 'part', 'page', 'file', 'copy', 'chap', 'note', 'notes', 'sheet', 'trial', 'draft', 'v', 'ver', 'slide', 'slides', 'tut', 'hw', 'proj', 'report', 'sept', 'june', 'july', 'march', 'april', 'jan', 'feb', 'aug', 'oct', 'nov', 'dec']);
function courseIn(seg: string): string | null {
  for (const m of seg.matchAll(COURSE_RE)) {
    const letters = m[1]!;
    const digits = m[2]!;
    if (NOT_COURSE.has(letters.toLowerCase())) continue;
    if (/^(19|20)\d\d$/.test(digits)) continue; // سنوات مثل 2024
    return (letters + digits).toUpperCase();
  }
  return null;
}

export interface PathHints {
  sem: string | null; // "SEM 5"
  course: string | null; // "SCSE3103"
  type: DocType | null;
}

/** segments: أجزاء المسار النسبي (آخرها اسم الملف). الأقرب للملف أولوية في النوع. */
export function hintsFromPath(segments: string[]): PathHints {
  const joined = segments.join('/');
  let course: string | null = null;
  for (let i = segments.length - 1; i >= 0; i--) {
    course = courseIn(segments[i]!);
    if (course) break;
  }
  let sem: string | null = null;
  const ys = /(?:year|سنة)[\s._/-]*(\d)[\s._/-]*(?:sem(?:ester)?|فصل)[\s._-]*(\d)/i.exec(joined);
  if (ys) {
    const y = Number(ys[1]);
    const s = Number(ys[2]);
    if (y >= 1 && y <= 8 && (s === 1 || s === 2)) sem = `SEM ${(y - 1) * 2 + s}`;
  }
  if (!sem) {
    const m = /(?:^|[^A-Za-z])sem(?:ester)?[\s._-]*(\d{1,2})(?!\d)|الفصل[\s._-]*(\d{1,2})/i.exec(joined);
    const n = m ? Number(m[1] ?? m[2]) : NaN;
    if (n >= 1 && n <= 16) sem = `SEM ${n}`;
  }
  let type: DocType | null = null;
  for (let i = segments.length - 1; i >= 0 && !type; i--) {
    const seg = segments[i]!.replace(/\.[A-Za-z0-9]{1,5}$/, '');
    for (const [t, re] of TYPE_RULES) {
      if (re.test(seg)) {
        type = t;
        break;
      }
    }
  }
  return { sem, course, type };
}

/* ───── YouTube ───── */
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
export function parseYouTube(input: string): { id: string; start: number } | null {
  const s = input.trim();
  if (YT_ID.test(s)) return { id: s, start: 0 };
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
  }
  if (!id || !YT_ID.test(id)) return null;
  const t = u.searchParams.get('t') ?? u.searchParams.get('start') ?? '0';
  const mm = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
  const start = mm ? Number(mm[1] ?? 0) * 3600 + Number(mm[2] ?? 0) * 60 + Number(mm[3] ?? 0) : 0;
  return { id, start: Number.isFinite(start) ? start : 0 };
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n: number): string => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}

/* ───── أنواع الواجهة والخادم ───── */
export interface LibCourseRef { code: string; name: string; color: string; semester_id: string; semester_code: string; /** معرّف المادة (إضافة غير كاسرة) ليفتح العنصر المادة نفسها */ id?: string }
export interface LibItem {
  ref: string; // f:<id> | y:<id>
  source: 'file' | 'youtube';
  id: string;
  title: string; // اسم الملف أو عنوان الفيديو
  rel_path: string | null;
  folder: string;
  ext: string;
  kind: FileKind | 'youtube';
  size: number;
  mtime: number;
  sem: string | null;
  course: LibCourseRef | null;
  course_code: string | null;
  type: DocType | null;
  tags: string[];
  progress: number;
  duration: number | null;
  done: boolean;
  note: string | null;
  opened_at: string | null;
  opened_count: number;
  preview: Preview;
  missing: boolean;
  video_id?: string;
}
export interface LibFacetCount { value: string; label: string; count: number }
export interface LibListResult {
  items: LibItem[];
  total: number;
  page: number;
  pages: number;
  facets: { kind: LibFacetCount[]; sem: LibFacetCount[]; course: LibFacetCount[]; type: LibFacetCount[]; tag: LibFacetCount[] };
}
export interface LibStatus {
  root: string;
  default_root: string;
  root_exists: boolean;
  root_is_dir: boolean;
  auto_minutes: number;
  scanning: boolean;
  last_scan: { at: string; ms: number; scanned: number; added: number; updated: number; missing: number; errors: number; truncated: boolean } | null;
  counts: { files: number; missing: number; youtube: number; by_kind: Record<string, number> };
}
export interface LibBookmark { id: string; ref: string; pos: number; label: string | null; created_at: string }
export interface LibTreeResult {
  path: string;
  folders: { name: string; path: string; files: number }[];
  files: LibItem[];
}

/** يزيل بادئة f: أو y: إن وُجدت — يمنع المسار المزدوج /library/f/f:… */
export function bareLibId(idOrRef: string): string {
  return idOrRef.replace(/^[fy]:/i, '');
}

/** مرجع API ثابت من المصدر + معرّف (حتى لو جاء المعرّف مسبوقًا بـ f:/y:) */
export function libRefOf(source: 'file' | 'youtube', idOrRef: string): string {
  return `${source === 'youtube' ? 'y' : 'f'}:${bareLibId(idOrRef)}`;
}

/** مسار صفحة العنصر في الواجهة */
export function libraryItemPath(source: 'file' | 'youtube', idOrRef: string): string {
  const bare = bareLibId(idOrRef);
  return source === 'youtube' ? `/library/y/${bare}` : `/library/f/${bare}`;
}
