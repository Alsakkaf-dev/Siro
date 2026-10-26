import { create } from 'zustand';
import { api } from '../api/client.js';
import { useClockStore } from './useClockStore.js';

let saveTimer = null;

// Trailing throttle, NOT debounce: with continuous 1s updates a debounce would
// postpone the save forever. This guarantees a save at most 2s after any change.
function scheduleSave(get) {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const { progress } = get();
    api.putProgress(progress).catch((e) => console.error('progress save failed', e));
  }, 2000);
}

export const useGameStore = create((set, get) => ({
  world: null,
  schedule: null,
  countries: {},   // subjectId -> country.json
  banks: {},       // bankPath -> bank json
  progress: { version: 1, xp: 0, missions: {}, reading: {} },
  plan: null,      // content/plan.json (calibrated itinerary) — tolerated missing
  timeToday: {},   // subjectId -> seconds (server ledger)
  loaded: false,
  toast: null,     // { msg, kind }

  async boot() {
    const [world, schedule, progress, plan] = await Promise.all([
      api.content('world.json'),
      api.content('schedule.json'),
      api.getProgress(),
      api.content('plan.json').catch(() => null), // not calibrated yet → fine
    ]);
    const countries = {};
    await Promise.all(
      world.subjects.map(async (s) => {
        try {
          countries[s.id] = await api.content(s.countryFile);
        } catch {
          countries[s.id] = null; // country content not authored yet
        }
      })
    );
    set({ world, schedule, countries, progress, plan, loaded: true });
    get().refreshTimeToday();
  },

  /** Re-balance: redistribute remaining slides over remaining sessions, then
   *  reload the plan + countries so calibrated timers apply instantly. */
  async recalibrate() {
    try {
      // send the clock store's now so ?fakeNow= calibrates from the fake moment
      await api.calibrate(useClockStore.getState().now.toISOString());
      const { world } = get();
      const countries = {};
      await Promise.all(
        world.subjects.map(async (s) => {
          try {
            countries[s.id] = await api.content(s.countryFile);
          } catch {
            countries[s.id] = null;
          }
        })
      );
      const plan = await api.content('plan.json').catch(() => null);
      set({ countries, plan });
      get().showToast('⚖️ Plan re-balanced', 'info');
    } catch (e) {
      console.error('recalibrate failed', e);
      get().showToast('⚠️ Re-balance failed', 'info');
    }
  },

  async refreshTimeToday() {
    try {
      set({ timeToday: await api.timeToday() });
    } catch {}
  },

  async loadBank(bankPath) {
    const { banks } = get();
    if (banks[bankPath]) return banks[bankPath];
    const bank = await api.content(bankPath);
    set({ banks: { ...banks, [bankPath]: bank } });
    return bank;
  },

  /** Merge updates into one mission's progress entry. */
  updateMission(missionId, patch) {
    set((st) => {
      const prev = st.progress.missions[missionId] ?? {
        status: 'todo', secondsSpent: 0, pagesViewed: [], bestScorePct: 0, stars: 0, attempts: [],
      };
      return {
        progress: {
          ...st.progress,
          missions: { ...st.progress.missions, [missionId]: { ...prev, ...patch } },
        },
      };
    });
    scheduleSave(get);
  },

  /** Track reading on any browsed file (outside missions too). */
  trackReading(relPath, { seconds = 0, page = null } = {}) {
    set((st) => {
      const prev = st.progress.reading[relPath] ?? { seconds: 0, pagesViewed: [], lastAt: null };
      const pagesViewed =
        page != null && !prev.pagesViewed.includes(page)
          ? [...prev.pagesViewed, page]
          : prev.pagesViewed;
      return {
        progress: {
          ...st.progress,
          reading: {
            ...st.progress.reading,
            [relPath]: { seconds: prev.seconds + seconds, pagesViewed, lastAt: new Date().toISOString() },
          },
        },
      };
    });
    scheduleSave(get);
  },

  addXp(amount, label = '') {
    set((st) => ({ progress: { ...st.progress, xp: st.progress.xp + amount } }));
    scheduleSave(get);
    get().showToast(`+${amount} XP ${label}`, 'xp');
  },

  showToast(msg, kind = 'info') {
    set({ toast: { msg, kind, at: Date.now() } });
    setTimeout(() => {
      const t = get().toast;
      if (t && Date.now() - t.at >= 2900) set({ toast: null });
    }, 3000);
  },
}));
