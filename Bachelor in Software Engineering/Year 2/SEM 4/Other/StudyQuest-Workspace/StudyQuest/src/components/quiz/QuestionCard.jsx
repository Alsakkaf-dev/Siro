import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const KEYS = 'ABCDEFGH';

function Md({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {children}
    </ReactMarkdown>
  );
}

/**
 * Renders one question of any type and collects the answer.
 * - q: question object
 * - value / onChange: current answer state
 * - revealed: if set, shows correct/wrong styling ({ correct: bool })
 * - disabled: lock inputs (after submit)
 */
export default function QuestionCard({ q, value, onChange, revealed, disabled }) {
  return (
    <div className="question-card">
      {q.source && <div className="q-source">📌 {q.source}</div>}
      <div className="q-prompt"><Md>{q.prompt}</Md></div>

      {q.type === 'mcq' && (
        <div className="mcq-options">
          {q.options.map((opt, i) => {
            let cls = 'mcq-option';
            if (value === i) cls += ' selected';
            if (revealed) {
              if (i === q.answer) cls += ' correct';
              else if (value === i) cls += ' wrong';
            }
            return (
              <button key={i} className={cls} disabled={disabled} onClick={() => onChange(i)}>
                <span className="opt-key">{KEYS[i]}</span>
                <span><Md>{opt}</Md></span>
              </button>
            );
          })}
        </div>
      )}

      {q.type === 'multi' && (
        <div className="mcq-options">
          {q.options.map((opt, i) => {
            const sel = Array.isArray(value) && value.includes(i);
            let cls = 'mcq-option';
            if (sel) cls += ' selected';
            if (revealed) {
              if (q.answer.includes(i)) cls += ' correct';
              else if (sel) cls += ' wrong';
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={disabled}
                onClick={() => {
                  const cur = Array.isArray(value) ? value : [];
                  onChange(sel ? cur.filter((x) => x !== i) : [...cur, i]);
                }}
              >
                <span className="opt-key">{sel ? '☑' : '☐'}</span>
                <span><Md>{opt}</Md></span>
              </button>
            );
          })}
          <div className="muted" style={{ fontSize: '.78rem' }}>Select ALL that apply.</div>
        </div>
      )}

      {q.type === 'numeric' && (
        <div className="numeric-input-row">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Your answer…"
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
          {q.unit && <span className="unit-tag">{q.unit}</span>}
        </div>
      )}

      {q.type === 'text' && (
        <div className="text-input-row">
          <input
            type="text"
            placeholder="Type your answer…"
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}

      {q.type === 'order' && <OrderInput q={q} value={value} onChange={onChange} disabled={disabled} />}
    </div>
  );
}

function OrderInput({ q, value, onChange, disabled }) {
  // value = array of item indices in user's chosen order; default = given order
  const order = Array.isArray(value) && value.length === q.items.length ? value : q.items.map((_, i) => i);
  const [, force] = useState(0);

  const move = (pos, dir) => {
    const next = [...order];
    const t = pos + dir;
    if (t < 0 || t >= next.length) return;
    [next[pos], next[t]] = [next[t], next[pos]];
    onChange(next);
    force((x) => x + 1);
  };

  return (
    <div className="order-list">
      <div className="muted" style={{ fontSize: '.78rem' }}>Arrange in the correct order (top = first):</div>
      {order.map((itemIdx, pos) => (
        <div key={itemIdx} className="order-item">
          <span className="order-num">{pos + 1}</span>
          <span>{q.items[itemIdx]}</span>
          <span className="order-btns">
            <button disabled={disabled || pos === 0} onClick={() => move(pos, -1)}>↑</button>
            <button disabled={disabled || pos === order.length - 1} onClick={() => move(pos, 1)}>↓</button>
          </span>
        </div>
      ))}
    </div>
  );
}
