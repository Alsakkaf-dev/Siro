// Run the Pacing Calibrator: rewrite remaining READ timers + emit content/plan.json.
// Usage: node scripts/calibrate-plan.js [--from=2026-06-13T14:30] [--dry]
import { runCalibration } from '../server/lib/calibrate.js';

const fromArg = process.argv.find((a) => a.startsWith('--from='));
const from = fromArg ? new Date(fromArg.slice(7)) : new Date();
const write = !process.argv.includes('--dry');

if (Number.isNaN(from.getTime())) {
  console.error(`✗ invalid --from value: ${fromArg}`);
  process.exit(1);
}

let result;
try {
  result = runCalibration({ from, write });
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}

const { plan, summary } = result;
console.log(`\n⚖️  Pacing Calibrator — from ${from.toLocaleString('en-US', { hour12: true })}${write ? '' : ' (DRY RUN)'}\n`);

const cols = [
  ['subject', (r) => r.subject],
  ['sessions', (r) => r.sessions],
  ['budget', (r) => `${r.minutes}m`],
  ['drills', (r) => `${r.drillsMin}m`],
  ['read budget', (r) => `${r.readBudgetMin}m`],
  ['slides left', (r) => r.remainingPages],
  ['pace', (r) => (r.paceSec == null ? '—' : `${r.paceSec}s/slide`)],
  ['buffer', (r) => `${r.bufferMin}m`],
  ['tight', (r) => (r.tight ? '⚠ TIGHT' : 'ok')],
];
const widths = cols.map(([h, f]) => Math.max(h.length, ...summary.map((r) => String(f(r)).length)));
const line = (vals) => '  ' + vals.map((v, i) => String(v).padEnd(widths[i] + 2)).join('');
console.log(line(cols.map(([h]) => h)));
console.log(line(widths.map((w) => '─'.repeat(w))));
for (const r of summary) console.log(line(cols.map(([, f]) => f(r))));

const tight = summary.filter((r) => r.tight);
console.log('');
if (tight.length) {
  console.log(`⚠ TIGHT subjects (pace clamped to 25s/slide — physically too fast): ${tight.map((r) => r.subject).join(', ')}`);
} else {
  console.log('✓ Invariant holds for every subject: rewritten timers + drill estimates fit the session budget.');
}
if (write) {
  console.log(`✓ Patched ${Object.keys(plan.subjects).length} country.json files (goal.minSeconds only) + content/plan.json`);
} else {
  console.log('· Dry run — nothing written.');
}
