import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AssessmentQuickActions } from '../widgets/AssessmentQuickActions.js';
import { isGraded } from '../../../shared/calc.js';
import { useSem } from '../core/sem-context.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, EmptyState, TrustTag, Unknown } from '../ui/ui.js';
import { Countdown, DeadlineRow, Hero, MiniCalendar, StatTile, Stepper, WeekTimetable, Carousel } from '../widgets/tiles.js';
import { CapsuleBars, Donut, DotMatrix, LegendRows, Ring, Sparkline, TickBar, type CapDatum } from '../widgets/charts.js';
import { Icon } from '../lib/icons.js';
import { KIND_COLOR, KIND_LABEL } from '../../../shared/constants.js';
import { DAY_MS, dueSortMs, parseISO, toISO, weekEndMs, weekStartMs } from '../../../shared/semester.js';
import { fmtDateFull, fmtDateShort, fmtISOFull, fmtNum, weekRangeLabel } from '../lib/format.js';
import type { Kind } from '../../../shared/types.js';

export default function Dashboard() {
  const S = useSem();
  const { sem, courses, assessments, phase, loads, now, upcoming, courseById } = S;
  const base = `/academic/s/${sem.id}`;
  const [selWeek, setSelWeek] = useState<string | null>(null);
  const nav = useNavigate();

  const maxWeek = useMemo(() => loads.reduce((m, l, i) => (i >= 1 && i <= sem.weeks && l.weight > (loads[m]?.weight ?? 0) ? i : m), 1), [loads, sem.weeks]);
  const curWeek = phase.week;
  const sel = Number(selWeek ?? curWeek ?? maxWeek);
  const next = upcoming[0];
  const nextDue = next ? dueSortMs(next, sem) : null;

  const caps: CapDatum[] = useMemo(
    () =>
      loads.slice(1, sem.weeks + 1).map((l, i) => {
        const w = i + 1;
        return {
          key: String(w),
          label: String(w),
          value: l.weight,
          tip: `W${w} · ${fmtNum(l.weight)}% · ${l.count} تقييم`,
          hot: l.crowded,
          muted: sem.break_weeks.includes(w),
          ...(curWeek === w ? { sub: '●' } : {}),
        };
      }),
    [loads, sem.weeks, sem.break_weeks, curWeek],
  );

  const kindW = useMemo(() => {
    const m = new Map<Kind, number>();
    for (const a of assessments) m.set(a.kind, (m.get(a.kind) ?? 0) + a.weight);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [assessments]);

  const marks = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of assessments) {
      if (a.timing === 'date' && a.due_date) {
        const col = courseById.get(a.course_id)?.color ?? 'var(--accent)';
        m.set(a.due_date, [...(m.get(a.due_date) ?? []), col]);
      }
    }
    return m;
  }, [assessments, courseById]);

  const total = S.totalCount;
  const startMs = parseISO(sem.start_date);
  const endMs = weekEndMs(sem, sem.weeks);
  const elapsed = Math.max(0, Math.min(1, (now - startMs) / (endMs - startMs + DAY_MS)));
  const phaseText =
    phase.kind === 'week' ? `الأسبوع ${phase.week} من ${sem.weeks}` : phase.kind === 'break' ? `إجازة — الأسبوع ${phase.week}` : phase.kind === 'exam' ? 'فترة الامتحانات' : phase.kind === 'before' ? `يبدأ بعد ${phase.daysToStart} يومًا` : phase.kind === 'gap' ? 'بين نهاية المحاضرات والامتحانات' : 'الفصل منتهٍ';

  const steps = [
    { label: 'بداية الفصل', sub: fmtISOFull(sem.start_date), at: startMs, color: 'var(--accent)' },
    ...sem.break_weeks.map((w) => ({ label: `إجازة · أسبوع ${w}`, sub: weekRangeLabel(sem, w), at: weekStartMs(sem, w), color: 'var(--warn)' })),
    { label: 'نهاية المحاضرات', sub: fmtDateFull(endMs), at: endMs, color: 'var(--accent)' },
    ...(sem.exam_start ? [{ label: 'الامتحانات', sub: `${fmtISOFull(sem.exam_start)}${sem.exam_end ? ' – ' + fmtDateShort(parseISO(sem.exam_end)) : ''}`, at: parseISO(sem.exam_start), color: 'var(--danger)' }] : []),
  ].sort((a, b) => a.at - b.at);
  const lastDone = steps.reduce((m, s2, i) => (s2.at <= now ? i : m), -1);
  const stepper = steps.map((s2, i) => ({ label: s2.label, sub: s2.sub, color: s2.color, state: (i < lastDone ? 'done' : i === lastDone ? 'now' : 'next') as 'done' | 'now' | 'next' }));

  const busy = loads[maxWeek];
  const monthRef = new Date(now);
  const unknownN = S.unknownAssessments.length;

  return (
    <div className="page">
      <PageHead
        title={<><bdi>{sem.code}</bdi> <span className="muted" style={{ fontWeight: 500, fontSize: '0.6em' }}><bdi>{sem.name}</bdi></span></>}
        icon="grid"
        crumbs={[{ to: '/academic', label: 'الفصول' }, { label: sem.code }]}
        actions={
          <>
            <Button icon="print" to={`${base}/print`}>ملخص للطباعة</Button>
            <Button icon="plus" variant="primary" to={`${base}/courses?new=1`}>إضافة مادة</Button>
          </>
        }
      />

      <div className="stack stagger" style={{ gap: 'var(--s-5)' }}>
        <Hero
          eyebrow={<><Icon name="zap" size={14} /> الآن</>}
          title={phaseText}
          text={phase.kind === 'week' && phase.week ? `من ${fmtDateShort(weekStartMs(sem, phase.week))} إلى ${fmtDateShort(weekEndMs(sem, phase.week))} — تقدّم الفصل ${Math.round(elapsed * 100)}%` : `${fmtISOFull(sem.start_date)} · ${sem.weeks} أسبوعًا`}
          aside={
            next && nextDue !== null ? (
              <Link to={`${base}/courses/${next.course_id}#a-${next.id}`} className="countdown-link"><span className="sr-only">الموعد القادم: {next.title}. </span><Countdown target={nextDue + DAY_MS - 60_000} label={`حتى: ${next.title}`} color="var(--lime)" /></Link>
            ) : (
              <div className="countdown"><small>لا موعد قادم معروف</small></div>
            )
          }
        >
          <TickBar value={Math.round(elapsed * 100)} max={100} ticks={32} color="var(--lime)" />
          <Link to={`${base}/timeline`} className="btn sm ink">التقييمات والمواعيد</Link>
          <Link to={`${base}/calculator`} className="btn sm">حاسبة الدرجات</Link>
        </Hero>

        <div className="grid stats">
          <StatTile tone="purple" icon="book" label="المواد" value={courses.length} sub={`${S.credits} ساعة معتمدة${S.creditsUnknown ? ' + غير معروف' : ''}`} to={`${base}/courses`} />
          <StatTile tone="blue" icon="list" label="التقييمات" value={total} sub={`${assessments.length} بندًا · محسوب`} to={`${base}/timeline`} />
          <StatTile tone="orange" icon="zap" label="أزحم أسبوع" value={`W${maxWeek}`} sub={busy ? `${fmtNum(busy.weight)}% في ${busy.count} تقييم` : '—'} to={`${base}/timeline`} />
          <StatTile tone="green" icon="check" label="مصحَّح بدرجة" value={`${assessments.filter((a) => isGraded(a)).length}/${assessments.length}`} sub="التقييمات التي لها درجة مسجلة" to={`${base}/calculator`} />
          <StatTile tone="pink" icon="help" label="غير معروف" value={unknownN} sub={unknownN ? 'بنود بلا موعد' : 'كل شيء معروف'} to={`${base}/unknowns`} />
        </div>

        <div className="grid cols-2-1">
          <Card>
            <CardHead title="حمل الأسابيع" icon="chart" info="مجموع أوزان التقييمات في كل أسبوع. الأسبوع المزدحم = وزنه ≥ 70% من أعلى أسبوع وفيه بندان على الأقل.">
              <TrustTag kind="calc" />
              <Link to={`${base}/timeline?view=weeks`} className="btn sm ghost">عرض الأسابيع</Link>
            </CardHead>
            <CapsuleBars data={caps} selected={String(sel)} onSelect={setSelWeek} ariaLabel="حمل الأسابيع" height={190} />
            <div className="legend" style={{ marginBlockStart: 'var(--s-3)' }}>
              <span><i className="dot hatchdot" /> أسبوع عادي</span>
              <span><i className="dot" style={{ background: 'var(--lime)' }} /> مزدحم</span>
              <span><i className="dot" style={{ background: 'var(--warn)', opacity: 0.4 }} /> إجازة</span>
              <span className="muted">الأسبوع {sel}: {weekRangeLabel(sem, sel)}</span>
            </div>
          </Card>
          <Card>
            <CardHead title="المواعيد القادمة" icon="clock">
              <Link to={`${base}/timeline`} className="btn sm ghost">الكل</Link>
            </CardHead>
            {upcoming.length === 0 ? (
              <EmptyState icon="calendar" title="لا مواعيد قادمة معروفة" text="أضف تقييمات لها موعد، أو راجع قائمة «غير المعروف»." action={<div className="row" style={{ justifyContent: 'center' }}><Button variant="primary" icon="plus" to={`${base}/courses?new=assessment`}>إضافة تقييم</Button><Button to={`${base}/unknowns`}>غير المعروف</Button></div>} />
            ) : (
              <div className="dl-list">
                {upcoming.slice(0, 6).map((a) => (
                  <div key={a.id} className="dl-act">
                    <DeadlineRow a={a} course={courseById.get(a.course_id)} sem={sem} now={now} to={`${base}/courses/${a.course_id}#a-${a.id}`} compact />
                    <AssessmentQuickActions a={a} onDone={() => void S.reload()} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHead title="مواد هذا الفصل" icon="book">
            <Link to={`${base}/courses`} className="btn sm ghost">كتالوج المواد</Link>
          </CardHead>
          <Carousel label="ملخص المواد">
            {courses.map((c) => {
              const calc = S.calcs.get(c.id)!;
              const items = S.byCourse.get(c.id) ?? [];
              return (
                <Link key={c.id} to={`${base}/courses/${c.id}`} className="car-card" style={{ '--c': c.color } as never}>
                  <span className="cc-code"><bdi>{c.code}</bdi></span>
                  <strong><bdi>{c.name}</bdi></strong>
                  <span className="car-row">
                    <Ring value={calc.graded ? calc.performance : 0} size={46} stroke={5} color={c.color} label={calc.graded ? Math.round(calc.performance ?? 0) : '—'} />
                    <span className="muted">{items.length} تقييم · {c.credits === null ? <Unknown text="الساعات؟" /> : `${c.credits} ساعات`}</span>
                  </span>
                </Link>
              );
            })}
          </Carousel>
        </Card>

        <div className="grid cols-2-1">
          <Card>
            <CardHead title="جدول محاضرات الأسبوع" icon="clock" info="مقروء من حقل «أوقات المحاضرات» في كل مادة.">
              <TrustTag kind="proven" />
            </CardHead>
            <WeekTimetable courses={courses} todayDow={new Date(now).getUTCDay()} />
          </Card>
          <Card>
            <CardHead title="التقويم" icon="calendar" />
            <MiniCalendar year={monthRef.getFullYear()} month={monthRef.getMonth()} marks={marks} today={now} onDay={(iso) => nav(`${base}/timeline?view=list&day=${iso}`)} />
            <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginBlockStart: 'var(--s-2)' }}>اضغط يومًا لعرض تقييماته.</p>
          </Card>
        </div>
        {courses.length === 0 && <EmptyState icon="book" title="لا توجد مواد في هذا الفصل" action={<Button variant="primary" icon="plus" to={`${base}/courses?new=1`}>إضافة مادة</Button>} />}
      </div>
    </div>
  );
}
void toISO;
void Badge;
void [Donut, DotMatrix, LegendRows, Stepper, Sparkline, KIND_COLOR, KIND_LABEL];
