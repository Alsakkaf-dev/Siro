import { create } from 'zustand';

// Live clock ticking every second. Supports ?fakeNow=2026-06-30T09:00 for testing.
function initialNow() {
  const param = new URLSearchParams(window.location.search).get('fakeNow');
  if (param) {
    const fake = new Date(param);
    if (!Number.isNaN(fake.getTime())) {
      return { now: fake, offset: fake - Date.now() };
    }
  }
  return { now: new Date(), offset: 0 };
}

const init = initialNow();

export const useClockStore = create((set, get) => ({
  now: init.now,
  offset: init.offset,
  start() {
    if (get()._timer) return;
    const timer = setInterval(() => {
      set({ now: new Date(Date.now() + get().offset) });
    }, 1000);
    set({ _timer: timer });
  },
  _timer: null,
}));
