import React from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore.js';
import { missionDone, missionUnlocked, cityCursor } from '../engine/unlock.js';
import CandyPath from '../components/map/CandyPath.jsx';
import MapDefs from '../components/map/MapDefs.jsx';
import { CloudLayer, BirdFlock } from '../components/map/Ambient.jsx';
import { serpentinePoints, scatterDecorations } from '../components/map/geometry.js';
import { Deco } from '../components/map/Decorations.jsx';
import { AvatarPin, LockIcon, missionIcon, NodeBevel } from '../components/map/nodes.jsx';
import MissionPlayer from './missions/MissionPlayer.jsx';

const W = 1000;

export default function CityView() {
  const { subjectId, cityId } = useParams();
  const navigate = useNavigate();
  const world = useGameStore((s) => s.world);
  const country = useGameStore((s) => s.countries[subjectId]);
  const progress = useGameStore((s) => s.progress);

  const subject = world.subjects.find((s) => s.id === subjectId);
  const city = country?.cities.find((c) => c.id === cityId);

  if (!subject || !city) {
    return (
      <div className="view-pad">
        <Link to={`/${subjectId}`} className="back-link">← Back</Link>
        <h1 style={{ color: '#fff' }}>City not found 🤔</h1>
      </div>
    );
  }

  const n = city.missions.length;
  const H = Math.max(520, n * 165);
  const pts = serpentinePoints(n, W, H, { seed: city.id.length * 7 + n, amplitude: 0.27 });
  const decos = scatterDecorations(Math.min(20, n * 4), W, H, city.id.length * 31, pts, 100);
  const cursor = cityCursor(city, progress);

  return (
    <div className="map-stage view-pad" style={{ paddingTop: 8 }}>
      <Link to={`/${subjectId}`} className="back-link">← {subject.name}</Link>

      <div className="country-head" style={{ borderTop: `6px solid ${subject.color}` }}>
        <span className="flag">🏙️</span>
        <div>
          <h1>{city.name}</h1>
          <div className="muted">{city.desc ?? `${n} missions to clear the gate`}</div>
        </div>
        <div className="stats">
          <div className="stat-pill">
            <span className="v">{Math.min(cursor, n)}/{n}</span>
            <span className="k">missions</span>
          </div>
          {country.reference && (
            <Link
              className="candy-btn gold"
              title={country.reference.title}
              to={`/browse?subject=${subject.resourceRoot}&file=${encodeURIComponent(country.reference.path)}`}
            >
              {country.reference.label}
            </Link>
          )}
        </div>
      </div>

      <div className="map-svg-wrap">
        <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 950 }}>
          <MapDefs />

          {/* extruded land panel */}
          <rect x="14" y="28" width={W - 28} height={H - 28} rx="60" fill="#4f9433" />
          <rect x="14" y="14" width={W - 28} height={H - 28} rx="60" fill="url(#grassTop)" stroke="#5cb53a" strokeWidth="5" />
          <rect x="14" y="14" width={W - 28} height={H - 28} rx="60" fill="url(#grassDots)" />
          <rect x="34" y="34" width={W - 68} height={H - 68} rx="46" fill="rgba(255,255,230,.18)" />
          {decos.map((d) => <Deco key={d.i} x={d.x} y={d.y} kind={d.kind === 5 ? 2 : d.kind} />)}

          <CandyPath points={pts} color={subject.color} width={28} />

          {city.missions.map((m, i) => {
            const p = pts[i];
            const unlocked = missionUnlocked(city, i, country, progress);
            const done = missionDone(m, progress.missions[m.id]);
            const isCurrent = i === cursor;
            const isGate = m.type === 'GATE';
            const r = isGate ? 42 : 32;
            const fill = done ? '#ffd23f' : unlocked ? (isGate ? '#b46bff' : subject.color) : '#9aa0b5';

            return (
              <g
                key={m.id}
                className={`station-node ${unlocked ? '' : 'locked'}`}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => unlocked && navigate(`m/${m.id}`)}
              >
                {isCurrent && <circle r={r + 11} fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="8 7" opacity=".9" />}
                <ellipse cx="0" cy={r} rx={r} ry="9" fill="rgba(43,35,80,.30)" />
                <circle r={r} cy="5" fill="rgba(43,35,80,.45)" />
                <circle r={r} fill={fill} stroke="#fff" strokeWidth="4.5" />
                <NodeBevel r={r} />
                {unlocked ? (
                  <text y={r * 0.3} textAnchor="middle" fontSize={r * 0.85}>{done ? '✅' : missionIcon(m.type)}</text>
                ) : (
                  <LockIcon x={0} y={-2} scale={1.2} />
                )}
                <g transform={`translate(0, ${r + 24})`}>
                  <rect className="node-title-bg" x={-105} y={-14} width="210" height="28" rx="14" />
                  <text className="node-title" y="5" fontSize="13.5">
                    {missionIcon(m.type)} {m.title}
                  </text>
                </g>
                {m.xp ? (
                  <g transform={`translate(${r - 4}, ${-r + 4})`}>
                    <rect x="-6" y="-11" width="46" height="21" rx="10" fill="#2b2350" />
                    <text x="17" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffd23f">+{m.xp}</text>
                  </g>
                ) : null}
                {isCurrent && <AvatarPin x={r * 0.8} y={-r * 0.75} scale={0.8} />}
              </g>
            );
          })}

          {/* ambient sky */}
          <CloudLayer count={2} seed={n * 3 + 4} yBand={[60, H - 180]} shadowDrop={90} durBase={85} />
          <BirdFlock seed={n * 5 + 2} y={Math.min(150, H * 0.2)} dur={55} size={3} />
        </svg>
      </div>

      <Routes>
        <Route path="m/:missionId" element={<MissionPlayer subject={subject} country={country} city={city} />} />
      </Routes>
    </div>
  );
}
