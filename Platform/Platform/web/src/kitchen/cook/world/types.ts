/** عقد الواجهة بين عالم اللعبة (Scene3D/Game) وصفحة الطبخ: لا يستورد three فيُستورد من الصفحة دون تحميل المشهد */
import type { OpIn } from '../../../../../shared/kitchen/sim/host.js';

export type { OpIn };

export interface GameHost {
  /** يأخذ مكوّنًا (عملية take) ويعيد معرّف العنصر؛ null عند الرفض (نقص مخزن…) والسبب يُعلَن عبر say */
  take(slug: string, grams: number): Promise<string | null>;
  /** أي عملية محاكاة؛ true عند النجاح */
  op(op: OpIn, okMsg?: string): Promise<boolean>;
  /** الكمية المضبوطة لمكوّن (غرام) */
  quantity(slug: string): number;
  /** يفتح قائمة الكمية داخل اللعبة */
  askQuantity(slug: string): void;
  /** رسالة داخل اللعبة */
  say(msg: string, tone?: 'ok' | 'warn' | 'err'): void;
  /** يفتح تقديم الطبق (بطاقة الوصفة) */
  serve(): void;
}

/** حالة تُعرض فوق المشهد (تُرسل بمعدّل ≈10 مرات/ث عند تغيّرها) */
export interface GameHud {
  left: string;
  right: string;
  hint: string;
  /** تقدّم الفعل الجاري (قطع/تقشير…) 0..1 أو null */
  progress: number | null;
  /** أسلوب القطع المحدد (عند حمل السكين) */
  cut: string;
  toaster: number;
}
export const EMPTY_HUD: GameHud = { left: '', right: '', hint: '', progress: null, cut: '', toaster: 2 };
