/** نواة «مساحاتي» (Work-OS): أنواع عناصر يعرّفها المستخدم، حقول مخصّصة، حالات، عروض، روابط، أتمتة.
 *  مشترك بين الخادم والواجهة. القيم تُحفظ في عمود JSON (انظر docs/adr/0004). */
import { z } from 'zod';

export const DEFAULT_WORKSPACE = 'default';

/* ───────── الحقول ───────── */
export const FIELD_KINDS = ['text', 'longtext', 'number', 'currency', 'date', 'daterange', 'status', 'select', 'multiselect', 'checkbox', 'rating', 'progress', 'url', 'library', 'relation', 'rollup', 'formula'] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export const FIELD_KIND_LABEL: Record<FieldKind, string> = {
  text: 'نص',
  longtext: 'نص طويل',
  number: 'رقم',
  currency: 'مبلغ',
  date: 'تاريخ',
  daterange: 'مدة (من – إلى)',
  status: 'حالة',
  select: 'اختيار واحد',
  multiselect: 'اختيارات متعددة',
  checkbox: 'مربع اختيار',
  rating: 'تقييم (نجوم)',
  progress: 'نسبة إنجاز',
  url: 'رابط',
  library: 'ملف من المكتبة',
  relation: 'ربط بعناصر',
  rollup: 'تجميع',
  formula: 'معادلة',
};

/** حقول محسوبة لا تُكتب يدويًا */
export const COMPUTED_KINDS: ReadonlySet<FieldKind> = new Set(['rollup', 'formula', 'relation']);

export interface FieldOption { id: string; name: string; color?: string }
export interface RollupSpec { source: 'children' | 'relation'; field: string | null; agg: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'percent_done' }
export interface FieldDef {
  id: string;
  name: string;
  kind: FieldKind;
  options?: FieldOption[];
  formula?: string;
  rollup?: RollupSpec;
  currency?: string;
  required?: boolean;
  hidden?: boolean;
}

/* ───────── الحالات ───────── */
export type StatusCategory = 'todo' | 'active' | 'done' | 'blocked';
export const STATUS_CATEGORY_LABEL: Record<StatusCategory, string> = { todo: 'لم يبدأ', active: 'قيد العمل', done: 'منجز', blocked: 'متوقف' };
export interface StatusDef { id: string; name: string; color: string; category: StatusCategory; next?: string[] }

export const DEFAULT_STATUSES: StatusDef[] = [
  { id: 'todo', name: 'للعمل', color: '#8A92B2', category: 'todo' },
  { id: 'doing', name: 'قيد العمل', color: '#5B45F0', category: 'active' },
  { id: 'done', name: 'منجز', color: '#12703F', category: 'done' },
];

export function statusOf(statuses: StatusDef[], id: string | null): StatusDef | undefined {
  return statuses.find((s) => s.id === id);
}
export function isDoneStatus(statuses: StatusDef[], id: string | null): boolean {
  return statusOf(statuses, id)?.category === 'done';
}
/** هل الانتقال مسموح؟ (قائمة next فارغة = حرية كاملة) */
export function canTransition(statuses: StatusDef[], from: string | null, to: string): boolean {
  if (!statuses.some((s) => s.id === to)) return false;
  if (from === null || from === to) return true;
  const f = statusOf(statuses, from);
  return !f?.next || f.next.length === 0 || f.next.includes(to);
}

/* ───────── الكيانات ───────── */
export interface WosType { id: string; workspace_id: string; name: string; icon: string; color: string; fields: FieldDef[]; statuses: StatusDef[]; created_at: string; updated_at: string }
export interface WosSpace { id: string; workspace_id: string; type_id: string; name: string; icon: string; color: string; description: string | null; sort: number; archived: boolean; created_at: string; updated_at: string; item_count?: number; done_count?: number }
export type FieldValue = string | number | boolean | string[] | { start: string | null; end: string | null } | null;
export interface WosItem {
  id: string;
  workspace_id: string;
  space_id: string;
  parent_id: string | null;
  title: string;
  status: string | null;
  data: Record<string, FieldValue>;
  start: string | null;
  due: string | null;
  sort: number;
  archived: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  /** قيم محسوبة (معادلات/تجميع) — تُضاف عند القراءة */
  computed?: Record<string, FieldValue>;
  child_count?: number;
}
export type ViewKind = 'list' | 'board' | 'table' | 'calendar' | 'timeline' | 'gallery' | 'dashboard';
export const VIEW_KINDS: ViewKind[] = ['list', 'board', 'table', 'calendar', 'timeline', 'gallery', 'dashboard'];
export const VIEW_KIND_LABEL: Record<ViewKind, string> = { list: 'قائمة', board: 'لوحة', table: 'جدول', calendar: 'تقويم', timeline: 'خط زمني', gallery: 'معرض', dashboard: 'لوحة مؤشرات' };
export interface ViewFilter { field: string; op: FilterOp; value?: FieldValue }
export type FilterOp = 'is' | 'is_not' | 'contains' | 'empty' | 'not_empty' | 'lt' | 'gt' | 'before' | 'after' | 'has';
export interface ViewConfig {
  filters?: ViewFilter[];
  sort?: { field: string; dir: 'asc' | 'desc' } | null;
  groupBy?: string | null;
  dateField?: string | null;
  columns?: string[];
  widgets?: DashWidget[];
  showDone?: boolean;
}
export interface DashWidget { id: string; kind: 'total' | 'by_status' | 'progress' | 'sum' | 'avg' | 'upcoming' | 'by_field'; field?: string; title?: string }
export interface WosView { id: string; workspace_id: string; scope: string; name: string; kind: ViewKind; config: ViewConfig; sort: number; created_at: string; updated_at: string }

export const RELATION_KINDS = ['relates', 'blocks', 'blocked_by', 'belongs_to', 'contains', 'derived_from', 'attachment_of'] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];
export const RELATION_LABEL: Record<RelationKind, string> = { relates: 'مرتبط بـ', blocks: 'يعيق', blocked_by: 'متوقف على', belongs_to: 'يتبع', contains: 'يحتوي', derived_from: 'مشتق من', attachment_of: 'مرفق لـ' };
export const RELATION_INVERSE: Record<RelationKind, RelationKind> = { relates: 'relates', blocks: 'blocked_by', blocked_by: 'blocks', belongs_to: 'contains', contains: 'belongs_to', derived_from: 'derived_from', attachment_of: 'attachment_of' };
export interface WosRelation { id: string; src: string; dst: string; kind: RelationKind; created_at: string }
/** طرف ربط محلول للعرض */
export interface RefInfo { ref: string; title: string; subtitle?: string; to: string | null; kind: string; color?: string; icon?: string; readonly?: boolean; missing?: boolean }
export interface LinkView { id: string; kind: RelationKind; label: string; other: RefInfo; direction: 'out' | 'in' }

export interface HistoryEntry { id: string; ref: string; action: string; summary: string; actor: string; at: string; revertible: boolean; reverted: boolean; title?: string; to?: string | null }
export interface TrashEntry { token: string; label: string; kind: string; deleted_at: string; expires_at: string; restored_at: string | null }
export interface InboxEntry { id: string; ref: string | null; title: string; body: string | null; source: string; read: boolean; at: string; to?: string | null }

/* ───────── الأتمتة ───────── */
export type TriggerKind = 'item_created' | 'status_changed' | 'field_changed' | 'due_soon';
export type ActionKind = 'set_status' | 'set_field' | 'notify' | 'create_next' | 'archive';
export interface Trigger { kind: TriggerKind; to?: string | null; field?: string | null; days?: number | null }
export interface Action { kind: ActionKind; status?: string | null; field?: string | null; value?: FieldValue; text?: string | null; every?: 'day' | 'week' | 'month' | null }
export interface Automation { id: string; workspace_id: string; space_id: string; name: string; enabled: boolean; trigger: Trigger; action: Action; runs: number; last_run: string | null; created_at: string }
export const TRIGGER_LABEL: Record<TriggerKind, string> = { item_created: 'عند إنشاء عنصر', status_changed: 'عند تغيّر الحالة', field_changed: 'عند تغيّر حقل', due_soon: 'عند اقتراب الموعد' };
export const ACTION_LABEL: Record<ActionKind, string> = { set_status: 'غيّر الحالة إلى', set_field: 'اضبط الحقل', notify: 'أرسل تنبيهًا إلى الوارد', create_next: 'أنشئ النسخة التالية (تكرار)', archive: 'أرشف العنصر' };

/** وصف القاعدة بجملة عربية: «عندما … ثم …» */
export function describeAutomation(a: Pick<Automation, 'trigger' | 'action'>, type?: Pick<WosType, 'fields' | 'statuses'>): string {
  const st = (id: string | null | undefined): string => (id ? type?.statuses.find((s) => s.id === id)?.name ?? id : 'أي حالة');
  const fl = (id: string | null | undefined): string => (id ? type?.fields.find((f) => f.id === id)?.name ?? id : 'أي حقل');
  const t = a.trigger;
  const when =
    t.kind === 'item_created' ? 'عندما يُنشأ عنصر'
    : t.kind === 'status_changed' ? `عندما تصبح الحالة «${st(t.to)}»`
    : t.kind === 'field_changed' ? `عندما يتغيّر «${fl(t.field)}»`
    : `عندما يبقى ${t.days ?? 1} يوم على الموعد`;
  const x = a.action;
  const then =
    x.kind === 'set_status' ? `غيّر الحالة إلى «${st(x.status)}»`
    : x.kind === 'set_field' ? `اضبط «${fl(x.field)}» = ${x.value === 'today' ? 'اليوم' : x.value === 'now' ? 'الآن' : JSON.stringify(x.value)}`
    : x.kind === 'notify' ? `نبّهني: «${x.text ?? ''}»`
    : x.kind === 'create_next' ? `أنشئ نسخة جديدة بعد ${x.every === 'day' ? 'يوم' : x.every === 'month' ? 'شهر' : 'أسبوع'}`
    : 'أرشف العنصر';
  return `${when} ← ${then}`;
}

/* ───────── التحقق (zod) ───────── */
const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'معرّف غير صالح');
const name = (max = 120) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string('الاسم مطلوب').min(1, 'الاسم مطلوب').max(max, `الحد الأقصى ${max} حرفًا`));
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صالح');
const icon = z.string().regex(/^[a-z0-9-]{1,30}$/, 'أيقونة غير صالحة');
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صالح (YYYY-MM-DD)');

export const fieldOptionSchema = z.object({ id, name: name(60), color: color.optional() });
export const fieldDefSchema = z.object({
  id,
  name: name(60),
  kind: z.enum(FIELD_KINDS),
  options: z.array(fieldOptionSchema).max(50).optional(),
  formula: z.string().max(500).optional(),
  rollup: z.object({ source: z.enum(['children', 'relation']), field: z.string().max(40).nullable(), agg: z.enum(['count', 'sum', 'avg', 'min', 'max', 'percent_done']) }).optional(),
  currency: z.string().max(8).optional(),
  required: z.boolean().optional(),
  hidden: z.boolean().optional(),
});
export const statusDefSchema = z.object({ id, name: name(40), color, category: z.enum(['todo', 'active', 'done', 'blocked']), next: z.array(id).max(30).optional() });

export const typeSchema = z
  .object({
    name: name(60),
    icon: icon.default('layers'),
    color: color.default('#5B45F0'),
    fields: z.array(fieldDefSchema).max(40).default([]),
    statuses: z.array(statusDefSchema).min(1, 'حالة واحدة على الأقل').max(20).default(DEFAULT_STATUSES),
  })
  .superRefine((v, ctx) => {
    const f = new Set<string>();
    for (const x of v.fields) {
      if (f.has(x.id)) ctx.addIssue({ code: 'custom', path: ['fields'], message: `حقل مكرر: ${x.id}` });
      f.add(x.id);
      if (x.kind === 'formula' && !x.formula) ctx.addIssue({ code: 'custom', path: ['fields'], message: `المعادلة مطلوبة للحقل «${x.name}»` });
      if (x.kind === 'rollup' && !x.rollup) ctx.addIssue({ code: 'custom', path: ['fields'], message: `إعداد التجميع مطلوب للحقل «${x.name}»` });
    }
    const s = new Set(v.statuses.map((x) => x.id));
    if (s.size !== v.statuses.length) ctx.addIssue({ code: 'custom', path: ['statuses'], message: 'حالات مكررة' });
    for (const x of v.statuses) for (const n of x.next ?? []) if (!s.has(n)) ctx.addIssue({ code: 'custom', path: ['statuses'], message: `انتقال إلى حالة غير موجودة: ${n}` });
  });
export type TypeInput = z.infer<typeof typeSchema>;

export const spaceSchema = z.object({
  name: name(80),
  icon: icon.default('layers'),
  color: color.default('#5B45F0'),
  description: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().max(1000).nullable()).default(null),
  type_id: id.optional(),
  type: typeSchema.optional(),
});

export const itemSchema = z.object({
  title: name(300),
  status: z.string().max(40).nullable().optional(),
  parent_id: id.nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  start: isoDay.nullable().optional(),
  due: isoDay.nullable().optional(),
  sort: z.number().int().optional(),
});
export const itemPatchSchema = itemSchema.partial().extend({ archived: z.boolean().optional(), space_id: id.optional() });

export const viewSchema = z.object({
  name: name(60),
  kind: z.enum(VIEW_KINDS as [ViewKind, ...ViewKind[]]),
  config: z
    .object({
      filters: z.array(z.object({ field: z.string().max(40), op: z.enum(['is', 'is_not', 'contains', 'empty', 'not_empty', 'lt', 'gt', 'before', 'after', 'has']), value: z.unknown().optional() })).max(20).optional(),
      sort: z.object({ field: z.string().max(40), dir: z.enum(['asc', 'desc']) }).nullable().optional(),
      groupBy: z.string().max(40).nullable().optional(),
      dateField: z.string().max(40).nullable().optional(),
      columns: z.array(z.string().max(40)).max(40).optional(),
      widgets: z.array(z.object({ id, kind: z.enum(['total', 'by_status', 'progress', 'sum', 'avg', 'upcoming', 'by_field']), field: z.string().max(40).optional(), title: z.string().max(60).optional() })).max(12).optional(),
      showDone: z.boolean().optional(),
    })
    .default({}),
});

export const automationSchema = z.object({
  name: name(80),
  enabled: z.boolean().default(true),
  trigger: z.object({ kind: z.enum(['item_created', 'status_changed', 'field_changed', 'due_soon']), to: z.string().max(40).nullable().optional(), field: z.string().max(40).nullable().optional(), days: z.number().int().min(0).max(60).nullable().optional() }),
  action: z.object({ kind: z.enum(['set_status', 'set_field', 'notify', 'create_next', 'archive']), status: z.string().max(40).nullable().optional(), field: z.string().max(40).nullable().optional(), value: z.unknown().optional(), text: z.string().max(200).nullable().optional(), every: z.enum(['day', 'week', 'month']).nullable().optional() }),
});

export const relationSchema = z.object({ src: z.string().min(3).max(80), dst: z.string().min(3).max(80), kind: z.enum(RELATION_KINDS).default('relates') });

/* ───────── أدوات القيم ───────── */
export function coerceValue(f: FieldDef, v: unknown): FieldValue {
  if (v === undefined || v === null || v === '') return null;
  switch (f.kind) {
    case 'number':
    case 'currency':
    case 'rating':
    case 'progress': {
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n)) throw new Error(`«${f.name}»: رقم غير صالح`);
      if (f.kind === 'rating') return Math.max(0, Math.min(5, Math.round(n)));
      if (f.kind === 'progress') return Math.max(0, Math.min(100, n));
      return n;
    }
    case 'checkbox':
      return v === true || v === 'true' || v === 1;
    case 'date':
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`«${f.name}»: تاريخ غير صالح`);
      return v;
    case 'daterange': {
      const o = v as { start?: unknown; end?: unknown };
      const ok = (x: unknown): string | null => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);
      return { start: ok(o.start), end: ok(o.end) };
    }
    case 'select':
    case 'status': {
      const s = String(v);
      if (f.kind === 'select' && f.options && !f.options.some((o) => o.id === s)) throw new Error(`«${f.name}»: خيار غير معروف`);
      return s;
    }
    case 'multiselect': {
      const arr = Array.isArray(v) ? v.map(String) : [String(v)];
      if (f.options) for (const s of arr) if (!f.options.some((o) => o.id === s)) throw new Error(`«${f.name}»: خيار غير معروف`);
      return [...new Set(arr)];
    }
    case 'url': {
      const s = String(v).trim().slice(0, 2000);
      if (!/^https?:\/\//i.test(s)) throw new Error(`«${f.name}»: الرابط يجب أن يبدأ بـ http`);
      return s;
    }
    case 'rollup':
    case 'formula':
    case 'relation':
      return null;
    default:
      return String(v).slice(0, f.kind === 'longtext' ? 20000 : 1000);
  }
}

/** نص القيمة للعرض/البحث/CSV */
export function valueText(f: FieldDef | undefined, v: FieldValue | undefined): string {
  if (v === null || v === undefined) return '';
  if (!f) return typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (f.kind === 'select') return f.options?.find((o) => o.id === v)?.name ?? String(v);
  if (f.kind === 'multiselect' && Array.isArray(v)) return v.map((x) => f.options?.find((o) => o.id === x)?.name ?? x).join('، ');
  if (f.kind === 'checkbox') return v ? 'نعم' : 'لا';
  if (f.kind === 'daterange' && typeof v === 'object' && !Array.isArray(v)) return `${v.start ?? '؟'} – ${v.end ?? '؟'}`;
  if (f.kind === 'progress') return `${v}%`;
  if (f.kind === 'currency') return `${f.currency ?? 'RM'} ${v}`;
  if (f.kind === 'rating') return '★'.repeat(Number(v)) || '0';
  return String(v);
}

/** معرّف قصير آمن للحقول/الخيارات من الاسم */
export function slugId(s: string, taken: Iterable<string> = []): string {
  const used = new Set(taken);
  let base = s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
  if (!base) base = 'f';
  let out = base;
  let i = 2;
  while (used.has(out)) out = `${base}_${i++}`;
  return out;
}

/** تطابق مرشّح عرض على عنصر */
export function matchFilter(item: WosItem, f: ViewFilter, type: Pick<WosType, 'fields' | 'statuses'>): boolean {
  const raw: FieldValue | undefined =
    f.field === 'title' ? item.title : f.field === 'status' ? item.status : f.field === 'due' ? item.due : f.field === 'start' ? item.start : (item.computed?.[f.field] ?? item.data[f.field]);
  const v = raw ?? null;
  const empty = v === null || v === '' || (Array.isArray(v) && v.length === 0);
  switch (f.op) {
    case 'empty':
      return empty;
    case 'not_empty':
      return !empty;
    case 'is':
      return Array.isArray(v) ? v.includes(String(f.value)) : String(v ?? '') === String(f.value ?? '');
    case 'is_not':
      return Array.isArray(v) ? !v.includes(String(f.value)) : String(v ?? '') !== String(f.value ?? '');
    case 'has':
      return Array.isArray(v) && v.includes(String(f.value));
    case 'contains': {
      const fd = type.fields.find((x) => x.id === f.field);
      return valueText(fd, v).toLowerCase().includes(String(f.value ?? '').toLowerCase());
    }
    case 'lt':
      return !empty && Number(v) < Number(f.value);
    case 'gt':
      return !empty && Number(v) > Number(f.value);
    case 'before':
      return !empty && String(v) < String(f.value);
    case 'after':
      return !empty && String(v) > String(f.value);
    default:
      return true;
  }
}

export function sortItems(items: WosItem[], sort: ViewConfig['sort'], type: Pick<WosType, 'fields' | 'statuses'>): WosItem[] {
  if (!sort) return [...items].sort((a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at));
  const key = (i: WosItem): string | number | null => {
    if (sort.field === 'title') return i.title;
    if (sort.field === 'status') return type.statuses.findIndex((s) => s.id === i.status);
    if (sort.field === 'due' || sort.field === 'start' || sort.field === 'created_at' || sort.field === 'updated_at') return i[sort.field];
    const v = i.computed?.[sort.field] ?? i.data[sort.field];
    if (v === null || v === undefined) return null;
    return typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : Array.isArray(v) ? v.join(',') : typeof v === 'object' ? (v.start ?? '') : v;
  };
  const dir = sort.dir === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ar')) * dir;
  });
}
