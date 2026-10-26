// Map geometry helpers: serpentine node layout + smooth road path.

/**
 * Lay out N nodes bottom-to-top in a serpentine (Candy-Crush) pattern.
 * Returns points [{x, y}] inside the given viewBox.
 */
export function serpentinePoints(n, width, height, { margin = 110, amplitude = 0.32, seed = 1 } = {}) {
  const pts = [];
  const usableH = height - margin * 2;
  const cx = width / 2;
  const span = width * amplitude;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const y = height - margin - t * usableH;
    // serpentine: sin wave left/right + small deterministic jitter
    const wave = Math.sin(t * Math.PI * Math.max(1.5, n / 3.2) + seed);
    const jitter = (pseudoRandom(seed * 97 + i * 13) - 0.5) * width * 0.06;
    pts.push({ x: cx + wave * span + jitter, y });
  }
  return pts;
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
export function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Catmull-Rom spline through points → SVG cubic-Bezier path string.
 */
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Scatter deterministic decorations around the map (trees, shells, flowers...). */
export function scatterDecorations(count, width, height, seed, avoid = [], avoidR = 90) {
  const out = [];
  let attempts = 0;
  let i = 0;
  while (out.length < count && attempts < count * 12) {
    attempts++;
    const x = pseudoRandom(seed + attempts * 7.13) * (width - 80) + 40;
    const y = pseudoRandom(seed + attempts * 3.77 + 99) * (height - 120) + 60;
    if (avoid.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < avoidR * avoidR)) continue;
    out.push({ x, y, kind: Math.floor(pseudoRandom(seed + attempts * 11.3) * 6), i: i++ });
  }
  return out;
}
