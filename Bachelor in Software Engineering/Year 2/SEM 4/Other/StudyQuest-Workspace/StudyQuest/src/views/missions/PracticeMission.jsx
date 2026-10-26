import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import QuizRunner from '../../components/quiz/QuizRunner.jsx';

export default function PracticeMission({ subject, mission, onDone }) {
  const [bank, setBank] = useState(null);
  const [error, setError] = useState(null);
  const loadBank = useGameStore((s) => s.loadBank);
  const entry = useGameStore((s) => s.progress.missions[mission.id]);
  const updateMission = useGameStore((s) => s.updateMission);
  const addXp = useGameStore((s) => s.addXp);
  const isDone = entry?.status === 'done';

  useEffect(() => {
    loadBank(mission.bank).then(setBank).catch(setError);
  }, [mission.bank, loadBank]);

  const onFinish = () => {
    if (!isDone) {
      updateMission(mission.id, { status: 'done' });
      if (mission.xp) addXp(mission.xp, `— ${mission.title} cleared!`);
    }
    setTimeout(() => onDone?.(), 1200);
  };

  if (error) return <div className="viewer-empty"><div><div className="big">😵</div><p>Could not load the drill bank.<br /><code>{mission.bank}</code></p></div></div>;
  if (!bank) return <div className="viewer-empty"><div className="big">⏳</div></div>;

  return (
    <div style={{ overflow: 'auto', flex: 1, background: '#f6f4ff', paddingTop: 8 }}>
      {isDone && (
        <div className="quiz-wrap" style={{ paddingBottom: 0 }}>
          <div className="goal-chip met">✅ Already cleared — replaying for extra practice (no XP)</div>
        </div>
      )}
      <QuizRunner
        bank={bank}
        mode="practice"
        goal={mission.goal}
        subjectId={subject.id}
        missionId={mission.id}
        onFinish={onFinish}
      />
    </div>
  );
}
