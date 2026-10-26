import React from 'react';
import { pseudoRandom } from './geometry.js';

/* All ambient pieces follow the same pattern:
   outer <g transform="..."> positions (SVG attribute),
   inner <g className="anim-..."> animates (CSS transform). */

function Cloud({ scale = 1, shadowY = null }) {
  return (
    <>
      {shadowY != null && (
        <ellipse cx="0" cy={shadowY} rx={62 * scale} ry={13 * scale} fill="rgba(10, 60, 110, 0.13)" />
      )}
      <g transform={`scale(${scale})`} opacity="0.94">
        <ellipse cx="-26" cy="4" rx="26" ry="16" fill="#ffffff" />
        <ellipse cx="8" cy="-6" rx="32" ry="21" fill="#ffffff" />
        <ellipse cx="38" cy="6" rx="24" ry="14" fill="#fdfdff" />
        <ellipse cx="4" cy="10" rx="44" ry="13" fill="#f4f9ff" />
      </g>
    </>
  );
}

/** Drifting clouds; each casts a translucent shadow on the sea/land below. */
export function CloudLayer({ count = 4, seed = 1, yBand = [40, 160], shadowDrop = 420, durBase = 65 }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const y = yBand[0] + pseudoRandom(seed * 31 + i * 7) * (yBand[1] - yBand[0]);
        const scale = 0.65 + pseudoRandom(seed * 13 + i * 5) * 0.75;
        const dur = durBase + pseudoRandom(seed * 7 + i * 11) * 50;
        const delay = -pseudoRandom(seed * 3 + i * 17) * dur;
        return (
          <g key={i} transform={`translate(0, ${y.toFixed(0)})`}>
            <g className="anim-drift" style={{ animationDuration: `${dur.toFixed(0)}s`, animationDelay: `${delay.toFixed(0)}s` }}>
              <Cloud scale={scale} shadowY={shadowDrop} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Gull({ scale = 1 }) {
  return (
    <g transform={`scale(${scale})`}>
      <g className="anim-flap">
        <path d="M -11 0 Q -5 -7 0 0 Q 5 -7 11 0" fill="none" stroke="#2b3a55" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** A small flock of gulls crossing the scene. */
export function BirdFlock({ seed = 1, y = 110, dur = 38, delay = 0, size = 4 }) {
  return (
    <g transform={`translate(0, ${y})`}>
      <g className="anim-drift" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
        {Array.from({ length: size }, (_, i) => (
          <g
            key={i}
            transform={`translate(${(pseudoRandom(seed + i * 3) * 70 - 35 + i * 34).toFixed(0)}, ${(pseudoRandom(seed + i * 9) * 36 - 18).toFixed(0)})`}
          >
            <Gull scale={0.8 + pseudoRandom(seed + i * 5) * 0.5} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** Thin wind streaks that glide and fade. */
export function WindStreaks({ count = 4, seed = 5, width = 1500, height = 800 }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = pseudoRandom(seed + i * 13) * (width - 300) + 40;
        const y = pseudoRandom(seed + i * 29) * (height - 160) + 80;
        const dur = 6 + pseudoRandom(seed + i * 7) * 5;
        const delay = -pseudoRandom(seed + i * 3) * dur;
        const len = 70 + pseudoRandom(seed + i * 11) * 90;
        return (
          <g key={i} transform={`translate(${x.toFixed(0)}, ${y.toFixed(0)})`}>
            <g className="anim-wind" style={{ animationDuration: `${dur.toFixed(1)}s`, animationDelay: `${delay.toFixed(1)}s` }}>
              <path
                d={`M 0 0 q ${len * 0.45} -12 ${len} 0 q 14 4 24 1`}
                fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.6" strokeLinecap="round"
              />
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** Seamless parallax swell band: repeating 300px sine, slides via CSS. */
function waveBandPath(width, amp, periods = 300) {
  const total = width + periods * 2;
  let d = `M 0 0`;
  for (let x = 0; x < total; x += periods) {
    d += ` q ${periods / 4} ${-amp} ${periods / 2} 0 q ${periods / 4} ${amp} ${periods / 2} 0`;
  }
  d += ` v 60 h ${-total} Z`;
  return d;
}

export function WaveField({ width = 1500, bands = [{ y: 300, amp: 9, cls: 'anim-wave-a', op: 0.10 }, { y: 470, amp: 12, cls: 'anim-wave-b', op: 0.08 }, { y: 640, amp: 8, cls: 'anim-wave-c', op: 0.12 }] }) {
  return (
    <g>
      {bands.map((b, i) => (
        <g key={i} transform={`translate(-300, ${b.y})`}>
          <g className={b.cls}>
            <path d={waveBandPath(width, b.amp)} fill="#ffffff" opacity={b.op} />
          </g>
        </g>
      ))}
    </g>
  );
}

/** A little sailboat bobbing its way across the sea. */
export function Boat({ y = 700, dur = 150 }) {
  return (
    <g transform={`translate(0, ${y})`}>
      <g className="anim-boat-sail" style={{ animationDuration: `${dur}s` }}>
        <g className="anim-boat-bob">
          <ellipse cx="0" cy="16" rx="34" ry="7" fill="rgba(10, 60, 110, 0.18)" />
          <path d="M -28 6 Q 0 16 28 6 L 20 16 Q 0 22 -20 16 Z" fill="#a0522d" stroke="#7c3f21" strokeWidth="2" />
          <rect x="-1.5" y="-34" width="3" height="40" rx="1.5" fill="#5c4326" />
          <path d="M 2 -32 Q 26 -18 2 -4 Z" fill="#ffffff" stroke="#e8e2d0" strokeWidth="1.5" />
          <path d="M -2 -28 Q -18 -16 -2 -6 Z" fill="#ffd23f" stroke="#e8a800" strokeWidth="1.5" />
        </g>
      </g>
    </g>
  );
}

/**
 * Storm parked over an inactive island: black wind-clouds + falling rain.
 * Rendered INSIDE the island group so it floats (and dims) with it.
 */
export function StormOverlay({ seed = 1, width = 290 }) {
  const drops = Array.from({ length: 14 }, (_, i) => ({
    x: (pseudoRandom(seed * 7 + i * 13) - 0.5) * (width - 60),
    y: -118 + pseudoRandom(seed * 3 + i * 5) * 26,
    delay: pseudoRandom(seed + i * 11) * 1.1,
    len: 9 + pseudoRandom(seed + i * 17) * 7,
  }));
  // every island's storm strikes on its own clock
  const strikeDelay = (pseudoRandom(seed * 19) * 7).toFixed(2);
  const bx = Math.round((pseudoRandom(seed * 5) - 0.5) * 80);
  const bolt = `M ${bx} -126 L ${bx - 9} -92 L ${bx + 3} -88 L ${bx - 13} -48`;
  return (
    <g className="storm" pointerEvents="none">
      {/* lightning glow inside the cloud bank (flashes behind the clouds) */}
      <g className="anim-storm-flash" style={{ animationDelay: `${strikeDelay}s` }}>
        <ellipse cx={bx} cy="-138" rx="92" ry="38" fill="rgba(215,232,255,0.55)" />
      </g>
      {/* black wind-cloud bank */}
      <g opacity="0.94">
        <ellipse cx="-62" cy="-136" rx="52" ry="26" fill="#3b4254" />
        <ellipse cx="10" cy="-152" rx="64" ry="32" fill="#2e3445" />
        <ellipse cx="74" cy="-134" rx="48" ry="24" fill="#454d63" />
        <ellipse cx="6" cy="-124" rx="86" ry="22" fill="#39404f" />
        {/* wind streaks tearing off the cloud */}
        <path d="M 96 -150 q 26 -4 44 4 M 104 -128 q 24 6 40 0" stroke="#566080" strokeWidth="3.5"
          fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
      {/* lightning bolt striking down from the bank: soft glow + bright core */}
      <g className="anim-lightning" style={{ animationDelay: `${strikeDelay}s` }}>
        <path d={bolt} fill="none" stroke="rgba(190,215,255,0.45)" strokeWidth="7"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={bolt} fill="none" stroke="#eaf3ff" strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* rain */}
      {drops.map((d, i) => (
        <line
          key={i}
          x1={d.x} y1={d.y} x2={d.x - 3} y2={d.y + d.len}
          stroke="rgba(165, 195, 230, 0.75)" strokeWidth="2.4" strokeLinecap="round"
          className="anim-rain" style={{ animationDelay: `${d.delay.toFixed(2)}s` }}
        />
      ))}
    </g>
  );
}

/** Night sky stars (visible only under .phase-night via CSS). */
export function Stars({ count = 26, seed = 9, width = 1500, height = 260 }) {
  return (
    <g className="stars">
      {Array.from({ length: count }, (_, i) => {
        const x = pseudoRandom(seed + i * 7) * width;
        const y = pseudoRandom(seed + i * 13) * height + 8;
        const r = 1 + pseudoRandom(seed + i * 3) * 1.6;
        return (
          <circle
            key={i} cx={x.toFixed(0)} cy={y.toFixed(0)} r={r.toFixed(1)} fill="#fff8d9"
            className="anim-twinkle" style={{ animationDelay: `${(pseudoRandom(seed + i) * 3).toFixed(1)}s` }}
          />
        );
      })}
    </g>
  );
}
