import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore.js';
import { useClockStore } from '../../store/useClockStore.js';
import { levelProgress } from '../../engine/xp.js';
import { fmtDate, dayPhase } from '../../engine/schedule.js';
import ScheduleStrip from './ScheduleStrip.jsx';
import SessionCup from './SessionCup.jsx';

/* Scenic backdrops for the clock pill — like a day/night toggle, but live. */
const SCENES = {
  dawn:  { sky: ['#ffe7bd', '#ffb27a', '#e07a8a'], m1: '#d98a6a', m2: '#b06050', sun: '#fff6d9', sunY: 40 },
  day:   { sky: ['#ffe06f', '#ffb43f', '#f08a2b'], m1: '#e09a3a', m2: '#c0761f', sun: '#fffbe8', sunY: 16 },
  dusk:  { sky: ['#ffb46b', '#c8688a', '#7a4a8a'], m1: '#8a4a6a', m2: '#643a5c', sun: '#ffd9a0', sunY: 42 },
  night: { sky: ['#6d7ce0', '#3a4aaf', '#1f2a66'], m1: '#3a4aa8', m2: '#28367f', moon: true },
};

function Sparkle({ x, y, s = 3 }) {
  return (
    <path
      d={`M ${x} ${y - s} L ${x + s * 0.35} ${y - s * 0.35} L ${x + s} ${y} L ${x + s * 0.35} ${y + s * 0.35} L ${x} ${y + s} L ${x - s * 0.35} ${y + s * 0.35} L ${x - s} ${y} L ${x - s * 0.35} ${y - s * 0.35} Z`}
      fill="#fff8d9"
    />
  );
}

function ClockScene({ phase }) {
  const s = SCENES[phase] ?? SCENES.day;
  return (
    <svg className="clock-scene" viewBox="0 0 250 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="clockSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.sky[0]} />
          <stop offset="55%" stopColor={s.sky[1]} />
          <stop offset="100%" stopColor={s.sky[2]} />
        </linearGradient>
      </defs>
      <rect width="250" height="60" fill="url(#clockSky)" />
      {s.moon ? (
        <g>
          <circle cx="215" cy="17" r="9" fill="#f4f6ff" />
          <circle cx="219" cy="14" r="7.5" fill={s.sky[1]} />
          <Sparkle x={186} y={11} s={3.2} />
          <Sparkle x={200} y={28} s={2.2} />
          <Sparkle x={232} y={26} s={2.6} />
        </g>
      ) : (
        <g>
          <circle cx="210" cy={s.sunY} r="16" fill={s.sun} opacity="0.35" />
          <circle cx="210" cy={s.sunY} r="9" fill={s.sun} />
        </g>
      )}
      {/* mountain silhouettes */}
      <path d="M -6 60 L 42 30 Q 46 27 50 31 L 84 60 Z" fill={s.m1} opacity="0.92" />
      <path d="M 56 60 L 106 20 Q 110 17 115 21 L 168 60 Z" fill={s.m2} />
      <path d="M 142 60 L 192 33 Q 196 30 201 34 L 256 60 Z" fill={s.m1} opacity="0.9" />
      <rect y="52" width="250" height="8" fill={s.m2} opacity="0.5" />
    </svg>
  );
}

export default function TopBar() {
  const xp = useGameStore((s) => s.progress.xp);
  const now = useClockStore((s) => s.now);
  const { lvl, lo, hi, pct } = levelProgress(xp);

  const h24 = now.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ap = h24 >= 12 ? 'PM' : 'AM';
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLine = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="logo">🗺️</span> StudyQuest
      </Link>

      {/* live scenic clock pill — sunrise/sun/sunset/moon follows the real time */}
      <div className={`hud-clock phase-${dayPhase(now)}`} title={fmtDate(now)}>
        <ClockScene phase={dayPhase(now)} />
        <div className="day-block">
          <b>{weekday}</b>
          <span>{dateLine}</span>
        </div>
        <div className="time-block">
          <span className="t-h">{h12}</span>
          <span className="t-m">:{mm}</span>
          <span className="t-s">{ss}</span>
          <span className="t-ap">{ap}</span>
        </div>
      </div>

      <div className="hud-xp" title={`Level ${lvl} — ${xp} XP (${hi - xp} to next)`}>
        <div className="lvl-badge">{lvl}</div>
        <div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${pct * 100}%` }} />
          </div>
          <div className="xp-num">{xp} / {hi} XP</div>
        </div>
      </div>

      <SessionCup />

      <ScheduleStrip />

      <nav className="topbar-nav">
        <NavLink to="/" end>World</NavLink>
        <NavLink to="/browse">Library</NavLink>
      </nav>
    </header>
  );
}
