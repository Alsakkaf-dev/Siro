import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import QuizRunner from '../../components/quiz/QuizRunner.jsx';

export default function GateMission({ subject, mission }) {
  const [bank, setBank] = useState(null);
  const [error, setError] = useState(null);
  const [attemptKey, setAttemptKey] = useState(0); // remount QuizRunner to redraw questions
  const [finished, setFinished] = useState(false);
  const loadBank = useGameStore((s) => s.loadBank);
  const entry = useGameStore((s) => s.progress.missions[mission.id]);
  const updateMission = useGameStore((s) => s.updateMission);
  const addXp = useGameStore((s) => s.addXp);
  const showToast = useGameStore((s) => s.showToast);

  useEffect(() => {
    loadBank(mission.bank).then(setBank).catch(setError);
  }, [mission.bank, loadBank]);

  const onFinish = (res) => {
    setFinished(true);
    const wasDone = entry?.status === 'done';
    const best = Math.max(entry?.bestScorePct ?? 0, res.pct);
    const stars = Math.max(entry?.stars ?? 0, res.stars);
    const attempts = [...(entry?.attempts ?? []), { pct: res.pct, stars: res.stars, at: new Date().toISOString() }];
    updateMission(mission.id, {
      bestScorePct: best,
      stars,
      attempts,
      status: res.passed || wasDone ? 'done' : 'active',
    });
    if (res.passed && !wasDone) {
      if (mission.xp) addXp(mission.xp, `— GATE passed! Next city unlocked 🎉`);
      else showToast('🏰 Gate passed — next city unlocked!', 'success');
    } else if (!res.passed) {
      showToast(`Gate held you back — best ${Math.round(best * 100)}%. Train and retry!`, 'error');
    }
  };

  if (error) return <div className="viewer-empty"><div><div className="big">😵</div><p>Could not load the gate bank.<br /><code>{mission.bank}</code></p></div></div>;
  if (!bank) return <div className="viewer-empty"><div className="big">⏳</div></div>;

  return (
    <div style={{ overflow: 'auto', flex: 1, background: '#f6f4ff', paddingTop: 8 }}>
      {entry?.attempts?.length > 0 && !finished && (
        <div className="quiz-wrap" style={{ paddingBottom: 0 }}>
          <div className="goal-chips">
            <span className="goal-chip">🎯 Best: {Math.round((entry.bestScorePct ?? 0) * 100)}%</span>
            <span className="goal-chip">🔁 Attempts: {entry.attempts.length}</span>
            {entry.status === 'done' && <span className="goal-chip met">✅ Passed</span>}
          </div>
        </div>
      )}
      <QuizRunner
        key={attemptKey}
        bank={bank}
        mode="gate"
        goal={mission.goal}
        subjectId={subject.id}
        missionId={mission.id}
        onFinish={onFinish}
      />
      {finished && (
        <div className="quiz-wrap" style={{ paddingTop: 0, textAlign: 'center' }}>
          <button
            className="candy-btn"
            onClick={() => {
              setFinished(false);
              setAttemptKey((k) => k + 1);
            }}
          >
            🔁 New attempt (fresh questions)
          </button>
        </div>
      )}
    </div>
  );
}
