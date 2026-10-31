// حزمة أوعية المطبخ (K-M8): مصدر kernelCAD الذي ولّد GLB بالأسماء المتفق عليها (عقد 3D-10).
// المقاييس بالمليمتر (Z لأعلى) والقاعدة عند z=0؛ المحمِّل يكتشف المليمتر ويحوّله إلى متر تلقائيًا (kitApply.detectUnit).
// التشغيل عند المالك: kernelcad export glb tools/kernelcad/kitchen-kit.kcad.ts -o web/public/kitchen/models/kitchen-kit.glb  (خيار axis: 'y-up')
// ثم: node tools/assets/optimize.mjs  لحساب البصمة وتحديث assets.manifest.json (يضبط delivered=true).
const kit = assembly('kitchen_kit');

function vessel(r: number, h: number, wall: number, color: string) {
  const outer = cylinder(h, r);
  const inner = cylinder(h, r - wall).translate(0, 0, wall);
  return outer.subtract(inner).finish(color);
}
function handle(r: number, h: number, len: number) {
  return box(len, 16, 6).translate(r - 4, -8, h * 0.8).finish('plastic-glossy');
}

const pan = vessel(140, 50, 3, 'anodized-black').union(handle(140, 50, 150));
const potSmall = vessel(100, 100, 2.5, 'stainless').union(handle(100, 100, 80));
const potLarge = vessel(160, 180, 3, 'stainless').union(handle(160, 180, 90));
const pressure = vessel(150, 200, 4, 'aluminium-brushed').union(handle(150, 200, 90));
const bowl = vessel(130, 80, 4, 'plastic-glossy');
const plate = vessel(140, 20, 3, 'plastic-glossy');
const board = box(600, 420, 24).finish('paint-matte');

const names = ['equip_pan', 'equip_pot_small', 'equip_pot_large', 'equip_pressure_cooker', 'equip_bowl', 'plate_1', 'board_main'];
kit.part(names[0], pan);
kit.part(names[1], potSmall);
kit.part(names[2], potLarge);
kit.part(names[3], pressure);
kit.part(names[4], bowl);
kit.part(names[5], plate);
kit.part(names[6], board);
// الأجزاء مستقلة ومتراكبة عند الأصل عمدًا: المحمِّل يضع كل وعاء عند موضعه بالاسم (عقد 3D-10)، فنتجاهل تداخلها في فحص الآلية
const ignore: [string, string][] = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) ignore.push([names[i], names[j]]);
return kit.solvedModel({}, { ignore });
