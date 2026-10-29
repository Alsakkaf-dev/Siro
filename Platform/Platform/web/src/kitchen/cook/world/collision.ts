/**
 * تصادم اللاعب والأجسام في عالم المطبخ (بلا WebGL فيُختبر في vitest): دائرة اللاعب على المستوى XZ ضد صناديق محاذية للمحاور (AABB)
 * وسقوط جسم نقطي على أعلى الأسطح تحته. كل الأبعاد بالمتر، Y لأعلى.
 */
export interface Aabb { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; name?: string }
export interface Bounds2 { minX: number; maxX: number; minZ: number; maxZ: number }

/** يدفع الدائرة (x,z,r) خارج كل صندوق يعترض ارتفاعها [y0,y1]؛ يعيد الموضع المصحَّح (انزلاق على الجدران) */
export function resolveCircle(x: number, z: number, r: number, boxes: readonly Aabb[], y0: number, y1: number, room: Bounds2): { x: number; z: number; hit: string | null } {
  let hit: string | null = null;
  x = Math.min(room.maxX - r, Math.max(room.minX + r, x));
  z = Math.min(room.maxZ - r, Math.max(room.minZ + r, z));
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const b of boxes) {
      if (b.maxY <= y0 || b.minY >= y1) continue;
      const cx = Math.min(b.maxX, Math.max(b.minX, x));
      const cz = Math.min(b.maxZ, Math.max(b.minZ, z));
      let dx = x - cx, dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      hit = b.name ?? 'box';
      if (d2 > 1e-10) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r; z = cz + (dz / d) * r;
      } else {
        // المركز داخل الصندوق: أقرب وجه
        const l = x - b.minX, rr = b.maxX - x, t = z - b.minZ, bb = b.maxZ - z;
        const m = Math.min(l, rr, t, bb);
        if (m === l) x = b.minX - r; else if (m === rr) x = b.maxX + r; else if (m === t) z = b.minZ - r; else z = b.maxZ + r;
      }
      moved = true;
    }
    if (!moved) break;
  }
  x = Math.min(room.maxX - r, Math.max(room.minX + r, x));
  z = Math.min(room.maxZ - r, Math.max(room.minZ + r, z));
  return { x, z, hit };
}

/** أعلى سطح تحت النقطة (x,z) لا يعلو عن yMax؛ الأرض 0 */
export function supportHeight(x: number, z: number, yMax: number, boxes: readonly Aabb[], margin = 0.0): number {
  let h = 0;
  for (const b of boxes) {
    if (x < b.minX - margin || x > b.maxX + margin || z < b.minZ - margin || z > b.maxZ + margin) continue;
    if (b.maxY <= yMax + 1e-6 && b.maxY > h) h = b.maxY;
  }
  return h;
}

export interface Body { x: number; y: number; z: number; vx: number; vy: number; vz: number; r: number; asleep: boolean }
export const GRAVITY = 9.81;

/** خطوة فيزياء لجسم كروي صغير (وعاء/أداة): جاذبية، ارتداد منخفض، احتكاك أرضي، اصطدام جانبي بالصناديق. يعيد true عند ملامسة سطح */
export function stepBody(b: Body, dt: number, boxes: readonly Aabb[], room: Bounds2, restitution = 0.25, friction = 6): boolean {
  if (b.asleep) return true;
  b.vy -= GRAVITY * dt;
  b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt;
  const side = resolveCircle(b.x, b.z, b.r, boxes, b.y + 0.02, b.y + 0.2, room);
  if (Math.abs(side.x - b.x) > 1e-9) b.vx *= -0.3;
  if (Math.abs(side.z - b.z) > 1e-9) b.vz *= -0.3;
  b.x = side.x; b.z = side.z;
  const floor = supportHeight(b.x, b.z, b.y + 0.05, boxes);
  let landed = false;
  if (b.y <= floor) {
    b.y = floor;
    if (b.vy < -0.6) b.vy = -b.vy * restitution; else b.vy = 0;
    const k = Math.max(0, 1 - friction * dt);
    b.vx *= k; b.vz *= k; landed = b.vy === 0;
    if (landed && Math.hypot(b.vx, b.vz) < 0.03) { b.vx = b.vz = 0; b.asleep = true; }
  }
  return landed;
}
