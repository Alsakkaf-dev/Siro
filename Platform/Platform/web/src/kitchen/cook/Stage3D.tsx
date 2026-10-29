import { useEffect, useRef, useState } from 'react';
import type { KitchenScene, Pick, Quality, SceneAction, StationName } from './Scene3D.js';
import type { SimView } from './simClient.js';

/** حاوية لوحة الرسم: three.js يُحمَّل هنا فقط (PERF-02) فلا يدفع ثمنه أحد خارج /kitchen/cook */
export default function Stage3D({ quality, onQuality, onPick, onAction, hoverLabel, station, view, stock, onReady, onFps }: { quality: Quality; onQuality: (q: Quality, why: string) => void; onPick: (p: Pick) => void; onAction: (a: SceneAction) => void; hoverLabel: (p: Pick) => string; station: StationName; view: SimView | null; stock: Record<string, number>; onReady: (s: KitchenScene) => void; onFps: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<KitchenScene | null>(null);
  const cb = useRef({ onPick, onQuality, onReady, onFps, onAction, hoverLabel });
  const [hover, setHover] = useState<string>('');
  const [world, setWorld] = useState<'loading' | 'on' | 'off'>('loading');
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cb.current = { onPick, onQuality, onReady, onFps, onAction, hoverLabel };
  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    void import('./Scene3D.js').then(({ KitchenScene: K }) => {
      if (dead || !ref.current) return;
      const reduced = reducedMotion;
      const s = new K({ canvas: ref.current, quality, reducedMotion: reduced, onPick: (p) => cb.current.onPick(p), onQuality: (q, w) => cb.current.onQuality(q, w), onAction: (a) => cb.current.onAction(a), onHover: (p) => setHover(p ? cb.current.hoverLabel(p) : '') });
      sceneRef.current = s;
      cb.current.onReady(s);
      timer = setInterval(() => {
        cb.current.onFps(Math.round(s.fps));
        const st = s.stats();
        const cv = ref.current;
        if (cv) { cv.dataset['calls'] = String(st.calls); cv.dataset['tris'] = String(st.triangles); cv.dataset['kit'] = st.kit;
          const pl = s.playerInfo();
          if (cv && pl) { cv.dataset['world'] = '1'; cv.dataset['vessels'] = JSON.stringify(s.vesselInfo()); cv.dataset['player'] = `${pl.x.toFixed(2)},${pl.z.toFixed(2)}`; cv.dataset['yaw'] = pl.yaw.toFixed(2); cv.dataset['crouch'] = pl.crouch ? '1' : '0'; cv.dataset['locked'] = pl.locked ? '1' : '0'; }
        }
      }, 1000);
      // حزمة GLB اختيارية: تُحمَّل فقط إن أعلنها البيان مسلَّمة؛ وإلا يبقى المشهد الإجرائي (D-09)
      void fetch('/kitchen/assets.manifest.json').then((r) => (r.ok ? r.json() : null)).then((m: { assets?: { kind: string; path: string; delivered?: boolean }[] } | null) => {
        // العالم (بلندر): مطبخ يُمشى فيه بالشخص الأول؛ يفشل ← يبقى المشهد الإجرائي القديم
        const wd = m?.assets?.find((a) => a.kind === 'world' && a.delivered === true);
        if (wd && !dead) {
          return s.loadWorld(wd.path).then((r) => { if (ref.current) { ref.current.dataset['worldNodes'] = String(r.nodes); ref.current.dataset['worldGaps'] = r.gaps.join(','); } setWorld('on'); })
            .catch(() => { setWorld('off'); });
        }
        setWorld('off');
        const kit = m?.assets?.find((a) => a.kind === 'kit' && a.delivered === true);
        if (kit && !dead) return s.loadKit(kit.path).then((r) => { if (ref.current) ref.current.dataset['kitApplied'] = r.applied.join(','); });
      }).catch(() => setWorld('off'));
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
  return (
    <div className="kt-world" data-world={world}>
      <canvas ref={ref} className="kt-canvas" data-quality={quality} data-reduced={reducedMotion ? '1' : '0'} role="img" aria-label="مطبخ ثلاثي الأبعاد: امشِ بمفاتيح W A S D وانظر بالفأرة، الزر الأيسر اليد اليمنى والأيمن اليد اليسرى، أو استعمل لوحة الإجراءات" tabIndex={world === 'on' ? 0 : -1} />
      {world === 'on' && (
        <>
          <span className="kt-cross" aria-hidden="true" />
          {hover && <span className="kt-hover" role="status">{hover}</span>}
          <p className="kt-help" aria-label="التحكم">
            <kbd>W A S D</kbd> مشي · <kbd>Shift</kbd> جري · <kbd>C</kbd> انحناء · الفأرة نظر · زر أيسر = اليد اليمنى · زر أيمن = اليد اليسرى · <kbd>1–7</kbd> محطات
          </p>
        </>
      )}
    </div>
  );
}
