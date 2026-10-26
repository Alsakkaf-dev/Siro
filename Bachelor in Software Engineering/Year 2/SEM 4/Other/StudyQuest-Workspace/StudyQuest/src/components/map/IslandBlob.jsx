import React, { useMemo } from 'react';
import { pseudoRandom } from './geometry.js';

/** Procedural wobbly island blob path, seeded by blobId. */
function blobPath(seed, rBase, wobble = 0.22, n = 12, squash = 0.72) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const r = rBase * (1 + (pseudoRandom(seed * 31 + i * 7) - 0.5) * 2 * wobble);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * squash });
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + ' Z';
}

/**
 * Pseudo-3D island: submerged shelf → extruded cliff wall → sand rim
 * with grain → grass plateau with texture + sunlit highlight.
 */
export default function IslandBlob({ blobId, color, r = 150 }) {
  const sandSeed = blobId * 13 + 5;
  const sand = useMemo(() => blobPath(sandSeed, r * 1.18, 0.16), [sandSeed, r]);
  const grass = useMemo(() => blobPath(sandSeed, r, 0.2), [sandSeed, r]);
  const inner = useMemo(() => blobPath(blobId * 29 + 3, r * 0.6, 0.3), [blobId, r]);
  const CLIFF = r * 0.14; // extrusion depth

  return (
    <g>
      {/* submerged shallow-water shelf */}
      <ellipse cx="0" cy={CLIFF + 12} rx={r * 1.52} ry={r * 0.98} fill="rgba(180, 245, 255, 0.30)" />
      <ellipse cx="0" cy={CLIFF + 10} rx={r * 1.34} ry={r * 0.86} fill="rgba(120, 225, 245, 0.30)" />

      {/* swelling foam ring */}
      <g className="anim-foam" style={{ animationDelay: `${(blobId * 0.9) % 5}s` }}>
        <ellipse cx="0" cy={CLIFF + 8} rx={r * 1.28} ry={r * 0.8} fill="none"
          stroke="rgba(255,255,255,0.75)" strokeWidth="3" strokeDasharray="16 22" />
      </g>

      {/* extruded cliff wall (the 3D side) */}
      <path d={sand} fill="url(#islandSide)" transform={`translate(0, ${CLIFF})`} />
      <path d={sand} fill="rgba(60, 35, 10, 0.18)" transform={`translate(0, ${CLIFF})`} />

      {/* sand rim */}
      <path d={sand} fill="#ffe9b3" stroke="#e3c684" strokeWidth="2.5" />
      <path d={sand} fill="url(#sandGrain)" />

      {/* grass plateau, slightly raised */}
      <g transform="translate(0,-9)">
        <path d={grass} fill="url(#grassTop)" stroke="#5cb53a" strokeWidth="3" />
        <path d={grass} fill="url(#grassDots)" />
        {/* sunlit highlight on the upper-left */}
        <path d={inner} fill="rgba(255, 255, 220, 0.30)" transform="translate(-8,-10) scale(0.92)" />
        {/* subject tint pool */}
        <path d={inner} fill={color} opacity="0.22" />
      </g>
    </g>
  );
}
