import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Icon } from '../lib/icons.js';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
  url: string;
  initialPage: number;
  onPage: (page: number, total: number) => void;
  registerSeek: (fn: (page: number) => void) => void;
  onBookmark: (page: number) => void;
}

type Size = { w: number; h: number };

function PdfPage({ doc, n, scale, size, root, onSize }: { doc: PDFDocumentProxy; n: number; scale: number; size: Size; root: HTMLElement | null; onSize: (n: number, s: Size) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || !root) return;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { root, rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const cv = canvas.current;
    const tx = text.current;
    if (!visible || !cv || !tx) {
      if (cv) {
        cv.width = 0;
        cv.height = 0;
      }
      if (tx) tx.replaceChildren();
      return;
    }
    let cancelled = false;
    let task: RenderTask | null = null;
    let textLayer: { cancel: () => void } | null = null;
    void (async () => {
      try {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const vp = page.getViewport({ scale });
        onSize(n, { w: page.getViewport({ scale: 1 }).width, h: page.getViewport({ scale: 1 }).height });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.floor(vp.width * dpr);
        cv.height = Math.floor(vp.height * dpr);
        cv.style.width = `${Math.floor(vp.width)}px`;
        cv.style.height = `${Math.floor(vp.height)}px`;
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        task = page.render({ canvas: cv, canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
        await task.promise;
        if (cancelled) return;
        tx.replaceChildren();
        tx.style.setProperty('--total-scale-factor', String(scale));
        const tl = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: tx, viewport: vp });
        textLayer = tl;
        await tl.render();
      } catch (e) {
        if ((e as { name?: string }).name !== 'RenderingCancelledException' && !cancelled) console.warn('pdf page', n, e);
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
      textLayer?.cancel();
    };
  }, [visible, doc, n, scale, onSize]);

  return (
    <div ref={box} className="pdf-page" data-page={n} style={{ inlineSize: size.w * scale, blockSize: size.h * scale }} aria-label={`صفحة ${n}`}>
      <canvas ref={canvas} />
      <div ref={text} className="pdf-text" />
    </div>
  );
}

export default function PdfViewer({ url, initialPage, onPage, registerSeek, onBookmark }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sizes, setSizes] = useState<Map<number, Size>>(new Map());
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(initialPage > 0 ? initialPage : 1);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    let alive = true;
    const task = pdfjs.getDocument({
      url,
      wasmUrl: '/pdfjs/wasm/',
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      iccUrl: '/pdfjs/iccs/',
    });
    task.promise.then(
      async (d) => {
        if (!alive) return;
        const p1 = await d.getPage(1);
        const v = p1.getViewport({ scale: 1 });
        setSizes(new Map([[1, { w: v.width, h: v.height }]]));
        setDoc(d);
        setLoading(false);
      },
      (e: Error) => {
        if (!alive) return;
        setErr(e.name === 'PasswordException' ? 'الملف محمي بكلمة مرور.' : e.name === 'InvalidPDFException' ? 'الملف ليس PDF سليمًا أو تالف.' : `تعذّر فتح الملف: ${e.message}`);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
      void task.destroy();
    };
  }, [url]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    setRoot(el);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [doc]);

  const total = doc?.numPages ?? 0;
  const first = sizes.get(1);
  const fitScale = first && width ? Math.max(0.3, Math.min(3, (width - 32) / first.w)) : 1;
  const scale = zoom === 'fit' ? fitScale : zoom;

  const onSize = useCallback((n: number, s: Size) => {
    setSizes((m) => {
      const cur = m.get(n);
      if (cur && Math.abs(cur.w - s.w) < 0.5 && Math.abs(cur.h - s.h) < 0.5) return m;
      const nm = new Map(m);
      nm.set(n, s);
      return nm;
    });
  }, []);

  const goto = useCallback((n: number, smooth = true): void => {
    const el = scroller.current;
    const target = el?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    if (!el || !target) return;
    el.scrollTo({ top: target.offsetTop - el.offsetTop - 12, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    registerSeek((n) => goto(Math.max(1, Math.min(total || 1, Math.round(n)))));
  }, [registerSeek, goto, total]);

  // استعادة آخر صفحة
  useEffect(() => {
    if (!doc || restored.current || !width) return;
    restored.current = true;
    if (initialPage > 1) requestAnimationFrame(() => goto(Math.min(initialPage, doc.numPages), false));
  }, [doc, width, initialPage, goto]);

  // تتبّع الصفحة الحالية
  useEffect(() => {
    const el = scroller.current;
    if (!el || !doc) return;
    let raf = 0;
    const calc = (): void => {
      raf = 0;
      const mid = el.scrollTop + el.clientHeight * 0.3;
      let cur = 1;
      for (const p of el.querySelectorAll<HTMLElement>('[data-page]')) {
        if (p.offsetTop - el.offsetTop <= mid) cur = Number(p.dataset['page']);
        else break;
      }
      setPage(cur);
    };
    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(calc);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [doc, scale]);

  useEffect(() => {
    if (total && restored.current) onPage(page, total);
  }, [page, total, onPage]);

  const onKey = (e: React.KeyboardEvent): void => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'PageDown' || e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); goto(Math.min(total, page + 1)); }
    if (e.key === 'PageUp' || e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); goto(Math.max(1, page - 1)); }
  };

  const step = (d: number): void => setZoom(Math.max(0.4, Math.min(4, Math.round((scale + d) * 10) / 10)));

  return (
    <div className="lib-stage" onKeyDown={onKey}>
      <div className="lib-bar" role="toolbar" aria-label="أدوات PDF" dir="rtl">
        <button className="btn sm" onClick={() => goto(Math.max(1, page - 1))} disabled={!doc || page <= 1} aria-label="الصفحة السابقة"><Icon name="right" size={16} /></button>
        <label className="row" style={{ gap: 6 }}>
          <span className="sr-only">رقم الصفحة</span>
          <input className="input num" style={{ inlineSize: 64, minHeight: 34, textAlign: 'center', padding: '2px 6px' }} inputMode="numeric" value={page} disabled={!doc}
            onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')); if (n >= 1 && n <= total) goto(n, false); }} />
          <span className="num muted">/ {total || '—'}</span>
        </label>
        <button className="btn sm" onClick={() => goto(Math.min(total, page + 1))} disabled={!doc || page >= total} aria-label="الصفحة التالية"><Icon name="left" size={16} /></button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => step(-0.2)} disabled={!doc} aria-label="تصغير">−</button>
        <span className="num muted" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button className="btn sm" onClick={() => step(0.2)} disabled={!doc} aria-label="تكبير">+</button>
        <button className="btn sm" onClick={() => setZoom('fit')} disabled={!doc} aria-pressed={zoom === 'fit'}>ملاءمة العرض</button>
        <button className="btn sm" onClick={() => onBookmark(page)} disabled={!doc}><Icon name="bookmark" size={15} /> علامة للصفحة</button>
      </div>
      {loading && <div className="pdf-ph" style={{ blockSize: 320 }} role="status">جارٍ تحميل الملف…</div>}
      {err && <div className="callout danger" role="alert" style={{ margin: 'var(--s-4)' }}>{err}</div>}
      {doc && first && (
        <div className="pdf-scroll" ref={scroller} tabIndex={0} aria-label="محتوى PDF">
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <PdfPage key={n} doc={doc} n={n} scale={scale} size={sizes.get(n) ?? first} root={root} onSize={onSize} />
          ))}
        </div>
      )}
    </div>
  );
}
