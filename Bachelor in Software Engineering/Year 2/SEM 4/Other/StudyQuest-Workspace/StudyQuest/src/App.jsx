import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useGameStore } from './store/useGameStore.js';
import { useClockStore } from './store/useClockStore.js';
import TopBar from './components/hud/TopBar.jsx';
import XpToast from './components/hud/XpToast.jsx';
import WorldView from './views/WorldView.jsx';
import CountryView from './views/CountryView.jsx';
import CityView from './views/CityView.jsx';
import ResourceBrowser from './components/browser/ResourceBrowser.jsx';

export default function App() {
  const loaded = useGameStore((s) => s.loaded);
  const boot = useGameStore((s) => s.boot);
  const startClock = useClockStore((s) => s.start);

  useEffect(() => {
    boot();
    startClock();
  }, [boot, startClock]);

  if (!loaded) {
    return (
      <div className="boot-screen">
        <div className="boot-card">
          <div className="boot-logo">🗺️</div>
          <h1>StudyQuest</h1>
          <p>Loading your world…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<WorldView />} />
          <Route path="/browse" element={<ResourceBrowser />} />
          <Route path="/:subjectId" element={<CountryView />} />
          <Route path="/:subjectId/:cityId/*" element={<CityView />} />
        </Routes>
      </main>
      <XpToast />
    </div>
  );
}
