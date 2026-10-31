/** منصة الحياة — أنواع السجل (قراءة فقط) ودوال مشتركة بين الخادم والواجهة. لا تعتمد على zod كي لا تُحمَّل في الواجهة. */

export const LIFE_DATA_FILES = ['dashboard_summary', 'finance', 'prayers', 'habits', 'body', 'routine'] as const;
export type LifeFile = (typeof LIFE_DATA_FILES)[number];
export const LIFE_FILE_LABEL: Record<LifeFile, string> = {
  dashboard_summary: 'ملخص الشاشة الرئيسية',
  finance: 'المال',
  prayers: 'الصلاة',
  habits: 'العادات',
  body: 'الجسم',
  routine: 'الروتين',
};
/** ملفات المحتوى (JSON) داخل docs: مكتبة التمارين وقوالب الخطة وبدائل العادات. */
export const LIFE_CONTENT = ['SPORTS_EXERCISES.json', 'SPORTS_PLANS_AR.json', 'HABITS_ALTERNATIVES_AR.json', 'GLOSSARY_AR.json', 'FINANCE_INSIGHTS_AR.json', 'PRAYER_QADA_PLAN_AR.json', 'ROUTINE_BLOCKS_AR.json', 'ledger_full.json', 'FIELD_LABELS_AR.json'] as const;
export const LIFE_QADA_CHOICE_RE = /^[a-z0-9_]{1,20}$/;
export type LifeContentName = (typeof LIFE_CONTENT)[number];
export interface ContentStatus { state: Freshness; generated_at: string | null; age_hours: number | null; stale_after_hours: number | null; error: string | null }
export const COMMAND_TYPES = ['log_expense', 'log_prayer', 'log_weight', 'log_habit', 'start_habit', 'habit_relapse'] as const;
export type CommandType = (typeof COMMAND_TYPES)[number];

/* ───── القِدم ───── */
export type Freshness = 'fresh' | 'stale' | 'expired' | 'unavailable' | 'inconsistent';
export const FRESH_LABEL: Record<Freshness, string> = { fresh: 'محدّث', stale: 'قديم', expired: 'منتهي', unavailable: 'غير متاح', inconsistent: 'غير متسق' };
const SEVERITY: Record<Freshness, number> = { fresh: 0, stale: 1, inconsistent: 2, expired: 3, unavailable: 4 };
export const worstOf = (xs: Freshness[]): Freshness => xs.reduce<Freshness>((w, x) => (SEVERITY[x] > SEVERITY[w] ? x : w), 'fresh');

export interface FreshnessInput {
  nowMs: number;
  generatedAt: string | null | undefined;
  staleAfterHours: number | null | undefined;
  bytesMeta: number | null | undefined;
  bytesActual: number | null | undefined;
  fileError?: boolean;
}
/** قاعدة REFRESH_PROTOCOL §2: قديم بعد stale_after_hours، منتهي بعد 3 أضعافها، غير متسق إن اختلف الحجم الفعلي عن bytes، غير متاح إن غاب الملف أو الميتا. */
/** يحلّل generated_at؛ بلا منطقة زمنية يُفترض توقيت ماليزيا (+08:00) لا توقيت الجهاز. */
export function parseGenerated(v: string | null | undefined): number {
  if (!v) return NaN;
  const s = v.trim();
  return Date.parse(/^\d{4}-\d{2}-\d{2}(T[\d:.]+)?$/.test(s) ? (s.includes('T') ? `${s}+08:00` : `${s}T00:00:00+08:00`) : s);
}
export function classifyFreshness(i: FreshnessInput): { state: Freshness; ageHours: number | null } {
  if (i.fileError || i.bytesActual === null || i.bytesActual === undefined) return { state: 'unavailable', ageHours: null };
  const t = parseGenerated(i.generatedAt);
  if (!Number.isFinite(t)) return { state: 'unavailable', ageHours: null };
  /* وقت توليد في المستقبل (أكثر من 5 دقائق) لا يعني «الآن»: نعتبره غير متسق ولا نعرض عمرًا */
  if (t - i.nowMs > 5 * 60_000) return { state: 'inconsistent', ageHours: null };
  const age = Math.max(0, (i.nowMs - t) / 3_600_000);
  if (typeof i.bytesMeta === 'number' && i.bytesMeta !== i.bytesActual) return { state: 'inconsistent', ageHours: age };
  const limit = i.staleAfterHours;
  if (typeof limit !== 'number' || !(limit > 0)) return { state: 'fresh', ageHours: age };
  if (age <= limit) return { state: 'fresh', ageHours: age };
  if (age <= limit * 3) return { state: 'stale', ageHours: age };
  return { state: 'expired', ageHours: age };
}
export function ageText(h: number | null): string {
  if (h === null) return 'غير معروف';
  if (h < 1 / 30) return 'الآن'; /* أقل من دقيقتين فقط */
  if (h < 1) return `قبل ${Math.max(2, Math.round(h * 60))} دقيقة`;
  if (h < 48) return `قبل ${Math.round(h)} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

export interface LifeFileStatus {
  name: LifeFile;
  label: string;
  state: Freshness;
  generated_at: string | null;
  age_hours: number | null;
  stale_after_hours: number | null;
  mtime: string | null;
  error: string | null;
}
export interface LifeStatus {
  files: LifeFileStatus[];
  worst: Freshness;
  now: string;
}

/* ───── أنواع الملفات (كل الحقول اختيارية: «لا نخمّن») ───── */
export type Conf = string | null | undefined;
export interface BalanceItem { key: string; label_ar?: string; amount?: number | null; currency?: string; confidence?: Conf }
export interface BalancesBlock { title?: string; as_of?: string | null; as_of_note_ar?: string; items?: BalanceItem[] }
export interface Account { key: string; label_ar?: string; amount?: number | null; currency?: string; confidence?: Conf; stated_at?: string | null; stated_by_ar?: string }
export interface OpenItem { id: string; status?: string; title_ar?: string; detail_ar?: string; amount?: number | null; confidence?: Conf; applied_to_boxes?: boolean; assumption_ar?: string }
export interface Tx { id: string; order?: number; date: string; type: string; type_ar?: string; amount: number; currency?: string; wallet?: string; label_ar?: string; confidence?: Conf; cash_delta?: number | null; category_ar?: string | null; category_confidence?: Conf }
export interface SchedulePeriod { from: string; to?: string | null; per_day?: number | null; currency?: string; status?: string; confidence?: Conf; note_ar?: string }
export interface DailyBoxRate { title_ar?: string; value?: number | null; unit?: string; total_spent_rm?: number; rows_count?: number; days?: number; window_from?: string; window_to?: string; scheduled_per_day_rm?: number; difference_vs_schedule_rm?: number; daily_balance_rm?: number; days_daily_box_lasts?: number | null; explanation_ar?: string; confidence?: Conf }
export interface Finance {
  daily_box_rate?: DailyBoxRate;
  balances_block?: BalancesBlock;
  accounts?: Account[];
  open_items?: OpenItem[];
  computed_notes?: { text_ar: string; math?: string; confidence?: Conf }[];
  receivables?: { person_ar: string; amount?: number | null; last_recorded_amount?: number | null; confidence?: Conf; note_ar?: string }[];
  schedule?: { title_ar?: string; from_account?: string; to_account?: string; time_ar?: string; time_confidence?: Conf; periods?: SchedulePeriod[] };
  rules_summary?: { text_ar: string; confidence?: Conf }[];
  verification?: { method_ar?: string; ledger_based?: Record<string, number | null>; ledger_cash_delta_check?: Record<string, number | null>; confidence?: Conf };
  recent_transactions?: Tx[];
  recent_transactions_note_ar?: string;
  balance_history?: unknown;
  balances_history?: unknown;
  balance_history_omitted?: unknown;
  balance_history_title_ar?: string;
  balance_history_method?: string;
  planning_inputs_title_ar?: string;
  planning_inputs?: Record<string, unknown>;
}
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_AR: Record<PrayerKey, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
export type PrayerStatus = 'in_time' | 'late' | 'missed' | 'unknown';
export interface PrayerDay { date: string; status: Partial<Record<PrayerKey, PrayerStatus | string | null>>; counts?: Partial<Record<PrayerStatus, number>>; confidence?: Conf; note_ar?: string }
export interface Prayers {
  attendance?: { title_ar?: string; statuses_ar?: Record<string, string>; days?: PrayerDay[]; totals?: Partial<Record<PrayerStatus, number>>; totals_confidence?: Conf; coverage_note_ar?: string };
  qada?: {
    title_ar?: string; as_of?: string | null;
    remaining?: Partial<Record<PrayerKey, { count: number | null; name_ar?: string }>>;
    total_remaining?: number | null; done_total?: number | null; done_today?: number | null;
    confidence?: Conf; done_confidence?: Conf;
    baseline?: { date?: string; total?: number | null; confidence?: Conf };
    history?: ({ date: string; total?: number | null; note_ar?: string } & Partial<Record<PrayerKey, number | null>>)[];
    pending_ar?: string; rule_ar?: string; sources_checked_ar?: string;
  };
  highest_priority_ar?: string;
}
export interface HabitTarget { date: string; plan_day?: number; reduction_min?: number; sugar_limit_g?: number }
export interface HabitCounters { days_logged?: number | null; days_kept?: number | null; days_not_kept?: number | null; days_unknown?: number | null; days_done?: number | null; days_on_target?: number | null; current_streak_days?: number | null; best_streak_days?: number | null; relapses?: unknown[]; confidence?: Conf }
export interface Habit {
  key: string; name_ar: string; kind?: string; unit?: string; priority?: number; rule_ar?: string; rule_confidence?: Conf;
  start_date?: string; step_per_day?: number; baseline_daily_minutes?: number | null; baseline_note_ar?: string;
  targets?: HabitTarget[]; targets_end_note_ar?: string; targets_confidence?: Conf;
  today?: { date?: string; plan_day?: number; reduction_min?: number; sugar_limit_g?: number; type_ar?: string; confidence?: Conf };
  no_vape_windows_ar?: string; extra_rules_ar?: string; zero_from?: string;
  target?: number | null; target_kcal?: number | null; target_protein_g?: number | null; target_bedtime?: string | null; wake_time_calendar?: string | null;
  week_plan?: { day: string; day_ar?: string; type?: string; type_ar?: string }[];
  time_slot?: { start?: string; end?: string; confidence?: Conf; note_ar?: string };
  log?: Record<string, unknown>[];
  counters?: HabitCounters;
}
export interface Habits { unrecorded_inputs_title_ar?: string; unrecorded_inputs?: Record<string, unknown>; status?: { started?: boolean; started_confidence?: Conf; note_ar?: string }; unknown_is_not_zero_ar?: string; habits?: Habit[]; daily_summary?: Record<string, unknown>[]; streak_definition_ar?: string }
export interface BodyItem { key: string; label_ar?: string; value?: number | null; unit?: string; approx?: boolean; confidence?: Conf; date?: string; note_ar?: string }
export interface WeightPoint { date: string; value_kg: number; source_file?: string; confidence?: Conf; status_ar?: string; note_ar?: string }
export interface GoalProgress { title_ar?: string; goal_kg?: number | null; latest_weight_kg?: number | null; remaining_to_goal_kg?: number | null; remaining_confidence?: Conf; baseline_kg?: number | null; baseline_date?: string | null; change_since_baseline_kg?: number | null; change_confidence?: Conf; arithmetic?: string; note_ar?: string }
export interface Body { unrecorded_inputs_title_ar?: string; unrecorded_inputs?: Record<string, unknown>; date?: string; items?: BodyItem[]; goal_kg?: number | null; goal_kg_confidence?: Conf; weight_history_note_ar?: string; latest_recorded_weight?: { date?: string; value_kg?: number | null; confidence?: Conf };
  /** v9 */ latest_weight_kg?: number | null; latest_weight_date?: string | null; latest_weight_confidence?: Conf; latest_weight_status_ar?: string; latest_weight_source_ar?: string;
  goal_progress?: GoalProgress; weight_history?: WeightPoint[] }
export interface RoutineBlock { name: string; start?: string; end?: string; days?: string[]; days_ar?: string[]; calendar?: string | null; kind?: string; moves_with_prayer_time?: boolean; source_id?: string; confidence?: Conf; time?: string; flex_min?: number; in_outlook?: boolean; note_ar?: string }
export interface Routine {
  timezone?: string; as_of_note_ar?: string;
  prayer_times_reference?: { date?: string; zone?: string; fajr?: string; dhuhr?: string; asr?: string; maghrib?: string; isha?: string; confidence?: Conf };
  daily_blocks?: RoutineBlock[]; weekly_study_blocks?: RoutineBlock[]; local_routines?: RoutineBlock[];
  known_conflicts?: { id: string; text_ar: string }[];
  holidays?: { name_ar: string; from: string; to?: string | null; confidence?: Conf }[];
}
export interface Summary {
  generated_at?: string; as_of_note_ar?: string; balances_block?: BalancesBlock; balances_source?: string;
  qada?: NonNullable<Prayers['qada']> & { source?: string };
  habits?: { title_ar?: string; started?: boolean; started_confidence?: Conf; note_ar?: string; items?: { key: string; name_ar: string; today_plan_day?: number | null; today_target_ar?: string; today_target?: number | null; unit?: string; current_streak_days?: number | null; days_kept?: number | null; days_not_kept?: number | null; confidence?: Conf }[] };
  open_finance_items?: { title_ar?: string; items?: OpenItem[]; note_ar?: string };
  open_loops_count?: { title_ar?: string; open_or_waiting?: number; open?: number; waiting?: number; partially_closed?: number; closed?: number; total_rows?: number; method_ar?: string; confidence?: Conf; file_header_note_ar?: string };
}
export interface LifeData { dashboard_summary: Summary; finance: Finance; prayers: Prayers; habits: Habits; body: Body; routine: Routine }
export interface LifeFileResult<K extends LifeFile = LifeFile> { name: K; data: LifeData[K]; status: LifeFileStatus }

/** فحص بنيوي خفيف: يُرجع وصف أول مشكلة أو null. يحمي الواجهة من تغيّر تنسيق الملفات دون أن نرفض حقولًا جديدة. */
export function checkShape(name: LifeFile, d: unknown): string | null {
  const o = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!o(d)) return 'الملف ليس كائن JSON';
  const arr = (obj: unknown, key: string, path: string): string | null => {
    if (!o(obj)) return null;
    const v = obj[key];
    return v === undefined || v === null || Array.isArray(v) ? null : `${path}.${key} يجب أن يكون قائمة`;
  };
  const sub = (obj: unknown, key: string, path: string): string | null => {
    if (!o(obj)) return null;
    const v = obj[key];
    return v === undefined || v === null || o(v) ? null : `${path}.${key} يجب أن يكون كائنًا`;
  };
  const checks: (string | null)[] = [];
  switch (name) {
    case 'finance':
      checks.push(sub(d, 'balances_block', ''), arr(d['balances_block'], 'items', 'balances_block'), arr(d, 'accounts', ''), arr(d, 'open_items', ''), arr(d, 'recent_transactions', ''), arr(d, 'receivables', ''), sub(d, 'schedule', ''), arr(d['schedule'], 'periods', 'schedule'));
      for (const t of Array.isArray(d['recent_transactions']) ? d['recent_transactions'] : []) {
        if (!o(t) || typeof t['date'] !== 'string' || typeof t['amount'] !== 'number' || typeof t['type'] !== 'string') {
          checks.push('recent_transactions[]: كل حركة تحتاج date (نص) و amount (رقم) و type (نص)');
          break;
        }
      }
      break;
    case 'prayers':
      checks.push(sub(d, 'attendance', ''), arr(d['attendance'], 'days', 'attendance'), sub(d, 'qada', ''), sub(d['qada'], 'remaining', 'qada'), arr(d['qada'], 'history', 'qada'));
      break;
    case 'habits':
      checks.push(arr(d, 'habits', ''), sub(d, 'status', ''));
      for (const h of Array.isArray(d['habits']) ? d['habits'] : []) {
        if (!o(h) || typeof h['key'] !== 'string' || typeof h['name_ar'] !== 'string') {
          checks.push('habits[]: كل عادة تحتاج key و name_ar');
          break;
        }
      }
      break;
    case 'body':
      checks.push(arr(d, 'items', ''), arr(d, 'weight_history', ''));
      break;
    case 'routine':
      checks.push(arr(d, 'daily_blocks', ''), arr(d, 'weekly_study_blocks', ''), arr(d, 'local_routines', ''), arr(d, 'holidays', ''), arr(d, 'known_conflicts', ''));
      break;
    case 'dashboard_summary':
      checks.push(sub(d, 'balances_block', ''), sub(d, 'qada', ''), sub(d, 'habits', ''), sub(d, 'open_finance_items', ''), sub(d, 'open_loops_count', ''));
      break;
  }
  return checks.find((x) => x !== null) ?? null;
}

/* ───── حسابات مشتقة (كلها «محسوب» وتُعرض بوسمها) ───── */
/* ───── بيانات ناقصة (planning_inputs / unrecorded_inputs): قيمها null حتى يقولها محمد؛ لا نملؤها أبدًا ───── */
export interface MissingInput { key: string; label: string | null; value: unknown; unit: string | null; note: string; confidence: string | null; needed_for: string | null; related: string | null }
export function missingInputs(obj: unknown): MissingInput[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>)
    .filter(([, v]) => !!v && typeof v === 'object' && !Array.isArray(v) && 'value' in (v as object))
    .map(([key, v]) => {
      const o = v as Record<string, unknown>;
      return { key, label: strOrNull(o['label_ar']) ?? strOrNull(o['title_ar']) ?? strOrNull(o['name_ar']), value: o['value'], unit: strOrNull(o['unit']), note: strOrNull(o['note_ar']) ?? '', confidence: strOrNull(o['confidence']), needed_for: strOrNull(o['needed_for_ar']), related: strOrNull(o['related']) };
    });
}
export const countMissing = (items: MissingInput[]): number => items.filter((i) => i.value === null || i.value === undefined).length;

export const UNCATEGORIZED = 'غير مصنّف';
export function spendingByCategory(tx: Tx[]): { category: string; total: number; count: number }[] {
  const m = new Map<string, { total: number; count: number }>();
  for (const t of tx) {
    if (t.type !== 'expense') continue;
    const k = t.category_ar?.trim() || UNCATEGORIZED;
    const cur = m.get(k) ?? { total: 0, count: 0 };
    cur.total += t.amount;
    cur.count++;
    m.set(k, cur);
  }
  return [...m].map(([category, v]) => ({ category, total: Math.round(v.total * 100) / 100, count: v.count })).sort((a, b) => b.total - a.total);
}
export function spendingByDay(tx: Tx[]): { date: string; total: number }[] {
  const m = new Map<string, number>();
  for (const t of tx) if (t.type === 'expense') m.set(t.date, (m.get(t.date) ?? 0) + t.amount);
  return [...m].map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date));
}
const dayNum = (iso: string): number => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;
/** معدّل صرف «اليومية» = مجموع المصاريف التي wallet=يومية وcash_delta<0 ÷ عدد الأيام بين أول وآخر حركة منها (شاملة). null إن لم توجد حركات. */
export function dailySpendRate(tx: Tx[]): { rate: number; days: number; total: number; count: number } | null {
  const rows = tx.filter((t) => t.type === 'expense' && t.wallet === 'يومية' && typeof t.cash_delta === 'number' && t.cash_delta < 0);
  if (!rows.length) return null;
  const ds = rows.map((r) => dayNum(r.date));
  const days = Math.max(...ds) - Math.min(...ds) + 1;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return { rate: Math.round((total / days) * 100) / 100, days, total: Math.round(total * 100) / 100, count: rows.length };
}
export const coverage = (balance: number | null | undefined, perDay: number | null | undefined): number | null =>
  typeof balance === 'number' && typeof perDay === 'number' && perDay > 0 ? Math.round((balance / perDay) * 100) / 100 : null;

export interface BalancePoint { t: number; date: string; dateOnly: boolean; treasury: number | null; monthly: number | null; daily: number | null; total: number | null; event: string | null; note: string | null; confidence: string | null; sourceRow: string | null }
export interface OmittedRange { rows: string | null; dates: string | null; reason: string }
export interface BalanceHistoryResult { points: BalancePoint[]; skipped: number; field: string | null; title: string | null; method: string | null; omitted: OmittedRange[] }
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** يقرأ balance_history (أو balances_history) من finance.json بأشكال متسامحة. لا يخترع نقاطًا: ما لا يُفهم يُعدّ في skipped. */
export function parseBalanceHistory(f: Finance | null | undefined): BalanceHistoryResult {
  const field = f?.balance_history !== undefined ? 'balance_history' : f?.balances_history !== undefined ? 'balances_history' : null;
  const fr = (f ?? {}) as Record<string, unknown>;
  const rawOmitted = fr['balance_history_omitted'] ?? fr['balances_history_omitted'];
  const omitted: OmittedRange[] = Array.isArray(rawOmitted)
    ? rawOmitted
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map((x) => ({ rows: strOrNull(x['rows']), dates: strOrNull(x['dates']), reason: strOrNull(x['reason_ar']) ?? strOrNull(x['reason']) ?? '' }))
        .filter((x) => x.reason || x.rows || x.dates)
    : [];
  const title = strOrNull(fr['balance_history_title_ar']);
  const method = strOrNull(fr['balance_history_method']);
  if (!f || !field) return { points: [], skipped: 0, field: null, title, method, omitted };
  const raw = fr[field];
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { points?: unknown }).points) ? ((raw as { points: unknown[] }).points) : null;
  if (!list) return { points: [], skipped: 0, field, title, method, omitted };
  const points: BalancePoint[] = [];
  let skipped = 0;
  for (const e of list) {
    if (!e || typeof e !== 'object') {
      skipped++;
      continue;
    }
    const o = e as Record<string, unknown>;
    const when = [o['as_of'], o['date'], o['at'], o['time'], o['timestamp']].find((x) => typeof x === 'string') as string | undefined;
    const t = when ? Date.parse(when.length === 10 ? `${when}T12:00:00+08:00` : when) : NaN;
    if (!Number.isFinite(t)) {
      skipped++;
      continue;
    }
    const bag: Record<string, unknown> = {};
    const src = o['balances'] && typeof o['balances'] === 'object' ? (o['balances'] as Record<string, unknown>) : o;
    for (const k of ['treasury', 'monthly', 'daily', 'total']) bag[k] = src[k];
    if (Array.isArray(o['items'])) for (const it of o['items'] as Record<string, unknown>[]) if (it && typeof it['key'] === 'string') bag[it['key']] = it['amount'];
    const p: BalancePoint = { t, date: when!, dateOnly: when!.length === 10, treasury: numOrNull(bag['treasury']), monthly: numOrNull(bag['monthly']), daily: numOrNull(bag['daily']), total: numOrNull(bag['total']), event: strOrNull(o['event_ar']), note: strOrNull(o['note_ar']), confidence: strOrNull(o['confidence']), sourceRow: strOrNull(o['source_row']) };
    if (p.treasury === null && p.monthly === null && p.daily === null && p.total === null) {
      skipped++;
      continue;
    }
    points.push(p);
  }
  points.sort((a, b) => a.t - b.t);
  return { points, skipped, field, title, method, omitted };
}

/** كغ كما سجّله النظام (حتى منزلتين): 83.65 تبقى 83.65 ولا تصير 83.7. */
export const kgText = (n: number | null | undefined): string => (typeof n === 'number' && Number.isFinite(n) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100) : '—');
export function weightProgress(b: Body | null | undefined): { baseline: number; latest: number; goal: number; lost: number; remaining: number; pct: number } | null {
  if (!b) return null;
  const gp = b.goal_progress;
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const baseline = num(gp?.baseline_kg) ? gp!.baseline_kg! : b.items?.find((i) => i.key === 'weight')?.value;
  const goal = num(gp?.goal_kg) ? gp!.goal_kg! : b.goal_kg ?? b.items?.find((i) => i.key === 'goal_weight')?.value;
  const latest = num(b.latest_weight_kg) ? b.latest_weight_kg : num(gp?.latest_weight_kg) ? gp!.latest_weight_kg! : b.latest_recorded_weight?.value_kg;
  if (typeof baseline !== 'number' || typeof goal !== 'number' || typeof latest !== 'number' || baseline <= goal) return null;
  /* v9: القيم الجاهزة  تُفضَّل؛ «النزول عن خط الأساس» و«المتبقي للهدف» رقمان مختلفان ولا يُخلطان */
  const lost = num(gp?.change_since_baseline_kg) ? Math.round(-gp!.change_since_baseline_kg! * 100) / 100 : Math.round((baseline - latest) * 100) / 100;
  const remaining = num(gp?.remaining_to_goal_kg) ? gp!.remaining_to_goal_kg! : Math.round((latest - goal) * 100) / 100;
  return { baseline, latest, goal, lost, remaining, pct: Math.max(0, Math.min(100, (lost / (baseline - goal)) * 100)) };
}

export const DAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const DAY_AR: Record<string, string> = { sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت' };
export const toMin = (s: string | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
/** يزيل الإيموجي من النص المعروض (قاعدة التصميم: أيقونات الواجهة وحدها، لا رموز ملوّنة داخل النصوص) دون المساس بالبيانات المخزّنة. */
export function stripEmoji(t: string): string {
  return t.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D]/gu, '').replace(/\s{2,}/g, ' ').trim();
}
export interface DayBlock { b: RoutineBlock; start: number; end: number }
export function blocksForDay(r: Routine | null | undefined, day: string): DayBlock[] {
  if (!r) return [];
  const all = [...(r.daily_blocks ?? []), ...(r.weekly_study_blocks ?? [])];
  const out: DayBlock[] = [];
  for (const b of all) {
    if (!b.days?.includes(day)) continue;
    const s = toMin(b.start);
    const e = toMin(b.end);
    if (s === null || e === null) continue;
    out.push({ b: { ...b, name: stripEmoji(b.name) }, start: s, end: e <= s ? e + 1440 : e });
  }
  return out.sort((a, b) => a.start - b.start || a.end - b.end);
}
/** الكتلة الحالية والتالية بتوقيت ماليزيا. */
export function nowAndNext(r: Routine | null | undefined, nowMs: number): { day: string; minute: number; current: DayBlock[]; next: DayBlock | null } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(nowMs);
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '';
  const day = get('weekday').slice(0, 3).toLowerCase();
  const minute = Number(get('hour')) * 60 + Number(get('minute'));
  const list = blocksForDay(r, day);
  return { day, minute, current: list.filter((x) => x.start <= minute && minute < x.end), next: list.find((x) => x.start > minute) ?? null };
}

/* ───── الأوامر (مسودات فقط) ───── */
export interface LifeCommand { id: string; created_at: string; type: CommandType; payload: Record<string, unknown>; status: string; created_by?: string; handled_at?: string; result_note_ar?: string }
export const EXPENSE_BOXES = ['treasury', 'monthly', 'daily', 'unknown'] as const;
export const PAY_SOURCES = ['rhb', 'tng', 'cash', 'unknown'] as const;
export const HABIT_KEYS = ['vape', 'tea_sugar', 'water', 'sleep', 'food', 'workout'] as const;
export const COMMAND_LABEL: Record<CommandType, string> = { log_expense: 'تسجيل مصروف', log_prayer: 'تسجيل صلاة', log_weight: 'تسجيل وزن', log_habit: 'تسجيل عادة', start_habit: 'بدء عادة', habit_relapse: 'تسجيل انتكاسة' };
/** يتحقق من payload حسب النوع؛ يُرجع {field: رسالة}. */
export function validatePayload(type: CommandType, p: Record<string, unknown>): Record<string, string> {
  const e: Record<string, string> = {};
  const isDate = (v: unknown): boolean => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  const oneOf = (v: unknown, xs: readonly string[]): boolean => typeof v === 'string' && xs.includes(v);
  switch (type) {
    case 'log_expense':
      if (!isDate(p['date'])) e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
      if (typeof p['amount'] !== 'number' || !(p['amount'] > 0) || p['amount'] > 100000) e['amount'] = 'مبلغ موجب';
      if (p['currency'] !== 'RM') e['currency'] = 'العملة RM فقط';
      if (!oneOf(p['box'], EXPENSE_BOXES)) e['box'] = 'اختر الصندوق (أو unknown)';
      if (typeof p['label_ar'] !== 'string' || !p['label_ar'].trim()) e['label_ar'] = 'وصف قصير مطلوب';
      if (typeof p['category_ar'] !== 'string' || !p['category_ar'].trim()) e['category_ar'] = 'الفئة مطلوبة';
      if (!oneOf(p['payment_source'], PAY_SOURCES)) e['payment_source'] = 'اختر مصدر الدفع (أو unknown)';
      break;
    case 'log_prayer':
      if (!isDate(p['date'])) e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
      if (!oneOf(p['prayer'], PRAYER_KEYS)) e['prayer'] = 'اختر الصلاة';
      if (!oneOf(p['status'], ['in_time', 'late', 'missed'])) e['status'] = 'اختر الحالة';
      if (!oneOf(p['kind'], ['fard', 'qada'])) e['kind'] = 'فرض أو قضاء';
      break;
    case 'start_habit':
      if (!oneOf(p['habit'], HABIT_KEYS)) e['habit'] = 'اختر العادة';
      if (!isDate(p['start_date'])) e['start_date'] = 'تاريخ بصيغة YYYY-MM-DD';
      break;
    case 'habit_relapse':
      if (!oneOf(p['habit'], HABIT_KEYS)) e['habit'] = 'اختر العادة';
      if (!isDate(p['date'])) e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
      break;
    case 'log_weight':
      if (!isDate(p['date'])) e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
      if (typeof p['weight_kg'] !== 'number' || !(p['weight_kg'] >= 30) || p['weight_kg'] > 300) e['weight_kg'] = 'وزن بين 30 و300 كغ';
      break;
    case 'log_habit':
      if (!oneOf(p['habit'], HABIT_KEYS)) e['habit'] = 'اختر العادة';
      if (!isDate(p['date'])) e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
      if (!(typeof p['value'] === 'boolean' || (typeof p['value'] === 'number' && p['value'] >= 0 && p['value'] <= 100000))) e['value'] = 'قيمة رقمية أو نعم/لا';
      break;
  }
  if (p['note_ar'] !== undefined && (typeof p['note_ar'] !== 'string' || p['note_ar'].length > 500)) e['note_ar'] = 'ملاحظة حتى 500 حرف';
  return e;
}
export function commandId(now: Date, seq: number): string {
  const kl = new Date(now.getTime() + 8 * 3_600_000).toISOString();
  return `CMD-${kl.slice(0, 10).replace(/-/g, '')}-${kl.slice(11, 19).replace(/:/g, '')}-${String(seq).padStart(3, '0')}`;
}
export const COMMAND_ID_RE = /^CMD-\d{8}-\d{6}-\d{3}$/;
