import React from 'react';

/**
 * Shared SVG asset kit: gradients, patterns and filters referenced by id
 * across all map views. Render ONCE inside each <svg>.
 */
export default function MapDefs() {
  return (
    <defs>
      {/* ---------- Ocean ---------- */}
      <radialGradient id="oceanDepth" cx="50%" cy="35%" r="85%">
        <stop offset="0%" stopColor="#5ed0f5" />
        <stop offset="55%" stopColor="#38b6e3" />
        <stop offset="100%" stopColor="#1b86c2" />
      </radialGradient>

      {/* warm light pool under the ONE focus island (the lit island law) */}
      <radialGradient id="focusGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,240,170,0.50)" />
        <stop offset="45%" stopColor="rgba(255,225,130,0.22)" />
        <stop offset="100%" stopColor="rgba(255,225,130,0)" />
      </radialGradient>

      {/* cinematic depth: clear center, darkened edges (world view full-bleed) */}
      <radialGradient id="worldVignette" cx="50%" cy="42%" r="78%">
        <stop offset="0%" stopColor="rgba(6,16,44,0)" />
        <stop offset="62%" stopColor="rgba(6,16,44,0)" />
        <stop offset="100%" stopColor="rgba(6,16,44,0.40)" />
      </radialGradient>

      <pattern id="causticLines" width="140" height="70" patternUnits="userSpaceOnUse">
        <path d="M0 18 Q 35 8, 70 18 T 140 18" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
        <path d="M0 50 Q 35 62, 70 50 T 140 50" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.35" />
      </pattern>

      {/* ---------- Island terrain ---------- */}
      <linearGradient id="islandSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d8b97e" />
        <stop offset="60%" stopColor="#b08c54" />
        <stop offset="100%" stopColor="#8a6b3e" />
      </linearGradient>

      <linearGradient id="grassTop" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#aceb7f" />
        <stop offset="60%" stopColor="#8fd95c" />
        <stop offset="100%" stopColor="#6fc344" />
      </linearGradient>

      <pattern id="grassDots" width="30" height="26" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="7" r="1.7" fill="rgba(30, 90, 20, 0.13)" />
        <circle cx="21" cy="18" r="1.4" fill="rgba(30, 90, 20, 0.10)" />
        <path d="M13 22 q 1.5 -4 3 0" stroke="rgba(30,90,20,.14)" strokeWidth="1.2" fill="none" />
      </pattern>

      <pattern id="sandGrain" width="22" height="18" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.1" fill="rgba(150, 105, 40, 0.18)" />
        <circle cx="16" cy="12" r="0.9" fill="rgba(150, 105, 40, 0.14)" />
      </pattern>

      {/* ---------- Glass / bevel ---------- */}
      <linearGradient id="glassPanel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
        <stop offset="45%" stopColor="rgba(255,255,255,0.10)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>

      <radialGradient id="nodeShine" cx="34%" cy="28%" r="75%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
        <stop offset="38%" stopColor="rgba(255,255,255,0.18)" />
        <stop offset="70%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>

      <radialGradient id="nodeShade" cx="50%" cy="118%" r="80%">
        <stop offset="0%" stopColor="rgba(30, 20, 60, 0.42)" />
        <stop offset="55%" stopColor="rgba(30, 20, 60, 0.12)" />
        <stop offset="100%" stopColor="rgba(30, 20, 60, 0)" />
      </radialGradient>

      <linearGradient id="roadCurb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(43, 35, 80, 0.0)" />
        <stop offset="100%" stopColor="rgba(43, 35, 80, 0.45)" />
      </linearGradient>

      {/* ---------- Filters (cheap feDropShadow only) ---------- */}
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0a3a5c" floodOpacity="0.35" />
      </filter>

      <filter id="tinyShadow" x="-50%" y="-50%" width="200%" height="220%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#2b2350" floodOpacity="0.35" />
      </filter>

      <filter id="glowGold" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#ffd23f" floodOpacity="0.85" />
      </filter>
    </defs>
  );
}
