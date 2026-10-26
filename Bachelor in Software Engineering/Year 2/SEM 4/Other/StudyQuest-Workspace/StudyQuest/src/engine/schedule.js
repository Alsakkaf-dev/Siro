// Pure schedule logic. All "datetime" strings in content JSON are LOCAL time.
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseLocal(dtString) {
  // "2026-07-07T09:00:00" parsed as local time (no Z suffix → local in JS)
  return new Date(dtString);
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isFreeWeek(schedule, now) {
  const k = dateKey(now);
  return k >= schedule.freeWeek.from && k <= schedule.freeWeek.to;
}

export function windowsApply(schedule, now) {
  const k = dateKey(now);
  return k >= schedule.validFrom && k <= schedule.validTo;
}

/** Windows scheduled for a given local date, sorted by start. */
export function windowsForDay(schedule, date) {
  const day = DAY_NAMES[date.getDay()];
  return schedule.windows
    .filter((w) => w.day === day)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
}

/** The window active right now, or null. */
export function activeWindow(schedule, now) {
  if (!windowsApply(schedule, now)) return null;
  const mins = now.getHours() * 60 + now.getMinutes();
  return (
    windowsForDay(schedule, now).find(
      (w) => mins >= minutesOf(w.start) && mins < minutesOf(w.end)
    ) ?? null
  );
}

/** The next upcoming window within 7 days, with its concrete start Date. */
export function nextWindow(schedule, now) {
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!windowsApply(schedule, d)) continue;
    for (const w of windowsForDay(schedule, d)) {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), ...w.start.split(':').map(Number));
      if (start > now) return { ...w, startsAt: start };
    }
  }
  return null;
}

/** Remaining ms of the active window. */
export function windowRemainingMs(w, now) {
  if (!w) return 0;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...w.end.split(':').map(Number));
  return Math.max(0, end - now);
}

/** Total allowed minutes today for a subject. */
export function allowedMinutesToday(schedule, subjectId, now) {
  if (!windowsApply(schedule, now)) return 0;
  return windowsForDay(schedule, now)
    .filter((w) => w.subject === subjectId)
    .reduce((acc, w) => acc + (minutesOf(w.end) - minutesOf(w.start)), 0);
}

export function examCountdown(examAtString, now) {
  const exam = parseLocal(examAtString);
  let ms = exam - now;
  const past = ms < 0;
  ms = Math.abs(ms);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return { past, days, hours, mins, secs, totalMs: exam - now };
}

export function fmtClock(now) {
  // 12-hour AM/PM everywhere — never 24h
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

/** "17:00" (schedule.json window string) → "5:00 PM" */
export function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Date → "5:00 PM" */
export function fmtTime12(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Live scene phase from the real clock: dawn 5–8 · day 8–17 · dusk 17–20 · night 20–5 */
export function dayPhase(now) {
  const h = now.getHours();
  if (h >= 20 || h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  return 'dusk';
}

export function fmtDate(now) {
  return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

/** Ticking-down countdown: "5d 3h" / "1h 23m 45s" / "23m 45s" / "45s". */
export function fmtCountdown(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (days > 0) return `${days}d ${h}h`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Most recently FINISHED window (search ≤ 8 days back): { subject, endedAt } or null. */
export function prevWindowEnd(schedule, now) {
  let best = null;
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    if (!windowsApply(schedule, d)) continue;
    for (const w of windowsForDay(schedule, d)) {
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), ...w.end.split(':').map(Number));
      if (end <= now && (!best || end > best.endedAt)) best = { subject: w.subject, endedAt: end };
    }
    if (best) return best; // closest day with a finished window wins
  }
  return best;
}

/**
 * The Traveling Scholar's state — single source of truth for the world map.
 * Modes:
 *   studying  — a window is open NOW; he reads on that island (remainingMs → window end)
 *   sailing   — between different subjects; boat from prev island → next island
 *   anchored  — waiting for the SAME subject's next session (or no history yet)
 *   mockweek  — free week / schedule expired; he camps on the next exam's island
 *   done      — all exams finished
 */
export function journeyState(schedule, world, now) {
  const act = activeWindow(schedule, now);
  if (act) {
    return { mode: 'studying', subjectId: act.subject, window: act, remainingMs: windowRemainingMs(act, now) };
  }

  const next = nextWindow(schedule, now);
  if (!next) {
    const upcoming = [...world.subjects]
      .map((s) => ({ id: s.id, examAt: parseLocal(s.examAt) }))
      .filter((s) => s.examAt > now)
      .sort((a, b) => a.examAt - b.examAt);
    if (upcoming.length === 0) {
      return { mode: 'done', subjectId: world.subjects[world.subjects.length - 1].id };
    }
    return { mode: 'mockweek', subjectId: upcoming[0].id, examAt: upcoming[0].examAt, remainingMs: upcoming[0].examAt - now };
  }

  const prev = prevWindowEnd(schedule, now);
  const remainingMs = next.startsAt - now;

  if (!prev || prev.subject === next.subject) {
    return { mode: 'anchored', subjectId: next.subject, startsAt: next.startsAt, remainingMs };
  }

  const total = next.startsAt - prev.endedAt;
  const progress = total > 0 ? Math.max(0, Math.min(1, (now - prev.endedAt) / total)) : 1;
  return {
    mode: 'sailing',
    fromId: prev.subject,
    toId: next.subject,
    progress,
    startsAt: next.startsAt,
    remainingMs,
  };
}
