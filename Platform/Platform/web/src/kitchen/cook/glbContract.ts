/**
 * عقد الأصول (3D-10): الشيفرة تعتمد أسماء العقد (nodes) والخصائص (extras/userData) لا أسماء الملفات،
 * فاستبدال المطبخ الإجرائي بملف GLB من بلندر أو SketchUp أو kernelCAD لا يغيّر سطرًا في المنطق.
 * هذا الملف يقرأ الشجرة فقط (بلا WebGL) فيُختبر في vitest.
 */
import type { Object3D } from 'three';

export interface Contract {
  /** مكوّن ← عقدة الحاوية على الرف */
  slots: Map<string, Object3D>;
  burners: Map<number, Object3D>;
  stations: Map<string, Object3D>;
  plates: Map<number, Object3D>;
  tools: Map<string, Object3D>;
  equipment: Map<string, Object3D>;
  drops: Map<string, Object3D>;
  board: Object3D | null;
  scale: Object3D | null;
  /** عقد مخالفة للاتفاقية (للتقرير) */
  unknown: string[];
}

const RE = {
  slot: /^slot_ing_([a-z0-9_]+)$/,
  burner: /^burner_([1-4])$/,
  station: /^cam_station_([a-z_]+)$/,
  plate: /^plate_(\d+)$/,
  tool: /^tool_([a-z0-9_]+)$/,
  equip: /^equip_([a-z0-9_]+)$/,
  drop: /^drop_([a-z0-9_]+)$/,
  shelf: /^shelf_[a-z0-9_]+$/,
  col: /^col_[a-z0-9_]+$/,
};
export const KITCHEN_STATIONS = ['shelves', 'equipment', 'tools', 'prep', 'stove', 'sink', 'serve'] as const;

export function indexContract(root: Object3D, known: ReadonlySet<string>): Contract {
  const c: Contract = { slots: new Map(), burners: new Map(), stations: new Map(), plates: new Map(), tools: new Map(), equipment: new Map(), drops: new Map(), board: null, scale: null, unknown: [] };
  root.traverse((o) => {
    const n = o.name;
    if (!n) return;
    let m: RegExpExecArray | null;
    if ((m = RE.slot.exec(n))) {
      if (known.has(m[1]!)) c.slots.set(m[1]!, o);
      else c.unknown.push(`${n}: مكوّن خارج القائمة المقفلة`);
    } else if ((m = RE.burner.exec(n))) c.burners.set(Number(m[1]), o);
    else if ((m = RE.station.exec(n))) c.stations.set(m[1]!, o);
    else if ((m = RE.plate.exec(n))) c.plates.set(Number(m[1]), o);
    else if ((m = RE.tool.exec(n))) c.tools.set(m[1]!, o);
    else if ((m = RE.equip.exec(n))) c.equipment.set(m[1]!, o);
    else if ((m = RE.drop.exec(n))) c.drops.set(m[1]!, o);
    else if (n === 'board_main') c.board = o;
    else if (n === 'scale_main') c.scale = o;
    else if (/^(slot_|burner_|cam_|plate_|tool_|equip_|drop_)/.test(n)) c.unknown.push(`${n}: اسم لا يطابق الاتفاقية`);
  });
  return c;
}

/** فحص الاكتمال: كل مكوّن له خانة، 4 مواقد، والمحطات السبع */
export function contractGaps(c: Contract, ingredients: readonly string[]): string[] {
  const gaps: string[] = [];
  for (const i of ingredients) if (!c.slots.has(i)) gaps.push(`slot_ing_${i}`);
  for (const b of [1, 2, 3, 4]) if (!c.burners.has(b)) gaps.push(`burner_${b}`);
  for (const s of KITCHEN_STATIONS) if (!c.stations.has(s)) gaps.push(`cam_station_${s}`);
  if (!c.board) gaps.push('board_main');
  return gaps;
}
