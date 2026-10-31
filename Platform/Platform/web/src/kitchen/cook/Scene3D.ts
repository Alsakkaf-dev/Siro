/**
 * مشهد المطبخ ثلاثي الأبعاد (K-M6/K-M8): هندسة إجرائية (D-09/F) بعقد أسماء 3D-10 فتُستبدل لاحقًا بأصول GLB دون تغيير المنطق.
 * مقاييس بالمتر، Y لأعلى، الأمام −Z. كل ثابت يُدمج بحسب المادة (PERF-20: draw calls ≤ 150). لا فيزياء هنا: المشهد يعرض لقطات المحاكي فقط.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { INGREDIENTS } from '../../../../shared/kitchen/index.js';
import type { Item, Snapshot, Vessel } from '../../../../shared/kitchen/sim/index.js';
import type { SimView } from './simClient.js';
import { FirstPerson } from './world/FirstPerson.js';
import { Hands, type Side } from './world/Hands.js';
import { type Aabb } from './world/collision.js';
import { Game, TOOL_INFO, type ToolDef } from './world/Game.js';
import type { GameHost, GameHud } from './world/types.js';

export type Quality = 'lite' | 'standard' | 'high';
export type StationName = 'shelves' | 'equipment' | 'tools' | 'prep' | 'stove' | 'sink' | 'serve';
export type Pick = { kind: 'ingredient'; id: string } | { kind: 'vessel'; id: string } | { kind: 'item'; id: string } | { kind: 'burner'; id: string } | { kind: 'knob'; id: string } | { kind: 'toaster'; id: string } | { kind: 'plate'; id: string } | { kind: 'board'; id: string } | { kind: 'tool'; id: string };
/** واجهة الصفحة لعالم اللعبة: كل فعل داخل المشهد يصير عملية محاكاة عبر المضيف */
export type { GameHost } from './world/types.js';
export interface SceneOptions { canvas: HTMLCanvasElement; quality: Quality; reducedMotion: boolean; onPick: (p: Pick) => void; onQuality?: (q: Quality, why: string) => void; host?: GameHost; onHud?: (h: GameHud) => void; onHover?: (p: Pick | null) => void }

const V3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
export const STATIONS: Record<StationName, { cam: THREE.Vector3; look: THREE.Vector3; label: string }> = {
  shelves: { cam: V3(-0.9, 1.55, -0.5), look: V3(-0.9, 1.25, -2.1), label: 'الرفوف' },
  equipment: { cam: V3(1.3, 1.6, -0.4), look: V3(1.3, 1.15, -2.1), label: 'المعدات' },
  tools: { cam: V3(1.9, 1.7, 0.2), look: V3(1.9, 1.35, -2.1), label: 'الأدوات' },
  prep: { cam: V3(0, 1.75, 1.15), look: V3(0, 0.95, 0.25), label: 'التحضير' },
  stove: { cam: V3(0.9, 1.75, 0.2), look: V3(2.2, 0.95, -0.55), label: 'الطبخ' },
  sink: { cam: V3(-1.2, 1.65, 0.7), look: V3(-2.2, 0.95, -0.2), label: 'الغسيل' },
  serve: { cam: V3(-1.1, 1.55, 2.0), look: V3(-1.4, 0.95, 1.0), label: 'التقديم' },
};
const BURNER_POS: Record<number, THREE.Vector3> = { 1: V3(2.25, 0.93, -0.95), 2: V3(2.25, 0.93, -0.45), 3: V3(2.25, 0.93, 0.05), 4: V3(2.25, 0.93, 0.55) };
const REST: Record<string, THREE.Vector3> = {
  pan: V3(0.8, 1.2, -2.0), pot_small: V3(1.2, 1.2, -2.0), pot_large: V3(1.65, 1.2, -2.0), pressure_cooker: V3(2.1, 1.2, -2.0), bowl: V3(0.35, 0.93, 0.35), plate_1: V3(-1.4, 0.93, 1.0),
};
const TOASTER_POS = V3(0.8, 0.95, 0.3);
const BOARD_POS = V3(-0.35, 0.93, 0.3);
/** مواضع المحاكاة في المشهد: الإجرائي افتراضيًا، ويعيد `loadWorld` ضبطها من عقد GLB (burner_k, equip_*, board_main) */
export interface Layout { burner: Record<number, THREE.Vector3>; rest: Record<string, THREE.Vector3>; toaster: THREE.Vector3; board: THREE.Vector3 }
const defaultLayout = (): Layout => ({
  burner: Object.fromEntries(Object.entries(BURNER_POS).map(([k, v]) => [k, v.clone()])) as Record<number, THREE.Vector3>,
  rest: Object.fromEntries(Object.entries(REST).map(([k, v]) => [k, v.clone()])),
  toaster: TOASTER_POS.clone(),
  board: V3(BOARD_POS.x, 0.94, BOARD_POS.z),
});

/* ───── مواد ونسيج إجرائي ───── */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}
const rnd = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};
const woodTex = (base: string, dark: string, seed: number, planks = 6): THREE.CanvasTexture =>
  canvasTex(512, 512, (c) => {
    const r = rnd(seed);
    c.fillStyle = base;
    c.fillRect(0, 0, 512, 512);
    const ph = 512 / planks;
    for (let p = 0; p < planks; p++) {
      c.fillStyle = `rgba(${40 + r() * 30},${25 + r() * 20},10,${0.05 + r() * 0.12})`;
      c.fillRect(0, p * ph, 512, ph);
      for (let i = 0; i < 26; i++) {
        c.strokeStyle = dark;
        c.globalAlpha = 0.06 + r() * 0.14;
        c.lineWidth = 0.6 + r() * 1.4;
        c.beginPath();
        const y = p * ph + r() * ph;
        c.moveTo(0, y);
        c.bezierCurveTo(150, y + (r() - 0.5) * 6, 360, y + (r() - 0.5) * 6, 512, y + (r() - 0.5) * 4);
        c.stroke();
      }
      c.globalAlpha = 0.55;
      c.fillStyle = '#2a1a0c';
      c.fillRect(0, p * ph, 512, 1.5);
    }
  });
const tileTex = (): THREE.CanvasTexture =>
  canvasTex(512, 512, (c) => {
    c.fillStyle = '#d8d4cb';
    c.fillRect(0, 0, 512, 512);
    const r = rnd(7);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 4; x++) {
        const ox = y % 2 ? 64 : 0;
        const g = 236 + Math.floor(r() * 14);
        c.fillStyle = `rgb(${g},${g - 2},${g - 6})`;
        c.fillRect(x * 128 + ox + 3, y * 64 + 3, 122, 58);
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.fillRect(x * 128 + ox + 6, y * 64 + 5, 116, 6);
      }
  }, [3, 2]);
const steelMat = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: number | string, rough = 0.6, metal = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

/** دمج الثوابت بحسب المادة */
class Batch {
  private groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, m: THREE.Material, at: THREE.Vector3, rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]): void {
    const g = geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(at, new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale)));
    const list = this.groups.get(m) ?? [];
    list.push(g);
    this.groups.set(m, list);
  }
  box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]): void {
    this.add(new THREE.BoxGeometry(w, h, d), m, V3(x, y, z), rot);
  }
  cyl(rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 20): void {
    this.add(new THREE.CylinderGeometry(rt, rb, h, seg), m, V3(x, y, z));
  }
  build(parent: THREE.Object3D, shadows: boolean): void {
    for (const [m, geos] of this.groups) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, m);
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      parent.add(mesh);
      for (const g of geos) g.dispose();
    }
    this.groups.clear();
  }
}

/* ───── مظهر المكوّنات ───── */
interface Look { shape: 'sphere' | 'egg' | 'cyl' | 'box' | 'cone' | 'slice' | 'grain' | 'long'; size: number; color: number; done: number; unitG: number; pale?: boolean }
const LOOK: Record<string, Look> = {
  potato: { shape: 'sphere', size: 0.035, color: 0xc9a56a, done: 0xe8cf8a, unitG: 150 }, onion: { shape: 'sphere', size: 0.04, color: 0xd9a35a, done: 0xe9d29a, unitG: 150 },
  tomato: { shape: 'sphere', size: 0.04, color: 0xd6382a, done: 0xb8281d, unitG: 120 }, carrot: { shape: 'cone', size: 0.025, color: 0xf08a22, done: 0xe0701a, unitG: 80 },
  cucumber: { shape: 'cyl', size: 0.025, color: 0x4f9a3c, done: 0x5aa04a, unitG: 200 }, toast: { shape: 'slice', size: 0.05, color: 0xe9d3a0, done: 0xe9d3a0, unitG: 20 },
  lemon: { shape: 'egg', size: 0.03, color: 0xf2d73a, done: 0xf2d73a, unitG: 80 }, oats: { shape: 'grain', size: 0.012, color: 0xd9c9a0, done: 0xe9ddbd, unitG: 40 },
  egg: { shape: 'egg', size: 0.028, color: 0xf3ead8, done: 0xfaf3e2, unitG: 50 }, banana: { shape: 'long', size: 0.022, color: 0xf3d544, done: 0xf0d36a, unitG: 100 },
  milk: { shape: 'box', size: 0.02, color: 0xffffff, done: 0xffffff, unitG: 100 }, honey: { shape: 'sphere', size: 0.02, color: 0xe0a421, done: 0xe0a421, unitG: 30 },
  cheese: { shape: 'slice', size: 0.04, color: 0xf4cf55, done: 0xf0b13a, unitG: 20 }, yogurt: { shape: 'sphere', size: 0.03, color: 0xfaf6ee, done: 0xfaf6ee, unitG: 100 },
  chicken: { shape: 'box', size: 0.03, color: 0xe9a5a0, done: 0xf0dfc4, unitG: 60 }, garlic: { shape: 'egg', size: 0.02, color: 0xf2eadb, done: 0xe5d9bd, unitG: 6 },
  rice: { shape: 'grain', size: 0.008, color: 0xf6f2e8, done: 0xfffaf0, unitG: 50 }, eggplant: { shape: 'egg', size: 0.045, color: 0x4a2a62, done: 0x8a6a3a, unitG: 250 },
  green_beans: { shape: 'long', size: 0.012, color: 0x4b9a36, done: 0x6b8a2a, unitG: 60 }, ginger: { shape: 'egg', size: 0.025, color: 0xcaa774, done: 0xcaa774, unitG: 40 },
  coriander: { shape: 'grain', size: 0.014, color: 0x3d8a35, done: 0x3d8a35, unitG: 20 }, cumin: { shape: 'grain', size: 0.006, color: 0xa06a2a, done: 0xa06a2a, unitG: 5 },
  tomato_paste: { shape: 'sphere', size: 0.03, color: 0xb2271a, done: 0x8a1c12, unitG: 30 }, salt: { shape: 'grain', size: 0.005, color: 0xffffff, done: 0xffffff, unitG: 5 },
  sugar: { shape: 'grain', size: 0.005, color: 0xfafafa, done: 0xfafafa, unitG: 5 }, oil: { shape: 'sphere', size: 0.02, color: 0xe8b923, done: 0xe8b923, unitG: 20 },
};
const geoCache = new Map<string, THREE.BufferGeometry>();
function geoFor(shape: Look['shape'], s: number): THREE.BufferGeometry {
  const k = `${shape}:${s}`;
  let g = geoCache.get(k);
  if (g) return g;
  switch (shape) {
    case 'sphere': g = new THREE.SphereGeometry(s, 14, 10); break;
    case 'egg': g = new THREE.SphereGeometry(s, 14, 10); g.scale(0.82, 1.15, 0.82); break;
    case 'cyl': g = new THREE.CylinderGeometry(s, s, s * 4, 12); g.rotateZ(Math.PI / 2); break;
    case 'box': g = new THREE.BoxGeometry(s * 1.3, s, s * 1.1); break;
    case 'cone': g = new THREE.ConeGeometry(s, s * 4, 10); g.rotateZ(Math.PI / 2); break;
    case 'slice': g = new THREE.BoxGeometry(s, s * 0.14, s); break;
    case 'long': g = new THREE.CapsuleGeometry(s, s * 4, 4, 8); g.rotateZ(Math.PI / 2); break;
    default: g = new THREE.IcosahedronGeometry(s, 0);
  }
  geoCache.set(k, g);
  return g;
}
const C_BROWN = new THREE.Color(0x8a5524);
const C_BROWN_MUL = new THREE.Color(0.62, 0.42, 0.24);
const C_BURN_MUL = new THREE.Color(0.14, 0.12, 0.11);
const C_BURN = new THREE.Color(0x15100e);
const tmpC = new THREE.Color();
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

interface ItemVis { mesh: THREE.InstancedMesh; sig: string; mat: THREE.MeshStandardMaterial; /** نصف ارتفاع القطعة (م) وحجمها النسبي عند استعمال مجسمات الطعام من بلندر */ kit?: { half: number; scale: number; flat: boolean } }
interface VesselVis { group: THREE.Group; liquid: THREE.Mesh; liquidMat: THREE.MeshStandardMaterial; lid: THREE.Object3D | null; target: THREE.Vector3; radius: number; height: number }

export class KitchenScene {
  readonly L: Layout = defaultLayout();
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(52, 1, 0.05, 40);
  quality: Quality;
  private root = new THREE.Group();
  private pickables: THREE.Object3D[] = [];
  private vessels = new Map<string, VesselVis>();
  private items = new Map<string, ItemVis>();
  private flames: THREE.Group[] = [];
  private flameMats: THREE.MeshBasicMaterial[] = [];
  private labelGeo!: THREE.BufferGeometry;
  private labelColors!: THREE.BufferAttribute;
  private steam!: THREE.Points;
  private steamPos!: Float32Array;
  private steamSeed!: Float32Array;
  private steamVessel: string[] = [];
  private smoke: boolean[] = [];
  private view: SimView | null = null;
  private stock: Record<string, number> = {};
  private camFrom = { p: V3(0, 1.6, 2), l: V3(0, 1.1, -1.5) };
  private camTo = { p: V3(0, 1.6, 2), l: V3(0, 1.1, -1.5) };
  private camT = 1;
  private camDur = 0.5;
  private yaw = 0;
  private pitch = 0;
  private lookNow = V3(0, 1.1, -1.5);
  private station: StationName = 'prep';
  private raf = 0;
  private clock = new THREE.Timer();
  private frames = 0;
  private acc = 0;
  private lowStreak = 0;
  private disposed = false;
  private toasterGlow!: THREE.Mesh;
  private hover: THREE.Mesh | null = null;
  private ray = new THREE.Raycaster();
  private ptr = new THREE.Vector2();
  private drag: { x: number; y: number; moved: boolean } | null = null;
  fps = 60;

  constructor(private o: SceneOptions) {
    this.quality = o.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: o.quality !== 'lite', alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.applyQuality();
    this.scene.background = new THREE.Color(0x2b2622);
    this.scene.fog = new THREE.Fog(0x2b2622, 8, 18);
    this.scene.add(this.root);
    this.build();
    this.bind();
    this.goStation('prep', true);
    this.loop();
  }

  /* ───── الجودة (3D-50) ───── */
  private applyQuality(): void {
    const q = this.quality;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.renderer.setPixelRatio(q === 'lite' ? 1 : Math.min(dpr, q === 'high' ? 2 : 1.5));
    this.renderer.shadowMap.enabled = q !== 'lite';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.sun?.shadow.map?.dispose();
    if (this.sun) {
      const s = q === 'high' ? 2048 : 1024;
      this.sun.shadow.mapSize.set(s, s);
      this.sun.castShadow = q !== 'lite';
      this.sun.shadow.map = null;
    }
    if (this.steam) this.steam.visible = q !== 'lite';
    this.resize();
  }
  private sun!: THREE.DirectionalLight;
  /** مصابيح السقف في العالم: العدد يتبع الجودة (خفيفة 0، عادية 4، عالية 6) والضوء المحيط يعوّض */
  private worldLights: THREE.PointLight[] = [];
  private applyWorldLights(): void {
    if (!this.worldLights.length) return;
    const n = { lite: 0, standard: 4, high: 6 }[this.quality];
    this.worldLights.forEach((l, i) => { l.visible = i < n; });
    this.root.traverse((o) => { if ((o as THREE.HemisphereLight).isHemisphereLight) (o as THREE.HemisphereLight).intensity = this.quality === 'lite' ? 0.95 : 0.32; });
    this.scene.environment = this.quality === 'lite' ? null : this.envMap;
  }
  private envMap: THREE.Texture | null = null;
  setQuality(q: Quality): void {
    if (q === this.quality) return;
    this.quality = q;
    this.applyQuality();
    this.applyWorldLights();
    for (const m of [this.root]) m.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).receiveShadow = q !== 'lite'; });
  }

  /* ───── البناء ───── */
  private build(): void {
    const shadows = this.quality !== 'lite';
    const B = new Batch();
    const floorTex = woodTex('#8a5a32', '#3a2312', 11, 8);
    floorTex.repeat.set(3, 3);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    const mFloor = mat(0xffffff, 0.55, 0, { map: floorTex });
    const wallTile = tileTex();
    const mWallLow = mat(0xffffff, 0.35, 0, { map: wallTile });
    const mWall = mat(0xcdbba3, 0.9);
    const mAccent = mat(0x39434a, 0.4);
    const mCeil = mat(0xe8e2d6, 0.95);
    const woodS = woodTex('#a8764a', '#4a2a14', 21, 4);
    const mWood = mat(0xffffff, 0.6, 0, { map: woodS });
    const mWoodDark = mat(0x6b4426, 0.65);
    const mSteel = mat(0xb6bcc2, 0.35, 0.85);
    const mSteelDark = mat(0x4a4f55, 0.4, 0.8);
    const mCounter = mat(0xd9d4c9, 0.35, 0.05);
    const mBlack = mat(0x14161a, 0.35, 0.6);
    const mWhite = mat(0xf4f1ea, 0.35);
    void steelMat;
    // الغرفة
    B.box(5.4, 0.1, 4.6, mFloor, 0, -0.05, 0);
    B.box(5.4, 0.05, 4.6, mCeil, 0, 3.0, 0);
    B.box(5.4, 1.35, 0.1, mWallLow, 0, 0.675, -2.3);
    B.box(5.4, 0.06, 0.12, mAccent, 0, 1.38, -2.3);
    B.box(5.4, 1.62, 0.1, mWall, 0, 2.19, -2.3);
    B.box(0.1, 1.35, 4.6, mWallLow, 2.7, 0.675, 0);
    B.box(0.1, 1.65, 4.6, mWall, 2.7, 2.2, 0);
    B.box(0.1, 1.35, 4.6, mWallLow, -2.7, 0.675, 0);
    B.box(0.1, 1.65, 4.6, mWall, -2.7, 2.2, 0);
    B.box(5.4, 3, 0.1, mWall, 0, 1.5, 2.3);
    // رفوف الجدار الخلفي: هياكل فولاذية + ألواح خشب (3 مستويات)
    for (const x of [-2.4, -1.45, -0.5, 0.45]) for (const z of [-2.12, -1.78]) B.box(0.05, 2.3, 0.05, mSteelDark, x, 1.15, z);
    for (const lvl of [0.62, 1.22, 1.82]) for (const [x0, x1] of [[-2.4, -1.45], [-1.45, -0.5], [-0.5, 0.45]] as const) B.box(x1 - x0, 0.045, 0.4, mWood, (x0 + x1) / 2, lvl, -1.95);
    // الثلاجة (منطقة التبريد للألبان والبيض والدجاج)
    B.box(0.9, 2.0, 0.7, mSteel, 1.0, 1.0, -1.85);
    B.box(0.02, 1.2, 0.04, mSteelDark, 0.58, 1.1, -1.48);
    // رف المعدات وجدار الأدوات
    B.box(1.4, 0.05, 0.4, mWood, 1.75, 1.1, -2.05);
    B.box(1.4, 0.05, 0.4, mWood, 1.75, 1.55, -2.05);
    for (let i = 0; i < 7; i++) {
      B.box(0.03, 0.2, 0.01, mSteelDark, 1.2 + i * 0.16, 1.95, -2.22);
      B.box(0.07 + (i % 3) * 0.015, 0.12, 0.01, mSteel, 1.2 + i * 0.16, 1.8, -2.22);
    }
    B.box(1.3, 0.02, 0.03, mSteelDark, 1.75, 2.05, -2.22);
    // طاولة التحضير (الجزيرة) واللوح
    B.box(1.9, 0.9, 0.85, mWoodDark, 0, 0.45, 0.3);
    B.box(2.0, 0.05, 0.95, mCounter, 0, 0.925, 0.3);
    B.box(0.55, 0.035, 0.38, mWood, this.L.board.x, 0.96, this.L.board.z);
    // الموقد على اليمين
    B.box(0.85, 0.9, 2.5, mBlack, 2.25, 0.45, -0.2);
    B.box(0.9, 0.05, 2.55, mCounter, 2.25, 0.925, -0.2);
    for (const k of [1, 2, 3, 4]) {
      const p = this.L.burner[k]!;
      B.add(new THREE.TorusGeometry(0.1, 0.012, 8, 28), mBlack, V3(p.x, 0.955, p.z), [Math.PI / 2, 0, 0]);
      B.cyl(0.05, 0.06, 0.025, mSteelDark, p.x, 0.945, p.z, 18);
      B.box(0.28, 0.012, 0.012, mSteelDark, p.x, 0.99, p.z);
      B.box(0.012, 0.012, 0.28, mSteelDark, p.x, 0.99, p.z);
      // مقبض اللهب على الواجهة
      B.add(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 14), mSteel, V3(1.82, 0.78, p.z), [0, 0, Math.PI / 2]);
    }
    // الشفاط والمدخنة
    B.box(1.0, 0.18, 2.4, mSteel, 2.2, 1.75, -0.2);
    B.box(0.4, 0.8, 0.5, mSteel, 2.2, 2.4, -0.2);
    // المغسلة على اليسار
    B.box(0.85, 0.9, 2.5, mWoodDark, -2.25, 0.45, -0.2);
    B.box(0.9, 0.05, 2.55, mCounter, -2.25, 0.925, -0.2);
    B.box(0.55, 0.01, 0.7, mSteelDark, -2.25, 0.95, -0.2);
    B.add(new THREE.TorusGeometry(0.1, 0.012, 8, 16, Math.PI), mSteel, V3(-2.58, 1.15, -0.2), [0, Math.PI / 2, 0]);
    B.cyl(0.015, 0.015, 0.22, mSteel, -2.58, 1.04, -0.2, 10);
    // طاولة التقديم
    B.box(1.0, 0.9, 0.7, mWoodDark, -1.4, 0.45, 1.0);
    B.box(1.1, 0.05, 0.8, mWhite, -1.4, 0.925, 1.0);
    // أسطوانة الغاز وطفاية الحريق (إشارات المراجع)
    B.cyl(0.14, 0.14, 0.55, mat(0x2a6fc8, 0.5, 0.3), 2.45, 0.28, 1.9, 18);
    B.cyl(0.05, 0.05, 0.12, mSteelDark, 2.45, 0.6, 1.9, 10);
    B.cyl(0.07, 0.07, 0.34, mat(0xc42424, 0.4, 0.4), -2.5, 1.2, 1.2, 14);
    // جدار الأعشاب
    for (let i = 0; i < 4; i++) {
      B.box(0.2, 0.025, 0.12, mWhite, -2.62, 1.55 + i * 0.22, 1.55);
      B.cyl(0.05, 0.04, 0.07, mWhite, -2.58, 1.6 + i * 0.22, 1.55, 12);
      B.add(new THREE.SphereGeometry(0.06, 10, 8), mat(0x3f8f37, 0.9), V3(-2.58, 1.68 + i * 0.22, 1.55), [0, 0, 0], [1, 0.8, 1]);
    }
    // نافذة بإضاءة دافئة (لوحة مضيئة)
    B.box(1.4, 1.0, 0.04, mat(0xfff1c8, 1, 0, { emissive: 0xffe2a0, emissiveIntensity: 0.55 }), -1.0, 2.1, -2.24);
    const room0 = this.root.children.length;
    B.build(this.root, shadows);
    this.roomObjs = this.root.children.slice(room0);

    // الإضاءة
    this.root.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3a2a, 0.75));
    this.sun = new THREE.DirectionalLight(0xfff0d6, 1.5);
    this.sun.position.set(-2, 4.5, 2.5);
    this.sun.target.position.set(0, 0.8, -0.5);
    const sc = this.sun.shadow.camera;
    sc.left = -4;
    sc.right = 4;
    sc.top = 4;
    sc.bottom = -4;
    sc.near = 1;
    sc.far = 12;
    this.sun.shadow.bias = -0.0004;
    this.root.add(this.sun, this.sun.target);
    const lamp = new THREE.PointLight(0xffd9a0, 11, 7, 1.6);
    lamp.position.set(0.2, 2.5, 0.3);
    this.root.add(lamp);
    const warm = new THREE.PointLight(0xffe3b8, 5, 4, 1.8);
    warm.position.set(-1.0, 1.9, -1.4);
    this.root.add(warm);
    const serveSpot = new THREE.SpotLight(0xffffff, 8, 6, 0.55, 0.6, 1.5);
    serveSpot.position.set(-1.4, 2.6, 1.4);
    serveSpot.target.position.set(-1.4, 0.9, 1.0);
    this.root.add(serveSpot, serveSpot.target);

    const shelf0 = this.root.children.length;
    this.buildShelves();
    this.roomObjs.push(...this.root.children.slice(shelf0));
    this.buildEquipment();
    this.buildBurners();
    this.buildSteam();
  }

  /** الـ26 مكوّنًا في حاويات بملصقات (atlas واحد = draw call واحد) + صناديق اختيار شفافة (3D-10 slot_ing_<slug>) */
  private buildShelves(): void {
    const ings = INGREDIENTS;
    // أطلس الملصقات
    const cols = 4;
    const cw = 256;
    const ch = 144;
    const atlas = canvasTex(1024, 1024, (c) => {
      c.fillStyle = '#f7f3ea';
      c.fillRect(0, 0, 1024, 1024);
      ings.forEach((ing, i) => {
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * ch;
        c.fillStyle = '#fff';
        c.fillRect(x + 4, y + 4, cw - 8, ch - 8);
        c.strokeStyle = '#2c2a26';
        c.lineWidth = 3;
        c.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
        c.font = '54px serif';
        c.textAlign = 'center';
        c.fillStyle = '#000';
        c.fillText(ing.icon, x + 46, y + 84);
        c.direction = 'rtl';
        c.font = 'bold 34px system-ui, sans-serif';
        c.fillText(ing.name_ar.length > 11 ? ing.name_ar.slice(0, 11) : ing.name_ar, x + cw / 2 + 36, y + 62);
        c.font = '22px system-ui, sans-serif';
        c.fillStyle = '#555';
        c.direction = 'ltr';
        c.fillText(ing.name_ms, x + cw / 2 + 36, y + 106);
      });
    });
    const positions: THREE.Vector3[] = [];
    const quadGeos: THREE.BufferGeometry[] = [];
    const batch = new Batch();
    const crate = mat(0xffffff, 0.7, 0, { map: woodTex('#b8854f', '#5a3416', 31, 3) });
    const sack = mat(0xc9a672, 0.95);
    const glass = mat(0xcfe3ea, 0.15, 0.1, { transparent: true, opacity: 0.55 });
    const metal = mat(0xc8ccd0, 0.35, 0.9);
    const cardboard = mat(0xd9b98a, 0.9);
    const white = mat(0xf6f3ec, 0.4);
    ings.forEach((ing, i) => {
      const lvl = [0.65, 1.25, 1.85][Math.floor(i / 9)]!;
      const col = i % 9;
      const x = -2.3 + (col % 3) * 0.3 + Math.floor(col / 3) * 0.95;
      const z = -1.95;
      const p = V3(x, lvl, z);
      positions.push(p);
      const look = LOOK[ing.slug]!;
      const fillMat = mat(look.color, 0.7);
      // الحاوية بحسب النوع
      if (['potato', 'onion', 'tomato', 'carrot', 'cucumber', 'eggplant', 'green_beans', 'ginger', 'coriander', 'garlic', 'lemon', 'banana'].includes(ing.slug)) {
        batch.box(0.26, 0.1, 0.34, crate, x, lvl + 0.075, z);
        for (let k = 0; k < 7; k++) batch.add(geoFor(look.shape, look.size * 0.9), fillMat, V3(x - 0.08 + (k % 3) * 0.08, lvl + 0.15 + 0.01 * (k % 2), z - 0.08 + Math.floor(k / 3) * 0.08), [0.3 * k, k, 0]);
      } else if (['rice', 'oats'].includes(ing.slug)) {
        batch.add(new THREE.CylinderGeometry(0.1, 0.13, 0.3, 14), sack, V3(x, lvl + 0.17, z));
        batch.add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 14), white, V3(x, lvl + 0.33, z));
      } else if (['honey', 'sugar', 'salt', 'cumin'].includes(ing.slug)) {
        batch.add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16), glass, V3(x, lvl + 0.13, z));
        batch.add(new THREE.CylinderGeometry(0.058, 0.058, 0.14, 16), fillMat, V3(x, lvl + 0.1, z));
        batch.add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), metal, V3(x, lvl + 0.25, z));
      } else if (['milk', 'yogurt', 'cheese', 'egg', 'chicken'].includes(ing.slug)) {
        batch.box(0.16, 0.24, 0.1, white, x, lvl + 0.14, z);
        batch.box(0.16, 0.07, 0.1005, fillMat, x, lvl + 0.1, z);
      } else if (ing.slug === 'oil') {
        batch.add(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), mat(0xe9c13a, 0.2, 0, { transparent: true, opacity: 0.8 }), V3(x, lvl + 0.15, z));
        batch.add(new THREE.CylinderGeometry(0.025, 0.04, 0.08, 10), metal, V3(x, lvl + 0.32, z));
      } else if (ing.slug === 'toast') {
        batch.add(new THREE.BoxGeometry(0.3, 0.12, 0.13), mat(0xe2b877, 0.8), V3(x, lvl + 0.09, z));
        batch.add(new THREE.BoxGeometry(0.3, 0.02, 0.135), mat(0xf6e6c2, 0.8), V3(x, lvl + 0.15, z));
      } else if (ing.slug === 'tomato_paste') {
        batch.add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), metal, V3(x, lvl + 0.09, z));
        batch.add(new THREE.CylinderGeometry(0.061, 0.061, 0.07, 16), fillMat, V3(x, lvl + 0.09, z));
      } else batch.box(0.16, 0.16, 0.12, cardboard, x, lvl + 0.1, z);
      // ملصق: مربع من الأطلس (UV لهذه الخلية) بلون رأسي للتعتيم عند نقص المخزن
      const q = new THREE.PlaneGeometry(0.22, 0.124);
      const uv = q.getAttribute('uv') as THREE.BufferAttribute;
      const u0 = (i % cols) * cw / 1024;
      const v0 = 1 - (Math.floor(i / cols) + 1) * ch / 1024;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * (cw / 1024), v0 + uv.getY(k) * (ch / 1024));
      q.translate(x, lvl - 0.02, z + 0.22);
      q.rotateX(0);
      q.setAttribute('color', new THREE.BufferAttribute(new Float32Array(q.getAttribute('position').count * 3).fill(1), 3));
      quadGeos.push(q);
      // صندوق اختيار شفاف
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(x, lvl + 0.18, z);
      hit.name = `slot_ing_${ing.slug}`;
      hit.userData = { pick: { kind: 'ingredient', id: ing.slug } satisfies Pick };
      this.root.add(hit);
      this.pickables.push(hit);
    });
    batch.build(this.root, this.quality !== 'lite');
    this.labelGeo = mergeGeometries(quadGeos, false)!;
    this.labelColors = this.labelGeo.getAttribute('color') as THREE.BufferAttribute;
    const labels = new THREE.Mesh(this.labelGeo, new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, side: THREE.DoubleSide }));
    labels.name = 'labels_atlas';
    this.root.add(labels);
    void positions;
  }

  /** المعدات: مقلاة وقدر صغير وكبير وقدر ضغط ومحمّصة ووعاء وصحن، ببنية تسمح بالتحريك */
  private buildEquipment(): void {
    const steel = mat(0xb9bfc5, 0.28, 0.9);
    const dark = mat(0x24272b, 0.45, 0.7);
    const black = mat(0x111214, 0.5, 0.4);
    const handleM = mat(0x2a1c10, 0.7);
    const mk = (id: string, kind: string, r: number, h: number, bodyM: THREE.Material): VesselVis => {
      const g = new THREE.Group();
      g.name = `equip_${id}`;
      const wall = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r * 0.96, 0), new THREE.Vector2(r, 0.01), new THREE.Vector2(r * 1.01, h * 0.5), new THREE.Vector2(r * 1.03, h), new THREE.Vector2(r * 0.99, h), new THREE.Vector2(r * 0.95, h * 0.5), new THREE.Vector2(r * 0.9, 0.012)], 36), bodyM);
      wall.userData['proc'] = true;
      wall.castShadow = this.quality !== 'lite';
      wall.receiveShadow = true;
      g.add(wall);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.93, 32), bodyM);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.012;
      floor.userData['proc'] = true;
      g.add(floor);
      // مقبض
      const handle = new THREE.Mesh(new THREE.BoxGeometry(r * 1.25, 0.02, 0.03), handleM);
      handle.position.set(r * 1.5, h * 0.8, 0);
      handle.userData['proc'] = true;
      g.add(handle);
      if (kind === 'pot_small' || kind === 'pot_large' || kind === 'pressure_cooker') {
        const h2 = handle.clone();
        h2.position.x = -r * 1.1;
        h2.scale.x = 0.4;
        h2.userData['proc'] = true;
        g.add(h2);
      }
      let lid: THREE.Object3D | null = null;
      if (kind === 'pressure_cooker' || kind === 'pot_large' || kind === 'pot_small') {
        lid = new THREE.Group();
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 28, 10, 0, Math.PI * 2, 0, Math.PI / 5), bodyM);
        dome.scale.y = 0.6;
        (lid as THREE.Group).add(dome);
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.03, 10), black);
        knob.position.y = r * 0.22;
        (lid as THREE.Group).add(knob);
        if (kind === 'pressure_cooker') {
          const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.04, 12), dark);
          weight.position.set(0, r * 0.28, 0);
          (lid as THREE.Group).add(weight);
        }
        lid.position.y = h;
        lid.visible = false;
        g.add(lid);
      }
      const liquidMat = mat(0x9ec9e0, 0.1, 0, { transparent: true, opacity: 0.75 });
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.01, 28), liquidMat);
      liquid.visible = false;
      g.add(liquid);
      // صندوق اختيار
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, h + 0.1, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = h / 2;
      hit.userData = { pick: { kind: 'vessel', id } satisfies Pick };
      g.add(hit);
      this.pickables.push(hit);
      g.position.copy(this.L.rest[id] ?? V3(0, 1, 0));
      this.root.add(g);
      return { group: g, liquid, liquidMat, lid, target: g.position.clone(), radius: r, height: h };
    };
    this.vessels.set('pan', mk('pan', 'pan', 0.14, 0.05, dark));
    this.vessels.set('pot_small', mk('pot_small', 'pot_small', 0.1, 0.1, steel));
    this.vessels.set('pot_large', mk('pot_large', 'pot_large', 0.16, 0.18, steel));
    this.vessels.set('pressure_cooker', mk('pressure_cooker', 'pressure_cooker', 0.15, 0.2, mat(0xc7ccd1, 0.25, 0.95)));
    this.vessels.set('bowl', mk('bowl', 'bowl', 0.13, 0.08, mat(0xf2efe6, 0.3)));
    this.vessels.set('plate_1', mk('plate_1', 'plate', 0.14, 0.02, mat(0xfcfaf4, 0.2)));
    // المحمّصة
    const tg = new THREE.Group();
    tg.name = 'equip_toaster';
    const tb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.16), mat(0xc0c5ca, 0.25, 0.9));
    tb.position.y = 0.09;
    tb.castShadow = true;
    tg.add(tb);
    for (const dx of [-0.06, 0.06]) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.12), black);
      slot.position.set(dx, 0.182, 0);
      tg.add(slot);
    }
    this.toasterGlow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.1), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0 }));
    this.toasterGlow.position.y = 0.186;
    tg.add(this.toasterGlow);
    const th = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.24), new THREE.MeshBasicMaterial({ visible: false }));
    th.position.y = 0.12;
    th.userData = { pick: { kind: 'toaster', id: 'toaster' } satisfies Pick };
    tg.add(th);
    this.pickables.push(th);
    tg.position.copy(this.L.toaster);
    this.root.add(tg);
    // لوح التقطيع كمنطقة اختيار
    const bh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.42), new THREE.MeshBasicMaterial({ visible: false }));
    bh.position.set(this.L.board.x, this.L.board.y + 0.06, this.L.board.z);
    bh.name = 'board_main';
    bh.userData = { pick: { kind: 'board', id: 'board' } satisfies Pick };
    this.root.add(bh);
    this.pickables.push(bh);
    // الميزان الرقمي
    const sc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.16), mat(0x202428, 0.4, 0.5));
    sc.position.set(0.5, 0.96, 0.05);
    sc.name = 'scale_main';
    this.root.add(sc);
    // أدوات معلقة (مجارف) كالمرجع
    const spat = mat(0xa86a3a, 0.5, 0.2);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.008), spat);
      s.position.set(1.28 + i * 0.16, 1.75, -2.2);
      this.root.add(s);
    }
  }

  private buildBurners(): void {
    const outer = new THREE.ConeGeometry(0.012, 0.05, 6);
    for (let k = 1; k <= 4; k++) {
      const g = new THREE.Group();
      g.name = `burner_${k}`;
      const m = new THREE.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 16; i++) {
        const c = new THREE.Mesh(outer, m);
        const a = (i / 16) * Math.PI * 2;
        c.position.set(Math.cos(a) * 0.075, 0.03, Math.sin(a) * 0.075);
        g.add(c);
      }
      const tipM = new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
      const tip = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 20), tipM);
      tip.rotation.x = Math.PI / 2;
      tip.position.y = 0.06;
      g.add(tip);
      g.position.copy(this.L.burner[k]!);
      g.position.y = 0.96;
      g.visible = false;
      this.root.add(g);
      this.flames.push(g);
      this.flameMats.push(m);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(this.L.burner[k]!);
      hit.userData = { pick: { kind: 'burner', id: String(k) } satisfies Pick };
      this.burnerHits.push(hit);
      this.root.add(hit);
      this.pickables.push(hit);
    }
  }

  private buildSteam(): void {
    const N = 240;
    this.steamPos = new Float32Array(N * 3);
    this.steamSeed = new Float32Array(N);
    for (let i = 0; i < N; i++) this.steamSeed[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.steamPos, 3));
    const tex = canvasTex(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    });
    this.steam = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, size: 0.12, transparent: true, opacity: 0.45, depthWrite: false, sizeAttenuation: true, color: 0xffffff }));
    this.steam.frustumCulled = false;
    this.steam.visible = this.quality !== 'lite';
    for (let i = 0; i < N; i++) {
      this.steamVessel.push('');
      this.smoke.push(false);
    }
    this.root.add(this.steam);
  }

  /* ───── الربط بالمحاكي ───── */
  update(view: SimView, stock: Record<string, number>): void {
    this.view = view;
    this.stock = stock;
    const snap = view.snap;
    this.syncVessels(snap);
    this.syncItems(snap);
    this.syncLabels();
    for (let k = 0; k < 4; k++) {
      const lvl = snap.burners[k] ?? 0;
      const f = this.flames[k]!;
      const used = snap.vessels.some((v) => v.burner === k + 1);
      f.visible = lvl > 0;
      const s = 0.45 + (lvl / 10) * 0.95;
      f.scale.set(1, 0.5 + s, 1);
      f.scale.x = f.scale.z = 0.8 + s * 0.4;
      this.flameMats[k]!.opacity = used ? 0.9 : 0.6;
    }
    const toasting = snap.items.some((i) => i.loc === 'toaster');
    (this.toasterGlow.material as THREE.MeshBasicMaterial).opacity = toasting ? 0.85 : 0;
  }
  private syncLabels(): void {
    INGREDIENTS.forEach((ing, i) => {
      const have = (this.stock[ing.slug] ?? 0) > 0;
      const c = have ? 1 : 0.38;
      for (let k = 0; k < 4; k++) this.labelColors.setXYZ(i * 4 + k, c, c, c);
    });
    this.labelColors.needsUpdate = true;
  }
  private syncVessels(snap: Snapshot): void {
    for (const v of snap.vessels) {
      const vis = this.vessels.get(v.id);
      if (!vis) continue;
      if (this.game && (this.game.heldVessels.has(v.id) || this.game.isFalling(v.id))) continue;
      vis.target.copy(v.burner > 0 ? this.L.burner[v.burner]!.clone().setY(this.L.burner[v.burner]!.y + 0.015) : (this.L.rest[v.id] ?? vis.target));
      if (v.id === 'plate_1' || v.id === 'bowl') vis.target.copy(this.L.rest[v.id]!);
      if (vis.lid) vis.lid.visible = v.lid;
      const liquidG = v.waterG + v.milkG + v.oilG;
      vis.liquid.visible = liquidG > 3;
      if (liquidG > 3) {
        const level = Math.min(vis.height * 0.9, 0.01 + (liquidG / 1000) * 0.12);
        vis.liquid.scale.y = Math.max(1, level / 0.01);
        vis.liquid.position.y = 0.012 + level / 2;
        const milky = v.milkG > v.waterG;
        const oily = v.oilG > v.waterG + v.milkG;
        vis.liquidMat.color.set(oily ? 0xe6b92a : milky ? 0xf6f1e4 : 0x9ec9e0);
        vis.liquidMat.opacity = oily ? 0.9 : milky ? 0.95 : 0.7;
      }
      this.markHot(v);
    }
  }
  private markHot(v: Vessel): void {
    // يُحدَّث عند الرسم (updateSteam) من آخر لقطة
    void v;
  }
  private syncItems(snap: Snapshot): void {
    const alive = new Set<string>();
    const countIn = new Map<string, number>();
    for (const it of snap.items) {
      alive.add(it.id);
      let vis = this.items.get(it.id);
      const sig = `${it.ingredient}|${it.cut ? it.cut.shape + (it.cut.size ?? '') : 'whole'}|${Math.round(it.g0 / 10)}${this.food ? `|${it.peeled ? 'p' : ''}` : ''}`;
      if (!vis || vis.sig !== sig) {
        if (vis) this.disposeItem(it.id);
        vis = this.makeItem(it, sig);
        this.items.set(it.id, vis);
      }
      this.placeItem(it, vis, countIn);
      this.tintItem(it, vis);
    }
    for (const id of [...this.items.keys()]) if (!alive.has(id)) this.disposeItem(id);
  }
  private pieceCount(it: Item): number {
    const L = LOOK[it.ingredient]!;
    const whole = Math.max(1, Math.min(7, Math.round(it.g0 / L.unitG)));
    if (L.shape === 'grain') return Math.min(90, Math.max(18, Math.round(it.g0 / 1.6)));
    if (!it.cut) return whole;
    const f = { slices: 9, cubes: 14, diced: 18, sticks: 10, minced: 30, grated: 26, mashed: 12 }[it.cut.shape] ?? 10;
    return Math.min(40, Math.max(whole * 3, Math.round(f * Math.min(2, Math.max(0.5, it.g0 / L.unitG)))));
  }
  /** مجسمات الطعام من بلندر: اسم → هندسة مركزية بألوان رؤوس + نصف الارتفاع */
  food: Map<string, { geo: THREE.BufferGeometry; half: number }> | null = null;
  async loadFood(url: string): Promise<number> {
    const { parseGlb } = await import('./world/glbLoad.js');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`تعذّر تحميل مجسمات الطعام (${res.status})`);
    const buf = await res.arrayBuffer();
    const gltf = await parseGlb(buf);
    const map = new Map<string, { geo: THREE.BufferGeometry; half: number }>();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const geo = m.geometry.clone();
      geo.applyMatrix4(m.matrixWorld); // ضغط meshopt/التكميم يحمل المقياس في العقدة؛ ننقله إلى الرؤوس (وإزاحة الشبكة تُلغى بالتوسيط)
      geo.computeBoundingBox();
      const c = geo.boundingBox!.getCenter(new THREE.Vector3());
      geo.translate(-c.x, -c.y, -c.z);
      geo.computeBoundingBox();
      // اسم الكائن: العقدة الأم هي food_*/cut_* (الغرف المتعددة المواد تُنتج أبناء بأسماء مشتقة)
      let name = m.name; for (let n: THREE.Object3D | null = m; n; n = n.parent) if (/^(food|cut)_/.test(n.name)) { name = n.name; break; }
      map.set(name, { geo, half: geo.boundingBox!.getSize(new THREE.Vector3()).y / 2 });
    });
    if (this.disposed) return 0;
    this.food = map;
    // إعادة بناء العناصر الحالية بمجسماتها الجديدة
    for (const id of [...this.items.keys()]) this.disposeItem(id);
    if (this.view) this.syncItems(this.view.snap);
    return map.size;
  }
  private kitCount(it: Item, shape: string | null): { n: number; scale: number } {
    const unit = LOOK[it.ingredient]?.unitG ?? 100; const W = Math.max(0.2, it.g0 / unit);
    const cl = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, Math.round(v)));
    if (!shape) {
      if (['oats', 'rice'].includes(it.ingredient)) return { n: cl(it.g0 / 1.6, 18, 90), scale: 1 };
      if (['honey', 'yogurt', 'tomato_paste'].includes(it.ingredient)) return { n: 1, scale: Math.max(0.6, Math.min(2.6, Math.cbrt(W))) };
      return { n: cl(W, 1, 7), scale: 1 };
    }
    const f = { slices: [8, 3, 60], cubes: [10, 4, 60], diced: [28, 8, 100], sticks: [6, 3, 40], minced: [60, 20, 140], grated: [50, 20, 140], mashed: [3, 3, 14] }[shape] ?? [10, 4, 60];
    return { n: cl(W * f[0]!, f[1]!, f[2]!), scale: shape === 'mashed' ? Math.max(0.9, Math.min(1.8, Math.cbrt(W))) : 1 };
  }
  private makeKitItem(it: Item, sig: string): ItemVis | null {
    if (!this.food) return null;
    const shape = it.cut && !['oats', 'rice', 'honey', 'yogurt', 'tomato_paste'].includes(it.ingredient) ? it.cut.shape : null;
    const key = shape ? `cut_${shape}_${it.ingredient}` : it.peeled && this.food.has(`food_${it.ingredient}_peeled`) ? `food_${it.ingredient}_peeled` : `food_${it.ingredient}`;
    const g = this.food.get(key) ?? this.food.get(`food_${it.ingredient}`);
    if (!g) return null;
    const { n, scale } = this.kitCount(it, shape);
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0 });
    const mesh = new THREE.InstancedMesh(g.geo, m, n);
    mesh.castShadow = this.quality !== 'lite';
    mesh.frustumCulled = false;
    mesh.userData = { pick: { kind: 'item', id: it.id } satisfies Pick };
    this.root.add(mesh);
    this.pickables.push(mesh);
    return { mesh, sig, mat: m, kit: { half: g.half, scale, flat: !!shape && shape !== 'sticks' && shape !== 'minced' && shape !== 'grated' } };
  }
  private makeItem(it: Item, sig: string): ItemVis {
    const kitVis = this.makeKitItem(it, sig);
    if (kitVis) return kitVis;
    const L = LOOK[it.ingredient]!;
    const n = this.pieceCount(it);
    const shrink = it.cut ? { slices: 0.9, cubes: 0.55, diced: 0.42, sticks: 0.7, minced: 0.28, grated: 0.3, mashed: 0.5 }[it.cut.shape] ?? 0.6 : 1;
    const shape: Look['shape'] = it.cut && it.cut.shape !== 'slices' && L.shape !== 'grain' && L.shape !== 'slice' ? 'box' : it.cut?.shape === 'slices' && L.shape !== 'slice' ? 'slice' : L.shape;
    const geo = geoFor(shape, Math.max(0.004, L.size * shrink));
    const m = mat(L.color, 0.6);
    const mesh = new THREE.InstancedMesh(geo, m, n);
    mesh.castShadow = this.quality !== 'lite';
    mesh.frustumCulled = false;
    mesh.userData = { pick: { kind: 'item', id: it.id } satisfies Pick };
    this.root.add(mesh);
    this.pickables.push(mesh);
    return { mesh, sig, mat: m };
  }
  private disposeItem(id: string): void {
    const v = this.items.get(id);
    if (!v) return;
    this.root.remove(v.mesh);
    this.pickables = this.pickables.filter((p) => p !== v.mesh);
    v.mesh.dispose();
    v.mat.dispose();
    this.items.delete(id);
  }
  private slotPos(loc: string, idx: number): THREE.Vector3 {
    if (loc === 'board') return V3(this.L.board.x - 0.18 + (idx % 4) * 0.12, this.L.board.y + 0.05, this.L.board.z + (Math.floor(idx / 4) - 0.5) * 0.14);
    if (loc === 'toaster') return V3(this.L.toaster.x, this.L.toaster.y + 0.14, this.L.toaster.z);
    const v = this.vessels.get(loc);
    return v ? v.group.position.clone().add(V3(0, 0.03, 0)) : V3(0, -5, 0);
  }
  private placeItem(it: Item, vis: ItemVis, countIn: Map<string, number>): void {
    const idx = countIn.get(it.loc) ?? 0;
    countIn.set(it.loc, idx + 1);
    const heldPos = this.heldItems.get(it.id);
    const spot = it.loc === 'board' ? this.itemSpots.get(it.id) : undefined;
    const base = heldPos ?? spot ?? this.slotPos(it.loc, idx);
    const v = heldPos || spot ? undefined : this.vessels.get(it.loc);
    const r = v ? v.radius * 0.7 : 0.05;
    const n = vis.mesh.count;
    const rr = rnd(it.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7));
    if (vis.kit) { this.placeKit(it, vis, base, v ? v.radius * 0.72 : it.loc === 'board' || spot ? 0.11 : 0.07, rr, !!v); return; }
    const L = LOOK[it.ingredient]!;
    for (let i = 0; i < n; i++) {
      const a = rr() * Math.PI * 2;
      const d = Math.sqrt(rr()) * r * (it.loc === 'toaster' ? 0.2 : 1);
      const y = base.y + (v ? 0.01 + (v.liquid.visible ? 0.02 : 0) : 0) + rr() * 0.015 + (L.shape === 'slice' ? i * 0.006 : 0);
      tmpE.set(rr() * 0.5, rr() * 6.28, rr() * 0.5);
      tmpQ.setFromEuler(tmpE);
      const sc = it.moisture < 1 ? 0.88 + 0.12 * it.moisture : 1;
      tmpM.compose(V3(base.x + Math.cos(a) * d, y, base.z + Math.sin(a) * d), tmpQ, V3(sc, sc, sc));
      vis.mesh.setMatrixAt(i, tmpM);
    }
    vis.mesh.instanceMatrix.needsUpdate = true;
  }
  /** توزيع حلزوني منتظم (لا تداخل) مع طبقات؛ الشرائح مسطّحة والباقي بميل خفيف */
  private placeKit(it: Item, vis: ItemVis, base: THREE.Vector3, rad: number, rr: () => number, inVessel: boolean): void {
    const k = vis.kit!; const n = vis.mesh.count; const wet = inVessel && !!(this.vessels.get(it.loc)?.liquid.visible);
    const perLayer = Math.max(6, Math.round(Math.PI * rad * rad / (Math.max(0.012, k.half * 2.2) ** 2) * 0.55));
    for (let i = 0; i < n; i++) {
      const layer = Math.floor(i / perLayer); const j = i % perLayer; const m = Math.min(perLayer, n - layer * perLayer);
      const a = j * 2.399963 + layer * 0.9; const d = n === 1 ? 0 : rad * Math.sqrt((j + 0.5) / m) * (n < 6 ? 0.6 : 1);
      tmpE.set(k.flat ? 0 : (rr() - 0.5) * 0.5, rr() * 6.283, k.flat ? 0 : (rr() - 0.5) * 0.5);
      tmpQ.setFromEuler(tmpE);
      const sc = k.scale * (it.moisture < 1 ? 0.9 + 0.1 * it.moisture : 1) * (0.92 + rr() * 0.16);
      const y = base.y + k.half * sc + layer * k.half * 1.6 + (inVessel ? 0.012 : 0) + (wet ? 0.02 : 0);
      tmpM.compose(V3(base.x + Math.cos(a) * d, y, base.z + Math.sin(a) * d), tmpQ, V3(sc, sc, sc));
      vis.mesh.setMatrixAt(i, tmpM);
    }
    vis.mesh.instanceMatrix.needsUpdate = true;
  }
  private tintItem(it: Item, vis: ItemVis): void {
    const L = LOOK[it.ingredient]!;
    if (vis.kit) {
      // لون الحالة يضرب ألوان الرؤوس: نضج ← نسبة اللون الناضج إلى الخام، تحمير ← بنّي، حرق ← فحمي
      const c0 = new THREE.Color(L.color), c1 = new THREE.Color(L.done);
      const ratio = (a: number, b: number): number => Math.max(0.35, Math.min(1.12, a / Math.max(0.05, b)));
      tmpC.setRGB(1, 1, 1).lerp(new THREE.Color(ratio(c1.r, c0.r), ratio(c1.g, c0.g), ratio(c1.b, c0.b)), Math.min(1, it.doneness));
      tmpC.lerp(C_BROWN_MUL, Math.min(1, it.browning) * 0.8).lerp(C_BURN_MUL, Math.min(1, it.burn * 1.4));
      vis.mat.color.copy(tmpC);
      vis.mat.emissive.setRGB(0, 0, 0);
      if (it.loc === 'toaster') vis.mat.emissive.setRGB(0.25, 0.05, 0);
      return;
    }
    tmpC.set(L.color).lerp(new THREE.Color(L.done), Math.min(1, it.doneness));
    if (it.ingredient === 'egg' && it.peeled) tmpC.set(0xfaf6ea);
    tmpC.lerp(C_BROWN, Math.min(1, it.browning) * 0.85).lerp(C_BURN, Math.min(1, it.burn * 1.4));
    vis.mat.color.copy(tmpC);
    vis.mat.emissive.setRGB(0, 0, 0);
    if (it.loc === 'toaster') vis.mat.emissive.setRGB(0.25, 0.05, 0);
  }

  /* ───── الكاميرا ───── */
  goStation(name: StationName, instant = false): void {
    const st = STATIONS[name];
    this.station = name;
    if (this.fp) {
      const cs = this.contractStations.get(name);
      if (cs) this.fp.teleport(cs.eye, cs.look, name === 'shelves' ? 1.45 : 0.95);
      return;
    }
    this.camFrom = { p: this.camera.position.clone(), l: this.lookNow.clone() };
    this.camTo = { p: st.cam.clone(), l: st.look.clone() };
    this.camT = instant || this.o.reducedMotion ? 1 : 0;
    this.camDur = 0.5;
    this.yaw = 0;
    this.pitch = 0;
    if (instant || this.o.reducedMotion) {
      this.camera.position.copy(st.cam);
      this.lookNow.copy(st.look);
      this.camera.lookAt(st.look);
    }
  }
  get currentStation(): StationName {
    return this.station;
  }

  /* ───── التفاعل ───── */
  private bind(): void {
    const el = this.o.canvas;
    el.addEventListener('pointerdown', (e) => {
      if (this.fp) return;
      this.drag = { x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (this.fp) return;
      if (this.drag) {
        const dx = e.clientX - this.drag.x;
        const dy = e.clientY - this.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.drag.moved = true;
        if (this.drag.moved) {
          this.yaw = Math.max(-0.45, Math.min(0.45, this.yaw - dx * 0.003));
          this.pitch = Math.max(-0.3, Math.min(0.3, this.pitch - dy * 0.002));
          this.drag.x = e.clientX;
          this.drag.y = e.clientY;
        }
      }
    });
    el.addEventListener('pointerup', (e) => {
      if (this.fp) return;
      const moved = this.drag?.moved;
      this.drag = null;
      if (moved) return;
      const hit = this.pickAt(e.clientX, e.clientY);
      if (hit) this.o.onPick(hit);
    });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el.parentElement ?? el);
    this.resize();
  }
  private ro: ResizeObserver | null = null;
  pickAt(cx: number, cy: number): Pick | null {
    const r = this.o.canvas.getBoundingClientRect();
    this.ptr.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera);
    const hits = this.ray.intersectObjects(this.pickables, false);
    for (const h of hits) {
      const p = (h.object.userData as { pick?: Pick }).pick;
      if (p) return p;
    }
    return null;
  }
  private resize(): void {
    const el = this.o.canvas.parentElement ?? this.o.canvas;
    const w = Math.max(160, el.clientWidth);
    const h = Math.max(160, el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ───── الرسم ───── */
  private loop = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    this.clock.update();
    const dt = Math.min(0.1, this.clock.getDelta());
    const t = this.clock.getElapsed();
    if (this.fp) this.stepWorld(dt);
    // انتقال الكاميرا (≤ 600ms) مع مدار محدود
    else if (this.camT < 1) {
      this.camT = Math.min(1, this.camT + dt / this.camDur);
      const e = this.camT * this.camT * (3 - 2 * this.camT);
      this.camera.position.lerpVectors(this.camFrom.p, this.camTo.p, e);
      this.lookNow.lerpVectors(this.camFrom.l, this.camTo.l, e);
    }
    if (!this.fp) {
      const off = this.lookNow.clone().sub(this.camera.position);
      off.applyAxisAngle(V3(0, 1, 0), this.yaw);
      const look = this.camera.position.clone().add(off);
      look.y += this.pitch * off.length();
      this.camera.lookAt(look);
    }
    // حركة المعدات نحو أهدافها
    for (const v of this.vessels.values()) v.group.position.lerp(v.target, this.o.reducedMotion ? 1 : Math.min(1, dt * 8));
    // اللهب
    if (!this.o.reducedMotion) for (const [i, f] of this.flames.entries()) if (f.visible) f.children.forEach((c, k) => { c.scale.y = 0.85 + 0.3 * Math.sin(t * 14 + k + i); });
    this.updateSteam(t, dt);
    this.renderer.render(this.scene, this.camera);
    // قياس الأداء والتدرج التلقائي (3D-50)
    this.frames++;
    this.acc += dt;
    if (this.acc >= 1) {
      this.fps = this.frames / this.acc;
      this.frames = 0;
      this.acc = 0;
      this.lowStreak = this.fps < 24 ? this.lowStreak + 1 : 0;
      if (this.lowStreak >= 3 && this.quality !== 'lite') {
        const next: Quality = this.quality === 'high' ? 'standard' : 'lite';
        this.lowStreak = 0;
        this.setQuality(next);
        this.o.onQuality?.(next, `أداء الرسم ${Math.round(this.fps)} إطارًا/ث — خُفِّضت الجودة تلقائيًا`);
      }
      (window as unknown as { __kitchen3d?: unknown }).__kitchen3d = this.stats();
    }
  };
  private updateSteam(t: number, dt: number): void {
    if (this.quality === 'lite' || !this.view) return;
    const hot = this.view.snap.vessels.filter((v) => v.T > 65 && (v.waterG + v.milkG > 2 || v.T > 120) && v.id !== 'plate_1' && v.id !== 'bowl');
    const N = this.steamSeed.length;
    const per = Math.max(1, Math.floor(N / Math.max(1, hot.length)));
    let idx = 0;
    const q = this.quality === 'high' ? 1 : 0.55;
    for (const v of hot) {
      const vis = this.vessels.get(v.id)!;
      const intensity = Math.min(1, (v.T - 65) / 40);
      const smoky = v.smoking;
      for (let k = 0; k < per && idx < N; k++, idx++) {
        const s = this.steamSeed[idx]!;
        const life = (t * (smoky ? 0.5 : 0.35) + s) % 1;
        const a = s * 40 + t * 0.4;
        this.steamPos[idx * 3] = vis.group.position.x + Math.cos(a) * vis.radius * 0.6 * (0.3 + life);
        this.steamPos[idx * 3 + 1] = vis.group.position.y + vis.height + 0.04 + life * (0.5 + intensity * 0.4);
        this.steamPos[idx * 3 + 2] = vis.group.position.z + Math.sin(a) * vis.radius * 0.6 * (0.3 + life);
        if (k / per > intensity * q) this.steamPos[idx * 3 + 1] = -10;
      }
    }
    for (; idx < N; idx++) this.steamPos[idx * 3 + 1] = -10;
    (this.steam.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    const smoking = this.view.snap.vessels.some((v) => v.smoking);
    (this.steam.material as THREE.PointsMaterial).color.set(smoking ? 0x555555 : 0xffffff);
    void dt;
  }


  /* ───── العالم: جولة بالقدمين ويدان وفيزياء (الشخص الأول) ───── */
  private roomObjs: THREE.Object3D[] = [];
  private worldRoot: THREE.Object3D | null = null;
  private fp: FirstPerson | null = null;
  private hands: Hands | null = null;
  game: Game | null = null;
  itemSpots = new Map<string, THREE.Vector3>();
  heldItems = new Map<string, THREE.Vector3>();
  private tools = new Map<string, ToolDef>();
  private places: { bin: THREE.Vector3 | null; sink: THREE.Vector3 | null } = { bin: null, sink: null };
  private colliders: Aabb[] = [];
  private supports: Aabb[] = [];
  private contractStations = new Map<string, { eye: THREE.Vector3; look: THREE.Vector3 }>();
  private hoverKey = '';
  private hoverT = 0;
  worldReady = false;
  /** إعدادات اللعب: الحساسية وزاوية الرؤية وعكس المحور؛ التعليق يوقف المشي والنظر والأيدي (قائمة مفتوحة) */
  setGame(o: { sens?: number; fov?: number; invertY?: boolean; paused?: boolean }): void {
    if (this.fp) {
      if (o.sens !== undefined) this.fp.sens = o.sens;
      if (o.invertY !== undefined) this.fp.invertY = o.invertY;
      if (o.paused !== undefined) this.fp.paused = o.paused;
    }
    if (o.fov !== undefined) { this.camera.fov = o.fov; this.camera.updateProjectionMatrix(); }
  }
  /** واجهة اختبارات E2E فقط (تُفعَّل بـ?e2e): تحريك اللاعب وتوجيه النظر وقراءة مواضع العقد */
  e2e = {
    stand: (x: number, z: number): void => this.fp?.setPos(x, z),
    look: (x: number, y: number, z: number): void => this.fp?.lookAtPoint(x, y, z),
    tool: (id: string): number[] | null => { const t = this.tools.get(id); return t ? t.node.position.toArray().map((n) => +n.toFixed(3)) : null; },
    item: (id: string): number[] | null => { const v = this.itemSpots.get(id) ?? this.heldItems.get(id); return v ? v.toArray().map((n) => +n.toFixed(3)) : null; },
    slot: (slug: string): number[] | null => { const o = this.pickables.find((m) => { const k = (m.userData as { pick?: Pick }).pick; return k?.kind === 'ingredient' && k.id === slug; }); return o ? o.getWorldPosition(new THREE.Vector3()).toArray().map((x) => +x.toFixed(3)) : null; },
    node: (n: string): number[] | null => { const o = this.worldRoot?.getObjectByName(n); return o ? o.getWorldPosition(new THREE.Vector3()).toArray().map((x) => +x.toFixed(3)) : null; },
    holds: (): string => JSON.stringify(this.game?.hold ?? {}),
    aim: (reach = 1.9): string => { const a = this.aim(reach, () => false); return JSON.stringify(a ? { pick: a.pick, d: +a.dist.toFixed(2) } : null); },
    press: (btn: 0 | 2, ms = 100): Promise<void> => new Promise((ok) => { const t0 = performance.now(); this.game?.button(btn, true, t0); window.setTimeout(() => { this.game?.button(btn, false, t0 + ms); ok(); }, ms); }),
    swipe: (px: number): void => this.fp?.addMotion(px, 0),
    snap: (): string => JSON.stringify((this.view?.snap.items ?? []).map((i) => ({ id: i.id, ing: i.ingredient, g: i.g0, loc: i.loc, cut: i.cut?.shape ?? null, peeled: i.peeled, washed: i.washed }))),
    vessels: (): string => JSON.stringify((this.view?.snap.vessels ?? []).map((v) => ({ id: v.id, burner: v.burner, items: v.items, oil: v.oilG, water: v.waterG, milk: v.milkG, T: Math.round(v.T) }))),
    burners: (): number[] => this.view?.snap.burners ?? [],
  };
  lockPointer(): void { this.fp?.lock(); }
  unlockPointer(): void { this.fp?.unlock(); }
  /** مواقع الأوعية وأحجامها (للاختبار والتشخيص) */
  vesselInfo(): Record<string, { x: number; y: number; z: number; size: number[] }> {
    const out: Record<string, { x: number; y: number; z: number; size: number[] }> = {};
    for (const [id, v] of this.vessels) {
      const bb = new THREE.Box3().setFromObject(v.group); const sz = bb.getSize(new THREE.Vector3());
      out[id] = { x: +v.group.position.x.toFixed(2), y: +v.group.position.y.toFixed(2), z: +v.group.position.z.toFixed(2), size: [sz.x, sz.y, sz.z].map((n) => +n.toFixed(2)) };
    }
    return out;
  }
  /** معلومات اللاعب للاختبار والواجهة */
  playerInfo(): { x: number; z: number; yaw: number; crouch: boolean; locked: boolean } | null {
    return this.fp ? { x: this.fp.pos.x, z: this.fp.pos.z, yaw: this.fp.yaw, crouch: this.fp.crouch, locked: this.fp.locked } : null;
  }

  /**
   * يحمّل عالم المطبخ (GLB من بلندر) فيستبدل الغرفة الإجرائية، ويقرأ العقد: spawn_player وcam_station_* وburner_* وequip_* وboard_main وslot_ing_*،
   * ويشغّل متحكم الشخص الأول واليدين. ما يفشل تحميله يبقى المشهد الإجرائي (يرمي لتلتقطه الواجهة).
   */
  async loadWorld(url: string): Promise<{ nodes: number; slots: number; gaps: string[] }> {
    const { parseGlb } = await import('./world/glbLoad.js');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`تعذّر تحميل العالم (${res.status})`);
    const buf = await res.arrayBuffer();
    if (new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') throw new Error('الملف ليس GLB');
    const gltf = await parseGlb(buf);
    if (this.disposed) return { nodes: 0, slots: 0, gaps: [] };
    const W = gltf.scene;
    W.updateMatrixWorld(true);
    const byName = new Map<string, THREE.Object3D>();
    W.traverse((o) => { if (o.name) byName.set(o.name, o); });
    const wp = (o: THREE.Object3D): THREE.Vector3 => o.getWorldPosition(new THREE.Vector3());

    // 1) إخفاء الغرفة الإجرائية وصناديق اختيار الرفوف القديمة
    for (const o of this.roomObjs) o.visible = false;
    this.pickables = this.pickables.filter((m) => (m.userData as { pick?: Pick }).pick?.kind !== 'ingredient');
    // 2) مظهر الوعاء من GLB (equip_*, plate_1) فوق مجموعات المحاكاة؛ المواقع الجديدة من العقد
    const gaps: string[] = [];
    for (const id of ['pan', 'pot_small', 'pot_large', 'pressure_cooker', 'bowl', 'plate_1']) {
      const node = byName.get(id === 'plate_1' ? 'plate_1' : `equip_${id}`);
      const vis = this.vessels.get(id);
      if (!node || !vis) { gaps.push(id === 'plate_1' ? 'plate_1' : `equip_${id}`); continue; }
      const pos = wp(node);
      this.L.rest[id] = pos.clone();
      vis.group.children.forEach((c) => { if (c.userData['proc']) c.visible = false; });
      const c = node.clone(true); c.position.set(0, 0, 0); // المقياس والدوران من العقدة نفسها (بلندر يضعهما على الكائن)
      c.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = this.quality !== 'lite'; m.receiveShadow = true; } });
      vis.group.add(c);
      vis.group.position.copy(pos); vis.target.copy(pos);
      node.visible = false;
    }
    // 3) المواقد والمحمّصة واللوح من العقد
    for (let k = 1; k <= 4; k++) {
      const n = byName.get(`burner_${k}`);
      if (!n) { gaps.push(`burner_${k}`); continue; }
      const p = wp(n); this.L.burner[k] = p.clone();
      const fl = this.flames[k - 1]; if (fl) fl.position.copy(p);
      const hit = this.burnerHits[k - 1]; if (hit) hit.position.copy(p);
      // مقبض اللهب على الواجهة الأمامية للطاولة (نقرة = تدوير مستوى اللهب)
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ visible: false }));
      kb.position.set(p.x - 0.36, p.y - 0.15, p.z); kb.userData = { pick: { kind: 'knob', id: String(k) } satisfies Pick };
      this.root.add(kb); this.pickables.push(kb);
    }
    const tb = byName.get('equip_toaster'); const toasterG = this.root.getObjectByName('equip_toaster');
    if (tb && toasterG && toasterG !== tb) { const p = wp(tb); this.L.toaster.copy(p); toasterG.position.copy(p); tb.visible = false; }
    const bm = byName.get('board_main');
    if (bm) { const bb = new THREE.Box3().setFromObject(bm); this.L.board.set((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2); const bh = this.root.getObjectByName('board_main'); if (bh && bh !== bm) bh.position.set(this.L.board.x, this.L.board.y + 0.06, this.L.board.z); }
    // 4) خانات المكوّنات: صناديق اختيار حول عقد slot_ing_*
    let slots = 0;
    for (const ing of INGREDIENTS) {
      const n = byName.get(`slot_ing_${ing.slug}`);
      if (!n) { gaps.push(`slot_ing_${ing.slug}`); continue; }
      const bb = new THREE.Box3().setFromObject(n); bb.expandByScalar(0.05);
      const sz = bb.getSize(new THREE.Vector3()); const c = bb.getCenter(new THREE.Vector3());
      const hit = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(c); hit.userData = { pick: { kind: 'ingredient', id: ing.slug } satisfies Pick };
      this.root.add(hit); this.pickables.push(hit); slots++;
    }
    // 5) الإضاءة الداخلية: مصابيح السقف (نقاط) بدل الشمس
    this.sun.intensity = 0.25;
    this.root.traverse((o) => { if ((o as THREE.HemisphereLight).isHemisphereLight) (o as THREE.HemisphereLight).intensity = 0.32; });
    this.renderer.toneMappingExposure = 0.95;
    this.root.traverse((o) => { if ((o as THREE.PointLight).isPointLight) o.visible = false; }); // مصابيح المشهد الإجرائي القديم (شديدة) تُطفأ
    for (const [x, z] of [[-2.5, 1.3], [2.5, -1.1], [0, 1.3], [-2.5, -1.1], [0, -1.1], [2.5, 1.3]] as const) {
      const l = new THREE.PointLight(0xfff0d8, 3.4, 9, 1.4); l.position.set(x, 2.85, z); this.root.add(l); this.worldLights.push(l);
    }
    this.applyWorldLights();
    // 6) المصادمات: مصادمات صريحة COL_* + صناديق الأجسام الثابتة PRP_* (عدا المدمجة المتناثرة) + أسطح الدعم للفيزياء
    const colliders: Aabb[] = [];
    const supports: Aabb[] = [];
    const add = (box: Aabb, support: boolean): void => { colliders.push(box); if (support && box.maxY < 1.2) supports.push(box); };
    for (const [name, o] of byName) {
      const ex = o.userData as { min?: number[]; max?: number[] };
      if (/^SUP_/.test(name) && ex.min && ex.max) { supports.push({ minX: ex.min[0]!, maxX: ex.max[0]!, minY: ex.min[1]!, maxY: ex.max[1]!, minZ: ex.min[2]!, maxZ: ex.max[2]!, name }); continue; }
      if (/^COL_/.test(name) && ex.min && ex.max) { add({ minX: ex.min[0]!, maxX: ex.max[0]!, minY: ex.min[1]!, maxY: ex.max[1]!, minZ: ex.min[2]!, maxZ: ex.max[2]!, name }, true); continue; }
      if (!/^PRP_/.test(name) || /_\d+$/.test(name) || /hood|tool_rail|wall_shelf|planters|herbs|faucet|extinguisher|boxes|crates|barrel|knobs|fruit|island_|knife|board|griddle|range_top|cumin|honey/.test(name)) continue;
      const b = new THREE.Box3().setFromObject(o);
      if (!isFinite(b.min.x)) continue;
      add({ minX: b.min.x, maxX: b.max.x, minY: b.min.y, maxY: b.max.y, minZ: b.min.z, maxZ: b.max.z, name }, !/equipment_rack/.test(name));
    }
    this.colliders = colliders; this.supports = supports;
    // 7) محطات الكاميرا من العقد (eye/look في extras بإحداثيات glTF)
    for (const n of ['shelves', 'equipment', 'tools', 'prep', 'stove', 'sink', 'serve'] as const) {
      const o = byName.get(`cam_station_${n}`);
      const eye = (o?.userData as { eye?: number[]; look?: number[] } | undefined)?.eye; const look = (o?.userData as { look?: number[] } | undefined)?.look;
      if (o && eye && look) this.contractStations.set(n, { eye: new THREE.Vector3(...(eye as [number, number, number])), look: new THREE.Vector3(...(look as [number, number, number])) });
      else gaps.push(`cam_station_${n}`);
    }
    // 8) المتحكم واليدان
    const sp = byName.get('spawn_player'); const spawn = sp ? wp(sp) : new THREE.Vector3(0, 0, 2.5);
    this.worldRoot = W; this.root.add(W);
    // الأدوات اليدوية tool_* ومواضع الإفلات
    this.tools.clear();
    for (const [id, info] of Object.entries(TOOL_INFO)) {
      const node = byName.get(`tool_${id}`);
      if (!node) { gaps.push(`tool_${id}`); continue; }
      const bb = new THREE.Box3().setFromObject(node); const sz = bb.getSize(new THREE.Vector3()).addScalar(0.06); const c = node.worldToLocal(bb.getCenter(new THREE.Vector3()));
      const hit = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(c); hit.userData = { pick: { kind: 'tool', id } satisfies Pick };
      node.add(hit); this.pickables.push(hit);
      node.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = this.quality !== 'lite'; } });
      this.tools.set(id, { id, node, label: info.label, mode: info.mode, home: node.position.clone(), homeQuat: node.quaternion.clone(), body: null, flat: true, base: info.base, roll: info.roll, pitch: info.pitch, tilt: 0 });
    }
    const dp = (n: string): THREE.Vector3 | null => { const o = byName.get(n); return o ? wp(o) : null; };
    this.places = { bin: dp('drop_trash'), sink: dp('drop_sink') };
    this.hands = new Hands(this.camera); this.scene.add(this.camera);
    this.fp = new FirstPerson({ canvas: this.o.canvas, camera: this.camera, colliders, room: { minX: -3.95, maxX: 3.95, minZ: -3.15, maxZ: 3.15 }, spawn, yaw: 0, reducedMotion: this.o.reducedMotion, onClickAction: (b, d, ts) => this.game?.button(b, d, ts), onKey: (c, sh) => this.game?.key(c, sh), onWheel: (d) => this.game?.wheel(d) });
    if (this.o.host) {
      this.game = new Game({
        camera: this.camera, fp: this.fp, hands: this.hands, host: this.o.host, view: () => this.view,
        raycast: (reach, skip) => { const a = this.aim(reach, skip ?? (() => false)); return a ? { pick: a.pick, point: a.point, distance: a.dist } : null; },
        vessels: () => this.vessels, burner: (k) => this.L.burner[k], toaster: () => this.L.toaster,
        setRest: (id, p) => { this.L.rest[id] = p.clone(); },
        itemSpots: this.itemSpots, heldItems: this.heldItems, refreshItem: (id) => this.refreshItem(id),
        supports: () => this.supports, colliders: () => this.colliders, room: { minX: -3.9, maxX: 3.9, minZ: -3.1, maxZ: 3.1 },
        tools: this.tools, places: this.places, burners: () => this.view?.snap.burners ?? [0, 0, 0, 0], disposed: () => this.disposed,
      }, (h) => this.o.onHud?.(h));
    }
    this.o.canvas.tabIndex = 0;
    this.camera.fov = 70; this.camera.near = 0.03; this.camera.updateProjectionMatrix();
    this.scene.fog = new THREE.Fog(0x2b2622, 14, 30);
    // بيئة إضاءة غير مباشرة بسيطة: بدونها يظهر الستانلس (معدن 100%) أسود تمامًا
    try {
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environment = this.quality === 'lite' ? null : this.envMap;
      this.scene.environmentIntensity = 0.3;
      pm.dispose();
    } catch { /* اختياري */ }
    this.mergeStatic(W);
    // تجميع الشيدرات مسبقًا (بما فيها الأوعية والأدوات) كي لا يحدث تجمّد عند أول إمساك
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* اختياري */ }
    this.worldReady = true;
    W.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.receiveShadow = this.quality !== 'lite'; } });
    // الستانلس بمعدنية 100% يعكس غرفة معتمة فيظهر أسود: نخفّف المعدنية ونرفع الخشونة قليلًا (مظهر ستانلس مصقول مطفأ)
    const seen = new Set<THREE.Material>();
    W.traverse((m) => {
      const mm = (m as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!(m as THREE.Mesh).isMesh || !mm || seen.has(mm) || !('metalness' in mm)) return;
      seen.add(mm);
      if (mm.metalness > 0.55) { mm.metalness = 0.55; mm.roughness = Math.max(mm.roughness, 0.38); }
    });
    return { nodes: byName.size, slots, gaps };
  }
  /**
   * دمج مجسمات العالم الثابتة بحسب المادة (PERF-20: draw calls ≤ 150). لا يدمج ما يتحرك أو يُختار (tool_/equip_/plate_1) ولا العقد المتعاقد عليها.
   * الأصل المضغوط (meshopt) مكمّم بأعداد صحيحة منسّقة: نحوّل إلى Float32 قبل تطبيق مصفوفة العالم كي لا تُقصّ القيم.
   */
  private mergeStatic(W: THREE.Object3D): void {
    W.updateMatrixWorld(true);
    const dynamic = /^(tool_|equip_|plate_1|burner_|COL_|SUP_|cam_station_|spawn_|drop_)/;
    const groups = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
    W.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material)) return;
      for (let n: THREE.Object3D | null = m; n; n = n.parent) if (dynamic.test(n.name)) return;
      const g = m.geometry;
      const sig = `${(m.material as THREE.Material).uuid}|${Object.keys(g.attributes).sort().join(',')}|${g.index ? 'i' : 'n'}`;
      const grp = groups.get(sig) ?? { mat: m.material as THREE.Material, geos: [], meshes: [] };
      const f = g.clone();
      for (const [name, at] of Object.entries(f.attributes)) {
        const src = at as THREE.BufferAttribute;
        const arr = new Float32Array(src.count * src.itemSize);
        for (let i = 0; i < src.count; i++) for (let k = 0; k < src.itemSize; k++) arr[i * src.itemSize + k] = k === 0 ? src.getX(i) : k === 1 ? src.getY(i) : k === 2 ? src.getZ(i) : src.getW(i);
        f.setAttribute(name, new THREE.BufferAttribute(arr, src.itemSize));
      }
      f.applyMatrix4(m.matrixWorld);
      grp.geos.push(f); grp.meshes.push(m); groups.set(sig, grp);
    });
    let merged = 0;
    for (const grp of groups.values()) {
      if (grp.geos.length < 2) { grp.geos.forEach((g) => g.dispose()); continue; }
      const geo = mergeGeometries(grp.geos, false);
      grp.geos.forEach((g) => g.dispose());
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, grp.mat);
      mesh.castShadow = this.quality !== 'lite'; mesh.receiveShadow = true;
      W.add(mesh);
      for (const m of grp.meshes) m.parent?.remove(m);
      merged += grp.meshes.length;
    }
    this.mergedStatic = merged;
  }
  mergedStatic = 0;
  private burnerHits: THREE.Mesh[] = [];

  /** الهدف تحت المؤشر (مركز الشاشة): أقرب عنصر قابل للاختيار ضمن الذراع؛ skip يتجاوز بعض الأهداف (ما في اليد مثلًا) */
  private aim(reach = 2.6, skip?: (p: Pick) => boolean): { pick: Pick; point: THREE.Vector3; dist: number } | null {
    this.ptr.set(0, 0);
    this.ray.setFromCamera(this.ptr, this.camera);
    this.ray.far = reach;
    const hits = this.ray.intersectObjects(this.pickables, false);
    this.ray.far = Infinity;
    const sk = skip ?? ((p: Pick) => !!this.game?.isHeldPick(p));
    for (const h of hits) {
      const pick = (h.object.userData as { pick?: Pick }).pick;
      if (pick && !sk(pick)) return { pick, point: h.point.clone(), dist: h.distance };
    }
    return null;
  }

  /** يعيد رسم عنصر واحد من آخر لقطة (يُستدعى كل إطار لما في اليد) */
  refreshItem(id: string): void {
    const it = this.view?.snap.items.find((x) => x.id === id); const vis = this.items.get(id);
    if (it && vis) this.placeItem(it, vis, new Map());
  }
  private stepWorld(dt: number): void {
    if (!this.fp) return;
    this.fp.update(dt);
    this.hands?.update(dt);
    this.game?.step(dt);
    // تلميح الهدف (10 مرات/ث) للواجهة
    this.hoverT += dt;
    if (this.hoverT > 0.1) {
      this.hoverT = 0;
      const a = this.aim();
      const key = a ? `${a.pick.kind}:${a.pick.id}` : '';
      if (key !== this.hoverKey) { this.hoverKey = key; this.o.onHover?.(a?.pick ?? null); }
    }
  }

  /** إحصاءات الرسم للميزانيات (PERF-20): draw calls والمثلثات من آخر إطار */
  stats(): { fps: number; triangles: number; calls: number; quality: Quality; geometries: number; textures: number; kit: 'procedural' | 'glb' } {
    const i = this.renderer.info;
    return { fps: Math.round(this.fps), triangles: i.render.triangles, calls: i.render.calls, quality: this.quality, geometries: i.memory.geometries, textures: i.memory.textures, kit: this.kitApplied ? 'glb' : 'procedural' };
  }
  private kitApplied = false;
  /**
   * يحمّل حزمة GLB (3D-10) ويستبدل أشكال الأوعية والأدوات بالأسماء فقط؛ ما لا يوجد فيها يبقى إجرائيًا.
   * يرمي عند فشل التحميل (يلتقطه المستدعي ويبقى المشهد الإجرائي).
   */
  async loadKit(url: string): Promise<{ applied: string[]; gaps: string[]; unknown: string[] }> {
    const [{ parseGlb }, { planKit }] = await Promise.all([import('./world/glbLoad.js'), import('./kitApply.js')]);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`تعذّر تحميل الحزمة (${res.status})`);
    const buf = await res.arrayBuffer();
    if (new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') throw new Error('الملف ليس GLB');
    const gltf = await parseGlb(buf);
    if (this.disposed) return { applied: [], gaps: [], unknown: [] };
    const plan = planKit(gltf.scene, new Set(INGREDIENTS.map((i) => i.slug)));
    const applied: string[] = [];
    for (const [id, node] of plan.vessels) {
      const vis = this.vessels.get(id);
      if (!vis) continue;
      vis.group.children.forEach((c) => { if (c.userData['proc']) c.visible = false; });
      const c = node.clone(true);
      c.position.set(0, 0, 0);
      c.rotation.set(0, 0, 0);
      c.scale.setScalar(plan.unit);
      c.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = this.quality !== 'lite'; o.receiveShadow = true; } });
      c.userData['kit'] = true;
      vis.group.add(c);
      applied.push(id === 'plate_1' ? 'plate_1' : `equip_${id}`);
    }
    for (const [name, node] of plan.tools) {
      const c = node.clone(true);
      c.scale.multiplyScalar(plan.unit);
      c.position.multiplyScalar(plan.unit);
      this.root.add(c);
      applied.push(`tool_${name}`);
    }
    this.kitApplied = applied.length > 0;
    return { applied, gaps: plan.gaps, unknown: plan.unknown };
  }

  /** صورة البطاقة (3D-40): لقطة 3/4 علوية من طاولة التقديم، WebP ≤ 150KB؛ null إن تعذّر (غلاف مولّد) */
  capturePhoto(): string | null {
    try {
      const keep = { p: this.camera.position.clone(), l: this.lookNow.clone(), yaw: this.yaw, pitch: this.pitch, t: this.camT };
      const plate = this.L.rest['plate_1'] ?? V3(-1.4, 0.93, 1.0);
      const inWorld = !!this.fp;
      if (inWorld) { this.hands?.setVisible(false); this.camera.position.set(plate.x + 0.42, plate.y + 0.5, plate.z + 0.55); this.camera.lookAt(plate.x, plate.y + 0.02, plate.z); }
      else { this.camera.position.set(-1.0, 1.55, 1.75); this.camera.lookAt(-1.4, 0.95, 1.0); }
      this.camera.updateMatrixWorld();
      this.renderer.render(this.scene, this.camera);
      const src = this.renderer.domElement;
      const out = document.createElement('canvas');
      out.width = 512;
      out.height = 717;
      const c = out.getContext('2d')!;
      const sw = src.height * (5 / 7);
      c.drawImage(src, (src.width - sw) / 2, 0, sw, src.height, 0, 0, 512, 717);
      let q = 0.82;
      let url = out.toDataURL('image/webp', q);
      while (url.length > 150_000 * 1.37 && q > 0.3) {
        q -= 0.12;
        url = out.toDataURL('image/webp', q);
      }
      if (this.fp) { this.hands?.setVisible(true); this.fp.apply(); }
      this.camera.position.copy(keep.p);
      this.lookNow.copy(keep.l);
      this.yaw = keep.yaw;
      this.pitch = keep.pitch;
      this.camT = keep.t;
      return url.startsWith('data:image/webp') ? url : null;
    } catch {
      return null;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.fp?.dispose();
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mm = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
      else mm?.dispose?.();
    });
    geoCache.forEach((g) => g.dispose());
    geoCache.clear();
    this.renderer.dispose();
  }
}

/** كشف WebGL2 (وإلا لوحة الإجراءات وحدها — A11Y-10) */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}
