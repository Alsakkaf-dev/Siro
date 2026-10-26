import React from 'react';
import { useClockStore } from '../../store/useClockStore.js';
import { examCountdown, parseLocal, fmtTime12 } from '../../engine/schedule.js';

/**
 * Minimal exam timer — no boxes. Two lines of halo text:
 *   25d 15h          (big, urgency-colored)
 *   Jul 7 · 9:00 AM  (the exam moment, 12-hour)
 */
export default function CountdownPlate({ examAt, x = 0, y = 0 }) {
  const now = useClockStore((s) => s.now);
  const c = examCountdown(examAt, now);
  const exam = parseLocal(examAt);

  let bigFill = '#ffffff';
  let pulsing = false;
  if (!c.past) {
    if (c.days < 3) { bigFill = '#ffd1dc'; pulsing = true; }
    else if (c.days <= 7) { bigFill = '#ffe3a8'; }
  }

  const big = c.past ? '🎉 done!' : c.days > 0 ? `${c.days}d ${c.hours}h` : `${c.hours}h ${String(c.mins).padStart(2, '0')}m`;
  const when = `${exam.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${fmtTime12(exam)}`;

  return (
    <g transform={`translate(${x}, ${y})`} className={pulsing ? 'anim-beacon' : undefined}>
      <text
        textAnchor="middle" y="-2" fill={bigFill}
        fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="27"
        stroke="rgba(24, 20, 55, 0.6)" strokeWidth="5.5" paintOrder="stroke"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        ⏳ {big}
      </text>
      <text
        textAnchor="middle" y="19" fill="#f0f5ff"
        fontFamily="'Baloo 2', sans-serif" fontWeight="700" fontSize="13.5"
        stroke="rgba(24, 20, 55, 0.55)" strokeWidth="4" paintOrder="stroke"
      >
        {when}
      </text>
    </g>
  );
}
