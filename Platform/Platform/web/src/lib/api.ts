import { plainDeep } from '../../../shared/plain.js';
import type { CommandType, ContentStatus, LifeFile, LifeContentName, LifeStatus } from '../../../shared/life.js';
import type { MyWeek, MyWorkout, Weekday } from '../../../shared/sports.js';
import type { LibBookmark, LibItem, LibListResult, LibStatus, LibTreeResult } from '../../../shared/library.js';
import type { PackageReport } from '../../../shared/package.js';
import type { AcademicNote, Assessment, Course, MoreHit, SearchHit, Semester, SemesterBundle, SemesterSummary } from '../../../shared/types.js';

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

// أثناء تنفيذ أداة من نواة الذكاء تُوسم الطلبات x-actor: ai ← السجل يعرض «الذكاء» كفاعل
let aiDepth = 0;
export async function asAi<T>(fn: () => Promise<T>): Promise<T> {
  aiDepth++;
  try {
    return await fn();
  } finally {
    aiDepth--;
  }
}

// طلبات GET المتطابقة والمتزامنة تُدمج في طلب واحد؛ أي تعديل (POST/PATCH/DELETE) يفرّغ القائمة كي لا نُرجع بيانات قديمة.
const inflight = new Map<string, Promise<unknown>>();

export function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  if (method !== 'GET') {
    inflight.clear();
    return doReq<T>(method, url, body);
  }
  const hit = inflight.get(url);
  if (hit) return hit as Promise<T>;
  const p = doReq<T>(method, url, body).finally(() => {
    if (inflight.get(url) === p) inflight.delete(url);
  });
  inflight.set(url, p);
  return p;
}

// index.html يبدأ طلبَي /api/semesters و /api/semesters/:id مبكرًا (بالتوازي مع تنزيل الحزمة) ويضعهما في window.__pre؛ نستهلك كلًّا منهما مرة واحدة.
interface Pre { ok: boolean; status: number; text: string }
declare global {
  interface Window { __pre?: Record<string, Promise<Pre> | undefined> }
}
async function fetchRaw(method: string, url: string, body?: unknown): Promise<Pre> {
  if (method === 'GET' && window.__pre?.[url]) {
    const p = window.__pre[url];
    delete window.__pre[url];
    try {
      const r = await p;
      if (r) return r;
    } catch {
      /* نعيد الطلب عاديًّا */
    }
  }
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (aiDepth > 0) headers['x-actor'] = 'ai';
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

async function doReq<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetchRaw(method, url, body);
  const text = res.text;
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ليس JSON */
  }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; fields?: Record<string, string>; errors?: string[] };
    throw new ApiError(res.status, d.error ?? d.errors?.join('\n') ?? `خطأ ${res.status}`, d.fields ?? {});
  }
  return data as T;
}

export interface BackupInfo { name: string; date: string; file: string; size: number; mtime: string }
export interface Info { version: string; driver: string; schema: number; db_file: string; db_size: number; port: number; host: string }
export interface FieldChange { field: string; from: unknown; to: unknown }
export interface EntityDiff { added: { id: string; label: string }[]; removed: { id: string; label: string }[]; changed: { id: string; label: string; fields: FieldChange[] }[]; unchanged: number }
export type PackageSourceReq = { kind: 'drive'; link: string } | { kind: 'local'; path: string } | { kind: 'listing'; listing?: unknown; link?: string };
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
export interface PackageImportRow { pkg: string; semester_id: string | null; origin: string; location: string; files: number; imported_at: string }
export interface CourseResult { course_id: string; grade: string | null; points: number | null; credits: number | null; status: string | null }
export interface DiffResult { semesters: EntityDiff; courses: EntityDiff; assessments: EntityDiff; notes: EntityDiff; totals: { added: number; removed: number; changed: number; unchanged: number } }
export interface Deleted { ok: boolean; undo: string }

export interface LibQuery { q?: string; kind?: string; sem?: string; course?: string; type?: string; tag?: string; folder?: string; sort?: string; dir?: string; page?: number; limit?: number; yt?: boolean }
const qs = (o: Record<string, string | number | boolean | undefined>): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '' && v !== false) p.set(k, v === true ? '1' : String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const lib = {
  status: () => req<LibStatus>('GET', '/api/library/status'),
  settings: (b: { root?: string; auto_minutes?: number }) => req<LibStatus>('PUT', '/api/library/settings', b),
  scan: () => req<{ ok: boolean }>('POST', '/api/library/scan'),
  items: (q: LibQuery) => req<LibListResult>('GET', `/api/library/items${qs({ ...q })}`),
  tree: (path: string) => req<LibTreeResult>('GET', `/api/library/tree${qs({ path })}`),
  recent: (limit = 12) => req<LibItem[]>('GET', `/api/library/recent?limit=${limit}`),
  tags: () => req<{ tag: string; count: number }[]>('GET', '/api/library/tags'),
  item: (ref: string) => req<LibItem>('GET', `/api/library/item/${encodeURIComponent(ref)}`),
  setTags: (ref: string, tags: string[]) => req<LibItem>('PUT', `/api/library/tags/${encodeURIComponent(ref)}`, { tags }),
  meta: (ref: string, b: { note?: string | null; progress?: number; duration?: number | null; done?: boolean }) => req<LibItem>('PUT', `/api/library/meta/${encodeURIComponent(ref)}`, b),
  open: (ref: string) => req<{ ok: boolean }>('POST', `/api/library/open/${encodeURIComponent(ref)}`),
  bookmarks: (ref: string) => req<LibBookmark[]>('GET', `/api/library/bookmarks/${encodeURIComponent(ref)}`),
  addBookmark: (ref: string, pos: number, label?: string) => req<LibBookmark>('POST', `/api/library/bookmarks/${encodeURIComponent(ref)}`, { pos, label }),
  editBookmark: (id: string, label: string) => req<{ ok: boolean }>('PATCH', `/api/library/bookmark/${encodeURIComponent(id)}`, { label }),
  delBookmark: (id: string) => req<Deleted>('DELETE', `/api/library/bookmark/${encodeURIComponent(id)}`),
  youtube: () => req<LibItem[]>('GET', '/api/library/youtube'),
  addYoutube: (b: { url: string; title?: string; course?: string }) => req<LibItem>('POST', '/api/library/youtube', b),
  editYoutube: (id: string, b: { title?: string; course?: string }) => req<LibItem>('PATCH', `/api/library/youtube/${encodeURIComponent(id)}`, b),
  delYoutube: (id: string) => req<Deleted>('DELETE', `/api/library/youtube/${encodeURIComponent(id)}`),
  bulkDelYoutube: (ids: string[]) => req<Deleted & { count: number }>('POST', '/api/library/youtube/bulk-delete', { ids }),
  bulk: (refs: string[], op: 'tag' | 'untag' | 'done' | 'undone', tag?: string) => req<{ ok: boolean; count: number }>('POST', '/api/library/bulk', { refs, op, tag }),
  text: (id: string) => req<{ name: string; text: string; truncated: boolean; size: number }>('GET', `/api/library/files/${encodeURIComponent(id)}/text`),
  docx: (id: string) => req<{ html: string; messages: string[] }>('GET', `/api/library/files/${encodeURIComponent(id)}/docx`),
  rawUrl: (id: string, download = false) => `/api/library/files/${encodeURIComponent(id)}/raw${download ? '?download=1' : ''}`,
};

export interface LifeEventRow { id: string; at: string; type: string; summary: string; undone: boolean; payload: Record<string, unknown> }
export interface LifeBundle { status: LifeStatus; files: Partial<Record<LifeFile, unknown>> }
export const life = {
  status: () => req<LifeStatus>('GET', '/api/life/status'),
  bundle: (files: LifeFile[]) => req<LifeBundle>('GET', `/api/life/bundle${qs({ files: files.join(',') })}`).then((r) => ({ ...r, files: plainDeep(r.files) })),
  content: <T>(name: LifeContentName) => req<{ name: string; data: T | null; status: ContentStatus; root_exists: boolean }>('GET', `/api/life/content/${encodeURIComponent(name)}`).then((r) => ({ ...r, data: plainDeep(r.data) })),
  qadaChoice: () => req<{ scenario: string | null }>('GET', '/api/life/qada-choice'),
  setQadaChoice: (scenario: string | null) => req<{ scenario: string | null }>('PUT', '/api/life/qada-choice', { scenario }),
  events: () => req<{ events: LifeEventRow[] }>('GET', '/api/life/events'),
  log: (type: CommandType, payload: Record<string, unknown>) => req<{ event: LifeEventRow }>('POST', '/api/life/log', { type, payload }),
  undo: (id: string) => req<{ ok: true }>('POST', `/api/life/events/${encodeURIComponent(id)}/undo`),
};

export interface ItemInput { exercise_id: string; en_name: string; ar_name: string; sets?: number | null; reps_min?: number | null; reps_max?: number | null; duration_s?: number | null; per_side?: boolean; note?: string | null }
export interface AltPick { alt_id: string; habit_id: string }
export const sports = {
  mine: () => req<MyWeek>('GET', '/api/sports/mine'),
  create: (b: { name: string; note?: string; items?: ItemInput[] }) => req<MyWorkout>('POST', '/api/sports/workouts', b),
  edit: (id: string, b: { name?: string; note?: string }) => req<MyWorkout>('PATCH', `/api/sports/workouts/${id}`, b),
  setItems: (id: string, items: ItemInput[]) => req<MyWorkout>('PUT', `/api/sports/workouts/${id}/items`, { items }),
  del: (id: string) => req<Deleted>('DELETE', `/api/sports/workouts/${id}`),
  bulkDel: (ids: string[]) => req<Deleted>('POST', '/api/sports/workouts/bulk-delete', { ids }),
  order: (ids: string[]) => req<MyWeek>('PUT', '/api/sports/order', { ids }),
  week: (day: Weekday, workout_id: string | null) => req<MyWeek>('PUT', '/api/sports/week', { day, workout_id }),
  settings: (b: { template?: string | null; location?: 'home' | 'gym' | null }) => req<MyWeek>('PUT', '/api/sports/settings', b),
  altPicks: () => req<AltPick[]>('GET', '/api/sports/alt-picks'),
  pickAlt: (alt_id: string, habit_id: string, picked: boolean) => req<AltPick[]>('PUT', '/api/sports/alt-picks', { alt_id, habit_id, picked }),
};

export const api = {
  semesters: () => req<SemesterSummary[]>('GET', '/api/semesters'),
  bundle: (id: string) => req<SemesterBundle>('GET', `/api/semesters/${id}`),
  addSemester: (b: unknown) => req<SemesterBundle>('POST', '/api/semesters', b),
  editSemester: (id: string, b: unknown) => req<SemesterBundle>('PATCH', `/api/semesters/${id}`, b),
  activate: (id: string) => req<{ ok: boolean }>('POST', `/api/semesters/${id}/activate`),
  delSemester: (id: string) => req<Deleted>('DELETE', `/api/semesters/${id}`),
  addCourse: (semId: string, b: unknown) => req<Course>('POST', `/api/semesters/${semId}/courses`, b),
  editCourse: (id: string, b: unknown) => req<Course>('PATCH', `/api/courses/${id}`, b),
  delCourse: (id: string) => req<Deleted>('DELETE', `/api/courses/${id}`),
  addAssessment: (courseId: string, b: unknown) => req<Assessment>('POST', `/api/courses/${courseId}/assessments`, b),
  editAssessment: (id: string, b: unknown) => req<Assessment>('PATCH', `/api/assessments/${id}`, b),
  delAssessment: (id: string) => req<Deleted>('DELETE', `/api/assessments/${id}`),
  addNote: (semId: string, b: unknown) => req<AcademicNote>('POST', `/api/semesters/${semId}/notes`, b),
  editNote: (id: string, b: unknown) => req<AcademicNote>('PATCH', `/api/notes/${id}`, b),
  delNote: (id: string) => req<Deleted>('DELETE', `/api/notes/${id}`),
  bulkAssessments: (ids: string[], op: 'status' | 'delete', status?: string) => req<{ ok: boolean; count: number; undo?: string }>('POST', '/api/assessments/bulk', { ids, op, status }),
  bulkSemesters: (ids: string[]) => req<{ ok: boolean; count: number; undo: string }>('POST', '/api/semesters/bulk', { ids, op: 'delete' }),
  bulkCourses: (ids: string[]) => req<{ ok: boolean; count: number; undo: string }>('POST', '/api/courses/bulk', { ids, op: 'delete' }),
  bulkNotes: (ids: string[], op: 'resolve' | 'unresolve' | 'delete') => req<{ ok: boolean; count: number; undo?: string }>('POST', '/api/notes/bulk', { ids, op }),
  undo: (token: string) => req<{ ok: boolean; label: string }>('POST', `/api/undo/${token}`),
  search: (q: string) => req<SearchHit[]>('GET', `/api/search?q=${encodeURIComponent(q)}`),
  searchMore: (q: string) => req<MoreHit[]>('GET', `/api/search/more?q=${encodeURIComponent(q)}`),
  importPreview: (file: unknown) => req<{ ok: true; diff: DiffResult }>('POST', '/api/import/preview', file),
  importApply: (file: unknown, mode: 'merge' | 'replace') => req<{ ok: true; backup: string; diff: DiffResult }>('POST', '/api/import/apply', { file, mode }),
  packages: () => req<{ imports: PackageImportRow[]; drive_api: boolean; online: boolean }>('GET', '/api/packages'),
  packagePreview: (src: PackageSourceReq) => req<PackagePreview>('POST', '/api/packages/preview', src),
  packageApply: (src: PackageSourceReq) => req<{ ok: true; backup: string; semester_id: string; files: number; removed_files: number; results: number }>('POST', '/api/packages/apply', src),
  packageResults: (semId: string) => req<CourseResult[]>('GET', `/api/packages/results/${encodeURIComponent(semId)}`),
  backups: () => req<BackupInfo[]>('GET', '/api/backups'),
  backupNow: () => req<BackupInfo>('POST', '/api/backups'),
  restore: (name: string) => req<{ ok: boolean; safety_backup: string }>('POST', '/api/backups/restore', { name }),
  info: () => req<Info>('GET', '/api/info'),
};

export type { Semester };
