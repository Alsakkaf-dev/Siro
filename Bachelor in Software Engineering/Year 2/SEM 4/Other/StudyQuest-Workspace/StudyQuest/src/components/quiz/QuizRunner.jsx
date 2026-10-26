import React, { useEffect, useMemo, useRef, useState } from 'react';
import { checkAnswer, drawQuestions, scoreGate, starsFor } from '../../engine/grading.js';
import { useSessionStore } from '../../store/useSessionStore.js';
import QuestionCard from './QuestionCard.jsx';
import ExplainPanel from './ExplainPanel.jsx';

/**
 * Two modes:
 * - practice: every question in bank order; wrong answer freezes the runner,
 *   shows the worked explanation, requires acknowledge + re-answer until correct.
 *   onFinish({ mode:'practice' }) after the last question is answered correctly.
 * - gate: draws goal.draw questions (shuffled); no feedback until submit;
 *   onFinish({ mode:'gate', pct, stars, passed, review }) after submit.
 */
export default function QuizRunner({ bank, mode, goal = {}, subjectId, missionId, onFinish }) {
  const questions = useMemo(
    () =>
      mode === 'gate'
        ? drawQuestions(bank, goal.draw ?? 10, goal.shuffle !== false)
        : bank.questions,
    [bank, mode, goal.draw, goal.shuffle]
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});      // idx -> given answer
  const [phase, setPhase] = useState('answering'); // answering | wrong | correct | result
  const [result, setResult] = useState(null);
  const [wrongCounts, setWrongCounts] = useState({});
  const log = useSessionStore((s) => s.log);
  const begin = useSessionStore((s) => s.begin);
  const end = useSessionStore((s) => s.end);
  const finishedRef = useRef(false);

  useEffect(() => {
    begin(subjectId, `quiz:${missionId}`);
    return () => end();
  }, [subjectId, missionId, begin, end]);

  const q = questions[idx];
  const given = answers[idx];
  const setGiven = (v) => setAnswers((a) => ({ ...a, [idx]: v }));
  const answered = given !== undefined && given !== '' && given !== null;

  // ---------- PRACTICE ----------
  const submitPractice = () => {
    const { correct } = checkAnswer(q, given);
    log({ type: 'answer', subjectId, missionId, qid: q.id ?? idx, mode, correct });
    if (correct) {
      setPhase('correct');
    } else {
      setWrongCounts((w) => ({ ...w, [idx]: (w[idx] ?? 0) + 1 }));
      setPhase('wrong');
    }
  };

  const nextPractice = () => {
    if (idx + 1 >= questions.length) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish?.({ mode: 'practice', wrongCounts });
      }
      return;
    }
    setIdx(idx + 1);
    setPhase('answering');
  };

  const retryPractice = () => {
    setAnswers((a) => {
      const c = { ...a };
      delete c[idx];
      return c;
    });
    setPhase('answering');
  };

  // ---------- GATE ----------
  const submitGate = () => {
    const ansArr = questions.map((_, i) => answers[i]);
    const score = scoreGate(questions, ansArr);
    const stars = starsFor(score.pct, goal.stars);
    const passed = score.pct >= (goal.passPct ?? 0.7);
    log({ type: 'gate_result', subjectId, missionId, pct: score.pct, stars, passed });
    const res = { mode: 'gate', pct: score.pct, stars, passed, score, questions, answers: ansArr };
    setResult(res);
    setPhase('result');
    onFinish?.(res);
  };

  // ---------- RENDER ----------
  if (phase === 'result' && result) {
    return <GateResult result={result} goal={goal} />;
  }

  const allAnswered = questions.every((_, i) => {
    const a = answers[i];
    return a !== undefined && a !== '' && a !== null;
  });

  return (
    <div className="quiz-wrap">
      <div className="quiz-progress">
        {questions.map((_, i) => {
          let cls = 'seg';
          if (mode === 'practice') {
            if (i < idx) cls += ' done';
            else if (i === idx) cls += phase === 'wrong' ? ' wrong' : ' current';
          } else {
            const a = answers[i];
            if (i === idx) cls += ' current';
            else if (a !== undefined && a !== '' && a !== null) cls += ' done';
          }
          return (
            <div
              key={i}
              className={cls}
              style={mode === 'gate' ? { cursor: 'pointer' } : undefined}
              onClick={mode === 'gate' ? () => setIdx(i) : undefined}
            />
          );
        })}
      </div>

      <div className="muted" style={{ marginBottom: 8, fontWeight: 700, fontSize: '.85rem' }}>
        {mode === 'practice' ? '⚔️ Practice' : '🏰 Gate exam'} — Question {idx + 1} / {questions.length}
        {mode === 'gate' && goal.passPct ? ` · pass ≥ ${Math.round(goal.passPct * 100)}%` : ''}
      </div>

      <QuestionCard
        q={q}
        value={given}
        onChange={phase === 'answering' ? setGiven : () => {}}
        revealed={mode === 'practice' && phase !== 'answering' ? { correct: phase === 'correct' } : null}
        disabled={phase !== 'answering'}
      />

      {mode === 'practice' && phase === 'wrong' && (
        <ExplainPanel q={q} correct={false} onAcknowledge={retryPractice} />
      )}
      {mode === 'practice' && phase === 'correct' && (
        <ExplainPanel q={q} correct onAcknowledge={nextPractice} />
      )}

      <div className="quiz-actions">
        {mode === 'practice' && phase === 'answering' && (
          <button className="candy-btn" disabled={!answered} onClick={submitPractice}>
            Check ✔
          </button>
        )}
        {mode === 'gate' && (
          <>
            <button className="candy-btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              ← Back
            </button>
            {idx + 1 < questions.length ? (
              <button className="candy-btn blue" disabled={!answered} onClick={() => setIdx(idx + 1)}>
                Next →
              </button>
            ) : (
              <button className="candy-btn gold" disabled={!allAnswered} onClick={submitGate}>
                🏰 Submit gate exam
              </button>
            )}
            <span className="muted" style={{ fontSize: '.8rem' }}>
              {questions.filter((_, i) => answers[i] !== undefined && answers[i] !== '' && answers[i] !== null).length}
              /{questions.length} answered
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function GateResult({ result, goal }) {
  const [showReview, setShowReview] = useState(false);
  const pctRound = Math.round(result.pct * 100);
  return (
    <div className="quiz-wrap">
      <div className={`gate-result ${result.passed ? 'pass' : 'fail'}`}>
        <div style={{ fontSize: '3rem' }}>{result.passed ? '🎉' : '💀'}</div>
        <div className="big-pct">{pctRound}%</div>
        <div className="stars-row">
          {[1, 2, 3].map((s) => (
            <span key={s} style={{ opacity: result.stars >= s ? 1 : 0.22 }}>⭐</span>
          ))}
        </div>
        <h2>{result.passed ? 'Gate passed — the road continues!' : `Gate holds — you need ≥ ${Math.round((goal.passPct ?? 0.7) * 100)}%`}</h2>
        <p className="muted">
          {result.score.earned}/{result.score.total} marks
        </p>
        <div className="quiz-actions" style={{ justifyContent: 'center' }}>
          <button className="candy-btn blue" onClick={() => setShowReview(!showReview)}>
            {showReview ? 'Hide review' : '🔍 Review answers'}
          </button>
        </div>
      </div>

      {showReview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
          {result.questions.map((q, i) => (
            <div key={i}>
              <QuestionCard
                q={q}
                value={result.answers[i]}
                onChange={() => {}}
                revealed={{ correct: result.score.perQuestion[i].correct }}
                disabled
              />
              <ExplainPanel q={q} correct={result.score.perQuestion[i].correct} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
