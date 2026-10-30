/**
 * منطق اللعبة داخل العالم (على غرار Cooking Simulator): يدان تمسكان وتضعان، أخذ المكوّنات بالإمساك، أدوات تعمل بالحركة (سكين/ملعقة/مقشرة…)،
 * صبّ ورشّ بالزر الأيمن، وأهداف الإفلات (قدر، لوح، محمّصة، سلة، حوض). لا يغيّر المحاكاة: كل فعل عملية sim عبر GameHost.
 *
 * الأزرار: الأيسر = اليد اليمنى (إمساك مطوّل/ضغط)، الأيمن = اليد اليسرى للإمساك، أو «استعمال» لما في اليمنى (صبّ/رشّ)، أو قائمة الكمية فوق رف مكوّن.
 * نقرة سريعة على رف مكوّن (<0.4 ث) تُبقي الغرض في اليد حتى النقرة التالية (إمساك لاصق) كي لا يسقط فورًا.
 */
import * as THREE from 'three';
import type { Pick } from '../Scene3D.js';
import type { SimView } from '../simClient.js';
import { stepBody, supportHeight, type Aabb, type Body } from './collision.js';
import type { FirstPerson } from './FirstPerson.js';
import type { Hands, Side } from './Hands.js';
import { EMPTY_HUD, type GameHost, type GameHud } from './types.js';

export type Hold = { kind: 'vessel'; id: string } | { kind: 'item'; id: string } | { kind: 'tool'; id: string };
export interface Hit { pick: Pick; point: THREE.Vector3; distance: number }
export interface VesselRef { group: THREE.Group; radius: number; height: number; target: THREE.Vector3 }

/** أداة يدوية من العقدة tool_<id> في GLB (الأصل عند المقبض، المحور الطويل نحو −Z عند الاستلقاء) */
export interface ToolDef { id: string; node: THREE.Object3D; label: string; mode: ToolMode; home: THREE.Vector3; homeQuat: THREE.Quaternion; body: Body | null; flat: boolean; base: number; roll: number; pitch: number; tilt: number }
export type ToolMode = 'cut' | 'peel' | 'grate' | 'mash' | 'whisk' | 'stir' | 'pour_oil' | 'pour_milk' | 'season_salt' | 'season_cumin' | 'season_sugar';
export const TOOL_INFO: Record<string, { label: string; mode: ToolMode; /** ارتفاع الأصل فوق السطح عند الاستلقاء (م) */ base: number; /** لفّة الاستلقاء حول المحور الطويل */ roll: number; /** ميل الإمساك (تحت الأفق) */ pitch: number }> = {
  knife: { label: 'السكين', mode: 'cut', base: 0.0085, roll: Math.PI / 2, pitch: -0.45 }, peeler: { label: 'المقشرة', mode: 'peel', base: 0.008, roll: 0, pitch: -0.4 }, grater: { label: 'المبشرة', mode: 'grate', base: 0.0025, roll: 0, pitch: -0.5 },
  masher: { label: 'الهراسة', mode: 'mash', base: 0.037, roll: 0, pitch: -0.5 }, whisk: { label: 'الخفّاقة', mode: 'whisk', base: 0.034, roll: 0, pitch: -0.5 },
  spoon: { label: 'الملعقة الخشبية', mode: 'stir', base: 0.0105, roll: 0, pitch: -0.5 }, spatula: { label: 'المجرفة', mode: 'stir', base: 0.016, roll: 0, pitch: -0.5 },
  bottle_oil: { label: 'زجاجة الزيت', mode: 'pour_oil', base: 0.13, roll: 0, pitch: 0 }, carton_milk: { label: 'علبة الحليب', mode: 'pour_milk', base: 0.11, roll: 0, pitch: 0 },
  shaker_salt: { label: 'مملحة الملح', mode: 'season_salt', base: 0.06, roll: 0, pitch: 0 }, shaker_cumin: { label: 'علبة الكمون', mode: 'season_cumin', base: 0.06, roll: 0, pitch: 0 }, shaker_sugar: { label: 'علبة السكر', mode: 'season_sugar', base: 0.06, roll: 0, pitch: 0 },
};
/** رفّ المكوّن ← الأداة التي تُمسك بدل أخذ عنصر */
export const SLOT_TOOL: Record<string, string> = { oil: 'bottle_oil', milk: 'carton_milk', salt: 'shaker_salt', cumin: 'shaker_cumin', sugar: 'shaker_sugar' };

export const CUT_STYLES: { shape: 'slices' | 'cubes' | 'sticks' | 'diced' | 'minced'; size?: 'small' | 'medium' | 'large'; label: string }[] = [
  { shape: 'slices', size: 'medium', label: 'شرائح' }, { shape: 'cubes', size: 'medium', label: 'مكعبات' }, { shape: 'sticks', size: 'medium', label: 'أعواد' },
  { shape: 'diced', size: 'small', label: 'مقطّع صغير' }, { shape: 'minced', label: 'مفروم' },
];

export interface GameCtx {
  camera: THREE.PerspectiveCamera;
  fp: FirstPerson;
  hands: Hands;
  host: GameHost;
  view: () => SimView | null;
  /** أول عنصر قابل للاختيار تحت المؤشر ضمن المدى (يتجاهل ما يُرفض) */
  raycast: (reach: number, skip?: (p: Pick) => boolean) => Hit | null;
  vessels: () => Map<string, VesselRef>;
  burner: (k: number) => THREE.Vector3 | undefined;
  toaster: () => THREE.Vector3;
  setRest: (id: string, p: THREE.Vector3) => void;
  /** مواضع العناصر على الأسطح، ومواضع ما في اليد؛ refreshItem يعيد وضع نسخة العنصر المرسومة */
  itemSpots: Map<string, THREE.Vector3>;
  heldItems: Map<string, THREE.Vector3>;
  refreshItem: (id: string) => void;
  supports: () => Aabb[];
  colliders: () => Aabb[];
  room: { minX: number; maxX: number; minZ: number; maxZ: number };
  tools: Map<string, ToolDef>;
  places: { bin: THREE.Vector3 | null; sink: THREE.Vector3 | null };
  /** حالة اللهب للتغيير بالعجلة */
  burners: () => number[];
  disposed: () => boolean;
}

const V = (x = 0, y = 0, z = 0): THREE.Vector3 => new THREE.Vector3(x, y, z);
const REACH_GRAB = 1.9;
const REACH_PLACE = 2.4;

export class Game {
  hold: Record<Side, Hold | null> = { L: null, R: null };
  private sticky: Record<Side, boolean> = { L: false, R: false };
  private downAt: Record<Side, number> = { L: 0, R: 0 };
  private pending: Record<Side, boolean> = { L: false, R: false };
  private falling = new Map<string, Body>();
  private using = false; // الزر الأيمن مضغوط لاستعمال ما في اليمنى
  private useAcc = 0;
  private progress: number | null = null;
  private strokeAcc = 0;
  private lastStirAt = 0;
  private lastWarn = 0;
  private cutIdx = 0;
  private toasterLevel = 2;
  private hud: GameHud = { ...EMPTY_HUD };
  private hudKey = '';
  private onHud: (h: GameHud) => void;

  constructor(private c: GameCtx, onHud: (h: GameHud) => void) {
    this.onHud = onHud;
  }

  isHeldPick(p: Pick): boolean {
    for (const h of Object.values(this.hold)) {
      if (!h) continue;
      if (h.kind === 'tool' && p.kind === 'tool' && p.id === h.id) return true;
      if (h.kind === 'item' && p.kind === 'item' && p.id === h.id) return true;
      if (h.kind === 'vessel' && (p.kind === 'vessel' || p.kind === 'plate') && p.id === h.id) return true;
    }
    return false;
  }
  /** شعاع من مركز الشاشة يتجاهل ما في اليدين (أو ما يُحدَّد فقط عند `only`) */
  private ray(reach: number, only?: (p: Pick) => boolean): Hit | null {
    return this.c.raycast(reach, only ?? ((p) => this.isHeldPick(p)));
  }

  get heldVessels(): ReadonlySet<string> {
    const s = new Set<string>();
    for (const h of Object.values(this.hold)) if (h?.kind === 'vessel') s.add(h.id);
    return s;
  }
  isFalling(id: string): boolean { return this.falling.has(id); }
  heldItemIds(): string[] { return (Object.values(this.hold).filter((h) => h?.kind === 'item') as { id: string }[]).map((h) => h.id); }

  /* ───── الأزرار ───── */
  button(button: 0 | 2, down: boolean, ts?: number): void {
    const now = ts ?? performance.now(); // وقت الحدث نفسه لا وقت معالجته (الإطارات البطيئة تؤخّر المعالجة)
    if (button === 0) return void (down ? this.press('R', now) : this.releaseSide('R', now));
    // الزر الأيمن
    if (down) {
      const ing = this.ray(REACH_GRAB);
      if (ing?.pick.kind === 'ingredient') {
        if (SLOT_TOOL[ing.pick.id]) return this.c.host.say('الزر الأيسر يمسك الأداة، والأيمن يصبّ/يرشّ وهي في يدك', 'ok');
        return this.c.host.askQuantity(ing.pick.id);
      }
      const usable = this.usableTool();
      if (usable) { this.using = true; this.useAcc = 0; return; }
      if (this.hold.R?.kind === 'item') { this.useItem(this.hold.R.id); return; }
      this.press('L', now);
    } else {
      if (this.using) { this.using = false; return; }
      this.releaseSide('L', now);
    }
  }

  private press(side: Side, now: number): void {
    const h = this.hold[side];
    if (h) { // إمساك لاصق: النقرة التالية تُفلت
      if (this.sticky[side]) { this.sticky[side] = false; this.drop(side); }
      return;
    }
    const hit = this.ray(REACH_GRAB);
    const hand = this.c.hands.get(side);
    if (!hit) { hand.setGrip(0.5); return; }
    hand.setReach(hit.point, this.c.camera); hand.setGrip(1);
    this.downAt[side] = now;
    const p = hit.pick;
    if (p.kind === 'vessel' || p.kind === 'plate') {
      const v = this.c.view()?.snap.vessels.find((x) => x.id === p.id);
      if (v && v.burner > 0) void this.c.host.op({ type: 'place', vessel: p.id, burner: 0 });
      this.setHold(side, { kind: 'vessel', id: p.id });
    } else if (p.kind === 'item') {
      this.setHold(side, { kind: 'item', id: p.id });
      this.c.itemSpots.delete(p.id);
      const it = this.c.view()?.snap.items.find((x) => x.id === p.id);
      if (it && it.loc !== 'board') void this.c.host.op({ type: 'remove', item: p.id });
    } else if (p.kind === 'tool') {
      if (this.c.tools.has(p.id)) this.setHold(side, { kind: 'tool', id: p.id });
    } else if (p.kind === 'ingredient') {
      const toolId = SLOT_TOOL[p.id];
      if (toolId && this.c.tools.has(toolId)) this.setHold(side, { kind: 'tool', id: toolId });
      else if (toolId) this.c.host.say('هذا المكوّن يُستعمل من اللوحة الجانبية (خارج اللعبة بعد).', 'warn');
      else void this.takeIngredient(side, p.id);
    } else if (p.kind === 'knob') {
      void this.c.host.op({ type: 'heat', burner: Number(p.id) as 1 | 2 | 3 | 4, level: this.nextLevel(Number(p.id)) });
    } else if (p.kind === 'toaster') {
      this.toasterLevel = (this.toasterLevel % 4) + 1;
      this.c.host.say(`درجة تحميص المحمّصة: ${this.toasterLevel} من 4`, 'ok');
    }
  }
  private nextLevel(k: number): number {
    const cur = this.c.burners()[k - 1] ?? 0;
    return cur === 0 ? 3 : cur <= 3 ? 6 : cur <= 6 ? 9 : 0;
  }
  private setHold(side: Side, h: Hold): void {
    this.hold[side] = h;
    this.falling.delete(h.id);
    const hand = this.c.hands.get(side);
    hand.holding = true;
  }
  private async takeIngredient(side: Side, slug: string): Promise<void> {
    this.pending[side] = true;
    const grams = this.c.host.quantity(slug);
    const id = await this.c.host.take(slug, grams);
    this.pending[side] = false;
    if (!id || this.c.disposed()) { this.c.hands.get(side).setGrip(0); return; }
    this.setHold(side, { kind: 'item', id });
    // الزر لم يعد مضغوطًا قبل وصول العنصر ← يبقى لاصقًا في اليد
    if (this.downAt[side] === 0) this.sticky[side] = true;
  }
  private releaseSide(side: Side, now: number): void {
    const hand = this.c.hands.get(side);
    const h = this.hold[side];
    if (this.pending[side]) { this.downAt[side] = 0; return; }
    if (!h) { hand.setReach(null, this.c.camera); hand.setGrip(0); return; }
    if (now - this.downAt[side] < 400) { this.sticky[side] = true; return; } // نقرة سريعة = إمساك لاصق
    this.drop(side);
  }
  private drop(side: Side): void {
    const hand = this.c.hands.get(side);
    const h = this.hold[side];
    this.hold[side] = null;
    hand.setReach(null, this.c.camera); hand.setGrip(0); hand.holding = false;
    if (!h) return;
    if (h.kind === 'vessel') this.dropVessel(h.id);
    else if (h.kind === 'item') this.dropItem(h.id);
    else this.dropTool(h.id);
  }

  /* ───── نقطة الهدف: أول جسم مختار أو سطح أو أرضية ───── */
  private aimPoint(skipSelf: (p: Pick) => boolean): { hit: Hit | null; point: THREE.Vector3; surface: boolean } {
    const hit = this.c.raycast(REACH_PLACE, skipSelf);
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0, 0), this.c.camera);
    let best = hit ? hit.distance : Infinity; let point = hit ? hit.point.clone() : null; let surface = false;
    const box = new THREE.Box3(); const tmp = V();
    for (const s of this.c.supports()) {
      box.min.set(s.minX, s.minY, s.minZ); box.max.set(s.maxX, s.maxY, s.maxZ);
      if (ray.ray.intersectBox(box, tmp)) { const d = tmp.distanceTo(this.c.camera.position); if (d < best && d <= REACH_PLACE) { best = d; point = tmp.clone(); surface = true; } }
    }
    if (!point) {
      const t = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmp);
      point = t && t.distanceTo(this.c.camera.position) <= REACH_PLACE + 0.5 ? t.clone() : this.tip('R');
      surface = false;
    }
    return { hit, point, surface };
  }
  private tip(side: Side): THREE.Vector3 {
    const cam = this.c.camera.position; const f = this.c.fp.forward(); const right = V(-f.z, 0, f.x);
    const s = side === 'R' ? 1 : -1;
    return V(cam.x + f.x * 0.58 + right.x * 0.2 * s, Math.max(0.05, cam.y - 0.32 + Math.sin(this.c.fp.pitch) * 0.5), cam.z + f.z * 0.58 + right.z * 0.2 * s);
  }

  /* ───── الإفلات ───── */
  private dropVessel(id: string): void {
    const vis = this.c.vessels().get(id); if (!vis) return;
    const own = (p: Pick): boolean => (p.kind === 'vessel' || p.kind === 'plate') && p.id === id;
    const { hit } = this.aimPoint(own);
    if (hit?.pick.kind === 'burner' && id !== 'plate_1' && id !== 'bowl') {
      const k = Number(hit.pick.id) as 1 | 2 | 3 | 4; const b = this.c.burner(k)!;
      void this.c.host.op({ type: 'place', vessel: id, burner: k }, `وُضع على الموقد ${k}`); vis.target.copy(b); vis.group.position.copy(b); return;
    }
    const p = vis.group.position;
    for (let k = 1; k <= 4; k++) {
      const b = this.c.burner(k)!;
      if (id !== 'plate_1' && id !== 'bowl' && Math.hypot(p.x - b.x, p.z - b.z) < 0.17 && Math.abs(p.y - b.y) < 0.45) { void this.c.host.op({ type: 'place', vessel: id, burner: k as 1 | 2 | 3 | 4 }, `وُضع على الموقد ${k}`); vis.target.copy(b); return; }
    }
    this.falling.set(id, { x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, r: vis.radius, asleep: false });
  }
  private dropItem(id: string): void {
    const it = this.c.view()?.snap.items.find((x) => x.id === id);
    this.c.heldItems.delete(id);
    if (!it) return;
    const skipSelf = (p: Pick): boolean => p.kind === 'item' && p.id === id;
    const { hit, point, surface } = this.aimPoint(skipSelf);
    const fin = (): void => this.c.refreshItem(id);
    const k = hit?.pick;
    if (k && (k.kind === 'vessel' || k.kind === 'plate')) {
      void this.c.host.op({ type: 'add', item: id, vessel: k.id }, undefined).then(fin); return;
    }
    if (k?.kind === 'toaster') {
      if (it.ingredient !== 'toast') { this.c.host.say('المحمّصة للتوست فقط', 'warn'); this.dropOnSpot(id, it.loc, this.tip('R'), true); return; }
      void this.c.host.op({ type: 'toast', item: id, level: this.toasterLevel as 1 | 2 | 3 | 4 }, `بدأ التحميص (درجة ${this.toasterLevel})`).then(fin); return;
    }
    const near = (p: THREE.Vector3 | null, r: number): boolean => !!p && Math.hypot(point.x - p.x, point.z - p.z) < r;
    if (near(this.c.places.bin, 0.38)) { void this.c.host.op({ type: 'discard', target: id }, 'رُميت في السلة').then(fin); return; }
    if (near(this.c.places.sink, 0.5)) {
      if (!it.washed) void this.c.host.op({ type: 'prep', item: id, action: 'wash' }, 'غُسل تحت الحنفية');
      else this.c.host.say('مغسول من قبل', 'ok');
      this.dropOnSpot(id, it.loc, this.c.places.sink!.clone().add(V((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2)), false); return;
    }
    if (k?.kind === 'board' || (surface && point.y >= 0.25)) { this.dropOnSpot(id, it.loc, point, false); return; }
    // وقع على الأرض
    void this.c.host.op({ type: 'discard', target: id }, 'سقط على الأرض فتلِف').then(fin);
  }
  private dropOnSpot(id: string, loc: string, p: THREE.Vector3, keepHeld: boolean): void {
    const sy = supportHeight(p.x, p.z, p.y + 0.3, this.c.supports());
    this.c.itemSpots.set(id, V(p.x, Math.max(sy, p.y > 0.5 ? p.y : sy), p.z));
    if (keepHeld) this.c.itemSpots.set(id, p.clone());
    if (loc !== 'board') void this.c.host.op({ type: 'remove', item: id }).then(() => this.c.refreshItem(id));
    else this.c.refreshItem(id);
  }
  private dropTool(id: string): void {
    const t = this.c.tools.get(id); if (!t) return;
    const p = t.node.position;
    t.body = { x: p.x, y: p.y - t.base, z: p.z, vx: 0, vy: 0, vz: 0, r: 0.03, asleep: false };
    t.flat = true;
  }

  /* ───── استعمال ما في اليد ───── */
  private usableTool(): ToolDef | null {
    const h = this.hold.R; if (h?.kind !== 'tool') return null;
    const t = this.c.tools.get(h.id);
    return t && /^(pour|season)_/.test(t.mode) ? t : null;
  }
  private useItem(id: string): void {
    const it = this.c.view()?.snap.items.find((x) => x.id === id);
    if (it?.ingredient === 'lemon' && !it.juiced) void this.c.host.op({ type: 'prep', item: id, action: 'juice' }, 'عُصر الليمون');
  }
  /** إحداثيات الوعاء/العنصر المصوَّب عليه الآن لصبّ أو رشّ */
  private useTarget(): { vessel?: string; item?: string } | null {
    const p = this.ray(REACH_PLACE)?.pick;
    if (p && (p.kind === 'vessel' || p.kind === 'plate')) return { vessel: p.id };
    if (p?.kind === 'item') return { item: p.id };
    return null;
  }

  /* ───── مفاتيح ───── */
  key(code: string, shift: boolean): void {
    const hit = this.ray(REACH_PLACE);
    const p = hit?.pick;
    if (code === 'KeyE') {
      if (p && (p.kind === 'vessel' || p.kind === 'plate') && p.kind === 'vessel') {
        const v = this.c.view()?.snap.vessels.find((x) => x.id === p.id);
        if (v) void this.c.host.op({ type: 'lid', vessel: p.id, on: !v.lid }, v.lid ? 'رُفع الغطاء' : 'وُضع الغطاء');
      }
    } else if (code === 'KeyR') {
      if (p?.kind === 'vessel') void this.c.host.op({ type: 'release', vessel: p.id, mode: shift ? 'natural' : 'quick' }, shift ? 'إطلاق ضغط طبيعي' : 'إطلاق ضغط سريع');
    } else if (code === 'KeyX') {
      if (p?.kind === 'vessel') void this.c.host.op({ type: 'drain', vessel: p.id }, 'صُفّي الماء');
    } else if (code === 'KeyF') {
      this.c.host.serve();
    }
  }
  wheel(dir: number): void {
    const h = this.hold.R;
    if (h?.kind === 'tool' && this.c.tools.get(h.id)?.mode === 'cut') {
      this.cutIdx = (this.cutIdx + (dir > 0 ? 1 : CUT_STYLES.length - 1)) % CUT_STYLES.length;
      return;
    }
    const k = this.ray(REACH_PLACE)?.pick;
    if (k?.kind === 'knob') {
      const b = Number(k.id) as 1 | 2 | 3 | 4; const cur = this.c.burners()[b - 1] ?? 0;
      void this.c.host.op({ type: 'heat', burner: b, level: Math.max(0, Math.min(10, cur + (dir > 0 ? -1 : 1))) });
    }
  }

  /* ───── كل إطار ───── */
  step(dt: number): void {
    const f = this.c.fp.forward(); const right = V(-f.z, 0, f.x);
    const camPos = this.c.camera.position;
    for (const side of ['L', 'R'] as Side[]) {
      const h = this.hold[side]; if (!h) continue;
      const s = side === 'R' ? 1 : -1;
      const tip = V(camPos.x + f.x * 0.58 + right.x * 0.2 * s, Math.max(0.05, camPos.y - 0.32 + Math.sin(this.c.fp.pitch) * 0.5), camPos.z + f.z * 0.58 + right.z * 0.2 * s);
      if (h.kind === 'vessel') {
        const vis = this.c.vessels().get(h.id); if (!vis) continue;
        vis.group.position.lerp(tip, 1 - Math.exp(-dt * 20)); vis.target.copy(vis.group.position);
      } else if (h.kind === 'item') {
        this.c.heldItems.set(h.id, tip.clone().add(V(0, 0.05, 0))); this.c.refreshItem(h.id);
      } else {
        const t = this.c.tools.get(h.id); if (!t) continue;
        t.body = null; t.flat = false;
        t.node.position.lerp(tip, 1 - Math.exp(-dt * 22));
        const tiltGoal = this.using && /^(pour|season)_/.test(t.mode) ? (t.mode.startsWith('pour') ? -1.75 : -2.3) : 0;
        t.tilt += (tiltGoal - t.tilt) * Math.min(1, dt * 8);
        const q = this.c.camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(t.pitch + t.tilt, 0, 0)));
        t.node.quaternion.slerp(q, 1 - Math.exp(-dt * 18));
      }
    }
    // أجسام تسقط: أوعية وأدوات
    for (const [id, b] of this.falling) {
      const vis = this.c.vessels().get(id); if (!vis) { this.falling.delete(id); continue; }
      stepBody(b, dt, this.c.supports(), this.c.room);
      vis.group.position.set(b.x, b.y, b.z); vis.target.copy(vis.group.position);
      if (b.asleep) { this.c.setRest(id, V(b.x, b.y, b.z)); this.falling.delete(id); }
    }
    for (const t of this.c.tools.values()) {
      if (!t.body || t.body.asleep) continue;
      stepBody(t.body, dt, this.c.supports(), this.c.room, 0.15);
      t.node.position.set(t.body.x, t.body.y + t.base, t.body.z);
      if (t.flat) t.node.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.c.fp.yaw, t.roll)), 1 - Math.exp(-dt * 10));
    }
    this.stepUse(dt);
    this.stepHud();
  }

  /** صبّ/رشّ مستمر بالزر الأيمن، وضربات الأدوات بحركة الفأرة */
  private stepUse(dt: number): void {
    const motion = this.c.fp.takeMotion();
    const rh = this.hold.R;
    const t = rh?.kind === 'tool' ? this.c.tools.get(rh.id) : null;
    this.progress = null;
    if (!t) return;
    if (this.using && /^(pour|season)_/.test(t.mode)) {
      const tgt = this.useTarget();
      this.useAcc += dt;
      const step = t.mode.startsWith('pour') ? 0.5 : 0.35;
      if (tgt && this.useAcc >= step) {
        this.useAcc = 0;
        if (t.mode === 'pour_oil' || t.mode === 'pour_milk') {
          if (tgt.vessel) void this.c.host.op({ type: 'pour', ingredient: t.mode === 'pour_oil' ? 'oil' : 'milk', grams: t.mode === 'pour_oil' ? 15 : 60, vessel: tgt.vessel });
          else this.c.host.say('اصبب في وعاء', 'warn');
        } else {
          const ing = t.mode.slice('season_'.length) as 'salt' | 'cumin' | 'sugar';
          const target = tgt.item ?? tgt.vessel; if (target) void this.c.host.op({ type: 'season', ingredient: ing, grams: 1, target });
        }
      }
      return;
    }
    const mv = Math.hypot(motion.dx, motion.dy);
    if (mv <= 0) return;
    if (t.mode === 'stir') {
      const v = this.ray(REACH_PLACE)?.pick;
      if (v && (v.kind === 'vessel') && this.strokeAcc + mv > 0) {
        this.strokeAcc += mv;
        this.progress = Math.min(1, this.strokeAcc / 260);
        const now = performance.now();
        if (this.strokeAcc >= 260 && now - this.lastStirAt > 500) { this.strokeAcc = 0; this.lastStirAt = now; void this.c.host.op({ type: 'stir', vessel: v.id }, 'حُرّك المحتوى'); }
      } else this.strokeAcc = 0;
      return;
    }
    // قطع/تقشير/تبشير/هرس/خفق: ضربات فوق عنصر على اللوح (التصويب على العنصر أو على اللوح القريب منه)
    const snapItems = this.c.view()?.snap.items ?? [];
    const aimed = this.ray(REACH_PLACE);
    let itemId: string | null = aimed?.pick.kind === 'item' ? aimed.pick.id : null;
    if (!itemId && aimed?.pick.kind === 'board') {
      let best = 0.32;
      for (const it of snapItems) {
        if (it.loc !== 'board') continue;
        const vis = this.c.itemSpots.get(it.id);
        if (!vis) { itemId = it.id; break; }
        const d = Math.hypot(vis.x - aimed.point.x, vis.z - aimed.point.z); if (d < best) { best = d; itemId = it.id; }
      }
    }
    if (!itemId) { this.strokeAcc = Math.max(0, this.strokeAcc - mv * 0.5); return; }
    const it = snapItems.find((x) => x.id === itemId);
    if (!it || (it.loc !== 'board' && t.mode !== 'whisk' && t.mode !== 'mash')) { if (it && performance.now() - this.lastWarn > 2500) { this.lastWarn = performance.now(); this.c.host.say('ضع الغرض على لوح التقطيع أولًا', 'warn'); } return; }
    const need = Math.max(220, Math.min(900, 160 + it.g0 * 2.2));
    this.strokeAcc += mv;
    this.progress = Math.min(1, this.strokeAcc / need);
    if (this.strokeAcc >= need) {
      this.strokeAcc = 0;
      if (t.mode === 'cut') { const st = CUT_STYLES[this.cutIdx]!; void this.c.host.op({ type: 'prep', item: it.id, action: 'cut', shape: st.shape, size: st.size }, `قُطع: ${st.label}`); }
      else if (t.mode === 'peel') void this.c.host.op({ type: 'prep', item: it.id, action: 'peel' }, 'قُشّر');
      else if (t.mode === 'grate') void this.c.host.op({ type: 'prep', item: it.id, action: 'grate' }, 'بُشر');
      else if (t.mode === 'mash') void this.c.host.op({ type: 'prep', item: it.id, action: 'mash' }, 'هُرس');
      else if (t.mode === 'whisk') void this.c.host.op({ type: 'prep', item: it.id, action: 'whisk' }, 'خُفق');
    }
  }

  private stepHud(): void {
    const name = (h: Hold | null): string => {
      if (!h) return '';
      if (h.kind === 'tool') return this.c.tools.get(h.id)?.label ?? h.id;
      if (h.kind === 'item') { const it = this.c.view()?.snap.items.find((x) => x.id === h.id); return it ? `${it.ingredient} ${Math.round(it.g0)} غ` : h.id; }
      return h.id;
    };
    const rt = this.hold.R?.kind === 'tool' ? this.c.tools.get(this.hold.R.id) : null;
    const hint = rt
      ? rt.mode === 'cut' ? 'حرّك السكين فوق الغرض لتقطع · العجلة تغيّر الأسلوب'
        : /^pour_/.test(rt.mode) ? 'صوّب على وعاء واضغط الزر الأيمن للصبّ'
        : /^season_/.test(rt.mode) ? 'صوّب على وعاء أو غرض واضغط الزر الأيمن للرشّ'
        : rt.mode === 'stir' ? 'حرّك الأداة فوق الوعاء لتحرّك' : 'حرّك الأداة فوق الغرض'
      : this.hold.R?.kind === 'item' ? 'أفلت فوق قدر لتضيف · لوح لتضع · محمّصة · سلة · حوض ليُغسل' : '';
    const h: GameHud = { left: name(this.hold.L), right: name(this.hold.R), hint, progress: this.progress, cut: rt?.mode === 'cut' ? CUT_STYLES[this.cutIdx]!.label : '', toaster: this.toasterLevel };
    const key = `${h.left}|${h.right}|${h.hint}|${h.progress === null ? '' : Math.round(h.progress * 20)}|${h.cut}|${h.toaster}`;
    if (key !== this.hudKey) { this.hudKey = key; this.hud = h; this.onHud(h); }
  }
  }
