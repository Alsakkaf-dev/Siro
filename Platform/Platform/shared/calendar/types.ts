/** أنواع الجدول (CAL) — الأوقات wall بتوقيت Asia/Kuala_Lumpur كنص 'YYYY-MM-DDTHH:mm'. */
export type EventKind = 'sleep' | 'lecture' | 'prayer' | 'meal' | 'free' | 'study' | 'workout' | 'routine' | 'other';
export type SourceId = 'import' | 'routine' | 'graph';

export interface CalEvent {
  id: string;
  source: SourceId;
  calendar: string;
  title: string;
  start: string;
  end: string;
  show_as: 'busy' | 'free';
  categories: string[];
  description: string;
  /** معرّف السلسلة إن كان الحدث من سلسلة متكررة (CAL-15) */
  series: string | null;
  /** يحدده المصدر إن عرفه (مثل خريطة الروتين) وإلا يُستنتج */
  kind?: EventKind;
}

/** CAL-14: التقويم الافتراضي ممنوع الإنشاء فيه */
export const DEFAULT_CAL_NAME = 'Calendar';
/** أسماء التقويم الافتراضي كما يظهر في Outlook بالإنجليزية والعربية */
export const DEFAULT_CAL_NAMES: readonly string[] = ['Calendar', 'التقويم', 'التقويم الافتراضي'];
export const USED_CALENDARS = ['دراسة', 'صلاة', 'روتين وصحة', 'وقت فراغ', 'مال وفواتير', 'عام'] as const;
/** CAL-12 */
export const MIN_EVENT_MIN = 20;
/** CAL-11: فراغ ≤ 19 يُضاف للجار، ≥ 20 يُغطّى بحدث فراغ */
export const GAP_ABSORB_MAX = 19;
/** CAL-19 */
export const NIGHT_FROM = '21:40';
export const NIGHT_TO = '05:10';
export const TERM_WINDOW = Object.freeze({ from: '2026-10-23', to: '2027-02-07' });
export const MAX_RANGE_DAYS = 62;

export interface Overlap { date: string; a: string; b: string; a_title: string; b_title: string; start: string; end: string; minutes: number }
export interface Gap { date: string; start: string; end: string; minutes: number; before: string | null; after: string | null; /** ≤19 أم ≥20 */ action: 'absorb' | 'free_event' }
export interface ShortEvent { id: string; title: string; start: string; end: string; minutes: number }
export interface Cal18 {
  from: string;
  to: string;
  overlaps: Overlap[];
  gaps: Gap[];
  short: ShortEvent[];
  default_calendar: { id: string; title: string }[];
  night: { id: string; title: string; start: string; end: string }[];
  days_checked: number;
  ok: boolean;
}
