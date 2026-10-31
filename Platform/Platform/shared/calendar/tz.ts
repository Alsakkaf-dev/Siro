/**
 * التوقيت (I18N-04): كل شيء بتوقيت Asia/Kuala_Lumpur عبر Intl (لا إزاحة ثابتة).
 * «الحائطي» wall = نص 'YYYY-MM-DDTHH:mm' بتوقيت KL. دقائقه (wallMin) تُحسب كأنها UTC فتكون الفروق دقيقة (KL بلا توقيت صيفي).
 */
export const TZ = 'Asia/Kuala_Lumpur';

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmtFor(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    fmtCache.set(tz, f);
  }
  return f;
}

/** منطقة معروفة؟ (أسماء ويندوز الشائعة لـ UTC+8 تُحوَّل إلى KL) */
const WIN_TZ: Readonly<Record<string, string>> = {
  'Malay Peninsula Standard Time': 'Asia/Kuala_Lumpur',
  'Singapore Standard Time': 'Asia/Singapore',
  'China Standard Time': 'Asia/Shanghai',
  'UTC': 'UTC',
  'Coordinated Universal Time': 'UTC',
  'GMT Standard Time': 'Europe/London',
  'Arab Standard Time': 'Asia/Riyadh',
  'Arabian Standard Time': 'Asia/Dubai',
  'Egypt Standard Time': 'Africa/Cairo',
};
export function normalizeTz(tz: string | null | undefined): string | null {
  if (!tz) return TZ;
  const t = WIN_TZ[tz] ?? tz;
  try {
    fmtFor(t).format(0);
    return t;
  } catch {
    return null;
  }
}

function parts(ms: number, tz: string): { y: number; mo: number; d: number; h: number; mi: number } {
  const o: Record<string, number> = {};
  for (const p of fmtFor(tz).formatToParts(new Date(ms))) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return { y: o['year']!, mo: o['month']!, d: o['day']!, h: o['hour']!, mi: o['minute']! };
}
const pad = (n: number): string => String(n).padStart(2, '0');

/** UTC ms → wall بتوقيت tz (الافتراضي KL) */
export function msToWall(ms: number, tz: string = TZ): string {
  const p = parts(ms, tz);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}
/** wall بتوقيت tz → UTC ms (تكرارًا لتصحيح الإزاحة) */
export function wallToMs(wall: string, tz: string = TZ): number {
  const naive = wallMin(wall) * 60_000;
  let guess = naive;
  for (let i = 0; i < 2; i++) {
    const p = parts(guess, tz);
    const shown = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
    guess += naive - shown;
  }
  return guess;
}
/** wall منطقة ما → wall KL */
export function convertWall(wall: string, fromTz: string): string {
  return fromTz === TZ ? wall : msToWall(wallToMs(wall, fromTz), TZ);
}

/** دقائق wall منذ 1970 (كأنها UTC) */
export function wallMin(wall: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wall);
  if (!m) return Number.NaN;
  return Math.floor(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!) / 60_000);
}
export function minWall(min: number): string {
  const d = new Date(min * 60_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
export const dateOf = (wall: string): string => wall.slice(0, 10);
export const timeOf = (wall: string): string => wall.slice(11, 16);
export const dayStartMin = (date: string): number => Math.floor(Date.parse(`${date}T00:00:00Z`) / 60_000);
export const addDays = (date: string, n: number): string => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
/** 0 = الأحد */
export const dowOf = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();
/** بداية الأسبوع الأحد (افتراض موثّق AS-41: كما في خريطة الروتين عندك) */
export const weekStartOf = (date: string, startDow = 0): string => addDays(date, -((dowOf(date) - startDow + 7) % 7));
export const isDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const hm = (min: number): string => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
/** تاريخ KL لحظة ما */
export const todayKL = (ms = Date.now()): string => msToWall(ms).slice(0, 10);
export const nowWallKL = (ms = Date.now()): string => msToWall(ms);
