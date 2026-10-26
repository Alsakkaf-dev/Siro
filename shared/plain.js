/**
 * تنظيف عرض: رموز راشد الداخلية (R-020، D-R-019، RC-004) وأسماء الملفات والحقول لا تعني شيئًا لمحمد.
 * نعرضها بعربية بسيطة. البيانات الأصلية لا تتغيّر؛ هذا للعرض فقط.
 */
const FILES = [
    [/CURRENT\.md/g, 'ملف الحالة'], [/LEDGER\.csv/g, 'السجل المالي'], [/ledger_full\.json/g, 'السجل المالي الكامل'], [/BODY_GOALS\.md/g, 'ملف أهداف الجسم'], [/DECISIONS\.md/g, 'سجل القرارات'],
    [/daily_summary\.csv/g, 'الملخص اليومي'], [/body\.csv/g, 'سجل الوزن'], [/finance\.json/g, 'ملف المال'], [/prayers\.json/g, 'ملف الصلاة'], [/habits\.json/g, 'ملف العادات'], [/body\.json/g, 'ملف الجسم'],
    [/routine\.json/g, 'ملف الروتين'], [/dashboard_summary\.json/g, 'ملخص اللوحة'], [/exports_meta\.json/g, 'بيانات التصدير'],
];
const FIELDS = [
    [/cash_delta/g, 'الأثر على الصندوق'], [/beginner_safe\s*=\s*false/g, 'ليس للمبتدئ'], [/beginner_safe\s*=\s*true/g, 'للمبتدئ'], [/beginner_safe/g, 'أمان المبتدئ'],
    [/current_value/g, 'القيمة الجاهزة'], [/value_text_ar/g, 'نص القيمة'], [/missing_text_ar/g, 'نص غير المسجل'], [/generated_at/g, 'وقت التوليد'], [/latest_recorded_weight/g, 'آخر وزن مسجّل'], [/weight_history/g, 'سجل الوزن'], [/goal_kg/g, 'الوزن المستهدف'], [/balance_history/g, 'سجل الأرصدة'], [/total_remaining/g, 'القضاء المتبقي'], [/done_today/g, 'المنجز اليوم'], [/done_total/g, 'المنجز الكلي'],
];
export function plainText(s) {
    if (!/[A-Za-z]/.test(s))
        return s;
    let t = s;
    /* مسارات: نترك آخر جزء فقط */
    t = t.replace(/(?:[\w\u0600-\u06FF.]+[\\/])+([\w\u0600-\u06FF.]+\.(?:md|csv|json|txt))/g, '$1');
    t = t.replace(/\s*[(（][^()（）]*?(?:\bD-R-\d+|\bRC-\d+|\bR-\d+|\bD-\d+)[^()（）]*?[)）]/g, '');
    t = t.replace(/\bD-R-\d+\b|\bD-\d+\b/g, 'قرار مسجّل').replace(/\bRC-\d+\b/g, 'تعارض مسجّل').replace(/\bR-\d+\b/g, 'بند مسجّل');
    for (const [re, ar] of [...FILES, ...FIELDS])
        t = t.replace(re, ar);
    return t.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.،:؛])/g, '$1').trim();
}
const SKIP = /^(id|key|name|file|path|columns|date|from|to|event_id|row_id|order|type|unit|currency|wallet|status|kind|.*_id|.*_ids|.*_key|.*_keys|.*_at)$/;
/** يمرّر نصوص الحقول المعروضة عبر plainText (يتخطى المعرّفات والتواريخ). */
export function plainDeep(v, key = '') {
    if (typeof v === 'string')
        return (SKIP.test(key) ? v : plainText(v));
    if (Array.isArray(v))
        return v.map((x) => plainDeep(x, key));
    if (v && typeof v === 'object')
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plainDeep(x, k)]));
    return v;
}
export const UNIT_AR = { kg: 'كغ', minutes: 'دقيقة', grams: 'غرام', liters: 'لتر', weekday: 'يوم من الأسبوع', date: 'تاريخ', RM: 'رنجت', percent: '%', cm: 'سم', hours: 'ساعة' };
const KEY_AR = { monthly_income: 'الدخل الشهري', next_weight_reading: 'قراءة الوزن القادمة', weekly_weigh_in_day: 'يوم الوزن الأسبوعي', vape_baseline_per_day: 'وقت الفيب الأساسي في اليوم', vape_end_goal: 'هدف نهاية تقليل الفيب', habits_start_date: 'تاريخ بدء العادات' };
/** عنوان عربي لحقل ناقص: label_ar/title_ar إن وُجد، ثم قاموس مفاتيح معروفة، ثم ما قبل «:» في note_ar، وإلا «حقل غير مسمّى». */
export function missingTitle(key, note, label) {
    if (label && label.trim())
        return label.trim();
    if (KEY_AR[key])
        return KEY_AR[key];
    const head = (note ?? '').split(/[:：]/)[0]?.trim() ?? '';
    if (head && head.length <= 70 && /[\u0600-\u06FF]/.test(head) && head !== (note ?? '').trim())
        return plainText(head);
    const first = (note ?? '').split(/[.؟!]/)[0]?.trim() ?? '';
    return first && /[\u0600-\u06FF]/.test(first) ? plainText(first.length > 60 ? `${first.slice(0, 57)}…` : first) : 'حقل غير مسمّى';
}
