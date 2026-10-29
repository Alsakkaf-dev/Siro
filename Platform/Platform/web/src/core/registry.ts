/**
 * سجل التنقل الواحد: كل صفحة وقسم وتحويل يُعرَّف هنا مرة واحدة، ومنه تُشتق القائمة الجانبية والشريط السفلي
 * ولوحة الأوامر والاختصارات وفتات الخبز والعناوين وتبويبات PageHead. TS صرف بلا JSX ليُختبر في vitest (node).
 * إضافة صفحة = سطر هنا + <Route> في App.tsx (يتحقق منه tests/registry.test.ts).
 */
import type { IconName } from '../lib/icons.js';

export type AreaId = 'home' | 'study' | 'library' | 'life' | 'body' | 'kitchen' | 'system';
export type FlagName = 'kitchen.enabled' | 'kitchen.3d' | 'kitchen.apis.extended' | 'calendar.outlook.read' | 'calendar.outlook.proposals';

export interface AreaDef {
  id: AreaId;
  label: string;
  icon: IconName;
  /** معرّف صفحة الدخول للقسم */
  entry: string;
  /** g ثم هذا الرقم */
  kbd: string;
  /** يظهر في الشريط السفلي للجوال */
  mobile: boolean;
  /** مخفي من التنقل حتى يُفعَّل العلم */
  flag?: FlagName;
}

export interface PageDef {
  id: string;
  /** نمط المسار المطلق بمعاملات :name */
  path: string;
  label: string;
  /** تسمية التبويب إن اختلفت عن تسمية الصفحة */
  tabLabel?: string;
  area: AreaId;
  /** الأب في فتات الخبز (والقائمة إن كانت الصفحة مخفية) */
  parent?: string;
  icon: IconName;
  /** حرف بعد g (اختصار تاريخي) */
  kbd?: string;
  keywords?: string;
  surface: 'sidebar' | 'tab' | 'hidden';
  tabGroup?: string;
  /** المسار يحتاج فصلًا (:semId) */
  needsSemester?: boolean;
  /** اسم ملف المقطع الكسول (= اسم ملف الصفحة)، أو null إن كانت ضمن الحزمة الرئيسية */
  chunk: string | null;
  flag?: FlagName;
}

export const APP_TITLE = 'المنصة الشخصية';

export const AREAS: readonly AreaDef[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home', entry: 'today', kbd: '1', mobile: true },
  { id: 'study', label: 'الدراسة', icon: 'calendar', entry: 'dashboard', kbd: '2', mobile: true },
  { id: 'library', label: 'المكتبة', icon: 'library', entry: 'library', kbd: '3', mobile: true },
  { id: 'life', label: 'الحياة', icon: 'heart', entry: 'life', kbd: '4', mobile: true },
  { id: 'body', label: 'الجسم والرياضة', icon: 'dumbbell', entry: 'sports-mine', kbd: '5', mobile: false },
  { id: 'kitchen', label: 'المطبخ', icon: 'utensils', entry: 'kitchen', kbd: '6', mobile: false, flag: 'kitchen.enabled' },
  { id: 'system', label: 'النظام', icon: 'sliders', entry: 'settings', kbd: '7', mobile: false },
];

const S = '/academic/s/:semId';
export const PAGES: readonly PageDef[] = [
  // الرئيسية
  { id: 'today', path: '/', label: 'اليوم', area: 'home', icon: 'sparkle', kbd: 'h', keywords: 'today home اليوم الرئيسية', surface: 'sidebar', chunk: 'Today' },
  { id: 'review', path: '/review', label: 'مراجعة الأسبوع', area: 'home', icon: 'list', kbd: 'r', keywords: 'weekly review المراجعة الأسبوعية', surface: 'sidebar', chunk: 'Review' },
  // الدراسة
  { id: 'dashboard', path: S, label: 'لوحة الفصل', area: 'study', icon: 'grid', kbd: 'd', keywords: 'dashboard semester لوحة', surface: 'sidebar', needsSemester: true, chunk: null },
  { id: 'courses', path: `${S}/courses`, label: 'المواد', area: 'study', icon: 'book', kbd: 'c', keywords: 'courses subjects مواد', surface: 'sidebar', needsSemester: true, chunk: 'Courses' },
  { id: 'course', path: `${S}/courses/:courseId`, label: 'المادة', area: 'study', parent: 'courses', icon: 'book', surface: 'hidden', needsSemester: true, chunk: 'CoursePage' },
  { id: 'timeline', path: `${S}/timeline`, label: 'التقييمات والمواعيد', area: 'study', icon: 'clock', kbd: 't', keywords: 'timeline assessments deadlines weights gantt مواعيد تقييمات جدول زمني أوزان جانت قائمة', surface: 'sidebar', needsSemester: true, chunk: 'Timeline' },
  { id: 'calculator', path: `${S}/calculator`, label: 'حاسبة الدرجات', area: 'study', icon: 'calc', kbd: 'k', keywords: 'calculator grades gpa درجات', surface: 'sidebar', needsSemester: true, chunk: 'Calculator' },
  { id: 'unknowns', path: `${S}/unknowns`, label: 'غير المعروف', area: 'study', icon: 'help', kbd: 'u', keywords: 'unknowns missing ناقص', surface: 'sidebar', needsSemester: true, chunk: 'Unknowns' },
  { id: 'print', path: `${S}/print`, label: 'ملخص الفصل للطباعة', area: 'study', parent: 'dashboard', icon: 'print', keywords: 'print طباعة', surface: 'hidden', needsSemester: true, chunk: 'PrintSummary' },
  { id: 'semesters', path: '/academic', label: 'مدير الفصول', area: 'study', icon: 'layers', kbd: 's', keywords: 'semesters مدير الفصول', surface: 'sidebar', chunk: 'Semesters' },
  // المكتبة
  { id: 'library', path: '/library', label: 'المكتبة', tabLabel: 'الكل', area: 'library', icon: 'library', keywords: 'library pdf files ملفات', surface: 'sidebar', tabGroup: 'library', chunk: 'Library' },
  { id: 'library-folders', path: '/library/folders', label: 'المجلدات', area: 'library', parent: 'library', icon: 'folder', keywords: 'folders مجلدات', surface: 'tab', tabGroup: 'library', chunk: 'LibraryFolders' },
  { id: 'library-youtube', path: '/library/youtube', label: 'YouTube', area: 'library', parent: 'library', icon: 'play', keywords: 'youtube videos فيديو', surface: 'tab', tabGroup: 'library', chunk: 'LibraryYoutube' },
  { id: 'library-file', path: '/library/f/:id', label: 'ملف', area: 'library', parent: 'library', icon: 'file', surface: 'hidden', chunk: 'LibraryItem' },
  { id: 'library-video', path: '/library/y/:id', label: 'فيديو', area: 'library', parent: 'library-youtube', icon: 'video', surface: 'hidden', chunk: 'LibraryItem' },
  // الحياة
  { id: 'life', path: '/life', label: 'نظرة عامة', area: 'life', icon: 'heart', keywords: 'life dashboard الحياة', surface: 'sidebar', chunk: 'Life' },
  { id: 'life-finance', path: '/life/finance', label: 'المال', tabLabel: 'نظرة', area: 'life', icon: 'database', keywords: 'finance money spending مصروف فلوس مالية', surface: 'sidebar', tabGroup: 'finance', chunk: 'LifeFinance' },
  { id: 'life-insights', path: '/life/insights', label: 'مؤشرات المال', tabLabel: 'المؤشرات', area: 'life', parent: 'life-finance', icon: 'chart', keywords: 'insights مؤشرات متوسط الصرف', surface: 'tab', tabGroup: 'finance', chunk: 'LifeInsights' },
  { id: 'life-ledger', path: '/life/ledger', label: 'السجل المالي الكامل', tabLabel: 'السجل', area: 'life', parent: 'life-finance', icon: 'list', keywords: 'ledger سجل مصروفات', surface: 'tab', tabGroup: 'finance', chunk: 'LifeLedger' },
  { id: 'life-prayers', path: '/life/prayers', label: 'الصلاة', tabLabel: 'الحالة', area: 'life', icon: 'moon', keywords: 'prayers qada صلاة', surface: 'sidebar', tabGroup: 'prayers', chunk: 'LifePrayers' },
  { id: 'life-qada', path: '/life/qada-plan', label: 'خطة القضاء', area: 'life', parent: 'life-prayers', icon: 'target', keywords: 'qada plan قضاء سيناريو', surface: 'tab', tabGroup: 'prayers', chunk: 'LifeQadaPlan' },
  { id: 'life-habits', path: '/life/habits', label: 'العادات', area: 'life', icon: 'check', keywords: 'habits vape sugar تدخين سكر', surface: 'sidebar', tabGroup: 'habits', chunk: 'LifeHabits' },
  { id: 'life-alternatives', path: '/life/alternatives', label: 'بدائل العادات', tabLabel: 'البدائل', area: 'life', parent: 'life-habits', icon: 'zap', keywords: 'alternatives اشتهاء بدائل', surface: 'tab', tabGroup: 'habits', chunk: 'LifeAlternatives' },
  { id: 'life-routine', path: '/life/routine', label: 'الروتين', tabLabel: 'اليوم', area: 'life', icon: 'timer', keywords: 'routine schedule روتين', surface: 'sidebar', tabGroup: 'routine', chunk: 'LifeRoutine' },
  { id: 'life-routine-map', path: '/life/routine-map', label: 'خريطة الروتين الأسبوعي', tabLabel: 'الأسبوع', area: 'life', parent: 'life-routine', icon: 'calendar', keywords: 'routine map كتل الأسبوع', surface: 'tab', tabGroup: 'routine', chunk: 'LifeRoutineMap' },
  { id: 'life-commands', path: '/life/commands', label: 'طلبات التسجيل', area: 'life', icon: 'mail', keywords: 'commands drafts أوامر مسودات راشد تسجيل', surface: 'sidebar', chunk: 'LifeCommands' },
  // الجسم والرياضة
  { id: 'body', path: '/life/body', label: 'الجسم والوزن', area: 'body', icon: 'target', keywords: 'body weight وزن جسم', surface: 'sidebar', chunk: 'LifeBody' },
  { id: 'sports-mine', path: '/sports/mine', label: 'تمريني', area: 'body', icon: 'check', keywords: 'my workouts تماريني تمريني', surface: 'sidebar', tabGroup: 'sports', chunk: 'SportsMine' },
  { id: 'sports', path: '/sports', label: 'مكتبة التمارين', tabLabel: 'المكتبة', area: 'body', icon: 'dumbbell', keywords: 'sports exercises muscles عضلات تمارين', surface: 'sidebar', tabGroup: 'sports', chunk: 'Sports' },
  { id: 'sports-templates', path: '/sports/templates', label: 'القوالب الأسبوعية', tabLabel: 'القوالب', area: 'body', icon: 'calendar', keywords: 'templates plans قوالب خطط', surface: 'sidebar', tabGroup: 'sports', chunk: 'SportsTemplates' },
  // المطبخ
  { id: 'kitchen', path: '/kitchen', label: 'المطبخ', tabLabel: 'نظرة', area: 'kitchen', icon: 'utensils', keywords: 'kitchen cooking مطبخ طبخ مكونات وجبات', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'Kitchen', flag: 'kitchen.enabled' },
  { id: 'kitchen-store', path: '/kitchen/store', label: 'المتجر', area: 'kitchen', icon: 'board', keywords: 'store shop market متجر تسوق مكونات أسعار بيض', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenStore', flag: 'kitchen.enabled' },
  { id: 'kitchen-item', path: '/kitchen/store/:slug', label: 'منتج', area: 'kitchen', parent: 'kitchen-store', icon: 'board', surface: 'hidden', chunk: 'KitchenStore', flag: 'kitchen.enabled' },
  { id: 'kitchen-cart', path: '/kitchen/cart', label: 'السلة', area: 'kitchen', icon: 'list', keywords: 'cart basket checkout سلة اشتريت مقارنة الأسواق', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenCart', flag: 'kitchen.enabled' },
  { id: 'kitchen-pantry', path: '/kitchen/pantry', label: 'المخزن', area: 'kitchen', icon: 'archive', keywords: 'pantry stock مخزن مخزون', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenPantry', flag: 'kitchen.enabled' },
  { id: 'kitchen-wallet', path: '/kitchen/wallet', label: 'المحفظة', area: 'kitchen', icon: 'database', keywords: 'wallet budget محفظة ميزانية رصيد', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenWallet', flag: 'kitchen.enabled' },
  { id: 'kitchen-prices', path: '/kitchen/prices', label: 'تحديث الأسعار', tabLabel: 'الأسعار', area: 'kitchen', icon: 'tag', keywords: 'prices update audit أسعار تحديث تدقيق تراجع', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenPrices', flag: 'kitchen.enabled' },
  { id: 'kitchen-codex', path: '/kitchen/codex', label: 'قاموس الوجبات', tabLabel: 'القاموس', area: 'kitchen', icon: 'book', keywords: 'codex cards recipes قاموس بطاقات وصفات وجبات', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenCodex', flag: 'kitchen.enabled' },
  { id: 'kitchen-card', path: '/kitchen/codex/:slug', label: 'بطاقة وجبة', area: 'kitchen', parent: 'kitchen-codex', icon: 'book', surface: 'hidden', chunk: 'KitchenCodex', flag: 'kitchen.enabled' },
  { id: 'kitchen-cook', path: '/kitchen/cook', label: 'اطبخ', tabLabel: 'الطبخ', area: 'kitchen', icon: 'utensils', keywords: 'cook stove simulation طبخ محاكاة موقد مطبخ ثلاثي وصفة', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenCook', flag: 'kitchen.enabled' },
  { id: 'kitchen-plan', path: '/kitchen/plan', label: 'خطة اليوم', tabLabel: 'الخطة', area: 'kitchen', icon: 'calendar', keywords: 'plan meals day slots خطة وجبات يوم جدول فطور غداء عشاء', surface: 'sidebar', tabGroup: 'kitchen', chunk: 'KitchenPlan', flag: 'kitchen.enabled' },
  // النظام
  { id: 'settings', path: '/settings', label: 'الإعدادات', area: 'system', icon: 'sliders', kbd: ',', keywords: 'settings backup sources library life rashed folder نسخ احتياطي مظهر مصادر مجلد المكتبة راشد', surface: 'sidebar', chunk: 'Settings' },
  { id: 'glossary', path: '/glossary', label: 'قاموس المصطلحات', area: 'system', icon: 'book', keywords: 'glossary terms قاموس مصطلحات', surface: 'sidebar', chunk: 'Glossary' },
  { id: 'search', path: '/search', label: 'البحث', area: 'system', icon: 'search', keywords: 'search بحث', surface: 'sidebar', chunk: 'SearchPage' },
];

/** روابط قديمة تبقى تعمل (تحتفظ بـ search وhash). لا سلاسل. */
export const REDIRECTS: readonly { from: string; to: string }[] = [
  { from: '/home', to: '/' },
  { from: '/life/glossary', to: '/glossary' },
  { from: '/library/settings', to: '/settings?tab=sources' },
  { from: '/life/settings', to: '/settings?tab=sources' },
  { from: '/academic/s/:semId/weights', to: '/academic/s/:semId/timeline?view=weights' },
];

/** اختصارات g لعروض داخل صفحة (ليست صفحات مستقلة) */
export const KBD_ALIASES: Readonly<Record<string, { page: string; search: string; label: string }>> = {
  w: { page: 'timeline', search: '?view=weights', label: 'خريطة الأوزان' },
};

export const PAGE_BY_ID: ReadonlyMap<string, PageDef> = new Map(PAGES.map((p) => [p.id, p]));
export const AREA_BY_ID: ReadonlyMap<AreaId, AreaDef> = new Map(AREAS.map((a) => [a.id, a]));

/* ───── المطابقة ───── */
interface Compiled { page: PageDef; re: RegExp; keys: string[]; spec: number }
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function compile(path: string): { re: RegExp; keys: string[]; spec: number } {
  const keys: string[] = [];
  const segs = path.split('/').filter(Boolean);
  const body = segs.map((s) => (s.startsWith(':') ? (keys.push(s.slice(1)), '([^/]+)') : esc(s))).join('/');
  // الأكثر تحديدًا: المقاطع الثابتة أثقل من المعاملات
  const spec = segs.reduce((n, s) => n + (s.startsWith(':') ? 1 : 3), 0);
  return { re: new RegExp(`^/${body}/?$`), keys, spec };
}
const COMPILED: Compiled[] = PAGES.map((page) => ({ page, ...compile(page.path) })).sort((a, b) => b.spec - a.spec);

export interface Match { page: PageDef; params: Record<string, string> }
export function matchPage(pathname: string): Match | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const c of COMPILED) {
    const m = c.re.exec(p);
    if (m) return { page: c.page, params: Object.fromEntries(c.keys.map((k, i) => [k, decodeURIComponent(m[i + 1] ?? '')])) };
  }
  return null;
}

/** يملأ معاملات المسار. يرجع null إن نقص معامل. */
export function resolvePath(page: PageDef, params: Record<string, string | null | undefined>): string | null {
  let ok = true;
  const out = page.path.replace(/:([A-Za-z]+)/g, (_m, k: string) => {
    const v = params[k];
    if (!v) ok = false;
    return v ? encodeURIComponent(v) : '';
  });
  return ok ? out : null;
}

/** مسار صفحة بفصل السياق؛ الصفحات التي تحتاج فصلًا بلا فصل → مدير الفصول. */
export function hrefFor(id: string, semId: string | null): string {
  const p = PAGE_BY_ID.get(id);
  if (!p) return '/';
  return resolvePath(p, { semId }) ?? (p.needsSemester ? '/academic' : '/');
}

/** مسار الصفحة نفسها في فصل آخر (تبديل الفصل يحفظ الصفحة): ذات المعاملات الإضافية ترجع لأبيها (المادة → المواد). */
export function sameSubpage(pathname: string, search: string, semId: string): string {
  let page = matchPage(pathname)?.page;
  if (!page?.needsSemester) return `/academic/s/${encodeURIComponent(semId)}`;
  while (page && /:(?!semId\b)[A-Za-z]+/.test(page.path)) page = page.parent ? PAGE_BY_ID.get(page.parent) : undefined;
  const to = page ? resolvePath(page, { semId }) : null;
  return to ? `${to}${search}` : `/academic/s/${encodeURIComponent(semId)}`;
}

/** صفحة الشريط المسؤولة عن الصفحة الحالية (عنصر نشط واحد): نفسها، أو أوّل أب/قائد تبويب في الشريط. */
export function sidebarOwner(page: PageDef): PageDef {
  let cur: PageDef | undefined = page;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    if (cur.surface === 'sidebar') return cur;
    seen.add(cur.id);
    const lead: PageDef | undefined = cur.tabGroup ? PAGES.find((x) => x.tabGroup === cur!.tabGroup && x.surface === 'sidebar') : undefined;
    cur = lead ?? (cur.parent ? PAGE_BY_ID.get(cur.parent) : undefined);
  }
  return PAGE_BY_ID.get(AREA_BY_ID.get(page.area)!.entry)!;
}

export const sidebarPages = (area: AreaId): PageDef[] => PAGES.filter((p) => p.area === area && p.surface === 'sidebar');
export const tabsFor = (page: PageDef): PageDef[] => (page.tabGroup ? PAGES.filter((p) => p.tabGroup === page.tabGroup) : []);

/** سلسلة الفتات: القسم (إن لم تكن الصفحة مدخله) ثم الآباء ثم الصفحة. */
export function crumbsFor(page: PageDef): { id: string; label: string; areaEntry?: boolean }[] {
  const chain: PageDef[] = [];
  const seen = new Set<string>();
  for (let c: PageDef | undefined = page; c && !seen.has(c.id); c = c.parent ? PAGE_BY_ID.get(c.parent) : undefined) {
    seen.add(c.id);
    chain.unshift(c);
  }
  const area = AREA_BY_ID.get(page.area)!;
  const out: { id: string; label: string; areaEntry?: boolean }[] = chain.map((p) => ({ id: p.id, label: p.label }));
  if (chain[0]?.id !== area.entry) out.unshift({ id: area.entry, label: area.label, areaEntry: true });
  return out;
}

/** عنوان التبويب: «تجاوز الصفحة أو تسميتها · القسم · المنصة» بلا تكرار */
export function titleFor(page: PageDef | null, override?: string | null): string {
  if (!page) return `الصفحة غير موجودة · ${APP_TITLE}`;
  const area = AREA_BY_ID.get(page.area)!;
  const head = override?.trim() || page.label;
  return head === area.label ? `${head} · ${APP_TITLE}` : `${head} · ${area.label} · ${APP_TITLE}`;
}

/** خريطة g: أرقام الأقسام + الحروف التاريخية (بـ e.code ليعمل بأي تخطيط لوحة مفاتيح). */
export function gTarget(code: string, ctx: { semId: string | null; enabled: (f: FlagName) => boolean }): string | null {
  const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code)?.[1];
  if (digit) {
    const a = AREAS.find((x) => x.kbd === digit);
    if (!a || (a.flag && !ctx.enabled(a.flag))) return null;
    return hrefFor(a.entry, ctx.semId);
  }
  const ch = code === 'Comma' ? ',' : /^Key([A-Z])$/.exec(code)?.[1]?.toLowerCase();
  if (!ch) return null;
  const alias = KBD_ALIASES[ch];
  if (alias) {
    const to = hrefFor(alias.page, ctx.semId);
    return to === '/academic' ? to : to + alias.search;
  }
  const p = PAGES.find((x) => x.kbd === ch);
  if (!p || (p.flag && !ctx.enabled(p.flag))) return null;
  return hrefFor(p.id, ctx.semId);
}

/** أوامر «+ جديد»: انتقال إلى مسار مع ?new=… (useNewParam يستهلكه). */
export interface NewAction { id: string; label: string; icon: IconName; to: (semId: string | null) => string | null }
export const NEW_ACTIONS: readonly NewAction[] = [
  { id: 'course', label: 'مادة', icon: 'book', to: (s) => (s ? `/academic/s/${s}/courses?new=1` : null) },
  { id: 'assessment', label: 'تقييم', icon: 'list', to: (s) => (s ? `/academic/s/${s}/courses?new=assessment` : null) },
  { id: 'semester', label: 'فصل', icon: 'layers', to: () => '/academic?new=1' },
  { id: 'youtube', label: 'رابط YouTube', icon: 'play', to: () => '/library/youtube?new=1' },
  { id: 'expense', label: 'تسجيل مصروف', icon: 'database', to: () => '/life/commands?type=log_expense' },
  { id: 'prayer', label: 'تسجيل صلاة', icon: 'moon', to: () => '/life/commands?type=log_prayer' },
  { id: 'workout', label: 'تمرين', icon: 'dumbbell', to: () => '/sports/mine?new=1' },
];

/* ───── ترتيب نتائج لوحة الأوامر ───── */
/** تطابق تام 100، بداية 80، بداية كلمة 60، احتواء 40، كلمة مفتاحية 20، وإلا 0. (النص مُطبَّع مسبقًا) */
export function scoreText(nq: string, label: string, keywords = ''): number {
  if (!nq) return 0;
  if (label === nq) return 100;
  if (label.startsWith(nq)) return 80;
  if (label.split(/\s+/).some((w) => w.startsWith(nq))) return 60;
  if (label.includes(nq)) return 40;
  if (keywords.includes(nq)) return 20;
  return 0;
}
