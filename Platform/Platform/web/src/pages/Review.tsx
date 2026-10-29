import { useEffect, useMemo, useState } from 'react';
import { useUrlParam } from '../core/useUrlParam.js';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { api, sports as sportsApi } from '../lib/api.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, Segmented, Skeleton } from '../ui/ui.js';
import { StaleBanner, fmtDay, fmtDayFull, useLife } from '../life/lifeKit.js';
import { useNow } from '../widgets/tiles.js';
import { usePlans } from '../sports/sportsKit.js';
import { H3, Section, TagBadge } from '../review/kit.js';
import { HabitsBody, MoneyBody, PrayerBody, RoutineBody, WeightBody } from '../review/sections.js';
import { assessmentsInRange, deadlineAlerts } from '../../../shared/review.js';
import { parseISO, todayMs } from '../../../shared/semester.js';
import { KIND_LABEL } from '../../../shared/constants.js';
import { WEEKDAYS, WEEKDAY_AR, type MyWeek } from '../../../shared/sports.js';
import { buildWeekly, freshRows } from '../../../shared/weekly.js';
import { fieldPathAr } from '../../../shared/v8.js';
import { useFieldLabels } from '../life/lifeKit.js';
import { LIFE_FILE_LABEL } from '../../../shared/life.js';
import type { Body, Finance, Habits, Prayers, Routine, Summary } from '../../../shared/life.js';
import type { SemesterBundle } from '../../../shared/types.js';

const NOTE_KEY = (start: string): string => `platform.review.note.${start}`;
const FILES = ['prayers', 'habits', 'body', 'finance', 'routine', 'dashboard_summary'] as const;

export default function Review() {
  const { activeId } = useApp();
  const now = useNow(60_000);
  // الأسبوع في الرابط (P7): ?week=last للأسبوع الماضي
  const [weekP, setWeekP] = useUrlParam<'this' | 'last'>('week', 'this', ['this', 'last']);
  const offset: 0 | -1 = weekP === 'last' ? -1 : 0;
  const setOffset = (v: 0 | -1): void => setWeekP(v === -1 ? 'last' : 'this');
  const d = useLife([...FILES]);
  const labels = useFieldLabels();
  const plans = usePlans();
  const [bundle, setBundle] = useState<SemesterBundle | null | 'none'>(null);
  const [mine, setMine] = useState<MyWeek | null>(null);

  const r = useMemo(
    () =>
      buildWeekly(
        { prayers: d.get<Prayers>('prayers'), habits: d.get<Habits>('habits'), body: d.get<Body>('body'), finance: d.get<Finance>('finance'), routine: d.get<Routine>('routine'), summary: d.get<Summary>('dashboard_summary') },
        now,
        offset,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.files, now, offset],
  );
  const w = r.window;
  const fresh = useMemo(() => freshRows(d.status?.files ?? []), [d.status]);
  const fr = (n: string) => fresh.find((f) => f.name === n);
  const staleAny = fresh.some((f) => (FILES as readonly string[]).includes(f.name) && f.stale);

  const [note, setNote] = useState('');
  useEffect(() => {
    try {
      setNote(localStorage.getItem(NOTE_KEY(w.start)) ?? '');
    } catch {
      setNote('');
    }
  }, [w.start]);
  const saveNote = (v: string): void => {
    setNote(v);
    try {
      if (v) localStorage.setItem(NOTE_KEY(w.start), v);
      else localStorage.removeItem(NOTE_KEY(w.start));
    } catch { /* تجاهل */ }
  };
  useEffect(() => {
    if (!activeId) {
      setBundle('none');
      return;
    }
    api.bundle(activeId).then(setBundle).catch(() => setBundle('none'));
  }, [activeId]);
  useEffect(() => {
    sportsApi.mine().then(setMine).catch(() => setMine(null));
  }, []);

  const b = bundle && bundle !== 'none' ? bundle : null;
  const thisWk = useMemo(() => (b ? assessmentsInRange(b.assessments, b.semester, parseISO(w.start), parseISO(w.end)) : []), [b, w.start, w.end]);
  const nextWk = useMemo(() => (b ? assessmentsInRange(b.assessments, b.semester, parseISO(w.nextStart), parseISO(w.nextEnd)) : []), [b, w.nextStart, w.nextEnd]);
  const overdue = useMemo(() => (b ? deadlineAlerts(b.assessments, b.courses, b.semester, todayMs(), 0).filter((a) => a.overdue) : []), [b]);
  const courseOf = (id: string) => b?.courses.find((c) => c.id === id);
  const hb = d.get<Habits>('habits');
  const workout = hb?.habits?.find((h) => h.key === 'workout');
  const sel = plans.data?.selected_template_id ?? null;
  const missingBy = useMemo(() => {
    const m = new Map<string, typeof r.missing>();
    for (const x of r.missing) m.set(x.section, [...(m.get(x.section) ?? []), x]);
    return [...m];
  }, [r.missing]);

  const list = (items: typeof thisWk) => (
    <ul className="plain rv-list">
      {items.map(({ a, approx }) => {
        const c = courseOf(a.course_id);
        return (
          <li key={a.id}>
            <Link to={`/academic/s/${b?.semester.id}/courses/${a.course_id}#a-${a.id}`} className="bell-row">
              <i className="dot" style={{ background: c?.color ?? 'var(--text-3)' }} />
              <span><bdi>{a.title}</bdi><small><bdi>{c?.code}</bdi> · {KIND_LABEL[a.kind] ?? a.kind} · {approx ? `أسبوع ${a.week_no} (تقريبي)` : a.due_date ? fmtDayFull(a.due_date) : 'فترة الامتحانات'}</small></span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="page review">
      <PageHead
        title="مراجعة الأسبوع"
        icon="sparkle"
        sub={<>من <b>{fmtDayFull(w.start)}</b> إلى <b>{fmtDayFull(w.end)}</b> (الأحد ← السبت، توقيت ماليزيا) <TagBadge tag="افتراض" title="لا يوجد ملف يحدد بداية الأسبوع صراحة؛ ترتيب الأيام في routine.json يبدأ بالأحد" /></>}
        actions={<Button icon="print" onClick={() => window.print()}>طباعة</Button>}
      />
      <Card className="rv-hdr">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
          <Segmented<'0' | '-1'> label="الأسبوع" value={String(offset) as '0' | '-1'} onChange={(v) => setOffset(v === '0' ? 0 : -1)} options={[{ value: '0', label: 'هذا الأسبوع' }, { value: '-1', label: 'الأسبوع الماضي' }]} />
          {w.partial && <Badge dashed>يوم السبت ما انتهى — الأرقام من الأحد حتى الآن ({w.elapsed.length} {w.elapsed.length === 1 ? 'يوم' : 'أيام'})</Badge>}
        </div>
        <p className="rv-fine" style={{ margin: 0 }}>
          <b>موعد المراجعة:</b> {r.routine?.reviewDay.saturdayAssumed ? `«${r.routine.reviewDay.saturdayAssumed} [افتراض]»` : 'غير مسجل'} (روتين محلي، ليس في التقويم) مقابل الأحد في ملف فارس القديم — لم ينحسم، فلا يُعرض كقرار.
        </p>
        <ul className="rv-fresh" aria-label="حداثة الملفات">
          {FILES.map((n) => {
            const f = fr(n);
            return (
              <li key={n}>
                {LIFE_FILE_LABEL[n as keyof typeof LIFE_FILE_LABEL] ?? n}: {f?.generated_at ? fmtDay(f.generated_at) : 'غير متاح'}{f?.stale ? <> <Badge tone="warn">قديم</Badge></> : null}
              </li>
            );
          })}
        </ul>
      </Card>
      {d.status && <StaleBanner status={d.status} names={[...FILES]} />}
      {staleAny && <p className="sr-only" role="status">بعض ملفات هذه المراجعة قديمة</p>}
      {d.loading && <Skeleton h={220} r={16} />}
      {d.error && <EmptyState icon="warn" title="تعذّر قراءة ملفات راشد" text={d.error} action={<Button onClick={d.reload}>إعادة المحاولة</Button>} />}

      {!d.loading && !d.error && (
        <>
          <nav className="rv-toc chips" aria-label="محتويات المراجعة">
            {[['rv-todo', 'المطلوب'], ['rv-study', 'الدراسة'], ['rv-prayer', 'الصلاة'], ['rv-habits', 'العادات'], ['rv-weight', 'الوزن'], ['rv-money', 'المال'], ['rv-routine', 'الروتين'], ['rv-missing', 'ما ينقص'], ['rv-note-card', 'ملاحظتي']].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(id!)?.scrollIntoView({ block: 'start' }); }}>{label}</a>
            ))}
          </nav>
          <Card id="rv-todo" className="rv-sec">
            <CardHead title="المطلوب فعله قبل الاستعراض" icon="check" />
            <ul className="life-list">
              {b && overdue.length > 0 ? <li><b>{overdue.length}</b> تقييم تجاوز موعده ولم يُسلَّم — <Link to={`/academic/s/${b.semester.id}/timeline?view=list&open=1`}>افتح القائمة</Link></li> : <li>لا تقييمات متأخرة.</li>}
              {staleAny ? <li>بعض ملفات راشد قديمة — اطلب تحديثها: <Link to="/life/commands?type=refresh_exports">طلب تحديث</Link></li> : <li>ملفات راشد محدّثة.</li>}
              {r.missing.length > 0 ? <li><b>{r.missing.length}</b> بندًا غير مسجل — <a href="#rv-missing" onClick={(e) => { e.preventDefault(); document.getElementById('rv-missing')?.scrollIntoView({ block: 'start' }); }}>اعرضها</a></li> : <li>لا نقص ظاهر.</li>}
            </ul>
          </Card>
          <Card id="rv-note-card">
            <CardHead title="ملاحظتي لهذا الأسبوع" icon="edit" info="تُحفظ في هذا المتصفح فقط (لا في ملفات راشد ولا في النسخ الاحتياطي)." />
            <label className="sr-only" htmlFor="rv-note">ملاحظتي لهذا الأسبوع</label>
            <textarea id="rv-note" className="textarea rv-note" rows={4} value={note} maxLength={2000} placeholder="ما الذي نجح؟ ما الذي تؤجّله؟ ما أهم شيء للأسبوع القادم؟" onChange={(e) => saveNote(e.target.value)} />
          </Card>
          <Section id="rv-study" title="الدراسة: التقييمات" icon="book" files={[]}>
            {bundle === null ? <Skeleton h={80} /> : !b ? <p className="muted">لا فصل نشط. فعّل فصلًا من مدير الفصول.</p> : (
              <div className="stack">
                {overdue.length > 0 && <div className="rv-warn" role="note"><b>تجاوزت موعدها ولم تُسلَّم ({overdue.length}):</b> {overdue.map((o) => <span key={o.id} className="rv-chip"><bdi>{o.title}</bdi></span>)}</div>}
                <p style={{ margin: 0 }}><b>هذا الأسبوع ({thisWk.length})</b></p>
                {thisWk.length ? list(thisWk) : <p className="muted">لا تقييمات مُسجَّلة لهذا الأسبوع.</p>}
                <p style={{ margin: 0 }}><b>الأسبوع القادم ({nextWk.length})</b></p>
                {nextWk.length ? list(nextWk) : <p className="muted">لا تقييمات مُسجَّلة للأسبوع القادم.</p>}
                <p className="muted rv-fine">«تقريبي» = حُدِّد الأسبوع الدراسي فقط دون يوم.</p>
              </div>
            )}
          </Section>
          <Section id="rv-prayer" title="الصلاة" icon="moon" files={[fr('prayers')]}>
            {r.prayer ? <PrayerBody p={r.prayer} partial={w.partial} /> : <Unavail />}
          </Section>
          <Section id="rv-habits" title="العادات" icon="check" files={[fr('habits')]}>
            {r.habits ? <HabitsBody h={r.habits} /> : <Unavail />}
          </Section>
          <Section id="rv-weight" title="الوزن" icon="target" files={[fr('body')]}>
            {r.weight ? <WeightBody w={r.weight} /> : <Unavail />}
          </Section>
          <Section id="rv-money" title="المال (RM)" icon="chart" files={[fr('finance'), fr('dashboard_summary')]}>
            {r.money ? <MoneyBody m={r.money} /> : <Unavail />}
          </Section>
          <Section id="rv-routine" title="الروتين والأسبوع القادم" icon="calendar" files={[fr('routine')]}>
            {r.routine ? <RoutineBody r={r.routine} nextRange={`${fmtDay(w.nextStart)} ← ${fmtDay(w.nextEnd)}`} /> : <Unavail />}
            <H3>خطة التمرين</H3>
            <ul className="life-list">
              <li>القالب المختار من راشد: {sel ? <>{plans.data?.templates.find((t) => t.id === sel)?.name_ar ?? sel} <TagBadge tag="افتراض" /></> : <TagBadge tag="غير مسجل" title="habits.json › unrecorded_inputs.workout_location / workout_days_per_week = null" />}</li>
              {workout?.week_plan?.length ? <li>خطة الأسبوع في العادات <TagBadge tag="افتراض" />: {workout.week_plan.map((x) => `${x.day_ar ?? x.day}: ${x.type_ar ?? x.type ?? ''}`).join(' · ')}</li> : null}
              {mine && WEEKDAYS.some((k) => mine.week[k]) && (
                <li>خطتك المحلية في «تماريني» (الموقع لا يسجّل الإنجاز): {WEEKDAYS.filter((k) => mine.week[k]).map((k) => `${WEEKDAY_AR[k]}: ${mine.workouts.find((x) => x.id === mine.week[k])?.name ?? ''}`).join(' · ')}</li>
              )}
            </ul>
          </Section>
          <Card id="rv-missing" className="rv-sec">
            <CardHead title="ما ينقص" icon="help" info="كل ما هو «غير مسجل» مع اسم الحقل، لتعرف ماذا تعطي راشد. لا نملؤه ولا نحسب منه." />
            {r.missing.length === 0 ? <p className="muted">لا نقص ظاهر.</p> : (
              <div className="rv-miss">
                <p className="muted rv-fine" style={{ margin: 0 }}>{r.missing.length} بندًا غير مسجل. اطلب من راشد تسجيلها (مسودة أمر فقط، ولا يُنفَّذ شيء بدون موافقتك): <Link to="/life/commands">الأوامر</Link></p>
                {missingBy.map(([sec, items]) => (
                  <details key={sec} className="fold rv-miss-g" open>
                    <summary>{sec} ({items.length})</summary>
                    <ul className="life-list">{items.map((m, i) => <li key={i}>{m.label} <TagBadge tag="غير مسجل" /><small className="muted" style={{ display: 'block' }}>{fieldPathAr(m.field, labels)}</small></li>)}</ul>
                  </details>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Unavail() {
  return <p className="muted">هذا الملف غير متاح الآن (مجلد صادرات راشد مفقود أو الملف غير صالح). راجع <Link to="/settings?tab=sources">إعدادات الحياة</Link>.</p>;
}
