import React from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { useClockStore } from '../../store/useClockStore.js';
import {
  activeWindow, nextWindow, windowRemainingMs, isFreeWeek, fmtDuration, fmt12,
} from '../../engine/schedule.js';

const DAY_LABEL = { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' };

export default function ScheduleStrip() {
  const schedule = useGameStore((s) => s.schedule);
  const world = useGameStore((s) => s.world);
  const now = useClockStore((s) => s.now);
  if (!schedule || !world) return null;

  const colorOf = (id) => world.subjects.find((s) => s.id === id)?.color ?? '#888';

  if (isFreeWeek(schedule, now)) {
    return (
      <div className="schedule-strip">
        <div className="sched-chip free-week">🏖️ FREE MOCK WEEK — windows off, mocks only!</div>
      </div>
    );
  }

  const act = activeWindow(schedule, now);
  const nxt = nextWindow(schedule, now);

  return (
    <div className="schedule-strip">
      {act ? (
        <div className="sched-chip now" style={{ color: colorOf(act.subject) }}>
          <span className="dot" />
          NOW: {act.subject} until {fmt12(act.end)}
          <small>({fmtDuration(windowRemainingMs(act, now))} left)</small>
        </div>
      ) : (
        <div className="sched-chip"><small>No active window</small></div>
      )}
      {nxt && (
        <div className="sched-chip" style={{ color: colorOf(nxt.subject) }}>
          NEXT: {nxt.subject}
          <small>
            {nxt.startsAt.toDateString() === now.toDateString()
              ? `today ${fmt12(nxt.start)}`
              : `${DAY_LABEL[nxt.day]} ${fmt12(nxt.start)}`}
          </small>
        </div>
      )}
    </div>
  );
}
