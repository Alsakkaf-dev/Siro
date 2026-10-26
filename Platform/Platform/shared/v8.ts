/** ملفات راشد v7/v8: السجل الكامل، خريطة الروتين، المؤشرات المالية الجاهزة، خطة القضاء. للقراءة فقط؛ لا نعيد حساب شيء من الجاهز. */
import type { Conf } from './life.js';

/* ───── السجل الكامل (ledger_full.json) ───── */
export interface LedgerRow {
  order: number; event_id: string; occurred_at?: string; date: string; type: string; amount: number; currency?: string; wallet?: string;
  cash_delta?: number | null; receivable_delta?: number | null; source?: string; notes?: string; text_redacted?: boolean;
}
export interface LedgerDoc {
  total_rows: number; currency?: string; title_ar?: string; note_ar?: string; redaction_note_ar?: string; redacted_row_count?: number; redacted_row_ids?: string[];
  source_quirks_ar?: string; source?: { file?: string; data_rows?: number; sha256_prefix?: string; note_ar?: string };
  rows: LedgerRow[];
}
export const LEDGER_TYPE_AR: Record<string, string> = { expense: 'مصروف', transfer: 'تحويل', adjustment: 'تسوية', receivable_settled: 'سداد دين لي', receivable_created: 'دين جديد' };
export type LedgerSortKey = 'order' | 'date' | 'amount' | 'type' | 'wallet';
export interface LedgerFilter { q: string; type: string | null; wallet: string | null; from: string | null; to: string | null; redactedOnly: boolean; noBoxOnly: boolean }
export const EMPTY_LEDGER_FILTER: LedgerFilter = { q: '', type: null, wallet: null, from: null, to: null, redactedOnly: false, noBoxOnly: false };
const norm = (s: string): string => s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').toLowerCase();
export function filterLedger(rows: LedgerRow[], f: LedgerFilter): LedgerRow[] {
  const q = norm(f.q.trim());
  return rows.filter((r) => {
    if (f.type && r.type !== f.type) return false;
    if (f.wallet && (r.wallet ?? '') !== f.wallet) return false;
    if (f.from && r.date < f.from) return false;
    if (f.to && r.date > f.to) return false;
    if (f.redactedOnly && !r.text_redacted) return false;
    if (f.noBoxOnly && !(r.type === 'expense' && r.cash_delta === 0)) return false;
    if (q && !norm(`${r.event_id} ${r.type} ${LEDGER_TYPE_AR[r.type] ?? ''} ${r.wallet ?? ''} ${r.source ?? ''} ${r.notes ?? ''} ${r.amount} ${r.date}`).includes(q)) return false;
    return true;
  });
}
export function sortLedger(rows: LedgerRow[], key: LedgerSortKey, dir: 'asc' | 'desc'): LedgerRow[] {
  const m = dir === 'asc' ? 1 : -1;
  const val = (r: LedgerRow): string | number => (key === 'amount' ? r.amount : key === 'order' ? r.order : key === 'date' ? r.date : key === 'type' ? r.type : r.wallet ?? '');
  return [...rows].sort((a, b) => {
    const x = val(a), y = val(b);
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ar');
    return c * m || (a.order - b.order) * m;
  });
}
/** مجموع مبالغ الصفوف المعروضة من نوع «مصروف» فقط (عرض لما في الجدول، وليس مؤشرًا من راشد). */
export const expenseSum = (rows: LedgerRow[]): { total: number; count: number } => ({ total: Math.round(rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0) * 100) / 100, count: rows.filter((r) => r.type === 'expense').length });
export function checkLedger(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'المحتوى ليس كائنًا';
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['rows'])) return 'الحقل rows يجب أن يكون قائمة';
  if (typeof o['total_rows'] !== 'number') return 'الحقل total_rows مفقود';
  for (const r of o['rows'] as unknown[]) if (!r || typeof r !== 'object' || typeof (r as LedgerRow).event_id !== 'string' || typeof (r as LedgerRow).amount !== 'number' || typeof (r as LedgerRow).date !== 'string') return 'rows[]: كل صف يحتاج event_id و amount و date';
  return null;
}

/* ───── خريطة الروتين (docs/ROUTINE_BLOCKS_AR.json) ───── */
export interface RBlock {
  id: string; day: string; day_ar?: string; start: string; end: string; start_min: number; end_min: number; duration_min?: number; type: string; type_ar?: string;
  label_ar?: string; name_original?: string; confidence?: Conf; moves_with_prayer_time?: boolean; note_ar?: string | null; overlaps_with?: string[];
  source?: { file?: string; section?: string; source_id?: string; calendar?: string | null };
}
export interface RPoint { id: string; day: string; day_ar?: string; recurrence?: string; time: string; time_min: number; flex_min?: number; type: string; type_ar?: string; label_ar?: string; confidence?: Conf; in_outlook?: boolean; note_ar?: string | null }
export interface RoutineBlocksDoc {
  readme_ar?: string; overlap_note_ar?: string; week_start?: string; week_start_confidence?: Conf; days: { key: string; name_ar: string }[];
  legend: { type: string; type_ar: string; description_ar?: string; count?: number }[]; block_count?: number; point_count?: number;
  prayer_times_reference?: { date?: string; zone?: string; confidence?: Conf } & Record<string, unknown>;
  blocks: RBlock[]; points: RPoint[]; known_conflicts?: { id: string; text_ar: string }[]; holidays?: { name_ar: string; from: string; to?: string | null; confidence?: Conf }[];
}
export function checkRoutineBlocks(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'المحتوى ليس كائنًا';
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['blocks']) || !Array.isArray(o['days'])) return 'blocks و days يجب أن يكونا قائمتين';
  for (const b of o['blocks'] as unknown[]) { const x = b as RBlock; if (!x || typeof x.id !== 'string' || typeof x.start_min !== 'number' || typeof x.end_min !== 'number' || typeof x.day !== 'string') return 'blocks[]: كل كتلة تحتاج id و day و start_min و end_min'; }
  return null;
}
/** أزواج التداخل (كل زوج مرة واحدة) كما كتبها راشد في overlaps_with، بلا اكتشاف من عندنا. */
export function overlapPairs(blocks: RBlock[]): { a: RBlock; b: RBlock }[] {
  const by = new Map(blocks.map((x) => [x.id, x] as const));
  const seen = new Set<string>();
  const out: { a: RBlock; b: RBlock }[] = [];
  for (const a of blocks) for (const id of a.overlaps_with ?? []) {
    const b = by.get(id);
    if (!b) continue;
    const k = [a.id, b.id].sort().join('|');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ a, b });
  }
  return out;
}
export interface Placed { b: RBlock; lane: number; overlapped: boolean }
/** توزيع كتل اليوم على مسارات: «وقت الفراغ» خلفية (مسار 0 كامل الارتفاع)، والباقي يُوزَّع بحيث لا تغطي كتلتان بعضهما. */
export function placeDay(blocks: RBlock[]): { free: RBlock[]; placed: Placed[]; lanes: number } {
  const free = blocks.filter((x) => x.type === 'free');
  const rest = blocks.filter((x) => x.type !== 'free').sort((a, b) => a.start_min - b.start_min || b.end_min - a.end_min);
  const laneEnd: number[] = [];
  const placed: Placed[] = rest.map((b) => {
    let lane = laneEnd.findIndex((e) => e <= b.start_min);
    if (lane < 0) { lane = laneEnd.length; laneEnd.push(0); }
    laneEnd[lane] = b.end_min;
    return { b, lane, overlapped: (b.overlaps_with ?? []).length > 0 };
  });
  return { free, placed, lanes: Math.max(1, laneEnd.length) };
}

/* ───── المؤشرات المالية الجاهزة (docs/FINANCE_INSIGHTS_AR.json) ───── */
export interface Indicator {
  id: string; order?: number; name_ar: string; unit?: string; formula_ar?: string; arithmetic?: string; confidence?: Conf; confidence_note_ar?: string;
  current_value?: unknown; value_text_ar?: string | null; missing_text_ar?: string | null; details?: Record<string, unknown>; source_fields?: { file?: string; path?: string; columns?: string }[];
}
export interface InsightsDoc {
  title_ar?: string; purpose_ar?: string; generated_at?: string; spend_definition_ar?: string; limitations_ar?: string[];
  data_period?: { from?: string; to?: string; days?: number; basis_ar?: string; confidence?: Conf; period_assumption_ar?: string };
  source_state?: { ledger_rows?: number; expense_rows?: number; confidence?: Conf; balances_as_of?: string };
  spend_adjustments?: { row_id: string; recorded_amount: number; counted_amount: number; reason_ar?: string; confidence?: Conf }[];
  recompute_check?: { status_ar?: string; confidence?: Conf; checked_at?: string };
  changelog_ar?: unknown[]; indicators: Indicator[];
}
export function checkInsights(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'المحتوى ليس كائنًا';
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['indicators'])) return 'indicators يجب أن يكون قائمة';
  for (const i of o['indicators'] as unknown[]) if (!i || typeof i !== 'object' || typeof (i as Indicator).id !== 'string' || typeof (i as Indicator).name_ar !== 'string') return 'indicators[]: كل مؤشر يحتاج id و name_ar';
  return null;
}

/* ───── خطة القضاء (docs/PRAYER_QADA_PLAN_AR.json) ───── */
export interface QadaScenario {
  id: string; qada_per_day: number; label_ar: string;
  total_days_if_counts_stay_fixed?: { days?: number; months_approx?: number; years_approx?: number; arithmetic_ar?: string; total_arithmetic_ar?: string };
  sequential_by_name?: { description_ar?: string; items?: { prayer: string; name_ar: string; count: number; cumulative_count?: number; cleared_by_day?: number; arithmetic_ar?: string; approx_months?: number }[] };
  [k: string]: unknown;
}
export interface QadaPlanDoc {
  title_ar?: string; tone_ar?: string; status_ar?: string; start_date?: string | null; start_date_missing_text_ar?: string; selected_scenario?: string | null; selected_scenario_missing_text_ar?: string;
  confidence?: Conf; confidence_note_ar?: string; as_of?: string; counts?: Record<string, unknown>; method_ar?: { rounding_ar?: string; assumptions_ar?: string[]; what_is_not_computed_ar?: string };
  scenarios: QadaScenario[]; growth_note_ar?: { text_ar?: string; pending_from_file_ar?: string; history_fact?: { change?: number; arithmetic_ar?: string; note_ar?: string; from?: string; to?: string } };
  educational_disclaimer_ar?: string; how_to_use_ar?: string;
}
export function checkQadaPlan(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'المحتوى ليس كائنًا';
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['scenarios'])) return 'scenarios يجب أن يكون قائمة';
  for (const s of o['scenarios'] as unknown[]) if (!s || typeof s !== 'object' || typeof (s as QadaScenario).id !== 'string') return 'scenarios[]: كل سيناريو يحتاج id';
  return null;
}

/**
 * مصروف كل يوم من السجل الكامل: صفوف type=expense فقط، وإن كتب راشد تعديلًا (spend_adjustments) نستبدل المبلغ المسجّل بالمحسوب
 * حتى لا يتكرر مبلغ (مثل 14.53 في 13 أكتوبر). لا نحسب شيئًا آخر من عندنا.
 */
export function ledgerSpendByDay(rows: LedgerRow[], adj: { row_id: string; recorded_amount: number; counted_amount: number }[] = []): { date: string; total: number }[] {
  const by = new Map(adj.map((a) => [a.row_id, a] as const));
  const m = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== 'expense') continue;
    const a = by.get(r.event_id);
    const amt = a && Math.abs(a.recorded_amount - r.amount) < 0.005 ? a.counted_amount : r.amount;
    m.set(r.date, (m.get(r.date) ?? 0) + amt);
  }
  return [...m].map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date));
}



export { checkFieldLabels, fieldLabel, type FieldLabelsDoc } from './labels.js';
import { fieldLabel, type FieldLabelsDoc } from './labels.js';

/** «prayers.json › attendance.days[]» → «ملف الصلاة ← الحضور ← الأيام»؛ مقطع بلا اسم عربي يُحذف (لا يظهر مفتاح إنجليزي). */
export function fieldPathAr(path: string, doc: FieldLabelsDoc | null | undefined): string {
  const FILE: Record<string, string> = { 'finance.json': 'ملف المال', 'prayers.json': 'ملف الصلاة', 'habits.json': 'ملف العادات', 'body.json': 'ملف الجسم', 'routine.json': 'ملف الروتين', 'dashboard_summary.json': 'ملخص اللوحة' };
  const parts = path.split('›').map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const [i, p] of parts.entries()) {
    if (i === 0 && FILE[p]) { out.push(FILE[p]!); continue; }
    for (const seg of p.split('.')) {
      const k = seg.replace(/\[.*?\]/g, '').trim();
      if (!k) continue;
      if (/[\u0600-\u06FF]/.test(k)) { out.push(k); continue; }
      const l = fieldLabel(doc, k);
      if (l) out.push(l);
    }
  }
  return out.join(' ← ');
}
