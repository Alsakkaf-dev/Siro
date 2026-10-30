/**
 * متحكم المشي بمنظور الشخص الأول (عالم المطبخ): WASD/الأسهم، Shift للجري، C للانحناء، الفأرة للنظر (قفل المؤشر إن توفّر وإلا السحب)،
 * أزرار الفأرة = اليدان (اليسرى للزر الأيسر… انظر Hands). تصادم دائري ضد صناديق العالم. لا يرسم شيئًا: يضبط الكاميرا فقط.
 */
import * as THREE from 'three';
import { resolveCircle, type Aabb, type Bounds2 } from './collision.js';

export interface FpOptions { canvas: HTMLCanvasElement; camera: THREE.PerspectiveCamera; colliders: Aabb[]; room: Bounds2; spawn: THREE.Vector3; yaw?: number; reducedMotion: boolean; onClickAction: (button: 0 | 2, down: boolean, ts: number) => void; onKey?: (code: string, shift: boolean) => void; onWheel?: (dir: number) => void }

const WALK = 1.7, RUN = 3.4, RADIUS = 0.28, EYE = 1.65, EYE_CROUCH = 1.15, STAND = 0.95;

export class FirstPerson {
  readonly pos: THREE.Vector3;
  yaw: number;
  pitch = 0;
  crouch = false;
  /** هل المؤشر مقفول على اللوحة؟ */
  locked = false;
  /** فشل القفل (متصفح بلا دعم/وضع آلي): النقر = فعل، والسحب = نظر */
  lockUnavailable = false;
  private keys = new Set<string>();
  private eye = EYE;
  private bob = 0;
  private drag: { x: number; y: number; id: number } | null = null;
  private disposers: (() => void)[] = [];
  lastHit: string | null = null;
  moving = false;
  /** حساسية الفأرة (1 = افتراضي) وعكس المحور الرأسي */
  sens = 1;
  invertY = false;
  /** معلّق (قائمة/كمية مفتوحة): لا مشي ولا نظر ولا أفعال */
  paused = false;
  private motion = { dx: 0, dy: 0 };
  /** حركة الفأرة الخام منذ آخر استدعاء (لضربات الأدوات) */
  /** حقن حركة (اختبارات) */
  addMotion(dx: number, dy: number): void { this.motion.dx += dx; this.motion.dy += dy; }
  takeMotion(): { dx: number; dy: number } { const m = this.motion; this.motion = { dx: 0, dy: 0 }; return m; }

  constructor(private o: FpOptions) {
    this.pos = o.spawn.clone();
    this.yaw = o.yaw ?? 0;
    const el = o.canvas;
    const on = <K extends keyof WindowEventMap>(t: EventTarget, ev: string, fn: (e: never) => void, opt?: AddEventListenerOptions): void => {
      t.addEventListener(ev, fn as EventListener, opt);
      this.disposers.push(() => t.removeEventListener(ev, fn as EventListener, opt));
    };
    const typing = (t: EventTarget | null): boolean => !!t && /^(INPUT|SELECT|TEXTAREA)$/.test((t as HTMLElement).tagName ?? '') || !!(t as HTMLElement | null)?.isContentEditable;
    on(window, 'keydown', (e: KeyboardEvent) => {
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|ShiftLeft|ShiftRight)$/.test(e.code)) {
        this.keys.add(e.code);
        if (e.code.startsWith('Arrow') && document.activeElement === el) e.preventDefault();
      }
      if (e.code === 'KeyC') this.crouch = !this.crouch;
      else if (!this.paused && /^(KeyE|KeyR|KeyX|KeyF)$/.test(e.code)) o.onKey?.(e.code, e.shiftKey);
    });
    on(window, 'keyup', (e: KeyboardEvent) => void this.keys.delete(e.code));
    on(window, 'blur', () => this.keys.clear());
    on(document, 'pointerlockchange', () => { this.locked = document.pointerLockElement === el; });
    on(document, 'pointerlockerror', () => { this.lockUnavailable = true; });
    on(el, 'contextmenu', (e: Event) => e.preventDefault());
    on(el, 'wheel', (e: WheelEvent) => { if (this.paused) return; e.preventDefault(); o.onWheel?.(Math.sign(e.deltaY)); }, { passive: false });
    on(el, 'pointerdown', (e: PointerEvent) => {
      el.focus?.({ preventScroll: true });
      if (!this.locked && !this.lockUnavailable && typeof el.requestPointerLock === 'function') {
        // النقرة تقفل المؤشر وتُنفَّذ كفعل في الوقت نفسه (لا نبتلع النقرة الأولى)
        try { const r = el.requestPointerLock() as unknown as Promise<void> | undefined; r?.catch?.(() => { this.lockUnavailable = true; }); } catch { this.lockUnavailable = true; }
      }
      if (this.paused) return;
      if (e.button === 0 || e.button === 2) o.onClickAction(e.button as 0 | 2, true, e.timeStamp);
      if (!this.locked) { this.drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; el.setPointerCapture?.(e.pointerId); }
    });
    on(el, 'pointerup', (e: PointerEvent) => {
      if (!this.paused && (e.button === 0 || e.button === 2)) o.onClickAction(e.button as 0 | 2, false, e.timeStamp);
      this.drag = null;
    });
    on(el, 'pointermove', (e: PointerEvent) => {
      if (this.locked) this.look(e.movementX, e.movementY);
      else if (this.drag) { this.look(e.clientX - this.drag.x, e.clientY - this.drag.y); this.drag.x = e.clientX; this.drag.y = e.clientY; }
    });
  }

  private look(dx: number, dy: number): void {
    if (this.paused) return;
    this.motion.dx += Math.abs(dx); this.motion.dy += Math.abs(dy);
    this.yaw -= dx * 0.0022 * this.sens;
    this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch - dy * 0.002 * this.sens * (this.invertY ? -1 : 1)));
  }
  /** اتجاه الأمام على XZ (الأمام = −Z عند yaw=0) */
  forward(): THREE.Vector3 { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  /** يقف على بعد 0.95 م من هدف المحطة (قبالته) بعيون المشي، مع دفعه خارج أي مصادم */
  teleport(eye: THREE.Vector3, look: THREE.Vector3, stand = STAND): void {
    const dx = look.x - eye.x, dz = look.z - eye.z;
    const L = Math.hypot(dx, dz) || 1;
    const ux = dx / L, uz = dz / L;
    const r = resolveCircle(look.x - ux * stand, look.z - uz * stand, RADIUS, this.o.colliders, 0.1, EYE - 0.1, this.o.room);
    this.pos.set(r.x, 0, r.z);
    const dist = Math.max(0.5, Math.hypot(look.x - r.x, look.z - r.z));
    this.yaw = Math.atan2(-ux, -uz);
    this.pitch = Math.max(-1.0, Math.min(1.0, Math.atan2(look.y - EYE, dist)));
  }
  /** يوجّه النظر إلى نقطة عالمية (للاختبارات والمحطات) */
  lookAtPoint(x: number, y: number, z: number): void {
    const dx = x - this.pos.x, dz = z - this.pos.z, dy = y - this.eye;
    this.yaw = Math.atan2(-dx, -dz);
    this.pitch = Math.max(-1.25, Math.min(1.25, Math.atan2(dy, Math.hypot(dx, dz))));
  }
  /** يضع اللاعب (للاختبارات) */
  setPos(x: number, z: number): void { this.pos.set(x, 0, z); }
  get eyeHeight(): number { return this.eye; }

  /** يقفل المؤشر (يحتاج إيماءة مستخدم) */
  lock(): void {
    const el = this.o.canvas;
    el.focus?.({ preventScroll: true });
    try { const r = el.requestPointerLock?.() as unknown as Promise<void> | undefined; r?.catch?.(() => { this.lockUnavailable = true; }); } catch { this.lockUnavailable = true; }
  }
  unlock(): void { if (document.pointerLockElement === this.o.canvas) document.exitPointerLock?.(); }
  update(dt: number): void {
    if (this.paused) { this.moving = false; this.apply(); return; }
    const k = this.keys;
    const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0);
    if (turn) this.yaw += turn * 1.8 * dt;
    const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const str = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    this.moving = !!(fwd || str);
    if (this.moving) {
      const sp = (k.has('ShiftLeft') || k.has('ShiftRight') ? RUN : WALK) * (this.crouch ? 0.5 : 1);
      const f = this.forward();
      const rx = -f.z, rz = f.x; // اليمين
      let mx = f.x * fwd + rx * str, mz = f.z * fwd + rz * str;
      const l = Math.hypot(mx, mz) || 1; mx = (mx / l) * sp * dt; mz = (mz / l) * sp * dt;
      // محوران منفصلان فيحدث الانزلاق على الجدار
      const a = resolveCircle(this.pos.x + mx, this.pos.z, RADIUS, this.o.colliders, 0.1, this.eye - 0.1, this.o.room);
      const b = resolveCircle(a.x, this.pos.z + mz, RADIUS, this.o.colliders, 0.1, this.eye - 0.1, this.o.room);
      this.pos.x = b.x; this.pos.z = b.z; this.lastHit = a.hit ?? b.hit;
      if (!this.o.reducedMotion) this.bob += dt * sp * 3.2;
    }
    const goal = this.crouch ? EYE_CROUCH : EYE;
    this.eye += (goal - this.eye) * Math.min(1, dt * 10);
    this.apply();
  }
  apply(): void {
    const bobY = this.o.reducedMotion || !this.moving ? 0 : Math.sin(this.bob) * 0.012;
    this.o.camera.position.set(this.pos.x, this.eye + bobY, this.pos.z);
    this.o.camera.rotation.order = 'YXZ';
    this.o.camera.rotation.set(this.pitch, this.yaw, 0);
  }
  dispose(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    if (document.pointerLockElement === this.o.canvas) document.exitPointerLock?.();
  }
}
