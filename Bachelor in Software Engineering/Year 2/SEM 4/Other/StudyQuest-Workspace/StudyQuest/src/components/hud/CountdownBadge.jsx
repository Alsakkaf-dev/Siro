import React from 'react';
import { useClockStore } from '../../store/useClockStore.js';
import { examCountdown } from '../../engine/schedule.js';

export default function CountdownBadge({ examAt, compact = false }) {
  const now = useClockStore((s) => s.now);
  const c = examCountdown(examAt, now);

  if (c.past) return <span className="countdown">EXAM DONE 🎉</span>;
  const urgent = c.days < 3;
  if (compact) {
    return (
      <span className={`countdown ${urgent ? 'urgent' : ''}`}>
        {c.days}d {c.hours}h {c.mins}m
      </span>
    );
  }
  return (
    <span className={`countdown ${urgent ? 'urgent' : ''}`}>
      {c.days}d {String(c.hours).padStart(2, '0')}h {String(c.mins).padStart(2, '0')}m {String(c.secs).padStart(2, '0')}s
    </span>
  );
}
