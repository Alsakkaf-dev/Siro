/**
 * المراجعة الأسبوعية (docs/WEEKLY_REVIEW_SPEC_AR.md). دوال نقية: تقرأ ملفات راشد المحمّلة ولا تكتب شيئًا.
 * قواعد ثابتة: القيمة الناقصة ليست صفرًا أبدًا (null ⇒ «غير مسجل»)، و«غير معروف» لا يدخل المقام، والرقم المحسوب يأخذ أضعف وسم بين مدخلاته.
 */
import { parseGenerated, blocksForDay, DAY_AR, DAY_CODES, PRAYER_AR, PRAYER_KEYS, missingInputs, parseBalanceHistory, toMin } from './life.js';
const ORDER = ['مثبت', 'محسوب', 'افتراض', 'غير مسجل'];
export const TAG_TERM = { 'مثبت': 'conf_confirmed', 'محسوب': 'conf_computed', 'افتراض': 'conf_assumption', 'غير مسجل': 'conf_not_recorded' };
const asTag = (c) => (c === 'مثبت' || c === 'محسوب' || c === 'افتراض' || c === 'غير مسجل' ? c : null);
/** أول وسم معروف من المرشحين (حقل ← الكتلة الأب). إن لم يوجد: «افتراض» (أحذر وسم لا يدّعي ثباتًا). */
export const tagFrom = (...cs) => cs.map(asTag).find((t) => t !== null) ?? 'افتراض';
/** أضعف وسم: مثبت > محسوب > افتراض > غير مسجل. القائمة الفارغة ⇒ غير مسجل. */
export const weakest = (tags) => (tags.length ? tags.reduce((w, t) => (ORDER.indexOf(t) > ORDER.indexOf(w) ? t : w), 'مثبت') : 'غير مسجل');
export const NOT_REC = 'غير مسجل';
export const UNKNOWN = 'غير معروف';
export const val = (value, tag, field) => (value === null || value === undefined ? { value: null, tag: 'غير مسجل', field } : { value, tag, field });
export const numOr = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const r2 = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;
/* ───── النافذة ───── */
const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const ms = (d) => Date.parse(`${d}T00:00:00Z`);
/** تاريخ اليوم بتوقيت ماليزيا (YYYY-MM-DD). */
/** يوم ماليزيا (YYYY-MM-DD) لوقت ISO؛ بلا منطقة يُفترض +08:00. */
export function klDay(iso) {
    const t = parseGenerated(iso);
    return Number.isFinite(t) ? new Date(t + 8 * 3_600_000).toISOString().slice(0, 10) : null;
}
export function klToday(nowMs) {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(nowMs);
    return p;
}
export function reviewWindow(nowMs, offset = 0) {
    const today = klToday(nowMs);
    const t = ms(today);
    const dow = new Date(t).getUTCDay();
    const start = t - dow * DAY + offset * 7 * DAY;
    const days = Array.from({ length: 7 }, (_, i) => iso(start + i * DAY));
    const nextDays = Array.from({ length: 7 }, (_, i) => iso(start + (7 + i) * DAY));
    return { offset, start: days[0], end: days[6], days, elapsed: days.filter((d) => d <= today), today, partial: today <= days[6], nextStart: nextDays[0], nextEnd: nextDays[6], nextDays };
}
const inWin = (d, w) => !!d && d >= w.start && d <= w.end;
export const freshRows = (files) => files.map((f) => ({ name: f.name, label: f.label, generated_at: f.generated_at, stale: f.state !== 'fresh', state: f.state, age_hours: f.age_hours }));
const normCell = (v) => (v === 'in_time' || v === 'late' || v === 'missed' ? v : v === null || v === undefined ? 'none' : 'unknown');
export function prayerWeek(p, w, missing) {
    if (!p)
        return null;
    const att = p.attendance;
    const rowsIn = (att?.days ?? []).filter((d) => inWin(d.date, w));
    const byDate = new Map(rowsIn.map((d) => [d.date, d]));
    const rows = w.days.map((date) => {
        const d = byDate.get(date);
        const cells = Object.fromEntries(PRAYER_KEYS.map((k) => [k, d ? normCell(d.status?.[k]) : date > w.today ? 'future' : date === w.today ? 'unknown' : 'none']));
        return { date, cells, hasRow: !!d };
    });
    const missingDates = w.elapsed.filter((d) => !byDate.has(d));
    let counts = null;
    if (rowsIn.length) {
        counts = { in_time: 0, late: 0, missed: 0, unknown: 0 };
        for (const d of rowsIn) {
            if (d.counts)
                for (const k of ['in_time', 'late', 'missed', 'unknown'])
                    counts[k] += numOr(d.counts[k]) ?? 0;
            else
                for (const k of PRAYER_KEYS)
                    counts[normCell(d.status?.[k]) === 'none' ? 'unknown' : normCell(d.status?.[k])]++;
        }
    }
    const countsTag = counts ? weakest(rowsIn.map((d) => tagFrom(d.confidence, att?.totals_confidence))) : 'غير مسجل';
    const den = counts ? counts.in_time + counts.late + counts.missed : 0;
    const onTime = { pct: counts && den > 0 ? r1((counts.in_time / den) * 100) : null, num: counts?.in_time ?? 0, den, tag: counts && den > 0 ? 'محسوب' : 'غير مسجل' };
    if (missingDates.length)
        missing.push({ section: 'الصلاة', label: `أيام بلا صف حضور (${missingDates.length})`, field: 'prayers.json › attendance.days[]' });
    const q = p.qada;
    const remaining = PRAYER_KEYS.map((key) => ({ key, name: q?.remaining?.[key]?.name_ar ?? PRAYER_AR[key], count: numOr(q?.remaining?.[key]?.count) }));
    const known = remaining.every((r) => r.count !== null);
    const sum = known ? remaining.reduce((s, r) => s + (r.count ?? 0), 0) : null;
    const qTag = tagFrom(q?.confidence);
    const hist = (q?.history ?? []).filter((h) => typeof h.date === 'string' && numOr(h.total) !== null).sort((a, b) => a.date.localeCompare(b.date));
    const upTo = w.end < w.today ? w.end : w.today;
    const inside = hist.filter((h) => h.date >= w.start && h.date <= upTo).at(-1);
    const before = hist.filter((h) => h.date < w.start).at(-1);
    const inc = inside && before ? numOr(inside.total) - numOr(before.total) : null;
    const total = val(numOr(q?.total_remaining), qTag, 'prayers.json › qada.total_remaining');
    const doneTotal = val(numOr(q?.done_total), tagFrom(q?.done_confidence, q?.confidence), 'prayers.json › qada.done_total');
    const doneToday = val(numOr(q?.done_today), tagFrom(q?.done_confidence, q?.confidence), 'prayers.json › qada.done_today');
    const asOfDay = q?.as_of ? klDay(q.as_of) : null;
    const doneTodayStale = asOfDay !== null && asOfDay !== w.today && numOr(q?.done_today) !== null ? { value: numOr(q?.done_today), date: asOfDay } : null;
    const doneWeek = val(null, 'غير مسجل', 'لا يوجد حقل «القضاء المنجز هذا الأسبوع» في prayers.json');
    missing.push({ section: 'الصلاة', label: 'القضاء المنجز هذا الأسبوع', field: doneWeek.field });
    if (total.value === null)
        missing.push({ section: 'الصلاة', label: 'مجموع القضاء المتبقي', field: total.field });
    if (inc === null)
        missing.push({ section: 'الصلاة', label: 'زيادة القضاء هذا الأسبوع (لا نقطة قبل النافذة أو داخلها)', field: 'prayers.json › qada.history[]' });
    return {
        counts, countsTag, rows, missingDates, onTime, coverageNote: att?.coverage_note_ar ?? null,
        qada: {
            remaining, total, sum, sumMatches: sum !== null && total.value !== null ? sum === total.value : null,
            asOf: q?.as_of ?? null, pending: q?.pending_ar ?? null, tag: qTag, doneTotal, doneToday: doneTodayStale ? val(null, 'غير مسجل', 'prayers.json › qada.done_today') : doneToday, doneWeek, doneTodayStale,
            increase: { value: inc, fromDate: before?.date ?? null, toDate: inside?.date ?? null, tag: inc === null ? 'غير مسجل' : weakest([tagFrom(q?.confidence), 'محسوب']) },
            baseline: { total: numOr(q?.baseline?.total), date: q?.baseline?.date ?? null, tag: tagFrom(q?.baseline?.confidence, q?.confidence) },
        },
    };
}
const YES = 'نعم', NO = 'لا';
const ynu = (v) => (v === 'yes' || v === true ? 'yes' : v === 'no' || v === false ? 'no' : v === 'unknown' ? 'unknown' : null);
const num = (n) => String(Math.round(n * 100) / 100);
export function habitsWeek(h, w, missing) {
    if (!h)
        return null;
    const out = [];
    for (const hb of h.habits ?? []) {
        const rowsAll = (hb.log ?? []);
        const rows = new Map();
        for (const r of rowsAll)
            if (inWin(r['date'], w))
                rows.set(r['date'], r);
        const noRow = w.elapsed.filter((d) => !rows.has(d));
        const fp = `habits.json › habits[key=${hb.key}]`;
        const rowTag = (rs) => weakest(rs.map((r) => tagFrom(r['confidence'], hb.counters?.confidence)));
        const lines = [];
        const noRowLine = () => {
            if (noRow.length) {
                lines.push({ label: 'أيام بلا صف في السجل', text: `${noRow.length}`, tag: 'غير مسجل', field: `${fp}.log[]`, note: 'غير مسجل — ليس «لم يلتزم» وليس 0' });
                missing.push({ section: 'العادات', label: `${hb.name_ar}: أيام بلا صف (${noRow.length})`, field: `${fp}.log[]` });
            }
        };
        const rs = [...rows.values()];
        const unrecorded = (label, field) => {
            lines.push({ label, text: null, tag: 'غير مسجل', field });
            missing.push({ section: 'العادات', label: `${hb.name_ar}: ${label}`, field });
        };
        if (hb.key === 'vape') {
            if (rs.length) {
                const c = { yes: 0, no: 0, unknown: 0 };
                for (const r of rs)
                    c[ynu(r['kept_limit']) ?? 'unknown']++;
                lines.push({ label: 'الالتزام بالحد (أيام النافذة المسجلة)', text: `نعم ${c.yes} · لا ${c.no} · ${UNKNOWN} ${c.unknown}`, tag: rowTag(rs), field: `${fp}.log[].kept_limit`, note: `${UNKNOWN} لا يُحسب التزامًا ولا يدخل المقام` });
            }
            else
                unrecorded('الالتزام بالحد في النافذة', `${fp}.log[].kept_limit`);
            noRowLine();
            const rl = hb.counters?.relapses;
            if (Array.isArray(rl))
                lines.push({ label: 'الانتكاسات المسجلة (من البداية)', text: String(rl.length), tag: tagFrom(hb.counters?.confidence), field: `${fp}.counters.relapses[]` });
            const tdy = hb.today;
            if (tdy?.reduction_min != null)
                lines.push({ label: `خطة اليوم${tdy.plan_day ? ` (اليوم ${tdy.plan_day})` : ''}`, text: `تقليل ${tdy.reduction_min} دقيقة`, tag: tagFrom(tdy.confidence), field: `${fp}.today`, note: hb.baseline_daily_minutes == null ? 'الأساس اليومي بالدقائق غير مسجل (null) فلا نحوّل التقليل إلى ساعات' : undefined });
            const tg = (hb.targets ?? []).filter((t) => inWin(t.date, w)).map((t) => t.reduction_min).filter((x) => typeof x === 'number');
            if (tg.length)
                lines.push({ label: 'أهداف التقليل في النافذة (دقيقة)', text: tg.join('، '), tag: tagFrom(hb.targets_confidence), field: `${fp}.targets[]` });
        }
        else if (hb.key === 'tea_sugar') {
            const limits = new Map((hb.targets ?? []).map((t) => [t.date, t.sugar_limit_g]));
            let within = 0, over = 0, unrec = 0;
            const actual = [];
            for (const r of rs) {
                const a = numOr(r['actual_sugar_g']);
                const lim = numOr(limits.get(r['date']));
                if (a === null)
                    unrec++;
                else {
                    actual.push(a);
                    if (lim !== null)
                        a <= lim ? within++ : over++;
                }
            }
            if (rs.length && (within || over))
                lines.push({ label: 'ضمن الحد / فوق الحد', text: `${within} / ${over}`, tag: rowTag(rs), field: `${fp}.log[].actual_sugar_g` });
            if (actual.length)
                lines.push({ label: 'متوسط السكر (الأيام المسجلة فقط، غ)', text: num(actual.reduce((s, x) => s + x, 0) / actual.length), tag: weakest([rowTag(rs), 'محسوب']), field: `${fp}.log[].actual_sugar_g` });
            else
                unrecorded(`السكر الفعلي (${rs.length ? `${unrec} من ${rs.length} صفوف بلا قيمة` : 'لا صفوف'})`, `${fp}.log[].actual_sugar_g`);
            noRowLine();
            if (hb.today?.sugar_limit_g != null)
                lines.push({ label: 'حد اليوم (غ)', text: `${hb.today.sugar_limit_g}`, tag: tagFrom(hb.today.confidence), field: `${fp}.today.sugar_limit_g` });
        }
        else if (hb.key === 'water') {
            const vals = rs.map((r) => numOr(r['water_l'])).filter((x) => x !== null);
            const target = numOr(hb.target);
            if (vals.length)
                lines.push({ label: 'متوسط الماء (لتر)', text: target ? `${num(vals.reduce((s, x) => s + x, 0) / vals.length)} من ${target} (${Math.round((vals.reduce((s, x) => s + x, 0) / vals.length / target) * 100)}%)` : num(vals.reduce((s, x) => s + x, 0) / vals.length), tag: weakest([rowTag(rs), 'محسوب']), field: `${fp}.log[].water_l` });
            else
                unrecorded('كمية الماء', `${fp}.log[].water_l`);
            noRowLine();
        }
        else if (hb.key === 'sleep') {
            const on = rs.filter((r) => r['on_target'] === true).length;
            const offT = rs.filter((r) => r['on_target'] === false).length;
            if (on + offT > 0)
                lines.push({ label: `النوم على الموعد${hb.target_bedtime ? ` (${hb.target_bedtime})` : ''}`, text: `نعم ${on} · لا ${offT}`, tag: rowTag(rs), field: `${fp}.log[].on_target` });
            else
                unrecorded('النوم على الموعد', `${fp}.log[].on_target`);
            noRowLine();
        }
        else if (hb.key === 'food') {
            const k = rs.map((r) => numOr(r['kcal_estimate'])).filter((x) => x !== null);
            const pr = rs.map((r) => numOr(r['protein_g_estimate'])).filter((x) => x !== null);
            if (k.length)
                lines.push({ label: `متوسط السعرات${hb.target_kcal ? ` (الهدف ${hb.target_kcal})` : ''}`, text: `${Math.round(k.reduce((s, x) => s + x, 0) / k.length)}`, tag: weakest([rowTag(rs), 'محسوب']), field: `${fp}.log[].kcal_estimate`, note: `تقدير على ${k.length} يوم مسجل` });
            else
                unrecorded('السعرات', `${fp}.log[].kcal_estimate`);
            if (pr.length)
                lines.push({ label: `متوسط البروتين (غ)${hb.target_protein_g ? ` (الهدف ${hb.target_protein_g})` : ''}`, text: `${Math.round(pr.reduce((s, x) => s + x, 0) / pr.length)}`, tag: weakest([rowTag(rs), 'محسوب']), field: `${fp}.log[].protein_g_estimate` });
            noRowLine();
        }
        else if (hb.key === 'workout') {
            const c = { yes: 0, no: 0, unknown: 0 };
            let recorded = 0;
            for (const r of rs) {
                const v = ynu(r['done']);
                if (v === null)
                    continue;
                recorded++;
                c[v]++;
            }
            const planDays = (hb.week_plan ?? []).length;
            if (recorded)
                lines.push({ label: 'أيام التمرين المنجزة', text: `${c.yes}${planDays ? ` من ${planDays} أيام الخطة` : ''} · لم يتمرن ${c.no} · ${UNKNOWN} ${c.unknown}`, tag: rowTag(rs), field: `${fp}.log[].done` });
            else
                unrecorded('أيام التمرين المنجزة', `${fp}.log[].done`);
            const nulls = rs.length - recorded;
            if (nulls > 0)
                lines.push({ label: 'صفوف بلا قيمة (done = null)', text: `${nulls}`, tag: 'غير مسجل', field: `${fp}.log[].done` });
            noRowLine();
            if (planDays)
                lines.push({ label: 'خطة الأسبوع', text: (hb.week_plan ?? []).map((d) => `${d.day_ar ?? d.day}: ${d.type_ar ?? d.type ?? ''}`).join(' · '), tag: tagFrom(hb.today?.confidence, 'افتراض'), field: `${fp}.week_plan[]` });
        }
        else {
            noRowLine();
        }
        const c = hb.counters;
        out.push({
            key: hb.key, name: hb.name_ar, kind: hb.kind, lines,
            streak: { current: val(numOr(c?.current_streak_days), tagFrom(c?.confidence), `${fp}.counters.current_streak_days`), best: val(numOr(c?.best_streak_days), tagFrom(c?.confidence), `${fp}.counters.best_streak_days`) },
        });
    }
    const dsRows = new Map((h.daily_summary ?? []).filter((r) => inWin(r['date'], w)).map((r) => [r['date'], r]));
    const dsDef = [
        ['prayers_on_time', 'صلوات في وقتها', (v) => (numOr(v) !== null ? String(v) : null)],
        ['vape_kept', 'الفيب', (v) => { const y = ynu(v); return y === 'yes' ? YES : y === 'no' ? NO : y === 'unknown' ? UNKNOWN : null; }],
        ['trained', 'تمرّن', (v) => { const y = ynu(v); return y === 'yes' ? YES : y === 'no' ? NO : y === 'unknown' ? UNKNOWN : null; }],
        ['spent_rm', 'صرف (RM)', (v) => (numOr(v) !== null ? num(v) : null)],
        ['weight_kg', 'الوزن (كغ)', (v) => (numOr(v) !== null ? num(v) : null)],
    ];
    const daily = w.days.filter((d) => d <= w.today).map((date) => {
        const r = dsRows.get(date);
        return { date, hasRow: !!r, fields: dsDef.map(([k, label, f]) => ({ label, text: r ? f(r[k]) : null })) };
    });
    const unrec = missingInputs(h.unrecorded_inputs).filter((m) => m.value === null || m.value === undefined);
    for (const m of unrec)
        missing.push({ section: 'العادات', label: m.key, field: `habits.json › unrecorded_inputs.${m.key}` });
    return {
        started: h.status?.started ?? null, startedNote: h.status?.note_ar ?? null, startedTag: tagFrom(h.status?.started_confidence), streakDef: h.streak_definition_ar ?? null,
        habits: out, daily, unrecorded: unrec.map((m) => ({ key: m.key, note: m.note, field: `habits.json › unrecorded_inputs.${m.key}` })),
    };
}
export function weightWeek(b, w, missing) {
    if (!b)
        return null;
    const hist = (b.weight_history ?? []).filter((x) => typeof x.date === 'string' && numOr(x.value_kg) !== null).sort((a, c) => a.date.localeCompare(c.date));
    const upTo = w.end < w.today ? w.end : w.today;
    const inside = hist.filter((x) => x.date >= w.start && x.date <= upTo).at(-1) ?? null;
    const before = hist.filter((x) => x.date < w.start).at(-1) ?? null;
    const lw = b.latest_recorded_weight;
    const latestKg = numOr(lw?.value_kg);
    const base = hist.find((x) => x.status_ar === 'خط الأساس') ?? null;
    const conf = (b.items ?? []).find((i) => i.key === 'weight');
    const goal = val(numOr(b.goal_kg), tagFrom(b.goal_kg_confidence), 'body.json › goal_kg');
    const changeKg = inside && before ? r2(inside.value_kg - before.value_kg) : null;
    const rem = latestKg !== null && goal.value !== null ? r2(latestKg - goal.value) : null;
    const next = missingInputs(b.unrecorded_inputs).find((m) => m.key === 'next_weight_reading');
    const nextVal = val(numOr(next?.value), tagFrom(next?.confidence), 'body.json › unrecorded_inputs.next_weight_reading');
    if (!inside)
        missing.push({ section: 'الوزن', label: 'قراءة وزن هذا الأسبوع', field: 'body.json › weight_history[]' });
    if (changeKg === null)
        missing.push({ section: 'الوزن', label: 'التغير عن الأسبوع السابق (تحتاج قراءتين)', field: 'body.json › weight_history[]' });
    if (nextVal.value === null)
        missing.push({ section: 'الوزن', label: 'قراءة الوزن الجديدة', field: nextVal.field });
    if (latestKg === null)
        missing.push({ section: 'الوزن', label: 'آخر قراءة وزن', field: 'body.json › latest_recorded_weight' });
    if (goal.value === null)
        missing.push({ section: 'الوزن', label: 'الوزن المستهدف', field: goal.field });
    return {
        latest: { date: lw?.date ?? null, kg: latestKg, tag: latestKg === null ? 'غير مسجل' : tagFrom(lw?.confidence) },
        inWindow: inside ? { date: inside.date, kg: inside.value_kg, tag: tagFrom(inside.confidence) } : null,
        change: { kg: changeKg, from: before ? { date: before.date, kg: before.value_kg } : null, tag: changeKg === null ? 'غير مسجل' : weakest([tagFrom(inside?.confidence), tagFrom(before?.confidence), 'محسوب']) },
        baseline: base ? { date: base.date, kg: base.value_kg, tag: tagFrom(base.confidence), confirmedAt: conf?.date ?? null } : null,
        goal,
        remaining: { kg: rem, tag: rem === null ? 'غير مسجل' : weakest([tagFrom(lw?.confidence), goal.tag, 'محسوب']) },
        conflictNote: b.weight_history_note_ar ?? null,
        conflicts: hist.filter((x) => x.note_ar && /تعارض|مبدئ|يتعارض/.test(`${x.status_ar ?? ''}${x.note_ar}`)).map((x) => ({ date: x.date, kg: x.value_kg, note: x.note_ar })),
        next: nextVal,
    };
}
const PLAN_LABEL = { monthly_income: 'الدخل الشهري', category_caps: 'سقوف الفئات', nov_funding_decision: 'قرار تمويل 1 نوفمبر' };
export function moneyWeek(f, s, w, missing) {
    if (!f)
        return null;
    const bb = f.balances_block;
    const balances = (bb?.items ?? []).map((i) => ({ key: i.key, label: i.label_ar ?? i.key, v: val(numOr(i.amount), tagFrom(i.confidence), `finance.json › balances_block.items[key=${i.key}].amount`) }));
    for (const b of balances)
        if (b.v.value === null)
            missing.push({ section: 'المال', label: `رصيد ${b.label}`, field: b.v.field });
    const accounts = (f.accounts ?? []).map((a) => ({ key: a.key, label: a.label_ar ?? a.key, statedAt: a.stated_at ?? null, v: val(numOr(a.amount), tagFrom(a.confidence, 'مثبت'), `finance.json › accounts[key=${a.key}].amount`) }));
    const bh = parseBalanceHistory(f);
    const upTo = w.end < w.today ? w.end : w.today;
    const dateOf = (p) => p.date.slice(0, 10);
    const inside = bh.points.filter((p) => dateOf(p) >= w.start && dateOf(p) <= upTo).at(-1);
    const before = bh.points.filter((p) => dateOf(p) < w.start).at(-1);
    const BOXES = [['treasury', 'الخزينة'], ['monthly', 'الشهري'], ['daily', 'اليومية'], ['total', 'المجموع']];
    const changes = BOXES.map(([key, label]) => {
        const to = inside ? inside[key] ?? null : null;
        const from = before ? before[key] ?? null : null;
        const delta = to !== null && from !== null ? r2(to - from) : null;
        if (delta === null)
            missing.push({ section: 'المال', label: `تغير رصيد ${label} هذا الأسبوع`, field: 'finance.json › balance_history[]' });
        return { key, label, delta, from, to, tag: delta === null ? 'غير مسجل' : weakest([tagFrom(inside?.confidence), tagFrom(before?.confidence), 'محسوب']) };
    });
    const txAll = f.recent_transactions ?? [];
    const oldest = txAll.map((t) => t.date).sort()[0] ?? null;
    const covers = oldest !== null && oldest <= w.start;
    const tx = txAll.filter((t) => t.type === 'expense' && inWin(t.date, w) && t.date <= w.today);
    const reportedTag = weakest(tx.map((t) => tagFrom(t.confidence)));
    const reported = covers ? { total: r2(tx.reduce((s, t) => s + t.amount, 0)), count: tx.length, tag: weakest([reportedTag === 'غير مسجل' ? 'محسوب' : reportedTag, 'محسوب']), note: null } : { total: null, count: 0, tag: 'غير مسجل', note: 'النافذة تسبق أقدم صف في recent_transactions' };
    if (reported.total === null)
        missing.push({ section: 'المال', label: 'الصرف المبلغ عنه', field: 'finance.json › recent_transactions[]' });
    const neg = tx.filter((t) => typeof t.cash_delta === 'number' && t.cash_delta < 0);
    const zero = tx.filter((t) => t.cash_delta === 0);
    const unk = tx.filter((t) => t.cash_delta === null || t.cash_delta === undefined);
    const applied = {
        total: covers ? r2(neg.reduce((s, t) => s - t.cash_delta, 0)) : null, count: neg.length,
        noBox: { total: r2(zero.reduce((s, t) => s + t.amount, 0)), count: zero.length }, unknownDelta: unk.length,
        tag: (covers ? weakest([...neg.map((t) => tagFrom(t.confidence)), 'محسوب']) : 'غير مسجل'),
    };
    const cat = new Map();
    for (const t of tx) {
        const k = t.category_ar?.trim() || 'غير مصنف';
        const e = cat.get(k) ?? { total: 0, count: 0, tags: [] };
        e.total += t.amount;
        e.count++;
        e.tags.push(t.category_ar ? tagFrom(t.category_confidence) : 'غير مسجل');
        cat.set(k, e);
    }
    const byCategory = [...cat].map(([category, e]) => ({ category, total: r2(e.total), count: e.count, tag: e.tags.every((x) => x === 'غير مسجل') ? 'غير مسجل' : weakest(e.tags.filter((x) => x !== 'غير مسجل')) })).sort((a, b) => b.total - a.total);
    const dailyRows = tx.filter((t) => t.wallet === 'يومية' && typeof t.cash_delta === 'number' && t.cash_delta < 0);
    const dSpent = dailyRows.length ? r2(dailyRows.reduce((s, t) => s - t.cash_delta, 0)) : null;
    const elapsed = w.elapsed.length;
    const dRate = dSpent !== null && elapsed > 0 ? r2(dSpent / elapsed) : null;
    const dBal = numOr(balances.find((b) => b.key === 'daily')?.v.value);
    const covDays = dBal !== null && dRate !== null && dRate > 0 && dBal >= 0 ? r1(dBal / dRate) : null;
    const daily = { spent: dSpent, rate: dRate, balance: dBal, coverageDays: covDays, negative: dBal !== null && dBal < 0, tag: (dRate === null ? 'غير مسجل' : 'محسوب'), rows: dailyRows.length };
    if (dRate === null)
        missing.push({ section: 'المال', label: 'معدل صرف اليومية', field: 'finance.json › recent_transactions[wallet=يومية]' });
    const periods = f.schedule?.periods ?? [];
    const topups = periods.map((p) => {
        const hi = p.to ?? '9999-12-31';
        const days = w.days.filter((d) => d >= p.from && d <= hi).length;
        const open = p.status === 'open';
        return { from: p.from, to: p.to ?? null, perDay: numOr(p.per_day), days, amount: numOr(p.per_day) !== null && days > 0 ? r2(p.per_day * days) : null, status: p.status ?? '', open, tag: open ? 'افتراض' : tagFrom(p.confidence) };
    }).filter((p) => p.days > 0 || p.open);
    const eff = periods.find((p) => p.from <= w.today && (p.to ?? '9999-12-31') >= w.today && p.status !== 'open');
    const mBal = numOr(balances.find((b) => b.key === 'monthly')?.v.value);
    const mPer = numOr(eff?.per_day);
    const monthly = { balance: mBal, perDay: mPer, days: mBal !== null && mPer !== null && mPer > 0 ? r1(mBal / mPer) : null, tag: (mBal !== null && mPer ? 'محسوب' : 'غير مسجل') };
    const ol = s?.open_loops_count;
    const plan = f.planning_inputs;
    const planning = Object.keys(PLAN_LABEL).map((key) => {
        const m = missingInputs(plan).find((x) => x.key === key);
        const v = val(m && m.value !== null && typeof m.value !== 'object' ? m.value : m && m.value !== null ? JSON.stringify(m.value) : null, tagFrom(m?.confidence), `finance.json › planning_inputs.${key}`);
        if (v.value === null)
            missing.push({ section: 'المال', label: PLAN_LABEL[key], field: v.field });
        return { key, label: PLAN_LABEL[key], v };
    });
    return {
        asOf: bb?.as_of ?? null, balances, accounts, changes, changesNote: bh.points.length ? null : 'لا تاريخ أرصدة في الملف',
        reported, applied, byCategory, daily, topups, monthly,
        computedNotes: (f.computed_notes ?? []).map((n) => ({ text: n.text_ar, math: n.math, tag: tagFrom(n.confidence) })),
        openItems: (f.open_items ?? []).map((o) => ({ id: o.id, title: o.title_ar ?? o.id, amount: numOr(o.amount), tag: tagFrom(o.confidence) })),
        receivables: (f.receivables ?? []).map((r) => ({ person: r.person_ar, amount: val(numOr(r.amount), tagFrom(r.confidence), `finance.json › receivables[${r.person_ar}].amount`), last: numOr(r.last_recorded_amount) })),
        planning,
        openLoops: ol ? { openOrWaiting: numOr(ol.open_or_waiting), open: numOr(ol.open), waiting: numOr(ol.waiting), method: ol.method_ar ?? null, tag: tagFrom(ol.confidence) } : null,
        txNote: f.recent_transactions_note_ar ?? null,
    };
}
export function routineWeek(r, w, missing) {
    if (!r)
        return null;
    const dayDate = new Map(DAY_CODES.map((d, i) => [d, w.nextDays[i]]));
    const study = r.weekly_study_blocks ?? [];
    const studyByDay = DAY_CODES.map((day) => ({
        day, ar: DAY_AR[day], date: dayDate.get(day),
        blocks: study.filter((b) => b.days?.includes(day)).map((b) => {
            const s = toMin(b.start), e = toMin(b.end);
            return { name: b.name, start: b.start ?? '', end: b.end ?? '', hours: s !== null && e !== null && e > s ? (e - s) / 60 : 0 };
        }).sort((a, b) => a.start.localeCompare(b.start)),
    }));
    let hours = null;
    const valid = study.filter((b) => toMin(b.start) !== null && toMin(b.end) !== null && b.days?.length);
    if (valid.length)
        hours = r2(valid.reduce((s, b) => s + ((toMin(b.end) - toMin(b.start)) / 60) * b.days.length, 0));
    else
        missing.push({ section: 'الروتين', label: 'كتل الدراسة', field: 'routine.json › weekly_study_blocks[]' });
    const strip = DAY_CODES.map((day) => ({ day, ar: DAY_AR[day], date: dayDate.get(day), items: blocksForDay(r, day).map((x) => ({ name: x.b.name, start: x.start, end: x.end, kind: x.b.kind ?? 'routine', moves: !!x.b.moves_with_prayer_time })) }));
    const hol = (r.holidays ?? []).filter((h) => h.from <= w.nextEnd && (h.to ?? h.from) >= w.nextStart).map((h) => ({ name: h.name_ar, from: h.from, to: h.to ?? null, tag: tagFrom(h.confidence) }));
    const pt = r.prayer_times_reference;
    const rev = (r.local_routines ?? []).find((x) => x.name.includes('المراجعة الأسبوعية'));
    return {
        studyByDay, studyHours: { hours, tag: hours === null ? 'غير مسجل' : weakest([...valid.map((b) => tagFrom(b.confidence)), 'محسوب']) }, strip,
        local: (r.local_routines ?? []).map((x) => ({ name: x.name, time: x.time ?? '', days: (x.days ?? []).length === 7 ? 'كل يوم' : (x.days ?? []).map((d) => DAY_AR[d] ?? d).join('، '), inOutlook: x.in_outlook === true, tag: tagFrom(x.confidence), note: x.note_ar ?? null })),
        holidays: hol, conflicts: (r.known_conflicts ?? []).map((c) => ({ id: c.id, text: c.text_ar })),
        prayerRef: pt ? { date: pt.date ?? null, zone: pt.zone ?? null, tag: tagFrom(pt.confidence), times: PRAYER_KEYS.filter((k) => pt[k]).map((k) => ({ key: k, ar: PRAYER_AR[k], time: pt[k] })) } : null,
        reviewDay: { saturdayAssumed: rev ? `${(rev.days ?? []).map((d) => DAY_AR[d] ?? d).join('، ')} ${rev.time ?? ''}`.trim() : null, tag: rev ? tagFrom(rev.confidence) : 'غير مسجل' },
    };
}
export function buildWeekly(i, nowMs, offset = 0) {
    const window = reviewWindow(nowMs, offset);
    const missing = [];
    return {
        window,
        prayer: prayerWeek(i.prayers, window, missing),
        habits: habitsWeek(i.habits, window, missing),
        weight: weightWeek(i.body, window, missing),
        money: moneyWeek(i.finance, i.summary, window, missing),
        routine: routineWeek(i.routine, window, missing),
        missing,
    };
}
