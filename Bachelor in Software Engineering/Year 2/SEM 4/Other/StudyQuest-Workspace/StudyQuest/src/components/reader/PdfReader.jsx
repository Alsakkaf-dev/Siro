import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { api } from '../../api/client.js';
import { useSessionStore } from '../../store/useSessionStore.js';
import { useGameStore } from '../../store/useGameStore.js';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const DWELL_MS = 3000; // a page counts as "viewed" after 3s in view

/**
 * Continuous-scroll PDF reader (scroll like any normal PDF app).
 * - All pages stack vertically; mouse wheel / touch scrolls through them.
 * - The toolbar page number follows the scroll position automatically.
 * - Pages are mounted lazily (only near the viewport) so 100+ page decks stay fast.
 * - Honest telemetry: heartbeats per subject + dwell-based page_view events.
 */
export default function PdfReader({ subjectId, relPath, pageRange = null, onPageViewed, headerExtra }) {
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(pageRange ? pageRange[0] : 1);
  const [width, setWidth] = useState(900);
  const [ratio, setRatio] = useState(0.75); // placeholder height ratio until a real page loads
  const [mounted, setMounted] = useState(() => new Set());
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const columnRef = useRef(null);
  const pageEls = useRef(new Map());
  const ratios = useRef(new Map());
  const dwellTimer = useRef(null);

  const begin = useSessionStore((s) => s.begin);
  const end = useSessionStore((s) => s.end);
  const log = useSessionStore((s) => s.log);
  const secondsThisSession = useSessionStore((s) => s.secondsThisSession);
  const trackReading = useGameStore((s) => s.trackReading);

  const minPage = pageRange ? pageRange[0] : 1;
  const maxPage = pageRange && numPages ? Math.min(pageRange[1], numPages) : numPages ?? 1;

  const pageList = useMemo(() => {
    if (!numPages) return [];
    const arr = [];
    for (let p = minPage; p <= maxPage; p++) arr.push(p);
    return arr;
  }, [numPages, minPage, maxPage]);

  // ---- session lifecycle ----
  useEffect(() => {
    begin(subjectId, `pdf:${relPath}`);
    log({ type: 'file_open', subjectId, path: relPath });
    return () => end();
  }, [subjectId, relPath, begin, end, log]);

  // Mirror heartbeat seconds into the per-file reading tracker
  const lastBeatRef = useRef(0);
  useEffect(() => {
    if (secondsThisSession > lastBeatRef.current) {
      trackReading(relPath, { seconds: secondsThisSession - lastBeatRef.current });
      lastBeatRef.current = secondsThisSession;
    }
  }, [secondsThisSession, relPath, trackReading]);

  // Dwell on the CURRENT page → page_view telemetry
  useEffect(() => {
    clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => {
      log({ type: 'page_view', subjectId, path: relPath, page });
      trackReading(relPath, { page });
      onPageViewed?.(page);
    }, DWELL_MS);
    return () => clearTimeout(dwellTimer.current);
  }, [page, relPath, subjectId, log, trackReading, onPageViewed]);

  // ---- fit width ----
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.min(el.clientWidth - 44, 1100)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- scroll engine: lazy mounting + current-page tracking ----
  useEffect(() => {
    if (!numPages) return;
    const root = canvasRef.current;
    if (!root) return;

    // Mount window: render real <Page> only near the viewport
    const mountObs = new IntersectionObserver(
      (entries) => {
        setMounted((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const num = Number(e.target.dataset.page);
            if (e.isIntersecting) next.add(num);
            else next.delete(num);
          }
          return next;
        });
      },
      { root, rootMargin: '1400px 0px' }
    );

    // Current page = the slot most visible in the viewport
    const curObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.current.set(Number(e.target.dataset.page), e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best = null;
        let bestR = 0;
        for (const [num, r] of ratios.current) {
          if (r > bestR) { bestR = r; best = num; }
        }
        if (best != null && bestR > 0) setPage(best);
      },
      { root, threshold: [0.05, 0.2, 0.4, 0.6, 0.8] }
    );

    for (const el of pageEls.current.values()) {
      mountObs.observe(el);
      curObs.observe(el);
    }
    return () => {
      mountObs.disconnect();
      curObs.disconnect();
      ratios.current.clear();
    };
  }, [numPages, minPage, maxPage]);

  // ---- navigation: buttons/jump/keys smooth-scroll to the page ----
  const scrollToPage = useCallback((target) => {
    const t = Math.max(minPage, Math.min(maxPage, target));
    const el = pageEls.current.get(t);
    const root = canvasRef.current;
    if (el && root) {
      root.scrollTo({ top: el.offsetTop - 14, behavior: 'smooth' });
      setPage(t);
    }
  }, [minPage, maxPage]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') scrollToPage(page + 1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') scrollToPage(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, scrollToPage]);

  const setPageEl = (num) => (el) => {
    if (el) pageEls.current.set(num, el);
    else pageEls.current.delete(num);
  };

  const mins = Math.floor(secondsThisSession / 60);
  const secs = secondsThisSession % 60;
  const slotH = Math.max(120, Math.round(width * ratio));

  return (
    <div className="reader-shell">
      <div className="reader-toolbar">
        <span className="file-name" title={relPath}>📄 {relPath.split('/').pop()}</span>
        {headerExtra ?? (
          <span className="session-chip" title={`Live study timer — counts only while this tab is visible and you are active. Credited to ${subjectId}.`}>
            <span className="rec-dot" /> {mins}:{String(secs).padStart(2, '0')} · {subjectId}
          </span>
        )}
        <span className="spacer" />
        <button onClick={() => scrollToPage(page - 1)} disabled={page <= minPage}>◀ Prev</button>
        <span className="page-info">
          <input
            className="page-jump"
            type="number"
            value={page}
            min={minPage}
            max={maxPage}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) scrollToPage(v);
            }}
          />{' '}
          / {maxPage}
        </span>
        <button onClick={() => scrollToPage(page + 1)} disabled={page >= maxPage}>Next ▶</button>
      </div>

      <div className="reader-canvas" ref={canvasRef}>
        {error ? (
          <div className="viewer-empty">
            <div>
              <div className="big">😵</div>
              <p>Could not render this file.</p>
              <a className="candy-btn blue" href={api.fileUrl(relPath)} target="_blank" rel="noreferrer">
                Open / download raw file
              </a>
            </div>
          </div>
        ) : (
          <Document
            file={api.fileUrl(relPath)}
            onLoadSuccess={(doc) => setNumPages(doc.numPages)}
            onLoadError={(e) => setError(e)}
            loading={<div className="viewer-empty"><div className="big">⏳</div></div>}
          >
            <div className="pdf-scroll-column" ref={columnRef} style={{ width }}>
              {pageList.map((num) => (
                <div
                  key={num}
                  ref={setPageEl(num)}
                  data-page={num}
                  className="pdf-page-slot"
                  style={{ minHeight: slotH }}
                >
                  {mounted.has(num) ? (
                    <Page
                      pageNumber={num}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={(p) => {
                        const w = p.originalWidth ?? p.width;
                        const h = p.originalHeight ?? p.height;
                        if (w && h) setRatio(h / w);
                      }}
                      loading={<div className="pdf-page-ghost" style={{ width, height: slotH }} />}
                    />
                  ) : (
                    <div className="pdf-page-ghost" style={{ width, height: slotH }}>
                      <span>{num}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
