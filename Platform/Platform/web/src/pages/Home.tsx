import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { DOMAIN_LINES } from '../core/plugins.config.js';
import { PageHead } from '../ui/page.js';
import { Badge, Button, Card, CardHead, Skeleton, Unknown } from '../ui/ui.js';
import { Hero, StatTile, useNow } from '../widgets/tiles.js';
import { AgendaList, addDays, localToday } from '../widgets/agenda.js';
import { Icon } from '../lib/icons.js';
import { lib, sports as sportsApi } from '../lib/api.js';
import { wos, type Agenda } from '../lib/wos.js';
import { phaseOf, todayMs } from '../../../shared/semester.js';
import { fmtDateFull } from '../lib/format.js';
import { Conf, Money, useLife } from '../life/lifeKit.js';
import { nowAndNext, PRAYER_AR, PRAYER_KEYS, type Finance, type Habits, type Prayers, type Routine } from '../../../shared/life.js';
import { WEEKDAY_AR, type MyWeek, type Weekday } from '../../../shared/sports.js';
import type { LibItem } from '../../../shared/library.js';
import type { InboxEntry } from '../../../shared/wos.js';
import { AskAi } from '../ai/AskAi.js';

const JS_DAY: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const hm = (min: number): string => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** تاريخ اليوم بتوقيت كوالالمبور (توقيت ملفات راشد) */
const klToday = (): string => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
const PRAY_TXT: Record<string, string> = { in_time: 'في وقتها', late: 'متأخرة', missed: 'فاتت', unknown: 'غير معروف' };

/** المحطة المركزية: «ماذا الآن؟» — اليوم والأسبوع من كل الخطوط في نظرة واحدة. */
export default function Home() {
  const { semesters, activeId, profileName, openCreate, unknownCount } = useApp();
  const now = todayMs();
  const act = semesters?.find((s) => s.id === activeId);
  const ph = act ? phaseOf(now, act) : null;
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'ليلة هادئة' : hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء النور' : 'مساء الخير';
  const today = localToday();
  const [ag, setAg] = useState<Agenda | null>(null);
  const [agErr, setAgErr] = useState(false);
  const loadAg = useCallback(() => {
    wos.agenda(today, addDays(today, 6)).then((a) => { setAg(a); setAgErr(false); }).catch(() => setAgErr(true));
  }, [today]);
  useEffect(() => {
    loadAg();
    const on = (): void => loadAg();
    window.addEventListener('platform:items-changed', on);
    window.addEventListener('platform:sem-changed', on);
    return () => {
      window.removeEventListener('platform:items-changed', on);
      window.removeEventListener('platform:sem-changed', on);
    };
  }, [loadAg]);

  const todayItems = ag ? ag.range.filter((e) => e.date === today && e.kind !== 'workout') : [];
  const soon = ag ? ag.range.filter((e) => e.date !== today && e.kind !== 'workout' && !e.done) : [];
  const openToday = [...(ag?.overdue ?? []), ...todayItems.filter((e) => !e.done)].length;

  return (
    <div className="page">
      <PageHead
        title={`${greet}${profileName ? `، ${profileName}` : ''}`}
        icon="home"
        sub={<>{fmtDateFull(now)}{act && ph?.week ? <> · <bdi>{act.code}</bdi> الأسبوع {ph.week}</> : null}</>}
        actions={<><AskAi label="موجز اليوم" prompt="أعطني موجز اليوم: المتأخر أولًا ثم ما عليّ اليوم وهذا الأسبوع حسب الأهمية والوزن." send /><Button to="/week" icon="calendar">هذا الأسبوع</Button><Button to="/everything" icon="list">كل شيء</Button></>}
      />
      <div className="stack" style={{ gap: 'var(--s-5)' }}>
        <QuickCapture />
        <div className="today-grid">
          <Card className="today-agenda">
            <CardHead title="المواعيد" icon="clock" info="من كل الخطوط: تقييمات الفصول + عناصر مساحاتك. ≈ تعني تاريخًا تقريبيًا (نهاية الأسبوع) لأن الموعد الدقيق غير معروف.">
              {ag && <Badge tone={openToday ? 'warn' : 'ok'}>{openToday ? `${openToday} لليوم` : 'لا شيء لليوم'}</Badge>}
              <Link to="/week">الأسبوع</Link>
            </CardHead>
            {agErr ? <p className="muted">تعذّر تحميل المواعيد.</p> : !ag ? <><Skeleton h={14} /><div style={{ height: 8 }} /><Skeleton h={14} w="70%" /></> : (
              <div className="stack" style={{ gap: 'var(--s-4)' }}>
                {ag.overdue.length > 0 && (
                  <section aria-label="متأخرة">
                    <h3 className="ag-h late">متأخرة ({ag.overdue.length})</h3>
                    <AgendaList entries={ag.overdue.slice(0, 6)} today={today} onChanged={loadAg} compact />
                  </section>
                )}
                <section aria-label="اليوم">
                  <h3 className="ag-h">اليوم</h3>
                  <AgendaList entries={todayItems} today={today} onChanged={loadAg} empty="لا مواعيد محددة لليوم." compact />
                </section>
                <section aria-label="الأيام السبعة القادمة">
                  <h3 className="ag-h">خلال 7 أيام</h3>
                  <AgendaList entries={soon.slice(0, 8)} today={today} onChanged={loadAg} empty="لا مواعيد قادمة معروفة هذا الأسبوع." compact />
                  {soon.length > 8 && <Link to="/week" className="more-link">+{soon.length - 8} أخرى في «هذا الأسبوع»</Link>}
                </section>
                {ag.undated > 0 && <p className="muted small" style={{ margin: 0 }}>{ag.undated} بندًا بلا موعد معروف — <Link to="/everything?horizon=undated">راجعها</Link></p>}
              </div>
            )}
          </Card>
          <div className="stack" style={{ gap: 'var(--s-5)' }}>
            <WorkoutToday />
            <LifeToday />
          </div>
        </div>
        <div className="grid cols-3">
          <ContinueReading />
          <InboxPeek />
          <Alerts unknownCount={unknownCount} activeId={activeId} />
        </div>

        {!semesters ? (
          <Skeleton h={190} r={26} />
        ) : act ? (
          <Hero
            eyebrow={<><Icon name="calendar" size={14} /> الفصل النشط</>}
            title={<><bdi>{act.code}</bdi>{ph?.week ? ` — الأسبوع ${ph.week}` : ph?.kind === 'exam' ? ' — الامتحانات' : ''}</>}
            text={<><bdi>{act.name}</bdi> · {act.course_count} مواد · {act.assessment_count} تقييم</>}
          >
            <Link to={`/academic/s/${act.id}`} className="btn sm ink">افتح اللوحة</Link>
            <Link to={`/academic/s/${act.id}/timeline`} className="btn sm">الجدول الزمني</Link>
            <Link to="/academic" className="btn sm">كل الفصول</Link>
          </Hero>
        ) : (
          <Hero title="ابدأ من أي مكان" text="لا توجد فصول بعد. أضف فصلك، أو ابدأ مساحة لأي شيء آخر (قراءة، مشاريع، طلبات توظيف…).">
            <Link to="/academic?new=1" className="btn sm ink">فصل جديد</Link>
            <Link to="/spaces/templates" className="btn sm">مساحة من قالب</Link>
          </Hero>
        )}

        <section aria-label="الخطوط">
          <h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}>الخطوط</h2>
          <div className="grid cols-3 plugin-grid">
            {DOMAIN_LINES.map((p) => (
              <Link key={p.id} to={p.basePath} className={`plugin-card ${p.status}`} style={{ '--c': p.color } as never}>
                <span className="pc-ico"><Icon name={p.icon} size={26} /></span>
                <strong>{p.name.ar}</strong>
                <span className="muted">{p.tagline}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid cols-3">
          <StatTile tone="purple" icon="layers" label="الفصول" value={semesters?.length ?? '…'} to="/academic" />
          <StatTile tone="green" icon="database" label="بياناتك" value="محلية" sub="ملف واحد + نسخ يومية" to="/settings#data" />
          <StatTile tone="orange" icon="hash" label="اختصارات" value="؟" sub="n للإنشاء · / للبحث" />
        </div>

        <Card>
          <CardHead title="ابدأ بسرعة" icon="zap" />
          <div className="quick">
            <Button icon="target" onClick={() => openCreate({ kind: 'quick-assessment' })}>تقييم جديد</Button>
            <Button icon="check" onClick={() => openCreate({ kind: 'quick-item' })}>عنصر في مساحة</Button>
            <Link to="/academic?new=1" className="btn"><Icon name="plus" size={16} /> فصل جديد</Link>
            {act && <Link to={`/academic/s/${act.id}/courses?new=1`} className="btn"><Icon name="book" size={16} /> إضافة مادة</Link>}
            {act && <Link to={`/academic/s/${act.id}/calculator`} className="btn"><Icon name="calc" size={16} /> الحاسبة</Link>}
            <Link to="/map" className="btn"><Icon name="pin" size={16} /> خريطة الموقع</Link>
            <Link to="/settings#data" className="btn"><Icon name="download" size={16} /> نسخة احتياطية</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** التقاط سريع: Enter = عنصر جديد في آخر مساحة استُخدمت (أو «مهامي» تُنشأ تلقائيًا) */
function QuickCapture() {
  const { spaces, reloadSpaces, toast } = useApp();
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const target = (): string | undefined => {
    let last = '';
    try {
      last = localStorage.getItem('platform.lastSpace') ?? '';
    } catch {
      /* تجاهل */
    }
    return spaces?.find((s) => s.id === last)?.id ?? spaces?.[0]?.id;
  };
  const name = spaces?.find((s) => s.id === target())?.name ?? 'مهامي';
  const save = async (): Promise<void> => {
    const t = v.trim();
    if (!t) return;
    setBusy(true);
    try {
      let sid = target();
      if (!sid) {
        sid = (await wos.createSpace({ template_id: 'tasks' })).id;
      }
      await wos.addItem(sid, { title: t });
      try {
        localStorage.setItem('platform.lastSpace', sid);
      } catch {
        /* تجاهل */
      }
      setV('');
      void reloadSpaces();
      window.dispatchEvent(new CustomEvent('platform:items-changed', { detail: { spaceId: sid } }));
      toast(`التُقط في «${name}»`, { kind: 'ok' });
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="capture" onSubmit={(e) => { e.preventDefault(); void save(); }} role="search" aria-label="التقاط سريع">
      <Icon name="plus" size={18} />
      <label htmlFor="capture" className="sr-only">التقاط سريع إلى {name}</label>
      <input id="capture" value={v} onChange={(e) => setV(e.target.value)} placeholder={`التقط فكرة أو مهمة… (تُحفظ في «${name}»)`} maxLength={300} disabled={busy} />
      <button type="submit" className="btn sm primary" disabled={busy || !v.trim()}>التقاط</button>
    </form>
  );
}

function WorkoutToday() {
  const [m, setM] = useState<MyWeek | null | 'err'>(null);
  useEffect(() => void sportsApi.mine().then(setM).catch(() => setM('err')), []);
  const day = JS_DAY[new Date(Date.now() + 8 * 3_600_000).getUTCDay()]!;
  const w = m && m !== 'err' ? m.workouts.find((x) => x.id === m.week[day]) : undefined;
  return (
    <Card>
      <CardHead title={`تمرين اليوم (${WEEKDAY_AR[day]})`} icon="dumbbell">
        <Link to="/sports/mine">تماريني</Link>
      </CardHead>
      {m === null ? <Skeleton h={40} /> : m === 'err' ? <p className="muted">تعذّر التحميل.</p> : w ? (
        <div className="stack" style={{ gap: 6 }}>
          <strong><bdi>{w.name}</bdi></strong>
          <span className="muted small">{w.items.length} تمارين{w.items[0] ? ` · يبدأ بـ ${w.items[0].ar_name}` : ''}</span>
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>لا تمرين معيّن لليوم. <Link to="/sports/mine">عيّن تمرينًا</Link></p>
      )}
    </Card>
  );
}

function LifeToday() {
  const d = useLife(['finance', 'prayers', 'habits', 'routine']);
  const now = useNow(60_000);
  const fin = d.get<Finance>('finance');
  const pr = d.get<Prayers>('prayers');
  const hb = d.get<Habits>('habits');
  const rt = d.get<Routine>('routine');
  const daily = fin?.balances_block?.items?.find((i) => i.key === 'daily');
  const kl = klToday();
  const row = pr?.attendance?.days?.find((x) => x.date === kl);
  const nn = rt ? nowAndNext(rt, now) : null;
  return (
    <Card>
      <CardHead title="الحياة اليوم" icon="heart" info="قراءة فقط من صادرات راشد. ما لم يُسجَّل يظهر «غير معروف» — ليس صفرًا.">
        <Link to="/life">الحياة</Link>
      </CardHead>
      {d.loading ? <Skeleton h={60} /> : !d.status?.root_exists ? <p className="muted" style={{ margin: 0 }}>مجلد صادرات راشد غير متاح. <Link to="/life/settings">الإعدادات</Link></p> : (
        <dl className="kv today-life">
          <dt>الصلاة</dt>
          <dd className="pray-chips">
            {PRAYER_KEYS.map((k) => {
              const s = row?.status?.[k];
              const txt = typeof s === 'string' ? PRAY_TXT[s] ?? s : 'غير معروف';
              return <span key={k} className={`pc pc-${typeof s === 'string' ? s : 'unknown'}`} title={`${PRAYER_AR[k]}: ${txt}`}>{PRAYER_AR[k]}<span className="sr-only">: {txt}</span></span>;
            })}
          </dd>
          <dt>اليومية</dt>
          <dd>{daily ? <Money v={daily.amount} c={daily.confidence} /> : <Unknown />}</dd>
          <dt>العادات</dt>
          <dd>{hb ? (hb.status?.started ? <Badge tone="ok">بدأت</Badge> : <Badge tone="warn">لم تبدأ بعد</Badge>) : <Unknown />} {hb?.status?.started_confidence && <Conf c={hb.status.started_confidence} />}</dd>
          <dt>الآن</dt>
          <dd>{nn?.current[0] ? <><b>{nn.current[0].b.name}</b> <span className="muted small num">{hm(nn.current[0].start)}–{hm(nn.current[0].end)}</span></> : nn?.next ? <>التالي: <b>{nn.next.b.name}</b> <span className="muted small num">{hm(nn.next.start)}</span></> : <Unknown />}</dd>
        </dl>
      )}
    </Card>
  );
}

function ContinueReading() {
  const [items, setItems] = useState<LibItem[] | null>(null);
  useEffect(() => void lib.recent(4).then(setItems).catch(() => setItems([])), []);
  return (
    <Card>
      <CardHead title="تابع من حيث توقفت" icon="book"><Link to="/library">المكتبة</Link></CardHead>
      {!items ? <Skeleton h={40} /> : items.length ? (
        <ul className="plain mini-list">
          {items.map((i) => (
            <li key={i.ref}><Link to={i.source === 'youtube' ? `/library/y/${i.id}` : `/library/f/${i.id}`}><Icon name={i.source === 'youtube' ? 'play' : 'file'} size={15} /> <bdi>{i.title}</bdi></Link></li>
          ))}
        </ul>
      ) : <p className="muted" style={{ margin: 0 }}>لم تفتح ملفات بعد.</p>}
    </Card>
  );
}

function InboxPeek() {
  const [rows, setRows] = useState<InboxEntry[] | null>(null);
  useEffect(() => void wos.inbox().then(setRows).catch(() => setRows([])), []);
  const unread = rows?.filter((r) => !r.read) ?? [];
  return (
    <Card>
      <CardHead title="الوارد" icon="bell">{unread.length > 0 && <Badge tone="accent">{unread.length} جديد</Badge>}<Link to="/inbox">الكل</Link></CardHead>
      {!rows ? <Skeleton h={40} /> : unread.length ? (
        <ul className="plain mini-list">
          {unread.slice(0, 3).map((r) => <li key={r.id}>{r.to ? <Link to={r.to}><bdi>{r.title}</bdi></Link> : <bdi>{r.title}</bdi>}{r.body && <small className="muted"> · <bdi>{r.body}</bdi></small>}</li>)}
        </ul>
      ) : <p className="muted" style={{ margin: 0 }}>لا تنبيهات جديدة. التنبيهات تأتي من قواعد الأتمتة في مساحاتك.</p>}
    </Card>
  );
}

function Alerts({ unknownCount, activeId }: { unknownCount: number; activeId: string | null }) {
  const [libMissing, setLibMissing] = useState<boolean | null>(null);
  useEffect(() => void lib.status().then((s) => setLibMissing(!s.root_exists)).catch(() => setLibMissing(null)), []);
  const rows: { to: string; text: string; tone: 'warn' | 'danger' }[] = [];
  if (libMissing) rows.push({ to: '/library/settings', text: 'مجلد المكتبة غير موجود على هذا الجهاز — حدّد المجلد', tone: 'danger' });
  if (unknownCount > 0 && activeId) rows.push({ to: `/academic/s/${activeId}/unknowns`, text: `${unknownCount} بندًا غير معروف في الفصل`, tone: 'warn' });
  return (
    <Card>
      <CardHead title="تنبيهات" icon="warn" />
      {rows.length ? (
        <ul className="plain mini-list">
          {rows.map((r) => <li key={r.to}><Link to={r.to}><Badge tone={r.tone}>!</Badge> {r.text}</Link></li>)}
        </ul>
      ) : <p className="muted" style={{ margin: 0 }}>{libMissing === null ? '…' : 'لا تنبيهات. كل المصادر متاحة.'}</p>}
    </Card>
  );
}
