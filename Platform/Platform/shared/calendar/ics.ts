/**
 * قارئ ICS صغير (بديل الاستيراد اليدوي RISK-08): VEVENT مع RRULE بسيط (DAILY/WEEKLY+BYDAY/MONTHLY/YEARLY، INTERVAL، COUNT، UNTIL)،
 * EXDATE، وRECURRENCE-ID. ما لا نفهمه يُسجَّل في skipped ولا يُخمَّن. الأوقات تُحوَّل إلى wall بتوقيت KL.
 */
import { TZ, addDays, convertWall, dateOf, dowOf, minWall, normalizeTz, timeOf, wallMin, msToWall } from './tz.js';
import type { CalEvent, SourceId } from './types.js';

interface Prop { name: string; params: Record<string, string>; value: string }

function unfold(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n').filter((l) => l.length);
}
const unesc = (s: string): string => s.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\');
function parseProp(line: string): Prop | null {
  const i = line.search(/[:;]/);
  if (i < 0) return null;
  // أول ':' خارج علامات الاقتباس يفصل القيمة
  let q = false;
  let colon = -1;
  for (let k = 0; k < line.length; k++) {
    const c = line[k];
    if (c === '"') q = !q;
    else if (c === ':' && !q) {
      colon = k;
      break;
    }
  }
  if (colon < 0) return null;
  const head = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of head.slice(1)) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: head[0]!.toUpperCase(), params, value: line.slice(colon + 1) };
}

/** 20261023T080000[Z] أو 20261023 (يوم كامل) → wall KL أو null */
function parseTime(p: Prop): { wall: string; allDay: boolean } | null {
  const v = p.value.trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/.exec(v);
  if (!m) return null;
  if (m[4] === undefined) return { wall: `${m[1]}-${m[2]}-${m[3]}T00:00`, allDay: true };
  const wall = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  if (m[7]) return { wall: convertWall(wall, 'UTC'), allDay: false };
  const tz = p.params['TZID'] ? normalizeTz(p.params['TZID']) : TZ;
  if (!tz) return null;
  return { wall: convertWall(wall, tz), allDay: false };
}

interface Rule { freq: string; interval: number; count: number | null; until: string | null; byday: number[] | null }
const DOW: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
function parseRule(v: string): { rule: Rule | null; unsupported: string | null } {
  const o: Record<string, string> = {};
  for (const kv of v.split(';')) {
    const [k, val] = kv.split('=');
    if (k && val !== undefined) o[k.toUpperCase()] = val;
  }
  const freq = o['FREQ'] ?? '';
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return { rule: null, unsupported: `FREQ=${freq}` };
  for (const k of Object.keys(o)) if (!['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'WKST'].includes(k)) return { rule: null, unsupported: k };
  let byday: number[] | null = null;
  if (o['BYDAY']) {
    byday = [];
    for (const d of o['BYDAY'].split(',')) {
      if (!(d.slice(-2) in DOW) || d.length > 2) return { rule: null, unsupported: `BYDAY=${d}` };
      byday.push(DOW[d]!);
    }
  }
  let until: string | null = null;
  if (o['UNTIL']) {
    const t = parseTime({ name: 'UNTIL', params: {}, value: o['UNTIL'] });
    until = t ? dateOf(t.wall) : null;
  }
  return { rule: { freq, interval: Math.max(1, Number(o['INTERVAL'] ?? 1) || 1), count: o['COUNT'] ? Number(o['COUNT']) : null, until, byday }, unsupported: null };
}

/** تواريخ الأحداث المتكررة (بداية كل تكرار) ضمن [from, to] */
function expand(startDate: string, rule: Rule, from: string, to: string): string[] {
  const out: string[] = [];
  let n = 0;
  const hard = addDays(from > startDate ? from : startDate, 0);
  void hard;
  const limit = rule.until && rule.until < to ? rule.until : to;
  const push = (d: string): boolean => {
    if (d < startDate) return true;
    n++;
    if (rule.count !== null && n > rule.count) return false;
    if (d > limit) return false;
    if (d >= from) out.push(d);
    return true;
  };
  if (rule.freq === 'DAILY') {
    for (let d = startDate, i = 0; i < 4000; i++, d = addDays(d, rule.interval)) if (!push(d)) break;
  } else if (rule.freq === 'WEEKLY') {
    const days = rule.byday ?? [dowOf(startDate)];
    const wk0 = addDays(startDate, -dowOf(startDate)); // أحد الأسبوع الأول
    outer: for (let w = 0; w < 700; w++) {
      const base = addDays(wk0, w * 7 * rule.interval);
      for (const dw of [...days].sort((a, b) => a - b)) {
        if (!push(addDays(base, dw))) break outer;
      }
    }
  } else if (rule.freq === 'MONTHLY') {
    const [y, m, d] = startDate.split('-').map(Number) as [number, number, number];
    for (let i = 0; i < 400; i++) {
      const mm = m - 1 + i * rule.interval;
      const dt = new Date(Date.UTC(y + Math.floor(mm / 12), mm % 12, d));
      if (dt.getUTCDate() !== d) continue;
      if (!push(dt.toISOString().slice(0, 10))) break;
    }
  } else {
    const [y, m, d] = startDate.split('-').map(Number) as [number, number, number];
    for (let i = 0; i < 100; i++) {
      const dt = new Date(Date.UTC(y + i * rule.interval, m - 1, d));
      if (dt.getUTCDate() !== d) continue;
      if (!push(dt.toISOString().slice(0, 10))) break;
    }
  }
  return out;
}

export interface IcsResult { events: CalEvent[]; skipped: string[]; calendar: string | null }

/** يقرأ ICS ويفرد التكرارات داخل [from, to] (شاملًا). source/calendar الافتراضيان للمستورد. */
export function parseIcs(text: string, opts: { from: string; to: string; calendar?: string; source?: SourceId }): IcsResult {
  const lines = unfold(text);
  const skipped: string[] = [];
  let calName: string | null = null;
  const vevents: Prop[][] = [];
  let cur: Prop[] | null = null;
  for (const line of lines) {
    if (/^BEGIN:VEVENT/i.test(line)) cur = [];
    else if (/^END:VEVENT/i.test(line)) {
      if (cur) vevents.push(cur);
      cur = null;
    } else {
      const p = parseProp(line);
      if (!p) continue;
      if (cur) cur.push(p);
      else if (p.name === 'X-WR-CALNAME') calName = unesc(p.value);
    }
  }
  const calendar = opts.calendar ?? calName ?? 'مستورد';
  const source = opts.source ?? 'import';
  const base = new Map<string, { props: Record<string, Prop[]>; idx: number }>();
  const overrides: { uid: string; recDate: string; props: Record<string, Prop[]> }[] = [];
  const masters: { uid: string; props: Record<string, Prop[]> }[] = [];
  vevents.forEach((arr, idx) => {
    const props: Record<string, Prop[]> = {};
    for (const p of arr) (props[p.name] ??= []).push(p);
    const uid = props['UID']?.[0]?.value ?? `ev${idx}`;
    const rid = props['RECURRENCE-ID']?.[0];
    if (rid) {
      const t = parseTime(rid);
      if (t) overrides.push({ uid, recDate: t.wall, props });
    } else {
      masters.push({ uid, props });
      base.set(uid, { props, idx });
    }
  });
  const events: CalEvent[] = [];
  const overridden = new Set(overrides.map((o) => `${o.uid}|${o.recDate}`));
  const emit = (uid: string, props: Record<string, Prop[]>, startWall: string, endWall: string, series: string | null, occ: string): void => {
    const title = unesc(props['SUMMARY']?.[0]?.value ?? '').trim() || '(بلا عنوان)';
    const cats = (props['CATEGORIES'] ?? []).flatMap((c) => unesc(c.value).split(',').map((x) => x.trim()).filter(Boolean));
    const busy = (props['X-MICROSOFT-CDO-BUSYSTATUS']?.[0]?.value ?? '').toUpperCase();
    const transp = (props['TRANSP']?.[0]?.value ?? '').toUpperCase();
    const calendarOf = props['X-SIRO-CALENDAR']?.[0]?.value ? unesc(props['X-SIRO-CALENDAR'][0]!.value) : calendar;
    events.push({
      id: `${uid}${series ? `@${occ}` : ''}`,
      source, calendar: calendarOf, title, start: startWall, end: endWall, show_as: busy === 'FREE' || transp === 'TRANSPARENT' ? 'free' : 'busy',
      categories: cats, description: unesc(props['DESCRIPTION']?.[0]?.value ?? ''), series,
    });
  };
  const durationMin = (props: Record<string, Prop[]>, s: string): number | null => {
    const e = props['DTEND']?.[0];
    if (e) {
      const t = parseTime(e);
      return t ? wallMin(t.wall) - wallMin(s) : null;
    }
    const d = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(props['DURATION']?.[0]?.value ?? '');
    if (d) return Number(d[1] ?? 0) * 1440 + Number(d[2] ?? 0) * 60 + Number(d[3] ?? 0);
    return null;
  };
  const fromMin = wallMin(`${opts.from}T00:00`);
  const toMin = wallMin(`${addDays(opts.to, 1)}T00:00`);
  for (const { uid, props } of masters) {
    const st = props['DTSTART']?.[0] ? parseTime(props['DTSTART'][0]) : null;
    if (!st) {
      skipped.push(`${uid}: DTSTART غير مفهوم`);
      continue;
    }
    if (st.allDay) {
      skipped.push(`${uid}: حدث ليوم كامل`);
      continue;
    }
    const dur = durationMin(props, st.wall);
    if (dur === null || dur < 0) {
      skipped.push(`${uid}: لا نهاية للحدث`);
      continue;
    }
    const rr = props['RRULE']?.[0];
    if (!rr) {
      const sm = wallMin(st.wall);
      if (sm + dur > fromMin && sm < toMin) emit(uid, props, st.wall, minWall(sm + dur), null, '');
      continue;
    }
    const { rule, unsupported } = parseRule(rr.value);
    if (!rule) {
      skipped.push(`${uid}: تكرار غير مدعوم (${unsupported})`);
      continue;
    }
    const ex = new Set((props['EXDATE'] ?? []).flatMap((p) => p.value.split(',').map((v) => parseTime({ ...p, value: v })).filter((t): t is NonNullable<typeof t> => !!t).map((t) => t.wall)));
    const t0 = timeOf(st.wall);
    for (const d of expand(dateOf(st.wall), rule, addDays(opts.from, -2), opts.to)) {
      const s = `${d}T${t0}`;
      if (ex.has(s) || overridden.has(`${uid}|${s}`)) continue;
      const sm = wallMin(s);
      if (sm + dur > fromMin && sm < toMin) emit(uid, props, s, minWall(sm + dur), uid, s.slice(0, 10));
    }
  }
  for (const o of overrides) {
    const st = o.props['DTSTART']?.[0] ? parseTime(o.props['DTSTART'][0]) : null;
    if (!st || st.allDay) continue;
    const dur = durationMin(o.props, st.wall);
    if (dur === null || dur < 0) continue;
    const sm = wallMin(st.wall);
    if (sm + dur > fromMin && sm < toMin) emit(o.uid, o.props, st.wall, minWall(sm + dur), o.uid, o.recDate.slice(0, 10));
  }
  void msToWall;
  return { events, skipped, calendar: calName };
}
