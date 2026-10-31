import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { useInbox } from '../core/inbox.js';
import { readRecent } from '../core/recent.js';
import { NEW_ACTIONS } from '../core/registry.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, Skeleton, cx } from '../ui/ui.js';
import { useNow } from '../widgets/tiles.js';
import { AssessmentQuickActions } from '../widgets/AssessmentQuickActions.js';
import { MealsToday } from '../widgets/MealsToday.js';
import { Icon } from '../lib/icons.js';
import { lib, life, sports, type LifeBundle } from '../lib/api.js';
import { fmtDateFull, fmtDateShort, fmtWeekday, hhmm, parseSlots } from '../lib/format.js';
import { DAY_MS, todayMs } from '../../../shared/semester.js';
import { assessmentsInRange, daysLeftText } from '../../../shared/review.js';
import { DAY_CODES, FRESH_LABEL, nowAndNext, type Routine } from '../../../shared/life.js';
import { weekdayKL, type MyWeek } from '../../../shared/sports.js';
import { libraryItemPath, type LibItem } from '../../../shared/library.js';
import type { Course } from '../../../shared/types.js';

/** «اليوم»: يجمع الدراسة والحياة والجسم والمكتبة. كل بطاقة تُحمَّل مستقلة وتختفي برفق إن غاب مصدرها. */
export default function Today() {
  const { semesters, activeId } = useApp();
  const inbox = useInbox();
  const nowMs = useNow(60_000);
  const [lifeB, setLifeB] = useState<LifeBundle | null | 'x'>(null);
  const [mine, setMine] = useState<MyWeek | null | 'x'>(null);
  const [recentLib, setRecentLib] = useState<LibItem[] | null>(null);

  useEffect(() => {
    let live = true;
    life.bundle(['routine']).then((b) => live && setLifeB(b)).catch(() => live && setLifeB('x'));
    sports.mine().then((m) => live && setMine(m)).catch(() => live && setMine('x'));
    lib.recent(5).then((r) => live && setRecentLib(r)).catch(() => live && setRecentLib([]));
    return () => {
      live = false;
    };
  }, []);

  const hour = new Date(nowMs).getHours();
  const greet = hour < 5 ? 'ليلة هادئة' : hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء النور' : 'مساء الخير';
  const routine = lifeB && lifeB !== 'x' ? ((lifeB.files.routine ?? null) as Routine | null) : null;
  const week = mine && mine !== 'x' ? mine : null;

  return (
    <div className="page">
      <PageHead title={`${greet}، محمد`} icon="sparkle" sub={fmtDateFull(todayMs())} actions={<Button to="/review" icon="list" size="sm">مراجعة الأسبوع</Button>} />
      <div className="today-grid stagger">
        <Attention semesters={semesters} activeId={activeId} inbox={inbox} lifeB={lifeB} />
        <NowNext courses={inbox.bundle?.courses ?? null} routine={routine} nowMs={nowMs} />
        {inbox.bundle && <WeekStrip inbox={inbox} week={week} />}
        {mine !== 'x' && <Workout mine={week} loading={mine === null} />}
        <MealsToday />
        <Continue items={recentLib} />
        <Card className="today-quick">
          <div className="quick">
            <Link to="/life/alternatives" className="btn sm"><Icon name="zap" size={15} /> اشتهاء الآن؟</Link>
            {NEW_ACTIONS.map((a) => {
              const to = a.to(activeId);
              return to ? <Link key={a.id} to={to} className="btn sm"><Icon name={a.icon} size={15} /> {a.label}</Link> : null;
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Attention({ semesters, activeId, inbox, lifeB }: { semesters: ReturnType<typeof useApp>['semesters']; activeId: string | null; inbox: ReturnType<typeof useInbox>; lifeB: LifeBundle | null | 'x' }) {
  if (!semesters) return <Card><Skeleton h={120} /></Card>;
  if (semesters.length === 0) {
    return (
      <Card className="today-attn">
        <CardHead title="يحتاج انتباهك" icon="warn" />
        <p className="muted">لا توجد فصول بعد. أضف فصلك الأول لتظهر مواعيدك هنا.</p>
        <Button variant="primary" icon="plus" to="/academic?new=1">إضافة فصل</Button>
      </Card>
    );
  }
  if (inbox.error) return null;
  if (!inbox.bundle) return <Card><Skeleton h={120} /></Card>;
  const b = inbox.bundle;
  const base = `/academic/s/${b.semester.id}`;
  const byId = new Map(b.assessments.map((a) => [a.id, a]));
  const items = inbox.alerts.filter((a) => a.overdue || a.kind === 'week' || (a.daysLeft ?? 99) <= 3).slice(0, 6);
  const stale = lifeB && lifeB !== 'x' && lifeB.status.root_exists && (lifeB.status.worst === 'stale' || lifeB.status.worst === 'expired') ? lifeB.status.worst : null;
  const courseOf = (code: string): Course | undefined => b.courses.find((c) => c.code === code);
  return (
    <Card className="today-attn">
      <CardHead title="يحتاج انتباهك" icon="warn">
        <Badge>{b.semester.code}{activeId === b.semester.id ? ' · النشط' : ''}</Badge>
      </CardHead>
      {items.length === 0 && !inbox.unknown && !stale && <p className="muted">لا شيء عاجل الآن.</p>}
      {items.length > 0 && (
        <ul className="plain today-list">
          {items.map((al) => {
            const a = byId.get(al.id);
            const c = courseOf(al.course);
            return (
              <li key={al.id} className={cx('today-row', al.overdue && 'late')}>
                <i className="dot" style={{ background: al.color }} />
                <Link to={`${base}/courses/${c?.id ?? ''}#a-${al.id}`} className="tr-main">
                  <bdi>{al.title}</bdi>
                  <small><bdi>{al.course}</bdi> · {daysLeftText(al)}{al.dueTime ? ` · ${al.dueTime}` : ''} · {al.weight}%</small>
                </Link>
                {a && <AssessmentQuickActions a={a} onDone={inbox.refresh} />}
              </li>
            );
          })}
        </ul>
      )}
      {(inbox.unknown ?? 0) > 0 && (
        <Link to={`${base}/unknowns`} className="today-link"><Icon name="help" size={16} /> غير المعروف: {inbox.unknown} بندًا يحتاج إكمالًا <Icon name="left" size={14} /></Link>
      )}
      {stale && (
        <Link to="/life" className="today-link"><Icon name="clock" size={16} /> بيانات راشد: {FRESH_LABEL[stale]} <Icon name="left" size={14} /></Link>
      )}
    </Card>
  );
}

function NowNext({ courses, routine, nowMs }: { courses: Course[] | null; routine: Routine | null; nowMs: number }) {
  const d = new Date(nowMs);
  const dow = d.getDay();
  const minute = d.getHours() * 60 + d.getMinutes();
  const lectures = useMemo(
    () => (courses ?? []).flatMap((c) => parseSlots(c.schedule).filter((s) => s.day === dow).map((s) => ({ c, s }))).sort((x, y) => x.s.start - y.s.start),
    [courses, dow],
  );
  const nn = routine ? nowAndNext(routine, nowMs) : null;
  if (!courses && !nn) return null;
  const next = lectures.find((x) => x.s.start > minute);
  return (
    <Card className="today-now">
      <CardHead title="الآن والتالي" icon="clock" />
      {courses && (
        <>
          <div className="hit-group">محاضرات اليوم · {fmtWeekday(todayMs())}</div>
          {lectures.length === 0 ? <p className="muted">لا محاضرات اليوم.</p> : (
            <ul className="plain today-list">
              {lectures.map(({ c, s }) => {
                const on = s.start <= minute && minute < s.end;
                return (
                  <li key={c.id + s.raw} className={cx('today-row', on && 'now')}>
                    <i className="dot" style={{ background: c.color }} />
                    <span className="tr-main"><bdi>{c.code}</bdi><small dir="ltr">{hhmm(s.start)}–{hhmm(s.end)}</small></span>
                    {on ? <Badge tone="ok">الآن</Badge> : next === undefined || next.c.id !== c.id || next.s !== s ? null : <Badge tone="accent">التالي</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {nn && (nn.current.length > 0 || nn.next) && (
        <>
          <div className="hit-group">الروتين (توقيت ماليزيا)</div>
          <ul className="plain today-list">
            {nn.current.map((x) => <li key={'c' + x.b.name + x.start} className="today-row now"><span className="tr-main">{x.b.name}<small dir="ltr">{hhmm(x.start % 1440)}–{hhmm(x.end % 1440)}</small></span><Badge tone="ok">الآن</Badge></li>)}
            {nn.next && <li className="today-row"><span className="tr-main">{nn.next.b.name}<small dir="ltr">{hhmm(nn.next.start % 1440)}</small></span><Badge tone="accent">التالي</Badge></li>}
          </ul>
        </>
      )}
    </Card>
  );
}

function WeekStrip({ inbox, week }: { inbox: ReturnType<typeof useInbox>; week: MyWeek | null }) {
  const b = inbox.bundle!;
  const t0 = todayMs();
  const dow0 = new Date().getDay();
  const days = Array.from({ length: 7 }, (_, i) => {
    const ms = t0 + i * DAY_MS;
    const dow = (dow0 + i) % 7;
    const due = assessmentsInRange(b.assessments, b.semester, ms, ms).filter((x) => !x.approx).map((x) => x.a);
    const lectures = b.courses.reduce((n, c) => n + parseSlots(c.schedule).filter((s) => s.day === dow).length, 0);
    const wid = week?.week[DAY_CODES[dow]!] ?? null;
    const wo = wid ? week?.workouts.find((w) => w.id === wid) : undefined;
    return { ms, due, lectures, wo };
  });
  const approx = assessmentsInRange(b.assessments, b.semester, t0, t0 + 6 * DAY_MS).filter((x) => x.approx).length;
  const courseById = new Map(b.courses.map((c) => [c.id, c]));
  return (
    <Card className="today-week">
      <CardHead title="هذا الأسبوع" icon="calendar">
        <Link to={`/academic/s/${b.semester.id}/timeline`} className="btn sm ghost">التقييمات والمواعيد</Link>
      </CardHead>
      <ol className="plain week-strip">
        {days.map((d, i) => (
          <li key={d.ms} className={cx('ws-day', i === 0 && 'today')}>
            <strong>{i === 0 ? 'اليوم' : fmtWeekday(d.ms)}</strong>
            <small>{fmtDateShort(d.ms)}</small>
            {d.due.map((a) => <span key={a.id} className="ws-chip" style={{ '--c': courseById.get(a.course_id)?.color } as never} title={a.title}><bdi>{courseById.get(a.course_id)?.code}</bdi> · {a.weight}%</span>)}
            {d.lectures > 0 && <span className="ws-meta"><Icon name="book" size={13} /> {d.lectures}</span>}
            {d.wo && <span className="ws-meta"><Icon name="dumbbell" size={13} /> <bdi>{d.wo.name}</bdi></span>}
          </li>
        ))}
      </ol>
      {approx > 0 && <p className="muted" style={{ marginBlockStart: 'var(--s-2)' }}>+ {approx} بموعد تقريبي (أسبوع دراسي بلا تاريخ).</p>}
    </Card>
  );
}

function Workout({ mine, loading }: { mine: MyWeek | null; loading: boolean }) {
  if (loading) return <Card><Skeleton h={90} /></Card>;
  const code = weekdayKL(Date.now());
  const wid = mine?.week[code] ?? null;
  const wo = wid ? mine?.workouts.find((w) => w.id === wid) : undefined;
  return (
    <Card className="today-workout">
      <CardHead title="تمرين اليوم" icon="dumbbell">
        <Link to="/sports/mine" className="btn sm ghost">تمريني</Link>
      </CardHead>
      {wo ? (
        <p><strong><bdi>{wo.name}</bdi></strong> <span className="muted">· {wo.items.length} تمارين</span></p>
      ) : (
        <p className="muted">لا تمرين مجدول اليوم.</p>
      )}
    </Card>
  );
}

function Continue({ items }: { items: LibItem[] | null }) {
  const pages = readRecent().slice(0, 4);
  const files = (items ?? []).filter((i) => i.opened_at).slice(0, 4);
  if (items === null && pages.length === 0) return null;
  if (files.length === 0 && pages.length === 0) return null;
  const row = (key: string, to: string, icon: 'file' | 'video' | 'clock', title: ReactNode, sub?: ReactNode): ReactNode => (
    <li key={key}><Link to={to} className="today-row"><Icon name={icon} size={16} /><span className="tr-main"><bdi>{title}</bdi>{sub ? <small>{sub}</small> : null}</span></Link></li>
  );
  return (
    <Card className="today-continue">
      <CardHead title="تابع من حيث توقفت" icon="bookmark" />
      <ul className="plain today-list">
        {files.map((f) => row(f.ref, libraryItemPath(f.source, f.id), f.source === 'youtube' ? 'video' : 'file', f.title, f.course_code ?? f.folder))}
        {pages.map((p) => row(p.path, p.path, 'clock', p.title))}
      </ul>
    </Card>
  );
}
