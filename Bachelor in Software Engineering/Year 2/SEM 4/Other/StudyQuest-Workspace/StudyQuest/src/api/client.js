const J = (r) => {
  if (!r.ok) throw new Error(`API ${r.status}: ${r.url}`);
  return r.json();
};

export const api = {
  tree: (refresh = false) => fetch(`/api/tree${refresh ? '?refresh=1' : ''}`).then(J),
  fileUrl: (relPath) => `/api/file?p=${encodeURIComponent(relPath)}`,
  fileText: (relPath) => fetch(`/api/file?p=${encodeURIComponent(relPath)}`).then((r) => {
    if (!r.ok) throw new Error(`file ${r.status}`);
    return r.text();
  }),
  content: (file) => fetch(`/api/content/${file}`).then(J),
  getProgress: () => fetch('/api/progress').then(J),
  putProgress: (p) =>
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then(J),
  postEvents: (events) =>
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).then(J),
  beaconEvents: (events) => {
    const payload = JSON.stringify({ events });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([payload], { type: 'text/plain' }));
    }
  },
  calibrate: (from) =>
    fetch('/api/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from }),
    }).then(J),
  timeToday: () => fetch('/api/time/today').then(J),
  timeSummary: () => fetch('/api/time/summary').then(J),
};
