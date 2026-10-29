/**
 * تحميل GLB بلا روابط blob: (سياسة CSP للمنصة: connect-src 'self' / img-src 'self' data:).
 * GLTFLoader يحوّل صور bufferView إلى blob: ثم يجلبها (يُمنع)، فنستبدل مصدر الصورة بفكّها من البايتات مباشرة
 * (createImageBitmap من Blob محلي لا يمرّ بالشبكة؛ وللمتصفحات بلا دعمه صورة بـ data: المسموحة).
 */
import * as THREE from 'three';

export async function parseGlb(buf: ArrayBuffer): Promise<{ scene: THREE.Group }> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'), import('three/examples/jsm/libs/meshopt_decoder.module.js')]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.register((parser) => {
    const p = parser as unknown as { json: { images: { bufferView?: number; mimeType?: string; uri?: string }[] }; getDependency: (t: string, i: number) => Promise<ArrayBuffer>; loadImageSource: (i: number, l: unknown) => Promise<THREE.Texture> };
    const orig = p.loadImageSource.bind(p);
    p.loadImageSource = async (sourceIndex, l) => {
      const def = p.json.images[sourceIndex];
      if (!def || def.bufferView === undefined) return orig(sourceIndex, l);
      const bytes = await p.getDependency('bufferView', def.bufferView);
      const blob = new Blob([bytes], { type: def.mimeType ?? 'image/webp' });
      let tex: THREE.Texture;
      if (typeof createImageBitmap === 'function') {
        const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
        tex = new THREE.Texture(bmp);
      } else {
        const url = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => bad(r.error); r.readAsDataURL(blob); });
        const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
        tex = new THREE.Texture(img);
      }
      tex.needsUpdate = true;
      tex.userData['mimeType'] = def.mimeType;
      return tex;
    };
    return { name: 'SiroNoBlobImages' };
  });
  return new Promise((ok, bad) => loader.parse(buf, '', ok as (g: unknown) => void, bad));
}
