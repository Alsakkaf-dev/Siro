/** تخطيط الشبكة: أعمدة الأحداث المتداخلة في يوم واحد (كـOutlook: تتجاور بدل أن تتراكب). نقي. */
import { dayStartMin, wallMin } from './tz.js';
import type { CalEvent } from './types.js';

export interface Placed { ev: CalEvent; top: number; height: number; col: number; cols: number }

/** top/height بالدقائق من بداية اليوم؛ الأحداث المقصوصة بحدود اليوم */
export function layoutDay(events: readonly CalEvent[], date: string): Placed[] {
  const d0 = dayStartMin(date);
  const items = events
    .map((ev) => ({ ev, s: Math.max(wallMin(ev.start), d0) - d0, e: Math.min(wallMin(ev.end), d0 + 1440) - d0 }))
    .filter((x) => x.e > x.s)
    .sort((a, b) => a.s - b.s || b.e - a.e);
  const out: Placed[] = [];
  let cluster: { it: (typeof items)[number]; col: number }[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = (): void => {
    const cols = colEnds.length || 1;
    for (const c of cluster) out.push({ ev: c.it.ev, top: c.it.s, height: c.it.e - c.it.s, col: c.col, cols });
    cluster = [];
    colEnds = [];
  };
  for (const it of items) {
    if (cluster.length && it.s >= clusterEnd) flush();
    let col = colEnds.findIndex((e) => e <= it.s);
    if (col < 0) {
      col = colEnds.length;
      colEnds.push(it.e);
    } else colEnds[col] = it.e;
    cluster.push({ it, col });
    clusterEnd = Math.max(clusterEnd, it.e);
  }
  if (cluster.length) flush();
  return out;
}

/** أحداث تمسّ يومًا */
export const eventsOnDay = (events: readonly CalEvent[], date: string): CalEvent[] => {
  const d0 = dayStartMin(date);
  return events.filter((e) => wallMin(e.end) > d0 && wallMin(e.start) < d0 + 1440);
};
