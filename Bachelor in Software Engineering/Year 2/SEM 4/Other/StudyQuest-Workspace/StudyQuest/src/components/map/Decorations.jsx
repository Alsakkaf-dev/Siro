import React from 'react';

/** Small inline-SVG map decorations, picked by `kind` 0..5. */
export function Deco({ x, y, kind, scale = 1 }) {
  const items = [
    // 0: palm tree
    <g key="palm">
      <rect x="-3" y="-2" width="6" height="22" rx="3" fill="#a16b3f" />
      <ellipse cx="-10" cy="-8" rx="13" ry="6" fill="#5cb53a" transform="rotate(-25)" />
      <ellipse cx="10" cy="-8" rx="13" ry="6" fill="#6fcf4a" transform="rotate(25)" />
      <ellipse cx="0" cy="-12" rx="13" ry="6" fill="#7ddb58" />
    </g>,
    // 1: bush
    <g key="bush">
      <circle cx="-7" cy="2" r="9" fill="#5cb53a" />
      <circle cx="7" cy="2" r="9" fill="#6fcf4a" />
      <circle cx="0" cy="-4" r="10" fill="#7ddb58" />
    </g>,
    // 2: flower
    <g key="flower">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-6" rx="4" ry="7" fill="#ff8fb5" transform={`rotate(${a})`} />
      ))}
      <circle r="4" fill="#ffd23f" />
    </g>,
    // 3: rock
    <g key="rock">
      <path d="M -10 6 Q -8 -8 0 -9 Q 9 -8 10 6 Z" fill="#b9c0d4" />
      <path d="M -4 6 Q -2 -4 3 -5 Q 8 -3 8 6 Z" fill="#d4dae8" />
    </g>,
    // 4: starfish/shell
    <g key="shell">
      <circle r="7" fill="#ffb86b" />
      <path d="M 0 -7 L 2 -2 L 7 -2 L 3 1 L 5 6 L 0 3 L -5 6 L -3 1 L -7 -2 L -2 -2 Z" fill="#ff9d3f" />
    </g>,
    // 5: little wave
    <g key="wave">
      <path d="M -14 0 Q -7 -8 0 0 Q 7 -8 14 0" stroke="rgba(255,255,255,.75)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>,
  ];
  return (
    <g className="deco" transform={`translate(${x},${y}) scale(${scale})`}>
      {items[kind % items.length]}
    </g>
  );
}
