/// <reference lib="webworker" />
// عامل المحاكاة (SIM-01): خطوة ثابتة 0.1 ث من زمن اللعبة منفصلة عن الرسم؛ لقطات 10 Hz إلى الواجهة.
import { SimHost, SimError, type OpIn, type Speed } from '../../../../shared/kitchen/sim/index.js';
import type { Op } from '../../../../shared/kitchen/sim/index.js';

type In =
  | { k: 'init'; seed: number; ops?: Op[] }
  | { k: 'op'; op: OpIn; id: number }
  | { k: 'speed'; x: Speed }
  | { k: 'pause'; on: boolean }
  | { k: 'undo'; id: number }
  | { k: 'restart' }
  | { k: 'log'; id: number };

const ctx = self as unknown as { postMessage: (m: unknown) => void; onmessage: ((e: MessageEvent<In>) => void) | null };
let host: SimHost | null = null;
let last = 0;
let lastPost = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const post = (): void => {
  if (host) ctx.postMessage({ k: 'snap', snap: host.snapshot(), speed: host.speed, paused: host.paused, slowed: host.autoSlowed, canUndo: host.canUndo(), nOps: host.ops.length });
};
const loop = (): void => {
  if (!host) return;
  const now = performance.now();
  const dt = now - last;
  last = now;
  host.tick(dt);
  if (now - lastPost >= 100) {
    lastPost = now;
    post();
  }
};

ctx.onmessage = (e) => {
  const m = e.data;
  try {
    switch (m.k) {
      case 'init':
        host = new SimHost(m.seed, m.ops ?? []);
        last = performance.now();
        if (!timer) timer = setInterval(loop, 50);
        post();
        break;
      case 'op':
        if (!host) throw new SimError('الجلسة غير مبدوءة');
        host.apply(m.op);
        ctx.postMessage({ k: 'ack', id: m.id });
        post();
        break;
      case 'speed':
        host?.setSpeed(m.x);
        host && (host.autoSlowed = null);
        post();
        break;
      case 'pause':
        host?.setPaused(m.on);
        post();
        break;
      case 'undo':
        ctx.postMessage({ k: 'ack', id: m.id, ok: host?.undo() ?? false });
        post();
        break;
      case 'restart':
        host?.restart();
        post();
        break;
      case 'log':
        ctx.postMessage({ k: 'log', id: m.id, log: host?.log() });
        break;
    }
  } catch (err) {
    ctx.postMessage({ k: 'err', id: 'id' in m ? m.id : -1, msg: err instanceof SimError ? err.message : 'خطأ في المحاكاة' });
  }
};
