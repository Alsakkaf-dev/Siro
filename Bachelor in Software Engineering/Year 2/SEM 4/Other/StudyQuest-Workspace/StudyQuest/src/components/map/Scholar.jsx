import React from 'react';

/* The Traveling Scholar — hand-drawn SVG cartoon professor.
   Two poses: reading in his armchair (on an island) and rowing
   his book-boat between islands. */

const SKIN = '#f2c9a0';
const SKIN_SHADE = '#dba87a';
const HAIR = '#cfd4dc';
const JACKET = '#7a6a52';
const JACKET_DARK = '#5d503c';
const TROUSER = '#3e3a55';

/** Upper body + head reading an open book (shared by both poses). */
function ReadingBody({ bookCover = '#3a9bea' }) {
  return (
    <g>
      {/* torso */}
      <path d="M -16 6 Q -18 -22 0 -24 Q 18 -22 16 6 Z" fill={JACKET} stroke={JACKET_DARK} strokeWidth="1.6" />
      <path d="M -5 -22 L 0 -12 L 5 -22 Z" fill="#f6f1e3" />
      <path d="M -1.6 -12 h 3.2 l 1 10 h -5.2 Z" fill="#8e3b52" />
      {/* arms holding the book */}
      <path d="M -15 -8 Q -22 2 -12 8" fill="none" stroke={JACKET} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M 15 -8 Q 22 2 12 8" fill="none" stroke={JACKET} strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="-11" cy="8" r="3.2" fill={SKIN} />
      <circle cx="11" cy="8" r="3.2" fill={SKIN} />
      {/* open book */}
      <g transform="translate(0, 9)">
        <path d="M -14 0 Q -7 -5 0 0 Q 7 -5 14 0 L 14 7 Q 7 2.5 0 7 Q -7 2.5 -14 7 Z"
          fill="#fffdf2" stroke={bookCover} strokeWidth="2.2" strokeLinejoin="round" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="#d8d2bd" strokeWidth="1.2" />
        <path d="M -10 1.5 q 5 -2.5 9 0 M -10 4 q 5 -2.5 9 0" stroke="#c9c2aa" strokeWidth="0.9" fill="none" transform="translate(-1.5,0.5) scale(0.45)" />
      </g>
      {/* head */}
      <g transform="translate(0, -32)">
        <circle r="11.5" fill={SKIN} />
        <path d="M -11 2 Q -6 8 0 8 Q 6 8 11 2 L 11 6 Q 5 11 0 11 Q -5 11 -11 6 Z" fill={HAIR} opacity="0.95" />
        <path d="M -11.5 -2 Q -12 -9 -6 -10.5 M 11.5 -2 Q 12 -9 6 -10.5" stroke={HAIR} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* glasses looking down at the book */}
        <circle cx="-4.6" cy="0.5" r="3.6" fill="rgba(255,255,255,.55)" stroke="#46506b" strokeWidth="1.5" />
        <circle cx="4.6" cy="0.5" r="3.6" fill="rgba(255,255,255,.55)" stroke="#46506b" strokeWidth="1.5" />
        <line x1="-1" y1="0.5" x2="1" y2="0.5" stroke="#46506b" strokeWidth="1.5" />
        <circle cx="-4.4" cy="1.3" r="1.1" fill="#2b2350" />
        <circle cx="4.8" cy="1.3" r="1.1" fill="#2b2350" />
        <path d="M -2 5.4 Q 0 6.8 2 5.4" stroke={SKIN_SHADE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* tidy beard */}
        <path d="M -7 4 Q -6 9.5 0 10 Q 6 9.5 7 4 Q 4 7.5 0 7.5 Q -4 7.5 -7 4 Z" fill={HAIR} />
      </g>
    </g>
  );
}

function BookStack({ scale = 1 }) {
  return (
    <g transform={`scale(${scale})`}>
      <rect x="-13" y="-6" width="26" height="6.5" rx="1.6" fill="#a14b6b" stroke="#7c3551" strokeWidth="1.2" />
      <rect x="-11" y="-12" width="24" height="6.5" rx="1.6" fill="#3a9bea" stroke="#1f6fb8" strokeWidth="1.2" />
      <rect x="-12" y="-18" width="22" height="6.5" rx="1.6" fill="#3ecf6e" stroke="#259a4c" strokeWidth="1.2" />
    </g>
  );
}

/** Pose 1 — reading in his armchair on the island. */
export function ScholarReading({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} filter="url(#tinyShadow)">
      <ellipse cx="0" cy="34" rx="42" ry="8" fill="rgba(43,35,80,.28)" />
      {/* armchair */}
      <g>
        <path d="M -26 30 Q -34 30 -34 20 L -34 -16 Q -34 -28 -24 -28 L -22 -28 L -22 16 L 22 16 L 22 -28 L 24 -28 Q 34 -28 34 -16 L 34 20 Q 34 30 26 30 Z"
          fill="#8e3b52" stroke="#6d2c40" strokeWidth="2" />
        <rect x="-25" y="-30" width="50" height="40" rx="10" fill="#a14b6b" stroke="#6d2c40" strokeWidth="2" />
        <rect x="-22" y="12" width="44" height="16" rx="7" fill="#b25a7a" stroke="#6d2c40" strokeWidth="2" />
        <circle cx="-29" cy="-12" r="1.4" fill="#ffd23f" />
        <circle cx="29" cy="-12" r="1.4" fill="#ffd23f" />
        <circle cx="-29" cy="2" r="1.4" fill="#ffd23f" />
        <circle cx="29" cy="2" r="1.4" fill="#ffd23f" />
        <rect x="-26" y="30" width="7" height="6" rx="2.5" fill="#5c4326" />
        <rect x="19" y="30" width="7" height="6" rx="2.5" fill="#5c4326" />
      </g>
      {/* legs */}
      <path d="M -9 16 L -12 30 L -4 30 L -4 16 Z" fill={TROUSER} />
      <path d="M 9 16 L 12 30 L 4 30 L 4 16 Z" fill={TROUSER} />
      <ellipse cx="-10" cy="32" rx="6" ry="3.4" fill="#4a3823" />
      <ellipse cx="10" cy="32" rx="6" ry="3.4" fill="#4a3823" />
      {/* breathing upper body */}
      <g className="anim-read-bob">
        <g transform="translate(0, -4)">
          <ReadingBody bookCover="#e8a800" />
        </g>
      </g>
      {/* side table with books + mug */}
      <g transform="translate(50, 14)">
        <rect x="-15" y="4" width="30" height="4.5" rx="2" fill="#8a6b3e" stroke="#6d5430" strokeWidth="1.3" />
        <rect x="-2" y="8" width="4" height="14" fill="#6d5430" />
        <ellipse cx="0" cy="23" rx="9" ry="2.6" fill="rgba(43,35,80,.2)" />
        <BookStack scale={0.9} />
        <g transform="translate(10, -2)">
          <rect x="-3.5" y="-5" width="7" height="6.5" rx="1.6" fill="#3a9bea" stroke="#1f6fb8" strokeWidth="1" />
          <path d="M 3.5 -3.5 q 3 0.5 0 3" fill="none" stroke="#1f6fb8" strokeWidth="1.2" />
          <path d="M -1.5 -7 q 1 -2 0 -3.5 M 1.5 -7 q -1 -2 0 -3.5" stroke="rgba(255,255,255,.8)" strokeWidth="1" fill="none" className="anim-twinkle" />
        </g>
      </g>
    </g>
  );
}

/** Pose 2 — rowing the book-boat. flip=true mirrors him to face left. */
export function ScholarBoat({ x = 0, y = 0, scale = 1, flip = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
      <g className="anim-boat-bob">
        {/* wake */}
        <path d="M -52 16 q -12 2 -22 -1 M -50 22 q -16 4 -30 0" stroke="rgba(255,255,255,.55)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="0" cy="22" rx="52" ry="8" fill="rgba(10, 60, 110, 0.20)" />
        {/* hull */}
        <path d="M -48 2 Q 0 16 48 2 L 36 22 Q 0 30 -36 22 Z" fill="#a0522d" stroke="#6d3a1e" strokeWidth="2.5" />
        <path d="M -44 6 Q 0 17 44 6" stroke="#6d3a1e" strokeWidth="1.6" fill="none" />
        <path d="M -39 12 Q 0 22 39 12" stroke="#6d3a1e" strokeWidth="1.4" fill="none" opacity=".7" />
        {/* book cargo at the bow */}
        <g transform="translate(-30, 2)">
          <BookStack scale={1} />
        </g>
        {/* lantern at the stern */}
        <g transform="translate(36, -14)">
          <rect x="-1.4" y="0" width="2.8" height="16" fill="#5c4326" />
          <circle cy="-4" r="7.5" fill="rgba(255, 200, 80, 0.30)" className="anim-beacon" />
          <rect x="-4.5" y="-9" width="9" height="11" rx="2.5" fill="#3e3a55" stroke="#2b2840" strokeWidth="1.3" />
          <rect x="-2.8" y="-7" width="5.6" height="7" rx="1.4" fill="#ffd76e" className="anim-beacon" />
        </g>
        {/* scholar reading mid-boat */}
        <g transform={`translate(2, -12) ${flip ? 'scale(-1, 1)' : ''}`}>
          <path d="M -8 14 L -14 22 L -6 24 Z" fill={TROUSER} />
          <path d="M 8 14 L 14 22 L 6 24 Z" fill={TROUSER} />
          <g className="anim-read-bob">
            <ReadingBody bookCover="#3ecf6e" />
          </g>
        </g>
      </g>
    </g>
  );
}

/** Boxless status text: white status line + gold ticking countdown, halo-stroked. */
export function JourneyPlate({ x = 0, y = 0, line1, line2 }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text
        textAnchor="middle" y="0" fill="#ffffff" fontSize="15.5" fontWeight="800"
        fontFamily="'Baloo 2', sans-serif"
        stroke="rgba(24, 20, 55, 0.62)" strokeWidth="4.5" paintOrder="stroke"
      >
        {line1}
      </text>
      {line2 && (
        <text
          textAnchor="middle" y="22" fill="#ffd76e" fontSize="14.5" fontWeight="800"
          fontFamily="'Baloo 2', sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}
          stroke="rgba(24, 20, 55, 0.62)" strokeWidth="4.5" paintOrder="stroke"
        >
          {line2}
        </text>
      )}
    </g>
  );
}
