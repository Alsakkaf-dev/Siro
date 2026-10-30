import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameHost, KitchenScene, Pick, Quality, StationName } from './Scene3D.js';
import { EMPTY_HUD, type GameHud } from './world/types.js';
import { PRESET_GRAMS, unitGrams } from './world/qty.js';
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

export interface StageHud { time: string; cost: string; log: { id: number; msg: string; tone: 'ok' | 'warn' | 'err'; at: number }[] }

export default function Stage3D({ quality, onQuality, onPick, host, ingName, qty, onQty, hoverLabel, station, view, stock, onReady, onFps, hud }: { quality: Quality; onQuality: (q: Quality, why: string) => void; onPick: (p: Pick) => void; host: GameHost; ingName: (slug: string) => string; qty: (slug: string) => number; onQty: (slug: string, grams: number) => void; hoverLabel: (p: Pick) => string; station: StationName; view: SimView | null; stock: Record<string, number>; onReady: (s: KitchenScene) => void; onFps: (n: number) => void; hud: StageHud }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<KitchenScene | null>(null);
  const cb = useRef({ onPick, onQuality, onReady, onFps, host, hoverLabel });
  const [qtyFor, setQtyFor] = useState<string | null>(null);
  const [gameHud, setGameHud] = useState<GameHud>(EMPTY_HUD);
  const [now, setNow] = useState(() => Date.now());
  const menuOpen = useRef(false);
  const [hover, setHover] = useState<string>('');
  const [world, setWorld] = useState<'loading' | 'on' | 'off'>('loading');
  const [game, setGame] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cb.current = { onPick, onQuality, onReady, onFps, host, hoverLabel };

  const openQty = useCallback((slug: string): void => {
    menuOpen.current = true; setQtyFor(slug);
    sceneRef.current?.setGame({ paused: true }); sceneRef.current?.unlockPointer();
  }, []);
  const closeQty = useCallback((): void => {
    setQtyFor(null);
    window.setTimeout(() => { menuOpen.current = false; }, 300);
    sceneRef.current?.setGame({ paused: false }); sceneRef.current?.lockPointer();
  }, []);
  const leaveFs = useCallback((): void => {
    setPaused(true); sceneRef.current?.setGame({ paused: true }); sceneRef.current?.unlockPointer();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    void import('./Scene3D.js').then(({ KitchenScene: K }) => {
      if (dead || !ref.current) return;
      const reduced = reducedMotion;
      const s = new K({ canvas: ref.current, quality, reducedMotion: reduced, onPick: (p) => cb.current.onPick(p), onQuality: (q, w) => cb.current.onQuality(q, w), host: { take: (sl, g) => cb.current.host.take(sl, g), op: (o, m) => cb.current.host.op(o, m), quantity: (sl) => cb.current.host.quantity(sl), say: (m, t) => cb.current.host.say(m, t), askQuantity: (sl) => openQty(sl), serve: () => { leaveFs(); cb.current.host.serve(); } }, onHud: (h) => setGameHud(h), onHover: (p) => setHover(p ? cb.current.hoverLabel(p) : '') });
      sceneRef.current = s;
      if (new URLSearchParams(location.search).has('e2e')) (window as unknown as { __kitchenScene?: unknown }).__kitchenScene = s;
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
    const onLock = (): void => { if (!document.pointerLockElement && !paused && !menuOpen.current) pause(); };
    const onFs = (): void => {
      if (document.fullscreenElement) { if (!paused && !menuOpen.current) sceneRef.current?.lockPointer(); } // الدخول لملء الشاشة يُسقط القفل فنعيده
      else if (!paused && !menuOpen.current) pause();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Escape') { if (qtyFor) closeQty(); else if (!paused) pause(); }
      else if (e.code === 'F1') { e.preventDefault(); setHelp((h) => !h); if (!paused) pause(); }
    };
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerlockchange', onLock); document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); };
  }, [game, paused, pause, qtyFor, closeQty]);
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
          <div className="kt-hands" aria-label="ما في اليدين"><span>{gameHud.left ? `يسار: ${gameHud.left}` : ''}</span><span>{gameHud.right ? `يمين: ${gameHud.right}` : ''}</span></div>
          {gameHud.hint && <p className="kt-hint">{gameHud.hint}{gameHud.cut ? ` — الأسلوب: ${gameHud.cut}` : ''}</p>}
          {gameHud.progress !== null && gameHud.progress > 0 && <progress className="kt-prog" max={1} value={gameHud.progress} aria-label="تقدّم الفعل" />}
          <ul className="kt-toasts" aria-live="polite">{hud.log.filter((l) => now - l.at < 6500).slice(-4).map((l) => <li key={l.id} data-tone={l.tone}>{l.msg}</li>)}</ul>
          <p className="kt-help" aria-label="التحكم">
            <kbd>W A S D</kbd> مشي · <kbd>Shift</kbd> جري · <kbd>C</kbd> انحناء · زر أيسر: إمساك/ضغط · زر أيمن: كمية/استعمال · <kbd>1–7</kbd> محطات · <kbd>F1</kbd> دليل · <kbd>Esc</kbd> قائمة
          </p>
        </>
      )}
      {world === 'on' && game && qtyFor && <QtyMenu slug={qtyFor} name={ingName(qtyFor)} grams={qty(qtyFor)} onOk={(g) => { onQty(qtyFor, g); closeQty(); }} onCancel={closeQty} />}
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

/** قائمة الكمية داخل اللعبة (الزر الأيمن على الرف): قائمة منسدلة أو إدخال رقم مباشر */
function QtyMenu({ slug, name, grams, onOk, onCancel }: { slug: string; name: string; grams: number; onOk: (g: number) => void; onCancel: () => void }) {
  const [v, setV] = useState(String(grams));
  const unit = unitGrams(slug);
  const opts = [...new Set([...(unit ? [1, 2, 3, 4, 5, 6].map((n) => n * unit) : []), ...PRESET_GRAMS, grams])].sort((a, b) => a - b);
  const g = Number(v);
  const ok = Number.isFinite(g) && g > 0 && g <= 5000;
  return (
    <div className="kt-pause" role="dialog" aria-label={`كمية ${name}`} data-testid="qty-menu">
      <form className="kt-pause-card" onSubmit={(e) => { e.preventDefault(); if (ok) onOk(g); }}>
        <h3>كمية {name}</h3>
        <label>من القائمة <select value={opts.includes(g) ? String(g) : ''} onChange={(e) => e.target.value && setV(e.target.value)} aria-label="الكمية من القائمة"><option value="">—</option>{opts.map((o) => <option key={o} value={o}>{unit && o % unit === 0 && o / unit <= 6 ? `${o / unit} ${o / unit === 1 ? 'حبة' : 'حبات'} (${o} غ)` : `${o} غ`}</option>)}</select></label>
        <label>أو أدخل رقمًا <input autoFocus type="number" min={1} max={5000} step={1} inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} aria-label="الكمية بالغرام" /> <b>غ</b></label>
        <div className="kt-pause-actions"><button type="submit" className="btn primary" disabled={!ok}>اعتمد</button><button type="button" className="btn" onClick={onCancel}>إلغاء</button></div>
      </form>
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
      <dt>المكوّنات</dt><dd>صوّب على الرف: اضغط مطوّلًا لتأخذ الكمية المضبوطة (نقرة سريعة تبقيها في يدك لتفلتها بنقرة ثانية)، والزر الأيمن على الرف يفتح قائمة الكمية.</dd>
      <dt>الإفلات</dt><dd>فوق قدر = إضافة · فوق اللوح أو الطاولة = وضع · المحمّصة للتوست · السلة = رمي · الحوض = غسل · الأرض = يتلف.</dd>
      <dt>أدوات وأوعية</dt><dd><kbd>E</kbd> غطاء القدر · <kbd>R</kbd> إطلاق ضغط (مع Shift طبيعي) · <kbd>X</kbd> تصفية الماء · <kbd>F</kbd> تقديم الطبق.</dd>
      <dt>القائمة</dt><dd><kbd>Esc</kbd> يوقف اللعبة ويفتح الإعدادات.</dd>
    </dl>
  );
}
