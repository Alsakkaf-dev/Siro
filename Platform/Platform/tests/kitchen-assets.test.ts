// K-M8: AC-12 (كل أصل بترخيص)، ميزانيات PERF-20، وعقد GLB (3D-10) بملف GLB مولَّد برمجيًا (لا اعتماد على نتيجة الدالة نفسها: الأسماء من الاتفاقية المكتوبة).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Object3D } from 'three';
import { INGREDIENTS } from '../shared/kitchen/index.js';
import { contractGaps, indexContract } from '../web/src/kitchen/cook/glbContract.js';
import { detectUnit, KIT_VESSELS, planKit } from '../web/src/kitchen/cook/kitApply.js';

const ROOT = join(__dirname, '..');
const KIT_DIR = join(ROOT, 'web', 'public', 'kitchen');
type Asset = { id: string; kind: string; file: string; path: string; delivered: boolean; bytes: number | null; sha256: string | null; license?: string; source?: string };
const manifest = JSON.parse(readFileSync(join(KIT_DIR, 'assets.manifest.json'), 'utf8')) as { budgets: Record<string, number>; assets: Asset[]; procedural: { license: string } };
const ASSET_EXT = /\.(glb|gltf|ktx2|webp|png|jpe?g|avif|mp3|ogg|wav|hdr|exr)$/i;
const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

describe('AC-12: كل أصل في البيان بترخيص ومصدر', () => {
  it('كل أصل له ترخيص ومصدر ويظهر في CREDITS.md', () => {
    expect(manifest.assets.length).toBeGreaterThan(0);
    const credits = readFileSync(join(KIT_DIR, 'CREDITS.md'), 'utf8');
    for (const a of manifest.assets) {
      expect(a.license, `${a.id}: بلا ترخيص`).toMatch(/\S/);
      expect(a.source, `${a.id}: بلا مصدر`).toMatch(/\S/);
      expect(credits, `${a.id}: غائب عن CREDITS.md`).toContain(a.id);
    }
    expect(manifest.procedural.license).toMatch(/\S/);
  });
  it('كل ملف أصل على القرص مسجَّل في البيان وبصمته وحجمه صحيحان؛ المسلَّم له ملف', () => {
    const listed = new Map(manifest.assets.map((a) => [join(KIT_DIR, a.file).replace(/\\/g, '/'), a]));
    const onDisk = walk(KIT_DIR).filter((f) => ASSET_EXT.test(f)).map((f) => f.replace(/\\/g, '/'));
    for (const f of onDisk) expect(listed.has(f), `ملف بلا بيان/ترخيص: ${f}`).toBe(true);
    for (const a of manifest.assets) {
      const f = join(KIT_DIR, a.file);
      if (a.delivered) {
        expect(existsSync(f), `${a.id} مسلَّم بلا ملف`).toBe(true);
        expect(createHash('sha256').update(readFileSync(f)).digest('hex')).toBe(a.sha256);
        expect(statSync(f).size).toBe(a.bytes);
      } else expect(existsSync(f), `${a.id} غير مسلَّم لكن له ملف: شغّل optimize.mjs`).toBe(false);
      expect(a.path.startsWith('/kitchen/')).toBe(true);
    }
  });
});

describe('PERF-20: ميزانية الأصول 3D', () => {
  it('أرقام الميزانية في البيان مطابقة للمواصفة', () => {
    expect(manifest.budgets).toMatchObject({ sceneMaxBytes: 12 * 1024 * 1024, ingredientModelMaxBytes: 300 * 1024, ingredientTextureMaxPx: 1024, environmentTextureMaxPx: 2048, sceneMaxTriangles: 250_000, ingredientMaxTriangles: 5000, maxDrawCalls: 150 });
  });
  it('الأصول المسلَّمة ضمن الحجم: المشهد ≤ 12MB ونموذج المكوّن ≤ 300KB', () => {
    let total = 0;
    for (const a of manifest.assets.filter((x) => x.delivered)) {
      const sz = statSync(join(KIT_DIR, a.file)).size;
      total += sz;
      if (a.kind === 'ingredient') expect(sz, a.id).toBeLessThanOrEqual(manifest.budgets['ingredientModelMaxBytes']!);
    }
    expect(total).toBeLessThanOrEqual(manifest.budgets['sceneMaxBytes']!);
  });
  it('أدوات الأصول لا تُضاف إلى الاعتماديات (تُستدعى بـnpx)', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies?: Record<string, string> };
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(all.filter((n) => /gltf-transform|gltf-validator|draco|meshopt|ktx|basis/i.test(n))).toEqual([]);
    expect(all.filter((n) => /three/.test(n)).sort()).toEqual(['@types/three', 'three']);
  });
});

/* ───── مولّد GLB: عقد بأسماء الاتفاقية، وشبكة مثلث لكل عقدة معدّة ───── */
interface N { name: string; t?: [number, number, number]; mesh?: boolean }
function buildGlb(nodes: N[], size: number): ArrayBuffer {
  const pos = new Float32Array([0, 0, 0, size, 0, 0, 0, size, 0]);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes: nodes.map((n) => ({ name: n.name, ...(n.t ? { translation: n.t } : {}), ...(n.mesh ? { mesh: 0 } : {}) })),
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [size, size, 0] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.byteLength }],
    buffers: [{ byteLength: pos.byteLength }],
  };
  let js = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (js.length % 4)) % 4;
  js = new Uint8Array([...js, ...new Uint8Array(pad).fill(0x20)]);
  const total = 12 + 8 + js.length + 8 + pos.byteLength;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, js.length, true); dv.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(out, 20, js.length).set(js);
  const o = 20 + js.length;
  dv.setUint32(o, pos.byteLength, true); dv.setUint32(o + 4, 0x004e4942, true);
  new Uint8Array(out, o + 8, pos.byteLength).set(new Uint8Array(pos.buffer));
  return out;
}
const parse = (buf: ArrayBuffer): Promise<Object3D> => new Promise((ok, bad) => new GLTFLoader().parse(buf, '', (g) => ok(g.scene), bad));
const SLUGS = new Set(INGREDIENTS.map((i) => i.slug));
const STATIONS = ['shelves', 'equipment', 'tools', 'prep', 'stove', 'sink', 'serve'];
const fullKit = (): N[] => [
  ...INGREDIENTS.map((i) => ({ name: `slot_ing_${i.slug}` })),
  ...[1, 2, 3, 4].map((b) => ({ name: `burner_${b}` })),
  ...STATIONS.map((s) => ({ name: `cam_station_${s}` })),
  { name: 'board_main' }, { name: 'scale_main' },
  ...['pan', 'pot_small', 'pot_large', 'pressure_cooker', 'bowl'].map((e) => ({ name: `equip_${e}`, mesh: true })),
  { name: 'plate_1', mesh: true }, { name: 'tool_spatula', t: [1.3, 1.7, -2.2] as [number, number, number], mesh: true },
];

describe('عقد GLB (3D-10) بملف GLB مولَّد', () => {
  it('حزمة كاملة بالمتر: بلا نواقص ولا مخالفات، والوحدة 1', async () => {
    const root = await parse(buildGlb(fullKit(), 0.3));
    const c = indexContract(root, SLUGS);
    expect(c.slots.size).toBe(26);
    expect(contractGaps(c, [...SLUGS])).toEqual([]);
    expect(c.unknown).toEqual([]);
    const plan = planKit(root, SLUGS);
    expect(plan.unit).toBe(1);
    expect([...plan.vessels.keys()].sort()).toEqual([...KIT_VESSELS].sort());
    expect(plan.gaps).toEqual([]);
    expect([...plan.tools.keys()]).toEqual(['spatula']);
  });
  it('حزمة بالمليمتر (kernelCAD/SketchUp) تُكتشف وتُحوَّل إلى متر', async () => {
    const root = await parse(buildGlb(fullKit(), 300));
    expect(detectUnit(root)).toBe(0.001);
    expect(planKit(root, SLUGS).unit).toBe(0.001);
  });
  it('حزمة جزئية: النواقص تُسمّى (تبقى إجرائية) ولا ترمي', async () => {
    const root = await parse(buildGlb([{ name: 'equip_pan', mesh: true }, { name: 'plate_1', mesh: true }], 0.2));
    const plan = planKit(root, SLUGS);
    expect([...plan.vessels.keys()].sort()).toEqual(['pan', 'plate_1']);
    expect(plan.gaps).toEqual(['equip_pot_small', 'equip_pot_large', 'equip_pressure_cooker', 'equip_bowl']);
    expect(contractGaps(plan.contract, [...SLUGS]).length).toBeGreaterThan(26);
  });
  it('الأسماء المخالفة والمكوّن خارج الـ26 تُرصد ولا تُطبَّق', async () => {
    const root = await parse(buildGlb([{ name: 'slot_ing_avocado' }, { name: 'burner_5' }, { name: 'tool_' }, { name: 'equip_pan', mesh: true }], 0.2));
    const plan = planKit(root, SLUGS);
    expect(plan.contract.slots.size).toBe(0);
    expect(plan.unknown.length).toBe(3);
    expect(plan.unknown.join('|')).toContain('slot_ing_avocado');
    expect(plan.vessels.has('pan')).toBe(true);
  });
});
