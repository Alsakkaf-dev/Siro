import { create } from 'zustand';
import { api } from '../api/client.js';

// Honest-time telemetry. A "session" = a subject context being open (reader/mission).
// The clock ticks every 1s for LIVE feedback, but only counts seconds where the tab
// is visible AND there was input activity in the last 60s. Counted seconds are
// batched into 15s heartbeat events that the server folds into the daily ledger.

const HEARTBEAT_SEC = 15;
const IDLE_LIMIT_MS = 60_000;

let lastActivity = Date.now();
let tickTimer = null;
let beatAccum = 0;
let queue = [];

function markActivity() {
  lastActivity = Date.now();
}

if (typeof window !== 'undefined') {
  for (const ev of ['mousemove', 'mousedown', 'keydown', 'scroll', 'wheel', 'touchstart']) {
    window.addEventListener(ev, markActivity, { passive: true });
  }
  window.addEventListener('beforeunload', () => {
    if (queue.length) api.beaconEvents(queue.splice(0));
  });
}

function flush() {
  if (!queue.length) return;
  const events = queue.splice(0);
  api.postEvents(events).catch(() => {
    queue.unshift(...events); // retry next flush
  });
}

export const useSessionStore = create((set, get) => ({
  // current context: { subjectId, context } or null
  active: null,
  secondsThisSession: 0,

  /** Begin tracking time against a subject (reader open, mission open). */
  begin(subjectId, context = 'reader') {
    get().end(); // close any previous session first
    set({ active: { subjectId, context }, secondsThisSession: 0 });
    markActivity();
    beatAccum = 0;
    tickTimer = setInterval(() => {
      const { active } = get();
      if (!active) return;
      const visible = document.visibilityState === 'visible';
      const fresh = Date.now() - lastActivity < IDLE_LIMIT_MS;
      if (visible && fresh) {
        set((s) => ({ secondsThisSession: s.secondsThisSession + 1 }));
        beatAccum += 1;
        if (beatAccum >= HEARTBEAT_SEC) {
          queue.push({
            type: 'heartbeat',
            subjectId: active.subjectId,
            context: active.context,
            seconds: beatAccum,
          });
          beatAccum = 0;
          if (queue.length >= 4) flush();
        }
      }
    }, 1000);
  },

  /** Stop tracking; flush the partial beat and outstanding events. */
  end() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    const { active } = get();
    if (active && beatAccum > 0) {
      queue.push({
        type: 'heartbeat',
        subjectId: active.subjectId,
        context: active.context,
        seconds: beatAccum,
      });
      beatAccum = 0;
    }
    flush();
    set({ active: null });
  },

  /** Log a discrete event (page_view, answer, gate_result, file_open). */
  log(event) {
    queue.push(event);
    if (queue.length >= 8) flush();
  },

  flush,
}));
