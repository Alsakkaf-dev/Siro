export const DAY_MS = 86_400_000;
/** تاريخ ISO (YYYY-MM-DD) → UTC ms. يرجع NaN لو غير صالح. */
export function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m)
        return Number.NaN;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const ms = Date.UTC(y, mo - 1, d);
    const chk = new Date(ms);
    if (chk.getUTCFullYear() !== y || chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d)
        return Number.NaN;
    return ms;
}
export function isValidISODate(s) {
    return !Number.isNaN(parseISO(s));
}
export function toISO(ms) {
    return new Date(ms).toISOString().slice(0, 10);
}
/** اليوم المحلي (للجهاز) كـ UTC ms منتصف الليل. */
export function todayMs(now = new Date()) {
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}
/** week(date) = floor((date − week1_start) / 7) + 1  (من الـ Blueprint) */
export function weekOf(dateMs, startMs) {
    return Math.floor((dateMs - startMs) / (7 * DAY_MS)) + 1;
}
export function weekStartMs(sem, k) {
    return parseISO(sem.start_date) + (k - 1) * 7 * DAY_MS;
}
export function weekEndMs(sem, k) {
    return weekStartMs(sem, k) + 6 * DAY_MS;
}
/** الأسبوع الحالي محسوب تلقائيًا من تاريخ بداية الفصل. */
export function phaseOf(nowMs, sem) {
    const start = parseISO(sem.start_date);
    const examStart = sem.exam_start ? parseISO(sem.exam_start) : Number.NaN;
    const examEnd = sem.exam_end ? parseISO(sem.exam_end) : Number.NaN;
    if (nowMs < start)
        return { kind: 'before', week: null, daysToStart: Math.round((start - nowMs) / DAY_MS) };
    if (!Number.isNaN(examStart) && !Number.isNaN(examEnd) && nowMs >= examStart && nowMs <= examEnd) {
        return { kind: 'exam', week: null, daysToStart: null };
    }
    const w = weekOf(nowMs, start);
    if (w >= 1 && w <= sem.weeks) {
        return { kind: sem.break_weeks.includes(w) ? 'break' : 'week', week: w, daysToStart: null };
    }
    const afterEnd = !Number.isNaN(examEnd) ? nowMs > examEnd : true;
    if (afterEnd)
        return { kind: 'after', week: null, daysToStart: null };
    return { kind: 'gap', week: null, daysToStart: null };
}
/** حالة الفصل حسب التواريخ: سابق / حالي / قادم */
export function semesterStatus(nowMs, sem) {
    const p = phaseOf(nowMs, sem);
    if (p.kind === 'before')
        return 'future';
    if (p.kind === 'after')
        return 'past';
    return 'current';
}
/** عمود التقييم في الخريطة: 0 = غير معروف، 1..weeks أسابيع، weeks+1 = فترة الامتحانات */
export function assessmentColumn(a, sem) {
    const examCol = sem.weeks + 1;
    switch (a.timing) {
        case 'unknown':
            return 0;
        case 'exam':
            return examCol;
        case 'week':
            return a.week_no !== null && a.week_no >= 1 && a.week_no <= sem.weeks ? a.week_no : a.week_no !== null && a.week_no > sem.weeks ? examCol : 0;
        case 'date': {
            if (!a.due_date)
                return 0;
            const ms = parseISO(a.due_date);
            if (Number.isNaN(ms))
                return 0;
            const examStart = sem.exam_start ? parseISO(sem.exam_start) : Number.NaN;
            if (!Number.isNaN(examStart) && ms >= examStart)
                return examCol;
            const w = weekOf(ms, parseISO(sem.start_date));
            if (w > sem.weeks)
                return examCol;
            if (w < 1)
                return 1;
            return w;
        }
    }
}
/** وقت الاستحقاق التقريبي للترتيب (ms) — نهاية الأسبوع للأسابيع، ونهاية فترة الامتحانات للامتحانات. */
export function dueSortMs(a, sem) {
    if (a.timing === 'unknown')
        return null;
    if (a.timing === 'date') {
        const ms = a.due_date ? parseISO(a.due_date) : Number.NaN;
        return Number.isNaN(ms) ? null : ms;
    }
    if (a.timing === 'exam') {
        const ms = sem.exam_start ? parseISO(sem.exam_start) : Number.NaN;
        return Number.isNaN(ms) ? weekEndMs(sem, sem.weeks) + DAY_MS : ms;
    }
    if (a.week_no === null)
        return null;
    return weekEndMs(sem, a.week_no);
}
export function isOpen(a) {
    return a.status !== 'graded' && a.status !== 'submitted';
}
/** المواعيد القادمة (غير المنتهية والمعروفة) مرتبة. */
export function upcomingDeadlines(assessments, sem, nowMs) {
    return assessments
        .filter((a) => {
        if (!isOpen(a))
            return false;
        const t = dueSortMs(a, sem);
        return t !== null && t >= nowMs;
    })
        .sort((a, b) => (dueSortMs(a, sem) ?? 0) - (dueSortMs(b, sem) ?? 0) || a.sort - b.sort);
}
/** الحمل لكل أسبوع 1..weeks. الأسبوع المزدحم: وزنه ≥ 70% من أعلى أسبوع وفيه بندان على الأقل (نفس قاعدة الـ Dashboard). */
export function weekLoads(assessments, sem) {
    const loads = [];
    for (let k = 0; k <= sem.weeks + 1; k++)
        loads.push({ weight: 0, count: 0, crowded: false });
    for (const a of assessments) {
        const col = assessmentColumn(a, sem);
        if (col >= 1 && col <= sem.weeks && a.crowd) {
            const l = loads[col];
            l.weight += a.weight;
            l.count += 1;
        }
    }
    let max = 0;
    for (let k = 1; k <= sem.weeks; k++)
        max = Math.max(max, loads[k].weight);
    for (let k = 1; k <= sem.weeks; k++) {
        const l = loads[k];
        l.crowded = max > 0 && l.weight >= 0.7 * max && l.count >= 2 && !sem.break_weeks.includes(k);
    }
    return loads;
}
export function weightSum(assessments) {
    return Math.round(assessments.reduce((s, a) => s + a.weight, 0) * 100) / 100;
}
