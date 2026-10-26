import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.js';
import { atomicWriteJson, readJsonSafe } from './atomicWrite.js';

const LEDGER_DIR = path.join(DATA_DIR, 'ledger');
const EVENTS_DIR = path.join(DATA_DIR, 'events');

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function appendEvents(events) {
  fs.mkdirSync(EVENTS_DIR, { recursive: true });
  const file = path.join(EVENTS_DIR, `${localDateKey()}.ndjson`);
  const lines = events.map((e) => JSON.stringify({ ...e, at: e.at ?? new Date().toISOString() })).join('\n') + '\n';
  fs.appendFileSync(file, lines, 'utf8');

  // Fold heartbeats into the daily per-subject seconds ledger.
  const beats = events.filter((e) => e.type === 'heartbeat' && e.subjectId);
  if (beats.length) {
    const ledgerFile = path.join(LEDGER_DIR, `${localDateKey()}.json`);
    const ledger = readJsonSafe(ledgerFile, {});
    for (const b of beats) {
      const secs = Math.min(Number(b.seconds) || 0, 120); // cap one beat at 2min — anti-cheese
      ledger[b.subjectId] = (ledger[b.subjectId] || 0) + secs;
    }
    atomicWriteJson(ledgerFile, ledger);
  }
}

export function todayLedger() {
  return readJsonSafe(path.join(LEDGER_DIR, `${localDateKey()}.json`), {});
}

export function ledgerSummary() {
  const out = {};
  if (!fs.existsSync(LEDGER_DIR)) return out;
  for (const f of fs.readdirSync(LEDGER_DIR)) {
    if (!f.endsWith('.json')) continue;
    out[f.replace('.json', '')] = readJsonSafe(path.join(LEDGER_DIR, f), {});
  }
  return out;
}
