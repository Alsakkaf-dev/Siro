// The Pacing Calibrator — distributes the remaining slides over the remaining
// schedule windows (now → validTo) so every READ timer fits the real time budget.
// Used by scripts/calibrate-plan.js (CLI) and POST /api/calibrate (route).
import path from 'node:path';
import { CONTENT_DIR, DATA_DIR } from '../config.js';
import { atomicWriteJson, backupFile, readJsonSafe } from './atomicWrite.js';
import { missionDone } from '../../src/engine/unlock.js';
import { windowsForDay, dateKey } from '../../src/engine/schedule.js';

const PACE_MIN = 25; // s/slide — faster than this isn't real reading → flag tight
const PACE_MAX = 120; // s/slide — slower wastes budget → cap, surplus becomes buffer
const SEC_PER_QUESTION = 90;
const GATE_REVIEW_MIN = 8;

function hm(day, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
}

/** Concrete sessions for one subject from `from` → schedule.validTo (skips the
 *  elapsed part of a running window; `start` stays the window's nominal start
 *  so the UI can match sessions by subject+date+start). */
function listSessions(schedule, subjectId, from) {
  const [fy, fm, fd] = schedule.validFrom.split('-').map(Number);
  const [ty, tm, td] = schedule.validTo.split('-').map(Number);
  const firstDay = new Date(Math.max(
    new Date(fy, fm - 1, fd).getTime(),
    new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  ));
  const lastDay = new Date(ty, tm - 1, td);
  const sessions = [];
  for (let d = firstDay; d <= lastDay; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    for (const w of windowsForDay(schedule, d)) {
      if (w.subject !== subjectId) continue;
      const end = hm(d, w.end);
      if (end <= from) continue; // window already over
      const startMs = Math.max(hm(d, w.start).getTime(), from.getTime());
      const minutes = Math.round((end.getTime() - startMs) / 60000);
      if (minutes <= 0) continue;
      sessions.push({ date: dateKey(d), day: w.day, start: w.start, end: w.end, minutes });
    }
  }
  return sessions;
}

/** Ordered remaining-work queue (cities in order, missions in order). */
function buildWork(country, progress, bankCount) {
  const queue = [];
  let totalPages = 0;
  let donePages = 0;
  let practiceGateMin = 0;
  for (const city of country.cities) {
    for (const m of city.missions) {
      const entry = progress.missions[m.id];
      if (m.type === 'READ') {
        const [p0, p1] = m.target.pages;
        const total = p1 - p0 + 1;
        totalPages += total;
        if (missionDone(m, entry)) {
          donePages += total;
          continue;
        }
        const viewed = (entry?.pagesViewed ?? []).filter((p) => p >= p0 && p <= p1).length;
        donePages += viewed;
        const pages = Math.max(0, total - viewed);
        queue.push({
          kind: 'READ', cityId: city.id, missionId: m.id, title: m.title,
          mission: m, pages, fromPage: p0 + (total - pages),
          secondsSpent: entry?.secondsSpent ?? 0,
        });
      } else if (m.type === 'PRACTICE') {
        if (missionDone(m, entry)) continue;
        const minutes = (bankCount(m.bank) * SEC_PER_QUESTION) / 60;
        practiceGateMin += minutes;
        queue.push({ kind: 'PRACTICE', cityId: city.id, missionId: m.id, title: m.title, minutes });
      } else if (m.type === 'GATE') {
        if (missionDone(m, entry)) continue;
        const minutes = ((m.goal.draw ?? 8) * SEC_PER_QUESTION) / 60 + GATE_REVIEW_MIN;
        practiceGateMin += minutes;
        queue.push({ kind: 'GATE', cityId: city.id, missionId: m.id, title: m.title, minutes });
      }
    }
  }
  return { queue, totalPages, donePages, practiceGateMin };
}

/** Fill sessions chronologically from the queue at `pace`. Mutates each session
 *  (adds items[] + bufferMin). The last session absorbs any overflow (tight). */
function buildItinerary(sessions, queue, pace) {
  const work = queue
    .filter((it) => (it.kind === 'READ' ? it.pages > 0 : true))
    .map((it) => ({ ...it, left: it.pages, cursor: it.fromPage }));
  const cityDue = {};
  let qi = 0;
  for (let si = 0; si < sessions.length; si++) {
    const s = sessions[si];
    const isLast = si === sessions.length - 1;
    let capSec = s.minutes * 60;
    s.items = [];
    while (qi < work.length) {
      const it = work[qi];
      if (it.kind === 'READ') {
        const fit = Math.floor(capSec / pace);
        const chunk = isLast ? it.left : Math.min(fit, it.left);
        if (chunk <= 0) break; // session full
        s.items.push({
          type: 'READ', missionId: it.missionId, title: it.title,
          fromPage: it.cursor, toPage: it.cursor + chunk - 1, pages: chunk,
        });
        capSec -= chunk * pace;
        it.cursor += chunk;
        it.left -= chunk;
        cityDue[it.cityId] = s.date;
        if (it.left > 0) break; // mission continues next session
        qi++;
      } else {
        const need = it.minutes * 60;
        // Defer to the next session unless this one is empty or the last —
        // an item that fits nowhere must still land somewhere.
        if (need > capSec && s.items.length > 0 && !isLast) break;
        s.items.push({ type: it.kind, missionId: it.missionId, title: it.title, minutes: Math.round(it.minutes) });
        capSec -= need;
        cityDue[it.cityId] = s.date;
        qi++;
      }
    }
    s.bufferMin = Math.round(capSec / 60);
  }
  return { cityDue };
}

/** Cumulative ABSOLUTE pages expected by end of each session date (one entry per date). */
function buildExpected(sessions, donePages) {
  const expected = [];
  let cum = donePages;
  for (const s of sessions) {
    cum += (s.items ?? []).filter((i) => i.type === 'READ').reduce((a, i) => a + i.pages, 0);
    const last = expected[expected.length - 1];
    if (last && last.date === s.date) last.pages = cum;
    else expected.push({ date: s.date, pages: cum });
  }
  return expected;
}

export function runCalibration({ from = new Date(), write = true } = {}) {
  const schedule = readJsonSafe(path.join(CONTENT_DIR, 'schedule.json'), null);
  const world = readJsonSafe(path.join(CONTENT_DIR, 'world.json'), null);
  if (!schedule || !world) throw new Error('[calibrate] content/schedule.json or world.json missing');
  const progress = readJsonSafe(path.join(DATA_DIR, 'progress.json'), { missions: {} });

  const bankCounts = {};
  const bankCount = (rel) => {
    if (!(rel in bankCounts)) {
      bankCounts[rel] = readJsonSafe(path.join(CONTENT_DIR, rel), { questions: [] }).questions.length;
    }
    return bankCounts[rel];
  };

  const plan = { calibratedAt: new Date().toISOString(), from: from.toISOString(), subjects: {} };
  const summary = [];
  const patched = [];

  for (const subj of world.subjects) {
    const file = path.join(CONTENT_DIR, subj.countryFile);
    const country = readJsonSafe(file, null);
    if (!country) continue; // country not authored yet

    const sessions = listSessions(schedule, subj.id, from);
    const { queue, totalPages, donePages, practiceGateMin } = buildWork(country, progress, bankCount);
    const budgetMin = sessions.reduce((a, s) => a + s.minutes, 0);
    const readBudgetMin = budgetMin - practiceGateMin;
    const remainingPages = queue.filter((q) => q.kind === 'READ').reduce((a, q) => a + q.pages, 0);

    const raw = remainingPages > 0 ? (readBudgetMin * 60) / remainingPages : null;
    const pace = raw == null ? null : Math.min(PACE_MAX, Math.max(PACE_MIN, raw));
    const tight = raw != null && raw < PACE_MIN;

    // Rewrite remaining READ timers: secondsSpent already counts toward the goal
    // (missionDone), so the REMAINING effort is exactly remainingPages × pace.
    for (const it of queue) {
      if (it.kind === 'READ') it.mission.goal.minSeconds = Math.round(it.secondsSpent + it.pages * (pace ?? 0));
    }

    // Invariant: when not tight, rewritten timers + drill estimates fit the budget.
    if (!tight) {
      const readSec = remainingPages * (pace ?? 0);
      if (readSec + practiceGateMin * 60 > budgetMin * 60 + 60) {
        throw new Error(`[calibrate] ${subj.id}: planned work exceeds budget (${Math.round(readSec / 60 + practiceGateMin)}m > ${budgetMin}m)`);
      }
    }

    const { cityDue } = buildItinerary(sessions, queue, pace ?? PACE_MIN);
    const expected = buildExpected(sessions, donePages);
    const bufferMin = Math.round(readBudgetMin - (remainingPages * (pace ?? 0)) / 60);

    plan.subjects[subj.id] = {
      pace: pace == null ? null : Math.round(pace),
      totalPages, donePages, remainingPages,
      practiceGateMin: Math.round(practiceGateMin),
      budgetMin, bufferMin, tight,
      sessions, cityDue, expected,
    };
    summary.push({
      subject: subj.id, sessions: sessions.length, minutes: budgetMin,
      drillsMin: Math.round(practiceGateMin), readBudgetMin: Math.round(readBudgetMin),
      remainingPages, paceSec: pace == null ? null : Math.round(pace), bufferMin, tight,
    });
    patched.push({ file, subjectId: subj.id, country });
  }

  if (write) {
    for (const { file, subjectId, country } of patched) {
      backupFile(file, path.join(DATA_DIR, 'backups', 'content', subjectId), 10);
      atomicWriteJson(file, country);
    }
    atomicWriteJson(path.join(CONTENT_DIR, 'plan.json'), plan);
  }
  return { plan, summary };
}
