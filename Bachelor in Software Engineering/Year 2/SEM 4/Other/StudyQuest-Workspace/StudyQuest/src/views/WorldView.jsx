import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore.js';
import { useClockStore } from '../store/useClockStore.js';
import { countryPct, subjectPagesRead } from '../engine/unlock.js';
import { examCountdown, activeWindow, isFreeWeek, journeyState, fmtTime12, fmtCountdown, dayPhase, nextWindow, dateKey, fmt12 } from '../engine/schedule.js';
import IslandBlob from '../components/map/IslandBlob.jsx';
import MapDefs from '../components/map/MapDefs.jsx';
import CountdownPlate from '../components/map/CountdownPlate.jsx';
import { ScholarReading, ScholarBoat, JourneyPlate } from '../components/map/Scholar.jsx';
import { CloudLayer, BirdFlock, WindStreaks, WaveField, Stars, StormOverlay } from '../components/map/Ambient.jsx';
import { Deco } from '../components/map/Decorations.jsx';
import { scatterDecorations } from '../components/map/geometry.js';

const W = 1500;
const H = 800;

/** Subject progress ring: beveled track, gradient-lit arc, quarter ticks. */
function ProgressArc({ pct, x, y, r = 34, color }) {
  const c = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x},${y})`} filter="url(#tinyShadow)">
      <circle r={r + 7} fill="rgba(16, 28, 64, 0.62)" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
      <circle r={r + 7} fill="url(#glassPanel)" />
      <circle r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="7" />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1="0" y1={-r - 3.5} x2="0" y2={-r + 3.5} stroke="rgba(255,255,255,.5)" strokeWidth="2" transform={`rotate(${a})`} />
      ))}
      <circle
        r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90)"
        style={{ transition: 'stroke-dasharray .6s' }}
      />
      <text className="progress-ring-text" fontSize="19" fill="#fff" y="1">{Math.round(pct * 100)}%</text>
    </g>
  );
}

function findSession(plan, subjectId, date, start) {
  return plan?.subjects?.[subjectId]?.sessions?.find((s) => s.date === date && s.start === start) ?? null;
}

function quotaParts(sess) {
  const parts = sess.items.map((it) =>
    it.type === 'READ'
      ? `${it.title} · p. ${it.fromPage}–${it.toPage} · ${it.pages} slides`
      : `${it.type === 'GATE' ? '🚧' : '⚔️'} ${it.title} · ${it.minutes}m`
  );
  if (sess.bufferMin > 0) parts.push(`☕ ${sess.bufferMin}m buffer`);
  return parts;
}

/** Today's calibrated quota (or the next session's) + the ⚖️ Re-balance button. */
function QuotaStrip({ plan, schedule, journey, now, onRebalance }) {
  if (!plan) return null;
  let label = null;
  let sess = null;
  if (journey.mode === 'studying') {
    sess = findSession(plan, journey.subjectId, dateKey(now), journey.window.start);
    label = `📖 This session · ${journey.subjectId}`;
  } else if (journey.mode === 'sailing' || journey.mode === 'anchored') {
    const next = nextWindow(schedule, now);
    if (next) {
      sess = findSession(plan, next.subject, dateKey(next.startsAt), next.start);
      label = `⏭ Next · ${next.subject} ${next.day} ${fmt12(next.start)}`;
    }
  }
  return (
    <div className="quota-strip">
      {sess ? (
        <>
          <span className="quota-label">{label}</span>
          {quotaParts(sess).map((t, i) => (
            <span key={i} className="quota-item">{t}</span>
          ))}
        </>
      ) : (
        <span className="quota-label">🗺️ No session quota right now</span>
      )}
      <button className="rebalance-btn" onClick={onRebalance} title="Recompute the plan from this moment">
        ⚖️ Re-balance
      </button>
    </div>
  );
}

/** Pulsing STUDY NOW beacon. */
function StudyBeacon({ color }) {
  return (
    <g>
      <circle r="14" fill="none" stroke={color} strokeWidth="3" className="anim-pulse-ring" />
      <circle r="14" fill="none" stroke={color} strokeWidth="2" className="anim-pulse-ring" style={{ animationDelay: '.9s' }} />
      <rect x="-82" y="-16" width="164" height="32" rx="16" fill={color} filter="url(#glowGold)" />
      <rect x="-82" y="-16" width="164" height="32" rx="16" fill="url(#glassPanel)" />
      <text textAnchor="middle" y="6" fontSize="15.5" fontWeight="800" fill="#2b2350" fontFamily="'Baloo 2', sans-serif">
        ⚡ STUDY NOW
      </text>
    </g>
  );
}

export default function WorldView() {
  const world = useGameStore((s) => s.world);
  const schedule = useGameStore((s) => s.schedule);
  const countries = useGameStore((s) => s.countries);
  const progress = useGameStore((s) => s.progress);
  const plan = useGameStore((s) => s.plan);
  const recalibrate = useGameStore((s) => s.recalibrate);
  const now = useClockStore((s) => s.now);
  const navigate = useNavigate();

  const islands = world.subjects.map((s) => ({ x: s.island.x * (W / 1600), y: s.island.y * (H / 900) }));
  const islandPos = Object.fromEntries(world.subjects.map((s, i) => [s.id, islands[i]]));
  const decos = scatterDecorations(18, W, H, 7, islands, 240);
  const act = activeWindow(schedule, now);
  const freeWeek = isFreeWeek(schedule, now);
  const deadline = examCountdown(world.syllabusDeadline, now);
  const phase = dayPhase(now);
  const journey = journeyState(schedule, world, now);

  // Boat position while sailing: a gentle arc between the two islands
  let boat = null;
  if (journey.mode === 'sailing') {
    const a = islandPos[journey.fromId];
    const b = islandPos[journey.toId];
    if (a && b) {
      const t = journey.progress;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      // perpendicular bow so the route swings around the islands
      const cx = mx - (dy / len) * 90;
      const cy = my + (dx / len) * 90;
      boat = {
        x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x,
        y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y,
        flip: dx < 0,
      };
    }
  } else if (journey.mode === 'anchored') {
    const p = islandPos[journey.subjectId];
    if (p) {
      // islands near the right edge anchor on their left so the boat stays on screen
      const onLeft = p.x > W - 320;
      boat = { x: p.x + (onLeft ? -215 : 215), y: p.y + 128, flip: !onLeft };
    }
  }

  const onIsland = ['studying', 'mockweek', 'done'].includes(journey.mode) ? journey.subjectId : null;
  // The ONE island in focus stays bright; every other island gets a storm.
  const focusId = journey.mode === 'sailing' ? journey.toId : journey.subjectId;

  // Exam countdowns only appear from the break/mock week (Jun 29) onward —
  // before that, the islands stay free of exam pressure.
  const [fy, fm, fd] = schedule.freeWeek.from.split('-').map(Number);
  const examTimersOn = now >= new Date(fy, fm - 1, fd);
  const plateFor = (j) => {
    if (j.mode === 'studying') return { l1: `📖 Studying ${j.subjectId} now!`, l2: `⏳ ${fmtCountdown(j.remainingMs)} left` };
    if (j.mode === 'sailing') return { l1: `⛵ Sailing to ${j.toId} — arrives ${fmtTime12(j.startsAt)}`, l2: `⏳ ${fmtCountdown(j.remainingMs)} left` };
    if (j.mode === 'anchored') return { l1: `⚓ Waiting at ${j.subjectId} — next ${fmtTime12(j.startsAt)}`, l2: `⏳ ${fmtCountdown(j.remainingMs)} left` };
    if (j.mode === 'mockweek') return { l1: `🏖️ Mock week — focus ${j.subjectId}`, l2: `🎯 exam in ${fmtCountdown(j.remainingMs)}` };
    return { l1: '🎉 All exams done — legend!', l2: null };
  };
  const plate = plateFor(journey);

  return (
    <div className="world-stage">
        <svg
          className={`map-svg world-scene world-fullbleed phase-${phase}`}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <MapDefs />

          {/* ---------- ocean base (full-bleed, no corners) ---------- */}
          <rect width={W} height={H} fill="url(#oceanDepth)" />
          <rect width={W} height={H} fill="url(#causticLines)" className="anim-caustics" />

          {/* sun & moon */}
          <g className="sun-group" transform="translate(1370, 96)">
            <circle r="125" fill="rgba(255, 228, 140, 0.12)" />
            <circle r="74" fill="rgba(255, 232, 143, 0.22)" />
            <g className="anim-sun">
              <circle r="44" fill="#ffe88f" />
              <circle r="44" fill="url(#nodeShine)" />
            </g>
          </g>
          <g className="moon-group" transform="translate(1370, 96)">
            <circle r="38" fill="#f2f4ff" />
            <circle cx="-14" cy="-8" r="9" fill="rgba(180,190,220,.5)" />
            <circle cx="10" cy="12" r="6" fill="rgba(180,190,220,.45)" />
            <circle cx="14" cy="-14" r="4.5" fill="rgba(180,190,220,.4)" />
          </g>
          <Stars count={28} width={W} height={300} />

          {/* parallax swells + scattered ripples — 5 bands fill the full-bleed canvas */}
          <WaveField
            width={W}
            bands={[
              { y: 170, amp: 8, cls: 'anim-wave-b', op: 0.07 },
              { y: 300, amp: 9, cls: 'anim-wave-a', op: 0.10 },
              { y: 470, amp: 12, cls: 'anim-wave-b', op: 0.08 },
              { y: 620, amp: 9, cls: 'anim-wave-c', op: 0.10 },
              { y: 745, amp: 11, cls: 'anim-wave-a', op: 0.12 },
            ]}
          />
          {decos.map((d) => (
            <Deco key={`w${d.i}`} x={d.x} y={d.y} kind={5} scale={0.9 + (d.i % 3) * 0.3} />
          ))}

          {/* cloud shadows live with their clouds (inside CloudLayer) */}

          {/* atmosphere depth + day/night tint — UNDER the islands, so the
              ONE focus island controls its own light and stays lit (law) */}
          <rect width={W} height={H} fill="url(#worldVignette)" pointerEvents="none" />
          <rect width={W} height={H} className="scene-tint" />

          {/* ---------- islands ---------- */}
          {world.subjects.map((s, idx) => {
            const x = s.island.x * (W / 1600);
            const y = s.island.y * (H / 900);
            const country = countries[s.id];
            const pct = country ? countryPct(country, progress) : 0;
            const isActiveNow = act?.subject === s.id;
            const stormy = focusId != null && focusId !== s.id;
            // Pace chip: actual pages read vs the plan's expected-by-today curve
            const sp = plan?.subjects?.[s.id];
            let chip = null;
            if (sp && country) {
              const k = dateKey(now);
              let exp = sp.donePages;
              for (const e of sp.expected) {
                if (e.date <= k) exp = e.pages;
                else break;
              }
              const behind = exp - subjectPagesRead(country, progress);
              chip = behind > 0
                ? { ok: false, text: `↘ ${behind} slides behind` }
                : { ok: true, text: '✓ on plan' };
            }
            return (
              <g key={s.id} transform={`translate(${x},${y})`}>
                <g
                  className={`anim-float island-group ${isActiveNow ? 'island-active-glow' : ''} ${stormy ? 'island-stormy' : ''}`}
                  style={{ animationDelay: `${(idx * 1.7) % 7}s` }}
                  onClick={() => navigate(`/${s.id}`)}
                >
                  <g className={stormy ? 'island-stormy' : focusId === s.id ? 'island-lit' : ''}>
                    {focusId === s.id && (
                      <g className="anim-focus-breath">
                        <circle r="215" fill="url(#focusGlow)" />
                      </g>
                    )}
                    <IslandBlob blobId={s.island.blobId} color={s.color} r={135} />
                    <text x="0" y="-86" textAnchor="middle" fontSize="46">{s.emoji}</text>
                    <text x="0" y="-44" className="island-label" fontSize="31"
                      stroke="rgba(43,35,80,.55)" strokeWidth="5" paintOrder="stroke">{s.id}</text>
                    <text x="0" y="-18" className="island-sub" fontSize="14.5">{s.name}</text>
                    <ProgressArc pct={pct} x={examTimersOn ? -86 : 0} y={46} color={s.color} />
                    {chip && (
                      <text
                        x={examTimersOn ? -86 : 0} y={120} fontSize="15"
                        className={`pace-chip ${chip.ok ? 'ok' : 'behind'}`}
                        stroke="rgba(43,35,80,.6)" strokeWidth="4" paintOrder="stroke"
                      >{chip.text}</text>
                    )}
                    {examTimersOn && <CountdownPlate examAt={s.examAt} x={56} y={44} />}
                    {isActiveNow && (
                      <g transform="translate(0,-132)">
                        <StudyBeacon color={s.color} />
                      </g>
                    )}
                    {onIsland === s.id && (
                      <>
                        <ScholarReading x={96} y={-58} scale={0.95} />
                        <JourneyPlate
                          x={y < 300 ? 0 : 96}
                          y={y < 300 ? 158 : -168}
                          line1={plate.l1}
                          line2={plate.l2}
                        />
                      </>
                    )}
                  </g>
                  {stormy && <StormOverlay seed={s.island.blobId} />}
                </g>
              </g>
            );
          })}

          {/* ---------- sky traffic (front) ---------- */}
          <CloudLayer count={4} seed={3} yBand={[46, 150]} shadowDrop={430} />
          <BirdFlock seed={4} y={120} dur={42} size={4} />
          <BirdFlock seed={11} y={210} dur={58} delay={-25} size={3} />
          <WindStreaks count={4} seed={6} width={W} height={H} />

          {/* ---------- the Traveling Scholar at sea ---------- */}
          {boat && (
            <g>
              <ScholarBoat x={boat.x} y={boat.y} scale={0.92} flip={boat.flip} />
              <JourneyPlate x={boat.x} y={boat.y - 86} line1={plate.l1} line2={plate.l2} w1={300} />
            </g>
          )}

        </svg>

      <div className="world-overlay">
        <div className={`world-banner glassy ${freeWeek ? 'mock-week' : ''}`}>
          {freeWeek ? (
            <>
              <h1>🏖️ FREE MOCK WEEK</h1>
              <div className="muted">No fixed windows — one mock per day, patch weak spots. Exams start Jul 7!</div>
            </>
          ) : (
            <>
              <h1>🌍 Finals World</h1>
              <div className="muted">
                {deadline.past
                  ? 'Syllabus deadline passed — full mock mode!'
                  : <>100% syllabus due <strong>June 29</strong> — <strong>{deadline.days}d {deadline.hours}h</strong> left · {act ? <>study window <strong>{act.subject}</strong> is OPEN now</> : 'no window open right now'}</>}
              </div>
            </>
          )}
        </div>

        <QuotaStrip plan={plan} schedule={schedule} journey={journey} now={now} onRebalance={recalibrate} />
      </div>
    </div>
  );
}
