import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import { api } from '../../api/client.js';
import { useSessionStore } from '../../store/useSessionStore.js';
import { useGameStore } from '../../store/useGameStore.js';

export default function MarkdownReader({ subjectId, relPath, showSession = true }) {
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);
  const begin = useSessionStore((s) => s.begin);
  const end = useSessionStore((s) => s.end);
  const log = useSessionStore((s) => s.log);
  const secondsThisSession = useSessionStore((s) => s.secondsThisSession);
  const trackReading = useGameStore((s) => s.trackReading);
  const lastBeatRef = useRef(0);

  useEffect(() => {
    setText(null);
    setError(null);
    lastBeatRef.current = 0;
    api.fileText(relPath).then(setText).catch(setError);
    begin(subjectId, `md:${relPath}`);
    log({ type: 'file_open', subjectId, path: relPath });
    return () => end();
  }, [relPath, subjectId, begin, end, log]);

  useEffect(() => {
    if (secondsThisSession > lastBeatRef.current) {
      trackReading(relPath, { seconds: secondsThisSession - lastBeatRef.current });
      lastBeatRef.current = secondsThisSession;
    }
  }, [secondsThisSession, relPath, trackReading]);

  const mins = Math.floor(secondsThisSession / 60);
  const secs = secondsThisSession % 60;

  if (error) {
    return <div className="viewer-empty"><div><div className="big">😵</div><p>Could not load file.</p></div></div>;
  }
  return (
    <div className="reader-shell">
      <div className="reader-toolbar">
        <span className="file-name" title={relPath}>📝 {relPath.split('/').pop()}</span>
        {showSession && (
          <span className="session-chip" title={`Live study timer — counts only while this tab is visible and you are active. Credited to ${subjectId}.`}>
            <span className="rec-dot" /> {mins}:{String(secs).padStart(2, '0')} · {subjectId}
          </span>
        )}
      </div>
      <div className="md-reader">
        {text === null ? '⏳ Loading…' : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
