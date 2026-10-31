import { useMemo, useState } from 'react';
import { Badge, Card, CardHead, Segmented } from '../ui/ui.js';
import { useNow } from '../widgets/tiles.js';
import { Conf, LifePage, Note, fmtDayFull, useLife } from '../life/lifeKit.js';
import { blocksForDay, DAY_AR, DAY_CODES, nowAndNext, stripEmoji, type Routine } from '../../../shared/life.js';

const KIND_COLOR: Record<string, string> = { sleep: '#8A92B2', prayer: '#4ADE80', lecture: '#4CC9F0', routine: '#F2A93B', meal: '#F472B6', study: '#A78BFA' };
export const hm = (m: number): string => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export default function LifeRoutine() {
  const d = useLife(['routine']);
  const r = d.get<Routine>('routine');
  return (
    <LifePage title="الروتين" icon="timer" names={['routine']} data={d} sub="جدول اليوم والأسبوع بتوقيت ماليزيا — قراءة فقط.">
      {r && <Body r={r} />}
    </LifePage>
  );
}

function Body({ r }: { r: Routine }) {
  const now = useNow(30_000);
  const nn = useMemo(() => nowAndNext(r, now), [r, now]);
  const [day, setDay] = useState<string>(nn.day);
  const list = useMemo(() => blocksForDay(r, day), [r, day]);
  const isToday = day === nn.day;
  const ref = r.prayer_times_reference;
  return (
    <>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="الآن والتالي" icon="clock" />
          <div className="now-card">
            {nn.current.length ? nn.current.map((c) => (
              <div key={c.b.name + c.start}><span className="muted">الآن · <bdi className="num">{hm(c.start)}–{hm(c.end)}</bdi></span><div className="big">{c.b.name}</div></div>
            )) : <div className="big muted">لا كتلة حالية</div>}
            {nn.next ? (
              <p style={{ margin: 0 }}>التالي: <b>{nn.next.b.name}</b> عند <bdi className="num">{hm(nn.next.start)}</bdi> <span className="muted">(بعد {nn.next.start - nn.minute} دقيقة)</span></p>
            ) : (
              <p className="muted" style={{ margin: 0 }}>لا كتل أخرى اليوم.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHead title="مواقيت الصلاة المرجعية" icon="bell">
            <Conf c={ref?.confidence} />
          </CardHead>
          {ref ? (
            <>
              <div className="kpis">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((k) => (
                  <div key={k} className="kpi"><span className="kpi-l">{{ fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' }[k]}</span><strong className="kpi-v num">{String(ref[k] ?? '—')}</strong></div>
                ))}
              </div>
              <Note tone="warn">هذه مواقيت مرجعية بتاريخ {fmtDayFull(String(ref.date))} (منطقة {String(ref.zone ?? '—')}) وتتحرك مع الأيام؛ لا تعتمد عليها كمواقيت اليوم.</Note>
            </>
          ) : <p className="muted">لا مواقيت مرجعية في الملف.</p>}
        </Card>
      </div>
      <Card>
        <CardHead title="جدول اليوم" icon="calendar" />
        <div className="stack">
          <Segmented label="اليوم" value={day} onChange={setDay} options={DAY_CODES.map((c) => ({ value: c, label: DAY_AR[c] ?? c }))} />
          {list.length ? (
            <div className="tl">
              {list.map((x, i) => {
                const cur = isToday && x.start <= nn.minute && nn.minute < x.end;
                const past = isToday && x.end <= nn.minute;
                return (
                  <div key={x.b.name + x.start + i} className={`tl-item ${cur ? 'now' : ''} ${past ? 'past' : ''}`} aria-current={cur ? 'time' : undefined}>
                    <bdi className="tl-time num">{hm(x.start)}–{hm(x.end)}</bdi>
                    <div className="tl-bar" style={{ '--c': KIND_COLOR[x.b.kind ?? ''] ?? 'var(--life)' } as never}>
                      <b>{x.b.name} {cur && <Badge tone="ok">الآن</Badge>}</b>
                      <small>{x.b.calendar ?? ''}{x.b.moves_with_prayer_time ? ' · يتحرك مع وقت الصلاة' : ''} <Conf c={x.b.confidence} /></small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="muted">لا كتل مسجّلة لهذا اليوم.</p>}
        </div>
      </Card>
      <div className="grid cols-2 cols-1-1">
        <Card>
          <CardHead title="روتينات محلية" icon="refresh" />
          <ul className="life-list">
            {(r.local_routines ?? []).map((x, i) => (
              <li key={i}><b>{stripEmoji(x.name)}</b> — <bdi className="num">{x.time}</bdi>{typeof x.flex_min === 'number' && <small className="muted"> (±{x.flex_min} د)</small>} <Conf c={x.confidence} />{x.in_outlook === false && <Badge dashed>ليس في Outlook</Badge>}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHead title="العطل والتعارضات" icon="warn" />
          <ul className="life-list">
            {(r.holidays ?? []).map((h, i) => {
              const o = h as unknown as { name_ar?: string; from?: string; to?: string; confidence?: string };
              return <li key={i}><b>{o.name_ar}</b> — <bdi>{fmtDayFull(o.from)}</bdi>{o.to && o.to !== o.from ? <> → <bdi>{fmtDayFull(o.to)}</bdi></> : null} <Conf c={o.confidence} /></li>;
            })}
            {(r.known_conflicts ?? []).map((c, i) => {
              const o = c as unknown as { id?: string; text_ar?: string };
              return <li key={'c' + i}><Badge tone="warn">تعارض</Badge> {o.text_ar}</li>;
            })}
          </ul>
        </Card>
      </div>
      {r.as_of_note_ar && <Note>{r.as_of_note_ar}</Note>}
    </>
  );
}
