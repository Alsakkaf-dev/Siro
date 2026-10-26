import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { useSessionStore } from '../../store/useSessionStore.js';
import { missionDone } from '../../engine/unlock.js';
import PdfReader from '../../components/reader/PdfReader.jsx';
import MarkdownReader from '../../components/reader/MarkdownReader.jsx';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * The mission timer: a circular ring that fills with honest study time,
 * with a live countdown of the time LEFT. Replaces the old chip boxes.
 */
export function MissionTimer({ secondsSpent, needSecs, isDone }) {
  if (isDone) {
    return (
      <span className="goal-chips">
        <span className="mchip done-chip">🏆 Mission complete — read on freely!</span>
      </span>
    );
  }
  if (!needSecs) return null;

  const pct = Math.min(1, secondsSpent / needSecs);
  const met = pct >= 1;
  const remaining = Math.max(0, needSecs - secondsSpent);
  const r = 11;
  const c = 2 * Math.PI * r;

  return (
    <span
      className={`mtimer ${met ? 'met' : ''}`}
      title="Live study timer — counts only while this tab is visible and you are active. Fill the ring to complete the mission."
    >
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r={r} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="5" />
        <circle
          cx="15" cy="15" r={r} fill="none"
          stroke={met ? '#3ecf6e' : '#ffd23f'}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 15 15)"
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <span className="mtimer-text">
        {met ? (
          <b>✓ done!</b>
        ) : (
          <>
            <b>{fmt(remaining)}</b>
            <small>left of {fmt(needSecs)}</small>
          </>
        )}
      </span>
    </span>
  );
}

export default function ReadMission({ subject, mission }) {
  const entry = useGameStore((s) => s.progress.missions[mission.id]);
  const updateMission = useGameStore((s) => s.updateMission);
  const addXp = useGameStore((s) => s.addXp);
  const showToast = useGameStore((s) => s.showToast);
  const secondsThisSession = useSessionStore((s) => s.secondsThisSession);
  const lastBeatRef = useRef(0);

  const pages = mission.target.pages ?? null;
  const pagesViewed = entry?.pagesViewed ?? [];
  const secondsSpent = entry?.secondsSpent ?? 0;
  const isDone = entry?.status === 'done';

  // Reset the per-mount heartbeat mirror when the mission changes.
  useEffect(() => {
    lastBeatRef.current = 0;
  }, [mission.id]);

  // Mirror honest session seconds into the mission entry (1s granularity).
  useEffect(() => {
    if (secondsThisSession > lastBeatRef.current) {
      const delta = secondsThisSession - lastBeatRef.current;
      lastBeatRef.current = secondsThisSession;
      updateMission(mission.id, { secondsSpent: (secondsSpent ?? 0) + delta, status: isDone ? 'done' : 'active' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsThisSession]);

  // Award completion once when the goal is met.
  useEffect(() => {
    if (!isDone && missionDone(mission, entry)) {
      updateMission(mission.id, { status: 'done' });
      if (mission.xp) addXp(mission.xp, `— ${mission.title} read!`);
      else showToast(`📖 ${mission.title} complete!`, 'success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, isDone]);

  // Pages are still logged silently (stats only — they no longer gate anything).
  const onPageViewed = (page) => {
    if (pages && (page < pages[0] || page > pages[1])) return;
    if (pagesViewed.includes(page)) return;
    updateMission(mission.id, { pagesViewed: [...pagesViewed, page], status: isDone ? 'done' : 'active' });
  };

  const needSecs = mission.goal?.minSeconds ?? 0;
  const timer = <MissionTimer secondsSpent={secondsSpent} needSecs={needSecs} isDone={isDone} />;

  if (mission.target.kind === 'md') {
    return (
      <>
        <div className="mission-goalbar">{timer}</div>
        <MarkdownReader subjectId={subject.id} relPath={mission.target.path} showSession={false} />
      </>
    );
  }

  return (
    <PdfReader
      subjectId={subject.id}
      relPath={mission.target.path}
      pageRange={pages}
      onPageViewed={onPageViewed}
      headerExtra={timer}
    />
  );
}
