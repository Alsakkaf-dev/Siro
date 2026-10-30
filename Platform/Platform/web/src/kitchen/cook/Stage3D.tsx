import { useCallback, useEffect, useRef, useState } from 'react';
import type { KitchenScene, Pick, Quality, SceneAction, StationName } from './Scene3D.js';
import type { SimView } from './simClient.js';

/** حاوية لوحة الرسم: three.js يُحمَّل هنا فقط (PERF-02) فلا يدفع ثمنه أحد خارج /kitchen/cook */

interface GameSettings { sens: number; fov: number; invertY: boolean }
const DEFAULTS: GameSettings = { sens: 1, fov: 70, invertY: false };
const KEY = 'siro.kitchen.game';
const clamp = (n: number, a: number, b: number): number => Math.min(b, Math.max(a, Number.isFinite(n) ? n : a));
const loadSettings = (): GameSettings => {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<GameSettings> | null;
    return { sens: clamp(j?.sens ?? 1, 0.2, 3), fov: clamp(j?.fov ?? 70, 55, 100), invertY: !!j?.invertY };
  } catch { return DEFAULTS; }
};

export interface StageHud { time: string; cost: string }

export default function Stage3D({ quality, onQuality, onPick, onAction, hoverLabel, station, view, stock, onReady, onFps, hud }: { quality: Quality; onQuality: (q: Quality, why: string) => void; onPick: (p: Pick) => void; onAction: (a: SceneAction) => void; hoverLabel: (p: Pick) => string; station: StationName; view: SimView | null; stock: Record<string, number>; onReady: (s: KitchenScene) => void; onFps: (n: number) => void; hud: StageHud }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<KitchenScene | null>(null);
  const cb = useRef({ onPick, onQuality, onReady, onFps, onAction, hoverLabel });
  const [hover, setHover] = useState<string>('');
  const [world, setWorld] = useState<'loading' | 'on' | 'off'>('loading');
  const [game, setGame] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
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
        if (cv) {
          cv.dataset['calls'] = String(st.calls); cv.dataset['tris'] = String(st.triangles); cv.dataset['kit'] = st.kit;
          const pl = s.playerInfo();
          if (pl) { cv.dataset['world'] = '1'; cv.dataset['vessels'] = JSON.stringify(s.vesselInfo()); cv.dataset['player'] = `${pl.x.toFixed(2)},${pl.z.toFixed(2)}`; cv.dataset['yaw'] = pl.yaw.toFixed(2); cv.dataset['crouch'] = pl.crouch ? '1' : '0'; cv.dataset['locked'] = pl.locked ? '1' : '0'; }
        }
      }, 1000);
      // العالم (بلندر): مطبخ يُمشى فيه بالشخص الأول؛ يفشل ← يبقى المشهد الإجرائي القديم. وإلا حزمة GLB اختيارية (D-09)
      void fetch('/kitchen/assets.manifest.json').then((r) => (r.ok ? r.json() : null)).then((m: { assets?: { kind: string; path: string; delivered?: boolean }[] } | null) => {
        const wd = m?.assets?.find((a) => a.kind === 'world' && a.delivered === true);
        if (wd && !dead) {
          return s.loadWorld(wd.path).then((r) => { if (ref.current) { ref.current.dataset['worldNodes'] = String(r.nodes); ref.current.dataset['worldGaps'] = r.gaps.join(','); } s.setGame(loadSettings()); setWorld('on'); })
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
  useEffect(() => { sceneRef.current?.goStation(station); }, [station]);
  useEffect(() => { if (view) sceneRef.current?.update(view, stock); }, [view, stock]);

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

  /* ── غلاف اللعبة: دخول بملء الشاشة، تعليق عند فقدان قفل المؤشر، الإعدادات ── */
  const enter = useCallback((): void => {
    setGame(true); setPaused(false);
    void wrap.current?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined); // قد يُرفض فنلعب بالحجم العادي
    const s = sceneRef.current;
    s?.setGame({ ...settings, paused: false });
    s?.lockPointer();
  }, [settings]);
  const resume = useCallback((): void => {
    setPaused(false); setHelp(false);
    sceneRef.current?.setGame({ paused: false });
    sceneRef.current?.lockPointer();
    if (!document.fullscreenElement) void wrap.current?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined);
  }, []);
  const pause = useCallback((): void => {
    setPaused(true);
    sceneRef.current?.setGame({ paused: true });
    sceneRef.current?.unlockPointer();
  }, []);
  const leave = useCallback((): void => {
    setGame(false); setPaused(false); setHelp(false);
    sceneRef.current?.setGame({ paused: false });
    sceneRef.current?.unlockPointer();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!game) return;
    const onLock = (): void => { if (!document.pointerLockElement && !paused) pause(); };
    const onFs = (): void => { if (!document.fullscreenElement && !paused) pause(); };
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') { if (!paused) pause(); }
      else if (e.code === 'F1') { e.preventDefault(); setHelp((h) => !h); if (!paused) pause(); }
    };
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerlockchange', onLock); document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); };
  }, [game, paused, pause]);
  const update = (patch: Partial<GameSettings>): void => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* تخزين المتصفح اختياري */ }
    sceneRef.current?.setGame(next);
  };

  return (
    <div ref={wrap} className="kt-world" data-world={world} data-game={game ? (paused ? 'paused' : 'on') : 'off'}>
      <canvas ref={ref} className="kt-canvas" data-quality={quality} data-reduced={reducedMotion ? '1' : '0'} role="img" aria-label="مطبخ ثلاثي الأبعاد: اضغط «ادخل المطبخ» ثم امشِ بمفاتيح W A S D وانظر بالفأرة، أو استعمل لوحة الإجراءات" tabIndex={world === 'on' ? 0 : -1} />
      {world === 'on' && !game && (
        <div className="kt-enter">
          <button type="button" className="btn primary kt-enter-btn" data-testid="enter-kitchen" onClick={enter}>ادخل المطبخ</button>
          <p>ملء الشاشة · <kbd>W A S D</kbd> مشي · الفأرة نظر · زر أيسر: إمساك · زر أيمن: الكمية · <kbd>Esc</kbd> قائمة</p>
        </div>
      )}
      {world === 'on' && game && !paused && (
        <>
          <span className="kt-cross" aria-hidden="true" />
          {hover && <span className="kt-hover" role="status">{hover}</span>}
          <div className="kt-hud-top" aria-label="حالة الطبخ"><span dir="ltr">⏱ {hud.time}</span><span>{hud.cost}</span></div>
          <p className="kt-help" aria-label="التحكم">
            <kbd>W A S D</kbd> مشي · <kbd>Shift</kbd> جري · <kbd>C</kbd> انحناء · زر أيسر: إمساك/ضغط · زر أيمن: كمية/استعمال · <kbd>1–7</kbd> محطات · <kbd>F1</kbd> دليل · <kbd>Esc</kbd> قائمة
          </p>
        </>
      )}
      {world === 'on' && game && paused && (
        <div className="kt-pause" role="dialog" aria-label="قائمة اللعبة" data-testid="pause-menu">
          <div className="kt-pause-card">
            <h3>{help ? 'دليل اللعبة' : 'اللعبة متوقفة'}</h3>
            {help ? <GameGuide /> : (
              <>
                <label>حساسية الفأرة <input type="range" min={0.2} max={3} step={0.1} value={settings.sens} onChange={(e) => update({ sens: Number(e.target.value) })} aria-label="حساسية الفأرة" /> <b className="num" dir="ltr">{settings.sens.toFixed(1)}×</b></label>
                <label>زاوية الرؤية <input type="range" min={55} max={100} step={1} value={settings.fov} onChange={(e) => update({ fov: Number(e.target.value) })} aria-label="زاوية الرؤية" /> <b className="num" dir="ltr">{settings.fov}°</b></label>
                <label className="kt-row"><input type="checkbox" checked={settings.invertY} onChange={(e) => update({ invertY: e.target.checked })} /> عكس المحور الرأسي</label>
              </>
            )}
            <div className="kt-pause-actions">
              <button type="button" className="btn primary" onClick={resume} data-testid="resume-game">تابع</button>
              <button type="button" className="btn" onClick={() => setHelp((h) => !h)}>{help ? 'الإعدادات' : 'الدليل (F1)'}</button>
              <button type="button" className="btn" onClick={leave}>اخرج من المطبخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** دليل التحكم داخل اللعبة (ملخّص؛ يتوسع مع كل أداة تُضاف) */
function GameGuide() {
  return (
    <dl className="kt-guide">
      <dt>الحركة</dt><dd><kbd>W A S D</kbd> مشي · <kbd>Shift</kbd> جري · <kbd>C</kbd> انحناء · الفأرة للنظر · <kbd>1–7</kbd> الانتقال إلى محطة</dd>
      <dt>اليدان</dt><dd>الزر الأيسر = اليد اليمنى، الأيمن = اليسرى. اضغط مطوّلًا لتمسك، وأفلت فوق الهدف لتضع.</dd>
      <dt>الموقد</dt><dd>صوّب على سطح الموقد وأفلت القدر لتضعه، وانقر المقبض الأزرق لإشعال اللهب وتغييره.</dd>
      <dt>المكوّنات</dt><dd>صوّب على الرف: اضغط مطوّلًا لتأخذ الكمية المضبوطة، والزر الأيمن يفتح قائمة الكمية.</dd>
      <dt>القائمة</dt><dd><kbd>Esc</kbd> يوقف اللعبة ويفتح الإعدادات.</dd>
    </dl>
  );
}
