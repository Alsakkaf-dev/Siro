import { useEffect, useRef } from 'react';
import type { KitchenScene, Pick, Quality, StationName } from './Scene3D.js';
import type { SimView } from './simClient.js';

/** حاوية لوحة الرسم: three.js يُحمَّل هنا فقط (PERF-02) فلا يدفع ثمنه أحد خارج /kitchen/cook */
export default function Stage3D({ quality, onQuality, onPick, station, view, stock, onReady, onFps }: { quality: Quality; onQuality: (q: Quality, why: string) => void; onPick: (p: Pick) => void; station: StationName; view: SimView | null; stock: Record<string, number>; onReady: (s: KitchenScene) => void; onFps: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<KitchenScene | null>(null);
  const cb = useRef({ onPick, onQuality, onReady, onFps });
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cb.current = { onPick, onQuality, onReady, onFps };
  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    void import('./Scene3D.js').then(({ KitchenScene: K }) => {
      if (dead || !ref.current) return;
      const reduced = reducedMotion;
      const s = new K({ canvas: ref.current, quality, reducedMotion: reduced, onPick: (p) => cb.current.onPick(p), onQuality: (q, w) => cb.current.onQuality(q, w) });
      sceneRef.current = s;
      cb.current.onReady(s);
      timer = setInterval(() => {
        cb.current.onFps(Math.round(s.fps));
        const st = s.stats();
        const cv = ref.current;
        if (cv) { cv.dataset['calls'] = String(st.calls); cv.dataset['tris'] = String(st.triangles); cv.dataset['kit'] = st.kit; }
      }, 1000);
      // حزمة GLB اختيارية: تُحمَّل فقط إن أعلنها البيان مسلَّمة؛ وإلا يبقى المشهد الإجرائي (D-09)
      void fetch('/kitchen/assets.manifest.json').then((r) => (r.ok ? r.json() : null)).then((m: { assets?: { kind: string; path: string; delivered?: boolean }[] } | null) => {
        const kit = m?.assets?.find((a) => a.kind === 'kit' && a.delivered === true);
        if (kit && !dead) return s.loadKit(kit.path).then((r) => { if (ref.current) ref.current.dataset['kitApplied'] = r.applied.join(','); });
      }).catch(() => undefined);
    });
    return () => {
      dead = true;
      if (timer) clearInterval(timer);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    sceneRef.current?.goStation(station);
  }, [station]);
  useEffect(() => {
    if (view) sceneRef.current?.update(view, stock);
  }, [view, stock]);
  // مفاتيح 1–7 للمحطات
  useEffect(() => {
    const names: StationName[] = ['shelves', 'equipment', 'tools', 'prep', 'stove', 'sink', 'serve'];
    const h = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      const m = /^Digit([1-7])$/.exec(e.code);
      if (m) sceneRef.current?.goStation(names[Number(m[1]) - 1]!);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return <canvas ref={ref} className="kt-canvas" data-quality={quality} data-reduced={reducedMotion ? '1' : '0'} role="img" aria-label="مطبخ ثلاثي الأبعاد: اضغط على المكوّنات والأوعية للتفاعل، أو استعمل لوحة الإجراءات" tabIndex={-1} />;
}
