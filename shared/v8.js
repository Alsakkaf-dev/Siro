export const LEDGER_TYPE_AR = { expense: 'مصروف', transfer: 'تحويل', adjustment: 'تسوية', receivable_settled: 'سداد دين لي', receivable_created: 'دين جديد' };
export const EMPTY_LEDGER_FILTER = { q: '', type: null, wallet: null, from: null, to: null, redactedOnly: false, noBoxOnly: false };
const norm = (s) => s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').toLowerCase();
export function filterLedger(rows, f) {
    const q = norm(f.q.trim());
    return rows.filter((r) => {
        if (f.type && r.type !== f.type)
            return false;
        if (f.wallet && (r.wallet ?? '') !== f.wallet)
            return false;
        if (f.from && r.date < f.from)
            return false;
        if (f.to && r.date > f.to)
            return false;
        if (f.redactedOnly && !r.text_redacted)
            return false;
        if (f.noBoxOnly && !(r.type === 'expense' && r.cash_delta === 0))
            return false;
        if (q && !norm(`${r.event_id} ${r.type} ${LEDGER_TYPE_AR[r.type] ?? ''} ${r.wallet ?? ''} ${r.source ?? ''} ${r.notes ?? ''} ${r.amount} ${r.date}`).includes(q))
            return false;
        return true;
    });
}
export function sortLedger(rows, key, dir) {
    const m = dir === 'asc' ? 1 : -1;
    const val = (r) => (key === 'amount' ? r.amount : key === 'order' ? r.order : key === 'date' ? r.date : key === 'type' ? r.type : r.wallet ?? '');
    return [...rows].sort((a, b) => {
        const x = val(a), y = val(b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ar');
        return c * m || (a.order - b.order) * m;
    });
}
/** مجموع مبالغ الصفوف المعروضة من نوع «مصروف» فقط (عرض لما في الجدول، وليس مؤشرًا من راشد). */
export const expenseSum = (rows) => ({ total: Math.round(rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0) * 100) / 100, count: rows.filter((r) => r.type === 'expense').length });
export function checkLedger(d) {
    if (!d || typeof d !== 'object')
        return 'المحتوى ليس كائنًا';
    const o = d;
    if (!Array.isArray(o['rows']))
        return 'الحقل rows يجب أن يكون قائمة';
    if (typeof o['total_rows'] !== 'number')
        return 'الحقل total_rows مفقود';
    for (const r of o['rows'])
        if (!r || typeof r !== 'object' || typeof r.event_id !== 'string' || typeof r.amount !== 'number' || typeof r.date !== 'string')
            return 'rows[]: كل صف يحتاج event_id و amount و date';
    return null;
}
export function checkRoutineBlocks(d) {
    if (!d || typeof d !== 'object')
        return 'المحتوى ليس كائنًا';
    const o = d;
    if (!Array.isArray(o['blocks']) || !Array.isArray(o['days']))
        return 'blocks و days يجب أن يكونا قائمتين';
    for (const b of o['blocks']) {
        const x = b;
        if (!x || typeof x.id !== 'string' || typeof x.start_min !== 'number' || typeof x.end_min !== 'number' || typeof x.day !== 'string')
            return 'blocks[]: كل كتلة تحتاج id و day و start_min و end_min';
    }
    return null;
}
/** أزواج التداخل (كل زوج مرة واحدة) كما كتبها راشد في overlaps_with، بلا اكتشاف من عندنا. */
export function overlapPairs(blocks) {
    const by = new Map(blocks.map((x) => [x.id, x]));
    const seen = new Set();
    const out = [];
    for (const a of blocks)
        for (const id of a.overlaps_with ?? []) {
            const b = by.get(id);
            if (!b)
                continue;
            const k = [a.id, b.id].sort().join('|');
            if (seen.has(k))
                continue;
            seen.add(k);
            out.push({ a, b });
        }
    return out;
}
/** توزيع كتل اليوم على مسارات: «وقت الفراغ» خلفية (مسار 0 كامل الارتفاع)، والباقي يُوزَّع بحيث لا تغطي كتلتان بعضهما. */
export function placeDay(blocks) {
    const free = blocks.filter((x) => x.type === 'free');
    const rest = blocks.filter((x) => x.type !== 'free').sort((a, b) => a.start_min - b.start_min || b.end_min - a.end_min);
    const laneEnd = [];
    const placed = rest.map((b) => {
        let lane = laneEnd.findIndex((e) => e <= b.start_min);
        if (lane < 0) {
            lane = laneEnd.length;
            laneEnd.push(0);
        }
        laneEnd[lane] = b.end_min;
        return { b, lane, overlapped: (b.overlaps_with ?? []).length > 0 };
    });
    return { free, placed, lanes: Math.max(1, laneEnd.length) };
}
export function checkInsights(d) {
    if (!d || typeof d !== 'object')
        return 'المحتوى ليس كائنًا';
    const o = d;
    if (!Array.isArray(o['indicators']))
        return 'indicators يجب أن يكون قائمة';
    for (const i of o['indicators'])
        if (!i || typeof i !== 'object' || typeof i.id !== 'string' || typeof i.name_ar !== 'string')
            return 'indicators[]: كل مؤشر يحتاج id و name_ar';
    return null;
}
export function checkQadaPlan(d) {
    if (!d || typeof d !== 'object')
        return 'المحتوى ليس كائنًا';
    const o = d;
    if (!Array.isArray(o['scenarios']))
        return 'scenarios يجب أن يكون قائمة';
    for (const s of o['scenarios'])
        if (!s || typeof s !== 'object' || typeof s.id !== 'string')
            return 'scenarios[]: كل سيناريو يحتاج id';
    return null;
}
/**
 * مصروف كل يوم من السجل الكامل: صفوف type=expense فقط، وإن كتب راشد تعديلًا (spend_adjustments) نستبدل المبلغ المسجّل بالمحسوب
 * حتى لا يتكرر مبلغ (مثل 14.53 في 13 أكتوبر). لا نحسب شيئًا آخر من عندنا.
 */
export function ledgerSpendByDay(rows, adj = []) {
    const by = new Map(adj.map((a) => [a.row_id, a]));
    const m = new Map();
    for (const r of rows) {
        if (r.type !== 'expense')
            continue;
        const a = by.get(r.event_id);
        const amt = a && Math.abs(a.recorded_amount - r.amount) < 0.005 ? a.counted_amount : r.amount;
        m.set(r.date, (m.get(r.date) ?? 0) + amt);
    }
    return [...m].map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date));
}
export { checkFieldLabels, fieldLabel } from './labels.js';
import { fieldLabel } from './labels.js';
/** «prayers.json › attendance.days[]» → «ملف الصلاة ← الحضور ← الأيام»؛ مقطع بلا اسم عربي يُحذف (لا يظهر مفتاح إنجليزي). */
export function fieldPathAr(path, doc) {
    const FILE = { 'finance.json': 'ملف المال', 'prayers.json': 'ملف الصلاة', 'habits.json': 'ملف العادات', 'body.json': 'ملف الجسم', 'routine.json': 'ملف الروتين', 'dashboard_summary.json': 'ملخص اللوحة' };
    const parts = path.split('›').map((x) => x.trim()).filter(Boolean);
    const out = [];
    for (const [i, p] of parts.entries()) {
        if (i === 0 && FILE[p]) {
            out.push(FILE[p]);
            continue;
        }
        for (const seg of p.split('.')) {
            const k = seg.replace(/\[.*?\]/g, '').trim();
            if (!k)
                continue;
            if (/[\u0600-\u06FF]/.test(k)) {
                out.push(k);
                continue;
            }
            const l = fieldLabel(doc, k);
            if (l)
                out.push(l);
        }
    }
    return out.join(' ← ');
}
