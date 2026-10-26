import React from 'react';

export default function ProgressRing({ pct, size = 60, stroke = 8, color = '#3ecf6e', track = 'rgba(255,255,255,.35)', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(255,255,255,.18)" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray .6s' }}
      />
      <text className="progress-ring-text" x={size / 2} y={size / 2} fontSize={size * 0.26} fill="#fff">
        {label ?? `${Math.round(pct * 100)}%`}
      </text>
    </svg>
  );
}
