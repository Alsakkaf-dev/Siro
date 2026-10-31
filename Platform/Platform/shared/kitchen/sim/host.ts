/**
 * مضيف المحاكاة: منطق الجلسة (تسريع الزمن، إيقاف مؤقت، تراجع، سجل، إبطاء تلقائي عند التنبيهات) بلا DOM.
 * يعمل داخل Worker (SIM-01) وكاحتياط على الخيط الرئيسي، وبالمخرجات نفسها في vitest.
 */
import { Sim, SimError, type Op, type Snapshot } from './engine.js';

export type OpIn = Op extends infer O ? (O extends { t: number } ? Omit<O, 't'> : never) : never;
export const SPEEDS = [1, 5, 20, 60] as const;
export type Speed = (typeof SPEEDS)[number];
/** تنبيهات توقف التسريع تلقائيًا (KIT-23) */
const SLOW_ON = new Set(['burn', 'smoke', 'boil_over', 'toast_pop', 'whistle', 'stuck', 'pressure_released']);

export class SimHost {
  sim: Sim;
  ops: Op[] = [];
  speed: Speed = 1;
  paused = false;
  /** آخر تنبيه أبطأ التسريع (للواجهة) */
  autoSlowed: { type: string; ref: string; t: number } | null = null;
  private seenEvents = 0;
  constructor(public readonly seed: number, initial: readonly Op[] = []) {
    this.sim = new Sim(seed);
    for (const op of initial) this.push(op);
  }
  private push(op: Op): void {
    this.sim.apply(op);
    this.ops.push(op);
  }
  /** يطبّق عملية «الآن» (بزمن اللعبة الحالي). يرمي SimError بعربية واضحة */
  apply(op: OpIn): Op {
    const full = { ...op, t: this.sim.t } as Op;
    this.push(full);
    return full;
  }
  setSpeed(x: Speed): void {
    this.speed = x;
  }
  setPaused(on: boolean): void {
    this.paused = on;
  }
  /** تقدّم بالزمن الحقيقي (مللي ثانية) × التسريع. يعيد true إن تغيّرت الحالة */
  tick(realMs: number): boolean {
    if (this.paused) return false;
    const game = Math.min(realMs / 1000, 0.25) * this.speed;
    this.sim.advance(game);
    const ev = this.sim.events;
    let slowed = false;
    for (let i = this.seenEvents; i < ev.length; i++) {
      const e = ev[i]!;
      if (SLOW_ON.has(e.type) && this.speed > 1) {
        this.speed = 1;
        this.autoSlowed = { type: e.type, ref: e.ref, t: e.t };
        slowed = true;
      }
    }
    this.seenEvents = ev.length;
    void slowed;
    return true;
  }
  /** KIT-22: يُعكس آخر فعل قبل الحرارة فقط؛ بعد الحرارة لا يُعكس (يعيد الجلسة من السجل) */
  canUndo(): boolean {
    const last = this.ops.at(-1);
    if (!last) return false;
    if (!['take', 'prep', 'add', 'pour', 'season', 'remove', 'stir'].includes(last.type)) return false;
    return this.sim.burners.every((l) => l === 0) && ![...this.sim.items.values()].some((i) => i.loc === 'toaster');
  }
  undo(): boolean {
    if (!this.canUndo()) return false;
    const keepT = this.sim.t;
    const ops = this.ops.slice(0, -1);
    const s = new Sim(this.seed);
    for (const op of ops) s.apply(op);
    s.advanceTo(keepT);
    this.sim = s;
    this.ops = ops;
    this.seenEvents = s.events.length;
    return true;
  }
  /** إعادة الجلسة من سجلها (الأفعال بعد الحرارة لا تُعكس لكن تُعاد من البداية) */
  restart(): void {
    this.sim = new Sim(this.seed);
    this.ops = [];
    this.seenEvents = 0;
    this.speed = 1;
    this.autoSlowed = null;
  }
  snapshot(): Snapshot {
    return this.sim.snapshot();
  }
  log(): { ops: Op[]; seed: number; t: number } {
    return { ops: [...this.ops], seed: this.seed, t: this.sim.t };
  }
}
export { SimError };
