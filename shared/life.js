/** منصة الحياة — أنواع صادرات راشد (قراءة فقط) ودوال مشتركة بين الخادم والواجهة. لا تعتمد على zod كي لا تُحمَّل في الواجهة. */
export const DEFAULT_LIFE_ROOT = 'C:\\Users\\GIGIABYTE\\Desktop\\Storage\\The_Boots\\Platform\\exchange\\rashed';
export const LIFE_DATA_FILES = ['dashboard_summary', 'finance', 'prayers', 'habits', 'body', 'routine'];
export const LIFE_FILE_LABEL = {
    dashboard_summary: 'ملخص الشاشة الرئيسية',
    finance: 'المال',
    prayers: 'الصلاة',
    habits: 'العادات',
    body: 'الجسم',
    routine: 'الروتين',
};
/** حدود القِدم الافتراضية من docs/REFRESH_PROTOCOL_AR.md (افتراض من راشد) — تُستعمل فقط إن غابت stale_after_hours عن exports_meta. */
export const PROTOCOL_STALE_HOURS = { dashboard_summary: 24, finance: 24, prayers: 12, habits: 24, body: 168, routine: 168 };
export const LIFE_DOCS = ['DATA_DICTIONARY_AR.md', 'PROPOSALS.md', 'FINANCE_SPEC_AR.md', 'HABITS_SPEC_AR.md', 'SPORTS_CONTENT_AR.md', 'REFRESH_PROTOCOL_AR.md', 'SITE_IDEAS_AR.md'];
/** ملفات المحتوى (JSON) داخل docs: مكتبة التمارين وقوالب الخطة وبدائل العادات. */
export const LIFE_CONTENT = ['SPORTS_EXERCISES.json', 'SPORTS_PLANS_AR.json', 'HABITS_ALTERNATIVES_AR.json', 'GLOSSARY_AR.json', 'FINANCE_INSIGHTS_AR.json', 'PRAYER_QADA_PLAN_AR.json', 'ROUTINE_BLOCKS_AR.json', 'ledger_full.json', 'FIELD_LABELS_AR.json'];
/** ملفات المحتوى التي تقع في جذر مجلد راشد (لا داخل docs). */
export const LIFE_CONTENT_AT_ROOT = ['ledger_full.json'];
export const LIFE_QADA_CHOICE_RE = /^[a-z0-9_]{1,20}$/;
export const COMMAND_TYPES = ['log_expense', 'log_prayer', 'start_habit', 'habit_relapse', 'refresh_exports'];
export const FRESH_LABEL = { fresh: 'محدّث', stale: 'قديم', expired: 'منتهي', unavailable: 'غير متاح', inconsistent: 'غير متسق' };
const SEVERITY = { fresh: 0, stale: 1, inconsistent: 2, expired: 3, unavailable: 4 };
export const worstOf = (xs) => xs.reduce((w, x) => (SEVERITY[x] > SEVERITY[w] ? x : w), 'fresh');
/** قاعدة REFRESH_PROTOCOL §2: قديم بعد stale_after_hours، منتهي بعد 3 أضعافها، غير متسق إن اختلف الحجم الفعلي عن bytes، غير متاح إن غاب الملف أو الميتا. */
/** يحلّل generated_at؛ بلا منطقة زمنية يُفترض توقيت ماليزيا (+08:00) لا توقيت الجهاز. */
export function parseGenerated(v) {
    if (!v)
        return NaN;
    const s = v.trim();
    return Date.parse(/^\d{4}-\d{2}-\d{2}(T[\d:.]+)?$/.test(s) ? (s.includes('T') ? `${s}+08:00` : `${s}T00:00:00+08:00`) : s);
}
export function classifyFreshness(i) {
    if (i.fileError || i.bytesActual === null || i.bytesActual === undefined)
        return { state: 'unavailable', ageHours: null };
    const t = parseGenerated(i.generatedAt);
    if (!Number.isFinite(t))
        return { state: 'unavailable', ageHours: null };
    /* وقت توليد في المستقبل (أكثر من 5 دقائق) لا يعني «الآن»: نعتبره غير متسق ولا نعرض عمرًا */
    if (t - i.nowMs > 5 * 60_000)
        return { state: 'inconsistent', ageHours: null };
    const age = Math.max(0, (i.nowMs - t) / 3_600_000);
    if (typeof i.bytesMeta === 'number' && i.bytesMeta !== i.bytesActual)
        return { state: 'inconsistent', ageHours: age };
    const limit = i.staleAfterHours;
    if (typeof limit !== 'number' || !(limit > 0))
        return { state: 'fresh', ageHours: age };
    if (age <= limit)
        return { state: 'fresh', ageHours: age };
    if (age <= limit * 3)
        return { state: 'stale', ageHours: age };
    return { state: 'expired', ageHours: age };
}
export function ageText(h) {
    if (h === null)
        return 'غير معروف';
    if (h < 1 / 30)
        return 'الآن'; /* أقل من دقيقتين فقط */
    if (h < 1)
        return `قبل ${Math.max(2, Math.round(h * 60))} دقيقة`;
    if (h < 48)
        return `قبل ${Math.round(h)} ساعة`;
    return `قبل ${Math.round(h / 24)} يوم`;
}
export const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_AR = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
/** فحص بنيوي خفيف: يُرجع وصف أول مشكلة أو null. يحمي الواجهة من تغيّر تنسيق الملفات دون أن نرفض حقولًا جديدة. */
export function checkShape(name, d) {
    const o = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
    if (!o(d))
        return 'الملف ليس كائن JSON';
    const arr = (obj, key, path) => {
        if (!o(obj))
            return null;
        const v = obj[key];
        return v === undefined || v === null || Array.isArray(v) ? null : `${path}.${key} يجب أن يكون قائمة`;
    };
    const sub = (obj, key, path) => {
        if (!o(obj))
            return null;
        const v = obj[key];
        return v === undefined || v === null || o(v) ? null : `${path}.${key} يجب أن يكون كائنًا`;
    };
    const checks = [];
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
export function missingInputs(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj))
        return [];
    return Object.entries(obj)
        .filter(([, v]) => !!v && typeof v === 'object' && !Array.isArray(v) && 'value' in v)
        .map(([key, v]) => {
        const o = v;
        return { key, label: strOrNull(o['label_ar']) ?? strOrNull(o['title_ar']) ?? strOrNull(o['name_ar']), value: o['value'], unit: strOrNull(o['unit']), note: strOrNull(o['note_ar']) ?? '', confidence: strOrNull(o['confidence']), needed_for: strOrNull(o['needed_for_ar']), related: strOrNull(o['related']) };
    });
}
export const countMissing = (items) => items.filter((i) => i.value === null || i.value === undefined).length;
export const UNCATEGORIZED = 'غير مصنّف';
export function spendingByCategory(tx) {
    const m = new Map();
    for (const t of tx) {
        if (t.type !== 'expense')
            continue;
        const k = t.category_ar?.trim() || UNCATEGORIZED;
        const cur = m.get(k) ?? { total: 0, count: 0 };
        cur.total += t.amount;
        cur.count++;
        m.set(k, cur);
    }
    return [...m].map(([category, v]) => ({ category, total: Math.round(v.total * 100) / 100, count: v.count })).sort((a, b) => b.total - a.total);
}
export function spendingByDay(tx) {
    const m = new Map();
    for (const t of tx)
        if (t.type === 'expense')
            m.set(t.date, (m.get(t.date) ?? 0) + t.amount);
    return [...m].map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date));
}
const dayNum = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;
/** معدّل صرف «اليومية» = مجموع المصاريف التي wallet=يومية وcash_delta<0 ÷ عدد الأيام بين أول وآخر حركة منها (شاملة). null إن لم توجد حركات. */
export function dailySpendRate(tx) {
    const rows = tx.filter((t) => t.type === 'expense' && t.wallet === 'يومية' && typeof t.cash_delta === 'number' && t.cash_delta < 0);
    if (!rows.length)
        return null;
    const ds = rows.map((r) => dayNum(r.date));
    const days = Math.max(...ds) - Math.min(...ds) + 1;
    const total = rows.reduce((s, r) => s + r.amount, 0);
    return { rate: Math.round((total / days) * 100) / 100, days, total: Math.round(total * 100) / 100, count: rows.length };
}
export const coverage = (balance, perDay) => typeof balance === 'number' && typeof perDay === 'number' && perDay > 0 ? Math.round((balance / perDay) * 100) / 100 : null;
const strOrNull = (v) => (typeof v === 'string' && v.trim() ? v : null);
const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** يقرأ balance_history (أو balances_history) من finance.json بأشكال متسامحة. لا يخترع نقاطًا: ما لا يُفهم يُعدّ في skipped. */
export function parseBalanceHistory(f) {
    const field = f?.balance_history !== undefined ? 'balance_history' : f?.balances_history !== undefined ? 'balances_history' : null;
    const fr = (f ?? {});
    const rawOmitted = fr['balance_history_omitted'] ?? fr['balances_history_omitted'];
    const omitted = Array.isArray(rawOmitted)
        ? rawOmitted
            .filter((x) => !!x && typeof x === 'object')
            .map((x) => ({ rows: strOrNull(x['rows']), dates: strOrNull(x['dates']), reason: strOrNull(x['reason_ar']) ?? strOrNull(x['reason']) ?? '' }))
            .filter((x) => x.reason || x.rows || x.dates)
        : [];
    const title = strOrNull(fr['balance_history_title_ar']);
    const method = strOrNull(fr['balance_history_method']);
    if (!f || !field)
        return { points: [], skipped: 0, field: null, title, method, omitted };
    const raw = fr[field];
    const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray(raw.points) ? (raw.points) : null;
    if (!list)
        return { points: [], skipped: 0, field, title, method, omitted };
    const points = [];
    let skipped = 0;
    for (const e of list) {
        if (!e || typeof e !== 'object') {
            skipped++;
            continue;
        }
        const o = e;
        const when = [o['as_of'], o['date'], o['at'], o['time'], o['timestamp']].find((x) => typeof x === 'string');
        const t = when ? Date.parse(when.length === 10 ? `${when}T12:00:00+08:00` : when) : NaN;
        if (!Number.isFinite(t)) {
            skipped++;
            continue;
        }
        const bag = {};
        const src = o['balances'] && typeof o['balances'] === 'object' ? o['balances'] : o;
        for (const k of ['treasury', 'monthly', 'daily', 'total'])
            bag[k] = src[k];
        if (Array.isArray(o['items']))
            for (const it of o['items'])
                if (it && typeof it['key'] === 'string')
                    bag[it['key']] = it['amount'];
        const p = { t, date: when, dateOnly: when.length === 10, treasury: numOrNull(bag['treasury']), monthly: numOrNull(bag['monthly']), daily: numOrNull(bag['daily']), total: numOrNull(bag['total']), event: strOrNull(o['event_ar']), note: strOrNull(o['note_ar']), confidence: strOrNull(o['confidence']), sourceRow: strOrNull(o['source_row']) };
        if (p.treasury === null && p.monthly === null && p.daily === null && p.total === null) {
            skipped++;
            continue;
        }
        points.push(p);
    }
    points.sort((a, b) => a.t - b.t);
    return { points, skipped, field, title, method, omitted };
}
/** كغ كما سجّله راشد (حتى منزلتين): 83.65 تبقى 83.65 ولا تصير 83.7. */
export const kgText = (n) => (typeof n === 'number' && Number.isFinite(n) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100) : '—');
export function weightProgress(b) {
    if (!b)
        return null;
    const gp = b.goal_progress;
    const num = (v) => typeof v === 'number' && Number.isFinite(v);
    const baseline = num(gp?.baseline_kg) ? gp.baseline_kg : b.items?.find((i) => i.key === 'weight')?.value;
    const goal = num(gp?.goal_kg) ? gp.goal_kg : b.goal_kg ?? b.items?.find((i) => i.key === 'goal_weight')?.value;
    const latest = num(b.latest_weight_kg) ? b.latest_weight_kg : num(gp?.latest_weight_kg) ? gp.latest_weight_kg : b.latest_recorded_weight?.value_kg;
    if (typeof baseline !== 'number' || typeof goal !== 'number' || typeof latest !== 'number' || baseline <= goal)
        return null;
    /* v9: القيم الجاهزة من راشد تُفضَّل؛ «النزول عن خط الأساس» و«المتبقي للهدف» رقمان مختلفان ولا يُخلطان */
    const lost = num(gp?.change_since_baseline_kg) ? Math.round(-gp.change_since_baseline_kg * 100) / 100 : Math.round((baseline - latest) * 100) / 100;
    const remaining = num(gp?.remaining_to_goal_kg) ? gp.remaining_to_goal_kg : Math.round((latest - goal) * 100) / 100;
    return { baseline, latest, goal, lost, remaining, pct: Math.max(0, Math.min(100, (lost / (baseline - goal)) * 100)) };
}
export const DAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_AR = { sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت' };
export const toMin = (s) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export function blocksForDay(r, day) {
    if (!r)
        return [];
    const all = [...(r.daily_blocks ?? []), ...(r.weekly_study_blocks ?? [])];
    const out = [];
    for (const b of all) {
        if (!b.days?.includes(day))
            continue;
        const s = toMin(b.start);
        const e = toMin(b.end);
        if (s === null || e === null)
            continue;
        out.push({ b, start: s, end: e <= s ? e + 1440 : e });
    }
    return out.sort((a, b) => a.start - b.start || a.end - b.end);
}
/** الكتلة الحالية والتالية بتوقيت ماليزيا. */
export function nowAndNext(r, nowMs) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(nowMs);
    const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
    const day = get('weekday').slice(0, 3).toLowerCase();
    const minute = Number(get('hour')) * 60 + Number(get('minute'));
    const list = blocksForDay(r, day);
    return { day, minute, current: list.filter((x) => x.start <= minute && minute < x.end), next: list.find((x) => x.start > minute) ?? null };
}
export const EXPENSE_BOXES = ['treasury', 'monthly', 'daily', 'unknown'];
export const PAY_SOURCES = ['rhb', 'tng', 'cash', 'unknown'];
export const HABIT_KEYS = ['vape', 'tea_sugar', 'water', 'sleep', 'food', 'workout'];
export const COMMAND_LABEL = { log_expense: 'تسجيل مصروف', log_prayer: 'تسجيل صلاة', start_habit: 'بدء عادة', habit_relapse: 'تسجيل انتكاسة', refresh_exports: 'طلب تحديث الصادرات' };
/** يتحقق من payload حسب النوع؛ يُرجع {field: رسالة}. */
export function validatePayload(type, p) {
    const e = {};
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
    const oneOf = (v, xs) => typeof v === 'string' && xs.includes(v);
    switch (type) {
        case 'log_expense':
            if (!isDate(p['date']))
                e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
            if (typeof p['amount'] !== 'number' || !(p['amount'] > 0) || p['amount'] > 100000)
                e['amount'] = 'مبلغ موجب';
            if (p['currency'] !== 'RM')
                e['currency'] = 'العملة RM فقط';
            if (!oneOf(p['box'], EXPENSE_BOXES))
                e['box'] = 'اختر الصندوق (أو unknown)';
            if (typeof p['label_ar'] !== 'string' || !p['label_ar'].trim())
                e['label_ar'] = 'وصف قصير مطلوب';
            if (typeof p['category_ar'] !== 'string' || !p['category_ar'].trim())
                e['category_ar'] = 'الفئة مطلوبة';
            if (!oneOf(p['payment_source'], PAY_SOURCES))
                e['payment_source'] = 'اختر مصدر الدفع (أو unknown)';
            break;
        case 'log_prayer':
            if (!isDate(p['date']))
                e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
            if (!oneOf(p['prayer'], PRAYER_KEYS))
                e['prayer'] = 'اختر الصلاة';
            if (!oneOf(p['status'], ['in_time', 'late', 'missed']))
                e['status'] = 'اختر الحالة';
            if (!oneOf(p['kind'], ['fard', 'qada']))
                e['kind'] = 'فرض أو قضاء';
            break;
        case 'start_habit':
            if (!oneOf(p['habit'], HABIT_KEYS))
                e['habit'] = 'اختر العادة';
            if (!isDate(p['start_date']))
                e['start_date'] = 'تاريخ بصيغة YYYY-MM-DD';
            break;
        case 'habit_relapse':
            if (!oneOf(p['habit'], HABIT_KEYS))
                e['habit'] = 'اختر العادة';
            if (!isDate(p['date']))
                e['date'] = 'تاريخ بصيغة YYYY-MM-DD';
            break;
        case 'refresh_exports':
            if (!Array.isArray(p['files']) || p['files'].some((x) => typeof x !== 'string'))
                e['files'] = 'قائمة أسماء ملفات (أو فارغة للكل)';
            break;
    }
    if (p['note_ar'] !== undefined && (typeof p['note_ar'] !== 'string' || p['note_ar'].length > 500))
        e['note_ar'] = 'ملاحظة حتى 500 حرف';
    return e;
}
export function commandId(now, seq) {
    const kl = new Date(now.getTime() + 8 * 3_600_000).toISOString();
    return `CMD-${kl.slice(0, 10).replace(/-/g, '')}-${kl.slice(11, 19).replace(/:/g, '')}-${String(seq).padStart(3, '0')}`;
}
export const COMMAND_ID_RE = /^CMD-\d{8}-\d{6}-\d{3}$/;
