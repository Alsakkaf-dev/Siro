import '../styles/glossary.css';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { life } from '../lib/api.js';
import type { ContentStatus } from '../../../shared/life.js';
import type { GlossaryDoc, GlossaryEntry } from '../../../shared/sports.js';

export interface GlossaryState { doc: GlossaryDoc | null; map: Map<string, GlossaryEntry>; status: ContentStatus | null; error: string | null; rootExists: boolean }
const EMPTY: GlossaryState = { doc: null, map: new Map(), status: null, error: null, rootExists: true };
let cache: GlossaryState | null = null;
let inflight: Promise<GlossaryState> | null = null;
const subs = new Set<(g: GlossaryState) => void>();

/** يحمّل القاموس مرة واحدة لكل جلسة (قراءة فقط من ملف راشد). عند الفشل يبقى فارغًا والمصطلحات تظهر كنص عادي. */
export function loadGlossary(force = false): Promise<GlossaryState> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = life
    .content<GlossaryDoc>('GLOSSARY_AR.json')
    .then((r) => ({ doc: r.data, map: new Map((r.data?.entries ?? []).map((e) => [e.id, e] as const)), status: r.status, error: r.status.error, rootExists: r.root_exists }))
    .catch((e: Error) => ({ ...EMPTY, error: e.message }))
    .then((g) => {
      cache = g;
      inflight = null;
      subs.forEach((f) => f(g));
      return g;
    });
  return inflight;
}

/** قراءة القاموس؛ لا تُطلق الطلب فورًا كي لا تؤثر على أول رسم (يُؤجَّل إلى وقت الخمول أو أول تفاعل). */
export function useGlossary(eager = false): GlossaryState | null {
  const [g, setG] = useState<GlossaryState | null>(cache);
  useEffect(() => {
    subs.add(setG);
    if (cache) setG(cache);
    else if (eager) void loadGlossary();
    else {
      const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      const t = ric ? ric(() => void loadGlossary(), { timeout: 3500 }) : window.setTimeout(() => void loadGlossary(), 1800);
      return () => {
        subs.delete(setG);
        if (!ric) window.clearTimeout(t);
      };
    }
    return () => {
      subs.delete(setG);
    };
  }, [eager]);
  return g;
}

/** مصطلح مع تعريف في سطر واحد عند التمرير أو التركيز أو اللمس. إن لم يوجد القاموس أو المصطلح يظهر النص كما هو. */
export function Term({ id, children, bare }: { id: string; children: ReactNode; bare?: boolean }) {
  const g = useGlossary();
  const e = g?.map.get(id);
  const [pos, setPos] = useState<{ top: number; left: number; w: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const uid = useId();
  const open = pos !== null;
  useEffect(() => {
    if (!open) return;
    const close = (): void => setPos(null);
    const k = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') close();
    };
    const d = (ev: MouseEvent): void => {
      if (!ref.current?.contains(ev.target as Node) && !(ev.target as HTMLElement).closest?.('.term-pop')) close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', k);
    document.addEventListener('mousedown', d);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', k);
      document.removeEventListener('mousedown', d);
    };
  }, [open]);
  const show = (): void => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    const below = r.bottom + 8;
    setPos({ top: below + 130 > window.innerHeight && r.top > 140 ? Math.max(8, r.top - 8 - 120) : below, left, w });
  };
  return (
    <>
      {/* الغلاف ثابت قبل تحميل القاموس وبعده كي لا يُعاد بناء النص (وإلا عُدّ عنصر LCP جديدًا وتأخّر قياس الأداء) */}
      <span
        ref={ref}
        className={e ? `term${bare ? ' bare' : ''}` : undefined}
        tabIndex={e && !bare ? 0 : undefined}
        role={e && !bare ? 'button' : undefined}
        aria-describedby={e && open ? uid : undefined}
        onMouseEnter={e ? show : undefined}
        onMouseLeave={e ? () => setPos(null) : undefined}
        onFocus={e ? show : undefined}
        onBlur={e ? () => setPos(null) : undefined}
        onClick={e ? show : undefined}
      >
        {children}
      </span>
      {open && e &&
        createPortal(
          <div className="term-pop" id={uid} role="tooltip" style={{ top: pos.top, left: pos.left, width: pos.w }}>
            <strong>{e.term_ar}</strong>
            {e.term_en && <span className="term-en" lang="en" dir="ltr">{e.term_en}</span>}
            <span>{e.definition_ar}</span>
            <Link to={`/life/glossary#${e.id}`} className="term-more" tabIndex={-1}>كل المصطلحات</Link>
          </div>,
          document.body,
        )}
    </>
  );
}
