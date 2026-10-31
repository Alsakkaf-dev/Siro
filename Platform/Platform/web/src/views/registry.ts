/** سجل العروض الموحّد (ADR-0003): العروض العامة فوق عناصر المساحات + العروض المتخصصة القائمة (صفحاتها كما هي)
 *  مسجّلة كعروض لنفس «المكان» — فيظهر مبدّل عروض واحد متسق أعلى كل صفحة منها. */
import type { IconName } from '../lib/icons.js';
import { VIEW_KINDS, VIEW_KIND_LABEL, type ViewKind } from '../../../shared/wos.js';

export interface RegisteredView {
  id: string;
  label: string;
  icon: IconName;
  kind: 'generic' | 'specialized';
  /** للمتخصص: المسار (قد يعتمد على الفصل الحالي) */
  route?: (c: { semId: string | null }) => string | null;
  /** للمتخصص: هل المسار الحالي هو هذا العرض */
  match?: (path: string) => boolean;
}
export interface ViewPlace { id: string; label: string; views: RegisteredView[] }

const GENERIC_ICON: Record<ViewKind, IconName> = { list: 'list', board: 'board', table: 'table', calendar: 'calendar', timeline: 'timer', gallery: 'image', dashboard: 'chart' };
export const GENERIC_VIEWS: RegisteredView[] = VIEW_KINDS.map((k) => ({ id: k, label: VIEW_KIND_LABEL[k], icon: GENERIC_ICON[k], kind: 'generic' }));

const sem = (sub: string) => (c: { semId: string | null }): string | null => (c.semId ? `/academic/s/${c.semId}${sub}` : null);
const semMatch = (sub: string) => (p: string): boolean => (sub ? new RegExp(`^/academic/s/[^/]+${sub}$`).test(p) : /^\/academic\/s\/[^/]+$/.test(p));
const exact = (to: string): RegisteredView['match'] => (p) => p === to;
const S = (id: string, label: string, icon: IconName, route: RegisteredView['route'], match: RegisteredView['match']): RegisteredView => ({ id, label, icon, kind: 'specialized', route, match });

/** الأماكن وعروضها المتخصصة (لا شيء حُذف — كل صفحة قديمة صارت «عرضًا» في مكانها) */
export const VIEW_PLACES: ViewPlace[] = [
  {
    id: 'semester',
    label: 'عروض الفصل',
    views: [
      S('sem-dashboard', 'لوحة الفصل', 'grid', sem(''), semMatch('')),
      S('sem-courses', 'المواد', 'book', sem('/courses'), semMatch('/courses')),
      S('sem-timeline', 'الجدول الزمني (حرارية/جانت/تشتت/تراكمي)', 'clock', sem('/timeline'), semMatch('/timeline')),
      S('sem-calculator', 'حاسبة الدرجات', 'calc', sem('/calculator'), semMatch('/calculator')),
      S('sem-weights', 'خريطة الأوزان', 'pie', sem('/weights'), semMatch('/weights')),
      S('sem-unknowns', 'غير المعروف', 'help', sem('/unknowns'), semMatch('/unknowns')),
      S('sem-print', 'ملخص للطباعة', 'print', sem('/print'), semMatch('/print')),
    ],
  },
  {
    id: 'library',
    label: 'عروض المكتبة',
    views: [
      S('lib-files', 'الملفات', 'library', () => '/library', exact('/library')),
      S('lib-folders', 'المجلدات', 'folder', () => '/library/folders', exact('/library/folders')),
      S('lib-youtube', 'YouTube', 'play', () => '/library/youtube', exact('/library/youtube')),
    ],
  },
  {
    id: 'finance',
    label: 'عروض المال',
    views: [
      S('fin-overview', 'المال', 'database', () => '/life/finance', exact('/life/finance')),
      S('fin-insights', 'المؤشرات', 'chart', () => '/life/insights', exact('/life/insights')),
      S('fin-ledger', 'السجل الكامل', 'list', () => '/life/ledger', exact('/life/ledger')),
    ],
  },
  {
    id: 'worship',
    label: 'عروض العبادة',
    views: [
      S('pr-attendance', 'الصلاة', 'clock', () => '/life/prayers', exact('/life/prayers')),
      S('pr-qada', 'خطة القضاء', 'target', () => '/life/qada-plan', exact('/life/qada-plan')),
    ],
  },
  {
    id: 'routine',
    label: 'عروض الروتين',
    views: [
      S('rt-today', 'جدول اليوم', 'timer', () => '/life/routine', exact('/life/routine')),
      S('rt-map', 'خريطة الأسبوع', 'calendar', () => '/life/routine-map', exact('/life/routine-map')),
    ],
  },
  {
    id: 'habits',
    label: 'عروض العادات والجسم',
    views: [
      S('hb-habits', 'العادات', 'check', () => '/life/habits', exact('/life/habits')),
      S('hb-alt', 'البدائل', 'zap', () => '/life/alternatives', exact('/life/alternatives')),
      S('hb-body', 'الجسم', 'target', () => '/life/body', exact('/life/body')),
    ],
  },
  {
    id: 'sports',
    label: 'عروض الرياضة',
    views: [
      S('sp-library', 'مكتبة التمارين (خريطة الجسم)', 'dumbbell', () => '/sports', exact('/sports')),
      S('sp-templates', 'القوالب الأسبوعية', 'calendar', () => '/sports/templates', exact('/sports/templates')),
      S('sp-mine', 'تماريني', 'check', () => '/sports/mine', exact('/sports/mine')),
    ],
  },
  {
    id: 'horizons',
    label: 'الآفاق الزمنية',
    views: [
      S('h-today', 'اليوم', 'home', () => '/', exact('/')),
      S('h-week', 'هذا الأسبوع', 'calendar', () => '/week', exact('/week')),
      S('h-all', 'كل شيء', 'list', () => '/everything', exact('/everything')),
    ],
  },
  {
    id: 'review',
    label: 'عروض المراجعة',
    views: [
      S('rv-week', 'مراجعة الأسبوع', 'sparkle', () => '/review', exact('/review')),
      S('rv-progress', 'لوحة التقدّم', 'chart', () => '/review/progress', exact('/review/progress')),
      S('rv-activity', 'سجل النشاط', 'clock', () => '/activity', exact('/activity')),
    ],
  },
];

export function placeOf(path: string): ViewPlace | null {
  return VIEW_PLACES.find((p) => p.views.some((v) => v.match?.(path))) ?? null;
}
