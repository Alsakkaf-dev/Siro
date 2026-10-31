/** قوالب «مساحاتي» الجاهزة. القالب = نوع (حقول + حالات) + مساحة + عروض + أتمتة + عناصر أمثلة.
 *  قوالب المستخدم المحفوظة لها نفس الشكل (جدول wos_templates). */
import type { Action, FieldDef, FieldValue, StatusDef, Trigger, ViewConfig, ViewKind } from './wos.js';

export interface TemplatePayload {
  type: { name: string; icon: string; color: string; fields: FieldDef[]; statuses: StatusDef[] };
  space: { name: string; icon: string; color: string; description: string | null };
  views: { name: string; kind: ViewKind; config: ViewConfig }[];
  automations: { name: string; trigger: Trigger; action: Action }[];
  items: { title: string; status?: string | null; due?: string | null; start?: string | null; data?: Record<string, FieldValue> }[];
}
export interface TemplateInfo { id: string; name: string; description: string; icon: string; color: string; builtin: boolean; payload: TemplatePayload }

const S = (id: string, name: string, color: string, category: StatusDef['category'], next?: string[]): StatusDef => ({ id, name, color, category, ...(next ? { next } : {}) });

export const BUILTIN_TEMPLATES: TemplateInfo[] = [
  {
    id: 'reading-list',
    name: 'قائمة قراءة',
    description: 'كتب ومقالات: الحالة، التقييم، نسبة الإنجاز، رابط أو ملف من المكتبة.',
    icon: 'book',
    color: '#C9A227',
    builtin: true,
    payload: {
      type: {
        name: 'كتاب',
        icon: 'book',
        color: '#C9A227',
        fields: [
          { id: 'author', name: 'المؤلف', kind: 'text' },
          { id: 'kind', name: 'النوع', kind: 'select', options: [{ id: 'book', name: 'كتاب' }, { id: 'article', name: 'مقال' }, { id: 'paper', name: 'ورقة بحثية' }] },
          { id: 'pages', name: 'الصفحات', kind: 'number' },
          { id: 'progress', name: 'الإنجاز', kind: 'progress' },
          { id: 'rating', name: 'تقييمي', kind: 'rating' },
          { id: 'link', name: 'الرابط', kind: 'url' },
          { id: 'file', name: 'ملف المكتبة', kind: 'library' },
          { id: 'finished', name: 'تاريخ الإنهاء', kind: 'date' },
          { id: 'notes', name: 'ملاحظات', kind: 'longtext' },
        ],
        statuses: [S('want', 'أريد قراءته', '#8A92B2', 'todo'), S('reading', 'أقرأ الآن', '#5B45F0', 'active'), S('done', 'انتهيت', '#12703F', 'done'), S('dropped', 'توقفت', '#C23B2A', 'blocked')],
      },
      space: { name: 'قائمة القراءة', icon: 'book', color: '#C9A227', description: 'ما أقرأه وما أريد قراءته.' },
      views: [
        { name: 'لوحة', kind: 'board', config: { groupBy: 'status' } },
        { name: 'جدول', kind: 'table', config: { columns: ['status', 'author', 'progress', 'rating', 'finished'] } },
        { name: 'معرض', kind: 'gallery', config: {} },
      ],
      automations: [
        { name: 'تاريخ الإنهاء تلقائيًا', trigger: { kind: 'status_changed', to: 'done' }, action: { kind: 'set_field', field: 'finished', value: 'today' } },
        { name: 'الإنجاز 100٪ عند الانتهاء', trigger: { kind: 'status_changed', to: 'done' }, action: { kind: 'set_field', field: 'progress', value: 100 } },
      ],
      items: [{ title: 'Clean Code', status: 'want', data: { author: 'Robert C. Martin', kind: 'book', pages: 464 } }],
    },
  },
  {
    id: 'job-applications',
    name: 'طلبات التوظيف / التدريب',
    description: 'تتبّع الشركات والمراحل والمواعيد، مع تنبيه قبل موعد المقابلة.',
    icon: 'target',
    color: '#0369A1',
    builtin: true,
    payload: {
      type: {
        name: 'طلب',
        icon: 'target',
        color: '#0369A1',
        fields: [
          { id: 'company', name: 'الشركة', kind: 'text' },
          { id: 'role', name: 'الوظيفة', kind: 'text' },
          { id: 'kind', name: 'النوع', kind: 'select', options: [{ id: 'intern', name: 'تدريب' }, { id: 'full', name: 'دوام كامل' }, { id: 'part', name: 'دوام جزئي' }] },
          { id: 'link', name: 'رابط الإعلان', kind: 'url' },
          { id: 'salary', name: 'الراتب المتوقع', kind: 'currency', currency: 'RM' },
          { id: 'applied', name: 'تاريخ التقديم', kind: 'date' },
          { id: 'priority', name: 'الأولوية', kind: 'rating' },
          { id: 'notes', name: 'ملاحظات', kind: 'longtext' },
        ],
        statuses: [
          S('wish', 'مهتم', '#8A92B2', 'todo', ['applied']),
          S('applied', 'قدّمت', '#5B45F0', 'active', ['interview', 'rejected']),
          S('interview', 'مقابلة', '#B45309', 'active', ['offer', 'rejected']),
          S('offer', 'عرض', '#12703F', 'done'),
          S('rejected', 'مرفوض', '#C23B2A', 'blocked'),
        ],
      },
      space: { name: 'طلبات التوظيف', icon: 'target', color: '#0369A1', description: 'كل طلب في مرحلته؛ الانتقالات تتبع مسار التقديم.' },
      views: [
        { name: 'المسار', kind: 'board', config: { groupBy: 'status' } },
        { name: 'الجدول', kind: 'table', config: { columns: ['status', 'company', 'role', 'kind', 'applied', 'priority'] } },
        { name: 'المواعيد', kind: 'calendar', config: { dateField: 'due' } },
        { name: 'المؤشرات', kind: 'dashboard', config: { widgets: [{ id: 'w1', kind: 'total' }, { id: 'w2', kind: 'by_status' }, { id: 'w3', kind: 'upcoming' }] } },
      ],
      automations: [
        { name: 'تاريخ التقديم تلقائيًا', trigger: { kind: 'status_changed', to: 'applied' }, action: { kind: 'set_field', field: 'applied', value: 'today' } },
        { name: 'تذكير قبل الموعد بيوم', trigger: { kind: 'due_soon', days: 1 }, action: { kind: 'notify', text: 'موعد قريب لطلب التوظيف' } },
      ],
      items: [],
    },
  },
  {
    id: 'project',
    name: 'مشروع',
    description: 'مهام بمراحل، عناصر فرعية، أولوية، وخط زمني — لمشاريع المواد أو الشخصية.',
    icon: 'layers',
    color: '#5B45F0',
    builtin: true,
    payload: {
      type: {
        name: 'مهمة',
        icon: 'check',
        color: '#5B45F0',
        fields: [
          { id: 'priority', name: 'الأولوية', kind: 'select', options: [{ id: 'high', name: 'عالية', color: '#C23B2A' }, { id: 'mid', name: 'متوسطة', color: '#B45309' }, { id: 'low', name: 'منخفضة', color: '#12703F' }] },
          { id: 'estimate', name: 'التقدير (ساعات)', kind: 'number' },
          { id: 'subdone', name: 'إنجاز الفرعية', kind: 'rollup', rollup: { source: 'children', field: null, agg: 'percent_done' } },
          { id: 'notes', name: 'التفاصيل', kind: 'longtext' },
        ],
        statuses: [S('todo', 'للعمل', '#8A92B2', 'todo'), S('doing', 'قيد العمل', '#5B45F0', 'active'), S('review', 'مراجعة', '#B45309', 'active'), S('done', 'منجز', '#12703F', 'done'), S('blocked', 'متوقف', '#C23B2A', 'blocked')],
      },
      space: { name: 'مشروعي', icon: 'layers', color: '#5B45F0', description: null },
      views: [
        { name: 'لوحة', kind: 'board', config: { groupBy: 'status' } },
        { name: 'قائمة', kind: 'list', config: { groupBy: 'priority' } },
        { name: 'خط زمني', kind: 'timeline', config: {} },
      ],
      automations: [{ name: 'تنبيه قبل الموعد', trigger: { kind: 'due_soon', days: 2 }, action: { kind: 'notify', text: 'مهمة يقترب موعدها' } }],
      items: [],
    },
  },
  {
    id: 'goals',
    name: 'أهداف',
    description: 'أهداف بنتائج قابلة للقياس: القيمة الحالية والمستهدفة ونسبة التقدّم بمعادلة.',
    icon: 'flag',
    color: '#047857',
    builtin: true,
    payload: {
      type: {
        name: 'هدف',
        icon: 'flag',
        color: '#047857',
        fields: [
          { id: 'area', name: 'المجال', kind: 'select', options: [{ id: 'study', name: 'دراسة' }, { id: 'health', name: 'صحة' }, { id: 'money', name: 'مال' }, { id: 'skill', name: 'مهارة' }] },
          { id: 'current', name: 'الحالي', kind: 'number' },
          { id: 'target', name: 'المستهدف', kind: 'number' },
          { id: 'pct', name: 'التقدّم', kind: 'formula', formula: 'if({المستهدف} > 0, round({الحالي} / {المستهدف} * 100, 0), 0)' },
        ],
        statuses: [S('active', 'نشط', '#5B45F0', 'active'), S('done', 'تحقق', '#12703F', 'done'), S('paused', 'متوقف', '#8A92B2', 'blocked')],
      },
      space: { name: 'أهدافي', icon: 'flag', color: '#047857', description: 'التقدّم يُحسب تلقائيًا من الحالي/المستهدف.' },
      views: [
        { name: 'الجدول', kind: 'table', config: { columns: ['status', 'area', 'current', 'target', 'pct'] } },
        { name: 'المؤشرات', kind: 'dashboard', config: { widgets: [{ id: 'w1', kind: 'total' }, { id: 'w2', kind: 'avg', field: 'pct', title: 'متوسط التقدّم' }, { id: 'w3', kind: 'by_field', field: 'area' }] } },
      ],
      automations: [],
      items: [],
    },
  },
  {
    id: 'tasks',
    name: 'مهام',
    description: 'قائمة مهام بسيطة بموعد وتكرار — لالتقاط أي شيء بسرعة.',
    icon: 'check',
    color: '#7C5CFF',
    builtin: true,
    payload: {
      type: {
        name: 'مهمة',
        icon: 'check',
        color: '#7C5CFF',
        fields: [{ id: 'notes', name: 'تفاصيل', kind: 'longtext' }],
        statuses: [S('todo', 'للعمل', '#8A92B2', 'todo'), S('done', 'منجز', '#12703F', 'done')],
      },
      space: { name: 'مهامي', icon: 'check', color: '#7C5CFF', description: 'صندوق الالتقاط السريع من الرئيسية.' },
      views: [
        { name: 'قائمة', kind: 'list', config: {} },
        { name: 'تقويم', kind: 'calendar', config: { dateField: 'due' } },
      ],
      automations: [],
      items: [],
    },
  },
  {
    id: 'course-notes',
    name: 'مذكرات مادة',
    description: 'ملخصات وأسئلة مراجعة لكل محاضرة، مربوطة بملفات المكتبة.',
    icon: 'file',
    color: '#4CC9F0',
    builtin: true,
    payload: {
      type: {
        name: 'مذكرة',
        icon: 'file',
        color: '#0E7490',
        fields: [
          { id: 'week', name: 'الأسبوع', kind: 'number' },
          { id: 'file', name: 'ملف المحاضرة', kind: 'library' },
          { id: 'confidence', name: 'فهمي', kind: 'rating' },
          { id: 'summary', name: 'الملخص', kind: 'longtext' },
        ],
        statuses: [S('todo', 'لم أراجع', '#8A92B2', 'todo'), S('reviewed', 'راجعت', '#12703F', 'done')],
      },
      space: { name: 'مذكرات المادة', icon: 'file', color: '#0E7490', description: null },
      views: [{ name: 'جدول', kind: 'table', config: { sort: { field: 'week', dir: 'asc' }, columns: ['status', 'week', 'confidence', 'file'] } }, { name: 'معرض', kind: 'gallery', config: {} }],
      automations: [],
      items: [],
    },
  },
  {
    id: 'habit-tracker',
    name: 'متتبّع عادة',
    description: 'تسجيل يومي متكرر: عند الإنجاز تُنشأ مهمة الغد تلقائيًا.',
    icon: 'refresh',
    color: '#BE185D',
    builtin: true,
    payload: {
      type: {
        name: 'تسجيل',
        icon: 'refresh',
        color: '#BE185D',
        fields: [{ id: 'note', name: 'ملاحظة', kind: 'text' }, { id: 'mood', name: 'الشعور', kind: 'rating' }],
        statuses: [S('todo', 'لم يتم', '#8A92B2', 'todo'), S('done', 'تم', '#12703F', 'done')],
      },
      space: { name: 'عادتي', icon: 'refresh', color: '#BE185D', description: 'ليست بديلًا عن بيانات راشد — مساحتك الخاصة.' },
      views: [{ name: 'تقويم', kind: 'calendar', config: { dateField: 'due', showDone: true } }, { name: 'قائمة', kind: 'list', config: {} }],
      automations: [{ name: 'تكرار يومي', trigger: { kind: 'status_changed', to: 'done' }, action: { kind: 'create_next', every: 'day' } }],
      items: [],
    },
  },
];

export const BLANK_TEMPLATE: TemplatePayload = {
  type: { name: 'عنصر', icon: 'layers', color: '#5B45F0', fields: [{ id: 'notes', name: 'ملاحظات', kind: 'longtext' }], statuses: [S('todo', 'للعمل', '#8A92B2', 'todo'), S('doing', 'قيد العمل', '#5B45F0', 'active'), S('done', 'منجز', '#12703F', 'done')] },
  space: { name: 'مساحة جديدة', icon: 'layers', color: '#5B45F0', description: null },
  views: [{ name: 'قائمة', kind: 'list', config: {} }, { name: 'لوحة', kind: 'board', config: { groupBy: 'status' } }, { name: 'جدول', kind: 'table', config: {} }],
  automations: [],
  items: [],
};
