/** سجل واحد لكل صور الهوية في web/public (الأسماء ثابتة؛ غيّر الملف لا المسار). */
import type { IconName } from '../lib/icons.js';

export const BRAND = {
  logo: '/brand/logo.svg',
  logoDark: '/brand/logo-dark.svg',
  mark: '/brand/logo-mark.svg',
  og: '/brand/og-cover.png',
  appleTouch: '/apple-touch-icon.png',
} as const;

export const AVATARS = {
  owner: '/img/avatars/avatar-owner.jpg',
  default: '/img/avatars/avatar-default.svg',
  defaultDark: '/img/avatars/avatar-default-dark.svg',
} as const;

export type CoverKey =
  | 'home' | 'study' | 'library' | 'life' | 'sports' | 'kitchen' | 'spaces' | 'system'
  | 'calendar' | 'finance' | 'prayers' | 'habits' | 'routine' | 'body' | 'review' | 'inbox' | 'youtube';
export const cover = (k: CoverKey): string => `/img/covers/cover-${k}.webp`;

export type EmptyKey = 'inbox' | 'tasks' | 'library' | 'search' | 'finance' | 'habits' | 'workouts' | 'recipes' | 'trash' | 'calendar';
export const emptyArt = (k: EmptyKey): string => `/img/empty/empty-${k}.svg`;

export type StatusKey = 'offline' | 'error-404' | 'error-500' | 'success' | 'welcome';
export const statusArt = (k: StatusKey): string => `/img/status/${k}.svg`;

export type GreetingKey = 'morning' | 'afternoon' | 'evening' | 'night';
export const greeting = (k: GreetingKey): string => `/img/greetings/greeting-${k}.webp`;
/** صورة الترحيب حسب الساعة المحلية. */
export function greetingFor(hour: number): string {
  if (hour >= 4 && hour < 11) return greeting('morning');
  if (hour >= 11 && hour < 16) return greeting('afternoon');
  if (hour >= 16 && hour < 19) return greeting('evening');
  return greeting('night');
}

export const PLACEHOLDERS = {
  subject: '/img/placeholders/subject-placeholder.webp',
  exercise: '/img/placeholders/exercise-placeholder.webp',
  meal: '/img/placeholders/meal-placeholder.webp',
  pdf: '/img/placeholders/file-thumb-pdf.svg',
  doc: '/img/placeholders/file-thumb-doc.svg',
  video: '/img/placeholders/file-thumb-video.svg',
} as const;

/** رسم الحالة الفارغة المناسب لأيقونة EmptyState (إن وُجد). */
const EMPTY_BY_ICON: Partial<Record<IconName, EmptyKey>> = {
  calendar: 'calendar', search: 'search', filter: 'search', list: 'tasks', check: 'tasks',
  book: 'library', library: 'library', dumbbell: 'workouts', utensils: 'recipes', trash: 'trash',
  mail: 'inbox', bell: 'inbox',
};
export const emptyArtForIcon = (icon: IconName): string | undefined => {
  const k = EMPTY_BY_ICON[icon];
  return k ? emptyArt(k) : undefined;
};
