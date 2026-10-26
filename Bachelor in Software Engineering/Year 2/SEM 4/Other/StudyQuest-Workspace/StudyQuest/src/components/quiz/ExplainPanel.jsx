import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function ExplainPanel({ q, correct, onAcknowledge }) {
  return (
    <div className={`explain-panel ${correct ? 'correct-explain' : ''}`}>
      <div className="explain-head">
        {correct ? '✅ Correct! Here’s the full picture:' : '🛑 Not quite — study this before moving on:'}
      </div>
      <div className="explain-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {q.explain || '_No explanation available._'}
        </ReactMarkdown>
        {onAcknowledge && (
          <div style={{ marginTop: 14 }}>
            <button className="candy-btn green" onClick={onAcknowledge}>
              {correct ? 'Next →' : '🧠 Got it — let me retry'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
