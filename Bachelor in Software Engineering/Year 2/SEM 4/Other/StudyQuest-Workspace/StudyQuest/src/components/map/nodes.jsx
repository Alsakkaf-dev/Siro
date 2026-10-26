import React from 'react';

/** Gold star (earned) or gray outline star. */
export function Star({ x, y, size = 11, earned }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
  }
  return (
    <polygon
      className={`star ${earned ? 'earned' : ''}`}
      points={pts.join(' ')}
      fill={earned ? '#ffd23f' : 'rgba(43,35,80,.18)'}
      stroke={earned ? '#e8a800' : 'rgba(43,35,80,.3)'}
      strokeWidth="2"
    />
  );
}

export function StarRow({ x, y, stars, size = 11, gap = 24 }) {
  return (
    <g>
      <Star x={x - gap} y={y + 4} size={size} earned={stars >= 1} />
      <Star x={x} y={y - 2} size={size + 2} earned={stars >= 2} />
      <Star x={x + gap} y={y + 4} size={size} earned={stars >= 3} />
    </g>
  );
}

/** Bouncing avatar pin marking "you are here". */
export function AvatarPin({ x, y, scale = 1 }) {
  return (
    <g className="avatar-pin" transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="4" rx="14" ry="5" fill="rgba(0,0,0,.25)" />
      <path d="M 0 0 C -16 -18 -16 -42 0 -44 C 16 -42 16 -18 0 0 Z" fill="#ff5e7e" stroke="#c43a5d" strokeWidth="2.5" />
      <circle cx="0" cy="-30" r="11" fill="#fff" />
      <text x="0" y="-24.5" textAnchor="middle" fontSize="15">🧑‍🚀</text>
    </g>
  );
}

/** Lock icon for locked nodes. */
export function LockIcon({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-9" y="-4" width="18" height="14" rx="4" fill="#5d5485" stroke="#3e3866" strokeWidth="2" />
      <path d="M -5 -4 v -4 a 5 5 0 0 1 10 0 v 4" fill="none" stroke="#3e3866" strokeWidth="3" />
      <circle cx="0" cy="3" r="2.4" fill="#ffd23f" />
    </g>
  );
}

/** Skull marker for far-locked cities (Candy-Crush vibes). */
export function SkullIcon({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="-2" rx="9" ry="8.5" fill="#f3eee0" stroke="#bcb49a" strokeWidth="1.5" />
      <rect x="-5" y="4" width="10" height="4" rx="2" fill="#f3eee0" stroke="#bcb49a" strokeWidth="1" />
      <circle cx="-3.4" cy="-3" r="2.4" fill="#3e3866" />
      <circle cx="3.4" cy="-3" r="2.4" fill="#3e3866" />
      <path d="M 0 0 l -1.6 3 h 3.2 Z" fill="#3e3866" />
    </g>
  );
}

const MISSION_ICONS = { READ: '📖', PRACTICE: '⚔️', GATE: '🏰' };
export function missionIcon(type) {
  return MISSION_ICONS[type] ?? '⭐';
}

/**
 * Candy-button 3D treatment layered over any colored node circle:
 * top-left shine + bottom shade + crisp rim. Color-independent.
 */
export function NodeBevel({ r }) {
  return (
    <>
      <circle r={r} fill="url(#nodeShine)" />
      <circle r={r} fill="url(#nodeShade)" />
      <circle r={r - 1} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
    </>
  );
}
