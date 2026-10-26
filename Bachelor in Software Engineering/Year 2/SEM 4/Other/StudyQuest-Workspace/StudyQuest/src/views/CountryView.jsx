import React, { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore.js';
import {
  cityUnlocked, cityDone, cityStars, countryPct, currentCity,
} from '../engine/unlock.js';
import CandyPath from '../components/map/CandyPath.jsx';
import MapDefs from '../components/map/MapDefs.jsx';
import { CloudLayer, BirdFlock, WindStreaks } from '../components/map/Ambient.jsx';
import { serpentinePoints, scatterDecorations } from '../components/map/geometry.js';
import { Deco } from '../components/map/Decorations.jsx';
import { AvatarPin, LockIcon, SkullIcon, StarRow, NodeBevel } from '../components/map/nodes.jsx';
import CountdownBadge from '../components/hud/CountdownBadge.jsx';

const W = 1000;

/** "2026-06-17" → "Jun 17" (local, no TZ surprises). */
function fmtDue(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CountryView() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const world = useGameStore((s) => s.world);
  const country = useGameStore((s) => s.countries[subjectId]);
  const progress = useGameStore((s) => s.progress);
  const plan = useGameStore((s) => s.plan);
  const timeToday = useGameStore((s) => s.timeToday);

  const subject = world.subjects.find((s) => s.id === subjectId);

  const n = country?.cities.length ?? 0;
  const H = Math.max(620, n * 185);
  const seed = subject?.island.blobId ?? 1;
  const pts = useMemo(() => serpentinePoints(n, W, H, { seed }), [n, H, seed]);
  const decos = useMemo(
    () => scatterDecorations(Math.min(26, n * 5), W, H, seed * 17, pts, 105),
    [n, H, seed, pts]
  );

  if (!subject) return <div className="view-pad"><h1 style={{ color: '#fff' }}>Unknown country 🤔</h1></div>;

  if (!country) {
    return (
      <div className="view-pad">
        <Link to="/" className="back-link">← World</Link>
        <div className="candy-card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>{subject.emoji} 🚧</div>
          <h2>{subject.name}</h2>
          <p className="muted">This country's adventure path is still being built.<br />
            You can already study its materials in the Library!</p>
          <Link className="candy-btn blue" to={`/browse?subject=${subject.resourceRoot}`} style={{ marginTop: 14 }}>
            📚 Open {subject.id} Library
          </Link>
        </div>
      </div>
    );
  }

  const pct = countryPct(country, progress);
  const curId = currentCity(country, progress);
  const minsToday = Math.round((timeToday[subjectId] ?? 0) / 60);

  return (
    <div className="map-stage view-pad" style={{ paddingTop: 8 }}>
      <Link to="/" className="back-link">← World</Link>

      <div className="country-head" style={{ borderTop: `6px solid ${subject.color}` }}>
        <span className="flag">{subject.emoji}</span>
        <div>
          <h1>{subject.name}</h1>
          <div className="muted">{subject.tagline}</div>
        </div>
        <div className="stats">
          <div className="stat-pill"><span className="v">{Math.round(pct * 100)}%</span><span className="k">complete</span></div>
          <div className="stat-pill"><span className="v">{minsToday}m</span><span className="k">today</span></div>
          <div className="stat-pill danger"><span className="v"><CountdownBadge examAt={subject.examAt} compact /></span><span className="k">to exam</span></div>
          {country.reference && (
            <Link
              className="candy-btn gold"
              title={country.reference.title}
              to={`/browse?subject=${subject.resourceRoot}&file=${encodeURIComponent(country.reference.path)}`}
            >
              {country.reference.label}
            </Link>
          )}
          <Link className="candy-btn blue" to={`/browse?subject=${subject.resourceRoot}`}>📚 Library</Link>
        </div>
      </div>

      <div className="map-svg-wrap">
        <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 1000 }}>
          <MapDefs />

          {/* extruded land panel (3D edge + textured grass) */}
          <rect x="14" y="28" width={W - 28} height={H - 28} rx="60" fill="#4f9433" />
          <rect x="14" y="14" width={W - 28} height={H - 28} rx="60"
            fill="url(#grassTop)" stroke="#5cb53a" strokeWidth="5" />
          <rect x="14" y="14" width={W - 28} height={H - 28} rx="60" fill="url(#grassDots)" />
          <rect x="34" y="34" width={W - 68} height={H - 68} rx="46" fill="rgba(255,255,230,.18)" />

          {decos.map((d) => <Deco key={d.i} x={d.x} y={d.y} kind={d.kind === 5 ? 1 : d.kind} scale={1 + (d.i % 3) * 0.25} />)}

          <CandyPath points={pts} color={subject.color} width={34} />

          {country.cities.map((city, i) => {
            const p = pts[i];
            const unlocked = cityUnlocked(city, country, progress);
            const done = cityDone(city, progress);
            const stars = cityStars(city, progress);
            const isCurrent = curId === city.id;
            const fill = done ? '#ffd23f' : unlocked ? subject.color : '#9aa0b5';
            const due = !done ? plan?.subjects?.[subjectId]?.cityDue?.[city.id] : null;

            return (
              <g
                key={city.id}
                className={`city-node ${unlocked ? '' : 'locked'}`}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => unlocked && navigate(`/${subjectId}/${city.id}`)}
              >
                {isCurrent && <circle r="52" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="10 8" opacity=".9" />}
                <ellipse cx="0" cy="40" rx="40" ry="11" fill="rgba(43,35,80,.30)" />
                <circle r="40" cy="5" fill="rgba(43,35,80,.45)" />
                <circle r="40" fill={fill} stroke="#fff" strokeWidth="5" />
                <NodeBevel r={40} />
                {unlocked ? (
                  <text className="node-label" y="9" fontSize="26">{i + 1}</text>
                ) : i - country.cities.findIndex((c) => c.id === curId) > 1 ? (
                  <SkullIcon x={0} y={0} scale={1.6} />
                ) : (
                  <LockIcon x={0} y={-2} scale={1.5} />
                )}
                <StarRow x={0} y={-52} stars={stars} />
                <g transform="translate(0, 66)">
                  <rect className="node-title-bg" x={-95} y={-15} width="190" height="30" rx="15" />
                  <text className="node-title" y="6" fontSize="15">{city.name}</text>
                </g>
                {due && (
                  <text
                    className="city-due" y="98" fontSize="13.5"
                    stroke="rgba(43,35,80,.6)" strokeWidth="3.5" paintOrder="stroke"
                  >⏳ by {fmtDue(due)}</text>
                )}
                {isCurrent && <AvatarPin x={30} y={-32} scale={0.95} />}
              </g>
            );
          })}

          {/* finish flag at last city */}
          {pts.length > 0 && (
            <g transform={`translate(${pts[pts.length - 1].x - 70},${pts[pts.length - 1].y - 60})`}>
              <rect x="-2" y="-36" width="5" height="48" rx="2" fill="#7c5c38" />
              <path d="M 3 -36 L 36 -28 L 3 -19 Z" fill="#ff5e7e" stroke="#c43a5d" strokeWidth="2" />
            </g>
          )}

          {/* ambient sky over the land */}
          <CloudLayer count={3} seed={seed * 5 + 2} yBand={[60, H - 160]} shadowDrop={95} durBase={80} />
          <BirdFlock seed={seed * 9 + 1} y={Math.min(170, H * 0.18)} dur={50} size={3} />
          <WindStreaks count={3} seed={seed * 7} width={W} height={H} />
        </svg>
      </div>
    </div>
  );
}
