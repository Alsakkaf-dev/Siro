import React from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { useClockStore } from '../../store/useClockStore.js';
import {
  activeWindow, nextWindow, windowRemainingMs, isFreeWeek, fmtDuration, fmt12,
} from '../../engine/schedule.js';

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * The session water cup (top middle): water level = time REMAINING in the
 * current study window — it drains as the session runs. When no session is
 * active it waits, nearly empty, showing the next session instead.
 */
export default function SessionCup() {
  const schedule = useGameStore((s) => s.schedule);
  const world = useGameStore((s) => s.world);
  const now = useClockStore((s) => s.now);
  if (!schedule || !world) return null;

  const act = activeWindow(schedule, now);
  const free = isFreeWeek(schedule, now);
  const colorOf = (id) => world.subjects.find((x) => x.id === id)?.color ?? '#5cc6f2';

  let frac = 0.12;
  let color = '#9aa7c7';
  let big = '—';
  let small = 'no session';

  if (free) {
    big = '🏖️ mock week';
    small = 'plan your own sessions';
  } else if (act) {
    const totalMs = (minutesOf(act.end) - minutesOf(act.start)) * 60000;
    const remMs = windowRemainingMs(act, now);
    frac = totalMs > 0 ? Math.max(0.04, Math.min(1, remMs / totalMs)) : 0;
    color = colorOf(act.subject);
    big = `${fmtDuration(remMs)} left`;
    small = `${act.subject} session · ends ${fmt12(act.end)}`;
  } else {
    const nxt = nextWindow(schedule, now);
    if (nxt) {
      color = colorOf(nxt.subject);
      big = fmt12(nxt.start);
      small = `next: ${nxt.subject} ${nxt.startsAt.toDateString() === now.toDateString() ? 'today' : nxt.day}`;
    }
  }

  const waterY = 34 - 28 * frac; // glass inner: y 6..34

  return (
    <div className={`session-cup ${act ? 'live' : ''}`} title="Session water — it drains as your current study window runs out.">
      <svg width="30" height="42" viewBox="0 0 30 42">
        <defs>
          <clipPath id="cupClip">
            <path d="M 5 6 H 25 L 23.5 32 Q 23.2 38 15 38 Q 6.8 38 6.5 32 Z" />
          </clipPath>
        </defs>
        {/* water */}
        <g clipPath="url(#cupClip)">
          <rect x="3" y={waterY} width="24" height="36" fill={color} opacity="0.85" style={{ transition: 'y 1s linear' }} />
          <path
            d={`M 3 ${waterY} q 4 -2.6 8 0 t 8 0 t 8 0 v 3 h -24 Z`}
            fill="#ffffff" opacity="0.35"
          />
          {act && <circle cx="11" cy={waterY + 8} r="1.4" fill="rgba(255,255,255,.7)" className="anim-twinkle" />}
          {act && <circle cx="19" cy={waterY + 13} r="1.1" fill="rgba(255,255,255,.6)" className="anim-twinkle" style={{ animationDelay: '1.2s' }} />}
        </g>
        {/* glass */}
        <path d="M 5 6 H 25 L 23.5 32 Q 23.2 38 15 38 Q 6.8 38 6.5 32 Z"
          fill="rgba(255,255,255,.14)" stroke="rgba(43,35,80,.55)" strokeWidth="2.4" />
        <path d="M 7.5 9 L 8.5 30" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div className="cup-text">
        <b>{big}</b>
        <small>{small}</small>
      </div>
    </div>
  );
}
