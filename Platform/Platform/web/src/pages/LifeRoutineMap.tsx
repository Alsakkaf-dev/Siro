import { useMemo, useState } from 'react';
import { Badge, Card, CardHead } from '../ui/ui.js';
import { ContentPage } from '../life/v8Kit.js';
import { useContent } from '../sports/sportsKit.js';
import { TagBadge } from '../review/kit.js';
import { tagFrom } from '../../../shared/weekly.js';
import { overlapPairs, placeDay, type RBlock, type RoutineBlocksDoc } from '../../../shared/v8.js';

const hm = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const end = (m: number): string => (m >= 1440 ? '24:00' : hm(m));
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const LANE_H = 30;

export default function LifeRoutineMap() {
  const c = useContent<RoutineBlocksDoc>('ROUTINE_BLOCKS_AR.json');
  const [sel, setSel] = useState<string | null>(null);
  const [hide, setHide] = useState<ReadonlySet<string>>(new Set());
  const doc = c.data;
  const byId = useMemo(() => new Map((doc?.blocks ?? []).map((b) => [b.id, b] as const)), [doc]);
  const pairs = useMemo(() => overlapPairs(doc?.blocks ?? []), [doc]);
  const selB = sel ? byId.get(sel) : null;
  const related = useMemo(() => new Set(selB ? [selB.id, ...(selB.overlaps_with ?? [])] : []), [selB]);
  const toggle = (t: string): void => setHide((h) => { const n = new Set(h); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  return (
    <ContentPage c={c} title="خريطة الروتين الأسبوعي" icon="timer" label="خريطة الروتين" sub="كتل الأسبوع كما في ملفات راشد (قراءة فقط؛ لا تغيّر التقويم ولا Outlook).">
      {(d) => (
        <>
          <div className="life-alert info" role="note">
            <div>
              <p style={{ margin: 0 }}>{d.readme_ar}</p>
              <p style={{ margin: '6px 0 0' }}><b>التداخل:</b> {d.overlap_note_ar} الكتلة ذات الإطار الأحمر المتقطع تتداخل مع غيرها؛ اضغط عليها لترى المتداخلة.</p>
              <p style={{ margin: '6px 0 0' }}>بداية الأسبوع الأحد <TagBadge tag={tagFrom(d.week_start_confidence)} />. أوقات الصلاة من جدول {d.prayer_times_reference?.date ?? 'قديم'} وتتحرك كل يوم فهي تقريبية.</p>
            </div>
          </div>
          <ul className="chips" aria-label="أنواع الكتل">
            {d.legend.map((l) => (
              <li key={l.type}><button type="button" className="chip" aria-pressed={!hide.has(l.type)} title={l.description_ar} onClick={() => toggle(l.type)}><i className={`rm-sw k-${l.type}`} aria-hidden="true" /> {l.type_ar} ({l.count ?? 0})</button></li>
            ))}
          </ul>
          <Card>
            <CardHead title="الأسبوع" icon="calendar" info="كل يوم شريط من 00:00 إلى 24:00. وقت الفراغ خلفية باهتة، والمحاضرة والصلاة فوقه." />
            <div className="rm-axis" aria-hidden="true">{HOURS.map((h) => <span key={h} style={{ insetInlineStart: `${(h / 24) * 100}%` }}>{String(h).padStart(2, '0')}</span>)}</div>
            <div className="rm-days">
              {d.days.map((day) => {
                const blocks = d.blocks.filter((b) => b.day === day.key && !hide.has(b.type));
                const { free, placed, lanes } = placeDay(blocks);
                const pts = d.points.filter((p) => p.day === day.key && !hide.has(p.type));
                const h = lanes * LANE_H + 8;
                return (
                  <div key={day.key} className="rm-row">
                    <b className="rm-day">{day.name_ar}</b>
                    <div className="rm-bar" style={{ height: h }} role="group" aria-label={`${day.name_ar}: ${blocks.length} كتلة و${pts.length} نقطة`}>
                      {HOURS.slice(1, -1).map((x) => <i key={x} className="rm-grid" style={{ insetInlineStart: `${(x / 24) * 100}%` }} aria-hidden="true" />)}
                      {free.map((b) => <Block key={b.id} b={b} lane={0} full h={h} sel={sel} related={related} onSel={setSel} />)}
                      {placed.map((p) => <Block key={p.b.id} b={p.b} lane={p.lane} h={h} sel={sel} related={related} onSel={setSel} />)}
                      {pts.map((p) => <span key={p.id} role="img" className="rm-pt" tabIndex={0} title={`${p.label_ar} ${p.time}${p.in_outlook === false ? ' (ليس في التقويم)' : ''}`} aria-label={`${p.label_ar} ${p.time}`} style={{ insetInlineStart: `${(p.time_min / 1440) * 100}%` }} />)}
                    </div>
                    <details className="rm-list">
                      <summary>قائمة كتل {day.name_ar} ({blocks.length})</summary>
                      <ul className="plain">
                        {[...blocks].sort((x, y) => x.start_min - y.start_min).map((b) => (
                          <li key={b.id}><button type="button" className="chip" aria-pressed={sel === b.id} onClick={() => setSel(sel === b.id ? null : b.id)}><bdi className="num">{b.start}–{b.end}</bdi> {b.label_ar ?? b.name_original}{(b.overlaps_with ?? []).length ? ' ⚠' : ''}</button></li>
                        ))}
                      </ul>
                    </details>
                  </div>
                );
              })}
            </div>
            <p className="muted rv-fine">النقاط المستديرة = روتينات محلية بلا مدة (ليست أحداث تقويم). {d.block_count} كتلة، {d.point_count} نقطة.</p>
            {selB && (
              <div className="rm-sel" role="status">
                <b>{selB.label_ar ?? selB.name_original}</b> · {selB.day_ar} {selB.start}–{selB.end} · {selB.type_ar} <TagBadge tag={tagFrom(selB.confidence)} />
                {selB.moves_with_prayer_time && <Badge dashed>تتحرك مع وقت الصلاة</Badge>}
                {selB.note_ar && <small className="muted" style={{ display: 'block' }}>{selB.note_ar}</small>}
                {(selB.overlaps_with ?? []).length > 0 && <small style={{ display: 'block' }}>تتداخل مع: {(selB.overlaps_with ?? []).map((id) => byId.get(id)).filter((x): x is RBlock => !!x).map((x) => `${x.label_ar ?? x.name_original} (${x.start}–${x.end})`).join('، ')}</small>}
              </div>
            )}
          </Card>
          <Card>
            <CardHead title={`التداخلات (${pairs.length})`} icon="warn" info="الأزواج كما حددها راشد في overlaps_with. لا نكتشف تداخلات من عندنا." />
            {pairs.length === 0 ? <p className="muted">لا تداخلات.</p> : (
              <ul className="life-list">
                {pairs.map(({ a, b }) => (
                  <li key={a.id + b.id}><b>{a.day_ar}</b>: {a.label_ar ?? a.name_original} <bdi className="num">{a.start}–{a.end}</bdi> ⟷ {b.label_ar ?? b.name_original} <bdi className="num">{b.start}–{b.end}</bdi></li>
                ))}
              </ul>
            )}
          </Card>
          <div className="grid cols-2 cols-1-1">
            <Card>
              <CardHead title={`تعارضات معروفة (${d.known_conflicts?.length ?? 0})`} icon="help" />
              {d.known_conflicts?.length ? <ul className="life-list">{d.known_conflicts.map((k) => <li key={k.id}>{k.text_ar}</li>)}</ul> : <p className="muted">لا تعارضات مسجلة</p>}
            </Card>
            <Card>
              <CardHead title="إجازات" icon="calendar" />
              {d.holidays?.length ? <ul className="life-list">{d.holidays.map((h) => <li key={h.name_ar + h.from}>{h.name_ar} · {h.from}{h.to ? ` ← ${h.to}` : ''} <TagBadge tag={tagFrom(h.confidence)} /></li>)}</ul> : <p className="muted">لا إجازات مسجلة</p>}
            </Card>
          </div>
        </>
      )}
    </ContentPage>
  );
}

function Block({ b, lane, full, h, sel, related, onSel }: { b: RBlock; lane: number; full?: boolean; h: number; sel: string | null; related: ReadonlySet<string>; onSel: (id: string | null) => void }) {
  const ov = (b.overlaps_with ?? []).length > 0;
  const w = Math.max(0.5, ((Math.min(b.end_min, 1440) - b.start_min) / 1440) * 100);
  const label = `${b.label_ar ?? b.name_original} ${b.start}–${b.end}${ov ? ' — يتداخل مع كتل أخرى' : ''}`;
  return (
    // الكتل المرئية للفأرة فقط (قد تكون أصغر من 24px)؛ البديل المكافئ للوحة المفاتيح وقارئ الشاشة: «قائمة الكتل» تحت كل يوم (WCAG 2.5.8)
    <div
      aria-hidden="true"
      className={`rm-blk k-${b.type}${full ? ' bg' : ''}${ov ? ' ov' : ''}${sel === b.id ? ' sel' : ''}${sel && related.has(b.id) && sel !== b.id ? ' rel' : ''}${b.moves_with_prayer_time ? ' mv' : ''}`}
      style={{ insetInlineStart: `${(b.start_min / 1440) * 100}%`, inlineSize: `${w}%`, top: full ? 0 : 4 + lane * LANE_H, height: full ? h : LANE_H - 4 }}
      title={label}
      onClick={() => onSel(sel === b.id ? null : b.id)}
    >
      {w > 7 && <span className="rm-t">{b.label_ar ?? b.name_original}</span>}
    </div>
  );
}
