/**
 * خطة تطبيق حزمة GLB على المشهد (K-M8، 3D-10): تقرأ الشجرة بالأسماء فقط (بلا WebGL) فتُختبر في vitest.
 * القاعدة: الاستبدال بأصول بلندر/SketchUp/kernelCAD لا يغيّر سطرًا في منطق المحاكاة؛ ما لا يوجد في الملف يبقى إجرائيًا.
 */
import { Box3, Vector3, type Object3D } from 'three';
import { indexContract, type Contract } from './glbContract.js';

/** أوعية المحاكاة التي يمكن للحزمة أن تستبدل شكلها (المعرّفات من REST في Scene3D) */
export const KIT_VESSELS = ['pan', 'pot_small', 'pot_large', 'pressure_cooker', 'bowl', 'plate_1'] as const;
export type KitVessel = (typeof KIT_VESSELS)[number];

export interface KitPlan {
  /** معامل التحويل إلى المتر: 0.001 إن كان الملف بالمليمتر (kernelCAD/SketchUp)، 1 إن كان بالمتر (بلندر) */
  unit: number;
  vessels: Map<KitVessel, Object3D>;
  tools: Map<string, Object3D>;
  contract: Contract;
  /** أسماء ناقصة لاكتمال المشهد (تُملأ بالإجرائي) */
  gaps: string[];
  unknown: string[];
}

/** حدّ يفصل المتر عن المليمتر: أي أبعاد قياسية لقدر ≤ 1 م، فإن زادت عن 20 فهي مليمترات */
export function detectUnit(root: Object3D): number {
  const size = new Box3().setFromObject(root).getSize(new Vector3());
  return Math.max(size.x, size.y, size.z) > 20 ? 0.001 : 1;
}

export function planKit(root: Object3D, knownIngredients: ReadonlySet<string>): KitPlan {
  const contract = indexContract(root, knownIngredients);
  root.updateMatrixWorld(true);
  const vessels = new Map<KitVessel, Object3D>();
  for (const id of KIT_VESSELS) {
    const node = id === 'plate_1' ? contract.plates.get(1) : contract.equipment.get(id);
    if (node) vessels.set(id, node);
  }
  const gaps = KIT_VESSELS.filter((v) => !vessels.has(v)).map((v) => (v === 'plate_1' ? 'plate_1' : `equip_${v}`));
  return { unit: detectUnit(root), vessels, tools: contract.tools, contract, gaps, unknown: contract.unknown };
}
