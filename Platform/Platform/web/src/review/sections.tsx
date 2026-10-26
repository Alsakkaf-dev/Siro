import { Link } from 'react-router-dom';
import { Badge } from '../ui/ui.js';
import { Term } from '../glossary/glossary.js';
import { fmtAt, fmtDay, money } from '../life/lifeKit.js';
import { TagBadge, Tbl, V, VN, H3 } from './kit.js';
import { DAY_AR, DAY_CODES, PRAYER_AR, PRAYER_KEYS } from '../../../shared/life.js';
import type { HabitsWeek, MoneyWeek, PrayerWeek, RoutineWeek, Tag, WeightWeek } from '../../../shared/weekly.js';

const dayName = (iso: string): string => DAY_AR[DAY_CODES[new Date(`${iso}T00:00:00Z`).getUTCDay()]!]!;
const dl = (iso: string): string => `${dayName(iso)} ${fmtDay(iso)}`;
const CELL: Record<string, { t: string; c: string }> = {
  in_time: { t: 'في وقتها', c: 'ok' }, late: { t: 'متأخرة', c: 'warn' }, missed: { t: 'فاتت', c: 'danger' }, unknown: { t: 'غير معروف', c: 'unk' }, none: { t: 'غير مسجل', c: 'none' }, future: { t: 'لم يأتِ', c: 'fut' },
};
const hm = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/* ───── 1) الصلاة ───── */
export function PrayerBody({ p, partial }: { p: PrayerWeek; partial: boolean }) {
  const c = p.counts;
  const q = p.qada;
  return (
    <div className="stack">
      <div className="rv-kpis">
        {([['in_time', 'في وقتها', 'ok'], ['late', 'متأخرة', 'warn'], ['missed', 'فاتت', 'danger'], ['unknown', 'غير معروفة', 'unk']] as const).map(([k, l, t]) => (
          <div key={k} className={`rv-kpi k-${t}`}>
            <span>{l}</span>
            <b className="num">{c ? c[k] : <TagBadge tag="غير مسجل" />}</b>
          </div>
        ))}
      </div>
      <p className="rv-fine row">
        {c ? <>الوسم: <TagBadge tag={p.countsTag} /></> : <TagBadge tag="غير مسجل" />}
        {partial && <Badge dashed>يوم السبت ما انتهى</Badge>}
      </p>
      <p style={{ margin: 0 }}>
        نسبة الصلاة في وقتها: <V text={p.onTime.pct === null ? null : `${p.onTime.pct}%`} tag={p.onTime.tag} field="in_time ÷ (in_time + late + missed)" />
        <small className="muted"> {p.onTime.den > 0 ? `(${p.onTime.num} من ${p.onTime.den}؛ «غير معروف» خارج المقام)` : ''}</small>
      </p>
      <Tbl label="الصلوات حسب اليوم">
        <thead><tr><th scope="col">اليوم</th>{PRAYER_KEYS.map((k) => <th key={k} scope="col">{PRAYER_AR[k]}</th>)}</tr></thead>
        <tbody>
          {p.rows.map((r) => (
            <tr key={r.date}>
              <th scope="row">{dl(r.date)}</th>
              {PRAYER_KEYS.map((k) => {
                const x = CELL[r.cells[k]]!;
                return <td key={k}><span className={`rv-cell c-${x.c}`}>{x.t}</span></td>;
              })}
            </tr>
          ))}
        </tbody>
      </Tbl>
      {p.missingDates.length > 0 && <p className="rv-fine"><b>أيام بلا صف في السجل:</b> {p.missingDates.map(dl).join('، ')} <TagBadge tag="غير مسجل" /> <span className="muted">(ليست «فاتت» وليست 0)</span></p>}
      {p.coverageNote && <p className="muted rv-fine">{p.coverageNote}</p>}

      <H3><Term id="qada">القضاء</Term></H3>
      <ul className="rv-pr">
        {q.remaining.map((r) => <li key={r.key}><span>{r.name}</span><b className="num">{r.count ?? <TagBadge tag="غير مسجل" />}</b></li>)}
      </ul>
      <p style={{ margin: 0 }}>
        المجموع المتبقي: <VN v={q.total} /> {q.sumMatches === false && <Badge tone="danger">لا يساوي مجموع الخمس ({q.sum})</Badge>}
        {q.sumMatches === true && <small className="muted"> (يطابق مجموع الخمس)</small>}
        {q.asOf && <small className="muted"> · حتى {fmtAt(q.asOf)}</small>}
      </p>
      {q.pending && <p className="rv-fine"><b>لم يُضف بعد:</b> {q.pending}</p>}
      <p style={{ margin: 0 }}>
        زيادة القضاء هذا الأسبوع (فرائض فاتت): <V text={q.increase.value === null ? null : `${q.increase.value > 0 ? '+' : ''}${q.increase.value}`} tag={q.increase.tag} field="prayers.json › qada.history[]" />
        {q.increase.toDate && q.increase.fromDate && <small className="muted"> (من {fmtDay(q.increase.fromDate)} إلى {fmtDay(q.increase.toDate)})</small>}
        <small className="muted"> — زيادة القضاء ليست إنجازًا.</small>
      </p>
      <p style={{ margin: 0 }}>القضاء المنجز هذا الأسبوع: <VN v={q.doneWeek} /> <small className="muted">(لا يوجد حقل؛ لا نحسبه من فرق المجاميع)</small></p>
      <p style={{ margin: 0 }}>القضاء المنجز من البداية: <VN v={q.doneTotal} /> · اليوم: {q.doneTodayStale ? <><Badge dashed>غير معروف</Badge> <small className="muted">(آخر قيمة {q.doneTodayStale.value} كانت ليوم {fmtDay(q.doneTodayStale.date)}، لا تخص اليوم)</small></> : <VN v={q.doneToday} />}</p>
      {q.baseline.total !== null && <p className="muted rv-fine">خط الأساس: <b className="num">{q.baseline.total}</b> بتاريخ {q.baseline.date ? fmtDay(q.baseline.date) : '—'} <TagBadge tag={q.baseline.tag} /></p>}
      <Link to="/life/prayers" className="btn sm">الصلاة والقضاء</Link>
    </div>
  );
}

/* ───── 2) العادات ───── */
export function HabitsBody({ h }: { h: HabitsWeek }) {
  return (
    <div className="stack">
      {h.started !== true && (
        <div className="rv-warn" role="note">
          <b>الأنظمة {h.started === false ? 'لم تبدأ بعد' : 'بدايتها غير مسجلة'}.</b> {h.startedNote} <TagBadge tag={h.startedTag} />
          <br /><small>كل السلاسل تظهر كما في الملف (0) والبداية غير مؤكدة.</small>
        </div>
      )}
      {h.streakDef && <p className="muted rv-fine"><Term id="streak">السلسلة</Term>: {h.streakDef}</p>}
      <div className="rv-habits">
        {h.habits.map((x) => (
          <section key={x.key} className="rv-habit" aria-label={x.name}>
            <h3 className="rv-h">{x.name}</h3>
            <p className="rv-fine" style={{ margin: 0 }}>
              السلسلة الحالية: <VN v={x.streak.current} /> · الأفضل: <VN v={x.streak.best} />
            </p>
            <ul className="life-list">
              {x.lines.map((l, i) => (
                <li key={i}>
                  <span>{l.label}: </span><V text={l.text} tag={l.tag} field={l.field} />
                  {l.note && <small className="muted" style={{ display: 'block' }}>{l.note}</small>}
                </li>
              ))}
              {x.lines.length === 0 && <li><TagBadge tag="غير مسجل" /></li>}
            </ul>
          </section>
        ))}
      </div>
      <H3>الملخص اليومي</H3>
      <Tbl label="ملخص العادات اليومي">
        <thead><tr><th scope="col">اليوم</th>{h.daily[0]?.fields.map((f) => <th key={f.label} scope="col">{f.label}</th>)}</tr></thead>
        <tbody>
          {h.daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">{dl(d.date)}</th>
              {d.fields.map((f) => <td key={f.label}>{f.text === null ? <TagBadge tag="غير مسجل" /> : <bdi className="num">{f.text}</bdi>}</td>)}
            </tr>
          ))}
        </tbody>
      </Tbl>
      {h.unrecorded.length > 0 && (
        <details className="fold">
          <summary>مدخلات العادات غير المسجلة ({h.unrecorded.length})</summary>
          <ul className="life-list">{h.unrecorded.map((u) => <li key={u.key}><bdi dir="ltr">{u.key}</bdi> <TagBadge tag="غير مسجل" /><small className="muted" style={{ display: 'block' }}>{u.note}</small></li>)}</ul>
        </details>
      )}
      <p className="rv-fine">بدائل العادات <TagBadge tag="افتراض" /> اقتراحات فقط: <Link to="/life/alternatives">افتح البدائل</Link></p>
      <Link to="/life/habits" className="btn sm">تفاصيل العادات</Link>
    </div>
  );
}

/* ───── 3) الوزن ───── */
export function WeightBody({ w }: { w: WeightWeek }) {
  const kg = (n: number | null): string | null => (n === null ? null : `${n} كغ`);
  return (
    <div className="stack">
      <p className="rv-big"><V text={kg(w.latest.kg)} tag={w.latest.tag} field="body.json › latest_recorded_weight" /> <small className="muted">{w.latest.date ? `آخر قراءة مسجلة · ${fmtDay(w.latest.date)}` : ''}</small></p>
      <ul className="life-list">
        <li>قراءة هذا الأسبوع: {w.inWindow ? <><V text={kg(w.inWindow.kg)} tag={w.inWindow.tag} /> <small className="muted">· {fmtDay(w.inWindow.date)}</small></> : <><TagBadge tag="غير مسجل" /> <small className="muted">غير مسجل هذا الأسبوع{w.latest.kg !== null && w.latest.date ? ` — آخر قراءة ${w.latest.kg} كغ بتاريخ ${fmtDay(w.latest.date)}` : ''}</small></>}</li>
        <li>التغير عن قبل النافذة: <V text={w.change.kg === null ? null : `${w.change.kg > 0 ? '+' : ''}${w.change.kg} كغ`} tag={w.change.tag} field="body.json › weight_history[]" />{w.change.from && <small className="muted"> (مقابل {w.change.from.kg} كغ في {fmtDay(w.change.from.date)})</small>}</li>
        <li>خط الأساس: {w.baseline ? <><V text={kg(w.baseline.kg)} tag={w.baseline.tag} /> <small className="muted">· {fmtDay(w.baseline.date)}{w.baseline.confirmedAt ? ` — أكّده محمد ${fmtDay(w.baseline.confirmedAt)}` : ''}</small></> : <TagBadge tag="غير مسجل" />}</li>
        <li>الهدف: <VN v={w.goal} suffix=" كغ" /></li>
        <li>المتبقي للهدف: <V text={kg(w.remaining.kg)} tag={w.remaining.tag} field="latest_recorded_weight − goal_kg" /></li>
        <li>قراءة جديدة: <VN v={w.next} suffix=" كغ" /></li>
      </ul>
      {w.conflictNote && <div className="rv-warn" role="note"><b>تعارض قراءات:</b> {w.conflictNote}</div>}
      <Link to="/life/body" className="btn sm">الجسم والوزن</Link>
    </div>
  );
}

/* ───── 4) المال ───── */
const RM = (n: number | null): string | null => (n === null ? null : money(n));
export function MoneyBody({ m }: { m: MoneyWeek }) {
  const top = Math.max(1, ...m.byCategory.map((c) => c.total));
  return (
    <div className="stack">
      <H3>الأرصدة اليوم {m.asOf && <small className="muted">· حتى {fmtAt(m.asOf)}</small>}</H3>
      <ul className="rv-pr">
        {m.balances.map((b) => <li key={b.key}><span>{b.label}</span><b><VN v={b.v} fmt={(n) => money(n)} /></b></li>)}
        {m.balances.length === 0 && <li><TagBadge tag="غير مسجل" /></li>}
      </ul>
      <ul className="life-list">
        {m.accounts.map((a) => <li key={a.key}>{a.label}: <VN v={a.v} fmt={(n) => money(n)} />{a.statedAt && <small className="muted"> · قال محمد {fmtDay(a.statedAt)}</small>}</li>)}
      </ul>
      <H3>تغير الأرصدة هذا الأسبوع</H3>
      <ul className="rv-pr">
        {m.changes.map((c) => (
          <li key={c.key}><span>{c.label}</span><b><V text={c.delta === null ? null : `${c.delta > 0 ? '+' : ''}${money(c.delta).replace('RM ', 'RM ')}`} tag={c.tag} field="finance.json › balance_history[]" /></b></li>
        ))}
      </ul>
      <H3>الصرف</H3>
      <p style={{ margin: 0 }}>المبلغ عنه: <V text={RM(m.reported.total)} tag={m.reported.tag} field="recent_transactions[type=expense]" /> <small className="muted">· {m.reported.count} حركة</small></p>
      {m.reported.note && <p className="rv-fine muted">{m.reported.note}</p>}
      <p style={{ margin: 0 }}>المطبّق على الصناديق: <V text={RM(m.applied.total)} tag={m.applied.tag} field="مجموع الأثر على الصندوق" /> <small className="muted">· {m.applied.count} حركة</small></p>
      {m.applied.noBox.count > 0 && <p className="rv-fine" style={{ margin: 0 }}><b>بدون صندوق:</b> <bdi className="num">{money(m.applied.noBox.total)}</bdi> في {m.applied.noBox.count} حركة <span className="muted">(الأثر على الصندوق = 0 يعني «ما انحسب على صندوق» وليس أن المبلغ لم يخرج)</span></p>}
      {m.byCategory.length > 0 && (
        <ul className="plain rv-bars">
          {m.byCategory.map((c) => (
            <li key={c.category}><span>{c.category}</span><i style={{ ['--w' as string]: `${Math.max(4, (c.total / top) * 100)}%` }} /><b className="num">{money(c.total)} <TagBadge tag={c.tag} /></b></li>
          ))}
        </ul>
      )}
      <H3>اليومية</H3>
      <ul className="life-list">
        <li>صرف اليومية: <V text={RM(m.daily.spent)} tag={m.daily.tag} field="الصندوق = يومية · الأثر على الصندوق" /></li>
        <li>المعدل اليومي: <V text={RM(m.daily.rate)} tag={m.daily.tag} /></li>
        <li>أيام التغطية: {m.daily.negative ? <><Badge tone="danger">سالبة</Badge> <small className="muted">(الرصيد {m.daily.balance !== null ? money(m.daily.balance) : ''})</small></> : <V text={m.daily.coverageDays === null ? null : `${m.daily.coverageDays} يوم`} tag={m.daily.coverageDays === null ? 'غير مسجل' : 'محسوب'} field="رصيد اليومية ÷ المعدل" />}</li>
      </ul>
      <H3>التعبئات المجدولة</H3>
      <ul className="life-list">
        {m.topups.map((t) => (
          <li key={t.from}>
            {fmtDay(t.from)} ← {t.to ? fmtDay(t.to) : 'مفتوح'}: {t.perDay !== null && <bdi className="num">{money(t.perDay)}/يوم</bdi>}{' '}
            {t.open ? <Badge dashed>مفتوح [افتراض]</Badge> : <TagBadge tag={t.tag} />}
            <small className="muted" style={{ display: 'block' }}>{t.days > 0 ? `${t.days} أيام في النافذة${t.amount !== null ? ` = ${money(t.amount)}` : ''}` : 'لا أيام من هذه الفترة في النافذة'}</small>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0 }}>تغطية الشهري: <V text={m.monthly.days === null ? null : `${m.monthly.days} يوم`} tag={m.monthly.tag} field="الرصيد ÷ per_day" />{m.monthly.perDay && <small className="muted"> ({money(m.monthly.balance ?? 0)} ÷ {money(m.monthly.perDay)})</small>}</p>
      {m.computedNotes.map((n, i) => <p key={i} className="rv-fine rv-warn" role="note">{n.text} <TagBadge tag={n.tag} /></p>)}
      <H3>البنود المفتوحة ({m.openItems.length})</H3>
      {m.openItems.length === 0 ? <p className="muted">لا بنود</p> : (
        <ul className="life-list">{m.openItems.map((o) => <li key={o.id}>{o.title}{o.amount !== null && <> · <bdi className="num">{money(o.amount)}</bdi></>} <TagBadge tag={o.tag} /></li>)}</ul>
      )}
      {m.openLoops && <p className="rv-fine" style={{ margin: 0 }}>كل البنود المفتوحة (كل المجالات): <b className="num">{m.openLoops.openOrWaiting ?? '—'}</b> ({m.openLoops.open} مفتوح + {m.openLoops.waiting} بانتظار) <TagBadge tag={m.openLoops.tag} />{m.openLoops.method && <small className="muted" style={{ display: 'block' }}>{m.openLoops.method}</small>}</p>}
      <H3>الديون عند الناس</H3>
      <ul className="life-list">
        {m.receivables.map((r) => <li key={r.person}>{r.person}: <VN v={r.amount} fmt={(n) => money(n)} />{r.amount.value === null && r.last !== null && <small className="muted"> · آخر مبلغ مسجل <bdi className="num">{money(r.last)}</bdi></small>}</li>)}
        {m.receivables.length === 0 && <li className="muted">لا ديون مسجلة</li>}
      </ul>
      <H3>التخطيط</H3>
      <ul className="life-list">{m.planning.map((p) => <li key={p.key}>{p.label}: <TagBadge tag="غير مسجل" title={p.v.field} /></li>)}</ul>
      {m.txNote && <p className="muted rv-fine">{m.txNote} تاريخ الحركة ليس وقت تسجيلها.</p>}
      <Link to="/life/finance" className="btn sm">تفاصيل المالية</Link>
    </div>
  );
}

/* ───── 5) الروتين والأسبوع القادم ───── */
const KIND_CLS: Record<string, string> = { sleep: 'sleep', routine: 'routine', prayer: 'prayer', free: 'free', lecture: 'study', study: 'study' };
export function RoutineBody({ r, nextRange }: { r: RoutineWeek; nextRange: string }) {
  return (
    <div className="stack">
      <p className="rv-fine" style={{ margin: 0 }}>الأسبوع القادم: {nextRange}. الروتين جدول ثابت وليس فيه سجل التزام، فلا نسبة التزام.</p>
      <H3>كتل الدراسة <small className="muted">· المجموع <V text={r.studyHours.hours === null ? null : `${r.studyHours.hours} ساعة`} tag={r.studyHours.tag} field="Σ (end − start) × days" /></small></H3>
      <ul className="rv-days">
        {r.studyByDay.map((d) => (
          <li key={d.day}>
            <b>{d.ar} <small className="muted">{fmtDay(d.date)}</small></b>
            <span>{d.blocks.length ? d.blocks.map((b) => <bdi key={b.name + b.start} className="rv-chip num">{b.name} {b.start}–{b.end}</bdi>) : <span className="muted">لا كتل</span>}</span>
          </li>
        ))}
      </ul>
      <H3>شريط الأسبوع</H3>
      <div className="rv-strip">
        {r.strip.map((d) => (
          <div key={d.day} className="rv-strip-row" role="img" aria-label={`${d.ar}: ${d.items.length} كتلة`}>
            <span className="rv-strip-l">{d.ar}</span>
            <div className="rv-strip-bar">
              {d.items.map((x, i) => <i key={i} className={`k-${KIND_CLS[x.kind] ?? 'routine'}${x.moves ? ' mv' : ''}`} title={`${x.name} ${hm(x.start)}–${hm(x.end)}${x.moves ? ' (تتحرك مع وقت الصلاة)' : ''}`} style={{ insetInlineStart: `${(x.start / 1440) * 100}%`, inlineSize: `${Math.max(0.6, ((Math.min(x.end, 1440) - x.start) / 1440) * 100)}%` }} />)}
            </div>
          </div>
        ))}
      </div>
      <p className="muted rv-fine">الخطوط المائلة = كتل تتحرك مع وقت الصلاة. الألوان: نوم، روتين، صلاة، حر، دراسة.</p>
      <H3>الروتينات المحلية</H3>
      <ul className="life-list">
        {r.local.map((x) => (
          <li key={x.name}><b>{x.name}</b> · <bdi className="num">{x.time}</bdi> · {x.days} <TagBadge tag={x.tag} />{!x.inOutlook && <Badge dashed>ليس في التقويم</Badge>}{x.note && <small className="muted" style={{ display: 'block' }}>{x.note}</small>}</li>
        ))}
      </ul>
      <p className="rv-warn rv-fine" role="note"><b>موعد المراجعة الأسبوعية:</b> {r.reviewDay.saturdayAssumed ? <>«{r.reviewDay.saturdayAssumed} [افتراض]»</> : <TagBadge tag="غير مسجل" />} — روتين محلي من ملفات التسليم القديمة وليس في التقويم، بينما ملف فارس القديم (<bdi dir="ltr">TIME_MANAGEMENT.md</bdi>) يضعها يوم الأحد. التعارض لم ينحسم، فلا نعرضه كقرار.</p>
      <H3>الإجازات في الأسبوع القادم</H3>
      {r.holidays.length ? <ul className="life-list">{r.holidays.map((h) => <li key={h.name + h.from}>{h.name} · {fmtDay(h.from)}{h.to ? ` ← ${fmtDay(h.to)}` : ''} <TagBadge tag={h.tag} /></li>)}</ul> : <p className="muted">لا إجازات مسجلة</p>}
      <H3>تعارضات معروفة ({r.conflicts.length})</H3>
      {r.conflicts.length ? <ul className="life-list">{r.conflicts.map((c) => <li key={c.id}>{c.text}</li>)}</ul> : <p className="muted">لا تعارضات مسجلة</p>}
      {r.prayerRef && <p className="muted rv-fine">أوقات الصلاة المرجعية ({r.prayerRef.date ? fmtDay(r.prayerRef.date) : 'تاريخ غير مسجل'}، {r.prayerRef.zone ?? ''}) <TagBadge tag={r.prayerRef.tag} />: {r.prayerRef.times.map((t) => `${t.ar} ${t.time}`).join(' · ')}. تتحرك كل يوم، فهذه مرجع قديم نسبيًا.</p>}
    </div>
  );
}

export const tagCount = (xs: { tag: Tag }[], t: Tag): number => xs.filter((x) => x.tag === t).length;
