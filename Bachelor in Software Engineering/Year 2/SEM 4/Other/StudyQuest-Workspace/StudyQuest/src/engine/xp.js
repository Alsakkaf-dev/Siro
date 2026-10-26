// XP & levels — purely cosmetic motivation, derived from real actions only.

export const LEVELS = [0, 100, 250, 500, 850, 1300, 1900, 2650, 3550, 4600, 5800, 7200, 8800, 10600, 12600];

export function levelFor(xp) {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) lvl = i + 1;
  }
  return lvl;
}

export function levelProgress(xp) {
  const lvl = levelFor(xp);
  const lo = LEVELS[lvl - 1];
  const hi = LEVELS[lvl] ?? lo + 2000;
  return { lvl, lo, hi, pct: Math.min(1, (xp - lo) / (hi - lo)) };
}
