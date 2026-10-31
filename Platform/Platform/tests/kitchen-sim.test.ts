import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOTS, Cook, ln02Stew } from '../shared/kitchen/sim/bot.js';
import { Sim, eggStage, stageOf, type Op } from '../shared/kitchen/sim/index.js';
import { ITEM_RULES } from '../shared/kitchen/sim/index.js';
import { INGREDIENTS } from '../shared/kitchen/index.js';

/** كل مجال زمن = ±20% من الزمن الذي كتبه المالك (SIM-50) */
const within = (v: number, ref: number): boolean => v >= ref * 0.8 - 1e-9 && v <= ref * 1.2 + 1e-9;
const run = (slug: string) => {
  const c = new Cook();
  const marks = BOTS[slug]!(c);
  return { c, marks };
};
const worstBurn = (c: Cook): number => Math.max(0, ...[...c.sim.items.values()].map((i) => i.burn));

describe('SIM-50 — معايرة المحاكي على أزمنة وصفات المالك (±20%)', () => {
  it('شوفان 60 غ + حليب 300 غ نار هادئة 6 د مع التحريك (bk-04): ناضج كثيف كريمي بلا فوران', () => {
    const { c, marks } = run('bk-04');
    expect(within(marks['oats']!, 360)).toBe(true);
    expect(c.sim.events.some((e) => e.type === 'boil_over')).toBe(false);
    const oats = [...c.sim.items.values()].find((i) => i.ingredient === 'oats')!;
    expect(stageOf(oats)).toBe('done');
    expect(oats.waterG).toBeGreaterThan(150); // امتصّ معظم الحليب = قوام كثيف
  });
  it('سلق 100 غ بيض 8 د (bk-01/03/04, dn-03): صفار متماسك قابل للتقشير', () => {
    for (const slug of ['bk-01', 'bk-03', 'dn-03', 'bk-04']) {
      const { c, marks } = run(slug);
      expect(within(marks['egg']!, 480), slug).toBe(true);
      const egg = [...c.sim.items.values()].find((i) => i.ingredient === 'egg')!;
      expect(eggStage(egg.doneness)).toBe('medium');
      expect(egg.peeled).toBe(true);
      expect(egg.tMax).toBeGreaterThan(95);
    }
  });
  it('درجات البيض المسلوق (SIM-11): 6 د طري، 8 متوسط-صلب، 10–11 صلب، 13–14 زائد النضج', () => {
    const c = new Cook();
    c.pour('water', 700, 'pot_small');
    c.fire('pot_small', 1, 10);
    c.until(() => c.vs('pot_small').T >= 99.5, 600);
    const id = c.take('egg', 100);
    c.add(id, 'pot_small');
    const at: Record<number, string> = {};
    for (const m of [6, 8, 10.5, 13.5]) {
      c.until(() => false, 0);
      c.wait(m * 60 - (c.sim.t - c.it(id).loc.length * 0 - (c.sim.t - 0)) * 0 - 0);
      void m;
    }
    // نعيد التشغيل بنقاط قياس دقيقة
    const s = new Cook();
    s.pour('water', 700, 'pot_small');
    s.fire('pot_small', 1, 10);
    s.until(() => s.vs('pot_small').T >= 99.5, 600);
    const e = s.take('egg', 100);
    s.add(e, 'pot_small');
    const t0 = s.sim.t;
    for (const m of [6, 8, 10.5, 13.5]) {
      s.wait(m * 60 - (s.sim.t - t0));
      at[m] = eggStage(s.it(e).doneness);
    }
    expect(at).toEqual({ 6: 'soft', 8: 'medium', 10.5: 'hard', 13.5: 'overcooked' });
  });
  it('طماطم+بصل مكعبات 5 غ زيت دقيقتين (bk-02): طري لم يتحمّر. والأومليت متماسك وجبنته ذائبة بلا احتراق', () => {
    const { c, marks } = run('bk-02');
    expect(marks['tomatoDone']).toBeGreaterThanOrEqual(0.5);
    expect(marks['vegBrowning']).toBeLessThan(0.1);
    const egg = [...c.sim.items.values()].find((i) => i.ingredient === 'egg')!;
    const cheese = [...c.sim.items.values()].find((i) => i.ingredient === 'cheese')!;
    expect(egg.set).toBe(true);
    expect(cheese.melted).toBe(true);
    expect(egg.burn).toBeLessThan(0.1);
  });
  it('دجاج 200 غ مكعبات + 10 غ زيت 10 د (ln-01): ناضج ≥74°م محمّر خفيفًا؛ وأرز جاف 90 غ في ماء مملّح 15 د: طري', () => {
    const { c, marks } = run('ln-01');
    expect(within(marks['chicken']!, 600)).toBe(true);
    expect(within(marks['rice']!, 900)).toBe(true);
    const ch = [...c.sim.items.values()].find((i) => i.ingredient === 'chicken')!;
    expect(ch.tMax).toBeGreaterThanOrEqual(74);
    expect(ch.browning).toBeLessThan(0.8);
    expect(ch.burn).toBeLessThan(0.1);
    expect(stageOf([...c.sim.items.values()].find((i) => i.ingredient === 'rice')!)).toBe('done');
  });
  it('ln-03: باذنجان 300 غ يحمرّ بزيت ممتص وبلا حرق، ودجاج+بصل+ثوم 7 د ناضج ثم يتسبّك 7 د هادئة', () => {
    const { c, marks } = run('ln-03');
    expect(marks['fryBrowned']).toBeGreaterThanOrEqual(0.5);
    expect(marks['fryBurn']).toBeLessThan(0.2);
    expect(marks['fryOil']).toBeGreaterThanOrEqual(10);
    expect(within(marks['chicken']!, 420)).toBe(true);
    expect(marks['chickenAfter7']).toBeGreaterThan(0.7);
    expect(worstBurn(c)).toBeLessThan(0.3);
    for (const i of c.sim.items.values()) if (['chicken', 'eggplant', 'tomato', 'onion'].includes(i.ingredient)) expect(i.doneness, i.ingredient).toBeGreaterThanOrEqual(1);
  });
  it('شوربة dn-01 على نار هادئة: كل المكونات ناضجة والأرز مطبوخ في ≈25 د', () => {
    const { c, marks } = run('dn-01');
    expect(within(marks['allDone']!, 1500)).toBe(true);
    expect(worstBurn(c)).toBeLessThan(0.1);
  });
  it('دجاج 180 غ شرائح + 8 غ زيت 8 د (dn-02): ناضج محمّر', () => {
    const { c, marks } = run('dn-02');
    expect(within(marks['chicken']!, 480)).toBe(true);
    expect(marks['browning']).toBeGreaterThanOrEqual(0.2);
    expect(marks['burn']).toBeLessThan(0.2);
    void c;
  });
  it('أومليت dn-04: متماسك، جبنة ذائبة، غير محترق', () => {
    const { marks } = run('dn-04');
    expect(marks['melted']).toBe(1);
    expect(marks['burn']).toBeLessThan(0.1);
    expect(marks['eggSet']).toBeLessThan(420);
  });
  it('إيدام ln-02 (أوزان افتراضية): دجاج وفاصوليا ناضجان متسبّكان بلا حرق', () => {
    const c = new Cook();
    const r = ln02Stew(c);
    expect(r['beans']).toBeLessThan(2400);
    expect(r['maxBurn']).toBeLessThan(0.2);
    expect(r['unsafe']).toBe(0);
  });
});

describe('سلوكيات فيزيائية (SIM-10…18)', () => {
  it('أمان الدجاج: لا «ناضج» قبل قلب ≥ 74°م، والتقديم نيئًا يطلق تحذير unsafe', () => {
    const c = new Cook();
    const ch = c.take('chicken', 200);
    c.cut(ch, 'cubes', 'medium');
    c.pour('oil', 10, 'pan');
    c.fire('pan', 1, 6);
    c.wait(40);
    c.add(ch, 'pan');
    for (let i = 0; i < 40; i++) {
      c.wait(10);
      const it = c.it(ch);
      if (it.tMax < 74) expect(it.doneness).toBeLessThan(1);
    }
    const early = new Cook();
    const x = early.take('chicken', 200);
    early.cut(x, 'cubes', 'medium');
    early.pour('oil', 5, 'pan');
    early.fire('pan', 1, 6);
    early.wait(30);
    early.add(x, 'pan');
    early.wait(20);
    early.serve(['pan']);
    expect(early.sim.events.some((e) => e.type === 'unsafe')).toBe(true);
    expect(early.sim.snapshot().items.find((i) => i.id === x)!.unsafe).toBe(true);
  });
  it('التحمير يبدأ عند سطح ≥ 140°م وبلا ماء حر؛ الاحتراق > 180°م؛ وزيت يدخّن فوق نقطة الدخان', () => {
    const c = new Cook();
    c.pour('oil', 10, 'pan');
    c.fire('pan', 1, 10);
    c.until(() => c.vs('pan').smoking, 600);
    expect(c.vs('pan').T).toBeGreaterThan(205);
    expect(c.sim.events.some((e) => e.type === 'smoke')).toBe(true);
    const d = new Cook();
    const potato = d.take('potato', 100);
    d.cut(potato, 'cubes', 'small');
    d.pour('oil', 10, 'pan');
    d.fire('pan', 1, 10);
    d.wait(60);
    d.add(potato, 'pan');
    let wasBrownedWhileWet = false;
    for (let i = 0; i < 600; i++) {
      d.wait(1);
      const it = d.it(potato);
      if (d.vs('pan').waterG > 0.5 && it.browning > 0) wasBrownedWhileWet = true;
      if (it.tSurf < 140) expect(it.browning).toBeLessThanOrEqual(0.05 + it.browning * 0);
    }
    expect(wasBrownedWhileWet).toBe(false);
  });
  it('الثوم يحترق أسرع من البصل على الحرارة نفسها (burnK)', () => {
    const burnIn = (ing: string): number => {
      const c = new Cook();
      const x = c.take(ing, 10);
      c.cut(x, 'minced');
      c.pour('oil', 5, 'pan');
      c.fire('pan', 1, 10);
      c.wait(70);
      c.add(x, 'pan');
      c.stir('pan');
      c.wait(20);
      return c.it(x).burn;
    };
    expect(burnIn('garlic')).toBeGreaterThan(burnIn('onion'));
  });
  it('الحليب يفور بلا تحريك على لهب عالٍ (boil_over)، ولا يفور مع التحريك ولا مع إطفاء اللهب', () => {
    const milk = (stir: boolean, off: boolean): number => {
      const c = new Cook();
      c.pour('milk', 300, 'pot_small');
      c.fire('pot_small', 1, 8);
      c.until(() => c.vs('pot_small').T >= 96, 900);
      if (off) c.level(1, 0);
      for (let i = 0; i < 12; i++) {
        c.wait(5);
        if (stir) c.stir('pot_small');
      }
      return c.sim.events.filter((e) => e.type === 'boil_over').length;
    };
    expect(milk(false, false)).toBeGreaterThan(0);
    expect(milk(true, false)).toBe(0);
    expect(milk(false, true)).toBe(0);
  });
  it('الباذنجان: ترشيش الملح 5 د ثم الشطف يخفّض امتصاص الزيت (SIM-14)، والشطف المبكر لا يُحتسب', () => {
    const oilTaken = (salted: boolean, restS: number): number => {
      const c = new Cook();
      const e = c.take('eggplant', 300);
      c.cut(e, 'slices');
      if (salted) {
        c.prep(e, 'salt_rest');
        c.wait(restS);
        c.prep(e, 'rinse_dry');
      }
      c.pour('oil', 250, 'pan');
      c.fire('pan', 1, 8);
      c.wait(40);
      c.add(e, 'pan');
      c.untilStirring('pan', () => c.it(e).browning >= 0.3, 900, 20);
      return c.it(e).oilG;
    };
    const plain = oilTaken(false, 0);
    const rested = oilTaken(true, 300);
    const early = oilTaken(true, 60);
    expect(rested).toBeLessThan(plain * 0.7);
    expect(early).toBeGreaterThan(rested);
  });
  it('قدر الضغط (SIM-16): صفير بعد بناء الضغط، ينضج الدجاج في ≤ نصف الزمن بلا تحمير، ولا يُفتح قبل الإطلاق', () => {
    // زمن الطهي = من بلوغ ضغط التشغيل (صفير) أو الغليان في القدر العادي إلى نضج الدجاج (SIM-16: ≈ ⅓–½)
    const time = (vessel: string, level: number, lid: boolean): { done: number; brown: number; whistled: boolean; c: Cook } => {
      const c = new Cook();
      const ch = c.take('chicken', 180);
      c.cut(ch, 'cubes', 'medium');
      c.pour('water', 300, vessel);
      c.add(ch, vessel);
      if (lid) c.do({ type: 'lid', vessel, on: true });
      c.fire(vessel, 1, level);
      const reached = (): boolean => (lid ? c.vs(vessel).pressure === 'holding' : c.vs(vessel).T >= 99.5);
      c.until(reached, 3000);
      const t0 = c.sim.t;
      c.until(() => c.it(ch).doneAt !== null, 3000);
      return { done: c.it(ch).doneAt! - t0, brown: c.it(ch).browning, whistled: c.sim.events.some((e) => e.type === 'whistle'), c };
    };
    const pc = time('pressure_cooker', 6, true);
    const pot = time('pot_small', 6, false);
    expect(pc.whistled).toBe(true);
    expect(pc.done).toBeLessThanOrEqual(pot.done * 0.6);
    expect(pc.done).toBeGreaterThan(pot.done * 0.25);
    expect(pc.brown).toBe(0);
    expect(() => pc.c.do({ type: 'lid', vessel: 'pressure_cooker', on: false })).toThrow(/الضغط/);
    pc.c.do({ type: 'release', vessel: 'pressure_cooker', mode: 'quick' });
    pc.c.wait(40);
    expect(pc.c.vs('pressure_cooker').pressure).toBe('off');
    expect(() => pc.c.do({ type: 'lid', vessel: 'pressure_cooker', on: false })).not.toThrow();
  });
  it('التوست: أربع درجات (فاتح، ذهبي، داكن، محروق) تصاعدية', () => {
    const lv = (level: 1 | 2 | 3 | 4): { b: number; burn: number } => {
      const c = new Cook();
      const t = c.take('toast', 40);
      c.do({ type: 'toast', item: t, level });
      c.wait(200);
      return { b: c.it(t).browning, burn: c.it(t).burn };
    };
    const r = [1, 2, 3, 4].map((l) => lv(l as 1 | 2 | 3 | 4));
    expect(r.map((x) => x.b)).toEqual([...r.map((x) => x.b)].sort((a, b) => a - b));
    expect(r[1]!.b).toBeGreaterThan(0.35);
    expect(r[1]!.b).toBeLessThan(0.6);
    expect(r[3]!.burn).toBeGreaterThanOrEqual(0.5);
    expect(r[1]!.burn).toBe(0);
  });
  it('الالتصاق: وعاء ساخن جاف بلا تحريك يحرق القطعة (SIM-18) ويُنذر', () => {
    const c = new Cook();
    const x = c.take('potato', 100);
    c.cut(x, 'cubes', 'small');
    c.fire('pan', 1, 10);
    c.wait(120);
    c.add(x, 'pan');
    c.wait(120);
    expect(c.sim.events.some((e) => e.type === 'stuck' || e.type === 'burn')).toBe(true);
    expect(c.it(x).burn).toBeGreaterThan(0.2);
  });
  it('كل مكوّن من الـ26 له قاعدة طهي، والحرارة النوعية والرطوبة في مجال معقول', () => {
    for (const i of INGREDIENTS) {
      const r = ITEM_RULES[i.slug];
      expect(r, i.slug).toBeTruthy();
      expect(r!.cp).toBeGreaterThan(0.5);
      expect(r!.moisture0).toBeGreaterThanOrEqual(0);
      expect(r!.moisture0).toBeLessThanOrEqual(1);
      expect(r!.release).toBeGreaterThanOrEqual(0);
      expect(r!.release).toBeLessThanOrEqual(1);
    }
  });
});

describe('الحتمية وإعادة التشغيل (SIM-02/51، TST-04)', () => {
  const dir = path.join(__dirname, 'replay');
  const hash = (o: unknown): string => {
    let h = 2166136261;
    const s = JSON.stringify(o);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h.toString(16);
  };
  const final = (s: Sim) => ({ ...s.snapshot(), events: s.events });
  for (const slug of Object.keys(BOTS)) {
    it(`سجل ذهبي ${slug}: إعادة تشغيله ببت ببت تعطي نفس الحالة`, () => {
      const c = new Cook();
      const marks = BOTS[slug]!(c);
      const file = path.join(dir, `${slug}.json`);
      const doc = { slug, seed: 1, endT: c.sim.t, snapshotHash: hash(final(c.sim)), served: c.sim.served, marks, ops: c.ops };
      if (process.env['UPDATE_REPLAYS'] === '1') {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(doc) + '\n');
      }
      const stored = JSON.parse(fs.readFileSync(file, 'utf8')) as typeof doc;
      expect(stored.ops.length).toBeGreaterThan(8);
      const replayed = Sim.replay(stored.ops as Op[], stored.seed, stored.endT);
      expect(hash(final(replayed))).toBe(stored.snapshotHash);
      expect(JSON.stringify(replayed.served)).toBe(JSON.stringify(stored.served));
      // الأسطر في الملف ذاتها لما يولّده الطاهي الآلي الآن: أي تغيير في المحاكي أو المعايرة يكسر هذا الاختبار عمدًا
      expect(hash(final(c.sim))).toBe(stored.snapshotHash);
    });
  }
  it('التجزئة لا تتأثر بحجم خطوات التقدّم (advanceTo على شبكة DT ثابتة)', () => {
    const ops = JSON.parse(fs.readFileSync(path.join(dir, 'bk-03.json'), 'utf8')).ops as Op[];
    const a = Sim.replay(ops, 1, 900);
    const b = new Sim(1);
    for (const op of ops) {
      for (let t = b.t; t < op.t; t += 0.7) b.advanceTo(Math.min(op.t, t + 0.7));
      b.apply(op);
    }
    b.advanceTo(900);
    expect(JSON.stringify(b.snapshot().items)).toBe(JSON.stringify(a.snapshot().items));
  });
  it('الأداء (PERF-04): خطوة المحاكاة ≤ 2ms لكل 0.1 ث حتى بكل المعدات تعمل (ساعة لعب)', () => {
    const c = new Cook();
    BOTS['dn-01']!(c);
    c.fire('pan', 3, 8);
    c.pour('oil', 10, 'pan');
    const t0 = performance.now();
    const steps = 36000; // ساعة لعب
    c.sim.advance(steps * 0.1);
    const per = (performance.now() - t0) / steps;
    expect(per).toBeLessThan(2);
  });
});
