import { SimHost, SimError, type Op, type OpIn, type Snapshot, type Speed } from '../../../../shared/kitchen/sim/index.js';

export interface SimView { snap: Snapshot; speed: Speed; paused: boolean; slowed: { type: string; ref: string; t: number } | null; canUndo: boolean; nOps: number }
type Pending = { res: (v: { ok?: boolean; log?: { ops: Op[]; seed: number; t: number } }) => void; rej: (e: Error) => void };

/**
 * عميل المحاكاة: Worker حتمي إن توفّر (SIM-01) وإلا مضيف على الخيط الرئيسي بالمنطق نفسه.
 * الواجهة تتلقى لقطات 10 Hz وتتحدث بها فقط؛ لا حالة طهي تُحسب في React.
 */
export class SimClient {
  readonly usesWorker: boolean;
  private worker: Worker | null = null;
  private host: SimHost | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private pending = new Map<number, Pending>();
  private n = 0;
  private lastTick = 0;
  constructor(private onView: (v: SimView) => void, seed = 1, ops: readonly Op[] = []) {
    let w: Worker | null = null;
    if (typeof Worker !== 'undefined') {
      try {
        w = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
      } catch {
        w = null;
      }
    }
    this.worker = w;
    this.usesWorker = !!w;
    if (w) {
      w.onmessage = (e: MessageEvent<{ k: string; id?: number; ok?: boolean; msg?: string; log?: { ops: Op[]; seed: number; t: number }; snap?: Snapshot } & Partial<SimView>>) => {
        const m = e.data;
        if (m.k === 'snap') this.onView({ snap: m.snap!, speed: m.speed!, paused: m.paused!, slowed: m.slowed ?? null, canUndo: !!m.canUndo, nOps: m.nOps ?? 0 });
        else if (m.k === 'ack' || m.k === 'log') this.pending.get(m.id!)?.res({ ...(m.ok !== undefined ? { ok: m.ok } : {}), ...(m.log ? { log: m.log } : {}) }), this.pending.delete(m.id!);
        else if (m.k === 'err') {
          const p = this.pending.get(m.id ?? -1);
          if (p) {
            p.rej(new SimError(m.msg ?? 'خطأ'));
            this.pending.delete(m.id!);
          }
        }
      };
      w.postMessage({ k: 'init', seed, ops });
    } else {
      this.host = new SimHost(seed, ops);
      this.lastTick = performance.now();
      this.timer = setInterval(() => {
        const now = performance.now();
        this.host!.tick(now - this.lastTick);
        this.lastTick = now;
        this.emit();
      }, 100);
      this.emit();
    }
  }
  private emit(): void {
    const h = this.host!;
    this.onView({ snap: h.snapshot(), speed: h.speed, paused: h.paused, slowed: h.autoSlowed, canUndo: h.canUndo(), nOps: h.ops.length });
  }
  private call(msg: Record<string, unknown>): Promise<{ ok?: boolean; log?: { ops: Op[]; seed: number; t: number } }> {
    const id = ++this.n;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.worker!.postMessage({ ...msg, id });
    });
  }
  /** يطبّق عملية بزمن اللعبة الحالي؛ يرفض بـSimError عربية */
  async op(op: OpIn): Promise<void> {
    if (this.worker) {
      await this.call({ k: 'op', op });
      return;
    }
    this.host!.apply(op);
    this.emit();
  }
  setSpeed(x: Speed): void {
    if (this.worker) this.worker.postMessage({ k: 'speed', x });
    else {
      this.host!.setSpeed(x);
      this.host!.autoSlowed = null;
      this.emit();
    }
  }
  setPaused(on: boolean): void {
    if (this.worker) this.worker.postMessage({ k: 'pause', on });
    else {
      this.host!.setPaused(on);
      this.emit();
    }
  }
  async undo(): Promise<boolean> {
    if (this.worker) return !!(await this.call({ k: 'undo' })).ok;
    const ok = this.host!.undo();
    this.emit();
    return ok;
  }
  restart(): void {
    if (this.worker) this.worker.postMessage({ k: 'restart' });
    else {
      this.host!.restart();
      this.emit();
    }
  }
  async log(): Promise<{ ops: Op[]; seed: number; t: number }> {
    if (this.worker) return (await this.call({ k: 'log' })).log!;
    return this.host!.log();
  }
  dispose(): void {
    this.worker?.terminate();
    if (this.timer) clearInterval(this.timer);
    this.pending.clear();
  }
}
