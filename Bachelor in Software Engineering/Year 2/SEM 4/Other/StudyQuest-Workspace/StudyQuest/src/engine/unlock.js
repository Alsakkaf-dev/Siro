// Pure unlock/derivation logic. Lock state is ALWAYS computed, never stored.

/** Has this mission's goal been met, given its progress entry? */
export function missionDone(mission, entry) {
  if (!entry) return false;
  if (mission.type === 'READ') {
    const totalPages = mission.target.pages
      ? mission.target.pages[1] - mission.target.pages[0] + 1
      : null;
    const pagesOk = !mission.goal.minPagesPct || !totalPages
      ? true
      : (entry.pagesViewed?.length ?? 0) >= Math.ceil(totalPages * mission.goal.minPagesPct);
    const timeOk = !mission.goal.minSeconds || (entry.secondsSpent ?? 0) >= mission.goal.minSeconds;
    return pagesOk && timeOk;
  }
  if (mission.type === 'PRACTICE') return entry.status === 'done';
  if (mission.type === 'GATE') return (entry.bestScorePct ?? 0) >= (mission.goal.passPct ?? 0.7);
  return entry.status === 'done';
}

/** Index of the first not-done mission in a city (missions unlock sequentially). */
export function cityCursor(city, progress) {
  for (let i = 0; i < city.missions.length; i++) {
    if (!missionDone(city.missions[i], progress.missions[city.missions[i].id])) return i;
  }
  return city.missions.length; // all done
}

export function cityDone(city, progress) {
  return cityCursor(city, progress) === city.missions.length;
}

export function cityStars(city, progress) {
  const gate = city.missions.find((m) => m.type === 'GATE');
  if (!gate) return cityDone(city, progress) ? 1 : 0;
  return progress.missions[gate.id]?.stars ?? 0;
}

export function cityUnlocked(city, country, progress) {
  const rule = city.unlock ?? { type: 'always' };
  if (rule.type === 'always') return true;
  if (rule.type === 'gatePassed') {
    const prev = country.cities.find((c) => c.id === rule.cityId);
    if (!prev) return true;
    const gate = prev.missions.find((m) => m.type === 'GATE');
    if (!gate) return cityDone(prev, progress);
    const entry = progress.missions[gate.id];
    return (entry?.bestScorePct ?? 0) >= (gate.goal.passPct ?? 0.7);
  }
  return false;
}

export function missionUnlocked(city, missionIndex, country, progress) {
  if (!cityUnlocked(city, country, progress)) return false;
  return missionIndex <= cityCursor(city, progress);
}

/** % complete for a country: done missions / total missions. */
export function countryPct(country, progress) {
  let total = 0;
  let done = 0;
  for (const city of country.cities) {
    for (const m of city.missions) {
      total++;
      if (missionDone(m, progress.missions[m.id])) done++;
    }
  }
  return total === 0 ? 0 : done / total;
}

/** Pages actually read across a country's READ missions (done missions count in full). */
export function subjectPagesRead(country, progress) {
  let pages = 0;
  for (const city of country.cities) {
    for (const m of city.missions) {
      if (m.type !== 'READ' || !m.target?.pages) continue;
      const [p0, p1] = m.target.pages;
      const entry = progress.missions[m.id];
      if (missionDone(m, entry)) pages += p1 - p0 + 1;
      else pages += (entry?.pagesViewed ?? []).filter((p) => p >= p0 && p <= p1).length;
    }
  }
  return pages;
}

/** The city the avatar currently stands on (first unlocked, not-done city). */
export function currentCity(country, progress) {
  for (const city of country.cities) {
    if (cityUnlocked(city, country, progress) && !cityDone(city, progress)) return city.id;
  }
  return null; // everything done
}
