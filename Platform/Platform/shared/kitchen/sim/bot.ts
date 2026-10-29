/**
 * «الطاهي الآلي»: يلعب وصفات المالك خطوة بخطوة على المحاكي ويسجّل سجل العمليات.
 * يُستعمل لإنتاج سجلات إعادة التشغيل الذهبية (SIM-51) ولاختبار معايرة SIM-50 وAC-05/06 ولعرض تجريبي؛ ليس جزءًا من اللعب الحر.
 * معرّفات القطع حتمية (i1, i2…) فيعيد التشغيل السجل نفسه بالبت.
 */
import { Sim, type CutShape, type CutSize, type Op, type PrepAction } from './engine.js';

type OpIn = Op extends infer O ? (O extends { t: number } ? Omit<O, 't'> : never) : never;

export class Cook {
  readonly sim: Sim;
  readonly ops: Op[] = [];
  private n = 0;
  constructor(seed = 1) {
    this.sim = new Sim(seed);
  }
  do(op: OpIn): void {
    const full = { ...op, t: this.sim.t } as Op;
    this.sim.apply(full);
    this.ops.push(full);
  }
  wait(seconds: number): void {
    this.sim.advance(seconds);
  }
  /** ينتظر حتى يتحقق الشرط (بحد أقصى) ويعيد الثواني المنتظرة */
  until(pred: () => boolean, maxSeconds = 1800): number {
    const t0 = this.sim.t;
    while (!pred() && this.sim.t - t0 < maxSeconds) this.sim.advance(1);
    return this.sim.t - t0;
  }
  take(ingredient: string, grams: number): string {
    const id = `i${++this.n}`;
    this.do({ type: 'take', id, ingredient, grams });
    return id;
  }
  prep(item: string, action: PrepAction, shape?: CutShape, size?: CutSize): void {
    this.do({ type: 'prep', item, action, ...(shape ? { shape } : {}), ...(size ? { size } : {}) });
  }
  cut(item: string, shape: CutShape, size?: CutSize): void {
    this.prep(item, 'cut', shape, size);
  }
  add(item: string, vessel: string): void {
    this.do({ type: 'add', item, vessel });
  }
  pour(ingredient: 'oil' | 'milk' | 'water', grams: number, vessel: string): void {
    this.do({ type: 'pour', ingredient, grams, vessel });
  }
  season(ingredient: 'salt' | 'cumin' | 'sugar', grams: number, target: string): void {
    this.do({ type: 'season', ingredient, grams, target });
  }
  /** يضع الوعاء على الموقد ويضبط اللهب */
  fire(vessel: string, burner: 1 | 2 | 3 | 4, level: number): void {
    this.do({ type: 'place', vessel, burner });
    this.do({ type: 'heat', burner, level });
  }
  level(burner: 1 | 2 | 3 | 4, level: number): void {
    this.do({ type: 'heat', burner, level });
  }
  stir(vessel: string): void {
    this.do({ type: 'stir', vessel });
  }
  /** ينتظر مع تحريك دوري */
  waitStirring(vessel: string, seconds: number, every = 15): void {
    let left = seconds;
    while (left > 0) {
      const d = Math.min(every, left);
      this.wait(d);
      left -= d;
      this.stir(vessel);
    }
  }
  lidOn(vessel: string): void {
    this.do({ type: 'lid', vessel, on: true });
  }
  /** ينتظر حتى الشرط مع تحريك دوري */
  untilStirring(vessel: string, pred: () => boolean, maxSeconds: number, every = 15): number {
    const t0 = this.sim.t;
    while (!pred() && this.sim.t - t0 < maxSeconds) {
      this.wait(every);
      this.stir(vessel);
    }
    return this.sim.t - t0;
  }
  serve(from: string[], plate = 'plate_1'): void {
    this.do({ type: 'serve', from, plate });
  }
  it(id: string) {
    return this.sim.items.get(id)!;
  }
  vs(id: string) {
    return this.sim.vessels.get(id)!;
  }

  /* ───── وصفات فرعية ───── */
  /** سلق بيض: يسخّن الماء حتى الغليان ثم يضيف البيض ويتركه المدة (دقائق) ثم يقشّر ويقطّع شرائح */
  boilEggs(grams: number, minutes: number, burner: 1 | 2 | 3 | 4 = 1, vessel = 'pot_small'): { id: string; addedAt: number } {
    this.pour('water', 700, vessel);
    this.fire(vessel, burner, 10);
    this.until(() => this.vs(vessel).T >= 99.5, 600);
    const id = this.take('egg', grams);
    this.add(id, vessel);
    const addedAt = this.sim.t;
    this.wait(minutes * 60);
    this.do({ type: 'remove', item: id });
    this.level(burner, 0);
    this.do({ type: 'place', vessel, burner: 0 });
    this.do({ type: 'discard', target: vessel });
    this.prep(id, 'peel');
    this.cut(id, 'slices');
    return { id, addedAt };
  }
  /** سلق أرز في قدر كبير بماء مملّح؛ يعيد وقت الإضافة */
  boilRice(grams: number, minutes: number, burner: 1 | 2 | 3 | 4 = 2): { id: string; addedAt: number } {
    this.pour('water', 1400, 'pot_large');
    this.season('salt', 8, 'pot_large');
    this.fire('pot_large', burner, 10);
    this.until(() => this.vs('pot_large').T >= 99.5, 900);
    const id = this.take('rice', grams);
    this.add(id, 'pot_large');
    const addedAt = this.sim.t;
    this.level(burner, 6);
    this.wait(minutes * 60 * 0.9);
    this.until(() => this.it(id).doneAt !== null, minutes * 60 * 0.4);
    this.wait(20);
    this.do({ type: 'drain', vessel: 'pot_large' });
    this.level(burner, 0);
    return { id, addedAt };
  }
  toast(grams: number, level: 1 | 2 | 3 | 4 = 2): string {
    const id = this.take('toast', grams);
    this.do({ type: 'toast', item: id, level });
    this.wait(40 + 30 * level + 2);
    return id;
  }
}

export interface BotResult { cook: Cook; plated: string[]; marks: Record<string, number> }

/** وصفات المالك بالأوزان الأصلية. marks = أزمنة مرجعية للمعايرة (ثوانٍ من بدء الخطوة المعنية). */
export const BOTS: Readonly<Record<string, (c: Cook) => Record<string, number>>> = {
  'bk-01': (c) => {
    const bowl = 'bowl';
    const oats = c.take('oats', 40);
    c.add(oats, bowl);
    const y = c.take('yogurt', 300);
    c.add(y, bowl);
    const egg = c.boilEggs(100, 8);
    const banana = c.take('banana', 50);
    c.prep(banana, 'peel');
    c.cut(banana, 'slices');
    c.add(egg.id, bowl);
    c.add(banana, bowl);
    const honey = c.take('honey', 10);
    c.add(honey, bowl);
    c.stir(bowl);
    c.serve([bowl]);
    return { egg: c.it(egg.id).doneAt! - egg.addedAt };
  },
  'bk-02': (c) => {
    const eggs = c.take('egg', 150);
    c.prep(eggs, 'whisk');
    const tomato = c.take('tomato', 50);
    c.cut(tomato, 'diced', 'small');
    const onion = c.take('onion', 30);
    c.prep(onion, 'peel');
    c.cut(onion, 'diced', 'small');
    c.pour('oil', 5, 'pan');
    c.fire('pan', 1, 6);
    c.wait(40);
    c.add(tomato, 'pan');
    c.add(onion, 'pan');
    const t0 = c.sim.t;
    c.waitStirring('pan', 120, 20);
    const veg = { time: c.sim.t - t0, tomatoDone: c.it(tomato).doneness, browning: Math.max(c.it(tomato).browning, c.it(onion).browning) };
    c.add(eggs, 'pan');
    const cheese = c.take('cheese', 30);
    c.add(cheese, 'pan');
    const tEgg = c.sim.t;
    c.until(() => c.it(eggs).doneness >= 1, 400);
    const toast = c.toast(60);
    c.serve(['pan', toast]);
    return { vegTime: veg.time, tomatoDone: veg.tomatoDone, vegBrowning: veg.browning, eggSetAfter: c.it(eggs).doneAt! - tEgg };
  },
  'bk-03': (c) => {
    const toast = c.toast(80);
    const egg = c.boilEggs(100, 8);
    const cheese = c.take('cheese', 40);
    c.pour('oil', 5, 'plate_1');
    c.add(cheese, 'plate_1');
    c.add(egg.id, 'plate_1');
    c.serve([toast, 'plate_1']);
    return { egg: c.it(egg.id).doneAt! - egg.addedAt };
  },
  'bk-04': (c) => {
    const pot = 'pot_small';
    const oats = c.take('oats', 60);
    c.pour('milk', 300, pot);
    c.add(oats, pot);
    c.fire(pot, 1, 6);
    const t0 = c.sim.t;
    c.waitStirring(pot, 360, 10);
    c.until(() => c.it(oats).doneAt !== null, 180);
    const oatsDone = c.it(oats).doneAt === null ? 9999 : c.it(oats).doneAt! - t0;
    c.level(1, 0);
    c.do({ type: 'place', vessel: pot, burner: 0 });
    const egg = c.boilEggs(100, 8, 2, 'pot_large');
    const banana = c.take('banana', 60);
    c.prep(banana, 'peel');
    c.cut(banana, 'slices');
    c.add(banana, pot);
    c.add(egg.id, pot);
    const honey = c.take('honey', 10);
    c.add(honey, pot);
    c.stir(pot);
    c.serve([pot]);
    return { oats: oatsDone, egg: c.it(egg.id).doneAt! - egg.addedAt };
  },
  'ln-01': (c) => {
    const chicken = c.take('chicken', 200);
    c.cut(chicken, 'cubes', 'large');
    c.season('salt', 2, chicken);
    c.season('cumin', 1, chicken);
    // الأرز بالتوازي على موقد ثانٍ: يُسخَّن الماء أولًا
    c.pour('water', 1400, 'pot_large');
    c.season('salt', 8, 'pot_large');
    c.fire('pot_large', 2, 10);
    c.pour('oil', 10, 'pan');
    c.fire('pan', 1, 5);
    c.wait(45);
    c.add(chicken, 'pan');
    const t0 = c.sim.t;
    c.until(() => c.vs('pot_large').T >= 99.5, 900);
    const r = c.take('rice', 90);
    c.add(r, 'pot_large');
    const tr = c.sim.t;
    c.level(2, 6);
    c.untilStirring('pan', () => c.it(chicken).doneAt !== null, 900, 30);
    c.level(1, 0);
    const chickenAt = c.it(chicken).doneAt === null ? 9999 : c.it(chicken).doneAt! - t0;
    c.until(() => c.it(r).doneAt !== null, 1200);
    c.wait(30);
    c.do({ type: 'drain', vessel: 'pot_large' });
    c.level(2, 0);
    const carrot = c.take('carrot', 50);
    c.prep(carrot, 'peel');
    c.prep(carrot, 'grate');
    const cucumber = c.take('cucumber', 70);
    c.cut(cucumber, 'slices');
    const toast = c.toast(40);
    c.serve(['pan', 'pot_large', carrot, cucumber, toast]);
    return { chicken: chickenAt, rice: c.it(r).doneAt! - tr };
  },
  'ln-03': (c) => {
    const egg = c.take('eggplant', 300);
    c.cut(egg, 'slices');
    c.prep(egg, 'salt_rest');
    c.season('salt', 3, egg);
    c.wait(300);
    c.prep(egg, 'rinse_dry');
    c.pour('oil', 16, 'pan');
    c.fire('pan', 1, 9);
    c.wait(40);
    c.add(egg, 'pan');
    const tf = c.sim.t;
    c.untilStirring('pan', () => c.it(egg).browning >= 0.5, 900, 20);
    const fry = { browned: c.it(egg).browning, burn: c.it(egg).burn, oil: c.it(egg).oilG, time: c.sim.t - tf };
    c.do({ type: 'remove', item: egg });
    c.level(1, 0);
    c.do({ type: 'place', vessel: 'pan', burner: 0 });
    const chicken = c.take('chicken', 180);
    c.cut(chicken, 'cubes', 'small');
    const onion = c.take('onion', 35);
    c.prep(onion, 'peel');
    c.cut(onion, 'diced', 'small');
    const garlic = c.take('garlic', 5);
    c.prep(garlic, 'peel');
    c.prep(garlic, 'mash');
    c.pour('water', 40, 'pot_small');
    c.fire('pot_small', 2, 10);
    c.add(onion, 'pot_small');
    c.add(garlic, 'pot_small');
    c.add(chicken, 'pot_small');
    const t3 = c.sim.t;
    c.waitStirring('pot_small', 420, 20);
    const chickenAfter7 = c.it(chicken).doneness;
    const tomato = c.take('tomato', 100);
    c.cut(tomato, 'diced', 'medium');
    c.add(tomato, 'pot_small');
    c.add(egg, 'pot_small');
    c.pour('water', 40, 'pot_small');
    c.level(2, 2);
    const t4 = c.sim.t;
    c.waitStirring('pot_small', 420, 20);
    c.level(2, 0);
    const rice = c.boilRice(40, 15, 3);
    const toast = c.toast(40);
    c.serve(['pot_small', 'pot_large', toast]);
    return { fryBrowned: fry.browned, fryBurn: fry.burn, fryOil: fry.oil, chickenAfter7, chicken: c.it(chicken).doneAt! - t3, t4, rice: c.it(rice.id).doneAt! - rice.addedAt };
  },
  'dn-01': (c) => {
    const pot = 'pot_large';
    const chicken = c.take('chicken', 180);
    c.cut(chicken, 'cubes', 'small');
    c.pour('water', 900, pot);
    c.add(chicken, pot);
    const carrot = c.take('carrot', 60);
    c.prep(carrot, 'peel');
    c.cut(carrot, 'diced', 'small');
    const onion = c.take('onion', 50);
    c.prep(onion, 'peel');
    c.cut(onion, 'diced', 'small');
    const tomato = c.take('tomato', 100);
    c.cut(tomato, 'diced', 'small');
    const potato = c.take('potato', 100);
    c.prep(potato, 'peel');
    c.cut(potato, 'cubes', 'small');
    for (const i of [carrot, onion, tomato, potato]) c.add(i, pot);
    const rice = c.take('rice', 30);
    c.add(rice, pot);
    c.season('cumin', 3, pot);
    c.fire(pot, 1, 10);
    c.until(() => c.vs(pot).T >= 99.5, 1200);
    c.level(1, 2);
    const ids = [chicken, carrot, onion, tomato, potato, rice];
    const t0 = c.sim.t;
    c.waitStirring(pot, 1500, 60);
    const per = Object.fromEntries(ids.map((i) => [c.it(i).ingredient, c.it(i).doneAt === null ? 99999 : c.it(i).doneAt! - t0]));
    const done = Math.max(...Object.values(per));
    const toast = c.toast(50);
    c.serve([pot, toast]);
    return { allDone: done };
  },
  'dn-02': (c) => {
    const chicken = c.take('chicken', 180);
    c.cut(chicken, 'slices');
    c.pour('oil', 8, 'pan');
    c.fire('pan', 1, 7);
    c.wait(45);
    c.add(chicken, 'pan');
    const t0 = c.sim.t;
    c.waitStirring('pan', 480, 40);
    c.untilStirring('pan', () => c.it(chicken).doneAt !== null, 240, 40);
    c.level(1, 0);
    const out = { chicken: c.it(chicken).doneAt === null ? 9999 : c.it(chicken).doneAt! - t0, browning: c.it(chicken).browning, burn: c.it(chicken).burn };
    const cuc = c.take('cucumber', 100);
    c.cut(cuc, 'cubes', 'medium');
    const tom = c.take('tomato', 100);
    c.cut(tom, 'cubes', 'medium');
    const lemon = c.take('lemon', 20);
    c.prep(lemon, 'juice');
    const rice = c.boilRice(40, 15, 2);
    const toast = c.toast(40);
    c.serve(['pan', cuc, tom, lemon, 'pot_large', toast]);
    void rice;
    return out;
  },
  'dn-03': (c) => {
    const egg = c.boilEggs(100, 8);
    const cuc = c.take('cucumber', 70);
    c.prep(cuc, 'grate');
    const yog = c.take('yogurt', 300);
    c.add(yog, 'bowl');
    c.add(cuc, 'bowl');
    const garlic = c.take('garlic', 5);
    c.prep(garlic, 'peel');
    c.prep(garlic, 'mash');
    c.add(garlic, 'bowl');
    c.season('salt', 2, 'bowl');
    c.pour('oil', 8, 'bowl');
    const cheese = c.take('cheese', 30);
    c.add(cheese, 'bowl');
    c.add(egg.id, 'bowl');
    const toast = c.toast(40);
    c.serve(['bowl', toast]);
    return { egg: c.it(egg.id).doneAt! - egg.addedAt };
  },
  'dn-04': (c) => {
    const eggs = c.take('egg', 150);
    c.prep(eggs, 'whisk');
    c.pour('oil', 5, 'pan');
    c.fire('pan', 1, 5);
    c.wait(30);
    c.add(eggs, 'pan');
    const cheese = c.take('cheese', 30);
    c.add(cheese, 'pan');
    const t0 = c.sim.t;
    c.until(() => c.it(eggs).doneness >= 1, 600);
    const setAt = c.sim.t - t0;
    c.level(1, 0);
    const yog = c.take('yogurt', 150);
    const cuc = c.take('cucumber', 50);
    c.cut(cuc, 'slices');
    const toast = c.toast(40);
    c.serve(['pan', yog, cuc, toast]);
    return { eggSet: setAt, melted: +c.it(cheese).melted, burn: c.it(eggs).burn };
  },
};

/** إيدام الدجاج بالفاصوليا (ln-02): أوزان افتراضية لأن وصفة المالك بلا أوزان (DEF-01) — للمعايرة فقط، لا تُحفظ كبطاقة أصلية */
export function ln02Stew(c: Cook): Record<string, number> {
  const onion = c.take('onion', 40);
  c.prep(onion, 'peel');
  c.cut(onion, 'diced', 'small');
  const garlic = c.take('garlic', 5);
  c.prep(garlic, 'peel');
  c.prep(garlic, 'mash');
  c.pour('oil', 5, 'pot_small');
  c.fire('pot_small', 1, 6);
  c.wait(30);
  c.add(onion, 'pot_small');
  c.add(garlic, 'pot_small');
  c.waitStirring('pot_small', 60, 15);
  const chicken = c.take('chicken', 150);
  c.cut(chicken, 'cubes', 'small');
  c.add(chicken, 'pot_small');
  c.pour('water', 20, 'pot_small');
  c.untilStirring('pot_small', () => c.it(chicken).doneness >= 0.3, 600, 15);
  const beans = c.take('green_beans', 120);
  c.cut(beans, 'sticks', 'medium');
  const tomato = c.take('tomato', 80);
  c.cut(tomato, 'diced', 'medium');
  const paste = c.take('tomato_paste', 15);
  for (const i of [beans, tomato, paste]) c.add(i, 'pot_small');
  c.pour('water', 60, 'pot_small');
  c.level(1, 2);
  const t0 = c.sim.t;
  c.untilStirring('pot_small', () => c.it(beans).doneAt !== null && c.it(chicken).doneAt !== null, 2400, 30);
  const ids = [onion, garlic, chicken, beans, tomato, paste];
  c.serve(['pot_small']);
  return { beans: c.it(beans).doneAt === null ? 99999 : c.it(beans).doneAt! - t0, chicken: c.it(chicken).doneAt! , maxBurn: Math.max(...ids.map((i) => c.it(i).burn)), unsafe: +(c.it(chicken).tMax < 74) };
}
