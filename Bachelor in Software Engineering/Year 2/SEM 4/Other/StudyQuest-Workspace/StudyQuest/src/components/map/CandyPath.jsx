import React from 'react';
import { smoothPath } from './geometry.js';

/** Fat candy road with a 3D curb: deep shadow → dark curb → bright top → dashes. */
export default function CandyPath({ points, color = '#ff8fb5', width = 34 }) {
  const d = smoothPath(points);
  if (!d) return null;
  return (
    <g>
      {/* soft ground shadow */}
      <path className="path-under" d={d} strokeWidth={width + 14} transform="translate(0,10)" opacity="0.55" />
      {/* curb — the road's extruded side */}
      <path d={d} fill="none" stroke="rgba(43,35,80,.55)" strokeLinecap="round" strokeWidth={width + 6} transform="translate(0,5)" />
      {/* road surface */}
      <path className="path-over" d={d} stroke={color} strokeWidth={width} />
      {/* sunlit top edge */}
      <path d={d} fill="none" stroke="rgba(255,255,255,.32)" strokeLinecap="round" strokeWidth={Math.max(6, width * 0.4)} transform="translate(0,-4)" />
      <path className="path-dash" d={d} strokeWidth={Math.max(4, width * 0.16)} />
    </g>
  );
}
