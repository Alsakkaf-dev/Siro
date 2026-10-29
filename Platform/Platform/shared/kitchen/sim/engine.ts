/**
 * محرك محاكاة الطهي (SIM): نقي وحتمي، بلا DOM ولا شبكة ولا عشوائية في النتائج (يعمل في Worker وفي vitest بالمخرجات نفسها).
 * سجل العمليات (op-log) هو الحقيقة الوحيدة: إعادة تشغيله تعطي الحالة نفسها بالبت (SIM-02).
 */
import { INGREDIENT_BY_SLUG } from '../data/ingredients.js';
import { ITEM_RULES } from './itemRules.js';
import {
  BOIL_C, BROWN_FULL_S, BURNER_W_PER_LEVEL, BURN_C, BURN_FULL_S, CARAMEL_C, CHEESE_MELT_C, CP_MILK, CP_OIL, CP_WATER, CUT_FACTOR, DT, JUICE_RELEASE_PER_S, LATENT_EVAP, MAILLARD_C, MILK_BOIL_OVER_LOSS, MILK_FOAM_C, MILK_FOAM_S,
  OATS_ABSORB_G_PER_G, OIL_SMOKE_C, PRESSURE_C, PRESSURE_RELEASE_NATURAL_S, PRESSURE_RELEASE_QUICK_S, PRESSURE_WHISTLE_C, Q10, RICE_ABSORB_G_PER_G, SALTED_OIL_FACTOR, SALT_REST_S, STICK_C, STICK_NO_STIR_S, SURFACE_WET_G, T_AMBIENT,
  VESSEL, VESSEL_MAX_C, type VesselKind,
} from './rules.js';

export type CutShape = 'slices' | 'cubes' | 'sticks' | 'minced' | 'diced' | 'grated' | 'mashed';
export type CutSize = 'small' | 'medium' | 'large';
export type PrepAction = 'peel' | 'wash' | 'cut' | 'mash' | 'whisk' | 'grate' | 'juice' | 'salt_rest' | 'rinse_dry' | 'trim';

export type Op = { t: number } & (
  | { type: 'take'; id: string; ingredient: string; grams: number }
  | { type: 'prep'; item: string; action: PrepAction; shape?: CutShape; size?: CutSize }
  | { type: 'pour'; ingredient: 'oil' | 'milk' | 'water'; grams: number; vessel: string }
  | { type: 'season'; ingredient: 'salt' | 'cumin' | 'sugar'; grams: number; target: string }
  | { type: 'add'; item: string; vessel: string }
  | { type: 'remove'; item: string }
  | { type: 'place'; vessel: string; burner: 1 | 2 | 3 | 4 | 0 }
  | { type: 'heat'; burner: 1 | 2 | 3 | 4; level: number }
  | { type: 'stir'; vessel: string }
  | { type: 'lid'; vessel: string; on: boolean }
  | { type: 'toast'; item: string; level: 1 | 2 | 3 | 4 }
  | { type: 'release'; vessel: string; mode: 'natural' | 'quick' }
  | { type: 'drain'; vessel: string }
  | { type: 'serve'; from: string[]; plate: string }
  | { type: 'discard'; target: string }
);

export type Stage = 'raw' | 'undercooked' | 'done' | 'overdone' | 'burnt';
export interface Item {
  id: string; ingredient: string; g0: number; g: number;
  cut: { shape: CutShape; size: CutSize | null } | null;
  peeled: boolean; washed: boolean; whisked: boolean; juiced: boolean; mashed: boolean;
  saltG: number; seasonG: number; saltRestAt: number | null; rinsed: boolean;
  tCore: number; tSurf: number; tMax: number;
  moisture: number; doneness: number; browning: number; burn: number;
  oilG: number; waterG: number; milkAbs: number; melted: boolean; set: boolean;
  loc: string; doneAt: number | null; burnAt: number | null;
  toast: { level: number; started: number; target: number; dur: number } | null;
}
export interface Vessel {
  id: string; kind: VesselKind; T: number; oilG: number; waterG: number; milkG: number; milkEvap: number; saltG: number;
  lid: boolean; burner: number; items: string[]; lastStir: number; foam: number;
  pressure: 'off' | 'building' | 'holding' | 'releasing'; pressureSince: number; smoking: boolean; whistledAt: number | null;
}
export type EventType = 'done' | 'burn' | 'smoke' | 'boil_over' | 'whistle' | 'toast_pop' | 'stuck' | 'rinse_early' | 'pressure_released' | 'unsafe';
export interface SimEvent { t: number; type: EventType; ref: string }
export interface Served { plate: string; byIngredient: Record<string, number>; itemIds: string[]; at: number }
export interface Snapshot {
  t: number; burners: number[];
  vessels: (Omit<Vessel, 'items'> & { items: string[] })[];
  items: (Item & { stage: Stage; unsafe: boolean })[];
  events: SimEvent[]; waste: Record<string, number>; served: Served[]; taken: Record<string, number>;
}

export class SimError extends Error {}

const sizeKey = (c: Item['cut']): string => {
  if (!c) return 'whole';
  const k = c.size ? `${c.shape}_${c.size}` : c.shape;
  return k in CUT_FACTOR ? k : c.shape in CUT_FACTOR ? c.shape : 'whole';
};
const cutFactor = (it: Item): number => CUT_FACTOR[sizeKey(it.cut)] ?? 1;

export function stageOf(it: Item): Stage {
  const r = ITEM_RULES[it.ingredient];
  if (it.burn >= 0.5) return 'burnt';
  if (!r || !r.cookable) return 'raw';
  if (it.doneness >= 2) return 'overdone';
  if (it.doneness >= 1) return 'done';
  return it.doneness > 0.12 ? 'undercooked' : 'raw';
}
/** SIM-11: درجات البيض المسلوق بحسب النضج (6 د طري، 8 د متوسط-صلب، 10–11 د صلب، >12 د زائد النضج) */
export type EggStage = 'raw' | 'soft' | 'medium' | 'hard' | 'overcooked';
export const eggStage = (d: number): EggStage => (d < 0.55 ? 'raw' : d < 0.95 ? 'soft' : d < 1.3 ? 'medium' : d < 2 ? 'hard' : 'overcooked');
/** SIM-10: الدجاج لا يُقبل ناضجًا قبل قلب ≥ 74°م */
export const isUnsafe = (it: Item): boolean => it.ingredient === 'chicken' && it.tMax < 74 && it.loc !== 'board';

export class Sim {
  t = 0;
  readonly seed: number;
  items = new Map<string, Item>();
  vessels = new Map<string, Vessel>();
  burners = [0, 0, 0, 0];
  events: SimEvent[] = [];
  waste: Record<string, number> = {};
  taken: Record<string, number> = {};
  served: Served[] = [];
  private n = 0;

  constructor(seed = 1) {
    this.seed = seed;
    // معدّات المشهد الافتراضية: معرّفها = نوعها (pan، pot_small…) ما لم يُنشأ غيرها
    for (const k of Object.keys(VESSEL) as VesselKind[]) if (k !== 'plate') this.addVessel(k, k);
    this.addVessel('plate_1', 'plate');
  }

  addVessel(id: string, kind: VesselKind): void {
    this.vessels.set(id, { id, kind, T: T_AMBIENT, oilG: 0, waterG: 0, milkG: 0, milkEvap: 0, saltG: 0, lid: false, burner: 0, items: [], lastStir: -1e9, foam: 0, pressure: 'off', pressureSince: 0, smoking: false, whistledAt: null });
  }

  private ev(type: EventType, ref: string): void {
    this.events.push({ t: Math.round(this.t * 10) / 10, type, ref });
    if (this.events.length > 400) this.events.splice(0, 100);
  }
  private item(id: string): Item {
    const it = this.items.get(id);
    if (!it || it.loc === 'gone') throw new SimError(`قطعة غير موجودة: ${id}`);
    return it;
  }
  private vessel(id: string): Vessel {
    const v = this.vessels.get(id);
    if (!v) throw new SimError(`وعاء غير موجود: ${id}`);
    return v;
  }

  /* ───── العمليات ───── */
  apply(op: Op): void {
    if (op.t > this.t + 1e-9) this.advanceTo(op.t);
    switch (op.type) {
      case 'take': {
        if (!INGREDIENT_BY_SLUG.has(op.ingredient)) throw new SimError('مكوّن خارج القائمة المقفلة');
        if (!(op.grams > 0) || op.grams > 5000) throw new SimError('كمية غير صالحة');
        if (this.items.has(op.id)) throw new SimError(`معرّف مكرر: ${op.id}`);
        const r = ITEM_RULES[op.ingredient]!;
        this.items.set(op.id, { id: op.id, ingredient: op.ingredient, g0: op.grams, g: op.grams, cut: null, peeled: false, washed: false, whisked: false, juiced: false, mashed: false, saltG: 0, seasonG: 0, saltRestAt: null, rinsed: false, tCore: T_AMBIENT, tSurf: T_AMBIENT, tMax: T_AMBIENT, moisture: 1, doneness: 0, browning: 0, burn: 0, oilG: 0, waterG: 0, milkAbs: 0, melted: false, set: false, loc: 'board', doneAt: null, burnAt: null, toast: null });
        void r;
        this.taken[op.ingredient] = (this.taken[op.ingredient] ?? 0) + op.grams;
        return;
      }
      case 'prep': {
        const it = this.item(op.item);
        switch (op.action) {
          case 'peel': it.peeled = true; break;
          case 'wash': it.washed = true; break;
          case 'trim': break;
          case 'cut': if (!op.shape) throw new SimError('حدّد شكل القطع'); it.cut = { shape: op.shape, size: op.size ?? null }; break;
          case 'grate': it.cut = { shape: 'grated', size: null }; break;
          case 'mash': it.cut = { shape: 'mashed', size: null }; it.mashed = true; break;
          case 'whisk': if (it.ingredient !== 'egg') throw new SimError('الخفق للبيض فقط'); it.whisked = true; it.cut = { shape: 'minced', size: null }; break;
          case 'juice': if (it.ingredient !== 'lemon') throw new SimError('العصر لليمون فقط'); it.juiced = true; break;
          case 'salt_rest': it.saltRestAt = this.t; break;
          case 'rinse_dry':
            if (it.saltRestAt !== null && this.t - it.saltRestAt >= SALT_REST_S - 1e-9) {
              it.rinsed = true;
              it.moisture *= 0.8;
            } else this.ev('rinse_early', it.id);
            break;
        }
        return;
      }
      case 'pour': {
        const v = this.vessel(op.vessel);
        if (!(op.grams > 0) || op.grams > 5000) throw new SimError('كمية غير صالحة');
        const cp = op.ingredient === 'oil' ? CP_OIL : op.ingredient === 'milk' ? CP_MILK : CP_WATER;
        const cOld = this.vesselC(v);
        v.T = (v.T * cOld + T_AMBIENT * cp * op.grams) / (cOld + cp * op.grams);
        if (op.ingredient === 'oil') v.oilG += op.grams;
        else if (op.ingredient === 'milk') {
          v.milkG += op.grams;
          this.taken['milk'] = (this.taken['milk'] ?? 0) + op.grams;
        } else v.waterG += op.grams;
        if (op.ingredient === 'oil') this.taken['oil'] = (this.taken['oil'] ?? 0) + op.grams;
        return;
      }
      case 'season': {
        if (!(op.grams > 0) || op.grams > 100) throw new SimError('كمية غير صالحة');
        this.taken[op.ingredient] = (this.taken[op.ingredient] ?? 0) + op.grams;
        if (this.items.has(op.target)) {
          const it = this.item(op.target);
          if (op.ingredient === 'salt') it.saltG += op.grams;
          else it.seasonG += op.grams;
        } else this.vessel(op.target).saltG += op.ingredient === 'salt' ? op.grams : 0;
        return;
      }
      case 'add': {
        const it = this.item(op.item);
        const v = this.vessel(op.vessel);
        this.detach(it);
        it.loc = v.id;
        v.items.push(it.id);
        return;
      }
      case 'remove': {
        const it = this.item(op.item);
        this.detach(it);
        it.loc = 'board';
        return;
      }
      case 'place': {
        const v = this.vessel(op.vessel);
        if (op.burner) for (const o of this.vessels.values()) if (o.burner === op.burner && o.id !== v.id) o.burner = 0;
        v.burner = op.burner;
        return;
      }
      case 'heat': {
        if (!(op.level >= 0 && op.level <= 10)) throw new SimError('درجة اللهب بين 0 و10');
        this.burners[op.burner - 1] = op.level;
        return;
      }
      case 'stir': {
        const v = this.vessel(op.vessel);
        v.lastStir = this.t;
        v.foam = 0;
        return;
      }
      case 'lid': {
        const v = this.vessel(op.vessel);
        if (v.kind === 'pressure_cooker' && !op.on && v.pressure !== 'off') throw new SimError('لا يُفتح قدر الضغط قبل إطلاق الضغط');
        v.lid = op.on;
        if (v.kind === 'pressure_cooker') {
          v.pressure = op.on ? 'building' : 'off';
          v.pressureSince = this.t;
        }
        return;
      }
      case 'toast': {
        const it = this.item(op.item);
        if (it.ingredient !== 'toast') throw new SimError('المحمّصة للتوست فقط');
        this.detach(it);
        it.loc = 'toaster';
        const target = [0.22, 0.45, 0.75, 1.1][op.level - 1]!;
        it.toast = { level: op.level, started: this.t, target, dur: 40 + 30 * op.level };
        return;
      }
      case 'release': {
        const v = this.vessel(op.vessel);
        if (v.kind !== 'pressure_cooker' || v.pressure === 'off') throw new SimError('لا ضغط لإطلاقه');
        v.pressure = 'releasing';
        v.pressureSince = this.t - (op.mode === 'quick' ? PRESSURE_RELEASE_NATURAL_S - PRESSURE_RELEASE_QUICK_S : 0);
        return;
      }
      case 'drain': {
        this.vessel(op.vessel).waterG = 0;
        return;
      }
      case 'serve': {
        const byIngredient: Record<string, number> = {};
        const ids: string[] = [];
        const addIng = (k: string, g: number): void => {
          byIngredient[k] = (byIngredient[k] ?? 0) + g;
        };
        for (const src of op.from) {
          if (this.vessels.has(src)) {
            const v = this.vessel(src);
            for (const id of [...v.items]) {
              const it = this.item(id);
              addIng(it.ingredient, it.g0);
              if (it.oilG > 0) addIng('oil', it.oilG);
              if (it.milkAbs > 0) addIng('milk', it.milkAbs);
              ids.push(id);
              this.detach(it);
              it.loc = op.plate;
            }
            if (v.oilG > 0) addIng('oil', v.oilG);
            if (v.milkG > 0 || v.milkEvap > 0) addIng('milk', v.milkG + v.milkEvap);
            v.oilG = 0;
            v.milkG = 0;
            v.milkEvap = 0;
            v.waterG = 0;
          } else {
            const it = this.item(src);
            addIng(it.ingredient, it.g0);
            if (it.oilG > 0) addIng('oil', it.oilG);
            if (it.milkAbs > 0) addIng('milk', it.milkAbs);
            ids.push(src);
            this.detach(it);
            it.loc = op.plate;
          }
        }
        for (const id of ids) {
          const it = this.items.get(id)!;
          if (isUnsafe({ ...it, loc: 'x' })) this.ev('unsafe', id);
        }
        this.served.push({ plate: op.plate, byIngredient, itemIds: ids, at: this.t });
        return;
      }
      case 'discard': {
        const w = (k: string, g: number): void => {
          if (g > 0) this.waste[k] = (this.waste[k] ?? 0) + g;
        };
        if (this.vessels.has(op.target)) {
          const v = this.vessel(op.target);
          for (const id of [...v.items]) {
            const it = this.item(id);
            w(it.ingredient, it.g0);
            w('oil', it.oilG);
            this.detach(it);
            it.loc = 'gone';
          }
          w('oil', v.oilG);
          w('milk', v.milkG + v.milkEvap);
          v.oilG = 0;
          v.milkG = 0;
          v.milkEvap = 0;
          v.waterG = 0;
          v.saltG = 0;
        } else {
          const it = this.item(op.target);
          w(it.ingredient, it.g0);
          w('oil', it.oilG);
          this.detach(it);
          it.loc = 'gone';
        }
        return;
      }
    }
  }

  private detach(it: Item): void {
    const v = this.vessels.get(it.loc);
    if (v) v.items = v.items.filter((x) => x !== it.id);
  }

  private vesselC(v: Vessel): number {
    return VESSEL[v.kind].massCp + v.oilG * CP_OIL + v.waterG * CP_WATER + v.milkG * CP_MILK;
  }

  /* ───── الزمن ───── */
  /** يتقدم بخطوات DT ثابتة على شبكة صحيحة (لا انجراف عشري)؛ عملية بين خطوتين تُطبَّق على الخطوة السابقة */
  advanceTo(target: number): void {
    const want = Math.floor(target / DT + 1e-9);
    while (this.n < want) {
      this.n++;
      this.t = Math.round(this.n * DT * 10) / 10;
      this.step(DT, this.t);
    }
  }
  /** تقدّم بثواني (واجهة مريحة) */
  advance(seconds: number): void {
    this.advanceTo(this.t + seconds);
  }

  private step(dt: number, now: number): void {
    const tNow = now;
    for (const v of this.vessels.values()) this.stepVessel(v, dt, tNow);
    for (const it of this.items.values()) if (it.loc === 'toaster' && it.toast) this.stepToaster(it, dt, tNow);
  }

  private stepToaster(it: Item, dt: number, tNow: number): void {
    const k = it.toast!;
    const el = tNow - k.started;
    const rate = k.target / k.dur;
    if (el <= k.dur) {
      it.browning = Math.min(k.target, it.browning + rate * dt);
      it.tSurf = it.tCore = 90 + 60 * (el / k.dur);
      it.moisture = Math.max(0.1, 1 - el / k.dur);
      it.doneness = Math.max(it.doneness, Math.min(1.2, el / k.dur));
    } else if (!k.target || it.loc === 'toaster') {
      if (it.doneAt === null) it.doneAt = tNow;
      this.ev('toast_pop', it.id);
      it.loc = 'board';
      it.tSurf = it.tCore = 70;
      if (it.browning >= 1.0) it.burn = Math.max(it.burn, 0.6);
    }
  }

  private stepVessel(v: Vessel, dt: number, tNow: number): void {
    const spec = VESSEL[v.kind];
    const P = v.burner ? this.burners[v.burner - 1]! * BURNER_W_PER_LEVEL : 0;
    const liquid = v.waterG + v.milkG;
    const hasLiquid = liquid > SURFACE_WET_G;
    const pressured = v.kind === 'pressure_cooker' && v.lid && (v.pressure === 'building' || v.pressure === 'holding');
    const boilT = pressured ? PRESSURE_C : BOIL_C;
    const stirred = tNow - v.lastStir < 8;
    const loadG = v.items.reduce((s, id) => s + this.items.get(id)!.g, 0);
    const immersed = liquid > Math.max(30, loadG * 0.25);
    let qItems = 0;

    // الاستحمام الحراري للقطع
    for (const id of v.items) {
      const it = this.items.get(id)!;
      const r = ITEM_RULES[it.ingredient]!;
      const cf = cutFactor(it);
      const medium = v.T;
      let tauS = r.tauS * cf * (immersed ? 0.55 : 1) * (stirred ? 0.85 : 1);
      if (!immersed && v.oilG > 0.5) tauS *= 0.8;
      tauS = Math.max(tauS, 1.5);
      const dTs = ((medium - it.tSurf) / tauS) * dt;
      qItems += (it.g * r.cp * dTs) / dt;
      it.tSurf += dTs;
      const tauC = Math.max(r.tauC * cf, 1.5);
      // القلب لا يتجاوز نقطة غليان مائه (100°م، أو حرارة قدر الضغط)
      it.tCore = Math.min(boilT, it.tCore + ((it.tSurf - it.tCore) / tauC) * dt);
      if (it.tCore > it.tMax) it.tMax = it.tCore;
    }

    // طاقة الوعاء
    const C = this.vesselC(v);
    let T = v.T + ((P - spec.loss * (v.T - T_AMBIENT) - qItems) * dt) / C;
    // غليان: يثبت عند نقطة الغليان ويتبخر الفائض
    if (hasLiquid && T > boilT) {
      const excessJ = (T - boilT) * C;
      T = boilT;
      let evap = excessJ / LATENT_EVAP;
      if (v.lid && v.kind !== 'pressure_cooker') evap *= 0.25;
      if (pressured) evap *= 0.05;
      const fromWater = Math.min(v.waterG, evap);
      v.waterG -= fromWater;
      const milkOut = Math.min(v.milkG, (evap - fromWater) * 0.85);
      v.milkG -= milkOut;
      v.milkEvap += milkOut; // الماء يتبخر والمواد الصلبة تبقى: يُحتسب الحليب كله مستعملًا
    }
    v.T = Math.min(T, VESSEL_MAX_C);

    // قدر الضغط
    if (v.kind === 'pressure_cooker') this.stepPressure(v, tNow);

    // دخان الزيت
    const smoking = v.oilG > 0.3 && v.T > OIL_SMOKE_C;
    if (smoking && !v.smoking) this.ev('smoke', v.id);
    v.smoking = smoking;

    // فوران الحليب
    if (v.milkG > 1 && v.T >= MILK_FOAM_C && P > 0) {
      if (!stirred) v.foam += dt / MILK_FOAM_S;
      if (v.foam >= 1) {
        v.foam = 0;
        this.waste['milk'] = (this.waste['milk'] ?? 0) + v.milkG * MILK_BOIL_OVER_LOSS;
        v.milkG *= 1 - MILK_BOIL_OVER_LOSS;
        this.ev('boil_over', v.id);
      }
    } else if (v.milkG <= 1) v.foam = 0;

    // الالتصاق: وعاء ساخن جاف بلا تحريك
    const dry = v.oilG < 0.3 && liquid < SURFACE_WET_G;
    const sticking = dry && v.T > STICK_C && tNow - v.lastStir > STICK_NO_STIR_S && spec.burn;

    for (const id of v.items) this.stepItem(this.items.get(id)!, v, dt, tNow, { hasLiquid, immersed, sticking, boilT });
  }

  private stepPressure(v: Vessel, tNow: number): void {
    if (!v.lid) return;
    if (v.pressure === 'building' && v.T >= PRESSURE_WHISTLE_C) {
      v.pressure = 'holding';
      v.whistledAt = tNow;
      this.ev('whistle', v.id);
    } else if (v.pressure === 'releasing' && tNow - v.pressureSince >= PRESSURE_RELEASE_NATURAL_S) {
      v.pressure = 'off';
      v.lid = false;
      v.T = Math.min(v.T, BOIL_C);
      this.ev('pressure_released', v.id);
    } else if (v.pressure === 'releasing') v.T = Math.min(v.T, BOIL_C);
  }

  private stepItem(it: Item, v: Vessel, dt: number, tNow: number, ctx: { hasLiquid: boolean; immersed: boolean; sticking: boolean; boilT: number }): void {
    const r = ITEM_RULES[it.ingredient]!;
    // ماء العصارة: في وعاء غير مغمور يفقد القطعة جزءًا من رطوبتها (r.release) فتتجمع ماءً حرًا في الوعاء
    const wet0 = it.g0 * r.moisture0 * r.release;
    if (!ctx.immersed && it.moisture > 0 && wet0 > 0 && it.tSurf > 60) {
      const rel = JUICE_RELEASE_PER_S * Math.min(1, (it.tSurf - 60) / 40) * dt * (v.lid ? 0.5 : 1);
      const grams = Math.min(it.moisture * wet0, rel * wet0);
      it.moisture = Math.max(0, it.moisture - grams / wet0);
      it.g = Math.max(it.g0 * 0.2, it.g - grams);
      v.waterG += grams;
    }
    // امتصاص الزيت (باذنجان…)
    if (r.absorbOil && v.oilG > 0 && it.tSurf > 95) {
      const factor = it.rinsed ? SALTED_OIL_FACTOR : 1;
      const target = r.absorbOil * it.g0 * factor;
      const d = Math.min(v.oilG, Math.max(0, target - it.oilG), target * 0.01 * dt * 10);
      it.oilG += d;
      v.oilG -= d;
    }
    // امتصاص الماء/الحليب (أرز، شوفان)
    if ((it.ingredient === 'rice' || it.ingredient === 'oats') && it.tSurf > 70) {
      const per = it.ingredient === 'rice' ? RICE_ABSORB_G_PER_G : OATS_ABSORB_G_PER_G;
      const target = per * it.g0 * Math.min(1, it.doneness + 0.25);
      const avail = it.ingredient === 'oats' ? v.milkG + v.waterG : v.waterG;
      const d = Math.min(avail, Math.max(0, target - it.waterG), 0.02 * per * it.g0 * dt);
      if (d > 0) {
        it.waterG += d;
        it.g += d;
        const fromMilk = Math.min(v.milkG, it.ingredient === 'oats' ? d : 0);
        v.milkG -= fromMilk;
        it.milkAbs += fromMilk;
        v.waterG = Math.max(0, v.waterG - (d - fromMilk));
      }
    }
    // النضج (Q10) — يشترط حرارة قلب ≥ الحدّ الأدنى للمكوّن
    if (r.cookable && it.tCore >= r.Tmin - 10) {
      const gate = Math.min(1, Math.max(0, (it.tCore - r.Tmin) / 10 + 1) / 1);
      const g = it.tCore >= r.Tmin ? 1 : Math.max(0, (it.tCore - (r.Tmin - 10)) / 10);
      const rate = (Math.min(gate, g) * Math.pow(Q10, (it.tCore - BOIL_C) / 10)) / r.tref;
      it.doneness += rate * dt;
      if (it.doneAt === null && it.doneness >= 1) {
        it.doneAt = tNow;
        this.ev('done', it.id);
      }
    }
    // الجبنة الذائبة وتماسك البيض
    if (it.ingredient === 'cheese' && it.tCore >= CHEESE_MELT_C) it.melted = true;
    if (it.ingredient === 'egg' && it.tCore >= 62) it.set = true;
    // التحمير والتكرمل: سطح ≥ 140°م ورطوبة سطحية منخفضة (لا ماء حر في الوعاء)
    if (r.brownable && !ctx.hasLiquid && it.tSurf > MAILLARD_C) {
      const k = it.tSurf > CARAMEL_C ? 1.3 : 1;
      it.browning = Math.min(1.5, it.browning + (dt / BROWN_FULL_S) * ((it.tSurf - MAILLARD_C) / 40) * k);
    }
    // الاحتراق
    let burnRate = 0;
    if (it.tSurf > BURN_C && !ctx.hasLiquid) burnRate += ((it.tSurf - BURN_C) / 40) / BURN_FULL_S;
    if (ctx.sticking) burnRate += 1 / 40;
    if (burnRate > 0) {
      it.burn = Math.min(2, it.burn + burnRate * r.burnK * dt);
      if (it.burn >= 0.3 && it.burnAt === null) {
        it.burnAt = tNow;
        this.ev('burn', it.id);
        if (ctx.sticking) this.ev('stuck', it.id);
      }
    }
  }

  /* ───── اللقطات وإعادة التشغيل ───── */
  snapshot(): Snapshot {
    return {
      t: Math.round(this.t * 10) / 10,
      burners: [...this.burners],
      vessels: [...this.vessels.values()].map((v) => ({ ...v, items: [...v.items] })),
      items: [...this.items.values()].filter((i) => i.loc !== 'gone').map((i) => ({ ...i, stage: stageOf(i), unsafe: isUnsafe(i) })),
      events: this.events.slice(-60),
      waste: { ...this.waste },
      served: this.served.map((s) => ({ ...s })),
      taken: { ...this.taken },
    };
  }
  static replay(ops: readonly Op[], seed = 1, endT?: number): Sim {
    const s = new Sim(seed);
    for (const op of [...ops].sort((a, b) => a.t - b.t)) s.apply(op);
    if (endT !== undefined && endT > s.t) s.advanceTo(endT);
    return s;
  }
}

