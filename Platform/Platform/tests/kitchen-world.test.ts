// عالم المطبخ: تصادم اللاعب وفيزياء الأجسام (دوال نقية، قيم محسوبة بيدي لا بناتج الدالة نفسها).
import { describe, expect, it } from 'vitest';
import { resolveCircle, stepBody, supportHeight, type Aabb, type Body } from '../web/src/kitchen/cook/world/collision.js';

const room = { minX: -4, maxX: 4, minZ: -3.2, maxZ: 3.2 };
const island: Aabb = { minX: -1.6, maxX: 1.0, minY: 0, maxY: 0.91, minZ: -0.9, maxZ: 0.1, name: 'island' };

describe('تصادم اللاعب', () => {
  it('يبقى داخل الغرفة (الجدار 4 م مع نصف قطر 0.3)', () => {
    const r = resolveCircle(9, 0, 0.3, [], 0, 1.7, room);
    expect(r.x).toBeCloseTo(3.7, 6);
    const q = resolveCircle(0, -9, 0.3, [], 0, 1.7, room);
    expect(q.z).toBeCloseTo(-2.9, 6);
  });
  it('لا يخترق الجزيرة ويُدفع لأقرب وجه (انزلاق)', () => {
    // دخل 5 سم من الوجه الجنوبي (z=-0.9) عند x=0 ← يُدفع إلى z = -0.9 - 0.3
    const r = resolveCircle(0, -0.85, 0.3, [island], 0, 1.7, room);
    expect(r.hit).toBe('island');
    expect(r.z).toBeCloseTo(-1.2, 6);
    expect(r.x).toBeCloseTo(0, 6);
  });
  it('يتجاهل الأجسام الأعلى من الرأس والأدنى من القدم', () => {
    const lamp: Aabb = { minX: -1, maxX: 1, minY: 2.5, maxY: 3, minZ: -1, maxZ: 1 };
    expect(resolveCircle(0, 0, 0.3, [lamp], 0, 1.7, room).hit).toBeNull();
    const mat: Aabb = { minX: -1, maxX: 1, minY: 0, maxY: 0.02, minZ: -1, maxZ: 1 };
    expect(resolveCircle(0, 0, 0.3, [mat], 0.05, 1.7, room).hit).toBeNull();
  });
  it('زاوية الصندوق: الدفع شعاعي بمسافة نصف القطر بالضبط', () => {
    const r = resolveCircle(1.1, 0.2, 0.3, [island], 0, 1.7, room); // أقرب نقطة للصندوق (1.0, 0.1): بُعد 0.1414 < 0.3
    expect(Math.hypot(r.x - 1.0, r.z - 0.1)).toBeCloseTo(0.3, 6);
  });
});

describe('الفيزياء', () => {
  it('أعلى سطح تحت النقطة: سطح الجزيرة 0.91 لمن هو فوقه، والأرض 0 لمن خارجه', () => {
    expect(supportHeight(0, -0.4, 1.5, [island])).toBeCloseTo(0.91, 6);
    expect(supportHeight(2, 2, 1.5, [island])).toBe(0);
    expect(supportHeight(0, -0.4, 0.5, [island])).toBe(0); // تحت السطح: لا يرى سطحًا أعلى من yMax
  });
  it('سقوط من 1.41 م على سطح 0.91: زمن السقوط الحر √(2·0.5/9.81)=0.319 ث ثم يستقر على السطح', () => {
    const b: Body = { x: 0, y: 1.41, z: -0.4, vx: 0, vy: 0, vz: 0, r: 0.1, asleep: false };
    let t = 0, firstContact = -1;
    for (; t < 3; t += 1 / 120) { const landed = stepBody(b, 1 / 120, [island], room); if (firstContact < 0 && b.y <= 0.9101) firstContact = t; if (b.asleep) break; if (landed && b.asleep) break; }
    expect(firstContact).toBeGreaterThan(0.29); expect(firstContact).toBeLessThan(0.36);
    expect(b.y).toBeCloseTo(0.91, 3);
    expect(b.asleep).toBe(true);
  });
  it('المقذوف يرتطم بالجدار ولا يخرج من الغرفة', () => {
    const b: Body = { x: 3.0, y: 1.0, z: 0, vx: 8, vy: 0, vz: 0, r: 0.1, asleep: false };
    for (let i = 0; i < 600; i++) stepBody(b, 1 / 120, [], room);
    expect(b.x).toBeLessThanOrEqual(4);
  });
});
